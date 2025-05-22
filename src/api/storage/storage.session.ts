import { session, SESSION_VERSION } from './storage.ts';

export type TSession = typeof DEFAULT_SESSION;
type TSessionProperty = Partial<TSession>;
const DEFAULT_SESSION = {
  debug: <string[]> [],
  bypass: <string[]> [],
};

export function enableSessionInContentScript() {
  return session.setAccessLevel({
    accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
  });
}

export async function loadSessionStorage(): Promise<TSession> {
  let store = await session.get([SESSION_VERSION]);
  const isEmpty = !Object.keys(store).length;

  if (isEmpty) {
    await session.clear(); // reset previous version
    await session.set({ [SESSION_VERSION]: DEFAULT_SESSION });
    store = await session.get([SESSION_VERSION]);
  }

  return store[SESSION_VERSION];
}

export async function saveSessionStorage(value: TSessionProperty) {
  const store = await session.get([SESSION_VERSION]);

  Object.assign(store[SESSION_VERSION], value);

  return await session.set(store);
}

export function onSessionStorageChange(
  callback: (newValue: TSession, oldValue: TSession) => void,
) {
  session.onChanged.addListener((change) => {
    if (
      change && change[SESSION_VERSION] && change[SESSION_VERSION].newValue
    ) {
      callback(
        change[SESSION_VERSION].newValue,
        change[SESSION_VERSION].oldValue,
      );
    }
  });
}
