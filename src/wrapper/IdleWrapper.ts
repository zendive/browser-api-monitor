import type { TPanelVisibilityMap } from '../api/settings.ts';
import { TAG_EXCEPTION } from '../api/clone.ts';
import { trim2microsecond } from '../api/time.ts';
import {
  TraceUtil,
  type ETraceDomain,
  type TCallstack,
  type TTrace,
} from './TraceUtil.ts';
import { validHandler, validTimerDelay } from './util.ts';

export type TRequestIdleCallbackHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  handler: number | undefined | string;
  delay: number | undefined | string;
  didTimeout: undefined | boolean;
  online: number;
  canceledCounter: number;
  canceledByTraceIds: string[] | null;
  selfTime: number | null;
};
export type TCancelIdleCallbackHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  handler: number | undefined | string;
};

const requestIdleCallback = window.requestIdleCallback.bind(window);
const cancelIdleCallback = window.cancelIdleCallback.bind(window);

export class IdleWrapper {
  traceUtil: TraceUtil;
  onlineIdleCallbackLookup: Map</*handler*/ number, /*traceId*/ string> =
    new Map();
  ricHistory: Map</*traceId*/ string, TRequestIdleCallbackHistory> = new Map();
  cicHistory: Map</*traceId*/ string, TCancelIdleCallbackHistory> = new Map();
  callCounter = {
    requestIdleCallback: 0,
    cancelIdleCallback: 0,
  };
  native = {
    requestIdleCallback: requestIdleCallback,
    cancelIdleCallback: cancelIdleCallback,
  };

  constructor(traceUtil: TraceUtil) {
    this.traceUtil = traceUtil;
  }

  ricFired(
    handler: number,
    traceId: string,
    deadline: IdleDeadline,
    selfTime: number | null
  ) {
    const ricRecord = this.ricHistory.get(traceId);
    if (!ricRecord) {
      return;
    }

    ricRecord.didTimeout = deadline.didTimeout;
    ricRecord.selfTime = trim2microsecond(selfTime);

    if (this.onlineIdleCallbackLookup.get(handler)) {
      this.onlineIdleCallbackLookup.delete(handler);
      ricRecord.online--;
    }
  }

  updateRicHistory(
    handler: number,
    delay: number | undefined | string,
    callstack: TCallstack
  ) {
    const existing = this.ricHistory.get(callstack.traceId);
    const hasError = !validTimerDelay(delay);
    delay = hasError ? TAG_EXCEPTION(delay) : trim2microsecond(delay);

    if (existing) {
      existing.calls++;
      existing.handler = handler;
      existing.didTimeout = undefined;
      existing.delay = delay;
      existing.online++;
    } else {
      this.ricHistory.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.traceUtil.getTraceDomain(callstack.trace[0]),
        calls: 1,
        handler,
        didTimeout: undefined,
        delay,
        online: 1,
        canceledCounter: 0,
        canceledByTraceIds: null,
        selfTime: null,
      });
    }

    this.onlineIdleCallbackLookup.set(handler, callstack.traceId);
  }

  updateCicHistory(handler: number | string, callstack: TCallstack) {
    const existing = this.cicHistory.get(callstack.traceId);
    const hasError = !validHandler(handler);

    if (hasError) {
      handler = TAG_EXCEPTION(handler);
    }

    if (existing) {
      existing.calls++;
      existing.handler = handler;
    } else {
      this.cicHistory.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.traceUtil.getTraceDomain(callstack.trace[0]),
        calls: 1,
        handler,
      });
    }

    const ricTraceId = this.onlineIdleCallbackLookup.get(Number(handler));
    const ricRecord = ricTraceId && this.ricHistory.get(ricTraceId);
    if (ricRecord) {
      this.onlineIdleCallbackLookup.delete(Number(handler));

      ricRecord.online--;
      ricRecord.didTimeout = undefined;

      if (ricRecord.canceledByTraceIds === null) {
        ricRecord.canceledByTraceIds = [callstack.traceId];
      } else if (!ricRecord.canceledByTraceIds.includes(callstack.traceId)) {
        ricRecord.canceledByTraceIds.push(callstack.traceId);
      }
      ricRecord.canceledCounter++;
    }
  }

  wrapRequestIdleCallback() {
    window.requestIdleCallback = function requestIdleCallback(
      this: IdleWrapper,
      fn: IdleRequestCallback,
      options?: IdleRequestOptions | undefined
    ) {
      const delay = options?.timeout;
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = this.traceUtil.createCallstack(err, fn);

      this.callCounter.requestIdleCallback++;
      const handler = this.native.requestIdleCallback((deadline) => {
        const start = performance.now();
        let selfTime = null;

        if (this.traceUtil.shouldPass(callstack.traceId)) {
          if (this.traceUtil.shouldPause(callstack.traceId)) {
            debugger;
          }
          fn(deadline);
          selfTime = performance.now() - start;
        }

        this.ricFired(handler, callstack.traceId, deadline, selfTime);
      }, options);
      this.updateRicHistory(handler, delay, callstack);

      return handler;
    }.bind(this);
  }

  wrapCancelIdleCallback() {
    window.cancelIdleCallback = function cancelIdleCallback(
      this: IdleWrapper,
      handler: number
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = this.traceUtil.createCallstack(err);

      this.updateCicHistory(handler, callstack);
      this.callCounter.cancelIdleCallback++;

      if (this.traceUtil.shouldPass(callstack.traceId)) {
        if (this.traceUtil.shouldPause(callstack.traceId)) {
          debugger;
        }
        this.native.cancelIdleCallback(handler);
      }
    }.bind(this);
  }

  unwrapRequestIdleCallback() {
    window.requestIdleCallback = this.native.requestIdleCallback;
  }

  unwrapCancelIdleCallback() {
    window.cancelIdleCallback = this.native.cancelIdleCallback;
  }

  collectHistory(panels: TPanelVisibilityMap) {
    return {
      ricHistory: panels.requestIdleCallback.visible
        ? Array.from(this.ricHistory.values())
        : null,
      cicHistory: panels.cancelIdleCallback.visible
        ? Array.from(this.cicHistory.values())
        : null,
    };
  }

  cleanHistory() {
    this.ricHistory.clear();
    this.cicHistory.clear();
    this.onlineIdleCallbackLookup.clear();

    this.callCounter.requestIdleCallback = 0;
    this.callCounter.cancelIdleCallback = 0;
  }
}
