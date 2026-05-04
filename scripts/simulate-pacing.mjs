import {
  BASE_EP_PER_MINUTE,
  BASE_XP_PER_MINUTE,
  BLUEPRINT_META,
  CHUOI_NGAY_MAX_DAYS,
  CHUOI_NGAY_XP_PER_DAY,
  DA_NANG_MIN_CATEGORIES,
  DA_NANG_RP_BONUS,
  DA_TAP_TRUNG_MAX_STACKS,
  DA_TAP_TRUNG_STACK_BONUS,
  DEFAULT_SESSION_CATEGORIES,
  EP_MULTIPLIER_TIERS,
  ERA_THRESHOLDS,
  EXP_PER_LEVEL,
  NHAN_QUAN_RP_BONUS,
  NHIP_SINH_HOC_MIN_SESSIONS,
  NHIP_SINH_HOC_XP_BONUS,
  NAP_NANG_LUONG_XP_BONUS,
  PHIEN_VANG_SANG_XP_BONUS,
  PRESTIGE_EP_REQUIREMENT,
  RP_CATEGORY_MULT,
  RP_PER_MINUTE_BASE,
  SKILL_TREE,
  SP_PER_LEVEL,
  STORAGE_VAULT_XP_PER_MINUTE,
  STORAGE_VAULT_XP_PER_MINUTE_ENHANCED,
  WARMUP_REDUCED_THRESHOLD,
  BAN_TAY_VANG_RP_BONUS,
  LINH_CAM_RP_BONUS,
  CHUYEN_MON_HOA_MAX_CATS,
  CHUYEN_MON_HOA_RP_PER_CAT,
  CHUYEN_MON_HOA_XP_PER_CAT,
  CHUYEN_GIA_MIN_SESSIONS,
  CHUYEN_GIA_RP_BONUS,
  CHUYEN_GIA_XP_BONUS,
} from '../src/engine/constants.js';

const DEFAULT_PROFILE = {
  sessionsPerDay: 12,
  minutesPerSession: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 30,
  longBreakAfterN: 3,
};

const SKILL_PRIORITY_25M = [
  'khoi_dong_nhanh',
  'chuyen_can',
  'hit_tho_sau',
  'nap_nang_luong',
  'ban_tay_vang',
  'da_nang',
  'kho_du_tru',
  'phien_vang_sang',
  'da_tap_trung',
  'nhan_quan',
  'bo_nho_co_bap',
  'su_tha_thu',
  'ky_uc_ky_nguyen',
  'tri_tue_tich_luy',
  'nhip_sinh_hoc',
  'chuoi_ngay',
  'linh_cam',
  'chuyen_mon_hoa',
  'phuc_hoi',
];

const SKILL_NODE_MAP = new Map(
  Object.values(SKILL_TREE)
    .flatMap((branch) => branch.nodes)
    .map((node) => [node.id, node]),
);

const BLUEPRINT_ENTRIES = Object.entries(BLUEPRINT_META)
  .sort((a, b) => a[1].era - b[1].era || a[1].rpCost - b[1].rpCost || a[0].localeCompare(b[0]));

function getEra(totalEP) {
  if (totalEP < ERA_THRESHOLDS.ERA_1_END) return 1;
  if (totalEP < ERA_THRESHOLDS.ERA_2_END) return 2;
  if (totalEP < ERA_THRESHOLDS.ERA_3_END) return 3;
  if (totalEP < ERA_THRESHOLDS.ERA_4_END) return 4;
  if (totalEP < ERA_THRESHOLDS.ERA_5_END) return 5;
  if (totalEP < ERA_THRESHOLDS.ERA_6_END) return 6;
  if (totalEP < ERA_THRESHOLDS.ERA_7_END) return 7;
  if (totalEP < ERA_THRESHOLDS.ERA_8_END) return 8;
  if (totalEP < ERA_THRESHOLDS.ERA_9_END) return 9;
  if (totalEP < ERA_THRESHOLDS.ERA_10_END) return 10;
  if (totalEP < ERA_THRESHOLDS.ERA_11_END) return 11;
  if (totalEP < ERA_THRESHOLDS.ERA_12_END) return 12;
  if (totalEP < ERA_THRESHOLDS.ERA_13_END) return 13;
  if (totalEP < ERA_THRESHOLDS.ERA_14_END) return 14;
  return 15;
}

function getEpMultiplier(minutesFocused) {
  if (minutesFocused >= 60) return EP_MULTIPLIER_TIERS[2].multiplier;
  if (minutesFocused >= 26) return EP_MULTIPLIER_TIERS[1].multiplier;
  return EP_MULTIPLIER_TIERS[0].multiplier;
}

