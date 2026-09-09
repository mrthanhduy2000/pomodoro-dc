/**
 * lifeProps.js — SIGNS OF LIFE (round 49, ADR-089): market stalls, laundry lines, tents, wells,
 * barrels, firewood, campfires, lanterns, carts, animals — the things that turn an architectural
 * model into a place where people live. Đàm: *"Không cần chúng động — chỉ cần chúng có mặt, đúng
 * thời đại, đúng chỗ."*
 *
 * They are APPENDED to the props `computeCityLayout` already derived, on cells that are still free
 * and touch a road, chosen by a hash walk keyed to the era only. So: nothing that existed moves, the
 * pick is the same every time, and — like round 47's colours and round 48's motion — a sealed era
 * gains them without any of its own things shifting.
 */
import { hashId } from '../hashId';
import { CITY_GRID_SIZE } from '../cityGrid';

/** What a century leaves in its streets. Order matters: earlier kinds get the better cells. */
// Round 49 (ADR-089): the FIRST kind of every pre-electric era (and Stalingrad's burning barrel)
// carries a flame — `campfire` · `brazier` · `forge` — because `ERA_MOTION` declares `fire`
// particles for those eras, and a declared particle kind must have at least one source in every
// layout (`sceneStats.test.js`). First in the list ⇒ placed first ⇒ never dropped for lack of cells.
export const ERA_LIFE = Object.freeze({
  1:  [['campfire', 2], ['tent', 2], ['firewood', 1], ['animal', 1]],
  2:  [['brazier', 1], ['stall', 1], ['well', 1], ['animal', 1], ['firewood', 1]],
  3:  [['campfire', 1], ['stall', 2], ['animal', 2], ['well', 1]],
  4:  [['brazier', 1], ['stall', 2], ['lantern', 2], ['well', 1], ['cart', 1]],
  5:  [['forge', 1], ['well', 1], ['firewood', 2], ['animal', 1], ['cart', 1]],
  6:  [['campfire', 1], ['stall', 1], ['laundry', 2], ['animal', 2], ['lantern', 1]],
  7:  [['forge', 1], ['stall', 2], ['well', 1], ['laundry', 1], ['cart', 1]],
  8:  [['brazier', 1], ['stall', 2], ['barrels', 2], ['laundry', 1], ['cart', 1]],
  9:  [['forge', 1], ['stall', 1], ['cart', 2], ['lantern', 1], ['bench', 1]],
  10: [['forge', 1], ['barrels', 2], ['cart', 2], ['firewood', 1]],
  11: [['cart', 2], ['stall', 1], ['lantern', 1], ['bench', 1]],
  12: [['brazier', 1], ['firewood', 2], ['barrels', 1], ['laundry', 1]],
  13: [['lantern', 2], ['stall', 1], ['cart', 1], ['bench', 1]],
  14: [['cart', 2], ['stall', 1], ['bench', 1]],
  15: [['tent', 1], ['animal', 2], ['cart', 1]],
});

export const LIFE_KINDS = Object.freeze([...new Set(Object.values(ERA_LIFE).flat().map(([k]) => k))]);

const cellKey = (x, y) => `${x},${y}`;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * @param {object} input
 * @param {number} input.era
 * @param {Set<string>} input.blocked   cells already holding a building, dwelling, prop or cover
 * @param {Set<string>} input.roads     road cells (a stall wants the street)
 * @param {Set<string>} input.homes     building + dwelling cells (life gathers near houses)
 * @returns {Array<{kind:string, x:number, y:number, variant:number, ry:number}>}
 */
export function deriveLifeProps({ era, blocked, roads, homes, gridSize = CITY_GRID_SIZE } = {}) {
  const key = Number.isFinite(era) ? era : 1;
  const plan = ERA_LIFE[key] ?? [];
  if (plan.length === 0) return [];
  const taken = blocked instanceof Set ? new Set(blocked) : new Set();
  const road = roads instanceof Set ? roads : new Set();
  const home = homes instanceof Set ? homes : new Set();
  if (road.size === 0 && home.size === 0) return [];

  // candidate cells: free, touching a road, and within 2 cells of a house — ranked by hash
  const cands = [];
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const k = cellKey(x, y);
      if (taken.has(k) || road.has(k)) continue;
      const byRoad = N4.some(([dx, dy]) => road.has(cellKey(x + dx, y + dy)));
      let nearHome = false;
      for (let dy = -2; dy <= 2 && !nearHome; dy += 1) for (let dx = -2; dx <= 2; dx += 1) if (home.has(cellKey(x + dx, y + dy))) { nearHome = true; break; }
      if (!byRoad && !nearHome) continue;
      const score = (byRoad ? 0.5 : 0) + (nearHome ? 0.3 : 0) + (hashId(`${key}|life|${x}|${y}`) % 1000) / 1000 * 0.4;
      cands.push({ x, y, score });
    }
  }
  cands.sort((a, b) => b.score - a.score || a.y - b.y || a.x - b.x);

  const out = [];
  let i = 0;
  for (const [kind, count] of plan) {
    for (let n = 0; n < count; n += 1) {
      while (i < cands.length && taken.has(cellKey(cands[i].x, cands[i].y))) i += 1;
      if (i >= cands.length) return out;
      const c = cands[i]; i += 1;
      taken.add(cellKey(c.x, c.y));
      const seed = `${key}|${kind}|${c.x}|${c.y}`;
      out.push({
        kind, x: c.x, y: c.y,
        variant: hashId(`${seed}|v`) % 4,
        ry: (hashId(`${seed}|r`) % 4) * (Math.PI / 2),
        life: true,
      });
    }
  }
  return out;
}
