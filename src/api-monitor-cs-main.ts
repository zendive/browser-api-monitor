import { awaitChannelApi, EMsg } from './api/communication.ts';
import { TELEMETRY_FREQUENCY_1PS } from './api/const.ts';
import { adjustTelemetryDelay, ETimer, Timer } from './api/time.ts';
import {
  applyConfig,
  applySession,
  collectMetrics,
  type ITelemetry,
  onEachSecond,
  runMediaCommand,
  runTimerCommand,
} from './wrapper/Wrapper.ts';
import diff from './api/diff.ts';

awaitChannelApi().then(({ listenChannel, postChannel }) => {
  let originalMetrics: ITelemetry | null;
  let currentMetrics: ITelemetry | null;
  let startAfresh = true;
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
      return void postChannel({
        msg: EMsg.TELEMETRY,
        timeOfCollection: now,
        telemetry: originalMetrics,
      });
    }

    const delta = diff.diff(originalMetrics, currentMetrics);
    if (delta) {
      return void postChannel({
        msg: EMsg.TELEMETRY_DELTA,
        timeOfCollection: now,
        telemetryDelta: delta,
      });
    }

    tick.start();
  });
  const eachSecond = new Timer(
    { type: ETimer.TIMEOUT, timeout: 1e3 },
    function apiMonitorEachSecond() {
      eachSecond.start();
      onEachSecond();
    },
  );

  listenChannel((o) => {
    if (EMsg.TELEMETRY_ACKNOWLEDGED === o.msg) {
      startAfresh = o.startAfresh;
      tick.timeout = adjustTelemetryDelay(
        performance.now(),
        o.timeOfCollection,
      );
      originalMetrics = currentMetrics;
      const shouldRun = eachSecond.isPending() && !tick.isPending();
      shouldRun && tick.start();
    } else if (EMsg.CONFIG_SESSION === o.msg || EMsg.CONFIG === o.msg) {
      applyConfig(o.config);

      if (o.config.devtoolsPanelShown && !eachSecond.isPending()) {
        startAfresh = true;
        tick.trigger();
      }

      if (EMsg.CONFIG_SESSION === o.msg) {
        applySession(o.session);
      }
    } else if (EMsg.SESSION === o.msg) {
      applySession(o.session);
    } else if (EMsg.START_OBSERVE === o.msg) {
      eachSecond.trigger();
      startAfresh = true;
      !tick.isPending() && tick.trigger();
    } else if (EMsg.STOP_OBSERVE === o.msg) {
      tick.stop();
      eachSecond.stop();
    } else if (EMsg.TIMER_COMMAND === o.msg) {
      runTimerCommand(o.type, o.handler);
    } else if (EMsg.MEDIA_COMMAND === o.msg) {
      runMediaCommand(o);
    }
  });
});

__development__ && console.debug('api-monitor-cs-main.ts', performance.now());
