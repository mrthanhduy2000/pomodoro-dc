import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * KHOÁ ĐƯỜNG DÂY GIỮA NHÀ MÁY HÌNH HỌC VÀ CẢNH — bằng cách đọc thẳng mã nguồn.
 *
 * ⚠️ VÌ SAO PHẢI ĐỌC MÃ NGUỒN thay vì gọi hàm: `createCityScene` cần một WebGL context thật. Dựng
 * cả trình duyệt chỉ để hỏi "mảng vật liệu lấy từ đâu ra" là cái giá không đáng, mà bỏ qua thì lại
 * rơi đúng vào bẫy Phase 4H: `summarizeMuseum` có test riêng, test xanh, và **không ai gọi nó**.
 * Lint không bắt được (hàm CÓ được dùng — bởi chính bài test của nó), build không bắt được, mắt
 * thường không bắt được. Đây là loại vi phạm chỉ có test đọc-mã-nguồn mới chặn nổi.
 *
 * Cùng khuôn với `cityViewShellWiring.test.js` và `actionButtonSizing.test.js`.
 * Cả bốn bài dưới đây đã được thử NGƯỢC (sửa mã cho hỏng rồi xem có đỏ không).
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = readFileSync(join(HERE, 'sceneGraph.js'), 'utf8');
const TERRAIN_SOURCE = readFileSync(join(HERE, 'terrainMesh.js'), 'utf8');

/**
 * Bỏ chú thích, chỉ giữ phần MÃ.
 *
 * ⚠️ BẮT BUỘC: file kia có hẳn mấy đoạn chú thích dài giải thích `envMapIntensity`, `MeshLambert`
 * và `merged.families` — tức chứa đủ mọi chữ mà bài test này đi tìm. Không lọc thì test xanh nhờ
 * đọc trúng lời giải thích của chính nó, kể cả khi mã đã bị gỡ sạch.
 */
function codeOnly(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join('\n');
}

const CODE = codeOnly(SOURCE);
const TERRAIN_CODE = codeOnly(TERRAIN_SOURCE);

/**
 * `CODE` nhưng đã BỎ MỌI DÒNG ĐỊNH NGHĨA HÀM — dùng cho mọi phép kiểm "hàm X có được GỌI không".
 *
 * ⚠️ ĐÂY LÀ BẢN VÁ GỐC CHO MỘT LỖI ĐÃ CẮN BA LẦN TRONG CHÍNH FILE NÀY. Hỏi `/tênHàm\(/` thì dòng
 * `function tênHàm(...)` tự nó là một match, nên **gỡ sạch mọi lời gọi vẫn không đỏ**. Đã thử ngược
 * và thấy đúng vậy với `paintSkyGradient`, rồi `createSkyEnvironment`, rồi lần thứ ba ở đúng cái
 * assert vừa được viết ra để vá lần thứ hai.
 *
 * Vá bằng cách rắc `(?<!function )` vào từng chỗ là vá theo TRIỆU CHỨNG: chỗ thứ tư viết sau này
 * sẽ lại quên. Lọc một lần ở đây thì không assert nào trong file còn khả năng mắc lại — đúng luật
 * "một luật một công thức" của `CLAUDE.md`.
 */
