import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BANDS, cityRect, EYE, GRID_X, GRID_Y, gridVector, vecDist,
} from './sweepMetric.mjs';

/**
 * TEST CHO CHÍNH CÔNG CỤ ĐO (TECH_DEBT #22).
 *
 * ⚠️ VÌ SAO PHẢI CÓ: công cụ đo của dự án này đã NÓI DỐI 19 lần, và mỗi lần đều là một kết luận
 * mỹ thuật sai được rút ra rất tự tin. Bản thân phép đo phải bị canh như mã sản phẩm.
 *
 * Ảnh ở đây DỰNG TAY, không đọc PNG thật: mỗi bài nêu rõ nó mong đợi con số nào và vì sao, nên khi
 * đỏ thì biết ngay hỏng ở đâu. (Ảnh thật thì dùng `sweep-score.mjs` trên bản quét.)
 */

/** Ảnh giả: nền `bg`, rồi tô các hình chữ nhật `{x,y,w,h,rgb}` đè lên. */
function makeImage(width, height, bg, rects = []) {
  const pixels = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    pixels[i * 4] = bg[0]; pixels[i * 4 + 1] = bg[1];
    pixels[i * 4 + 2] = bg[2]; pixels[i * 4 + 3] = 255;
  }
  for (const r of rects) {
    for (let y = r.y; y < r.y + r.h; y += 1) {
      for (let x = r.x; x < r.x + r.w; x += 1) {
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        const i = (y * width + x) * 4;
        pixels[i] = r.rgb[0]; pixels[i + 1] = r.rgb[1]; pixels[i + 2] = r.rgb[2];
      }
    }
  }
  return { width, height, pixels };
}

// Một ô đúng cỡ thật của bản quét.
const CELL = { x0: 0, y0: 0, cellW: 300, cellH: 186 };
const RECT = cityRect(CELL);
const GROUND = [120, 118, 96]; // đất/cỏ nắng — nền của dải thành phố

/**
 * Dựng một ô có một mảng "mái" chiếm `share` phần diện tích dải thành phố.
 * ⚠️ MẢNG PHẢI VUÔNG VỨC, KHÔNG PHẢI MỘT DẢI NGANG SUỐT BỀ RỘNG. Bản đầu của fixture này dùng dải
 * ngang, và nó làm ĐỎ hai bài dưới — nhưng lỗi nằm ở fixture chứ không ở phép đo: một dải ngang
 * chỉ hưởng lợi từ việc chia HÀNG (hệ số nhạy trần là √gy = 1,73), trong khi mái thật là mảng gọn
 * nên hưởng lợi từ cả chia hàng lẫn chia cột (√(18/K)). Sửa fixture cho giống vật thật, KHÔNG hạ
 * ngưỡng cho test xanh.
 */
function cellWithPatch(rgb, share = 0.1) {
  const side = Math.round(Math.sqrt(RECT.w * RECT.h * share));
  return makeImage(300, 186, GROUND, [{ x: RECT.x, y: RECT.y, w: side, h: side, rgb }]);
}

test('⚠️ MẢNG NHỎ KHÔNG BỊ PHA LOÃNG — lưới ô con nhạy hơn hẳn trung bình cả dải', () => {
  // Đây là lý do tồn tại của cả bản vá: một mảng mái chiếm ~1/10 dải phải ĐỌC RA ĐƯỢC.
  const a = cellWithPatch(GROUND);            // không có mái
  const b = cellWithPatch([200, 90, 60]);     // mái terracotta chiếm 10%

  const grid = vecDist(gridVector(a, RECT), gridVector(b, RECT));
  const flat = vecDist(
    gridVector(a, RECT, { gx: 1, gy: 1 }),
    gridVector(b, RECT, { gx: 1, gy: 1 }),
  );

  assert.ok(grid > EYE, `Lưới ô con phải đọc ra mảng mái (được ${grid.toFixed(1)}, cần > ${EYE}).`);
  assert.ok(flat < EYE, `Trung bình cả dải LẼ RA phải pha loãng mất (được ${flat.toFixed(1)}).`);
  // Đây là con số biện minh cho việc chia ô con. Dưới 2 lần thì việc chia ô con gần như vô nghĩa.
  assert.ok(grid / flat > 2, `Lưới phải nhạy hơn ít nhất 2 lần (được ${(grid / flat).toFixed(1)}).`);
});

