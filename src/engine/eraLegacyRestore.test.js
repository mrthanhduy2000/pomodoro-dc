/**
 * eraLegacyRestore.test.js — "TRÙNG TU DI SẢN" ở tầng THUẦN (ADR-012).
 * ─────────────────────────────────────────────────────────────────────────────
 * `eraLegacy.test.js` khoá phần Phase 4D (chia hàng đợi, chấm theo kỷ nào, đếm ô). File này khoá
 * phần MỚI: bản vẽ nào còn trùng tu được, và ba cái chặn giữ cho nó không bị lạm dụng.
 *
 * ⚠️ Vì sao tách file thay vì thêm vào file cũ: hai tính năng có thể bị gỡ độc lập. Phase 4D đứng
 * vững kể cả khi ADR-012 bị hoàn tác, nên bài test của nó không được lẫn với bài test của thứ có
 * thể biến mất.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { BLUEPRINT_CATALOG, LEGACY_QUEUE_SLOTS } from './constants.js';
import {
  canRestoreBlueprint,
  countLegacyCrafting,
  listRestorableBlueprints,
} from './eraLegacy.js';

const idsOf = (era) => BLUEPRINT_CATALOG[era].map((bp) => bp.id);

test('chỉ chào bản vẽ của kỷ ĐÃ ĐÓNG — kỷ đang chơi và kỷ tương lai không nằm trong danh sách', () => {
  const list = listRestorableBlueprints({ activeBook: 3, cityArchive: {}, queue: [] });
  const eras = new Set(list.map((bp) => bp.era));

  assert.deepEqual([...eras].sort((a, b) => a - b), [1, 2],
    'Chỉ kỷ 1 và 2 đã đóng khi đang ở kỷ 3.');
  assert.equal(list.length, idsOf(1).length + idsOf(2).length,
    'Bảo tàng trống thì cả 5 bản vẽ của mỗi kỷ đã đóng đều trùng tu được.');
});

test('công trình ĐÃ có trong bảo tàng thì không chào lại — không xây trùng', () => {
  const kept = idsOf(1)[0];
  const list = listRestorableBlueprints({
    activeBook: 3,
    cityArchive: { 1: { built: [kept] } },
    queue: [],
  });

  assert.ok(!list.some((bp) => bp.bpId === kept), `${kept} đã đứng trong bảo tàng kỷ 1 rồi.`);
  assert.equal(list.length, idsOf(1).length + idsOf(2).length - 1);
});

test('thứ ĐANG xây dở không bị chào lại (kể cả di sản Phase 4D)', () => {
  const building = idsOf(2)[1];
  const list = listRestorableBlueprints({
    activeBook: 3,
    cityArchive: {},
    queue: [{ bpId: building, sessionsRemaining: 4 }],
  });

  assert.ok(!list.some((bp) => bp.bpId === building));
});

test('KỶ THẤT TRUYỀN (không có entry bảo tàng) vẫn trùng tu được — đó là cả điểm của tính năng', () => {
  // Tài khoản đi qua kỷ 1–2 trước khi bảo tàng được dựng (schema 3→4): `cityArchive` không có
  // khoá nào cho chúng. Nếu bỏ qua thì hai kỷ đó vĩnh viễn là ô xám, không đường nào chạm tới.
  const list = listRestorableBlueprints({ activeBook: 3, cityArchive: undefined, queue: [] });
  assert.equal(list.filter((bp) => bp.era === 1).length, idsOf(1).length);
});

test('CHẶN 1 — mỗi lúc chỉ MỘT công trường trong bảo tàng', () => {
  const [a, b] = idsOf(1);
  const queue = [{ bpId: a, sessionsRemaining: 3 }];

  assert.equal(countLegacyCrafting(queue, 3), 1);
  assert.equal(
    canRestoreBlueprint({
      bpId: b, activeBook: 3, cityArchive: {}, queue, legacySlots: LEGACY_QUEUE_SLOTS,
    }),
    false,
    'Đang trùng tu một cái rồi thì không mở thêm cái thứ hai.',
  );
  assert.equal(
    canRestoreBlueprint({
      bpId: b, activeBook: 3, cityArchive: {}, queue: [], legacySlots: LEGACY_QUEUE_SLOTS,
    }),
    true,
    'Hàng đợi di sản trống thì khởi công được.',
  );
});

test('CHẶN 2 — công trình của kỷ ĐANG chơi không đi cửa trùng tu (nó có luật riêng)', () => {
  assert.equal(
    canRestoreBlueprint({
      bpId: idsOf(3)[0], activeBook: 3, cityArchive: {}, queue: [], legacySlots: 1,
    }),
    false,
  );
});

test('CHẶN 3 — bản vẽ của kỷ TƯƠNG LAI tuyệt đối không lọt', () => {
  assert.equal(
    canRestoreBlueprint({
      bpId: idsOf(9)[0], activeBook: 3, cityArchive: {}, queue: [], legacySlots: 1,
    }),
    false,
  );
});

test('id rác không làm ném lỗi (đây là đường vẽ màn hình)', () => {
  assert.equal(canRestoreBlueprint({ bpId: 'khong-co-that', activeBook: 3 }), false);
  assert.equal(countLegacyCrafting(null, 3), 0);
  assert.deepEqual(listRestorableBlueprints(), []);
});

test('kỷ 1 thì KHÔNG có gì để trùng tu — chưa kỷ nào đóng lại', () => {
  assert.deepEqual(listRestorableBlueprints({ activeBook: 1, cityArchive: {}, queue: [] }), []);
});
