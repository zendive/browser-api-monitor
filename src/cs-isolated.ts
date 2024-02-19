import {
  runtimePost,
  windowPost,
  windowListen,
  EVENT_PANEL_SHOWN,
  EVENT_PANEL_HIDDEN,
  EVENT_OBSERVE_START,
  EVENT_OBSERVE_STOP,
  portListen,
} from './api/communication';

portListen(EVENT_PANEL_SHOWN, () => {
  windowPost(EVENT_OBSERVE_START);
});

portListen(EVENT_PANEL_HIDDEN, () => {
  windowPost(EVENT_OBSERVE_STOP);
});

portListen('from-panel', (...args) => {
  windowPost('from-panel', ...args);
});

windowListen('from-cs-main', (...args) => {
  runtimePost('from-cs-main', ...args);
});

console.log('cs-isolated');
