/**
 * motionPresets.test.js — khoá ba nhịp chuyển động, và khoá cả những chỗ ĐƯỢC PHÉP đứng ngoài.
 * ─────────────────────────────────────────────────────────────────────────────
 * Test ĐỌC-MÃ-NGUỒN (cùng thủ pháp `actionButtonPress.test.js` / `sceneGraphWiring.test.js`), vì ba
 * hook ở đây gọi `useReducedMotion()` — một hook React thật, không chạy được ngoài trình duyệt mà
 * không dựng cả một bộ render. Mọi kiểu hỏng dưới đây đều IM LẶNG: build xanh, lint sạch, app chạy,
 * chỉ có nhịp là sai hoặc tuỳ chọn Giảm chuyển động lặng lẽ hết tác dụng.
 *
 * ⚠️ Bài thứ tư KHÔNG đọc mã: nó chạy thẳng lò xo thật của `motion-dom` để chứng minh cấu hình
 * `reward` hợp lệ và để ĐO độ vọt lố thay vì tin vào một con số chép trong chú thích.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spring } from 'motion-dom';

const SOURCE = await readFile(new URL('./motionPresets.js', import.meta.url), 'utf8');

/** Bỏ chú thích: chúng nhắc lại đúng những con số và tên hàm mà các phép so bên dưới đang tìm. */
function codeOnly(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
}
const CODE = codeOnly(SOURCE);

/** Cắt lấy thân của một hằng số preset, ví dụ `ENTER`. */
function presetBody(name) {
  const at = CODE.indexOf(`const ${name} = Object.freeze({`);
  assert.notEqual(at, -1, `Không tìm thấy \`const ${name} = Object.freeze({…})\`.`);
  const end = CODE.indexOf('});', at);
  assert.notEqual(end, -1, `Không đọc được hết thân \`${name}\`.`);
  return CODE.slice(at, end);
}

test('ĐÚNG BA PRESET, KHÔNG HƠN — nhịp thứ tư là bước đầu quay lại tình trạng cũ', () => {
  // Preset = hook KHÔNG nhận tham số (nó tự mang sẵn một nhịp). Hai cái gác thì nhận `props`, nên
  // chúng không lọt vào phép đếm này — đúng như ý: chúng chở nhịp của người gọi, không có nhịp riêng.
  const presets = [...CODE.matchAll(/export function (use\w+)\(\)\s*\{/g)].map((m) => m[1]);
  assert.deepEqual(presets.sort(), ['useEnterMotion', 'usePressMotion', 'useRewardMotion'],
    `Đang có ${presets.length} preset: ${presets.join(', ')}.\n`
    + 'Chỉ thị gốc là ĐÚNG BA. Một nhịp mới chỉ chính đáng khi trả lời được câu: "nó thật sự là một\n'
    + 'nhịp MỚI, hay chỉ là một chỗ đáng lẽ phải dùng `enter`?" — gần như luôn là vế sau.');

  // Gác chạy-rỗng: nếu regex trên hỏng thì phép so ở trên thành vô nghĩa, nên kiểm luôn hai cái gác
  // VẪN còn đó (chúng nhận tham số nên phải khớp một khuôn khác).
  const guards = [...CODE.matchAll(/export function (use\w+)\((\w+)\)\s*\{/g)].map((m) => m[1]);
  assert.deepEqual(guards.sort(), ['useCustomMotion', 'useSnapMotion'],
    `Đọc ra ${guards.length} cái gác: ${guards.join(', ')} — regex có thể đã hỏng.`);
});

test('CẢ BA TỰ IM KHI BẬT GIẢM CHUYỂN ĐỘNG — chỗ gọi không phải tự kiểm tra', () => {
  for (const hook of ['useEnterMotion', 'usePressMotion', 'useRewardMotion']) {
    const body = new RegExp(`export function ${hook}\\(\\)\\s*\\{([^}]*)\\}`).exec(CODE);
    assert.ok(body, `Không đọc được thân \`${hook}\`.`);
    assert.match(body[1], /return guard\([A-Z]+, useReducedMotion\(\)\)/,
      `\`${hook}\` không đi qua \`guard(…, useReducedMotion())\`.\n`
      + 'Bỏ cái gác đi là mỗi chỗ gọi lại phải tự viết `reduceMotion ? undefined : …` — đúng thứ file\n'
      + 'này sinh ra để xoá, và nó sẽ hỏng lặng lẽ ở đúng những chỗ người ta quên.');
  }

  // Và `guard` phải thật sự trả về RỖNG, không phải trả về preset đã bị làm mờ đi một nửa.
  const guardBody = /function guard\(preset, reduceMotion\)\s*\{([^}]*)\}/.exec(CODE);
  assert.ok(guardBody, 'Không tìm thấy `function guard(preset, reduceMotion)`.');
  assert.match(guardBody[1], /return reduceMotion \? STILL : preset/,
    '`guard` phải trả về đúng `STILL` (object rỗng) khi Giảm chuyển động đang bật.');
  assert.match(CODE, /const STILL = Object\.freeze\(\{\}\)/,
    '`STILL` phải là một object RỖNG và đóng băng.');
});

test('BA CON SỐ CỦA BA NHỊP — lệch một con số là ba nhịp thành ba nhịp khác nhau', () => {
  const enter = presetBody('ENTER');
  assert.match(enter, /initial: \{ opacity: 0, y: 6 \}/, '`enter` phải bắt đầu ở `opacity 0, y 6`.');
  assert.match(enter, /animate: \{ opacity: 1, y: 0 \}/, '`enter` phải tới `opacity 1, y 0`.');
  assert.match(enter, /duration: 0\.18/, '`enter` phải chạy 180ms.');
  assert.match(enter, /ease: EASE/, '`enter` phải dùng đường cong chung `EASE`.');
  assert.match(CODE, /export const EASE = \[0\.22, 1, 0\.36, 1\]/, '`EASE` phải là [0.22, 1, 0.36, 1].');

  // ⚠️ `exit` KHÔNG có trong chỉ thị gốc, nhưng bỏ nó đi thì `AnimatePresence mode="wait"` tháo phần
  // tử NGAY LẬP TỨC ⇒ mỗi lần chuyển tab / đóng modal giật một cái. Khoá lại để không ai "dọn" nó đi.
  assert.match(enter, /exit: \{ opacity: 0, y: -6 \}/,
    '`enter` phải có `exit` — xem chú thích của nó, đây không phải phần thừa.');

  const press = presetBody('PRESS');
  assert.match(press, /scale: 0\.97/, '`press` phải lún tới `scale 0.97`.');
  assert.match(press, /duration: 0\.09/, '`press` phải chạy 90ms.');

  const reward = presetBody('REWARD');
  assert.match(reward, /initial: \{ scale: 0\.9 \}/, '`reward` phải bắt đầu ở `scale 0.9`.');
  assert.match(reward, /type: 'spring', stiffness: 420, damping: 18/,
    '`reward` phải là lò xo 420/18 — đúng hai con số chỉ thị gốc ghi.');
});

test('`transition` CỦA `press` PHẢI NẰM TRONG `whileTap` — để ngoài là đè mất nhịp riêng của thẻ', () => {
  const press = presetBody('PRESS');
  // Nhiều nút vừa có `whileTap` vừa có `animate` riêng (thẻ preset được nhấc lên khi đang chọn, núm
  // gạt trượt…). Nếu `press` mang một `transition` ở CẤP NGOÀI thì việc trải preset sẽ ghi đè
  // `transition` của thẻ — hỏng im lặng, không có gì đỏ lên, chỉ có nhịp của thứ khác bị đổi.
  assert.match(press, /whileTap: \{ scale: 0\.97, transition: \{/,
    '`transition` của `press` phải nằm BÊN TRONG `whileTap`.');
  assert.ok(!/^\s*transition:/m.test(press.replace(/whileTap: \{[^}]*\{[^}]*\}[^}]*\}/, '')),
    '`press` không được có `transition` ở cấp ngoài — nó sẽ đè `transition` của thẻ được trải vào.');
});

