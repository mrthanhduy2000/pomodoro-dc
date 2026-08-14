/**
 * orbit.test.js — camera xoay quanh thành phố.
 *
 * Bất biến số 1: **camera không bao giờ chui xuống dưới sàn hay lật ngược.** Kéo mạnh tay là thao
 * tác bình thường trên điện thoại; nếu góc không bị kẹp thì thành phố sẽ lộn ngược hoặc biến mất,
 * và người dùng không có cách nào tự sửa ngoài việc thoát tab.
 *
 * Bất biến số 2: **thao tác không làm đổi gì thì không được báo "có đổi"** — mỗi lần báo nhầm là
 * một khung hình vẽ thừa, tức là ăn pin vô ích (xem `renderLoop.js`).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CAMERA_DISTANCE_FACTOR,
  CITY_CAMERA_FOV,
  DEFAULT_PITCH,
  DEFAULT_YAW,
  MAX_PITCH,
  MIN_PITCH,
  clampPitch,
  cityOrbitOptions,
  createOrbit,
  orbitPosition,
  wrapYaw,
} from './orbit.js';

test('clampPitch: kẹp trong khoảng an toàn, không chạm 0 và không chạm 90°', () => {
  assert.equal(clampPitch(-99), MIN_PITCH);
  assert.equal(clampPitch(99), MAX_PITCH);
  assert.equal(clampPitch(DEFAULT_PITCH), DEFAULT_PITCH);
  assert.ok(MIN_PITCH > 0, 'pitch = 0 ⇒ camera nằm đúng mặt sàn, không thấy gì');
  assert.ok(MAX_PITCH < Math.PI / 2, 'pitch = 90° ⇒ vector "lên trên" suy biến, cảnh lật');
});

test('wrapYaw: xoay mãi một chiều không làm số lớn dần vô hạn', () => {
  const orbit = createOrbit();
  for (let i = 0; i < 5000; i += 1) orbit.drag(50, 0);
  const { yaw } = orbit.getState();
  assert.ok(yaw >= 0 && yaw < Math.PI * 2, `yaw thoát khỏi [0, 2π): ${yaw}`);

  assert.ok(wrapYaw(-0.5) > 0, 'góc âm phải được đưa về dương');
  assert.ok(Math.abs(wrapYaw(Math.PI * 2 + 0.25) - 0.25) < 1e-9);
});

test('kéo mạnh tay lên/xuống: camera KHÔNG chui xuống dưới sàn', () => {
  const orbit = createOrbit();

  for (let i = 0; i < 200; i += 1) orbit.drag(0, 500);   // kéo hết cỡ xuống → nhìn từ trên
  assert.ok(orbit.getPosition().y > 0, 'camera đã xuống dưới mặt sàn');
  assert.equal(orbit.getState().pitch, MAX_PITCH);

  for (let i = 0; i < 200; i += 1) orbit.drag(0, -500);  // kéo hết cỡ lên → nhìn ngang tầm mắt
  assert.ok(orbit.getPosition().y > 0);
  assert.equal(orbit.getState().pitch, MIN_PITCH);
});

test('chiều kéo đúng quy ước OrbitControls — kéo xuống là nghiêng về góc nhìn từ trên', () => {
  // Đảo dấu chỗ này là bug người dùng cảm thấy ngay ("sao kéo ngược thế") nhưng không ai đọc code
  // mà thấy được. Khoá lại bằng test.
  const orbit = createOrbit();
  const start = orbit.getState();

  orbit.drag(0, 30);
  assert.ok(orbit.getState().pitch > start.pitch, 'kéo XUỐNG phải TĂNG pitch (nhìn từ trên nhiều hơn)');

  orbit.reset();
  orbit.drag(30, 0);
  assert.ok(orbit.getState().yaw < start.yaw || orbit.getState().yaw > Math.PI,
    'kéo SANG PHẢI phải GIẢM yaw');
});

test('drag báo "có đổi" đúng lúc — chạm rồi thả không được sinh khung hình thừa', () => {
  const orbit = createOrbit();
  assert.equal(orbit.drag(0, 0), false, 'kéo 0 pixel mà báo có đổi ⇒ vẽ thừa mỗi lần chạm');
  assert.equal(orbit.drag(10, 0), true);

  // đã kịch trần pitch rồi mà vẫn kéo tiếp cùng chiều → không đổi nữa
  for (let i = 0; i < 200; i += 1) orbit.drag(0, 500);
  assert.equal(orbit.drag(0, 500), false, 'kéo tiếp khi đã kịch trần vẫn báo có đổi ⇒ vẽ thừa liên tục');
});

test('zoom: kẹp trong khoảng, và báo "có đổi" đúng lúc', () => {
  const orbit = createOrbit({ distance: 26, minDistance: 12, maxDistance: 48 });

  assert.equal(orbit.zoom(0.5), true);
  assert.equal(orbit.getState().distance, 13);

  assert.equal(orbit.zoom(0.5), true);
  assert.equal(orbit.getState().distance, 12, 'phải kẹp ở minDistance');
  assert.equal(orbit.zoom(0.5), false, 'đã kịch min mà còn báo đổi ⇒ vẽ thừa');

  for (let i = 0; i < 20; i += 1) orbit.zoom(2);
  assert.equal(orbit.getState().distance, 48, 'phải kẹp ở maxDistance');
  assert.equal(orbit.zoom(2), false);
});

test('orbitPosition: luôn cách target đúng `distance`, ở mọi góc', () => {
  const target = { x: 3, y: 1, z: -2 };
  for (const yaw of [0, 0.7, Math.PI, 5.9]) {
    for (const pitch of [MIN_PITCH, DEFAULT_PITCH, MAX_PITCH]) {
      const p = orbitPosition({ yaw, pitch, distance: 20, target });
      const d = Math.hypot(p.x - target.x, p.y - target.y, p.z - target.z);
      assert.ok(Math.abs(d - 20) < 1e-9, `sai khoảng cách ở yaw=${yaw} pitch=${pitch}: ${d}`);
    }
  }
});

test('orbitPosition: pitch ngoài khoảng vẫn bị kẹp (không tin bên gọi)', () => {
  const wild = orbitPosition({ yaw: 0, pitch: -10, distance: 20 });
  const clamped = orbitPosition({ yaw: 0, pitch: MIN_PITCH, distance: 20 });
  assert.deepEqual(wild, clamped);
});

test('reset đưa về đúng góc mặc định — cùng hướng nhìn với bộ vẽ 2D', () => {
  const orbit = createOrbit({ distance: 26 });
  orbit.drag(400, 300);
  orbit.zoom(0.5);
  orbit.reset();

  assert.deepEqual(orbit.getState(), {
    yaw: DEFAULT_YAW,
    pitch: DEFAULT_PITCH,
    distance: 26,
    target: { x: 0, y: 0, z: 0 },
  });
});

test('set(): đặt thẳng góc cho hoạt hoạ, bỏ qua giá trị rác', () => {
  const orbit = createOrbit({ minDistance: 12, maxDistance: 48 });

  orbit.set({ yaw: 1, pitch: 0.5, distance: 30 });
  assert.deepEqual(orbit.getState().yaw, 1);
  assert.equal(orbit.getState().pitch, 0.5);
  assert.equal(orbit.getState().distance, 30);

  // NaN/undefined từ một hoạt hoạ tính sai không được phá trạng thái camera
  orbit.set({ yaw: NaN, pitch: undefined, distance: 'gần' });
  assert.equal(orbit.getState().yaw, 1);
  assert.equal(orbit.getState().pitch, 0.5);
  assert.equal(orbit.getState().distance, 30);

  // vẫn phải kẹp
  orbit.set({ pitch: 99, distance: 9999 });
  assert.equal(orbit.getState().pitch, MAX_PITCH);
  assert.equal(orbit.getState().distance, 48);
});

test('getState/getTarget trả BẢN SAO — bên ngoài không sửa lén được camera', () => {
  const orbit = createOrbit();
  const state = orbit.getState();
  state.target.x = 999;
  assert.equal(orbit.getTarget().x, 0, 'trả tham chiếu ⇒ một component vô tình sửa là camera lệch');
});

// ─── KHUNG HÌNH THEO CHIỀU CAO CỦA KỶ ────────────────────────────────────────

test('KHÔNG CẮT NGỌN: công trình cao nhất của mọi kỷ đều nằm trong khung hình', async () => {
  // ⚠️ BÀI TEST NÀY SINH RA TỪ MỘT LỖI ĐO ĐƯỢC, không phải từ lo xa.
  // Khi `massScale` ra đời (2026-08-14), chiều cao công trình trải 0,36–1,72 lần. Với khung hình
  // cố định cũ, nóc tháp kỷ 15 nằm ở 13,7° dưới đường chân trời trong khi mép TRÊN khung hình ở
  // 15,4° — lọt ra ngoài đúng 1,3°, và ảnh quét cho thấy tháp bị cắt cụt nóc. Không có gì đỏ lên:
  // build xanh, lint sạch, 572 bài test xanh. Chỉ có mắt nhìn vào ảnh mới bắt được.
  //
  // Hình học: camera nhìn xuống một góc `pitch`; khung hình trải `fov/2` về mỗi phía. Mép TRÊN
  // khung hình vì vậy nằm ở `pitch − fov/2` (tính từ phương ngang, hướng xuống). Một điểm nằm cao
  // hơn góc đó thì KHÔNG lọt vào ảnh.
  const [{ buildBuildingSpec }, { BLUEPRINT_CATALOG, BUILDING_EFFECTS }] = await Promise.all([
    import('./buildingSpec.js'),
    import('../constants.js'),
  ]);

  const GRID = 12;
  const halfFov = ((CITY_CAMERA_FOV / 2) * Math.PI) / 180;
  // Đòi nóc nhà nằm SÂU trong khung ít nhất 3°, không phải "vừa đúng mép". Vừa đúng mép nghĩa là
  // chỉ cần đổi tỉ lệ khung hình một chút là lại cắt — một hàng rào dựng ngay sát vực.
  const MARGIN = (3 * Math.PI) / 180;

  for (let era = 1; era <= 15; era += 1) {
    const opts = cityOrbitOptions(GRID, era);
    const orbit = createOrbit(opts);
    const { yaw, pitch, distance, target } = orbit.getState();
    const eye = orbitPosition({ yaw, pitch, distance, target });

    // Công trình cao nhất của kỷ. Kỳ quan LUÔN đứng ở khu đất trung tâm (`cityLayout.js`), và kỳ
    // quan cũng luôn là thứ cao nhất — nên đo ở tâm lưới là đo đúng ca xấu nhất có thật.
    const tallest = Math.max(...BLUEPRINT_CATALOG[era].map((bp) => buildBuildingSpec({
      bpId: bp.id, era, rarity: bp.rarity,
      type: BUILDING_EFFECTS[bp.id]?.type ?? 'infrastructure',
      level: 3,
    }).height));

    const horizontal = Math.hypot(eye.x, eye.z);
    const angleToRoof = Math.atan2(eye.y - tallest, horizontal);
    const topEdge = pitch - halfFov;

    assert.ok(angleToRoof > topEdge + MARGIN,
      `kỷ ${era}: nóc công trình cao nhất (${tallest.toFixed(2)} đơn vị) nằm ở `
      + `${((angleToRoof * 180) / Math.PI).toFixed(1)}° trong khi mép trên khung hình ở `
      + `${((topEdge * 180) / Math.PI).toFixed(1)}° ⇒ bị cắt ngọn`);
  }
});

test('KỶ THẤP GIỮ NGUYÊN KHUNG SÁT — "không thu quá xa rồi bị mờ"', () => {
  // Vế thứ hai của yêu cầu Đàm, và nó ngược chiều với bài test trên. Bài trên một mình vẫn xanh
  // nếu ta lùi camera thật xa cho MỌI kỷ — mà đó đúng là thứ Đàm vừa bảo bỏ đi. Hai bài kẹp nhau
  // mới thành một hàng rào: vừa đủ xa để không cắt ngọn, vừa đủ gần để nhìn ra chi tiết.
  const GRID = 12;
  const BASE = GRID * CAMERA_DISTANCE_FACTOR;

  // (a) Kỷ nhà THẤP phải tiến VÀO GẦN hơn mức sát, không chỉ "không lùi ra". Đây là nửa dễ quên
  // của yêu cầu: bản đầu kẹp `Math.max(0, …)` nên camera chỉ biết lùi, và kỷ 1 — nơi mọi người bắt
  // đầu — giữ nguyên khoảng cách đóng cho nhà cao gấp ba, ra một bãi cỏ mênh mông.
  for (const era of [1, 2]) {
    const opts = cityOrbitOptions(GRID, era);
    assert.ok(opts.distance < BASE,
      `kỷ ${era} nhà rất thấp mà camera vẫn đứng xa như kỷ nhà cao (${opts.distance.toFixed(2)})`);
    assert.equal(opts.target.y, 0, `kỷ ${era}: nâng điểm ngắm lên vô cớ ⇒ mặt đất tụt khỏi khung`);
  }

  // (b) Hai TRẦN kẹp hai đầu. Không kỷ nào được lùi quá 1,35 lần mức sát (đo được cao nhất 1,29)
  // và không kỷ nào được dí sát hơn 0,86 lần (đo được thấp nhất 0,88). Thiếu vế dưới thì một bản
  // sửa "dí thật gần cho rõ" sẽ cắm camera vào giữa thành phố mà không có gì đỏ lên.
  for (let era = 1; era <= 15; era += 1) {
    const ratio = cityOrbitOptions(GRID, era).distance / BASE;
    assert.ok(ratio <= 1.35,
      `kỷ ${era} lùi ra ${ratio.toFixed(2)} lần mức sát — quay lại đúng cái "thu quá xa rồi bị mờ"`);
    assert.ok(ratio >= 0.86,
      `kỷ ${era} dí vào ${ratio.toFixed(2)} lần mức sát — camera chui vào giữa thành phố`);
  }

  // (c) …và kỷ cao thì PHẢI lùi thật, nếu không bài "không cắt ngọn" ở trên chỉ đang may mắn.
  assert.ok(cityOrbitOptions(GRID, 15).distance > cityOrbitOptions(GRID, 1).distance * 1.3,
    'kỷ 15 cao gần gấp 5 lần kỷ 1 mà khung hình gần như y hệt nhau');
});

test('kỷ lạ vẫn ra được khung hình dùng được', () => {
  for (const era of [0, 16, NaN, undefined, 'bảy']) {
    const opts = cityOrbitOptions(12, era);
    assert.ok(Number.isFinite(opts.distance) && opts.distance > 0, `kỷ ${era}: khoảng cách hỏng`);
    assert.ok(Number.isFinite(opts.target.y), `kỷ ${era}: điểm ngắm hỏng`);
  }
});
