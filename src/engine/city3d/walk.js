/**
 * walk.js — Round 50 (ADR-090): DOWN TO THE STREET. A pure walker on the road network: a position in
 * world units, a heading, and one rule — you may stand only where a road cell is (half a cell of
 * margin so the eye never enters a wall). It produces ORBIT STATES: the same crane (`orbit.js`) that
 * frames the overview also frames the walk — the look-at point is one unit ahead of the eye, the
 * "distance" is that unit, a negative pitch looks up at a facade. No second camera system (the
 * one-law-two-formulas trap that `cityFocus.js` warns about).
 *
 * Everything here is deterministic and testable without three: give it road cells, get states back.
 * The FLOOR comes in as `groundAt(worldX, worldZ)` — the scene's own terrain (`groundHeightAt`), never
 * a second copy of it; without one the walker assumes a flat 0 (the tests' case).
 */
import { HUMAN_BASE_HEIGHT } from './humanStyle';

/** Eye height of a walker in world units — a resident is 0,2 tall; the eye sits at 0,9 of that. */
export const EYE_HEIGHT = HUMAN_BASE_HEIGHT * 0.9;
/** How far ahead the look-at point sits (the orbit "distance" in walk mode). */
export const LOOK_AHEAD = 1.0;
/** One step forward, in world units (a cell is 1). */
export const STEP = 0.12;
/** Looking up/down is clamped here (radians): −0,95 looks up a tower, +0,6 looks at the cobbles. */
export const WALK_PITCH_MIN = -0.95;
export const WALK_PITCH_MAX = 0.6;
/** The walker's field of view — wider than the overview's 38° so a street reads as a street. */
export const WALK_FOV = 62;
/** Near clipping plane in walk mode — the overview's 0,5 would cut every nearby facade. */
export const WALK_NEAR = 0.03;
/** Margin inside a road cell the eye may not cross (half cell = 0,5; 0,42 keeps it off the kerb). */
const CELL_REACH = 0.42;

function cellToWorld(x, y, gridSize) {
  const half = (gridSize - 1) / 2;
  return { x: x - half, z: y - half };
}

/**
 * @param {{ roadCells: Array<{x:number,y:number}>, gridSize:number }} input
 * @returns a walker: `start()`, `advance(steps)`, `turn(radians)`, `look(dYaw, dPitch)`, `state()`, `orbitState()`
 */
export function createWalker({ roadCells = [], gridSize = 12, groundAt = null } = {}) {
  const cells = new Set(roadCells.map((c) => `${c.x}|${c.y}`));
  const half = (gridSize - 1) / 2;
  const onRoad = (wx, wz) => {
    // the cell whose centre is nearest, then the margin test — a point between two road cells is fine
    const cx = Math.round(wx + half); const cy = Math.round(wz + half);
    if (!cells.has(`${cx}|${cy}`)) return false;
    return Math.abs(wx + half - cx) <= CELL_REACH && Math.abs(wz + half - cy) <= CELL_REACH;
  };
  const roadNeighbours = (cx, cy) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => cells.has(`${cx + dx}|${cy + dy}`));

  let x = 0; let z = 0; let heading = 0; let pitch = 0; let placed = false;
  const floorAt = (wx, wz) => (typeof groundAt === 'function' ? (Number(groundAt(wx, wz)) || 0) : 0);

  function start() {
    // the road cell nearest the centre with a road neighbour to walk along; heading toward it
    let best = null;
    for (const key of cells) {
      const [cx, cy] = key.split('|').map(Number);
      const nb = roadNeighbours(cx, cy);
      if (nb.length === 0) continue;
      const d = Math.hypot(cx - half, cy - half);
      if (!best || d < best.d) best = { cx, cy, d, nb };
    }
    if (!best) { placed = false; return false; }
    const w = cellToWorld(best.cx, best.cy, gridSize);
    x = w.x; z = w.z;
    const [dx, dy] = best.nb[0];
    heading = Math.atan2(dx, dy);   // world +z is "north" for yaw 0 (see orbitPosition)
    pitch = 0; placed = true;
    return true;
  }

  function advance(steps = 1) {
    if (!placed) return false;
    const dx = Math.sin(heading) * STEP; const dz = Math.cos(heading) * STEP;
    let moved = false;
    for (let i = 0; i < Math.abs(steps); i += 1) {
      const s = Math.sign(steps) || 1;
      const nx = x + dx * s; const nz = z + dz * s;
      if (!onRoad(nx, nz)) break;
      x = nx; z = nz; moved = true;
    }
    return moved;
  }

  function turn(rad) { heading = ((heading + rad) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2); }
  function look(dYaw, dPitch) {
    turn(dYaw);
    pitch = Math.min(WALK_PITCH_MAX, Math.max(WALK_PITCH_MIN, pitch + dPitch));
  }

  /** The orbit state that puts the camera at the eye, looking along the heading (and up/down). */
  function orbitState() {
    const eyeY = floorAt(x, z) + EYE_HEIGHT;
    // orbitPosition: eye = target + (sin yaw · cos pitch · d, sin pitch · d, cos yaw · cos pitch · d)
    // we want eye = walker, target = walker + heading·d ⇒ yaw = heading + π; a NEGATIVE pitch puts
    // the eye below the look-at point, i.e. looking up — the walker's pitch already uses that sign.
    const p = pitch;
    const tx = x + Math.sin(heading) * Math.cos(p) * LOOK_AHEAD;
    const tz = z + Math.cos(heading) * Math.cos(p) * LOOK_AHEAD;
    const ty = eyeY - Math.sin(p) * LOOK_AHEAD;
    return { yaw: heading + Math.PI, pitch: p, distance: LOOK_AHEAD, target: { x: tx, y: ty, z: tz } };
  }

  return {
    start, advance, turn, look, orbitState,
    state: () => ({ x, z, heading, pitch, placed }),
    eyeHeight: () => floorAt(x, z) + EYE_HEIGHT,
    isPlaced: () => placed,
    cellCount: () => cells.size,
  };
}
