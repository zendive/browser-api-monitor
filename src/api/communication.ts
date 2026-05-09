/**
 * cs-isolated establishes BroadcastChannel id
 * and communicates it to cs-main via postWindow once,
 * after confirmation, further communication between them
 * is done via channel API only.
 *
 * Devtools communicates to cs-isolated with postPort (one way).
 *
 * Panel listens with listenRuntime and sends messages
 * to cs-isolated with postPort.
 *
 * cs-isolated listens to enything sent by postPort with
 * listenPort, and relays it to cs-main with postChannel,
 * if needed.
 *
 * cs-isolated listens to cs-main with listenChannel and
 * relays it to panel via runtimePost.
 *
 * In __mirror__ mode, postWindow and listenWindow are used
 * as a backup for a missing runtime API.
 */

import { APPLICATION_NAME } from './env.ts';
import { ERRORS_IGNORED } from './const.ts';
import { ETimerType } from '../wrapper/TimerWrapper.ts';
import type { ITelemetry } from '../wrapper/Wrapper.ts';
import type { TConfig } from './storage/storage.local.ts';
import type { TMediaCommand } from '../wrapper/MediaWrapper.ts';
import type { Delta } from 'jsondiffpatch';
import type { TSession } from './storage/storage.session.ts';

let port: chrome.runtime.Port | null = null;

export function postPort(payload: TMsgOptions) {
  if (__mirror__) {
    postWindow(payload);
    return;
  }

  if (!port) {
    port = chrome.tabs.connect(chrome.devtools.inspectedWindow.tabId, {
      name: APPLICATION_NAME,
    });
    port?.onDisconnect.addListener(() => void (port = null));
  }

  port?.postMessage(payload);
}

export function listenPort(callback: (payload: TMsgOptions) => void) {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === APPLICATION_NAME) {
      port.onMessage.addListener(callback);
    }
  });
}

export function postWindow(payload: TMsgOptions) {
  globalThis.postMessage({
    application: APPLICATION_NAME,
    payload,
  }, '*');
}

export function listenWindow(callback: (payload: TMsgOptions) => void) {
  globalThis.addEventListener('message', (e: MessageEvent) => {
    if (
      e.source === window &&
      e.data && typeof (e.data) === 'object' &&
      e.data.application === APPLICATION_NAME &&
      e.data.payload && typeof (e.data.payload) === 'object'
    ) {
      callback(e.data.payload);
    }
  });
}

export function listenWindowOnce(callback: (payload: TMsgOptions) => boolean) {
  globalThis.addEventListener('message', function listener(e: MessageEvent) {
    if (
      e.source === window &&
      e.data && typeof (e.data) === 'object' &&
      e.data.application === APPLICATION_NAME &&
      e.data.payload && typeof (e.data.payload) === 'object'
    ) {
      if (callback(e.data.payload)) {
        globalThis.removeEventListener('message', listener);
      }
    }
  });
}

export function postRuntime(payload: TMsgOptions) {
  chrome.runtime.sendMessage(payload, handleRuntimeMessageResponse);
}

export function listenRuntime(callback: (payload: TMsgOptions) => void) {
  if (__mirror__) {
    listenWindow(callback);
  } else {
    chrome.runtime.onMessage.addListener(
      (payload, sender: chrome.runtime.MessageSender, sendResponse) => {
        if (
          sender.tab?.id === chrome.devtools.inspectedWindow.tabId
        ) {
          callback(payload);
          sendResponse();
        }
      },
    );
  }
}

function handleRuntimeMessageResponse(): void {
  const error = chrome.runtime.lastError;

  if (
    error &&
    typeof error.message === 'string' &&
    !ERRORS_IGNORED.includes(error.message)
  ) {
    console.error(error.message);
  }
}

