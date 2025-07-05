import { ETraceDomain, TraceUtil, type TTrace } from './shared/TraceUtil.ts';
import { traceUtil } from './shared/util.ts';
import type { TPanel } from '../api/storage/storage.local.ts';
import { trim2ms } from '../api/time.ts';

export interface IWorkerTelemetry {
  totalOnline: number;
  collection: IWorkerTelemetryMetric[];
}
export interface IWorkerTelemetryMetric {
  specifier: string;
  online: number;
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
  callsPerSecond: Map</*traceId*/ string, /*calls*/ number>;
  konstruktor: Map</*traceId*/ string, IConstructorMetric>;
  terminate: Map</*traceId*/ string, ITerminateMetric>;
  postMessage: Map</*traceId*/ string, IPostMessageMetric>;
  onmessage: Map</*traceId*/ string, IOnMessageMetric>;
  onerror: Map</*traceId*/ string, IOnErrorMetric>;
  ael: Map</*traceId*/ string, IAddEventListenerMetric>;
  rel: Map</*traceId*/ string, IRemoveEventListenerMetric>;
}
interface IConstructorMetric {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
}
interface ITerminateMetric {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
}
interface IPostMessageMetric {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  selfTime: number | null;
  cps: number;
}
interface IOnMessageMetric {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  events: number;
  eventSelfTime: number | null;
  eventsCps: number;
}
interface IOnErrorMetric {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  events: number;
  eventSelfTime: number | null;
  eventsCps: number;
}
interface IAddEventListenerMetric {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  events: number;
  eventSelfTime: number | null;
  eventsCps: number;
}
interface IRemoveEventListenerMetric {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
}

const workerMap: Map</*specifier*/ string, IWorkerMetric> = new Map();

class ApiMonitorWorkerWrapper extends Worker {
  readonly #specifier: string;
  #eventHandlerLink: WeakMap<
    /*authored handler*/ EventListenerOrEventListenerObject,
    /*actual handler*/ EventListener
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
      };
      workerMetric!.ael.set(callstack.traceId, methodMetric);
    }

    /**
     * If the function or object is already in the list of event listeners for this target,
     * the function or object is not added a second time.
     * -- https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
     */
    if (this.#eventHandlerLink.get(<EventListener> listener)) return;

    if (typeof listener === 'function') {
      const selfHandler = function (
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

      this.#eventHandlerLink.set(<EventListener> listener, selfHandler);
      // @ts-expect-error: expects known types
      super.addEventListener(type, selfHandler, options);
    } else if (
      listener && typeof listener === 'object' && 'handleEvent' in listener &&
      typeof listener.handleEvent === 'function'
    ) {
      const selfHandler = function (e: Event) {
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

      this.#eventHandlerLink.set(<EventListenerObject> listener, selfHandler);
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
      };
      workerMetric!.rel.set(callstack.traceId, methodMetric);
    }

    const selfHandler = this.#eventHandlerLink.get(
      <EventListenerOrEventListenerObject> listener,
    );
    if (selfHandler) {
      if (traceUtil.shouldPass(methodMetric.traceId)) {
        if (traceUtil.shouldPause(methodMetric.traceId)) {
          debugger;
        }
        // @ts-expect-error: expects known types
        super.removeEventListener(type, selfHandler, options);
      }
    }
  }
}

export function updateWorkerFrameRateMetrics(panel: TPanel) {
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