test('⚠️ KHÔNG THIÊN VỊ MÀU — không thể nhầm cỏ thành mái như bộ lọc cũ', () => {
  // Bộ lọc "8% tươi nhất" chỉ nhìn thấy thứ TƯƠI, nên nó mù với đá phiến/bê tông và chấm nhầm cỏ.
  // Phép đo mới không được có sở thích màu: hai mảng lệch nền BẰNG NHAU phải cho khoảng cách BẰNG
  // NHAU, dù một mảng rực rỡ còn mảng kia xám xịt.
  const base = cellWithPatch(GROUND);
  const vivid = cellWithPatch([GROUND[0], GROUND[1] + 60, GROUND[2]]);        // lệch +60 kênh lục
  const drab = cellWithPatch([GROUND[0], GROUND[1], GROUND[2] + 60]);         // lệch +60 kênh lam

  const dVivid = vecDist(gridVector(base, RECT), gridVector(vivid, RECT));
  const dDrab = vecDist(gridVector(base, RECT), gridVector(drab, RECT));
  assert.ok(Math.abs(dVivid - dDrab) < 1e-9,
    `Phép đo đang thiên vị theo màu: ${dVivid.toFixed(2)} vs ${dDrab.toFixed(2)}.`);

  // Và mái XỈN (đá phiến kỷ 5) phải đọc được y như mái RỰC — đúng ca đã giết bộ lọc cũ.
  const slate = cellWithPatch([0x58, 0x6a, 0x89]);
  assert.ok(vecDist(gridVector(base, RECT), gridVector(slate, RECT)) > EYE,
    'Mái đá phiến xỉn phải đọc ra được — đây chính là ca bộ lọc cũ bỏ lọt.');
});

test('⚠️ CHỈ ĐỌC DẢI THÀNH PHỐ — trời và dải đất xa không được lọt vào', () => {
  // Criterion "loại distant land / sky": đổi trắng trời và đất mà số không nhúc nhích.
  const plain = makeImage(300, 186, GROUND);
  const skyBand = { x: 0, y: 0, w: 300, h: Math.round(186 * BANDS[0].to) };
  const groundBand = {
    x: 0, y: Math.round(186 * BANDS[2].from), w: 300, h: 186 - Math.round(186 * BANDS[2].from),
  };
  const noisy = makeImage(300, 186, GROUND, [
    { ...skyBand, rgb: [255, 0, 255] },
    { ...groundBand, rgb: [0, 255, 0] },
  ]);
  assert.equal(vecDist(gridVector(plain, RECT), gridVector(noisy, RECT)), 0,
    'Vùng lấy mẫu đang tràn ra ngoài dải thành phố.');
});

test('⚠️ TẤT ĐỊNH — cùng đầu vào cho ra cùng con số, và ô giống hệt nhau thì cách nhau 0', () => {
  const img = cellWithPatch([200, 90, 60]);
  const v1 = gridVector(img, RECT);
  const v2 = gridVector(img, RECT);
  assert.deepEqual(v1, v2, 'Phép đo không tất định.');
  assert.equal(vecDist(v1, v2), 0);
  assert.equal(v1.length, GRID_X * GRID_Y * 3, 'Số chiều không khớp lưới đã khai.');
});

test('⚠️ LẤY MẪU KHÔNG ĐƯỢC TRÀN SANG Ô BÊN CẠNH hay dải nhãn', () => {
  // Bẫy số 1 + số 5 của `sweep-score.mjs`: lấy mẫu lệch sang ô kế hoặc dải nhãn thì mọi số đều sai
  // mà không có gì đỏ lên. Dựng một tấm rộng 2 ô: ô trái xám, mọi thứ ngoài ô trái tô ĐỎ CHÓI.
  const W = 600;
  const H = 186 + 22; // + dải nhãn
  const img = makeImage(W, H, [255, 0, 0], [
    { x: 0, y: 0, w: 300, h: 186, rgb: GROUND },
  ]);
  const v = gridVector(img, cityRect({ x0: 0, y0: 0, cellW: 300, cellH: 186 }));
  for (let k = 0; k < v.length; k += 3) {
    assert.ok(Math.abs(v[k] - GROUND[0]) < 1e-9 && Math.abs(v[k + 1] - GROUND[1]) < 1e-9,
      `Ô con ${k / 3} đã dính màu ngoài ô: rgb(${v[k].toFixed(0)},${v[k + 1].toFixed(0)},${v[k + 2].toFixed(0)}).`);
  }
});

test('⚠️ ĐƠN VỊ GIỮ NGUYÊN — vẫn là khoảng cách RGB, để ngưỡng mắt 12 còn dùng được', () => {
  // Nếu ai đó đổi `vecDist` sang một thang khác (biểu đồ tần suất, EMD…) thì ngưỡng 12 hết nghĩa
  // mà KHÔNG có gì đỏ lên — nên khoá lại bằng một ca có đáp số tính tay được.
  // Cả ô lệch đúng 30 ở một kênh ⇒ khoảng cách phải đúng bằng 30.
  const a = makeImage(300, 186, [100, 100, 100]);
  const b = makeImage(300, 186, [130, 100, 100]);
  assert.ok(Math.abs(vecDist(gridVector(a, RECT), gridVector(b, RECT)) - 30) < 1e-9,
    'Đơn vị của phép đo đã đổi — ngưỡng mắt 12 không còn dùng được nữa.');
  assert.equal(EYE, 12);
});
