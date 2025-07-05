import { afterEach, beforeEach, describe, test } from '@std/testing/bdd';
import { expect } from '@std/expect';
import './browserPolyfill.ts';
import { CicFact, IdleWrapper, RicFact } from '../src/wrapper/IdleWrapper.ts';
import { TAG_BAD_DELAY, TAG_BAD_HANDLER } from '../src/api/const.ts';
import { Fact } from '../src/wrapper/shared/Fact.ts';
import { wait } from '../src/api/time.ts';

describe('IdleWrapper', () => {
  let apiIdle: IdleWrapper;

  beforeEach(() => {
    apiIdle = new IdleWrapper();
    apiIdle.wrapRequestIdleCallback();
    apiIdle.wrapCancelIdleCallback();
  });

  afterEach(() => {
    apiIdle.unwrapRequestIdleCallback();
    apiIdle.unwrapCancelIdleCallback();
  });

  test('ricHistory - recorded', async () => {
    let typeOfArgument = '';
    const handler = await new Promise((resolve) => {
      const handler = requestIdleCallback((o) => {
        typeOfArgument = typeof o.didTimeout;
        resolve(handler);
      });
    });
    const rec = Array.from(apiIdle.ricHistory.values())[0];

    expect(typeOfArgument).toBe('boolean');
    expect(apiIdle.ricHistory.size).toBe(1);
    expect(rec.handler).toBe(handler);
    expect(rec.calls).toBe(1);
    expect(rec.trace.length).toBeGreaterThan(1);
    expect(rec.traceId.length).toBeGreaterThan(1);
    expect(rec.selfTime).not.toBeNull();
    expect(apiIdle.callCounter.requestIdleCallback).toBe(1);
  });

  test('cicHistory - recorded', () => {
    const unchanged = 0,
      changed = 1;
    let changeable = unchanged;
    const handler = requestIdleCallback(() => {
      changeable = changed;
    });
    cancelIdleCallback(handler);

    const ricRec = Array.from(apiIdle.ricHistory.values())[0];
    const cicRec = Array.from(apiIdle.cicHistory.values())[0];

    expect(changeable).toBe(unchanged);
    expect(apiIdle.ricHistory.size).toBe(1);
    expect(apiIdle.cicHistory.size).toBe(1);
    expect(cicRec.handler).toBe(handler);
    expect(cicRec.calls).toBe(1);
    expect(cicRec.trace.length).toBeGreaterThan(1);
    expect(cicRec.traceId.length).toBeGreaterThan(1);
    expect(apiIdle.callCounter.cancelIdleCallback).toBe(1);
    expect(ricRec.canceledByTraceIds?.length).toBe(1);
    expect(ricRec.canceledCounter).toBe(1);
  });

  test('ricHistory - invalid delay', () => {
    const BAD_DELAY = -1;
    const handler = requestIdleCallback(() => {}, { timeout: BAD_DELAY });
    cancelIdleCallback(handler);

    const rec = Array.from(apiIdle.ricHistory?.values())[0];

    expect(rec.delay).toBe(TAG_BAD_DELAY(BAD_DELAY));
    expect(Fact.check(rec.facts, RicFact.BAD_DELAY)).toBe(true);
  });

  test('cicHistory - invalid handler', () => {
    const BAD_HANDLER = 0;
    cancelIdleCallback(BAD_HANDLER);

    const rec = Array.from(apiIdle.cicHistory?.values())[0];

    expect(rec.handler).toBe(TAG_BAD_HANDLER(BAD_HANDLER));
    expect(Fact.check(rec.facts, CicFact.BAD_HANDLER)).toBe(true);
  });

  test('cicHistory - ric not found', () => {
    cancelIdleCallback(404);

    const rec = Array.from(apiIdle.cicHistory?.values())[0];

    expect(Fact.check(rec.facts, CicFact.NOT_FOUND)).toBe(true);
  });
});

await wait(10);
