import {
  cancelAnimationFrame,
  clearTimeout,
  nativePostTask,
  NOOP,
  requestAnimationFrame,
  setTimeout,
  TELEMETRY_FREQUENCY_30PS,
  TIME_60FPS_MS,
} from './const.ts';

export function callableOnce<
  T extends (...args: Parameters<T>) => ReturnType<T>,
>(
  fn: T | null,
): T {
  let rv: ReturnType<T>;
  return <T> function (...args: Parameters<T>): ReturnType<T> {
    if (fn) {
      rv = fn(...args);
      fn = null;
    }
    return rv;
  };
}

/**
 * Measure time between start/stop calls
 * programmatic alternative to console.time/console.endTime
 */
export class Stopper {
  #start: number;
  #finish: number;

  constructor() {
    this.#start = 0;
    this.#finish = 0;
  }

  start() {
    this.#finish = this.#start = performance.now();
    return this;
  }

  stop() {
    this.#finish = performance.now();
    return this;
  }

  elapsed() {
    return performance.now() - this.#start;
  }

  value() {
    return this.#finish - this.#start;
  }

  toString() {
    return Stopper.toString(this.value());
  }

  static toString(msTime: number | unknown) {
    if (typeof msTime !== 'number' || !Number.isFinite(msTime)) {
      return;
    }

    if (msTime <= TIME_60FPS_MS) {
      const ms = Math.trunc(msTime);
      return `${ms}.${
        toPaddedString(Math.trunc((msTime - ms) * 1e2), 2)
      }\u00a0ms`;
    } else if (msTime < 1e3) {
      return `${Math.trunc(msTime)}\u00a0ms`;
    } else if (msTime < 60e3) {
      const s = Math.trunc(msTime / 1e3) % 60;
      const ms = Math.trunc(msTime % 1e3);

      return `${s}.${toPaddedString(ms, 3)}\u00a0s`;
    }

    return ms2HMS(msTime);
  }
}

/** @link: https://developer.mozilla.org/en-US/docs/Web/API/Prioritized_Task_Scheduling_API#task_priorities */
export type TTaskPriority =
  | 'user-blocking'
  | 'user-visible' // default
  | 'background';
export enum ETimer {
  TIMEOUT,
  ANIMATION,
  IDLE,
  TASK,
}
type TTimerMeasurable = {
  /** populate `callbackSelfTime` with measured execution time of `callback` (default: false) */
  measurable?: boolean;
};
type TTimerTimeout = TTimerMeasurable & {
  type: ETimer.TIMEOUT;
  delay: number;
};
type TTimerAnimation = TTimerMeasurable & {
  type: ETimer.ANIMATION;
};
type TTimerIdle = TTimerMeasurable & {
  type: ETimer.IDLE;
  delay: number;
};
type TTimerTask = TTimerMeasurable & {
  type: ETimer.TASK;
  delay: number;
  priority?: TTaskPriority;
};
type TTimerOptions =
  | TTimerTimeout
  | TTimerAnimation
  | TTimerIdle
  | TTimerTask;

/**
 * A unification of ways to delay a callback execution
 * in javascript event-loop
 */
export class Timer {
  delay: number = 0;
  /** callback's self-time in milliseconds */
  callbackSelfTime: number = -1;
  #handler: number = 0;
  #abortController: AbortController | null = null;
  readonly #fn: (...args: unknown[]) => void;
  readonly #stopper?: Stopper;
  readonly #options: TTimerOptions;

  constructor(o: TTimerOptions, fn: (...args: unknown[]) => void) {
    this.#options = Object.assign({}, o);
    this.#fn = fn;

    if (
      this.#options.type === ETimer.TIMEOUT ||
      this.#options.type === ETimer.IDLE ||
      this.#options.type === ETimer.TASK
    ) {
      this.delay = this.#options.delay;
    }

    if (this.#options.measurable) {
      this.#stopper = new Stopper();
    }
  }