test('LÒ XO KHÔNG ĐƯỢC QUÁ HAI MỐC — đây là quả mìn chỉ nổ ở bản dev', () => {
  const reward = presetBody('REWARD');

  // framer-motion 12.38 ném thẳng lỗi khi một lò xo nhận quá hai mốc ("Only two keyframes currently
  // supported with spring and inertia animations"), và `invariant` ấy IM LẶNG ở bản production —
  // tức `animate: { scale: [0.9, 1.04, 1] }` là một quả mìn chỉ nổ ở một trong hai môi trường.
  assert.ok(!/animate:\s*\{\s*scale:\s*\[/.test(reward),
    '`reward` đang khai `scale` bằng một MẢNG mốc. Lò xo chỉ nhận HAI mốc: mảng ba mốc ném lỗi ở bản\n'
    + 'dev và im lặng ở bản production. Hình dạng "co lại → vọt quá → về 1" là HỆ QUẢ của lò xo, không\n'
    + 'phải thứ mình liệt kê ra.');

  // Và đo cho chắc, bằng chính bộ sinh lò xo của thư viện — đừng tin con số chép trong chú thích.
  const k = Number(/stiffness: (\d+)/.exec(reward)[1]);
  const c = Number(/damping: (\d+)/.exec(reward)[1]);
  const gen = spring({ keyframes: [0.9, 1], stiffness: k, damping: c, mass: 1 });
  let peak = 0;
  for (let t = 0; t <= 4000; t += 1) {
    const state = gen.next(t);
    if (state.value > peak) peak = state.value;
    if (state.done) break;
  }
  assert.ok(peak > 1, `Lò xo ${k}/${c} KHÔNG vọt quá đích (đỉnh ${peak.toFixed(4)}).\n`
    + 'Cú vọt lố chính là thứ mắt đọc ra "vừa được thưởng" — không vọt thì `reward` chỉ là một `enter` chậm.');
  assert.ok(peak < 1.15, `Lò xo ${k}/${c} vọt tới ${peak.toFixed(4)} — quá đà, thành nảy chứ không phải thưởng.`);
});

test('LỚP PHỦ MODAL CHỈ MỜ DẦN — không được mượn `y` của `enter`', () => {
  const at = CODE.indexOf('export const SCRIM_FADE = Object.freeze({');
  assert.notEqual(at, -1, 'Không tìm thấy `SCRIM_FADE`.');
  const body = CODE.slice(at, CODE.indexOf('});', at));

  assert.ok(!/\by:/.test(body),
    'SCRIM_FADE có `y`. Lớp phủ là `fixed inset-0`: dịch nó xuống là để hở một dải mép trên, và ở\n'
    + 'phần lớn modal thì thân modal là CON của lớp phủ nên nó ăn cả hai phép dịch và trôi gấp đôi.');
  assert.match(body, /duration: 0\.18, ease: EASE/,
    'Lớp phủ phải mượn ĐÚNG thời lượng và đường cong của `enter`, để nó và thân modal mở ra thành\n'
    + 'MỘT động tác chứ không phải hai.');
});
