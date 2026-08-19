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
const SHELL_SOURCE = readFileSync(join(HERE, 'CityScene3D.jsx'), 'utf8');
// ⚠️ Từ 2026-08-18 danh sách "thành phố gồm những khối nào" nằm ở `cityParts.js` (một bản duy nhất,
// dùng chung với bài test — xem đầu file ấy). Bài test dưới đây phải hỏi CẢ HAI phía: bên kia có
// còn duyệt nhà dân không, và bên này có còn dựng chúng vào cảnh không.
const PARTS_SOURCE = readFileSync(
  join(HERE, '..', '..', '..', 'engine', 'city3d', 'cityParts.js'), 'utf8');

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
const SHELL_CODE = codeOnly(SHELL_SOURCE);

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
  // ⚠️ HỎI HAI VẾ, VÌ TỪ PHASE 9C LUẬT NÀY NẰM Ở HAI DÒNG. Trước đây nó là một biểu thức viết
  // thẳng vào `envMapIntensity:`; nay giá trị được đặt tên (`envIntensity`) để `specularGainFor`
  // dùng lại đúng con số ấy thay vì tự suy ra lần nữa. Chỉ hỏi vế định nghĩa thì ai đó có thể khai
  // đúng rồi truyền một giá trị KHÁC vào vật liệu, và không có gì đỏ.
  assert.ok(
    /const envIntensity = profile\.metalness > 0\.15 \? 1 : ENV_DIFFUSE;/.test(CODE),
    'Luật "kim loại ăn trọn môi trường, bề mặt khuếch tán chỉ lấy một phần" đã bị đổi. Cho khuếch '
    + 'tán ăn trọn 1,0 thì đo được sáng 51,3 / tươi 14,4 / chiaroscuro 29 — nhạt hơn cả bản Lambert cũ.',
  );
  assert.ok(
    /envMapIntensity: envIntensity,/.test(buildingBlock[0]),
    'Vật liệu công trình không còn nhận đúng `envIntensity` vừa tính — luật khai một đằng, dùng một nẻo.',
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
  // ⚠️ KHOÁ TIỀN TỐ, KHÔNG KHOÁ TRỌN DANH SÁCH THAM SỐ — VÀ BÀI HỌC NÀY ĐÃ ĐƯỢC VIẾT RA CÁCH ĐÂY
  // HAI MƯƠI DÒNG RỒI VẪN CẮN Ở ĐÂY. Xem chú thích của `buildHorizonSurface` bên dưới: bản đầu của
  // nó khoá trọn danh sách và đỏ ngay lần đầu có người thêm một tham số CHÍNH ĐÁNG. Vòng lặp này
  // giữ nguyên `\}\)` đóng, nên khi `buildTerrainSurface` nhận thêm `tach` (cờ chỉ-dùng-để-đo, mặc
  // định tắt) nó đỏ với thông báo *"Cảnh không còn gọi buildTerrainSurface với terrain thật"* —
  // một câu SAI: hàm vẫn được gọi, vẫn với `terrain` thật. Phép đo hỏng, không phải mã hỏng.
  // ⇒ Lời hứa THẬT là "`terrain` vừa tính xong phải được đưa vào tấm vẽ", nên chỉ khoá tiền tố.
  // ⚠️ VÀ BẢN VÁ ĐẦU CỦA CHÍNH CHỖ NÀY CŨNG SAI, THEO ĐÚNG CÙNG MỘT KIỂU — LẦN THỨ BA TRONG MỘT
  // BÀI TEST. Nó viết `[,}]`, tức đòi ký tự NGAY SAU `palette` phải là dấu phẩy hoặc ngoặc đóng.
  // Đúng cho `buildTerrainSurface` (`palette,` — có tham số `tach` phía sau) và SAI cho
  // `buildRoadSurface` (`palette })` — giữa chúng có một DẤU CÁCH). Tôi đã vá đúng cái vế đang đỏ
  // rồi không thử vế còn lại của chính vòng lặp mình vừa sửa, nên bài test đổi từ báo sai về hàm
  // này sang báo sai về hàm kia. ⇒ Luật: **một bản vá nằm trong vòng lặp phải được kiểm với MỌI
  // phần tử của vòng lặp**, không chỉ phần tử vừa đỏ — nếu không thì "sửa xong" chỉ có nghĩa là
  // "cái tôi nhìn thấy đã hết đỏ". `\\s*[,}]` nhận cả `palette,` lẫn `palette })`.
  for (const fn of ['buildTerrainSurface', 'buildRoadSurface']) {
    assert.ok(
      new RegExp(`${fn}\\(\\{ terrain, gridSize, layout, palette\\s*[,}]`).test(CALLS),
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
  // ⚠️ CÂU HỎI NÀY NAY CÓ HAI VẾ, vì việc dựng danh sách đã tách sang `cityParts.js`. Hỏi thiếu một
  // vế là để lọt đúng ca nguy hiểm: `collectCitySpecs` vẫn sinh ra nhà dân đầy đủ mà `sceneGraph.js`
  // lặng lẽ bỏ qua nhánh `'dwelling'` (hoặc ngược lại) — cả hai đều cho ra một bãi đất trống.
  assert.ok(
    /for \(const home of layout\.dwellings \?\? \[\]\)/.test(PARTS_SOURCE),
    '`cityParts.js` không còn duyệt `layout.dwellings`. Cả Phase 7C biến mất trong im lặng: engine '
    + 'vẫn tính đủ 17–30 căn nhà mỗi kỷ, test tầng thuần vẫn xanh, màn hình vẫn là bãi đất trống.',
  );
  assert.ok(
    /item\.kind !== 'dwelling'/.test(CALLS),
    '`sceneGraph.js` không còn nhận nhánh `dwelling` từ `collectCitySpecs` — danh sách vẫn đủ nhà '
    + 'dân nhưng không căn nào được dựng vào cảnh.',
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
  const block = CALLS.slice(CALLS.indexOf("item.kind !== 'dwelling'"));
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
  // ⚠️ MỞ NGOẶC VUÔNG BẰNG `[,\]]` CHỨ KHÔNG ĐÓNG CỨNG `\]` — và đây là một PHÉP ĐO GIÀ ĐI, không
  // phải mã hỏng. Bản đầu viết `\[road3d, roadMaterial\]`, tức khoá luôn cả SỐ PHẦN TỬ của bộ ba.
  // Phase 9D thêm phần tử thứ ba (tên khối, để `city-preview.mjs --mask road` gọi đúng tên nó) và
  // bài này đỏ với thông báo "tấm đường không còn được ghép với vật liệu riêng" — trong khi tấm
  // đường vẫn ghép đúng vật liệu ấy, không sai một chữ. Cùng họ với bài "kỳ quan phải có 4 tháp
  // góc" ở Phase 5B: câu hỏi đúng, cách hỏi lỗi thời.
  assert.match(
    CALLS, /\[road3d, roadMaterial[,\]]/,
    'Tấm đường không còn được ghép với vật liệu riêng của nó.',
  );
  assert.ok(
    !/\[road3d, tileMaterial[,\]]/.test(CALLS),
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

const SCENE3D_CODE = codeOnly(readFileSync(join(HERE, 'CityScene3D.jsx'), 'utf8'));
const PREVIEW_CODE = codeOnly(
  readFileSync(join(HERE, '..', '..', '..', '..', 'scripts', 'city-preview.mjs'), 'utf8'),
);

test('⚠️ ĐÈN TRỜI PHẢI BÁM THEO NẮNG — một tỉ lệ, không phải hai hằng số rời nhau', () => {
  // ⚠️ ĐÂY LÀ BÀI CANH MỘT QUAN HỆ, VÀ NÓ TỒN TẠI VÌ MỘT QUAN HỆ ĐÃ TỪNG BỊ VIẾT THÀNH HẰNG SỐ
  // RỒI GÃY TRONG IM LẶNG. Độ đen của bóng đổ không do đèn nền quyết định — nó do KHOẢNG CÁCH
  // giữa đèn nền và nắng quyết định. Khi hai thứ ấy là hai con số không biết nhau, một phase khác
  // chỉnh nắng vì lý do riêng là bóng đổ tối đi mà không có gì đỏ lên. Đúng hình dạng lỗi mặt
  // đường của Phase 7D, và đúng chuyện đã xảy ra ở đây: Phase 7A hạ đèn bán cầu theo một giả
  // thuyết về sau bị bác, rồi con số ấy nằm lại nhiều phase.
  //
  // Bài này KHÔNG khoá giá trị 0,41 (đó là một lựa chọn mỹ thuật, đo lại thì được đổi) — nó khoá
  // cái HÌNH DẠNG: đèn bán cầu phải được tính TỪ cường độ nắng. Viết ngược lại thành một số rời là
  // đỏ ngay.
  assert.match(
    CODE, /const SUN_BASE = /,
    'Cường độ nắng không còn là một đại lượng có tên — đèn trời hết chỗ bám vào.',
  );
  assert.match(
    CODE, /new HemisphereLight\([\s\S]{0,200}?SUN_BASE \* SKY_FILL_RATIO/,
    'Đèn bán cầu thôi bám theo nắng — nó đã quay về làm một hằng số rời, và bóng đổ sẽ lại đen dần.',
  );
  assert.match(
    CODE, /new DirectionalLight\([\s\S]{0,120}?SUN_BASE \* sunEnergy/,
    'Đèn mặt trời không còn dùng chính `SUN_BASE` mà đèn trời đang bám vào — hai bên đã tách nhau.',
  );

  // Và tỉ lệ phải nằm trong khoảng còn nghĩa: 0 là tắt hẳn đèn trời (bóng đen trở lại), ≥1 là đèn
  // nền mạnh hơn nắng — lúc đó không còn hướng sáng nào và cảnh dẹt ra đúng kiểu "pastel như sữa".
  const ratios = [...CODE.matchAll(/SKY_FILL_RATIO = palette\.isDark \? ([\d.]+) : ([\d.]+)/g)];
  assert.equal(ratios.length, 1, 'Không tìm thấy khai báo tỉ lệ đèn trời/nắng.');
  for (const value of ratios[0].slice(1).map(Number)) {
    assert.ok(value > 0.2 && value < 1,
      `Tỉ lệ đèn trời/nắng ${value} nằm ngoài khoảng còn nghĩa (0,2 … 1).`);
  }
});

test('⚠️ BÓNG ĐỔ CHỈ ĐƯỢC CẤU HÌNH Ở MỘT CHỖ — công cụ xem thử phải thấy đúng thứ app thấy', () => {
  // ⚠️ BÀI ĐỐI CHỨNG NHỐT MỘT LỖI ĐÃ CHẠY THẬT. Cỡ bản đồ bóng đổ từng được viết cứng ở BA nơi với
  // BA giá trị: app 1024, trang xem thử một-kỷ 1024, bản QUÉT 15 kỷ chỉ 512. Mà bản quét chính là
  // công cụ `CLAUDE.md` bắt buộc dùng để duyệt mỹ thuật ⇒ mọi nhận xét về bóng đổ rút ra từ nó đều
  // đang nói về một thế giới thô gấp đôi thứ Đàm nhìn thấy. Không có gì đỏ lên: ảnh vẫn dựng ra.
  assert.match(
    CODE, /sun\.shadow\.mapSize\.setScalar\(isMobile \? SHADOW_MAP_MOBILE : SHADOW_MAP_DESKTOP\)/,
    'Cảnh không còn tự đặt cỡ bóng lúc dựng — ai dựng cảnh mà không biết dòng này sẽ nhận mặc định 512.',
  );
  assert.match(CODE, /renderer\.shadowMap\.type = /,
    'Kiểu bóng đổ không còn được đặt trong `applyPaintedLook` — hai thế giới sắp trôi khỏi nhau.');

  // ⚠️ HỎI ĐÍCH DANH: hai nơi gọi TUYỆT ĐỐI không được tự khai lại, vì tự khai lại CHÍNH LÀ cách
  // ba giá trị khác nhau đã sinh ra. Đây là hàng rào, không phải cái phễu.
  // ⚠️ CẤM GHI, KHÔNG CẤM ĐỌC — và bản đầu của chính assert này đã sai đúng chỗ đó: nó hỏi
  // `/shadow\.mapSize/` nên bắt luôn dòng `shadowMap: city.sun.shadow.mapSize.width` mà HUD hiệu
  // năng dùng để BÁO CÁO cỡ bóng thật. Đọc lại giá trị là việc đúng và đáng khuyến khích (đó là
  // cách Đàm nhìn thấy cảnh đang chạy ở cỡ nào); thứ phải cấm là tự ĐẶT một giá trị thứ hai.
  for (const [name, code] of [['CityScene3D.jsx', SCENE3D_CODE], ['city-preview.mjs', PREVIEW_CODE]]) {
    assert.ok(!/shadow\.mapSize\.(setScalar|set)\s*\(|shadow\.mapSize\.\w+\s*=/.test(code),
      `${name} lại tự đặt cỡ bản đồ bóng đổ — luật này chỉ được có MỘT chỗ phát biểu.`);
    assert.ok(!/shadowMap\.type/.test(code),
      `${name} lại tự đặt kiểu bóng đổ thay vì dùng \`applyPaintedLook\`.`);
  }
  // …và cả hai vẫn phải THỰC SỰ gọi hàm dùng chung, nếu không thì "không tự khai" chỉ có nghĩa là
  // không có bóng đổ nào cả.
  for (const [name, code] of [['CityScene3D.jsx', SCENE3D_CODE], ['city-preview.mjs', PREVIEW_CODE]]) {
    assert.match(code, /applyPaintedLook\(renderer\)/,
      `${name} không còn gọi \`applyPaintedLook\` — nó đang dựng bằng một cấu hình khác.`);
  }
});

const DETAIL_CODE = codeOnly(readFileSync(join(HERE, 'surfaceDetail.js'), 'utf8'));

test('⚠️ ĐĨA MẶT TRỜI PHẢI CHÓI HƠN 1 VÀ CHỈ NƯỚNG VÀO MÔI TRƯỜNG', () => {
  // Phase 9C. Đợt audit đo ra: giữa trưa KHÔNG một điểm ảnh nào sáng quá 0,75 ở kỷ 3 và kỷ 7
  // (0,00%). Nguyên nhân: môi trường phản chiếu chỉ là một dải trời đều đều, nên mặt bóng chẳng có
  // gì để phản chiếu thành điểm loé. Ba điều dưới đây là điều kiện cần để bản vá còn sống.

  // (1) ĐỘ CHÓI PHẢI >1. Đây là chỗ hỏng IM LẶNG nhất của cả bản vá: nếu ai đó hạ nó về ≤1, hoặc
  //     three đổi PMREM sang render target 8-bit, thì đĩa bị kẹp về 1,0 — vẫn có một đốm sáng
  //     trong bản đồ môi trường, vẫn không có lỗi nào, mà mọi điểm loé biến mất sạch.
  const radiance = /const SUN_DISC_RADIANCE = ([\d.]+)/.exec(CODE);
  assert.ok(radiance, 'Không còn `SUN_DISC_RADIANCE` — đĩa mặt trời đã bị gỡ.');
  assert.ok(Number(radiance[1]) > 1,
    `Độ chói đĩa = ${radiance[1]} ≤ 1: nó không còn là nguồn HDR, và điểm loé sẽ biến mất trong im lặng.`);

  // (2) ĐĨA PHẢI THẬT SỰ ĐƯỢC THÊM VÀO CẢNH THĂM DÒ. Khai hằng số mà quên `probeScene.add` là đúng
  //     loại lỗi mà Phase 4H đã trả giá: hàm viết xong, có test, và không ai gọi.
  assert.match(CALLS, /probeScene\.add\(disc\)/,
    'Đĩa mặt trời được dựng nhưng KHÔNG được thêm vào cảnh thăm dò — nó không vào bản đồ môi trường.');
  assert.match(CALLS, /skyLook\.glow\)\.multiplyScalar\(skyLook\.sunDiscRadiance\)/,
    'Độ chói không còn được nhân vào màu đĩa — đĩa trở lại sáng như bầu trời, tức vô hình.');

  // (3) VÀ CHỈ VÀO MÔI TRƯỜNG, KHÔNG VẼ LÊN VÒM TRỜI NHÌN THẤY. `paintSkyGradient` đã có hẳn một
  //     đoạn chú thích giải thích vì sao một cái đĩa sắc nét trên vòm trời trông như lỗi. Cách duy
  //     nhất giữ được cả hai là để `sunDiscRadiance` nằm trong `skyLook` mà chỉ một bên đọc.
  const painter = /function paintSkyGradient\([\s\S]*?\n}/.exec(CODE);
  assert.ok(painter, 'Không tìm thấy `paintSkyGradient`.');
  assert.ok(!/sunDiscRadiance/.test(painter[0]),
    'Vòm trời NHÌN THẤY đã bắt đầu đọc `sunDiscRadiance` — nó sắp mọc một cái đĩa sắc nét trên nền trời.');
});

test('⚠️ BẢN VÁ BỀ MẶT CHỈ ĐƯỢC NHÂN PHẢN CHIẾU, KHÔNG ĐƯỢC NHÂN KHUẾCH TÁN', () => {
  // Phase 9C. `envMapIntensity` của three gánh HAI việc — nó nhân vào cả `iblIrradiance` (khuếch
  // tán, rọi đều mọi hướng) lẫn `radiance` (phản chiếu). Dự án đặt 0,12 để cứu độ tươi, và con số
  // ấy ĐÚNG cho đường khuếch tán. Bản vá gỡ phanh cho đường phản chiếu; nhân nhầm sang đường kia
  // là quay lại đúng thất bại "pastel như sữa" của Phase 7A, chỉ vào bằng cửa khác.
  assert.match(DETAIL_CODE, /radiance \*= uSpecGain;/,
    'Không còn nhân phản chiếu — bản vá tách-đôi đã chết, cảnh quay về không có điểm loé.');
  assert.ok(!/iblIrradiance\s*\*=/.test(DETAIL_CODE),
    'Có ai đó bắt đầu nhân `iblIrradiance` — đó là đường KHUẾCH TÁN, nhân vào là làm nhạt cả thành phố.');

  // ⚠️ KHOÁ MỘT QUYẾT ĐỊNH ĐÃ ĐO, KHÔNG PHẢI MỘT SỞ THÍCH. Bản đầu bóc phanh cho MỌI bề mặt và đo
  // ra: độ tươi kỷ 3/7/14 tụt 0,120→0,109 · 0,082→0,070 · 0,109→0,102, trong khi đỉnh sáng KHÔNG
  // hơn được một chút nào so với chỉ-bóc-công-trình (0,753 · 0,773 · 0,869 y hệt cả hai bên). Mặt
  // đất/đường/đồi nhám 0,96–0,98 nên "phản chiếu" của chúng là một lớp sáng đều đội lốt.
  // Ai đó "dọn cho nhất quán" bằng cách rắc `specularGain` vào cả ba sẽ mất màu mà không được gì.
  for (const surface of ['ground', 'road', 'outskirts']) {
    const call = new RegExp(`\\.\\.\\.GRAIN\\.${surface}[^}]*specularGain`);
    assert.ok(!call.test(CODE),
      `\`GRAIN.${surface}\` lại được bóc phanh phản chiếu — đo rồi: mất độ tươi, không thêm đỉnh sáng.`);
  }
  assert.match(CODE, /\.\.\.GRAIN\.building, specularGain: specularGainFor\(envIntensity\)/,
    'Công trình không còn được bóc phanh phản chiếu — đây là bề mặt DUY NHẤT bản vá này có tác dụng.');

  // Bốn bề mặt đều phải thật sự được vá, nếu không "có hạt vân" chỉ đúng với một phần cảnh.
  for (const surface of ['ground', 'road', 'outskirts', 'building']) {
    assert.ok(new RegExp(`\\.\\.\\.GRAIN\\.${surface}`).test(CODE),
      `Bề mặt \`${surface}\` không còn được vá hạt vân — nó sẽ phẳng lì giữa những mặt đã có vân.`);
  }
});

test('⚠️ VẬT LIỆU ĐÃ VÁ PHẢI CÓ KHOÁ CHƯƠNG TRÌNH RIÊNG', () => {
  // three gộp chương trình shader theo khoá. Không khai khoá riêng thì một vật liệu ĐÃ vá và một
  // vật liệu CHƯA vá có cùng cấu hình gốc sẽ dùng chung chương trình đã biên dịch — bản vá hoặc rò
  // sang chỗ không nên có, hoặc biến mất ở chỗ nên có, tuỳ cái nào biên dịch trước. Không có lỗi
  // nào hiện ra; chỉ là một vài bề mặt im lặng sai.
  assert.match(DETAIL_CODE, /customProgramCacheKey = \(\) =>/,
    '`applySurfaceDetail` không còn khai `customProgramCacheKey` — shader sẽ bị gộp nhầm.');
});

test('⚠️ TRANG XEM THỬ PHẢI DỰNG Ở ĐÚNG TẦNG ĐIỂM ẢNH CỦA APP', () => {
  // Phase 9C. Trước bản vá này, app dựng ở `min(devicePixelRatio, 2)` còn trang xem thử viết cứng
  // `setPixelRatio(1)` ở CẢ HAI khối — tức mọi nhận xét mỹ thuật rút ra từ nó (răng cưa, mép khối,
  // cây cối, chi tiết nhỏ) suốt nhiều tháng đều đang nói về một bản dựng THẤP HƠN bản thật. Cùng
  // hình dạng lỗi với cỡ bóng đổ ở bài trên, ở một cần gạt khác.
  assert.match(CODE, /export const MAX_PIXEL_RATIO = 2;/,
    'Trần tỉ lệ điểm ảnh không còn nằm ở `sceneGraph.js` — hai nơi sắp tự khai lại.');
  assert.match(SCENE3D_CODE, /Math\.min\(window\.devicePixelRatio \|\| 1, MAX_PIXEL_RATIO\)/,
    'App không còn dùng `MAX_PIXEL_RATIO` nhập về — nó đang tự khai lại một trần thứ hai.');
  // Trang xem thử: cờ `--dpr` được phép tồn tại (nó dùng để THỬ NGƯỢC lời hứa này), nhưng MẶC ĐỊNH
  // phải là hằng số dùng chung. Hỏi đúng dòng mặc định, không hỏi chung chung.
  assert.match(PREVIEW_CODE, /dpr === null \? 'MAX_PIXEL_RATIO' : dpr/,
    'Trang xem thử không còn mặc định về `MAX_PIXEL_RATIO` — nó lại dựng ở một tầng chất lượng riêng.');
  assert.ok(!/setPixelRatio\(1\)/.test(PREVIEW_CODE),
    'Trang xem thử lại viết cứng `setPixelRatio(1)` — đúng lỗi Phase 9C vừa sửa.');
});

test('⚠️ VẬT CẢN PHẢI ĐỌC THẲNG TỪ DANH SÁCH KHỐI ĐÃ ĐEM ĐI DỰNG HÌNH', () => {
  // Camera cận cảnh tránh va vào phố bằng cách hỏi `city.blockers`. Nếu danh sách ấy được dựng
  // bằng một vòng lặp RIÊNG (duyệt lại `layout` chẳng hạn) thì nó là công thức thứ hai cho cùng
  // một luật, và triệu chứng sẽ là camera đâm xuyên qua đúng những khối được thêm ở phase sau —
  // im lặng tuyệt đối: build xanh, lint sạch, test cũ xanh.
  assert.ok(
    /for \(const placement of placements\)[\s\S]{0,320}?blockers\.push\(box\)/.test(CODE),
    'Không còn vòng lặp nào dựng `blockers` TỪ `placements`. Dựng lại danh sách khối bằng đường '
    + 'khác là tạo công thức thứ hai cho cùng một luật.',
  );
  assert.ok(/^\s*blockers,\s*$/m.test(CODE), '`blockers` không còn được cảnh trả ra ⇒ camera cận cảnh mù.');
  // Phải nằm SAU khi móng đã được đẩy vào: móng cũng là khối đứng trên đất.
  assert.ok(
    CODE.indexOf('placements.push(...plinths)') < CODE.indexOf('blockers.push(box)'),
    'Vật cản được gom TRƯỚC khi móng vào danh sách ⇒ camera coi bệ kè là không khí.',
  );
});

test('⚠️ VỎ REACT PHẢI ĐƯA ĐÚNG VẬT CẢN CỦA CẢNH CHO BỘ LẬP KẾ HOẠCH BAY', () => {
  // Đây là chỗ nối duy nhất giữa "cảnh biết mình có những khối nào" và "camera biết chỗ nào cấm
  // bay". Truyền nhầm một mảng khác (hoặc quên truyền) thì `planCityFocus` vẫn chạy, vẫn trả về
  // một kế hoạch trông rất hợp lý, và camera vẫn bay thẳng vào giữa phố.
  assert.ok(/planCityFocus\(\{/.test(SHELL_CODE), 'Vỏ React không còn gọi `planCityFocus`.');
  assert.ok(
    /blockers:\s*city\.blockers/.test(SHELL_CODE),
    'Bộ lập kế hoạch bay không còn nhận `city.blockers` — nó đang lập kế hoạch cho một thành phố rỗng.',
  );
  assert.ok(
    /setLimits\(\{\s*minPitch:\s*flight\.minPitch/.test(SHELL_CODE),
    'Sàn an toàn không còn được bật lúc hạ cánh ⇒ lời hứa "camera không chui vào phố" chỉ đúng '
    + 'đúng một khung hình, rồi vỡ ở cú kéo đầu tiên của Đàm.',
  );
});

test('⚠️ CHẠM VÀO MỘT CĂN NHÀ KHÔNG ĐƯỢC DỰNG LẠI CẢ CẢNH WEBGL', () => {
  // `focusKind`/`focusBpId` mà lọt vào danh sách phụ thuộc của effect dựng cảnh thì mỗi cú chạm sẽ
  // tháo WebGL context rồi dựng lại toàn bộ thành phố — tức một cú chạm tốn bằng một lần đổi kỷ,
  // và trên iPhone thì đó là một khoảng đen chớp giữa màn hình.
  const deps = SHELL_CODE.match(/\}, \[layout, dimmed[\s\S]*?\]\);/);
  assert.ok(deps, 'Không tìm thấy danh sách phụ thuộc của effect dựng cảnh — bài test này đã mù.');
  assert.doesNotMatch(deps[0], /focusKind|focusBpId/,
    'Prop tiêu điểm lọt vào danh sách phụ thuộc của effect dựng cảnh.');
  assert.ok(
    /runtimeRef\.current\?\.applyFocus\(/.test(SHELL_CODE),
    'Không còn effect riêng gọi `applyFocus` ⇒ chạm vào nhà thì camera đứng im.',
  );
  assert.ok(
    /applyFocus\(focusRef\.current\)/.test(SHELL_CODE),
    'Cảnh dựng lại (đổi kỷ, xong phiên) mà không bay lại tới công trình đang chọn ⇒ thẻ thông tin '
    + 'nói một đằng, camera nhìn một nẻo.',
  );
});

test('⚠️ HAI CỜ CHỈ-DÙNG-ĐỂ-ĐO KHÔNG ĐƯỢC XUẤT HIỆN TRONG VỎ REACT CỦA APP', () => {
  // ⚠️ BÀI NÀY SINH RA VÌ MỘT CHÚ THÍCH TỰ NHẬN CÓ TEST MÀ KHÔNG CÓ. Khối chú thích của
  // `splitCityMesh` ở `sceneStats.test.js` liệt kê ba vế được khoá, vế thứ ba là *"và app KHÔNG BAO
  // GIỜ truyền cờ này"* — nhưng chỉ hai vế đầu có assert. Đúng hình dạng lỗi Phase 8B: chú thích
  // của `countTriangles` tự nhận *"có test đối chiếu hai bên"* trong khi bài test ấy chỉ so với
  // hằng số viết tay, và lời hứa ấy sống sót sáu tháng vì nó nghe đã đủ yên tâm.
  //
  // Vì sao vế này đáng canh: bật nhầm cờ đo trong app thì KHÔNG có gì đỏ lên — ảnh y hệt, tam giác
  // y hệt, chỉ ngân sách lệnh vẽ bị thủng trong im lặng. Mà ngân sách lệnh vẽ là ràng buộc cứng
  // nhất của giai đoạn "tiêu ngân sách" (được tiêu tam giác, CẤM tiêu lệnh vẽ).
  for (const cờ of ['splitCityMesh', 'splitGroundMesh']) {
    assert.ok(!SCENE3D_CODE.includes(cờ),
      `\`${cờ}\` xuất hiện trong CityScene3D.jsx — cờ chỉ-dùng-để-đo đã rò vào app, mất lệnh vẽ`);
  }
  // Và đối chứng: công cụ chụp PHẢI truyền chúng, nếu không thì `--mask` đang đo một tấm rỗng.
  for (const cờ of ['splitCityMesh', 'splitGroundMesh']) {
    assert.ok(PREVIEW_CODE.includes(cờ),
      `\`${cờ}\` không có trong city-preview.mjs — không ai bật cờ này thì phép đo mặt nạ vô nghĩa`);
  }
});
