import test from 'node:test';
import assert from 'node:assert/strict';

import {
  NAV_SEEN_KEY,
  pickUnseenAchievements,
  readSeenAchievements,
  writeSeenAchievements,
  isWeeklyReportUnread,
} from './navAttention.js';

/** localStorage giả — đủ dùng, và có công tắc "hỏng" để thử đúng ca Safari riêng tư. */
function fakeStorage({ broken = false } = {}) {
  const map = new Map();
  return {
    map,
    getItem(key) {
      if (broken) throw new Error('storage bị chặn');
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      if (broken) throw new Error('storage bị chặn');
      map.set(key, value);
    },
  };
}

test('LẦN ĐẦU PHẢI IM LẶNG: chưa có dấu thì không có gì là "mới"', () => {
  // ⚠️ Đây là lời hứa dễ mất nhất của cả cơ chế. Nếu `seen === null` bị đối xử như `[]` thì Đàm
  // cập nhật app xong sẽ thấy một cái chấm báo hàng chục thành tích "mới" mà anh đã xem từ lâu —
  // và một cái chấm kêu oan thì lần sau anh sẽ bỏ qua nó, kể cả khi nó kêu đúng.
  assert.deepEqual(pickUnseenAchievements(['a', 'b', 'c'], null), []);
  assert.deepEqual(pickUnseenAchievements(['a', 'b', 'c'], undefined), []);
});

test('`[]` KHÁC `null`: đã ghi dấu rỗng thì mọi thành tích đều là mới', () => {
  // Vế đối chứng của bài trên. Không có nó thì cách "sửa" rẻ nhất cho bài trên là trả về `[]` mọi
  // lúc — và cái chấm sẽ không bao giờ sáng nữa, cũng im lặng y như vậy.
  assert.deepEqual(pickUnseenAchievements(['a', 'b'], []), ['a', 'b']);
});

test('chỉ những id chưa có trong dấu mới được coi là mới', () => {
  assert.deepEqual(pickUnseenAchievements(['a', 'b', 'c'], ['a', 'c']), ['b']);
  assert.deepEqual(pickUnseenAchievements(['a', 'b'], ['a', 'b']), []);
  // Dấu chứa id đã biến mất khỏi danh sách (thành tích bị đổi tên/gỡ) không được đẻ ra thứ gì.
  assert.deepEqual(pickUnseenAchievements(['a'], ['a', 'da-go']), []);
});

test('dữ liệu rác không làm cái chấm nói bậy', () => {
  assert.deepEqual(pickUnseenAchievements(null, []), []);
  assert.deepEqual(pickUnseenAchievements(['a', '', 42, null, 'b'], ['a']), ['b']);
});

test('ghi rồi đọc lại ra đúng danh sách đã ghi', () => {
  const storage = fakeStorage();
  assert.equal(readSeenAchievements(storage), null, 'Máy chưa ghi gì mà đọc ra khác `null` là mất luôn phép phân biệt "chưa từng ghi".');

  const written = writeSeenAchievements(storage, ['x', 'y']);
  assert.deepEqual(written, ['x', 'y']);
  assert.deepEqual(readSeenAchievements(storage), ['x', 'y']);
  assert.ok(storage.map.has(NAV_SEEN_KEY));
});

test('storage hỏng hoặc dữ liệu méo thì trả `null`, không ném lỗi giữa màn hình', () => {
  // Một cái chấm trang trí không được quyền làm sập app vì Safari riêng tư chặn localStorage.
  assert.equal(readSeenAchievements(fakeStorage({ broken: true })), null);
  assert.equal(readSeenAchievements(null), null);
  assert.doesNotThrow(() => writeSeenAchievements(fakeStorage({ broken: true }), ['x']));

  const meo = fakeStorage();
  meo.map.set(NAV_SEEN_KEY, '{ không phải JSON');
  assert.equal(readSeenAchievements(meo), null);

  const saiHinh = fakeStorage();
  saiHinh.map.set(NAV_SEEN_KEY, JSON.stringify({ achievements: 'không phải mảng' }));
  assert.equal(readSeenAchievements(saiHinh), null);
});

// ─── (2) BÁO CÁO TUẦN CHƯA XEM (ADR-061) ─────────────────────────────────────

test('chấm "báo cáo tuần" sáng khi tuần này chưa mở ra xem, và TẮT ngay khi đã xem', () => {
  const weekMonday = '2026-08-24';

  assert.equal(
    isWeeklyReportUnread({ lastReadWeek: null, weekMonday, hasHistory: true }),
    true,
    'chưa từng xem báo cáo nào ⇒ phải có chấm',
  );
  assert.equal(
    isWeeklyReportUnread({ lastReadWeek: '2026-08-17', weekMonday, hasHistory: true }),
    true,
    'mới xem báo cáo TUẦN TRƯỚC ⇒ tuần này vẫn chưa xem',
  );
  assert.equal(
    isWeeklyReportUnread({ lastReadWeek: weekMonday, weekMonday, hasHistory: true }),
    false,
    'đã xem đúng tuần này ⇒ chấm phải tắt',
  );
});

/**
 * ⚠️ TÀI KHOẢN MỚI TINH PHẢI IM LẶNG — cùng luật với dấu thành tích ở trên. Không có phiên nào
 * thì `lastWeeklyReportDate` cũng là `null`, và nếu chỉ so hai khoá tuần thì Đàm mở app lần đầu
 * đã thấy một cái chấm trỏ vào một bản báo cáo RỖNG. Cái chấm ấy không sai về mặt logic, nó chỉ
 * nói dối về việc "có thứ đáng xem".
 */
test('chưa có phiên nào thì KHÔNG có chấm, dù chưa xem bao giờ', () => {
  assert.equal(
    isWeeklyReportUnread({ lastReadWeek: null, weekMonday: '2026-08-24', hasHistory: false }),
    false,
  );
});

test('thiếu khoá tuần thì im lặng chứ không sáng bừa', () => {
  assert.equal(isWeeklyReportUnread({ lastReadWeek: null, weekMonday: null, hasHistory: true }), false);
  assert.equal(isWeeklyReportUnread({ lastReadWeek: '2026-08-24', weekMonday: undefined, hasHistory: true }), false);
});
