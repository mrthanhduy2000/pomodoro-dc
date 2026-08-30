/**
 * resourceDisplay.test.js — khoá lời hứa của thanh tài nguyên sau đợt rút gọn 2026-08-27.
 * ─────────────────────────────────────────────────────────────────────────────
 * Hai nửa, và chúng canh HAI loại hỏng khác nhau:
 *   • Nửa THUẦN  — ba luật trình bày ở `resourceDisplayFormat.js` (nháy · cỡ nhãn · nhãn kỷ).
 *   • Nửa ĐỌC-MÃ — bố cục ở `ResourceDisplay.jsx`. Phải là test đọc-mã vì loại vi phạm này
 *     **build xanh · lint xanh · app vẫn chạy**: chỉ có việc thanh trên cùng lại phình ra bày
 *     đủ thứ như cũ, mà đó chính xác là điều Đàm bảo phải hết. Bộ chạy test là `node --test`
 *     thuần nên không dựng được React — đọc mã nguồn là đường DUY NHẤT canh được chỗ này.
 *
 * ⚠️ Mọi phép tìm đều chạy trên `codeOnly()`. Chú thích đầu `ResourceDisplay.jsx` có nhắc tên
 * chính những thứ đang bị canh (`--accent`, `researchRP`, `Kho`…), nên tìm trên bản có chú
 * thích thì bài test sẽ đọc trúng LỜI MÔ TẢ cái sai và tưởng là cái sai — đúng cái bẫy đã cắn
 * ở `actionButtonSizing.test.js` và `cityRenderers.test.js`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  FLASH_MS,
  LABEL_SCALE,
  NUMBER_STYLE,
  formatEraStageLabel,
  labelSizeFor,
  shouldFlashOnIncrease,
} from './resourceDisplayFormat.js';

const SOURCE = await readFile(new URL('./ResourceDisplay.jsx', import.meta.url), 'utf8');

function codeOnly(source) {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')   // {/* chú thích JSX */}
    .replace(/\/\*[\s\S]*?\*\//g, ' ')             // /* khối */
    .replace(/^\s*\/\/.*$/gm, ' ');                // // dòng
}

const CODE = codeOnly(SOURCE);

/** Vị trí panel Kho mở ra. Mọi thứ TRƯỚC đây là "luôn hiện", sau đây là "phải bấm mới thấy". */
function khoGuardIndex(code) {
  const at = code.indexOf('{khoOpen && (');
  assert.notEqual(at, -1,
    'Không tìm thấy cổng `{khoOpen && (`. Panel Kho đổi cách bật/tắt thì sửa bài test này —\n'
    + 'nhưng ĐỪNG xoá nó: không có mốc này thì cả nửa đọc-mã bên dưới mất hết ý nghĩa.');
  return at;
}

/**
 * Phần JSX **luôn hiện**: từ `return (` của `ResourceDisplay` cho tới cổng Kho.
 *
 * ⚠️ Phải chặn CẢ HAI ĐẦU. Bản đầu của bài test này chỉ cắt ở đầu sau (`code.slice(0, guard)`)
 * và lập tức ĐỎ trên một mã hoàn toàn đúng: phần đầu file chứa ĐỊNH NGHĨA của `TopStat`/`KhoRow`
 * (bên trong có `<FlashNumber>`) và khối `useGameStore` khai `researchRP` — toàn thứ không hề
 * được vẽ ra ở thanh trên cùng. Cùng họ với bài học đã ghi ở `CLAUDE.md`: hỏi `/tênHàm\(/` trên
 * mã nguồn thì dòng `function tênHàm(` tự nó là một match. Định nghĩa ≠ lời gọi; khai báo biến ≠
 * dựng ra màn hình.
 */
function alwaysVisibleJsx(code) {
  const fnAt = code.indexOf('export default function ResourceDisplay');
  assert.notEqual(fnAt, -1, 'Không tìm thấy `export default function ResourceDisplay`.');
  const returnAt = code.indexOf('return (', fnAt);
  assert.notEqual(returnAt, -1, 'Không tìm thấy `return (` của ResourceDisplay.');

  const region = code.slice(returnAt, khoGuardIndex(code));

  // Cổng chống "xanh vì không đo gì": bộ trích hỏng thì mọi assert bên dưới đều đúng một cách
  // rỗng tuếch. Vùng luôn hiện BẮT BUỘC phải chứa thẻ <section> mở đầu và nhãn "chuỗi".
  assert.ok(region.includes('<section'), 'Bộ trích hỏng: vùng luôn hiện không có thẻ <section>.');
  assert.ok(region.includes('"chuỗi"'), 'Bộ trích hỏng: vùng luôn hiện không có ô số "chuỗi".');
  return region;
}

// ── NỬA THUẦN ────────────────────────────────────────────────────────────────

