/**
 * road-score.mjs — MẶT ĐƯỜNG CÓ ĐỌC ĐƯỢC KHÔNG?
 *
 * Trả lời đúng một câu hỏi mà `TECH_DEBT #30` mở ra và Phase 9D phải đóng: *trên màn hình, mặt
 * đường sáng bao nhiêu so với mặt đất nó nằm trên, và có kỷ nào con đường tụt xuống thành một cái
 * rãnh đen không?*
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ MẶT NẠ DO BÊN **DỰNG** CẤP, KHÔNG ĐOÁN BẰNG MÀU
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Đây là điều kiện sống còn của công cụ này, và nó là bài học đắt nhất dự án từng học
 * (`TECH_DEBT #22`): bộ lọc "8% điểm ảnh tươi nhất ≈ mái" chưa bao giờ đo mái — nó đo *thứ tươi
 * nhất khung hình* rồi GỌI đó là mái, đúng cho tới khi Phase 6B đổi vật liệu lợp và Phase 8D cho
 * mỗi kỷ một thảm cỏ riêng, rồi nó lặng lẽ đi chấm CỎ suốt ba phase.
 *
 * Ở đây không có bộ lọc nào. `sceneGraph.js` đặt `mesh.name = 'road' | 'ground'`; `city-preview.mjs
 * --mask road,ground` dựng lại ĐÚNG cảnh ấy, ĐÚNG camera ấy, chỉ thay vật liệu thành xám phẳng —
 * nên tấm mặt nạ khớp tấm ảnh thật từng điểm ảnh một, kể cả những chỗ mái nhà che mất một khúc
 * đường (che thì nó không còn là điểm ảnh đường trên màn hình nữa, và mặt nạ biết điều đó vì phép
 * kiểm chiều sâu vẫn chạy y hệt).
 *
 * ⚠️ VÌ SAO PHẢI ĐO TRÊN ĐIỂM ẢNH ĐÃ DỰNG CHỨ KHÔNG ĐỌC BẢNG MÀU: giữa hai đầu còn ba tầng — cường
 * độ đèn, phép kẹp kênh khi tràn, rồi tone mapping. Dự án đã đo được mái render ra tươi GẤP ĐÔI
 * bảng màu còn bầu trời thì nhạt đi NĂM LẦN. Bảng màu nói lên ý định; chỉ điểm ảnh mới nói lên thứ
 * Đàm nhìn thấy.
 *
 * Cách dùng:
 *   node scripts/road-score.mjs <ảnh-thật.png> <ảnh-mặt-nạ.png>
 *   node scripts/road-score.mjs --selftest
 *
 * Đọc kết quả — HAI câu hỏi, và mỗi câu hỏi phải hỏi bằng ĐÚNG đại lượng của nó:
 *   `sắc`   ĐỌC ĐƯỢC KHÔNG? Khoảng cách CẢ MÀU giữa màu trung bình của đường và của đất, quy về
 *           thang 0..1 để so thẳng với ngưỡng mắt 12/255. Dưới `NGƯỠNG_ĐỌC` ⇒ đường tàng hình.
 *   `hố`    CÓ THÀNH CÁI RÃNH KHÔNG? Đáy 5% của ĐẤT trừ đáy 5% của ĐƯỜNG — tức con đường thủng
 *           xuống bao nhiêu SO VỚI nền quanh nó. Vượt `NGƯỠNG_HỐ` ⇒ có hố.
 *   `cách`  chênh lệch riêng ĐỘ SÁNG. In ra để so được với con số của `TECH_DEBT #30`, KHÔNG dùng
 *           để phán xét — xem `NGƯỠNG_ĐỌC` để biết vì sao (nó đã kết tội oan kỷ 7 một lần).
 *   `đáy` / `đáyĐất`  đáy 5% của từng nhóm, in ra để đọc `hố` cho có ngữ cảnh.
 *
 * ⚠️ CẢ HAI NGƯỠNG ĐỀU LÀ QUAN HỆ, KHÔNG PHẢI MỨC TUYỆT ĐỐI — và cả hai đều đã từng được viết
 * thành mức tuyệt đối trong chính phiên viết ra file này, rồi báo động giả. Xem chú thích của
 * `NGƯỠNG_HỐ` và `NGƯỠNG_ĐỌC`. Bài học chung: `TECH_DEBT #30` là một câu nói về *đường so với đất*,
 * nên mọi con số dùng để đóng nó cũng phải là một con số so sánh.
 */

