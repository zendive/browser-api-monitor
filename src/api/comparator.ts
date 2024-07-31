import type { TOnlineTimerMetrics } from '@/api/wrappers.ts';
import { ESortOrder, type ESortOrderKeys } from '@/api/settings.ts';

// descending sort by `handler` field
function compareIfEqual<T, Key extends keyof T>(
  field: Key,
  first: T,
  second: T
) {
  if (field === 'calls' || field === 'delay') {
    // @ts-ignore
    return second['handler'] > first['handler'] ? 1 : -1;
  } else {
    return 0;
  }
}

export function compareByFieldOrder<T, Key extends keyof T>(
  field: Key,
  order: ESortOrderKeys
) {
  return function (first: T, second: T) {
    let a = first[field] || 0;
    let b = second[field] || 0;

    if (
      (typeof a === 'number' && typeof b === 'number') ||
      (typeof a === 'string' && typeof b === 'string')
    ) {
      if (order === ESortOrder.DESCENDING) {
        return b > a ? 1 : b < a ? -1 : compareIfEqual(field, first, second);
      } else {
        return a > b ? 1 : a < b ? -1 : compareIfEqual(field, first, second);
      }
    } else {
      return typeof (order === ESortOrder.DESCENDING ? b : a) === 'number'
        ? -1
        : 1;
    }
  };
}

export function compareByDelayThenHandlerDescending<
  T extends TOnlineTimerMetrics,
>(a: T, b: T) {
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
