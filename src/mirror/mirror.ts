import { mount } from 'svelte';
import App from '../view/App.svelte';
import { initConfigState } from '../state/config.state.svelte.ts';
import { establishTelemetryReceiverMirror } from '../state/telemetry.state.svelte.ts';
import { EMsg, windowPost } from '../api/communication.ts';
import {
  loadLocalStorage,
  onLocalStorageChange,
} from '../api/storage/storage.local.ts';
import {
  loadSessionStorage,
  onSessionStorageChange,
} from '../api/storage/storage.session.ts';

initConfigState().then(() => {
  mount(App, { target: document.body });
  establishTelemetryReceiverMirror();

  Promise.all([loadLocalStorage(), loadSessionStorage()]).then(
    ([config, session]) => {
      windowPost({ msg: EMsg.CONFIG, config });
      windowPost({ msg: EMsg.SESSION, session });

      if (!config.paused) {
        windowPost({ msg: EMsg.START_OBSERVE });
      }

      onLocalStorageChange((config) => {
        windowPost({ msg: EMsg.CONFIG, config });
      });
      onSessionStorageChange((session) => {
        windowPost({ msg: EMsg.SESSION, session });
      });
    },
  );
});
