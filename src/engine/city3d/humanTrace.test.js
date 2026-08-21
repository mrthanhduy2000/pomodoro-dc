/**
 * humanTrace.test.js — ĐỐI CHỨNG TIÊM CHO CỔNG (G1).
 *
 * ⚠️ VÌ SAO BỘ TEST NÀY PHẢI TỒN TẠI, VÀ VÌ SAO NÓ PHẢI NẰM TRONG `npm test`.
 *
 * Mốc nền của (G1) là **0 vật ngoài lưới**, và nó bằng 0 **theo cấu tạo** — trước Phase 13 chưa có
 * gì được đặt ra ngoài đó. Một con số 0 không phân biệt được hai chuyện hoàn toàn khác nhau:
 *
 *      (a) "chưa xây gì ngoài kia"          ← sự thật ta tin
 *      (b) "phép đo mù với mọi thứ ngoài kia" ← thứ đã xảy ra ÍT NHẤT BỐN LẦN trong dự án này
 *
 * Bốn lần ấy: phép tia của `water-view.mjs` mù với cây cối · `/envMap,/` xanh oan vì file còn ba
 * vật liệu khác mang `envMap` · `tuongQuanHang(MAT, MAT)` so một bảng với chính nó · bộ lọc "8%
 * điểm ảnh tươi nhất ≈ mái" chấm CỎ suốt ba phase. Trong cả bốn, con số in ra trông hoàn toàn bình
 * thường.
 *
 * ⇒ Cách duy nhất tách (a) khỏi (b) là **TIÊM**: đặt một khối nhân tạo ở một toạ độ ĐÃ BIẾT ngoài
 * lưới, rồi đòi phép đo (1) trả về khác 0 và (2) khớp DIỆN TÍCH DỰ ĐOÁN trong một dung sai được
 * nêu TRƯỚC và suy từ độ mịn lưới lấy mẫu, không phải chọn cho vừa.
 *
 * ⚠️ VÀ ĐÂY PHẢI LÀ MỘT BÀI TEST, KHÔNG PHẢI MỘT `--selftest`. Bài học đã trả giá nhiều lần:
 * "một bài học được ghi ra KHÔNG chặn được gì; chỉ một bài TEST mới chặn được" — và cụ thể hơn,
 * `scripts/cityPreviewSource.test.js` chỉ cứu được dự án vào những lần nó ĐƯỢC CHẠY.
 *
 * ── PHÉP THỬ NGƯỢC ĐÃ CHẠY THẬT (không chép lại từ bài cũ) ──────────────────────────────────
 * Bịt mắt phép đo bằng cách cho `doDauVetNgoaiLuoi` bỏ qua vế vị trí — thay
 *     `const d = distanceOutsideGrid(x, y, gridSize); if (d <= 0) continue;`
 * bằng
 *     `const d = 0; if (d <= 0) continue;`
 * (tức "không có gì ở ngoài lưới cả", đúng hình dạng của cái mù (b)). Nêu TRƯỚC: bài "ĐỐI CHỨNG
 * TIÊM" phải đỏ ở dòng `soVat` = 1. Đã chạy: **đỏ đúng ở đó** (bài 2 và bài 3), 6 bài còn lại xanh.
 *
 * ⚠️ VÀ CHÍNH SỰ IM LẶNG CỦA BÀI 1 LÀ THỨ ĐÁNG ĐỌC NHẤT: bài "mốc nền" **vẫn XANH** khi phép đo bị
 * bịt mắt — vì một phép đo mù và một thế giới trống rỗng cho ra CÙNG một con số 0. Đó là bằng chứng
 * trực tiếp rằng mốc nền tự nó không chứng minh được gì, và đối chứng tiêm không phải thủ tục thừa.
 *
 * Phép phá thứ hai, ở một chiều khác: cho `laDauVetNguoi` trả `true` cho mọi thứ (tức cây cối cũng
 * tính là dấu vết con người — đúng cách rẻ tiền để "quy mô hơn" mà §2 cấm). Nêu trước: bài "CÂY CỐI
 * NGOÀI LƯỚI…" và bài phân loại phải đỏ. Đã chạy: **6/8 bài đỏ**, gồm đúng hai bài ấy. Cả hai lần
 * đều `diff` xác nhận file đã đổi thật, và phép thay thế tự đếm số chỗ khớp rồi đòi đúng 1.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { computeCityLayout } from '../cityLayout.js';
import { BLUEPRINT_CATALOG } from '../constants.js';
import { collectCitySpecs } from './cityParts.js';
import { doDauVetNgoaiLuoi, laDauVetNguoi, KIND_TU_NHIEN } from './humanTrace.js';
import { dienTichHop, daysGiacDay } from './footprint.js';

const GRID = 12;

/** Bố cục thật của một kỷ ở mốc phiên đã trưởng thành. */
function boCuc(era, sessionCount = 80) {
  const built = (BLUEPRINT_CATALOG[era] ?? []).map((bp) => bp.id);
  const levels = Object.fromEntries(built.map((id) => [id, 3]));
  return computeCityLayout({ built, levels, era, stats: { sessionCount, streakLength: 9 } });
}

