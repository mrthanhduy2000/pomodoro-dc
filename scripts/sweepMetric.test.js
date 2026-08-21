import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BANDS, cityRect, coTheoMatNa, EYE, GRID_X, GRID_Y, gridVector, soHaiKhung, vecDist,
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

/* ══════════════════════════════════════════════════════════════════════════════════════════════
 * `soHaiKhung` + `coTheoMatNa` — phép so HAI KHUNG HÌNH và cái mặt nạ giới hạn vùng xét.
 *
 * ⚠️ VÌ SAO CHÚNG NẰM Ở ĐÂY CHỨ KHÔNG PHẢI TRONG `sweep-diff.mjs`: file kia chạy mã ở tầng cao
 * nhất (`process.argv`, `process.exit`) nên KHÔNG import được từ một bài test. Để nguyên ở đó thì
 * lưới an toàn duy nhất là `--selftest` — thứ chỉ chạy khi có người NHỚ gõ, và dự án đã trả giá
 * đúng chỗ này ba lần. *Một bài học được ghi ra KHÔNG chặn được gì; chỉ một bài TEST mới chặn được.*
 *
 * Fixture dưới đây có ĐÁP SỐ TÍNH TAY ĐƯỢC, cố ý:
 *   ảnh 100×50 = 5000 điểm ảnh, nền hai bên đều rgb(100,100,100) ⇒ lệch 0
 *   • mảng A (0,0,10,10)  = 100 điểm ảnh, lệch 40 ở kênh đỏ  ⇒ TRÊN ngưỡng mắt 12
 *   • mảng B (50,0,20,10) = 200 điểm ảnh, lệch  5 ở kênh lam ⇒ DƯỚI ngưỡng mắt 12
 * ⇒ cả khung: xét 5000 · tổng lệch 100×40 + 200×5 = 5000 · lệch TB = 1,00 · vượt ngưỡng 100 (2,0%)
 *   · lệch TB CHỖ ĐÃ ĐỔI = 4000/100 = 40.
 * Mảng B tồn tại để tách bạch `lechTB` với `lechTBDoi`: thiếu nó thì hai số bằng nhau và một bản
 * cài đặt trộn lẫn hai công thức vẫn xanh.
 *
 * ⚠️ ĐÃ THỬ-CHO-ĐỎ THẬT (2026-08-21) — tám phép phá, mỗi phép nêu TRƯỚC chỗ mong đợi đỏ, chạy
 * trong một bản sao riêng, và phép phá TỰ ĐẾM số chỗ khớp rồi đòi đúng 1 (một phép phá trượt và
 * một bài test mù trông giống hệt nhau). Kết quả: cả tám đỏ ĐÚNG chỗ đã nêu.
 *   MS0 cho vòng lặp không chạy (`n = 0`)          → «HAI KHUNG GIỐNG HỆT NHAU PHẢI RA 0»
 *   MS1 gỡ hẳn `if (co && !co[i]) continue;`       → «MẶT NẠ ĐỔI **MẪU SỐ**»
 *   MS2 `lechTBDoi` lấy `tong` thay `tongDoi`      → «LÀ HAI ĐẠI LƯỢNG KHÁC NHAU»
 *   MS3 bỏ vế trội hẳn (`> khac`)                  → «TRỘI HẲN, KHÔNG PHẢI VƯỢT NGƯỠNG»
 *   MS4 bỏ vế ngưỡng (`>= nguong`)                 → «TRỘI HẲN, KHÔNG PHẢI VƯỢT NGƯỠNG»
 *   MS5 bỏ chốt hai ảnh khác cỡ                    → «TỪ CHỐI THẲNG kênh lạ…»
 *   MS6 cho kênh lạ tự chữa về kênh lục            → «TỪ CHỐI THẲNG kênh lạ…»
 *   MS7 lệch chỉ số mặt nạ một điểm ảnh (`co[i+1]`)→ «MẶT NẠ BẬT HẾT PHẢI TRÙNG KHÍT»
 * ══════════════════════════════════════════════════════════════════════════════════════════════ */

const KHUNG_W = 100;
const KHUNG_H = 50;
const MANG_A = { x: 0, y: 0, w: 10, h: 10 };     // 100 điểm ảnh, lệch 40 — TRÊN ngưỡng
const MANG_B = { x: 50, y: 0, w: 20, h: 10 };    // 200 điểm ảnh, lệch  5 — DƯỚI ngưỡng

