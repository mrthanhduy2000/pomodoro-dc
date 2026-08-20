/**
 * terrain-score.mjs — CHẤM HÌNH DẠNG MẶT ĐẤT: "đồi" hay "chăn nhàu"?
 *
 * Đàm nhìn ảnh kéo xa rồi nói mặt đất gợn lên gợn xuống **như một tấm chăn nhàu**, không có lý do
 * địa lý nào. Đây là công cụ biến câu ấy thành số.
 *
 * ⚠️ VÌ SAO PHẢI ĐO CHỨ KHÔNG NHÌN: "nhàu" và "đồi" trên ảnh tĩnh trông rất giống nhau — cả hai
 * đều là chỗ cao chỗ thấp. Thứ phân biệt chúng KHÔNG phải biên độ mà là **SỐ LẦN ĐỔI CHIỀU**: một
 * quả đồi đi lên rồi đi xuống (1 lần đổi chiều trên một đường cắt); một tấm chăn nhàu đi lên
 * xuống lên xuống. Mắt đọc ra ngay nhưng không nói được vì sao, nên phải có con số.
 *
 * NĂM ĐẠI LƯỢNG, mỗi cái trả lời MỘT câu khác nhau (đừng gộp — xem bài học `TECH_DEBT #22`):
 *   1. `chenh`     — chênh cao lớn nhất TRONG lưới 12×12. Câu hỏi: "nền thành phố có bằng không?"
 *   2. `doiChieu`  — số lần đổi chiều dốc trên 24 đường cắt (12 hàng + 12 cột). Câu hỏi: "nhàu?"
 *   3. `R2`        — phần phương sai cao độ giải thích được bằng MỘT mặt phẳng nghiêng.
 *                    Câu hỏi: "địa hình có HƯỚNG không, hay là gợn ngẫu nhiên?"
 *   4. `đỉnh`/`đáy`— số MẢNG LIỀN NHAU ở mức cao nhất / thấp nhất. Câu hỏi: "một quả đồi, hay hai
 *                    chục cái mụn?"
 *   5. `bậc`       — bậc lớn nhất giữa hai ô kề. Câu hỏi: "cái riser cao bằng mấy phần căn nhà?"
 *   6. `vành`      — nền thành phố so với sàn vùng đất bao quanh (`-APRON_DROP`).
 *                    Câu hỏi: "thành phố có nằm cao hơn xung quanh một cách hợp lý không?"
 *
 * ⚠️ HAI MỨC BỎ QUA (`eps`), VÀ CẢ HAI ĐỀU ĐO ĐƯỢC, KHÔNG PHẢI CHỌN TAY:
 *   · `eps = 0`              — đếm MỌI gợn, kể cả dốc thoải do phép san đường sinh ra.
 *   · `eps = nửa bậc thềm`   — chỉ đếm chỗ đổi chiều Ở CẤP THỀM, tức thứ mắt đọc ra là "bậc".
 * Một con số duy nhất ở đây sẽ hoặc bị nhiễu san-đường lấn át, hoặc xoá luôn thứ cần đếm.
 * Bậc thềm của mỗi kỷ = `TERRACE_STEP × relief`, nên `eps` tự co giãn theo kỷ — không có hằng số
 * chọn tay nào.
 *
 * `--selftest` bơm bốn trường cao độ TỰ DỰNG mà ta biết trước đáp án, và nó **chạm tới từng
 * chiều** của phép đo (bài học Phase 4G: một phép tự kiểm chỉ chứng minh bộ lọc CÓ chạy thì chưa
 * chứng minh nó chạy ĐÚNG). Đặc biệt có ca "sống đồi chạy theo trục x" để phân biệt HÀNG với CỘT —
 * đúng chiều mà bản `--selftest` của `sweep-score.mjs` từng mù.
 *
 * Dùng:
 *   node --import ./scripts/register-esm-loader.mjs scripts/terrain-score.mjs
 *   node --import ./scripts/register-esm-loader.mjs scripts/terrain-score.mjs --selftest
 *   node --import ./scripts/register-esm-loader.mjs scripts/terrain-score.mjs --era 5 --cat
 */

