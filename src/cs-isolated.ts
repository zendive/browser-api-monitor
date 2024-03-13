import {
  runtimePost,
  windowPost,
  windowListen,
  portListen,
} from './api/communication';

portListen(windowPost);
windowListen(runtimePost);

runtimePost({ msg: 'content-script-loaded' });
