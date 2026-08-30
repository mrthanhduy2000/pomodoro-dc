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

test('vòng đồng hồ có TRẦN theo bề ngang màn hình, không phải cỡ cố định', () => {
  // ⚠️ Phải là `min(...)`: một hằng số nhỏ hơn thì thu đồng hồ ở MỌI khổ màn hình, kể cả nơi không
  // hề thiếu chỗ — trả giá ở chỗ không có vấn đề. Trần chỉ cắn khi bề ngang < 466px.
  const i = SRC.indexOf('timerCanvasSize}px, 64vw)');
  assert.ok(i > 0, 'vòng đồng hồ không còn trần theo bề ngang ⇒ nút Bắt đầu sẽ chui lại xuống dưới thanh tab');
});

// ⚠️ Vế dễ quên nhất, và quên thì KHÔNG được một điểm ảnh nào: `minHeight` của khối cha là chỗ
// GIỮ SẴN chiều cao. Thu mỗi cái vòng mà để nguyên nó thì khoảng trống vẫn bị giữ y như cũ.
// THỬ-CHO-ĐỎ: đổi `minHeight` về `timerFootprintHeight` trần ⇒ đỏ.
test('chỗ giữ sẵn chiều cao dùng CÙNG trần với vòng đồng hồ', () => {
  assert.match(SRC, /minHeight: `min\(\$\{timerFootprintHeight\}px, 64vw\)`/);
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
