import {
  EMsg,
  portListen,
  runtimePost,
  windowListen,
  windowPost,
} from './api/communication.ts';
import {
  loadLocalStorage,
  onLocalStorageChange,
} from './api/storage/storage.local.ts';
import {
  loadSessionStorage,
  onSessionStorageChange,
} from './api/storage/storage.session.ts';

Promise.all([loadLocalStorage(), loadSessionStorage()]).then(
  ([config, session]) => {
    windowPost({ msg: EMsg.CONFIG, config });
    windowPost({ msg: EMsg.SESSION, session });

    if (config.devtoolsPanelShown && !config.paused) {
      windowPost({ msg: EMsg.START_OBSERVE });
    }

    portListen((o) => {
      if (o.msg === EMsg.CONFIRM_INJECTION) {
        runtimePost({ msg: EMsg.INJECTION_CONFIRMED });
      } else {
        windowPost(o);
      }
    });
    windowListen(runtimePost);

    onLocalStorageChange((config) => {
      windowPost({ msg: EMsg.CONFIG, config });
    });
    onSessionStorageChange((session) => {
      windowPost({ msg: EMsg.SESSION, session });
    });

    runtimePost({ msg: EMsg.CONTENT_SCRIPT_LOADED });

    __development__ &&
      console.log('api-monitor-cs-isolated.ts', performance.now());
  },
);
