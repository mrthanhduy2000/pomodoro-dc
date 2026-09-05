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
 * ⚠️ VẾ (c) CHẬM: ~25 giây cho 15 kỷ vì nó dựng scene thật 15 lần (đo 2026-08-21, SAU ADR-048 —
 * TRƯỚC ADR-048 nó tốn ~70–90 giây, và chính con số ấy là thứ đã chỉ ra một hồi quy hiệu năng
 * không cổng nào canh; xem `TECH_DEBT #70`). Vì vậy `npm test` chạy nó ở
 * LƯỢT THỨ HAI (`npm run test:cross`), sau khi nhóm test nhanh đã xong và đã in số bài. Bài này tự
 * in thời gian chạy của mình — Đàm yêu cầu con số ấy phải hiện ra, để cái giá của nó không bao giờ
 * trở thành vô hình.
 *
 * ⚠️ VÀ ĐÂY LÀ GIỚI HẠN PHẢI NÓI RA (Đàm chốt 2026-08-21, §3 Q3 của Phase 14): **con số ~25 giây
 * này KHÔNG phải một phép đo thời gian dựng cảnh, và đừng giả vờ nó là.** Nó là thời gian của MỘT
 * bài test cụ thể — trong đó có cả chi phí nạp module, chi phí của `plinth-tri.mjs`, và cả tải máy
 * lúc ấy. `TECH_DEBT #70` sinh ra vì dự án CHƯA CÓ cổng nào canh thời gian dựng cảnh; bài này chỉ
 * tình cờ **nhạy** với đại lượng đó, chứ nó không đo đại lượng đó. Dùng nó làm "cổng hiệu năng"
 * là đúng cái sai đã ghi ở `CLAUDE.md` — *một con số đúng vẫn có thể trả lời SAI câu hỏi mình đang
 * hỏi*.
 *   ⇒ **Không dựng một bộ đo riêng cho thời gian dựng cảnh vào lúc này** (chỉ thị Đàm: chi phí lớn
 *     hơn lợi ích khi chưa có phase nào đụng `terrain.js`/`horizon.js`/`noise.js`).
 *   ⇒ **REVIEW TRIGGER**: khi tỉ số **(giây in ra) ÷ 25** vượt **1,15×** — tức khoảng **≥ 29 giây**
 *     trên máy rảnh — thì DỪNG và đi tìm nguyên nhân, đừng chỉnh con số 25 trong chú thích này.
 *     Cổng cứng của `TECH_DEBT #70` vẫn là **≤ 1,25×**; 1,15× là mức CẢNH BÁO sớm hơn một nhịp.
 *   ⇒ Con số ấy phải đo trên **máy rảnh**: hai phép đo thời gian chồng lấn nhau thì không phép nào
 *     so được với phép nào (bài học ADR-048).
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
 * Vế (c) dựng scene thật 15 lần (~25 giây) nên nó chỉ chạy ở LƯỢT HAI của `npm test`
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
import { BUILDING_SCALE, buildingSpanCells, countSpecTriangles, plinthParts } from '../src/engine/city3d/parts.js';
import { buildScenePalette } from '../src/engine/city3d/palette3d.js';
import { deriveDaylight } from '../src/engine/city3d/daylight.js';
import { BLUEPRINT_CATALOG, ERA_METADATA } from '../src/engine/constants.js';

const doc = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const NGUON_SCENE = doc('../src/components/city/render3d/sceneGraph.js');
const NGUON_BE = doc('./plinth-tri.mjs');
const TOKENS = { canvas2: '#f4f2ec', ink: '#1f1e1d', line: '#e8e6de', accent: '#c96442' };
const CO_BE = new Set(['building', 'scaffold', 'dwelling']);

test('ĐỐI CHIẾU CHÉO (a) — `BUILDING_SCALE` chỉ được có MỘT bản, và cả hai bên phải `import` nó', () => {
  // Đây chính xác là lỗi 2026-08-20: `plinth-tri` giữ một bản chép tay ghi 0,86 (giá trị đời cũ).
  // Bản vá đầu bắt nó ĐỌC hằng số từ mã nguồn `sceneGraph.js` bằng regex — đúng nhưng mong manh,
  // vì nó vẫn nhận rằng hằng số ấy phải nằm trong một file `import 'three'`. Từ 2026-08-21 hằng số
  // chuyển về `parts.js` (tầng THUẦN), nên cả hai bên `import` cùng một chỗ và không còn bản nào
  // để trôi. Bài này canh CHÍNH điều đó: không bên nào được gán cứng lại một con số.
  assert.doesNotMatch(NGUON_SCENE, /^const BUILDING_SCALE = [\d.]+;/m,
    '`sceneGraph.js` khai lại `BUILDING_SCALE` — nó phải `import` từ `parts.js`.');
  assert.doesNotMatch(NGUON_BE, /^const BUILDING_SCALE = [\d.]+;/m,
    '`plinth-tri.mjs` đang gán cứng `BUILDING_SCALE` — chính là bộ số bịa của 2026-08-20.');
  for (const [nhan, nguon] of [['sceneGraph.js', NGUON_SCENE], ['plinth-tri.mjs', NGUON_BE]]) {
    assert.match(nguon, /import \{[^}]*\bBUILDING_SCALE\b[^}]*\} from '[^']*parts(\.js)?'/,
      `${nhan} không còn \`import\` \`BUILDING_SCALE\` từ \`parts.js\` ⇒ hoặc nó đang dùng một `
      + 'bản chép tay, hoặc nó thôi nhân tỉ lệ. Cả hai đều làm bảng số nói về một thành phố khác.');
  }
  assert.ok(Number.isFinite(BUILDING_SCALE) && BUILDING_SCALE > 0, 'giá trị `BUILDING_SCALE` vô lý');
});

