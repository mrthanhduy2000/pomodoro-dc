/**
 * buildingGrid.test.js — canh LUẬT của lưới công trình đã xây.
 * Chạy: node --import ./scripts/register-esm-loader.mjs --test src/components/shared/buildingGrid.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildingState, summarizeBuildings, pickDefaultBuilding, BUILDING_STATE, BUILDING_LEVEL_MAX,
} from './buildingGrid.js';

test('BA TRẠNG THÁI TÁCH BẠCH — "kịch cấp" khác "thiếu tài nguyên"', () => {
  assert.equal(buildingState({ level: 1, refinedT2: 30, upgradeCost: 24 }), BUILDING_STATE.READY);
  assert.equal(buildingState({ level: 1, refinedT2: 5,  upgradeCost: 24 }), BUILDING_STATE.SHORT);
  assert.equal(buildingState({ level: 3, refinedT2: 0,  upgradeCost: 99 }), BUILDING_STATE.MAX);
  // ⚠️ KỊCH CẤP THẮNG MỌI THỨ: đủ tài nguyên chất đống mà hết cấp thì vẫn là MAX, không phải READY
  // — nếu không, ô đã trọn vẹn sẽ mang chấm màu nhấn và mời người chơi bấm một nút không tồn tại.
  assert.equal(buildingState({ level: BUILDING_LEVEL_MAX, refinedT2: 9999, upgradeCost: 1 }), BUILDING_STATE.MAX);
});

test('GIÁ ĐÚNG BẰNG SỐ ĐANG CÓ THÌ NÂNG ĐƯỢC — biên phải mở, không phải đóng', () => {
  assert.equal(buildingState({ level: 2, refinedT2: 24, upgradeCost: 24 }), BUILDING_STATE.READY);
  assert.equal(buildingState({ level: 2, refinedT2: 23, upgradeCost: 24 }), BUILDING_STATE.SHORT);
});

test('summarizeBuildings ĐẾM RIÊNG "nâng được" và "kịch cấp"', () => {
  const tiles = [
    { state: BUILDING_STATE.READY }, { state: BUILDING_STATE.READY },
    { state: BUILDING_STATE.SHORT }, { state: BUILDING_STATE.MAX },
  ];
  const t = summarizeBuildings(tiles);
  assert.deepEqual(t, { total: 4, nangDuoc: 2, kichCap: 1 });
});

test('pickDefaultBuilding CHỌN CÁI NON NHẤT TRONG SỐ NÂNG ĐƯỢC — và tất định', () => {
  const tiles = [
    { id: 'a', level: 3, state: BUILDING_STATE.MAX },
    { id: 'b', level: 2, state: BUILDING_STATE.READY },
    { id: 'c', level: 1, state: BUILDING_STATE.READY },
    { id: 'd', level: 1, state: BUILDING_STATE.SHORT },
  ];
  assert.equal(pickDefaultBuilding(tiles).id, 'c', 'cấp thấp nhất trong số nâng được');
  // Không có ô nào nâng được ⇒ ô đầu tiên, KHÔNG phải null (khung chi tiết không được trống trơn).
  const khong = tiles.map((t) => ({ ...t, state: BUILDING_STATE.SHORT }));
  assert.equal(pickDefaultBuilding(khong).id, 'a');
  assert.equal(pickDefaultBuilding([]), null);
});
