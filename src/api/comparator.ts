import type { TOnlineTimerMetrics } from '@/api/wrappers.ts';
import { ESortOrder } from '@/api/settings.ts';

export function compareByFieldOrder<T, Key extends keyof T>(
  field: Key,
  order: ESortOrder
) {
  return function (first: T, second: T) {
    const a = first[field];
    const b = second[field];

    if (a === undefined) {
      return ESortOrder.DESCENDING ? -1 : 1;
    } else if (b === undefined) {
      return ESortOrder.DESCENDING ? 1 : -1;
    }

    if (
      (typeof a === 'number' && typeof b === 'number') ||
      (typeof a === 'string' && typeof b === 'string')
    ) {
      return order === ESortOrder.DESCENDING
        ? b > a
          ? 1
          : b < a
            ? -1
            : 0
        : a > b
          ? 1
          : a < b
            ? -1
            : 0;
    } else {
      return typeof (ESortOrder.DESCENDING ? b : a) === 'number' ? -1 : 1;
    }
  };
}

export function compareByDelayHandlerDescending<T extends TOnlineTimerMetrics>(
  a: T,
  b: T
) {
  const aDelay = a.delay ?? 0;
  const bDelay = b.delay ?? 0;
  return bDelay > aDelay
    ? 1
    : bDelay < aDelay
      ? -1
      : b.handler > a.handler
        ? 1
        : -1;
}
