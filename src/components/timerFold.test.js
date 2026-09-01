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

// ═══════════════════════════════════════════════════════════════════════════════
// VÒNG 23 (2026-09-01) — BA THỨ NỮA QUYẾT ĐỊNH BIÊN AN TOÀN CỦA NÚT CHÍNH
//
// Đo trên app thật ở khung 390×844 (`shot.mjs --probe`), so ĐÁY nút chính với ĐỈNH thanh điều
// hướng nổi (y=774), trên CA TIÊU ĐỀ DÀI NHẤT (63 ký tự = 3 dòng, không phải câu của hôm nay):
//        trước vòng 23:  ~6px          sau vòng 23:  45px
// Ba nguồn, và không nguồn nào là "chỉnh một khoảng cách":
//   (a) nút phụ "Toàn màn hình" chiếm 112/308px hàng nút, và vì nhãn hai chữ XUỐNG DÒNG ở cột
//       112px nên chính nó quyết định chiều cao 59px của cả hàng — nút quan trọng nhất màn hình
//       cao bằng một nhãn bị vỡ dòng của một nút phụ. Gỡ ở nhánh CHỜ ⇒ hàng còn 42px.
//   (b) dòng "Chu kỳ nghỉ ●●●● 0/4 · đặt lại" nằm y=754…779 — tức ĂN VÀO biên, và nút "đặt lại"
//       bị thanh điều hướng cắt mất 5px. Ở `cyclePos === 0` nó không mang một mẩu tin nào.
//   (c) phụ đề "Bạn còn 5 phiên nữa là đủ nhịp hôm nay." (y=288) nói lại đúng trạng thái mà
//       "Phiên 0/5 hôm nay" (y=626) đã nói, mà bản dưới đồng hồ có cả tử lẫn mẫu.
//
// Ba bài dưới đây canh CẤU TRÚC sinh ra con số ấy, vì một bài đọc mã KHÔNG đo được điểm ảnh.
// Muốn đo lại con số thật thì chạy `shot.mjs --probe` như ghi trong thông điệp commit.
// ═══════════════════════════════════════════════════════════════════════════════

// THỬ-CHO-ĐỎ: dán lại khối `{canEnterFullScreen && …}` vào nhánh IDLE ⇒ đỏ.
test('hàng nút lúc CHỜ chỉ có MỘT nút — nút chính lấy trọn bề ngang', () => {
  const i = SRC.indexOf('key="start"');
  assert.ok(i > 0, 'không tìm thấy nhánh nút lúc chờ — phép đo chạy rỗng');
  const j = SRC.indexOf('timerState === TIMER_STATES.RUNNING', i);
  assert.ok(j > i, 'không tìm thấy nhánh kế tiếp');
  const nhanhCho = SRC.slice(i, j);

  assert.ok(
    !/canEnterFullScreen/.test(nhanhCho),
    'nút "Toàn màn hình" quay lại nhánh CHỜ — nhãn của nó xuống dòng và kéo cả hàng lên 59px, '
    + 'ăn mất biên an toàn của nút chính',
  );
  assert.ok(
    !/grid-cols-\[/.test(nhanhCho),
    'hàng nút lúc chờ lại chia cột — nút chính thôi lấy trọn bề ngang',
  );
  // Hai bản CÒN LẠI phải sống: toàn màn hình sinh ra để tập trung TRONG lúc chạy.
  const soBanConLai = (SRC.match(/canEnterFullScreen &&/g) ?? []).length;
  assert.equal(soBanConLai, 2, `phải còn ĐÚNG 2 nút toàn màn hình (đang chạy + tạm dừng), thấy ${soBanConLai}`);
});

// THỬ-CHO-ĐỎ: bỏ dòng `if (cyclePos <= 0) return null;` ⇒ đỏ.
test('dòng "Chu kỳ nghỉ" im lặng khi chu kỳ chưa chạy', () => {
  assert.match(
    SRC, /if \(cyclePos <= 0\) return null;/,
    'dòng "Chu kỳ nghỉ" lại hiện ở 0/4 — bốn chấm rỗng cộng một nút "đặt lại" cho một chu kỳ '
    + 'chưa bắt đầu, và nó nằm đúng trong biên an toàn của nút chính (nút "đặt lại" bị cắt 5px)',
  );
  // Bốn cái chấm đã nói "N trên mấy" — con số bên cạnh là chỗ nói lần thứ hai.
  assert.ok(
    !/\{cyclePos\}\/\{longBreakAfterN\}/.test(SRC),
    'chữ "N/4" quay lại cạnh bốn cái chấm nói đúng điều đó',
  );
});