import {
  buildTerrain, ERA_TERRAIN, TERRACE_STEP, APRON_DROP,
  APRON_CELLS, APRON_EDGE, terrainSurfaceReach,
} from '../src/engine/city3d/terrain.js';
import * as diaHinh from '../src/engine/city3d/terrain.js';

/**
 * ⚠️ `geometricTemplate` CHỈ TỒN TẠI Ở BẢN SAU §1(B), VÀ ĐÓ KHÔNG PHẢI MỘT THIẾU SÓT CỦA CÔNG CỤ.
 *
 * Trước §1(B), cao độ là `hình + nhiễu` cộng thẳng vào nhau, nên **không có** một "khuôn hình học"
 * nào để tách ra mà hỏi — chính việc tách được hình khỏi nhiễu LÀ bản vá. Vì vậy khi đo bản nền,
 * cột `khớpKHUÔN` phải in `—` chứ không được dựng lại công thức của bản nền ở đây: chép công thức
 * sang công cụ đo là đúng cái bẫy "một luật hai công thức" đã cắn dự án ở Phase 4G.
 *
 * Cột đo được ở CẢ HAI vế và trả lời đúng câu "đất có HƯỚNG không" là `R2` (mặt phẳng nghiêng).
 */
const khuonCuaKy = typeof diaHinh.geometricTemplate === 'function'
  ? (era) => diaHinh.geometricTemplate({ era, gridSize: GRID }).field
  : () => null;

const GRID = 12;

/**
 * Số lần đổi chiều dốc trên MỘT đường cắt.
 *
 * ⚠️ BỎ QUA CHỖ BẰNG, KHÔNG COI NÓ LÀ MỘT LẦN ĐỔI CHIỀU. Cao độ bị chia bậc nên một đỉnh đồi
 * thường có mặt thềm phẳng ở trên; "lên → bằng → xuống" là MỘT quả đồi, không phải hai sự kiện.
 * Đếm sai chỗ này thì mọi kỷ nhiều bậc tự động trông "nhàu" gấp đôi thực tế.
 */
export function demDoiChieu(chuoi, eps = 0) {
  let dau = 0;
  let n = 0;
  for (let i = 1; i < chuoi.length; i += 1) {
    const d = chuoi[i] - chuoi[i - 1];
    if (Math.abs(d) <= eps) continue;
    const s = d > 0 ? 1 : -1;
    if (dau !== 0 && s !== dau) n += 1;
    dau = s;
  }
  return n;
}

/**
 * Phần phương sai cao độ giải thích được bằng MỘT mặt phẳng nghiêng (h ≈ a·x + b·y + c).
 *
 * 1,00 = một sườn dốc đều hoàn hảo (có hướng rõ). 0,00 = mặt phẳng ngang không giải thích được gì
 * (gợn ngẫu nhiên, hoặc một quả đồi đối xứng). Trường phẳng lì trả về `null` — không có phương sai
 * nào để mà giải thích, và trả 0 ở đó là nói dối theo hướng "vô hướng".
 */
export function huongMatPhang(h, size) {
  const n = size * size;
  let sh = 0;
  for (let i = 0; i < n; i += 1) sh += h[i];
  const mh = sh / n;
  let tong = 0;
  for (let i = 0; i < n; i += 1) tong += (h[i] - mh) ** 2;
  if (tong <= 1e-12) return null;

  // x, y đã trừ trung bình ⇒ ma trận chuẩn tắc chéo hoá, a và b tách rời.
  const mc = (size - 1) / 2;
  let sxx = 0; let syy = 0; let sxh = 0; let syh = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - mc;
      const dy = y - mc;
      const dh = h[y * size + x] - mh;
      sxx += dx * dx; syy += dy * dy; sxh += dx * dh; syh += dy * dh;
    }
  }
  const a = sxx > 1e-12 ? sxh / sxx : 0;
  const b = syy > 1e-12 ? syh / syy : 0;
  let du = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const du1 = h[y * size + x] - mh - a * (x - mc) - b * (y - mc);
      du += du1 * du1;
    }
  }
  return Math.max(0, Math.min(1, 1 - du / tong));
}

