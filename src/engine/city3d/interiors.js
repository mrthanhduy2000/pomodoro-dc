/**
 * interiors.js — Round 50 (ADR-090): SEVENTY-FIVE SHELLS GET INSIDES.
 *
 * Đàm, round 50: *"Bảy mươi lăm công trình hiện là bảy mươi lăm cái vỏ. Cho chúng ruột."* Not a room —
 * just what an eye sees THROUGH the opening: a dark cavity behind the door, two or three objects, and
 * (for a forge or a hearth) a `flame` tagged `fire`, which the round-49 fire layer then turns into
 * particles, a glow at night and a flickering local light. A window at street level gets a smaller
 * version of the same thing.
 *
 * Rules that keep this cheap and safe:
 *   · every part is BEHIND the facade plane (negative z in the opening's local frame) — nothing new
 *     sticks out, so no bounding box, camera plan or symmetry test moves;
 *   · ⚠️ ONLY ROLES EVERY ERA ALREADY DRAWS. The first draft put a gold jar on a shelf and a straw
 *     bowl on a table, and era 12 — concrete, glass, no gold, no thatch — gained TWO material
 *     families, i.e. two draw calls, for two objects the size of a thumbnail. The palette is not a
 *     paint box here: `wall · wall2 · roof · trim · dark · stone · wood` are safe everywhere, the
 *     round-49 cloth roles ride `wood`, and `glass` only after era 7;
 *   · the contents of a building are a pure function of (era, type, seed) — deterministic, like
 *     everything else since lesson 104;
 *   · a `flame` here is a real fire source: `tag: 'fire'` is the ONE name both layers read.
 */
import { prism } from './parts';

/** What is inside a building of this type, in this century. First match wins. */
export const INTERIOR_KINDS = Object.freeze([
  'forge',      // an anvil, a hearth, a fire — workshops before electricity
  'shelves',    // a counter and stacked goods — shops
  'table',      // a table, two stools, a bowl — houses
  'loom',       // an upright loom — weaving eras
  'books',      // a bookcase and a reading desk — scholarly buildings
  'altar',      // a low altar with an offering and a lamp — temples
  'bar',        // a counter with bottles — taverns, cafés
  'bed',        // a low bed and a chest — dwellings at night
  'grain',      // sacks and a scoop — granaries, farm buildings
  'desk',       // a desk and a chair — offices, modern eras
]);

/**
 * Which interior a (era, type) gets. `type` is the blueprint's own type when there is one
 * (`house` · `shop` · `workshop`), else the dwelling default.
 */
export function interiorKindFor(era, type, seed = 0) {
  const e = Number(era) || 1;
  const t = String(type ?? 'house');
  const pick = Math.floor(seed * 3) % 3;
  if (t === 'workshop') {
    if (e >= 12) return 'desk';
    if (e >= 5 && e <= 11) return pick === 0 ? 'forge' : (pick === 1 ? 'loom' : 'forge');
    return pick === 0 ? 'forge' : 'grain';
  }
  if (t === 'shop') {
    if (e >= 12) return pick === 0 ? 'desk' : 'shelves';
    if (e >= 7) return pick === 0 ? 'bar' : 'shelves';
    return 'shelves';
  }
  // houses and dwellings
  if (e >= 12) return pick === 0 ? 'desk' : (pick === 1 ? 'table' : 'bed');
  if (e >= 4 && pick === 0) return 'altar';
  if (pick === 1) return 'bed';
  if (pick === 2 && e >= 3 && e <= 11) return 'loom';
  return 'table';
}

/** Interiors that BURN — the fire layer picks their flame up as a source. */
export const FIRE_INTERIORS = Object.freeze(new Set(['forge', 'altar']));

/**
 * Emit one interior behind an opening.
 *
 * @param out    parts array to push into
 * @param p      `{ x, z, y, ry, width, height, depth, kind, role }` — the opening's centre in the
 *               building's local frame, its size, how deep the cavity goes, and which interior.
 *               `+z` is OUTWARD (towards the street), so everything here uses `z - …`.
 */