test('shouldFlashOnIncrease: chỉ TĂNG mới nháy — lần dựng đầu và số giảm thì không', () => {
  assert.equal(shouldFlashOnIncrease(3, 4), true);
  assert.equal(shouldFlashOnIncrease(0, 1), true);
  assert.equal(shouldFlashOnIncrease(4, 4), false, 'không đổi thì không có gì để báo');
  assert.equal(shouldFlashOnIncrease(9, 2), false, '`--good` nghĩa là "vừa được thêm", không phải "vừa mất"');
  assert.equal(shouldFlashOnIncrease(undefined, 7), false, 'lần dựng đầu tiên KHÔNG được nháy cả thanh');
  assert.equal(shouldFlashOnIncrease(NaN, 7), false);
  assert.equal(shouldFlashOnIncrease(7, NaN), false);
  assert.equal(shouldFlashOnIncrease(null, 7), false);
});

test('labelSizeFor: nhãn nhỏ hơn con số khoảng 40%, và MỌI cỡ đang dùng đều theo đúng luật', () => {
  assert.equal(LABEL_SCALE, 0.6, 'nhỏ hơn 40% ⇒ còn lại 60%');

  // Ba cỡ số thật sự có trong `ResourceDisplay.jsx`: ô thống kê 24, số EP 18, dòng Kho 16.
  for (const numberPx of [24, 18, 16]) {
    const labelPx = labelSizeFor(numberPx);
    const shrink = 1 - labelPx / numberPx;
    assert.ok(shrink >= 0.35 && shrink <= 0.45,
      `Nhãn của số ${numberPx}px ra ${labelPx}px = nhỏ hơn ${(shrink * 100).toFixed(1)}% — ngoài dải "khoảng 40%".`);
    assert.ok(labelPx >= 10,
      `Nhãn ${labelPx}px là không đọc nổi. Muốn nhãn nhỏ hơn nữa thì phải nâng cỡ SỐ, đừng hạ nhãn.`);
  }

  assert.equal(labelSizeFor(24), 14);
  assert.equal(labelSizeFor(18), 11);
  assert.equal(labelSizeFor(16), 10);
});

test('NUMBER_STYLE là nguồn DUY NHẤT của `tabular-nums`, và nó đông cứng', () => {
  assert.equal(NUMBER_STYLE.fontVariantNumeric, 'tabular-nums');
  assert.ok(Object.isFrozen(NUMBER_STYLE),
    'Kiểu dùng chung mà sửa được thì một component có thể lặng lẽ đổi nó cho MỌI component khác.');
});

test('formatEraStageLabel: đúng dạng `Kỷ 7 · chặng 2/4`', () => {
  assert.equal(formatEraStageLabel(7, { index: 1, totalStages: 4 }), 'Kỷ 7 · chặng 2/4');
  assert.equal(formatEraStageLabel(1, { index: 0, totalStages: 3 }), 'Kỷ 1 · chặng 1/3');
  assert.equal(formatEraStageLabel(9, null), 'Kỷ 9', 'không có chặng thì đừng bịa ra "chặng 1/1"');
  assert.equal(formatEraStageLabel(9, {}), 'Kỷ 9');
});

test('FLASH_MS đúng 400ms như Đàm yêu cầu', () => {
  assert.equal(FLASH_MS, 400);
});

// ── NỬA ĐỌC-MÃ ───────────────────────────────────────────────────────────────

test('Thanh LUÔN HIỆN: tối đa BA con số, cộng đúng MỘT thanh tiến độ kỷ', () => {
  const always = alwaysVisibleJsx(CODE);

  const topStats = always.match(/<TopStat\b/g) ?? [];
  assert.ok(topStats.length >= 1,
    'Không trích được ô số nào — bộ trích hỏng thì bài test này đang xanh mà chẳng canh gì cả.');
  assert.ok(topStats.length <= 3,
    `Thanh trên cùng đang bày ${topStats.length} con số. Trần là BA (EP của chặng · chuỗi · tinh thể).\n`
    + 'Đây đúng là cái bệnh vừa chữa: mọi thứ cùng trọng lượng ⇒ không thứ nào nổi lên.\n'
    + 'Muốn thêm số thì cho vào panel Kho.');

  // Không được có con số nào đi đường vòng, né phép đếm ở trên.
  const rawFlash = always.match(/<FlashNumber\b/g) ?? [];
  assert.equal(rawFlash.length, 0,
    'Con số ở thanh trên cùng phải đi qua <TopStat> (số + nhãn nhỏ 40%). Gọi thẳng <FlashNumber>\n'
    + 'là vừa mất cái nhãn, vừa lọt khỏi trần ba số ở trên.');

  const bars = always.match(/<motion\.div/g) ?? [];
  assert.equal(bars.length, 1, 'Đúng MỘT thanh tiến độ kỷ ở vùng luôn hiện.');
});

