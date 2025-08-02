import { local } from '../api/storage/storage.ts';
import { APPLICATION_VERSION } from '../api/env.ts';

const METADATA_KEY = 'METADATA';

/**
 * Check if current extension's version has been written in local storage
 * and if not - assume it's a newer version or fresh install
 */
export async function isExtensionFresh() {
  const meta = await local.get([METADATA_KEY]);

  return !meta || !meta[METADATA_KEY] || !meta[METADATA_KEY].version ||
    meta[METADATA_KEY].version !== APPLICATION_VERSION;
}

export function rememberCurrentVersion() {
  local.set({ [METADATA_KEY]: { version: APPLICATION_VERSION } }).catch(
    () => {},
  );
}
