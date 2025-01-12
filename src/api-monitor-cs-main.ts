import { windowListen, windowPost } from './api/communication.ts';
import { IS_DEV } from './api/env.ts';
import {
  TELEMETRY_FREQUENCY_1PS,
  TELEMETRY_FREQUENCY_30PS,
} from './api/const.ts';
import { callingOnce, Timer } from './api/time.ts';
import {
  collectMediaMetrics,
  meetMedia,
  doMediaCommand,
  type TMediaTelemetry,
} from './api/mediaMonitor.ts';
import { Wrapper, TimerType, type TWrapperMetrics } from './api/wrappers.ts';
import {
  panelsArrayToVisibilityMap,
  type TPanelVisibilityMap,
} from './api/settings.ts';

export interface TMetrics {
  mediaMetrics: TMediaTelemetry;
  wrapperMetrics: TWrapperMetrics;
  collectingStartTime: number;
}

const wrapper = new Wrapper();
const wrapEvalOnce = callingOnce(() => wrapper.wrapEval());
const wrapSetTimeoutOnce = callingOnce(() => wrapper.wrapSetTimeout());
const wrapClearTimeoutOnce = callingOnce(() => wrapper.wrapClearTimeout());
const wrapSetIntervalOnce = callingOnce(() => wrapper.wrapSetInterval());
const wrapClearIntervalOnce = callingOnce(() => wrapper.wrapClearInterval());
const wrapRequestAnimationFrameOnce = callingOnce(() =>
  wrapper.wrapRequestAnimationFrame()
);
const wrapCancelAnimationFrameOnce = callingOnce(() =>
  wrapper.wrapCancelAnimationFrame()
);
const wrapRequestIdleCallbackOnce = callingOnce(() =>
  wrapper.wrapRequestIdleCallback()
);
const wrapCancelIdleCallbackOnce = callingOnce(() =>
  wrapper.wrapCancelIdleCallback()
);
let panels: TPanelVisibilityMap;
const eachSecond = new Timer(
  () => {
    meetMedia(document.querySelectorAll('video,audio'));
  },
  1e3,
  { interval: true }
);
const tick = new Timer(
  function apiMonitorPostMetric() {
    const now = Date.now();

    const metrics: TMetrics = {
      mediaMetrics: collectMediaMetrics(panels.media.visible),
      wrapperMetrics: wrapper.collectWrapperMetrics(panels),
      collectingStartTime: now,
    };

    windowPost({ msg: 'telemetry', metrics });
  },
  TELEMETRY_FREQUENCY_1PS,
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
  if (o.msg === 'telemetry-acknowledged') {
    // adaptive update-frequency
    const ackTrafficDuration = Date.now() - o.timeSent;
    const newDelay = (o.trafficDuration + ackTrafficDuration) * 3;
    tick.delay = Math.max(TELEMETRY_FREQUENCY_30PS, newDelay);
  } else if (o.msg === 'start-observe') {
    startObserve();
  } else if (o.msg === 'stop-observe') {
    stopObserve();
  } else if (
    o.msg === 'settings' &&
    o.settings &&
    typeof o.settings === 'object'
  ) {
    panels = panelsArrayToVisibilityMap(o.settings.panels);
    panels.eval.wrap && wrapEvalOnce();
    panels.setTimeout.wrap && wrapSetTimeoutOnce();
    panels.clearTimeout.wrap && wrapClearTimeoutOnce();
    panels.setInterval.wrap && wrapSetIntervalOnce();
    panels.clearInterval.wrap && wrapClearIntervalOnce();
    panels.requestAnimationFrame && wrapRequestAnimationFrameOnce();
    panels.cancelAnimationFrame && wrapCancelAnimationFrameOnce();
    panels.requestIdleCallback && wrapRequestIdleCallbackOnce();
    panels.cancelIdleCallback && wrapCancelIdleCallbackOnce();
    wrapper.setTraceForDebug(o.settings.traceForDebug);
    wrapper.setCallstackType(o.settings.wrapperCallstackType);
  } else if (o.msg === 'reset-wrapper-history') {
    wrapper.cleanHistory();
    tick.trigger();
  } else if (o.msg === 'clear-timer-handler') {
    if (o.type === TimerType.TIMEOUT) {
      window.clearTimeout(o.handler);
    } else {
      window.clearInterval(o.handler);
    }
  } else if (o.msg === 'media-command') {
    doMediaCommand(o.mediaId, o.cmd, o.property);
  }
});

IS_DEV && console.debug('cs-main.ts');
