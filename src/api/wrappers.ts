import {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  REGEX_STACKTRACE_NAME,
  REGEX_STACKTRACE_LINK,
  TRACE_ERROR_MESSAGE,
  REGEX_STACKTRACE_PREFIX,
  REGEX_STACKTRACE_CLEAN_URL,
} from '@/api/const';
import { cloneObjectSafely } from './clone';

export type TCallstack = {
  name: string;
  link: string;
};
export type TActiveTimerMetrics = {
  delay: number;
  handler: number;
  trace: TCallstack[];
  rawTrace?: string; // for debugging
};
export type TTimerHistory = {
  traceId: string;
  individualInvocations: number;
  recentHandler: number;
  handlerDelay: number | undefined;
  trace: TCallstack[];
};
export type TEvalMetrics = {
  traceId: string;
  trace: TCallstack[];
  individualInvocations: number;
  returnedValue: any;
  code: any;
};

type TOnlineTimer = [isInterval: boolean, metrics: TActiveTimerMetrics];

let selfCallLink = '';
function createCallstack(e: Error): TCallstack[] {
  const arr = e.stack?.split('\n') || [];

  if (!selfCallLink) {
    selfCallLink = arr[1]
      .replace(REGEX_STACKTRACE_LINK, '$1')
      .replace(REGEX_STACKTRACE_CLEAN_URL, '$1');
  }

  arr.splice(0, 2); // remove error message and first self call

  const trace: TCallstack[] = [];
  for (let v of arr) {
    v = v.replace(REGEX_STACKTRACE_PREFIX, '');
    const link = v.replace(REGEX_STACKTRACE_LINK, '$1').trim();

    // skip self references, that some times happen
    if (link.indexOf(selfCallLink) >= 0) {
      continue;
    }

    trace.push({
      name: v.replace(REGEX_STACKTRACE_NAME, '$1').trim(),
      link,
    });
  }

  return trace;
}

const lessEval = eval; // https://rollupjs.org/troubleshooting/#avoiding-eval

export class Wrapper {
  onlineTimers: TOnlineTimer[] = [];
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
    isInterval: boolean,
    handler: number,
    delay: number | undefined = 0,
    stubError: Error
  ) {
    this.onlineTimers.push([
      isInterval,
      {
        handler,
        delay,
        trace: createCallstack(stubError),
        //rawTrace: stubError.stack, // uncomment to debug errors in trace
      },
    ]);
  }

  timerOffline(handler?: number) {
    this.onlineTimers = this.onlineTimers.filter(
      ([, timerMetric]) => timerMetric.handler !== handler
    );
  }

  updateHistory(history: TTimerHistory[], handler: number, stubError: Error) {
    const trace = createCallstack(stubError);
    const traceId = trace.map((v) => v.link).join('');
    let handlerDelay;
    const existing = history.find((v) => v.traceId === traceId);
    const onlineTimer = this.onlineTimers.find(
      ([, t]) => t.handler === handler
    );

    if (onlineTimer) {
      handlerDelay = onlineTimer[1].delay;
    } else if (existing) {
      handlerDelay = existing.handlerDelay;
    }

    if (existing) {
      existing.recentHandler = handler;
      existing.handlerDelay = handlerDelay;
      existing.individualInvocations++;
    } else {
      history.push({
        traceId,
        recentHandler: handler,
        individualInvocations: 1,
        handlerDelay,
        trace,
      });
      history.sort((a, b) => (b.handlerDelay || 0) - (a.handlerDelay || 0));
    }
  }

  updateEvalHistory(code: string, returnedValue: any, error: Error) {
    const trace = createCallstack(error);
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
    const timeouts: TActiveTimerMetrics[] = [];
    const intervals: TActiveTimerMetrics[] = [];

    for (const usage of this.onlineTimers) {
      if (usage[0]) {
        intervals.push(usage[1]);
      } else {
        timeouts.push(usage[1]);
      }
    }

    return {
      onlineTimeouts: timeouts.sort((a, b) => b.delay - a.delay), // sort by delay descending
      onlineIntervals: intervals.sort((a, b) => b.delay - a.delay),
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
    const self = this;
    window.eval = function WrappedLessEval(code: string) {
      self.callCounter.eval++;
      const rv = self.native.eval(code);
      void self.updateEvalHistory(code, rv, new Error(TRACE_ERROR_MESSAGE));
      return rv;
    };
  }

  wrapTimers() {
    const self = this;

    window.setTimeout = function setTimeout(code, delay, ...args) {
      self.callCounter.setTimeout++;

      const handler = self.native.setTimeout(
        (...params: any[]) => {
          self.timerOffline(handler);
          if (typeof code === 'string') {
            // see https://developer.mozilla.org/docs/Web/API/setTimeout#code
            lessEval(code);
          } else {
            code(...params);
          }
        },
        delay,
        ...args
      );

      self.timerOnline(false, handler, delay, new Error(TRACE_ERROR_MESSAGE));
      self.updateHistory(
        self.setTimeoutHistory,
        handler,
        new Error(TRACE_ERROR_MESSAGE)
      );

      return handler;
    };

    window.clearTimeout = function clearTimeout(handler: number | undefined) {
      self.callCounter.clearTimeout++;

      if (handler !== undefined) {
        self.updateHistory(
          self.clearTimeoutHistory,
          handler,
          new Error(TRACE_ERROR_MESSAGE)
        );
        self.timerOffline(handler);
      }

      self.native.clearTimeout(handler);
    };

    window.setInterval = function setInterval(code, delay, ...args) {
      self.callCounter.setInterval++;

      const handler = self.native.setInterval(
        (...params: any[]) => {
          if (typeof code === 'string') {
            // see https://developer.mozilla.org/docs/Web/API/setInterval
            lessEval(code);
          } else {
            code(...params);
          }
        },
        delay,
        ...args
      );

      self.timerOnline(true, handler, delay, new Error(TRACE_ERROR_MESSAGE));
      self.updateHistory(
        self.setIntervalHistory,
        handler,
        new Error(TRACE_ERROR_MESSAGE)
      );

      return handler;
    };

    window.clearInterval = function clearInterval(handler: number | undefined) {
      self.callCounter.clearInterval++;

      if (handler !== undefined) {
        self.updateHistory(
          self.clearIntervalHistory,
          handler,
          new Error(TRACE_ERROR_MESSAGE)
        );
        self.timerOffline(handler);
      }

      self.native.clearInterval(handler);
    };
  }
}
