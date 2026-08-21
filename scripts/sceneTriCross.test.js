/**
 * ĐỐI CHIẾU CHÉO `scene-tri.mjs` ↔ `plinth-tri.mjs` — CHẠY TRONG `npm test`.
 *
 * ⚠️ VÌ SAO BÀI NÀY TỒN TẠI, VÀ VÌ SAO NÓ KHÔNG PHẢI LÀ THỨ NHIỀU NGƯỜI TƯỞNG.
 *
 * `plinth-tri.mjs` sinh ra để cãi nhau với `scene-tri.mjs` khi một phase đụng vào địa hình: một
 * bên đếm tam giác bằng cách duyệt SCENE GRAPH THẬT, một bên đếm riêng bệ kè bằng một đường hoàn
 * toàn độc lập. Nó đã bắt được một lỗi thật (2026-08-20): `plinth-tri` chép tay
 * `BUILDING_SCALE = 0.86` trong khi giá trị thật là `1.3`, nên nó đếm 3 bệ thay vì 31 và in ra một
 * bảng 15 dòng trông hoàn toàn bình thường.
 *
 * ⚠️ **NHƯNG PHÉP SO SỐ-VỚI-SỐ CỦA HAI CÔNG CỤ ẤY LÀ MỘT PHÉP SO HAI COMMIT, KHÔNG PHẢI MỘT BẤT
 * BIẾN CỦA MỘT BẢN.** Câu chúng trả lời là *"chênh lệch tam giác giữa TRƯỚC và SAU có nằm trọn ở
 * bệ kè không?"* — cần hai cây mã mới hỏi được. Viết một bài test giả vờ hỏi câu ấy trên một bản
 * duy nhất thì phải chép một bảng số kỳ vọng vào test, tức tự dựng lại đúng cái bẫy `TECH_DEBT
 * #43` (chép cột "sau" của phase trước làm cột "trước" của phase mình). Nên bài này KHÔNG làm vậy.
 *
 * Thứ CI giữ được — và đúng là thứ đã hỏng — là **CÁI LUẬT**: hai file phải mô tả bệ kè bằng CÙNG
 * một công thức. Chừng nào luật còn là một thì hai con số còn so được với nhau; luật trôi thì mọi
 * phép so sau đó là rác, và nó trôi trong im lặng tuyệt đối.
 *
 * Ba vế:
 *   (a) `BUILDING_SCALE` — `plinth-tri` phải ĐỌC ĐƯỢC nó từ `sceneGraph.js`, không chép tay.
 *   (b) Công thức khối bệ (`w`/`d`/`h`/`sides`/`taper`/`role` + điều kiện `drop > 0`) phải TRÙNG
 *       từng trường giữa hai file.
 *   (c) Chạy THẬT cả hai đường trên 15 kỷ rồi đòi chúng nhất quán về ĐỊNH TÍNH (kỷ nào có bệ thì
 *       cả hai bên đều thấy, và tổng bệ luôn nằm trong tổng thành phố) — cộng một gác chạy-rỗng.
 *
 * ⚠️ VẾ (c) CHẬM: ~70–90 giây cho 15 kỷ vì nó dựng scene thật 15 lần. Vì vậy `npm test` chạy nó ở
 * LƯỢT THỨ HAI (`npm run test:cross`), sau khi nhóm test nhanh đã xong và đã in số bài. Bài này tự
 * in thời gian chạy của mình — Đàm yêu cầu con số ấy phải hiện ra, để cái giá của nó không bao giờ
 * trở thành vô hình.
 *
 * THỬ-CHO-ĐỎ — cả ba vế đã chạy thật trong một `git worktree` riêng (2026-08-21), mỗi lần nêu
 * TRƯỚC chỗ phải đỏ rồi mới phá:
 *   (a) thay `readFileSync(...sceneGraph.js)` bằng một chuỗi cứng ⇒ đỏ đúng ở assert
 *       *"`plinth-tri.mjs` thôi đọc `sceneGraph.js`"*.
 *   (b) đổi `0.92` → `0.9` trong `plinth-tri.mjs` ⇒ `deepEqual` đỏ đúng ở HAI trường `w` và `d`.
 *   (c) đổi điều kiện sinh bệ thành `drop > 1e9` ⇒ đỏ đúng ở *"GÁC CHẠY-RỖNG: không kỷ nào có
 *       bệ kè"*.
 * ⚠️ Và lần đầu chạy bộ thử ngược ấy nó đỏ VÌ LÝ DO SAI: kho tạm không có `node_modules` nên
 * `three` không nạp được, tức mọi vế đều "đỏ" mà chẳng chứng minh gì. Kho tạm phải được nối
 * `node_modules` trước, và phải chạy một lượt NỀN cho xanh trước khi tin bất kỳ màu đỏ nào.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * Vế (c) dựng scene thật 15 lần (~70–90 giây) nên nó chỉ chạy ở LƯỢT HAI của `npm test`
 * (`npm run test:cross`, đặt `DC_CROSS_SLOW=1`). Lượt nhanh vẫn NẠP file này và vẫn chạy vế (a)
 * và (b) — hai vế ấy chỉ tốn vài mili-giây và chính chúng canh cái luật.
 *
 * ⚠️ VÌ SAO LÀ MỘT BIẾN MÔI TRƯỜNG CHỨ KHÔNG PHẢI `--test-skip-pattern`. Bản đầu dùng cờ ấy và
 * nó **KHÔNG ăn**: `node --help` có liệt kê cờ, không báo lỗi gì, mà bài chậm vẫn chạy — tức
 * lượt "nhanh" âm thầm gánh thêm 70 giây và chẳng có gì nói ra. Một cờ bị bỏ qua trong im lặng
 * là đúng thứ dự án này đã bị cắn nhiều lần. Cách này thì `# skipped 1` HIỆN RA ở lượt nhanh,
 * nên nếu ngày nào nó thôi bỏ qua thì con số ấy tự nói.
 */
