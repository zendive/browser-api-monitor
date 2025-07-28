import { TraceUtil, type TTraceable } from './shared/TraceUtil.ts';
import type { TPanel } from '../api/storage/storage.local.ts';
import { traceUtil, validTimerDelay } from './shared/util.ts';
import { trim2ms } from '../api/time.ts';
import { Fact, type TFact } from './shared/Fact.ts';
import { TAG_BAD_DELAY } from '../api/const.ts';

export interface IYield extends TTraceable {
  calls: number;
}
export interface IPostTask extends TTraceable {
  calls: number;
  delay: number | undefined | string;
  priority: undefined | string;
  facts: TFact;
  selfTime: number | null;
  aborts: number;
  online: number;
}
type TPostTaskOptions = {
  priority?: 'user-blocking' | /*default*/ 'user-visible' | 'background';
  signal?: AbortSignal /*| TaskSignal*/;
  delay?: number;
};

export interface ISchedulerTelemetry {
  yield: IYield[] | null;
  postTask: IPostTask[] | null;
}

const nativeYield = globalThis.scheduler.yield.bind(
  globalThis.scheduler,
);
const nativePostTask = globalThis.scheduler.postTask.bind(
  globalThis.scheduler,
);
export const PostTaskFact = /*@__PURE__*/ (() => ({
  BAD_DELAY: Fact.define(1 << 0),
} as const))();
export const PostTaskFacts = /*@__PURE__*/ (() =>
  Fact.map([
    [PostTaskFact.BAD_DELAY, {
      tag: 'D',
      details: 'Delay is not a positive number or undefined',
    }],
  ]))();

export class SchedulerWrapper {
  #yieldMap: Map</*traceId*/ string, IYield> = new Map();
  #postTaskMap: Map</*traceId*/ string, IPostTask> = new Map();

  wrapYield() {
    globalThis.scheduler.yield = function (
      this: SchedulerWrapper,
      ...args: unknown[] // reserved for future compatibility, currently no parameters accepted
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = traceUtil.getCallstack(err);
      const methodMetric = this.#yieldMap.get(callstack.traceId);

      if (methodMetric) {
        methodMetric.calls++;
      } else {
        this.#yieldMap.set(callstack.traceId, {
          traceId: callstack.traceId,
          trace: callstack.trace,
          traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
          calls: 1,
        });
      }

      if (traceUtil.shouldPass(callstack.traceId)) {
        if (traceUtil.shouldPause(callstack.traceId)) {
          debugger;
        }
        return nativeYield(...args);
      }

      return Promise.resolve(); // in case of bypass
    }.bind(this);
  }

  wrapPostTask() {
    globalThis.scheduler.postTask = function (
      this: SchedulerWrapper,
      fn: () => unknown,
      options?: TPostTaskOptions,
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = traceUtil.getCallstack(err, fn);
      let methodMetric = this.#postTaskMap.get(callstack.traceId);
      const delay = options?.delay;
      let aborted = false;
      let finished = false;

      if (methodMetric) {
        methodMetric.calls++;
        methodMetric.delay = delay;
        methodMetric.priority = options?.priority;
        methodMetric.online++;
      } else {
        methodMetric = {
          traceId: callstack.traceId,
          trace: callstack.trace,
          traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
          calls: 1,
          delay,
          facts: <TFact> 0,
          selfTime: null,
          priority: options?.priority,
          aborts: 0,
          online: 1,
        };
        this.#postTaskMap.set(callstack.traceId, methodMetric);
      }

      if (validTimerDelay(methodMetric.delay)) {
        methodMetric.delay = trim2ms(delay);
      } else {
        methodMetric.delay = TAG_BAD_DELAY(methodMetric.delay);
        methodMetric.facts = Fact.assign(
          methodMetric.facts,
          PostTaskFact.BAD_DELAY,
        );
      }

      options?.signal?.addEventListener?.('abort', function listener() {
        options.signal?.removeEventListener('abort', listener);
        if (finished) {
          return;
        }

        aborted = true;
        methodMetric.aborts++;
        methodMetric.online--;
      });

      return nativePostTask(function () {
        const start = performance.now();

        if (traceUtil.shouldPass(callstack.traceId)) {
          if (traceUtil.shouldPause(callstack.traceId)) {
            debugger;
          }

          const rv = fn();
          methodMetric.selfTime = trim2ms(performance.now() - start);
          finished = true;
          if (!aborted) {
            methodMetric.online--;
          }
          return rv;
        }
      }, options);
    }.bind(this);
  }

  unwrapYield() {
    globalThis.scheduler.yield = nativeYield;
  }

  unwrapPostTask() {
    globalThis.scheduler.postTask = nativePostTask;
  }

  collectHistory(panel: TPanel): ISchedulerTelemetry {
    return {
      yield: panel.visible ? Array.from(this.#yieldMap.values()) : null,
      postTask: panel.visible ? Array.from(this.#postTaskMap.values()) : null,
    };
  }
}