import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

/**
 * NGƯỠNG mắt còn đọc ra chi tiết trong một mảng tối, theo độ sáng tuyến tính 0..1.
 * Lấy đúng con số `TECH_DEBT #30` đã dùng để kết luận "nhựa đường kỷ 11 ở 0,113 là một cái rãnh" —
 * giữ nguyên để hai lần đo so được với nhau. Đổi con số này là làm hai bộ số hết so được, đúng cái
 * bẫy "số cũ và số mới đo hai đại lượng khác nhau" mà `TECH_DEBT #22` đã phải ghi hẳn một cảnh báo.
 */
export const NGƯỠNG_TỐI = 0.12;

/**
 * ⚠️ "RÃNH ĐEN" LÀ MỘT QUAN HỆ VỚI MẶT ĐẤT, KHÔNG PHẢI MỘT MỨC SÁNG TUYỆT ĐỐI — và bản đầu của
 * CHÍNH công cụ này (viết trong phiên Phase 9D) đã viết nó thành mức tuyệt đối rồi báo động giả.
 *
 * Bằng chứng: lúc 22h, đáy của ĐƯỜNG ở kỷ 3 là 0,044 — dưới `NGƯỠNG_TỐI` 0,12, nên công cụ kêu
 * "rãnh đen". Nhưng đáy của ĐẤT trong cùng khung hình ấy là 0,127, và ban đêm thì cả cảnh vốn phải
 * tối. Chênh lệch đường↔đất lúc 22h (−0,083) còn NHỎ HƠN lúc 12h (−0,202): ban đêm con đường thật
 * ra hoà vào đất HƠN chứ không phải thủng ra. Một ngưỡng tuyệt đối không thể phân biệt "đường thành
 * hố" với "trời tối" — đúng bài học Phase 9A về sương mù, lặp lại trong một công cụ mới toanh.
 *
 * ⇒ Ngưỡng này là mức mà đáy đường được phép nằm DƯỚI đáy đất. Lấy đúng bằng TRẦN của phép đẩy
 * trong `palette3d.js` (`roadContrastGap(Infinity)` = 0,26): trần ấy chính là cơ chế sinh ra để
 * chặn cái hố, nên nếu ảnh dựng ra vượt xa nó thì có thứ KHÁC đang bóp tối mặt đường, và đó mới là
 * điều đáng kêu. Đo được sau Phase 9D: xấu nhất −0,202 (kỷ 3, 12h) — còn 22% biên.
 */
export const NGƯỠNG_HỐ = 0.26;

/**
 * Cách nhau bao nhiêu thì mắt tách được đường khỏi đất. 0,05 trên thang 0..1 ≈ 13/255 — sát ngưỡng
 * mắt 12/255 đã hiệu chuẩn ở Phase 3Y, làm tròn lên cho chắc.
 *
 * ⚠️ ÁP LÊN KHOẢNG CÁCH **CẢ MÀU**, KHÔNG ÁP LÊN RIÊNG ĐỘ SÁNG — bản đầu áp lên độ sáng và đã kết
 * tội oan kỷ 7. Lúc ấy đường lát pietraforte (nâu-vàng) nằm trên nền đất cũng nâu-vàng: chênh độ
 * sáng chỉ 0,001 lúc 22h, nên công cụ kêu "đường tàng hình" — trong khi mắt nhìn ảnh vẫn thấy con
 * đường, vì nó tách ra bằng SẮC. (Kỷ 7 sau đó hoá ra CÓ lỗi thật, nhưng là lỗi khác: đá lát bị lấy
 * nhầm sang đá xây tường; xem `eraStyle.js` kỷ 7.) Độ sáng chỉ là MỘT trong ba trục của màu, và đo
 * một trục thì vừa BÁO NHẦM vừa BỎ SÓT — Phase 3Y đã trả giá đúng chỗ này. Đơn vị giữ nguyên
 * (khoảng cách RGB chia 255) nên vẫn so được với ngưỡng mắt 12/255 đã hiệu chuẩn.
 */
