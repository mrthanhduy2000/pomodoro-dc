/**
 * plan-coverage.mjs — MẶT BẰNG: nhà chiếm bao nhiêu phần TRĂM ĐẤT của thành phố?
 *
 * ⚠️ ĐÂY LÀ MỘT ĐẠI LƯỢNG KHÁC HẲN với "bao nhiêu phần trăm KHUNG HÌNH là nhà"
 * (`mask-count.mjs`). Hai con số ấy không được đem so với nhau, và chỉ một trong hai so được với
 * số liệu quy hoạch ngoài đời:
 *   · KHUNG HÌNH — phụ thuộc góc camera, độ cao nhà, bao nhiêu trời lọt vào khung. Nó trả lời
 *     *"Đàm nhìn màn hình thì thấy đông hay thưa?"*.
 *   · MẶT BẰNG — nhìn thẳng từ trên xuống, diện tích móng chia diện tích đất. Đây đúng định nghĩa
 *     **building coverage ratio** mà luật quy hoạch dùng (Nhật gọi là 建蔽率 *kenpeiritsu*, giới
 *     hạn 30–80% tuỳ khu; khu nhà ở thấp tầng thường 30–60%, khu thương mại tới 80%).
 *     ⇒ Muốn nói "thành phố của ta thưa hơn/đông hơn đời thật" thì phải dùng CON SỐ NÀY.
 *
 * Mẫu số là ĐẤT, không phải cả lưới: ô đường không phải chỗ để xây, nên tính chúng vào mẫu số là
 * tự làm loãng tỉ lệ (đúng bài học `TECH_DEBT #44` — mẫu số lẫn thứ không thuộc câu hỏi).
 *
 * Dùng:  node --import ./scripts/register-esm-loader.mjs scripts/plan-coverage.mjs [số-phiên...]
 *        node --import ./scripts/register-esm-loader.mjs scripts/plan-coverage.mjs --selftest
 *        node --import ./scripts/register-esm-loader.mjs scripts/plan-coverage.mjs --sai-so
 *          ↑ đo sai số của phép dùng HỘP BAO, so với phép tô ĐÚNG ĐA GIÁC ĐÁY từng khối.
 */

import { computeCityLayout } from '../src/engine/cityLayout.js';
import { collectCitySpecs } from '../src/engine/city3d/cityParts.js';
import { specBounds } from '../src/engine/city3d/pick.js';
import { daysGiacDay, trongDaGiac } from '../src/engine/city3d/footprint.js';
import { doDauVetNgoaiLuoi } from '../src/engine/city3d/humanTrace.js';
import { BLUEPRINT_CATALOG } from '../src/engine/constants.js';

const GRID = 12;
/** Chép từ `sceneGraph.js` — cùng lý do đã ghi ở `cityFocus.test.js`: file ấy `import 'three'`. */
const BUILDING_SCALE = 1.3;

/** Diện tích móng (ô lưới vuông) của một mô tả khối, đã nhân tỉ lệ dựng. */
export function footprintArea(spec, scale) {
  const b = specBounds(spec);
  if (!b) return 0;
  return ((b.maxX - b.minX) * scale) * ((b.maxZ - b.minZ) * scale);
}

/**
 * ⚠️ CỘNG DIỆN TÍCH TỪNG MÓNG LÀ SAI — PHẢI LẤY HỢP (union), VÌ MÓNG CHỒNG LÊN NHAU.
 * Bản đầu của file này cộng thẳng `footprintArea` của từng công trình và cho ra **109,9% ở kỷ 6**
 * — một con số tự tố cáo chính nó (không thể phủ hơn 100% mặt đất). Nguyên nhân: nhiều công trình
 * RỘNG HƠN ô đất của nó (`TECH_DEBT #21`: rộng nhất 3,687 ô trên khu đất 3 ô), nên hộp bao của
 * chúng chồng lấn và phép cộng đếm hai lần. Cách đúng là **tô lên một lưới mịn rồi đếm ô đã tô**:
 * chồng bao nhiêu lần cũng chỉ tính một.
 * Lưới 8 mẫu/ô ⇒ mỗi mẫu 1/64 ô; sai số làm tròn dưới nửa phần trăm, đủ xa mọi kết luận ở đây.
 */
