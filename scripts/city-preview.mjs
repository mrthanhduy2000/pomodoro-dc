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
import { createServer, get as httpGet } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodePng, encodePng, ghepDoc } from './png-probe.mjs';

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
    else if (key === '--hour') { args.hours.push(Number(value)); i += 1; }
    else if (key === '--sweep') args.sweep = true;
    else if (key === '--cell') { args.cell = Number(value); i += 1; }
    else if (key === '--eras') { args.eraList = String(value).split(',').map(Number); i += 1; }
    else if (key === '--pending') { args.pending = Number(value); i += 1; }
    else if (key === '--sessions') { args.sessions = Number(value); i += 1; }
    else if (key === '--dpr') { args.dpr = Number(value); i += 1; }
    else if (key === '--bench') { args.bench = Number(value); i += 1; }
    else if (key === '--mask') { args.mask = String(value); i += 1; }
    else if (key === '--no-shadow') args.noShadow = true;
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
  mask = null, noShadow = false,
}) {
  return `
import { computeCityLayout } from '${ROOT}/src/engine/cityLayout.js';
import { buildScenePalette } from '${ROOT}/src/engine/city3d/palette3d.js';
import { deriveDaylight } from '${ROOT}/src/engine/city3d/daylight.js';
import { applyPaintedLook, createCityScene, MAX_PIXEL_RATIO } from '${ROOT}/src/components/city/render3d/sceneGraph.js';
import { CITY_CAMERA_FOV, cityOrbitOptions, createOrbit } from '${ROOT}/src/engine/city3d/orbit.js';
import { planCityFocus } from '${ROOT}/src/engine/city3d/cityFocus.js';
import { BLUEPRINT_CATALOG, ERA_METADATA } from '${ROOT}/src/engine/constants.js';
import { Color, MeshBasicMaterial, PerspectiveCamera, WebGLRenderer } from 'three';

const MASK = ${mask === null ? 'null' : JSON.stringify(mask)};
const NO_SHADOW = ${noShadow ? 'true' : 'false'};

const ERA = ${era};
const LEVEL = ${level};
const IS_DARK = ${theme === 'dark'};
const ZOOM = ${zoom};
const FOCUS = ${focus};
const HOUR = ${hour === null ? 'null' : hour};
const PENDING = ${pending};
const SESSIONS = ${sessions};
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
// splitCityMesh: CHỈ bật khi mặt nạ hỏi tên "buildings"/"props". Cả thành phố vốn gộp làm MỘT
// khối nên ở tầng scene không tách được nhà khỏi cây; cờ này bảo bên dựng tách ra thành hai khối
// mang tên. Nó thêm một lệnh vẽ, nên tuyệt đối không dùng cho ảnh thường và không dùng cho --bench.
const city = createCityScene({
  layout, palette, daylight, renderer, stats: { sessionCount: SESSIONS, streakLength: 9 },
  splitCityMesh: !!MASK && (MASK.includes('buildings') || MASK.includes('props')),
});

// Đẩy đồng hồ tới một thời điểm giữa chừng. Ở t = 0 mọi cư dân đều đứng ở đầu tuyến của mình —
// đúng chỗ dễ trùng nhau nhất, tức là ảnh chụp sẽ nói dối theo hướng lạc quan về chuyện họ có
// TRẢI ĐỀU trên phố hay không.
city.updateResidents(17.5);

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
  const names = MASK.split(',').map((s) => s.trim()).filter(Boolean);
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
function sweepSource({ level, theme, cell, combos, sessions = 40 }) {
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
    city.updateResidents(17.5);

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
  { width, height, bench = 0, mask = null, noShadow = false, gpu = false, focus = 0 }) {
  // Lúc đo hiệu năng thì PHẢI để stderr chảy ra, vì dòng [bench] đi bằng đường đó — và lúc dựng
  // mặt nạ cũng vậy, vì dòng [mask] là thứ DUY NHẤT chứng minh mặt nạ khớp đúng khối cần khớp.
  // ⚠️ Chế độ cận cảnh cũng phải mở đường này: dòng [focus] là thứ DUY NHẤT nói ra camera đã đứng
  // ở đâu. Ngoài mấy ca đó thì im, vì Chromium trong hộp cát này chửi dbus không ngớt.
  const choNoi = bench > 0 || !!mask || noShadow || focus > 0;

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
    const ghep = ghepDoc(dai);
    if (ghep.height !== hopNguyen.height) {
      throw new Error(`ghép xong cao ${ghep.height}, hộp bao cao ${hopNguyen.height}`);
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
    const combos = eras.flatMap((era) => sweepHours.map((hour) => ({ era, hour })));
    const options = { ...args, combos };
    const bundlePath = await buildBundle(options);

    const { server, port } = await serve({
      '/index.html': { type: 'text/html; charset=utf-8', body: sweepPageHtml(options) },
      '/preview.js': { type: 'text/javascript; charset=utf-8', body: readFileSync(bundlePath) },
    });

    const cellH = Math.round(args.cell * 0.62);
    const tag = `${eras[0]}-${eras[eras.length - 1]}`;
    const pngPath = resolve(OUT_DIR, `sweep-${args.theme}-ky${tag}.png`);
    try {
      const { info } = await shoot(chrome, `http://127.0.0.1:${port}/index.html`, pngPath, {
        width: sweepHours.length * args.cell + 64,
        // +40: chỗ cho hàng tiêu đề giờ và dòng chữ số liệu ở dưới cùng.
        height: eras.length * (cellH + 22) + 40,
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
      // ⚠️ CHẾ ĐỘ CẬN CẢNH CŨNG PHẢI CÓ TÊN RIÊNG, cùng lý do với mặt nạ ở trên — mà lý do ấy vừa
      // trả giá thật ngày 2026-08-18: hai con số nghiệm thu mái (4,5% / 16,5%) phải vứt đi vì tấm
      // ảnh mang tên "cận mái" hoá ra trùng TỪNG BYTE với ảnh khung thường. Một khung hình khác
      // hẳn mà dùng chung tên file là cách chắc chắn nhất để một phép đo đúng cho ra kết luận sai.
      const focusTag = args.focus > 0 ? `-focus${args.focus}` : '';
      const pngPath = resolve(OUT_DIR, `city-era${String(era).padStart(2, '0')}-${args.theme}${hourTag}${maskTag}${shadowTag}${focusTag}.png`);
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
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--selftest')) { selftest(); process.exit(0); }
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
