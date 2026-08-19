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
  MAX_SEA_ERAS, MAX_ERAS_PER_SIDE,
  summarizeSettings, settingCountryMismatches,
} from './settingStyle.js';
import { ERA_STYLES, getEraStyle } from './eraStyle.js';

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
  // THỬ-CHO-ĐỎ: đổi kỷ 5 sang `water:'river', side:'tay', reach:1, width:0.6` → đỏ ở `deepEqual`
  // danh sách kỷ khô (`[1]` thay vì `[1, 5]`).
  const KHO = ERAS.filter((e) => !hasWater(e));
  assert.deepEqual(KHO, [1, 5],
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

  // Và nói thẳng phần chưa được bảo vệ (bài học phễu Phase 9A): hôm nay 4, trần 7, tức còn 3 chỗ
  // trống. Con số 4 được ghim để một phiên sau đổi bốn kỷ sang biển thì phải mở bài này ra đọc.
  assert.equal(dem.sea, 4,
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
    bangHong[era] = era <= 8 ? { ...SETTING_STYLES[11] } : { ...SETTING_STYLES[12] };
  }
  const dem = summarizeSettings(bangHong).water;
  assert.equal(dem.sea, 8, 'bảng giả phải có đúng 8 kỷ biển');
  assert.ok(dem.sea > MAX_SEA_ERAS, 'phép đếm KHÔNG bắt được bảng 8 kỷ biển — trần đã thành cái phễu');
});

test('LUẬT (3) — cả bốn hướng phải CÒN SỐNG, và không hướng nào được dồn quá nửa', () => {
  // Hai vế, và vế đầu mới là vế siết chặt. Bài học `floraStyle` / 8 trục: *"trục nào cả 15 kỷ khai
  // giống nhau thì bảng thật ra hẹp hơn nó trông"* — một hướng chết hẳn là cách hỏng dễ xảy ra nhất
  // và cũng là cách khó nhìn ra nhất, vì bảng vẫn có đủ 15 dòng khác nhau.
  // THỬ-CHO-ĐỎ: đổi kỷ 3 và 9 và 11 từ `tay` sang `bac` → hướng `tay` chết → đỏ ở vế "còn sống".
  const dem = summarizeSettings().side;
  const coNuoc = ERAS.filter((e) => hasWater(e)).length;
  assert.equal(coNuoc, 13, 'số kỷ có nước đã đổi — mọi con số dưới đây tính theo nó');

  for (const huong of HUONG_THAT) {
    assert.ok((dem[huong] ?? 0) >= 1,
      `hướng "${huong}" không kỷ nào dùng — trục hướng đang hẹp hơn nó trông`);
  }
  assert.equal(Object.keys(dem).sort().join(','), HUONG_THAT.slice().sort().join(','),
    'bảng đang dùng một hướng không có trong `WATER_SIDES`, hoặc `none` đã lọt vào phép đếm');

  const donNhat = Math.max(...HUONG_THAT.map((h) => dem[h] ?? 0));
  assert.ok(donNhat <= MAX_ERAS_PER_SIDE,
    `${donNhat} kỷ dồn về một hướng, vượt trần ${MAX_ERAS_PER_SIDE} — 15 kỷ sẽ ra cùng một bố cục`);
  assert.ok(MAX_ERAS_PER_SIDE * 2 < coNuoc + 1,
    `trần ${MAX_ERAS_PER_SIDE} không còn "dưới một nửa" của ${coNuoc} kỷ có nước`);
});

test('LUẬT (3) — ĐỐI CHỨNG: phép đếm PHẢI bắt được bảng dồn hết 13 kỷ về một hướng, ở CẢ HAI vế', () => {
  // ⚠️ Hỏi TỪNG vế một, không hỏi gộp. Bài học `TECH_DEBT #22`: gộp lại thì một vế đỏ che cho một
  // vế đã mất răng, và ta không bao giờ biết vế nào còn canh gác.
  // THỬ-CHO-ĐỎ: nâng `MAX_ERAS_PER_SIDE` lên 13 → đỏ ở vế trần của đối chứng này (vế "hướng chết"
  // vẫn đỏ, đó chính là lý do phải tách hai vế).
  const bangHong = {};
  for (const era of ERAS) {
    const st = SETTING_STYLES[era];
    bangHong[era] = st.water === 'none' ? { ...st } : { ...st, side: 'bac' };
  }
  const dem = summarizeSettings(bangHong).side;

  const chet = HUONG_THAT.filter((h) => (dem[h] ?? 0) === 0);
  assert.deepEqual(chet.sort(), ['dong', 'nam', 'tay'],
    'vế "hướng còn sống" KHÔNG nhận ra ba hướng đã chết');

  const donNhat = Math.max(...HUONG_THAT.map((h) => dem[h] ?? 0));
  assert.ok(donNhat > MAX_ERAS_PER_SIDE,
    `vế trần KHÔNG bắt được bảng dồn ${donNhat} kỷ về một hướng — trần đã thành cái phễu`);
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

test('HAI KỶ KHÔ ĐỌC RA LÀ MỘT — đếm tường minh, KHÔNG giấu bằng một `continue`', () => {
  // ⚠️ Sự thật khó chịu, ghi thẳng ra thay vì bịa một trục để né: kỷ 1 (Göbekli Tepe) và kỷ 5
  // (Burg Eltz) khai HỆT NHAU trên mọi trường hình học — cùng `none`/`ridge`/`reach 0`. Điều đó
  // ĐÚNG: cả hai đều là một sống đá khô, chọn vì tầm nhìn và vì thế thủ, không vì nước. Thứ phân
  // biệt chúng KHÔNG nằm ở bảng này mà ở `eraStyle` (lều da thú so với lâu đài đá) — nên tách
  // chúng ở đây là bịa ra một khác biệt địa lý không có thật, đúng thứ luật (2) cấm.
  //
  // Cách xử lý theo đúng khuôn `assert.deepEqual(KHONG_VUA_DAI, ['barrel'])` ở Phase 11: ĐẾM ca ấy
  // ra, để cặp trùng thứ hai thì đỏ, mà cặp này được tách ra thì cũng đỏ. Một `continue` im lặng ở
  // đây sẽ giấu mất việc bảng đang hẹp hơn nó trông.
  // THỬ-CHO-ĐỎ: đổi kỷ 3 sang `side:'nam', width:1.2` (thành river|nam|flat|2|1.2, hệt kỷ 6) → đỏ
  // với cặp `[3, 6]` thừa trong danh sách.
  const vanTay = (st) => [st.water, st.side, st.ground, st.reach, String(st.width)].join('|');
  const trung = [];
  for (let i = 0; i < ERAS.length; i += 1) {
    for (let j = i + 1; j < ERAS.length; j += 1) {
      if (vanTay(getSetting(ERAS[i])) === vanTay(getSetting(ERAS[j]))) {
        trung.push([ERAS[i], ERAS[j]]);
      }
    }
  }
  assert.deepEqual(trung, [[1, 5]],
    'danh sách cặp kỷ trùng khít địa thế đã đổi — xem lại bằng mắt, đừng nới');
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
