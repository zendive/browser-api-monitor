import type { ITelemetry } from '../wrapper/Wrapper.ts';
import {
  EMsg,
  listenRuntime,
  listenWindow,
  postPort,
  postWindow,
  type TMsgOptions,
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
  if (__mirror__) {
    listenWindow(telemetryListener);
  } else {
    listenRuntime(telemetryListener);
  }
}

function telemetryListener(o: TMsgOptions) {
  if (o.msg === EMsg.TELEMETRY) {
    telemetryProgressive = structuredClone(o.telemetry);
    state.telemetry = o.telemetry;
    state.timeOfCollection = o.timeOfCollection;
    acknowledgeTelemetry(o.timeOfCollection);

    if (__feat_dev_stats__) {
      state.telemetrySize = objectInJsonLength(o.telemetry);
    }
  } else if (o.msg === EMsg.TELEMETRY_DELTA) {
    try {
      diff.patch(telemetryProgressive, o.telemetryDelta);
      state.telemetry = structuredClone(telemetryProgressive);
      state.timeOfCollection = o.timeOfCollection;
      acknowledgeTelemetry(o.timeOfCollection);
    } catch (e) {
      // if patching fails - request full telemetry
      acknowledgeTelemetry(o.timeOfCollection, true);
      console.error(e);
    }

    if (__feat_dev_stats__) {
      state.telemetrySize = objectInJsonLength(o.telemetryDelta);
    }
  }
}

function acknowledgeTelemetry(
  timeOfCollection: number,
  startAfresh: boolean = false,
) {
  if (__mirror__) {
    postWindow({
      msg: EMsg.TELEMETRY_ACKNOWLEDGED,
      timeOfCollection,
      startAfresh,
    });
  } else {
    postPort({
      msg: EMsg.TELEMETRY_ACKNOWLEDGED,
      timeOfCollection,
      startAfresh,
    });
  }
}

function objectInJsonLength(obj: unknown): number {
  return JSON.stringify(obj || {}).length;
}
