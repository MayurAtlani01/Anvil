/**
 * Chrome Extension Local Storage Adapter
 * Backs user-generated application data with chrome.storage.local
 */

const memoryStore = new Map<string, string>();

function isStorageAvailable(): boolean {
  try {
    return (
      typeof chrome !== 'undefined' &&
      Boolean(chrome.runtime?.id) &&
      Boolean(chrome.storage?.local)
    );
  } catch {
    return false;
  }
}

export const storage = {
  async get<T>(key: string, defaultValue: T): Promise<T> {
    if (isStorageAvailable()) {
      try {
        return await new Promise((resolve) => {
          chrome.storage.local.get([key], (result) => {
            try {
              if (chrome.runtime?.lastError) {
                console.warn(`[Anvil Storage] Error getting ${key}:`, chrome.runtime.lastError);
                resolve(defaultValue);
                return;
              }
              if (result && result[key] !== undefined) {
                resolve(result[key] as T);
              } else {
                resolve(defaultValue);
              }
            } catch {
              resolve(defaultValue);
            }
          });
        });
      } catch (err) {
        console.debug(`[Anvil Storage] Extension context invalidated or storage error on get ${key}:`, err);
      }
    }

    // Web / local fallback
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(`anvil_${key}`);
        if (item !== null) {
          return JSON.parse(item) as T;
        }
      }
    } catch {
      // ignore
    }

    if (memoryStore.has(key)) {
      try {
        return JSON.parse(memoryStore.get(key)!) as T;
      } catch {
        // ignore
      }
    }

    return defaultValue;
  },

  async set<T>(key: string, value: T): Promise<void> {
    if (isStorageAvailable()) {
      try {
        await new Promise<void>((resolve) => {
          chrome.storage.local.set({ [key]: value }, () => {
            try {
              if (chrome.runtime?.lastError) {
                console.warn(`[Anvil Storage] Error setting ${key}:`, chrome.runtime.lastError);
              }
            } catch {
              // Context invalidated during callback
            }
            resolve();
          });
        });
      } catch (err) {
        console.debug(`[Anvil Storage] Extension context invalidated or storage error on set ${key}:`, err);
      }
    }

    // Web / local fallback
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(`anvil_${key}`, JSON.stringify(value));
      }
    } catch {
      // ignore
    }

    memoryStore.set(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    if (isStorageAvailable()) {
      try {
        await new Promise<void>((resolve) => {
          chrome.storage.local.remove([key], () => {
            resolve();
          });
        });
      } catch (err) {
        console.debug(`[Anvil Storage] Extension context invalidated or storage error on remove ${key}:`, err);
      }
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(`anvil_${key}`);
      }
    } catch {
      // ignore
    }

    memoryStore.delete(key);
  },
};
