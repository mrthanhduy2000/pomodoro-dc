/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CHE KHUẤT MÔI TRƯỜNG (ambient occlusion) NƯỚNG SẴN VÀO MÀU ĐỈNH — Phase 19, ADR-063.
 *
 * ⚠️ ĐÂY LÀ NỬA CÒN THIẾU CỦA MỘT VIỆC ĐÃ LÀM MỘT NỬA. `contactShade` (`materials.js`) đã nướng AO
 * từ Phase 7A, nhưng nó chỉ hỏi ĐÚNG MỘT câu: *"đỉnh này cao bao nhiêu so với mặt đất?"* Chú thích
 * của chính nó nói thẳng ra giới hạn ấy — *"AO thật cần biết mỗi đỉnh bị bao nhiêu MẶT KHÁC che"* —
 * và ghi rằng phép xấp xỉ theo chiều cao bắt được ~80% hiệu quả.
 *
 * Con số 80% ấy đúng ở thời điểm nó được viết, và ADR-052 đã làm nó hết đúng: khi nhà bắt đầu GHÉP
 * THÀNH CỤM, giữa hai căn sát nhau có một cái khe sâu chạy từ đất lên tận mái — mà một phép đo chỉ
 * nhìn chiều cao thì **mù hoàn toàn với nó**, vì hai đỉnh ở hai bên khe có `y` y hệt như một đỉnh
 * đứng giữa đồng trống. Đúng hình dạng bài học "một phép đo trộn hai đại lượng / thiếu một chiều".
 *
 * ⚠️ VÀ NÓ VẪN KHÔNG PHẢI SSAO. Lý do từ chối SSAO ở `materials.js` còn nguyên giá trị: SSAO là một
 * lượt hậu kỳ TOÀN MÀN HÌNH, tính tiền theo TỪNG ĐIỂM ẢNH — mà `PERFORMANCE.md` đo được 80% chi phí
 * mỗi khung hình của cảnh này đã là chi phí theo điểm ảnh — và nó thêm một pass vào MỌI khung hình,
 * tức phá thẳng vào render-on-demand. Ở đây cảnh TĨNH giữa hai lần dựng, nên phép che khuất tính
 * MỘT LẦN lúc gộp hình học rồi nướng vào màu đỉnh: **0 đồng lúc chạy**, và không đụng một dòng nào
 * của vòng lặp vẽ.
 *
 * ⚠️ NÓ CHỈ LÀM TỐI, KHÔNG BAO GIỜ LÀM SÁNG — và đó là điều kiện Đàm ra: *"nếu ảnh ra SỮA NHẠT thì
 * BỎ NGAY"*. Hai lần dự án suýt chết vì ảnh bạc phếch (AgX tone mapping, rồi bản đồ môi trường rọi
 * ở mức 1,0) đều là những thứ NÂNG vùng tối lên. Hàm này trả về một hệ số trong khoảng
 * `[1 − AO_STRENGTH, 1]` rồi được NHÂN vào màu, nên về mặt cấu trúc nó không thể làm nhạt bất cứ
 * thứ gì. Có bài test khoá đúng mệnh đề ấy.
 *
 * ⚠️ CÁCH ĐO — HỎI HÌNH HỌC THẬT, KHÔNG ĐOÁN BẰNG NGƯỠNG. `TECH_DEBT #22` là bài học đắt nhất dự án
 * về "một thứ đại diện là một giả định mỹ thuật đội lốt một phép đo": bộ lọc "8% điểm ảnh tươi nhất
 * ≈ mái" chưa bao giờ đo mái. Ở đây phép đo hỏi thẳng vào chính danh sách khối sắp được đem đi dựng
 * hình: dựng một LƯỚI Ô CHIẾM CHỖ từ hộp bao của từng khối, rồi với mỗi đỉnh bắn vài tia ngắn theo
 * hướng pháp tuyến và đếm xem bao nhiêu tia đâm vào chỗ có vật. Không có hằng số mỹ thuật nào ở
 * giữa, nên nó không thể "chết trong im lặng" khi mỹ thuật đổi.
 */

/** Cạnh ô lưới chiếm chỗ. Nhỏ hơn thì sắc hơn nhưng tốn bộ nhớ theo LUỸ THỪA BA. */
export const OCC_CELL = 0.11;

/**
 * Đẩy điểm lấy mẫu ra khỏi mặt một đoạn trước khi hỏi.
 *
 * ⚠️ KHÔNG CÓ BƯỚC NÀY THÌ MỌI ĐỈNH ĐỀU BỊ CHÍNH KHỐI CỦA NÓ CHE, và kết quả là cả thành phố tối
 * đều một cách vô nghĩa — tức đúng cái "ám xám đều như căn nhà bị bẩn" mà chú thích của
 * `contactShade` đã cảnh báo. Phải lớn hơn `OCC_CELL` để điểm lấy mẫu chắc chắn rơi ra ngoài ô
 * chứa chính mặt ấy.
 */
