#!/usr/bin/env node
/**
 * simulate-playthrough.mjs
 * Mô phỏng người chơi thật chạm tới ERA_15_END (111,000 EP).
 *
 * V2 — bộ skill viết lại theo nguyên tắc:
 *  - Length-based buff: ngưỡng > 25 (≥30, ≥45, ≥60)
 *  - Trigger phụ (streak, mission, count phiên) áp dụng mọi phiên
 *  - Cấm "first session" / "before X hour" không có ngưỡng độ dài
 *  - EP_FACTOR_HARD_CAP = 2.5
 */

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ERA_THRESHOLDS = [
  1_300, 3_000, 5_000, 7_400, 10_400,
  14_100, 18_500, 24_100, 29_600, 37_400,
  46_900, 58_700, 73_000, 90_200, 111_000,
];
const ERA_15_END = ERA_THRESHOLDS[14];

const BASE_XP_PER_MINUTE = 1;
const BASE_EP_PER_MINUTE = 1;
const EP_TIER = { short: 1.0, medium: 1.1, long: 1.2 };
const DEEP_FOCUS_THRESHOLD = 26;
const VUNG_DONG_CHAY_MIN_MIN = 45;
const TAP_TRUNG_SV_MIN_MIN = 60;
const TIME_BENDER_CHANCE = 0.015;
const JACKPOT_CHANCE = 0.025;
const JACKPOT_MULTIPLIER = 2.5;
const XP_FACTOR_HARD_CAP = 4.25; // ĐÚNG: từ constants.js
const EP_FACTOR_HARD_CAP = 2.5; // ── MỚI

const EXP_PER_LEVEL = 6000;
const SP_PER_LEVEL = 2;

// Skill bonus values (giữ số cũ trừ khi có lý do thay)
const VAO_GUONG_XP = 0.05;             // ≥30
const VAO_GUONG_MIN = 30;
const CHUYEN_CAN_XP = 0.08;            // ≥45 (đẩy ngưỡng từ 25→45, tăng 6→8)
const CHUYEN_CAN_MIN = 45;
const DA_TAP_TRUNG_PER = 0.02;
const DA_TAP_TRUNG_MAX = 4;
const TAP_TRUNG_SV_XP = 0.15;
const TAP_TRUNG_SV_EP = 0.05;          // MỚI: thêm EP
const SIEU_TAP_TRUNG_XP_MULT = 1.7;
const SIEU_TAP_TRUNG_EP_MULT = 1.3;    // MỚI
const SIEU_TAP_TRUNG_MIN = 45;          // MỚI: yêu cầu ≥45
const PHUC_HOI_XP = 0.12;
const PHUC_HOI_EP = 0.05;              // MỚI
const PHUC_HOI_MIN = 30;                // MỚI
const CHUOI_NGAY_PER_DAY = 0.004;
const CHUOI_NGAY_MAX = 24;
const NAP_NANG_LUONG_XP = 0.08;
const NAP_NANG_LUONG_MIN = 30;          // MỚI
const TICH_PHIEN_AFTER = 3;             // MỚI: sau 3 phiên
const TICH_PHIEN_XP = 0.06;             // MỚI
const PHIEN_VANG_SANG_XP = 0.10;        // tăng nhẹ (8→10) vì giờ phải ≥45
const PHIEN_VANG_SANG_EP = 0.05;        // MỚI
const PHIEN_VANG_SANG_MIN = 45;         // MỚI
const NHIP_SINH_HOC_XP = 0.12;
const NHIP_SINH_HOC_AFTER = 4;
const NHIP_SINH_HOC_MIN = 30;            // MỚI
const NHIP_HOAN_HAO_XP = 0.10;          // MỚI
const NHIP_HOAN_HAO_EP = 0.10;          // MỚI
const NHIP_HOAN_HAO_MIN = 30;
const NHIP_HOAN_HAO_THRESHOLD_DAYS = 3;
const NHIP_HOAN_HAO_SESSIONS_PER_DAY = 6;
const BEN_VUNG_STREAK = 30;             // MỚI
const BEN_VUNG_PERMANENT = 0.05;        // +5% allBonus khi đạt
const BEN_VUNG_MIN = 30;
const LA_CHAN_STREAK_PER_WEEK = 1;      // MỚI
const NGUOI_LAP_KE_XP = 0.05;           // MỚI
const CU_TRI_XP = 0.10;                 // MỚI
const CU_TRI_SESSIONS = 3;
const CO_VAN_XP = 0.08;                 // MỚI
const LICH_DAY_ALLBONUS = 0.12;         // MỚI
const LICH_DAY_45_MIN = 45;
const LICH_DAY_60_MIN = 60;
const BAC_THAY_CL_XP = 0.14;
const BAC_THAY_CL_EP = 0.05;            // MỚI
const BAC_THAY_CL_MIN = 30;             // MỚI
const KY_UC_KY_NGUYEN_XP = 0.18;
const KY_UC_KY_NGUYEN_EP = 0.10;        // MỚI
const KY_UC_KY_NGUYEN_MIN = 30;         // MỚI
const TRI_TUE_TICH_LUY_PER_ERA = 0.005;
const TRI_TUE_TICH_LUY_MAX_ERAS = 15;
const BAC_THAY_KY_NGUYEN_PER = 0.015;
const BAC_THAY_KY_NGUYEN_MAX = 0.12;
const BAC_THAY_KY_NGUYEN_SESSIONS = 100;
// Streak system (always-on, separate from skill chuoi_ngay)
const STREAK_BONUS_PER_DAY = 0.012;  // ĐÚNG: +1.2%/day
const STREAK_MAX_BONUS_DAYS = 15;    // ĐÚNG: max 15 days = +18%

