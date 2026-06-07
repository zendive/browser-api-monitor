import { beforeEach, describe, expect, test } from 'vitest';
import {
  type IMediaTelemetryMetrics,
  MediaWrapper,
} from '../src/wrapper/MediaWrapper.ts';
import type { IPanel } from '../src/api/storage/storage.local.ts';
import { NOOP } from '../src/api/const.ts';

const mediaPanel: IPanel = {
  key: 'media',
  label: 'stub',
  visible: true,
};

function when(type: string, el: HTMLAudioElement, fn: () => void) {
  return new Promise((resolve) => {
    el.addEventListener(type, resolve, { once: true });
    fn();
  });
}

function getEvent(mtm: IMediaTelemetryMetrics, name: string) {
  return mtm.events.find((o) => o.name === name);
}

describe('MediaWrapper', () => {
  let mw: MediaWrapper;

  beforeEach(() => {
    mw = new MediaWrapper();
  });

  test('addToTelemetry / removeFromTelemetry', () => {
    const el = document.createElement('audio');

    mw.addToTelemetry(el);
    mw.meetMedia(mediaPanel);

    let metrics = mw.collectMetrics(mediaPanel);
    expect(metrics.total).toBe(1);

    mw.removeFromTelemetry(el);
    mw.meetMedia(mediaPanel);

    metrics = mw.collectMetrics(mediaPanel);
    expect(metrics.total).toBe(0);
  });

  test('aEL / rEL', async () => {
    const el = document.createElement('audio');
    el.preload = 'auto';

    mw.addToTelemetry(el);
    mw.meetMedia(mediaPanel);
    el.addEventListener('canplay', NOOP);

    const { collection: afterAel } = mw.collectMetrics(mediaPanel);
    expect(getEvent(afterAel[0], 'canplay')!.ael.length).toBe(1);
    expect(getEvent(afterAel[0], 'canplay')!.rel.length).toBe(0);

    await when('canplay', el, () => {
      el.src = `./assets/stub.ogg`;
    });

    el.removeEventListener('canplay', NOOP);
    const { collection: afterRel } = mw.collectMetrics(mediaPanel);

    expect(getEvent(afterRel[0], 'canplay')!.ael.length).toBe(2);
    expect(getEvent(afterRel[0], 'canplay')!.rel.length).toBe(1);
  });
});
