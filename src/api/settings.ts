import { cloneObjectSafely } from './clone.ts';

type TPanelKey =
  | 'eval'
  | 'media'
  | 'activeTimers'
  | 'setTimeoutHistory'
  | 'clearTimeoutHistory'
  | 'setIntervalHistory'
  | 'clearIntervalHistory';

export enum ETimerHistoryField {
  traceId = 'traceId',
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

export type TSettingsProperty = Partial<typeof DEFAULT_SETTINGS>;

const SETTINGS_VERSION = '1.0.0';
const DEFAULT_PANELS: TSettingsPanel[] = [
  { key: 'eval', label: 'eval', visible: true },
  { key: 'activeTimers', label: 'Active Timers', visible: true },
  { key: 'setTimeoutHistory', label: 'setTimeout History', visible: true },
  { key: 'clearTimeoutHistory', label: 'clearTimeout History', visible: true },
  { key: 'setIntervalHistory', label: 'setInterval History', visible: true },
  {
    key: 'clearIntervalHistory',
    label: 'clearInterval History',
    visible: true,
  },
  { key: 'media', label: 'Media', visible: true },
];

export const DEFAULT_SORT = {
  timersHistoryField: ETimerHistoryField.handlerDelay,
  timersHistoryOrder: ESortOrder.DESCENDING,
};

export const DEFAULT_SETTINGS = {
  panels: DEFAULT_PANELS,
  sort: DEFAULT_SORT,
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
  callback: (change: chrome.storage.StorageChange) => void
) {
  chrome.storage.local.onChanged.addListener((change) => {
    callback(change[SETTINGS_VERSION]);
  });
}
