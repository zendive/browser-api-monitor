/**
 * module for functions common for devtools-panel
 * as well as for svelte component, BUT doesn't require svelte
 * as a dependency
 */
import { EMsg, portPost } from './api/communication.ts';
import { saveLocalStorage } from './api/storage.local.ts';

export async function onHidePanel() {
  chrome.power.releaseKeepAwake();
  portPost({ msg: EMsg.STOP_OBSERVE });
  await saveLocalStorage({ devtoolsPanelShown: false });
}
