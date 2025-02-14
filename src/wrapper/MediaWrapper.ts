import { cloneObjectSafely } from '../api/clone';
import {
  FRAME_1of60,
  MEDIA_ELEMENT_EVENTS,
  MEDIA_ELEMENT_PROPS,
  MEDIA_ELEMENT_TOGGABLE_PROPS,
  NETWORK_STATE,
  READY_STATE,
} from '../api/const';

type TMediaModel = {
  el: HTMLMediaElement;
  metrics: TMediaMetrics;
  eventListener: (e: Event) => void;
};

export enum EMediaType {
  VIDEO,
  AUDIO,
}
export type TMediaMetrics = {
  mediaId: string;
  type: EMediaType;
  events: { [key: string]: number };
  props: { [key: string]: unknown };
};
export type TMediaTelemetry = {
  total: number;
  collection: TMediaMetrics[];
};
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
  mediaCollection: TMediaModel[] = [];

  #formatPropValue(prop: string, value: unknown): any {
    let rv: any = value;

    if ('networkState' === prop) {
      rv = `${value} - ${NETWORK_STATE[value as number]}`;
    } else if ('readyState' === prop) {
      rv = `${value} - ${READY_STATE[value as number]}`;
    } else if ('srcObject' === prop) {
      rv = value ? `${value}` : value;
    } else if ('mediaKeys' === prop) {
      // https://web.dev/articles/eme-basics
      rv = cloneObjectSafely(value);
    } else if (value instanceof TimeRanges) {
      rv = [];

      for (let n = 0, N = value.length; n < N; n++) {
        rv.push(`<${value.start(n).toFixed(3)} - ${value.end(n).toFixed(3)}>`);
      }

      rv = rv.join('');
    } else if (value instanceof TextTrackList) {
      rv = value.length;
    } else if (value instanceof MediaError) {
      rv = `${value.code}/${value.message}`;
    } else if (Number.isNaN(value)) {
      rv = null;
    }

    return rv;
  }

  #stopMonitorMedia(entry: TMediaModel) {
    for (const eventType of MEDIA_ELEMENT_EVENTS) {
      entry.el.removeEventListener(eventType, entry.eventListener);
    }
  }

  #startMonitorMedia(mediaId: string, el: HTMLMediaElement): TMediaModel {
    const events: TMediaMetrics['events'] = {};
    const props: TMediaMetrics['props'] = {};
    const rv = {
      el,
      metrics: {
        mediaId,
        type:
          el instanceof HTMLVideoElement ? EMediaType.VIDEO : EMediaType.AUDIO,
        events,
        props,
      },
      eventListener: function (this: typeof events, e: Event) {
        this[e.type]++;
      }.bind(events),
    };

    for (const event of MEDIA_ELEMENT_EVENTS) {
      events[event] = 0;
      el.addEventListener(event, rv.eventListener);
    }

    return rv;
  }

  meetMedia() {
    const els: NodeListOf<HTMLMediaElement> =
      document.querySelectorAll('video,audio');
    // farewell old
    for (const entry of this.mediaCollection) {
      let found = false;

      for (let i = 0, I = els.length; i < I; i++) {
        if (entry.el === els[i]) {
          found = true;
          break;
        }
      }

      if (!found) {
        this.#stopMonitorMedia(entry);
        this.mediaCollection = this.mediaCollection.filter(
          (v) => v.el !== entry.el
        );
      }
    }

    // meet new
    for (let i = 0, I = els.length; i < I; i++) {
      if (!els[i].dataset?.apiMon) {
        const id = crypto.randomUUID();
        els[i].dataset.apiMon = id;
        this.mediaCollection.push(this.#startMonitorMedia(id, els[i]));
      }
    }
  }

  collectMetrics(includeCollection: boolean): TMediaTelemetry {
    const rv: TMediaTelemetry = {
      total: this.mediaCollection.length,
      collection: [],
    };

    if (includeCollection) {
      rv.collection = this.mediaCollection.map((v) => {
        // refresh props metrics
        for (const prop of MEDIA_ELEMENT_PROPS) {
          if (prop in v.el) {
            v.metrics.props[prop] = this.#formatPropValue(
              prop,
              v.el[prop as keyof HTMLMediaElement]
            );
          }
        }
        return v.metrics;
      });
    }

    return rv;
  }

  runCommand(
    mediaId: string,
    cmd: TMediaCommand,
    property: keyof HTMLMediaElement | undefined
  ) {
    const mediaModel = this.mediaCollection.find(
      (model) => model.metrics.mediaId === mediaId
    );

    if (!mediaModel || !mediaModel.el || !document.contains(mediaModel.el)) {
      return;
    }

    if (cmd === 'log') {
      console.log(mediaModel.el);
    } else if (cmd === 'locate') {
      mediaModel.el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    } else if (cmd === 'load') {
      mediaModel.el.load();
    } else if (cmd === 'pause') {
      mediaModel.el.pause();
    } else if (cmd === 'play') {
      mediaModel.el.play().catch(() => {});
    } else if (cmd === 'frame-backward') {
      mediaModel.el.currentTime -= FRAME_1of60;
    } else if (cmd === 'frame-forward') {
      mediaModel.el.currentTime += FRAME_1of60;
    } else if (cmd === 'toggle-boolean' && typeof property === 'string') {
      if (MEDIA_ELEMENT_TOGGABLE_PROPS.has(property)) {
        // @ts-expect-error
        mediaModel.el[property] = !mediaModel.el[property];
      }
    } else if (cmd === 'slower') {
      mediaModel.el.playbackRate -= 0.1;
    } else if (cmd === 'faster') {
      mediaModel.el.playbackRate += 0.1;
    }
  }
}
