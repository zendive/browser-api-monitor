import {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  lessEval,
  REGEX_STACKTRACE_NAME,
  REGEX_STACKTRACE_LINK,
  TRACE_ERROR_MESSAGE,
  REGEX_STACKTRACE_PREFIX,
  REGEX_STACKTRACE_CLEAN_URL,
  TAG_INVALID_CALLSTACK,
} from '@/api/const.ts';
import { cloneObjectSafely } from './clone.ts';
import { TPanelVisibilityMap } from './settings.ts';

export type TCallstack = {
  name: string;
  link: string;
}[];
export enum ETimeType {
  TIMEOUT,
  INTERVAL,
}
export type TOnlineTimerMetrics = {
  type: ETimeType;
  delay: number | undefined;
  handler: number;
  trace: TCallstack;
  isEval: boolean;
  rawTrace?: string; // for debugging
};
export type TTimerHistory = {
  traceId: string;
  individualInvocations: number;
  recentHandler: number | string;
  handlerDelay: number | undefined | string;
  trace: TCallstack;
  isEval: boolean | undefined;
  hasError: boolean;
};
export type TEvalHistory = {
  traceId: string;
  trace: TCallstack;
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

type TOnlineTimers = Map<number, TOnlineTimerMetrics>;

let selfCallLink = '';
function createCallstack(e: Error): TCallstack {
  const rv: TCallstack = [];
  const arr = e.stack?.split('\n') || [];

  if (!selfCallLink) {
    const link = arr[1]
      .replace(REGEX_STACKTRACE_LINK, '$1')
      .replace(REGEX_STACKTRACE_CLEAN_URL, '$1');
    if (link) {
      selfCallLink = link;
    }
  }

  for (let i = 1, I = arr.length; i < I; i++) {
    let v = arr[i];
    v = v.replace(REGEX_STACKTRACE_PREFIX, '');
    const link = v.replace(REGEX_STACKTRACE_LINK, '$1').trim();

    if (link.indexOf(selfCallLink) >= 0) {
      continue;
    }

    rv.push({
      name: v.replace(REGEX_STACKTRACE_NAME, '$1').trim(),
      link,
    });
  }

  if (!rv.length) {
    rv.push({
      name: TAG_INVALID_CALLSTACK,
      link: `(id: ${crypto.randomUUID()})`,
    });
  }

  return rv;
}
function createTraceId(trace: TCallstack) {
  return trace
    .reverse()
    .map((v) => v.link)
    .join('');
}

export class Wrapper {
  onlineTimers: TOnlineTimers = new Map();
  setTimeoutHistory: TTimerHistory[] = [];
  clearTimeoutHistory: TTimerHistory[] = [];
  setIntervalHistory: TTimerHistory[] = [];
  clearIntervalHistory: TTimerHistory[] = [];
  evalHistory: TEvalHistory[] = [];
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

  constructor() {}

  timerOnline(
    type: ETimeType,
    handler: number,
    delay: number | undefined,
    trace: TCallstack,
    isEval: boolean
  ) {
    this.onlineTimers.set(handler, {
      type,
      handler,
      delay,
      trace,
      isEval,
      //rawTrace
    });
  }

  timerOffline(handler: number) {
    this.onlineTimers.delete(handler);
  }

  #badTimerHandler(handler: unknown) {
    const rv = !Number.isFinite(handler) || <number>handler < 1;

    return rv;
  }

  #badTimerDelay(delay: unknown) {
    const rv =
      (delay !== undefined && !Number.isFinite(delay)) ||
      (Number.isFinite(delay) && <number>delay < 0);

    return rv;
  }

  updateSetTimersHistory(
    history: TTimerHistory[],
    handler: number,
    delay: number | undefined,
    trace: TCallstack,
    isEval: boolean
  ) {
    const traceId = createTraceId(trace);
    const existing = history.findLast((v) => v.traceId === traceId);
    const hasError = this.#badTimerDelay(delay);
    let handlerDelay: string | number | undefined = delay;

    if (hasError) {
      handlerDelay = `⁉️ ⟪${handlerDelay}⟫`;
    }

    if (existing) {
      existing.recentHandler = handler;
      existing.handlerDelay = handlerDelay;
      existing.individualInvocations++;
      existing.isEval = isEval;
      existing.hasError = hasError;
    } else {
      history.push({
        traceId,
        recentHandler: handler,
        individualInvocations: 1,
        handlerDelay,
        trace,
        isEval,
        hasError,
      });
      history.sort((a, b) =>
        (b.handlerDelay || 0) > (a.handlerDelay || 0) ? 1 : -1
      );
    }
  }

  updateClearTimersHistory(
    history: TTimerHistory[],
    handler: unknown,
    trace: TCallstack
  ) {
    const traceId = createTraceId(trace);
    const existing = history.findLast((v) => v.traceId === traceId);
    const hasError = this.#badTimerHandler(handler);
    const onlineTimer = !hasError
      ? this.onlineTimers.get(<number>handler)
      : null;
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
      handler = `⁉️ ⟪${handler}⟫`;
    }

    if (existing) {
      existing.recentHandler = <number | string>handler;
      existing.handlerDelay = handlerDelay;
      existing.individualInvocations++;
      existing.isEval = handlerIsEval;
      existing.hasError = hasError;
    } else {
      history.push({
        traceId,
        recentHandler: <number | string>handler,
        individualInvocations: 1,
        handlerDelay,
        trace,
        isEval: handlerIsEval,
        hasError,
      });
      history.sort((a, b) =>
        (b.handlerDelay || 0) > (a.handlerDelay || 0) ? 1 : -1
      );
    }
  }

  updateEvalHistory(
    code: string,
    returnedValue: any,
    trace: TCallstack,
    usesLocalScope: boolean
  ) {
    const traceId = createTraceId(trace);
    const existing = this.evalHistory.find((v) => v.traceId === traceId);

    if (existing) {
      existing.code = cloneObjectSafely(code);
      existing.returnedValue = cloneObjectSafely(returnedValue);
      existing.individualInvocations++;
      existing.usesLocalScope = usesLocalScope;
    } else {
      this.evalHistory.push({
        individualInvocations: 1,
        code: cloneObjectSafely(code),
        returnedValue: cloneObjectSafely(returnedValue),
        trace,
        traceId,
        usesLocalScope,
      });
    }
  }

  cleanHistory(what?: string[]) {
    if (!what || !what.length) {
      this.setTimeoutHistory.splice(0);
      this.clearTimeoutHistory.splice(0);
      this.setIntervalHistory.splice(0);
      this.clearIntervalHistory.splice(0);
      this.evalHistory.splice(0);
      this.callCounter.setTimeout =
        this.callCounter.clearTimeout =
        this.callCounter.setInterval =
        this.callCounter.clearInterval =
        this.callCounter.eval =
          0;
    }
  }

  collectWrapperMetrics(panels: TPanelVisibilityMap): TWrapperMetrics {
    const timeouts: TOnlineTimerMetrics[] = [];
    const intervals: TOnlineTimerMetrics[] = [];
    const rv = {
      onlineTimers: this.onlineTimers.size,
      onlineTimeouts: timeouts,
      onlineIntervals: intervals,
      setTimeoutHistory: panels.setTimeoutHistory ? this.setTimeoutHistory : [],
      clearTimeoutHistory: panels.clearTimeoutHistory
        ? this.clearTimeoutHistory
        : [],
      setIntervalHistory: panels.setIntervalHistory
        ? this.setIntervalHistory
        : [],
      clearIntervalHistory: panels.clearIntervalHistory
        ? this.clearIntervalHistory
        : [],
      evalHistory: panels.eval ? this.evalHistory : [],
    };

    if (panels.activeTimers) {
      for (const [, timer] of this.onlineTimers) {
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

      const trace = createCallstack(new Error(TRACE_ERROR_MESSAGE));
      this.updateEvalHistory(code, rv, trace, usesLocalScope);

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
      const trace = createCallstack(new Error(TRACE_ERROR_MESSAGE));

      this.callCounter.setTimeout++;
      this.timerOnline(ETimeType.TIMEOUT, handler, delay, trace, isEval);
      this.updateSetTimersHistory(
        this.setTimeoutHistory,
        handler,
        delay,
        trace,
        isEval
      );
      if (isEval) {
        this.callCounter.eval++;
        this.updateEvalHistory(code, '(N/A - via setTimeout)', trace, false);
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
        createCallstack(new Error(TRACE_ERROR_MESSAGE))
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
      const trace = createCallstack(new Error(TRACE_ERROR_MESSAGE));

      this.callCounter.setInterval++;
      this.timerOnline(ETimeType.INTERVAL, handler, delay, trace, isEval);
      this.updateSetTimersHistory(
        this.setIntervalHistory,
        handler,
        delay,
        trace,
        isEval
      );
      if (isEval) {
        this.callCounter.eval++;
        this.updateEvalHistory(code, '(N/A - via setInterval)', trace, false);
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
        createCallstack(new Error(TRACE_ERROR_MESSAGE))
      );
      if (handler !== undefined) {
        this.timerOffline(handler);
      }

      this.callCounter.clearInterval++;
      this.native.clearInterval(handler);
    }.bind(this);
  }
}
