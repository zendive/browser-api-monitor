const SESSION_VERSION = '1.2.0';

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

export async function getSession(): Promise<TSession> {
  let store = await chrome.storage.session.get([SESSION_VERSION]);
  const isEmpty = !Object.keys(store).length;

  if (isEmpty) {
    await chrome.storage.session.clear(); // rid off previous version settings
    await chrome.storage.session.set({ [SESSION_VERSION]: DEFAULT_SESSION });
    store = await chrome.storage.session.get([SESSION_VERSION]);
  }

  return store[SESSION_VERSION];
}

export async function setSession(value: TSessionProperty) {
  const store = await chrome.storage.session.get([SESSION_VERSION]);

  Object.assign(store[SESSION_VERSION], value);

  return await chrome.storage.session.set(store);
}

export function onSessionChange(
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
