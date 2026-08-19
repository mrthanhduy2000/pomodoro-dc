/**
 * settingStyle.test.js — BẢNG ĐỊA THẾ 15 KỶ.
 *
 * Đây là toàn bộ lưới an toàn của BƯỚC A (bảng, chưa có hình). Bước B sẽ có file test riêng cho
 * HÌNH, đúng cách `roofStyle.test.js` (bảng) chia việc với `rooftop.test.js` (hình) — file này
 * KHÔNG được biết gì về hình học.
 *
 * Ba luật Đàm ra cho bảng này đều được viết thành assert ĐẾM ĐƯỢC ở đây, mỗi luật kèm một ĐỐI
 * CHỨNG bơm bảng hỏng vào: một luật chỉ có mã sản phẩm mà không có đối chứng thì ngưỡng sẽ bị nới
 * dần cho tiện (bài học phễu Phase 9A).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SETTING_STYLES, getSetting, isValidSetting, hasWater,
  WATER_KINDS, WATER_SIDES, GROUND_FORMS,
  MAX_SEA_ERAS, MAX_SIDE_SPREAD,
  summarizeSettings, settingCountryMismatches,
} from './settingStyle.js';
import { ERA_STYLES, getEraStyle } from './eraStyle.js';
import { OUTSKIRT_REACH } from './outskirts.js';

const ERAS = Object.keys(ERA_STYLES).map(Number).sort((a, b) => a - b);

/** Bốn hướng thật, không tính `'none'` của kỷ khô. */
const HUONG_THAT = WATER_SIDES.filter((s) => s !== 'none');

/** Một dòng hợp lệ để đối chứng bẻ từng trường một. Kỷ 12 (sông, có đủ mọi trường). */
const MAU_HOP_LE = { ...SETTING_STYLES[12] };

test('BẢNG: cả 15 kỷ đều khai địa thế, và không dòng nào sai định dạng', () => {
  // THỬ-CHO-ĐỎ: đổi `width` kỷ 11 từ null thành 4 → đỏ ngay ở kỷ 11 (luật (b): biển không có bờ
  // bên kia nên không có bề rộng hữu hạn).
  for (const era of ERAS) {
    const st = getSetting(era);
    assert.ok(st, `kỷ ${era} chưa có dòng địa thế`);
    assert.ok(isValidSetting(st), `kỷ ${era}: dòng địa thế sai định dạng — ${JSON.stringify(st)}`);
  }
});

test('HAI BẢNG KHÔNG ĐƯỢC TRÔI KHỎI NHAU: khoá của bảng địa thế phải khớp KHOÁ CỦA `ERA_STYLES`', () => {
  // Cùng sợi dây đã buộc `groundFloorStyle` · `roofStyle` · `floraStyle` vào `eraStyle`. Thiếu nó
  // thì thêm một kỷ thứ 16 sẽ lặng lẽ nhận `undefined` ở một bảng và không có gì đỏ lên.
  // THỬ-CHO-ĐỎ: xoá dòng kỷ 15 khỏi `SETTING_STYLES` → đỏ ở `deepEqual` bộ khoá.
  assert.deepEqual(
    Object.keys(SETTING_STYLES).sort(),
    Object.keys(ERA_STYLES).sort(),
    'bảng địa thế và bảng kỷ không còn cùng một bộ khoá',
  );
  assert.equal(ERAS.length, 15, 'dự án có đúng 15 kỷ — đổi con số này là đổi cả game');
});

