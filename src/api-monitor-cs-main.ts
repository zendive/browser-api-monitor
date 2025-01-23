import { windowListen, windowPost } from './api/communication.ts';
import { IS_DEV } from './api/env.ts';
import {
  TELEMETRY_FREQUENCY_1PS,
  TELEMETRY_FREQUENCY_30PS,
} from './api/const.ts';
import { Timer } from './api/time.ts';
import {
  collectMediaMetrics,
  meetMedia,
  doMediaCommand,
  type TMediaTelemetry,
} from './api/mediaMonitor.ts';
import { Wrapper, type TWrapperMetrics } from './wrapper/Wrapper.ts';
import { panelsArray2Map, type TPanelMap } from './api/settings.ts';
import { ETimerType } from './wrapper/TimerWrapper.ts';

export interface TMetrics {
  mediaMetrics: TMediaTelemetry;
  wrapperMetrics: TWrapperMetrics;
  collectingStartTime: number;
}

let panels: TPanelMap;
let wrapper: Wrapper;
const eachSecond = new Timer({ delay: 1e3, repetitive: true }, () => {
  meetMedia(document.querySelectorAll('video,audio'));
  wrapper.eachSecond();
});
const tick = new Timer(
  { delay: TELEMETRY_FREQUENCY_1PS, repetitive: true },
  function apiMonitorPostMetric() {
    const now = Date.now();

    windowPost({
      msg: 'telemetry',
      metrics: {
        mediaMetrics: collectMediaMetrics(panels.media.visible),
        wrapperMetrics: wrapper.collectMetrics(),
        collectingStartTime: now,
      },
    });
  }
);

windowListen((o) => {
  if (o.msg === 'settings' && o.settings && typeof o.settings === 'object') {
    if (!wrapper) {
      wrapper = new Wrapper(panels);
    }
    panels = panelsArray2Map(o.settings.panels);
    wrapper.setup(panels, o.settings);
  } else if (o.msg === 'start-observe') {
    tick.start();
    eachSecond.start();
  } else if (o.msg === 'stop-observe') {
    tick.stop();
    eachSecond.stop();
  } else if (o.msg === 'reset-wrapper-history') {
    wrapper.cleanHistory();
    !tick.isPending && tick.trigger();
  } else if (o.msg === 'clear-timer-handler') {
    if (o.type === ETimerType.TIMEOUT) {
      window.clearTimeout(o.handler);
    } else {
      window.clearInterval(o.handler);
    }
  } else if (o.msg === 'media-command') {
    doMediaCommand(o.mediaId, o.cmd, o.property);
  } else if (o.msg === 'telemetry-acknowledged') {
    // adaptive update-frequency
    const ackTrafficDuration = Date.now() - o.timeSent;
    const newDelay = (o.trafficDuration + ackTrafficDuration) * 3;
    tick.delay = Math.max(TELEMETRY_FREQUENCY_30PS, newDelay);
  }
});

IS_DEV && console.debug('cs-main.ts');
