import { EMsg, windowListen, windowPost } from './api/communication.ts';
import { TELEMETRY_FREQUENCY_1PS } from './api/const.ts';
import { adjustTelemetryDelay, Timer } from './api/time.ts';
import {
  cleanHistory,
  collectMetrics,
  onEachSecond,
  runMediaCommand,
  runTimerCommand,
  setSettings,
  setTracePoints,
  type TTelemetry,
} from './wrapper/Wrapper.ts';
import diff from './api/diff.ts';

let originalMetrics: TTelemetry | null;
let currentMetrics: TTelemetry | null;
const eachSecond = new Timer({ delay: 1e3, repetitive: true }, onEachSecond);
const tick = new Timer(
  { delay: TELEMETRY_FREQUENCY_1PS, repetitive: false },
  function apiMonitorTelemetryTick() {
    const now = Date.now();
    currentMetrics = structuredClone(collectMetrics());

    if (!originalMetrics) {
      originalMetrics = currentMetrics;

      windowPost({
        msg: EMsg.TELEMETRY,
        timeOfCollection: now,
        telemetry: originalMetrics,
      });
    } else {
      const delta = diff.diff(originalMetrics, currentMetrics);

      if (delta) {
        windowPost({
          msg: EMsg.TELEMETRY_DELTA,
          timeOfCollection: now,
          telemetryDelta: delta,
        });
      } else {
        tick.start();
      }
    }
  },
);

windowListen((o) => {
  if (o.msg === EMsg.TELEMETRY_ACKNOWLEDGED) {
    tick.delay = adjustTelemetryDelay(o.timeOfCollection);
    originalMetrics = currentMetrics;
    eachSecond.isPending() && tick.start();
  } else if (
    o.msg === EMsg.SETTINGS &&
    o.settings &&
    typeof o.settings === 'object'
  ) {
    setSettings(o.settings);
  } else if (o.msg === EMsg.START_OBSERVE) {
    originalMetrics = currentMetrics = null;
    tick.trigger();
    eachSecond.start();
  } else if (o.msg === EMsg.STOP_OBSERVE) {
    tick.stop();
    eachSecond.stop();
    originalMetrics = currentMetrics = null;
  } else if (o.msg === EMsg.RESET_WRAPPER_HISTORY) {
    originalMetrics = currentMetrics = null;
    cleanHistory();
    !tick.isPending() && tick.trigger();
  } else if (o.msg === EMsg.TIMER_COMMAND) {
    runTimerCommand(o.type, o.handler);
  } else if (o.msg === EMsg.MEDIA_COMMAND) {
    runMediaCommand(o.mediaId, o.cmd, o.property);
  } else if (o.msg === EMsg.SESSION) {
    setTracePoints(o.session);
  }
});

__development__ && console.debug('api-monitor-cs-main.ts', performance.now());
