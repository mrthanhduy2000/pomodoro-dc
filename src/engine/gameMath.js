/**
 * gameMath.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Các hàm tiện ích thuần túy cho mọi tính toán phần thưởng và hình phạt.
 * Không có side-effect, không import từ React hay Zustand.
 * Module này là "động cơ game" xác định có thể test độc lập.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  localDateStr,
  localWeekMondayStr,
  formatVietnamDate,
  getVietnamDateParts,
  getVietnamHour,
  startOfVietnamMonthTs,
  startOfVietnamQuarterTs,
  startOfVietnamYearTs,
} from './time';
import {
  BASE_XP_PER_MINUTE,
  BASE_EP_PER_MINUTE,
  EP_MULTIPLIER_TIERS,
  DEFAULT_DEEP_FOCUS_THRESHOLD,
  DISASTER_MIN_PENALTY_RATE,
  DISASTER_MAX_PENALTY_RATE,
  DISASTER_EVENTS,
  SHARP_TOOLS_RESOURCE_BONUS,
  JACKPOT_CHANCE,
  JACKPOT_MULTIPLIER,
  JACKPOT_EP_MULTIPLIER,
  ERA_1_RESOURCES,
  ERA_THRESHOLDS,
  ERA_METADATA,
  EXP_PER_LEVEL,
  SP_PER_LEVEL,
  // ── Bộ kỹ năng V2 ─────────────────────────────────────────────────────
  // Thiền Định
  VAO_GUONG_MIN_MINUTES,
  VAO_GUONG_XP_BONUS,
  CHUYEN_CAN_MIN_MINUTES,
  CHUYEN_CAN_XP_BONUS,
  DA_TAP_TRUNG_STACK_BONUS,
  DA_TAP_TRUNG_MAX_STACKS,
  VUNG_DONG_CHAY_MIN_MIN,
  TAP_TRUNG_SV_MIN_MIN,
  TAP_TRUNG_SV_XP_BONUS,
  TAP_TRUNG_SV_EP_BONUS,
  SIEU_TAP_TRUNG_MULT,
  SIEU_TAP_TRUNG_EP_MULT,
  SIEU_TAP_TRUNG_MIN_MIN,
  // Ý Chí
  PHUC_HOI_XP_BONUS,
  PHUC_HOI_EP_BONUS,
  PHUC_HOI_MIN_MINUTES,
  CHUOI_NGAY_XP_PER_DAY,
  CHUOI_NGAY_MAX_DAYS,
  BEN_VUNG_PERMANENT_ALLBONUS,
  BEN_VUNG_MIN_MINUTES,
  // Nghỉ Ngơi
  NAP_NANG_LUONG_XP_BONUS,
  NAP_NANG_LUONG_MIN_MINUTES,
  TICH_PHIEN_AFTER_SESSIONS,
  TICH_PHIEN_XP_BONUS,
  PHIEN_VANG_SANG_XP_BONUS,
  PHIEN_VANG_SANG_EP_BONUS,
  PHIEN_VANG_SANG_MIN_MINUTES,
  NHIP_SINH_HOC_MIN_SESSIONS,
  NHIP_SINH_HOC_XP_BONUS,
  NHIP_SINH_HOC_MIN_MINUTES,
  NHIP_HOAN_HAO_XP_BONUS,
  NHIP_HOAN_HAO_EP_BONUS,
  NHIP_HOAN_HAO_MIN_MINUTES,
  // Vận May
  BAN_TAY_VANG_RAW_CHANCE,
  BAN_TAY_VANG_MIN_MINUTES,
  NHAN_QUAN_REFINED_CHANCE,
  NHAN_QUAN_MIN_MINUTES,
  LINH_CAM_REFINED_CHANCE,
  LINH_CAM_DOUBLE_CHANCE,
  LINH_CAM_MIN_MINUTES,
  DAI_TRUNG_THUONG_MIN_MINUTES,
  SO_DO_TRIGGER_CHANCE,
  SO_DO_MULTIPLIER,
  SO_DO_MIN_MINUTES,
  // Chiến Lược
  NGUOI_LAP_KE_XP_BONUS,
  CU_TRI_XP_BONUS,
  CO_VAN_XP_BONUS,
  LICH_DAY_ALLBONUS,
  KE_HOACH_HOAN_HAO_NEXT_WEEK_BONUS,
  BAC_THAY_CHIEN_LUOC_XP_BONUS,
  BAC_THAY_CHIEN_LUOC_RP_BONUS,
  BAC_THAY_CHIEN_LUOC_EP_BONUS,
  BAC_THAY_CHIEN_LUOC_MIN_MIN,
  // Thăng Hoa
  KY_UC_KY_NGUYEN_XP_BONUS,
  KY_UC_KY_NGUYEN_EP_BONUS,
  KY_UC_KY_NGUYEN_MIN_MINUTES,
  TRI_TUE_TICH_LUY_XP_PER_ERA,
  TRI_TUE_TICH_LUY_MAX_ERAS,
  BAC_THAY_KY_NGUYEN_SESSIONS,
  BAC_THAY_KY_NGUYEN_BONUS,
  BAC_THAY_KY_NGUYEN_MAX,
  XP_FACTOR_HARD_CAP,
  EP_FACTOR_HARD_CAP,
  SKILL_TREE,
  SKILL_SYNERGIES,
  // Hệ thống nghiên cứu & nguyên liệu tinh luyện
  RP_PER_MINUTE_BASE,
  RP_CATEGORY_MULT,
  T2_DROP_THRESHOLD_MIN,
  T2_DROP_AMOUNT,
  COMBO_DECAY_MS,
  BO_NHO_CO_BAP_COMBO_HOURS,
  RELIC_EVOLUTION,
  // Deprecated (giữ để backward compat trong cancel disaster + signature)
  Y_CHI_THEP_RETENTION,
  BAT_KHUAT_DISASTER_XP_PENALTY,
  TIME_BENDER_CHANCE,
  WARMUP_REDUCED_THRESHOLD,
  DA_NANG_RESOURCE_BONUS,
  CAN_BANG_RESOURCE_BONUS,
  STREAK_MILESTONES,
} from './constants';

// ─── Hàm ngẫu nhiên ──────────────────────────────────────────────────────────
const rand    = () => Math.random();
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

// ─── Xác định Quyển đang chơi từ tổng EP ─────────────────────────────────────
export function getActiveBook(totalEP) {
  const t = ERA_THRESHOLDS;
  if (totalEP < t.ERA_1_END)  return 1;
  if (totalEP < t.ERA_2_END)  return 2;
  if (totalEP < t.ERA_3_END)  return 3;
  if (totalEP < t.ERA_4_END)  return 4;
  if (totalEP < t.ERA_5_END)  return 5;
  if (totalEP < t.ERA_6_END)  return 6;
  if (totalEP < t.ERA_7_END)  return 7;
  if (totalEP < t.ERA_8_END)  return 8;
  if (totalEP < t.ERA_9_END)  return 9;
  if (totalEP < t.ERA_10_END) return 10;
  if (totalEP < t.ERA_11_END) return 11;
  if (totalEP < t.ERA_12_END) return 12;
  if (totalEP < t.ERA_13_END) return 13;
  if (totalEP < t.ERA_14_END) return 14;
  return 15;
}

export function getActiveResources(totalEP) {
  const book = getActiveBook(totalEP);
  return ERA_METADATA[book]?.resources ?? ERA_1_RESOURCES;
}

export function getComboDecayMs(unlockedSkills = {}, relics = [], relicEvolutions = {}) {
  const relicComboHours = (relics ?? []).reduce((acc, relic) => {
    const stage = relicEvolutions?.[relic.id] ?? 0;
    const evoDef = RELIC_EVOLUTION[relic.id];
    const buff = evoDef?.stages?.[stage]?.buff ?? relic.buff ?? {};
    return acc + (buff.comboWindowHours ?? 0);
  }, 0);

  const baseComboDecayMs = unlockedSkills.bo_nho_co_bap
    ? BO_NHO_CO_BAP_COMBO_HOURS * 3_600_000
    : COMBO_DECAY_MS;

  return baseComboDecayMs + (relicComboHours * 3_600_000);
}

// ─── Bậc Hệ Số Nhân Tập Trung Sâu ────────────────────────────────────────────
/**
 * getMultiplierTier
 * Theo đặc tả hiện tại: 1–25 phút = ×1.0, 26–59 phút = ×1.3, 60+ phút = ×2.0.
 * Kỹ năng "Khởi Động Nhanh" kéo ngưỡng ×1.3 xuống 20 phút.
 *
 * @param {number}  minutesFocused
 * @param {boolean} lamNongNhanhUnlocked
 * @returns {{ multiplier, chestGuaranteed, tierLabel }}
 */
export function getMultiplierTier(minutesFocused, lamNongNhanhUnlocked = false) {
  const deepFocusStart = lamNongNhanhUnlocked
    ? WARMUP_REDUCED_THRESHOLD          // 20 phút (kỹ năng Khởi Động Nhanh)
    : DEFAULT_DEEP_FOCUS_THRESHOLD;     // 26 phút (mặc định)

  if (minutesFocused >= 60) {
    return { multiplier: 2.0, chestGuaranteed: true,  tierLabel: 'Phiên Chuyên Sâu ×2.0' };
  }
  if (minutesFocused >= deepFocusStart) {
    return { multiplier: 1.3, chestGuaranteed: false, tierLabel: 'Tập Trung Sâu ×1.3' };
  }
  return { multiplier: 1.0, chestGuaranteed: false, tierLabel: 'Tiêu Chuẩn ×1.0' };
}

function getTierLabel(multiplier) {
  if (multiplier >= 2.0) return 'Phiên Chuyên Sâu ×2.0';
  if (multiplier >= 1.3) return 'Tập Trung Sâu ×1.3';
  return 'Tiêu Chuẩn ×1.0';
}

// EP dùng để đo tiến độ một vòng chơi.
// XP buff không đi thẳng vào EP; EP chỉ tăng theo thời lượng hiệu lực và buff tiến độ vĩnh viễn.
function getProgressEpMultiplier(minutesFocused) {
  if (minutesFocused >= 60) return EP_MULTIPLIER_TIERS[2].multiplier;
  if (minutesFocused >= DEFAULT_DEEP_FOCUS_THRESHOLD) return EP_MULTIPLIER_TIERS[1].multiplier;
  return EP_MULTIPLIER_TIERS[0].multiplier;
}

// ─── Kỹ Năng Bẻ Cong Thời Gian ───────────────────────────────────────────────
export function applyTimeBender(minutesFocused, timeBenderUnlocked = false) {
  if (!timeBenderUnlocked) return { effectiveMinutes: minutesFocused, bonusMinutes: 0 };

  let bonusMinutes = 0;
  for (let i = 0; i < minutesFocused; i++) {
    if (rand() < TIME_BENDER_CHANCE) bonusMinutes += 1;
  }
  return { effectiveMinutes: minutesFocused + bonusMinutes, bonusMinutes };
}

// ─── Lăn tài nguyên cho một loại ─────────────────────────────────────────────
function rollResourceDrop(resourceDef, effectiveMinutes, resourceMultiplier) {
  let total = 0;
  for (let i = 0; i < effectiveMinutes; i++) {
    total += randInt(resourceDef.minPerMin, resourceDef.maxPerMin);
  }
  return Math.round(total * resourceMultiplier);
}

// ─────────────────────────────────────────────────────────────────────────────
// HÀM CHÍNH: calculateRewards
// ─────────────────────────────────────────────────────────────────────────────
/**
 * calculateRewards
 * Tính toàn bộ phần thưởng cuối phiên. Áp dụng 36 kỹ năng mới qua sessionCtx.
 *
 * @param {number}  minutesFocused
 * @param {object}  unlockedSkills
 * @param {number}  totalEP
 * @param {object}  activeBuffs        - từ aggregateActiveBuffs()
 * @param {object}  sessionCtx         - context kỹ năng tính theo ngày/chuỗi
 */
