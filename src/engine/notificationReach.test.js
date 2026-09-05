/**
 * notificationReach.test.js — canh "mọi thông báo đã viết ra đều có đường tới Đàm".
 *
 * `soundReach.test.js` (vòng 23) canh đúng chuyện này cho TIẾNG, và nó đã bắt được hai hàm câm.
 * Nhưng nó chỉ quét `soundEngine.js`, nên cả một lớp thứ hai — `notificationManager` — chưa từng
 * được đếm. Đo lần đầu (2026-09-02): **3 trong 4** hàm tiện lợi có 0 nơi gọi.
 *
 * ⚠️ Và điều làm khoảnh khắc HẾT GIỜ NGHỈ nguy hiểm hơn hai hàm câm kia: nó im trên CẢ BA kênh
 * cùng lúc (tiếng · thông báo trình duyệt · Web Push), nên không kênh nào lộ ra rằng hai kênh
 * kia cũng câm. Màn Cài Đặt lại hứa "khi phiên kết thúc, iPhone sẽ nhận notification" — lời hứa
 * ấy đúng cho phiên TẬP TRUNG (có `scheduleFocusCompletePush`) và sai cho giờ NGHỈ.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { stripComments } from '../utils/sourceScan.js';

const GOC = new URL('../', import.meta.url).pathname;

function moiFileNguon(thuMuc, ra = []) {
  for (const ten of readdirSync(thuMuc)) {
    const duong = join(thuMuc, ten);
    if (statSync(duong).isDirectory()) { moiFileNguon(duong, ra); continue; }
    if (!/\.(js|jsx)$/.test(ten) || /\.test\.js$/.test(ten)) continue;
    if (duong.endsWith('notifications.js')) continue;
    ra.push(duong);
  }
  return ra;
}

// ⚠️ DANH SÁCH MIỄN TRỪ PHẢI TƯỜNG MINH VÀ ĐẾM ĐƯỢC (`assert.deepEqual`, không phải "bao gồm").
// Mỗi mục ở đây là một QUYẾT ĐỊNH CÓ ĐO, không phải một chỗ quên:
const CO_Y_DE_CAM = [
  // Khoảnh khắc này ĐÃ có hai kênh: `soundEngine.playTimerFinish()` ngay tại chỗ (useTimer.js)
  // và `scheduleFocusCompletePush` (Web Push, tới cả khi đang ở app khác). Nối thêm kênh thứ ba
  // thì trên chính cái máy đã đăng ký push, Đàm nhận HAI thông báo cho một sự kiện.
  'notifyFocusComplete',
  // `DisasterModal` đã chiếm trọn màn hình kèm `playDisaster()`. Bắn thêm một thông báo hệ thống
  // cho thứ đang che kín màn hình là tiếng ồn, không phải tin.
  'notifyDisaster',
];

test('mọi thông báo trong notificationManager đều có ít nhất một nơi gọi thật', () => {
  const nguon = readFileSync(new URL('./notifications.js', import.meta.url), 'utf8');
  const tatCa = [...nguon.matchAll(/^ {2}(notify[A-Za-z]+)\(/gm)].map((m) => m[1]);
  assert.ok(tatCa.length >= 4, `mới thấy ${tatCa.length} thông báo — phép đo đang chạy rỗng`);

  const ma = moiFileNguon(GOC).map((f) => stripComments(readFileSync(f, 'utf8'))).join('\n');
  assert.ok(ma.length > 200_000, 'không quét đủ mã nguồn — phép đo đang chạy rỗng');

  const cam = tatCa.filter((ten) => !new RegExp(`\\b${ten}\\s*\\(`).test(ma));
  assert.deepEqual(
    cam.sort(), [...CO_Y_DE_CAM].sort(),
    `thông báo CÂM (viết ra mà không nơi nào gọi): ${cam.join(', ')}.\n`
    + 'Hoặc nối nó vào một khoảnh khắc, hoặc thêm vào CO_Y_DE_CAM kèm lý do ĐO ĐƯỢC.',
  );
});

// THỬ-CHO-ĐỎ: gỡ `notificationManager.notifyBreakOver()` khỏi `syncBreakSession` ⇒ bài này đỏ.
// THỬ-CHO-ĐỎ: gỡ `soundEngine.playTimerFinish()` ở cùng chỗ ⇒ bài này đỏ.
test('hết giờ nghỉ có CẢ tiếng lẫn thông báo, và cả hai nằm NGOÀI set()', () => {
  const store = stripComments(readFileSync(new URL('../store/gameStore.js', import.meta.url), 'utf8'));

  const than = store.slice(store.indexOf('syncBreakSession:'));
  assert.ok(than.length > 500, 'không tìm thấy syncBreakSession — phép đo đang chạy rỗng');

  const truocSet = than.slice(0, than.indexOf('return set('));
  assert.ok(
    truocSet.length > 0 && truocSet.length < than.length,
    'syncBreakSession không còn dạng "kiểm rồi mới set" — đọc lại trước khi nới bài test này',
  );

  assert.match(
    truocSet, /soundEngine\.playTimerFinish\(\)/,
    'hết giờ nghỉ lại im lặng — mà nghỉ giải lao theo định nghĩa là lúc KHÔNG nhìn màn hình',
  );
  assert.match(
    truocSet, /notificationManager\.notifyBreakOver\(\)/,
    'hết giờ nghỉ không có thông báo — tiếng thôi thì thua khi Đàm đang ở app khác',
  );
});

// THỬ-CHO-ĐỎ: bỏ điều kiện `quaHanMs <= BREAK_OVER_ANNOUNCE_MS` ⇒ bài này đỏ.
test('báo hết giờ nghỉ có CỬA SỔ GẦN ĐÂY, vì hàm này cũng chạy khi tab được đánh thức', () => {
  const store = stripComments(readFileSync(new URL('../store/gameStore.js', import.meta.url), 'utf8'));

  assert.match(
    store, /const BREAK_OVER_ANNOUNCE_MS = [\d_]+;/,
    'thiếu cửa sổ gần đây: gập máy giữa giờ nghỉ rồi mở lại sau hai tiếng thì app sẽ reo lên '
    + 'báo một giờ nghỉ đã kết thúc từ đời nào',
  );

  const than = store.slice(store.indexOf('syncBreakSession:'));
  const truocSet = than.slice(0, than.indexOf('return set('));
  assert.match(truocSet, /quaHanMs <= BREAK_OVER_ANNOUNCE_MS/, 'cửa sổ được khai mà không ai dùng');
  // Cận DƯỚI cũng bắt buộc: thiếu nó thì mọi tick giữa giờ nghỉ (endsAt còn ở tương lai ⇒ quaHanMs
  // âm ⇒ vẫn "<= 90 giây") đều reo, tức app kêu mỗi giây suốt cả giờ nghỉ.
  assert.match(truocSet, /quaHanMs >= 0/, 'thiếu cận dưới ⇒ app reo mỗi giây suốt giờ nghỉ');

  const gioiHan = Number(/const BREAK_OVER_ANNOUNCE_MS = ([\d_]+);/.exec(store)[1].replace(/_/g, ''));
  assert.ok(gioiHan >= 30_000, `cửa sổ ${gioiHan}ms quá hẹp — một nhịp tick trễ là mất tín hiệu`);
  assert.ok(gioiHan <= 300_000, `cửa sổ ${gioiHan}ms dài hơn cả một giờ nghỉ ngắn — hết là cửa sổ`);
});