/**
 * Khối tiêm: MỘT lăng trụ 4 cạnh, tức đáy là hình chữ nhật `w × d` CHÍNH XÁC.
 *
 * ⚠️ Vì sao 4 cạnh cho ra đúng hình chữ nhật: `daysGiacDay` đặt bán trục
 * `rx = (w/2) / cos(π/n)` rồi lấy đỉnh ở góc `π/n + i·2π/n`. Với `n = 4` thì `cos(π/4) = √2/2`
 * nên `rx = (w/2)·√2`, và đỉnh đầu ở 45° cho `x = rx·cos45° = w/2`. Bốn đỉnh rơi đúng
 * `(±w/2, ±d/2)`. Có assert bên dưới ghim điều này, vì cả DIỆN TÍCH DỰ ĐOÁN dựa vào nó.
 */
const W = 2, D = 3;
function khoiTiem() {
  return { parts: [{ shape: 'prism', sides: 4, w: W, d: D, h: 1, x: 0, z: 0 }] };
}

test('mốc nền: KHÔNG có dấu vết con người nào ngoài lưới, ở cả 15 kỷ', () => {
  let tongTrong = 0;
  let soKy = 0;
  for (let era = 1; era <= 15; era += 1) {
    const items = collectCitySpecs({ layout: boCuc(era) });
    const r = doDauVetNgoaiLuoi({ items, gridSize: GRID });
    assert.equal(r.soVat, 0, `kỷ ${era}: mốc nền phải là 0 vật ngoài lưới, đo được ${r.soVat}`);
    assert.equal(r.dienTich, 0, `kỷ ${era}: mốc nền phải là 0 diện tích`);
    tongTrong += r.soVatTong;
    soKy += 1;
  }
  // ⚠️ GÁC CHẠY-RỖNG. Không có hai dòng này thì một `continue` đặt nhầm chỗ, hay một
  // `BLUEPRINT_CATALOG` rỗng, sẽ làm bài test xanh về một thế giới không có gì cả.
  assert.equal(soKy, 15, 'phải duyệt đủ 15 kỷ');
  assert.ok(tongTrong > 400,
    `phải có hàng trăm vật do người làm TRONG lưới để phép đo có gì mà bỏ sót; đếm được ${tongTrong}`);
});

test('ĐỐI CHỨNG TIÊM: khối nhân tạo ngoài lưới PHẢI được nhìn thấy, và đúng diện tích', () => {
  // Ghim tiền đề của diện tích dự đoán TRƯỚC khi dùng nó.
  const poly = daysGiacDay(khoiTiem().parts[0]);
  assert.equal(poly.length, 4);
  for (const [x, z] of poly) {
    assert.ok(Math.abs(Math.abs(x) - W / 2) < 1e-9, `đỉnh phải nằm ở ±w/2, gặp x=${x}`);
    assert.ok(Math.abs(Math.abs(z) - D / 2) < 1e-9, `đỉnh phải nằm ở ±d/2, gặp z=${z}`);
  }

  /**
   * DUNG SAI, NÊU TRƯỚC VÀ SUY RA CHỨ KHÔNG CHỌN.
   * `dienTichHop` tô theo TÂM ô mẫu, nên mỗi cạnh của hình sai lệch nhiều nhất NỬA bước mẫu.
   * Với `mauMoiO` mẫu mỗi ô, bước = 1/mauMoiO, và sai số diện tích bị chặn bởi
   *     chu vi × (nửa bước) = 2(W+D) × 1/(2·mauMoiO) = (W+D)/mauMoiO.
   * Ở đây W+D = 5 và mauMoiO = 64 ⇒ chặn trên 0,0781 trên diện tích thật 6,0 ⇒ **1,30%**.
   * Lấy ngưỡng 2% (rộng hơn chặn trên đúng 1,5 lần, không hơn) — nó vẫn TỪ CHỐI được một phép đo
   * lệch 5%, tức vẫn còn răng.
   */
  const MAU = 64;
  const DIEN_TICH_THAT = W * D;
  const DUNG_SAI = 0.02;

  const layout = boCuc(7);
  const items = collectCitySpecs({ layout });
  const truoc = doDauVetNgoaiLuoi({ items, gridSize: GRID, mauMoiO: MAU });
  assert.equal(truoc.soVat, 0, 'trước khi tiêm phải là 0 — nếu không thì bài này không chứng minh gì');

  // Toạ độ tiêm: 3 ô ra ngoài mép ĐÔNG của lưới. `distanceOutsideGrid` lấy `max` của bốn khoảng
  // cách mép, mép đông ở `gridSize - 0.5 = 11,5`, nên x = 14,5 ⇒ cách mép đúng 3,0 ô.
  const X = GRID - 0.5 + 3, Y = 5;
  const daTiem = [...items, {
    kind: 'hinterland',
    source: { kind: 'thu-nghiem', x: X, y: Y, scale: 1 },
    spec: khoiTiem(),
  }];

  const sau = doDauVetNgoaiLuoi({ items: daTiem, gridSize: GRID, mauMoiO: MAU });

  assert.equal(sau.soVat, 1, 'PHẢI nhìn thấy đúng khối vừa tiêm — 0 nghĩa là phép đo đang MÙ');
  assert.equal(sau.soVatTong, truoc.soVatTong + 1);
  assert.ok(Math.abs(sau.xaNhat - 3) < 1e-9, `vật phải cách mép lưới 3,0 ô, đo được ${sau.xaNhat}`);

  const lech = Math.abs(sau.dienTich - DIEN_TICH_THAT) / DIEN_TICH_THAT;
  assert.ok(lech <= DUNG_SAI,
    `diện tích phải là ${DIEN_TICH_THAT} ± ${DUNG_SAI * 100}%, đo được ${sau.dienTich.toFixed(4)} (lệch ${(lech * 100).toFixed(2)}%)`);
});

