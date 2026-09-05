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
import { computeCityLayout } from '../src/engine/cityLayout.js';
import { collectCitySpecs } from '../src/engine/city3d/cityParts.js';
import { buildTerrain } from '../src/engine/city3d/terrain.js';
import { BUILDING_SCALE, buildingSpanCells, countSpecTriangles, plinthParts } from '../src/engine/city3d/parts.js';
import { BLUEPRINT_CATALOG } from '../src/engine/constants.js';

// ⚠️ KHÔNG CHÉP CON SỐ. Bản đầu của chính phép đo này chép tay `BUILDING_SCALE = 0,86` (giá trị đời
// cũ) nên nó đếm 3 bệ thay vì 31 mà vẫn in ra một bảng trông hoàn toàn bình thường (2026-08-20).
// Bản vá lúc ấy là đọc hằng số từ MÃ NGUỒN `sceneGraph.js` bằng regex; từ 2026-08-21 hằng số đã
// chuyển về `parts.js` (tầng THUẦN) nên nay `import` thẳng — không regex, không bản chép nào nữa.
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
    // ⚠️ BẢN CHÉP TAY ĐÃ GỠ (2026-09-05). Phép đổi ô đất và hình bệ kè nay là hai hàm THUẦN dùng
    // chung với `sceneGraph.js` (bên DỰNG) và `triangleBudget.test.js` (bên CANH) — trước đó
    // chúng là bản chép thứ hai của cùng một luật, và bản chép ấy đã sai một lần rồi.
    const span = buildingSpanCells(item.spec.parts);
    const { drop } = terrain.footprint(item.source.x, item.source.y, span);
    const beKe = plinthParts(span, drop);
    if (!beKe) continue;
    be += 1;
    tri += countSpecTriangles(beKe);
  }
  rows.push(`${era}\t${be}\t${tri}`);
  tong += tri; tongBe += be;
}
if (duyet < 100) throw new Error(`GÁC CHẠY-RỖNG: chỉ duyệt ${duyet} khối — quần thể sai hình dạng`);
console.log(`BUILDING_SCALE import từ parts.js = ${BUILDING_SCALE}`);
console.log('kỷ\tsố bệ\ttam giác bệ');
console.log(rows.join('\n'));
console.log(`TỔNG\t${tongBe}\t${tong}\t(duyệt ${duyet} khối)`);
