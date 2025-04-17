import { getSession, setSession } from '../../api/session.ts';
import { SvelteSet } from 'svelte/reactivity';
import { HASH_STRING_LENGTH } from '../../api/hash.ts';

const SIZE_LIMIT = chrome.storage.session.QUOTA_BYTES - HASH_STRING_LENGTH;
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
  const sessionStorageSize = await chrome.storage.session.getBytesInUse();
  let dirty = false;

  if (sessionStore.bypass.has(traceId)) {
    sessionStore.bypass.delete(traceId);
    dirty = true;
  } else if (sessionStorageSize < SIZE_LIMIT) {
    sessionStore.bypass.add(traceId);
    dirty = true;
  }

  dirty && await setSession({
    bypass: Array.from(sessionStore.bypass.values()),
  });
}

export async function toggleDebug(traceId: string) {
  const sessionStorageSize = await chrome.storage.session.getBytesInUse();
  let dirty = false;

  if (sessionStore.debug.has(traceId)) {
    sessionStore.debug.delete(traceId);
    dirty = true;
  } else if (sessionStorageSize < SIZE_LIMIT) {
    sessionStore.debug.add(traceId);
    dirty = true;
  }

  dirty && await setSession({
    debug: Array.from(sessionStore.debug.values()),
  });
}
