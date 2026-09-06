import test from 'node:test';
import assert from 'node:assert/strict';

import { withCanonicalCrisisText, findEraCrisisById, aggregateActiveBuffs } from './challengeEngine.js';
import {
  RELIC_EVOLUTION,
  RELIC_RESOURCE_BONUS_CAP,
  RELIC_GACHA_BONUS_CAP,
  RELIC_PITY_SEAL_CAP,
  RELIC_DISASTER_REDUCTION_CAP,
  RELIC_COMBO_WINDOW_CAP_HOURS,
  RELIC_EP_BONUS_CAP,
  RANK_SYSTEM,
  RELIC_EXP_BONUS_CAP,
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

  // ADR-069: hai trục mới (epBonus · expBonus) cũng phải là lưới an toàn — cộng vào cùng phép kiểm.
  const rawSum = { resourceBonus: 0, gachaBonus: 0, pitySeal: 0, disasterReduction: 0, comboWindowHours: 0, xpSeal: 0, epBonus: 0, expBonus: 0 };
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
  // Hai trục này còn nhận thêm passiveBuff của bậc đang đứng (kỷ 1 · bậc 0 = expBonus) — trừ phần ấy ra
  // rồi mới so với tổng di vật, và cả tổng gộp vẫn phải nằm dưới trần.
  const bac0 = RANK_SYSTEM[1].ranks[0].passiveBuff;
  assert.ok(approx(acc.epBonus - (bac0.epBonus ?? 0), rawSum.epBonus), `ep ${acc.epBonus} vs ${rawSum.epBonus}`);
  assert.ok(acc.epBonus <= RELIC_EP_BONUS_CAP);
  assert.ok(approx(acc.expBonus - (bac0.expBonus ?? 0), rawSum.expBonus), `exp ${acc.expBonus} vs ${rawSum.expBonus}`);
  assert.ok(acc.expBonus <= RELIC_EXP_BONUS_CAP);

  // xpSeal vẫn bị trần cũ (tổng thô 0.30 > 0.15 → clamp về 0.15) — hành vi sẵn có.
  assert.equal(acc.xpSeal, XP_SEAL_HARD_CAP);
  assert.ok(rawSum.xpSeal > XP_SEAL_HARD_CAP);
});

// ─── ADR-071: chữ của khủng hoảng kỷ ĐỌC LẠI TỪ BẢNG lúc nạp save ───────────────────────────
// Cùng luật với di vật (`withCanonicalRelicText`) và nhiệm vụ (`normalizeMissionTemplate`): save chỉ
// được tin ở `crisisId` + số tiến độ; mọi câu chữ là bản chép của `ERA_CRISES` và sẽ hoá cũ khi bảng đổi.
test('withCanonicalCrisisText: chữ cũ trong save được thay bằng chữ của bảng, SỐ tiến độ/luật giữ nguyên', () => {
  const canon = findEraCrisisById('ky_bang_ha');
  assert.ok(canon, 'ERA_CRISES phải còn khủng hoảng kỷ 1');
  const cu = {
    active: true, crisisId: 'ky_bang_ha', name: 'Tên cũ', icon: '❄', description: 'mô tả cũ',
    sacrificeOption: { label: 'cũ', description: 'cũ', icon: 'x', resourceLoss: 0.4 },
    challengeOption: { label: 'cũ', description: 'cũ', icon: 'x', sessions: 9, minMinutes: 99, windowHours: 7 },
    challengeSessionsRequired: 9, challengeMinMinutes: 99, challengeSessionsDone: 2, passed: false,
  };
  const moi = withCanonicalCrisisText(cu);
  assert.equal(moi.name, canon.name);
  assert.equal(moi.icon, canon.icon);
  assert.equal(moi.description, canon.description);
  assert.equal(moi.challengeOption.label, canon.challengeOption.label);
  assert.equal(moi.sacrificeOption.description, canon.sacrificeOption.description);
  // Luật của thử thách ĐANG chạy không được đổi giữa chừng
  assert.equal(moi.challengeOption.sessions, 9);
  assert.equal(moi.challengeOption.minMinutes, 99);
  assert.equal(moi.challengeOption.windowHours, 7);
  assert.equal(moi.challengeSessionsRequired, 9);
  assert.equal(moi.challengeSessionsDone, 2);
});

test('withCanonicalCrisisText: id lạ hoặc trạng thái mặc định (crisisId null) ⇒ trả nguyên, không xoá dữ liệu', () => {
  const la = { active: true, crisisId: 'khong_co_trong_bang', name: 'Giữ', challengeSessionsDone: 1 };
  assert.deepEqual(withCanonicalCrisisText(la), la);
  const macDinh = { active: false, crisisId: null, name: null, icon: null, description: null, sacrificeOption: null, challengeOption: null };
  assert.deepEqual(withCanonicalCrisisText(macDinh), macDinh);
  assert.equal(withCanonicalCrisisText(null), null);
});