test('KỶ LẠ PHẢI RƠI VỀ CÙNG MỘT KỶ Ở CẢ HAI BẢNG — một luật, một công thức', () => {
  // ⚠️ Bài này ra đời vì một phép thử ngược ở Việc 2 (bảng tầng trệt) KHÔNG NỔ: thay
  // `normalizeEraKey` bằng `Math.round` mà không có gì đỏ lên, tức lời hứa "các bảng cùng một phép
  // chuẩn hoá" khi ấy chỉ được giữ bởi một dòng chú thích. Bảng thứ năm ra đời thì lời hứa ấy có
  // thêm một chỗ để gãy.
  // THỬ-CHO-ĐỎ: đổi `getSetting` thành `SETTING_STYLES[Math.round(Number(era)) || 1]` → đỏ ở đầu
  // vào `2.4` (bảng kỷ làm tròn xuống, `Math.round` làm tròn lên).
  const LA = [undefined, null, NaN, 0, -3, 2.4, 99, 16, '7', Infinity];
  const khoaCua = (style) => Object.keys(ERA_STYLES).find((k) => ERA_STYLES[k] === style);
  for (const dauVao of LA) {
    const ky = khoaCua(getEraStyle(dauVao));
    assert.ok(ky, `đầu vào ${String(dauVao)}: \`getEraStyle\` không trả về dòng nào của bảng kỷ`);
    assert.equal(getSetting(dauVao), SETTING_STYLES[ky],
      `đầu vào ${String(dauVao)}: bảng địa thế rơi về một kỷ KHÁC bảng kỷ`);
  }
});

test('KHOÁ VÀO `country`: mỗi dòng địa thế phải nói về ĐÚNG nước của kỷ đó, không dính chữ nước khác', () => {
  // Vế một là sợi dây thẳng (`country` của hai bảng phải bằng nhau). Vế hai — `note` phải nhắc tới
  // thứ chỉ nước ấy mới có, và KHÔNG được nhắc thứ của nước khác — mới là vế bắt được lỗi thật:
  // cách hỏng dễ xảy ra nhất với một bảng địa lý là chép dòng của kỷ này sang kỷ kia rồi sửa nửa
  // chừng, và lúc đó `country` vẫn đúng còn câu chuyện thì của nước khác.
  //
  // ⚠️ CHỌN TỪ KHOÁ — ba luật đã trả giá ở `roofStyle.test.js`, áp lại nguyên vẹn:
  //   (a) không dùng thứ hai nền cùng có (ở đây: "sông", "vịnh", "kênh" — vô dụng làm từ khoá);
  //   (b) không dùng chuỗi quá ngắn ('ur' là chuỗi con của "Burg Eltz"; 'nin' là chuỗi con của rất
  //       nhiều thứ) ⇒ dùng 'ziggurat' và 'sông nin';
  //   (c) `note` không được nhắc tên nước của kỷ khác.
  // THỬ-CHO-ĐỎ: thêm chữ "Manchester" vào `note` kỷ 11 → đỏ ở vế thứ hai, đúng kỷ 11.
  const TU_KHOA = {
    'Thổ Nhĩ Kỳ': ['göbekli'],
    'Ai Cập': ['deir el-medina', 'sông nin'],
    Iraq: ['ziggurat', 'euphrates', 'sumer'],
    'Trung Quốc': ['trường an', 'quan trung'],
    'Đức': ['burg eltz', 'eifel', 'elzbach'],
    'Việt Nam': ['bắc bộ', 'đình làng', 'sông hồng'],
    'Ý': ['duomo', 'firenze', 'arno', 'pisa'],
    'Bồ Đào Nha': ['lisboa', 'tagus', 'mar da palha', 'belém'],
    'Pháp': ['paris', 'seine', 'panthéon'],
    Anh: ['manchester', 'bridgewater', 'liverpool'],
    'Mỹ': ['new york', 'hudson', 'manhattan'],
    Nga: ['stalingrad', 'volga'],
    'Nhật Bản': ['nakagin', 'tokyo'],
    Singapore: ['marina bay', 'malacca'],
    UAE: ['dubai'],
  };
  assert.equal(Object.keys(TU_KHOA).length, ERAS.length,
    'mỗi kỷ một nước — thiếu/thừa ở đây nghĩa là bảng `country` đã đổi mà bài test chưa theo');

  assert.deepEqual(settingCountryMismatches(), [],
    'bảng địa thế khai `country` khác bảng kỷ — hai bảng đã trôi khỏi nhau');

  for (const era of ERAS) {
    const nuoc = getEraStyle(era).country;
    const note = getSetting(era).note.toLowerCase();
    const cuaMinh = TU_KHOA[nuoc];
    assert.ok(cuaMinh, `kỷ ${era}: nước "${nuoc}" chưa có từ khoá trong bài test này`);
    assert.ok(cuaMinh.some((k) => note.includes(k)),
      `kỷ ${era} (${nuoc}): dòng địa thế không nhắc tới thứ gì của nước ấy — "${note}"`);
    for (const [khac, tu] of Object.entries(TU_KHOA)) {
      if (khac === nuoc) continue;
      const lan = tu.filter((k) => note.includes(k));
      assert.deepEqual(lan, [],
        `kỷ ${era} (${nuoc}) lại nhắc tới ${khac}: ${lan.join(', ')} — dấu hiệu chép dòng`);
    }
  }
});

