import { cloneObjectSafely } from '@/api/clone.ts';

type TPanelKey =
  | 'eval'
  | 'media'
  | 'activeTimers'
  | 'setTimeoutHistory'
  | 'clearTimeoutHistory'
  | 'setIntervalHistory'
  | 'clearIntervalHistory'
  | 'requestAnimationFrame'
  | 'cancelAnimationFrame';

export enum ETimerHistoryField {
  individualInvocations = 'individualInvocations',
  recentHandler = 'recentHandler',
  handlerDelay = 'handlerDelay',
}

export enum ESortOrder {
  ASCENDING,
  DESCENDING,
}

export type TPanelVisibilityMap = {
  [K in TPanelKey]: boolean;
};

export type TSettingsPanel = {
  key: TPanelKey;
  label: string;
  visible: boolean;
};

export type TSettings = typeof DEFAULT_SETTINGS;
export type TSettingsProperty = Partial<typeof DEFAULT_SETTINGS>;

const SETTINGS_VERSION = '1.0.5';
const DEFAULT_PANELS: TSettingsPanel[] = [
  { key: 'eval', label: 'eval', visible: true },
  { key: 'media', label: 'Media', visible: true },
  { key: 'activeTimers', label: 'Active Timers', visible: true },
  { key: 'setTimeoutHistory', label: 'setTimeout History', visible: true },
  { key: 'clearTimeoutHistory', label: 'clearTimeout History', visible: true },
  { key: 'setIntervalHistory', label: 'setInterval History', visible: true },
  {
    key: 'clearIntervalHistory',
    label: 'clearInterval History',
    visible: true,
  },
  { key: 'requestAnimationFrame', label: 'RAF', visible: true },
  { key: 'cancelAnimationFrame', label: 'CAF', visible: true },
];

export const DEFAULT_SORT = {
  timersHistoryField: ETimerHistoryField.handlerDelay,
  timersHistoryOrder: ESortOrder.DESCENDING,
};

export const DEFAULT_SETTINGS = {
  panels: DEFAULT_PANELS,
  sort: DEFAULT_SORT,
  paused: false,
};

export function panelsArrayToVisibilityMap(panels: TSettingsPanel[]) {
  return panels.reduce(
    (acc, o) => Object.assign(acc, { [o.key]: o.visible }),
    {} as TPanelVisibilityMap
  );
}

export async function getSettings(): Promise<typeof DEFAULT_SETTINGS> {
  const store = await chrome.storage.local.get([SETTINGS_VERSION]);
  const isEmpty = !Object.keys(store).length;

  if (isEmpty) {
    store[SETTINGS_VERSION] = cloneObjectSafely(DEFAULT_SETTINGS);
    await chrome.storage.local.clear(); // rid off previous version settings
    await chrome.storage.local.set(store);
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
