import { TraceUtil } from './TraceUtil.ts';
import type { IWorkerOptions } from '../WorkerWrapper.ts';
import type { ISharedWorkerOptions } from '../SharedWorkerWrapper.ts';

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

  if (typeof options === 'string') {
    name = options;
    type = 'classic';
  } else {
    options ??= {};
    name = options?.name;
    type = options?.type ?? 'classic';
    credentials = options?.credentials;
    // @ts-expect-error: according to MDN, targeting Chrome only
    sameSiteCookies = options?.sameSiteCookies;

    // credentials ignored for classic type
    if (type === 'module') {
      credentials ??= 'same-origin';
    }
  }

  return {
    name,
    type,
    credentials,
    sameSiteCookies,
  };
}
