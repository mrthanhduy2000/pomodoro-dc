import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PATH = fileURLToPath(new URL('./shot.mjs', import.meta.url));
const SRC = readFileSync(PATH, 'utf8');

// ⚠️ VÌ SAO FILE NÀY TỒN TẠI. `shot.mjs` là công cụ DUY NHẤT soi được giao diện ở khung 390px thật,
// tức mọi kết luận mỹ thuật về màn hình Đàm dùng hằng ngày đều đi qua nó. Nó không vào bundle nên
// `npm run build` không parse nó, và nó chỉ chạy khi có người gõ tay — đúng hình dạng đã để một
// `SyntaxError` sống sót tới tận cổng nghiệm thu cuối ở `city-preview.mjs` (bốn lần).

test('file parse được — bắt sớm lỗi cú pháp mà build không thấy', () => {
  // Bảo chính Node parse, đừng đoán bằng regex: đây là bài học từ `cityPreviewSource.test.js`.
  execFileSync(process.execPath, ['--check', PATH], { stdio: 'pipe' });
});

// ⚠️ Bài chính. Mọi nút CHỈ-CÓ-BIỂU-TƯỢNG có `textContent` rỗng — chuông thông báo, nút ⚙, nút
// đóng "×". Bản trước của `--click` chỉ khớp chữ hiển thị, nên **cả một họ giao diện không soi
// được bằng bất kỳ cách nào**: Trung tâm thông báo nằm trên MỌI màn hình mà chưa lần nào được
// chụp. Cùng hình dạng với fixture không gieo thành tích — soi mãi một màn rỗng rồi tưởng đó là
// màn thật.
// THỬ-CHO-ĐỎ: xoá nhánh `getAttribute('aria-label')` trong khối `--click` ⇒ đỏ.
test('--click khớp được cả nhãn trợ năng, không chỉ chữ hiển thị', () => {
  const i = SRC.indexOf('for (const label of CLICKS)');
  assert.ok(i > 0, 'không tìm thấy khối xử lý --click');
  const block = SRC.slice(i, i + 1400);
  assert.match(block, /getAttribute\('aria-label'\)/,
    'thiếu nhánh nhãn trợ năng ⇒ nút chỉ-có-biểu-tượng lại thành không soi được');
  assert.match(block, /el\.title/, 'nên thử cả `title` — nhiều nút cũ chỉ có nó');
});

// ⚠️ Thông báo lỗi phải kể CẢ nhãn trợ năng. Không có vế này thì người đọc thấy danh sách "các nhãn
// đang có" mà không có nút mình cần, rồi kết luận nút ấy không tồn tại — trong khi nó chỉ không có
// chữ. Một thông báo lỗi đúng-về-kỹ-thuật mà dẫn người đọc đi sai hướng thì bằng không có.
test('danh sách gợi ý khi bấm trượt cũng kể nhãn trợ năng', () => {
  const i = SRC.indexOf('KHÔNG tìm thấy nút "${label}"');
  assert.ok(i > 0);
  const before = SRC.slice(Math.max(0, i - 700), i);
  assert.match(before, /aria-label/,
    'danh sách gợi ý chỉ kể chữ hiển thị ⇒ nút biểu tượng trông như không tồn tại');
});

// Gác: thứ tự thử phải là CHỮ HIỂN THỊ trước rồi mới tới nhãn trợ năng. Đảo lại thì một nút có
// `aria-label` trùng chữ của nút khác sẽ cướp lượt, và ảnh chụp ra một màn hình khác trong im lặng.
test('ưu tiên chữ hiển thị trước nhãn trợ năng', () => {
  const i = SRC.indexOf('for (const label of CLICKS)');
  const block = SRC.slice(i, i + 1400);
  const text = block.indexOf('textContent');
  const aria = block.indexOf("getAttribute('aria-label')");
  assert.ok(text > 0 && aria > 0 && text < aria,
    'phải thử khớp chữ hiển thị TRƯỚC — nó chính xác hơn và ít bất ngờ hơn');
});

