/**
 * Communication controls for these scenarios:
 * - between main and isolated content scripts (bi direction):
 *      windowListen/windowPost
 * - devtools/panel to isolated content script (one direction):
 *      devtools/panel: portPost
 *      isolated content script: portListen
 * - isolated content script to panel (one direction):
 *      content script: runtimePost
 *      panel: runtimeListen
 */

import { APPLICATION_NAME } from './env.ts';
import { ERRORS_IGNORED } from './const.ts';
import { ETimerType } from '../wrapper/TimerWrapper.ts';
import type { TTelemetry } from '../wrapper/Wrapper.ts';
import type { TConfig } from './storage/storage.local.ts';
import type { TMediaCommand } from '../wrapper/MediaWrapper.ts';
import type { Delta } from 'jsondiffpatch';
import type { TSession } from './storage/storage.session.ts';

let port: chrome.runtime.Port | null = null;
export function portPost(payload: TMsgOptions) {
  if (!chrome.runtime) {
    windowPost(payload);
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

export function portListen(callback: (payload: TMsgOptions) => void) {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === APPLICATION_NAME) {
      port.onMessage.addListener(callback);
    }
  });
}

export function windowPost(payload: TMsgOptions) {
  globalThis.postMessage(
    {
      application: APPLICATION_NAME,
      payload,
    },
    '*',
  );
}

export function windowListen(callback: (payload: TMsgOptions) => void) {
  globalThis.addEventListener('message', (e: MessageEvent) => {
    if (
      e.source === window &&
      typeof e.data === 'object' &&
      e.data !== null &&
      e.data.application === APPLICATION_NAME
    ) {
      callback(e.data.payload);
    }
  });
}

export function runtimePost(payload: TMsgOptions) {
  chrome.runtime.sendMessage(payload, handleRuntimeMessageResponse);
}

export function runtimeListen(callback: (payload: TMsgOptions) => void) {
  if (chrome?.runtime) {
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
  } else {
    windowListen(callback);
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

export enum EMsg {
  CONFIG,
  CONTENT_SCRIPT_LOADED,
  START_OBSERVE,
  STOP_OBSERVE,
  TELEMETRY,
  TELEMETRY_DELTA,
  TELEMETRY_ACKNOWLEDGED,
  MEDIA_COMMAND,
  RESET_WRAPPER_HISTORY,
  TIMER_COMMAND,
  SESSION,
}

export interface IMsgStartObserve {
  msg: EMsg.START_OBSERVE;
}
export interface IMsgStopObserve {
  msg: EMsg.STOP_OBSERVE;
}
export interface IMsgResetHistory {
  msg: EMsg.RESET_WRAPPER_HISTORY;
}
export interface IMsgTimerCommand {
  msg: EMsg.TIMER_COMMAND;
  type: ETimerType;
  handler: number;
}
export interface IMsgLoaded {
  msg: EMsg.CONTENT_SCRIPT_LOADED;
}
export interface IMsgTelemetry {
  msg: EMsg.TELEMETRY;
  timeOfCollection: number;
  telemetry: TTelemetry;
}
export interface IMsgTelemetryDelta {
  msg: EMsg.TELEMETRY_DELTA;
  timeOfCollection: number;
  telemetryDelta: Delta;
}
export interface IMsgTelemetryAcknowledged {
  msg: EMsg.TELEMETRY_ACKNOWLEDGED;
  timeOfCollection: number;
}
export interface IMsgConfig {
  msg: EMsg.CONFIG;
  config: TConfig;
}
export interface IMsgMediaCommand {
  msg: EMsg.MEDIA_COMMAND;
  mediaId: string;
  cmd: TMediaCommand;
  property?: keyof HTMLMediaElement;
}
export interface IMsgSession {
  msg: EMsg.SESSION;
  session: TSession;
}
export type TMsgOptions =
  | IMsgTelemetry
  | IMsgTelemetryDelta
  | IMsgTelemetryAcknowledged
  | IMsgStartObserve
  | IMsgStopObserve
  | IMsgLoaded
  | IMsgResetHistory
  | IMsgTimerCommand
  | IMsgConfig
  | IMsgMediaCommand
  | IMsgSession;
