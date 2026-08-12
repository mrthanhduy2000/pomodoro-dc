/**
 * palette3d.test.js — cầu nối màu CSS → WebGL.
 *
 * Bất biến quan trọng nhất: **không bao giờ trả về màu vô nghĩa.** Đọc CSS thất bại (token chưa
 * nạp, chuỗi lạ, `getComputedStyle` trả rỗng) là chuyện xảy ra thật lúc mount sớm — khi đó phải
 * lùi về màu dự phòng, chứ khối 3D màu đen tuyền trên nền đen là "bug tàng hình" đúng nghĩa.
 *
 * Bất biến thứ hai: bảng màu phải TỰ ĐỔI theo theme. App có 2 theme × 4 skin = 8 tổ hợp; nếu 3D
 * chốt cứng một bảng màu thì 7/8 tổ hợp sẽ sai.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FALLBACK_TOKENS,
  buildScenePalette,
  cssColorToNumber,
  luminance,
  mixRgb,
  parseCssColor,
  rgbToHexNumber,
} from './palette3d.js';

test('parseCssColor: đọc đúng các dạng getComputedStyle thật sự trả về', () => {
  assert.deepEqual(parseCssColor('#c96442'), { r: 201, g: 100, b: 66 });
  assert.deepEqual(parseCssColor('  #FFF  '), { r: 255, g: 255, b: 255 });
  assert.deepEqual(parseCssColor('rgb(1, 2, 3)'), { r: 1, g: 2, b: 3 });
  assert.deepEqual(parseCssColor('rgba(10, 20, 30, 0.5)'), { r: 10, g: 20, b: 30 });
  // Chrome/Safari đời mới trả về dạng cách nhau bằng khoảng trắng
  assert.deepEqual(parseCssColor('rgb(4 5 6)'), { r: 4, g: 5, b: 6 });
});

test('parseCssColor: đầu vào không đọc được → null, KHÔNG đoán bừa', () => {
  // `getComputedStyle` trả chuỗi rỗng khi biến CSS chưa tồn tại — ca hay gặp nhất lúc mount sớm.
  for (const junk of ['', '   ', null, undefined, 42, {}, 'chuối', '#12345', 'rgb(300,0,0)', 'var(--canvas)']) {
    assert.equal(parseCssColor(junk), null, `phải trả null cho ${JSON.stringify(junk)}`);
  }
});

test('cssColorToNumber: hỏng thì lùi về màu dự phòng, không bao giờ ra màu đen vô nghĩa', () => {
  assert.equal(cssColorToNumber('#c96442'), 0xc96442);
  assert.equal(cssColorToNumber(''), rgbToHexNumber(parseCssColor(FALLBACK_TOKENS.canvas2)));
  assert.equal(cssColorToNumber('rác', '#00ff00'), 0x00ff00);
});

test('mixRgb: kẹp tỉ lệ vào [0,1] để không sinh màu âm hay tràn', () => {
  const a = { r: 0, g: 0, b: 0 };
  const b = { r: 200, g: 100, b: 50 };
  assert.deepEqual(mixRgb(a, b, 0), a);
  assert.deepEqual(mixRgb(a, b, 1), b);
  assert.deepEqual(mixRgb(a, b, 0.5), { r: 100, g: 50, b: 25 });
  assert.deepEqual(mixRgb(a, b, -5), a, 'tỉ lệ âm phải bị kẹp');
  assert.deepEqual(mixRgb(a, b, 99), b, 'tỉ lệ tràn phải bị kẹp');
});

test('luminance: phân biệt được nền sáng với nền tối', () => {
  assert.ok(luminance({ r: 255, g: 255, b: 255 }) > 0.9);
  assert.ok(luminance({ r: 0, g: 0, b: 0 }) < 0.1);
  assert.ok(luminance(parseCssColor('#f4f2ec')) > 0.5, 'nền theme sáng phải được nhận là sáng');
  assert.ok(luminance(parseCssColor('#14110d')) < 0.5, 'nền theme tối phải được nhận là tối');
});

test('buildScenePalette: mọi màu là số hợp lệ, kể cả khi KHÔNG đọc được token nào', () => {
  const palette = buildScenePalette();          // gọi trần — mô phỏng lúc DOM chưa sẵn sàng
  const colorKeys = Object.keys(palette).filter((k) => k !== 'isDark');

  assert.ok(colorKeys.length >= 8, 'thiếu màu trong bảng');
  for (const key of colorKeys) {
    const value = palette[key];
    assert.ok(Number.isInteger(value) && value >= 0 && value <= 0xffffff,
      `"${key}" không phải màu hợp lệ: ${value}`);
  }
  assert.equal(typeof palette.isDark, 'boolean');
});

test('buildScenePalette: theme sáng và theme tối cho ra bảng màu KHÁC nhau', () => {
  const light = buildScenePalette({ tokens: { ...FALLBACK_TOKENS, canvas2: '#f4f2ec' }, eraColor: '#4ade80' });
  const dark  = buildScenePalette({ tokens: { ...FALLBACK_TOKENS, canvas2: '#14110d', ink: '#f5f3ed' }, eraColor: '#4ade80' });

  assert.equal(light.isDark, false);
  assert.equal(dark.isDark, true);
  assert.notEqual(light.background, dark.background, 'nền không đổi theo theme ⇒ sai ở 7/8 tổ hợp giao diện');
  assert.notEqual(light.ground, dark.ground);
  assert.notEqual(light.roof, dark.roof);
});

test('buildScenePalette: mỗi kỷ cho ra màu riêng (15 kỷ phải phân biệt được bằng mắt)', () => {
  const tokens = { ...FALLBACK_TOKENS };
  const roofs = new Set(
    ['#4ade80', '#c96442', '#38bdf8', '#a78bfa', '#facc15']
      .map((eraColor) => buildScenePalette({ tokens, eraColor }).roof),
  );
  assert.equal(roofs.size, 5, 'các kỷ ra cùng một màu mái ⇒ thành phố kỷ nào cũng như nhau');
});

test('buildScenePalette: nền luôn NHẠT hơn mái ở theme sáng — khối phải nổi lên khỏi nền', () => {
  const palette = buildScenePalette({ tokens: FALLBACK_TOKENS, eraColor: '#c96442' });
  const toRgb = (n) => ({ r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 });

  assert.ok(
    Math.abs(luminance(toRgb(palette.background)) - luminance(toRgb(palette.roof))) > 0.05,
    'nền và mái quá sát nhau ⇒ nhìn như một mảng phẳng, không thấy nhà đâu',
  );
});

test('buildScenePalette: eraColor rác vẫn ra bảng màu dùng được (dữ liệu cloud hỏng)', () => {
  const palette = buildScenePalette({ tokens: FALLBACK_TOKENS, eraColor: 'không-phải-màu' });
  assert.ok(Number.isInteger(palette.roof));
  assert.notEqual(palette.roof, palette.background, 'lùi về accent chứ không được sập thành một màu');
});