export const NGƯỠNG_ĐỌC = 0.05;

/** Giải mã PNG 8-bit (RGB hoặc RGBA) bằng `zlib` của Node — không thêm dependency. */
export function decodePng(path) {
  const buf = readFileSync(path);
  let off = 8; let w = 0; let h = 0; let bitDepth = 0; let colorType = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bitDepth !== 8) throw new Error(`PNG bitDepth ${bitDepth} chưa hỗ trợ`);
  if (colorType !== 2 && colorType !== 6) throw new Error(`PNG colorType ${colorType} chưa hỗ trợ`);
  const ch = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const out = Buffer.alloc(h * stride);
  let pos = 0;
  for (let y = 0; y < h; y += 1) {
    const filter = raw[pos]; pos += 1;
    const line = raw.subarray(pos, pos + stride); pos += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x += 1) {
      const a = x >= ch ? cur[x - ch] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= ch ? prev[x - ch] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      cur[x] = v & 255;
    }
  }
  return { w, h, ch, data: out };
}

/**
 * Độ sáng cảm nhận của một điểm ảnh, 0..1. Dùng trọng số Rec. 709 vì mắt nhạy với lục hơn lam rất
 * nhiều — lấy trung bình cộng ba kênh sẽ nói rằng lam đậm và lục đậm tối như nhau, mà chúng không.
 */
export const luma = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/** Chỉ số kênh trong tấm mặt nạ: đường = đỏ, đất = lục. Khớp thứ tự `--mask road,ground`. */
export const KÊNH = { ĐƯỜNG: 0, ĐẤT: 1 };

/**
 * Một điểm ảnh mặt nạ THUẦN tới đâu: kênh trội chiếm bao nhiêu phần tổng ba kênh.
 * Xám thuần ⇒ 1/3. Đỏ thuần ⇒ 1. Mép khử răng cưa giữa đỏ và đen vẫn đỏ thuần (chỉ tối đi), nhưng
 * mép giữa đỏ và LỤC thì lẫn ⇒ độ thuần tụt về ~0,5 và bị loại — đúng thứ cần loại.
 */
function độ_thuần(r, g, b) {
  const tổng = r + g + b;
  return tổng < 12 ? 0 : Math.max(r, g, b) / tổng;
}

const THUẦN_TỐI_THIỂU = 0.80;

/**
 * Gom điểm ảnh theo KÊNH MÀU của mặt nạ, kèm một cổng chặn tự tố cáo.
 *
 * ⚠️ CỔNG `kiểm_mặt_nạ` LÀ PHẦN QUAN TRỌNG NHẤT HÀM NÀY, KHÔNG PHẢI PHẦN GOM. Bản đầu của công cụ
 * này phân loại bằng MỨC XÁM, và tone mapping đã bóp hai mức 255/192 dính vào nhau thành 233/235 —
 * bộ chấm gom nhầm cả đường lẫn đất vào một rổ rồi in ra một bảng số đầy đủ và rất thuyết phục.
 * `--selftest` KHÔNG bắt được, vì nó cho ăn mặt nạ giả có đúng mức xám mong đợi: nó chứng minh phép
 * gom CHẠY, không chứng minh tấm mặt nạ THẬT hợp lệ (đúng bài học `--selftest` ở Phase 4C).
 * ⇒ Cổng này kiểm chính TẤM MẶT NẠ THẬT: nếu phần lớn điểm ảnh không-đen mà không thuần một kênh
 * thì đây không phải mặt nạ kênh màu ⇒ NÉM LỖI, không đoán tiếp.
 */
export function kiểm_mặt_nạ(mặt_nạ) {
  let sáng = 0; let thuần = 0;
  for (let k = 0; k < mặt_nạ.w * mặt_nạ.h; k += 1) {
    const i = k * mặt_nạ.ch;
    const r = mặt_nạ.data[i]; const g = mặt_nạ.data[i + 1]; const b = mặt_nạ.data[i + 2];
    if (r + g + b < 12) continue;
    sáng += 1;
    if (độ_thuần(r, g, b) >= THUẦN_TỐI_THIỂU) thuần += 1;
  }
  const tỉ_lệ = sáng ? thuần / sáng : 0;
  if (sáng === 0) throw new Error('tấm mặt nạ đen tuyền — chưa dựng bằng `--mask road,ground`?');
  if (tỉ_lệ < 0.9) {
    throw new Error(
      `tấm mặt nạ chỉ có ${(tỉ_lệ * 100).toFixed(1)}% điểm ảnh thuần MỘT kênh màu — đây không phải `
      + 'mặt nạ kênh màu. Dựng lại bằng `city-preview.mjs --mask road,ground` (bản cũ tô mức XÁM, '
      + 'và tone mapping bóp hai mức xám dính vào nhau ⇒ mọi con số đo từ nó đều sai).',
    );
  }
  return tỉ_lệ;
}

