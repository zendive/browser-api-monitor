import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  test,
} from '@std/testing/bdd';
import { expect, fn } from '@std/expect';
import './browserPolyfill.ts';
import {
  ApiMonitorWorkerWrapper,
  collectWorkerHistory,
  forTest_clearWorkerHistory,
  HARDWARE_CONCURRENCY,
  WorkerAelFact,
  WorkerFact,
  WorkerRelFact,
} from '../src/wrapper/WorkerWrapper.ts';
import { NOOP } from '../src/api/const.ts';
import { wait } from '../src/api/time.ts';

const workerInstances: Set<ApiMonitorWorkerWrapper> = new Set();
function NewWorker(codeBlob: string) {
  const w = new ApiMonitorWorkerWrapper(codeBlob, { type: 'module' });
  workerInstances.add(w);
  return w;
}
function getMetric() {
  return collectWorkerHistory({
    visible: true,
    key: 'worker',
    label: 'stub',
    wrap: true,
  }).collection[0];
}
function getAELFact() {
  return getMetric().ael[0].facts;
}
function getRELFact() {
  return getMetric().rel[0].facts;
}

describe('WorkerWrapper', () => {
  let w: ApiMonitorWorkerWrapper;
  let codeBlob: string;

  beforeAll(() => {
    codeBlob = URL.createObjectURL(
      new Blob([`
      self.onmessage = (e) => {
        self.postMessage(e.data);
      }
    `], { type: 'text/javascript' }),
    );
  });
  afterAll(() => {
    codeBlob && URL.revokeObjectURL(codeBlob);
    codeBlob = '';
  });

  afterEach(() => {
    forTest_clearWorkerHistory();
    workerInstances.forEach((w) => {
      w.terminate();
      workerInstances.delete(w);
    });
  });

  test('instance facts', () => {
    for (let n = 0, N = HARDWARE_CONCURRENCY + 1; n < N; n++) {
      NewWorker(codeBlob);
    }

    expect(getMetric().facts).toBe(WorkerFact.MAX_ONLINE);
  });

  test('aEL facts', () => {
    w = NewWorker(codeBlob);

    for (let n = 0, N = 2; n < N; n++) {
      w.addEventListener('message', NOOP);
    }

    expect(getAELFact()).toBe(WorkerAelFact.DUPLICATE_ADDITION);
  });

  test('aEL once', async () => {
    w = NewWorker(codeBlob);
    const mockFn = fn();

    // @ts-expect-error listener Deno signature uses Function
    w.addEventListener('message', mockFn, { once: true });
    w.postMessage(1);
    w.postMessage(2);

    await wait(100);
    expect(mockFn).toBeCalledTimes(1);
  });

  // test skipped because deno's worker (preserved for a future migration)
  // internal implementation of signal aborting
  // uses removeEventListener - Chrome do not
  // Worker extends from EventTarget:
  // - https://github.com/denoland/deno/blob/7aceb221c3ea2fdb4cbe86256c1d1a4475985f04/ext/node/polyfills/internal/event_target.mjs#L600
  test.skip('aEL abort signal', async () => {
    w = NewWorker(codeBlob);
    const mockFn = fn();
    const ac = new AbortController();

    // @ts-expect-error listener Deno signature uses Function
    w.addEventListener('message', mockFn, { signal: ac.signal });

    w.postMessage(1);
    await wait(100);
    expect(mockFn).toBeCalledTimes(1);

    ac.abort('test suite');
    expect(ac.signal.aborted).toBe(true);

    w.postMessage(2);
    await wait(100);
    expect(mockFn).toBeCalledTimes(1);
  });

  test('rEL facts', () => {
    w = NewWorker(codeBlob);
    w.removeEventListener('message', NOOP);

    expect(getRELFact()).toBe(WorkerRelFact.NOT_FOUND);
  });
});

// wait till `deno` internal pending timers drain
await wait(10);