/**
 * Số ĐỈNH RỜI RẠC và ĐÁY RỜI RẠC — trả lời "một quả đồi, hay hai chục cái mụn?".
 *
 * ⚠️ BẢN ĐẦU CỦA HÀM NÀY HỎI SAI CÂU VÀ TRẢ VỀ ~0 Ở CẢ 15 KỶ. Nó tìm ô nào cao hơn ĐỦ TÁM ô kề —
 * một định nghĩa đúng cho mặt đất liên tục, nhưng cao độ ở đây bị CHIA BẬC, nên một đỉnh đồi là
 * cả một mặt thềm phẳng chứ không phải một ô đơn độc; không ô nào cao hơn hàng xóm của nó, và
 * phép đo in ra "0 đỉnh" cho một địa hình đầy gò. Đúng hình dạng `TECH_DEBT #22`: một phép đo
 * **về mặt cấu trúc không thể thấy** thứ nó đang hỏi.
 *
 * Bản đúng đếm **số mảng LIỀN NHAU ở mức cao nhất** (và thấp nhất). Một quả đồi ⇒ 1 mảng. Một tấm
 * chăn nhàu ⇒ nhiều mảng rời. Không có phép nối theo sai số (`eps` chỉ dùng để nhận mức, không
 * dùng để nối ô), nên phép san đường không thể xâu chuỗi cả mạng phố thành một mảng khổng lồ.
 */
export function demMangCaoNhat(h, size, eps = 0) {
  let hi = -Infinity;
  let lo = Infinity;
  for (let i = 0; i < h.length; i += 1) {
    if (h[i] > hi) hi = h[i];
    if (h[i] < lo) lo = h[i];
  }
  const dem = (moc, tren) => {
    const thuoc = new Uint8Array(size * size);
    for (let i = 0; i < h.length; i += 1) {
      thuoc[i] = (tren ? h[i] >= moc - eps : h[i] <= moc + eps) ? 1 : 0;
    }
    const daTham = new Uint8Array(size * size);
    let mang = 0;
    for (let i = 0; i < thuoc.length; i += 1) {
      if (!thuoc[i] || daTham[i]) continue;
      mang += 1;
      const ngan = [i];
      daTham[i] = 1;
      while (ngan.length) {
        const k = ngan.pop();
        const x = k % size;
        const y = (k - x) / size;
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
          const j = ny * size + nx;
          if (thuoc[j] && !daTham[j]) { daTham[j] = 1; ngan.push(j); }
        }
      }
    }
    return mang;
  };
  // Trường phẳng lì: mức cao nhất và thấp nhất là một ⇒ "một mảng duy nhất", không phải "một đỉnh".
  if (hi - lo <= eps) return { dinh: 0, day: 0 };
  return { dinh: dem(hi, true), day: dem(lo, false) };
}

/**
 * BẬC LỚN NHẤT giữa hai ô KỀ NHAU — chiều cao cái "riser" mà mắt đọc ra là một bờ kè hoặc một vách.
 *
 * ⚠️ ĐỔI RA ĐỘ DỐC PHẢI NHÂN `SMOOTHSTEP_PEAK` = 1,5. Mặt đất nội suy bằng `smoothstep` giữa hai
 * tâm ô, mà đạo hàm của `smoothstep` đạt cực đại 1,5 ở giữa quãng — chỗ dốc nhất dốc gấp rưỡi mức
 * trung bình. Quên hệ số này là tự báo cáo mình thoải hơn thực tế 50% (xem `maxRoadRise`).
 */
export function bucLonNhat(h, size) {
  let m = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const v = h[y * size + x];
      if (x + 1 < size) m = Math.max(m, Math.abs(h[y * size + x + 1] - v));
      if (y + 1 < size) m = Math.max(m, Math.abs(h[(y + 1) * size + x] - v));
    }
  }
  return m;
}

