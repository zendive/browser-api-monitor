import { TraceUtil } from './TraceUtil.ts';
import type { IWorkerOptions } from '../WorkerWrapper.ts';
import type { ISharedWorkerOptions } from '../SharedWorkerWrapper.ts';
import { cloneObjectSafely } from '../../api/clone.ts';
import { NETWORK_STATE, READY_STATE } from '../../api/const.ts';

export function validHandler(handler: unknown): handler is number {
  return Number.isInteger(handler) && <number> handler > 0;
}

export function validTimerDelay(delay: unknown): delay is number {
  return delay === undefined || (Number.isFinite(delay) && <number> delay >= 0);
}

export const traceUtil = /*@__PURE__*/ new TraceUtil();

export function parseWorkerOptions(
  options?: WorkerOptions,
): IWorkerOptions {
  options ??= {};

  const type = options?.type ?? 'classic';
  let credentials = options?.credentials;

  // credentials ignored for classic type
  if (type === 'module') {
    credentials ??= 'same-origin';
  }

  return {
    type,
    credentials,
    name: options?.name,
  };
}

export function parseSharedWorkerOptions(
  options?: string | WorkerOptions,
): ISharedWorkerOptions {
  let name;
  let type: undefined | WorkerType;
  let credentials: undefined | RequestCredentials;
  let sameSiteCookies: ISharedWorkerOptions['sameSiteCookies'];
  let extendedLifetime: boolean | undefined;

  if (typeof options === 'string') {
    name = options;
    type = 'classic';
  } else {
    options ??= {};
    name = options?.name;
    type = options?.type ?? 'classic';
    credentials = options?.credentials;
    // credentials ignored for classic type
    if (type === 'module') {
      credentials ??= 'same-origin';
    }

    // @ts-expect-error: according to MDN, targeting Chrome only
    sameSiteCookies = options?.sameSiteCookies;
    // @ts-expect-error: fresh Chrome's v148 feat, default unknown
    extendedLifetime = options?.extendedLifetime;
  }

  return {
    name,
    type,
    credentials,
    sameSiteCookies,
    extendedLifetime,
  };
}

export function parseWorkerSpecifier(url: string | URL): string {
  url = String(url);

  // no protocol - assume it's relative to the origin
  if (!url.includes('://')) {
    try {
      url = new URL(url, globalThis.location.origin).toString();
    } catch (_ignore) {
      // ignore
    }
  }

  return url;
}

export function parseMediaFieldValue(prop: string, value: unknown): unknown {
  if ('networkState' === prop) {
    return `${value} - ${NETWORK_STATE[value as number]}`;
  } else if ('readyState' === prop) {
    return `${value} - ${READY_STATE[value as number]}`;
  } else if ('srcObject' === prop) {
    return value ? `${value}` : value;
  } else if ('mediaKeys' === prop) {
    // https://web.dev/articles/eme-basics
    return cloneObjectSafely(value);
  } else if (
    // for Chrome Browser
    value instanceof TimeRanges ||
    // for Chromium Browser
    String(value) === '[object TimeRanges]'
  ) {
    const ranges: string[] = [];
    const timeRanges = value as TimeRanges;

    for (let n = 0, N = timeRanges.length; n < N; n++) {
      ranges.push(
        `<${timeRanges.start(n).toFixed(3)} - ${timeRanges.end(n).toFixed(3)}>`,
      );
    }

    return ranges.join('');
  } else if (
    // for Chrome
    value instanceof TextTrackList ||
    // for Chromium
    String(value) === '[object TextTrackList]'
  ) {
    return (value as TextTrackList).length;
  } else if (value instanceof MediaError) {
    return `${value.code}/${value.message}`;
  } else if (Number.isNaN(value)) {
    return null;
  }

  return String(value);
}

export type TEventHandlerLinks = Map<
  /*aelKey*/ string,
  TEventHandlerLink
>;
type TEventHandlerLink = WeakMap<
  /*authored handler*/ EventListenerOrEventListenerObject,
  IEventHandlerRecord
>;
interface IEventHandlerRecord {
  aelTraceId: string;
  actualHandler: EventListener;
}

export function getEventHandlerLinksKey(
  type: string,
  options: undefined | boolean | AddEventListenerOptions,
) {
  const capture = (typeof options === 'boolean')
    ? options
    : (typeof options === 'object' && 'capture' in options &&
        typeof options.capture === 'boolean')
    ? options.capture
    : false;

  return `${type}/${capture}`;
}

export function atTheEventDetectAutoremove(
  link: TEventHandlerLink,
  listener: EventListenerOrEventListenerObject,
  options: undefined | boolean | AddEventListenerOptions,
  aelMethodMetric: { canceledCounter: number },
) {
  if (typeof options !== 'object') return;

  if (options.once) {
    link.delete(listener);
  }

  if (options.signal instanceof AbortSignal) {
    options.signal.addEventListener('abort', () => {
      link.delete(listener);
      aelMethodMetric.canceledCounter++;
    });
  }
}

export function isEventListenerObject(
  that: unknown,
): that is EventListenerObject {
  return (
    that !== null &&
    typeof that === 'object' &&
    'handleEvent' in that &&
    typeof that.handleEvent === 'function'
  );
}
