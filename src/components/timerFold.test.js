import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RING_HEIGHT_RESERVE_PX } from './focus/ringMetrics.js';
import { stripComments } from '../utils/sourceScan.js';

const SRC = readFileSync(new URL('./PomodoroEngine.jsx', import.meta.url), 'utf8');
// ⚠️ Bản BỎ CHÚ THÍCH: mấy tên cũ được kể lại trong chính lời giải thích vì sao chúng bị xoá,
// nên một phép tìm trên nguyên văn sẽ đọc trúng lời cáo phó và tưởng là người còn sống.
const CODE = stripComments(SRC);

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

// ⚠️ VÒNG 42 (ADR-081) — CÁI TRẦN CŨ ĐÃ ĐƯỢC THAY BẰNG MỘT THỨ MẠNH HƠN, VÀ ĐÂY LÀ LÝ DO.
//
// Bản cũ khoá `min(${timerCanvasSize}px, ${ringViewportCap})` ở HAI chỗ và bắt hai chỗ ấy dùng
// CÙNG một trần — đúng ý, nhưng nó chỉ canh được cái trần, không canh được phép nhân đứng sau nó.
// Vòng đồng hồ còn bị `transform: scale()` phóng to lên nữa, mà transform KHÔNG đổi bố cục ⇒ hình
// vẽ to hơn cái lỗ chừa cho nó đúng lúc trần cắn. Đo 2026-09-08 ở 390px toàn màn hình: vẽ 427px,
// chừa 281px, dòng mục tiêu nằm SÂU 32px trong nét vòng. Bài test cũ vẫn XANH suốt lúc ấy.
//
// ⇒ Nay không còn hai biểu thức để so nhau nữa: vòng là một hộp bố cục bình thường với MỘT bề
// ngang (`ringSize`) và `aspect-ratio: 1`, còn chỗ chứa nó KHÔNG có chiều cao riêng. Cái được
// canh ở đây là chính điều đó — vì đó là thứ đã gãy.

