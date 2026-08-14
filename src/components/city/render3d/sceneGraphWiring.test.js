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
 */
const GROUND_ANCHORS = [
  { name: 'ô nền', pattern: /const h = terrain\.heightAt\(cell\.x, cell\.y\)/,
    hurt: 'thềm không nhô lên — cả địa hình biến mất, mặt đất phẳng lì như trước Phase 7B' },
  { name: 'đường sá', pattern: /const h = terrain\.heightAt\(road\.x, road\.y\)/,
    hurt: 'đường nằm ở cao độ 0 trong khi đất đã nhô lên ⇒ phố chui xuyên vào trong đồi' },
  { name: 'công trình + móng', pattern: /terrain\.footprint\(cell\.x, cell\.y, span\)/,
    hurt: 'nhà đứng ở cao độ 0 ⇒ nhà trên đồi bị chôn tới nóc, nhà dưới thung lũng bay lơ lửng' },
  { name: 'cảnh vật', pattern: /y: terrain\.heightAt\(prop\.x, prop\.y\)/,
    hurt: 'cây/thùng/đèn cắm ở cao độ 0 ⇒ cây mọc xuyên qua sườn đồi hoặc treo giữa trời' },
  { name: 'cư dân', pattern: /terrain\.heightAt\(spot\.x, spot\.y\) \+ ROAD_SURFACE_Y/,
    hurt: 'người đi bộ lún dưới mặt đường hoặc đi trên không' },
];

test('SÁU CHỖ BÁM ĐẤT: mọi thứ đứng trên mặt đất đều phải hỏi `terrain`', () => {
  assert.ok(
    /const terrain = buildTerrain\(\{ era: layout\.era, gridSize \}\)/.test(CODE),
    'Không còn dựng địa hình cho cảnh. Cả Phase 7B biến mất mà không có gì đỏ.',
  );
  for (const anchor of GROUND_ANCHORS) {
    assert.ok(
      anchor.pattern.test(CODE),
      `Chỗ bám đất "${anchor.name}" không còn hỏi \`terrain\`. Hậu quả: ${anchor.hurt}. `
      + '⚠️ Sai chỗ này KHÔNG có gì đỏ lên — chỉ có mắt nhìn vào ảnh chụp mới bắt được.',
    );
  }
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
