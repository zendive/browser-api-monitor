import type { TPanel } from '../api/storage/storage.local.ts';
import { trim2ms } from '../api/time.ts';
import {
  type TCallstack,
  TraceUtil,
  type TTraceable,
} from './shared/TraceUtil.ts';
import { traceUtil, validHandler, validTimerDelay } from './shared/util.ts';
import { Fact, type TFact } from './shared/Fact.ts';
import { TAG_BAD_DELAY, TAG_BAD_HANDLER } from '../api/const.ts';

export type TRequestIdleCallbackHistory = TTraceable & {
  facts: TFact;
  calls: number;
  handler: number | undefined | string;
  delay: number | undefined | string;
  didTimeout: undefined | boolean;
  online: number;
  canceledCounter: number;
  canceledByTraceIds: string[] | null;
  selfTime: number | null;
};
export type TCancelIdleCallbackHistory = TTraceable & {
  facts: TFact;
  calls: number;
  handler: number | undefined | string;
};

const requestIdleCallback = /*@__PURE__*/ globalThis.requestIdleCallback.bind(
  globalThis,
);
const cancelIdleCallback = /*@__PURE__*/ globalThis.cancelIdleCallback.bind(
  globalThis,
);
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
  ricHistory: Map</*traceId*/ string, TRequestIdleCallbackHistory> = new Map();
  cicHistory: Map</*traceId*/ string, TCancelIdleCallbackHistory> = new Map();
  callCounter = {
    requestIdleCallback: 0,
    cancelIdleCallback: 0,
  };
  native = {
    requestIdleCallback: requestIdleCallback,
    cancelIdleCallback: cancelIdleCallback,
  };

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
    callstack: TCallstack,
  ) {
    const existing = this.ricHistory.get(callstack.traceId);
    let facts = <TFact> 0;

    if (validTimerDelay(delay)) {
      delay = trim2ms(delay);
    } else {
      delay = TAG_BAD_DELAY(delay);
      facts = Fact.assign(facts, RicFact.BAD_DELAY);
    }

    if (existing) {
      existing.calls++;
      existing.handler = handler;
      existing.didTimeout = undefined;
      existing.delay = delay;
      existing.online++;

      if (facts) {
        existing.facts = Fact.assign(existing.facts, facts);
      }
    } else {
      this.ricHistory.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
        facts,
        calls: 1,
        handler,
        didTimeout: undefined,
        delay,
        online: 1,
        canceledCounter: 0,
        canceledByTraceIds: null,
        selfTime: null,
      });
    }

    this.onlineIdleCallbackLookup.set(handler, callstack.traceId);
  }

  #updateCicHistory(handler: number | string, callstack: TCallstack) {
    const existing = this.cicHistory.get(callstack.traceId);
    let facts = <TFact> 0;
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

    if (existing) {
      existing.calls++;
      existing.handler = handler;

      if (facts) {
        existing.facts = Fact.assign(existing.facts, facts);
      }
    } else {
      this.cicHistory.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
        facts,
        calls: 1,
        handler,
      });
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

  collectHistory(ricPanel: TPanel, cicPanel: TPanel) {
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
