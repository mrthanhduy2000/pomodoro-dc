/**
 * wonderEffects.test.js — canh MỘT nguồn duy nhất cho giá RP và cho tập đặc quyền kỳ quan.
 * Chạy: node --import ./scripts/register-esm-loader.mjs --test src/engine/wonderEffects.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  aggregateWonderEffects, cancelPenaltyWonderMultiplier, missionXpMultiplier,
  relicEvolutionCostOf, researchCostOf, streakBonusCapDays,
} from './wonderEffects.js';
import { BLUEPRINT_META, BUILDING_EFFECTS, STREAK_MAX_BONUS_DAYS } from './constants.js';

test('CHỈ CÔNG TRÌNH KHAI type="wonder" MỚI GÓP ĐẶC QUYỀN', () => {
  // ⚠️ Bản chép tay ở tầng giao diện (đã gỡ 2026-09-02) bỏ đúng phép kiểm này, và nó vô hại chỉ vì
  // hôm nay không có dòng dữ liệu nào vừa khai `wonderEffect` vừa không phải kỳ quan. Bài này là
  // thứ giữ cho nó vô hại: nó bơm thẳng một ca như thế vào.
  const kyQuan = Object.entries(BUILDING_EFFECTS).find(([, e]) => e?.type === 'wonder' && e.wonderEffect);
  assert.ok(kyQuan, 'phải có ít nhất một kỳ quan để thử');
  assert.equal(aggregateWonderEffects([kyQuan[0]]).has(kyQuan[1].wonderEffect), true);

  // …và một công trình KHÔNG phải kỳ quan thì không góp gì, dù có khai `wonderEffect`.
  const thuong = Object.entries(BUILDING_EFFECTS).find(([, e]) => e && e.type !== 'wonder');
  assert.ok(thuong, 'phải có ít nhất một công trình thường');
  const goc = BUILDING_EFFECTS[thuong[0]];
  BUILDING_EFFECTS[thuong[0]] = { ...goc, wonderEffect: 't2_research_25off' };
  try {
    assert.equal(aggregateWonderEffects([thuong[0]]).size, 0,
      'công trình thường khai wonderEffect KHÔNG được tính — nếu tính thì màn hình sẽ in một mức giá đã giảm mà store không chấp nhận');
  } finally {
    BUILDING_EFFECTS[thuong[0]] = goc;
  }
});

test('GIÁ KHÔNG BAO GIỜ VỀ 0, VÀ LUÔN LÀ SỐ NGUYÊN', () => {
  const bp = Object.keys(BLUEPRINT_META)[0];
  assert.equal(researchCostOf([], bp, 0), 1, 'một bản vẽ không bao giờ miễn phí');
  assert.equal(researchCostOf([], bp, -50), 1);
  assert.equal(researchCostOf([], bp, 10.4), 10);
  assert.equal(researchCostOf([], bp, 10.6), 11);
  assert.equal(researchCostOf([], bp, undefined), 1);
});

test('GIẢM 25% CHỈ ÁP CHO KỶ 6–10, và chỉ khi đặc quyền đang bật', () => {
  const kyQuan = Object.entries(BUILDING_EFFECTS)
    .find(([, e]) => e?.type === 'wonder' && e.wonderEffect === 't2_research_25off');
  assert.ok(kyQuan, 'phải có kỳ quan mang đặc quyền giảm giá nghiên cứu');
  const trong = Object.entries(BLUEPRINT_META).find(([, m]) => m.era >= 6 && m.era <= 10);
  const ngoai = Object.entries(BLUEPRINT_META).find(([, m]) => m.era < 6 || m.era > 10);
  assert.equal(researchCostOf([kyQuan[0]], trong[0], 1000), 750);
  assert.equal(researchCostOf([], trong[0], 1000), 1000, 'chưa xây kỳ quan thì không giảm');
  if (ngoai) assert.equal(researchCostOf([kyQuan[0]], ngoai[0], 1000), 1000, 'ngoài kỷ 6–10 thì không giảm');
});

test('KHÔNG CÒN BẢN CHÉP TAY NÀO — cả ba tầng phải đọc chung một hàm', () => {
  // ⚠️ Đây là bài canh CẤU TRÚC, không canh giá trị: hai bản chép tay có thể khớp nhau hôm nay rồi
  // trôi khỏi nhau ở BIÊN vào một phase khác, do tay một người khác, mà không gì đỏ lên.
  const doc = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  for (const f of ['../store/gameStore.js', './opportunities.js', '../components/BlueprintInventory.jsx']) {
    const src = doc(f);
    assert.equal(/function\s+aggregateWonderEffects\s*\(/.test(src), false, `${f} dựng lại aggregateWonderEffects`);
    assert.equal(/function\s+getActiveWonderEffects\s*\(/.test(src), false, `${f} dựng lại getActiveWonderEffects`);
    assert.equal(/t2_research_25off'\s*\)\s*&&/.test(src), false, `${f} chép lại luật giảm giá 25%`);
  }
  // ⚠️ MỞ RỘNG 2026-09-05 — cùng lỗi đã tìm thấy lần thứ HAI ở một loại tiền khác:
  // `RelicInventory.jsx` giữ một bản chép của luật "kỳ quan kỷ 15 giảm 30% giá tiến hoá di vật",
  // và bản ấy cũng thiếu phép kiểm `type === 'wonder'`. Canh cả hai chỗ, không chỉ chỗ vừa sửa.
  for (const f of ['../store/gameStore.js', '../components/RelicInventory.jsx']) {
    assert.equal(/relic_evo_30off'/.test(doc(f)), false,
      `${f} chép lại luật giảm giá tiến hoá di vật — nó phải gọi \`relicEvolutionCostOf\`.`);
  }
  // ⚠️ MỞ RỘNG LẦN HAI 2026-09-05 — soi hết `wonderEffect` mà tầng giao diện đọc thì ra thêm BA
  // bản chép nữa, cùng thiếu `type === 'wonder'`. Năm bản của một hình dạng lỗi, trong bốn file.
  const KHOA_DAC_QUYEN = {
    '../store/gameStore.js': ['disaster_hp_50off', 'streak_cap_plus', 'mission_bonus_20'],
    '../components/PomodoroEngine.jsx': ['building_hp_boost', 'disaster_hp_50off'],
    '../components/DailyMissions.jsx': ['streak_cap_plus', 'mission_bonus_20'],
  };
  for (const [f, khoa] of Object.entries(KHOA_DAC_QUYEN)) {
    const src = doc(f);
    for (const k of khoa) {
      assert.equal(src.includes(`'${k}'`), false,
        `${f} đọc thẳng '${k}' — nó phải gọi hàm tương ứng ở \`wonderEffects.js\`.`);
    }
  }
  // ⚠️ MỘT NGOẠI LỆ, ĐẾM ĐƯỢC. `building_hp_boost` còn ĐÚNG MỘT lần đọc hợp lệ trong store —
  // `getWonderRawRewardMultiplier` (+15% tài nguyên thô), một luật KHÁC hẳn phép phạt huỷ phiên và
  // không có bản chép nào ở tầng giao diện. Đếm chứ không tha: lần đọc thứ hai là đỏ, mà lần đọc
  // ấy chính là dấu hiệu có ai vừa dựng lại một bản chép.
  const soLan = (doc('../store/gameStore.js').match(/'building_hp_boost'/g) ?? []).length;
  assert.equal(soLan, 1, 'store có thêm một chỗ đọc `building_hp_boost` — bản chép thứ hai?');
});

test('BA ĐẶC QUYỀN CÒN LẠI — cùng một phép kiểm kỳ quan, và trả về SỐ chứ không trả boolean', () => {
  const kyQuanCua = (hieuUng) => Object.entries(BUILDING_EFFECTS)
    .find(([, e]) => e?.type === 'wonder' && e.wonderEffect === hieuUng)?.[0];

  // ── phạt huỷ phiên ──────────────────────────────────────────────────────────
  const hp = kyQuanCua('building_hp_boost');
  const dis = kyQuanCua('disaster_hp_50off');
  assert.equal(cancelPenaltyWonderMultiplier([]), 1, 'chưa xây gì thì phạt nguyên đòn');
  if (hp) assert.equal(cancelPenaltyWonderMultiplier([hp]), 0.85);
  if (dis) assert.equal(cancelPenaltyWonderMultiplier([dis]), 0.5);
  // ⚠️ HAI KỲ QUAN THÌ NHÂN, KHÔNG PHẢI LẤY CÁI TỐT HƠN — đổi thành `Math.min` là đổi cân bằng.
  if (hp && dis) assert.equal(cancelPenaltyWonderMultiplier([hp, dis]), 0.85 * 0.5);

  // ── trần chuỗi + thưởng nhiệm vụ ───────────────────────────────────────────
  const cap = kyQuanCua('streak_cap_plus');
  const mis = kyQuanCua('mission_bonus_20');
  assert.equal(streakBonusCapDays([]), STREAK_MAX_BONUS_DAYS);
  if (cap) assert.equal(streakBonusCapDays([cap]), STREAK_MAX_BONUS_DAYS + 10);
  assert.equal(missionXpMultiplier([]), 1);
  if (mis) assert.equal(missionXpMultiplier([mis]), 1.2);

  // ⚠️ VÀ CẢ BA PHẢI BỎ QUA công trình thường khai `wonderEffect` — đúng phép kiểm mà năm bản chép
  // đều thiếu. Bơm thẳng ca ấy vào thay vì tin rằng dữ liệu hôm nay không có nó.
  const thuong = Object.entries(BUILDING_EFFECTS).find(([, e]) => e && e.type !== 'wonder');
  const goc = BUILDING_EFFECTS[thuong[0]];
  for (const hieuUng of ['building_hp_boost', 'streak_cap_plus', 'mission_bonus_20']) {
    BUILDING_EFFECTS[thuong[0]] = { ...goc, wonderEffect: hieuUng };
    try {
      assert.equal(cancelPenaltyWonderMultiplier([thuong[0]]), 1, hieuUng);
      assert.equal(streakBonusCapDays([thuong[0]]), STREAK_MAX_BONUS_DAYS, hieuUng);
      assert.equal(missionXpMultiplier([thuong[0]]), 1, hieuUng);
    } finally {
      BUILDING_EFFECTS[thuong[0]] = goc;
    }
  }
});

test('GIÁ TIẾN HOÁ DI VẬT — cùng một luật, cùng một sàn, cùng một phép kiểm kỳ quan', () => {
  const kyQuan = Object.entries(BUILDING_EFFECTS)
    .find(([, e]) => e?.type === 'wonder' && e.wonderEffect === 'relic_evo_30off');
  assert.ok(kyQuan, 'phải có kỳ quan mang đặc quyền giảm giá tiến hoá');
  const bac = { t2Cost: 100 };   // ⚠️ trường thật là `t2Cost`/`t3Cost`, không phải `refinedCost`
  assert.equal(relicEvolutionCostOf([], bac), 100, 'chưa xây kỳ quan thì không giảm');
  assert.equal(relicEvolutionCostOf([kyQuan[0]], bac), 70);
  // Sàn 1: một bậc tiến hoá không bao giờ miễn phí.
  // ⚠️ VÀ CHÍNH CÁI SÀN NÀY LÀ MỘT LỆCH THẬT ĐÃ ĐƯỢC VÁ: bản chép ở tầng giao diện trả thẳng
  // `baseCost` khi không có giảm giá, tức nó IN RA 0 trong khi store TRỪ 1.
  assert.equal(relicEvolutionCostOf([kyQuan[0]], { t2Cost: 0 }), 1);
  assert.equal(relicEvolutionCostOf([], { t2Cost: 0 }), 1);

  // ⚠️ VÀ PHÉP KIỂM `type === 'wonder'` PHẢI ÁP CẢ Ở ĐÂY — bản chép cũ ở tầng giao diện bỏ nó.
  const thuong = Object.entries(BUILDING_EFFECTS).find(([, e]) => e && e.type !== 'wonder');
  const goc = BUILDING_EFFECTS[thuong[0]];
  BUILDING_EFFECTS[thuong[0]] = { ...goc, wonderEffect: 'relic_evo_30off' };
  try {
    assert.equal(relicEvolutionCostOf([thuong[0]], bac), 100,
      'công trình thường khai wonderEffect KHÔNG được giảm giá — nếu giảm thì màn hình in một mức '
      + 'giá mà cửa hàng không chấp nhận');
  } finally {
    BUILDING_EFFECTS[thuong[0]] = goc;
  }
});