const MAU_MOI_O = 8;

/**
 * ⚠️ BẢN CŨ — GIỮ LẠI CHỈ ĐỂ LÀM MỐC ĐỐI CHỨNG, ĐỪNG TRÍCH SỐ TỪ ĐÂY (2026-08-19).
 * Nó nói quá **11,10 điểm phần trăm trung bình, tới 24,12 đpt** so với phép đo đúng, vì HAI lý do
 * (đo tách bạch bằng `--sai-so`; thứ ba, hình của từng khối, hoá ra không đáng kể):
 *   · **6,11 đpt** — luật tô "ô mẫu bị CHẠM VÀO là tô trọn". Một cạnh rơi giữa hai ô mẫu vẫn ăn
 *     trọn ô; phần dôi nằm ở RÌA NGOÀI nên phép lấy hợp không xoá đi được, và nó cộng ở cả bốn
 *     cạnh của mọi khối. Đây KHÔNG phải sai số hộp bao — đây là sai số của chính cái bút vẽ.
 *   · **4,86 đpt** — tô hộp bao của CẢ công trình, nên khoảng sân giữa bốn tháp góc bị tính là nhà.
 *   · **0,13 đpt** — hình thật của từng khối (trụ tròn, tháp thóp, khối xoay). Không đáng kể ⇒
 *     phần cố vấn dự đoán là "nguồn sai số" hoá ra là phần duy nhất không đáng lo.
 * Bản đúng ở ngay dưới. Đừng xoá hàm này: `--sai-so` cần nó để chứng minh bộ tô mới TÁI LẬP được
 * con số cũ, tức mọi hiệu số in ra là chênh lệch thật chứ không phải "hai công cụ khác nhau".
 */
export function planCoverageCu(era, sessionCount) {
  const built = (BLUEPRINT_CATALOG[era] ?? []).map((bp) => bp.id);
  const levels = Object.fromEntries(built.map((id) => [id, 3]));
  const layout = computeCityLayout({ built, levels, era, stats: { sessionCount, streakLength: 9 } });

  const N = GRID * MAU_MOI_O;
  const toNha = new Uint8Array(N * N);
  const toCanhVat = new Uint8Array(N * N);
  let soNha = 0;
  const toLen = (b, cx, cy, scale, dich) => {
    // Hộp bao của mô tả là toạ độ ĐỊA PHƯƠNG quanh gốc khối; đưa về toạ độ ô lưới rồi tô.
    const x0 = (cx + 0.5 + b.minX * scale) * MAU_MOI_O;
    const x1 = (cx + 0.5 + b.maxX * scale) * MAU_MOI_O;
    const y0 = (cy + 0.5 + b.minZ * scale) * MAU_MOI_O;
    const y1 = (cy + 0.5 + b.maxZ * scale) * MAU_MOI_O;
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(N, Math.ceil(y1)); y += 1) {
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(N, Math.ceil(x1)); x += 1) dich[y * N + x] = 1;
    }
  };
  for (const item of collectCitySpecs({ layout, detail: 'high' })) {
    const b = specBounds(item.spec);
    if (!b) continue;
    const src = item.source;
    if (item.kind === 'prop') {
      toLen(b, src.x + (src.ox ?? 0), src.y + (src.oy ?? 0), 1, toCanhVat);
      continue;
    }
    toLen(b, src.x, src.y, BUILDING_SCALE, toNha);
    soNha += 1;
  }
  const dem = (arr) => arr.reduce((a, v) => a + v, 0);
  const oDuong = (layout.props ?? []).filter((p) => p.kind === 'road').length;
  const datO = GRID * GRID - oDuong;
  const mauMoiO = MAU_MOI_O * MAU_MOI_O;
  return {
    era, sessionCount, soNha, oDuong, datO,
    phuNha: dem(toNha) / mauMoiO / datO,
    phuCanhVat: dem(toCanhVat) / mauMoiO / datO,
  };
}

