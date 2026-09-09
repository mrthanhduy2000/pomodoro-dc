/**
 * motion.test.js — the two laws of round 48's motion layer: DETERMINISM and NO SYNCHRONY, plus the
 * era vocabulary being a real vocabulary (different KINDS of motion, not one motion at 15 speeds).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ERA_MOTION, MOTION_KIND, MOTION_WRAP_SECONDS, PARTICLE_STYLE, SMOKE_INTENSITY,
  getEraMotion, motionKindForRole, motionTime, phaseAt, swayWeight,
} from './motion.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);

test('MỖI KỶ MỘT NHỊP: 15 kỷ đều khai gió + hạt, và có ít nhất 5 BỘ hạt khác nhau (không phải một hiệu ứng chỉnh nhanh chậm)', () => {
  const sets = new Set();
  for (const era of ERAS) {
    const m = ERA_MOTION[era];
    assert.ok(m, `kỷ ${era} chưa khai`);
    assert.ok(m.wind.amp > 0.05 && m.wind.amp <= 0.2, `kỷ ${era}: biên độ gió ${m.wind.amp} ngoài khoảng mắt thấy`);
    assert.ok(m.wind.speed > 0.5 && m.wind.speed < 2, `kỷ ${era}: tốc độ gió lạ`);
    for (const k of m.particles) assert.ok(PARTICLE_STYLE[k], `kỷ ${era}: hạt "${k}" không có công thức`);
    if (m.smoke) assert.ok(SMOKE_INTENSITY[m.smoke] > 0, `kỷ ${era}: loại khói "${m.smoke}" không có cường độ`);
    sets.add([...m.particles].sort().join('+'));
  }
  assert.ok(sets.size >= 5, `chỉ có ${sets.size} bộ hạt khác nhau — đó là một hiệu ứng, không phải một từ vựng`);
  // Stalingrad snows, Dubai blows sand, Manchester pours soot — the century must be readable from the list.
  assert.ok(ERA_MOTION[12].particles.includes('snow'));
  assert.ok(ERA_MOTION[15].particles.includes('sand'));
  assert.equal(ERA_MOTION[10].smoke, 'factory');
  assert.equal(getEraMotion(99).particles.length > 0, true, 'kỷ lạ vẫn phải có phương án dự phòng');
});

test('TẤT ĐỊNH: pha theo vị trí — cùng chỗ cùng pha, hai hàng xóm không cùng pha, không có đồng hồ ngẫu nhiên', () => {
  assert.equal(phaseAt(3.2, -1.7), phaseAt(3.2, -1.7));
  const a = phaseAt(0, 0); const b = phaseAt(1, 0); const c = phaseAt(0, 1);
  for (const v of [a, b, c]) assert.ok(v >= 0 && v < Math.PI * 2);
  assert.ok(Math.abs(a - b) > 0.05 && Math.abs(a - c) > 0.05 && Math.abs(b - c) > 0.05, 'ba hàng xóm cùng pha ⇒ gió máy móc');
  // 200 trees on a grid: no two share a phase to 3 decimals (a synchronised canopy reads as a machine)
  const seen = new Set();
  for (let x = 0; x < 20; x += 1) for (let z = 0; z < 10; z += 1) seen.add(phaseAt(x - 10, z - 5).toFixed(3));
  assert.ok(seen.size >= 195, `${200 - seen.size} cặp cây trùng pha`);
});

test('VAI → CHUYỂN ĐỘNG: tán lá lay, vải bay, gạch đá đứng im; trọng số lay tăng theo độ cao và bằng 0 ở gốc', () => {
  assert.equal(motionKindForRole('leaf'), MOTION_KIND.sway);
  assert.equal(motionKindForRole('leaf2'), MOTION_KIND.sway);
  assert.equal(motionKindForRole('cloth'), MOTION_KIND.flap);
  for (const r of ['wall', 'stone', 'roof', 'glass', 'wood', 'trim', 'water', 'dark']) {
    assert.equal(motionKindForRole(r), MOTION_KIND.none, `vai "${r}" không được động`);
  }
  assert.equal(swayWeight(0), 0);
  assert.equal(swayWeight(-1), 0);
  assert.ok(swayWeight(0.6, 1.2) < swayWeight(1.2, 1.2));
  assert.equal(swayWeight(5, 1.2), 1, 'quá tầm với thì kẹp ở 1');
});

test('ĐỒNG HỒ: thời gian cuộn lại sau một giờ để sin() không mất độ chính xác — và không bao giờ âm', () => {
  assert.equal(motionTime(0), 0);
  assert.equal(motionTime(MOTION_WRAP_SECONDS + 5), 5);
  assert.equal(motionTime(NaN), 0);
  assert.ok(motionTime(123456.789) >= 0 && motionTime(123456.789) < MOTION_WRAP_SECONDS);
});