// Synergies (length-gated)
const SYNERGIES = [
  { id: 'hanh_gia', branch: 'THIEN_DINH', minSkills: 3, xpBonus: 0.03, minLen: 30 },
  { id: 'nguoi_ben', branch: 'Y_CHI', minSkills: 3, xpBonus: 0.05, minLen: 30 },
  { id: 'nguoi_nhip_deu', branch: 'NGHI_NGOI', minSkills: 3, xpBonus: 0.05, minLen: 30 },
  { id: 'tay_vang', branch: 'VAN_MAY', minSkills: 3, xpBonus: 0.05, minLen: 45 },
  { id: 'quan_su', branch: 'CHIEN_LUOC', minSkills: 3, xpBonus: 0.05, minLen: 30 },
  { id: 'tien_hoa', branch: 'THANG_HOA', minSkills: 3, xpBonus: 0.05, minLen: 30 },
  { id: 'bac_thay_van_nang', branchCount: 4, branchMinSkills: 3, xpBonus: 0.08, minLen: 30 },
];

// Rank
const RANK_ALLBONUS = [0, 0.10, 0.15, 0.22, 0.27];

// ─── PROFILES ────────────────────────────────────────────────────────────────
const PROFILES = {
  CASUAL: {
    label: 'Casual (4 ngày/tuần, 3-4 phiên 25 phút)',
    sessionsPerDay: () => randInt(2, 4),
    sessionLength: () => choose([
      [25, 0.85], [30, 0.10], [45, 0.05],
    ]),
    skipDayChance: 0.43,
    cancelRate: 0.10,
    rankAttemptInterval: 12,
    rankSuccessRate: 0.55,
    eraCrisisChallengeRate: 0.40,
  },
  REGULAR: {
    label: 'Đều đặn (6 ngày/tuần, 5-6 phiên hỗn hợp)',
    sessionsPerDay: () => randInt(4, 6),
    sessionLength: () => choose([
      [25, 0.55], [30, 0.20], [45, 0.15], [50, 0.07], [60, 0.03],
    ]),
    skipDayChance: 0.14,
    cancelRate: 0.07,
    rankAttemptInterval: 7,
    rankSuccessRate: 0.75,
    eraCrisisChallengeRate: 0.65,
  },
  ENGAGED: {
    label: 'Tập trung cao (6-7 ngày/tuần, 6-8 phiên, có deep work)',
    sessionsPerDay: () => randInt(6, 8),
    sessionLength: () => choose([
      [25, 0.40], [30, 0.20], [45, 0.18], [60, 0.15], [75, 0.05], [90, 0.02],
    ]),
    skipDayChance: 0.07,
    cancelRate: 0.05,
    rankAttemptInterval: 5,
    rankSuccessRate: 0.85,
    eraCrisisChallengeRate: 0.85,
  },
  HARDCORE: {
    label: 'Hardcore (7 ngày/tuần, 8-10 phiên, nhiều phiên dài)',
    sessionsPerDay: () => randInt(7, 10),
    sessionLength: () => choose([
      [25, 0.20], [45, 0.30], [60, 0.30], [75, 0.12], [90, 0.08],
    ]),
    skipDayChance: 0.02,
    cancelRate: 0.03,
    rankAttemptInterval: 3,
    rankSuccessRate: 0.95,
    eraCrisisChallengeRate: 0.95,
  },
};

