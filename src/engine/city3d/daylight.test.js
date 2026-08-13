import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DAYLIGHT_PROFILES,
  DAY_PHASES,
  deriveDaylight,
  fogRangeFor,
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
    'haze',
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

test('ĐÊM PHẢI CÓ HƯỚNG SÁNG: ánh trăng không được để đèn nền dìm chết', () => {
  // Bài test anh em với bài ngay trên, và nó chặn ĐÚNG cái bẫy mà bài trên tạo ra.
  // Bài trên bắt `fillEnergy` đêm phải GẤP ≥3 lần trưa. Nhưng đèn nền là ánh sáng KHÔNG HƯỚNG —
  // nó rọi đều vào mọi mặt, kể cả mặt lẽ ra phải khuất. Cứ nhắm mắt tăng đèn nền cho qua bài trên
  // thì được một thành phố đêm sáng hơn nhưng PHẲNG LÌ, không đọc ra hình khối nữa.
  // Đo được ở bảng quét lúc chưa sửa: nắng 1,72 × 0,42 = 0,72 trong khi đèn nền 0,78 × 3,40 = 2,65
  // — ánh sáng không hướng gấp 3,7 lần ánh sáng có hướng, và dải động của cột đêm rớt xuống 0,129
  // so với 0,474 lúc giữa trưa. Đêm vừa tối nhất vừa phẳng nhất.
  // Sự thật ngược lại: đêm chỉ có MỘT nguồn sáng cứng là mặt trăng ⇒ đêm là chặng chiaroscuro
  // mạnh nhất trong ngày, không phải yếu nhất.
  const night = DAYLIGHT_PROFILES.night;
  const ratio = night.sunEnergy / night.fillEnergy;
  assert.ok(ratio >= 0.35,
    `đêm có ánh trăng ${night.sunEnergy} so với đèn nền ${night.fillEnergy} (tỉ lệ ${ratio.toFixed(2)}) `
    + '⇒ ánh sáng không hướng đang dìm chết nguồn tạo khối, thành phố đêm sẽ phẳng lì');
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
  // Bình minh và hoàng hôn phải kéo CHÂN TRỜI về vùng ẤM.
  // ⚠️ "ẤM" LÀ MỘT CUNG TRÒN, KHÔNG PHẢI MỘT KHOẢNG SỐ. Bản cũ viết `< 60` — nghe thì gọn, nhưng
  // vòng màu quấn vòng: 330° (hồng phấn) ấm y như 30° (cam), chỉ là nằm bên kia mốc 0. Điều kiện
  // `< 60` vì thế NHỐT cả bình minh lẫn hoàng hôn vào chung một múi 60° hẹp — và đó chính là thứ
  // ép hai chặng phải giống nhau (xem `TECH_DEBT.md` #17). Ngay trong file này, bài "hành trình
  // màu" ở dưới đã có sẵn hàm `warm()` biết quấn vòng; hai chỗ cùng phát biểu MỘT luật mà bằng hai
  // công thức khác nhau thì bản chặt hơn sẽ âm thầm thắng. Nay dùng chung một định nghĩa.
  // ⚠️ Và nhớ trừ hao đầu vào ≠ đầu ra: đặt 312° thì đo trên ảnh ra **351°** — sắc hồng-đỏ, ấm rõ.
  const warmArc = (h) => h < 90 || h >= 300;
  assert.ok(warmArc(DAYLIGHT_PROFILES.dawn.horizonHue), 'bình minh phải kéo chân trời về sắc ấm');
  assert.ok(warmArc(DAYLIGHT_PROFILES.dusk.horizonHue), 'hoàng hôn phải kéo chân trời về sắc ấm');
});

