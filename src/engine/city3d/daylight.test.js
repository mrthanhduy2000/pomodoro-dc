import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DAYLIGHT_PROFILES,
  DAY_PHASES,
  deriveDaylight,
  phaseForHour,
  sunDirectionAt,
} from './daylight.js';

test('mỗi giờ trong ngày đều có một chặng hợp lệ', () => {
  for (let hour = 0; hour < 24; hour += 1) {
    const phase = phaseForHour(hour);
    assert.ok(DAY_PHASES.includes(phase), `giờ ${hour} ra chặng lạ: ${phase}`);
  }
});

test('giờ rác → chặng trung tính, KHÔNG ném lỗi và không ra undefined', () => {
  // Cảnh 3D không được vỡ vì một giá trị giờ hỏng — nó phải vẽ ra một thành phố trông bình thường.
  for (const bad of [undefined, null, NaN, -1, 24, 99, 'chiều', {}]) {
    const light = deriveDaylight(bad);
    assert.equal(light.phase, 'noon');
    assert.ok(Number.isFinite(light.sunEnergy));
  }
});

test('mọi chặng đều khai đủ trường — thiếu một trường là một đèn nhận NaN', () => {
  const needed = [
    'sunAltitude', 'sunWarmth', 'sunEnergy', 'fillEnergy',
    'skyHue', 'skyPull', 'horizonHue', 'horizonPull', 'skySaturation', 'windowsLit', 'lampEnergy',
  ];
  for (const phase of DAY_PHASES) {
    const profile = DAYLIGHT_PROFILES[phase];
    assert.ok(profile, `thiếu hồ sơ cho chặng "${phase}"`);
    for (const key of needed) {
      assert.ok(key in profile, `chặng "${phase}" thiếu trường "${key}"`);
      if (key !== 'windowsLit') {
        assert.ok(Number.isFinite(profile[key]), `chặng "${phase}".${key} không phải số`);
      }
    }
  }
});

test('đèn cửa sổ chỉ bật lúc trời tối, KHÔNG bật giữa trưa', () => {
  // Đây là bài dễ hỏng nhất khi ai đó chỉnh bảng giờ: bật đèn lúc 12 giờ trưa thì cả thành phố
  // trông như hỏng chứ không như "đang sáng đèn".
  assert.equal(deriveDaylight(12).windowsLit, false, 'giữa trưa mà sáng đèn cửa sổ');
  assert.equal(deriveDaylight(9).windowsLit, false, 'buổi sáng mà sáng đèn cửa sổ');
  assert.equal(deriveDaylight(15).windowsLit, false, 'buổi chiều mà sáng đèn cửa sổ');
  assert.equal(deriveDaylight(22).windowsLit, true, 'đêm mà tối om');
  assert.equal(deriveDaylight(3).windowsLit, true, 'rạng sáng mà tối om');
  assert.equal(deriveDaylight(18).windowsLit, true, 'chạng vạng mà chưa lên đèn');
});

test('nắng ẤM lúc bình minh/hoàng hôn và LẠNH lúc đêm — đây là cả nội dung của tính năng', () => {
  assert.ok(deriveDaylight(6).sunWarmth > 0.5, 'bình minh phải ấm');
  assert.ok(deriveDaylight(18).sunWarmth > 0.5, 'hoàng hôn phải ấm');
  assert.ok(deriveDaylight(12).sunWarmth < 0.3, 'giữa trưa phải gần trắng, không vàng rực');
  assert.ok(deriveDaylight(23).sunWarmth < 0, 'đêm phải lạnh');
});

test('mặt trời lên cao nhất vào giữa trưa và thấp nhất lúc bình minh/hoàng hôn', () => {
  const noon = deriveDaylight(12).sunAltitude;
  assert.ok(noon > deriveDaylight(6).sunAltitude, 'trưa phải cao hơn bình minh');
  assert.ok(noon > deriveDaylight(18).sunAltitude, 'trưa phải cao hơn hoàng hôn');
  assert.ok(noon > deriveDaylight(8).sunAltitude, 'trưa phải cao hơn buổi sáng');
});

