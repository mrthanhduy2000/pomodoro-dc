/**
 * scene-count.mjs — ĐẾM TAM GIÁC + LỆNH VẼ CỦA CẢ 15 KỶ, KHÔNG CẦN CHROMIUM.
 *
 * ⚠️ VÌ SAO FILE NÀY TỒN TẠI. Mỗi phase phải **tự đo lại mốc nền của mình** ở đúng HEAD trong một
 * `git worktree` riêng — chép cột "sau" của phase trước là cách `TECH_DEBT #43` đã sinh ra một bảng
 * số bịa rất thuyết phục (9/15 dòng vẫn đúng). Nhưng suốt các phase 11–12 và VIỆC 1, phép đo ấy
 * được viết TẠM rồi vứt đi, nên chính con số nghiệm thu lại không tái lập được — vi phạm đúng luật
 * *"một con số nghiệm thu phải đi kèm CÔNG CỤ **và ĐẦU VÀO** đã sinh ra nó"* (Phase 4F + Phase 11).
 * Nay nó là một file có tên, có tham số ghi ra ngay trong đầu ra.
 *
 * Cách dùng — ĐO HAI VẾ BẰNG CÙNG MỘT DÒNG LỆNH, chỉ khác `KHO`:
 *
 *     git worktree add /tmp/truoc <commit-nền>
 *     ln -s "$PWD/node_modules" /tmp/truoc/node_modules
 *     KHO=/tmp/truoc node --import ./scripts/register-esm-loader.mjs scripts/scene-count.mjs
 *     KHO=$PWD      node --import ./scripts/register-esm-loader.mjs scripts/scene-count.mjs
 *
 * ⚠️ `KHO` trỏ tới CÂY MÃ được đo; script này thì luôn là bản trong cây làm việc. Đó là CHỦ Ý —
 * hai vế phải được đếm bằng cùng một phép đếm, nếu không thì "hai chương trình khác nhau" bị đọc
 * thành "một thay đổi".
 *
 * ⚠️ PHÉP ĐẾM VIẾT LẠI TỪ ĐẦU theo đúng luật `WebGLRenderer.projectObject` cộng vào `info.render`,
 * cố ý KHÔNG gọi hàm của mã sản phẩm — gọi nó thì bảng này chỉ chứng minh "một hàm bằng chính nó".
 * (Cùng kỷ luật với `sceneStats.test.js`, và bài test ấy mới là thứ khoá rằng hai bên khớp nhau.)
 */

import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const KHO = resolve(process.env.KHO || process.cwd());
const nap = (duong) => import(pathToFileURL(resolve(KHO, duong)).href);

const { createCityScene } = await nap('src/components/city/render3d/sceneGraph.js');
const { computeCityLayout } = await nap('src/engine/cityLayout.js');
const { buildScenePalette } = await nap('src/engine/city3d/palette3d.js');
const { deriveDaylight } = await nap('src/engine/city3d/daylight.js');
const { BLUEPRINT_CATALOG, ERA_METADATA } = await nap('src/engine/constants.js');

/** Đúng bộ token theme sáng mà `sceneStats.test.js` dùng — giữ một bảng, đừng đẻ bảng thứ hai. */
const TOKENS = { canvas2: '#f4f2ec', ink: '#1f1e1d', line: '#e8e6de', accent: '#c96442' };

const SESSIONS = Number(process.env.SESSIONS || 80);
const HOUR = Number(process.env.HOUR || 12);
const LEVEL = Number(process.env.LEVEL || 3);

function dungCanh(era) {
  const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  const levels = Object.fromEntries(built.map((id) => [id, LEVEL]));
  const stats = { sessionCount: SESSIONS, streakLength: 9 };
  const layout = computeCityLayout({ built, levels, era, stats });
  const daylight = deriveDaylight(HOUR);
  const palette = buildScenePalette({
    tokens: TOKENS, eraColor: ERA_METADATA[era]?.accentColor, era, daylight,
  });
  // `renderer` để trống: nhà máy hình học không cần GPU. Bản đồ môi trường có cần, nhưng nó không
  // sinh ra tam giác nào nên không ảnh hưởng con số.
  return createCityScene({ layout, palette, daylight, stats });
}

function demDocLap(scene) {
  let tam = 0;
  let lenh = 0;
  scene.traverse((o) => {
    if (!o.isMesh || o.visible === false) return;
    const g = o.geometry;
    if (!g) return;
    const dinh = g.index ? g.index.count : (g.attributes?.position?.count ?? 0);
    tam += ((o.isInstancedMesh ? o.count : 1) * dinh) / 3;
    lenh += (Array.isArray(o.material) && g.groups?.length) ? g.groups.length : 1;
  });
  return { tam, lenh };
}

console.log(`# KHO=${KHO}`);
console.log(`# SESSIONS=${SESSIONS} HOUR=${HOUR} LEVEL=${LEVEL}`);
console.log('kỷ\tnước\ttam giác\tlệnh vẽ');
let tongTam = 0;
for (let era = 1; era <= 15; era += 1) {
  const city = dungCanh(era);
  const d = demDocLap(city.scene);
  tongTam += d.tam;
  console.log(`${era}\t${ERA_METADATA[era]?.name ?? ''}\t${d.tam}\t${d.lenh}`);
  city.dispose();
}
console.log(`tổng\t\t${tongTam}\t`);
