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
import { listVideos, meetVideos, type TVideoMetrics } from './api/videoMonitor';
import { wrapApis } from './api/wrappers';
import type { TTimersUsagesStack } from './api/wrappers';

export type TMetricTimersUsages = [delay: number, stack: TTimersUsagesStack[]];
export interface TMetrics {
  videos: TVideoMetrics[];
  audiosCount: number;
  timersUsages: {
    timeouts: TMetricTimersUsages[];
    intervals: TMetricTimersUsages[];
  };
  timers: { name: string; invocations: number }[];
  dangerEval: { invocations: number };
  tickTook: string;
}

(() => {
  const $ = wrapApis();
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
        videos: listVideos(),
        audiosCount: audiosEl.length,

        timersUsages: {
          timeouts: $.apis.timersUsages
            .filter((v) => !v[0])
            .map((v) => [v[2], v[3]])
            // descending by delay
            .sort((a: any, b: any) => b[0] - a[0]),
          intervals: $.apis.timersUsages
            .filter((v) => v[0])
            .map((v) => [v[2], v[3]])
            // descending by delay
            .sort((a: any, b: any) => b[0] - a[0]),
        },
        timers: Object.keys($.apis.timers).map((key) => {
          const api = $.apis.timers[key as keyof typeof $.apis.timers];
          return {
            name: key,
            invocations: api.invocations,
          };
        }),
        dangerEval: { invocations: $.apis.danger.eval.invocations },
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
