/**
 * skillPointEconomy.js — THE CITY FUNDS THE TREE (round 44, ADR-084).
 *
 * ⚠️ WHY THIS FILE EXISTS — five measured numbers that only make sense together:
 *   · the game speaks 11 units of progress and Đàm can SPEND exactly two of them;
 *   · the skill tree costs **138 SP** for all 36 skills;
 *   · SP came from levels at 6.000 XP each against a measured median of ~35 XP/session,
 *     i.e. **~171 sessions per level, ~86 sessions per SP**;
 *   · a 617-session save had **2 unspent SP and 4 of 36 skills open** — the tree had barely moved
 *     in half a year of real use;
 *   · the other real SP source, the weekly chain (1–2 SP a week), lives behind a tab that does not
 *     exist on desktop and sits under "Thêm" on the phone.
 * So the one thing worth buying was the one thing that could not be earned. That is not a number
 * to tune, it is an economy that does not run.
 *
 * ⚠️ THE FIX IS A BRIDGE, NOT A FAUCET. SP now comes from the thing Đàm already does every session
 * and already watches: **finishing a building.** ADR-082 made the city the destination (75
 * buildings across 15 eras); this makes the city the ECONOMY too, so the two never compete for his
 * attention — the sentence "another building is another skill point" points at both at once.
 *
 * ⚠️ WHY EXACTLY 1 SP PER BUILDING — the arithmetic is the argument, not a taste:
 *      75 buildings × 1 SP                     =  75 SP
 *      weekly chain, ~1 SP × ~50 weeks         = ~50 SP
 *      levels, 2 SP × ~7 levels over the game  = ~14 SP
 *                                                ───────
 *                                                ~139 SP   against a tree costing 138.
 *   The tree finishes as the city finishes, and all three sources still matter. Two SP per building
 *   would have covered the whole tree from the city alone and made the other two decorative.
 *   ⚠️ Building all 75 takes 420 build-sessions (`BLUEPRINT_META.sessionsToComplete`), so this is
 *   **~5,6 sessions per SP** — down from ~86. That ratio is the point of the round; if a later
 *   change moves either side of it, move this constant with it rather than adding a fourth source.
 *
 * ⚠️ A LEDGER, NOT AN EVENT. `settleCitySP` compares what the city has EARNED (a function of how
 * many buildings stand) against what it has already PAID (`player.spFromCity`). Three properties
 * fall out of that, and all three were the reason not to just add SP when a building completes:
 *   1. **Retroactive by construction.** A save with 38 buildings and no ledger is owed 38 SP the
 *      first time it is settled. No migration step, no dated flag, nothing to run once and hope.
 *   2. **Cannot double-pay.** Settling twice in a row owes 0 the second time, so it is safe to call
 *      on hydration AND after every session — which is exactly what happens.
 *   3. **Self-healing.** If a session is ever lost to a rejected CAS write (`docs/OPERATIONS.md`:
 *      first action wins), the ledger simply pays the difference next time instead of losing a
 *      point forever.
 *
 * PURE: no store, no `Date`, no DOM.
 */
import { SP_PER_LEVEL } from './constants.js';

/**
 * What one finished building is worth in skill points.
 * ⚠️ Read the arithmetic above before changing this — it is balanced against 138 SP of tree, not
 * chosen for feel.
 */
export const SP_PER_BUILDING = 1;

/** Total SP the city has EARNED over the life of a save, given how many buildings stand. */
export function cityEarnedSP(builtTotal) {
  const built = Math.max(0, Math.floor(Number(builtTotal) || 0));
  return built * SP_PER_BUILDING;
}

/**
 * Settle the ledger: how much the city still owes, and what the ledger should read afterwards.
 *
 * ⚠️ `owed` NEVER GOES NEGATIVE. A city can shrink — an era is sealed and its buildings move into
 * the museum, a cloud pull arrives with fewer buildings than this device had, an import restores an
 * older save. Clawing SP back would take away skills Đàm has already spent and already feels, which
 * is the one thing an economy must never do. The ledger just stops paying until the city catches up.
 *
 * @returns {{ owed: number, credited: number }} `owed` to add to `player.sp`,
 *          `credited` to store back into `player.spFromCity`.
 */
