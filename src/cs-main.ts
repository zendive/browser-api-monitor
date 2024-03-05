import {
  EVENT_TELEMETRY,
  EVENT_OBSERVE_START,
  EVENT_OBSERVE_STOP,
  EVENT_CS_COMMAND,
  windowListen,
  windowPost,
} from './api/communication';
import {
  IS_DEV,
  UI_UPDATE_FREQUENCY,
  type TCaCommandEventOptions,
} from './api/const';
import { MeanAggregator, Stopper, Timer } from './api/time';
import {
  collectMediaUsages as collectMediaMetrics,
  meetMedia,
  type TMediaMetrics,
} from './api/mediaMonitor';
import {
  Wrapper,
  type TActiveTimerMetrics,
  type TTimerHistory,
  type TEvalMetrics as TEvalHistory,
} from './api/wrappers';

export interface TMetrics {
  mediaMetrics: TMediaMetrics[];
  timeMetrics: {
    onlineTimeouts: TActiveTimerMetrics[];
    onlineIntervals: TActiveTimerMetrics[];
    setTimeoutHistory: TTimerHistory[];
    clearTimeoutHistory: TTimerHistory[];
    setIntervalHistory: TTimerHistory[];
    clearIntervalHistory: TTimerHistory[];
  };
  callCounter: {
    setTimeout: number;
    clearTimeout: number;
    setInterval: number;
    clearInterval: number;
  };
  evalMetrics: {
    totalInvocations: number;
    evalHistory: TEvalHistory[];
  };
  tickTook: string;
}

const wrapper = new Wrapper();
wrapper.wrapApis();

let reportedTickExecutionTime = '';
const meanExecutionTime = new MeanAggregator();
const eachSecond = new Timer(
  () => {
    reportedTickExecutionTime = Stopper.toString(meanExecutionTime.mean);
    meanExecutionTime.reset();

    meetMedia(document.querySelectorAll('video,audio'));
  },
  1e3,
  { interval: true }
);
const tick = new Timer(
  () => {
    meanExecutionTime.add(tick.executionTime);

    const metrics: TMetrics = {
      mediaMetrics: collectMediaMetrics(),
      timeMetrics: wrapper.collectTimersMetrics(),
      callCounter: {
        setTimeout: wrapper.callCounter.setTimeout,
        clearTimeout: wrapper.callCounter.clearTimeout,
        setInterval: wrapper.callCounter.setInterval,
        clearInterval: wrapper.callCounter.clearInterval,
      },
      evalMetrics: {
        totalInvocations: wrapper.callCounter.eval,
        evalHistory: wrapper.evalHistory,
      },
      tickTook: reportedTickExecutionTime,
    };

    windowPost(EVENT_TELEMETRY, metrics);
  },
  UI_UPDATE_FREQUENCY,
  { interval: true, animation: true, measurable: true /*TODO: IS_DEV?*/ }
);

function startObserve() {
  stopObserve();
  tick.start();
  eachSecond.start();
}

function stopObserve() {
  tick.stop();
  eachSecond.stop();
}

windowListen(EVENT_CS_COMMAND, (o: TCaCommandEventOptions) => {
  for (const operator of o.operators) {
    if ('reset-wrapper-history' === operator) {
      wrapper.cleanHistory();
    }
  }
});
windowListen(EVENT_OBSERVE_START, startObserve);
windowListen(EVENT_OBSERVE_STOP, stopObserve);

IS_DEV && console.debug('cs-main.ts');
