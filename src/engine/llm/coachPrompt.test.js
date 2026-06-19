import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLLMPrompt, sanitizeLLMOutput, detectWebLLMCapable, mapInitProgress } from './coachPrompt.js';

test('buildLLMPrompt: chế độ viết nhận xét (không câu hỏi)', () => {
  const { system, messages } = buildLLMPrompt('Tổng quan: 20 phiên.');
  assert.match(system, /=== DỮ LIỆU THẬT ===/);
  assert.match(system, /Tổng quan: 20 phiên\./);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].role, 'user');
});

test('buildLLMPrompt: có câu hỏi → ghép history (lọc + cắt) + câu hỏi', () => {
  const history = [
    { role: 'user', content: 'cũ 1' }, { role: 'assistant', content: 'đáp 1' },
    { role: 'system', content: 'bỏ' }, { role: 'user', content: '' },
  ];
  const { messages } = buildLLMPrompt('ctx', 'Tuần này sao?', history);
  assert.equal(messages.at(-1).content, 'Tuần này sao?');
  assert.ok(messages.every((m) => m.role === 'user' || m.role === 'assistant'));
  assert.ok(messages.length <= 7);
});

test('buildLLMPrompt: context rỗng → "(chưa có dữ liệu)"', () => {
  assert.match(buildLLMPrompt('').system, /\(chưa có dữ liệu\)/);
});

test('sanitizeLLMOutput: bỏ <think>, bỏ rỗng, cắt dài', () => {
  assert.equal(sanitizeLLMOutput('<think>nghĩ thầm</think> Xin chào.'), 'Xin chào.');
  assert.match(sanitizeLLMOutput(''), /chưa trả lời được/);
  assert.ok(sanitizeLLMOutput('a'.repeat(3000)).length <= 1500);
});

test('detectWebLLMCapable: iPhone/không GPU/màn nhỏ → false; desktop có GPU → true', () => {
  assert.equal(detectWebLLMCapable({ userAgent: 'iPhone', gpu: {} }, { innerWidth: 1280 }), false);
  assert.equal(detectWebLLMCapable({ userAgent: 'Macintosh' }, { innerWidth: 1280 }), false); // không gpu
  assert.equal(detectWebLLMCapable({ userAgent: 'Macintosh', gpu: {} }, { innerWidth: 800 }), false); // màn nhỏ
  assert.equal(detectWebLLMCapable({ userAgent: 'Macintosh', gpu: {} }, { innerWidth: 1280 }), true);
  assert.equal(detectWebLLMCapable(null, null), false);
});

test('mapInitProgress: 0/0.5/1 → 0/50/100; thiếu → 0', () => {
  assert.equal(mapInitProgress({ progress: 0 }), 0);
  assert.equal(mapInitProgress({ progress: 0.5 }), 50);
  assert.equal(mapInitProgress({ progress: 1 }), 100);
  assert.equal(mapInitProgress({}), 0);
  assert.equal(mapInitProgress(null), 0);
});
