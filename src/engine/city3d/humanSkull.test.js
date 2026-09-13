/**
 * humanSkull.test.js — ROUND 58, VIỆC 3 + VIỆC 4. *"Tôi phải thấy một CON NGƯỜI, không phải một
 * con ma-nơ-canh: có hàm, có cổ, có bàn tay, đứng lệch trọng tâm."* (Đàm)
 *
 * ⚠️ MỌI BÀI Ở ĐÂY ĐỀU VIẾT THÀNH **QUAN HỆ**, KHÔNG THÀNH CON SỐ TUYỆT ĐỐI — và lần này lý do
 * không phải là nguyên tắc suông: cả Việc 3 lẫn Việc 4 đều đã bị một tấm ảnh bác một lần, rồi
 * được dựng lại bằng những con số khác hẳn. Một bài test khoá con số thì nó khoá đúng cái bản
 * ĐÃ BỊ BÁC. Thứ không đổi qua cả hai bản là các quan hệ dưới đây (`CLAUDE.md`, luật 2).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHumanBody } from './human.js';
import { poseAt } from './humanPose.js';
import { shapeMaxRadius, shapeRings } from './humanShape.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const khoi = (body, id) => body.parts.find((p) => p.id === id);
/** Mút TRƯỚC của một khối, đơn vị `headW`, gốc ở trục đầu. */
const mutTruoc = (part, headW) =>
  (part.rest.x + (part.shape === 'box' ? 0.5 : shapeMaxRadius(part.shape)) * part.w) / headW;

test('CÁI ĐẦU KHÔNG PHẢI QUẢ CẦU: hẹp hai bên đúng bậc của sọ người', () => {
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    const dau = khoi(body, 'head');
    const ty = dau.d / dau.w;
    // Chỉ số sọ (cephalic index) người thật ≈ 0,78. Dải 0,74…0,86 rộng rãi nhưng LOẠI HẲN 1,00 —
    // và 1,00 chính là con số đo được suốt chín vòng trước.
    assert.ok(ty > 0.74 && ty < 0.86,
      `kỷ ${era}: bề rộng/bề dài đầu = ${ty.toFixed(3)}. 1,000 là một quả cầu — quay hướng nào cũng`
      + ' y hệt, tức cái đầu không có HƯỚNG.');
  }
  // ⚠️ ĐỎ KHI BỎ GÌ: đổi `headZ` ở `humanDims` về `H * 0.22` → đỏ cả 15 kỷ. Đã thử.
});

test('ĐƯỜNG SINH SỌ CÓ CHỖ THÓT Ở THÁI DƯƠNG — thứ phân biệt một cái sọ với một quả trứng', () => {
  /*
    ⚠️ ĐÂY LÀ BÀI CANH ĐẶC ĐIỂM ĐẮT NHẤT CỦA VIỆC 3, và nó canh một tính chất TÔ-PÔ chứ không canh
    một con số: bán kính KHÔNG được tăng đơn điệu từ cằm lên đỉnh. Có một chỗ nó GIẢM — chỗ thái
    dương, kẹp giữa gò má ở dưới và xương đỉnh ở trên. Bỏ nó đi thì mọi con số khác vẫn "hợp lý"
    mà hình thì là một quả trứng, và không gì đỏ lên.
  */
  const rings = shapeRings('skull');
  let soChoThot = 0;
  let sauThot = 0;
  for (let i = 1; i < rings.length; i += 1) {
    if (rings[i][1] < rings[i - 1][1] && rings[i][0] < 0.1) {
      soChoThot += 1;
      sauThot = Math.max(sauThot, rings[i - 1][1] - rings[i][1]);
    }
  }
  assert.ok(soChoThot >= 1,
    'đường sinh sọ tăng đơn điệu từ cằm lên — đó là một QUẢ TRỨNG. Phải có một chỗ thót ở thái'
    + ' dương (dưới mức y = 0,1) để mắt đọc ra "hộp sọ ở trên, khuôn mặt ở dưới".');
  assert.ok(sauThot >= 0.03,
    `chỗ thót chỉ sâu ${sauThot.toFixed(3)} — dưới 0,03 thì nó không đọc ra ở bất kỳ cỡ nào`);

  // Và cái đầu phải KẾT THÚC ở dưới, không bị cắt ngang: cằm hẹp hơn nhiều so với chỗ rộng nhất.
  const cam = rings[0][1];
  const rong = Math.max(...rings.map((r) => r[1]));
  assert.ok(cam < rong * 0.40,
    `vành đáy ${cam} so với chỗ rộng nhất ${rong} — trên 40% thì cái đầu bị CẮT NGANG chứ không`
    + ' kết thúc bằng một cái cằm, và chỗ cắt ấy là thứ vòng 54 phải lấy một cái cổ rộng ra che.');
  // ⚠️ ĐỎ KHI BỎ GÌ: xoá vành `[-0.04, 0.84]` khỏi `SKULL_RINGS` → vế một đỏ. Đã thử.
});

