import {
  EMsg,
  portListen,
  runtimePost,
  windowListen,
  windowPost,
} from './api/communication.ts';
import { getSettings, onSettingsChange } from './api/settings.ts';

getSettings().then((settings) => {
  windowPost({ msg: EMsg.SETTINGS, settings: settings });

  onSettingsChange((newValue) => {
    windowPost({ msg: EMsg.SETTINGS, settings: newValue });
  });
});

portListen(windowPost);
windowListen(runtimePost);

runtimePost({ msg: EMsg.CONTENT_SCRIPT_LOADED });
