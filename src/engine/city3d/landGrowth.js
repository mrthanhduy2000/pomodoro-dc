/**
 * landGrowth.js — THE LAND GROWS WITH THE PLAYER (round 48, ADR-088; closes `TECH_DEBT_3D #74`).
 *
 * Đàm, verbatim: *"tôi đã tập trung 553 phiên, 830 giờ — và mảnh đất của tôi rộng đúng bằng ngày đầu
 * tiên. Đó là phần thưởng lớn nhất game này chưa từng trả."* And the one place this round may touch
 * ADR-007: *"địa hình không được phụ thuộc tiến trình chơi"*. The way out he named, and the way this
 * file takes: the CORE never changes (grid 12×12, roads, plots, terrain heights — the ADR-007 tests
 * sweep 1…120 sessions × 15 eras and stay green), growth is APPENDED OUTSIDE it, and a sealed era
 * is rendered with the session count stored at its seal (`cityArchive.sessionCount`, already the
 * value `CityView` hands a sealed era), so a museum piece keeps the size it had the day it closed.
 *
 * Only-add, never move (the invariant `#74` and `#71` spelled out): every item that exists at
 * session s exists at session s + 1 with the same coordinates, digit for digit. Growth here is:
 *   • the outskirts ring of trees/rocks/bushes extends outward — `outskirtReach(stage)`;
 *   • extra hamlets are appended to the TAIL of the hinterland list — `hamletBonus(stage)`;
 *   • the default camera steps back a little so the new land is inside the frame — `cameraPullback`.
 * A stage is reached at a session milestone of the era; five stages, so the land visibly grows about
 * once a month for a daily player, and never shrinks.
 */

/** Sessions (in the era) at which the land steps outward. Stage 0 = the land every era starts with. */
export const LAND_MILESTONES = Object.freeze([0, 25, 50, 90, 140]);

/** 0…4 — which stage a session count has reached. Non-finite or negative counts are stage 0. */
export function landStage(sessionCount) {
  const n = Number.isFinite(sessionCount) ? sessionCount : 0;
  let stage = 0;
  for (let i = 1; i < LAND_MILESTONES.length; i += 1) if (n >= LAND_MILESTONES[i]) stage = i;
  return stage;
}

/** Cells beyond the grid the outskirts vegetation reaches at a stage: 8 → 11. */
export const OUTSKIRT_REACH_BASE = 8;
export const OUTSKIRT_REACH_PER_STAGE = 0.75;
export function outskirtReach(stage) {
  return OUTSKIRT_REACH_BASE + OUTSKIRT_REACH_PER_STAGE * Math.max(0, Math.min(4, stage));
}

/** Hamlets appended beyond the era's own count: one per stage. */
export function hamletBonus(stage) {
  return Math.max(0, Math.min(4, stage));
}

/** Camera distance multiplier: +6 % per stage, so the frame grows with the land (see `#73`). */
export const CAMERA_PULLBACK_PER_STAGE = 0.06;
export function cameraPullback(stage) {
  return 1 + CAMERA_PULLBACK_PER_STAGE * Math.max(0, Math.min(4, stage));
}

/** Next milestone after a session count, or null at the top — for copy that says "N more sessions". */
export function nextLandMilestone(sessionCount) {
  const n = Number.isFinite(sessionCount) ? sessionCount : 0;
  for (const m of LAND_MILESTONES) if (m > n) return m;
  return null;
}
