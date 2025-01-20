// {{ jestis
import { TextEncoder } from 'node:util';
global.TextEncoder = TextEncoder;
// @ts-ignore
global.requestIdleCallback = function noop() {};
global.cancelIdleCallback = function noop() {};
// }}

import { describe, expect, test, beforeEach } from '@jest/globals';
import {
  Stopper,
  Timer,
  Fps,
  MeanAggregator,
  trim2microsecond,
} from '../../src/api/time.ts';

function wait(timeout: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

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
    expect(Stopper.toString(0.000006)).toMatch('0μs');
    expect(Stopper.toString(0.123456)).toMatch('123μs');
    expect(Stopper.toString(999.123456)).toMatch('999ms');
    expect(Stopper.toString(5432.123456)).toMatch('5.432s');
    expect(Stopper.toString(5 * 60e3)).toMatch('0:05:00');
    expect(Stopper.toString(987654321.0123456789)).toMatch('274:20:54');
  });
});

describe('Timer - default options', () => {
  test('start', async () => {
    let counter = 0;
    const DELAY = 10;
    const timer = new Timer(() => {
      counter++;
    }, DELAY);

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
    const timer = new Timer(() => {
      counter++;
    }, 2 * DELAY);

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
    const interval = new Timer(
      () => {
        counter++;
      },
      DELAY,
      { repetitive: true }
    );

    interval.start();
    await wait(DELAY + DELAY / 2);
    interval.stop();
    await wait(DELAY);
    expect(counter).toBe(1);
  });
});

describe('Timer - animation + interval + measurable', () => {
  test('start/stop', async () => {
    let count = 0;
    const animation = new Timer(
      () => {
        count++;
      },
      undefined,
      { animation: true, repetitive: true, measurable: true }
    );
    const SECOND = 1e3;

    expect(animation.isPending()).toBe(false);
    animation.start();
    expect(animation.isPending()).toBe(true);
    await wait(SECOND);
    animation.stop();
    expect(animation.isPending()).toBe(false);
    expect(animation.executionTime < 0.5).toBe(true);
    expect(count).toBeLessThan(62);
  });
});

describe('Fps', () => {
  test('collects ticks after a second', async () => {
    return new Promise<void>((resolve) => {
      const COUNT = 20;
      const fps = new Fps((value) => {
        fps.stop();
        expect(value).toBe(COUNT);
        resolve();
      });

      fps.start();

      for (let i = 0, I = COUNT; i < I; i++) {
        fps.tick();
      }
    });
  });
});

describe('MeanAggregator', () => {
  test('mean', () => {
    const SAMPLES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
    const mean = new MeanAggregator();
    let sum = 0;

    for (let i = 0, I = SAMPLES.length; i < I; i++) {
      mean.add(SAMPLES[i]);
      sum += SAMPLES[i];
    }

    const sumMean = sum / SAMPLES.length;
    expect(mean.mean).toBe(sumMean);
    expect(mean.numberOfSamples).toBe(SAMPLES.length);
    expect(mean.minimum).toBe(SAMPLES[0]);
    expect(mean.maximum).toBe(SAMPLES[SAMPLES.length - 1]);
    expect(mean.standardDeviation).toBe(34.52052529534663);
  });
});

describe('trim2microsecond', () => {
  test('trims to microsecond', () => {
    expect(trim2microsecond(null)).toBe(null);
    expect(trim2microsecond(1.111999)).toBe(1.111);
  });
});
