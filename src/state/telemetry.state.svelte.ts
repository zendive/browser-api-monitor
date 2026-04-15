import type { ITelemetry } from '../wrapper/Wrapper.ts';
import {
  EMsg,
  portPost,
  runtimeListen,
  windowListen,
  windowPost,
} from '../api/communication.ts';
import diff from '../api/diff.ts';

class TelemetryState {
  telemetry: ITelemetry | null = $state.raw(null);
  timeOfCollection: number = $state(0);
  telemetrySize: number = $state(0);
}
const state = new TelemetryState();
let telemetryProgressive: ITelemetry | null = null;

export function useTelemetryState() {
  return state;
}

export function establishTelemetryReceiver() {
  runtimeListen((o) => {
    if (o.msg === EMsg.TELEMETRY) {
      telemetryProgressive = structuredClone(o.telemetry);
      state.telemetry = o.telemetry;
      acknowledgeTelemetry(o.timeOfCollection);

      if (__development__) {
        state.telemetrySize = objectInJsonLength(o.telemetry);
      }
    } else if (o.msg === EMsg.TELEMETRY_DELTA) {
      try {
        diff.patch(telemetryProgressive, o.telemetryDelta);
        state.telemetry = structuredClone(telemetryProgressive);
        acknowledgeTelemetry(o.timeOfCollection);
      } catch (_) {
        // if patching fails - request full telemetry
        acknowledgeTelemetry(o.timeOfCollection, true);
      }

      if (__development__) {
        state.telemetrySize = objectInJsonLength(o.telemetryDelta);
      }
    }
  });
}

function acknowledgeTelemetry(
  timeOfCollection: number,
  startAfresh: boolean = false,
) {
  portPost({
    msg: EMsg.TELEMETRY_ACKNOWLEDGED,
    timeOfCollection,
    startAfresh,
  });

  state.timeOfCollection = timeOfCollection;
}

export function establishTelemetryReceiverMirror() {
  windowListen((o) => {
    if (o.msg === EMsg.TELEMETRY) {
      telemetryProgressive = structuredClone(o.telemetry);
      state.telemetry = o.telemetry;
      acknowledgeTelemetryMirror(o.timeOfCollection);

      if (__development__) {
        state.telemetrySize = objectInJsonLength(o.telemetry);
      }
    } else if (o.msg === EMsg.TELEMETRY_DELTA) {
      try {
        diff.patch(telemetryProgressive, o.telemetryDelta);
        state.telemetry = structuredClone(telemetryProgressive);
        acknowledgeTelemetryMirror(o.timeOfCollection);
      } catch (_) {
        acknowledgeTelemetryMirror(o.timeOfCollection, true);
      }

      if (__development__) {
        state.telemetrySize = objectInJsonLength(o.telemetryDelta);
      }
    }
  });
}

function acknowledgeTelemetryMirror(
  timeOfCollection: number,
  startAfresh: boolean = false,
) {
  windowPost({
    msg: EMsg.TELEMETRY_ACKNOWLEDGED,
    timeOfCollection,
    startAfresh,
  });

  state.timeOfCollection = timeOfCollection;
}

function objectInJsonLength(obj: unknown): number {
  return JSON.stringify(obj || {}).length;
}
