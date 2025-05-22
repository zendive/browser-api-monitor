import { afterEach, beforeEach, describe, test } from '@std/testing/bdd';
import { expect } from '@std/expect';
import './browserPolyfill.ts';
import {
  TAG_BAD_DELAY,
  TAG_BAD_HANDLER,
  TAG_DELAY_NOT_FOUND,
} from '../src/api/const.ts';
import { TraceUtil } from '../src/wrapper/shared/TraceUtil.ts';
import {
  ClearTimerFact,
  SetTimerFact,
  TimerWrapper,
} from '../src/wrapper/TimerWrapper.ts';
import { EvalWrapper } from '../src/wrapper/EvalWrapper.ts';
import { Fact } from '../src/wrapper/shared/Fact.ts';
import { wait } from '../src/api/time.ts';

describe('wrappers', () => {
  const traceUtil = new TraceUtil();
  const apiEval = new EvalWrapper(traceUtil);
  let apiTimer: TimerWrapper;

  beforeEach(() => {
    apiTimer = new TimerWrapper(traceUtil, apiEval);
    apiTimer.wrapSetTimeout();
    apiTimer.wrapClearTimeout();
    apiTimer.wrapSetInterval();
    apiTimer.wrapClearInterval();
  });

  afterEach(() => {
    apiEval.unwrap();
    apiTimer.unwrapSetTimeout();
    apiTimer.unwrapClearTimeout();
    apiTimer.unwrapSetInterval();
    apiTimer.unwrapClearInterval();
  });

  test('onlineTimers emptied after setTimeout expires', async () => {
    const DELAY = 5;
    const handler = globalThis.setTimeout(() => {}, DELAY);

    expect(apiTimer.onlineTimers.size).toBe(1);
    // typecasting handler to number since here its having NodeJS.Timeout type
    expect(apiTimer.onlineTimers.has(Number(handler))).toBe(true);

    await new Promise((resolve) => globalThis.setTimeout(resolve, 2 * DELAY));

    expect(apiTimer.onlineTimers.size).toBe(0);
  });

  test('setTimeoutHistory & clearTimeoutHistory - recorded', () => {
    expect(apiTimer.setTimeoutHistory.size).toBe(0);
    expect(apiTimer.clearTimeoutHistory.size).toBe(0);

    const handler = globalThis.setTimeout(() => {}, 1e3);

    expect(apiTimer.onlineTimers.size).toBe(1);
    globalThis.clearTimeout(handler);
    expect(apiTimer.onlineTimers.size).toBe(0);

    expect(apiTimer.clearTimeoutHistory.size).toBe(1);
    expect(apiTimer.setTimeoutHistory.size).toBe(1);
  });

  test('setTimeoutHistory - online/canceledByTraceId/selfTime handled after timer fired', async () => {
    const DELAY = 5;
    globalThis.setTimeout(() => {}, DELAY);

    const rec = Array.from(apiTimer.setTimeoutHistory.values())[0];
    expect(rec.online).toBe(1);
    expect(rec.canceledByTraceIds).toBe(null);

    await new Promise((resolve) => globalThis.setTimeout(resolve, 2 * DELAY));

    expect(rec.online).toBe(0);
    expect(rec.canceledByTraceIds).toBe(null);
    expect(rec.selfTime).not.toBeNull();
  });

  test('setTimeoutHistory - online/canceledByTraceId/selfTime handled after timer canceled', () => {
    function setTimeout_function(delay: number) {
      return Number(globalThis.setTimeout(() => {}, delay));
    }
    function cancelTimeout_first_function(handler: number) {
      globalThis.clearTimeout(handler);
    }
    function cancelTimeout_second_function(handler: number) {
      globalThis.clearTimeout(handler);
    }
    const DELAY = 5;

    [cancelTimeout_first_function, cancelTimeout_second_function].forEach(
      (cancelTimeout_function) => {
        const handler = setTimeout_function(DELAY); // <- same trace
        cancelTimeout_function(handler); // <- different traces
      },
    );

    const rec = Array.from(apiTimer.setTimeoutHistory.values())[0];

    expect(rec.online).toBe(0);
    expect(rec.selfTime).toBeNull();
    if (rec.canceledByTraceIds) {
      expect(rec.canceledByTraceIds.length).toBe(2);

      const clearHistory = Array.from(apiTimer.clearTimeoutHistory.values());
      rec.canceledByTraceIds.forEach((traceId) => {
        const found = clearHistory.find((rec) => rec.traceId === traceId);
        expect(found).toBeTruthy();
      });
    } else {
      expect(true).toBe(false);
    }
  });

  test('setTimeoutHistory - valid delay', () => {
    const DELAY = 123;
    const handler = globalThis.setTimeout(() => {}, DELAY);
    const rec = Array.from(apiTimer.setTimeoutHistory.values())[0];

    expect(rec.calls).toBe(1);
    expect(rec.delay).toBe(DELAY);
    expect(rec.trace.length).toBeGreaterThan(1);
    expect(rec.traceId.length).toBeGreaterThan(0);
    expect(Fact.check(rec.facts, SetTimerFact.BAD_DELAY)).toBe(false);
    expect(Fact.check(rec.facts, SetTimerFact.NOT_A_FUNCTION)).toBe(false);

    globalThis.clearTimeout(handler);
    expect(rec.selfTime).toBeNull();
  });

  test('setTimeoutHistory - invalid delay', () => {
    const BAD_DELAY = -1;
    globalThis.setTimeout(() => {}, BAD_DELAY);

    const rec = Array.from(apiTimer.setTimeoutHistory.values())[0];

    expect(rec.calls).toBe(1);
    expect(rec.delay).toBe(TAG_BAD_DELAY(BAD_DELAY));
    expect(Fact.check(rec.facts, SetTimerFact.BAD_DELAY)).toBe(true);
  });

  test('setTimeout - poling registers selfTime', async () => {
    await new Promise<void>((resolve) => {
      let called = 0;
      let handler: number;

      function poll() {
        called++;

        if (called > 3) {
          resolve();
        } else {
          handler && globalThis.clearTimeout(handler);
          handler = Number(globalThis.setTimeout(poll, 1));
        }
      }
      poll();
    });

    const recs = Array.from(apiTimer.setTimeoutHistory.values());
    expect(apiTimer.setTimeoutHistory.size).toBe(2);
    expect(recs[0].selfTime).not.toBeNull();
    expect(recs[0].calls).toBe(1);
    expect(recs[1].selfTime).not.toBeNull();
    expect(recs[1].calls).toBe(2);
  }, 1e3);

  test('clearTimeoutHistory - valid handler', () => {
    const handler = globalThis.setTimeout(() => {}, 1e3);
    globalThis.clearTimeout(handler);

    const rec = Array.from(apiTimer.clearTimeoutHistory.values())[0];

    expect(rec.handler).toBe(handler);
    expect(rec.delay).toBe(1e3);
    expect(Fact.check(rec.facts, ClearTimerFact.BAD_HANDLER)).toBe(false);
    expect(Fact.check(rec.facts, ClearTimerFact.NOT_FOUND)).toBe(false);
  });

  test('clearTimeoutHistory - non existent handler', () => {
    globalThis.clearTimeout(Number.MAX_SAFE_INTEGER);

    const rec = Array.from(apiTimer.clearTimeoutHistory.values())[0];

    expect(rec.delay).toBe(TAG_DELAY_NOT_FOUND);
    expect(Fact.check(rec.facts, ClearTimerFact.BAD_HANDLER)).toBe(false);
    expect(Fact.check(rec.facts, ClearTimerFact.NOT_FOUND)).toBe(true);
  });

  test('clearTimeoutHistory - invalid handler', () => {
    globalThis.clearTimeout(0);

    const rec = Array.from(apiTimer.clearTimeoutHistory.values())[0];

    expect(rec.delay).toBe(TAG_DELAY_NOT_FOUND);
    expect(rec.handler).toBe(TAG_BAD_HANDLER(0));
    expect(Fact.check(rec.facts, ClearTimerFact.BAD_HANDLER)).toBe(true);
    expect(Fact.check(rec.facts, ClearTimerFact.NOT_FOUND)).toBe(false);
  });

  test('setIntervalHistory & clearIntervalHistory - recorded', () => {
    expect(apiTimer.setIntervalHistory.size).toBe(0);
    expect(apiTimer.clearIntervalHistory.size).toBe(0);

    const handler = globalThis.setInterval(() => {}, 123);
    expect(apiTimer.onlineTimers.size).toBe(1);
    globalThis.clearInterval(handler);

    expect(apiTimer.onlineTimers.size).toBe(0);
    expect(apiTimer.clearIntervalHistory.size).toBe(1);
    expect(apiTimer.setIntervalHistory.size).toBe(1);
  });

  test('setIntervalHistory - online becomes false after interval canceled', () => {
    const DELAY = 123;
    const handler = globalThis.setInterval(() => {}, DELAY);
    const rec = Array.from(apiTimer.setIntervalHistory.values())[0];

    expect(rec.online).toBe(1);
    globalThis.clearInterval(handler);
    expect(rec.online).toBe(0);
  });

  test('setIntervalHistory - valid delay', async () => {
    const DELAY = 123;
    const handler = await new Promise<number>((resolve) => {
      const handler = globalThis.setInterval(() => {
        resolve(Number(handler));
      }, DELAY);
    });
    const rec = Array.from(apiTimer.setIntervalHistory.values())[0];

    expect(rec.calls).toBe(1);
    expect(rec.delay).toBe(DELAY);
    expect(rec.trace.length).toBeGreaterThan(1);
    expect(rec.traceId.length).toBeGreaterThan(0);
    expect(rec.selfTime).not.toBeNull();
    expect(Fact.check(rec.facts, SetTimerFact.BAD_DELAY)).toBe(false);
    expect(Fact.check(rec.facts, SetTimerFact.NOT_A_FUNCTION)).toBe(false);

    globalThis.clearInterval(handler);
  });

  test('setIntervalHistory - invalid delay', () => {
    const handler = globalThis.setInterval(() => {}, -1);
    const rec = Array.from(apiTimer.setIntervalHistory.values())[0];

    expect(rec.calls).toBe(1);
    expect(rec.delay).toBe(TAG_BAD_DELAY('-1'));
    expect(Fact.check(rec.facts, SetTimerFact.BAD_DELAY)).toBe(true);
    expect(Fact.check(rec.facts, SetTimerFact.NOT_A_FUNCTION)).toBe(false);

    globalThis.clearInterval(handler);
  });

  test('clearIntervalHistory - valid handler', () => {
    const handler = globalThis.setInterval(() => {}, 1e3);
    globalThis.clearInterval(handler);

    const rec = Array.from(apiTimer.clearIntervalHistory.values())[0];

    expect(rec.delay).toBe(1e3);
    expect(Fact.check(rec.facts, ClearTimerFact.BAD_HANDLER)).toBe(false);
  });

  test('clearIntervalHistory - non existent handler', () => {
    globalThis.clearInterval(1000);

    const rec = Array.from(apiTimer.clearIntervalHistory.values())[0];

    expect(rec.delay).toBe(TAG_DELAY_NOT_FOUND);
    expect(Fact.check(rec.facts, ClearTimerFact.BAD_HANDLER)).toBe(false);
    expect(Fact.check(rec.facts, ClearTimerFact.NOT_FOUND)).toBe(true);
  });

  test('clearIntervalHistory - invalid handler', () => {
    globalThis.clearInterval(0);

    const rec = Array.from(apiTimer.clearIntervalHistory.values())[0];

    expect(rec.delay).toBe(TAG_DELAY_NOT_FOUND);
    expect(Fact.check(rec.facts, ClearTimerFact.BAD_HANDLER)).toBe(true);
    expect(Fact.check(rec.facts, ClearTimerFact.NOT_FOUND)).toBe(false);
  });
});

await wait(1e1);
