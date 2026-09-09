/**
 * sky.test.js — Round 51 (ADR-091): the sky module answers, checked.
 *
 * ⚠️ WHAT IS WORTH LOCKING HERE, and what is not. The exact cloud amount of era 8 is a taste
 * decision that will keep moving; locking it would only make the test a mirror. What must not move
 * is the SHAPE of the answers:
 *   · the same input always gives the same answer (no clock, no `Math.random`);
 *   · the era ORDERING survives — Manchester is always cloudier than Egypt, whatever the tuning;
 *   · a night is required for stars, and light pollution really does take them away;
 *   · the moon runs a real cycle rather than a number someone picked.
 * Every one of these is a RELATION, which is exactly the thing an absolute number cannot express
 * (`CLAUDE.md`, lesson 2).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CLOUD_KINDS, CLOUD_SHAPE, ERA_SKY, MOON_CYCLE_DAYS, cloudCount, moonPhase, skyAt, starCount,
} from './sky.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);

test('mỗi kỷ có một dòng trời, và mọi loại mây khai ở đó đều dựng được', () => {
  for (const era of ERAS) {
    const row = ERA_SKY[era];
    assert.ok(row, `kỷ ${era} không có dòng nào trong ERA_SKY`);
    assert.ok(CLOUD_KINDS.includes(row.base), `kỷ ${era}: loại mây lạ "${row.base}"`);
    assert.ok(row.amount >= 0 && row.amount <= 1, `kỷ ${era}: lượng mây ngoài 0…1`);
    assert.ok(row.pollution >= 0 && row.pollution <= 1, `kỷ ${era}: ô nhiễm ánh sáng ngoài 0…1`);
    // `none` là câu trả lời, không phải một hình — nên nó KHÔNG có dòng hình học, và mọi loại còn
    // lại thì phải có, đủ cả sáu trường mà `skyLayer` đọc.
    if (row.base === 'none') continue;
    const shape = CLOUD_SHAPE[row.base];
    assert.ok(shape, `kỷ ${era}: loại "${row.base}" không có dòng hình học`);
    for (const field of ['height', 'puff', 'flat', 'perUnit', 'speed', 'alpha', 'shadow', 'stretch']) {
      assert.ok(Number.isFinite(shape[field]), `${row.base}.${field} không phải số`);
    }
  }
});

test('TẤT ĐỊNH: cùng đầu vào ⇒ cùng bầu trời, ở cả 15 kỷ và cả 24 giờ', () => {
  for (const era of ERAS) {
    for (let hour = 0; hour < 24; hour += 1) {
      const a = skyAt({ era, season: 'summer', hour, dayIndex: 7 });
      const b = skyAt({ era, season: 'summer', hour, dayIndex: 7 });
      assert.deepEqual(a, b, `kỷ ${era} giờ ${hour}: hai lần gọi ra hai bầu trời`);
    }
  }
});

test('THỨ TỰ KỶ SỐNG SÓT: Manchester luôn nhiều mây hơn Ai Cập, và sao thì ngược lại', () => {
  // ⚠️ HỎI THỨ TỰ, KHÔNG HỎI CON SỐ. Một ngưỡng tuyệt đối ("kỷ 10 ≥ 0,8") sẽ đỏ vào ngày ai đó
  // chỉnh lại toàn bảng cho hợp mắt, dù điều bài này canh — *thành phố khói than có trời dày hơn sa
  // mạc* — không hề đổi.
  const cover = (era) => skyAt({ era, season: 'summer', hour: 12 }).amount;
  assert.ok(cover(10) > cover(7), 'kỷ 10 (Manchester) phải nhiều mây hơn kỷ 7 (Toscana)');
  assert.ok(cover(7) > cover(2), 'kỷ 7 (Toscana) phải nhiều mây hơn kỷ 2 (Ai Cập)');
  assert.ok(cover(5) > cover(3), 'kỷ 5 (Eifel) phải nhiều mây hơn kỷ 3 (Lưỡng Hà)');

  const stars = (era) => skyAt({ era, season: 'summer', hour: 23 }).stars;
  assert.ok(stars(1) > stars(9), 'kỷ 1 (thảo nguyên) phải nhiều sao hơn kỷ 9 (đèn khí Paris)');
  assert.ok(stars(9) > stars(13), 'kỷ 9 phải nhiều sao hơn kỷ 13 (Tokyo)');
  assert.equal(skyAt({ era: 13, season: 'summer', hour: 23 }).stars < 0.06, true,
    'kỷ 13 gần như không còn sao — đó là điều bảng ô nhiễm ánh sáng hứa');
});

test('SAO CHỈ CÓ BAN ĐÊM, và Ngân Hà chỉ ở kỷ chưa có đèn', () => {
  for (const era of ERAS) {
    for (const hour of [8, 12, 16]) {
      const sky = skyAt({ era, season: 'summer', hour });
      assert.equal(sky.stars, 0, `kỷ ${era} giờ ${hour}: có sao giữa ban ngày`);
      assert.equal(sky.milkyWay, false, `kỷ ${era} giờ ${hour}: có Ngân Hà giữa ban ngày`);
      assert.equal(sky.moon, null, `kỷ ${era} giờ ${hour}: có trăng giữa ban ngày`);
      assert.equal(starCount(sky), 0, `kỷ ${era} giờ ${hour}: vẫn dựng sao`);
    }
  }
  // Ngân Hà là một sự thật về BẦU TRỜI: nó cần một kỷ tối VÀ một đêm quang. Kỷ 13 có đêm quang
  // cũng không thấy, còn kỷ 1 thì thấy — hai vế, nếu không thì luật chỉ là nửa luật.
  assert.equal(skyAt({ era: 1, season: 'summer', hour: 23 }).milkyWay, true);
  assert.equal(skyAt({ era: 13, season: 'summer', hour: 23 }).milkyWay, false);
  assert.equal(skyAt({ era: 11, season: 'summer', hour: 23 }).milkyWay, false);
});

test('MẶT TRĂNG chạy đúng một chu kỳ, và chu kỳ ấy KHÉP KÍN', () => {
  assert.equal(moonPhase(0).lit, 0, 'ngày 0 phải là trăng non');
  assert.ok(Math.abs(moonPhase(MOON_CYCLE_DAYS / 2).lit - 1) < 1e-9, 'nửa chu kỳ phải là trăng tròn');
  // ⚠️ ĐỐI CHỨNG khép kín: sau đúng một chu kỳ phải quay về chỗ cũ. Không có vế này thì một công
  // thức trôi tuyến tính (trăng cứ sáng dần mãi) vẫn qua được hai dòng trên.
  for (const d of [0, 3, 11, 22]) {
    const a = moonPhase(d);
    const b = moonPhase(d + MOON_CYCLE_DAYS);
    assert.ok(Math.abs(a.lit - b.lit) < 1e-9, `ngày ${d}: một chu kỳ sau không về chỗ cũ`);
  }
  // và ngày âm cũng phải trả lời được — `dayIndex` là một số đếm, không ai hứa nó không âm
  assert.ok(moonPhase(-4).lit >= 0 && moonPhase(-4).lit <= 1, 'ngày âm ra pha ngoài 0…1');
  // sáng dần rồi tối dần: nửa đầu chu kỳ là "đang lên"
  assert.equal(moonPhase(5).waxing, true);
  assert.equal(moonPhase(20).waxing, false);
});

test('THỜI TIẾT ĐÈ LÊN Ý THÍCH CỦA KỶ — mưa thì trời phải là trời mưa, kể cả ở sa mạc', () => {
  const mưa = skyAt({ era: 2, season: 'summer', hour: 12, weather: { kind: 'rain', fog: 0.2 } });
  assert.equal(mưa.kind, 'storm', 'trời mưa mà không ra mây dông');
  assert.ok(mưa.amount > 0.9, 'trời mưa mà vẫn quang');
  // và một kỷ sa mạc lúc KHÔNG mưa thì vẫn phải là trời sa mạc — nếu không thì vế trên chỉ chứng
  // minh "hàm luôn trả về storm"
  const quang = skyAt({ era: 2, season: 'summer', hour: 12, weather: { kind: 'clear', fog: 0 } });
  assert.ok(quang.amount < 0.2, `kỷ 2 lúc quang vẫn ra ${quang.amount.toFixed(2)} mây`);
});

test('ĐẾM MÂY: trời quang thì KHÔNG dựng gì, và thành phố lớn hơn thì trời rộng hơn', () => {
  const quang = skyAt({ era: 3, season: 'summer', hour: 12 });
  if (quang.kind === 'none') assert.equal(cloudCount(quang, 12), 0, 'trời quang mà vẫn đếm ra mây');
  const dày = skyAt({ era: 10, season: 'summer', hour: 12 });
  assert.ok(cloudCount(dày, 18) > cloudCount(dày, 12), 'lưới rộng hơn mà trời không rộng thêm');
  assert.equal(cloudCount(null, 12), 0);
});

test('BÌNH MINH VÀ HOÀNG HÔN được rọi từ dưới, giữa trưa thì không', () => {
  const trưa = skyAt({ era: 8, season: 'summer', hour: 12 });
  const chiều = skyAt({ era: 8, season: 'summer', hour: 18 });
  assert.equal(trưa.underlit, 0, 'giữa trưa mà mây vẫn được rọi từ dưới');
  assert.ok(chiều.underlit > trưa.underlit, 'hoàng hôn phải rọi từ dưới nhiều hơn giữa trưa');
});

test('MÙA NGHIÊNG BẦU TRỜI: mùa đông dày hơn mùa hè ở mọi kỷ', () => {
  for (const era of ERAS) {
    const hè = skyAt({ era, season: 'summer', hour: 12 }).amount;
    const đông = skyAt({ era, season: 'winter', hour: 12 }).amount;
    assert.ok(đông >= hè, `kỷ ${era}: mùa đông (${đông.toFixed(2)}) không dày hơn mùa hè (${hè.toFixed(2)})`);
  }
});
