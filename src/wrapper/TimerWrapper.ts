import {
  TraceUtil,
  ETraceDomain,
  type TCallstack,
  type TTrace,
} from './TraceUtil.ts';
import {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  TAG_EVAL_RETURN_SET_TIMEOUT,
  TAG_EVAL_RETURN_SET_INTERVAL,
  TAG_MISSFORTUNE,
} from '../api/const.ts';
import type { TPanelMap } from '../api/settings.ts';
import type { EvalWrapper } from './EvalWrapper.ts';
import { TAG_EXCEPTION } from '../api/clone.ts';
import { validHandler, validTimerDelay } from './util.ts';
import { trim2microsecond } from '../api/time.ts';

export enum ETimerType {
  TIMEOUT,
  INTERVAL,
}
export type TOnlineTimerMetrics = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  type: ETimerType;
  delay: number | undefined | string;
  handler: number;
  isEval: boolean;
};
export type TSetTimerHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  handler: number | string;
  delay: number | undefined | string;
  isEval: boolean | undefined;
  online: number;
  canceledCounter: number;
  canceledByTraceIds: string[] | null;
  selfTime: number | null;
};
export type TClearTimerHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  handler: number | string;
  delay: number | undefined | string;
};

export class TimerWrapper {
  traceUtil: TraceUtil;
  apiEval: EvalWrapper;
  onlineTimers: Map</*handler*/ number, TOnlineTimerMetrics> = new Map();
  setTimeoutHistory: Map</*traceId*/ string, TSetTimerHistory> = new Map();
  clearTimeoutHistory: Map</*traceId*/ string, TClearTimerHistory> = new Map();
  setIntervalHistory: Map</*traceId*/ string, TSetTimerHistory> = new Map();
  clearIntervalHistory: Map</*traceId*/ string, TClearTimerHistory> = new Map();
  native = {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
  };
  callCounter = {
    setTimeout: 0,
    clearTimeout: 0,
    setInterval: 0,
    clearInterval: 0,
  };

  constructor(traceUtil: TraceUtil, apiEval: EvalWrapper) {
    this.traceUtil = traceUtil;
    this.apiEval = apiEval;
  }

  timerOnline(
    type: ETimerType,
    handler: number,
    delay: number | undefined | string,
    callstack: TCallstack,
    isEval: boolean
  ) {
    delay = validTimerDelay(delay)
      ? trim2microsecond(delay)
      : TAG_EXCEPTION(delay);

    this.onlineTimers.set(handler, {
      type,
      handler,
      delay,
      isEval,
      traceId: callstack.traceId,
      trace: callstack.trace,
      traceDomain: this.traceUtil.getTraceDomain(callstack.trace[0]),
    });
  }

  timerOffline(
    handler: number,
    canceledByTraceId: string | null,
    selfTime: number | null
  ) {
    const timer = this.onlineTimers.get(handler);
    if (!timer) {
      // already offline
      return;
    }

    this.onlineTimers.delete(handler);

    const setTimerRecord =
      timer.type === ETimerType.TIMEOUT
        ? this.setTimeoutHistory.get(timer.traceId)
        : this.setIntervalHistory.get(timer.traceId);

    if (!setTimerRecord) {
      return;
    }

    setTimerRecord.online--;
    setTimerRecord.selfTime = trim2microsecond(selfTime);

    if (canceledByTraceId === null) {
      return;
    }

    if (setTimerRecord.canceledByTraceIds === null) {
      setTimerRecord.canceledByTraceIds = [canceledByTraceId];
    } else if (!setTimerRecord.canceledByTraceIds.includes(canceledByTraceId)) {
      setTimerRecord.canceledByTraceIds.push(canceledByTraceId);
    }
    setTimerRecord.canceledCounter++;
  }

