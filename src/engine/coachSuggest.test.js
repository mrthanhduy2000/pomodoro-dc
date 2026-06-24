import test from 'node:test';
import assert from 'node:assert/strict';

import { pickSuggestions, detectTopic, detectSignals, CATALOG } from './coachSuggest.js';

const Q = Object.fromEntries(CATALOG.map((c) => [c.id, c.question]));

// Bối cảnh giàu — bật gần hết tín hiệu (đúng định dạng buildAnalystContext sinh ra).
const RICH = [
  'Tổng quan: 42 phiên hoàn thành, ~31 giờ tập trung, 6 phiên bị huỷ. Đạt mục tiêu 61% (trên 28 phiên có đặt mục tiêu). Chuỗi hiện tại: 5 ngày.',
  'Hôm nay: đang chậm hơn nhịp thường — 1/3 phiên, tới giờ này bạn thường làm ~2 phiên (trên 9 ngày gần đây).',
  'Giờ vàng: Bạn hay đạt mục tiêu vào buổi sáng nhất — 72% (trên 18 phiên có mục tiêu).',
  'Độ dài hợp nhất: Phiên vừa (26–44′) thường đi cùng tỉ lệ đạt mục tiêu cao nhất của bạn — 68% (trên 19 phiên).',
  'Đều đặn: Trong 28 ngày gần đây bạn có hoạt động 16 ngày (57%).',
  'Phiên sâu: 9/42 phiên của bạn là phiên sâu (từ 45 phút) — 21%.',
  'Loại việc dành nhiều thời gian nhất là "Viết lách": 11.5 giờ qua 14 phiên, đạt mục tiêu 64% (trên 14 phiên).',
  'Loại việc "Đọc tài liệu": 6.2 giờ qua 8 phiên.',
  'Hay bỏ giữa chừng vào buổi tối: 41% (trên 12 lần bắt đầu).',
  'Tỉ lệ đạt mục tiêu của phiên làm sau 22 giờ đêm: 30% (khuya trên 6 phiên có mục tiêu), so với ban ngày 70%. Đây là tương quan, không phải kết luận.',
  'Mục tiêu ngày hơi quá sức: đạt 20% trên 15 ngày, trung vị 2 phiên/ngày (thử chỉnh về 2 phiên/ngày).',
  'Ngày năng suất nhất: Thứ Tư — 9 phiên (~21%).',
  'Loại bị bỏ bê: "Đọc sách" — 12 ngày chưa làm (từng chiếm ~18% thời gian, 5 phiên).',
  'Khung giờ vàng còn lại hôm nay: Việc khó hôm nay hợp để dành cho buổi chiều — khung này tỉ lệ đạt mục tiêu của bạn cao (66%, trên 12 phiên).',
  'Giữ chuỗi: Gần đây 6/7 Thứ Tư bạn đều có ít nhất một phiên (~86%).',
  'Ghi chú gần đây: "(định làm tiếp) viết chương 3"',
].join('\n');

test('detectSignals: bối cảnh giàu bật đủ tín hiệu chính', () => {
  const sig = detectSignals(RICH);
  const expected = ['overview', 'goalRate', 'todayPace', 'goldenHour', 'idealLength', 'consistency', 'deepWork', 'category', 'abandon', 'lateNight', 'goalCalibration', 'weekday', 'neglect', 'bestWindow', 'streak', 'notes'];
  for (const s of expected) {
    assert.ok(sig.has(s), `thiếu tín hiệu ${s}`);
  }
});

test('detectTopic: khớp cả có dấu lẫn không dấu', () => {
  assert.equal(detectTopic('Giờ vàng của mình là khi nào?'), 'goldenHour');
  assert.equal(detectTopic('gio vang cua minh la khi nao'), 'goldenHour');
  assert.equal(detectTopic('Làm khuya thế nào?'), 'lateNight');
  assert.equal(detectTopic('lam khuya the nao'), 'lateNight');
  assert.equal(detectTopic('Mình hay bỏ giữa chừng không?'), 'abandon');
  assert.equal(detectTopic(''), null);
});

test('tất định: gọi 2 lần cùng input → y hệt', () => {
  const a = pickSuggestions({ contextString: RICH, lastQuestionText: 'Giờ vàng của mình?', askedIds: ['goldenHour'] });
  const b = pickSuggestions({ contextString: RICH, lastQuestionText: 'Giờ vàng của mình?', askedIds: ['goldenHour'] });
  assert.deepEqual(a, b);
  assert.ok(a.length >= 2 && a.length <= 3);
});

test('loại câu đã hỏi (askedIds)', () => {
  const r = pickSuggestions({ contextString: RICH, askedIds: ['abandon', 'lateNight'] });
  assert.ok(!r.includes(Q.abandon), 'không được gợi lại câu abandon đã hỏi');
  assert.ok(!r.includes(Q.lateNight), 'không được gợi lại câu lateNight đã hỏi');
});

test('ưu tiên tín hiệu MẠNH (abandon/lateNight) khi chưa có chủ đề', () => {
  const r = pickSuggestions({ contextString: RICH });
  assert.ok(r.includes(Q.abandon) || r.includes(Q.lateNight), `cần có ít nhất 1 tín hiệu mạnh, được: ${JSON.stringify(r)}`);
});

test('nối tiếp chủ đề vừa hỏi: hỏi giờ vàng → gợi ý khung liên quan', () => {
  const r = pickSuggestions({ contextString: RICH, lastQuestionText: 'Giờ vàng của mình?', askedIds: ['goldenHour'] });
  // RELATED có goldenHour: bestWindow / lateNight / idealLength / nextSession → ít nhất 1 cái nổi lên
  assert.ok(r.includes(Q.bestWindow) || r.includes(Q.lateNight) || r.includes(Q.idealLength), `cần câu nối tiếp chủ đề, được: ${JSON.stringify(r)}`);
});

test('GATE: bối cảnh nghèo → KHÔNG gợi câu thiếu tín hiệu nền', () => {
  const sparse = [
    'Tổng quan: 6 phiên hoàn thành, ~3 giờ tập trung.',
    'Giờ vàng: Bạn hay đạt mục tiêu vào buổi sáng nhất — 70% (trên 6 phiên có mục tiêu).',
  ].join('\n');
  const r = pickSuggestions({ contextString: sparse });
  assert.ok(!r.includes(Q.abandon), 'không có tín hiệu abandon thì không gợi');
  assert.ok(!r.includes(Q.lateNight), 'không có tín hiệu lateNight thì không gợi');
  assert.ok(!r.includes(Q.neglect), 'không có tín hiệu neglect thì không gợi');
  assert.ok(r.length >= 1, 'vẫn có gợi ý cơ bản (overview/giờ vàng)');
});

test('chưa có dữ liệu → không gợi ý gì (mảng rỗng)', () => {
  assert.deepEqual(pickSuggestions({ contextString: '' }), []);
  assert.deepEqual(pickSuggestions({ contextString: 'Người dùng chưa có phiên nào hoàn thành. Chưa đủ dữ liệu để phân tích.' }), []);
});
