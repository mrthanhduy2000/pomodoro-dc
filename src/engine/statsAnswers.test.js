import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStatsAnswers, buildWeekComparison, buildBestWindow, buildNextAction, formatMinutesVi, WEEKDAY_SHORT,
} from './statsAnswers.js';
import { buildFocusProfile } from './coach/coachIntel.js';
import { WEEK_TREND_THRESHOLD_PCT } from './gameMath.js';
import { vietnamHistoryTimeOpts } from './time.js';

// Thứ Tư 2026-09-09, 10:00 giờ Việt Nam. Thứ Hai đầu tuần = 2026-09-07 00:00 (+07).
const NOW = new Date('2026-09-09T10:00:00+07:00');
const at = (iso, minutes, extra = {}) => ({
  id: iso, timestamp: new Date(iso).getTime(), minutes, completed: true, ...extra,
});
const CATS = [{ id: 'hoc', label: 'Học' }, { id: 'viec', label: 'Làm việc' }];

const TUAN_NAY = [
  at('2026-09-07T09:00:00+07:00', 30),
  at('2026-09-08T14:00:00+07:00', 45),
  at('2026-09-09T08:00:00+07:00', 25),
];
const TUAN_TRUOC = [
  at('2026-08-31T09:00:00+07:00', 60),
  at('2026-09-01T10:00:00+07:00', 60),
  at('2026-09-02T09:00:00+07:00', 44),
  at('2026-09-02T15:00:00+07:00', 50), // SAU 10:00 thứ Tư tuần trước ⇒ phải bị loại
  at('2026-09-03T09:00:00+07:00', 90), // thứ Năm tuần trước ⇒ phải bị loại
];

test('so tuần: chỉ đếm tuần trước TỚI CÙNG LÚC NÀY, không đếm trọn tuần trước', () => {
  const w = buildWeekComparison([...TUAN_NAY, ...TUAN_TRUOC], { now: NOW });
  assert.equal(w.status, 'ready');
  assert.deepEqual([w.thisMinutes, w.thisN, w.prevMinutes, w.prevN], [100, 3, 164, 3]);
  assert.equal(w.pct, -39);
  assert.equal(w.direction, 'down');
  assert.match(w.headline, /ít hơn tuần trước 39%/);
  assert.match(w.detail, /1 giờ 40 phút qua 3 phiên, so với 2 giờ 44 phút qua 3 phiên/);
  // 7 cặp cột theo thứ Hai → Chủ nhật; ba ngày đã qua, bốn ngày còn lại trống cả hai vế
  assert.deepEqual(w.days.map((d) => d.label), WEEKDAY_SHORT);
  assert.deepEqual(w.days.slice(0, 3).map((d) => [d.thisMinutes, d.prevMinutes]), [[30, 60], [45, 60], [25, 44]]);
  assert.deepEqual(w.days.slice(3).map((d) => [d.thisMinutes, d.prevMinutes, d.elapsed]), [[0, 0, false], [0, 0, false], [0, 0, false], [0, 0, false]]);
  assert.equal(w.elapsedDays, 3);
});

test('so tuần: phiên huỷ không được đếm, và ngưỡng "giữ nhịp" là CÙNG hằng số với Coach', () => {
  const huy = at('2026-09-08T16:00:00+07:00', 50, { cancelled: true, completed: false });
  const w = buildWeekComparison([...TUAN_NAY, huy, ...TUAN_TRUOC], { now: NOW });
  assert.equal(w.thisMinutes, 100, 'phiên huỷ lọt vào tổng tuần này');
  // 164 phút tuần trước; tuần này 150 ⇒ −9% < ngưỡng ⇒ giữ nhịp
  const gan = [at('2026-09-07T09:00:00+07:00', 150)];
  const w2 = buildWeekComparison([...gan, ...TUAN_TRUOC], { now: NOW });
  assert.equal(w2.direction, 'flat');
  assert.match(w2.headline, /giữ nhịp/);
  assert.ok(Math.abs(w2.pct) < WEEK_TREND_THRESHOLD_PCT);
});

test('so tuần: ba trạng thái biên đều có câu riêng, không có câu nào in "NaN" hay "−100%"', () => {
  const trong = buildWeekComparison([], { now: NOW });
  assert.equal(trong.status, 'empty');
  const chuaCoMoc = buildWeekComparison(TUAN_NAY, { now: NOW });
  assert.equal(chuaCoMoc.status, 'no-baseline');
  assert.match(chuaCoMoc.headline, /3 phiên, 1 giờ 40 phút/);
  const tuanNayTrong = buildWeekComparison(TUAN_TRUOC, { now: NOW });
  assert.equal(tuanNayTrong.direction, 'down');
  assert.match(tuanNayTrong.detail, /3 phiên, 2 giờ 44 phút/);
  for (const w of [trong, chuaCoMoc, tuanNayTrong]) {
    assert.ok(!/NaN|undefined|-100%/.test(w.headline + w.detail), w.headline + w.detail);
  }
});

