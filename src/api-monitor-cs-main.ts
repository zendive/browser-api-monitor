import { EMsg, windowListen, windowPost } from './api/communication.ts';
import { IS_DEV } from './api/env.ts';
import {
  TELEMETRY_FREQUENCY_1PS,
  TELEMETRY_FREQUENCY_30PS,
} from './api/const.ts';
import { Timer } from './api/time.ts';
import {
  wrapperOnEachSecond as onEachSecond,
  setSettings,
  cleanHistory,
  collectMetrics,
  runMediaCommand,
} from './wrapper/Wrapper.ts';
import { ETimerType } from './wrapper/TimerWrapper.ts';

const eachSecond = new Timer({ delay: 1e3, repetitive: true }, onEachSecond);
const tick = new Timer(
  { delay: TELEMETRY_FREQUENCY_1PS, repetitive: true },
  function apiMonitorTelemetryTick() {
    const now = Date.now();

    windowPost({
      msg: EMsg.TELEMETRY,
      collectingStartTime: now,
      telemetry: collectMetrics(),
    });
  }
);

windowListen((o) => {
  if (o.msg === EMsg.TELEMETRY_ACKNOWLEDGED) {
    // adaptive update-frequency
    const ackTrafficDuration = Date.now() - o.timeSent;
    const newDelay = (o.trafficDuration + ackTrafficDuration) * 3;
    tick.delay = Math.max(TELEMETRY_FREQUENCY_30PS, newDelay);
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
  } else if (o.msg === EMsg.CLEAR_TIMER_HANDLER) {
    if (o.type === ETimerType.TIMEOUT) {
      window.clearTimeout(o.handler);
    } else {
      window.clearInterval(o.handler);
    }
  } else if (o.msg === EMsg.MEDIA_COMMAND) {
    runMediaCommand(o.mediaId, o.cmd, o.property);
  }
});

IS_DEV && console.debug('cs-main.ts');
