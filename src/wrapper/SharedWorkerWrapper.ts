import type { ITraceable } from './shared/TraceUtil.ts';
import {
  parseSharedWorkerOptions,
  parseWorkerSpecifier,
  traceUtil,
} from './shared/util.ts';
import { TraceUtil } from './shared/TraceUtil.ts';
import type { IPanel } from '../api/storage/storage.local.ts';

export interface ISharedWorkerTelemetry {
  total: number;
  collection: ISharedWorkerTelemetryMetric[];
}
export interface ISharedWorkerTelemetryMetric {
  specifier: string;
  inMemory: number;
  konstruktor: ISharedWorkerConstructorMetric[];
}
export interface ISharedWorkerMetric {
  specifier: string;
  inMemory: number;
  konstruktor: Map</*traceId*/ string, ISharedWorkerConstructorMetric>;
}
export interface ISharedWorkerOptions {
  type: 'classic' | 'module';
  credentials: 'same-origin' | 'include' | 'omit' | undefined;
  name: string | undefined;
  sameSiteCookies: 'all' | 'none' | undefined;
}
export interface ISharedWorkerConstructorMetric extends ITraceable {
  options: ISharedWorkerOptions;
  calls: number;
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
          konstruktor: new Map([[
            constructorMetric.traceId,
            constructorMetric,
          ]]),
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

  // override get onerror() {
  //   return super.onerror;
  // }

  // override set onerror(rhs: (e: ErrorEvent) => unknown | null) { }
}

export function updateSharedWorkerCallsPerSecond(panel: IPanel) {
  if (!panel.wrap || !panel.visible) return;

  // sharedWorkerMap.forEach((sharedWorkerMetric) => {
  //   sharedWorkerMetric.onerror.forEach((methodMetric) => {
  //     const prevEvents = sharedWorkerMetric.callsMap.get(methodMetric.traceId) || 0;
  //
  //     methodMetric.eventsCps = methodMetric.events - prevEvents;
  //     sharedWorkerMetric.callsMap.set(methodMetric.traceId, methodMetric.events);
  //   });
  // });
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
      });
    });
  }

  return rv;
}

export function forTest_clearSharedWorkerHistory() {
  sharedWorkerMap.clear();
}
