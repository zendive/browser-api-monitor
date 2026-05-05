import type { IEvalHistory } from '../../wrapper/EvalWrapper.ts';
import type { IPostTask, IYield } from '../../wrapper/SchedulerWrapper.ts';
import type {
  ICancelIdleCallbackHistory,
  IRequestIdleCallbackHistory,
} from '../../wrapper/IdleWrapper.ts';
import type {
  ICancelAnimationFrameHistory,
  IRequestAnimationFrameHistory,
} from '../../wrapper/AnimationWrapper.ts';
import type {
  IClearTimerHistory,
  ISetTimerHistory,
} from '../../wrapper/TimerWrapper.ts';
import type {
  IWorkerAelMetric,
  IWorkerConstructorMetric,
  IWorkerOnErrorMetric,
  IWorkerOnMessageMetric,
  IWorkerPostMessageMetric,
  IWorkerRelMetric,
  IWorkerTelemetryMetric,
  IWorkerTerminateMetric,
} from '../../wrapper/WorkerWrapper.ts';
import { CONFIG_VERSION, local } from './storage.ts';
import { EWrapperCallstackType } from '../../wrapper/shared/TraceUtil.ts';
import { ESortOrder } from '../const.ts';
import type {
  ISharedWorkerConstructorMetric,
  ISharedWorkerOnErrorMetric,
  ISharedWorkerTelemetryMetric,
} from '../../wrapper/SharedWorkerWrapper.ts';
import type { IMediaMetrics } from '../../wrapper/MediaWrapper.ts';

type TPanelKey =
  | 'callsSummary'
  | 'media'
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
  | 'cancelIdleCallback'
  | 'worker'
  | 'sharedWorker';

export interface IPanel {
  key: TPanelKey;
  label: string;
  visible: boolean;
  wrap?: boolean;
}
export type TPanelMap = {
  [K in TPanelKey]: IPanel;
};

export type TConfig = typeof DEFAULT_CONFIG;
export interface IConfigField extends Partial<TConfig> {}

export const DEFAULT_PANELS: IPanel[] = [
  { key: 'callsSummary', label: 'Summary Bar', visible: true },
  { key: 'media', label: 'Media', visible: true },
  { key: 'activeTimers', label: 'Active Timers', visible: false },
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
  { key: 'worker', label: 'Worker', visible: true, wrap: true },
  { key: 'sharedWorker', label: 'SharedWorker', visible: true, wrap: true },
];

export const DEFAULT_CONFIG = {
  panels: DEFAULT_PANELS,
  sortSharedWorkerPanel: {
    field: <keyof ISharedWorkerTelemetryMetric> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortSharedWorkerConstructor: {
    field: <keyof ISharedWorkerConstructorMetric> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortSharedWorkerOnError: {
    field: <keyof ISharedWorkerOnErrorMetric> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortWorkerPanel: {
    field: <keyof IWorkerTelemetryMetric> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortWorkerConstructor: {
    field: <keyof IWorkerConstructorMetric> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortWorkerTerminate: {
    field: <keyof IWorkerTerminateMetric> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortWorkerPostMessage: {
    field: <keyof IWorkerPostMessageMetric> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortWorkerOnMessage: {
    field: <keyof IWorkerOnMessageMetric> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortWorkerOnError: {
    field: <keyof IWorkerOnErrorMetric> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortWorkerAEL: {
    field: <keyof IWorkerAelMetric> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortWorkerREL: {
    field: <keyof IWorkerRelMetric> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortPostTask: {
    field: <keyof IPostTask> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortYield: {
    field: <keyof IYield> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortEval: {
    field: <keyof IEvalHistory> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortSetTimers: {
    field: <keyof ISetTimerHistory> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortClearTimers: {
    field: <keyof IClearTimerHistory> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortRequestAnimationFrame: {
    field: <keyof IRequestAnimationFrameHistory> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortCancelAnimationFrame: {
    field: <keyof ICancelAnimationFrameHistory> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortRequestIdleCallback: {
    field: <keyof IRequestIdleCallbackHistory> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortCancelIdleCallback: {
    field: <keyof ICancelIdleCallbackHistory> 'firstSeen',
    order: ESortOrder.DESCENDING,
  },
  sortVideoPanel: {
    field: <keyof IMediaMetrics> 'firstSeen',
    order: ESortOrder.ASCENDING,
  },
  sortAudioPanel: {
    field: <keyof IMediaMetrics> 'firstSeen',
    order: ESortOrder.ASCENDING,
  },
  paused: false,
  devtoolsPanelShown: false,
  wrapperCallstackType: EWrapperCallstackType.SHORT,
  keepAwake: false,
};
const DEFAULT_CONFIG_KEYS_LENGTH = Object.keys(DEFAULT_CONFIG).length;

export function panelsArray2Map(panels: IPanel[]) {
  return panels.reduce(
    (acc, o) => Object.assign(acc, { [o.key]: o }),
    {} as TPanelMap,
  );
}

export async function loadLocalStorage(): Promise<TConfig> {
  let store = await local.get([CONFIG_VERSION]);
  const isEmpty = !store || !store[CONFIG_VERSION] ||
    Object.keys(store[CONFIG_VERSION]).length !== DEFAULT_CONFIG_KEYS_LENGTH;

  if (isEmpty) {
    await local.clear(); // reset previous version
    store = { [CONFIG_VERSION]: DEFAULT_CONFIG };
    await local.set(store);
  }

  return <TConfig> store[CONFIG_VERSION];
}

/**
 * @NOTE: vulnerable to "time of check / time of use" bug (TOC/TOU)
 * @param value
 */
export async function saveLocalStorage(value: IConfigField) {
  const store = await loadLocalStorage();

  Object.assign(store, value);

  return await local.set({ [CONFIG_VERSION]: store });
}

export function onLocalStorageChange(
  callback: (newValue: TConfig, oldValue: TConfig | undefined) => void,
) {
  local.onChanged.addListener((change) => {
    const newValue = <TConfig | undefined> change?.[CONFIG_VERSION]?.newValue;
    const oldValue = <TConfig | undefined> change?.[CONFIG_VERSION]?.oldValue;

    if (
      !newValue || Object.keys(newValue).length !== DEFAULT_CONFIG_KEYS_LENGTH
    ) {
      return;
    }

    callback(newValue, oldValue);
  });
}
