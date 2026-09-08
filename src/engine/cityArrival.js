/**
 * cityArrival.js — WHAT THE CITY TAB SAYS WHEN A BUILDING FINISHED SINCE ĐÀM LAST LOOKED (round 46, ADR-086).
 *
 * ⚠️ THE GAP IT CLOSES. Finishing a building is the rarest, most expensive event in the game — ~5,6
 * sessions of the city tap, and it pays a skill point. The ending card celebrates it once, on the
 * Focus screen. Then the City tab — the one screen NAMED after the thing that just grew — did
 * nothing: the house was simply there the next time he opened the tab, indistinguishable from the
 * ones that had stood for months. The most expensive moment of the game happened where nobody was
 * looking.
 *
 * ⚠️ IT IS A DIFFERENCE, NOT AN EVENT. The tab does not listen for "a building finished" (an event
 * fires once, on one device, and is gone if the tab was not open). It compares how many buildings
 * stand now with how many stood the last time this device showed the tab — the same shape as the
 * skill-point ledger (ADR-084) and for the same reasons: it works across a reload, across days,
 * and across the device that did not run the session. The stamp lives in `localStorage` on the
 * component side (like `DayMoment`), never in the synced save.
 *
 * ⚠️ IT HAPPENS AND IT IS GONE (ADR-080). The moment is a few seconds and a camera flight; nothing
 * stays. A FIRST visit (no stamp yet) says nothing at all — "38 new buildings" on the day this
 * shipped would be a lie about the past, so the stamp is written silently and the next real
 * completion is the first one announced.
 *
 * PURE: no store, no `Date`, no DOM.
 */
import { cityEarnedSP } from './skillPointEconomy';

/** How long the arrival stands on the City tab before it leaves on its own. */
export const ARRIVAL_VISIBLE_MS = 4200;

/** A non-negative integer, or `null` for "unknown" — `null`/`undefined` are unknown, never zero. */
function count(value) {
  if (value === null || value === undefined) return null;
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

/**
 * @param {{ builtTotal?: number, seenTotal?: number|null, newestLabel?: string|null }} input
 *   `builtTotal`  buildings standing now, museum included (`summarizeMuseum().builtTotal`)
 *   `seenTotal`   the count stamped on this device the last time the tab was shown; `null` = never
 *   `newestLabel` the name of the newest building, when the caller knows it
 * @returns {{ count: number, sp: number, eyebrow: string, title: string, line: string }|null}
 */
export function describeCityArrival({ builtTotal = 0, seenTotal = null, newestLabel = null } = {}) {
  const built = count(builtTotal) ?? 0;
  const seen = count(seenTotal);
  if (seen === null) return null;                 // first visit: stamp, say nothing
  const fresh = built - seen;
  if (fresh <= 0) return null;                    // a city can shrink (cloud pull) — never negative
  const sp = cityEarnedSP(fresh);
  return {
    count: fresh,
    sp,
    eyebrow: fresh === 1 ? 'Vừa xây xong' : 'Vừa xây xong',
    title: fresh === 1 && newestLabel ? newestLabel : `${fresh} công trình mới`,
    // Said in SP FIRST (ADR-084's rule), and as a fact — the ledger already paid it at the ending.
    line: `+${sp} SP · đã cộng vào cây kỹ năng`,
  };
}

/** What the stamp should read after this visit. Always the current count — never less. */
export function nextCitySeenTotal({ builtTotal = 0, seenTotal = null } = {}) {
  const built = count(builtTotal) ?? 0;
  const seen = count(seenTotal) ?? 0;
  return Math.max(built, seen);
}
