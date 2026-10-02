/**
 * layout.js — where everything of the diary city stands, in world units. Pure, no three.js, so the
 * geometry rules are testable in Node and identical on every device.
 *
 * Grid: plot (x, y) → world (x·PLOT, 0, y·PLOT). Streets run on the half-lines between plots.
 * A building's height IS its bricks: storey i sits at i·storeyH, one storey per session.
 */
import { shapeOf } from '../engine/catalog.js';
import { hash01 } from '../engine/city.js';

export const PLOT = 4;
export const STREET = 0.9;
const STOREY_H = { house: 0.38, hall: 0.34, market: 0.3, tower: 0.44, temple: 0.36 };

export const plotCenter = (p) => ({ x: p.x * PLOT, z: p.y * PLOT });

export function storeyHeight(shape) {
  return STOREY_H[shape] ?? STOREY_H.house;
}

/** Box of storey `i` of a building: centre + size. Temples step in each storey. */
export function storeyBox(building, i) {
  const s = shapeOf(building.shape);
  const h = storeyHeight(building.shape);
  const k = Math.max(0.35, 1 - s.taper * i);
  const c = plotCenter(building.plot);
  return { x: c.x, y: h * i + h / 2, z: c.z, w: s.w * k, h: h * 0.9, d: s.d * k };
}

/** Height of the top of a building with `n` storeys (where the roof sits). */
export function buildingTop(building, n = building.bricks.length) {
  return storeyHeight(building.shape) * n;
}

/** Bounds of the built area in plots, padded by one ring so new plots have a street. */
export function plotBounds(buildings, candidates = []) {
  const pts = [...buildings.map((b) => b.plot), ...candidates, { x: 0, y: 0 }];
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { minX: Math.min(...xs) - 1, maxX: Math.max(...xs) + 1, minY: Math.min(...ys) - 1, maxY: Math.max(...ys) + 1 };
}

/** Street intersections (half-lines between plots), nearest the centre first. */
export function intersections(bounds) {
  const out = [];
  for (let i = bounds.minX; i < bounds.maxX; i += 1) {
    for (let j = bounds.minY; j < bounds.maxY; j += 1) {
      out.push({ x: (i + 0.5) * PLOT, z: (j + 0.5) * PLOT });
    }
  }
  return out.sort((a, b) => (a.x * a.x + a.z * a.z) - (b.x * b.x + b.z * b.z) || a.z - b.z || a.x - b.x);
}

/**
 * The lantern avenue: lantern k stands on the street just south of row 0, alternating east and
 * west so the avenue grows outward from the centre in both directions as full days accumulate.
 */
export function lanternSpot(k) {
  const side = k % 2 === 0 ? 1 : -1;
  const step = Math.floor(k / 2);
  const along = side * (0.9 + step * 1.25);
  const row = Math.floor(step / 14); // a very long avenue folds onto the next street south
  const x = row % 2 === 0 ? along : -along;
  return { x, z: PLOT / 2 + (k % 4 < 2 ? -0.62 : 0.62) + row * PLOT };
}

/** Where a resident is at time `t` (seconds): a loop around the home block, phase from its id. */
export function residentSpot(resident, home, t) {
  const c = home ? plotCenter(home.plot) : { x: PLOT / 2, z: PLOT / 2 };
  const r = PLOT / 2 - 0.25;
  const phase = hash01(`res:${resident.key}`);
  const speed = 0.035 + 0.02 * hash01(`spd:${resident.key}`);
  const dir = hash01(`dir:${resident.key}`) < 0.5 ? 1 : -1;
  const u = (((phase + dir * speed * t) % 1) + 1) % 1; // 0..1 around the square
  const side = Math.floor(u * 4);
  const f = u * 4 - side;
  const corners = [[-r, -r], [r, -r], [r, r], [-r, r], [-r, -r]];
  const [ax, az] = corners[side];
  const [bx, bz] = corners[side + 1];
  const heading = Math.atan2((bx - ax) * dir, (bz - az) * dir); // facing the way it walks
  return { x: c.x + ax + (bx - ax) * f, z: c.z + az + (bz - az) * f, heading };
}

/** Brick yard: loose bricks stack at the first intersection, 6 per course. */
export function yardSpot(bounds, i) {
  const at = intersections(bounds)[0] ?? { x: PLOT / 2, z: PLOT / 2 };
  const course = Math.floor(i / 6);
  const k = i % 6;
  return { x: at.x - 0.36 + (k % 3) * 0.36, y: 0.09 + course * 0.18, z: at.z - 0.2 + Math.floor(k / 3) * 0.4 };
}

/** Statues take the intersections after the yard. */
export function statueSpot(bounds, i) {
  // More statues than intersections: spill onto the next ring out — never wrap back onto the yard.
  let pad = 0;
  let list = intersections(bounds);
  while (list.length <= i + 1) {
    pad += 1;
    list = intersections({ minX: bounds.minX - pad, maxX: bounds.maxX + pad, minY: bounds.minY - pad, maxY: bounds.maxY + pad });
  }
  return list[i + 1];
}

/** Camera framing for the whole city: distance grows with its extent. */
export function overviewFrame(bounds) {
  const cx = ((bounds.minX + bounds.maxX) / 2) * PLOT;
  const cz = ((bounds.minY + bounds.maxY) / 2) * PLOT;
  const span = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * PLOT;
  const dist = Math.max(14, span * 1.15);
  return { target: { x: cx, y: 0.6, z: cz }, position: { x: cx + dist * 0.62, y: dist * 0.72, z: cz + dist * 0.78 } };
}

/** Camera framing for one building: close, from the south-east, a little above its top. */
export function focusFrame(building) {
  const c = plotCenter(building.plot);
  const top = buildingTop(building, Math.max(1, building.bricks.length));
  const y = Math.max(0.8, top * 0.6);
  return { target: { x: c.x, y, z: c.z }, position: { x: c.x + 5.2, y: y + 4.2, z: c.z + 6.4 } };
}
