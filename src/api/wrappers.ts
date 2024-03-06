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
} from '@/api/const';
import { cloneObjectSafely } from './clone';

export type TCallstack = {
  /** function name */
  name: string;
  /** link to source */
  link: string;
}[];
enum ETimeType {
  TIMEOUT,
  INTERVAL,
}
export type TOnlineTimerMetrics = {
  type: ETimeType;
  delay: number;
  handler: number;
  trace: TCallstack;
  isEval: boolean;
  rawTrace?: string; // for debugging
};
export type TTimerHistory = {
  traceId: string;
  individualInvocations: number;
  recentHandler: number;
  handlerDelay: number | undefined;
  trace: TCallstack;
  isEval: boolean | undefined;
};
export type TEvalMetrics = {
  traceId: string;
  trace: TCallstack;
  individualInvocations: number;
  returnedValue: any;
  code: any;
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

  // start from second row
  for (let i = 1, I = arr.length; i < I; i++) {
    let v = arr[i];
    v = v.replace(REGEX_STACKTRACE_PREFIX, '');
    const link = v.replace(REGEX_STACKTRACE_LINK, '$1').trim();

    // skip self references at the beginning, and some times at the end
    if (link.indexOf(selfCallLink) >= 0) {
      continue;
    }

    rv.push({
      name: v.replace(REGEX_STACKTRACE_NAME, '$1').trim(),
      link,
    });
  }

  if (!rv.length) {
    rv.push({ name: `N/A`, link: crypto.randomUUID() });
  }

  return rv;
}

export class Wrapper {
  onlineTimers: TOnlineTimers = new Map();
  setTimeoutHistory: TTimerHistory[] = [];
  clearTimeoutHistory: TTimerHistory[] = [];
  setIntervalHistory: TTimerHistory[] = [];
  clearIntervalHistory: TTimerHistory[] = [];
  evalHistory: TEvalMetrics[] = [];
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
    delay: number | undefined = 0,
    trace: TCallstack,
    isEval: boolean
  ) {
    this.onlineTimers.set(handler, {
      type,
      handler,
      delay,
      trace,
      isEval,
      //rawTrace: stubError.stack, // uncomment to debug errors in trace
    });
  }

  timerOffline(handler: number) {
    this.onlineTimers.delete(handler);
  }

  updateHistory(
    history: TTimerHistory[],
    handler: number,
    trace: TCallstack,
    isEval: boolean | undefined
  ) {
    const traceId = trace.map((v) => v.link).join('');
    let handlerDelay;
    let handlerIsEval = isEval;
    const existing = history.findLast((v) => v.traceId === traceId);
    const onlineTimer = this.onlineTimers.get(handler);

    if (isEval === undefined) {
      if (onlineTimer) {
        handlerIsEval = onlineTimer.isEval;
      } else if (existing) {
        handlerIsEval = existing.isEval;
      }
    }

    if (onlineTimer) {
      handlerDelay = onlineTimer.delay;
    } else if (existing) {
      handlerDelay = existing.handlerDelay;
    }

    if (existing) {
      existing.recentHandler = handler;
      existing.handlerDelay = handlerDelay;
      existing.individualInvocations++;
      existing.isEval = handlerIsEval;
    } else {
      history.push({
        traceId,
        recentHandler: handler,
        individualInvocations: 1,
        handlerDelay,
        trace,
        isEval: handlerIsEval,
      });
      history.sort((a, b) => (b.handlerDelay || 0) - (a.handlerDelay || 0));
    }
  }

  updateEvalHistory(code: string, returnedValue: any, trace: TCallstack) {
    const traceId = trace.map((v) => v.link).join('');
    const existing = this.evalHistory.find((v) => v.traceId === traceId);

    if (existing) {
      existing.code = cloneObjectSafely(code);
      existing.returnedValue = cloneObjectSafely(returnedValue);
      existing.individualInvocations++;
    } else {
      this.evalHistory.push({
        individualInvocations: 1,
        code: cloneObjectSafely(code),
        returnedValue: cloneObjectSafely(returnedValue),
        trace,
        traceId,
      });
    }
  }

  cleanHistory(what?: string[]) {
    if (!what || !what.length) {
      // clean all
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

  collectTimersMetrics() {
    const timeouts: TOnlineTimerMetrics[] = [];
    const intervals: TOnlineTimerMetrics[] = [];

    for (const [, timer] of this.onlineTimers) {
      if (timer.type === ETimeType.INTERVAL) {
        intervals.push(timer);
      } else {
        timeouts.push(timer);
      }
    }

    return {
      onlineTimeouts: timeouts,
      onlineIntervals: intervals,
      setTimeoutHistory: this.setTimeoutHistory,
      clearTimeoutHistory: this.clearTimeoutHistory,
      setIntervalHistory: this.setIntervalHistory,
      clearIntervalHistory: this.clearIntervalHistory,
    };
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
      const rv = this.native.eval(code);

      this.callCounter.eval++;
      const trace = createCallstack(new Error(TRACE_ERROR_MESSAGE));
      this.updateEvalHistory(code, rv, trace);

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
      this.updateHistory(this.setTimeoutHistory, handler, trace, isEval);
      if (isEval) {
        this.updateEvalHistory(code, '(N/A - via setTimeout)', trace);
      }

      return handler;
    }.bind(this);

    window.clearTimeout = function clearTimeout(
      this: Wrapper,
      handler: number | undefined
    ) {
      if (handler !== undefined) {
        this.updateHistory(
          this.clearTimeoutHistory,
          handler,
          createCallstack(new Error(TRACE_ERROR_MESSAGE)),
          undefined
        );
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
      this.updateHistory(this.setIntervalHistory, handler, trace, isEval);
      if (isEval) {
        this.updateEvalHistory(code, '(N/A - via setInterval)', trace);
      }

      return handler;
    }.bind(this);

    window.clearInterval = function clearInterval(
      this: Wrapper,
      handler: number | undefined
    ) {
      if (handler !== undefined) {
        this.updateHistory(
          this.clearIntervalHistory,
          handler,
          createCallstack(new Error(TRACE_ERROR_MESSAGE)),
          undefined
        );
        this.timerOffline(handler);
      }

      this.callCounter.clearInterval++;
      this.native.clearInterval(handler);
    }.bind(this);
  }
}
