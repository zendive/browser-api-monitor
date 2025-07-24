import { afterEach, describe, test } from '@std/testing/bdd';
import { expect } from '@std/expect';
import './browserPolyfill.ts';
import {
  ApiMonitorWorkerWrapper,
  collectWorkerHistory,
  forTest_clearWorkerHistory,
  HARDWARE_CONCURRENCY,
  WorkerAELFact,
  WorkerFact,
  WorkerRELFact,
} from '../src/wrapper/WorkerWrapper.ts';

const codeBlob = URL.createObjectURL(
  new Blob([`
  self.onmessage = (e) => {
    self.postMessage('acknowledge');
  }
`], { type: 'text/javascript' }),
);

function NewWorker() {
  return new ApiMonitorWorkerWrapper(codeBlob, { type: 'module' });
}
function listener() {/*noop*/}
function getMetric() {
  return collectWorkerHistory({
    visible: true,
    key: 'callsSummary',
    label: '',
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

  afterEach(() => {
    forTest_clearWorkerHistory();
  });

  test('instance facts', () => {
    for (let n = 0, N = HARDWARE_CONCURRENCY + 1; n < N; n++) {
      NewWorker();
    }

    expect(getMetric().facts).toBe(WorkerFact.MAX_ONLINE);
  });

  test('aEL facts', () => {
    w = NewWorker();

    for (let n = 0, N = 2; n < N; n++) {
      w.addEventListener('message', listener);
    }

    expect(getAELFact()).toBe(WorkerAELFact.DUPLICATE_ADDITION);
  });

  test('rEL facts', () => {
    w = NewWorker();
    w.removeEventListener('message', listener);

    expect(getRELFact()).toBe(WorkerRELFact.NOT_FOUND);
  });
});
