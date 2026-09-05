import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FOCUS_BUCKETS,
  FOCUS_TIME_BLOCKS,
  getFocusBucketIndex,
  getFocusTimeBlockIndex,
  getHeatIntensity,
  summarizeFocusStats,
} from './statsFocus';
import { localDateStr } from './time';

const NOW = new Date('2026-08-26T20:00:00+07:00');
const DAY = 86400000;

function lichSu() {
  const out = [];
  let id = 0;
  const them = (daysAgo, gioVN, extra = {}) => {
    const ngay = localDateStr(new Date(NOW.getTime() - daysAgo * DAY));
    out.push({
      id: `s${id++}`,
      timestamp: `${ngay}T${String(gioVN).padStart(2, '0')}:00:00+07:00`,
      minutes: 30,
      completed: true,
      ...extra,
    });
  };
  for (let i = 0; i < 12; i++) them(i, 9, { minutes: 45 });
  for (let i = 0; i < 8; i++) them(i, 14, { minutes: 70 });
  for (let i = 0; i < 6; i++) them(i, 22, { minutes: 12 });
  for (let i = 0; i < 5; i++) them(i, 19, { completed: false, status: 'cancelled', cancelled: true, minutes: 4 });
  return out;
}

test('DẢI ĐỘ DÀI — biên đúng chỗ và không có khoảng hở', () => {
  // mốc: <15 · 15–25 · 25–45 · 45–60 · 60+
  assert.equal(getFocusBucketIndex(0), 0);
  assert.equal(getFocusBucketIndex(14), 0);
  assert.equal(getFocusBucketIndex(15), 1);
  assert.equal(getFocusBucketIndex(24), 1);
  assert.equal(getFocusBucketIndex(25), 2);
  assert.equal(getFocusBucketIndex(44), 2);
  assert.equal(getFocusBucketIndex(45), 3);
  assert.equal(getFocusBucketIndex(59), 3);
  assert.equal(getFocusBucketIndex(60), 4);
  assert.equal(getFocusBucketIndex(600), 4);
  // MỌI độ dài đều phải rơi vào đúng một dải — không hở, không ra ngoài mảng
  for (let m = 0; m <= 300; m++) {
    const i = getFocusBucketIndex(m);
    assert.ok(i >= 0 && i < FOCUS_BUCKETS.length, `${m} phút ra chỉ số ${i} — ngoài bảng`);
  }
});

test('KHUNG GIỜ — cả 24 giờ đều thuộc đúng một buổi', () => {
  for (let h = 0; h < 24; h++) {
    const i = getFocusTimeBlockIndex(h);
    assert.ok(i >= 0 && i < FOCUS_TIME_BLOCKS.length, `${h} giờ ra chỉ số ${i} — ngoài bảng`);
  }
  // và cả bốn buổi đều thật sự được dùng (không buổi nào là mã chết)
  const dung = new Set(Array.from({ length: 24 }, (_, h) => getFocusTimeBlockIndex(h)));
  assert.equal(dung.size, FOCUS_TIME_BLOCKS.length, `chỉ ${dung.size}/${FOCUS_TIME_BLOCKS.length} buổi được dùng`);
});

test('ĐỘ ĐẬM Ô NHIỆT — 5 CẤP nguyên (0…4), tăng dần, và không NaN', () => {
  // ⚠️ Trả về CẤP ĐỘ nguyên 0…4, KHÔNG phải tỉ lệ 0…1 — bài test đầu tiên của file này giả định
  // sai điều đó và đỏ; mã hoàn toàn đúng. Ghi lại vì cái tên "intensity" gợi tới một tỉ lệ.
  assert.equal(getHeatIntensity(0, 100), 0, 'không có phút nào thì cấp 0');
  assert.equal(getHeatIntensity(1, 100), 1, 'có phút thì tối thiểu là cấp 1, không được rơi về 0');
  assert.equal(getHeatIntensity(100, 100), 4, 'đầy nhất là cấp 4');
  assert.equal(getHeatIntensity(500, 100), 4, 'vượt mốc vẫn kẹp ở cấp 4');

  let truoc = -1;
  for (const m of [0, 10, 25, 50, 75, 100]) {
    const v = getHeatIntensity(m, 100);
    assert.ok(Number.isInteger(v) && v >= 0 && v <= 4, `${m} → ${v}, phải là số nguyên trong [0,4]`);
    assert.ok(v >= truoc, `không được giảm khi số phút tăng: ${m} → ${v}`);
    truoc = v;
  }
  // cả 5 cấp đều với tới được — nếu không thì thang màu có cấp chết
  const capDaDung = new Set(Array.from({ length: 101 }, (_, m) => getHeatIntensity(m, 100)));
  assert.deepEqual([...capDaDung].sort(), [0, 1, 2, 3, 4]);

  assert.equal(getHeatIntensity(50, 0), 0, 'mẫu số 0 phải trả 0, không phải NaN hay Infinity');
  assert.equal(getHeatIntensity(50, NaN), 0, 'mẫu số hỏng phải trả 0');
});

