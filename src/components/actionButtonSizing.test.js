/**
 * actionButtonSizing.test.js — khoá một bài học đã trả giá: **KHÔNG truyền lớp kích thước
 * (`px-…`, `py-…`, `text-…`) cho `ActionButton` qua `className`.**
 * ─────────────────────────────────────────────────────────────────────────────
 * Không phải test hành vi — nó đọc thẳng mã nguồn, giống thủ pháp ở
 * `components/city/cityRenderers.test.js`. Lý do phải là test đọc-mã: vi phạm kiểu này **build
 * xanh, lint xanh, app vẫn chạy** — chỉ có chữ trên màn hình là sai, và sai một cách rất dễ nhìn
 * lướt qua.
 *
 * ⚠️ CHUYỆN ĐÃ XẢY RA (2026-08-13, Phase 4E). Nút chính ở trang chủ bị cắt chữ ở khung 390px. Bản
 * vá đầu truyền `px-2.5 text-[11px] overflow-hidden text-ellipsis` qua `className`, đo lại thấy
 * "sạch" và tôi tưởng xong. Hỏi thẳng trình duyệt (`shot.mjs --el`) thì nút VẪN đang chạy
 * `font-size: 18px` và `padding: 28px` — tức `text-lg`/`px-7` trong `sizeMap.default` của
 * `ActionButton` THẮNG. Tailwind quyết lớp nào thắng theo THỨ TỰ TRONG BẢNG KIỂU sinh ra, KHÔNG
 * theo thứ tự viết trong chuỗi `className`, và dự án không có `tailwind-merge` để hoà giải.
 * ⇒ Hai lớp cùng khai một thuộc tính CSS là một canh bạc. Lối đúng đã có sẵn trong chính component:
 * `sizeMap[size] ?? sizeMap.default` chỉ phát ra MỘT bộ, nên không có gì để đánh nhau — muốn khác
 * kích thước thì thêm/dùng một `size`, đừng chồng lớp.
 *
 * Bài test này KHÔNG cấm mọi `className`: `min-w-0 w-full`, màu, bo góc… đều không đụng hàng với
 * `sizeMap`. Nó chỉ cấm đúng những thuộc tính mà `sizeMap` đang khai.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const SOURCE = await readFile(new URL('./PomodoroEngine.jsx', import.meta.url), 'utf8');

/**
 * Bỏ chú thích để không bắt nhầm ví dụ nêu trong chính lời giải thích ở trên.
 * (Bản đầu của bài test này ĐỎ vì đọc trúng chú thích mô tả cái sai — đúng cái bẫy mà
 * `cityRenderers.test.js` đã gặp và đã ghi lại.)
 */
function codeOnly(source) {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')   // {/* chú thích JSX */}
    .replace(/\/\*[\s\S]*?\*\//g, ' ')             // /* khối */
    .replace(/^\s*\/\/.*$/gm, ' ');                // // dòng
}

/** Những thuộc tính mà `sizeMap` của `ActionButton` đang khai — cấm khai lại qua `className`. */
const CONFLICTING = [
  { name: 'padding ngang (px-…)', re: /(?:^|\s)(?:sm:|md:|lg:)?px-[\w.[\]-]+/ },
  { name: 'padding dọc (py-…)', re: /(?:^|\s)(?:sm:|md:|lg:)?py-[\w.[\]-]+/ },
  { name: 'cỡ chữ (text-…, trừ màu)', re: /(?:^|\s)(?:sm:|md:|lg:)?text-(?:xs|sm|base|lg|xl|\d*xl|\[\d)/ },
  { name: 'độ đậm (font-…)', re: /(?:^|\s)(?:sm:|md:|lg:)?font-(?:bold|semibold|medium|normal)/ },
  { name: 'xuống dòng (whitespace-…)', re: /(?:^|\s)(?:sm:|md:|lg:)?whitespace-\w+/ },
  { name: 'chiều cao dòng (leading-…)', re: /(?:^|\s)(?:sm:|md:|lg:)?leading-[\w.[\]-]+/ },
];

/**
 * Trích phần THUỘC TÍNH của mọi thẻ `<ActionButton …>`.
 *
 * ⚠️ Không dùng regex `<ActionButton([\s\S]*?)>` — dấu `>` xuất hiện cả bên trong biểu thức
 * `{...}` (so sánh, mũi tên hàm), nên regex sẽ cắt nhầm chỗ. Ở đây đếm ngoặc nhọn để biết dấu `>`
 * nào mới thật sự đóng thẻ. (Bản đầu của bài test này dùng regex và trích ra **0 thẻ** — may là
 * cổng chống-tập-rỗng bên dưới đã bắt được, nếu không nó đã "xanh" mà chẳng canh gì.)
 */
function actionButtonTags(source) {
  const out = [];
  const needle = '<ActionButton';
  let at = source.indexOf(needle);
  while (at !== -1) {
    let depth = 0;
    let end = -1;
    for (let i = at + needle.length; i < source.length; i += 1) {
      const ch = source[i];
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      else if (ch === '>' && depth === 0) { end = i; break; }
    }
    if (end === -1) break;
    out.push({ start: at, attrs: source.slice(at + needle.length, end) });
    at = source.indexOf(needle, end);
  }
  return out;
}

/** Chỉ lấy các lớp viết THẲNG trong `className="…"` (dạng `className={biến}` kiểm ở bài riêng). */
function literalClassName(attrs) {
  const m = /className="([^"]*)"/.exec(attrs);
  return m ? m[1] : null;
}

