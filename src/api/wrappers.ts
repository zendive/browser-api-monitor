import {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
} from '@/api/const';

export interface TTimersUsagesStack {
  name: string;
  link: string;
}
export type TTimersUsages = [
  isInterval: boolean,
  handler: number,
  delay: number,
  stack: TTimersUsagesStack[]
];
export type TTimerApi = typeof apis;

const lessEval = eval; // https://rollupjs.org/troubleshooting/#avoiding-eval
const STACK_CLEAN_PREFIX = /^Error: stub\W*/;
const STACK_NAME_REPLACE_PATTERN = /^(.+)\(.*/;
const STACK_LINK_REPLACE_PATTERN = /.*\((.*)\).*/;
const apis = {
  timersUsages: [] as TTimersUsages[],
  timersUsagesAdd(
    isInterval: boolean,
    handler: number,
    delay: number | undefined
  ) {
    const e = new Error('stub');
    const stack = e.stack?.replace(STACK_CLEAN_PREFIX, '') || '';
    let arr = stack.split(/\Wat\W/);
    arr.splice(0, 2);
    const usagesStack = <TTimersUsagesStack[]>arr.map((v) => {
      return {
        name: v.replace(STACK_NAME_REPLACE_PATTERN, '$1').trim(),
        link: v.replace(STACK_LINK_REPLACE_PATTERN, '$1').trim(),
      };
    });
    this.timersUsages.push([isInterval, handler, delay || 0, usagesStack]);
  },
  timersUsagesRemove(handler?: number) {
    this.timersUsages = this.timersUsages.filter(
      (handlerDelayPair) => handlerDelayPair[1] !== handler
    );
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
