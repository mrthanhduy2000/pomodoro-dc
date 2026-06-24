import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findFabricatedNumbers, hasFabricatedNumbers,
  buildCorrectionNote, appendCorrectionTurn,
  stripFabricatedSentences, scrubFabricatedLines,
} from './coachPrompt.js';

// Bảng số liệu THẬT (rút từ lịch sử mẫu ~24 giờ) làm nền đối chiếu.
const CTX = [
  'Tổng quan: 38 phiên hoàn thành, ~24 giờ tập trung. Đạt mục tiêu 79% (trên 38 phiên có đặt mục tiêu). Chuỗi hiện tại: 5 ngày.',
  'Loại việc dành nhiều thời gian nhất là "Học": 13.3 giờ qua 18 phiên, đạt mục tiêu 100% (trên 18 phiên).',
  'Loại việc "Làm Việc": 6.6 giờ qua 13 phiên, đạt mục tiêu 46% (trên 13 phiên).',
  'Loại việc "Đọc sách": 2.1 giờ qua 4 phiên, đạt mục tiêu 75% (trên 4 phiên).',
  'Tỉ lệ đạt mục tiêu của phiên làm sau 22 giờ đêm: 0% (khuya trên 5 phiên có mục tiêu), so với ban ngày 91%.',
  'Xu hướng dài hạn (4 tuần có dữ liệu trong 4 tuần gần đây): đang đi lên, mỗi tuần (từ cũ đến mới): 175 phút → 275 phút → 410 phút → 560 phút.',
].join('\n');

test('BẮT số bịa: con số kèm đơn vị-dữ-liệu không có trong bảng', () => {
  assert.deepEqual(findFabricatedNumbers('bạn đã làm trên 21 phiên rồi', CTX), ['21 phiên']);
  assert.equal(hasFabricatedNumbers('bạn đã làm trên 21 phiên rồi', CTX), true);
});

test('BẮT đọc nhầm nhãn thành số bịa: "2.3 giờ" (số thật là 2.1/13.3/6.6)', () => {
  assert.deepEqual(findFabricatedNumbers('loại việc 2.3 giờ', CTX), ['2.3 giờ']);
});

test('KHÔNG báo nhầm: h ↔ giờ là một (2.1h == 2.1 giờ)', () => {
  assert.deepEqual(findFabricatedNumbers('Học làm 2.1h trong 4 phiên', CTX), []);
});

test('BẮT bịa mẫu hình kèm số: khung/giờ/% không có trong bảng', () => {
  const bad = findFabricatedNumbers('khung 14 giờ đạt 88% trên 12 phiên', CTX);
  assert.deepEqual(bad.sort(), ['12 phiên', '14 giờ', '88 %'].sort());
});

test('KHÔNG báo nhầm số CÓ THẬT (chép đúng từ bảng)', () => {
  const a = 'Học chiếm 13.3 giờ qua 18 phiên, đạt mục tiêu 100% trên 18 phiên; tổng 79% trên 38 phiên; chuỗi 5 ngày';
  assert.deepEqual(findFabricatedNumbers(a, CTX), []);
});

test('MIỄN TRỪ số trần (không đơn vị-dữ-liệu)', () => {
  assert.deepEqual(findFabricatedNumbers('mình gói trong 3 nhịp và 1 lời khuyên', CTX), []);
});

test('CHUẨN HOÁ dấu phẩy/đuôi 0: 6,6 giờ == 6.60 giờ == 6.6 giờ (có trong bảng)', () => {
  assert.deepEqual(findFabricatedNumbers('Làm Việc 6,6 giờ', CTX), []);
  assert.deepEqual(findFabricatedNumbers('Làm Việc 6.60 giờ', CTX), []);
});

test('context rỗng → KHÔNG kết tội (tránh báo nhầm khi chưa có dữ liệu)', () => {
  assert.deepEqual(findFabricatedNumbers('bất kỳ 99 phiên', ''), []);
  assert.equal(hasFabricatedNumbers('bất kỳ 99 phiên', ''), false);
});

test('giờ trong ngày khớp bảng: "22 giờ" có trong dòng khuya → không báo', () => {
  assert.deepEqual(findFabricatedNumbers('sau 22 giờ bạn hay đuối', CTX), []);
});

test('chuỗi xu hướng nhiều tuần: từng mốc "phút" đều khớp bảng', () => {
  assert.deepEqual(findFabricatedNumbers('mỗi tuần: 175 phút → 275 phút → 410 phút → 560 phút', CTX), []);
});

// ── Đơn vị "tiếng" (== giờ) ─────────────────────────────────────────────
test('đơn vị "tiếng" coi như "giờ": 13.3 tiếng khớp 13.3 giờ trong bảng', () => {
  assert.deepEqual(findFabricatedNumbers('Học làm 13.3 tiếng', CTX), []);
});
test('"99 tiếng" bịa → bắt, chuẩn hoá hiển thị "99 giờ"', () => {
  assert.deepEqual(findFabricatedNumbers('bạn còn 99 tiếng nữa', CTX), ['99 giờ']);
});

