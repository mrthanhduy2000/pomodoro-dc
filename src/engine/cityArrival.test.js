/**
 * cityArrival.test.js — the City tab's "a building finished since you last looked" is a difference of
 * counts, priced by the economy, silent on a first visit, and never negative.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripComments } from '../utils/sourceScan.js';
import { SP_PER_BUILDING } from './skillPointEconomy.js';
import { ARRIVAL_VISIBLE_MS, describeCityArrival, nextCitySeenTotal } from './cityArrival.js';

const VIEW = stripComments(readFileSync(new URL('../components/CityView.jsx', import.meta.url), 'utf8'));

test('a first visit (no stamp) says nothing — announcing 38 old buildings would be a lie', () => {
  assert.equal(describeCityArrival({ builtTotal: 38, seenTotal: null }), null);
  assert.equal(describeCityArrival({ builtTotal: 38, seenTotal: undefined }), null);
});

test('one new building: named, and priced in SP from the economy', () => {
  const m = describeCityArrival({ builtTotal: 57, seenTotal: 56, newestLabel: 'Xưởng Vũ Khí' });
  assert.equal(m.count, 1);
  assert.equal(m.sp, SP_PER_BUILDING);
  assert.equal(m.title, 'Xưởng Vũ Khí');
  assert.match(m.line, new RegExp(`^\\+${SP_PER_BUILDING} SP`), 'SP first — ADR-084');
});

test('several new buildings: counted, priced by count', () => {
  const m = describeCityArrival({ builtTotal: 57, seenTotal: 54, newestLabel: 'Xưởng Vũ Khí' });
  assert.equal(m.count, 3);
  assert.equal(m.sp, 3 * SP_PER_BUILDING);
  assert.equal(m.title, '3 công trình mới');
});

test('a city that shrank (cloud pull, import) is never announced as negative, and the stamp never goes down', () => {
  assert.equal(describeCityArrival({ builtTotal: 50, seenTotal: 57 }), null);
  assert.equal(describeCityArrival({ builtTotal: 57, seenTotal: 57 }), null);
  assert.equal(nextCitySeenTotal({ builtTotal: 50, seenTotal: 57 }), 57);
  assert.equal(nextCitySeenTotal({ builtTotal: 58, seenTotal: 57 }), 58);
  assert.equal(nextCitySeenTotal({ builtTotal: 12, seenTotal: null }), 12);
});

test('the moment has an exit: a few seconds, not a badge', () => {
  assert.ok(ARRIVAL_VISIBLE_MS >= 3000 && ARRIVAL_VISIBLE_MS <= 6000);
});

// An engine test proves the function RUNS; this proves the City tab CALLS it and stamps what it saw.
test('CityView.jsx calls describeCityArrival, writes the stamp, and hands the moment to the stage', () => {
  assert.match(VIEW, /describeCityArrival\(\{/, 'CityView never asks whether a building finished');
  assert.match(VIEW, /nextCitySeenTotal\(\{/, 'CityView never advances the stamp — the moment would replay on every open');
  assert.match(VIEW, /const SEEN_KEY = 'dc-city-seen-v1'/, 'the stamp key changed or vanished — `--ls dc-city-seen-v1=…` is how the moment is photographed');
  assert.match(VIEW, /localStorage\.setItem\(SEEN_KEY/, 'the stamp is not written to localStorage');
  assert.match(VIEW, /moment=\{moment\}/, 'the moment is computed but never passed to CityStage');
  assert.match(VIEW, /ARRIVAL_VISIBLE_MS/, 'the moment has no timer — it would stand forever (ADR-080)');
});
