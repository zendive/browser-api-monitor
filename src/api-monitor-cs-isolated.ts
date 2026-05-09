import {
  EMsg,
  listenPort,
  postRuntime,
  provideChannelApi,
} from './api/communication.ts';
import {
  loadLocalStorage,
  onLocalStorageChange,
} from './api/storage/storage.local.ts';
import {
  loadSessionStorage,
  onSessionStorageChange,
} from './api/storage/storage.session.ts';

Promise.all([
  loadLocalStorage(),
  loadSessionStorage(),
  provideChannelApi(),
]).then(
  ([config, session, { listenChannel, postChannel }]) => {
    postChannel({ msg: EMsg.CONFIG, config });
    postChannel({ msg: EMsg.SESSION, session });

    if (config.devtoolsPanelShown && !config.paused) {
      postChannel({ msg: EMsg.START_OBSERVE });
    }

    listenPort((o) => {
      if (o.msg === EMsg.CONFIRM_INJECTION) {
        postRuntime({ msg: EMsg.INJECTION_CONFIRMED });
      } else {
        postChannel(o);
      }
    });
    listenChannel(postRuntime);

    onLocalStorageChange((config) => {
      postChannel({ msg: EMsg.CONFIG, config });
    });
    onSessionStorageChange((session) => {
      postChannel({ msg: EMsg.SESSION, session });
    });

    postRuntime({ msg: EMsg.CONTENT_SCRIPT_LOADED });
  },
);

__development__ &&
  console.log('api-monitor-cs-isolated.ts', performance.now());