/* ══════════════════════════════════════════════════════════════════════════════════════════════
 * SAI SỐ CỦA PHÉP DÙNG HỘP BAO — đo MỘT LẦN rồi đóng lại (2026-08-19)
 *
 * `planCoverage` ở trên tô **hộp bao của CẢ công trình**. Nó nói quá theo hai đường:
 *   (1) KHE GIỮA CÁC KHỐI — một kỳ quan bốn tháp góc thì hộp bao gộp cả khoảng sân ở giữa;
 *   (2) HÌNH CỦA TỪNG KHỐI — trụ tròn (`sides` lớn), tháp thóp dần, khối xoay `ry` đều nhỏ hơn
 *       cái hộp ôm lấy nó.
 *
 * ⚠️ CỐ VẤN ĐỀ NGHỊ ĐO SAI SỐ NÀY "so với `--mask`" — TIỀN ĐỀ ẤY KHÔNG ĐỨNG, và chính đầu file
 * này đã ghi vì sao: `--mask` đo **phần KHUNG HÌNH**, còn đây đo **phần MẶT BẰNG**. Hai đại lượng
 * khác nhau (25,0% với 48,8% ở cùng một thành phố 50 phiên) nên hiệu của chúng không nói được gì
 * về sai số hộp bao — nó chỉ nói camera đang nhìn xiên. Muốn biết hộp bao nói quá bao nhiêu thì
 * phải đo **cùng một đại lượng bằng một đường khác**, và đường khác ấy là: tô đúng ĐA GIÁC ĐÁY
 * của TỪNG khối thay vì tô hộp bao của cả công trình.
 *
 * Đa giác đáy chép đúng công thức vành đỉnh của `emitPrism` (`geometryFactory.js`) — KHÔNG diễn
 * đạt lại bằng một công thức "tương đương", vì hai công thức tương đương trên giấy thì gần như
 * luôn lệch nhau ở biên (bài học "một luật một công thức"). `gable` là hộp trong mặt bằng nên đáy
 * của nó đúng bằng hộp bao.
 *
 * KẾT QUẢ ĐÃ ĐO — xem bảng in ra bởi `--sai-so`. Tóm tắt ở cuối file này.
 * ══════════════════════════════════════════════════════════════════════════════════════════════ */

// ⚠️ HAI HÀM HÌNH HỌC ĐÁY ĐÃ DỜI XUỐNG `src/engine/city3d/footprint.js` (Phase 13 VIỆC B).
// Lý do: Phase 13 cần ĐÚNG phép ấy ở tầng engine để đo "dấu vết con người ngoài lưới", mà engine
// không được `import` ngược lên `scripts/`. Chép lại là tạo một luật hai công thức — đúng thứ đã
// khiến `plinth-tri.mjs` đếm 3 bệ thay vì 31. Xuất lại ở đây để mọi chỗ đang gọi vẫn đúng, và để
// `planCoverage.test.js` (đang nhập từ file này) không phải đổi.
export { daysGiacDay, trongDaGiac };

/** `num` vẫn dùng ở `planCoverageTheoCach` bên dưới nên giữ lại bản cục bộ. */
const num = (v, fb = 0) => (Number.isFinite(v) ? v : fb);

/**
 * Cùng câu hỏi với `planCoverage`, nhưng tô theo NHIỀU cách để TÁCH được sai số ra từng nguồn.
 *
 * Hai trục độc lập:
 *   `hinh` — tô hình gì:  'toaNha' hộp bao CẢ công trình · 'khoi' hộp bao TỪNG khối ·
 *                          'daGiac' đa giác đáy THẬT từng khối
 *   `luat` — tô thế nào:  'bao' ô mẫu nào bị hình CHẠM VÀO là tô (đúng luật `planCoverage` đang
 *                          dùng) · 'tam' chỉ tô ô mẫu có TÂM nằm trong hình
 *
 * ⚠️ `bao` nói quá một cách CÓ HỆ THỐNG: một cạnh rơi vào giữa hai ô mẫu vẫn tô trọn cả ô. Với
 * lưới 8 mẫu/ô và công trình rộng ~1,3 ô thì mỗi cạnh dôi tối đa nửa ô mẫu — nghe nhỏ, nhưng nó
 * cộng ở CẢ BỐN cạnh của MỌI khối, và phép lấy hợp không xoá đi được vì phần dôi nằm ở rìa ngoài.
 * `tam` là ước lượng không thiên lệch (ô được tính khi và chỉ khi tâm nó bị phủ).
 */
