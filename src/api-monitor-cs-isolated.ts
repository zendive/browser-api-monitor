import {
  runtimePost,
  windowPost,
  windowListen,
  portListen,
} from './api/communication.ts';
import { getSettings, onSettingsChange } from './api/settings.ts';

getSettings().then((settings) => {
  windowPost({ msg: 'settings', settings: settings });

  onSettingsChange((newValue) => {
    windowPost({ msg: 'settings', settings: newValue });
  });
});

portListen(windowPost);
windowListen(runtimePost);

runtimePost({ msg: 'content-script-loaded' });
