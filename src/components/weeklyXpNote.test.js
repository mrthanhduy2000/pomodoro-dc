/**
 * weeklyXpNote.test.js — canh dòng chú thích XP tuần.
 * Bản cũ in "Không có jackpot." — một câu báo cáo sự vắng mặt của thứ Đàm KHÔNG THỂ có
 * (jackpot đòi kỹ năng "Đại Trúng Thưởng" mà anh chưa mở).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { weeklyXpNote, WEEKLY_XP_FLAT_PCT } from './weeklyXpNote.js';
import { stripComments } from '../utils/sourceScan.js';

// THỬ-CHO-ĐỎ: bỏ nhánh `Math.abs(pct) < WEEKLY_XP_FLAT_PCT` ⇒ bài 1 đỏ ở ca 1020 vs 1000.
test('chỉ gọi là lên/xuống khi chênh lệch đủ để có nghĩa', () => {
  assert.equal(weeklyXpNote(1020, 1000), 'Đều với tuần trước.');
  assert.equal(weeklyXpNote(960, 1000), 'Đều với tuần trước.');
  assert.equal(weeklyXpNote(1200, 1000), 'Hơn tuần trước 20%');
  assert.equal(weeklyXpNote(700, 1000), 'Kém tuần trước 30%');
  // Ghim ĐÚNG HAI BÊN mốc: 4% còn là "đều", 5% đã là "hơn". Ghim một bên thôi thì nới mốc
  // theo hướng nào cũng có một bài vẫn xanh.
  assert.equal(WEEKLY_XP_FLAT_PCT, 5);
  assert.equal(weeklyXpNote(1040, 1000), 'Đều với tuần trước.');
  assert.equal(weeklyXpNote(1050, 1000), 'Hơn tuần trước 5%');
});

// THỬ-CHO-ĐỎ: đổi nhánh `truoc <= 0` thành `truoc < 0` ⇒ bài 2 đỏ (chia cho 0 ra Infinity%).
test('không bịa ra một mốc khi chưa có tuần trước', () => {
  assert.equal(weeklyXpNote(500, 0), 'Tuần đầu tiên có số để so.');
  assert.equal(weeklyXpNote(0, 900), 'Chưa có XP tuần này.');
  assert.equal(weeklyXpNote(0, 0), 'Chưa có XP tuần này.');
  // đầu vào rác không được làm vỡ bản tổng kết
  for (const rac of [undefined, null, NaN, 'x']) {
    assert.equal(weeklyXpNote(rac, 1000), 'Chưa có XP tuần này.');
    assert.ok(typeof weeklyXpNote(1000, rac) === 'string');
    assert.ok(!/NaN|Infinity/.test(weeklyXpNote(1000, rac)));
  }
});

// THỬ-CHO-ĐỎ: nối lại chuỗi 'Không có jackpot.' vào WeeklyReportModal ⇒ bài 3 đỏ.
test('bản tổng kết không còn báo cáo sự vắng mặt của jackpot', async () => {
  const { readFileSync } = await import('node:fs');
  const ma = readFileSync('src/components/WeeklyReportModal.jsx', 'utf8');
  // ⚠️ Phải bỏ nguyên KHỐI chú thích: chính bản vá này KỂ LẠI câu cũ ("Không có jackpot.")
  // trong một khối nhiều dòng để phiên sau hiểu vì sao — lọc theo đầu dòng thì bắt oan nó.
  const loiGoi = stripComments(ma);
  assert.ok(
    !/Không có jackpot/.test(loiGoi),
    'ô "XP kiếm được" lại đang báo cáo một việc không thể xảy ra với Đàm',
  );
  assert.ok(/weeklyXpNote\s*\(/.test(loiGoi), 'không còn chỗ nào gọi weeklyXpNote — phép đo chạy rỗng');
});