  start(...args: unknown[]) {
    if (this.isPending()) {
      this.stop();
    }

    if (
      this.#options.type === ETimer.TIMEOUT
    ) {
      this.#handler = setTimeout(() => {
        this.#handler = 0;
        this.trigger(...args);
      }, this.delay);
    } else if (
      this.#options.type === ETimer.ANIMATION
    ) {
      this.#handler = requestAnimationFrame((...argsAF) => {
        this.#handler = 0;
        this.trigger(...[...args, ...argsAF]);
      });
    } else if (this.#options.type === ETimer.IDLE) {
      this.#handler = requestIdleCallback((...argsIC) => {
        this.#handler = 0;
        this.trigger(...[...args, ...argsIC]);
      }, { timeout: this.delay });
    } else if (this.#options.type === ETimer.TASK) {
      this.#abortController = new AbortController();
      nativePostTask(() => {
        this.#abortController = null;
        this.trigger(...args);
      }, {
        delay: this.delay,
        signal: this.#abortController.signal,
        priority: this.#options.priority,
      }).catch(NOOP);
    }

    return this;
  }

  trigger(...args: unknown[]) {
    this.#stopper?.start();

    this.#fn(...args);

    if (this.#stopper) {
      this.callbackSelfTime = this.#stopper.stop().value();
    }

    return this;
  }

  stop() {
    if (this.#options.type === ETimer.TIMEOUT) {
      this.#handler && clearTimeout(this.#handler);
      this.#handler = 0;
    } else if (this.#options.type === ETimer.ANIMATION) {
      this.#handler && cancelAnimationFrame(this.#handler);
      this.#handler = 0;
    } else if (this.#options.type === ETimer.IDLE) {
      this.#handler && cancelIdleCallback(this.#handler);
      this.#handler = 0;
    } else if (this.#options.type === ETimer.TASK) {
      this.#abortController && this.#abortController.abort();
      this.#abortController = null;
    }

    return this;
  }

  /**
   * Timer status:
   *    true := scheduled, pending execution
   *    false := unstarted or finished
   */
  isPending(): boolean {
    if (this.#options.type === ETimer.TASK) {
      return !!this.#abortController;
    }

    return this.#handler !== 0;
  }
}

/**
 * Function calls per second
 * for use in hot code paths
 */
export class Fps {
  /** registered number of calls */
  value = 0;
  #ticks = 0;
  #eachSecond: Timer;

  constructor(callback?: (value: number) => void) {
    this.#eachSecond = new Timer({ type: ETimer.TIMEOUT, delay: 1e3 }, () => {
      this.value = this.#ticks;
      this.#ticks = 0;
      callback?.(this.value);
      this.#eachSecond.start();
    });
  }

  start() {
    this.#ticks = 0;
    this.value = 0;
    this.#eachSecond.start();
    return this;
  }

  tick() {
    this.#ticks++;
    return this;
  }

  stop() {
    this.#eachSecond.stop();
    return this;
  }
}

export function wait(timeout: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

export function trim2ms<T>(ms: T) {
  return typeof ms === 'number' ? Math.trunc(ms * 1e2) / 1e2 : ms;
}

export function ms2HMS(ms: number) {
  return `${toPaddedString(Math.trunc(ms / 3600e3), 2)}:${
    toPaddedString(Math.trunc(ms / 60e3) % 60, 2)
  }:${toPaddedString(Math.trunc(ms / 1e3) % 60, 2)}`;
}

function toPaddedString(value: number, padding: number) {
  return value.toString().padStart(padding, '0');
}

const TICK_TIME_LAG_SCALAR = 3;
export function adjustTelemetryDelay(timeOfCollection: number) {
  const timeLag = Date.now() - timeOfCollection;
  const newDelay = timeLag * TICK_TIME_LAG_SCALAR;

  return Math.max(TELEMETRY_FREQUENCY_30PS, newDelay);
}