/**
 * PHẦN DƯ so với KHUÔN mà chính kỷ ấy khai — đây là phép đo trả lời ĐÚNG câu Đàm hỏi.
 *
 * ⚠️ VÌ SAO KHÔNG DÙNG `R²` MẶT PHẲNG CHO VIỆC NÀY, VÀ NÓ SUÝT LÀM TÔI KẾT LUẬN SAI. Bản đầu chấm
 * "địa hình có lý do không" bằng độ khớp với MỘT MẶT PHẲNG NGHIÊNG, và ra 1/15 kỷ đạt. Nghe như
 * một bản án. Nhưng kỷ 5 khai `ridge` (gò, cao ở giữa) và kỷ 10 khai `valley` (lòng chảo) — cả hai
 * ĐỐI XỨNG, nên **không một mặt phẳng nào mô tả nổi chúng**, và `R²` thấp ở đó là ĐÚNG chứ không
 * phải hỏng. Tôi đang hỏi "có dốc về một phía không" trong khi câu cần hỏi là "có theo hình mình
 * khai không". Đúng bài học "chọn sai TRỤC thì đo bao nhiêu vòng cũng không ra".
 *
 * Bản đúng: khớp bình phương bé nhất `a·khuôn + c` (affine, vì khuôn chỉ đúng sai khác affine),
 * rồi hỏi phần dư còn lại to bằng bao nhiêu và có gợn không.
 *   · `khopKhuon`  — phần phương sai khuôn giải thích được. 1,00 = hình dạng thuần lý do.
 *   · `duBienDo`   — biên độ phần dư CHIA cho biên độ tổng. 0,60 nghĩa là **quá nửa hình dạng
 *                    thành phố là gợn ngẫu nhiên**, không phải gò hay lòng chảo.
 *   · `duDoiChieu` — số lần đổi chiều CỦA RIÊNG phần dư. Đây chính là "nhàu": khuôn đã bị trừ đi
 *                    nên mọi lần đổi chiều còn lại đều là gợn không có nguyên nhân.
 */
export function chamPhanDu(h, khuon, size, eps = 0) {
  const n = h.length;
  let mh = 0;
  let mk = 0;
  for (let i = 0; i < n; i += 1) { mh += h[i]; mk += khuon[i]; }
  mh /= n; mk /= n;
  let skk = 0;
  let skh = 0;
  let tong = 0;
  for (let i = 0; i < n; i += 1) {
    const dk = khuon[i] - mk;
    const dh = h[i] - mh;
    skk += dk * dk; skh += dk * dh; tong += dh * dh;
  }
  if (tong <= 1e-12) return { khopKhuon: null, duBienDo: 0, duDoiChieu: 0 };
  const a = skk > 1e-12 ? skh / skk : 0;
  const du = new Float64Array(n);
  let sdu = 0;
  let lo = Infinity;
  let hi = -Infinity;
  let hlo = Infinity;
  let hhi = -Infinity;
  for (let i = 0; i < n; i += 1) {
    du[i] = h[i] - mh - a * (khuon[i] - mk);
    sdu += du[i] * du[i];
    if (du[i] < lo) lo = du[i];
    if (du[i] > hi) hi = du[i];
    if (h[i] < hlo) hlo = h[i];
    if (h[i] > hhi) hhi = h[i];
  }
  let doi = 0;
  for (let y = 0; y < size; y += 1) {
    const r = [];
    for (let x = 0; x < size; x += 1) r.push(du[y * size + x]);
    doi += demDoiChieu(r, eps);
  }
  for (let x = 0; x < size; x += 1) {
    const c = [];
    for (let y = 0; y < size; y += 1) c.push(du[y * size + x]);
    doi += demDoiChieu(c, eps);
  }
  return {
    khopKhuon: Math.max(0, Math.min(1, 1 - sdu / tong)),
    duBienDo: hhi - hlo > 1e-12 ? (hi - lo) / (hhi - hlo) : 0,
    duDoiChieu: doi,
  };
}

