/**
 * city-preview.mjs — CÔNG CỤ MẮT-SOI cho màn hình Thành Phố 3D.
 *
 * Dựng cảnh 3D thật (đúng `sceneGraph.js`, đúng `buildingSpec.js`, đúng bảng màu) trong một trang
 * HTML ĐỘC LẬP rồi chụp lại thành ảnh PNG. Song sinh với `scripts/coach-sample.mjs` — cái đó cho
 * xem bảng số liệu mà AI Coach nhận được, cái này cho xem thành phố mà Đàm sẽ nhìn thấy.
 *
 * ⚠️ VÌ SAO KHÔNG MỞ CHÍNH APP: `CLAUDE.md` cấm chạy luồng thật trên dev/localhost vì dev DÙNG
 * CHUNG một dòng Supabase với production — mở app lên là có nguy cơ ghi đè dữ liệu thật của Đàm.
 * Công cụ này chỉ nạp tầng vẽ: không store, không `initSync`, không Supabase, không service
 * worker. Nó không thể chạm tới dữ liệu thật kể cả khi muốn.
 *
 * Cách dùng:
 *   node scripts/city-preview.mjs                      # kỷ 7, đủ 5 công trình cấp 3
 *   node scripts/city-preview.mjs --era 2 --level 1
 *   node scripts/city-preview.mjs --all                # chụp cả 15 kỷ
 *   node scripts/city-preview.mjs --theme dark
 * Ảnh ra ở `.city-preview/` (đã nằm trong .gitignore).
 */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer, get as httpGet } from 'node:http';
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodePng, encodePng, ghepDoc } from './png-probe.mjs';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, '.city-preview');
const WORK_DIR = resolve(OUT_DIR, '.build');

/**
 * Chromium do môi trường cài sẵn (Playwright). Không tự tải về.
 *
 * ⚠️ CÓ CẢ ĐƯỜNG DẪN macOS, và đó không phải để cho đủ bộ: cờ `--gpu` chỉ có nghĩa trên một máy CÓ
 * card đồ hoạ thật, tức máy của Đàm — mà ở đó `/opt/pw-browsers/` không tồn tại. Thiếu mấy dòng này
 * thì công cụ báo "Không tìm thấy Chromium" đúng lúc nó là thứ duy nhất trả lời được câu hỏi FPS.
 */
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
].filter(Boolean);

function findChrome() {
  for (const path of CHROME_CANDIDATES) if (existsSync(path)) return path;
  return null;
}

/**
 * Câu báo "không tìm thấy Chromium" — viết cho NGƯỜI KHÔNG BIẾT CODE.
 *
 * ⚠️ Bản cũ chỉ nói *"Không tìm thấy Chromium. Đặt CHROME_PATH trỏ tới file chrome rồi chạy lại."*
 * Câu ấy đúng về mặt kỹ thuật và VÔ DỤNG với người nhận: nó không nói đã tìm ở đâu (nên không
 * biết mình thiếu cái gì) và không nói gõ thế nào (nên không biết làm gì tiếp). Nguyên tắc gốc của
 * vòng 4: khi hỏng thì in RA LỆNH CẦN GÕ, đừng in nguyên nhân kỹ thuật rồi để người dùng tự suy.
 */
function baoThieuChromium() {
  console.error('Không tìm thấy Chromium/Chrome. Đã tìm ở những chỗ sau, không chỗ nào có:');
  for (const path of CHROME_CANDIDATES) console.error(`  · ${path}`);
  console.error('');
  console.error('Cách sửa — cài Google Chrome, HOẶC chỉ thẳng đường dẫn rồi chạy lại:');
  console.error('  CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \\');
  console.error('    bash scripts/bench-macbook.sh --thu');
}

function parseArgs(argv) {
  const args = {
    era: 7, level: 3, theme: 'light', all: false, width: 1100, height: 700,
    // Hệ số khoảng cách camera. 1 = đúng khoảng app dùng; nhỏ hơn = lại gần để soi chi tiết.
    // Cần thiết vì ở khoảng nhìn thật, một cư dân cao 0,2 ô chỉ chiếm vài điểm ảnh — không đủ để
    // phân biệt "hình người" với "vệt nhiễu".
    zoom: 1,
    /**
     * `--focus N` — CHỤP ĐÚNG CHẾ ĐỘ CẬN CẢNH CỦA APP: bay tới công trình mốc thứ N (1–5) rồi
     * đứng ở chỗ mà `planCityFocus` đã chứng minh là thoáng.
     *
     * ⚠️ VÌ SAO KHÔNG DỰNG LẠI BẰNG `--zoom 0.45`: mức thu phóng chỉ là MỘT trong ba thứ chế độ
     * cận cảnh quyết định — hai thứ kia là điểm ngắm (một công trình, không phải tâm thành phố) và
     * góc ngẩng (được nâng lên tới mức tránh được phố). Chụp bằng `--zoom` là chụp một khung hình
     * KHÁC rồi gọi tên nó là cận cảnh, đúng bẫy "phép đo phải gọi đúng hàm mà app gọi" (Phase 9C:
     * đo chi phí bóng đổ qua một cổng, app mở hai cổng, ra hiệu số ÂM).
     * 0 = tắt (khung toàn cảnh như cũ).
     */
    focus: 0,
    /**
     * `--topdown` — NHÌN THẲNG TỪ TRÊN XUỐNG (bản đồ quy hoạch).
     *
     * ⚠️ ĐÂY LÀ MỘT KHUNG HÌNH KHÔNG CÓ TRONG APP, VÀ NÓ CỐ Ý NHƯ VẬY. Khung app ngẩng 34,4° nên
     * mái nhà che gần hết mặt đường; muốn trả lời câu *"bộ xương thành phố có còn đối xứng bốn
     * chiều không"* (điều kiện nghiệm thu của Phase 20) thì phải nhìn thẳng xuống. Vì vậy nó
     * KHÔNG đi qua `createOrbit`: bộ điều khiển ấy kẹp góc ngẩng ở `MAX_PITCH` đúng để app không
     * bao giờ ngả thành ảnh chụp trực thăng — kẹp ấy là một lời hứa với Đàm, đừng nới nó ra chỉ để
     * chụp một tấm ảnh nghiệm thu.
     *
     * ⚠️ ĐỪNG DÙNG ẢNH NÀY ĐỂ KẾT LUẬN VỀ MỸ THUẬT. Nó chỉ trả lời về BỐ CỤC (đường đi đâu, thửa
     * to nhỏ ra sao). Mọi kết luận về ánh sáng/màu/bóng phải đọc từ khung thường.
     */
    topdown: false,
    // Giờ Việt Nam giả lập để soi từng chặng trong ngày (0–23). Rỗng = giữa trưa trung tính.
    // ⚠️ LÀ MẢNG, và đây là sửa một cái bẫy đã cắn thật: bản đầu để `hour` là MỘT số, nên
    // `--hour 6 --hour 12 --hour 22` chỉ vẽ mỗi giờ 22 rồi in đúng một dòng "✓" — mà hai file kia
    // vẫn nằm sẵn trên đĩa từ lần chạy trước. Tôi đã mở đúng hai file CŨ đó, tưởng là bản mới, và
    // kết luận rằng bản vá bầu trời không ăn thua. Công cụ soi lỗi mà im lặng đưa dữ liệu cũ thì
    // còn tệ hơn không có công cụ. Nay nhận nhiều giờ và vẽ đủ từng giờ một.
    hours: [],
    // Chế độ QUÉT: dựng MỘT trang, vẽ tuần tự mọi tổ hợp (kỷ × giờ) rồi ghép thành BẢNG LIÊN HOÀN.
    // ⚠️ Vì sao không chụp 90 ảnh rời: mỗi ảnh rời phải gói lại bundle + mở lại Chromium (~8 giây),
    // tức là hơn 10 phút cho một lượt quét đủ 15 kỷ × 6 chặng — đủ lâu để không ai quét nữa, mà một
    // công cụ không ai chạy thì bằng không có. Gộp vào một trang: một bundle, MỘT WebGL context
    // dùng lại cho mọi cảnh, một lần mở trình duyệt. Và quan trọng hơn cả tốc độ: xếp cạnh nhau
    // trong CÙNG một tấm ảnh thì mắt so sánh được, mà mỹ thuật thì chỉ so sánh mới thấy sai.
    sweep: false,
    cell: 300,
    // Số công trình ĐANG XÂY (giàn giáo). Lấy từ CUỐI danh sách bản vẽ của kỷ và cho tiến độ so le
    // nhau, để một ảnh là thấy đủ các nấc dựng — chứ chụp mỗi công trường cùng một tiến độ thì
    // không kiểm chứng được thứ cần kiểm chứng ("mỗi phiên xong lại nhô lên một nấc").
    pending: 0,
    // Số phiên đã hoàn thành TRONG KỶ — quyết mạng đường mở tới đâu và có bao nhiêu cảnh vật.
    // ⚠️ THÊM 2026-08-14 (Phase 6C) VÌ MỘT LÝ DO CỤ THỂ: con số này trước đây viết cứng `40` ở
    // BỐN chỗ trong file, và mạng đường lúc đó có 44 ô — nên `40` tình cờ cho ra một thành phố
    // gần đủ đường. Vành đai đưa mạng lên 80 ô, tức mọi bản quét dựng ở `40` chỉ còn thấy ĐÚNG
    // MỘT NỬA mạng đường, và **không có gì báo cho người soi biết điều đó** — họ sẽ nhìn một
    // thành phố thiếu vành đai rồi kết luận là vành đai không chạy. Đúng họ với bài học `--cell`
    // ở Phase 4G: một tham số mà công cụ tự đoán thì sớm muộn cũng đoán sai.
    sessions: 40,
    // Thời điểm hoạt hoạ (giây) để đặt cư dân vào. ⚠️ TRƯỚC PHASE CƯ DÂN-CÓ-KHỚP con số này VIẾT
    // CỨNG là 17,5 ở hai chỗ trong file, nên MỌI ảnh từng chụp đều bắt cùng một tư thế. Khi người
    // chỉ là hai cái hộp thì điều đó vô hại; từ lúc có dáng đi thì nó nghĩa là không ai soi được
    // chu kỳ bước, và một bản vá dáng đi hỏng sẽ trông y hệt một bản vá đúng.
    t: 17.5,
    // ⚠️ DỰNG BẰNG ĐƯỜNG `lowDetail` (máy yếu). Tồn tại vì trước đó KHÔNG CÓ CÁCH NÀO nhìn thấy
    // đường ấy: nó chỉ chạy trên máy bị coi là yếu, tức gần như không bao giờ chạy trên máy người
    // phát triển. Một nhánh mã không ai nhìn được là một nhánh sẽ hỏng trong im lặng.
    // Nó cũng là ĐỐI CHỨNG của phép đo dáng đi: mô hình 2 hộp phải cho ra hình bóng KHÔNG đổi
    // theo pha bước, và một phép đo không chứng minh được điều đó thì đang bắt nhiễu.
    lowDetail: false,
    // Tỉ lệ điểm ảnh. Rỗng = dùng đúng MAX_PIXEL_RATIO của app — ĐÂY LÀ MẶC ĐỊNH ĐÚNG, đừng đổi.
    // ⚠️ Cờ này tồn tại để THỬ NGƯỢC được lời hứa "trang xem thử dựng ở đúng tầng chất lượng của
    // app": Phase 9C phát hiện nó đã dựng ở DPR 1 suốt nhiều tháng mà không có gì báo, và một lời
    // hứa parity không kiểm lại được thì sớm muộn cũng trôi lần nữa.
    dpr: null,
    // Số khung hình đo hiệu năng. 0 = không đo.
    // ⚠️ SỐ ĐO Ở ĐÂY LÀ SwiftShader (rasterise bằng CPU), KHÔNG phải GPU MacBook. Nên đừng đọc nó
    // như "app chạy bao nhiêu FPS" — đọc nó như CẬN TRÊN của chi phí mỗi mảnh: CPU không có phần
    // cứng cho phép tính shader, nên mọi phép tính thêm vào shader ở đây đắt hơn thực tế nhiều
    // lần. Một bản vá shader mà ngay cả ở đây cũng gần như không đo được thì trên GPU là miễn phí.
    bench: 0,
    // ⚠️ MẶT NẠ: vẽ CÙNG một cảnh, cùng camera, nhưng tô mỗi đối tượng có tên trong danh sách này
    // thành MỘT KÊNH MÀU THUẦN (đỏ · lục · lam) và mọi thứ khác thành ĐEN — cho ra một tấm ảnh nói
    // chính xác "điểm ảnh nào là của cái nào". Nhiều tên thì cách nhau bằng dấu phẩy.
    //
    // Vì sao cần: muốn hỏi "mặt đường trên màn hình sáng bao nhiêu so với mặt đất" thì trước hết
    // phải biết điểm ảnh nào là đường. `TECH_DEBT #22` đã trả giá ba phase cho việc ĐOÁN chuyện đó
    // bằng màu (bộ lọc "8% điểm ảnh tươi nhất ≈ mái" hoá ra đo cỏ). Bên DỰNG biết chắc, nên bên
    // dựng nói ra: `sceneGraph.js` đặt `mesh.name`, còn đây chỉ đọc lại. Không có bộ lọc nào cả.
    mask: null,
    // ⚠️ TẮT HẲN BÓNG ĐỔ. Không phải để chụp cho đẹp — để TÁCH được hai nguyên nhân khác nhau của
    // một mảng tối: "vật liệu này vốn tối" và "chỗ này đang nằm trong bóng". Phase 9B đã trả giá
    // cho việc lẫn hai thứ đó (suýt kết luận VSM vô dụng, trong khi thứ không chịu mờ đi chưa bao
    // giờ là bóng đổ mà là MẶT ĐƯỜNG). Và đổi giờ trong ngày KHÔNG thay được: đổi giờ vừa làm ngắn
    // bóng vừa đổi góc nắng rọi xuống mặt phẳng, tức trộn thêm một nguyên nhân thứ ba.
    // `TECH_DEBT #30` đo con số 0,113 của nhựa đường kỷ 11 ở đúng điều kiện này — giữ nguyên cờ
    // này là cách duy nhất để số mới còn so được với số cũ.
    noShadow: false,
    // ⚠️ TẮT CHE KHUẤT MÔI TRƯỜNG (AO) — CỜ ĐỐI CHỨNG, KHÔNG PHẢI CỜ CHỈNH.
    // AO được nướng vào MÀU ĐỈNH nên nó KHÔNG hiện ra ở bất kỳ con số nào của `renderer.info`:
    // bật hay tắt vẫn đúng bằng ấy lệnh vẽ, đúng bằng ấy tam giác (đã đo kỷ 6 = 13 · kỷ 11 = 12 ở
    // cả hai phía). Thứ duy nhất phân biệt được hai bản là TẤM ẢNH — nên nếu không có đường tắt nó
    // đi thì mọi câu "nhờ AO mà khối đọc ra là 3D" là một lời nói không kiểm được, đúng loại câu
    // tự trấn an mà dự án này đã trả giá nhiều lần.
    noAo: false,
    // ⚠️ DÙNG GPU THẬT thay vì SwiftShader. Mặc định TẮT vì hộp cát dựng ảnh không có card đồ hoạ —
    // nhưng trên MacBook của Đàm thì BẮT BUỘC bật, nếu không mọi con số đo được vẫn là số của một
    // cỗ máy tô hình bằng CPU, chỉ khác là lần này nó đội lốt "đo trên máy thật". Công cụ luôn in
    // ra tên máy đồ hoạ ở dòng [bench] đầu tiên, nên bảng kết quả tự khai nó được đo bằng gì.
    gpu: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--all') args.all = true;
    else if (key === '--era') { args.era = Number(value); i += 1; }
    else if (key === '--level') { args.level = Number(value); i += 1; }
    else if (key === '--theme') { args.theme = value; i += 1; }
    else if (key === '--width') { args.width = Number(value); i += 1; }
    else if (key === '--height') { args.height = Number(value); i += 1; }
    else if (key === '--zoom') { args.zoom = Number(value); i += 1; }
    else if (key === '--focus') { args.focus = Number(value); i += 1; }
    else if (key === '--topdown') args.topdown = true;
    else if (key === '--hour') { args.hours.push(Number(value)); i += 1; }
    else if (key === '--sweep') args.sweep = true;
    else if (key === '--cell') { args.cell = Number(value); i += 1; }
    else if (key === '--eras') { args.eraList = String(value).split(',').map(Number); i += 1; }
    else if (key === '--pending') { args.pending = Number(value); i += 1; }
    else if (key === '--sessions') { args.sessions = Number(value); i += 1; }
    else if (key === '--t') { args.t = Number(value); i += 1; }
    else if (key === '--lowdetail') { args.lowDetail = true; }
    else if (key === '--dpr') { args.dpr = Number(value); i += 1; }
    else if (key === '--bench') { args.bench = Number(value); i += 1; }
    else if (key === '--mask') { args.mask = String(value); i += 1; }
    else if (key === '--no-shadow') args.noShadow = true;
    else if (key === '--no-ao') args.noAo = true;
    else if (key === '--gpu') args.gpu = true;
    // Chỉ KIỂM xem có Chromium không rồi thoát — không gói bundle, không mở trình duyệt.
    // ⚠️ Tồn tại để `bench-macbook.sh` hỏi được câu "máy này có Chromium chưa" mà KHÔNG phải chép
    // danh sách `CHROME_CANDIDATES` sang một file thứ hai. Chép sang chỗ thứ hai là đúng cái bẫy
    // "một luật hai công thức" đã làm `sweep-score.mjs` bịa ra nguyên một bộ số ở Phase 4G.
    else if (key === '--kiem-chromium') args.kiemChromium = true;
  }
  return args;
}

function run(cmd, cmdArgs, options = {}) {
  return new Promise((done, fail) => {
    const child = spawn(cmd, cmdArgs, { stdio: 'inherit', ...options });
    child.on('error', fail);
    child.on('exit', (code) => (code === 0 ? done() : fail(new Error(`${cmd} thoát mã ${code}`))));
  });
}

/**
 * Mã nguồn trang xem thử. Được gói thành MỘT file bằng chính Vite của dự án, nên nó dùng đúng
 * phiên bản three và đúng các module thật — nếu bản gói lỗi thì bản chạy thật cũng lỗi.
 */
