/**
 * sessionCredits.js — WHO PAID FOR THIS SESSION (round 45, ADR-085).
 *
 * ⚠️ THE MEASUREMENT THAT FORCED THIS FILE. Walking all 36 skills against Đàm's three questions —
 * *does it do something · can I feel it · would I lose anything if it were gone* — gives:
 *
 *   · **27 of 36 are a silent "+X% XP/EP"** under some condition. They fire correctly, every
 *     session, and **not one of them has ever appeared anywhere on screen.** The ending card
 *     already names the streak, the combo, a lucky roll, the golden beat and the overclock — but
 *     never the skills, never the relics, never a building perk.
 *   · 6 are genuinely felt because they change something visible: breaks +5 minutes, the streak
 *     shield, the combo window, the multiplier tier, and the two manual one-a-day activations.
 *   · 3 only matter after a prestige, which this save has never done in 617 sessions.
 *
 * So round 44 opened the valve (a building pays a skill point) and this is what the points bought:
 * a number Đàm cannot see moving. **A reward you cannot perceive is not a reward** — the same law
 * that deleted 360 achievements in round 44 applies here, and here it says SHOW, not delete: every
 * one of the 27 passes question 1 and fails only question 2, and you fix a question-2 failure by
 * naming the thing, not by throwing it away.
 *
 * ⚠️ THIS MODULE NEVER COMPUTES A REWARD. It is bookkeeping that runs ALONGSIDE the real
 * arithmetic in `gameMath.calculateSessionRewards`: each `if (skill && condition)` that adds a
 * percentage also records one credit. Nothing here feeds back into the XP the player receives, so
 * a bug in this file can make the ending card WRONG but can never make the payout wrong. That
 * separation is deliberate — `calculateSessionRewards` is the most load-bearing pure function in
 * the app and this round refuses to restructure it.
 *
 * PURE: no store, no `Date`, no DOM.
 */
import { SKILL_TREE } from './constants.js';

/**
 * id → display label, read from the skill tree itself.
 * ⚠️ NEVER retype a skill name here. `SKILL_TREE` is the one place a skill is named; a second copy
 * drifts the first time someone renames a node, and the ending card would then credit a skill by a
 * name that no longer exists anywhere else in the app.
 */
export const SKILL_LABEL = Object.fromEntries(
  Object.values(SKILL_TREE).flatMap((branch) => branch.nodes.map((n) => [n.id, n.label])),
);

/** What kind of thing paid — decides the chip's icon, and nothing else. */
export const CREDIT_KIND = {
  skill: '✦',
  relic: '✨',
  perk: '🏛',
  rank: '🎖',
  synergy: '⚡',
};

/**
 * Collect credits as the bonuses are added. One instance per session calculation.
 *
 * ⚠️ `add` TAKES A PERCENTAGE, NOT AN AMOUNT. The amount cannot be known yet: it depends on the
 * base XP and the multiplier tier, both of which are still being computed when the skill blocks
 * run. Converting early would mean recomputing the base in two places, which is the shape of bug
 * this project keeps paying for (`EraStageBar` labelling EP as XP for months).
 */
export function makeCreditLedger() {
  const list = [];
  return {
    list,
    /** @param {string} id @param {'skill'|'relic'|'perk'|'rank'|'synergy'} kind */
    add(id, kind, xpPct = 0, epPct = 0, label = null) {
      if (!(xpPct > 0) && !(epPct > 0)) return;
      list.push({ id, kind, xpPct, epPct, label: label ?? SKILL_LABEL[id] ?? id });
    },
  };
}

/**
 * Turn the recorded percentages into the XP and EP each source actually paid.
 *
 * ⚠️ THE CAP IS WHY THIS IS NOT A MULTIPLICATION. `xpFactor` is clamped at `XP_FACTOR_HARD_CAP`
 * (4.25). Below the clamp every credit is exactly `baseXP × multiplier × pct` because the factor is
 * a plain sum. At or above it the sum of the credits would claim MORE XP than the session actually
 * paid — the card would add up to more than its own headline, which is the single most obvious way
 * for a breakdown to lose all credibility. So when the clamp bites, every credit is scaled by the
 * same ratio and the total still reconciles. `sessionCredits.test.js` pins both cases.
 *
 * ⚠️ Rounding is applied per credit, so the chips can be off by a unit or two against the headline.
 * That is accepted and deliberate: showing `+21 XP` on a chip and `+20,6 XP` would be worse.
 */
export function settleCredits({
  credits = [],
  baseXP = 0,
  multiplier = 1,
  rawXpFactor = 1,
  cappedXpFactor = 1,
  rawEpFactor = 1,
  cappedEpFactor = 1,
} = {}) {
  const xpScale = rawXpFactor > cappedXpFactor && rawXpFactor > 0 ? cappedXpFactor / rawXpFactor : 1;
  const epScale = rawEpFactor > cappedEpFactor && rawEpFactor > 0 ? cappedEpFactor / rawEpFactor : 1;
  const perPct = Math.max(0, baseXP) * Math.max(0, multiplier);

  return credits
    .map((c) => ({
      id: c.id,
      kind: c.kind,
      label: c.label,
      icon: CREDIT_KIND[c.kind] ?? '✦',
      xp: Math.round(perPct * (c.xpPct || 0) * xpScale),
      // EP does not ride the session multiplier — it is `baseEP × epFactor` in `calculateSessionRewards`,
      // so a credit's EP share is computed by its caller and passed through as a percentage of that base.
      epPct: (c.epPct || 0) * epScale,
    }))
    .filter((c) => c.xp > 0 || c.epPct > 0);
}

/**
 * What the ending card shows: the biggest few, then a count.
 *
 * ⚠️ A BREAKDOWN THAT LISTS EVERYTHING IS A WALL, NOT AN EXPLANATION. A player with twenty skills
 * open can fire eight in one session; eight chips under the headline is the badge grid all over
 * again. Three is chosen to match the chip row already on that card (era · streak · combo) — the
 * eye reads three, not eight — and the rest are counted, not hidden: `+N nữa` still says they paid.
 */
export const MAX_CREDIT_CHIPS = 3;

export function topCredits(settled = [], limit = MAX_CREDIT_CHIPS) {
  const sorted = [...settled].sort((a, b) => (b.xp - a.xp) || (b.epPct - a.epPct));
  return { shown: sorted.slice(0, limit), hiddenCount: Math.max(0, sorted.length - limit) };
}
