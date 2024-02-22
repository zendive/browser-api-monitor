import {
  EVENT_METRICS,
  EVENT_OBSERVE_START,
  EVENT_OBSERVE_STOP,
  EVENT_SETUP,
  windowListen,
  windowPost,
} from './api/communication';
import { UI_UPDATE_FREQUENCY } from './api/const';
import { setupTimekit } from './api/time';
import { wrapApis } from './api/wrappers';

(() => {
  const $ = wrapApis();
  const timekit = setupTimekit(
    $.apis.timers.setTimeout.native,
    $.apis.timers.clearTimeout.native
  );
  const secondStopper = new timekit.Stopper();
  let tickStopperTime = '';
  const tick = new timekit.Timer(
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

        timersUsages: $.apis.timersUsages.map((v) => [v[0], v[2]]),
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
