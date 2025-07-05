import { cloneObjectSafely } from '../api/clone.ts';
import {
  type ETraceDomain,
  type TCallstack,
  TraceUtil,
  type TTrace,
} from './shared/TraceUtil.ts';
import { trim2ms } from '../api/time.ts';
import type { TPanel } from '../api/storage/storage.local.ts';
import { Fact, type TFact } from './shared/Fact.ts';
import { traceUtil } from './shared/util.ts';

export type TEvalHistory = {
  traceId: string;
  trace: TTrace[];
  traceDomain: ETraceDomain;
  facts: TFact;
  calls: number;
  returnedValue: unknown;
  code: unknown;
  selfTime: number | null;
};

/**
 * @NOTE: a copy of `eval` here, - making it "indirect eval"
 *  - making it able to detect local scope variables usage
 *    on one side, and potentially breaking site functionality.
 *  - any code that is based on access to a local scope will fail to acquire it.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#direct_and_indirect_eval
 */
const lesserEval = /*@__PURE__*/ globalThis.eval.bind(globalThis);
export const EvalFact = /*@__PURE__*/ (() => ({
  USES_GLOBAL_SCOPE: Fact.define(1 << 0),
  USES_LOCAL_SCOPE: Fact.define(1 << 1),
} as const))();
export const EvalFacts = /*@__PURE__*/ (() =>
  Fact.map([
    [EvalFact.USES_GLOBAL_SCOPE, {
      tag: 'G',
      details:
        'Had access to global scope (local scope usage has not been detected)',
    }],
    [EvalFact.USES_LOCAL_SCOPE, {
      tag: 'L',
      details:
        'Threw an error while trying to get value of local scope variable (return value is not available)',
    }],
  ]))();

export class EvalWrapper {
  evalHistory: Map</*traceId*/ string, TEvalHistory> = new Map();
  callCounter = 0;
  nativeEval = lesserEval;

  constructor() {
  }

  updateHistory(
    code: string,
    returnedValue: unknown,
    callstack: TCallstack,
    usesLocalScope: boolean,
    selfTime: number | null,
  ) {
    const existing = this.evalHistory.get(callstack.traceId);
    let facts = EvalFact.USES_GLOBAL_SCOPE;

    if (usesLocalScope) {
      facts = Fact.assign(facts, EvalFact.USES_LOCAL_SCOPE);
    }

    if (existing) {
      existing.code = cloneObjectSafely(code);
      existing.returnedValue = cloneObjectSafely(returnedValue);
      existing.calls++;
      existing.selfTime = trim2ms(selfTime);

      if (facts) {
        existing.facts = Fact.assign(existing.facts, facts);
      }
    } else {
      this.evalHistory.set(callstack.traceId, {
        calls: 1,
        code: cloneObjectSafely(code),
        returnedValue: cloneObjectSafely(returnedValue),
        facts,
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
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
      const callstack = traceUtil.getCallstack(err, code);
      let rv: unknown;
      let throwError = null;
      let usesLocalScope = false;
      let selfTime = null;

      try {
        this.callCounter++;
        const start = performance.now();

        if (traceUtil.shouldPass(callstack.traceId)) {
          if (traceUtil.shouldPause(callstack.traceId)) {
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

  collectHistory(evalPanel: TPanel) {
    return evalPanel.wrap && evalPanel.visible
      ? Array.from(this.evalHistory.values())
      : null;
  }

  cleanHistory() {
    this.evalHistory.clear();
    this.callCounter = 0;
  }
}
