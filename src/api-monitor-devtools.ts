import { portPost } from './api/communication.ts';
import { getSettings, setSettings } from './api/settings.ts';

// tabId may be null if user opened the devtools of the devtools
if (chrome.devtools.inspectedWindow.tabId !== null) {
  chrome.devtools.panels.create(
    'API 🔎',
    '/public/img/panel-icon28.png',
    '/public/api-monitor-devtools-panel.html',
    (panel) => {
      panel.onShown.addListener(async () => {
        const settings = await getSettings();
        if (!settings.paused) {
          portPost({ msg: 'start-observe' });
        }
        setSettings({ devtoolsPanelShown: true });
      });
      panel.onHidden.addListener(() => {
        portPost({ msg: 'stop-observe' });
        setSettings({ devtoolsPanelShown: false });
      });
    }
  );
}
