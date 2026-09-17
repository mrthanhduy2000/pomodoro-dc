/**
 * humanCoarse.test.js — round 60, Việc 1. KHUÔN THÔ DÙNG CHUNG (`bead`), đóng `TECH_DEBT_3D #98`.
 *
 * ⚠️ BÀI TEST QUAN TRỌNG NHẤT Ở ĐÂY LÀ BÀI CUỐI — bài **ngược**. Một bài chỉ nói *"mọi khối đang
 * dùng `bead` đều đủ nhỏ"* thì vẫn xanh khi `bead` không được dùng ở đâu cả, và cũng vẫn xanh nếu
 * ngưỡng bị nới tới vô cực. Nên có một bài đòi rằng ngưỡng ấy THẬT SỰ LOẠI được thứ gì đó: hai
 * khối `dome` to nhất (gáy và mái tóc trước trán) phải TRƯỢT nếu đem chuyển sang `bead`. Hỏi đúng
 * câu của dự án: *đỏ khi ta bỏ CÁI GÌ?* — đỏ khi ai đó chuyển thêm một khối quá to sang khuôn thô,
 * và đỏ khi ai đó hạ ngưỡng cho tiện.
 *
 * ⚠️ VÀ THƯỚC ĐO KHÔNG ĐƯỢC CHÉP. `1.728 điểm ảnh trên một đơn vị thế giới` là một con số SUY RA
 * từ `residentViewDistance` + `CITY_CAMERA_FOV` + chiều cao khung ảnh thật; viết cứng nó vào đây
 * là dựng bản chép thứ hai của cả chuỗi camera, đúng họ khuyết tật đã làm `sweep-score.mjs` in ra
 * một bộ số bịa rất thuyết phục ở Phase 4G.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHumanBody } from './human.js';
import { shapeMaxRadius, shapeRings, shapeSides, shapeTriangles } from './humanShape.js';
import { CITY_CAMERA_FOV } from './orbit.js';
import { residentViewDistance } from './residentFocus.js';

/**
 * Chiều cao khung ảnh ở CHỖ NHÌN GẦN NHẤT MÀ APP TỚI ĐƯỢC, tính bằng điểm ảnh THẬT.
 * iPhone 390 CSS × devicePixelRatio 3 = 1.170 điểm ảnh ngang; khung sân khấu cao 726 ở tỉ lệ ấy —
 * đúng công thức chụp đã chốt từ round 57 (`--dpr 1 --width 1170 --height 726`).
 */
const FRAME_PX = 726;

/** Bao nhiêu điểm ảnh thật trên một đơn vị thế giới khi camera đứng trước mặt một người cao `h`. */
function pxPerUnit(height) {
  const dist = residentViewDistance(height);
  const halfY = ((CITY_CAMERA_FOV / 2) * Math.PI) / 180;
  return FRAME_PX / (2 * dist * Math.tan(halfY));
}

/**
 * Đường bao của một đa giác `n` cạnh hụt so với đường tròn bao nhiêu ĐIỂM ẢNH, ở chỗ lõm nhất.
 * `r · (1 − cos(π/n))` — một QUAN HỆ giữa bề rộng trên màn hình và số cạnh, không phải một con số.
 */
function silhouetteErrorPx(widthWorld, sides, scale) {
  return (widthWorld * scale) / 2 * (1 - Math.cos(Math.PI / sides));
}

/** Nửa điểm ảnh: dưới mức này, đường bao đa giác không phân biệt được với đường tròn. */
const NGUONG_PX = 0.5;

const blocksOf = (era) => buildHumanBody({ era, index: 0 }).parts;
const widest = (p) => Math.max(p.w, p.d);

test('`bead` là `dome` ít cạnh đi — CÙNG bảng vành, không phải một bản chép gần giống', () => {
  assert.deepEqual(shapeRings('bead'), shapeRings('dome'),
    'hai khuôn phải dùng CHUNG một bảng vành; một bản chép sẽ trôi và phép hoán đổi âm thầm đổi hình');
  assert.equal(shapeSides('dome'), 60);
  assert.equal(shapeSides('bead'), 16);
  assert.ok(shapeTriangles('bead') < shapeTriangles('dome') / 3.5,
    `khuôn thô phải rẻ hơn ít nhất 3,5 lần — đo được ${shapeTriangles('dome')} so với ${shapeTriangles('bead')}`);
});

