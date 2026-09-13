/**
 * humanSeams.test.js — ROUND 58, VIỆC 1. Cái gác cho một hình dạng lỗi đã xảy ra NĂM lần.
 *
 * Bài này canh một LUẬT, không canh năm ca đã sửa: *"khối nối dài mang vai màu của đoạn nó nối
 * dài"*. Năm lần trước — đinh tán trắng ở vai, vành cổ áo trắng, vạch ngang ở chân tóc, mũ trụ
 * mang màu vải, và hai quả cầu trắng ở bàn tay — đều lọt qua MỌI bài test đang có và đều bị bắt
 * bởi một tấm ảnh. Xem khối đầu `humanSeams.js` để biết vì sao phép đo "mọi cặp khối kề nhau" (99
 * cặp) bị bỏ và thay bằng một câu hỏi CẤU TRÚC.
 *
 * ⚠️ CẢ BỐN BÀI ĐỀU ĐÃ THỬ-CHO-ĐỎ. Ghi lại ở từng bài: *bỏ đúng dòng nào thì nó đỏ*. Một bài test
 * chưa từng đỏ thì không phải một bài test (`CLAUDE.md`, luật 3).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHumanBody } from './human.js';
import { getHumanStyle } from './humanStyle.js';
import { VIEN_CO_THAT, continuationCount, seamFaults } from './humanSeams.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const khoi = (body, id) => body.parts.find((p) => p.id === id);

test('KHÔNG KỶ NÀO CÓ ĐƯỜNG VIỀN MÀU Ở CHỖ ĐỜI THẬT KHÔNG CÓ', () => {
  for (const era of ERAS) {
    const loi = seamFaults(buildHumanBody(era));
    assert.deepEqual(loi, [],
      `kỷ ${era}: ${loi.map((f) => `\`${f.id}\` mang \`${f.role}\` nhưng nối dài \`${f.continues}\``
        + ` (\`${f.expected}\`)`).join(' · ')}`
      + ' — ngoài đời chỗ ấy không có mép nào. Đừng nới bài test: sửa vai màu, hoặc nếu chỗ ấy THẬT'
      + ` SỰ có mép thì khai vào \`VIEN_CO_THAT\` (${VIEN_CO_THAT.length} dòng) và bỏ \`continues\`.`);
  }
  // ⚠️ ĐỎ KHI BỎ GÌ: đổi `'shinL'` thành `'skin'` ở `footL` trong `human.js` → đỏ ngay kỷ 1. Đã thử.
});

test('CÁI GÁC CÓ CANH GÌ KHÔNG: đếm khối nối dài, để bài trên không xanh vì rỗng', () => {
  /*
    ⚠️ BÀI NÀY TỒN TẠI VÌ BÀI TRÊN CÓ MỘT LỐI THOÁT ÂM THẦM: xoá hết `continues` thì `seamFaults`
    trả rỗng và bài trên xanh mãi mãi — đúng cái bẫy "mẫu số chứa/không chứa thứ ngoài câu hỏi"
    (`TECH_DEBT #22`). Nên số khối nối dài được khoá dưới dạng một SÀN, ở mọi kỷ.
  */
  for (const era of ERAS) {
    const n = continuationCount(buildHumanBody(era));
    assert.ok(n >= 10,
      `kỷ ${era} chỉ khai ${n} khối nối dài. Phải có ít nhất 10 (2 bàn chân · 2 ngón cái · 6 khớp`
      + ' cầu vai/khuỷu/đầu gối) — thiếu nghĩa là có người vừa bỏ một lời khai, và bài test trên'
      + ' thành vô hiệu mà không đỏ lên.');
  }
  // ⚠️ ĐỎ KHI BỎ GÌ: bỏ đối số thứ 7 (`'shinL'`) của `piece('footL', …)` → 9 < 10, đỏ ngay kỷ 1. Đã thử.
});

