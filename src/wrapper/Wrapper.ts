import { callableOnce } from '../api/time.ts';
import { TraceUtil } from './shared/TraceUtil.ts';
import { EvalWrapper, type TEvalHistory } from './EvalWrapper.ts';
import {
  EWrapperCallstackType,
  panelsArray2Map,
  type TConfig,
  type TPanelMap,
} from '../api/storage/storage.local.ts';
import {
  type TClearTimerHistory,
  TimerWrapper,
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
import type { TSession } from '../api/storage/storage.session.ts';

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

const setCallstackType = callableOnce((type: EWrapperCallstackType) => {
  traceUtil.callstackType = type;
});

const wrapApis = callableOnce(() => {
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

export function applyConfig(config: TConfig) {
  panels = panelsArray2Map(config.panels);
  setCallstackType(config.wrapperCallstackType);
  wrapApis();
}

export function applySession(session: TSession) {
  traceUtil.debug = new Set(session.debug);
  traceUtil.bypass = new Set(session.bypass);
}

export function onEachSecond() {
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
      panels.clearInterval,
    ),
    ...apiAnimation.collectHistory(
      panels.requestAnimationFrame,
      panels.cancelAnimationFrame,
    ),
    ...apiIdle.collectHistory(
      panels.requestIdleCallback,
      panels.cancelIdleCallback,
    ),
    activeTimers: apiTimer.onlineTimers.size,
    callCounter: panels.callsSummary.visible
      ? {
        eval: apiEval.callCounter,
        ...apiTimer.callCounter,
        ...apiAnimation.callCounter,
        ...apiIdle.callCounter,
      }
      : {
        eval: 0,
        setTimeout: 0,
        clearTimeout: 0,
        setInterval: 0,
        clearInterval: 0,
        requestAnimationFrame: 0,
        cancelAnimationFrame: 0,
        requestIdleCallback: 0,
        cancelIdleCallback: 0,
      },
  };
}

export function runMediaCommand(
  ...args: Parameters<MediaWrapper['runCommand']>
) {
  apiMedia.runCommand(...args);
}

export function runTimerCommand(
  ...args: Parameters<TimerWrapper['runCommand']>
) {
  apiTimer.runCommand(...args);
}

export function cleanHistory() {
  apiEval.cleanHistory();
  apiTimer.cleanHistory();
  apiAnimation.cleanHistory();
  apiIdle.cleanHistory();
}
