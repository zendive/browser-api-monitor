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

import { TMetrics } from '@/cs-main';
import { APPLICATION_NAME, ERRORS_IGNORED } from './const';
import type { ETimeType } from './wrappers';

export function portPost(payload: TMsgOptions) {
  const port = chrome.tabs.connect(chrome.devtools.inspectedWindow.tabId, {
    name: APPLICATION_NAME,
  });

  port.postMessage(payload);
}

export function portListen(callback: (payload: TMsgOptions) => void) {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === APPLICATION_NAME) {
      port.onMessage.addListener((e) => {
        callback(e);
      });
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

export interface TMsgStartObserve {
  msg: 'start-observe';
}
export interface TMsgStopObserve {
  msg: 'stop-observe';
}
export interface TMsgResetHistory {
  msg: 'reset-wrapper-history';
}
export interface TMsgClearHandler {
  msg: 'clear-timer-handler';
  type: ETimeType;
  handler: number;
}
export interface TMsgLoaded {
  msg: 'content-script-loaded';
}
export interface TMsgTelemetry {
  msg: 'telemetry';
  metrics: TMetrics;
}
export type TMsgOptions =
  | TMsgTelemetry
  | TMsgStartObserve
  | TMsgStopObserve
  | TMsgLoaded
  | TMsgResetHistory
  | TMsgClearHandler;