test('BÁN KÍNH NGOẠI TIẾP KHÔNG BẰNG NHAU GIỮA HAI KHUÔN — phụ thuộc số cạnh, không được suy nhầm', () => {
  /*
    ⚠️ ROUND 61: SÁU "QUẢ CẦU KHỚP" MÀ BÀI NÀY TỪNG CANH ĐÃ BỊ BỎ — Việc 1 + 3 đảo luật khớp
    (khớp nay là chỗ HẸP NHẤT, lấp khe bằng hai đoạn chi đâm sâu qua nhau, không còn quả cầu nào
    cả — xem `human.js` và `humanJoints.test.js`). Bài này giữ lại đúng MỘT vế còn sống: `bead` và
    `dome` dùng chung bảng vành nhưng số cạnh khác nhau (60 ↔ 16) nên bán kính ngoại tiếp
    (`0,5 / cos(π/n)`) khác nhau — 0,5007 so với 0,5098, lệch 1,8%. Bất kỳ chỗ nào tính bán kính
    thật của một khối `bead` mà lỡ hỏi `shapeMaxRadius('dome')` sẽ sai đúng 1,8% ấy.
  */
  assert.ok(shapeMaxRadius('bead') > shapeMaxRadius('dome'),
    'nếu hai số này bằng nhau thì lời cảnh báo ở trên vô nghĩa — không còn gì để suy nhầm');
});

test('mọi khối dùng khuôn thô đều nhỏ hơn ngưỡng nửa điểm ảnh, ở CẢ 15 KỶ', () => {
  let n = 0;
  let worst = { px: 0 };
  for (let era = 1; era <= 15; era += 1) {
    const parts = blocksOf(era);
    const scale = pxPerUnit(buildHumanBody({ era, index: 0 }).dims.height);
    for (const p of parts) {
      if (p.shape !== 'bead') continue;
      n += 1;
      const err = silhouetteErrorPx(widest(p), shapeSides('bead'), scale);
      if (err > worst.px) worst = { px: err, id: p.id, era, w: widest(p) * scale };
      assert.ok(err < NGUONG_PX,
        `kỷ ${era}, khối "${p.id}" rộng ${(widest(p) * scale).toFixed(1)} điểm ảnh ⇒ đường bao hụt `
        + `${err.toFixed(3)} điểm ảnh, quá ngưỡng ${NGUONG_PX}. Cho nó khuôn mịn, đừng nới ngưỡng.`);
    }
  }
  // ⚠️ 11 → 5 Ở ROUND 61: sáu quả cầu khớp (vai/khuỷu/gối) từng dùng `bead` đã bị bỏ hẳn (Việc 1
  // + 3, xem `humanJoints.test.js`). Năm khối còn lại — hai lòng trắng, hai con ngươi, gờ mày —
  // là phần round 60 vẫn còn đúng nguyên.
  assert.ok(n >= 5 * 15, `phải có ít nhất 5 khối thô mỗi kỷ, đếm được ${n} trên 15 kỷ`);
  assert.ok(worst.px > 0.3, `khối thô to nhất (${worst.id}, ${worst.px.toFixed(3)} px) phải SÁT ngưỡng `
    + '— nếu nó còn cách xa thì ta đang bỏ phí ngân sách, và bài test này chưa canh gì cả');
});

test('NGƯỠC LẠI: ngưỡng thật sự loại được thứ gì đó — hai khối `dome` to nhất phải TRƯỢT', () => {
  // ⚠️ ĐÂY LÀ BÀI LÀM CHO BA BÀI TRÊN CÓ NGHĨA. Không có nó, một ngưỡng 999 vẫn xanh hết.
  const parts = blocksOf(1);
  const scale = pxPerUnit(buildHumanBody({ era: 1, index: 0 }).dims.height);
  const con = parts.filter((p) => p.shape === 'dome');
  assert.ok(con.length >= 2, 'phải còn khối dùng khuôn MỊN, nếu không thì chẳng còn gì để so');
  for (const p of con) {
    const err = silhouetteErrorPx(widest(p), shapeSides('bead'), scale);
    assert.ok(err >= NGUONG_PX,
      `khối "${p.id}" (${(widest(p) * scale).toFixed(1)} điểm ảnh) chỉ hụt ${err.toFixed(3)} điểm ảnh `
      + 'nếu chuyển sang khuôn thô ⇒ nó ĐANG bỏ phí ngân sách ở khuôn mịn. Chuyển nó đi.');
  }
});

test('phép đổi khuôn vẫn còn trả lại tam giác thật, dù sáu quả cầu khớp không còn để so', () => {
  // ⚠️ NGƯỠNG HẠ TỪ >20% XUỐNG >10% Ở ROUND 61 — CÓ SỐ ĐO, KHÔNG PHẢI CHỌN CHO VỪA. Round 60 đổi
  // 11 khối sang `bead` (bao gồm sáu quả cầu khớp); round 61 bỏ sáu quả cầu ấy, nên phép so
  // "trước/sau" nay chỉ còn đo đúng 5 khối mặt (lòng trắng, con ngươi, gờ mày) — khoản tiết kiệm
  // nhỏ lại theo đúng tỉ lệ, không phải một khoản mất đi vô cớ.
  const parts = blocksOf(1);
  const now = parts.reduce((a, p) => a + shapeTriangles(p.shape), 0);
  const before = parts.reduce((a, p) => a + shapeTriangles(p.shape === 'bead' ? 'dome' : p.shape), 0);
  const saved = (before - now) / before;
  assert.ok(saved > 0.1,
    `phải tiết kiệm trên 10% — đo được ${before} → ${now} tam giác/người, tức ${(saved * 100).toFixed(1)}%`);
});
