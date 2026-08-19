/**
 * outskirts.test.js — khoá VÙNG QUÊ.
 *
 * ⚠️ MỖI BÀI DƯỚI ĐÂY ĐỀU ĐÃ ĐƯỢC THỬ-CHO-ĐỎ, và chỗ mong đợi đỏ được ghi ngay tại bài — theo luật
 * *"một phép thử ngược phải nêu TRƯỚC nó mong đợi đỏ ở đâu"* (Phase 8A).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  deriveOutskirts, distanceOutsideGrid,
  OUTSKIRT_REACH, OUTSKIRT_EDGE_DENSITY, OUTSKIRT_FAR_DENSITY,
} from './outskirts.js';
import { getFloraStyle } from './floraStyle.js';

const KY = Array.from({ length: 15 }, (_, i) => i + 1);
const GRID = 12;

/**
 * MẬT ĐỘ THEO KHOẢNG CÁCH — số vật trên MỘT đơn vị diện tích, chia làm hai vành.
 *
 * ⚠️ PHẢI CHIA CHO DIỆN TÍCH, KHÔNG ĐƯỢC ĐẾM THÔ. Vành ngoài rộng hơn vành trong rất nhiều (chu vi
 * lớn hơn), nên đếm thô thì một cách rải ĐỀU TUYỆT ĐỐI vẫn ra "ngoài nhiều hơn trong" và bài test
 * sẽ khen ngợi đúng thứ nó sinh ra để cấm. Đây là bài học mẫu số của `TECH_DEBT #44`.
 */
function matDoHaiVanh(items, gridSize = GRID) {
  const nua = OUTSKIRT_REACH / 2;
  let trong = 0;
  let ngoai = 0;
  for (const it of items) {
    const d = distanceOutsideGrid(it.x, it.y, gridSize);
    if (d <= nua) trong += 1; else ngoai += 1;
  }
  // Diện tích hình vuông viền (Chebyshev): cạnh ngoài² − cạnh trong².
  const canh = (r) => (gridSize + 2 * r) ** 2;
  const dtTrong = canh(nua) - canh(0);
  const dtNgoai = canh(OUTSKIRT_REACH) - canh(nua);
  return { trong: trong / dtTrong, ngoai: ngoai / dtNgoai };
}

test('BẤT BIẾN: vùng quê KHÔNG phụ thuộc việc Đàm đã xây gì', () => {
  // THỬ-CHO-ĐỎ: cho `deriveOutskirts` nhận thêm một tham số bố cục rồi dùng nó (ví dụ nhân mật độ
  // với `built.length`) → bài này đỏ ngay ở kỷ đầu tiên, kèm số vật của hai lần gọi.
  //
  // ⚠️ Gọi KÈM DỮ LIỆU RÁC là cách rẻ nhất khoá một bất biến dạng "thứ này không được phụ thuộc
  // thứ kia" — đúng cách `terrain.js` đã khoá bất biến của nó ở Phase 7B. Không có nó thì người sau
  // chỉ cần thêm một tham số TUỲ CHỌN là bất biến chết mà mọi bài test khác vẫn xanh.
  for (const era of KY) {
    const sach = deriveOutskirts({ era, gridSize: GRID });
    const rac = deriveOutskirts({
      era, gridSize: GRID,
      built: ['a', 'b', 'c'], levels: { a: 3 }, sessionCount: 999,
      buildings: [1, 2, 3], layout: { props: [] }, stats: { streakLength: 40 },
    });
    assert.deepEqual(rac, sach, `kỷ ${era}: vùng quê đổi khi thêm dữ liệu tiến độ`);
  }
});

test('TẤT ĐỊNH: cùng kỷ → mãi mãi cùng một vùng quê', () => {
  // THỬ-CHO-ĐỎ: thay `hashId` bằng `Math.random()` ở một chỗ bất kỳ trong `deriveOutskirts`.
  for (const era of [1, 7, 15]) {
    assert.deepEqual(deriveOutskirts({ era }), deriveOutskirts({ era }), `kỷ ${era} không tất định`);
  }
});

