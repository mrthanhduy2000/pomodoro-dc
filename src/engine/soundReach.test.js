/**
 * soundReach.test.js — canh "mọi tiếng đã viết ra đều có đường tới tai".
 *
 * Dự án đã hai lần tìm thấy một hàm `play*` viết xong mà **0 nơi gọi**: `playMilestone` (vòng 22)
 * và `playBreakStart` (vòng 23). Không cổng nào bắt được — lint không thấy vì hàm là phương thức
 * của một lớp được export, build vẫn xanh, và triệu chứng là "app im lặng ở một khoảnh khắc",
 * thứ chỉ nhận ra khi có người để ý.
 *
 * Bài này đảo chiều: nó ĐẾM, và nó đòi danh sách hàm câm phải là một danh sách TƯỜNG MINH.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { stripComments } from '../utils/sourceScan.js';
import { REWARD_TIER_SOUND } from './rewardTiers.js';

const GOC = new URL('../', import.meta.url).pathname;

function moiFileNguon(thuMuc, ra = []) {
  for (const ten of readdirSync(thuMuc)) {
    const duong = join(thuMuc, ten);
    if (statSync(duong).isDirectory()) { moiFileNguon(duong, ra); continue; }
    if (!/\.(js|jsx)$/.test(ten) || /\.test\.js$/.test(ten)) continue;
    if (duong.endsWith('soundEngine.js')) continue;
    ra.push(duong);
  }
  return ra;
}

// ⚠️ DANH SÁCH MIỄN TRỪ PHẢI TƯỜNG MINH VÀ ĐẾM ĐƯỢC — `assert.deepEqual` chứ không phải "bao
// gồm". Một tiếng nằm đây là một QUYẾT ĐỊNH ("chưa có khoảnh khắc nào xứng"), không phải một
// chỗ quên. Thêm một tiếng vào đây thì phải viết được lý do; bỏ một tiếng ra thì bài này đỏ và
// nhắc người ta cập nhật.
const CO_Y_DE_CAM = [
  // Nhịp tích tắc mỗi giây: cụm này còn nguyên tham số cho 4 gói âm thanh và một cờ trong bộ nhớ
  // máy, nhưng chưa có nơi gọi. Bật nó là một quyết định về sự làm phiền, phải do Đàm chọn.
  'playTick',
];

test('mọi tiếng trong soundEngine đều có ít nhất một nơi gọi thật', () => {
  const nguon = readFileSync(new URL('./soundEngine.js', import.meta.url), 'utf8');
  const tatCa = [...nguon.matchAll(/^ {2}(play[A-Za-z]+)\(/gm)].map((m) => m[1]);
  assert.ok(tatCa.length >= 10, `mới thấy ${tatCa.length} tiếng — phép đo đang chạy rỗng`);

  const ma = moiFileNguon(GOC).map((f) => stripComments(readFileSync(f, 'utf8'))).join('\n');
  assert.ok(ma.length > 200_000, 'không quét đủ mã nguồn — phép đo đang chạy rỗng');

  // ⚠️ MỘT SỐ TIẾNG ĐƯỢC GỌI GIÁN TIẾP, và phép tìm bằng regex KHÔNG THỂ thấy chúng.
  // `RewardToastHost` gọi `soundEngine[soundForTier(bậc)]()` — tên hàm nằm trong BẢNG, không nằm
  // trong mã. Bỏ qua chuyện này thì bài test sẽ tố oan chính cơ chế vừa nối dây xong (nó đã tố
  // `playMilestone` thật, và tôi suýt đi "sửa" một thứ đang chạy đúng).
  // Bảng là một nơi gọi thật, nên đọc thẳng bảng thay vì nới regex.
  const goiGianTiep = new Set(Object.values(REWARD_TIER_SOUND));
  const cam = tatCa.filter((ten) => (
    !goiGianTiep.has(ten) && !new RegExp(`\\b${ten}\\s*\\(`).test(ma)
  ));
  assert.deepEqual(
    cam.sort(), [...CO_Y_DE_CAM].sort(),
    `tiếng CÂM (viết ra mà không nơi nào gọi): ${cam.join(', ')}.\n`
    + 'Hoặc nối nó vào một khoảnh khắc, hoặc thêm vào CO_Y_DE_CAM kèm lý do — đừng để nó nằm im.',
  );
});

// THỬ-CHO-ĐỎ: gỡ `soundEngine.playBreakStart()` khỏi `startBreak` ⇒ bài này đỏ.
test('vào nghỉ có tiếng, và tiếng ấy nằm ở STORE chứ không rắc ở các chỗ gọi', () => {
  const store = stripComments(readFileSync(new URL('../store/gameStore.js', import.meta.url), 'utf8'));
  assert.match(store, /playBreakStart\(\)/, 'chuyển sang nghỉ lại im lặng — đó là lần DUY NHẤT app tự chiếm màn hình');
  // Đúng MỘT chỗ: rắc vào ba nơi gọi `startBreak` thì nơi thứ tư viết sau này sẽ quên.
  assert.equal((store.match(/playBreakStart\(\)/g) ?? []).length, 1);
  // Ngoài `set(...)`: hàm cập nhật của zustand có thể chạy nhiều lần cho một lần gọi.
  assert.match(
    store, /if \(!get\(\)\.ui\.isOnBreak\) soundEngine\.playBreakStart\(\);\n\s*return set\(/,
    'tiếng vào nghỉ phải nằm NGOÀI `set(...)` và có gác `isOnBreak`, nếu không nó kêu hai lần',
  );
});

// THỬ-CHO-ĐỎ: bỏ `soundEngine.playSessionStart()` khỏi `setSoundPack` ⇒ bài này đỏ.
test('chọn gói âm thanh thì nghe được ngay — và tiếng phát SAU khi đổi gói', () => {
  const st = stripComments(readFileSync(new URL('../store/settingsStore.js', import.meta.url), 'utf8'));
  assert.match(
    st, /setPack\(pack\);[\s\S]{0,120}?playSessionStart\(\)/,
    'chọn gói âm thanh lại không nghe được gì — hoặc tiếng đang phát TRƯỚC `setPack` nên nghe '
    + 'nhầm gói CŨ, một lỗi im lặng không cổng nào bắt được',
  );
});
