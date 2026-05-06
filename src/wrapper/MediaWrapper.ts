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
  | 'slower'
  | 'faster';

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

  runCommand(
    mediaId: string,
    cmd: TMediaCommand,
    property: keyof TMediaElement | undefined,
  ) {
    const model = this.#getModelByMediaId(mediaId);
    if (!model || !document.contains(model.el)) {
      return;
    }

    if (cmd === 'log') {
      console.log(model.el);
    } else if (cmd === 'locate') {
      model.el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    } else if (cmd === 'load') {
      model.el.load();
    } else if (cmd === 'pause') {
      model.el.pause();
    } else if (cmd === 'play') {
      model.el.play().catch(() => {});
    } else if (cmd === 'frame-backward') {
      model.el.currentTime -= TIME_60FPS_SEC;
    } else if (cmd === 'frame-forward') {
      model.el.currentTime += TIME_60FPS_SEC;
    } else if (cmd === 'toggle-boolean' && typeof property === 'string') {
      if (isMediaFieldWritable(property)) {
        model.el[property] = !model.el[property];
      }
    } else if (cmd === 'slower') {
      model.el.playbackRate -= 0.1;
    } else if (cmd === 'faster') {
      model.el.playbackRate += 0.1;
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
