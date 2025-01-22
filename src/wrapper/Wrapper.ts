import { callingOnce } from '../api/time.ts';
import { TraceUtil } from './TraceUtil.ts';
import { EvalWrapper, type TEvalHistory } from './EvalWrapper.ts';
import {
  EWrapperCallstackType,
  type TPanelMap,
  type TSettings,
} from '../api/settings.ts';
import {
  TimerWrapper,
  type TClearTimerHistory,
  type TOnlineTimerMetrics,
  type TSetTimerHistory,
} from './TimerWrapper.ts';
import {
  AnimationWrapper,
  type TCancelAnimationFrameHistory,
  type TRequestAnimationFrameHistory,
} from './AnimationWrapper.ts';
import {
  IdleWrapper,
  type TCancelIdleCallbackHistory,
  type TRequestIdleCallbackHistory,
} from './IdleWrapper.ts';

export type TWrapperMetrics = {
  onlineTimers: TOnlineTimerMetrics[] | null;
  setTimeoutHistory: TSetTimerHistory[] | null;
  clearTimeoutHistory: TClearTimerHistory[] | null;
  setIntervalHistory: TSetTimerHistory[] | null;
  clearIntervalHistory: TClearTimerHistory[] | null;
  evalHistory: TEvalHistory[] | null;
  rafHistory: TRequestAnimationFrameHistory[] | null;
  cafHistory: TCancelAnimationFrameHistory[] | null;
  ricHistory: TRequestIdleCallbackHistory[] | null;
  cicHistory: TCancelIdleCallbackHistory[] | null;
  callCounter: {
    activeTimers: number;
    setTimeout: number;
    clearTimeout: number;
    setInterval: number;
    clearInterval: number;
    eval: number;
    requestAnimationFrame: number;
    cancelAnimationFrame: number;
    requestIdleCallback: number;
    cancelIdleCallback: number;
  };
};

export class Wrapper {
  traceUtil = new TraceUtil();
  apiEval: EvalWrapper;
  apiTimer: TimerWrapper;
  apiAnimation: AnimationWrapper;
  apiIdle: IdleWrapper;

  constructor() {
    this.apiEval = new EvalWrapper(this.traceUtil);
    this.apiTimer = new TimerWrapper(this.traceUtil, this.apiEval);
    this.apiAnimation = new AnimationWrapper(this.traceUtil);
    this.apiIdle = new IdleWrapper(this.traceUtil);
  }

  setup(panels: TPanelMap, settings: TSettings) {
    this.traceUtil.trace4Debug = settings.trace4Debug;
    this.traceUtil.trace4Bypass = settings.trace4Bypass;
    this.setCallstackType(settings.wrapperCallstackType);
    this.wrapByPanels(panels);
  }

  collectMetrics(panels: TPanelMap): TWrapperMetrics {
    return {
      ...this.apiEval.collectHistory(panels),
      ...this.apiTimer.collectHistory(panels),
      ...this.apiAnimation.collectHistory(panels),
      ...this.apiIdle.collectHistory(panels),
      callCounter: {
        eval: this.apiEval.callCounter,
        activeTimers: this.apiTimer.onlineTimers.size,
        ...this.apiTimer.callCounter,
        ...this.apiAnimation.callCounter,
        ...this.apiIdle.callCounter,
      },
    };
  }

  setCallstackType = callingOnce((type: EWrapperCallstackType) => {
    this.traceUtil.callstackType = type;
  });

  wrapByPanels = callingOnce((panels: TPanelMap) => {
    panels.eval.wrap && this.apiEval.wrap();
    panels.setTimeout.wrap && this.apiTimer.wrapSetTimeout();
    panels.clearTimeout.wrap && this.apiTimer.wrapClearTimeout();
    panels.setInterval.wrap && this.apiTimer.wrapSetInterval();
    panels.clearInterval.wrap && this.apiTimer.wrapClearInterval();
    panels.requestAnimationFrame.wrap &&
      this.apiAnimation.wrapRequestAnimationFrame();
    panels.cancelAnimationFrame.wrap &&
      this.apiAnimation.wrapCancelAnimationFrame();
    panels.requestIdleCallback.wrap && this.apiIdle.wrapRequestIdleCallback();
    panels.cancelIdleCallback.wrap && this.apiIdle.wrapCancelIdleCallback();
  });

  cleanHistory() {
    this.apiEval.cleanHistory();
    this.apiTimer.cleanHistory();
    this.apiAnimation.cleanHistory();
    this.apiIdle.cleanHistory();
  }
}