  updateSetTimersHistory(
    history: Map<string, TSetTimerHistory>,
    handler: number,
    delay: number | string | undefined,
    callstack: TCallstack,
    isEval: boolean
  ) {
    const existing = history.get(callstack.traceId);
    const hasError = !validTimerDelay(delay);
    delay = hasError ? TAG_EXCEPTION(delay) : trim2microsecond(delay);

    if (existing) {
      existing.handler = handler;
      existing.delay = delay;
      existing.calls++;
      existing.isEval = isEval;
      existing.online++;
    } else {
      history.set(callstack.traceId, {
        handler,
        calls: 1,
        delay,
        isEval,
        online: 1,
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.traceUtil.getTraceDomain(callstack.trace[0]),
        canceledCounter: 0,
        canceledByTraceIds: null,
        selfTime: null,
      });
    }
  }

  updateClearTimersHistory(
    history: Map<string, TClearTimerHistory>,
    handler: unknown,
    callstack: TCallstack
  ) {
    const existing = history.get(callstack.traceId);
    const hasError = !validHandler(handler);
    const onlineTimer = hasError
      ? null
      : this.onlineTimers.get(<number>handler);
    const handlerDelay: string | number | undefined = onlineTimer
      ? onlineTimer.delay
      : TAG_MISSFORTUNE;

    if (hasError) {
      handler = TAG_EXCEPTION(handler);
    }

    if (existing) {
      existing.handler = <number | string>handler;
      existing.delay = handlerDelay;
      existing.calls++;
    } else {
      history.set(callstack.traceId, {
        handler: <number | string>handler,
        calls: 1,
        delay: handlerDelay,
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.traceUtil.getTraceDomain(callstack.trace[0]),
      });
    }
  }

  updateTimersSelfTime(
    map: Map<string, TSetTimerHistory>,
    traceId: string,
    selfTime: number | null
  ) {
    const record = map.get(traceId);

    if (record) {
      record.selfTime = trim2microsecond(selfTime);
    }
  }

  wrapSetTimeout() {
    window.setTimeout = function setTimeout(
      this: TimerWrapper,
      code: TimerHandler,
      delay: number | undefined,
      ...args: any[]
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = this.traceUtil.createCallstack(err, code);
      const isEval = typeof code === 'string';

      this.callCounter.setTimeout++;
      const handler = this.native.setTimeout(
        (...params: any[]) => {
          const start = performance.now();
          let selfTime = null;

          if (isEval) {
            this.apiEval.callCounter++;
            if (this.traceUtil.shouldPass(callstack.traceId)) {
              if (this.traceUtil.shouldPause(callstack.traceId)) {
                debugger;
              }
              // see https://developer.mozilla.org/docs/Web/API/setTimeout#code
              this.apiEval.nativeEval(code);
              selfTime = performance.now() - start;
            }
          } else {
            if (this.traceUtil.shouldPass(callstack.traceId)) {
              if (this.traceUtil.shouldPause(callstack.traceId)) {
                debugger;
              }
              code(...params);
              selfTime = performance.now() - start;
            }
          }

          this.timerOffline(handler, null, selfTime);
          this.updateTimersSelfTime(
            this.setTimeoutHistory,
            callstack.traceId,
            selfTime
          );
        },
        delay,
        ...args
      );

      this.timerOnline(ETimerType.TIMEOUT, handler, delay, callstack, isEval);
      this.updateSetTimersHistory(
        this.setTimeoutHistory,
        handler,
        delay,
        callstack,
        isEval
      );
      if (isEval) {
        this.apiEval.updateHistory(
          code,
          TAG_EVAL_RETURN_SET_TIMEOUT,
          callstack,
          false,
          null
        );
      }

      return handler;
    }.bind(this);
  }

  wrapClearTimeout() {
    window.clearTimeout = function clearTimeout(
      this: TimerWrapper,
      handler: number | undefined
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = this.traceUtil.createCallstack(err);

      this.updateClearTimersHistory(
        this.clearTimeoutHistory,
        handler,
        callstack
      );

      if (handler !== undefined) {
        this.timerOffline(handler, callstack.traceId, null);
      }

      this.callCounter.clearTimeout++;

      if (this.traceUtil.shouldPass(callstack.traceId)) {
        if (this.traceUtil.shouldPause(callstack.traceId)) {
          debugger;
        }
        this.native.clearTimeout(handler);
      }
    }.bind(this);
  }

