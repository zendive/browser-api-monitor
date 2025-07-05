import { afterEach, beforeEach, describe, test } from '@std/testing/bdd';
import { expect } from '@std/expect';
import './browserPolyfill.ts';
import { AnimationWrapper, CafFact } from '../src/wrapper/AnimationWrapper.ts';
import { TAG_BAD_HANDLER } from '../src/api/const.ts';
import { Fact } from '../src/wrapper/shared/Fact.ts';
import { wait } from '../src/api/time.ts';

describe('AnimationWrapper', () => {
  let apiAnimation: AnimationWrapper;

  beforeEach(() => {
    apiAnimation = new AnimationWrapper();
    apiAnimation.wrapRequestAnimationFrame();
    apiAnimation.wrapCancelAnimationFrame();
  });

  afterEach(() => {
    apiAnimation.unwrapRequestAnimationFrame();
    apiAnimation.unwrapCancelAnimationFrame();
  });

  test('rafHistory - recorded', async () => {
    let typeOfArgument = '';
    const handler = await new Promise((resolve) => {
      const handler = requestAnimationFrame((time) => {
        typeOfArgument = typeof time;
        resolve(handler);
      });
    });
    const rec = Array.from(apiAnimation.rafHistory.values())[0];

    expect(typeOfArgument).toBe('number');
    expect(apiAnimation.rafHistory.size).toBe(1);
    expect(rec.handler).toBe(handler);
    expect(rec.calls).toBe(1);
    expect(rec.trace.length).toBeGreaterThan(1);
    expect(rec.traceId.length).toBeGreaterThan(1);
    expect(rec.selfTime).not.toBeNull();
    expect(apiAnimation.callCounter.requestAnimationFrame).toBe(1);
  });

  test('cafHistory - recorded', () => {
    const unchanged = 0,
      changed = 1;
    let changeable = unchanged;
    const handler = requestAnimationFrame(() => {
      changeable = changed;
    });
    cancelAnimationFrame(handler);

    const rafRec = Array.from(apiAnimation.rafHistory.values())[0];
    const cafRec = Array.from(apiAnimation.cafHistory.values())[0];

    expect(changeable).toBe(unchanged);
    expect(apiAnimation.rafHistory.size).toBe(1);
    expect(apiAnimation.cafHistory.size).toBe(1);
    expect(cafRec.handler).toBe(handler);
    expect(cafRec.calls).toBe(1);
    expect(cafRec.trace.length).toBeGreaterThan(1);
    expect(cafRec.traceId.length).toBeGreaterThan(1);
    expect(apiAnimation.callCounter.cancelAnimationFrame).toBe(1);
    expect(rafRec.canceledByTraceIds?.length).toBe(1);
    expect(rafRec.canceledCounter).toBe(1);
  });

  test('cafHistory - invalid handler', () => {
    cancelAnimationFrame(0);

    const rec = Array.from(apiAnimation.cafHistory?.values())[0];

    expect(rec.handler).toBe(TAG_BAD_HANDLER(0));
    expect(Fact.check(rec.facts, CafFact.BAD_HANDLER)).toBe(true);
  });

  test('cafHistory - raf not found', () => {
    cancelAnimationFrame(404);

    const rec = Array.from(apiAnimation.cafHistory?.values())[0];

    expect(Fact.check(rec.facts, CafFact.NOT_FOUND)).toBe(true);
  });
});

await wait(10);
