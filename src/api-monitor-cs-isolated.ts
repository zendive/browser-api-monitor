import {
  EMsg,
  portListen,
  runtimePost,
  windowListen,
  windowPost,
} from './api/communication.ts';
import { loadLocalStorage, onLocalStorageChange } from './api/storage.local.ts';
import {
  loadSessionStorage,
  onSessionStorageChange,
} from './api/storage.session.ts';

Promise.all([loadLocalStorage(), loadSessionStorage()]).then(
  ([config, session]) => {
    windowPost({ msg: EMsg.CONFIG, config });
    windowPost({ msg: EMsg.SESSION, session });

    if (config.devtoolsPanelShown && !config.paused) {
      windowPost({ msg: EMsg.START_OBSERVE });
    }

    portListen(windowPost);
    windowListen(runtimePost);

    onLocalStorageChange((newValue) => {
      windowPost({ msg: EMsg.CONFIG, config: newValue });
    });
    onSessionStorageChange((newValue) => {
      windowPost({ msg: EMsg.SESSION, session: newValue });
    });

    runtimePost({ msg: EMsg.CONTENT_SCRIPT_LOADED });

    __development__ &&
      console.log('api-monitor-cs-isolated.ts', performance.now());
  },
);
