/**
 * humanCloseUp.test.js — ROUND 59, PHẦN A. Hai thứ Đàm thấy trong **mọi** tấm ảnh vòng 58, và
 * không bài nào trong 1.820 bài thấy: đôi mắt đang trợn, và hai bàn tay là hai hòn bi.
 *
 * ⚠️ CẢ HAI ĐỀU LÀ LỖI CỦA MỘT QUAN HỆ, KHÔNG PHẢI CỦA MỘT CON SỐ — nên cả hai bài dưới đây đều
 * viết thành quan hệ. Một bài khoá "khe mắt = 0,155" sẽ xanh với một con ngươi nhỏ xíu ở giữa;
 * một bài khoá "bàn tay dày 0,44" sẽ xanh với một bàn tay dẹt SAI CHIỀU — đúng cái vừa phải sửa.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHumanBody } from './human.js';
import { shapeEndRadius, shapeMaxRadius } from './humanShape.js';
import { FALLBACK_TOKENS, buildScenePalette, rgbToHsl } from './palette3d.js';
import { deriveDaylight } from './daylight.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const khoi = (body, id) => body.parts.find((p) => p.id === id);

test('MẮT KHÔNG ĐƯỢC TRỢN: lòng trắng không được bao KHÉP KÍN quanh con ngươi', () => {
  /*
    ⚠️ ĐÂY LÀ BÀI CANH ĐÚNG THỨ ĐÀM MÔ TẢ, VÀ NÓ KHÔNG ĐO "CỠ MẮT". Nguyên văn: *"lộ trọn lòng
    trắng quanh con ngươi là biểu cảm KINH HÃI… con ngươi chạm cả mí trên lẫn mí dưới."*
    Tức thứ phải cấm là một VÒNG TRẮNG KHÉP KÍN. Mắt to bao nhiêu cũng được; chỉ cần con ngươi cao
    ÍT NHẤT bằng khe mắt thì phía trên và phía dưới không còn chỗ cho lòng trắng, và cái vòng ấy
    đứt — chỉ còn hai vệt lưỡi liềm hai bên, đúng một con mắt hoạt hình bình thản.
  */
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    const mat = khoi(body, 'eyeL');
    const nguoi = khoi(body, 'pupilL');
    assert.ok(mat && nguoi, `kỷ ${era}: thiếu lòng trắng hoặc con ngươi`);

    assert.ok(nguoi.h >= mat.h - 1e-12,
      `kỷ ${era}: con ngươi cao ${nguoi.h.toFixed(5)} mà khe mắt cao ${mat.h.toFixed(5)} — còn`
      + ' chỗ trống ở TRÊN và DƯỚI con ngươi ⇒ lòng trắng khép thành một vòng ⇒ khuôn mặt đang'
      + ' hoảng. Đây là lỗi vòng 56 và vòng 58 đều mắc.');

    // Và vế NGƯỢC, để bài trên không được "sửa" bằng cách phình con ngươi ra kín cả con mắt: phải
    // CÒN lòng trắng, ở hai BÊN. Không còn tí nào thì đó là một con mắt toàn đen.
    assert.ok(nguoi.w < mat.w * 0.85,
      `kỷ ${era}: con ngươi rộng ${nguoi.w.toFixed(5)} so với khe ${mat.w.toFixed(5)} — che kín`
      + ' hai bên thì không còn lòng trắng nào, và con mắt thành một lỗ đen.');

    // KHE, KHÔNG PHẢI HÌNH TRÒN: một con mắt thật nhìn từ trước là hình quả hạnh — rộng hơn cao.
    assert.ok(mat.w > mat.h * 1.15,
      `kỷ ${era}: khe mắt rộng ${mat.w.toFixed(5)} cao ${mat.h.toFixed(5)} — gần tròn thì nó là`
      + ' một con mắt mở trừng, dù con ngươi có lấp đầy hay không.');
  }
  // ⚠️ ĐỎ KHI BỎ GÌ: trả khe mắt về `H * 0.20` và con ngươi về `H * 0.15` (bản vòng 58) → đỏ cả
  //    15 kỷ ở vế một. Đã thử.
});

test('LÒNG TRẮNG KHÔNG ĐƯỢC PHÁT SÁNG — nó nằm trong bóng hốc mắt', () => {
  /*
    ⚠️ CHÚ THÍCH VÒNG 56 NÓI ĐÚNG LỜI RỒI ĐẶT SAI SỐ, và không có gì bắt được chuyện đó suốt hai
    vòng: nó viết *"KHÔNG phải trắng tinh… trắng tinh đọc ra là hai cái đèn"* rồi khai L = 0,93.
    Một câu văn xuôi không gác được một con số. Nay có một con số gác một con số.
  */
  // Bảng màu trả về SỐ HEX, nên độ sáng phải suy ngược ra — dùng đúng hàm của chính file ấy.
  const doSang = (hex) => rgbToHsl({ r: (hex >> 16) & 255, g: (hex >> 8) & 255, b: hex & 255 }).l;
  const bang = buildScenePalette({ tokens: FALLBACK_TOKENS, era: 1, daylight: deriveDaylight(12) });
  const trang = doSang(bang.roles.eyeWhite);
  const da = doSang(bang.roles.skin);
  assert.ok(trang <= 0.88,
    `lòng trắng L = ${trang.toFixed(3)} — trên 0,88 thì trên một khuôn mặt cỡ này nó là một cái đèn`);
  assert.ok(trang > da + 0.03,
    `lòng trắng L = ${trang.toFixed(3)} phải sáng hơn da L = ${da.toFixed(3)} đủ để con ngươi tối`
    + ' nổi lên trên nó');
});