test('LUẬT (1) — "KHÔNG CÓ NƯỚC" phải khai TƯỜNG MINH và ĐẾM ĐƯỢC, không rơi về mặc định', () => {
  // ⚠️ Đây là con số hẹn giờ của bảng này. Bài học Phase 10 Bước 1: *"một mục nợ trong tài liệu chỉ
  // được đọc khi có người đi tìm; một con số trong bài test thì tự đòi được đọc."* Kỷ khô thứ ba
  // xuất hiện ⇒ đỏ; một trong hai kỷ khô được cấp nước ⇒ cũng đỏ. Cả hai chiều đều bắt buộc phải
  // được nhìn lại bằng mắt người, vì "khô" là một quyết định mỹ thuật chứ không phải một mặc định.
  // ⚠️ CON SỐ NÀY ĐÃ ĐỔI MỘT LẦN, VÀ CHÍNH NÓ LÀ THỨ BUỘC PHẢI SỬA BÀI TEST KHI ĐÀM BÁC DÒNG KỶ 5
  // (2026-08-19): bảng từng khai `[1, 5]`, nay còn `[1]`. Đó đúng là việc nó sinh ra để làm — một
  // danh sách chép cứng thì mọi lần đổi đều phải đi qua mắt người, không lặng lẽ trôi.
  // THỬ-CHO-ĐỎ: đổi kỷ 2 sang `water:'none', side:'none', reach:0, width:null` → đỏ ở `deepEqual`
  // (`[1, 2]` thay vì `[1]`).
  const KHO = ERAS.filter((e) => !hasWater(e));
  assert.deepEqual(KHO, [1],
    'danh sách kỷ KHÔNG có nước đã đổi — đây là quyết định mỹ thuật, phải xem lại bằng mắt');

  // Và `hasWater` phải đọc đúng bảng, không phải đọc một danh sách chép tay ở đâu đó.
  for (const era of ERAS) {
    assert.equal(hasWater(era), getSetting(era).water !== 'none',
      `kỷ ${era}: \`hasWater\` không khớp chính dòng bảng của nó`);
  }
});

