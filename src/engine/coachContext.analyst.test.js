import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAnalystContext } from './coachContext.js';

// Getter tĩnh để test thuần (không Date, không model). Mỗi entry mang sẵn hour/weekday/dk/dn/wk.
const opts = {
  nowHour: 9,
  getEntryHour: (e) => e.hour,
  getEntryWeekday: (e) => e.weekday,
  getEntryWeekKey: (e) => e.wk,
  nowWeekKey: 'W2', prevWeekKey: 'W1',
  getEntryDayKey: (e) => e.dk,
  todayKey: '2026-06-30', minDayKey: '2026-06-02',
  getEntryDayNumber: (e) => e.dn, nowDayNumber: 200,
  todayWeekday: 1, hasSessionToday: false,
  activeCategoryIds: new Set(['study', 'work']),
  categoryLabelOf: (id) => ({ study: 'Học', work: 'Việc' }[id] ?? null),
  dailyGoalMetric: 'sessions', dailyGoal: 5, sessionsToday: 2, minutesToday: 80,
  currentStreak: 4,
};

// Lịch sử giàu mẫu: sáng đạt cao, khuya kém → bật nhiều tín hiệu có %.
function richHistory() {
  const h = [];
  const dn = 150;
  for (let i = 0; i < 6; i += 1) h.push({ hour: 9, minutes: 40, completed: true, goalAchieved: i < 5, categoryId: 'study', categorySnapshot: { label: 'Học' }, nextNote: 'ôn thi toán', dk: `2026-06-1${i}`, dn: dn + i, weekday: (i % 6) + 1, wk: 'W2' });
  for (let i = 0; i < 5; i += 1) h.push({ hour: 23, minutes: 30, completed: true, goalAchieved: i === 0, categoryId: 'work', categorySnapshot: { label: 'Việc' }, nextNote: 'làm báo cáo', dk: `2026-06-2${i}`, dn: dn + 10 + i, weekday: i, wk: 'W2' });
  for (let i = 0; i < 4; i += 1) h.push({ hour: 9, minutes: 35, completed: true, goalAchieved: true, categoryId: 'study', categorySnapshot: { label: 'Học' }, nextNote: 'đọc sách', dk: `2026-05-2${i}`, dn: dn - 20 + i, weekday: i, wk: 'W1' });
  for (let i = 0; i < 2; i += 1) h.push({ hour: 23, minutes: 5, completed: false, cancelled: true, status: 'cancelled', dk: `2026-06-2${5 + i}`, dn: dn + 16 + i, weekday: i, wk: 'W2' });
  return h;
}

const CAUSAL = ['vì', 'nên', 'do', 'bởi', 'khiến', 'dẫn đến'];
// % phải kèm cỡ mẫu: trong CÙNG dòng có "N phiên/ngày/lần", hoặc "N/M", hoặc "so với".
const SAMPLE_RE = /(\d+\s*(phiên|ngày|lần))|(\d+\/\d+)|so với/;

test('rỗng → nói "chưa đủ dữ liệu", không bịa', () => {
  const s = buildAnalystContext([], opts);
  assert.match(s, /chưa đủ dữ liệu/i);
});

test('luôn có dòng "Tổng quan:" kèm "Chuỗi hiện tại:"', () => {
  const s = buildAnalystContext(richHistory(), opts);
  assert.match(s, /^Tổng quan: /m);
  assert.match(s, /Chuỗi hiện tại: 4 ngày/);
});

test('TRUNG THỰC: mọi dòng có % đều kèm cỡ mẫu', () => {
  const s = buildAnalystContext(richHistory(), opts);
  const pctLines = s.split('\n').filter((l) => l.includes('%'));
  assert.ok(pctLines.length >= 3, 'cần đủ vài dòng % để kiểm');
  for (const line of pctLines) {
    assert.match(line, SAMPLE_RE, `dòng có % nhưng thiếu cỡ mẫu: ${line}`);
  }
});

test('TRUNG THỰC: không câu nào dùng từ nhân-quả', () => {
  const s = buildAnalystContext(richHistory(), opts);
  const blob = ` ${s.toLowerCase().replace(/[.,;:!?()"“”\-–|/]/g, ' ').replace(/\s+/g, ' ')} `;
  for (const w of CAUSAL) {
    assert.ok(!blob.includes(` ${w} `), `phát hiện từ nhân-quả "${w}" trong context`);
  }
});