// ─── SKILL TREE (bộ mới) ─────────────────────────────────────────────────────
// Mỗi nhánh 6 skills: 3+3+7+7+14+22 = 56 SP/nhánh, total 336 SP
const SKILL_TREE_NEW = {
  THIEN_DINH: [
    { id: 'vao_guong', cost: 3, requires: [] },
    { id: 'chuyen_can', cost: 3, requires: [] },
    { id: 'da_tap_trung', cost: 7, requires: ['vao_guong'] },
    { id: 'vung_dong_chay', cost: 7, requires: ['chuyen_can'] },
    { id: 'tap_trung_sieu_viet', cost: 14, requires: ['vung_dong_chay'] },
    { id: 'sieu_tap_trung', cost: 22, requires: ['tap_trung_sieu_viet'] },
  ],
  Y_CHI: [
    { id: 'su_tha_thu', cost: 3, requires: [] },
    { id: 'bo_nho_co_bap', cost: 3, requires: [] },
    { id: 'phuc_hoi', cost: 7, requires: ['su_tha_thu'] },
    { id: 'chuoi_ngay', cost: 7, requires: ['bo_nho_co_bap'] },
    { id: 'la_chan_streak', cost: 14, requires: ['chuoi_ngay'] },
    { id: 'ben_vung', cost: 22, requires: ['la_chan_streak'] },
  ],
  NGHI_NGOI: [
    { id: 'hit_tho_sau', cost: 3, requires: [] },
    { id: 'nap_nang_luong', cost: 3, requires: [] },
    { id: 'tich_phien', cost: 7, requires: ['hit_tho_sau'] },
    { id: 'phien_vang_sang', cost: 7, requires: ['nap_nang_luong'] },
    { id: 'nhip_sinh_hoc', cost: 14, requires: ['phien_vang_sang'] },
    { id: 'nhip_hoan_hao', cost: 22, requires: ['nhip_sinh_hoc'] },
  ],
  VAN_MAY: [
    { id: 'ban_tay_vang', cost: 3, requires: [] },
    { id: 'nhan_quan', cost: 3, requires: [] },
    { id: 'linh_cam', cost: 7, requires: ['ban_tay_vang'] },
    { id: 'loc_ban_tang', cost: 7, requires: ['nhan_quan'] },
    { id: 'dai_trung_thuong', cost: 14, requires: ['loc_ban_tang'] },
    { id: 'so_do', cost: 22, requires: ['dai_trung_thuong'] },
  ],
  CHIEN_LUOC: [
    { id: 'nguoi_lap_ke', cost: 3, requires: [] },
    { id: 'cu_tri', cost: 3, requires: [] },
    { id: 'co_van', cost: 7, requires: ['nguoi_lap_ke'] },
    { id: 'lich_day', cost: 7, requires: ['cu_tri'] },
    { id: 'bac_thay_chien_luoc', cost: 14, requires: ['co_van'] },
    { id: 'ke_hoach_hoan_hao', cost: 22, requires: ['bac_thay_chien_luoc'] },
  ],
  THANG_HOA: [
    { id: 'ky_uc_ky_nguyen', cost: 3, requires: [] },
    { id: 'tri_tue_tich_luy', cost: 3, requires: [] },
    { id: 'kien_thuc_nen', cost: 7, requires: ['ky_uc_ky_nguyen'] },
    { id: 'bac_thay_ky_nguyen', cost: 7, requires: ['tri_tue_tich_luy'] },
    { id: 'ke_thua', cost: 14, requires: ['kien_thuc_nen'] },
    { id: 'sieu_viet', cost: 22, requires: ['ke_thua'] },
  ],
};

// Unlock priority: focus skills tăng EP/XP sớm rồi expand
const SKILL_UNLOCK_ORDER = [
  // Wave 1: basic + EP-relevant
  'vao_guong', 'chuyen_can', 'su_tha_thu', 'bo_nho_co_bap',
  'hit_tho_sau', 'nap_nang_luong', 'ky_uc_ky_nguyen', 'tri_tue_tich_luy',
  'nguoi_lap_ke', 'cu_tri', 'ban_tay_vang', 'nhan_quan',
  // Wave 2: intermediate
  'da_tap_trung', 'vung_dong_chay', 'phuc_hoi', 'chuoi_ngay',
  'tich_phien', 'phien_vang_sang', 'co_van', 'lich_day',
  'linh_cam', 'loc_ban_tang', 'kien_thuc_nen', 'bac_thay_ky_nguyen',
  // Wave 3: advanced
  'tap_trung_sieu_viet', 'la_chan_streak', 'nhip_sinh_hoc',
  'bac_thay_chien_luoc', 'dai_trung_thuong', 'ke_thua',
  // Wave 4: elite
  'sieu_tap_trung', 'ben_vung', 'nhip_hoan_hao',
  'so_do', 'ke_hoach_hoan_hao', 'sieu_viet',
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rand() { return Math.random(); }
function choose(weighted) {
  const total = weighted.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of weighted) {
    r -= w;
    if (r <= 0) return v;
  }
  return weighted[weighted.length - 1][0];
}
function getActiveBook(totalEP) {
  for (let i = 0; i < ERA_THRESHOLDS.length; i++) {
    if (totalEP < ERA_THRESHOLDS[i]) return i + 1;
  }
  return 15;
}
function getMultiplierTier(minutes) {
  // Không còn Khởi Động Nhanh — ngưỡng cố định 26
  if (minutes >= 60) return 2.0;
  if (minutes >= DEEP_FOCUS_THRESHOLD) return 1.3;
  return 1.0;
}
function getEpTier(minutes) {
  if (minutes >= 60) return EP_TIER.long;
  if (minutes >= DEEP_FOCUS_THRESHOLD) return EP_TIER.medium;
  return EP_TIER.short;
}
function applyTimeBender(minutes, hasSkill) {
  // Time bender đã bị bỏ trong bộ mới — Lộc Ban Tặng thay thế
  return minutes;
}
function applyVungDongChay(tier, minutes, hasSkill) {
  if (!hasSkill || minutes < VUNG_DONG_CHAY_MIN_MIN) return tier;
  if (tier < 1.3) return 1.3;
  if (tier < 2.0) return 2.0;
  return tier;
}
function findSkillByCost(id) {
  for (const branch of Object.values(SKILL_TREE_NEW)) {
    const found = branch.find((n) => n.id === id);
    if (found) return found;
  }
  return null;
}

