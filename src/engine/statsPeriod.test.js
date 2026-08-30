import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STATS_PERIODS,
  DEFAULT_STATS_PERIOD,
  isStatsPeriod,
  getPeriodLabel,
  getPeriodUnit,
  getPeriodStartTs,
  getPreviousPeriodRange,
  filterByPeriod,
  filterByRange,
  toTimestampMs,
} from './statsPeriod';
import { getVietnamDayOfWeek, startOfVietnamDayTs } from './time';

const DAY = 86400000;

/** Một thứ Tư cố định (giữa tuần) — chọn giữa tuần vì đó là chỗ "tuần lịch" và "7 ngày gần
 *  nhất" LỆCH NHAU NHIỀU NHẤT; lấy thứ Hai thì hai cách tính trùng nhau và bài test mù. */
const WEDNESDAY = new Date('2026-08-26T10:00:00+07:00');

test('BẢNG KỲ — khoá đúng 6 kỳ, khoá duy nhất, nhãn duy nhất', () => {
  assert.equal(STATS_PERIODS.length, 6);
  const keys   = STATS_PERIODS.map((p) => p.key);
  const labels = STATS_PERIODS.map((p) => p.label);
  assert.equal(new Set(keys).size, keys.length, 'khoá kỳ bị trùng');
  assert.equal(new Set(labels).size, labels.length, 'nhãn kỳ bị trùng');
  assert.ok(isStatsPeriod(DEFAULT_STATS_PERIOD), 'mặc định phải là một kỳ hợp lệ');
  assert.equal(isStatsPeriod('khong-ton-tai'), false);
});

test('MỐC BẮT ĐẦU — hẹp hơn thì bắt đầu MUỘN hơn (today ≥ week ≥ month ≥ quarter ≥ year)', () => {
  const at = WEDNESDAY;
  const today   = getPeriodStartTs('today', at);
  const week    = getPeriodStartTs('week', at);
  const month   = getPeriodStartTs('month', at);
  const quarter = getPeriodStartTs('quarter', at);
  const year    = getPeriodStartTs('year', at);
  assert.ok(today >= week,    'hôm nay phải bắt đầu muộn hơn (hoặc bằng) tuần');
  assert.ok(week  >= month,   'tuần phải bắt đầu muộn hơn (hoặc bằng) tháng');
  assert.ok(month >= quarter, 'tháng phải bắt đầu muộn hơn (hoặc bằng) quý');
  assert.ok(quarter >= year,  'quý phải bắt đầu muộn hơn (hoặc bằng) năm');
});

test("'all' trả về null, KHÔNG phải 0 — 0 là một mốc thời gian thật (1/1/1970)", () => {
  assert.equal(getPeriodStartTs('all', WEDNESDAY), null);
  assert.equal(getPeriodStartTs('gì đó lạ', WEDNESDAY), null);
});

// ⚠️ BÀI QUAN TRỌNG NHẤT CỦA FILE — nhốt đúng cái LỖI NHÃN đã ship (xem đầu `statsPeriod.js`).
// THỬ-CHO-ĐỎ: đổi `getPeriodStartTs('week')` thành `at.getTime() - 7*DAY` ⇒ bài này đỏ.
test('"TUẦN NÀY" LÀ TUẦN LỊCH, KHÔNG PHẢI "7 NGÀY GẦN NHẤT"', () => {
  const at = WEDNESDAY;
  assert.equal(getVietnamDayOfWeek(at), 3, 'mốc thử phải là thứ Tư, nếu không bài test mất răng');

  const weekStart = getPeriodStartTs('week', at);
  const rolling7  = at.getTime() - 7 * DAY;

  // Tuần lịch bắt đầu ở thứ Hai ⇒ MUỘN hơn hẳn mốc "7 ngày gần nhất".
  assert.ok(weekStart > rolling7, 'tuần lịch phải bắt đầu muộn hơn mốc 7-ngày-gần-nhất');

  // Và nó phải rơi đúng vào một mốc NỬA ĐÊM (đầu ngày), không phải 10 giờ sáng như `at`.
  assert.equal(weekStart, startOfVietnamDayTs(new Date(weekStart)), 'phải là đầu một ngày');

  // ĐỐI CHỨNG: khoảng cách hai cách tính đúng bằng 2 ngày + 10 tiếng (T2 00:00 ↔ T4 10:00 lùi 7 ngày).
  const lechGio = (weekStart - rolling7) / 3600000;
  assert.ok(lechGio > 24, `hai cách tính phải lệch hơn một ngày, đo được ${lechGio} giờ`);
});