const KHUNG_TRUOC = makeImage(KHUNG_W, KHUNG_H, [100, 100, 100]);
const KHUNG_SAU = makeImage(KHUNG_W, KHUNG_H, [100, 100, 100], [
  { ...MANG_A, rgb: [140, 100, 100] },
  { ...MANG_B, rgb: [100, 100, 105] },
]);
/** Mặt nạ: chỉ mảng A được tô lục thuần; phần còn lại đen. */
const MAT_NA_A = makeImage(KHUNG_W, KHUNG_H, [0, 0, 0], [{ ...MANG_A, rgb: [0, 255, 0] }]);

test('⚠️ HAI KHUNG GIỐNG HỆT NHAU PHẢI RA 0 — gác chạy-rỗng của chính phép so', () => {
  // Không có bài này thì một bản cài đặt luôn trả 0 (vòng lặp không chạy, `co` sai kiểu…) sẽ được
  // đọc thành "hai bản dựng không đổi gì" — đúng kết luận nguy hiểm nhất mà `sweep-diff` có thể đưa.
  const r = soHaiKhung(KHUNG_TRUOC, KHUNG_TRUOC);
  assert.equal(r.tiLe, 0);
  assert.equal(r.lechTB, 0);
  assert.equal(r.lechTBDoi, 0);
  assert.equal(r.xet, KHUNG_W * KHUNG_H, 'Mẫu số phải là TOÀN khung khi không có mặt nạ.');
});

test('⚠️ `lechTB` VÀ `lechTBDoi` LÀ HAI ĐẠI LƯỢNG KHÁC NHAU — đáp số tính tay ở chú thích trên', () => {
  const r = soHaiKhung(KHUNG_TRUOC, KHUNG_SAU);
  assert.equal(r.xet, 5000);
  assert.ok(Math.abs(r.lechTB - 1) < 1e-9, `lệch TB cả khung phải là 1,00 (được ${r.lechTB}).`);
  assert.ok(Math.abs(r.tiLe - 2) < 1e-9, `2,0% khung vượt ngưỡng mắt (được ${r.tiLe}).`);
  // Chỗ đã đổi trung bình 40 — GẤP 40 LẦN con số cả khung. Trộn hai công thức là trộn hai câu hỏi
  // ("cả bức ảnh đổi bao nhiêu" ≠ "chỗ đã đổi thì đổi mạnh cỡ nào").
  assert.ok(Math.abs(r.lechTBDoi - 40) < 1e-9, `lệch TB chỗ đã đổi phải là 40 (được ${r.lechTBDoi}).`);
});

test('⚠️ MẶT NẠ ĐỔI **MẪU SỐ**, KHÔNG CHỈ ĐỔI TỬ SỐ', () => {
  // Bài học đo mật độ nhà (2026-08-19): mẫu số là vế không ai kiểm, và nó đã sai HAI lần liên tiếp
  // theo hai cách khác nhau. Ở đây cùng một cặp ảnh, chỉ khác vùng xét, mà lệch TB đi từ 1,00 lên
  // 40,00 — nếu mặt nạ chỉ lọc tử số thì con số sẽ đứng yên ở 1,00 và bài này ĐỎ.
  const { co, dem } = coTheoMatNa(MAT_NA_A, 'g');
  assert.equal(dem, MANG_A.w * MANG_A.h, 'Mặt nạ chọn sai số điểm ảnh.');

  const r = soHaiKhung(KHUNG_TRUOC, KHUNG_SAU, co);
  assert.equal(r.xet, 100, 'Mẫu số phải THU LẠI đúng bằng số điểm ảnh mặt nạ bật.');
  assert.ok(Math.abs(r.lechTB - 40) < 1e-9,
    `Trong mặt nạ, lệch TB phải là 40 chứ không phải 1,00 của cả khung (được ${r.lechTB}).`);
  assert.ok(Math.abs(r.tiLe - 100) < 1e-9, 'Mọi điểm ảnh trong mặt nạ đều vượt ngưỡng.');

  // Đối chứng bằng một vòng lặp ĐỘC LẬP viết ngay tại đây — chạy CẢ HAI bên rồi so, không so mỗi
  // bên với một hằng số thứ ba (bài học Phase 8B: so với hằng số chỉ khoá công thức, không khoá
  // sự KHỚP NHAU).
  let tong = 0; let n = 0;
  for (let y = MANG_A.y; y < MANG_A.y + MANG_A.h; y += 1) {
    for (let x = MANG_A.x; x < MANG_A.x + MANG_A.w; x += 1) {
      const o = (y * KHUNG_W + x) * 4;
      const dr = KHUNG_TRUOC.pixels[o] - KHUNG_SAU.pixels[o];
      const dg = KHUNG_TRUOC.pixels[o + 1] - KHUNG_SAU.pixels[o + 1];
      const db = KHUNG_TRUOC.pixels[o + 2] - KHUNG_SAU.pixels[o + 2];
      tong += Math.sqrt(dr * dr + dg * dg + db * db); n += 1;
    }
  }
  assert.equal(n, r.xet);
  assert.ok(Math.abs(tong / n - r.lechTB) < 1e-9, 'Hai đường đo không khớp nhau.');
});

