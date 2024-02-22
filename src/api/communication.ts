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

import {
  APPLICATION_NAME,
  ERROR_NO_CONNECTION,
  ERROR_PORT_CLOSED,
} from './const';

export function portPost(appEvent: string, payload?: any) {
  const port = chrome.tabs.connect(chrome.devtools.inspectedWindow.tabId, {
    name: APPLICATION_NAME,
  });

  // console.debug('portPost', appEvent);
  port.postMessage({ appEvent, payload });
}

export function portListen(appEvent: string, callback: (payload: any) => void) {
  // console.debug('portListen -> connected');
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === APPLICATION_NAME) {
      port.onMessage.addListener((e) => {
        if (e.appEvent === appEvent) {
          // console.debug('portListen', appEvent);
          callback(e.payload);
        }
      });
    }
  });
}

export function windowPost(appEvent: string, payload?: any) {
  // console.debug('windowPost', appEvent);
  window.postMessage(
    {
      application: APPLICATION_NAME,
      appEvent,
      payload,
    },
    '*'
  );
}

export function windowListen(
  appEvent: string,
  callback: (payload: any) => void
) {
  window.addEventListener('message', (e: MessageEvent) => {
    if (
      e.source === window &&
      typeof e.data === 'object' &&
      e.data !== null &&
      e.data.application === APPLICATION_NAME &&
      e.data.appEvent === appEvent
    ) {
      // console.debug('windowListen', e.data.appEvent);
      callback(e.data.payload);
    }
  });
}

export function runtimePost(appEvent: string, payload?: any) {
  // console.debug('runtimePost', appEvent);
  chrome.runtime.sendMessage(
    {
      application: APPLICATION_NAME,
      appEvent,
      payload,
    },
    handleRuntimeMessageResponse.bind(null, appEvent)
  );
}

export function runtimeListen(
  appEvent: string,
  callback: (payload: any) => void
) {
  chrome.runtime.onMessage.addListener(
    (e, sender: chrome.runtime.MessageSender, sendResponse) => {
      if (
        sender.tab?.id === chrome.devtools.inspectedWindow.tabId &&
        e.application === APPLICATION_NAME &&
        e.appEvent === appEvent
      ) {
        // console.debug('runtimeListen', e.appEvent);
        callback(e.payload);
        sendResponse();
      }
    }
  );
}

function handleRuntimeMessageResponse(appEvent: string): void {
  const error = chrome.runtime.lastError;

  if (
    error &&
    error.message !== ERROR_NO_CONNECTION &&
    error.message !== ERROR_PORT_CLOSED
  ) {
    console.error(appEvent, error.message);
  }

  /*DBG*/
  if (error) {
    // console.error(appEvent, error.message);
  }
}

export const EVENT_PANEL_SHOWN = 'EVENT_PANEL_SHOWN';
export const EVENT_PANEL_HIDDEN = 'EVENT_PANEL_HIDDEN';
export const EVENT_OBSERVE_START = 'EVENT_OBSERVE_START';
export const EVENT_OBSERVE_STOP = 'EVENT_OBSERVE_STOP';
export const EVENT_SETUP = 'EVENT_SETUP';
export const EVENT_METRICS = 'EVENT_METRICS';
export const EVENT_CONTENT_SCRIPT_LOADED = 'EVENT_CONTENT_SCRIPT_LOADED';