const CHAY_CHAM = process.env.DC_CROSS_SLOW === '1';

import { createCityScene } from '../src/components/city/render3d/sceneGraph.js';
import { computeCityLayout } from '../src/engine/cityLayout.js';
import { collectCitySpecs } from '../src/engine/city3d/cityParts.js';
import { buildTerrain } from '../src/engine/city3d/terrain.js';
import { prism, countSpecTriangles, specSpan } from '../src/engine/city3d/parts.js';
import { buildScenePalette } from '../src/engine/city3d/palette3d.js';
import { deriveDaylight } from '../src/engine/city3d/daylight.js';
import { BLUEPRINT_CATALOG, ERA_METADATA } from '../src/engine/constants.js';

const doc = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const NGUON_SCENE = doc('../src/components/city/render3d/sceneGraph.js');
const NGUON_BE = doc('./plinth-tri.mjs');
const TOKENS = { canvas2: '#f4f2ec', ink: '#1f1e1d', line: '#e8e6de', accent: '#c96442' };
const CO_BE = new Set(['building', 'scaffold', 'dwelling']);

/** Trích công thức khối bệ kè từ một mã nguồn. Trả về đối tượng các trường đã chuẩn hoá khoảng
 *  trắng — so hai đối tượng ấy mới là so LUẬT, so cả đoạn chữ thì thụt lề khác nhau đã đỏ. */
function locLuatBe(nguon, nhan) {
  const m = nguon.match(/w:\s*span\s*\*\s*([\d.]+),\s*d:\s*span\s*\*\s*([\d.]+),\s*h:\s*drop,\s*\n?\s*sides:\s*(\d+),\s*taper:\s*(\d+),\s*role:\s*'(\w+)'/);
  assert.ok(m, `${nhan}: không tìm thấy công thức khối bệ kè — hoặc nó đã bị đổi hình dạng, hoặc `
    + 'file đã được viết lại. Đừng nới regex cho qua: đi xem hai file có còn cùng một luật không.');
  return { w: m[1], d: m[2], sides: m[3], taper: m[4], role: m[5] };
}

test('ĐỐI CHIẾU CHÉO (a) — `plinth-tri` phải ĐỌC `BUILDING_SCALE` từ `sceneGraph.js`, không chép tay', () => {
  // Đây chính xác là lỗi 2026-08-20. Hai vế: mã sản phẩm vẫn khai hằng số ở dạng regex kia đọc
  // được, VÀ `plinth-tri` vẫn đọc bằng đường ấy chứ không gán thẳng một con số.
  const m = NGUON_SCENE.match(/^const BUILDING_SCALE = ([\d.]+);/m);
  assert.ok(m, '`sceneGraph.js` không còn khai `BUILDING_SCALE` ở dạng `plinth-tri` đọc được ⇒ '
    + 'công cụ đo sẽ ném lỗi. Sửa CẢ HAI cùng lúc, đừng sửa mỗi một bên.');
  assert.ok(Number.isFinite(Number(m[1])) && Number(m[1]) > 0, 'giá trị vô lý');
  assert.match(NGUON_BE, /readFileSync\([^)]*sceneGraph\.js/,
    '`plinth-tri.mjs` thôi đọc `sceneGraph.js` ⇒ nó đang giữ một bản chép tay của hằng số, đúng '
    + 'cái bẫy "một luật hai công thức" đã cắn một lần rồi.');
  assert.doesNotMatch(NGUON_BE, /^const BUILDING_SCALE = [\d.]+;/m,
    '`plinth-tri.mjs` đang gán cứng `BUILDING_SCALE` — chính là bộ số bịa của 2026-08-20.');
});