/**
 * Gom mọi điểm ảnh thuộc một nhóm. Trả về CẢ HAI đại lượng trong MỘT lần duyệt:
 *   `sáng` — mảng độ sáng từng điểm (để lấy trung bình và phân vị "đáy")
 *   `rgb`  — màu TRUNG BÌNH của nhóm (để đo khoảng cách CẢ MÀU, không chỉ độ sáng)
 * Duyệt một lần chứ không hai, vì hai vòng lặp cùng lọc theo một luật là "một luật hai công thức".
 */
export function nhóm(ảnh, mặt_nạ, kênh) {
  if (ảnh.w !== mặt_nạ.w || ảnh.h !== mặt_nạ.h) {
    throw new Error(`ảnh ${ảnh.w}×${ảnh.h} và mặt nạ ${mặt_nạ.w}×${mặt_nạ.h} khác cỡ`);
  }
  const sáng = [];
  const tổng = [0, 0, 0];
  for (let k = 0; k < ảnh.w * ảnh.h; k += 1) {
    const j = k * mặt_nạ.ch;
    const m = [mặt_nạ.data[j], mặt_nạ.data[j + 1], mặt_nạ.data[j + 2]];
    if (độ_thuần(...m) < THUẦN_TỐI_THIỂU) continue;      // đen, hoặc mép lẫn hai nhóm
    if (m.indexOf(Math.max(...m)) !== kênh) continue;
    const i = k * ảnh.ch;
    sáng.push(luma(ảnh.data[i], ảnh.data[i + 1], ảnh.data[i + 2]));
    tổng[0] += ảnh.data[i]; tổng[1] += ảnh.data[i + 1]; tổng[2] += ảnh.data[i + 2];
  }
  const n = sáng.length || 1;
  return { sáng, rgb: [tổng[0] / n, tổng[1] / n, tổng[2] / n] };
}

/**
 * Khoảng cách CẢ MÀU giữa hai màu trung bình, quy về thang 0..1 để so trực tiếp với ngưỡng mắt
 * 12/255. Dùng RMS trên ba kênh (chia √3) — đúng đơn vị mà `sweepMetric.mjs` và ngưỡng mắt 12 của
 * Phase 3Y đang dùng, nên hai bộ số so được với nhau.
 */
export function cách_màu(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) / Math.sqrt(3) / 255;
}

const trung_bình = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Phân vị thứ `p` (0..1) của một mảng — dùng lấy "đáy" 5% tối nhất. */
export function phân_vị(xs, p) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))];
}

export function chấm(ảnh, mặt_nạ) {
  kiểm_mặt_nạ(mặt_nạ);
  const đường = nhóm(ảnh, mặt_nạ, KÊNH.ĐƯỜNG);
  const đất = nhóm(ảnh, mặt_nạ, KÊNH.ĐẤT);
  return {
    nĐường: đường.sáng.length,
    nĐất: đất.sáng.length,
    đường: trung_bình(đường.sáng),
    đất: trung_bình(đất.sáng),
    // Giữ `cách` là chênh lệch ĐỘ SÁNG — không phải để phán xét, mà để so được với con số
    // `TECH_DEBT #30` đã dùng (0,113 so với 0,406). Phán xét "có đọc được không" là việc của `sắc`.
    cách: Math.abs(trung_bình(đường.sáng) - trung_bình(đất.sáng)),
    sắc: cách_màu(đường.rgb, đất.rgb),
    đáy: phân_vị(đường.sáng, 0.05),
    đáyĐất: phân_vị(đất.sáng, 0.05),
    // Âm = đáy đường nằm DƯỚI đáy đất, tức con đường đang thủng xuống so với nền quanh nó.
    hố: phân_vị(đất.sáng, 0.05) - phân_vị(đường.sáng, 0.05),
  };
}