test('KHÔNG CÓ DỮ LIỆU — trả về số 0 lành lặn, không NaN', () => {
  const s = summarizeFocusStats([], 'all');
  assert.equal(s.totalSessions, 0);
  assert.equal(s.totalMinutes, 0);
  assert.equal(s.avgSessionMinutes, 0);
  for (const [k, v] of Object.entries(s)) {
    if (typeof v === 'number') assert.ok(Number.isFinite(v), `trường "${k}" ra ${v}`);
  }
});

// ⚠️ Nhóm bất biến CỘNG DỒN — đây là thứ bắt được lỗi thật, vì một phiên bị đếm nhầm chỗ
// sẽ làm ĐÚNG MỘT trong các phép cộng này lệch, trong khi mọi con số vẫn "trông hợp lý".
test('CỘNG DỒN — hoàn thành + huỷ = tổng phiên', () => {
  for (const period of ['today', 'week', 'month', 'all']) {
    const s = summarizeFocusStats(lichSu(), period);
    assert.equal(s.completedSessions + s.cancelledSessions, s.totalSessions, `kỳ ${period}`);
  }
});

test('CỘNG DỒN — tổng phiên của các DẢI ĐỘ DÀI = tổng phiên', () => {
  const s = summarizeFocusStats(lichSu(), 'all');
  const tong = s.buckets.reduce((a, b) => a + b.count, 0);
  assert.equal(tong, s.totalSessions);
});

test('CỘNG DỒN — tổng phiên của các BUỔI = tổng phiên', () => {
  const s = summarizeFocusStats(lichSu(), 'all');
  const tong = s.timeBlocks.reduce((a, b) => a + b.sessions, 0);
  assert.equal(tong, s.totalSessions);
});

test('CỘNG DỒN — tổng phiên theo GIỜ = tổng phiên, và có đúng 24 giờ', () => {
  const s = summarizeFocusStats(lichSu(), 'all');
  assert.equal(s.hourlyStats.length, 24);
  assert.equal(s.hourlyStats.reduce((a, h) => a + h.sessions, 0), s.totalSessions);
});

test('LỌC THEO KỲ — kỳ hẹp hơn không bao giờ nhiều phiên hơn kỳ rộng hơn', () => {
  const h = lichSu();
  const n = (p) => summarizeFocusStats(h, p).totalSessions;
  assert.ok(n('today') <= n('week'), 'hôm nay ≤ tuần');
  assert.ok(n('week') <= n('month'), 'tuần ≤ tháng');
  assert.ok(n('month') <= n('all'), 'tháng ≤ tất cả');
  assert.ok(n('all') > 0, 'gác chạy-rỗng: fixture phải có phiên, nếu không mọi bài trên đều vô nghĩa');
});

// ⚠️ MÀU KHÔNG ĐƯỢC QUAY LẠI ENGINE. `FOCUS_BUCKETS` từng mang `accent: '#9a8d82'` — một quyết
// định mỹ thuật lẫn trong một bảng logic, và nó chính là thứ giữ bảng này không xuống được engine.
test('BẢNG DẢI KHÔNG chứa mã màu — mỹ thuật ở tầng giao diện', () => {
  for (const b of FOCUS_BUCKETS) {
    assert.deepEqual(Object.keys(b).sort(), ['label', 'tone'], `dải "${b.label}" có trường lạ`);
    assert.ok(!JSON.stringify(b).includes('#'), `dải "${b.label}" chứa mã màu`);
  }
});
