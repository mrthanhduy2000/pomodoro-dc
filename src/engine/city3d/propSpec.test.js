/**
 * propSpec.test.js — cảnh vật quanh công trình (cây, đá, ao, ruộng, đèn...).
 *
 * Đây là tầng THUẦN: mô tả hình khối bằng dữ liệu, không biết three.js tồn tại. Nhờ vậy kiểm được
 * bằng `node --test` mà không cần DOM hay WebGL.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { PROP_KINDS, buildPropSpec } from './propSpec.js';
import { PART_ROLES } from './parts.js';

const ROLE_SET = new Set(PART_ROLES);

test('mọi loại cảnh vật đều sinh ra khối hợp lệ, vai màu nằm trong danh sách đã khai', () => {
  // Vai màu lạ = khối đó tra màu ra `undefined` ⇒ hiện thành đen tuyền giữa cảnh, mà không có gì
  // báo lỗi cả. Đúng kiểu "bug tàng hình" mà cả tầng vai màu này sinh ra để chặn.
  for (const kind of PROP_KINDS) {
    const spec = buildPropSpec({ kind, era: 4, seed: `${kind}|1|1` });
    assert.ok(Array.isArray(spec.parts) && spec.parts.length > 0, `"${kind}" không sinh khối nào`);
    assert.ok(spec.height > 0, `"${kind}" cao 0 ⇒ nằm bẹp dưới mặt đất`);
    assert.ok(spec.triangles > 0, `"${kind}" không có tam giác nào`);
    for (const part of spec.parts) {
      assert.ok(ROLE_SET.has(part.role), `"${kind}" dùng vai lạ: ${part.role}`);
    }
  }
});

test('cùng một hạt giống → mô tả y hệt nhau (thành phố phải bất động qua mọi lần mở app)', () => {
  // Bất biến "bảo tàng bất động" của ADR-007: cái cây ở ô đó phải mãi mãi là cái cây đó.
  const once = buildPropSpec({ kind: 'tree', era: 9, seed: 'cây|3|5' });
  const twice = buildPropSpec({ kind: 'tree', era: 9, seed: 'cây|3|5' });
  assert.deepEqual(once, twice);
});

test('loại cảnh vật lạ → lùi về cái cây, KHÔNG ném lỗi (dữ liệu cloud có thể hỏng)', () => {
  for (const bad of [undefined, null, 'không-có-loại-này', 42]) {
    const spec = buildPropSpec({ kind: bad, era: 4, seed: 'x' });
    assert.ok(spec.parts.length > 0, `loại "${bad}" làm cảnh vật biến mất`);
    for (const part of spec.parts) assert.ok(ROLE_SET.has(part.role));
  }
});

test('mặt nước KHÔNG dùng chung vai với cửa kính — ao mà phát sáng thì thành hộp đèn', () => {
  // ⚠️ Khoá lại một lỗi chỉ ảnh chụp mới thấy: lúc 6 giờ sáng, giữa thành phố tối om nổi lên một
  // TẤM VÀNG RỰC to bằng cả ô lưới — chính là cái ao. Ban đêm mọi khối mang vai `glass` được tách
  // sang khối tự phát sáng để làm ô cửa sáng đèn, mà mặt nước lúc đó đang mượn chung vai `glass`.
  // Ghi chú đầy đủ về "vai màu không chỉ là màu, còn là hành vi" nằm ở `parts.js`.
  const spec = buildPropSpec({ kind: 'water', era: 4, seed: 'ao|1|1' });
  assert.ok(spec.parts.length > 0, 'ao không sinh ra khối nào');
  for (const part of spec.parts) {
    assert.notEqual(part.role, 'glass',
      'mặt nước lại mượn vai `glass` ⇒ ban đêm nó sẽ tự phát sáng thành hộp đèn');
  }
  assert.ok(spec.parts.some((part) => part.role === 'water'),
    'ao mà không có khối nào mang vai `water`');
});
