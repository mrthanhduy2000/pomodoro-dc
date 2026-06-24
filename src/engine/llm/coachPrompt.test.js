import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLLMPrompt, buildLLMChatPrompt, sanitizeLLMOutput, hasForeignScript, detectWebLLMCapable, mapInitProgress } from './coachPrompt.js';

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

test('buildLLMChatPrompt: system hội thoại + câu hỏi cuối + lọc history', () => {
  const history = [
    { role: 'user', content: 'cũ' }, { role: 'assistant', content: 'đáp' },
    { role: 'system', content: 'bỏ' },
  ];
  const { system, messages } = buildLLMChatPrompt('Tổng quan: 20 phiên.', 'Giờ vàng của mình?', history);
  assert.match(system, /=== DỮ LIỆU THẬT ===/);
  assert.match(system, /trợ lý PHÂN TÍCH SỐ LIỆU/); // dùng COACH_CHAT_SYSTEM, không phải khuôn 3 phần
  assert.equal(messages.at(-1).content, 'Giờ vàng của mình?');
  assert.ok(messages.every((m) => m.role === 'user' || m.role === 'assistant'));
});

test('sanitizeLLMOutput: bỏ <think>, bỏ rỗng, cắt dài', () => {
  assert.equal(sanitizeLLMOutput('<think>nghĩ thầm</think> Xin chào.'), 'Xin chào.');
  assert.match(sanitizeLLMOutput(''), /chưa kịp trả lời/);
  assert.ok(sanitizeLLMOutput('a'.repeat(3000)).length <= 2200);
});

test('hasForeignScript: bắt chữ Hán/Trung/Hàn/Nhật, KHÔNG bắt nhầm tiếng Việt có dấu', () => {
  assert.equal(hasForeignScript('~0.5小时/1.5小时，约1小时'), true); // ca lỗi thật của Qwen
  assert.equal(hasForeignScript('分钟'), true);
  assert.equal(hasForeignScript('한국어'), true);
  assert.equal(hasForeignScript('Buổi sáng đạt mục tiêu 86% trên 9 phiên — đường nguyễn ữỡẫ.'), false);
  assert.equal(hasForeignScript('Còn 5 ngày → mốc 7. Tỉ lệ ~62%.'), false);
  assert.equal(hasForeignScript(''), false);
  assert.equal(hasForeignScript(null), false);
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