// ── TỰ KIỂM ──────────────────────────────────────────────────────────────────────────────────
// ⚠️ PHẢI CHẠM TỚI TỪNG CHIỀU NÓ MUỐN BẢO CHỨNG. Bài học Phase 4G: bản `--selftest` của
// `sweep-score.mjs` so hai ô CÙNG NẰM Ở HÀNG 0 nên bảo chứng được bước nhảy cột mà mù hoàn toàn với
// bước nhảy hàng — đúng chiều đang sai — và vẫn báo ✓. Ba ca dưới đây tách ba chiều khác nhau:
// (1) có gom đúng nhóm không, (2) có thật sự ĐỌC ảnh chứ không đọc mặt nạ không, (3) "đáy" có bắt
// được cái hố mà trung bình che mất không.
function ảnh_giả(w, h, vẽ) {
  const data = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const [r, g, b] = vẽ(x, y);
      const i = (y * w + x) * 3;
      data[i] = r; data[i + 1] = g; data[i + 2] = b;
    }
  }
  return { w, h, ch: 3, data };
}

function selftest() {
  const W = 60; const H = 40;
  // Mặt nạ: cột trái = đường (ĐỎ), cột giữa = đất (LỤC), cột phải = không thuộc nhóm nào (đen).
  const mn = ảnh_giả(W, H, (x) => (x < 20 ? [255, 0, 0] : (x < 40 ? [0, 255, 0] : [0, 0, 0])));
  let ok = true;
  const báo = (tên, đạt, chi_tiết) => {
    console.log(`  ${đạt ? '✓' : '✗'} ${tên}${chi_tiết ? ` — ${chi_tiết}` : ''}`);
    if (!đạt) ok = false;
  };

  // (1) GOM ĐÚNG NHÓM: đường xám 51, đất xám 153, phần thừa xám 255 (rất sáng, để nếu lọt vào nhóm
  // nào thì con số nhóm ấy vọt lên thấy ngay).
  const a1 = ảnh_giả(W, H, (x) => {
    const v = x < 20 ? 51 : (x < 40 ? 153 : 255);
    return [v, v, v];
  });
  const r1 = chấm(a1, mn);
  báo('gom đúng nhóm theo mặt nạ',
    Math.abs(r1.đường - 0.2) < 0.01 && Math.abs(r1.đất - 0.6) < 0.01
      && r1.nĐường === 20 * H && r1.nĐất === 20 * H,
    `đường=${r1.đường.toFixed(3)} (mong 0,200) · đất=${r1.đất.toFixed(3)} (mong 0,600) · `
    + `đếm ${r1.nĐường}/${r1.nĐất} (mong ${20 * H}/${20 * H})`);

  // (2) ĐỌC ẢNH CHỨ KHÔNG ĐỌC MẶT NẠ: giữ nguyên mặt nạ, ĐẢO độ sáng hai vùng trong ảnh thật. Nếu
  // hàm lỡ lấy độ sáng từ mặt nạ thì kết quả sẽ KHÔNG đổi — đó chính là kiểu hỏng khó thấy nhất.
  const a2 = ảnh_giả(W, H, (x) => {
    const v = x < 20 ? 153 : (x < 40 ? 51 : 255);
    return [v, v, v];
  });
  const r2 = chấm(a2, mn);
  báo('đọc ẢNH THẬT, không đọc mặt nạ',
    Math.abs(r2.đường - 0.6) < 0.01 && Math.abs(r2.đất - 0.2) < 0.01,
    `đảo hai vùng ⇒ đường=${r2.đường.toFixed(3)} (mong 0,600) · đất=${r2.đất.toFixed(3)} (mong 0,200)`);

  // (3) "ĐÁY" BẮT ĐƯỢC CÁI HỐ MÀ TRUNG BÌNH CHE MẤT: một con đường nửa sáng 0,8 nửa tối 0,0 có cùng
  // trung bình 0,4 với một con đường phẳng lì 0,4 — chỉ `đáy` phân biệt được hai thứ đó.
  const đều = ảnh_giả(W, H, (x) => { const v = x < 20 ? 102 : (x < 40 ? 153 : 0); return [v, v, v]; });
  const hố = ảnh_giả(W, H, (x, y) => {
    const v = x < 20 ? (y < H / 2 ? 204 : 0) : (x < 40 ? 153 : 0);
    return [v, v, v];
  });
  const rĐều = chấm(đều, mn); const rHố = chấm(hố, mn);
  báo('“đáy” tách được đường phẳng khỏi đường có hố',
    Math.abs(rĐều.đường - rHố.đường) < 0.02 && rĐều.đáy > 0.3 && rHố.đáy < 0.05,
    `cùng trung bình ${rĐều.đường.toFixed(2)}/${rHố.đường.toFixed(2)} nhưng đáy `
    + `${rĐều.đáy.toFixed(3)} so với ${rHố.đáy.toFixed(3)}`);

  // (5) ⚠️ ĐỐI CHỨNG: BAN ĐÊM KHÔNG PHẢI LÀ MỘT CÁI HỐ. Nhốt lại đúng báo động giả mà bản đầu của
  // công cụ này đã tạo ra. Dựng một cảnh ĐÊM: cả đường lẫn đất đều rất tối (đáy đường 0,04 — dưới
  // hẳn `NGƯỠNG_TỐI` 0,12 cũ), nhưng đường chỉ tối hơn đất một chút. Phép đo phải nói "không có hố".
  // Rồi dựng đúng bộ số của `TECH_DEBT #30` (đường 0,113 trên nền đất 0,406 giữa ban ngày) và ĐÒI
  // phép đo phải VẪN bắt được. Một ngưỡng không có đối chứng sẽ bị nới dần cho tiện (Phase 9A).
  const đêm = ảnh_giả(W, H, (x) => { const v = x < 20 ? 26 : (x < 40 ? 46 : 0); return [v, v, v]; });
  const rĐêm = chấm(đêm, mn);
  báo('cảnh ĐÊM tối đều KHÔNG bị kêu là hố',
    rĐêm.đáy < NGƯỠNG_TỐI && rĐêm.hố <= NGƯỠNG_HỐ,
    `đáy đường ${rĐêm.đáy.toFixed(3)} (dưới ngưỡng tuyệt đối cũ ${NGƯỠNG_TỐI}) nhưng hố chỉ ${rĐêm.hố.toFixed(3)}`);
  const rãnh30 = ảnh_giả(W, H, (x) => { const v = x < 20 ? 29 : (x < 40 ? 104 : 0); return [v, v, v]; });
  const r30 = chấm(rãnh30, mn);
  báo('VẪN bắt được cái rãnh của TECH_DEBT #30 (0,113 trên nền 0,406)', r30.hố > NGƯỠNG_HỐ,
    `hố ${r30.hố.toFixed(3)} > ngưỡng ${NGƯỠNG_HỐ}`);

  // (6) ⚠️ ĐỐI CHỨNG: HAI MÀU KHÁC NHAU MÀ CÙNG ĐỘ SÁNG. Nhốt lại báo động giả thứ hai — bản đầu đo
  // `cách` bằng riêng độ sáng nên kêu "đường tàng hình" ở kỷ 7, nơi đường và đất khác nhau rõ về
  // SẮC. Ở đây đường xanh lam và đất nâu có độ sáng gần bằng nhau: phép đo cũ ra ~0, phép đo mới
  // phải thấy chúng cách xa nhau.
  const a6 = ảnh_giả(W, H, (x) => (x < 20 ? [40, 110, 150] : (x < 40 ? [150, 100, 30] : [0, 0, 0])));
  const r6 = chấm(a6, mn);
  báo('hai màu KHÁC SẮC mà cùng độ sáng vẫn được coi là đọc được',
    r6.cách < 0.05 && r6.sắc >= NGƯỠNG_ĐỌC,
    `chỉ độ sáng ${r6.cách.toFixed(3)} (phép đo cũ sẽ kêu tàng hình) nhưng cả màu ${r6.sắc.toFixed(3)}`);

  // (4) ⚠️ ĐỐI CHỨNG NHỐT BỘ MẶT NẠ HỎNG CŨ — CA QUAN TRỌNG NHẤT, VÌ NÓ LÀ CA ĐÃ THẬT SỰ CẮN.
  // Bản đầu của công cụ này phân loại bằng MỨC XÁM (255 = đường, 192 = đất). Tone mapping bóp hai
  // mức ấy thành 233 và 235, tức một tấm mặt nạ gần như XÁM ĐỀU — và bộ chấm cũ vẫn in ra một bảng
  // số đầy đủ. Ba ca trên KHÔNG bắt được, vì chúng cho ăn mặt nạ giả đúng chuẩn: chúng chứng minh
  // phép gom CHẠY, không chứng minh tấm mặt nạ THẬT hợp lệ. Ca này dựng lại đúng tấm mặt nạ hỏng ấy
  // rồi ĐÒI công cụ phải NÉM LỖI. Theo luật Phase 9A: mỗi ngưỡng phải kèm một đối chứng nhốt bộ số
  // hỏng cũ, nếu không ngưỡng sẽ bị nới dần cho tiện.
  const mnHỏng = ảnh_giả(W, H, (x) => {
    const v = x < 20 ? 233 : (x < 40 ? 235 : 0);      // đúng hai con số đã đo được trên tấm thật
    return [v, v, v];
  });
  let némLỗi = false;
  try { chấm(a1, mnHỏng); } catch { némLỗi = true; }
  báo('TỪ CHỐI tấm mặt nạ xám (bộ số hỏng cũ 233/235)', némLỗi,
    némLỗi ? 'ném lỗi đúng như phải thế' : 'VẪN CHẤM — công cụ đang nói dối y như bản cũ');

  console.log(`\n${ok ? "✓" : "✗"} phép đo ${ok ? "CHẠY ĐÚNG cả bảy chiều" : "HỎNG"}`);
  return ok;
}

