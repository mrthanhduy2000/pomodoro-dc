import test from 'node:test';
import assert from 'node:assert/strict';

import { buildFocusCompletePayload, buildPomodoroContinuePayload } from './pushPayloads.js';

test('buildFocusCompletePayload: làm tròn + tối thiểu 1 phút, đúng tag/url', () => {
  const p = buildFocusCompletePayload(24.6);
  assert.equal(p.body.includes('25 phút'), true);
  assert.equal(p.tag, 'dc-pomodoro-focus-complete');
  assert.equal(p.url, '/');
  assert.equal(buildFocusCompletePayload(0).body.includes('1 phút'), true);
  assert.equal(buildFocusCompletePayload(-5).body.includes('1 phút'), true);
});

test('buildPomodoroContinuePayload: làm tròn + tối thiểu 1 phút, đúng tag', () => {
  const p = buildPomodoroContinuePayload(25);
  assert.equal(p.title, '⏱ Pomodoro đã hết');
  assert.equal(p.tag, 'dc-pomodoro-continue');
});
