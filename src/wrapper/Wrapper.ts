import {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  requestAnimationFrame,
  cancelAnimationFrame,
  TAG_EVAL_RETURN_SET_TIMEOUT,
  TAG_EVAL_RETURN_SET_INTERVAL,
  TAG_MISSFORTUNE,
} from '../api/const.ts';
import { TAG_EXCEPTION } from '../api/clone.ts';
import {
  EWrapperCallstackType,
  type TPanelVisibilityMap,
  type TSettings,
} from '../api/settings.ts';
import { trim2microsecond, callingOnce } from '../api/time.ts';
import {
  TraceUtil,
  ETraceDomain,
  type TCallstack,
  type TTrace,
} from './TraceUtil.ts';
import { validHandler, validTimerDelay } from './util.ts';
import { EvalWrapper, type TEvalHistory } from './EvalWrapper.ts';
import {
  IdleWrapper,
  type TCancelIdleCallbackHistory,
  type TRequestIdleCallbackHistory,
} from './IdleWrapper.ts';

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
  callCounter: TWrapperCallCounter;
};
type TWrapperCallCounter = {
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

export class Wrapper {
  traceUtil = new TraceUtil();
  apiEval: EvalWrapper;
  // apiTimer: TimerWrapper;
  // apiAnimation: AnimationWrapper;
  apiIdle: IdleWrapper;

  onlineTimers: Map</*handler*/ number, TOnlineTimerMetrics> = new Map();
  setTimeoutHistory: Map</*traceId*/ string, TSetTimerHistory> = new Map();
  clearTimeoutHistory: Map</*traceId*/ string, TClearTimerHistory> = new Map();
  setIntervalHistory: Map</*traceId*/ string, TSetTimerHistory> = new Map();
  clearIntervalHistory: Map</*traceId*/ string, TClearTimerHistory> = new Map();
  animationCallsMap = new Map</*traceId*/ string, /*calls*/ number>();
  onlineAnimationFrameLookup: Map</*handler*/ number, /*traceId*/ string> =
    new Map();
  rafHistory: Map</*traceId*/ string, TRequestAnimationFrameHistory> =
    new Map();
  cafHistory: Map</*traceId*/ string, TCancelAnimationFrameHistory> = new Map();
  callCounter = {
    activeTimers: 0,
    setTimeout: 0,
    clearTimeout: 0,
    setInterval: 0,
    clearInterval: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
  };
  native = {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    requestAnimationFrame: requestAnimationFrame,
    cancelAnimationFrame: cancelAnimationFrame,
  };

  constructor() {
    this.apiEval = new EvalWrapper(this.traceUtil);
    // this.apiTimer = new ApiTimer(this.traceUtil, this.apiEval);
    // this.apiAnimationFrame = new ApiAnimationFrame(this.traceUtil);
    this.apiIdle = new IdleWrapper(this.traceUtil);
  }

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

  cleanHistory() {
    this.apiEval.cleanHistory();
    this.apiIdle.cleanHistory();

    this.setTimeoutHistory.clear();
    this.clearTimeoutHistory.clear();
    this.setIntervalHistory.clear();
    this.clearIntervalHistory.clear();
    this.rafHistory.clear();
    this.cafHistory.clear();
    this.onlineAnimationFrameLookup.clear();
    this.animationCallsMap.clear();
    this.callCounter.setTimeout =
      this.callCounter.clearTimeout =
      this.callCounter.setInterval =
      this.callCounter.clearInterval =
      this.callCounter.requestAnimationFrame =
      this.callCounter.cancelAnimationFrame =
        0;
  }

  collectWrapperMetrics(panels: TPanelVisibilityMap): TWrapperMetrics {
    this.callCounter.activeTimers = this.onlineTimers.size;

    return {
      evalHistory: panels.eval.visible ? this.apiEval.collectHistory() : null,
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
      ...this.apiIdle.collectHistory(panels),

      callCounter: {
        eval: this.apiEval.callCounter,
        requestIdleCallback: this.apiIdle.callCounter.requestIdleCallback,
        cancelIdleCallback: this.apiIdle.callCounter.cancelIdleCallback,
        ...this.callCounter,
      },
    };
  }

  setup(panels: TPanelVisibilityMap, settings: TSettings) {
    this.traceUtil.trace4Debug = settings.traceForDebug;
    this.traceUtil.trace4Bypass = settings.traceForBypass;
    this.setCallstackType(settings.wrapperCallstackType);
    this.wrapByPanels(panels);
  }

  wrapByPanels = callingOnce((panels: TPanelVisibilityMap) => {
    panels.eval.wrap && this.apiEval.wrap();
    panels.setTimeout.wrap && this.wrapSetTimeout();
    panels.clearTimeout.wrap && this.wrapClearTimeout();
    panels.setInterval.wrap && this.wrapSetInterval();
    panels.clearInterval.wrap && this.wrapClearInterval();
    panels.requestAnimationFrame.wrap && this.wrapRequestAnimationFrame();
    panels.cancelAnimationFrame.wrap && this.wrapCancelAnimationFrame();
    panels.requestIdleCallback.wrap && this.apiIdle.wrapRequestIdleCallback();
    panels.cancelIdleCallback.wrap && this.apiIdle.wrapCancelIdleCallback();
  });

  wrapAll() {
    this.apiEval.wrap();
    this.wrapSetTimeout();
    this.wrapClearTimeout();
    this.wrapSetInterval();
    this.wrapClearInterval();
    this.wrapRequestAnimationFrame();
    this.wrapCancelAnimationFrame();
    this.apiIdle.wrapRequestIdleCallback();
    this.apiIdle.wrapCancelIdleCallback();
  }

  unwrapAll() {
    this.apiEval.unwrap();
    window.setTimeout = this.native.setTimeout;
    window.clearTimeout = this.native.clearTimeout;
    window.setInterval = this.native.setInterval;
    window.clearInterval = this.native.clearInterval;
    window.requestAnimationFrame = this.native.requestAnimationFrame;
    window.cancelAnimationFrame = this.native.cancelAnimationFrame;
    this.apiIdle.unwrapRequestIdleCallback();
    this.apiIdle.unwrapCancelIdleCallback();
  }

  wrapRequestAnimationFrame() {
    window.requestAnimationFrame = function requestAnimationFrame(
      this: Wrapper,
      fn: FrameRequestCallback
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = this.traceUtil.createCallstack(err, fn);

      this.callCounter.requestAnimationFrame++;
      const handler = this.native.requestAnimationFrame((...args) => {
        const start = performance.now();
        let selfTime = null;

        if (this.traceUtil.shouldPass(callstack.traceId)) {
          if (this.traceUtil.shouldPause(callstack.traceId)) {
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
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = this.traceUtil.createCallstack(err);

      this.updateCafHistory(handler, callstack);
      this.callCounter.cancelAnimationFrame++;

      if (this.traceUtil.shouldPass(callstack.traceId)) {
        if (this.traceUtil.shouldPause(callstack.traceId)) {
          debugger;
        }
        this.native.cancelAnimationFrame(handler);
      }
    }.bind(this);
  }

  wrapSetTimeout() {
    window.setTimeout = function setTimeout(
      this: Wrapper,
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
      this: Wrapper,
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
      this: Wrapper,
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
      this: Wrapper,
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
}
