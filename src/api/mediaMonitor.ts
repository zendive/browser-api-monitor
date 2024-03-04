import { MEDIA_ELEMENT_EVENTS, MEDIA_ELEMENT_PROPS } from './const';

type TMediaModel = {
  el: HTMLMediaElement;
  metrics: TMediaMetrics;
  eventListener: (e: Event) => void;
};
export enum TMediaType {
  VIDEO = 0,
  AUDIO = 1,
}
export type TMediaMetrics = {
  mediaId: string;
  type: TMediaType;
  events: { [key: string]: number };
  props: { [key: string]: unknown };
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

export function collectMediaUsages(): TMediaMetrics[] {
  return mediaCollection.map((v) => {
    // refresh props metrics
    for (const prop of MEDIA_ELEMENT_PROPS) {
      v.metrics.props[prop] = formatPropValue(
        v.el[prop as keyof HTMLMediaElement]
      );
    }
    return v.metrics;
  });
}

function formatPropValue(value: unknown): any {
  let rv: any = value;

  if (value instanceof TimeRanges) {
    rv = [];

    for (let n = 0, N = value.length; n < N; n++) {
      rv.push(`[${value.start(n).toFixed(3)}:${value.end(n).toFixed(3)}]`);
    }

    rv = rv.join('');
  } else if (value instanceof TextTrackList) {
    rv = `[${value.length}]`;
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
        el instanceof HTMLVideoElement ? TMediaType.VIDEO : TMediaType.AUDIO,
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