/**
 * ⚠️ LỜI NÓI DỐI THỨ NĂM CỦA `shot.mjs` — MỘT TẤM ẢNH KHÔNG BẮT ĐƯỢC THỨ CHỈ SỐNG 4 GIÂY.
 *
 * Đo được 2026-09-02: thẻ phần thưởng sau phiên hiện ở giây **13,5** và tắt ở giây **17,7**.
 * `--settle` thử 0,4 · 1 · 3,5 · 6 · 14 giây — KHÔNG lần nào ảnh có thẻ, vì cổng "đợi DOM đứng
 * yên" chạy SAU `--settle` và nó chỉ nhả ra khi mọi thứ thôi nhúc nhích, tức khi thẻ đã tắt.
 * Ảnh sạch + probe `false` + không lỗi nào ⇒ đọc y hệt "tính năng không chạy". Đây là đúng hình
 * dạng bốn lời nói dối đã ghi ở đầu file: hỏng im lặng, không có gì báo động.
 *
 * Bản vá có HAI vế, và thiếu vế nào cũng vô dụng: (a) một MutationObserver gắn từ đầu trang để
 * GHI LẠI mọi lần chuỗi xuất hiện; (b) bỏ qua cổng đứng-yên khi đang rình, và chụp NGAY lúc nó
 * đang hiện.
 */
test('--watch phải GẮN TỪ ĐẦU TRANG, không phải hỏi sau khi đã settle', () => {
  const src = readFileSync(new URL('./shot.mjs', import.meta.url), 'utf8');

  assert.match(src, /const WATCH = arg\('--watch'/, 'thiếu cờ --watch');
  assert.match(
    src, /watchPatch[\s\S]{0,400}?MutationObserver/,
    'phải dùng MutationObserver gắn vào <head>: hỏi sau khi settle thì thứ thoáng qua đã tắt',
  );
  // Được tiêm cùng đường với `clockPatch` — nếu không thì nó không bao giờ vào trang.
  assert.match(
    src, /'<head>' \+ clockPatch \+ watchPatch/,
    '--watch không được tiêm vào trang ⇒ window.__dcWatch không tồn tại và probe luôn rỗng',
  );
  assert.match(
    src, /if \(\(clockPatch \|\| watchPatch\)/,
    'cổng tiêm vẫn chỉ hỏi clockPatch ⇒ dùng --watch mà không --hour thì không tiêm gì cả',
  );
});

test('--watch phải BỎ QUA cổng đứng-yên — nếu không nó luôn chụp trúng lúc đã tắt', () => {
  const src = readFileSync(new URL('./shot.mjs', import.meta.url), 'utf8');
  assert.match(
    src, /if \(WATCH\) \{[\s\S]{0,900}?\} else \{\s*\n\s*const \{ buttons, total \} = await waitForSteadyDom\(\)/,
    'cổng đứng-yên vẫn chạy khi có --watch ⇒ đợi tới lúc mọi thứ ngừng nhúc nhích = đợi tới lúc '
    + 'thẻ đã tắt. Đây chính là cái đã làm 5 lần đo liên tiếp ra kết luận sai.',
  );
  // Và khi rình hụt thì phải NÓI RÕ phân biệt hai ca ngược nhau — chưa từng hiện vs hiện rồi tắt.
  assert.match(src, /Nhật ký RỖNG nghĩa là chuỗi chưa từng hiện/,
    'thất bại phải phân biệt "chưa từng hiện" với "hiện rồi tắt trước khi chụp" — hai ca ấy cần '
    + 'hai cách sửa ngược nhau, gộp làm một là bắt người dùng đoán');
});

test('--preview gắn đúng vào URL sau khi gieo localStorage', () => {
  const src = readFileSync(new URL('./shot.mjs', import.meta.url), 'utf8');
  assert.match(src, /const PREVIEW = arg\('--preview'/, 'thiếu cờ --preview');
  assert.match(
    src, /location\.replace\('\/index\.html' \+/,
    'tham số preview phải đi cùng lần chuyển trang SAU khi gieo localStorage; gắn vào /seed thì '
    + 'nó bị nuốt mất khi trang tự chuyển sang /index.html',
  );
});
