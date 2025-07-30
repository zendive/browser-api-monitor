import type {
  TCancelIdleCallbackHistory,
  TRequestIdleCallbackHistory,
} from '../../wrapper/IdleWrapper.ts';
import type {
  TCancelAnimationFrameHistory,
  TRequestAnimationFrameHistory,
} from '../../wrapper/AnimationWrapper.ts';
import type {
  TClearTimerHistory,
  TSetTimerHistory,
} from '../../wrapper/TimerWrapper.ts';
import { CONFIG_VERSION, local } from './storage.ts';

type TPanelKey =
  | 'callsSummary'
  | 'media'
  | 'worker'
  | 'scheduler'
  | 'eval'
  | 'activeTimers'
  | 'setTimeout'
  | 'clearTimeout'
  | 'setInterval'
  | 'clearInterval'
  | 'requestAnimationFrame'
  | 'cancelAnimationFrame'
  | 'requestIdleCallback'
  | 'cancelIdleCallback';

export type TPanel = {
  key: TPanelKey;
  label: string;
  visible: boolean;
  wrap?: boolean;
};
export type TPanelMap = {
  [K in TPanelKey]: TPanel;
};

export type TConfig = typeof DEFAULT_CONFIG;
export type TConfigField = Partial<TConfig>;

export const DEFAULT_PANELS: TPanel[] = [
  { key: 'callsSummary', label: 'Summary Bar', visible: false },
  { key: 'media', label: 'Media', visible: true },
  { key: 'activeTimers', label: 'Active Timers', visible: true },
  { key: 'worker', label: 'Worker', visible: true, wrap: true },
  { key: 'scheduler', label: 'Scheduler', visible: true, wrap: true },
  { key: 'eval', label: 'eval', visible: true, wrap: false },
  { key: 'setTimeout', label: 'setTimeout', visible: true, wrap: true },
  {
    key: 'clearTimeout',
    label: 'clearTimeout',
    visible: true,
    wrap: true,
  },
  {
    key: 'setInterval',
    label: 'setInterval',
    visible: true,
    wrap: true,
  },
  {
    key: 'clearInterval',
    label: 'clearInterval',
    visible: true,
    wrap: true,
  },
  {
    key: 'requestAnimationFrame',
    label: 'requestAnimationFrame',
    visible: true,
    wrap: true,
  },
  {
    key: 'cancelAnimationFrame',
    label: 'cancelAnimationFrame',
    visible: true,
    wrap: true,
  },
  {
    key: 'requestIdleCallback',
    label: 'requestIdleCallback',
    visible: true,
    wrap: true,
  },
  {
    key: 'cancelIdleCallback',
    label: 'cancelIdleCallback',
    visible: true,
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
  field: <keyof TSetTimerHistory> 'calls',
  order: <ESortOrder> ESortOrder.DESCENDING,
};
export const DEFAULT_SORT_CLEAR_TIMERS = {
  field: <keyof TClearTimerHistory> 'calls',
  order: <ESortOrder> ESortOrder.DESCENDING,
};
export const DEFAULT_SORT_RAF = {
  field: <keyof TRequestAnimationFrameHistory> 'calls',
  order: <ESortOrder> ESortOrder.DESCENDING,
};
export const DEFAULT_SORT_CAF = {
  field: <keyof TCancelAnimationFrameHistory> 'calls',
  order: <ESortOrder> ESortOrder.DESCENDING,
};
export const DEFAULT_SORT_RIC = {
  field: <keyof TRequestIdleCallbackHistory> 'calls',
  order: <ESortOrder> ESortOrder.DESCENDING,
};
export const DEFAULT_SORT_CIC = {
  field: <keyof TCancelIdleCallbackHistory> 'calls',
  order: <ESortOrder> ESortOrder.DESCENDING,
};

export const DEFAULT_CONFIG = {
  panels: DEFAULT_PANELS,
  sortSetTimers: DEFAULT_SORT_SET_TIMERS,
  sortClearTimers: DEFAULT_SORT_CLEAR_TIMERS,
  sortRequestAnimationFrame: DEFAULT_SORT_RAF,
  sortCancelAnimationFrame: DEFAULT_SORT_CAF,
  sortRequestIdleCallback: DEFAULT_SORT_RIC,
  sortCancelIdleCallback: DEFAULT_SORT_CIC,
  paused: false,
  devtoolsPanelShown: false,
  wrapperCallstackType: EWrapperCallstackType.SHORT,
  keepAwake: false,
};

export function panelsArray2Map(panels: TPanel[]) {
  return panels.reduce(
    (acc, o) => Object.assign(acc, { [o.key]: o }),
    {} as TPanelMap,
  );
}

export async function loadLocalStorage(): Promise<TConfig> {
  let store = await local.get([CONFIG_VERSION]);
  const isEmpty = !store || !store[CONFIG_VERSION] ||
    !Object.keys(store[CONFIG_VERSION]).length;

  if (isEmpty) {
    await local.clear(); // reset previous version
    await local.set({ [CONFIG_VERSION]: DEFAULT_CONFIG });
    store = await local.get([CONFIG_VERSION]);
  }

  return store[CONFIG_VERSION];
}

export async function saveLocalStorage(value: TConfigField) {
  const store = await local.get([CONFIG_VERSION]);

  Object.assign(store[CONFIG_VERSION], value);

  return await local.set(store);
}

export function onLocalStorageChange(
  callback: (newValue: TConfig, oldValue: TConfig) => void,
) {
  local.onChanged.addListener((change: {
    [key: string]: chrome.storage.StorageChange;
  }) => {
    if (
      change &&
      change[CONFIG_VERSION] &&
      change[CONFIG_VERSION].newValue
    ) {
      callback(
        change[CONFIG_VERSION].newValue,
        change[CONFIG_VERSION].oldValue,
      );
    }
  });
}