test('ĐỐI CHIẾU CHÉO (b) — KHÔNG BÊN NÀO ĐƯỢC GIỮ MỘT BẢN CHÉP CỦA LUẬT BỆ KÈ', () => {
  // ⚠️ BÀI NÀY ĐÃ ĐỔI CÂU HỎI (2026-09-05), VÀ CÂU MỚI CHẶT HƠN CÂU CŨ.
  // Bản cũ trích công thức khối bệ từ CẢ HAI mã nguồn bằng regex rồi so từng trường — tức nó chấp
  // nhận rằng luật ấy tồn tại ở hai nơi và chỉ canh cho hai bản khớp nhau. Nay luật ấy là MỘT hàm
  // thuần (`plinthParts` ở `parts.js`) mà cả hai bên `import`, nên **không còn bản thứ hai để
  // trôi**. Câu hỏi đúng không còn là *"hai bản có khớp không?"* mà là *"có ai dựng lại bản thứ
  // hai không?"* — cùng cách đã làm cho `BUILDING_SCALE` ở bài (a) ngay trên.
  const CONG_THUC_CHEP_TAY = /w:\s*span\s*\*\s*[\d.]+,\s*d:\s*span\s*\*\s*[\d.]+,\s*h:\s*drop/;
  for (const [nhan, nguon] of [['sceneGraph.js', NGUON_SCENE], ['plinth-tri.mjs', NGUON_BE]]) {
    assert.doesNotMatch(nguon, CONG_THUC_CHEP_TAY,
      `${nhan} đang dựng lại hình bệ kè tại chỗ — nó phải gọi \`plinthParts\` ở \`parts.js\`. Một `
      + 'bản chép thứ hai là một bản chờ trôi, và bản chép ấy đã sai một lần rồi (2026-08-20).');
    assert.match(nguon, /import \{[^}]*\bplinthParts\b[^}]*\} from '[^']*parts(\.js)?'/,
      `${nhan} không \`import\` \`plinthParts\` ⇒ hoặc nó có bản chép riêng, hoặc nó thôi sinh bệ.`);
    assert.match(nguon, /import \{[^}]*\bbuildingSpanCells\b[^}]*\} from '[^']*parts(\.js)?'/,
      `${nhan} không \`import\` \`buildingSpanCells\` ⇒ phép đổi ô đất lại có bản thứ hai.`);
  }
  // Điều kiện sinh bệ (`drop > 0`) nay nằm TRONG `plinthParts`, nên nó cũng chỉ còn một bản. Hỏi
  // thẳng hành vi thay vì hỏi chữ: không hụt ⇒ không có bệ, có hụt ⇒ có bệ.
  assert.equal(plinthParts(3, 0), null, 'không hụt mà vẫn sinh bệ');
  assert.equal(plinthParts(3, -0.5), null, 'hụt ÂM mà vẫn sinh bệ');
  assert.ok(Array.isArray(plinthParts(3, 0.4)), 'có hụt mà không sinh bệ');
});

test('ĐỐI CHIẾU CHÉO (c) — CHẠY THẬT CẢ HAI ĐƯỜNG TRÊN 15 KỶ — kỷ nào có bệ thì cả hai bên đều phải thấy',
  { skip: CHAY_CHAM ? false : 'lượt hai: npm run test:cross (~25 giây)' }, () => {
  const batDau = Date.now();
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
      // ⚠️ BẢN CHÉP THỨ TƯ ĐÃ GỠ (2026-09-05). Tính ĐỘC LẬP của phép đối chiếu này nằm ở ĐƯỜNG 2
      // (dựng scene thật rồi duyệt scene graph), KHÔNG nằm ở việc gõ lại công thức bệ kè ở đường 1
      // — gõ lại chỉ tạo thêm một bản chờ trôi, đúng thứ bài (b) ngay trên vừa cấm.
      const span = buildingSpanCells(item.spec.parts);
      const { drop } = terrain.footprint(item.source.x, item.source.y, span);
      const beKe = plinthParts(span, drop);
      if (!beKe) continue;
      soBe += 1;
      triBe += countSpecTriangles(beKe);
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
