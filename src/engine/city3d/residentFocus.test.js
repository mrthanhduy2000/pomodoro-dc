/**
 * residentFocus.test.js — round 57, Việc 6. Hộp chạm và tấm thẻ của một cư dân.
 *
 * ⚠️ BÀI ĐẦU TIÊN LÀ BÀI VỀ HÌNH DẠNG HỘP, và nó tồn tại vì bản đầu của `residentBox` khai hộp
 * LỒNG NHAU (`{min:{x}}`) trong khi cả `pick.js` dùng hộp PHẲNG (`minX`…). Sai ấy không ném, không
 * cảnh báo: `rayBoxDistance` chỉ đọc ra `undefined` ở mọi trục và không bao giờ trúng — chạm vào
 * một cư dân sẽ im lặng không làm gì. Nối hai file bằng một bài test là cách duy nhất bắt được.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { orbitPosition } from './orbit.js';
import { rayBoxDistance } from './pick.js';
import { getHumanStyle } from './humanStyle.js';
import {
  RESIDENT_VIEW_FACTOR, planResidentFocus, residentBox, residentCaption, residentEye,
  residentViewDistance,
} from './residentFocus.js';

test('HỘP CHẠM PHẢI ĐÚNG HÌNH DẠNG MÀ `pick.js` ĐỌC — nếu không, cú chạm im lặng trượt', () => {
  const box = residentBox({ x: 2, y: 0.5, z: -3 }, 0.9);
  for (const k of ['minX', 'maxX', 'minY', 'maxY', 'minZ', 'maxZ']) {
    assert.equal(typeof box[k], 'number', `hộp thiếu \`${k}\` — \`rayBoxDistance\` sẽ đọc undefined`);
  }
  // Một tia bắn thẳng vào người phải TRÚNG, và con số trả về phải là khoảng cách thật.
  const t = rayBoxDistance({ x: 2, y: 1.0, z: -10 }, { x: 0, y: 0, z: 1 }, box);
  assert.ok(t !== null && t > 0, 'tia bắn thẳng vào cư dân mà không trúng hộp chạm');
  // Một tia bắn ra chỗ khác phải TRƯỢT — nếu không thì hộp to vô hạn và ai cũng "trúng".
  assert.equal(rayBoxDistance({ x: 40, y: 1, z: -10 }, { x: 0, y: 0, z: 1 }, box), null,
    'tia bắn ra ngoài vẫn trúng ⇒ hộp chạm không còn phân biệt được ai với ai');
});

test('HỘP BAO TRỌN NGƯỜI THEO CHIỀU CAO, VÀ NỞ RA THEO CHIỀU NGANG', () => {
  const height = 0.9;
  const box = residentBox({ x: 0, y: 0, z: 0 }, height);
  assert.ok(box.maxY >= height, 'hộp thấp hơn đỉnh đầu — chạm vào mặt sẽ trượt');
  assert.ok(box.maxX - box.minX > 0.3,
    'hộp bó sát vai thì ở cỡ 20 điểm ảnh gần như không chạm trúng được (xem chú thích Việc 5)');
  assert.equal(residentBox({ x: 0, y: 0, z: 0 }, 0), null, 'chiều cao 0 phải trả null, không dựng hộp rỗng');
  assert.equal(residentBox({ x: NaN, y: 0, z: 0 }, 1), null, 'toạ độ hỏng phải trả null');
});

test('ĐỨNG XA THEO CHIỀU CAO NGƯỜI — không dùng lại con số của công trình', () => {
  // ⚠️ `FOCUS_VIEW_DISTANCE = 7,5` là cho một công trình cao ~7 đơn vị. Một người cao <1 đơn vị;
  // dùng lại 7,5 là đứng xa gấp bảy lần mức cần, tức đúng cái cận cảnh KHÔNG cận cảnh mà Việc 5 đo
  // được (22 điểm ảnh, còn nhỏ hơn cả khung toàn cảnh).
  const gan = residentViewDistance(0.9);
  assert.ok(gan < 7.5 / 2, `đứng cách ${gan.toFixed(2)} — vẫn quá xa so với một người cao 0,9`);
  assert.ok(residentViewDistance(1.8) > residentViewDistance(0.9),
    'người cao hơn thì phải đứng xa hơn — đây là một QUAN HỆ, không phải một hằng số');
  assert.equal(residentViewDistance(0.9), 0.9 * RESIDENT_VIEW_FACTOR);
  assert.ok(residentViewDistance(0.001) >= 0.6, 'phải có sàn, không thì camera chui vào trong đầu');
});

test('NGẮM NGANG MẶT, KHÔNG NGẮM GIỮA THÂN', () => {
  // Ngắm giữa thân thì khuôn mặt — thứ ba vòng vừa qua dựng ra — nằm ở mép trên khung hình.
  const eye = residentEye({ x: 0, y: 0, z: 0 }, 1.0, 0.22);
  assert.ok(eye.y > 0.8, `ngắm ở ${eye.y} — thấp quá, mặt sẽ trôi lên mép khung`);
  assert.ok(eye.y < 1.0, 'ngắm cao hơn cả đỉnh đầu');
});

test('TẤM THẺ ĐỌC TỪ TỦ ĐỒ THẬT CỦA 15 KỶ — không chép lại một sự thật thứ hai', () => {
  for (let era = 1; era <= 15; era += 1) {
    const the = residentCaption(getHumanStyle(era), `Kỷ ${era}`);
    assert.ok(the.country && the.country !== '—', `kỷ ${era} không có tên nước`);
    assert.ok(the.place && the.place !== '—', `kỷ ${era} không có nơi chốn`);
    assert.ok(/ · /.test(the.dress), `kỷ ${era} tấm thẻ không nói đủ "mặc gì · đội gì": ${the.dress}`);
    assert.ok(!/undefined/.test(JSON.stringify(the)), `kỷ ${era} tấm thẻ lọt \`undefined\``);
  }
  // Tủ đồ đổi thì tấm thẻ phải đổi theo — chứng minh nó ĐỌC chứ không chép.
  const gia = residentCaption({ country: 'X', note: 'Nơi kia — abc', garment: 'suit', headgear: 'helm' }, 'K');
  assert.equal(gia.place, 'Nơi kia');
  assert.equal(gia.dress, 'âu phục · mũ sắt');
  assert.equal(residentCaption(null), null);
});

test('ĐỨNG TRƯỚC MẶT, KHÔNG ĐỨNG SAU GÁY — đối chiếu thẳng với `orbitPosition`', () => {
  /*
    ⚠️ Sai dấu `yaw` cho ra một cận cảnh nhìn vào GÁY: hình học hợp lệ, không gì đỏ, và chỉ một tấm
    ảnh mới nói ra. Nên bài này không tin công thức — nó DỰNG camera bằng đúng `orbitPosition` của
    app rồi hỏi: điểm ấy có nằm về phía người đang NHÌN không?
    Hướng nhìn của người là `(cos angle, sin angle)` trong (x, z) — xem `residentYaw`.
  */
  for (const angle of [0, 0.4, 1.2, Math.PI / 2, Math.PI, -2.0, 3.9]) {
    const eye = { x: 3, y: 1, z: -2 };
    const plan = planResidentFocus({ resident: { eye, height: 0.9, angle } });
    const cam = orbitPosition(plan);
    const toiCamera = { x: cam.x - eye.x, z: cam.z - eye.z };
    const nhin = { x: Math.cos(angle), z: Math.sin(angle) };
    const dai = Math.hypot(toiCamera.x, toiCamera.z) || 1;
    const dot = (toiCamera.x / dai) * nhin.x + (toiCamera.z / dai) * nhin.z;
    assert.ok(dot > 0.99,
      `góc ${angle.toFixed(2)}: camera nằm lệch ${Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI}`
      + '° so với hướng người đang nhìn — quá 90° nghĩa là đang chụp sau gáy');
  }
});

