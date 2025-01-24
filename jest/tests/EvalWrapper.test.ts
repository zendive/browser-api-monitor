import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { EvalWrapper } from '../../src/wrapper/EvalWrapper.ts';
import { TimerWrapper } from '../../src/wrapper/TimerWrapper.ts';
import { TraceUtil } from '../../src/wrapper/TraceUtil.ts';
import { TAG_UNDEFINED } from '../../src/api/clone.ts';
import { TextEncoder } from 'node:util';
import {
  TAG_EVAL_RETURN_SET_INTERVAL,
  TAG_EVAL_RETURN_SET_TIMEOUT,
} from '../../src/api/const.ts';

global.TextEncoder = TextEncoder;

describe('EvalWrapper', () => {
  const traceUtil = new TraceUtil();
  let apiEval: EvalWrapper;
  let apiTimer: TimerWrapper;

  beforeEach(() => {
    apiEval = new EvalWrapper(traceUtil);
    apiEval.wrap();
    apiTimer = new TimerWrapper(traceUtil, apiEval);
    apiTimer.wrapSetTimeout();
    apiTimer.wrapSetInterval();
  });

  afterEach(() => {
    apiEval.unwrap();
    apiTimer.unwrapSetTimeout();
    apiTimer.unwrapSetInterval();
  });

  test('evalHistory - recorded', () => {
    const NUMBER_OF_INVOCATIONS = 2;
    const CODE = '(1+2)';
    const RESULT = 3;

    for (let i = 0, I = NUMBER_OF_INVOCATIONS; i < I; i++) {
      window.eval(CODE);
    }
    expect(apiEval.evalHistory.size).toBe(1);

    const rec = Array.from(apiEval.evalHistory.values())[0];

    expect(rec.calls).toBe(NUMBER_OF_INVOCATIONS);
    expect(rec.usesLocalScope).toBe(false);
    expect(rec.code).toBe(CODE);
    expect(rec.returnedValue).toBe(RESULT);
    expect(rec.trace.length).toBeGreaterThan(1);
    expect(rec.traceId.length).toBeGreaterThan(0);
    expect(rec.selfTime).not.toBeNull();
  });

  test('evalHistory - detects local scope usage', () => {
    const local_variable = 0;
    window.eval('(local_variable++)');

    const rec = Array.from(apiEval.evalHistory.values())[0];

    expect(rec.calls).toBe(1);
    expect(local_variable).toBe(0);
    expect(rec.usesLocalScope).toBe(true);
    expect(rec.returnedValue).toBe(TAG_UNDEFINED);
  });

  test('setTimeoutHistory - isEval recorded', () => {
    const CODE = '(1+2)';
    setTimeout(CODE);
    const timerRec = Array.from(apiTimer.setTimeoutHistory.values())[0];
    const evalRec = Array.from(apiEval.evalHistory.values())[0];

    expect(timerRec.isEval).toBe(true);
    expect(evalRec.code).toBe(CODE);
    expect(evalRec.returnedValue).toBe(TAG_EVAL_RETURN_SET_TIMEOUT);
  });

  test('setIntervalHistory - isEval recorded', () => {
    const CODE = '(1+2)';
    const handler = setInterval(CODE, 123);
    const timerRec = Array.from(apiTimer.setIntervalHistory.values())[0];
    const evalRec = Array.from(apiEval.evalHistory.values())[0];

    expect(timerRec.isEval).toBe(true);
    expect(evalRec.code).toBe(CODE);
    expect(evalRec.returnedValue).toBe(TAG_EVAL_RETURN_SET_INTERVAL);

    clearInterval(handler);
  });
});
