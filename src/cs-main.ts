import {
  EVENT_TELEMETRY,
  EVENT_OBSERVE_START,
  EVENT_OBSERVE_STOP,
  EVENT_CS_COMMAND,
  windowListen,
  windowPost,
  type TCsCommandEventOptions,
} from './api/communication';
import { IS_DEV, UI_UPDATE_FREQUENCY } from './api/const';
import { MeanAggregator, Stopper, Timer } from './api/time';
import {
  collectMediaMetrics,
  meetMedia,
  type TMediaMetrics,
} from './api/mediaMonitor';
import {
  Wrapper,
  type TOnlineTimerMetrics,
  type TTimerHistory,
  type TEvalHistory,
  ETimeType,
} from './api/wrappers';

export interface TMetrics {
  mediaMetrics: TMediaMetrics[];
  wrapperMetrics: {
    onlineTimeouts: TOnlineTimerMetrics[];
    onlineIntervals: TOnlineTimerMetrics[];
    setTimeoutHistory: TTimerHistory[];
    clearTimeoutHistory: TTimerHistory[];
    setIntervalHistory: TTimerHistory[];
    clearIntervalHistory: TTimerHistory[];
    evalHistory: TEvalHistory[];
  };
  callCounter: {
    setTimeout: number;
    clearTimeout: number;
    setInterval: number;
    clearInterval: number;
    eval: number;
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
      wrapperMetrics: wrapper.collectWrapperMetrics(),
      callCounter: wrapper.callCounter,
      tickTook: reportedTickExecutionTime,
    };

    windowPost(EVENT_TELEMETRY, metrics);
  },
  UI_UPDATE_FREQUENCY,
  { interval: true, animation: true, measurable: true }
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

windowListen(EVENT_CS_COMMAND, (o: TCsCommandEventOptions) => {
  if ('reset-wrapper-history' === o.operator) {
    wrapper.cleanHistory();
  } else if ('clear-timer-handler' === o.operator) {
    if (o.type === ETimeType.TIMEOUT) {
      window.clearTimeout(o.handler);
    } else {
      window.clearInterval(o.handler);
    }
  }
});
windowListen(EVENT_OBSERVE_START, startObserve);
windowListen(EVENT_OBSERVE_STOP, stopObserve);

IS_DEV && console.debug('cs-main.ts');