test('LUẬT (2) — biển KHÔNG được quá nửa số kỷ, và trần phải thật sự dưới nửa', () => {
  // *"Kỷ nào cũng ven biển thì biển thôi mang thông tin, và ta mất đúng thứ vừa xây được suốt mười
  // phase — bản sắc 15 kỷ."*
  // THỬ-CHO-ĐỎ: đổi kỷ 2·3·4·6 sang `water:'sea', width:null` → 8 kỷ biển → đỏ ở vế trần.
  const dem = summarizeSettings().water;
  assert.ok((dem.sea ?? 0) <= MAX_SEA_ERAS,
    `${dem.sea} kỷ có biển, vượt trần ${MAX_SEA_ERAS}`);

  // ⚠️ Trần tự nó cũng phải được canh: một trần đặt ở 14 vẫn "đúng" về mặt cú pháp mà vô nghĩa.
  assert.ok(MAX_SEA_ERAS * 2 < ERAS.length,
    `trần ${MAX_SEA_ERAS} không còn "dưới một nửa" của ${ERAS.length} kỷ`);

  // Và nói thẳng phần chưa được bảo vệ (bài học phễu Phase 9A): hôm nay 3, trần 7, tức còn 4 chỗ
  // trống. Con số 3 được ghim để một phiên sau đổi kỷ nào sang biển thì phải mở bài này ra đọc.
  // (Đã đổi 4 → 3 ngày 2026-08-19: kỷ 11 từ `sea` sang `estuary` cho khớp `note` bến tàu Hudson.)
  assert.equal(dem.sea, 3,
    'số kỷ có biển đã đổi — vẫn dưới trần, nhưng đây là thứ Đàm cấm nới dần, phải xem lại bằng mắt');
});

test('LUẬT (2) — ĐỐI CHỨNG: phép đếm PHẢI bắt được một bảng 8 kỷ biển', () => {
  // Không có đối chứng thì không biết bài trên còn răng hay không: nếu `summarizeSettings` đếm sai
  // (ví dụ trả về bảng rỗng) thì `undefined ?? 0 <= 7` vẫn xanh vĩnh viễn.
  // THỬ-CHO-ĐỎ: cho `summarizeSettings` trả `{ water: {}, side: {}, ground: {} }` → đỏ ở đây.
  //
  // ⚠️ Bảng giả phải dựng ĐỘC LẬP với thành phần của bảng thật: bản đầu chỉ ép 8 kỷ đầu sang biển
  // rồi để 7 kỷ sau nguyên vẹn, mà 4 trong số đó vốn đã là biển ⇒ ra 12 chứ không phải 8, và chính
  // dòng gác "bảng giả phải có đúng 8" đã đỏ. Một đối chứng đọc ké bảng thật thì đổi bảng thật là
  // đổi luôn ý nghĩa của đối chứng.
  const bangHong = {};
  for (const era of ERAS) {
    bangHong[era] = era <= 8 ? { ...SETTING_STYLES[13] } : { ...SETTING_STYLES[12] };
  }
  const dem = summarizeSettings(bangHong).water;
  assert.equal(dem.sea, 8, 'bảng giả phải có đúng 8 kỷ biển');
  assert.ok(dem.sea > MAX_SEA_ERAS, 'phép đếm KHÔNG bắt được bảng 8 kỷ biển — trần đã thành cái phễu');
});

