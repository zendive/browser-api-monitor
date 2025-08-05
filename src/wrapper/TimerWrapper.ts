import {
  type TCallstack,
  TraceUtil,
  type TTraceable,
} from './shared/TraceUtil.ts';
import {
  clearInterval,
  clearTimeout,
  setInterval,
  setTimeout,
  TAG_BAD_DELAY,
  TAG_BAD_HANDLER,
  TAG_DELAY_NOT_FOUND,
  TAG_EVAL_RETURN_SET_INTERVAL,
  TAG_EVAL_RETURN_SET_TIMEOUT,
} from '../api/const.ts';
import type { TPanel } from '../api/storage/storage.local.ts';
import type { EvalWrapper } from './EvalWrapper.ts';
import { traceUtil, validHandler, validTimerDelay } from './shared/util.ts';
import { trim2ms } from '../api/time.ts';
import { Fact, type TFact } from './shared/Fact.ts';

export enum ETimerType {
  TIMEOUT,
  INTERVAL,
}
export type TOnlineTimerMetrics = TTraceable & {
  type: ETimerType;
  delay: number | undefined | string;
  handler: number;
};
export type TSetTimerHistory = TTraceable & {
  facts: TFact;
  calls: number;
  handler: number | string;
  delay: number | undefined | string;
  online: number;
  canceledCounter: number;
  canceledByTraceIds: string[] | null;
  selfTime: number | null;
};
export type TClearTimerHistory = TTraceable & {
  facts: TFact;
  calls: number;
  handler: number | string;
  delay: number | undefined | string;
};

export const SetTimerFact = /*@__PURE__*/ (() => ({
  NOT_A_FUNCTION: Fact.define(1 << 0),
  BAD_DELAY: Fact.define(1 << 1),
} as const))();
export const SetTimerFacts = /*@__PURE__*/ (() =>
  Fact.map([
    [SetTimerFact.NOT_A_FUNCTION, {
      tag: 'C',
      details: 'Callback is not a function',
    }],
    [SetTimerFact.BAD_DELAY, {
      tag: 'D',
      details: 'Delay is not a positive number or undefined',
    }],
  ]))();
export const ClearTimerFact = /*@__PURE__*/ (() => ({
  NOT_FOUND: Fact.define(1 << 0),
  BAD_HANDLER: Fact.define(1 << 1),
} as const))();
export const ClearTimerFacts = /*@__PURE__*/ (() =>
  Fact.map([
    [ClearTimerFact.NOT_FOUND, { tag: 'T', details: 'Timer not found' }],
    [ClearTimerFact.BAD_HANDLER, {
      tag: 'H',
      details: 'Handler is not a positive number',
    }],
  ]))();

export class TimerWrapper {
  apiEval: EvalWrapper;
  onlineTimers: Map</*handler*/ number, TOnlineTimerMetrics> = new Map();
  setTimeoutHistory: Map</*traceId*/ string, TSetTimerHistory> = new Map();
  clearTimeoutHistory: Map</*traceId*/ string, TClearTimerHistory> = new Map();
  setIntervalHistory: Map</*traceId*/ string, TSetTimerHistory> = new Map();
  clearIntervalHistory: Map</*traceId*/ string, TClearTimerHistory> = new Map();
  native = {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
  };
  callCounter = {
    setTimeout: 0,
    clearTimeout: 0,
    setInterval: 0,
    clearInterval: 0,
  };

  constructor(apiEval: EvalWrapper) {
    this.apiEval = apiEval;
  }

