import type { IPanel } from '../api/storage/storage.local.ts';
import { trim2ms } from '../api/time.ts';
import {
  type ICallstack,
  type ITraceable,
  TraceUtil,
} from './shared/TraceUtil.ts';
import { traceUtil, validHandler, validTimerDelay } from './shared/util.ts';
import { Fact, type TFact } from './shared/Fact.ts';
import {
  cancelIdleCallback,
  requestIdleCallback,
  TAG_BAD_DELAY,
  TAG_BAD_HANDLER,
} from '../api/const.ts';

export interface IRequestIdleCallbackHistory extends ITraceable {
  facts: TFact;
  calls: number;
  cps: number;
  handler: number | undefined | string;
  delay: number | undefined | string;
  didTimeout: undefined | boolean;
  online: number;
  canceledCounter: number;
  canceledByTraceIds: string[] | null;
  selfTime: number | null;
}
export interface ICancelIdleCallbackHistory extends ITraceable {
  facts: TFact;
  calls: number;
  handler: number | undefined | string;
}

export const RicFact = /*@__PURE__*/ (() => ({
  BAD_DELAY: Fact.define(1 << 0),
} as const))();
export const RicFacts = /*@__PURE__*/ (() =>
  Fact.map([
    [RicFact.BAD_DELAY, {
      tag: 'D',
      details: 'Delay is not a positive number or undefined',
    }],
  ]))();
export const CicFact = /*@__PURE__*/ (() => ({
  NOT_FOUND: Fact.define(1 << 0),
  BAD_HANDLER: Fact.define(1 << 1),
} as const))();
export const CicFacts = /*@__PURE__*/ (() =>
  Fact.map([
    [CicFact.NOT_FOUND, { tag: 'I', details: 'Idle Callback not found' }],
    [CicFact.BAD_HANDLER, {
      tag: 'H',
      details: 'Handler is not a positive number',
    }],
  ]))();

export class IdleWrapper {
  onlineIdleCallbackLookup: Map</*handler*/ number, /*traceId*/ string> =
    new Map();
  ricHistory: Map</*traceId*/ string, IRequestIdleCallbackHistory> = new Map();
  cicHistory: Map</*traceId*/ string, ICancelIdleCallbackHistory> = new Map();
  callCounter = {
    requestIdleCallback: 0,
    cancelIdleCallback: 0,
  };
  native = {
    requestIdleCallback: requestIdleCallback,
    cancelIdleCallback: cancelIdleCallback,
  };
  #callsMap = new Map</*traceId*/ string, /*calls*/ number>();

  constructor() {
  }