// ─── SESSION CALCULATION ────────────────────────────────────────────────────
function calculateSession(minutes, ctx) {
  const {
    unlockedSkills: u,
    allBonus, epBonus,
    sessionsCompletedToday,
    currentStreak,
    erasCompleted,
    sessionsInCurrentEra,
    isFirstSessionToday,
    justEnteredNewEra,
    breakCompletedOnTime,
    lastSessionCancelled,
    hasSession45Today,
    hasSession60Today,
    dailyGoalAchieved,
    nextSessionBuffsActive,    // queue: [{type, sessionsRemaining, xpBonus}]
    benVungActive,             // boolean: đã mở Bền Vững vĩnh viễn
    nhipHoanHaoActiveToday,    // boolean
    branchSkillCounts,
  } = ctx;

  // Time bender bỏ
  const effectiveMinutes = minutes;

  // Multiplier tier
  let tier = getMultiplierTier(minutes);
  tier = applyVungDongChay(tier, minutes, !!u.vung_dong_chay);

  // Jackpot — yêu cầu ≥45 (mới)
  const jackpot = u.dai_trung_thuong && minutes >= 45 && rand() < JACKPOT_CHANCE;
  const jackpotMul = jackpot ? JACKPOT_MULTIPLIER : 1;

  // ── Skill bonuses (tách XP / EP / All) ──
  let skillXP = 0;
  let skillEP = 0;
  let skillAll = 0;

  // THIEN_DINH
  if (u.vao_guong && minutes >= VAO_GUONG_MIN) skillXP += VAO_GUONG_XP;
  if (u.chuyen_can && minutes >= CHUYEN_CAN_MIN) skillXP += CHUYEN_CAN_XP;
  if (u.da_tap_trung && sessionsCompletedToday > 0) {
    skillXP += Math.min(sessionsCompletedToday, DA_TAP_TRUNG_MAX) * DA_TAP_TRUNG_PER;
  }
  if (u.tap_trung_sieu_viet && minutes >= TAP_TRUNG_SV_MIN_MIN) {
    skillXP += TAP_TRUNG_SV_XP;
    skillEP += TAP_TRUNG_SV_EP;
  }
  // Siêu Tập Trung: charge-based, sim-time random kích hoạt
  // Để đơn giản: nếu unlocked + phiên ≥45 + 1/N chance trong ngày
  // Bỏ qua sim — quá ít impact (1 phiên/ngày)

  // Y_CHI
  if (u.phuc_hoi && lastSessionCancelled && minutes >= PHUC_HOI_MIN) {
    skillXP += PHUC_HOI_XP;
    skillEP += PHUC_HOI_EP;
  }
  if (u.chuoi_ngay && currentStreak > 0) {
    skillXP += Math.min(currentStreak, CHUOI_NGAY_MAX) * CHUOI_NGAY_PER_DAY;
  }
  if (u.ben_vung && benVungActive && minutes >= BEN_VUNG_MIN) {
    skillAll += BEN_VUNG_PERMANENT;
  }

  // NGHI_NGOI
  if (u.nap_nang_luong && breakCompletedOnTime && minutes >= NAP_NANG_LUONG_MIN) {
    skillXP += NAP_NANG_LUONG_XP;
  }
  if (u.tich_phien && sessionsCompletedToday >= TICH_PHIEN_AFTER) {
    skillXP += TICH_PHIEN_XP;
  }
  if (u.phien_vang_sang && isFirstSessionToday && minutes >= PHIEN_VANG_SANG_MIN) {
    skillXP += PHIEN_VANG_SANG_XP;
    skillEP += PHIEN_VANG_SANG_EP;
  }
  if (u.nhip_sinh_hoc && (sessionsCompletedToday + 1) >= NHIP_SINH_HOC_AFTER && minutes >= NHIP_SINH_HOC_MIN) {
    skillXP += NHIP_SINH_HOC_XP;
  }
  if (u.nhip_hoan_hao && nhipHoanHaoActiveToday && minutes >= NHIP_HOAN_HAO_MIN) {
    skillXP += NHIP_HOAN_HAO_XP;
    skillEP += NHIP_HOAN_HAO_EP;
  }

  // CHIEN_LUOC — pendingBuffs từ mission/chain claims
  if (nextSessionBuffsActive) {
    for (const buff of nextSessionBuffsActive) {
      if (buff.type === 'nguoi_lap_ke' && u.nguoi_lap_ke) skillXP += NGUOI_LAP_KE_XP;
      if (buff.type === 'cu_tri' && u.cu_tri) skillXP += CU_TRI_XP;
    }
  }
  if (u.co_van && dailyGoalAchieved) skillXP += CO_VAN_XP;
  if (u.lich_day && hasSession45Today && hasSession60Today) skillAll += LICH_DAY_ALLBONUS;
  // Bậc Thầy CL — yêu cầu all missions done; sim coi 50% ngày active có all done
  // → skip simplification, tính như +5% XP background nếu unlocked
  if (u.bac_thay_chien_luoc && minutes >= BAC_THAY_CL_MIN) {
    // Sim assumption: 50% các phiên trigger được (tỉ lệ all missions xong)
    if (rand() < 0.50) {
      skillXP += BAC_THAY_CL_XP;
      skillEP += BAC_THAY_CL_EP;
    }
  }

  // THANG_HOA
  if (u.ky_uc_ky_nguyen && justEnteredNewEra && minutes >= KY_UC_KY_NGUYEN_MIN) {
    skillXP += KY_UC_KY_NGUYEN_XP;
    skillEP += KY_UC_KY_NGUYEN_EP;
  }
  if (u.tri_tue_tich_luy && erasCompleted > 0) {
    skillXP += Math.min(erasCompleted, TRI_TUE_TICH_LUY_MAX_ERAS) * TRI_TUE_TICH_LUY_PER_ERA;
  }
  if (u.bac_thay_ky_nguyen && sessionsInCurrentEra > 0) {
    const stacks = Math.floor(sessionsInCurrentEra / BAC_THAY_KY_NGUYEN_SESSIONS);
    skillXP += Math.min(stacks * BAC_THAY_KY_NGUYEN_PER, BAC_THAY_KY_NGUYEN_MAX);
  }

  // Synergies (length-gated)
  let synergyXP = 0;
  for (const syn of SYNERGIES) {
    if (minutes < syn.minLen) continue;
    let active = false;
    if (syn.branch) {
      active = (branchSkillCounts[syn.branch] ?? 0) >= syn.minSkills;
    } else if (syn.branchCount && syn.branchMinSkills) {
      const branchesQualified = Object.values(branchSkillCounts).filter((c) => c >= syn.branchMinSkills).length;
      active = branchesQualified >= syn.branchCount;
    }
    if (active) synergyXP += syn.xpBonus;
  }
  skillXP += synergyXP;

  // Streak bonus XP
  const streakBonusPct = Math.min(currentStreak, STREAK_MAX_BONUS_DAYS) * STREAK_BONUS_PER_DAY;

  // Final factors
  const xpFactor = Math.min(1 + allBonus + skillAll + skillXP, XP_FACTOR_HARD_CAP);
  const epFactor = Math.min(1 + epBonus + allBonus + skillAll + skillEP, EP_FACTOR_HARD_CAP);

  const baseXP = effectiveMinutes * BASE_XP_PER_MINUTE;
  const xpFromSession = Math.round(baseXP * tier * jackpotMul * xpFactor);
  const streakXP = Math.floor(xpFromSession * streakBonusPct);
  const finalXP = xpFromSession + streakXP;

  // Siêu Tập Trung EP boost (charge-based)
  // Đại Trúng Thưởng EP: jackpotMul ×2.0 (vs ×2.5 XP) — đơn giản hoá: dùng cùng jackpotMul
  const epTierVal = getEpTier(minutes);
  const jackpotEpMul = jackpot ? 2.0 : 1; // EP jackpot ×2.0
  const finalEP = Math.round(effectiveMinutes * BASE_EP_PER_MINUTE * epTierVal * jackpotEpMul * epFactor);

  return { finalXP, finalEP, jackpot, tier };
}