  #timerOnline(
    type: ETimerType,
    handler: number,
    delay: number | undefined | string,
    callstack: TCallstack,
  ) {
    delay = validTimerDelay(delay) ? trim2ms(delay) : TAG_BAD_DELAY(delay);

    this.onlineTimers.set(handler, {
      type,
      handler,
      delay,
      traceId: callstack.traceId,
      trace: callstack.trace,
      traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
    });
  }

  #timerOffline(
    handler: number,
    canceledByTraceId: string | null,
    selfTime: number | null,
  ) {
    const timer = this.onlineTimers.get(handler);
    if (!timer) {
      // already offline
      return;
    }

    this.onlineTimers.delete(handler);

    const setTimerRecord = timer.type === ETimerType.TIMEOUT
      ? this.setTimeoutHistory.get(timer.traceId)
      : this.setIntervalHistory.get(timer.traceId);

    if (!setTimerRecord) {
      return;
    }

    setTimerRecord.online--;
    setTimerRecord.selfTime = trim2ms(selfTime);

    if (canceledByTraceId === null) {
      return;
    }

    if (setTimerRecord.canceledByTraceIds === null) {
      setTimerRecord.canceledByTraceIds = [canceledByTraceId];
    } else if (!setTimerRecord.canceledByTraceIds.includes(canceledByTraceId)) {
      setTimerRecord.canceledByTraceIds.push(canceledByTraceId);
    }
    setTimerRecord.canceledCounter++;
  }

  #updateSetTimersHistory(
    history: Map<string, TSetTimerHistory>,
    handler: number,
    delay: number | string | undefined,
    callstack: TCallstack,
    isEval: boolean,
  ) {
    let facts = <TFact> 0;
    const existing = history.get(callstack.traceId);

    if (validTimerDelay(delay)) {
      delay = trim2ms(delay);
    } else {
      delay = TAG_BAD_DELAY(delay);
      facts = Fact.assign(facts, SetTimerFact.BAD_DELAY);
    }

    if (isEval) {
      facts = Fact.assign(facts, SetTimerFact.NOT_A_FUNCTION);
    }

    if (existing) {
      existing.handler = handler;
      existing.delay = delay;
      existing.calls++;
      existing.online++;

      if (facts) {
        existing.facts = Fact.assign(existing.facts, facts);
      }
    } else {
      history.set(callstack.traceId, {
        handler,
        calls: 1,
        delay,
        online: 1,
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
        facts,
        canceledCounter: 0,
        canceledByTraceIds: null,
        selfTime: null,
      });
    }
  }

  #updateClearTimersHistory(
    history: Map<string, TClearTimerHistory>,
    handler: unknown,
    callstack: TCallstack,
  ) {
    const existing = history.get(callstack.traceId);
    let handlerDelay: string | number | undefined = TAG_DELAY_NOT_FOUND;
    let facts = <TFact> 0;

    if (validHandler(handler)) {
      const onlineTimer = this.onlineTimers.get(handler);

      if (onlineTimer) {
        handlerDelay = onlineTimer.delay;
      } else {
        facts = Fact.assign(facts, ClearTimerFact.NOT_FOUND);
      }
    } else {
      handler = TAG_BAD_HANDLER(handler);
      facts = Fact.assign(facts, ClearTimerFact.BAD_HANDLER);
    }

    if (existing) {
      existing.handler = <number | string> handler;
      existing.delay = handlerDelay;
      existing.calls++;

      if (facts) {
        existing.facts = Fact.assign(existing.facts, facts);
      }
    } else {
      history.set(callstack.traceId, {
        handler: <number | string> handler,
        calls: 1,
        delay: handlerDelay,
        traceId: callstack.traceId,
        trace: callstack.trace,
        traceDomain: traceUtil.getTraceDomain(callstack.trace[0]),
        facts,
      });
    }
  }

  #updateTimersSelfTime(
    map: Map<string, TSetTimerHistory>,
    traceId: string,
    selfTime: number | null,
  ) {
    const record = map.get(traceId);

    if (record) {
      record.selfTime = trim2ms(selfTime);
    }
  }

  wrapSetTimeout() {
    globalThis.setTimeout = function setTimeout(
      this: TimerWrapper,
      code: TimerHandler,
      delay: number | undefined,
      ...args: unknown[]
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = traceUtil.getCallstack(err, code);
      const isEval = typeof code !== 'function';

      this.callCounter.setTimeout++;
      const handler = this.native.setTimeout(
        (...params: unknown[]) => {
          const start = performance.now();
          let selfTime = null;

          if (isEval) {
            this.apiEval.callCounter++;
            if (traceUtil.shouldPass(callstack.traceId)) {
              if (traceUtil.shouldPause(callstack.traceId)) {
                debugger;
              }
              // see https://developer.mozilla.org/docs/Web/API/setTimeout#code
              this.apiEval.nativeEval(code);
              selfTime = performance.now() - start;
            }
          } else {
            if (traceUtil.shouldPass(callstack.traceId)) {
              if (traceUtil.shouldPause(callstack.traceId)) {
                debugger;
              }
              code(...params);
              selfTime = performance.now() - start;
            }
          }

          this.#timerOffline(handler, null, selfTime);
          this.#updateTimersSelfTime(
            this.setTimeoutHistory,
            callstack.traceId,
            selfTime,
          );
        },
        delay,
        ...args,
      );

      this.#timerOnline(ETimerType.TIMEOUT, handler, delay, callstack);
      this.#updateSetTimersHistory(
        this.setTimeoutHistory,
        handler,
        delay,
        callstack,
        isEval,
      );
      if (isEval) {
        this.apiEval.updateHistory(
          code,
          TAG_EVAL_RETURN_SET_TIMEOUT,
          callstack,
          false,
          null,
        );
      }

      return handler;
    }.bind(this);
  }

  wrapClearTimeout() {
    globalThis.clearTimeout = function clearTimeout(
      this: TimerWrapper,
      handler: number | undefined,
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = traceUtil.getCallstack(err);

      this.#updateClearTimersHistory(
        this.clearTimeoutHistory,
        handler,
        callstack,
      );

      if (handler !== undefined) {
        this.#timerOffline(handler, callstack.traceId, null);
      }

      this.callCounter.clearTimeout++;

      if (traceUtil.shouldPass(callstack.traceId)) {
        if (traceUtil.shouldPause(callstack.traceId)) {
          debugger;
        }
        this.native.clearTimeout(handler);
      }
    }.bind(this);
  }

  wrapSetInterval() {
    globalThis.setInterval = function setInterval(
      this: TimerWrapper,
      code: TimerHandler,
      delay: number | undefined,
      ...args: unknown[]
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = traceUtil.getCallstack(err, code);
      const isEval = typeof code !== 'function';

      this.callCounter.setInterval++;

      const handler = this.native.setInterval(
        (...params: unknown[]) => {
          const start = performance.now();
          let selfTime = null;

          if (isEval) {
            this.apiEval.callCounter++;
            if (traceUtil.shouldPass(callstack.traceId)) {
              if (traceUtil.shouldPause(callstack.traceId)) {
                debugger;
              }
              // see https://developer.mozilla.org/docs/Web/API/setInterval
              this.apiEval.nativeEval(code);
              selfTime = performance.now() - start;
            }
          } else {
            if (traceUtil.shouldPass(callstack.traceId)) {
              if (traceUtil.shouldPause(callstack.traceId)) {
                debugger;
              }
              code(...params);
              selfTime = performance.now() - start;
            }
          }

          this.#updateTimersSelfTime(
            this.setIntervalHistory,
            callstack.traceId,
            selfTime,
          );
        },
        delay,
        ...args,
      );

      this.#timerOnline(ETimerType.INTERVAL, handler, delay, callstack);
      this.#updateSetTimersHistory(
        this.setIntervalHistory,
        handler,
        delay,
        callstack,
        isEval,
      );
      if (isEval) {
        this.apiEval.updateHistory(
          code,
          TAG_EVAL_RETURN_SET_INTERVAL,
          callstack,
          false,
          null,
        );
      }

      return handler;
    }.bind(this);
  }

  wrapClearInterval() {
    globalThis.clearInterval = function clearInterval(
      this: TimerWrapper,
      handler: number | undefined,
    ) {
      const err = new Error(TraceUtil.SIGNATURE);
      const callstack = traceUtil.getCallstack(err);

      this.#updateClearTimersHistory(
        this.clearIntervalHistory,
        handler,
        callstack,
      );

      if (handler !== undefined) {
        this.#timerOffline(handler, callstack.traceId, null);
      }

      this.callCounter.clearInterval++;

      if (traceUtil.shouldPass(callstack.traceId)) {
        if (traceUtil.shouldPause(callstack.traceId)) {
          debugger;
        }
        this.native.clearInterval(handler);
      }
    }.bind(this);
  }

  unwrapSetTimeout() {
    globalThis.setTimeout = this.native.setTimeout;
  }

  unwrapClearTimeout() {
    globalThis.clearTimeout = this.native.clearTimeout;
  }

  unwrapSetInterval() {
    globalThis.setInterval = this.native.setInterval;
  }
  unwrapClearInterval() {
    globalThis.clearInterval = this.native.clearInterval;
  }

  collectHistory(
    activeTimers: TPanel,
    setTimeout: TPanel,
    clearTimeout: TPanel,
    setInterval: TPanel,
    clearInterval: TPanel,
  ) {
    return {
      onlineTimers: activeTimers.visible
        ? Array.from(this.onlineTimers.values())
        : null,
      setTimeoutHistory: setTimeout.wrap && setTimeout.visible
        ? Array.from(this.setTimeoutHistory.values())
        : null,
      clearTimeoutHistory: clearTimeout.wrap && clearTimeout.visible
        ? Array.from(this.clearTimeoutHistory.values())
        : null,
      setIntervalHistory: setInterval.wrap && setInterval.visible
        ? Array.from(this.setIntervalHistory.values())
        : null,
      clearIntervalHistory: clearInterval.wrap && clearInterval.visible
        ? Array.from(this.clearIntervalHistory.values())
        : null,
    };
  }

  runCommand(type: ETimerType, handler: number) {
    if (type === ETimerType.TIMEOUT) {
      globalThis.clearTimeout(handler);
    } else {
      globalThis.clearInterval(handler);
    }
  }
}
