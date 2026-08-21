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
 * Ba phép phá, chạy trong `git worktree` riêng ở `b11a3d6`, mỗi phép tự đếm số chỗ khớp và đòi
 * đúng 1, có `grep` xác nhận dòng chèn vào đúng hình dạng, `git diff --stat` xác nhận file đã đổi.
 *
 * (A) BỊT MẮT — `const d = distanceOutsideGrid(...)` → `const d = 0`. Nêu trước: bài 2 đỏ ở VẾ A,
 *     bài 3 đỏ ở `mot.soVat`. Đã chạy: **4/8 đỏ**, gồm đúng hai chỗ ấy (dòng 215 và 290).
 * (B) ĐẨY VÙNG PHỤ CẬN RA XA HƠN CHỖ TIÊM — `HINTERLAND_REACH` 8 → 12. Nêu trước: precondition
 *     đỏ ở CẢ bài 2 và bài 3. Đã chạy: **đúng 2 bài ấy**, in ra "với tới 12.450 ô, chạm vào chỗ
 *     tiêm (mép gần ở 10). Hãy TĂNG XA_TIEM, đừng nới dung sai." Đây là phép phá quan trọng nhất
 *     của bộ này: nó chứng minh bài test **không thể chết trong im lặng** ở phase sau.
 * (C) MÙ VỚI VÙNG GẦN — `if (d <= 0)` → `if (d <= 0 || d < 5)`. Nêu trước: CHỈ bài 2 đỏ, ở VẾ A;
 *     bài 3 phải XANH vì nó tiêm ở 12 ô. Đã chạy: **đúng như vậy**. Đó là bằng chứng VẾ A bắt được
 *     một thứ mà không assert nào khác trong file bắt được — nếu bài 3 cũng đỏ thì VẾ A đã là bản
 *     sao thừa và phải xoá đi.
 *
 * Phép phá thứ tư, ở một chiều khác: cho `laDauVetNguoi` trả `true` cho mọi thứ (tức cây cối cũng
 * tính là dấu vết con người — đúng cách rẻ tiền để "quy mô hơn" mà §2 cấm). Nêu trước: bài "CÂY CỐI
 * NGOÀI LƯỚI…" và bài phân loại phải đỏ. Đã chạy: **6/8 bài đỏ**, gồm đúng hai bài ấy.
 *
 * ⚠️ ĐÍNH CHÍNH MỘT CÂU TRONG CHÍNH KHỐI CHÚ THÍCH NÀY — và nó là bài học đáng giữ nhất ở đây.
 * Bản trước viết: *"chính sự IM LẶNG của bài 1 là thứ đáng đọc nhất — bài 'mốc nền' vẫn XANH khi
 * phép đo bị bịt mắt, vì một phép đo mù và một thế giới trống rỗng cho ra CÙNG một con số 0."*
 * Câu ấy ĐÚNG vào ngày nó được viết và **hết đúng ngay khi vùng phụ cận được dựng**: nay bịt mắt
 * thì bài 1 ĐỎ (phép phá A ở trên). Cái cổng (G1) đi từ **không có răng** sang **có răng** mà
 * không ai sửa một dòng nào của nó — thứ đổi là THẾ GIỚI nó đang đo.
 * ⇒ Hai hệ quả: (1) một câu giải thích về hành vi của bài test cũng già đi y như một con số, nên
 * nó phải được CHẠY LẠI chứ không chép sang phase sau (*"sửa đúng không chứng minh hiểu đúng, và
 * lời giải thích mới là thứ phiên sau kế thừa rồi dựa vào"*); (2) đối chứng tiêm là thứ **duy
 * nhất** canh được (G1) trong quãng thời gian thế giới còn trống — tức đúng quãng ta cần nó nhất,
 * và đúng quãng nó trông thừa nhất.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { computeCityLayout } from '../cityLayout.js';
import { BLUEPRINT_CATALOG } from '../constants.js';
import { collectCitySpecs } from './cityParts.js';
import { doDauVetNgoaiLuoi, laDauVetNguoi, KIND_TU_NHIEN } from './humanTrace.js';
import { dienTichHop, daysGiacDay, daysGiacDayDaDat } from './footprint.js';
import { distanceOutsideGrid } from './setting.js';

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

/**
 * MỐC NỀN ĐÃ ĐÔNG LẠNH — đo ngày 2026-08-20, TRƯỚC khi có vùng phụ cận.
 *
 * ⚠️ Bản trước của bài dưới đây `assert.equal(r.soVat, 0)` ở cả 15 kỷ, và câu ấy ĐÚNG vào lúc nó
 * được viết. Nó hết đúng ngay khi phase này làm xong đúng việc nó sinh ra để làm — tức nó là một
 * bài test khoá một **MỨC** trong khi thứ nó canh là một **QUAN HỆ** (*"dấu vết người ngoài lưới
 * phải NHIỀU HƠN trước"*). Đây đúng bẫy Phase 7D, và cách chữa cũng đúng khuôn ấy: giữ con số cũ
 * lại làm mốc, rồi hỏi HIỆU SỐ.
 *
 * Sau khi sửa, bài này không thể già đi lần nữa: nó đúng dù phase sau thêm bao nhiêu thứ ngoài kia.
 */
const MOC_NEN_G1_SO_VAT = 0;

test('CỔNG (G1): mọi kỷ đều phải có dấu vết con người NGOÀI lưới — mốc nền là 0', () => {
  let tongTrong = 0, tongNgoai = 0, soKy = 0;
  const thua = [];
  for (let era = 1; era <= 15; era += 1) {
    const items = collectCitySpecs({ layout: boCuc(era) });
    const r = doDauVetNgoaiLuoi({ items, gridSize: GRID });
    assert.ok(r.soVat > MOC_NEN_G1_SO_VAT,
      `kỷ ${era}: chỉ ${r.soVat} vật do người làm ngoài lưới. Mốc nền là ${MOC_NEN_G1_SO_VAT}, và `
      + 'cổng (G1) đòi MỌI kỷ phải vượt nó — một kỷ đứng yên nghĩa là bảng vùng phụ cận của kỷ ấy '
      + 'khai ra thứ mà tầng hình không dựng nổi, đúng bốn lỗi im lặng đã bắt được ở phiên trước.');
    assert.ok(r.dienTich > 0, `kỷ ${era}: có vật ngoài lưới nhưng diện tích bằng 0 — vật rỗng?`);
    assert.ok(r.xaNhat > 1, `kỷ ${era}: vật xa nhất chỉ cách mép ${r.xaNhat.toFixed(2)} ô`);
    tongTrong += r.soVatTong; tongNgoai += r.soVat; soKy += 1;
    thua.push(r.soVat);
  }
  // ⚠️ GÁC CHẠY-RỖNG. Không có hai dòng này thì một `continue` đặt nhầm chỗ, hay một
  // `BLUEPRINT_CATALOG` rỗng, sẽ làm bài test xanh về một thế giới không có gì cả.
  assert.equal(soKy, 15, 'phải duyệt đủ 15 kỷ');
  assert.ok(tongTrong > 400,
    `phải có hàng trăm vật do người làm TRONG lưới để phép đo có gì mà bỏ sót; đếm được ${tongTrong}`);

  /**
   * ⚠️ VÀ MỘT VẾ NỮA, VÌ "MỌI KỶ ĐỀU VƯỢT 0" LÀ MỘT CÁI CỔNG RẤT RỘNG: 15 kỷ **không được giống
   * nhau**. Kỷ 1 (thời đồ đá, không ruộng không tường) và kỷ 15 (đô thị-quốc gia hiện đại, không
   * ruộng không tường) phải THƯA hẳn so với các kỷ nông nghiệp ở giữa. Nếu bảng làm cả 15 kỷ trông
   * như nhau thì **bảng sai, không phải cổng sai** — đó là chỉ thị chữ một, và không có vế này thì
   * cách rẻ nhất để (G1) xanh là rắc ruộng đều khắp 15 kỷ, tức mua điểm quy mô bằng cách nói dối
   * lịch sử.
   */
  const nhoNhat = Math.min(...thua), lonNhat = Math.max(...thua);
  assert.ok(lonNhat >= nhoNhat * 3,
    `kỷ thưa nhất ${nhoNhat} vật, kỷ dày nhất ${lonNhat} — chênh chưa tới 3 lần. Bảng vùng phụ cận `
    + 'đang làm 15 kỷ trông như nhau.');
  assert.ok(tongNgoai > 1000, `tổng 15 kỷ chỉ ${tongNgoai} vật ngoài lưới`);
});

/**
 * MÉP XA NHẤT CỦA HÌNH CHIẾU — đo tại chỗ, KHÔNG viết cứng.
 *
 * ⚠️ Vì sao phải có hàm này. Chỗ tiêm phải nằm ở vùng KHÔNG có sẵn gì, vì `dienTichHop` lấy **HỢP**
 * — chồng lấn thì "diện tích dự đoán" không còn là diện tích của khối tiêm nữa, và bài test sẽ đỏ
 * về một chuyện chẳng liên quan tới thứ nó canh. Đây KHÔNG phải nới ngưỡng cho dễ: vế "thấy được
 * giữa đám đông" vẫn được kiểm riêng, ở đúng chỗ đông đúc (xem vế A bên dưới).
 *
 * Và nó phải là một phép ĐO chứ không phải một hằng số, vì đúng cái bẫy vừa cắn: bản trước tiêm ở
 * 3,0 ô — con số ấy đúng khi ngoài lưới còn trống, và hết đúng ngay khi vùng phụ cận được dựng.
 * Một hằng số chép tay ở đây sẽ chết lần nữa vào phase sau, trong im lặng nếu tôi chỉ nới dung sai.
 */
function mepHinhChieuXaNhat(items, gridSize) {
  let xa = 0;
  for (const it of items) {
    if (!laDauVetNguoi(it)) continue;
    const x = it.source?.x, y = it.source?.y;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (distanceOutsideGrid(x, y, gridSize) <= 0) continue;
    const sc = Number.isFinite(it.source?.scale) ? it.source.scale : 1;
    for (const poly of daysGiacDayDaDat(it.spec, {
      cx: x, cz: y, scale: sc, ry: it.source?.ry ?? 0,
    })) {
      for (const [px, pz] of poly) {
        const d = distanceOutsideGrid(px, pz, gridSize);
        if (d > xa) xa = d;
      }
    }
  }
  return xa;
}

/**
 * KHOẢNG CÁCH TIÊM, tính từ mép lưới tới TÂM khối tiêm.
 *
 * Đo ngày 2026-08-20 trên cả 15 kỷ: mép hình chiếu xa nhất của thế giới thật là **8,777 ô** (tâm xa
 * nhất chỉ 8,000 — con số tâm NÓI THIẾU, và tin vào nó chính là cái đã làm bài này đỏ). Khối tiêm
 * to nhất rộng 4 ô ⇒ nửa bề rộng 2 ⇒ mép gần của nó ở `12 − 2 = 10,0`, dư **1,22 ô** so với 8,777.
 * Không chọn cho vừa: có `assert` bên dưới ĐO lại con số ấy mỗi lần chạy và đỏ nếu biên bị ăn hết.
 */
const XA_TIEM = 12;
const NUA_RONG_LON_NHAT = 2;

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
   * lệch 5%, tức vẫn còn răng. Đo thật ra **0,000%** vì ở toạ độ này mép hình rơi đúng lên đường
   * lưới mẫu; đó là may, không phải thứ được khoá — giữ 2%, không siết về 0 (siết là khoá một phép
   * làm tròn).
   */
  const MAU = 64;
  const DIEN_TICH_THAT = W * D;
  const DUNG_SAI = 0.02;

  const layout = boCuc(7);
  const items = collectCitySpecs({ layout });
  const truoc = doDauVetNgoaiLuoi({ items, gridSize: GRID, mauMoiO: MAU });
  // ⚠️ HỎI HIỆU SỐ, KHÔNG HỎI MỨC. Bản đầu viết `assert.equal(truoc.soVat, 0)` — đúng vào ngày nó
  // được viết (mốc nền là 0), và hết đúng ngay khi vùng phụ cận được dựng. Hiệu số thì đúng ở cả
  // hai thế giới, nên bài này không già đi lần nữa.
  assert.ok(truoc.soVat >= 0, 'phép đo trước khi tiêm phải trả về một con số hợp lệ');

  /**
   * ── VẾ A — THẤY ĐƯỢC GIỮA ĐÁM ĐÔNG ────────────────────────────────────────────────────────
   * Tiêm vào đúng chỗ ĐÔNG ĐÚC (3,0 ô ngoài mép, giữa vùng phụ cận thật) và đòi phép đo vẫn đếm
   * thêm đúng một vật. Đây là vế chứng minh khối tiêm không bị "nuốt" vào đám đã có — và nó phải
   * được hỏi Ở CHỖ ĐÔNG, chứ không phải ở chỗ trống, nếu không nó chẳng chứng minh gì.
   * Vế này KHÔNG hỏi diện tích: ở chỗ đông thì hợp của hai hình chồng nhau nhỏ hơn tổng, và đó là
   * `dienTichHop` chạy ĐÚNG chứ không phải sai.
   */
  const trongDamDong = doDauVetNgoaiLuoi({
    items: [...items, {
      kind: 'hinterland',
      source: { kind: 'thu-nghiem', x: GRID - 0.5 + 3, y: 5, scale: 1 },
      spec: khoiTiem(),
    }],
    gridSize: GRID, mauMoiO: MAU,
  });
  assert.equal(trongDamDong.soVat, truoc.soVat + 1,
    'tiêm vào giữa vùng phụ cận mà số vật không tăng ⇒ phép đo đang NUỐT khối mới vào đám đã có');

  /**
   * ── VẾ B — ĐÚNG DIỆN TÍCH, ĐO Ở CHỖ HÌNH KHÔNG CHỒNG NHAU ──────────────────────────────────
   * Precondition đo tại chỗ: mép gần của khối tiêm phải nằm NGOÀI mép xa nhất của thế giới thật.
   * Đỏ ở đây nghĩa là phase sau đã đẩy vùng phụ cận ra xa hơn ⇒ **tăng `XA_TIEM`**, tuyệt đối
   * không nới `DUNG_SAI` (nới dung sai là bỏ răng của chính vế đang canh diện tích).
   */
  const mepThat = mepHinhChieuXaNhat(items, GRID);
  assert.ok(mepThat < XA_TIEM - NUA_RONG_LON_NHAT,
    `vùng phụ cận nay với tới ${mepThat.toFixed(3)} ô, chạm vào chỗ tiêm (mép gần ở `
    + `${XA_TIEM - NUA_RONG_LON_NHAT}). Hãy TĂNG XA_TIEM, đừng nới dung sai diện tích.`);

  const X = GRID - 0.5 + XA_TIEM, Y = 5;
  const daTiem = [...items, {
    kind: 'hinterland',
    source: { kind: 'thu-nghiem', x: X, y: Y, scale: 1 },
    spec: khoiTiem(),
  }];

  const sau = doDauVetNgoaiLuoi({ items: daTiem, gridSize: GRID, mauMoiO: MAU });

  assert.equal(sau.soVat, truoc.soVat + 1,
    'PHẢI nhìn thấy đúng MỘT khối mới — không tăng nghĩa là phép đo đang MÙ với chỗ vừa tiêm');
  assert.equal(sau.soVatTong, truoc.soVatTong + 1);

  // Khối tiêm nằm xa hơn mọi thứ thật ⇒ nó phải trở thành vật xa nhất. Hỏi cả hai vế (trước < sau)
  // để đây là một QUAN HỆ chứ không phải một mức — mức thì già đi, quan hệ thì không.
  assert.ok(truoc.xaNhat < XA_TIEM,
    `mốc nền đã có vật xa ${XA_TIEM} ô rồi (${truoc.xaNhat}) — tăng XA_TIEM`);
  assert.ok(Math.abs(sau.xaNhat - XA_TIEM) < 1e-9,
    `vật phải cách mép lưới ${XA_TIEM},0 ô, đo được ${sau.xaNhat}`);

  const themVao = sau.dienTich - truoc.dienTich;
  const lech = Math.abs(themVao - DIEN_TICH_THAT) / DIEN_TICH_THAT;
  assert.ok(lech <= DUNG_SAI,
    `khối tiêm phải cộng thêm ${DIEN_TICH_THAT} ± ${DUNG_SAI * 100}% ô², đo được `
    + `${themVao.toFixed(4)} (lệch ${(lech * 100).toFixed(2)}%)`);
});

