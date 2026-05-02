import { type ITraceable, TraceUtil } from './shared/TraceUtil.ts';
import { parseWorkerOptions, traceUtil } from './shared/util.ts';
import type { IPanel } from '../api/storage/storage.local.ts';
import { trim2ms } from '../api/time.ts';
import { Fact, type TFact } from './shared/Fact.ts';

export interface IWorkerTelemetry {
  totalOnline: number;
  collection: IWorkerTelemetryMetric[];
}
export interface IWorkerTelemetryMetric {
  specifier: string;
  online: number;
  facts: TFact;
  konstruktor: IWorkerConstructorMetric[];
  terminate: IWorkerTerminateMetric[];
  postMessage: IWorkerPostMessageMetric[];
  onmessage: IWorkerOnMessageMetric[];
  onerror: IWorkerOnErrorMetric[];
  ael: IWorkerAelMetric[];
  rel: IWorkerRelMetric[];
}
interface IWorkerMetric {
  specifier: string;
  online: number;
  facts: TFact;
  callsMap: Map</*traceId*/ string, /*calls*/ number>;
  konstruktor: Map</*traceId*/ string, IWorkerConstructorMetric>;
  terminate: Map</*traceId*/ string, IWorkerTerminateMetric>;
  postMessage: Map</*traceId*/ string, IWorkerPostMessageMetric>;
  onmessage: Map</*traceId*/ string, IWorkerOnMessageMetric>;
  onerror: Map</*traceId*/ string, IWorkerOnErrorMetric>;
  ael: Map</*traceId*/ string, IWorkerAelMetric>;
  rel: Map</*traceId*/ string, IWorkerRelMetric>;
}
export interface IWorkerOptions {
  type: 'classic' | 'module';
  credentials: 'same-origin' | 'include' | 'omit' | undefined;
  name: string | undefined;
}
export interface IWorkerConstructorMetric extends ITraceable {
  options: IWorkerOptions;
  calls: number;
}
export interface IWorkerTerminateMetric extends ITraceable {
  calls: number;
}
export interface IWorkerPostMessageMetric extends ITraceable {
  calls: number;
  selfTime: number | null;
  cps: number;
}
export interface IWorkerOnMessageMetric extends ITraceable {
  calls: number;
  events: number;
  eventSelfTime: number | null;
  eventsCps: number;
}
export interface IWorkerOnErrorMetric extends ITraceable {
  calls: number;
  events: number;
  eventSelfTime: number | null;
  eventsCps: number;
}
export interface IWorkerAelMetric extends ITraceable {
  calls: number;
  events: number;
  eventSelfTime: number | null;
  eventsCps: number;
  canceledCounter: number;
  facts: TFact;
}
export interface IWorkerRelMetric extends ITraceable {
  calls: number;
  facts: TFact;
}

const workerMap: Map</*specifier*/ string, IWorkerMetric> = new Map();
export const HARDWARE_CONCURRENCY = globalThis.navigator.hardwareConcurrency;
export const WorkerFact = /*@__PURE__*/ (() => ({
  MAX_ONLINE: Fact.define(1 << 0),
} as const))();
export const WorkerConstructorFacts = /*@__PURE__*/ (() =>
  Fact.map([
    [WorkerFact.MAX_ONLINE, {
      tag: 'N',
      details:
        `Number of online instances exceeds number of available CPUs [${HARDWARE_CONCURRENCY}]`,
    }],
  ]))();
export const WorkerAELFact = /*@__PURE__*/ (() => ({
  DUPLICATE_ADDITION: Fact.define(1 << 0),
} as const))();
export const WorkerAELFacts = /*@__PURE__*/ (() =>
  Fact.map([
    [WorkerAELFact.DUPLICATE_ADDITION, {
      tag: 'A',
      details: `Addition ignored - listener already in the list of events`,
    }],
  ]))();