test('ĐỈNH trời luôn lạnh · BÌNH MINH và HOÀNG HÔN luôn ấm · và MỘT NGÀY PHẢI LÀ HÀNH TRÌNH MÀU', () => {
  // ⚠️ BÀI NÀY ĐÃ ĐỔI VAI NGÀY 2026-08-13 (Phase 3V). ĐỌC LỊCH SỬ TRƯỚC KHI KÉO NGƯỢC.
  // Bản cũ bắt MỌI chặng ban ngày phải có chân trời ẤM. Nghe hợp lý, và nó ra đời để chữa một lỗi
  // THẬT (chân trời 8 giờ sáng từng ra `#cad0d0`, độ tươi 0,06 — xám chết). Nhưng bản quét đủ 15 kỷ
  // × 6 chặng ngày 2026-08-13 đo ra hậu quả của chính luật đó: **5/6 chặng nằm gọn trong dải sắc
  // 19°–41° (cam-nâu), chỉ ĐÊM (224°) thoát ra.** Cả một ngày chỉ đổi ĐỘ SÁNG chứ không đổi SẮC —
  // mà độ sáng là tín hiệu thị giác yếu nhất. Luật "ban ngày luôn ấm" chính là thứ làm mọi chặng
  // ban ngày trông như nhau.
  //
  // Sự thật đúng hơn: chân trời VÀNG RỰC là dấu hiệu MẶT TRỜI THẤP — tức bình minh/hoàng hôn. Giữa
  // trưa mặt trời trên cao thì chân trời là màn mù XANH NHẠT, và ánh sáng buổi SÁNG lạnh hơn buổi
  // CHIỀU (kiến thức hội hoạ cổ điển, không phải sở thích).
  // ⇒ Giữ nguyên hai điều ĐÚNG (đỉnh trời luôn lạnh · bình minh và hoàng hôn luôn ấm), bỏ điều SAI
  // ("mọi chặng ban ngày đều ấm"), và THÊM một bất biến MẠNH HƠN: một ngày phải đi qua nhiều sắc.
  const cold = (h) => h >= 180 && h < 280;
  const warm = (h) => h < 90 || h >= 300;

  for (const phase of DAY_PHASES) {
    const { skyHue } = DAYLIGHT_PROFILES[phase];
    assert.ok(cold(skyHue), `đỉnh trời chặng "${phase}" ở ${skyHue}° — đỉnh trời phải luôn lạnh`);
  }
  // Mặt trời thấp ⇒ chân trời ấm. Ba chặng này KHÔNG được nguội đi.
  for (const phase of ['dawn', 'dusk']) {
    assert.ok(warm(DAYLIGHT_PROFILES[phase].horizonHue),
      `chặng "${phase}" có mặt trời thấp — chân trời PHẢI ấm`);
  }
  assert.ok(cold(DAYLIGHT_PROFILES.night.horizonHue), 'ban đêm chân trời phải lạnh theo đỉnh trời');

  // ⚠️ BẤT BIẾN MỚI, VÀ LÀ LÝ DO CHÍNH BÀI NÀY TỒN TẠI: MỘT NGÀY LÀ HÀNH TRÌNH MÀU.
  // Người quyết định màu trời Đàm THẬT SỰ nhìn thấy là `horizonHue`, KHÔNG phải `skyHue` — vì
  // camera chúc xuống nên dải trời lọt khung là 64–84% màu chân trời (xem `daylight.js` và
  // `TECH_DEBT.md` #15). Vì vậy bất biến phải canh trên `horizonHue`.
  // ⚠️ CHỈ TÍNH CÁC CHẶNG BAN NGÀY — LOẠI 'night'. Đây không phải chi tiết vụn: ĐÊM xưa nay đã ở
  // 226°, nên nếu để nó vào phép tính thì bộ giá trị HỎNG cũ (18/44/48/34/10 + 226) cũng cho ra
  // độ trải 144° và bài test vẫn XANH — tức là một cái phễu, không phải hàng rào. Bỏ đêm ra thì
  // bộ cũ chỉ còn trải 38°, đúng bằng mức "cả ngày một sắc" mà bài này sinh ra để bắt.
  const arc = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  const dayHorizons = DAY_PHASES.filter((p) => p !== 'night')
    .map((p) => DAYLIGHT_PROFILES[p].horizonHue);
  const spread = Math.max(...dayHorizons.map((a) => Math.max(...dayHorizons.map((b) => arc(a, b)))));
  assert.ok(spread >= 90,
    `chân trời các chặng BAN NGÀY chỉ trải trong ${Math.round(spread)}° — một ngày mà không đổi sắc `
    + 'thì chỉ còn là dốc sáng–tối, và đó chính là "chán" ở dạng đo được. Xem TECH_DEBT.md #15.');

  // Và không được "thoả" bất biến trên bằng cách cho hai chặng LIỀN NHAU trùng sắc.
  for (let i = 1; i < DAY_PHASES.length; i += 1) {
    const a = DAYLIGHT_PROFILES[DAY_PHASES[i - 1]];
    const b = DAYLIGHT_PROFILES[DAY_PHASES[i]];
    const sameHue = arc(a.horizonHue, b.horizonHue) < 8;
    const samePull = Math.abs(a.horizonPull - b.horizonPull) < 0.08;
    assert.ok(!(sameHue && samePull),
      `chặng "${DAY_PHASES[i - 1]}" và "${DAY_PHASES[i]}" có chân trời gần như y hệt `
      + `(${a.horizonHue}°/${a.horizonPull} vs ${b.horizonHue}°/${b.horizonPull}) — hai chặng liền `
      + 'nhau mà không phân biệt được thì thực chất chỉ là một chặng.');
  }
});