  wrapSetInterval() {
    window.setInterval = function setInterval(
      this: TimerWrapper,
      code: TimerHandler,
      delay: number | undefined,
      ...args: any[]
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = this.traceUtil.createCallstack(err, code);
      const isEval = typeof code === 'string';

      this.callCounter.setInterval++;

      const handler = this.native.setInterval(
        (...params: any[]) => {
          const start = performance.now();
          let selfTime = null;

          if (isEval) {
            this.apiEval.callCounter++;
            if (this.traceUtil.shouldPass(callstack.traceId)) {
              if (this.traceUtil.shouldPause(callstack.traceId)) {
                debugger;
              }
              // see https://developer.mozilla.org/docs/Web/API/setInterval
              this.apiEval.nativeEval(code);
              selfTime = performance.now() - start;
            }
          } else {
            if (this.traceUtil.shouldPass(callstack.traceId)) {
              if (this.traceUtil.shouldPause(callstack.traceId)) {
                debugger;
              }
              code(...params);
              selfTime = performance.now() - start;
            }
          }

          this.updateTimersSelfTime(
            this.setIntervalHistory,
            callstack.traceId,
            selfTime
          );
        },
        delay,
        ...args
      );

      this.timerOnline(ETimerType.INTERVAL, handler, delay, callstack, isEval);
      this.updateSetTimersHistory(
        this.setIntervalHistory,
        handler,
        delay,
        callstack,
        isEval
      );
      if (isEval) {
        this.apiEval.updateHistory(
          code,
          TAG_EVAL_RETURN_SET_INTERVAL,
          callstack,
          false,
          null
        );
      }

      return handler;
    }.bind(this);
  }

  wrapClearInterval() {
    window.clearInterval = function clearInterval(
      this: TimerWrapper,
      handler: number | undefined
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = this.traceUtil.createCallstack(err);

      this.updateClearTimersHistory(
        this.clearIntervalHistory,
        handler,
        callstack
      );

      if (handler !== undefined) {
        this.timerOffline(handler, callstack.traceId, null);
      }

      this.callCounter.clearInterval++;

      if (this.traceUtil.shouldPass(callstack.traceId)) {
        if (this.traceUtil.shouldPause(callstack.traceId)) {
          debugger;
        }
        this.native.clearInterval(handler);
      }
    }.bind(this);
  }

  unwrapSetTimeout() {
    window.setTimeout = this.native.setTimeout;
  }

  unwrapClearTimeout() {
    window.clearTimeout = this.native.clearTimeout;
  }

  unwrapSetInterval() {
    window.setInterval = this.native.setInterval;
  }
  unwrapClearInterval() {
    window.clearInterval = this.native.clearInterval;
  }

  collectHistory(panels: TPanelMap) {
    return {
      onlineTimers: panels.activeTimers.visible
        ? Array.from(this.onlineTimers.values())
        : null,
      setTimeoutHistory:
        panels.setTimeout.visible && panels.setTimeout.wrap
          ? Array.from(this.setTimeoutHistory.values())
          : null,
      clearTimeoutHistory:
        panels.clearTimeout.visible && panels.clearTimeout.wrap
          ? Array.from(this.clearTimeoutHistory.values())
          : null,
      setIntervalHistory:
        panels.setInterval.visible && panels.setInterval.wrap
          ? Array.from(this.setIntervalHistory.values())
          : null,
      clearIntervalHistory:
        panels.clearInterval.visible && panels.clearInterval.wrap
          ? Array.from(this.clearIntervalHistory.values())
          : null,
    };
  }

  cleanHistory() {
    this.setTimeoutHistory.clear();
    this.clearTimeoutHistory.clear();
    this.setIntervalHistory.clear();
    this.clearIntervalHistory.clear();

    this.callCounter.setTimeout =
      this.callCounter.clearTimeout =
      this.callCounter.setInterval =
      this.callCounter.clearInterval =
        0;
  }
}
