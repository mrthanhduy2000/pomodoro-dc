import test from 'node:test';
import assert from 'node:assert/strict';

import { SKILL_TREE, SP_PER_LEVEL } from './constants.js';

/**
 * GIÁ SP CỦA CÂY KỸ NĂNG LÀ **MỘT LUẬT**, KHÔNG PHẢI 36 CON SỐ RỜI.
 *
 * ⚠️ VÌ SAO BÀI NÀY TỒN TẠI (2026-08-30). Cây kỹ năng là hệ thống TỐN NHIỀU NHẤT và TRẢ VỀ ÍT
 * NHẤT của cả game, đo trên 180 ngày thật (3,91 phiên/ngày · 173,6 XP/ngày):
 *   · Đàm mở được **2/36 kỹ năng** sau 6 tháng; 5 trong 6 nhánh vẫn 0/6.
 *   · Ở giá cũ (3/7/14/22, tổng 336 SP) trên nguồn ~2 SP mỗi 34,6 ngày ⇒ **15,9 NĂM** để mở hết.
 *   · Mà nó YẾU: hai kỹ năng ấy mua được +5,1% XP, trong khi ĐỘ DÀI PHIÊN mua được +36% chỉ từ
 *     MỘT phút (25'→26') và +103% khi 45'→60'. Cả cây chiếm ~1% tổng XP.
 * ⇒ Giá hạ còn 2/3/5/8 (tổng 138). Bài này khoá để nó không lặng lẽ trôi ngược lại, và quan
 * trọng hơn: để không ai chỉnh MỘT nút lẻ rồi bảng giá thành 36 quyết định rời rạc.
 */

const GIA_THEO_HANG = { basic: 2, intermediate: 3, advanced: 5, elite: 8 };
const TONG_TOI_DA = 150;

test('mọi kỹ năng phải đúng giá của HẠNG nó khai', () => {
  const sai = [];
  for (const [key, branch] of Object.entries(SKILL_TREE)) {
    for (const node of branch.nodes) {
      const dung = GIA_THEO_HANG[node.tier];
      assert.ok(dung, `nhánh ${key} · ${node.id}: hạng "${node.tier}" không có trong bảng giá`);
      if (node.spCost !== dung) sai.push(`${node.id} (hạng ${node.tier}): ${node.spCost} ≠ ${dung}`);
    }
  }
  assert.deepEqual(sai, [], 'có nút lệch bảng giá — giá SP là MỘT luật, không phải 36 con số rời');
});

test('cả cây phải với tới được trong đời người', () => {
  // ⚠️ Đây là cái TRẦN cho chính cái trần. Không có nó thì cách rẻ nhất để "cân bằng lại" là nâng
  // giá vài nút, và cây lại lặng lẽ trở về một bức tường 15 năm mà không cổng nào kêu.
  const all = Object.values(SKILL_TREE).flatMap((b) => b.nodes);
  const tong = all.reduce((sum, n) => sum + n.spCost, 0);
  assert.ok(
    tong <= TONG_TOI_DA,
    `cả cây tốn ${tong} SP — ở nguồn ~80 SP/năm thì đó là ${(tong / 80).toFixed(1)} năm. `
    + `Trần là ${TONG_TOI_DA} SP (~${(TONG_TOI_DA / 80).toFixed(1)} năm).`,
  );
  // Và không được rẻ tới mức mở hết trong vài tuần — lúc ấy cây thôi là một lựa chọn.
  assert.ok(tong >= 60, `cả cây chỉ tốn ${tong} SP ⇒ mở hết quá nhanh, không còn gì để chọn`);
});

test('bậc giá phải TĂNG DẦN theo hạng — hạng cao phải là một quyết định', () => {
  const { basic, intermediate, advanced, elite } = GIA_THEO_HANG;
  assert.ok(basic < intermediate && intermediate < advanced && advanced < elite,
    'bảng giá thôi tăng dần ⇒ hạng không còn nghĩa gì');
  // Một cấp cho 2 SP, nên kỹ năng nền phải mua được bằng ĐÚNG một cấp — nếu không thì lần lên cấp
  // đầu tiên của một người mới không đổi được gì cả, và đó là lần lên cấp đáng nhớ nhất.
  assert.ok(basic <= SP_PER_LEVEL,
    `kỹ năng nền tốn ${basic} SP mà một cấp chỉ cho ${SP_PER_LEVEL} ⇒ lên cấp lần đầu vẫn tay trắng`);
});
