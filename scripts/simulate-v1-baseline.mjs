#!/usr/bin/env node
/**
 * simulate-v1-baseline.mjs
 * Mô phỏng V1 — bộ skill HIỆN TẠI (chưa thay đổi).
 * Dùng giá trị ĐÚNG từ constants.js để so sánh apples-to-apples với V2.
 */

const ERA_THRESHOLDS = [1300,3000,5000,7400,10400,14100,18500,24100,29600,37400,46900,58700,73000,90200,111000];
const ERA_15_END = 111000;
const BASE_XP_PER_MINUTE = 1, BASE_EP_PER_MINUTE = 1;
const EP_TIER = { short: 1.0, medium: 1.1, long: 1.2 };
const DEEP_FOCUS_THRESHOLD = 26;
const WARMUP_REDUCED_THRESHOLD = 20;
const VUNG_DONG_CHAY_MIN_MIN = 45;
const TAP_TRUNG_SV_MIN_MIN = 60;
const TIME_BENDER_CHANCE = 0.015;
const JACKPOT_CHANCE = 0.025;
const JACKPOT_MULTIPLIER = 2.5;
const XP_FACTOR_HARD_CAP = 4.25;
const EXP_PER_LEVEL = 6000;
const SP_PER_LEVEL = 2;

// Skill values V1 (current)
const CHUYEN_CAN_MIN = 25, CHUYEN_CAN_XP = 0.06;
const DA_TAP_TRUNG_PER = 0.02, DA_TAP_TRUNG_MAX = 4;
const TAP_TRUNG_SV_XP = 0.15;
const PHIEN_VANG_SANG_XP = 0.08;
const NHIP_SINH_HOC_XP = 0.12, NHIP_SINH_HOC_AFTER = 4;
const NAP_NANG_LUONG_XP = 0.08;
const CHUOI_NGAY_PER_DAY = 0.004, CHUOI_NGAY_MAX = 24;
const TRI_TUE_TICH_LUY_PER_ERA = 0.005, TRI_TUE_TICH_LUY_MAX_ERAS = 15;
const BAC_THAY_KY_NGUYEN_PER = 0.015, BAC_THAY_KY_NGUYEN_MAX = 0.12, BAC_THAY_KY_NGUYEN_SESSIONS = 100;
const KY_UC_KY_NGUYEN_XP = 0.18;
const STREAK_BONUS_PER_DAY = 0.012; // ĐÚNG
const STREAK_MAX_BONUS_DAYS = 15;   // ĐÚNG
const RANK_ALLBONUS = [0, 0.10, 0.15, 0.22, 0.27];

// V1 Synergies
const V1_SYNERGIES = [
  { id: 'zen_warrior', requires: { THIEN_DINH: 2, Y_CHI: 2 }, bonus: 0.08 },
  { id: 'balanced_scholar', requires: { CHIEN_LUOC: 2, NGHI_NGOI: 2 }, bonus: 0.08 },
  { id: 'fortune_seeker', requires: { VAN_MAY: 2, THANG_HOA: 2 }, bonus: 0.10 },
  { id: 'iron_monk', requires: { THIEN_DINH: 3, NGHI_NGOI: 2 }, bonus: 0.10 },
  { id: 'grand_strategist', requires: { Y_CHI: 3, CHIEN_LUOC: 2 }, bonus: 0.12 },
  { id: 'full_mastery', requires: { THIEN_DINH: 1, Y_CHI: 1, NGHI_NGOI: 1, VAN_MAY: 1, CHIEN_LUOC: 1, THANG_HOA: 1 }, bonus: 0.15 },
];

