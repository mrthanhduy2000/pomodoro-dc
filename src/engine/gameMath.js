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
