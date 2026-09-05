import test from 'node:test';
import assert from 'node:assert/strict';

import { buildScenePalette } from './palette3d.js';
import { ERA_METADATA } from '../constants.js';
import {
  DAYLIGHT_PROFILES,
  DAY_PHASES,
  deriveDaylight,
  fogDensityFor,
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

test('CAO ĐỘ MẶT TRỜI PHẢI KHỚP GIỜ: gần chính ngọ hơn thì CAO hơn, cách chính ngọ BẰNG NHAU thì CAO BẰNG NHAU', () => {
  // ⚠️ BÀI NÀY THAY CHO MỘT BÀI CŨ ĐÃ ĐỂ LỌT MỘT KHUYẾT TẬT SỐNG SÓT NHIỀU THÁNG.
  // Bản cũ hỏi ba câu rời rạc — "trưa cao hơn bình minh", "cao hơn hoàng hôn", "cao hơn buổi
  // sáng" — và KHÔNG hỏi "trưa cao hơn buổi CHIỀU", cũng không hỏi quan hệ sáng↔chiều. Đúng cái
  // hình dạng đã cắn dự án nhiều lần: một danh sách viết tay thì bỏ sót đúng phần tử không ai
  // nghĩ tới. Buổi chiều khai 0,48 trong khi buổi sáng khai 0,55, và cả hai bài test lẫn con mắt
  // đều không kêu — cho tới khi Phase 25 đo bằng số.
  //
  // ⚠️ VÌ SAO 0,48 LÀ SAI VỀ VẬT LÝ CHỨ KHÔNG PHẢI MỘT LỰA CHỌN MỸ THUẬT. `PHASE_BY_HOUR` xếp
  // buổi sáng = 7,8,9 (tâm 8h30) và buổi chiều = 14,15,16 (tâm 15h30). Hai tâm ấy ĐỐI XỨNG quanh
  // chính ngọ 12h00 — cùng cách 3,5 giờ. Mặt trời thì đi một cung tròn đối xứng quanh chính ngọ,
  // nên hai thời điểm cách đều chính ngọ BẮT BUỘC có cùng cao độ. Khai lệch nhau là nói dối vật
  // lý, và cái giá phải trả nằm ở chỗ không ai ngờ: buổi chiều thấp xuống làm nó GIỐNG bình minh
  // thêm, tức tự tay bồi vào đúng `TECH_DEBT #89` (bình minh 6h ↔ chiều 15h là cặp gần nhất bảng).
  //
  // ⚠️ ĐỌC KỸ: `sunAltitude` là SIN của góc ngẩng, không phải góc. Nên phép so ở đây là so hai
  // con số cùng thang, không phải so hai góc — và tính đối xứng của cung mặt trời vẫn giữ nguyên
  // qua phép lấy sin, vì sin là hàm đơn điệu trên khoảng đang dùng.
  //
  // ⚠️ VÀ ĐỪNG CHÉP TAY BẢNG GIỜ VÀO ĐÂY. Giờ giữa của mỗi chặng được SUY TỪ `phaseForHour` —
  // hàm mà chính cảnh 3D gọi — nên đổi bảng giờ thì bài test tự đi theo, không trôi khỏi mã.

  const gioCua = new Map();
  for (let hour = 0; hour < 24; hour += 1) {
    const phase = phaseForHour(hour);
    if (!gioCua.has(phase)) gioCua.set(phase, []);
    gioCua.get(phase).push(hour);
  }

  // Chặng vắt qua nửa đêm (ban đêm: 19..23 rồi 0..4) thì "giờ giữa" là một con số vô nghĩa — nó
  // rơi vào giữa trưa. Loại nó ra bằng CẤU TRÚC (dãy giờ có liền một mạch không), không loại bằng
  // cách gọi tên "night": gọi tên thì ngày nào có chặng thứ bảy sẽ lại lọt.
  const lienMach = (hours) => hours.every((h, i) => i === 0 || h === hours[i - 1] + 1);
  const banNgay = [...gioCua.entries()]
    .filter(([, hours]) => lienMach(hours))
    // giờ h phủ khoảng [h, h+1) nên tâm của nó là h + 0,5
    .map(([phase, hours]) => ({ phase, giua: hours.reduce((s, h) => s + h + 0.5, 0) / hours.length }));

  // Gác chạy-rỗng: thiếu vế này thì một `filter` hỏng sẽ để lại 0 chặng và cả bài test xanh rỗng.
  assert.ok(banNgay.length >= 5,
    `chỉ còn ${banNgay.length} chặng liền mạch — bảng giờ đã đổi hình, bài test này không còn đo gì`);

  const chinhNgo = banNgay.find((c) => c.phase === 'noon');
  assert.ok(chinhNgo, 'không tìm thấy chặng "noon" để lấy mốc chính ngọ');

  const cachNgo = (c) => Math.abs(c.giua - chinhNgo.giua);
  const caoDo = (c) => DAYLIGHT_PROFILES[c.phase].sunAltitude;

  // Ngoại lệ TƯỜNG MINH, ĐẾM ĐƯỢC — không phải một ngưỡng nới rộng.
  // `dawn↔dusk` cách chính ngọ bằng nhau (đều 6 giờ) mà cao độ lệch hẳn (0,28 so với 0,16). Đó là
  // một lựa chọn mỹ thuật CÓ LÝ DO viết sẵn ở `daylight.js`: hoàng hôn cố ý nắng xiên gắt bóng
  // sâu, ngược với sương sớm mờ đều của bình minh. Danh sách này dùng `deepEqual` nên nó đỏ theo
  // CẢ HAI chiều: đỏ khi có cặp thứ hai lệch, và đỏ cả khi ai đó "sửa" luôn cặp này.
  const NGOAI_LE = ['dawn↔dusk'];

  const lechDoiXung = [];
  let soCapDaSo = 0;
  for (let i = 0; i < banNgay.length; i += 1) {
    for (let j = i + 1; j < banNgay.length; j += 1) {
      const a = banNgay[i];
      const b = banNgay[j];
      soCapDaSo += 1;
      const dA = cachNgo(a);
      const dB = cachNgo(b);
      if (Math.abs(dA - dB) < 1e-9) {
        if (Math.abs(caoDo(a) - caoDo(b)) > 1e-9) lechDoiXung.push(`${a.phase}↔${b.phase}`);
        continue;
      }
      const [gan, xa] = dA < dB ? [a, b] : [b, a];
      assert.ok(caoDo(gan) > caoDo(xa),
        `"${gan.phase}" (tâm ${gan.giua}h, cách chính ngọ ${cachNgo(gan)}h) gần chính ngọ hơn `
        + `"${xa.phase}" (tâm ${xa.giua}h, cách ${cachNgo(xa)}h) mà mặt trời lại KHÔNG cao hơn: `
        + `${caoDo(gan)} so với ${caoDo(xa)}`);
    }
  }

  // Duyệt ĐỦ tổ hợp đôi, không duyệt danh sách theo thứ tự — bài học đã trả giá ở
  // "bình minh ↔ hoàng hôn" (hai phần tử ở hai đầu danh sách thì phép duyệt cặp-kề-nhau không
  // bao giờ đem chúng ra so với nhau).
  assert.equal(soCapDaSo, (banNgay.length * (banNgay.length - 1)) / 2,
    'phép duyệt bỏ sót cặp — nó phải chạm MỌI cặp, không chỉ cặp kề nhau');

  assert.deepEqual(lechDoiXung.sort(), NGOAI_LE,
    `những cặp chặng cách chính ngọ BẰNG NHAU mà cao độ mặt trời lại LỆCH: ${lechDoiXung.join(', ') || '(không có)'}`
    + ` — mong đợi đúng ${NGOAI_LE.join(', ')}`);
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
  // Phase 9A: cùng một lời hứa ("phần gần phải sắc nét"), nay phát biểu bằng ngôn ngữ của `FogExp2`
  // — hệ số sương tại rìa gần thành phố. Công thức là của three, chép đúng: `1 − e^(−(dρ)²)`.
  const grid = 12;
  const fogAt = (d, density) => 1 - Math.exp(-((d * density) ** 2));
  // ⚠️ NGƯỠNG ĐÃ SIẾT MẠNH (0,45 → 0,20) VÌ NGƯỠNG CŨ LÀ MỘT CÁI PHỄU, KHÔNG PHẢI HÀNG RÀO. Mật độ
  // đầu tiên của Phase 9A phủ 18% lên thành phố và 76% lên rặng núi — tức đúng cái màn sữa mà bài
  // test này sinh ra để ngăn — và nó qua CẢ HAI ngưỡng cũ một cách thoải mái. Một ngưỡng nới rộng
  // "cho chắc" thì không bao giờ đỏ, và một bài test không bao giờ đỏ thì chưa phải test.
  const CITY_EDGE = grid * 1.9;      // rìa gần thành phố tính từ camera (đo ở `orbit.js`: ~23 đơn vị)
  for (const phase of DAY_PHASES) {
    const density = fogDensityFor(DAYLIGHT_PROFILES[phase].haze, grid);
    assert.ok(fogAt(CITY_EDGE, density) < 0.20,
      `chặng "${phase}" có sương tràn vào giữa thành phố (${(fogAt(CITY_EDGE, density) * 100).toFixed(0)}%)`);
  }
  assert.ok(fogAt(CITY_EDGE, fogDensityFor(0, grid)) < 0.05,
    'trời quang mà rìa thành phố đã mờ thì cả ngày sẽ chẳng có lúc nào nhìn rõ');

  // ⚠️ NỬA THỨ HAI CỦA LỜI HỨA, VÀ LÀ NỬA MÀ BẢN CŨ KHÔNG HỀ CÓ. Sương phải làm vùng xa NHẠT ĐI
  // chứ không được XOÁ nó — nếu không thì chân trời (Phase 9A) là mã chết ngay từ lúc sinh ra, y
  // như cơ chế "lùm cây" của Phase 8D. Đo trên bản cũ: đỉnh khung 95–100% sương nguyên chất.
  const FAR_RIDGE = grid * 4.2;      // rặng núi xa nhất, tính từ camera
  for (const phase of DAY_PHASES) {
    const opacity = fogAt(FAR_RIDGE, fogDensityFor(DAYLIGHT_PROFILES[phase].haze, grid));
    assert.ok(opacity < 0.70,
      `chặng "${phase}" xoá sạch rặng núi xa (${(opacity * 100).toFixed(0)}% sương) ⇒ chân trời là mã chết`);
  }

  // ⚠️ VÀ MỘT CẬN DƯỚI, vì mọi assert bên trên đều là "phải NHỎ HƠN" — đặt mật độ về 0 thì cả bài
  // này xanh mướt, mà lúc đó phối cảnh không khí biến mất sạch và thế giới lại phẳng như bìa các-
  // tông. Sương phải THẬT SỰ làm việc ở xa, không chỉ "không làm hại ở gần".
  assert.ok(fogAt(FAR_RIDGE, fogDensityFor(0.4, grid)) > 0.15,
    'sương gần như không tồn tại ở rặng núi xa ⇒ mất hẳn phối cảnh không khí, thế giới lại phẳng');

  // ⚠️ ĐỐI CHỨNG: NHỐT SẴN BỘ SỐ HỎNG CŨ — VÀ PHẢI SO THEO TỪNG CHẶNG, KHÔNG SO VỚI MỘT NGƯỠNG CHUNG.
  // Bản đầu của chính đối chứng này viết `fogAt(CITY_EDGE, OLD_DENSITY) >= 0.20` và nó ĐỎ ngay —
  // đúng việc nó sinh ra để làm. Truy ra thì hai ngưỡng tuyệt đối ở trên VẪN là phễu ở chặng
  // "morning": mật độ cũ phủ 15% lên rìa thành phố (dưới 0,20) và 56% lên rặng núi (dưới 0,70), tức
  // lọt lưới. Mà siết thêm nữa thì lại đá vào bình minh — chặng CỐ Ý nhiều sương (14% / 53%). Không
  // có một ngưỡng tuyệt đối nào tách được "bình minh mới" khỏi "buổi sáng cũ", vì hai thứ đó thật sự
  // gần nhau về con số; thứ phân biệt chúng là **cùng một chặng thì bản mới phải trong hơn bản cũ**.
  // Đó là một QUAN HỆ, nên phải viết thành một quan hệ (bài học Phase 7D), không phải một hằng số.
  const oldDensity = (h) => (0.135 + h * 0.235) / grid;
  for (const phase of DAY_PHASES) {
    const haze = DAYLIGHT_PROFILES[phase].haze;
    const gain = fogAt(FAR_RIDGE, oldDensity(haze)) - fogAt(FAR_RIDGE, fogDensityFor(haze, grid));
    assert.ok(gain > 0.15,
      `chặng "${phase}": sương ở rặng núi xa chỉ trong hơn bản cũ ${(gain * 100).toFixed(0)} điểm `
      + '⇒ mật độ đang trôi ngược về bộ số đã cho ra tấm ảnh màn sữa ở kỷ 13');
  }
});

test('fogDensityFor: đầu vào rác không được biến thành phố thành màn trắng hay thành NaN', () => {
  for (const bad of [undefined, null, NaN, -5, 99, 'dày', {}]) {
    const density = fogDensityFor(bad, 12);
    assert.ok(Number.isFinite(density), `haze ${bad} cho ra NaN`);
    assert.ok(density > 0, `haze ${bad} cho ra mật độ sương vô nghĩa`);
  }
  // Lưới rác cũng phải ra một mật độ dùng được — cảnh 3D không được vỡ vì một con số hỏng.
  for (const bad of [undefined, 0, -3, NaN]) {
    assert.ok(fogDensityFor(0.5, bad) > 0, `gridSize ${bad} cho ra mật độ sương vô nghĩa`);
  }
  // Càng nhiều sương thì mật độ càng cao — đơn điệu, không đảo chiều giữa chừng.
  let prev = 0;
  for (const h of [0, 0.25, 0.5, 0.75, 1]) {
    const density = fogDensityFor(h, 12);
    assert.ok(density > prev, `sương dày lên mà mật độ lại giảm (haze ${h})`);
    prev = density;
  }
  // ⚠️ MẬT ĐỘ PHẢI TỈ LỆ NGHỊCH VỚI CỠ LƯỚI. Đây là bài học Phase 7D viết lại cho sương: "sương dày
  // bao nhiêu" là một QUAN HỆ với kích thước thế giới, không phải một con số đứng một mình. Bỏ phép
  // chia cho `size` thì lưới lớn gấp đôi sẽ mù gấp bốn — và không có gì đỏ lên ở đâu cả.
  assert.ok(Math.abs(fogDensityFor(0.3, 24) - fogDensityFor(0.3, 12) / 2) < 1e-12,
    'lưới lớn gấp đôi phải cho mật độ đúng một nửa, nếu không cùng một cảnh sẽ mù đi khi lưới to ra');
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

// ── Phase 24 · TECH_DEBT #89 ───────────────────────────────────────────────────────────────────
// Ba bài dưới đây đo trên MÀU ĐÃ DỰNG, không trên con số đã KHAI trong bảng. Lý do là `TECH_DEBT
// #42`: giữa bảng và điểm ảnh còn ba phép biến đổi (`skyward` xoay sắc → khôi phục độ tươi/độ
// sáng → cái gác chống-tím `mag < 0.5`), nên assert vào `DAYLIGHT_PROFILES.dawn.horizonHue` là
// canh một thế giới khác với thế giới Đàm nhìn thấy.
const skyTokens = { canvas2: '#f4f2ec', ink: '#1f1e1d', line: '#e8e6de', accent: '#c96442' };
const darkTokens = { ...skyTokens, canvas2: '#14110d', ink: '#f5f3ed' };
const chanTroi = (profile, era = 8, tokens = skyTokens) => buildScenePalette({
  tokens, eraColor: ERA_METADATA[era].accentColor, era, daylight: { phase: 'dawn', ...profile },
}).sky2.horizon;
const kenh = (n) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
const cachNhau = (a, b) => { const A = kenh(a), B = kenh(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
/** Độ tươi HSV. Đây là đại lượng Phase 24 dùng để tách bình minh khỏi buổi chiều. */
const doTuoi = (n) => { const c = kenh(n); const M = Math.max(...c); return M === 0 ? 0 : (M - Math.min(...c)) / M; };
/** Trung bình 15 kỷ — CÙNG cách bản quét gộp, để con số ở đây so được với con số ở `PERFORMANCE.md`. */
const trungBinh15Ky = (f) => { let s = 0; for (let e = 1; e <= 15; e += 1) s += f(e); return s / 15; };

/** Bộ số TRƯỚC Phase 24. Dùng làm đối chứng cho cả ba bài — không bài nào được xanh với nó. */
const CU = { ...DAYLIGHT_PROFILES.dawn, skySaturation: 1.00 };

test('BÌNH MINH KHÔNG ĐƯỢC LÀ BUỔI CHIỀU — đo trên màu chân trời ĐÃ DỰNG mà sương thật sự mang', () => {
  // ⚠️ VÌ SAO MÀU CHÂN TRỜI LẠI QUYẾT ĐỊNH MỘT DẢI ĐO KHÔNG HỀ CÓ TRỜI TRONG ĐÓ.
  // Dải trên cùng của bản quét 15 kỷ KHÔNG chứa một điểm ảnh bầu trời nào: camera ngẩng 34,4° trừ
  // nửa FOV dọc 19° ⇒ mép trên khung nằm 15,4° DƯỚI tầm mắt (Phase 9A đã chứng minh bằng cách sơn
  // vòm trời đỏ chói rồi chụp — đỉnh khung vẫn nguyên màu đất). Đo bằng mặt nạ thì dải ấy là
  // 72,3% RẶNG NÚI XA. Màu chân trời tới được nó qua SƯƠNG, vì `sceneGraph.js` dựng
  // `new FogExp2(palette.sky2.horizon, fogDensityFor(haze, gridSize))`.
  // ⚠️ Suốt hai phiên, `CLAUDE.md` gọi dải ấy là "bầu trời" và một phiên đã suy từ MỘT MÌNH phép
  // pha `outskirts` (hệ số 0,15, quá yếu) rồi kết luận hướng này là BẤT KHẢ THEO CẤU TẠO. Sai —
  // và một lời KẾT ÁN sai thì đóng vĩnh viễn một hướng đi còn tốt.
  const xa = trungBinh15Ky((e) => cachNhau(chanTroi(DAYLIGHT_PROFILES.dawn, e), chanTroi(DAYLIGHT_PROFILES.afternoon, e)));
  const cu = trungBinh15Ky((e) => cachNhau(chanTroi(CU, e), chanTroi(DAYLIGHT_PROFILES.afternoon, e)));

  // Ngưỡng 32 nằm GIỮA HAI ĐẦU ĐO ĐƯỢC (bộ cũ 19,3 · bộ hiện tại 46,2), không phải một con số
  // nhặt đại — đúng luật chống-phễu của Phase 9A.
  assert.ok(xa > 32,
    `màu chân trời bình minh chỉ cách buổi chiều ${xa.toFixed(1)} (cần > 32). Sương mang đúng màu `
    + 'này, nên hai buổi sẽ lại thành cùng một bức ảnh ở dải rặng núi xa.');

  // ⚠️ ĐỐI CHỨNG BẮT BUỘC: bộ số CŨ phải TRƯỢT. Không có vế này thì không ai biết ngưỡng 32 còn
  // răng hay đã bị nới cho tiện.
  assert.ok(cu < 32,
    `bộ số trước Phase 24 đo được ${cu.toFixed(1)} — LỌT qua ngưỡng 32. Phép đo đã bị nới tay tới `
    + 'mức không còn bắt nổi chính cái lỗi nó sinh ra để bắt (bản quét thật: dải rặng núi xa chỉ '
    + 'cách nhau 4,14/255, tức thấp hơn ngưỡng mắt 12 tới ba lần).');
});

test('CHẶNG NHIỀU SƯƠNG NHẤT PHẢI LÀ CHẶNG NHẠT NHẤT — sương dày thì màu phải loãng', () => {
  // ⚠️ ĐÂY LÀ LÝ DO VẬT LÝ CỦA CẢ PHASE 24, VIẾT THÀNH MỘT BẤT BIẾN.
  // Bình minh khai `haze: 0.90` — dày gấp hơn hai lần mọi chặng khác. Sương dày thì tán xạ nhiều
  // lần, và mỗi lần tán xạ lại kéo màu về phía trắng ⇒ chân trời bình minh PHẢI nhạt. Bộ số trước
  // Phase 24 khai sương dày nhất bảng mà lại cho chân trời TƯƠI NGANG buổi chiều — hai lời khai
  // của cùng một bảng nói ngược nhau, và không cổng nào bắt.
  //
  // ⚠️ ĐO RỒI MỚI PHÁT BIỂU, VÀ PHÉP ĐO ĐÃ BÁC MỘT CÂU MẠNH HƠN. Câu tôi định viết ban đầu là
  // "sương càng dày thì chân trời càng nhạt" (đơn điệu trên cả 5 chặng ban ngày). Đo ra thì KHÔNG
  // đơn điệu: giữa trưa haze 0,06 mà tươi 0,379, còn hoàng hôn haze 0,08 lại tươi 0,413 — sai thứ
  // tự. Nên bài này chỉ phát biểu phần ĐÚNG: chặng nhiều sương nhất phải là chặng nhạt nhất.
  // (Bỏ ĐÊM ra ngoài: đêm tối tới mức mắt gần như mất khả năng phân biệt sắc — hiệu ứng Purkinje
  //  đã ghi ở `palette3d.js` — nên độ tươi của nó không nói lên điều gì về thứ Đàm nhìn thấy.)
  const banNgay = Object.entries(DAYLIGHT_PROFILES).filter(([ten]) => ten !== 'night');
  const tuoiCua = (phase, prof) => trungBinh15Ky((e) => doTuoi(buildScenePalette({
    tokens: skyTokens, eraColor: ERA_METADATA[e].accentColor, era: e, daylight: { phase, ...prof },
  }).sky2.horizon));

  const nhieuSuongNhat = banNgay.reduce((a, b) => (b[1].haze > a[1].haze ? b : a));
  assert.equal(nhieuSuongNhat[0], 'dawn', 'bình minh phải là chặng nhiều sương nhất — xem bài "SƯƠNG SỚM"');

  const tuoiBinhMinh = tuoiCua('dawn', DAYLIGHT_PROFILES.dawn);
  for (const [ten, prof] of banNgay) {
    if (ten === 'dawn') continue;
    const t = tuoiCua(ten, prof);
    // Biên 0,10: đo được hẹp nhất là 0,213 (so với giữa trưa), còn bộ CŨ ra ÂM. Ngưỡng nằm giữa.
    assert.ok(t - tuoiBinhMinh > 0.10,
      `chân trời bình minh tươi ${tuoiBinhMinh.toFixed(3)}, chặng "${ten}" tươi ${t.toFixed(3)} — `
      + 'bình minh khai sương dày nhất bảng mà màu lại không loãng ra. Bảng đang tự nói ngược mình.');
  }

  // ⚠️ ĐỐI CHỨNG: bộ số CŨ phải TRƯỢT ở ít nhất một chặng.
  const tuoiCu = tuoiCua('dawn', CU);
  const soChangCuTruot = banNgay.filter(([ten, prof]) => ten !== 'dawn' && tuoiCua(ten, prof) - tuoiCu <= 0.10).length;
  assert.ok(soChangCuTruot > 0,
    `bộ số trước Phase 24 (tươi ${tuoiCu.toFixed(3)}) vẫn LỌT qua mọi chặng — bài test đã mất răng`);
});

test('BÌNH MINH NHẠT HƠN BUỔI CHIỀU Ở TỪNG KỶ MỘT — không phải chỉ nhạt hơn trên trung bình', () => {
  // ⚠️ VÌ SAO CẦN BÀI NÀY KHI BÀI TRÊN ĐÃ ĐO CÙNG MỘT ĐẠI LƯỢNG: bài trên gộp 15 kỷ thành MỘT số
  // trung bình rồi mới so. Một trung bình đẹp vẫn có thể che một kỷ đi ngược chiều — đúng cái bẫy
  // `TECH_DEBT #22` đã dạy ("gộp trước thì hai kỷ ngược chiều nhau sẽ TRIỆT TIÊU nhau"). Bài này
  // hỏi TỪNG kỷ × TỪNG theme và lấy ca xấu nhất.
  //
  // ⚠️ VÀ NÓ LÀ MỘT QUAN HỆ, KHÔNG PHẢI MỘT MỨC (bài học Phase 7D). Không assert "bình minh phải
  // tươi dưới 0,2" — con số ấy sẽ chết trong im lặng ngày nào có ai chỉnh buổi chiều vì một lý do
  // khác hẳn, y như `roadColor` đã chết khi mặt đất bị chỉnh ở một phase khác.
  let hep = { m: Infinity, at: '' };
  for (const [ten, tokens] of [['sáng', skyTokens], ['tối', darkTokens]]) {
    for (let era = 1; era <= 15; era += 1) {
      for (const doi of ['afternoon', 'dusk']) {
        const m = doTuoi(chanTroi(DAYLIGHT_PROFILES[doi], era, tokens)) - doTuoi(chanTroi(DAYLIGHT_PROFILES.dawn, era, tokens));
        if (m < hep.m) hep = { m, at: `kỷ ${era} theme ${ten} so với ${doi}` };
      }
    }
  }
  // Biên đo được hẹp nhất: 0,214 (kỷ 5 theme sáng). Bộ CŨ: −0,071 — tức QUAN HỆ ĐẢO NGƯỢC, bình
  // minh còn tươi HƠN buổi chiều. Ngưỡng 0,10 nằm giữa hai đầu đo được.
  assert.ok(hep.m > 0.10,
    `bình minh không nhạt hơn được bao nhiêu ở ${hep.at}: chênh ${hep.m.toFixed(3)} (cần > 0,10)`);

  // ⚠️ ĐỐI CHỨNG: bộ CŨ phải bị bắt.
  let hepCu = Infinity;
  for (const tokens of [skyTokens, darkTokens]) {
    for (let era = 1; era <= 15; era += 1) {
      hepCu = Math.min(hepCu, doTuoi(chanTroi(DAYLIGHT_PROFILES.afternoon, era, tokens)) - doTuoi(chanTroi(CU, era, tokens)));
    }
  }
  assert.ok(hepCu <= 0.10,
    `bộ số trước Phase 24 đo được biên ${hepCu.toFixed(3)} — vẫn lọt, tức bài test này không có răng`);
});

// ⚠️ MỘT HƯỚNG ĐÃ THỬ VÀ ĐÃ BỊ CHÍNH TEST BÁC — GHI LẠI ĐỂ PHIÊN SAU KHỎI ĐI LẠI.
// Bản vá ĐẦU TIÊN của Phase 24 kéo bình minh sang màu HỒNG (`horizonHue: 330`, `skySaturation: 1.20`).
// Nó cho khoảng cách tới buổi chiều còn xa hơn (63,8 so với 46,2) và bản quét thật đo được trục
// chặng 21,26. Nhưng nó làm ĐỎ hai bài ở `palette3d.test.js`: chân trời hồng cộng với màu nhấn
// tím của vài kỷ đẩy MẶT NƯỚC lúc 5 giờ ra `#9585b2` — tím sen, thứ dự án đã trả giá ở Phase 3W.
// Ba điều rút ra:
//   • Bản quét 15 kỷ chỉ lấy mẫu 6 giờ (6·8·12·15·18·22) nên nó KHÔNG THỂ thấy lỗi ở 5 giờ. Một
//     con số quét đẹp không thay được bộ test — đúng họ `TECH_DEBT #38` (ngưỡng hiệu chuẩn trên
//     MỘT quần thể rồi được đọc thành luật của CẢ TẬP).
//   • Cách vá SAI là nới ngưỡng chống-tím; chú thích của chính hai bài ấy đã ghi vì sao 10 chứ
//     không phải 18 (để 18 thì lưới thủng đúng chỗ cần vá).
//   • Hướng NHẠT thắng hướng HỒNG ở mọi trục: qua cổng chống-tím với nguyên biên (−4), và giữ
//     bình minh XA hoàng hôn hơn (43,9 so với 33,5) thay vì kéo lại gần còn 14,6.
