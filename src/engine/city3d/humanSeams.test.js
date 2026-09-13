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
