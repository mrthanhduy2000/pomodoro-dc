import test from 'node:test';
import assert from 'node:assert/strict';
import { describeBuff, describeBuffParts } from './buffLabel.js';
import { RELIC_EVOLUTION } from './constants.js';

test('dịch đủ năm trục sống, đúng thứ tự, làm tròn phần trăm', () => {
  assert.deepEqual(
    describeBuffParts({ allBonus: 0.1, epBonus: 0.115, expBonus: 0.05, comboWindowHours: 2, xpSeal: 0.02 }),
    ['+10% tất cả', '+12% EP', '+5% XP', '+2h combo', '+2% XP ★★★'],
  );
  assert.equal(describeBuff({ epBonus: 0.08 }), '+8% EP');
});

test('trục chết KHÔNG được dịch — để một bảng lỡ khai lại thì có thứ nhìn thấy được', () => {
  assert.deepEqual(describeBuffParts({ resourceBonus: 0.2, gachaBonus: 5, pitySeal: 1, disasterReduction: 0.5 }), []);
  assert.deepEqual(describeBuffParts(null), []);
  assert.equal(describeBuff(undefined), '');
});

test('MỌI bậc của MỌI di vật trong bảng đều dịch ra ít nhất một dòng — không di vật nào câm', () => {
  for (const [id, def] of Object.entries(RELIC_EVOLUTION)) {
    def.stages.forEach((stage, i) => {
      assert.ok(describeBuffParts(stage.buff).length > 0, `${id} bậc ${i} không dịch được buff ${JSON.stringify(stage.buff)}`);
    });
  }
});
