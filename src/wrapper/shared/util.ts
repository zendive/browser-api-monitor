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
  let rv: unknown = value;

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
    const ranges: string[] = [];

    for (let n = 0, N = value.length; n < N; n++) {
      ranges.push(
        `<${value.start(n).toFixed(3)} - ${value.end(n).toFixed(3)}>`,
      );
    }

    rv = ranges.join('');
  } else if (value instanceof TextTrackList) {
    rv = value.length;
  } else if (value instanceof MediaError) {
    rv = `${value.code}/${value.message}`;
  } else if (Number.isNaN(value)) {
    rv = null;
  }

  return rv;
}
