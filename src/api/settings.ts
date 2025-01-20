import type {
  TCancelAnimationFrameHistory,
  TCancelIdleCallbackHistory,
  TClearTimerHistory,
  TRequestAnimationFrameHistory,
  TRequestIdleCallbackHistory,
  TSetTimerHistory,
} from '../wrapper/main.ts';

type TPanelKey =
  | 'eval'
  | 'media'
  | 'activeTimers'
  | 'setTimeout'
  | 'clearTimeout'
  | 'setInterval'
  | 'clearInterval'
  | 'requestAnimationFrame'
  | 'cancelAnimationFrame'
  | 'requestIdleCallback'
  | 'cancelIdleCallback';

export type TPanelVisibilityMap = {
  [K in TPanelKey]: TSettingsPanel;
};
export type TSettingsPanel = {
  key: TPanelKey;
  label: string;
  visible: boolean;
  wrap: boolean | null;
};
export type TSettings = typeof DEFAULT_SETTINGS;
export type TSettingsProperty = Partial<TSettings>;

const SETTINGS_VERSION = '1.0.7';
export const DEFAULT_PANELS: TSettingsPanel[] = [
  { key: 'media', label: 'Media', visible: true, wrap: null },
  { key: 'activeTimers', label: 'Active Timers', visible: true, wrap: null },
  { key: 'eval', label: 'eval', visible: true, wrap: false },
  { key: 'setTimeout', label: 'setTimeout History', visible: true, wrap: true },
  {
    key: 'clearTimeout',
    label: 'clearTimeout History',
    visible: true,
    wrap: true,
  },
  {
    key: 'setInterval',
    label: 'setInterval History',
    visible: true,
    wrap: true,
  },
  {
    key: 'clearInterval',
    label: 'clearInterval History',
    visible: true,
    wrap: true,
  },
  {
    key: 'requestAnimationFrame',
    label: 'RAF History',
    visible: false,
    wrap: true,
  },
  {
    key: 'cancelAnimationFrame',
    label: 'CAF History',
    visible: false,
    wrap: true,
  },
  {
    key: 'requestIdleCallback',
    label: 'RIC History',
    visible: false,
    wrap: true,
  },
  {
    key: 'cancelIdleCallback',
    label: 'CIC History',
    visible: false,
    wrap: true,
  },
];

export enum EWrapperCallstackType {
  FULL,
  SHORT,
}
export enum ESortOrder {
  ASCENDING,
  DESCENDING,
}

export const DEFAULT_SORT_SET_TIMERS = {
  field: <keyof TSetTimerHistory>'calls',
  order: <ESortOrder>ESortOrder.DESCENDING,
} as const;
export const DEFAULT_SORT_CLEAR_TIMERS = {
  field: <keyof TClearTimerHistory>'calls',
  order: <ESortOrder>ESortOrder.DESCENDING,
} as const;
export const DEFAULT_SORT_RAF = {
  field: <keyof TRequestAnimationFrameHistory>'calls',
  order: <ESortOrder>ESortOrder.DESCENDING,
} as const;
export const DEFAULT_SORT_CAF = {
  field: <keyof TCancelAnimationFrameHistory>'calls',
  order: <ESortOrder>ESortOrder.DESCENDING,
} as const;
export const DEFAULT_SORT_RIC = {
  field: <keyof TRequestIdleCallbackHistory>'calls',
  order: <ESortOrder>ESortOrder.DESCENDING,
} as const;
export const DEFAULT_SORT_CIC = {
  field: <keyof TCancelIdleCallbackHistory>'calls',
  order: <ESortOrder>ESortOrder.DESCENDING,
} as const;

export const DEFAULT_SETTINGS = {
  panels: DEFAULT_PANELS,
  sortSetTimers: DEFAULT_SORT_SET_TIMERS,
  sortClearTimers: DEFAULT_SORT_CLEAR_TIMERS,
  sortRequestAnimationFrame: DEFAULT_SORT_RAF,
  sortCancelAnimationFrame: DEFAULT_SORT_CAF,
  sortRequestIdleCallback: DEFAULT_SORT_RIC,
  sortCancelIdleCallback: DEFAULT_SORT_CIC,
  paused: false,
  devtoolsPanelShown: false,
  traceForDebug: <string | null>null,
  traceForBypass: <string | null>null,
  wrapperCallstackType: EWrapperCallstackType.SHORT,
};

export function panelsArray2Map(panels: TSettingsPanel[]) {
  return panels.reduce(
    (acc, o) => Object.assign(acc, { [o.key]: o }),
    {} as TPanelVisibilityMap
  );
}

export async function getSettings(): Promise<TSettings> {
  let store = await chrome.storage.local.get([SETTINGS_VERSION]);
  const isEmpty = !Object.keys(store).length;

  if (isEmpty) {
    await chrome.storage.local.clear(); // rid off previous version settings
    await chrome.storage.local.set({ [SETTINGS_VERSION]: DEFAULT_SETTINGS });
    store = await chrome.storage.local.get([SETTINGS_VERSION]);
  }

  return store[SETTINGS_VERSION];
}

export async function setSettings(value: TSettingsProperty) {
  let store = await chrome.storage.local.get([SETTINGS_VERSION]);

  Object.assign(store[SETTINGS_VERSION], value);

  return await chrome.storage.local.set(store);
}

export function onSettingsChange(
  callback: (newValue: TSettings, oldValue: TSettings) => void
) {
  chrome.storage.local.onChanged.addListener((change) => {
    if (
      change &&
      change[SETTINGS_VERSION] &&
      change[SETTINGS_VERSION].newValue
    ) {
      callback(
        change[SETTINGS_VERSION].newValue,
        change[SETTINGS_VERSION].oldValue
      );
    }
  });
}
