import type { IMsgMediaCommand } from '../api/communication.ts';
import {
  isMediaFieldWritable,
  MEDIA_EVENTS,
  MEDIA_FIELDS,
  TIME_60FPS_SEC,
} from '../api/const.ts';
import type { IPanel } from '../api/storage/storage.local.ts';
import { trim2ms } from '../api/time.ts';
import { Fact, type TFact } from './shared/Fact.ts';
import { type ITraceable, TraceUtil } from './shared/TraceUtil.ts';
import {
  atTheEventDetectAutoremove,
  getEventHandlerLinksKey,
  isEventListenerObject,
  parseMediaFieldValue,
  type TEventHandlerLinks,
  traceUtil,
} from './shared/util.ts';

export interface IMediaTelemetry {
  total: number;
  collection: IMediaTelemetryMetrics[];
}
export interface IMediaTelemetryMetrics {
  mediaId: string;
  firstSeen: number;
  type: EMediaType;
  events: IMediaEventMetrics[];
  props: { [key: string]: unknown };
}
export interface IMediaEventMetrics {
  name: string;
  calls: number;
  ael: IMediaAelMetric[];
  rel: IMediaRelMetric[];
}

interface IMediaCacheModel {
  mediaId: string;
  firstSeen: number;
  type: EMediaType;
  events: Map</*event.type*/ string, IMediaEventModel>;
  props: { [key: string]: unknown };
  handleEvent: (e: Event) => void;
  nativeAel: TMediaElement['addEventListener'];
  nativeRel: TMediaElement['removeEventListener'];
}
interface IMediaEventModel {
  name: string;
  calls: number;
  ael: Map</*traceId*/ string, IMediaAelMetric>;
  rel: Map</*traceId*/ string, IMediaRelMetric>;
  eventHandlerLinks: TEventHandlerLinks;
}
export interface IMediaAelMetric extends ITraceable {
  calls: number;
  events: number;
  eventSelfTime: number | null;
  canceledCounter: number;
  facts: TFact;
}
export interface IMediaRelMetric extends ITraceable {
  calls: number;
  facts: TFact;
}
type TMediaElement = HTMLVideoElement | HTMLAudioElement;
export enum EMediaType {
  VIDEO,
  AUDIO,
}
export type TMediaCommand =
  | 'log'
  | 'frame-backward'
  | 'frame-forward'
  | 'pause'
  | 'play'
  | 'load'
  | 'locate'
  | 'toggle-boolean'
  | 'set-volume'
  | 'set-playbackRate';

const MediaAelFact = /*@__PURE__*/ (() => ({
  DUPLICATE_ADDITION: Fact.define(1 << 0),
} as const))();
export const MediaAelFacts = /*@__PURE__*/ (() =>
  Fact.map([
    [MediaAelFact.DUPLICATE_ADDITION, {
      tag: 'A',
      details: `Addition ignored - listener already in the list of events`,
    }],
  ]))();
const MediaRelFact = /*@__PURE__*/ (() => ({
  NOT_FOUND: Fact.define(1 << 0),
} as const))();
export const MediaRelFacts = /*@__PURE__*/ (() =>
  Fact.map([
    [MediaRelFact.NOT_FOUND, {
      tag: 'N',
      details: `Listener not found - nothing to remove`,
    }],
  ]))();

export class MediaWrapper {
  #manuallyAdded: Set<TMediaElement> = new Set();
  #tracked: Set<TMediaElement> = new Set();
  #cached: WeakMap<TMediaElement, IMediaCacheModel> = new WeakMap();

  addToTelemetry(el: TMediaElement) {
    this.#manuallyAdded.add(el);
    this.#cached.getOrInsertComputed(el, (el) => this.#addNewCacheModel(el));
  }

  removeFromTelemetry(el: TMediaElement) {
    this.#manuallyAdded.delete(el);
  }

  meetMedia(panel: IPanel) {
    if (!panel.visible) {
      this.#tracked.size && this.#tracked.clear();
      return;
    }

    this.#tracked = new Set(this.#manuallyAdded);
    const mounted: NodeListOf<TMediaElement> = document.querySelectorAll(
      'video,audio',
    );
    mounted.forEach((el) => {
      this.#tracked.add(el);
      this.#cached.getOrInsertComputed(el, (el) => this.#addNewCacheModel(el));
    });
  }

