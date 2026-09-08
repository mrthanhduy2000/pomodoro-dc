/**
 * rewardBurst.test.js — the three tiers of the ending are three SIZES of one burst (ADR-080), and a
 * burst is a thing that happens and is gone: it never blocks and it never stays.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./RewardBurst.jsx', import.meta.url), 'utf8');
const STORY = readFileSync(new URL('../SessionRewardStory.jsx', import.meta.url), 'utf8');
const ROW = readFileSync(new URL('../focus/BrickRow.jsx', import.meta.url), 'utf8');

function readSizes() {
  const block = /const BURST_SIZES = \{([\s\S]*?)\n\};/.exec(SRC);
  assert.ok(block, 'BURST_SIZES not found');
  const sizes = {};
  for (const m of block[1].matchAll(/(\w+): \{ count: (\d+), radius: (\d+), dot: (\d+), duration: ([\d.]+), wave: (true|false), flash: (true|false) \}/g)) {
    sizes[m[1]] = { count: +m[2], radius: +m[3], dot: +m[4], duration: +m[5], wave: m[6] === 'true', flash: m[7] === 'true' };
  }
  return sizes;
}

test('three tiers, strictly bigger each step: brick < building < rare in count, reach and duration', () => {
  const s = readSizes();
  assert.deepEqual(Object.keys(s), ['brick', 'building', 'rare']);
  assert.ok(s.brick.count < s.building.count && s.building.count < s.rare.count, 'confetti count must grow with rarity');
  assert.ok(s.brick.radius < s.building.radius && s.building.radius < s.rare.radius, 'reach must grow with rarity');
  assert.ok(s.brick.duration < s.building.duration && s.building.duration < s.rare.duration, 'a rarer burst lasts longer');
  assert.ok(!s.brick.wave && s.building.wave && s.rare.wave, 'the light ring starts at the building tier');
  assert.ok(!s.brick.flash && !s.building.flash && s.rare.flash, 'only the rare tier flashes the screen');
  assert.ok(s.rare.duration <= 1.5, 'even the rare burst is over in well under two seconds — it must not become a movie');
});

test('a burst never blocks and never stays: pointer-events none, every particle rests at opacity 0, no button, no timer', () => {
  assert.match(SRC, /pointer-events-none/, 'the burst must let taps through to the card');
  assert.doesNotMatch(SRC, /<button|setTimeout|setInterval|onClick/, 'a burst has no button and no clock of its own');
  const restingOpacities = [...SRC.matchAll(/opacity: 0,?\s*\}/g)].length;
  assert.ok(restingOpacities >= 3, 'particles, wave and flash must all REST at opacity 0 (so Reduce motion shows nothing)');
  assert.match(SRC, /useCustomMotion/, 'motion goes through the sanctioned door');
  assert.doesNotMatch(SRC, /Math\.random/, 'positions are a fixed pattern per index — a screenshot must be reproducible');
});

test('the ending wires the tiers: rare cards burst full-screen, the project card bursts by brick/building/lucky, new bricks DROP', () => {
  assert.match(STORY, /const rare = Boolean\(card\) && \(/, 'the rare tier is decided once, from the card id');
  for (const id of ['level', 'era', 'rank', 'relic', 'evolve']) assert.match(STORY, new RegExp(`card\\.id === '${id}'`), `${id} must be rare`);
  assert.match(STORY, /card\.id === 'streak' && card\.justHit/, 'a streak card is rare only when a milestone was just hit');
  assert.match(STORY, /\{rare && <RewardBurst key=\{card\.id\} size="rare"/, 'the rare burst is mounted behind the card, keyed by card');
  assert.match(STORY, /const burst = built \|\| card\.lucky \? 'building' : 'brick';/, 'a lucky double brick earns the building-size burst');
  assert.match(ROW, /const dropMotion = useCustomMotion\(\{/, 'the new brick drops through useCustomMotion');
  assert.match(ROW, /delay: 0\.25 \+ index \* 0\.12/, 'two new bricks land as two thuds, not one');
});

test('ADR-081, learned from the first photographs: two legible colours, and the fan flies UPWARD away from the copy', () => {
  const palette = /const COLORS = \[([^\]]*)\]/.exec(SRC);
  assert.ok(palette, 'COLORS not found');
  const colors = palette[1].split(',').map((s) => s.trim()).filter(Boolean);
  assert.equal(colors.length, 2, `the burst uses ${colors.length} colours — a third of them was invisible on the dark canvas`);
  assert.ok(!/--accent2/.test(palette[1]), '`--accent2` reads as a smudge on the dark canvas, never as a spark');
  // The fan is an upward arc, never a full circle: a full circle drops half the confetti onto the headline.
  assert.match(SRC, /-165 \+ \(150 \* index\)/, 'particles must leave in an upward fan (−165°…−15°)');
  assert.doesNotMatch(SRC, /Math\.PI \* 2/, 'a full circle sends half the particles through the text below the glyph');
});
