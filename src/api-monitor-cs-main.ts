import { windowListen, windowPost } from './api/communication.ts';
import {
  IS_DEV,
  UI_UPDATE_FREQUENCY_LOW,
  UI_UPDATE_FREQUENCY_VERYLOW,
} from './api/const.ts';
import { MeanAggregator, Stopper, Timer } from './api/time.ts';
import {
  collectMediaMetrics,
  meetMedia,
  type TMediaTelemetry,
} from './api/mediaMonitor.ts';
import {
  Wrapper,
  type TOnlineTimerMetrics,
  type TTimerHistory,
  type TEvalHistory,
  ETimeType,
} from './api/wrappers.ts';
import {
  DEFAULT_SETTINGS,
  panelsArrayToVisibilityMap,
} from './api/settings.ts';

export interface TMetrics {
  mediaMetrics: TMediaTelemetry;
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

let panels = panelsArrayToVisibilityMap(DEFAULT_SETTINGS.panels);
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
    if (tick.executionTime < 3) {
      tick.options.animation = true;
    } else {
      tick.options.animation = false;
      tick.delay =
        tick.executionTime < 6
          ? UI_UPDATE_FREQUENCY_LOW
          : UI_UPDATE_FREQUENCY_VERYLOW;
    }

    const metrics: TMetrics = {
      mediaMetrics: collectMediaMetrics(panels.media),
      wrapperMetrics: wrapper.collectWrapperMetrics(panels),
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
  if (o.msg === 'start-observe') {
    startObserve();
  } else if (o.msg === 'stop-observe') {
    stopObserve();
  } else if (
    o.msg === 'settings' &&
    o.settings &&
    typeof o.settings === 'object'
  ) {
    panels = panelsArrayToVisibilityMap(o.settings.panels);
  } else if (o.msg === 'reset-wrapper-history') {
    wrapper.cleanHistory();
    tick.trigger();
  } else if (o.msg === 'clear-timer-handler') {
    if (o.type === ETimeType.TIMEOUT) {
      window.clearTimeout(o.handler);
    } else {
      window.clearInterval(o.handler);
    }
  }
});

IS_DEV && console.debug('cs-main.ts');