test('ActionButton: KHÔNG truyền lớp kích thước qua `className` — chúng thua `sizeMap` một cách im lặng', () => {
  const code = codeOnly(SOURCE);
  const tags = actionButtonTags(code);

  // Cổng chống "xanh vì không đo gì": bộ trích hỏng thì bài test sẽ luôn xanh mà chẳng canh gì cả
  // — đúng kiểu "kết luận sạch từ tập RỖNG" đã cắn ở công cụ đo giao diện.
  assert.ok(tags.length >= 10,
    `Chỉ trích được ${tags.length} thẻ <ActionButton> — bộ trích đã hỏng, bài test này đang vô nghĩa.`);

  const violations = [];
  for (const tag of tags) {
    const cls = literalClassName(tag.attrs);
    if (!cls) continue;
    for (const { name, re } of CONFLICTING) {
      if (re.test(cls)) violations.push(`${name} trong className="${cls.slice(0, 90)}…"`);
    }
  }

  assert.deepEqual(violations, [],
    'ActionButton đã có `sizeMap` lo kích thước. Lớp truyền thêm qua `className` KHÔNG chắc thắng\n'
    + '(Tailwind xếp theo thứ tự bảng kiểu, không theo thứ tự viết) — và khi thua thì không có gì\n'
    + 'báo đỏ, chỉ có chữ hiện sai trên máy Đàm. Hãy dùng prop `size` (thêm một mục vào `sizeMap`\n'
    + 'nếu cần) thay vì chồng lớp.\nVi phạm:\n  - ' + violations.join('\n  - '));
});

test('Nút chính ở trang chủ dùng `size="compactMobile"` — đây là chỗ đã từng cắt mất chữ', () => {
  const code = codeOnly(SOURCE);
  const labelAt = code.indexOf('Cần điền mục tiêu');
  assert.notEqual(labelAt, -1, 'Không tìm thấy nhãn "Cần điền mục tiêu" — nhãn đổi thì sửa bài test này.');
  // Thẻ mở GẦN NHẤT phía trước nhãn mới là thẻ chứa nó.
  const owner = actionButtonTags(code).filter((t) => t.start < labelAt).pop();
  assert.ok(owner, 'Nhãn không nằm trong thẻ <ActionButton> nào.');
  assert.match(owner.attrs, /size="compact(?:Primary|Mobile)"/,
    'Nút chính ở khung điện thoại PHẢI dùng một `size` compact. Đo được ở bản không có nó:\n'
    + 'font 18px + padding 28px trong một khung rộng 186px ⇒ chữ cần 209px ⇒ bị xén.');
});

test('`compactTimerActionButtonClassName` chỉ chứa lớp KHÔNG đụng `sizeMap`', () => {
  const m = /const compactTimerActionButtonClassName\s*=\s*'([^']*)'/.exec(SOURCE);
  assert.ok(m, 'Không tìm thấy hằng `compactTimerActionButtonClassName`.');
  for (const { name, re } of CONFLICTING) {
    assert.ok(!re.test(m[1]),
      `Hằng dùng chung cho mọi nút compact KHÔNG được khai ${name}: "${m[1]}"`);
  }
});