/** Gom cả năm đại lượng cho MỘT trường cao độ. `buoc` = chiều cao một bậc thềm của kỷ ấy. */
export function chamTruong(h, size, buoc) {
  const eps = buoc > 0 ? buoc / 2 : 0;
  let lo = Infinity;
  let hi = -Infinity;
  let tong = 0;
  for (let i = 0; i < h.length; i += 1) {
    if (h[i] < lo) lo = h[i];
    if (h[i] > hi) hi = h[i];
    tong += h[i];
  }
  const hang = [];
  const cot = [];
  for (let y = 0; y < size; y += 1) {
    const r = [];
    for (let x = 0; x < size; x += 1) r.push(h[y * size + x]);
    hang.push(r);
  }
  for (let x = 0; x < size; x += 1) {
    const c = [];
    for (let y = 0; y < size; y += 1) c.push(h[y * size + x]);
    cot.push(c);
  }
  const doiChieu = (e) => ({
    hang: hang.reduce((s, r) => s + demDoiChieu(r, e), 0),
    cot: cot.reduce((s, c) => s + demDoiChieu(c, e), 0),
  });
  const tho = doiChieu(0);
  const them = doiChieu(eps);
  return {
    chenh: hi - lo,
    trungBinh: tong / h.length,
    doiChieuTho: tho.hang + tho.cot,
    doiChieuThoHang: tho.hang,
    doiChieuThoCot: tho.cot,
    doiChieuThem: them.hang + them.cot,
    doiChieuThemHang: them.hang,
    doiChieuThemCot: them.cot,
    R2: huongMatPhang(h, size),
    ...demMangCaoNhat(h, size, eps),
    buoc: bucLonNhat(h, size),
    duoiVanh: h.reduce((s2, v) => s2 + (v < -APRON_DROP ? 1 : 0), 0),
    eps,
  };
}

/**
 * CÁI BỆ VUÔNG — đo xem vành đất quanh thành phố có đọc ra là hình VUÔNG không.
 *
 * ⚠️ ĐÂY LÀ PHÉP ĐO ĐI TÌM THỨ MẮT THẬT SỰ NHÌN THẤY, và nó ra đời vì bốn tấm ảnh `--zoom 2`. Cả
 * bốn đều hiện đúng một thứ giống nhau: thành phố ngồi trên **một cái khay vuông cạnh sắc lẹm**
 * nổi trên một cái vòm đất trơn. Bảng số 12×12 ở trên **không thể** thấy nó — nó nằm NGOÀI lưới.
 * Suýt nữa thì tôi đi sửa gợn nhiễu bên trong lưới trong khi thứ Đàm gọi là "mảng vuông nhỏ xíu"
 * lại nằm ở chỗ khác. Đúng bài học "chọn sai TRỤC thì đo bao nhiêu vòng cũng không ra".
 *
 * CÁCH ĐO — cùng hình dạng với phép chấm bo góc đã dùng cho vành ngoài: bắn tia từ tâm ra mọi
 * hướng, tìm bán kính chỗ mặt đất **tụt xuống nửa đường** giữa cao nguyên và sàn vành. Rồi so bán
 * kính theo ĐƯỜNG CHÉO với bán kính theo TRỤC:
 *   · tỉ số ≈ **1,414** (`√2`) ⇒ ranh giới là một hình VUÔNG hoàn hảo — bốn góc thò ra đúng √2 lần.
 *   · tỉ số ≈ **1,00**        ⇒ ranh giới TRÒN/hữu cơ, không còn góc để mắt bắt.
 * Đơn vị giữ nguyên là "ô", nên con số này so thẳng được với `APRON_CELLS`/`APRON_EDGE`.
 */
