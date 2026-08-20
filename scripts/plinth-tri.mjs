/**
 * ĐẾM RIÊNG **BỆ KÈ** — phép ĐỐI CHIẾU CHÉO cho `scene-tri.mjs`.
 *
 * ⚠️ VÌ SAO TỒN TẠI. Khi một phase đụng vào ĐỊA HÌNH, `scene-tri.mjs` cho ra một con số tổng
 * ("thành phố kỷ 7 mất 84 tam giác") mà không nói mất ở đâu. Trong cả cảnh chỉ có đúng MỘT thứ mà
 * số lượng lẫn kích thước phụ thuộc cao độ: **bệ kè** (`groundPlacement` trong `sceneGraph.js`,
 * sinh ra khi mặt bằng một công trình vắt qua chỗ đất hụt). Công cụ này đếm riêng chúng bằng một
 * đường **hoàn toàn độc lập** — không chạm three, không dựng scene: nó hỏi thẳng
 * `terrain.footprint(...)` rồi hỏi `countSpecTriangles` xem lăng trụ ấy tốn bao nhiêu.
 *
 * Hai phép đo phải ra **CÙNG một chênh lệch ở cả 15 kỷ**. Lệch nhau thì **chỗ lệch chính là chỗ
 * hỏng** — đừng chọn bên nghe hợp ý.
 *
 * ⚠️ **KHÔNG NHÂN VỚI MỘT HẰNG SỐ TAM GIÁC/BỆ.** Từ Phase 8B số tam giác của một khối phụ thuộc
 * KÍCH THƯỚC của chính nó. Bản đếm đầu tiên hồi `PERFORMANCE.md` nhân với 12 và ra một con số sai
 * mà vẫn rất thuyết phục.
 *
 * ⚠️ **VÀ CHÍNH CÔNG CỤ NÀY ĐÃ NÓI DỐI MỘT LẦN, VÌ MỘT HẰNG SỐ CHÉP TAY** (2026-08-20). Bản đầu
 * viết `const BUILDING_SCALE = 0.86` — số CŨ, chép từ trí nhớ. Giá trị thật trong `sceneGraph.js`
 * là **1.3**, và `span` sai thì `footprint` trả về một ô khác ⇒ nó đếm được **3 bệ thay vì 31**,
 * rồi in ra một bảng 15 dòng trông hoàn toàn bình thường. Thứ bắt được là đúng phép đối chiếu chéo
 * ở trên (bảng bệ nói +16, `scene-tri` nói −176). Nay hằng số được **ĐỌC TỪ MÃ NGUỒN**, nên chỉ có
 * một chỗ giữ con số ấy.
 *
 * Dùng: node --import ./scripts/register-esm-loader.mjs scripts/plinth-tri.mjs
 * Mặc định trùng `scene-tri.mjs`/`city-preview.mjs`: giờ 12 · 40 phiên · cấp 3 · chuỗi 9.
 */
import { readFileSync } from 'node:fs';
import { computeCityLayout } from '../src/engine/cityLayout.js';
import { collectCitySpecs } from '../src/engine/city3d/cityParts.js';
import { buildTerrain } from '../src/engine/city3d/terrain.js';
import { prism, countSpecTriangles, specSpan } from '../src/engine/city3d/parts.js';
import { BLUEPRINT_CATALOG } from '../src/engine/constants.js';

// ⚠️ KHÔNG CHÉP CON SỐ. `BUILDING_SCALE` là hằng số riêng của `sceneGraph.js` (không export), nên
// đọc thẳng từ MÃ NGUỒN — chép tay ra một bản thứ hai là đúng bẫy "một luật hai công thức", và
// bản đầu của chính phép đo này đã chép nhầm 0,86 (số cũ) nên nó đếm sót 2/5 bệ mà vẫn in ra một
// bảng trông rất hợp lý.
const SRC = readFileSync(new URL('../src/components/city/render3d/sceneGraph.js', import.meta.url), 'utf8');
const M = SRC.match(/^const BUILDING_SCALE = ([\d.]+);/m);
if (!M) throw new Error('không đọc được BUILDING_SCALE từ sceneGraph.js');
const BUILDING_SCALE = Number(M[1]);
const CO_BE = new Set(['building', 'scaffold', 'dwelling']);
let tong = 0, tongBe = 0, duyet = 0;
const rows = [];
for (let era = 1; era <= 15; era += 1) {
  const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  const levels = Object.fromEntries(built.map((id) => [id, 3]));
  const layout = computeCityLayout({ built, levels, era, stats: { sessionCount: 40, streakLength: 9 } });
  const terrain = buildTerrain({ era, gridSize: layout.gridSize });
  let be = 0, tri = 0;
  for (const item of collectCitySpecs({ layout, detail: 'high' })) {
    if (!CO_BE.has(item.kind)) continue;
    duyet += 1;
    const span = Math.max(1, Math.round(specSpan(item.spec.parts) * BUILDING_SCALE));
    const { drop } = terrain.footprint(item.source.x, item.source.y, span);
    if (!(drop > 0)) continue;
    be += 1;
    tri += countSpecTriangles([prism({
      y: 0, w: span * 0.92, d: span * 0.92, h: drop, sides: 4, taper: 1, role: 'stone',
    })]);
  }
  rows.push(`${era}\t${be}\t${tri}`);
  tong += tri; tongBe += be;
}
if (duyet < 100) throw new Error(`GÁC CHẠY-RỖNG: chỉ duyệt ${duyet} khối — quần thể sai hình dạng`);
console.log(`BUILDING_SCALE đọc từ sceneGraph.js = ${BUILDING_SCALE}`);
console.log('kỷ\tsố bệ\ttam giác bệ');
console.log(rows.join('\n'));
console.log(`TỔNG\t${tongBe}\t${tong}\t(duyệt ${duyet} khối)`);
