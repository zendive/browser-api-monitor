import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { Wrapper } from '../../src/api/wrappers.ts';
import { TAG_EXCEPTION, TAG_UNDEFINED } from '../../src/api/clone.ts';

describe('wrappers', () => {
  let wrapper: Wrapper;

  beforeEach(() => {
    wrapper = new Wrapper();
    wrapper.wrapApis();
  });

  afterEach(() => {
    wrapper.unwrapApis();
    wrapper.cleanHistory();
  });

  test('onlineTimers emptied after setTimeout expires', () => {
    return new Promise<void>((resolve) => {
      const DELAY = 5;
      const handler = setTimeout(() => {}, DELAY);

      // typecasting handler to number since here its having NodeJS.Timeout type
      expect(wrapper.onlineTimers.size).toBe(1);
      expect(wrapper.onlineTimers.has(Number(handler))).toBe(true);

      setTimeout(() => {
        expect(wrapper.onlineTimers.size).toBe(0);
        resolve();
      }, 2 * DELAY);
    });
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
    const rec = [...wrapper.setTimeoutHistory.values()][0];

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
    const rec = [...wrapper.setTimeoutHistory.values()][0];

    expect(rec.individualInvocations).toBe(1);
    expect(rec.handlerDelay).toBe(TAG_EXCEPTION('-1'));
    expect(rec.hasError).toBe(true);
    expect(rec.isEval).toBe(false);
  });

  test('clearTimeoutHistory - valid handler', () => {
    const handler = setTimeout(() => {}, 1e3);
    clearTimeout(handler);
    const rec = [...wrapper.clearTimeoutHistory.values()][0];
    expect(rec.handlerDelay).toBe(1e3);
  });

  test('clearTimeoutHistory - non existent handler', () => {
    clearTimeout(1000);
    const rec = [...wrapper.clearTimeoutHistory.values()][0];

    expect(rec.handlerDelay).toBe('N/A');
    expect(rec.hasError).toBe(false);
  });

  test('clearTimeoutHistory - invalid handler', () => {
    clearTimeout(0);

    const rec = [...wrapper.clearTimeoutHistory.values()][0];

    expect(rec.handlerDelay).toBe('N/A');
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
    const rec = [...wrapper.setIntervalHistory.values()][0];

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
    const rec = [...wrapper.setIntervalHistory.values()][0];

    expect(rec.individualInvocations).toBe(1);
    expect(rec.handlerDelay).toBe(TAG_EXCEPTION('-1'));
    expect(rec.hasError).toBe(true);
    expect(rec.isEval).toBe(false);

    clearInterval(handler);
  });

  test('clearIntervalHistory - valid handler', () => {
    const handler = setInterval(() => {}, 1e3);
    clearInterval(handler);
    const rec = [...wrapper.clearIntervalHistory.values()][0];

    expect(rec.handlerDelay).toBe(1e3);
  });

  test('clearIntervalHistory - non existent handler', () => {
    clearInterval(1000);

    const rec = [...wrapper.clearIntervalHistory.values()][0];
    expect(rec.handlerDelay).toBe('N/A');
    expect(rec.hasError).toBe(false);
  });

  test('clearIntervalHistory - invalid handler', () => {
    clearInterval(0);

    const rec = [...wrapper.clearIntervalHistory.values()][0];
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

    const rec = [...wrapper.evalHistory.values()][0];
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

    const rec = [...wrapper.evalHistory.values()][0];
    expect(rec.individualInvocations).toBe(1);
    expect(local_variable).toBe(0);
    expect(rec.usesLocalScope).toBe(true);
    expect(rec.returnedValue).toBe(TAG_UNDEFINED);
  });
});
