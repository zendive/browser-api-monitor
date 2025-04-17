import {
  EMsg,
  portListen,
  runtimePost,
  windowListen,
  windowPost,
} from './api/communication.ts';
import { getSettings, onSettingsChange } from './api/settings.ts';
import { getSession, onSessionChange } from './api/session.ts';

getSettings().then((settings) => {
  windowPost({ msg: EMsg.SETTINGS, settings });

  onSettingsChange((newValue) => {
    windowPost({ msg: EMsg.SETTINGS, settings: newValue });
  });
});

getSession().then((session) => {
  windowPost({ msg: EMsg.SESSION, session });

  onSessionChange((newValue) => {
    windowPost({ msg: EMsg.SESSION, session: newValue });
  });
});

portListen(windowPost);
windowListen(runtimePost);

runtimePost({ msg: EMsg.CONTENT_SCRIPT_LOADED });

__development__ && console.log('api-monitor-cs-isolated.ts');
