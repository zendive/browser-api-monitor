const lessEval = eval; // https://rollupjs.org/troubleshooting/#avoiding-eval
const apis = {
  timersUsages: [] as Array<Array<number | boolean>>,
  timersUsagesAdd(
    isInterval: boolean,
    handler: number,
    delay: number | undefined
  ) {
    this.timersUsages.push([isInterval, handler, delay || 0]);
  },
  timersUsagesRemove(handler?: number) {
    this.timersUsages = this.timersUsages.filter(
      (handlerDelayPair) => handlerDelayPair[1] !== handler
    );
  },
  timers: {
    setTimeout: {
      native: window.setTimeout.bind(window),
      invocations: 0,
    },
    clearTimeout: {
      native: window.clearTimeout.bind(window),
      invocations: 0,
    },
    setInterval: {
      native: window.setInterval.bind(window),
      invocations: 0,
    },
    clearInterval: {
      native: window.clearInterval.bind(window),
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
    add(false, handler, delay);
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
          lessEval(code); // see https://developer.mozilla.org/docs/Web/API/setInterval
        } else {
          code(...params);
        }
      },
      delay,
      ...args
    );
    add(true, handler, delay);
    return handler;
  };

  window.clearInterval = function clearInterval(handler) {
    timers.clearInterval.invocations++;
    remove(handler);
    return timers.clearInterval.native(handler);
  };
}
