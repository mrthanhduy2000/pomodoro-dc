/**
 * skinTokens.test.js — canh màu nhấn không bị chốt cứng trở lại (`TECH_DEBT #86`).
 *
 * ⚠️ App có **2 theme × 5 skin**, và các skin THẬT SỰ đổi màu nhấn: `arcade` dùng
 * `--accent-rgb: 226, 84, 44`, `inkgold` dùng `217, 164, 65`. Vậy mà 84 chỗ trong 16 file component
 * chốt cứng `rgba(201, 100, 66, …)` — đúng màu terracotta của skin MẶC ĐỊNH. Nghĩa là chúng chỉ
 * đúng ở 2 trong 10 tổ hợp; ở ba skin còn lại, một nút viền terracotta ngồi giữa một giao diện màu
 * khác hẳn. Chưa ai kêu vì cả 5 skin đều dùng chung một họ màu ấm — nhưng "chưa ai kêu" không phải
 * "đang đúng".
 * Dự án đã có sẵn token `--accent-rgb`/`--accent2-rgb` từ lâu; chỉ là 84 chỗ ấy không dùng nó.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const GOC = new URL('../', import.meta.url).pathname;

function moiFile(thuMuc, ra = []) {
  for (const ten of readdirSync(thuMuc)) {
    const d = join(thuMuc, ten);
    if (statSync(d).isDirectory()) { moiFile(d, ra); continue; }
    if (/\.(js|jsx)$/.test(ten) && !/\.test\.js$/.test(ten)) ra.push(d);
  }
  return ra;
}

// THỬ-CHO-ĐỎ: dán lại một `rgba(201, 100, 66, 0.14)` vào bất kỳ component nào ⇒ bài này đỏ.
test('không component nào được chốt cứng màu nhấn — phải đọc token', () => {
  const files = moiFile(join(GOC, 'components')).concat(moiFile(join(GOC, 'hooks')));
  assert.ok(files.length >= 20, `mới thấy ${files.length} file — phép đo đang chạy rỗng`);

  const dinh = [];
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    // Hai mã màu của skin MẶC ĐỊNH. Chốt cứng chúng nghĩa là bỏ qua bốn skin còn lại.
    if (/rgba\(\s*201,\s*100,\s*66\s*,/.test(src)) dinh.push(`${f.split('/').pop()} (accent)`);
    if (/rgba\(\s*138,\s*63,\s*36\s*,/.test(src)) dinh.push(`${f.split('/').pop()} (accent2)`);
  }

  assert.deepEqual(
    dinh, [],
    'màu nhấn bị chốt cứng trở lại. Dùng `rgba(var(--accent-rgb), X)` — app có 5 skin và ba trong '
    + 'số đó khai một `--accent-rgb` KHÁC, nên một mã màu chốt cứng chỉ đúng ở 2/10 tổ hợp.',
  );
});

// THỬ-CHO-ĐỎ: xoá dòng `--accent-rgb` khỏi `:root` trong index.css ⇒ bài này đỏ.
test('token `--accent-rgb` phải tồn tại, và phải có skin THẬT SỰ đổi nó', () => {
  const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
  const giaTri = [...css.matchAll(/--accent-rgb:\s*([^;]+);/g)].map((m) => m[1].trim());
  assert.ok(giaTri.length >= 2, 'không thấy token `--accent-rgb` — mọi thay thế ở trên thành vô nghĩa');
  // Nếu MỌI skin đều khai cùng một giá trị thì token ấy không mang tin, và bài trên chỉ là hình thức.
  assert.ok(
    new Set(giaTri).size >= 2,
    'mọi skin đang khai cùng một `--accent-rgb` ⇒ token không mang tin. Bài test trên khi ấy canh '
    + 'một sự khác biệt không tồn tại — đọc lại trước khi tin nó.',
  );
});
