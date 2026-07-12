import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLLMPrompt, buildLLMChatPrompt, buildNudgeContext, sanitizeLLMOutput } from './prompt.js';
import { findFabricatedNumbers } from './guard.js';

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

test('buildNudgeContext: ghép "Phiên vừa xong" + số phiên đó được guard CHẤP NHẬN', () => {
  const analyst = 'Tổng quan: 38 phiên hoàn thành, ~24 giờ tập trung.';
  const ctx = buildNudgeContext(analyst, { minutes: 45, categoryLabel: 'Học', goalAchieved: true });
  assert.match(ctx, /^Phiên vừa xong: 45 phút, loại "Học", đạt mục tiêu\./);
  assert.match(ctx, /Tổng quan: 38 phiên/);
  // "45 phút" GIỜ có trong context → câu nhắc nhắc "45 phút" KHÔNG bị coi là bịa
  assert.deepEqual(findFabricatedNumbers('Phiên 45 phút vừa xong rất gọn.', ctx), []);
  // minutes không hợp lệ → trả nguyên analyst (không thêm dòng)
  assert.equal(buildNudgeContext(analyst, { minutes: 0 }), analyst);
  // không có loại / goalAchieved null → bỏ phần đó
  assert.match(buildNudgeContext(analyst, { minutes: 30 }), /^Phiên vừa xong: 30 phút\.\n/);
});

test('sanitizeLLMOutput: bỏ <think>, bỏ rỗng, cắt dài', () => {
  assert.equal(sanitizeLLMOutput('<think>nghĩ thầm</think> Xin chào.'), 'Xin chào.');
  assert.match(sanitizeLLMOutput(''), /chưa kịp trả lời/);
  assert.ok(sanitizeLLMOutput('a'.repeat(3000)).length <= 2200);
});
