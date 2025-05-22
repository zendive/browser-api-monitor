import {
  cancelAnimationFrame,
  clearTimeout,
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

interface ITimerOptions {
  /** a delay of setTimeout or setInterval (default: 0); irrelevant if `animation` is true */
  delay?: number;
  /** act as setInterval by repeating setTimeout (default: false) */
  repetitive?: boolean;
  /** act as requestAnimationFrame called from another requestAnimationFrame (default: false);
  if true - `delay` is redundant */
  animation?: boolean;
  /** populate `callbackSelfTime` with measured execution time of `callback` (default: false) */
  measurable?: boolean;
}

/**
 * A unification of ways to delay a callback to another time in javascript event-loop
 * - `repetitive: false` - will call `setTimeout` with constant `delay`.
 * - `repetitive: true` - will call `setTimeout` but act as `setInterval` with changeable `delay`.
 * - `animation: true` - will call `requestAnimationFrame` in recursive way (means to follow the browser's frame-rate).
 * - `measurable: true` - measure the callback's execution time.
 */
export class Timer {
  delay: number = 0;
  /** callback's self-time in milliseconds */
  callbackSelfTime: number = -1;
  #handler: number = 0;
  readonly #fn: (...args: unknown[]) => void;
  readonly #stopper?: Stopper;
  readonly #options: ITimerOptions;
  static readonly DEFAULT_OPTIONS: ITimerOptions = {
    delay: 0,
    repetitive: false,
    animation: false,
    measurable: false,
  };

  constructor(o: ITimerOptions, fn: (...args: unknown[]) => void) {
    this.#options = Object.assign({}, Timer.DEFAULT_OPTIONS, o);
    this.#fn = fn;
    this.delay = this.#options.delay || 0;

    if (this.#options.measurable) {
      this.#stopper = new Stopper();
    }
  }

  start(...args: unknown[]) {
    if (this.#handler) {
      this.stop();
    }

    if (this.#options.animation) {
      this.#handler = requestAnimationFrame(() => {
        this.trigger(...args);
        this.#handler = 0;

        if (this.#options.repetitive) {
          this.start(...args);
        }
      });
    } else {
      this.#handler = setTimeout(() => {
        this.trigger(...args);
        this.#handler = 0;

        if (this.#options.repetitive) {
          this.start(...args);
        }
      }, this.delay);
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
    if (this.#handler) {
      if (this.#options.animation) {
        cancelAnimationFrame(this.#handler);
      } else {
        clearTimeout(this.#handler);
      }

      this.#handler = 0;
    }

    return this;
  }

  /** Timer status: true | false => Pending | unstarted/finished/stopped */
  isPending() {
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
  #interval: Timer;

  constructor(callback?: (value: number) => void) {
    this.#interval = new Timer({ delay: 1e3, repetitive: true }, () => {
      this.value = this.#ticks;
      this.#ticks = 0;
      callback?.(this.value);
    });
  }

  start() {
    this.#ticks = 0;
    this.value = 0;
    this.#interval.start();
    return this;
  }

  tick() {
    this.#ticks++;
    return this;
  }

  stop() {
    this.#interval.stop();
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