export function calculateRewards(
  minutesFocused,
  unlockedSkills = {},
  totalEP = 0,
  activeBuffs = {},
  sessionCtx = {},
) {
  // ── Giải nén kỹ năng V2 ───────────────────────────────────────────────────
  const {
    // Backward compat (skills cũ — luôn false sau migration)
    luoi_ria_ben:        luoiRiaBen         = false,
    // THIỀN ĐỊNH
    vao_guong:           vaoGuong           = false,
    chuyen_can:          chuyenCan          = false,
    da_tap_trung:        daTapTrung         = false,
    vung_dong_chay:      vungDongChay       = false,
    tap_trung_sieu_viet: tapTrungSieuViet   = false,
    sieu_tap_trung:      sieuTapTrung       = false,
    // Ý CHÍ
    phuc_hoi:            phucHoi            = false,
    chuoi_ngay:          chuoiNgay          = false,
    ben_vung:            benVung            = false,
    // NGHỈ NGƠI
    nap_nang_luong:      napNangLuong       = false,
    tich_phien:          tichPhien          = false,
    phien_vang_sang:     phienVangSang      = false,
    nhip_sinh_hoc:       nhipSinhHoc        = false,
    nhip_hoan_hao:       nhipHoanHao        = false,
    // VẬN MAY
    ban_tay_vang:        banTayVang         = false,
    nhan_quan:           nhanQuan           = false,
    linh_cam:            linhCam            = false,
    dai_trung_thuong:    daiTrungThuong     = false,
    so_do:               soDo               = false,
    // CHIẾN LƯỢC
    nguoi_lap_ke:        nguoiLapKe         = false,
    cu_tri:              cuTri              = false,
    co_van:              coVan              = false,
    lich_day:            lichDay            = false,
    bac_thay_chien_luoc: bacThayCL          = false,
    // THĂNG HOA
    ky_uc_ky_nguyen:     kyUcKyNguyen       = false,
    tri_tue_tich_luy:    triTueTichLuy      = false,
    bac_thay_ky_nguyen:  bacThayKyNguyen    = false,
  } = unlockedSkills;

  // ── Buff từ Danh Xưng / Di Vật ────────────────────────────────────────────
  const {
    epBonus       = 0,
    expBonus      = 0,
    resourceBonus = 0,
    allBonus      = 0,
    gachaBonus    = 0,
    pitySeal      = 0,
    xpSeal        = 0,
  } = activeBuffs;

  // ── Session context V2 ────────────────────────────────────────────────────
  const {
    // Phổ biến
    consecutiveSessionsToday  = 0,
    superFocusActive          = false,
    luckyModeActive           = false,
    breakCompletedOnTime      = false,
    isFirstSessionToday       = false,
    sessionsCompletedToday    = 0,
    currentStreak             = 0,
    lastSessionCancelled      = false,
    isFirstSessionInNewEra    = false,
    erasCompleted             = 0,
    sessionsInCurrentEra      = 0,
    allDailyMissionsDone      = false,
    isNewCategoryToday        = false,
    wonderRPBonus             = 0,
    // V2 mới
    benVungActive             = false, // player.benVungUnlocked
    nhipHoanHaoActiveToday    = false, // dailyTracking.nhipHoanHaoBonusActive
    hasSession45Today         = false, // dailyTracking.hasSession45
    hasSession60Today         = false, // dailyTracking.hasSession60
    dailyGoalAchieved         = false, // settings + count check
    nextSessionBuffs          = [],    // [{type:'nguoi_lap_ke'|'cu_tri', sessionsRemaining}]
    keHoachWeeklyBuffActive   = false, // tuần kế nhận +10% allBonus
  } = sessionCtx;

  // ── 1. Bộ kỹ năng V2 không có Bẻ Cong Thời Gian → effectiveMinutes = minutes
  const effectiveMinutes = minutesFocused;
  const bonusMinutes = 0;

  // ── 2. XP cơ bản ─────────────────────────────────────────────────────────
  const baseXP = effectiveMinutes * BASE_XP_PER_MINUTE;

  // ── 3. Hệ số nhân bậc tập trung (không còn warmup, dùng default 26') ────
  let { multiplier, chestGuaranteed, tierLabel } = getMultiplierTier(minutesFocused, false);

  // Vùng Dòng Chảy: phiên ≥45' → tăng 1 bậc
  if (vungDongChay && minutesFocused >= VUNG_DONG_CHAY_MIN_MIN) {
    if (multiplier < 1.3) {
      multiplier = 1.3;
    } else if (multiplier < 2.0) {
      multiplier = 2.0;
      chestGuaranteed = true;
    }
    tierLabel = getTierLabel(multiplier);
  }

  // ── 4. Jackpot — yêu cầu ≥45' (V2) ───────────────────────────────────────
  const jackpotTriggered = daiTrungThuong
    && minutesFocused >= DAI_TRUNG_THUONG_MIN_MINUTES
    && rand() < JACKPOT_CHANCE;
  const jackpotXpFactor = jackpotTriggered ? JACKPOT_MULTIPLIER : 1;
  const jackpotEpFactor = jackpotTriggered ? JACKPOT_EP_MULTIPLIER : 1;
  const finalMultiplier  = multiplier * jackpotXpFactor;

  // ── 5. Bonus từ kỹ năng — tách XP / EP / All ────────────────────────────
  let skillXPBonus = 0;        // XP only
  let skillEPBonus = 0;        // EP only
  let skillAllBonus = 0;       // both XP và EP
  let skillResourceBonus = 0;  // raw resources
  let skillRPBonus = 0;        // RP
  let extraRefined = 0;
  let extraRawDrop = 0;        // Bàn Tay Vàng

  // — THIỀN ĐỊNH —
  if (vaoGuong && minutesFocused >= VAO_GUONG_MIN_MINUTES) {
    skillXPBonus += VAO_GUONG_XP_BONUS;
  }
  if (chuyenCan && minutesFocused >= CHUYEN_CAN_MIN_MINUTES) {
    skillXPBonus += CHUYEN_CAN_XP_BONUS;
  }
  if (daTapTrung && consecutiveSessionsToday > 0) {
    skillXPBonus += Math.min(consecutiveSessionsToday, DA_TAP_TRUNG_MAX_STACKS) * DA_TAP_TRUNG_STACK_BONUS;
  }
  if (tapTrungSieuViet && minutesFocused >= TAP_TRUNG_SV_MIN_MIN) {
    skillXPBonus += TAP_TRUNG_SV_XP_BONUS;
    skillEPBonus += TAP_TRUNG_SV_EP_BONUS;
    chestGuaranteed = true;
  }

  // — Ý CHÍ —
  if (phucHoi && lastSessionCancelled && minutesFocused >= PHUC_HOI_MIN_MINUTES) {
    skillXPBonus += PHUC_HOI_XP_BONUS;
    skillEPBonus += PHUC_HOI_EP_BONUS;
  }
  if (chuoiNgay && currentStreak > 0) {
    // Chuỗi Ngày là streak-based (trigger phụ) — áp dụng mọi phiên
    skillXPBonus += Math.min(currentStreak, CHUOI_NGAY_MAX_DAYS) * CHUOI_NGAY_XP_PER_DAY;
  }
  if (benVung && benVungActive && minutesFocused >= BEN_VUNG_MIN_MINUTES) {
    skillAllBonus += BEN_VUNG_PERMANENT_ALLBONUS;
  }

  // — NGHỈ NGƠI —
  if (napNangLuong && breakCompletedOnTime && minutesFocused >= NAP_NANG_LUONG_MIN_MINUTES) {
    skillXPBonus += NAP_NANG_LUONG_XP_BONUS;
  }
  if (tichPhien && sessionsCompletedToday >= TICH_PHIEN_AFTER_SESSIONS) {
    skillXPBonus += TICH_PHIEN_XP_BONUS;
  }
  if (phienVangSang && isFirstSessionToday && minutesFocused >= PHIEN_VANG_SANG_MIN_MINUTES) {
    skillXPBonus += PHIEN_VANG_SANG_XP_BONUS;
    skillEPBonus += PHIEN_VANG_SANG_EP_BONUS;
  }
  if (nhipSinhHoc
      && (sessionsCompletedToday + 1) >= NHIP_SINH_HOC_MIN_SESSIONS
      && minutesFocused >= NHIP_SINH_HOC_MIN_MINUTES) {
    skillXPBonus += NHIP_SINH_HOC_XP_BONUS;
  }
  if (nhipHoanHao && nhipHoanHaoActiveToday && minutesFocused >= NHIP_HOAN_HAO_MIN_MINUTES) {
    skillXPBonus += NHIP_HOAN_HAO_XP_BONUS;
    skillEPBonus += NHIP_HOAN_HAO_EP_BONUS;
  }

  // — VẬN MAY —
  if (banTayVang && minutesFocused >= BAN_TAY_VANG_MIN_MINUTES && rand() < BAN_TAY_VANG_RAW_CHANCE) {
    extraRawDrop += 1;
  }
  if (nhanQuan && minutesFocused >= NHAN_QUAN_MIN_MINUTES && rand() < NHAN_QUAN_REFINED_CHANCE) {
    extraRefined += 1;
  }
  if (linhCam && minutesFocused >= LINH_CAM_MIN_MINUTES) {
    if (rand() < LINH_CAM_REFINED_CHANCE) extraRefined += 1;
    if (rand() < LINH_CAM_DOUBLE_CHANCE) extraRefined += 1;
  }
  // Lộc Ban Tặng: counter handled by store, không cộng vào reward ở đây.

  // — CHIẾN LƯỢC —
  // Pending buffs từ mission/chain claims (Người Lập Kế / Cử Tri)
  if (Array.isArray(nextSessionBuffs)) {
    for (const buff of nextSessionBuffs) {
      if (buff?.type === 'nguoi_lap_ke' && nguoiLapKe) {
        skillXPBonus += NGUOI_LAP_KE_XP_BONUS;
      }
      if (buff?.type === 'cu_tri' && cuTri) {
        skillXPBonus += CU_TRI_XP_BONUS;
      }
    }
  }
  if (coVan && dailyGoalAchieved) {
    skillXPBonus += CO_VAN_XP_BONUS;
  }
  if (lichDay && hasSession45Today && hasSession60Today) {
    skillAllBonus += LICH_DAY_ALLBONUS;
  }
  if (bacThayCL && allDailyMissionsDone && minutesFocused >= BAC_THAY_CHIEN_LUOC_MIN_MIN) {
    skillXPBonus += BAC_THAY_CHIEN_LUOC_XP_BONUS;
    skillRPBonus += BAC_THAY_CHIEN_LUOC_RP_BONUS;
    skillEPBonus += BAC_THAY_CHIEN_LUOC_EP_BONUS;
  }
  if (keHoachWeeklyBuffActive) {
    skillAllBonus += KE_HOACH_HOAN_HAO_NEXT_WEEK_BONUS;
  }

  // — THĂNG HOA —
  if (kyUcKyNguyen && isFirstSessionInNewEra && minutesFocused >= KY_UC_KY_NGUYEN_MIN_MINUTES) {
    skillXPBonus += KY_UC_KY_NGUYEN_XP_BONUS;
    skillEPBonus += KY_UC_KY_NGUYEN_EP_BONUS;
  }
  if (triTueTichLuy && erasCompleted > 0) {
    // Trí Tuệ Tích Luỹ là era-based (trigger phụ) — áp dụng mọi phiên
    skillXPBonus += Math.min(erasCompleted, TRI_TUE_TICH_LUY_MAX_ERAS) * TRI_TUE_TICH_LUY_XP_PER_ERA;
  }
  if (bacThayKyNguyen && sessionsInCurrentEra > 0) {
    const stacks = Math.floor(sessionsInCurrentEra / BAC_THAY_KY_NGUYEN_SESSIONS);
    skillXPBonus += Math.min(stacks * BAC_THAY_KY_NGUYEN_BONUS, BAC_THAY_KY_NGUYEN_MAX);
  }

  // ── 5b. Synergy bonus V2 (length-gated) ─────────────────────────────────
  const branchCounts = {};
  for (const [branchKey, branch] of Object.entries(SKILL_TREE)) {
    branchCounts[branchKey] = branch.nodes.filter((n) => !!unlockedSkills[n.id]).length;
  }
  let synergyBonus = 0;
  const activeSynergies = [];
  for (const syn of SKILL_SYNERGIES) {
    // Length gate
    if (Number.isFinite(syn.minLengthMin) && minutesFocused < syn.minLengthMin) continue;

    let active = false;
    if (syn.requiresBranchCount) {
      const { branchCount, branchMinSkills } = syn.requiresBranchCount;
      const qualified = Object.values(branchCounts).filter((c) => c >= branchMinSkills).length;
      active = qualified >= branchCount;
    } else if (syn.requires) {
      active = Object.entries(syn.requires).every(
        ([branch, minCount]) => (branchCounts[branch] ?? 0) >= minCount
      );
    }
    if (active) {
      synergyBonus += syn.bonus;
      activeSynergies.push(syn.id);
    }
  }
  skillXPBonus += synergyBonus;

  // ── 6. Tổng hợp modifier XP / EP ─────────────────────────────────────────
  // skillAllBonus áp dụng cả XP và EP
  // skillXPBonus chỉ XP, skillEPBonus chỉ EP
  const rawXpFactor = 1 + expBonus + allBonus + skillAllBonus + skillXPBonus + xpSeal;
  const xpFactor = Math.min(rawXpFactor, XP_FACTOR_HARD_CAP);
  const rawEpFactor = 1 + epBonus + allBonus + skillAllBonus + skillEPBonus;
  const epFactor = Math.min(rawEpFactor, EP_FACTOR_HARD_CAP);

  // ── 7. XP cuối ───────────────────────────────────────────────────────────
  let finalXP = Math.round(baseXP * finalMultiplier * xpFactor);

  // Siêu Tập Trung: yêu cầu phiên ≥45' (V2)
  const sieuTapTrungActive = superFocusActive && sieuTapTrung && minutesFocused >= SIEU_TAP_TRUNG_MIN_MIN;
  if (sieuTapTrungActive) {
    finalXP = Math.round(finalXP * SIEU_TAP_TRUNG_MULT);
  }

  // Số Đỏ: yêu cầu phiên ≥45' (V2)
  const luckyBurstTriggered = luckyModeActive
    && soDo
    && minutesFocused >= SO_DO_MIN_MINUTES
    && rand() < SO_DO_TRIGGER_CHANCE;
  if (luckyBurstTriggered) {
    finalXP = Math.round(finalXP * SO_DO_MULTIPLIER);
  }

  const progressEpMultiplier = getProgressEpMultiplier(minutesFocused);
  let finalEP = Math.round(effectiveMinutes * BASE_EP_PER_MINUTE * progressEpMultiplier * jackpotEpFactor * epFactor);
  // Siêu Tập Trung EP boost
  if (sieuTapTrungActive) {
    finalEP = Math.round(finalEP * SIEU_TAP_TRUNG_EP_MULT);
  }
  // Số Đỏ cũng buff EP (V2)
  if (luckyBurstTriggered) {
    finalEP = Math.round(finalEP * SO_DO_MULTIPLIER);
  }
  const finalEXP = finalXP;

  // ── 8. Tài nguyên ────────────────────────────────────────────────────────
  const activeBook      = getActiveBook(totalEP);
  const activeResources = getActiveResources(totalEP);
  const resMul = finalMultiplier
    * (luoiRiaBen ? (1 + SHARP_TOOLS_RESOURCE_BONUS) : 1)
    * (1 + resourceBonus + allBonus + skillResourceBonus + skillAllBonus);

  const resources = {};
  for (const resDef of activeResources) {
    const amount = rollResourceDrop(resDef, effectiveMinutes, resMul);
    resources[resDef.id] = luckyBurstTriggered
      ? Math.round(amount * SO_DO_MULTIPLIER)
      : amount;
  }
  // Bàn Tay Vàng: +1 random raw resource
  if (extraRawDrop > 0 && activeResources.length > 0) {
    const pickIdx = Math.floor(rand() * activeResources.length);
    const pickedId = activeResources[pickIdx]?.id;
    if (pickedId) {
      resources[pickedId] = (resources[pickedId] ?? 0) + extraRawDrop;
    }
  }

  // ── 9. Điểm Nghiên Cứu (RP) ───────────────────────────────────────────────
  const categoryMult = isNewCategoryToday ? RP_CATEGORY_MULT : 1.0;
  const researchBonus = skillRPBonus + (gachaBonus / 100) + (pitySeal * 0.02);
  let rpEarned = Math.round(
    effectiveMinutes * RP_PER_MINUTE_BASE * categoryMult * jackpotXpFactor * (1 + wonderRPBonus + researchBonus),
  );
  if (luckyBurstTriggered) {
    rpEarned = Math.round(rpEarned * SO_DO_MULTIPLIER);
  }

  // ── 10. Tài nguyên tinh luyện ─────────────────────────────────────────────
  const t2Drop = (minutesFocused >= T2_DROP_THRESHOLD_MIN ? T2_DROP_AMOUNT : 0) + extraRefined;

  return {
    baseXP,
    finalXP,
    finalEP,
    finalEXP,
    multiplier: finalMultiplier,
    tierLabel: jackpotTriggered ? `ĐẠI TRÚNG THƯỞNG! ${tierLabel}` : tierLabel,
    effectiveMinutes,
    bonusMinutes,
    jackpotTriggered,
    luckyBurstTriggered,
    largeChest:       chestGuaranteed,
    resources,
    activeBook,
    rpEarned,
    t2Drop,
    activeSynergies,
    synergyBonus,
  };
}

