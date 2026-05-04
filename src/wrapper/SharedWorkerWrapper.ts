import type { ITraceable } from './shared/TraceUtil.ts';
import {
  parseSharedWorkerOptions,
  parseWorkerSpecifier,
  traceUtil,
} from './shared/util.ts';
import { TraceUtil } from './shared/TraceUtil.ts';
import type { IPanel } from '../api/storage/storage.local.ts';
import { trim2ms } from '../api/time.ts';

export interface ISharedWorkerTelemetry {
  total: number;
  collection: ISharedWorkerTelemetryMetric[];
}
export interface ISharedWorkerTelemetryMetric {
  specifier: string;
  inMemory: number;
  konstruktor: ISharedWorkerConstructorMetric[];
  onerror: ISharedWorkerOnErrorMetric[];
}
export interface ISharedWorkerMetric {
  specifier: string;
  inMemory: number;
  callsMap: Map</*traceId*/ string, /*calls*/ number>;
  konstruktor: Map</*traceId*/ string, ISharedWorkerConstructorMetric>;
  onerror: Map</*traceId*/ string, ISharedWorkerOnErrorMetric>;
}
export interface ISharedWorkerConstructorMetric extends ITraceable {
  options: ISharedWorkerOptions;
  calls: number;
}
export interface ISharedWorkerOnErrorMetric extends ITraceable {
  calls: number;
  events: number;
  eventSelfTime: number | null;
  eventsCps: number;
}
export interface ISharedWorkerOptions {
  type: 'classic' | 'module';
  credentials: 'same-origin' | 'include' | 'omit' | undefined;
  name: string | undefined;
  sameSiteCookies: 'all' | 'none' | undefined;
  extendedLifetime: boolean | undefined;
}

const sharedWorkerMap: Map</*specifier*/ string, ISharedWorkerMetric> =
  new Map();
const memoryTracker = new FinalizationRegistry((specifier: string) => {
  const sharedWorkerMetric = sharedWorkerMap.get(specifier);
  sharedWorkerMetric && sharedWorkerMetric.inMemory--;
});

export class ApiMonitorSharedWorker extends SharedWorker {
  readonly #specifier: string;

  constructor(specifier: string | URL, options?: string | WorkerOptions) {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));

    if (traceUtil.shouldPause(callstack.traceId)) {
      debugger;
    }
    super(specifier, options);
    this.#specifier = parseWorkerSpecifier(specifier);

    const sharedWorkerMetric = sharedWorkerMap.getOrInsertComputed(
      this.#specifier,
      () => {
        const constructorMetric = {
          traceId: callstack.traceId,
          trace: callstack.trace,
          traceDomain: traceUtil.getDomain(callstack),
          firstSeen: performance.now(),
          options: parseSharedWorkerOptions(options),
          calls: 0,
        };

        return {
          specifier: this.#specifier,
          inMemory: 0,
          callsMap: new Map(),
          konstruktor: new Map([[
            constructorMetric.traceId,
            constructorMetric,
          ]]),
          onerror: new Map(),
        };
      },
    );

    sharedWorkerMetric.inMemory++;
    memoryTracker.register(this, this.#specifier);

    const methodMetric = sharedWorkerMetric.konstruktor.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
          traceDomain: traceUtil.getDomain(callstack),
          firstSeen: performance.now(),
          options: parseSharedWorkerOptions(options),
          calls: 0,
        };
      },
    );

    methodMetric.calls++;
  }

  override get onerror() {
    // @ts-expect-error: internal error - function signature and returning value mismatch
    return super.onerror;
  }

  override set onerror(rhs: (e: ErrorEvent) => unknown | null) {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    const sharedWorkerMetric = sharedWorkerMap.get(this.#specifier)!;
    const methodMetric = sharedWorkerMetric.onerror.getOrInsertComputed(
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
          eventsCps: 0,
        };
      },
    );

    methodMetric.calls++;

    if (typeof rhs !== 'function') {
      super.onerror = rhs;
      return;
    }

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
  }
}

export function updateSharedWorkerCallsPerSecond(panel: IPanel) {
  if (!panel.wrap || !panel.visible) return;

  sharedWorkerMap.forEach((sharedWorkerMetric) => {
    sharedWorkerMetric.onerror.forEach((methodMetric) => {
      const prevEvents =
        sharedWorkerMetric.callsMap.get(methodMetric.traceId) || 0;

      methodMetric.eventsCps = methodMetric.events - prevEvents;
      sharedWorkerMetric.callsMap.set(
        methodMetric.traceId,
        methodMetric.events,
      );
    });
  });
}

export function wrapSharedWorker() {
  globalThis.SharedWorker = ApiMonitorSharedWorker;
}

export function collectSharedWorkerHistory(
  panel: IPanel,
): ISharedWorkerTelemetry {
  const rv: ISharedWorkerTelemetry = {
    total: sharedWorkerMap.size,
    collection: [],
  };

  if (panel.visible) {
    sharedWorkerMap.forEach((metric) => {
      rv.collection.push({
        specifier: metric.specifier,
        inMemory: metric.inMemory,
        konstruktor: Array.from(metric.konstruktor.values()),
        onerror: Array.from(metric.onerror.values()),
      });
    });
  }

  return rv;
}

export function forTest_clearSharedWorkerHistory() {
  sharedWorkerMap.clear();
}
