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
  // Bằng chứng phải là bốn góc: có kỷ đất-thấp/núi-cao VÀ có kỷ đất-cao/núi-thấp. Chỉ cần thiếu một
  // trong hai chiều là hai đại lượng đã có thể suy ra nhau bằng một phép nhân.
  const lowGroundHighSky = ERAS.filter((e) => ERA_TERRAIN[e].relief <= 0.95 && HORIZON_STYLES[e].rise >= 3);
  const highGroundLowSky = ERAS.filter((e) => ERA_TERRAIN[e].relief >= 1.0 && HORIZON_STYLES[e].rise <= 3);
  assert.ok(lowGroundHighSky.length > 0,
    'không kỷ nào có đất phẳng mà núi cao (Kyoto) ⇒ chân trời đang chỉ là `relief` nhân lên');
  assert.ok(highGroundLowSky.length > 0,
    'không kỷ nào có đất gồ ghề mà chân trời thấp ⇒ chân trời đang chỉ là `relief` nhân lên');
});

test('kỷ lạ / thiếu → lùi về kỷ 1, không ném lỗi (dữ liệu cloud có thể hỏng)', () => {
  for (const bad of [undefined, null, 0, 99, -3, 'bảy', NaN]) {
    assert.equal(getHorizonStyle(bad), HORIZON_STYLES[1], `kỷ "${bad}" làm hỏng bảng`);
    const h = buildHorizon({ era: bad, gridSize: 12 });
    assert.ok(Number.isFinite(h.heightAt(20, 20)), `kỷ "${bad}" cho ra cao độ NaN`);
  }
});

