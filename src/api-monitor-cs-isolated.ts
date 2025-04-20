import {
  EMsg,
  portListen,
  runtimePost,
  windowListen,
  windowPost,
} from './api/communication.ts';
import { getSettings, onSettingsChange } from './api/settings.ts';
import { getSession, onSessionChange } from './api/session.ts';

Promise.all([getSettings(), getSession()]).then(([settings, session]) => {
  windowPost({ msg: EMsg.SETTINGS, settings });
  windowPost({ msg: EMsg.SESSION, session });

  portListen(windowPost);
  windowListen(runtimePost);

  onSettingsChange((newValue) => {
    windowPost({ msg: EMsg.SETTINGS, settings: newValue });
  });
  onSessionChange((newValue) => {
    windowPost({ msg: EMsg.SESSION, session: newValue });
  });

  runtimePost({ msg: EMsg.CONTENT_SCRIPT_LOADED });

  __development__ && console.log('api-monitor-cs-isolated.ts', performance.now());
});
