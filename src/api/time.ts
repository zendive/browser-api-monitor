import { setTimeout, clearTimeout } from './const';

/**
 * Measure time between calls
 * programmatic alternative to console.time/console.endTime
 */
export class Stopper {
  #start: number;
  finish: number;

  constructor() {
    this.#start = 0;
    this.finish = 0;
  }

  start() {
    this.#start = performance.now();
    return this;
  }

  stop() {
    this.finish = this.now();
    return this;
  }

  now() {
    return performance.now() - this.#start;
  }

  toString() {
    const elapsed = this.now();

    if (elapsed < 1) {
      return `${~~(elapsed * 1e3)}μs`;
    } else if (elapsed < 1e3) {
      return `${~~elapsed}ms`;
    } else if (elapsed < 60e3) {
      const s = ~~(elapsed / 1e3) % 60;
      const ms = elapsed % 1e3;

      return `${s}.${ms.toString().padStart(3, '0')}s`;
    }

    const h = ~~(elapsed / 1e3 / 60 / 60);
    const m = ~~(elapsed / 1e3 / 60) % 60;
    const s = ~~(elapsed / 1e3) % 60;

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

export class Timer {
  #fn: Function;
  delay: number;
  options: TimerOptions;
  #handler: number = 0;
  #pending: boolean = false;
  stopper?: Stopper;

  constructor(
    fn: Function,
    delay?: number,
    o: TimerOptions = { interval: false, animation: false, measurable: false }
  ) {
    this.#fn = fn;
    this.delay = delay || 0;
    this.options = o;

    if (this.options.measurable) {
      this.stopper = new Stopper();
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
    this.stopper?.start();
    this.#fn(...args);
    this.stopper?.stop();

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
