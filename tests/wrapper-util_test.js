import { afterEach, beforeEach, describe, test } from '@std/testing/bdd';
import { expect } from '@std/expect';
import './browserPolyfill.ts';
import {
  parseSharedWorkerOptions,
  parseWorkerOptions,
  parseWorkerSpecifier,
  validHandler,
  validTimerDelay,
} from '../src/wrapper/shared/util.ts';
import { wait } from '../src/api/time.ts';

describe('parseWorkerOptions', () => {
  test('empty', () => {
    expect(parseWorkerOptions()).toMatchObject({ type: 'classic' });
  });

  test('module, default credentials', () => {
    expect(parseWorkerOptions({ type: 'module' })).toMatchObject({
      type: 'module',
      credentials: 'same-origin',
    });
  });

  test('module, custom credentials', () => {
    expect(parseWorkerOptions({
      type: 'module',
      credentials: 'include',
    })).toMatchObject({
      type: 'module',
      credentials: 'include',
    });
  });

  test('name', () => {
    expect(parseWorkerOptions({ name: 'test' })).toMatchObject({
      type: 'classic',
      name: 'test',
    });
  });
});

describe('parseSharedWorkerOptions', () => {
  test('empty', () => {
    expect(parseSharedWorkerOptions()).toMatchObject({ type: 'classic' });
    expect(parseSharedWorkerOptions({})).toMatchObject({ type: 'classic' });
  });

  test('as string', () => {
    expect(parseSharedWorkerOptions('test')).toMatchObject({
      type: 'classic',
      name: 'test',
    });
  });

  test('module, default credentials', () => {
    expect(parseSharedWorkerOptions({ type: 'module' })).toMatchObject({
      type: 'module',
      credentials: 'same-origin',
    });
  });

  test('module, custom credentials', () => {
    expect(parseSharedWorkerOptions({
      type: 'module',
      credentials: 'include',
    })).toMatchObject({
      type: 'module',
      credentials: 'include',
    });
  });

  test('name', () => {
    expect(parseSharedWorkerOptions({ name: 'test' })).toMatchObject({
      name: 'test',
      type: 'classic',
    });
  });

  test('sameSiteCookies', () => {
    expect(parseSharedWorkerOptions({ sameSiteCookies: 'all' })).toMatchObject({
      type: 'classic',
      sameSiteCookies: 'all',
    });
  });

  test('extendedLifetime', () => {
    expect(parseSharedWorkerOptions({ extendedLifetime: true })).toMatchObject({
      type: 'classic',
      extendedLifetime: true,
    });
  });
});

describe('validHandler', () => {
  test('true', () => {
    expect(validHandler(1)).toBe(true);
  });

  test('false', () => {
    expect(validHandler(undefined)).toBe(false);
    expect(validHandler(null)).toBe(false);
    expect(validHandler(0)).toBe(false);
    expect(validHandler(-1)).toBe(false);
    expect(validHandler('1')).toBe(false);
    expect(validHandler(-Infinity)).toBe(false);
    expect(validHandler(Infinity)).toBe(false);
    expect(validHandler(NaN)).toBe(false);
  });
});

describe('validTimerDelay', () => {
  test('true', () => {
    expect(validTimerDelay(undefined)).toBe(true);
    expect(validTimerDelay(0)).toBe(true);
    expect(validTimerDelay(-0)).toBe(true);
    expect(validTimerDelay(1)).toBe(true);
  });

  test('false', () => {
    expect(validTimerDelay(null)).toBe(false);
    expect(validTimerDelay(-1)).toBe(false);
    expect(validTimerDelay('1')).toBe(false);
    expect(validTimerDelay(-Infinity)).toBe(false);
    expect(validTimerDelay(Infinity)).toBe(false);
    expect(validTimerDelay(NaN)).toBe(false);
  });
});

describe('parseWorkerSpecifier', () => {
  const locationBackup = globalThis.location;

  beforeEach(() => {
    globalThis.location = { origin: 'https://example.com' };
  });
  afterEach(() => {
    globalThis.location = locationBackup;
  });

  test('with protocol', () => {
    expect(parseWorkerSpecifier('blob:https://example.com/w.js'))
      .toBe('blob:https://example.com/w.js');
  });

  test('without protocol', () => {
    expect(parseWorkerSpecifier('w.js?type=modeule')).toBe(
      'https://example.com/w.js?type=modeule',
    );
    expect(parseWorkerSpecifier('/w.js?type=modeule')).toBe(
      'https://example.com/w.js?type=modeule',
    );
  });
});

// wait till `deno` internal pending timers drain
await wait(10);
