/**
 * Khoá hai cái bẫy của `city-preview.mjs` mà **không có gì khác bắt được**, và cả hai đều đã cắn
 * thật trong CÙNG MỘT phiên (Performance Gate vòng 2, 2026-08-17).
 *
 * ⚠️ BẪY 1 — DẤU HUYỀN (`) TRONG CHÚ THÍCH LÀM CHẾT CẢ FILE.
 * Toàn bộ mã của trang xem thử nằm trong MỘT template literal khổng lồ (`return \`` … `\`;`, hơn
 * 300 dòng). Viết một chú thích kiểu ``// `renderer.info` đếm sau khi cắt`` là **đóng chuỗi giữa
 * chừng** ⇒ `SyntaxError`, và file chết ngay lúc nạp. Cắn HAI lần liên tiếp trong một phiên, vì
 * viết chú thích kỹ thuật bằng dấu huyền là phản xạ của cả dự án này (mọi file khác đều làm vậy).
 * ⚠️ ESLint KHÔNG bắt được (nó chỉ thấy một chuỗi hợp lệ ngắn hơn + rác phía sau đôi khi vẫn
 * parse), `npm run build` KHÔNG bắt (file này không nằm trong bundle), và bản thân bài test nào
 * không nạp file cũng không thấy. Triệu chứng duy nhất là công cụ đo chết lúc chạy — tức lúc
 * Đàm đang chạy nó trên MacBook, sau khi AI đã đi ngủ.
 *
 * ⚠️ BẪY 2 — NHÁY KÉP ASCII (") TRONG DÒNG `console.log` LÀM CỤT DÒNG KẾT LUẬN.
 * `bench-macbook.sh` lọc đầu ra bằng `[^"]*` (bắt buộc, vì Chromium bọc mỗi dòng console vào nháy
 * kép rồi dán thêm `", source: http://…/preview.js (42867)`). Dòng nào chứa " sẽ bị **cắt ngang**
 * tại đúng chỗ đó. Đã thấy tận mắt: dòng kết luận quan trọng nhất của Bước 1 in ra thành đúng
 * `[stats] ✓ ` rồi hết — một dòng trống rỗng trông y hệt "chẳng có gì đáng nói".
 * Cách viết đúng: dùng nháy kép cong “ ” (U+201C/201D), mắt đọc y như nhau.
 *
 * ⇒ Đây đúng tinh thần "một bài học được ghi ra KHÔNG chặn được gì; chỉ một bài TEST mới chặn
 * được" (bài học của chính vòng 1). Cả hai bài dưới đây đã thử-cho-đỏ.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const GỐC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ĐƯỜNG_DẪN = path.join(GỐC, 'scripts/city-preview.mjs');
const NGUỒN = readFileSync(ĐƯỜNG_DẪN, 'utf8');

/**
 * Cắt lấy đúng phần thân template literal dựng trang xem thử.
 * Mốc mở là dòng kết thúc bằng `return \``, mốc đóng là dòng chỉ có `\`;`.
 */
function thânTemplate() {
  const dòng = NGUỒN.split('\n');
  const mở = dòng.findIndex((d) => /return `$/.test(d));
  assert.ok(mở >= 0, 'không tìm thấy chỗ mở template của trang xem thử — file đã đổi cấu trúc?');
  const đóng = dòng.findIndex((d, i) => i > mở && d === '`;');
  assert.ok(đóng > mở, 'không tìm thấy chỗ đóng template — file đã đổi cấu trúc?');
  return { dòng: dòng.slice(mở + 1, đóng), sốDòngĐầu: mở + 2 };
}

test('city-preview.mjs PHẢI parse được — không dấu huyền lạc trong template', () => {
  // Phép kiểm THẬT: bảo chính Node parse file. Không đoán bằng regex, không đếm dấu.
  execFileSync(process.execPath, ['--check', ĐƯỜNG_DẪN], { stdio: 'pipe' });

  // Và chỉ đích danh chỗ sai, vì thông báo của `--check` chỉ ra một dòng chứ không nói vì sao.
  const { dòng, sốDòngĐầu } = thânTemplate();
  const phạm = dòng
    .map((d, i) => (d.includes('`') ? `dòng ${sốDòngĐầu + i}: ${d.trim()}` : null))
    .filter(Boolean);
  assert.deepEqual(phạm, [],
    'Có dấu huyền (`) trong thân template của trang xem thử — nó ĐÓNG CHUỖI giữa chừng và làm chết\n'
    + 'cả file. Trong vùng này hãy dùng nháy đơn cho tên hàm/biến trong chú thích:\n  '
    + phạm.join('\n  '));
});

test('mọi dòng [bench]/[stats] KHÔNG được chứa nháy kép ASCII — nó bị bộ lọc cắt cụt', () => {
  const { dòng, sốDòngĐầu } = thânTemplate();
  const phạm = [];
  dòng.forEach((d, i) => {
    // Chỉ soi các dòng THẬT SỰ in ra nhãn [bench]/[stats]; chú thích thì tuỳ ý.
    if (!/\[(bench|stats)\]/.test(d)) return;
    if (/^\s*(\/\/|\*|\/\*)/.test(d.trim())) return;
    // Chuỗi trong mã này luôn dùng nháy ĐƠN, nên mọi " còn lại là ký tự nội dung.
    if (d.includes('"')) phạm.push(`dòng ${sốDòngĐầu + i}: ${d.trim()}`);
  });
  assert.deepEqual(phạm, [],
    'Dòng in [bench]/[stats] có nháy kép ASCII ("). `bench-macbook.sh` lọc bằng [^"]* nên dòng sẽ\n'
    + 'bị CẮT NGANG tại đó và Đàm nhận được một dòng cụt. Dùng nháy cong “ ” thay thế:\n  '
    + phạm.join('\n  '));
});
