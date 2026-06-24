import test from 'node:test';
import assert from 'node:assert/strict';

import { toGeminiBody, extractGeminiText, shouldFallback } from './coach.js';

test('toGeminiBody: map role assistant→model, system tách riêng, generationConfig mặc định', () => {
  const b = toGeminiBody('Bạn là Coach.', [
    { role: 'user', content: 'giờ vàng?' },
    { role: 'assistant', content: 'buổi sáng.' },
    { role: 'user', content: 'còn khuya?' },
  ]);
  assert.deepEqual(b.system_instruction, { parts: [{ text: 'Bạn là Coach.' }] });
  assert.equal(b.contents.length, 3);
  assert.equal(b.contents[0].role, 'user');
  assert.equal(b.contents[1].role, 'model'); // assistant → model
  assert.equal(b.contents[1].parts[0].text, 'buổi sáng.');
  assert.equal(b.generationConfig.temperature, 0.3);
  assert.equal(b.generationConfig.maxOutputTokens, 800);
});

test('toGeminiBody: bỏ message rỗng; không system → không có system_instruction; opts override', () => {
  const b = toGeminiBody('', [{ role: 'user', content: 'a' }, { role: 'user', content: '  ' }], { temperature: 0.2, maxTokens: 500 });
  assert.equal(b.contents.length, 1);
  assert.ok(!('system_instruction' in b));
  assert.equal(b.generationConfig.temperature, 0.2);
  assert.equal(b.generationConfig.maxOutputTokens, 500);
  assert.ok(!('thinkingConfig' in b.generationConfig)); // không truyền thinkingBudget → không có
});

test('toGeminiBody: thinkingBudget 0 → tắt thinking (tránh cụt câu ở 2.5-flash)', () => {
  const b = toGeminiBody('s', [{ role: 'user', content: 'a' }], { thinkingBudget: 0 });
  assert.deepEqual(b.generationConfig.thinkingConfig, { thinkingBudget: 0 });
});

test('shouldFallback: 503/500/429 → nhảy model dự phòng; 200/400 → không', () => {
  assert.equal(shouldFallback(503), true);
  assert.equal(shouldFallback(500), true);
  assert.equal(shouldFallback(429), true);
  assert.equal(shouldFallback(200), false);
  assert.equal(shouldFallback(400), false);
});

test('extractGeminiText: ghép parts; thiếu/bị chặn → ""', () => {
  assert.equal(extractGeminiText({ candidates: [{ content: { parts: [{ text: 'Xin ' }, { text: 'chào.' }] } }] }), 'Xin chào.');
  assert.equal(extractGeminiText({ promptFeedback: { blockReason: 'SAFETY' } }), '');
  assert.equal(extractGeminiText(null), '');
  assert.equal(extractGeminiText({ candidates: [] }), '');
});