test('ĐỐI CHỨNG TIÊM 2: phép đo phải TỈ LỆ THUẬN với thứ được tiêm, không phải chỉ khác 0', () => {
  /**
   * ⚠️ VÌ SAO CẦN BÀI THỨ HAI. Bài trên chỉ chứng minh phép đo THẤY một khối. Một phép đo hỏng theo
   * kiểu "trả về hằng số 6 mỗi khi có vật ngoài lưới" cũng qua được nó. Bài này tiêm hai khối cỡ
   * khác nhau ở hai chỗ KHÔNG chồng nhau rồi đòi diện tích cộng lại — tức phép đo phải phản ứng
   * theo ĐỘ LỚN, không chỉ theo sự tồn tại.
   *
   * Cả hai khối đặt ở `XA_TIEM` vì cùng lý do như vế B ở trên: `dienTichHop` lấy HỢP, nên muốn
   * "cộng thêm 16" có nghĩa thì chỗ ấy phải trống. Hai khối cách nhau 7 ô theo trục z, nửa-sâu lần
   * lượt 1,5 và 2,0 ⇒ khe hở 3,5 ô, không đụng nhau.
   */
  const MAU = 64;
  const layout = boCuc(3);
  const items = collectCitySpecs({ layout });
  const to = { parts: [{ shape: 'prism', sides: 4, w: 4, d: 4, h: 1, x: 0, z: 0 }] };

  const mepThat = mepHinhChieuXaNhat(items, GRID);
  assert.ok(mepThat < XA_TIEM - NUA_RONG_LON_NHAT,
    `vùng phụ cận nay với tới ${mepThat.toFixed(3)} ô — tăng XA_TIEM, đừng nới dung sai.`);

  const X = GRID - 0.5 + XA_TIEM;
  const mot = doDauVetNgoaiLuoi({
    items: [...items, { kind: 'hinterland', source: { kind: 't', x: X, y: 2, scale: 1 }, spec: khoiTiem() }],
    gridSize: GRID, mauMoiO: MAU,
  });
  const hai = doDauVetNgoaiLuoi({
    items: [...items,
      { kind: 'hinterland', source: { kind: 't', x: X, y: 2, scale: 1 }, spec: khoiTiem() },
      { kind: 'hinterland', source: { kind: 't', x: X, y: 9, scale: 1 }, spec: to },
    ],
    gridSize: GRID, mauMoiO: MAU,
  });

  const nen = doDauVetNgoaiLuoi({ items, gridSize: GRID, mauMoiO: MAU });
  assert.equal(mot.soVat, nen.soVat + 1);
  assert.equal(hai.soVat, nen.soVat + 2);
  const themVao = hai.dienTich - mot.dienTich;
  const lech = Math.abs(themVao - 16) / 16;
  assert.ok(lech <= 0.02,
    `khối 4×4 phải cộng thêm ~16 ô², đo được ${themVao.toFixed(4)} (lệch ${(lech * 100).toFixed(2)}%)`);
});