test('⚠️ CHỖ GIÁP PHẢI PHẲNG ĐÚNG `-APRON_DROP` — nếu không thì có một khe hở vòng quanh thành phố', () => {
  // Tấm địa hình thành phố kết thúc ở `innerEdge` với cao độ chính xác `-APRON_DROP` (xem
  // `terrain.js`). Vùng đất xa phải bắt đầu ở ĐÚNG con số đó. Lệch một phần nghìn thì mắt không
  // thấy khe, nhưng lệch một phần mười thì có một bậc chạy vòng quanh — và không có gì đỏ lên.
  //
  // ⚠️ VIỆC 2 Bước B (2026-08-19): chỗ nào có NƯỚC thì mốc không còn là hằng số ấy nữa, vì cả hai
  // tấm cùng bị khoét xuống. Lời hứa gốc không đổi — hai tấm phải khớp nhau — nên chỗ ướt chuyển
  // sang hỏi thẳng `terrain.surfaceHeightAt`, KHÔNG bỏ qua trắng (bỏ qua trắng thì bài này rỗng
  // dần mỗi lần thêm một kỷ được dựng nước, mà rỗng dần thì không ai thấy).
  //
  // ⚠️ BƯỚC C (2026-08-20) — PHÉP ĐO PHẢI CHẠM ĐÚNG CHỖ NÓ NÓI. Bài này lấy mẫu ở BA khoảng cách,
  // và chúng KHÔNG hỏi cùng một câu:
  //   · `innerEdge`      = đúng chỗ giáp — CẢ HAI tấm đều được vẽ ở đây ⇒ hỏi được "hai tấm có khớp
  //                        nhau không". Đo thật: lệch lớn nhất **1,11e-16** (16 điểm ướt).
  //   · `innerEdge+0.3`  = ngay bên ngoài — vẫn cả hai tấm ⇒ vẫn hỏi được. Đo thật: **đúng 0** (15 điểm).
  //   · `innerEdge-2`    = NẰM TRONG tấm đất thành phố, nơi tấm chân trời KHÔNG hề được vẽ ra. Ở đây
  //                        `h.heightAt` chỉ là một giá trị toán học, không phải thứ Đàm nhìn thấy.
  // Bản trước hỏi "hai tấm có khớp không" ở CẢ BA, kể cả cái thứ ba — tức so hai tấm ở chỗ chỉ có
  // một tấm tồn tại. Nó xanh nhiều tháng chỉ vì hai kỷ có nước lúc ấy (12 và 14) tình cờ có
  // `blend = 1` tại các điểm lấy mẫu: khi blend bằng 1 thì cả hai tấm cùng sập về đúng đáy
  // `WATER_SURFACE_Y − depthAt`, nền của chúng bị nuốt sạch nên không thể lệch. Kỷ sông hẹp có blend
  // LỬNG ở đó ⇒ hai cái nền khác nhau lộ ra, lệch tới 2,16e-1 (kỷ 6). Cùng họ bài học
  // `diemToanTheGioi`: phép đo không với tới (hoặc không áp dụng được) chỗ nó tự nhận là đang đo.
  // ⇒ Điểm ƯỚT ở mốc TRONG được bỏ qua — nhưng bỏ qua phải ĐẾM ĐƯỢC, nếu không nó lặng lẽ nuốt dần
  // cả bài test. `BO_QUA_KY` tự đỏ CẢ HAI CHIỀU: kỷ thứ mười lấn nước vào tới đó thì đỏ, mà một
  // trong chín kỷ ấy rút nước ra cũng đỏ.
  let soKho = 0;
  let soUot = 0;
  const boQua = [];
  for (const era of ERAS) {
    const h = buildHorizon({ era, gridSize: 12 });
    const t = buildTerrain({ era, gridSize: 12 });
    const half = (12 - 1) / 2;
    for (const [moc, d] of [['giáp', h.innerEdge], ['ngoài', h.innerEdge + 0.3], ['trong', h.innerEdge - 2]]) {
      for (const [x, z] of [[d, 0], [0, d], [-d, 0], [0, -d], [d, d], [-d, d * 0.4]]) {
        const uot = t.setting.blendAt(x + half, z + half) > 0;
        if (uot && moc === 'trong') {
          boQua.push(era);
          continue;
        }
        if (uot) {
          soUot += 1;
          assert.ok(Math.abs(h.heightAt(x, z) - t.surfaceHeightAt(x + half, z + half)) < 1e-9,
            `kỷ ${era}: chỗ giáp có nước (${x}, ${z}, mốc "${moc}") — chân trời ${h.heightAt(x, z)} `
            + `≠ địa hình ${t.surfaceHeightAt(x + half, z + half)}`);
          continue;
        }
        soKho += 1;
        assert.equal(h.heightAt(x, z), -APRON_DROP,
          `kỷ ${era}: chỗ giáp (${x}, ${z}, mốc "${moc}") cao ${h.heightAt(x, z)} thay vì ${-APRON_DROP}`);
      }
    }
  }
  assert.ok(soKho > 200, `chỉ còn ${soKho} điểm giáp khô — lời hứa "phẳng đúng" đang rỗng dần`);
  // Phải chạy ở CẢ HAI mốc ngoài, không chỉ một: hôm nay 16 điểm ở "giáp" + 15 ở "ngoài" = 31.
  assert.ok(soUot > 25, `chỉ ${soUot} điểm giáp chạm nước — nhánh so hai tấm đang teo lại`);
  assert.deepEqual([...new Set(boQua)].sort((a, b) => a - b), [3, 5, 6, 7, 8, 9, 10, 11, 12],
    `những kỷ có nước lấn vào TRONG tấm đất tới ${'`innerEdge-2`'} đã đổi — bảng này phải đổi theo, `
    + 'và phải kiểm lại bằng mắt rằng chỗ giáp vẫn liền');
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

test('⚠️ `rough` PHẢI ĐỔI ĐƯỢC BỀ MẶT — đo bằng ĐỘ CONG ở đúng cỡ lưới', () => {
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
  // ⚠️ VIỆC 2 Bước B (2026-08-19) — MẶT NƯỚC LÀM CHÍNH PHÉP ĐO NÀY NÓI DỐI, VÀ ĐÂY LÀ LẦN THỨ HAI
  // CÙNG MỘT HÌNH DẠNG SAI. Con sông kỷ 12 khoét hai bờ dốc vào tấm chân trời, mà bờ sông thì có
  // ĐỘ CONG rất lớn — nên phép đo nhảy từ 0,00088 lên **0,01618** và bài test đỏ với thông báo
  // *"kỷ 12 khai rough 0,16 nhưng bề mặt gồ ghề"*. Thảo nguyên Nga vẫn trơn y như cũ; thứ gồ ghề
  // là BỜ SÔNG, một đại lượng chẳng liên quan gì tới `rough`. Đúng bài học Phase 9A: *"hỏi xem đại
  // lượng này có chứa thứ mình KHÔNG muốn đo không"*.
  //
  // Cách sửa ĐÚNG không phải nới ngưỡng (nới là bỏ răng cho cả năm kỷ) mà là **bỏ những mẫu chạm
  // nước ra khỏi mẫu số** — và phải bỏ cả ba điểm của khuôn sai phân, vì chỉ cần một điểm bị khoét
  // là cả bộ ba đã mang thông tin về bờ. Kèm một gác chạy-rỗng: nếu phép loại ấy ăn quá nhiều mẫu
  // thì bài test này thành rỗng, và rỗng thì nó không còn phân biệt được fBm sống với fBm chết.
  const curvature = (era) => {
    const h = buildHorizon({ era, gridSize: 12 });
    const setting = buildSetting({ era, gridSize: 12 });
    const half = (12 - 1) / 2;
    const uot = (x, z) => setting.blendAt(x + half, z + half) > 0;
    const s = h.step;
    let sum = 0;
    let n = 0;
    let boQuaVìNuoc = 0;
    for (let x = -h.reach; x <= h.reach; x += s) {
      for (let z = -h.reach; z <= h.reach; z += s) {
        if (uot(x - s, z) || uot(x, z) || uot(x + s, z)) { boQuaVìNuoc += 1; continue; }
        const a = h.heightAt(x - s, z);
        const b = h.heightAt(x, z);
        const c = h.heightAt(x + s, z);
        if (a === -APRON_DROP && b === -APRON_DROP && c === -APRON_DROP) continue;
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
