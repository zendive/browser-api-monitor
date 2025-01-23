import {
  FRAME_1of60,
  MEDIA_ELEMENT_EVENTS,
  MEDIA_ELEMENT_PROPS,
  MEDIA_ELEMENT_TOGGABLE_PROPS,
  NETWORK_STATE,
  READY_STATE,
} from './const.ts';
import type { TMsgMediaCommand } from './communication.ts';
import { cloneObjectSafely } from './clone.ts';

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

let mediaCollection: TMediaModel[] = [];

export function meetMedia(els: NodeListOf<HTMLMediaElement>) {
  // farewell old
  for (const entry of mediaCollection) {
    let found = false;

    for (let i = 0, I = els.length; i < I; i++) {
      if (entry.el === els[i]) {
        found = true;
        break;
      }
    }

    if (!found) {
      stopMonitorMedia(entry);
      mediaCollection = mediaCollection.filter((v) => v.el !== entry.el);
    }
  }

  // meet new
  for (let i = 0, I = els.length; i < I; i++) {
    if (!els[i].dataset?.apiMon) {
      const id = crypto.randomUUID();
      els[i].dataset.apiMon = id;
      mediaCollection.push(startMonitorMedia(id, els[i]));
    }
  }
}

export function collectMediaMetrics(
  includeCollection: boolean
): TMediaTelemetry {
  const rv: TMediaTelemetry = {
    total: mediaCollection.length,
    collection: [],
  };

  if (includeCollection) {
    rv.collection = mediaCollection.map((v) => {
      // refresh props metrics
      for (const prop of MEDIA_ELEMENT_PROPS) {
        if (prop in v.el) {
          v.metrics.props[prop] = formatPropValue(
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

export function doMediaCommand(
  mediaId: string,
  cmd: TMsgMediaCommand['cmd'],
  property: keyof HTMLMediaElement | undefined
) {
  const mediaModel = mediaCollection.find(
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

function formatPropValue(prop: string, value: unknown): any {
  let rv: any = value;

  if ('networkState' === prop) {
    rv = `${value} - ${NETWORK_STATE[value as number]}`;
  } else if ('readyState' === prop) {
    rv = `${value} - ${READY_STATE[value as number]}`;
  } else if ('srcObject' === prop) {
    rv = value ? `${value}` : value;
  } else if ('mediaKeys' === prop) {
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
  }

  return rv;
}

function stopMonitorMedia(entry: TMediaModel) {
  for (const eventType of MEDIA_ELEMENT_EVENTS) {
    entry.el.removeEventListener(eventType, entry.eventListener);
  }
}

function startMonitorMedia(mediaId: string, el: HTMLMediaElement): TMediaModel {
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
