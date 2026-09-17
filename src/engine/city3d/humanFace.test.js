/**
 * humanFace.test.js — ROUND 61, VIỆC 4. *"Con mắt phải nằm SÂU trong hốc, không phải hai viên bi
 * dán trên mặt."* (Đàm)
 *
 * ⚠️ LUẬT MỚI DÙNG ĐỂ CHẤM CẢ BÀI: "Thêm khối LỒI không tạo ra chỗ LÕM. Muốn có chỗ lõm thì phải
 * KHOÉT ĐƯỜNG SINH." Ba vòng trước (R58 sọ 8-khối, R59 mí mắt 4-khối, R58 quả cầu khớp) đều chỉ
 * THÊM khối lồi; không vòng nào khoét một cái hốc thật. Vòng này khoét THẲNG vào `SKULL_RINGS`
 * (một vành mới, hẹp hơn cả gò má lẫn trán) rồi LÙI con mắt vào sau vành ấy — không thêm một khối
 * nào cho gò má, sống mũi hay gờ mày mới. Xem `human.js` (khối chú thích ở `eyeL`/`SKULL_RINGS`)
 * để biết vì sao đúng hai con số bị đổi (đáy hốc + độ sâu con mắt) là đủ.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHumanBody } from './human.js';
import { shapeRings, shapeSides, shapeMaxRadius } from './humanShape.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const khoi = (body, id) => body.parts.find((p) => p.id === id);
const circumradius = (sides) => 0.5 / Math.cos(Math.PI / sides);

/** Mút TRƯỚC của một khối, đơn vị `headW` — cùng công thức với `humanSkull.test.js`. */
const mutTruoc = (part, headW) =>
  (part.rest.x + (part.shape === 'box' ? 0.5 : shapeMaxRadius(part.shape)) * part.w) / headW;

/** Nội suy tuyến tính trên bảng vành — cùng một hàm được dùng lại ở `humanJoints.test.js`. */
function profileAt(rings, yFrac) {
  const last = rings.length - 1;
  if (yFrac <= rings[0][0]) return rings[0][1];
  if (yFrac >= rings[last][0]) return rings[last][1];
  for (let i = 0; i < last; i += 1) {
    if (yFrac >= rings[i][0] && yFrac <= rings[i + 1][0]) {
      const t = (yFrac - rings[i][0]) / (rings[i + 1][0] - rings[i][0]);
      return rings[i][1] + (rings[i + 1][1] - rings[i][1]) * t;
    }
  }
  return rings[last][1];
}

/** Bán kính MẶT SỌ TRẦN (không tính con mắt/gờ mày) tại một độ cao `yFrac`, đơn vị `headW`. */
function skullBareAt(head, headW, yFrac) {
  return (circumradius(shapeSides(head.shape)) * profileAt(shapeRings(head.shape), yFrac) * head.w) / headW;
}

// Độ cao con mắt trong hệ toạ độ sọ: `tam = headH * 0.545` ở `facePieces`, gốc sọ tại
// `rest.y = headH * 0.5` ⇒ yFrac = (0.545 − 0.5) = 0.045. Xem `humanShape.js` (`SKULL_RINGS`).
const Y_FRAC_MAT = 0.045;
const Y_FRAC_GO_MA = -0.14; // gò má — chỗ rộng nhất của khuôn mặt, xem `SKULL_RINGS`