  #ricFired(
    handler: number,
    traceId: string,
    deadline: IdleDeadline,
    selfTime: number | null,
  ) {
    const ricRecord = this.ricHistory.get(traceId);
    if (!ricRecord) {
      return;
    }

    ricRecord.didTimeout = deadline.didTimeout;
    ricRecord.selfTime = trim2ms(selfTime);

    if (this.onlineIdleCallbackLookup.get(handler)) {
      this.onlineIdleCallbackLookup.delete(handler);
      ricRecord.online--;
    }
  }

  #updateRicHistory(
    handler: number,
    delay: number | undefined | string,
    callstack: ICallstack,
  ) {
    let facts = Fact.pure;

    if (validTimerDelay(delay)) {
      delay = trim2ms(delay);
    } else {
      delay = TAG_BAD_DELAY(delay);
      facts = Fact.assign(facts, RicFact.BAD_DELAY);
    }

    const ricRecord = this.ricHistory.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
          traceDomain: traceUtil.getDomain(callstack),
          firstSeen: performance.now(),
          facts,
          calls: 0,
          cps: 1,
          handler,
          didTimeout: undefined,
          delay,
          online: 0,
          canceledCounter: 0,
          canceledByTraceIds: null,
          selfTime: null,
        };
      },
    );

    ricRecord.calls++;
    ricRecord.handler = handler;
    ricRecord.didTimeout = undefined;
    ricRecord.delay = delay;
    ricRecord.online++;

    if (facts) {
      ricRecord.facts = Fact.assign(ricRecord.facts, facts);
    }

    this.onlineIdleCallbackLookup.set(handler, callstack.traceId);
  }

  #updateCicHistory(handler: number | string, callstack: ICallstack) {
    let facts = Fact.pure;
    let ricTraceId;

    if (validHandler(handler)) {
      ricTraceId = this.onlineIdleCallbackLookup.get(handler);

      if (ricTraceId) {
        this.onlineIdleCallbackLookup.delete(handler);
      } else {
        facts = Fact.assign(facts, CicFact.NOT_FOUND);
      }
    } else {
      handler = TAG_BAD_HANDLER(handler);
      facts = Fact.assign(facts, CicFact.BAD_HANDLER);
    }

    const cicRecord = this.cicHistory.getOrInsertComputed(
      callstack.traceId,
      () => {
        return {
          traceId: callstack.traceId,
          trace: callstack.trace,
          traceDomain: traceUtil.getDomain(callstack),
          firstSeen: performance.now(),
          calls: 0,
          handler,
          facts,
        };
      },
    );

    cicRecord.calls++;
    cicRecord.handler = handler;
    if (facts) {
      cicRecord.facts = Fact.assign(cicRecord.facts, facts);
    }

    const ricRecord = ricTraceId && this.ricHistory.get(ricTraceId);
    if (ricRecord) {
      ricRecord.online--;
      ricRecord.didTimeout = undefined;
      ricRecord.canceledCounter++;

      if (ricRecord.canceledByTraceIds === null) {
        ricRecord.canceledByTraceIds = [callstack.traceId];
      } else if (!ricRecord.canceledByTraceIds.includes(callstack.traceId)) {
        ricRecord.canceledByTraceIds.push(callstack.traceId);
      }
    }
  }

  updateCallsPerSecond(panel: IPanel) {
    if (!panel.wrap || !panel.visible) return;

    this.ricHistory.forEach((ricRecord) => {
      const prevCalls = this.#callsMap.get(ricRecord.traceId) || 0;
      ricRecord.cps = ricRecord.calls - prevCalls;

      this.#callsMap.set(ricRecord.traceId, ricRecord.calls);
    });
  }

  wrapRequestIdleCallback() {
    globalThis.requestIdleCallback = function requestIdleCallback(
      this: IdleWrapper,
      fn: IdleRequestCallback,
      options?: IdleRequestOptions | undefined,
    ) {
      const delay = options?.timeout;
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = traceUtil.getCallstack(err, fn);

      this.callCounter.requestIdleCallback++;
      const handler = this.native.requestIdleCallback((deadline) => {
        const start = performance.now();
        let selfTime = null;

        if (traceUtil.shouldPass(callstack.traceId)) {
          if (traceUtil.shouldPause(callstack.traceId)) {
            debugger;
          }
          fn(deadline);
          selfTime = performance.now() - start;
        }

        this.#ricFired(handler, callstack.traceId, deadline, selfTime);
      }, options);
      this.#updateRicHistory(handler, delay, callstack);

      return handler;
    }.bind(this);
  }

  wrapCancelIdleCallback() {
    globalThis.cancelIdleCallback = function cancelIdleCallback(
      this: IdleWrapper,
      handler: number,
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = traceUtil.getCallstack(err);

      this.#updateCicHistory(handler, callstack);
      this.callCounter.cancelIdleCallback++;

      if (traceUtil.shouldPass(callstack.traceId)) {
        if (traceUtil.shouldPause(callstack.traceId)) {
          debugger;
        }
        this.native.cancelIdleCallback(handler);
      }
    }.bind(this);
  }

  unwrapRequestIdleCallback() {
    globalThis.requestIdleCallback = this.native.requestIdleCallback;
  }

  unwrapCancelIdleCallback() {
    globalThis.cancelIdleCallback = this.native.cancelIdleCallback;
  }

  collectHistory(ricPanel: IPanel, cicPanel: IPanel) {
    return {
      ricHistory: ricPanel.wrap && ricPanel.visible
        ? Array.from(this.ricHistory.values())
        : null,
      cicHistory: cicPanel.wrap && cicPanel.visible
        ? Array.from(this.cicHistory.values())
        : null,
    };
  }
}