test('LUẬT (3) — cả bốn hướng phải CÒN SỐNG, và không hướng nào được ÁP ĐẢO', () => {
  // ⚠️ Vế thứ hai đã ĐỔI HÌNH DẠNG ngày 2026-08-19 theo phán quyết của Đàm: từ một MỨC tuyệt đối
  // (`≤ 6`) sang một QUAN HỆ (hiệu giữa hướng đông nhất và hướng thưa nhất `≤ 2`). Lý do đầy đủ ở
  // chú thích của `MAX_SIDE_SPREAD`; tóm tắt: một mức tuyệt đối vừa quá rộng (6·3·2·2 lọt) vừa
  // trôi khi số kỷ đổi, còn hiệu thì không có cả hai bệnh.
  //
  // Vế thứ nhất ("còn sống") mới là vế siết chặt nhất. Bài học `floraStyle` / 8 trục: *"trục nào
  // cả 15 kỷ khai giống nhau thì bảng thật ra hẹp hơn nó trông"* — một hướng chết hẳn là cách hỏng
  // dễ xảy ra nhất và cũng khó nhìn ra nhất, vì bảng vẫn có đủ 15 dòng khác nhau.
  // THỬ-CHO-ĐỎ: đổi kỷ 3, 9 và 11 từ `tay` sang `bac` → hướng `tay` chết → đỏ ở vế "còn sống".
  const dem = summarizeSettings().side;
  const coNuoc = ERAS.filter((e) => hasWater(e)).length;
  assert.equal(coNuoc, 14, 'số kỷ có nước đã đổi — mọi con số dưới đây tính theo nó');

  for (const huong of HUONG_THAT) {
    assert.ok((dem[huong] ?? 0) >= 1,
      `hướng "${huong}" không kỷ nào dùng — trục hướng đang hẹp hơn nó trông`);
  }
  assert.equal(Object.keys(dem).sort().join(','), HUONG_THAT.slice().sort().join(','),
    'bảng đang dùng một hướng không có trong `WATER_SIDES`, hoặc `none` đã lọt vào phép đếm');

  const soLuong = HUONG_THAT.map((h) => dem[h] ?? 0);
  const lech = Math.max(...soLuong) - Math.min(...soLuong);
  assert.ok(lech <= MAX_SIDE_SPREAD,
    `hướng đông nhất hơn hướng thưa nhất ${lech} kỷ (trần ${MAX_SIDE_SPREAD}) — bảng đang dồn về `
    + `một phía: ${HUONG_THAT.map((h, i) => `${h} ${soLuong[i]}`).join(' · ')}`);
});

test('LUẬT (3) — ĐỐI CHỨNG: phép kiểm phải TỪ CHỐI cả bảng dồn HẾT một hướng lẫn bảng 6·3·2·2', () => {
  // ⚠️ Hỏi TỪNG vế một, không hỏi gộp (bài học `TECH_DEBT #22`: gộp thì một vế đỏ che cho một vế
  // đã mất răng). Và ca 6·3·2·2 là ca Đàm nêu đích danh — nó **lọt qua** bản trần-tuyệt-đối cũ
  // (không hướng nào chạm 6) trong khi rõ ràng là dồn một phía. Không có ca này thì không có gì
  // chứng minh phép kiểm mới thật sự chặt hơn phép kiểm cũ.
  // THỬ-CHO-ĐỎ: nâng `MAX_SIDE_SPREAD` lên 4 → đỏ ở ca 6·3·2·2 (ca dồn-hết vẫn đỏ ở vế "hướng
  // chết", đó chính là lý do phải tách hai vế).
  const lechCua = (dem) => {
    const n = HUONG_THAT.map((h) => dem[h] ?? 0);
    return Math.max(...n) - Math.min(...n);
  };

  // Ca A — dồn HẾT 14 kỷ có nước về `bac`.
  const donHet = {};
  for (const era of ERAS) {
    const st = SETTING_STYLES[era];
    donHet[era] = st.water === 'none' ? { ...st } : { ...st, side: 'bac' };
  }
  const demA = summarizeSettings(donHet).side;
  const chet = HUONG_THAT.filter((h) => (demA[h] ?? 0) === 0);
  assert.deepEqual(chet.sort(), ['dong', 'nam', 'tay'],
    'vế "hướng còn sống" KHÔNG nhận ra ba hướng đã chết');
  assert.ok(lechCua(demA) > MAX_SIDE_SPREAD, 'vế độ lệch KHÔNG bắt được bảng dồn hết một hướng');

  // Ca B — 6·3·2·2, đúng bộ số Đàm nêu: mọi hướng còn sống, tổng chỉ 13, và bản trần-tuyệt-đối cũ
  // (`≤ 6`) cho nó ĐI LỌT. Đây là ca chứng minh phép kiểm mới chặt hơn phép kiểm cũ.
  const CA_B = { bac: 6, nam: 3, dong: 2, tay: 2 };
  const demB = {};
  for (const [h, n] of Object.entries(CA_B)) demB[h] = n;
  assert.equal(HUONG_THAT.every((h) => (demB[h] ?? 0) >= 1), true,
    'ca 6·3·2·2 phải có ĐỦ bốn hướng còn sống — nếu không thì nó bị vế kia bắt, và ca này vô nghĩa');
  assert.ok(Math.max(...Object.values(CA_B)) <= 6,
    'ca 6·3·2·2 phải ĐI LỌT trần tuyệt đối cũ (≤ 6) — đó là toàn bộ lý do nó tồn tại');
  assert.ok(lechCua(demB) > MAX_SIDE_SPREAD,
    `vế độ lệch KHÔNG bắt được bảng 6·3·2·2 (hiệu ${lechCua(demB)}) — phép kiểm mới không chặt hơn`);
});

