import type { TSettingsPanel } from '../api/settings.ts';
import { requestAnimationFrame, cancelAnimationFrame } from '../api/const.ts';
import {
  ETraceDomain,
  TraceUtil,
  type TCallstack,
  type TTrace,
} from './TraceUtil.ts';
import { trim2microsecond } from '../api/time.ts';
import { validHandler } from './util.ts';
import { TAG_EXCEPTION } from '../api/clone.ts';

export type TRequestAnimationFrameHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  handler: number | undefined | string;
  selfTime: number | null;
  online: number;
  canceledCounter: number;
  canceledByTraceIds: string[] | null;
  cps: number;
};
export type TCancelAnimationFrameHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  handler: number | undefined | string;
};

export class AnimationWrapper {
  traceUtil: TraceUtil;
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

  constructor(traceUtil: TraceUtil) {
    this.traceUtil = traceUtil;
  }

  updateAnimationsFramerate() {
    for (let [, rafRecord] of this.rafHistory) {
      const prevCalls = this.animationCallsMap.get(rafRecord.traceId) || 0;
      rafRecord.cps = rafRecord.calls - prevCalls;

      this.animationCallsMap.set(rafRecord.traceId, rafRecord.calls);
    }
  }

  updateRafHistory(handler: number, callstack: TCallstack) {
    const existing = this.rafHistory.get(callstack.traceId);

    if (existing) {
      existing.calls++;
      existing.handler = handler;
      existing.online++;
    } else {
      this.rafHistory.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.traceUtil.getTraceDomain(callstack.trace[0]),
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

  rafFired(handler: number, traceId: string, selfTime: number | null) {
    const rafRecord = this.rafHistory.get(traceId);
    if (!rafRecord) {
      return;
    }

    rafRecord.selfTime = trim2microsecond(selfTime);

    if (this.onlineAnimationFrameLookup.has(handler)) {
      this.onlineAnimationFrameLookup.delete(handler);
      rafRecord.online--;
    }
  }

  updateCafHistory(handler: number | string, callstack: TCallstack) {
    const existing = this.cafHistory.get(callstack.traceId);
    const hasError = !validHandler(handler);

    if (hasError) {
      handler = TAG_EXCEPTION(handler);
    }

    if (existing) {
      existing.calls++;
      existing.handler = handler;
    } else {
      this.cafHistory.set(callstack.traceId, {
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.traceUtil.getTraceDomain(callstack.trace[0]),
        calls: 1,
        handler,
      });
    }

    const rafTraceId = this.onlineAnimationFrameLookup.get(Number(handler));
    const rafRecord = rafTraceId && this.rafHistory.get(rafTraceId);
    if (rafRecord) {
      this.onlineAnimationFrameLookup.delete(Number(handler));

      rafRecord.online--;

      if (rafRecord.canceledByTraceIds === null) {
        rafRecord.canceledByTraceIds = [callstack.traceId];
      } else if (!rafRecord.canceledByTraceIds.includes(callstack.traceId)) {
        rafRecord.canceledByTraceIds.push(callstack.traceId);
      }
      rafRecord.canceledCounter++;
    }
  }

  wrapRequestAnimationFrame() {
    window.requestAnimationFrame = function requestAnimationFrame(
      this: AnimationWrapper,
      fn: FrameRequestCallback
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = this.traceUtil.createCallstack(err, fn);

      this.callCounter.requestAnimationFrame++;
      const handler = this.native.requestAnimationFrame((...args) => {
        const start = performance.now();
        let selfTime = null;

        if (this.traceUtil.shouldPass(callstack.traceId)) {
          if (this.traceUtil.shouldPause(callstack.traceId)) {
            debugger;
          }
          fn(...args);
          selfTime = performance.now() - start;
        }

        this.rafFired(handler, callstack.traceId, selfTime);
      });
      this.updateRafHistory(handler, callstack);

      return handler;
    }.bind(this);
  }

  wrapCancelAnimationFrame() {
    window.cancelAnimationFrame = function cancelAnimationFrame(
      this: AnimationWrapper,
      handler: number
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = this.traceUtil.createCallstack(err);

      this.updateCafHistory(handler, callstack);
      this.callCounter.cancelAnimationFrame++;

      if (this.traceUtil.shouldPass(callstack.traceId)) {
        if (this.traceUtil.shouldPause(callstack.traceId)) {
          debugger;
        }
        this.native.cancelAnimationFrame(handler);
      }
    }.bind(this);
  }

  unwrapRequestAnimationFrame() {
    window.requestAnimationFrame = this.native.requestAnimationFrame;
  }

  unwrapCancelAnimationFrame() {
    window.cancelAnimationFrame = this.native.cancelAnimationFrame;
  }

  collectHistory(rafPanel: TSettingsPanel, cafPanel: TSettingsPanel) {
    return {
      rafHistory:
        rafPanel.wrap && rafPanel.visible
          ? Array.from(this.rafHistory.values())
          : null,
      cafHistory:
        cafPanel.wrap && cafPanel.visible
          ? Array.from(this.cafHistory.values())
          : null,
    };
  }

  cleanHistory() {
    this.rafHistory.clear();
    this.cafHistory.clear();
    this.onlineAnimationFrameLookup.clear();
    this.animationCallsMap.clear();

    this.callCounter.requestAnimationFrame = 0;
    this.callCounter.cancelAnimationFrame = 0;
  }
}
