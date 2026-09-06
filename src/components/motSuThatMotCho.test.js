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
  // ⚠️ GÁC CHẠY-RỖNG ĐÃ ĐỔI ĐÍCH (2026-09-01) — và nó đã làm đúng việc của nó: khi danh sách được
  // TÁCH LÀM HAI (`conLay` còn lấy được / `daLo` đã lỡ), phép đo cũ hỏi `locked.map(` liền ĐỎ với
  // đúng câu "phép đo chạy rỗng" thay vì lặng lẽ xanh trên một file nó không còn hiểu. Đây là lý
  // do mọi bài test đọc-mã-nguồn phải có gác chạy-rỗng.
  assert.match(ma, /conLay\.map\(/, 'không còn danh sách di vật chưa có — phép đo chạy rỗng');
  assert.ok(
    !/>Khoá</.test(ma),
    'chữ "Khoá" quay lại từng hàng. Danh sách chỉ chứa di vật CHƯA có nên mọi hàng khoá THEO '
    + 'CẤU TẠO — mở được thì di vật RỜI khỏi mảng chứ không đổi chữ tại chỗ.',
  );
  // ⚠️ Nhưng TÊN KHỦNG HOẢNG thì phải còn: nó trả lời "cái này rơi ở đâu", và một vòng soi đã đề
  // nghị gộp cả 15 hàng thành một dòng — bị BÁC vì lý do này.
  assert.match(ma, /relic\.crisisName/, 'mất tên khủng hoảng ⇒ các hàng thành những dòng giống hệt nhau');
  // ⚠️ VÀ HÀNG PHẢI NÓI RA PHẦN THƯỞNG. Bản cũ in "??? từ <tên khủng hoảng>" — dùng đúng 2/7
  // trường của mỗi di vật và vứt 5, trong đó có chính cái tên và cái phần thưởng. Mười lăm dòng
  // "???" không tạo ra ham muốn nào; chúng chỉ nói "bạn đang thiếu mười lăm thứ".
  assert.ok(!/\?\?\?/.test(ma), 'dấu "???" quay lại — hàng di vật lại giấu mất phần thưởng.');
  assert.match(ma, /relic\.label/, 'hàng di vật phải nói TÊN phần thưởng.');
});

// THỬ-CHO-ĐỎ: đổi `CHU_KY_NGHI_CO_KHAC_NHAU` thành `true` ⇒ đỏ.
test('Tập trung: viên "×N" chỉ hiện khi trục ấy THẬT SỰ phân biệt được các preset', () => {
  const ma = doc('./focus/QuickPresets.jsx'); // ADR-076: QuickPresets lives in its own file
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

// THỬ-CHO-ĐỎ: thêm `<h3>Công trình</h3>` vào `BuildScreen.jsx` ⇒ đỏ.
test('Công trình (ADR-069): một màn MỘT cái tên, và không còn bảng giá nào giữa người chơi và nút', () => {
  const ma = doc('./BuildScreen.jsx');
  // Viên tab con đang sáng đã ghi "Công trình"; màn không được gọi tên mình lần nữa bằng tiêu đề.
  assert.ok(!/<h[1-3][^>]*>\s*Công trình\s*<\/h[1-3]>/.test(ma), 'tiêu đề lặp lại tên tab quay lại');
  // Ba cổng cũ (RP · nguyên liệu · tinh luyện) là lý do màn cũ dài 2.376px. Chúng không được quay
  // lại dưới bất kỳ cái tên nào — bản vẽ khởi công thẳng, cái giá là PHIÊN và Ô hàng chờ.
  for (const dauHieu of ['research.rp', 'ResourceCost', 'refinedCost', 'resourcesRefined', 'researchBlueprint', 'startCrafting(']) {
    assert.ok(!ma.includes(dauHieu), `\`${dauHieu}\` quay lại màn Công trình — cổng cũ đang mọc lại`);
  }
  assert.match(ma, /startProject/, 'màn phải gọi đúng MỘT action khởi công — `startProject`');
  assert.match(ma, /Khởi công/, 'không đọc được file — phép đo chạy rỗng');
});

// ─── PHẢN HỒI KHI BẤM (2026-09-01) ───────────────────────────────────────────
// THỬ-CHO-ĐỎ: đổi `<Motion.button` của thanh điều hướng về `<button` ⇒ đỏ.
test('năm nút thanh điều hướng — thứ Đàm chạm nhiều nhất — phải NHÚC NHÍCH khi bấm', () => {
  const ma = stripComments(readFileSync(new URL('../App.jsx', import.meta.url), 'utf8'));
  const i = ma.indexOf('MOBILE_PRIMARY_TABS.map');
  assert.ok(i > 0, 'không tìm thấy thanh điều hướng — phép đo chạy rỗng');
  const khoi = ma.slice(i, i + 700);
  assert.match(khoi, /<Motion\.button/, 'nút thanh dưới trở lại `<button>` trần — bấm không có phản hồi nào');
  assert.match(khoi, /\{\.\.\.pressMotion\}/, 'không còn trải nhịp BẤM');
  // ⚠️ Phải lấy từ `motionPresets` chứ không gõ tay `whileTap`: nhịp ở đó tự im khi bật
  // "Giảm chuyển động", còn một prop viết rời thì không, và `motionCoverage.test.js` sẽ đỏ.
  assert.match(ma, /usePressMotion\(\)/, 'nhịp bấm không lấy từ `lib/motionPresets`');
  assert.ok(!/whileTap=\{/.test(khoi), 'gõ tay `whileTap` — phải đi qua `usePressMotion()`');
});
