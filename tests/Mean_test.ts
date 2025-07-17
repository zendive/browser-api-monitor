import { beforeEach, describe, test } from '@std/testing/bdd';
import { expect } from '@std/expect';
import { Mean } from '../src/api/Mean.ts';

describe('Mean', () => {
  const mean = new Mean();

  beforeEach(() => {
    mean.reset();
  });

  test('uninitialized', () => {
    expect(mean.sampleVariance()).toBe(0);
    expect(mean.sampleStdDev()).toBe(0);
    expect(mean.stdError()).toBe(0);
    expect(mean.populationVariance()).toBe(0);
    expect(mean.populationStdDev()).toBe(0);
  });

  test('set of 1', () => {
    mean.add(1);

    expect(mean.sampleVariance()).toBe(0);
    expect(mean.sampleStdDev()).toBe(0);
    expect(mean.stdError()).toBe(0);
    expect(mean.populationVariance()).toBe(0);
    expect(mean.populationStdDev()).toBe(0);
    expect(mean.mean).toBe(1);
    expect(mean.min).toBe(1);
    expect(mean.max).toBe(1);
  });

  test('positive set', () => {
    mean.add(1);
    mean.add(2);

    expect(mean.sampleVariance()).toBe(0.5);
    expect(mean.sampleStdDev()).toBe(Math.SQRT1_2);
    expect(mean.stdError()).toBe(0.5);
    expect(mean.populationVariance()).toBe(0.25);
    expect(mean.populationStdDev()).toBe(0.5);
    expect(mean.mean).toBe(1.5);
    expect(mean.min).toBe(1);
    expect(mean.max).toBe(2);
  });

  test('negative set', () => {
    mean.add(-1);
    mean.add(-2);

    expect(mean.sampleVariance()).toBe(0.5);
    expect(mean.sampleStdDev()).toBe(Math.SQRT1_2);
    expect(mean.stdError()).toBe(0.5);
    expect(mean.populationVariance()).toBe(0.25);
    expect(mean.populationStdDev()).toBe(0.5);
    expect(mean.mean).toBe(-1.5);
    expect(mean.min).toBe(-2);
    expect(mean.max).toBe(-1);
  });
});