export function emitInterior(out, p) {
  const { x = 0, z = 0, y = 0, ry = 0, width = 0.2, height = 0.3, depth = 0.14, kind = 'table' } = p ?? {};
  if (!(width > 0) || !(height > 0) || !(depth > 0)) return false;
  const w = width; const h = height; const back = z - depth;
  const push = (dx, dy, dw, dh, role, extra = {}) => out.push(prism({
    x: x + dx * w, z: back + (extra.dz ?? 0.012),
    y: y + dy * h, w: dw * w, d: extra.d ?? 0.02, h: dh * h,
    sides: extra.sides ?? 4, ry, role, ...(extra.tag ? { tag: extra.tag } : {}),
  }));

  // The cavity itself: a dark panel across the back of the opening. Without it the eye sees the
  // wall's own colour through the hole and nothing reads as "inside".
  out.push(prism({ x, z: back, y, w: w * 0.98, d: 0.02, h: h * 0.98, sides: 4, ry, role: 'dark' }));

  switch (kind) {
    case 'forge':
      push(-0.18, 0.02, 0.42, 0.30, 'stone');                       // the hearth
      push(-0.18, 0.24, 0.26, 0.26, 'flame', { tag: 'fire', sides: 5, dz: 0.02 });   // the fire
      push(0.24, 0.04, 0.30, 0.16, 'dark');                          // the anvil block
      push(0.24, 0.20, 0.34, 0.08, 'dark', { dz: 0.02 });            // the anvil
      break;
    case 'shelves':
      for (let i = 0; i < 3; i += 1) push(0, 0.16 + i * 0.26, 0.86, 0.05, 'wood');
      push(-0.22, 0.24, 0.18, 0.14, 'trim', { dz: 0.02 });
      push(0.18, 0.50, 0.22, 0.12, 'canvas', { dz: 0.02 });
      push(0, -0.24, 0.9, 0.22, 'wood');                             // the counter
      break;
    case 'table':
      push(0, 0.06, 0.62, 0.06, 'wood');                             // the table top
      push(0, -0.14, 0.10, 0.34, 'wood');                            // its leg
      push(-0.26, -0.02, 0.14, 0.22, 'wood');                        // a stool
      push(0.26, -0.02, 0.14, 0.22, 'wood');
      push(0, 0.14, 0.14, 0.08, 'stone', { sides: 6, dz: 0.02 });    // a bowl on it
      break;
    case 'loom':
      push(0, 0.1, 0.10, 0.86, 'wood');
      push(-0.3, 0.1, 0.10, 0.86, 'wood');
      for (let i = 0; i < 4; i += 1) push(-0.15, 0.36 - i * 0.2, 0.42, 0.03, 'canvas', { dz: 0.02 });
      push(0.28, -0.1, 0.22, 0.3, 'cloth', { dz: 0.02 });            // a finished bolt
      break;
    case 'books':
      for (let i = 0; i < 4; i += 1) push(-0.2, 0.5 - i * 0.24, 0.5, 0.06, 'wood');
      for (let i = 0; i < 4; i += 1) push(-0.2, 0.56 - i * 0.24, 0.44, 0.14, 'trim', { dz: 0.024 });
      push(0.3, -0.06, 0.34, 0.06, 'wood');                          // the desk
      break;
    case 'altar':
      push(0, -0.1, 0.56, 0.28, 'stone');
      push(0, 0.16, 0.34, 0.1, 'trim', { dz: 0.02 });
      push(-0.2, 0.28, 0.1, 0.14, 'flame', { tag: 'fire', sides: 5, dz: 0.024 });
      break;
    case 'bar':
      push(0, -0.18, 0.92, 0.34, 'wood');
      for (let i = 0; i < 5; i += 1) push(-0.34 + i * 0.17, 0.3, 0.07, 0.2, 'glass', { dz: 0.024 });
      push(0, 0.5, 0.86, 0.06, 'wood');
      break;
    case 'bed':
      push(-0.1, -0.2, 0.7, 0.18, 'wood');
      push(-0.1, -0.06, 0.66, 0.1, 'canvas', { dz: 0.022 });
      push(0.34, -0.1, 0.24, 0.24, 'wood');                          // a chest
      break;
    case 'grain':
      for (let i = 0; i < 3; i += 1) push(-0.28 + i * 0.28, -0.12 + (i % 2) * 0.06, 0.24, 0.34, 'canvas', { sides: 6 });
      push(0.3, 0.24, 0.16, 0.1, 'wood', { dz: 0.02 });
      break;
    case 'desk':
    default:
      push(0, -0.04, 0.78, 0.07, 'trim');                            // the desk top
      push(0, 0.16, 0.34, 0.22, 'glass', { dz: 0.02 });              // a screen or a lamp
      push(-0.3, -0.24, 0.16, 0.3, 'dark');                          // a chair back
      break;
  }
  return true;
}
