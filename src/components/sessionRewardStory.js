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
import { topCredits } from '../engine/sessionCredits.js';
import { tierFromSessionMultiplier } from '../engine/rewardTiers';
import { ERA_METADATA, RELIC_EVOLUTION, RELIC_EVOLVE_SESSIONS, STREAK_MILESTONES } from '../engine/constants';
import { describeBuff } from '../engine/buffLabel';
import { describeStreakTarget } from './todayHero';

/** Mỗi thẻ tự lật sau chừng này (ms) nếu Đàm không chạm. Bốn thẻ ≈ 10 giây, ngắn hơn một hộp thoại cũ. */
export const STORY_CARD_MS = 2600;
/** Thẻ cuối đứng lâu hơn để còn bấm "Tiếp tục"/"Xem thành phố"; hết giờ thì tự đóng — đừng giam màn hình. */
export const STORY_LAST_CARD_MS = 9000;
/** Thẻ lên cấp / kỷ mới / lên bậc / di vật / bước tuần / di vật lên bậc là tin hiếm, cho thêm nửa giây. */
const STORY_BIG_CARD_MS = 3400;
/**
 * Thẻ ĐỨNG YÊN chờ một quyết định — trả về giá trị này thay cho số mili-giây (ADR-069): thẻ lên cấp
 * có kỹ năng để chọn. Tự lật một thẻ đang hỏi "chọn cái nào" là trả lời thay người chơi.
 */
