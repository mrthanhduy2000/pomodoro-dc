/**
 * gameStore.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Zustand store — nguồn sự thật duy nhất cho toàn bộ trạng thái game.
 *
 * Chiến lược lưu trữ:
 *   • zustand/middleware `persist` ghi vào localStorage với key 'dc-pomodoro-v1'
 *   • Schema version được theo dõi riêng bằng `GAME_STORE_SCHEMA_VERSION`
 *   • Chỉ slice `game` được persist; trạng thái UI tạm thời nằm ở slice `ui`
 *
 * Tổng quan Schema
 * ────────────────
 *  player        — cấp độ, EXP, SP, kỹ năng đã mở khóa
 *  progress      — tổng EP, chuyển quyển
 *  resources     — túi tài nguyên theo từng quyển
 *  timer         — cấu hình focus/break + trạng thái runtime
 *  forgiveness   — theo dõi miễn phạt hàng tuần
 *  rankSystem    — bậc danh xưng hiện tại theo quyển + thử thách đang active
 *  eraCrisis     — trạng thái khủng hoảng kỷ nguyên
 *  relics        — di vật đã nhận (buff vĩnh viễn)
 *  history       — nhật ký phiên (50 gần nhất)
 *  ui            — trạng thái modal, payload phần thưởng
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GAME_STORE_STORAGE_KEY,
  GAME_STORE_EXPORT_VERSION,
  LEGACY_GAME_STORE_STORAGE_KEYS,
  LEGACY_GAME_STORE_EXPORT_VERSIONS,
  SETTINGS_STORAGE_KEY,
  LEGACY_SETTINGS_STORAGE_KEYS,
  createLegacyCompatibleJSONStorage,
  readLocalStorageValue,
} from '../lib/appIdentity';
import {
  localDateStr,
  localWeekMondayStr,
  getVietnamDateParts,
  getVietnamDayOfWeek,
  getVietnamHour,
  getVietnamMonthIndex,
  getVietnamYear,
} from '../engine/time';
import {
  FORGIVENESS_CANCELS_PER_WEEK,
  SIEU_TAP_TRUNG_CHARGES,
  SIEU_TAP_TRUNG_MIN_MIN,
  NGHI_NGOI_HOAN_HAO_EXTRA_CHARGES,
  SO_DO_MIN_MINUTES,
  RANK_SYSTEM,
  ACHIEVEMENTS,
  MISSION_CATALOG,
  MISSIONS_PER_DAY,
  MISSION_ALL_BONUS_XP,
  DAILY_MISSION_XP_SCALE,
  MISSION_NOTE_MIN_WORDS,
  DAILY_RARE_BUCKET_CHANCE_MIN,
  DAILY_RARE_BUCKET_CHANCE_MAX,
  WEEKLY_CHAINS,
  WEEKLY_CHAIN_XP_SCALE,
  PERFECT_PLAN_WEEKLY_MULTIPLIER,
  STREAK_MISSION_MIN_STREAK,
  STREAK_MISSION_BASE_XP,
  STREAK_MISSION_XP_PER_DAY,
  STREAK_MISSION_MAX_XP,
  BUILDING_SPECS,
  BUILDING_EFFECTS,
  BLUEPRINT_CATALOG,
  BLUEPRINT_META,
  ERA_METADATA,
  DEFAULT_SESSION_CATEGORIES,
  COMBO_BONUS_PER_STACK,
  COMBO_MAX_STACKS,
  POSITIVE_EVENT_XP_SCALE,
  POSITIVE_EVENTS,
  ERA_MINI_EVENTS,
  OVERCLOCK_REWARD_MULTIPLIER,
  OVERCLOCK_BONUS_REDUCED,
  OVERCLOCK_EP_COST_RATE,
  OVERCLOCK_MIN_SESSION_MIN,
  OVERCLOCK_MIN_FULL_SESSION,
  PRESTIGE_EP_REQUIREMENT,
  PRESTIGE_BONUS_PER_RUN,
  PRESTIGE_MAX_STACKS,
  SP_PER_LEVEL,
  STREAK_BONUS_PER_DAY,
  STREAK_MAX_BONUS_DAYS,
  CRAFT_QUEUE_SLOTS,
  RELIC_EVOLUTION,
  T2_CRAFT_COST,
  getBuildingLevelMultiplier,
  normalizeRawCost,
  normalizeRefinedBag,
  getUnifiedRefinedCost,
  spendUnifiedRefined,
  getUpgradeRefinedCost,
  getRelicEvolutionRefinedCost,
  normalizeRawResourceId,
  STORAGE_VAULT_XP_PER_MINUTE,
  STORAGE_VAULT_XP_PER_MINUTE_ENHANCED,
} from '../engine/constants';
import {
  calculateRewards,
  calculateSessionResourceFloor,
  applyDisasterPenalty,
  computeLevelUps,
  getActiveBook,
  getComboDecayMs,
} from '../engine/gameMath';
import { inferAchievementUnlockTimes } from '../engine/achievementTimeline';
import {
  detectEraCrisis,
  createEraCrisisState,
  applyEraCrisisSacrifice,
  startEraCrisisChallenge,
  updateEraCrisisChallenge,
  checkEraCrisisChallengeExpiry,
  applyEraCrisisChallengePenalty,
  createRankChallenge,
  updateRankChallenge,
  checkRankChallengeExpiry,
  applyRankChallengePenalty,
  aggregateActiveBuffs,
} from '../engine/challengeEngine';

export { GAME_STORE_STORAGE_KEY, GAME_STORE_EXPORT_VERSION };
export const GAME_STORE_SCHEMA_VERSION = 2;

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// ─── FACTORY: TRẠNG THÁI KHỞI TẠO ────────────────────────────────────────────

const makeEmptyResources = () => Object.fromEntries(
  Object.entries(ERA_METADATA).map(([era, meta]) => [
    `book${era}`,
    Object.fromEntries((meta.resources ?? []).map((resource) => [resource.id, 0])),
  ])
);

const BLUEPRINT_LOOKUP = Object.fromEntries(
  Object.values(BLUEPRINT_CATALOG)
    .flat()
    .map((blueprint) => [blueprint.id, blueprint])
);

const UI_NOTIFICATION_LIMIT = 40;

function createUiNotification({
  title,
  body = '',
  icon = '✦',
  category = 'system',
  action = null,
  createdAt = Date.now(),
}) {
  return {
    id: `notif_${createdAt}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    body,
    icon,
    category,
    action,
    createdAt,
    readAt: null,
  };
}

function appendUiNotification(feed, notification) {
  if (!notification?.title) return Array.isArray(feed) ? feed : [];
  return [
    createUiNotification(notification),
    ...(Array.isArray(feed) ? feed : []),
  ].slice(0, UI_NOTIFICATION_LIMIT);
}

function appendUiNotifications(feed, notifications = []) {
  return notifications
    .filter((notification) => notification?.title)
    .reverse()
    .reduce((nextFeed, notification) => appendUiNotification(nextFeed, notification), Array.isArray(feed) ? feed : []);
}

function getBlueprintIdentity(bpId) {
  const blueprint = BLUEPRINT_LOOKUP[bpId];
  return {
    label: blueprint?.label ?? bpId,
    icon: blueprint?.icon ?? '🏗️',
  };
}

function describeNames(names = []) {
  const cleanNames = names.filter(Boolean);
  if (cleanNames.length === 0) return '';
  if (cleanNames.length === 1) return cleanNames[0];
  if (cleanNames.length === 2) return `${cleanNames[0]} và ${cleanNames[1]}`;
  return `${cleanNames[0]}, ${cleanNames[1]} và ${cleanNames.length - 2} mục khác`;
}

function makeResearchReadyNotification(bpId) {
  const blueprint = getBlueprintIdentity(bpId);
  return {
    title: 'Bản vẽ đã sẵn sàng',
    body: `${blueprint.label} đã được nghiên cứu. Mở tab Bản vẽ để đưa vào xưởng.`,
    icon: blueprint.icon,
    category: 'blueprints',
    action: { tab: 'collection', collectionTab: 'blueprints' },
  };
}

function makeWorkshopQueuedNotification(bpId, sessionsToComplete = 0) {
  const blueprint = getBlueprintIdentity(bpId);
  return {
    title: 'Đã đưa vào xưởng',
    body: `${blueprint.label} đang trong hàng chờ xây dựng${sessionsToComplete > 0 ? `, cần ${sessionsToComplete} phiên để hoàn tất.` : '.'}`,
    icon: blueprint.icon,
    category: 'workshop',
    action: { tab: 'collection', collectionTab: 'workshop' },
  };
}

function makeWorkshopCompletedNotification(bpIds = []) {
  const identities = bpIds.map(getBlueprintIdentity);
  const firstIcon = identities[0]?.icon ?? '🏗️';
  const summary = describeNames(identities.map((item) => item.label));
  return {
    title: bpIds.length > 1 ? 'Xưởng đã hoàn tất nhiều công trình' : 'Công trình đã hoàn tất',
    body: `${summary} đã hoàn tất và hiệu ứng công trình đang có hiệu lực.`,
    icon: firstIcon,
    category: 'workshop',
    action: { tab: 'collection', collectionTab: 'workshop' },
  };
}

function makeRankUpFeedNotification(bookNumber, rankIdx) {
  const rank = RANK_SYSTEM[bookNumber]?.ranks?.[rankIdx];
  if (!rank) return null;
  return {
    title: 'Thăng rank',
    body: `Bạn vừa đạt ${rank.label}. Buff mới đã có hiệu lực.`,
    icon: rank.icon ?? '👑',
    category: 'rank',
    action: { tab: 'focus' },
  };
}

function makeEraUpFeedNotification(bookNumber) {
  const eraMeta = ERA_METADATA[bookNumber];
  if (!eraMeta) return null;
  return {
    title: 'Kỷ nguyên mới',
    body: `Bạn đã bước vào ${eraMeta.label}. Những bản vẽ và mốc mới vừa mở ra.`,
    icon: eraMeta.icon ?? '⏳',
    category: 'era',
    action: { tab: 'focus' },
  };
}

function makeEraCrisisExpiredDisaster(crisisState) {
  const lossPercent = Math.round((crisisState?.challengeOption?.failureLoss ?? 0) * 100);
  const crisisName = crisisState?.name ?? 'Khủng hoảng kỷ nguyên';

  return {
    disaster: {
      label: 'Khủng hoảng quá hạn',
      icon: crisisState?.icon ?? '⏰',
      description: `${crisisName} đã quá hạn trước khi bạn hoàn thành thử thách. Mất ${lossPercent}% tài nguyên.`,
    },
    deducted: {},
    waived: false,
    chargeConsumed: false,
  };
}

const makeDefaultSkills = () => ({
  // ── THIỀN ĐỊNH (V2) ─────────────────────────────────────────────────────
  vao_guong:            false,    // mới — thay khoi_dong_nhanh
  chuyen_can:           false,
  da_tap_trung:         false,
  vung_dong_chay:       false,
  tap_trung_sieu_viet:  false,
  sieu_tap_trung:       false,
  // ── Ý CHÍ (V2) ──────────────────────────────────────────────────────────
  su_tha_thu:           false,
  bo_nho_co_bap:        false,
  phuc_hoi:             false,
  chuoi_ngay:           false,
  la_chan_streak:       false,    // mới — thay y_chi_thep
  ben_vung:             false,    // mới — thay bat_khuat
  // ── NGHỈ NGƠI (V2) ──────────────────────────────────────────────────────
  hit_tho_sau:          false,
  nap_nang_luong:       false,
  tich_phien:           false,    // mới — thay kho_du_tru
  phien_vang_sang:      false,
  nhip_sinh_hoc:        false,
  nhip_hoan_hao:        false,    // mới — thay nghi_ngoi_hoan_hao
  // ── VẬN MAY (V2) ────────────────────────────────────────────────────────
  ban_tay_vang:         false,
  nhan_quan:            false,
  linh_cam:             false,
  loc_ban_tang:         false,    // mới — thay be_cong_thoi_gian
  dai_trung_thuong:     false,
  so_do:                false,
  // ── CHIẾN LƯỢC (V2) ─────────────────────────────────────────────────────
  nguoi_lap_ke:         false,    // mới — thay chuyen_gia
  cu_tri:               false,    // mới — thay da_nang
  co_van:               false,    // mới — thay chuyen_mon_hoa
  lich_day:             false,    // mới — thay can_bang
  bac_thay_chien_luoc:  false,
  ke_hoach_hoan_hao:    false,
  // ── THĂNG HOA ───────────────────────────────────────────────────────────
  ky_uc_ky_nguyen:      false,
  tri_tue_tich_luy:     false,
  kien_thuc_nen:        false,
  bac_thay_ky_nguyen:   false,
  ke_thua:              false,
  sieu_viet:            false,
  // ── backward compat (legacy) ────────────────────────────────────────────
  luoi_ria_ben:         false,
  kien_truc_su:         false,
});

// V2 — Helper đọc daily goal settings từ localStorage (tránh circular import từ settingsStore)
function readDailyGoalSettings() {
  if (typeof window === 'undefined') return { type: 'sessions', sessions: 5, minutes: 125 };
  try {
    const raw = readLocalStorageValue(SETTINGS_STORAGE_KEY, LEGACY_SETTINGS_STORAGE_KEYS);
    if (!raw) return { type: 'sessions', sessions: 5, minutes: 125 };
    const parsed = JSON.parse(raw);
    const state = parsed?.state ?? parsed;
    return {
      type: state.dailyGoalType === 'minutes' ? 'minutes' : 'sessions',
      sessions: Number.isFinite(state.dailyGoalSessions) ? state.dailyGoalSessions : 5,
      minutes: Number.isFinite(state.dailyGoalMinutes) ? state.dailyGoalMinutes : 125,
    };
  } catch {
    return { type: 'sessions', sessions: 5, minutes: 125 };
  }
}

// Map skills V1 → V2: dùng cho migration refund SP và unlock thay thế.
// Nếu user có skill V1 unlocked, refund SP và cho phép unlock skill mới tương ứng.
const REMOVED_SKILLS_V1_TO_V2 = {
  khoi_dong_nhanh:    { sp: 3,  replacement: 'vao_guong' },
  y_chi_thep:         { sp: 14, replacement: 'la_chan_streak' },
  bat_khuat:          { sp: 22, replacement: 'ben_vung' },
  kho_du_tru:         { sp: 7,  replacement: 'tich_phien' },
  nghi_ngoi_hoan_hao: { sp: 22, replacement: 'nhip_hoan_hao' },
  be_cong_thoi_gian:  { sp: 7,  replacement: 'loc_ban_tang' },
  chuyen_gia:         { sp: 3,  replacement: 'nguoi_lap_ke' },
  da_nang:            { sp: 3,  replacement: 'cu_tri' },
  chuyen_mon_hoa:     { sp: 7,  replacement: 'co_van' },
  can_bang:           { sp: 7,  replacement: 'lich_day' },
  lam_nong_nhanh:     { sp: 3,  replacement: 'vao_guong' }, // legacy alias
};

const makeDefaultTimerConfig = () => ({
  mode: 'pomodoro',
  focusMinutes: 25,
  breakMinutes: 5,
  strictMode:   true,
});

function normalizeStoredTimerConfig(timerConfig = {}) {
  const defaults = makeDefaultTimerConfig();
  const focusMinutes = Number.isFinite(timerConfig?.focusMinutes)
    ? Math.min(180, Math.max(1, Math.round(timerConfig.focusMinutes)))
    : defaults.focusMinutes;
  const breakMinutes = Number.isFinite(timerConfig?.breakMinutes)
    ? Math.min(60, Math.max(1, Math.round(timerConfig.breakMinutes)))
    : defaults.breakMinutes;

  return {
    ...defaults,
    ...timerConfig,
    mode: timerConfig?.mode === 'stopwatch'
      ? 'stopwatch'
      : timerConfig?.mode === 'pomodoro'
        ? 'pomodoro'
        : defaults.mode,
    focusMinutes,
    breakMinutes,
    strictMode: typeof timerConfig?.strictMode === 'boolean'
      ? timerConfig.strictMode
      : defaults.strictMode,
  };
}

const makeDefaultForgiveness = (referenceTs = Date.now()) => ({
  chargesRemaining: FORGIVENESS_CANCELS_PER_WEEK,
  weekStartTimestamp: referenceTs,
});

const makeDefaultRankSystem = () => ({
  book1:  0,  // rank index in era 1 (0–7)
  book2:  0,
  book3:  0,
  book4:  0,
  book5:  0,
  book6:  0,
  book7:  0,
  book8:  0,
  book9:  0,
  book10: 0,
  book11: 0,
  book12: 0,
  book13: 0,
  book14: 0,
  book15: 0,
});

const makeDefaultEraCrisis = () => ({
  active:                    false,
  crisisId:                  null,
  name:                      null,
  icon:                      null,
  description:               null,
  sacrificeOption:           null,
  challengeOption:           null,
  choiceMade:                null,  // null | 'sacrifice' | 'challenge'
  challengeDeadline:         null,
  challengeSessionsRequired: 0,
  challengeMinMinutes:       0,
  challengeSessionsDone:     0,
  passed:                    false,
  relicEarned:               null,
});

const makeDefaultAchievements = () => ({
  unlocked: [],
  timeline: {},
});

const achievementHydrationState = {
  shouldPersistBackfilledTimeline: false,
};

function normalizeAchievementTimelineEntry(entry, fallbackOrder = 0) {
  if (typeof entry === 'string') {
    return { unlockedAt: entry, order: fallbackOrder, source: 'stored' };
  }

  const unlockedAt = typeof entry?.unlockedAt === 'string' ? entry.unlockedAt : null;
  const order = Number.isFinite(entry?.order) ? entry.order : fallbackOrder;
  const source = unlockedAt && entry?.source === 'inferred' ? 'inferred' : 'stored';
  return { unlockedAt, order, source: unlockedAt ? source : null };
}

function normalizeAchievementsState(achievements) {
  const unlocked = Array.isArray(achievements?.unlocked)
    ? [...new Set(achievements.unlocked.filter((id) => typeof id === 'string' && id.trim().length > 0))]
    : [];
  const rawTimeline = achievements?.timeline && typeof achievements.timeline === 'object'
    ? achievements.timeline
    : {};

  const timeline = {};
  unlocked.forEach((id, index) => {
    timeline[id] = normalizeAchievementTimelineEntry(rawTimeline[id], index + 1);
  });

  return {
    ...makeDefaultAchievements(),
    ...achievements,
    unlocked,
    timeline,
  };
}

function mergeInferredAchievementTimeline(achievements, inferredTimeline = {}) {
  const inferredIds = Object.keys(inferredTimeline);
  if (inferredIds.length === 0) {
    return { achievements, didBackfill: false };
  }

  const unlockedOrder = new Map(achievements.unlocked.map((id, index) => [id, index + 1]));
  const nextTimeline = { ...achievements.timeline };
  let didBackfill = false;

  inferredIds.forEach((id) => {
    if (!unlockedOrder.has(id)) return;

    const currentEntry = normalizeAchievementTimelineEntry(nextTimeline[id], unlockedOrder.get(id));
    if (currentEntry.unlockedAt) return;

    nextTimeline[id] = {
      ...currentEntry,
      unlockedAt: inferredTimeline[id],
      source: 'inferred',
    };
    didBackfill = true;
  });

  return {
    achievements: didBackfill
      ? {
        ...achievements,
        timeline: nextTimeline,
      }
      : achievements,
    didBackfill,
  };
}

function normalizeAchievementsStateWithTimeline(achievements, history = []) {
  const normalized = normalizeAchievementsState(achievements);
  const inferredTimeline = inferAchievementUnlockTimes(
    history,
    normalized.unlocked,
    normalized.timeline,
  );
  return mergeInferredAchievementTimeline(normalized, inferredTimeline);
}

function appendAchievementUnlocks(achievements, newlyUnlocked = [], unlockedAt = new Date().toISOString()) {
  const normalized = normalizeAchievementsState(achievements);
  if (!Array.isArray(newlyUnlocked) || newlyUnlocked.length === 0) {
    return normalized;
  }

  const nextUnlocked = [...normalized.unlocked];
  const nextTimeline = { ...normalized.timeline };
  const existingIds = new Set(nextUnlocked);
  let nextOrder = Object.values(nextTimeline).reduce(
    (maxOrder, entry) => Math.max(maxOrder, entry?.order ?? 0),
    0,
  );
  const resolvedUnlockedAt = typeof unlockedAt === 'string'
    ? unlockedAt
    : new Date(unlockedAt).toISOString();

  newlyUnlocked.forEach((id) => {
    if (!id || existingIds.has(id)) return;
    nextOrder += 1;
    nextUnlocked.push(id);
    nextTimeline[id] = { unlockedAt: resolvedUnlockedAt, order: nextOrder, source: 'stored' };
    existingIds.add(id);
  });

  return {
    ...normalized,
    unlocked: nextUnlocked,
    timeline: nextTimeline,
  };
}

// ─── FACTORY: STREAK ──────────────────────────────────────────────────────────
const makeDefaultStreak = () => ({
  currentStreak:  0,
  longestStreak:  0,
  lastActiveDate: null,         // 'YYYY-MM-DD'
  // V2: Lá Chắn Streak — cho phép 1 ngày skip/tuần không reset
  skipShieldUsedWeekKey: null,  // 'YYYY-MM-DD' (Monday) — week mà shield đã dùng
});

function refreshStreakIfExpired(streak, referenceTs = Date.now(), unlockedSkills = null) {
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

function advanceStreak(streak, unlockedSkills = null) {
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

// ─── FACTORY: MISSIONS ────────────────────────────────────────────────────────
const makeDefaultMissions = () => ({
  date:                       null,
  list:                       [],
  bonusClaimedToday:          false,
  streakMissionClaimedToday:  false,
  recentHistory:              [],
});

const DAILY_MISSION_HISTORY_LIMIT = 8;
const DAILY_MISSION_VARIANT_COUNT = 10;
const WEEKLY_CHAIN_HISTORY_LIMIT = 10;

function createSeededRng(seedKey) {
  let seed = 1779033703 ^ seedKey.length;
  for (let i = 0; i < seedKey.length; i += 1) {
    seed = Math.imul(seed ^ seedKey.charCodeAt(i), 3432918353);
    seed = (seed << 13) | (seed >>> 19);
  }
  seed = Math.imul(seed ^ (seed >>> 16), 2246822507);
  seed = Math.imul(seed ^ (seed >>> 13), 3266489909);
  seed = (seed ^ (seed >>> 16)) >>> 0;
  return () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function countWords(text = '') {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function getMissionRewardTotalXP(list = []) {
  return list.reduce((sum, mission) => sum + (mission?.rewardXP ?? 0), 0);
}

function normalizeMissionTemplate(mission) {
  if (!mission?.id) return mission ?? null;
  const template = MISSION_CATALOG.find((entry) => entry.id === mission.id);
  if (!template) return mission;
  return {
    ...mission,
    ...template,
    progress: Number.isFinite(mission.progress) ? mission.progress : 0,
    claimed: Boolean(mission.claimed),
    family: template.family ?? mission.family,
    bucket: template.bucket ?? mission.bucket,
    weight: template.weight ?? mission.weight ?? 1,
  };
}

function normalizeStoredMissions(missions) {
  const list = Array.isArray(missions?.list)
    ? missions.list.map(normalizeMissionTemplate).filter((mission) => mission?.id)
    : [];
  const recentHistory = Array.isArray(missions?.recentHistory)
    ? missions.recentHistory.filter((entry) => entry?.date)
    : [];
  return {
    ...makeDefaultMissions(),
    ...missions,
    date: typeof missions?.date === 'string' ? missions.date : null,
    list,
    recentHistory,
    bonusClaimedToday: Boolean(missions?.bonusClaimedToday),
    streakMissionClaimedToday: Boolean(missions?.streakMissionClaimedToday),
  };
}

function weightedPick(list, rng) {
  if (list.length === 0) return null;
  const totalWeight = list.reduce((sum, mission) => sum + Math.max(0.01, mission.weight ?? 1), 0);
  let roll = rng() * totalWeight;
  for (const mission of list) {
    roll -= Math.max(0.01, mission.weight ?? 1);
    if (roll <= 0) return mission;
  }
  return list[list.length - 1];
}

function createMissionHistoryEntry(date, list = []) {
  const normalized = list
    .map(normalizeMissionTemplate)
    .filter(Boolean);
  if (!date || normalized.length === 0) return null;
  return {
    date,
    ids: normalized.map((mission) => mission.id),
    families: [...new Set(normalized.map((mission) => mission.family).filter(Boolean))],
  };
}

function historyEntryHasRareMission(entry) {
  const ids = Array.isArray(entry?.ids) ? entry.ids : [];
  return ids.some((missionId) =>
    MISSION_CATALOG.some((mission) => mission.id === missionId && mission.bucket === 'rare')
  );
}

function rollMissionHistory(missions, nextDate) {
  let recentHistory = Array.isArray(missions?.recentHistory)
    ? missions.recentHistory.filter((entry) => entry?.date && entry.date !== nextDate)
    : [];

  if (missions?.date && missions.date !== nextDate) {
    const todayEntry = createMissionHistoryEntry(missions.date, missions.list);
    if (todayEntry && !recentHistory.some((entry) => entry.date === todayEntry.date)) {
      recentHistory = [todayEntry, ...recentHistory];
    }
  }

  return recentHistory.slice(0, DAILY_MISSION_HISTORY_LIMIT);
}

function scoreMissionCandidate(candidate, recentHistory = []) {
  const candidateIds = candidate.map((mission) => mission.id);
  const candidateIdSet = new Set(candidateIds);
  const candidateFamilies = candidate.map((mission) => mission.family).filter(Boolean);
  const candidateFamilySet = new Set(candidateFamilies);
  const candidateSignature = [...candidateIds].sort().join('|');

  let score = candidate.reduce((sum, mission) => {
    let nextScore = sum + (mission.weight ?? 1);
    if (mission.family === 'blueprints') nextScore -= 0.5;
    if (mission.family === 'deepSessions' || mission.family === 'balancedSessions') nextScore += 0.4;
    return nextScore;
  }, 0);

  recentHistory.forEach((entry, index) => {
    const recencyWeight = Math.max(0.35, 1 - index * 0.15);
    const entryIds = new Set(Array.isArray(entry?.ids) ? entry.ids : []);
    const entryFamilies = new Set(Array.isArray(entry?.families) ? entry.families : []);
    const entrySignature = [...entryIds].sort().join('|');

    if (entrySignature && entrySignature === candidateSignature) {
      score -= 12 * recencyWeight;
    }

    candidateIdSet.forEach((missionId) => {
      score += entryIds.has(missionId) ? -4.5 * recencyWeight : 1.1 * recencyWeight;
    });

    candidateFamilySet.forEach((family) => {
      score += entryFamilies.has(family) ? -0.4 * recencyWeight : 0.25 * recencyWeight;
    });
  });

  return score;
}

function pickMissionForBucket(bucket, rng, usedIds, usedFamilies) {
  const basePool = MISSION_CATALOG.filter((mission) =>
    mission.bucket === bucket && !usedIds.has(mission.id)
  );
  const distinctFamilyPool = basePool.filter((mission) => !usedFamilies.has(mission.family));
  const fallbackPool = distinctFamilyPool.length > 0
    ? distinctFamilyPool
    : (basePool.length > 0 ? basePool : MISSION_CATALOG.filter((mission) => !usedIds.has(mission.id)));
  return weightedPick(fallbackPool, rng);
}

function shouldIncludeRareMission(dateStr, recentHistory = []) {
  if (!MISSION_CATALOG.some((mission) => mission.bucket === 'rare')) return false;
  if (recentHistory.slice(0, 2).some(historyEntryHasRareMission)) return false;
  const rareChance =
    DAILY_RARE_BUCKET_CHANCE_MIN
    + createSeededRng(`daily-rare-chance:${dateStr}`)()
      * (DAILY_RARE_BUCKET_CHANCE_MAX - DAILY_RARE_BUCKET_CHANCE_MIN);
  const rareRoll = createSeededRng(`daily-rare-roll:${dateStr}`)();
  return rareRoll < rareChance;
}

function buildDailyMissionVariant(dateStr, variant, { includeRare = false } = {}) {
  const rng = createSeededRng(`daily:${dateStr}:${includeRare ? 'rare' : 'normal'}:${variant}`);
  const buckets = ['core', includeRare ? 'rare' : 'stretch', 'variety'];
  const usedIds = new Set();
  const usedFamilies = new Set();
  const selected = [];

  for (const bucket of buckets.slice(0, MISSIONS_PER_DAY)) {
    const mission = pickMissionForBucket(bucket, rng, usedIds, usedFamilies)
      ?? (bucket === 'rare' ? pickMissionForBucket('stretch', rng, usedIds, usedFamilies) : null);
    if (!mission) continue;
    usedIds.add(mission.id);
    usedFamilies.add(mission.family);
    selected.push({
      ...mission,
      progress: 0,
      claimed:  false,
    });
  }

  return selected;
}

function pickDailyMissions(dateStr, previousList = []) {
  const includeRare = shouldIncludeRareMission(dateStr, previousList);
  const variants = Array.from({ length: DAILY_MISSION_VARIANT_COUNT }, (_, variant) =>
    buildDailyMissionVariant(dateStr, variant, { includeRare })
  ).filter((candidate) => candidate.length > 0);

  if (variants.length === 0) return [];

  let bestCandidate = variants[0];
  let bestScore = scoreMissionCandidate(bestCandidate, previousList);
  for (const candidate of variants.slice(1)) {
    const score = scoreMissionCandidate(candidate, previousList);
    if (score > bestScore) {
      bestCandidate = candidate;
      bestScore = score;
    }
  }

  return bestCandidate;
}

function refreshMissionsIfStale(missions) {
  const today = localDateStr();
  const normalizedMissions = normalizeStoredMissions(missions);
  if (normalizedMissions.date === today && normalizedMissions.list.length > 0) {
    return normalizedMissions;
  }
  const recentHistory = rollMissionHistory(normalizedMissions, today);
  return {
    ...normalizedMissions,
    date: today,
    list: pickDailyMissions(today, recentHistory),
    bonusClaimedToday: false,
    streakMissionClaimedToday: false,
    recentHistory,
  };
}

// ─── FACTORY: STAKING ─────────────────────────────────────────────────────────
const makeDefaultStaking = () => ({
  active:          false,
  stakedEP:        0,
  startedAt:       null,
  rewardMultiplier: OVERCLOCK_REWARD_MULTIPLIER,
});

function applyOverclockRewardBonus(baseReward = {}, rewardMultiplier = 1) {
  if (!Number.isFinite(rewardMultiplier) || rewardMultiplier <= 1) return baseReward;

  return {
    ...baseReward,
    finalXP: Math.round((baseReward.finalXP ?? 0) * rewardMultiplier),
    finalEP: Math.round((baseReward.finalEP ?? 0) * rewardMultiplier),
    finalEXP: Math.round((baseReward.finalEXP ?? baseReward.finalXP ?? 0) * rewardMultiplier),
    multiplier: (baseReward.multiplier ?? 1) * rewardMultiplier,
    resources: Object.fromEntries(
      Object.entries(baseReward.resources ?? {}).map(([resourceId, amount]) => ([
        resourceId,
        Math.max(0, Math.round((amount ?? 0) * rewardMultiplier)),
      ])),
    ),
    rpEarned: Math.round((baseReward.rpEarned ?? 0) * rewardMultiplier),
    t2Drop: Math.round((baseReward.t2Drop ?? 0) * rewardMultiplier * 100) / 100,
  };
}

// ─── HELPER: Tuần hiện tại (key = ngày thứ Hai) ──────────────────────────────
function getWeekMonday(ts = Date.now()) {
  return localWeekMondayStr(ts);
}

function normalizeWeeklyChainHistoryEntry(entry) {
  if (!entry?.weekKey || !entry?.chainId) return null;
  return {
    weekKey: entry.weekKey,
    chainId: entry.chainId,
    stepTypes: Array.isArray(entry.stepTypes) ? entry.stepTypes : [],
  };
}

function createWeeklyChainHistoryEntry(weekKey, chainIndex) {
  if (!weekKey || !Number.isFinite(chainIndex) || !WEEKLY_CHAINS[chainIndex]) return null;
  return {
    weekKey,
    chainId: WEEKLY_CHAINS[chainIndex].id,
    stepTypes: [...new Set(WEEKLY_CHAINS[chainIndex].steps.map((step) => step.type))],
  };
}

function rollWeeklyChainHistory(wc, nextWeekKey) {
  let recentHistory = Array.isArray(wc?.recentHistory)
    ? wc.recentHistory
      .map(normalizeWeeklyChainHistoryEntry)
      .filter((entry) => entry?.weekKey && entry.weekKey !== nextWeekKey)
    : [];

  if (wc?.weekKey && wc.weekKey !== nextWeekKey) {
    const currentEntry = createWeeklyChainHistoryEntry(wc.weekKey, wc.chainIndex);
    if (currentEntry && !recentHistory.some((entry) => entry.weekKey === currentEntry.weekKey)) {
      recentHistory = [currentEntry, ...recentHistory];
    }
  }

  return recentHistory.slice(0, WEEKLY_CHAIN_HISTORY_LIMIT);
}

function scoreWeeklyChainCandidate(chainIndex, recentHistory = []) {
  const chain = WEEKLY_CHAINS[chainIndex];
  if (!chain) return Number.NEGATIVE_INFINITY;

  const chainId = chain.id;
  const stepTypes = [...new Set(chain.steps.map((step) => step.type))];
  const stepTypeSet = new Set(stepTypes);
  const recentUses = recentHistory.filter((entry) => entry.chainId === chainId).length;
  let score = 0;

  stepTypes.forEach((type) => {
    if (type === 'perfectBreaks' || type === 'balancedDays' || type === 'deepSessions') score += 0.45;
    if (type === 'sessions' || type === 'focusMinutes') score -= 0.1;
  });
  score -= recentUses * 2.4;

  recentHistory.forEach((entry, index) => {
    const recencyWeight = Math.max(0.4, 1 - index * 0.18);
    const priorTypes = new Set(entry.stepTypes ?? []);
    if (entry.chainId === chainId) score -= 10 * recencyWeight;
    stepTypeSet.forEach((type) => {
      score += priorTypes.has(type) ? -0.45 * recencyWeight : 0.12 * recencyWeight;
    });
  });

  return score;
}

function pickChainForWeek(weekKey, recentHistory = []) {
  const rng = createSeededRng(`weekly:${weekKey}`);
  const allChainIndexes = WEEKLY_CHAINS.map((_, chainIndex) => chainIndex);
  const recentWindow = Math.min(WEEKLY_CHAINS.length - 2, recentHistory.length);
  const blockedIds = new Set(
    recentHistory.slice(0, recentWindow).map((entry) => entry.chainId)
  );
  const candidateIndexes = allChainIndexes.filter((chainIndex) =>
    !blockedIds.has(WEEKLY_CHAINS[chainIndex].id)
  );
  const pool = candidateIndexes.length > 0 ? candidateIndexes : allChainIndexes;
  const candidates = pool.map((chainIndex) => ({
    chainIndex,
    score: scoreWeeklyChainCandidate(chainIndex, recentHistory) + rng() * 0.35,
  }));
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.chainIndex ?? 0;
}

// ─── FACTORY: WEEKLY CHAIN ────────────────────────────────────────────────────
const makeDefaultWeeklyChain = () => ({
  weekKey:      null,
  chainIndex:   0,
  currentStep:  0,
  stepProgress: 0,     // tích lũy cho bước hiện tại
  bonusClaimed: false,
  recentHistory: [],
});

function refreshWeeklyChain(wc) {
  const monday = getWeekMonday();
  if (wc.weekKey === monday) return wc;
  const recentHistory = rollWeeklyChainHistory(wc, monday);
  return {
    weekKey:      monday,
    chainIndex:   pickChainForWeek(monday, recentHistory),
    currentStep:  0,
    stepProgress: 0,
    bonusClaimed: false,
    recentHistory,
  };
}

function getHistoryWeekEntries(history, weekKey) {
  return history.filter((entry) => {
    const sessionTs = new Date(entry.timestamp).getTime();
    const breakTs = entry.breakCompletedAt
      ? new Date(entry.breakCompletedAt).getTime()
      : NaN;
    const sessionMatches = Number.isFinite(sessionTs) && getWeekMonday(sessionTs) === weekKey;
    const breakMatches = Number.isFinite(breakTs) && getWeekMonday(breakTs) === weekKey;
    return sessionMatches || breakMatches;
  });
}

function buildWeeklyProgressSnapshot(weekEntries = [], weekKey = null) {
  const categorySet = new Set();
  const activeDays = new Set();
  const balancedDayMap = {};
  let sessions = 0;
  let focusMinutes = 0;
  let notes = 0;
  let deepSessions = 0;
  let perfectBreaks = 0;
  let maxSessionMinutes = 0;

  weekEntries.forEach((entry) => {
    if (!entry) return;
    const sessionTs = new Date(entry.timestamp).getTime();
    const sessionInWeek = Number.isFinite(sessionTs) && (!weekKey || getWeekMonday(sessionTs) === weekKey);
    const breakTs = entry.breakCompletedAt
      ? new Date(entry.breakCompletedAt).getTime()
      : (entry.breakCompletedOnTime ? sessionTs : NaN);
    const breakInWeek = Number.isFinite(breakTs) && (!weekKey || getWeekMonday(breakTs) === weekKey);
    const minutes = Number(entry.minutes) || 0;

    if (sessionInWeek) {
      sessions += 1;
      focusMinutes += minutes;
      maxSessionMinutes = Math.max(maxSessionMinutes, minutes);
      if (entry.categoryId) categorySet.add(entry.categoryId);
      if (countWords(entry.note ?? '') >= MISSION_NOTE_MIN_WORDS) notes += 1;
      if (minutes >= 45) deepSessions += 1;

      const dayKey = localDateStr(new Date(sessionTs));
      activeDays.add(dayKey);
      const day = balancedDayMap[dayKey] ?? { hasShort: false, hasLong: false };
      day.hasShort = day.hasShort || minutes <= 25;
      day.hasLong = day.hasLong || minutes >= 60;
      balancedDayMap[dayKey] = day;
    }

    if (entry.breakCompletedOnTime && breakInWeek) perfectBreaks += 1;
  });

  const balancedDays = Object.values(balancedDayMap)
    .filter((day) => day.hasShort && day.hasLong)
    .length;

  return {
    sessions,
    focusMinutes,
    uniqueCategories: categorySet.size,
    notes,
    daysActive: activeDays.size,
    deepSessions,
    balancedDays,
    perfectBreaks,
    maxSessionMinutes,
  };
}

function getWeeklyStepProgress(step, snapshot) {
  if (!step) return 0;
  switch (step.type) {
    case 'sessions':
      return Math.min(step.goal, snapshot.sessions);
    case 'focusMinutes':
      return Math.min(step.goal, snapshot.focusMinutes);
    case 'singleSession':
      return Math.min(step.goal, snapshot.maxSessionMinutes);
    case 'uniqueCategories':
      return Math.min(step.goal, snapshot.uniqueCategories);
    case 'notes':
      return Math.min(step.goal, snapshot.notes);
    case 'daysActive':
      return Math.min(step.goal, snapshot.daysActive);
    case 'deepSessions':
      return Math.min(step.goal, snapshot.deepSessions);
    case 'balancedDays':
      return Math.min(step.goal, snapshot.balancedDays);
    case 'perfectBreaks':
      return Math.min(step.goal, snapshot.perfectBreaks);
    default:
      return 0;
  }
}

// ─── FACTORY: DAILY TRACKING ─────────────────────────────────────────────────
const makeDefaultDailyTracking = () => ({
  date:              null,   // 'YYYY-MM-DD'
  sessionsCompleted: 0,
  categoriesUsed:    [],     // string[] — danh mục đã dùng hôm nay
  deepSessionsCompleted: 0,
  hasShortSession:   false,  // ≤25 phút (legacy, giữ cho backward compat)
  hasLongSession:    false,  // ≥60 phút (legacy, giữ cho backward compat)
  hasSession45:      false,  // V2: ≥45 phút (cho Lịch Đầy)
  hasSession60:      false,  // V2: ≥60 phút (cho Lịch Đầy)
  justEnteredNewEra: false,
});

// ─── FACTORY: SKILL ACTIVATIONS (khả năng chủ động) ─────────────────────────
const makeDefaultSkillActivations = () => ({
  superFocusActive:      false,
  superFocusChargesUsed: 0,
  luckyModeActive:       false,
  luckyModeChargesUsed:  0,
  lastResetDate:         null,  // 'YYYY-MM-DD' — reset charges hàng ngày
});

// ─── FACTORY: CATEGORY TRACKING ──────────────────────────────────────────────
const makeDefaultCategoryTracking = () => ({
  lastCategoryId:    null,
  consecutiveCount:  0,
});

// ─── FACTORY: ERA TRACKING ───────────────────────────────────────────────────
const makeDefaultEraTracking = () => ({
  sessionsInCurrentEra: 0,
  currentEraBook:       1,
  erasCompleted:        0,
});

// ─── FACTORY: SESSION META ───────────────────────────────────────────────────
const makeDefaultSessionMeta = () => ({
  lastSessionCancelled:  false,
  breakCompletedOnTime:  false,
});

// ─── FACTORY: HỆ THỐNG NGHIÊN CỨU & CÔNG TRÌNH ──────────────────────────────

/** research: Điểm Nghiên Cứu + danh sách bản vẽ đã nghiên cứu */
const makeDefaultResearch = () => ({
  rp: 0,
  researched: [],
});