test('ĐỐI CHỨNG TIÊM 3: tiêm vào TRONG lưới thì phép đo phải LỜ ĐI', () => {
  // Không có vế này thì "phép đo thấy khối tiêm" có thể chỉ là "phép đo thấy MỌI khối".
  const items = collectCitySpecs({ layout: boCuc(9) });
  const truoc = doDauVetNgoaiLuoi({ items, gridSize: GRID });
  const r = doDauVetNgoaiLuoi({
    items: [...items, { kind: 'hinterland', source: { kind: 't', x: 6, y: 6, scale: 1 }, spec: khoiTiem() }],
    gridSize: GRID,
  });
  assert.equal(r.soVat, truoc.soVat, 'khối đặt giữa lưới KHÔNG được tính vào (G1)');
  assert.equal(r.dienTich, truoc.dienTich, 'khối giữa lưới không được cộng một mét vuông nào');
  // Gác chạy-rỗng: nếu `truoc` tình cờ bằng 0 thì hai dòng trên vẫn xanh mà chẳng chứng minh gì về
  // việc phép đo BIẾT phân biệt trong/ngoài — nó chỉ chứng minh phép đo không thấy gì cả.
  assert.ok(truoc.soVat > 0,
    'mốc nền của kỷ 9 phải khác 0, nếu không bài này không phân biệt được "lờ đi khối giữa lưới" '
    + 'với "mù hoàn toàn"');
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
