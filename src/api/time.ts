import {
  setTimeout,
  clearTimeout,
  requestAnimationFrame,
  cancelAnimationFrame,
  TELEMETRY_FREQUENCY_30PS,
} from './const.ts';

export function callingOnce<T extends (...args: any[]) => any>(
  fn: T | null
): T {
  let rv: ReturnType<T>;
  return <T>function (...args: Parameters<T>): ReturnType<T> {
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

  static toString(msTime: number | unknown) {
    if (typeof msTime !== 'number' || !Number.isFinite(msTime)) {
      return;
    }

    if (msTime < 1) {
      return `${Math.trunc(msTime * 1e3)}μs`;
    } else if (msTime < 3) {
      const ms = Math.trunc(msTime);
      return `${ms}.${Math.trunc((msTime - ms) * 1e2)}ms`;
    } else if (msTime < 1e3) {
      return `${Math.trunc(msTime)}ms`;
    } else if (msTime < 60e3) {
      const s = Math.trunc(msTime / 1e3) % 60;
      const ms = Math.trunc(msTime % 1e3);

      return `${s}.${ms.toString().padStart(3, '0')}s`;
    }

    const h = Math.trunc(msTime / 3600e3);
    const m = Math.trunc(msTime / 60e3) % 60;
    const s = Math.trunc(msTime / 1e3) % 60;

    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

interface TimerOptions {
  /** a delay of setTimeout or setInterval (default: 0); irrelevant if `animation` is true */
  delay?: number;
  /** act as setInterval by repeating setTimeout (default: false) */
  repetitive?: boolean;
  /** act as requestAnimationFrame called from another requestAnimationFrame (default: false);
  if true - `delay` is redundant */
  animation?: boolean;
  /** populate `executionTime` with measured execution time of `callback` (default: false) */
  measurable?: boolean;
}

/**
 * A unification of ways to delay a callback to another time in javascript event-loop
 * - `repetitive: false` - will call `setTimeout` with constant `delay`.
 * - `repetitive: true` - will call `setTimeout` but act as `setInterval` with changable `delay`.
 * - `animation: true` - will call `requestAnimationFrame` in recursive way (means to follow the browser's frame-rate).
 * - `measurable: true` - measure the callback's execution time.
 */
export class Timer {
  readonly options: TimerOptions;
  readonly #defaultOptions: TimerOptions = {
    delay: 0,
    repetitive: false,
    animation: false,
    measurable: false,
  };
  delay: number = 0;
  /** callback's self-time in milliseconds */
  executionTime: number = -1;
  #fn: Function;
  #handler: number = 0;
  readonly #stopper?: Stopper;

  constructor(o: TimerOptions, fn: Function) {
    this.options = Object.assign(this.#defaultOptions, o);
    this.#fn = fn;
    this.delay = this.options.delay || 0;

    if (this.options.measurable) {
      this.#stopper = new Stopper();
    }
  }

  start(...args: any[]) {
    if (this.#handler) {
      this.stop();
    }

    if (this.options.animation) {
      this.#handler = requestAnimationFrame(() => {
        this.trigger(...args);
        this.#handler = 0;

        if (this.options.repetitive) {
          this.start(...args);
        }
      });
    } else {
      this.#handler = setTimeout(() => {
        this.trigger(...args);
        this.#handler = 0;

        if (this.options.repetitive) {
          this.start(...args);
        }
      }, this.delay);
    }

    return this;
  }

  trigger(...args: any[]) {
    this.#stopper?.start();
    this.#fn(...args);
    if (this.#stopper) {
      this.executionTime = this.#stopper.stop().value();
    }

    return this;
  }

  stop() {
    if (this.#handler) {
      if (this.options.animation) {
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

export function trim2microsecond(ms: any) {
  return typeof ms === 'number' ? Math.trunc(ms * 1e3) / 1e3 : ms;
}

export function msToHms(delay: number | unknown): string | undefined {
  return delay && Number(delay) > 10e3 ? Stopper.toString(delay) : undefined;
}

const TICK_TIME_LAG_SCALAR = 3;
export function adjustTelemetryDelay(timeOfCollection: number) {
  const timeLag = Date.now() - timeOfCollection;
  const newDelay = timeLag * TICK_TIME_LAG_SCALAR;

  return Math.max(TELEMETRY_FREQUENCY_30PS, newDelay);
}

const MAX_SENDING_TIME_LAG = 2e3; // ms
export function shouldAutopause(timeOfCollection: number) {
  return Date.now() - timeOfCollection > MAX_SENDING_TIME_LAG;
}