export function planCoverageTheoCach(era, sessionCount, {
  hinh = 'daGiac', luat = 'tam', mauMoiO = MAU_MOI_O, epVuong = false, loai = 'nha',
} = {}) {
  const built = (BLUEPRINT_CATALOG[era] ?? []).map((bp) => bp.id);
  const levels = Object.fromEntries(built.map((id) => [id, 3]));
  const layout = computeCityLayout({ built, levels, era, stats: { sessionCount, streakLength: 9 } });

  const N = GRID * mauMoiO;
  const to = new Uint8Array(N * N);

  /** Luật `bao` — CHÉP NGUYÊN phép tô của `planCoverage` để hai bên không lệch vì cách làm tròn. */
  const toHopBao = (x0, x1, z0, z1) => {
    for (let y = Math.max(0, Math.floor(z0)); y < Math.min(N, Math.ceil(z1)); y += 1) {
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(N, Math.ceil(x1)); x += 1) to[y * N + x] = 1;
    }
  };
  /** Luật `tam` — tô đa giác bất kỳ, chỉ nhận ô mẫu có tâm nằm trong. */
  const toTam = (poly) => {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [x, z] of poly) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (z < z0) z0 = z; if (z > z1) z1 = z;
    }
    for (let y = Math.max(0, Math.floor(z0)); y < Math.min(N, Math.ceil(z1)); y += 1) {
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(N, Math.ceil(x1)); x += 1) {
        if (trongDaGiac(x + 0.5, y + 0.5, poly)) to[y * N + x] = 1;
      }
    }
  };

  let soKhoi = 0;
  for (const item of collectCitySpecs({ layout, detail: 'high' })) {
    // `loai` chọn hỏi về NHÀ hay về CẢNH VẬT — hai lớp không bao giờ trộn vào một lưới.
    if ((item.kind === 'prop') !== (loai === 'canhVat')) continue;
    soKhoi += 1;
    const src = item.source;
    // Cảnh vật đứng lệch trong ô (`ox`/`oy`) và KHÔNG nhân tỉ lệ dựng — chép đúng quy ước bản cũ.
    const ti = loai === 'canhVat' ? 1 : BUILDING_SCALE;
    const cx0 = src.x + (loai === 'canhVat' ? (src.ox ?? 0) : 0);
    const cy0 = src.y + (loai === 'canhVat' ? (src.oy ?? 0) : 0);
    const veThe = ([x, z]) => [(cx0 + 0.5 + x * ti) * mauMoiO, (cy0 + 0.5 + z * ti) * mauMoiO];
    /** Một hộp trục-song-song, đưa vào đúng luật tô đang chọn. */
    const noHop = (cx, cz, hw, hd) => {
      if (luat === 'bao') {
        const [a0, b0] = veThe([cx - hw, cz - hd]);
        const [a1, b1] = veThe([cx + hw, cz + hd]);
        toHopBao(a0, a1, b0, b1);
      } else {
        toTam([[cx - hw, cz - hd], [cx + hw, cz - hd], [cx + hw, cz + hd], [cx - hw, cz + hd]].map(veThe));
      }
    };

    if (hinh === 'toaNha') {
      const b = specBounds(item.spec);
      if (!b) continue;
      noHop((b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2, (b.maxX - b.minX) / 2, (b.maxZ - b.minZ) / 2);
      continue;
    }
    for (const part of (Array.isArray(item.spec?.parts) ? item.spec.parts : [])) {
      if (!part) continue;
      // `epVuong` CHỈ dùng cho đối chứng: ép mọi khối thành hộp vuông không xoay, lúc đó hai cách
      // tô hình `khoi`/`daGiac` bắt buộc phải ra lưới y hệt nhau.
      const kh = epVuong ? { ...part, shape: 'prism', sides: 4, ry: 0 } : part;
      if (hinh === 'khoi') {
        // `specBounds` bỏ qua `ry` một cách CÓ CHỦ Ý (xem `pick.js`) — giữ nguyên quy ước ấy ở đây
        // để hiệu `toaNha − khoi` đúng là "khe giữa các khối", không lẫn phần xoay.
        noHop(num(kh.x), num(kh.z), Math.max(0, num(kh.w)) / 2, Math.max(0, num(kh.d, num(kh.w))) / 2);
      } else if (luat === 'bao') {
        const poly = daysGiacDay(kh);
        const xs = poly.map((q) => q[0]), zs = poly.map((q) => q[1]);
        const [a0, b0] = veThe([Math.min(...xs), Math.min(...zs)]);
        const [a1, b1] = veThe([Math.max(...xs), Math.max(...zs)]);
        toHopBao(a0, a1, b0, b1);
      } else {
        toTam(daysGiacDay(kh).map(veThe));
      }
    }
  }
  const oDuong = (layout.props ?? []).filter((p) => p.kind === 'road').length;
  const datO = GRID * GRID - oDuong;
  return {
    era, sessionCount, luoi: to, soKhoi, oDuong, datO,
    phuNha: to.reduce((a, v) => a + v, 0) / (mauMoiO * mauMoiO) / datO,
  };
}

