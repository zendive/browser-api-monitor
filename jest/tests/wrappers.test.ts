import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { Wrapper } from '../../src/api/wrappers.ts';
import { TAG_EXCEPTION, TAG_UNDEFINED } from '../../src/api/clone.ts';
import {
  DEFAULT_SETTINGS,
  panelsArrayToVisibilityMap,
} from '../../src/api/settings.ts';

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

    // typecasting handler to number since here its having NodeJS.Timeout type
    expect(wrapper.onlineTimers.size).toBe(1);
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

  test('setTimeoutHistory - valid delay', () => {
    const DELAY = 123;
    const handler = setTimeout(() => {}, DELAY);
    const rec = Array.from(wrapper.setTimeoutHistory.values())[0];

    expect(rec.individualInvocations).toBe(1);
    expect(rec.handlerDelay).toBe(DELAY);
    expect(rec.hasError).toBe(false);
    expect(rec.isEval).toBe(false);
    expect(rec.trace.length).toBeGreaterThan(1);
    expect(rec.traceId.length).toBeGreaterThan(0);

    clearTimeout(handler);
  });

  test('setTimeoutHistory - invalid delay', () => {
    setTimeout(() => {}, -1);

    const rec = Array.from(wrapper.setTimeoutHistory.values())[0];

    expect(rec.individualInvocations).toBe(1);
    expect(rec.handlerDelay).toBe(TAG_EXCEPTION('-1'));
    expect(rec.hasError).toBe(true);
    expect(rec.isEval).toBe(false);
  });

  test('clearTimeoutHistory - valid handler', () => {
    const handler = setTimeout(() => {}, 1e3);
    clearTimeout(handler);

    const rec = Array.from(wrapper.clearTimeoutHistory.values())[0];

    expect(rec.handlerDelay).toBe(1e3);
  });

  test('clearTimeoutHistory - non existent handler', () => {
    clearTimeout(Number.MAX_SAFE_INTEGER);

    const rec = Array.from(wrapper.clearTimeoutHistory.values())[0];

    expect(rec.handlerDelay).toBe('N/A');
    expect(rec.hasError).toBe(false);
  });

  test('clearTimeoutHistory - invalid handler', () => {
    clearTimeout(0);

    const rec = Array.from(wrapper.clearTimeoutHistory.values())[0];

    expect(rec.handlerDelay).toBe('N/A');
    expect(rec.recentHandler).toBe(TAG_EXCEPTION(0));
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

  test('setIntervalHistory - valid delay', () => {
    const DELAY = 123;
    const handler = setInterval(() => {}, DELAY);
    const rec = Array.from(wrapper.setIntervalHistory.values())[0];

    expect(rec.individualInvocations).toBe(1);
    expect(rec.handlerDelay).toBe(DELAY);
    expect(rec.hasError).toBe(false);
    expect(rec.isEval).toBe(false);
    expect(rec.trace.length).toBeGreaterThan(1);
    expect(rec.traceId.length).toBeGreaterThan(0);

    clearInterval(handler);
  });

  test('setIntervalHistory - invalid delay', () => {
    const handler = setInterval(() => {}, -1);
    const rec = Array.from(wrapper.setIntervalHistory.values())[0];

    expect(rec.individualInvocations).toBe(1);
    expect(rec.handlerDelay).toBe(TAG_EXCEPTION('-1'));
    expect(rec.hasError).toBe(true);
    expect(rec.isEval).toBe(false);

    clearInterval(handler);
  });

  test('clearIntervalHistory - valid handler', () => {
    const handler = setInterval(() => {}, 1e3);
    clearInterval(handler);

    const rec = Array.from(wrapper.clearIntervalHistory.values())[0];

    expect(rec.handlerDelay).toBe(1e3);
  });

  test('clearIntervalHistory - non existent handler', () => {
    clearInterval(1000);

    const rec = Array.from(wrapper.clearIntervalHistory.values())[0];

    expect(rec.handlerDelay).toBe('N/A');
    expect(rec.hasError).toBe(false);
  });

  test('clearIntervalHistory - invalid handler', () => {
    clearInterval(0);

    const rec = Array.from(wrapper.clearIntervalHistory.values())[0];

    expect(rec.handlerDelay).toBe('N/A');
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

    expect(rec.individualInvocations).toBe(NUMBER_OF_INVOCATIONS);
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

    expect(rec.individualInvocations).toBe(1);
    expect(local_variable).toBe(0);
    expect(rec.usesLocalScope).toBe(true);
    expect(rec.returnedValue).toBe(TAG_UNDEFINED);
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
    expect(rec.recentHandler).toBe(handler);
    expect(rec.individualInvocations).toBe(1);
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
    expect(rec.recentHandler).toBe(handler);
    expect(rec.individualInvocations).toBe(1);
    expect(rec.trace.length).toBeGreaterThan(1);
    expect(rec.traceId.length).toBeGreaterThan(1);
    expect(wrapper.callCounter.cancelAnimationFrame).toBe(1);
  });

  test('cafHistory - invalid handler', () => {
    cancelAnimationFrame(0);

    const rec = Array.from(wrapper.cafHistory?.values())[0];

    expect(rec.recentHandler).toBe(TAG_EXCEPTION(0));
  });
});
