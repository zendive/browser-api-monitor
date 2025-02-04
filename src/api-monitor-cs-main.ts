import { EMsg, windowListen, windowPost } from './api/communication.ts';
import { IS_DEV } from './api/env.ts';
import { TELEMETRY_FREQUENCY_1PS } from './api/const.ts';
import { adjustTelemetryDelay, Stopper, Timer } from './api/time.ts';
import {
  onEachSecond,
  setSettings,
  cleanHistory,
  collectMetrics,
  runMediaCommand,
  runTimerCommand,
  type TTelemetry,
} from './wrapper/Wrapper.ts';
import diff from './api/diff.ts';

let original: TTelemetry | null;
let resetOriginalWhen = 0;
const resetOriginalNow = 5;
const eachSecond = new Timer({ delay: 1e3, repetitive: true }, () => {
  onEachSecond();

  if (++resetOriginalWhen === resetOriginalNow) {
    original = null;
    resetOriginalWhen = 0;
  }
});
const metricsStopper = new Stopper();
const diffStopper = new Stopper();
const tick = new Timer(
  { delay: TELEMETRY_FREQUENCY_1PS, repetitive: true },
  function apiMonitorTelemetryTick() {
    const now = Date.now();

    // @ts-ignore
    window.stoppers = [
      Stopper.toString(metricsStopper.value()),
      Stopper.toString(diffStopper.value()),
    ];

    if (!original) {
      metricsStopper.start();
      const current = collectMetrics();
      original = structuredClone(current);
      metricsStopper.stop();

      windowPost({
        msg: EMsg.TELEMETRY,
        timeOfCollection: now,
        telemetry: original,
      });
    } else {
      diffStopper.start();
      const current = collectMetrics();
      const delta = diff.diff(original, current);
      diffStopper.stop();

      if (!delta) {
        return;
      }

      windowPost({
        msg: EMsg.TELEMETRY,
        timeOfCollection: now,
        telemetryDelta: delta,
      });
    }
  }
);

windowListen((o) => {
  if (o.msg === EMsg.TELEMETRY_ACKNOWLEDGED) {
    tick.delay = adjustTelemetryDelay(o.timeOfCollection);
  } else if (
    o.msg === EMsg.SETTINGS &&
    o.settings &&
    typeof o.settings === 'object'
  ) {
    setSettings(o.settings);
  } else if (o.msg === EMsg.START_OBSERVE) {
    tick.start();
    eachSecond.start();
  } else if (o.msg === EMsg.STOP_OBSERVE) {
    tick.stop();
    eachSecond.stop();
  } else if (o.msg === EMsg.RESET_WRAPPER_HISTORY) {
    cleanHistory();
    !tick.isPending && tick.trigger();
  } else if (o.msg === EMsg.TIMER_COMMAND) {
    runTimerCommand(o.type, o.handler);
  } else if (o.msg === EMsg.MEDIA_COMMAND) {
    runMediaCommand(o.mediaId, o.cmd, o.property);
  }
});

IS_DEV && console.debug('cs-main.ts');
