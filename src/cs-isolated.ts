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
  EVENT_TELEMETRY,
  EVENT_CS_COMMAND,
} from './api/communication';

portListen(EVENT_PANEL_SHOWN, () => {
  windowPost(EVENT_OBSERVE_START);
});

portListen(EVENT_PANEL_HIDDEN, () => {
  windowPost(EVENT_OBSERVE_STOP);
});

portListen(EVENT_CS_COMMAND, (...args) => {
  windowPost(EVENT_CS_COMMAND, ...args);
});

windowListen(EVENT_TELEMETRY, (...args) => {
  runtimePost(EVENT_TELEMETRY, ...args);
});

runtimePost(EVENT_CONTENT_SCRIPT_LOADED);