/**
 * ⭐ BẢN ĐÚNG — dùng hàm này. Tô **đa giác đáy THẬT của từng khối**, luật **tâm ô mẫu**.
 *
 * Lưới 16 mẫu/ô (không phải 8): ở 8 mẫu phép đo còn nói quá ~0,8 đpt so với 16, mà chi phí thì
 * không đo được. Đừng hạ xuống cho nhanh.
 *
 * ⚠️ Số của hàm này **THẤP HƠN** bộ số ghi trước 2026-08-19 chừng 6–16 đpt. KHÔNG phải thành phố
 * thưa đi — là phép đo cũ nói quá (xem chú thích của `planCoverageCu`). Hai bộ số đo hai đại
 * lượng khác nhau ⇒ **không so trực tiếp được**, đúng cách `TECH_DEBT #22` và `#49` đã xử lý.
 */
export function planCoverage(era, sessionCount) {
  const nha = planCoverageTheoCach(era, sessionCount, { hinh: 'daGiac', luat: 'tam', mauMoiO: 16 });
  const canhVat = planCoverageTheoCach(era, sessionCount, {
    hinh: 'daGiac', luat: 'tam', mauMoiO: 16, loai: 'canhVat',
  });
  return {
    era, sessionCount,
    soNha: nha.soKhoi, oDuong: nha.oDuong, datO: nha.datO,
    phuNha: nha.phuNha,
    phuCanhVat: canhVat.phuNha,
  };
}

