import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  test,
} from '@std/testing/bdd';
import { expect } from '@std/expect';
import './browserPolyfill.ts';
import { WorkerAelFact, WorkerRelFact } from '../src/wrapper/WorkerWrapper.ts';
import { NOOP } from '../src/api/const.ts';
import { wait } from '../src/api/time.ts';
import {
  ApiMonitorSharedWorkerWrapper,
  collectSharedWorkerHistory,
  forTest_clearSharedWorkerHistory,
} from '../src/wrapper/SharedWorkerWrapper.ts';

function NewSharedWorker(codeBlob: string) {
  return new ApiMonitorSharedWorkerWrapper(codeBlob, { type: 'module' });
}
function getMetric() {
  return collectSharedWorkerHistory({
    visible: true,
    key: 'worker',
    label: 'stub',
    wrap: true,
  }).collection[0];
}
function getPortAelFact() {
  return getMetric().portAel[0].facts;
}
function getPortRelFact() {
  return getMetric().portRel[0].facts;
}

describe('WorkerWrapper', () => {
  let sw: ApiMonitorSharedWorkerWrapper;
  let codeBlob: string;

  beforeAll(() => {
    codeBlob = URL.createObjectURL(
      new Blob([`
      self.onmessage = (e) => {
        self.postMessage('acknowledge');
      }
    `], { type: 'text/javascript' }),
    );
  });
  afterAll(() => {
    codeBlob && URL.revokeObjectURL(codeBlob);
    codeBlob = '';
  });

  afterEach(() => {
    forTest_clearSharedWorkerHistory();
  });

  test('portAel facts', () => {
    sw = NewSharedWorker(codeBlob);

    for (let n = 0, N = 2; n < N; n++) {
      sw.port.addEventListener('message', NOOP);
    }

    expect(getPortAelFact()).toBe(WorkerAelFact.DUPLICATE_ADDITION);
  });

  test('port.Rel facts', () => {
    sw = NewSharedWorker(codeBlob);
    sw.port.removeEventListener('message', NOOP);

    expect(getPortRelFact()).toBe(WorkerRelFact.NOT_FOUND);
  });
});

// wait till `deno` internal pending timers drain
await wait(10);
