import test from 'node:test';
import assert from 'node:assert/strict';

import { getGoldenHourBucket } from './gameMath.js';
import {
  lengthBandOf, wilsonLowerBound, confidenceLabel,
  buildFocusProfile, recommendNextSession,
  predictStreakKeep, predictBestWindow,
  detectPatterns, composeFocusReport, buildCoachIntel,
} from './coachIntel.js';

const getEntryHour = (e) => e.hour;
const getEntryWeekday = (e) => e.weekday;
const getEntryDayKey = (e) => e.dk;
const getEntryWeekKey = (e) => e.wk;

function s(o) {
  return { completed: true, minutes: 30, ...o };
}

// Lịch sử giàu dữ liệu: sáng đạt cao, tối kém + huỷ + muộn → nhiều mẫu để bật pattern.
function richHistory() {
  const h = [];
  for (let i = 0; i < 8; i += 1) h.push(s({ hour: 9, minutes: 40, goalAchieved: i < 6, dk: `2026-06-0${(i % 6) + 1}`, weekday: (i % 6) + 1, wk: 'W2' }));
  for (let i = 0; i < 8; i += 1) h.push(s({ hour: 23, minutes: 30, goalAchieved: i === 0, dk: `2026-06-1${i}`, weekday: i % 7, wk: 'W2' }));
  for (let i = 0; i < 3; i += 1) h.push({ hour: 23, minutes: 5, completed: false, cancelled: true, status: 'cancelled', dk: `2026-06-2${i}`, weekday: i, wk: 'W2' });
  for (let i = 0; i < 4; i += 1) h.push(s({ hour: 9, minutes: 40, goalAchieved: true, dk: `2026-05-2${i}`, weekday: i, wk: 'W1' }));
  return h;
}

const richOpts = {
  nowHour: 12, getEntryHour, getEntryWeekday, getEntryDayKey, getEntryWeekKey,
  nowWeekKey: 'W2', prevWeekKey: 'W1', todayKey: '2026-06-30',
};

test('helper: Wilson phạt mẫu nhỏ — 3/3 KHÔNG thắng 18/24', () => {
  assert.ok(wilsonLowerBound(3, 3) < wilsonLowerBound(18, 24));
  assert.equal(wilsonLowerBound(0, 0), 0);
});

test('helper: lengthBandOf đúng mốc 26/45', () => {
  assert.equal(lengthBandOf(25), 'ngan');
  assert.equal(lengthBandOf(26), 'vua');
  assert.equal(lengthBandOf(44), 'vua');
  assert.equal(lengthBandOf(45), 'sau');
  assert.equal(confidenceLabel(10), 'cao');
  assert.equal(confidenceLabel(6), 'vừa');
  assert.equal(confidenceLabel(4), 'thấp');
});

test('profile: thiếu phiên → chưa sẵn sàng', () => {
  const p = buildFocusProfile([s({ hour: 9 }), s({ hour: 9 })], { getEntryHour });
  assert.equal(p.ready, false);
  assert.equal(p.chronotype.status, 'insufficient');
});

test('profile: đủ dữ liệu → có chỉ số; chronotype KHỚP getGoldenHourBucket', () => {
  const h = richHistory();
  const p = buildFocusProfile(h, { getEntryHour, getEntryWeekKey, nowWeekKey: 'W2', prevWeekKey: 'W1', getEntryDayKey, todayKey: '2026-06-30' });
  assert.equal(p.ready, true);
  const golden = getGoldenHourBucket(h, { getEntryHour });
  assert.ok(golden);
  assert.equal(p.chronotype.value.bucketId, golden.bucketId); // không "đá nhau" với thẻ Coach
});

test('recommend: chưa sẵn sàng → insufficient; đủ → ok có số phút', () => {
  assert.equal(recommendNextSession(buildFocusProfile([], {}), {}).status, 'insufficient');
  const p = buildFocusProfile(richHistory(), { getEntryHour });
  const r = recommendNextSession(p, { nowHour: 9, getEntryHour, history: richHistory() });
  assert.equal(r.status, 'ok');
  assert.ok(r.minutes >= 5 && r.minutes <= 180);
});

