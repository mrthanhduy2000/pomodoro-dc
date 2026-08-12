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
import { DAY_PHASES, deriveDaylight } from './daylight.js';

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

/** Duyệt mọi màu trong bảng, kể cả màu nằm trong nhóm con (`roles`, `lights`, `sky2`). */
function eachColor(node, visit, path = '') {
  for (const [key, value] of Object.entries(node)) {
    if (key === 'isDark') continue;
    const here = path ? `${path}.${key}` : key;
    if (value && typeof value === 'object') eachColor(value, visit, here);
    else visit(here, value);
  }
}

test('buildScenePalette: mọi màu là số hợp lệ, kể cả khi KHÔNG đọc được token nào', () => {
  const palette = buildScenePalette();          // gọi trần — mô phỏng lúc DOM chưa sẵn sàng
  let count = 0;

  eachColor(palette, (path, value) => {
    count += 1;
    assert.ok(Number.isInteger(value) && value >= 0 && value <= 0xffffff,
      `"${path}" không phải màu hợp lệ: ${value}`);
  });

  assert.ok(count >= 20, `thiếu màu trong bảng (đếm được ${count})`);
  assert.equal(typeof palette.isDark, 'boolean');
});

test('buildScenePalette: đủ vai màu cho ngôn ngữ hình khối, không vai nào thiếu', () => {
  // Mô tả hình học nói bằng VAI ("mái", "gỗ", "vàng"); thiếu một vai thì khối mang vai đó sẽ nhận
  // `undefined` và three vẽ ra màu đen — một lỗi im lặng, chỉ lộ ra khi nhìn tận mắt đúng cái kỷ
  // có dùng vai đó. Test này bắt trước.
  const palette = buildScenePalette({ tokens: FALLBACK_TOKENS, eraColor: '#a78bfa' });
  const needed = [
    'wall', 'wall2', 'roof', 'trim', 'wood', 'stone', 'gold', 'glass', 'water', 'leaf', 'dark',
    // `skin` KHÔNG nằm trong `PART_ROLES` (không khối kiến trúc nào dùng) — nó là màu đầu cư dân,
    // dùng thẳng ở `sceneGraph.js`. Khoá ở đây vì thiếu nó thì đầu người thành màu đen mà không có
    // test nào khác bắt được.
    'skin',
  ];
  for (const role of needed) {
    assert.ok(Number.isInteger(palette.roles?.[role]), `thiếu vai màu "${role}"`);
  }
});

