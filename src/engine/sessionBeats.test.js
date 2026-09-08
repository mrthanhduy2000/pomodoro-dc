/**
 * sessionBeats.test.js — the beats are a function of elapsed time, carry no digit, and vanish.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BEAT_WINDOW_SECONDS, planBreakBeats, planSessionBeats, resolveBeat, sessionPhaseGlyph,
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