test('ĐỐI CHIẾU CHÉO (b) — MỘT LUẬT MỘT CÔNG THỨC: khối bệ kè phải trùng từng trường giữa hai file', () => {
  const sanPham = locLuatBe(NGUON_SCENE, 'sceneGraph.js');
  const phepDo = locLuatBe(NGUON_BE, 'plinth-tri.mjs');
  assert.deepEqual(phepDo, sanPham,
    'công thức bệ kè của phép ĐO đã trôi khỏi công thức của mã DỰNG. Mọi con số `plinth-tri` in ra '
    + 'từ giờ nói về một cái bệ khác với cái bệ đang được vẽ.');
  // Điều kiện sinh bệ cũng là một phần của luật: `drop > 0`. Đổi nó ở một bên là đếm nhầm SỐ bệ
  // dù công thức khối vẫn đúng.
  assert.match(NGUON_SCENE, /const plinth = drop > 0 \?/, 'điều kiện sinh bệ ở mã dựng đã đổi');
  assert.match(NGUON_BE, /if \(!\(drop > 0\)\) continue;/, 'điều kiện sinh bệ ở phép đo đã đổi');
});

test('ĐỐI CHIẾU CHÉO (c) — CHẠY THẬT CẢ HAI ĐƯỜNG TRÊN 15 KỶ — kỷ nào có bệ thì cả hai bên đều phải thấy',
  { skip: CHAY_CHAM ? false : 'lượt hai: npm run test:cross (~70–90 giây)' }, () => {
  const batDau = Date.now();
  const BUILDING_SCALE = Number(NGUON_SCENE.match(/^const BUILDING_SCALE = ([\d.]+);/m)[1]);
  const bang = [];
  let duyet = 0;
  let tongBe = 0;

  for (let era = 1; era <= 15; era += 1) {
    const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
    const levels = Object.fromEntries(built.map((id) => [id, 3]));
    const stats = { sessionCount: 40, streakLength: 9 };
    const layout = computeCityLayout({ built, levels, era, stats });

    // ĐƯỜNG 1 — `plinth-tri`: hỏi thẳng địa hình, không chạm three.
    const terrain = buildTerrain({ era, gridSize: layout.gridSize });
    let soBe = 0;
    let triBe = 0;
    for (const item of collectCitySpecs({ layout, detail: 'high' })) {
      if (!CO_BE.has(item.kind)) continue;
      duyet += 1;
      const span = Math.max(1, Math.round(specSpan(item.spec.parts) * BUILDING_SCALE));
      const { drop } = terrain.footprint(item.source.x, item.source.y, span);
      if (!(drop > 0)) continue;
      soBe += 1;
      triBe += countSpecTriangles([prism({
        y: 0, w: span * 0.92, d: span * 0.92, h: drop, sides: 4, taper: 1, role: 'stone',
      })]);
    }

    // ĐƯỜNG 2 — `scene-tri`: dựng scene thật rồi duyệt scene graph.
    const daylight = deriveDaylight(12);
    const palette = buildScenePalette({
      tokens: TOKENS, eraColor: ERA_METADATA[era]?.accentColor, era, daylight,
    });
    const city = createCityScene({ layout, palette, daylight, stats });
    let triTP = 0;
    (city.scene ?? city).traverse((o) => {
      if (!o.isMesh || o.visible === false || !o.geometry) return;
      if (o.userData?.sceneLayer === 'backdrop') return;
      const g = o.geometry;
      const soChiSo = g.index ? g.index.count : (g.attributes.position?.count ?? 0);
      triTP += Math.floor(soChiSo / 3) * (o.isInstancedMesh ? o.count : 1);
    });

    assert.ok(triTP > triBe,
      `kỷ ${era}: tổng thành phố (${triTP}) không lớn hơn tổng bệ (${triBe}) — một trong hai đường `
      + 'đếm đang nói về một thành phố khác.');
    tongBe += soBe;
    bang.push({ era, soBe, triBe, triTP });
  }

  // Gác chạy-rỗng: quần thể phải đúng hình dạng, và bệ kè phải THẬT SỰ tồn tại ở một số kỷ —
  // nếu không thì hai vế trên đúng một cách rỗng tuếch.
  assert.ok(duyet >= 100, `GÁC CHẠY-RỖNG: chỉ duyệt ${duyet} khối — quần thể sai hình dạng`);
  assert.ok(tongBe > 0, 'GÁC CHẠY-RỖNG: không kỷ nào có bệ kè ⇒ phép đối chiếu này không canh gì cả');

  const giay = ((Date.now() - batDau) / 1000).toFixed(1);
  const coBe = bang.filter((r) => r.soBe > 0).map((r) => r.era);
  console.log(`[đối chiếu chéo] scene-tri ↔ plinth-tri · 15 kỷ · ${giay} giây`);
  console.log(`[đối chiếu chéo] ${tongBe} bệ kè ở ${coBe.length}/15 kỷ (kỷ ${coBe.join(', ')})`);
});