export function settleCitySP({ builtTotal = 0, credited = 0 } = {}) {
  const earned = cityEarnedSP(builtTotal);
  const paid = Math.max(0, Math.floor(Number(credited) || 0));
  const owed = Math.max(0, earned - paid);
  return { owed, credited: paid + owed };
}

/**
 * ⚠️ ROUND 45 — "WHEN DO I GET TO OPEN ANOTHER ONE?" (ADR-085)
 *
 * Round 44 opened three taps into the same bucket — a finished building (1 SP), a level (2 SP), a
 * finished week (1–2 SP) — and each one announces itself in its own place: the building on the
 * ending card, the level on this header, the week on the mission card. Đàm read only the first and
 * concluded the rhythm was **5,6 sessions per point**. Across the whole journey it is
 * 139 SP over ~420 build-sessions ≈ **3 sessions per point** — his felt number was nearly twice
 * too slow because two of the three taps were invisible from where he was standing.
 *
 * ⚠️ THE FIX IS NOT A RATE CHANGE. The 1 SP/building ratio is load-bearing: it is what makes the
 * tree finish as the city finishes, and Đàm's own brief forbids breaking it. What was missing was a
 * single honest answer to "how far to the next point", so this returns the NEAREST of the two taps
 * that can be stated in sessions.
 *
 * ⚠️ THE WEEK IS DELIBERATELY NOT HERE. A weekly chain closes on a calendar, not on a session
 * count; converting "2 steps left" into "~N sessions" would be inventing a number, which is exactly
 * what `medianSessionEP`'s honesty rule forbids. The week states itself on the mission card, in
 * steps, where that is the truth.
 *
 * ⚠️ RETURNS `null` WHEN NEITHER IS KNOWN — a fresh save with an empty queue and no history has no
 * honest answer, and a made-up one is worse than a blank line.
 *
 * PURE: no store, no `Date`, no DOM.
 *
 * @param {{ craftingQueue?: Array<{ bpId?: string, sessionsRemaining?: number }>,
 *           sessionsToNextLevel?: number|null, nextLevel?: number|null,
 *           projectLabel?: (bpId: string) => string|null }} input
 * @returns {{ sessions: number, sp: number, source: 'building'|'level', label: string|null }|null}
 */
export function nextSkillPointETA({
  craftingQueue = [], sessionsToNextLevel = null, nextLevel = null, projectLabel = null,
} = {}) {
  const queue = Array.isArray(craftingQueue) ? craftingQueue : [];
  const head = queue
    .map((item) => ({ bpId: item?.bpId, left: Number(item?.sessionsRemaining) }))
    .filter((item) => Number.isFinite(item.left) && item.left > 0)
    .sort((a, b) => a.left - b.left)[0] ?? null;
  const levelLeft = Number.isFinite(Number(sessionsToNextLevel)) && Number(sessionsToNextLevel) > 0
    ? Math.ceil(Number(sessionsToNextLevel))
    : null;

  const options = [];
  if (head) {
    options.push({
      sessions: Math.ceil(head.left),
      sp: SP_PER_BUILDING,
      source: 'building',
      label: (typeof projectLabel === 'function' ? projectLabel(head.bpId) : null) || null,
    });
  }
  if (levelLeft !== null) {
    options.push({
      sessions: levelLeft,
      sp: SP_PER_LEVEL,
      source: 'level',
      label: Number.isFinite(Number(nextLevel)) ? `cấp ${Number(nextLevel)}` : null,
    });
  }
  if (options.length === 0) return null;
  // ⚠️ TIE GOES TO THE BUILDING, not to the bigger payout. At an equal distance the building is the
  // one he can SEE getting closer — the brick strip fills in front of him every session — while the
  // level is an XP bar that moved by an amount he never watches. Naming the visible one keeps the
  // sentence checkable against the screen he is already looking at.
  options.sort((a, b) => (a.sessions - b.sessions) || (a.source === 'building' ? -1 : 1));
  return options[0];
}
