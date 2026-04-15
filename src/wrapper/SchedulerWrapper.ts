import { type ITraceable, TraceUtil } from './shared/TraceUtil.ts';
import type { IPanel } from '../api/storage/storage.local.ts';
import { traceUtil, validTimerDelay } from './shared/util.ts';
import { trim2ms, type TTaskPriority } from '../api/time.ts';
import { Fact, type TFact } from './shared/Fact.ts';
import { nativePostTask, nativeYield, TAG_BAD_DELAY } from '../api/const.ts';

export interface IYield extends ITraceable {
  calls: number;
  cps: number;
}
export interface IPostTask extends ITraceable {
  calls: number;
  cps: number;
  delay: number | undefined | string;
  priority: undefined | string;
  facts: TFact;
  selfTime: number | null;
  aborts: number;
  online: number;
}
interface IPostTaskOptions {
  priority?: TTaskPriority;
  signal?: AbortSignal /*| TaskSignal*/;
  delay?: number;
}

export interface ISchedulerTelemetry {
  yield: IYield[] | null;
  postTask: IPostTask[] | null;
}

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
  #callsMap: Map</*traceId*/ string, /*calls*/ number> = new Map();

  wrapYield() {
    globalThis.scheduler.yield = function (this: SchedulerWrapper) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = traceUtil.getCallstack(err);
      const methodMetric = this.#yieldMap.getOrInsertComputed(
        callstack.traceId,
        () => {
          return {
            traceId: callstack.traceId,
            trace: callstack.trace,
            traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
            firstSeen: performance.now(),
            calls: 0,
            cps: 1,
          };
        },
      );

      methodMetric.calls++;

      if (traceUtil.shouldPass(callstack.traceId)) {
        if (traceUtil.shouldPause(callstack.traceId)) {
          debugger;
        }
        return nativeYield();
      }

      return Promise.resolve(); // in case of bypass
    }.bind(this);
  }

  wrapPostTask() {
    globalThis.scheduler.postTask = function (
      this: SchedulerWrapper,
      fn: () => unknown,
      options?: IPostTaskOptions,
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = traceUtil.getCallstack(err, fn);
      const delay = options?.delay;
      let aborted = false;
      let finished = false;
      const methodMetric = this.#postTaskMap.getOrInsertComputed(
        callstack.traceId,
        () => {
          return {
            traceId: callstack.traceId,
            trace: callstack.trace,
            traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
            firstSeen: performance.now(),
            calls: 0,
            cps: 1,
            delay,
            facts: <TFact> 0,
            selfTime: null,
            priority: undefined,
            aborts: 0,
            online: 0,
          };
        },
      );

      methodMetric.calls++;
      methodMetric.priority = options?.priority;
      methodMetric.online++;

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

        return Promise.resolve(); // in case of bypass
      }, options);
    }.bind(this);
  }

  unwrapYield() {
    globalThis.scheduler.yield = nativeYield;
  }

  unwrapPostTask() {
    globalThis.scheduler.postTask = nativePostTask;
  }

  updateCallsPerSecond(panel: IPanel) {
    if (!panel.wrap || !panel.visible) return;

    this.#yieldMap.forEach((methodMetric) => {
      const prevCalls = this.#callsMap.get(methodMetric.traceId) || 0;

      methodMetric.cps = methodMetric.calls - prevCalls;
      this.#callsMap.set(methodMetric.traceId, methodMetric.calls);
    });

    this.#postTaskMap.forEach((methodMetric) => {
      const prevCalls = this.#callsMap.get(methodMetric.traceId) || 0;

      methodMetric.cps = methodMetric.calls - prevCalls;
      this.#callsMap.set(methodMetric.traceId, methodMetric.calls);
    });
  }

  collectHistory(panel: IPanel): ISchedulerTelemetry {
    return {
      yield: panel.visible ? Array.from(this.#yieldMap.values()) : null,
      postTask: panel.visible ? Array.from(this.#postTaskMap.values()) : null,
    };
  }
}
