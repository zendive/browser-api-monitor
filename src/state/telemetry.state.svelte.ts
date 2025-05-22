import type { TTelemetry } from '../wrapper/Wrapper.ts';
import {
  EMsg,
  portPost,
  runtimeListen,
  windowListen,
  windowPost,
} from '../api/communication.ts';
import diff from '../api/diff.ts';
import { type Writable, writable } from 'svelte/store';

class TelemetryState {
  telemetry: TTelemetry | null = $state.raw(null);
  timeOfCollection: Writable<number> = writable(0);
}
const state = new TelemetryState();
let telemetryProgressive: TTelemetry | null = null;

export function useTelemetryState() {
  return state;
}

export function establishTelemetryReceiver() {
  runtimeListen((o) => {
    if (o.msg === EMsg.TELEMETRY) {
      telemetryProgressive = structuredClone(o.telemetry);
      state.telemetry = o.telemetry;
      acknowledgeTelemetry(o.timeOfCollection);
    } else if (o.msg === EMsg.TELEMETRY_DELTA) {
      diff.patch(telemetryProgressive, o.telemetryDelta);
      state.telemetry = structuredClone(telemetryProgressive);
      acknowledgeTelemetry(o.timeOfCollection);
    }
  });
}

function acknowledgeTelemetry(timeOfCollection: number) {
  portPost({
    msg: EMsg.TELEMETRY_ACKNOWLEDGED,
    timeOfCollection,
  });

  state.timeOfCollection.set(timeOfCollection);
}

export function establishTelemetryReceiverMirror() {
  windowListen((o) => {
    if (o.msg === EMsg.TELEMETRY) {
      telemetryProgressive = structuredClone(o.telemetry);
      state.telemetry = o.telemetry;
      acknowledgeTelemetryMirror(o.timeOfCollection);
    } else if (o.msg === EMsg.TELEMETRY_DELTA) {
      diff.patch(telemetryProgressive, o.telemetryDelta);
      state.telemetry = structuredClone(telemetryProgressive);
      acknowledgeTelemetryMirror(o.timeOfCollection);
    }
  });
}

function acknowledgeTelemetryMirror(timeOfCollection: number) {
  windowPost({
    msg: EMsg.TELEMETRY_ACKNOWLEDGED,
    timeOfCollection,
  });

  state.timeOfCollection.set(timeOfCollection);
}
