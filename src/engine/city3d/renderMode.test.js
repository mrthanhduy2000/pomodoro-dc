/**
 * renderMode.test.js — luật chọn bộ vẽ 3D/2D.
 *
 * Bất biến quan trọng nhất: **FAIL-CLOSED**. Không đo được / chưa đo xong / máy yếu → 2D.
 * Bộ vẽ 2D luôn chạy; đoán bừa rồi màn hình đen thì không có đường cứu.
 *
 * Bất biến quan trọng thứ hai, dễ làm hỏng nhất: **thiếu thông tin KHÔNG phải bằng chứng máy yếu.**
 * Safari không có `deviceMemory` lẫn `connection` — nếu coi `undefined` là "yếu" thì mọi iPhone
 * đều rớt xuống 2D, tức là giết đúng mục tiêu mà cả nhánh 3D sinh ra để phục vụ.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  decideRenderMode,
  describeRenderMode,
  normalizeRenderMode,
  readDeviceHints,
  MIN_CORES,
  MIN_DEVICE_MEMORY_GB,
} from './renderMode.js';

const CAPABLE = { cores: 8, memoryGb: 8, saveData: false };

test('fail-closed: chưa dò xong thì KHÔNG được dựng WebGL', () => {
  assert.deepEqual(
    decideRenderMode({ preference: 'auto', hasWebGL2: null, hints: CAPABLE }),
    { mode: '2d', reason: 'probing' },
  );
  // gọi trần, không tham số nào cả — vẫn phải ra 2D chứ không được ném lỗi
  assert.equal(decideRenderMode().mode, '2d');
  assert.equal(decideRenderMode({}).mode, '2d');
});

test('fail-closed: không có WebGL2 thì luôn 2D, kể cả khi Đàm ép 3D', () => {
  for (const preference of ['auto', '3d', '2d']) {
    assert.equal(decideRenderMode({ preference, hasWebGL2: false, hints: CAPABLE }).mode, '2d');
  }
  assert.equal(decideRenderMode({ preference: '3d', hasWebGL2: false }).reason, 'no-webgl2');
});

test('lựa chọn của Đàm được tôn trọng', () => {
  assert.deepEqual(
    decideRenderMode({ preference: '2d', hasWebGL2: true, hints: CAPABLE }),
    { mode: '2d', reason: 'user-2d' },
  );
  // ép 3D thì bỏ qua mọi dấu hiệu "máy yếu" — chỉ cần WebGL2 có thật
  assert.deepEqual(
    decideRenderMode({ preference: '3d', hasWebGL2: true, hints: { cores: 1, memoryGb: 1, saveData: true } }),
    { mode: '3d', reason: 'user-3d' },
  );
});

test('auto: máy đủ khoẻ → 3D', () => {
  assert.deepEqual(
    decideRenderMode({ preference: 'auto', hasWebGL2: true, hints: CAPABLE }),
    { mode: '3d', reason: 'auto-ok' },
  );
});

test('auto: THIẾU thông tin không bị coi là máy yếu (đây là ca của iPhone/Safari)', () => {
  // Safari: không có deviceMemory, không có connection → hints toàn null/false
  assert.equal(
    decideRenderMode({
      preference: 'auto',
      hasWebGL2: true,
      hints: { cores: null, memoryGb: null, saveData: false },
    }).mode,
    '3d',
  );
  // không truyền hints gì cả cũng vậy
  assert.equal(decideRenderMode({ preference: 'auto', hasWebGL2: true }).mode, '3d');
});

test('auto: chỉ loại khi biết CHẮC là yếu', () => {
  const cases = [
    [{ ...CAPABLE, saveData: true }, 'save-data'],
    [{ ...CAPABLE, cores: MIN_CORES - 1 }, 'low-cores'],
    [{ ...CAPABLE, memoryGb: MIN_DEVICE_MEMORY_GB - 1 }, 'low-memory'],
  ];
  for (const [hints, reason] of cases) {
    assert.deepEqual(
      decideRenderMode({ preference: 'auto', hasWebGL2: true, hints }),
      { mode: '2d', reason },
    );
  }
  // đúng ngưỡng thì vẫn được chạy (ngưỡng là "dưới mức", không phải "tới mức")
  assert.equal(
    decideRenderMode({ preference: 'auto', hasWebGL2: true, hints: { ...CAPABLE, cores: MIN_CORES } }).mode,
    '3d',
  );
});

test('normalizeRenderMode: giá trị rác từ localStorage cũ → auto', () => {
  assert.equal(normalizeRenderMode('3d'), '3d');
  assert.equal(normalizeRenderMode('2d'), '2d');
  assert.equal(normalizeRenderMode('auto'), 'auto');
  for (const junk of ['4d', '', null, undefined, 0, {}, ['3d']]) {
    assert.equal(normalizeRenderMode(junk), 'auto');
  }
});

test('readDeviceHints: đọc được, và không nổ khi navigator vắng mặt', () => {
  assert.deepEqual(
    readDeviceHints({ hardwareConcurrency: 8, deviceMemory: 4, connection: { saveData: true } }),
    { cores: 8, memoryGb: 4, saveData: true },
  );
  // Safari: thiếu cả deviceMemory lẫn connection
  assert.deepEqual(
    readDeviceHints({ hardwareConcurrency: 6 }),
    { cores: 6, memoryGb: null, saveData: false },
  );
  // giá trị rác không được lọt qua thành số
  assert.deepEqual(
    readDeviceHints({ hardwareConcurrency: 'tám', deviceMemory: NaN }),
    { cores: null, memoryGb: null, saveData: false },
  );

  // Không truyền gì → dùng `navigator` sẵn có của môi trường. ⚠️ Node 22 CÓ `navigator`, nên đây
  // là hành vi thật chứ không phải nhánh chết: `readDeviceHints()` đọc được số nhân của chính máy
  // đang chạy test. Đừng "sửa" nó thành null.
  const ambient = readDeviceHints();
  assert.equal(typeof ambient, 'object');
  assert.equal(ambient.saveData, false);
});

test('readDeviceHints: môi trường KHÔNG có navigator thì trả mặc định, không ném lỗi', () => {
  // Nhánh này phục vụ môi trường lạ (worker cũ, SSR...). Node 22 có `navigator` nên phải gỡ tạm
  // mới chạm tới được — không gỡ thì bài test trên đã che mất nhánh này.
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  try {
    delete globalThis.navigator;
    assert.deepEqual(readDeviceHints(), { cores: null, memoryGb: null, saveData: false });
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor);
  }
  assert.ok(typeof navigator !== 'undefined', 'phải trả navigator về nguyên trạng cho bài test khác');
});

test('mọi lý do đều có câu giải thích cho Đàm đọc', () => {
  const reasons = new Set();
  const inputs = [
    { preference: '2d', hasWebGL2: true }, { preference: '3d', hasWebGL2: true },
    { preference: 'auto', hasWebGL2: true }, { preference: 'auto', hasWebGL2: null },
    { preference: 'auto', hasWebGL2: false },
    { preference: 'auto', hasWebGL2: true, hints: { ...CAPABLE, saveData: true } },
    { preference: 'auto', hasWebGL2: true, hints: { ...CAPABLE, cores: 1 } },
    { preference: 'auto', hasWebGL2: true, hints: { ...CAPABLE, memoryGb: 1 } },
  ];
  for (const input of inputs) reasons.add(decideRenderMode(input).reason);

  assert.equal(reasons.size, 8, 'mỗi ngã rẽ phải có mã lý do riêng, không được trùng');
  for (const reason of reasons) {
    assert.notEqual(describeRenderMode(reason), 'không rõ lý do', `thiếu câu giải thích cho "${reason}"`);
  }
});