test('ĐỐI CHỨNG TIÊM 2: phép đo phải TỈ LỆ THUẬN với thứ được tiêm, không phải chỉ khác 0', () => {
  /**
   * ⚠️ VÌ SAO CẦN BÀI THỨ HAI. Bài trên chỉ chứng minh phép đo THẤY một khối. Một phép đo hỏng theo
   * kiểu "trả về hằng số 6 mỗi khi có vật ngoài lưới" cũng qua được nó. Bài này tiêm hai khối cỡ
   * khác nhau ở hai chỗ KHÔNG chồng nhau rồi đòi diện tích cộng lại — tức phép đo phải phản ứng
   * theo ĐỘ LỚN, không chỉ theo sự tồn tại.
   */
  const MAU = 64;
  const layout = boCuc(3);
  const items = collectCitySpecs({ layout });
  const to = { parts: [{ shape: 'prism', sides: 4, w: 4, d: 4, h: 1, x: 0, z: 0 }] };

  const mot = doDauVetNgoaiLuoi({
    items: [...items, { kind: 'hinterland', source: { kind: 't', x: 15, y: 2, scale: 1 }, spec: khoiTiem() }],
    gridSize: GRID, mauMoiO: MAU,
  });
  const hai = doDauVetNgoaiLuoi({
    items: [...items,
      { kind: 'hinterland', source: { kind: 't', x: 15, y: 2, scale: 1 }, spec: khoiTiem() },
      { kind: 'hinterland', source: { kind: 't', x: 15, y: 9, scale: 1 }, spec: to },
    ],
    gridSize: GRID, mauMoiO: MAU,
  });

  assert.equal(mot.soVat, 1);
  assert.equal(hai.soVat, 2);
  const themVao = hai.dienTich - mot.dienTich;
  const lech = Math.abs(themVao - 16) / 16;
  assert.ok(lech <= 0.02,
    `khối 4×4 phải cộng thêm ~16 ô², đo được ${themVao.toFixed(4)} (lệch ${(lech * 100).toFixed(2)}%)`);
});

test('ĐỐI CHỨNG TIÊM 3: tiêm vào TRONG lưới thì phép đo phải LỜ ĐI', () => {
  // Không có vế này thì "phép đo thấy khối tiêm" có thể chỉ là "phép đo thấy MỌI khối".
  const items = collectCitySpecs({ layout: boCuc(9) });
  const r = doDauVetNgoaiLuoi({
    items: [...items, { kind: 'hinterland', source: { kind: 't', x: 6, y: 6, scale: 1 }, spec: khoiTiem() }],
    gridSize: GRID,
  });
  assert.equal(r.soVat, 0, 'khối đặt giữa lưới KHÔNG được tính vào (G1)');
  assert.equal(r.dienTich, 0);
});