test('Q2 — MẶT NƯỚC PHẢI NẰM GỌN TRONG VÙNG QUÊ: khoá QUAN HỆ với `OUTSKIRT_REACH`, không khoá số 8', () => {
  // ⚠️ Đàm ra lệnh làm ngay ở Bước A: *"kỷ 15 đang `reach 6` trên vùng quê rộng 8. Nếu ai đó thu
  // `OUTSKIRT_REACH` xuống 5 thì mặt nước kỷ 15 rơi ra ngoài địa hình và không có gì đỏ lên."*
  //
  // ⚠️ VÀ CÔNG THỨC Ở ĐÂY LỆCH NỬA BỀ RỘNG SO VỚI CÔNG THỨC ĐÀM VIẾT (`reach + width/2`) — nói
  // thẳng vì sao. `reach` trong bảng này được định nghĩa là khoảng cách ra tới **MÉP GẦN** của mặt
  // nước, không phải tới TIM nước; nên mép XA nằm ở `reach + width`, và cái phải nằm trong vùng quê
  // chính là mép xa. Dùng `width/2` với định nghĩa ấy thì phép kiểm cho phép nửa bề rộng bên kia
  // thò ra ngoài địa hình — tức nó không diễn đạt lời hứa mà nó mang tên. Ý ĐỊNH của Đàm ("nước
  // phải nằm gọn trong địa hình") được giữ nguyên; chỉ con số là chặt hơn.
  //
  // ⚠️ Phép kiểm này sống ở BÀI TEST chứ không ở `isValidSetting`, và đó là điều bắt buộc: mã sản
  // phẩm mà `import` `OUTSKIRT_REACH` là dựng đúng chiều NGƯỢC của luật Đàm ra (`settingStyle` →
  // `outskirts`), lại còn đẻ ra một vòng import khi `outskirts.js` gọi `hasWater` ở Bước B.
  // THỬ-CHO-ĐỎ: đổi `width` kỷ 8 từ 6 lên 8 → mép xa ra 9 > 8 → đỏ đúng kỷ 8.
  let chatNhat = 0;
  let kyChatNhat = 0;
  for (const era of ERAS) {
    const st = getSetting(era);
    if (st.water === 'none') continue;
    // `sea` không có bờ bên kia ⇒ chỉ cần MÉP GẦN (bờ) nằm trong vùng quê; phần còn lại là chân trời.
    const mepXa = st.width === null ? st.reach : st.reach + st.width;
    assert.ok(mepXa <= OUTSKIRT_REACH,
      `kỷ ${era}: mép xa mặt nước ở ${mepXa} ô, ra ngoài vùng quê (${OUTSKIRT_REACH} ô) — `
      + 'nước sẽ nằm trên chỗ không có địa hình');
    if (mepXa > chatNhat) { chatNhat = mepXa; kyChatNhat = era; }
  }
  // Nói thẳng phần biên còn lại, đúng bài học phễu Phase 9A: chật nhất là **kỷ 4** (Trường An, sông
  // Vị xa tận 5 ô rồi rộng thêm 2,6) ở **7,6/8 ô** — chỉ còn 0,4 ô dự phòng. Con số ấy đúng với sự
  // thật địa lý (sông Vị thật sự nằm xa kinh đô), nên đây là một ràng buộc CHẶT chứ không phải một
  // lời hứa mỏng; nhưng nó chặt tới mức thu `OUTSKIRT_REACH` xuống 7 là kỷ 4 đỏ ngay.
  assert.equal(kyChatNhat, 4, 'kỷ chật nhất đã đổi — xem lại xem nước có còn nằm gọn không');
  assert.ok(chatNhat >= OUTSKIRT_REACH - 2,
    `kỷ chật nhất chỉ dùng ${chatNhat}/${OUTSKIRT_REACH} ô — phép kiểm đã thành cái phễu, `
    + 'không còn ràng buộc dòng nào');
});

