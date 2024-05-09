export const ERRORS_IGNORED = [
  'Could not establish connection. Receiving end does not exist.',
  'The message port closed before a response was received.',
];
export const UI_UPDATE_FREQUENCY_LOW = 200; // ms
export const UI_UPDATE_FREQUENCY_VERYLOW = 1000; // ms
// store native functions
export const setTimeout = window.setTimeout.bind(window);
export const clearTimeout = window.clearTimeout.bind(window);
export const setInterval = window.setInterval.bind(window);
export const clearInterval = window.clearInterval.bind(window);
// https://rollupjs.org/troubleshooting/#avoiding-eval
export const lessEval = window.eval.bind(window);
export const TAG_INVALID_CALLSTACK = 'N/A';

export const MEDIA_ELEMENT_EVENTS = [
  'abort',
  'canplay',
  'canplaythrough',
  'click',
  'contextmenu',
  'durationchange',
  'emptied',
  'encrypted',
  'ended',
  'enterpictureinpicture',
  'error',
  'leavepictureinpicture',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'pause',
  'play',
  'playing',
  'progress',
  'ratechange',
  'resize',
  'seeked',
  'seeking',
  'stalled',
  'suspend',
  'timeupdate',
  'volumechange',
  'waiting',
];

export const MEDIA_ELEMENT_PROPS = [
  'poster',
  'currentSrc',
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
  'defaultMuted',
  'muted',
  'volume',
  'crossOrigin',
  'defaultPlaybackRate',
  'playbackRate',
  'preservesPitch',
  'controls',
  'audioTracks',
  'videoTracks',
  'textTracks',
  'sinkId',
  'disablePictureInPicture',
  'width',
  'height',
  'videoWidth',
  'videoHeight',
];
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/networkState
export const NETWORK_STATE = [
  'NETWORK_EMPTY',
  'NETWORK_IDLE',
  'NETWORK_LOADING',
  'NETWORK_NO_SOURCE',
];
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState
export const READY_STATE = [
  'HAVE_NOTHING',
  'HAVE_METADATA',
  'HAVE_CURRENT_DATA',
  'HAVE_FUTURE_DATA',
  'HAVE_ENOUGH_DATA',
];

export const TRACE_ERROR_MESSAGE = 'browser-api-monitor';
export const REGEX_STACKTRACE_PREFIX = /^.*at /;
export const REGEX_STACKTRACE_NAME = /^(.+)\(.*/;
export const REGEX_STACKTRACE_LINK = /.*\((.*)\).*/;
export const REGEX_STACKTRACE_CLEAN_URL = /(.*):\d+:\d+$/;
export const REGEX_STACKTRACE_LINE_NUMBER = /.*:(\d+):\d+$/;
export const REGEX_STACKTRACE_COLUMN_NUMBER = /.*:\d+:(\d+)$/;
