/**
 * streak.js — Streak state: default, expiry refresh (shield-aware) and the per-session advance. Moved verbatim out of gameStore.js (ADR-078).
 *
 * Comments inside are the originals (Vietnamese where they were written so); the rules they
 * explain have not changed by moving. Pure: no store, no DOM.
 */
import { STREAK_BONUS_PER_DAY } from './constants';
import { streakBonusCapDays } from './wonderEffects.js';
import { localDateStr, localWeekMondayStr } from './time';

export const makeDefaultStreak = () => ({
  currentStreak:  0,
  longestStreak:  0,
  lastActiveDate: null,         // 'YYYY-MM-DD'
  // V2: Lá Chắn Streak — cho phép 1 ngày skip/tuần không reset
  skipShieldUsedWeekKey: null,  // 'YYYY-MM-DD' (Monday) — week mà shield đã dùng
});

export function refreshStreakIfExpired(streak, referenceTs = Date.now(), unlockedSkills = null) {
  if (!streak) return makeDefaultStreak();

  const normalized = {
    currentStreak: Number.isFinite(streak.currentStreak) ? streak.currentStreak : 0,
    longestStreak: Number.isFinite(streak.longestStreak) ? streak.longestStreak : 0,
    lastActiveDate: typeof streak.lastActiveDate === 'string' ? streak.lastActiveDate : null,
    skipShieldUsedWeekKey: typeof streak.skipShieldUsedWeekKey === 'string' ? streak.skipShieldUsedWeekKey : null,
  };
  const needsNormalization =
    normalized.currentStreak !== streak.currentStreak
    || normalized.longestStreak !== streak.longestStreak
    || normalized.lastActiveDate !== streak.lastActiveDate
    || normalized.skipShieldUsedWeekKey !== streak.skipShieldUsedWeekKey;

  if (!normalized.lastActiveDate) return needsNormalization ? normalized : streak;

  const today = localDateStr(referenceTs);
  if (normalized.lastActiveDate === today) return needsNormalization ? normalized : streak;

  const yesterday = localDateStr(referenceTs - 86_400_000);
  if (normalized.lastActiveDate === yesterday) return needsNormalization ? normalized : streak;

  if (normalized.currentStreak === 0) return needsNormalization ? normalized : streak;

  // V2: Lá Chắn Streak — cho phép 1 ngày skip miss (cách 2 ngày trước) nếu chưa dùng shield tuần này
  if (unlockedSkills?.la_chan_streak) {
    const dayBeforeYesterday = localDateStr(referenceTs - 2 * 86_400_000);
    if (normalized.lastActiveDate === dayBeforeYesterday) {
      // Cách 1 ngày — check xem có dùng được shield không
      const currentWeekKey = localWeekMondayStr(referenceTs);
      if (normalized.skipShieldUsedWeekKey !== currentWeekKey) {
        // Shield available — dùng nó, giữ streak
        return {
          ...normalized,
          skipShieldUsedWeekKey: currentWeekKey,
        };
      }
    }
  }

  return {
    ...normalized,
    currentStreak: 0,
  };
}

export function advanceStreak(streak, unlockedSkills = null) {
  const activeStreak = refreshStreakIfExpired(streak, Date.now(), unlockedSkills);
  const today     = localDateStr();
  const yesterday = localDateStr(Date.now() - 86_400_000);
  const dayBeforeYesterday = localDateStr(Date.now() - 2 * 86_400_000);
  if (activeStreak.lastActiveDate === today) return activeStreak; // already counted

  // V2: Lá Chắn Streak — coi cách 2 ngày như liền kề nếu shield available và đã consumed bởi refresh
  const wasShielded = activeStreak.lastActiveDate === dayBeforeYesterday;
  const continuing = activeStreak.lastActiveDate === yesterday || wasShielded;
  const newCurrent = continuing ? activeStreak.currentStreak + 1 : 1;
  return {
    ...activeStreak,
    currentStreak:  newCurrent,
    longestStreak:  Math.max(activeStreak.longestStreak, newCurrent),
    lastActiveDate: today,
  };
}

// ─── FACTORY: STAKING ─────────────────────────────────────────────────────────

/**
 * The streak's XP bonus as a RATE (0.08 = +8 %): `min(streak, cap) × STREAK_BONUS_PER_DAY`, the cap
 * coming from wonders. ONE formula for the reward (`sessionRewards.js`) and for what the Focus
 * screen prints ("+N% XP/phiên", `todayHero.js`) — the two used to be written twice (ADR-078).
 */
export function streakBonusRate(currentStreak = 0, buildings = []) {
  const streak = Math.max(0, Math.floor(Number(currentStreak) || 0));
  return Math.min(streak, streakBonusCapDays(buildings)) * STREAK_BONUS_PER_DAY;
}