test('KHÔNG MỘT VẬT NÀO ĐỨNG TRONG LƯỚI 12×12', () => {
  // ⚠️ ĐÂY LÀ VẾ GIỮ ADR-007. Lưới 12×12 là địa phận của `computeCityLayout`; một cái cây mọc vào
  // đó là đứng đè lên chỗ của một căn nhà tương lai, và ngày Đàm xây căn ấy thì hai khối lồng nhau.
  // THỬ-CHO-ĐỎ: bỏ dòng `if (d <= 0) continue;` → đỏ ở mọi kỷ.
  for (const era of KY) {
    const items = deriveOutskirts({ era, gridSize: GRID });
    assert.ok(items.length > 0, `kỷ ${era} không sinh vật nào — bài này đang kiểm một danh sách rỗng`);
    for (const it of items) {
      assert.ok(distanceOutsideGrid(it.x, it.y, GRID) > 0,
        `kỷ ${era}: có vật ở ô (${it.x.toFixed(2)}, ${it.y.toFixed(2)}) — nằm TRONG lưới thành phố`);
    }
  }
});

test('MẬT ĐỘ GIẢM DẦN RA XA — sát phố thì rậm, ngoài xa thì thưa', () => {
  // ⚠️ ĐÂY LÀ CẢ MỤC ĐÍCH CỦA FILE. Rải đều thì vùng quê chỉ là một cái khay THỨ HAI bọc ngoài cái
  // khay cũ — mắt vẫn vạch ra được một đường, chỉ là đường ấy lùi ra xa hơn.
  // THỬ-CHO-ĐỎ: đặt `OUTSKIRT_FAR_DENSITY = OUTSKIRT_EDGE_DENSITY` → đỏ ở mọi kỷ, tỉ số về ~1.
  assert.ok(OUTSKIRT_EDGE_DENSITY > OUTSKIRT_FAR_DENSITY, 'hai đầu mật độ phải khác nhau');
  const tiSo = [];
  for (const era of KY) {
    const { trong, ngoai } = matDoHaiVanh(deriveOutskirts({ era, gridSize: GRID }));
    assert.ok(ngoai > 0, `kỷ ${era}: vành ngoài rỗng trơn — thành một cái vòng, không phải một vùng quê`);
    const r = trong / ngoai;
    tiSo.push(r);
    assert.ok(r >= 2, `kỷ ${era}: vành trong chỉ dày gấp ${r.toFixed(2)}× vành ngoài — gần như rải đều`);
  }
  assert.equal(tiSo.length, 15, 'phải chấm đủ 15 kỷ');
});

test('ĐỐI CHỨNG: phép đo "giảm dần" phải TỪ CHỐI một cách rải ĐỀU', () => {
  // ⚠️ Không có bài này thì `matDoHaiVanh` có thể đang đo một đại lượng luôn-luôn-lớn-hơn-2 vì một
  // lý do hình học nào đó, và bài trên sẽ khen ngợi cả những cách rải mà nó sinh ra để cấm.
  const deu = [];
  for (let u = -0.5 - OUTSKIRT_REACH; u <= GRID - 0.5 + OUTSKIRT_REACH; u += 0.5) {
    for (let v = -0.5 - OUTSKIRT_REACH; v <= GRID - 0.5 + OUTSKIRT_REACH; v += 0.5) {
      if (distanceOutsideGrid(u, v, GRID) > 0) deu.push({ x: u, y: v });
    }
  }
  const { trong, ngoai } = matDoHaiVanh(deu);
  assert.ok(trong / ngoai < 1.2,
    `rải ĐỀU mà phép đo vẫn ra ${(trong / ngoai).toFixed(2)}× — phép đo đang thiên vị vành trong`);
});

/**
 * TƯƠNG QUAN HẠNG (Spearman) — và nó BẮT BUỘC phải dùng HẠNG TRUNG BÌNH cho các giá trị bằng nhau.
 *
 * ⚠️ ĐỪNG PHÁ HOÀ BẰNG THỨ TỰ SẮP XẾP. Bảng thực vật chỉ có **11 giá trị `density` phân biệt trên
 * 15 kỷ** (1.3 · 1.1 · 1 mỗi thứ xuất hiện hai lần), nên có bốn chỗ hoà. Phá hoà tuỳ tiện thì hai
 * kỷ CÙNG mật độ bị ép thành hai hạng khác nhau, và **trần của phép đo tụt xuống dưới 1** — tức bài
 * test đang trừ điểm một sự khớp HOÀN HẢO, rồi người sau sẽ hạ ngưỡng cho vừa mà tưởng là mã tệ.
 * Chính bản đầu của bài này đã dính: nó báo 0,879 và suýt được "sửa" bằng cách hạ ngưỡng.
 *
 * Viết dạng hệ số Pearson-trên-hạng (không dùng công thức rút gọn `1 − 6Σd²/n(n²−1)`) vì công thức
 * rút gọn CHỈ đúng khi không có hoà — dùng nó ở đây là một luật hai công thức.
 */
