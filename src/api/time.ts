import { setTimeout, clearTimeout } from './const';

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

  static toString(msTime: number) {
    if (msTime < 1) {
      return `${Math.trunc(msTime * 1e3)}μs`;
    } else if (msTime < 3) {
      const ms = Math.trunc(msTime);
      return `${ms}.${Math.trunc((msTime - ms) * 1e2)}ms`;
    } else if (msTime < 1e3) {
      return `${Math.trunc(msTime)}ms`;
    } else if (msTime < 60e3) {
      const s = Math.trunc(msTime / 1e3) % 60;
      const ms = msTime % 1e3;

      return `${s}.${ms.toString().padStart(3, '0')}s`;
    }

    const h = Math.trunc(msTime / 1e3 / 60 / 60);
    const m = Math.trunc(msTime / 1e3 / 60) % 60;
    const s = Math.trunc(msTime / 1e3) % 60;

    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

interface TimerOptions {
  interval?: boolean;
  animation?: boolean;
  measurable?: boolean;
}

/**
 * Universal abstraction of setTimeout/setInterval/requestAnimationFrame
 * with an optional measurement of the callback's execution time
 */
export class Timer {
  delay: number;
  readonly options: TimerOptions;
  /** (ms) */
  executionTime: number = -1;

  #fn: Function;
  #handler: number = 0;
  #pending: boolean = false;
  readonly #stopper?: Stopper;

  constructor(
    fn: Function,
    delay?: number,
    o: TimerOptions = { interval: false, animation: false, measurable: false }
  ) {
    this.#fn = fn;
    this.delay = delay || 0;
    this.options = o;

    if (this.options.measurable) {
      this.#stopper = new Stopper();
    }
  }

  start(...args: any[]) {
    if (this.#pending) {
      this.stop();
    }

    this.#pending = true;

    if (this.options.animation) {
      this.#handler = requestAnimationFrame(() => {
        this.trigger(...args);
        this.#pending = false;

        if (this.options.interval) {
          this.start(...args);
        }
      });
    } else {
      this.#handler = setTimeout(() => {
        this.trigger(...args);
        this.#pending = false;

        if (this.options.interval) {
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
    if (this.options.animation) {
      cancelAnimationFrame(this.#handler);
    } else {
      clearTimeout(this.#handler);
    }

    this.#pending = false;

    return this;
  }

  /** Timer status: true | false => Pending | unstarted/finished/stopped */
  isPending() {
    return this.#pending;
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
    this.#interval = new Timer(
      () => {
        this.value = this.#ticks;
        this.#ticks = 0;
        callback?.(this.value);
      },
      1e3,
      { interval: true }
    );
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

export class MeanAggregator {
  numberOfSamples = 0;
  mean = 0;
  variance = 0;
  standardDeviation = 0;
  minimum = 0;
  maximum = 0;

  #M2 = 0;

  reset() {
    this.numberOfSamples = 0;
    this.mean = 0;
    this.variance = 0;
    this.standardDeviation = 0;
    this.minimum = 0;
    this.maximum = 0;
    this.#M2 = 0;

    return this;
  }

  add(value: number) {
    ++this.numberOfSamples;

    if (1 === this.numberOfSamples) {
      this.minimum = value;
      this.maximum = value;
    } else {
      this.minimum = Math.min(this.minimum, value);
      this.maximum = Math.max(this.maximum, value);
    }

    const delta = value - this.mean;
    this.mean += delta / this.numberOfSamples;
    this.#M2 += delta * (value - this.mean);
    this.variance = this.#M2 / this.numberOfSamples;
    this.standardDeviation = Math.sqrt(this.variance);

    return this;
  }
}
