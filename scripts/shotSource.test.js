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
