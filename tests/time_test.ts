import { beforeEach, describe, test } from '@std/testing/bdd';
import { expect } from '@std/expect';
import './browserPolyfill.ts';
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
import { NOOP } from '../src/api/const.ts';

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
    expect(/\d+\u00a0ms/.test(Stopper.toString(stopper.value()) || '')).toBe(
      true,
    );
  });

  test('elapsed continues counting after stop', async () => {
    stopper.start();
    await wait(DELAY);
    stopper.stop();
    const value = stopper.value();
    await wait(3 * DELAY);
    const elapsed = stopper.elapsed();

    expect(elapsed > 2 * value).toBe(true);
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
    const timeout = new Timer({ type: ETimer.TIMEOUT, delay: DELAY }, () => {
      counter++;
    });

    expect(timeout.isPending()).toBe(false);
    timeout.start();
    expect(timeout.isPending()).toBe(true);
    await wait(3 * DELAY);
    expect(timeout.isPending()).toBe(false);
    expect(counter).toBe(1);
  });

  test('stop before expected', async () => {
    let counter = 0;
    const timeout = new Timer(
      { type: ETimer.TIMEOUT, delay: 2 * DELAY },
      () => {
        counter++;
      },
    );

    timeout.start();
    expect(timeout.isPending()).toBe(true);
    await wait(DELAY);
    timeout.stop();
    expect(timeout.isPending()).toBe(false);
    await wait(3 * DELAY);
    expect(counter).toBe(0);
  });
});

describe('Timer - repeatable', () => {
  test('start/stop', async () => {
    let counter = 0;
    const interval = new Timer({ type: ETimer.TIMEOUT, delay: DELAY }, () => {
      counter++;
      interval.start();
    });

    interval.start();
    expect(interval.isPending()).toBe(true);
    await wait(DELAY + DELAY / 2);
    interval.stop();
    expect(interval.isPending()).toBe(false);
    expect(counter).toBe(1);
  });
});

describe('Timer - animation + measurable', () => {
  test('start/stop', async () => {
    let count = 0;
    const TIMESPAN = 100;
    let timerArg = 0;
    const timerArgExpected = 100;
    let hasAnimationArgs = false;
    const animation = new Timer({
      type: ETimer.ANIMATION,
      measurable: true,
    }, (_timerArg: number, time: DOMHighResTimeStamp) => {
      count++;
      timerArg = _timerArg;
      hasAnimationArgs = !!time && typeof time === 'number';
    });

    expect(animation.isPending()).toBe(false);
    animation.start(timerArgExpected);
    expect(animation.isPending()).toBe(true);

    await wait(TIMESPAN);

    expect(hasAnimationArgs).toBe(true);
    expect(timerArg).toBe(timerArgExpected);
    expect(animation.isPending()).toBe(false);
    expect(animation.callbackSelfTime > 0).toBe(true);
    expect(count).toBe(1);
  });
});

describe('Timer - idle', () => {
  test('start/stop', async () => {
    let counter = 0;
    let timerArg = 0;
    const timerArgExpected = 100;
    let hasIdleArgs = false;
    const task = new Timer(
      { type: ETimer.IDLE, timeout: DELAY },
      (_timerArg: number, deadline: IdleDeadline) => {
        counter++;
        timerArg = _timerArg;
        hasIdleArgs = !!deadline && typeof deadline.didTimeout == 'boolean';
        task.start();
      },
    );

    task.start(timerArgExpected);
    expect(task.isPending()).toBe(true);
    await wait(DELAY + DELAY / 2);
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
    const task = new Timer({ type: ETimer.TASK, delay: DELAY }, () => {
      counter++;
    });

    task.start();
    expect(task.isPending()).toBe(true);
    await wait(DELAY + DELAY / 2);

    expect(task.isPending()).toBe(false);
    expect(counter).toBe(1);
  });
});

describe('Fps', () => {
  test('collects ticks after a second', async () => {
    const COUNT = 20;
    const fps = new Fps(NOOP);
    fps.start();

    for (let i = 0, I = COUNT; i < I; i++) {
      fps.tick();
    }

    await wait(1.2e3);
    fps.stop();

    expect(fps.value).toBe(COUNT);
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
  let count = 0;
  const fn = callableOnce(() => {
    return ++count;
  });

  test('function called once', () => {
    const rv1 = fn();
    const rv2 = fn();

    expect(count).toBe(1);
    expect(rv1).toBe(1);
    expect(rv2).toBe(1);
  });
});

await wait(10);