// ─── SKILL UNLOCK LOGIC ─────────────────────────────────────────────────────
function tryUnlockSkills(state) {
  let progress = true;
  while (progress) {
    progress = false;
    for (const id of SKILL_UNLOCK_ORDER) {
      if (state.unlockedSkills[id]) continue;
      const node = findSkillByCost(id);
      if (!node) continue;
      if (state.sp < node.cost) continue;
      const reqOk = node.requires.every((r) => state.unlockedSkills[r]);
      if (!reqOk) continue;
      state.unlockedSkills[id] = true;
      state.sp -= node.cost;
      progress = true;
    }
  }
}

function computeBranchSkillCounts(unlockedSkills) {
  const counts = {};
  for (const [branchKey, branch] of Object.entries(SKILL_TREE_NEW)) {
    counts[branchKey] = branch.filter((n) => !!unlockedSkills[n.id]).length;
  }
  return counts;
}

// ─── RANK CHALLENGE & ERA CRISIS ─────────────────────────────────────────────
function tryRankChallenge(state, profile) {
  if (state.daysSinceRankAttempt < profile.rankAttemptInterval) return;
  state.daysSinceRankAttempt = 0;
  const currentBook = state.currentBook;
  const currentRank = state.ranks[currentBook] ?? 0;
  if (currentRank >= 4) return;
  if (rand() < profile.rankSuccessRate) {
    state.ranks[currentBook] = currentRank + 1;
  }
}