test('Thanh tiến độ: nền `var(--line)`, phần chạy `var(--accent)`, và chiếm trọn chiều ngang', () => {
  const always = alwaysVisibleJsx(CODE);

  const track = /className="[^"]*\bw-full\b[^"]*"\s*style=\{\{\s*background:\s*'var\(--line\)'/.exec(always);
  assert.ok(track,
    'Nền thanh phải là `var(--line)` VÀ thanh phải `w-full` — nó là thứ chiếm chiều ngang lớn nhất,\n'
    + 'đó chính là cách mắt biết đọc nó trước.');

  assert.match(always, /background:\s*'var\(--accent\)'/,
    'Phần đã chạy của thanh phải là `var(--accent)` đặc — KHÔNG phải gradient (bản cũ dùng\n'
    + '`linear-gradient(--accent, --accent2)`, hai màu thì mép phải của thanh nhạt đi và mốc\n'
    + '"đang ở đâu" khó đọc hơn).');
});

test('Tài nguyên thô · tinh chế · RP: CHỈ nằm sau nút Kho, không rò lên thanh trên cùng', () => {
  const guard = khoGuardIndex(CODE);

  const mustBeInsideKho = [
    ['tài nguyên thô theo kỷ', 'resourceEntries.map'],
    ['tài nguyên tinh chế', 'refined.t2Label'],
    ['RP nghiên cứu', 'researchRP'],
    ['tên giai đoạn', 'stage?.label'],
    // ⚠️ Hỏi bằng CHỮ HIỆN RA, không bằng tên biến. Bản đầu tìm `stageStart.toLocaleString()`
    // và ĐỎ khi phép chia chặng chuyển sang engine dùng chung (`engine/eraStage.js`) —
    // trong khi dòng ấy vẫn nằm nguyên trong panel Kho, chỉ là nó đọc `eraStage?.epStart`.
    // Lời hứa của bài test này là "con số cũ vẫn xem được", không phải "biến vẫn tên cũ".
    ['khoảng EP của chặng', 'Khoảng EP của chặng:'],
  ];

  for (const [ten, needle] of mustBeInsideKho) {
    const at = CODE.indexOf(needle, guard);
    assert.notEqual(at, -1,
      `Không còn thấy ${ten} (\`${needle}\`) trong panel Kho.\n`
      + '⚠️ Luật là ĐỔI CHỖ, KHÔNG XOÁ — mọi con số cũ vẫn phải xem được đầy đủ qua nút "Kho".');
  }

  // Và không được đồng thời DỰNG RA ở vùng luôn hiện (khai biến ở đầu hàm thì không tính).
  const always = alwaysVisibleJsx(CODE);
  for (const [ten, needle] of mustBeInsideKho) {
    if (needle === 'stage?.label') continue;   // dùng trong `title` của ô EP — một gợi ý, không phải một con số
    assert.ok(!always.includes(needle),
      `${ten} (\`${needle}\`) đang hiện ở thanh trên cùng. Chỗ của nó là trong panel Kho.`);
  }
});

test('Nút Kho có mặt và khai đúng trạng thái cho trình đọc màn hình', () => {
  assert.match(CODE, /aria-expanded=\{khoOpen\}/, 'Nút mở/đóng phải khai `aria-expanded`.');
  assert.match(CODE, /aria-controls="kho-panel"/);
  assert.match(CODE, /id="kho-panel"/);
  assert.match(CODE, /Kho \{khoOpen \? '▴' : '▾'\}/, 'Nút phải tự nói nó đang mở hay đang đóng.');
});

test('Nháy khi tăng: đúng `--good`, và tôn trọng giảm chuyển động', () => {
  assert.match(CODE, /flashing \? 'var\(--good\)' : 'var\(--ink\)'/,
    'Số tăng thì nháy `var(--good)`, hết nháy thì về `var(--ink)`.');

  assert.match(CODE, /transition: enterTransition && !flashing/,
    'Bật Giảm chuyển động ⇒ đổi màu TỨC THÌ, không tween. Tín hiệu "đang bật" là\n'
    + '`enterTransition` rỗng (xem `motionPresets.js`), KHÔNG phải một `useReducedMotion()` tự gọi.\n'
    + '⚠️ Vế `!flashing` cũng bắt buộc: có tween lúc VÀO thì màu xanh phai dần vào thay vì nháy lên,\n'
    + 'tức mất đúng cái tín hiệu đang muốn gửi.');
  assert.match(CODE, /: 'none',/, 'Nhánh còn lại phải là `none` — không tween.');

  assert.match(CODE, /setTimeout\([\s\S]{0,80}?,\s*FLASH_MS\)/,
    'Thời lượng nháy phải đọc từ `FLASH_MS`, đừng viết cứng 400 ở đây (một luật một công thức).');
  assert.match(CODE, /clearTimeout\(timer\)/, 'Không dọn timer thì component tháo giữa chừng sẽ setState trên xác chết.');

  // ⚠️ Đồng hồ 400ms phải tính lại từ lần tăng MỚI NHẤT. Với một cờ `true/false` thì lần tăng
  // thứ hai là phép gán trùng giá trị ⇒ React bỏ qua ⇒ effect không chạy lại ⇒ nháy bị cắt ngắn.
  // ⚠️ Hỏi TỪNG vế một. Bản đầu của assert này viết `(?:token\) => token \+ 1|0)` — một phép
  // HOẶC, tức một cái phễu: phá vế bump thì vế `setFlashToken(0)` vẫn khớp và bài test vẫn xanh.
  // Đúng bài học đã ghi ở `CLAUDE.md`: "assert 'có ít nhất một chỗ' là cái phễu, không phải hàng rào".
  assert.match(CODE, /setFlashToken\(\(token\) => token \+ 1\)/,
    'Mỗi lần tăng phải BUMP thẻ (`token => token + 1`), không phải gán một hằng số — gán trùng\n'
    + 'giá trị thì React bỏ qua, effect không chạy lại, và cú nháy bị cắt ngắn.');
  assert.match(CODE, /setFlashToken\(0\)/, 'Phải có đường tắt nháy (đặt thẻ về 0).');
  assert.match(CODE, /\}, \[flashToken\]\);/,
    'Effect hẹn giờ phải phụ thuộc chính cái thẻ, nếu không nó không re-arm được.');

  // Phép đối chiếu cũ↔mới phải nằm ở lúc DỰNG, không nằm trong effect (`set-state-in-effect`).
  assert.match(CODE, /if \(!Object\.is\(previous, value\)\) \{/,
    'So cũ↔mới trong lúc dựng (khuôn "điều chỉnh state khi prop đổi"), không so trong `useEffect`.');
});

test('Mọi con số đi qua `NUMBER_STYLE` — không chỗ nào tự khai `tabular-nums`', () => {
  assert.ok(!/tabular-nums/.test(CODE),
    'Có chỗ đang tự khai `tabular-nums` (lớp Tailwind hoặc CSS viết tay) thay vì trải `NUMBER_STYLE`.\n'
    + 'Hai chỗ cùng phát biểu một luật thì sớm muộn một chỗ trôi — và cột số lệch đi thì\n'
    + 'không có gì đỏ lên, chỉ có số nhảy ngang trên máy Đàm.');

  const spread = CODE.match(/\.\.\.NUMBER_STYLE/g) ?? [];
  assert.ok(spread.length >= 3,
    `Chỉ ${spread.length} chỗ trải \`NUMBER_STYLE\` — mọi phần tử có chữ số (số, đơn vị, nhãn kỷ) đều phải có.`);
});

test('Chuyển động đi qua bộ ba nhịp chung, không tự gọi `useReducedMotion`', () => {
  // Luật toàn app từ 2026-08-27 (`src/lib/motionPresets.js`): đừng gõ lại `initial`/`animate` bằng
  // tay, và chỗ gọi không tự kiểm tra Giảm chuyển động. Thẻ này có ĐÚNG một ngoại lệ hợp lệ —
  // thanh tiến độ, nơi `animate` MANG BỐ CỤC (bề rộng chính LÀ tiến độ) ⇒ `useSnapMotion`.
  assert.ok(!/useReducedMotion/.test(CODE),
    'Đừng tự gọi `useReducedMotion()`. Ba nhịp tự im khi Đàm bật Giảm chuyển động, và với ngoại lệ\n'
    + 'thì `useEnterMotion()` trả object rỗng — đó đã là tín hiệu rồi. Mỗi chỗ tự kiểm tra là\n'
    + '"một luật ba mươi công thức", đúng thứ `motionPresets.js` sinh ra để xoá.');

  assert.match(CODE, /useSnapMotion\(\{/,
    'Thanh tiến độ phải đi qua `useSnapMotion` — bỏ hẳn `animate` thì bề rộng về 0 và thanh biến mất,\n'
    + 'nên nó KHÔNG dùng được `useCustomMotion`.');

  // Thời lượng/đường cong mượn nguyên nhịp `enter`. Viết cứng một con số ở đây là đẻ ra thời lượng
  // thứ sáu — đúng tình trạng mà `motionPresets.js` vừa dọn (5 thời lượng, 7 đường cong).
  assert.ok(!/duration:\s*[\d.]+/.test(CODE),
    'Không viết cứng thời lượng trong file này — mượn `enterTransition` của nhịp `enter`.');
  assert.match(CODE, /const \{ transition: enterTransition \} = useEnterMotion\(\);/);
});
