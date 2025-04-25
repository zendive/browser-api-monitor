const SESSION_VERSION = '2025-04-25';

export type TSession = typeof DEFAULT_SESSION;
type TSessionProperty = Partial<TSession>;
const DEFAULT_SESSION = {
  debug: <string[]> [],
  bypass: <string[]> [],
};

export function enableSessionInContentScript() {
  return chrome.storage.session.setAccessLevel({
    accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
  });
}

export async function loadSessionStorage(): Promise<TSession> {
  let store = await chrome.storage.session.get([SESSION_VERSION]);
  const isEmpty = !Object.keys(store).length;

  if (isEmpty) {
    await chrome.storage.session.clear(); // reset previous version
    await chrome.storage.session.set({ [SESSION_VERSION]: DEFAULT_SESSION });
    store = await chrome.storage.session.get([SESSION_VERSION]);
  }

  return store[SESSION_VERSION];
}

export async function saveSessionStorage(value: TSessionProperty) {
  const store = await chrome.storage.session.get([SESSION_VERSION]);

  Object.assign(store[SESSION_VERSION], value);

  return await chrome.storage.session.set(store);
}

export function onSessionStorageChange(
  callback: (newValue: TSession, oldValue: TSession) => void,
) {
  chrome.storage.session.onChanged.addListener((change) => {
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
