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
 */

import { computeCityLayout } from '../src/engine/cityLayout.js';
import { collectCitySpecs } from '../src/engine/city3d/cityParts.js';
import { specBounds } from '../src/engine/city3d/pick.js';
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

export function planCoverage(era, sessionCount) {
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
