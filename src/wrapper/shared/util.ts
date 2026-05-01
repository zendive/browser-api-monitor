import { TraceUtil } from './TraceUtil.ts';
import type { IWorkerOptions } from '../WorkerWrapper.ts';

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
  // classic or module
  const type = options?.type ?? 'classic';
  // omit, same-origin, or include; ignored for classic
  let credentials = options?.credentials;

  if (type === 'module') {
    credentials ??= 'same-origin';
  }

  return {
    type,
    credentials,
    name: options?.name,
  };
}