test('VƯỚNG THÌ ĐI VÒNG QUANH, KHÔNG LÙI RA — đó là chỗ `planCityFocus` sai với người', () => {
  /*
    ⚠️ Đo được ở vòng 57: gọi `planCityFocus` cho một cư dân cao 0,204 xin đứng cách 0,60 thì nó
    trả về **6,10** — quay lại đúng cỡ toàn cảnh, vì hai cần gạt của nó là ngẩng và lùi.
    THỬ-CHO-ĐỎ (đã chạy): bỏ vòng lặp "đi vòng quanh" ⇒ bài này trả `backed > 0` và đỏ.
  */
  const eye = { x: 0, y: 1, z: 0 };
  // Chắn đúng phía trước mặt (yaw = π/2 − 0 = π/2 ⇒ camera ở +x), thoáng ở mọi phía khác.
  const clearanceOf = (to) => (Math.abs(to.yaw - Math.PI / 2) < 0.05 ? 0 : 1);
  const plan = planResidentFocus({ resident: { eye, height: 0.9, angle: 0 }, clearanceOf });
  assert.equal(plan.backed, 0, `đã lùi ra ${plan.backed} thay vì đi vòng — đúng khuyết tật của planCityFocus`);
  assert.ok(Math.abs(plan.turned) > 0, 'không xoay gì mà vẫn nhận một hướng đang bị chắn');
  assert.equal(plan.distance, residentViewDistance(0.9), 'khoảng cách phải giữ nguyên khi đi vòng');
  // Lệch ÍT NHẤT có thể: 20°, không phải 160°.
  assert.ok(Math.abs(plan.turned) <= Math.PI / 9 + 1e-9,
    `xoay tới ${(plan.turned * 180 / Math.PI).toFixed(0)}° trong khi 20° đã thoáng`);
});

test('BỊT KÍN MỌI PHÍA THÌ MỚI LÙI — và vẫn phải trả về một phương án dùng được', () => {
  const eye = { x: 0, y: 1, z: 0 };
  // Thoáng chỉ khi đứng đủ xa — mô phỏng một người kẹt giữa ngõ hẹp.
  const clearanceOf = (to) => (to.distance > 3 ? 1 : 0);
  const plan = planResidentFocus({ resident: { eye, height: 0.9, angle: 0.7 }, clearanceOf });
  assert.ok(plan.backed > 0, 'bịt kín mọi phía mà không lùi ⇒ camera sẽ nằm trong tường');
  assert.ok(plan.distance > 3, 'lùi mà vẫn chưa thoáng');
  assert.ok(Number.isFinite(plan.yaw) && Number.isFinite(plan.pitch), 'phương án trả về phải dùng được');
});

test('NHÌN GẦN NGANG TẦM MẮT, KHÔNG NHÌN TỪ TRÊN XUỐNG', () => {
  const plan = planResidentFocus({ resident: { eye: { x: 0, y: 1, z: 0 }, height: 0.9, angle: 0 } });
  assert.ok(plan.pitch <= 0.2,
    `góc ngẩng ${(plan.pitch * 180 / Math.PI).toFixed(1)}° — nhìn một người từ trên xuống là nhìn đỉnh đầu`);
});
