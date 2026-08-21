/**
 * footprint.js — HÌNH CHIẾU ĐÁY của một mô tả khối, và DIỆN TÍCH HỢP của nhiều khối.
 *
 * ⚠️ VÌ SAO FILE NÀY RA ĐỜI, VÀ VÌ SAO NÓ NẰM Ở TẦNG ENGINE CHỨ KHÔNG Ở `scripts/`.
 *
 * Phép "khối này phủ bao nhiêu đất" trước đây sống trong `scripts/plan-coverage.mjs`. Nó đúng và
 * đã được `scripts/planCoverage.test.js` khoá, nhưng nó nằm sai chỗ: đây là **hình học thuần của
 * một `spec`**, cùng họ với `pick.js`/`parts.js`, và tầng engine không được phép `import` ngược
 * lên `scripts/`. Khi Phase 13 cần đúng phép ấy để đo *"dấu vết con người ngoài lưới rộng bao
 * nhiêu"*, chỉ có hai lối: chép lại công thức (⇒ **một luật hai công thức**, thứ đã khiến cặp
 * công-cụ-dựng ↔ công-cụ-đo nói dối ở Phase 4G và khiến `plinth-tri.mjs` đếm 3 bệ thay vì 31), hoặc
 * dời nó xuống đây rồi cho cả hai bên cùng đọc. Đã chọn cách thứ hai. `plan-coverage.mjs` nay
 * `import` từ file này và **xuất lại** để mọi chỗ đang gọi nó vẫn đúng.
 *
 * ⚠️ `daysGiacDay` CHÉP CÔNG THỨC VÀNH ĐỈNH CỦA `emitPrism`. Đó là chỗ duy nhất trong file còn nguy
 * cơ trôi: nếu nhà máy hình học đổi cách đặt đỉnh lăng trụ thì hàm này phải đổi theo. Có đối chứng
 * ở `scripts/planCoverage.test.js` bắt ca `sides: 8` — bản test cũ dùng khối không khai `sides`,
 * mà lăng trụ 4 cạnh có đáy TRÙNG KHÍT hình chữ nhật nên hai nhánh cho cùng kết quả và bài test
 * không phân biệt được chúng.
 */

/** Đọc số an toàn — cùng quy ước với `pick.js` (bên ấy không xuất ra nên phải khai lại). */
const num = (v, fb = 0) => (Number.isFinite(v) ? v : fb);

/** Đa giác đáy THẬT của một khối, trong hệ toạ độ cục bộ của công trình. */
export function daysGiacDay(part) {
  const w = Math.max(0, num(part.w));
  const d = Math.max(0, num(part.d, w));
  const ry = num(part.ry);
  const cx = num(part.x), cz = num(part.z);
  const xoay = (px, pz) => {
    const c = Math.cos(ry), si = Math.sin(ry);
    return [cx + px * c - pz * si, cz + px * si + pz * c];
  };
  // `gable` (mái dốc hai phía) chiếm trọn hình chữ nhật khi nhìn từ trên xuống.
  if (part.shape === 'gable') {
    return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([a, b]) => xoay(a, b));
  }
  // `prism`: chép NGUYÊN công thức vành đỉnh của `emitPrism`.
  const n = Math.max(3, Math.round(num(part.sides, 4)));
  const half = Math.PI / n;
  const rx = (w / 2) / Math.cos(half);
  const rz = (d / 2) / Math.cos(half);
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const goc = half + (i * 2 * Math.PI) / n;
    out.push(xoay(Math.cos(goc) * rx, Math.sin(goc) * rz));
  }
  return out;
}

/** Điểm nằm trong đa giác? (ray casting — đa giác ở đây luôn lồi và không tự cắt) */
export function trongDaGiac(px, pz, poly) {
  let trong = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > pz) !== (zj > pz) && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi) trong = !trong;
  }
  return trong;
}

