import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import {
  type IPostTask,
  type IYield,
  PostTaskFact,
  SchedulerWrapper,
} from '../src/wrapper/SchedulerWrapper.ts';
import type { IPanel } from '../src/api/storage/storage.local.ts';
import { NOOP } from '../src/api/const.ts';

let api: SchedulerWrapper;
const schedulerPanel: IPanel = {
  wrap: true,
  visible: true,
  key: 'scheduler',
  label: 'stub',
};

function getYieldMetrics(api: SchedulerWrapper): IYield {
  return api.collectHistory(schedulerPanel).yield?.[0]!;
}

function getPostTaskMetrics(api: SchedulerWrapper): IPostTask {
  return api.collectHistory(schedulerPanel).postTask?.[0]!;
}

describe('scheduler.yield', () => {
  beforeEach(() => {
    api = new SchedulerWrapper();
    api.wrapYield();
  });

  afterEach(() => {
    api.unwrapYield();
  });

  test('calls', async () => {
    await globalThis.scheduler.yield();
    const yRec = getYieldMetrics(api);

    expect(yRec.calls).toBe(1);
  });
});

describe('scheduler.postTask', () => {
  beforeEach(() => {
    api = new SchedulerWrapper();
    api.wrapPostTask();
  });

  afterEach(() => {
    api.unwrapPostTask();
  });

  test('facts', async () => {
    const BAD_DELAY = '0';
    await globalThis.scheduler.postTask(NOOP, {
      // @ts-expect-error: as expected
      delay: BAD_DELAY,
    }).catch(NOOP);

    const metric = getPostTaskMetrics(api);
    expect(metric.delay).toBe(BAD_DELAY);
    expect(metric.facts).toBe(PostTaskFact.BAD_DELAY);
  });

  test('aborts before run', () => {
    const controller = new AbortController();
    globalThis.scheduler.postTask(NOOP, {
      signal: controller.signal,
    }).catch(NOOP);
    controller.abort('aborted before run');

    const metric = getPostTaskMetrics(api);
    expect(metric.calls).toBe(1);
    expect(metric.aborts).toBe(1);
    expect(metric.selfTime).toBeNull();
  });

  test('aborts during run', async () => {
    const controller = new AbortController();
    await globalThis.scheduler.postTask(() => {
      controller.abort('aborted during run');
    }, {
      signal: controller.signal,
    }).catch(NOOP);

    const metric = getPostTaskMetrics(api);
    expect(metric.calls).toBe(1);
    expect(metric.aborts).toBe(1);
    expect(metric.selfTime).not.toBeNull();
  });

  test('aborts after run', async () => {
    const controller = new AbortController();
    await globalThis.scheduler.postTask(NOOP, {
      signal: controller.signal,
    }).catch(NOOP);
    controller.abort('aborted after run');

    const metric = getPostTaskMetrics(api);
    expect(metric.calls).toBe(1);
    expect(metric.aborts).toBe(0);
    expect(metric.selfTime).not.toBeNull();
  });
});
