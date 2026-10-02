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

test('v2 payloads are tagged for the v2 app and open /v2/', async () => {
  const { buildV2FocusCompletePayload, buildV2BreakOverPayload } = await import('./pushPayloads.js');
  for (const p of [buildV2FocusCompletePayload(25), buildV2BreakOverPayload(5)]) {
    assert.equal(p.app, 'v2');
    assert.equal(p.url, '/v2/');
  }
  assert.match(buildV2BreakOverPayload(5).body, /5 phút/);
});
