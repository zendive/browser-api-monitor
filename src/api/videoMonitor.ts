import { MEDIA_ELEMENT_EVENTS, MEDIA_ELEMENT_PROPS } from './const';

type TVideoEntry = {
  el: HTMLVideoElement;
  metrics: TVideoMetrics;
  eventListener: (e: Event) => void;
};
export type TVideoMetrics = {
  events: { [key: string]: number };
  props: { [key: string]: unknown };
};

let videos: TVideoEntry[] = [];

export function meetVideos(els: NodeListOf<HTMLVideoElement>) {
  // farewell old
  for (const entry of videos) {
    let found = false;

    for (const el of els) {
      if (entry.el === el) {
        found = true;
        break;
      }
    }

    if (!found) {
      stopMonitorVideo(entry);
      videos = videos.filter((v) => v.el !== entry.el);
    }
  }

  // meet new
  for (const el of els) {
    if (!el.dataset?.apiMon) {
      const id = crypto.randomUUID();
      el.dataset.apiMon = id;
      videos.push(startMonitorVideo(el));
    }
  }
}

export function collectVideosUsages(): TVideoMetrics[] {
  return videos.map((v) => {
    // refresh props metrics
    for (const prop of MEDIA_ELEMENT_PROPS) {
      v.metrics.props[prop] = formatPropValue(
        v.el[prop as keyof HTMLVideoElement]
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

function stopMonitorVideo(entry: TVideoEntry) {
  for (const eventType of MEDIA_ELEMENT_EVENTS) {
    entry.el.removeEventListener(eventType, entry.eventListener);
  }
}

function startMonitorVideo(el: HTMLVideoElement): TVideoEntry {
  const events: TVideoMetrics['events'] = {};
  const props: TVideoMetrics['props'] = {};
  const rv = {
    el,
    metrics: { events, props },
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
