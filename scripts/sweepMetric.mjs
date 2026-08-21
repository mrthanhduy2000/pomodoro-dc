/**
 * sweepMetric.mjs — PHÉP ĐO THUẦN dùng để chấm bản sắc kỷ trên bản quét.
 *
 * Tách khỏi `sweep-score.mjs` vì file kia là một SCRIPT: nó đọc `process.argv`, đọc file ảnh và
 * `process.exit()` ngay ở tầng cao nhất, nên `import` nó là chết. Mà phép đo thì phải kiểm được
 * bằng `node --test` với ảnh dựng tay. Một luật, một công thức, hai nơi dùng chung — không chép.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * VÌ SAO PHÉP ĐO NÀY THAY CHO BỘ LỌC "8% ĐIỂM ẢNH TƯƠI NHẤT" (TECH_DEBT #22)
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Bộ lọc cũ chọn ra 8% điểm ảnh tươi nhất của dải thành phố và gọi đó là "mái". Nó đứng trên một
 * giả định mỹ thuật KHÔNG được viết ra: *mái là thứ tươi nhất khung hình*. Đúng khi mái còn suy ra
 * từ `accentColor` (màu nhấn giao diện, luôn rực); chết ở Phase 6B khi mái thành vật liệu lợp thật
 * (đá phiến `#586a89`, bê tông `#717b65`, tranh, gạch bùn — phần lớn XỈN). Từ đó thứ tươi nhất còn
 * lại là CỎ, nên bộ lọc chấm cỏ và in ra 15 con số rác nhưng rất thuyết phục.
 *
 * ⚠️ VÀ ĐỪNG THỬ "CHỌN ĐIỂM ẢNH MÁI CHO KHÉO HƠN" — ĐÓ LÀ NGÕ CỤT, ĐÃ KIỂM Ở TẦNG DỮ LIỆU.
 * `materialProfile` xếp mái vào họ vật liệu `style.roofMaterial`. Đối chiếu 15 kỷ thì **4 kỷ khai
 * mái TRÙNG vật liệu tường**: kỷ 3 (mudbrick/mudbrick), kỷ 12 và 13 (concrete/concrete), kỷ 14
 * (glass/glass). Nghĩa là kể cả hỏi thẳng nhà máy hình học "nhóm tam giác nào là mái" thì bốn kỷ
 * ấy vẫn trả về MỘT nhóm gộp cả mái lẫn tường. Mái không tách được ra ngay từ NGUỒN, nên không bộ
 * lọc điểm ảnh nào cứu được. (Và đúng cặp 12↔13 — cặp hay bị kêu trùng nhau nhất — là cặp dùng
 * chung cả vật liệu mái LẪN vật liệu tường; bản sắc của chúng nằm ở màu, khối và cây cối.)
 *
 * ⇒ Bỏ hẳn proxy "mái". Thay bằng CHIA Ô CON.
 *
 * Bẫy số 2 ở đầu `sweep-score.mjs` vẫn đúng: lấy trung bình CẢ dải thì mái (~1/10 diện tích) bị
 * pha loãng ~10 lần. Nhưng nguyên nhân là phép TRUNG BÌNH TRÊN VÙNG QUÁ RỘNG, không phải việc
 * "không biết mái nằm ở đâu". Thu vùng lấy trung bình xuống 1/18 thì một mảng mái chiếm trọn vài ô
 * con và hiện nguyên độ lớn — giải đúng bài toán mà bộ lọc sinh ra để giải, mà không cần biết
 * "mái" là gì.
 *
 * BA THỨ GIỮ NGUYÊN CÓ CHỦ Ý:
 *  • ĐƠN VỊ. Vẫn là khoảng cách RGB trung bình trên mỗi điểm ⇒ ngưỡng mắt 12 (hiệu chuẩn Phase 3Y,
 *    Spearman 0,854) CÒN DÙNG ĐƯỢC. Đổi sang biểu đồ tần suất/EMD là tạo ra một đơn vị MỚI chưa
 *    hiệu chuẩn — và một ngưỡng chưa hiệu chuẩn chính là cái phễu mà Phase 9A đã dạy.
 *  • KHÔNG GIẢ ĐỊNH MỸ THUẬT NÀO. Phép đo không biết "mái"/"cỏ"/"tường" là gì, nên nó KHÔNG THỂ
 *    chết lần nữa vì mỹ thuật đổi. Đó chính xác là thứ bộ lọc cũ không làm được.
 *  • CHỈ ĐỌC DẢI THÀNH PHỐ. Trời (do đồng hồ quyết) và dải đất xa nằm ngoài, như trước.
 */

/** Ba dải theo chiều cao ô. Camera chúc xuống: trên là trời, giữa là thành phố, dưới là đất. */
export const BANDS = [
  { name: 'trời', from: 0.02, to: 0.30 },
  { name: 'thành phố', from: 0.34, to: 0.68 },
  { name: 'đất', from: 0.72, to: 0.98 },
];

export const GRID_X = 6;
export const GRID_Y = 3;

/**
 * Vùng điểm ảnh của một DẢI trong đúng một ô của bảng quét.
 * ⚠️ Toạ độ phải do bên gọi đưa vào từ hồ sơ `.geom.json` — TUYỆT ĐỐI không dò mép bằng màu
 * (bẫy số 1 ở `sweep-score.mjs`) và không đoán lại `--cell` (bẫy số 5).
 */