test('cao độ mặt trời KHÔNG bao giờ chạm 0 — bóng dài vô hạn sẽ tràn khỏi khung bóng', () => {
  for (const phase of DAY_PHASES) {
    assert.ok(DAYLIGHT_PROFILES[phase].sunAltitude >= 0.12,
      `chặng "${phase}" có mặt trời sát chân trời ⇒ bóng đổ sẽ cụt ở rìa lưới`);
  }
});

test('ban đêm dùng đèn nền GẤP NHIỀU LẦN ban ngày — vì đêm bị làm tối HAI LẦN', () => {
  // Bài học đã trả giá bằng HAI ảnh chụp đen kịt: một ở Phase 3C (đèn nền theme tối), một ở Phase
  // 3D (đo được mặt đất `#030401` lúc 22 giờ). Lần thứ hai xảy ra dù `fillEnergy` đêm ĐÃ lớn hơn
  // trưa — chỉ là lớn hơn có 1,58 lần trong khi cần bù tới ~5,8 lần. Vì vậy bài test này khoá
  // TỈ LỆ chứ không chỉ khoá dấu lớn-hơn; xem giải thích "tối hai lần" ở `daylight.js`.
  const ratio = DAYLIGHT_PROFILES.night.fillEnergy / DAYLIGHT_PROFILES.noon.fillEnergy;
  assert.ok(ratio >= 3, `đèn nền đêm chỉ gấp ${ratio.toFixed(2)} lần trưa ⇒ thành phố sẽ đen thui`);
});

test('đèn trong nhà chỉ hắt ra khi trời đã tối — và luôn đi kèm cửa sổ sáng', () => {
  for (const phase of DAY_PHASES) {
    const profile = DAYLIGHT_PROFILES[phase];
    if (profile.lampEnergy > 0) {
      assert.equal(profile.windowsLit, true,
        `chặng "${phase}" hắt sáng ra sân nhưng cửa sổ lại tối ⇒ ánh sáng không có nguồn`);
    } else {
      assert.equal(profile.lampEnergy, 0, `chặng "${phase}" có lampEnergy âm`);
    }
  }
  assert.equal(DAYLIGHT_PROFILES.noon.lampEnergy, 0, 'giữa trưa mà bật đèn sân');
  assert.ok(DAYLIGHT_PROFILES.night.lampEnergy > DAYLIGHT_PROFILES.dawn.lampEnergy,
    'đêm khuya phải sáng đèn hơn lúc rạng sáng');
});

test('bầu trời bị KÉO VỀ MỘT ĐÍCH, không phải cộng thêm N độ', () => {
  // ⚠️ Bài này khoá lại một lỗi đã thấy tận mắt: bản đầu dùng `skyShift` cộng thẳng vào góc màu.
  // Vì góc màu XUẤT PHÁT của bầu trời khác nhau theo theme (sáng ~40°, tối ~231°), cùng một phép
  // "−46°" đẩy trời đêm từ lam sang LỤC LAM và nhuộm cả mặt đất xanh ngọc như dưới nước.
  for (const phase of DAY_PHASES) {
    const profile = DAYLIGHT_PROFILES[phase];
    assert.ok(!('skyShift' in profile),
      `chặng "${phase}" quay lại dùng skyShift (cộng offset) — xem lý do ở daylight.js`);
    for (const key of ['skyHue', 'horizonHue']) {
      assert.ok(profile[key] >= 0 && profile[key] < 360, `${key} của "${phase}" ngoài [0,360)`);
    }
    for (const key of ['skyPull', 'horizonPull']) {
      assert.ok(profile[key] >= 0 && profile[key] <= 1, `${key} của "${phase}" ngoài [0,1]`);
    }
  }

  // Đêm phải kéo về LAM SÂU (200–260°), không phải lục lam (<200°) và không phải tím (>270°).
  const night = DAYLIGHT_PROFILES.night;
  assert.ok(night.skyHue > 200 && night.skyHue < 260, `trời đêm ở góc màu ${night.skyHue}° — không phải lam sâu`);
  // Bình minh và hoàng hôn phải kéo CHÂN TRỜI về vùng ẤM (cam/vàng), tức góc màu nhỏ.
  assert.ok(DAYLIGHT_PROFILES.dawn.horizonHue < 60, 'bình minh phải kéo chân trời về sắc ấm');
  assert.ok(DAYLIGHT_PROFILES.dusk.horizonHue < 60, 'hoàng hôn phải kéo chân trời về sắc ấm');
});

