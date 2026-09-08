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
 *  rankSystem    — bậc danh xưng hiện tại theo quyển + thử thách đang active
 *  eraCrisis     — trạng thái khủng hoảng kỷ nguyên
 *  relics        — di vật đã nhận (buff vĩnh viễn)
 *  history       — nhật ký phiên (50 gần nhất)
 *  ui            — trạng thái modal, payload phần thưởng
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { create } from 'zustand';
import { tinhGiuLai } from '../engine/prestigeCarryover';
import { wonderPassiveBuffs } from '../engine/wonderEffects.js';
import { withCanonicalRelicText } from '../engine/relicGrowth';
import { chooseSessionProject } from '../engine/sessionBrick';
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
import { localDateStr, localWeekMondayStr, getVietnamDayOfWeek } from '../engine/time';
import { normalizeCityArchive } from '../engine/cityArchive';
import { canRestoreBlueprint, countActiveCrafting } from '../engine/eraLegacy';
import {
  GOAL_ACHIEVED_BONUS_RATE,
  SIEU_TAP_TRUNG_CHARGES,
  SO_DO_MIN_MINUTES,
  RANK_SYSTEM,
  ACHIEVEMENTS,
  WEEKLY_CHAINS,
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
  CRAFT_QUEUE_SLOTS,
  NIGHT_BUILDER_CHANCE,
  LEGACY_QUEUE_SLOTS,
  RELIC_EVOLUTION,
  getBuildingLevelMultiplier,
  normalizeRefinedBag,
  normalizeRawResourceId,
  // Bản Cập Nhật Cộng Hưởng — Tinh Thể (TTCH)
  SKILL_TREE,
  TINH_THE_HARD_CAP,
} from '../engine/constants';
import {
  HISTORY_ENTRY_STATUS,
  computeLevelUps,
  getActiveBook,
  getComboDecayMs,
  getCompletedHistoryEntries,
  getEffectiveSkillCost,
  getHistoryEntryTimestampMs,
  isCancelledHistoryEntry,
} from '../engine/gameMath';

import {
  applyDailyMissionXPBonus,
  getDailyMissionAllBonusXP,
  makeDefaultMissions,
  rebuildMissionsFromHistory,
  refreshMissionsIfStale,
} from '../engine/missions';
import { getWeekMonday, makeDefaultWeeklyChain, rebuildWeeklyChainFromHistory, refreshWeeklyChain } from '../engine/weeklyChain';
import soundEngine from '../engine/soundEngine';
import notificationManager from '../engine/notifications';
import { withCanonicalCrisisText } from '../engine/challengeEngine';
// ADR-069: bậc tự thăng + thử thách kỷ nguyên thành nhiệm vụ mềm — cùng một phép đếm lịch sử.
import { openCrisisQuest } from '../engine/rankLadder';
// ADR-078: helpers moved out of this file verbatim — see each module's header.
import { assembleSessionReward } from '../engine/sessionRewards';
import { achievementHydrationState, buildAchievementSnapshot, makeDefaultAchievements, normalizeAchievementsStateWithTimeline } from '../engine/achievementState';

import { isCurrentEraBlueprint, makeDefaultResearch, normalizeStoredResearch, pickEraScopedBlueprintPatch, pruneEraScopedBlueprintState } from '../engine/eraScope';
import { appendUiNotification, makeWorkshopQueuedNotification } from '../engine/feedNotifications';
import { applyHistoryReviewStatsDelta, buildHistoryStatsFromHistory, makeDefaultHistoryStats, normalizeStoredHistoryStats } from '../engine/historyStats';
import { makeDefaultProgress, markLongBreakCycleBreakEnded, markLongBreakCycleSessionStarted, syncLongBreakCycleProgress } from '../engine/longBreakCycle';
import { makeDefaultStaking } from '../engine/overclock';
import { buildSavedNotesFromHistory, sanitizeSavedNotes, upsertSavedNoteEntry } from '../engine/savedNotes';
import { makeDefaultStreak, refreshStreakIfExpired } from '../engine/streak';
import { makeDefaultCategoryTracking, makeDefaultDailyTracking, makeDefaultEraTracking, makeDefaultSessionMeta, makeDefaultSkillActivations } from '../engine/trackingDefaults';
import { isRecord } from '../lib/isRecord';

export { GAME_STORE_STORAGE_KEY, GAME_STORE_EXPORT_VERSION };
export const GAME_STORE_SCHEMA_VERSION = 4;

const makeEmptyResources = () => Object.fromEntries(
  Object.entries(ERA_METADATA).map(([era, meta]) => [
    `book${era}`,
    Object.fromEntries((meta.resources ?? []).map((resource) => [resource.id, 0])),
  ])
);

/**
 * Cửa sổ còn được phép reo báo "hết giờ nghỉ". Xem khối chú thích ở `syncBreakSession`:
 * hàm ấy cũng chạy khi tab được đánh thức lại, nên nếu không gác thì mở máy sau hai tiếng
 * app sẽ reo lên báo một giờ nghỉ đã kết thúc từ đời nào. 90 giây đủ rộng để một nhịp tick
 * trễ hoặc một lần quay lại tab trong vòng một phút rưỡi vẫn được báo, đủ hẹp để cái tin
 * ấy còn là tin.
 */
const BREAK_OVER_ANNOUNCE_MS = 90_000;

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

function normalizeStoredRefined(resourcesRefined = {}) {
  const next = makeDefaultResourcesRefined();
  for (const [era, refined] of Object.entries(resourcesRefined ?? {})) {
    next[era] = normalizeRefinedBag(refined);
  }
  return next;
}

// ─── HELPER: Tổng hợp tác động Wonder từ danh sách công trình ─────────────────
// ⚠️ `aggregateWonderEffects` + `getWonderResearchCost` ĐÃ CHUYỂN sang `engine/wonderEffects.js`
// (2026-09-02) — cùng luật ấy từng có BA bản chép tay và bản ở tầng giao diện đã lệch.
// Xem khối chú thích ở file đó.

// ADR-070: bốn helper kỳ quan đời cũ (RP · miễn phạt · nguyên liệu thô · tinh luyện) ĐÃ GỠ — đặc quyền
// kỳ quan nay là buff trên trục sống, đọc qua `engine/wonderEffects.js`.

// ⚠️ `getWonderRelicEvolutionCost` ĐÃ CHUYỂN sang `engine/wonderEffects.js` dưới tên
// `relicEvolutionCostOf` (2026-09-05) — nó cũng có một bản chép tay ở tầng giao diện,
// và bản ấy thiếu phép kiểm `type === 'wonder'` y hệt bản chép của giá RP.

// ⚠️ `getWonderCancelPenaltyMultiplier` · `getWonderStreakBonusCap` ·
// `getDailyMissionXPBonusMultiplier` ĐÃ CHUYỂN sang `engine/wonderEffects.js` (2026-09-05) —
// cả ba đều có một bản chép tay ở tầng giao diện, và cả ba bản ấy thiếu phép kiểm
// `type === 'wonder'`. Xem khối chú thích cuối file đó.

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
  continueAfterPomodoro: false, // snapshot setting lúc bắt đầu phiên
  continuedPomodoroConfirmedUntilSeconds: null, // mốc elapsed cần xác nhận khi Pomodoro chạy thêm giờ
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

/**
 * ADR-070: di vật đời cũ không có `earnedAt` ⇒ đóng dấu LÚC NẠP. Từ đây `relicGrowth` bắt đầu đếm
 * phiên cho nó — không nhảy thẳng lên Huyền Thoại nhờ 500 phiên trước ngày cập nhật.
 */
/**
 * ADR-070: (1) save cũ không có `earnedAt` ⇒ đóng dấu LÚC NẠP (đồng hồ đếm phiên bắt đầu hôm nay, không
 * nhảy bậc từ lịch sử cũ); (2) chữ của di vật (label · icon · description · buff gốc) đọc lại từ bảng —
 * save cũ mang bản chép từ lúc nhận, và ADR-069 đã đổi chữ ấy ("tăng tài nguyên rớt" là đồng tiền ngủ).
 */
