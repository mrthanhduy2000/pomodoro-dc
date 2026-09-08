/**
 * wonderEffects.test.js — canh MỘT nguồn duy nhất cho tập đặc quyền kỳ quan và cho thứ chúng làm.
 * Chạy: node --import ./scripts/register-esm-loader.mjs --test src/engine/wonderEffects.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  aggregateWonderEffects, missionXpMultiplier, streakBonusCapDays,
  wonderCrisisWindowBonusHours, wonderPassiveBuffs, wonderRelicEvolveFactor,
} from './wonderEffects.js';
import { BLUEPRINT_CATALOG, BUILDING_EFFECTS, STREAK_MAX_BONUS_DAYS, WONDER_EFFECT_REGISTRY } from './constants.js';

const kyQuanCua = (hieuUng) => {
  const found = Object.entries(BUILDING_EFFECTS).find(([, e]) => e?.type === 'wonder' && e.wonderEffect === hieuUng);
  assert.ok(found, `không có kỳ quan nào mang đặc quyền ${hieuUng}`);
  return found[0];
};

test('CHỈ CÔNG TRÌNH KHAI type="wonder" MỚI GÓP ĐẶC QUYỀN', () => {
  // ⚠️ Bản chép tay ở tầng giao diện (đã gỡ 2026-09-02) bỏ đúng phép kiểm này, và nó vô hại chỉ vì
  // hôm nay không có dòng dữ liệu nào vừa khai `wonderEffect` vừa không phải kỳ quan. Bài này là
  // thứ giữ cho nó vô hại: nó bơm thẳng một ca như thế vào.
  const kyQuan = Object.entries(BUILDING_EFFECTS).find(([, e]) => e?.type === 'wonder' && e.wonderEffect);
  assert.ok(kyQuan, 'phải có ít nhất một kỳ quan để thử');
  assert.equal(aggregateWonderEffects([kyQuan[0]]).has(kyQuan[1].wonderEffect), true);

  const thuong = Object.entries(BUILDING_EFFECTS).find(([, e]) => e && e.type !== 'wonder');
  assert.ok(thuong, 'phải có ít nhất một công trình thường');
  const goc = BUILDING_EFFECTS[thuong[0]];
  BUILDING_EFFECTS[thuong[0]] = { ...goc, wonderEffect: 'xp_all_5' };
  try {
    assert.equal(aggregateWonderEffects([thuong[0]]).size, 0,
      'công trình thường khai wonderEffect KHÔNG được tính');
    assert.equal(wonderPassiveBuffs([thuong[0]], 60).expBonus, 0);
  } finally {
    BUILDING_EFFECTS[thuong[0]] = goc;
  }
});

test('MỖI KỲ QUAN CÓ ĐÚNG MỘT ĐẶC QUYỀN TRONG BẢNG, và 15 kỷ là 15 id khác nhau', () => {
  const ids = Object.entries(BUILDING_EFFECTS).filter(([, e]) => e?.type === 'wonder').map(([, e]) => e.wonderEffect);
  assert.equal(ids.length, 15);
  assert.equal(new Set(ids).size, 15, 'hai kỳ quan dùng chung một đặc quyền');
  for (const id of ids) {
    const reg = WONDER_EFFECT_REGISTRY[id];
    assert.ok(reg, `kỳ quan khai đặc quyền «${id}» không có trong WONDER_EFFECT_REGISTRY`);
    // Mọi đặc quyền phải LÀM một việc: hoặc buff thụ động, hoặc một trong bốn luật riêng còn sống.
    const coLuatRieng = ['longer_crisis_window', 'streak_cap_plus', 'mission_bonus_20', 'relic_evo_30off'].includes(id);
    assert.ok(reg.passive || coLuatRieng, `đặc quyền «${id}» không có «passive» và cũng không có luật riêng — nhãn suông`);
  }
});

test('BUFF THỤ ĐỘNG đọc đúng bảng: ngưỡng phút gác XP/EP/flatXp nhưng KHÔNG gác cửa sổ combo', () => {
  const nhan = wonderPassiveBuffs([kyQuanCua('xp_deep_10')], 30);
  assert.equal(nhan.expBonus, 0, 'phiên 30′ chưa tới 45′ ⇒ chưa có +10% XP');
  assert.equal(wonderPassiveBuffs([kyQuanCua('xp_deep_10')], 45).expBonus, 0.10);
  assert.equal(wonderPassiveBuffs([kyQuanCua('ep_all_10')], 5).epBonus, 0.10, 'không khai minMinutes ⇒ mọi phiên');
  assert.equal(wonderPassiveBuffs([kyQuanCua('deep_session_xp_150')], 89).flatXp, 0);
  assert.equal(wonderPassiveBuffs([kyQuanCua('deep_session_xp_150')], 90).flatXp, 150);
  assert.equal(wonderPassiveBuffs([kyQuanCua('combo_window_3h')], 0).comboWindowHours, 3, 'combo không phụ thuộc độ dài phiên');
  // Cộng dồn khi có nhiều kỳ quan (di sản trùng tu), và không có kỳ quan thì toàn 0.
  const hai = wonderPassiveBuffs([kyQuanCua('xp_all_5'), kyQuanCua('xp_all_8')], 25);
  assert.ok(Math.abs(hai.expBonus - 0.13) < 1e-9);
  // ADR-085: `sources` là bản kê tên đi kèm — rỗng khi không có kỳ quan nào, đúng như bốn số kia.
  assert.deepEqual(wonderPassiveBuffs([], 60), { expBonus: 0, epBonus: 0, comboWindowHours: 0, flatXp: 0, sources: [] });
  // ⚠️ Và bản kê phải KHỚP con số: một đặc quyền cộng XP mà không khai tên thì thẻ kết phiên lại
  // im lặng đúng như trước vòng 45.
  const keKhai = wonderPassiveBuffs([kyQuanCua('xp_all_5')], 25);
  assert.equal(keKhai.sources.length, 1, 'đặc quyền có cộng XP mà không có tên trong bản kê');
  assert.equal(keKhai.sources[0].xpPct, keKhai.expBonus);
  assert.equal(keKhai.sources[0].kind, 'perk');
  // Chưa đủ phút ⇒ không cộng gì ⇒ cũng không được khai tên (không hứa suông trên thẻ).
  assert.deepEqual(wonderPassiveBuffs([kyQuanCua('xp_deep_10')], 30).sources, []);
});

test('BỐN LUẬT RIÊNG — cùng một phép kiểm kỳ quan, trả về SỐ chứ không trả boolean', () => {
  assert.equal(wonderCrisisWindowBonusHours([kyQuanCua('longer_crisis_window')]), 24);
  assert.equal(wonderCrisisWindowBonusHours([]), 0);
  assert.ok(Math.abs(wonderRelicEvolveFactor([kyQuanCua('relic_evo_30off')]) - 0.7) < 1e-9);
  assert.equal(wonderRelicEvolveFactor([]), 1);
  assert.equal(streakBonusCapDays([kyQuanCua('streak_cap_plus')]), STREAK_MAX_BONUS_DAYS + 10);
  assert.equal(streakBonusCapDays([]), STREAK_MAX_BONUS_DAYS);
  assert.equal(missionXpMultiplier([kyQuanCua('mission_bonus_20')]), 1.2);
  assert.equal(missionXpMultiplier([]), 1);
});

test('KHÔNG CÒN BẢN CHÉP TAY NÀO — store và giao diện không tự hỏi wonderEffect === …', () => {
  // ⚠️ Bài canh CẤU TRÚC: hai bản chép có thể khớp nhau hôm nay rồi trôi khỏi nhau ở BIÊN, do tay
  // một người khác, mà không gì đỏ lên. Mọi câu hỏi «kỳ quan này có bật không» phải đi qua file này.
  const doc = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  for (const f of ['../store/gameStore.js', './opportunities.js', '../components/BuildScreen.jsx', '../components/DailyMissions.jsx', '../components/PomodoroEngine.jsx']) {
    const src = doc(f);
    assert.equal(/wonderEffect\s*===/.test(src), false, `${f} hỏi wonderEffect trực tiếp — bản chép tay`);
    assert.equal(/wonders\.has\(/.test(src), false, `${f} tự gom tập kỳ quan rồi hỏi — bản chép tay`);
  }
});

// ⚠️ ADR-085 — A CHIP MUST NAME WHO PAID, NOT REPEAT WHAT WAS PAID.
// The first version credited the perk with `WONDER_EFFECT_REGISTRY[id].label`, which is the EFFECT,
// so the ending card printed «🏛 +5% XP mọi phiên +8 XP» — a percentage sitting next to the amount
// it had already produced. The screenshot is what caught it: two numbers, one fact.
// THỬ-CHO-ĐỎ: đổi `WONDER_BUILDING_LABEL[id] ?? …` về `WONDER_EFFECT_REGISTRY[id]?.label` ⇒ đỏ.
test('a perk is credited by the BUILDING that grants it, never by its own percentage', () => {
  const wonders = Object.entries(BUILDING_EFFECTS)
    .filter(([, eff]) => eff?.type === 'wonder' && eff.wonderEffect)
    .map(([bpId]) => bpId);
  assert.ok(wonders.length >= 3, 'không còn kỳ quan nào — phép đo chạy rỗng');

  const { sources } = wonderPassiveBuffs(wonders, 120);
  assert.ok(sources.length >= 3, 'kỳ quan có cộng phần trăm mà không ai được nêu tên');
  for (const src of sources) {
    assert.doesNotMatch(
      src.label, /%/,
      `chip «${src.label}» in lại chính con số nó vừa sinh ra — tên công trình mới là thứ Đàm sở hữu`,
    );
    assert.ok(src.label && src.label !== src.id, `nguồn «${src.id}» không có tên người đọc được`);
  }
  // Và cái tên ấy phải là một công trình CÓ THẬT trong 75 bản vẽ, không phải một chuỗi bịa.
  const tenCongTrinh = new Set(Object.values(BLUEPRINT_CATALOG).flat().map((bp) => bp.label));
  for (const src of sources) {
    assert.ok(tenCongTrinh.has(src.label), `«${src.label}» không phải tên của bản vẽ nào`);
  }
});
