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

// "First action wins": version do server (trigger Postgres) cấp phát, KHÔNG phải
// đồng hồ máy khách — dùng làm điều kiện ghi có-kiểm-tra (compare-and-swap) trong
// syncService.js. Xem supabase/game_state_version.sql.
export const LAST_CLOUD_VERSION_KEY = `${APP_SLUG}:last-cloud-version`;

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

      /*
        ⚠️ ĐƯỜNG GHI PHẢI CHỊU ĐƯỢC localStorage ĐẦY (2026-09-02, đóng `TECH_DEBT #9`).
        Trước đây `setItem` gọi TRẦN. Khi hạn mức bị chạm, lỗi ném thẳng vào trong zustand persist
        — tức app ngừng lưu được state cục bộ, và cách nó biểu hiện với Đàm là "mở lại app thì
        mất hết tiến độ của phiên vừa rồi", một triệu chứng không ai nghĩ tới localStorage.

        ⚠️ DỌN KHOÁ CŨ TRƯỚC RỒI THỬ LẠI, chứ không chỉ nuốt lỗi: những khoá `legacyKeys` là bản
        sao của CHÍNH dữ liệu đang ghi (chúng tồn tại để đọc được state đời cũ), nên xoá chúng đi
        vừa giải phóng đúng lượng chỗ cần vừa không mất gì. Nuốt lỗi im lặng thì lần ghi này hỏng
        mà không ai biết — đúng loại lỗi im lặng mà dự án đã trả giá nhiều lần.
      */
      try {
        storage.setItem(name, value);
      } catch {
        for (const legacyKey of legacyKeys) {
          if (legacyKey && legacyKey !== name) {
            try { storage.removeItem(legacyKey); } catch { /* hết cách, đi tiếp */ }
          }
        }
        try {
          storage.setItem(name, value);
        } catch (loiLan2) {
          // Không cứu được: BÁO RA thay vì im lặng. Đây là chỗ duy nhất biết rằng lần lưu này
          // đã hỏng — nuốt nó là để Đàm mất dữ liệu mà không có một dòng nào giải thích.
          console.error(
            '[storage] Không lưu được state vào localStorage (có thể đã đầy). '
            + 'Dữ liệu phiên này chỉ còn trong bộ nhớ cho tới khi đồng bộ lên Supabase.',
            loiLan2,
          );
          return;
        }
      }

      for (const legacyKey of legacyKeys) {
        if (legacyKey && legacyKey !== name) {
          try { storage.removeItem(legacyKey); } catch { /* không quan trọng */ }
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
