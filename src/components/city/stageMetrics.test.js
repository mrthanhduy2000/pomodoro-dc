/**
 * stageMetrics.test.js — the city picture has ONE size, and the frame is where it is declared.
 *
 * RED WHEN a second copy of the picture's geometry comes back (an `aspectRatio` literal in
 * `CityStage.jsx`, a placeholder with its own ratio, the scene sizing itself again), or when the
 * numbers stop fitting the screens Đàm judges on (390×844 first).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripComments } from '../../utils/sourceScan.js';
import { FRAME_FIT_ASPECT } from '../../engine/city3d/orbit.js';
import {
  STAGE_ASPECT_FLOOR, STAGE_HEIGHT_RESERVE_PX, STAGE_MAX_PX, STAGE_MIN_PX,
  stageContext, stageFrameStyle, stageHeightPx,
} from './stageMetrics.js';

const STAGE = stripComments(readFileSync(new URL('./CityStage.jsx', import.meta.url), 'utf8'));

test('the aspect floor IS the engine\'s camera-fit ratio — never a local number', () => {
  assert.equal(STAGE_ASPECT_FLOOR, FRAME_FIT_ASPECT);
  assert.ok(STAGE_ASPECT_FLOOR >= 1.3, 'a floor below 1,3 crops the near corner of the city');
});

test('one frame style: aspect floor + max-height from the viewport, nothing else', () => {
  for (const key of ['compact', 'wide']) {
    const style = stageFrameStyle(key);
    assert.equal(style.aspectRatio, `${STAGE_ASPECT_FLOOR} / 1`);
    assert.match(style.maxHeight, /^min\(\d+px, calc\(100svh - \d+px\)\)$/);
    assert.equal(style.minHeight, `${STAGE_MIN_PX}px`);
    assert.equal(Object.keys(style).length, 3, 'a fourth size term is a second owner');
  }
  assert.equal(stageContext({ wide: true }), 'wide');
  assert.equal(stageContext({}), 'compact');
});

test('iPhone 390×844: the picture is the biggest block on the tab and the stat grid stays above the fold', () => {
  // The column is 350 px (px-5), the card border takes 2 ⇒ 348 px of frame.
  const h = stageHeightPx('compact', { width: 390, height: 844 }, 348);
  assert.ok(h >= 260, `picture only ${h} px tall — round 46 measured 201 px as the bug`);
  assert.ok(h <= 348 / STAGE_ASPECT_FLOOR + 0.01, 'taller than width ÷ 1,3 — the near corner is cropped');
  // Everything else on the screen (the declared reserve) plus the picture must fit the screen.
  assert.ok(h + STAGE_HEIGHT_RESERVE_PX.compact <= 844, 'picture + chrome overflow the phone');
  // And the picture out-measures each chrome block measured on 2026-09-08: era tiles 80 · stats 135.
  assert.ok(h > 135, 'the stat grid is taller than the city again');
});

test('short phone 375×667: the floor holds, the picture never becomes a stamp', () => {
  const h = stageHeightPx('compact', { width: 375, height: 667 }, 333);
  assert.equal(h, STAGE_MIN_PX);
});

test('desktop 1280×900 and 2000×900: the viewport term binds, the stat row stays on screen', () => {
  for (const width of [1280, 2000]) {
    const h = stageHeightPx('wide', { width, height: 900 }, 950);
    assert.equal(h, 900 - STAGE_HEIGHT_RESERVE_PX.wide);
    assert.ok(h >= 360 && h <= STAGE_MAX_PX.wide);
  }
});

test('CityStage.jsx applies the metric and carries NO geometry of its own', () => {
  assert.match(STAGE, /import\s*\{\s*stageFrameStyle\s*\}\s*from\s*'\.\/stageMetrics'/);
  assert.match(STAGE, /stageFrameStyle\(\{\s*wide\s*\}\)/, 'the frame style is imported but never applied');
  assert.doesNotMatch(STAGE, /aspectRatio:\s*'1\s*\/\s*0\.62'/, 'the old 1 : 0,62 ratio is back — a second owner');
  assert.doesNotMatch(STAGE, /StagePlaceholder/, 'the placeholder carried its own ratio; the frame is the placeholder now');
  // The scene must run in fill mode on every tenant — it reads the frame, it does not size itself.
  assert.match(STAGE, /<CityScene3D[\s\S]*?\n\s+fill\n[\s\S]*?\/>/, 'CityScene3D is no longer forced into `fill` — it will size itself again');
});
