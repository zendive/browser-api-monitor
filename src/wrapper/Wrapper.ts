import { callingOnce } from '../api/time.ts';
import { TraceUtil } from './TraceUtil.ts';
import { EvalWrapper, type TEvalHistory } from './EvalWrapper.ts';
import {
  EWrapperCallstackType,
  panelsArray2Map,
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
import { MediaWrapper, type TMediaTelemetry } from './MediaWrapper.ts';

export type TTelemetry = {
  media: TMediaTelemetry;
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
  activeTimers: number;
  callCounter: {
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

let panels: TPanelMap;
const traceUtil = new TraceUtil();
const apiMedia = new MediaWrapper();
const apiEval = new EvalWrapper(traceUtil);
const apiTimer = new TimerWrapper(traceUtil, apiEval);
const apiAnimation = new AnimationWrapper(traceUtil);
const apiIdle = new IdleWrapper(traceUtil);

const setCallstackType = callingOnce((type: EWrapperCallstackType) => {
  traceUtil.callstackType = type;
});

const wrapApis = callingOnce(() => {
  panels.eval.wrap && apiEval.wrap();
  panels.setTimeout.wrap && apiTimer.wrapSetTimeout();
  panels.clearTimeout.wrap && apiTimer.wrapClearTimeout();
  panels.setInterval.wrap && apiTimer.wrapSetInterval();
  panels.clearInterval.wrap && apiTimer.wrapClearInterval();
  panels.requestAnimationFrame.wrap && apiAnimation.wrapRequestAnimationFrame();
  panels.cancelAnimationFrame.wrap && apiAnimation.wrapCancelAnimationFrame();
  panels.requestIdleCallback.wrap && apiIdle.wrapRequestIdleCallback();
  panels.cancelIdleCallback.wrap && apiIdle.wrapCancelIdleCallback();
});

export function setSettings(settings: TSettings) {
  panels = panelsArray2Map(settings.panels);
  traceUtil.trace4Debug = settings.trace4Debug;
  traceUtil.trace4Bypass = settings.trace4Bypass;
  setCallstackType(settings.wrapperCallstackType);
  wrapApis();
}

export function wrapperOnEachSecond() {
  apiMedia.meetMedia();
  if (
    panels.requestAnimationFrame.wrap &&
    panels.requestAnimationFrame.visible
  ) {
    apiAnimation.updateAnimationsFramerate();
  }
}

export function collectMetrics(): TTelemetry {
  return {
    media: apiMedia.collectMetrics(panels.media.visible),
    evalHistory: apiEval.collectHistory(panels.eval),
    ...apiTimer.collectHistory(
      panels.activeTimers,
      panels.setTimeout,
      panels.clearTimeout,
      panels.setInterval,
      panels.clearInterval
    ),
    ...apiAnimation.collectHistory(
      panels.requestAnimationFrame,
      panels.cancelAnimationFrame
    ),
    ...apiIdle.collectHistory(
      panels.requestIdleCallback,
      panels.cancelIdleCallback
    ),
    activeTimers: apiTimer.onlineTimers.size,
    callCounter: {
      eval: apiEval.callCounter,
      ...apiTimer.callCounter,
      ...apiAnimation.callCounter,
      ...apiIdle.callCounter,
    },
  };
}

export function runMediaCommand(
  ...args: Parameters<MediaWrapper['runCommand']>
) {
  apiMedia.runCommand(...args);
}

export function cleanHistory() {
  apiEval.cleanHistory();
  apiTimer.cleanHistory();
  apiAnimation.cleanHistory();
  apiIdle.cleanHistory();
}
