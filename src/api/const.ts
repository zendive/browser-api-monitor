export const APPLICATION_NAME = 'ApiMonitor';
export const IS_DEV = __development__;
export const ERRORS_IGNORED = [
  'Could not establish connection. Receiving end does not exist.',
  'The message port closed before a response was received.',
];
export const UI_UPDATE_FREQUENCY = 16; // ms
// store native functions
export const setTimeout = window.setTimeout.bind(window);
export const clearTimeout = window.clearTimeout.bind(window);
export const setInterval = window.setInterval.bind(window);
export const clearInterval = window.clearInterval.bind(window);

export const MEDIA_ELEMENT_EVENTS = [
  'loadstart',
  'progress',
  'suspend',
  'abort',
  'error',
  'emptied',
  'stalled',
  'loadedmetadata',
  'loadeddata',
  'canplay',
  'canplaythrough',
  'playing',
  'waiting',
  'seeking',
  'seeked',
  'ended',
  'durationchange',
  'timeupdate',
  'play',
  'pause',
  'ratechange',
  'resize',
  'volumechange',
  'enterpictureinpicture',
  'leavepictureinpicture',
  'click',
  'contextmenu',
].sort();
export const MEDIA_ELEMENT_PROPS = [
  'src',
  'srcObject',
  'error',
  'preload',
  'networkState',
  'readyState',
  'duration',
  'currentTime',
  'played',
  'seekable',
  'buffered',
  'seeking',
  'paused',
  'ended',
  'autoplay',
  'loop',
  'muted',
  'volume',
  'defaultMuted',
  'crossOrigin',
  'defaultPlaybackRate',
  'playbackRate',
  'mediaGroup',
  'controller',
  'controls',
  'audioTracks',
  'videoTracks',
  'textTracks',
  'disablePictureInPicture',
  'width',
  'height',
  'videoWidth',
  'videoHeight',
  'poster',
];

export const TRACE_ERROR_MESSAGE = 'browser-api-monitor';
export const REGEX_STACKTRACE_PREFIX = /^.*at /;
export const REGEX_STACKTRACE_NAME = /^(.+)\(.*/;
export const REGEX_STACKTRACE_LINK = /.*\((.*)\).*/;
export const REGEX_STACKTRACE_CLEAN_URL = /(.*):\d+:\d+$/;
export const REGEX_STACKTRACE_LINE_NUMBER = /.*:(\d+):\d+$/;
export const REGEX_STACKTRACE_COLUMN_NUMBER = /.*:\d+:(\d+)$/;
