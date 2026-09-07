import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStatsAnswers, buildWeekComparison, buildBestWindow, buildNextAction, formatMinutesVi, WEEKDAY_SHORT, WEEK_SCOPE,
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

test('so tuần (ADR-077): Monday 04:00 with both same-span windows empty ⇒ last FULL week vs the week before, never "no sessions"', () => {
  const MONDAY_EARLY = new Date('2026-09-07T04:00:00+07:00');
  const TUAN_TRUOC_NUA = [at('2026-08-25T09:00:00+07:00', 60), at('2026-08-27T09:00:00+07:00', 40)]; // 100′
  const w = buildWeekComparison([...TUAN_TRUOC, ...TUAN_TRUOC_NUA], { now: MONDAY_EARLY });
  assert.equal(w.status, 'last-week');
  assert.equal(w.scope, WEEK_SCOPE.lastWeek);
  assert.deepEqual([w.thisMinutes, w.thisN, w.prevMinutes, w.prevN], [304, 5, 100, 2]); // all of last week counts now
  assert.match(w.headline, /^Tuần trước bạn tập trung nhiều hơn tuần trước nữa 204%/);
  assert.ok(w.days.every((d) => d.elapsed), 'a full week has no "not yet" days');
  assert.equal(w.days[0].thisMinutes, 60); // Monday of last week
  // same-span still wins as soon as this week has a session
  const w2 = buildWeekComparison([at('2026-09-07T03:30:00+07:00', 20), ...TUAN_TRUOC], { now: MONDAY_EARLY });
  assert.equal(w2.scope, WEEK_SCOPE.sameSpan);
  // and with truly nothing in three weeks the honest word is "empty"
  assert.equal(buildWeekComparison([], { now: MONDAY_EARLY }).status, 'empty');
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

test('strongest: every line carries VALUE + whole-session rate + SAMPLE; a goal review lowers the rate, it does not gate it', () => {
  const profile = buildFocusProfile(HO_SO, optsOf(HO_SO));
  const best = buildBestWindow(profile);
  assert.deepEqual(best.map((b) => b.id), ['hour', 'length', 'category']);
  const [gio, doDai, loai] = best;
  assert.equal(gio.value, 'Buổi sáng');
  assert.match(gio.note, /trọn vẹn 75%/); // 6 whole of 8 started — the two "Chưa đạt" taps count against it
  assert.equal(gio.sample, '8 phiên');
  assert.match(doDai.value, /^Phiên vừa/);
  assert.equal(doDai.sample, '8 phiên');
  assert.equal(loai.value, '"Học"');
  assert.equal(loai.categoryId, 'hoc');
  assert.equal(loai.sample, '8 phiên');
  for (const b of best) {
    assert.equal(b.ready, true);
    assert.equal(b.thin, false);
    assert.match(b.sample, /\d+ phiên/, 'a number without a denominator is not a goal');
  }
});

test('strongest: with NO goal reviews the three lines still answer (ADR-077) — a cancel is the only thing that lowers the rate', () => {
  const noGoals = HO_SO.map((e) => { const rest = { ...e }; delete rest.goalAchieved; return rest; });
  const cancelledEvening = { id: 'x', timestamp: new Date('2026-08-26T19:00:00+07:00').getTime(), minutes: 10, targetMinutes: 50, completed: false, cancelled: true, cancelledAt: 1, categoryId: 'viec', categorySnapshot: { label: 'Làm việc' } };
  const best = buildBestWindow(buildFocusProfile([...noGoals, cancelledEvening], optsOf(noGoals)));
  const [gio, doDai, loai] = best;
  assert.equal(gio.ready, true);
  assert.equal(gio.value, 'Buổi sáng');
  assert.match(gio.note, /trọn vẹn 100%/);
  assert.equal(gio.sample, '8 phiên');
  assert.match(doDai.value, /^Phiên vừa/);
  assert.equal(loai.value, '"Học"');
  // evening: 5 whole of 6 started (one cancel) — its sample counts the cancelled attempt too
  const cells = [...buildFocusProfile([...noGoals, cancelledEvening], optsOf(noGoals))._cells.values()];
  const evening = cells.find((c) => c.bucketId !== 'sang' && c.band === 'sau');
  assert.equal(evening.started, 6);
  assert.equal(evening.whole, 5);
});

test('strongest: under the sample floor the line answers with the busiest bucket and its raw fraction (thin), never with a request', () => {
  const thin = buildBestWindow(buildFocusProfile(TUAN_NAY, optsOf(TUAN_NAY)));
  for (const b of thin.slice(0, 2)) {
    assert.equal(b.ready, true);
    assert.equal(b.thin, true);
    assert.match(b.note, /^\d+\/\d+ phiên trọn vẹn$/);
    assert.match(b.sample, /^\d+ phiên$/);
    assert.doesNotMatch(b.note, /Cần|chưa đủ/i);
  }
  assert.equal(thin[0].value, 'Buổi sáng'); // 2 of the 3 sessions
  assert.equal(thin[0].sample, '2 phiên');
  // no session carries a category ⇒ the line is dropped by the screen, not shown as a caption
  assert.equal(thin[2].ready, false);
  const empty = buildBestWindow(buildFocusProfile([], optsOf([])));
  for (const b of empty) assert.equal(b.ready, false);
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