if (process.argv.includes('--sai-so')) {
  const pct = (era, m, o) => planCoverageTheoCach(era, m, o).phuNha * 100;

  // ── ĐỐI CHỨNG 1 — hình học đa giác. Mỗi ca chạm ĐÚNG MỘT chiều phép đo tuyên bố nhìn thấy. ──
  const dienTich = (poly) => {
    let a = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
      a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]);
    }
    return Math.abs(a) / 2;
  };
  const vuong = dienTich(daysGiacDay({ shape: 'prism', x: 0, z: 0, w: 1, d: 1, sides: 4, ry: 0 }));
  if (Math.abs(vuong - 1) > 1e-9) throw new Error(`đối chứng hỏng: hộp vuông ra ${vuong}, phải là 1`);
  const tron = dienTich(daysGiacDay({ shape: 'prism', x: 0, z: 0, w: 1, d: 1, sides: 64, ry: 0 }));
  if (Math.abs(tron - Math.PI / 4) > 0.002) throw new Error(`đối chứng hỏng: trụ tròn ra ${tron}, phải ≈ ${Math.PI / 4}`);
  const xoay45 = daysGiacDay({ shape: 'prism', x: 0, z: 0, w: 1, d: 1, sides: 4, ry: Math.PI / 4 });
  const hopXoay = (Math.max(...xoay45.map((q) => q[0])) - Math.min(...xoay45.map((q) => q[0]))) ** 2;
  if (Math.abs(hopXoay - 2) > 1e-6) throw new Error(`đối chứng hỏng: hộp bao của vuông xoay 45° ra ${hopXoay}, phải là 2`);

  // ── ĐỐI CHỨNG 2 — bộ tô mới phải TÁI LẬP ĐÚNG con số cũ ở đúng tổ hợp mà nó mô phỏng. ──
  // Không có vế này thì mọi hiệu số bên dưới có thể chỉ là "hai công cụ khác nhau", chứ chưa
  // chứng minh được nguồn nào sinh ra chênh lệch nào.
  for (const e of [1, 7, 15]) {
    const cu = planCoverageCu(e, 50).phuNha * 100;
    const moi = pct(e, 50, { hinh: 'toaNha', luat: 'bao' });
    if (Math.abs(cu - moi) > 1e-9) throw new Error(`đối chứng hỏng: kỷ ${e} bản cũ ${cu} ≠ bản mới ${moi}`);
  }
  // ── ĐỐI CHỨNG 3 — hai cách tô HÌNH phải khớp ở chỗ chúng buộc phải khớp (mọi khối là hộp vuông). ──
  for (const e of [1, 6, 11, 15]) {
    const a = planCoverageTheoCach(e, 50, { hinh: 'khoi', epVuong: true }).luoi;
    const b = planCoverageTheoCach(e, 50, { hinh: 'daGiac', epVuong: true }).luoi;
    let lech = 0;
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) lech += 1;
    if (lech) throw new Error(`đối chứng hỏng: kỷ ${e} ép-vuông vẫn lệch ${lech} ô mẫu giữa 'khoi' và 'daGiac'`);
  }
  console.log(`✓ đối chứng 1 (hình học): vuông 1,000 · tròn ${tron.toFixed(4)} (π/4 = ${(Math.PI / 4).toFixed(4)}) · hộp bao vuông-xoay-45° gấp ${hopXoay.toFixed(3)} lần`);
  console.log('✓ đối chứng 2 (tái lập): bộ tô mới ở tổ hợp "hộp bao cả công trình + luật bao" ra ĐÚNG con số cũ, 3 kỷ');
  console.log('✓ đối chứng 3 (khớp nhau): ép mọi khối thành hộp vuông ⇒ hai cách tô hình ra lưới GIỐNG HỆT, 4 kỷ');

  const NAC = [
    ['A bản CŨ    (hộp bao CẢ công trình · luật bao)', { hinh: 'toaNha', luat: 'bao' }],
    ['B đổi LUẬT TÔ            (… · luật tâm)', { hinh: 'toaNha', luat: 'tam' }],
    ['C bỏ KHE GIỮA KHỐI (hộp bao TỪNG khối · tâm)', { hinh: 'khoi', luat: 'tam' }],
    ['D bản ĐÚNG  (đa giác đáy thật · luật tâm)', { hinh: 'daGiac', luat: 'tam' }],
  ];
  const MOC2 = [20, 50, 80];
  console.log('\n         A→D: bóc từng nguồn nói-quá (đơn vị: % ĐẤT bị nhà che, nhìn từ trên xuống)');
  // ⚠️ CẢ BỐN NẤC ĐO Ở LƯỚI 8 MẪU/Ô, vì nấc A phải TÁI LẬP ĐÚNG con số bản cũ (bản cũ dùng 8).
  //    `planCoverage` mặc định thì chạy lưới 16 ⇒ cột D ở đây cao hơn số mặc định ~0,3–0,5 đpt.
  //    Đó KHÔNG phải mâu thuẫn — là hai độ mịn khác nhau, và phép kiểm độ mịn ở cuối nói rõ.
  console.log('         (bốn nấc đo ở lưới 8 mẫu/ô để nấc A khớp bản cũ; mặc định của planCoverage là 16)');
  console.log('kỷ |' + MOC2.map((m) => `  ${String(m).padStart(3)}p:    A     B     C     D`).join(' |'));
  const cot = { AB: [], BC: [], CD: [], AD: [] };
  for (let era = 1; era <= 15; era += 1) {
    const o = [];
    for (const m of MOC2) {
      const v = NAC.map(([, opt]) => pct(era, m, opt));
      cot.AB.push(v[0] - v[1]); cot.BC.push(v[1] - v[2]); cot.CD.push(v[2] - v[3]); cot.AD.push(v[0] - v[3]);
      o.push(v.map((x) => `${x.toFixed(1).padStart(5)}`).join(' '));
    }
    console.log(`${String(era).padStart(2)} |  ${o.join(' |  ')}`);
  }
  const tb = (v) => v.reduce((a, b) => a + b, 0) / v.length;
  console.log(`\nTỔNG A→D: trung bình ${tb(cot.AD).toFixed(2)} điểm phần trăm, lớn nhất ${Math.max(...cot.AD).toFixed(2)} (trên ${cot.AD.length} ô đo)`);
  console.log(`  A→B do LUẬT TÔ "chạm là tô"     : trung bình ${tb(cot.AB).toFixed(2)} đpt`);
  console.log(`  B→C do KHE GIỮA CÁC KHỐI        : trung bình ${tb(cot.BC).toFixed(2)} đpt`);
  console.log(`  C→D do HÌNH CỦA TỪNG KHỐI       : trung bình ${tb(cot.CD).toFixed(2)} đpt`);
  for (const m of MOC2) {
    const a = tb(Array.from({ length: 15 }, (_, i) => pct(i + 1, m, NAC[0][1])));
    const d = tb(Array.from({ length: 15 }, (_, i) => pct(i + 1, m, NAC[3][1])));
    console.log(`trung bình 15 kỷ @ ${String(m).padStart(3)} phiên:  A ${a.toFixed(1)}%  →  D ${d.toFixed(1)}%`);
  }
  const min16 = Math.max(...[7, 11, 15].map((e) => pct(e, 50, { hinh: 'toaNha', luat: 'bao' }) - pct(e, 50, { hinh: 'daGiac', luat: 'tam', mauMoiO: 16 })));
  console.log(`kiểm độ mịn (lưới 16 mẫu/ô, kỷ 7/11/15 @ 50 phiên): A−D lớn nhất ${min16.toFixed(2)} đpt — kết luận không đổi theo độ mịn`);
  process.exit(0);
}

