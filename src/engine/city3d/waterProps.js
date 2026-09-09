/**
 * waterProps.js — BOATS ON THE WATER (round 49, ADR-089).
 *
 * Round 48 gave the water two crossed waves and nothing to ride them. Boats are the cheapest motion
 * in the city by design: their hulls carry the `hull` role, so the motion layer bobs them; their sails
 * carry `cloth`, so they flap. This file only decides WHERE a boat sits — a pure, deterministic pick
 * over the water cells of the era's setting (`setting.insetAt(u, v)` > 0 is inside the water).
 *
 * Only add, never move: positions come from a fixed lattice + hash, keyed by era, independent of
 * progress, so a sealed era's harbour is the same picture every time it is reopened.
 */
import { hashId, unit } from '../hashId';
import { buildSetting } from './setting';
import { distanceOutsideGrid } from './outskirts';

/** Boats per era and the kind of hull the era built. `null` = no boat (no water, or too small). */
export const ERA_BOATS = Object.freeze({
  2:  { count: 3, kind: 'felucca',  note: 'Nile feluccas — lateen sail, shallow hull' },
  6:  { count: 2, kind: 'sampan',   note: 'sampans on the delta river, arched cabin, no sail' },
  8:  { count: 4, kind: 'caravel',  note: 'Belém: caravels and fishing boats, two square sails' },
  9:  { count: 1, kind: 'barge',    note: 'a Seine péniche, long and low' },
  11: { count: 2, kind: 'steamer',  note: 'Hudson ferries, funnel, no sail' },
  13: { count: 2, kind: 'motor',    note: 'Tokyo bay: small motor boats' },
  14: { count: 3, kind: 'yacht',    note: 'Marina Bay: white yachts' },
  15: { count: 3, kind: 'dhow',     note: 'Dubai creek: dhows with a lateen sail' },
});

const MIN_INSET = { river: 0.42, canal: 0.32, meander: 0.42, estuary: 0.9, sea: 1.0 };
const SPACING = 1.7;
const SCAN = 10;   // cells beyond the grid to look for water — Dubai's sea starts 7 cells out

/**
 * @returns {Array<{kind:'boat', boat:string, x:number, y:number, ry:number, variant:number, onWater:true}>}
 *          `x`/`y` are CELL coordinates (fractional), like every other prop.
 */
export function deriveWaterProps({ era, gridSize = 12 } = {}) {
  const key = Number.isFinite(era) ? era : 1;
  const plan = ERA_BOATS[key];
  if (!plan) return [];
  const setting = buildSetting({ era: key, gridSize });
  if (!setting?.hasWater || !setting.built) return [];
  const minInset = MIN_INSET[setting.style?.water] ?? 0.5;

  // candidate points on a half-cell lattice, sorted by hash so the pick is deterministic and even
  const cands = [];
  for (let v = -SCAN; v <= gridSize - 1 + SCAN; v += 0.5) {
    for (let u = -SCAN; u <= gridSize - 1 + SCAN; u += 0.5) {
      const inset = setting.insetAt(u, v);
      if (!(inset >= minInset)) continue;
      const d = distanceOutsideGrid(u, v, gridSize);
      // prefer water near the city: the harbour is where the eye is
      const near = Math.max(0, 1 - d / SCAN);
      const roll = unit(`${key}|boat|${u}|${v}`);
      cands.push({ u, v, score: roll * 0.55 + near * 0.45 });
    }
  }
  cands.sort((a, b) => b.score - a.score || a.u - b.u || a.v - b.v);

  const out = [];
  for (const c of cands) {
    if (out.length >= plan.count) break;
    if (out.some((b) => Math.hypot(b.x - c.u, b.y - c.v) < SPACING)) continue;
    // a boat lies along the water: a river's long axis is the axis whose bounds are open
    const b = setting.bounds;
    const alongU = b && (b.u0 === null || b.u0 === undefined) && (b.u1 === null || b.u1 === undefined);
    const alongV = b && (b.v0 === null || b.v0 === undefined) && (b.v1 === null || b.v1 === undefined);
    const base = alongU && !alongV ? 0 : alongV && !alongU ? Math.PI / 2 : unit(`${key}|bry|${c.u}|${c.v}`) * Math.PI * 2;
    const ry = base + (unit(`${key}|bj|${c.u}|${c.v}`) - 0.5) * 0.5;
    out.push({
      kind: 'boat', boat: plan.kind, x: c.u, y: c.v, ry,
      variant: hashId(`${key}|bv|${c.u}|${c.v}`) % 4, onWater: true,
    });
  }
  return out;
}
