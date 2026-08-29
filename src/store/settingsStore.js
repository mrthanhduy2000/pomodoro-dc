/**
 * settingsStore.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight Zustand store for user preferences (sound, notifications, UI).
 * Persisted separately from gameStore so preferences survive a game reset.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import soundEngine from '../engine/soundEngine';
import ambientEngine from '../engine/ambientEngine';
import notificationManager from '../engine/notifications';
import { DEFAULT_QUICK_FOCUS_PRESET } from '../engine/breaks';
import { normalizeRenderMode } from '../engine/city3d/renderMode';
// Danh sách skin + mặc định nằm ở module THUẦN riêng để script Node đọc được mà không phải
// nạp cả engine âm thanh/thông báo — xem khối chú thích ở `uiSkins.js`.
import {
  DEFAULT_UI_SKIN,
  normalizeUiSkin,
  resolveSkinAfterMigration,
  SKIN_MIGRATION_FLAG,
} from './uiSkins';
import {
  disablePushSubscription,
  ensurePushSubscription,
  getPushRuntimeState,
  getPushSupportStatus,
} from '../lib/pushService';
import {
  SETTINGS_STORAGE_KEY,
  LEGACY_SETTINGS_STORAGE_KEYS,
  createLegacyCompatibleJSONStorage,
} from '../lib/appIdentity';

const DEFAULT_BREAK_PROFILE = {
  shortBreakDuration: DEFAULT_QUICK_FOCUS_PRESET.shortBreakDuration,
  longBreakDuration: DEFAULT_QUICK_FOCUS_PRESET.longBreakDuration,
  longBreakAfterN: DEFAULT_QUICK_FOCUS_PRESET.longBreakAfterN,
};

const DEFAULT_DAILY_GOAL = {
  dailyGoalType: 'sessions',
  dailyGoalSessions: 5,
  dailyGoalMinutes: DEFAULT_QUICK_FOCUS_PRESET.focusMinutes * 5,
};

function clampDailyGoalMinutes(value) {
  const safeValue = Number.isFinite(value) ? value : DEFAULT_DAILY_GOAL.dailyGoalMinutes;
  return Math.min(600, Math.max(15, Math.round(safeValue / 5) * 5));
}

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // ── Sound ──────────────────────────────────────────────────────────
      soundEnabled:     true,
      masterVolume:     0.6,   // 0–1
      tickSoundEnabled: false, // per-second tick is off by default (can get annoying)

      // ── Ambient Sound ──────────────────────────────────────────────────
      // 'none' | 'rain' | 'wind' | 'forest' | 'coffee' | 'waves' | 'fireplace'
      ambientSound:   'none',
      ambientVolume:  0.3,

      // ── Notifications ──────────────────────────────────────────────────
      notificationsEnabled: true,
      // 'default' | 'granted' | 'denied' | 'unsupported'
      notificationPermission: typeof Notification !== 'undefined'
        ? Notification.permission
        : 'unsupported',
      pushSupportStatus: getPushSupportStatus(),
      pushSubscriptionStatus: 'unknown', // 'unknown' | 'subscribed' | 'unsubscribed'
      pushStatusMessage: '',

      // ── Theme ──────────────────────────────────────────────────────────
      // 'auto' follows the era; 'dark' is always slate-950
      themeMode: 'auto',

      // ── UI Theme ───────────────────────────────────────────────────────
      // 'light' | 'dark'
      uiTheme: 'light',

      // ── UI Skin (bộ giao diện) ─────────────────────────────────────────
      // 'arcade' (mặc định) | 'editorial' | 'aurora' | 'inkgold' | 'swiss'
      uiSkin: DEFAULT_UI_SKIN,
      // Máy MỚI đã ở mặc định hiện hành rồi ⇒ bật sẵn cờ, không có gì để ép. Thiếu dòng này thì
      // lần bump version kế tiếp sẽ chạy phép ép trên một máy chưa từng cần ép.
      [SKIN_MIGRATION_FLAG]: true,

      // ── Sound Pack ─────────────────────────────────────────────────────
      // 'classic' | 'nature' | 'synthwave' | 'minimal'
      soundPack: 'classic',

      // ── Timer Settings ─────────────────────────────────────────────────
      shortBreakDuration: DEFAULT_BREAK_PROFILE.shortBreakDuration,
      longBreakDuration:  DEFAULT_BREAK_PROFILE.longBreakDuration,
      longBreakAfterN:    DEFAULT_BREAK_PROFILE.longBreakAfterN,
      dailyGoalType:      DEFAULT_DAILY_GOAL.dailyGoalType,
      dailyGoalSessions:  DEFAULT_DAILY_GOAL.dailyGoalSessions,
      dailyGoalMinutes:   DEFAULT_DAILY_GOAL.dailyGoalMinutes,
      autoStartNext:      false, // auto-start focus after break ends
      autoStartBreak:     true,  // auto-start break after focus ends
      continueTimingAfterPomodoro: false, // continue a Pomodoro as stopwatch after countdown reaches zero
      disableBreak:       false, // skip all breaks entirely

      // ── Thành Phố ──────────────────────────────────────────────────────
      // ⚠️ Ở ĐÂY chứ KHÔNG phải gameStore: đây là sở thích hiển thị của TỪNG MÁY (Mac chạy 3D
      // được, iPhone có thể không), và store này không đồng bộ lên Supabase nên không thêm một
      // byte nào vào khối JSONB đang chịu cơ chế CAS "First Action Wins".
      cityRenderMode: 'auto',   // 'auto' | '3d' | '2d' — xem engine/city3d/renderMode.js
      cityPerfHud: false,       // bảng số liệu hiệu năng, để đo cổng Phase 3A
      // Thành phố làm lớp nền ở trang chủ. Mặc định BẬT (Đàm chọn "bật hết hiệu ứng"); vẫn tự tắt
      // ở máy không chạy được 3D và khi bật "giảm chuyển động" của hệ điều hành.
      cityHomeBackdrop: true,

      // ── Onboarding ─────────────────────────────────────────────────────
      hasViewedInitialOnboarding: false, // overlay 3 thẻ chỉ hiện 1 lần cho người mới

      // ── Actions ────────────────────────────────────────────────────────

      setSoundEnabled: (enabled) => {
        soundEngine.enabled = enabled;
        set({ soundEnabled: enabled });
      },

      setMasterVolume: (vol) => {
        const clamped = Math.min(1, Math.max(0, vol));
        soundEngine.volume = clamped;
        set({ masterVolume: clamped });
      },

      setTickSoundEnabled: (enabled) => set({ tickSoundEnabled: enabled }),

      setAmbientSound: (sound) => {
        const { ambientVolume } = get();
        if (sound === 'none') {
          ambientEngine.stop();
        } else {
          ambientEngine.play(sound, ambientVolume);
        }
        set({ ambientSound: sound });
      },

      setAmbientVolume: (vol) => {
        const clamped = Math.min(1, Math.max(0, vol));
        ambientEngine.setVolume(clamped);
        set({ ambientVolume: clamped });
      },

      setNotificationsEnabled: async (enabled) => {
        notificationManager.enabled = enabled;

        if (!enabled) {
          const result = await disablePushSubscription();
          set({
            notificationsEnabled: false,
            pushSubscriptionStatus: 'unsubscribed',
            pushStatusMessage: result.errorMessage ?? '',
          });
          return result;
        }

        const result = await ensurePushSubscription();
        set({
          notificationsEnabled: result.permission === 'granted',
          notificationPermission: result.permission,
          pushSupportStatus: result.supportStatus,
          pushSubscriptionStatus: result.subscribed ? 'subscribed' : 'unsubscribed',
          pushStatusMessage: result.errorMessage ?? '',
        });
        notificationManager.enabled = result.permission === 'granted';
        return result;
      },

      /**
       * requestNotificationPermission
       * Must be called from a button click handler.
       */
      requestNotificationPermission: async () => {
        const result = await ensurePushSubscription();
        set({
          notificationsEnabled: result.permission === 'granted',
          notificationPermission: result.permission,
          pushSupportStatus: result.supportStatus,
          pushSubscriptionStatus: result.subscribed ? 'subscribed' : 'unsubscribed',
          pushStatusMessage: result.errorMessage ?? '',
        });
        notificationManager.enabled = result.permission === 'granted';
        return result.permission;
      },

      refreshPushState: async () => {
        const result = await getPushRuntimeState();
        set({
          notificationPermission: result.permission,
          pushSupportStatus: result.supportStatus,
          pushSubscriptionStatus: result.subscribed ? 'subscribed' : 'unsubscribed',
          pushStatusMessage: result.errorMessage ?? '',
        });
        notificationManager.enabled = get().notificationsEnabled && result.permission === 'granted';
        return result;
      },

      setThemeMode: (mode) => set({ themeMode: mode }),

      setUiTheme: (theme) => set({ uiTheme: theme === 'dark' ? 'dark' : 'light' }),

      setUiSkin: (skin) => set({ uiSkin: normalizeUiSkin(skin) }),

      setSoundPack: (pack) => {
        soundEngine.setPack(pack);
        set({ soundPack: pack });
      },

      setShortBreakDuration: (n) => set({ shortBreakDuration: Math.min(60, Math.max(1, n)) }),
      setLongBreakDuration:  (n) => set({ longBreakDuration:  Math.min(90, Math.max(1, n)) }),
      setLongBreakAfterN:    (n) => set({ longBreakAfterN:    Math.min(10, Math.max(1, n)) }),
      setDailyGoalType:     (type) => set({ dailyGoalType: type === 'minutes' ? 'minutes' : 'sessions' }),
      setDailyGoalSessions: (n) => set({ dailyGoalSessions: Math.min(20, Math.max(1, n)) }),
      setDailyGoalMinutes:  (n) => set({ dailyGoalMinutes:  clampDailyGoalMinutes(n) }),
      setBreakProfile: ({ shortBreakDuration, longBreakDuration, longBreakAfterN }) => set({
        shortBreakDuration: Math.min(60, Math.max(1, shortBreakDuration ?? get().shortBreakDuration)),
        longBreakDuration:  Math.min(90, Math.max(1, longBreakDuration ?? get().longBreakDuration)),
        longBreakAfterN:    Math.min(10, Math.max(1, longBreakAfterN ?? get().longBreakAfterN)),
      }),
      setAutoStartNext:      (v) => set({ autoStartNext: v }),
      setAutoStartBreak:     (v) => set({ autoStartBreak: v }),
      setContinueTimingAfterPomodoro: (v) => set({ continueTimingAfterPomodoro: v }),
      setDisableBreak:       (v) => set({ disableBreak: v }),
      setHasViewedInitialOnboarding: (v) => set({ hasViewedInitialOnboarding: v !== false }),
      setCityRenderMode: (mode) => set({ cityRenderMode: normalizeRenderMode(mode) }),
      setCityPerfHud:    (v) => set({ cityPerfHud: v === true }),
      setCityHomeBackdrop: (v) => set({ cityHomeBackdrop: v === true }),

      // ── Hydration sync ─────────────────────────────────────────────────
      // Called once on app mount to push persisted prefs back into singletons.
      hydrateEngines: () => {
        const { soundEnabled, masterVolume, notificationsEnabled, ambientSound, ambientVolume, soundPack } = get();
        soundEngine.enabled = soundEnabled;
        soundEngine.volume  = masterVolume;
        soundEngine.setPack(soundPack ?? 'classic');
        notificationManager.enabled = notificationsEnabled;
        void get().refreshPushState();
        // Restore ambient sound after page reload
        if (ambientSound && ambientSound !== 'none') {
          ambientEngine.play(ambientSound, ambientVolume);
        }
      },
    }),

    {
      name:    SETTINGS_STORAGE_KEY,
      storage: createLegacyCompatibleJSONStorage(LEGACY_SETTINGS_STORAGE_KEYS),
      migrate: (stored) => {
        const safeStored = stored ?? {};
        const ambientVolume = safeStored.ambientVolume > 0 ? safeStored.ambientVolume : 0.3;
        return {
          ambientSound:   'none',
          ...DEFAULT_BREAK_PROFILE,
          ...DEFAULT_DAILY_GOAL,
          autoStartNext:   false,
          autoStartBreak:  true,
          continueTimingAfterPomodoro: false,
          disableBreak:    false,
          ...safeStored,
          dailyGoalType: safeStored.dailyGoalType === 'minutes' ? 'minutes' : 'sessions',
          dailyGoalSessions: Number.isFinite(safeStored.dailyGoalSessions)
            ? Math.min(20, Math.max(1, safeStored.dailyGoalSessions))
            : DEFAULT_DAILY_GOAL.dailyGoalSessions,
          dailyGoalMinutes: Number.isFinite(safeStored.dailyGoalMinutes)
            ? clampDailyGoalMinutes(safeStored.dailyGoalMinutes)
            : DEFAULT_DAILY_GOAL.dailyGoalMinutes,
          uiTheme: safeStored.uiTheme === 'dark' ? 'dark' : 'light',
          // ⚠️ KHÔNG phải `normalizeUiSkin(safeStored.uiSkin)` nữa: bản lưu của Đàm mang skin
          // `editorial` vì hồi ấy nó là MẶC ĐỊNH, không phải vì anh chọn. Xem `uiSkins.js`.
          ...resolveSkinAfterMigration(safeStored),
          ambientVolume,
          // Giá trị rác (bản cũ, sửa tay localStorage) không được lọt tới chỗ quyết định có dựng
          // WebGL hay không — chuẩn hoá ngay tại cửa.
          cityRenderMode: normalizeRenderMode(safeStored.cityRenderMode),
          cityPerfHud: safeStored.cityPerfHud === true,
          // ⚠️ `!== false` chứ không phải `=== true`: mặc định là BẬT, nên bản lưu cũ (chưa có
          // trường này ⇒ `undefined`) phải hiểu là bật, không phải tắt.
          cityHomeBackdrop: safeStored.cityHomeBackdrop !== false,
        };
      },
      // 6 → 7 (2026-08-12): thêm `cityRenderMode` + `cityPerfHud` cho màn hình Thành Phố 3D.
      // 7 → 8 (2026-08-12): thêm `cityHomeBackdrop` — thành phố làm lớp nền ở trang chủ (Phase 3F).
      // 8 → 9 (2026-08-29): ép chuyển skin MỘT LẦN về `DEFAULT_UI_SKIN` cho bản lưu chưa có cờ
      //   `skinMigratedV1`. Bump version là thứ DUY NHẤT làm `migrate` chạy lại, nên không có nó
      //   thì hàm ép chuyển có viết đúng tới đâu cũng không bao giờ được gọi trên máy Đàm.
      version: 9,
    },
  ),
);

export default useSettingsStore;
