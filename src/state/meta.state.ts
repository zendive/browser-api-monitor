import { local } from '../api/storage/storage.ts';
import { APPLICATION_VERSION } from '../api/env.ts';

interface IMetadata {
  version?: string;
}

const METADATA_KEY = 'METADATA';

/**
 * Check if current extension's version has been written in local storage
 * and if not - assume it's a newer version or fresh install
 */
export async function isExtensionFresh() {
  const store = await local.get([METADATA_KEY]);
  if (!store) return true;

  const meta = <IMetadata> store[METADATA_KEY];
  return !meta || !meta.version || meta.version !== APPLICATION_VERSION;
}

export function rememberCurrentVersion() {
  local.set({ [METADATA_KEY]: { version: APPLICATION_VERSION } }).catch(
    () => {},
  );
}