function maybeEraCrisis(state, profile) {
  if (rand() < profile.eraCrisisChallengeRate) {
    if (rand() < 0.80) {
      const buffType = rand() < 0.5 ? 'epBonus' : 'allBonus';
      const buffAmt = 0.05;
      state.relicBuffs[buffType] += buffAmt;
    }
  } else {
    state.totalEP = Math.max(0, Math.floor(state.totalEP * 0.95));
  }
}

// ─── MAIN SIMULATION ─────────────────────────────────────────────────────────
function simulate(profileKey, options = {}) {
  const profile = PROFILES[profileKey];
  const maxDays = options.maxDays ?? 1500;

  const state = {
    day: 0,
    totalEP: 0,
    totalEXP: 0,
    level: 0,
    sp: 0,
    sessionsCompleted: 0,
    sessionsInCurrentEra: 0,
    erasCompleted: 0,
    currentBook: 1,
    currentStreak: 0,
    longestStreak: 0,
    daysSinceRankAttempt: 0,
    daysActive: 0,
    daysSkipped: 0,
    minutesTotal: 0,
    sessionsCancelled: 0,
    jackpotsHit: 0,
    benVungUnlocked: false,
    nhipHoanHaoStreakDays: 0,
    nhipHoanHaoActiveToday: false,
    laChanStreakUsedThisWeek: false,
    locBanTangCounter: 0,
    locBanTangRewardsGranted: 0,
    pendingBuffs: [],   // [{type, sessionsRemaining}]
    yesterdaySessionsCount: 0,
    lastWeekStartDay: 1,
    unlockedSkills: {},
    ranks: { 1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,10:0,11:0,12:0,13:0,14:0,15:0 },
    relicBuffs: { epBonus: 0, allBonus: 0 },
    eraReachDay: {},
  };

  for (let day = 1; day <= maxDays; day++) {
    state.day = day;
    state.daysSinceRankAttempt += 1;

    // Week boundary — reset Lá Chắn Streak budget
    if ((day - state.lastWeekStartDay) >= 7) {
      state.lastWeekStartDay = day;
      state.laChanStreakUsedThisWeek = false;
    }

    // Day rollover: check Nhịp Hoàn Hảo
    if (state.yesterdaySessionsCount >= NHIP_HOAN_HAO_SESSIONS_PER_DAY) {
      state.nhipHoanHaoStreakDays += 1;
    } else {
      state.nhipHoanHaoStreakDays = 0;
    }
    state.nhipHoanHaoActiveToday = state.nhipHoanHaoStreakDays >= NHIP_HOAN_HAO_THRESHOLD_DAYS;

    // Skip day?
    const willSkip = rand() < profile.skipDayChance;
    if (willSkip) {
      state.daysSkipped += 1;
      // Lá Chắn Streak: nếu unlocked + chưa dùng tuần này → giữ streak
      if (state.unlockedSkills.la_chan_streak && !state.laChanStreakUsedThisWeek) {
        state.laChanStreakUsedThisWeek = true;
        // Streak không reset
      } else {
        state.currentStreak = 0;
      }
      state.yesterdaySessionsCount = 0;
      continue;
    }

    state.daysActive += 1;
    state.currentStreak += 1;
    if (state.currentStreak > state.longestStreak) state.longestStreak = state.currentStreak;

    // Bền Vững — kích hoạt khi đạt streak ≥30
    if (state.unlockedSkills.ben_vung && state.currentStreak >= BEN_VUNG_STREAK && !state.benVungUnlocked) {
      state.benVungUnlocked = true;
    }

    tryRankChallenge(state, profile);

    const sessionsToday = profile.sessionsPerDay();
    let sessionsCompletedToday = 0;
    let isFirstSessionToday = true;
    let breakCompletedOnTime = true; // assume always done on time
    let lastSessionCancelled = false;
    let hasSession45Today = false;
    let hasSession60Today = false;

    // Daily goal — assume 5 sessions for sim
    const dailyGoal = 5;

    for (let s = 0; s < sessionsToday; s++) {
      const minutes = profile.sessionLength();

      if (rand() < profile.cancelRate) {
        state.sessionsCancelled += 1;
        lastSessionCancelled = true;
        continue;
      }

      const allBonus = RANK_ALLBONUS[state.ranks[state.currentBook] ?? 0] + state.relicBuffs.allBonus;
      const epBonus = state.relicBuffs.epBonus;
      const justEnteredNewEra = state.sessionsInCurrentEra === 0 && state.erasCompleted > 0;
      const branchCounts = computeBranchSkillCounts(state.unlockedSkills);
      const dailyGoalAchieved = (sessionsCompletedToday + 1) >= dailyGoal;

      const result = calculateSession(minutes, {
        unlockedSkills: state.unlockedSkills,
        allBonus, epBonus,
        sessionsCompletedToday,
        currentStreak: state.currentStreak,
        erasCompleted: state.erasCompleted,
        sessionsInCurrentEra: state.sessionsInCurrentEra,
        isFirstSessionToday,
        justEnteredNewEra,
        breakCompletedOnTime,
        lastSessionCancelled,
        hasSession45Today,
        hasSession60Today,
        dailyGoalAchieved,
        nextSessionBuffsActive: state.pendingBuffs,
        benVungActive: state.benVungUnlocked,
        nhipHoanHaoActiveToday: state.nhipHoanHaoActiveToday,
        branchSkillCounts: branchCounts,
      });

      // Decrement pending buffs
      state.pendingBuffs = state.pendingBuffs
        .map((b) => ({ ...b, sessionsRemaining: b.sessionsRemaining - 1 }))
        .filter((b) => b.sessionsRemaining > 0);

      state.totalEP += result.finalEP;
      state.totalEXP += result.finalXP;
      state.minutesTotal += minutes;
      state.sessionsCompleted += 1;
      state.sessionsInCurrentEra += 1;
      sessionsCompletedToday += 1;
      isFirstSessionToday = false;
      lastSessionCancelled = false;
      if (minutes >= LICH_DAY_45_MIN) hasSession45Today = true;
      if (minutes >= LICH_DAY_60_MIN) hasSession60Today = true;
      if (result.jackpot) state.jackpotsHit += 1;

      // Lộc Ban Tặng counter (≥30)
      if (state.unlockedSkills.loc_ban_tang && minutes >= 30) {
        state.locBanTangCounter += 1;
        if (state.locBanTangCounter >= 7) {
          state.locBanTangCounter = 0;
          state.locBanTangRewardsGranted += 1;
          state.totalEXP += 200; // bonus XP grant
          // refined T2 bỏ qua trong sim (không impact EP)
        }
      }

      // Sim trigger Người Lập Kế / Cử Tri occasionally (mock mission completion)
      // Assume mỗi ngày có ~70% có 1 mission claim, 25% có chain step claim
      if (sessionsCompletedToday === 1 && rand() < 0.70 && state.unlockedSkills.nguoi_lap_ke) {
        state.pendingBuffs.push({ type: 'nguoi_lap_ke', sessionsRemaining: 1 });
      }
      if (sessionsCompletedToday === 2 && rand() < 0.25 && state.unlockedSkills.cu_tri) {
        state.pendingBuffs.push({ type: 'cu_tri', sessionsRemaining: CU_TRI_SESSIONS });
      }

      // Level up
      const newLevel = Math.floor(state.totalEXP / EXP_PER_LEVEL);
      if (newLevel > state.level) {
        const gained = newLevel - state.level;
        state.sp += gained * SP_PER_LEVEL;
        state.level = newLevel;
        tryUnlockSkills(state);
      }

      // Era change?
      const newBook = getActiveBook(state.totalEP);
      if (newBook > state.currentBook) {
        state.eraReachDay[newBook] = day;
        state.erasCompleted = newBook - 1;
        state.sessionsInCurrentEra = 0;
        state.currentBook = newBook;
        state.daysSinceRankAttempt = profile.rankAttemptInterval;
        if (newBook < 15) maybeEraCrisis(state, profile);
      }

      if (state.totalEP >= ERA_15_END) {
        return finalize(state, day, profile, profileKey);
      }
    }

    state.yesterdaySessionsCount = sessionsCompletedToday;
  }

  return finalize(state, maxDays, profile, profileKey, true);
}

