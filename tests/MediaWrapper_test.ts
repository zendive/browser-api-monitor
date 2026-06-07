import { beforeEach, describe, expect, test } from 'vitest';
import {
  MediaAelFact,
  MediaRelFact,
  MediaWrapper,
} from '../src/wrapper/MediaWrapper.ts';
import type { IPanel } from '../src/api/storage/storage.local.ts';
import { NOOP } from '../src/api/const.ts';
import { Fact } from '../src/wrapper/shared/Fact.ts';

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

function getEventMetric(mw: MediaWrapper, name: string) {
  const { collection } = mw.collectMetrics(mediaPanel);
  return collection[0].events.find((o) => o.name === name)!;
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
    let metric = getEventMetric(mw, 'canplay');
    expect(metric.ael.length).toBe(1);
    expect(metric.rel.length).toBe(0);

    await when('canplay', el, () => {
      el.src = `./assets/stub.ogg`;
    });

    el.removeEventListener('canplay', NOOP);
    metric = getEventMetric(mw, 'canplay');
    expect(metric.ael.length).toBe(2);
    expect(metric.rel.length).toBe(1);
  });

  test('aEL fact', () => {
    const el = document.createElement('audio');
    mw.addToTelemetry(el);
    mw.meetMedia(mediaPanel);

    el.addEventListener('error', NOOP);
    let metric = getEventMetric(mw, 'error');
    expect(metric.ael[0].facts).toBe(Fact.pure);

    el.addEventListener('error', NOOP, { capture: true });
    metric = getEventMetric(mw, 'error');
    expect(metric.ael[1].facts).toBe(Fact.pure);

    el.addEventListener('error', NOOP, { capture: true });
    metric = getEventMetric(mw, 'error');
    expect(metric.ael[2].facts).toBe(MediaAelFact.DUPLICATE_ADDITION);
  });

  test('rEL fact', () => {
    const el = document.createElement('audio');
    mw.addToTelemetry(el);
    mw.meetMedia(mediaPanel);

    let metric = getEventMetric(mw, 'error');
    expect(metric.rel.length).toBe(0);

    el.removeEventListener('error', NOOP);
    metric = getEventMetric(mw, 'error');
    expect(metric.rel[0].facts).toBe(MediaRelFact.NOT_FOUND);
  });
});
