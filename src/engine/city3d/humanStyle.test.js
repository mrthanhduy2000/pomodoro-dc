/**
 * humanStyle.test.js — bảng 15 kỷ con người.
 *
 * Ba lời hứa, theo mức thiệt hại:
 *   1. **ĐỦ 15 DÒNG, KHÔNG DÒNG NÀO RƠI NGẦM.** Bài học `vernacularRoof` (Phase 7C): một trường
 *      tuỳ chọn rơi về mặc định khiến 25 căn nhà đội mái vòm Duomo, và không có gì đỏ lên.
 *   2. **`country` KHOÁ VÀO `eraStyle.js`.** Không có ràng buộc ấy thì 15 dòng là 15 lần chọn bừa
 *      — đúng thứ đã sinh ra 15 kỷ cây giống hệt nhau trước Phase 8D.
 *   3. **KỶ ĐÃ THIẾT KẾ PHẢI KHÁC MỐC PHỔ THÔNG THẬT SỰ.** Một dòng chép lại preset rồi đổi một
 *      số thập phân thì đủ "có bản sắc" trên giấy mà không đổi được điểm ảnh nào.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CARRY_KINDS,
  HEAD_MATERIALS,
  GARMENT_KINDS,
  HEADGEAR_KINDS,
  HUMAN_AXES,
  HUMAN_PRESETS,
  HUMAN_STYLES,
  cadenceOf,
  designedEras,
  getHumanStyle,
  isValidHumanStyle,
} from './humanStyle.js';
import { ERA_STYLES } from './eraStyle.js';
import { buildHumanBody } from './human.js';
import { poseAt } from './humanPose.js';

test('đủ 15 kỷ, mỗi dòng hợp lệ, kỷ chưa làm phải trỏ preset CÓ TÊN', () => {
  const eras = Object.keys(HUMAN_STYLES).map(Number).sort((a, b) => a - b);
  assert.deepEqual(eras, Array.from({ length: 15 }, (_, i) => i + 1), 'phải đủ đúng 15 kỷ');

  for (const era of eras) {
    const row = HUMAN_STYLES[era];
    assert.ok(isValidHumanStyle(row), `kỷ ${era}: dòng không hợp lệ`);
    assert.ok(typeof row.note === 'string' && row.note.length > 20,
      `kỷ ${era}: thiếu ghi chú giải thích — con số không có lý do là con số tuỳ hứng`);
    if (row.preset) {
      assert.ok(Object.hasOwn(HUMAN_PRESETS, row.preset),
        `kỷ ${era}: trỏ tới preset "${row.preset}" không tồn tại`);
    }
    // Dù trỏ preset hay không, `getHumanStyle` phải trả về bộ ĐẦY ĐỦ — bên gọi không bao giờ
    // phải tự biết luật rơi về mặc định.
    const merged = getHumanStyle(era);
    for (const axis of HUMAN_AXES) {
      assert.ok(Object.hasOwn(merged, axis), `kỷ ${era}: sau khi trộn preset vẫn thiếu "${axis}"`);
    }
    assert.ok(GARMENT_KINDS.includes(merged.garment), `kỷ ${era}: trang phục lạ`);
    assert.ok(HEADGEAR_KINDS.includes(merged.headgear), `kỷ ${era}: đội đầu lạ`);
    assert.ok(CARRY_KINDS.includes(merged.carry), `kỷ ${era}: đồ mang theo lạ`);
  }
});

test('`country` khoá cứng vào eraStyle.js — hai bảng không được trôi khỏi nhau', () => {
  for (let era = 1; era <= 15; era += 1) {
    assert.equal(HUMAN_STYLES[era].country, ERA_STYLES[era].country,
      `kỷ ${era}: bảng người ghi "${HUMAN_STYLES[era].country}" còn bảng kiến trúc ghi`
      + ` "${ERA_STYLES[era].country}" — một trong hai đã trôi`);
  }
});

test('kỷ ĐÃ THIẾT KẾ khác mốc phổ thông ở ÍT NHẤT 5 trục', () => {
  const preset = HUMAN_PRESETS.mocPhoThong;
  const designed = designedEras();
  assert.ok(designed.length >= 1, 'chưa kỷ nào được thiết kế thật');

  for (const era of designed) {
    const row = getHumanStyle(era);
    const khác = HUMAN_AXES.filter((axis) => {
      if (axis === 'cloth') {
        return row.cloth.hue !== preset.cloth.hue
          || row.cloth.sat !== preset.cloth.sat
          || row.cloth.light !== preset.cloth.light;
      }
      return row[axis] !== preset[axis];
    });
    assert.ok(khác.length >= 5,
      `kỷ ${era} chỉ khác mốc phổ thông ở ${khác.length} trục (${khác.join(', ')}) — cần ≥5`);
  }

  // ⚠️ IN RA SỐ KỶ ĐÃ LÀM THẬT. "Có đủ 15 dòng" KHÔNG bằng "đã làm đủ 15 kỷ", và không in ra thì
  // phiên sau sẽ đọc bảng xanh thành "xong rồi". Xem `TECH_DEBT.md`.
  // ⚠️ SỐ KỶ CÒN LẠI PHẢI ĐƯỢC TÍNH, KHÔNG ĐƯỢC VIẾT CỨNG. Bản cũ in thẳng chữ "14 kỷ còn lại" và
  // nó vẫn in đúng như thế sau khi cả 14 kỷ đã được thiết kế xong — một dòng báo cáo nói dối.
  const conLai = 15 - designed.length;
  console.log(`[humanStyle] đã thiết kế thật: ${designed.length}/15 kỷ`
    + (conLai > 0 ? ` (${designed.join(', ')}) · ${conLai} kỷ còn lại trỏ preset "mocPhoThong"`
      : ' — ĐỦ CẢ 15 KỶ, không kỷ nào còn trỏ preset'));
});

test('tần số bước SUY RA đúng ĐƠN VỊ, và 15 kỷ không ra cùng một nhịp', () => {
  // ⚠️ BẢN CŨ CỦA BÀI NÀY LÀ MỘT BÀI TEST KHÔNG CÓ RĂNG, VÀ NÓ CHE MỘT LỖI ĐƠN VỊ THẬT.
  // Nó viết `assert.equal(cadenceOf(s), s.walkSpeed / s.stride)` — tức CHÉP LẠI đúng thân hàm rồi
  // hỏi hàm có bằng chính nó không. Một bài như thế xanh vĩnh viễn với mọi công thức, kể cả công
  // thức sai đơn vị (xem `cadenceOf`: `stride` đo bằng bội số cẳng chân nên thương số ấy KHÔNG
  // phải 1/giây, và nó xếp sai thứ tự kỷ 6 với kỷ 14).
  // ⇒ Nay ĐỐI CHIẾU CHÉO với một đường đo ĐỘC LẬP: `poseAt(...).cycle` là chiều dài một chu kỳ
  // bước tính bằng ô, do `humanPose.js` dựng ra từ hình học thật. Tần số = tốc độ / chu kỳ. Hai
  // đường phải khớp — nếu chỉ có MỘT phép tính thì không có gì để cãi nhau, tức không có gì để
  // phát hiện (bài học `TECH_DEBT #43`).
  for (let era = 1; era <= 15; era += 1) {
    const s = getHumanStyle(era);
    const body = buildHumanBody(era);
    const doiChung = s.walkSpeed / poseAt(body, 0).cycle;
    assert.ok(Math.abs(cadenceOf(s) - doiChung) < 1e-9,
      `kỷ ${era}: cadenceOf ra ${cadenceOf(s).toFixed(4)} còn đường đo qua humanPose ra`
      + ` ${doiChung.toFixed(4)} — hai công thức đã trôi khỏi nhau`);
  }

  // Kỷ 1 bước dài và chậm ⇒ nhịp THƯA nhất trong 15 kỷ; kỷ 13 (Tokyo) gấp nhất.
  const nhip = Array.from({ length: 15 }, (_, i) => ({ era: i + 1, v: cadenceOf(getHumanStyle(i + 1)) }));
  const thap = nhip.reduce((a, b) => (a.v < b.v ? a : b));
  const cao = nhip.reduce((a, b) => (a.v > b.v ? a : b));
  assert.equal(thap.era, 1, `nhịp thưa nhất phải là kỷ 1 (săn bắt), thấy kỷ ${thap.era}`);
  assert.equal(cao.era, 13, `nhịp gấp nhất phải là kỷ 13 (Tokyo), thấy kỷ ${cao.era}`);
  assert.ok(cao.v / thap.v > 2.5,
    `nhịp gấp nhất chỉ hơn nhịp thưa nhất ${(cao.v / thap.v).toFixed(2)} lần — 15 kỷ đi gần như cùng nhịp`);
  assert.ok(cadenceOf(getHumanStyle(1)) < cadenceOf(HUMAN_PRESETS.mocPhoThong),
    'người đi săn phải bước thưa hơn mốc phổ thông — đó là điểm của cặp (sải dài, chậm)');

  console.log(`[humanStyle] nhịp bước: thưa nhất kỷ ${thap.era} ${thap.v.toFixed(2)} chu kỳ/giây`
    + ` · gấp nhất kỷ ${cao.era} ${cao.v.toFixed(2)} · gấp ${(cao.v / thap.v).toFixed(2)} lần`);
});

test('dữ liệu rác không làm nổ màn hình Thành Phố', () => {
  for (const junk of [undefined, null, 0, 99, -3, 'bảy', {}]) {
    const s = getHumanStyle(junk);
    assert.ok(s && GARMENT_KINDS.includes(s.garment), `kỷ rác "${junk}" phải rơi về kỷ 1, không ném`);
  }
  assert.equal(isValidHumanStyle(null), false);
  assert.equal(isValidHumanStyle({}), false);
  assert.equal(isValidHumanStyle({ country: 'X', preset: 'khôngCóThật' }), false);
});

test('bộ kiểm TỪ CHỐI giá trị ngoài dải thay vì kẹp im lặng', () => {
  // ⚠️ Bài học `MIN_STONE` của `streetStyle.js`: một cái kẹp nuốt mất phần chênh TRONG IM LẶNG,
  // nên bốn kỷ khai bốn số lại dựng ra một kết quả và không ai biết. Ở đây phải ĐỎ, không được kẹp.
  const ok = { ...HUMAN_PRESETS.mocPhoThong, country: 'X' };
  assert.equal(isValidHumanStyle(ok), true, 'dòng mốc phổ thông phải hợp lệ');

  // Tay quay như chong chóng — cách rẻ nhất để "15 kỷ khác nhau" mà nói dối về giải phẫu.
  assert.equal(isValidHumanStyle({ ...ok, armSwing: 1.6 }), false, 'biên độ vung tay phải có TRẦN');
  // Sải chân quá 2,4 lần cẳng chân thì `asin(stride/4)` đẩy chân duỗi ngang.
  assert.equal(isValidHumanStyle({ ...ok, stride: 3.2 }), false, 'sải chân phải có trần');
  // ⚠️ VÀ SẢI CHÂN PHẢI LÀ MỘT TỈ LỆ, KHÔNG PHẢI SỐ Ô. Bản đầu khai `0.78` ô và chân duỗi ngang ở
  // cả 15 kỷ. Nhốt đúng con số hỏng cũ ấy lại, đúng luật "kèm một ĐỐI CHỨNG nhốt bộ số hỏng cũ".
  assert.equal(isValidHumanStyle({ ...ok, stride: 0.78 }), false,
    'sải chân 0,78 là con số của bản HỎNG cũ (đơn vị ô) — bộ kiểm phải còn bắt được nó');
  assert.equal(isValidHumanStyle({ ...ok, garment: 'áo dài' }), false);
  assert.equal(isValidHumanStyle({ ...ok, legShare: 0.95 }), false);
  // ⚠️ VẬT LIỆU ĐỘI ĐẦU LÀ TRƯỜNG BẮT BUỘC, KHÔNG ĐƯỢC RƠI NGẦM VỀ MẶC ĐỊNH. Nếu nó tuỳ chọn thì
  // kỷ thêm sau này sẽ lặng lẽ đội một cái nón lá màu quần — đúng khuyết tật vừa sửa.
  const { headMaterial: _bỏ, ...thiếu } = ok;
  assert.equal(isValidHumanStyle(thiếu), false, 'thiếu `headMaterial` phải bị TỪ CHỐI');
  assert.equal(isValidHumanStyle({ ...ok, headMaterial: 'nỉ' }), false, 'vật liệu lạ phải bị từ chối');
});

test('VẬT LIỆU ĐỘI ĐẦU — trục mới phải THẬT SỰ tới được hình, và chỗ nó TRƠ phải đếm được', () => {
  // ⚠️ VÌ SAO PHẢI ĐẾM CHỖ TRƠ. `headMaterial` chỉ đổi được vai màu cho bốn kiểu đội đầu bằng vải
  // (`headcloth`/`brim`/`cap`/`conical`); với `none` thì không có hộp nào, với `bun` thì vai là
  // `hair`, với `helm` thì vai là `gear`. Nghĩa là ở năm kỷ, trường này khai gì cũng KHÔNG đổi một
  // điểm ảnh nào. Một trường vừa-khai-vừa-vô-nghĩa mà không ai đếm chính là chỗ ẩn náu tốt cho một
  // lỗi: ngày nào kỷ 13 đổi sang đội mũ thì nó sẽ dùng giá trị mà chưa ai từng nhìn lại.
  const trơ = [];
  const theoVai = { straw: [], cloth2: [] };
  for (let era = 1; era <= 15; era += 1) {
    const hg = buildHumanBody(era).parts.find((x) => x.id === 'headgear');
    if (!hg || hg.role === 'hair' || hg.role === 'gear') { trơ.push(era); continue; }
    assert.ok(Object.hasOwn(theoVai, hg.role), `kỷ ${era}: vai đội đầu lạ "${hg.role}"`);
    theoVai[hg.role].push(era);
  }
  assert.deepEqual(trơ, [1, 3, 12, 13, 14],
    'danh sách kỷ mà `headMaterial` không đổi được điểm ảnh nào đã thay đổi — kiểm lại từng kỷ');

  // Trục phải dùng CẢ HAI giá trị, nếu không nó là một trục chết (bài học Phase 8D: một cơ chế
  // vẫn chạy nhưng không đổi được gì thì vẫn xanh).
  for (const vl of HEAD_MATERIALS) {
    const vai = vl === 'natural' ? 'straw' : 'cloth2';
    assert.ok(theoVai[vai].length >= 2,
      `vật liệu "${vl}" chỉ có ${theoVai[vai].length} kỷ dùng — trục đang thoái hoá về một giá trị`);
  }

  // Và vai màu phải khớp ĐÚNG thứ bảng khai — không được suy từ `kind`.
  for (const era of theoVai.straw) {
    assert.equal(getHumanStyle(era).headMaterial, 'natural', `kỷ ${era}: vai "straw" mà bảng khai "dyed"`);
  }
  for (const era of theoVai.cloth2) {
    assert.equal(getHumanStyle(era).headMaterial, 'dyed', `kỷ ${era}: vai "cloth2" mà bảng khai "natural"`);
  }
  console.log(`[humanStyle] vật liệu đội đầu: sợi mộc ${theoVai.straw.join(', ')}`
    + ` · vải nhuộm ${theoVai.cloth2.join(', ')} · trơ ${trơ.join(', ')}`);
});