test('vòng đồng hồ có MỘT bề ngang duy nhất, lấy từ `ringSizeCss`', () => {
  assert.match(
    SRC, /const ringSize = ringSizeCss\(ringContext\(/,
    'cỡ vòng không còn đến từ `focus/ringMetrics.js` — mọi con số cỡ vòng phải có đúng MỘT chủ',
  );
  assert.match(
    SRC, /style=\{\{ width: ringSize, aspectRatio: '1 \/ 1', containerType: 'inline-size' \}\}/,
    'hộp vòng đồng hồ không còn là `width: ringSize` + `aspect-ratio` ⇒ chiều cao lại là một con số riêng',
  );
  // THỬ-CHO-ĐỎ: đổi `width: ringSize` thành `width: ringSize, height: ringSize` ⇒ vẫn xanh ở dòng
  // trên nhưng đỏ ở đây, vì hai chiều lại tách thành hai giá trị có thể lệch nhau.
  const i = SRC.indexOf("style={{ width: ringSize, aspectRatio");
  assert.ok(i > 0);
  assert.ok(
    !/height: ringSize/.test(SRC.slice(i, i + 200)),
    'chiều cao vòng lại được khai riêng — `aspect-ratio` là thứ duy nhất được suy ra nó',
  );
});

// ⚠️ VẾ DỄ QUÊN NHẤT, VÀ CHÍNH NÓ ĐÃ GÃY: chỗ chứa vòng KHÔNG được có chiều cao riêng. Bản cũ giữ
// sẵn chiều cao bằng `minHeight` tính từ một biểu thức THỨ HAI; hễ hai biểu thức lệch nhau là chữ
// nằm dưới vòng rơi lên nét vòng. Chỗ chứa nay `height: auto` nên nó ôm đúng cái nó chứa — thứ
// được chừa CHÍNH LÀ thứ được vẽ, không còn gì để lệch.
// THỬ-CHO-ĐỎ: thêm lại `style={{ minHeight: ... }}` vào khối cha của vòng ⇒ đỏ.
test('chỗ chứa vòng KHÔNG có chiều cao riêng — thứ được chừa chính là thứ được vẽ', () => {
  const i = SRC.indexOf('<div className="relative mt-2 flex w-full items-center justify-center');
  assert.ok(i > 0, 'không tìm thấy khối chứa vòng đồng hồ — phép đo chạy rỗng');
  const khoi = SRC.slice(i, SRC.indexOf('style={{ width: ringSize', i));
  assert.ok(
    !/minHeight|height:/.test(khoi),
    'khối chứa vòng lại tự khai chiều cao ⇒ nó có thể lệch khỏi cỡ vòng thật, đúng lỗi vòng 42',
  );
  assert.ok(
    !/timerFootprintHeight|ringViewportCap|timerCanvasSize|timerCircleBoost|timerVisualScale/.test(CODE),
    'một trong chín con số cỡ vòng cũ đã quay lại — chúng bị xoá vì hai trong số chúng nói ngược nhau',
  );
});

// ⚠️ KHÔNG BAO GIỜ PHÓNG VÒNG BẰNG `transform`. Đây là nguyên nhân gốc, viết thành một dòng: một
// phép biến hình không đổi bố cục, nên mọi thứ nằm dưới vòng vẫn tính theo cỡ TRƯỚC khi phóng.
// THỬ-CHO-ĐỎ: thêm lại `animate: { scale: … }` cho khối bọc vòng ⇒ đỏ.
test('không có phép `scale` nào phóng vòng đồng hồ', () => {
  const i = SRC.indexOf("style={{ width: ringSize, aspectRatio");
  const truoc = SRC.slice(Math.max(0, i - 400), i);
  assert.ok(
    !/scale/.test(truoc),
    'có `scale` quanh hộp vòng đồng hồ — transform không đổi bố cục, nên chữ dưới vòng lại đè lên nét vòng',
  );
});

// ⚠️ CÒN CÁI TRẦN NÚT-TRÊN-NẾP-GẤP THÌ CHUYỂN THÀNH MỘT CON SỐ THẬT: phần chiều cao mà mọi thứ
// KHÔNG PHẢI vòng đồng hồ cần trên khung điện thoại. Vòng lấy phần còn lại, nên nút Bắt đầu ở
// trên nếp gấp là hệ quả của số này chứ không phải của một cái trần theo bề ngang.
// Đo 2026-09-08 ở 390×844: nút Bắt đầu y=686…728, thanh tab nổi y=774 ⇒ dư 46px.
test('phần chừa cho phần còn lại của màn Tập trung đủ lớn để nút Bắt đầu nằm trên thanh tab', () => {
  // Thanh tab nổi bắt đầu ở 774/844 = 91.7% chiều cao khung. Mọi thứ ngoài vòng đồng hồ ở khung
  // hẹp — bưu thiếp, dải gạch, dòng dưới vòng, hàng nút, và chính 118px thanh tab chừa sẵn — cộng
  // lại phải ≥ 500px, nếu không vòng lại phình ra và đẩy nút xuống dưới thanh tab.
  assert.ok(
    RING_HEIGHT_RESERVE_PX.compact >= 500,
    `phần chừa ở khung hẹp còn ${RING_HEIGHT_RESERVE_PX.compact}px — dưới 500px thì vòng phình ra và `
    + 'nút Bắt đầu chui xuống dưới thanh tab nổi (đã xảy ra hai lần: vòng 20 và vòng 23)',
  );
  // …và không được lớn tới mức vòng biến mất: dưới 200px đường kính thì con số trong vòng bắt đầu
  // nhỏ hơn chữ thường của app, tức đồng hồ thôi là trung tâm thị giác.
  assert.ok(
    844 - RING_HEIGHT_RESERVE_PX.compact >= 200,
    'phần chừa lớn tới mức vòng đồng hồ ở khung 390×844 nhỏ hơn 200px — đồng hồ thôi là thứ to nhất màn hình',
  );
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
