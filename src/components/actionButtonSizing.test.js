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

test('CẢ HAI nút ở chỗ đồng hồ dùng `size` compact — đây là chỗ đã từng cắt mất chữ', () => {
  const code = codeOnly(SOURCE);
  // ⚠️ NAY CÓ HAI NÚT Ở ĐÚNG CHỖ NÀY, KHÔNG CÒN MỘT (đổi 2026-08-30). Trước đây một nút duy nhất
  // đổi nhãn theo trạng thái ("Bắt đầu phiên" ↔ "Cần điền mục tiêu"), và bản `disabled` của nó là
  // một NGÕ CỤT — nói ra điều đang thiếu mà không nói thiếu ở đâu. Nay lúc chưa có mục tiêu thì
  // đó là một nút KHÁC, bấm được, đưa thẳng tới ô mục tiêu ("Điền mục tiêu →").
  // ⚠️ Bài này phải kiểm CẢ HAI: kiểm mỗi nút cũ thì nút mới — cái Đàm gặp trước tiên vì nó là
  // trạng thái mặc định mỗi lần mở app — sẽ không có ai canh, và nó là nút DÀI CHỮ HƠN.
  // ⚠️ "Điền mục tiêu →" nay chỉ hiện khi KHÔNG có mục tiêu gần đây; ca thường gặp là "Tự viết →"
  // đứng cạnh chip. Kiểm cả ba nhãn thì không ca nào mất người canh.
  const NHAN = ['Bắt đầu phiên', 'Điền mục tiêu →', 'Tự viết →'];
  for (const nhan of NHAN) {
    const labelAt = code.indexOf(nhan);
    assert.notEqual(labelAt, -1, `Không tìm thấy nhãn "${nhan}" — nhãn đổi thì sửa bài test này.`);
    // Thẻ mở GẦN NHẤT phía trước nhãn mới là thẻ chứa nó.
    const owner = actionButtonTags(code).filter((t) => t.start < labelAt).pop();
    assert.ok(owner, `Nhãn "${nhan}" không nằm trong thẻ <ActionButton> nào.`);
    // ⚠️ `size` CÓ THỂ LÀ BIỂU THỨC, KHÔNG CHỈ LÀ CHUỖI (từ 2026-09-02). Nút thoát "Tự viết →"
    // đứng cạnh một chip co giãn nên nó đổi cỡ theo ngữ cảnh:
    //   size={recentGoals.length > 0 ? 'compactEscape' : 'compactPrimary'}
    // Bài này vì vậy bóc MỌI tên cỡ xuất hiện trong thuộc tính `size` rồi đòi **tất cả** phải
    // thuộc nhóm compact — chứ không nới thành "chỉ cần có chữ compact ở đâu đó". Một nhánh
    // ternary lỡ trỏ về `default` thì vẫn đỏ, mà đó chính là ca đã cắt mất chữ.
    const COMPACT = new Set(['compactPrimary', 'compactMobile', 'compactEscape']);
    const cacCo = [...owner.attrs.matchAll(/size=(?:"([^"]+)"|\{([^}]*)\})/g)].flatMap((hit) => (
      hit[1] ? [hit[1]] : [...hit[2].matchAll(/'([^']+)'/g)].map((x) => x[1])
    ));
    assert.ok(cacCo.length > 0, `Nút "${nhan}" không khai \`size\` — nó sẽ rơi về cỡ mặc định.`);
    const viPham = cacCo.filter((c) => !COMPACT.has(c));
    assert.deepEqual(viPham, [],
      `Nút "${nhan}" ở khung điện thoại PHẢI dùng một \`size\` compact ở MỌI nhánh. Đo được ở bản\n`
      + 'không có nó: font 18px + padding 28px trong một khung rộng 186px ⇒ chữ cần 209px ⇒ bị xén.\n'
      + `Cỡ không hợp lệ: ${viPham.join(', ')}`);
  }
});

test('`compactTimerActionButtonClassName` chỉ chứa lớp KHÔNG đụng `sizeMap`', () => {
  const m = /const compactTimerActionButtonClassName\s*=\s*'([^']*)'/.exec(SOURCE);
  assert.ok(m, 'Không tìm thấy hằng `compactTimerActionButtonClassName`.');
  for (const { name, re } of CONFLICTING) {
    assert.ok(!re.test(m[1]),
      `Hằng dùng chung cho mọi nút compact KHÔNG được khai ${name}: "${m[1]}"`);
  }
});
