import {
  loadSessionStorage,
  saveSessionStorage,
} from '../api/storage/storage.session.ts';
import { SvelteSet } from 'svelte/reactivity';
import { session } from '../api/storage/storage.ts';

export const sessionState = $state({
  bypass: <Set<string>> new SvelteSet(),
  debug: <Set<string>> new SvelteSet(),
});

loadSessionStorage().then((session) => {
  session.bypass.forEach((traceId) => {
    sessionState.bypass.add(traceId);
  });

  session.debug.forEach((traceId) => {
    sessionState.debug.add(traceId);
  });
});

export async function toggleBypass(traceId: string) {
  if (await toggleSet(sessionState.bypass, traceId)) {
    await saveSessionStorage({
      bypass: Array.from(sessionState.bypass.values()),
    });
  }
}

export async function toggleDebug(traceId: string) {
  if (await toggleSet(sessionState.debug, traceId)) {
    await saveSessionStorage({
      debug: Array.from(sessionState.debug.values()),
    });
  }
}

const QUOTA_THRESHOLD = session.QUOTA_BYTES;
const MARGINAL_SIZE = 40; // for ASCII string in an array
async function toggleSet(set: Set<string>, traceId: string): Promise<boolean> {
  if (set.has(traceId)) {
    set.delete(traceId);
    return true;
  }

  const freeSpace = QUOTA_THRESHOLD -
    await session.getBytesInUse();

  if (freeSpace - traceId.length - MARGINAL_SIZE >= 0) {
    set.add(traceId);
    return true;
  }

  return false;
}
