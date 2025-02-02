/**
 * Communication controlls for these scenarios:
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
import type { TSettings } from './settings.ts';
import type { TMediaCommand } from '../wrapper/MediaWrapper.ts';

let port: chrome.runtime.Port | null = null;
export function portPost(payload: TMsgOptions) {
  if (!port) {
    port = chrome.tabs.connect(chrome.devtools.inspectedWindow.tabId, {
      name: APPLICATION_NAME,
    });
    port.onDisconnect.addListener(() => void (port = null));
  }

  port.postMessage(payload);
}

export function portListen(callback: (payload: TMsgOptions) => void) {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === APPLICATION_NAME) {
      port.onMessage.addListener(callback);
    }
  });
}

export function windowPost(payload: TMsgOptions) {
  window.postMessage(
    {
      application: APPLICATION_NAME,
      payload,
    },
    '*'
  );
}

export function windowListen(callback: (payload: TMsgOptions) => void) {
  window.addEventListener('message', (e: MessageEvent) => {
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
  chrome.runtime.sendMessage(
    {
      application: APPLICATION_NAME,
      payload,
    },
    handleRuntimeMessageResponse
  );
}

export function runtimeListen(callback: (payload: TMsgOptions) => void) {
  chrome.runtime.onMessage.addListener(
    (e, sender: chrome.runtime.MessageSender, sendResponse) => {
      if (
        sender.tab?.id === chrome.devtools.inspectedWindow.tabId &&
        e.application === APPLICATION_NAME
      ) {
        callback(e.payload);
        sendResponse();
      }
    }
  );
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
  SETTINGS,
  CONTENT_SCRIPT_LOADED,
  START_OBSERVE,
  STOP_OBSERVE,
  TELEMETRY,
  TELEMETRY_ACKNOWLEDGED,
  MEDIA_COMMAND,
  RESET_WRAPPER_HISTORY,
  TIMER_COMMAND,
}

export interface TMsgStartObserve {
  msg: EMsg.START_OBSERVE;
}
export interface TMsgStopObserve {
  msg: EMsg.STOP_OBSERVE;
}
export interface TMsgResetHistory {
  msg: EMsg.RESET_WRAPPER_HISTORY;
}
export interface TMsgTimerCommand {
  msg: EMsg.TIMER_COMMAND;
  type: ETimerType;
  handler: number;
}
export interface TMsgLoaded {
  msg: EMsg.CONTENT_SCRIPT_LOADED;
}
export interface TMsgTelemetry {
  msg: EMsg.TELEMETRY;
  timeOfCollection: number;
  telemetry: TTelemetry;
}
export interface TMsgTelemetryAcknowledged {
  msg: EMsg.TELEMETRY_ACKNOWLEDGED;
  timeOfCollection: number;
}
export interface TMsgSettings {
  msg: EMsg.SETTINGS;
  settings: TSettings;
}
export interface TMsgMediaCommand {
  msg: EMsg.MEDIA_COMMAND;
  mediaId: string;
  cmd: TMediaCommand;
  property?: keyof HTMLMediaElement;
}
export type TMsgOptions =
  | TMsgTelemetry
  | TMsgTelemetryAcknowledged
  | TMsgStartObserve
  | TMsgStopObserve
  | TMsgLoaded
  | TMsgResetHistory
  | TMsgTimerCommand
  | TMsgSettings
  | TMsgMediaCommand;
