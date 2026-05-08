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
  firstSeen: number;
  inMemory: number;
  konstruktor: ISharedWorkerConstructorMetric[];
  onerror: ISharedWorkerOnErrorMetric[];
  portStart: ISharedWorkerPortStartMetric[];
  portClose: ISharedWorkerPortCloseMetric[];
}
export interface ISharedWorkerMetric {
  specifier: string;
  firstSeen: number;
  inMemory: number;
  callsMap: Map</*traceId*/ string, /*calls*/ number>;
  konstruktor: Map</*traceId*/ string, ISharedWorkerConstructorMetric>;
  onerror: Map</*traceId*/ string, ISharedWorkerOnErrorMetric>;
  portStart: Map</*traceId*/ string, ISharedWorkerPortStartMetric>;
  portClose: Map</*traceId*/ string, ISharedWorkerPortCloseMetric>;
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
export interface ISharedWorkerPortStartMetric extends ITraceable {
  calls: number;
}
export interface ISharedWorkerPortCloseMetric extends ITraceable {
  calls: number;
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

export class ApiMonitorSharedWorkerWrapper extends SharedWorker {
  readonly #specifier: string;
  readonly #metric: ISharedWorkerMetric;
  readonly #native;

  constructor(specifier: string | URL, options?: string | WorkerOptions) {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));

    if (traceUtil.shouldPause(callstack.traceId)) {
      debugger;
    }
    super(specifier, options);
    this.#specifier = parseWorkerSpecifier(specifier);

    this.#metric = sharedWorkerMap.getOrInsertComputed(
      this.#specifier,
      () => {
        const constructorMetric = {
          traceId: callstack.traceId,
          trace: callstack.trace,
          firstSeen: performance.now(),
          options: parseSharedWorkerOptions(options),
          calls: 0,
        };

        return {
          specifier: this.#specifier,
          firstSeen: performance.now(),
          inMemory: 0,
          callsMap: new Map(),
          konstruktor: new Map([[
            constructorMetric.traceId,
            constructorMetric,
          ]]),
          onerror: new Map(),
          portStart: new Map(),
          portClose: new Map(),
        };
      },
    );

    this.#metric.inMemory++;
    memoryTracker.register(this, this.#specifier);

    const methodMetric = this.#metric.konstruktor.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
          firstSeen: performance.now(),
          options: parseSharedWorkerOptions(options),
          calls: 0,
        };
      },
    );

    methodMetric.calls++;

    this.#native = {
      start: this.port.start.bind(this.port),
      close: this.port.close.bind(this.port),
      postMessage: this.port.postMessage.bind(this.port),
      addEventListener: this.port.addEventListener.bind(this.port),
      removeEventListener: this.port.removeEventListener.bind(this.port),
    };
    this.#wrapMessagePort();
  }

  override get onerror() {
    // @ts-expect-error: internal error - function signature and returning value mismatch
    return super.onerror;
  }

  override set onerror(rhs: (e: ErrorEvent) => unknown | null) {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    const methodMetric = this.#metric.onerror.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
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

  #wrapMessagePort() {
    this.port.start = this.#portStart.bind(this);
    this.port.close = this.#portClose.bind(this);
    this.port.addEventListener = this.#portAddEventListener.bind(this);
    this.port.removeEventListener = this.#portRemoveEventListener.bind(this);
  }

  #portStart() {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    const methodMetric = this.#metric.portStart.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
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
      this.#native.start();
    }
  }

  #portClose() {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    const methodMetric = this.#metric.portClose.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
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
      this.#native.close();
    }
  }

  #portAddEventListener(...args: unknown[]) {
    // @ts-expect-error: covering fire
    this.#native.addEventListener(...args);
  }

  #portRemoveEventListener(...args: unknown[]) {
    // @ts-expect-error: covering fire
    thisl.#native.removeEventListener(...args);
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
  globalThis.SharedWorker = ApiMonitorSharedWorkerWrapper;
}

export function collectSharedWorkerHistory(
  panel: IPanel,
): ISharedWorkerTelemetry {
  const collection: ISharedWorkerTelemetryMetric[] = [];

  if (panel.visible) {
    sharedWorkerMap.forEach((metric) => {
      collection.push({
        specifier: metric.specifier,
        firstSeen: metric.firstSeen,
        inMemory: metric.inMemory,
        konstruktor: Array.from(metric.konstruktor.values()),
        onerror: Array.from(metric.onerror.values()),
        portStart: Array.from(metric.portStart.values()),
        portClose: Array.from(metric.portClose.values()),
      });
    });
  }

  return {
    total: sharedWorkerMap.size,
    collection,
  };
}

export function forTest_clearSharedWorkerHistory() {
  sharedWorkerMap.clear();
}