test('PHÉP ĐO CÓ BIẾT KÊU KHÔNG: hai kiểu lỗi phải bị bắt, kể cả lỗi TRỎ SAI TÊN', () => {
  // (a) sai vai màu — đúng hình dạng lỗi của năm lần trước.
  const saiMau = { parts: [
    { id: 'forearmL', role: 'cloth' },
    { id: 'handL', role: 'skin', continues: 'forearmL' },
  ] };
  assert.deepEqual(seamFaults(saiMau),
    [{ id: 'handL', role: 'skin', continues: 'forearmL', expected: 'cloth' }]);

  /*
    (b) ⚠️ TRỎ SAI TÊN — VÀ ĐÂY LÀ LỖI TÔI VỪA TỰ GÂY RA, NÊN NÓ ĐƯỢC KHOÁ LẠI.
    Bản đầu của Việc 1 khai `continues: 'calfL'` cho bàn chân, trong khi `calf` là tên KHUÔN, còn
    tên KHỐI là `shinL`. Một phép đo chỉ so màu sẽ đọc `undefined !== undefined` là "bằng nhau" và
    im lặng — tức cái gác tự tắt ở đúng bốn khối nó phải canh. Nó phải KÊU, không được im.
  */
  const troSai = { parts: [
    { id: 'shinL', role: 'cloth2' },
    { id: 'footL', role: 'cloth2', continues: 'calfL' },
  ] };
  assert.equal(seamFaults(troSai).length, 1, 'trỏ vào một khối không tồn tại phải là một lỗi');
  assert.equal(seamFaults(troSai)[0].expected, '(không có khối ấy)');

  // Và một thân đúng thì im.
  assert.deepEqual(seamFaults({ parts: [
    { id: 'shinL', role: 'cloth2' },
    { id: 'footL', role: 'cloth2', continues: 'shinL' },
  ] }), []);
  // ⚠️ ĐỎ KHI BỎ GÌ: bỏ nhánh `if (expected === undefined)` trong `seamFaults` → vế (b) đỏ. Đã thử.
});

test('BÀN TAY: hai màu được phép, không bao giờ màu thứ ba — và nó có HÌNH, không phải quả cầu', () => {
  let coGang = 0;
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    const style = getHumanStyle(era);
    const tay = khoi(body, 'handL');
    const cangTay = khoi(body, 'forearmL');
    assert.ok(tay && cangTay, `kỷ ${era}: thiếu bàn tay hoặc cẳng tay`);

    // ⚠️ LUẬT CỦA ĐÀM, VIẾT THÀNH MỘT PHÉP CHỌN HAI ĐƯỜNG: da khi tay để hở, MÀU TAY ÁO khi có
    // găng. Một màu thứ ba là chuyện đã xảy ra (hai quả cầu trắng trên tay áo sẫm, vòng 58).
    const duocPhep = style.gloves ? [cangTay.role] : ['skin'];
    assert.ok(duocPhep.includes(tay.role),
      `kỷ ${era}: bàn tay mang \`${tay.role}\`, mà ${style.gloves ? 'có găng nên phải bằng tay áo'
        + ` (\`${cangTay.role}\`)` : 'tay để hở nên phải là `skin`'}`);
    if (style.gloves) coGang += 1;

    // Có HÌNH bàn tay: một khối dẹt (không phải `dome`) cộng một ngón cái lệch sang bên.
    assert.notEqual(tay.shape, 'dome',
      `kỷ ${era}: bàn tay vẫn là \`dome\` — một quả cầu ở cuối cánh tay là cái đã bị bắt bằng ảnh`);
    const ngon = khoi(body, 'thumbL');
    assert.ok(ngon, `kỷ ${era}: không có ngón cái — bàn tay không có ngón thì không đọc ra là bàn tay`);
    assert.equal(ngon.role, tay.role, `kỷ ${era}: ngón cái phải cùng màu bàn tay`);
    assert.ok(Math.abs(ngon.rest.z) > 1e-6,
      `kỷ ${era}: ngón cái nằm đúng trên trục cánh tay (z = ${ngon.rest.z}) — nó phải lệch sang`
      + ' bên, nếu không thì nó bị bàn tay che kín và tốn một khối cho không gì cả');
  }

  /*
    ⚠️ MỘT KỶ, VÀ CON SỐ NÀY ĐƯỢC KHOÁ CHỨ KHÔNG ĐỂ TRỐNG. Nhánh `style.gloves` bản đầu vĩnh viễn
    sai vì tủ đồ chưa có trường ấy — mã tự xưng có một luật mà không có. Nếu ngày nào con số này về
    0 thì nhánh găng lại thành mã chết, và vế "màu tay áo" ở trên lại không được thi hành ở đâu cả.
  */
  assert.ok(coGang >= 1,
    'không kỷ nào đeo găng ⇒ nhánh `style.gloves` trong `human.js` là mã chết và nửa trên của'
    + ' chính bài test này không kiểm được gì. Xem khối `WARDROBE` ở `humanStyle.js`.');
});

