import { TraceUtil, type TTraceable } from './shared/TraceUtil.ts';
import { traceUtil } from './shared/util.ts';
import type { TPanel } from '../api/storage/storage.local.ts';
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
  konstruktor: IConstructorMetric[];
  terminate: ITerminateMetric[];
  postMessage: IPostMessageMetric[];
  onmessage: IOnMessageMetric[];
  onerror: IOnErrorMetric[];
  ael: IAddEventListenerMetric[];
  rel: IRemoveEventListenerMetric[];
}

interface IWorkerMetric {
  specifier: string;
  online: number;
  facts: TFact;
  callsPerSecond: Map</*traceId*/ string, /*calls*/ number>;
  konstruktor: Map</*traceId*/ string, IConstructorMetric>;
  terminate: Map</*traceId*/ string, ITerminateMetric>;
  postMessage: Map</*traceId*/ string, IPostMessageMetric>;
  onmessage: Map</*traceId*/ string, IOnMessageMetric>;
  onerror: Map</*traceId*/ string, IOnErrorMetric>;
  ael: Map</*traceId*/ string, IAddEventListenerMetric>;
  rel: Map</*traceId*/ string, IRemoveEventListenerMetric>;
}
interface IConstructorMetric extends TTraceable {
  calls: number;
}
interface ITerminateMetric extends TTraceable {
  calls: number;
}
interface IPostMessageMetric extends TTraceable {
  calls: number;
  selfTime: number | null;
  cps: number;
}
interface IOnMessageMetric extends TTraceable {
  calls: number;
  events: number;
  eventSelfTime: number | null;
  eventsCps: number;
}
interface IOnErrorMetric extends TTraceable {
  calls: number;
  events: number;
  eventSelfTime: number | null;
  eventsCps: number;
}
interface IAddEventListenerMetric extends TTraceable {
  calls: number;
  events: number;
  eventSelfTime: number | null;
  eventsCps: number;
  canceledCounter: number;
  facts: TFact;
}
interface IRemoveEventListenerMetric extends TTraceable {
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
    const methodMetric: IConstructorMetric = {
      traceId: callstack.traceId,
      trace: callstack.trace,
      traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
      calls: 1,
    };

    if (traceUtil.shouldPause(methodMetric.traceId)) {
      debugger;
    }
    super(specifier, options);

