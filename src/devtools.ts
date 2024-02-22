import {
  EVENT_CONTENT_SCRIPT_LOADED,
  EVENT_PANEL_HIDDEN,
  EVENT_PANEL_SHOWN,
  portPost,
  runtimeListen,
  runtimePost,
} from './api/communication';

// tabId may be null if user opened the devtools of the devtools
if (chrome.devtools.inspectedWindow.tabId !== null) {
  chrome.devtools.panels.create(
    'SpyApi',
    '/public/img/panel-icon28.png',
    '/public/devtools.view.html',
    (panel) => {
      panel.onShown.addListener(() => {
        portPost(EVENT_PANEL_SHOWN);
        // runtimePost(EVENT_PANEL_SHOWN);
      });
      panel.onHidden.addListener(() => {
        portPost(EVENT_PANEL_HIDDEN);
        // runtimePost(EVENT_PANEL_HIDDEN);
      });
    }
  );
}

runtimeListen(EVENT_CONTENT_SCRIPT_LOADED, () => {
  portPost(EVENT_PANEL_SHOWN);
});
