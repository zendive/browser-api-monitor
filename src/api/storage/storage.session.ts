import { session, SESSION_VERSION } from './storage.ts';

export type TSession = typeof DEFAULT_SESSION;
type TSessionProperty = Partial<TSession>;
const DEFAULT_SESSION = {
  debug: <string[]> [],
  bypass: <string[]> [],
};
const DEFAULT_SESSION_KEYS_LENGTH = Object.keys(DEFAULT_SESSION).length;
export function enableSessionInContentScript() {
  return session.setAccessLevel({
    accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
  });
}

export async function loadSessionStorage(): Promise<TSession> {
  let store = await session.get([SESSION_VERSION]);
  const isEmpty = !store || !store[SESSION_VERSION] ||
    Object.keys(store[SESSION_VERSION]).length !== DEFAULT_SESSION_KEYS_LENGTH;

  if (isEmpty) {
    await session.clear(); // reset previous version
    store = { [SESSION_VERSION]: DEFAULT_SESSION };
    await session.set(store);
  }

  return store[SESSION_VERSION];
}

/**
 * @NOTE: vulnerable to "time of check / time of use" bug (TOC/TOU)
 * @param value
 */
export async function saveSessionStorage(value: TSessionProperty) {
  const store = await loadSessionStorage();

  Object.assign(store, value);

  return await session.set({ [SESSION_VERSION]: store });
}

export function onSessionStorageChange(
  callback: (newValue: TSession, oldValue: TSession | undefined) => void,
) {
  session.onChanged.addListener((change) => {
    const newValue = change?.[SESSION_VERSION]?.newValue;
    const oldValue = change?.[SESSION_VERSION]?.oldValue;

    if (
      !newValue || Object.keys(newValue).length !== DEFAULT_SESSION_KEYS_LENGTH
    ) {
      return;
    }

    callback(newValue, oldValue);
  });
}