export const WorkerRELFact = /*@__PURE__*/ (() => ({
  NOT_FOUND: Fact.define(1 << 0),
} as const))();
export const WorkerRELFacts = /*@__PURE__*/ (() =>
  Fact.map([
    [WorkerRELFact.NOT_FOUND, {
      tag: 'N',
      details: `Listener not found - nothing to remove`,
    }],
  ]))();

export class ApiMonitorWorkerWrapper extends Worker {
  readonly #specifier: string;
  #eventHandlerLink: WeakMap<
    /*authored handler*/ EventListenerOrEventListenerObject,
    {
      aelTraceId: string;
      actualHandler: EventListener;
    }
  > = new WeakMap();

  constructor(specifier: string | URL, options?: WorkerOptions) {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));

    if (traceUtil.shouldPause(callstack.traceId)) {
      debugger;
    }
    super(specifier, options);
    this.#specifier = String(specifier);

    const workerMetric = workerMap.getOrInsertComputed(this.#specifier, () => {
      const constructorMetric = {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: traceUtil.getDomain(callstack),
        firstSeen: performance.now(),
        options: parseWorkerOptions(options),
        calls: 0,
      };

      return {
        specifier: this.#specifier,
        online: 0,
        facts: <TFact> 0,
        callsMap: new Map(),
        konstruktor: new Map([[constructorMetric.traceId, constructorMetric]]),
        terminate: new Map(),
        postMessage: new Map(),
        onmessage: new Map(),
        onerror: new Map(),
        ael: new Map(),
        rel: new Map(),
      };
    });

    workerMetric.online++;

    if (workerMetric.online > HARDWARE_CONCURRENCY) {
      workerMetric.facts = Fact.assign(
        workerMetric.facts,
        WorkerFact.MAX_ONLINE,
      );
    }

    const methodMetric = workerMetric.konstruktor.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
          traceDomain: traceUtil.getDomain(callstack),
          firstSeen: performance.now(),
          options: parseWorkerOptions(options),
          calls: 0,
        };
      },
    );

    methodMetric.calls++;
  }

  override terminate() {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    const workerMetric = workerMap.get(this.#specifier)!;
    const methodMetric = workerMetric.terminate.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
          traceDomain: traceUtil.getDomain(callstack),
          firstSeen: performance.now(),
          calls: 0,
        };
      },
    );

    methodMetric.calls++;

    if (traceUtil.shouldPass(callstack.traceId)) {
      if (traceUtil.shouldPause(callstack.traceId)) {
        debugger;
      }
      super.terminate();

      if (workerMetric.online) {
        workerMetric.online--;
      }
    }
  }

  // @ts-expect-error: `Parameters...` conflict with multiple signatures overrides
  override postMessage(...args: Parameters<Worker['postMessage']>) {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    let selfTime = null;

    if (traceUtil.shouldPass(callstack.traceId)) {
      if (traceUtil.shouldPause(callstack.traceId)) {
        debugger;
      }
      const start = performance.now();
      super.postMessage(...args);
      selfTime = trim2ms(performance.now() - start);
    }

    const workerMetric = workerMap.get(this.#specifier)!;
    const methodMetric = workerMetric.postMessage.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
          traceDomain: traceUtil.getDomain(callstack),
          firstSeen: performance.now(),
          calls: 0,
          selfTime,
          cps: 1,
        };
      },
    );

    methodMetric.calls++;
    methodMetric.selfTime = selfTime;
  }

  override get onmessage() {
    // @ts-expect-error: internal error - function signature and returning value mismatch
    return super.onmessage;
  }

  override set onmessage(rhs: (ev: MessageEvent) => unknown | null) {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    const workerMetric = workerMap.get(this.#specifier)!;
    const methodMetric = workerMetric.onmessage.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
          traceDomain: traceUtil.getDomain(callstack),
          firstSeen: performance.now(),
          calls: 0,
          events: 0,
          eventSelfTime: null,
          eventsCps: 1,
        };
      },
    );

    methodMetric.calls++;

    if (typeof rhs === 'function') {
      super.onmessage = function (...args) {
        let eventSelfTime: null | number = null;

        if (traceUtil.shouldPass(methodMetric.traceId)) {
          if (traceUtil.shouldPause(methodMetric.traceId)) {
            debugger;
          }
          const start = performance.now();
          rhs(...args);
          eventSelfTime = trim2ms(performance.now() - start);
          methodMetric.events++;
        }

        methodMetric.eventSelfTime = eventSelfTime;
      };
    } else {
      super.onmessage = rhs;
    }
  }

  override get onerror() {
    // @ts-expect-error: internal error - function signature and returning value mismatch
    return super.onerror;
  }

  override set onerror(rhs: (e: ErrorEvent) => unknown | null) {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    const workerMetric = workerMap.get(this.#specifier)!;
    const methodMetric = workerMetric.onerror.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
          traceDomain: traceUtil.getDomain(callstack),
          firstSeen: performance.now(),
          calls: 0,
          events: 0,
          eventSelfTime: null,
          eventsCps: 1,
        };
      },
    );

    methodMetric.calls++;

    if (typeof rhs === 'function') {
      super.onerror = function (...args) {
        let eventSelfTime: null | number = null;

        if (traceUtil.shouldPass(methodMetric.traceId)) {
          if (traceUtil.shouldPause(methodMetric.traceId)) {
            debugger;
          }
          const start = performance.now();
          rhs(...args);
          eventSelfTime = trim2ms(performance.now() - start);
          methodMetric.events++;
        }

        methodMetric.eventSelfTime = eventSelfTime;
      };
    } else {
      super.onerror = rhs;
    }
  }

  override addEventListener(
    type: string,
    listener: unknown,
    options?: unknown,
  ) {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    const workerMetric = workerMap.get(this.#specifier)!;
    const methodMetric = workerMetric.ael.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
          traceDomain: traceUtil.getDomain(callstack),
          firstSeen: performance.now(),
          calls: 0,
          events: 0,
          eventSelfTime: null,
          eventsCps: 1,
          canceledCounter: 0,
          facts: <TFact> 0,
        };
      },
    );

    methodMetric.calls++;

    /**
     * If the function or object is already in the list of event listeners for this target,
     * the function or object is not added a second time.
     * -- https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
     */
    if (this.#eventHandlerLink.has(<EventListener> listener)) {
      methodMetric.facts = Fact.assign(
        methodMetric.facts,
        WorkerAELFact.DUPLICATE_ADDITION,
      );
      return;
    }

    let selfHandler;

    if (typeof listener === 'function') {
      selfHandler = function (
        this: ApiMonitorWorkerWrapper,
        e: Event,
      ) {
        let eventSelfTime: null | number = null;
        const start = performance.now();

        if (traceUtil.shouldPass(methodMetric.traceId)) {
          if (traceUtil.shouldPause(methodMetric.traceId)) {
            debugger;
          }
          (<EventListener> listener).call(this, e);
          eventSelfTime = trim2ms(performance.now() - start);
          methodMetric.events++;
        }

        methodMetric.eventSelfTime = eventSelfTime;
      }.bind(this);
    } else if (
      listener && typeof listener === 'object' && 'handleEvent' in listener &&
      typeof listener.handleEvent === 'function'
    ) {
      selfHandler = function (e: Event) {
        let eventSelfTime: null | number = null;
        const start = performance.now();

        if (traceUtil.shouldPass(methodMetric.traceId)) {
          if (traceUtil.shouldPause(methodMetric.traceId)) {
            debugger;
          }
          (<EventListenerObject> listener).handleEvent(e);
          eventSelfTime = trim2ms(performance.now() - start);
          methodMetric.events++;
        }

        methodMetric.eventSelfTime = eventSelfTime;
      };
    }

    if (selfHandler) {
      this.#eventHandlerLink.set(<EventListenerObject> listener, {
        actualHandler: selfHandler,
        aelTraceId: methodMetric.traceId,
      });
      // @ts-expect-error: expects known types
      super.addEventListener(type, selfHandler, options);
    }
  }

  override removeEventListener(
    type: string,
    listener: unknown,
    options?: unknown,
  ) {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    const workerMetric = workerMap.get(this.#specifier)!;
    const methodMetric = workerMetric.rel.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
          traceDomain: traceUtil.getDomain(callstack),
          firstSeen: performance.now(),
          calls: 0,
          facts: <TFact> 0,
        };
      },
    );

    methodMetric.calls++;

    const aelRecord = this.#eventHandlerLink.get(
      <EventListenerOrEventListenerObject> listener,
    );

    if (aelRecord) {
      if (traceUtil.shouldPass(methodMetric.traceId)) {
        if (traceUtil.shouldPause(methodMetric.traceId)) {
          debugger;
        }
        // @ts-expect-error: expects known types
        super.removeEventListener(type, aelRecord.actualHandler, options);
        this.#eventHandlerLink.delete(
          <EventListenerOrEventListenerObject> listener,
        );

        const aelMethodMetric = workerMetric.ael.get(aelRecord.aelTraceId);
        if (aelMethodMetric) {
          aelMethodMetric.canceledCounter++;
        }
      }
    } else {
      methodMetric.facts = Fact.assign(
        methodMetric.facts,
        WorkerRELFact.NOT_FOUND,
      );
    }
  }
}