// 8 phiên sáng 30′ (đạt 6/8) + 5 phiên tối 50′ (đạt 2/5) — đủ mẫu cho cả ba dòng "mạnh nhất".
const HO_SO = [
  ...Array.from({ length: 8 }, (_, i) => at(`2026-08-${String(20 + i).padStart(2, '0')}T09:00:00+07:00`, 30, { goalAchieved: i < 6, categoryId: 'hoc', categorySnapshot: { label: 'Học' } })),
  ...Array.from({ length: 5 }, (_, i) => at(`2026-08-${String(20 + i).padStart(2, '0')}T19:00:00+07:00`, 50, { goalAchieved: i < 2, categoryId: 'viec', categorySnapshot: { label: 'Làm việc' } })),
];
const optsOf = (history) => ({
  ...vietnamHistoryTimeOpts(NOW),
  activeCategoryIds: new Set(CATS.map((c) => c.id)),
  categoryLabelOf: (id) => CATS.find((c) => c.id === id)?.label ?? null,
  history,
});

test('mạnh nhất: mỗi dòng sẵn sàng đều mang GIÁ TRỊ + tỉ lệ + CỠ MẪU; thiếu mẫu thì nói cần gì', () => {
  const profile = buildFocusProfile(HO_SO, optsOf(HO_SO));
  const best = buildBestWindow(profile);
  assert.deepEqual(best.map((b) => b.id), ['hour', 'length', 'category']);
  const [gio, doDai, loai] = best;
  assert.equal(gio.value, 'Buổi sáng');
  assert.match(gio.note, /75%/);
  assert.equal(gio.sample, '8 phiên có mục tiêu');
  assert.match(doDai.value, /^Phiên vừa/);
  assert.equal(doDai.sample, '8 phiên có mục tiêu');
  assert.equal(loai.value, '"Học"');
  assert.equal(loai.categoryId, 'hoc');
  assert.equal(loai.sample, '8 phiên có mục tiêu');
  for (const b of best) {
    assert.equal(b.ready, true);
    assert.match(b.sample, /\d+ phiên/, 'con số không có mẫu số thì không phải mục tiêu');
  }
  const thieu = buildBestWindow(buildFocusProfile(TUAN_NAY, optsOf(TUAN_NAY)));
  for (const b of thieu) {
    assert.equal(b.ready, false);
    assert.match(b.note, /Cần/);
  }
});

test('làm gì tiếp: đủ dữ liệu ⇒ một nút "Bắt đầu N phút · loại"; thiếu ⇒ vẫn là một nút chạy được', () => {
  const profile = buildFocusProfile(HO_SO, optsOf(HO_SO));
  const next = buildNextAction(profile, HO_SO, optsOf(HO_SO));
  assert.equal(next.status, 'ok');
  assert.equal(next.minutes, 30);
  assert.equal(next.categoryId, 'hoc');
  assert.equal(next.cta, 'Bắt đầu 30 phút · Học');
  assert.equal(next.isNow, true, '10:00 là buổi sáng — khung đang có mẫu tốt nhất');
  assert.match(next.sample, /8 phiên cùng khung giờ/);
  assert.match(next.reason, /Dựa trên 8 phiên/, 'lý do phải tự mang mẫu số');

  const it = buildNextAction(buildFocusProfile(TUAN_NAY, optsOf(TUAN_NAY)), TUAN_NAY, { ...optsOf(TUAN_NAY), fallbackMinutes: 40 });
  assert.equal(it.status, 'insufficient');
  assert.equal(it.cta, 'Bắt đầu 40 phút');
  assert.match(it.headline, /thêm 2 phiên/);
  assert.match(it.reason, /\(3 phiên đã ghi\)/, 'lý do khi thiếu dữ liệu cũng phải mang mẫu số');
  assert.equal(buildNextAction(null, [], { fallbackMinutes: 999 }).minutes, 180, 'phút phải bị kẹp trong 1..180');
});

test('buildStatsAnswers: điểm vào duy nhất trả đủ ba câu + tổng, và không cần gì ngoài lịch sử + danh mục', () => {
  const a = buildStatsAnswers([...HO_SO, ...TUAN_NAY, ...TUAN_TRUOC], { now: NOW, categories: CATS });
  assert.equal(a.ready, true);
  assert.equal(a.totals.completed, 21);
  assert.equal(a.week.status, 'ready');
  assert.equal(a.best.length, 3);
  assert.equal(a.next.status, 'ok');
  const rong = buildStatsAnswers([], { now: NOW });
  assert.equal(rong.ready, false);
  assert.equal(rong.week.status, 'empty');
  assert.equal(rong.next.cta, 'Bắt đầu 25 phút');
});

test('formatMinutesVi viết chữ đầy đủ, cùng đơn vị mà lưới chống-bịa của Coach nhận ra', () => {
  assert.equal(formatMinutesVi(45), '45 phút');
  assert.equal(formatMinutesVi(60), '1 giờ');
  assert.equal(formatMinutesVi(135), '2 giờ 15 phút');
  assert.equal(formatMinutesVi(-3), '0 phút');
});