export const OCC_LIFT = 0.13;

/** Hai bán kính hỏi: gần bắt khe hẹp, xa bắt khối lớn đứng cạnh. */
export const OCC_RADII = [0.20, 0.42];

/**
 * Tối đa AO được phép ăn mất bao nhiêu phần màu.
 *
 * ⚠️ 0,30 CHỌN BẰNG BẢNG ĐO, KHÔNG BẰNG CẢM GIÁC — xem `PERFORMANCE.md`. Nó cũng cố ý NHỎ HƠN mức
 * `contactShade` được phép ăn (1 − 0,58 = 0,42): bóng tiếp xúc ở chân tường là thứ ai cũng thấy
 * ngoài đời, còn che khuất giữa hai khối là thứ tinh tế hơn; để hai cái ngang nhau thì khe nhà đen
 * bằng chân tường và cả cụm nhà đọc ra như một khối than.
 */
export const AO_STRENGTH = 0.30;

/**
 * Sáu hướng bắn quanh pháp tuyến: chính giữa + năm hướng nghiêng ~55°.
 *
 * ⚠️ PHẢI CÓ HƯỚNG NGHIÊNG, KHÔNG ĐƯỢC CHỈ BẮN THẲNG. Chỉ bắn thẳng ra thì hai bức tường song song
 * cách nhau 0,3 đơn vị vẫn "thấy trời", vì tia đi vuông góc với khe chứ không dọc theo nó — mà khe
 * hẹp giữa hai nhà ghép chính là ca ADR-052 sinh ra phép đo này. Số 5 (không phải 4) để các hướng
 * không rơi trùng trục toạ độ: khối ở đây phần lớn là hộp vuông thẳng trục, bắn đúng trục thì hoặc
 * trúng hết hoặc trượt hết.
 */
const HUONG_NGHIENG = 5;
const GOC_NGHIENG = 0.96;   // ~55°

/** Dựng hệ trục vuông góc quanh một pháp tuyến. */
function truc(nx, ny, nz) {
  // Chọn vector mồi KHÔNG song song với pháp tuyến, nếu không tích có hướng ra vector 0.
  const mx = Math.abs(ny) < 0.9 ? 0 : 1;
  const my = Math.abs(ny) < 0.9 ? 1 : 0;
  let ux = my * nz - 0 * ny;
  let uy = 0 * nx - mx * nz;
  let uz = mx * ny - my * nx;
  const lu = Math.hypot(ux, uy, uz) || 1;
  ux /= lu; uy /= lu; uz /= lu;
  return {
    ux, uy, uz,
    vx: ny * uz - nz * uy,
    vy: nz * ux - nx * uz,
    vz: nx * uy - ny * ux,
  };
}

/**
 * Lưới ô chiếm chỗ dựng từ danh sách khối.
 *
 * ⚠️ ĐÁNH DẤU THEO HỘP BAO ĐÃ XOAY, và đó là một phép xấp xỉ RỘNG HƠN khối thật. Chọn hướng ấy có
 * chủ ý: AO nói quá một chút thì ảnh tối hơn thật một chút (mắt gần như không phân biệt được), còn
 * AO nói thiếu thì cái khe biến mất — tức mất đúng thứ đang đi làm. Và nó rẻ hơn hẳn việc dựng lại
 * đa giác từng lăng trụ ở đây, thứ sẽ là công thức thứ hai cho hình mà `geometryFactory.js` đã dựng
 * (một luật, một công thức).
 */
