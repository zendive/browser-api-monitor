import {
  EVENT_METRICS,
  EVENT_OBSERVE_START,
  EVENT_OBSERVE_STOP,
  EVENT_SETUP,
  windowListen,
  windowPost,
} from './api/communication';
import { IS_DEV, UI_UPDATE_FREQUENCY } from './api/const';
import { Stopper, Timer } from './api/time';
import {
  collectVideosUsages,
  meetVideos,
  type TVideoMetrics,
} from './api/videoMonitor';
import { Wrapper } from './api/wrappers';
import type { TTimerMetrics, TClearTimerMetrics } from './api/wrappers';

export interface TMetrics {
  videos: TVideoMetrics[];
  audiosCount: number;
  timersUsages: {
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
  dangerEval: { invocations: number };
  tickTook: string;
}

(() => {
  const wrapper = new Wrapper();
  wrapper.wrapApis();

  const secondStopper = new Stopper();
  let tickStopperTime = '';
  const tick = new Timer(
    () => {
      if (secondStopper.now() > 1e3) {
        secondStopper.start();
        tickStopperTime = tick.stopper?.toString() || '';
      }

      meetVideos(document.querySelectorAll('video'));
      const audiosEl = document.querySelectorAll('audio');

      windowPost(EVENT_METRICS, <TMetrics>{
        videos: collectVideosUsages(),
        audiosCount: audiosEl.length,
        timersUsages: wrapper.collectTimersUsages(),
        timersInvocations: {
          setTimeout: wrapper.timers.setTimeout.invocations,
          clearTimeout: wrapper.timers.clearTimeout.invocations,
          setInterval: wrapper.timers.setInterval.invocations,
          clearInterval: wrapper.timers.clearInterval.invocations,
        },
        dangerEval: { invocations: wrapper.danger.eval.invocations },
        tickTook: tickStopperTime,
      });
    },
    UI_UPDATE_FREQUENCY,
    { interval: true, animation: true, measurable: true /*TODO: IS_DEV?*/ }
  );

  function startObserve() {
    stopObserve();
    secondStopper.start();
    tick.start();
  }

  function stopObserve() {
    tick.stop();
    secondStopper.stop();
  }

  windowListen(EVENT_SETUP, () => {
    // absorb setups oprtions?
  });
  windowListen(EVENT_OBSERVE_START, startObserve);
  windowListen(EVENT_OBSERVE_STOP, stopObserve);

  IS_DEV && console.debug('cs-main.ts');
})();
