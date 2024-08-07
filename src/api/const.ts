export const ERRORS_IGNORED = [
  'Could not establish connection. Receiving end does not exist.',
  'The message port closed before a response was received.',
];
export const TELEMETRY_FREQUENCY_30PS = 100 / 3; //MS
export const TELEMETRY_FREQUENCY_1PS = 1000; // ms
export const MAX_TRAFFIC_DURATION_BEFORE_AUTOPAUSE = 2e3; // ms
// store native functions
export const setTimeout = window.setTimeout.bind(window);
export const clearTimeout = window.clearTimeout.bind(window);
export const setInterval = window.setInterval.bind(window);
export const clearInterval = window.clearInterval.bind(window);
export const requestAnimationFrame = window.requestAnimationFrame.bind(window);
export const cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
export const requestIdleCallback = window.requestIdleCallback.bind(window);
export const cancelIdleCallback = window.cancelIdleCallback.bind(window);
// https://rollupjs.org/troubleshooting/#avoiding-eval
export const lessEval = window.eval.bind(window);

export const TAG_INVALID_CALLSTACK_LINK = '⟪N/A⟫';
export const TAG_EVAL_RETURN_SET_TIMEOUT = '(N/A - via setTimeout)';
export const TAG_EVAL_RETURN_SET_INTERVAL = '(N/A - via setInterval)';

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
  'playsInline',
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

export const MEDIA_ELEMENT_TOGGABLE_PROPS = new Set([
  'autoplay',
  'playsInline',
  'loop',
  'defaultMuted',
  'muted',
  'preservesPitch',
  'controls',
  'disablePictureInPicture',
]);

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
export const REGEX_STACKTRACE_SPLIT = new RegExp(/\n\s+at\s/);
export const REGEX_STACKTRACE_NAME = new RegExp(/^(.+)\(.*/);
export const REGEX_STACKTRACE_LINK = new RegExp(/.*\((async )?(.*)\)$/);
export const REGEX_STACKTRACE_CLEAN_URL = new RegExp(/(.*):\d+:\d+$/);
export const REGEX_STACKTRACE_LINE_NUMBER = new RegExp(/.*:(\d+):\d+$/);
export const REGEX_STACKTRACE_COLUMN_NUMBER = new RegExp(/.*:\d+:(\d+)$/);
export const REGEX_STACKTRACE_LINK_PROTOCOL = new RegExp(/http[s]?\:\/\//);
export const FRAME_1of60 = 1 / 60;