export function provideChannelApi() {
  const { promise, resolve } = Promise.withResolvers<IChannelApi>();
  const channelId = crypto.randomUUID();
  const channel = new BroadcastChannel(channelId);

  listenWindowOnce((e) => {
    if (e.msg === EMsg.TUNE_CHANNEL_CONFIRMED) {
      resolve({
        listenChannel(callback: (e: TMsgOptions) => void) {
          channel.onmessage = (e: MessageEvent<TMsgOptions>) => {
            callback(e.data);
          };
        },
        postChannel(e: TMsgOptions) {
          channel.postMessage(e);
        },
      });

      return true;
    }

    return false;
  });

  postWindow({ msg: EMsg.TUNE_CHANNEL, id: channelId });

  return promise;
}

export function awaitChannelApi() {
  const { promise, resolve } = Promise.withResolvers<IChannelApi>();

  listenWindowOnce((e) => {
    if (e.msg === EMsg.TUNE_CHANNEL && e.id && typeof (e.id) === 'string') {
      const channel = new BroadcastChannel(e.id);

      resolve({
        listenChannel(callback: (e: TMsgOptions) => void) {
          channel.onmessage = (e: MessageEvent<TMsgOptions>) => {
            callback(e.data);
          };
        },
        postChannel(e: TMsgOptions) {
          channel.postMessage(e);
        },
      });

      postWindow({ msg: EMsg.TUNE_CHANNEL_CONFIRMED });

      return true; // stop listen
    }

    return false;
  });

  return promise;
}

interface IChannelApi {
  listenChannel: (callback: (e: TMsgOptions) => void) => void;
  postChannel: (e: TMsgOptions) => void;
}

export enum EMsg {
  CONFIG,
  CONTENT_SCRIPT_LOADED,
  START_OBSERVE,
  STOP_OBSERVE,
  TELEMETRY,
  TELEMETRY_DELTA,
  TELEMETRY_ACKNOWLEDGED,
  MEDIA_COMMAND,
  TIMER_COMMAND,
  SESSION,
  CONFIRM_INJECTION,
  INJECTION_CONFIRMED,
  TUNE_CHANNEL,
  TUNE_CHANNEL_CONFIRMED,
}

interface IMsgStartObserve {
  msg: EMsg.START_OBSERVE;
}
interface IMsgStopObserve {
  msg: EMsg.STOP_OBSERVE;
}
interface IMsgTimerCommand {
  msg: EMsg.TIMER_COMMAND;
  type: ETimerType;
  handler: number;
}
interface IMsgLoaded {
  msg: EMsg.CONTENT_SCRIPT_LOADED;
}
interface IMsgTelemetry {
  msg: EMsg.TELEMETRY;
  timeOfCollection: number;
  telemetry: ITelemetry;
}
interface IMsgTelemetryDelta {
  msg: EMsg.TELEMETRY_DELTA;
  timeOfCollection: number;
  telemetryDelta: Delta;
}
interface IMsgTelemetryAcknowledged {
  msg: EMsg.TELEMETRY_ACKNOWLEDGED;
  timeOfCollection: number;
  startAfresh: boolean;
}
interface IMsgConfig {
  msg: EMsg.CONFIG;
  config: TConfig;
}
interface IMsgMediaCommand {
  msg: EMsg.MEDIA_COMMAND;
  mediaId: string;
  cmd: TMediaCommand;
  field?: keyof HTMLMediaElement;
}
interface IMsgSession {
  msg: EMsg.SESSION;
  session: TSession;
}
interface IMsgConfirmInjection {
  msg: EMsg.CONFIRM_INJECTION;
}
interface IMsgInjectionConfirmed {
  msg: EMsg.INJECTION_CONFIRMED;
}
interface IMsgTuneChannel {
  msg: EMsg.TUNE_CHANNEL;
  id: string;
}
interface IMsgTuneChannelConfirmed {
  msg: EMsg.TUNE_CHANNEL_CONFIRMED;
}

export type TMsgOptions =
  | IMsgTelemetry
  | IMsgTelemetryDelta
  | IMsgTelemetryAcknowledged
  | IMsgStartObserve
  | IMsgStopObserve
  | IMsgLoaded
  | IMsgTimerCommand
  | IMsgConfig
  | IMsgMediaCommand
  | IMsgSession
  | IMsgConfirmInjection
  | IMsgInjectionConfirmed
  | IMsgTuneChannel
  | IMsgTuneChannelConfirmed;
