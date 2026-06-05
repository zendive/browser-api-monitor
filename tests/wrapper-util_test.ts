import { describe, expect, test } from 'vitest';
import {
  isTextTrackList,
  isTimeRanges,
  parseSharedWorkerOptions,
  parseWorkerOptions,
  parseWorkerSpecifier,
  validHandler,
  validTimerDelay,
} from '../src/wrapper/shared/util.ts';

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
    // @ts-expect-error: too soon?
    expect(parseSharedWorkerOptions({ sameSiteCookies: 'all' })).toMatchObject({
      type: 'classic',
      sameSiteCookies: 'all',
    });
  });

  test('extendedLifetime', () => {
    // @ts-expect-error: too soon?
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
  test('with protocol', () => {
    expect(parseWorkerSpecifier('blob:https://example.com/w.js'))
      .toBe('blob:https://example.com/w.js');
  });

  test('without protocol', () => {
    expect(parseWorkerSpecifier('w.js?type=module')).toBe(
      `${globalThis.location.origin}/w.js?type=module`,
    );
    expect(parseWorkerSpecifier('/w.js?type=module')).toBe(
      `${globalThis.location.origin}/w.js?type=module`,
    );
  });
});

describe('check media prop instances', () => {
  function whenCanPlay(el: HTMLAudioElement) {
    return new Promise((resolve) => {
      el.addEventListener('canplay', resolve, { once: true });
    });
  }

  test('isTimeRanges', async () => {
    const el = document.createElement('audio');
    el.preload = 'auto';
    el.src = `./assets/stub.ogg`;

    await whenCanPlay(el);
    expect(isTimeRanges(el.buffered)).toBe(true);
  });

  test('isTextTrackList', () => {
    const el = document.createElement('video');
    expect(isTextTrackList(el.textTracks)).toBe(true);
  });
});
