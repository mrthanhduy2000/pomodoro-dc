/**
 * motSuThatMotCho.test.js — canh những chỗ app từng nói CÙNG MỘT sự thật hai lần trong một
 * khung nhìn. Vòng 23 gỡ bốn chỗ; bài này giữ cho chúng không quay lại.
 *
 * ⚠️ Đây là bài đọc-MÃ-NGUỒN, nên nó chỉ canh được CẤU TRÚC. Con số điểm ảnh phải đo lại bằng
 * `node scripts/shot.mjs --phone --fixture .shots/fixture.json --tab … --probe …`; số đo của
 * từng mục ghi trong chú thích tại chỗ sửa.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { QUICK_FOCUS_PRESETS } from '../engine/breaks.js';
import { stripComments } from '../utils/sourceScan.js';

const doc = (p) => stripComments(readFileSync(new URL(p, import.meta.url), 'utf8'));

// THỬ-CHO-ĐỎ: dán lại `<span>Khoá</span>` vào hàng di vật ⇒ đỏ.
test('Di vật: không in "Khoá" ở từng hàng của danh sách VỐN toàn hàng khoá', () => {
  const ma = doc('./RelicInventory.jsx');
  assert.match(ma, /locked\.map\(/, 'không còn danh sách khoá — phép đo chạy rỗng');
  assert.ok(
    !/>Khoá</.test(ma),
    'chữ "Khoá" quay lại từng hàng. Danh sách dựng bằng `locked.map(...)` nên mọi hàng khoá THEO '
    + 'CẤU TẠO — mở được thì di vật RỜI khỏi mảng chứ không đổi chữ tại chỗ.',
  );
  // ⚠️ Nhưng TÊN KHỦNG HOẢNG thì phải còn: đó là dữ kiện duy nhất của mỗi hàng, và một vòng soi
  // đã đề nghị gộp cả 15 hàng thành một dòng — bị BÁC vì lý do này.
  assert.match(ma, /relic\.crisisName/, 'mất tên khủng hoảng ⇒ 15 hàng thành 15 dòng giống hệt nhau');
});

// THỬ-CHO-ĐỎ: đổi `CHU_KY_NGHI_CO_KHAC_NHAU` thành `true` ⇒ đỏ.
test('Tập trung: viên "×N" chỉ hiện khi trục ấy THẬT SỰ phân biệt được các preset', () => {
  const ma = doc('./PomodoroEngine.jsx');
  assert.match(
    ma, /CHU_KY_NGHI_CO_KHAC_NHAU = new Set\(QUICK_FOCUS_PRESETS\.map\(\(p\) => p\.longBreakAfterN\)\)\.size > 1/,
    'điều kiện hiện viên "×N" phải HỎI THẲNG BẢNG, không được viết cứng `!== 4`',
  );
  // Và hôm nay bảng nói: không phân biệt được gì.
  assert.equal(
    new Set(QUICK_FOCUS_PRESETS.map((p) => p.longBreakAfterN)).size, 1,
    'bảng preset nay có nhiều nhịp nghỉ dài khác nhau ⇒ viên "×N" tự hiện lại, đúng như thiết kế',
  );
  // Ba trục KIA thì phải còn phân biệt được, nếu không cả cái lưới so sánh là vô nghĩa.
  for (const truc of ['focusMinutes', 'shortBreakDuration', 'longBreakDuration']) {
    assert.ok(
      new Set(QUICK_FOCUS_PRESETS.map((p) => p[truc])).size >= 3,
      `trục "${truc}" thôi phân biệt được các preset — lưới này sinh ra để SO SÁNH`,
    );
  }
});

// THỬ-CHO-ĐỎ: dán lại `<p>Blueprints</p>` ⇒ đỏ.
test('Bản vẽ: một màn MỘT cái tên, và cái tên ấy bằng tiếng Việt', () => {
  const ma = doc('./BlueprintInventory.jsx');
  // ⚠️ Hỏi NÚT CHỮ ĐƯỢC HIỆN RA, không hỏi cái tên. Bản đầu của bài này viết `/Blueprints/` và
  // nó ĐỎ OAN vì trúng đúng tên hàm `MyBlueprintsTab` — đúng bài học "assert phải hỏi đích danh
  // khối cần canh". Một nút chữ JSX nằm riêng một dòng giữa hai thẻ.
  assert.ok(
    !/^\s*Blueprints\s*$/m.test(ma),
    'nhãn tiếng Anh "Blueprints" quay lại — viên tab ở trên đã nói bằng tiếng Việt',
  );
  assert.ok(!/^\s*Bản vẽ & nghiên cứu\s*$/m.test(ma), 'tiêu đề lặp lại tên tab quay lại');
  assert.match(ma, /MyBlueprintsTab/, 'không đọc được file — phép đo chạy rỗng');
});

// THỬ-CHO-ĐỎ: dán lại câu luật vào `BuiltCard` ⇒ đỏ.
test('Xưởng: luật chung nói MỘT lần, và tên đặc quyền không tóm tắt lại ở đầu màn', () => {
  const ma = doc('./BuildingWorkshop.jsx');
  const soLan = (ma.match(/Cấp công trình vẫn tăng thông số nền/g) ?? []).length;
  assert.equal(
    soLan, 1,
    `câu luật chung xuất hiện ${soLan} lần trong mã. Nó đúng cho MỌI công trình từ cấp 2, nên nó `
    + 'thuộc về tiêu đề mục chứ không thuộc về từng thẻ (đo trên màn thật: 4 lần một màn).',
  );
  assert.ok(
    !/activePerkLabels/.test(ma),
    'hàng chip tóm tắt tên đặc quyền quay lại — mỗi tên ấy đã in nguyên văn trên chính thẻ công '
    + 'trình sinh ra nó, cùng một màn',
  );
});
