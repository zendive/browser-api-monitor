import type { TPanel } from '../api/storage/storage.local.ts';
import {
  cancelAnimationFrame,
  requestAnimationFrame,
  TAG_BAD_HANDLER,
} from '../api/const.ts';
import {
  type TCallstack,
  TraceUtil,
  type TTraceable,
} from './shared/TraceUtil.ts';
import { trim2ms } from '../api/time.ts';
import { traceUtil, validHandler } from './shared/util.ts';
import { Fact, type TFact } from './shared/Fact.ts';

export type TRequestAnimationFrameHistory = TTraceable & {
  calls: number;
  handler: number | undefined | string;
  selfTime: number | null;
  online: number;
  canceledCounter: number;
  canceledByTraceIds: string[] | null;
  cps: number;
};
export type TCancelAnimationFrameHistory = TTraceable & {
  facts: TFact;
  calls: number;
  handler: number | undefined | string;
};

export const CafFact = /*@__PURE__*/ (() => ({
  NOT_FOUND: Fact.define(1 << 0),
  BAD_HANDLER: Fact.define(1 << 1),
} as const))();
export const CafFacts = /*@__PURE__*/ (() =>
  Fact.map([
    [CafFact.NOT_FOUND, { tag: 'A', details: 'Animation not found' }],
    [CafFact.BAD_HANDLER, {
      tag: 'H',
      details: 'Handler is not a positive number',
    }],
  ]))();

export class AnimationWrapper {
  native = {
    requestAnimationFrame: requestAnimationFrame,
    cancelAnimationFrame: cancelAnimationFrame,
  };
  animationCallsMap = new Map</*traceId*/ string, /*calls*/ number>();
  onlineAnimationFrameLookup: Map</*handler*/ number, /*traceId*/ string> =
    new Map();
  rafHistory: Map</*traceId*/ string, TRequestAnimationFrameHistory> =
    new Map();
  cafHistory: Map</*traceId*/ string, TCancelAnimationFrameHistory> = new Map();
  callCounter = {
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
  };

  constructor() {
  }

  #updateRafHistory(handler: number, callstack: TCallstack) {
    const existing = this.rafHistory.get(callstack.traceId);

    if (existing) {
      existing.calls++;
      existing.handler = handler;
      existing.online++;
    } else {
      this.rafHistory.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
        calls: 1,
        handler,
        online: 1,
        canceledCounter: 0,
        canceledByTraceIds: null,
        selfTime: null,
        cps: 1,
      });
    }

    this.onlineAnimationFrameLookup.set(handler, callstack.traceId);
  }

  #rafFired(handler: number, traceId: string, selfTime: number | null) {
    const rafRecord = this.rafHistory.get(traceId);
    if (!rafRecord) {
      return;
    }

    rafRecord.selfTime = trim2ms(selfTime);

    if (this.onlineAnimationFrameLookup.has(handler)) {
      this.onlineAnimationFrameLookup.delete(handler);
      rafRecord.online--;
    }
  }

  #updateCafHistory(handler: number | string, callstack: TCallstack) {
    const existing = this.cafHistory.get(callstack.traceId);
    let facts = <TFact> 0;
    let rafTraceId;

    if (validHandler(handler)) {
      rafTraceId = this.onlineAnimationFrameLookup.get(handler);

      if (rafTraceId) {
        this.onlineAnimationFrameLookup.delete(handler);
      } else {
        facts = Fact.assign(facts, CafFact.NOT_FOUND);
      }
    } else {
      handler = TAG_BAD_HANDLER(handler);
      facts = Fact.assign(facts, CafFact.BAD_HANDLER);
    }

    if (existing) {
      existing.calls++;
      existing.handler = handler;

      if (facts) {
        existing.facts = Fact.assign(existing.facts, facts);
      }
    } else {
      this.cafHistory.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
        facts,
        calls: 1,
        handler,
      });
    }

    const rafRecord = rafTraceId && this.rafHistory.get(rafTraceId);
    if (rafRecord) {
      rafRecord.online--;
      rafRecord.canceledCounter++;

      if (rafRecord.canceledByTraceIds === null) {
        rafRecord.canceledByTraceIds = [callstack.traceId];
      } else if (!rafRecord.canceledByTraceIds.includes(callstack.traceId)) {
        rafRecord.canceledByTraceIds.push(callstack.traceId);
      }
    }
  }

  updateAnimationsFramerate(panel: TPanel) {
    if (!panel.wrap || !panel.visible) return;

    for (const [, rafRecord] of this.rafHistory) {
      const prevCalls = this.animationCallsMap.get(rafRecord.traceId) || 0;
      rafRecord.cps = rafRecord.calls - prevCalls;

      this.animationCallsMap.set(rafRecord.traceId, rafRecord.calls);
    }
  }

  wrapRequestAnimationFrame() {
    globalThis.requestAnimationFrame = function requestAnimationFrame(
      this: AnimationWrapper,
      fn: FrameRequestCallback,
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = traceUtil.getCallstack(err, fn);

      this.callCounter.requestAnimationFrame++;
      const handler = this.native.requestAnimationFrame((...args) => {
        const start = performance.now();
        let selfTime = null;

        if (traceUtil.shouldPass(callstack.traceId)) {
          if (traceUtil.shouldPause(callstack.traceId)) {
            debugger;
          }
          fn(...args);
          selfTime = performance.now() - start;
        }

        this.#rafFired(handler, callstack.traceId, selfTime);
      });
      this.#updateRafHistory(handler, callstack);

      return handler;
    }.bind(this);
  }

  wrapCancelAnimationFrame() {
    globalThis.cancelAnimationFrame = function cancelAnimationFrame(
      this: AnimationWrapper,
      handler: number,
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = traceUtil.getCallstack(err);

      this.#updateCafHistory(handler, callstack);
      this.callCounter.cancelAnimationFrame++;

      if (traceUtil.shouldPass(callstack.traceId)) {
        if (traceUtil.shouldPause(callstack.traceId)) {
          debugger;
        }
        this.native.cancelAnimationFrame(handler);
      }
    }.bind(this);
  }

  unwrapRequestAnimationFrame() {
    globalThis.requestAnimationFrame = this.native.requestAnimationFrame;
  }

  unwrapCancelAnimationFrame() {
    globalThis.cancelAnimationFrame = this.native.cancelAnimationFrame;
  }

  collectHistory(rafPanel: TPanel, cafPanel: TPanel) {
    return {
      rafHistory: rafPanel.wrap && rafPanel.visible
        ? Array.from(this.rafHistory.values())
        : null,
      cafHistory: cafPanel.wrap && cafPanel.visible
        ? Array.from(this.cafHistory.values())
        : null,
    };
  }
}