test('TRÁI PHẢI PHẢI ĐỐI XỨNG — mọi cặp `…L`/`…R` khớp nhau, chỉ lệch dấu ở trục z', () => {
  /*
    ⚠️ BÀI NÀY SINH RA TỪ MỘT LỖI TÔI VỪA TỰ GÂY RA TRONG CHÍNH VÒNG 58, và nó thuộc đúng cái họ
    mà cả vòng này đang đi bắt: **một lỗi không làm gì đỏ lên và chỉ lộ ra trên ảnh** — mà lần này
    thì còn không lộ, vì hai bên đầu hiếm khi cùng nằm trong một khung hình.
    Khi hạ hai cái tai cho bớt vểnh, tôi gõ `H * 0.455` cho tai trái và `H * 0.425` cho tai phải.
    Kết quả: một người có hai tai LỆCH NHAU 3% chiều cao đầu. Không khuôn nào lạ, không màu nào
    sai, không trần nào vượt ⇒ 1.800 bài test xanh trơn.
    ⇒ Đối xứng trái–phải là một LUẬT của cơ thể, nên nó được gác như một luật: mọi khối có hậu tố
    `L` phải có bạn `R` cùng khuôn, cùng vai màu, cùng ba kích thước, cùng `x` và `y`, và `z` ĐỔI
    DẤU. Rẻ, và nó bắt mọi lần gõ nhầm kiểu này về sau, ở mọi kỷ.
    ⚠️ NGOẠI LỆ ĐƯỢC KHAI TƯỜNG MINH, KHÔNG ĐƯỢC LỜ: `carry` (đồ mang theo) cố ý chỉ có một bên —
    nó không có hậu tố L/R nên không lọt vào phép quét này. Nếu ngày nào một thứ cố ý lệch CÓ hậu
    tố L/R thì phải thêm nó vào `LECH_CO_CHU_Y` kèm lý do, chứ không được nới bài test.
  */
  const LECH_CO_CHU_Y = new Set();
  let soCap = 0;
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    for (const trai of body.parts) {
      if (!trai.id.endsWith('L') || LECH_CO_CHU_Y.has(trai.id)) continue;
      const tenPhai = `${trai.id.slice(0, -1)}R`;
      const phai = khoi(body, tenPhai);
      assert.ok(phai, `kỷ ${era}: có \`${trai.id}\` mà không có \`${tenPhai}\` — một người một bên`);
      soCap += 1;
      assert.equal(phai.shape, trai.shape, `kỷ ${era}: \`${tenPhai}\` khác khuôn \`${trai.id}\``);
      assert.equal(phai.role, trai.role, `kỷ ${era}: \`${tenPhai}\` khác vai màu \`${trai.id}\``);
      for (const truc of ['w', 'h', 'd']) {
        assert.ok(Math.abs(phai[truc] - trai[truc]) < 1e-12,
          `kỷ ${era}: \`${tenPhai}\`.${truc} = ${phai[truc]} ≠ \`${trai.id}\`.${truc} = ${trai[truc]}`);
      }
      for (const truc of ['x', 'y']) {
        assert.ok(Math.abs(phai.rest[truc] - trai.rest[truc]) < 1e-12,
          `kỷ ${era}: \`${tenPhai}\` lệch \`${trai.id}\` ở ${truc}: ${phai.rest[truc]}`
          + ` so với ${trai.rest[truc]}. Trái phải cùng độ cao và cùng độ nhô — chỉ z mới đổi dấu.`);
      }
      assert.ok(Math.abs(phai.rest.z + trai.rest.z) < 1e-12,
        `kỷ ${era}: \`${tenPhai}\`.z = ${phai.rest.z} phải bằng −(${trai.rest.z})`);
    }
  }
  assert.ok(soCap >= 15 * 10,
    `chỉ quét được ${soCap} cặp trên 15 kỷ — dưới 10 cặp mỗi người nghĩa là phép quét đang trượt`
    + ' (hậu tố đổi? khối bị xoá?), và một phép quét trượt thì xanh vĩnh viễn mà không canh gì.');
  // ⚠️ ĐỎ KHI BỎ GÌ: đổi `H * 0.455` của `earR` thành `H * 0.425` → đỏ ở cả 15 kỷ. Đã thử — đó
  //    chính là con số đã lọt qua trước khi có bài này.
});