function entrySource({
  era, level, theme, zoom = 1, focus = 0, hour = null, pending = 0, sessions = 40, dpr = null, bench = 0,
  mask = null, noShadow = false, noAo = false, t = 17.5, lowDetail = false, topdown = false,
}) {
  return `
import { computeCityLayout, roadCellCount } from '${ROOT}/src/engine/cityLayout.js';
import { buildScenePalette } from '${ROOT}/src/engine/city3d/palette3d.js';
import { deriveDaylight } from '${ROOT}/src/engine/city3d/daylight.js';
import { applyPaintedLook, createCityScene, MAX_PIXEL_RATIO } from '${ROOT}/src/components/city/render3d/sceneGraph.js';
import { CITY_CAMERA_FOV, cityOrbitOptions, createOrbit } from '${ROOT}/src/engine/city3d/orbit.js';
import { planCityFocus } from '${ROOT}/src/engine/city3d/cityFocus.js';
import { BLUEPRINT_CATALOG, ERA_METADATA } from '${ROOT}/src/engine/constants.js';
import { Color, MeshBasicMaterial, PerspectiveCamera, WebGLRenderer } from 'three';

const MASK = ${mask === null ? 'null' : JSON.stringify(mask)};
// Tách tên MỘT LẦN ở đây, dùng cho CẢ HAI việc: bảo bên dựng cắt khối nào (tachDeDo) và tô kênh
// màu nào cho tên nào. Bản trước tách ở dưới, còn ở trên thì hỏi MASK.includes(...) trên chuỗi
// thô — hai cách đọc cùng một tham số, và cách hỏi trên chuỗi thì khớp cả tên nằm lọt trong tên
// khác.
const MASK_NAMES = MASK ? MASK.split(',').map((s) => s.trim()).filter(Boolean) : [];
const NO_SHADOW = ${noShadow ? 'true' : 'false'};
const NO_AO = ${noAo ? 'true' : 'false'};

const ERA = ${era};
const LEVEL = ${level};
const IS_DARK = ${theme === 'dark'};
const ZOOM = ${zoom};
const FOCUS = ${focus};
const TOPDOWN = ${topdown ? 'true' : 'false'};
const HOUR = ${hour === null ? 'null' : hour};
const PENDING = ${pending};
const SESSIONS = ${sessions};
const ANIM_T = ${t};
const LOW_DETAIL = ${lowDetail ? 'true' : 'false'};
const DPR = ${dpr === null ? 'MAX_PIXEL_RATIO' : dpr};
const BENCH = ${bench};

const allIds = BLUEPRINT_CATALOG[ERA].map((bp) => bp.id);
// Mấy bản vẽ cuối chuyển sang ĐANG XÂY, mỗi cái một tiến độ khác nhau (còn 1, 2, 3… phiên nữa)
// để một ảnh là soi được cả dải nấc dựng.
const built = PENDING > 0 ? allIds.slice(0, Math.max(0, allIds.length - PENDING)) : allIds;
const pendingQueue = PENDING > 0
  ? allIds.slice(built.length).map((bpId, i) => ({ bpId, sessionsRemaining: i + 1 }))
  : [];
const levels = Object.fromEntries(built.map((id) => [id, LEVEL]));
const layout = computeCityLayout({
  built, levels, era: ERA, stats: { sessionCount: SESSIONS, streakLength: 9 }, pending: pendingQueue,
});
// Đếm ô đường CÓ THẬT trong bố cục vừa dựng — hỏi chính 'layout', không suy lại từ 'SESSIONS'.
const soODuong = (layout.props ?? []).filter((p) => p.kind === 'road').length;

// Token màu lấy thẳng từ giá trị mặc định của hai theme trong src/index.css — trang này không có
// cây DOM của app nên không đọc được biến CSS thật.
// Giờ TRUYỀN VÀO chứ không đọc đồng hồ thật: trang xem thử phải chụp được mọi chặng trong ngày,
// không phải chỉ chặng đang diễn ra lúc chạy lệnh.
const daylight = HOUR === null ? null : deriveDaylight(HOUR);
const palette = buildScenePalette({
  tokens: IS_DARK
    ? { canvas2: '#1d1c1a', ink: '#f2efe6', line: '#33312d', accent: '#c96442' }
    : { canvas2: '#f4f2ec', ink: '#1f1e1d', line: '#e8e6de', accent: '#c96442' },
  eraColor: ERA_METADATA[ERA]?.accentColor,
  era: ERA,
  daylight,
});

const canvas = document.getElementById('stage');
// ⚠️ CHỤP KÍCH THƯỚC LOGIC TRƯỚC KHI setSize GHI ĐÈ. Từ Phase 9C trang xem thử dựng ở đúng
// MAX_PIXEL_RATIO của app (2), nên bộ đệm vẽ rộng gấp đôi khung CSS — canvas.width sau đó KHÔNG
// còn là bề ngang khung hình nữa. Lấy nhầm nó thì tỉ lệ camera vẫn đúng (cùng nhân 2) nhưng mọi
// con số bố cục suy ra từ đây sẽ lệch gấp đôi mà không có gì đỏ lên.
const VIEW_W = canvas.width;
const VIEW_H = canvas.height;
const renderer = new WebGLRenderer({ canvas, antialias: true });
// ⚠️ ĐÚNG TẦNG CHẤT LƯỢNG CỦA APP, KHÔNG PHẢI 1. Xem MAX_PIXEL_RATIO ở sceneGraph.js.
renderer.setPixelRatio(DPR);
// Dùng CHUNG cấu hình nhìn với app — nếu không, trang xem thử sẽ vẽ ra một thành phố khác.
applyPaintedLook(renderer);
renderer.setSize(VIEW_W, VIEW_H, false);
renderer.shadowMap.needsUpdate = true;

// ⚠️ Truyền ĐÚNG bộ số mà app truyền, không để mặc định: dân số suy ra từ đây, và một trang xem
// thử vẽ thành phố vắng hơn thật thì nó không còn kiểm chứng được thứ cần kiểm chứng.
// tachDeDo: TRUYỀN THẲNG danh sách tên mà --mask hỏi, không dịch sang cờ ở đây. Bên dựng mới là
// bên biết tên nào nằm trong khối nào (NHOM_TACH_THANH_PHO / NHOM_TACH_MAT_DAT ở sceneGraph.js), và
// nó tự quyết cắt nhát nào. Mỗi nhát cắt tốn thêm lệnh vẽ, nên chỉ ảnh mặt nạ mới đi vào nhánh này
// — ảnh thường và --bench truyền 'null', dựng y hệt app.
//
// ⚠️ Bản trước dịch tay ở ĐÂY (MASK.includes “buildings” …), tức cùng một luật sống ở hai
// chỗ. Thêm nhóm 'landscape' đã phải sửa cả hai; quên chỗ này thì --mask landscape đo một tấm
// rỗng mà không có gì đỏ lên. Nay chỉ còn một công thức, nằm cạnh mã dựng.
//
// lowDetail: cờ LOD thấp, dùng làm ĐỐI CHỨNG khi đo cư dân (mô hình 2 hộp không có khớp nào).
const city = createCityScene({
  layout, palette, daylight, renderer, lowDetail: LOW_DETAIL,
  stats: { sessionCount: SESSIONS, streakLength: 9 },
  tachDeDo: MASK_NAMES,
  ao: !NO_AO,
});

// Đẩy đồng hồ tới một thời điểm giữa chừng. Ở t = 0 mọi cư dân đều đứng ở đầu tuyến của mình —
// đúng chỗ dễ trùng nhau nhất, tức là ảnh chụp sẽ nói dối theo hướng lạc quan về chuyện họ có
// TRẢI ĐỀU trên phố hay không.
city.updateResidents(ANIM_T);

const camera = new PerspectiveCamera(CITY_CAMERA_FOV, VIEW_W / VIEW_H, 0.5, layout.gridSize * 8);
// Dùng CHUNG bộ tham số camera với app; ZOOM chỉ để soi chi tiết, mặc định 1 = đúng khung app.
const orbitOptions = cityOrbitOptions(layout.gridSize, layout.era);
const orbit = createOrbit({
  ...orbitOptions,
  distance: orbitOptions.distance * ZOOM,
  minDistance: orbitOptions.minDistance * Math.min(1, ZOOM),
});
// ⚠️ CHẾ ĐỘ CẬN CẢNH GỌI ĐÚNG HÀM MÀ APP GỌI ('planCityFocus'), với ĐÚNG danh sách vật cản mà cảnh
// vừa dựng ra ('city.blockers'). Không có dòng nào ở đây tự tính lại góc hay khoảng cách — nếu có,
// tấm ảnh nghiệm thu sẽ mô tả một chế độ cận cảnh không tồn tại trong app.
if (FOCUS > 0) {
  const marks = (city.pickTargets ?? []).filter((t) => t.kind === 'building');
  const mark = marks[Math.min(marks.length, Math.max(1, FOCUS)) - 1];
  if (!mark) throw new Error('kỷ này không có công trình mốc nào để ngắm gần');
  const b = mark.box;
  const plan = planCityFocus({
    from: orbit.getState(),
    focus: {
      x: (b.minX + b.maxX) / 2,
      y: (b.minY + b.maxY) / 2,
      z: (b.minZ + b.maxZ) / 2,
    },
    blockers: city.blockers,
  });
  orbit.set(plan);
  console.log('[focus] mốc ' + Math.max(1, FOCUS) + '/' + marks.length
    + ' · khoảng cách ' + plan.distance.toFixed(2)
    + ' · góc ngẩng ' + (plan.pitch * 180 / Math.PI).toFixed(1) + ' độ'
    + ' · thoáng ' + plan.clearance.toFixed(2)
    + ' · ngẩng thêm ' + (plan.raisedPitch * 180 / Math.PI).toFixed(1) + ' độ'
    + ' · lùi thêm ' + plan.raisedDistance.toFixed(2));
}

const eye = orbit.getPosition();
const target = orbit.getTarget();
camera.position.set(eye.x, eye.y, eye.z);
camera.lookAt(target.x, target.y, target.z);

// ⚠️ NHÌN THẲNG XUỐNG — đè lên camera vừa đặt, KHÔNG đi qua 'orbit'. Lý do đầy đủ ở chú thích của
// cờ '--topdown' trong 'parseArgs'; tóm tắt: 'createOrbit' kẹp góc ngẩng ở 'MAX_PITCH' và cái kẹp
// ấy là một lời hứa với Đàm (app không được ngả thành ảnh trực thăng), nên công cụ nghiệm thu
// không được nới nó ra.
//
// Độ cao suy từ HÌNH HỌC, không chọn tay: nửa lưới là 'gridSize / 2', chừa thêm 15% lề, và trục
// DỌC mới là trục chật (khung 1100×700 rộng hơn cao). Nhìn thẳng xuống với vector 'up' mặc định
// (0,1,0) là một ca suy biến, nên đặt 'up' về (0,0,-1): bắc ở trên, tây ở trái.
if (TOPDOWN) {
  const nuaLuoi = (layout.gridSize / 2) * 1.15;
  const nuaGoc = (CITY_CAMERA_FOV / 2) * Math.PI / 180;
  const cao = (nuaLuoi / Math.tan(nuaGoc)) * ZOOM;
  camera.up.set(0, 0, -1);
  camera.position.set(0, cao, 0);
  camera.lookAt(0, 0, 0);
  console.log('[topdown] nhìn thẳng xuống từ độ cao ' + cao.toFixed(2)
    + ' · phủ ' + (nuaLuoi * 2).toFixed(2) + ' ô theo chiều dọc khung');
}

if (NO_SHADOW) {
  // Tắt ở CẢ HAI đầu: đèn thôi ném bóng, và bộ dựng thôi lấy mẫu bản đồ bóng. Tắt mỗi một đầu thì
  // three vẫn tra một bản đồ bóng cũ/rỗng và kết quả không sạch.
  let tắt = 0;
  city.scene.traverse((obj) => {
    if (obj.isLight && obj.castShadow) { obj.castShadow = false; tắt += 1; }
    if (obj.isMesh) obj.receiveShadow = false;
  });
  renderer.shadowMap.enabled = false;
  console.log('[no-shadow] đã tắt ' + tắt + ' nguồn bóng');
}

// ⚠️ TỰ KHAI RA. AO nướng vào màu đỉnh nên tấm ảnh KHÔNG có cách nào tự nói nó được dựng có hay
// không có AO — không lệnh vẽ nào đổi, không tam giác nào đổi. Dòng này (cộng hậu tố '-noao' trong
// tên file) là hai thứ duy nhất giữ cho một cặp ảnh trước/sau còn truy được nguồn.
if (NO_AO) console.log('[no-ao] che khuất môi trường ĐÃ TẮT — đây là ảnh ĐỐI CHỨNG');

if (MASK) {
  // ⚠️ THAY VẬT LIỆU, KHÔNG XOÁ ĐỐI TƯỢNG. Xoá thì thứ nằm SAU nó lộ ra và mặt nạ sẽ nhận vơ những
  // điểm ảnh đáng lẽ bị che (mái nhà che một khúc đường thì khúc ấy KHÔNG phải điểm ảnh đường trên
  // màn hình). Giữ nguyên mọi khối, chỉ đổi màu, thì phép kiểm chiều sâu vẫn chạy y hệt lần dựng
  // thật ⇒ mặt nạ khớp từng điểm ảnh một.
  //
  // Nhiều tên cách nhau bằng dấu phẩy ⇒ mỗi tên một KÊNH MÀU riêng: đỏ · lục · lam.
  //
  // ⚠️ KÊNH MÀU, KHÔNG PHẢI MỨC XÁM — VÀ ĐÂY LÀ MỘT LỖI ĐÃ TRẢ GIÁ THẬT, KHÔNG PHẢI ĐỀ PHÒNG SUÔNG.
  // Bản đầu tô ba mức xám 255/192/128 rồi phân loại bằng ngưỡng. Đo ra thì tấm mặt nạ chỉ có **233
  // và 235** — hai mức cách nhau 63 ở đầu vào bị bóp còn cách nhau 2 ở đầu ra, vì applyPaintedLook
  // bật NeutralToneMapping (nén mạnh nhất đúng ở vùng SÁNG) rồi còn mã hoá sang sRGB. Bộ chấm nuốt
  // gọn cả đường lẫn đất vào chung một nhóm và in ra một bảng số hoàn chỉnh, rất thuyết phục, trong
  // đó mặt đường "sáng hơn mặt đất ở cả 12 ca" và "có nhiều điểm ảnh hơn cả mặt đất" — hai điều bất
  // khả thi mới là thứ tố cáo nó. Cùng họ với bài học bầu trời nhạt đi 5 lần (Phase 3V):
  // **không có một hệ số chung giữa màu khai và màu ra màn hình.**
  // Kênh màu thì miễn nhiễm: mọi đường cong tông đều ĐƠN ĐIỆU và áp riêng từng kênh, nên đỏ thuần
  // vẫn cứ đỏ hơn hai kênh kia dù bị nén tới đâu. Thêm toneMapped:false cho chắc.
  //
  // ⚠️ VÀ ĐỪNG VIẾT DẤU HUYỀN-NGƯỢC (backtick) TRONG KHỐI NÀY — cả đoạn nằm BÊN TRONG một chuỗi
  // template của entrySource, nên một dấu backtick trong chú thích cũng đủ cắt đôi chuỗi ấy.
  const names = MASK_NAMES;
  if (names.length > 3) throw new Error('mặt nạ tối đa 3 tên (đỏ/lục/lam)');
  const CHANNELS = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const TÊN_KÊNH = ['đỏ', 'lục', 'lam'];
  const mats = names.map((_, i) => new MeshBasicMaterial({
    color: new Color().setRGB(...CHANNELS[i]), fog: false, toneMapped: false,
  }));
  const black = new MeshBasicMaterial({ color: 0x000000, fog: false, toneMapped: false });
  const hits = names.map(() => 0);
  // ⚠️ PHẢI KỂ RA THỨ BỊ TÔ ĐEN. Phần đen là một cái sọt, và một cái sọt không có nhãn thì mọi con
  // số rút ra từ tấm mặt nạ đều thiếu một vế: đọc 44% nền mà không biết trong đó có gì thì rất dễ
  // đọc thành trời, trong khi nó có thể là cư dân, là ô cửa sáng, là một khối chưa ai đặt tên.
  const conLai = new Map();
  city.scene.traverse((obj) => {
    if (!obj.isMesh && !obj.isPoints && !obj.isLine) return;
    const idx = names.indexOf(obj.name);
    if (idx >= 0) { hits[idx] += 1; obj.material = mats[idx]; return; }
    obj.material = black;
    const ten = obj.name || '(không tên)';
    conLai.set(ten, (conLai.get(ten) ?? 0) + 1);
  });
  city.scene.background = new Color(0x000000);
  city.scene.fog = null;
  names.forEach((n, i) => {
    if (hits[i] === 0) throw new Error('mặt nạ "' + n + '" không khớp đối tượng nào — sai tên?');
    console.log('[mask] "' + n + '" kênh ' + TÊN_KÊNH[i] + ' khớp ' + hits[i] + ' khối');
  });
  const denList = [...conLai.entries()].map(([t, n]) => t + '×' + n).join(', ');
  console.log('[mask] tô đen (không nằm trong phép đếm nào): ' + (denList || 'không có khối nào'));
}

{
  const r = canvas.getBoundingClientRect();
  console.log('[geom] canvas trên màn hình: x=' + r.x + ' y=' + r.y + ' w=' + r.width + ' h=' + r.height
    + ' | thuộc tính: ' + canvas.width + 'x' + canvas.height
    + ' | khung nhìn: ' + window.innerWidth + 'x' + window.innerHeight
    + ' | tỉ lệ camera: ' + camera.aspect.toFixed(4));
}
renderer.render(city.scene, camera);

if (BENCH > 0) {
  // ⚠️ PHẢI ÉP ỐNG DẪN HOÀN TẤT TRƯỚC KHI BẤM GIỜ DỪNG. WebGL xếp lệnh không đồng bộ, nên đo trần
  // renderer.render() chỉ đo thời gian ĐẨY LỆNH VÀO HÀNG ĐỢI.
  // ⚠️ VÀ gl.finish() KHÔNG ĐỦ — đã thử và nó nói dối: ra 0,40 ms/khung cho 3200×1400 rasterise
  // bằng CPU, tức khoảng 11 tỉ điểm ảnh mỗi giây trên CPU, một con số bất khả thi. ANGLE có đường
  // biến finish() thành flush(). Thứ KHÔNG thể giả vờ là đọc ngược điểm ảnh: muốn trả về được một
  // byte thì mọi lệnh vẽ phải xong thật.
  const gl = renderer.getContext();
  const probe = new Uint8Array(4);
  const settle = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, probe);

  // Máy đồ hoạ THẬT đang chạy là gì. Không có dòng này thì mọi con số phía dưới đều vô danh tính,
  // và một bảng đo bằng CPU rasteriser dán nhãn "MacBook" là loại đồng hồ tệ nhất.
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'không đọc được';
  console.log('[bench] máy đồ hoạ=' + gpu);

  // Khung khởi động mang theo chi phí biên dịch shader — vứt, không tính.
  for (let i = 0; i < 12; i += 1) { renderer.render(city.scene, camera); settle(); }

  // ⚠️ QUY ƯỚC: P95 là ĐUÔI CHẬM (95% số khung NHANH HƠN mức này). Nói cách khác P95 là trường hợp
  // XẤU, không phải trường hợp tốt — rất dễ đọc ngược khi nó đứng cạnh chữ "FPS".
  // Nearest-rank chứ không nội suy: frame time rời rạc theo nhịp màn hình, nội suy sẽ đẻ ra những
  // giá trị KHÔNG khung hình nào từng đạt.
  function đoLoạt(n, dựngLạiBóng) {
    const ts = [];
    for (let i = 0; i < n; i += 1) {
      // ⚠️ PHẢI MỞ CẢ HAI CỔNG. three có cổng toàn cục (renderer.shadowMap) và cổng TỪNG ĐÈN
      // (sun.shadow, mà city.invalidateShadows() lo). Mở một cổng thì vòng lặp bỏ qua đèn, bản đồ
      // bóng KHÔNG hề được vẽ lại, và phép đo đang so hai khung hình y hệt nhau — đã trả giá thật:
      // ra hiệu số ÂM 0,5 ms, tức "dựng lại bóng còn nhanh hơn không dựng".
      if (dựngLạiBóng) { city.invalidateShadows(); renderer.shadowMap.needsUpdate = true; }
      const t0 = performance.now();
      renderer.render(city.scene, camera);
      settle();
      ts.push(performance.now() - t0);
    }
    ts.sort((a, b) => a - b);
    const pv = (p) => ts[Math.min(ts.length, Math.max(1, Math.ceil(p * ts.length))) - 1];
    return { n, p50: pv(0.5), p95: pv(0.95), min: ts[0], max: ts[ts.length - 1] };
  }

  // (a) KHUNG ỔN ĐỊNH — bản đồ bóng đã cache. Đây là chi phí thường ngày, thứ quyết định FPS.
  const ổnĐịnh = đoLoạt(BENCH, false);
  // ⚠️ ĐỌC renderer.info NGAY TẠI ĐÂY. three reset info mỗi lần render, nên nó mô tả khung CUỐI
  // của loạt vừa đo — tức một khung ổn định KHÔNG có lượt dựng bóng. Đọc sau loạt (b) sẽ lẫn cả
  // lượt bóng vào và bảng đối chiếu Bước 1 thành so lệch pha.
  const thật = {
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
    programs: renderer.info.programs ? renderer.info.programs.length : -1,
  };

  // (b) KHUNG NGAY SAU KHI CẢNH ĐỔI — bản đồ bóng phải dựng lại. Đây là ĐỈNH chi phí, và nó rơi
  // đúng lúc Đàm vừa xong một phiên. Đo riêng, KHÔNG gộp vào (a).
  const dựngBóng = NO_SHADOW ? null : đoLoạt(Math.max(20, Math.round(BENCH / 4)), true);
  const thậtBóng = dựngBóng ? {
    calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
  } : null;

  const f2 = (x) => x.toFixed(2);
  console.log('[bench] (a) khung ỔN ĐỊNH  n=' + ổnĐịnh.n
    + ' P50=' + f2(ổnĐịnh.p50) + 'ms P95=' + f2(ổnĐịnh.p95) + 'ms'
    + ' nhanh nhất=' + f2(ổnĐịnh.min) + ' chậm nhất=' + f2(ổnĐịnh.max));
  if (dựngBóng) {
    /**
     * ⚠️ MỘT HIỆU SỐ NHỎ HƠN NHIỄU THÌ KHÔNG PHẢI MỘT PHÉP ĐO — ĐỪNG IN NÓ NHƯ MỘT CON SỐ.
     * Bản trước in thẳng 'riêng bóng=-55.00ms (+-2.4%)': vừa vô nghĩa về dấu, vừa mời người đọc
     * kết luận "dựng lại bóng còn nhanh hơn không dựng". Ở khung 2200×1400 trên CPU rasteriser,
     * riêng loạt ổn định đã dao động 2247–2450 ms (biên độ 203 ms) — một hiệu số 55 ms nằm gọn
     * bên trong đó. Câu duy nhất được phép nói lúc ấy là *nhỏ hơn mức phép đo này phân giải được*
     * (đúng luật của Phase 9B, và của chính bản báo cáo vòng 1 đã phải sửa vì viết quá tay).
     * ⚠️ Nhiễu ở đây đo bằng ĐỘ TRẢI của loạt ổn định, KHÔNG phải một hằng số đoán sẵn — hằng số
     * thì đúng ở một cỡ khung rồi sai ở mọi cỡ khác.
     */
    const hiệu = dựngBóng.p50 - ổnĐịnh.p50;
    const nhiễu = ổnĐịnh.max - ổnĐịnh.min;
    const đọcĐược = Math.abs(hiệu) > nhiễu;
    const dấu = hiệu >= 0 ? '+' : '−';
    console.log('[bench] (b) DỰNG LẠI BÓNG n=' + dựngBóng.n
      + ' P50=' + f2(dựngBóng.p50) + 'ms P95=' + f2(dựngBóng.p95) + 'ms'
      + ' | riêng bóng=' + dấu + f2(Math.abs(hiệu)) + 'ms'
      + ' (' + dấu + (100 * Math.abs(hiệu) / ổnĐịnh.p50).toFixed(1) + '%)');
    console.log('[bench]     nhiễu của loạt ổn định=' + f2(nhiễu) + 'ms ⇒ '
      + (đọcĐược
        ? 'hiệu số LỚN HƠN nhiễu, đọc được.'
        : 'hiệu số NẰM TRONG NHIỄU — phép đo này KHÔNG phân giải được chi phí dựng bóng, đừng trích con số trên.'));
    // ⚠️ Đây mới là bằng chứng cổng bóng THẬT SỰ mở. three có HAI cổng nối tiếp (toàn cục
    // 'renderer.shadowMap' và từng đèn 'sun.shadow'); mở một cổng thì bản đồ bóng không hề được vẽ
    // lại và phép đo đang so hai khung y hệt nhau. Số lệnh vẽ/tam giác TĂNG là thứ chứng minh
    // lượt bóng có chạy — và nó độc lập với chuyện thời gian có đo được hay không.
    console.log('[bench] lượt bóng thêm ' + (thậtBóng.calls - thật.calls) + ' lệnh vẽ, '
      + (thậtBóng.triangles - thật.triangles).toLocaleString('vi-VN') + ' tam giác'
      + ((thậtBóng.calls - thật.calls) > 0
        ? ' ⇒ cổng bóng ĐANG MỞ (lượt vẽ thứ hai có thật).'
        : ' ⚠ BẰNG 0 — cổng bóng KHÔNG mở, mọi số ở dòng (b) đang so hai khung y hệt nhau.'));
  } else {
    console.log('[bench] (b) BỎ QUA — đang chạy --no-shadow');
  }

  // ── BƯỚC 1: HÌNH HỌC MỖI KHUNG — BA CON SỐ, KHÔNG PHẢI MỘT ───────────────────
  //
  // ⚠️ HAI CỘT CUỐI TRẢ LỜI HAI CÂU HỎI KHÁC NHAU, VÀ LỆCH NHAU LÀ ĐÚNG.
  // "trong cảnh" = duyệt scene graph, đếm MỌI khối đang có mặt.
  // "đã vẽ"      = renderer.info.render, đếm SAU khi three cắt bỏ khối nằm ngoài khung hình.
  //
  // ⚠️ ĐO RỒI: hôm nay hai cột LUÔN BẰNG NHAU, ở mọi kỷ và mọi mức zoom — và đó KHÔNG phải may.
  // Cả cảnh chỉ có 7 khối, khối nào cũng hoặc bao trùm camera (vòm trời bán kính 43,2 · rặng núi
  // 51,1, camera đứng cách tâm 4,3–17,2 nên nằm BÊN TRONG cả hai) hoặc có tâm ngay tại gốc toạ độ
  // mà camera thì luôn ngắm vào gốc (mặt đất 13,5 · mặt đường 8,5 · toàn bộ công trình đã GỘP làm
  // một khối 7,5). Cắt theo hộp bao là phép cắt rất thô nên nó không bỏ được khối nào.
  // ⇒ Đừng chờ hai cột lệch nhau ở --zoom 0.4; chúng sẽ không lệch. Nhưng vẫn phải ghi RIÊNG và
  // dán nhãn RIÊNG, vì ngày nào tách công trình thành nhiều khối thì chúng sẽ lệch, và lúc ấy lệch
  // là ĐÚNG — một bảng đòi "hai cột phải khớp" sẽ biến chuyện đúng đó thành một báo động giả.
  // (Khoá bằng sceneStats.test.js: "đã vẽ" ≤ "trong cảnh", KHÔNG khoá "luôn bằng nhau".)
  //
  // ⚠️ VÀ VÌ SAO PHẢI TÁCH "NỀN" RA: 44.126 tam giác vòm trời + rặng núi là HẰNG SỐ ở cả 15 kỷ.
  // Đọc cột "tổng" để so kỷ nào nặng thì hằng số ấy pha loãng khác biệt — trên 4 kỷ của ma trận
  // này, chênh lệch thật 1,43 lần bị đọc thành 1,16 lần. Cột "thành phố" mới là cột trả lời câu
  // "xây thêm nhà thì nặng thêm bao nhiêu".
  // ⚠️ CẤM DÙNG DẤU NHÁY KÉP ASCII (") TRONG MỌI DÒNG IN RA Ở ĐÂY. Chromium bọc mỗi dòng console
  // vào cặp nháy kép rồi dán thêm '", source: http://...' phía sau, nên 'bench-macbook.sh' lọc bằng
  // '[^"]*' — dòng nào chứa " sẽ bị CẮT NGANG ở đúng chỗ đó. Đã trả giá thật: dòng kết luận
  // '[stats] ✓ "đã vẽ" = "trong cảnh" …' in ra thành đúng '[stats] ✓ ' và không ai biết vì sao.
  // Dùng nháy kép cong “ ” (U+201C/201D) — mắt đọc y như nhau, bộ lọc không thấy.
  const g = city.stats.geometry;
  const n = (x) => x.toLocaleString('vi-VN');
  const pct = (a, b) => (b === 0 ? '—' : (100 * a / b).toFixed(1).replace('.', ',') + '%');
  console.log('[stats] | đại lượng | trong cảnh: thành phố | nền (trời+núi) | trong cảnh: tổng'
    + ' | đã vẽ (sau khi cắt) |');
  console.log('[stats] | lệnh vẽ | ' + g.drawCalls.city + ' | ' + g.drawCalls.backdrop
    + ' | ' + g.drawCalls.total + ' | ' + thật.calls + ' |');
  console.log('[stats] | tam giác | ' + n(g.triangles.city) + ' | ' + n(g.triangles.backdrop)
    + ' | ' + n(g.triangles.total) + ' | ' + n(thật.triangles) + ' |');
  console.log('[stats] nền chiếm ' + pct(g.triangles.backdrop, g.triangles.total)
    + ' tam giác trong cảnh (hằng số ở mọi kỷ) ⇒ so kỷ nặng nhẹ phải đọc cột THÀNH PHỐ.');

  const cắtT = g.triangles.total - thật.triangles;
  const cắtC = g.drawCalls.total - thật.calls;
  if (cắtT === 0 && cắtC === 0) {
    console.log('[stats] ✓ “đã vẽ” = “trong cảnh” — khung hình này thấy trọn cảnh, không khối nào bị cắt.');
  } else if (cắtT >= 0 && cắtC >= 0) {
    console.log('[stats] ⓘ “đã vẽ” ÍT HƠN “trong cảnh” ' + n(cắtT) + ' tam giác ('
      + pct(cắtT, g.triangles.total) + ') và ' + cắtC + ' lệnh vẽ — ĐÚNG, KHÔNG PHẢI LỖI.');
    console.log('[stats]   Camera đang đóng sát nên three bỏ qua khối nằm ngoài khung hình trước'
      + ' khi vẽ (frustum culling). Hai cột hỏi hai chuyện: “cảnh có gì” vs “khung này vẽ gì”.');
  } else {
    console.log('[stats] ⚠ “đã vẽ” NHIỀU HƠN “trong cảnh” ' + n(-cắtT) + ' tam giác và '
      + (-cắtC) + ' lệnh vẽ — khung vừa đọc có DỰNG LẠI BẢN ĐỒ BÓNG (lượt vẽ thứ hai).');
    console.log('[stats]   Nếu không phải vậy thì phép đọc renderer.info đang lệch pha với loạt đo.');
  }
  console.log('[bench] DPR=' + renderer.getPixelRatio()
    + ' khung=' + renderer.domElement.width + 'x' + renderer.domElement.height
    + ' bản đồ bóng=' + (city.sun ? city.sun.shadow.mapSize.width : 'không có')
    + ' | shader=' + thật.programs + ' geometry=' + thật.geometries + ' texture=' + thật.textures);
}

document.title = 'READY ' + JSON.stringify(city.stats);
document.getElementById('info').textContent =
  'Kỷ ' + ERA + ' — ' + (ERA_METADATA[ERA]?.label ?? '?') + ' · cấp ' + LEVEL
  + ' · ' + pendingQueue.length + ' công trường'
  // ⚠️ MẠNG ĐƯỜNG MỞ DẦN THEO SỐ PHIÊN — phải nói ra khi nó CHƯA ĐỦ, nếu không mỗi ảnh xem thử
  // mặc định ('--sessions 40' trên 80 ô đường) sẽ hiện một thành phố mới xây một nửa, và người
  // xem đọc những đoạn đường cụt ấy thành một khuyết tật dựng hình. Chuyện đó đã xảy ra thật:
  // Phase 19 mở ra với một lời chê “đường có nét đứt trông giả tạo” mà thủ phạm chỉ là con số 40.
  // Con số lấy THẲNG từ 'roadCellCount(ERA)', không viết cứng — nó suy từ chính bộ xương của kỷ.
  // ⚠️ TỪ PHASE 20 NÓ KHÁC NHAU THEO KỶ (34…92 ô), nên phải hỏi kèm 'ERA'; một hằng số chung ở
  // đây sẽ nói dối ở 14 kỷ.
  + ' · đường ' + soODuong + '/' + roadCellCount(ERA)
  // ⚠️ ĐIỀU KIỆN LÀ 'SESSIONS', KHÔNG PHẢI 'soODuong < tổng ô'. Vài ô đường VĨNH VIỄN
  // bị công trình chiếm (đo được: 2 ô ở kỷ 1), nên so với trần lý thuyết thì cảnh báo kêu oan
  // ngay cả khi mạng đã mở hết — mà một cảnh báo kêu oan còn tệ hơn không có cảnh báo. Thứ cần
  // hỏi là *ngân sách còn đang là chỗ thắt cổ chai không*, và đó đúng là 'SESSIONS < tổng số ô'.
  + (SESSIONS < roadCellCount(ERA) ? ' ⚠ MẠNG ĐƯỜNG CHƯA MỞ HẾT — tăng --sessions' : '')
  + ' · ' + city.stats.drawCalls + ' lệnh vẽ · '
  // Ba con số, theo đúng thứ tự bảng [stats]: thành phố + nền = tổng. Dòng chú thích dưới ảnh xem
  // thử là chỗ DUY NHẤT Đàm đọc mà không cần mở terminal, nên nó không được nói ít hơn bảng đo.
  + city.stats.geometry.triangles.city.toLocaleString('vi-VN') + ' tam giác thành phố + '
  + city.stats.geometry.triangles.backdrop.toLocaleString('vi-VN') + ' nền = '
  + city.stats.triangles.toLocaleString('vi-VN');
document.body.dataset.ready = '1';
`;
}

