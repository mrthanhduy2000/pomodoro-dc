/**
 * sessionRewardStory.js — LUẬT của CHUỖI THẺ THƯỞNG sau mỗi phiên (2026-09-05, ADR-068).
 *
 * VÌ SAO CÓ. Sau ADR-060, một phiên thường kết thúc bằng một thẻ toast 4 giây ở góc màn hình —
 * và đo trên 579 phiên thật thì ~82% số phiên không còn lễ mừng nào để che (`timerSession.js`).
 * Tức khoảnh khắc DUY NHẤT mà 25 phút làm việc thật đổi thành một thứ nhìn thấy được lại là thứ
 * dễ bỏ lỡ nhất trong app. Luật peak-end: người ta nhớ một trải nghiệm bằng đỉnh và bằng cái kết
 * của nó; một cái kết ở góc màn hình thì không phải một cái kết.
 *
 * Chuỗi thẻ này là phần trình bày duy nhất ADR-060 thiếu: MỖI THẺ MỘT CON SỐ, thẻ nào cũng là
 * thứ Đàm đã thấy ở màn Tập trung (dải bảy ngày, số ngày chuỗi, nhịp hôm nay, ba nhiệm vụ) và giờ
 * được TÔ THÊM một nấc. Thứ tự là một câu chuyện: xong rồi → chuỗi vẫn sống → hôm nay tới đâu →
 * nhiệm vụ nhích gì → (lên cấp / kỷ mới, nếu có).
 *
 * ⚠️ THUẦN. Không đọc store, không đọc đồng hồ, không đổi một luật tính thưởng nào — phần thưởng
 * đã được cấp xong ở `completeFocusSession`; file này chỉ dịch nó thành thẻ. Đó là điểm cắm mà
 * ADR-060 đã chọn và `rewardFeed.js` đang dùng.
 */
import { calculateStreakMilestoneProgress } from '../engine/gameMath';
import { tierFromSessionMultiplier } from '../engine/rewardTiers';
import { ERA_METADATA, STREAK_MILESTONES } from '../engine/constants';
import { describeStreakTarget } from './todayHero';

/** Mỗi thẻ tự lật sau chừng này (ms) nếu Đàm không chạm. Bốn thẻ ≈ 10 giây, ngắn hơn một hộp thoại cũ. */
export const STORY_CARD_MS = 2600;
/** Thẻ cuối đứng lâu hơn để còn bấm "Chi tiết"; hết giờ thì tự đóng — đừng giam màn hình. */
export const STORY_LAST_CARD_MS = 9000;
/** Thẻ lên cấp / kỷ mới là tin hiếm, cho thêm nửa giây. */
const STORY_BIG_CARD_MS = 3400;

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildXpCard(reward) {
  const chips = [];
  if (reward.largeChest) chips.push({ id: 'chest', label: 'Rương Lớn' });
  const tinhLuyen = toNumber(reward.t2Drop);
  if (tinhLuyen > 0) chips.push({ id: 'refined', label: `+${tinhLuyen} tinh luyện` });
  if (toNumber(reward.streakDays) >= 2 && toNumber(reward.streakBonus) > 0) {
    chips.push({ id: 'streak', label: `Chuỗi ${reward.streakDays} ngày`, value: `+${reward.streakBonus} XP` });
  }
  if (toNumber(reward.comboCount) >= 2 && toNumber(reward.comboBonus) > 0) {
    chips.push({ id: 'combo', label: `Combo ×${reward.comboCount}`, value: `+${reward.comboBonus} XP` });
  }
  if (reward.luckyBurstApplied) chips.push({ id: 'lucky', label: 'Số Đỏ ×2.5' });
  if (toNumber(reward.overclockBonus) > 0) chips.push({ id: 'overclock', label: 'Giam cầm', value: `+${reward.overclockBonus} XP` });

  const event = reward.positiveEvent?.label
    ? {
        icon: reward.positiveEvent.icon ?? '✨',
        label: reward.positiveEvent.label,
        desc: reward.positiveEvent.desc ?? null,
        bonus: toNumber(reward.positiveEventBonus),
      }
    : null;

  return {
    id: 'xp',
    xp: toNumber(reward.totalSessionXP ?? reward.finalXP),
    baseXP: toNumber(reward.baseXP),
    minutes: toNumber(reward.effectiveMinutes),
    bonusMinutes: toNumber(reward.bonusMinutes),
    tierLabel: reward.tierLabel ?? '',
    multiplier: Number.isFinite(Number(reward.multiplier)) ? Number(reward.multiplier) : null,
    tier: tierFromSessionMultiplier(reward.multiplier, reward.jackpotApplied),
    jackpot: Boolean(reward.jackpotApplied),
    event,
    chips,
  };
}

function buildStreakCard(streak, weekDays) {
  const days = Math.max(0, Math.floor(toNumber(streak?.currentStreak)));
  if (days < 1) return null;
  const hit = STREAK_MILESTONES.find((m) => m.days === days) ?? null;
  const target = describeStreakTarget(days);
  const { nextMilestone } = calculateStreakMilestoneProgress(days);
  return {
    id: 'streak',
    days,
    weekDays: weekDays ?? [],
    justHit: Boolean(hit),
    justHitLabel: hit ? (hit.permanent ? hit.label : `mốc ${hit.days} ngày`) : null,
    justHitPermanent: Boolean(hit?.permanent),
    milestoneText: target.text,
    milestonePermanent: Boolean(nextMilestone?.permanent),
  };
}