test('buildScenePalette: ba nguồn sáng khác nhiệt độ — nắng ẤM hơn trời', () => {
  // Đây là thứ làm cảnh 3D thôi trông như đồ hoạ máy tính: mặt hướng nắng ngả vàng, mặt khuất ngả
  // xanh. Nếu ai đó "dọn dẹp" cho ba nguồn sáng cùng màu trắng thì cảnh phẳng lại ngay mà build
  // vẫn xanh — nên phải khoá bằng test.
  const palette = buildScenePalette({ tokens: FALLBACK_TOKENS, eraColor: '#4ade80' });
  const toRgb = (n) => ({ r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 });
  const warmth = (n) => { const c = toRgb(n); return c.r - c.b; };

  assert.ok(warmth(palette.lights.sun) > warmth(palette.lights.skyDome) + 20,
    'nắng phải ấm hơn ánh trời rõ rệt');
  assert.ok(warmth(palette.lights.bounce) > warmth(palette.lights.skyDome),
    'ánh đất hắt lên phải ấm hơn ánh trời');
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

test('buildScenePalette: bầu trời KHÔNG BAO GIỜ ngả tím sen — ở mọi giờ, mọi theme, mọi kỷ', () => {
  // ⚠️ Bài này khoá lại một lỗi CHỈ NHÌN ẢNH MỚI THẤY, đọc code thì không: chân trời giữa trưa ra
  // `#e0b8c9` (hồng) và đỉnh trời lúc bình minh ra `#cf63c2` (tím sen). Nguyên nhân nằm ở phép
  // trộn: nội suy GÓC MÀU luôn đi đường ngắn trên vòng tròn màu, mà từ lam sang cam thì đường
  // ngắn chạy xuyên qua vùng tím. Nay trộn trong RGB nên luôn đi qua màu trung tính.
  //
  // "Tím sen" ở đây định nghĩa được bằng máy: đỏ và lam đều CAO hơn lục. Bầu trời thật không bao
  // giờ như vậy — trời hồng lúc hoàng hôn là đỏ > lục > lam (giảm dần đều), không phải lục trũng
  // xuống giữa. Nhờ vậy bài test bắt được cả những chặng ai đó thêm về sau.
  //
  // ⚠️ NGƯỠNG 10 CHỨ KHÔNG PHẢI 18, và con số này lấy từ chính hai màu đã gây lỗi: `#cf63c2`
  // (đỉnh trời bình minh) chấm 95 điểm — dễ bắt; nhưng `#e0b8c9` (chân trời trưa) chỉ chấm 17.
  // Để ngưỡng 18 thì bài test vẫn XANH trên đúng cái ảnh hồng đã phải sửa — tức là một cái lưới
  // thủng ngay chỗ cần vá. Màu hiện tại chấm cao nhất là −6, nên 10 vẫn còn rất rộng cửa.
  //
  // ⚠️ CHỈ XÉT NHỮNG MÀU ĐỦ SÁNG ĐỂ MẮT ĐỌC RA SẮC (kênh mạnh nhất ≥ 90). Không phải để nới tay:
  // ở theme tối lúc bình minh, chân trời ra `#483445` — chấm 17 điểm "tím" nhưng kênh mạnh nhất
  // chỉ 72, và trong ảnh chụp thật thì vùng đó KHÔNG hề đọc ra màu tím, chỉ ra nâu sẫm (màu quá
  // tối thì mắt gần như mất khả năng phân biệt sắc — cùng hiệu ứng Purkinje đã ghi ở `palette3d.js`),
  // lại còn bị quầng nắng và lớp tối góc phủ lên trên. Bắt cả những màu đó là báo nhầm, mà báo
  // nhầm thì lần sau người ta sẽ tắt bài test này đi. Hai màu đã gây lỗi thật đều rất sáng
  // (`#e0b8c9` kênh mạnh nhất 224, `#cf63c2` là 207) nên vẫn nằm gọn trong tầm bắt — đã xác minh
  // bằng cách tạm khôi phục phép trộn cũ và thấy bài test này ĐỎ.
  const toRgb = (n) => ({ r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 });
  const magenta = (n) => {
    const { r, g, b } = toRgb(n);
    if (Math.max(r, g, b) < 90) return false;
    return Math.min(r, b) - g > 10;
  };

  for (let hour = 0; hour < 24; hour += 1) {
    for (const tokens of [FALLBACK_TOKENS, { ...FALLBACK_TOKENS, canvas1: '#12100e', canvas2: '#1b1815', ink: '#f2ece1' }]) {
      for (const eraColor of ['#4ade80', '#c96442', '#38bdf8', '#a78bfa', '#b3306b', '#facc15']) {
        const p = buildScenePalette({ tokens, eraColor, daylight: deriveDaylight(hour) });
        for (const [name, value] of [
          ['chân trời', p.sky2.horizon], ['đỉnh trời', p.sky2.top], ['đèn bán cầu', p.lights.skyDome],
        ]) {
          assert.ok(!magenta(value), `${hour} giờ · kỷ ${eraColor} · ${name} ra tím sen: `
            + `#${value.toString(16).padStart(6, '0')}`);
        }
      }
    }
  }
});

test('buildScenePalette: đèn cửa sổ giữ NGUYÊN sắc nến ở mọi kỷ — lửa không đổi màu theo thời đại', () => {
  const lamps = new Set(
    ['#4ade80', '#38bdf8', '#a78bfa', '#b3306b'].map((eraColor) => (
      buildScenePalette({ tokens: FALLBACK_TOKENS, eraColor, daylight: deriveDaylight(22) }).lights.lamp
    )),
  );
  assert.equal(lamps.size, 1, 'màu đèn trong nhà đổi theo kỷ ⇒ có chỗ lỡ pha sắc kỷ vào lửa');
});

// ─────────────────────────────────────────────────────────────────────────────
// BẢN QUÉT ĐỦ 15 KỶ × 6 CHẶNG (2026-08-12) — những gì mắt bắt được, nay máy tự canh.
//
// ⚠️ VÌ SAO PHẢI DÙNG ĐÚNG 15 MÀU KỶ THẬT, KHÔNG PHẢI VÀI MÀU MẪU: bốn lỗi dưới đây đều là lỗi
// "chỉ sai ở một số kỷ". Bộ mẫu 5–6 màu cũ đã chạy XANH suốt trong khi 6/15 kỷ đang có mái tím sen
// và 7/15 kỷ có mặt đất màu cỏ nhân tạo trên production. Một cái lưới bỏ sót hai phần ba số ô thì
// không phải lưới. Danh sách này lấy y nguyên `ERA_METADATA[era].accentColor`.
// ─────────────────────────────────────────────────────────────────────────────

/** 15 `accentColor` thật, chép từ `ERA_METADATA` (engine/constants.js) theo thứ tự kỷ 1→15. */
const ERA_ACCENTS = [
  '#4ade80', '#84cc16', '#facc15', '#fb923c', '#94a3b8',
  '#a78bfa', '#c084fc', '#38bdf8', '#a3e635', '#f87171',
  '#e879f9', '#64748b', '#22d3ee', '#34d399', '#818cf8',
];

const LIGHT_TOKENS = { ...FALLBACK_TOKENS };
const DARK_TOKENS = { ...FALLBACK_TOKENS, canvas2: '#1d1c1a', ink: '#f2efe6', line: '#33312d' };

/** Tách một màu số thành `{r,g,b}` + góc màu + độ tươi — dạng dùng đi dùng lại ở các bài dưới. */
function readColor(n) {
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = (((g - b) / delta) % 6) * 60;
    else if (max === g) h = ((b - r) / delta + 2) * 60;
    else h = ((r - g) / delta + 4) * 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2 / 255;
  const s = delta === 0 ? 0 : (delta / 255) / (1 - Math.abs(2 * l - 1));
  return { r, g, b, h, s, l, hex: `#${n.toString(16).padStart(6, '0')}` };
}

test('KHÔNG một vai màu nào ra TÍM SEN RỰC, ở bất kỳ kỷ nào × bất kỳ giờ nào × cả hai theme', () => {
  // ⚠️ ĐÂY LÀ BÀI QUAN TRỌNG NHẤT FILE. Cùng cái bẫy "xoay góc màu đi đường ngắn" đã cắn dự án
  // BỐN lần ở bốn vai màu khác nhau (bầu trời → đèn bán cầu → MÁI NHÀ → ÁNH TRĂNG), mỗi lần lại
  // được vá riêng lẻ đúng chỗ vừa phát hiện. Bài test cũ chỉ canh ba màu bầu trời, nên khi lỗi mọc
  // lại ở mái nhà thì nó không hề biết — 6/15 kỷ có mái tím sen rực chạy trên production mà toàn
  // bộ test vẫn xanh.
  //
  // Nay canh MỌI màu trong bảng. Đây mới đúng là bất biến thật: **không có đầu vào nào của
  // `buildScenePalette` được phép đẻ ra màu tím sen**, dù ai thêm vai màu mới hay kỷ mới về sau.
  //
  // Vào dải tím = đỏ và lam đều CAO hơn lục (chênh > 10), và chỉ xét màu đủ sáng để mắt đọc ra sắc
  // (kênh mạnh nhất ≥ 90) — xem lý do đầy đủ ở bài "bầu trời KHÔNG bao giờ ngả tím sen" phía trên.
  //
  // ⚠️ RANH GIỚI Ở ĐỘ TƯƠI, KHÔNG Ở GÓC MÀU — và chỗ này phải nói cho rõ, vì bản đầu của chính bài
  // test này đã cấm nhầm. Cấm sạch mọi thứ ngả tím thì nghe dứt khoát, nhưng nó chặn luôn màu
  // **mận chín / rượu vang** — mà đó là một sắc mái CÓ THẬT và đẹp (madder lake, caput mortuum
  // trong bảng màu Phục Hưng), nay là mái của kỷ 11. Cấm nó đi là làm nghèo bức tranh để cho bài
  // test dễ viết.
  //
  // Thứ thật sự sai không phải "ngả tím" mà là **tím RỰC**: sắc tố đất thì luôn xỉn, còn một mảng
  // hồng cánh sen tươi rói thì mắt đọc ra nhựa dẻo, không đọc ra vật liệu. Con số lấy từ chính dữ
  // liệu đo được, không phải chọn cho vừa: 6 mái hỏng của bản cũ đều ở độ tươi ~0,50; mái tím đậm
  // nhất còn lại sau khi sửa là `#90425a` ở 0,37. Ngưỡng 0,42 nằm giữa hai vùng đó — đã xác minh
  // bằng cách tạm khôi phục phép trộn cũ và thấy bài test này ĐỎ ngay ở kỷ đầu tiên.
  //
  // ⚠️ BẦU TRỜI THÌ VẪN CẤM TUYỆT ĐỐI, không có ngoại lệ độ tươi nào — bài "bầu trời KHÔNG bao giờ
  // ngả tím sen" phía trên lo việc đó và phải giữ nguyên độ ngặt: mái mận chín thì có thật, chứ
  // bầu trời mận chín thì không.
  const MAX_MAGENTA_CHROMA = 0.42;
  const garish = (c) => (
    Math.max(c.r, c.g, c.b) >= 90 && Math.min(c.r, c.b) - c.g > 10 && c.s > MAX_MAGENTA_CHROMA
  );

  let checked = 0;
  for (const eraColor of ERA_ACCENTS) {
    for (const tokens of [LIGHT_TOKENS, DARK_TOKENS]) {
      for (let hour = 0; hour < 24; hour += 1) {
        const palette = buildScenePalette({ tokens, eraColor, daylight: deriveDaylight(hour) });
        eachColor(palette, (path, value) => {
          checked += 1;
          const c = readColor(value);
          assert.ok(!garish(c), `kỷ ${eraColor} · ${hour} giờ · "${path}" ra tím sen rực: `
            + `${c.hex} (góc màu ${Math.round(c.h)}°, tươi ${c.s.toFixed(2)})`);
        });
      }
    }
  }
  assert.ok(checked > 10000, `quét quá ít màu (${checked}) — có phải bảng màu bị rút gọn không?`);
});

test('MẶT ĐẤT của cả 15 kỷ nằm trong dải ĐẤT, không kỷ nào ra màu cỏ nhân tạo', () => {
  // ⚠️ Lỗi này chỉ hiện ra khi xếp 15 kỷ CẠNH NHAU, nên nó sống sót qua nhiều lần soi từng ảnh một.
  // Nguyên nhân là phép xoay góc màu LẬT HƯỚNG ở mốc 180°: mặt đất neo 78° pha sắc kỷ, kỷ họ lam
  // (5, 6, 8, 12, 13, 14, 15) bị đẩy LÊN 102–117° — diệp lục — còn kỷ 7 và 11, cũng họ lam-tím,
  // lại bị đẩy XUỐNG 41–46° ra đất nâu. Cùng một họ màu, hai kết quả ngược nhau.
  //
  // Nền một bức phong cảnh cổ điển là ô-liu / đất son / đất nung: góc màu 25–85°. Trên 90° là bắt
  // đầu vào vùng diệp lục — thứ đọc ra "sân bóng đá" chứ không ra "đất". Độ tươi cũng phải ghìm:
  // đất thật là màu XỈN.
  for (const eraColor of ERA_ACCENTS) {
    const palette = buildScenePalette({
      tokens: LIGHT_TOKENS, eraColor, daylight: deriveDaylight(12),
    });
    for (const shade of palette.groundShades) {
      const c = readColor(shade);
      assert.ok(c.h >= 25 && c.h <= 88,
        `kỷ ${eraColor}: mặt đất ở góc màu ${Math.round(c.h)}° (${c.hex}) — ngoài dải đất 25–88°`);
      assert.ok(c.s <= 0.30,
        `kỷ ${eraColor}: mặt đất tươi ${c.s.toFixed(2)} (${c.hex}) — đất thật phải xỉn hơn`);
    }
  }
});

test('MẶT NƯỚC đổi theo giờ — ao là bầu trời nhìn từ dưới lên, không phải miếng dán màu lam', () => {
  // Bản quét bắt được: nước ra ĐÚNG MỘT MÀU `#7f9ebd` ở cả 6h, 8h, 12h, 15h lẫn 18h, trong khi
  // trời quanh nó đổi từ hồng sang lam sang cam. Mắt vì thế không đọc ra "mặt nước".
  const waters = [6, 8, 12, 15, 18, 22].map((hour) => (
    buildScenePalette({ tokens: LIGHT_TOKENS, eraColor: '#c084fc', daylight: deriveDaylight(hour) }).roles.water
  ));
  assert.equal(new Set(waters).size, waters.length,
    `mặt nước lặp màu giữa các chặng: ${waters.map((n) => `#${n.toString(16)}`).join(' ')}`);

  // Và phải đổi ĐỦ ĐỂ NHÌN RA, không phải nhích một hai đơn vị cho qua bài test: bình minh nước
  // phải ẤM hơn giữa trưa rõ rệt (ao bắt lửa mảng cam hồng của chân trời).
  const warmth = (n) => { const c = readColor(n); return c.r - c.b; };
  const dawn = buildScenePalette({ tokens: LIGHT_TOKENS, eraColor: '#c084fc', daylight: deriveDaylight(6) }).roles.water;
  const noon = buildScenePalette({ tokens: LIGHT_TOKENS, eraColor: '#c084fc', daylight: deriveDaylight(12) }).roles.water;
  assert.ok(warmth(dawn) > warmth(noon) + 8,
    `nước bình minh (${readColor(dawn).hex}) không ấm hơn nước giữa trưa (${readColor(noon).hex}) đủ để thấy`);
});

test('ÁNH TRĂNG là bạc lạnh, KHÔNG phải xanh lục', () => {
  // Đo được `#93beb4` — xanh bạc hà — vì `mixHue(48, 218, 0.7)` đi đường vòng qua vùng lục. Lỗi
  // này sống sót lâu vì nó chỉ xuất hiện lúc 19–4 giờ, đúng quãng ít ai ngồi soi ảnh chụp thử.
  const moon = readColor(buildScenePalette({
    tokens: LIGHT_TOKENS, eraColor: '#4ade80', daylight: deriveDaylight(22),
  }).lights.sun);
  assert.ok(!(moon.g > moon.r && moon.g > moon.b),
    `ánh trăng ra ${moon.hex} — kênh lục trội hơn cả đỏ lẫn lam, tức trăng màu xanh lục`);
  assert.ok(moon.b >= moon.r, `ánh trăng ra ${moon.hex} — trăng phải LẠNH (lam ≥ đỏ)`);
});

test('THÀNH PHỐ LÀ Ô CỬA SỔ: để theme tối thì giữa trưa vẫn phải sáng như giữa trưa', () => {
  // ⚠️ Lỗi NẶNG NHẤT bản quét phơi ra, và nó nằm ngay trong một dòng tưởng đã đúng:
  // `isDark = luminance(base) < 0.5 || nightByClock` mới lo được MỘT chiều (theme sáng lúc nửa đêm
  // ⇒ cảnh tối đi). Chiều ngược lại thì hỏng hoàn toàn — cả 15 kỷ ở cột 12 giờ của bảng quét theme
  // tối đều ra một mảng đen kịt, không đọc nổi hình khối. Người để theme tối ban ngày thì vĩnh
  // viễn không bao giờ thấy thành phố của mình.
  //
  // Cảnh nhìn qua cửa sổ không tối đi vì ta sơn tường phòng màu đen.
  const lum = (n) => { const c = readColor(n); return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255; };

  for (const tokens of [LIGHT_TOKENS, DARK_TOKENS]) {
    const noon = buildScenePalette({ tokens, eraColor: '#c084fc', daylight: deriveDaylight(12) });
    const night = buildScenePalette({ tokens, eraColor: '#c084fc', daylight: deriveDaylight(22) });
    assert.equal(noon.isDark, false, 'giữa trưa mà bảng màu tự nhận là trời tối');
    assert.equal(night.isDark, true, 'nửa đêm mà bảng màu tự nhận là trời sáng');
    assert.ok(lum(noon.groundShades[0]) > lum(night.groundShades[0]) * 1.6,
      `mặt đất giữa trưa (${readColor(noon.groundShades[0]).hex}) không sáng hơn nửa đêm `
      + `(${readColor(night.groundShades[0]).hex}) đủ nhiều`);
  }

  // Nhưng KHÔNG truyền `daylight` (bảo tàng, và mọi chỗ gọi cũ) thì vẫn theo theme y như trước —
  // đây là đường lùi giữ cho các bài test và các màn hình khác không đổi kết quả.
  assert.equal(buildScenePalette({ tokens: DARK_TOKENS, eraColor: '#c084fc' }).isDark, true);
  assert.equal(buildScenePalette({ tokens: LIGHT_TOKENS, eraColor: '#c084fc' }).isDark, false);
});

test('ĐÈN CỬA SỔ mờ dần khi trời sáng lên — đèn không nhận ánh sáng cảnh nên phải tự biết chừng', () => {
  // ⚠️ Ô cửa sáng vẽ bằng vật liệu KHÔNG nhận ánh sáng, nên nếu để một giá trị cố định thì nó sáng
  // y hệt nhau lúc 6 giờ sáng và lúc 10 giờ đêm. Trên nền trời đã hửng thì đó không còn là "trong
  // nhà có đèn" mà là vệt vàng chói át cả công trình — kỷ 14 và 15 ở cột bình minh của bản quét cũ
  // trông như đang cháy. Cái đổi ngoài đời không phải bóng đèn, mà là TƯƠNG QUAN với xung quanh.
  const lit = (hour) => readColor(buildScenePalette({
    tokens: LIGHT_TOKENS, eraColor: '#4ade80', daylight: deriveDaylight(hour),
  }).roles.glassLit).l;

  assert.ok(lit(22) > lit(18), 'đêm sâu phải sáng đèn hơn chạng vạng');
  assert.ok(lit(18) > lit(6), 'chạng vạng phải sáng đèn hơn rạng sáng');

  // Nhưng KHÔNG được tắt hẳn: chặng nào bật cửa sổ thì cửa sổ đó vẫn phải đọc ra là đèn.
  assert.ok(lit(6) > 0.35, `rạng sáng đèn cửa sổ mờ quá (${lit(6).toFixed(2)}) — không còn ra đèn`);

  // Sắc NẾN giữ nguyên ở mọi chặng — chỉ độ sáng đổi. Lửa cháy màu gì thì giờ nào cũng màu đó.
  const hues = [6, 18, 22].map((h) => Math.round(readColor(buildScenePalette({
    tokens: LIGHT_TOKENS, eraColor: '#4ade80', daylight: deriveDaylight(h),
  }).roles.glassLit).h));
  assert.equal(new Set(hues).size, 1, `sắc đèn đổi theo giờ: ${hues.join(' / ')}`);
});