/**
 * Khoảng cách giữa hai hồ sơ ánh sáng, tính trên TOÀN BỘ tham số cùng lúc.
 *
 * Mỗi trục chia cho khoảng biến thiên thật của nó để không trục nào át trục nào (`fillEnergy` chạy
 * từ 0,8 tới 2,6 còn `skyPull` chỉ từ 0 tới 1 — không chuẩn hoá thì đèn nền một mình quyết định
 * tất cả). Hai góc màu tính theo CUNG TRÒN, vì 350° và 10° cách nhau 20° chứ không phải 340°.
 */
const PROFILE_AXES = [
  ['sunAltitude', 1], ['sunWarmth', 2], ['sunEnergy', 1.5], ['fillEnergy', 2.6],
  ['skyPull', 1], ['horizonPull', 1], ['skySaturation', 1], ['lampEnergy', 1], ['haze', 1],
];
function profileDistance(a, b) {
  const arc = (x, y) => { const d = Math.abs(x - y) % 360; return d > 180 ? 360 - d : d; };
  let sum = 0;
  for (const [key, span] of PROFILE_AXES) sum += ((a[key] - b[key]) / span) ** 2;
  for (const key of ['skyHue', 'horizonHue']) sum += (arc(a[key], b[key]) / 180) ** 2;
  return Math.sqrt(sum);
}

/**
 * Ngưỡng "hai chặng còn phân biệt được". KHÔNG phải con số nhặt đại — nó được HIỆU CHUẨN với phép
 * đo pixel trên bản quét thật 15 kỷ × 6 chặng ngày 2026-08-13 (xem `TECH_DEBT.md` #17):
 *
 *     khoảng cách hồ sơ   0,31  ↔  ảnh thật   5,9/255   (bộ số HỎNG cũ: bình minh ≡ hoàng hôn)
 *     khoảng cách hồ sơ   0,52  ↔  ảnh thật  29,8/255   (cặp gần nhất của bộ số hiện tại)
 *     khoảng cách hồ sơ   1,28  ↔  ảnh thật  75,1/255   (bình minh ↔ hoàng hôn sau khi sửa)
 *
 * Xếp hạng 15 cặp theo thang thuần số này và theo thang pixel cho hệ số Spearman **0,854** — tức
 * thang thuần số nói gần đúng thứ mắt thấy, đủ để làm hàng rào. Nội suy hai mốc đầu thì ngưỡng mắt
 * phân biệt được (~12/255) rơi vào khoảng hồ sơ **0,36**. Chọn 0,40: trên mức bộ hỏng cũ (0,31),
 * trên cả mức mắt-phân-biệt (0,36), mà vẫn dưới cặp gần nhất hiện tại (0,52) một quãng an toàn.
 */
const MIN_PROFILE_DISTANCE = 0.40;