test('CÓ MỘT ĐÁY HỐC MẮT THẬT TRONG ĐƯỜNG SINH SỌ — hẹp hơn CẢ gò má lẫn xương đỉnh', () => {
  // ⚠️ ĐỎ KHI BỎ GÌ: đổi vành `[0.045, 0.85]` trong `SKULL_RINGS` thành một điểm nằm TRÊN đường
  // nối gò má(0.88)–đỉnh(1.00) (tức không còn là một chỗ trũng) → vế dưới đỏ. Đã thử bằng tay
  // (thế `0.95` vào, chạy lại): đỏ đúng như dự đoán.
  // ⚠️ NGƯỠNG SÂU 0,03 — KHÔNG PHẢI CHỌN CHO VỪA, MÀ LÀ TRẦN THẬT CỦA HỆ. Đào sâu hơn (đã thử 0,78,
  // tức sâu 0,10) làm bài «MŨ TÓC PHẢI NẰM NGOÀI CÁI SỌ» (`humanShape.test.js`) đỏ — `scalpFit` kéo
  // trục y mũ tóc theo `SCALP_LIFT` quanh gốc (chân cằm) nên một hốc quá sâu bị mũ tóc "nhảy tuột"
  // qua bên kia sườn dốc, xem chú thích ở `SKULL_RINGS`. 0,03 khớp đúng ngưỡng "đọc được ở mọi cỡ"
  // mà bài «THÁI DƯƠNG» ở `humanSkull.test.js` đã dùng — cùng một con số, không phải hai lần đoán.
  const body = buildHumanBody({ era: 1, index: 0 });
  const head = khoi(body, 'head');
  const rings = shapeRings(head.shape);
  const goMa = profileAt(rings, Y_FRAC_GO_MA);
  const dinh = profileAt(rings, 0.20); // xương đỉnh, vành ngay trên hốc từ round 61 (0.08 đã bị bỏ)
  const day = profileAt(rings, Y_FRAC_MAT);
  assert.ok(day < goMa && day < dinh,
    `đáy hốc (${day}) phải hẹp hơn CẢ gò má (${goMa}) lẫn xương đỉnh (${dinh}) — nếu không thì đây`
    + ' không phải một cái hốc, chỉ là một điểm trên một đường dốc đơn điệu.');
  assert.ok(goMa - day >= 0.03,
    `hốc chỉ sâu ${(goMa - day).toFixed(3)} so với gò má — dưới 0,03 thì không đọc ra ở bất kỳ cỡ`
    + ' nào (cùng ngưỡng bài "THÁI DƯƠNG" ở humanSkull.test.js).');
});

test('MẮT NẰM SAU GỜ MÀY, Ở CẢ 15 KỶ — đảo đúng vế mà round 58 từng khoá ngược', () => {
  for (const era of ERAS) {
    const body = buildHumanBody({ era, index: 0 });
    const W = body.dims.headW;
    const eyeL = khoi(body, 'eyeL');
    const browRidge = khoi(body, 'browRidge');
    const matNho = mutTruoc(eyeL, W);
    const goNho = mutTruoc(browRidge, W);
    assert.ok(matNho < goNho,
      `kỷ ${era}: mặt trước lòng trắng (${matNho.toFixed(3)}) phải nằm SAU gờ mày (${goNho.toFixed(3)})`
      + ' — "mắt phải nằm sâu trong hốc" (Đàm, round 61).');
  }
});

test('MẮT NẰM SAU GÒ MÁ, Ở CẢ 15 KỶ — không chỉ sau gờ mày mà còn sau cả mặt phẳng gò má', () => {
  for (const era of ERAS) {
    const body = buildHumanBody({ era, index: 0 });
    const W = body.dims.headW;
    const head = khoi(body, 'head');
    const eyeL = khoi(body, 'eyeL');
    const matNho = mutTruoc(eyeL, W);
    const goMaNho = skullBareAt(head, W, Y_FRAC_GO_MA);
    assert.ok(matNho < goMaNho,
      `kỷ ${era}: mặt trước lòng trắng (${matNho.toFixed(3)}) phải nằm SAU mặt phẳng gò má`
      + ` (${goMaNho.toFixed(3)}) — nếu không mắt vẫn là "viên bi dán trên mặt", chỉ là dán thấp`
      + ' hơn một chút.');
  }
});

