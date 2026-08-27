/**
 * actionButtonPress.test.js — khoá ba lời hứa của `ActionButton` mà KHÔNG cổng nào khác canh.
 * ─────────────────────────────────────────────────────────────────────────────
 * Test đọc-mã-nguồn (cùng thủ pháp `actionButtonSizing.test.js` và `cityRenderers.test.js`), vì cả
 * ba kiểu hỏng dưới đây đều IM LẶNG: build xanh, lint sạch, app chạy, chỉ có cảm giác bấm là sai.
 *
 * ⚠️ VÌ SAO KHÔNG ĐO BẰNG TRÌNH DUYỆT: đã thử (2026-08-27). `scripts/shot.mjs --press` đo được nửa
 * CSS (bóng biến mất khi giữ — CÓ chạy), nhưng nửa Framer (`whileTap: { y }`) KHÔNG quan sát được
 * trong Chromium headless: nó ghi `style=""` và không dịch chuyển. Đã đo mốc nền tại commit trước
 * (bản cũ dùng `whileHover scale 1.03`) và nó hành xử **y hệt** ⇒ đây là đặc tính của môi trường
 * đo, không phải của mã. Nên bất biến quan trọng nhất — "quãng lún BẰNG chiều dày bóng" — phải
 * được khoá ở tầng MÃ NGUỒN, chỗ nó thật sự có thể trôi.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const SOURCE = await readFile(new URL('./PomodoroEngine.jsx', import.meta.url), 'utf8');

/**
 * Bỏ chú thích để không bắt nhầm ví dụ nêu trong chính lời giải thích.
 * ⚠️ Đã cắn thật (2026-08-27): bài "bóng tắt bằng độ đặc hiệu" ĐỎ vì chú thích trong `ActionButton`
 * có câu «`disabled:shadow-none` chứ KHÔNG phải `shadow-none` trần» — tức nó đọc trúng ĐÚNG cái
 * phản ví dụ mà chú thích đang cảnh báo. Y hệt cái bẫy `actionButtonSizing.test.js` đã ghi.
 */
function codeOnly(source) {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');
}

/** Cắt đúng thân hàm `ActionButton` — đừng soi nhầm 2.500 dòng còn lại của file. */
function actionButtonBody(src) {
  const at = src.indexOf('function ActionButton({ children');
  assert.notEqual(at, -1, 'Không tìm thấy `function ActionButton` — đổi tên thì sửa bài test này.');
  return codeOnly(src.slice(at));
}

