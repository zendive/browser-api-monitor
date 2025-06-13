import { EMsg, windowListen, windowPost } from './api/communication.ts';
import { TELEMETRY_FREQUENCY_1PS } from './api/const.ts';
import { adjustTelemetryDelay, Timer } from './api/time.ts';
import {
  applyConfig,
  applySession,
  cleanHistory,
  collectMetrics,
  onEachSecond,
  runMediaCommand,
  runTimerCommand,
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
  if (EMsg.TELEMETRY_ACKNOWLEDGED === o.msg) {
    tick.delay = adjustTelemetryDelay(o.timeOfCollection);
    originalMetrics = currentMetrics;
    eachSecond.isPending() && tick.start();
  } else if (EMsg.CONFIG === o.msg) {
    applyConfig(o.config);
  } else if (EMsg.START_OBSERVE === o.msg) {
    originalMetrics = currentMetrics = null;
    tick.trigger();
    eachSecond.start();
  } else if (EMsg.STOP_OBSERVE === o.msg) {
    tick.stop();
    eachSecond.stop();
    originalMetrics = currentMetrics = null;
  } else if (EMsg.RESET_WRAPPER_HISTORY === o.msg) {
    originalMetrics = currentMetrics = null;
    cleanHistory();
    !tick.isPending() && tick.trigger();
  } else if (EMsg.TIMER_COMMAND === o.msg) {
    runTimerCommand(o.type, o.handler);
  } else if (EMsg.MEDIA_COMMAND === o.msg) {
    runMediaCommand(o.mediaId, o.cmd, o.property);
  } else if (EMsg.SESSION === o.msg) {
    applySession(o.session);
  }
});

__development__ && console.debug('api-monitor-cs-main.ts', performance.now());