export function cityRect({ x0, y0, cellW, cellH }, band = BANDS[1]) {
  const top = Math.round(cellH * band.from);
  const bottom = Math.round(cellH * band.to);
  return { x: x0, y: y0 + top, w: cellW, h: bottom - top };
}

/**
 * Chia `rect` thành `gx × gy` ô con, mỗi ô con một màu trung bình → vector `3·gx·gy` chiều.
 * Mặc định 6×3 = 18 ô con ⇒ 54 chiều. Đơn vị mỗi chiều: 0–255.
 */
export function gridVector(png, rect, { gx = GRID_X, gy = GRID_Y } = {}) {
  const out = [];
  for (let cy = 0; cy < gy; cy += 1) {
    const y0 = rect.y + Math.round((cy * rect.h) / gy);
    const y1 = rect.y + Math.round(((cy + 1) * rect.h) / gy);
    for (let cx = 0; cx < gx; cx += 1) {
      const x0 = rect.x + Math.round((cx * rect.w) / gx);
      const x1 = rect.x + Math.round(((cx + 1) * rect.w) / gx);
      let r = 0; let g = 0; let b = 0; let n = 0;
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const i = (y * png.width + x) * 4;
          r += png.pixels[i]; g += png.pixels[i + 1]; b += png.pixels[i + 2]; n += 1;
        }
      }
      out.push(n ? r / n : 0, n ? g / n : 0, n ? b / n : 0);
    }
  }
  return out;
}

/** Khoảng cách RGB trung bình trên mỗi bộ ba. Đơn vị /255 — cùng thang với ngưỡng mắt 12. */
export function vecDist(a, b) {
  return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0) / (a.length / 3));
}

/** Ngưỡng mắt phân biệt, /255 — hiệu chuẩn ở Phase 3Y (0,31↔5,9px · 0,52↔29,8px · 1,28↔75,1px). */
export const EYE = 12;

/**
 * So HAI KHUNG HÌNH điểm ảnh đối điểm ảnh — khoảng cách RGB/255 từng điểm, rồi gộp lại.
 *
 * ⚠️ NÓ NẰM Ở ĐÂY, KHÔNG NẰM TRONG `sweep-diff.mjs`, vì đúng một lý do: `sweep-diff.mjs` chạy mã
 * ở cấp cao nhất (đọc `process.argv`, `process.exit`) nên **không import được từ một bài test**.
 * Một phép đo không test được thì chỉ còn `--selftest`, mà `--selftest` là thứ chỉ chạy khi có
 * người NHỚ gõ — dự án đã trả giá đúng chỗ này ba lần. Đưa phần thuần sang đây thì nó vào được
 * `npm test`, và ngưỡng mắt `EYE` vẫn chỉ có MỘT bản (một luật một công thức).
 *
 * `co` (tuỳ chọn) là mảng cờ 0/1 dài `width × height`: chỉ những điểm ảnh bật cờ mới được xét.
 * ⚠️ Nó đổi **MẪU SỐ**, không chỉ đổi tử số — và mẫu số là vế không ai kiểm (bài học đo mật độ
 * nhà, 2026-08-19), nên `xet` được trả về để bên gọi in ra được.
 */
export function soHaiKhung(a, b, co = null) {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(`hai ảnh khác cỡ: ${a.width}×${a.height} ≠ ${b.width}×${b.height}`);
  }
  const n = a.width * a.height;
  let vuot = 0, tong = 0, tongDoi = 0, xet = 0;
  for (let i = 0; i < n; i += 1) {
    if (co && !co[i]) continue;
    xet += 1;
    const o = i * 4;
    const dr = a.pixels[o] - b.pixels[o];
    const dg = a.pixels[o + 1] - b.pixels[o + 1];
    const db = a.pixels[o + 2] - b.pixels[o + 2];
    const d = Math.sqrt(dr * dr + dg * dg + db * db);
    tong += d;
    if (d >= EYE) { vuot += 1; tongDoi += d; }
  }
  return {
    tiLe: xet ? (vuot / xet) * 100 : 0,
    lechTB: xet ? tong / xet : 0,
    lechTBDoi: vuot ? tongDoi / vuot : 0,
    xet,
  };
}

/**
 * Cờ bật/tắt từng điểm ảnh theo một ảnh MẶT NẠ: bật khi kênh `kenh` **trội hẳn** và ≥ `nguong`.
 *
 * ⚠️ TRỘI HẲN, KHÔNG PHẢI VƯỢT NGƯỠNG. Viền răng cưa giữa hai lớp là màu PHA, nên một phép kiểm
 * "kênh này ≥ 40" sẽ nhận cùng một điểm ảnh vào CẢ HAI nhóm. Luật này dùng chung với
 * `mask-count.mjs` — đổi một bên mà quên bên kia là đúng bẫy "một luật hai công thức".
 */
export function coTheoMatNa(matNa, kenh, nguong = 40) {
  const idx = { r: 0, g: 1, b: 2 }[kenh];
  if (idx === undefined) throw new Error(`kênh phải là r/g/b, nhận "${kenh}"`);
  const n = matNa.width * matNa.height;
  const co = new Uint8Array(n);
  let dem = 0;
  for (let i = 0; i < n; i += 1) {
    const o = i * 4;
    const v = [matNa.pixels[o], matNa.pixels[o + 1], matNa.pixels[o + 2]];
    const khac = Math.max(...v.filter((_, k) => k !== idx));
    if (v[idx] >= nguong && v[idx] > khac) { co[i] = 1; dem += 1; }
  }
  return { co, dem };
}
