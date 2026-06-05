import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
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

  function workerAcknowledge(w: EventTarget) {
    return new Promise((resolve) => {
      w.addEventListener('message', resolve, { once: true });
    });
  }

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
    const mockFn = vi.fn();

    w.addEventListener('message', mockFn, { once: true });
    w.postMessage(1);
    w.postMessage(2);

    await wait(100);
    expect(mockFn).toHaveBeenCalledOnce();
  });

  test('aEL abort signal', async () => {
    w = NewWorker(codeBlob);
    const mockFn = vi.fn();
    const ac = new AbortController();

    w.addEventListener('message', mockFn, { signal: ac.signal });

    w.postMessage(1);
    await workerAcknowledge(w);
    expect(mockFn).toHaveBeenCalledOnce();

    ac.abort('test suite');
    expect(ac.signal.aborted).toBe(true);

    w.postMessage(2);
    await wait(100);
    expect(mockFn).toHaveBeenCalledOnce();
  });

  test('rEL facts', () => {
    w = NewWorker(codeBlob);
    w.removeEventListener('message', NOOP);

    expect(getRELFact()).toBe(WorkerRelFact.NOT_FOUND);
  });
});
