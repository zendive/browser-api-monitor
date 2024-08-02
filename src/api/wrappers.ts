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
  REGEX_STACKTRACE_NAME,
  REGEX_STACKTRACE_LINK,
  TRACE_ERROR_MESSAGE,
  REGEX_STACKTRACE_SPLIT,
  REGEX_STACKTRACE_CLEAN_URL,
  REGEX_STACKTRACE_LINK_PROTOCOL,
  TAG_INVALID_CALLSTACK_LINK,
  TAG_EVAL_RETURN_SET_TIMEOUT,
  TAG_EVAL_RETURN_SET_INTERVAL,
} from '@/api/const.ts';
import { TAG_EXCEPTION, cloneObjectSafely } from '@/api/clone.ts';
import type { TPanelVisibilityMap } from '@/api/settings.ts';
import { hashString } from '@/api/hash.ts';

export type TTrace = {
  name: string | 0;
  link: string;
};
type TCallstack = {
  traceId: string;
  trace: TTrace[];
};
export const ETimerType = {
  TIMEOUT: 0,
  INTERVAL: 1,
} as const;
export type ETimerTypeKeys = (typeof ETimerType)[keyof typeof ETimerType];
export const ETraceDomain = {
  SAME: 0,
  EXTERNAL: 1,
  UNKNOWN: 2,
} as const;
export type ETraceDomainKeys = (typeof ETraceDomain)[keyof typeof ETraceDomain];
export type TOnlineTimerMetrics = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomainKeys;
  type: ETimerTypeKeys;
  delay: number | undefined | string;
  handler: number;
  isEval: boolean;
};
export type TSetTimerHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomainKeys;
  calls: number;
  handler: number | string;
  delay: number | undefined | string;
  isEval: boolean | undefined;
  hasError: boolean;
  isOnline: boolean;
  canceledByTraceIds: string[] | null;
};
export type TClearTimerHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomainKeys;
  calls: number;
  handler: number | string;
  delay: number | undefined | string;
  hasError: boolean;
};

