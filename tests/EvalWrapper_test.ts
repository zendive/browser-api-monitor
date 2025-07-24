import { afterEach, beforeEach, describe, test } from '@std/testing/bdd';
import { expect } from '@std/expect';
import './browserPolyfill.ts';
import { EvalFact, EvalWrapper } from '../src/wrapper/EvalWrapper.ts';
import { SetTimerFact, TimerWrapper } from '../src/wrapper/TimerWrapper.ts';
import { TAG_UNDEFINED } from '../src/api/clone.ts';
import {
  TAG_EVAL_RETURN_SET_INTERVAL,
  TAG_EVAL_RETURN_SET_TIMEOUT,
} from '../src/api/const.ts';
import { Fact } from '../src/wrapper/shared/Fact.ts';
import { wait } from '../src/api/time.ts';

describe('EvalWrapper', () => {
  let apiEval: EvalWrapper;
  let apiTimer: TimerWrapper;

  beforeEach(() => {
    apiEval = new EvalWrapper();
    apiEval.wrap();
    apiTimer = new TimerWrapper(apiEval);
    apiTimer.wrapSetTimeout();
    apiTimer.wrapSetInterval();
  });

  afterEach(() => {
    apiEval.unwrap();
    apiTimer.unwrapSetTimeout();
    apiTimer.unwrapSetInterval();
  });

  test('eval - recorded', () => {
    const NUMBER_OF_INVOCATIONS = 2;
    const CODE = '(1+2)';
    const RESULT = 3;

    for (let i = 0, I = NUMBER_OF_INVOCATIONS; i < I; i++) {
      globalThis.eval(CODE);
    }
    expect(apiEval.evalHistory.size).toBe(1);

    const rec = Array.from(apiEval.evalHistory.values())[0];

    expect(rec.calls).toBe(NUMBER_OF_INVOCATIONS);
    expect(Fact.check(rec.facts, EvalFact.USES_GLOBAL_SCOPE)).toBe(true);
    expect(Fact.check(rec.facts, EvalFact.USES_LOCAL_SCOPE)).toBe(false);
    expect(rec.code).toBe(CODE);
    expect(rec.returnedValue).toBe(RESULT);
    expect(rec.trace.length).toBeGreaterThan(1);
    expect(rec.traceId.length).toBeGreaterThan(0);
    expect(rec.selfTime).not.toBeNull();
  });

  test('eval - detects local scope usage', () => {
    const local_variable = 0;
    globalThis.eval('(local_variable++)');

    const rec = Array.from(apiEval.evalHistory.values())[0];

    expect(rec.calls).toBe(1);
    expect(local_variable).toBe(0);
    expect(Fact.check(rec.facts, EvalFact.USES_GLOBAL_SCOPE)).toBe(true);
    expect(Fact.check(rec.facts, EvalFact.USES_LOCAL_SCOPE)).toBe(true);
    expect(rec.returnedValue).toBe(TAG_UNDEFINED);
  });

  test('setTimeout - isEval recorded', () => {
    const CODE = '(1+2)';
    setTimeout(CODE);
    const timerRec = Array.from(apiTimer.setTimeoutHistory.values())[0];
    const evalRec = Array.from(apiEval.evalHistory.values())[0];

    expect(Fact.check(timerRec.facts, SetTimerFact.NOT_A_FUNCTION)).toBe(true);
    expect(evalRec.code).toBe(CODE);
    expect(evalRec.returnedValue).toBe(TAG_EVAL_RETURN_SET_TIMEOUT);
  });

  test('setInterval - isEval recorded', () => {
    const CODE = '(1+2)';
    const handler = setInterval(CODE, 123);
    const timerRec = Array.from(apiTimer.setIntervalHistory.values())[0];
    const evalRec = Array.from(apiEval.evalHistory.values())[0];

    expect(Fact.check(timerRec.facts, SetTimerFact.NOT_A_FUNCTION)).toBe(true);
    expect(evalRec.code).toBe(CODE);
    expect(evalRec.returnedValue).toBe(TAG_EVAL_RETURN_SET_INTERVAL);

    clearInterval(handler);
  });
});

await wait(10);
