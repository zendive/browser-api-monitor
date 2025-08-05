import { afterEach, beforeEach, describe, test } from '@std/testing/bdd';
import { expect } from '@std/expect';
import './browserPolyfill.ts';
import {
  type IPostTask,
  type IYield,
  PostTaskFact,
  SchedulerWrapper,
} from '../src/wrapper/SchedulerWrapper.ts';

let api: SchedulerWrapper;
const schedulerPanel = {
  wrap: true,
  visible: true,
  key: 'scheduler',
  label: 'stub',
};

function getYieldMetrics(api: SchedulerWrapper): IYield {
  return api.collectHistory(schedulerPanel).yield?.[0];
}

function getPostTaskMetrics(api: SchedulerWrapper): IPostTask {
  return api.collectHistory(schedulerPanel).postTask?.[0];
}

function NOOP() {}

describe('scheduler.yield', {
  sanitizeOps: false,
  sanitizeResources: false,
}, () => {
  beforeEach(() => {
    api = new SchedulerWrapper();
    api.wrapYield();
  });

  afterEach(() => {
    api.unwrapYield();
  });

  test('calls', async () => {
    await globalThis.scheduler.yield();

    expect(getYieldMetrics(api).calls).toBe(1);
  });
});

describe('scheduler.postTask', {
  sanitizeOps: false,
  sanitizeResources: false,
}, () => {
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
