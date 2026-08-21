/**
 * horizon.test.js — khoá VÙNG ĐẤT XA.
 *
 * Ba loại hỏng mà file này canh, và cả ba đều IM LẶNG tuyệt đối trên màn hình:
 *   1. Bảng 15 kỷ chép-dán ⇒ 15 chân trời giống hệt nhau (đúng hình dạng lỗi của Phase 5B/3G).
 *   2. Chỗ giáp với tấm địa hình thành phố lệch cao độ ⇒ một khe hở chạy vòng quanh thành phố.
 *   3. Chân trời đổi hình theo tiến độ người chơi ⇒ núi non nhấp nhô sau mỗi phiên tập trung.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HORIZON_STYLES, HORIZON_REACH, MAX_OCTAVES, getHorizonStyle, buildHorizon, horizonMaxHeight,
} from './horizon.js';
import { APRON_DROP, ERA_TERRAIN, buildTerrain } from './terrain.js';
import { ERA_STYLES } from './eraStyle.js';
import { buildSetting } from './setting.js';

const ERAS = Object.keys(HORIZON_STYLES).map(Number);

test('đủ 15 kỷ, không thiếu không thừa', () => {
  assert.equal(ERAS.length, 15);
  for (let era = 1; era <= 15; era += 1) {
    assert.ok(HORIZON_STYLES[era], `kỷ ${era} không có vùng đất xa`);
  }
});

test('mọi con số nằm trong dải hợp lý — sai một dấu phẩy là cả kỷ hỏng thầm lặng', () => {
  for (const era of ERAS) {
    const s = HORIZON_STYLES[era];
    assert.ok(s.rise >= 0 && s.rise <= 8, `kỷ ${era}: rise ${s.rise} ngoài dải`);
    assert.ok(s.grain > 0.1 && s.grain <= 2, `kỷ ${era}: grain ${s.grain} ngoài dải`);
    // `rough` < 1 là điều kiện HỘI TỤ của fBm, không phải một lựa chọn mỹ thuật: ≥ 1 thì tầng càng
    // mịn càng NẶNG, và cả dãy núi biến thành nhiễu trắng ở đúng cỡ lưới.
    assert.ok(s.rough >= 0 && s.rough < 1, `kỷ ${era}: rough ${s.rough} ngoài dải (phải < 1 để fBm hội tụ)`);
    assert.ok(s.ridged >= 0 && s.ridged <= 1, `kỷ ${era}: ridged ${s.ridged} ngoài dải`);
    assert.ok(s.near >= 0 && s.near <= 1, `kỷ ${era}: near ${s.near} ngoài dải`);
    assert.ok(typeof s.note === 'string' && s.note.length > 30,
      `kỷ ${era} thiếu ghi chú — ghi chú là chỗ DUY NHẤT giải thích vì sao mấy con số này là như vậy`);
  }
});

test('ghi chú của mỗi kỷ phải nhắc đúng đất nước mà `eraStyle.js` đã khai', () => {
  for (const era of ERAS) {
    const country = ERA_STYLES[era]?.country;
    assert.ok(country, `kỷ ${era} không có \`country\` ở eraStyle.js`);
    assert.ok(HORIZON_STYLES[era].note.includes(country),
      `kỷ ${era}: ghi chú chân trời không nhắc "${country}" ⇒ hai bảng đã trôi khỏi nhau`);
  }
});

test('15 kỷ không được ra cùng một chân trời', () => {
  const prints = new Set(ERAS.map((era) => {
    const s = HORIZON_STYLES[era];
    return `${s.rise}|${s.grain}|${s.ridged}|${s.near}`;
  }));
  assert.equal(prints.size, 15, `chỉ có ${prints.size} chân trời khác nhau trên 15 kỷ`);

  // Và phải trải RỘNG, không phải 15 giá trị sát nhau: kỷ nhiều núi nhất phải cao hơn hẳn kỷ phẳng
  // nhất, nếu không thì "đi hết 15 kỷ" chẳng cho thấy gì mới.
  const rises = ERAS.map((era) => HORIZON_STYLES[era].rise);
  assert.ok(Math.max(...rises) >= Math.min(...rises) + 4,
    `chân trời cao nhất ${Math.max(...rises)} vs thấp nhất ${Math.min(...rises)} — chưa đủ để đọc ra khác biệt`);
});

test('⚠️ CHÂN TRỜI ĐỘC LẬP VỚI `relief` — hai đại lượng, không phải một', () => {
  // Đây là bài test của bài học "một trường gánh hai việc" (lần thứ 5). Nếu ai đó sau này thấy hai
  // bảng "na ná" rồi gộp lại (hoặc suy chân trời ra từ `relief`), bài này phải đỏ.
  //
  // ⚠️ BẢN CŨ HỎI BẰNG HAI MỨC TUYỆT ĐỐI — `relief <= 0,95` và `relief >= 1,0` — VÀ NÓ ĐÃ CHẾT
  // ĐÚNG NHƯ BÀI HỌC PHASE 7D BÁO TRƯỚC. §1(B) hạ `relief` ở cả 15 kỷ (đỉnh cũ 1,35 → đỉnh mới
  // 0,90) vì một lý do chẳng liên quan gì tới chân trời: nền thành phố phải bằng. Lập tức **không
  // kỷ nào còn `relief >= 1,0`**, nửa sau của phép chứng minh rỗng, và bài test đỏ với thông báo
  // *"chân trời đang chỉ là relief nhân lên"* — một lời tố cáo HOÀN TOÀN SAI: hai bảng vẫn độc
  // lập y như trước, chỉ có cái thước là lạc hậu. **Một con số tuyệt đối không diễn đạt được một
  // luật nói về QUAN HỆ**, và chỗ nguy hiểm là nó không im lặng mà lại kêu oan, tức đẩy phiên sau
  // đi sửa một thứ đang lành.
  //
  // Bản đúng phát biểu thẳng cái quan hệ: nếu `rise` suy ra được từ `relief` bằng MỘT PHÉP NHÂN
  // (hay bất kỳ hàm đồng biến nào), thì với mọi cặp kỷ, hai hiệu số phải CÙNG DẤU — tức số cặp
  // NGƯỢC CHIỀU phải bằng 0. Đếm cặp ngược chiều là phép đo không có đơn vị, nên nó sống sót mọi
  // lần cả hai bảng bị co giãn. Đo 2026-08-20: 15/103 cặp ngược chiều.
  const capNguocChieu = () => {
    const cap = [];
    for (let i = 0; i < ERAS.length; i += 1) {
      for (let j = i + 1; j < ERAS.length; j += 1) {
        const a = ERAS[i];
        const b = ERAS[j];
        const dDat = ERA_TERRAIN[a].relief - ERA_TERRAIN[b].relief;
        const dTroi = HORIZON_STYLES[a].rise - HORIZON_STYLES[b].rise;
        if (Math.abs(dDat) < 1e-9 || Math.abs(dTroi) < 1e-9) continue;   // hoà thì không nói lên gì
        if (dDat * dTroi < 0) cap.push([a, b]);
      }
    }
    return cap;
  };
  const nguoc = capNguocChieu();
  assert.ok(
    nguoc.length >= 8,
    `chỉ ${nguoc.length} cặp kỷ có đất và chân trời NGƯỢC CHIỀU nhau — ít tới mức chân trời gần `
    + 'như là `relief` nhân lên. Hai bảng đang trôi về làm một.',
  );
  // ⚠️ VÀ ĐÂY LÀ SỰ THẬT PHẢI NÓI RA CHỨ ĐỪNG GIẤU: hai bảng **tương quan mạnh** — 15/103 cặp
  // ngược chiều nghĩa là 85% số cặp cùng chiều. Điều đó ĐÚNG chứ không phải khuyết tật: một nơi có
  // địa hình cục bộ hiểm trở (mỏm đá Burg Eltz) thường nằm trong vùng núi non, còn một châu thổ
  // phẳng (sông Nin, Lưỡng Hà) thì chân trời cũng phẳng. Lời hứa ở đây KHÔNG phải "hai bảng không
  // liên quan gì nhau" — nó là "không suy được bảng này ra bảng kia", và hai câu đó khác nhau.
  //
  // Vế thứ hai: phải có đủ CẢ HAI chiều kể được thành câu chuyện — đất phẳng mà núi cao, và đất gồ
  // ghề mà chân trời thấp. Hỏi bằng KHOẢNG CÁCH THỨ HẠNG giữa hai bảng, không bằng một mức chọn
  // tay trên thang cao độ (thang ấy co giãn được, thứ hạng thì không). Đo 2026-08-20: kỷ 4 (kinh
  // thành Trung Hoa trên đồng bằng, đồi vây bốn phía) lệch **+0,357** về phía trời-cao-đất-phẳng;
  // kỷ 8 (Lisbon dốc đứng mà chân trời khiêm tốn) lệch **+0,286** về phía ngược lại. Vạch 0,20 ≈
  // "cách nhau ba bậc trong một bảng 15 dòng".
  const hang = (lay) => {
    const sapXep = [...ERAS].sort((a, b) => lay(a) - lay(b));
    return Object.fromEntries(sapXep.map((e, i) => [e, i / (ERAS.length - 1)]));
  };
  const lechHang = () => {
    const hangDat = hang((e) => ERA_TERRAIN[e].relief);
    const hangTroi = hang((e) => HORIZON_STYLES[e].rise);
    return Object.fromEntries(ERAS.map((e) => [e, hangTroi[e] - hangDat[e]]));
  };
  const lech = lechHang();
  const datThapTroiCao = ERAS.filter((e) => lech[e] >= 0.20);
  const datCaoTroiThap = ERAS.filter((e) => lech[e] <= -0.20);
  assert.ok(datThapTroiCao.length > 0,
    'không kỷ nào đất phẳng mà núi cao (kinh thành Trung Hoa) ⇒ chân trời đang bám sát `relief`');
  assert.ok(datCaoTroiThap.length > 0,
    'không kỷ nào đất gồ ghề mà chân trời thấp (Lisbon) ⇒ chân trời đang bám sát `relief`');

  // ĐỐI CHỨNG: phép đếm phải trả về 0 cho một bảng chân trời ĐƯỢC SUY RA từ `relief`. Không có vế
  // này thì `capNguocChieu` trả bừa một danh sách dài cũng làm bài test xanh.
  const goc = ERAS.map((e) => HORIZON_STYLES[e].rise);
  try {
    for (const e of ERAS) HORIZON_STYLES[e].rise = ERA_TERRAIN[e].relief * 4 + 1;
    assert.equal(capNguocChieu().length, 0,
      'bảng chân trời bịa ra từ chính `relief` mà phép đếm vẫn thấy cặp ngược chiều — phép đo hỏng');
    const lechBia = lechHang();
    assert.equal(ERAS.filter((e) => Math.abs(lechBia[e]) >= 0.20).length, 0,
      'bảng chân trời bịa ra từ chính `relief` mà vẫn có kỷ lệch thứ hạng — phép đo thứ hạng hỏng');
  } finally {
    ERAS.forEach((e, i) => { HORIZON_STYLES[e].rise = goc[i]; });
  }
});

test('kỷ lạ / thiếu → lùi về kỷ 1, không ném lỗi (dữ liệu cloud có thể hỏng)', () => {
  for (const bad of [undefined, null, 0, 99, -3, 'bảy', NaN]) {
    assert.equal(getHorizonStyle(bad), HORIZON_STYLES[1], `kỷ "${bad}" làm hỏng bảng`);
    const h = buildHorizon({ era: bad, gridSize: 12 });
    assert.ok(Number.isFinite(h.heightAt(20, 20)), `kỷ "${bad}" cho ra cao độ NaN`);
  }
});

test('⚠️ HAI TẤM PHẢI KHỚP NHAU Ở CHỖ GIÁP — một QUAN HỆ, không phải một MỨC', () => {
  // ⚠️ 2026-08-21 — BÀI NÀY TỪNG TÊN LÀ *"CHỖ GIÁP PHẢI PHẲNG ĐÚNG `-APRON_DROP`"*, VÀ CHÍNH CÁI
  // TÊN ẤY LÀ MỘT TRONG BA NGUỒN CỦA CÁI BỆ. Lý do gốc của Phase 9A — hai cái nêm sáng chói ở chỗ
  // giáp — ràng buộc **hai tấm phải KHỚP NHAU**; nó KHÔNG hề ràng buộc *cả hai phải bằng một hằng
  // số*. Viết lời hứa quan hệ ấy thành một mức là đúng cái bẫy Phase 7D, và giá phải trả lần này
  // là một vành phẳng tuyệt đối rộng 5,7 ô chạy vòng quanh thành phố — cái sàn để mắt đọc phần đất
  // trong lưới thành một mặt bàn.
  //
  // Nay tấm chân trời lấy nền từ chính `terrain.nenKho`, nên hai tấm khớp **theo cấu tạo**. Bài này
  // vì thế không còn canh một con số nữa; nó canh ba thứ vẫn có thể gãy trong im lặng:
  //   · đổi hệ toạ độ (`half`) lệch một nửa ô ⇒ hai tấm trượt khỏi nhau mà vẫn "trông liền";
  //   · một bên khoét nước còn bên kia không (hai `setting` khác nhau, hoặc quên `khoetLongNuoc`);
  //   · ai đó trả nền chân trời về một hằng số ⇒ vành phẳng quay lại.
  //
  // ⚠️ VÀ NHÁNH ƯỚT/KHÔ ĐÃ GỘP LÀM MỘT — MỘT NGOẠI LỆ BIẾN MẤT. Bản trước phải bỏ qua các điểm ướt
  // ở mốc "trong" và giữ hẳn một danh sách 9 kỷ (`BO_QUA_KY`), vì lúc ấy hai tấm có hai cái NỀN
  // khác nhau nên ở chỗ blend lửng chúng lệch tới 2,16e-1. Nay nền là một, nên câu hỏi ướt và câu
  // hỏi khô là CÙNG một câu. Đo thật ở HEAD: 270 điểm (50 điểm chạm nước), lệch lớn nhất **đúng 0**.
  let soDiem = 0;
  let soUot = 0;
  let lechMax = 0;
  const cao = [];
  for (const era of ERAS) {
    const t = buildTerrain({ era, gridSize: 12 });
    const h = buildHorizon({ era, gridSize: 12, terrain: t });
    const half = (12 - 1) / 2;
    for (const [moc, d] of [['giáp', h.innerEdge], ['ngoài', h.innerEdge + 0.3], ['trong', h.innerEdge - 2]]) {
      for (const [x, z] of [[d, 0], [0, d], [-d, 0], [0, -d], [d, d], [-d, d * 0.4]]) {
        soDiem += 1;
        if (t.setting.blendAt(x + half, z + half) > 0) soUot += 1;
        const troi = h.heightAt(x, z);
        const dat = t.surfaceHeightAt(x + half, z + half);
        lechMax = Math.max(lechMax, Math.abs(troi - dat));
        cao.push(troi);
        assert.ok(Math.abs(troi - dat) < 1e-9,
          `kỷ ${era}: chỗ giáp (${x}, ${z}, mốc "${moc}") — chân trời ${troi} ≠ địa hình ${dat}`);
      }
    }
  }
  assert.equal(soDiem, 270, 'số điểm lấy mẫu đã đổi — kiểm lại vòng lặp trước khi tin con số nào');
  // Gác chạy-rỗng cho nhánh nước: mất nước thì bài này thôi canh được phép khoét, mà mất trong im lặng.
  assert.ok(soUot > 25, `chỉ ${soUot} điểm giáp chạm nước — nhánh so phép khoét đang teo lại`);

  // ⚠️ ĐỐI CHỨNG 1 — HAI TẤM PHẲNG THÌ CŨNG KHỚP. Không có vế này thì bài trên vẫn XANH TRỌN VẸN
  // trong đúng cái thế giới cũ có cái bệ. "Khớp nhau" canh cái KHE HỞ; nó không canh cái BỆ.
  // Đo thật: cao độ ở 270 điểm ấy trải 1,789 đơn vị.
  const trai = Math.max(...cao) - Math.min(...cao);
  assert.ok(trai > 0.5,
    `cao độ ở chỗ giáp chỉ trải ${trai.toFixed(4)} đơn vị — nó đang phẳng trở lại, tức cái vành mà `
    + 'mắt đọc ra là mép bàn vừa quay về (§2(b) lệnh Đàm 2026-08-21).');

  // ⚠️ ĐỐI CHỨNG 2 — NHỐT THẾ GIỚI CŨ. Bản cũ đòi mọi điểm giáp KHÔ phải bằng đúng `-APRON_DROP`.
  // Đòi hỏi ấy nay sai tới 0,939 đơn vị ở chỗ lệch nhất, nên nếu ai đó khôi phục nó thì phải thấy
  // ngay là nó nói về một thế giới khác, chứ không phải "chỉ hơi lệch".
  const lechHang = Math.max(...cao.map((c) => Math.abs(c + APRON_DROP)));
  assert.ok(lechHang > 0.3,
    `chỗ giáp chỉ còn lệch ${lechHang.toFixed(4)} so với hằng số ${-APRON_DROP} — lời hứa cũ "phẳng `
    + 'đúng một mức" đang đúng trở lại, tức nền chân trời vừa bị đưa về hằng số.');
  assert.equal(lechMax, 0, 'hai tấm hết khớp TUYỆT ĐỐI — nền của chúng đã tách khỏi nhau');
});

test('⚠️ KHÔNG PHỤ THUỘC TIẾN ĐỘ NGƯỜI CHƠI — gọi kèm dữ liệu rác vẫn phải ra y hệt', () => {
  // Cùng cách khoá đã dùng cho `buildTerrain` ở Phase 7B. "Hàm hiện không nhận tham số đó" là một
  // sự thật rất dễ mất: người sau chỉ cần thêm một tham số tuỳ chọn là bất biến chết mà test vẫn
  // xanh. Nếu chân trời đổi theo tiến độ thì mỗi lần Đàm xây xong một căn nhà, cả dãy núi sẽ nhích.
  const probes = [[14, 0], [0, 22], [26, 26], [-31, 9], [18, -24]];
  for (const era of [5, 11, 13]) {
    const clean = buildHorizon({ era, gridSize: 12 });
    const dirty = buildHorizon({
      era, gridSize: 12, built: ['a', 'b'], buildings: [1, 2, 3], sessions: 99, pending: [{ x: 1 }],
    });
    for (const [x, z] of probes) {
      assert.equal(dirty.heightAt(x, z), clean.heightAt(x, z),
        `kỷ ${era}: chân trời đổi theo tiến độ người chơi tại (${x}, ${z})`);
    }
  }
});

test('tất định tuyệt đối: cùng kỷ + cùng điểm → cùng cao độ, mãi mãi', () => {
  for (const era of [1, 7, 13]) {
    const a = buildHorizon({ era, gridSize: 12 });
    const b = buildHorizon({ era, gridSize: 12 });
    for (const [x, z] of [[15, 3], [-28, 19], [33, -33]]) {
      assert.equal(a.heightAt(x, z), b.heightAt(x, z), `kỷ ${era} không tất định tại (${x}, ${z})`);
    }
  }
});

test('⚠️ KỶ KHAI CÓ NÚI THÌ PHẢI THẤY NÚI — và kỷ khai phẳng thì phải THẬT phẳng', () => {
  // Bài test của bài học Phase 8D: một cơ chế có thể chạy đầy đủ mà không làm gì cả. Ở đây kiểu
  // hỏng đó rất dễ xảy ra — chỉ cần `onset` bị đẩy ra quá xa `reach` là mọi kỷ đều phẳng lì, mà
  // bảng vẫn khai đủ 15 dòng số đẹp đẽ.
  const sample = (era) => {
    const h = buildHorizon({ era, gridSize: 12 });
    let top = -Infinity;
    for (let x = -h.reach; x <= h.reach; x += 1.5) {
      for (let z = -h.reach; z <= h.reach; z += 1.5) {
        top = Math.max(top, h.heightAt(x, z) + APRON_DROP);
      }
    }
    return top;
  };
  // Kỷ 13 (Nhật, "kẹp giữa núi") và kỷ 5 (Đức, mỏm đá) phải dựng được núi CAO HƠN NHÀ.
  for (const era of [5, 13]) {
    assert.ok(sample(era) > 2.5, `kỷ ${era} khai núi cao ${HORIZON_STYLES[era].rise} nhưng dựng ra chỉ ${sample(era).toFixed(2)}`);
  }
  // Kỷ 12 (Nga, thảo nguyên) và kỷ 3 (Lưỡng Hà) phải gần phẳng — nếu không thì "phẳng đến mức thành
  // biểu tượng" là một câu nói dối.
  for (const era of [3, 12]) {
    assert.ok(sample(era) < 1.0, `kỷ ${era} khai thảo nguyên phẳng nhưng dựng ra núi cao ${sample(era).toFixed(2)}`);
  }
  // Và kỷ nhiều núi nhất phải cao hơn kỷ phẳng nhất ÍT NHẤT 4 lần — không chỉ "lớn hơn".
  assert.ok(sample(13) > sample(12) * 4, 'núi Nhật Bản và thảo nguyên Nga ra gần bằng nhau');
});

test('⚠️ fBm PHẢI THẬT SỰ NHIỀU TẦNG — một vòng `for` chạy đúng một vòng vẫn là nhiễu một tầng', () => {
  // Bài học Phase 8D: một cơ chế chạy đầy đủ mà không làm gì cả, kèm một chú thích dài giải thích
  // nó chạy ra sao. Nhìn mã thì `heightAt` có hẳn một vòng lặp trông rất "phân dạng"; chỉ cần
  // `baseCell` tụt xuống sát sàn Nyquist là vòng ấy chạy đúng MỘT vòng và ta quay về đúng đám bong
  // bóng tròn xoe của bản đầu — mà không một bài test nào đỏ.
  for (const era of ERAS) {
    const h = buildHorizon({ era, gridSize: 12 });
    assert.ok(h.octaves >= 3,
      `kỷ ${era} chỉ có ${h.octaves} tầng nhiễu ⇒ không còn là địa hình phân dạng`);
    assert.ok(h.octaves <= MAX_OCTAVES, `kỷ ${era} vượt trần ${MAX_OCTAVES} tầng`);
  }
});

test('⚠️ `rough` PHẢI ĐỔI ĐƯỢC BỀ MẶT — đo bằng ĐỘ CONG của RIÊNG số hạng núi', () => {
  // Đây là bài test đắt giá nhất file này, vì nó là bài DUY NHẤT phân biệt được "fBm đang chạy" với
  // "fBm là mã chết". Thử ngược thật (ép `octaves = 1`) cho ra: kỷ 13 tụt 0,0111 → 0,0038 và kỷ 5
  // tụt 0,0115 → 0,0045, trong khi kỷ 12/15 đứng yên (0,00088 → 0,00083). Ngưỡng dưới đây nằm giữa
  // hai bộ số đó, nên quay về một tầng là ĐỎ NGAY.
  //
  // ⚠️ VÀ PHẢI LÀ SAI PHÂN BẬC HAI, KHÔNG PHẢI BẬC MỘT. Bản đầu của chính phép đo này lấy |Δ| giữa
  // hai đỉnh kề, rồi cho ra hai bộ số GIỐNG HỆT NHAU ở bản một tầng và bản fBm — suýt kết luận
  // "fBm vô dụng, bỏ đi". Nguyên nhân: |Δ| bị cái DỐC từ `onset` lên `reach` át hoàn toàn, mà dốc
  // ấy thì hai bản giống nhau. Sai phân bậc hai cho dốc thẳng ra 0 nên chỉ còn nghe thấy chi tiết.
  // Lần thứ 19 công cụ đo tự chế nói dối, và lần này nó nói dối theo hướng "chê oan".
  //
  // ⚠️ VIỆC 2 Bước B (2026-08-19) — MẶT NƯỚC LÀM CHÍNH PHÉP ĐO NÀY NÓI DỐI. Con sông kỷ 12 khoét hai
  // bờ dốc vào tấm chân trời, mà bờ sông thì có ĐỘ CONG rất lớn — nên phép đo nhảy từ 0,00088 lên
  // **0,01618** và bài test đỏ với thông báo *"kỷ 12 khai rough 0,16 nhưng bề mặt gồ ghề"*. Thảo
  // nguyên Nga vẫn trơn y như cũ; thứ gồ ghề là BỜ SÔNG. Cách sửa: bỏ những mẫu chạm nước ra khỏi
  // mẫu số, và bỏ cả ba điểm của khuôn sai phân.
  //
  // ⚠️ 2026-08-21 — LẦN THỨ BA CÙNG MỘT HÌNH DẠNG SAI, VÀ LẦN NÀY THỦ PHẠM LÀ CHÍNH BẢN VÁ §2(b).
  // Nền của tấm chân trời nay là mặt đất thật (`terrain.nenKho`), mà mặt đất ấy có gợn riêng của nó
  // (hai tầng nhiễu ở cỡ 3,4 và 1,55 ô) — tức phép đo bắt đầu nghe thấy một thứ chẳng liên quan gì
  // tới `rough`. Kỷ 3 (Lưỡng Hà, `rough` 0,15, `rise` chỉ 0,5 nên phép chia khuếch đại) nhảy lên
  // **0,00761** và đỏ; kỷ 14 lên 0,01192. Không phải mã hỏng — phép đo đang trộn hai đại lượng, đúng
  // bài học Phase 9A (*"đại lượng này có chứa thứ mình KHÔNG muốn đo không?"*).
  //
  // ⇒ Trừ nền ra rồi mới đo: `núi(x,z) = heightAt − nenKho`. Ở vùng khô thì `khoetLongNuoc` trả về
  // nguyên nền, nên hiệu ấy CHÍNH XÁC là số hạng `rise × t × shape × luiNui` — không xấp xỉ.
  // Đo thật sau khi trừ: kỷ 3 về 0,00134 · kỷ 12 0,00086 · kỷ 15 0,00122 · kỷ 5 0,01151 · kỷ 13
  // 0,01019 — tức hai đầu tách xa nhau hơn cả bản trước bản vá.
  const curvature = (era) => {
    const t = buildTerrain({ era, gridSize: 12 });
    const h = buildHorizon({ era, gridSize: 12, terrain: t });
    const setting = buildSetting({ era, gridSize: 12 });
    const half = (12 - 1) / 2;
    const uot = (x, z) => setting.blendAt(x + half, z + half) > 0;
    // CHỈ số hạng núi. Trừ đúng cái trường mà `horizon.js` cộng vào, không dựng lại một bản
    // "tương đương" — một luật một công thức.
    const nui = (x, z) => h.heightAt(x, z) - t.nenKho(x + half, z + half);
    const s = h.step;
    let sum = 0;
    let n = 0;
    let boQuaVìNuoc = 0;
    for (let x = -h.reach; x <= h.reach; x += s) {
      for (let z = -h.reach; z <= h.reach; z += s) {
        if (uot(x - s, z) || uot(x, z) || uot(x + s, z)) { boQuaVìNuoc += 1; continue; }
        const a = nui(x - s, z);
        const b = nui(x, z);
        const c = nui(x + s, z);
        // Vành trong `onset`: số hạng núi bằng 0 tuyệt đối ⇒ không mang tin gì về `rough`.
        if (a === 0 && b === 0 && c === 0) continue;
        sum += Math.abs(a - 2 * b + c);
        n += 1;
      }
    }
    assert.ok(n > 400,
      `kỷ ${era}: chỉ còn ${n} mẫu độ cong (bỏ ${boQuaVìNuoc} mẫu vì chạm nước) — phép đo đã rỗng, `
      + 'nó không còn phân biệt được fBm đang chạy với fBm là mã chết');
    return (sum / n) / HORIZON_STYLES[era].rise;
  };
  // Núi đá (Đức, Nhật) phải có chi tiết ở cỡ lưới…
  for (const era of [5, 13]) {
    assert.ok(curvature(era) > 0.008,
      `kỷ ${era} khai rough ${HORIZON_STYLES[era].rough} nhưng bề mặt trơn (${curvature(era).toFixed(5)}) ⇒ fBm không chạy`);
  }
  // …còn thảo nguyên và đụn cát phải TRƠN THẬT. Không có vế này thì "làm gồ ghề hết tất cả" cũng
  // qua được bài test, mà như thế là xoá mất chính sự khác biệt giữa 15 kỷ.
  for (const era of [3, 12, 15]) {
    assert.ok(curvature(era) < 0.003,
      `kỷ ${era} khai rough ${HORIZON_STYLES[era].rough} (cát/thảo nguyên trơn) nhưng bề mặt gồ ghề ${curvature(era).toFixed(5)}`);
  }
});

test('không bao giờ vượt `horizonMaxHeight` — camera và sương đều dựa vào con số này', () => {
  // Cùng lý do tồn tại với bài test khoá `terrainMaxHeight`: hai công thức "tương đương trên giấy"
  // là thứ dự án này đã trả giá nhiều lần. Ở đây phải chạy CẢ HAI rồi so, không so mỗi bên với một
  // con số thứ ba (bài học Phase 8B).
  for (const era of ERAS) {
    const h = buildHorizon({ era, gridSize: 12 });
    const cap = horizonMaxHeight(era);
    for (let x = -h.reach; x <= h.reach; x += 1.1) {
      for (let z = -h.reach; z <= h.reach; z += 1.1) {
        assert.ok(h.heightAt(x, z) + APRON_DROP <= cap + 1e-9,
          `kỷ ${era} vượt trần tại (${x}, ${z}): ${(h.heightAt(x, z) + APRON_DROP).toFixed(3)} > ${cap}`);
      }
    }
  }
});

test('thế giới phải nằm GỌN trong vòm trời, nếu không núi sẽ đâm thủng bầu trời', () => {
  // Bán kính vòm trời là `gridSize * 3.6` (xem `sceneGraph.js`). Vùng đất xa vươn ra tới
  // `gridSize * HORIZON_REACH`; vượt qua vòm thì mép thế giới lòi ra ngoài bầu trời — một lỗi
  // không thể nhìn thấy trên ảnh chụp mặc định (camera không xoay tới đó), nhưng Đàm kéo camera là
  // gặp ngay.
  assert.ok(HORIZON_REACH < 3.6, `vùng đất xa vươn tới ${HORIZON_REACH} × lưới, quá vòm trời 3,6`);
  // …và cũng phải xa hơn khoảng camera lùi hết cỡ (3,1 × lưới), nếu không thu nhỏ hết cỡ sẽ thấy
  // mép thế giới lơ lửng giữa khung hình.
  assert.ok(HORIZON_REACH > 2.6, `vùng đất xa chỉ tới ${HORIZON_REACH} × lưới, gần hơn tầm camera lùi`);
});
