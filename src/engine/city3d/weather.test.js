import test from 'node:test';
import assert from 'node:assert/strict';

import { MUSEUM_HOUR, DAY_PHASES } from './daylight.js';
import { PARTICLE_STYLE } from './motion.js';
import {
  WEATHER_KINDS, WET_GROUND, museumWeather, weatherAt, weatherParticle, wetSurface,
} from './weather.js';

const HOURS = Array.from({ length: 24 }, (_, h) => h + 0.5);

test('THỜI TIẾT LÀ HÀM THUẦN CỦA (kỷ, giờ): cùng đầu vào ⇒ cùng đầu ra, 15 kỷ × 24 giờ, và mọi loại đều có tên', () => {
  for (let era = 1; era <= 15; era += 1) {
    for (const h of HOURS) {
      const a = weatherAt(era, h);
      const b = weatherAt(era, h);
      assert.deepEqual(a, b, `kỷ ${era} · ${h}h: hai lần hỏi ra hai câu trả lời`);
      assert.ok(WEATHER_KINDS.includes(a.kind), `kỷ ${era} · ${h}h: loại thời tiết lạ "${a.kind}"`);
      assert.ok(DAY_PHASES.includes(a.phase));
      for (const k of ['rain', 'wet', 'fog']) assert.ok(a[k] >= 0 && a[k] <= 1, `kỷ ${era} · ${h}h: ${k} = ${a[k]} ngoài [0, 1]`);
    }
  }
});

test('⚠️ LUẬT DUY NHẤT: MƯA THÌ ĐẤT PHẢI ƯỚT — không có khung nào có vạch mưa mà đất khô', () => {
  let rainy = 0;
  for (let era = 1; era <= 15; era += 1) {
    for (const h of HOURS) {
      const w = weatherAt(era, h);
      if (w.rain > 0) {
        rainy += 1;
        assert.ok(w.wet >= w.rain, `kỷ ${era} · ${h}h: mưa ${w.rain} mà đất chỉ ướt ${w.wet}`);
        assert.ok(weatherParticle(w) !== null, `kỷ ${era} · ${h}h: mưa mà không có hạt mưa`);
      } else {
        assert.equal(weatherParticle(w), null, `kỷ ${era} · ${h}h: không mưa mà có hạt mưa`);
      }
    }
  }
  assert.ok(rainy > 0, 'không kỷ nào mưa — bảng thời tiết rỗng');
  // ĐỐI CHỨNG: a hand-made row that breaks the law must be impossible through the public API —
  // `weatherAt` normalizes, so the only way in is the table, and the table is checked above.
});

test('MỖI KỶ CÓ THỜI TIẾT RIÊNG, và ít nhất một khung mưa/mù/tuyết/cát cho mọi kỷ có khí hậu như thế', () => {
  const kinds = new Map();
  for (let era = 1; era <= 15; era += 1) {
    const set = new Set(HOURS.map((h) => weatherAt(era, h).kind));
    kinds.set(era, set);
  }
  // Monsoon and northern cities rain; deserts blow sand; Stalingrad snows; nobody is uniform.
  for (const era of [4, 6, 8, 9, 10, 11, 13, 14]) assert.ok(kinds.get(era).has('rain') || kinds.get(era).has('drizzle'), `kỷ ${era} phải có mưa`);
  for (const era of [3, 15]) assert.ok(kinds.get(era).has('sand'), `kỷ ${era} phải có bão cát`);
  assert.ok(kinds.get(12).has('snow'), 'kỷ 12 phải có tuyết');
  for (const era of [1, 2, 7]) assert.ok(!kinds.get(era).has('rain'), `kỷ ${era} là kỷ khô — không mưa`);
});

test('KỶ NIÊM PHONG CÓ MỘT THỜI TIẾT, MÃI MÃI: `museumWeather` = `weatherAt(era, MUSEUM_HOUR)`', () => {
  for (let era = 1; era <= 15; era += 1) {
    assert.deepEqual(museumWeather(era), weatherAt(era, MUSEUM_HOUR));
  }
});

test('ĐẤT ƯỚT: nhám GIẢM, tối ĐI, phản chiếu TĂNG — đơn điệu theo độ ướt, và khô thì không đổi gì', () => {
  const dry = wetSurface({ roughness: 0.96 }, 0);
  assert.deepEqual(dry, { roughness: 0.96, darken: 1, specularGain: 1 });
  let prev = dry;
  for (const w of [0.25, 0.5, 0.75, 1]) {
    const cur = wetSurface({ roughness: 0.96 }, w);
    assert.ok(cur.roughness < prev.roughness, `ướt ${w}: nhám không giảm`);
    assert.ok(cur.darken < prev.darken, `ướt ${w}: không tối đi`);
    assert.ok(cur.specularGain > prev.specularGain, `ướt ${w}: phản chiếu không tăng`);
    prev = cur;
  }
  assert.ok(Math.abs(prev.roughness - WET_GROUND.roughness) < 1e-9);
  assert.ok(Math.abs(wetSurface({ roughness: 0.5 }, 2).roughness - WET_GROUND.roughness) < 1e-9, 'độ ướt bị kẹp về 1');
});

test('HẠT MƯA CÓ CÔNG THỨC, là VỆT chứ không phải hạt tròn, và rơi xuống chứ không bay lên', () => {
  for (const k of ['rain', 'drizzle']) {
    const st = PARTICLE_STYLE[k];
    assert.ok(st, `thiếu công thức hạt "${k}"`);
    assert.ok(st.wide && st.count > 0, `${k} phải là hạt trải rộng cả thành phố`);
    assert.ok(st.rise < 0, `${k} phải RƠI`);
    assert.ok(st.streak >= 4, `${k} phải là vệt dài (streak ≥ 4)`);
  }
  assert.ok(PARTICLE_STYLE.rain.count > PARTICLE_STYLE.drizzle.count, 'mưa to phải dày hơn mưa phùn');
});