export function chamBeVuong(era, gridSize = GRID, soTia = 720) {
  const t = buildTerrain({ era, gridSize });
  const c = (gridSize - 1) / 2;
  const san = -APRON_DROP;
  const reach = terrainSurfaceReach(gridSize);
  const banKinh = [];
  for (let k = 0; k < soTia; k += 1) {
    const goc = (k / soTia) * Math.PI * 2;
    const dx = Math.cos(goc);
    const dy = Math.sin(goc);
    const cao0 = t.surfaceHeightAt(c, c);
    const moc = (cao0 + san) / 2;
    // ⚠️ TẤM ĐẤT LÀ HÌNH VUÔNG, NÊN TIA PHẢI CHẠY TỚI KHI RA KHỎI HÌNH VUÔNG — KHÔNG PHẢI TỚI
    // `reach`. Bản đầu dừng ở `d <= reach` (nửa CẠNH) và 12/15 kỷ trả về đúng 9,50 ở đường chéo:
    // tia hết đất trước khi chạm mốc, tức phép đo BÃO HOÀ và tỉ số chéo/trục bị kéo xuống giả tạo.
    // Đúng cái bẫy đã ghi trong `CLAUDE.md`: *một bán kính chỉ là một bán kính khi vật thể TRÒN* —
    // theo đường chéo, hình vuông vươn xa hơn nửa cạnh đúng `√2` lần.
    let r = null;
    let chamMep = false;
    for (let d = 0; d <= reach * Math.SQRT2 + 0.02; d += 0.02) {
      const u = c + dx * d;
      const v = c + dy * d;
      if (Math.max(Math.abs(u - c), Math.abs(v - c)) > reach) { chamMep = true; break; }
      if (t.surfaceHeightAt(u, v) <= moc) { r = d; break; }
    }
    banKinh.push({ goc, r: r ?? Infinity, chamMep: r === null && chamMep });
  }
  // Trục = 0°/90°/180°/270°; chéo = 45°/135°/225°/315°. Lấy cửa sổ ±5° cho đỡ nhạy với một tia lẻ.
  const gom = (tam) => {
    const v = banKinh.filter(({ goc }) => {
      const d = Math.abs(((goc * 180) / Math.PI - tam + 540) % 360 - 180);
      return d <= 5;
    }).map((b) => b.r);
    return v.reduce((a, b) => a + b, 0) / Math.max(1, v.length);
  };
  const truc = [0, 90, 180, 270].map(gom);
  const cheo = [45, 135, 225, 315].map(gom);
  const tb = (v) => v.reduce((a, b) => a + b, 0) / v.length;
  const rs = banKinh.map((b) => b.r).filter((r) => Number.isFinite(r));
  // ⚠️ GÁC CHỐNG BÃO HOÀ. Nếu còn tia nào chạy hết đất mà chưa chạm mốc thì con số in ra là một
  // giới hạn dưới đội lốt một phép đo — phải KÊU TO, không được lặng lẽ thay bằng `reach`.
  const soBaoHoa = banKinh.filter((b) => b.chamMep).length;
  return {
    tiSo: tb(cheo) / Math.max(1e-6, tb(truc)),
    rTruc: tb(truc),
    rCheo: tb(cheo),
    rMin: rs.length ? Math.min(...rs) : NaN,
    rMax: rs.length ? Math.max(...rs) : NaN,
    soBaoHoa,
  };
}

function truongCuaKy(era) {
  const t = buildTerrain({ era, gridSize: GRID });
  const h = new Float64Array(GRID * GRID);
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) h[y * GRID + x] = t.heightAt(x, y);
  }
  return { h, t };
}

function so(v, d = 2) {
  if (v === null || v === undefined) return '—';
  return v.toFixed(d).replace('.', ',');
}

