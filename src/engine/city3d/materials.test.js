import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CONTACT_FLOOR,
  CONTACT_REACH,
  FALLBACK_FAMILY,
  MATERIAL_FAMILIES,
  MATERIAL_ORDER,
  contactShade,
  materialFamilyFor,
  materialProfile,
} from './materials.js';
import { ERA_STYLES, getEraStyle } from './eraStyle.js';
import { PART_ROLES } from './parts.js';

const ERA_NUMBERS = Object.keys(ERA_STYLES).map(Number).sort((a, b) => a - b);

test('mọi họ vật liệu khai đủ ba số, và ba số đó nằm trong khoảng hợp lệ', () => {
  for (const [name, profile] of Object.entries(MATERIAL_FAMILIES)) {
    for (const key of ['roughness', 'metalness', 'sheen']) {
      assert.equal(typeof profile[key], 'number', `${name}.${key} phải là số`);
      assert.ok(profile[key] >= 0 && profile[key] <= 1, `${name}.${key} = ${profile[key]} ngoài 0..1`);
    }
  }
});

test('MATERIAL_ORDER phủ ĐÚNG các họ — đây là hợp đồng với nhà máy hình học', () => {
  // Thứ tự này là thứ `geometryFactory.js` dùng để đánh số nhóm và `sceneGraph.js` dùng để dựng
  // mảng vật liệu. Thiếu một họ ⇒ tam giác của họ đó BIẾN MẤT khỏi khối gộp mà không báo gì.
  assert.deepEqual([...MATERIAL_ORDER].sort(), Object.keys(MATERIAL_FAMILIES).sort());
  assert.equal(MATERIAL_ORDER.length, new Set(MATERIAL_ORDER).size, 'có họ bị lặp');
});

test('mọi vai màu × mọi kỷ đều tra ra một họ CÓ THẬT', () => {
  for (const era of ERA_NUMBERS) {
    const style = getEraStyle(era);
    for (const role of PART_ROLES) {
      const family = materialFamilyFor(role, style);
      assert.ok(
        Object.prototype.hasOwnProperty.call(MATERIAL_FAMILIES, family),
        `kỷ ${era} · vai "${role}" ra họ lạ "${family}"`,
      );
    }
  }
});

test('dữ liệu rác KHÔNG được làm nổ — rơi về họ mặc định', () => {
  assert.equal(materialFamilyFor('vai-không-có-thật', null), FALLBACK_FAMILY);
  assert.equal(materialFamilyFor('roof', { roofMaterial: 'nhựa-vũ-trụ' }), FALLBACK_FAMILY);
  assert.equal(materialProfile('không-có-họ-này'), MATERIAL_FAMILIES[FALLBACK_FAMILY]);
});

test('CẢ 15 KỶ PHẢI TỰ KHAI vật liệu tường và mái — im lặng rơi về mặc định là hỏng', () => {
  // ⚠️ Vì sao cần bài này dù bài trên đã kiểm "họ có thật": `materialFamilyFor` luôn trả về một họ
  // dùng được, kể cả khi kỷ đó QUÊN khai. Nghĩa là một kỷ thiếu `roofMaterial` vẫn chạy ngon lành,
  // chỉ là mái nó lặng lẽ mang bề mặt vữa trát giống 14 kỷ kia — đúng cái "một thành phố đổi màu"
  // mà cả Phase 6B lẫn yêu cầu của Đàm đều cấm. Lỗi kiểu này không đỏ ở đâu cả.
  for (const era of ERA_NUMBERS) {
    const style = ERA_STYLES[era];
    for (const key of ['wallMaterial', 'roofMaterial']) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(MATERIAL_FAMILIES, style[key]),
        `kỷ ${era} thiếu hoặc khai sai ${key} (đang là ${JSON.stringify(style[key])})`,
      );
    }
  }
});