/** craftingQueue: hàng đợi xây dựng */
const makeDefaultCraftingQueue = () => [];
// Mỗi item: { bpId, sessionsRemaining, startedAt }

/** buildingHP: dữ liệu HP cũ, giữ lại để không làm hỏng save */
const makeDefaultBuildingHP = () => ({});
// { [bpId]: number }

/** resourcesRefined: nguyên liệu tinh luyện theo kỷ, giữ shape cũ để tương thích */
const makeDefaultResourcesRefined = () => ({
  1:{t2:0,t3:0}, 2:{t2:0,t3:0}, 3:{t2:0,t3:0}, 4:{t2:0,t3:0}, 5:{t2:0,t3:0},
  6:{t2:0,t3:0}, 7:{t2:0,t3:0}, 8:{t2:0,t3:0}, 9:{t2:0,t3:0}, 10:{t2:0,t3:0},
  11:{t2:0,t3:0}, 12:{t2:0,t3:0}, 13:{t2:0,t3:0}, 14:{t2:0,t3:0}, 15:{t2:0,t3:0},
});

function normalizeStoredResources(resources = {}) {
  const next = makeEmptyResources();

  for (const [bookKey, bookResources] of Object.entries(resources ?? {})) {
    if (!next[bookKey] || !bookResources || typeof bookResources !== 'object') continue;
    for (const [resourceId, amount] of Object.entries(bookResources)) {
      const normalizedId = normalizeRawResourceId(resourceId);
      if (!(normalizedId in next[bookKey])) continue;
      next[bookKey][normalizedId] += Number.isFinite(amount) ? amount : 0;
    }
  }

  return next;
}

function normalizeStoredResearch(research = {}) {
  return {
    rp: Number.isFinite(research?.rp) ? research.rp : 0,
    researched: Array.isArray(research?.researched) ? [...research.researched] : [],
  };
}

function normalizeStoredRefined(resourcesRefined = {}) {
  const next = makeDefaultResourcesRefined();
  for (const [era, refined] of Object.entries(resourcesRefined ?? {})) {
    next[era] = normalizeRefinedBag(refined);
  }
  return next;
}

function spendRawResources(bookBag = {}, totalCost = 0) {
  const entries = Object.entries(bookBag)
    .sort(([, left], [, right]) => right - left);
  const updated = { ...bookBag };
  let remaining = totalCost;

  for (const [resourceId, amount] of entries) {
    if (remaining <= 0) break;
    const spend = Math.min(amount ?? 0, remaining);
    updated[resourceId] = Math.max(0, (updated[resourceId] ?? 0) - spend);
    remaining -= spend;
  }

  return remaining > 0 ? null : updated;
}

// ─── HELPER: Tổng hợp tác động Wonder từ danh sách công trình ─────────────────
function aggregateWonderEffects(buildings) {
  const effects = new Set();
  for (const bpId of buildings) {
    const eff = BUILDING_EFFECTS[bpId];
    if (eff?.type === 'wonder' && eff.wonderEffect) effects.add(eff.wonderEffect);
  }
  return effects;
}

// ─── HELPER: Bonus RP từ Wonder effects đang hoạt động ────────────────────────
function getWonderRPBonus(buildings) {
  const wonders = aggregateWonderEffects(buildings);
  let bonus = 0;
  if (wonders.has('research_speed_25')) bonus += 0.25;
  if (wonders.has('gacha_pity_minus5')) bonus += 0.25;
  if (wonders.has('research_speed_30')) bonus += 0.30;
  return bonus;
}

function getWonderForgivenessCapacity(buildings) {
  const wonders = aggregateWonderEffects(buildings);
  return FORGIVENESS_CANCELS_PER_WEEK + (wonders.has('extra_forgiveness') ? 1 : 0);
}

function getWonderRefinedCraftCost(buildings) {
  const wonders = aggregateWonderEffects(buildings);
  if (!wonders.has('cheaper_t2_craft')) return T2_CRAFT_COST;
  return Math.max(4, Math.round(T2_CRAFT_COST * 0.75));
}

function getWonderResearchCost(buildings, bpId, baseCost) {
  const wonders = aggregateWonderEffects(buildings);
  const meta = BLUEPRINT_META[bpId];
  let cost = Math.max(0, Math.round(baseCost ?? 0));

  if (meta && wonders.has('t2_research_25off') && meta.era >= 6 && meta.era <= 10) {
    cost = Math.round(cost * 0.75);
  }

  return Math.max(1, cost);
}

function getWonderRelicEvolutionCost(buildings, stageDef) {
  const wonders = aggregateWonderEffects(buildings);
  let cost = getRelicEvolutionRefinedCost(stageDef);
  if (wonders.has('relic_evo_30off')) {
    cost = Math.round(cost * 0.7);
  }
  return Math.max(1, cost);
}

function getWonderRawRewardMultiplier(buildings) {
  const wonders = aggregateWonderEffects(buildings);
  let multiplier = 1;
  if (wonders.has('building_hp_boost')) multiplier += 0.15;
  return multiplier;
}

function getWonderExtraRefinedReward(buildings, minutesFocused) {
  const wonders = aggregateWonderEffects(buildings);
  let bonus = 0;
  if (wonders.has('deep_session_refined_bonus') && minutesFocused >= 90) bonus += 1;
  return bonus;
}

function getEconomyRewardModifiers(buildings, buildingLevels = {}) {
  let rawBonus = 0;
  let refinedBonus = 0;

  for (const bpId of buildings) {
    const eff = BUILDING_EFFECTS[bpId];
    if (eff?.type !== 'economy') continue;

    const levelMultiplier = getBuildingLevelMultiplier(buildingLevels?.[bpId] ?? 1);
    rawBonus += (eff.t1DropBonus ?? 0) * levelMultiplier;
    refinedBonus += (eff.t2DropBonus ?? 0) * levelMultiplier;
  }

  return {
    rawMultiplier: 1 + rawBonus,
    refinedMultiplier: 1 + refinedBonus,
  };
}

function getWonderCancelPenaltyMultiplier(buildings) {
  const wonders = aggregateWonderEffects(buildings);
  let multiplier = 1;
  if (wonders.has('building_hp_boost')) multiplier *= 0.85;
  if (wonders.has('disaster_hp_50off')) multiplier *= 0.5;
  return multiplier;
}

function getBuildingCancelPenaltyMultiplier(buildings, buildingLevels = {}) {
  let reduction = 0;

  for (const bpId of buildings) {
    const eff = BUILDING_EFFECTS[bpId];
    if (eff?.type !== 'defense') continue;

    const levelMultiplier = getBuildingLevelMultiplier(buildingLevels?.[bpId] ?? 1);
    reduction += (eff.cancelLossReductionPct ?? 0) * levelMultiplier;
  }

  const cappedReduction = Math.min(reduction, 0.6);
  return 1 - cappedReduction;
}

function getWonderStreakBonusCap(buildings) {
  const wonders = aggregateWonderEffects(buildings);
  return STREAK_MAX_BONUS_DAYS + (wonders.has('streak_cap_plus') ? 10 : 0);
}

function getWonderCrisisWindowBonusHours(buildings) {
  const wonders = aggregateWonderEffects(buildings);
  return wonders.has('longer_crisis_window') ? 12 : 0;
}