test('predict streak: <4 ngày-cùng-thứ → insufficient; ≥6 → có %; đã có phiên hôm nay → secured', () => {
  const few = [s({ hour: 9, dk: 'd1', weekday: 4 }), s({ hour: 9, dk: 'd2', weekday: 4 }), s({ hour: 9, dk: 'd3', weekday: 4 })];
  const base = { todayWeekday: 4, nowHour: 15, getEntryHour, getEntryWeekday, getEntryDayKey, todayKey: 'today' };
  assert.equal(predictStreakKeep(few, base).status, 'insufficient');

  const many = [];
  for (let i = 0; i < 6; i += 1) many.push(s({ hour: 9, dk: `t${i}`, weekday: 4 }));
  const r = predictStreakKeep(many, base);
  assert.equal(r.status, 'predicted');
  assert.equal(r.sampleDays, 6);
  assert.match(r.reason, /%/);

  assert.equal(predictStreakKeep(many, { ...base, hasSessionToday: true }).status, 'secured');
});

test('predict best-window: hết buổi trong ngày → none-left; còn buổi tốt → found', () => {
  const h = [];
  for (let i = 0; i < 6; i += 1) h.push(s({ hour: 20, minutes: 40, goalAchieved: true })); // buổi tối (startHour 18)
  assert.equal(predictBestWindow(h, { nowHour: 23, getEntryHour }).status, 'none-left');
  const r = predictBestWindow(h, { nowHour: 12, getEntryHour });
  assert.equal(r.status, 'found');
  assert.equal(r.bucketId, 'toi');
});

test('predict best-window: buổi tối hỏi → đêm khuya (buổi vắt nửa đêm) vẫn được gợi ý', () => {
  const h = [];
  for (let i = 0; i < 5; i += 1) h.push(s({ hour: 23, minutes: 30, goalAchieved: i < 4 })); // đêm khuya 4/5 đạt
  // nowHour=20: chỉ còn 'khuya' (23h) phía trước — trước khi sửa bị loại nên trả 'none-left'.
  const r = predictBestWindow(h, { nowHour: 20, getEntryHour });
  assert.equal(r.status, 'found');
  assert.equal(r.bucketId, 'khuya');
  // Đã qua 23h thì đêm khuya không còn "phía trước" nữa.
  assert.equal(predictBestWindow(h, { nowHour: 23, getEntryHour }).status, 'none-left');
});

test('TRUNG THỰC: không câu chữ nào dùng từ nhân-quả (vì/nên/do/bởi/khiến/dẫn đến)', () => {
  const intel = buildCoachIntel(richHistory(), { ...richOpts, getEntryDayNumber: (e) => e.dn ?? 0, nowDayNumber: 200 });
  const strings = [];
  const pushAll = (o) => {
    if (o == null) return;
    if (typeof o === 'string') { strings.push(o); return; }
    if (Array.isArray(o)) { o.forEach(pushAll); return; }
    if (typeof o === 'object') {
      for (const [k, v] of Object.entries(o)) { if (k === 'evidence') continue; pushAll(v); }
    }
  };
  pushAll(intel.profile);
  pushAll(intel.predictions);
  pushAll(intel.report);
  const blob = ` ${strings.join('  ').toLowerCase().replace(/[.,;:!?()"“”]/g, ' ')} `;
  for (const w of ['vì', 'nên', 'do', 'bởi', 'khiến', 'dẫn đến']) {
    assert.ok(!blob.includes(` ${w} `), `Phát hiện từ nhân-quả "${w}" trong câu chữ Coach`);
  }
});

test('tất định: gọi 2 lần cùng input → báo cáo y hệt', () => {
  const a = composeFocusReport(richHistory(), richOpts);
  const b = composeFocusReport(richHistory(), richOpts);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test('patterns: trả mảng (rỗng khi thiếu dữ liệu), không lỗi', () => {
  assert.deepEqual(detectPatterns([], {}), []);
  const ps = detectPatterns(richHistory(), richOpts);
  assert.ok(Array.isArray(ps));
});