test('15 KỶ KHÔNG ĐƯỢC DÙNG CHUNG MỘT BỀ MẶT — cặp (tường, mái) phải trải rộng', () => {
  // Yêu cầu gốc của Đàm: "không dùng cùng một thành phố rồi đổi màu". Vật liệu là một trong những
  // trục nói lên điều đó, nên nó phải đo được bằng số chứ không chỉ bằng thiện chí.
  const pairs = new Set(ERA_NUMBERS.map((era) => {
    const s = ERA_STYLES[era];
    return `${s.wallMaterial}|${s.roofMaterial}`;
  }));
  assert.ok(pairs.size >= 11, `chỉ có ${pairs.size} cặp vật liệu khác nhau trên 15 kỷ`);

  const walls = new Set(ERA_NUMBERS.map((era) => ERA_STYLES[era].wallMaterial));
  const roofs = new Set(ERA_NUMBERS.map((era) => ERA_STYLES[era].roofMaterial));
  assert.ok(walls.size >= 6, `chỉ có ${walls.size} loại vật liệu TƯỜNG`);
  assert.ok(roofs.size >= 7, `chỉ có ${roofs.size} loại vật liệu MÁI`);
});

test('ĐỐI CHỨNG: bảng "mọi kỷ chung một vật liệu" PHẢI bị hàng rào trên bắt', () => {
  // Không có bài này thì ngưỡng ở trên chỉ là ba con số ai cũng có thể hạ xuống cho tiện.
  const flat = ERA_NUMBERS.map(() => 'plaster|tile');
  assert.ok(new Set(flat).size < 11, 'hàng rào cặp vật liệu đã bị nới quá tay');
  assert.ok(new Set(ERA_NUMBERS.map(() => 'plaster')).size < 6, 'hàng rào vật liệu tường đã hỏng');
});

test('vai "dark" phải bóng GIỐNG tường của chính kỷ đó', () => {
  // Ô cửa/khe hở là một mảng tối TRÊN bức tường. Cho nó vật liệu riêng thì nó bắt sáng khác mặt
  // tường quanh nó và đọc ra như một miếng dán.
  for (const era of ERA_NUMBERS) {
    const style = getEraStyle(era);
    assert.equal(materialFamilyFor('dark', style), materialFamilyFor('wall', style), `kỷ ${era}`);
  }
});

test('bóng tiếp xúc: tối nhất ở mặt đất, hết hẳn khi đủ cao, và luôn tăng dần', () => {
  assert.equal(contactShade(0), CONTACT_FLOOR);
  assert.equal(contactShade(-3), CONTACT_FLOOR, 'dưới mặt đất vẫn là đáy, không âm');
  assert.equal(contactShade(CONTACT_REACH), 1);
  assert.equal(contactShade(99), 1);
  assert.equal(contactShade(Number.NaN), 1, 'dữ liệu hỏng không được làm tối cả công trình');

  let prev = -1;
  for (let y = 0; y <= CONTACT_REACH; y += CONTACT_REACH / 40) {
    const value = contactShade(y);
    assert.ok(value >= prev, `không đơn điệu tại y = ${y}`);
    assert.ok(value >= CONTACT_FLOOR && value <= 1, `ra ngoài khoảng tại y = ${y}`);
    prev = value;
  }
});

test('bóng tiếp xúc PHẢI đậm ở sát khe rồi nhạt nhanh, không phải tuyến tính', () => {
  // Tuyến tính thì cả tầng trệt bị ám xám đều, trông như nhà bẩn chứ không như có bóng. Ở giữa
  // quãng, đường cong phải đã hồi lên CAO HƠN hẳn mức tuyến tính.
  const mid = contactShade(CONTACT_REACH / 2);
  const linear = CONTACT_FLOOR + (1 - CONTACT_FLOOR) * 0.5;
  assert.ok(mid > linear + 0.04, `giữa quãng ra ${mid.toFixed(3)}, tuyến tính là ${linear.toFixed(3)}`);
});