/**
 * Mã nguồn trang QUÉT — vẽ nhiều cảnh vào MỘT bảng liên hoàn.
 *
 * ⚠️ MỘT WebGL CONTEXT DÙNG LẠI CHO MỌI Ô, KHÔNG PHẢI MỖI Ô MỘT CONTEXT. Trình duyệt chỉ cho sống
 * khoảng 16 context cùng lúc rồi âm thầm thu hồi cái cũ nhất — quét 90 ô kiểu đó sẽ ra một bảng mà
 * 74 ô đầu trống trơn, và không có lỗi nào hiện ra. Ở đây: vẽ một cảnh → sao chép điểm ảnh sang
 * canvas 2D của bảng → DỌN cảnh → dựng cảnh kế tiếp trên đúng context cũ.
 */
function sweepSource({ level, theme, cell, combos, sessions = 40, t = 17.5 }) {
  return `
import { computeCityLayout } from '${ROOT}/src/engine/cityLayout.js';
import { buildScenePalette } from '${ROOT}/src/engine/city3d/palette3d.js';
import { deriveDaylight } from '${ROOT}/src/engine/city3d/daylight.js';
import { applyPaintedLook, createCityScene, MAX_PIXEL_RATIO } from '${ROOT}/src/components/city/render3d/sceneGraph.js';
import { CITY_CAMERA_FOV, cityOrbitOptions, createOrbit } from '${ROOT}/src/engine/city3d/orbit.js';
import { BLUEPRINT_CATALOG, ERA_METADATA } from '${ROOT}/src/engine/constants.js';
import { PerspectiveCamera, WebGLRenderer } from 'three';

const LEVEL = ${level};
const IS_DARK = ${theme === 'dark'};
const SESSIONS = ${sessions};
const ANIM_T = ${t};
const CELL_W = ${cell};
const CELL_H = Math.round(${cell} * 0.62);
const LABEL_H = 22;
const COMBOS = ${JSON.stringify(combos)};

const hours = [...new Set(COMBOS.map((c) => c.hour))];
const eras  = [...new Set(COMBOS.map((c) => c.era))];

const sheet = document.getElementById('sheet');
const ctx = sheet.getContext('2d');
sheet.width  = hours.length * CELL_W + 64;
sheet.height = eras.length * (CELL_H + LABEL_H) + 34;
ctx.fillStyle = IS_DARK ? '#141311' : '#e9e6de';
ctx.fillRect(0, 0, sheet.width, sheet.height);

// Một canvas WebGL DUY NHẤT, kích thước đúng một ô.
const stage = document.createElement('canvas');
const renderer = new WebGLRenderer({ canvas: stage, antialias: true });
// ⚠️ ĐÚNG TẦNG CHẤT LƯỢNG CỦA APP (Phase 9C). setSize sẽ đặt stage.width = CELL_W × 2; phần hạ
// mẫu về đúng cỡ ô nằm ở drawImage bên dưới, nên hình học bảng quét KHÔNG đổi — hồ sơ .geom.json
// và sweep-score.mjs vẫn đọc đúng.
renderer.setPixelRatio(MAX_PIXEL_RATIO);
applyPaintedLook(renderer);
renderer.setSize(CELL_W, CELL_H, false);

const camera = new PerspectiveCamera(CITY_CAMERA_FOV, CELL_W / CELL_H, 0.5, 200);
const tokens = IS_DARK
  ? { canvas2: '#1d1c1a', ink: '#f2efe6', line: '#33312d', accent: '#c96442' }
  : { canvas2: '#f4f2ec', ink: '#1f1e1d', line: '#e8e6de', accent: '#c96442' };

const ink = IS_DARK ? '#cfc9bb' : '#3a362f';
ctx.textBaseline = 'middle';

// Hàng tiêu đề: giờ.
ctx.font = '600 13px system-ui, sans-serif';
ctx.fillStyle = ink;
hours.forEach((hour, col) => {
  const phase = deriveDaylight(hour).phase;
  ctx.fillText(hour + 'h · ' + phase, 60 + col * CELL_W + 6, 16);
});

const notes = [];

// ⚠️ VÒNG LẶP CÓ NHƯỜNG LUỒNG, KHÔNG PHẢI forEach ĐỒNG BỘ — VÀ ĐÂY KHÔNG PHẢI CHUYỆN MỸ THUẬT.
// Dựng 90 ô trong MỘT khối đồng bộ thì luồng chính của trang bị khoá suốt ~15 phút, nên
// Runtime.evaluate của CDP KHÔNG trả lời được, console.log KHÔNG chảy ra được, và hạn giờ bên
// ngoài KHÔNG chạy tới. Người chạy lệnh nhìn thấy đúng một màn hình im lặng, không phân biệt nổi
// “đang dựng” với “đã chết” — đã ngồi đợi 25 phút một tiến trình đã chết vì đúng chuyện này.
// Nhường luồng sau MỖI HÀNG là đủ: chi phí gần bằng không, đổi lại công cụ nói được nó đang ở đâu.
for (let row = 0; row < eras.length; row += 1) {
  const era = eras[row];
  const y = 30 + row * (CELL_H + LABEL_H);
  ctx.save();
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillStyle = ink;
  ctx.translate(14, y + CELL_H / 2);
  ctx.textAlign = 'center';
  ctx.fillText('Kỷ ' + era, 0, 0);
  ctx.restore();

  const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  const levels = Object.fromEntries(built.map((id) => [id, LEVEL]));
  const layout = computeCityLayout({ built, levels, era, stats: { sessionCount: SESSIONS, streakLength: 9 } });

  hours.forEach((hour, col) => {
    const daylight = deriveDaylight(hour);
    const palette = buildScenePalette({ tokens, eraColor: ERA_METADATA[era]?.accentColor, era, daylight });
    const city = createCityScene({
      layout, palette, daylight, renderer, stats: { sessionCount: SESSIONS, streakLength: 9 },
    });
    renderer.shadowMap.needsUpdate = true;
    city.updateResidents(ANIM_T);

    const orbitOptions = cityOrbitOptions(layout.gridSize, layout.era);
    const orbit = createOrbit(orbitOptions);
    const eye = orbit.getPosition();
    const target = orbit.getTarget();
    camera.far = layout.gridSize * 8;
    camera.updateProjectionMatrix();
    camera.position.set(eye.x, eye.y, eye.z);
    camera.lookAt(target.x, target.y, target.z);

    renderer.render(city.scene, camera);
    ctx.drawImage(stage, 60 + col * CELL_W, y, CELL_W, CELL_H);

    notes.push({ era, hour, ...city.stats });
    // ⚠️ DỌN NGAY. Không dọn thì 90 cảnh cùng nằm trong bộ nhớ GPU và những ô cuối sẽ trống.
    city.dispose();
  });

  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = ink;
  ctx.fillText(ERA_METADATA[era]?.label ?? '?', 60, y + CELL_H + LABEL_H / 2);
  console.log('[sweep] xong kỷ ' + era + ' (' + (row + 1) + '/' + eras.length + ' hàng)');
  await new Promise((r) => setTimeout(r, 0));
}

renderer.dispose();
document.getElementById('info').textContent =
  notes.length + ' ô · ' + eras.length + ' kỷ × ' + hours.length + ' chặng';
document.title = 'READY ' + JSON.stringify(notes.slice(0, 3));
document.body.dataset.ready = '1';
window.__SWEEP_NOTES__ = notes;
`;
}

