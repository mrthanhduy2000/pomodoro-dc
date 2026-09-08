/**
 * skillPreview.js — WHAT A SKILL IS WORTH, IN ĐÀM'S OWN NUMBERS (round 45, ADR-085).
 *
 * ⚠️ WHY THIS EXISTS. Opening a skill was a tap and a colour change. The card said `+8% XP` — a
 * percentage of a number Đàm has never had a feel for, on a session length he may not even work at.
 * Đàm's test for the round is *"tôi mở một kỹ năng, và tôi biết ngay app vừa khác đi ở chỗ nào"*,
 * and `+8% XP` cannot pass it. `+21 XP mỗi phiên 45 phút` can, because 21 is measured against HIS
 * median session, not against a spec.
 *
 * ⚠️ THE ANSWER IS COMPUTED BY RUNNING THE REAL FORMULA TWICE, NOT BY A TABLE.
 * The obvious build is a lookup of id → percentage. This project has paid for that shape three
 * times (`ERA_CRISES[…].successRelic.buff` vs `RELIC_EVOLUTION[…].stages[0].buff`; the achievement
 * thresholds; the era-stage arithmetic), and it would be worse here: a skill's real worth depends
 * on the multiplier tier, the branch softcap and the hard cap, none of which a percentage table
 * knows. So `previewSkillGain` calls `calculateRewards` with the skill OFF and again with it ON and
 * subtracts. It cannot drift from the game, because it IS the game.
 *
 * ⚠️ ONE BEST-CASE CONTEXT, NOT A PER-SKILL TABLE. Most skills only fire under a condition (after a
 * cancel, first session of the day, a break finished on time, a streak running). Measured on a
 * plain session they would all read `+0`, which is a lie of omission — the skill is worth something,
 * just not right now. `BEST_CASE_CTX` turns every condition on at once and lets each skill's own
 * gate decide; the answer is then honestly labelled as a best case rather than a promise.
 *
 * ⚠️ CHANCE-BASED SKILLS ARE REFUSED, NOT AVERAGED. `calculateRewards` rolls its own dice for the
 * Vận May branch, so an A/B there returns a different number every time it is asked — the same
 * measuring tool lying that this project has caught 28 times. Those skills fall back to their own
 * description, which already states the odds honestly.
 *
 * PURE: no store, no `Date`, no DOM.
 */
import { SKILL_TREE } from './constants.js';
import { calculateRewards } from './gameMath.js';

/** The length a preview is quoted at when history has nothing to say. A 45-minute session is the
 *  gate most skills in the tree are written against, so it is the least misleading default. */
export const PREVIEW_FALLBACK_MINUTES = 45;
/** The longest length gate any skill in the tree declares — the one retry a zero measurement gets. */
export const LONGEST_GATE_MINUTES = 60;

/**
 * Every trigger a skill might want, all true at once.
 * ⚠️ Deliberately generous: this is the answer to *"what is this worth WHEN it fires"*, never
 * *"what will it pay me tonight"*. The copy that shows the number has to say so.
 */
const BEST_CASE_CTX = {
  consecutiveSessionsToday: 4,
  breakCompletedOnTime: true,
  isFirstSessionToday: true,
  sessionsCompletedToday: 4,
  currentStreak: 30,
  lastSessionCancelled: true,
  isFirstSessionInNewEra: true,
  erasCompleted: 8,
  sessionsInCurrentEra: 400,
  allDailyMissionsDone: true,
  benVungActive: true,
  nhipHoanHaoActiveToday: true,
  hasSession45Today: true,
  hasSession60Today: true,
  dailyGoalAchieved: true,
  nextSessionBuffs: [{ type: 'nguoi_lap_ke', sessionsRemaining: 1 }, { type: 'cu_tri', sessionsRemaining: 3 }],
  keHoachWeeklyBuffActive: true,
};

/** The branch whose skills roll dice — an A/B on these is not reproducible, so it is not offered. */
const CHANCE_BRANCH = 'VAN_MAY';