test('MẮT VẪN NẰM TRƯỚC ĐÁY HỐC — lùi vào hốc, không LỌT XUỐNG DƯỚI hốc (vẫn phải thấy được)', () => {
  for (const era of ERAS) {
    const body = buildHumanBody({ era, index: 0 });
    const W = body.dims.headW;
    const head = khoi(body, 'head');
    const eyeL = khoi(body, 'eyeL');
    const matNho = mutTruoc(eyeL, W);
    const day = skullBareAt(head, W, Y_FRAC_MAT);
    assert.ok(matNho > day,
      `kỷ ${era}: lòng trắng (${matNho.toFixed(3)}) phải nhô hơn đáy hốc (${day.toFixed(3)}) — lùi`
      + ' quá sâu thì con mắt chìm hẳn vào khối sọ đặc, không còn thấy được nữa.');
  }
});

test('CON NGƯƠI VẪN THÒ QUA MẶT LÒNG TRẮNG — phép "poke qua" của round 56 không bị lùi làm mất', () => {
  // ⚠️ ĐỎ KHI BỎ GÌ: đặt con ngươi ĐỒNG TÂM với lòng trắng (cùng `rest.x`) → vế dưới đỏ. Đây đúng
  // là lỗi mà chú thích ở `human.js` (khối "MỘT KHỐI NHỎ NẰM TRONG MỘT KHỐI LỚN") cảnh báo.
  for (const era of ERAS) {
    const body = buildHumanBody({ era, index: 0 });
    const W = body.dims.headW;
    const eyeL = khoi(body, 'eyeL');
    const pupilL = khoi(body, 'pupilL');
    const matNho = mutTruoc(eyeL, W);
    const nguoiNho = mutTruoc(pupilL, W);
    assert.ok(nguoiNho > matNho,
      `kỷ ${era}: con ngươi (${nguoiNho.toFixed(3)}) phải thò ra trước mặt lòng trắng`
      + ` (${matNho.toFixed(3)}) — nếu không nó nằm gọn bên trong và biến mất (round 56).`);
    // Và con ngươi cũng không được vượt gờ mày — cùng luật với lòng trắng, siết chặt hơn.
    const browRidge = khoi(body, 'browRidge');
    const goNho = mutTruoc(browRidge, W);
    assert.ok(nguoiNho < goNho,
      `kỷ ${era}: con ngươi (${nguoiNho.toFixed(3)}) không được vượt gờ mày (${goNho.toFixed(3)}).`);
  }
});

test('KHÔNG THÊM KHỐI LỒI NÀO CHO GÒ MÁ / SỐNG MŨI / GỜ MÀY — Việc 4 chỉ đổi 2 con số', () => {
  // ⚠️ Danh sách khối trên đầu+mặt phải giữ NGUYÊN 11 cái đã có từ round 58-60: occiput, browRidge,
  // earL/R (skullPieces) + eyeL/R, pupilL/R, browL/R, mouth (facePieces). Việc 4 chỉ SỬA toạ độ
  // của những khối ĐÃ CÓ (eyeL/R, pupilL/R) và một vành trong `SKULL_RINGS` — không một khối mới.
  const CHOT_11_KHOI = ['occiput', 'browRidge', 'earL', 'earR', 'eyeL', 'eyeR', 'pupilL', 'pupilR', 'browL', 'browR', 'mouth'];
  for (const era of ERAS) {
    const body = buildHumanBody({ era, index: 0 });
    const mat = new Set(body.parts.map((p) => p.id));
    for (const id of CHOT_11_KHOI) {
      assert.ok(mat.has(id), `kỷ ${era}: thiếu khối "${id}" — Việc 4 không được BỚT khối nào có sẵn.`);
    }
    const CAC_TEN_CAM = ['cheek', 'nose', 'noseBridge', 'cheekbone', 'socket', 'eyeSocket'];
    for (const p of body.parts) {
      for (const cam of CAC_TEN_CAM) {
        assert.ok(!p.id.toLowerCase().includes(cam.toLowerCase()),
          `kỷ ${era}: khối "${p.id}" nghe như một khối LỒI mới dán cho gò má/sống mũi/hốc mắt —`
          + ' Việc 4 cấm việc này. Hốc mắt phải đến từ đường sinh sọ, không từ một khối mới.');
      }
    }
  }
});