async function buildBundle(options) {
  mkdirSync(WORK_DIR, { recursive: true });
  const entryPath = resolve(WORK_DIR, 'entry.js');
  writeFileSync(entryPath, options.sweep ? sweepSource(options) : entrySource(options), 'utf8');

  const configPath = resolve(WORK_DIR, 'vite.preview.config.mjs');
  writeFileSync(configPath, `
import { defineConfig } from 'vite';
export default defineConfig({
  root: ${JSON.stringify(ROOT)},
  logLevel: 'error',
  build: {
    outDir: ${JSON.stringify(resolve(WORK_DIR, 'dist'))},
    emptyOutDir: true,
    minify: false,
    lib: { entry: ${JSON.stringify(entryPath)}, formats: ['es'], fileName: 'preview' },
  },
});
`, 'utf8');

  await run('node', ['node_modules/vite/bin/vite.js', 'build', '--config', configPath], { cwd: ROOT });
  return resolve(WORK_DIR, 'dist/preview.js');
}

/**
 * Trang cho chế độ QUÉT. Khác trang thường ở một điểm phải nói rõ:
 * ⚠️ **Ô trong bảng liên hoàn KHÔNG có lớp viền tối góc (vignette)** — lớp đó là CSS phủ lên canvas,
 * mà ở đây 90 ô được sao chép vào một canvas 2D chung nên không mang theo lớp phủ được. Nghĩa là
 * bảng quét hơi SÁNG HƠN và hơi PHẲNG HƠN cảnh thật ở bốn góc. Chấp nhận có chủ ý: bảng này dùng để
 * so sánh 90 ô với NHAU (bắt kỷ nào lệch màu, chặng nào tối/sáng bất thường), còn muốn soi một cảnh
 * đúng như Đàm thấy thì dùng chế độ chụp một ảnh — nó có đủ vignette.
 */
function sweepPageHtml({ theme }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>đang quét…</title>
<style>
  body { margin:0; background:${theme === 'dark' ? '#141311' : '#e9e6de'}; font-family: system-ui, sans-serif; }
  #wrap { padding:8px; }
  #info { margin-top:6px; font-size:12px; color:${theme === 'dark' ? '#cfc9bb' : '#4a463f'}; }
  canvas { display:block; }
</style></head>
<body><div id="wrap"><canvas id="sheet"></canvas><div id="info">…</div></div>
<script type="module" src="/preview.js"></script>
</body></html>`;
}

function pageHtml({ width, height, theme, mask = null }) {
  // ⚠️ DỰNG MẶT NẠ THÌ CẢ TRANG PHẢI ĐEN, KHÔNG CHỈ CẢNH 3D. Ảnh chụp rộng hơn canvas (viền cửa sổ
  // + dòng chữ số liệu bên dưới), nên nền trang lọt vào ảnh: ở theme sáng nó là `#e9e6de`, tức
  // (233,230,222) — một màu KHÔNG thuần kênh nào, chiếm 13% khung hình, và nó làm cổng "mặt nạ có
  // thuần kênh màu không" của `road-score.mjs` báo động nhầm (62% thay vì ~99%). Đúng bài học
  // Phase 4G: số đo nào gây bất ngờ thì kiểm CÔNG CỤ trước — và ở đây thủ phạm hoá ra không nằm
  // trong cảnh 3D chút nào.
  // ⚠️ NỀN TRANG Ở CHẾ ĐỘ MẶT NẠ LÀ MỘT MÀU MỐC, KHÔNG PHẢI MÀU ĐEN — VÀ ĐÂY LÀ BẢN VÁ CHO MỘT
  // PHÉP ĐO ĐÃ SAI THẬT (2026-08-19). Ảnh chụp rộng hơn canvas, nên nền trang lọt vào ảnh. Tô đen
  // thì nó lẫn hoàn toàn vào "không có lớp nào" của cảnh 3D, tức nó nằm trong MẪU SỐ mà không ai
  // tách ra được: bảng mật độ đầu tiên vì thế thấp hơn sự thật một cách có hệ thống ở MỌI ô.
  // Bản vá đầu (khai toạ độ canvas ra `.geom.json` rồi cắt theo) VẪN SAI, vì khung nhìn thật chỉ
  // cao 693 chứ không phải 780 — canvas bị xén mất 23 dòng cuối, nên con số khai (700) lớn hơn số
  // dòng thật sự vẽ ra (677). Một toạ độ KHAI không phải một toạ độ ĐO.
  // ⇒ Nay bên dựng TỰ ĐÁNH DẤU phần không phải khung hình bằng một bộ ba màu không thể sinh ra từ
  // mặt nạ: các lớp chỉ tô đỏ/lục/lam thuần, nên mọi điểm ảnh pha đều có ĐÚNG MỘT kênh khác 0.
  // `rgb(1,2,3)` có ba kênh khác 0 và khác nhau ⇒ không một phép pha nào tạo ra được nó.
  const bg = mask ? 'rgb(1,2,3)' : (theme === 'dark' ? '#141311' : '#e9e6de');
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>đang dựng…</title>
<style>
  body { margin:0; background:${bg}; font-family: system-ui, sans-serif; }
  #wrap { padding:16px; }
  /* Dòng số liệu cũng phải mang màu mốc ở chế độ mặt nạ, nếu không mấy trăm điểm ảnh chữ sẽ rơi
     vào mẫu số dưới dạng "không có lớp nào". */
  #info { margin-top:10px; font-size:13px; color:${mask ? 'rgb(1,2,3)' : (theme === 'dark' ? '#cfc9bb' : '#4a463f')}; }
  /* ⚠️ PHẢI GIỐNG HỆT lớp vignette trong CityScene3D.jsx. Không có nó thì trang xem thử
     chụp ra một thành phố KHÁC với thành phố Đàm nhìn thấy — mà một công cụ mắt-soi nói dối
     còn tệ hơn không có công cụ nào. Đổi bên này phải đổi bên kia. */
  /* ⚠️ GHIM CỠ CSS. Không có dòng này thì setSize (vốn chỉ đổi bộ đệm vẽ) sẽ để canvas tự dàn
     theo thuộc tính width mới — tức khung hình phóng to gấp đôi rồi bị cửa sổ chụp cắt mất, thay
     vì siêu lấy mẫu như màn Retina. */
  #stage { width:${width}px; height:${height}px; display:block; }
  #frame { position:relative; display:inline-block; line-height:0; }
  /* ⚠️ DỰNG MẶT NẠ THÌ TẮT LỚP VIỀN TỐI GÓC. Nó là một lớp CSS nâu trong suốt phủ lên canvas, tức
     nó CỘNG thêm vào cả ba kênh ở vùng rìa — đỏ thuần hoá thành đỏ pha nâu và tụt khỏi ngưỡng
     "thuần một kênh". Ảnh THẬT thì vẫn phải có nó (đó là thứ Đàm nhìn thấy); chỉ tấm mặt nạ mới
     cần sạch. */
  #vignette {
    position:absolute; inset:0; pointer-events:none;
    background: ${mask ? 'none' : theme === 'dark'
      ? `radial-gradient(ellipse 82% 74% at 50% 44%,
      rgba(10,8,14,0) 48%, rgba(10,8,14,0.10) 78%, rgba(10,8,14,0.24) 100%)`
      : `radial-gradient(ellipse 76% 68% at 50% 44%,
      rgba(42,28,15,0) 42%, rgba(42,28,15,0.16) 74%, rgba(42,28,15,0.42) 100%)`};
  }
</style></head>
<body><div id="wrap">
  <div id="frame">
    <canvas id="stage" width="${width}" height="${height}"></canvas>
    <div id="vignette"></div>
  </div>
  <div id="info">…</div>
</div>
<script type="module" src="/preview.js"></script>
</body></html>`;
}

/**
 * Máy chủ tĩnh nhỏ xíu, chỉ sống trong lúc chụp.
 * ⚠️ BẮT BUỘC phải qua HTTP, không dùng được `file://`: trình duyệt áp luật same-origin cho
 * `<script type="module">`, và với `file://` thì MỌI file bị coi là khác nguồn — kết quả là trang
 * trắng tinh, KHÔNG có lỗi nào hiện ra ở stdout. Đúng một lần đã mất công vì chuyện này.
 */
function serve(files) {
  return new Promise((done) => {
    const server = createServer((req, res) => {
      const path = (req.url ?? '/').split('?')[0];
      const file = files[path === '/' ? '/index.html' : path];
      if (!file) { res.writeHead(404); res.end('không có'); return; }
      res.writeHead(200, { 'Content-Type': file.type });
      res.end(file.body);
    });
    server.listen(0, '127.0.0.1', () => done({ server, port: server.address().port }));
  });
}

/**
 * KIỂM XEM HỘP BAO CANVAS CÓ NẰM TRỌN TRONG KHUNG NHÌN KHÔNG — hàm THUẦN, không DOM, không CDP.
 *
 * ⚠️ ĐÂY LÀ BẢN VÁ CỦA `TECH_DEBT #49`. Bản cũ ĐOÁN cỡ cửa sổ bằng
 * `--window-size=(width + 34),(height + 80)` — hai con số ước lượng cho phần khung cửa sổ. Trong
 * hộp cát này `+80` THIẾU 23 điểm ảnh: canvas 1100×700 đặt ở `y = 16` chỉ được vẽ ra 677 dòng,
 * 23 dòng cuối là nền trang, và **không có gì nói ra**. Mọi ảnh đơn từ trước tới nay là một khung
 * hình 1100×677 mang tên 1100×700 — tỉ lệ thật 1,625 trong khi camera dựng theo 1,571, tức ảnh bị
 * kéo dãn dọc nhẹ ở MỌI kỷ, MỌI chặng, suốt nhiều tháng.
 *
 * ⚠️ VÌ SAO KHÔNG NỚI `+80` THÀNH `+103`. Đó là thay một con số đoán bằng một con số đoán khác, và
 * nó sẽ trôi lại ngay khi ai đó đổi bố cục trang, đổi thanh cuộn, hay chạy trên máy có DPR khác.
 * ⇒ Nay: HỎI trình duyệt canvas đang nằm ở đâu (`getBoundingClientRect`), chụp đúng hộp đó bằng
 * CDP `clip`, và TỪ CHỐI CHẠY nếu hộp ấy thò ra ngoài khung nhìn. Cùng một luật với màu mốc
 * `rgb(1,2,3)` ở `pageHtml`: một toạ độ ĐO thay cho một toạ độ KHAI.
 *
 * ⚠️ KIỂM CẢ HAI CHIỀU, KHÔNG CHỈ CHIỀU ĐANG SAI. Bản đầu của `frame-fit.mjs --selftest`
 * (Phase 7B) chỉ vặn khoảng cách camera nên nó bảo chứng trục DỌC và mù hoàn toàn với trục NGANG —
 * đúng chiều đang sai lúc ấy. Ở đây chiều đang sai là DỌC, nên phép kiểm phải chạm tới cả chiều
 * NGANG để không lặp lại y hệt cái lỗi đó.
 *
 * `Math.ceil` chứ không `Math.round`: thò ra nửa điểm ảnh vẫn là thò ra.
 */
/**
 * TRẦN CỨNG CỦA Ổ CẮM CDP — **4 MiB cho MỘT tin nhắn**. Không phải phỏng đoán: đo được từng byte
 * ngày 2026-08-19 bằng cách chụp một canvas nhiễu (không nén được) mỗi lúc một cao —
 * **4.194.264 byte base64 thì CHẠY, nhích thêm là ĐỨT Ổ CẮM**. Tức đúng 4 × 1024 × 1024.
 *
 * ⚠️ NÓ ĐỨT DƯỚI DẠNG `ws.onerror`, KHÔNG dưới dạng một câu "ảnh quá to". Ngày phát hiện, bản quét
 * 15 kỷ chạy 5 phút rồi chết với đúng một dòng "ổ cắm CDP lỗi" — không ai đoán được là vì cỡ ảnh.
 * Bản quét 15 kỷ (1864×3120) cần ~9 MB base64 ⇒ nó KHÔNG BAO GIỜ đi lọt đường đó.
 */
export const HAN_TIN_CDP = 4 * 1024 * 1024;

/**
 * Ngân sách ĐIỂM ẢNH cho mỗi dải chụp.
 *
 * Ảnh chụp màn hình đục hoàn toàn ⇒ Chromium ghi PNG 3 byte/điểm; trường hợp XẤU NHẤT (ảnh nhiễu,
 * zlib bó tay) thì base64 ra ≈ 3 × 4/3 = **4 byte mỗi điểm ảnh** — con số này cũng đo được, không
 * suy diễn: 1864×570 = 1.062.480 điểm cho ra 4.194.264 byte, tức 3,948 byte/điểm.
 *
 * ⇒ 512 K điểm × 4 byte = **2 MiB, đúng MỘT NỬA trần đo được**, và đó là nửa dành cho ảnh KHÔNG
 * NÉN ĐƯỢC CHÚT NÀO. Ảnh thật nén 3–6 lần nên biên thực tế còn rộng hơn nhiều. Chọn một nửa chứ
 * không chọn 90% vì trần kia là một cái vực: vượt qua thì không có thông báo, chỉ có ổ cắm chết.
 */
