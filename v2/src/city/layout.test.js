import test from 'node:test';
import assert from 'node:assert/strict';

import { blueprintsOf } from '../engine/catalog.js';
import { lanternSpot, PLOT, plotBounds, residentSpot, storeyBox, statueSpot, yardSpot } from './layout.js';

const building = (shape, plot = { x: 0, y: 0 }) => ({ shape, plot, bricks: [] });
const SHAPES = [...new Set(blueprintsOf(1).map((b) => b.shape))];

test('every shape fits inside its plot with room for the sidewalk loop and the street', () => {
  for (const shape of SHAPES) {
    const box = storeyBox(building(shape), 0);
    assert.ok(box.w / 2 < PLOT / 2 - 0.5, `${shape} too wide`);
    assert.ok(box.d / 2 < PLOT / 2 - 0.5, `${shape} too deep`);
  }
});

test('storeys stack without overlapping, and temples step inward', () => {
  for (const shape of SHAPES) {
    const b = building(shape);
    for (let i = 1; i < 12; i += 1) {
      const lo = storeyBox(b, i - 1);
      const hi = storeyBox(b, i);
      assert.ok(hi.y - hi.h / 2 >= lo.y + lo.h / 2 - 1e-9, `${shape} storey ${i} overlaps`);
      assert.ok(hi.w <= lo.w + 1e-9);
    }
  }
  assert.ok(storeyBox(building('temple'), 6).w < storeyBox(building('temple'), 0).w);
});

test('lanterns never share a spot and never stand on a plot', () => {
  const seen = new Set();
  for (let k = 0; k < 400; k += 1) {
    const p = lanternSpot(k);
    const key = `${p.x.toFixed(2)},${p.z.toFixed(2)}`;
    assert.ok(!seen.has(key), `lantern ${k} duplicates a spot`);
    seen.add(key);
    // distance from the nearest plot centre along z must leave the building row clear
    const dz = Math.abs(((p.z % PLOT) + PLOT) % PLOT - PLOT / 2);
    assert.ok(dz < 1, `lantern ${k} is off the street`);
  }
});

test('residents walk the loop around their block and never enter a building', () => {
  const home = building('market', { x: 2, y: -1 });
  for (let t = 0; t < 600; t += 7.3) {
    const s = residentSpot({ key: '2026-10-05' }, home, t);
    const dx = Math.abs(s.x - 2 * PLOT);
    const dz = Math.abs(s.z + PLOT);
    assert.ok(Math.max(dx, dz) > 1.2, 'inside the building');
    assert.ok(Math.max(dx, dz) < PLOT / 2 + 0.01, 'left its block');
  }
});

test('yard and statues use distinct intersections', () => {
  const bounds = plotBounds([building('house')]);
  const y = yardSpot(bounds, 0);
  for (let i = 0; i < 5; i += 1) {
    const s = statueSpot(bounds, i);
    assert.ok(Math.hypot(s.x - y.x, s.z - y.z) > 1, 'a statue on the brick yard');
  }
});