test('giọng tương quan: có cụm "tương quan/đi cùng/thường" khi đủ dữ liệu', () => {
  const s = buildAnalystContext(richHistory(), opts);
  assert.match(s, /tương quan|đi cùng|thường/);
});

test('GÁC MẪU NHỎ: ít phiên → không in tín hiệu cần đủ mẫu', () => {
  const tiny = [
    { hour: 9, minutes: 30, completed: true, goalAchieved: true, dk: '2026-06-10', dn: 150, weekday: 1, wk: 'W2' },
    { hour: 9, minutes: 30, completed: true, goalAchieved: true, dk: '2026-06-11', dn: 151, weekday: 2, wk: 'W2' },
  ];
  const s = buildAnalystContext(tiny, opts);
  assert.match(s, /^Tổng quan: /m);
  assert.doesNotMatch(s, /Giờ vàng:/);
  assert.doesNotMatch(s, /Độ dài hợp nhất:/);
  assert.doesNotMatch(s, /Phiên sâu:/);
});

test('phiên khuya (vắt nửa đêm) được nêu dạng tương quan, kèm cỡ mẫu', () => {
  const s = buildAnalystContext(richHistory(), opts);
  assert.match(s, /Phiên sau 22h: tỉ lệ đạt \d+% so với ban ngày \d+% \(khuya trên \d+ phiên/);
  assert.match(s, /Đây là tương quan, không phải kết luận/);
});

test('HÔM NAY: đạt mục tiêu → "đã đạt mục tiêu ngày"; goal=0 → không có dòng Hôm nay', () => {
  const met = buildAnalystContext(richHistory(), { ...opts, dailyGoal: 2, sessionsToday: 3 });
  assert.match(met, /Hôm nay: đã đạt mục tiêu ngày/);
  const noGoal = buildAnalystContext(richHistory(), { ...opts, dailyGoal: 0 });
  assert.doesNotMatch(noGoal, /Hôm nay:/);
});

test('tất định: gọi 2 lần cùng input → chuỗi y hệt', () => {
  assert.equal(buildAnalystContext(richHistory(), opts), buildAnalystContext(richHistory(), opts));
});

test('CHÂN DUNG: có dòng "Chân dung của bạn" tổng hợp đặc điểm ổn định, kèm cỡ mẫu', () => {
  const s = buildAnalystContext(richHistory(), opts);
  assert.match(s, /^Chân dung của bạn: /m);
  const portraitLine = s.split('\n').find((l) => l.startsWith('Chân dung của bạn:'));
  assert.match(portraitLine, SAMPLE_RE); // % trong dòng phải kèm cỡ mẫu
  assert.match(portraitLine, /không phải lời tiên đoán/);
});

test('XU HƯỚNG DÀI HẠN: hiện khi ≥3 tuần CÓ dữ liệu; bỏ tuần trống; bỏ khi <3 tuần', () => {
  const mk = (wk, m) => ({ wk, minutes: m, completed: true, goalAchieved: true, hour: 9, dk: `d-${wk}`, dn: 100, weekday: 1 });
  const h3 = [mk('W2', 100), mk('W3', 150), mk('W4', 200)]; // 3 tuần active, tăng dần; W1 trống
  const withTrend = buildAnalystContext(h3, { ...opts, weekKeysDesc: ['W4', 'W3', 'W2', 'W1'] });
  assert.match(withTrend, /Xu hướng dài hạn \(3 tuần có dữ liệu trong 4 tuần gần đây\): đang đi lên \(100′ → 150′ → 200′\)/);
  // chỉ 2 tuần active (richHistory: W1,W2) → <3 tuần CÓ dữ liệu → KHÔNG bịa dòng từ tuần trống
  assert.doesNotMatch(buildAnalystContext(richHistory(), { ...opts, weekKeysDesc: ['W2', 'W1', 'W0', 'Wx'] }), /Xu hướng dài hạn/);
  // không truyền weekKeysDesc → không có dòng
  assert.doesNotMatch(buildAnalystContext(richHistory(), opts), /Xu hướng dài hạn/);
});