export const BYTE_MOI_DIEM_XAU_NHAT = 4;

/**
 * ⚠️ SUY RA, KHÔNG GÕ TAY. Viết thẳng `512 * 1024` thì con số ấy và cái trần 4 MiB thành hai sự
 * thật rời nhau: đổi một bên, bên kia không biết — đúng bẫy "một luật hai công thức". Ở đây quyết
 * định mỹ thuật-kỹ thuật duy nhất là **lấy một nửa trần**, và nó nằm ngay trong công thức.
 */
export const SO_DIEM_MOI_BANG = Math.floor(HAN_TIN_CDP / 2 / BYTE_MOI_DIEM_XAU_NHAT);

/**
 * Chia một hộp ảnh thành các DẢI NGANG, mỗi dải nằm gọn trong ngân sách điểm ảnh.
 *
 * Thuần, xuất ra để test được: phủ đúng [0, height), không hở, không chồng, dải cuối được phép cụt.
 */
export function chiaBang({ width, height }, soDiemMoiBang = SO_DIEM_MOI_BANG) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error(`hộp phải nguyên và dương, nhận ${width}×${height}`);
  }
  if (!(soDiemMoiBang > 0)) throw new Error('ngân sách điểm ảnh mỗi dải phải dương');
  const soDong = Math.max(1, Math.floor(soDiemMoiBang / width));
  const bang = [];
  for (let y = 0; y < height; y += soDong) bang.push({ y, height: Math.min(soDong, height - y) });
  return bang;
}

/**
 * ⚠️ MỘT TẤM ẢNH ĐO ĐƯỢC CÓ THỂ BỊ **RÁCH NGANG** MÀ TRÔNG HOÀN TOÀN BÌNH THƯỜNG.
 * Đã xảy ra thật ngày 2026-08-19: `TRUOC-A-s20-ky09.png` báo đất trống 37,37% trong khi sự thật là
 * 41,61% — hai lượt dựng lại độc lập đều ra 41,61 với cùng md5. Tấm ấy lọt qua MỌI cổng đang có:
 * md5 hai vế khác nhau ✓, 0 điểm màu mốc ✓, các lớp cộng đúng 100% ✓. Nó hợp lệ về mọi mặt, chỉ là
 * một dải ngang của nó thuộc về một khung hình khác. Thứ lộ ra sự thật hoàn toàn là tình cờ: hai
 * mặt nạ khác nhau cãi nhau về cùng một đại lượng.
 *
 * ⚠️ VÀ ĐÂY LÀ PHẦN PHẢI ĐỌC KỸ — **TÔI KHÔNG BIẾT NGUYÊN NHÂN GỐC, VÀ ĐÃ ĐOÁN SAI MỘT LẦN.**
 * Lời giải thích đầu tiên nghe rất xuôi: "một DẢI đến từ khung hình cũ", vì `shoot` chụp thành
 * nhiều dải (xem `chiaBang`). Nhưng chỗ rách đo được nằm ở **hàng 441**, còn mốc chia dải của khung
 * 1100×700 là **hàng 476** — hai con số khác nhau, tức chỗ rách KHÔNG phải mốc ghép. Ảnh gốc đã bị
 * ghi đè bằng bản dựng lại nên không truy được nữa. ⇒ Phép kiểm này cố ý **KHÔNG dựa vào mốc dải**:
 * nó quét MỌI mép hàng và hỏi một câu không cần biết nguyên nhân — *"trong tấm ảnh này có một chỗ
 * đứt ngang nào nổi bật hẳn so với mọi chỗ khác không?"*. Một phép đo không mang giả định thì không
 * chết khi giả định sai (đúng bài học `TECH_DEBT #22`: đừng vá một thứ-đại-diện bằng một
 * thứ-đại-diện khôn hơn — hãy hỏi thẳng đại lượng mình cần).
 *
 * ⚠️ VÌ SAO NGƯỠNG PHẢI CÓ HAI VẾ. Một mức TUYỆT ĐỐI thôi thì mù với ngữ cảnh (bẫy Phase 7D: một
 * con số tuyệt đối không diễn đạt được một luật nói về QUAN HỆ) — mà luật ở đây đúng là quan hệ:
 * *chỗ đứt không được nổi bật hơn mọi mép hàng khác trong CHÍNH tấm ảnh ấy*. Nhưng một TỈ SỐ thôi
 * cũng hỏng: ảnh gần phẳng thì trung vị ≈ 0 và tỉ số nổ tung vì một hạt nhiễu. ⇒ Đòi CẢ HAI, và cả
 * hai hiệu chuẩn bằng số đo thật, không chọn tay (đo 2026-08-19 trên 120 ảnh mặt nạ, 15 kỷ × 3 mốc
 * tuổi × 2 cây mã × 2 bộ mặt nạ, tổng ~83.000 mép hàng):
 *   · 120 ảnh LÀNH: mép hàng lớn nhất **0,0582** · tỉ số lớn nhất **14,5×**.
 *   · ĐỐI CHỨNG rách (nửa dưới lấy từ kỷ khác): cắt tại 476 ra **0,180 / 66×**; cắt tại 441 ra
 *     **0,361 / 132×**. Ảnh hỏng thật đo được **0,423**.
 * ⇒ sàn 0,12 nằm giữa 0,0582 và 0,180 (2,1× trên · 1,5× dưới); hệ số 30× nằm giữa 14,5× và 66×
 * (2,1× trên · 2,2× dưới). Cả hai khoảng trống đều ĐO ĐƯỢC, không phải nới cho vừa.
 */
export const VET_RACH_SAN = 0.12;
export const VET_RACH_HE_SO = 30;

/**
 * Chữ ký MỎNG của một hàng: tỉ lệ điểm ảnh rơi vào 4 nhóm {đỏ trội · lục trội · lam trội · gần đen}.
 *
 * Cố ý KHÔNG dùng độ sáng trung bình: hai màu khác hẳn nhau vẫn có thể cùng độ sáng, nên trung bình
 * sẽ bỏ sót đúng ca một dải bị thay bằng dải của cảnh khác. Phân bố theo nhóm thì không. Dùng được
 * cho cả ảnh mặt nạ lẫn ảnh thường.
 */
export function chuKyHang(pixels, width, y) {
  const nhom = [0, 0, 0, 0];
  for (let x = 0; x < width; x += 1) {
    const i = (y * width + x) * 4;
    const r = pixels[i]; const g = pixels[i + 1]; const b = pixels[i + 2];
    const dinh = Math.max(r, g, b);
    nhom[dinh < 40 ? 3 : (dinh === r ? 0 : (dinh === g ? 1 : 2))] += 1;
  }
  return nhom.map((v) => v / width);
}

/** Tổng biến phân giữa hai chữ ký — nằm trong [0,1], đọc thẳng ra "bao nhiêu phần bề ngang đã đổi nhóm". */
export function khoangCachHang(a, b) {
  return (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])
    + Math.abs(a[2] - b[2]) + Math.abs(a[3] - b[3])) / 2;
}

/**
 * ⚠️ NGƯỠNG TRÊN HIỆU CHUẨN TRÊN ẢNH MỘT-CẢNH, VÀ BẢNG QUÉT KHÔNG PHẢI MỘT CẢNH.
 * Bản đầu của phép kiểm này chạy đúng như thiết kế rồi **kêu oan 30 chỗ** trên bản quét 15 kỷ —
 * hàng 216, 424, 632, … cách nhau đúng **208 = CELL_H(186) + LABEL_H(22)**. Đó là các **dải nhãn**
 * mà chính trang xem thử vẽ ra: một tấm bảng dán ảnh thì CÓ mép sắc lẹm, và có rất nhiều.
 * ⇒ Đúng bài học `TECH_DEBT #38`: một ngưỡng đo trên MỘT quần thể (120 ảnh một-cảnh) đã được đem
 * áp cho CẢ TẬP mà không ai hỏi tập kia có cùng hình dạng không.
 *
 * Cách chữa KHÔNG phải nới ngưỡng (nới thì ảnh một-cảnh mất hết hàng rào) mà là **kể tên những
 * hàng mà một mép sắc lẹm là ĐÚNG THIẾT KẾ**. Hàm này suy chúng từ CÙNG công thức bố cục mà
 * `sweepPageHtml` dùng (`y = yHeader + row × (cellH + labelH)`), không phải một bản chép tay.
 */
export function hangCauTrucBangQuet({ soKy, cellH, labelH = 22, yHeader = 30 }) {
  const hang = [];
  for (let row = 0; row < soKy; row += 1) {
    const y = yHeader + row * (cellH + labelH);
    hang.push(y);          // mép trên của ô ảnh (nền bảng → ảnh)
    hang.push(y + cellH);  // mép dưới của ô ảnh (ảnh → dải nhãn)
  }
  return hang;
}

/**
 * NHẬT KÝ CỔNG CHỐNG-RÁCH — `TECH_DEBT #52`, Đàm yêu cầu 2026-08-19.
 *
 * Cổng chặn đã biến một lỗi IM LẶNG thành một lỗi ỒN ÀO, và đó là 90% giá trị. Nhưng ta vẫn KHÔNG
 * biết vì sao ảnh rách — lời giải thích đầu tiên ("một dải đến từ khung hình cũ") đã bị chính số đo
 * bác bỏ. Nên mỗi lần cổng kích hoạt, ghi lại ĐỦ thứ cần để sau này truy bằng cách ĐỌC BẢNG chứ
 * không phải đoán: ảnh nào · cỡ bao nhiêu · chụp mấy dải · lượt thứ mấy · rách ở đâu · có trùng mốc
 * chia dải không (đây là cột quan trọng nhất — nó là thứ đã bác bỏ giả thuyết đầu tiên).
 *
 * ⚠️ ĐIỀU KIỆN XEM LẠI, TƯỜNG MINH: **quá 5 lần kích hoạt thì DỪNG LẠI TRUY NGUYÊN NHÂN**, đừng
 * chụp lại tiếp. Công cụ tự đếm và tự nhắc — một điều kiện xem lại chỉ nằm trong tài liệu thì phải
 * có người đi tìm mới đọc được.
 *
 * ⚠️ VÀ MỘT GIỚI HẠN PHẢI NÓI THẲNG: `.city-preview/` nằm trong `.gitignore`, mà phiên làm việc từ
 * xa thì chạy trong một hộp cát bị thu hồi sau khi xong. Nghĩa là nhật ký này **chỉ sống trong một
 * phiên**. Phiên nào thấy cổng kích hoạt thì PHẢI chép dòng ấy sang `BAN_GIAO.md` — nếu không thì
 * "sau vài chục lần sẽ có mẫu" không bao giờ tới được.
 */
export const NHAT_KY_VET_RACH = 'vet-rach.log';
export const NGUONG_TRUY_VET_RACH = 5;

/**
 * Một dòng nhật ký cho một lần kích hoạt. THUẦN — không đụng đĩa, không đọc đồng hồ (nhận `khi` từ
 * ngoài), để test khoá được ĐỊNH DẠNG chứ không phải khoá một lần chạy may rủi.
 */
export function dongNhatKyVetRach({
  khi, anh, rong, cao, soDai, luot, soLuot, xau = [],
}) {
  const trung = xau.filter((m) => m.trungMocDai).length;
  const buocLonNhat = xau.reduce((t, m) => Math.max(t, m.buoc), 0);
  const tiSoLonNhat = xau.reduce((t, m) => Math.max(t, m.tiSo), 0);
  const hang = xau.map((m) => m.y).join(',');
  return [
    khi,
    anh,
    `${rong}x${cao}`,
    `dai=${soDai}`,
    `luot=${luot}/${soLuot}`,
    `soVet=${xau.length}`,
    `trungMocDai=${trung}/${xau.length}`,
    `buocMax=${buocLonNhat.toFixed(4)}`,
    `tiSoMax=${tiSoLonNhat.toFixed(1)}`,
    `hang=${hang}`,
  ].join('\t');
}

/**
 * Quét MỌI mép hàng của một ảnh, tìm chỗ đứt ngang bất thường.
 *
 * @param {{pixels: Buffer, width: number, height: number}} anh
 * @param {number[]} [mocDai] các hàng bắt đầu một dải chụp — CHỈ để ghi chú trong thông báo, KHÔNG
 *   tham gia vào phép quyết định. Có nó thì thông báo nói được "chỗ rách trùng / không trùng mốc
 *   dải", tức đưa luôn bằng chứng cho hay chống giả thuyết "một dải đến từ khung hình cũ".
 * @param {number[]} [hangCauTruc] các hàng mà một mép SẮC LẸM là ĐÚNG THIẾT KẾ — xem `HANG_CAU_TRUC`.
 * @returns {{trungVi: number, xau: {y: number, buoc: number, tiSo: number, trungMocDai: boolean}[], hong: boolean}}
 */
export function soiVetRach(anh, mocDai = [], hangCauTruc = [], san = VET_RACH_SAN, heSo = VET_RACH_HE_SO) {
  const { pixels, width, height } = anh;
  if (height < 3) return { trungVi: 0, xau: [], hong: false };
  const buoc = new Array(height - 1);
  let truoc = chuKyHang(pixels, width, 0);
  for (let y = 1; y < height; y += 1) {
    const nay = chuKyHang(pixels, width, y);
    buoc[y - 1] = khoangCachHang(truoc, nay);
    truoc = nay;
  }
  const sap = [...buoc].sort((a, b) => a - b);
  const trungVi = sap[sap.length >> 1];
  const moc = new Set(mocDai);
  const boQua = new Set(hangCauTruc);
  const xau = [];
  for (let y = 1; y < height; y += 1) {
    if (boQua.has(y)) continue;
    const b = buoc[y - 1];
    const tiSo = b / Math.max(trungVi, 1e-9);
    if (b > san && tiSo > heSo) xau.push({ y, buoc: b, tiSo, trungMocDai: moc.has(y) });
  }
  return { trungVi, xau, hong: xau.length > 0 };
}

/**
 * ════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VẾT **CHÉP**: MỘT DẢI CỦA KHUNG HÌNH BỊ NHÂN ĐÔI SANG NGANG — VÀ CỔNG CHỐNG-RÁCH MÙ VỚI NÓ
 * ════════════════════════════════════════════════════════════════════════════════════════════
 * Gặp lần đầu 2026-08-28 (Phase 21 §6, khi dựng 15 ảnh nhìn từ trên xuống). Kỷ 4 và kỷ 7 ra ảnh
 * mà **nửa trên bị chép sang phải đúng 780 điểm ảnh**: hàng 0–348 thoả `điểm(x) === điểm(x+780)`,
 * hàng 349–699 lành. Chụp lại đúng cùng dòng lệnh thì SẠCH ⇒ một cuộc đua lúc chụp, không phải
 * lỗi của cảnh.
 *
 * ⚠️ VÌ SAO `soiVetRach` KHÔNG THẤY. Nó đo bước nhảy giữa HAI HÀNG KỀ NHAU. Một dải bị chép sang
 * NGANG thì trong lòng nó mọi hàng vẫn nối nhau mượt mà, còn chỗ giáp (hàng 349) rơi vào vùng
 * đất phẳng nên bước nhảy cũng nhỏ. Hai chế độ hỏng khác nhau cần hai phép đo khác nhau — đây
 * đúng bài học *"phép đo phải chạm đúng đại lượng mình định nói"* (Phase 9A).
 *
 * ⚠️ VÀ NÓ SUÝT ĐI VÀO MỘT KẾT LUẬN MỸ THUẬT. Nhìn ảnh kỷ 4 tôi thấy khu phố lặp lại và đã tự
 * giải thích rằng *"phường của Trường An vốn giống hệt nhau theo lệnh vua"* — một câu chuyện lịch
 * sử hoàn toàn hợp lý cho một lỗi dựng ảnh. Không cổng nào bắt được một tấm ảnh sai mà "hợp lý".
 *
 * CÁCH ĐO: băm TỪNG ĐOẠN CỘT (cao `CHEP_CAO_BANG` hàng). Hai đoạn cột trùng khít TỪNG BYTE mà
 * cách nhau xa là chuyện nội dung thật gần như không làm được — bóng đổ, dốc sáng và nhiễu
 * rasterise đều khác nhau — nhưng chắc chắn xảy ra khi một dải bị chép.
 *
 * ⚠️ HAI ĐẦU ĐỀU ĐO ĐƯỢC, NGƯỠNG NẰM GIỮA (chống cái phễu Phase 9A). Trên 16 tấm ảnh nhìn từ trên
 * xuống 1500×700: **hai tấm hỏng ra 48,0% và 48,6%**; **mười bốn tấm lành ra 0,0%–0,7%** (kỷ 3 và
 * kỷ 7 có 0,6–0,7% vì các thửa ruộng ngoài thành lặp lại thật). Ngưỡng `CHEP_SAN` = 10% nằm cách
 * đầu lành 14× và cách đầu hỏng 4,8×.
 *
 * `CHEP_CACH_TOI_THIEU` loại những bản sao SÁT NHAU (vùng phẳng liền một dải thì cột nào cũng
 * giống cột bên cạnh — đó là màu, không phải lỗi chép).
 *
 * ⚠️⚠️ **CỘT PHẲNG PHẢI BỊ LOẠI HẲN, KHÔNG CHỈ LOẠI KHI NẰM SÁT NHAU — VÀ THIẾU VẾ ẤY CỔNG NÀY ĐÃ
 * GIẾT MỌI ẢNH MẶT NẠ TRONG IM LẶNG** (phát hiện 2026-09-02). Đoạn ngay trên đã nhìn thấy đúng căn
 * bệnh (*"vùng phẳng thì cột nào cũng giống cột bên cạnh"*) nhưng chỉ chữa thể NHẸ của nó: hai cột
 * phẳng nằm SÁT nhau thì `CHEP_CACH_TOI_THIEU` loại được, còn hai cột phẳng nằm ở HAI ĐẦU tấm ảnh
 * thì cách nhau 1399 điểm ảnh và bị tố là một vết chép. Mà một ảnh `--mask` thì **theo cấu tạo** là
 * gần như toàn một màu đen: `--mask residents` có cư dân chiếm 0,14% khung hình, phần còn lại đen
 * tuyệt đối. Hệ quả đo được: MỌI lượt `--mask` ở 1400×900 đều chết với đúng một dòng
 * `95,4% số cột bị chép (băng hàng 0–49, lệch 1399 điểm ảnh)`, ba lượt chụp lại đều ra **CÙNG MỘT
 * CON SỐ** — mà một vết chép là một CUỘC ĐUA nên nó không thể lặp lại y hệt ba lần; chính sự lặp
 * lại ấy là thứ tố cáo rằng đây là NỘI DUNG chứ không phải lỗi. Nó làm hỏng luôn
 * `scripts/human-strip.mjs`, một công cụ `CLAUDE.md` ghi tên, kể từ commit `3d37745` (Phase 21).
 *
 * ⇒ **Ba luật**: **(a)** một cột PHẲNG (cả đoạn cùng một màu) **không mang thông tin nào về việc
 * chép** — vết chép là bản sao của NỘI DUNG, mà nội dung thì không phẳng; nên cột phẳng bị loại
 * khỏi CẢ tử số LẪN mẫu số, và tỉ lệ tính trên **số cột CÓ TIN**. Cách này làm cổng **CHẶT HƠN**
 * trên ảnh thường (mẫu số nhỏ đi) chứ không nới ra — đúng hướng an toàn; **(b)** một băng mà gần
 * như không còn cột có tin thì **không phán xử được** — trả về 0 cho băng ấy là một câu trả lời
 * TRUNG THỰC (*"không có thông tin"*), khác hẳn *"sạch"*; **(c)** đây là `TECH_DEBT #38` lần thứ N:
 * ngưỡng 10% hiệu chuẩn trên **16 tấm ảnh MÀU nhìn từ trên xuống**, rồi được áp cho một quần thể
 * chưa từng nằm trong mẫu — ảnh mặt nạ. Mỗi lần thêm một CHẾ ĐỘ DỰNG mới (`--mask`, `--lowdetail`,
 * ...) phải hỏi *"cổng nào đang hiệu chuẩn trên một quần thể không có chế độ này?"*.
 */