function canBuySkill(unlocked, skillId, currentSP) {
  const node = SKILL_NODE_MAP.get(skillId);
  if (!node || unlocked.has(skillId)) return false;
  if (currentSP < (node.spCost ?? 0)) return false;
  return (node.requires ?? []).every((requiredId) => unlocked.has(requiredId));
}

function autoBuySkills(unlocked, wallet) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const skillId of SKILL_PRIORITY_25M) {
      if (!canBuySkill(unlocked, skillId, wallet.value)) continue;
      wallet.value -= SKILL_NODE_MAP.get(skillId).spCost ?? 0;
      unlocked.add(skillId);
      changed = true;
    }
  }
}

function autoResearchBlueprints(state) {
  let changed = true;
  while (changed) {
    changed = false;
    const activeEra = getEra(state.ep);
    for (const [bpId, meta] of BLUEPRINT_ENTRIES) {
      if (state.researched.has(bpId)) continue;
      if ((meta.requiresEra ?? meta.era ?? 1) > activeEra) continue;
      if (state.rp < (meta.rpCost ?? 0)) continue;
      state.rp -= meta.rpCost ?? 0;
      state.researched.add(bpId);
      changed = true;
    }
  }
}

function applyLevelUps(state, previousXP) {
  const prevLevel = Math.floor(previousXP / EXP_PER_LEVEL);
  const nextLevel = Math.floor(state.xp / EXP_PER_LEVEL);
  if (nextLevel > prevLevel) {
    state.sp += (nextLevel - prevLevel) * SP_PER_LEVEL;
    const wallet = { value: state.sp };
    autoBuySkills(state.unlocked, wallet);
    state.sp = wallet.value;
  }
}

function makeSnapshot(state, day) {
  return {
    day,
    era: getEra(state.ep),
    ep: Math.round(state.ep),
    xp: Math.round(state.xp),
    level: Math.floor(state.xp / EXP_PER_LEVEL),
    spUnspent: state.sp,
    rpUnspent: Math.round(state.rp),
    researchedBlueprints: state.researched.size,
    unlockedSkills: state.unlocked.size,
  };
}

function parseProfile() {
  const profile = { ...DEFAULT_PROFILE };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--sessions=')) profile.sessionsPerDay = Number(arg.split('=')[1]) || profile.sessionsPerDay;
    if (arg.startsWith('--minutes=')) profile.minutesPerSession = Number(arg.split('=')[1]) || profile.minutesPerSession;
  }
  return profile;
}

