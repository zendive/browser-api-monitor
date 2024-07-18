import {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  lessEval,
  requestAnimationFrame,
  cancelAnimationFrame,
  REGEX_STACKTRACE_NAME,
  REGEX_STACKTRACE_LINK,
  TRACE_ERROR_MESSAGE,
  REGEX_STACKTRACE_SPLIT,
  REGEX_STACKTRACE_CLEAN_URL,
  REGEX_STACKTRACE_LINK_PROTOCOL,
  TAG_INVALID_CALLSTACK_LINK,
  SHA256_HEX_STRING_LENGTH,
} from '@/api/const.ts';
import { TAG_EXCEPTION, cloneObjectSafely } from '@/api/clone.ts';
import type { TPanelVisibilityMap } from '@/api/settings.ts';
import { sha256 } from 'js-sha256';
import type { TMediaMetrics } from './mediaMonitor';

export type TTrace = {
  name: string | 0;
  link: string;
};
type TCallstack = {
  traceId: string;
  trace: TTrace[];
};
export enum ETimerType {
  TIMEOUT = 0,
  INTERVAL = 1,
}
export enum ETraceDomain {
  LOCAL = 0,
  EXTERNAL = 1,
  UNKNOWN = 2,
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
export type TTimerHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  handler: number | string;
  delay: number | undefined | string;
  isEval: boolean | undefined;
  hasError: boolean;
  isOnline: boolean;
};
export type TEvalHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  returnedValue: any;
  code: any;
  usesLocalScope: boolean;
};
export type TAnimationHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  handler: number | undefined | string;
  hasError?: boolean;
};
export type TWrapperMetrics = {
  onlineTimers: TOnlineTimerMetrics[] | null;
  setTimeoutHistory: TTimerHistory[] | null;
  clearTimeoutHistory: TTimerHistory[] | null;
  setIntervalHistory: TTimerHistory[] | null;
  clearIntervalHistory: TTimerHistory[] | null;
  evalHistory: TEvalHistory[] | null;
  rafHistory: TAnimationHistory[] | null;
  cafHistory: TAnimationHistory[] | null;
};

export class Wrapper {
  onlineTimers: Map<number, TOnlineTimerMetrics> = new Map();
  setTimeoutHistory: Map<string, TTimerHistory> = new Map();
  clearTimeoutHistory: Map<string, TTimerHistory> = new Map();
  setIntervalHistory: Map<string, TTimerHistory> = new Map();
  clearIntervalHistory: Map<string, TTimerHistory> = new Map();
  evalHistory: Map<string, TEvalHistory> = new Map();
  rafHistory: Map<string, TAnimationHistory> = new Map();
  cafHistory: Map<string, TAnimationHistory> = new Map();
  callCounter = {
    setTimeout: 0,
    clearTimeout: 0,
    setInterval: 0,
    clearInterval: 0,
    eval: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
  };
  native = {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    eval: lessEval,
    requestAnimationFrame: requestAnimationFrame,
    cancelAnimationFrame: cancelAnimationFrame,
  };
  selfTraceLink = '';

  constructor() {
    this.#initSelfTrace();
  }