export type TEvalHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomainKeys;
  calls: number;
  returnedValue: any;
  code: any;
  usesLocalScope: boolean;
};
export type TAnimationHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomainKeys;
  calls: number;
  handler: number | undefined | string;
  hasError?: boolean;
};
export type TRequestIdleCallbackHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomainKeys;
  calls: number;
  handler: number | undefined | string;
  delay: number | undefined | string;
  hasError: boolean;
  didTimeout: undefined | boolean;
  isOnline: boolean;
  canceledByTraceIds: string[] | null;
};
export type TCancelIdleCallbackHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomainKeys;
  calls: number;
  handler: number | undefined | string;
  hasError: boolean;
};
export type TWrapperMetrics = {
  onlineTimers: TOnlineTimerMetrics[] | null;
  setTimeoutHistory: TSetTimerHistory[] | null;
  clearTimeoutHistory: TClearTimerHistory[] | null;
  setIntervalHistory: TSetTimerHistory[] | null;
  clearIntervalHistory: TClearTimerHistory[] | null;
  evalHistory: TEvalHistory[] | null;
  rafHistory: TAnimationHistory[] | null;
  cafHistory: TAnimationHistory[] | null;
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
  onlineTimers: Map<number, TOnlineTimerMetrics> = new Map();
  setTimeoutHistory: Map<string, TSetTimerHistory> = new Map();
  clearTimeoutHistory: Map<string, TClearTimerHistory> = new Map();
  setIntervalHistory: Map<string, TSetTimerHistory> = new Map();
  clearIntervalHistory: Map<string, TClearTimerHistory> = new Map();
  evalHistory: Map<string, TEvalHistory> = new Map();
  rafHistory: Map<string, TAnimationHistory> = new Map();
  cafHistory: Map<string, TAnimationHistory> = new Map();
  /** mapping ric/cic handler to ric traceId */
  onlineIdleCallbackLookup: Map<number, string> = new Map();
  ricHistory: Map<string, TRequestIdleCallbackHistory> = new Map();
  cicHistory: Map<string, TCancelIdleCallbackHistory> = new Map();
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
  selfTraceLink = '';

  constructor() {
    this.#initSelfTrace();
  }

  #initSelfTrace() {
    const error = new Error(TRACE_ERROR_MESSAGE);
    this.selfTraceLink = (error?.stack || '')
      .split(REGEX_STACKTRACE_SPLIT)[1]
      .replace(REGEX_STACKTRACE_LINK, '$2')
      .replace(REGEX_STACKTRACE_CLEAN_URL, '$1');
  }

  #validTimerHandler(handler: unknown): handler is number {
    return Number.isFinite(handler) && <number>handler > 0;
  }

  #validTimerDelay(delay: unknown): delay is number {
    return (
      delay === undefined || (Number.isFinite(delay) && <number>delay >= 0)
    );
  }

  #getTraceDomain(trace: TTrace) {
    if (trace.link.startsWith(location.origin)) {
      return ETraceDomain.SAME;
    } else if (REGEX_STACKTRACE_LINK_PROTOCOL.test(trace.link)) {
      return ETraceDomain.EXTERNAL;
    }

    return ETraceDomain.UNKNOWN;
  }

  timerOnline(
    type: ETimerTypeKeys,
    handler: number,
    delay: number | undefined | string,
    callstack: TCallstack,
    isEval: boolean
  ) {
    if (!this.#validTimerDelay(delay)) {
      delay = TAG_EXCEPTION(delay);
    }
    this.onlineTimers.set(handler, {
      type,
      handler,
      delay,
      isEval,
      traceId: callstack.traceId,
      trace: callstack.trace,
      traceDomain: this.#getTraceDomain(callstack.trace[0]),
    });
  }

  timerOffline(handler: number, canceledByTraceId: string | null) {
    const timer = this.onlineTimers.get(handler);
    if (!timer) {
      // already offline
      return;
    }

    this.onlineTimers.delete(handler);

    const record =
      timer.type === ETimerType.TIMEOUT
        ? this.setTimeoutHistory.get(timer.traceId)
        : this.setIntervalHistory.get(timer.traceId);

    if (!record) {
      return;
    }

    record.isOnline = false;

    if (canceledByTraceId === null) {
      return;
    }

    if (record.canceledByTraceIds === null) {
      record.canceledByTraceIds = [canceledByTraceId];
    } else if (!record.canceledByTraceIds.includes(canceledByTraceId)) {
      record.canceledByTraceIds.push(canceledByTraceId);
    }
  }

  updateSetTimersHistory(
    history: Map<string, TSetTimerHistory>,
    handler: number,
    delay: number | undefined,
    callstack: TCallstack,
    isEval: boolean
  ) {
    const existing = history.get(callstack.traceId);
    const hasError = !this.#validTimerDelay(delay);
    let handlerDelay: string | number | undefined = delay;

    if (hasError) {
      handlerDelay = TAG_EXCEPTION(handlerDelay);
    }

    if (existing) {
      existing.handler = handler;
      existing.delay = handlerDelay;
      existing.calls++;
      existing.isEval = isEval;
      existing.hasError = hasError;
      existing.isOnline = true;
    } else {
      history.set(callstack.traceId, {
        handler,
        calls: 1,
        delay: handlerDelay,
        isEval,
        hasError,
        isOnline: true,
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.#getTraceDomain(callstack.trace[0]),
        canceledByTraceIds: null,
      });
    }
  }

  updateClearTimersHistory(
    history: Map<string, TClearTimerHistory>,
    handler: unknown,
    callstack: TCallstack
  ) {
    const existing = history.get(callstack.traceId);
    const hasError = !this.#validTimerHandler(handler);
    const onlineTimer = hasError
      ? null
      : this.onlineTimers.get(<number>handler);
    let handlerDelay: string | number | undefined = 'N/A';

    if (onlineTimer) {
      handlerDelay = onlineTimer.delay;
    } else if (existing) {
      handlerDelay = existing.delay;
    }

    if (hasError) {
      handler = TAG_EXCEPTION(handler);
    }

    if (existing) {
      existing.handler = <number | string>handler;
      existing.delay = handlerDelay;
      existing.calls++;
      existing.hasError = hasError;
    } else {
      history.set(callstack.traceId, {
        handler: <number | string>handler,
        calls: 1,
        delay: handlerDelay,
        hasError,
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.#getTraceDomain(callstack.trace[0]),
      });
    }
  }

  updateEvalHistory(
    code: string,
    returnedValue: any,
    callstack: TCallstack,
    usesLocalScope: boolean
  ) {
    const existing = this.evalHistory.get(callstack.traceId);

    if (existing) {
      existing.code = cloneObjectSafely(code);
      existing.returnedValue = cloneObjectSafely(returnedValue);
      existing.calls++;
      existing.usesLocalScope = usesLocalScope;
    } else {
      this.evalHistory.set(callstack.traceId, {
        calls: 1,
        code: cloneObjectSafely(code),
        returnedValue: cloneObjectSafely(returnedValue),
        usesLocalScope,
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.#getTraceDomain(callstack.trace[0]),
      });
    }
  }

  updateRafHistory(handler: number, callstack: TCallstack) {
    const existing = this.rafHistory.get(callstack.traceId);

    if (existing) {
      existing.calls++;
      existing.handler = handler;
    } else {
      this.rafHistory.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.#getTraceDomain(callstack.trace[0]),
        calls: 1,
        handler,
      });
    }
  }

  updateCafHistory(handler: number | string, callstack: TCallstack) {
    const existing = this.cafHistory.get(callstack.traceId);
    const hasError = !this.#validTimerHandler(handler);

    if (hasError) {
      handler = TAG_EXCEPTION(handler);
    }

    if (existing) {
      existing.calls++;
      existing.handler = handler;
      existing.hasError = hasError;
    } else {
      this.cafHistory.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.#getTraceDomain(callstack.trace[0]),
        calls: 1,
        handler,
        hasError,
      });
    }
  }

  ricOffline(deadline: IdleDeadline, callstack: TCallstack) {
    const record = this.ricHistory.get(callstack.traceId);

    if (record) {
      this.onlineIdleCallbackLookup.delete(Number(record.handler));

      record.didTimeout = deadline.didTimeout;
      record.isOnline = false;
    }
  }

  updateRicHistory(
    handler: number,
    delay: number | undefined | string,
    callstack: TCallstack
  ) {
    const existing = this.ricHistory.get(callstack.traceId);
    const hasError = !this.#validTimerDelay(delay);

    if (hasError) {
      delay = TAG_EXCEPTION(delay);
    }

    if (existing) {
      existing.calls++;
      existing.handler = handler;
      existing.didTimeout = undefined;
      existing.delay = delay;
      existing.hasError = hasError;
      existing.isOnline = true;
    } else {
      this.ricHistory.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.#getTraceDomain(callstack.trace[0]),
        calls: 1,
        handler,
        didTimeout: undefined,
        delay,
        hasError,
        isOnline: true,
        canceledByTraceIds: null,
      });
    }

    this.onlineIdleCallbackLookup.set(handler, callstack.traceId);
  }

  updateCicHistory(handler: number | string, callstack: TCallstack) {
    const existing = this.cicHistory.get(callstack.traceId);
    const hasError = !this.#validTimerHandler(handler);

    if (hasError) {
      handler = TAG_EXCEPTION(handler);
    }

    if (existing) {
      existing.calls++;
      existing.handler = handler;
      existing.hasError = hasError;
    } else {
      this.cicHistory.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.#getTraceDomain(callstack.trace[0]),
        calls: 1,
        handler,
        hasError,
      });
    }

    const ricTraceId = this.onlineIdleCallbackLookup.get(Number(handler));
    const ricRecord = ricTraceId && this.ricHistory.get(ricTraceId);
    if (ricRecord) {
      this.onlineIdleCallbackLookup.delete(Number(handler));

      ricRecord.isOnline = false;
      ricRecord.didTimeout = undefined;
      if (ricRecord.canceledByTraceIds === null) {
        ricRecord.canceledByTraceIds = [callstack.traceId];
      } else if (!ricRecord.canceledByTraceIds.includes(callstack.traceId)) {
        ricRecord.canceledByTraceIds.push(callstack.traceId);
      }
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
      evalHistory: panels.eval ? Array.from(this.evalHistory.values()) : null,
      onlineTimers: panels.activeTimers
        ? Array.from(this.onlineTimers.values())
        : null,
      setTimeoutHistory: panels.setTimeout
        ? Array.from(this.setTimeoutHistory.values())
        : null,
      clearTimeoutHistory: panels.clearTimeout
        ? Array.from(this.clearTimeoutHistory.values())
        : null,
      setIntervalHistory: panels.setInterval
        ? Array.from(this.setIntervalHistory.values())
        : null,
      clearIntervalHistory: panels.clearInterval
        ? Array.from(this.clearIntervalHistory.values())
        : null,
      rafHistory: panels.requestAnimationFrame
        ? Array.from(this.rafHistory.values())
        : null,
      cafHistory: panels.cancelAnimationFrame
        ? Array.from(this.cafHistory.values())
        : null,
      ricHistory: panels.requestIdleCallback
        ? Array.from(this.ricHistory.values())
        : null,
      cicHistory: panels.cancelIdleCallback
        ? Array.from(this.cicHistory.values())
        : null,
      callCounter: this.callCounter,
    };
  }

  unwrapApis() {
    window.eval = this.native.eval;
    window.setTimeout = this.native.setTimeout;
    window.clearTimeout = this.native.clearTimeout;
    window.setInterval = this.native.setInterval;
    window.clearInterval = this.native.clearInterval;
    window.requestAnimationFrame = this.native.requestAnimationFrame;
    window.cancelAnimationFrame = this.native.cancelAnimationFrame;
    window.requestIdleCallback = this.native.requestIdleCallback;
    window.cancelIdleCallback = this.native.cancelIdleCallback;
  }

  wrapApis() {
    this.wrapEval();
    this.wrapTimers();
    this.wrapAnimation();
    this.wrapIdleCallback();
  }

  wrapIdleCallback() {
    window.requestIdleCallback = function requestIdleCallback(
      this: Wrapper,
      fn: IdleRequestCallback,
      options?: IdleRequestOptions | undefined
    ) {
      this.callCounter.requestIdleCallback++;

      const delay = options?.timeout;
      const callstack = this.createCallstack(
        new Error(TRACE_ERROR_MESSAGE),
        fn
      );
      const handler = this.native.requestIdleCallback((deadline) => {
        this.ricOffline(deadline, callstack);
        fn(deadline);
      }, options);

      this.updateRicHistory(handler, delay, callstack);

      return handler;
    }.bind(this);

    window.cancelIdleCallback = function cancelIdleCallback(
      this: Wrapper,
      handler: number
    ) {
      this.updateCicHistory(
        handler,
        this.createCallstack(new Error(TRACE_ERROR_MESSAGE), false)
      );
      this.callCounter.cancelIdleCallback++;
      this.native.cancelIdleCallback(handler);
    }.bind(this);
  }

  wrapAnimation() {
    window.requestAnimationFrame = function requestAnimationFrame(
      this: Wrapper,
      fn: FrameRequestCallback
    ) {
      this.callCounter.requestAnimationFrame++;
      const handler = this.native.requestAnimationFrame(fn);
      this.updateRafHistory(
        handler,
        this.createCallstack(new Error(TRACE_ERROR_MESSAGE), fn)
      );

      return handler;
    }.bind(this);

    window.cancelAnimationFrame = function cancelAnimationFrame(
      this: Wrapper,
      handler: number
    ) {
      this.updateCafHistory(
        handler,
        this.createCallstack(new Error(TRACE_ERROR_MESSAGE), false)
      );
      this.callCounter.cancelAnimationFrame++;
      this.native.cancelAnimationFrame(handler);
    }.bind(this);
  }

  wrapEval() {
    window.eval = function WrappedLessEval(this: Wrapper, code: string) {
      this.callCounter.eval++;
      let rv: unknown;
      let throwError = null;
      let usesLocalScope = false;

      try {
        rv = this.native.eval(code);
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

      this.updateEvalHistory(
        code,
        rv,
        this.createCallstack(new Error(TRACE_ERROR_MESSAGE), code),
        usesLocalScope
      );

      if (throwError) {
        throw throwError;
      }

      return rv;
    }.bind(this);
  }

  wrapTimers() {
    window.setTimeout = function setTimeout(
      this: Wrapper,
      code: TimerHandler,
      delay: number | undefined,
      ...args: any[]
    ) {
      const isEval = typeof code === 'string';
      const handler = this.native.setTimeout(
        (...params: any[]) => {
          this.timerOffline(handler, null);
          if (isEval) {
            // see https://developer.mozilla.org/docs/Web/API/setTimeout#code
            this.native.eval(code);
          } else {
            code(...params);
          }
        },
        delay,
        ...args
      );
      const callstack = this.createCallstack(
        new Error(TRACE_ERROR_MESSAGE),
        code
      );

      this.callCounter.setTimeout++;
      this.timerOnline(ETimerType.TIMEOUT, handler, delay, callstack, isEval);
      this.updateSetTimersHistory(
        this.setTimeoutHistory,
        handler,
        delay,
        callstack,
        isEval
      );
      if (isEval) {
        this.callCounter.eval++;
        this.updateEvalHistory(
          code,
          TAG_EVAL_RETURN_SET_TIMEOUT,
          callstack,
          false
        );
      }

      return handler;
    }.bind(this);

    window.clearTimeout = function clearTimeout(
      this: Wrapper,
      handler: number | undefined
    ) {
      const callstack = this.createCallstack(
        new Error(TRACE_ERROR_MESSAGE),
        false
      );
      this.updateClearTimersHistory(
        this.clearTimeoutHistory,
        handler,
        callstack
      );
      if (handler !== undefined) {
        this.timerOffline(handler, callstack.traceId);
      }

      this.callCounter.clearTimeout++;
      this.native.clearTimeout(handler);
    }.bind(this);

    window.setInterval = function setInterval(
      this: Wrapper,
      code: TimerHandler,
      delay: number | undefined,
      ...args: any[]
    ) {
      const isEval = typeof code === 'string';
      const handler = this.native.setInterval(
        (...params: any[]) => {
          if (isEval) {
            // see https://developer.mozilla.org/docs/Web/API/setInterval
            this.native.eval(code);
          } else {
            code(...params);
          }
        },
        delay,
        ...args
      );
      const callstack = this.createCallstack(
        new Error(TRACE_ERROR_MESSAGE),
        code
      );

      this.callCounter.setInterval++;
      this.timerOnline(ETimerType.INTERVAL, handler, delay, callstack, isEval);
      this.updateSetTimersHistory(
        this.setIntervalHistory,
        handler,
        delay,
        callstack,
        isEval
      );
      if (isEval) {
        this.callCounter.eval++;
        this.updateEvalHistory(
          code,
          TAG_EVAL_RETURN_SET_INTERVAL,
          callstack,
          false
        );
      }

      return handler;
    }.bind(this);

    window.clearInterval = function clearInterval(
      this: Wrapper,
      handler: number | undefined
    ) {
      const callstack = this.createCallstack(
        new Error(TRACE_ERROR_MESSAGE),
        false
      );
      this.updateClearTimersHistory(
        this.clearIntervalHistory,
        handler,
        callstack
      );
      if (handler !== undefined) {
        this.timerOffline(handler, callstack.traceId);
      }

      this.callCounter.clearInterval++;
      this.native.clearInterval(handler);
    }.bind(this);
  }

  createCallstack(e: Error, uniqueTrait: unknown): TCallstack {
    const trace: TTrace[] = [];
    const stack = e.stack?.split(REGEX_STACKTRACE_SPLIT) || [];
    let traceId = '';

    // loop from the end, excluding error name and self trace
    for (let n = stack.length - 1; n > 1; n--) {
      let v = stack[n];

      if (v.indexOf(this.selfTraceLink) >= 0) {
        continue;
      }

      const link = v.replace(REGEX_STACKTRACE_LINK, '$2').trim();

      if (link.startsWith('<anonymous>')) {
        continue;
      }

      let name = v.replace(REGEX_STACKTRACE_NAME, '$1').trim();

      trace.push({ name: name === link ? 0 : name, link });
      traceId += link;
    }

    if (!traceId.length) {
      traceId = String(uniqueTrait);

      let name: TTrace['name'] = 0;
      if (typeof uniqueTrait === 'function' && uniqueTrait.name) {
        name = uniqueTrait.name;
      }

      trace.push({
        name,
        link: TAG_INVALID_CALLSTACK_LINK,
      });
    }

    return { traceId: hashString(traceId), trace };
  }
}