function getDailyMissionXPBonusMultiplier(buildings) {
  const wonders = aggregateWonderEffects(buildings);
  let multiplier = 1;
  if (wonders.has('mission_bonus_20')) multiplier += 0.2;
  return multiplier;
}

function applyDailyMissionXPBonus(buildings, xpAmount) {
  const normalizedXP = Math.max(0, xpAmount ?? 0);
  return Math.round(normalizedXP * DAILY_MISSION_XP_SCALE * getDailyMissionXPBonusMultiplier(buildings));
}

// ─── FACTORY: TIMER SESSION (persist qua F5) ─────────────────────────────────
const makeDefaultTimerSession = () => ({
  isRunning:          false,
  mode:               'pomodoro',
  startedAt:          null,   // Date.now() thật khi bấm Start
  countdownStartedAt: null,   // mốc đã bù pause để tính clock của phiên
  pausedAt:           null,   // Date.now() khi bấm Pause
  pausedTotalMs:      0,
  pauseSegments:      [],
  categoryId:         null,
  categorySnapshot:   null,
  note:               '',
  goal:               '',
  nextNote:           '',
  totalSeconds:       null,   // thời lượng tham chiếu tại thời điểm Start
  extensionUnlocked:  false,  // đã chạm mốc 3 phút cuối và mở khóa cộng thêm phút
});

const makeDefaultBreakSession = () => ({
  isRunning:            false,
  startedAt:            null,
  endsAt:               null,
  totalSeconds:         0,
  isLong:               false,
  sourceSessionId:      null,
  passiveMinutesGranted: 0,
});

const LONG_BREAK_CYCLE_GRACE_MS = 60 * 60 * 1000;

const makeDefaultHistoryStats = () => ({
  bestSessionMinutes: 0,
  bestSessionXP: 0,
  bestSessionId: null,
  totalJackpots: 0,
  totalBlueprints: 0,
  sessionsWithGoal: 0,
  reviewedCount: 0,
  achievedCount: 0,
  missedCount: 0,
  pendingCount: 0,
});

function getHistoryReviewStatsContribution(entry = null) {
  const goal = typeof entry?.goal === 'string' ? entry.goal.trim() : '';
  if (!goal) {
    return {
      sessionsWithGoal: 0,
      reviewedCount: 0,
      achievedCount: 0,
      missedCount: 0,
      pendingCount: 0,
    };
  }

  if (entry?.goalAchieved === true) {
    return {
      sessionsWithGoal: 1,
      reviewedCount: 1,
      achievedCount: 1,
      missedCount: 0,
      pendingCount: 0,
    };
  }

  if (entry?.goalAchieved === false) {
    return {
      sessionsWithGoal: 1,
      reviewedCount: 1,
      achievedCount: 0,
      missedCount: 1,
      pendingCount: 0,
    };
  }

  return {
    sessionsWithGoal: 1,
    reviewedCount: 0,
    achievedCount: 0,
    missedCount: 0,
    pendingCount: 1,
  };
}

function applyHistoryReviewStatsDelta(historyStats, previousEntry = null, nextEntry = null) {
  const previousSummary = getHistoryReviewStatsContribution(previousEntry);
  const nextSummary = getHistoryReviewStatsContribution(nextEntry);

  return {
    ...historyStats,
    sessionsWithGoal: Math.max(0, historyStats.sessionsWithGoal - previousSummary.sessionsWithGoal + nextSummary.sessionsWithGoal),
    reviewedCount: Math.max(0, historyStats.reviewedCount - previousSummary.reviewedCount + nextSummary.reviewedCount),
    achievedCount: Math.max(0, historyStats.achievedCount - previousSummary.achievedCount + nextSummary.achievedCount),
    missedCount: Math.max(0, historyStats.missedCount - previousSummary.missedCount + nextSummary.missedCount),
    pendingCount: Math.max(0, historyStats.pendingCount - previousSummary.pendingCount + nextSummary.pendingCount),
  };
}

function buildHistoryStatsFromHistory(history = []) {
  let bestSessionMinutes = 0;
  let bestSessionXP = 0;
  let bestSessionId = null;
  let totalJackpots = 0;
  let totalBlueprints = 0;
  let sessionsWithGoal = 0;
  let reviewedCount = 0;
  let achievedCount = 0;
  let missedCount = 0;
  let pendingCount = 0;

  for (const entry of history) {
    const minutes = Number.isFinite(entry?.minutes) ? entry.minutes : 0;
    const xpEarned = Number.isFinite(entry?.xpEarned ?? entry?.epEarned)
      ? (entry.xpEarned ?? entry.epEarned)
      : 0;

    if (minutes > bestSessionMinutes) {
      bestSessionMinutes = minutes;
      bestSessionXP = xpEarned;
      bestSessionId = entry?.id ?? null;
    }

    if (entry?.jackpot) totalJackpots += 1;
    if ((entry?.refinedEarned ?? 0) > 0 || minutes >= 45) totalBlueprints += 1;

    const reviewStats = getHistoryReviewStatsContribution(entry);
    sessionsWithGoal += reviewStats.sessionsWithGoal;
    reviewedCount += reviewStats.reviewedCount;
    achievedCount += reviewStats.achievedCount;
    missedCount += reviewStats.missedCount;
    pendingCount += reviewStats.pendingCount;
  }

  return {
    bestSessionMinutes,
    bestSessionXP,
    bestSessionId,
    totalJackpots,
    totalBlueprints,
    sessionsWithGoal,
    reviewedCount,
    achievedCount,
    missedCount,
    pendingCount,
  };
}

function normalizeStoredHistoryStats(historyStats = {}, history = []) {
  const fallback = buildHistoryStatsFromHistory(history);
  const hasStoredBest =
    Number.isFinite(historyStats?.bestSessionMinutes)
    && historyStats.bestSessionMinutes >= 0
    && Number.isFinite(historyStats?.bestSessionXP)
    && historyStats.bestSessionXP >= 0;

  return {
    bestSessionMinutes: hasStoredBest ? historyStats.bestSessionMinutes : fallback.bestSessionMinutes,
    bestSessionXP: hasStoredBest ? historyStats.bestSessionXP : fallback.bestSessionXP,
    bestSessionId: hasStoredBest ? (historyStats.bestSessionId ?? null) : fallback.bestSessionId,
    totalJackpots: Number.isFinite(historyStats?.totalJackpots)
      ? Math.max(0, historyStats.totalJackpots)
      : fallback.totalJackpots,
    totalBlueprints: Number.isFinite(historyStats?.totalBlueprints)
      ? Math.max(0, historyStats.totalBlueprints)
      : fallback.totalBlueprints,
    sessionsWithGoal: Number.isFinite(historyStats?.sessionsWithGoal)
      ? Math.max(0, historyStats.sessionsWithGoal)
      : fallback.sessionsWithGoal,
    reviewedCount: Number.isFinite(historyStats?.reviewedCount)
      ? Math.max(0, historyStats.reviewedCount)
      : fallback.reviewedCount,
    achievedCount: Number.isFinite(historyStats?.achievedCount)
      ? Math.max(0, historyStats.achievedCount)
      : fallback.achievedCount,
    missedCount: Number.isFinite(historyStats?.missedCount)
      ? Math.max(0, historyStats.missedCount)
      : fallback.missedCount,
    pendingCount: Number.isFinite(historyStats?.pendingCount)
      ? Math.max(0, historyStats.pendingCount)
      : fallback.pendingCount,
  };
}

const makeDefaultProgress = () => ({
  totalEP: 0,
  activeBook: 1,
  sessionsCompleted: 0,
  totalFocusMinutes: 0,
  longBreakCycleStart: 0,
  longBreakGraceDeadlineAt: null,
  longBreakPreviewSession: false,
});

function normalizeLongBreakCycleProgress(progress = {}) {
  const sessionsCompleted = Number.isFinite(progress.sessionsCompleted)
    ? Math.max(0, progress.sessionsCompleted)
    : 0;
  const longBreakCycleStart = Number.isFinite(progress.longBreakCycleStart)
    ? Math.min(Math.max(0, progress.longBreakCycleStart), sessionsCompleted)
    : 0;

  return {
    ...progress,
    sessionsCompleted,
    longBreakCycleStart,
    longBreakGraceDeadlineAt: Number.isFinite(progress.longBreakGraceDeadlineAt)
      ? progress.longBreakGraceDeadlineAt
      : null,
    longBreakPreviewSession: Boolean(progress.longBreakPreviewSession),
  };
}

function syncLongBreakCycleProgress(progress = {}, referenceTs = Date.now()) {
  const normalized = normalizeLongBreakCycleProgress(progress);
  const deadline = normalized.longBreakGraceDeadlineAt;
  if (!Number.isFinite(deadline) || referenceTs <= deadline) {
    return normalized;
  }

  return {
    ...normalized,
    longBreakCycleStart: normalized.sessionsCompleted,
    longBreakGraceDeadlineAt: null,
    longBreakPreviewSession: false,
  };
}

function markLongBreakCycleBreakEnded(progress = {}, referenceTs = Date.now()) {
  const synced = syncLongBreakCycleProgress(progress, referenceTs);
  const activeCycleCount = Math.max(0, synced.sessionsCompleted - synced.longBreakCycleStart);

  return {
    ...synced,
    longBreakGraceDeadlineAt: activeCycleCount > 0 ? referenceTs + LONG_BREAK_CYCLE_GRACE_MS : null,
    longBreakPreviewSession: false,
  };
}

function markLongBreakCycleSessionStarted(progress = {}, referenceTs = Date.now()) {
  const synced = syncLongBreakCycleProgress(progress, referenceTs);
  return {
    ...synced,
    longBreakGraceDeadlineAt: null,
    longBreakPreviewSession: true,
  };
}

function normalizeStoredProgress(progress = {}, referenceTs = Date.now()) {
  const normalized = {
    ...makeDefaultProgress(),
    ...progress,
    totalEP: Number.isFinite(progress.totalEP) ? progress.totalEP : 0,
    activeBook: Number.isFinite(progress.activeBook) ? progress.activeBook : 1,
    totalFocusMinutes: Number.isFinite(progress.totalFocusMinutes) ? progress.totalFocusMinutes : 0,
  };

  return syncLongBreakCycleProgress(normalized, referenceTs);
}

function normalizeStoredPlayer(player = {}) {
  return {
    level: Number.isFinite(player?.level) ? player.level : 0,
    totalEXP: Number.isFinite(player?.totalEXP) ? player.totalEXP : 0,
    sp: Number.isFinite(player?.sp) ? player.sp : 0,
    unlockedSkills: {
      ...makeDefaultSkills(),
      ...(isRecord(player?.unlockedSkills) ? player.unlockedSkills : {}),
    },
    // V2 fields
    benVungUnlocked: !!player?.benVungUnlocked,
    locBanTangCounter: Number.isFinite(player?.locBanTangCounter) ? Math.max(0, player.locBanTangCounter) : 0,
    nhipHoanHaoStreakDays: Number.isFinite(player?.nhipHoanHaoStreakDays) ? Math.max(0, player.nhipHoanHaoStreakDays) : 0,
    nhipHoanHaoLastSixDate: typeof player?.nhipHoanHaoLastSixDate === 'string' ? player.nhipHoanHaoLastSixDate : null,
    nhipHoanHaoBonusDay: typeof player?.nhipHoanHaoBonusDay === 'string' ? player.nhipHoanHaoBonusDay : null,
    skillBuffQueue: Array.isArray(player?.skillBuffQueue) ? player.skillBuffQueue.filter(b => b && typeof b.type === 'string' && Number.isFinite(b.sessionsRemaining) && b.sessionsRemaining > 0) : [],
    keHoachWeeklyBuffWeekKey: typeof player?.keHoachWeeklyBuffWeekKey === 'string' ? player.keHoachWeeklyBuffWeekKey : null,
  };
}

// V2 Migration: refund SP cho skills V1 đã loại bỏ + xoá unlocked flags + reset state.
function migrateV1ToV2Skills(player = {}) {
  const safePlayer = isRecord(player) ? { ...player } : {};
  const unlockedSkills = isRecord(safePlayer.unlockedSkills) ? { ...safePlayer.unlockedSkills } : {};
  let refundedSP = 0;
  const removedSkills = [];

  for (const [oldId, info] of Object.entries(REMOVED_SKILLS_V1_TO_V2)) {
    if (unlockedSkills[oldId]) {
      refundedSP += info.sp;
      removedSkills.push(oldId);
      unlockedSkills[oldId] = false;
    }
  }

  // Đảm bảo các skill mới ở default false
  const defaultSkills = makeDefaultSkills();
  for (const newId of Object.keys(defaultSkills)) {
    if (!(newId in unlockedSkills)) {
      unlockedSkills[newId] = false;
    }
  }

  return {
    ...safePlayer,
    sp: Math.max(0, (Number.isFinite(safePlayer.sp) ? safePlayer.sp : 0) + refundedSP),
    unlockedSkills,
    // Reset V2 state nếu chưa có
    benVungUnlocked: !!safePlayer.benVungUnlocked,
    locBanTangCounter: Number.isFinite(safePlayer.locBanTangCounter) ? safePlayer.locBanTangCounter : 0,
    nhipHoanHaoStreakDays: Number.isFinite(safePlayer.nhipHoanHaoStreakDays) ? safePlayer.nhipHoanHaoStreakDays : 0,
    nhipHoanHaoLastSixDate: typeof safePlayer.nhipHoanHaoLastSixDate === 'string' ? safePlayer.nhipHoanHaoLastSixDate : null,
    nhipHoanHaoBonusDay: typeof safePlayer.nhipHoanHaoBonusDay === 'string' ? safePlayer.nhipHoanHaoBonusDay : null,
    skillBuffQueue: Array.isArray(safePlayer.skillBuffQueue) ? safePlayer.skillBuffQueue : [],
    keHoachWeeklyBuffWeekKey: typeof safePlayer.keHoachWeeklyBuffWeekKey === 'string' ? safePlayer.keHoachWeeklyBuffWeekKey : null,
    _v2MigrationInfo: refundedSP > 0 ? { refundedSP, removedSkills } : null,
  };
}

function normalizeStoredForgiveness(forgiveness = {}, referenceTs = Date.now()) {
  const defaults = makeDefaultForgiveness(referenceTs);
  const safeForgiveness = isRecord(forgiveness) ? forgiveness : {};
  return {
    ...defaults,
    ...safeForgiveness,
    chargesRemaining: Number.isFinite(safeForgiveness.chargesRemaining)
      ? Math.max(0, safeForgiveness.chargesRemaining)
      : defaults.chargesRemaining,
    weekStartTimestamp: Number.isFinite(safeForgiveness.weekStartTimestamp)
      ? safeForgiveness.weekStartTimestamp
      : defaults.weekStartTimestamp,
  };
}

// ─── FACTORY: PRESTIGE ────────────────────────────────────────────────────────
const makeDefaultPrestige = () => ({
  count:          0,
  permanentBonus: 0,
  history:        [],
});

function normalizeStoredPrestige(prestige = {}) {
  const defaults = makeDefaultPrestige();
  const maxPermanentBonus = PRESTIGE_MAX_STACKS * PRESTIGE_BONUS_PER_RUN;

  return {
    ...defaults,
    ...prestige,
    count: Number.isFinite(prestige?.count)
      ? Math.max(0, Math.floor(prestige.count))
      : defaults.count,
    permanentBonus: Number.isFinite(prestige?.permanentBonus)
      ? Math.min(maxPermanentBonus, Math.max(0, prestige.permanentBonus))
      : defaults.permanentBonus,
    history: Array.isArray(prestige?.history)
      ? prestige.history
      : defaults.history,
  };
}

const makeDefaultCombo = () => ({
  count: 0,
  lastSessionTs: null,
});

function normalizeStoredCombo(combo = {}) {
  return {
    ...makeDefaultCombo(),
    count: Number.isFinite(combo?.count) ? Math.max(0, combo.count) : 0,
    lastSessionTs: Number.isFinite(combo?.lastSessionTs) ? combo.lastSessionTs : null,
  };
}

const makeDefaultUiState = () => ({
  lootModalOpen: false,
  pendingReward: null,
  disasterModalOpen: false,
  pendingDisaster: null,
  eraCrisisModalOpen: false,
  notificationCenterOpen: false,
  notificationFeed: [],
  levelUpQueue: [],
  relicNotification: null,
  rankUpNotification: null,
  achievementQueue: [],
  missionCompletedIds: [],
  prestigeModalOpen: false,
  isOnBreak: false,
  breakSecondsLeft: 0,
  breakTotalSeconds: 0,
  breakIsLong: false,
  activeBreakSessionId: null,
  weeklyReportOpen: false,
  weeklyReportMode: 'current',
});

function normalizePersistedGameState(persistedState, currentState, options = {}) {
  const persisted = isRecord(persistedState) ? persistedState : {};
  const current = currentState;
  const { trackAchievementBackfill = false } = options;
  const hasPersistedKey = (key) => Object.prototype.hasOwnProperty.call(persisted, key);
  const hasPersistedHistory = hasPersistedKey('history');
  const hasPersistedHistoryStats = hasPersistedKey('historyStats');
  const resolvedHistory = Array.isArray(persisted.history) ? persisted.history : current.history;
  const hydratedAchievements = hasPersistedKey('achievements')
    ? normalizeAchievementsStateWithTimeline(persisted.achievements, resolvedHistory)
    : { achievements: current.achievements, didBackfill: false };

  if (trackAchievementBackfill) {
    achievementHydrationState.shouldPersistBackfilledTimeline = hydratedAchievements.didBackfill;
  }

  return {
    ...current,
    ...persisted,
    player: hasPersistedKey('player') ? normalizeStoredPlayer(persisted.player) : current.player,
    progress: hasPersistedKey('progress')
      ? normalizeStoredProgress(persisted.progress)
      : current.progress,
    resources: hasPersistedKey('resources')
      ? normalizeStoredResources(persisted.resources)
      : current.resources,
    timerConfig: hasPersistedKey('timerConfig')
      ? normalizeStoredTimerConfig(persisted.timerConfig)
      : current.timerConfig,
    forgiveness: hasPersistedKey('forgiveness')
      ? normalizeStoredForgiveness(persisted.forgiveness)
      : current.forgiveness,
    rankSystem: hasPersistedKey('rankSystem')
      ? { ...makeDefaultRankSystem(), ...(isRecord(persisted.rankSystem) ? persisted.rankSystem : {}) }
      : current.rankSystem,
    rankChallenge: persisted.rankChallenge ?? current.rankChallenge,
    eraCrisis: hasPersistedKey('eraCrisis')
      ? { ...makeDefaultEraCrisis(), ...(isRecord(persisted.eraCrisis) ? persisted.eraCrisis : {}) }
      : current.eraCrisis,
    relics: Array.isArray(persisted.relics) ? persisted.relics : current.relics,
    blueprints: Array.isArray(persisted.blueprints) ? persisted.blueprints : current.blueprints,
    achievements: hydratedAchievements.achievements,
    history: resolvedHistory,
    historyStats: hasPersistedHistory || hasPersistedHistoryStats
      ? normalizeStoredHistoryStats(persisted.historyStats, resolvedHistory)
      : current.historyStats,
    savedNotes: Array.isArray(persisted.savedNotes)
      ? sanitizeSavedNotes(persisted.savedNotes)
      : hasPersistedHistory
        ? buildSavedNotesFromHistory(resolvedHistory)
        : current.savedNotes,
    sessionCategories: Array.isArray(persisted.sessionCategories) && persisted.sessionCategories.length > 0
      ? persisted.sessionCategories
      : current.sessionCategories,
    pendingCategoryId: persisted.pendingCategoryId ?? current.pendingCategoryId,
    pendingNote: typeof persisted.pendingNote === 'string' ? persisted.pendingNote : current.pendingNote,
    pendingBreakNote: typeof persisted.pendingBreakNote === 'string' ? persisted.pendingBreakNote : current.pendingBreakNote,
    pendingSessionGoal: typeof persisted.pendingSessionGoal === 'string' ? persisted.pendingSessionGoal : current.pendingSessionGoal,
    pendingNextSessionNote: typeof persisted.pendingNextSessionNote === 'string'
      ? persisted.pendingNextSessionNote
      : current.pendingNextSessionNote,
    streak: hasPersistedKey('streak')
      ? refreshStreakIfExpired(persisted.streak)
      : current.streak,
    missions: hasPersistedKey('missions')
      ? refreshMissionsIfStale(persisted.missions)
      : current.missions,
    buildings: Array.isArray(persisted.buildings) ? persisted.buildings : current.buildings,
    staking: hasPersistedKey('staking')
      ? { ...makeDefaultStaking(), ...(isRecord(persisted.staking) ? persisted.staking : {}) }
      : current.staking,
    prestige: hasPersistedKey('prestige')
      ? normalizeStoredPrestige(persisted.prestige)
      : current.prestige,
    timerSession: hasPersistedKey('timerSession')
      ? { ...makeDefaultTimerSession(), ...(isRecord(persisted.timerSession) ? persisted.timerSession : {}) }
      : current.timerSession,
    breakSession: hasPersistedKey('breakSession')
      ? { ...makeDefaultBreakSession(), ...(isRecord(persisted.breakSession) ? persisted.breakSession : {}) }
      : current.breakSession,
    // Derive break UI from imported breakSession so cross-device end-break syncs correctly.
    // ui is not in the cloud payload, so without this it keeps current.ui.isOnBreak = true
    // even after importing breakSession.isRunning = false from another device.
    ui: hasPersistedKey('breakSession') && !(
      isRecord(persisted.breakSession) ? persisted.breakSession.isRunning : false
    ) && current.ui.isOnBreak
      ? { ...current.ui, isOnBreak: false, breakSecondsLeft: 0, breakTotalSeconds: 0, breakIsLong: false, activeBreakSessionId: null }
      : current.ui,
    weeklyChain: hasPersistedKey('weeklyChain')
      ? refreshWeeklyChain({ ...makeDefaultWeeklyChain(), ...(isRecord(persisted.weeklyChain) ? persisted.weeklyChain : {}) })
      : current.weeklyChain,
    combo: hasPersistedKey('combo')
      ? normalizeStoredCombo(persisted.combo)
      : current.combo,
    dailyTracking: hasPersistedKey('dailyTracking')
      ? { ...makeDefaultDailyTracking(), ...(isRecord(persisted.dailyTracking) ? persisted.dailyTracking : {}) }
      : current.dailyTracking,
    skillActivations: hasPersistedKey('skillActivations')
      ? { ...makeDefaultSkillActivations(), ...(isRecord(persisted.skillActivations) ? persisted.skillActivations : {}) }
      : current.skillActivations,
    categoryTracking: hasPersistedKey('categoryTracking')
      ? { ...makeDefaultCategoryTracking(), ...(isRecord(persisted.categoryTracking) ? persisted.categoryTracking : {}) }
      : current.categoryTracking,
    eraTracking: hasPersistedKey('eraTracking')
      ? { ...makeDefaultEraTracking(), ...(isRecord(persisted.eraTracking) ? persisted.eraTracking : {}) }
      : current.eraTracking,
    sessionMeta: hasPersistedKey('sessionMeta')
      ? { ...makeDefaultSessionMeta(), ...(isRecord(persisted.sessionMeta) ? persisted.sessionMeta : {}) }
      : current.sessionMeta,
    research: hasPersistedKey('research')
      ? normalizeStoredResearch(persisted.research)
      : current.research,
    craftingQueue: Array.isArray(persisted.craftingQueue)
      ? persisted.craftingQueue
      : current.craftingQueue,
    buildingHP: isRecord(persisted.buildingHP) ? persisted.buildingHP : current.buildingHP,
    buildingLastUsed: isRecord(persisted.buildingLastUsed) ? persisted.buildingLastUsed : current.buildingLastUsed,
    buildingLevels: isRecord(persisted.buildingLevels) ? persisted.buildingLevels : current.buildingLevels,
    resourcesRefined: hasPersistedKey('resourcesRefined')
      ? normalizeStoredRefined(persisted.resourcesRefined)
      : current.resourcesRefined,
    relicEvolutions: isRecord(persisted.relicEvolutions) ? persisted.relicEvolutions : current.relicEvolutions,
    lastWeeklyReportDate: persisted.lastWeeklyReportDate ?? current.lastWeeklyReportDate,
    latestSessionUndo: persisted.latestSessionUndo ?? current.latestSessionUndo,
  };
}

