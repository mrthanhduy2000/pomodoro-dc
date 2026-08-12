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
  DEFAULT_PITCH,
  DEFAULT_YAW,
  MAX_PITCH,
  MIN_PITCH,
  clampPitch,
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