test('⚠️ MẶT NẠ BẬT HẾT PHẢI TRÙNG KHÍT NHÁNH KHÔNG-MẶT-NẠ', () => {
  // Hai nhánh của cùng một vòng lặp: nếu chúng lệch nhau thì một trong hai con số đang được in ra
  // trong báo cáo là số của một phép đo khác. Đây là đối chứng rẻ nhất bắt được lỗi lệch chỉ số.
  const hetBat = new Uint8Array(KHUNG_W * KHUNG_H).fill(1);
  const a = soHaiKhung(KHUNG_TRUOC, KHUNG_SAU, hetBat);
  const b = soHaiKhung(KHUNG_TRUOC, KHUNG_SAU);
  assert.deepEqual(a, b);
});

test('⚠️ `coTheoMatNa`: TRỘI HẲN, KHÔNG PHẢI VƯỢT NGƯỠNG — viền răng cưa không được vào cả hai nhóm', () => {
  // Mặt nạ chỉ tô ba màu thuần một kênh, nhưng viền giữa hai lớp là màu PHA. Một phép kiểm
  // "kênh này ≥ 40" sẽ nhận cùng một điểm ảnh vào CẢ nhóm lục LẪN nhóm đỏ ⇒ tổng các lớp vượt 100%.
  const anh = makeImage(4, 1, [0, 0, 0], [
    { x: 0, y: 0, w: 1, h: 1, rgb: [0, 255, 0] },    // lục thuần            → NHẬN
    { x: 1, y: 0, w: 1, h: 1, rgb: [200, 200, 0] },  // viền pha đỏ↔lục      → LOẠI (không trội)
    { x: 2, y: 0, w: 1, h: 1, rgb: [0, 30, 0] },     // lục trội nhưng quá tối → LOẠI (dưới ngưỡng)
    { x: 3, y: 0, w: 1, h: 1, rgb: [0, 50, 20] },    // lục trội, đủ sáng    → NHẬN
  ]);
  const { co, dem } = coTheoMatNa(anh, 'g');
  assert.equal(dem, 2, 'Chỉ hai điểm ảnh được nhận.');
  assert.deepEqual(Array.from(co), [1, 0, 0, 1]);

  // Và cùng tấm ấy hỏi kênh ĐỎ: điểm viền pha KHÔNG được nhận ở đây nữa — nếu nó vào cả hai nhóm
  // thì tổng các lớp sẽ vượt 100%, đúng thứ phép cộng-bằng-100% của `mask-count.mjs` sinh ra để bắt.
  assert.equal(coTheoMatNa(anh, 'r').dem, 0);
});

test('⚠️ `coTheoMatNa` TỪ CHỐI THẲNG kênh lạ, và `soHaiKhung` TỪ CHỐI THẲNG hai ảnh khác cỡ', () => {
  // Từ chối thẳng chứ không tự chữa: một phép đo tự đoán bừa "chắc ý là kênh lục" sẽ chấm một
  // đại lượng khác rồi in ra một bảng số trông hoàn toàn hợp lý.
  assert.throws(() => coTheoMatNa(MAT_NA_A, 'x'), /kênh phải là r\/g\/b/);
  assert.throws(() => soHaiKhung(KHUNG_TRUOC, makeImage(KHUNG_W, KHUNG_H + 1, [0, 0, 0])),
    /hai ảnh khác cỡ/);
});
