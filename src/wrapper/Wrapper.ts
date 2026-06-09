import { callableOnce } from '../api/time.ts';
import { EvalWrapper, type IEvalHistory } from './EvalWrapper.ts';
import {
  panelsArray2Map,
  type TConfig,
  type TPanelMap,
} from '../api/storage/storage.local.ts';
import {
  type IClearTimerHistory,
  type IOnlineTimerMetrics,
  type ISetTimerHistory,
  TimerWrapper,
} from './TimerWrapper.ts';
import {
  AnimationWrapper,
  type ICancelAnimationFrameHistory,
  type IRequestAnimationFrameHistory,
} from './AnimationWrapper.ts';
import {
  type ICancelIdleCallbackHistory,
  IdleWrapper,
  type IRequestIdleCallbackHistory,
} from './IdleWrapper.ts';
import { type IMediaTelemetry, MediaWrapper } from './MediaWrapper.ts';
import type { TSession } from '../api/storage/storage.session.ts';
import {
  collectWorkerHistory,
  type IWorkerTelemetry,
  updateWorkerCallsPerSecond,
  wrapWorker,
} from './WorkerWrapper.ts';
import { traceUtil } from './shared/util.ts';
import {
  type ISchedulerTelemetry,
  SchedulerWrapper,
} from './SchedulerWrapper.ts';
import type { EWrapperCallstackType } from './shared/TraceUtil.ts';
import {
  collectSharedWorkerHistory,
  type ISharedWorkerTelemetry,
  updateSharedWorkerCallsPerSecond,
  wrapSharedWorker,
} from './SharedWorkerWrapper.ts';

export interface ITelemetry {
  locationOrigin: string;
  media: IMediaTelemetry;
  onlineTimers: IOnlineTimerMetrics[];
  setTimeoutHistory: ISetTimerHistory[] | null;
  clearTimeoutHistory: IClearTimerHistory[] | null;
  setIntervalHistory: ISetTimerHistory[] | null;
  clearIntervalHistory: IClearTimerHistory[] | null;
  evalHistory: IEvalHistory[] | null;
  rafHistory: IRequestAnimationFrameHistory[] | null;
  cafHistory: ICancelAnimationFrameHistory[] | null;
  ricHistory: IRequestIdleCallbackHistory[] | null;
  cicHistory: ICancelIdleCallbackHistory[] | null;
  worker: IWorkerTelemetry;
  sharedWorker: ISharedWorkerTelemetry;
  scheduler: ISchedulerTelemetry;
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
}

let panels: TPanelMap;
const apiMedia = new MediaWrapper();
const apiEval = new EvalWrapper();
const apiTimer = new TimerWrapper(apiEval);
const apiAnimation = new AnimationWrapper();
const apiIdle = new IdleWrapper();
const apiScheduler = new SchedulerWrapper();

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
  panels.worker.wrap && wrapWorker();
  panels.sharedWorker.wrap && wrapSharedWorker();
  if (panels.scheduler.wrap) {
    apiScheduler.wrapYield();
    apiScheduler.wrapPostTask();
  }
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
  apiMedia.meetMedia(panels.media);
  apiAnimation.updateCallsPerSecond(panels.requestAnimationFrame);
  apiIdle.updateCallsPerSecond(panels.requestIdleCallback);
  updateWorkerCallsPerSecond(panels.worker);
  updateSharedWorkerCallsPerSecond(panels.sharedWorker);
  apiScheduler.updateCallsPerSecond(panels.scheduler);
}

export function collectMetrics(): ITelemetry {
  return {
    locationOrigin: globalThis.location.origin,
    media: apiMedia.collectMetrics(panels.media),
    evalHistory: apiEval.collectHistory(panels.eval),
    ...apiTimer.collectHistory(
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
    worker: collectWorkerHistory(panels.worker),
    sharedWorker: collectSharedWorkerHistory(panels.sharedWorker),
    scheduler: apiScheduler.collectHistory(panels.scheduler),
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

export function exposeConsoleInterface() {
  Object.assign(console, {
    apiMonitor: {
      observeMedia(el: unknown) {
        if (el instanceof HTMLMediaElement) {
          apiMedia.addToTelemetry(el);
        } else {
          console.error(`HTMLMediaElement expected`);
        }
      },
      unobserveMedia(el: unknown) {
        if (el instanceof HTMLMediaElement) {
          apiMedia.removeFromTelemetry(el);
        } else {
          console.error(`HTMLMediaElement expected`);
        }
      },
    },
  });
}
