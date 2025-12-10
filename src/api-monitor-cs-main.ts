import { EMsg, windowListen, windowPost } from './api/communication.ts';
import { TELEMETRY_FREQUENCY_1PS } from './api/const.ts';
import { adjustTelemetryDelay, ETimer, Timer } from './api/time.ts';
import {
  applyConfig,
  applySession,
  collectMetrics,
  onEachSecond,
  runMediaCommand,
  runTimerCommand,
  type TTelemetry,
} from './wrapper/Wrapper.ts';
import diff from './api/diff.ts';

let originalMetrics: TTelemetry | null;
let currentMetrics: TTelemetry | null;
let startAfresh = true;
const eachSecond = new Timer(
  { type: ETimer.TIMEOUT, timeout: 1e3 },
  function apiMonitorEachSecond() {
    eachSecond.start();
    onEachSecond();
  },
);
const tick = new Timer({
  type: ETimer.TASK,
  priority: 'background',
  timeout: TELEMETRY_FREQUENCY_1PS,
}, function apiMonitorTelemetryTick() {
  const now = performance.now();
  currentMetrics = structuredClone(collectMetrics());

  if (startAfresh) {
    startAfresh = false;
    originalMetrics = null;
  }

  if (!originalMetrics) {
    originalMetrics = currentMetrics;
    return void windowPost({
      msg: EMsg.TELEMETRY,
      timeOfCollection: now,
      telemetry: originalMetrics,
    });
  }

  const delta = diff.diff(originalMetrics, currentMetrics);
  if (delta) {
    return void windowPost({
      msg: EMsg.TELEMETRY_DELTA,
      timeOfCollection: now,
      telemetryDelta: delta,
    });
  }

  tick.start();
});

windowListen((o) => {
  if (EMsg.TELEMETRY_ACKNOWLEDGED === o.msg) {
    tick.timeout = adjustTelemetryDelay(o.timeOfCollection);
    originalMetrics = currentMetrics;
    const shouldRun = eachSecond.isPending() && !tick.isPending();
    shouldRun && tick.start();
  } else if (EMsg.CONFIG === o.msg) {
    tick.stop();
    applyConfig(o.config);
    startAfresh = true;
    tick.start();
  } else if (EMsg.START_OBSERVE === o.msg) {
    !tick.isPending() && tick.start();
    eachSecond.start();
  } else if (EMsg.STOP_OBSERVE === o.msg) {
    tick.stop();
    eachSecond.stop();
  } else if (EMsg.TIMER_COMMAND === o.msg) {
    runTimerCommand(o.type, o.handler);
  } else if (EMsg.MEDIA_COMMAND === o.msg) {
    runMediaCommand(o.mediaId, o.cmd, o.property);
  } else if (EMsg.SESSION === o.msg) {
    applySession(o.session);
  }
});

__development__ && console.debug('api-monitor-cs-main.ts', performance.now());
