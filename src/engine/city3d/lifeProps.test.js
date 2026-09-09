/**
 * lifeProps.test.js · waterProps.test.js in one — the props that move and the signs of life (round 49,
 * ADR-089). Laws: deterministic; appended (nothing existing moves); on the right ground (boats on
 * water, stalls by a road); every era with a big enough water has boats; every era has life.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCityLayout } from '../cityLayout.js';
import { BLUEPRINT_CATALOG } from '../constants.js';
import { deriveLifeProps, ERA_LIFE, LIFE_KINDS } from './lifeProps.js';
import { deriveWaterProps, ERA_BOATS } from './waterProps.js';
import { buildSetting } from './setting.js';
import { buildPropSpec, PROP_KINDS } from './propSpec.js';
import { motionKindForRole, MOTION_KIND } from './motion.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const key = (p) => `${p.kind}|${p.x}|${p.y}`;
function layoutOf(era, sessionCount = 40) {
  const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  const levels = Object.fromEntries(built.map((id) => [id, 3]));
  return computeCityLayout({ built, levels, era, stats: { sessionCount, streakLength: 9 } });
}

test('MỌI KỶ CÓ DẤU VẾT NGƯỜI Ở: bảng đủ 15 kỷ, mọi loại đều dựng được, và mỗi bố cục có ≥ 3 đạo cụ sinh hoạt', () => {
  assert.equal(Object.keys(ERA_LIFE).length, 15);
  for (const kind of LIFE_KINDS) {
    assert.ok(PROP_KINDS.includes(kind), `loại "${kind}" khai trong ERA_LIFE nhưng propSpec không dựng được`);
    const spec = buildPropSpec({ kind, era: 6, seed: 't' });
    assert.ok(spec.parts.length >= 2 && spec.triangles < 1500, `${kind}: ${spec.parts.length} khối, ${spec.triangles} tam giác`);
  }
  for (const era of ERAS) {
    const life = layoutOf(era).props.filter((p) => p.life);
    assert.ok(life.length >= 3, `kỷ ${era}: chỉ ${life.length} đạo cụ sinh hoạt`);
  }
});

test('CHỈ THÊM, KHÔNG DỜI: mọi đạo cụ cũ của bố cục giữ nguyên chỗ khi có đạo cụ sinh hoạt; sinh hoạt không đè lên gì', () => {
  for (const era of ERAS) {
    const layout = layoutOf(era);
    const life = layout.props.filter((p) => p.life);
    const others = layout.props.filter((p) => !p.life);
    const taken = new Set([
      ...layout.buildings.map(key), ...layout.dwellings.map((d) => `x|${d.x}|${d.y}`), ...others.map((p) => `x|${p.x}|${p.y}`),
      ...layout.covers.map((c) => `x|${c.x}|${c.y}`),
    ].map((k) => k.replace(/^[^|]*\|/, 'x|')));
    for (const p of life) assert.ok(!taken.has(`x|${p.x}|${p.y}`), `kỷ ${era}: ${p.kind} đè lên ô (${p.x},${p.y}) đã có chủ`);
    // deterministic: the same call gives the same list
    const again = layoutOf(era).props.filter((p) => p.life).map(key);
    assert.deepEqual(life.map(key), again);
    // the derivation itself is pure in its inputs
    const blocked = new Set(); const roads = new Set(['1,1', '2,1']); const homes = new Set(['1,2']);
    assert.deepEqual(deriveLifeProps({ era, blocked, roads, homes }), deriveLifeProps({ era, blocked, roads, homes }));
  }
});

test('THUYỀN: mọi kỷ khai thuyền đều có thuyền TRÊN NƯỚC, cách nhau ≥ 1,5 ô, tất định; kỷ không nước không có thuyền', () => {
  for (const era of ERAS) {
    const boats = deriveWaterProps({ era, gridSize: 12 });
    const plan = ERA_BOATS[era];
    if (!plan) { assert.equal(boats.length, 0, `kỷ ${era} không khai thuyền mà vẫn có`); continue; }
    assert.ok(boats.length >= Math.min(plan.count, 1), `kỷ ${era}: 0 thuyền dù khai ${plan.count}`);
    const setting = buildSetting({ era, gridSize: 12 });
    for (const b of boats) {
      assert.ok(setting.insetAt(b.x, b.y) > 0.25, `kỷ ${era}: thuyền ở (${b.x},${b.y}) không nằm trong nước`);
      assert.equal(b.onWater, true);
    }
    for (let i = 0; i < boats.length; i += 1) for (let j = i + 1; j < boats.length; j += 1) {
      assert.ok(Math.hypot(boats[i].x - boats[j].x, boats[i].y - boats[j].y) >= 1.5, `kỷ ${era}: hai thuyền dính nhau`);
    }
    assert.deepEqual(deriveWaterProps({ era, gridSize: 12 }), boats, 'không tất định');
    const spec = buildPropSpec({ kind: 'boat', era, seed: 'b' });
    assert.ok(spec.parts.some((p) => p.role === 'hull'), `kỷ ${era}: thuyền không có thân (hull)`);
  }
  const withSails = [2, 8, 14, 15].map((era) => buildPropSpec({ kind: 'boat', era, seed: 'b' }).parts.some((p) => p.role === 'canvas'));
  assert.deepEqual(withSails, [true, true, true, true], 'felucca · caravel · yacht · dhow phải có buồm');
});

test('VAI → CHUYỂN ĐỘNG (vòng 49): thân thuyền và móc cẩu nhấp nhô, vải bay; cờ trên kỳ đài kỷ 8 và phướn kỷ 4/7 là VẢI', () => {
  assert.equal(motionKindForRole('hull'), MOTION_KIND.bob);
  assert.equal(motionKindForRole('hook'), MOTION_KIND.bob);
  assert.equal(motionKindForRole('canvas'), MOTION_KIND.flap, 'buồm, mái che, khăn phơi là canvas — phải bay');
  assert.equal(motionKindForRole('flag'), MOTION_KIND.flap, 'cờ, phướn là flag — phải bay');
});
