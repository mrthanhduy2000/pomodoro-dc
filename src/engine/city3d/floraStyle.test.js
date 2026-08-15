/**
 * floraStyle.test.js — khoá BẢNG thảm thực vật 15 kỷ.
 *
 * Bảng này là dữ liệu thuần, nên phần lớn lỗi của nó là lỗi GÕ NHẦM, và lỗi gõ nhầm ở đây thì im
 * lặng tuyệt đối: khai sai tên loài thì `pickFloraSpecies` lặng lẽ lùi về `broadleaf`, và kỷ ấy mất
 * bản sắc thực vật mà không có gì đỏ lên — đúng loại hỏng chỉ lộ ra khi có người ngồi soi ảnh quét.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FLORA_SPECIES, FLORA_STYLES, getFloraStyle, pickFloraSpecies,
} from './floraStyle.js';
import { ERA_STYLES } from './eraStyle.js';

const SPECIES_SET = new Set(FLORA_SPECIES);
const ERAS = Object.keys(FLORA_STYLES).map(Number);

test('đủ 15 kỷ, không thiếu không thừa', () => {
  assert.equal(ERAS.length, 15);
  for (let era = 1; era <= 15; era += 1) {
    assert.ok(FLORA_STYLES[era], `kỷ ${era} không có thảm thực vật`);
  }
});

test('mọi loài đã khai đều là loài `flora.js` dựng được', () => {
  for (const era of ERAS) {
    for (const [kind, weight] of FLORA_STYLES[era].species) {
      assert.ok(SPECIES_SET.has(kind), `kỷ ${era} khai loài lạ "${kind}"`);
      assert.ok(weight > 0, `kỷ ${era}: loài "${kind}" có trọng số ${weight} ⇒ không bao giờ mọc`);
    }
  }
});

test('`bush` KHÔNG được nằm trong bảng loài — nó là tầng cây bụi, không phải một loài để bốc', () => {
  // ⚠️ Đây là bài test của một lỗi đã xảy ra thật trong chính phiên làm Phase 8D, không phải một
  // giả định. Để `bush` chung bảng với cây thì cảnh vật loại "bụi" ở kỷ 1 ra một CÁI CÂY cao 0,94 —
  // vì bảng kỷ 1 khai `broadleaf` nặng hơn, nên 6/10 lần "bụi" bốc trúng cây. Một bảng gánh hai
  // việc thì không bao giờ tách sạch hai thứ nó đang trộn; nay `undergrowth` là trường riêng.
  for (const era of ERAS) {
    for (const [kind] of FLORA_STYLES[era].species) {
      assert.notEqual(kind, 'bush',
        `kỷ ${era} lại nhét "bush" vào bảng loài ⇒ bụi sẽ bốc trúng cây`);
    }
  }
});

test('mọi con số nằm trong dải hợp lý — sai một dấu phẩy là cả kỷ hỏng thầm lặng', () => {
  for (const era of ERAS) {
    const f = FLORA_STYLES[era];
    assert.ok(f.scale >= 0.7 && f.scale <= 1.4, `kỷ ${era}: scale ${f.scale} ngoài dải`);
    assert.ok(f.density >= 0.5 && f.density <= 1.6, `kỷ ${era}: density ${f.density} ngoài dải`);
    assert.ok(f.undergrowth >= 0 && f.undergrowth <= 0.6,
      `kỷ ${era}: undergrowth ${f.undergrowth} ngoài dải`);
    assert.ok(f.leafHue >= 40 && f.leafHue <= 160, `kỷ ${era}: leafHue ${f.leafHue} không còn là lá`);
    assert.ok(f.leafSat >= 0.15 && f.leafSat <= 0.6, `kỷ ${era}: leafSat ${f.leafSat} ngoài dải`);
    assert.ok(typeof f.note === 'string' && f.note.length > 20,
      `kỷ ${era} thiếu ghi chú — ghi chú là chỗ DUY NHẤT giải thích vì sao mấy con số này là như vậy`);
  }
});

test('ghi chú của mỗi kỷ phải nhắc đúng đất nước mà `eraStyle.js` đã khai', () => {
  // Luật đã có từ Phase 5B: mọi con số của một kỷ phải trả lời được "ở nước ấy thì trông thế nào?".
  // Không có ràng buộc này thì 15 dòng thành 15 lần chọn bừa — và chọn bừa chính là thứ đã sinh ra
  // 15 kỷ cây giống hệt nhau. Nối hai bảng lại để không bảng nào trôi khỏi bảng kia.
  for (const era of ERAS) {
    const country = ERA_STYLES[era]?.country;
    assert.ok(country, `kỷ ${era} không có \`country\` ở eraStyle.js`);
    assert.ok(FLORA_STYLES[era].note.includes(country),
      `kỷ ${era}: ghi chú thảm thực vật không nhắc "${country}" ⇒ hai bảng đã trôi khỏi nhau`);
  }
});

test('15 kỷ không được ra cùng một thảm thực vật', () => {
  // Cùng hình dạng sai với "15 kỷ cao bằng nhau" (Phase 5B) và "mái tím ở 6/15 kỷ" (Phase 3G):
  // một bảng chép-dán thì mỗi dòng vẫn hợp lệ mà cả bảng vô nghĩa.
  const fingerprints = new Set(
    ERAS.map((era) => FLORA_STYLES[era].species.map(([k]) => k).sort().join('+')),
  );
  assert.ok(fingerprints.size >= 8,
    `chỉ có ${fingerprints.size} tổ hợp loài khác nhau trên 15 kỷ — quá ít để đọc ra sự khác biệt`);

  const densities = new Set(ERAS.map((era) => FLORA_STYLES[era].density));
  assert.ok(densities.size >= 8, `chỉ có ${densities.size} mức mật độ khác nhau`);
});

test('kỷ lạ / thiếu → lùi về kỷ 1, không ném lỗi (dữ liệu cloud có thể hỏng)', () => {
  for (const bad of [undefined, null, 0, 99, -3, 'bảy', NaN]) {
    assert.equal(getFloraStyle(bad), FLORA_STYLES[1], `kỷ "${bad}" làm hỏng bảng`);
  }
});

test('chọn loài: tất định tuyệt đối, luôn hợp lệ, và không bao giờ ra `bush`', () => {
  for (const era of ERAS) {
    for (let i = 0; i < 40; i += 1) {
      const pick = pickFloraSpecies(era, `hạt-${i}`);
      assert.equal(pick, pickFloraSpecies(era, `hạt-${i}`), 'cùng hạt giống ra hai loài khác nhau');
      assert.ok(SPECIES_SET.has(pick), `kỷ ${era} ra loài lạ "${pick}"`);
      assert.notEqual(pick, 'bush', `kỷ ${era} bốc ra bụi khi đang hỏi CÂY`);
    }
  }
});

test('kỷ khai nhiều loài thì phải THẤY nhiều loài — trọng số không được nuốt hết một bên', () => {
  // Khai hai loài mà 40 lần bốc chỉ ra một loài nghĩa là trọng số lệch tới mức loài kia không tồn
  // tại. Test này bắt đúng ca đó, thứ mà kiểm "loài hợp lệ" ở trên không thấy.
  for (const era of ERAS) {
    const declared = FLORA_STYLES[era].species.length;
    if (declared < 2) continue;
    const seen = new Set();
    for (let i = 0; i < 60; i += 1) seen.add(pickFloraSpecies(era, `đếm-${i}`));
    assert.ok(seen.size >= 2,
      `kỷ ${era} khai ${declared} loài nhưng 60 lần bốc chỉ ra ${seen.size} loài`);
  }
});
