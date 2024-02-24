import {
  EVENT_PANEL_HIDDEN,
  EVENT_PANEL_SHOWN,
  portPost,
} from './api/communication';

// tabId may be null if user opened the devtools of the devtools
if (chrome.devtools.inspectedWindow.tabId !== null) {
  chrome.devtools.panels.create(
    'API',
    '/public/img/panel-icon28.png',
    '/public/devtools.view.html',
    (panel) => {
      panel.onShown.addListener(() => {
        portPost(EVENT_PANEL_SHOWN);
      });
      panel.onHidden.addListener(() => {
        portPost(EVENT_PANEL_HIDDEN);
      });
    }
  );
}