function buildTodayCard(todayGoal, delta) {
  if (!todayGoal?.hasGoal) return null;
  const current = toNumber(todayGoal.currentValue);
  const goal = Math.max(1, toNumber(todayGoal.goalValue, 1));
  const before = Math.max(0, current - Math.max(0, toNumber(delta)));
  return {
    id: 'today',
    currentValue: current,
    goalValue: goal,
    unit: todayGoal.unit,
    pct: Math.min(100, (current / goal) * 100),
    pctBefore: Math.min(100, (before / goal) * 100),
    goalMet: current >= goal,
    remaining: Math.max(0, goal - current),
  };
}

function buildQuestsCard({ missions, completedMissionIds, missionXp, bonusXP }) {
  const list = Array.isArray(missions?.list) ? missions.list : [];
  if (list.length === 0) return null;
  const justDone = new Set(completedMissionIds ?? []);
  const rows = list.map((mission) => {
    const goal = Math.max(1, toNumber(mission.goal, 1));
    const progress = Math.min(goal, Math.max(0, toNumber(mission.progress)));
    // `justDone` là lời khẳng định của store rằng phiên này vừa hoàn thành nó ⇒ tick, kể cả khi bản
    // lưu đang soi chưa kịp ghi `claimed` (bản giả `--preview` không có phiên thật để dựng lại).
    const justDoneNow = justDone.has(mission.id);
    const done = Boolean(mission.claimed) || progress >= goal || justDoneNow;
    return {
      id: mission.id,
      label: mission.label,
      progress,
      goal,
      pct: Math.min(100, (progress / goal) * 100),
      done,
      justDone: justDoneNow,
      xp: missionXp(mission.rewardXP ?? 0),
    };
  });
  // Không có gì nhúc nhích thì đừng chiếm một thẻ: ba dòng "0/30" sau một phiên là nhiễu.
  if (!rows.some((r) => r.progress > 0 || r.justDone)) return null;
  const allDone = rows.every((r) => r.done);
  return {
    id: 'quests',
    rows,
    doneCount: rows.filter((r) => r.done).length,
    allDone,
    bonusReady: allDone && !missions.bonusClaimedToday,
    bonusClaimed: Boolean(missions.bonusClaimedToday),
    bonusXP: toNumber(bonusXP),
  };
}

/**
 * Dựng danh sách thẻ. Mọi tham số đều là dữ liệu ĐÃ đọc sẵn.
 *
 * @param {object} p
 * @param {object} p.reward              `ui.pendingReward` — phần thưởng đã cấp
 * @param {object} p.streak              `state.streak` SAU phiên
 * @param {object} p.todayGoal           kết quả `getDailyGoalProgress` SAU phiên
 * @param {number} p.todayDelta          phiên này đẩy mục tiêu ngày bao nhiêu (1 phiên, hoặc N phút)
 * @param {Array}  p.weekDays            `buildWeekStrip(...)` SAU phiên
 * @param {object} p.missions            `state.missions` SAU phiên
 * @param {string[]} p.completedMissionIds  `ui.missionCompletedIds` — nhiệm vụ phiên này vừa xong
 * @param {(xp:number)=>number} p.missionXp   phép nhân XP nhiệm vụ (đã gồm hệ số công trình)
 * @param {number} p.bonusXP             "thưởng trọn ngày", đã tính sẵn bằng `dailyAllBonusXP`
 */
export function buildRewardStoryCards({
  reward,
  streak,
  todayGoal,
  todayDelta = 1,
  weekDays = [],
  missions,
  completedMissionIds = [],
  missionXp = (xp) => xp,
  bonusXP = 0,
} = {}) {
  if (!reward) return [];
  const cards = [buildXpCard(reward)];

  const streakCard = buildStreakCard(streak, weekDays);
  if (streakCard) cards.push(streakCard);

  const todayCard = buildTodayCard(todayGoal, todayDelta);
  if (todayCard) cards.push(todayCard);

  const questsCard = buildQuestsCard({ missions, completedMissionIds, missionXp, bonusXP });
  if (questsCard) cards.push(questsCard);

  if (toNumber(reward.levelsGained) > 0) {
    cards.push({ id: 'level', newLevel: toNumber(reward.newLevel), spGained: toNumber(reward.spGained) });
  }

  if (reward.eraChanged) {
    const meta = ERA_METADATA[reward.newBook] ?? null;
    cards.push({
      id: 'era',
      newBook: toNumber(reward.newBook),
      label: meta?.label ?? `Kỷ ${reward.newBook}`,
      subLabel: meta?.subLabel ?? '',
      accent: meta?.accentColor ?? 'var(--accent)',
    });
  }

  return cards;
}

/** Thẻ đứng bao lâu rồi tự lật. */
export function storyCardDurationMs(card, isLast) {
  if (isLast) return STORY_LAST_CARD_MS;
  if (card?.id === 'level' || card?.id === 'era') return STORY_BIG_CARD_MS;
  return STORY_CARD_MS;
}