// V1 SKILL_TREE
const V1_SKILL_TREE = {
  THIEN_DINH: [
    { id: 'khoi_dong_nhanh', cost: 3, requires: [] },
    { id: 'chuyen_can', cost: 3, requires: [] },
    { id: 'da_tap_trung', cost: 7, requires: ['khoi_dong_nhanh'] },
    { id: 'vung_dong_chay', cost: 7, requires: ['chuyen_can'] },
    { id: 'tap_trung_sieu_viet', cost: 14, requires: ['vung_dong_chay'] },
    { id: 'sieu_tap_trung', cost: 22, requires: ['tap_trung_sieu_viet'] },
  ],
  Y_CHI: [
    { id: 'su_tha_thu', cost: 3, requires: [] },
    { id: 'bo_nho_co_bap', cost: 3, requires: [] },
    { id: 'phuc_hoi', cost: 7, requires: ['su_tha_thu'] },
    { id: 'chuoi_ngay', cost: 7, requires: ['bo_nho_co_bap'] },
    { id: 'y_chi_thep', cost: 14, requires: ['chuoi_ngay'] },
    { id: 'bat_khuat', cost: 22, requires: ['y_chi_thep'] },
  ],
  NGHI_NGOI: [
    { id: 'hit_tho_sau', cost: 3, requires: [] },
    { id: 'nap_nang_luong', cost: 3, requires: [] },
    { id: 'kho_du_tru', cost: 7, requires: ['hit_tho_sau'] },
    { id: 'phien_vang_sang', cost: 7, requires: ['nap_nang_luong'] },
    { id: 'nhip_sinh_hoc', cost: 14, requires: ['phien_vang_sang'] },
    { id: 'nghi_ngoi_hoan_hao', cost: 22, requires: ['nhip_sinh_hoc'] },
  ],
  VAN_MAY: [
    { id: 'ban_tay_vang', cost: 3, requires: [] },
    { id: 'nhan_quan', cost: 3, requires: [] },
    { id: 'linh_cam', cost: 7, requires: ['ban_tay_vang'] },
    { id: 'be_cong_thoi_gian', cost: 7, requires: ['nhan_quan'] },
    { id: 'dai_trung_thuong', cost: 14, requires: ['be_cong_thoi_gian'] },
    { id: 'so_do', cost: 22, requires: ['dai_trung_thuong'] },
  ],
  CHIEN_LUOC: [
    { id: 'chuyen_gia', cost: 3, requires: [] },
    { id: 'da_nang', cost: 3, requires: [] },
    { id: 'chuyen_mon_hoa', cost: 7, requires: ['chuyen_gia'] },
    { id: 'can_bang', cost: 7, requires: ['da_nang'] },
    { id: 'bac_thay_chien_luoc', cost: 14, requires: ['chuyen_mon_hoa'] },
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

const V1_UNLOCK_ORDER = [
  'khoi_dong_nhanh','chuyen_can','su_tha_thu','bo_nho_co_bap',
  'hit_tho_sau','nap_nang_luong','ky_uc_ky_nguyen','tri_tue_tich_luy',
  'chuyen_gia','da_nang','ban_tay_vang','nhan_quan',
  'da_tap_trung','vung_dong_chay','phuc_hoi','chuoi_ngay',
  'kho_du_tru','phien_vang_sang','chuyen_mon_hoa','can_bang',
  'linh_cam','be_cong_thoi_gian','kien_thuc_nen','bac_thay_ky_nguyen',
  'tap_trung_sieu_viet','y_chi_thep','nhip_sinh_hoc',
  'bac_thay_chien_luoc','dai_trung_thuong','ke_thua',
  'sieu_tap_trung','bat_khuat','nghi_ngoi_hoan_hao',
  'so_do','ke_hoach_hoan_hao','sieu_viet',
];

const PROFILES = {
  CASUAL:   { label:'Casual',   sessionsPerDay:()=>randInt(2,4),  sessionLength:()=>choose([[25,0.85],[30,0.10],[45,0.05]]),                                  skipDayChance:0.43, cancelRate:0.10, rankAttemptInterval:12, rankSuccessRate:0.55, eraCrisisChallengeRate:0.40 },
  REGULAR:  { label:'Đều đặn',  sessionsPerDay:()=>randInt(4,6),  sessionLength:()=>choose([[25,0.55],[30,0.20],[45,0.15],[50,0.07],[60,0.03]]),               skipDayChance:0.14, cancelRate:0.07, rankAttemptInterval:7,  rankSuccessRate:0.75, eraCrisisChallengeRate:0.65 },
  ENGAGED:  { label:'Tập trung cao', sessionsPerDay:()=>randInt(6,8), sessionLength:()=>choose([[25,0.40],[30,0.20],[45,0.18],[60,0.15],[75,0.05],[90,0.02]]), skipDayChance:0.07, cancelRate:0.05, rankAttemptInterval:5,  rankSuccessRate:0.85, eraCrisisChallengeRate:0.85 },
  HARDCORE: { label:'Hardcore', sessionsPerDay:()=>randInt(7,10), sessionLength:()=>choose([[25,0.20],[45,0.30],[60,0.30],[75,0.12],[90,0.08]]),               skipDayChance:0.02, cancelRate:0.03, rankAttemptInterval:3,  rankSuccessRate:0.95, eraCrisisChallengeRate:0.95 },
};

function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function rand(){return Math.random();}
function choose(w){const t=w.reduce((s,[,x])=>s+x,0);let r=rand()*t;for(const[v,x]of w){r-=x;if(r<=0)return v;}return w[w.length-1][0];}
function getActiveBook(ep){for(let i=0;i<ERA_THRESHOLDS.length;i++)if(ep<ERA_THRESHOLDS[i])return i+1;return 15;}
function findSkill(id){for(const b of Object.values(V1_SKILL_TREE)){const f=b.find(n=>n.id===id);if(f)return f;}return null;}
function getMultiplierTier(min,warmup){const t=warmup?WARMUP_REDUCED_THRESHOLD:DEEP_FOCUS_THRESHOLD;if(min>=60)return 2.0;if(min>=t)return 1.3;return 1.0;}
function getEpTier(min){if(min>=60)return EP_TIER.long;if(min>=DEEP_FOCUS_THRESHOLD)return EP_TIER.medium;return EP_TIER.short;}
function applyTimeBender(min,has){if(!has)return min;let b=0;for(let i=0;i<min;i++)if(rand()<TIME_BENDER_CHANCE)b++;return min+b;}
function applyVDC(t,min,has){if(!has||min<VUNG_DONG_CHAY_MIN_MIN)return t;if(t<1.3)return 1.3;if(t<2.0)return 2.0;return t;}

function calc(min, ctx) {
  const { unlockedSkills:u, allBonus, epBonus, sessionsToday, currentStreak, isFirstToday, justEnteredEra, breakOnTime, lastCancel, erasCompleted, sessionsInEra, branchCounts } = ctx;
  const eff = applyTimeBender(min, !!u.be_cong_thoi_gian);
  let tier = getMultiplierTier(min, !!u.khoi_dong_nhanh);
  tier = applyVDC(tier, min, !!u.vung_dong_chay);
  const jp = u.dai_trung_thuong && rand() < JACKPOT_CHANCE;
  const jpMul = jp ? JACKPOT_MULTIPLIER : 1;

  let sk = 0;
  if (u.chuyen_can && min >= CHUYEN_CAN_MIN) sk += CHUYEN_CAN_XP;
  if (u.da_tap_trung && sessionsToday > 0) sk += Math.min(sessionsToday, DA_TAP_TRUNG_MAX) * DA_TAP_TRUNG_PER;
  if (u.tap_trung_sieu_viet && min >= TAP_TRUNG_SV_MIN_MIN) sk += TAP_TRUNG_SV_XP;
  if (u.phien_vang_sang && isFirstToday) sk += PHIEN_VANG_SANG_XP;
  if (u.nhip_sinh_hoc && (sessionsToday + 1) >= NHIP_SINH_HOC_AFTER) sk += NHIP_SINH_HOC_XP;
  if (u.nap_nang_luong && breakOnTime) sk += NAP_NANG_LUONG_XP;
  if (u.phuc_hoi && lastCancel) sk += 0.12;
  if (u.chuoi_ngay && currentStreak > 0) sk += Math.min(currentStreak, CHUOI_NGAY_MAX) * CHUOI_NGAY_PER_DAY;
  if (u.tri_tue_tich_luy && erasCompleted > 0) sk += Math.min(erasCompleted, TRI_TUE_TICH_LUY_MAX_ERAS) * TRI_TUE_TICH_LUY_PER_ERA;
  if (u.bac_thay_ky_nguyen && sessionsInEra > 0) {
    const stacks = Math.floor(sessionsInEra / BAC_THAY_KY_NGUYEN_SESSIONS);
    sk += Math.min(stacks * BAC_THAY_KY_NGUYEN_PER, BAC_THAY_KY_NGUYEN_MAX);
  }
  if (u.ky_uc_ky_nguyen && justEnteredEra) sk += KY_UC_KY_NGUYEN_XP;

  // V1 synergies (no length gating)
  let syn = 0;
  for (const s of V1_SYNERGIES) {
    const ok = Object.entries(s.requires).every(([br, mn]) => (branchCounts[br] ?? 0) >= mn);
    if (ok) syn += s.bonus;
  }
  sk += syn;

  const streakBonus = Math.min(currentStreak, STREAK_MAX_BONUS_DAYS) * STREAK_BONUS_PER_DAY;
  const xpFactor = Math.min(1 + allBonus + sk, XP_FACTOR_HARD_CAP);
  const epFactor = 1 + epBonus + allBonus; // V1 không có cap

  const baseXP = eff * BASE_XP_PER_MINUTE;
  const xp1 = Math.round(baseXP * tier * jpMul * xpFactor);
  const streakXP = Math.floor(xp1 * streakBonus);
  const finalXP = xp1 + streakXP;
  const ep = Math.round(eff * BASE_EP_PER_MINUTE * getEpTier(min) * epFactor);
  return { finalXP, finalEP: ep, jackpot: jp };
}

function tryUnlock(state) {
  let prog = true;
  while (prog) {
    prog = false;
    for (const id of V1_UNLOCK_ORDER) {
      if (state.unlockedSkills[id]) continue;
      const n = findSkill(id);
      if (!n || state.sp < n.cost) continue;
      if (!n.requires.every(r => state.unlockedSkills[r])) continue;
      state.unlockedSkills[id] = true;
      state.sp -= n.cost;
      prog = true;
    }
  }
}

function branchCounts(u) {
  const c = {};
  for (const [k, b] of Object.entries(V1_SKILL_TREE)) c[k] = b.filter(n => !!u[n.id]).length;
  return c;
}

function simulate(profileKey, maxDays = 1500) {
  const p = PROFILES[profileKey];
  const s = { day:0, totalEP:0, totalEXP:0, level:0, sp:0, sessionsCompleted:0, sessionsInEra:0, erasCompleted:0, currentBook:1, currentStreak:0, longestStreak:0, daysSinceRank:0, daysActive:0, daysSkipped:0, minutesTotal:0, sessionsCancelled:0, jackpotsHit:0, unlockedSkills:{}, ranks:{1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,10:0,11:0,12:0,13:0,14:0,15:0}, relicBuffs:{epBonus:0,allBonus:0}, eraReachDay:{} };
  for (let day = 1; day <= maxDays; day++) {
    s.day = day; s.daysSinceRank++;
    if (rand() < p.skipDayChance) { s.daysSkipped++; s.currentStreak = 0; continue; }
    s.daysActive++; s.currentStreak++;
    if (s.currentStreak > s.longestStreak) s.longestStreak = s.currentStreak;
    if (s.daysSinceRank >= p.rankAttemptInterval) {
      s.daysSinceRank = 0;
      const r = s.ranks[s.currentBook] ?? 0;
      if (r < 4 && rand() < p.rankSuccessRate) s.ranks[s.currentBook] = r + 1;
    }
    const sessions = p.sessionsPerDay();
    let stoday = 0, first = true, lastCancel = false;
    for (let i = 0; i < sessions; i++) {
      const m = p.sessionLength();
      if (rand() < p.cancelRate) { s.sessionsCancelled++; lastCancel = true; continue; }
      const ab = RANK_ALLBONUS[s.ranks[s.currentBook] ?? 0] + s.relicBuffs.allBonus;
      const r = calc(m, {
        unlockedSkills: s.unlockedSkills, allBonus: ab, epBonus: s.relicBuffs.epBonus,
        sessionsToday: stoday, currentStreak: s.currentStreak,
        isFirstToday: first, justEnteredEra: s.sessionsInEra === 0 && s.erasCompleted > 0,
        breakOnTime: true, lastCancel, erasCompleted: s.erasCompleted,
        sessionsInEra: s.sessionsInEra, branchCounts: branchCounts(s.unlockedSkills),
      });
      s.totalEP += r.finalEP; s.totalEXP += r.finalXP; s.minutesTotal += m;
      s.sessionsCompleted++; s.sessionsInEra++; stoday++; first = false; lastCancel = false;
      if (r.jackpot) s.jackpotsHit++;
      const nl = Math.floor(s.totalEXP / EXP_PER_LEVEL);
      if (nl > s.level) { s.sp += (nl - s.level) * SP_PER_LEVEL; s.level = nl; tryUnlock(s); }
      const nb = getActiveBook(s.totalEP);
      if (nb > s.currentBook) {
        s.eraReachDay[nb] = day; s.erasCompleted = nb - 1;
        s.sessionsInEra = 0; s.currentBook = nb; s.daysSinceRank = p.rankAttemptInterval;
        if (nb < 15) {
          if (rand() < p.eraCrisisChallengeRate) {
            if (rand() < 0.80) {
              const t = rand() < 0.5 ? 'epBonus' : 'allBonus';
              s.relicBuffs[t] += 0.05;
            }
          } else { s.totalEP = Math.max(0, Math.floor(s.totalEP * 0.95)); }
        }
      }
      if (s.totalEP >= ERA_15_END) return { ...s, day, ranOut: false, profileLabel: p.label };
    }
  }
  return { ...s, day: maxDays, ranOut: true, profileLabel: p.label };
}

function trials(key, n = 8) {
  const r = [];
  for (let i = 0; i < n; i++) r.push(simulate(key));
  const avg = (k) => Math.round(r.reduce((s, x) => s + (x[k] ?? 0), 0) / n);
  const min = (k) => Math.min(...r.map(x => x[k] ?? Infinity));
  const max = (k) => Math.max(...r.map(x => x[k] ?? 0));
  return {
    label: r[0].profileLabel,
    days: { avg: avg('day'), min: min('day'), max: max('day') },
    daysActive: avg('daysActive'),
    sessions: avg('sessionsCompleted'),
    minutesTotal: avg('minutesTotal'),
    avgEPPerActive: Math.round(r.reduce((s, x) => s + x.totalEP / Math.max(x.daysActive, 1), 0) / n),
    longestStreak: avg('longestStreak'),
    finalLevel: avg('level'),
    skillCount: Math.round(r.reduce((s, x) => s + Object.keys(x.unlockedSkills).length, 0) / n),
    sample: r[0],
  };
}

console.log('═══════════════════════════════════════════════════════════════════');
console.log(' BASELINE V1 — bộ skill HIỆN TẠI (giá trị streak/cap đúng)');
console.log('═══════════════════════════════════════════════════════════════════\n');

for (const k of ['CASUAL', 'REGULAR', 'ENGAGED', 'HARDCORE']) {
  const r = trials(k);
  const yr = (r.days.avg / 365).toFixed(2);
  console.log(`▸ ${r.label}`);
  console.log(`   E15 end: avg ${r.days.avg}d (${yr}y) · min ${r.days.min}d · max ${r.days.max}d`);
  console.log(`   ─ Active ${r.daysActive}d · Phiên ${r.sessions} · Streak ${r.longestStreak}d · Lvl ${r.finalLevel} · Skills ${r.skillCount}`);
  console.log(`   ─ EP/active day: ${r.avgEPPerActive}`);
  const sa = r.sample;
  const ms = [3,6,9,12,15].map(e => sa.eraReachDay[e] ? `E${e}@${sa.eraReachDay[e]}d` : `E${e}—`).join(' · ');
  console.log(`   ─ ${ms}`);
  console.log('');
}