test('KỲ LIỀN TRƯỚC — dính sát, không chồng lấn, không hở', () => {
  for (const key of ['today', 'week', 'month', 'quarter', 'year']) {
    const cur  = getPeriodStartTs(key, WEDNESDAY);
    const prev = getPreviousPeriodRange(key, WEDNESDAY);
    assert.ok(prev, `${key}: phải có kỳ trước`);
    assert.equal(prev.endTs, cur, `${key}: kỳ trước phải kết thúc ĐÚNG lúc kỳ này bắt đầu`);
    assert.ok(prev.startTs < prev.endTs, `${key}: kỳ trước phải có độ dài dương`);
  }
  assert.equal(getPreviousPeriodRange('all', WEDNESDAY), null, "'all' thì không có kỳ trước");
});

test('KỲ LIỀN TRƯỚC CỦA TUẦN dài đúng 7 ngày', () => {
  const prev = getPreviousPeriodRange('week', WEDNESDAY);
  assert.equal((prev.endTs - prev.startTs) / DAY, 7);
});

test('LỌC — bỏ phiên trước mốc, giữ phiên trong kỳ, và mốc là biên ĐÓNG', () => {
  const at = WEDNESDAY;
  const weekStart = getPeriodStartTs('week', at);
  const history = [
    { id: 'trước', timestamp: new Date(weekStart - 1).toISOString() },
    { id: 'đúng-mốc', timestamp: new Date(weekStart).toISOString() },
    { id: 'trong-kỳ', timestamp: new Date(weekStart + DAY).toISOString() },
    { id: 'hỏng', timestamp: 'không-phải-ngày' },
  ];
  const got = filterByPeriod(history, 'week', at).map((e) => e.id);
  assert.deepEqual(got, ['đúng-mốc', 'trong-kỳ']);
});

test("LỌC 'all' trả về CHÍNH mảng vào, và chịu được history rỗng/thiếu", () => {
  const history = [{ id: 'a', timestamp: Date.now() }];
  assert.equal(filterByPeriod(history, 'all'), history, "'all' không được sao chép vô ích");
  assert.deepEqual(filterByPeriod(undefined, 'week'), []);
  assert.deepEqual(filterByPeriod(null, 'all'), []);
});

test('LỌC THEO KHOẢNG — nửa mở [start, end)', () => {
  const history = [
    { id: 'a', timestamp: 1000 },
    { id: 'b', timestamp: 2000 },
    { id: 'c', timestamp: 3000 },
  ];
  assert.deepEqual(filterByRange(history, 1000, 3000).map((e) => e.id), ['a', 'b']);
});

test('ĐỌC MỐC THỜI GIAN — nhận số, nhận chuỗi, và không nghẹn với rác', () => {
  assert.equal(toTimestampMs(1234), 1234);
  assert.equal(toTimestampMs(new Date('2026-08-26T00:00:00Z').toISOString()), Date.parse('2026-08-26T00:00:00Z'));
  assert.ok(Number.isNaN(toTimestampMs(null)));
  assert.ok(Number.isNaN(toTimestampMs('rác')));
  // gọi hai lần phải ra y hệt (đường nhớ tạm không được đổi kết quả)
  const s = '2026-01-02T03:04:05Z';
  assert.equal(toTimestampMs(s), toTimestampMs(s));
});

test('NHÃN + ĐƠN VỊ đọc được cho mọi kỳ, và rơi về "Tất Cả" khi kỳ lạ', () => {
  for (const p of STATS_PERIODS) {
    assert.equal(getPeriodLabel(p.key), p.label);
    assert.equal(getPeriodUnit(p.key), p.unit);
  }
  assert.equal(getPeriodLabel('lạ'), 'Tất Cả');
  assert.equal(getPeriodUnit('lạ'), null);
});

// ─── Chia cột biểu đồ ─────────────────────────────────────────────────────────

import { buildPeriodBuckets } from './statsPeriod';
import { startOfVietnamMonthTs } from './time';

const CO_MOC = ['today', 'week', 'month', 'quarter', 'year'];

