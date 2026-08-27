/**
 * uiSkins.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Một skin phải có mặt ở BA nơi cùng lúc mới thật sự dùng được:
 *   1. `UI_SKINS`            — nếu thiếu, người dùng chọn xong sẽ bị đá về mặc định;
 *   2. `SKIN_OPTIONS`        — nếu thiếu, không có nút nào để chọn nó;
 *   3. `[data-skin="…"]`     — nếu thiếu, chọn được nhưng giao diện không đổi gì.
 * Ba cách hỏng ấy đều IM LẶNG: build xanh, lint sạch, không một cảnh báo nào. Bài test này là
 * thứ duy nhất bắt được, và nó hỏi TỪNG CHIỀU một chứ không hỏi tổng — hỏi tổng thì một skin
 * thừa ở nơi này bù cho một skin thiếu ở nơi kia (bài học "đối chứng phải hỏi từng chiều").
 *
 * ⚠️ Đọc `Settings.jsx` và `index.css` bằng mã nguồn chứ không import: một cái là JSX kéo theo
 * cả cây component, cái kia là CSS. Đây là cùng khuôn với `sceneGraphWiring.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { UI_SKINS, DEFAULT_UI_SKIN, normalizeUiSkin } from './uiSkins.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const doc = (rel) => readFileSync(join(SRC, rel), 'utf8');

test('mặc định phải là một skin hợp lệ, và danh sách không được có bản trùng', () => {
  assert.ok(UI_SKINS.includes(DEFAULT_UI_SKIN), `mặc định "${DEFAULT_UI_SKIN}" không nằm trong UI_SKINS`);
  assert.equal(new Set(UI_SKINS).size, UI_SKINS.length, 'UI_SKINS có giá trị trùng');
  assert.ok(UI_SKINS.length >= 2, 'phải có ít nhất 2 skin thì mới có gì để chọn');
});

test('giá trị rác luôn rơi về mặc định, giá trị hợp lệ luôn đi qua nguyên vẹn', () => {
  for (const rác of [undefined, null, '', 'editoral', 'ARCADE', 42, {}, []]) {
    assert.equal(normalizeUiSkin(rác), DEFAULT_UI_SKIN, `${JSON.stringify(rác)} phải rơi về mặc định`);
  }
  for (const skin of UI_SKINS) assert.equal(normalizeUiSkin(skin), skin);
});

test('MỖI skin phải có một mục trong SKIN_OPTIONS của màn hình Cài đặt', () => {
  const src = doc('components/Settings.jsx');
  const khối = src.match(/const SKIN_OPTIONS = \[([\s\S]*?)\n\];/);
  assert.ok(khối, 'không tìm thấy SKIN_OPTIONS trong Settings.jsx');
  const hiện = [...khối[1].matchAll(/value:\s*'([\w-]+)'/g)].map((m) => m[1]);

  // Gác chạy-rỗng: một regex hỏng sẽ cho ra mảng rỗng và mọi phép so bên dưới thành vô nghĩa.
  assert.ok(hiện.length > 0, 'không đọc được mục nào — regex hỏng, không phải Settings.jsx hỏng');

  for (const skin of UI_SKINS) {
    assert.ok(hiện.includes(skin), `skin "${skin}" hợp lệ nhưng KHÔNG có nút nào để chọn nó`);
  }
  for (const skin of hiện) {
    assert.ok(UI_SKINS.includes(skin), `Cài đặt chào mời "${skin}" nhưng chọn xong sẽ bị đá về mặc định`);
  }
  assert.equal(hiện[0], DEFAULT_UI_SKIN, 'mặc định nên đứng đầu danh sách trên màn hình');
});

test('MỖI skin phải có khối token riêng trong index.css — chọn được mà không đổi gì là hỏng im lặng', () => {
  const css = doc('index.css');
  for (const skin of UI_SKINS) {
    // ⚠️ Phải neo bằng XUỐNG DÒNG. Bản đầu của bài này hỏi `css.includes('[data-skin="x"] {')` và
    // nó XANH OAN: chuỗi ấy là CHUỖI CON của `[data-theme="dark"][data-skin="x"] {`, nên gỡ sạch
    // khối sáng vẫn qua được — phép thử ngược đã chứng minh (2026-08-27). Đúng bài học "assert
    // 'có ít nhất một chỗ' là cái phễu, không phải hàng rào".
    assert.ok(css.includes(`\n[data-skin="${skin}"] {`),
      `thiếu khối [data-skin="${skin}"] đứng riêng trong index.css (khối tối ghép đôi KHÔNG tính)`);
  }
});

test('skin nào khai `--app-bg` PHẲNG ở bản sáng thì bản tối cũng phải phẳng', () => {
  // ⚠️ Cái bẫy thật, đã suýt lọt: khối `[data-theme="dark"]` đứng SAU mọi khối skin và có ĐỘ ĐẶC
  // HIỆU BẰNG NHAU, mà nó khai `--app-bg` là một radial-gradient. Nên một skin "bỏ gradient" chỉ
  // bỏ được ở chế độ sáng, trừ khi có khối `[data-theme="dark"][data-skin="…"]` đặt lại.
  const css = readFileSync(join(SRC, 'index.css'), 'utf8');
  const khối = (sel) => {
    const i = css.indexOf(`\n${sel} {`);
    return i < 0 ? null : css.slice(i, css.indexOf('\n}', i));
  };
  const phẳng = (s) => s && /--app-bg:\s*var\(--canvas\)/.test(s);

  let đãSoi = 0;
  for (const skin of UI_SKINS) {
    const sáng = khối(`[data-skin="${skin}"]`);
    if (!phẳng(sáng)) continue;          // skin này cố ý dùng nền giàu — không thuộc câu hỏi
    đãSoi += 1;
    const tối = khối(`[data-theme="dark"][data-skin="${skin}"]`);
    assert.ok(tối, `skin "${skin}" khai nền phẳng nhưng KHÔNG có khối tối ⇒ gradient quay lại ở chế độ tối`);
    assert.ok(phẳng(tối), `skin "${skin}" phẳng ở bản sáng nhưng bản tối không đặt lại --app-bg`);
  }
  assert.ok(đãSoi > 0, 'không skin nào khai nền phẳng — bài test đang chạy rỗng, nó không canh gì cả');
});

test('MÀU nào khai ở bản sáng của một skin thì bản tối của skin ấy phải đặt lại', () => {
  // Nếu không, giá trị SÁNG rò sang chế độ tối (viền xám sáng trên thẻ đen chẳng hạn) — trừ khi
  // khối `[data-theme="dark"]` chung tình cờ cũng khai token đó. Token PHI MÀU (font, bo góc, độ
  // dày viền) thì dùng chung cả hai chế độ là ĐÚNG, nên loại chúng ra.
  //
  // ⚠️ NGOẠI LỆ CÓ THẬT, VÀ PHẢI HỎI MÃ NGUỒN CHỨ ĐỪNG CHỐT CỨNG: một vài skin bị `App.jsx` GHIM
  // theme (`inkgold` luôn chạy nền tối bất kể người dùng chọn gì). Skin như vậy KHÔNG có chế độ
  // sáng, nên khối `[data-skin="…"]` của nó chính là thiết kế tối — "màu sáng rò sang tối" là một
  // câu vô nghĩa với chúng. Đọc danh sách ghim thẳng từ `App.jsx` thì bài test không già đi khi
  // có skin thứ hai được ghim; và `deepEqual` bên dưới bắt buộc phải có người nhìn lại khi điều
  // đó xảy ra, thay vì để một skin lặng lẽ chui ra khỏi tầm canh.
  const app = doc('App.jsx');
  const ghimTheme = [...app.matchAll(/uiSkin === '([\w-]+)'\s*\?\s*'(?:dark|light)'/g)].map((m) => m[1]);
  assert.deepEqual(ghimTheme, ['inkgold'],
    `Danh sách skin bị ghim theme đã đổi (${ghimTheme.join(', ') || 'rỗng'}). Đây không phải lỗi — `
    + 'nhưng skin mới bị ghim sẽ ra khỏi tầm canh của bài test này, nên phải xem lại rồi cập nhật.');

  const css = readFileSync(join(SRC, 'index.css'), 'utf8');
  const tokens = (sel) => {
    const i = css.indexOf(`\n${sel} {`);
    if (i < 0) return null;
    const thân = css.slice(i, css.indexOf('\n}', i));
    return new Set([...thân.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1]));
  };
  const PHI_MÀU = /radius|blur|width|font|grad/;
  const darkChung = tokens('[data-theme="dark"]');
  assert.ok(darkChung && darkChung.size > 20, 'không đọc được khối [data-theme="dark"] — regex hỏng');

  let đãSoi = 0;
  for (const skin of UI_SKINS) {
    if (ghimTheme.includes(skin)) continue;   // skin một-chế-độ: không thuộc câu hỏi
    const tối = tokens(`[data-theme="dark"][data-skin="${skin}"]`);
    if (!tối) continue;                       // skin không có khối tối riêng
    đãSoi += 1;
    const sáng = tokens(`[data-skin="${skin}"]`) ?? new Set();
    const rò = [...sáng].filter((t) => !PHI_MÀU.test(t) && !tối.has(t) && !darkChung.has(t));
    assert.deepEqual(rò, [],
      `skin "${skin}": màu của bản SÁNG sống sót sang chế độ tối — ${rò.join(', ')}`);
  }
  assert.ok(đãSoi > 0, 'không skin hai-chế-độ nào có khối tối riêng — bài test đang chạy rỗng');
});