test('BA TRỤC PHẢI CÒN SỐNG: mọi giá trị khai trong ba danh sách đều có kỷ dùng tới', () => {
  // Một giá trị nằm trong `WATER_KINDS`/`GROUND_FORMS` mà không kỷ nào dùng là một lời nói dối về
  // bề rộng của bảng: đọc mã thì thấy năm kiểu nước, chạy thật thì chỉ có ba. Cùng cơ chế đã bắt
  // được cơ chế "lùm cây" chết im lặng ở Phase 8D.
  // THỬ-CHO-ĐỎ: đổi kỷ 10 từ `canal` sang `river` → `canal` thành giá trị chết → đỏ ở trục nước.
  const s = summarizeSettings();
  for (const k of WATER_KINDS) {
    assert.ok((s.water[k] ?? 0) >= 1, `kiểu nước "${k}" khai ra mà không kỷ nào dùng`);
  }
  for (const g of GROUND_FORMS) {
    assert.ok((s.ground[g] ?? 0) >= 1, `dáng nền "${g}" khai ra mà không kỷ nào dùng`);
  }
});

test('15 KỶ RA 15 ĐỊA THẾ — không hai kỷ nào trùng khít', () => {
  // ⚠️ BÀI NÀY TỪNG TÊN LÀ "HAI KỶ KHÔ ĐỌC RA LÀ MỘT" VÀ TỪNG KHAI `[[1, 5]]`. Nó ra đời để ĐẾM
  // TƯỜNG MINH một sự thật khó chịu: kỷ 1 (Göbekli Tepe) và kỷ 5 (Burg Eltz) khai hệt nhau trên mọi
  // trường hình học, và tôi cố ý KHÔNG bịa thêm một trục để né. Rồi Đàm bác dòng kỷ 5 vì một lý do
  // hoàn toàn khác — lịch sử, không phải phép đo — và cặp trùng biến mất **bằng một sự thật** chứ
  // không bằng một trục bịa thêm:
  //     kỷ 1 — sống núi đá vôi khô, không nước, chọn vì TẦM NHÌN
  //     kỷ 5 — mỏm đá trong khúc uốn suối ôm ba mặt, chọn vì THẾ THỦ
  // Đây chính là thứ mà một con số chép cứng trong bài test mua được: nó không sửa được bảng, nhưng
  // nó bắt mọi lần bảng đổi phải đi qua mắt người, và lần này mắt người đã ra một quyết định tốt hơn
  // mọi phương án kỹ thuật tôi nghĩ ra.
  // THỬ-CHO-ĐỎ: đổi kỷ 3 sang `side:'nam', width:1.2` (thành river|nam|flat|2|1.2, hệt kỷ 6) → đỏ
  // với cặp `[3, 6]` trong danh sách.
  const vanTay = (st) => [st.water, st.side, st.ground, st.reach, String(st.width)].join('|');
  const trung = [];
  for (let i = 0; i < ERAS.length; i += 1) {
    for (let j = i + 1; j < ERAS.length; j += 1) {
      if (vanTay(getSetting(ERAS[i])) === vanTay(getSetting(ERAS[j]))) {
        trung.push([ERAS[i], ERAS[j]]);
      }
    }
  }
  assert.deepEqual(trung, [],
    'có hai kỷ trùng khít địa thế — xem lại bằng mắt, và ĐỪNG nới phép đo để nó hết đỏ');

  // ⚠️ ĐỐI CHỨNG BẮT BUỘC: một `deepEqual(…, [])` là loại assert dễ xanh oan nhất trong dự án —
  // `vanTay` trả về hằng số, hoặc vòng lặp chạy rỗng, thì nó vẫn xanh vĩnh viễn. Bơm hai dòng trùng
  // vào rồi đòi phép đo phải bắt được.
  const doiChung = [{ ...getSetting(12) }, { ...getSetting(12) }, { ...getSetting(3) }];
  const kyGia = doiChung.map(vanTay);
  assert.equal(new Set(kyGia).size, 2, 'phép lấy vân tay không phân biệt được hai dòng khác nhau');
});