function normalizeStoredRelic(relic, now = Date.now()) {
  if (!isRecord(relic)) return relic;
  const fresh = withCanonicalRelicText(relic);
  return fresh.earnedAt ? fresh : { ...fresh, earnedAt: new Date(now).toISOString() };
}

// ─── FACTORY: PRESTIGE ────────────────────────────────────────────────────────
const makeDefaultPrestige = () => ({
  count:          0,
  permanentBonus: 0,
  history:        [],
  // ⚠️ Hai trường của `TECH_DEBT #3`. Để trong `prestige` vì đây là một trong số ít nhánh SỐNG SÓT
  // qua `makeProgressionResetState()` — để ở `player` thì lần Thăng Hoa kế tiếp xoá mất.
  sieuViet:       false,  // `sieu_viet` đã mở ở một lần Thăng Hoa nào đó ⇒ buff XP kỷ 1 còn hiệu lực
  giuKyNang:      null,   // kỹ năng Cao Cấp được `kien_thuc_nen` giữ lại ở lần Thăng Hoa gần nhất
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
  // ADR-078: the building the LAST session completed — the Focus postcard keeps its camera on it
  // until the next session starts. In-memory only (`ui` is not persisted): a reload looks at the brick.
  postcardFocusBpId: null,
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
  // Có một lời mời xem tổng kết tuần đang treo (thẻ toast). KHÔNG phải "đã xem".
  weeklyReportPending: false,
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

  const normalized = {
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
    rankSystem: hasPersistedKey('rankSystem')
      ? { ...makeDefaultRankSystem(), ...(isRecord(persisted.rankSystem) ? persisted.rankSystem : {}) }
      : current.rankSystem,
    rankChallenge: persisted.rankChallenge ?? current.rankChallenge,
    eraCrisis: hasPersistedKey('eraCrisis')
      ? withCanonicalCrisisText({ ...makeDefaultEraCrisis(), ...(isRecord(persisted.eraCrisis) ? persisted.eraCrisis : {}) })
      : current.eraCrisis,
    relics: Array.isArray(persisted.relics) ? persisted.relics.map((r) => normalizeStoredRelic(r)) : current.relics,
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
    cityArchive: isRecord(persisted.cityArchive)
      ? normalizeCityArchive(persisted.cityArchive)
      : current.cityArchive,
    resourcesRefined: hasPersistedKey('resourcesRefined')
      ? normalizeStoredRefined(persisted.resourcesRefined)
      : current.resourcesRefined,
    relicEvolutions: isRecord(persisted.relicEvolutions) ? persisted.relicEvolutions : current.relicEvolutions,
    // TTCH: clamp [0, TINH_THE_HARD_CAP]; đây là đường nạp load-bearing (Supabase/import đi qua normalize).
    tinhThe: Number.isFinite(persisted.tinhThe)
      ? Math.max(0, Math.min(TINH_THE_HARD_CAP, Math.floor(persisted.tinhThe)))
      : (current.tinhThe ?? 0),
    lastWeeklyReportDate: persisted.lastWeeklyReportDate ?? current.lastWeeklyReportDate,
    lastWeeklyReportSeenDate: persisted.lastWeeklyReportSeenDate ?? current.lastWeeklyReportSeenDate,
    latestSessionUndo: persisted.latestSessionUndo ?? current.latestSessionUndo,
  };

  return pruneEraScopedBlueprintState(normalized, normalized.progress?.activeBook);
}

function migratePersistedGameState(persistedState, fromVersion) {
  let next = isRecord(persistedState) ? { ...persistedState } : {};

  if (fromVersion < 1) {
    next = {
      ...next,
      timerConfig: normalizeStoredTimerConfig(next.timerConfig),
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

  // V3: Bản Cập Nhật Cộng Hưởng — đảm bảo tinhThe hợp lệ (idempotent, backup-only;
  // đường nạp web thật đi qua normalize chứ không qua migrate).
  if (fromVersion < 3) {
    next = {
      ...next,
      tinhThe: Number.isFinite(next.tinhThe)
        ? Math.max(0, Math.min(TINH_THE_HARD_CAP, Math.floor(next.tinhThe)))
        : 0,
    };
  }

  // V4: Bảo tàng Thành Phố Pixel — save cũ KHÔNG có `cityArchive`. Không cần biến đổi gì ở đây:
  // `normalizePersistedGameState` đã trả về `{}` mặc định cho trường thiếu. Bump version chỉ để
  // đánh dấu mốc schema (xem `MIGRATION.md`). Bảo tàng bắt đầu ghi từ kỷ đang chơi trở đi — các
  // thành phố kỷ CŨ đã bị xoá vĩnh viễn từ trước bản vá này, không có cách nào khôi phục.

  return next;
}

function createLatestSessionUndoSnapshot(state) {
  return {
    sessionId: null,
    snapshot: {
      player: state.player,
      progress: state.progress,
      resources: state.resources,
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

function getSessionRewardNumber(entry, key) {
  const value = entry?.[key];
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function subtractPlayerXP(player, xpAmount) {
  const normalizedXP = Math.max(0, Math.round(xpAmount ?? 0));
  if (normalizedXP <= 0) return player;

  const nextTotalEXP = Math.max(0, (player?.totalEXP ?? 0) - normalizedXP);
  const nextLevel = computeLevelUps(0, nextTotalEXP).newLevel;
  const lostLevels = Math.max(0, (player?.level ?? 0) - nextLevel);

  return {
    ...player,
    totalEXP: nextTotalEXP,
    level: nextLevel,
    sp: Math.max(0, (player?.sp ?? 0) - (lostLevels * SP_PER_LEVEL)),
  };
}

function subtractSessionProgressAndXP(progress, player, sessionEntry) {
  const xpEarned = Math.round(getSessionRewardNumber(sessionEntry, 'xpEarned'));
  const epEarned = Math.round(getSessionRewardNumber(sessionEntry, 'epEarned'));
  const minutes = Math.round(getSessionRewardNumber(sessionEntry, 'minutes'));
  const completedSession = !isCancelledHistoryEntry(sessionEntry) && sessionEntry?.completed !== false;

  const nextTotalEP = Math.max(0, (progress?.totalEP ?? 0) - epEarned);
  return {
    progress: {
      ...progress,
      totalEP: nextTotalEP,
      activeBook: getActiveBook(nextTotalEP),
      sessionsCompleted: completedSession
        ? Math.max(0, (progress?.sessionsCompleted ?? 0) - 1)
        : (progress?.sessionsCompleted ?? 0),
      totalFocusMinutes: completedSession
        ? Math.max(0, (progress?.totalFocusMinutes ?? 0) - minutes)
        : (progress?.totalFocusMinutes ?? 0),
    },
    player: subtractPlayerXP(player, xpEarned),
  };
}

function rebuildDailyTrackingFromHistory(dailyTracking, history) {
  const trackingDate = dailyTracking?.date ?? localDateStr();
  const dayEntries = (history ?? []).filter((entry) => (
    !isCancelledHistoryEntry(entry)
    && entry?.timestamp
    && localDateStr(entry.timestamp) === trackingDate
  ));
  const categoriesUsed = [
    ...new Set(dayEntries.map((entry) => entry.categoryId).filter(Boolean)),
  ];

  return {
    ...dailyTracking,
    date: trackingDate,
    sessionsCompleted: dayEntries.length,
    categoriesUsed,
    deepSessionsCompleted: dayEntries.filter((entry) => (entry.minutes ?? 0) >= 45).length,
    hasShortSession: dayEntries.some((entry) => (entry.minutes ?? 0) <= 25),
    hasLongSession: dayEntries.some((entry) => (entry.minutes ?? 0) >= 60),
    hasSession45: dayEntries.some((entry) => (entry.minutes ?? 0) >= 45),
    hasSession60: dayEntries.some((entry) => (entry.minutes ?? 0) >= 60),
  };
}

function rebuildCurrentDailyTrackingFromHistory(dailyTracking, history, referenceTs = Date.now()) {
  return rebuildDailyTrackingFromHistory(
    {
      ...makeDefaultDailyTracking(),
      ...(isRecord(dailyTracking) ? dailyTracking : {}),
      date: localDateStr(referenceTs),
    },
    history,
  );
}

function isJsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function buildTimeSensitiveProgressState(state, referenceTs = Date.now()) {
  const streak = rebuildStreakFromHistory(
    state.history,
    referenceTs,
    state.streak,
    state.player.unlockedSkills,
  );
  const missions = rebuildMissionsFromHistory(state.missions, state.history, streak, { today: localDateStr(referenceTs) });
  const missionDateUnchanged = state.missions?.date && state.missions.date === missions.date;
  const shouldRevokeAllBonus = Boolean(
    missionDateUnchanged
    && state.missions?.bonusClaimedToday
    && !missions.bonusClaimedToday
  );
  const bonusClaimedXP = Number.isFinite(state.missions?.bonusClaimedXP) && state.missions.bonusClaimedXP > 0
    ? state.missions.bonusClaimedXP
    : getDailyMissionAllBonusXP(state.missions, state.buildings, state.player.unlockedSkills);

  return {
    player: shouldRevokeAllBonus
      ? subtractPlayerXP(state.player, bonusClaimedXP)
      : state.player,
    streak,
    missions: shouldRevokeAllBonus
      ? { ...missions, bonusClaimedXP: 0 }
      : missions,
    weeklyChain: rebuildWeeklyChainFromHistory(state.weeklyChain, state.history, { now: referenceTs }),
    dailyTracking: rebuildCurrentDailyTrackingFromHistory(state.dailyTracking, state.history, referenceTs),
  };
}

function localDateToDayIndex(dateStr) {
  if (typeof dateStr !== 'string') return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function dayIndexToLocalDate(dayIndex) {
  if (!Number.isFinite(dayIndex)) return null;
  const date = new Date(dayIndex * 86_400_000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function rebuildStreakFromHistory(history, referenceTs = Date.now(), previousStreak = {}, unlockedSkills = null) {
  const daySet = new Set();

  for (const entry of history ?? []) {
    if (!entry?.timestamp || isCancelledHistoryEntry(entry) || entry.completed === false) continue;
    const dayKey = localDateStr(entry.timestamp);
    const dayIndex = localDateToDayIndex(dayKey);
    if (Number.isFinite(dayIndex)) daySet.add(dayIndex);
  }

  if (daySet.size === 0) {
    return {
      ...makeDefaultStreak(),
      skipShieldUsedWeekKey: previousStreak?.skipShieldUsedWeekKey ?? null,
    };
  }

  const days = [...daySet].sort((left, right) => left - right);
  let longestStreak = 0;
  let runningStreak = 0;
  let previousDay = null;

  for (const dayIndex of days) {
    runningStreak = previousDay !== null && dayIndex === previousDay + 1
      ? runningStreak + 1
      : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
    previousDay = dayIndex;
  }

  const latestDay = days[days.length - 1];
  let currentStreak = 0;
  for (let dayIndex = latestDay; daySet.has(dayIndex); dayIndex -= 1) {
    currentStreak += 1;
  }

  return refreshStreakIfExpired({
    currentStreak,
    longestStreak,
    lastActiveDate: dayIndexToLocalDate(latestDay),
    skipShieldUsedWeekKey: previousStreak?.skipShieldUsedWeekKey ?? null,
  }, referenceTs, unlockedSkills);
}

function rebuildComboFromHistory(history, state, referenceTs = Date.now()) {
  const completedEntries = (history ?? [])
    .filter((entry) => entry?.timestamp && !isCancelledHistoryEntry(entry) && entry.completed !== false)
    .map((entry) => ({
      timestamp: new Date(entry.timestamp).getTime(),
    }))
    .filter(({ timestamp }) => Number.isFinite(timestamp))
    .sort((left, right) => right.timestamp - left.timestamp);

  if (completedEntries.length === 0) return makeDefaultCombo();

  const comboDecayMs = getComboDecayMs(
    state.player?.unlockedSkills,
    state.relics,
    state.relicEvolutions,
    wonderPassiveBuffs(state.buildings).comboWindowHours,
  );
  const latestTs = completedEntries[0].timestamp;
  if ((referenceTs - latestTs) >= comboDecayMs) return makeDefaultCombo();

  let count = 1;
  for (let index = 1; index < completedEntries.length; index += 1) {
    const newerTs = completedEntries[index - 1].timestamp;
    const olderTs = completedEntries[index].timestamp;
    if ((newerTs - olderTs) >= comboDecayMs) break;
    count += 1;
  }

  return {
    count,
    lastSessionTs: latestTs,
  };
}

function rebuildCategoryTrackingFromHistory(history) {
  const completedEntries = getCompletedHistoryEntries(history);
  const latestCategoryId = completedEntries[0]?.categoryId ?? null;
  if (!latestCategoryId) return makeDefaultCategoryTracking();

  let consecutiveCount = 0;
  for (const entry of completedEntries) {
    if (entry.categoryId !== latestCategoryId) break;
    consecutiveCount += 1;
  }

  return {
    lastCategoryId: latestCategoryId,
    consecutiveCount,
  };
}

function rebuildEraTrackingFromHistory(history, activeBook) {
  const completedEntries = getCompletedHistoryEntries(history);
  const books = completedEntries
    .map((entry) => entry.book)
    .filter((book) => Number.isFinite(book));
  const currentEraBook = Number.isFinite(activeBook) ? activeBook : Math.max(1, ...books, 1);

  return {
    sessionsInCurrentEra: completedEntries.filter((entry) => entry.book === currentEraBook).length,
    currentEraBook,
    erasCompleted: Math.max(0, Math.max(...books, currentEraBook) - 1),
  };
}

function rebuildCraftingQueueAfterSessionDelete(craftingQueue = [], deletedSession) {
  const deletedTs = getHistoryEntryTimestampMs(deletedSession);
  if (!Number.isFinite(deletedTs)) return craftingQueue;

  return (craftingQueue ?? []).map((item) => {
    const startedAt = Number(item?.startedAt);
    if (!Number.isFinite(startedAt) || deletedTs < startedAt) return item;

    const maxSessions = BLUEPRINT_META[item.bpId]?.sessionsToComplete;
    const nextRemaining = (Number.isFinite(item.sessionsRemaining) ? item.sessionsRemaining : 0) + 1;
    return {
      ...item,
      sessionsRemaining: Number.isFinite(maxSessions)
        ? Math.min(maxSessions, nextRemaining)
        : nextRemaining,
    };
  });
}

function getChallengeWindowStart(deadline, windowHours) {
  if (!Number.isFinite(deadline) || !Number.isFinite(windowHours)) return null;
  return deadline - (windowHours * 3_600_000);
}

function countQualifiedChallengeSessions(history, { minMinutes = 0, deadline, windowHours }) {
  const startedAt = getChallengeWindowStart(deadline, windowHours);
  if (!Number.isFinite(startedAt)) return null;

  return getCompletedHistoryEntries(history).filter((entry) => {
    const timestamp = getHistoryEntryTimestampMs(entry);
    if (!Number.isFinite(timestamp) || timestamp < startedAt || timestamp > deadline) return false;
    return (Number(entry.minutes) || 0) >= minMinutes;
  }).length;
}

function rebuildRankChallengeAfterSessionDelete(rankChallenge, history) {
  if (!rankChallenge?.active) return rankChallenge;
  const qualifiedCount = countQualifiedChallengeSessions(history, {
    minMinutes: rankChallenge.minMinutes,
    deadline: rankChallenge.deadline,
    windowHours: rankChallenge.windowHours,
  });
  if (!Number.isFinite(qualifiedCount)) return rankChallenge;

  return {
    ...rankChallenge,
    sessionsCompleted: Math.max(
      0,
      Math.min(rankChallenge.sessionsCompleted ?? 0, qualifiedCount),
    ),
  };
}

function rebuildEraCrisisAfterSessionDelete(eraCrisis, history) {
  if (!eraCrisis?.active || eraCrisis.choiceMade !== 'challenge') return eraCrisis;
  const qualifiedCount = countQualifiedChallengeSessions(history, {
    minMinutes: eraCrisis.challengeMinMinutes,
    deadline: eraCrisis.challengeDeadline,
    windowHours: eraCrisis.challengeOption?.windowHours,
  });
  if (!Number.isFinite(qualifiedCount)) return eraCrisis;

  return {
    ...eraCrisis,
    challengeSessionsDone: Math.max(
      0,
      Math.min(eraCrisis.challengeSessionsDone ?? 0, qualifiedCount),
    ),
  };
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

      // ── BẢO TÀNG THÀNH PHỐ: các kỷ đã đi qua, niêm phong để ghé thăm ─────
      // Chỉ để NGẮM — không perk, không tài nguyên, không ảnh hưởng cân bằng game.
      // { [era 1..15]: { built: string[], levels: {}, sealedAt, epAtSeal, sessionCount } }
      // Toạ độ KHÔNG lưu ở đây — `computeCityLayout` suy ra khi vẽ (xem ADR-007).
      cityArchive: {},

      // ── Nguyên liệu tinh luyện theo kỷ (giữ shape cũ để tương thích) ────
      resourcesRefined: makeDefaultResourcesRefined(),

      // ── Giai đoạn tiến hóa di vật ────────────────────────────────────────
      relicEvolutions: {},  // { [relicId]: stageNumber } — 0=base, 1=evolved, 2=legendary

      // ── Tinh Thể Cộng Hưởng (TTCH) — tiền tệ thay-thế từ nhiệm vụ ─────────
      tinhThe: 0,  // chỉ tiêu để thay thế (tiến hóa cổ vật / trả-trước charge), không bao giờ là sức mạnh trực tiếp

      // ── Snapshot undo an toàn cho phiên mới nhất ─────────────────────────
      latestSessionUndo: null,

      // ══════════════════════════════════════════════════════════════════════
      // ── TRẠNG THÁI TẠM THỜI (KHÔNG PERSIST) ─────────────────────────────
      // ══════════════════════════════════════════════════════════════════════
      ui: makeDefaultUiState(),

      // ⚠️ HAI NGÀY, HAI CÂU HỎI KHÁC NHAU — đừng gộp lại (`TECH_DEBT #87`).
      //   `lastWeeklyReportDate`     = tuần này ĐÃ MỜI chưa (để không mời lại mỗi lần mở app).
      //   `lastWeeklyReportSeenDate` = tuần này Đàm ĐÃ MỞ bản tổng kết ra chưa.
      // Gộp hai thứ này chính là cái bẫy cũ: một cái toast tự tắt sau 4 giây mà cũng ghi
      // "đã xem" thì LỠ một cái toast = mất báo cáo của cả tuần. Nay lời mời hết hạn KHÔNG
      // đụng tới "đã xem", nên chấm ở nút "Báo cáo tuần" vẫn sáng cho tới khi Đàm mở thật.
      lastWeeklyReportDate: null,
      lastWeeklyReportSeenDate: null,

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

      /**
       * ⚠️ KHOẢNH KHẮC HẾT GIỜ NGHỈ TỪNG IM LẶNG HOÀN TOÀN (2026-09-02) — và nó im trên
       * CẢ BA kênh cùng lúc, nên không kênh nào lộ ra rằng hai kênh kia cũng câm:
       *   · tiếng: `soundEngine` không hề có `playBreakEnd`;
       *   · thông báo trình duyệt: `notificationManager.notifyBreakOver()` viết xong từ lâu
       *     với **0 nơi gọi** (đúng họ `playMilestone`/`playBreakStart` đã vá ở vòng 23);
       *   · Web Push: `pushService.js` chỉ hẹn `focus-complete` và `pomodoro-continue`,
       *     KHÔNG có job nào cho lúc hết nghỉ.
       * Hệ quả: hết 5 phút nghỉ thì Đàm chỉ biết nếu đang nhìn chằm chằm vào màn hình —
       * mà nghỉ giải lao thì theo định nghĩa là lúc KHÔNG nhìn màn hình. Có sẵn một cái
       * bẫy chuyển-trạng-thái ở `PomodoroEngine.jsx` (`justEndedBreak`) nhưng nó chỉ làm
       * gì đó khi `autoStartNext` bật, mà mặc định của nó là **false**.
       *
       * ĐẶT Ở ĐÂY chứ không ở component, vì `syncBreakSession` chạy bất kể Đàm đang mở
       * tab nào — báo ở PomodoroEngine thì chuyển sang Hành Trang là mất tín hiệu.
       *
       * ⚠️ Tiếng/thông báo phải nằm NGOÀI `set()` — `set` là hàm thuần, nhét tác dụng phụ
       * vào đó thì React strict-mode gọi hai lần và Đàm nghe hai tiếng. Cùng hình dạng với
       * `if (!get().ui.isOnBreak) soundEngine.playBreakStart();` ở `startBreak`.
       *
       * ⚠️ MÌN CHO PHIÊN SAU: đây là lần đầu `soundEngine`/`notificationManager` được chạm tới
       * từ một cái ĐỒNG HỒ (`useGameLoop` gọi mỗi giây) chứ không từ một cú bấm nút. Cả hai
       * singleton ấy mặc định `enabled = true` và đọc `window` không rào (`window.AudioContext`
       * ở `audioContext.js`, `'Notification' in window` ở `notifications.js`), nên bài test node
       * nào tick giờ nghỉ sẽ nổ `ReferenceError: window is not defined` — một thông báo trỏ vào
       * `audioContext.js`, cách xa nguyên nhân thật. Cách chữa là đặt `soundEngine.enabled` và
       * `notificationManager.enabled` về `false` TRONG BÀI TEST, KHÔNG phải đi rào hai engine
       * dùng chung (rào sai một chỗ là câm tiếng thật của Đàm trên production — cái giá ấy đắt
       * hơn nhiều so với một thông báo lỗi khó đọc).
       *
       * ⚠️ CỬA SỔ GẦN ĐÂY (`BREAK_OVER_ANNOUNCE_MS`) là bắt buộc: `useGameLoop` gọi hàm này
       * cả ở `visibilitychange`/`pageshow`, tức là Đàm gập máy giữa giờ nghỉ rồi mở lại sau
       * hai tiếng cũng chạy vào đây. Không có cửa sổ thì app sẽ reo lên báo một giờ nghỉ đã
       * kết thúc từ lâu — cùng lý do `CoachNudge` gác 5 phút trước khi nhắc phiên vừa xong.
       */
      syncBreakSession: (now = Date.now()) => {
        const truoc = get();
        const phienNghi = truoc.breakSession;
        const quaHanMs = Number.isFinite(phienNghi?.endsAt) ? now - phienNghi.endsAt : Number.NaN;
        if (
          phienNghi?.isRunning
          && truoc.ui.isOnBreak
          && quaHanMs >= 0
          && quaHanMs <= BREAK_OVER_ANNOUNCE_MS
        ) {
          soundEngine.playBreakOver();
          notificationManager.notifyBreakOver();
        }

        return set((prev) => {
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
        });
      },

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

      // ─── Xoá phiên lịch sử ─────────────────────────────────────────────
      deleteSession: (sessionId) =>
        set((prev) => {
          if (sessionId == null) return prev;

          const latestSession = prev.history[0] ?? null;
          const undoState = prev.latestSessionUndo;
          const canUndoLatestSession = latestSession?.id === sessionId && undoState?.sessionId === sessionId;
          if (canUndoLatestSession) {
            const now = Date.now();
            const nextHistory = prev.history.filter((entry) => entry.id !== sessionId);
            const nextStreak = rebuildStreakFromHistory(
              nextHistory,
              now,
              undoState.snapshot.streak,
              undoState.snapshot.player?.unlockedSkills,
            );
            return {
              ...undoState.snapshot,
              history: nextHistory,
              historyStats: buildHistoryStatsFromHistory(nextHistory),
              savedNotes: (prev.savedNotes ?? []).filter((entry) => entry.sourceSessionId !== sessionId),
              dailyTracking: rebuildCurrentDailyTrackingFromHistory(undoState.snapshot.dailyTracking, nextHistory, now),
              streak: nextStreak,
              missions: rebuildMissionsFromHistory(undoState.snapshot.missions, nextHistory, nextStreak),
              weeklyChain: rebuildWeeklyChainFromHistory(undoState.snapshot.weeklyChain, nextHistory),
              combo: rebuildComboFromHistory(nextHistory, undoState.snapshot, now),
              categoryTracking: rebuildCategoryTrackingFromHistory(nextHistory),
              eraTracking: rebuildEraTrackingFromHistory(nextHistory, undoState.snapshot.progress?.activeBook),
              rankChallenge: rebuildRankChallengeAfterSessionDelete(undoState.snapshot.rankChallenge, nextHistory),
              eraCrisis: rebuildEraCrisisAfterSessionDelete(undoState.snapshot.eraCrisis, nextHistory),
              craftingQueue: rebuildCraftingQueueAfterSessionDelete(undoState.snapshot.craftingQueue, latestSession),
              breakSession: makeDefaultBreakSession(),
              latestSessionUndo: null,
              ui: {
                ...prev.ui,
                lootModalOpen: false,
                pendingReward: null,
                relicNotification: null,
                rankUpNotification: null,
                achievementQueue: [],
                missionCompletedIds: [],
                isOnBreak: false,
                breakSecondsLeft: 0,
                breakTotalSeconds: 0,
                breakIsLong: false,
                activeBreakSessionId: null,
              },
            };
          }

          const deletedSession = prev.history.find((entry) => entry.id === sessionId);
          if (!deletedSession) return prev;

          const now = Date.now();
          const nextHistory = prev.history.filter((entry) => entry.id !== sessionId);
          const rewardRollback = subtractSessionProgressAndXP(prev.progress, prev.player, deletedSession);
          const breakBelongsToDeletedSession =
            prev.breakSession?.sourceSessionId === sessionId
            || prev.ui?.activeBreakSessionId === sessionId;
          const rebuiltCraftingQueue = rebuildCraftingQueueAfterSessionDelete(prev.craftingQueue, deletedSession);
          const eraScopedRollback = pickEraScopedBlueprintPatch({
            ...prev,
            craftingQueue: rebuiltCraftingQueue,
          }, rewardRollback.progress.activeBook);
          const timeSensitiveRollback = buildTimeSensitiveProgressState({
            ...prev,
            player: rewardRollback.player,
            history: nextHistory,
          }, now);

          return {
            player: timeSensitiveRollback.player,
            progress: rewardRollback.progress,
            history: nextHistory,
            historyStats: buildHistoryStatsFromHistory(nextHistory),
            savedNotes: (prev.savedNotes ?? []).filter((entry) => entry.sourceSessionId !== sessionId),
            ...eraScopedRollback,
            dailyTracking: timeSensitiveRollback.dailyTracking,
            streak: timeSensitiveRollback.streak,
            missions: timeSensitiveRollback.missions,
            weeklyChain: timeSensitiveRollback.weeklyChain,
            combo: rebuildComboFromHistory(nextHistory, prev, now),
            categoryTracking: rebuildCategoryTrackingFromHistory(nextHistory),
            eraTracking: rebuildEraTrackingFromHistory(nextHistory, rewardRollback.progress.activeBook),
            rankChallenge: rebuildRankChallengeAfterSessionDelete(prev.rankChallenge, nextHistory),
            eraCrisis: rebuildEraCrisisAfterSessionDelete(prev.eraCrisis, nextHistory),
            latestSessionUndo: null,
            ...(breakBelongsToDeletedSession
              ? {
                  breakSession: makeDefaultBreakSession(),
                  ui: {
                    ...prev.ui,
                    isOnBreak: false,
                    breakSecondsLeft: 0,
                    breakTotalSeconds: 0,
                    breakIsLong: false,
                    activeBreakSessionId: null,
                  },
                }
              : {}),
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
          const previousSession = sessionId
            ? (prev.history.find((session) => session.id === sessionId) ?? null)
            : null;
          if (!previousSession) return prev;

          const hasGoalAchieved = typeof patch.goalAchieved === 'boolean';
          const goal = typeof patch.goal === 'string' ? (patch.goal.trim() || null) : undefined;
          const nextNote = typeof patch.nextNote === 'string' ? (patch.nextNote.trim() || null) : undefined;

          // Thưởng mục tiêu thật: chỉ khi LẦN ĐẦU chấm "Đạt" cho một phiên đã
          // hoàn thành (không phải phiên huỷ) và chưa từng cộng bonus. Bonus là
          // % của chính XP/EP phiên đó kiếm được → nối thưởng game với việc thật.
          const firstAchievement =
            patch.goalAchieved === true
            && previousSession.goalAchieved !== true
            && !previousSession.goalBonusGranted
            && !isCancelledHistoryEntry(previousSession);
          const bonusXP = firstAchievement
            ? Math.max(0, Math.round((previousSession.xpEarned ?? 0) * GOAL_ACHIEVED_BONUS_RATE))
            : 0;
          const bonusEP = firstAchievement
            ? Math.max(0, Math.round((previousSession.epEarned ?? 0) * GOAL_ACHIEVED_BONUS_RATE))
            : 0;
          const grantBonus = firstAchievement && (bonusXP > 0 || bonusEP > 0);

          let updatedSession = null;
          const nextHistory = prev.history.map((session) => {
            if (session.id !== sessionId) return session;
            updatedSession = {
              ...session,
              ...(goal !== undefined ? { goal } : {}),
              ...(nextNote !== undefined ? { nextNote } : {}),
              ...(hasGoalAchieved ? { goalAchieved: patch.goalAchieved } : {}),
              ...(grantBonus ? { goalBonusGranted: true, goalBonusXP: bonusXP, goalBonusEP: bonusEP } : {}),
            };
            return updatedSession;
          });

          if (!updatedSession) return prev;
          const currentHistoryStats = normalizeStoredHistoryStats(prev.historyStats, prev.history);
          const basePatch = {
            history: nextHistory,
            historyStats: applyHistoryReviewStatsDelta(currentHistoryStats, previousSession, updatedSession),
          };

          if (!grantBonus) return basePatch;

          const rewardState = grantXPReward(prev, bonusXP, bonusEP);
          return {
            ...basePatch,
            progress: rewardState.progress,
            player: rewardState.player,
            ui: {
              ...prev.ui,
              levelUpQueue: rewardState.levelsGained > 0
                ? [
                    ...prev.ui.levelUpQueue,
                    {
                      levelsGained: rewardState.levelsGained,
                      newLevel: rewardState.newLevel,
                      spGained: rewardState.spGained,
                    },
                  ]
                : prev.ui.levelUpQueue,
            },
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
        // ADR-078: the whole reward assembly is `engine/sessionRewards.js` (pure, tested). The store
        // supplies the clocks and the settings read, applies the patch, returns the result. Nothing
        // is computed here any more — a formula added here is a formula the engine cannot test.
        const now = Date.now();
        const { patch, sessionResult } = assembleSessionReward({
          state: get(),
          minutesFocused,
          categoryId,
          note,
          sessionTiming,
          sessionSnapshot,
          now,
          today: localDateStr(now),
          weekKey: localWeekMondayStr(now),
          dailyGoal: readDailyGoalSettings(),
          random: Math.random,
        });
        set(patch);
        return sessionResult;
      },

      // ─── Hủy phiên tập trung (Thảm Họa) ─────────────────────────────────
      cancelFocusSession: (progressRatio = 0, options = {}) => {
        const state = get();
        const {
          recordSession = true,
          mode = state.timerConfig.mode,
          elapsedMinutes: optionElapsedMinutes = null,
          elapsedSeconds: optionElapsedSeconds = null,
          targetMinutes: optionTargetMinutes = null,
          sessionTiming = null,
          sessionSnapshot = null,
          categoryId: optionCategoryId = undefined,
          categorySnapshot: optionCategorySnapshot = undefined,
          note: optionNote = undefined,
          goal: optionGoal = undefined,
          nextNote: optionNextNote = undefined,
        } = options;

        // Giam Cầm Năng Lượng — thất bại: mất hoàn toàn số EP đã giam
        // (EP đã bị trừ khi activateOverclock, chỉ cần xóa state)
        // const overclockLost = state.staking.stakedEP; // (đã bị trừ)

        const now     = Date.now();
        const sessionId = now;
        const normalizedProgressRatio = Math.max(0, Math.min(1, progressRatio));
        const activeBook = getActiveBook(state.progress.totalEP);
        const timerSession = state.timerSession ?? {};
        const totalSeconds = Number.isFinite(timerSession.totalSeconds)
          ? Math.max(0, timerSession.totalSeconds)
          : 0;
        const fallbackElapsedMinutes = totalSeconds > 0
          ? Math.max(0, Math.floor((totalSeconds * normalizedProgressRatio) / 60))
          : 0;
        const elapsedSeconds = Number.isFinite(optionElapsedSeconds)
          ? Math.max(0, Math.floor(optionElapsedSeconds))
          : fallbackElapsedMinutes * 60;
        const elapsedMinutes = Number.isFinite(optionElapsedMinutes)
          ? Math.max(0, Math.floor(optionElapsedMinutes))
          : fallbackElapsedMinutes;
        const targetMinutes = Number.isFinite(optionTargetMinutes)
          ? Math.max(0, Math.round(optionTargetMinutes))
          : Math.max(0, Math.round(totalSeconds / 60));
        const sessionCategoryId = optionCategoryId !== undefined
          ? optionCategoryId
          : (timerSession.categoryId ?? state.pendingCategoryId ?? null);
        const sessionCategorySnapshot = optionCategorySnapshot !== undefined
          ? optionCategorySnapshot
          : (sessionSnapshot?.categorySnapshot ?? timerSession.categorySnapshot ?? null);
        const trimmedNote = (optionNote ?? timerSession.note ?? '').trim();
        const trimmedGoal = (optionGoal ?? sessionSnapshot?.goal ?? timerSession.goal ?? '').trim();
        const trimmedNextNote = (optionNextNote ?? sessionSnapshot?.nextNote ?? timerSession.nextNote ?? '').trim();
        const resolvedStartedAt = sessionTiming?.startedAt
          ?? (timerSession.startedAt ? new Date(timerSession.startedAt).toISOString() : null);
        const resolvedFinishedAt = sessionTiming?.finishedAt ?? new Date(now).toISOString();
        const pauseSegments = Array.isArray(sessionTiming?.pauseSegments)
          ? sessionTiming.pauseSegments
          : (Array.isArray(timerSession.pauseSegments) ? timerSession.pauseSegments : []);
        const pausedTotalMs = Number.isFinite(sessionTiming?.pausedTotalMs)
          ? Math.max(0, sessionTiming.pausedTotalMs)
          : Math.max(0, timerSession.pausedTotalMs ?? 0);
        const wallClockDurationMs = Number.isFinite(sessionTiming?.wallClockDurationMs)
          ? Math.max(0, sessionTiming.wallClockDurationMs)
          : (resolvedStartedAt
            ? Math.max(0, new Date(resolvedFinishedAt).getTime() - new Date(resolvedStartedAt).getTime())
            : null);
        const appendCancelledSession = (prev) => {
          if (!recordSession) {
            return {
              history: prev.history,
              historyStats: prev.historyStats,
              savedNotes: prev.savedNotes,
            };
          }

          const sessionEntry = {
            id: sessionId,
            book: activeBook,
            timestamp: resolvedFinishedAt,
            startedAt: resolvedStartedAt,
            finishedAt: resolvedFinishedAt,
            cancelledAt: resolvedFinishedAt,
            pauseSegments,
            pausedTotalMs,
            wallClockDurationMs,
            minutes: elapsedMinutes,
            elapsedSeconds,
            targetMinutes,
            xpEarned: 0,
            epEarned: 0,
            tier: 'Phiên bị hủy',
            multiplier: 0,
            jackpot: false,
            blueprint: null,
            categoryId: sessionCategoryId ?? null,
            categorySnapshot: sessionCategorySnapshot,
            status: HISTORY_ENTRY_STATUS.CANCELLED,
            completed: false,
            cancelled: true,
            cancelProgressRatio: normalizedProgressRatio,
            // ADR-071 (đóng #99): huỷ phiên không còn trừ tài nguyên — không có gì để phạt.
            cancelPenalty: null,
            comboCount: 1,
            positiveEvent: null,
            note: trimmedNote || null,
            breakNote: null,
            goal: trimmedGoal || null,
            goalAchieved: trimmedGoal ? false : null,
            nextNote: trimmedNextNote || null,
            breakCompletedOnTime: false,
            breakCompletedAt: null,
          };
          const currentHistoryStats = normalizeStoredHistoryStats(prev.historyStats, prev.history);
          const nextHistoryStats = applyHistoryReviewStatsDelta({
            ...currentHistoryStats,
            cancelledSessions: currentHistoryStats.cancelledSessions + 1,
            cancelledMinutes: currentHistoryStats.cancelledMinutes + elapsedMinutes,
          }, null, sessionEntry);

          return {
            history: [sessionEntry, ...prev.history].slice(0, 2000),
            historyStats: nextHistoryStats,
            savedNotes: upsertSavedNoteEntry(prev.savedNotes ?? [], sessionEntry),
          };
        };

        set((prev) => {
          const cancelledHistoryPatch = appendCancelledSession(prev);

          return {
            ...cancelledHistoryPatch,
            staking: makeDefaultStaking(),
            progress: mode === 'pomodoro'
              ? markLongBreakCycleBreakEnded(prev.progress, now)
              : syncLongBreakCycleProgress(prev.progress, now),
            sessionMeta: { ...prev.sessionMeta, lastSessionCancelled: true, breakCompletedOnTime: false },
            latestSessionUndo: null,
          };
        });
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

        // B (Cộng Hưởng): KHÔNG tin spCost từ UI. Tra giá GỐC chuẩn từ SKILL_TREE,
        // rồi áp giảm-nửa-giá nếu sở hữu cổ vật cộng hưởng (chống cả tamper-down lẫn
        // tamper-up-discount).
        let baseCost = spCost;
        for (const branch of Object.values(SKILL_TREE)) {
          const node = branch.nodes.find((n) => n.id === skillId);
          if (node) { baseCost = node.spCost; break; }
        }
        const effectiveCost = getEffectiveSkillCost(skillId, baseCost, state.relics, state.relicEvolutions);

        if (sp < effectiveCost) return false;
        const prereqsMet = requires.every((req) => unlockedSkills[req]);
        if (!prereqsMet) return false;

        set((prev) => ({
          player: {
            ...prev.player,
            sp: prev.player.sp - effectiveCost,
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

      // ─── Hệ thống Danh Xưng · Thử thách kỷ nguyên (ADR-069) ──────────────────
      /**
       * checkEraCrisisDeadlines — TÊN GIỮ (App gọi lúc mở app), RUỘT ĐỔI (2026-09-06, ADR-069):
       * không còn hạn để mà "hết hạn". Việc duy nhất còn lại là đưa dữ liệu ĐỜI CŨ (khủng hoảng
       * chưa chọn, hoặc còn deadline) về dạng nhiệm vụ mềm — không phạt ai vì dữ liệu đời trước.
       * `initiateRankChallenge` · `checkRankChallengeDeadlines` · `resolveEraCrisis` ·
       * `openEraCrisisModal` đã GỠ HẲN cùng hai hộp thoại của chúng.
       */
      checkEraCrisisDeadlines: () => {
        const state = get();
        const crisis = state.eraCrisis;
        if (!crisis?.active) return false;
        if (crisis.choiceMade === 'challenge' && crisis.challengeDeadline == null) return false;
        set((prev) => ({
          eraCrisis: openCrisisQuest(prev.eraCrisis),
          ui: { ...prev.ui, eraCrisisModalOpen: false },
        }));
        return true;
      },

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

      /**
       * ⚠️ TIẾNG VÀO NGHỈ (2026-09-01). `soundEngine.playBreakStart()` viết xong từ lâu với **0
       * nơi gọi**, trong khi chuyển sang chế độ nghỉ là lần DUY NHẤT app TỰ chiếm màn hình mà
       * không ai bấm gì — và nó làm việc đó hoàn toàn im lặng. Một màn hình tự đổi mà không có
       * tín hiệu nào là chỗ dễ làm người ta giật mình nhất.
       *
       * ⚠️ GỌI NGOÀI `set(...)`, KHÔNG GỌI TRONG. Hàm cập nhật của zustand có thể chạy nhiều lần
       * cho một lần gọi (StrictMode gọi đôi), nên nhét một tác dụng phụ vào trong là mở đường
       * cho tiếng kêu hai lần.
       * ⚠️ GỌI Ở STORE, KHÔNG RẮC VÀO BA CHỖ GỌI `startBreak` — bịt ba chỗ thì chỗ thứ tư viết
       * sau này sẽ quên (bài học "bịt mười lăm chỗ thì chỗ thứ mười sáu quên").
       * ⚠️ Gác `isOnBreak`: gọi lại lúc ĐANG nghỉ thì không kêu thêm lần nữa.
       */
      startBreak: (breakInput) => {
        if (!get().ui.isOnBreak) soundEngine.playBreakStart();
        return set((prev) => {
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
        });
      },

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

      dismissLevelUp: () =>
        set((prev) => ({ ui: { ...prev.ui, levelUpQueue: prev.ui.levelUpQueue.slice(1) } })),

      dismissRelicNotification: () =>
        set((prev) => ({ ui: { ...prev.ui, relicNotification: null } })),

      dismissRankUpNotification: () =>
        set((prev) => ({ ui: { ...prev.ui, rankUpNotification: null } })),

      /**
       * ⚠️ NHẬN ID TUỲ CHỌN (2026-08-27, ADR-060). Trước đây chỉ có `slice(1)` vì
       * toast hiện MỘT cái một lúc, nên "bỏ cái đang hiện" và "bỏ cái đầu hàng"
       * là cùng một việc. Nay chồng tối đa 3 thẻ cùng lúc và mỗi thẻ tự hết hạn
       * theo đồng hồ riêng, nên thẻ thứ ba có thể hết trước thẻ thứ nhất —
       * `slice(1)` lúc đó sẽ bỏ NHẦM một thành tích Đàm chưa kịp đọc.
       * Không truyền id thì hành vi y hệt bản cũ.
       */
      dismissAchievementNotification: (id) =>
        set((prev) => ({
          ui: {
            ...prev.ui,
            achievementQueue: id === undefined
              ? prev.ui.achievementQueue.slice(1)
              : prev.ui.achievementQueue.filter((item) => item !== id),
          },
        })),

      dismissMissionNotification: (id) =>
        set((prev) => {
          const queue = prev.ui.missionCompletedIds ?? [];
          return {
            ui: {
              ...prev.ui,
              missionCompletedIds: id === undefined ? queue.slice(1) : queue.filter((item) => item !== id),
            },
          };
        }),

      // ─── Daily Missions ──────────────────────────────────────────────────
      refreshDailyMissions: () =>
        set((prev) => {
          const {
            player,
            streak,
            missions,
            weeklyChain,
            dailyTracking,
          } = buildTimeSensitiveProgressState(prev, Date.now());

          if (
            isJsonEqual(player, prev.player)
            && isJsonEqual(missions, prev.missions)
            && isJsonEqual(weeklyChain, prev.weeklyChain)
            && isJsonEqual(streak, prev.streak)
            && isJsonEqual(dailyTracking, prev.dailyTracking)
          ) {
            return prev;
          }

          return {
            player,
            streak,
            missions,
            weeklyChain,
            dailyTracking,
          };
        }),

      // ─── Building Workshop ───────────────────────────────────────────────
      // Legacy compatibility path cho save cũ còn giữ blueprint copy riêng.
      // Add passive building EP from game loop (backward compat — còn dùng cho STORAGE_VAULT)
      addBuildingPassiveEP: (amount) =>
        set((prev) => {
          const newTotalEP = prev.progress.totalEP + amount;
          const activeBook = getActiveBook(newTotalEP);
          return {
            ...pickEraScopedBlueprintPatch(prev, activeBook),
            progress: {
              ...prev.progress,
              totalEP:    newTotalEP,
              activeBook,
            },
          };
        }),

      startProject: (bpId) => {
        const state = get();
        const meta  = BLUEPRINT_META[bpId];
        if (!meta || !BUILDING_SPECS[bpId]) return false;
        if ((state.craftingQueue ?? []).some((q) => q.bpId === bpId)) return false;

        const isRestoration = !isCurrentEraBlueprint(bpId, state.progress.activeBook);
        if (isRestoration) {
          if (!canRestoreBlueprint({
            bpId,
            activeBook:  state.progress.activeBook,
            cityArchive: state.cityArchive,
            queue:       state.craftingQueue,
            legacySlots: LEGACY_QUEUE_SLOTS,
          })) return false;
        } else {
          if (state.buildings.includes(bpId)) return false;
          if (countActiveCrafting(state.craftingQueue, state.progress.activeBook) >= CRAFT_QUEUE_SLOTS) return false;
        }

        const workshopFeed = makeWorkshopQueuedNotification(bpId, meta.sessionsToComplete);
        set((prev) => {
          const researched = prev.research?.researched ?? [];
          return {
            research: {
              ...(prev.research ?? { rp: 0, researched: [] }),
              researched: researched.includes(bpId) ? researched : [...researched, bpId],
            },
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
      /**
       * cancelCrafting
       * Hủy bỏ công trình đang xây. ADR-071 (đóng #99): không còn hoàn nguyên liệu — dự án không tốn
       * nguyên liệu để bắt đầu (ADR-069), nên cũng không có gì để trả lại.
       */
      // ADR-078 (Việc 2): change this session's project from where Đàm stands — one tap on the
      // Focus strip. The engine decides (`chooseSessionProject`, pure, tested); the store applies.
      /**
       * THỢ ĐÊM (ADR-081) — the surprise that lands at the OPEN of a day.
       *
       * Called at most once a day by `focus/DayMoment.jsx` (which owns the per-day stamp). It pushes
       * ONE brick onto the project at the head of the queue and returns its id, or null.
       *
       * ⚠️ IT CAN NEVER FINISH A BUILDING. «Công trình hoàn thành» is the reward of a session and it
       * has a whole tier of the ending built around it; handing it out at breakfast would spend that
       * moment on nothing. So a head with a single session left is left alone.
       * ⚠️ Never negative, and never a fourth currency: it moves `sessionsRemaining`, nothing else.
       */
      rollNightBuilder: () => {
        const state = get();
        const queue = state.craftingQueue ?? [];
        const head = queue[0];
        if (!head?.bpId || !(Number(head.sessionsRemaining) >= 2)) return null;
        if (Math.random() >= NIGHT_BUILDER_CHANCE) return null;
        set({
          craftingQueue: [{ ...head, sessionsRemaining: Number(head.sessionsRemaining) - 1 }, ...queue.slice(1)],
          latestSessionUndo: null,
        });
        return head.bpId;
      },

      setSessionProject: (bpId) => {
        const state = get();
        const result = chooseSessionProject({
          craftingQueue: state.craftingQueue ?? [],
          activeBook: state.progress.activeBook,
          buildings: state.buildings,
          bpId,
          now: Date.now(),
        });
        if (!result.ok) return false;
        if (result.changed) set({ craftingQueue: result.craftingQueue, latestSessionUndo: null });
        return true;
      },
      cancelCrafting: (bpId) => {
        const state = get();
        const item  = (state.craftingQueue ?? []).find((q) => q.bpId === bpId);
        if (!item) return false;
        set((prev) => ({
          craftingQueue: prev.craftingQueue.filter((q) => q.bpId !== bpId),
          latestSessionUndo: null,
        }));
        return true;
      },

      /**
       * Ảnh chụp số liệu mà `check()` của thành tích đọc — dựng từ TRẠNG THÁI HIỆN TẠI.
       *
       * ⚠️ VÌ SAO PHẢI CÓ. Màn "Huy hiệu" cần trả lời "còn bao nhiêu nữa", mà con số ấy chỉ tồn
       * tại bên trong `buildAchievementSnapshot` — một hàm riêng của file này, xưa nay chỉ chạy
       * đúng một lần mỗi khi xong phiên. Không có lối này thì giao diện buộc phải tự dựng lại
       * một bản snapshot thứ hai, tức hai công thức cho một sự thật, và chúng sẽ trôi khỏi nhau.
       *
       * ⚠️ ĐẮT: nó quét lại TOÀN BỘ `history` (fixture 180 ngày = 624 phiên). Chỗ gọi PHẢI bọc
       * `useMemo` theo đúng những lát state nó đọc, đừng gọi thẳng trong thân render.
       */
      buildAchievementSnapshotNow: () => {
        const s = get();
        return buildAchievementSnapshot(
          s.progress,
          s.relics,
          s.blueprints,
          s.research,
          s.history,
          s.rankSystem,
          s.streak,
          s.buildings,
          s.prestige,
          s.player,
        );
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
        /*
          ⚠️ BA ĐẶC QUYỀN THĂNG HOA NAY CÓ THẬT (2026-09-02, đóng `TECH_DEBT #3`).
          `kien_thuc_nen` (3 SP) · `ke_thua` (5 SP) · `sieu_viet` (8 SP) có mô tả hứa hẹn rành
          mạch trong `constants.js` từ lâu, và hàm này **chưa bao giờ đọc tới chúng** — tức Đàm bỏ
          16 điểm kỹ năng cho ba thứ không làm gì, và app nói với anh là chúng có làm.
          Luật nằm ở `engine/prestigeCarryover.js` (thuần, tất định); hàm này chỉ áp dụng.
          ⚠️ Cờ `sieuViet` để trong `prestige` vì đó là một trong số ít nhánh SỐNG SÓT qua reset —
          để ở `player` thì `makeProgressionResetState()` xoá mất ngay lần Thăng Hoa kế tiếp.
        */
        const giuLai = tinhGiuLai({
          unlockedSkills: state.player.unlockedSkills,
          sp: state.player.sp,
          skillsMacDinh: makeDefaultSkills(),
        });
        const resetState = makeProgressionResetState();

        set({
          ...resetState,
          player: { ...resetState.player, sp: giuLai.sp, unlockedSkills: giuLai.unlockedSkills },
          timerConfig: state.timerConfig,
          relics: state.relics,
          achievements: state.achievements,
          history: state.history,
          historyStats: state.historyStats,
          savedNotes: state.savedNotes,
          relicEvolutions: state.relicEvolutions,
          sessionCategories: state.sessionCategories,
          lastWeeklyReportDate: state.lastWeeklyReportDate,
          lastWeeklyReportSeenDate: state.lastWeeklyReportSeenDate,
          prestige: {
            count:          newCount,
            permanentBonus: newBonus,
            history:        [...state.prestige.history, { at: Date.now(), epAtPrestige: state.progress.totalEP }],
            sieuViet:       giuLai.sieuViet || !!state.prestige.sieuViet,
            giuKyNang:      giuLai.giuKyNang,
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
      // ⚠️ SÁNG THỨ HAI KHÔNG CÒN CHẶN MÀN HÌNH (2026-08-27, đóng `TECH_DEBT #87`). Đây từng là
      // ngoại lệ DUY NHẤT của luật mức độ làm phiền ở ADR-060: một bản tổng kết Đàm không xin,
      // đứng chắn ngang app. Nay nó chỉ MỜI bằng một thẻ toast; hộp thoại chỉ mở khi Đàm bấm.
      //
      // ⚠️ VÌ SAO PHẢI TÁCH HAI NGÀY TRƯỚC KHI ĐỔI: bản cũ gộp "đã mời" với "đã xem" vào một
      // trường, và `dismissWeeklyReport` ghi trường ấy ở mọi lần ĐÓNG. Đẩy thẳng sang toast
      // 4 giây mà giữ nguyên cách ghi thì lỡ một cái toast = mất báo cáo của cả tuần — đổi một
      // phiền toái nhỏ lấy một mất mát thật. Nay:
      //   · hết giờ toast  → chỉ tắt lời mời, KHÔNG ghi gì (`dismissWeeklyReportToast`)
      //   · Đàm mở Thống kê → mới ghi "đã xem" (`markWeeklyReportSeen`, ADR-077)
      // ⇒ lỡ toast thì chấm ở tab Thống kê vẫn sáng.
      checkWeeklyReport: () => {
        const state = get();
        const monday = getWeekMonday();
        // Chỉ mời nếu hôm nay là thứ 2 VÀ chưa mời tuần này
        const isMonday = getVietnamDayOfWeek() === 1;
        if (isMonday && state.lastWeeklyReportDate !== monday && state.history.length > 0) {
          // Ghi "đã mời" NGAY tại đây, không đợi Đàm phản hồi: nếu đợi thì mỗi lần mở app trong
          // ngày thứ Hai lại nổ thêm một thẻ nữa. Lưới an toàn cho việc mời hụt là cái chấm ở
          // thanh bên, thứ do `lastWeeklyReportSeenDate` điều khiển chứ không do trường này.
          set((prev) => ({
            lastWeeklyReportDate: monday,
            ui: { ...prev.ui, weeklyReportPending: true },
          }));
        }
      },

      /**
       * ADR-077: there is no weekly-report dialog any more — the Stats screen already answers "am I
       * improving this week vs last". Seeing the summary = opening Stats; this only records "seen"
       * for the week (the dot on the Thống kê tab goes out) and clears the Monday invitation.
       */
      markWeeklyReportSeen: () => {
        const monday = getWeekMonday();
        set((prev) => ({
          lastWeeklyReportSeenDate: monday,
          ui: { ...prev.ui, weeklyReportPending: false },
        }));
      },

      /** Thẻ toast hết 4 giây. CHỈ tắt lời mời — tuyệt đối không ghi "đã xem". */
      dismissWeeklyReportToast: () =>
        set((prev) => ({ ui: { ...prev.ui, weeklyReportPending: false } })),

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
          const activeBook = getActiveBook(newTotalEP);
          return {
            ...pickEraScopedBlueprintPatch(prev, activeBook),
            progress: {
              ...prev.progress,
              totalEP:    newTotalEP,
              activeBook,
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
        cityArchive:      state.cityArchive,
        resourcesRefined: state.resourcesRefined,
        relicEvolutions:      state.relicEvolutions,
        tinhThe:              state.tinhThe,
        lastWeeklyReportDate:     state.lastWeeklyReportDate,
        lastWeeklyReportSeenDate: state.lastWeeklyReportSeenDate,
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
