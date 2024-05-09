import {
  runtimePost,
  windowPost,
  windowListen,
  portListen,
} from '@/api/communication.ts';
import { getSettings, onSettingsChange } from '@/api/settings.ts';

portListen(windowPost);
windowListen(runtimePost);

runtimePost({ msg: 'content-script-loaded' });

getSettings().then((settings) => {
  windowPost({ msg: 'settings', settings: settings });

  onSettingsChange((newValue) => {
    windowPost({ msg: 'settings', settings: newValue });
  });
});