if (process.argv.includes('--selftest')) {
  // Một khối 1×1 trên đúng 1 ô đất phải ra 100%; nhân đôi bề ngang phải ra GẤP BỐN diện tích.
  const spec = { parts: [{ x: 0, z: 0, w: 1, d: 1, h: 1 }] };
  const a = footprintArea(spec, 1);
  const b = footprintArea(spec, 2);
  if (Math.abs(a - 1) > 1e-9) throw new Error(`selftest hỏng: khối 1×1 ra ${a}`);
  if (Math.abs(b - 4) > 1e-9) throw new Error(`selftest hỏng: nhân đôi tỉ lệ ra ${b}, phải là 4`);
  // ĐỐI CHỨNG — thành phố càng nhiều phiên thì phần đất bị nhà chiếm phải TĂNG (nhà dân mọc thêm).
  // Không có vế này thì một hàm trả hằng số cũng "xanh".
  const tre = planCoverage(7, 20).phuNha;
  const gia = planCoverage(7, 80).phuNha;
  if (!(gia > tre)) throw new Error(`selftest hỏng: 80 phiên (${gia}) không đông hơn 20 phiên (${tre})`);
  // ⚠️ ĐỐI CHỨNG QUAN TRỌNG NHẤT — phép lấy HỢP không được vượt 100% ở BẤT KỲ kỷ/mốc nào. Chính
  // con số 109,9% của bản cộng-dồn là thứ lộ ra rằng bản ấy sai; nếu không có dòng này thì bản
  // sau có thể lặng lẽ quay về phép cộng mà không ai hay.
  for (let e = 1; e <= 15; e += 1) {
    for (const m of [20, 50, 80, 200]) {
      const v = planCoverage(e, m).phuNha;
      if (v > 1.0000001) throw new Error(`selftest hỏng: kỷ ${e} @ ${m} phiên phủ ${(v * 100).toFixed(1)}% — đang cộng chồng`);
    }
  }
  console.log(`✓ selftest: diện tích đúng bậc hai của tỉ lệ; kỷ 7 đi từ ${(tre * 100).toFixed(1)}% lên ${(gia * 100).toFixed(1)}%; không kỷ nào vượt 100%`);
  process.exit(0);
}