const CALLS = CODE.replace(/^\s*(export\s+)?function\s+\w+\s*\(/gm, '');

test('mảng vật liệu công trình PHẢI dựng từ chính `merged.families`', () => {
  // Hai bên tự sắp xếp riêng thì mái sẽ mang độ bóng của mặt nước: hình vẫn hiện đủ, không có gì
  // đỏ, chỉ sai bề mặt. Bài `geometryFactory.test.js` canh phía nhà máy; bài này canh phía nhận.
  assert.ok(
    /merged\.families\.map\(/.test(CODE),
    'Không còn chỗ nào dựng mảng vật liệu từ `merged.families`. Liệt kê lại danh sách họ ở đây là '
    + 'tạo công thức thứ hai cho cùng một luật — đúng thứ `CLAUDE.md` cấm ("một luật một công thức").',
  );
  assert.ok(
    /new Mesh\(merged\.geometry, buildingMaterial\)/.test(CODE),
    'Khối công trình không còn nhận mảng vật liệu nhiều họ. Truyền MỘT vật liệu cho cả thành phố '
    + 'chính là nguyên nhân gốc mà Phase 7A đi sửa.',
  );
});

test('vật liệu phải là PBR (`MeshStandardMaterial`), không được quay về Lambert', () => {
  // Lambert thuần khuếch tán: không có số hạng phản xạ gương, nên MỌI bề mặt là cùng một bề mặt
  // chỉ khác màu. Đá, kính, ngói, kẽm đều đọc ra như giấy màu — chính là cảm giác "low-poly
  // prototype" Đàm phàn nàn. Quay lại Lambert là xoá sạch Phase 7A mà test khác vẫn xanh.
  assert.ok(/MeshStandardMaterial/.test(CODE), 'Không còn `MeshStandardMaterial` nào trong cảnh.');
  assert.ok(
    !/MeshLambertMaterial/.test(CODE),
    'Có `MeshLambertMaterial` quay lại — mọi vật liệu sẽ lại đọc ra như nhau.',
  );
});

test('KIM LOẠI PHẢI CÓ BẢN ĐỒ MÔI TRƯỜNG — thiếu nó thì mái kẽm/đồng ra ĐEN', () => {
  // ⚠️ Đây không phải điểm tô thêm cho đẹp, nó là ĐIỀU KIỆN CẦN. Kim loại gần như không có thành
  // phần khuếch tán: màu nó hiện ra hầu hết là thứ nó phản chiếu. Không có gì để phản chiếu thì
  // `metalness: 0.9` render ra một khối đen tuyền — và vì nó vẫn "ra màu", lỗi này rất khó truy.
  assert.ok(
    /createSkyEnvironment\(/.test(CALLS),
    'Không còn LỜI GỌI `createSkyEnvironment` nào (định nghĩa hàm không tính). Mái kẽm kỷ 9, mái '
    + 'đồng kỷ 11, vành thép kỷ 15 sẽ ra đen.',
  );
  assert.ok(
    /createSkyEnvironment\(\s*\n?\s*renderer,/.test(CALLS),
    'Bản đồ môi trường không còn nhận `renderer` thật. `createSkyEnvironment` trả `null` khi thiếu '
    + 'renderer — im lặng, không lỗi, và mọi kim loại chuyển sang đen mà không có gì báo.',
  );
  // ⚠️ PHẢI HỎI ĐÍCH DANH VẬT LIỆU CÔNG TRÌNH, không được hỏi chung chung "`envMap` có xuất hiện
  // ở đâu đó không". Bản đầu của bài này viết `/envMap,/` và **KHÔNG đỏ** khi tôi thử gỡ: trong
  // file có bốn vật liệu mang `envMap` (nền, ngoại vi, công trình, cư dân), nên gỡ đúng cái DUY
  // NHẤT chứa kim loại vẫn để lại ba cái kia làm test xanh oan. Mà đó chính là hồi quy cần chặn:
  // mái kẽm kỷ 9, mái đồng kỷ 11, vành thép kỷ 15 đều nằm ở khối công trình.
  const buildingBlock = CODE.match(/merged\.families\.map\([\s\S]*?\n {6}\}\);/);
  assert.ok(buildingBlock, 'Không tìm thấy khối dựng vật liệu công trình để kiểm.');
  assert.ok(
    /envMap,/.test(buildingBlock[0]),
    'VẬT LIỆU CÔNG TRÌNH không còn mang `envMap` — đây là khối chứa toàn bộ kim loại của 15 kỷ. '
    + '⚠️ Gắn `scene.environment` KHÔNG thay thế được: đi đường đó thì three BỎ QUA `envMapIntensity` '
    + 'hoàn toàn (đã đo: vặn từ 0 lên 3,0 ảnh không đổi một điểm ảnh nào), môi trường rọi ở mức 1,0 '
    + 'bất kể ta khai gì, và cả bảng màu bạc phếch như sữa.',
  );
  assert.ok(
    /envMapIntensity: profile\.metalness > 0\.15 \? 1 : ENV_DIFFUSE/.test(CODE),
    'Luật "kim loại ăn trọn môi trường, bề mặt khuếch tán chỉ lấy một phần" đã bị đổi. Cho khuếch '
    + 'tán ăn trọn 1,0 thì đo được sáng 51,3 / tươi 14,4 / chiaroscuro 29 — nhạt hơn cả bản Lambert cũ.',
  );
});

/**
 * SÁU CHỖ BÁM ĐẤT. Kể từ Phase 7B mặt đất KHÔNG CÒN PHẲNG, nên mọi thứ đứng trên nó phải hỏi
 * `terrain` xem chỗ ấy cao bao nhiêu. Quên một chỗ thì thứ đó **lơ lửng hoặc lún**, và:
 * build xanh · lint sạch · mọi test khác xanh · không một cảnh báo nào. Triệu chứng duy nhất là
 * một cái cây trôi giữa không trung mà phải soi ảnh mới thấy.
 *
 * ⚠️ Đây đúng hình dạng sai của Phase 4D ("một luật mới làm điều kiện cũ hết đúng ⇒ phải đi tìm
 * MỌI chỗ phát biểu lại điều kiện ấy"). Điều kiện cũ là *"y của mọi thứ trên mặt đất = 0"*, và nó
 * được phát biểu lại ở sáu nơi. Bảng dưới đây là danh sách đầy đủ đó, viết ra để lần sau ai thêm
 * chỗ thứ bảy thì có nơi mà đối chiếu.
 *
 * ⚠️ TỪ PHASE 8C DANH SÁCH NÀY TRẢI TRÊN HAI FILE, nên mỗi hàng phải nói rõ nó sống ở đâu. Nền và
 * đường đã rời `sceneGraph.js` sang `terrainMesh.js` (mặt đất thôi là 144 khối hộp). Để nguyên bảng
 * cũ thì hai hàng ấy đỏ trong khi mã hoàn toàn đúng — **phép đo già đi, không phải mã hỏng**, đúng
 * loại đã cắn ở `buildingSpec.test.js` (`seen.size === 4`) và Phase 5B (ngưỡng `|x| > 0.5`).
 */
const GROUND_ANCHORS = [
  { name: 'ô nền', file: 'terrainMesh.js', pattern: /const heightAt = \(u, v\) => terrain\.surfaceHeightAt\(u, v\)/,
    hurt: 'toàn bộ lưới đỉnh nằm ở cao độ 0 — cả địa hình biến mất, mặt đất phẳng lì như trước Phase 7B' },
  { name: 'đường sá', file: 'terrainMesh.js', pattern: /kit\.heightAt\(u, v\) \+ ROAD_LIFT/,
    hurt: 'đường nằm ở cao độ 0 trong khi đất đã nhô lên ⇒ phố chui xuyên vào trong đồi' },
  { name: 'công trình + móng', file: 'sceneGraph.js', pattern: /terrain\.footprint\(cell\.x, cell\.y, span\)/,
    hurt: 'nhà đứng ở cao độ 0 ⇒ nhà trên đồi bị chôn tới nóc, nhà dưới thung lũng bay lơ lửng' },
  // ⚠️ CẢNH VẬT ĐỔI SANG `surfaceHeightAt` Ở PHASE 8D, VÀ ĐÓ KHÔNG PHẢI MỘT LỰA CHỌN TUỲ Ý.
  // Từ 8D mỗi cây/bụi/đá lệch khỏi tâm ô tới ±0,38 ô để thoát khỏi cái lưới nhìn thấy được. Ở
  // đúng tâm ô, `heightAt` (rời rạc, theo ô) và `surfaceHeightAt` (liên tục) cho CÙNG một số —
  // nên bản cũ đúng, và đó chính là lý do việc này nguy hiểm: hàm cũ vẫn "chạy được", chỉ trả về
  // cao độ của một chỗ KHÁC. Trên sườn dốc, chênh lệch ấy là cả một cái cây treo giữa trời.
  // Khoá luôn TOẠ ĐỘ ĐÃ LỆCH (`ux, uy`), không phải `prop.x, prop.y`: hỏi đúng hàm mà sai chỗ thì
  // hậu quả y hệt.
  { name: 'cảnh vật', file: 'sceneGraph.js', pattern: /y: terrain\.surfaceHeightAt\(ux, uy\)/,
    hurt: 'cây/bụi/đèn lấy cao độ của TÂM ô trong khi thân nó đứng ở chỗ đã lệch ⇒ trên sườn dốc '
      + 'thì mọc xuyên qua đất hoặc treo lơ lửng, mà build/lint/test đều xanh' },
  { name: 'cảnh vật — độ lệch phải vào CẢ toạ độ ngang', file: 'sceneGraph.js',
    pattern: /const ux = prop\.x \+ \(prop\.ox \?\? 0\)/,
    hurt: 'cảnh vật lại nằm đúng tâm ô ⇒ cái lưới bàn cờ hiện lại, đúng thứ Phase 8C vừa xoá khỏi '
      + 'mặt đất' },
  { name: 'cư dân', file: 'sceneGraph.js', pattern: /terrain\.heightAt\(spot\.x, spot\.y\) \+ ROAD_SURFACE_Y/,
    hurt: 'người đi bộ lún dưới mặt đường hoặc đi trên không' },
];

test('SÁU CHỖ BÁM ĐẤT: mọi thứ đứng trên mặt đất đều phải hỏi `terrain`', () => {
  assert.ok(
    /const terrain = buildTerrain\(\{ era: layout\.era, gridSize \}\)/.test(CODE),
    'Không còn dựng địa hình cho cảnh. Cả Phase 7B biến mất mà không có gì đỏ.',
  );
  const sources = { 'sceneGraph.js': CODE, 'terrainMesh.js': TERRAIN_CODE };
  for (const anchor of GROUND_ANCHORS) {
    assert.ok(
      anchor.pattern.test(sources[anchor.file]),
      `Chỗ bám đất "${anchor.name}" (${anchor.file}) không còn hỏi \`terrain\`. Hậu quả: ${anchor.hurt}. `
      + '⚠️ Sai chỗ này KHÔNG có gì đỏ lên — chỉ có mắt nhìn vào ảnh chụp mới bắt được.',
    );
  }
});

test('BA TẤM ĐỊA HÌNH PHẢI ĐƯỢC DỰNG THẬT VÀO CẢNH', () => {
  // ⚠️ Đúng bẫy Phase 4H một lần nữa: `terrainMesh.js` có test riêng chạy đủ, engine `terrain.js`
  // vẫn tính đủ 15 vùng đất — và nếu `sceneGraph.js` quên gọi thì màn hình chỉ còn một tấm ván
  // vuông trơ trọi với năm công trình bay lơ lửng bên trên. Không lint nào bắt được.
  for (const fn of ['buildTerrainSurface', 'buildRoadSurface']) {
    assert.ok(
      new RegExp(`${fn}\\(\\{ terrain, gridSize, layout, palette \\}\\)`).test(CALLS),
      `Cảnh không còn gọi \`${fn}\` với \`terrain\` thật.`,
    );
  }

  // ⚠️ TẤM THỨ BA (Phase 9A) — VÀ NÓ THAY THẾ MỘT BÀI TEST CŨ ĐÃ HẾT HIỆU LỰC, có chủ đích.
  // Bài cũ canh `outskirts.position.y = -APRON_DROP - GROUND_THICKNESS / 2`, tức canh chỗ ngồi của
  // một TẤM VÁN PHẲNG. Lập luận của nó đúng từng chữ, nhưng nó đứng trên tiền đề "vùng đất ngoài
  // lưới là một khối hộp"; Phase 9A gỡ chính tiền đề đó (nay là địa hình thật có núi), nên kết luận
  // đi theo nó cũng hết hiệu lực — đúng hình dạng đã ghi ở `terrain.js`/ADR-019. Lời hứa THẬT thì
  // không đổi: hai tấm phải gặp nhau ở đúng `-APRON_DROP`. Nay nó được khoá ở nơi đúng hơn nhiều —
  // `horizon.test.js` đo CAO ĐỘ THẬT ở chỗ giáp, thay vì đọc một dòng gán toạ độ.
  assert.ok(
    /buildHorizon\(\{ era: layout\.era, gridSize \}\)/.test(CALLS),
    'Cảnh không còn dựng vùng đất xa ⇒ thế giới lại kết thúc bằng một mảng phẳng một màu.',
  );
  // ⚠️ KHOÁ TIỀN TỐ, KHÔNG KHOÁ TRỌN DANH SÁCH THAM SỐ. Bản đầu viết `\(\{ horizon, palette \}\)`
  // và nó đỏ ngay lần đầu có người thêm một tham số CHÍNH ĐÁNG (`terrain` — để tấm núi dùng chung
  // trường vết loang với tấm đất). Một bài test canh "hàm này có được gọi với thứ nó cần không" mà
  // lại đỏ khi hàm nhận THÊM thứ nó cần thì đang canh sai điều: nó khoá một chữ ký, trong khi lời
  // hứa thật là "`horizon` vừa tính xong phải được đưa vào tấm vẽ". Bỏ `horizon` đi vẫn đỏ như cũ.
  assert.ok(
    /buildHorizonSurface\(\{ horizon, palette[,}]/.test(CALLS),
    'Vùng đất xa được TÍNH nhưng không được VẼ — đúng bẫy Phase 4H: hàm chạy đủ, không ai gọi.',
  );
  // ⚠️ VÀ NÓ KHÔNG ĐƯỢC NHẬN BÓNG. Khung bóng đổ chỉ bó quanh lưới 12×12; mọi điểm ngoài khung tra
  // vào bản đồ bóng sẽ lấy nhầm giá trị ở mép và bị coi là đang trong bóng ⇒ cả dãy núi đen kịt.
  // Đã thấy tận mắt với tấm ván cũ, nên đây là một lỗi ĐÃ XẢY RA, không phải một giả định.
  assert.ok(
    /outskirts\.receiveShadow = false/.test(CALLS),
    'Vùng đất xa nhận bóng ⇒ nằm ngoài khung bóng nên sẽ bị tô đen toàn bộ.',
  );
});

test('SƯƠNG MÙ KHÔNG ĐƯỢC CÓ MẶT PHẲNG `far` — nếu có, vùng đất xa là mã chết', () => {
  // ⚠️ Bài test của một lỗi ĐÃ ĐO ĐƯỢC, không phải một lo xa. Sương tuyến tính (`Fog`) có tham số
  // `far`: qua khỏi nó, cảnh vật không nhạt đi mà bị THAY bằng đúng một màu. Sơn sương màu hồng
  // cánh sen rồi chụp thì đỉnh khung hình ra `#e803e6` — 95–100% sương nguyên chất. Nghĩa là dựng
  // núi ra ngoài đó cũng vô nghĩa: chúng tàng hình tuyệt đối, y như cơ chế "lùm cây" chết yểu ở
  // Phase 8D. `FogExp2` tiến tới 1 nhưng không bao giờ chạm 1 ⇒ luôn còn lớp sau lớp.
  assert.ok(/new FogExp2\(/.test(CALLS), 'Sương quay lại dùng mặt phẳng `far` ⇒ xoá sạch vùng đất xa.');
  assert.ok(!/new Fog\(/.test(CALLS), 'Vẫn còn một `new Fog(` tuyến tính đâu đó trong cảnh.');
});

test('CÔNG TRÌNH ĐỨNG Ở CAO ĐỘ CAO NHẤT DƯỚI BÓNG MÌNH, và phần hụt phải thành MÓNG', () => {
  // Hai nửa của cùng một luật, và nửa thứ hai là nửa dễ mất. Nếu chỉ lấy `top` mà bỏ `drop` thì
  // nhà vắt qua mép thềm sẽ có góc TREO LƠ LỬNG — nhìn thấy rõ, nhưng không test nào bắt.
  assert.ok(
    /const \{ top, drop \} = terrain\.footprint\(/.test(CODE),
    'Không còn đọc CẢ `top` lẫn `drop`. Bỏ `drop` ⇒ nhà trên sườn đồi treo một góc giữa không khí.',
  );
  assert.ok(
    /const plinth = drop > 0 \?/.test(CODE),
    'Khối móng không còn được sinh ra khi có phần hụt.',
  );
  // ⚠️ Móng phải đi vào CÙNG danh sách `placements` — nếu không nó chỉ là dữ liệu chết, và đây đúng
  // là bẫy Phase 4H (`summarizeMuseum` có test riêng, test xanh, không ai gọi).
  assert.ok(
    /placements\.push\(\.\.\.plinths\)/.test(CALLS),
    'Móng được TÍNH nhưng không được ĐƯA VÀO cảnh — đúng bẫy Phase 4H: hàm chạy đúng, có test '
    + 'riêng, và không ai gọi. Không có gì đỏ, chỉ có mấy góc nhà treo lơ lửng.',
  );
});

test('NHÀ DÂN PHẢI ĐƯỢC DỰNG THẬT VÀO CẢNH, không chỉ được TÍNH ra', () => {
  // ⚠️ Đúng bẫy Phase 4H, và Phase 7C là ca dễ dính nhất từ trước tới nay: `deriveDwellings` là hàm
  // thuần, có 8 bài test riêng, được `computeCityLayout` gọi và trả về trong `layout.dwellings` —
  // tất cả đều xanh kể cả khi `sceneGraph.js` không hề đọc mảng đó. Triệu chứng duy nhất sẽ là một
  // thành phố vẫn trống trơn y như trước, và không một dòng nào đỏ lên.
  assert.ok(
    /for \(const home of layout\.dwellings \?\? \[\]\)/.test(CALLS),
    'Cảnh không còn duyệt `layout.dwellings`. Cả Phase 7C biến mất trong im lặng: engine vẫn tính '
    + 'đủ 17–30 căn nhà mỗi kỷ, test tầng thuần vẫn xanh, màn hình vẫn là bãi đất trống.',
  );
  // …và phải đi vào CÙNG `placements` với công trình, tức cùng khối hình gộp. Đẩy sang một mesh
  // riêng thì mỗi kỷ cộng thêm một lệnh vẽ — chính thứ ngân sách hiệu năng đang giữ.
  assert.ok(
    /placements\.push\(built\.placement\)/.test(CALLS),
    'Nhà dân không vào chung `placements` — mất gộp hình, cảnh sẽ tốn thêm lệnh vẽ.',
  );
  // Nhà dân KHÔNG được nhận `addPickTarget`: chạm vào một căn nhà vô danh mà hiện bảng thông tin
  // rỗng thì tệ hơn là không chạm được. Chỉ công trình thật và giàn giáo mới có chuyện để kể.
  //
  // ⚠️ HỎI ĐÍCH DANH KHỐI NHÀ DÂN, KHÔNG ĐẾM TỔNG SỐ LỜI GỌI. Bản đầu của bài này viết
  // `assert.equal(picks.length, 1)` và **đỏ ngay trên mã đang chạy đúng** — vì `addPickTarget` vốn
  // được gọi HAI lần hợp lệ (công trình + giàn giáo), một sự thật tôi không kiểm trước khi viết
  // con số. Cùng lỗi với `assert.equal(seen.size, 4)` ở `buildingSpec.test.js`: một phép đếm tuyệt
  // đối là lời phát biểu về phần mã mình KHÔNG nhìn, nên nó vừa đỏ oan hôm nay vừa sẽ đỏ oan lần
  // sau khi có thêm một thứ đáng chạm. Cắt đúng đoạn cần canh thì phép đo nói đúng thứ nó định nói.
  const block = CALLS.slice(CALLS.indexOf('for (const home of layout.dwellings'));
  const body = block.slice(0, block.indexOf('\n  }'));
  assert.ok(
    !/addPickTarget\(/.test(body),
    'Nhà dân đang được gắn `addPickTarget`. Chạm vào một căn nhà vô danh sẽ mở ra bảng rỗng — '
    + 'tệ hơn là không chạm được.',
  );
});

test('BẦU TRỜI PHẢN CHIẾU PHẢI LÀ BẦU TRỜI ĐANG NHÌN THẤY — một luật, một hàm', () => {
  // Vẽ vòm trời bằng một công thức rồi nướng bản đồ phản chiếu bằng công thức khác là đúng cái bẫy
  // `sweep-score.mjs` ↔ `city-preview.mjs` ở Phase 4G: hai bên lệch nhau thì kính sẽ phản chiếu một
  // bầu trời KHÁC với bầu trời ngay phía sau nó — vô lý một cách rất khó gọi tên.
  // ⚠️ ĐẾM TRÊN `CALLS`, KHÔNG TRÊN `CODE`. Bản đầu đếm trên `CODE` rồi đòi `>= 2` — và **KHÔNG đỏ**
  // khi gỡ hẳn quả cầu dò, vì `function paintSkyGradient(` tự nó đã là một match: định nghĩa +
  // 1 lời gọi = 2, đủ qua cửa. Một phép đếm gộp cả thứ mình đang đếm vào mẫu số thì luôn thừa một,
  // và cái thừa đó vừa đủ che mất chính hồi quy cần chặn.
  const calls = [...CALLS.matchAll(/paintSkyGradient\(/g)];
  assert.equal(
    calls.length, 2,
    `\`paintSkyGradient\` được gọi ${calls.length} lần (chưa kể dòng định nghĩa). Phải đúng HAI: một `
    + 'cho vòm trời nhìn thấy, một cho quả cầu dò dùng nướng bản đồ phản chiếu.',
  );
  // Và một trong hai phải là quả cầu dò — nếu không thì hai lời gọi có thể cùng vẽ vòm trời.
  assert.ok(
    /paintSkyGradient\(probeGeometry,/.test(CALLS),
    'Quả cầu dò không còn được tô bằng cùng hàm gradient. Nướng phản chiếu bằng công thức riêng là '
    + 'đúng bẫy `sweep-score.mjs` ở Phase 4G: hai công thức "tương đương trên giấy" luôn lệch ở biên.',
  );
});

test('MẶT ĐƯỜNG PHẢI DÙNG VẬT LIỆU CỦA KỶ, không dùng chung với mặt đất', () => {
  // ⚠️ Đây là loại vi phạm mà lint/build KHÔNG THỂ bắt, và là đúng bài học Phase 4H: một hàm tầng
  // engine có thể chạy hoàn hảo, có test riêng, mà **không ai gọi**. `getEraStyle(era).roadMaterial`
  // được khai đủ cho cả 15 kỷ và có test khoá ở `eraStyle.test.js`; nếu `sceneGraph.js` quên dùng
  // nó thì cả 15 kỷ vẫn hiện đúng MÀU (nhờ bảng màu) nhưng phản ứng với ánh sáng y hệt nhau — tức
  // vẫn là cùng một bề mặt. Triệu chứng: không có gì cả. Chỉ là thành phố phẳng hơn nó đáng ra.
  assert.match(
    CALLS, /materialProfile\(getEraStyle\(layout\.era\)\?\.roadMaterial\)/,
    'Mặt đường không còn tra vật liệu theo kỷ.',
  );

  // ⚠️ HỎI ĐÍCH DANH TẤM ĐƯỜNG, không hỏi "có ít nhất một chỗ dùng roadMaterial". Phép đếm gộp là
  // cái phễu chứ không phải hàng rào: cảnh này có nhiều mesh, nên chỉ cần một chỗ khác tình cờ nhận
  // vật liệu là assert vẫn xanh dù đúng tấm đường đã tuột mất.
  assert.match(
    CALLS, /\[road3d, roadMaterial\]/,
    'Tấm đường không còn được ghép với vật liệu riêng của nó.',
  );
  assert.ok(
    !/\[road3d, tileMaterial\]/.test(CALLS),
    'Tấm đường đang dùng chung vật liệu với mặt đất — đúng thứ Phase 7D đi sửa.',
  );

  // NGÕ PHỐ cũng phải đi qua bảng màu đường. Trước Phase 7D nó lấy `roles.stone` (màu đá xây
  // tường), nên 2/3 số ô đường không đổi theo kỷ — mà nhìn ảnh thì vẫn tưởng đã sửa xong.
  // ⚠️ Câu hỏi này nay thuộc về `terrainMesh.js` (nơi tô màu mặt đường), không còn ở `sceneGraph.js`.
  assert.match(TERRAIN_CODE, /palette\?\.roadLane/, 'Ngõ phố không còn suy từ mặt đường của kỷ.');
  assert.ok(
    !/roles\?\.stone/.test(TERRAIN_CODE),
    'Ngõ phố vẫn đang mượn màu đá xây tường — đúng chỗ rò rỉ mà Phase 7D sinh ra để bịt.',
  );
});
