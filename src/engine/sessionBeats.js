/**
 * sessionBeats.js — the RHYTHM inside a running session and inside a break (ADR-080).
 *
 * Đàm counted a day: of ~152 minutes in the app, ~125 are "a number going down. Nothing else." The
 * ending got four rounds of work; the twenty-five minutes before it got none. This module names the
 * few moments a session has by itself — settling in, halfway, the final stretch, the last minute —
 * so the screen can mark them and then fall silent again.
 *
 * Two laws, both from round 39 and both protected here:
 *   · NOTHING STATIC. A beat is a window of a few seconds; outside it `resolveBeat` returns null and
 *     the screen is exactly the round-39 screen (one ring · two numbers · three colours).
 *   · PERIPHERAL. Labels carry no digit and fit the ring's label slot; the tab-title glyph is a
 *     shape, not a count. Whatever draws them must not ask the eye to read.
 *
 * Everything is a function of ELAPSED SECONDS, never of ticks: a tab in the background stops
 * ticking, and when it comes back the first tick lands inside the right window (or past it — a
 * missed beat is missed, it does not queue up).
 *
 * Pure: no store, no clock, no DOM.
 */

/** How long a beat stays on screen. Long enough to be noticed at the edge of sight, short enough to be gone. */
export const BEAT_WINDOW_SECONDS = 8;

/** The settling-in / final-stretch length: a fifth of the session, at most five minutes. */
const SETTLE_CAP_SECONDS = 300;

/**
 * ⚠️ NO SILENCE LONGER THAN THIS (ADR-081). Round 40's four beats were measured on a 25-minute
 * session and only make sense there: a 90-minute session got its four beats at 5:00 · 45:00 · 85:00
 * · 89:00 — forty minutes of nothing, twice, which is exactly the emptiness beats were added to fill.
 * Any gap wider than this is filled with evenly spaced "still going" beats, so the rhythm is a
 * property of the CLOCK, not of one duration someone happened to test.
 */
const MAX_GAP_SECONDS = 15 * 60;

/** Fill any gap wider than `MAX_GAP_SECONDS` with evenly spaced beats of `filler`. */
function fillGaps(core, filler) {
  const out = [];
  let prev = 0;
  for (const beat of [...core].sort((a, b) => a.at - b.at)) {
    const gap = beat.at - prev;
    if (gap > MAX_GAP_SECONDS) {
      const inserts = Math.ceil(gap / MAX_GAP_SECONDS) - 1;
      const step = gap / (inserts + 1);
      for (let i = 1; i <= inserts; i += 1) {
        const at = Math.round(prev + step * i);
        out.push({ ...filler, id: `${filler.id}-${at}`, at });
      }
    }
    out.push(beat);
    prev = beat.at;
  }
  return out;
}

function clampInt(n) {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) ? Math.max(0, v) : 0;
}

/** Keep beats ordered and at least one window apart (a short session would stack them). */
function spaced(beats) {
  const out = [];
  for (const b of beats.filter((x) => x.at > 0).sort((a, b) => a.at - b.at)) {
    if (out.length === 0 || b.at - out[out.length - 1].at >= BEAT_WINDOW_SECONDS) out.push(b);
  }
  return out;
}

/**
 * The beats of a focus session of `totalSeconds` (Pomodoro mode only — a stopwatch has no total).
 * Returns `[{ id, at, label, glyph }]`, `at` in elapsed seconds, sorted.
 */
export function planSessionBeats(totalSeconds) {
  const total = clampInt(totalSeconds);
  if (total < 120) return [];
  const settle = Math.min(SETTLE_CAP_SECONDS, Math.round(total * 0.2));
  if (total < 600) {
    return spaced([{ id: 'halfway', at: Math.round(total / 2), label: 'Nửa đường', glyph: '◑' }]);
  }
  return spaced(fillGaps([
    { id: 'settled', at: settle, label: 'Vào guồng', glyph: '◔' },
    { id: 'halfway', at: Math.round(total / 2), label: 'Nửa đường', glyph: '◑' },
    { id: 'final', at: total - settle, label: 'Đoạn cuối', glyph: '◕' },
    // The last-minute bell already rings here (useTimer); this is its visual twin, no new sound.
    { id: 'lastMinute', at: total - 60, label: 'Phút cuối', glyph: '●' },
  ], { id: 'flow', label: 'Vẫn trong guồng', glyph: '◈' }));
}