/**
 * ⚠️ CHẾ ĐỘ `--dau-chan`: CỔNG (G1) CỦA PHASE 13 — *"bao nhiêu DẤU VẾT CON NGƯỜI nằm NGOÀI lưới?"*
 *
 * Đặt ở đây chứ không ở một công cụ thứ hai, vì nó dùng đúng bộ khung mà file này đã dựng: cùng
 * `computeCityLayout`, cùng `collectCitySpecs`, cùng mốc phiên. Một công cụ thứ hai sẽ phải chép
 * lại cả ba, và bài học `plinth-tri.mjs` còn rất mới — một hằng số chép tay (`BUILDING_SCALE`
 * 0,86 thay vì 1,3) làm nó đếm 3 bệ thay vì 31, im lặng tuyệt đối.
 *
 * ⚠️ ĐÂY LÀ ĐƠN VỊ **SỐ VẬT + DIỆN TÍCH MẶT BẰNG**, KHÔNG PHẢI % KHUNG HÌNH. Hai đơn vị ấy đã có
 * tiền lệ lệch nhau (xem khối chú thích đầu file), nên (G1) đòi CẢ HAI: cột này, và `mask-count`
 * đếm điểm ảnh. Chọn một là tự cho mình quyền đọc con số dễ hơn.
 */
if (process.argv.includes('--dau-chan')) {
  const MOC_G1 = 80;
  console.log('kỷ | vật ngoài lưới / tổng vật người | diện tích (ô²) | xa nhất (ô) | loại');
  let tongNgoai = 0, tongDT = 0;
  for (let era = 1; era <= 15; era += 1) {
    const ids = BLUEPRINT_CATALOG[era].map((b) => b.id);
    const layout = computeCityLayout({
      built: ids, levels: Object.fromEntries(ids.map((i) => [i, 3])), era,
      stats: { sessionCount: MOC_G1, streakLength: 9 },
    });
    const r = doDauVetNgoaiLuoi({ items: collectCitySpecs({ layout, detail: 'high' }), gridSize: GRID });
    tongNgoai += r.soVat; tongDT += r.dienTich;
    const loai = Object.entries(r.theoLoai).sort((a, b) => b[1] - a[1])
      .slice(0, 4).map(([k, n]) => `${k}×${n}`).join(' ');
    console.log(`${String(era).padStart(2)} | ${String(r.soVat).padStart(6)} / ${String(r.soVatTong).padStart(4)}`
      + ` | ${r.dienTich.toFixed(1).padStart(14)} | ${r.xaNhat.toFixed(2).padStart(11)} | ${loai}`);
  }
  console.log(`\nTỔNG 15 kỷ: ${tongNgoai} vật ngoài lưới · ${tongDT.toFixed(1)} ô² · `
    + `trung bình ${(tongNgoai / 15).toFixed(1)} vật/kỷ`);
  process.exit(0);
}

const mocs = process.argv.slice(2).filter((a) => !a.startsWith('--')).map(Number);
const MOC = mocs.length ? mocs : [20, 50, 80];
console.log('kỷ | ' + MOC.map((m) => `${m} phiên`.padStart(9)).join(' | ') + ' |  ô đường | số khối (80 phiên)');
for (let era = 1; era <= 15; era += 1) {
  const hang = MOC.map((m) => `${(planCoverage(era, m).phuNha * 100).toFixed(1)}%`.padStart(9));
  const cuoi = planCoverage(era, MOC[MOC.length - 1]);
  console.log(`${String(era).padStart(2)} | ${hang.join(' | ')} | ${String(cuoi.oDuong).padStart(8)} | ${cuoi.soNha}`);
}
for (const m of MOC) {
  const tb = Array.from({ length: 15 }, (_, i) => planCoverage(i + 1, m).phuNha).reduce((a, b) => a + b, 0) / 15;
  console.log(`trung bình 15 kỷ ở ${m} phiên: ${(tb * 100).toFixed(1)}%`);
}
