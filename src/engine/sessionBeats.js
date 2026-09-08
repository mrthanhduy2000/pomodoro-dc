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
  return spaced([
    { id: 'settled', at: settle, label: 'Vào guồng', glyph: '◔' },
    { id: 'halfway', at: Math.round(total / 2), label: 'Nửa đường', glyph: '◑' },
    { id: 'final', at: total - settle, label: 'Đoạn cuối', glyph: '◕' },
    // The last-minute bell already rings here (useTimer); this is its visual twin, no new sound.
    { id: 'lastMinute', at: total - 60, label: 'Phút cuối', glyph: '●' },
  ]);
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
  return spaced(beats);
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
