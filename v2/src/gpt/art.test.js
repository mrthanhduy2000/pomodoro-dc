import test from 'node:test';
import assert from 'node:assert/strict';
import { architectureOf, PLACES, SEASONS, postcardCity } from './art.js';
import { buildCity, ledger } from '../engine/city.js';
import { reduce } from '../engine/timer.js';
import { plotCenter } from '../city/layout.js';

function freeze(value) {
  if (value && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}

test('GPT presentation preserves existing session identities, notes, plots and progress across every style', () => {
  const at = Date.parse('2026-10-22T02:00:00Z');
  const events = [
    { id: 'plan', at: at - 1000, kind: 'build.plan', data: { planId: 'home', blueprint: 'e1-0', plot: { x: 0, y: 0 } } },
    { id: 'start', at, kind: 'focus.start', data: { sid: 'real-session', targetMin: 25, categoryId: 'cat_hoc_dh', goal: 'Keep this note' } },
    { id: 'complete', at: at + 1500000, kind: 'focus.complete', data: { sid: 'real-session', auto: true } },
  ];
  const now = at + 1600000;
  const city = buildCity(events, reduce(events, now), now);
  assert.equal(city.buildings.length, 1);
  const original = JSON.stringify(city);
  const positions = city.buildings.map((b) => plotCenter(b.plot));
  freeze(city);
  for (const _place of Object.keys(PLACES)) for (const _season of Object.keys(SEASONS)) {
    city.buildings.forEach((building) => {
      const architecture = architectureOf(building);
      assert.equal(architecture.progress, building.bricks.length / building.size);
      assert.ok(architecture.width / 2 < 1.3, 'facade stays inside the plot and clear of the fixed canal');
    });
    const postcard = postcardCity(city);
    assert.ok(postcard.buildings.every((b) => b.planId.startsWith('postcard-')));
    assert.equal(JSON.stringify(city), original, 'sample generation and skin reads cannot mutate real progress');
    assert.deepEqual(city.buildings.map((b) => plotCenter(b.plot)), positions);
  }
  assert.equal(city.buildings[0].bricks[0].sid, 'real-session');
  assert.equal(ledger(city.buildings[0]).notes[0].text, 'Keep this note');
});
