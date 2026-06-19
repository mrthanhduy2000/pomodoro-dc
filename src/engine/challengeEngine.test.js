import test from 'node:test';
import assert from 'node:assert/strict';

import { aggregateActiveBuffs } from './challengeEngine.js';
import {
  RELIC_EVOLUTION,
  RELIC_RESOURCE_BONUS_CAP,
  RELIC_GACHA_BONUS_CAP,
  RELIC_PITY_SEAL_CAP,
  RELIC_DISASTER_REDUCTION_CAP,
  RELIC_COMBO_WINDOW_CAP_HOURS,
  XP_SEAL_HARD_CAP,
} from './constants.js';

// ═══════════════════════════════════════════════════════════════════════════════
// BẢN CẬP NHẬT CỘNG HƯỞNG — D2: softcap theo từng loại buff cổ vật
// ═══════════════════════════════════════════════════════════════════════════════

test('aggregateActiveBuffs: clamp từng loại buff trên TỔNG đã cộng', () => {
  // Cổ vật giả với buff vượt trần ở mọi kênh.
  const relics = [{ id: 'fake_over', buff: {
    resourceBonus: 5.0, gachaBonus: 100, pitySeal: 50,
    disasterReduction: 0.80, comboWindowHours: 30,
  } }];
  const acc = aggregateActiveBuffs(1, {}, relics, 0, {});
  assert.equal(acc.resourceBonus, RELIC_RESOURCE_BONUS_CAP);
  assert.equal(acc.gachaBonus, RELIC_GACHA_BONUS_CAP);
  assert.equal(acc.pitySeal, RELIC_PITY_SEAL_CAP);
  assert.equal(acc.disasterReduction, RELIC_DISASTER_REDUCTION_CAP);
  assert.equal(acc.comboWindowHours, RELIC_COMBO_WINDOW_CAP_HOURS);
});

test('aggregateActiveBuffs: KHÔNG nerf loadout Huyền Thoại thật (no-op dưới trần)', () => {
  // Dựng FULL loadout: mọi cổ vật ở bậc 2 (Huyền Thoại), tính tổng từng kênh
  // TRỰC TIẾP từ dữ liệu RELIC_EVOLUTION (không hard-code) rồi so với kết quả aggregate.
  const allIds = Object.keys(RELIC_EVOLUTION);
  const relics = allIds.map((id) => ({ id }));
  const relicEvolutions = Object.fromEntries(allIds.map((id) => [id, 2]));

  const rawSum = { resourceBonus: 0, gachaBonus: 0, pitySeal: 0, disasterReduction: 0, comboWindowHours: 0, xpSeal: 0 };
  for (const id of allIds) {
    const buff = RELIC_EVOLUTION[id].stages[2].buff ?? {};
    for (const k of Object.keys(rawSum)) rawSum[k] += (buff[k] ?? 0);
  }

  const acc = aggregateActiveBuffs(1, {}, relics, 0, relicEvolutions);

  // Mọi kênh có trần riêng phải KHỚP tổng thô (không bị clamp) và nằm dưới trần.
  const approx = (a, b) => Math.abs(a - b) < 1e-9;
  assert.ok(approx(acc.resourceBonus, rawSum.resourceBonus), `resource ${acc.resourceBonus} vs ${rawSum.resourceBonus}`);
  assert.ok(acc.resourceBonus <= RELIC_RESOURCE_BONUS_CAP);
  assert.equal(acc.gachaBonus, rawSum.gachaBonus);
  assert.ok(acc.gachaBonus <= RELIC_GACHA_BONUS_CAP);
  assert.equal(acc.pitySeal, rawSum.pitySeal);
  assert.ok(acc.pitySeal <= RELIC_PITY_SEAL_CAP);
  assert.ok(approx(acc.disasterReduction, rawSum.disasterReduction));
  assert.ok(acc.disasterReduction <= RELIC_DISASTER_REDUCTION_CAP);
  assert.equal(acc.comboWindowHours, rawSum.comboWindowHours);
  assert.ok(acc.comboWindowHours <= RELIC_COMBO_WINDOW_CAP_HOURS);

  // xpSeal vẫn bị trần cũ (tổng thô 0.30 > 0.15 → clamp về 0.15) — hành vi sẵn có.
  assert.equal(acc.xpSeal, XP_SEAL_HARD_CAP);
  assert.ok(rawSum.xpSeal > XP_SEAL_HARD_CAP);
});
