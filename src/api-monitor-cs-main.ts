import { EMsg, windowListen, windowPost } from './api/communication.ts';
import { IS_DEV } from './api/env.ts';
import { TELEMETRY_FREQUENCY_1PS } from './api/const.ts';
import { adjustTelemetryDelay, Timer } from './api/time.ts';
import {
  onEachSecond,
  setSettings,
  cleanHistory,
  collectMetrics,
  runMediaCommand,
  runTimerCommand,
} from './wrapper/Wrapper.ts';

const eachSecond = new Timer({ delay: 1e3, repetitive: true }, onEachSecond);
const tick = new Timer(
  { delay: TELEMETRY_FREQUENCY_1PS, repetitive: true },
  function apiMonitorTelemetryTick() {
    const now = Date.now();

    windowPost({
      msg: EMsg.TELEMETRY,
      timeOfCollection: now,
      telemetry: collectMetrics(),
    });
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