test('MŨ TÓC DÙNG CHUNG ĐƯỜNG SINH VỚI CÁI SỌ — một hằng số, không phải hai bản chép', () => {
  /*
    ⚠️ BÀI NÀY CANH MỘT LỜI HỨA TỪNG ĐƯỢC VIẾT BẰNG VĂN XUÔI VÀ ĐÃ GÃY IM LẶNG. Chú thích `scalp`
    của vòng 56 hứa *"`rings` đúng bằng `dome`"*. Vòng 58 đổi cái đầu sang `skull` và lời hứa ấy
    gãy ngay: ở tầm xương đỉnh sọ nở 1,00 còn mũ tóc (vẫn theo `dome`) chỉ 0,92 ⇒ tóc chui vào
    trong sọ và cái vạch ngang của vòng 56 quay lại. Một lời hứa bằng văn xuôi thì không có răng.
  */
  const soDau = shapeRings('skull');
  const soToc = shapeRings('scalp');
  assert.deepEqual(soToc, soDau,
    'đường sinh của `scalp` đã trôi khỏi `skull`. Chúng phải cùng trỏ vào `SKULL_RINGS` —'
    + ' mũ tóc là CHÍNH cái sọ phóng to đều, nên chép ra hai bảng là hẹn ngày chân tóc rời da đầu.');
});

test('TRÁN DỐC — một sự THỤT LÙI, nên nó là quan hệ giữa hai độ nhô, không phải một khối', () => {
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    const W = body.dims.headW;
    const go = khoi(body, 'browRidge');
    const dau = khoi(body, 'head');
    assert.ok(go, `kỷ ${era}: không có gờ mày`);

    /*
      ⚠️ ĐO BẰNG **GÓC**, KHÔNG BẰNG HIỆU HAI ĐỘ NHÔ — VÀ NGƯỠNG ĐẦU TIÊN CỦA TÔI SAI VÌ ĐÚNG LÝ DO
      ẤY. Bản đầu đòi `gờ mày > sọ-ở-tầm-trán + 0,10 headW` và nó đỏ: đo được chênh **0,055**.
      Nhưng 0,055 là một khoảng cách NGANG mà "dốc" là một chuyện của **tỉ số giữa lùi và cao**.
      Trán thật ngả về sau chừng 10–20° so với phương thẳng đứng; ở đây lùi 0,055 `headW` trên một
      quãng cao 0,185 `headH` ⇒ **16,4°** — đúng dải người thật. Ngưỡng 0,10 tôi chọn theo cảm
      giác, và nếu nghe theo nó thì tôi đã đẩy gờ mày trở lại thành cái mái hiên vừa bị ảnh bác.
      ⇒ Dải 8°…40°: dưới 8° là một cái trán DỰNG ĐỨNG (mặt sọ phẳng lì từ mày lên đỉnh), trên 40°
      là một cái trán vát ngược kiểu người vượn.
    */
    const rings = shapeRings(dau.shape);
    const iTran = rings.length - 2;
    const nhoTran = (rings[iTran][1] * shapeMaxRadius(dau.shape) * dau.w) / W;
    const caoTran = (rings[iTran][0] + 0.5) - go.rest.y / body.dims.headH;
    const nhoGo = mutTruoc(go, W);
    const docDo = (Math.atan2(nhoGo - nhoTran, caoTran) * 180) / Math.PI;
    assert.ok(docDo > 8 && docDo < 40,
      `kỷ ${era}: trán ngả ${docDo.toFixed(1)}° so với phương đứng (gờ mày nhô ${nhoGo.toFixed(3)},`
      + ` sọ ở tầm trán ${nhoTran.toFixed(3)}, cách nhau ${caoTran.toFixed(3)} chiều cao đầu).`
      + ' Dưới 8° là trán dựng đứng; trên 40° là trán vát ngược.');

    // ⚠️ VÀ VẾ NGƯỢC LẠI, VẾ MÀ MỘT TẤM ẢNH ĐÃ PHẢI DẠY: gờ mày KHÔNG được vượt con mắt.
    // Bản đầu cho nó nhô tới 0,580 để "kẹp con mắt vào một cái hốc" — trên ảnh nó thành một mái
    // hiên vuông và hai con mắt biến mất dưới bóng nó. Con mắt hoạt hình vốn được CỐ Ý cho nhô
    // (vòng 54: *"nó cần MẮT"*), nên ép một cái xương chạy theo nó là ép sai chiều.
    const mat = khoi(body, 'eyeL');
    assert.ok(mat && mutTruoc(go, W) < mutTruoc(mat, W),
      `kỷ ${era}: gờ mày (${nhoGo.toFixed(3)}) nhô hơn cả con mắt (${mutTruoc(mat, W).toFixed(3)})`
      + ' — đó là một cái mái hiên, không phải một cái gờ xương.');
  }
});

