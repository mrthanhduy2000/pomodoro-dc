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
      disableBreak:       false, // skip all breaks entirely

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
      setDisableBreak:       (v) => set({ disableBreak: v }),

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
          ambientVolume,
        };
      },
      version: 5,
    },
  ),
);

export default useSettingsStore;