function finalize(state, day, profile, profileKey, ranOut = false) {
  return {
    profileKey,
    profileLabel: profile.label,
    days: day,
    ranOut,
    daysActive: state.daysActive,
    daysSkipped: state.daysSkipped,
    sessionsCompleted: state.sessionsCompleted,
    sessionsCancelled: state.sessionsCancelled,
    minutesTotal: state.minutesTotal,
    hoursTotal: Math.round(state.minutesTotal / 60),
    avgMinutesPerActiveDay: Math.round(state.minutesTotal / Math.max(state.daysActive, 1)),
    avgEPPerActiveDay: Math.round(state.totalEP / Math.max(state.daysActive, 1)),
    totalEP: state.totalEP,
    totalEXP: state.totalEXP,
    finalLevel: state.level,
    longestStreak: state.longestStreak,
    benVungUnlocked: state.benVungUnlocked,
    locBanTangRewards: state.locBanTangRewardsGranted,
    unlockedSkillCount: Object.keys(state.unlockedSkills).length,
    jackpotsHit: state.jackpotsHit,
    relicBuffs: state.relicBuffs,
    eraReachDay: state.eraReachDay,
  };
}

function runTrials(profileKey, trials = 8) {
  const results = [];
  for (let i = 0; i < trials; i++) {
    results.push(simulate(profileKey));
  }
  const avg = (key) => Math.round(results.reduce((s, r) => s + (r[key] ?? 0), 0) / trials);
  const min = (key) => Math.min(...results.map((r) => r[key] ?? Infinity));
  const max = (key) => Math.max(...results.map((r) => r[key] ?? 0));
  return {
    profileKey,
    profileLabel: results[0].profileLabel,
    trials,
    days: { avg: avg('days'), min: min('days'), max: max('days') },
    daysActive: avg('daysActive'),
    sessions: avg('sessionsCompleted'),
    cancelled: avg('sessionsCancelled'),
    hoursTotal: avg('hoursTotal'),
    avgMinPerActiveDay: avg('avgMinutesPerActiveDay'),
    avgEPPerActiveDay: avg('avgEPPerActiveDay'),
    finalLevel: avg('finalLevel'),
    longestStreak: avg('longestStreak'),
    benVungRate: results.filter((r) => r.benVungUnlocked).length / trials,
    locBanTang: avg('locBanTangRewards'),
    skillCount: avg('unlockedSkillCount'),
    jackpots: avg('jackpotsHit'),
    sample: results[0],
  };
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════════════════');
console.log(' MÔ PHỎNG V2 — BỘ SKILL VIẾT LẠI — CHẠM ERA 15 (111,000 EP)');
console.log('═══════════════════════════════════════════════════════════════════\n');

for (const key of ['CASUAL', 'REGULAR', 'ENGAGED', 'HARDCORE']) {
  const r = runTrials(key, 8);
  const yearsAvg = (r.days.avg / 365).toFixed(2);
  console.log(`▸ ${r.profileLabel}`);
  console.log(`   Ngày để chạm Era 15 end: avg ${r.days.avg}d (${yearsAvg} năm) · min ${r.days.min}d · max ${r.days.max}d`);
  console.log(`   ─ Active: ${r.daysActive}d · Phiên: ${r.sessions} · Cancel: ${r.cancelled} · Giờ: ${r.hoursTotal}h`);
  console.log(`   ─ TB/ngày active: ${r.avgMinPerActiveDay}'/${r.avgEPPerActiveDay} EP · Lvl: ${r.finalLevel} · Skills: ${r.skillCount}`);
  console.log(`   ─ Streak dài nhất: ${r.longestStreak}d · Bền Vững mở: ${(r.benVungRate*100).toFixed(0)}% · Lộc Ban Tặng: ${r.locBanTang} lần · Jackpot: ${r.jackpots}`);
  const sample = r.sample;
  const milestoneStr = [3,6,9,12,15]
    .map((era) => sample.eraReachDay[era] ? `E${era}@${sample.eraReachDay[era]}d` : `E${era}—`)
    .join(' · ');
  console.log(`   ─ Mốc kỷ (1 sample): ${milestoneStr}`);
  console.log('');
}

console.log('───────────────────────────────────────────────────────────────────');
console.log('Nguyên tắc bộ V2:');
console.log('  • Length-based buff yêu cầu ≥30/45/60 phút (không buff phiên 25)');
console.log('  • Streak/mission/count/era bonuses áp dụng mọi phiên (trigger phụ)');
console.log('  • EP_FACTOR_HARD_CAP = 2.5 chặn endgame runaway');
console.log('  • Synergies length-gated (≥30 hoặc ≥45)');
