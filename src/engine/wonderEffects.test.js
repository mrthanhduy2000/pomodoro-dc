/**
 * wonderEffects.test.js — canh MỘT nguồn duy nhất cho giá RP và cho tập đặc quyền kỳ quan.
 * Chạy: node --import ./scripts/register-esm-loader.mjs --test src/engine/wonderEffects.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { aggregateWonderEffects, researchCostOf } from './wonderEffects.js';
import { BLUEPRINT_META, BUILDING_EFFECTS } from './constants.js';

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
});
