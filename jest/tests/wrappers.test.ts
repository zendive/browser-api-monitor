import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { Wrapper } from '../../src/api/wrappers.ts';
import { TAG_EXCEPTION, TAG_UNDEFINED } from '../../src/api/clone.ts';
import {
  TAG_EVAL_RETURN_SET_TIMEOUT,
  TAG_EVAL_RETURN_SET_INTERVAL,
  TRACE_ERROR_MESSAGE,
} from '../../src/api/const.ts';

describe('wrappers', () => {
  let wrapper: Wrapper;

  beforeEach(() => {
    wrapper = new Wrapper();
    wrapper.wrapApis();
  });

  afterEach(() => {
    wrapper.unwrapApis();
  });

  test('onlineTimers emptied after setTimeout expires', async () => {
    const DELAY = 5;
    const handler = setTimeout(() => {}, DELAY);

    expect(wrapper.onlineTimers.size).toBe(1);
    // typecasting handler to number since here its having NodeJS.Timeout type
    expect(wrapper.onlineTimers.has(Number(handler))).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 2 * DELAY));

    expect(wrapper.onlineTimers.size).toBe(0);
  });

  test('setTimeoutHistory & clearTimeoutHistory - recorded', () => {
    expect(wrapper.setTimeoutHistory.size).toBe(0);
    expect(wrapper.clearTimeoutHistory.size).toBe(0);

    const handler = setTimeout(() => {}, 123);
    expect(wrapper.onlineTimers.size).toBe(1);
    clearTimeout(handler);

    expect(wrapper.onlineTimers.size).toBe(0);
    expect(wrapper.clearTimeoutHistory.size).toBe(1);
    expect(wrapper.setTimeoutHistory.size).toBe(1);
  });

  test('setTimeoutHistory - isOnline/canceledByTraceId handled after timer fired', async () => {
    const DELAY = 5;
    setTimeout(() => {}, DELAY);

    const rec = Array.from(wrapper.setTimeoutHistory.values())[0];
    expect(rec.isOnline).toBe(true);
    expect(rec.canceledByTraceIds).toBe(null);

    await new Promise((resolve) => setTimeout(resolve, 2 * DELAY));

    expect(rec.isOnline).toBe(false);
    expect(rec.canceledByTraceIds).toBe(null);
  });

  test('setTimeoutHistory - isOnline/canceledByTraceId handled after timer canceled', () => {
    function setTimeout_function(delay: number) {
      return Number(setTimeout(() => {}, delay));
    }
    function cancelTimeout_first_function(handler: number) {
      clearTimeout(handler);
    }
    function cancelTimeout_second_function(handler: number) {
      clearTimeout(handler);
    }
    const DELAY = 5;

    [cancelTimeout_first_function, cancelTimeout_second_function].forEach(
      (cancelTimeout_function) => {
        const handler = setTimeout_function(DELAY); // <- same trace
        cancelTimeout_function(handler); // <- different traces
      }
    );

    const rec = Array.from(wrapper.setTimeoutHistory.values())[0];

    expect(rec.isOnline).toBe(false);
    if (rec.canceledByTraceIds) {
      expect(rec.canceledByTraceIds.length).toBe(2);

      const clearHistory = Array.from(wrapper.clearTimeoutHistory.values());
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
    const handler = setTimeout(() => {}, DELAY);
    const rec = Array.from(wrapper.setTimeoutHistory.values())[0];

    expect(rec.calls).toBe(1);
    expect(rec.delay).toBe(DELAY);
    expect(rec.hasError).toBe(false);
    expect(rec.isEval).toBe(false);
    expect(rec.trace.length).toBeGreaterThan(1);
    expect(rec.traceId.length).toBeGreaterThan(0);

    clearTimeout(handler);
  });

  test('setTimeoutHistory - invalid delay', () => {
    setTimeout(() => {}, -1);

    const rec = Array.from(wrapper.setTimeoutHistory.values())[0];

    expect(rec.calls).toBe(1);
    expect(rec.delay).toBe(TAG_EXCEPTION('-1'));
    expect(rec.hasError).toBe(true);
    expect(rec.isEval).toBe(false);
  });

  test('clearTimeoutHistory - valid handler', () => {
    const handler = setTimeout(() => {}, 1e3);
    clearTimeout(handler);

    const rec = Array.from(wrapper.clearTimeoutHistory.values())[0];

    expect(rec.delay).toBe(1e3);
  });

  test('clearTimeoutHistory - non existent handler', () => {
    clearTimeout(Number.MAX_SAFE_INTEGER);

    const rec = Array.from(wrapper.clearTimeoutHistory.values())[0];

    expect(rec.delay).toBe('N/A');
    expect(rec.hasError).toBe(false);
  });

  test('clearTimeoutHistory - invalid handler', () => {
    clearTimeout(0);

    const rec = Array.from(wrapper.clearTimeoutHistory.values())[0];

    expect(rec.delay).toBe('N/A');
    expect(rec.handler).toBe(TAG_EXCEPTION(0));
    expect(rec.hasError).toBe(true);
  });

  test('setIntervalHistory & clearIntervalHistory - recorded', () => {
    expect(wrapper.setIntervalHistory.size).toBe(0);
    expect(wrapper.clearIntervalHistory.size).toBe(0);

    const handler = setInterval(() => {}, 123);
    expect(wrapper.onlineTimers.size).toBe(1);
    clearInterval(handler);

    expect(wrapper.onlineTimers.size).toBe(0);
    expect(wrapper.clearIntervalHistory.size).toBe(1);
    expect(wrapper.setIntervalHistory.size).toBe(1);
  });

  test('setIntervalHistory - isOnline becomes false after interval canceled', () => {
    const DELAY = 123;
    const handler = setInterval(() => {}, DELAY);
    const rec = Array.from(wrapper.setIntervalHistory.values())[0];

    expect(rec.isOnline).toBe(true);
    clearInterval(handler);
    expect(rec.isOnline).toBe(false);
  });

  test('setIntervalHistory - valid delay', () => {
    const DELAY = 123;
    const handler = setInterval(() => {}, DELAY);
    const rec = Array.from(wrapper.setIntervalHistory.values())[0];

    expect(rec.calls).toBe(1);
    expect(rec.delay).toBe(DELAY);
    expect(rec.hasError).toBe(false);
    expect(rec.isEval).toBe(false);
    expect(rec.trace.length).toBeGreaterThan(1);
    expect(rec.traceId.length).toBeGreaterThan(0);

    clearInterval(handler);
  });

  test('setIntervalHistory - invalid delay', () => {
    const handler = setInterval(() => {}, -1);
    const rec = Array.from(wrapper.setIntervalHistory.values())[0];

    expect(rec.calls).toBe(1);
    expect(rec.delay).toBe(TAG_EXCEPTION('-1'));
    expect(rec.hasError).toBe(true);
    expect(rec.isEval).toBe(false);

    clearInterval(handler);
  });

  test('clearIntervalHistory - valid handler', () => {
    const handler = setInterval(() => {}, 1e3);
    clearInterval(handler);

    const rec = Array.from(wrapper.clearIntervalHistory.values())[0];

    expect(rec.delay).toBe(1e3);
  });

  test('clearIntervalHistory - non existent handler', () => {
    clearInterval(1000);

    const rec = Array.from(wrapper.clearIntervalHistory.values())[0];

    expect(rec.delay).toBe('N/A');
    expect(rec.hasError).toBe(false);
  });

  test('clearIntervalHistory - invalid handler', () => {
    clearInterval(0);

    const rec = Array.from(wrapper.clearIntervalHistory.values())[0];

    expect(rec.delay).toBe('N/A');
    expect(rec.hasError).toBe(true);
  });

  test('evalHistory - recorded', () => {
    const NUMBER_OF_INVOCATIONS = 2;
    const CODE = '(1+2)';
    const RESULT = 3;

    for (let i = 0, I = NUMBER_OF_INVOCATIONS; i < I; i++) {
      window.eval(CODE);
    }
    expect(wrapper.evalHistory.size).toBe(1);

    const rec = Array.from(wrapper.evalHistory.values())[0];

    expect(rec.calls).toBe(NUMBER_OF_INVOCATIONS);
    expect(rec.usesLocalScope).toBe(false);
    expect(rec.code).toBe(CODE);
    expect(rec.returnedValue).toBe(RESULT);
    expect(rec.trace.length).toBeGreaterThan(1);
    expect(rec.traceId.length).toBeGreaterThan(0);
  });

  test('evalHistory - detects local scope usage', () => {
    const local_variable = 0;
    window.eval('(local_variable++)');

    const rec = Array.from(wrapper.evalHistory.values())[0];

    expect(rec.calls).toBe(1);
    expect(local_variable).toBe(0);
    expect(rec.usesLocalScope).toBe(true);
    expect(rec.returnedValue).toBe(TAG_UNDEFINED);
  });

  test('setTimeoutHistory - isEval recorded', () => {
    const CODE = '(1+2)';
    setTimeout(CODE);
    const timerRec = Array.from(wrapper.setTimeoutHistory.values())[0];
    const evalRec = Array.from(wrapper.evalHistory.values())[0];

    expect(timerRec.isEval).toBe(true);
    expect(evalRec.code).toBe(CODE);
    expect(evalRec.returnedValue).toBe(TAG_EVAL_RETURN_SET_TIMEOUT);
  });

  test('setIntervalHistory - isEval recorded', () => {
    const CODE = '(1+2)';
    const handler = setInterval(CODE, 123);
    const timerRec = Array.from(wrapper.setIntervalHistory.values())[0];
    const evalRec = Array.from(wrapper.evalHistory.values())[0];

    expect(timerRec.isEval).toBe(true);
    expect(evalRec.code).toBe(CODE);
    expect(evalRec.returnedValue).toBe(TAG_EVAL_RETURN_SET_INTERVAL);

    clearInterval(handler);
  });

  test('rafHistory - recorded', async () => {
    let typeOfArgument = '';
    const handler = await new Promise((resolve) => {
      const handler = requestAnimationFrame((time) => {
        typeOfArgument = typeof time;
        resolve(handler);
      });
    });
    const rec = Array.from(wrapper.rafHistory.values())[0];

    expect(typeOfArgument).toBe('number');
    expect(wrapper.rafHistory.size).toBe(1);
    expect(rec.handler).toBe(handler);
    expect(rec.calls).toBe(1);
    expect(rec.trace.length).toBeGreaterThan(1);
    expect(rec.traceId.length).toBeGreaterThan(1);
    expect(wrapper.callCounter.requestAnimationFrame).toBe(1);
  });

  test('cafHistory - recorded', async () => {
    const unchanged = 0,
      changed = 1;
    let changeable = unchanged;
    const handler = requestAnimationFrame(() => {
      changeable = changed;
    });
    cancelAnimationFrame(handler);

    const rec = Array.from(wrapper.cafHistory.values())[0];

    expect(changeable).toBe(unchanged);
    expect(wrapper.rafHistory.size).toBe(1);
    expect(wrapper.cafHistory.size).toBe(1);
    expect(rec.handler).toBe(handler);
    expect(rec.calls).toBe(1);
    expect(rec.trace.length).toBeGreaterThan(1);
    expect(rec.traceId.length).toBeGreaterThan(1);
    expect(wrapper.callCounter.cancelAnimationFrame).toBe(1);
  });

  test('cafHistory - invalid handler', () => {
    cancelAnimationFrame(0);

    const rec = Array.from(wrapper.cafHistory?.values())[0];

    expect(rec.handler).toBe(TAG_EXCEPTION(0));
  });

  test('createCallstack', () => {
    const testStack = `Error: ${TRACE_ERROR_MESSAGE}
        at <anonymous>:1:1
        at async (<anonymous>:1:1)
        at call2 (async https://example.com/bundle1.js:11:17811)
        at call1 (https://example.com/bundle2.js:11:17811)`;
    const standard = [
      { name: 'call1', link: 'https://example.com/bundle2.js:11:17811' },
      { name: 'call2', link: 'https://example.com/bundle1.js:11:17811' },
    ];
    const { trace } = wrapper.createCallstack(
      <Error>{ stack: testStack },
      null
    );

    expect(trace[0].name).toBe(standard[0].name);
    expect(trace[0].link).toBe(standard[0].link);
    expect(trace[1].name).toBe(standard[1].name);
    expect(trace[1].link).toBe(standard[1].link);
  });
});