const NODE_BY_ID = Object.fromEntries(
  Object.entries(SKILL_TREE).flatMap(([branchKey, branch]) =>
    branch.nodes.map((n) => [n.id, { ...n, branchKey, branchLabel: branch.label }]),
  ),
);

export function skillNode(skillId) {
  return NODE_BY_ID[skillId] ?? null;
}

/** Median minutes of the recent sessions — the length a preview should be quoted at. */
export function medianSessionMinutes(history = [], sample = 10) {
  const values = (Array.isArray(history) ? history : [])
    .slice(0, Math.max(1, sample))
    .map((e) => Number(e?.minutes))
    .filter((v) => Number.isFinite(v) && v > 0)
    .sort((a, b) => a - b);
  if (values.length === 0) return null;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 === 1 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

/**
 * What opening `skillId` changes, measured against the real reward formula.
 *
 * @returns {{ xp:number, ep:number, minutes:number, measured:boolean, description:string, label:string }}
 *          `measured: false` means the number could not be trusted (a chance skill, or a skill whose
 *          effect is not XP at all) and the caller must show `description` instead of the number.
 */
export function previewSkillGain({ skillId, unlockedSkills = {}, totalEP = 0, history = [] } = {}) {
  const node = skillNode(skillId);
  if (!node) return null;

  // ⚠️ Quote at the skill's OWN gate when the player's median is shorter than it. Telling someone
  // that «Chuyên Cần» is worth +0 XP because they usually work 25 minutes is true and useless; the
  // honest line is what it pays on the session it was designed for.
  // ⚠️ ROUND THE MINUTES. A median of 47,5 is arithmetically right and reads like a machine talking;
  // nobody plans a 47,5-minute session.
  const median = medianSessionMinutes(history);
  const firstTry = Math.round(Math.max(median ?? PREVIEW_FALLBACK_MINUTES, PREVIEW_FALLBACK_MINUTES));

  if (node.branchKey === CHANCE_BRANCH) {
    return { label: node.label, description: node.description ?? '', minutes: firstTry, xp: 0, ep: 0, measured: false };
  }

  const measure = (minutes) => {
    const without = calculateRewards(minutes, unlockedSkills, totalEP, {}, BEST_CASE_CTX);
    const withIt = calculateRewards(minutes, { ...unlockedSkills, [skillId]: true }, totalEP, {}, BEST_CASE_CTX);
    return {
      minutes,
      xp: Math.round((withIt.finalXP ?? 0) - (without.finalXP ?? 0)),
      ep: Math.round((withIt.finalEP ?? 0) - (without.finalEP ?? 0)),
    };
  };

  // ⚠️ ONE RETRY AT THE LONGEST GATE IN THE TREE, and no table of per-skill thresholds. A skill
  // gated at 60 minutes measures +0 at 47 and would fall back to its spec text — technically
  // honest, but it hands back exactly the `+15% XP` wording this module exists to replace. Trying
  // 60 once recovers every long-session skill without anyone maintaining a list of gates.
  let out = measure(firstTry);
  if (out.xp <= 0 && out.ep <= 0 && firstTry < LONGEST_GATE_MINUTES) out = measure(LONGEST_GATE_MINUTES);

  return {
    label: node.label,
    description: node.description ?? '',
    minutes: out.minutes,
    xp: out.xp,
    ep: out.ep,
    measured: out.xp > 0 || out.ep > 0,
  };
}

/**
 * The one line the unlock moment shows.
 * ⚠️ It must never promise more than it measured: the number is a BEST CASE and the words say so
 * («khi đủ điều kiện»). A line that reads like a guarantee and then does not pay is how a reward
 * system loses the player's trust for every reward after it.
 */
export function describeSkillUnlock(preview) {
  if (!preview) return null;
  if (!preview.measured) return { label: preview.label, line: preview.description };
  const parts = [];
  if (preview.xp > 0) parts.push(`+${preview.xp} XP`);
  if (preview.ep > 0) parts.push(`+${preview.ep} EP`);
  return {
    label: preview.label,
    line: `Phiên ${preview.minutes} phút, khi đủ điều kiện: ${parts.join(' · ')}.`,
  };
}