test('CỘT — liền nhau, không chồng lấn, không hở (mọi kỳ)', () => {
  for (const key of CO_MOC) {
    const b = buildPeriodBuckets(key, WEDNESDAY);
    assert.ok(b.length > 0, `${key}: phải có cột`);
    for (let i = 0; i < b.length; i++) {
      assert.ok(b[i].endTs > b[i].startTs, `${key}: cột ${i} phải có bề rộng dương`);
      if (i > 0) {
        assert.equal(b[i].startTs, b[i - 1].endTs, `${key}: cột ${i} phải dính sát cột trước`);
      }
    }
  }
});

test('CỘT — bắt đầu ĐÚNG mốc kỳ (cột không được sớm hơn hay muộn hơn kỳ nó chia)', () => {
  for (const key of CO_MOC) {
    const b = buildPeriodBuckets(key, WEDNESDAY);
    assert.equal(b[0].startTs, getPeriodStartTs(key, WEDNESDAY), `${key}: cột đầu phải trùng mốc kỳ`);
  }
});

test('CỘT — có ĐÚNG MỘT cột "đang diễn ra"', () => {
  for (const key of CO_MOC) {
    const active = buildPeriodBuckets(key, WEDNESDAY).filter((x) => x.active);
    assert.equal(active.length, 1, `${key}: phải có đúng 1 cột active, đếm được ${active.length}`);
  }
});

// ⚠️ THỬ-CHO-ĐỎ: đổi `Math.min(cursor + 7*86400000, nextMonth)` thành `cursor + 7*86400000` ⇒ đỏ.
test('CỘT THÁNG — đoạn cuối KHÔNG được lấn sang tháng sau', () => {
  const b = buildPeriodBuckets('month', WEDNESDAY);
  const nextMonth = startOfVietnamMonthTs(WEDNESDAY, 1);
  assert.equal(b[b.length - 1].endTs, nextMonth, 'cột cuối phải kết thúc đúng ở mùng 1 tháng sau');
  for (const x of b) assert.ok(x.endTs <= nextMonth, `cột ${x.label} lấn sang tháng sau`);
});

test('CỘT — nhãn không trùng nhau trong cùng một kỳ', () => {
  for (const key of [...CO_MOC, 'all']) {
    const labels = buildPeriodBuckets(key, WEDNESDAY).map((x) => x.label);
    assert.equal(new Set(labels).size, labels.length, `${key}: nhãn cột bị trùng — ${labels.join(',')}`);
  }
});

test('CỘT TUẦN ra 7 ngày, CỘT NĂM ra 12 tháng, CỘT QUÝ ra 3 tháng', () => {
  assert.equal(buildPeriodBuckets('week', WEDNESDAY).length, 7);
  assert.equal(buildPeriodBuckets('year', WEDNESDAY).length, 12);
  assert.equal(buildPeriodBuckets('quarter', WEDNESDAY).length, 3);
  assert.equal(buildPeriodBuckets('today', WEDNESDAY).length, 12);
});

test("CỘT 'ALL' — thiếu mốc dữ liệu thì vẫn ra cột, KHÔNG trả mảng rỗng", () => {
  const b = buildPeriodBuckets('all', WEDNESDAY, null);
  assert.ok(b.length >= 1, "'all' không có dữ liệu vẫn phải ra ít nhất một cột");
});

test("CỘT 'ALL' — dữ liệu dài trên 2 năm thì gom theo NĂM, ngắn thì theo THÁNG", () => {
  const nam = buildPeriodBuckets('all', WEDNESDAY, new Date('2021-01-05T00:00:00+07:00').getTime());
  assert.ok(nam.every((x) => /^\d{4}$/.test(x.label)), `dài hơn 2 năm phải gom theo năm, nhận được ${nam.map((x) => x.label).join(',')}`);

  const thang = buildPeriodBuckets('all', WEDNESDAY, new Date('2026-05-05T00:00:00+07:00').getTime());
  assert.ok(thang.every((x) => x.label.startsWith('Th')), `dưới 2 năm phải gom theo tháng, nhận được ${thang.map((x) => x.label).join(',')}`);

  // ĐỐI CHỨNG: hai độ mịn phải THẬT SỰ khác nhau, nếu không phép chọn độ mịn là mã chết.
  assert.notEqual(nam.length, thang.length);
});
