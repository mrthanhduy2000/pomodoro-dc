/**
 * cityPostcard.js — what the Focus-screen postcard shows, as pure data (ADR-078).
 *
 * The postcard is the SAME city the City tab renders (`computeCityLayout` → `CityStage`), framed
 * small at the top of the Focus column. Two decisions live here so they can be tested without a
 * WebGL context:
 *
 *   1. WHICH PLOTS ARE DRAWN. Everything built plus every scaffold in the queue — and, when the
 *      queue is empty, a PHANTOM scaffold for the project `pickSessionProject` will auto-queue at
 *      the end of the next session. The Focus strip already says "this session lays the first
 *      brick for X"; a postcard that showed bare land next to that sentence would be telling a
 *      different story. The phantom is appended AFTER the real queue, exactly where
 *      `autoQueueSessionProject` appends the real item, so the plot does not move when the
 *      session ends (ADR-007 protects BUILT buildings; a scaffold's plot is decided by queue order).
 *
 *   2. WHERE THE CAMERA LOOKS. On the scaffold this session pushes (the brick site), or — after a
 *      session that finished a building — on that building, until the next session starts. That is
 *      the "see the spot you just built" moment, without a scene that makes anyone wait: it is just
 *      the state of the picture when the reward cards close.
 *
 * Pure: no store, no `Date`, no DOM.
 */
import { pickSessionProject } from '../../engine/sessionBrick';

/** Input for `computeCityLayout`, with the phantom scaffold when the queue is empty. */
export function planPostcardLayout({
  buildings = [], buildingLevels = {}, craftingQueue = [], activeBook = 1, sessionsInEra = 0, currentStreak = 0,
} = {}) {
  const built = Array.isArray(buildings) ? buildings : [];
  const queue = Array.isArray(craftingQueue) ? craftingQueue : [];
  const pick = pickSessionProject({ craftingQueue: queue, activeBook, buildings: built });
  const pending = pick.source === 'auto' && pick.project
    ? [...queue, { bpId: pick.project.bpId, sessionsRemaining: pick.project.total, phantom: true }]
    : queue;
  return {
    built,
    levels: buildingLevels ?? {},
    era: activeBook,
    stats: { sessionCount: sessionsInEra ?? 0, streakLength: currentStreak ?? 0 },
    pending,
  };
}

/**
 * `{ kind: 'scaffold' | 'building', bpId }` the camera should frame, or null (whole city).
 * `landedBpId` = the building the last session completed (store `ui.postcardFocusBpId`); it wins
 * while no session runs and it is really standing in the city.
 */
export function planPostcardFocus({
  buildings = [], craftingQueue = [], activeBook = 1, landedBpId = null, sessionRunning = false,
} = {}) {
  const built = Array.isArray(buildings) ? buildings : [];
  if (!sessionRunning && landedBpId && built.includes(landedBpId)) return { kind: 'building', bpId: landedBpId };
  const pick = pickSessionProject({ craftingQueue, activeBook, buildings: built });
  return pick.project ? { kind: 'scaffold', bpId: pick.project.bpId } : null;
}

/**
 * Resolve a focus to the layout entry `CityStage` expects (`{ ...entry, kind }`), or null.
 * A scaffold that has just become a building (or the reverse, one render apart) is looked up in
 * the other list so the camera never snaps home between two consecutive states.
 */
export function postcardSelection(layout, focus) {
  if (!layout || !focus?.bpId) return null;
  const primary = focus.kind === 'scaffold' ? layout.scaffolds : layout.buildings;
  const hit = (primary ?? []).find((entry) => entry?.bpId === focus.bpId);
  if (hit) return { ...hit, kind: focus.kind };
  const otherKind = focus.kind === 'scaffold' ? 'building' : 'scaffold';
  const other = otherKind === 'scaffold' ? layout.scaffolds : layout.buildings;
  const alt = (other ?? []).find((entry) => entry?.bpId === focus.bpId);
  return alt ? { ...alt, kind: otherKind } : null;
}
