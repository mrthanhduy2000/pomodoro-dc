import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./PomodoroEngine.jsx', import.meta.url), 'utf8');

// ⚠️ VÌ SAO BÀI NÀY TỒN TẠI. Đo trên khung 390px thật: nút Bắt đầu nằm ở y=779..822 trong khi
// thanh tab NỔI bắt đầu ở y=774 ⇒ **nút chính của cả app bị thanh tab che**, và Đàm phải cuộn mới
// bấm được đúng thứ anh mở app ra để bấm. Không cổng nào bắt được: lint sạch, test xanh, build
// xanh, ảnh chụp trông vẫn "đẹp" — chỉ có một nút nằm sau một thanh nổi.
// Chỗ này rất dễ trôi lại: chỉ cần một phase sau thêm một dòng vào cột giữa, hoặc nới lại một
// khoảng trắng, là nút lại chui xuống dưới.
//
// ⚠️ VÀ NÓ ĐÃ TRÔI LẠI THẬT — vòng 20 (2026-08-30) đo trên tài khoản đã chơi lâu: nút y=773…815,
// thanh tab y=774 ⇒ bị che 41px. Hai nguyên nhân cộng lại, cả hai đều KHÔNG có cổng nào canh:
//   · cụm ba dòng nhắc (`FocusCityTease` · `FocusNextAction` · `FocusMoment`) cùng nổ = 84px
//   · khối chào dài 2 HOẶC 3 dòng tuỳ biến thể copy của ngày ⇒ chênh 26px
// ⇒ trần cũ 64vw chỉ vừa đủ cho NGÀY NGẮN. Nay: ba dòng nhắc gộp còn hai (nguồn thứ năm nhập vào
// `focusMomentPick.js`) và trần vòng đồng hồ hạ 64vw → 58vw. Con số nghiệm thu ở dưới.
//
// ⚠️ CON SỐ TRONG BÀI NÀY LÀ MỘT CÁI TRẦN, KHÔNG PHẢI MỘT PHÉP LÀM TRÒN. Nó phải nhỏ hơn 64 (giá
// trị đã được chứng minh là KHÔNG đủ) và lớn hơn 0 một cách có nghĩa — hạ tiếp là bắt đầu ăn vào
// chính thứ to nhất màn hình, mà chuyện ấy phải do Đàm chọn.

test('vòng đồng hồ có TRẦN theo bề ngang màn hình, không phải cỡ cố định', () => {
  // ⚠️ Phải là `min(...)`: một hằng số nhỏ hơn thì thu đồng hồ ở MỌI khổ màn hình, kể cả nơi không
  // hề thiếu chỗ — trả giá ở chỗ không có vấn đề. Trần chỉ cắn khi bề ngang < 466px.
  const m = SRC.match(/timerCanvasSize\}px, (\d+)vw\)/);
  assert.ok(m, 'vòng đồng hồ không còn trần theo bề ngang ⇒ nút Bắt đầu sẽ chui lại xuống dưới thanh tab');
  const vw = Number(m[1]);
  assert.ok(
    vw <= 58,
    `trần vòng đồng hồ đang là ${vw}vw — 64vw đã được ĐO là không đủ cho ngày mà khối chào dài 3 dòng`,
  );
});

// ⚠️ Vế dễ quên nhất, và quên thì KHÔNG được một điểm ảnh nào: `minHeight` của khối cha là chỗ
// GIỮ SẴN chiều cao. Thu mỗi cái vòng mà để nguyên nó thì khoảng trống vẫn bị giữ y như cũ.
// THỬ-CHO-ĐỎ: đổi `minHeight` về `timerFootprintHeight` trần ⇒ đỏ.
test('chỗ giữ sẵn chiều cao dùng CÙNG trần với vòng đồng hồ', () => {
  const vong = SRC.match(/timerCanvasSize\}px, (\d+)vw\)/)?.[1];
  const cho = SRC.match(/minHeight: `min\(\$\{timerFootprintHeight\}px, (\d+)vw\)`/)?.[1];
  assert.ok(cho, 'chỗ giữ sẵn chiều cao không còn trần theo bề ngang');
  assert.equal(cho, vong, 'hai vế dùng hai trần KHÁC nhau ⇒ thu cái vòng mà chỗ trống vẫn giữ nguyên');
});

// ⚠️ SVG phải co theo khối cha (`100%`), không giữ cỡ px riêng — nếu không nó tràn ra ngoài đúng
// cái khối vừa thu lại, và trên màn hình trông y hệt như chưa sửa gì.
test('SVG co theo khối cha thay vì giữ cỡ px riêng', () => {
  const i = SRC.indexOf('viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}');
  assert.ok(i > 0, 'không tìm thấy SVG đồng hồ');
  const before = SRC.slice(Math.max(0, i - 220), i);
  assert.match(before, /width="100%"/);
  assert.match(before, /height="100%"/);
});
