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

export type TCallstack = {
  name: string;
  link: string;
};
export type TTimerMetrics = {
  delay: number;
  handler: number;
  trace: TCallstack[];
  rawTrace?: string; // for debugging
};
export type TClearTimerMetrics = {
  individualInvocations: number;
  recentHandler: number;
  handlerDelay: number | undefined;
  trace: TCallstack[];
  traceId: string;
};
export type TTimersUsages = [isInterval: boolean, descriptor: TTimerMetrics];

function createCallstack(e: Error): TCallstack[] {
  const arr = e.stack?.split('\n') || [];
  const selfCall = arr[1];
  const selfCallLink = selfCall
    .replace(REGEX_STACKTRACE_LINK, '$1')
    .trim()
    .replace(REGEX_STACKTRACE_CLEAN_URL, '$1')
    .trim();

  arr.splice(0, 2); // remove first self call

  const trace: TCallstack[] = [];
  for (let v of arr) {
    v = v.replace(REGEX_STACKTRACE_PREFIX, '');
    const link = v.replace(REGEX_STACKTRACE_LINK, '$1').trim();

    if (link.indexOf(selfCallLink) < 0) {
      trace.push({
        name: v.replace(REGEX_STACKTRACE_NAME, '$1').trim(),
        link,
      });
    }
  }

  return trace;
}

const lessEval = eval; // https://rollupjs.org/troubleshooting/#avoiding-eval

export class Wrapper {
  timersUsages: TTimersUsages[] = [];
  clearTimeoutsUsages: TClearTimerMetrics[] = [];
  clearIntervalUsages: TClearTimerMetrics[] = [];
  timers = {
    setTimeout: {
      native: setTimeout,
      invocations: 0,
    },
    clearTimeout: {
      native: clearTimeout,
      invocations: 0,
    },
    setInterval: {
      native: setInterval,
      invocations: 0,
    },
    clearInterval: {
      native: clearInterval,
      invocations: 0,
    },
  };
  danger = {
    eval: {
      navite: lessEval,
      invocations: 0,
    },
  };

  constructor() {}

  timersUsagesAdd(
    isInterval: boolean,
    handler: number,
    delay: number | undefined = 0,
    stubError: Error
  ) {
    this.timersUsages.push([
      isInterval,
      {
        handler,
        delay,
        trace: createCallstack(stubError),
        //rawTrace: stubError.stack, // uncomment to debug errors in trace
      },
    ]);
  }

  timersUsagesRemove(handler?: number) {
    this.timersUsages = this.timersUsages.filter(
      ([, timerMetric]) => timerMetric.handler !== handler
    );
  }

  clearTimerUsagesSet(isInterval: boolean, handler: number, stubError: Error) {
    const trace = createCallstack(stubError);
    const traceId = trace.map((v) => `${v.name}${v.link}`).join('');
    let handlerDelay;
    const collection = isInterval
      ? this.clearIntervalUsages
      : this.clearTimeoutsUsages;
    const existing = collection.find((v) => v.traceId === traceId);

    const timerUsage = this.timersUsages.find((v) => v[1].handler === handler);
    if (timerUsage) {
      handlerDelay = timerUsage[1].delay;
    }

    if (existing) {
      existing.recentHandler = handler;
      existing.handlerDelay = handlerDelay;
      existing.individualInvocations++;
    } else {
      collection.push({
        traceId,
        recentHandler: handler,
        individualInvocations: 1,
        handlerDelay,
        trace,
      });
      collection.sort((a, b) => (b.handlerDelay || 0) - (a.handlerDelay || 0));
    }
  }

  collectTimersUsages() {
    const timeouts: TTimerMetrics[] = [];
    const intervals: TTimerMetrics[] = [];

    for (const usage of this.timersUsages) {
      if (usage[0]) {
        intervals.push(usage[1]);
      } else {
        timeouts.push(usage[1]);
      }
    }

    return {
      timeouts: timeouts.sort((a, b) => b.delay - a.delay), // sort by delay descending
      intervals: intervals.sort((a, b) => b.delay - a.delay),
      clearTimeouts: this.clearTimeoutsUsages,
      clearIntervals: this.clearIntervalUsages,
    };
  }

  wrapApis() {
    this.wrapTimers();
    this.wrapEval();
  }

  wrapEval() {
    const self = this;
    window.eval = function WrappedLessEval(code: string) {
      self.danger.eval.invocations++;
      self.danger.eval.navite(code);
    };
  }

  wrapTimers() {
    const self = this;

    window.setTimeout = function setTimeout(code, delay, ...args) {
      self.timers.setTimeout.invocations++;

      const handler = self.timers.setTimeout.native(
        (...params: any[]) => {
          self.timersUsagesRemove(handler);
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

      self.timersUsagesAdd(
        false,
        handler,
        delay,
        new Error(TRACE_ERROR_MESSAGE)
      );

      return handler;
    };

    window.clearTimeout = function clearTimeout(handler: number | undefined) {
      self.timers.clearTimeout.invocations++;

      if (handler !== undefined) {
        self.clearTimerUsagesSet(
          false,
          handler,
          new Error(TRACE_ERROR_MESSAGE)
        );
        self.timersUsagesRemove(handler);
      }

      self.timers.clearTimeout.native(handler);
    };

    window.setInterval = function setInterval(code, delay, ...args) {
      self.timers.setInterval.invocations++;
      const handler = self.timers.setInterval.native(
        (...params: any[]) => {
          self.timersUsagesRemove(handler);
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
      self.timersUsagesAdd(
        true,
        handler,
        delay,
        new Error(TRACE_ERROR_MESSAGE)
      );
      return handler;
    };

    window.clearInterval = function clearInterval(handler: number | undefined) {
      self.timers.clearInterval.invocations++;

      if (handler !== undefined) {
        self.clearTimerUsagesSet(true, handler, new Error(TRACE_ERROR_MESSAGE));
        self.timersUsagesRemove(handler);
      }

      self.timers.clearInterval.native(handler);
    };
  }
}