test('KHÔNG CÓ HAI CHẶNG NÀO LÀ CÙNG MỘT BỨC ẢNH — duyệt ĐỦ MỌI CẶP, không chỉ cặp kề nhau', () => {
  // ⚠️ BÀI NÀY SINH RA TỪ MỘT LỖI ĐÃ CHẠY TRÊN MÁY ĐÀM NHIỀU NGÀY, và điều đáng học không phải là
  // lỗi mà là VÌ SAO CẢ MỘT FILE TEST DÀY THẾ NÀY VẪN ĐỂ LỌT.
  // Bài "hai chặng LIỀN NHAU không được giống nhau" ở trên duyệt `for (i = 1; i < DAY_PHASES.length)`
  // — tức chỉ các cặp KỀ NHAU: dawn↔morning, morning↔noon, …, dusk↔night. `dawn` và `dusk` nằm ở
  // hai đầu danh sách nên KHÔNG BAO GIỜ được đem so với nhau. Chúng giống hệt nhau (đo được 5,9/255
  // trong khi ngưỡng mắt là ~12) suốt thời gian đó mà mọi bài test đều xanh.
  // Đây là lần thứ HAI đúng cái bẫy này xuất hiện trong CHÍNH file này (lần trước: bài "hành trình
  // màu" tính cả `night` nên bộ số hỏng vẫn qua — xem ghi chú "bỏ đêm ra"). Cùng một hình dạng sai:
  // **một điều kiện chỉ soát MỘT PHẦN không gian thì là cái phễu, không phải hàng rào.**
  // ⇒ Luật rút ra và nay đã cắm thành mã: bất biến kiểu "các thứ này phải khác nhau" thì phải duyệt
  // TỔ HỢP ĐÔI, không được duyệt danh sách theo thứ tự.
  const worst = { pair: null, d: Infinity };
  for (let i = 0; i < DAY_PHASES.length; i += 1) {
    for (let j = i + 1; j < DAY_PHASES.length; j += 1) {
      const d = profileDistance(DAYLIGHT_PROFILES[DAY_PHASES[i]], DAYLIGHT_PROFILES[DAY_PHASES[j]]);
      if (d < worst.d) { worst.d = d; worst.pair = `${DAY_PHASES[i]}↔${DAY_PHASES[j]}`; }
    }
  }
  assert.ok(worst.d >= MIN_PROFILE_DISTANCE,
    `cặp "${worst.pair}" chỉ cách nhau ${worst.d.toFixed(2)} (cần ≥ ${MIN_PROFILE_DISTANCE}) — hai chặng `
    + 'trong ngày đang là cùng một bức ảnh. Mở app lúc này hay lúc kia cũng vậy, và đó chính là '
    + '"chán" ở dạng đo được. Xem TECH_DEBT.md #17.');
});

test('PHÉP ĐO NÀY PHẢI CÒN BẮT ĐƯỢC ĐÚNG CÁI LỖI ĐÃ SINH RA NÓ', () => {
  // ⚠️ MỘT BÀI TEST CHƯA TỪNG THẤY ĐỎ THÌ KHÔNG PHẢI LÀ BÀI TEST. Bài ngay trên xanh — nhưng nó
  // xanh vì bộ số đã đúng, hay vì phép đo quá dễ dãi? Không có cách nào biết, trừ khi cho nó ăn lại
  // đúng bộ số hỏng ngày xưa. Nên bộ số ấy được giữ nguyên xi ở đây làm mẫu đối chứng vĩnh viễn.
  // Nhờ vậy, nếu về sau ai nới ngưỡng hoặc bỏ bớt trục cho "tiện", bài này đỏ NGAY — cái phễu
  // không thể lặng lẽ quay lại lần thứ ba.
  const brokenDawn = { sunAltitude: 0.22, sunWarmth: 0.85, sunEnergy: 0.72, fillEnergy: 0.95, skyHue: 232, skyPull: 0.42, horizonHue: 18, horizonPull: 0.70, skySaturation: 1.15, lampEnergy: 0.35, haze: 0 };
  const brokenDusk = { sunAltitude: 0.18, sunWarmth: 1.00, sunEnergy: 0.78, fillEnergy: 1.05, skyHue: 238, skyPull: 0.46, horizonHue: 10, horizonPull: 0.78, skySaturation: 1.25, lampEnergy: 0.60, haze: 0 };

  const d = profileDistance(brokenDawn, brokenDusk);
  assert.ok(d < MIN_PROFILE_DISTANCE,
    `bộ số hỏng cũ đo được ${d.toFixed(2)} — LỌT qua ngưỡng ${MIN_PROFILE_DISTANCE}. Phép đo đã bị nới `
    + 'tay tới mức không còn bắt nổi chính cái lỗi nó sinh ra để bắt (ảnh thật của cặp đó cách nhau '
    + '5,9/255, tức mắt thường nhìn ra CÙNG MỘT BỨC ẢNH).');

  // Và bộ số hiện tại phải bỏ xa bộ hỏng — không chỉ "vừa đủ qua ngưỡng".
  const fixed = profileDistance(DAYLIGHT_PROFILES.dawn, DAYLIGHT_PROFILES.dusk);
  assert.ok(fixed > d * 2.5,
    `bình minh↔hoàng hôn nay chỉ ${fixed.toFixed(2)} so với ${d.toFixed(2)} của bộ hỏng — chưa đủ xa`);
});

