import {
  runtimePost,
  windowPost,
  windowListen,
  portListen,
  EVENT_PANEL_SHOWN,
  EVENT_PANEL_HIDDEN,
  EVENT_OBSERVE_START,
  EVENT_OBSERVE_STOP,
  EVENT_CONTENT_SCRIPT_LOADED,
  EVENT_METRICS,
  EVENT_SETUP,
} from './api/communication';

portListen(EVENT_PANEL_SHOWN, () => {
  windowPost(EVENT_OBSERVE_START);
});

portListen(EVENT_PANEL_HIDDEN, () => {
  windowPost(EVENT_OBSERVE_STOP);
});

portListen(EVENT_SETUP, (...args) => {
  windowPost(EVENT_SETUP, ...args);
});

windowListen(EVENT_METRICS, (...args) => {
  runtimePost(EVENT_METRICS, ...args);
});

runtimePost(EVENT_CONTENT_SCRIPT_LOADED);
