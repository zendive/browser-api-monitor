import type { ITraceable } from './shared/TraceUtil.ts';
import { parseSharedWorkerOptions, traceUtil } from './shared/util.ts';
import { TraceUtil } from './shared/TraceUtil.ts';
import type { IPanel } from '../api/storage/storage.local.ts';

export interface ISharedWorkerTelemetry {
  collection: ISharedWorkerTelemetryMetric[];
}
export interface ISharedWorkerTelemetryMetric {
  specifier: string;
  konstruktor: ISharedWorkerConstructorMetric[];
}
export interface ISharedWorkerMetric {
  specifier: string;
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

export class ApiMonitorSharedWorker extends SharedWorker {
  readonly #specifier: string;

  constructor(scriptURL: string | URL, options?: string | WorkerOptions) {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));

    if (traceUtil.shouldPause(callstack.traceId)) {
      debugger;
    }
    super(scriptURL, options);
    this.#specifier = String(scriptURL);

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
          konstruktor: new Map([[
            constructorMetric.traceId,
            constructorMetric,
          ]]),
        };
      },
    );

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
    return super.onerror;
  }

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
  const rv: ISharedWorkerTelemetry = { collection: [] };

  if (panel.visible) {
    sharedWorkerMap.forEach((metric) => {
      rv.collection.push({
        specifier: metric.specifier,
        konstruktor: Array.from(metric.konstruktor.values()),
      });
    });
  }

  return rv;
}

export function forTest_clearSharedWorkerHistory() {
  sharedWorkerMap.clear();
}
