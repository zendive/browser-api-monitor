import {
  runtimePost,
  windowPost,
  windowListen,
  portListen,
} from './api/communication';
import { getSettings, onSettingsChange } from '@/api/settings';

portListen(windowPost);
windowListen(runtimePost);

runtimePost({ msg: 'content-script-loaded' });

getSettings().then((settings) => {
  windowPost({ msg: 'settings', settings: settings });

  onSettingsChange((change) => {
    windowPost({ msg: 'settings', settings: change.newValue });
  });
});