test('CỔ PHẢI NHÌN THẤY ĐƯỢC: đỉnh quả cầu vai nằm DƯỚI hàm, ở cả 15 kỷ', () => {
  /*
    ⚠️ SỐ ĐO TRƯỚC VÒNG 58, KỶ 1: đáy đầu y = 0,17231 · đỉnh cầu vai y = 0,17335 ⇒ chiều cao cổ
    nhìn thấy được là **ÂM 0,020 `headH`**. Cái cổ có trong mã từ vòng 54 mà chưa từng có trên ảnh:
    hai quả cầu vai nhô cao hơn hàm, tức dáng một người đang so vai vĩnh viễn.
    ⇒ Bài này KHÔNG khoá `shoulderY = 0,74 torsoH`. Nâng đầu, hạ vai, thu quả cầu — cách nào cũng
    được, miễn còn nhìn thấy cái cổ. Một con số khoá lại thì nó cấm luôn cả ba cách.
  */
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    const pose = poseAt(body, 0);
    const dau = khoi(body, 'head');
    const cau = khoi(body, 'shoulderBallL');
    const dayDau = pose.joints.head.y + dau.rest.y - dau.h / 2;
    const dinhCau = pose.joints.shoulderL.y + shapeMaxRadius(cau.shape) * cau.w;
    const co = (dayDau - dinhCau) / body.dims.headH;
    assert.ok(co > 0.08,
      `kỷ ${era}: cổ nhìn thấy được chỉ ${co.toFixed(3)} lần chiều cao đầu`
      + `${co < 0 ? ' — ÂM, tức quả cầu vai nằm CAO HƠN hàm' : ''}. Dưới 0,08 thì ở ảnh cận nó là`
      + ' một cái đầu đặt thẳng lên hai cái vai.');
  }
  // ⚠️ ĐỎ KHI BỎ GÌ: trả `shoulderY` về `d.torsoH * 0.88` → đỏ cả 15 kỷ (cổ = −0,020). Đã thử.
});

test('VAI XUÔI: có một khối bắc từ chân cổ ra QUÁ tâm vai, nếu không thì vai là một góc vuông', () => {
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    const co = khoi(body, 'trapezius');
    assert.ok(co, `kỷ ${era}: không có khối cơ thang — chỗ giữa cổ và vai đang TRỐNG`);

    const voiRa = shapeMaxRadius(co.shape) * co.d;
    assert.ok(voiRa > body.dims.shoulderZ,
      `kỷ ${era}: cơ thang chỉ với ra ${voiRa.toFixed(5)} mà tâm vai đã ở ${body.dims.shoulderZ.toFixed(5)}`
      + ' — nó phải PHỦ QUA chỏm vai thì đường bao cổ → vai mới xuôi; dừng trước đó thì nó chỉ là'
      + ' một cái bướu giữa lưng.');

    // Và nó phải là phần NỐI DÀI của thân, cùng vai màu — nếu không thì lại là một "cổ áo trắng"
    // quanh vai, đúng lỗi vòng 54. `humanSeams.js` canh vế màu; ở đây canh vế KHAI BÁO.
    assert.equal(co.continues, 'torso',
      `kỷ ${era}: cơ thang không khai \`continues: 'torso'\` ⇒ cái gác đường viền màu không thấy nó`);
  }
});
