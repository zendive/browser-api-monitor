import { cloneObjectSafely } from '../api/clone.ts';
import {
  type ETraceDomain,
  type TCallstack,
  TraceUtil,
  type TTrace,
} from './TraceUtil.ts';
import { trim2microsecond } from '../api/time.ts';
import type { TSettingsPanel } from '../api/settings.ts';

export type TEvalHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  calls: number;
  returnedValue: unknown;
  code: unknown;
  usesLocalScope: boolean;
  selfTime: number | null;
};

// https://rollupjs.org/troubleshooting/#avoiding-eval
const lesserEval = /*@__PURE__*/ globalThis.eval.bind(globalThis);

export class EvalWrapper {
  traceUtil: TraceUtil;
  evalHistory: Map</*traceId*/ string, TEvalHistory> = new Map();
  callCounter = 0;
  nativeEval = lesserEval;

  constructor(traceUtil: TraceUtil) {
    this.traceUtil = traceUtil;
  }

  updateHistory(
    code: string,
    returnedValue: unknown,
    callstack: TCallstack,
    usesLocalScope: boolean,
    selfTime: number | null,
  ) {
    const existing = this.evalHistory.get(callstack.traceId);

    if (existing) {
      existing.code = cloneObjectSafely(code);
      existing.returnedValue = cloneObjectSafely(returnedValue);
      existing.calls++;
      existing.usesLocalScope = usesLocalScope;
      existing.selfTime = trim2microsecond(selfTime);
    } else {
      this.evalHistory.set(callstack.traceId, {
        calls: 1,
        code: cloneObjectSafely(code),
        returnedValue: cloneObjectSafely(returnedValue),
        usesLocalScope,
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: this.traceUtil.getTraceDomain(callstack.trace[0]),
        selfTime,
      });
    }
  }

  wrap() {
    globalThis.eval = function WrappedLessEval(
      this: EvalWrapper,
      code: string,
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = this.traceUtil.getCallstack(err, code);
      let rv: unknown;
      let throwError = null;
      let usesLocalScope = false;
      let selfTime = null;

      try {
        this.callCounter++;
        const start = performance.now();

        if (this.traceUtil.shouldPass(callstack.traceId)) {
          if (this.traceUtil.shouldPause(callstack.traceId)) {
            debugger;
          }
          rv = this.nativeEval(code);
          selfTime = performance.now() - start;
        }
      } catch (error: unknown) {
        if (error instanceof Error && 'ReferenceError' === error.name) {
          // most likely a side effect of `eval` reassigning
          // when reference to local scope variable resulting
          // in "ReferenceError: {something} is not defined"
          usesLocalScope = true;
        } else {
          throwError = error;
        }
      }

      this.updateHistory(code, rv, callstack, usesLocalScope, selfTime);

      if (throwError) {
        throw throwError;
      }

      return rv;
    }.bind(this);
  }

  unwrap() {
    // noop - it's impossible to restore native eval afterwards
  }

  collectHistory(evalPanel: TSettingsPanel) {
    return evalPanel.wrap && evalPanel.visible
      ? Array.from(this.evalHistory.values())
      : null;
  }

  cleanHistory() {
    this.evalHistory.clear();
    this.callCounter = 0;
  }
}
