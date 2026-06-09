import { mount } from 'svelte';
import App from '../view/App.svelte';
import { initConfigState } from '../state/config.state.svelte.ts';
import { establishTelemetryReceiver } from '../state/telemetry.state.svelte.ts';
import {
  EMsg,
  listenWindow,
  postWindow,
  provideChannelApi,
} from '../api/communication.ts';
import {
  loadLocalStorage,
  onLocalStorageChange,
} from '../api/storage/storage.local.ts';
import {
  loadSessionStorage,
  onSessionStorageChange,
} from '../api/storage/storage.session.ts';

Promise.all([
  loadLocalStorage(),
  loadSessionStorage(),
  provideChannelApi(),
  initConfigState(),
]).then(
  ([config, session, { postChannel, listenChannel }]) => {
    mount(App, { target: document.body });
    establishTelemetryReceiver();

    listenWindow(postChannel);
    listenChannel(postWindow);

    postChannel({ msg: EMsg.CONFIG_SESSION, config, session });
    if (!config.paused) {
      postChannel({ msg: EMsg.START_OBSERVE });
    }

    onLocalStorageChange((config) => {
      postChannel({ msg: EMsg.CONFIG, config });
    });
    onSessionStorageChange((session) => {
      postChannel({ msg: EMsg.SESSION, session });
    });
  },
);