test('VALIDATOR TỪ CHỐI THẲNG — bẻ TỪNG trường một, không bẻ gộp', () => {
  // ⚠️ Bẻ gộp (đổi cùng lúc `water` và `width`) thì một luật đỏ che cho ba luật đã chết. Mỗi ca
  // dưới đây bẻ ĐÚNG MỘT trường của một dòng vốn hợp lệ, và nêu rõ luật nào phải bắt nó.
  // THỬ-CHO-ĐỎ: bỏ nhánh `if (st.water === 'sea') return st.width === null;` → đỏ ở ca
  // "biển mà khai bề rộng hữu hạn".
  assert.ok(isValidSetting(MAU_HOP_LE), 'dòng mẫu của đối chứng phải hợp lệ, nếu không mọi ca dưới vô nghĩa');

  const KHO = { ...SETTING_STYLES[1] };
  assert.ok(isValidSetting(KHO), 'dòng khô mẫu phải hợp lệ');

  const CA = [
    ['không phải đối tượng', null],
    ['không phải đối tượng', 42],
    ['thiếu `country`', { ...MAU_HOP_LE, country: '' }],
    ['thiếu `city`', { ...MAU_HOP_LE, city: 'Ur' }],
    ['`note` quá ngắn để là một câu trả lời', { ...MAU_HOP_LE, note: 'ven sông' }],
    ['kiểu nước lạ', { ...MAU_HOP_LE, water: 'lake' }],
    ['hướng lạ', { ...MAU_HOP_LE, side: 'dong-bac' }],
    ['dáng nền lạ', { ...MAU_HOP_LE, ground: 'hill' }],
    ['`reach` âm', { ...MAU_HOP_LE, reach: -1 }],
    ['`reach` xa quá thế giới', { ...MAU_HOP_LE, reach: 13 }],
    ['`reach` không phải số', { ...MAU_HOP_LE, reach: '2' }],
    ['(a) khô mà vẫn khai hướng', { ...KHO, side: 'nam' }],
    ['(a) khô mà `reach` khác 0', { ...KHO, reach: 2 }],
    ['(a) khô mà khai bề rộng', { ...KHO, width: 1.5 }],
    ['(b) biển mà khai bề rộng hữu hạn', { ...SETTING_STYLES[13], width: 5 }],
    ['(c) sông mà quên khai bề rộng', { ...MAU_HOP_LE, width: null }],
    ['(c) sông mà bề rộng bằng 0', { ...MAU_HOP_LE, width: 0 }],
    ['(c) sông rộng hơn cả thế giới', { ...MAU_HOP_LE, width: 13 }],
    ['(d) có nước mà hướng là `none`', { ...MAU_HOP_LE, side: 'none' }],
  ];
  for (const [ten, xau] of CA) {
    assert.equal(isValidSetting(xau), false, `validator ĐỂ LỌT ca: ${ten}`);
  }
  assert.equal(CA.length, 19, 'số ca đối chứng đã đổi — thêm luật thì phải thêm ca, đừng bớt');
});
