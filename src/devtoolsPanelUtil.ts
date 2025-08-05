/**
 * module for functions common for devtools-panel
 * as well as for svelte component, BUT doesn't require svelte
 * as a dependency
 */
import { EMsg, portPost } from './api/communication.ts';
import { saveLocalStorage } from './api/storage/storage.local.ts';
import { ms2HMS } from './api/time.ts';

export async function onHidePanel() {
  chrome.power?.releaseKeepAwake();
  portPost({ msg: EMsg.STOP_OBSERVE });
  await saveLocalStorage({ devtoolsPanelShown: false });
}

type TColourScheme = 'light' | 'dark';

export function onColourSchemeChange(
  callback: (scheme: TColourScheme) => void,
) {
  const devtoolsScheme = chrome?.devtools?.panels.themeName;
  const osDarkScheme = globalThis.matchMedia('(prefers-color-scheme: dark)');

  if (devtoolsScheme === 'dark' || osDarkScheme.matches) {
    callback('dark');
  } else {
    callback('light');
  }

  osDarkScheme.addEventListener('change', (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  });
}

export function delayTooltip(delay: number | unknown) {
  if (typeof delay == 'number' && Number.isFinite(delay) && delay > 1e4) {
    return ms2HMS(delay);
  }
}
