import test from 'node:test';
import assert from 'node:assert/strict';

import { toGeminiBody, extractGeminiText, shouldFallback, buildModelChain } from './coach.js';

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
  assert.equal(b.generationConfig.temperature, 0.2); // nhiệt độ THẤP cho tác vụ chép-lại-số
  assert.equal(b.generationConfig.topP, 0.8);
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

test('buildModelChain: deep thử pro TRƯỚC rồi rơi về flash; mặc định = chuỗi flash', () => {
  const fast = buildModelChain(undefined, {});
  assert.deepEqual(fast, ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash']);
  const deep = buildModelChain('deep', {});
  assert.equal(deep[0], 'gemini-2.5-pro'); // pro đứng đầu
  assert.deepEqual(deep.slice(1), fast); // rồi rơi về nguyên chuỗi flash (lưới an toàn)
  // env ghi đè + bỏ trùng (nếu DEEP trùng model flash thì không lặp)
  assert.deepEqual(buildModelChain('deep', { GEMINI_MODEL_DEEP: 'gemini-2.5-flash' }), fast);
  assert.deepEqual(buildModelChain('deep', { GEMINI_MODEL: 'x', GEMINI_MODEL_DEEP: 'y', GEMINI_MODEL_FALLBACK: 'z', GEMINI_MODEL_FALLBACK2: 'w' }), ['y', 'x', 'z', 'w']);
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