test('QUÃNG LÚN PHẢI BẰNG ĐÚNG CHIỀU DÀY BÓNG — lệch một con số là hỏng cả hiệu ứng', () => {
  const body = actionButtonBody(SOURCE);

  // Mọi bóng đặc của mọi biến thể: `shadow-[0_<dày>px_0_0_var(--…)]`
  const day = [...body.matchAll(/shadow-\[0_(\d+)px_0_0_var\(/g)].map((m) => Number(m[1]));
  assert.ok(day.length >= 5, `Chỉ thấy ${day.length} bóng đặc — phải có đủ 5 biến thể.`);
  assert.equal(new Set(day).size, 1,
    `Các biến thể khai chiều dày bóng KHÁC NHAU (${[...new Set(day)].join(', ')}px). `
    + 'Chỉ có MỘT quãng lún nên chỉ được có MỘT chiều dày.');

  const tap = /whileTap=\{disabled \? undefined : \{ y: (\d+) \}\}/.exec(body);
  assert.ok(tap, 'Không đọc được `whileTap={{ y: … }}` — đổi cách viết thì sửa bài test này.');

  assert.equal(Number(tap[1]), day[0],
    `Nút lún ${tap[1]}px nhưng vạch bóng dày ${day[0]}px. Hai số này PHẢI bằng nhau: cú bấm hạ nút\n`
    + 'xuống đúng bằng chiều dày vạch rồi xoá vạch đi, nên mép dưới đứng yên và mắt đọc ra "lún\n'
    + 'chạm mặt bàn". Lệch nhau thì nút hoặc tụt hẫng xuống, hoặc lún không tới.');
});

test('MÀU NÚT PHẢI ĐỌC TỪ TOKEN — không mã màu cứng, không rẽ nhánh theo `lightTheme`', () => {
  const body = actionButtonBody(SOURCE);
  const map = /const themeMap = \{([\s\S]*?)\n {2}\};/.exec(body);
  assert.ok(map, 'Không tìm thấy `const themeMap`.');

  // Gác chạy-rỗng: regex hỏng thì mọi phép so bên dưới thành vô nghĩa.
  const variants = [...map[1].matchAll(/^\s+(\w+):/gm)].map((m) => m[1]);
  assert.deepEqual(variants, ['primary', 'accent', 'soft', 'info', 'danger'],
    `Đọc ra ${variants.length} biến thể: ${variants.join(', ')}`);

  // ⚠️ `text-white` được miễn trừ CÓ CHỦ Ý: nền `--accent` của mọi skin đều đủ tối để chữ trắng
  // đọc được, và một token "chữ trên nền nhấn" chưa tồn tại. Đây là ngoại lệ DUY NHẤT.
  const hardcoded = [...map[1].matchAll(/(?:bg|text|border|shadow)-\[?(#[0-9a-fA-F]{3,8}|rgba?\()/g)];
  assert.deepEqual(hardcoded.map((m) => m[0]), [],
    'themeMap có mã màu chốt cứng. App có 5 skin × 2 chế độ = 10 tổ hợp mà mã cứng chỉ đúng ở một\n'
    + 'vài tổ hợp — đây chính là lý do bản cũ "đổi skin không đổi được nút". Dùng `var(--…)`.');

  assert.ok(!/lightTheme/.test(body),
    'ActionButton không được rẽ nhánh theo `lightTheme`: token đã tự đổi theo CẢ skin lẫn chế độ\n'
    + 'sáng/tối rồi, nên một nhánh rẽ chỉ biết 2 trong 10 tổ hợp.');
});

test('KHÔNG PHÓNG TO KHI DI CHUỘT — `scale` làm chữ mờ đi đúng lúc đang nhìn vào nó', () => {
  const body = actionButtonBody(SOURCE);
  const hover = /whileHover=\{[^}]*\{([^}]*)\}\}/.exec(body);
  assert.ok(hover, 'Không đọc được `whileHover`.');
  assert.ok(!/scale/.test(hover[1]),
    `whileHover đang dùng \`scale\` ({${hover[1].trim()}}). Phóng to cả khối buộc trình duyệt nội\n`
    + 'suy lại chữ ⇒ chữ NHOÈ đúng lúc con trỏ đang ở trên nó. Nhấc bằng `y` thì chữ giữ nguyên nét.');
});

test('BÓNG TẮT BẰNG ĐỘ ĐẶC HIỆU, KHÔNG BẰNG THỨ TỰ BẢNG KIỂU', () => {
  const body = actionButtonBody(SOURCE);
  // ⚠️ `shadow-none` trần có cùng độ đặc hiệu (0,1,0) với `shadow-[0_4px…]`, nên ai thắng là do
  // THỨ TỰ Tailwind xếp — đo được ngày 2026-08-27 là `.shadow-none` tình cờ đứng sau nên nó thắng.
  // Một sự trùng hợp, không phải một luật: nâng phiên bản Tailwind là nút disabled có bóng lại mà
  // không có gì đỏ lên. `:disabled`/`:active` nâng lên (0,2,0) nên thắng bất kể thứ tự.
  assert.match(body, /disabled:shadow-none/,
    'Phải dùng `disabled:shadow-none` (có pseudo-class) chứ không phải `shadow-none` trần.');
  assert.match(body, /active:shadow-none/,
    'Phải dùng `active:shadow-none` để xoá vạch bóng lúc bấm giữ.');
  assert.ok(!/\bshadow-none\b/.test(body.replace(/[\w-]+:shadow-none/g, '')),
    'Còn `shadow-none` TRẦN trong ActionButton — nó thắng/thua tuỳ thứ tự bảng kiểu Tailwind.');
});

test('BÓNG KHÔNG ĐƯỢC ĐỂ FRAMER ANIMATE — nó sẽ đóng băng màu của skin cũ', () => {
  const body = actionButtonBody(SOURCE);
  // Framer animate `boxShadow` bằng cách ghi style INLINE ĐÃ RESOLVE (`var(--line-2)` → mã màu cụ
  // thể) và để lại đó. Style inline thắng mọi lớp CSS ⇒ mọi nút từng được bấm sẽ giữ nguyên bóng
  // của skin cũ sau khi đổi skin, mà không có gì đỏ lên.
  for (const prop of ['boxShadow', 'box-shadow', 'backgroundColor', 'borderColor']) {
    assert.ok(!new RegExp(`while(?:Hover|Tap)=\\{[^}]*${prop}`).test(body),
      `\`${prop}\` không được nằm trong whileHover/whileTap: Framer sẽ ghi một style inline đã\n`
      + 'resolve và bóng/màu sẽ ĐÓNG BĂNG theo skin đang bật lúc bấm. Dùng `hover:`/`active:` của CSS.');
  }
});
