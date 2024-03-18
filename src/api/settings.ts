import { cloneObjectSafely } from './clone';
import { APPLICATION_VERSION } from './const';

export type TSettingsPanel = { name: string; visible: boolean };
export type TSettingsProperty = Partial<typeof DEFAULT_SETTINGS>;

export const panels: TSettingsPanel[] = [
  { name: 'eval', visible: true },
  { name: 'Active Timers', visible: true },
  { name: 'setTimeout History', visible: true },
  { name: 'clearTimeout History', visible: true },
  { name: 'setInterval History', visible: true },
  { name: 'clearInterval History', visible: true },
  { name: 'Media', visible: true },
];
const DEFAULT_SETTINGS = {
  visiblePanels: panels,
};

export async function getSettings(): Promise<typeof DEFAULT_SETTINGS> {
  const store = await chrome.storage.local.get([APPLICATION_VERSION]);
  const isEmpty = !Object.keys(store).length;

  if (isEmpty) {
    store[APPLICATION_VERSION] = cloneObjectSafely(DEFAULT_SETTINGS);
    await chrome.storage.local.clear(); // rid off previous version settings
    await chrome.storage.local.set(store);
  }

  return store[APPLICATION_VERSION];
}

export async function setSettings(value: TSettingsProperty) {
  let store = await chrome.storage.local.get([APPLICATION_VERSION]);

  store[APPLICATION_VERSION] = Object.assign(store[APPLICATION_VERSION], value);

  return await chrome.storage.local.set(store);
}

export function onSettingsChange(callback: () => void) {
  chrome.storage.local.onChanged.addListener(callback);
}
