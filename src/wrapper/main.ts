import {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  lessEval,
  requestAnimationFrame,
  cancelAnimationFrame,
  requestIdleCallback,
  cancelIdleCallback,
  TAG_EVAL_RETURN_SET_TIMEOUT,
  TAG_EVAL_RETURN_SET_INTERVAL,
  TAG_MISSFORTUNE,
} from '../api/const.ts';
import { TAG_EXCEPTION, cloneObjectSafely } from '../api/clone.ts';
import {
  EWrapperCallstackType,
  type TPanelVisibilityMap,
  type TSettings,
} from '../api/settings.ts';
import { trim2microsecond, callingOnce } from '../api/time.ts';
import {
  TraceUtil,
  TRACE_ERROR_MESSAGE,
  ETraceDomain,
  type TCallstack,
  type TTrace,
} from './traceUtil.ts';
import { validHandler, validTimerDelay } from './util.ts';

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
export type TEvalHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  returnedValue: any;
  code: any;
  usesLocalScope: boolean;
  selfTime: number | null;
};
export type TRequestAnimationFrameHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  handler: number | undefined | string;
  selfTime: number | null;
  online: number;
  canceledCounter: number;
  canceledByTraceIds: string[] | null;
  fps: number;
};
export type TCancelAnimationFrameHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  handler: number | undefined | string;
};
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
export type TWrapperMetrics = {
  onlineTimers: TOnlineTimerMetrics[] | null;
  setTimeoutHistory: TSetTimerHistory[] | null;
  clearTimeoutHistory: TClearTimerHistory[] | null;
  setIntervalHistory: TSetTimerHistory[] | null;
  clearIntervalHistory: TClearTimerHistory[] | null;
  evalHistory: TEvalHistory[] | null;
  rafHistory: TRequestAnimationFrameHistory[] | null;
  cafHistory: TCancelAnimationFrameHistory[] | null;
  ricHistory: TRequestIdleCallbackHistory[] | null;
  cicHistory: TCancelIdleCallbackHistory[] | null;
  callCounter: {
    activeTimers: number;
    setTimeout: number;
    clearTimeout: number;
    setInterval: number;
    clearInterval: number;
    eval: number;
    requestAnimationFrame: number;
    cancelAnimationFrame: number;
    requestIdleCallback: number;
    cancelIdleCallback: number;
  };
};

export class Wrapper {
  traceUtil = new TraceUtil();
  onlineTimers: Map</*handler*/ number, TOnlineTimerMetrics> = new Map();
  setTimeoutHistory: Map</*traceId*/ string, TSetTimerHistory> = new Map();
  clearTimeoutHistory: Map</*traceId*/ string, TClearTimerHistory> = new Map();
  setIntervalHistory: Map</*traceId*/ string, TSetTimerHistory> = new Map();
  clearIntervalHistory: Map</*traceId*/ string, TClearTimerHistory> = new Map();
  evalHistory: Map</*traceId*/ string, TEvalHistory> = new Map();
  animationCallsMap = new Map</*traceId*/ string, /*calls*/ number>();
  onlineAnimationFrameLookup: Map</*handler*/ number, /*traceId*/ string> =
    new Map();
  rafHistory: Map</*traceId*/ string, TRequestAnimationFrameHistory> =
    new Map();
  cafHistory: Map</*traceId*/ string, TCancelAnimationFrameHistory> = new Map();
  onlineIdleCallbackLookup: Map</*handler*/ number, /*traceId*/ string> =
    new Map();
  ricHistory: Map</*traceId*/ string, TRequestIdleCallbackHistory> = new Map();
  cicHistory: Map</*traceId*/ string, TCancelIdleCallbackHistory> = new Map();
  callCounter: TWrapperMetrics['callCounter'] = {
    activeTimers: 0,
    setTimeout: 0,
    clearTimeout: 0,
    setInterval: 0,
    clearInterval: 0,
    eval: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    requestIdleCallback: 0,
    cancelIdleCallback: 0,
  };
  native = {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    eval: lessEval,
    requestAnimationFrame: requestAnimationFrame,
    cancelAnimationFrame: cancelAnimationFrame,
    requestIdleCallback: requestIdleCallback,
    cancelIdleCallback: cancelIdleCallback,
  };

  setCallstackType = callingOnce((type: EWrapperCallstackType) => {
    this.traceUtil.callstackType = type;
  });

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

