import {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  REGEX_STACKTRACE_NAME,
  REGEX_STACKTRACE_LINK,
  TRACE_ERROR_MESSAGE,
  REGEX_STACKTRACE_PREFIX,
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
export type TTimersUsages = [isInterval: boolean, descriptor: TTimerMetrics];
export type TTimerApi = typeof apis;

function createCallstack(e: Error): TCallstack[] {
  const arr = e.stack?.split('\n') || [];
  if (arr.length) {
    arr.splice(0, 2); // remove first internal calls
  }
  const trace = <TCallstack[]>arr.map((v) => {
    v = v.replace(REGEX_STACKTRACE_PREFIX, '');
    return {
      name: v.replace(REGEX_STACKTRACE_NAME, '$1').trim(),
      link: v.replace(REGEX_STACKTRACE_LINK, '$1').trim(),
    };
  });

  return trace;
}
const lessEval = eval; // https://rollupjs.org/troubleshooting/#avoiding-eval
const apis = {
  timersUsages: [] as TTimersUsages[],
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
        // rawTrace: stubError.stack,
      },
    ]);
  },
  timersUsagesRemove(handler?: number) {
    this.timersUsages = this.timersUsages.filter(
      ([, timerMetric]) => timerMetric.handler !== handler
    );
  },
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
    };
  },
  timers: {
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
  },
  danger: {
    eval: {
      navite: lessEval,
      invocations: 0,
    },
  },
};

export function wrapApis() {
  wrapTimers(
    apis.timers,
    apis.timersUsagesAdd.bind(apis),
    apis.timersUsagesRemove.bind(apis)
  );

  wrapEval(apis.danger);

  return { apis };
}

function wrapEval(danger: typeof apis.danger) {
  window.eval = function WrappedLessEval(code: string) {
    danger.eval.invocations++;
    danger.eval.navite(code);
  };
}

function wrapTimers(
  timers: typeof apis.timers,
  add: typeof apis.timersUsagesAdd,
  remove: typeof apis.timersUsagesRemove
) {
  window.setTimeout = function setTimeout(code, delay, ...args) {
    timers.setTimeout.invocations++;
    const handler = timers.setTimeout.native(
      (...params: any[]) => {
        remove(handler);
        if (typeof code === 'string') {
          lessEval(code); // see https://developer.mozilla.org/docs/Web/API/setTimeout#code
        } else {
          code(...params);
        }
      },
      delay,
      ...args
    );
    add(false, handler, delay, new Error(TRACE_ERROR_MESSAGE));
    return handler;
  };

  window.clearTimeout = function clearTimeout(handler?: number) {
    timers.clearTimeout.invocations++;
    remove(handler);
    return timers.clearTimeout.native(handler);
  };

  window.setInterval = function setInterval(code, delay, ...args) {
    timers.setInterval.invocations++;
    const handler = timers.setInterval.native(
      (...params: any[]) => {
        remove(handler);
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
    add(true, handler, delay, new Error(TRACE_ERROR_MESSAGE));
    return handler;
  };

  window.clearInterval = function clearInterval(handler) {
    timers.clearInterval.invocations++;
    remove(handler);
    return timers.clearInterval.native(handler);
  };
}
