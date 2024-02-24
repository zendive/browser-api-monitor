import {
  EVENT_METRICS,
  EVENT_OBSERVE_START,
  EVENT_OBSERVE_STOP,
  EVENT_SETUP,
  windowListen,
  windowPost,
} from './api/communication';
import { UI_UPDATE_FREQUENCY } from './api/const';
import { Stopper, Timer } from './api/time';
import { wrapApis } from './api/wrappers';

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

      const videosEl = document.querySelectorAll('video');
      const audiosEl = document.querySelectorAll('audio');

      windowPost(EVENT_METRICS, {
        videosCount: videosEl.length,
        audiosCount: audiosEl.length,

        timersUsages: {
          timeouts: $.apis.timersUsages
            .filter((v) => !v[0])
            .map((v) => [v[2], v[3]])
            .sort((a, b) => b[0] - a[0]), // descending by delay
          intervals: $.apis.timersUsages
            .filter((v) => v[0])
            .map((v) => [v[2], v[3]])
            .sort((a, b) => b[0] - a[0]),
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

  windowListen(EVENT_SETUP, () => {});
  windowListen(EVENT_OBSERVE_START, startObserve);
  windowListen(EVENT_OBSERVE_STOP, stopObserve);

  // console.debug('cs-main.ts');
})();