function migratePersistedGameState(persistedState, fromVersion) {
  let next = isRecord(persistedState) ? { ...persistedState } : {};

  if (fromVersion < 1) {
    next = {
      ...next,
      timerConfig: normalizeStoredTimerConfig(next.timerConfig),
      forgiveness: normalizeStoredForgiveness(next.forgiveness),
    };
  }

  // V2: refund SP cho skills đã loại bỏ + cập nhật state mới
  if (fromVersion < 2) {
    const migratedPlayer = migrateV1ToV2Skills(next.player);
    next = {
      ...next,
      player: migratedPlayer,
    };
    // Lưu thông tin migration để UI hiển thị notification
    if (migratedPlayer._v2MigrationInfo) {
      next._pendingV2MigrationNotice = migratedPlayer._v2MigrationInfo;
      // Clean lên player object để không leak field tạm
      delete migratedPlayer._v2MigrationInfo;
    }
  }

  return next;
}

function createLatestSessionUndoSnapshot(state) {
  return {
    sessionId: null,
    snapshot: {
      player: state.player,
      progress: state.progress,
      resources: state.resources,
      forgiveness: state.forgiveness,
      rankSystem: state.rankSystem,
      rankChallenge: state.rankChallenge,
      eraCrisis: state.eraCrisis,
      relics: state.relics,
      blueprints: state.blueprints,
      achievements: state.achievements,
      historyStats: state.historyStats,
      streak: state.streak,
      missions: state.missions,
      buildings: state.buildings,
      staking: state.staking,
      weeklyChain: state.weeklyChain,
      combo: state.combo,
      dailyTracking: state.dailyTracking,
      skillActivations: state.skillActivations,
      categoryTracking: state.categoryTracking,
      eraTracking: state.eraTracking,
      sessionMeta: state.sessionMeta,
      research: state.research,
      craftingQueue: state.craftingQueue,
      resourcesRefined: state.resourcesRefined,
    },
  };
}

function makeProgressionResetState() {
  return {
    player: {
      level: 0, totalEXP: 0, sp: 0, unlockedSkills: makeDefaultSkills(),
      // V2 fields — reset all
      benVungUnlocked: false,
      locBanTangCounter: 0,
      nhipHoanHaoStreakDays: 0,
      nhipHoanHaoLastSixDate: null,
      nhipHoanHaoBonusDay: null,
      skillBuffQueue: [],
      keHoachWeeklyBuffWeekKey: null,
    },
    progress: makeDefaultProgress(),
    historyStats: makeDefaultHistoryStats(),
    resources: makeEmptyResources(),
    forgiveness: makeDefaultForgiveness(),
    rankSystem: makeDefaultRankSystem(),
    rankChallenge: null,
    eraCrisis: makeDefaultEraCrisis(),
    blueprints: [],
    streak: makeDefaultStreak(),
    missions: makeDefaultMissions(),
    staking: makeDefaultStaking(),
    timerSession: makeDefaultTimerSession(),
    breakSession: makeDefaultBreakSession(),
    weeklyChain: makeDefaultWeeklyChain(),
    combo: makeDefaultCombo(),
    pendingCategoryId: null,
    pendingNote: '',
    pendingBreakNote: '',
    pendingSessionGoal: '',
    pendingNextSessionNote: '',
    dailyTracking: makeDefaultDailyTracking(),
    skillActivations: makeDefaultSkillActivations(),
    categoryTracking: makeDefaultCategoryTracking(),
    eraTracking: makeDefaultEraTracking(),
    sessionMeta: makeDefaultSessionMeta(),
    research: makeDefaultResearch(),
    craftingQueue: makeDefaultCraftingQueue(),
    buildingHP: makeDefaultBuildingHP(),
    buildingLastUsed: {},
    buildingLevels: {},
    resourcesRefined: makeDefaultResourcesRefined(),
    relicEvolutions: {},
    latestSessionUndo: null,
  };
}

function applyBreakPassiveIncome(prev, minuteCount = 0) {
  const safeMinutes = Math.max(0, Math.floor(minuteCount));
  if (safeMinutes <= 0) {
    return {
      progress: prev.progress,
      player: prev.player,
      resources: prev.resources,
      resourcesRefined: prev.resourcesRefined,
      levelsGained: 0,
      newLevel: prev.player.level,
      spGained: 0,
    };
  }

  // V2: kho_du_tru / nghi_ngoi_hoan_hao đã loại bỏ → break passive XP = 0.
  // Giữ logic infrastructure building bên dưới (passive resources).
  const xpPerMinute = 0;
  const totalPassiveXP = xpPerMinute * safeMinutes;
  const xpRewardState = totalPassiveXP > 0
    ? grantXPReward(prev, totalPassiveXP)
    : null;

  let resources = prev.resources;
  let resourcesRefined = prev.resourcesRefined;

  for (const bpId of prev.buildings ?? []) {
    const eff = BUILDING_EFFECTS[bpId];
    if (!eff || eff.type !== 'infrastructure') continue;

    const eraKey = eff.era;
    const level = prev.buildingLevels?.[bpId] ?? 1;
    const levelMult = getBuildingLevelMultiplier(level);
    const bookKey = `book${eraKey}`;
    const updatedBook = { ...(resources?.[bookKey] ?? {}) };
    const prevRefined = normalizeRefinedBag(resourcesRefined?.[eraKey]);
    const rawResourceIds = (ERA_METADATA[eraKey]?.resources ?? []).map((resource) => resource.id);
    const t1PerMinute = Math.floor((eff.passiveT1PerBreakMin ?? 0) * levelMult);

    if (rawResourceIds[0]) {
      updatedBook[rawResourceIds[0]] = (updatedBook[rawResourceIds[0]] ?? 0) + (Math.ceil(t1PerMinute / 2) * safeMinutes);
    }
    if (rawResourceIds[1]) {
      updatedBook[rawResourceIds[1]] = (updatedBook[rawResourceIds[1]] ?? 0) + (Math.floor(t1PerMinute / 2) * safeMinutes);
    }

    resources = {
      ...resources,
      [bookKey]: updatedBook,
    };
    resourcesRefined = {
      ...resourcesRefined,
      [eraKey]: {
        t2: prevRefined.t2 + ((eff.passiveT2PerBreakMin ?? 0) * levelMult * safeMinutes),
        t3: 0,
      },
    };
  }

  return {
    progress: xpRewardState?.progress ?? prev.progress,
    player: xpRewardState?.player ?? prev.player,
    resources,
    resourcesRefined,
    levelsGained: xpRewardState?.levelsGained ?? 0,
    newLevel: xpRewardState?.newLevel ?? prev.player.level,
    spGained: xpRewardState?.spGained ?? 0,
  };
}

function buildSavedNoteEntry(source, index = 0) {
  const noteText = source?.note?.trim() || '';
  const breakNoteText = source?.breakNote?.trim() || '';
  if (!noteText && !breakNoteText) return null;

  return {
    id: source.id != null ? `note_${source.id}` : `note_${index}`,
    sourceSessionId: source.id ?? null,
    timestamp: source.timestamp ?? new Date().toISOString(),
    minutes: Number.isFinite(source.minutes) ? source.minutes : 0,
    xpEarned: Number.isFinite(source.xpEarned ?? source.epEarned) ? (source.xpEarned ?? source.epEarned) : 0,
    categoryId: source.categoryId ?? null,
    categorySnapshot: source.categorySnapshot ?? null,
    tier: source.tier ?? null,
    comboCount: Number.isFinite(source.comboCount) ? source.comboCount : 1,
    note: noteText || null,
    breakNote: breakNoteText || null,
  };
}

function sanitizeSavedNotes(savedNotes = []) {
  return savedNotes
    .map((entry, index) => {
      const noteText = entry?.note?.trim() || '';
      const breakNoteText = entry?.breakNote?.trim() || '';
      if (!noteText && !breakNoteText) return null;
      return {
        id: entry.id ?? `note_import_${index}`,
        sourceSessionId: entry.sourceSessionId ?? null,
        timestamp: entry.timestamp ?? new Date().toISOString(),
        minutes: Number.isFinite(entry.minutes) ? entry.minutes : 0,
        xpEarned: Number.isFinite(entry.xpEarned) ? entry.xpEarned : 0,
        categoryId: entry.categoryId ?? null,
        categorySnapshot: entry.categorySnapshot ?? null,
        tier: entry.tier ?? null,
        comboCount: Number.isFinite(entry.comboCount) ? entry.comboCount : 1,
        note: noteText || null,
        breakNote: breakNoteText || null,
      };
    })
    .filter(Boolean);
}

function buildSavedNotesFromHistory(history = []) {
  return history
    .map((session, index) => buildSavedNoteEntry(session, index))
    .filter(Boolean);
}

function upsertSavedNoteEntry(savedNotes = [], sessionEntry) {
  const filtered = (savedNotes ?? []).filter((entry) => entry.sourceSessionId !== sessionEntry?.id);
  const nextEntry = buildSavedNoteEntry(sessionEntry);
  return nextEntry ? [nextEntry, ...filtered].slice(0, 2000) : filtered;
}

function countCollectedBlueprints(research, blueprints = [], buildings = []) {
  return new Set([
    ...((research?.researched ?? []).filter(Boolean)),
    ...(blueprints.map((blueprint) => blueprint?.id).filter(Boolean)),
    ...((buildings ?? []).filter(Boolean)),
  ]).size;
}

// ─── HELPER: Tạo snapshot cho kiểm tra thành tích ────────────────────────────
function buildAchievementSnapshot(progress, relics, blueprints, research, history, rankSystem, streak, buildings, prestige, player) {
  const getTs     = (h) => typeof h.timestamp === 'string' ? new Date(h.timestamp).getTime() : (h.timestamp ?? 0);
  const getH      = (h) => getVietnamHour(getTs(h));
  const getDow    = (h) => getVietnamDayOfWeek(getTs(h));
  const getMon    = (h) => getVietnamMonthIndex(getTs(h));
  const getYr     = (h) => getVietnamYear(getTs(h));
  const getDayKey = (h) => localDateStr(getTs(h));

  const thisYear  = getVietnamYear();
  const thisYearH = history.filter((h) => getYr(h) === thisYear);

  // sessions per day
  const dayMap = {};
  history.forEach((h) => { const d = getDayKey(h); dayMap[d] = (dayMap[d] || 0) + 1; });
  const maxSessionsInDay = Math.max(0, ...Object.values(dayMap));

  // day-of-week counts [0=Sun..6=Sat]
  const dow = [0, 0, 0, 0, 0, 0, 0];
  history.forEach((h) => dow[getDow(h)]++);

  // month counts [0=Jan..11=Dec]
  const mon = Array(12).fill(0);
  history.forEach((h) => mon[getMon(h)]++);

  // best month (any year)
  const monthMinMap = {};
  history.forEach((h) => {
    const k = `${getYr(h)}-${getMon(h)}`;
    monthMinMap[k] = (monthMinMap[k] || 0) + (h.minutes ?? 0);
  });
  const monthSessMap = {};
  history.forEach((h) => {
    const k = `${getYr(h)}-${getMon(h)}`;
    monthSessMap[k] = (monthSessMap[k] || 0) + 1;
  });
  const bestMonthSessions = Math.max(0, ...Object.values(monthSessMap));
  const bestMonthMinutes  = Math.max(0, ...Object.values(monthMinMap));

  // best month this year
  const mmYear = Array(12).fill(0);
  thisYearH.forEach((h) => mmYear[getMon(h)]++);
  const bestMonthSessionsThisYear = Math.max(...mmYear);

  // comeback: gap ≥30 days within this year's sessions
  let hadComebackThisYear = false;
  if (thisYearH.length >= 2) {
    const sorted = [...thisYearH].sort((a, b) => getTs(a) - getTs(b));
    for (let i = 1; i < sorted.length; i++) {
      if ((getTs(sorted[i]) - getTs(sorted[i - 1])) / 86400000 >= 30) { hadComebackThisYear = true; break; }
    }
  }

  // special calendar dates: encoded as month*100+day (0-indexed month)
  const calSet = new Set(history.map((h) => {
    const { month, day } = getVietnamDateParts(getTs(h));
    return (month - 1) * 100 + day;
  }));

  // total active days (unique days ever)
  const totalActiveDays = Object.keys(dayMap).length;

  // days since first session
  const daysSinceFirst = history.length > 0
    ? Math.floor((Date.now() - getTs(history[history.length - 1])) / 86400000)
    : 0;

  // full-day: a day with sessions in morning (6-12), afternoon (12-18), evening (18-23)
  const fullDaySet = new Set();
  const dayParts   = {};
  history.forEach((h) => {
    const d = getDayKey(h); const hr = getH(h);
    if (!dayParts[d]) dayParts[d] = new Set();
    if (hr >= 6  && hr < 12) dayParts[d].add('m');
    if (hr >= 12 && hr < 18) dayParts[d].add('a');
    if (hr >= 18 && hr < 23) dayParts[d].add('e');
    if (dayParts[d].size === 3) fullDaySet.add(d);
  });

  // sessions per day this year
  const dayMapYear = {};
  thisYearH.forEach((h) => { const d = getDayKey(h); dayMapYear[d] = (dayMapYear[d] || 0) + 1; });

  // unique categories used
  const uniqueCategoriesUsed = new Set(history.filter((h) => h.categoryId).map((h) => h.categoryId)).size;

  return {
    // ── core ──
    sessionsCompleted:  progress.sessionsCompleted,
    totalFocusMinutes:  progress.totalFocusMinutes,
    totalXP:            player?.totalEXP ?? 0,
    activeBook:         progress.activeBook ?? 1,
    playerLevel:        player?.level ?? 0,
    // ── relics / blueprints / buildings ──
    relicsCount:        relics.length,
    blueprintsCount:    countCollectedBlueprints(research, blueprints, buildings),
    buildingsBuilt:     (buildings ?? []).length,
    prestigeCount:      prestige?.count ?? 0,
    // ── session stats ──
    maxSessionMinutes:  history.reduce((m, h) => Math.max(m, h.minutes ?? 0), 0),
    totalJackpots:      history.filter((h) => h.jackpot).length,
    deepFocusCount:     history.filter((h) => (h.minutes ?? 0) >= 60).length,
    ultraFocusCount:    history.filter((h) => (h.minutes ?? 0) >= 90).length,
    titanFocusCount:    history.filter((h) => (h.minutes ?? 0) >= 120).length,
    legendFocusCount:   history.filter((h) => (h.minutes ?? 0) >= 180).length,
    maxSessionsInDay,
    fullDayCount:       fullDaySet.size,
    totalActiveDays,
    daysSinceFirst,
    // ── rank ──
    maxRankAchieved:    Math.max(0, ...[1,2,3,4,5,6,7,8,9,10].map((i) => rankSystem[`book${i}`] ?? 0)),
    // ── streak ──
    currentStreak:      streak?.currentStreak ?? 0,
    longestStreak:      streak?.longestStreak ?? 0,
    // ── time of day ──
    earlyBirdCount:     history.filter((h) => getH(h) < 7).length,
    nightOwlCount:      history.filter((h) => getH(h) >= 23).length,
    midnightCount:      history.filter((h) => getH(h) < 3).length,
    dawnCount:          history.filter((h) => getH(h) < 6).length,
    fiveAmCount:        history.filter((h) => getH(h) >= 5 && getH(h) < 6).length,
    lunchCount:         history.filter((h) => getH(h) >= 12 && getH(h) < 13).length,
    afternoonCount:     history.filter((h) => getH(h) >= 14 && getH(h) < 17).length,
    eveningCount:       history.filter((h) => getH(h) >= 18 && getH(h) < 22).length,
    teatimeCount:       history.filter((h) => getH(h) >= 15 && getH(h) < 16).length,
    sunriseCount:       history.filter((h) => getH(h) >= 6 && getH(h) < 7).length,
    // ── annual ──
    sessionsThisYear:        thisYearH.length,
    minutesThisYear:         thisYearH.reduce((s, h) => s + (h.minutes ?? 0), 0),
    monthsActiveThisYear:    new Set(thisYearH.map((h) => getMon(h))).size,
    hadComebackThisYear,
    bestMonthSessionsThisYear,
    q1Sessions:  thisYearH.filter((h) => getMon(h) < 3).length,
    q2Sessions:  thisYearH.filter((h) => getMon(h) >= 3 && getMon(h) < 6).length,
    q3Sessions:  thisYearH.filter((h) => getMon(h) >= 6 && getMon(h) < 9).length,
    q4Sessions:  thisYearH.filter((h) => getMon(h) >= 9).length,
    // ── calendar specials ──
    hasJan1Session:    calSet.has(1),     // Jan=0 → 0*100+1=1
    hasDec31Session:   calSet.has(1131),  // Dec=11 → 11*100+31=1131
    hasDec25Session:   calSet.has(1125),
    hasFeb14Session:   calSet.has(114),
    hasMar14Session:   calSet.has(214),   // Pi day
    hasMar8Session:    calSet.has(208),   // Women's Day
    hasNov20Session:   calSet.has(1020),  // Vietnam Teacher's Day
    hasJun21Session:   calSet.has(521),   // Summer solstice
    // ── day of week ──
    sunCount: dow[0], monCount: dow[1], tueCount: dow[2], wedCount: dow[3],
    thuCount: dow[4], friCount: dow[5], satCount: dow[6],
    weekendCount: dow[0] + dow[6],
    weekdayCount: dow[1] + dow[2] + dow[3] + dow[4] + dow[5],
    // ── month totals (all-time) ──
    janCount: mon[0],  febCount: mon[1],  marCount: mon[2],  aprCount: mon[3],
    mayCount: mon[4],  junCount: mon[5],  julCount: mon[6],  augCount: mon[7],
    sepCount: mon[8],  octCount: mon[9],  novCount: mon[10], decCount: mon[11],
    bestMonthSessions,
    bestMonthMinutes,
    // ── notes ──
    totalNoteCount: history.filter((h) => h.note).length,
    longNoteCount:  history.filter((h) => h.note && h.note.length >= 150).length,
    // ── categories ──
    uniqueCategoriesUsed,
  };
}

// ─── HELPER: Kiểm tra thành tích mới mở khóa ─────────────────────────────────
function checkAchievements(currentUnlocked, snapshot) {
  return ACHIEVEMENTS
    .filter((a) => !currentUnlocked.includes(a.id) && a.check(snapshot, currentUnlocked))
    .map((a) => a.id);
}

// ─── HELPER: Gộp tài nguyên vào đúng túi quyển ───────────────────────────────
function mergeResources(allResources, gains, activeBook) {
  const bookKey     = `book${activeBook}`;
  const updatedBook = { ...allResources[bookKey] };
  for (const [id, amount] of Object.entries(gains)) {
    updatedBook[id] = (updatedBook[id] ?? 0) + amount;
  }
  return { ...allResources, [bookKey]: updatedBook };
}

function grantXPReward(prev, xpAmount, epAmount = 0) {
  const normalizedXP = Math.max(0, Math.round(xpAmount ?? 0));
  const normalizedEP = Math.max(0, Math.round(epAmount ?? 0));
  const newTotalEP = prev.progress.totalEP + normalizedEP;
  const newBook = getActiveBook(newTotalEP);
  const { newLevel, newTotalEXP, levelsGained, spGained } =
    computeLevelUps(prev.player.totalEXP, normalizedXP);

  return {
    progress: {
      ...prev.progress,
      totalEP:    newTotalEP,
      activeBook: newBook,
    },
    player: {
      ...prev.player,
      level:    newLevel,
      totalEXP: newTotalEXP,
      sp:       prev.player.sp + spGained,
    },
    newBook,
    newLevel,
    levelsGained,
    spGained,
  };
}

function getSuperFocusChargeCap() {
  // V2: nghi_ngoi_hoan_hao đã loại bỏ → chỉ còn base charge
  return SIEU_TAP_TRUNG_CHARGES;
}

function markLatestSessionBreakCompleted(history = [], completedAt = new Date().toISOString()) {
  if (!Array.isArray(history) || history.length === 0) return history;
  const [latestEntry, ...restHistory] = history;
  if (!latestEntry) return history;
  if (latestEntry.breakCompletedOnTime && latestEntry.breakCompletedAt) return history;
  return [
    {
      ...latestEntry,
      breakCompletedOnTime: true,
      breakCompletedAt: completedAt,
    },
    ...restHistory,
  ];
}

