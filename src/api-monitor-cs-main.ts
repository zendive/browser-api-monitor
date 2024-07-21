import { windowListen, windowPost } from '@/api/communication.ts';
import { IS_DEV } from './api/env.ts';
import {
  TELEMETRY_FREQUENCY_5PS,
  TELEMETRY_FREQUENCY_1PS,
  TELEMETRY_FREQUENCY_60PS,
} from '@/api/const.ts';
import { MeanAggregator, Stopper, Timer } from '@/api/time.ts';
import {
  collectMediaMetrics,
  meetMedia,
  doMediaCommand,
  type TMediaTelemetry,
} from '@/api/mediaMonitor.ts';
import { Wrapper, ETimerType, type TWrapperMetrics } from '@/api/wrappers.ts';
import {
  DEFAULT_SETTINGS,
  panelsArrayToVisibilityMap,
} from '@/api/settings.ts';

export interface TMetrics {
  mediaMetrics: TMediaTelemetry;
  wrapperMetrics: TWrapperMetrics;
  callCounter: {
    setTimeout: number;
    clearTimeout: number;
    setInterval: number;
    clearInterval: number;
    eval: number;
    requestAnimationFrame: number;
    cancelAnimationFrame: number;
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
  function apiMonitorPostMetric() {
    if (0 < tick.executionTime) {
      meanExecutionTime.add(tick.executionTime);

      // adaptive update-frequency
      if (
        meanExecutionTime.mean < 3 &&
        meanExecutionTime.standardDeviation < 1
      ) {
        tick.delay = TELEMETRY_FREQUENCY_60PS;
      } else {
        tick.delay =
          meanExecutionTime.mean < 8
            ? TELEMETRY_FREQUENCY_5PS
            : TELEMETRY_FREQUENCY_1PS;
      }
    }

    const metrics: TMetrics = {
      mediaMetrics: collectMediaMetrics(panels.media),
      wrapperMetrics: wrapper.collectWrapperMetrics(panels),
      callCounter: wrapper.callCounter,
      tickTook: reportedTickExecutionTime,
    };

    windowPost({ msg: 'telemetry', metrics });
  },
  TELEMETRY_FREQUENCY_5PS,
  { interval: true, animation: false, measurable: true }
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
    if (o.type === ETimerType.TIMEOUT) {
      window.clearTimeout(o.handler);
    } else {
      window.clearInterval(o.handler);
    }
  } else if (o.msg === 'media-command') {
    doMediaCommand(o.mediaId, o.cmd, o.property);
  }
});

IS_DEV && console.debug('cs-main.ts');
