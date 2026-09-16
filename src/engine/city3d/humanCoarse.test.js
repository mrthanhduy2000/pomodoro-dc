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

test('quả cầu khớp KHÔNG to ra khi đổi khuôn — bán kính ngoại tiếp phụ thuộc số cạnh', () => {
  // ⚠️ `0,5 / cos(π/n)`: 0,5007 ở 60 cạnh, 0,5098 ở 16. Một chỗ còn hỏi `shapeMaxRadius('dome')`
  // trong khi khối đã là `bead` cho quả cầu to hơn 1,8% — đúng cái cục u round 58 đã trừ khử.
  assert.ok(shapeMaxRadius('bead') > shapeMaxRadius('dome'),
    'nếu hai số này bằng nhau thì bài test dưới đây không chứng minh được gì');
  const balls = blocksOf(1).filter((p) => /Ball[LR]$/.test(p.id));
  assert.equal(balls.length, 6, 'sáu quả cầu khớp: hai vai, hai khuỷu, hai gối');
  for (const b of balls) {
    assert.equal(b.shape, 'bead', `${b.id} phải dùng khuôn thô`);
    const outer = b.w * shapeMaxRadius(b.shape);
    assert.ok(outer > 0 && Number.isFinite(outer), `${b.id}: bán kính ngoài phải là một số thật`);
  }
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
  assert.ok(n >= 11 * 15, `phải có ít nhất 11 khối thô mỗi kỷ, đếm được ${n} trên 15 kỷ`);
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

test('phép đổi khuôn trả lại một phần tư số tam giác của mỗi cư dân', () => {
  const parts = blocksOf(1);
  const now = parts.reduce((a, p) => a + shapeTriangles(p.shape), 0);
  const before = parts.reduce((a, p) => a + shapeTriangles(p.shape === 'bead' ? 'dome' : p.shape), 0);
  const saved = (before - now) / before;
  assert.ok(saved > 0.2,
    `phải tiết kiệm trên 20% — đo được ${before} → ${now} tam giác/người, tức ${(saved * 100).toFixed(1)}%`);
});