function hangTrungBinh(gt) {
  const idx = gt.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]);
  const hang = new Array(gt.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j += 1;
    const tb = (i + j) / 2;                       // cả cụm hoà nhận CÙNG một hạng trung bình
    for (let k = i; k <= j; k += 1) hang[idx[k][1]] = tb;
    i = j + 1;
  }
  return hang;
}

function tuongQuanHang(a, b) {
  const ra = hangTrungBinh(a);
  const rb = hangTrungBinh(b);
  const tb = (v) => v.reduce((s, x) => s + x, 0) / v.length;
  const ma = tb(ra);
  const mb = tb(rb);
  let sab = 0;
  let sa = 0;
  let sb = 0;
  for (let i = 0; i < a.length; i += 1) {
    const da = ra[i] - ma;
    const db = rb[i] - mb;
    sab += da * db; sa += da * da; sb += db * db;
  }
  return sab / Math.sqrt(sa * sb);
}

/**
 * NGƯỠNG 0,75 — HIỆU CHUẨN BẰNG BA SỐ ĐO THẬT, không phải chọn tay.
 *
 *   TRẦN 1,0000 — `density` so với chính nó (khớp hoàn hảo còn đo được là 1).
 *   THẬT 0,9031 — mã hiện tại (số vật: 458·276·250·409·451·416·443·355·386·238·398·373·435·539·239).
 *   SÀN  0,4259 — ĐO ĐƯỢC bằng cách tạm bỏ `* style.density` khỏi `outskirts.js` rồi chạy lại.
 *
 * Sàn KHÔNG phải 0: cùng một cách rải trên cùng một hình lưới thì số vật vẫn hơi bám theo nhau, nên
 * "bỏ hẳn bảng thực vật" vẫn ra 0,43 chứ không ra 0. Đó chính là lý do phải ĐO sàn thay vì đoán —
 * một ngưỡng 0,3 nghe có vẻ an toàn sẽ cho bộ số hỏng đi lọt.
 */
const NGUONG_TUONG_QUAN = 0.75;

test('15 KỶ RA 15 VÙNG QUÊ KHÁC NHAU, và khác nhau ĐÚNG THEO BẢNG THỰC VẬT', () => {
  // ⚠️ Buộc vào `floraStyle.js` chứ không để trôi tự do: nếu vùng quê có bảng mật độ RIÊNG thì hai
  // bảng sẽ lệch nhau, và triệu chứng là "cây trong phố rậm mà cây ngoài phố thưa" ở đúng vài kỷ.
  //
  // THỬ-CHO-ĐỎ ĐÃ CHẠY THẬT (chỗ mong đợi đỏ nêu trước): sửa `outskirts.js` thành
  // `const p = nen * lum;` (bỏ `* style.density`) ⇒ mong đợi đỏ ở đúng dòng assert cuối cùng của
  // bài này. Chạy thật: tương quan tụt 0,903 → 0,426, đỏ đúng chỗ đã nêu.
  const diem = KY.map((era) => ({
    era,
    so: deriveOutskirts({ era, gridSize: GRID }).length,
    mat: getFloraStyle(era).density,
  }));
  assert.equal(new Set(diem.map((d) => d.so)).size, 15, '15 kỷ phải ra 15 số lượng khác nhau');
  const rho = tuongQuanHang(diem.map((d) => d.mat), diem.map((d) => d.so));
  assert.ok(rho > NGUONG_TUONG_QUAN,
    `tương quan giữa bảng thực vật và vùng quê chỉ ${rho.toFixed(3)} (sàn đo được 0,426 · trần 1,000)`
    + ' — hai bảng đã trôi khỏi nhau');
});