/**
 * calculateSessionResourceFloor
 * Ước lượng mức tài nguyên tối thiểu mà một session đã tích lũy được tới thời
 * điểm hiện tại, chỉ dùng các yếu tố xác định được và bỏ qua mọi bonus ngẫu
 * nhiên. Hàm này được dùng để cap thất thoát khi hủy session, để mức phạt không
 * thể vượt quá phần session đang chạy chắc chắn đã tạo ra.
 *
 * @param {number} minutesFocused
 * @param {object} unlockedSkills
 * @param {number} totalEP
 * @param {object} activeBuffs
 * @param {object} sessionCtx
 * @returns {{ activeBook: number, resources: object, effectiveMinutes: number, resourceMultiplier: number }}
 */
export function calculateSessionResourceFloor(
  minutesFocused,
  unlockedSkills = {},
  totalEP = 0,
  activeBuffs = {},
  sessionCtx = {},
) {
  const clampedMinutes = Math.max(0, Math.floor(minutesFocused ?? 0));
  const {
    lam_nong_nhanh:    lamNongNhanhLegacy = false,
    luoi_ria_ben:      luoiRiaBen         = false,
    khoi_dong_nhanh:   khoiDongNhanh      = false,
    vung_dong_chay:    vungDongChay       = false,
    da_nang:           daNang             = false,
    can_bang:          canBang            = false,
  } = unlockedSkills;

  const warmupActive = khoiDongNhanh || lamNongNhanhLegacy;
  const {
    resourceBonus = 0,
    allBonus = 0,
  } = activeBuffs;
  const {
    diverseCategoriesBonus = false,
    balancedDayBonus = false,
    benVungActive = false,
    hasSession45Today = false,
    hasSession60Today = false,
    keHoachWeeklyBuffActive = false,
  } = sessionCtx;

  let { multiplier } = getMultiplierTier(clampedMinutes, warmupActive);
  if (vungDongChay && clampedMinutes >= VUNG_DONG_CHAY_MIN_MIN) {
    if (multiplier < 1.3) {
      multiplier = 1.3;
    } else if (multiplier < 2.0) {
      multiplier = 2.0;
    }
  }

  let skillAllBonus = 0;
  let skillResourceBonus = 0;
  if (daNang && diverseCategoriesBonus) {
    skillResourceBonus += DA_NANG_RESOURCE_BONUS;
  }
  if (canBang && balancedDayBonus) {
    skillResourceBonus += CAN_BANG_RESOURCE_BONUS;
  }
  if (unlockedSkills.ben_vung && benVungActive && clampedMinutes >= BEN_VUNG_MIN_MINUTES) {
    skillAllBonus += BEN_VUNG_PERMANENT_ALLBONUS;
  }
  if (unlockedSkills.lich_day && hasSession45Today && hasSession60Today) {
    skillAllBonus += LICH_DAY_ALLBONUS;
  }
  if (keHoachWeeklyBuffActive) {
    skillAllBonus += KE_HOACH_HOAN_HAO_NEXT_WEEK_BONUS;
  }

  const activeBook = getActiveBook(totalEP);
  const activeResources = getActiveResources(totalEP);
  const resourceMultiplier = multiplier
    * (luoiRiaBen ? (1 + SHARP_TOOLS_RESOURCE_BONUS) : 1)
    * (1 + resourceBonus + allBonus + skillResourceBonus + skillAllBonus);
  const resources = {};

  for (const resourceDef of activeResources) {
    const guaranteedTotal = clampedMinutes * resourceDef.minPerMin;
    resources[resourceDef.id] = Math.max(0, Math.round(guaranteedTotal * resourceMultiplier));
  }

  return {
    activeBook,
    resources,
    effectiveMinutes: clampedMinutes,
    resourceMultiplier,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HÀM CHÍNH: applyDisasterPenalty
// ─────────────────────────────────────────────────────────────────────────────
/**
 * applyDisasterPenalty
 * Hủy Pomodoro trong Chế Độ Nghiêm:
 * - random mức phạt gốc 1%–5%
 * - nhân với tiến độ đã đi qua của phiên
 * - Kỹ năng "Sự Tha Thứ": nếu còn lượt miễn phạt thì bỏ qua penalty
 *
 * @param {object} allResources
 * @param {object} unlockedSkills
 * @param {number} forgivenessChargesRemaining
 * @param {number} progressRatio
 * @param {object} options
 * @returns {PenaltyResult}
 */
export function applyDisasterPenalty(
  allResources,
  unlockedSkills = {},
  forgivenessChargesRemaining = 0,
  disasterReduction = 0,
  progressRatio = 1,
  penaltyMultiplier = 1,
  options = {},
) {
  const {
    su_tha_thu: suThatThu = false,
    y_chi_thep: yChiThep = false,
    bat_khuat: batKhuat = false,
  } = unlockedSkills;
  const {
    scopeBookKey = null,
    resourceLossCap = null,
  } = options;

  const disaster = DISASTER_EVENTS[randInt(0, DISASTER_EVENTS.length - 1)];
  const clampedProgressRatio = Math.max(0, Math.min(1, progressRatio));

  if (suThatThu && forgivenessChargesRemaining > 0) {
    return {
      waived: true, chargeConsumed: true,
      newResources: structuredClone(allResources),
      deducted: {},
      disaster,
      progressRatio: clampedProgressRatio,
      basePenaltyRate: null,
      adjustedPenaltyRate: null,
      appliedPenaltyRate: 0,
    };
  }

  const basePenaltyRate = DISASTER_MIN_PENALTY_RATE + rand() * (DISASTER_MAX_PENALTY_RATE - DISASTER_MIN_PENALTY_RATE);
  const adjustedPenaltyRate = Math.max(DISASTER_MIN_PENALTY_RATE, basePenaltyRate - disasterReduction);
  const skillPenaltyMultiplier = batKhuat
    ? BAT_KHUAT_DISASTER_XP_PENALTY
    : yChiThep
      ? (1 - Y_CHI_THEP_RETENTION)
      : 1;
  const appliedPenaltyRate = adjustedPenaltyRate * skillPenaltyMultiplier * clampedProgressRatio * Math.max(0, penaltyMultiplier);

  const newResources = structuredClone(allResources);
  const deducted     = {};

  for (const [bookKey, bookResources] of Object.entries(newResources)) {
    deducted[bookKey] = {};
    for (const [resId, amount] of Object.entries(bookResources)) {
      const shouldApplyPenalty = !scopeBookKey || scopeBookKey === bookKey;
      const uncappedLoss = shouldApplyPenalty
        ? Math.floor(amount * appliedPenaltyRate)
        : 0;
      const resourceCap = resourceLossCap?.[bookKey]?.[resId];
      const loss = Number.isFinite(resourceCap)
        ? Math.min(uncappedLoss, Math.max(0, Math.floor(resourceCap)))
        : uncappedLoss;
      newResources[bookKey][resId] = amount - loss;
      deducted[bookKey][resId]     = loss;
    }
  }

  return {
    waived: false,
    chargeConsumed: false,
    newResources,
    deducted,
    disaster,
    progressRatio: clampedProgressRatio,
    basePenaltyRate,
    adjustedPenaltyRate,
    appliedPenaltyRate,
    skillPenaltyMultiplier,
    skillMode: batKhuat ? 'bat_khuat' : yChiThep ? 'y_chi_thep' : 'default',
  };
}

// ─── Tính lên cấp ─────────────────────────────────────────────────────────────
export function computeLevelUps(prevTotalEXP, gainedEXP) {
  const newTotalEXP  = prevTotalEXP + gainedEXP;
  const prevLevel    = Math.floor(prevTotalEXP / EXP_PER_LEVEL);
  const newLevel     = Math.floor(newTotalEXP  / EXP_PER_LEVEL);
  const levelsGained = newLevel - prevLevel;
  const spGained     = levelsGained * SP_PER_LEVEL;
  return { newLevel, newTotalEXP, levelsGained, spGained };
}

export function getLevelProgress(totalEXP) {
  const level           = Math.floor(totalEXP / EXP_PER_LEVEL);
  const currentLevelEXP = totalEXP % EXP_PER_LEVEL;
  const nextLevelEXP    = EXP_PER_LEVEL;
  const progressPct     = (currentLevelEXP / nextLevelEXP) * 100;
  return { level, currentLevelEXP, nextLevelEXP, progressPct };
}

export const HISTORY_ENTRY_STATUS = {
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export function isCancelledHistoryEntry(entry) {
  return entry?.status === HISTORY_ENTRY_STATUS.CANCELLED
    || entry?.cancelled === true
    || (entry?.completed === false && Boolean(entry?.cancelledAt));
}

// ─────────────────────────────────────────────────────────────────────────────
// GỢI Ý ĐỘ DÀI PHIÊN — học từ chính lịch sử của người dùng theo buổi trong ngày
// ─────────────────────────────────────────────────────────────────────────────

// Cần ít nhất bấy nhiêu phiên "thành công" trong buổi mới đủ tự tin để gợi ý.
export const SESSION_SUGGESTION_MIN_SAMPLE = 3;

export const TIME_OF_DAY_BUCKETS = [
  { id: 'sang',  label: 'buổi sáng',  startHour: 5,  endHour: 11 },
  { id: 'trua',  label: 'buổi trưa',  startHour: 11, endHour: 13 },
  { id: 'chieu', label: 'buổi chiều', startHour: 13, endHour: 18 },
  { id: 'toi',   label: 'buổi tối',   startHour: 18, endHour: 23 },
  { id: 'khuya', label: 'đêm khuya',  startHour: 23, endHour: 5 },
];

export function getTimeOfDayBucket(hour) {
  const h = ((Math.floor(Number(hour) || 0) % 24) + 24) % 24;
  for (const bucket of TIME_OF_DAY_BUCKETS) {
    if (bucket.startHour < bucket.endHour) {
      if (h >= bucket.startHour && h < bucket.endHour) return bucket;
    } else if (h >= bucket.startHour || h < bucket.endHour) {
      // Buổi vắt qua nửa đêm (đêm khuya 23h → 5h)
      return bucket;
    }
  }
  return TIME_OF_DAY_BUCKETS[0];
}

function medianRoundedTo5(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const med = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
  return Math.round(med / 5) * 5;
}

/**
 * suggestSessionLength
 * Gợi ý độ dài phiên kế tiếp dựa trên các phiên TỪNG THÀNH CÔNG vào cùng buổi
 * trong ngày. "Thành công" = đạt mục tiêu (nếu buổi đó đã có dữ liệu mục tiêu);
 * nếu chưa có, coi mọi phiên hoàn thành (không bị huỷ) là thành công. Ưu tiên
 * cùng loại việc khi đủ mẫu, nếu không thì lùi về mọi loại. Trả về null khi
 * chưa đủ dữ liệu để tự tin gợi ý.
 *
 * @param {Array} history
 * @param {object} opts
 * @param {number} opts.nowHour              giờ hiện tại (0-23)
 * @param {string|null} opts.categoryId      loại việc đang chọn (null = mọi loại)
 * @param {(entry:any)=>number} opts.getEntryHour  lấy giờ của 1 phiên từ timestamp
 * @returns {{minutes:number,bucketId:string,bucketLabel:string,sampleSize:number,basis:'goal'|'completed',categoryScoped:boolean}|null}
 */
export function suggestSessionLength(history = [], opts = {}) {
  const {
    nowHour = 0,
    categoryId = null,
    getEntryHour = (entry) => new Date(entry?.timestamp ?? 0).getHours(),
  } = opts;
  if (!Array.isArray(history) || history.length === 0) return null;

  const bucket = getTimeOfDayBucket(nowHour);
  const inBucket = history.filter((entry) => {
    if (!entry || isCancelledHistoryEntry(entry) || entry.completed === false) return false;
    if (!Number.isFinite(entry.minutes) || entry.minutes <= 0) return false;
    return getTimeOfDayBucket(getEntryHour(entry)).id === bucket.id;
  });
  if (inBucket.length === 0) return null;

  const pickSuccessful = (entries) => {
    const hasGoalData = entries.some((e) => typeof e.goalAchieved === 'boolean');
    const successful = hasGoalData
      ? entries.filter((e) => e.goalAchieved === true)
      : entries;
    return { successful, basis: hasGoalData ? 'goal' : 'completed' };
  };

  let scoped = false;
  let pool = inBucket;
  if (categoryId != null) {
    const sameCat = inBucket.filter((e) => (e.categoryId ?? null) === categoryId);
    if (pickSuccessful(sameCat).successful.length >= SESSION_SUGGESTION_MIN_SAMPLE) {
      pool = sameCat;
      scoped = true;
    }
  }

  const { successful, basis } = pickSuccessful(pool);
  if (successful.length < SESSION_SUGGESTION_MIN_SAMPLE) return null;

  const minutes = medianRoundedTo5(successful.map((e) => e.minutes));
  if (!minutes || minutes <= 0) return null;

  return {
    minutes: Math.min(180, Math.max(1, minutes)),
    bucketId: bucket.id,
    bucketLabel: bucket.label,
    sampleSize: successful.length,
    basis,
    categoryScoped: scoped,
  };
}

/**
 * calculateStreakMilestoneProgress
 * Cho biết mốc chuỗi kế tiếp và còn bao nhiêu ngày — để hiện "đích gần" thay vì
 * con số trừu tượng. Thuần, dễ test.
 *
 * @param {number} currentStreak
 * @returns {{nextMilestone:object|null, daysRemaining:number, allMilestones:object[], hasUnlockedAll:boolean}}
 */
export function calculateStreakMilestoneProgress(currentStreak = 0) {
  const streak = Math.max(0, Math.floor(Number(currentStreak) || 0));
  const allMilestones = STREAK_MILESTONES.map((m) => ({
    ...m,
    daysRemaining: Math.max(0, m.days - streak),
    isUnlocked: streak >= m.days,
  }));
  const nextMilestone = allMilestones.find((m) => !m.isUnlocked) ?? null;
  return {
    nextMilestone,
    daysRemaining: nextMilestone ? nextMilestone.daysRemaining : 0,
    allMilestones,
    hasUnlockedAll: nextMilestone === null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// "BỘ NÃO" COACH MIỄN PHÍ — các tín hiệu rút ra từ chính lịch sử người dùng.
// Tất cả thuần (không gọi API), nhận hàm trích giờ/ngày/tuần qua opts để vừa dễ
// test vừa đúng múi giờ Việt Nam khi chạy thật.
// ─────────────────────────────────────────────────────────────────────────────

export const COACH_MIN_SAMPLE = 5;        // đủ phiên mới bật coach
const COACH_BUCKET_MIN_SAMPLE = 4;        // đủ mẫu trong 1 buổi mới dám so sánh

const WEEKDAY_LABELS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

// Các phiên "thật" (đã hoàn thành, không huỷ, có thời lượng hợp lệ).
function coachCompletedSessions(history) {
  return (Array.isArray(history) ? history : []).filter((e) =>
    e && !isCancelledHistoryEntry(e) && e.completed !== false
    && Number.isFinite(e.minutes) && e.minutes > 0);
}

/**
 * getGoldenHourBucket
 * "Giờ vàng" thật: buổi trong ngày mà bạn ĐẠT MỤC TIÊU với tỉ lệ cao nhất (dựa
 * trên tỉ lệ thành công, không phải chỉ số lượng). Cần ≥2 buổi đủ mẫu để so sánh,
 * buổi tốt nhất phải đạt ≥60% và nhỉnh hơn buổi kế ≥15 điểm % mới trả về.
 *
 * @returns {{bucketId,bucketLabel,rate,sampleSize}|null}
 */
export function getGoldenHourBucket(history = [], opts = {}) {
  const {
    getEntryHour = (e) => new Date(e?.timestamp ?? 0).getHours(),
    minSample = COACH_BUCKET_MIN_SAMPLE,
  } = opts;
  const withGoal = coachCompletedSessions(history).filter((e) => typeof e.goalAchieved === 'boolean');
  if (withGoal.length === 0) return null;

  const byBucket = new Map();
  for (const e of withGoal) {
    const b = getTimeOfDayBucket(getEntryHour(e));
    const cur = byBucket.get(b.id) ?? { bucket: b, total: 0, hit: 0 };
    cur.total += 1;
    if (e.goalAchieved === true) cur.hit += 1;
    byBucket.set(b.id, cur);
  }
  const eligible = [...byBucket.values()].filter((x) => x.total >= minSample);
  if (eligible.length < 2) return null;
  eligible.sort((a, b) => (b.hit / b.total) - (a.hit / a.total));
  const best = eligible[0];
  const rate = best.hit / best.total;
  if (rate < 0.6) return null;
  if (rate - eligible[1].hit / eligible[1].total < 0.15) return null;
  return { bucketId: best.bucket.id, bucketLabel: best.bucket.label, rate, sampleSize: best.total };
}

/**
 * getWeekdayHighlight
 * Ngày trong tuần bạn hoàn thành nhiều phiên nhất. Cần trải ≥3 ngày khác nhau,
 * có một ngày dẫn đầu rõ ràng và chiếm ≥25% số phiên mới trả về.
 *
 * @returns {{weekday,label,count,share}|null}
 */
export function getWeekdayHighlight(history = [], opts = {}) {
  const {
    getEntryWeekday = (e) => new Date(e?.timestamp ?? 0).getDay(),
    minTotal = COACH_MIN_SAMPLE,
  } = opts;
  const done = coachCompletedSessions(history);
  if (done.length < minTotal) return null;

  const counts = new Array(7).fill(0);
  const distinct = new Set();
  for (const e of done) {
    const wd = ((Math.floor(Number(getEntryWeekday(e)) || 0) % 7) + 7) % 7;
    counts[wd] += 1;
    distinct.add(wd);
  }
  if (distinct.size < 3) return null;

  let best = 0;
  for (let i = 1; i < 7; i += 1) if (counts[i] > counts[best]) best = i;
  const sorted = [...counts].sort((a, b) => b - a);
  if (sorted[0] <= sorted[1]) return null;          // không có ngày dẫn đầu rõ
  const share = counts[best] / done.length;
  if (share < 0.25) return null;
  return { weekday: best, label: WEEKDAY_LABELS[best], count: counts[best], share };
}

/**
 * getWeeklyTrend
 * So sánh tổng phút tập trung tuần này với tuần trước (theo "key tuần" = thứ Hai
 * của tuần đó). Trả về null khi thiếu hàm trích tuần, hoặc khi một trong hai tuần
 * chưa có dữ liệu để so.
 *
 * @returns {{direction:'up'|'down'|'flat',thisMinutes,prevMinutes,pct,thisN,prevN}|null}
 */
export function getWeeklyTrend(history = [], opts = {}) {
  const { getEntryWeekKey, nowWeekKey, prevWeekKey } = opts;
  if (typeof getEntryWeekKey !== 'function' || !nowWeekKey || !prevWeekKey) return null;

  let thisMinutes = 0; let prevMinutes = 0; let thisN = 0; let prevN = 0;
  for (const e of coachCompletedSessions(history)) {
    const wk = getEntryWeekKey(e);
    if (wk === nowWeekKey) { thisMinutes += e.minutes; thisN += 1; }
    else if (wk === prevWeekKey) { prevMinutes += e.minutes; prevN += 1; }
  }
  if (prevN === 0 || thisN === 0) return null;
  const pct = prevMinutes > 0 ? Math.round(((thisMinutes - prevMinutes) / prevMinutes) * 100) : 0;
  let direction = 'flat';
  if (pct >= 15) direction = 'up';
  else if (pct <= -15) direction = 'down';
  return { direction, thisMinutes, prevMinutes, pct, thisN, prevN };
}

/**
 * getAbandonHotspot
 * Buổi bạn hay bỏ phiên giữa chừng nhất (tỉ lệ huỷ cao). Cần ≥4 lần bắt đầu trong
 * buổi và tỉ lệ huỷ ≥34% mới cảnh báo.
 *
 * @returns {{bucketId,bucketLabel,rate,attempts}|null}
 */
export function getAbandonHotspot(history = [], opts = {}) {
  const {
    getEntryHour = (e) => new Date(e?.timestamp ?? 0).getHours(),
    minAttempts = COACH_BUCKET_MIN_SAMPLE,
  } = opts;

  const byBucket = new Map();
  for (const e of (Array.isArray(history) ? history : [])) {
    if (!e || !Number.isFinite(e.minutes)) continue;
    const cancelled = isCancelledHistoryEntry(e);
    const completed = !cancelled && e.completed !== false;
    if (!cancelled && !completed) continue;
    const b = getTimeOfDayBucket(getEntryHour(e));
    const cur = byBucket.get(b.id) ?? { bucket: b, attempts: 0, cancelled: 0 };
    cur.attempts += 1;
    if (cancelled) cur.cancelled += 1;
    byBucket.set(b.id, cur);
  }
  const eligible = [...byBucket.values()].filter((x) => x.attempts >= minAttempts && x.cancelled > 0);
  if (!eligible.length) return null;
  eligible.sort((a, b) => (b.cancelled / b.attempts) - (a.cancelled / a.attempts));
  const worst = eligible[0];
  const rate = worst.cancelled / worst.attempts;
  if (rate < 0.34) return null;
  return { bucketId: worst.bucket.id, bucketLabel: worst.bucket.label, rate, attempts: worst.attempts };
}

// ─────────────────────────────────────────────────────────────────────────────
// TÍN HIỆU NÂNG CAO (đợt 2) — đều THUẦN, nhận getter giờ/ngày/tuần qua opts.
// Thiết kế qua một workflow 10 agent (thiết kế → phản biện → tổng hợp) rồi ghép
// tay tuần tự, áp các "fix bắt buộc" từ vòng phản biện.
// ─────────────────────────────────────────────────────────────────────────────

function medianOf(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function percentileOf(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))));
  return sorted[idx];
}

function roundGoalValue(value, goalType) {
  if (goalType === 'minutes') return Math.min(600, Math.max(15, Math.round(value / 5) * 5));
  return Math.min(20, Math.max(1, Math.round(value)));
}

export const TODAY_PACE_MIN_BASELINE_DAYS = 4;

/**
 * getTodayPaceInsight
 * So tiến độ HÔM NAY với mục tiêu ngày & với "một ngày điển hình của chính bạn
 * tính tới giờ này". Trả 'met' (đã đạt/vượt), 'near' (sắp đạt), 'behind' (chậm hơn
 * nhịp thường ngày), 'ahead' (nhanh hơn), hoặc null khi không có gì đáng nói.
 *
 * @param {Array} history
 * @param {object} opts metric|goal|sessionsToday|minutesToday|nowHour|getEntryHour|getEntryDayKey|todayKey|minBaselineDays
 * @returns {{kind,status,metric,goal,current,remaining,typical,ratio,sampleDays}|null}
 */
export function getTodayPaceInsight(history = [], opts = {}) {
  const {
    metric = 'sessions',
    goal = 0,
    sessionsToday = 0,
    minutesToday = 0,
    nowHour = 23,
    getEntryHour = (e) => new Date(e?.timestamp ?? 0).getHours(),
    getEntryDayKey = null,
    todayKey = null,
    minBaselineDays = TODAY_PACE_MIN_BASELINE_DAYS,
  } = opts;

  const useMinutes = metric === 'minutes';
  const g = Math.max(0, Math.floor(Number(goal) || 0));
  if (g <= 0) return null;

  const current = Math.max(0, Math.floor(Number(useMinutes ? minutesToday : sessionsToday) || 0));
  const remaining = g - current;
  const mkMetric = useMinutes ? 'minutes' : 'sessions';

  // 1) Đã đạt / vượt mục tiêu ngày
  if (remaining <= 0) {
    return { kind: 'today-pace', status: 'met', metric: mkMetric, goal: g, current, remaining: 0, typical: null, ratio: null, sampleDays: 0 };
  }

  // 2) Sắp đạt — còn rất ít
  const nearThreshold = useMinutes ? Math.max(15, Math.round(g * 0.15)) : 1;
  const nearGoal = remaining <= nearThreshold;

  // 3) Baseline "một ngày điển hình tính tới giờ này" (chỉ khi đủ getter)
  let typical = null;
  let sampleDays = 0;
  let ratio = null;
  if (typeof getEntryDayKey === 'function' && todayKey) {
    const h = ((Math.floor(Number(nowHour) || 0) % 24) + 24) % 24;
    const perDay = new Map();
    for (const e of coachCompletedSessions(history)) {
      const dk = getEntryDayKey(e);
      if (!dk || dk === todayKey) continue;
      if (getEntryHour(e) > h) continue;           // chỉ phần tích tới cùng giờ
      const cur = perDay.get(dk) ?? { count: 0, mins: 0 };
      cur.count += 1;
      cur.mins += e.minutes;
      perDay.set(dk, cur);
    }
    sampleDays = perDay.size;
    if (sampleDays >= minBaselineDays) {
      const vals = [...perDay.values()].map((d) => (useMinutes ? d.mins : d.count));
      const med = medianOf(vals);
      if (med != null) typical = useMinutes ? Math.round(med / 5) * 5 : med;
    }
  }

  const baselineUsable = typical != null && typical >= (useMinutes ? 10 : 1);
  if (baselineUsable) ratio = current / typical;

  // 4) Ưu tiên trạng thái: near > behind > ahead > on-track
  if (nearGoal) return { kind: 'today-pace', status: 'near', metric: mkMetric, goal: g, current, remaining, typical, ratio, sampleDays };
  if (baselineUsable && ratio <= 0.6) return { kind: 'today-pace', status: 'behind', metric: mkMetric, goal: g, current, remaining, typical, ratio, sampleDays };
  if (baselineUsable && ratio >= 1.4) return { kind: 'today-pace', status: 'ahead', metric: mkMetric, goal: g, current, remaining, typical, ratio, sampleDays };
  return null;
}

export const NEGLECT_WINDOW_DAYS = 28;
export const NEGLECT_MIN_SESSIONS = 3;
export const NEGLECT_MIN_SHARE = 0.18;
export const NEGLECT_MIN_GAP_DAYS = 7;
export const NEGLECT_MIN_MINUTES = 45;

/**
 * getNeglectedCategory
 * LOẠI VIỆC bạn từng làm đều (đủ phiên + đủ tỉ trọng phút trong cửa sổ gần đây)
 * nhưng đã im lặng nhiều ngày — để nhắc kéo về nhịp. Bỏ qua nhóm chưa phân loại,
 * loại đã bị XOÁ (qua activeCategoryIds) và loại không còn nhãn thật.
 *
 * @param {Array} history
 * @param {object} opts nowDayNumber|getEntryDayNumber|activeCategoryIds|windowDays|minSessions|minShare|minGapDays|minMinutes
 * @returns {{categoryId,label,daysSince,minutes,sessions,share,windowDays}|null}
 */
export function getNeglectedCategory(history = [], opts = {}) {
  const {
    nowDayNumber,
    getEntryDayNumber,
    activeCategoryIds = null,
    windowDays = NEGLECT_WINDOW_DAYS,
    minSessions = NEGLECT_MIN_SESSIONS,
    minShare = NEGLECT_MIN_SHARE,
    minGapDays = NEGLECT_MIN_GAP_DAYS,
    minMinutes = NEGLECT_MIN_MINUTES,
  } = opts;
  if (typeof getEntryDayNumber !== 'function' || !Number.isFinite(nowDayNumber)) return null;

  const byCat = new Map();
  let totalNamedMinutes = 0;
  for (const e of coachCompletedSessions(history)) {
    const catId = e.categoryId ?? null;
    if (!catId) continue;                                    // bỏ nhóm chưa phân loại
    if (activeCategoryIds && !activeCategoryIds.has(catId)) continue; // bỏ loại đã xoá
    const day = getEntryDayNumber(e);
    if (!Number.isFinite(day)) continue;
    const ageDays = nowDayNumber - day;
    if (ageDays < 0 || ageDays >= windowDays) continue;      // ngoài cửa sổ gần đây
    const cur = byCat.get(catId) ?? { id: catId, minutes: 0, sessions: 0, lastDay: -Infinity, label: null };
    cur.minutes += e.minutes;
    cur.sessions += 1;
    if (day > cur.lastDay) {
      cur.lastDay = day;
      cur.label = e.categorySnapshot?.label ?? cur.label;   // nhãn từ phiên mới nhất
    }
    byCat.set(catId, cur);
    totalNamedMinutes += e.minutes;
  }

  if (byCat.size < 2 || totalNamedMinutes <= 0) return null;

  let best = null;
  let bestScore = -Infinity;
  for (const cur of byCat.values()) {
    if (!cur.label) continue;                                // chỉ nhắc khi có tên thật
    const daysSince = nowDayNumber - cur.lastDay;
    const share = cur.minutes / totalNamedMinutes;
    if (cur.sessions < minSessions) continue;
    if (cur.minutes < minMinutes) continue;                  // tránh nhóm bấm nghịch vài lần
    if (share < minShare) continue;
    if (daysSince < minGapDays) continue;
    const score = daysSince * (0.5 + share);
    if (score > bestScore || (score === bestScore && best && (daysSince > best.daysSince || (daysSince === best.daysSince && cur.minutes > best.minutes)))) {
      bestScore = score;
      best = { categoryId: cur.id, label: cur.label, daysSince, minutes: cur.minutes, sessions: cur.sessions, share, windowDays };
    }
  }
  return best;
}

export const GOAL_CALIBRATION_MIN_DAYS = 8;

/**
 * getDailyGoalCalibration
 * Mục tiêu NGÀY đang quá dễ ('too-easy' → gợi ý nâng) hay quá khó ('too-hard' →
 * gợi ý hạ), kèm CON SỐ gợi ý. Có vùng đệm 25%–85% để tránh chỉnh tới lui. Lọc
 * theo ngày-lịch (minDayKey) để không dính dữ liệu cũ nhiều tháng trước.
 *
 * @param {Array} history
 * @param {object} opts goalType|goalValue|getEntryDayKey|todayKey|minDayKey|minDays|lookbackDays
 * @returns {{verdict:'too-easy'|'too-hard',goalType,current,suggested,hitRate,median,daysCounted}|null}
 */
export function getDailyGoalCalibration(history = [], opts = {}) {
  const {
    goalType,
    goalValue,
    getEntryDayKey,
    todayKey = null,
    minDayKey = null,
    minDays = GOAL_CALIBRATION_MIN_DAYS,
    lookbackDays = 28,
  } = opts;

  if (goalType !== 'sessions' && goalType !== 'minutes') return null;
  if (!Number.isFinite(goalValue) || goalValue <= 0) return null;
  if (typeof getEntryDayKey !== 'function') return null;

  const perDay = new Map();
  for (const e of coachCompletedSessions(history)) {
    const day = getEntryDayKey(e);
    if (!day || day === todayKey) continue;
    if (minDayKey && day < minDayKey) continue;              // rào ngày-lịch (recency)
    const add = goalType === 'minutes' ? e.minutes : 1;
    perDay.set(day, (perDay.get(day) ?? 0) + add);
  }

  const recentDays = [...perDay.keys()].sort((a, b) => (a < b ? 1 : -1)).slice(0, lookbackDays);
  if (recentDays.length < minDays) return null;

  const totals = recentDays.map((d) => perDay.get(d));
  const daysCounted = totals.length;
  const hitRate = totals.filter((t) => t >= goalValue).length / daysCounted;
  const median = medianOf(totals) ?? 0;

  if (hitRate >= 0.85 && median >= goalValue * 1.15) {
    const suggested = roundGoalValue(Math.max(percentileOf(totals, 0.6), goalValue * 1.1), goalType);
    if (suggested > goalValue) return { verdict: 'too-easy', goalType, current: goalValue, suggested, hitRate, median, daysCounted };
    return null;
  }
  if (hitRate <= 0.25 && median <= goalValue * 0.7) {
    const suggested = roundGoalValue(Math.min(percentileOf(totals, 0.75), goalValue * 0.9), goalType);
    if (suggested < goalValue) return { verdict: 'too-hard', goalType, current: goalValue, suggested, hitRate, median, daysCounted };
    return null;
  }
  return null;
}

/**
 * getLateNightQualityDrop
 * Tỉ lệ ĐẠT MỤC TIÊU về KHUYA (mặc định ≥22h hoặc <5h) tụt rõ so với ban ngày của
 * chính bạn. CHỈ xét trục mục tiêu (bỏ trục "độ trọn vẹn" để không trùng
 * getAbandonHotspot). Người làm khuya tốt sẽ không bị nhắc.
 *
 * @param {Array} history
 * @param {object} opts getEntryHour|lateStartHour|minLate|minDay
 * @returns {{lateGoalRate,dayGoalRate,goalDrop,lateAttempts,lateStartHour}|null}
 */
export function getLateNightQualityDrop(history = [], opts = {}) {
  const {
    getEntryHour = (e) => new Date(e?.timestamp ?? 0).getHours(),
    lateStartHour = 22,
    minLate = COACH_BUCKET_MIN_SAMPLE,
    minDay = COACH_MIN_SAMPLE,
  } = opts;

  // Chốt mốc "muộn" trong [18,23]; ngoài khoảng thì về 22 (tránh day rỗng âm thầm).
  let lateStart = Math.floor(Number(lateStartHour) || 22);
  if (!(lateStart >= 18 && lateStart <= 23)) lateStart = 22;
  const isLate = (h) => h >= lateStart || h < 5;

  const late = { attempts: 0, goalTotal: 0, goalHit: 0 };
  const day = { attempts: 0, goalTotal: 0, goalHit: 0 };
  for (const e of (Array.isArray(history) ? history : [])) {
    if (!e || !Number.isFinite(e.minutes) || e.minutes <= 0) continue;
    if (isCancelledHistoryEntry(e) || e.completed === false) continue;   // chỉ phiên hoàn thành
    const h = ((Math.floor(Number(getEntryHour(e)) || 0) % 24) + 24) % 24;
    const g = isLate(h) ? late : day;
    g.attempts += 1;
    if (typeof e.goalAchieved === 'boolean') {
      g.goalTotal += 1;
      if (e.goalAchieved === true) g.goalHit += 1;
    }
  }

  if (late.attempts < minLate || day.attempts < minDay) return null;
  if (late.goalTotal < 3 || day.goalTotal < 3) return null;

  const lateGoalRate = late.goalHit / late.goalTotal;
  const dayGoalRate = day.goalHit / day.goalTotal;
  const goalDrop = dayGoalRate - lateGoalRate;
  if (goalDrop < 0.2 || lateGoalRate > 0.55) return null;

  return { lateGoalRate, dayGoalRate, goalDrop, lateAttempts: late.attempts, lateStartHour: lateStart };
}

/**
 * generateCoachInsight
 * "Bộ não" coach MIỄN PHÍ — gom nhiều tín hiệu từ chính lịch sử người dùng, chấm
 * điểm độ hữu ích, rồi: (a) nếu có tín hiệu NHẠY THỜI GIAN & cấp bách (nhịp hôm
 * nay sắp đạt/đang chậm, mục tiêu quá sức) thì hiện NGAY (không xoay vòng); (b)
 * còn lại thì trừ điểm chống-lặp theo `recentKinds` rồi XOAY VÒNG top-3 theo
 * `rotationSeed` để mỗi ngày một câu. Không gọi API.
 *
 * @param {Array} history
 * @param {object} opts xem phần destructure bên dưới
 * @returns {{kind:string, text:string, reason:(string|null)}}
 */
export function generateCoachInsight(history = [], opts = {}) {
  const {
    nowHour = 0,
    getEntryHour = (e) => new Date(e?.timestamp ?? 0).getHours(),
    getEntryWeekday = (e) => new Date(e?.timestamp ?? 0).getDay(),
    getEntryWeekKey = null,
    nowWeekKey = null,
    prevWeekKey = null,
    currentStreak = 0,
    minSample = COACH_MIN_SAMPLE,
    rotationSeed = 0,
    // Nâng cấp đợt 2 — đều có default an toàn (không truyền = giữ hành vi cũ):
    getEntryDayKey = null,
    todayKey = null,
    minDayKey = null,
    getEntryDayNumber = null,
    nowDayNumber = null,
    dailyGoalMetric = null,
    dailyGoal = 0,
    sessionsToday = 0,
    minutesToday = 0,
    activeCategoryIds = null,
    isSessionRunning = false,
    recentKinds = [],
  } = opts;

  const completed = coachCompletedSessions(history);

  if (completed.length < minSample) {
    const left = Math.max(1, minSample - completed.length);
    return { kind: 'onboarding', reason: null, text: `Hoàn thành thêm ${left} phiên có mục tiêu để Coach học giờ vàng và độ dài lý tưởng của bạn.` };
  }

  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const candidates = [];

  // 1) Gợi ý độ dài cho buổi hiện tại — hành động được ngay
  const sug = suggestSessionLength(history, { nowHour, getEntryHour });
  if (sug) {
    candidates.push({
      kind: 'length', score: 80, sampleSize: sug.sampleSize,
      text: `${cap(sug.bucketLabel) || 'Giờ này'} bạn hợp phiên ~${sug.minutes}′${sug.categoryScoped ? ' (cùng loại việc)' : ''} — thử ngay bây giờ nhé.`,
      reason: `Dựa trên ${sug.sampleSize} phiên ${sug.basis === 'goal' ? 'đạt mục tiêu' : 'đã hoàn thành'} cùng buổi.`,
    });
  }

  // 1b) NHỊP HÔM NAY so với mục tiêu ngày & một ngày điển hình (nhạy thời gian)
  const pace = getTodayPaceInsight(history, {
    metric: dailyGoalMetric, goal: dailyGoal, sessionsToday, minutesToday,
    nowHour, getEntryHour, getEntryDayKey, todayKey,
  });
  if (pace) {
    const unit = pace.metric === 'minutes' ? 'phút' : 'phiên';
    const typ = pace.metric === 'minutes' ? pace.typical : Math.round(pace.typical ?? 0);
    if (pace.status === 'near') {
      candidates.push({ kind: 'pace-near', score: 88, timeSensitive: true, urgent: true, sampleSize: pace.sampleDays,
        reason: `Hôm nay đã ${pace.current}/${pace.goal} ${unit}.`,
        text: pace.metric === 'minutes'
          ? `Chỉ còn ${pace.remaining} phút nữa là đạt mục tiêu ngày — một phiên ngắn ngay bây giờ là xong!`
          : `Thêm ${pace.remaining} phiên nữa là đạt mục tiêu ngày (${pace.goal} ${unit}) — bắt đầu luôn nhé!` });
    } else if (pace.status === 'behind') {
      candidates.push({ kind: 'pace-behind', score: 76, timeSensitive: true, urgent: true, sampleSize: pace.sampleDays,
        reason: `Tới giờ này hôm nay bạn thường đã ~${typ} ${unit}, giờ mới ${pace.current}.`,
        text: `Tới giờ này hôm nay bạn thường làm nhiều hơn (~${typ} ${unit}) — vào một phiên ngay để bắt kịp nhịp NGÀY của bạn.` });
    } else if (pace.status === 'met') {
      candidates.push({ kind: 'pace-met', score: 56, sampleSize: pace.sampleDays,
        reason: `Đã ${pace.current}/${pace.goal} ${unit} hôm nay.`,
        text: `Đã đạt mục tiêu ngày rồi 🎉 Nghỉ ngơi xứng đáng, hoặc thêm một phiên nhẹ nếu còn hứng.` });
    } else if (pace.status === 'ahead') {
      candidates.push({ kind: 'pace-ahead', score: 54, sampleSize: pace.sampleDays,
        reason: `Thường tới giờ này ~${typ} ${unit}, hôm nay đã ${pace.current}.`,
        text: `Hôm nay bạn đang nhanh hơn nhịp thường ngày — phong độ tốt, giữ đà tới mục tiêu nhé!` });
    }
  }

  // 2) Tỉ lệ đạt mục tiêu (tip có thể bị "goal-too-hard" cụ thể hơn thay thế — xem dưới)
  const withGoal = completed.filter((e) => typeof e.goalAchieved === 'boolean');
  if (withGoal.length >= minSample) {
    const hit = withGoal.filter((e) => e.goalAchieved === true).length;
    const rate = hit / withGoal.length;
    const pct = Math.round(rate * 100);
    if (rate <= 0.5) {
      candidates.push({ kind: 'tip', score: 78, sampleSize: withGoal.length, reason: `${hit}/${withGoal.length} phiên gần đây đạt mục tiêu.`, text: `Tỉ lệ đạt mục tiêu đang ${pct}%. Thử đặt mục tiêu nhỏ hơn cho mỗi phiên để dễ "đạt" và giữ động lực.` });
    } else if (rate >= 0.8) {
      candidates.push({ kind: 'praise', score: 58, sampleSize: withGoal.length, reason: `${hit}/${withGoal.length} phiên đạt mục tiêu.`, text: `Bạn đạt mục tiêu ${pct}% số phiên gần đây — phong độ rất tốt, giữ nhịp này nhé.` });
    }
  }

  // 2b) Hiệu chỉnh độ khó MỤC TIÊU NGÀY (có CON SỐ gợi ý)
  const calib = getDailyGoalCalibration(history, {
    goalType: dailyGoalMetric, goalValue: dailyGoal, getEntryDayKey, todayKey, minDayKey,
  });
  if (calib) {
    const unit = calib.goalType === 'minutes' ? 'phút' : 'phiên';
    const pct = Math.round(calib.hitRate * 100);
    if (calib.verdict === 'too-hard') {
      candidates.push({ kind: 'goal-too-hard', score: 77, timeSensitive: true, urgent: calib.hitRate <= 0.15, sampleSize: calib.daysCounted,
        reason: `Dựa trên ${calib.daysCounted} ngày gần đây: đạt ${pct}%, trung vị ${Math.round(calib.median)} ${unit}/ngày.`,
        text: `Mục tiêu ngày đang hơi quá sức (đạt ${pct}%). Hạ từ ${calib.current} xuống ${calib.suggested} ${unit}/ngày để dễ "đạt" và giữ động lực.` });
    } else if (calib.verdict === 'too-easy') {
      candidates.push({ kind: 'goal-too-easy', score: 71, sampleSize: calib.daysCounted,
        reason: `Dựa trên ${calib.daysCounted} ngày gần đây: đạt ${pct}%, trung vị ${Math.round(calib.median)} ${unit}/ngày.`,
        text: `Mục tiêu ngày đang hơi dễ (đạt ${pct}%). Thử nâng từ ${calib.current} lên ${calib.suggested} ${unit}/ngày để bám phong độ thật.` });
    }
  }

  // 3) Hay bỏ phiên giữa chừng theo buổi
  const abandon = getAbandonHotspot(history, { getEntryHour });
  if (abandon) {
    candidates.push({ kind: 'abandon', score: 74, sampleSize: abandon.attempts, reason: `${abandon.attempts} lần bắt đầu phiên trong buổi này.`, text: `${cap(abandon.bucketLabel)} bạn hay dừng phiên giữa chừng (${Math.round(abandon.rate * 100)}%). Thử đặt phiên ngắn hơn cho khung giờ này.` });
  }

  // 3b) Chất lượng đạt mục tiêu về KHUYA tụt so với ban ngày
  const lateDrop = getLateNightQualityDrop(history, { getEntryHour });
  if (lateDrop) {
    candidates.push({ kind: 'late-quality', score: 73, sampleSize: lateDrop.lateAttempts,
      reason: `Dựa trên ${lateDrop.lateAttempts} phiên muộn so với ban ngày; chênh ${Math.round(lateDrop.goalDrop * 100)} điểm % tỉ lệ đạt mục tiêu.`,
      text: `Sau ${lateDrop.lateStartHour}h tỉ lệ đạt mục tiêu của bạn tụt còn ${Math.round(lateDrop.lateGoalRate * 100)}% (ban ngày ${Math.round(lateDrop.dayGoalRate * 100)}%) — khung muộn nên ưu tiên việc nhẹ, đừng để dành việc khó.` });
  }

  // 4) Xu hướng tuần này so với tuần trước
  const trend = getWeeklyTrend(history, { getEntryWeekKey, nowWeekKey, prevWeekKey });
  if (trend && trend.direction === 'down') {
    candidates.push({ kind: 'trend-down', score: 72, sampleSize: trend.thisN + trend.prevN, reason: `${trend.thisMinutes}′ tuần này so với ${trend.prevMinutes}′ tuần trước.`, text: `Tuần này bạn tập trung ít hơn tuần trước ${Math.abs(trend.pct)}%. Một phiên ngắn ngay bây giờ sẽ kéo lại nhịp.` });
  } else if (trend && trend.direction === 'up') {
    candidates.push({ kind: 'trend-up', score: 66, sampleSize: trend.thisN + trend.prevN, reason: `${trend.thisMinutes}′ tuần này so với ${trend.prevMinutes}′ tuần trước.`, text: `Tuần này bạn tập trung nhiều hơn tuần trước ${trend.pct}% — đang lên phong độ, giữ đà nhé!` });
  }

  // 5) Giờ vàng (tỉ lệ đạt mục tiêu cao nhất theo buổi)
  const golden = getGoldenHourBucket(history, { getEntryHour });
  if (golden) {
    candidates.push({ kind: 'golden', score: 70, sampleSize: golden.sampleSize, reason: `Tính trên ${golden.sampleSize} phiên có mục tiêu.`, text: `Giờ vàng của bạn là ${golden.bucketLabel} — đạt mục tiêu tới ${Math.round(golden.rate * 100)}%. Ưu tiên việc khó vào khung này.` });
  }

  // 5b) Loại việc bị bỏ bê — điểm ĐỘNG theo số ngày im lặng để lọt được top-3
  const neglected = getNeglectedCategory(history, { nowDayNumber, getEntryDayNumber, activeCategoryIds });
  if (neglected) {
    candidates.push({ kind: 'category-neglect', score: 64 + Math.min(12, neglected.daysSince), sampleSize: neglected.sessions,
      reason: `${neglected.daysSince} ngày chưa có phiên "${neglected.label}" (trước đó ${neglected.sessions} phiên/${neglected.windowDays} ngày).`,
      text: `Đã ${neglected.daysSince} ngày bạn chưa làm "${neglected.label}" — nhóm này từng chiếm ~${Math.round(neglected.share * 100)}% thời gian. Dành phiên kế cho nó để khỏi nguội nhé.` });
  }

  // 6) Ngày năng suất nhất trong tuần
  const wd = getWeekdayHighlight(history, { getEntryWeekday });
  if (wd) {
    candidates.push({ kind: 'weekday', score: 60, sampleSize: wd.count, reason: `Chiếm ${Math.round(wd.share * 100)}% số phiên của bạn.`, text: `${wd.label} thường là ngày bạn làm nhiều nhất (${wd.count} phiên). Đặt việc quan trọng vào ngày này.` });
  }

  // 7) Nhắc chuỗi
  if (currentStreak >= 2) {
    candidates.push({ kind: 'streak', score: 50, sampleSize: currentStreak, reason: null, text: `Chuỗi ${currentStreak} ngày đang đẹp — hoàn thành một phiên hôm nay để giữ lửa.` });
  }

  // 8) Mặc định
  candidates.push({ kind: 'generic', score: 10, sampleSize: 0, reason: null, text: `Bạn đã hoàn thành ${completed.length} phiên. Đặt một mục tiêu rõ ràng rồi bắt đầu phiên kế tiếp nhé.` });

  // Loại trừ lẫn nhau: "goal-too-hard" có CON SỐ cụ thể → bỏ "tip" chung chung.
  let pool = candidates;
  if (pool.some((c) => c.kind === 'goal-too-hard')) pool = pool.filter((c) => c.kind !== 'tip');

  // ƯU TIÊN CỨNG: tín hiệu nhạy thời gian & cấp bách (hôm nay) hiện NGAY, bỏ xoay
  // vòng — để cú hích đúng-lúc không bị rotation giấu mất. Chỉ khi đang rảnh.
  const urgent = pool.filter((c) => c.urgent && !isSessionRunning);
  if (urgent.length) {
    urgent.sort((a, b) => b.score - a.score);
    const u = urgent[0];
    return { kind: u.kind, text: u.text, reason: u.reason ?? null };
  }

  // Sắp theo điểm TĨNH (giữ thứ tự rotation cũ); chỉ tie CHÍNH XÁC mới phân giải
  // bằng cỡ mẫu rồi tên kind (tất định) — không đụng các điểm khác nhau.
  pool.sort((a, b) => (b.score - a.score)
    || ((b.sampleSize ?? 0) - (a.sampleSize ?? 0))
    || (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0));

  // Chống lặp: trừ điểm cho kind vừa hiện gần đây (recentKinds[0] = gần nhất). Khi
  // recentKinds rỗng (mặc định) thì không đổi gì → giữ hành vi & test cũ.
  const recent = Array.isArray(recentKinds) ? recentKinds : [];
  const penaltyOf = (kind) => {
    const i = recent.indexOf(kind);
    return i < 0 ? 0 : Math.max(0, 12 - i * 5);
  };
  const ranked = pool
    .map((c, idx) => ({ c, idx, key: c.score - penaltyOf(c.kind) }))
    .sort((a, b) => (b.key - a.key) || (a.idx - b.idx))
    .map((x) => x.c);

  const top = ranked.slice(0, Math.min(3, ranked.length));
  const seed = Number.isFinite(rotationSeed) ? Math.abs(Math.floor(rotationSeed)) : 0;
  const chosen = top[seed % top.length];
  return { kind: chosen.kind, text: chosen.text, reason: chosen.reason ?? null };
}

// ─────────────────────────────────────────────────────────────────────────────
// generateCoachBriefing — Coach local "cực thông minh": TỔNG HỢP nhiều tín hiệu
// thành briefing 1-3 câu (chẩn đoán + tối đa 1 hành động), giọng tự nhiên, vẫn
// THUẦN & MIỄN PHÍ. KHÔNG đụng generateCoachInsight (giữ test cũ). Thiết kế qua
// workflow 2 agent (thiết kế + phản biện), đã áp các "must-fix": câu mảnh 1-câu
// riêng, tối đa 1 hành động, khử trùng "buổi", từ nối nhẹ, KHÔNG bịa nhân-quả,
// chống lặp theo recentKinds. (Đọc chủ đề ghi chú tiếng Việt: HOÃN — rủi ro từ cụt.)
// ─────────────────────────────────────────────────────────────────────────────

const BRIEFING_CONNECTORS = ['Nhân tiện,', 'Bên cạnh đó,'];
const BRIEFING_ROLE_PRIORITY = { diagnosis: 0, praise: 1, observation: 2, action: 3 };

function decapVi(s) {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

// Mỗi "ứng viên" có 1 câu mảnh hoàn chỉnh (KHÁC text 2-vế của insight cũ) + role.
function buildBriefingCandidates(history, opts) {
  const {
    nowHour = 0,
    getEntryHour = (e) => new Date(e?.timestamp ?? 0).getHours(),
    getEntryWeekday = (e) => new Date(e?.timestamp ?? 0).getDay(),
    getEntryWeekKey = null, nowWeekKey = null, prevWeekKey = null,
    getEntryDayKey = null, todayKey = null, minDayKey = null,
    getEntryDayNumber = null, nowDayNumber = null,
    dailyGoalMetric = null, dailyGoal = 0, sessionsToday = 0, minutesToday = 0,
    currentStreak = 0, activeCategoryIds = null, minSample = COACH_MIN_SAMPLE,
  } = opts;
  const completed = coachCompletedSessions(history);
  const out = [];

  const sug = suggestSessionLength(history, { nowHour, getEntryHour });
  if (sug) out.push({ kind: 'length', role: 'action', score: 80, impliesAction: true, bucketId: sug.bucketId, reason: `Dựa trên ${sug.sampleSize} phiên ${sug.basis === 'goal' ? 'đạt mục tiêu' : 'đã hoàn thành'} cùng buổi.`, fragment: `Thử một phiên ~${sug.minutes}′ cho ${sug.bucketLabel}.` });

  const pace = getTodayPaceInsight(history, { metric: dailyGoalMetric, goal: dailyGoal, sessionsToday, minutesToday, nowHour, getEntryHour, getEntryDayKey, todayKey });
  if (pace) {
    const unit = pace.metric === 'minutes' ? 'phút' : 'phiên';
    const typ = pace.metric === 'minutes' ? pace.typical : Math.round(pace.typical ?? 0);
    if (pace.status === 'near') out.push({ kind: 'pace-near', role: 'diagnosis', score: 88, urgent: true, timeSensitive: true, impliesAction: true, reason: `Hôm nay đã ${pace.current}/${pace.goal} ${unit}.`, fragment: pace.metric === 'minutes' ? `Chỉ còn ${pace.remaining} phút nữa là đạt mục tiêu ngày — làm nốt một phiên là xong!` : `Thêm ${pace.remaining} phiên nữa là đạt mục tiêu ngày — làm nốt là xong!` });
    else if (pace.status === 'behind') out.push({ kind: 'pace-behind', role: 'diagnosis', score: 76, urgent: true, timeSensitive: true, impliesAction: true, reason: `Tới giờ này thường ~${typ} ${unit}, nay mới ${pace.current}.`, fragment: `Tới giờ này hôm nay bạn thường làm nhiều hơn (~${typ} ${unit}), nay mới ${pace.current} — thử vào một phiên để bắt kịp.` });
    else if (pace.status === 'met') out.push({ kind: 'pace-met', role: 'praise', score: 56, reason: `Đã ${pace.current}/${pace.goal} ${unit} hôm nay.`, fragment: 'Bạn đã đạt mục tiêu ngày rồi — nghỉ ngơi xứng đáng nhé.' });
    else if (pace.status === 'ahead') out.push({ kind: 'pace-ahead', role: 'praise', score: 54, reason: `Thường ~${typ} ${unit}, nay đã ${pace.current}.`, fragment: 'Hôm nay bạn đang nhanh hơn nhịp thường ngày — phong độ tốt.' });
  }

  const calib = getDailyGoalCalibration(history, { goalType: dailyGoalMetric, goalValue: dailyGoal, getEntryDayKey, todayKey, minDayKey });
  let hasTooHard = false;
  if (calib) {
    const unit = calib.goalType === 'minutes' ? 'phút' : 'phiên';
    const pct = Math.round(calib.hitRate * 100);
    if (calib.verdict === 'too-hard') { hasTooHard = true; out.push({ kind: 'goal-too-hard', role: 'diagnosis', score: 77, urgent: calib.hitRate <= 0.15, timeSensitive: true, impliesAction: true, reason: `Dựa trên ${calib.daysCounted} ngày gần đây.`, fragment: `Mục tiêu ngày đang hơi quá sức (đạt ${pct}%) — thử hạ xuống ${calib.suggested} ${unit}/ngày.` }); }
    else if (calib.verdict === 'too-easy') out.push({ kind: 'goal-too-easy', role: 'observation', score: 71, impliesAction: true, reason: `Dựa trên ${calib.daysCounted} ngày gần đây.`, fragment: `Mục tiêu ngày đang khá nhẹ (đạt ${pct}%) — có thể nâng lên ${calib.suggested} ${unit}/ngày.` });
  }

  const withGoal = completed.filter((e) => typeof e.goalAchieved === 'boolean');
  if (withGoal.length >= minSample) {
    const hit = withGoal.filter((e) => e.goalAchieved === true).length;
    const pct = Math.round((hit / withGoal.length) * 100);
    if (hit / withGoal.length <= 0.5 && !hasTooHard) out.push({ kind: 'tip', role: 'diagnosis', score: 78, reason: `${hit}/${withGoal.length} phiên đạt mục tiêu.`, fragment: `Gần đây tỉ lệ đạt mục tiêu của bạn khá thấp (${pct}%).` });
    else if (hit / withGoal.length >= 0.8) out.push({ kind: 'praise', role: 'praise', score: 58, reason: `${hit}/${withGoal.length} phiên đạt mục tiêu.`, fragment: `Bạn đạt mục tiêu ${pct}% số phiên gần đây — phong độ rất vững.` });
  }

  const ab = getAbandonHotspot(history, { getEntryHour });
  if (ab) out.push({ kind: 'abandon', role: 'diagnosis', score: 74, bucketId: ab.bucketId, reason: `${ab.attempts} lần bắt đầu trong buổi này.`, fragment: `Vào ${ab.bucketLabel} bạn hay bỏ phiên giữa chừng (${Math.round(ab.rate * 100)}%).` });

  const late = getLateNightQualityDrop(history, { getEntryHour });
  if (late) out.push({ kind: 'late-quality', role: 'diagnosis', score: 73, reason: `${late.lateAttempts} phiên muộn so với ban ngày.`, fragment: `Sau ${late.lateStartHour}h tỉ lệ đạt mục tiêu của bạn tụt rõ (còn ${Math.round(late.lateGoalRate * 100)}% so với ${Math.round(late.dayGoalRate * 100)}% ban ngày).` });

  const tr = getWeeklyTrend(history, { getEntryWeekKey, nowWeekKey, prevWeekKey });
  if (tr && tr.direction === 'down') out.push({ kind: 'trend-down', role: 'diagnosis', score: 72, reason: `${tr.thisMinutes}′ so với ${tr.prevMinutes}′ tuần trước.`, fragment: `Tuần này bạn tập trung ít hơn tuần trước ${Math.abs(tr.pct)}%.` });
  else if (tr && tr.direction === 'up') out.push({ kind: 'trend-up', role: 'praise', score: 66, reason: `${tr.thisMinutes}′ so với ${tr.prevMinutes}′ tuần trước.`, fragment: `Tuần này bạn tập trung nhiều hơn tuần trước ${tr.pct}% — đang lên đà.` });

  const golden = getGoldenHourBucket(history, { getEntryHour });
  if (golden) out.push({ kind: 'golden', role: 'observation', score: 70, bucketId: golden.bucketId, reason: `Trên ${golden.sampleSize} phiên có mục tiêu.`, fragment: `Giờ vàng của bạn là ${golden.bucketLabel} — đạt mục tiêu tới ${Math.round(golden.rate * 100)}%.` });

  if (typeof getEntryDayNumber === 'function' && Number.isFinite(nowDayNumber)) {
    const neg = getNeglectedCategory(history, { nowDayNumber, getEntryDayNumber, activeCategoryIds });
    if (neg) out.push({ kind: 'category-neglect', role: 'observation', score: 64 + Math.min(12, neg.daysSince), reason: `${neg.daysSince} ngày chưa làm "${neg.label}".`, fragment: `Đã ${neg.daysSince} ngày bạn chưa làm "${neg.label}" — nhóm từng chiếm ~${Math.round(neg.share * 100)}% thời gian.` });
  }

  const wd = getWeekdayHighlight(history, { getEntryWeekday });
  if (wd) out.push({ kind: 'weekday', role: 'observation', score: 60, reason: `Chiếm ~${Math.round(wd.share * 100)}% số phiên.`, fragment: `${wd.label} thường là ngày bạn làm nhiều nhất (${wd.count} phiên).` });

  if (currentStreak >= 2) out.push({ kind: 'streak', role: 'praise', score: 50, reason: null, fragment: `Chuỗi ${currentStreak} ngày đang đẹp — giữ lửa nhé.` });

  return out;
}

function composeBriefing(candidates, opts = {}) {
  const { rotationSeed = 0, recentKinds = [], isSessionRunning = false, maxFragments = 3 } = opts;
  if (!candidates.length) return null;
  const recent = Array.isArray(recentKinds) ? recentKinds : [];
  const penaltyOf = (kind) => { const i = recent.indexOf(kind); return i < 0 ? 0 : Math.max(0, 12 - i * 5); };
  const seed = Number.isFinite(rotationSeed) ? Math.abs(Math.floor(rotationSeed)) : 0;
  const byKind = (a, b) => (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0);

  const scored = candidates.map((c) => {
    const bonus = isSessionRunning ? 0 : ((c.urgent ? 30 : 0) + (c.timeSensitive ? 10 : 0));
    return { ...c, eff: c.score + bonus - penaltyOf(c.kind) };
  }).sort((a, b) => (b.eff - a.eff) || byKind(a, b));

  // Câu DẪN: khi đang rảnh → ưu tiên cứng tín hiệu cấp bách; khi ĐANG CHẠY phiên →
  // không ép câu "bắt đầu phiên" (bỏ các mảnh hàm-ý-hành-động khỏi vị trí dẫn).
  let leadPool = scored;
  if (isSessionRunning) {
    const calm = scored.filter((c) => !c.impliesAction);
    if (calm.length) leadPool = calm;
  }
  const urgent = isSessionRunning ? [] : leadPool.filter((c) => c.urgent);
  const lead = urgent.length
    ? urgent[0]
    : [...leadPool].sort((a, b) => (BRIEFING_ROLE_PRIORITY[a.role] - BRIEFING_ROLE_PRIORITY[b.role]) || (b.eff - a.eff) || byKind(a, b))[0];

  const used = new Set([lead.kind]);
  const buckets = new Set(lead.bucketId ? [lead.bucketId] : []);
  const pieces = [lead];

  // 1 mảnh "màu sắc" (observation/praise) khác trục buổi
  const color = scored.find((c) => !used.has(c.kind) && (c.role === 'observation' || c.role === 'praise') && !(c.bucketId && buckets.has(c.bucketId)));
  if (color && pieces.length < maxFragments) { pieces.push(color); used.add(color.kind); if (color.bucketId) buckets.add(color.bucketId); }

  // Tối đa 1 hành động — chỉ khi câu dẫn CHƯA hàm ý hành động & không đang chạy phiên
  if (!lead.impliesAction && !isSessionRunning && pieces.length < maxFragments) {
    const action = scored.find((c) => !used.has(c.kind) && c.role === 'action' && !(c.bucketId && buckets.has(c.bucketId)));
    if (action) { pieces.push(action); used.add(action.kind); }
  }

  let text = pieces[0].fragment;
  for (let i = 1; i < pieces.length; i += 1) {
    const p = pieces[i];
    if (p.role === 'action') text += ` ${p.fragment}`;
    else text += ` ${BRIEFING_CONNECTORS[seed % BRIEFING_CONNECTORS.length]} ${decapVi(p.fragment)}`;
  }
  return { kind: lead.kind, text: text.replace(/\s+/g, ' ').trim(), reason: lead.reason ?? null, parts: pieces.map((p) => p.kind) };
}

/**
 * generateCoachBriefing
 * Tầng coach local thông minh nhất hiện có: tổng hợp tín hiệu thành briefing tự
 * nhiên. Trả {kind, text, reason, parts}. Cùng bộ opts như generateCoachInsight.
 */
export function generateCoachBriefing(history = [], opts = {}) {
  const {
    minSample = COACH_MIN_SAMPLE, rotationSeed = 0, recentKinds = [],
    isSessionRunning = false, maxFragments = 3,
  } = opts;
  const completed = coachCompletedSessions(history);
  if (completed.length < minSample) {
    const left = Math.max(1, minSample - completed.length);
    return { kind: 'onboarding', reason: null, parts: ['onboarding'], text: `Hoàn thành thêm ${left} phiên có mục tiêu để Coach học giờ vàng và độ dài lý tưởng của bạn.` };
  }
  const candidates = buildBriefingCandidates(history, opts);
  if (!candidates.length) {
    return { kind: 'generic', reason: null, parts: ['generic'], text: `Bạn đã hoàn thành ${completed.length} phiên. Đặt một mục tiêu rõ ràng rồi bắt đầu phiên kế tiếp nhé.` };
  }
  return composeBriefing(candidates, { rotationSeed, recentKinds, isSessionRunning, maxFragments });
}

function getHistoryXP(entry) {
  return entry?.xpEarned ?? entry?.epEarned ?? 0;
}

function getHistoryMinutes(entry) {
  return Math.max(0, entry?.minutes ?? 0);
}

// ─── Thống kê rolling 7 ngày gần nhất ────────────────────────────────────────
export function computeWeeklyStats(history) {
  const days = {};
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const d = localDateStr(now - i * 86_400_000);
    days[d] = { date: d, xp: 0, minutes: 0, sessions: 0, completed: 0, cancelled: 0 };
  }
  for (const h of history) {
    const d = localDateStr(new Date(h.timestamp));
    if (days[d]) {
      const isCancelled = isCancelledHistoryEntry(h);
      days[d].xp       += getHistoryXP(h); // backward compat
      days[d].minutes  += getHistoryMinutes(h);
      days[d].sessions += 1;
      days[d].completed += isCancelled ? 0 : 1;
      days[d].cancelled += isCancelled ? 1 : 0;
    }
  }
  return Object.values(days);
}

// ─── Thống kê tổng hợp ────────────────────────────────────────────────────────
export function computeAllTimeStats(history, progress, player = null, historyStats = null) {
  const completedHistory = history.filter((entry) => !isCancelledHistoryEntry(entry));
  const cancelledHistory = history.filter(isCancelledHistoryEntry);
  const best = completedHistory.reduce(
    (m, h) => (h.minutes > m.minutes ? h : m),
    { minutes: 0, xpEarned: 0, epEarned: 0 },
  );
  const normalizedHistoryStats = historyStats ?? {};
  const bestSessionMins = Number.isFinite(normalizedHistoryStats.bestSessionMinutes)
    ? Math.max(0, normalizedHistoryStats.bestSessionMinutes)
    : best.minutes;
  const bestSessionXP = Number.isFinite(normalizedHistoryStats.bestSessionXP)
    ? Math.max(0, normalizedHistoryStats.bestSessionXP)
    : (best.xpEarned ?? best.epEarned ?? 0);
  const totalJackpots = Number.isFinite(normalizedHistoryStats.totalJackpots)
    ? Math.max(0, normalizedHistoryStats.totalJackpots)
    : history.filter((h) => h.jackpot).length;
  const totalBlueprints = Number.isFinite(normalizedHistoryStats.totalBlueprints)
    ? Math.max(0, normalizedHistoryStats.totalBlueprints)
    : completedHistory.filter((h) => (h.refinedEarned ?? 0) > 0 || (h.minutes ?? 0) >= 45).length;
  const cancelledSessions = Number.isFinite(normalizedHistoryStats.cancelledSessions)
    ? Math.max(0, normalizedHistoryStats.cancelledSessions)
    : cancelledHistory.length;
  const cancelledMinutes = Number.isFinite(normalizedHistoryStats.cancelledMinutes)
    ? Math.max(0, normalizedHistoryStats.cancelledMinutes)
    : cancelledHistory.reduce((sum, h) => sum + getHistoryMinutes(h), 0);

  return {
    totalSessions:    progress.sessionsCompleted,
    totalMinutes:     progress.totalFocusMinutes,
    totalHours:       (progress.totalFocusMinutes / 60).toFixed(1),
    totalXP:          player?.totalEXP ?? completedHistory.reduce((sum, h) => sum + getHistoryXP(h), 0),
    bestSessionMins,
    bestSessionXP,
    avgSessionLength: history.length
      ? Math.round(progress.totalFocusMinutes / Math.max(progress.sessionsCompleted, 1))
      : 0,
    totalJackpots,
    totalBlueprints,
    trackedSessions: history.length,
    trackedMinutes: history.reduce((sum, h) => sum + getHistoryMinutes(h), 0),
    cancelledSessions,
    cancelledMinutes,
  };
}

// ─── Thống kê rolling 7 ngày trước đó (từ 7 đến 13 ngày trước) ─────────────
export function computePrevWeekStats(history) {
  const days = {};
  const now  = Date.now();
  for (let i = 13; i >= 7; i--) {
    const d = localDateStr(now - i * 86_400_000);
    days[d] = { date: d, xp: 0, minutes: 0, sessions: 0, completed: 0, cancelled: 0 };
  }
  for (const h of history) {
    const d = localDateStr(new Date(h.timestamp));
    if (days[d]) {
      const isCancelled = isCancelledHistoryEntry(h);
      days[d].xp       += getHistoryXP(h);
      days[d].minutes  += getHistoryMinutes(h);
      days[d].sessions += 1;
      days[d].completed += isCancelled ? 0 : 1;
      days[d].cancelled += isCancelled ? 1 : 0;
    }
  }
  return Object.values(days);
}

// ─── Heatmap dữ liệu (GitHub-style, N ngày gần nhất) ─────────────────────────
// intensity: 0=none, 1=light(1-25p), 2=medium(26-60p), 3=high(61-120p), 4=max(120+p)
export function computeHeatmapData(history, days = 84) {
  const now = Date.now();
  const map = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = localDateStr(now - i * 86_400_000);
    map[d] = 0; // minutes
  }
  for (const h of history) {
    const d = localDateStr(new Date(h.timestamp));
    if (d in map) map[d] += getHistoryMinutes(h);
  }
  return Object.entries(map).map(([date, minutes]) => ({
    date,
    minutes,
    intensity: minutes === 0 ? 0
      : minutes <= 25  ? 1
      : minutes <= 60  ? 2
      : minutes <= 120 ? 3
      : 4,
  }));
}

// ─── Year Grid (365 ngày, GitHub-style) ──────────────────────────────────────
export function computeYearGrid(history) {
  const now = Date.now();
  const map = {};
  for (let i = 364; i >= 0; i--) {
    const d = localDateStr(now - i * 86_400_000);
    map[d] = 0;
  }
  for (const h of history) {
    const d = localDateStr(new Date(h.timestamp));
    if (d in map) map[d] += getHistoryMinutes(h);
  }
  return Object.entries(map).map(([date, minutes]) => ({
    date,
    minutes,
    intensity: minutes === 0 ? 0
      : minutes <= 25  ? 1
      : minutes <= 60  ? 2
      : minutes <= 120 ? 3
      : 4,
  }));
}

// ─── Thống kê phân tích theo category ────────────────────────────────────────
export function computeCategoryStats(history, categories) {
  const catMap = {};
  for (const cat of categories) {
    catMap[cat.id] = { ...cat, sessions: 0, completed: 0, cancelled: 0, minutes: 0, xp: 0 };
  }
  // Bucket "không có category"
  catMap['__none__'] = { id: '__none__', label: 'Chưa phân loại', color: '#475569', icon: '❓', sessions: 0, completed: 0, cancelled: 0, minutes: 0, xp: 0 };

  for (const h of history) {
    if (h.categoryId && !catMap[h.categoryId] && h.categorySnapshot) {
      catMap[h.categoryId] = {
        id: h.categoryId,
        label: h.categorySnapshot.label ?? 'Loại cũ',
        color: h.categorySnapshot.color ?? '#475569',
        icon: h.categorySnapshot.icon ?? '🏷️',
        sessions: 0,
        completed: 0,
        cancelled: 0,
        minutes: 0,
        xp: 0,
      };
    }
    const key = h.categoryId && catMap[h.categoryId] ? h.categoryId : '__none__';
    const isCancelled = isCancelledHistoryEntry(h);
    catMap[key].sessions += 1;
    catMap[key].completed = (catMap[key].completed ?? 0) + (isCancelled ? 0 : 1);
    catMap[key].cancelled = (catMap[key].cancelled ?? 0) + (isCancelled ? 1 : 0);
    catMap[key].minutes  += getHistoryMinutes(h);
    catMap[key].xp       += getHistoryXP(h);
  }

  return Object.values(catMap)
    .filter((c) => c.sessions > 0)
    .sort((a, b) => b.minutes - a.minutes);
}

// ─── Thống kê theo khoảng thời gian ──────────────────────────────────────────
/**
 * computePeriodStats
 * @param {Array} history
 * @param {'day'|'week'|'month'|'quarter'|'year'} period — period type
 * @param {number} n — số period muốn lấy (e.g. 7 days, 4 weeks...)
 * @returns {Array<{label, sessions, minutes, xp}>}
 */
export function computePeriodStats(history, period, n = 7) {
  const now = Date.now();
  const buckets = [];
  const applyHistoryEntryToBucket = (bucket, entry) => {
    const isCancelled = isCancelledHistoryEntry(entry);
    bucket.sessions += 1;
    bucket.completed = (bucket.completed ?? 0) + (isCancelled ? 0 : 1);
    bucket.cancelled = (bucket.cancelled ?? 0) + (isCancelled ? 1 : 0);
    bucket.minutes += getHistoryMinutes(entry);
    bucket.xp += getHistoryXP(entry);
  };

  if (period === 'day') {
    for (let i = n - 1; i >= 0; i--) {
      const ts  = now - i * 86_400_000;
      const d   = localDateStr(ts);
      buckets.push({
        key:      d,
        label:    formatVietnamDate(ts, { weekday: 'short', day: 'numeric', month: 'numeric' }),
        sessions: 0, completed: 0, cancelled: 0, minutes: 0, xp: 0,
      });
    }
    for (const h of history) {
      const d = localDateStr(new Date(h.timestamp));
      const b = buckets.find((bk) => bk.key === d);
      if (b) applyHistoryEntryToBucket(b, h);
    }
  } else if (period === 'week') {
    for (let i = n - 1; i >= 0; i--) {
      const referenceTs = now - i * 7 * 86_400_000;
      const weekKey = localWeekMondayStr(referenceTs);
      const label = `T${formatVietnamDate(weekKey, { day: 'numeric', month: 'numeric' })}`;
      buckets.push({ key: weekKey, label, sessions: 0, completed: 0, cancelled: 0, minutes: 0, xp: 0 });
    }
    for (const h of history) {
      const weekKey = localWeekMondayStr(h.timestamp);
      const b  = buckets.find((bk) => bk.key === weekKey);
      if (b) applyHistoryEntryToBucket(b, h);
    }
  } else if (period === 'month') {
    for (let i = n - 1; i >= 0; i--) {
      const startTs = startOfVietnamMonthTs(now, -i);
      const endTs = startOfVietnamMonthTs(now, -i + 1);
      const label = formatVietnamDate(startTs, { month: 'short', year: '2-digit' });
      buckets.push({ startTs, endTs, label, sessions: 0, completed: 0, cancelled: 0, minutes: 0, xp: 0 });
    }
    for (const h of history) {
      const ts = new Date(h.timestamp).getTime();
      const b  = buckets.find((bk) => ts >= bk.startTs && ts < bk.endTs);
      if (b) applyHistoryEntryToBucket(b, h);
    }
  } else if (period === 'quarter') {
    for (let i = n - 1; i >= 0; i--) {
      const startTs = startOfVietnamQuarterTs(now, -i);
      const endTs = startOfVietnamQuarterTs(now, -i + 1);
      const { month, year } = getVietnamDateParts(startTs);
      const qNum = Math.floor((month - 1) / 3) + 1;
      const label = `Q${qNum}/${String(year).slice(-2)}`;
      buckets.push({ startTs, endTs, label, sessions: 0, completed: 0, cancelled: 0, minutes: 0, xp: 0 });
    }
    for (const h of history) {
      const ts = new Date(h.timestamp).getTime();
      const b  = buckets.find((bk) => ts >= bk.startTs && ts < bk.endTs);
      if (b) applyHistoryEntryToBucket(b, h);
    }
  } else if (period === 'year') {
    for (let i = n - 1; i >= 0; i--) {
      const startTs = startOfVietnamYearTs(now, -i);
      const endTs = startOfVietnamYearTs(now, -i + 1);
      const { year } = getVietnamDateParts(startTs);
      buckets.push({ startTs, endTs, label: String(year), sessions: 0, completed: 0, cancelled: 0, minutes: 0, xp: 0 });
    }
    for (const h of history) {
      const ts = new Date(h.timestamp).getTime();
      const b  = buckets.find((bk) => ts >= bk.startTs && ts < bk.endTs);
      if (b) applyHistoryEntryToBucket(b, h);
    }
  }

  return buckets;
}

// ─── Thống kê theo giờ trong ngày (phân tích giờ tập trung tốt nhất) ─────────
export function computeHourlyStats(history) {
  const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, sessions: 0, completed: 0, cancelled: 0, minutes: 0 }));
  for (const h of history) {
    const hr = getVietnamHour(h.timestamp);
    const isCancelled = isCancelledHistoryEntry(h);
    hours[hr].sessions += 1;
    hours[hr].completed += isCancelled ? 0 : 1;
    hours[hr].cancelled += isCancelled ? 1 : 0;
    hours[hr].minutes  += getHistoryMinutes(h);
  }
  return hours;
}

// ─── Thống kê tóm tắt cho khoảng thời gian cụ thể ───────────────────────────
export function computeRangeSummary(history, startTs, endTs) {
  const filtered = history.filter((h) => {
    const ts = new Date(h.timestamp).getTime();
    return ts >= startTs && ts <= endTs;
  });
  return {
    sessions:   filtered.length,
    completed:  filtered.filter((h) => !isCancelledHistoryEntry(h)).length,
    cancelled:  filtered.filter(isCancelledHistoryEntry).length,
    minutes:    filtered.reduce((s, h) => s + getHistoryMinutes(h), 0),
    xp:         filtered.reduce((s, h) => s + (h.xpEarned ?? 0), 0),
    jackpots:   filtered.filter((h) => !isCancelledHistoryEntry(h) && h.jackpot).length,
    blueprints: filtered.filter((h) => !isCancelledHistoryEntry(h) && ((h.refinedEarned ?? 0) > 0 || (h.minutes ?? 0) >= 45)).length,
    avgMinutes: filtered.length > 0
      ? Math.round(filtered.reduce((s, h) => s + getHistoryMinutes(h), 0) / filtered.length)
      : 0,
  };
}
