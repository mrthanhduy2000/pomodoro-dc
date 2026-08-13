import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TEXT_ENDS_PCT,
  GUARD_END_PCT,
  LEGACY_STOPS,
  SCRIM_STOPS,
  opacityAt,
  cityPresenceAt,
  buildScrimGradient,
} from './cityBackdropScrim.js';

/**
 * LỚP PHỦ TRANG CHỦ — hai lời hứa phải cùng đúng, không được đổi cái này lấy cái kia.
 *
 * Lời hứa A (KHÔNG ĐƯỢC PHÉP HỎNG): ở mọi độ sâu có chữ, lớp phủ mới không bao giờ nhạt hơn bản
 * đã chạy trước 2026-08-13 ⇒ chữ không khó đọc hơn một phần nghìn nào.
 * Lời hứa B (LÝ DO TỒN TẠI CỦA THAY ĐỔI): ở vùng KHÔNG có chữ, thành phố phải lộ ra rõ hơn HẲN,
 * đủ để sáu chặng ngày phân biệt được bằng mắt.
 *
 * ⚠️ Vì sao phải quét TỪNG PHẦN TRĂM chứ không kiểm vài mốc: `linear-gradient` nội suy giữa các
 * mốc, nên hai hồ sơ có thể bằng nhau ở mọi mốc mà vẫn cắt nhau ở GIỮA hai mốc. Kiểm mốc là cái
 * phễu, không phải hàng rào — đúng cái bẫy "ngưỡng một phía" đã trả giá nhiều lần trong dự án này.
 */

const BACKDROP_OPACITY = 0.5; // giữ khớp với hằng số cùng tên trong `CityBackdrop.jsx`

test('LỜI HỨA A: ở MỌI độ sâu có chữ, lớp phủ mới KHÔNG BAO GIỜ nhạt hơn bản cũ', () => {
  for (const khung of ['desktop', 'phone']) {
    const stops = SCRIM_STOPS[khung];
    const guard = GUARD_END_PCT[khung];

    // Quét từng phần trăm một, KHÔNG chỉ tại các mốc.
    for (let p = 0; p <= guard; p += 1) {
      const moi = opacityAt(stops, p);
      const cu = opacityAt(LEGACY_STOPS, p);
      assert.ok(
        moi >= cu - 1e-9,
        `[${khung}] Ở ${p}% chiều cao, lớp phủ mới ${moi.toFixed(2)}% NHẠT HƠN bản cũ `
        + `${cu.toFixed(2)}% — tức chữ ở đó khó đọc hơn trước. Đây là điều file này tồn tại để `
        + 'ngăn: mở thành phố ra là việc của vùng KHÔNG có chữ, không bao giờ đổi bằng khả năng đọc.',
      );
    }
  }
});

test('MỐC BẢO VỆ phải phủ hết chỗ chữ thật đứng, còn dư khoảng đệm', () => {
  for (const khung of ['desktop', 'phone']) {
    assert.ok(
      GUARD_END_PCT[khung] > TEXT_ENDS_PCT[khung],
      `[${khung}] Mốc bảo vệ ${GUARD_END_PCT[khung]}% không vượt quá chỗ chữ kết thúc `
      + `${TEXT_ENDS_PCT[khung]}% — không còn khoảng đệm nào cho việc chữ xuống thêm một hàng.`,
    );
    assert.ok(
      GUARD_END_PCT[khung] - TEXT_ENDS_PCT[khung] >= 5,
      `[${khung}] Khoảng đệm chỉ ${GUARD_END_PCT[khung] - TEXT_ENDS_PCT[khung]} điểm — quá mỏng. `
      + 'Cỡ chữ đổi theo thiết lập hệ điều hành, một dòng lời chào dài sẽ tràn qua mốc.',
    );
  }
});

