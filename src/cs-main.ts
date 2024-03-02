import {
  EVENT_METRICS,
  EVENT_OBSERVE_START,
  EVENT_OBSERVE_STOP,
  EVENT_SETUP,
  windowListen,
  windowPost,
} from './api/communication';
import { IS_DEV, UI_UPDATE_FREQUENCY } from './api/const';
import { MeanAggregator, Stopper, Timer } from './api/time';
import {
  collectMediaUsages as collectMediaMetrics,
  meetMedia,
  type TMediaMetrics,
} from './api/mediaMonitor';
import {
  Wrapper,
  type TTimerMetrics,
  type TClearTimerMetrics,
  type TEvalMetrics,
} from './api/wrappers';

export interface TMetrics {
  mediaMetrics: TMediaMetrics[];
  timeMetrics: {
    timeouts: TTimerMetrics[];
    intervals: TTimerMetrics[];
    clearTimeouts: TClearTimerMetrics[];
    clearIntervals: TClearTimerMetrics[];
  };

  timersInvocations: {
    setTimeout: number;
    clearTimeout: number;
    setInterval: number;
    clearInterval: number;
  };
  evalMetrics: {
    totalInvocations: number;
    usages: TEvalMetrics[];
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
  },
  1e3,
  { interval: true }
);
const tick = new Timer(
  () => {
    meanExecutionTime.add(tick.executionTime);

    meetMedia(document.querySelectorAll('video,audio'));

    const metrics: TMetrics = {
      mediaMetrics: collectMediaMetrics(),
      timeMetrics: wrapper.collectTimersMetrics(),
      timersInvocations: {
        setTimeout: wrapper.timers.setTimeout.invocations,
        clearTimeout: wrapper.timers.clearTimeout.invocations,
        setInterval: wrapper.timers.setInterval.invocations,
        clearInterval: wrapper.timers.clearInterval.invocations,
      },
      evalMetrics: wrapper.danger.evalMetrics,
      tickTook: reportedTickExecutionTime,
    };

    windowPost(EVENT_METRICS, metrics);
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

windowListen(EVENT_SETUP, () => {
  // absorb setups oprtions?
});
windowListen(EVENT_OBSERVE_START, startObserve);
windowListen(EVENT_OBSERVE_STOP, stopObserve);

IS_DEV && console.debug('cs-main.ts');
