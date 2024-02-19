import {
  EVENT_OBSERVE_START,
  EVENT_OBSERVE_STOP,
  windowListen,
  windowPost,
} from './api/communication';

let tick = 0;
const apis = {
  setTimeout: { native: setTimeout },
  setInterval: { native: setInterval },
};
const tabIds: number[] = [];

function startObserve() {
  stopObserve();
  tick = setInterval(() => {
    const videosEl = document.querySelectorAll('video');
    windowPost('from-cs-main', {
      videosCount: videosEl.length,
      tabIds,
      timestamp: Date.now(),
    });
  }, 1e3);
}

function stopObserve() {
  clearInterval(tick);
}

windowListen(EVENT_OBSERVE_START, startObserve);
windowListen(EVENT_OBSERVE_STOP, stopObserve);

windowListen('from-panel', ({ tabId }) => {
  console.log('currentTab', tabId);
  if (!tabIds.includes(tabId)) {
    tabIds.push(tabId);
  }
});

console.log('cs-main.ts');