    this.#specifier = String(specifier);
    const workerMetric = workerMap.get(this.#specifier);
    if (workerMetric) {
      workerMetric.online++;

      if (workerMetric.online > HARDWARE_CONCURRENCY) {
        workerMetric.facts = Fact.assign(
          workerMetric.facts,
          WorkerFact.MAX_ONLINE,
        );
      }

      const rec = workerMetric.konstruktor.get(methodMetric.traceId);
      if (rec) {
        rec.calls++;
      } else {
        workerMetric.konstruktor.set(methodMetric.traceId, methodMetric);
      }
    } else {
      workerMap.set(this.#specifier, {
        specifier: this.#specifier,
        online: 1,
        facts: <TFact> 0,
        callsPerSecond: new Map(),
        konstruktor: new Map([[methodMetric.traceId, methodMetric]]),
        terminate: new Map(),
        postMessage: new Map(),
        onmessage: new Map(),
        onerror: new Map(),
        ael: new Map(),
        rel: new Map(),
      });
    }
  }

  terminate() {
    const workerMetric = workerMap.get(this.#specifier);
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    const methodMetric = workerMetric &&
      workerMetric.terminate.get(callstack.traceId);

    if (methodMetric) {
      methodMetric.calls++;
    } else {
      workerMetric!.terminate.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
        calls: 1,
      });
    }

    if (traceUtil.shouldPass(callstack.traceId)) {
      if (traceUtil.shouldPause(callstack.traceId)) {
        debugger;
      }
      super.terminate();
      if (workerMetric!.online) {
        workerMetric!.online--;
      }
    }
  }

  // @ts-expect-error: `Parameters...` conflict with multiple signatures overrides
  postMessage(...args: Parameters<Worker['postMessage']>) {
    const workerMetric = workerMap.get(this.#specifier);
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    const methodMetric = workerMetric &&
      workerMetric.postMessage.get(callstack.traceId);
    const start = performance.now();
    let selfTime = null;

    if (traceUtil.shouldPass(callstack.traceId)) {
      if (traceUtil.shouldPause(callstack.traceId)) {
        debugger;
      }
      super.postMessage(...args);
      selfTime = trim2ms(performance.now() - start);
    }

    if (methodMetric) {
      methodMetric.calls++;
      methodMetric.selfTime = selfTime;
    } else {
      workerMetric!.postMessage.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
        calls: 1,
        selfTime,
        cps: 1,
      });
    }
  }

  set onmessage(rhs: (ev: MessageEvent) => unknown | null) {
    const workerMetric = workerMap.get(this.#specifier);
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    let methodMetric = workerMetric &&
      workerMetric.onmessage.get(callstack.traceId);
    let eventSelfTime: null | number = null;

    if (methodMetric) {
      methodMetric.calls++;
    } else {
      methodMetric = {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
        calls: 1,
        events: 0,
        eventSelfTime,
        eventsCps: 1,
      };
      workerMetric!.onmessage.set(callstack.traceId, methodMetric);
    }

    if (typeof rhs === 'function') {
      super.onmessage = function (...args) {
        const start = performance.now();

        if (traceUtil.shouldPass(methodMetric.traceId)) {
          if (traceUtil.shouldPause(methodMetric.traceId)) {
            debugger;
          }
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

  set onerror(rhs: (e: ErrorEvent) => unknown | null) {
    const workerMetric = workerMap.get(this.#specifier);
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    let methodMetric = workerMetric &&
      workerMetric.onerror.get(callstack.traceId);
    let eventSelfTime: null | number = null;

    if (methodMetric) {
      methodMetric.calls++;
    } else {
      methodMetric = {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
        calls: 1,
        events: 0,
        eventSelfTime,
        eventsCps: 1,
      };
      workerMetric!.onerror.set(callstack.traceId, methodMetric);
    }

    if (typeof rhs === 'function') {
      super.onerror = function (...args) {
        const start = performance.now();

        if (traceUtil.shouldPass(methodMetric.traceId)) {
          if (traceUtil.shouldPause(methodMetric.traceId)) {
            debugger;
          }
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

  addEventListener(type: string, listener: unknown, options?: unknown) {
    const workerMetric = workerMap.get(this.#specifier);
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    let methodMetric = workerMetric && workerMetric.ael.get(callstack.traceId);
    let eventSelfTime: null | number = null;

    if (methodMetric) {
      methodMetric.calls++;
    } else {
      methodMetric = {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
        calls: 1,
        events: 0,
        eventSelfTime,
        eventsCps: 1,
        canceledCounter: 0,
        facts: <TFact> 0,
      };
      workerMetric!.ael.set(callstack.traceId, methodMetric);
    }

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

  removeEventListener(type: string, listener: unknown, options?: unknown) {
    const workerMetric = workerMap.get(this.#specifier);
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    let methodMetric = workerMetric &&
      workerMetric.rel.get(callstack.traceId);

    if (methodMetric) {
      methodMetric.calls++;
    } else {
      methodMetric = {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
        calls: 1,
        facts: <TFact> 0,
      };
      workerMetric!.rel.set(callstack.traceId, methodMetric);
    }

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

        const aelMethodMetric = workerMetric?.ael.get(aelRecord.aelTraceId);
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

export function updateWorkerCallsPerSecond(panel: TPanel) {
  if (!panel.wrap || !panel.visible) return;

  for (const [_, workerMetric] of workerMap) {
    const cpsMap = workerMetric.callsPerSecond;

    for (const [_, methodMetric] of workerMetric.postMessage) {
      const prevCalls = cpsMap.get(methodMetric.traceId) || 0;

      methodMetric.cps = methodMetric.calls - prevCalls;
      cpsMap.set(methodMetric.traceId, methodMetric.calls);
    }

    for (const [_, methodMetric] of workerMetric.onmessage) {
      const prevEvents = cpsMap.get(methodMetric.traceId) || 0;

      methodMetric.eventsCps = methodMetric.events - prevEvents;
      cpsMap.set(methodMetric.traceId, methodMetric.events);
    }

    for (const [_, methodMetric] of workerMetric.onerror) {
      const prevEvents = cpsMap.get(methodMetric.traceId) || 0;

      methodMetric.eventsCps = methodMetric.events - prevEvents;
      cpsMap.set(methodMetric.traceId, methodMetric.events);
    }

    for (const [_, methodMetric] of workerMetric.ael) {
      const prevEvents = cpsMap.get(methodMetric.traceId) || 0;

      methodMetric.eventsCps = methodMetric.events - prevEvents;
      cpsMap.set(methodMetric.traceId, methodMetric.events);
    }
  }
}

export function wrapWorker() {
  // @ts-expect-error: TS2322 - new class extends from `Worker`
  globalThis.Worker = ApiMonitorWorkerWrapper;
}

export function collectWorkerHistory(panel: TPanel): IWorkerTelemetry {
  const rv: IWorkerTelemetry = {
    totalOnline: 0,
    collection: [],
  };

  for (const [_, metric] of workerMap) {
    rv.totalOnline += metric.online;
  }

  if (panel.visible) {
    for (const [_, metric] of workerMap) {
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
    }
  }

  return rv;
}

export function forTest_clearWorkerHistory() {
  workerMap.clear();
}
