/**
 * skillPointEconomy.test.js — the ledger that pays the skill tree.
 *
 * Every case answers *"red when you remove WHAT?"* (project law #3) and each was checked by
 * actually removing that thing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { SKILL_TREE, BLUEPRINT_META } from './constants.js';
import { SP_PER_BUILDING, cityEarnedSP, settleCitySP } from './skillPointEconomy.js';
import { TOTAL_BUILDINGS } from './journey.js';

// ─── THE BALANCE IS THE ARGUMENT ─────────────────────────────────────────────────────────────
// RED WHEN: someone "rounds up" SP_PER_BUILDING to 2 because one point feels stingy. That doubles
// the city's payout to 150 SP against a 138 SP tree, which covers the whole tree from one source
// and makes the weekly chain and the level ladder decorative — the exact failure this round was
// called to fix, only pointed the other way.
test('one building pays exactly one skill point, and the city alone cannot buy the whole tree', () => {
  const treeCost = Object.values(SKILL_TREE)
    .flatMap((branch) => branch.nodes)
    .reduce((sum, node) => sum + node.spCost, 0);

  assert.equal(SP_PER_BUILDING, 1);
  assert.equal(treeCost, 138, 'the tree changed size — re-derive SP_PER_BUILDING before touching it');
  const cityTotal = cityEarnedSP(TOTAL_BUILDINGS);
  assert.equal(cityTotal, 75);
  assert.ok(cityTotal < treeCost,
    'the city now covers the entire tree by itself; the weekly chain and levels have become decoration');
  assert.ok(cityTotal > treeCost / 2,
    'the city is no longer the main source of skill points — the 155-session wall is back in a new shape');
});

// RED WHEN: the ratio the round exists for is quietly lost. 420 build-sessions across 75 buildings
// is ~5,6 sessions per point, down from ~86. This pins the ORDER OF MAGNITUDE, not the decimals.
test('a skill point costs on the order of five sessions, not eighty-five', () => {
  const buildSessions = Object.values(BLUEPRINT_META)
    .reduce((sum, meta) => sum + (meta.sessionsToComplete || 0), 0);
  const sessionsPerSP = buildSessions / cityEarnedSP(TOTAL_BUILDINGS);
  assert.ok(sessionsPerSP > 3 && sessionsPerSP < 10,
    `a skill point now costs ${sessionsPerSP.toFixed(1)} sessions — outside the 3–10 band this round was balanced in`);
});

// ─── THE LEDGER ──────────────────────────────────────────────────────────────────────────────
// ⚠️ THE TEST THIS FILE EXISTS FOR. A save made before this rule has 38 buildings and an empty
// ledger; it must be paid for all of them, exactly once, with no migration step.
test('a save that predates the rule is paid in full on its first settle, and never again', () => {
  const first = settleCitySP({ builtTotal: 38, credited: 0 });
  assert.equal(first.owed, 38);
  assert.equal(first.credited, 38);

  const second = settleCitySP({ builtTotal: 38, credited: first.credited });
  assert.equal(second.owed, 0, 'settling twice paid twice — the ledger is not being written back');
});

test('settling after one more building pays exactly one more point', () => {
  const after = settleCitySP({ builtTotal: 39, credited: 38 });
  assert.equal(after.owed, 1);
  assert.equal(after.credited, 39);
});

// RED WHEN: the `Math.max(0, …)` clamp is dropped. A city can shrink — a cloud pull from a device
// that is behind, an import of an older save. Clawing points back would remove skills Đàm has
// already spent and already feels, which is the one thing an economy must never do.
test('a city that shrinks never claws points back', () => {
  const shrunk = settleCitySP({ builtTotal: 30, credited: 38 });
  assert.equal(shrunk.owed, 0);
  assert.equal(shrunk.credited, 38, 'the ledger was rewound, so the next growth would be paid twice');
});

test('garbage in the ledger or the count is read as zero, never as NaN', () => {
  assert.equal(settleCitySP({ builtTotal: NaN, credited: 5 }).owed, 0);
  assert.equal(settleCitySP({ builtTotal: 5, credited: NaN }).owed, 5);
  assert.equal(settleCitySP({ builtTotal: -3, credited: -3 }).owed, 0);
  assert.equal(settleCitySP().owed, 0);
  assert.equal(cityEarnedSP(undefined), 0);
});