function applyPerfectBreakProgress(prev) {
  const completedAt = new Date().toISOString();
  const latestEntry = Array.isArray(prev.history) ? prev.history[0] : null;
  const breakAlreadyCounted = !!latestEntry?.breakCompletedOnTime;
  const updatedHistory = breakAlreadyCounted
    ? (latestEntry?.breakCompletedAt ? prev.history : markLatestSessionBreakCompleted(prev.history, completedAt))
    : markLatestSessionBreakCompleted(prev.history, completedAt);
  const refreshedMissions = refreshMissionsIfStale(prev.missions);
  const refreshedChain = refreshWeeklyChain(prev.weeklyChain);

  if (breakAlreadyCounted) {
    return {
      missions: refreshedMissions,
      weeklyChain: refreshedChain,
      history: updatedHistory,
      progress: prev.progress,
      player: prev.player,
      missionCompletedIds: [],
      levelsGained: 0,
      newLevel: prev.player.level,
      spGained: 0,
    };
  }

  const completedMissionIds = [];
  const updatedMissionList = refreshedMissions.list.map((mission) => {
    if (mission.claimed || mission.type !== 'perfectBreaks') return mission;
    const progress = Math.min(mission.goal, mission.progress + 1);
    if (progress >= mission.goal && mission.progress < mission.goal) {
      completedMissionIds.push(mission.id);
    }
    return {
      ...mission,
      progress,
      claimed: progress >= mission.goal ? true : mission.claimed,
    };
  });

  const missionBonusXPBase = completedMissionIds.reduce((sum, missionId) => {
    const mission = updatedMissionList.find((entry) => entry.id === missionId);
    return sum + (mission?.rewardXP ?? 0);
  }, 0);
  const missionBonusXP = applyDailyMissionXPBonus(prev.buildings, missionBonusXPBase);

  const rewardState = missionBonusXP > 0 ? grantXPReward(prev, missionBonusXP) : null;
  const chain = WEEKLY_CHAINS[refreshedChain.chainIndex];
  const activeStep = chain?.steps[refreshedChain.currentStep];
  const weeklyChain = activeStep?.type === 'perfectBreaks'
    ? {
        ...refreshedChain,
        stepProgress: Math.min(activeStep.goal, refreshedChain.stepProgress + 1),
      }
    : refreshedChain;

  return {
    missions: { ...refreshedMissions, list: updatedMissionList },
    weeklyChain,
    history: updatedHistory,
    progress: rewardState?.progress ?? prev.progress,
    player: rewardState?.player ?? prev.player,
    missionCompletedIds: completedMissionIds,
    levelsGained: rewardState?.levelsGained ?? 0,
    newLevel: rewardState?.newLevel ?? prev.player.level,
    spGained: rewardState?.spGained ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ZUSTAND STORE
// ─────────────────────────────────────────────────────────────────────────────

const useGameStore = create(
  persist(
    (set, get) => ({
      // ══════════════════════════════════════════════════════════════════════
      // ── TRẠNG THÁI ĐƯỢC PERSIST ──────────────────────────────────────────
      // ══════════════════════════════════════════════════════════════════════

      // ── Nhân vật người chơi ───────────────────────────────────────────────
      player: {
        level:          0,
        totalEXP:       0,
        sp:             0,         // Điểm Kỹ Năng chưa dùng
        unlockedSkills: makeDefaultSkills(),
        // V2 — Bền Vững (lifetime trophy: streak 30 ngày → +5% allBonus vĩnh viễn)
        benVungUnlocked: false,
        // V2 — Lộc Ban Tặng counter (mỗi 7 phiên ≥30 → reward bonus)
        locBanTangCounter: 0,
        // V2 — Nhịp Hoàn Hảo tracking
        nhipHoanHaoStreakDays: 0,         // số ngày liên tiếp ≥6 phiên
        nhipHoanHaoLastSixDate: null,     // 'YYYY-MM-DD' — ngày cuối hit ≥6 phiên
        nhipHoanHaoBonusDay: null,        // 'YYYY-MM-DD' — ngày active buff
        // V2 — Skill buff queue (Người Lập Kế / Cử Tri trigger từ mission/chain)
        skillBuffQueue: [],               // [{type:'nguoi_lap_ke'|'cu_tri', sessionsRemaining}]
        // V2 — Kế Hoạch Hoàn Hảo: tuần kế +10% allBonus
        keHoachWeeklyBuffWeekKey: null,   // 'YYYY-MM-DD' (Monday) — tuần đang nhận buff
      },

      // ── Tiến trình ────────────────────────────────────────────────────────
      progress: makeDefaultProgress(),

      // ── Túi tài nguyên ────────────────────────────────────────────────────
      resources: makeEmptyResources(),

      // ── Cấu hình timer ───────────────────────────────────────────────────
      timerConfig: makeDefaultTimerConfig(),

      // ── Theo dõi Sự Tha Thứ hàng tuần ────────────────────────────────────
      forgiveness: makeDefaultForgiveness(),

      // ── Hệ thống Danh Xưng ───────────────────────────────────────────────
      rankSystem: makeDefaultRankSystem(),

      // ── Thử Thách Thăng Cấp đang hoạt động ───────────────────────────────
      rankChallenge: null,  // RankChallenge | null

      // ── Trạng thái Khủng Hoảng Kỷ Nguyên ────────────────────────────────
      eraCrisis: makeDefaultEraCrisis(),

      // ── Di Vật nhận được (buff vĩnh viễn) ────────────────────────────────
      relics: [],

      // ── Bản vẽ lưu từ dữ liệu cũ (tương thích ngược) ─────────────────────
      blueprints: [],

      // ── Thành Tích đã mở khóa ────────────────────────────────────────────
      achievements: makeDefaultAchievements(),

      // ── Nhật ký phiên (50 gần nhất) ──────────────────────────────────────
      history: [],

      // ── Chỉ số lịch sử dài hạn, không phụ thuộc danh sách history đang hiển thị ──
      historyStats: makeDefaultHistoryStats(),

      // ── Kho ghi chú đã lưu (backup độc lập) ─────────────────────────────
      savedNotes: [],

      // ── Streak / Chuỗi Ngày ────────────────────────────────────────────────
      streak: makeDefaultStreak(),

      // ── Nhiệm Vụ Hàng Ngày ───────────────────────────────────────────────
      missions: makeDefaultMissions(),

      // ── Công Trình đã xây dựng ────────────────────────────────────────────
      buildings: [],  // string[] — blueprint ids that have been built

      // ── Giam Cầm Năng Lượng (Overclock) ──────────────────────────────────
      staking: makeDefaultStaking(),

      // ── Prestige / New Game+ ──────────────────────────────────────────────
      prestige: makeDefaultPrestige(),

      // ── Timer Session (persist startedAt qua F5) ─────────────────────────
      timerSession: makeDefaultTimerSession(),
      breakSession: makeDefaultBreakSession(),

      // ── Weekly Quest Chain ────────────────────────────────────────────────
      weeklyChain: makeDefaultWeeklyChain(),

      // ── Combo / Momentum ──────────────────────────────────────────────────
      combo: makeDefaultCombo(),

      // ── Danh mục phiên tập trung ──────────────────────────────────────────
      sessionCategories: [...DEFAULT_SESSION_CATEGORIES],

      // ── Category đang chờ cho phiên tiếp theo ────────────────────────────
      pendingCategoryId: null,

      // ── Ghi chú ngắn cho phiên tiếp theo ────────────────────────────────
      pendingNote: '',
      pendingBreakNote: '',

      // ── Mục tiêu phiên và ghi chú phản tư ──────────────────────────────
      pendingSessionGoal: '',
      pendingNextSessionNote: '',

      // ── Theo dõi hàng ngày (cho skills chiến lược) ────────────────────────
      dailyTracking: makeDefaultDailyTracking(),

      // ── Kích hoạt kỹ năng chủ động (Siêu Tập Trung / Số Đỏ) ─────────────
      skillActivations: makeDefaultSkillActivations(),

      // ── Theo dõi chuỗi category liên tiếp ───────────────────────────────
      categoryTracking: makeDefaultCategoryTracking(),

      // ── Theo dõi kỷ nguyên ───────────────────────────────────────────────
      eraTracking: makeDefaultEraTracking(),

      // ── Meta phiên trước ─────────────────────────────────────────────────
      sessionMeta: makeDefaultSessionMeta(),

      // ── Hệ thống Nghiên Cứu (RP + bản vẽ đã mở) ─────────────────────────
      research: makeDefaultResearch(),

      // ── Hàng đợi xây dựng (Crafting Queue) ───────────────────────────────
      craftingQueue: makeDefaultCraftingQueue(),

      // ── HP công trình cũ (giữ lại để tương thích save) ──────────────────
      buildingHP: makeDefaultBuildingHP(),

      // ── Ngày cuối cùng mỗi công trình được "dùng" (session hoàn thành) ───
      buildingLastUsed: {},  // { [bpId]: 'YYYY-MM-DD' }

      // ── Cấp độ công trình (Lv.1/Lv.2/Lv.3) ───────────────────────────────
      buildingLevels: {},  // { [bpId]: 1|2|3 }

      // ── Nguyên liệu tinh luyện theo kỷ (giữ shape cũ để tương thích) ────
      resourcesRefined: makeDefaultResourcesRefined(),

      // ── Giai đoạn tiến hóa di vật ────────────────────────────────────────
      relicEvolutions: {},  // { [relicId]: stageNumber } — 0=base, 1=evolved, 2=legendary

      // ── Snapshot undo an toàn cho phiên mới nhất ─────────────────────────
      latestSessionUndo: null,

      // ══════════════════════════════════════════════════════════════════════
      // ── TRẠNG THÁI TẠM THỜI (KHÔNG PERSIST) ─────────────────────────────
      // ══════════════════════════════════════════════════════════════════════
      ui: makeDefaultUiState(),

      // Ngày cuối cùng đã hiện Weekly Report (persist)
      lastWeeklyReportDate: null,

      // ══════════════════════════════════════════════════════════════════════
      // ── ACTIONS ──────────────────────────────────────────────────────────
      // ══════════════════════════════════════════════════════════════════════

      // ─── Cấu hình Timer ──────────────────────────────────────────────────
      setTimerConfig: (patch) =>
        set((state) => ({
          timerConfig: {
            ...state.timerConfig,
            ...patch,
            mode: patch.mode === 'stopwatch'
              ? 'stopwatch'
              : patch.mode === 'pomodoro'
                ? 'pomodoro'
                : state.timerConfig.mode,
            focusMinutes: patch.focusMinutes
              ? Math.min(180, Math.max(1, patch.focusMinutes))
              : state.timerConfig.focusMinutes,
            breakMinutes: patch.breakMinutes
              ? Math.min(60,  Math.max(1, patch.breakMinutes))
              : state.timerConfig.breakMinutes,
          },
        })),

      // ─── Persist timer state qua F5 / reload ─────────────────────────────
      persistTimerStart: (totalSeconds) =>
        set({
          timerSession: {
            ...makeDefaultTimerSession(),
            isRunning: true,
            startedAt: Date.now(),
            countdownStartedAt: Date.now(),
            totalSeconds,
          },
        }),

      persistTimerSession: (session) =>
        set({
          timerSession: {
            ...makeDefaultTimerSession(),
            ...session,
            isRunning: true,
          },
        }),

      clearTimerSession: () =>
        set({ timerSession: makeDefaultTimerSession() }),

      setNotificationCenterOpen: (open) =>
        set((prev) => {
          const nextOpen = typeof open === 'boolean'
            ? open
            : !prev.ui.notificationCenterOpen;
          const readAt = nextOpen ? Date.now() : null;
          return {
            ui: {
              ...prev.ui,
              notificationCenterOpen: nextOpen,
              notificationFeed: nextOpen
                ? prev.ui.notificationFeed.map((item) => (
                  item.readAt ? item : { ...item, readAt }
                ))
                : prev.ui.notificationFeed,
            },
          };
        }),

      dismissUiNotification: (notificationId) =>
        set((prev) => ({
          ui: {
            ...prev.ui,
            notificationFeed: prev.ui.notificationFeed.filter((item) => item.id !== notificationId),
          },
        })),

      clearUiNotifications: () =>
        set((prev) => ({
          ui: {
            ...prev.ui,
            notificationFeed: [],
          },
        })),

      syncBreakSession: (now = Date.now()) =>
        set((prev) => {
          const session = prev.breakSession;
          if (!session?.isRunning) return prev;

          const startedAt = Number.isFinite(session.startedAt) ? session.startedAt : Date.now();
          const endsAt = Number.isFinite(session.endsAt) ? session.endsAt : startedAt;
          const totalSeconds = Math.max(0, session.totalSeconds ?? 0);
          const elapsedWholeMinutes = Math.min(
            Math.floor(totalSeconds / 60),
            Math.max(0, Math.floor((now - startedAt) / 60_000)),
          );
          const minuteDelta = Math.max(0, elapsedWholeMinutes - (session.passiveMinutesGranted ?? 0));
          const passiveState = applyBreakPassiveIncome(prev, minuteDelta);
          const nextLevelQueue = passiveState.levelsGained > 0
            ? [...prev.ui.levelUpQueue, {
                levelsGained: passiveState.levelsGained,
                newLevel: passiveState.newLevel,
                spGained: passiveState.spGained,
              }]
            : prev.ui.levelUpQueue;
          const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1000));

          if (secondsLeft <= 0) {
            const cycleProgress = markLongBreakCycleBreakEnded(passiveState.progress, now);
            const breakRewardState = applyPerfectBreakProgress({
              ...prev,
              progress: cycleProgress,
              player: passiveState.player,
              resources: passiveState.resources,
              resourcesRefined: passiveState.resourcesRefined,
            });

            return {
              progress: breakRewardState.progress,
              player: breakRewardState.player,
              resources: passiveState.resources,
              resourcesRefined: passiveState.resourcesRefined,
              missions: breakRewardState.missions,
              weeklyChain: breakRewardState.weeklyChain,
              history: breakRewardState.history,
              breakSession: makeDefaultBreakSession(),
              pendingBreakNote: '',
              ui: {
                ...prev.ui,
                isOnBreak: false,
                breakSecondsLeft: 0,
                breakTotalSeconds: 0,
                breakIsLong: false,
                activeBreakSessionId: null,
                levelUpQueue: breakRewardState.levelsGained > 0
                  ? [...nextLevelQueue, {
                      levelsGained: breakRewardState.levelsGained,
                      newLevel: breakRewardState.newLevel,
                      spGained: breakRewardState.spGained,
                    }]
                  : nextLevelQueue,
                missionCompletedIds: breakRewardState.missionCompletedIds.length > 0
                  ? [...(prev.ui.missionCompletedIds ?? []), ...breakRewardState.missionCompletedIds]
                  : (prev.ui.missionCompletedIds ?? []),
              },
              sessionMeta: {
                ...prev.sessionMeta,
                breakCompletedOnTime: true,
              },
            };
          }

          return {
            progress: passiveState.progress,
            player: passiveState.player,
            resources: passiveState.resources,
            resourcesRefined: passiveState.resourcesRefined,
            breakSession: {
              ...session,
              passiveMinutesGranted: elapsedWholeMinutes,
            },
            ui: {
              ...prev.ui,
              isOnBreak: true,
              breakSecondsLeft: secondsLeft,
              breakTotalSeconds: totalSeconds,
              breakIsLong: !!session.isLong,
              activeBreakSessionId: session.sourceSessionId ?? null,
              levelUpQueue: nextLevelQueue,
            },
          };
        }),

      // ─── Reset vòng nghỉ dài về 0 ────────────────────────────────────────
      resetLongBreakCycle: () =>
        set((prev) => ({
          progress: {
            ...syncLongBreakCycleProgress(prev.progress),
            longBreakCycleStart: prev.progress.sessionsCompleted,
            longBreakGraceDeadlineAt: null,
            longBreakPreviewSession: false,
          },
        })),

      syncLongBreakCycle: (referenceTs = Date.now()) =>
        set((prev) => ({
          progress: syncLongBreakCycleProgress(prev.progress, referenceTs),
        })),

      prepareFocusSessionStart: ({ startedAt = Date.now(), mode = 'pomodoro' } = {}) =>
        set((prev) => {
          const progressAfterBreak = prev.breakSession?.isRunning || prev.ui.isOnBreak
            ? markLongBreakCycleBreakEnded(prev.progress, startedAt)
            : syncLongBreakCycleProgress(prev.progress, startedAt);
          const nextProgress = mode === 'pomodoro'
            ? markLongBreakCycleSessionStarted(progressAfterBreak, startedAt)
            : progressAfterBreak;

          return {
            pendingBreakNote: '',
            latestSessionUndo: createLatestSessionUndoSnapshot(prev),
            progress: nextProgress,
            breakSession: makeDefaultBreakSession(),
            ui: {
              ...prev.ui,
              isOnBreak: false,
              breakSecondsLeft: 0,
              breakTotalSeconds: 0,
              breakIsLong: false,
              activeBreakSessionId: null,
            },
          };
        }),

      // ─── Xoá phiên lịch sử và hoàn trả phần thưởng ─────────────────────
      deleteSession: (sessionId) =>
        set((prev) => {
          const latestSession = prev.history[0] ?? null;
          const undoState = prev.latestSessionUndo;
          const canUndoLatestSession = latestSession?.id === sessionId && undoState?.sessionId === sessionId;
          if (!canUndoLatestSession) return prev;

          return {
            ...undoState.snapshot,
            history: prev.history.filter((entry) => entry.id !== sessionId),
            savedNotes: (prev.savedNotes ?? []).filter((entry) => entry.sourceSessionId !== sessionId),
            latestSessionUndo: null,
            ui: {
              ...prev.ui,
              lootModalOpen: false,
              pendingReward: null,
              relicNotification: null,
              rankUpNotification: null,
              achievementQueue: [],
              missionCompletedIds: [],
            },
          };
        }),

      updateSessionCategory: (sessionId, categoryId) =>
        set((prev) => {
          const categorySnapshot = categoryId
            ? (prev.sessionCategories.find((cat) => cat.id === categoryId) ?? null)
            : null;
          const hasSession = prev.history.some((session) => session.id === sessionId);
          if (!hasSession) return prev;

          return {
            history: prev.history.map((session) =>
              session.id === sessionId
                ? {
                    ...session,
                    categoryId: categoryId ?? null,
                    categorySnapshot,
                  }
                : session
            ),
            savedNotes: (prev.savedNotes ?? []).map((note) =>
              note.sourceSessionId === sessionId
                ? {
                    ...note,
                    categoryId: categoryId ?? null,
                    categorySnapshot,
                  }
                : note
            ),
          };
        }),

      reviewCompletedSession: (sessionId, patch = {}) =>
        set((prev) => {
          if (!sessionId || !prev.history.some((session) => session.id === sessionId)) return prev;

          const hasGoalAchieved = typeof patch.goalAchieved === 'boolean';
          const goal = typeof patch.goal === 'string' ? (patch.goal.trim() || null) : undefined;
          const nextNote = typeof patch.nextNote === 'string' ? (patch.nextNote.trim() || null) : undefined;
          let previousSession = null;
          let updatedSession = null;
          const nextHistory = prev.history.map((session) => {
            if (session.id !== sessionId) return session;
            previousSession = session;
            updatedSession = {
              ...session,
              ...(goal !== undefined ? { goal } : {}),
              ...(nextNote !== undefined ? { nextNote } : {}),
              ...(hasGoalAchieved ? { goalAchieved: patch.goalAchieved } : {}),
            };
            return updatedSession;
          });

          if (!updatedSession) return prev;
          const currentHistoryStats = normalizeStoredHistoryStats(prev.historyStats, prev.history);

          return {
            history: nextHistory,
            historyStats: applyHistoryReviewStatsDelta(currentHistoryStats, previousSession, updatedSession),
          };
        }),

      updateSessionBreakNote: (sessionId, breakNote) =>
        set((prev) => {
          if (!sessionId) return prev;

          const normalizedBreakNote = typeof breakNote === 'string'
            ? (breakNote.trim() || null)
            : null;
          let updatedSession = null;
          const nextHistory = prev.history.map((session) => {
            if (session.id !== sessionId) return session;
            updatedSession = {
              ...session,
              breakNote: normalizedBreakNote,
            };
            return updatedSession;
          });

          if (!updatedSession) return prev;

          return {
            history: nextHistory,
            savedNotes: upsertSavedNoteEntry(prev.savedNotes ?? [], updatedSession),
          };
        }),

      deleteSavedNoteEntry: ({ noteId = null, sessionId = null } = {}) =>
        set((prev) => {
          const savedNotes = prev.savedNotes ?? [];
          const matchedSavedNote = savedNotes.find((entry) => (
            (noteId && entry.id === noteId)
            || (sessionId != null && entry.sourceSessionId === sessionId)
          )) ?? null;
          const resolvedSessionId = sessionId ?? matchedSavedNote?.sourceSessionId ?? null;

          const hasSavedNoteMatch = savedNotes.some((entry) => (
            (noteId && entry.id === noteId)
            || (resolvedSessionId != null && entry.sourceSessionId === resolvedSessionId)
          ));
          const hasHistoryMatch = resolvedSessionId != null && prev.history.some((session) => (
            session.id === resolvedSessionId && (session.note || session.breakNote)
          ));

          if (!hasSavedNoteMatch && !hasHistoryMatch) return prev;

          return {
            history: resolvedSessionId != null
              ? prev.history.map((session) => (
                  session.id === resolvedSessionId
                    ? {
                        ...session,
                        note: null,
                        breakNote: null,
                      }
                    : session
                ))
              : prev.history,
            savedNotes: savedNotes.filter((entry) => {
              if (noteId && entry.id === noteId) return false;
              if (resolvedSessionId != null && entry.sourceSessionId === resolvedSessionId) return false;
              return true;
            }),
          };
        }),

      // ─── Hoàn thành phiên tập trung ──────────────────────────────────────
      completeFocusSession: (minutesFocused, categoryId = null, note = '', sessionTiming = null, sessionSnapshot = null) => {
        const state = get();
        const { unlockedSkills } = state.player;
        const totalEP = state.progress.totalEP;
        const overclockPrincipalReturn = state.staking.active
          ? Math.max(0, state.staking.stakedEP ?? 0)
          : 0;
        const rewardSourceEP = totalEP + overclockPrincipalReturn;
        const activeBook = getActiveBook(rewardSourceEP);
        let sessionResult = null;

        // Nếu đang trong Khủng Hoảng Kỷ Nguyên chế độ Đương Đầu
        let updatedCrisis = state.eraCrisis;
        let relicEarned   = null;
        let crisisJustPassed = false;

        if (state.eraCrisis.active && state.eraCrisis.choiceMade === 'challenge') {
          const { newCrisisState, completed, failed, relic } =
            updateEraCrisisChallenge(state.eraCrisis, minutesFocused);

          if (failed) {
            get().checkEraCrisisDeadlines();
            return null; // phiên này chỉ xử lý penalty, không tính reward thông thường
          }

          updatedCrisis    = newCrisisState;
          relicEarned      = relic;
          crisisJustPassed = completed;
        }

        // ─── Combo / Momentum ───────────────────────────────────────────
        const now_ts          = Date.now();
        const lastSessionTs   = state.combo?.lastSessionTs ?? 0;
        const gapMs           = now_ts - lastSessionTs;
        const prevComboCount  = state.combo?.count ?? 0;
        const effectiveComboDecayMs = getComboDecayMs(
          unlockedSkills,
          state.relics,
          state.relicEvolutions,
        );
        const newComboCount   = (lastSessionTs > 0 && gapMs < effectiveComboDecayMs)
          ? prevComboCount + 1 : 1;
        const comboStacks     = Math.min(newComboCount - 1, COMBO_MAX_STACKS);
        const comboBonusPct   = comboStacks * COMBO_BONUS_PER_STACK;

        // Tổng hợp buff đang hoạt động (danh xưng + di vật + prestige + tiến hóa)
        const activeBuffs = aggregateActiveBuffs(
          activeBook,
          state.rankSystem,
          state.relics,
          state.prestige.permanentBonus,
          state.relicEvolutions ?? {},
        );

        // ─── Xây dựng sessionCtx cho gameMath ───────────────────────────
        const today             = localDateStr();
        const dt                = state.dailyTracking;
        const isToday           = dt.date === today;
        const sessionsToday     = isToday ? dt.sessionsCompleted : 0;
        const catsToday         = isToday ? (dt.categoriesUsed ?? []) : [];
        const trimmedNote       = note?.trim() || '';
        const trimmedGoal       = sessionSnapshot?.goal?.trim() || '';
        const trimmedNextNote   = sessionSnapshot?.nextNote?.trim() || '';
        const noteWordCount     = countWords(trimmedNote);
        const qualifiesMissionNote = noteWordCount >= MISSION_NOTE_MIN_WORDS;
        const cat               = state.categoryTracking;
        const consecutiveSameCat = (categoryId && cat.lastCategoryId === categoryId)
          ? cat.consecutiveCount + 1
          : (categoryId ? 1 : 0);
        const uniqueCatsToday   = new Set([...catsToday, ...(categoryId ? [categoryId] : [])]);

        // weekly unique categories: lấy từ history 7 ngày gần nhất
        const weekAgo           = Date.now() - 7 * 86_400_000;
        const weeklyCategories  = [
          ...new Set(
            state.history
              .filter((h) => new Date(h.timestamp).getTime() >= weekAgo && h.categoryId)
              .map((h) => h.categoryId)
          ),
        ];

        // Đồng bộ charge kỹ năng hàng ngày
        const saRaw        = state.skillActivations;
        const saToday      = saRaw.lastResetDate === today;
        const skillAct     = saToday ? saRaw : makeDefaultSkillActivations();

        // Bonus RP chỉ áp dụng cho danh mục đầu tiên được ghi nhận trong ngày.
        const isNewCategoryToday = !!categoryId && catsToday.length === 0;

        const refreshedMissionsForSession = refreshMissionsIfStale(state.missions);
        const activeStreak = refreshStreakIfExpired(state.streak, Date.now(), unlockedSkills);

        // V2: tính daily goal có đạt chưa (cho Cố Vấn)
        const dailyGoalCfg = readDailyGoalSettings();
        const focusMinutesToday = isToday
          ? state.history
              .filter((h) => localDateStr(h.timestamp) === today)
              .reduce((sum, h) => sum + (h.minutes ?? 0), 0)
          : 0;
        // Cố Vấn áp dụng cho phiên SAU khi goal đã đạt
        const dailyGoalAchieved = dailyGoalCfg.type === 'sessions'
          ? sessionsToday >= dailyGoalCfg.sessions
          : focusMinutesToday >= dailyGoalCfg.minutes;

        // V2: Nhịp Hoàn Hảo bonus today?
        const nhipHoanHaoActiveToday = isToday
          && state.player.nhipHoanHaoBonusDay === today;

        // V2: Kế Hoạch Hoàn Hảo weekly buff active?
        const currentWeekKey = localWeekMondayStr();
        const keHoachWeeklyBuffActive = state.player.keHoachWeeklyBuffWeekKey === currentWeekKey;

        const sessionCtx = {
          consecutiveSessionsToday: sessionsToday,
          superFocusActive:         skillAct.superFocusActive,
          luckyModeActive:          skillAct.luckyModeActive,
          breakCompletedOnTime:     state.sessionMeta.breakCompletedOnTime,
          isFirstSessionToday:      sessionsToday === 0,
          sessionsCompletedToday:   sessionsToday,
          currentStreak:            activeStreak.currentStreak,
          lastSessionCancelled:     state.sessionMeta.lastSessionCancelled,
          consecutiveSameCat,
          diverseCategoriesBonus:   uniqueCatsToday.size >= 3,
          weeklyCategories,
          balancedDayBonus:         isToday && (
            (dt.hasShortSession && minutesFocused >= 60)
            || (dt.hasLongSession && minutesFocused <= 25)
          ),
          isFirstSessionInNewEra:   isToday && dt.justEnteredNewEra,
          erasCompleted:            state.eraTracking.erasCompleted,
          sessionsInCurrentEra:     state.eraTracking.sessionsInCurrentEra,
          allDailyMissionsDone:     refreshedMissionsForSession.list.length > 0 &&
                                    refreshedMissionsForSession.list.every((m) => m.claimed),
          isNewCategoryToday,
          wonderRPBonus:            getWonderRPBonus(state.buildings),
          // V2 fields
          benVungActive:            !!state.player.benVungUnlocked,
          nhipHoanHaoActiveToday,
          hasSession45Today:        isToday && !!dt.hasSession45,
          hasSession60Today:        isToday && !!dt.hasSession60,
          dailyGoalAchieved,
          nextSessionBuffs:         Array.isArray(state.player.skillBuffQueue) ? state.player.skillBuffQueue : [],
          keHoachWeeklyBuffActive,
        };

        // Tính toán phần thưởng phiên và gộp thêm bonus Wonder còn hoạt động.
        const baseReward = calculateRewards(minutesFocused, unlockedSkills, rewardSourceEP, activeBuffs, sessionCtx);
        const overclockRewardMultiplier = state.staking.active
          ? (state.staking.rewardMultiplier ?? OVERCLOCK_REWARD_MULTIPLIER)
          : 1;
        const boostedReward = applyOverclockRewardBonus(baseReward, overclockRewardMultiplier);
        const economyRewardModifiers = getEconomyRewardModifiers(state.buildings, state.buildingLevels);
        const rawRewardMultiplier = getWonderRawRewardMultiplier(state.buildings) * economyRewardModifiers.rawMultiplier;
        const extraRefinedReward = getWonderExtraRefinedReward(state.buildings, minutesFocused);
        const reward = {
          ...boostedReward,
          resources: Object.fromEntries(
            Object.entries(boostedReward.resources ?? {}).map(([resId, amount]) => ([
              resId,
              Math.max(0, Math.round((amount ?? 0) * rawRewardMultiplier)),
            ])),
          ),
          t2Drop: Math.round((((boostedReward.t2Drop ?? 0) * economyRewardModifiers.refinedMultiplier) + extraRefinedReward) * 100) / 100,
        };

        // ─── Sự kiện tích cực ngẫu nhiên (ưu tiên era-specific) ─────────
        const eraSpecific = ERA_MINI_EVENTS[activeBook] ?? [];
        const allPossible = [...eraSpecific, ...POSITIVE_EVENTS];
        const eligibleEvents = allPossible.filter((e) => minutesFocused >= e.minMinutes);
        let positiveEvent = null;
        for (const evt of eligibleEvents) {
          if (Math.random() < evt.chance) { positiveEvent = evt; break; }
        }
        const positiveEventBonus = positiveEvent
          ? Math.round(reward.finalXP * positiveEvent.bonusPct * POSITIVE_EVENT_XP_SCALE) : 0;
        const positiveEventRPBonus = positiveEvent
          ? Math.round((reward.rpEarned ?? 0) * (positiveEvent.rpBonusPct ?? positiveEvent.bonusPct ?? 0))
          : 0;
        const comboBonus = Math.round(reward.finalXP * comboBonusPct);

        // Kiểm tra cập nhật Thử Thách Thăng Cấp đang active
        let newRankChallenge = state.rankChallenge;
        let rankJustCompleted = false;
        let newRankSystem     = { ...state.rankSystem };

        if (state.rankChallenge?.active) {
          const { challenge, completed, failed } =
            updateRankChallenge(state.rankChallenge, minutesFocused);
          newRankChallenge = challenge;

          if (failed) {
            const penalizedRes = applyRankChallengePenalty(state.resources);
            set((prev) => ({
              resources:     penalizedRes,
              rankChallenge: null,
              latestSessionUndo: null,
              ui: {
                ...prev.ui,
                pendingDisaster: {
                  disaster:  { label: 'Thử Thách Thất Bại', icon: '💔', description: `Bạn không hoàn thành thử thách thăng cấp lên bậc ${challenge.targetRankLabel} kịp thời. Mất 5% tài nguyên.` },
                  deducted:  {},
                  waived:    false,
                  chargeConsumed: false,
                },
                disasterModalOpen: true,
              },
            }));
            return null;
          }

          if (completed) {
            const bookKey = `book${challenge.bookNumber}`;
            newRankSystem = { ...newRankSystem, [bookKey]: challenge.targetRankIdx };
            newRankChallenge = null;
            rankJustCompleted = true;
          }
        }

        // Gộp tài nguyên
        const newResources = mergeResources(
          state.resources,
          reward.resources,
          reward.activeBook,
        );

        // Thêm di vật nếu có
        const newRelics = relicEarned
          ? [...state.relics, relicEarned]
          : state.relics;

        // Streak advancement — V2: dùng skill check cho Lá Chắn Streak
        const newStreak = advanceStreak(activeStreak, unlockedSkills);
        const streakBonusDays = Math.min(newStreak.currentStreak, getWonderStreakBonusCap(state.buildings));
        const streakBonusXP = Math.floor(reward.finalXP * streakBonusDays * STREAK_BONUS_PER_DAY);

        // V2: Bền Vững — kích hoạt khi streak đạt 30 lần đầu
        const benVungJustUnlocked = !!unlockedSkills.ben_vung
          && !state.player.benVungUnlocked
          && newStreak.currentStreak >= 30;

        const overclockBonusXP = Math.max(0, (reward.finalXP ?? 0) - (baseReward.finalXP ?? 0));
        const baseSessionXP = reward.finalXP + comboBonus + positiveEventBonus + streakBonusXP;

        const resolvedStartedAt = sessionTiming?.startedAt ?? null;
        const resolvedFinishedAt = sessionTiming?.finishedAt ?? new Date().toISOString();
        const newBlueprints = state.blueprints;
        const sessionId = Date.now();

        // Weekly chain progress
        const refreshedChain = refreshWeeklyChain(state.weeklyChain);
        const chain = WEEKLY_CHAINS[refreshedChain.chainIndex];
        const currentWeekHistory = getHistoryWeekEntries(state.history, refreshedChain.weekKey);
        const weeklySnapshot = buildWeeklyProgressSnapshot([
          ...currentWeekHistory,
          {
            timestamp: resolvedFinishedAt,
            minutes: minutesFocused,
            categoryId: categoryId ?? null,
            note: trimmedNote || null,
            breakCompletedOnTime: false,
            breakCompletedAt: null,
          },
        ], refreshedChain.weekKey);
        const chainStep = chain?.steps[refreshedChain.currentStep];
        const newChainStepProgress = chainStep && refreshedChain.currentStep < chain.steps.length
          ? getWeeklyStepProgress(chainStep, weeklySnapshot)
          : refreshedChain.stepProgress;
        const newWeeklyChain = { ...refreshedChain, stepProgress: newChainStepProgress };

        // ── RP cộng dồn ───────────────────────────────────────────────────
        const finalSessionRP = (reward.rpEarned ?? 0) + positiveEventRPBonus;
        const newResearchRP = (state.research?.rp ?? 0) + finalSessionRP;

        // ── Nguyên liệu tinh luyện rớt tự nhiên ──────────────────────────
        const eraKey = reward.activeBook;
        const prevRefined = normalizeRefinedBag(state.resourcesRefined?.[eraKey]);
        const newRefined  = {
          ...state.resourcesRefined,
          [eraKey]: {
            t2: prevRefined.t2 + (reward.t2Drop ?? 0),
            t3: 0,
          },
        };

        // ── Crafting queue: tick progress (mỗi phiên hoàn thành = 1 progress) ─
        const prevQueue = state.craftingQueue ?? [];
        const nextQueue = [];
        const newlyBuilt = [];
        for (const item of prevQueue) {
          const remaining = item.sessionsRemaining - 1;
          if (remaining <= 0) {
            newlyBuilt.push(item.bpId);
          } else {
            nextQueue.push({ ...item, sessionsRemaining: remaining });
          }
        }
        const newBuildings = [...state.buildings, ...newlyBuilt];

        // ─── Cập nhật category tracking ──────────────────────────────────
        const categoryTrackingUpd = {
          lastCategoryId:   categoryId ?? null,
          consecutiveCount: consecutiveSameCat,
        };

        const consumedSuperFocus = skillAct.superFocusActive
          && minutesFocused >= SIEU_TAP_TRUNG_MIN_MIN;
        const consumedLuckyMode = skillAct.luckyModeActive
          && minutesFocused >= SO_DO_MIN_MINUTES;

        // ─── Reset skill activations (chỉ tiêu charge khi phiên đủ điều kiện) ─
        const skillActivationsUpd = {
          ...skillAct,
          lastResetDate:    today,
          superFocusActive: skillAct.superFocusActive && !consumedSuperFocus,
          superFocusChargesUsed: consumedSuperFocus
            ? skillAct.superFocusChargesUsed + 1
            : skillAct.superFocusChargesUsed,
          luckyModeActive:  skillAct.luckyModeActive && !consumedLuckyMode,
          luckyModeChargesUsed: consumedLuckyMode
            ? skillAct.luckyModeChargesUsed + 1
            : skillAct.luckyModeChargesUsed,
        };

        set((prev) => {
          const newSessions     = prev.progress.sessionsCompleted + 1;
          const newTotalMinutes = prev.progress.totalFocusMinutes + minutesFocused;
          const freshDt = isToday ? dt : makeDefaultDailyTracking();
          const deepSessionsToday = (freshDt.deepSessionsCompleted ?? 0) + (minutesFocused >= 45 ? 1 : 0);
          const balancedSessionsToday = (
            (freshDt.hasShortSession || minutesFocused <= 25)
            && (freshDt.hasLongSession || minutesFocused >= 60)
          );

          // Mission progress tick
          const refreshedMissions = refreshMissionsIfStale(prev.missions);
          const updatedMissionList = refreshedMissions.list.map((m) => {
            if (m.claimed) return m;
            let progress = m.progress;
            if (m.type === 'sessions') progress = Math.min(m.goal, progress + 1);
            if (m.type === 'focusMinutes') progress = Math.min(m.goal, progress + minutesFocused);
            if (m.type === 'singleSession') progress = minutesFocused >= m.goal ? m.goal : progress;
            if (m.type === 'researchPoints') progress = Math.min(m.goal, progress + finalSessionRP);
            if (m.type === 'uniqueCategories') progress = Math.min(m.goal, uniqueCatsToday.size);
            if (m.type === 'deepSessions') progress = Math.min(m.goal, deepSessionsToday);
            if (m.type === 'notes' && qualifiesMissionNote) progress = Math.min(m.goal, progress + 1);
            if (m.type === 'balancedSessions') progress = balancedSessionsToday ? m.goal : progress;
            return { ...m, progress };
          });
          const newlyCompletedMissionIds = updatedMissionList
            .filter((m) => !m.claimed && m.progress >= m.goal)
            .map((m) => m.id);
          const missionBonusXPBase = newlyCompletedMissionIds.reduce((sum, id) => {
            const m = updatedMissionList.find((x) => x.id === id);
            return sum + (m?.rewardXP ?? 0);
          }, 0);
          const missionBonusXP = applyDailyMissionXPBonus(prev.buildings, missionBonusXPBase);

          // Streak bonus mission: awarded each day streak ≥ 7, once per day
          const streakMissionXPBase = (
            !refreshedMissions.streakMissionClaimedToday &&
            newStreak.currentStreak >= STREAK_MISSION_MIN_STREAK
          ) ? Math.min(
            STREAK_MISSION_BASE_XP + (newStreak.currentStreak - STREAK_MISSION_MIN_STREAK) * STREAK_MISSION_XP_PER_DAY,
            STREAK_MISSION_MAX_XP,
          ) : 0;
          const streakMissionXP = applyDailyMissionXPBonus(prev.buildings, streakMissionXPBase);

          const newMissions = {
            ...refreshedMissions,
            list: updatedMissionList.map((m) =>
              newlyCompletedMissionIds.includes(m.id) ? { ...m, claimed: true } : m
            ),
            streakMissionClaimedToday: streakMissionXP > 0 ? true : refreshedMissions.streakMissionClaimedToday,
          };
          const finalSessionXP = baseSessionXP + missionBonusXP + streakMissionXP;
          const finalSessionEP = Math.max(0, Math.round(reward.finalEP ?? 0));
          const finalTotalEP = prev.progress.totalEP + finalSessionEP + overclockPrincipalReturn;
          const finalBook = getActiveBook(finalTotalEP);
          const eraChanged = finalBook !== activeBook;
          const { newLevel, newTotalEXP, levelsGained, spGained } =
            computeLevelUps(prev.player.totalEXP, finalSessionXP);
          sessionResult = {
            sessionId,
            xpEarned: finalSessionXP,
            epEarned: finalSessionEP,
          };

          let newEraCrisis = updatedCrisis;
          if (!prev.eraCrisis.active || crisisJustPassed) {
            const detectedCrisis = detectEraCrisis(rewardSourceEP, finalTotalEP);
            if (detectedCrisis) {
              newEraCrisis = createEraCrisisState(detectedCrisis);
            }
          }

          const pauseSegments = Array.isArray(sessionTiming?.pauseSegments)
            ? sessionTiming.pauseSegments
            : [];
          const pausedTotalMs = Number.isFinite(sessionTiming?.pausedTotalMs)
            ? Math.max(0, sessionTiming.pausedTotalMs)
            : 0;
          const wallClockDurationMs = Number.isFinite(sessionTiming?.wallClockDurationMs)
            ? Math.max(0, sessionTiming.wallClockDurationMs)
            : null;
          const sessionEntry = {
            id:               sessionId,
            book:             reward.activeBook,
            timestamp:        resolvedFinishedAt,
            startedAt:        resolvedStartedAt,
            finishedAt:       resolvedFinishedAt,
            pauseSegments,
            pausedTotalMs,
            wallClockDurationMs,
            minutes:          minutesFocused,
            xpEarned:         finalSessionXP,
            epEarned:         finalSessionEP,
            tier:             reward.tierLabel,
            multiplier:       reward.multiplier,
            jackpot:          reward.jackpotTriggered,
            resources:        reward.resources,
            rpEarned:         finalSessionRP,
            refinedEarned:    reward.t2Drop ?? 0,
            blueprint:        null,
            categoryId:       categoryId ?? null,
            categorySnapshot: sessionSnapshot?.categorySnapshot ?? null,
            comboCount:       newComboCount,
            positiveEvent:    positiveEvent,
            positiveEventRPBonus,
            note:             trimmedNote || null,
            breakNote:        null,
            goal:             trimmedGoal || null,
            goalAchieved:     null,
            nextNote:         trimmedNextNote || null,
            breakCompletedOnTime: false,
            breakCompletedAt: null,
          };
          const newHistory = [sessionEntry, ...prev.history].slice(0, 2000);
          const newSavedNotes = upsertSavedNoteEntry(prev.savedNotes ?? [], sessionEntry);
          const currentHistoryStats = normalizeStoredHistoryStats(prev.historyStats, prev.history);
          const sessionWasBlueprint = (reward.t2Drop ?? 0) > 0 || minutesFocused >= 45;
          const nextHistoryStats = {
            bestSessionMinutes: currentHistoryStats.bestSessionMinutes,
            bestSessionXP: currentHistoryStats.bestSessionXP,
            bestSessionId: currentHistoryStats.bestSessionId,
            totalJackpots: currentHistoryStats.totalJackpots + (reward.jackpotTriggered ? 1 : 0),
            totalBlueprints: currentHistoryStats.totalBlueprints + (sessionWasBlueprint ? 1 : 0),
            sessionsWithGoal: currentHistoryStats.sessionsWithGoal,
            reviewedCount: currentHistoryStats.reviewedCount,
            achievedCount: currentHistoryStats.achievedCount,
            missedCount: currentHistoryStats.missedCount,
            pendingCount: currentHistoryStats.pendingCount,
          };
          if (minutesFocused >= currentHistoryStats.bestSessionMinutes) {
            nextHistoryStats.bestSessionMinutes = minutesFocused;
            nextHistoryStats.bestSessionXP = finalSessionXP;
            nextHistoryStats.bestSessionId = sessionId;
          }
          const nextHistoryStatsWithReview = applyHistoryReviewStatsDelta(nextHistoryStats, null, sessionEntry);

          const etPrev = prev.eraTracking;
          const eraTrackingUpd = {
            sessionsInCurrentEra: eraChanged ? 1 : etPrev.sessionsInCurrentEra + 1,
            currentEraBook:       eraChanged ? finalBook : etPrev.currentEraBook,
            erasCompleted:        eraChanged ? etPrev.erasCompleted + 1 : etPrev.erasCompleted,
          };

          const catsUpdated = categoryId && !catsToday.includes(categoryId)
            ? [...catsToday, categoryId] : catsToday;
          const newSessionsCompletedToday = (freshDt.sessionsCompleted ?? 0) + 1;
          const dailyTrackingUpd = {
            date:              today,
            sessionsCompleted: newSessionsCompletedToday,
            categoriesUsed:    catsUpdated,
            deepSessionsCompleted: deepSessionsToday,
            hasShortSession:   freshDt.hasShortSession || minutesFocused <= 25,
            hasLongSession:    freshDt.hasLongSession  || minutesFocused >= 60,
            // V2 thresholds cho Lịch Đầy
            hasSession45:      (!!freshDt.hasSession45) || minutesFocused >= 45,
            hasSession60:      (!!freshDt.hasSession60) || minutesFocused >= 60,
            justEnteredNewEra: eraChanged,
          };

          // V2: Lộc Ban Tặng — đếm phiên ≥30, mỗi 7 lần thưởng bonus
          let nextLocBanTangCounter = prev.player.locBanTangCounter ?? 0;
          let locBanTangBonusXP = 0;
          let locBanTangBonusRefined = 0;
          if (unlockedSkills.loc_ban_tang && minutesFocused >= 30) {
            nextLocBanTangCounter += 1;
            if (nextLocBanTangCounter >= 7) {
              nextLocBanTangCounter = 0;
              locBanTangBonusXP = 200;
              locBanTangBonusRefined = 1;
            }
          }

          // V2: Nhịp Hoàn Hảo — track ngày liên tiếp ≥6 phiên
          let nextNhipHoanHaoStreakDays = prev.player.nhipHoanHaoStreakDays ?? 0;
          let nextNhipHoanHaoLastSixDate = prev.player.nhipHoanHaoLastSixDate;
          let nextNhipHoanHaoBonusDay = prev.player.nhipHoanHaoBonusDay;
          if (newSessionsCompletedToday === 6) {
            // Vừa đủ 6 phiên hôm nay (chỉ trigger 1 lần ở phiên thứ 6)
            const yesterday = localDateStr(Date.now() - 86_400_000);
            if (nextNhipHoanHaoLastSixDate === today) {
              // Already counted today — no-op
            } else if (nextNhipHoanHaoLastSixDate === yesterday) {
              nextNhipHoanHaoStreakDays += 1;
            } else {
              nextNhipHoanHaoStreakDays = 1;
            }
            nextNhipHoanHaoLastSixDate = today;
            // Khi đủ 3 ngày liên tiếp → ngày mai active buff
            if (nextNhipHoanHaoStreakDays >= 3) {
              nextNhipHoanHaoBonusDay = localDateStr(Date.now() + 86_400_000);
            }
          }

          // V2: Decrement skill buff queue (consumed 1 session)
          const decrementedBuffQueue = (prev.player.skillBuffQueue ?? [])
            .map((b) => ({ ...b, sessionsRemaining: b.sessionsRemaining - 1 }))
            .filter((b) => b.sessionsRemaining > 0);

          // V2: Lộc Ban Tặng refined T2 → cộng vào kho refined của era hiện tại
          let refinedAfterLBT = newRefined;
          if (locBanTangBonusRefined > 0) {
            const eraKey = reward.activeBook;
            const prevRefined2 = normalizeRefinedBag(refinedAfterLBT[eraKey]);
            refinedAfterLBT = {
              ...refinedAfterLBT,
              [eraKey]: {
                t2: prevRefined2.t2 + locBanTangBonusRefined,
                t3: 0,
              },
            };
          }

          const nextPlayer = {
            ...prev.player,
            level:    newLevel,
            totalEXP: newTotalEXP + locBanTangBonusXP,
            sp:       prev.player.sp + spGained,
            // V2 fields
            benVungUnlocked: prev.player.benVungUnlocked || benVungJustUnlocked,
            locBanTangCounter: nextLocBanTangCounter,
            nhipHoanHaoStreakDays: nextNhipHoanHaoStreakDays,
            nhipHoanHaoLastSixDate: nextNhipHoanHaoLastSixDate,
            nhipHoanHaoBonusDay: nextNhipHoanHaoBonusDay,
            skillBuffQueue: decrementedBuffQueue,
          };

          let resourcesAfterCarry = newResources;
          // V2: Bắt đầu từ refinedAfterLBT (đã cộng Lộc Ban Tặng nếu có)
          let refinedAfterCarry = refinedAfterLBT;
          if (eraChanged) {
            const wonderEffects = aggregateWonderEffects(prev.buildings);

            if (wonderEffects.has('era_carry_10pct')) {
              const nextEraResources = ERA_METADATA[finalBook]?.resources ?? [];
              const nextRawIds = nextEraResources.map((res) => res.id);
              const prevBookKey = `book${prev.progress.activeBook}`;
              const nextBookKey = `book${finalBook}`;
              const prevBookBag = newResources[prevBookKey] ?? {};
              const carryTotal = Math.floor(
                Object.values(prevBookBag).reduce((sum, amount) => sum + (amount ?? 0), 0) * 0.10,
              );

              if (carryTotal > 0 && nextRawIds.length > 0) {
                const nextBookBag = { ...(newResources[nextBookKey] ?? {}) };
                const baseShare = Math.floor(carryTotal / nextRawIds.length);
                const remainder = carryTotal - baseShare * nextRawIds.length;

                nextRawIds.forEach((resId, index) => {
                  const bonus = baseShare + (index < remainder ? 1 : 0);
                  nextBookBag[resId] = (nextBookBag[resId] ?? 0) + bonus;
                });

                resourcesAfterCarry = {
                  ...newResources,
                  [nextBookKey]: nextBookBag,
                };
              }
            }

            if (wonderEffects.has('era_carry_refined_12')) {
              refinedAfterCarry = {
                ...refinedAfterCarry,
                [finalBook]: {
                  t2: normalizeRefinedBag(refinedAfterCarry[finalBook]).t2 + 12,
                  t3: 0,
                },
              };
            }
          }

          const prevForgivenessCapacity = getWonderForgivenessCapacity(prev.buildings);
          const nextForgivenessCapacity = getWonderForgivenessCapacity(newBuildings);
          const forgivenessChargesRemaining = nextForgivenessCapacity > prevForgivenessCapacity
            ? Math.min(nextForgivenessCapacity, prev.forgiveness.chargesRemaining + (nextForgivenessCapacity - prevForgivenessCapacity))
            : Math.min(nextForgivenessCapacity, prev.forgiveness.chargesRemaining);

          // Kiểm tra thành tích mới mở khóa
          const achSnapshot   = buildAchievementSnapshot(
            { sessionsCompleted: newSessions, totalFocusMinutes: newTotalMinutes, totalEP: finalTotalEP, activeBook: finalBook },
            newRelics,
            newBlueprints,
            prev.research,
            newHistory,
            newRankSystem,
            newStreak,
            newBuildings,
            prev.prestige,
            nextPlayer,
          );
          const newlyUnlocked = checkAchievements(prev.achievements.unlocked, achSnapshot);

          const syncedProgress = syncLongBreakCycleProgress(prev.progress, now_ts);
          const sessionNotifications = [
            eraChanged ? makeEraUpFeedNotification(finalBook) : null,
            rankJustCompleted ? makeRankUpFeedNotification(
              state.rankChallenge?.bookNumber,
              state.rankChallenge?.targetRankIdx,
            ) : null,
            newlyBuilt.length > 0 ? makeWorkshopCompletedNotification(newlyBuilt) : null,
          ].filter(Boolean);

          return {
            player: nextPlayer,
            progress: {
              ...syncedProgress,
              totalEP:           finalTotalEP,
              activeBook:        finalBook,
              sessionsCompleted: newSessions,
              totalFocusMinutes: newTotalMinutes,
              longBreakGraceDeadlineAt: null,
              longBreakPreviewSession: false,
            },
            resources:     resourcesAfterCarry,
            rankSystem:    newRankSystem,
            rankChallenge: newRankChallenge,
            eraCrisis:     newEraCrisis,
            relics:        newRelics,
            blueprints:    newBlueprints,
            achievements:  appendAchievementUnlocks(prev.achievements, newlyUnlocked, resolvedFinishedAt),
            history:       newHistory,
            historyStats:  nextHistoryStatsWithReview,
            savedNotes:    newSavedNotes,
            streak:        newStreak,
            missions:      newMissions,
            buildings:     newBuildings,
            forgiveness:   { ...prev.forgiveness, chargesRemaining: forgivenessChargesRemaining },
            staking:       makeDefaultStaking(),
            prestige:      prev.prestige,
            weeklyChain:   newWeeklyChain,
            combo:            { count: newComboCount, lastSessionTs: now_ts },
            dailyTracking:    dailyTrackingUpd,
            skillActivations: skillActivationsUpd,
            categoryTracking: categoryTrackingUpd,
            eraTracking:      eraTrackingUpd,
            sessionMeta:      { lastSessionCancelled: false, breakCompletedOnTime: false },
            research:         { ...prev.research, rp: newResearchRP },
            craftingQueue:    nextQueue,
            resourcesRefined: refinedAfterCarry,
            latestSessionUndo: prev.latestSessionUndo
              ? { ...prev.latestSessionUndo, sessionId }
              : null,
            ui: {
              ...prev.ui,
              lootModalOpen: true,
              notificationFeed: appendUiNotifications(prev.ui.notificationFeed, sessionNotifications),
              pendingReward: {
                ...reward,
                comboCount:          newComboCount,
                comboBonus,
                positiveEvent,
                positiveEventBonus,
                totalSessionXP:       finalSessionXP,
                levelsGained,
                spGained,
                newLevel,
                eraChanged,
                newBook:              finalBook,
                streakBonus:          streakBonusXP,
                streakMissionXP,
                streakDays:          newStreak.currentStreak,
                overclockBonus:      overclockBonusXP,
                missionCompletedIds: newlyCompletedMissionIds,
                missionBonusXP,
                positiveEventRPBonus,
                rpEarned: finalSessionRP,
              },
              levelUpQueue: levelsGained > 0
                ? [...prev.ui.levelUpQueue, { levelsGained, newLevel, spGained }]
                : prev.ui.levelUpQueue,
              relicNotification: relicEarned,
              rankUpNotification: rankJustCompleted
                ? { rankLabel: RANK_SYSTEM[state.rankChallenge?.bookNumber]?.ranks[state.rankChallenge?.targetRankIdx]?.label, rankIcon: RANK_SYSTEM[state.rankChallenge?.bookNumber]?.ranks[state.rankChallenge?.targetRankIdx]?.icon }
                : prev.ui.rankUpNotification,
              eraCrisisModalOpen: newEraCrisis.active && !state.eraCrisis.active,
              achievementQueue: newlyUnlocked.length > 0
                ? [...prev.ui.achievementQueue, ...newlyUnlocked]
                : prev.ui.achievementQueue,
              missionCompletedIds: newlyCompletedMissionIds.length > 0
                ? [...(prev.ui.missionCompletedIds ?? []), ...newlyCompletedMissionIds]
                : (prev.ui.missionCompletedIds ?? []),
            },
          };
        });

        return sessionResult;
      },

      // ─── Hủy phiên tập trung (Thảm Họa) ─────────────────────────────────
      cancelFocusSession: (progressRatio = 0, options = {}) => {
        const state = get();
        const { applyDisaster = true } = options;
        const { unlockedSkills } = state.player;
        const { chargesRemaining, weekStartTimestamp } = state.forgiveness;

        // Giam Cầm Năng Lượng — thất bại: mất hoàn toàn số EP đã giam
        // (EP đã bị trừ khi activateOverclock, chỉ cần xóa state)
        // const overclockLost = state.staking.stakedEP; // (đã bị trừ)

        const now     = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const forgivenessCapacity = getWonderForgivenessCapacity(state.buildings);
        const freshCharges = now - weekStartTimestamp >= oneWeek
          ? forgivenessCapacity
          : chargesRemaining;

        if (!applyDisaster) {
          set((prev) => ({
            staking: makeDefaultStaking(),
            progress: state.timerConfig.mode === 'pomodoro'
              ? markLongBreakCycleBreakEnded(prev.progress, now)
              : syncLongBreakCycleProgress(prev.progress, now),
            sessionMeta: { ...prev.sessionMeta, lastSessionCancelled: true },
            latestSessionUndo: null,
            ui: {
              ...prev.ui,
              disasterModalOpen: false,
              pendingDisaster: null,
            },
          }));
          return;
        }

        // Tổng hợp disasterReduction từ di vật tiến hóa
        const _cancelEvos     = state.relicEvolutions ?? {};
        const disasterRedBuff = state.relics.reduce((acc, r) => {
          const stage = _cancelEvos[r.id] ?? 0;
          const evoDef = RELIC_EVOLUTION[r.id];
          const buff   = evoDef?.stages[stage]?.buff ?? r.buff ?? {};
          return acc + (buff.disasterReduction ?? 0);
        }, 0);
        const normalizedProgressRatio = Math.max(0, Math.min(1, progressRatio));
        const activeBook = getActiveBook(state.progress.totalEP);
        const penaltyBookKey = `book${activeBook}`;
        const timerSession = state.timerSession ?? {};
        const totalSeconds = Number.isFinite(timerSession.totalSeconds)
          ? Math.max(0, timerSession.totalSeconds)
          : 0;
        const elapsedMinutes = totalSeconds > 0
          ? Math.max(0, Math.floor((totalSeconds * normalizedProgressRatio) / 60))
          : 0;
        const today = localDateStr();
        const currentWeekKey = localWeekMondayStr();
        const dt = state.dailyTracking;
        const isToday = dt.date === today;
        const catsToday = isToday ? (dt.categoriesUsed ?? []) : [];
        const sessionCategoryId = timerSession.categoryId ?? state.pendingCategoryId ?? null;
        const uniqueCatsToday = new Set([
          ...catsToday,
          ...(sessionCategoryId ? [sessionCategoryId] : []),
        ]);
        const activeBuffs = aggregateActiveBuffs(
          activeBook,
          state.rankSystem,
          state.relics,
          state.prestige.permanentBonus,
          state.relicEvolutions ?? {},
        );
        const resourceFloor = calculateSessionResourceFloor(
          elapsedMinutes,
          unlockedSkills,
          state.progress.totalEP,
          activeBuffs,
          {
            diverseCategoriesBonus: uniqueCatsToday.size >= 3,
            balancedDayBonus: elapsedMinutes > 0 && isToday && (
              (dt.hasShortSession && elapsedMinutes >= 60)
              || (dt.hasLongSession && elapsedMinutes <= 25)
            ),
            benVungActive: !!state.player.benVungUnlocked,
            hasSession45Today: isToday && !!dt.hasSession45,
            hasSession60Today: isToday && !!dt.hasSession60,
            keHoachWeeklyBuffActive: state.player.keHoachWeeklyBuffWeekKey === currentWeekKey,
          },
        );
        const resourceLossCap = {
          [penaltyBookKey]: resourceFloor.resources,
        };

        const result = applyDisasterPenalty(
          state.resources,
          unlockedSkills,
          freshCharges,
          disasterRedBuff,
          normalizedProgressRatio,
          getWonderCancelPenaltyMultiplier(state.buildings)
            * getBuildingCancelPenaltyMultiplier(state.buildings, state.buildingLevels),
          {
            scopeBookKey: penaltyBookKey,
            resourceLossCap,
          },
        );

        const newCharges = result.chargeConsumed
          ? Math.max(0, freshCharges - 1)
          : freshCharges;

        const buildingDamage = null;

        set((prev) => ({
          resources: result.newResources,
          staking:   makeDefaultStaking(),
          progress: state.timerConfig.mode === 'pomodoro'
            ? markLongBreakCycleBreakEnded(prev.progress, now)
            : syncLongBreakCycleProgress(prev.progress, now),
          forgiveness: {
            chargesRemaining:  newCharges,
            weekStartTimestamp: now - prev.forgiveness.weekStartTimestamp >= oneWeek
              ? now
              : prev.forgiveness.weekStartTimestamp,
          },
          sessionMeta: { ...prev.sessionMeta, lastSessionCancelled: true },
          ui: {
            ...prev.ui,
            disasterModalOpen: !result.waived,
            pendingDisaster: {
              disaster:       result.disaster,
              deducted:       result.deducted,
              waived:         result.waived,
              chargeConsumed: result.chargeConsumed,
              progressRatio:  result.progressRatio,
              basePenaltyRate: result.basePenaltyRate,
              adjustedPenaltyRate: result.adjustedPenaltyRate,
              appliedPenaltyRate: result.appliedPenaltyRate,
              skillPenaltyMultiplier: result.skillPenaltyMultiplier,
              skillMode: result.skillMode,
              buildingDamage,
            },
          },
        }));
      },

      // ─── Quản lý danh mục phiên ──────────────────────────────────────────
      setPendingCategory: (categoryId) =>
        set({ pendingCategoryId: categoryId }),

      setPendingNote: (note) =>
        set({ pendingNote: note }),

      setPendingBreakNote: (note) =>
        set({ pendingBreakNote: note }),

      setPendingSessionGoal: (goal) =>
        set({ pendingSessionGoal: goal }),

      setPendingNextSessionNote: (note) =>
        set({ pendingNextSessionNote: note }),

      addCategory: (cat) =>
        set((prev) => ({
          sessionCategories: [...prev.sessionCategories, { ...cat, id: `cat_custom_${Date.now()}` }],
        })),

      deleteCategory: (categoryId) =>
        set((prev) => ({
          sessionCategories: prev.sessionCategories.filter((c) => c.id !== categoryId),
          pendingCategoryId: prev.pendingCategoryId === categoryId ? null : prev.pendingCategoryId,
        })),

      updateCategory: (categoryId, patch) =>
        set((prev) => ({
          sessionCategories: prev.sessionCategories.map((c) =>
            c.id === categoryId ? { ...c, ...patch } : c
          ),
        })),

      // ─── Cây Kỹ Năng ─────────────────────────────────────────────────────
      unlockSkill: (skillId, spCost, requires = []) => {
        const state = get();
        const { sp, unlockedSkills } = state.player;

        // V2: chặn unlock skill đã loại bỏ (chỉ trong save data cũ còn xuất hiện)
        if (REMOVED_SKILLS_V1_TO_V2[skillId]) return false;

        if (unlockedSkills[skillId]) return false;
        if (sp < spCost) return false;
        const prereqsMet = requires.every((req) => unlockedSkills[req]);
        if (!prereqsMet) return false;

        set((prev) => ({
          player: {
            ...prev.player,
            sp: prev.player.sp - spCost,
            unlockedSkills: { ...prev.player.unlockedSkills, [skillId]: true },
          },
          latestSessionUndo: null,
        }));
        return true;
      },

      // ─── Kích hoạt kỹ năng chủ động ─────────────────────────────────────

      /**
       * activateSuperFocus
       * Kích hoạt Siêu Tập Trung (sieu_tap_trung) — base 1 charge/ngày.
       * Nghỉ Ngơi Hoàn Hảo cộng thêm 1 charge nữa.
       */
      activateSuperFocus: () => {
        const state = get();
        if (!state.player.unlockedSkills.sieu_tap_trung) return false;
        const today = localDateStr();
        const sa    = state.skillActivations;
        // Reset charge nếu ngày mới
        const saToday = sa.lastResetDate === today ? sa : makeDefaultSkillActivations();
        const maxCharges = getSuperFocusChargeCap(state.player.unlockedSkills);
        if (saToday.superFocusChargesUsed >= maxCharges) return false;
        set(() => ({
          skillActivations: {
            ...saToday,
            lastResetDate:    today,
            superFocusActive: true,
          },
          latestSessionUndo: null,
        }));
        return true;
      },

      /**
       * activateLuckyMode
       * Kích hoạt Số Đỏ (so_do) — 1 charge/ngày.
       * Phiên tiếp theo: 50% trigger ×3 XP.
       */
      activateLuckyMode: () => {
        const state = get();
        if (!state.player.unlockedSkills.so_do) return false;
        const today = localDateStr();
        const sa    = state.skillActivations;
        const saToday = sa.lastResetDate === today ? sa : makeDefaultSkillActivations();
        if (saToday.luckyModeChargesUsed >= 1) return false;
        set(() => ({
          skillActivations: {
            ...saToday,
            lastResetDate:   today,
            luckyModeActive: true,
          },
          latestSessionUndo: null,
        }));
        return true;
      },

      /**
       * markBreakCompleted
       * Gọi khi người chơi hoàn thành break đúng hạn (cho hit_tho_sau, phien_vang_sang).
       */
      markBreakCompleted: (onTime = true) =>
        set((prev) => {
          if (!prev.ui.isOnBreak) return prev;
          return {
            sessionMeta: { ...prev.sessionMeta, breakCompletedOnTime: !!onTime },
          };
        }),

      // ─── Hệ thống Danh Xưng ──────────────────────────────────────────────

      /**
       * initiateRankChallenge
       * Bắt đầu Thử Thách Thăng Cấp lên bậc tiếp theo.
       * Chỉ gọi khi người chơi chủ động nhấn nút "Thách Đấu".
       */
      initiateRankChallenge: (bookNumber) => {
        const state     = get();
        const bookKey   = `book${bookNumber}`;
        const currentRankIdx = state.rankSystem[bookKey];
        const targetIdx = currentRankIdx + 1;
        const maxRank   = RANK_SYSTEM[bookNumber].ranks.length - 1;

        if (targetIdx > maxRank) return false;
        if (state.rankChallenge?.active) return false;

        const req = RANK_SYSTEM[bookNumber].ranks[targetIdx].challengeRequirement;
        if (!req) {
          const rankUpFeed = makeRankUpFeedNotification(bookNumber, targetIdx);
          // Không cần thử thách — thăng cấp luôn
          set((prev) => ({
            rankSystem: { ...prev.rankSystem, [bookKey]: targetIdx },
            latestSessionUndo: null,
            ui: {
              ...prev.ui,
              notificationFeed: rankUpFeed
                ? appendUiNotification(prev.ui.notificationFeed, rankUpFeed)
                : prev.ui.notificationFeed,
              rankUpNotification: {
                rankLabel: RANK_SYSTEM[bookNumber].ranks[targetIdx].label,
                rankIcon:  RANK_SYSTEM[bookNumber].ranks[targetIdx].icon,
              },
            },
          }));
          return true;
        }

        const challenge = createRankChallenge(bookNumber, targetIdx);
        set({ rankChallenge: challenge, latestSessionUndo: null });
        return true;
      },

      /**
       * checkRankChallengeDeadlines
       * Gọi khi app khởi động để xử lý thử thách hết hạn khi offline.
       */
      checkRankChallengeDeadlines: () => {
        const state = get();
        const { failed } = checkRankChallengeExpiry(state.rankChallenge);
        if (failed) {
          const penalizedRes = applyRankChallengePenalty(state.resources);
          set((prev) => ({
            resources:    penalizedRes,
            rankChallenge: null,
            latestSessionUndo: null,
            ui: {
              ...prev.ui,
              pendingDisaster: {
                disaster:  { label: 'Thử Thách Hết Hạn', icon: '⏰', description: 'Thử thách thăng cấp đã hết thời gian. Mất 5% tài nguyên.' },
                deducted:  {},
                waived:    false,
                chargeConsumed: false,
              },
              disasterModalOpen: true,
            },
          }));
        }
      },

      checkEraCrisisDeadlines: () => {
        const state = get();
        const { failed } = checkEraCrisisChallengeExpiry(state.eraCrisis);
        if (!failed) return false;

        const { newResources, newCrisisState } =
          applyEraCrisisChallengePenalty(state.resources, state.eraCrisis);
        const pendingDisaster = makeEraCrisisExpiredDisaster(state.eraCrisis);

        set((prev) => ({
          resources: newResources,
          eraCrisis: newCrisisState,
          latestSessionUndo: null,
          ui: {
            ...prev.ui,
            eraCrisisModalOpen: false,
            disasterModalOpen: true,
            pendingDisaster,
          },
        }));

        return true;
      },

      // ─── Khủng Hoảng Kỷ Nguyên ───────────────────────────────────────────

      /**
       * resolveEraCrisis
       * Người chơi chọn 'sacrifice' hoặc 'challenge'.
       */
      resolveEraCrisis: (choice) => {
        const state = get();
        if (!state.eraCrisis.active) return;

        if (choice === 'sacrifice') {
          const { newResources, newCrisisState } =
            applyEraCrisisSacrifice(state.resources, state.eraCrisis);
          set((prev) => ({
            resources: newResources,
            eraCrisis: newCrisisState,
            latestSessionUndo: null,
            ui: { ...prev.ui, eraCrisisModalOpen: false },
          }));
        } else {
          const crisisWindowBonus = getWonderCrisisWindowBonusHours(state.buildings);
          const crisisSeed = crisisWindowBonus > 0
            ? {
                ...state.eraCrisis,
                challengeOption: {
                  ...state.eraCrisis.challengeOption,
                  windowHours: (state.eraCrisis.challengeOption?.windowHours ?? 0) + crisisWindowBonus,
                },
              }
            : state.eraCrisis;
          const newCrisisState = startEraCrisisChallenge(crisisSeed);
          set((prev) => ({
            eraCrisis: newCrisisState,
            latestSessionUndo: null,
            ui: { ...prev.ui, eraCrisisModalOpen: false },
          }));
        }
      },

      openEraCrisisModal: () =>
        set((prev) => ({ ui: { ...prev.ui, eraCrisisModalOpen: true } })),

      // ─── Break Timer ─────────────────────────────────────────────────────
      addPassiveXP: (amount) =>
        set((prev) => {
          const rewardState = grantXPReward(prev, amount);
          return {
            progress: rewardState.progress,
            player: rewardState.player,
            ui: {
              ...prev.ui,
              levelUpQueue: rewardState.levelsGained > 0
                ? [...prev.ui.levelUpQueue, {
                    levelsGained: rewardState.levelsGained,
                    newLevel: rewardState.newLevel,
                    spGained: rewardState.spGained,
                  }]
                : prev.ui.levelUpQueue,
            },
          };
        }),

      startBreak: (breakInput) =>
        set((prev) => {
          const breakConfig = typeof breakInput === 'number'
            ? { durationMinutes: breakInput, isLong: false }
            : (breakInput ?? {});
          const durationMinutes = Math.max(1, breakConfig.durationMinutes ?? breakConfig.breakMinutes ?? 5);
          const totalSeconds = durationMinutes * 60;
          const startedAt = Number.isFinite(breakConfig.startedAt) ? breakConfig.startedAt : Date.now();
          const endsAt = Number.isFinite(breakConfig.endsAt) ? breakConfig.endsAt : startedAt + (totalSeconds * 1000);

          return {
            pendingBreakNote: '',
            latestSessionUndo: null,
            progress: {
              ...syncLongBreakCycleProgress(prev.progress, startedAt),
              longBreakGraceDeadlineAt: null,
              longBreakPreviewSession: false,
            },
            breakSession: {
              ...makeDefaultBreakSession(),
              isRunning: true,
              startedAt,
              endsAt,
              totalSeconds,
              isLong: !!breakConfig.isLong,
              sourceSessionId: breakConfig.sourceSessionId ?? null,
            },
            ui: {
              ...prev.ui,
              isOnBreak: true,
              breakSecondsLeft: totalSeconds,
              breakTotalSeconds: totalSeconds,
              breakIsLong: !!breakConfig.isLong,
              activeBreakSessionId: breakConfig.sourceSessionId ?? null,
            },
            sessionMeta: {
              ...prev.sessionMeta,
              breakCompletedOnTime: false,
            },
          };
        }),

      tickBreak: () => get().syncBreakSession(),

      endBreak: () =>
        set((prev) => ({
          pendingBreakNote: '',
          progress: markLongBreakCycleBreakEnded(prev.progress),
          breakSession: makeDefaultBreakSession(),
          ui: {
            ...prev.ui,
            isOnBreak: false,
            breakSecondsLeft: 0,
            breakTotalSeconds: 0,
            breakIsLong: false,
            activeBreakSessionId: null,
          },
        })),

      // ─── Điều khiển Modal ─────────────────────────────────────────────────
      closeLootModal: () =>
        set((prev) => ({ ui: { ...prev.ui, lootModalOpen: false, pendingReward: null } })),

      closeDisasterModal: () =>
        set((prev) => ({ ui: { ...prev.ui, disasterModalOpen: false, pendingDisaster: null } })),

      closeEraCrisisModal: () =>
        set((prev) => ({ ui: { ...prev.ui, eraCrisisModalOpen: false } })),

      dismissLevelUp: () =>
        set((prev) => ({ ui: { ...prev.ui, levelUpQueue: prev.ui.levelUpQueue.slice(1) } })),

      dismissRelicNotification: () =>
        set((prev) => ({ ui: { ...prev.ui, relicNotification: null } })),

      dismissRankUpNotification: () =>
        set((prev) => ({ ui: { ...prev.ui, rankUpNotification: null } })),

      dismissAchievementNotification: () =>
        set((prev) => ({ ui: { ...prev.ui, achievementQueue: prev.ui.achievementQueue.slice(1) } })),

      dismissMissionNotification: () =>
        set((prev) => ({ ui: { ...prev.ui, missionCompletedIds: (prev.ui.missionCompletedIds ?? []).slice(1) } })),

      // ─── Daily Missions ──────────────────────────────────────────────────
      refreshDailyMissions: () =>
        set((prev) => {
          const today = localDateStr();
          const missions = refreshMissionsIfStale(prev.missions);
          const weeklyChain = refreshWeeklyChain(prev.weeklyChain);
          const streak = refreshStreakIfExpired(prev.streak);
          const dailyTracking = prev.dailyTracking?.date === today
            ? prev.dailyTracking
            : { ...makeDefaultDailyTracking(), date: today };

          if (
            missions === prev.missions
            && weeklyChain === prev.weeklyChain
            && streak === prev.streak
            && dailyTracking === prev.dailyTracking
          ) {
            return prev;
          }

          return {
            streak,
            missions,
            weeklyChain,
            dailyTracking,
          };
        }),

      claimMissionAllBonus: () => {
        const state = get();
        const refreshedMissions = refreshMissionsIfStale(state.missions);
        if (refreshedMissions.bonusClaimedToday) return;
        const allDone = refreshedMissions.list.length > 0 && refreshedMissions.list.every((m) => m.claimed);
        if (!allDone) return;
        set((prev) => {
          const activeMissions = refreshMissionsIfStale(prev.missions);
          const strategyBonusXP = prev.player.unlockedSkills.bac_thay_chien_luoc
            ? applyDailyMissionXPBonus(prev.buildings, getMissionRewardTotalXP(activeMissions.list))
            : 0;
          const rewardState = grantXPReward(
            prev,
            applyDailyMissionXPBonus(prev.buildings, MISSION_ALL_BONUS_XP) + strategyBonusXP,
          );
          // V2: Người Lập Kế — push buff cho phiên kế tiếp
          const updatedPlayer = { ...rewardState.player };
          if (prev.player.unlockedSkills.nguoi_lap_ke) {
            const queue = Array.isArray(updatedPlayer.skillBuffQueue) ? [...updatedPlayer.skillBuffQueue] : [];
            queue.push({ type: 'nguoi_lap_ke', sessionsRemaining: 1 });
            updatedPlayer.skillBuffQueue = queue;
          }
          return {
            progress: rewardState.progress,
            player:   updatedPlayer,
            missions: { ...activeMissions, bonusClaimedToday: true },
            latestSessionUndo: null,
            ui: {
              ...prev.ui,
              levelUpQueue: rewardState.levelsGained > 0
                ? [...prev.ui.levelUpQueue, { levelsGained: rewardState.levelsGained, newLevel: rewardState.newLevel, spGained: rewardState.spGained }]
                : prev.ui.levelUpQueue,
            },
          };
        });
      },

      // ─── Weekly Chain ────────────────────────────────────────────────────
      claimWeeklyStep: () => {
        const state = get();
        const refreshedChain = refreshWeeklyChain(state.weeklyChain);
        const chain = WEEKLY_CHAINS[refreshedChain.chainIndex];
        const step  = chain?.steps[refreshedChain.currentStep];
        if (!step || refreshedChain.stepProgress < step.goal) return;

        set((prev) => {
          const activeChain = refreshWeeklyChain(prev.weeklyChain);
          const activeChainMeta = WEEKLY_CHAINS[activeChain.chainIndex];
          const activeStep = activeChainMeta?.steps[activeChain.currentStep];
          if (!activeStep || activeChain.stepProgress < activeStep.goal) return prev;

          const isLastStep = activeChain.currentStep >= activeChainMeta.steps.length - 1;
          const bonusXP = isLastStep && !activeChain.bonusClaimed ? activeChainMeta.bonusXP : 0;
          const bonusSP = isLastStep && !activeChain.bonusClaimed ? activeChainMeta.bonusSP : 0;
          const perfectPlanUnlocked = isLastStep && !!prev.player.unlockedSkills.ke_hoach_hoan_hao;
          const weeklyXPBase = perfectPlanUnlocked
            ? (activeStep.rewardXP + bonusXP) * PERFECT_PLAN_WEEKLY_MULTIPLIER
            : activeStep.rewardXP + bonusXP;
          const weeklyXPReward = Math.round(weeklyXPBase * WEEKLY_CHAIN_XP_SCALE);
          const rewardState = grantXPReward(prev, weeklyXPReward);
          const nextStepIndex = activeChain.currentStep + 1;
          const weekEntries = getHistoryWeekEntries(prev.history, activeChain.weekKey);
          const weeklySnapshot = buildWeeklyProgressSnapshot(weekEntries, activeChain.weekKey);
          const nextStep = activeChainMeta?.steps[nextStepIndex];
          const weeklyResearchRP = perfectPlanUnlocked ? 120 : 0;

          // V2: Cử Tri — push buff cho 3 phiên kế (nếu user có cu_tri)
          // V2: Kế Hoạch Hoàn Hảo — nếu hoàn thành chuỗi (last step), set tuần kế +10% allBonus
          const updatedPlayer = { ...rewardState.player, sp: rewardState.player.sp + bonusSP };
          if (prev.player.unlockedSkills.cu_tri) {
            const queue = Array.isArray(updatedPlayer.skillBuffQueue) ? [...updatedPlayer.skillBuffQueue] : [];
            queue.push({ type: 'cu_tri', sessionsRemaining: 3 });
            updatedPlayer.skillBuffQueue = queue;
          }
          if (perfectPlanUnlocked) {
            // Set tuần kế tiếp nhận buff
            const nextWeekTs = Date.now() + 7 * 86_400_000;
            updatedPlayer.keHoachWeeklyBuffWeekKey = localWeekMondayStr(nextWeekTs);
          }
          return {
            progress: rewardState.progress,
            player: updatedPlayer,
            research: {
              ...prev.research,
              rp: (prev.research?.rp ?? 0) + weeklyResearchRP,
            },
            blueprints: prev.blueprints,
            weeklyChain: {
              ...activeChain,
              currentStep:  nextStepIndex,
              stepProgress: nextStep ? getWeeklyStepProgress(nextStep, weeklySnapshot) : 0,
              bonusClaimed: isLastStep ? true : activeChain.bonusClaimed,
            },
            latestSessionUndo: null,
            ui: {
              ...prev.ui,
              levelUpQueue: rewardState.levelsGained > 0
                ? [...prev.ui.levelUpQueue, { levelsGained: rewardState.levelsGained, newLevel: rewardState.newLevel, spGained: rewardState.spGained }]
                : prev.ui.levelUpQueue,
            },
          };
        });
      },

      // ─── Building Workshop ───────────────────────────────────────────────
      // Legacy compatibility path cho save cũ còn giữ blueprint copy riêng.
      craftBuilding: (blueprintId) => {
        const state = get();
        if (state.buildings.includes(blueprintId)) return false;
        // Check player owns this blueprint
        const bpIdx = state.blueprints.findIndex((b) => b.id === blueprintId);
        if (bpIdx === -1) return false;
        const spec = BUILDING_SPECS[blueprintId];
        if (!spec) return false;

        const normalizedCost = normalizeRawCost(spec.cost ?? {});
        const bookNumber = BLUEPRINT_META[blueprintId]?.era ?? 1;
        const bookKey = `book${bookNumber}`;
        const bookResources = state.resources[bookKey];

        // Check sufficient resources
        for (const [res, amount] of Object.entries(normalizedCost)) {
          if ((bookResources[res] ?? 0) < amount) return false;
        }

        // Deduct resources
        const newBookResources = { ...bookResources };
        for (const [res, amount] of Object.entries(normalizedCost)) {
          newBookResources[res] = (newBookResources[res] ?? 0) - amount;
        }

        // Remove one blueprint copy
        const newBlueprints = [...state.blueprints];
        newBlueprints.splice(bpIdx, 1);

        set((prev) => ({
          resources:  { ...prev.resources, [bookKey]: newBookResources },
          blueprints: newBlueprints,
          buildings:  [...prev.buildings, blueprintId],
          latestSessionUndo: null,
          ui: {
            ...prev.ui,
            notificationFeed: appendUiNotification(prev.ui.notificationFeed, makeWorkshopCompletedNotification([blueprintId])),
          },
        }));
        return true;
      },

      // Add passive building EP from game loop (backward compat — còn dùng cho STORAGE_VAULT)
      addBuildingPassiveEP: (amount) =>
        set((prev) => {
          const newTotalEP = prev.progress.totalEP + amount;
          return {
            progress: {
              ...prev.progress,
              totalEP:    newTotalEP,
              activeBook: getActiveBook(newTotalEP),
            },
          };
        }),

      /**
       * addBuildingPassiveResources
       * Gọi từ useGameLoop mỗi phút nghỉ cho từng infrastructure building.
       * Cộng nguyên liệu thô + tinh luyện vào đúng bucket kỷ nguyên của công trình đó.
       */
      addBuildingPassiveResources: (bpId) => {
        const eff = BUILDING_EFFECTS[bpId];
        if (!eff || eff.type !== 'infrastructure') return;
        const eraKey = eff.era;
        set((prev) => {
          const level = prev.buildingLevels?.[bpId] ?? 1;
          const levelMult = getBuildingLevelMultiplier(level);

          const prevRef = normalizeRefinedBag(prev.resourcesRefined?.[eraKey]);
          const bookKey = `book${eraKey}`;
          const prevBook = prev.resources[bookKey] ?? {};
          const rawResourceIds = (ERA_METADATA[eraKey]?.resources ?? []).map((resource) => resource.id);
          const t1Add = Math.floor((eff.passiveT1PerBreakMin ?? 0) * levelMult);
          const updatedBook = { ...prevBook };
          if (rawResourceIds[0]) {
            updatedBook[rawResourceIds[0]] = (updatedBook[rawResourceIds[0]] ?? 0) + Math.ceil(t1Add / 2);
          }
          if (rawResourceIds[1]) {
            updatedBook[rawResourceIds[1]] = (updatedBook[rawResourceIds[1]] ?? 0) + Math.floor(t1Add / 2);
          }
          const refinedGain = (eff.passiveT2PerBreakMin ?? 0) * levelMult;
          return {
            resources: { ...prev.resources, [bookKey]: updatedBook },
            resourcesRefined: {
              ...prev.resourcesRefined,
              [eraKey]: {
                t2: prevRef.t2 + refinedGain,
                t3: 0,
              },
            },
          };
        });
      },

      // ─── Hệ thống Nghiên Cứu ─────────────────────────────────────────────
      /**
       * researchBlueprint
       * Dùng RP để mở khóa 1 bản vẽ (research path).
       * Điều kiện: đã đạt kỷ nguyên của bản vẽ đó.
       */
      researchBlueprint: (bpId) => {
        const state  = get();
        const meta   = BLUEPRINT_META[bpId];
        if (!meta) return false;
        if (state.progress.activeBook < meta.requiresEra) return false;
        if ((state.research?.researched ?? []).includes(bpId)) return false;
        if (state.blueprints.some((b) => b.id === bpId)) return false;
        const cost = getWonderResearchCost(state.buildings, bpId, meta.rpCost);
        if ((state.research?.rp ?? 0) < cost) return false;
        const researchFeed = makeResearchReadyNotification(bpId);
        set((prev) => ({
          research: {
            ...prev.research,
            rp:         prev.research.rp - cost,
            researched: [...prev.research.researched, bpId],
          },
          latestSessionUndo: null,
          ui: {
            ...prev.ui,
            notificationFeed: appendUiNotification(prev.ui.notificationFeed, researchFeed),
          },
        }));
        return true;
      },

      /**
       * startCrafting
       * Đưa bản vẽ đã nghiên cứu vào hàng đợi xây dựng (sử dụng tài nguyên).
       * Điều kiện: bản vẽ đã unlock, hàng đợi chưa đầy, đủ nguyên liệu.
       */
      startCrafting: (bpId) => {
        const state = get();
        const meta  = BLUEPRINT_META[bpId];
        const spec  = BUILDING_SPECS[bpId];
        if (!meta || !spec) return false;

        const isResearched = (state.research?.researched ?? []).includes(bpId)
          || state.blueprints.some((b) => b.id === bpId);
        if (!isResearched) return false;

        if (state.buildings.includes(bpId)) return false; // đã xây rồi
        if ((state.craftingQueue ?? []).some((q) => q.bpId === bpId)) return false;
        if ((state.craftingQueue ?? []).length >= CRAFT_QUEUE_SLOTS) return false;

        // Kiểm tra và trừ nguyên liệu T1
        const bookKey  = `book${meta.era}`;
        const bookBag  = state.resources[bookKey] ?? {};
        const cost     = normalizeRawCost(spec.cost ?? {});
        for (const [resId, amt] of Object.entries(cost)) {
          if ((bookBag[resId] ?? 0) < amt) return false; // thiếu nguyên liệu T1
        }

        const refinedCost = getUnifiedRefinedCost(spec.refinedCost);
        const refined     = normalizeRefinedBag(state.resourcesRefined?.[meta.era]);
        if (refined.t2 < refinedCost) return false;
        const workshopFeed = makeWorkshopQueuedNotification(bpId, meta.sessionsToComplete);

        set((prev) => {
          const updatedBook = { ...prev.resources[bookKey] };
          for (const [resId, amt] of Object.entries(cost)) {
            updatedBook[resId] = (updatedBook[resId] ?? 0) - amt;
          }
          const prevRef = normalizeRefinedBag(prev.resourcesRefined?.[meta.era]);
          const updatedRef = spendUnifiedRefined(prevRef, refinedCost);
          return {
            resources:    { ...prev.resources, [bookKey]: updatedBook },
            resourcesRefined: { ...prev.resourcesRefined, [meta.era]: updatedRef },
            craftingQueue: [
              ...(prev.craftingQueue ?? []),
              { bpId, sessionsRemaining: meta.sessionsToComplete, startedAt: Date.now() },
            ],
            latestSessionUndo: null,
            ui: {
              ...prev.ui,
              notificationFeed: appendUiNotification(prev.ui.notificationFeed, workshopFeed),
            },
          };
        });
        return true;
      },

      /**
       * craftTier
       * Chế tác nguyên liệu tinh luyện từ nguyên liệu thô của cùng kỷ.
       * @param {number} era - kỷ nguyên
       * @param {'t2'} tier
       * @param {number} times - số lần chế tác
       */
      craftTier: (era, tier, times = 1) => {
        if (tier !== 't2') return false;
        const state   = get();
        const cost    = getWonderRefinedCraftCost(state.buildings) * times;
        const bookKey = `book${era}`;
        const bag     = state.resources[bookKey] ?? {};
        const updatedBook = spendRawResources(bag, cost);
        if (!updatedBook) return false;

        set((prev) => {
          const refined = normalizeRefinedBag(prev.resourcesRefined?.[era]);
          return {
            resources: {
              ...prev.resources,
              [bookKey]: updatedBook,
            },
            resourcesRefined: {
              ...prev.resourcesRefined,
              [era]: { t2: refined.t2 + times, t3: 0 },
            },
            latestSessionUndo: null,
          };
        });
        return true;
      },

      /**
       * repairBuilding
       * Đã bỏ khỏi vòng chơi mới, giữ lại API để không vỡ call-site cũ.
       */
      repairBuilding: () => {
        return true;
      },

      /**
       * applyBuildingDecay
       * Đã bỏ khỏi vòng chơi mới, giữ lại API để không vỡ call-site cũ.
       */
      applyBuildingDecay: () => {},

      /**
       * upgradeBuilding
       * Nâng cấp công trình đã xây bằng cùng một loại refined.
       */
      upgradeBuilding: (bpId) => {
        const state = get();
        if (!state.buildings.includes(bpId)) return false;
        const eff  = BUILDING_EFFECTS[bpId];
        if (!eff) return false;
        const era  = eff.era;
        const currentLevel = state.buildingLevels?.[bpId] ?? 1;
        if (currentLevel >= 3) return false; // đã cấp tối đa

        const upgradeCost = getUpgradeRefinedCost(era, currentLevel);
        const refined = normalizeRefinedBag(state.resourcesRefined?.[era]);
        if (refined.t2 < upgradeCost) return false;

        set((prev) => ({
          buildingLevels:   { ...prev.buildingLevels, [bpId]: currentLevel + 1 },
          resourcesRefined: {
            ...prev.resourcesRefined,
            [era]: spendUnifiedRefined(prev.resourcesRefined?.[era], upgradeCost),
          },
          latestSessionUndo: null,
        }));
        return true;
      },

      /**
       * cancelCrafting
       * Hủy bỏ công trình đang xây, hoàn lại 50% nguyên liệu.
       */
      cancelCrafting: (bpId) => {
        const state = get();
        const item  = (state.craftingQueue ?? []).find((q) => q.bpId === bpId);
        if (!item) return false;
        const spec    = BUILDING_SPECS[bpId];
        const meta    = BLUEPRINT_META[bpId];
        if (!spec || !meta) return false;
        const refinedRefund = Math.floor(getUnifiedRefinedCost(spec.refinedCost) * 0.5);

        set((prev) => {
          const bookKey     = `book${meta.era}`;
          const updatedBook = { ...prev.resources[bookKey] };
          const prevRefined = normalizeRefinedBag(prev.resourcesRefined?.[meta.era]);
          for (const [resId, amt] of Object.entries(normalizeRawCost(spec.cost ?? {}))) {
            updatedBook[resId] = (updatedBook[resId] ?? 0) + Math.floor(amt * 0.5);
          }
          return {
            resources:    { ...prev.resources, [bookKey]: updatedBook },
            resourcesRefined: {
              ...prev.resourcesRefined,
              [meta.era]: {
                t2: prevRefined.t2 + refinedRefund,
                t3: 0,
              },
            },
            craftingQueue: prev.craftingQueue.filter((q) => q.bpId !== bpId),
            latestSessionUndo: null,
          };
        });
        return true;
      },

      /**
       * evolveRelic
       * Tiến hóa di vật lên giai đoạn tiếp theo bằng nguyên liệu tinh luyện.
       * Returns true nếu thành công, false nếu không đủ điều kiện.
       */
      evolveRelic: (relicId) => {
        const state   = get();
        const evoDef  = RELIC_EVOLUTION[relicId];
        if (!evoDef) return false;
        if (!state.relics.some((r) => r.id === relicId)) return false;
        const currentStage = state.relicEvolutions?.[relicId] ?? 0;
        if (currentStage >= evoDef.stages.length - 1) return false;  // already max

        const nextStageDef = evoDef.stages[currentStage + 1];
        const era          = evoDef.era;
        const refined      = normalizeRefinedBag(state.resourcesRefined?.[era]);
        const refinedCost  = getWonderRelicEvolutionCost(state.buildings, nextStageDef);

        if (refined.t2 < refinedCost) return false;

        set((prev) => ({
          relicEvolutions: {
            ...prev.relicEvolutions,
            [relicId]: currentStage + 1,
          },
          resourcesRefined: {
            ...prev.resourcesRefined,
            [era]: spendUnifiedRefined(prev.resourcesRefined?.[era], refinedCost),
          },
          latestSessionUndo: null,
        }));
        return true;
      },

      // ─── Overclock / Staking ─────────────────────────────────────────────
      activateOverclock: () => {
        const state = get();
        if (state.staking.active) return false;
        if (state.timerConfig.focusMinutes < OVERCLOCK_MIN_SESSION_MIN) return false;
        const stakedEP = Math.floor(state.progress.totalEP * OVERCLOCK_EP_COST_RATE);
        if (stakedEP <= 0) return false;
        // Scaled multiplier: full +50% chỉ từ 45 phút, còn 25-44 phút được +25%
        const rewardMultiplier = state.timerConfig.focusMinutes >= OVERCLOCK_MIN_FULL_SESSION
          ? OVERCLOCK_REWARD_MULTIPLIER
          : OVERCLOCK_BONUS_REDUCED;
        set((prev) => ({
          progress: { ...prev.progress, totalEP: prev.progress.totalEP - stakedEP },
          staking:  { active: true, stakedEP, startedAt: Date.now(), rewardMultiplier },
          latestSessionUndo: null,
        }));
        return true;
      },

      deactivateOverclock: () => {
        const state = get();
        if (!state.staking.active) return;
        // Return staked EP if cancelled before session starts
        set((prev) => ({
          progress: { ...prev.progress, totalEP: prev.progress.totalEP + prev.staking.stakedEP },
          staking:  makeDefaultStaking(),
          latestSessionUndo: null,
        }));
      },

      // ─── Prestige ────────────────────────────────────────────────────────
      triggerPrestige: () => {
        const state = get();
        if (state.progress.totalEP < PRESTIGE_EP_REQUIREMENT) return false;
        const newCount  = state.prestige.count + 1;
        const newBonus  = Math.min(
          PRESTIGE_MAX_STACKS * PRESTIGE_BONUS_PER_RUN,
          state.prestige.permanentBonus + PRESTIGE_BONUS_PER_RUN,
        );
        set({
          ...makeProgressionResetState(),
          timerConfig: state.timerConfig,
          relics: state.relics,
          achievements: state.achievements,
          history: state.history,
          historyStats: state.historyStats,
          savedNotes: state.savedNotes,
          forgiveness: {
            chargesRemaining: getWonderForgivenessCapacity(state.buildings),
            weekStartTimestamp: Date.now(),
          },
          buildings: state.buildings,
          buildingHP: state.buildingHP,
          buildingLastUsed: state.buildingLastUsed,
          buildingLevels: state.buildingLevels,
          relicEvolutions: state.relicEvolutions,
          sessionCategories: state.sessionCategories,
          lastWeeklyReportDate: state.lastWeeklyReportDate,
          prestige: {
            count:          newCount,
            permanentBonus: newBonus,
            history:        [...state.prestige.history, { at: Date.now(), epAtPrestige: state.progress.totalEP }],
          },
          ui: makeDefaultUiState(),
          latestSessionUndo: null,
        });
        return true;
      },

      openPrestigeModal: () =>
        set((prev) => ({ ui: { ...prev.ui, prestigeModalOpen: true } })),

      closePrestigeModal: () =>
        set((prev) => ({ ui: { ...prev.ui, prestigeModalOpen: false } })),

      // ── Weekly Report ──────────────────────────────────────────────────────
      checkWeeklyReport: () => {
        const state = get();
        const monday = getWeekMonday();
        // Chỉ hiện nếu hôm nay là thứ 2 VÀ chưa hiện tuần này
        const isMonday = getVietnamDayOfWeek() === 1;
        if (isMonday && state.lastWeeklyReportDate !== monday && state.history.length > 0) {
          set((prev) => ({ ui: { ...prev.ui, weeklyReportOpen: true, weeklyReportMode: 'previous' } }));
        }
      },

      openWeeklyReport: () =>
        set((prev) => ({ ui: { ...prev.ui, weeklyReportOpen: true, weeklyReportMode: 'current' } })),

      dismissWeeklyReport: () => {
        const monday = getWeekMonday();
        set((prev) => ({
          lastWeeklyReportDate: monday,
          ui: { ...prev.ui, weeklyReportOpen: false, weeklyReportMode: 'current' },
        }));
      },

      // ─── Import / Export ─────────────────────────────────────────────────
      _importGameData: (data) => {
        try {
          // Basic validation
          if (!data || typeof data !== 'object') {
            return {
              ok: false,
              code: 'invalid_payload',
              message: 'File không chứa dữ liệu game hợp lệ.',
            };
          }
          if (
            typeof data._version === 'string'
            && data._version !== GAME_STORE_EXPORT_VERSION
            && !LEGACY_GAME_STORE_EXPORT_VERSIONS.includes(data._version)
          ) {
            return {
              ok: false,
              code: 'version_mismatch',
              message: `File backup thuộc phiên bản ${data._version}. Phiên bản hiện tại hỗ trợ ${[GAME_STORE_EXPORT_VERSION, ...LEGACY_GAME_STORE_EXPORT_VERSIONS].join(', ')}.`,
            };
          }
          set((prev) => ({
            ...normalizePersistedGameState(data, prev),
            latestSessionUndo: null,
          }));
          return {
            ok: true,
            code: 'success',
            message: 'Nhập dữ liệu thành công.',
          };
        } catch (error) {
          console.error('[gameStore] Failed to import save data', {
            error,
            data,
          });
          return {
            ok: false,
            code: 'import_failed',
            message: error instanceof Error && error.message
              ? `Không thể khôi phục dữ liệu: ${error.message}`
              : 'Không thể khôi phục dữ liệu từ file đã chọn.',
          };
        }
      },

      // ─── Dev helpers ─────────────────────────────────────────────────────
      _devAddEP: (amount) =>
        set((prev) => {
          const newTotalEP = prev.progress.totalEP + amount;
          return {
            progress: {
              ...prev.progress,
              totalEP:    newTotalEP,
              activeBook: getActiveBook(newTotalEP),
            },
            latestSessionUndo: null,
          };
        }),

      _devAddSP: (amount) =>
        set((prev) => ({
          player: { ...prev.player, sp: prev.player.sp + amount },
          latestSessionUndo: null,
        })),

      _devResetGame: () =>
        set({
          ...makeProgressionResetState(),
          timerConfig:  makeDefaultTimerConfig(),
          sessionCategories: [...DEFAULT_SESSION_CATEGORIES],
          achievements: makeDefaultAchievements(),
          history:      [],
          savedNotes:   [],
          buildings:    [],
          prestige:     makeDefaultPrestige(),
          relics:       [],
          ui:           makeDefaultUiState(),
          latestSessionUndo: null,
        }),
    }),

    // ── Cấu hình Persist ────────────────────────────────────────────────────
    {
      name:    GAME_STORE_STORAGE_KEY,
      storage: createLegacyCompatibleJSONStorage(LEGACY_GAME_STORE_STORAGE_KEYS),
      version: GAME_STORE_SCHEMA_VERSION,
      migrate: (stored, fromVersion) => migratePersistedGameState(stored, fromVersion),

      // Loại trừ slice `ui` khỏi persist
      partialize: (state) => ({
        player:           state.player,
        progress:         state.progress,
        resources:        state.resources,
        timerConfig:      state.timerConfig,
        forgiveness:      state.forgiveness,
        rankSystem:       state.rankSystem,
        rankChallenge:    state.rankChallenge,
        eraCrisis:        state.eraCrisis,
        relics:           state.relics,
        blueprints:       state.blueprints,
        achievements:     state.achievements,
        history:          state.history,
        historyStats:     state.historyStats,
        savedNotes:       state.savedNotes,
        sessionCategories: state.sessionCategories,
        pendingCategoryId: state.pendingCategoryId,
        pendingNote:      state.pendingNote,
        pendingBreakNote: state.pendingBreakNote,
        pendingSessionGoal: state.pendingSessionGoal,
        pendingNextSessionNote: state.pendingNextSessionNote,
        streak:           state.streak,
        missions:         state.missions,
        buildings:        state.buildings,
        staking:          state.staking,
        prestige:         state.prestige,
        timerSession:     state.timerSession,
        breakSession:     state.breakSession,
        weeklyChain:      state.weeklyChain,
        combo:            state.combo,
        dailyTracking:    state.dailyTracking,
        skillActivations: state.skillActivations,
        categoryTracking: state.categoryTracking,
        eraTracking:      state.eraTracking,
        sessionMeta:      state.sessionMeta,
        research:         state.research,
        craftingQueue:    state.craftingQueue,
        buildingHP:       state.buildingHP,
        buildingLevels:   state.buildingLevels,
        resourcesRefined: state.resourcesRefined,
        relicEvolutions:      state.relicEvolutions,
        lastWeeklyReportDate: state.lastWeeklyReportDate,
        buildingLastUsed:     state.buildingLastUsed,
        latestSessionUndo:    state.latestSessionUndo,
      }),

      // Merge khi hydrate: đảm bảo field mới không bị crash
      merge: (persisted, current) => normalizePersistedGameState(
        persisted,
        current,
        { trackAchievementBackfill: true },
      ),

      onRehydrateStorage: () => (state, error) => {
        if (error || !state || !achievementHydrationState.shouldPersistBackfilledTimeline) return;
        achievementHydrationState.shouldPersistBackfilledTimeline = false;
        useGameStore.setState((prev) => ({ achievements: prev.achievements }));
      },
    },
  ),
);

export default useGameStore;
