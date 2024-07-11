import {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  lessEval,
  REGEX_STACKTRACE_NAME,
  REGEX_STACKTRACE_LINK,
  TRACE_ERROR_MESSAGE,
  REGEX_STACKTRACE_SPLIT,
  REGEX_STACKTRACE_CLEAN_URL,
  TAG_INVALID_CALLSTACK_LINK,
  SHA256_HEX_STRING_LENGTH,
} from '@/api/const.ts';
import { TAG_EXCEPTION, cloneObjectSafely } from '@/api/clone.ts';
import type { TPanelVisibilityMap } from '@/api/settings.ts';
import { sha256 } from 'js-sha256';

export type TTrace = {
  name: string | 0;
  link: string;
};
type TCallstack = {
  traceId: string;
  trace: TTrace[];
};
export enum ETimeType {
  TIMEOUT,
  INTERVAL,
}
export type TOnlineTimerMetrics = {
  traceId: string;
  trace: TTrace[];
  type: ETimeType;
  delay: number | undefined | string;
  handler: number;
  isEval: boolean;
};
export type TTimerHistory = {
  traceId: string;
  trace: TTrace[];
  individualInvocations: number;
  recentHandler: number | string;
  handlerDelay: number | undefined | string;
  isEval: boolean | undefined;
  hasError: boolean;
};
export type TEvalHistory = {
  traceId: string;
  trace: TTrace[];
  individualInvocations: number;
  returnedValue: any;
  code: any;
  usesLocalScope: boolean;
};
export type TWrapperMetrics = {
  onlineTimers: number;
  onlineTimeouts: TOnlineTimerMetrics[];
  onlineIntervals: TOnlineTimerMetrics[];
  setTimeoutHistory: TTimerHistory[];
  clearTimeoutHistory: TTimerHistory[];
  setIntervalHistory: TTimerHistory[];
  clearIntervalHistory: TTimerHistory[];
  evalHistory: TEvalHistory[];
};

export class Wrapper {
  onlineTimers: Map<number, TOnlineTimerMetrics> = new Map();
  setTimeoutHistory: Map<string, TTimerHistory> = new Map();
  clearTimeoutHistory: Map<string, TTimerHistory> = new Map();
  setIntervalHistory: Map<string, TTimerHistory> = new Map();
  clearIntervalHistory: Map<string, TTimerHistory> = new Map();
  evalHistory: Map<string, TEvalHistory> = new Map();
  callCounter = {
    setTimeout: 0,
    clearTimeout: 0,
    setInterval: 0,
    clearInterval: 0,
    eval: 0,
  };
  native = {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    eval: lessEval,
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

  timerOnline(
    type: ETimeType,
    handler: number,
    delay: number | undefined | string,
    callstack: TCallstack,
    isEval: boolean
  ) {
    if (this.#badTimerDelay(delay)) {
      delay = TAG_EXCEPTION(`${delay}`);
    }
    this.onlineTimers.set(handler, {
      type,
      handler,
      delay,
      isEval,
      traceId: callstack.traceId,
      trace: callstack.trace,
    });
  }

  timerOffline(handler: number) {
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
      handlerDelay = TAG_EXCEPTION(`${handlerDelay}`);
    }

    if (existing) {
      existing.recentHandler = handler;
      existing.handlerDelay = handlerDelay;
      existing.individualInvocations++;
      existing.isEval = isEval;
      existing.hasError = hasError;
    } else {
      history.set(callstack.traceId, {
        recentHandler: handler,
        individualInvocations: 1,
        handlerDelay,
        isEval,
        hasError,
        traceId: callstack.traceId,
        trace: callstack.trace,
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
      handlerDelay = existing.handlerDelay;
      handlerIsEval = existing.isEval;
    }

    if (hasError) {
      handler = TAG_EXCEPTION(`${handler}`);
    }

    if (existing) {
      existing.recentHandler = <number | string>handler;
      existing.handlerDelay = handlerDelay;
      existing.individualInvocations++;
      existing.isEval = handlerIsEval;
      existing.hasError = hasError;
    } else {
      history.set(callstack.traceId, {
        recentHandler: <number | string>handler,
        individualInvocations: 1,
        handlerDelay,
        isEval: handlerIsEval,
        hasError,
        traceId: callstack.traceId,
        trace: callstack.trace,
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
      existing.individualInvocations++;
      existing.usesLocalScope = usesLocalScope;
    } else {
      this.evalHistory.set(callstack.traceId, {
        individualInvocations: 1,
        code: cloneObjectSafely(code),
        returnedValue: cloneObjectSafely(returnedValue),
        usesLocalScope,
        traceId: callstack.traceId,
        trace: callstack.trace,
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
        0;
  }

  collectWrapperMetrics(panels: TPanelVisibilityMap): TWrapperMetrics {
    const timeouts: TOnlineTimerMetrics[] = [];
    const intervals: TOnlineTimerMetrics[] = [];
    const rv = {
      onlineTimers: this.onlineTimers.size,
      onlineTimeouts: timeouts,
      onlineIntervals: intervals,
      setTimeoutHistory: panels.setTimeoutHistory
        ? [...this.setTimeoutHistory.values()]
        : [],
      clearTimeoutHistory: panels.clearTimeoutHistory
        ? [...this.clearTimeoutHistory.values()]
        : [],
      setIntervalHistory: panels.setIntervalHistory
        ? [...this.setIntervalHistory.values()]
        : [],
      clearIntervalHistory: panels.clearIntervalHistory
        ? [...this.clearIntervalHistory.values()]
        : [],
      evalHistory: panels.eval ? [...this.evalHistory.values()] : [],
    };

    if (panels.activeTimers) {
      for (const timer of this.onlineTimers.values()) {
        if (timer.type === ETimeType.INTERVAL) {
          intervals.push(timer);
        } else {
          timeouts.push(timer);
        }
      }
    }

    return rv;
  }

  unwrapApis() {
    window.setTimeout = this.native.setTimeout;
    window.clearTimeout = this.native.clearTimeout;
    window.setInterval = this.native.setInterval;
    window.clearInterval = this.native.clearInterval;
    window.eval = this.native.eval;
  }

  wrapApis() {
    this.wrapTimers();
    this.wrapEval();
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
        this.createCallstack(new Error(TRACE_ERROR_MESSAGE)),
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
      this.timerOnline(ETimeType.TIMEOUT, handler, delay, callstack, isEval);
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
        this.createCallstack(new Error(TRACE_ERROR_MESSAGE))
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
      this.timerOnline(ETimeType.INTERVAL, handler, delay, callstack, isEval);
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
        this.createCallstack(new Error(TRACE_ERROR_MESSAGE))
      );
      if (handler !== undefined) {
        this.timerOffline(handler);
      }

      this.callCounter.clearInterval++;
      this.native.clearInterval(handler);
    }.bind(this);
  }

  createCallstack(e: Error, fn?: unknown): TCallstack {
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
      let name: TTrace['name'];
      if (typeof fn === 'function' && fn.name) {
        name = fn.name;
        traceId = name;
      } else {
        name = 0;

        if (typeof crypto.randomUUID === 'function') {
          traceId = crypto.randomUUID();
        } else {
          traceId = Math.random().toString(36);
        }
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
