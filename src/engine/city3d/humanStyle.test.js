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
  console.log(`[humanStyle] đã thiết kế thật: ${designed.length}/15 kỷ (${designed.join(', ')})`
    + ` · 14 kỷ còn lại trỏ preset "mocPhoThong"`);
});

test('tần số bước SUY RA, và 15 kỷ không được ra cùng một nhịp', () => {
  // ⚠️ Bài này canh đúng cái lý do `cadence` KHÔNG được khai thành trường thứ ba: nó phải luôn
  // khớp với cặp (tốc độ, sải chân). Tính lại từ hai trường ấy rồi so.
  for (let era = 1; era <= 15; era += 1) {
    const s = getHumanStyle(era);
    assert.equal(cadenceOf(s), s.walkSpeed / s.stride, `kỷ ${era}: tần số lệch khỏi hai trục gốc`);
  }
  // Kỷ 1 bước dài và chậm ⇒ nhịp THƯA nhất trong những kỷ đã thiết kế.
  assert.ok(cadenceOf(getHumanStyle(1)) < cadenceOf(HUMAN_PRESETS.mocPhoThong),
    'người đi săn phải bước thưa hơn mốc phổ thông — đó là điểm của cặp (sải dài, chậm)');
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
});
