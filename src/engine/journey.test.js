/**
 * journey.test.js — THE DESTINATION, and the one rule that makes it a destination.
 *
 * Each test below is written to answer *"red when you remove WHAT?"* (project law #3), and each
 * one was checked by actually removing that thing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { BLUEPRINT_CATALOG } from './constants.js';
import { TOTAL_BUILDINGS, TOTAL_ERAS, describeJourney, describeRailProgress } from './journey.js';

// ─── THE DENOMINATOR IS READ, NEVER TYPED ────────────────────────────────────────────────────
// RED WHEN: someone writes `const TOTAL_BUILDINGS = 75` instead of summing the catalog. That is the
// likely "tidy-up", and it silently freezes the destination the day a 16th era is added — the app
// would then tell Đàm he is 75/75 done while five buildings sit unbuilt.
test('the destination is derived from BLUEPRINT_CATALOG, not from a literal', () => {
  const eras = Object.keys(BLUEPRINT_CATALOG).length;
  const buildings = Object.values(BLUEPRINT_CATALOG).reduce((n, list) => n + list.length, 0);
  assert.equal(TOTAL_ERAS, eras);
  assert.equal(TOTAL_BUILDINGS, buildings);
  assert.ok(TOTAL_BUILDINGS > TOTAL_ERAS, 'a city with fewer buildings than eras means the catalog changed shape');
});

// ─── THE SENTENCE ────────────────────────────────────────────────────────────────────────────
// RED WHEN: the sentence stops naming BOTH ends — what is done and what is left. A sentence that
// only says "38 built" is a scoreboard; the round-43 brief required a destination.
test('the one sentence names what is done AND what is left', () => {
  const j = describeJourney({ museum: { builtTotal: 38 }, activeBook: 8 });
  assert.equal(j.built, 38);
  assert.equal(j.remaining, TOTAL_BUILDINGS - 38);
  assert.match(j.sentence, /38/);
  assert.match(j.sentence, new RegExp(String(TOTAL_BUILDINGS - 38)));
  assert.match(j.sentence, new RegExp(String(TOTAL_BUILDINGS)));
});

test('a finished city says so, and never says "còn 0"', () => {
  const j = describeJourney({ museum: { builtTotal: TOTAL_BUILDINGS }, activeBook: 15 });
  assert.equal(j.remaining, 0);
  assert.doesNotMatch(j.sentence, /còn 0/);
  assert.match(j.sentence, /trọn vẹn/);
});

// RED WHEN: the clamp is dropped. Legacy saves and a hand-edited import can carry a `builtTotal`
// above the catalog total; "80/75 công trình · còn -5" is the kind of number that makes every other
// number on the screen suspect.
test('a corrupt or legacy count can never read above the total, or below zero', () => {
  assert.equal(describeJourney({ museum: { builtTotal: 999 } }).built, TOTAL_BUILDINGS);
  assert.equal(describeJourney({ museum: { builtTotal: 999 } }).remaining, 0);
  assert.equal(describeJourney({ museum: { builtTotal: -4 } }).built, 0);
  assert.equal(describeJourney({ museum: null }).built, 0);
  assert.equal(describeJourney().built, 0);
});

// ─── THE RAIL NEVER FALLS BACK TO EP ─────────────────────────────────────────────────────────
// ⚠️ THE TEST THIS FILE EXISTS FOR. `describeStageCountdown` has THREE answers, and one of them is
// phrased in EP ("Còn 1.645 EP nữa tới «…»") for the case where there is no session sample yet.
// Letting that one through would quietly restore the exact number round 43 removed — and nothing
// else would go red, because the rail would still be showing *a* string.
// RED WHEN: the `/\bEP\b/` guard in `describeRailProgress` is deleted "because the countdown
// already handles it".
test('the rail shows the destination rather than an EP number when the pace is unknown', () => {
  const stage = { label: 'X', nextLabel: 'Y', epRemaining: 1645, epInStage: 222, epRange: 1867 };
  const out = describeRailProgress({ stage, epPerSession: null, journey: describeJourney({ museum: { builtTotal: 38 } }) });
  assert.doesNotMatch(out.text, /\bEP\b/, 'the top rail printed EP again — the one number round 43 took out');
  assert.equal(out.tone, 'destination');
  assert.match(out.text, /38\//);
});

test('the rail speaks in sessions whenever the pace is known and the target is near', () => {
  const stage = { label: 'X', nextLabel: 'Y', epRemaining: 600, epInStage: 222, epRange: 1867 };
  const out = describeRailProgress({ stage, epPerSession: 200 });
  assert.match(out.text, /phiên/);
  assert.doesNotMatch(out.text, /\bEP\b/);
});

// RED WHEN: the far-away case is made to print a session count anyway. `describeStageCountdown`
// deliberately goes silent past STAGE_COUNTDOWN_MAX_SESSIONS because "còn ~64 phiên" discourages;
// the rail must then show the destination, not nothing and not EP.
test('a target too far away falls through to the destination, never to silence', () => {
  const stage = { label: 'X', nextLabel: 'Y', epRemaining: 40_000, epInStage: 10, epRange: 40_010 };
  const out = describeRailProgress({ stage, epPerSession: 200, journey: describeJourney({ museum: { builtTotal: 12 } }) });
  assert.equal(out.tone, 'destination');
  assert.match(out.text, /12\//);
  assert.ok(out.text.length > 0);
});

// RED WHEN: `describeRailProgress` is called with no stage at all (a era with no declared stages —
// `getEraStage` returns null there) and someone lets it throw or return an empty string.
test('no stage at all still produces the destination', () => {
  const out = describeRailProgress({ stage: null, epPerSession: 200 });
  assert.equal(out.tone, 'destination');
  assert.match(out.text, /công trình/);
});
