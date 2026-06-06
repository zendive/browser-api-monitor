import { beforeEach, describe, expect, test } from 'vitest';
import {
  callableOnce,
  ETimer,
  Fps,
  ms2HMS,
  Stopper,
  Timer,
  trim2ms,
  wait,
} from '../src/api/time.ts';

const DELAY = 10;

describe('Stopper', () => {
  let stopper: Stopper;

  beforeEach(() => {
    stopper = new Stopper();
  });

  test('start/stop', async () => {
    stopper.start();
    await wait(DELAY);
    stopper.stop();
    const value = stopper.value();
    await wait(DELAY);
    const value2 = stopper.value();

    expect(value).toBe(value2);
  });

  test('elapsed continues counting after stop', async () => {
    stopper.start();
    await wait(DELAY);
    stopper.stop();

    const value = stopper.value();
    await wait(3 * DELAY);
    const elapsed = stopper.elapsed();

    expect(elapsed).toBeGreaterThan(2 * value);
  });

  test('toString()', () => {
    expect(Stopper.toString(0.00)).toBe('0.00\u00a0ms');
    expect(Stopper.toString(0.123456)).toBe('0.12\u00a0ms');
    expect(Stopper.toString(999.123456)).toBe('999\u00a0ms');
    expect(Stopper.toString(5432.123456)).toBe('5.432\u00a0s');
    expect(Stopper.toString(5 * 60e3)).toBe('00:05:00');
    expect(Stopper.toString(987654321.0123456789)).toBe('274:20:54');
  });
});

describe('Timer - default options', () => {
  test('start', async () => {
    let counter = 0;
    const { promise, resolve } = Promise.withResolvers<void>();
    const timeout = new Timer({
      type: ETimer.TIMEOUT,
      timeout: DELAY,
    }, () => {
      counter++;
      resolve();
    });

    expect(timeout.isPending()).toBe(false);
    timeout.start();
    expect(timeout.isPending()).toBe(true);
    await promise;
    expect(timeout.isPending()).toBe(false);
    expect(counter).toBe(1);
  });

  test('stop before expected', async () => {
    let counter = 0;
    const timeout = new Timer(
      { type: ETimer.TIMEOUT, timeout: DELAY },
      () => {
        counter++;
      },
    );

    timeout.start();
    expect(timeout.isPending()).toBe(true);
    timeout.stop();
    expect(timeout.isPending()).toBe(false);
    await wait(2 * DELAY);
    expect(counter).toBe(0);
  });
});

describe('Timer - repeatable', () => {
  test('start/stop', async () => {
    let counter = 0;
    const { promise, resolve } = Promise.withResolvers<void>();
    const interval = new Timer({
      type: ETimer.TIMEOUT,
      timeout: DELAY,
    }, () => {
      counter++;
      interval.start();
      resolve();
    });

    interval.start();
    expect(interval.isPending()).toBe(true);
    await promise;
    interval.stop();

    expect(interval.isPending()).toBe(false);
    expect(counter).toBe(1);
  });
});

describe('Timer - animation + measurable', () => {
  test('start/stop', async () => {
    let count = 0;
    let timerArg: unknown;
    const timerArgExpected = 100;
    let hasAnimationArgs = false;
    const { promise, resolve } = Promise.withResolvers<void>();
    const animation = new Timer({
      type: ETimer.ANIMATION,
      measurable: true,
    }, (arg: number | unknown, time: DOMHighResTimeStamp | unknown) => {
      count++;
      timerArg = arg;
      hasAnimationArgs = !!time && typeof time === 'number';
      resolve();
    });

    expect(animation.isPending()).toBe(false);
    animation.start(timerArgExpected);
    expect(animation.isPending()).toBe(true);

    await promise;

    expect(hasAnimationArgs).toBe(true);
    expect(timerArg).toBe(timerArgExpected);
    expect(animation.isPending()).toBe(false);
    expect(count).toBe(1);
  });
});

describe('Timer - idle', () => {
  test('start/stop', async () => {
    let counter = 0;
    let timerArg: unknown = 0;
    const timerArgExpected = 100;
    let hasIdleArgs = false;
    const { promise, resolve } = Promise.withResolvers<void>();
    const task = new Timer(
      { type: ETimer.IDLE, timeout: DELAY },
      (arg: number | unknown, deadline: IdleDeadline | unknown) => {
        counter++;
        timerArg = arg;
        hasIdleArgs = deadline instanceof IdleDeadline &&
          typeof deadline.didTimeout == 'boolean';
        task.start();
        resolve();
      },
    );

    task.start(timerArgExpected);
    expect(task.isPending()).toBe(true);
    await promise;
    task.stop();

    expect(timerArg).toBe(timerArgExpected);
    expect(hasIdleArgs).toBe(true);
    expect(task.isPending()).toBe(false);
    expect(counter).toBe(1);
  });
});

describe('Timer - task', () => {
  test('start/stop', async () => {
    let counter = 0;
    const { promise, resolve } = Promise.withResolvers<void>();
    const task = new Timer({
      type: ETimer.TASK,
      priority: 'user-blocking',
      timeout: DELAY,
    }, () => {
      counter++;
      resolve();
    });

    task.start();
    expect(task.isPending()).toBe(true);
    await promise;

    expect(task.isPending()).toBe(false);
    expect(counter).toBe(1);
  });
});

describe('Fps', () => {
  test('collects ticks after a second', async () => {
    const COUNT = 20;
    let counted;
    const fps = new Fps((value) => {
      counted = value;
    });

    fps.start();
    for (let i = 0, I = COUNT; i < I; i++) {
      fps.tick();
    }
    await wait(1.1e3);
    fps.stop();

    expect(fps.value).toBe(COUNT);
    expect(counted).toBe(COUNT);
  });
});

describe('trim2ms', () => {
  test('trims to microsecond', () => {
    expect(trim2ms(null)).toBe(null);
    expect(trim2ms(1.111999)).toBe(1.11);
  });
});

describe('ms2HMS', () => {
  test('millisecond to hour minute second', () => {
    expect(ms2HMS(0)).toBe('00:00:00');
    expect(ms2HMS(3661000)).toBe('01:01:01');
  });
});

describe('callableOnce', () => {
  test('function called once', () => {
    let count = 0;
    const fn = callableOnce(() => {
      return ++count;
    });
    const rv1 = fn();
    const rv2 = fn();

    expect(count).toBe(1);
    expect(rv1).toBe(1);
    expect(rv1).toBe(rv2);
  });
});