test('SƯƠNG SỚM: bình minh phải là chặng nhiều sương nhất, và sương phải phủ vào ĐÚNG phần xa', () => {
  // Vì sao sương quan trọng tới mức có bài test riêng: nó gánh gần như TOÀN BỘ khoảng cách giữa
  // bình minh và hoàng hôn. Màu nắng hai buổi buộc phải giống nhau (mặt trời thấp ⇒ ánh sáng ấm, ở
  // cả hai đầu ngày — vật lý), nên mọi cách chỉnh ánh sáng đều tắc. Tắt riêng sương rồi bật lại,
  // giữ nguyên mọi tham số khác, đo theo từng dải (trung bình 15 kỷ):
  //     nền/chân trời  12,9 → 74,6   ·   THÀNH PHỐ  8,4 → 3,3   ·   mặt đất  7,2 → 7,2
  //     cả cảnh        17,2 → 75,1
  // ⚠️ Khoảng cách nằm HẾT ở phần NỀN, không ở các công trình — và đó là ĐÚNG THIẾT KẾ, vì sương
  // cố ý bắt đầu SAU rìa thành phố nên không chạm nhà ở gần. Nhà ở gần trông giống nhau ở hai đầu
  // ngày cũng đúng vật lý, không phải thiếu sót. (Chú thích đầu tiên ở chỗ này viết ngược — bảo
  // rằng sương chạm được vào dải THÀNH PHỐ. Nghe xuôi tai, nhưng đo ra là 8,4 → 3,3.)
  assert.ok(DAYLIGHT_PROFILES.dawn.haze > DAYLIGHT_PROFILES.dusk.haze * 3,
    'bình minh phải nhiều sương hơn hẳn hoàng hôn — qua một đêm hơi nước mới đọng lại sát mặt đất');
  assert.ok(DAYLIGHT_PROFILES.noon.haze < 0.2, 'giữa trưa mà mù mịt thì không còn ra giữa trưa');

  // ⚠️ CẬN TRÊN CỦA SƯƠNG, và nó có một ảnh chụp thất bại đứng sau. Bản đầu của `sceneGraph.js` để
  // sương bắt đầu ở `gridSize * 1.05` trong khi camera đứng cách `gridSize * 1.83` — sương phủ gần
  // hết thành phố, ra một màn trắng đục. Bài này khoá lại: dù `haze` = 1 thì sương vẫn phải bắt đầu
  // SAU rìa thành phố (bán kính ~0,71 × lưới), chừa phần gần sắc nét.
  const grid = 12;
  for (const phase of DAY_PHASES) {
    const { near, far } = fogRangeFor(DAYLIGHT_PROFILES[phase].haze, grid);
    assert.ok(near > grid * 0.85, `chặng "${phase}" có sương tràn vào giữa thành phố (bắt đầu ở ${near})`);
    assert.ok(far > near, `chặng "${phase}" có sương tan trước khi kịp bắt đầu`);
  }
  const dense = fogRangeFor(1, grid);
  assert.ok(dense.near > grid * 0.85, 'sương dày nhất vẫn phải bắt đầu sau rìa thành phố');
});

test('fogRangeFor: đầu vào rác không được biến thành phố thành màn trắng hay thành NaN', () => {
  for (const bad of [undefined, null, NaN, -5, 99, 'dày', {}]) {
    const { near, far } = fogRangeFor(bad, 12);
    assert.ok(Number.isFinite(near) && Number.isFinite(far), `haze ${bad} cho ra NaN`);
    assert.ok(near > 0 && far > near, `haze ${bad} cho ra khoảng sương vô nghĩa`);
  }
  // Lưới rác cũng phải ra một khoảng dùng được — cảnh 3D không được vỡ vì một con số hỏng.
  for (const bad of [undefined, 0, -3, NaN]) {
    const { near, far } = fogRangeFor(0.5, bad);
    assert.ok(near > 0 && far > near, `gridSize ${bad} cho ra khoảng sương vô nghĩa`);
  }
  // Càng nhiều sương thì màn sương càng lại gần — đơn điệu, không đảo chiều giữa chừng.
  let prev = Infinity;
  for (const h of [0, 0.25, 0.5, 0.75, 1]) {
    const { near } = fogRangeFor(h, 12);
    assert.ok(near < prev, `sương dày lên mà màn sương lại lùi ra xa (haze ${h})`);
    prev = near;
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