export const CHEP_CAO_BANG = 50;
export const CHEP_CACH_TOI_THIEU = 64;
export const CHEP_SAN = 0.10;

export function soiVetChep(anh, san = CHEP_SAN, caoBang = CHEP_CAO_BANG, cachToiThieu = CHEP_CACH_TOI_THIEU) {
  const { pixels, width, height } = anh;
  if (height < caoBang || width < cachToiThieu * 2) return { ti: 0, hong: false, bang: null };
  let teNhat = { ti: 0, y0: 0, cach: 0, soCot: 0 };
  for (let y0 = 0; y0 + caoBang <= height; y0 += caoBang) {
    const dauTien = new Map();
    let soCot = 0;
    let cach = 0;
    let soCotCoTin = 0;
    for (let x = 0; x < width; x += 1) {
      const buf = Buffer.allocUnsafe(caoBang * 3);
      let phang = true;
      for (let k = 0; k < caoBang; k += 1) {
        const i = ((y0 + k) * width + x) * 4;
        buf[k * 3] = pixels[i]; buf[k * 3 + 1] = pixels[i + 1]; buf[k * 3 + 2] = pixels[i + 2];
        if (phang && k > 0
          && (buf[k * 3] !== buf[0] || buf[k * 3 + 1] !== buf[1] || buf[k * 3 + 2] !== buf[2])) {
          phang = false;
        }
      }
      // Cột PHẲNG = cả đoạn một màu ⇒ không mang tin về việc chép (xem khối chú thích ở trên).
      if (phang) continue;
      soCotCoTin += 1;
      const h = createHash('sha1').update(buf).digest('hex');
      const truoc = dauTien.get(h);
      if (truoc === undefined) dauTien.set(h, x);
      else if (x - truoc >= cachToiThieu) { soCot += 1; cach = x - truoc; }
    }
    // Quá ít cột có tin ⇒ băng này KHÔNG phán xử được. Trả 0 là "không có thông tin", không phải
    // "sạch" — và nó đúng, vì một vết chép ở đây sẽ lộ ra ở một băng khác của cùng tấm ảnh.
    if (soCotCoTin < cachToiThieu) continue;
    const ti = soCot / soCotCoTin;
    if (ti > teNhat.ti) teNhat = { ti, y0, cach, soCot };
  }
  return {
    ti: teNhat.ti,
    hong: teNhat.ti >= san,
    bang: teNhat.ti > 0 ? { y0: teNhat.y0, cao: caoBang, cach: teNhat.cach, soCot: teNhat.soCot } : null,
  };
}

export function kiemKhungNhin(hop, khungNhin) {
  const thieuNgang = Math.max(0, Math.ceil(hop.x + hop.width - khungNhin.width));
  const thieuDoc = Math.max(0, Math.ceil(hop.y + hop.height - khungNhin.height));
  return { ok: thieuNgang === 0 && thieuDoc === 0, thieuNgang, thieuDoc };
}

/** Đọc một đường dẫn JSON của DevTools. Dùng `http` của Node, KHÔNG dùng `fetch` — `fetch` đi qua
 *  biến môi trường proxy, mà đây là 127.0.0.1. */
function docJsonDevtools(port, path) {
  return new Promise((done, fail) => {
    httpGet({ host: '127.0.0.1', port, path }, (res) => {
      let s = '';
      res.on('data', (d) => { s += d; });
      res.on('end', () => { try { done(JSON.parse(s)); } catch (e) { fail(e); } });
    }).on('error', fail);
  });
}

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * CHỤP MỘT KHUNG HÌNH — qua CDP, cắt đúng hộp bao canvas.
 *
 * Ba thứ đổi so với bản cũ, và cả ba đều là "hỏi thay vì khẳng định":
 *  1. Cỡ trang đặt bằng `Emulation.setDeviceMetricsOverride` chứ không `--window-size` (cờ ấy có
 *     SÀN 500px trong headless và cộng thêm phần khung cửa sổ không đoán được — đúng bài học đã
 *     ghi cho `shot.mjs`).
 *  2. Đợi bằng `document.body.dataset.ready` chứ không `--virtual-time-budget`. Thời gian ảo tua
 *     nhanh đồng hồ chứ không tua nhanh CPU, nên với SwiftShader nó chỉ là một cái hẹn giờ mù.
 *  3. Ảnh ra ĐÚNG BẰNG canvas: không đệm, không dòng chữ số liệu, không dải nền trang. Nghĩa là
 *     `mask-count.mjs` phải đếm được 0 điểm ảnh màu mốc — nếu khác 0 thì cái `clip` đã sai, và
 *     công cụ ấy in con số đó ra để ai cũng thấy.
 *
 * ⚠️ DÒNG SỐ LIỆU DƯỚI ẢNH BỊ CẮT KHỎI PNG (nó không phải khung hình). Nó KHÔNG mất: hàm này đọc
 * `#info` qua CDP rồi trả về để chỗ gọi in ra terminal. Đổi chỗ hiển thị, không bỏ thông tin.
 */
