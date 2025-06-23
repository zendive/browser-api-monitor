import { beforeEach, describe, test } from '@std/testing/bdd';
import { expect } from '@std/expect';
import './browserPolyfill.ts';
import {
  callableOnce,
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
    const timer = new Timer({ delay: DELAY }, () => {
      counter++;
    });

    expect(timer.isPending()).toBe(false);
    timer.start();
    expect(timer.isPending()).toBe(true);
    await wait(3 * DELAY);
    expect(timer.isPending()).toBe(false);
    expect(counter).toBe(1);
  });

  test('stop before expected', async () => {
    let counter = 0;
    const timer = new Timer({ delay: 2 * DELAY }, () => {
      counter++;
    });

    timer.start();
    expect(timer.isPending()).toBe(true);
    await wait(DELAY);
    timer.stop();
    expect(timer.isPending()).toBe(false);
    await wait(3 * DELAY);
    expect(counter).toBe(0);
  });
});

describe('Timer - interval option', () => {
  test('start/stop', async () => {
    let counter = 0;
    const interval = new Timer({ delay: DELAY, repetitive: true }, () => {
      counter++;
    });

    interval.start();
    await wait(DELAY + DELAY / 2);
    interval.stop();
    await wait(DELAY);
    expect(counter).toBe(1);
  });
});

describe('Timer - animation + measurable', () => {
  test('start/stop', async () => {
    let count = 0;
    const TIMESPAN = 100;
    const timer = new Timer({
      animation: true,
      repetitive: true,
      measurable: true,
    }, () => {
      count++;
    });

    expect(timer.isPending()).toBe(false);
    timer.start();
    expect(timer.isPending()).toBe(true);

    await wait(TIMESPAN);

    timer.stop();
    expect(timer.isPending()).toBe(false);
    expect(timer.callbackSelfTime).toBeLessThan(0.5);
    expect(count).toBeGreaterThan(1);
    expect(count).toBeLessThan(TIMESPAN / (1e3 / 60));
  });
});

describe('Fps', () => {
  test('collects ticks after a second', async () => {
    const COUNT = 20;
    const noop = () => {};
    const fps = new Fps(noop);
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
