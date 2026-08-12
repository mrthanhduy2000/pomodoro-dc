/**
 * cityRenderers.test.js — khoá RANH GIỚI KIẾN TRÚC của màn hình Thành Phố (ADR-008).
 * ─────────────────────────────────────────────────────────────────────────────
 * Đây không phải test hành vi — nó đọc thẳng mã nguồn và bắt những vi phạm mà lint/build KHÔNG
 * bắt được, vì code vẫn chạy đúng khi vi phạm. Cùng thủ pháp "đọc mã nguồn" đã dùng ở
 * `store/gameStore.cityArchive.test.js` để canh 3 danh sách trường được lưu.
 *
 * ⚠️ VÌ SAO VIẾT NGAY BÂY GIỜ, KHI CHƯA CÓ three.js: bài "chỉ `render3d/` được import 'three'" lúc
 * này đúng một cách hiển nhiên (chưa file nào import). Nhưng đúng lúc Phase 3A thêm three.js vào
 * là lúc dễ vi phạm nhất — một lần lỡ `import` tĩnh ở file ngoài sẽ kéo ~130 KB vào chunk chính và
 * làm hỏng cả cơ chế nạp lười lẫn đường lui 2D. Đặt lưới TRƯỚC khi bước lên dây, không phải sau.
 *
 * Bài test QUÉT CẢ CÂY `src/`, không chỉ thư mục này — vi phạm có thể nằm ở bất cứ đâu.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

import { DEFAULT_PITCH, DEFAULT_YAW, orbitPosition } from '../../engine/city3d/orbit.js';

const SRC = new URL('../../', import.meta.url);

/** Mọi file mã nguồn trong `src/`, trả về `{ path: 'components/city/...', source }`. */
async function readSourceFiles() {
  const names = await readdir(SRC, { recursive: true });
  const files = names
    .map((name) => name.split('\\').join('/'))          // Windows → dấu / cho đồng nhất
    .filter((name) => /\.(js|jsx)$/.test(name) && !name.endsWith('.test.js'));

  return Promise.all(files.map(async (path) => ({
    path,
    source: await readFile(new URL(path, SRC), 'utf8'),
  })));
}

const SOURCES = await readSourceFiles();

/** Lọc theo tiền tố đường dẫn — dùng chung cho các bài dưới. */
function under(prefix) {
  return SOURCES.filter((file) => file.path.startsWith(prefix));
}

/**
 * Bỏ chú thích, chỉ giữ MÃ CHẠY THẬT.
 *
 * ⚠️ Bắt buộc cho mọi bài kiểu "cấm dùng thứ X". Dự án này viết chú thích rất dài và thường giải
 * thích ngay tại chỗ *vì sao KHÔNG dùng* thứ bị cấm — nên nếu so thẳng trên nguyên văn file thì
 * chính lời giải thích sẽ làm bài test đỏ, và người sửa sẽ bị dụ đi xoá chú thích thay vì xoá lỗi.
 * (Đã dính đúng một lần với `scrollIntoView` ở `EraSwitcher.jsx`.)
 */
function codeOnly(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join('\n');
}

test('lưới an toàn của chính bài test: quét được cây src/ và thấy các file Thành Phố', () => {
  // Nếu cách quét hỏng (đổi cấu trúc, đổi tên thư mục), mọi bài dưới sẽ PASS RỖNG một cách âm thầm.
  assert.ok(SOURCES.length > 50, `quét được quá ít file (${SOURCES.length}) — cách quét có thể đã hỏng`);
  assert.ok(under('components/city/render2d/').length >= 2, 'không thấy bộ vẽ 2D');
  assert.ok(SOURCES.some((f) => f.path === 'components/city/CityViewShell.jsx'), 'không thấy khung');
});

