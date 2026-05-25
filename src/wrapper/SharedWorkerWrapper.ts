import type { ITraceable } from './shared/TraceUtil.ts';
import type { IPanel } from '../api/storage/storage.local.ts';
import {
  parseSharedWorkerOptions,
  parseWorkerSpecifier,
  traceUtil,
} from './shared/util.ts';
import { TraceUtil } from './shared/TraceUtil.ts';
import { trim2ms } from '../api/time.ts';
import { Fact, type TFact } from './shared/Fact.ts';
import { WorkerAelFact, WorkerRelFact } from './WorkerWrapper.ts';
import { NOOP } from '../api/const.ts';

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
  portPostMessage: ISharedWorkerPortPostMessageMetric[];
  portAel: ISharedWorkerPortAelMetric[];
  portRel: ISharedWorkerPortRelMetric[];
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
  portPostMessage: Map</*traceId*/ string, ISharedWorkerPortPostMessageMetric>;
  portAel: Map</*traceId*/ string, ISharedWorkerPortAelMetric>;
  portRel: Map</*traceId*/ string, ISharedWorkerPortRelMetric>;
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
export interface ISharedWorkerPortPostMessageMetric extends ITraceable {
  calls: number;
  selfTime: number | null;
  cps: number;
}
export interface ISharedWorkerPortAelMetric extends ITraceable {
  calls: number;
  events: number;
  eventSelfTime: number | null;
  eventsCps: number;
  canceledCounter: number;
  facts: TFact;
}
export interface ISharedWorkerPortRelMetric extends ITraceable {
  calls: number;
  facts: TFact;
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
  readonly #eventHandlerLink: WeakMap<
    /*authored handler*/ EventListenerOrEventListenerObject,
    {
      aelTraceId: string;
      actualHandler: EventListener;
    }
  > = new WeakMap();

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
          portPostMessage: new Map(),
          portAel: new Map(),
          portRel: new Map(),
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
      /** @note:
       * using "optional chaining operator"+"NOOP" to workaround the
       * failing test around start/close methods, since `@okikio/sharedworker`
       * polyfill implementation is the only closest polyfill suitable
       * for a deno environment I could find at the moment.
       */
      start: this.port.start?.bind(this.port) || NOOP,
      close: this.port.close?.bind(this.port) || NOOP,
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
    // @ts-expect-error: suppress multiple signatures
    this.port.postMessage = this.#portPostMessage.bind(this);
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

  #portPostMessage(...args: Parameters<MessagePort['postMessage']>) {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    let selfTime = null;

    if (traceUtil.shouldPass(callstack.traceId)) {
      if (traceUtil.shouldPause(callstack.traceId)) {
        debugger;
      }
      const start = performance.now();
      this.#native.postMessage(...args);
      selfTime = trim2ms(performance.now() - start);
    }

    const methodMetric = this.#metric.portPostMessage.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
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

  #portAddEventListener(
    type: string,
    listener: unknown,
    options?: unknown,
  ) {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    const methodMetric = this.#metric.portAel.getOrInsertComputed(
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
          canceledCounter: 0,
          facts: Fact.pure,
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
        WorkerAelFact.DUPLICATE_ADDITION,
      );
      return;
    }

    let selfHandler;

    if (typeof listener === 'function') {
      selfHandler = function (
        this: ApiMonitorSharedWorkerWrapper,
        e: Event,
      ) {
        let eventSelfTime: null | number = null;
        const start = performance.now();

        if (traceUtil.shouldPass(methodMetric.traceId)) {
          if (traceUtil.shouldPause(methodMetric.traceId)) {
            debugger;
          }
          listener.call(this, e);
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
      this.#native.addEventListener(type, selfHandler, options);
    }
  }

  #portRemoveEventListener(
    type: string,
    listener: unknown,
    options?: unknown,
  ) {
    const callstack = traceUtil.getCallstack(new Error(TraceUtil.SIGNATURE));
    const methodMetric = this.#metric.portRel.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
          firstSeen: performance.now(),
          calls: 0,
          facts: Fact.pure,
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
        this.#native.removeEventListener(
          type,
          aelRecord.actualHandler,
          options,
        );
        this.#eventHandlerLink.delete(
          <EventListenerOrEventListenerObject> listener,
        );

        const aelMethodMetric = this.#metric.portAel.get(aelRecord.aelTraceId);
        if (aelMethodMetric) {
          aelMethodMetric.canceledCounter++;
        }
      }
    } else {
      methodMetric.facts = Fact.assign(
        methodMetric.facts,
        WorkerRelFact.NOT_FOUND,
      );
    }
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

    sharedWorkerMetric.portPostMessage.forEach((methodMetric) => {
      const prevCalls = sharedWorkerMetric.callsMap.get(methodMetric.traceId) ||
        0;

      methodMetric.cps = methodMetric.calls - prevCalls;
      sharedWorkerMetric.callsMap.set(methodMetric.traceId, methodMetric.calls);
    });

    sharedWorkerMetric.portAel.forEach((methodMetric) => {
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
        portPostMessage: Array.from(metric.portPostMessage.values()),
        portAel: Array.from(metric.portAel.values()),
        portRel: Array.from(metric.portRel.values()),
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
