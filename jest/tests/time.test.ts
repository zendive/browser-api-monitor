// {{ jestis
import { TextEncoder } from 'node:util';
global.TextEncoder = TextEncoder;
// @ts-ignore
global.requestIdleCallback = function noop() {};
global.cancelIdleCallback = function noop() {};
// }}

import { describe, expect, test, beforeEach } from '@jest/globals';
import { Stopper, Timer, Fps, MeanAggregator } from '../../src/api/time.ts';

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
    expect(/\d+ms/.test(Stopper.toString(stopper.value()))).toBe(true);
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
      { interval: true }
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
      { animation: true, interval: true, measurable: true }
    );
    const SECOND = 1e3;

    expect(animation.isPending()).toBe(false);
    animation.start();
    expect(animation.isPending()).toBe(true);
    await wait(SECOND);
    animation.stop();
    expect(animation.isPending()).toBe(false);
    expect(animation.executionTime < 0.5).toBe(true);
    expect(58 <= count && count <= 61).toBe(true);
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