test("chỉ `city/render3d/` được phép import 'three'", () => {
  const offenders = SOURCES
    .filter((file) => /\bfrom\s+['"]three(\/|['"])/.test(file.source) || /\bimport\(['"]three(\/|['"])/.test(file.source))
    .map((file) => file.path)
    .filter((path) => !path.startsWith('components/city/render3d/'));

  assert.deepEqual(offenders, [],
    "import 'three' bên ngoài render3d/ ⇒ three.js lọt vào chunk chính và bộ vẽ 2D hết là đường lui");
});

test('KHUNG không được biết bộ vẽ nào đang chạy', () => {
  const shell = SOURCES.find((file) => file.path === 'components/city/CityViewShell.jsx');

  assert.doesNotMatch(shell.source, /from\s+['"][^'"]*render2d/,
    'CityViewShell import bộ vẽ 2D ⇒ không lùi sang bộ vẽ khác được nữa (ADR-008)');
  assert.doesNotMatch(shell.source, /from\s+['"][^'"]*render3d/,
    'CityViewShell import bộ vẽ 3D ⇒ máy không có WebGL sẽ vỡ cả khung, không chỉ vỡ phần hình');
});

test('hai bộ vẽ không được import lẫn nhau', () => {
  for (const file of [...under('components/city/render2d/'), ...under('components/city/render3d/')]) {
    const other = file.path.includes('/render2d/') ? 'render3d' : 'render2d';
    assert.doesNotMatch(file.source, new RegExp(`from\\s+['"][^'"]*${other}`),
      `${file.path} import ${other}/ ⇒ hai bộ vẽ dính nhau, đường lui kéo theo đúng thứ nó phải tránh`);
  }
});

test('bộ vẽ chỉ nhận dữ liệu qua props, không tự đọc store', () => {
  // Bộ vẽ phải vẽ được BẤT KỲ bố cục nào đưa vào — kể cả thành phố kỷ cũ lấy từ bảo tàng, thứ
  // KHÔNG nằm trong state đang chơi. Tự đọc store là tự khoá mình vào đúng một nguồn dữ liệu.
  for (const file of [...under('components/city/render2d/'), ...under('components/city/render3d/')]) {
    assert.doesNotMatch(file.source, /from\s+['"][^'"]*store\//,
      `${file.path} đọc thẳng store ⇒ không vẽ được thành phố trong bảo tàng`);
  }
});

test('token riêng của bộ vẽ 2D không rò ra ngoài render2d/', () => {
  // `tokens2d.js` là bảng màu rgba() + phép chiếu isometric — mẹo chỉ đúng trong SVG/CSS.
  // Ai đó import nó ở ngoài (nhất là từ render3d/) là đang dùng thứ WebGL không diễn giải được.
  const offenders = SOURCES
    .filter((file) => /from\s+['"][^'"]*tokens2d/.test(file.source))
    .map((file) => file.path)
    .filter((path) => !path.startsWith('components/city/render2d/'));

  assert.deepEqual(offenders, [], 'tokens2d chỉ dành cho bộ vẽ 2D — phần dùng chung nằm ở cityTokens.js');
});

test('mặt trời KHÔNG được đứng sau lưng camera — đây là bẫy "nhìn code không thấy sai"', () => {
  // ⚠️ VÌ SAO BÀI NÀY TỒN TẠI (Phase 3C):
  // `sceneGraph.js` từng đặt hướng nắng là (0,78 · 0,54 · 0,46) — đọc lên hoàn toàn hợp lý, kiểu
  // "nắng xiên từ trên cao xuống". Nhưng camera mặc định đứng ở phương vị 45°, mà hướng đó cũng ở
  // phương vị ~60°: mặt trời rơi đúng SAU LƯNG người xem. Kết quả là đèn flash máy ảnh — mọi mặt
  // quay về phía ta sáng đều nhau, bóng đổ trốn hết ra sau công trình, hình khối bẹp dí. Toàn bộ
  // công dựng dáng nhà ở Phase 3B bị vô hiệu bởi đúng MỘT vector.
  //
  // Không lint nào, không test hành vi nào bắt được chuyện này: code chạy đúng, cảnh vẫn hiện ra,
  // chỉ là nó xấu. Thứ duy nhất bắt được là một phép tính hình học trên chính hai con số đó.
  const scene = SOURCES.find((file) => file.path === 'components/city/render3d/sceneGraph.js');
  assert.ok(scene, 'không tìm thấy sceneGraph.js');

  const match = scene.source.match(
    /const\s+SUN_DIRECTION\s*=\s*new\s+Vector3\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/,
  );
  assert.ok(match, 'không đọc được SUN_DIRECTION — đổi cách khai báo thì phải sửa cả bài test này');
  const [sx, sy, sz] = match.slice(1, 4).map(Number);
  const slen = Math.hypot(sx, sy, sz);

  // Hướng nhìn của camera mặc định, dựng từ chính `orbit.js` (thuần, import thẳng được).
  const eye = orbitPosition({
    yaw: DEFAULT_YAW, pitch: DEFAULT_PITCH, distance: 1, target: { x: 0, y: 0, z: 0 },
  });
  const flen = Math.hypot(eye.x, eye.y, eye.z);
  // Camera nhìn VỀ gốc toạ độ ⇒ hướng nhìn = −vị trí.
  const forward = { x: -eye.x / flen, y: -eye.y / flen, z: -eye.z / flen };

  const alignment = (sx * forward.x + sy * forward.y + sz * forward.z) / slen;

  // −1 = nắng ngay sau lưng (chiếu thẳng vào mặt vật, bẹt nhất). +1 = nắng ngược sáng hoàn toàn.
  // Yêu cầu |alignment| ≤ 0,55: nắng phải đủ LỆCH SANG BÊN để mỗi khối có một mặt sáng và một mặt
  // khuất. Ngưỡng nới tay có chủ ý — bài này canh cái BẪY, không áp đặt một góc nắng cụ thể.
  assert.ok(Math.abs(alignment) <= 0.55,
    `nắng gần như thẳng trục nhìn (tích vô hướng ${alignment.toFixed(2)}) ⇒ cảnh sẽ bẹt như chụp đèn flash`);

  // Và phải ở TRÊN đường chân trời — nắng từ dưới đất hắt lên thì không còn là mặt trời nữa.
  assert.ok(sy / slen > 0.2, `mặt trời quá thấp hoặc nằm dưới mặt đất (y = ${(sy / slen).toFixed(2)})`);
});

test('THANH CHUYỂN KỶ phải tự kéo kỷ đang xem vào tầm mắt — và đo cho đúng', () => {
  // ⚠️ Bài này khoá lại một lỗi CHỈ LỘ RA KHI CHƠI LÂU, nên gần như không thể bắt bằng mắt lúc
  // phát triển: các kỷ đã đi qua xếp TRƯỚC kỷ hiện tại trong thanh cuộn ngang, nên càng nhiều kỷ
  // thì nút DUY NHẤT Đàm quan tâm càng bị đẩy ra ngoài. Đo trên bản build ở kỷ 7: nội dung 999px
  // trong khung 952px ⇒ nút "Kỷ 7 · đang xây" cụt mất 47px ở MỌI lần mở tab. Tới kỷ 15 thì khuất
  // hẳn, mở tab lên chỉ thấy một dãy "thất truyền" xám.
  const found = SOURCES.find((f) => f.path === 'components/city/EraSwitcher.jsx');
  assert.ok(found, 'không thấy EraSwitcher.jsx');
  const rail = { source: codeOnly(found.source) };

  assert.match(rail.source, /scrollTo\(/, 'thanh chuyển kỷ không tự cuộn tới kỷ đang xem');

  // ⚠️ KHÔNG được dùng `scrollIntoView`: thanh này nằm trong một khung cuộn khác, và
  // `scrollIntoView` kéo luôn cả khung cha ⇒ mở tab Thành Phố thì trang tự nhảy xuống giữa chừng.
  assert.doesNotMatch(rail.source, /scrollIntoView/,
    'scrollIntoView kéo cả khung cha — phải tự tính scrollLeft của riêng thanh này');

  // ⚠️ KHÔNG được đo bằng `offsetLeft`: thanh này `position: static` nên `offsetParent` là một
  // khung cha ở tận ngoài, và số đo CỘNG THÊM khoảng cách từ mép trang (đo thật: 1151 trong khi
  // toàn bộ nội dung thanh chỉ rộng 999). Ở kỷ cuối sai số đó bị kẹp về mép phải nên trông vẫn
  // đúng — nên nếu ai đó "đơn giản hoá" lại thành offsetLeft, thử ở kỷ hiện tại sẽ KHÔNG thấy sai.
  assert.doesNotMatch(rail.source, /\.offsetLeft/,
    'offsetLeft tính từ offsetParent chứ không từ thanh cuộn ⇒ cuộn quá tay ở các kỷ giữa');
  assert.match(rail.source, /getBoundingClientRect/, 'phải đo bằng getBoundingClientRect');

  // Và phải căn LẠI khi kích thước đổi: lần chạy đầu rơi vào lúc font riêng của skin chưa nạp
  // xong, các nút còn hẹp, thanh chưa tràn ⇒ không có gì để cuộn. Font nạp xong thì chữ nở ra,
  // thanh mới tràn — nếu không ai gọi lại thì lỗi quay về nguyên vẹn.
  assert.match(rail.source, /ResizeObserver/,
    'căn một lần rồi thôi ⇒ font nạp xong là hỏng lại (đã trả giá đúng một lần)');
});

test('THẺ THÔNG TIN nổi trên cảnh không được nuốt thao tác kéo xoay', () => {
  // ⚠️ Cùng họ với bài "lớp nền không nuốt thao tác" ngay dưới, và cũng cùng kiểu nguy hiểm: thẻ
  // được đặt trong một lớp bọc phủ KÍN đáy cảnh. Thiếu `pointer-events-none` ở lớp bọc thì cả dải
  // trống hai bên thẻ vẫn chặn ngón tay — Đàm kéo xoay ở nửa dưới thành phố sẽ thấy nó "cứng đờ"
  // mà không có lỗi nào để lần ra. Và thiếu `pointer-events-auto` ở CHÍNH thẻ thì ngược lại: nút
  // đóng bấm không được.
  const stage = SOURCES.find((f) => f.path === 'components/city/CityStage.jsx');
  const card = SOURCES.find((f) => f.path === 'components/city/BuildingCard.jsx');
  assert.ok(stage && card, 'không thấy CityStage.jsx hoặc BuildingCard.jsx');

  assert.match(stage.source, /pointer-events-none[^"'`]*absolute/,
    'lớp bọc thẻ thông tin phải có pointer-events-none');
  assert.match(card.source, /pointer-events-auto/,
    'chính thẻ phải có pointer-events-auto, nếu không nút đóng bấm không được');
});

test('LỚP NỀN TRANG CHỦ không được chạm vào công trình', () => {
  // Trang chủ là chỗ để LÀM VIỆC. Một thẻ thông tin bật lên sau lưng đồng hồ đếm ngược vì Đàm lỡ
  // chạm vào màn hình là đúng thứ phá mất sự yên tĩnh mà màn hình đó tồn tại để giữ. Hai lớp chặn:
  // `CityBackdrop` không truyền `onPick`, và `CityStage` chỉ chuyển tiếp khi `interactive`.
  const backdrop = SOURCES.find((f) => f.path === 'components/city/CityBackdrop.jsx');
  const stage = SOURCES.find((f) => f.path === 'components/city/CityStage.jsx');
  assert.doesNotMatch(codeOnly(backdrop.source), /onPick/,
    'lớp nền trang chủ truyền onPick ⇒ chạm vào nền sẽ bật thẻ thông tin giữa phiên tập trung');
  assert.match(stage.source, /onPick=\{interactive \? onPick : undefined\}/,
    'CityStage phải chặn onPick khi không nhận thao tác — lưới an toàn thứ hai');
});

test('LỚP NỀN TRANG CHỦ không được nuốt thao tác của Đàm', () => {
  // ⚠️ Đây là bài "một dòng mất thì cả trang chủ hỏng, mà chạy thử vẫn thấy đẹp". `CityScene3D`
  // đăng ký `wheel` với `passive: false` và có `preventDefault` — nếu lớp nền bật `interactive`
  // thì cú cuộn trang trên trang Tập Trung bị nuốt mất, và trên điện thoại thì cả trang không
  // cuộn nổi nữa. Lỗi kiểu này không lộ ra ở lint, cũng không lộ ra ở ảnh chụp.
  const backdrop = SOURCES.find((f) => f.path === 'components/city/CityBackdrop.jsx');
  assert.ok(backdrop, 'không thấy CityBackdrop.jsx');
  assert.match(backdrop.source, /interactive=\{false\}/,
    'lớp nền trang chủ phải truyền interactive={false}');
  assert.match(backdrop.source, /pointer-events-none/,
    'lớp nền trang chủ phải có pointer-events-none');
  // `chrome={false}` là công tắc gom MỌI thứ chữ nghĩa của `CityStage`: câu báo đã-lùi-về-2D, bảng
  // HUD, và dòng nhắc "kéo để xoay". Mất nó thì một dòng hướng dẫn kỹ thuật nổi lên ngay sau lưng
  // đồng hồ đếm ngược — vừa vô nghĩa với Đàm vừa phá đúng sự yên tĩnh mà màn hình đó tồn tại để giữ.
  assert.match(backdrop.source, /chrome=\{false\}/,
    'lớp nền trang chủ phải truyền chrome={false}');
});

test('LỚP NỀN TRANG CHỦ đứng yên khi đang chạy phiên — luật pin, không phải sở thích', () => {
  // Trang chủ là màn hình mở lâu nhất trong cả app (25 phút mỗi phiên). Cư dân đi lại ở đó nghĩa
  // là vẽ 30 khung/giây suốt phiên — đúng thứ mà cả cổng hiệu năng Phase 3A sinh ra để chặn.
  const backdrop = SOURCES.find((f) => f.path === 'components/city/CityBackdrop.jsx');
  assert.match(backdrop.source, /still=\{hasFocusSessionInProgress/,
    'lớp nền phải đứng yên khi đang chạy phiên');
});

test('LỚP NỀN TRANG CHỦ vẫn là NGƯỜI THUÊ của CityStage, không phải bản sao thứ hai', () => {
  // Cám dỗ lớn nhất ở Phase 3F là chép `CityStage`/`CityScene3D` ra một bản "rút gọn cho nền".
  // Làm vậy thì mọi bản vá sau này (đường lùi 2D, watchdog FPS, dọn context, giờ trong ngày) phải
  // nhớ sửa ở hai nơi — và lần quên đầu tiên sẽ là một lỗi không ai truy ra.
  const backdrop = SOURCES.find((f) => f.path === 'components/city/CityBackdrop.jsx');
  assert.match(backdrop.source, /from\s+['"]\.\/CityStage['"]/,
    'lớp nền phải dùng lại CityStage chứ không tự dựng cảnh riêng');
  assert.doesNotMatch(backdrop.source, /from\s+['"]three['"]/,
    'lớp nền không được import three — đó là việc của render3d/');
});