export const STORY_HOLD = null;

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildXpCard(reward) {
  const chips = [];
  // ADR-070: EP là trục kỷ nguyên — buff EP của bậc/di vật/kỳ quan phải THẤY được ở đúng thẻ này,
  // nếu không "+8% EP" chỉ là một dòng chữ trong bảng mà không ai kiểm được bằng mắt.
  if (toNumber(reward.finalEP) > 0) chips.push({ id: 'ep', label: 'Kỷ nguyên', value: `+${Math.round(toNumber(reward.finalEP))} EP` });
  // ADR-069/071: chip «+N tinh luyện» và «Rương Lớn» ĐÃ BỎ — ba đồng tiền ngủ rời khỏi đường chơi, và một
  // cái rương không còn gì để đựng thì chỉ là một cái nhãn. Bậc phiên (×1.3/×2.0) vẫn kể ở thẻ bậc.
  if (toNumber(reward.streakDays) >= 2 && toNumber(reward.streakBonus) > 0) {
    chips.push({ id: 'streak', label: `Chuỗi ${reward.streakDays} ngày`, value: `+${reward.streakBonus} XP` });
  }
  if (toNumber(reward.comboCount) >= 2 && toNumber(reward.comboBonus) > 0) {
    chips.push({ id: 'combo', label: `Combo ×${reward.comboCount}`, value: `+${reward.comboBonus} XP` });
  }
  if (reward.luckyBurstApplied) chips.push({ id: 'lucky', label: 'Số Đỏ ×2.5' });
  // ADR-069: nhánh Vận May quay ra XP/EP — một cú trúng phải ĐƯỢC THẤY ở đúng thẻ này, nếu không thì
  // "phần thưởng biến thiên" chỉ là một con số lớn hơn thường lệ mà không ai biết vì sao.
  if (toNumber(reward.luckXpBonus) > 0) chips.push({ id: 'luck-xp', label: '🍀 Vận may', value: `+${Math.round(toNumber(reward.luckXpBonus) * 100)}% XP` });
  if (toNumber(reward.luckEpBonus) > 0) chips.push({ id: 'luck-ep', label: '🍀 Vận may', value: `+${Math.round(toNumber(reward.luckEpBonus) * 100)}% EP` });
  // ADR-081: the golden beat — the surprise that happened DURING the session, paid at its end.
  if (reward.goldenBeat && toNumber(reward.goldenBonusXP) > 0) {
    chips.push({ id: 'golden', label: '🌟 Guồng vàng', value: `+${Math.round(toNumber(reward.goldenBonusXP))} XP` });
  }
  if (toNumber(reward.overclockBonus) > 0) chips.push({ id: 'overclock', label: 'Giam cầm', value: `+${reward.overclockBonus} XP` });

  /*
    ⚠️ ADR-085 — AI ĐÃ TRẢ CHO PHIÊN NÀY. Đây là mảnh còn thiếu của thẻ này suốt từ đầu: nó vốn đã
    kể chuỗi · combo · vận may · guồng vàng, nhưng KHÔNG kể kỹ năng, di vật hay đặc quyền công
    trình — tức 27/36 kỹ năng nổ đúng, mỗi phiên, và chưa từng hiện tên ở bất kỳ đâu. Đàm mở một
    kỹ năng rồi không thấy gì đổi, vì thật sự không có gì để thấy.
    ⚠️ CHỈ BA CHIP, phần dư đếm chứ không giấu (`topCredits`): một người mở hai mươi kỹ năng có thể
    nổ tám cái một phiên, và tám chip dưới một con số lớn là bức tường huy hiệu quay lại dưới hình
    dạng khác. Ba là đúng bằng hàng chip đã có ở trên (kỷ nguyên · chuỗi · combo).
  */
  const { shown: creditChips, hiddenCount } = topCredits(
    Array.isArray(reward.credits) ? reward.credits : [],
  );
  for (const c of creditChips) {
    chips.push({
      id: `credit:${c.id}`,
      label: `${c.icon} ${c.label}`,
      // Phần lớn nguồn trả XP; nguồn CHỈ trả EP thì nói bằng phần trăm, vì EP của phiên không đi
      // qua hệ số nhân bậc nên quy ra số tuyệt đối ở đây sẽ là một con số thứ hai không khớp thẻ.
      value: c.xp > 0 ? `+${c.xp} XP` : `+${Math.round(c.epPct * 100)}% EP`,
    });
  }
  if (hiddenCount > 0) chips.push({ id: 'credit-more', label: `+${hiddenCount} nguồn nữa` });

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

/**
 * ⚠️ ROUND 46 (ADR-086) — THE «NHỊP» CARD: THE STREAK AND TODAY WERE ONE FACT SHOWN TWICE.
 * These were two consecutive cards, 2,6 seconds apart, built in different rounds and never seen
 * side by side. They had the SAME SHAPE — a 56px number, a caption, a full-width strip under it —
 * and they answered the SAME question: *"nhịp của tôi đang thế nào?"*. One said it in days, the
 * other in sessions. Two cards, one thought.
 * Now one card carries both: the streak is the headline (it is the thing that can BREAK, so it
 * earns the big number), the week strip is the middle, and today's goal is the bar underneath.
 * ⚠️ NOTHING WAS DELETED. Every number the two cards printed is still on screen — `today` simply
 * became a field of this card instead of a card of its own.
 * ⚠️ AND IT STILL APPEARS WHEN THERE IS NO STREAK. A first day has `days === 0` but may well have a
 * goal in progress; gating on the streak alone would have silently dropped today's bar for exactly
 * the person who most needs to see it.
 */
function buildStreakCard(streak, weekDays, todayGoal, delta) {
  const days = Math.max(0, Math.floor(toNumber(streak?.currentStreak)));
  const today = buildTodayBlock(todayGoal, delta);
  if (days < 1 && !today) return null;
  const hit = STREAK_MILESTONES.find((m) => m.days === days) ?? null;
  const target = describeStreakTarget(days);
  const { nextMilestone } = calculateStreakMilestoneProgress(days);
  return {
    id: 'streak',
    days,
    today,
    weekDays: weekDays ?? [],
    justHit: Boolean(hit),
    justHitLabel: hit ? (hit.permanent ? hit.label : `mốc ${hit.days} ngày`) : null,
    justHitPermanent: Boolean(hit?.permanent),
    milestoneText: target.text,
    milestonePermanent: Boolean(nextMilestone?.permanent),
  };
}

/** The former «Nhịp hôm nay» card, now a block inside «streak». Same arithmetic, no `id`. */
function buildTodayBlock(todayGoal, delta) {
  if (!todayGoal?.hasGoal) return null;
  const current = toNumber(todayGoal.currentValue);
  const goal = Math.max(1, toNumber(todayGoal.goalValue, 1));
  const before = Math.max(0, current - Math.max(0, toNumber(delta)));
  return {
    currentValue: current,
    goalValue: goal,
    unit: todayGoal.unit,
    pct: Math.min(100, (current / goal) * 100),
    pctBefore: Math.min(100, (before / goal) * 100),
    goalMet: current >= goal,
    remaining: Math.max(0, goal - current),
  };
}

function buildQuestsCard({ missions, completedMissionIds, missionXp, bonusXP, bonusEarnedXP }) {
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
  const earned = toNumber(bonusEarnedXP);
  return {
    id: 'quests',
    rows,
    doneCount: rows.filter((r) => r.done).length,
    allDone,
    // ADR-070: thưởng trọn ngày TỰ VÀO ở phiên khép nốt nhiệm vụ cuối — thẻ kể "đã vào", không mời bấm.
    bonusJustEarned: earned > 0,
    bonusEarnedXP: earned,
    bonusClaimed: Boolean(missions.bonusClaimedToday) && earned === 0,
    // Còn dở thì nói trước phần thưởng đang chờ — anticipation, và nó tự vào, không phải đi lấy.
    bonusXP: toNumber(bonusXP),
  };
}

/**
 * Thẻ CÔNG TRÌNH (ADR-077): đầu vào là kết quả `describeSessionBrick(… phase: 'landed')` — viên gạch
 * phiên này vừa đặt (`bricks` có ô 'new'), hoặc công trình vừa HOÀN THÀNH (`status: 'built'`). Kỷ đã
 * xây trọn (`era-complete`) thì không có gì để kể ⇒ không có thẻ. Không còn thẻ "hàng chờ trống":
 * store tự xếp hàng công trình kế tiếp trước khi tiến hàng chờ, nên phiên nào cũng có viên gạch.
 */
function buildProjectCard(project) {
  if (!project || project.status === 'era-complete') return null;
  const total = Math.max(1, toNumber(project.total, 1));
  const done = Math.max(0, Math.min(total, toNumber(project.done)));
  return {
    id: 'project',
    status: project.status === 'built' ? 'built' : 'building',
    label: project.label ?? 'Công trình',
    icon: project.icon ?? '',
    total,
    done,
    remaining: Math.max(0, total - done),
    bricks: Array.isArray(project.bricks) ? project.bricks : [],
    headline: project.headline ?? '',
    sub: project.sub ?? '',
    auto: !!project.auto,
    // ADR-080: the lucky second brick — the card names it first and the row lands two.
    lucky: !!project.lucky,
  };
}

/**
 * Thẻ LÊN CẤP mang luôn lựa chọn kỹ năng (ADR-069): "+2 điểm" mà phải đi tới Hành trang › Kỹ năng
 * mới tiêu được là một phần thưởng bị hoãn. `skills` do nơi gọi dựng từ `listAvailableSkills`:
 *   `{ sp, choices: [{ id, label, icon, description, cost, requires, branchLabel }], next: { label, spNeeded } | null }`
 */
function buildLevelCard(reward, skills) {
  /*
    ⚠️ ROUND 44 (ADR-084) — THIS CARD IS NO LONGER ABOUT LEVELS, IT IS ABOUT SKILL POINTS.
    It was built for one source (a level-up) because that was the only source there was. Levels paid
    2 SP per 6.000 XP, i.e. roughly one point per 86 sessions — so on a 617-session save this card
    had appeared a handful of times in half a year, and the card that lets Đàm SPEND a point was
    effectively unreachable. Now the CITY pays a point per finished building, and the same card does
    the same job for it: the point arrives and is spent in the same breath, with one tap, instead of
    becoming an errand to Hành trang. `source` is the only thing that differs, and it changes the
    two lines of copy at the top, nothing else.
    ⚠️ Returns null when nothing paid — previously the caller gated on `levelsGained > 0` and there
    are now two ways to be paid, so the gate belongs HERE where both are visible at once.
  */
  const levelsGained = toNumber(reward.levelsGained);
  const citySP = toNumber(reward.citySP);
  const spGained = toNumber(reward.spGained) + citySP;
  if (levelsGained <= 0 && citySP <= 0) return null;
  const choices = Array.isArray(skills?.choices) ? skills.choices.slice(0, 3) : [];
  return {
    id: 'level',
    source: levelsGained > 0 ? 'level' : 'city',
    newLevel: toNumber(reward.newLevel),
    spGained,
    citySP,
    sp: toNumber(skills?.sp),
    skillChoices: choices,
    nextSkill: choices.length === 0 && skills?.next ? { label: skills.next.label, spNeeded: toNumber(skills.next.spNeeded) } : null,
    hold: choices.length > 0,
  };
}

/**
 * ⚠️ ROUND 46 (ADR-086) — «KHO BÁU»: THREE CARDS THAT ALL SAID *"bạn vừa có một buff vĩnh viễn"*.
 * `rank` (thăng bậc) · `relic` (di vật mới) · `evolve` (di vật lên bậc) were written in three
 * different rounds, and side by side they turned out to be the same card three times: a 64px icon,
 * a name, a buff chip, a reassuring footnote. On the luckiest session they fired back to back —
 * 10,2 seconds of one idea told three ways, at the exact moment the ending should be at its
 * loudest. Loud is not the same as long.
 *
 * ⚠️ ONE ITEM STILL READS AS ONE PRIZE, NOT A LIST OF ONE. The common case by far is a single
 * treasure, and a list with one row would have made the frequent case worse to buy a better rare
 * case. So the renderer keeps the big-icon layout at `items.length === 1` and only stacks when
 * there is genuinely more than one thing to show.
 *
 * ⚠️ NOTHING WAS DELETED: every name, buff line and description the three cards printed is carried
 * here as a row. `sessionRewardStory.test.js` fails if any of the three stops arriving.
 */
function buildTreasureCard(reward) {
  const items = [];

  const rank = reward.rankUp;
  if (rank?.label) {
    items.push({
      kind: 'rank', id: `rank:${rank.label}`, icon: rank.icon ?? '🏅', eyebrow: 'Thăng bậc',
      label: rank.label, detail: rank.buffLabel ?? '',
      note: 'Tự lên nhờ những phiên gần đây — không có nút, không có hạn.',
    });
  }

  const relic = reward.relicEarned;
  if (relic?.label) {
    items.push({
      kind: 'relic', id: `relic:${relic.label}`, icon: relic.icon ?? '✨', eyebrow: 'Di vật mới',
      label: relic.label, detail: relic.description ?? '',
      note: 'Thử thách kỷ nguyên đã qua. Di vật cộng dồn vĩnh viễn.',
    });
  }

  for (const r of Array.isArray(reward.relicsEvolved) ? reward.relicsEvolved : []) {
    const stage = toNumber(r.stage);
    const maxStage = (RELIC_EVOLUTION[r.id]?.stages.length ?? 1) - 1;
    // ⚠️ `isMax` / `nextAt` SURVIVE THE MERGE. The old card's footnote was not decoration — it named
    // the next milestone in sessions (*"Bậc kế ở mốc 50 phiên kể từ khi nhận"*), the one sentence
    // that turns a relic from a trophy into something still ahead of him. Merging three cards is
    // allowed to cost a card; it is not allowed to cost a fact.
    const isMax = stage >= maxStage;
    const nextAt = isMax ? null : toNumber(RELIC_EVOLVE_SESSIONS[stage + 1]);
    items.push({
      kind: 'evolve', id: `evolve:${r.id}`, icon: r.icon ?? '✨', eyebrow: 'Di vật lên bậc',
      label: r.label ?? r.id, detail: describeBuff(r.buff),
      stageLabel: r.stageLabel ?? '', stage, maxStage, isMax, nextAt,
      note: isMax ? 'Đã tới bậc cao nhất.' : `Bậc kế ở mốc ${nextAt} phiên kể từ khi nhận.`,
    });
  }

  if (items.length === 0) return null;
  return { id: 'treasure', items };
}



/**
 * Thẻ BƯỚC TUẦN (ADR-070): phiên này vừa tự chốt một hay nhiều bước của chuỗi tuần. `reward.weeklySteps`
 * do store kể ra ({ index, total, label, xp, isLast, bonusSP }); rỗng thì không có thẻ.
 */
function buildChainCard(reward) {
  const steps = Array.isArray(reward.weeklySteps) ? reward.weeklySteps : [];
  if (steps.length === 0) return null;
  const total = Math.max(1, ...steps.map((s) => toNumber(s.total, 1)));
  const last = steps[steps.length - 1];
  return {
    id: 'chain',
    title: reward.weeklyChainTitle ?? 'Nhiệm vụ tuần',
    steps: steps.map((s) => ({ index: toNumber(s.index), label: s.label ?? '', xp: toNumber(s.xp), isLast: Boolean(s.isLast) })),
    total,
    doneCount: Math.min(total, toNumber(last.index) + 1),
    xp: steps.reduce((sum, s) => sum + toNumber(s.xp), 0),
    bonusSP: toNumber(reward.weeklyBonusSP),
    finished: steps.some((s) => s.isLast),
  };
}


/**
 * Thẻ THỬ THÁCH KỶ NGUYÊN (nhiệm vụ mềm): chỉ chen vào khi nó VỪA MỞ hoặc phiên này VỪA ĐƯỢC TÍNH
 * vào nó — không thì im, vì một thẻ "1/3" lặp lại mỗi phiên trong hai ngày là nhiễu.
 * `crisisQuest` = `describeCrisisQuest(...)` SAU phiên; `countedThisSession` do nơi gọi tính.
 */
function buildQuestCard(reward, crisisQuest) {
  if (!crisisQuest || crisisQuest.passed) return null;
  if (!reward.crisisOpened && !crisisQuest.countedThisSession) return null;
  return {
    id: 'quest',
    opened: Boolean(reward.crisisOpened),
    name: crisisQuest.name,
    icon: crisisQuest.icon,
    sessionsDone: toNumber(crisisQuest.sessionsDone),
    sessionsRequired: Math.max(1, toNumber(crisisQuest.sessionsRequired, 1)),
    minMinutes: toNumber(crisisQuest.minMinutes),
    windowHours: toNumber(crisisQuest.windowHours, 48),
    relicLabel: crisisQuest.relic?.label ?? null,
    relicIcon: crisisQuest.relic?.icon ?? null,
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
 * @param {number} p.bonusXP             "thưởng trọn ngày" CÒN CHỜ, đã tính sẵn bằng `dailyAllBonusXP` (đã vào thì đọc `reward.dailyBonusXP`)
 * @param {object|null} p.project        viên gạch phiên này SAU khi đặt — `describeSessionBrick` (xem `buildProjectCard`)
 * @param {object|null} p.skills         kỹ năng mở được ngay + đích kế (xem `buildLevelCard`)
 * @param {object|null} p.crisisQuest    thử thách kỷ nguyên SAU phiên (xem `buildQuestCard`)
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
  project = null,
  skills = null,
  crisisQuest = null,
} = {}) {
  if (!reward) return [];
  const cards = [buildXpCard(reward)];

  // Thứ tự là một câu chuyện (ADR-069/070): xong rồi → THÀNH PHỐ nhích → chuỗi → hôm nay → nhiệm vụ →
  // (bước tuần vừa chốt) → thử thách kỷ → (lên cấp + chọn kỹ năng) → (lên bậc) → (di vật) →
  // (di vật lên bậc) → (kỷ mới). Ba tin tự-vào của ADR-070 đứng ngay sau thứ chúng nói về.
  const projectCard = buildProjectCard(project);
  if (projectCard) cards.push(projectCard);

  /*
    ⚠️ THE SKILL-POINT CARD SITS WHERE ITS CAUSE IS. A point paid by the CITY belongs immediately
    after the card that just said which building finished — "Kho Gia Vị xong" → "+1 điểm kỹ năng,
    chọn một cái" is one thought. Burying it six cards later, where the level-up card has always
    lived, breaks the only causal link this round exists to draw. A point paid by a LEVEL keeps its
    old position, because its cause (crossing an XP threshold) has no card of its own to follow.
  */
  const skillCard = buildLevelCard(reward, skills);
  if (skillCard && skillCard.source === 'city') cards.push(skillCard);

  const streakCard = buildStreakCard(streak, weekDays, todayGoal, todayDelta);
  if (streakCard) cards.push(streakCard);

  const questsCard = buildQuestsCard({ missions, completedMissionIds, missionXp, bonusXP, bonusEarnedXP: reward.dailyBonusXP });
  if (questsCard) cards.push(questsCard);

  const chainCard = buildChainCard(reward);
  if (chainCard) cards.push(chainCard);

  const questCard = buildQuestCard(reward, crisisQuest);
  if (questCard) cards.push(questCard);

  if (skillCard && skillCard.source === 'level') cards.push(skillCard);

  const treasureCard = buildTreasureCard(reward);
  if (treasureCard) cards.push(treasureCard);

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

/** Thẻ đứng bao lâu rồi tự lật — `STORY_HOLD` (null) là "đứng yên chờ người chơi". */
export function storyCardDurationMs(card, isLast) {
  if (card?.hold) return STORY_HOLD;
  if (isLast) return STORY_LAST_CARD_MS;
  if (['level', 'era', 'treasure', 'chain'].includes(card?.id)) return STORY_BIG_CARD_MS;
  return STORY_CARD_MS;
}