function selftest() {
  const N = 12;
  const dung = (f) => {
    const h = new Float64Array(N * N);
    for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) h[y * N + x] = f(x, y);
    return h;
  };
  const ca = [
    {
      ten: 'phẳng lì',
      h: dung(() => 0),
      cho: { chenh: 0, doiChieuTho: 0, R2: null, dinh: 0, day: 0, buoc: 0 },
    },
    {
      ten: 'dốc đều theo trục y (có HƯỚNG)',
      h: dung((x, y) => y * 0.1),
      // Dốc đều: mức cao nhất là trọn hàng cuối ⇒ ĐÚNG 1 mảng; mức thấp nhất là trọn hàng đầu.
      cho: { doiChieuTho: 0, R2: 1, dinh: 1, day: 1, buoc: 0.1 },
    },
    {
      // ⚠️ CA PHÂN BIỆT HÀNG ↔ CỘT. Sống đồi chạy dọc trục y: đi ngang (theo x) thì lên rồi xuống
      // ⇒ mỗi HÀNG 1 lần đổi chiều = 12; đi dọc (theo y) thì phẳng ⇒ mỗi CỘT 0 lần.
      // Đảo nhầm hai trục thì ra 0/12 thay vì 12/0 — bản `--selftest` không có ca này sẽ MÙ.
      ten: 'sống đồi chạy dọc trục y (hàng ≠ cột)',
      h: dung((x) => 1 - Math.abs(x - 5.5) * 0.1),
      // Sống đồi: đỉnh là hai cột giữa dính nhau ⇒ 1 mảng; ĐÁY là hai mép TRÁI và PHẢI rời nhau
      // ⇒ 2 mảng. Chính con số 2 này là thứ bản `demDinhHo` cũ KHÔNG THỂ thấy.
      cho: { doiChieuThoHang: 12, doiChieuThoCot: 0, dinh: 1, day: 2 },
    },
    {
      // Bàn cờ = "chăn nhàu" tuyệt đối: mọi đường cắt đổi chiều ở mọi bước.
      ten: 'bàn cờ (nhàu tối đa)',
      h: dung((x, y) => ((x + y) % 2) * 0.5),
      // Bàn cờ: 72 ô ở mức cao, KHÔNG ô nào kề nhau theo 4 hướng ⇒ 72 mảng rời. Đây là mức trần
      // của "nhàu" và là đối chứng nhốt bộ số hỏng: phép đo phải còn phân biệt được nó với 1.
      cho: { doiChieuTho: 24 * (N - 2), R2: 0, dinh: 72, day: 72 },
    },
  ];
  let hong = 0;
  for (const c of ca) {
    const d = chamTruong(c.h, N, 0.5);
    const loi = [];
    for (const [k, v] of Object.entries(c.cho)) {
      const got = d[k];
      const ok = v === null ? got === null
        : (typeof got === 'number' && Math.abs(got - v) < 1e-6);
      if (!ok) loi.push(`${k}: chờ ${v}, ra ${got}`);
    }
    if (loi.length) { hong += 1; console.log(`  ✗ ${c.ten} — ${loi.join(' · ')}`); }
    else console.log(`  ✓ ${c.ten}`);
  }
  console.log(hong ? `\n❌ ${hong}/${ca.length} ca tự kiểm HỎNG` : `\n✓ ${ca.length}/${ca.length} ca tự kiểm đạt`);
  return hong === 0 ? 0 : 1;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--selftest')) process.exit(selftest());

  const iEra = argv.indexOf('--era');
  const eras = iEra >= 0 ? [Number(argv[iEra + 1])] : Array.from({ length: 15 }, (_, i) => i + 1);

  if (argv.includes('--ngoai')) {
    console.log(`bệ vuông: tỉ số CHÉO/TRỤC — 1,414 = vuông hoàn hảo · 1,00 = tròn`);
    console.log(`(APRON_CELLS = ${so(APRON_CELLS, 2)} · APRON_EDGE = ${so(APRON_EDGE, 2)} · APRON_DROP = ${so(APRON_DROP, 2)})`);
    console.log('kỷ\ttỉ số\tr trục\tr chéo\tr min\tr max\tbão hoà');
    let tong = 0;
    let bh = 0;
    for (const era of eras) {
      const b = chamBeVuong(era);
      tong += b.tiSo;
      bh += b.soBaoHoa;
      console.log([era, so(b.tiSo, 3), so(b.rTruc, 2), so(b.rCheo, 2), so(b.rMin, 2), so(b.rMax, 2), b.soBaoHoa || ''].join('\t'));
    }
    if (bh) console.log(`\n⚠️  ${bh} tia chạy hết đất mà chưa chạm mốc — con số trên là GIỚI HẠN DƯỚI, không phải phép đo.`);
    if (eras.length > 1) console.log(`\ntỉ số CHÉO/TRỤC trung bình ${so(tong / eras.length, 3)} (vuông hoàn hảo = 1,414)`);
    return;
  }

  if (argv.includes('--cat')) {
    for (const era of eras) {
      const { h } = truongCuaKy(era);
      console.log(`\n── kỷ ${era} (${ERA_TERRAIN[era]?.shape}) — cao độ 12×12 ──`);
      for (let y = 0; y < GRID; y += 1) {
        const r = [];
        for (let x = 0; x < GRID; x += 1) r.push(so(h[y * GRID + x], 2).padStart(5));
        console.log(r.join(' '));
      }
    }
    return;
  }

  console.log('kỷ\tdạng\tthềm\trelief\tchênh\tbậc lớn\tđổiTHÔ\tđổiTHỀM\tR2hướng\tkhớpKHUÔN\tdư/tổng\tdư đổi\tđỉnh\tđáy');
  const gom = [];
  for (const era of eras) {
    const p = ERA_TERRAIN[era];
    const { h } = truongCuaKy(era);
    const buoc = TERRACE_STEP * (p?.relief ?? 0);
    const d = chamTruong(h, GRID, buoc);
    const khuon = khuonCuaKy(era);
    const du = khuon
      ? chamPhanDu(h, khuon, GRID, buoc > 0 ? buoc / 2 : 0)
      : { khopKhuon: null, duBienDo: null, duDoiChieu: null };
    gom.push({ era, ...d, ...du });
    console.log([
      era, p?.shape ?? '?', p?.terraces ?? '?', so(p?.relief ?? 0, 2),
      so(d.chenh, 2), so(d.buoc, 2), d.doiChieuTho, d.doiChieuThem,
      d.R2 === null ? '—' : so(d.R2, 3),
      du.khopKhuon === null ? '—' : so(du.khopKhuon, 3),
      du.duBienDo === null ? '—' : so(du.duBienDo, 2),
      du.duDoiChieu === null ? '—' : du.duDoiChieu,
      d.dinh, d.day,
    ].join('\t'));
  }
  if (gom.length > 1) {
    const tb = (k) => {
      const v = gom.map((g) => g[k]).filter((x) => typeof x === 'number');
      return v.length ? v.reduce((s2, x) => s2 + x, 0) / v.length : 0;
    };
    console.log(`\ntrung bình 15 kỷ: chênh ${so(tb('chenh'), 2)} · bậc lớn nhất ${so(tb('buoc'), 2)} · đổi chiều THÔ ${so(tb('doiChieuTho'), 1)} · đổi chiều THỀM ${so(tb('doiChieuThem'), 1)} · R2 hướng ${so(tb('R2'), 3)} · đỉnh ${so(tb('dinh'), 1)} · đáy ${so(tb('day'), 1)}`);
    const coKhuon = gom.filter((g) => g.khopKhuon !== null);
    if (coKhuon.length) {
      console.log(`khớp KHUÔN trung bình ${so(tb('khopKhuon'), 3)} · phần dư chiếm ${so(tb('duBienDo') * 100, 1)}% biên độ · phần dư đổi chiều ${so(tb('duDoiChieu'), 1)} lần/24 đường cắt`);
      const doc = coKhuon.filter((g) => g.khopKhuon >= 0.7).length;
      console.log(`kỷ ĐỌC RA được hình mình khai (khớp ≥ 0,70): ${doc}/${coKhuon.length}`);
    } else {
      console.log('khớp KHUÔN: — (bản này chưa tách được hình khỏi nhiễu nên KHÔNG có khuôn để hỏi; xem chú thích `khuonCuaKy`)');
    }
  }
}

main();
