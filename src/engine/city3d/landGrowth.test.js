/**
 * landGrowth.test.js — the land grows with the player (round 48, ADR-088, closes #74) — and the one
 * invariant that makes that legal next to ADR-007: ONLY ADD, NEVER MOVE. Every item that exists at a
 * stage exists at every later stage with the same coordinates, digit for digit, in the same order.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveOutskirts, OUTSKIRT_REACH, distanceOutsideGrid } from './outskirts.js';
import { deriveHinterland } from './hinterland.js';
import { cityOrbitOptions } from './orbit.js';
import {
  LAND_MILESTONES, cameraPullback, hamletBonus, landStage, nextLandMilestone, outskirtReach,
} from './landGrowth.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const GRID = 12;
const key = (it) => `${it.kind}|${it.x}|${it.y}|${it.seed}`;

test('MỐC ĐẤT: 5 bậc, bậc 0 là mảnh đất mọi kỷ vẫn có; số phiên rác ⇒ bậc 0', () => {
  assert.deepEqual([...LAND_MILESTONES], [0, 25, 50, 90, 140]);
  assert.equal(landStage(0), 0); assert.equal(landStage(24), 0); assert.equal(landStage(25), 1);
  assert.equal(landStage(139), 3); assert.equal(landStage(140), 4); assert.equal(landStage(9999), 4);
  assert.equal(landStage(NaN), 0); assert.equal(landStage(-5), 0);
  assert.equal(outskirtReach(0), OUTSKIRT_REACH, 'bậc 0 phải đúng bằng vành 8 ô đã có từ Phase 8D');
  assert.equal(outskirtReach(4), 11);
  assert.equal(hamletBonus(0), 0); assert.equal(hamletBonus(4), 4);
  assert.equal(cameraPullback(0), 1); assert.ok(cameraPullback(4) > 1.23 && cameraPullback(4) < 1.25);
  assert.equal(nextLandMilestone(30), 50); assert.equal(nextLandMilestone(200), null);
});

test('CHỈ THÊM, KHÔNG BAO GIỜ DỜI — vành ngoại ô: quét 15 kỷ × 5 bậc, mọi vật cũ giữ nguyên toạ độ và thứ tự', () => {
  let grew = 0;
  for (const era of ERAS) {
    let prev = deriveOutskirts({ era, gridSize: GRID, sessionCount: 0 });
    // stage 0 = the old ring exactly: nothing beyond 8 cells
    for (const it of prev) assert.ok(distanceOutsideGrid(it.x, it.y, GRID) <= OUTSKIRT_REACH + 1e-9, `kỷ ${era}: bậc 0 đã có cây ngoài vành 8`);
    const stage0 = prev.length;
    for (const n of LAND_MILESTONES.slice(1)) {
      const next = deriveOutskirts({ era, gridSize: GRID, sessionCount: n });
      const have = new Set(next.map(key));
      for (const it of prev) assert.ok(have.has(key(it)), `kỷ ${era} @${n} phiên: vật ${key(it)} biến mất hoặc dời chỗ`);
      // order: the old items appear in the same relative order (a prefix-stable lattice walk)
      const idx = new Map(next.map((it, i) => [key(it), i]));
      for (let i = 1; i < prev.length; i += 1) assert.ok(idx.get(key(prev[i - 1])) < idx.get(key(prev[i])), `kỷ ${era} @${n}: thứ tự vật cũ đảo`);
      assert.ok(next.length >= prev.length);
      prev = next;
    }
    if (prev.length > stage0) grew += 1;
  }
  assert.ok(grew >= 12, `chỉ ${grew}/15 kỷ có vành lớn lên tới bậc 4 — đất không lớn theo người chơi`);
});

test('CHỈ THÊM, KHÔNG BAO GIỜ DỜI — xóm làng vùng phụ cận nối vào ĐUÔI, và cùng số phiên thì cùng kết quả', () => {
  for (const era of ERAS) {
    const a = deriveHinterland({ era, gridSize: GRID, sessionCount: 0 });
    const b = deriveHinterland({ era, gridSize: GRID, sessionCount: 140 });
    assert.ok(b.length >= a.length, `kỷ ${era}: phụ cận co lại`);
    const co = new Set(b.map(key));
    for (const it of a) assert.ok(co.has(key(it)), `kỷ ${era}: ${key(it)} biến mất hoặc dời chỗ khi đất lớn`);
    assert.deepEqual(deriveHinterland({ era, gridSize: GRID, sessionCount: 140 }), b, 'không tất định');
  }
});

test('CAMERA LÙI THEO ĐẤT: khoảng cách không giảm theo bậc, và kỷ niêm phong với số phiên đóng băng giữ nguyên khung', () => {
  for (const era of [1, 8, 15]) {
    let last = 0;
    for (const n of LAND_MILESTONES) {
      const d = cityOrbitOptions(GRID, era, n).distance;
      assert.ok(d >= last, `kỷ ${era}: camera tiến lại gần khi đất lớn (@${n})`);
      last = d;
    }
    assert.equal(cityOrbitOptions(GRID, era, 60).distance, cityOrbitOptions(GRID, era, 60).distance);
    assert.equal(cityOrbitOptions(GRID, era).distance, cityOrbitOptions(GRID, era, 0).distance, 'không truyền số phiên = bậc 0');
  }
});