  updateEvalHistory(
    code: string,
    returnedValue: any,
    callstack: TCallstack,
    usesLocalScope: boolean,
    selfTime: number | null
  ) {
    const existing = this.evalHistory.get(callstack.traceId);

    if (existing) {
      existing.code = cloneObjectSafely(code);
      existing.returnedValue = cloneObjectSafely(returnedValue);
      existing.calls++;
      existing.usesLocalScope = usesLocalScope;
      existing.selfTime = trim2microsecond(selfTime);
    } else {
      this.evalHistory.set(callstack.traceId, {
        calls: 1,
        code: cloneObjectSafely(code),
        returnedValue: cloneObjectSafely(returnedValue),
        usesLocalScope,
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.traceUtil.getTraceDomain(callstack.trace[0]),
        selfTime,
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

  updateAnimationsFramerate() {
    for (let [, rafRecord] of this.rafHistory) {
      const prevCalls = this.animationCallsMap.get(rafRecord.traceId) || 0;
      const fps = rafRecord.calls - prevCalls;

      this.animationCallsMap.set(rafRecord.traceId, rafRecord.calls);
      rafRecord.fps = fps;
    }
  }

  updateRafHistory(handler: number, callstack: TCallstack) {
    const existing = this.rafHistory.get(callstack.traceId);

    if (existing) {
      existing.calls++;
      existing.handler = handler;
      existing.online++;
    } else {
      this.rafHistory.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.traceUtil.getTraceDomain(callstack.trace[0]),
        calls: 1,
        handler,
        online: 1,
        canceledCounter: 0,
        canceledByTraceIds: null,
        selfTime: null,
        fps: 1,
      });
    }

    this.onlineAnimationFrameLookup.set(handler, callstack.traceId);
  }

  rafFired(handler: number, traceId: string, selfTime: number | null) {
    const rafRecord = this.rafHistory.get(traceId);
    if (!rafRecord) {
      return;
    }

    rafRecord.selfTime = trim2microsecond(selfTime);

    if (this.onlineAnimationFrameLookup.has(handler)) {
      this.onlineAnimationFrameLookup.delete(handler);
      rafRecord.online--;
    }
  }

  updateCafHistory(handler: number | string, callstack: TCallstack) {
    const existing = this.cafHistory.get(callstack.traceId);
    const hasError = !validHandler(handler);

    if (hasError) {
      handler = TAG_EXCEPTION(handler);
    }

    if (existing) {
      existing.calls++;
      existing.handler = handler;
    } else {
      this.cafHistory.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.traceUtil.getTraceDomain(callstack.trace[0]),
        calls: 1,
        handler,
      });
    }

    const rafTraceId = this.onlineAnimationFrameLookup.get(Number(handler));
    const rafRecord = rafTraceId && this.rafHistory.get(rafTraceId);
    if (rafRecord) {
      this.onlineAnimationFrameLookup.delete(Number(handler));

      rafRecord.online--;

      if (rafRecord.canceledByTraceIds === null) {
        rafRecord.canceledByTraceIds = [callstack.traceId];
      } else if (!rafRecord.canceledByTraceIds.includes(callstack.traceId)) {
        rafRecord.canceledByTraceIds.push(callstack.traceId);
      }
      rafRecord.canceledCounter++;
    }
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

  cleanHistory() {
    this.evalHistory.clear();
    this.setTimeoutHistory.clear();
    this.clearTimeoutHistory.clear();
    this.setIntervalHistory.clear();
    this.clearIntervalHistory.clear();
    this.rafHistory.clear();
    this.cafHistory.clear();
    this.ricHistory.clear();
    this.cicHistory.clear();
    this.onlineIdleCallbackLookup.clear();
    this.onlineAnimationFrameLookup.clear();
    this.animationCallsMap.clear();
    this.callCounter.setTimeout =
      this.callCounter.clearTimeout =
      this.callCounter.setInterval =
      this.callCounter.clearInterval =
      this.callCounter.eval =
      this.callCounter.requestAnimationFrame =
      this.callCounter.cancelAnimationFrame =
      this.callCounter.requestIdleCallback =
      this.callCounter.cancelIdleCallback =
        0;
  }

  collectWrapperMetrics(panels: TPanelVisibilityMap): TWrapperMetrics {
    this.callCounter.activeTimers = this.onlineTimers.size;

    return {
      evalHistory: panels.eval.visible
        ? Array.from(this.evalHistory.values())
        : null,
      onlineTimers: panels.activeTimers.visible
        ? Array.from(this.onlineTimers.values())
        : null,
      setTimeoutHistory: panels.setTimeout.visible
        ? Array.from(this.setTimeoutHistory.values())
        : null,
      clearTimeoutHistory: panels.clearTimeout.visible
        ? Array.from(this.clearTimeoutHistory.values())
        : null,
      setIntervalHistory: panels.setInterval.visible
        ? Array.from(this.setIntervalHistory.values())
        : null,
      clearIntervalHistory: panels.clearInterval.visible
        ? Array.from(this.clearIntervalHistory.values())
        : null,
      rafHistory: panels.requestAnimationFrame.visible
        ? Array.from(this.rafHistory.values())
        : null,
      cafHistory: panels.cancelAnimationFrame.visible
        ? Array.from(this.cafHistory.values())
        : null,
      ricHistory: panels.requestIdleCallback.visible
        ? Array.from(this.ricHistory.values())
        : null,
      cicHistory: panels.cancelIdleCallback.visible
        ? Array.from(this.cicHistory.values())
        : null,
      callCounter: this.callCounter,
    };
  }

  setup(panels: TPanelVisibilityMap, settings: TSettings) {
    this.traceUtil.trace4Debug = settings.traceForDebug;
    this.traceUtil.trace4Bypass = settings.traceForBypass;
    this.setCallstackType(settings.wrapperCallstackType);
    this.wrapByPanels(panels);
  }

  wrapByPanels = callingOnce((panels: TPanelVisibilityMap) => {
    panels.eval.wrap && this.wrapEval();
    panels.setTimeout.wrap && this.wrapSetTimeout();
    panels.clearTimeout.wrap && this.wrapClearTimeout();
    panels.setInterval.wrap && this.wrapSetInterval();
    panels.clearInterval.wrap && this.wrapClearInterval();
    panels.requestAnimationFrame.wrap && this.wrapRequestAnimationFrame();
    panels.cancelAnimationFrame.wrap && this.wrapCancelAnimationFrame();
    panels.requestIdleCallback.wrap && this.wrapRequestIdleCallback();
    panels.cancelIdleCallback.wrap && this.wrapCancelIdleCallback();
  });

  wrapAll() {
    this.wrapEval();
    this.wrapSetTimeout();
    this.wrapClearTimeout();
    this.wrapSetInterval();
    this.wrapClearInterval();
    this.wrapRequestAnimationFrame();
    this.wrapCancelAnimationFrame();
    this.wrapRequestIdleCallback();
    this.wrapCancelIdleCallback();
  }

  unwrapAll() {
    window.eval = this.native.eval; // won't do revert effect, here for consistency
    window.setTimeout = this.native.setTimeout;
    window.clearTimeout = this.native.clearTimeout;
    window.setInterval = this.native.setInterval;
    window.clearInterval = this.native.clearInterval;
    window.requestAnimationFrame = this.native.requestAnimationFrame;
    window.cancelAnimationFrame = this.native.cancelAnimationFrame;
    window.requestIdleCallback = this.native.requestIdleCallback;
    window.cancelIdleCallback = this.native.cancelIdleCallback;
  }

  wrapRequestIdleCallback() {
    window.requestIdleCallback = function requestIdleCallback(
      this: Wrapper,
      fn: IdleRequestCallback,
      options?: IdleRequestOptions | undefined
    ) {
      const delay = options?.timeout;
      const err = new Error(TRACE_ERROR_MESSAGE);
      const callstack = this.traceUtil.createCallstack(err, fn);

      this.callCounter.requestIdleCallback++;
      const handler = this.native.requestIdleCallback((deadline) => {
        const start = performance.now();
        let selfTime = null;

        if (!this.traceUtil.shouldBypass(callstack.traceId)) {
          if (this.traceUtil.shouldDebug(callstack.traceId)) {
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
      this: Wrapper,
      handler: number
    ) {
      const err = new Error(TRACE_ERROR_MESSAGE);
      const callstack = this.traceUtil.createCallstack(err);

      this.updateCicHistory(handler, callstack);
      this.callCounter.cancelIdleCallback++;

      if (!this.traceUtil.shouldBypass(callstack.traceId)) {
        if (this.traceUtil.shouldDebug(callstack.traceId)) {
          debugger;
        }
        this.native.cancelIdleCallback(handler);
      }
    }.bind(this);
  }

  wrapRequestAnimationFrame() {
    window.requestAnimationFrame = function requestAnimationFrame(
      this: Wrapper,
      fn: FrameRequestCallback
    ) {
      const err = new Error(TRACE_ERROR_MESSAGE);
      const callstack = this.traceUtil.createCallstack(err, fn);

      this.callCounter.requestAnimationFrame++;
      const handler = this.native.requestAnimationFrame((...args) => {
        const start = performance.now();
        let selfTime = null;

        if (!this.traceUtil.shouldBypass(callstack.traceId)) {
          if (this.traceUtil.shouldDebug(callstack.traceId)) {
            debugger;
          }
          fn(...args);
          selfTime = performance.now() - start;
        }

        this.rafFired(handler, callstack.traceId, selfTime);
      });
      this.updateRafHistory(handler, callstack);

      return handler;
    }.bind(this);
  }

  wrapCancelAnimationFrame() {
    window.cancelAnimationFrame = function cancelAnimationFrame(
      this: Wrapper,
      handler: number
    ) {
      const err = new Error(TRACE_ERROR_MESSAGE);
      const callstack = this.traceUtil.createCallstack(err);

      this.updateCafHistory(handler, callstack);
      this.callCounter.cancelAnimationFrame++;

      if (!this.traceUtil.shouldBypass(callstack.traceId)) {
        if (this.traceUtil.shouldDebug(callstack.traceId)) {
          debugger;
        }
        this.native.cancelAnimationFrame(handler);
      }
    }.bind(this);
  }

  wrapEval() {
    window.eval = function WrappedLessEval(this: Wrapper, code: string) {
      const err = new Error(TRACE_ERROR_MESSAGE);
      const callstack = this.traceUtil.createCallstack(err, code);
      let rv: unknown;
      let throwError = null;
      let usesLocalScope = false;
      let selfTime = null;

      try {
        this.callCounter.eval++;
        const start = performance.now();

        if (!this.traceUtil.shouldBypass(callstack.traceId)) {
          if (this.traceUtil.shouldDebug(callstack.traceId)) {
            debugger;
          }
          rv = this.native.eval(code);
          selfTime = performance.now() - start;
        }
      } catch (error: unknown) {
        if (error instanceof Error && 'ReferenceError' === error.name) {
          // most likely a side effect of `eval` reassigning
          // when reference to local scope variable resulting
          // in "ReferenceError: {something} is not defined"
          usesLocalScope = true;
        } else {
          throwError = error;
        }
      }

      this.updateEvalHistory(code, rv, callstack, usesLocalScope, selfTime);

      if (throwError) {
        throw throwError;
      }

      return rv;
    }.bind(this);
  }

  wrapSetTimeout() {
    window.setTimeout = function setTimeout(
      this: Wrapper,
      code: TimerHandler,
      delay: number | undefined,
      ...args: any[]
    ) {
      const err = new Error(TRACE_ERROR_MESSAGE);
      const callstack = this.traceUtil.createCallstack(err, code);
      const isEval = typeof code === 'string';

      this.callCounter.setTimeout++;
      const handler = this.native.setTimeout(
        (...params: any[]) => {
          const start = performance.now();
          let selfTime = null;

          if (isEval) {
            this.callCounter.eval++;
            if (!this.traceUtil.shouldBypass(callstack.traceId)) {
              if (this.traceUtil.shouldDebug(callstack.traceId)) {
                debugger;
              }
              // see https://developer.mozilla.org/docs/Web/API/setTimeout#code
              this.native.eval(code);
              selfTime = performance.now() - start;
            }
          } else {
            if (!this.traceUtil.shouldBypass(callstack.traceId)) {
              if (this.traceUtil.shouldDebug(callstack.traceId)) {
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
        this.updateEvalHistory(
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
      this: Wrapper,
      handler: number | undefined
    ) {
      const err = new Error(TRACE_ERROR_MESSAGE);
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

      if (!this.traceUtil.shouldBypass(callstack.traceId)) {
        if (this.traceUtil.shouldDebug(callstack.traceId)) {
          debugger;
        }
        this.native.clearTimeout(handler);
      }
    }.bind(this);
  }

  wrapSetInterval() {
    window.setInterval = function setInterval(
      this: Wrapper,
      code: TimerHandler,
      delay: number | undefined,
      ...args: any[]
    ) {
      const err = new Error(TRACE_ERROR_MESSAGE);
      const callstack = this.traceUtil.createCallstack(err, code);
      const isEval = typeof code === 'string';

      this.callCounter.setInterval++;

      const handler = this.native.setInterval(
        (...params: any[]) => {
          const start = performance.now();
          let selfTime = null;

          if (isEval) {
            this.callCounter.eval++;
            if (!this.traceUtil.shouldBypass(callstack.traceId)) {
              if (this.traceUtil.shouldDebug(callstack.traceId)) {
                debugger;
              }
              // see https://developer.mozilla.org/docs/Web/API/setInterval
              this.native.eval(code);
              selfTime = performance.now() - start;
            }
          } else {
            if (!this.traceUtil.shouldBypass(callstack.traceId)) {
              if (this.traceUtil.shouldDebug(callstack.traceId)) {
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
        this.updateEvalHistory(
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
      this: Wrapper,
      handler: number | undefined
    ) {
      const err = new Error(TRACE_ERROR_MESSAGE);
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

      if (!this.traceUtil.shouldBypass(callstack.traceId)) {
        if (this.traceUtil.shouldDebug(callstack.traceId)) {
          debugger;
        }
        this.native.clearInterval(handler);
      }
    }.bind(this);
  }
}
