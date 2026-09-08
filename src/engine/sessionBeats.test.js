/**
 * sessionBeats.test.js — the beats are a function of elapsed time, carry no digit, and vanish.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BEAT_WINDOW_SECONDS, GOLDEN_BEAT_CHANCE, planBreakBeats, planSessionBeats, resolveBeat,
  rollGoldenBeat, sessionPhaseGlyph,
} from './sessionBeats.js';

test('a 25-minute session has four beats at 5:00 · 12:30 · 20:00 · 24:00, in order, digit-free', () => {
  const beats = planSessionBeats(25 * 60);
  assert.deepEqual(beats.map((b) => [b.id, b.at]), [['settled', 300], ['halfway', 750], ['final', 1200], ['lastMinute', 1440]]);
  for (const b of beats) {
    assert.doesNotMatch(b.label, /\d/, `"${b.label}" carries a digit — the round-39 count (≤2 numbers) must hold during a beat`);
    assert.ok(b.label.length <= 12, `"${b.label}" is too long for the ring's label slot`);
    assert.ok(b.glyph.length >= 1);
  }
});

test('a 50-minute session settles at the 5-minute cap; a 10-minute one at 2:00; a 5-minute one has only halfway; 90 s has none', () => {
  assert.equal(planSessionBeats(50 * 60).find((b) => b.id === 'settled').at, 300);
  assert.equal(planSessionBeats(50 * 60).find((b) => b.id === 'final').at, 50 * 60 - 300);
  assert.equal(planSessionBeats(10 * 60).find((b) => b.id === 'settled').at, 120);
  assert.deepEqual(planSessionBeats(5 * 60).map((b) => b.id), ['halfway']);
  assert.deepEqual(planSessionBeats(90), []);
  assert.deepEqual(planSessionBeats(NaN), []);
});

test('beats never stack: every pair is at least one window apart', () => {
  for (const minutes of [2, 3, 5, 10, 12, 15, 25, 45, 50, 90, 120]) {
    const beats = planSessionBeats(minutes * 60);
    for (let i = 1; i < beats.length; i += 1) {
      assert.ok(beats[i].at - beats[i - 1].at >= BEAT_WINDOW_SECONDS, `${minutes} min: ${beats[i - 1].id} and ${beats[i].id} overlap`);
    }
  }
});

test('resolveBeat: inside the window → the beat; outside → null; a missed beat does not queue up', () => {
  const beats = planSessionBeats(25 * 60);
  assert.equal(resolveBeat(beats, 749), null);
  assert.equal(resolveBeat(beats, 750).id, 'halfway');
  assert.equal(resolveBeat(beats, 750 + BEAT_WINDOW_SECONDS - 1).id, 'halfway');
  assert.equal(resolveBeat(beats, 750 + BEAT_WINDOW_SECONDS), null, 'the window closes — nothing static');
  assert.equal(resolveBeat(beats, 1000), null, 'a tab that slept through 12:30 sees nothing at 16:40');
  assert.equal(resolveBeat(beats, NaN), null);
  assert.equal(resolveBeat(null, 750), null);
});

test('break beats: stand up early, water halfway, come back at one minute left; short breaks only warn', () => {
  assert.deepEqual(planBreakBeats(5 * 60).map((b) => [b.id, b.at]), [['leave', 20], ['water', 150], ['return', 240]]);
  assert.deepEqual(planBreakBeats(2 * 60).map((b) => b.id), ['return']);
  assert.deepEqual(planBreakBeats(60), []);
  for (const b of planBreakBeats(15 * 60)) assert.doesNotMatch(b.label, /\d/);
});

test('the tab-title glyph grows ○ ◔ ◑ ◕ ● with progress and never shows a digit', () => {
  const total = 1500;
  assert.equal(sessionPhaseGlyph(0, total), '○');
  assert.equal(sessionPhaseGlyph(374, total), '○');
  assert.equal(sessionPhaseGlyph(375, total), '◔');
  assert.equal(sessionPhaseGlyph(750, total), '◑');
  assert.equal(sessionPhaseGlyph(1125, total), '◕');
  assert.equal(sessionPhaseGlyph(1500, total), '●');
  assert.equal(sessionPhaseGlyph(10, 0), '○');
});

test('NO SILENCE OVER 15 MINUTES at any length (ADR-081): 15 · 25 · 50 · 90 minutes all keep a rhythm', () => {
  for (const minutes of [15, 25, 50, 90, 120]) {
    const beats = planSessionBeats(minutes * 60);
    let prev = 0;
    for (const b of beats) {
      assert.ok(b.at - prev <= 15 * 60 + 1, `${minutes} min: ${Math.round((b.at - prev) / 60)} minutes of silence before ${b.id}`);
      prev = b.at;
    }
    assert.ok(minutes * 60 - prev <= 15 * 60 + 1, `${minutes} min: the session ends ${Math.round((minutes * 60 - prev) / 60)} minutes after the last beat`);
    for (const b of beats) assert.doesNotMatch(b.label, /\d/, `"${b.label}" carries a digit`);
  }
  // A 25-minute session keeps EXACTLY the four beats of ADR-080 — the filler must not crowd it.
  assert.deepEqual(planSessionBeats(25 * 60).map((b) => b.id), ['settled', 'halfway', 'final', 'lastMinute']);
  // A 90-minute one gets fillers, evenly spread, never more than one per gap-and-a-half.
  const long = planSessionBeats(90 * 60);
  assert.ok(long.length >= 7 && long.length <= 10, `a 90-minute session got ${long.length} beats`);
  assert.ok(long.some((b) => b.id.startsWith('flow')), 'long sessions need "still going" beats');
});

test('a long break keeps the same law', () => {
  const beats = planBreakBeats(30 * 60);
  let prev = 0;
  for (const b of beats) { assert.ok(b.at - prev <= 15 * 60 + 1, `silence before ${b.id}`); prev = b.at; }
  assert.deepEqual(planBreakBeats(5 * 60).map((b) => b.id), ['leave', 'water', 'return'], 'a short break is unchanged');
});

test('the golden beat is a HASH, not dice: same day + same session index ⇒ same answer, everywhere', () => {
  const a = rollGoldenBeat({ dayKey: '2026-09-08', sessionsDoneToday: 2 });
  const b = rollGoldenBeat({ dayKey: '2026-09-08', sessionsDoneToday: 2 });
  assert.equal(a, b, 'the running screen and the reward engine must agree without talking');
  assert.equal(rollGoldenBeat({ dayKey: '', sessionsDoneToday: 0 }), null);
  // It only ever lands on a middle beat, and it is rare but real.
  let hits = 0;
  for (let i = 0; i < 400; i += 1) {
    const hit = rollGoldenBeat({ dayKey: `2026-09-${(i % 28) + 1}`, sessionsDoneToday: Math.floor(i / 28) });
    if (hit) { hits += 1; assert.ok(hit === 'halfway' || hit === 'final', `golden landed on "${hit}"`); }
  }
  assert.ok(hits > 400 * GOLDEN_BEAT_CHANCE * 0.4 && hits < 400 * GOLDEN_BEAT_CHANCE * 1.9,
    `${hits}/400 golden beats — the hash is not spreading like its declared chance`);
  // Forcing the chance to 1 proves the branch exists at all (a 0-chance test can pass on a bug).
  assert.ok(rollGoldenBeat({ dayKey: 'x', sessionsDoneToday: 0, chance: 1 }));
  assert.equal(rollGoldenBeat({ dayKey: 'x', sessionsDoneToday: 0, chance: 0 }), null);
});
