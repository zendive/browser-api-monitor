import type { TOnlineTimerMetrics } from '../../../wrapper/TimerWrapper.ts';
import { ESortOrder } from '../../../api/storage/storage.local.ts';

const SEMISORTING_FIELDS = ['calls', 'delay', 'online'];

// descending sort by `handler` field
function compareIfEqual<T>(field: keyof T, first: T, second: T) {
  if (SEMISORTING_FIELDS.includes(field as string)) {
    return second[<keyof T> 'handler'] > first[<keyof T> 'handler'] ? 1 : -1;
  } else {
    return 0;
  }
}

export function compareByFieldOrder<T>(field: keyof T, order: ESortOrder) {
  return function (first: T, second: T) {
    const a = first[field] || 0;
    const b = second[field] || 0;

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