test('LỜI HỨA B: dưới vùng chữ, thành phố phải lộ ra RÕ HƠN HẲN', () => {
  for (const khung of ['desktop', 'phone']) {
    const stops = SCRIM_STOPS[khung];

    // Ở ĐÁY — chỗ chắc chắn không có chữ ở cả hai khung — thành phố phải hiện gần như trọn vẹn.
    const dayMoi = cityPresenceAt(stops, 100, BACKDROP_OPACITY);
    const dayCu = cityPresenceAt(LEGACY_STOPS, 100, BACKDROP_OPACITY);
    assert.ok(
      dayMoi >= dayCu * 1.4,
      `[${khung}] Ở đáy, thành phố chỉ còn ${dayMoi.toFixed(3)} so với ${dayCu.toFixed(3)} của bản `
      + 'cũ — chưa đủ để gọi là mở ra. Đáy trang không có một chữ nào, nên không có lý do gì phải mờ.',
    );

    // Và ở KHOẢNG GIỮA-DƯỚI (75%) — nơi hai dải thành phố lộ ra hai bên thẻ đồng hồ, tức đúng chỗ
    // phép đo 14/255 đã lấy mẫu — cũng phải hơn hẳn, không chỉ hơn ở mỗi cái đáy.
    const giuaMoi = cityPresenceAt(stops, 75, BACKDROP_OPACITY);
    const giuaCu = cityPresenceAt(LEGACY_STOPS, 75, BACKDROP_OPACITY);
    assert.ok(
      giuaMoi >= giuaCu * 1.3,
      `[${khung}] Ở 75% chiều cao, thành phố ${giuaMoi.toFixed(3)} so với ${giuaCu.toFixed(3)} — `
      + 'chưa đủ hơn. Đây mới là dải Đàm thật sự nhìn thấy hai bên thẻ đồng hồ.',
    );
  }
});

test('Hồ sơ phải LIÊN TỤC và một chiều: không có bậc thang, không có chỗ đậm trở lại', () => {
  for (const khung of ['desktop', 'phone']) {
    const stops = SCRIM_STOPS[khung];
    assert.equal(stops[0][0], 0, `[${khung}] Mốc đầu phải ở 0%.`);
    assert.equal(stops[stops.length - 1][0], 100, `[${khung}] Mốc cuối phải ở 100%.`);
    for (let i = 1; i < stops.length; i += 1) {
      assert.ok(stops[i][0] > stops[i - 1][0], `[${khung}] Các mốc phải tăng dần theo chiều cao.`);
      assert.ok(
        stops[i][1] <= stops[i - 1][1],
        `[${khung}] Lớp phủ đậm trở lại ở ${stops[i][0]}% — nhìn ra thành một vệt tối lơ lửng giữa `
        + 'trang, không ai đọc ra đó là chủ ý.',
      );
    }
  }
});

test('Chuỗi CSS sinh ra phải dùng biến theme, không có mã màu chốt cứng', () => {
  for (const isPhone of [false, true]) {
    const css = buildScrimGradient(isPhone);
    assert.ok(css.startsWith('linear-gradient(to bottom,'), 'Phải là gradient dọc.');
    assert.ok(
      !/#[0-9a-fA-F]{3,8}\b/.test(css) && !/\brgba?\(/.test(css),
      `Có mã màu chốt cứng trong lớp phủ: ${css}. App có 2 theme × 4 skin — mã cứng sai ở 7/8 tổ hợp.`,
    );
    assert.equal(
      (css.match(/var\(--canvas\)/g) ?? []).length,
      (isPhone ? SCRIM_STOPS.phone : SCRIM_STOPS.desktop).length,
      'Mỗi mốc phải pha từ chính `var(--canvas)` của theme đang bật.',
    );
  }
});

test('opacityAt: kẹp đúng hai đầu và nội suy đúng giữa hai mốc', () => {
  const stops = [[0, 100], [50, 50], [100, 0]];
  assert.equal(opacityAt(stops, -20), 100, 'Dưới 0 phải kẹp về mốc đầu.');
  assert.equal(opacityAt(stops, 0), 100);
  assert.equal(opacityAt(stops, 25), 75, 'Giữa hai mốc phải là nội suy tuyến tính.');
  assert.equal(opacityAt(stops, 50), 50);
  assert.equal(opacityAt(stops, 75), 25);
  assert.equal(opacityAt(stops, 100), 0);
  assert.equal(opacityAt(stops, 140), 0, 'Trên 100 phải kẹp về mốc cuối.');
});

test('cityPresenceAt: phải nhân CẢ HAI lớp mờ, không chỉ lớp phủ', () => {
  // Bẫy đã làm bản gốc mờ hơn người viết tưởng: lớp phủ 34% ở đáy nghe như "còn hai phần ba",
  // nhưng còn phải nhân với BACKDROP_OPACITY nữa.
  // (So sánh có dung sai — 0,5 × 0,66 ra 0.32999999999999996 trong số thực dấu phẩy động.)
  assert.ok(Math.abs(cityPresenceAt([[0, 34], [100, 34]], 50, 0.5) - 0.33) < 1e-9);
  assert.equal(cityPresenceAt([[0, 0], [100, 0]], 50, 0.5), 0.5, 'Không lớp phủ ⇒ đúng bằng độ mờ nền.');
  assert.equal(cityPresenceAt([[0, 100], [100, 100]], 50, 0.5), 0, 'Lớp phủ kín ⇒ mất hẳn thành phố.');
});