// ── Chạy trực tiếp ───────────────────────────────────────────────────────────────────────────
// ⚠️ PHẢI CÓ CỔNG NÀY. Không có nó thì `import` file này từ một script khác sẽ CHẠY LUÔN phần CLI,
// thấy thiếu tham số rồi `process.exit(2)` — tức module vừa viết ra đã không dùng lại được, mà lý
// do thì trông y hệt một lỗi tham số của script đang gọi. Đã cắn thật ngay trong phiên viết nó.
const CHẠY_TRỰC_TIẾP = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
const argv = process.argv.slice(2);
if (!CHẠY_TRỰC_TIẾP) {
  // nạp làm thư viện — không làm gì cả
} else if (argv.includes('--selftest')) {
  console.log('TỰ KIỂM road-score:');
  process.exit(selftest() ? 0 : 1);
} else if (argv.length >= 2) {
  const [ảnhPath, mnPath] = argv;
  const r = chấm(decodePng(ảnhPath), decodePng(mnPath));
  if (r.nĐường === 0) throw new Error('mặt nạ không có điểm ảnh ĐƯỜNG nào — sai file mặt nạ?');
  if (r.nĐất === 0) throw new Error('mặt nạ không có điểm ảnh ĐẤT nào — thiếu `--mask road,ground`?');
  const rãnh = r.hố > NGƯỠNG_HỐ;
  const mờ = r.sắc < NGƯỠNG_ĐỌC;
  console.log(`${ảnhPath.split('/').pop()}`);
  console.log(`  đường ${r.đường.toFixed(3)} (${r.nĐường} điểm) · đất ${r.đất.toFixed(3)} (${r.nĐất} điểm)`);
  console.log(`  sắc   ${r.sắc.toFixed(3)}  ${mờ ? `✗ DƯỚI ${NGƯỠNG_ĐỌC} — mắt không tách được đường khỏi đất` : '✓'}`
    + `   (chỉ riêng độ sáng: ${r.cách.toFixed(3)})`);
  console.log(`  hố    ${r.hố.toFixed(3)}  ${rãnh ? `✗ VƯỢT ${NGƯỠNG_HỐ} — đường thủng xuống so với đất` : '✓'}`
    + `   (đáy đường ${r.đáy.toFixed(3)} · đáy đất ${r.đáyĐất.toFixed(3)})`);
  process.exit(rãnh || mờ ? 1 : 0);
} else {
  console.log('Dùng: node scripts/road-score.mjs <ảnh.png> <mặt-nạ.png>   |   --selftest');
  process.exit(2);
}