function simulate(profile) {
  const state = {
    ep: 0,
    xp: 0,
    sp: 0,
    rp: 0,
    streakDays: 0,
    researched: new Set(),
    unlocked: new Set(),
    weeklyCategories: new Set(),
  };

  const milestones = {};
  const eraEntryDays = {};
  let allBlueprintsDay = null;
  let prestigeDay = null;

  for (let day = 1; day <= 730; day += 1) {
    if (day > 1) state.streakDays += 1;

    const categoriesToday = new Set();
    let lastCategoryId = null;
    let consecutiveSameCategory = 0;

    for (let sessionIndex = 0; sessionIndex < profile.sessionsPerDay; sessionIndex += 1) {
      const categoryId = DEFAULT_SESSION_CATEGORIES[sessionIndex % DEFAULT_SESSION_CATEGORIES.length].id;
      const isNewCategoryToday = !categoriesToday.has(categoryId);
      const uniqueCategoriesToday = new Set([...categoriesToday, categoryId]).size;
      consecutiveSameCategory = lastCategoryId === categoryId ? consecutiveSameCategory + 1 : 1;
      lastCategoryId = categoryId;

      let xpMultiplier = profile.minutesPerSession >= WARMUP_REDUCED_THRESHOLD && state.unlocked.has('khoi_dong_nhanh')
        ? 1.3
        : 1.0;
      let xpBonusPct = 0;
      let rpBonusPct = 0;

      if (state.unlocked.has('da_tap_trung') && sessionIndex > 0) {
        xpBonusPct += Math.min(sessionIndex, DA_TAP_TRUNG_MAX_STACKS) * DA_TAP_TRUNG_STACK_BONUS;
      }
      if (state.unlocked.has('nap_nang_luong') && sessionIndex > 0) {
        xpBonusPct += NAP_NANG_LUONG_XP_BONUS;
      }
      if (state.unlocked.has('phien_vang_sang') && sessionIndex === 0) {
        xpBonusPct += PHIEN_VANG_SANG_XP_BONUS;
      }
      if (state.unlocked.has('nhip_sinh_hoc') && (sessionIndex + 1) >= NHIP_SINH_HOC_MIN_SESSIONS) {
        xpBonusPct += NHIP_SINH_HOC_XP_BONUS;
      }
      if (state.unlocked.has('chuoi_ngay') && state.streakDays > 0) {
        xpBonusPct += Math.min(state.streakDays, CHUOI_NGAY_MAX_DAYS) * CHUOI_NGAY_XP_PER_DAY;
      }
      if (state.unlocked.has('ban_tay_vang')) rpBonusPct += BAN_TAY_VANG_RP_BONUS;
      if (state.unlocked.has('nhan_quan')) rpBonusPct += NHAN_QUAN_RP_BONUS;
      if (state.unlocked.has('linh_cam')) rpBonusPct += LINH_CAM_RP_BONUS;
      if (state.unlocked.has('da_nang') && uniqueCategoriesToday >= DA_NANG_MIN_CATEGORIES) {
        rpBonusPct += DA_NANG_RP_BONUS;
      }
      if (state.unlocked.has('chuyen_mon_hoa') && state.weeklyCategories.size > 0) {
        const stacks = Math.min(state.weeklyCategories.size, CHUYEN_MON_HOA_MAX_CATS);
        xpBonusPct += stacks * CHUYEN_MON_HOA_XP_PER_CAT;
        rpBonusPct += stacks * CHUYEN_MON_HOA_RP_PER_CAT;
      }
      if (state.unlocked.has('chuyen_gia') && consecutiveSameCategory >= CHUYEN_GIA_MIN_SESSIONS) {
        xpBonusPct += CHUYEN_GIA_XP_BONUS;
        rpBonusPct += CHUYEN_GIA_RP_BONUS;
      }

      const previousXP = state.xp;
      state.xp += Math.round(profile.minutesPerSession * BASE_XP_PER_MINUTE * xpMultiplier * (1 + xpBonusPct));
      state.ep += Math.round(profile.minutesPerSession * BASE_EP_PER_MINUTE * getEpMultiplier(profile.minutesPerSession));
      state.rp += Math.round(
        profile.minutesPerSession
        * RP_PER_MINUTE_BASE
        * (isNewCategoryToday ? RP_CATEGORY_MULT : 1)
        * (1 + rpBonusPct),
      );

      applyLevelUps(state, previousXP);
      categoriesToday.add(categoryId);
      state.weeklyCategories.add(categoryId);
      autoResearchBlueprints(state);
    }

    if (state.unlocked.has('kho_du_tru')) {
      let breakMinutes = 0;
      for (let breakIndex = 1; breakIndex < profile.sessionsPerDay; breakIndex += 1) {
        breakMinutes += breakIndex % profile.longBreakAfterN === 0
          ? profile.longBreakMinutes
          : profile.shortBreakMinutes;
      }
      const passiveXPPerMinute = state.unlocked.has('nghi_ngoi_hoan_hao')
        ? STORAGE_VAULT_XP_PER_MINUTE_ENHANCED
        : STORAGE_VAULT_XP_PER_MINUTE;
      const previousXP = state.xp;
      state.xp += breakMinutes * passiveXPPerMinute;
      applyLevelUps(state, previousXP);
    }

    const activeEra = getEra(state.ep);
    eraEntryDays[activeEra] ??= day;

    if (!allBlueprintsDay && state.researched.size === BLUEPRINT_ENTRIES.length) {
      allBlueprintsDay = day;
    }
    if (!milestones.day90 && day >= 90) milestones.day90 = makeSnapshot(state, day);
    if (!milestones.day180 && day >= 180) milestones.day180 = makeSnapshot(state, day);
    if (!milestones.day270 && day >= 270) milestones.day270 = makeSnapshot(state, day);
    if (!milestones.day365 && day >= 365) milestones.day365 = makeSnapshot(state, day);
    if (!prestigeDay && state.ep >= PRESTIGE_EP_REQUIREMENT) {
      prestigeDay = day;
      milestones.prestige = makeSnapshot(state, day);
      break;
    }
  }

  return {
    profile,
    completionCondition: `progress.totalEP >= ${PRESTIGE_EP_REQUIREMENT}`,
    assumptions: [
      'save mới, không Prestige trước đó',
      '12 phiên 25 phút mỗi ngày',
      'xoay 6 category mặc định để nhận RP category mới mỗi ngày',
      'không tính jackpot, overclock, positive event, wonder bonus và mission RNG',
      'tự mua kỹ năng theo priority dành cho profile 25 phút',
      'tự research bản vẽ hiện tại ngay khi đủ RP và đủ kỷ nguyên',
    ],
    prestigeDay,
    allBlueprintsDay,
    eraEntryDays,
    milestones,
  };
}

const result = simulate(parseProfile());
console.log(JSON.stringify(result, null, 2));