/**
 * The beats of a break: leave the screen early, drink water halfway, come back before the end.
 * The break-over sound and notification already exist; the last beat is their visual lead-in.
 */
export function planBreakBeats(totalSeconds) {
  const total = clampInt(totalSeconds);
  if (total < 90) return [];
  const beats = [{ id: 'return', at: total - 60, label: 'Sắp hết nghỉ', glyph: '⏰' }];
  if (total >= 180) {
    beats.push({ id: 'leave', at: 20, label: 'Đứng dậy', glyph: '☕' });
    beats.push({ id: 'water', at: Math.round(total / 2), label: 'Uống nước', glyph: '☕' });
  }
  // A long break falls under the same no-long-silence law as a session (ADR-081).
  return spaced(fillGaps(beats, { id: 'rest', label: 'Cứ nghỉ tiếp', glyph: '☕' }));
}

/**
 * The beat whose window contains `elapsedSeconds`, or null. The LAST such beat wins when windows
 * touch, so a late tick never resurrects an older one.
 */
export function resolveBeat(beats, elapsedSeconds, windowSeconds = BEAT_WINDOW_SECONDS) {
  const t = Number(elapsedSeconds);
  if (!Array.isArray(beats) || !Number.isFinite(t)) return null;
  let hit = null;
  for (const b of beats) {
    if (t >= b.at && t < b.at + windowSeconds) hit = b;
  }
  return hit;
}

/**
 * A number-free phase glyph for the tab title: ○ ◔ ◑ ◕ ● — it grows four times per session and
 * completes, which a tab strip shows without a single digit.
 */
export function sessionPhaseGlyph(elapsedSeconds, totalSeconds) {
  const total = clampInt(totalSeconds);
  if (total <= 0) return '○';
  const p = Math.max(0, Math.min(1, Number(elapsedSeconds) / total));
  if (p >= 1) return '●';
  if (p >= 0.75) return '◕';
  if (p >= 0.5) return '◑';
  if (p >= 0.25) return '◔';
  return '○';
}

/**
 * THE GOLDEN BEAT (ADR-081) — the second kind of surprise, and it lands mid-session.
 *
 * «Gạch đôi» (ADR-080) is the only surprise the game had, and it always arrives at the same place:
 * the ending. This one arrives while the work is happening — one beat of a session, rarely, comes up
 * as «Guồng vàng» instead of its usual label, and that session pays a little more XP at the end.
 *
 * ⚠️ NO DICE AND NO STATE: the roll is a HASH of the day and how many sessions are already done
 * today. Both sides can compute it independently and always agree — the running screen (which has no
 * store write to spare) and `assembleSessionReward` (which must stay pure and deterministic). It
 * also means a background tab, a reload or a restored session never re-rolls it.
 *
 * Never negative: a miss is an ordinary session.
 */
export const GOLDEN_BEAT_CHANCE = 0.15;
export const GOLDEN_BEAT_XP_BONUS = 0.15;
export const GOLDEN_BEAT_LABEL = 'Guồng vàng';

/** FNV-1a → [0, 1). Deterministic across devices; no `Math.random`, no storage. */
function hashUnit(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h / 0x100000000;
}

/**
 * Which beat of this session is golden, or null.
 * @returns {'halfway'|'final'|null}
 */
export function rollGoldenBeat({ dayKey = '', sessionsDoneToday = 0, chance = GOLDEN_BEAT_CHANCE } = {}) {
  if (!dayKey) return null;
  const roll = hashUnit(`${dayKey}#${Math.max(0, Math.floor(Number(sessionsDoneToday) || 0))}#golden`);
  if (roll >= chance) return null;
  // Spread it over the two beats in the middle of the session — never the last minute, where the
  // bell already rings, and never the first, which would read as a reward for merely starting.
  return roll < chance / 2 ? 'halfway' : 'final';
}
