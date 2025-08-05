import { EMsg, portPost } from '../api/communication.ts';
import {
  DEFAULT_CONFIG,
  loadLocalStorage,
  saveLocalStorage,
  type TConfig,
} from '../api/storage/storage.local.ts';
import { EWrapperCallstackType } from '../wrapper/shared/TraceUtil.ts';

let config: TConfig = $state(DEFAULT_CONFIG);

export function useConfigState() {
  return config;
}

export async function initConfigState() {
  config = await loadLocalStorage();
}

export async function togglePause() {
  config.paused = !config.paused;
  await saveLocalStorage({ paused: $state.snapshot(config.paused) });

  if (config.paused) {
    portPost({ msg: EMsg.STOP_OBSERVE });
  } else {
    portPost({ msg: EMsg.START_OBSERVE });
  }
}

export async function toggleKeepAwake() {
  config.keepAwake = !config.keepAwake;
  await saveLocalStorage({ keepAwake: $state.snapshot(config.keepAwake) });

  if (config.keepAwake) {
    chrome.power?.requestKeepAwake('display');
  } else {
    chrome.power?.releaseKeepAwake();
  }
}

export async function toggleWrapperCallstackType() {
  config.wrapperCallstackType =
    config.wrapperCallstackType === EWrapperCallstackType.FULL
      ? EWrapperCallstackType.SHORT
      : EWrapperCallstackType.FULL;

  await saveLocalStorage({
    wrapperCallstackType: $state.snapshot(config.wrapperCallstackType),
  });
}

export async function togglePanelWrap(index: number) {
  config.panels[index].wrap = !config.panels[index].wrap;
  await saveLocalStorage({ panels: $state.snapshot(config.panels) });
}

export async function togglePanelVisibility(index: number) {
  config.panels[index].visible = !config.panels[index].visible;
  await saveLocalStorage({ panels: $state.snapshot(config.panels) });
}
