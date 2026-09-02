/**
 * descriptionDrift.test.js — cổng chống LỆCH giữa MÔ TẢ và HÀNH VI (`TECH_DEBT #5`).
 *
 * ⚠️ VÌ SAO NÓ PHẢI LÀ MỘT CỔNG, KHÔNG PHẢI MỘT LỜI HẸN. Mục nợ #5 kê đơn *"rà soát định kỳ khi
 * có thời gian rảnh"* — mà một lời hẹn rà soát thì không bao giờ đỏ lên. Chính #3 đã chứng minh:
 * ba kỹ năng Thăng Hoa hứa hẹn rành mạch trong `constants.js` mà code **chưa bao giờ** nối dây, và
 * nó nằm im từ 2026-07-12 tới 2026-09-02 — gần hai tháng, qua nhiều phiên đọc chính file ấy.
 * Nguyên nhân gốc mà #5 tự nêu: *"không có cơ chế kiểm tra tự động nào đối chiếu văn bản
 * `description` với hành vi thật"*. Bài này là cơ chế đó.
 *
 * Nó khả thi được là nhờ vòng 24 đổi 310/360 thành tích từ `check: (s) => s.x >= N` (một hàm, đọc
 * không ra ngưỡng) sang **DỮ LIỆU** `dem`/`moc` — nên nay so được con số trong câu chữ với con số
 * trong luật.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ACHIEVEMENTS } from './constants.js';

/**
 * ⚠️ MIỄN TRỪ PHẢI TƯỜNG MINH VÀ ĐẾM ĐƯỢC (`assert.deepEqual`, không phải "bao gồm").
 * Mười một mục dưới đây có số trong mô tả là SỐ THÁNG ("phiên tập trung trong tháng 2"), không
 * phải một ngưỡng — `moc` của chúng là 1 ("có ít nhất một phiên"). Đó là một sự thật về NGỮ NGHĨA,
 * không phải một chỗ lệch; và viết ra thành danh sách thì mục thứ mười hai rơi vào đây sẽ đỏ.
 */
const SO_LA_THANG = [
  'year_feb', 'year_mar', 'year_apr', 'year_may', 'year_jun', 'year_jul',
  'year_aug', 'year_sep', 'year_oct', 'year_nov', 'year_dec',
];

/** Mọi số trong một câu, đã bỏ dấu phân cách nghìn. */
function soTrongCau(cau) {
  return new Set(
    [...String(cau).matchAll(/[0-9][0-9.,]*/g)].map((m) => Number(m[0].replace(/[.,]/g, ''))),
  );
}

// THỬ-CHO-ĐỎ: đổi `moc` của một thành tích bất kỳ mà không sửa mô tả ⇒ bài này đỏ.
test('con số trong MÔ TẢ phải khớp NGƯỠNG thật của thành tích', () => {
  const coNguong = ACHIEVEMENTS.filter((a) => Number.isFinite(a.moc) && a.description);
  assert.ok(coNguong.length >= 300, `mới thấy ${coNguong.length} mục có ngưỡng — phép đo chạy rỗng`);

  const lech = [];
  for (const a of coNguong) {
    const so = soTrongCau(a.description);
    if (so.size === 0) continue; // mô tả không nêu số nào thì không có gì để lệch

    // ⚠️ PHẢI HIỂU ĐỔI ĐƠN VỊ, nếu không cổng này báo nhầm 49 chỗ ngay lần chạy đầu: `moc` của
    // nhóm giờ tính bằng PHÚT (`moc: 60`) trong khi mô tả nói GIỜ ("1 giờ tập trung tích luỹ").
    // Con số khác nhau, ý nghĩa giống nhau — đó không phải lệch.
    const khop = so.has(a.moc)
      || so.has(a.moc / 60) || so.has(Math.round(a.moc / 60))
      || so.has(a.moc * 60) || so.has(a.moc / 1000);
    if (!khop) lech.push(a.id);
  }

  assert.deepEqual(
    lech.sort(), [...SO_LA_THANG].sort(),
    'MÔ TẢ nói một con số, LUẬT dùng một con số khác. App đang hứa với Đàm điều nó không làm — '
    + 'đúng hình dạng của `TECH_DEBT #3` (ba kỹ năng Thăng Hoa giá 16 SP mà chưa bao giờ được nối '
    + 'dây). Sửa mô tả cho khớp luật, HOẶC sửa luật cho khớp mô tả — đừng thêm vào danh sách miễn '
    + 'trừ trừ khi con số ấy thật sự KHÔNG PHẢI một ngưỡng.',
  );
});

// THỬ-CHO-ĐỎ: xoá trường `dem` của một thành tích bất kỳ ⇒ bài này đỏ.
test('mọi thành tích có `moc` đều phải có `dem` — nếu không thì ngưỡng ấy không đo cái gì', () => {
  const hong = ACHIEVEMENTS.filter((a) => Number.isFinite(a.moc) && !a.dem).map((a) => a.id);
  assert.deepEqual(hong, [], 'có ngưỡng mà không có trường để đếm ⇒ ngưỡng ấy vô nghĩa');
});
