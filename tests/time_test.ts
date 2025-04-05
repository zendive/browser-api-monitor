import './browserPolyfill.ts';
import { wait } from './util.ts';
import { beforeEach, describe, test } from '@std/testing/bdd';
import { expect } from '@std/expect';
import {
  callingOnce,
  Fps,
  Stopper,
  Timer,
  trim2microsecond,
} from '../src/api/time.ts';

describe('Stopper', () => {
  let stopper: Stopper;

  beforeEach(() => {
    stopper = new Stopper();
  });

  test('start/stop', async () => {
    const DELAY = 10;
    stopper.start();
    await wait(DELAY);
    stopper.stop();
    const value = stopper.value();
    await wait(DELAY);
    const value2 = stopper.value();

    expect(value).toBe(value2);
    expect(/\d+ms/.test(Stopper.toString(stopper.value()) || '')).toBe(true);
  });

  test('elapsed continues counting after stop', async () => {
    const DELAY = 10;
    stopper.start();
    await wait(DELAY);
    stopper.stop();
    const value = stopper.value();
    await wait(3 * DELAY);
    const elapsed = stopper.elapsed();

    expect(elapsed > 2 * value).toBe(true);
  });

  test('toString()', () => {
    expect(Stopper.toString(0.000006)).toBe('0μs');
    expect(Stopper.toString(0.123456)).toBe('123μs');
    expect(Stopper.toString(999.123456)).toBe('999ms');
    expect(Stopper.toString(5432.123456)).toBe('5.432s');
    expect(Stopper.toString(5 * 60e3)).toBe('00:05:00');
    expect(Stopper.toString(987654321.0123456789)).toBe('274:20:54');
  });
});

describe('Timer - default options', () => {
  test('start', async () => {
    let counter = 0;
    const DELAY = 10;
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
    const DELAY = 10;
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
    const DELAY = 10;
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
    const SECOND = 1e3;
    let count = 0;
    const timer = new Timer({ animation: true, measurable: true }, () => {
      count++;
    });

    expect(timer.isPending()).toBe(false);

    timer.start();

    expect(timer.isPending()).toBe(true);
    await wait(SECOND);

    timer.stop();
    expect(timer.isPending()).toBe(false);
    expect(timer.executionTime < 0.5).toBe(true);
    expect(count).toBeLessThan(62);
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

describe('trim2microsecond', () => {
  test('trims to microsecond', () => {
    expect(trim2microsecond(null)).toBe(null);
    expect(trim2microsecond(1.111999)).toBe(1.111);
  });
});

describe('callingOnce', () => {
  let count = 0;
  const fn = callingOnce(() => {
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

await wait(2e3);