export function buildOcclusionGrid(parts, { cell = OCC_CELL } = {}) {
  let minX = Infinity; let minY = Infinity; let minZ = Infinity;
  let maxX = -Infinity; let maxY = -Infinity; let maxZ = -Infinity;

  const hop = [];
  for (const p of parts ?? []) {
    if (!p || !Number.isFinite(p.w) || !Number.isFinite(p.h)) continue;
    // Khối xoay quanh trục đứng ⇒ nửa bề ngang của hộp bao là hình chiếu của cả hai cạnh.
    const c = Math.abs(Math.cos(p.ry ?? 0));
    const s = Math.abs(Math.sin(p.ry ?? 0));
    const hw = (p.w * c + p.d * s) / 2;
    const hd = (p.w * s + p.d * c) / 2;
    const b = {
      x0: (p.x ?? 0) - hw, x1: (p.x ?? 0) + hw,
      y0: p.y ?? 0, y1: (p.y ?? 0) + p.h,
      z0: (p.z ?? 0) - hd, z1: (p.z ?? 0) + hd,
    };
    hop.push(b);
    if (b.x0 < minX) minX = b.x0;
    if (b.y0 < minY) minY = b.y0;
    if (b.z0 < minZ) minZ = b.z0;
    if (b.x1 > maxX) maxX = b.x1;
    if (b.y1 > maxY) maxY = b.y1;
    if (b.z1 > maxZ) maxZ = b.z1;
  }
  if (!hop.length) return null;

  // Nới một ô mỗi phía để điểm lấy mẫu ngay sát mép vẫn tra được mà không phải kiểm biên hai lần.
  minX -= cell; minY -= cell; minZ -= cell;
  const nx = Math.max(1, Math.ceil((maxX + cell - minX) / cell));
  const ny = Math.max(1, Math.ceil((maxY + cell - minY) / cell));
  const nz = Math.max(1, Math.ceil((maxZ + cell - minZ) / cell));

  const o = new Uint8Array(nx * ny * nz);
  for (const b of hop) {
    const i0 = Math.max(0, Math.floor((b.x0 - minX) / cell));
    const i1 = Math.min(nx - 1, Math.floor((b.x1 - minX) / cell));
    const j0 = Math.max(0, Math.floor((b.y0 - minY) / cell));
    const j1 = Math.min(ny - 1, Math.floor((b.y1 - minY) / cell));
    const k0 = Math.max(0, Math.floor((b.z0 - minZ) / cell));
    const k1 = Math.min(nz - 1, Math.floor((b.z1 - minZ) / cell));
    for (let j = j0; j <= j1; j += 1) {
      for (let k = k0; k <= k1; k += 1) {
        const base = (j * nz + k) * nx;
        for (let i = i0; i <= i1; i += 1) o[base + i] = 1;
      }
    }
  }
  return {
    o, nx, ny, nz, cell, minX, minY, minZ, so: hop.length,
  };
}

/** Ô này có vật không? Ngoài lưới ⇒ trống (trời). */
export function occupied(grid, x, y, z) {
  if (!grid) return false;
  const i = Math.floor((x - grid.minX) / grid.cell);
  if (i < 0 || i >= grid.nx) return false;
  const j = Math.floor((y - grid.minY) / grid.cell);
  if (j < 0 || j >= grid.ny) return false;
  const k = Math.floor((z - grid.minZ) / grid.cell);
  if (k < 0 || k >= grid.nz) return false;
  return grid.o[(j * grid.nz + k) * grid.nx + i] === 1;
}

/**
 * Hệ số che khuất cho một đỉnh: 1 = trống trải, thấp nhất `1 − AO_STRENGTH` = kẹt sâu trong khe.
 *
 * ⚠️ TRẢ VỀ 1 KHI KHÔNG CÓ LƯỚI. Cảnh rỗng thì không có gì che gì cả, và "không đo được" phải đọc
 * ra là "không tối đi", tuyệt đối không phải một giá trị tối mặc định — sai chiều ở đây là làm cả
 * thành phố xỉn đi vì một lỗi dựng lưới mà không có gì đỏ lên.
 */
export function occlusionShade(grid, px, py, pz, nx, ny, nz, strength = AO_STRENGTH) {
  if (!grid) return 1;
  const { ux, uy, uz, vx, vy, vz } = truc(nx, ny, nz);
  const ox = px + nx * OCC_LIFT;
  const oy = py + ny * OCC_LIFT;
  const oz = pz + nz * OCC_LIFT;

  let trung = 0;
  let tong = 0;
  for (const r of OCC_RADII) {
    // Tia đi thẳng ra theo pháp tuyến.
    tong += 1;
    if (occupied(grid, ox + nx * r, oy + ny * r, oz + nz * r)) trung += 1;
    // Năm tia nghiêng.
    for (let t = 0; t < HUONG_NGHIENG; t += 1) {
      const a = (Math.PI * 2 * t) / HUONG_NGHIENG;
      const ca = Math.cos(a) * GOC_NGHIENG;
      const sa = Math.sin(a) * GOC_NGHIENG;
      const cz = Math.sqrt(Math.max(0, 1 - GOC_NGHIENG * GOC_NGHIENG));
      const dx = ux * ca + vx * sa + nx * cz;
      const dy = uy * ca + vy * sa + ny * cz;
      const dz = uz * ca + vz * sa + nz * cz;
      tong += 1;
      if (occupied(grid, ox + dx * r, oy + dy * r, oz + dz * r)) trung += 1;
    }
  }
  if (!tong) return 1;
  return 1 - strength * (trung / tong);
}