test('CÂY CỐI NGOÀI LƯỚI KHÔNG PHẢI DẤU VẾT CON NGƯỜI — và vùng quê thật sự đang ở ngoài đó', () => {
  /**
   * ⚠️ ĐÂY LÀ RÀNG BUỘC ĐẮT NHẤT CỦA CẢ CỔNG (G1). Vành ngoài lưới đã đầy cây rồi (`outskirts.js`),
   * nên nếu cây được tính thì (G1) đã xanh sẵn trước khi làm gì cả, và cách rẻ nhất để "quy mô hơn"
   * sẽ là nâng mật độ cây — đúng thứ đã làm một lần và Đàm vẫn nói thành phố nhỏ.
   * Bài này khoá cả hai vế: cây ngoài lưới KHÔNG được đếm, VÀ chúng thật sự tồn tại ngoài đó
   * (không có vế thứ hai thì "không đếm cây" có thể xanh chỉ vì chẳng có cây nào).
   */
  const items = collectCitySpecs({ layout: boCuc(12) });
  const ngoai = items.filter((it) => it.kind === 'outskirt');
  assert.ok(ngoai.length > 100, `vùng quê phải có hàng trăm vật; đếm được ${ngoai.length}`);
  for (const it of ngoai) {
    assert.equal(laDauVetNguoi(it), false,
      `vật vùng quê loại "${it.source?.kind}" bị tính nhầm thành dấu vết con người`);
  }
  // Và chúng đúng là NGOÀI lưới — nếu không thì bài trên đang canh một tập rỗng về mặt vị trí.
  const xa = ngoai.filter((it) => Math.abs(it.source.x - 5.5) > 6.5 || Math.abs(it.source.y - 5.5) > 6.5);
  assert.ok(xa.length > 100, `phải có hàng trăm vật vùng quê nằm NGOÀI lưới; đếm được ${xa.length}`);
});

test('phân loại tự nhiên ⇄ nhân tạo: từng loại một, không hỏi tổng', () => {
  // ⚠️ Hỏi tổng thì một loại phân sai được một loại khác bù cho. Bài học `TECH_DEBT #22`.
  for (const kind of KIND_TU_NHIEN) {
    assert.equal(laDauVetNguoi({ kind: 'prop', source: { kind } }), false, `"${kind}" phải là tự nhiên`);
    assert.equal(laDauVetNguoi({ kind: 'outskirt', source: { kind } }), false, `vùng quê "${kind}" phải là tự nhiên`);
  }
  for (const kind of ['yard', 'garden', 'drying', 'pen', 'stack', 'well', 'plaza', 'field', 'lamp']) {
    assert.equal(laDauVetNguoi({ kind: 'prop', source: { kind } }), true, `"${kind}" phải là dấu vết con người`);
  }
  for (const kind of ['building', 'scaffold', 'dwelling', 'hinterland']) {
    assert.equal(laDauVetNguoi({ kind, source: {} }), true, `"${kind}" phải là dấu vết con người`);
  }
  assert.equal(laDauVetNguoi(null), false);
  assert.equal(laDauVetNguoi({}), false);
});

test('diện tích HỢP, không phải tổng — hai khối chồng nhau chỉ tính một lần', () => {
  // ⚠️ Không có bài này thì một vùng phụ cận nhiều lớp (ruộng + bờ + mương chồng lên nhau) sẽ báo
  // diện tích lớn hơn cả tấm đất, đúng lỗi đã cho ra "109,9% ở kỷ 6" ở `plan-coverage.mjs`.
  const o = [[0, 0], [2, 0], [2, 2], [0, 2]];
  assert.ok(Math.abs(dienTichHop([o], { mauMoiO: 64 }) - 4) / 4 <= 0.02);
  assert.ok(Math.abs(dienTichHop([o, o], { mauMoiO: 64 }) - 4) / 4 <= 0.02, 'chồng khít ⇒ vẫn 4');
  const lech = [[1, 1], [3, 1], [3, 3], [1, 3]];
  // Hợp của hai hình 2×2 lệch nhau (1,1) = 8 − 1 (phần giao 1×1) = 7.
  assert.ok(Math.abs(dienTichHop([o, lech], { mauMoiO: 64 }) - 7) / 7 <= 0.02);
});

test('độ mịn lưới lấy mẫu sai thì TỪ CHỐI THẲNG, không tự chữa', () => {
  const o = [[0, 0], [1, 0], [1, 1], [0, 1]];
  for (const xau of [0, -1, 1.5, NaN, '16']) {
    assert.throws(() => dienTichHop([o], { mauMoiO: xau }), /mauMoiO/,
      `mauMoiO = ${String(xau)} phải bị từ chối`);
  }
});