  #initSelfTrace() {
    const error = new Error(TRACE_ERROR_MESSAGE);
    this.selfTraceLink = (error?.stack || '')
      .split(REGEX_STACKTRACE_SPLIT)[1]
      .replace(REGEX_STACKTRACE_LINK, '$1')
      .replace(REGEX_STACKTRACE_CLEAN_URL, '$1');
  }

  #badTimerHandler(handler: unknown) {
    return !Number.isFinite(handler) || <number>handler < 1;
  }

  #badTimerDelay(delay: unknown) {
    return (
      (delay !== undefined && !Number.isFinite(delay)) ||
      (Number.isFinite(delay) && <number>delay < 0)
    );
  }

  #getTraceDomain(trace: TTrace) {
    if (trace.link.startsWith(location.origin)) {
      return ETraceDomain.LOCAL;
    } else if (REGEX_STACKTRACE_LINK_PROTOCOL.test(trace.link)) {
      return ETraceDomain.EXTERNAL;
    }

    return ETraceDomain.UNKNOWN;
  }

  timerOnline(
    type: ETimerType,
    handler: number,
    delay: number | undefined | string,
    callstack: TCallstack,
    isEval: boolean
  ) {
    if (this.#badTimerDelay(delay)) {
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

  timerOffline(handler: number) {
    const timer = this.onlineTimers.get(handler);
    if (!timer) {
      return;
    }

    const record =
      timer.type === ETimerType.TIMEOUT
        ? this.setTimeoutHistory.get(timer.traceId)
        : this.setIntervalHistory.get(timer.traceId);

    if (record) {
      record.isOnline = false;
    }

    this.onlineTimers.delete(handler);
  }

  updateSetTimersHistory(
    history: Map<string, TTimerHistory>,
    handler: number,
    delay: number | undefined,
    callstack: TCallstack,
    isEval: boolean
  ) {
    const existing = history.get(callstack.traceId);
    const hasError = this.#badTimerDelay(delay);
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
      });
    }
  }

  updateClearTimersHistory(
    history: Map<string, TTimerHistory>,
    handler: unknown,
    callstack: TCallstack
  ) {
    const existing = history.get(callstack.traceId);
    const hasError = this.#badTimerHandler(handler);
    const onlineTimer = hasError
      ? null
      : this.onlineTimers.get(<number>handler);
    let handlerDelay: string | number | undefined = 'N/A';
    let handlerIsEval = undefined;

    if (onlineTimer) {
      handlerDelay = onlineTimer.delay;
      handlerIsEval = onlineTimer.isEval;
    } else if (existing) {
      handlerDelay = existing.delay;
      handlerIsEval = existing.isEval;
    }

    if (hasError) {
      handler = TAG_EXCEPTION(handler);
    }

    if (existing) {
      existing.handler = <number | string>handler;
      existing.delay = handlerDelay;
      existing.calls++;
      existing.isEval = handlerIsEval;
      existing.hasError = hasError;
      existing.isOnline = false;
    } else {
      history.set(callstack.traceId, {
        handler: <number | string>handler,
        calls: 1,
        delay: handlerDelay,
        isEval: handlerIsEval,
        hasError,
        isOnline: false,
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
    const hasError = this.#badTimerHandler(handler);

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

  cleanHistory() {
    this.setTimeoutHistory.clear();
    this.clearTimeoutHistory.clear();
    this.setIntervalHistory.clear();
    this.clearIntervalHistory.clear();
    this.evalHistory.clear();
    this.callCounter.setTimeout =
      this.callCounter.clearTimeout =
      this.callCounter.setInterval =
      this.callCounter.clearInterval =
      this.callCounter.eval =
      this.callCounter.requestAnimationFrame =
      this.callCounter.cancelAnimationFrame =
        0;
  }

  collectWrapperMetrics(panels: TPanelVisibilityMap): TWrapperMetrics {
    return {
      onlineTimers: panels.activeTimers
        ? Array.from(this.onlineTimers.values())
        : null,
      setTimeoutHistory: panels.setTimeoutHistory
        ? Array.from(this.setTimeoutHistory.values())
        : null,
      clearTimeoutHistory: panels.clearTimeoutHistory
        ? Array.from(this.clearTimeoutHistory.values())
        : null,
      setIntervalHistory: panels.setIntervalHistory
        ? Array.from(this.setIntervalHistory.values())
        : null,
      clearIntervalHistory: panels.clearIntervalHistory
        ? Array.from(this.clearIntervalHistory.values())
        : null,
      evalHistory: panels.eval ? Array.from(this.evalHistory.values()) : null,
      rafHistory: panels.requestAnimationFrame
        ? Array.from(this.rafHistory.values())
        : null,
      cafHistory: panels.cancelAnimationFrame
        ? Array.from(this.cafHistory.values())
        : null,
    };
  }

  unwrapApis() {
    window.setTimeout = this.native.setTimeout;
    window.clearTimeout = this.native.clearTimeout;
    window.setInterval = this.native.setInterval;
    window.clearInterval = this.native.clearInterval;
    window.eval = this.native.eval;
    window.requestAnimationFrame = this.native.requestAnimationFrame;
    window.cancelAnimationFrame = this.native.cancelAnimationFrame;
  }

  wrapApis() {
    this.wrapTimers();
    this.wrapEval();
    this.wrapAnimation();
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
          this.timerOffline(handler);
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
          '(N/A - via setTimeout)',
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
      this.updateClearTimersHistory(
        this.clearTimeoutHistory,
        handler,
        this.createCallstack(new Error(TRACE_ERROR_MESSAGE), false)
      );
      if (handler !== undefined) {
        this.timerOffline(handler);
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
          '(N/A - via setInterval)',
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
      this.updateClearTimersHistory(
        this.clearIntervalHistory,
        handler,
        this.createCallstack(new Error(TRACE_ERROR_MESSAGE), false)
      );
      if (handler !== undefined) {
        this.timerOffline(handler);
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

      const link = v.replace(REGEX_STACKTRACE_LINK, '$1').trim();

      if (link.startsWith('<anonymous>')) {
        continue;
      }

      let name = v.replace(REGEX_STACKTRACE_NAME, '$1').trim();

      trace.push({ name: name === link ? 0 : name, link });
      traceId += link;
    }

    if (!trace.length) {
      let name: TTrace['name'] = 0;

      if (typeof uniqueTrait === 'function') {
        name = uniqueTrait.name || 0;
        traceId = sha256(String(uniqueTrait));
      } else {
        traceId = String(uniqueTrait);
      }

      trace.push({
        name,
        link: TAG_INVALID_CALLSTACK_LINK,
      });
    }

    if (traceId.length > SHA256_HEX_STRING_LENGTH) {
      traceId = sha256(traceId);
    }

    return { traceId, trace };
  }
}
