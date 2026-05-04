import { createJSONStorage } from 'zustand/middleware';

export const APP_DISPLAY_NAME = 'DC Pomodoro';
export const APP_SLUG = 'dc-pomodoro';
export const LEGACY_APP_SLUG = 'civjourney';

export const GAME_STORE_STORAGE_KEY = `${APP_SLUG}-v1`;
export const LEGACY_GAME_STORE_STORAGE_KEYS = [`${LEGACY_APP_SLUG}-v1`];
export const GAME_STORE_EXPORT_VERSION = GAME_STORE_STORAGE_KEY;
export const LEGACY_GAME_STORE_EXPORT_VERSIONS = [...LEGACY_GAME_STORE_STORAGE_KEYS];

export const SETTINGS_STORAGE_KEY = `${APP_SLUG}-settings-v2`;
export const LEGACY_SETTINGS_STORAGE_KEYS = [`${LEGACY_APP_SLUG}-settings-v2`];

export const LAST_CLOUD_SYNC_KEY = `${APP_SLUG}:last-cloud-sync`;
export const LEGACY_LAST_CLOUD_SYNC_KEYS = [`_${LEGACY_APP_SLUG}_last_cloud_sync`];

export const GLOBAL_ERROR_HANDLERS_FLAG = '__dcPomodoroGlobalErrorHandlersInstalled';
export const LEGACY_GLOBAL_ERROR_HANDLERS_FLAGS = ['__civjourneyGlobalErrorHandlersInstalled'];

export const LOCAL_SW_RESET_KEY = `${APP_SLUG}-local-sw-reset`;
export const LEGACY_LOCAL_SW_RESET_KEYS = [`${LEGACY_APP_SLUG}-local-sw-reset`];

export const RUNTIME_RECOVERY_STORAGE_PREFIX = `${APP_SLUG}:runtime-recovery:`;
export const LEGACY_RUNTIME_RECOVERY_STORAGE_PREFIXES = [`${LEGACY_APP_SLUG}:runtime-recovery:`];

export const PARTICLE_STYLE_ID = `${APP_SLUG}-particles-css`;
export const EXPORT_FILENAME_PREFIX = `${APP_SLUG}-backup`;
export const CACHE_NAME_PATTERNS = [/^workbox-/i, /^dc-pomodoro/i, /^civjourney/i];

function getBrowserStorage(storageName) {
  if (typeof window === 'undefined') return null;
  return window[storageName] ?? null;
}

function readStorageValue(storageName, primaryKey, legacyKeys = []) {
  const storage = getBrowserStorage(storageName);
  if (!storage) return null;

  for (const key of [primaryKey, ...legacyKeys]) {
    if (!key) continue;

    try {
      const value = storage.getItem(key);
      if (value == null) continue;

      if (key !== primaryKey) {
        try {
          storage.setItem(primaryKey, value);
        } catch {
          // Keep the legacy key if the migration write fails.
        }
      }

      return value;
    } catch {
      // Ignore storage read failures and keep searching legacy keys.
    }
  }

  return null;
}

export function readLocalStorageValue(primaryKey, legacyKeys = []) {
  return readStorageValue('localStorage', primaryKey, legacyKeys);
}

export function readSessionStorageValue(primaryKey, legacyKeys = []) {
  return readStorageValue('sessionStorage', primaryKey, legacyKeys);
}

export function createLegacyCompatibleJSONStorage(legacyKeys = []) {
  return createJSONStorage(() => ({
    getItem: (name) => readLocalStorageValue(name, legacyKeys),
    setItem: (name, value) => {
      const storage = getBrowserStorage('localStorage');
      if (!storage) return;

      storage.setItem(name, value);
      for (const legacyKey of legacyKeys) {
        if (legacyKey && legacyKey !== name) {
          storage.removeItem(legacyKey);
        }
      }
    },
    removeItem: (name) => {
      const storage = getBrowserStorage('localStorage');
      if (!storage) return;

      storage.removeItem(name);
      for (const legacyKey of legacyKeys) {
        if (legacyKey && legacyKey !== name) {
          storage.removeItem(legacyKey);
        }
      }
    },
  }));
}