test('ĐỈNH trời luôn lạnh, CHÂN trời giữ hơi ấm — trừ ban đêm là chặng duy nhất cả hai cùng lạnh', () => {
  // ⚠️ Bài này khoá lại lỗi mà chỉ BẢN QUÉT đủ 15 kỷ × 6 chặng mới bắt được, vì nó chỉ hiện ra khi
  // xếp 6 chặng cạnh nhau: hồi cả vòm trời dùng chung MỘT đích, chân trời 8 giờ sáng ra `#cad0d0`
  // — độ tươi 0,06, một dải XÁM CHẾT — vì sắc ấm 40° bị kéo nửa đường sang lam 202° thì rơi đúng
  // vào vùng trung tính ở giữa. Đồng thời bình minh/hoàng hôn thì đích ấm lại kéo cả ĐỈNH trời
  // sang nâu ô-liu. Một đích chung không diễn tả nổi hai vai ngược nhau.
  //
  // "Lạnh" và "ấm" định nghĩa được bằng máy: lạnh = góc màu trong [180, 280) (lục lam → lam →
  // chàm); ấm = ngoài [90, 300) (đỏ → cam → vàng). Nhờ vậy bài test bắt được cả những chặng ai đó
  // thêm về sau, không chỉ sáu chặng đang có.
  const cold = (h) => h >= 180 && h < 280;
  const warm = (h) => h < 90 || h >= 300;

  for (const phase of DAY_PHASES) {
    const { skyHue, horizonHue } = DAYLIGHT_PROFILES[phase];
    assert.ok(cold(skyHue), `đỉnh trời chặng "${phase}" ở ${skyHue}° — đỉnh trời phải luôn lạnh`);
    if (phase === 'night') {
      assert.ok(cold(horizonHue), 'ban đêm chân trời cũng phải lạnh theo đỉnh trời');
    } else {
      assert.ok(warm(horizonHue),
        `chân trời chặng "${phase}" ở ${horizonHue}° — ban ngày chân trời là chỗ giữ hơi ấm`);
    }
  }
});

test('sunDirectionAt: giữ NGUYÊN phương vị, chỉ đổi cao độ', () => {
  // Phương vị là thứ Phase 3C đã sửa để nắng không rọi từ sau lưng. Nếu hàm này làm xê dịch nó thì
  // vài giờ trong ngày sẽ rơi lại đúng cái bẫy "đèn flash" — mà nhìn cảnh thì rất khó truy ra.
  const base = { x: 0.433, y: 0.5, z: -0.75 };
  const baseAzimuth = Math.atan2(base.x, base.z);

  for (const altitude of [0.15, 0.3, 0.5, 0.75, 0.95]) {
    const dir = sunDirectionAt(base, altitude);
    assert.ok(Math.abs(Math.atan2(dir.x, dir.z) - baseAzimuth) < 1e-9,
      `cao độ ${altitude} làm lệch phương vị`);
    assert.ok(Math.abs(Math.hypot(dir.x, dir.y, dir.z) - 1) < 1e-9, 'vector không còn chuẩn hoá');
    assert.ok(Math.abs(dir.y - altitude) < 1e-9, 'cao độ ra không đúng yêu cầu');
  }
});

test('sunDirectionAt: kẹp cao độ để mặt trời không bao giờ chui xuống đất', () => {
  for (const bad of [0, -1, -0.5, undefined, NaN]) {
    const dir = sunDirectionAt({ x: 0.433, y: 0.5, z: -0.75 }, bad);
    assert.ok(dir.y >= 0.12, `cao độ ${bad} cho ra mặt trời dưới mặt đất (y = ${dir.y})`);
  }
});