test('BÀN TAY DẸT ĐÚNG CHIỀU: rộng TRƯỚC–SAU, mỏng NGANG', () => {
  /*
    ⚠️ ĐÂY LÀ BÀI SINH RA TỪ MỘT CHÚ THÍCH TỰ NHẬN ĐÚNG VÀ MỘT CON SỐ ĐẢO TRỤC.
    Vòng 58 khai `[0,46 · 1,18 · 1,02]` và tự gọi là *"một khối dẹt (dày bằng 0,46 bề ngang)"*. Nó
    dẹt thật — dẹt SAI CHIỀU. Bàn tay buông xuôi thì lòng bàn tay úp vào đùi ⇒ chiều MỎNG là chiều
    NGANG (z), chiều RỘNG là trước–sau (x). Bản cũ ngược lại, nên nhìn chính diện camera nhận đúng
    cái mặt rộng nhất ⇒ một mảng tròn. Một bài test đo "có dẹt không" sẽ XANH với cả hai; bài này
    đo dẹt theo TRỤC NÀO.
  */
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    for (const ben of ['L', 'R']) {
      const tay = khoi(body, `hand${ben}`);
      assert.ok(tay, `kỷ ${era}: thiếu bàn tay ${ben}`);
      assert.ok(tay.w > tay.d * 1.3,
        `kỷ ${era} tay ${ben}: rộng trước–sau ${tay.w.toFixed(5)} không lớn hơn bề ngang`
        + ` ${tay.d.toFixed(5)} đủ 1,3 lần — bàn tay đang dẹt sai chiều (hoặc không dẹt).`);

      // CỔ TAY THON: đầu trên của khối bàn tay phải hẹp hơn chỗ rộng nhất của nó. `calf` (bản cũ)
      // phình ở ĐỈNH nên nó cho một cổ tay to hơn cả nắm đấm.
      const mut = shapeEndRadius(tay.shape, 1);
      const rong = shapeMaxRadius(tay.shape);
      assert.ok(mut < rong * 0.92,
        `kỷ ${era} tay ${ben}: khuôn \`${tay.shape}\` có đầu TRÊN rộng ${mut.toFixed(4)} so với chỗ`
        + ` rộng nhất ${rong.toFixed(4)} — cổ tay không thon, mà cổ tay thon là một trong ba đặc`
        + ' điểm làm mắt đọc ra "bàn tay".');

      // NGÓN CÁI phải TÁCH RA theo chiều ngang, nếu không nó nằm trong bàn tay và vô hình.
      const ngon = khoi(body, `thumb${ben}`);
      assert.ok(ngon && Math.abs(ngon.rest.z) > 1e-9,
        `kỷ ${era}: ngón cái ${ben} không lệch ngang — nó sẽ bị bàn tay che kín`);
      assert.equal(ngon.role, tay.role, `kỷ ${era}: ngón cái ${ben} khác màu bàn tay`);
    }
  }
});

test('NẮM TAY THEO VAI, VÀ NÓ PHẢI HỎI `carryPiece` CHỨ KHÔNG ĐOÁN', () => {
  /*
    ⚠️ BÀI NÀY CANH MỘT CA LẺ CÓ THẬT, và ca ấy đã bắt bản đầu của tôi.
    Luật: tay đang cầm đồ thì NẮM LẠI (không có khối đốt ngón). Bản đầu suy ra từ `style.carry`
    — *"kỷ nào có đồ mang theo thì tay phải nắm"*. Sai ở đúng một kỷ: có kỷ đội đồ TRÊN ĐẦU, ở đó
    `carryPiece` treo đồ vào khớp `head` và KHÔNG bàn tay nào cầm gì cả.
    ⇒ Nên phép so ở đây không hỏi "kỷ này có đồ không" mà hỏi `body.carryArm` — chính đại lượng mà
    `carryPiece` quyết định. Một phép đoán chạy song song với một phép quyết định là "một luật hai
    công thức" ở dạng khó thấy nhất: cả hai đều chạy, và chúng chỉ lệch nhau ở một kỷ.
  */
  let coNam = 0;
  let coXoe = 0;
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    const camTayPhai = body.carryArm === 'shoulderR';
    const dotNgon = khoi(body, 'fingersR');
    assert.equal(!dotNgon, camTayPhai,
      `kỷ ${era}: tay phải ${camTayPhai ? 'ĐANG CẦM ĐỒ mà vẫn xoè ngón' : 'không cầm gì mà lại nắm'}`
      + ` (carryArm = ${body.carryArm ?? 'không'}).`);
    // Tay TRÁI không cầm gì ở kỷ nào, nên nó luôn xoè.
    assert.ok(khoi(body, 'fingersL'), `kỷ ${era}: tay trái phải luôn xoè`);
    if (camTayPhai) coNam += 1; else coXoe += 1;
  }
  // Cả hai trạng thái phải CÓ MẶT, nếu không thì cái nhánh kia là mã chết và bài trên vô nghĩa.
  assert.ok(coNam >= 1 && coXoe >= 1,
    `nắm ${coNam} kỷ · xoè ${coXoe} kỷ — thiếu một trạng thái thì nhánh kia không được kiểm ở đâu`);
  console.log(`[tay] nắm ${coNam}/15 kỷ · xoè hai tay ${coXoe}/15`);
});