export function updateWorkerCallsPerSecond(panel: IPanel) {
  if (!panel.wrap || !panel.visible) return;

  workerMap.forEach((workerMetric) => {
    workerMetric.postMessage.forEach((methodMetric) => {
      const prevCalls = workerMetric.callsMap.get(methodMetric.traceId) || 0;

      methodMetric.cps = methodMetric.calls - prevCalls;
      workerMetric.callsMap.set(methodMetric.traceId, methodMetric.calls);
    });

    workerMetric.onmessage.forEach((methodMetric) => {
      const prevEvents = workerMetric.callsMap.get(methodMetric.traceId) || 0;

      methodMetric.eventsCps = methodMetric.events - prevEvents;
      workerMetric.callsMap.set(methodMetric.traceId, methodMetric.events);
    });

    workerMetric.onerror.forEach((methodMetric) => {
      const prevEvents = workerMetric.callsMap.get(methodMetric.traceId) || 0;

      methodMetric.eventsCps = methodMetric.events - prevEvents;
      workerMetric.callsMap.set(methodMetric.traceId, methodMetric.events);
    });

    workerMetric.ael.forEach((methodMetric) => {
      const prevEvents = workerMetric.callsMap.get(methodMetric.traceId) || 0;

      methodMetric.eventsCps = methodMetric.events - prevEvents;
      workerMetric.callsMap.set(methodMetric.traceId, methodMetric.events);
    });
  });
}

export function wrapWorker() {
  // @ts-expect-error: TS2322 - new class extends from `Worker`
  globalThis.Worker = ApiMonitorWorkerWrapper;
}

export function collectWorkerHistory(panel: IPanel): IWorkerTelemetry {
  const rv: IWorkerTelemetry = {
    totalOnline: 0,
    collection: [],
  };

  if (panel.visible) {
    workerMap.forEach((metric) => {
      rv.totalOnline += metric.online;
      rv.collection.push({
        specifier: metric.specifier,
        online: metric.online,
        facts: metric.facts,
        konstruktor: Array.from(metric.konstruktor.values()),
        terminate: Array.from(metric.terminate.values()),
        postMessage: Array.from(metric.postMessage.values()),
        onmessage: Array.from(metric.onmessage.values()),
        onerror: Array.from(metric.onerror.values()),
        ael: Array.from(metric.ael.values()),
        rel: Array.from(metric.rel.values()),
      });
    });
  } else {
    workerMap.forEach((metric) => {
      rv.totalOnline += metric.online;
    });
  }

  return rv;
}

export function forTest_clearWorkerHistory() {
  workerMap.clear();
}
