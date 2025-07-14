import type { TWritableBooleanKeys } from './generics.ts';

export const ERRORS_IGNORED = [
  'Could not establish connection. Receiving end does not exist.',
  'The message port closed before a response was received.',
];
export const TELEMETRY_FREQUENCY_30PS = 33.3333333333; // ms
export const TELEMETRY_FREQUENCY_1PS = 1000; // ms
export const TIME_60FPS_SEC = 0.0166666666667; // s
export const TIME_60FPS_MS = 16.666666666666668;

// state native functions
export const setTimeout = /*@__PURE__*/ globalThis.setTimeout.bind(globalThis);
export const clearTimeout = /*@__PURE__*/ globalThis.clearTimeout.bind(
  globalThis,
);
export const setInterval = /*@__PURE__*/ globalThis.setInterval.bind(
  globalThis,
);
export const clearInterval = /*@__PURE__*/ globalThis.clearInterval.bind(
  globalThis,
);
export const requestAnimationFrame = /*@__PURE__*/ globalThis
  .requestAnimationFrame.bind(globalThis);
export const cancelAnimationFrame = /*@__PURE__*/ globalThis
  .cancelAnimationFrame.bind(globalThis);

export const TAG_DELAY_NOT_FOUND = '';
export const TAG_BAD_DELAY = (x: unknown) => `${x}`;
export const TAG_BAD_HANDLER = (x: unknown) => `${x}`;
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
  'waitingforkey',
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
  'mediaKeys',
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

type TToggableMediaProps = TWritableBooleanKeys<
  HTMLVideoElement & HTMLAudioElement
>;
export const MEDIA_ELEMENT_TOGGABLE_PROPS: Set<TToggableMediaProps> =
  /*@__PURE__*/ new Set([
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
