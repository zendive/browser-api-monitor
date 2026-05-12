import type { IMsgMediaCommand } from '../api/communication.ts';
import {
  isMediaFieldWritable,
  MEDIA_EVENTS,
  MEDIA_FIELDS,
  TIME_60FPS_SEC,
} from '../api/const.ts';
import type { IPanel } from '../api/storage/storage.local.ts';
import { parseMediaFieldValue } from './shared/util.ts';

type TMediaElement = HTMLVideoElement | HTMLAudioElement;
interface IMediaModel {
  el: TMediaElement;
  metrics: IMediaMetrics;
  eventListener: (e: Event) => void;
}

export enum EMediaType {
  VIDEO,
  AUDIO,
}
export interface IMediaMetrics {
  mediaId: string;
  firstSeen: number;
  type: EMediaType;
  events: { [key: string]: number };
  props: { [key: string]: unknown };
}
export interface IMediaTelemetry {
  total: number;
  collection: IMediaMetrics[];
}
export type TMediaCommand =
  | 'log'
  | 'frame-backward'
  | 'frame-forward'
  | 'pause'
  | 'play'
  | 'load'
  | 'locate'
  | 'toggle-boolean'
  | 'set-volume'
  | 'set-playbackRate';

export class MediaWrapper {
  #current: Set<TMediaElement> = new Set();
  #tracked: WeakMap<TMediaElement, IMediaModel> = new WeakMap();

  meetMedia(panel: IPanel) {
    if (!panel.visible) return;

    this.#current = new Set(
      // @ts-expect-error: intent
      document.querySelectorAll('video,audio') as Set<TMediaElement>,
    );

    this.#current.forEach((el) => {
      this.#tracked.getOrInsertComputed(
        el,
        (el) => this.#startMonitorMedia(el),
      );
    });
  }

  collectMetrics(panel: IPanel): IMediaTelemetry {
    const collection: IMediaMetrics[] = [];

    if (panel.visible) {
      this.#current.forEach((el) => {
        const model = this.#tracked.get(el);
        if (!model) return;

        this.#collectModelProps(model);
        collection.push(model.metrics);
      });
    }

    return {
      total: this.#current.size,
      collection,
    };
  }

  runCommand(o: IMsgMediaCommand) {
    const model = this.#getModelByMediaId(o.mediaId);
    if (!model || !document.contains(model.el)) {
      return;
    }

    if (o.cmd === 'log') {
      console.log(model.el);
    } else if (o.cmd === 'locate') {
      model.el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    } else if (o.cmd === 'load') {
      model.el.load();
    } else if (o.cmd === 'pause') {
      model.el.pause();
    } else if (o.cmd === 'play') {
      model.el.play().catch(() => {});
    } else if (o.cmd === 'frame-backward') {
      model.el.currentTime -= TIME_60FPS_SEC;
    } else if (o.cmd === 'frame-forward') {
      model.el.currentTime += TIME_60FPS_SEC;
    } else if (o.cmd === 'toggle-boolean' && typeof o.field === 'string') {
      if (isMediaFieldWritable(o.field)) {
        model.el[o.field] = !model.el[o.field];
      }
    } else if (
      o.cmd === 'set-volume' &&
      typeof (o.value) === 'number' &&
      Number.isFinite(o.value)
    ) {
      model.el.volume = o.value;
    } else if (
      o.cmd === 'set-playbackRate' &&
      typeof (o.value) === 'number' &&
      Number.isFinite(o.value)
    ) {
      model.el.playbackRate = o.value;
    }
  }

  #startMonitorMedia(el: TMediaElement): IMediaModel {
    const events: IMediaMetrics['events'] = {};
    const props: IMediaMetrics['props'] = {};
    const rv = {
      el,
      metrics: {
        mediaId: crypto.randomUUID(),
        firstSeen: performance.now(),
        type: el instanceof HTMLVideoElement
          ? EMediaType.VIDEO
          : EMediaType.AUDIO,
        events,
        props,
      },
      eventListener: function (this: typeof events, e: Event) {
        this[e.type]++;
      }.bind(events),
    };

    for (const event of MEDIA_EVENTS) {
      events[event] = 0;
      el.addEventListener(event, rv.eventListener);
    }

    return rv;
  }

  #collectModelProps(model: IMediaModel) {
    for (const prop of MEDIA_FIELDS) {
      if (prop in model.el) {
        model.metrics.props[prop] = parseMediaFieldValue(
          prop,
          model.el[prop as keyof TMediaElement],
        );
      }
    }
  }

  #getModelByMediaId(mediaId: string) {
    for (const el of this.#current) {
      const model = this.#tracked.get(el);

      if (model && model.metrics.mediaId === mediaId) {
        return model;
      }
    }
  }
}