  collectMetrics(panel: IPanel): IMediaTelemetry {
    const collection: IMediaTelemetryMetrics[] = [];

    if (panel.visible) {
      this.#tracked.forEach((el) => {
        const model = this.#cached.get(el);
        if (!model) return;

        this.#updateModel(el, model);
        collection.push({
          mediaId: model.mediaId,
          firstSeen: model.firstSeen,
          type: model.type,
          events: Array.from(model.events.values()).map((eModel) => ({
            name: eModel.name,
            calls: eModel.calls,
            ael: Array.from(eModel.ael.values()),
            rel: Array.from(eModel.rel.values()),
          })),
          props: model.props,
        });
      });
    }

    return {
      total: this.#tracked.size,
      collection,
    };
  }

  runCommand(o: IMsgMediaCommand) {
    const el = this.#getElementByMediaId(o.mediaId);
    if (!el) return;

    if (o.cmd === 'log') {
      console.log(el);
    } else if (o.cmd === 'locate') {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    } else if (o.cmd === 'load') {
      el.load();
    } else if (o.cmd === 'pause') {
      el.pause();
    } else if (o.cmd === 'play') {
      el.play().catch(() => {});
    } else if (o.cmd === 'frame-backward') {
      el.currentTime -= TIME_60FPS_SEC;
    } else if (o.cmd === 'frame-forward') {
      el.currentTime += TIME_60FPS_SEC;
    } else if (o.cmd === 'toggle-boolean' && typeof o.field === 'string') {
      if (isMediaFieldWritable(o.field)) {
        el[o.field] = !el[o.field];
      }
    } else if (
      o.cmd === 'set-volume' &&
      typeof o.value === 'number' &&
      Number.isFinite(o.value)
    ) {
      el.volume = o.value;
    } else if (
      o.cmd === 'set-playbackRate' &&
      typeof o.value === 'number' &&
      Number.isFinite(o.value)
    ) {
      el.playbackRate = o.value;
    }
  }

  #addNewCacheModel(el: TMediaElement): IMediaCacheModel {
    const modelType = (el instanceof HTMLVideoElement)
      ? EMediaType.VIDEO
      : EMediaType.AUDIO;
    const events: IMediaCacheModel['events'] = new Map();
    const model: IMediaCacheModel = {
      mediaId: crypto.randomUUID(),
      firstSeen: performance.now(),
      type: modelType,
      events,
      props: {},
      handleEvent: function ApiMonitorMediaEventCounter(
        this: IMediaCacheModel,
        e: Event,
      ) {
        const em = this.events.get(e.type);
        em && em.calls++;
      },
      nativeAel: el.addEventListener.bind(el),
      nativeRel: el.removeEventListener.bind(el),
    };

    for (const event of MEDIA_EVENTS) {
      events.set(event, {
        name: event,
        calls: 0,
        ael: new Map(),
        rel: new Map(),
        eventHandlerLinks: new Map(),
      });
      el.addEventListener(event, model);
    }

    this.#wrapAddEventListener(el, model);
    this.#wrapRemoveEventListener(el, model);

    return model;
  }

  #wrapAddEventListener(
    el: TMediaElement,
    model: IMediaCacheModel,
  ) {
    el.addEventListener = function ApiMonitorMediaAddEventListener(
      this: MediaWrapper,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ): void {
      const eventModel = model.events.get(type);
      if (!eventModel) {
        // newer or unsupported events
        model.nativeAel(type, listener, options);
        return;
      }

      const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
      const methodMetric = eventModel.ael.getOrInsertComputed(
        callstack.traceId,
        () => ({
          traceId: callstack.traceId,
          trace: callstack.trace,
          firstSeen: performance.now(),
          calls: 0,
          events: 0,
          eventSelfTime: null,
          canceledCounter: 0,
          facts: Fact.pure,
        }),
      );

      methodMetric.calls++;

      const key = getEventHandlerLinksKey(type, options);
      const link = eventModel.eventHandlerLinks.getOrInsertComputed(
        key,
        () => new WeakMap(),
      );

      if (link.has(listener)) {
        methodMetric.facts = Fact.assign(
          methodMetric.facts,
          MediaAelFact.DUPLICATE_ADDITION,
        );
        return;
      }

      let selfHandler;

      if (typeof listener === 'function') {
        selfHandler = function SelfHandler(...args: Parameters<EventListener>) {
          atTheEventDetectAutoremove(link, listener, options, methodMetric);

          let eventSelfTime: null | number = null;
          const start = performance.now();

          if (traceUtil.shouldPass(methodMetric.traceId)) {
            if (traceUtil.shouldPause(methodMetric.traceId)) {
              debugger;
            }
            listener.call(el, ...args);

            eventSelfTime = trim2ms(performance.now() - start);
            methodMetric.events++;
          }

          methodMetric.eventSelfTime = eventSelfTime;
        };
      } else if (isEventListenerObject(listener)) {
        selfHandler = function SelfHandler(
          ...args: Parameters<EventListenerObject['handleEvent']>
        ) {
          atTheEventDetectAutoremove(link, listener, options, methodMetric);

          let eventSelfTime: null | number = null;
          const start = performance.now();

          if (traceUtil.shouldPass(methodMetric.traceId)) {
            if (traceUtil.shouldPause(methodMetric.traceId)) {
              debugger;
            }
            listener.handleEvent(...args);
            eventSelfTime = trim2ms(performance.now() - start);
            methodMetric.events++;
          }

          methodMetric.eventSelfTime = eventSelfTime;
        };
      }

      if (selfHandler) {
        link.set(listener, {
          actualHandler: selfHandler,
          aelTraceId: methodMetric.traceId,
        });

        model.nativeAel(type, selfHandler, options);
      }
    };
  }

  #wrapRemoveEventListener(
    el: TMediaElement,
    model: IMediaCacheModel,
  ) {
    el.removeEventListener = function ApiMonitorMediaRemoveEventListener(
      this: MediaWrapper,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ): void {
      const eventModel = model.events.get(type);
      if (!eventModel) {
        // newer or unsupported events
        model.nativeRel(type, listener, options);
        return;
      }

      const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
      const methodMetric = eventModel.rel.getOrInsertComputed(
        callstack.traceId,
        () => ({
          traceId: callstack.traceId,
          trace: callstack.trace,
          firstSeen: performance.now(),
          calls: 0,
          facts: Fact.pure,
        }),
      );

      methodMetric.calls++;

      const key = getEventHandlerLinksKey(type, options);
      const link = eventModel.eventHandlerLinks.getOrInsertComputed(
        key,
        () => new WeakMap(),
      );
      const aelRecord = link.get(listener);

      if (!aelRecord) {
        methodMetric.facts = Fact.assign(
          methodMetric.facts,
          MediaRelFact.NOT_FOUND,
        );
      }

      if (traceUtil.shouldPass(methodMetric.traceId)) {
        if (traceUtil.shouldPause(methodMetric.traceId)) {
          debugger;
        }
        model.nativeRel(
          type,
          aelRecord ? aelRecord.actualHandler : listener,
          options,
        );

        if (link && aelRecord) {
          link.delete(listener);

          const aelMethodMetric = eventModel.ael.get(aelRecord.aelTraceId);
          if (aelMethodMetric) {
            aelMethodMetric.canceledCounter++;
          }
        }
      }
    };
  }

  #updateModel(el: TMediaElement, model: IMediaCacheModel) {
    for (const prop of MEDIA_FIELDS) {
      if (prop in el) {
        model.props[prop] = parseMediaFieldValue(
          prop,
          el[prop as keyof TMediaElement],
        );
      }
    }
  }

  #getElementByMediaId(mediaId: string): TMediaElement | null {
    for (const el of this.#tracked) {
      const model = this.#cached.get(el);

      if (model && model.mediaId === mediaId) {
        return el;
      }
    }

    return null;
  }
}
