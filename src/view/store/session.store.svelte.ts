import { getSession, setSession } from '../../api/session.ts';
import { SvelteSet } from 'svelte/reactivity';

export const sessionStore = $state({
  bypass: <Set<string>> new SvelteSet(),
  debug: <Set<string>> new SvelteSet(),
});

getSession().then((session) => {
  session.bypass.forEach((traceId) => {
    sessionStore.bypass.add(traceId);
  });

  session.debug.forEach((traceId) => {
    sessionStore.debug.add(traceId);
  });
});

export async function toggleBypass(traceId: string) {
  if (await toggleSet(sessionStore.bypass, traceId)) {
    await setSession({
      bypass: Array.from(sessionStore.bypass.values()),
    });
  }
}

export async function toggleDebug(traceId: string) {
  if (await toggleSet(sessionStore.debug, traceId)) {
    await setSession({
      debug: Array.from(sessionStore.debug.values()),
    });
  }
}

const QUOTA_THRESHOLD = chrome.storage.session.QUOTA_BYTES;
const MARGINAL_SIZE = 40; // for ASCII string in an array
async function toggleSet(set: Set<string>, traceId: string): Promise<boolean> {
  if (set.has(traceId)) {
    set.delete(traceId);
    return true;
  }

  const freeSpace = QUOTA_THRESHOLD -
    await chrome.storage.session.getBytesInUse();

  if (freeSpace - traceId.length - MARGINAL_SIZE >= 0) {
    set.add(traceId);
    return true;
  }

  return false;
}