/**
 * DIỆN TÍCH HỢP của một chùm đa giác, tính bằng Ô LƯỚI VUÔNG.
 *
 * ⚠️ CỘNG DIỆN TÍCH TỪNG ĐA GIÁC LÀ SAI — PHẢI LẤY HỢP. Một công trình gồm nhiều khối chồng lên
 * nhau (tường + mái + gờ + ống khói đều nằm trên cùng một móng), nên phép cộng đếm cùng một mét
 * vuông đất tới bốn năm lần. `plan-coverage.mjs` đã trả giá cho đúng lỗi này: bản cộng thẳng cho ra
 * **109,9% ở kỷ 6** — một con số tự tố cáo chính nó.
 *
 * ⚠️ VÀ LUẬT TÔ LÀ "TÂM Ô MẪU", KHÔNG PHẢI "CHẠM VÀO LÀ TÔ". Luật "chạm là tô" nói quá một cách CÓ
 * HỆ THỐNG (một cạnh rơi giữa hai ô mẫu vẫn ăn trọn ô, và phần dôi nằm ở rìa ngoài nên phép hợp
 * không xoá đi được — đo được **6,11 điểm phần trăm**, nguồn sai số lớn nhất của cả phép đo, lớn
 * hơn cả việc dùng hộp bao). Luật "tâm" là ước lượng KHÔNG thiên lệch: ô được tính khi và chỉ khi
 * tâm nó bị phủ.
 *
 * @param {Array<Array<[number,number]>>} polys  đa giác trong toạ độ Ô (nhận số âm)
 * @param {object} [opts]
 * @param {number} [opts.mauMoiO]  số ô mẫu trên mỗi cạnh của một ô lưới
 * @returns {number} diện tích, đơn vị ô lưới vuông
 */
export function dienTichHop(polys, { mauMoiO = 16 } = {}) {
  if (!Array.isArray(polys) || polys.length === 0) return 0;
  if (!Number.isInteger(mauMoiO) || mauMoiO < 1) {
    throw new Error('mauMoiO phải là số nguyên ≥ 1');
  }
  const buoc = 1 / mauMoiO;
  const dienTichMau = buoc * buoc;
  // Tập ô mẫu ĐÃ TÔ, khoá là "cột|hàng" trên lưới mẫu toàn cục ⇒ hai đa giác chồng nhau chỉ tính
  // một, và không cần biết trước hộp bao chung (toạ độ có thể âm, có thể rất thưa).
  const daTo = new Set();
  for (const poly of polys) {
    if (!Array.isArray(poly) || poly.length < 3) continue;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [x, z] of poly) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (z < z0) z0 = z; if (z > z1) z1 = z;
    }
    if (!(x1 > x0) || !(z1 > z0)) continue;   // đa giác suy biến: dài bằng 0, vô hình trên màn hình
    const i0 = Math.floor(x0 * mauMoiO), i1 = Math.ceil(x1 * mauMoiO);
    const j0 = Math.floor(z0 * mauMoiO), j1 = Math.ceil(z1 * mauMoiO);
    for (let j = j0; j <= j1; j += 1) {
      const pz = (j + 0.5) * buoc;
      for (let i = i0; i <= i1; i += 1) {
        const px = (i + 0.5) * buoc;
        if (trongDaGiac(px, pz, poly)) daTo.add(`${i}|${j}`);
      }
    }
  }
  return daTo.size * dienTichMau;
}

/**
 * Hình chiếu đáy của MỘT vật đã đặt xuống thế giới: lấy mọi khối của `spec`, nhân tỉ lệ dựng, dời
 * về tâm ô `(cx, cz)`, rồi xoay quanh trục đứng.
 *
 * ⚠️ THỨ TỰ PHẢI LÀ **NHÂN TỈ LỆ → XOAY → DỜI**, đúng thứ tự mà tầng dựng cảnh áp lên `Object3D`
 * (`scale` rồi `rotation` rồi `position`). Đảo hai bước đầu thì một khối lệch tâm sẽ hạ cánh ở chỗ
 * khác, và không có gì đỏ lên vì khối đối xứng — thứ chiếm phần lớn cảnh — cho ra kết quả y hệt.
 */
export function daysGiacDayDaDat(spec, { cx = 0, cz = 0, scale = 1, ry = 0 } = {}) {
  const parts = spec?.parts ?? [];
  const c = Math.cos(ry), si = Math.sin(ry);
  const out = [];
  for (const part of parts) {
    const poly = daysGiacDay(part);
    if (poly.length < 3) continue;
    out.push(poly.map(([x, z]) => {
      const sx = x * scale, sz = z * scale;
      return [cx + sx * c - sz * si, cz + sx * si + sz * c];
    }));
  }
  return out;
}