// ── buildCorrectionNote ────────────────────────────────────────────────
test('buildCorrectionNote: liệt kê đích danh, "88 %" → "88%", có cụm chốt', () => {
  const note = buildCorrectionNote(['21 phiên', '88 %']);
  assert.match(note, /"21 phiên"/);
  assert.match(note, /"88%"/);
  assert.match(note, /KHÔNG có trong bảng/);
  assert.match(note, /chưa đủ dữ liệu/);
});
test('buildCorrectionNote rỗng/null → "" (gọi an toàn)', () => {
  assert.equal(buildCorrectionNote([]), '');
  assert.equal(buildCorrectionNote(null), '');
});

// ── appendCorrectionTurn ───────────────────────────────────────────────
test('appendCorrectionTurn: note rỗng → giữ nguyên; có note → +2, không mutate', () => {
  const msgs = [{ role: 'user', content: 'hỏi' }];
  assert.equal(appendCorrectionTurn(msgs, 'câu cũ', ''), msgs);
  const out = appendCorrectionTurn(msgs, 'câu cũ', 'note');
  assert.equal(out.length, msgs.length + 2);
  assert.deepEqual(out[out.length - 2], { role: 'assistant', content: 'câu cũ' });
  assert.deepEqual(out[out.length - 1], { role: 'user', content: 'note' });
  assert.equal(msgs.length, 1); // gốc không bị mutate
});

// ── stripFabricatedSentences (CỨU-CÂU cho chat) ─────────────────────────
test('stripFabricatedSentences: giữ câu sạch, bỏ câu bịa', () => {
  const a = 'Bạn có 79% trên 38 phiên. Khung 14 giờ đạt 88% trên 12 phiên.';
  const { clean, removed } = stripFabricatedSentences(a, CTX);
  assert.match(clean, /79% trên 38 phiên/);
  assert.doesNotMatch(clean, /14 giờ/);
  assert.equal(removed.length, 1);
});
test('stripFabricatedSentences: không cắt số thập phân "13.3 giờ" giữa câu', () => {
  const a = 'Học chiếm 13.3 giờ qua 18 phiên, nhiều nhất.';
  assert.deepEqual(stripFabricatedSentences(a, CTX).removed, []);
});
test('stripFabricatedSentences: toàn câu-bịa → fallback; rỗng → fallback; ctx rỗng → nguyên văn', () => {
  assert.match(stripFabricatedSentences('Bạn có 50 phiên. Trung bình 3.7 giờ mỗi ngày.', CTX).clean, /chưa đủ dữ liệu/);
  assert.match(stripFabricatedSentences('', CTX).clean, /chưa đủ dữ liệu/);
  assert.equal(stripFabricatedSentences('99 phiên bừa', '').clean, '99 phiên bừa');
});

// ── scrubFabricatedLines (CỨU-CÂU cho bản 4 phần) ───────────────────────
const FOUR = [
  '[1] QUAN SÁT CHÍNH:',
  'Bạn có 38 phiên, đạt 79% trên 38 phiên.',
  '[2] XU HƯỚNG:',
  'Tuần này hơn tuần trước, 560 phút so với 410 phút.',
  '[3] CHÂN DUNG:',
  'Khung 14 giờ đạt 88% trên 12 phiên.',
  '[4] THỬ NGHIỆM:',
  'Thử dồn việc khó buổi sáng.',
].join('\n');

test('scrubFabricatedLines: bỏ đúng dòng bịa, giữ nhãn + dòng sạch', () => {
  const { clean, removed } = scrubFabricatedLines(FOUR, CTX);
  assert.match(clean, /\[1\]/); assert.match(clean, /\[2\]/); assert.match(clean, /\[3\]/); assert.match(clean, /\[4\]/);
  assert.doesNotMatch(clean, /14 giờ/);
  assert.match(clean, /79% trên 38 phiên/);
  assert.equal(removed.length, 1);
});
test('scrubFabricatedLines: phần [n] rỗng sau lọc → chèn "chưa đủ dữ liệu" (giữ nhãn)', () => {
  const { clean } = scrubFabricatedLines(FOUR, CTX);
  // [3] mất nội dung duy nhất (14 giờ bịa) → phải có "chưa đủ dữ liệu" ngay sau nhãn [3]
  assert.match(clean, /\[3\][^\n]*\nchưa đủ dữ liệu/);
});
test('scrubFabricatedLines: ctx rỗng → nguyên văn', () => {
  assert.equal(scrubFabricatedLines(FOUR, '').clean, FOUR);
});
