import test from 'node:test';
import assert from 'node:assert/strict';

import { EYE_HEIGHT, LOOK_AHEAD, STEP, WALK_FOV, WALK_NEAR, createWalker } from './walk.js';
import { createOrbit, orbitPosition } from './orbit.js';
import { computeCityLayout } from '../cityLayout.js';
import { BLUEPRINT_CATALOG } from '../constants.js';

function roadsOf(era, sessionCount = 140) {
  const ids = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  const layout = computeCityLayout({ built: ids, levels: Object.fromEntries(ids.map((id) => [id, 3])), era, stats: { sessionCount, streakLength: 9 } });
  return { roadCells: layout.props.filter((p) => p.kind === 'road'), gridSize: layout.gridSize };
}

test('ROUND 50 (ADR-090): NGƯỜI ĐI BỘ đứng được trên đường của CẢ 15 KỶ, và không bao giờ đi xuyên tường', () => {
  for (let era = 1; era <= 15; era += 1) {
    const w = createWalker(roadsOf(era));
    assert.ok(w.start(), `kỷ ${era}: không tìm được ô đường để xuống phố`);
    const s0 = w.state();
    // walk forward until blocked: every position along the way must be on a road cell
    let steps = 0;
    while (w.advance(1) && steps < 400) steps += 1;
    assert.ok(steps >= 3, `kỷ ${era}: mới ${steps} bước đã kẹt — đường không đi được`);
    const s1 = w.state();
    assert.ok(Math.hypot(s1.x - s0.x, s1.z - s0.z) > STEP * 2, `kỷ ${era}: không dịch chuyển`);
    // blocked now: one more step must refuse and leave the position untouched (no wall-clipping)
    const before = w.state();
    assert.equal(w.advance(1), false);
    assert.deepEqual(w.state(), before);
  }
});

test('NGƯỜI ĐI BỘ LÀ MỘT TRẠNG THÁI CỦA CHÍNH CẦN CẨU `orbit` — không có hệ camera thứ hai', () => {
  const w = createWalker(roadsOf(8));
  w.start();
  const st = w.orbitState();
  assert.equal(st.distance, LOOK_AHEAD);
  // the eye the orbit computes from that state IS the walker's position at eye height
  const eye = orbitPosition(st, { free: true });
  const p = w.state();
  assert.ok(Math.abs(eye.x - p.x) < 1e-9 && Math.abs(eye.z - p.z) < 1e-9, 'mắt phải đứng đúng chỗ người đứng');
  assert.ok(Math.abs(eye.y - EYE_HEIGHT) < 1e-9, `mắt phải ở tầm người (${EYE_HEIGHT}), không phải trên trời`);
  // …and it stands ON the ground it is given: a floor at +0,4 raises the eye by exactly that much
  const raised = createWalker({ ...roadsOf(8), groundAt: () => 0.4 });
  raised.start();
  assert.ok(Math.abs(orbitPosition(raised.orbitState(), { free: true }).y - (0.4 + EYE_HEIGHT)) < 1e-9,
    'mắt phải đứng trên MẶT ĐẤT của chỗ ấy — thiếu tầng đất thì camera chui xuống dưới thềm');
  // looking up: negative orbit pitch — the overview crane would refuse it, the walking crane accepts it
  w.look(0, -0.5);
  const up = w.orbitState();
  assert.ok(up.pitch < 0 && up.target.y > EYE_HEIGHT, 'ngước lên ⇒ góc cần cẩu ÂM và điểm nhìn cao hơn mắt');
  const orbit = createOrbit({ distance: 26, minDistance: 12, maxDistance: 48 });
  orbit.setWalk(true);
  orbit.set(w.orbitState());
  const o = orbit.getPosition();
  assert.ok(Math.abs(o.y - EYE_HEIGHT) < 1e-9, 'cần cẩu ở chế độ đi bộ phải đặt camera ở tầm mắt');
  orbit.setWalk(false);
  assert.ok(orbit.getState().distance >= 12, 'rời chế độ đi bộ ⇒ khoảng cách kẹp lại về toàn cảnh');
  assert.ok(orbit.getState().pitch >= 0.18, 'rời chế độ đi bộ ⇒ góc ngẩng kẹp lại về sàn toàn cảnh');
});

test('ĐI BỘ LÀ TẤT ĐỊNH: cùng bố cục, cùng thao tác ⇒ cùng vị trí; và các hằng số đọc được', () => {
  const a = createWalker(roadsOf(6)); const b = createWalker(roadsOf(6));
  a.start(); b.start();
  for (const [t, n] of [[0, 3], [Math.PI / 2, 2], [-Math.PI / 2, 5]]) { a.turn(t); b.turn(t); a.advance(n); b.advance(n); }
  assert.deepEqual(a.state(), b.state());
  assert.ok(WALK_FOV > 38 && WALK_NEAR < 0.5, 'tầm nhìn phải rộng hơn và mặt cắt gần phải sát hơn toàn cảnh');
  assert.equal(createWalker({ roadCells: [], gridSize: 12 }).start(), false, 'không có đường thì không xuống phố được');
});
