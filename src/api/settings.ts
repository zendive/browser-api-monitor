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

export type THistorySortField =
  (typeof HistorySortField)[keyof typeof HistorySortField];
export type TWrapperCallstackType =
  (typeof WrapperCallstackType)[keyof typeof WrapperCallstackType];
export type TSortOrder = (typeof ESortOrder)[keyof typeof ESortOrder];
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
export type TSettingsProperty = Partial<typeof DEFAULT_SETTINGS>;

const SETTINGS_VERSION = '1.0.7';
const DEFAULT_PANELS: TSettingsPanel[] = [
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

export const WrapperCallstackType = {
  FULL: 0,
  SHORT: 1,
} as const;

export const HistorySortField = {
  calls: 'calls',
  handler: 'handler',
  delay: 'delay',
} as const;

export const ESortOrder = {
  ASCENDING: 0,
  DESCENDING: 1,
} as const;

export const DEFAULT_SORT = {
  timersHistoryField: HistorySortField.delay as THistorySortField,
  timersHistoryOrder: ESortOrder.DESCENDING as TSortOrder,
};

export const DEFAULT_SETTINGS = {
  panels: DEFAULT_PANELS,
  sort: DEFAULT_SORT,
  paused: false,
  devtoolsPanelShown: false,
  traceForDebug: <string | null>null,
  wrapperCallstackType: <TWrapperCallstackType>WrapperCallstackType.FULL,
};

export function panelsArrayToVisibilityMap(panels: TSettingsPanel[]) {
  return panels.reduce(
    (acc, o) => Object.assign(acc, { [o.key]: o }),
    {} as TPanelVisibilityMap
  );
}

export async function getSettings(): Promise<typeof DEFAULT_SETTINGS> {
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
