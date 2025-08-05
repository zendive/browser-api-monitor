import { EMsg, portPost } from './api/communication.ts';
import {
  loadLocalStorage,
  saveLocalStorage,
} from './api/storage/storage.local.ts';
import { enableSessionInContentScript } from './api/storage/storage.session.ts';
import { onHidePanel } from './devtoolsPanelUtil.ts';

// tabId may be null if user opened the devtools of the devtools
if (chrome.devtools.inspectedWindow.tabId !== null) {
  chrome.devtools.panels.create(
    'API 🔎',
    '/public/img/panel-icon28.png',
    '/public/api-monitor-devtools-panel.html',
    (panel) => {
      panel.onShown.addListener(async () => {
        const config = await loadLocalStorage();
        if (!config.paused) {
          portPost({ msg: EMsg.START_OBSERVE });
        }
        if (config.keepAwake) {
          chrome.power?.requestKeepAwake('display');
        }
        await saveLocalStorage({ devtoolsPanelShown: true });
      });

      panel.onHidden.addListener(onHidePanel);
    },
  );

  enableSessionInContentScript();
}