test('ĐỐI CHỨNG: phép đo tương quan phải còn BẮT ĐƯỢC bộ số đã mất bảng thực vật', () => {
  // ⚠️ Nhốt sẵn bộ số HỎNG đo được, bắt phép đo phải còn bắt được nó — nếu không thì ngưỡng sẽ bị
  // nới dần cho tiện và bài trên lặng lẽ mất răng (bài học phễu Phase 9A).
  const MAT = KY.map((era) => getFloraStyle(era).density);
  // Số vật đo thật khi `outskirts.js` KHÔNG nhân `style.density` — chép nguyên từ lần thử ngược.
  const HONG = [356, 351, 304, 370, 356, 352, 443, 380, 343, 337, 398, 347, 379, 407, 344];
  const rHong = tuongQuanHang(MAT, HONG);
  assert.ok(rHong < NGUONG_TUONG_QUAN,
    `bộ số đã bỏ bảng thực vật vẫn ra ${rHong.toFixed(3)} — ngưỡng ${NGUONG_TUONG_QUAN} đã bị nới quá tay`);

  // ⚠️ VÀ VẾ KHOÁ `hangTrungBinh`: KẾT QUẢ KHÔNG ĐƯỢC PHỤ THUỘC THỨ TỰ LIỆT KÊ 15 KỶ.
  //
  // Đây là bản THỨ HAI của assert này, và bản đầu là một bài học đáng ghi hơn cả con số. Bản đầu
  // hỏi `tuongQuanHang(MAT, MAT) > 0.9999` với lý lẽ nghe rất xuôi ("khớp hoàn hảo phải đo ra 1").
  // Phép thử ngược KHÔNG đỏ, và thủ phạm là chính cái assert: hai đầu vào GIỐNG HỆT NHAU thì mọi
  // luật phá hoà — dù tuỳ tiện tới đâu — cũng phá y hệt nhau ở cả hai vế, nên nó ra 1 vô điều kiện.
  // Một assert KHÔNG THỂ ĐỎ, đúng cái bẫy Phase 10 Bước 2 đã ghi.
  //
  // Thứ hạng trung bình thật sự mua được là TÍNH BẤT BIẾN THEO HOÁN VỊ. Đo thật trên đúng bộ số
  // này (nguyên thứ tự · đảo ngược · một hoán vị cố định):
  //   hạng trung bình → 0,9031 · 0,9031 · 0,9031   (đứng yên)
  //   phá hoà tuỳ tiện → 0,8786 · 0,9179 · 0,8929   (nhảy 0,04 — nhảy qua cả ngưỡng)
  // Nói cách khác, với luật cũ thì "hai bảng có trôi khỏi nhau không" phụ thuộc vào việc ai đó xếp
  // 15 kỷ theo thứ tự nào — một câu trả lời không thể tin được.
  // THỬ-CHO-ĐỎ ĐÃ CHẠY THẬT: đổi thân `hangTrungBinh` thành `hang[idx[k][1]] = k` (phá hoà bằng
  // thứ tự sắp xếp) ⇒ mong đợi đỏ ở đúng assert ngay dưới đây. Chạy thật: đỏ, 0,8786 ≠ 0,8929.
  const SO = KY.map((era) => deriveOutskirts({ era, gridSize: GRID }).length);
  const HOAN_VI = [7, 2, 14, 0, 9, 5, 11, 3, 13, 1, 8, 6, 12, 4, 10];
  const rGoc = tuongQuanHang(MAT, SO);
  const rHoanVi = tuongQuanHang(HOAN_VI.map((i) => MAT[i]), HOAN_VI.map((i) => SO[i]));
  assert.ok(Math.abs(rGoc - rHoanVi) < 1e-9,
    `đổi thứ tự liệt kê 15 kỷ làm tương quan nhảy ${rGoc.toFixed(4)} → ${rHoanVi.toFixed(4)}`
    + ' — phép đo đang phá hoà bằng thứ tự sắp xếp, không phải bằng hạng trung bình');
});

test('LOD THẬT SỰ CẮN — cả hai mức chi tiết đều có mặt ở mọi kỷ', () => {
  // ⚠️ Bài học Phase 8D: đặt ngưỡng LOD ở chỗ không ai chạm tới thì một nửa số hạt cho hai mức y
  // hệt nhau, tức cơ chế CHẾT mà vẫn được ship kèm một chú thích dài.
  // THỬ-CHO-ĐỎ: đổi điều kiện thành `d <= OUTSKIRT_REACH * 999 ? 'high' : 'low'`.
  for (const era of KY) {
    const muc = new Set(deriveOutskirts({ era, gridSize: GRID }).map((it) => it.detail));
    assert.deepEqual([...muc].sort(), ['high', 'low'], `kỷ ${era} chỉ dùng một mức chi tiết`);
  }
});

test('ĐỦ BA LOẠI — cây, bụi, đá; không kỷ nào chỉ có một loại bóng', () => {
  // THỬ-CHO-ĐỎ: đặt `ROCK_SHARE = 0` và bỏ nhánh `bush` → đỏ ở mọi kỷ.
  for (const era of KY) {
    const loai = new Set(deriveOutskirts({ era, gridSize: GRID }).map((it) => it.kind));
    assert.deepEqual([...loai].sort(), ['bush', 'rock', 'tree'], `kỷ ${era} thiếu loại: ${[...loai]}`);
  }
});