async function shoot(chrome, url, pngPath,
  { width, height, bench = 0, mask = null, noShadow = false, noAo = false, gpu = false, focus = 0,
    hangCauTruc = [] }) {
  // Lúc đo hiệu năng thì PHẢI để stderr chảy ra, vì dòng [bench] đi bằng đường đó — và lúc dựng
  // mặt nạ cũng vậy, vì dòng [mask] là thứ DUY NHẤT chứng minh mặt nạ khớp đúng khối cần khớp.
  // ⚠️ Chế độ cận cảnh cũng phải mở đường này: dòng [focus] là thứ DUY NHẤT nói ra camera đã đứng
  // ở đâu. Ngoài mấy ca đó thì im, vì Chromium trong hộp cát này chửi dbus không ngớt.
  const choNoi = bench > 0 || !!mask || noShadow || noAo || focus > 0;

  // ⚠️ KHUNG NHÌN RỘNG RÃI CÓ CHỦ Ý. Cắt theo hộp bao rồi thì thừa bao nhiêu cũng không vào ảnh;
  // thứ duy nhất phải chắc là canvas KHÔNG bị xén. Vẫn kiểm lại bằng `kiemKhungNhin` phía dưới —
  // con số dưới đây là một lựa chọn thoải mái, không phải một lời hứa.
  const trangW = width + 96;
  const trangH = height + 240;

  const child = spawn(chrome, [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    // ⚠️ Mặc định: không có card đồ hoạ thật trong hộp cát này. SwiftShader vẽ WebGL bằng CPU —
    // chậm hơn nhiều nhưng cho ra ĐÚNG hình ảnh mà GPU sẽ cho, đủ để soi mỹ thuật.
    // `--gpu` bỏ hẳn ba cờ ép SwiftShader để trình duyệt tự chọn card thật (dùng trên máy Đàm).
    ...(gpu ? [] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']),
    '--hide-scrollbars',
    // ⚠️ CHUYỂN `console.*` CỦA TRANG RA stderr. Thiếu dòng này thì mọi cảnh báo phía trình duyệt
    // biến mất không dấu vết — và một công cụ mắt-soi im lặng nuốt cảnh báo thì đúng bằng một công
    // cụ nói dối. Đã trả giá: bản đồ môi trường hỏng hoàn toàn mà ảnh vẫn ra, vẫn "đẹp hơn", nên
    // không ai biết. Chỉ khi vặn một hằng số lên mức phi lý mà ảnh không đổi mới lộ.
    '--enable-logging=stderr',
    '--log-level=0',
    '--remote-debugging-port=0',
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  let dongDevtools = '';
  const cong = await new Promise((done, fail) => {
    const hen = setTimeout(() => fail(new Error('Chromium không báo cổng DevTools sau 30 giây')), 30000);
    child.on('error', (e) => { clearTimeout(hen); fail(e); });
    child.stderr.on('data', (b) => {
      const s = String(b);
      if (choNoi) process.stderr.write(s);
      if (dongDevtools !== null) {
        dongDevtools += s;
        const m = /ws:\/\/127\.0\.0\.1:(\d+)\//.exec(dongDevtools);
        if (m) { dongDevtools = null; clearTimeout(hen); done(Number(m[1])); }
      }
    });
  });

  const dsTarget = await docJsonDevtools(cong, '/json/list');
  const trang = dsTarget.find((t) => t.type === 'page');
  const ws = new WebSocket(trang.webSocketDebuggerUrl);
  await new Promise((r) => { ws.onopen = r; });

  let soThuTu = 0;
  const dangCho = new Map();
  // ⚠️ MỘT LỜI HỨA KHÔNG BAO GIỜ ĐƯỢC TRẢ LỜI LÀ MỘT VỤ TREO IM LẶNG — VÀ NÓ ĐÃ XẢY RA THẬT
  // (2026-08-19, ngay trong lượt chạy đầu tiên của chính bản vá này). Bản đầu chỉ gắn `onmessage`:
  // khi ổ cắm CDP chết (trang sập, tiến trình con bị giết, WebSocket đứt) thì mọi `cdp(...)` đang
  // chờ nằm lại trong `dangCho` VĨNH VIỄN. Triệu chứng: cả node lẫn Chromium đứng yên 0% CPU, không
  // một dòng nào in ra, không một thông báo lỗi nào — trông y hệt "đang dựng, cứ đợi thêm". Đã ngồi
  // đợi 25 phút một tiến trình đã chết. ⇒ Ổ cắm đứt PHẢI làm đỏ mọi lời hứa đang chờ, ngay lập tức.
  const chetOCam = (vìSao) => {
    for (const [, tra] of dangCho) tra({ error: { message: vìSao } });
    dangCho.clear();
  };
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && dangCho.has(m.id)) { dangCho.get(m.id)(m); dangCho.delete(m.id); }
  };
  ws.onclose = () => chetOCam('ổ cắm CDP đã đóng — Chromium chết hoặc trang sập giữa chừng');
  ws.onerror = () => chetOCam('ổ cắm CDP lỗi');
  child.on('exit', (ma) => chetOCam(`Chromium thoát bất ngờ (mã ${ma})`));

  const cdp = (method, params = {}) => new Promise((done, fail) => {
    const id = ++soThuTu;
    dangCho.set(id, (m) => (m.error ? fail(new Error(`${method}: ${m.error.message}`)) : done(m.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
  const doc = async (bieuThuc) => (await cdp('Runtime.evaluate', {
    expression: bieuThuc, returnByValue: true, awaitPromise: true,
  })).result.value;

  let info = '';
  let hop = null;
  try {
    await cdp('Page.enable');
    await cdp('Runtime.enable');
    // ⚠️ ĐÂY là thứ `--window-size` không làm được: đặt bề ngang/bề cao BỐ CỤC thật, không dính
    // phần khung cửa sổ, không dính sàn 500px của headless.
    await cdp('Emulation.setDeviceMetricsOverride', {
      width: trangW, height: trangH, deviceScaleFactor: 1, mobile: false,
    });
    await cdp('Page.navigate', { url });

    // ── ĐỢI BẰNG TÍN HIỆU THẬT CỦA TRANG ──────────────────────────────────────
    // ⚠️ ĐỒNG HỒ PHẢI CHẠY SONG SONG, KHÔNG ĐƯỢC NẰM TRONG VÒNG LẶP. `Runtime.evaluate` KHÔNG trả
    // lời khi luồng chính của trang đang bận (trang quét dựng 90 ô trong một khối đồng bộ), nên một
    // phép kiểm hạn giờ đặt SAU `await` thì không bao giờ chạy tới — đúng cái đã để tôi ngồi đợi 25
    // phút một tiến trình đã chết. Hạn giờ chỉ có nghĩa khi nó là một cuộc đua.
    // 30 phút cho MỌI chế độ. Bản quét 90 ô trên SwiftShader đã đo được ~15 phút, `--bench 120`
    // cũng cỡ đó — một hạn chung dễ nhớ hơn hai con số mà không ai kiểm.
    const hanCho = 1800000;
    const batDau = Date.now();
    let xong = false;
    const nhac = setInterval(() => {
      if (!xong) process.stderr.write(`  … đang dựng (${Math.round((Date.now() - batDau) / 1000)}s)\n`);
    }, 30000);
    // ⚠️ PHẢI GIỮ LẠI CÁI HẸN GIỜ ĐỂ CÒN HUỶ. Bản đầu thả trôi `setTimeout(…, 30 phút)`, nên sau khi
    // ảnh đã ghi xong tiến trình vẫn SỐNG thêm nửa tiếng: vòng lặp sự kiện của Node còn một cái hẹn
    // chưa tới hạn. Triệu chứng y hệt một vụ treo (ảnh có rồi mà lệnh không chịu trả về dấu nhắc),
    // và nó sẽ kết thúc bằng một lời-hứa-bị-từ-chối-không-ai-bắt. Một cái hẹn giờ luôn phải có chỗ
    // huỷ, kể cả khi đường đi bình thường không bao giờ chạm tới nó.
    let henGio;
    const dongHo = new Promise((_, fail) => {
      henGio = setTimeout(() => fail(new Error(
        `Trang không báo sẵn sàng sau ${Math.round(hanCho / 1000)} giây.\n`
        + '  ⇒ Chạy lại KHÔNG kèm cờ nào để xem lỗi phía trình duyệt, hoặc bớt số kỷ:\n'
        + '    node scripts/city-preview.mjs --sweep --eras 1,2 --theme light')), hanCho);
    });
    // Không ai bắt lời từ chối này nếu cuộc đua đã kết thúc — nói trước để Node khỏi coi là lỗi.
    dongHo.catch(() => {});
    try {
      await Promise.race([
        (async () => {
          for (;;) {
            if (await doc("document.body && document.body.dataset.ready === '1'")) return;
            await nghi(250);
          }
        })(),
        dongHo,
      ]);
    } finally {
      xong = true;
      clearInterval(nhac);
      clearTimeout(henGio);
    }

    // ── HỎI TRÌNH DUYỆT CANVAS NẰM Ở ĐÂU (không khai, không đoán) ─────────────
    const do_ = await doc(`(() => {
      const c = document.querySelector('canvas');
      const r = c.getBoundingClientRect();
      return {
        x: r.x, y: r.y, width: r.width, height: r.height,
        buffW: c.width, buffH: c.height,
        vpW: window.innerWidth, vpH: window.innerHeight,
        info: (document.getElementById('info') || {}).textContent || '',
      };
    })()`);
    info = do_.info;

    const kiem = kiemKhungNhin(do_, { width: do_.vpW, height: do_.vpH });
    if (!kiem.ok) {
      throw new Error(
        'CANVAS THÒ RA NGOÀI KHUNG NHÌN — ảnh sẽ bị xén và KHÔNG có gì nói ra (đúng TECH_DEBT #49).\n'
        + `  hộp bao canvas: x=${do_.x} y=${do_.y} ${do_.width}×${do_.height}\n`
        + `  khung nhìn:     ${do_.vpW}×${do_.vpH}\n`
        + `  thiếu:          ${kiem.thieuNgang} cột · ${kiem.thieuDoc} dòng\n`
        + '  ⇒ Nới `trangW`/`trangH` trong `shoot()` (scripts/city-preview.mjs) rồi chạy lại.');
    }

    // ── CHỤP THEO DẢI NGANG RỒI GHÉP ─────────────────────────────────────────
    // ⚠️ KHÔNG PHẢI TỐI ƯU, LÀ ĐIỀU KIỆN CẦN: một tin nhắn CDP không quá 4 MiB (xem `HAN_TIN_CDP`).
    // Chụp một phát thì bản quét 15 kỷ chết giữa chừng với đúng một dòng "ổ cắm CDP lỗi".
    const hopNguyen = {
      x: Math.round(do_.x), y: Math.round(do_.y),
      width: Math.round(do_.width), height: Math.round(do_.height),
    };
    // Canvas ở đây luôn được ghim cỡ CSS bằng số nguyên. Nếu ngày nào đó không còn vậy thì phép
    // làm tròn trên ĂN MẤT một phần khung hình — nên nó phải KÊU, đừng lặng lẽ đúng gần đúng.
    const lechNguyen = Math.max(
      Math.abs(do_.x - hopNguyen.x), Math.abs(do_.y - hopNguyen.y),
      Math.abs(do_.width - hopNguyen.width), Math.abs(do_.height - hopNguyen.height),
    );
    if (lechNguyen > 0.01) {
      process.stderr.write(`  ⚠️  hộp bao canvas KHÔNG nguyên (${do_.x},${do_.y} ${do_.width}×${do_.height})`
        + ` — đã làm tròn, ảnh có thể lệch tới ${lechNguyen.toFixed(2)} điểm ảnh.\n`);
    }

    const dsBang = chiaBang(hopNguyen);
    if (dsBang.length > 1) {
      process.stderr.write(`  … chụp ${dsBang.length} dải ngang (trần một tin nhắn CDP là 4 MiB)\n`);
    }
    // ⚠️ ẢNH CÓ THỂ BỊ RÁCH NGANG — xem `soiVetRach`. Chụp lại là cách chữa đúng: lỗi này là một
    // cuộc đua, không phải một sai sót tất định. Nhưng chụp lại MÃI thì lại giấu đi một hỏng hóc
    // thật sự, nên hết lượt thì DỪNG HẲN — không ghi ra một tấm ảnh đáng ngờ, vì số liệu đo từ nó
    // sai vài điểm phần trăm mà không gì kêu.
    const mocDai = dsBang.map((b) => b.y).filter((y) => y > 0);
    const SO_LUOT = 3;
    let ghep = null;
    // Chữ ký của những mép bị tố ở lượt TRƯỚC — dùng để tách "vết rách" khỏi "nội dung" bằng tính
    // lặp lại thay vì bằng một ngưỡng nữa. Lý do đầy đủ ở chỗ dùng, bên dưới.
    let chuKyTruoc = '';
    for (let luot = 1; luot <= SO_LUOT; luot += 1) {
      const dai = [];
      for (const b of dsBang) {
        const anh = await cdp('Page.captureScreenshot', {
          format: 'png',
          clip: { x: hopNguyen.x, y: hopNguyen.y + b.y, width: hopNguyen.width, height: b.height, scale: 1 },
        });
        const d = decodePng(Buffer.from(anh.data, 'base64'));
        // Đối chứng NẰM TRONG ĐƯỜNG CHẠY THẬT: đặt hàng bao nhiêu phải nhận về đúng bấy nhiêu. Thiếu
        // nó thì một phép làm tròn phía Chromium sẽ lặng lẽ làm ảnh ghép ngắn đi vài hàng.
        if (d.width !== hopNguyen.width || d.height !== b.height) {
          throw new Error(`dải tại y=${b.y} trả về ${d.width}×${d.height}, đặt hàng `
            + `${hopNguyen.width}×${b.height} — không ghép được vì sẽ ra ảnh sai thầm lặng.`);
        }
        dai.push(d);
      }
      ghep = ghepDoc(dai);
      if (ghep.height !== hopNguyen.height) {
        throw new Error(`ghép xong cao ${ghep.height}, hộp bao cao ${hopNguyen.height}`);
      }
      // ⚠️ HAI CHẾ ĐỘ HỎNG, HAI PHÉP ĐO — xem khối chú thích của `soiVetChep`. Vết CHÉP được soi
      // TRƯỚC vì nó không có đường thoát "đây là nội dung": nội dung thật không thể trùng khít
      // từng byte trên hàng trăm cột cách nhau xa.
      const chep = soiVetChep(ghep);
      if (chep.hong) {
        const taChep = `${(chep.ti * 100).toFixed(1)}% số cột bị chép (băng hàng ${chep.bang.y0}`
          + `–${chep.bang.y0 + chep.bang.cao - 1}, lệch ${chep.bang.cach} điểm ảnh)`;
        if (luot === SO_LUOT) {
          throw new Error(`ảnh vẫn bị CHÉP DẢI sau ${SO_LUOT} lượt: ${taChep}\n`
            + '  ⇒ KHÔNG ghi ảnh. Một tấm bị chép trông hoàn toàn hợp lý — nó chỉ kể sai một nửa '
            + 'thành phố, và người xem sẽ tự nghĩ ra lời giải thích cho phần lặp lại đó.');
        }
        process.stderr.write(`  ⚠️  ảnh bị chép dải (${taChep}) — chụp lại, lượt ${luot + 1}/${SO_LUOT}\n`);
        continue;
      }

      const soi = soiVetRach(ghep, mocDai, hangCauTruc);
      if (!soi.hong) break;

      /**
       * ⚠️ MỘT VẾT RÁCH LÀ MỘT CUỘC ĐUA, NÊN NÓ KHÔNG THỂ RƠI ĐÚNG MỘT CHỖ HAI LẦN LIÊN TIẾP.
       *
       * Cổng chống-rách hiệu chuẩn trên ảnh MỘT-CẢNH ở khung app (ngẩng 34,4°), nơi không có mép
       * ngang nào sắc lẹm chạy hết bề ngang. Bảng quét từng làm nó kêu oan 30 chỗ và đã được chữa
       * bằng cách kể tên các dải nhãn (`hangCauTruc`). Phase 20 thêm quần thể THỨ BA: khung nhìn
       * thẳng từ trên xuống (`--topdown`), nơi một con đường chạy đúng hướng đông-tây LÀ một mép
       * ngang sắc lẹm chạy hết bề ngang — đúng hình dạng mà cổng này sinh ra để bắt, chỉ khác là
       * lần này nó là NỘI DUNG chứ không phải lỗi. Đo được: kỷ 1 báo hàng 317 (27,7%) và hàng 331
       * (35,7%) — **y hệt nhau tới một chữ số thập phân ở cả ba lượt chụp độc lập**.
       *
       * ⇒ Cách tách hai quần thể KHÔNG phải một ngưỡng thứ tư (thêm ngưỡng là thêm chỗ để nới —
       * bài học Phase 9A), mà là chính TÍNH LẶP LẠI. Một vết rách sinh ra từ việc chụp trúng lúc
       * khung hình đang được ghép dở: nó phụ thuộc thời điểm, nên hai lượt chụp độc lập không thể
       * cho ra cùng một hàng với cùng một bề rộng bước. Một mép do nội dung thì lặp lại y hệt mãi
       * mãi. Phép phân biệt này KHÔNG có tham số nào để nới, và nó áp cho mọi khung hình chứ không
       * riêng '--topdown' — nghĩa là nó cũng bảo vệ luôn những khung hình sau này chưa ai nghĩ tới.
       *
       * ⚠️ VÀ NÓ VẪN GHI NHẬT KÝ + NÓI RA MÀN HÌNH. Một cổng tự tha cho mình trong im lặng là một
       * cổng không còn ai kiểm được (`TECH_DEBT #52`).
       */
      const chuKy = soi.xau.map((m) => `${m.y}:${m.buoc.toFixed(4)}`).join('|');
      if (chuKy && chuKy === chuKyTruoc) {
        process.stderr.write(`  ℹ️  mép ngang LẶP LẠI Y HỆT ở lượt chụp độc lập thứ ${luot} `
          + `(${soi.xau.map((m) => `hàng ${m.y}`).join(' · ')}) ⇒ đây là NỘI DUNG, không phải vết `
          + 'rách — một vết rách phụ thuộc thời điểm chụp nên không lặp lại đúng chỗ được. Nhận ảnh.\n');
        break;
      }
      chuKyTruoc = chuKy;

      // NHẬT KÝ (`TECH_DEBT #52`): ghi TRƯỚC khi quyết định chụp lại hay bỏ cuộc, để cả lượt cuối
      // — lượt ném lỗi — cũng để lại dấu vết. Ghi hỏng thì kệ, không được để việc ghi nhật ký làm
      // hỏng lượt dựng ảnh.
      let soLanDaGhi = 0;
      try {
        const nk = resolve(OUT_DIR, NHAT_KY_VET_RACH);
        appendFileSync(nk, `${dongNhatKyVetRach({
          khi: new Date().toISOString(),
          anh: basename(pngPath),
          rong: ghep.width,
          cao: ghep.height,
          soDai: dsBang.length,
          luot,
          soLuot: SO_LUOT,
          xau: soi.xau,
        })}\n`);
        soLanDaGhi = readFileSync(nk, 'utf8').split('\n').filter(Boolean).length;
      } catch { /* nhật ký hỏng thì thôi, đừng làm hỏng cả lượt dựng */ }
      if (soLanDaGhi >= NGUONG_TRUY_VET_RACH) {
        process.stderr.write(`  ⛔ cổng chống-rách đã kích hoạt ${soLanDaGhi} lần `
          + `(ngưỡng ${NGUONG_TRUY_VET_RACH}) — theo điều kiện xem lại của TECH_DEBT #52, DỪNG LẠI\n`
          + `     TRUY NGUYÊN NHÂN thay vì chụp lại tiếp. Bảng: ${resolve(OUT_DIR, NHAT_KY_VET_RACH)}\n`
          + '     ⚠️ Thư mục này KHÔNG được git theo dõi và hộp cát sẽ bị thu hồi — chép sang BAN_GIAO.md.\n');
      }

      const xau = soi.xau
        .map((m) => `hàng ${m.y} đổi ${(m.buoc * 100).toFixed(1)}% bề ngang`
          + ` (gấp ${m.tiSo.toFixed(0)}× mép điển hình, ${m.trungMocDai ? 'TRÙNG mốc dải' : 'không trùng mốc dải'})`)
        .join(' · ');
      if (luot === SO_LUOT) {
        throw new Error(`ảnh vẫn RÁCH NGANG sau ${SO_LUOT} lượt: ${xau}\n`
          + '  ⇒ KHÔNG ghi ảnh. Một tấm rách trông bình thường nhưng số liệu đo từ nó lệch vài điểm phần trăm.');
      }
      process.stderr.write(`  ⚠️  ảnh rách ngang (${xau}) — chụp lại, lượt ${luot + 1}/${SO_LUOT}\n`);
    }
    writeFileSync(pngPath, encodePng(ghep));
    hop = {
      x: hopNguyen.x, y: hopNguyen.y, width: hopNguyen.width, height: hopNguyen.height,
      soDai: dsBang.length,
      khungNhin: { width: do_.vpW, height: do_.vpH },
      boDem: { width: do_.buffW, height: do_.buffH },
    };
  } finally {
    try { ws.close(); } catch { /* đóng được thì tốt, không thì thôi */ }
    child.kill();
  }
  return { info, hop };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const chrome = findChrome();
  if (!chrome) {
    baoThieuChromium();
    process.exit(1);
  }
  // Chế độ kiểm-rồi-thoát: dừng NGAY ở đây, trước `mkdirSync`, trước mọi việc gói bundle.
  if (args.kiemChromium) {
    console.log(chrome);
    process.exit(0);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const eras = args.eraList ?? (args.all ? Array.from({ length: 15 }, (_, i) => i + 1) : [args.era]);

  // Không truyền `--hour` ⇒ một lượt với giờ trung tính (`null`), y như trước.
  const hours = args.hours.length > 0 ? args.hours : [null];

  // ── Chế độ QUÉT: một trang, một lần mở trình duyệt, một bảng liên hoàn ───────
  if (args.sweep) {
    const sweepHours = args.hours.length > 0 ? args.hours : [6, 8, 12, 15, 18, 22];
    // ⚠️ VÀ MỘT CÁI BẪY THỨ HAI, NẶNG HƠN, LỘ RA NGAY TRONG LÚC VÁ CÁI THỨ NHẤT (2026-09-05).
    // Bản vá đầu tiên của chính đoạn này gắn thêm cả `-noshadow`, `-noao`, `-lod`, `-mask-*`. Nó
    // SAI, và sai theo hướng tệ hơn cái nó đang chữa: một cái tên **hứa một khác biệt không tồn
    // tại**. Lý do: chế độ quét dựng bằng `sweepSource({ level, theme, cell, combos, sessions, t })`
    // — SÁU trường, hết. Mọi cờ khác (`--no-shadow`, `--no-ao`, `--lowdetail`, `--mask`, `--zoom`,
    // `--focus`, `--topdown`, `--pending`, `--dpr`) **không bao giờ tới được bản dựng**; chúng được
    // nhận, không báo lỗi, rồi biến mất. Đã đo: `--sweep --no-shadow` cho ra tấm ảnh **trùng TỪNG
    // BYTE** với bản thường (`cmp` im lặng), và probe chấm ra y hệt tới hai chữ số — tức nếu tin
    // vào nó thì kết luận sẽ là "bóng đổ đóng góp 0,00", một con số hợp lý và hoàn toàn bịa.
    // ⚠️ VÀ CỔNG NÀY PHẢI ĐỨNG Ở ĐÂY — TRƯỚC `buildBundle`. Bản đầu đặt nó xuống dưới, sau khi
    // đã gói bundle (~20 giây) và đã mở server; người chạy phải đợi hết chừng ấy rồi mới bị báo
    // một điều kiểm được trong một mili-giây, và cú `process.exit` bỏ lại một server chưa đóng.
    // Đúng thứ bài học 'kiểm điều kiện tiên quyết TRƯỚC, xếp rẻ-trước-đắt-sau' đã cấm.
    // ⇒ TỪ CHỐI THẲNG, không tự chữa, không gắn nhãn cho một lời hứa suông (đúng luật ADR-026 và
    // bài học `MIN_STONE` ở Phase 9D: một cơ chế tự chữa là cách một công cụ lặng lẽ nói dối).
    const boQua = [
      ['--no-shadow', args.noShadow], ['--no-ao', args.noAo], ['--lowdetail', args.lowDetail],
      ['--mask', args.mask != null], ['--zoom', args.zoom !== 1], ['--focus', args.focus > 0],
      ['--topdown', args.topdown], ['--pending', args.pending > 0], ['--dpr', args.dpr != null],
    ].filter(([, batLen]) => batLen).map(([ten]) => ten);
    if (boQua.length > 0) {
      console.error(`❌ Chế độ --sweep KHÔNG dựng được các cờ này: ${boQua.join(' ')}`);
      console.error('   Bản quét dùng `sweepSource`, chỉ nhận: --level --theme --cell --eras --hour --sessions --t');
      console.error('   Muốn đo một cần gạt mà bản quét không có cờ ⇒ phá MÃ NGUỒN trong một `git worktree`,');
      console.error('   rồi dựng lại đúng bản quét ấy. Đừng tin một cờ bị bỏ qua trong im lặng.');
      process.exit(2);
    }
    const combos = eras.flatMap((era) => sweepHours.map((hour) => ({ era, hour })));
    const options = { ...args, combos };
    const bundlePath = await buildBundle(options);

    const { server, port } = await serve({
      '/index.html': { type: 'text/html; charset=utf-8', body: sweepPageHtml(options) },
      '/preview.js': { type: 'text/javascript; charset=utf-8', body: readFileSync(bundlePath) },
    });

    const cellH = Math.round(args.cell * 0.62);
    const tag = `${eras[0]}-${eras[eras.length - 1]}`;
    // ⚠️ LẦN THỨ MƯỜI CỦA ĐÚNG CÁI BẪY "TÊN FILE KHÔNG MANG THAM SỐ KHUNG HÌNH" — và lần này nó
    // nằm ở đường QUÉT, nơi chưa học được lần nào, trong khi đường ảnh đơn ngay bên dưới đã học
    // CHÍN lần và có đủ chuỗi nhãn. Tên cũ chỉ mang `theme` + dải kỷ, nên hai lượt quét khác hẳn
    // nhau vẫn ghi đè lên nhau trong im lặng:
    //   • `--sweep --eras 1,5,8,11,14` (6 chặng mặc định) và `--sweep --eras 1,5,8,11,14 --hour 6
    //     --hour 15` (2 chặng) cho ra CÙNG một tên `sweep-light-ky1-14.png`;
    //   • một lượt `--no-shadow` đè thẳng lên chính tấm ảnh mốc nền vừa dùng để chấm điểm.
    // Cái thứ hai suýt xảy ra thật khi đo Phase 25: cần gạt "bóng đổ" được đo bằng cách dựng lại
    // đúng bản quét ấy với `--no-shadow`, và nếu không có nhãn thì phép so sẽ chấm một tấm ảnh
    // với CHÍNH NÓ rồi in ra "bóng đổ đóng góp 0,00" — một con số hoàn toàn hợp lý và hoàn toàn
    // bịa. Đúng bài học `MAI-SAU-ky9.png`.
    // ⚠️ CHỈ gắn nhãn khi KHÁC MẶC ĐỊNH, để mọi tên file lịch sử vẫn tra được: lệnh chuẩn
    // `--sweep --all --theme light` vẫn ghi ra đúng `sweep-light-ky1-15.png` như mọi bảng số cũ
    // trong `PERFORMANCE.md` đã ghi, và cổng ảnh-cũ của `sweep-score.mjs` không phải biết gì thêm.
    // Chỉ còn nhãn cho những thứ THẬT SỰ đổi nội dung bản quét.
    const HOURS_MAC_DINH = [6, 8, 12, 15, 18, 22];
    const gioMacDinh = sweepHours.length === HOURS_MAC_DINH.length
      && sweepHours.every((h, i) => h === HOURS_MAC_DINH[i]);
    const hourTag = gioMacDinh ? '' : `-h${sweepHours.map((h) => String(h).padStart(2, '0')).join('_')}`;
    const sessTag = args.sessions === 40 ? '' : `-s${args.sessions}`;
    const lvlTag = args.level === 3 ? '' : `-lv${args.level}`;
    const cellTag = args.cell === 300 ? '' : `-c${args.cell}`;
    const tTag = args.t === 17.5 ? '' : `-t${String(args.t).replace('.', 'p')}`;
    const pngPath = resolve(OUT_DIR, `sweep-${args.theme}-ky${tag}${hourTag}${sessTag}${lvlTag}${cellTag}${tTag}.png`);
    try {
      const { info } = await shoot(chrome, `http://127.0.0.1:${port}/index.html`, pngPath, {
        width: sweepHours.length * args.cell + 64,
        // +40: chỗ cho hàng tiêu đề giờ và dòng chữ số liệu ở dưới cùng.
        height: eras.length * (cellH + 22) + 40,
        // Bảng dán ảnh CÓ mép sắc lẹm ở mọi dải nhãn — kể tên chúng ra thay vì nới ngưỡng.
        hangCauTruc: hangCauTrucBangQuet({ soKy: eras.length, cellH }),
      });
      // Dòng số liệu nay nằm NGOÀI ảnh (ảnh cắt đúng hộp bao canvas), nên phải in ra terminal —
      // đổi chỗ hiển thị, không bỏ thông tin.
      if (info) console.log(`  ${info}`);
    } finally {
      server.close();
    }

    // ⚠️ HỒ SƠ HÌNH HỌC ĐI KÈM ẢNH — MỘT LUẬT MỘT CÔNG THỨC.
    // `sweep-score.mjs` phải biết mỗi ô nằm ở đâu để lấy mẫu. Trước đây nó TỰ ĐOÁN bằng cách chép
    // lại công thức ở file này kèm một mặc định `--cell 260` — trong khi mặc định ở ĐÂY là 300.
    // Hai bản sao của cùng một luật, và bản sai thì im lặng: hàng 0 vẫn trúng (lệch dồn từ hàng 1
    // trở đi), nên phép tự-kiểm "trời bình minh sáng hơn trời đêm" — vốn chỉ đọc HÀNG 0 — vẫn báo
    // ✓ trong khi 14 hàng dưới đang lấy mẫu lệch tới hàng khác. Kết quả bịa ra hẳn 5 cặp kỷ trùng
    // nhau và 1 cặp chặng trùng nhau, tức vừa báo nhầm vừa che mất số thật.
    // ⇒ Nay ảnh nào cũng đi kèm đúng bộ số đã DÙNG để dựng nó. Bên chấm điểm KHÔNG được đoán nữa.
    const geomPath = pngPath.replace(/\.png$/, '.geom.json');
    writeFileSync(geomPath, `${JSON.stringify({
      png: pngPath.split('/').pop(),
      // ⚠️ `pad: 0` — KHÔNG PHẢI 8. Từ 2026-08-19 ảnh được cắt ĐÚNG hộp bao canvas bằng CDP
      // `clip` (xem `shoot`), nên phần đệm `#wrap { padding: 8px }` KHÔNG còn trong ảnh nữa.
      // Giữ trường này thay vì xoá: `sweep-score.mjs` tính `X0 = pad + xLabel`, nên một luật vẫn
      // chỉ có một công thức và bên chấm điểm không phải biết chuyện gì vừa đổi.
      pad: 0,
      xLabel: 60,      // ctx.drawImage(stage, 60 + col * CELL_W, y)
      yHeader: 30,     // y = 30 + row * (CELL_H + LABEL_H)
      cellW: args.cell,
      cellH,
      labelH: 22,
      eras,
      hours: sweepHours,
      theme: args.theme,
      level: args.level,
      // ⚠️ `sessions` NẰM TRONG HỒ SƠ, không phải chỉ trong đầu người chạy lệnh. Nó quyết mạng
      // đường mở tới đâu, tức nó là một SỰ THẬT VỀ TẤM ẢNH — đúng loại dữ kiện mà bài học `--cell`
      // (Phase 4G) bắt phải ghi kèm thay vì để bên đọc đoán. Nhìn một bản quét dựng ở 40 phiên rồi
      // kết luận "vành đai không chạy" là lỗi hoàn toàn có thể xảy ra nếu con số này không đi kèm.
      sessions: args.sessions,
      t: args.t,
    }, null, 2)}\n`);

    console.log(`✓ quét ${eras.length} kỷ × ${sweepHours.length} chặng → ${pngPath}`);
    console.log(`  hồ sơ hình học → ${geomPath}  (sweep-score.mjs đọc file này, không tự đoán)`);
    // ⚠️ NÓI THẲNG RA, VÌ CÁI TÊN CỜ `--theme` GÂY HIỂU NHẦM — và nó đã lừa được một phiên AI thật
    // (2026-08-13): tôi dựng cả hai theme rồi báo cáo "đã kiểm đủ 180 ô", trong khi phép so từng
    // điểm ảnh cho ra **0/421.200 điểm bên trong các ô khác nhau** giữa hai tấm; chỉ có KHUNG
    // ngoài đổi màu (99,98%). Lý do ở `palette3d.js:183` — `isDark = daylight ? nightByClock :
    // luminance(base) < 0.5`: **hễ có `daylight` thì ĐỒNG HỒ quyết, theme bị bỏ qua hoàn toàn.**
    // (Màu duy nhất còn ăn theo theme là `edge`, mà kiểu Townscaper không vẽ viền nên nó không ra
    // tới màn hình.) Đây là thiết kế CÓ CHỦ ĐÍCH — thành phố tả một nơi chốn ở một thời điểm thật,
    // còn theme là sở thích về giao diện — nhưng hệ quả thì chưa từng được viết ra ở đâu.
    if (sweepHours.some((h) => h !== null)) {
      console.log('  ℹ️  Có truyền giờ ⇒ ĐỒNG HỒ quyết bảng màu, `--theme` CHỈ đổi khung ngoài.');
      console.log('     Nội dung 3D của hai theme GIỐNG HỆT NHAU — đừng đếm bản quét này thành 2 lần.');
    }
    rmSync(WORK_DIR, { recursive: true, force: true });
    return;
  }

  for (const era of eras) {
    for (const hour of hours) {
      const options = { ...args, era, hour };
      const bundlePath = await buildBundle(options);

      const { server, port } = await serve({
        '/index.html': { type: 'text/html; charset=utf-8', body: pageHtml(options) },
        '/preview.js': { type: 'text/javascript; charset=utf-8', body: readFileSync(bundlePath) },
      });

      // Giờ nằm trong TÊN FILE: không có nó thì chụp 6 chặng trong ngày sẽ đè lên nhau và chỉ còn
      // chặng cuối, đúng lúc cần so sánh chúng cạnh nhau nhất.
      const hourTag = hour === null ? '' : `-h${String(hour).padStart(2, '0')}`;
      // ⚠️ MẶT NẠ PHẢI CÓ TÊN FILE RIÊNG. Không thì nó ghi đè lên chính tấm ảnh thật vừa chụp, và
      // lần đo sau sẽ so "ảnh thật" với một tấm đen trắng — đúng cái bẫy `--hour` đã cắn một lần
      // (mở nhầm file cũ rồi kết luận bản vá không ăn thua).
      const maskTag = args.mask ? `-mask-${args.mask.replace(/[^a-z0-9]+/gi, '_')}` : '';
      const shadowTag = args.noShadow ? '-noshadow' : '';
      // ⚠️ LẦN THỨ CHÍN CỦA ĐÚNG CÁI BẪY TRÊN — `--no-ao` (2026-08-24). Cặp ảnh trước/sau của AO
      // là thứ DUY NHẤT chứng minh được hiệu ứng ấy có tác dụng (nó không hiện ra ở lệnh vẽ hay
      // tam giác). Để hai vế dùng chung một tên file thì vế sau đè vế trước và phép so sẽ chấm một
      // tấm ảnh với chính nó — đúng bài học `MAI-SAU-ky9.png`, nơi hai con số nghiệm thu mái phải
      // vứt đi vì tấm "cận mái" trùng TỪNG BYTE với ảnh khung thường.
      const aoTag = args.noAo ? '-noao' : '';
      // ⚠️ CHẾ ĐỘ CẬN CẢNH CŨNG PHẢI CÓ TÊN RIÊNG, cùng lý do với mặt nạ ở trên — mà lý do ấy vừa
      // trả giá thật ngày 2026-08-18: hai con số nghiệm thu mái (4,5% / 16,5%) phải vứt đi vì tấm
      // ảnh mang tên "cận mái" hoá ra trùng TỪNG BYTE với ảnh khung thường. Một khung hình khác
      // hẳn mà dùng chung tên file là cách chắc chắn nhất để một phép đo đúng cho ra kết luận sai.
      const focusTag = args.focus > 0 ? `-focus${args.focus}` : '';
      // ⚠️ SỐ PHIÊN CŨNG PHẢI CÓ TÊN RIÊNG — VÀ ĐÂY LÀ LẦN THỨ TƯ CÙNG MỘT CÁI BẪY TRONG CHÍNH
      // FILE NÀY (giờ · mặt nạ · cận cảnh, nay tới số phiên). `--sessions` quyết mạng đường mở tới
      // đâu và có bao nhiêu cảnh vật, tức hai lượt chụp cùng kỷ ở 20 và 80 phiên là HAI THÀNH PHỐ
      // KHÁC HẲN — vậy mà chúng dùng chung một tên file và lượt sau lặng lẽ đè lượt trước. Bảng đo
      // "15 kỷ × 3 mốc" vì thế sẽ đọc CÙNG MỘT tấm ảnh ba lần rồi in ra ba con số giống hệt nhau
      // trông rất thuyết phục. Luôn gắn nhãn, kể cả ở giá trị mặc định: một cái tên chỉ đúng nhờ
      // "ai cũng biết mặc định là 40" là một cái tên sẽ nói dối vào ngày mặc định đổi.
      const sessTag = `-s${args.sessions}`;
      // ⚠️ LẦN THỨ NĂM VÀ THỨ SÁU CỦA ĐÚNG CÁI BẪY TRÊN — `--width` VÀ `--zoom` (2026-08-20).
      // Cả hai đổi KHUNG HÌNH mà không đổi tên file. Hậu quả đã xảy ra thật trong chính phiên
      // nghiệm thu Bước C: một lượt `--width 1500` để soi cận cảnh đã lặng lẽ ĐÈ LÊN bốn tấm ảnh
      // khung mặc định vừa dùng để chấm cổng phần trăm, nên `water-score.mjs` sau đó phải so một
      // ảnh 1500 với một mặt nạ 1100. Nó NÉM LỖI thay vì trả số — cái gác cỡ ảnh làm đúng việc —
      // nhưng nếu hai lượt tình cờ cùng bề ngang thì đã không có gì kêu, và bảng số sẽ là rác.
      // Chỉ gắn nhãn khi KHÁC mặc định, để mọi tên file cũ vẫn tra được (không viết lại lịch sử).
      const widthTag = args.width === 1100 ? '' : `-w${args.width}`;
      const zoomTag = args.zoom === 1 ? '' : `-z${String(args.zoom).replace('.', 'p')}`;
      // ⚠️ LẦN THỨ BẢY VÀ THỨ TÁM CỦA ĐÚNG CÁI BẪY TRÊN — `--t` VÀ `--lowdetail` (2026-08-22).
      // `--t` chọn THỜI ĐIỂM hoạt hoạ: chụp bốn thời điểm của một chu kỳ bước rồi để chúng đè lên
      // nhau thì còn lại đúng cái cuối, mà ba tấm cũ vẫn nằm sẵn trên đĩa từ lần chạy trước — một
      // công cụ im lặng đưa dữ liệu cũ còn tệ hơn không có công cụ. `--lowdetail` thì dựng một mô
      // hình người KHÁC HẲN (2 hộp, không khớp), tức đúng tấm ảnh dùng làm ĐỐI CHỨNG; để nó đè lên
      // ảnh thật là tự tay xoá vế đối chứng của mọi phép đo dáng đi.
      // Chỉ gắn khi KHÁC mặc định, để mọi tên file lịch sử vẫn tra được.
      const tTag = args.t === 17.5 ? '' : `-t${String(args.t).replace('.', 'p')}`;
      const lodTag = args.lowDetail ? '-lod' : '';
      // ⚠️ LẦN THỨ CHÍN CỦA ĐÚNG CÁI BẪY TRÊN — `--topdown` (Phase 20). Nó là một KHUNG HÌNH KHÁC
      // HẲN (nhìn thẳng xuống, không phải khung app), nên dùng chung tên file với ảnh thường là
      // cách chắc chắn nhất để một phép so trước/sau chấm hai thứ không so được với nhau.
      const topTag = args.topdown ? '-topdown' : '';
      const pngPath = resolve(OUT_DIR, `city-era${String(era).padStart(2, '0')}-${args.theme}${hourTag}${sessTag}${widthTag}${zoomTag}${tTag}${lodTag}${maskTag}${shadowTag}${aoTag}${focusTag}${topTag}.png`);
      let info = '';
      let hop = null;
      try {
        ({ info, hop } = await shoot(chrome, `http://127.0.0.1:${port}/index.html`, pngPath, options));
      } finally {
        server.close();
      }
      // ⚠️ HỒ SƠ HÌNH HỌC ĐI KÈM ẢNH ĐƠN — CÙNG LUẬT VỚI BẢN QUÉT.
      // LỊCH SỬ, ĐỪNG XOÁ: cho tới 2026-08-19 ảnh chụp RỘNG HƠN canvas (`#wrap { padding:16px }`
      // cộng dòng số liệu bên dưới), nên một tấm 1100×700 ra file 1134×780 — 12,9% ảnh không phải
      // khung hình. Phần thừa ấy nằm trong MẪU SỐ và làm mọi tỉ lệ thấp hơn sự thật một cách có hệ
      // thống (`TECH_DEBT #44`: trước khi tin một tỉ lệ, hỏi "mẫu số có lẫn thứ không thuộc câu
      // hỏi không?"). Bản vá đầu KHAI toạ độ canvas ra đây rồi cắt theo — VẪN SAI, vì khung nhìn
      // thật chỉ cao 693 nên canvas bị xén 23 dòng: con số khai (700) lớn hơn số dòng thật sự vẽ
      // ra (677). Một toạ độ KHAI không phải một toạ độ ĐO (`TECH_DEBT #49`).
      // ⇒ NAY ảnh được cắt ĐÚNG hộp bao canvas ngay lúc chụp (CDP `clip`, xem `shoot`), nên
      // `pad = 0` và ảnh CHÍNH LÀ khung hình. Hồ sơ này giữ lại để ghi ĐẦU VÀO đã sinh ra tấm ảnh
      // (kỷ, giờ, số phiên, mặt nạ, thu phóng) — bài học Phase 11: một con số nghiệm thu phải đi
      // kèm công cụ VÀ đầu vào đã đo ra nó.
      const geomPath = pngPath.replace(/\.png$/, '.geom.json');
      writeFileSync(geomPath, `${JSON.stringify({
        png: pngPath.split('/').pop(),
        pad: 0,
        canvasW: options.width,
        canvasH: options.height,
        // ⚠️ HỘP BAO ĐÃ ĐO, không phải hộp bao đã khai — đây chính là thứ phân biệt bản này với
        // bản đã sai. Nếu `doW`/`doH` khác `canvasW`/`canvasH` thì trang đã co giãn canvas và
        // MỌI kết luận về tỉ lệ khung hình phải xét lại.
        doX: hop?.x ?? null,
        doY: hop?.y ?? null,
        doW: hop?.width ?? null,
        doH: hop?.height ?? null,
        khungNhin: hop?.khungNhin ?? null,
        era,
        hour,
        sessions: args.sessions,
        mask: args.mask,
        focus: args.focus,
        topdown: args.topdown,
        zoom: args.zoom,
        theme: args.theme,
      }, null, 2)}\n`);
      console.log(`✓ kỷ ${era} · ${hour === null ? 'giờ trung tính' : `${hour} giờ`} → ${pngPath}`);
      // ⚠️ IN DÒNG SỐ LIỆU RA TERMINAL. Ảnh nay cắt đúng khung hình nên dòng chữ dưới ảnh không
      // còn nằm trong PNG — nhưng nó là chỗ DUY NHẤT Đàm đọc được số lệnh vẽ / số tam giác mà
      // không phải mở công cụ khác, nên nó chuyển sang đây chứ không biến mất.
      if (info) console.log(`  ${info}`);
    }
  }

  rmSync(WORK_DIR, { recursive: true, force: true });
}

/**
 * TỰ KIỂM PHÉP KIỂM — nhốt BỘ SỐ HỎNG CŨ của `TECH_DEBT #49`.
 *
 * ⚠️ Một ngưỡng không kèm đối chứng sẽ bị nới dần cho tiện (bài học Phase 9A). Ở đây "ngưỡng" là
 * chính cái cổng chặn, nên đối chứng phải dựng lại ĐÚNG con số đã hỏng: khung nhìn 1134×693 (cái
 * mà `--window-size=1134,780` thật sự cho ra trong hộp cát này) với canvas 1100×700 đặt ở y=16 —
 * ca ấy PHẢI bị bắt, và phải bắt đúng 23 dòng, không phải "bắt được là xong".
 */
function selftest() {
  const canvasCu = { x: 16, y: 16, width: 1100, height: 700 };

  // (1) BỘ SỐ HỎNG CŨ — 23 dòng bị xén. Đây là ca đã chạy thật suốt nhiều tháng.
  const cu = kiemKhungNhin(canvasCu, { width: 1134, height: 693 });
  if (cu.ok) throw new Error('selftest hỏng: bộ số cũ (khung nhìn 1134×693) LỌT LƯỚI');
  if (cu.thieuDoc !== 23) throw new Error(`selftest hỏng: phải thiếu ĐÚNG 23 dòng, ra ${cu.thieuDoc}`);
  if (cu.thieuNgang !== 0) throw new Error(`selftest hỏng: bộ số cũ không thiếu cột, ra ${cu.thieuNgang}`);

  // (2) BỘ SỐ MỚI — khung nhìn của `shoot()` hiện nay (width + 96, height + 240) phải ĐẠT.
  const moi = kiemKhungNhin(canvasCu, { width: 1100 + 96, height: 700 + 240 });
  if (!moi.ok) throw new Error('selftest hỏng: khung nhìn mới vẫn bị báo xén');

  // (3) ĐỐI CHỨNG TRỤC NGANG — phép kiểm phải chạm tới CẢ HAI chiều, không chỉ chiều đang sai.
  // Bản `--selftest` của `frame-fit.mjs` (Phase 7B) từng chỉ bảo chứng một trục và mù đúng trục
  // kia; ở đây chiều đang sai là DỌC nên chiều NGANG mới là chiều dễ quên.
  const hep = kiemKhungNhin(canvasCu, { width: 1115, height: 940 });
  if (hep.ok || hep.thieuNgang !== 1) throw new Error(`selftest hỏng: thiếu 1 cột mà không bắt được (${JSON.stringify(hep)})`);

  // (4) THÒ RA NỬA ĐIỂM ẢNH VẪN LÀ THÒ RA — `Math.round` sẽ tha, `Math.ceil` thì không.
  const nua = kiemKhungNhin({ x: 0, y: 0, width: 100.4, height: 100 }, { width: 100, height: 100 });
  if (nua.ok || nua.thieuNgang !== 1) throw new Error('selftest hỏng: thò ra 0,4 điểm ảnh bị tha');

  console.log('✓ selftest: cổng chặn bắt đúng ca 23 dòng bị xén của TECH_DEBT #49, và bắt cả hai chiều');
}

// ⚠️ CHẠY CLI CHỈ KHI ĐƯỢC GỌI THẲNG — để `cityPreviewSource.test.js` `import` được `kiemKhungNhin`
// mà không mở trình duyệt. Cùng khuôn với `png-probe.mjs` và `mask-count.mjs`.
if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href) {
  if (process.argv.includes('--selftest')) { selftest(); process.exit(0); }
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
