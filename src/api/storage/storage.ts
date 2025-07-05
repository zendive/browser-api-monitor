export const CONFIG_VERSION = '2025-06-28';
export const SESSION_VERSION = '2025-04-25';

export const local = /*@__PURE__*/ (() => {
  return globalThis.chrome?.storage
    ? chrome.storage.local
    : mockChromeStorageWith(globalThis.localStorage, CONFIG_VERSION);
})();

export const session = /*@__PURE__*/ (() => {
  return globalThis.chrome?.storage
    ? chrome.storage.session
    : mockChromeStorageWith(globalThis.sessionStorage, SESSION_VERSION);
})();

type TOnChangeSignature = (changes: {
  [key: string]: chrome.storage.StorageChange;
}) => void;

const LOCAL_KEY = 'mock';

/**
 * @NOTE: minimalistic coverage, just to accommodate project's basic needs
 */
function mockChromeStorageWith(
  storage: Storage,
  APP_KEY: string,
): chrome.storage.LocalStorageArea {
  const allListeners = new Set<TOnChangeSignature>();

  return {
    QUOTA_BYTES: 10485760,

    clear() {
      return new Promise((resolve) => {
        storage.clear();
        resolve();
      });
    },

    getBytesInUse() {
      return new Promise<number>((resolve) => {
        resolve(
          (storage.getItem(LOCAL_KEY) || '').length,
        );
      });
    },

    async setAccessLevel() {
      // NOOP in window runtime
    },

    // @ts-expect-error partial implementation
    onChanged: {
      addListener(callback: TOnChangeSignature) {
        allListeners.add(callback);
      },

      removeListener(callback: TOnChangeSignature) {
        allListeners.delete(callback);
      },
    },

    async set(o: object) {
      storage.setItem(LOCAL_KEY, JSON.stringify(o));

      // dispatch `change` events
      const oo = await this.get(LOCAL_KEY);
      for (const listener of allListeners) {
        listener({
          [APP_KEY]: {
            newValue: oo[APP_KEY],
          },
        });
      }
    },

    get() {
      return new Promise((resolve, reject) => {
        try {
          resolve(JSON.parse(storage.getItem(LOCAL_KEY) || '{}') || {});
        } catch (e) {
          reject(e);
        }
      });
    },
  };
}
