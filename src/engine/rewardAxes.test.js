/**
 * rewardAxes.test.js — MỌI PHẦN THƯỞNG PHẢI NẰM TRÊN MỘT TRỤC NGƯỜI CHƠI NHÌN THẤY (ADR-069 vế 4, 2026-09-06).
 * ─────────────────────────────────────────────────────────────────────────────
 * Sau khi tài nguyên · RP · thảm hoạ rời đường chơi, ba bảng phần thưởng đã lộ ra là "nhãn không có
 * hiệu ứng": 2/8 bậc mỗi kỷ thưởng «+N% Tài Nguyên», 12/15 di vật thưởng tài nguyên/RP/giảm thảm
 * hoạ, 4 kỹ năng quay ra nguyên liệu/tinh luyện. Không cổng nào bắt được: bảng vẫn hợp lệ, số vẫn
 * đúng, chỉ có thứ nhận được là không ai thấy. Bài này khoá cả BA bảng vào ba trục sống.
 *
 * ⚠️ Bài học "một luật một công thức": `ERA_CRISES[…].successRelic.buff` và `RELIC_EVOLUTION[id]
 * .stages[0].buff` là HAI bản chép của cùng một sự thật — nếu chúng lệch, di vật vừa nhận sẽ kể một
 * chuyện còn túi di vật kể chuyện khác.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BUILDING_EFFECTS,
  BUILDING_PERK_REGISTRY,
  ERA_CRISES,
  RANK_SYSTEM,
  RELIC_COMBO_WINDOW_CAP_HOURS,
  RELIC_EP_BONUS_CAP,
  RELIC_EVOLUTION,
  RELIC_EXP_BONUS_CAP,
  SKILL_SYNERGIES,
  SKILL_TREE,
  WONDER_EFFECT_REGISTRY,
} from './constants.js';

const TRUC_BAC = new Set(['expBonus', 'epBonus', 'allBonus']);
const TRUC_DI_VAT = new Set(['epBonus', 'expBonus', 'comboWindowHours', 'xpSeal']);
// Từ ngữ của ba đồng tiền đã ngủ — xuất hiện trong một mô tả phần thưởng là một lời hứa suông.
const TU_NGU_NGU = /tài nguyên|tinh luyện|nguyên liệu|\bRP\b|thảm h[oọ]a|double drop/iu;

test('bậc: mọi passiveBuff nằm trên XP · EP · Tất cả, và nhãn nói đúng key + đúng số', () => {
  let soBac = 0;
  for (const [book, sys] of Object.entries(RANK_SYSTEM)) {
    for (const r of sys.ranks) {
      soBac += 1;
      const keys = Object.keys(r.passiveBuff ?? {});
      assert.equal(keys.length, 1, `kỷ ${book} bậc ${r.id}: passiveBuff phải có đúng một trục`);
      const [key] = keys;
      assert.ok(TRUC_BAC.has(key), `kỷ ${book} bậc ${r.id}: trục «${key}» không phải trục sống`);
      const pct = Math.round(r.passiveBuff[key] * 100);
      const nhan = { expBonus: `+${pct}% XP`, epBonus: `+${pct}% EP`, allBonus: `+${pct}% Tất Cả` }[key];
      assert.equal(r.buffLabel, nhan, `kỷ ${book} bậc ${r.id}: nhãn «${r.buffLabel}» không khớp buff ${key}=${r.passiveBuff[key]}`);
      assert.doesNotMatch(r.buffLabel, TU_NGU_NGU);
    }
  }
  assert.equal(soBac, 15 * 8, 'gác chạy-rỗng: phải duyệt đủ 15 kỷ × 8 bậc');
});

test('di vật: successRelic.buff TRÙNG bậc «Cơ Bản» của RELIC_EVOLUTION — một luật một công thức', () => {
  const eras = Object.keys(ERA_CRISES);
  assert.equal(eras.length, 15);
  for (const era of eras) {
    const relic = ERA_CRISES[era].challengeOption.successRelic;
    const evo = RELIC_EVOLUTION[relic.id];
    assert.ok(evo, `kỷ ${era}: di vật «${relic.id}» không có trong RELIC_EVOLUTION`);
    assert.equal(evo.era, Number(era));
    assert.deepEqual(relic.buff, evo.stages[0].buff, `kỷ ${era}: buff lúc nhận ≠ bậc Cơ Bản của bảng tiến hoá`);
    assert.doesNotMatch(relic.description, TU_NGU_NGU, `kỷ ${era}: mô tả di vật còn hứa một đồng tiền đã ngủ`);
  }
});

test('di vật: chỉ thưởng trên EP · XP · giờ combo (+xpSeal ở Huyền Thoại), và tiến hoá không bao giờ giảm', () => {
  let soBac = 0;
  for (const [id, evo] of Object.entries(RELIC_EVOLUTION)) {
    assert.equal(evo.stages.length, 3, `${id}: phải đúng 3 bậc`);
    evo.stages.forEach((stage, i) => {
      soBac += 1;
      for (const [key, val] of Object.entries(stage.buff)) {
        assert.ok(TRUC_DI_VAT.has(key), `${id} bậc ${i}: trục «${key}» không phải trục sống`);
        assert.ok(val > 0, `${id} bậc ${i}: ${key} phải dương`);
        if (i > 0) {
          const truoc = evo.stages[i - 1].buff[key];
          if (key !== 'xpSeal') assert.ok(truoc !== undefined && val >= truoc, `${id}: ${key} giảm từ bậc ${i - 1} sang ${i}`);
        }
      }
      // Mọi trục của bậc trước phải còn ở bậc sau — tiến hoá không được đánh rơi một trục.
      if (i > 0) for (const key of Object.keys(evo.stages[i - 1].buff)) assert.ok(key in stage.buff, `${id}: bậc ${i} đánh rơi trục ${key}`);
      assert.equal('xpSeal' in stage.buff, i === 2, `${id}: xpSeal chỉ có ở bậc Huyền Thoại`);
    });
  }
  assert.equal(soBac, 15 * 3);
});

test('trần di vật: EP/XP/combo đều là lưới an toàn (≥ tổng Huyền Thoại + bậc cao nhất) — không cắn loadout thật', () => {
  const tong = (key) => Object.values(RELIC_EVOLUTION).reduce((acc, evo) => acc + (evo.stages[2].buff[key] ?? 0), 0);
  const bacMax = (key) => Math.max(...Object.values(RANK_SYSTEM).flatMap((s) => s.ranks.map((r) => r.passiveBuff[key] ?? 0)));
  assert.ok(RELIC_EP_BONUS_CAP >= tong('epBonus') + bacMax('epBonus'), `trần EP ${RELIC_EP_BONUS_CAP} < tổng ${tong('epBonus')} + bậc ${bacMax('epBonus')}`);
  assert.ok(RELIC_EXP_BONUS_CAP >= tong('expBonus') + bacMax('expBonus'), `trần XP ${RELIC_EXP_BONUS_CAP} < tổng ${tong('expBonus')} + bậc ${bacMax('expBonus')}`);
  // Combo: sau ADR-069 có 6 di vật trên trục này (3 sẵn có + 3 «che chở» chuyển sang) — trần vẫn phải đứng trên tổng.
  assert.ok(RELIC_COMBO_WINDOW_CAP_HOURS >= tong('comboWindowHours'), `trần combo ${RELIC_COMBO_WINDOW_CAP_HOURS}h < tổng ${tong('comboWindowHours')}h`);
  assert.equal(Object.values(RELIC_EVOLUTION).filter((evo) => evo.stages[0].buff.comboWindowHours).length, 6, 'gác chạy-rỗng: 6 di vật combo');
});

test('kỹ năng + tổ hợp: không mô tả nào còn hứa một đồng tiền đã ngủ', () => {
  let so = 0;
  for (const [bid, branch] of Object.entries(SKILL_TREE)) {
    for (const node of branch.nodes) {
      so += 1;
      assert.doesNotMatch(node.description, TU_NGU_NGU, `${bid}/${node.id}: «${node.description}»`);
      assert.doesNotMatch(node.description, /\d\.\d{6,}/, `${bid}/${node.id}: số thập phân trôi (thiếu Math.round)`);
    }
  }
  for (const sy of Object.values(SKILL_SYNERGIES)) assert.doesNotMatch(sy.description ?? '', TU_NGU_NGU);
  assert.equal(so, 36, 'gác chạy-rỗng: 6 nhánh × 6 kỹ năng');
});

// ─── ADR-070 (2026-09-06): hai bảng đặc quyền công trình cũng phải nằm trên trục sống ─────────────
// Trước vòng 35, 11/15 kỳ quan hứa "giảm giá RP", "rẻ tinh luyện", "giảm thảm hoạ", "mang tài nguyên
// sang kỷ sau" — toàn đồng tiền đã ngủ. Bảng vẫn hợp lệ, số vẫn đúng, chỉ có thứ nhận được là không
// ai thấy. Khoá y như ba bảng ở trên.
const DAC_QUYEN_SONG_KHONG_PASSIVE = new Set(['streak_cap_plus', 'mission_bonus_20', 'longer_crisis_window', 'relic_evo_30off']);
test('kỳ quan: mỗi đặc quyền là buff XP/EP/combo/XP phẳng, hoặc một luật còn được store đọc; mô tả không hứa đồng tiền ngủ', () => {
  const ids = Object.keys(WONDER_EFFECT_REGISTRY);
  assert.equal(ids.length, 15, 'gác chạy-rỗng: 15 kỷ × 1 kỳ quan');
  for (const id of ids) {
    const eff = WONDER_EFFECT_REGISTRY[id];
    assert.doesNotMatch(`${eff.label} ${eff.description}`, TU_NGU_NGU, `${id}: mô tả còn hứa một đồng tiền đã ngủ`);
    const passive = eff.passive ?? {};
    const truc = ['expBonus', 'epBonus', 'comboWindowHours', 'flatXp'].filter((k) => passive[k] > 0);
    const luat = DAC_QUYEN_SONG_KHONG_PASSIVE.has(id) || eff.crisisWindowHours > 0 || (eff.relicEvolveFactor > 0 && eff.relicEvolveFactor < 1);
    assert.ok(truc.length > 0 || luat, `${id}: không có hiệu ứng nào trên trục sống — nhãn không có hiệu ứng`);
    for (const k of Object.keys(passive)) {
      assert.ok(['expBonus', 'epBonus', 'comboWindowHours', 'flatXp', 'minMinutes'].includes(k), `${id}: passive có trục lạ «${k}»`);
    }
  }
  // Mọi kỳ quan trong bảng công trình đều trỏ tới một đặc quyền CÓ trong registry — trỏ lạc là im lặng.
  const wonderIds = Object.values(BUILDING_EFFECTS).filter((e) => e.type === 'wonder').map((e) => e.wonderEffect);
  assert.equal(wonderIds.length, 15);
  for (const id of wonderIds) assert.ok(WONDER_EFFECT_REGISTRY[id], `kỳ quan trỏ tới đặc quyền lạ «${id}»`);
  assert.equal(new Set(wonderIds).size, 15, 'hai kỳ quan dùng chung một đặc quyền ⇒ hai kỷ không phân biệt được');
});

test('đặc quyền công trình thường: nhãn và tóm tắt không hứa đồng tiền ngủ', () => {
  const ids = Object.keys(BUILDING_PERK_REGISTRY);
  assert.ok(ids.length >= 4, 'gác chạy-rỗng');
  for (const id of ids) {
    const perk = BUILDING_PERK_REGISTRY[id];
    assert.doesNotMatch(`${perk.label} ${perk.summary}`, TU_NGU_NGU, `${id}: còn hứa một đồng tiền đã ngủ`);
  }
});
