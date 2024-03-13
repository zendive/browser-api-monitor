import { windowListen, windowPost } from './api/communication';
import { IS_DEV, UI_UPDATE_FREQUENCY_LOW } from './api/const';
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
    // adaptive update-frequency
    tick.options.animation = tick.executionTime < 3;

    const metrics: TMetrics = {
      mediaMetrics: collectMediaMetrics(),
      wrapperMetrics: wrapper.collectWrapperMetrics(),
      callCounter: wrapper.callCounter,
      tickTook: reportedTickExecutionTime,
    };

    windowPost({ msg: 'telemetry', metrics });
  },
  UI_UPDATE_FREQUENCY_LOW,
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

windowListen((o) => {
  if (o.msg === 'reset-wrapper-history') {
    wrapper.cleanHistory();
    tick.trigger();
  } else if (o.msg === 'clear-timer-handler') {
    if (o.type === ETimeType.TIMEOUT) {
      window.clearTimeout(o.handler);
    } else {
      window.clearInterval(o.handler);
    }
  } else if (o.msg === 'start-observe') {
    startObserve();
  } else if (o.msg === 'stop-observe') {
    stopObserve();
  }
});

IS_DEV && console.debug('cs-main.ts');
