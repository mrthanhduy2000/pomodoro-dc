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
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, '.city-preview');
const WORK_DIR = resolve(OUT_DIR, '.build');

/** Chromium do môi trường cài sẵn (Playwright). Không tự tải về. */
const CHROME_CANDIDATES = [
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
  process.env.CHROME_PATH,
].filter(Boolean);

function findChrome() {
  for (const path of CHROME_CANDIDATES) if (existsSync(path)) return path;
  return null;
}

function parseArgs(argv) {
  const args = {
    era: 7, level: 3, theme: 'light', all: false, width: 1100, height: 700,
    // Hệ số khoảng cách camera. 1 = đúng khoảng app dùng; nhỏ hơn = lại gần để soi chi tiết.
    // Cần thiết vì ở khoảng nhìn thật, một cư dân cao 0,2 ô chỉ chiếm vài điểm ảnh — không đủ để
    // phân biệt "hình người" với "vệt nhiễu".
    zoom: 1,
    // Giờ Việt Nam giả lập để soi từng chặng trong ngày (0–23). Rỗng = giữa trưa trung tính.
    // ⚠️ LÀ MẢNG, và đây là sửa một cái bẫy đã cắn thật: bản đầu để `hour` là MỘT số, nên
    // `--hour 6 --hour 12 --hour 22` chỉ vẽ mỗi giờ 22 rồi in đúng một dòng "✓" — mà hai file kia
    // vẫn nằm sẵn trên đĩa từ lần chạy trước. Tôi đã mở đúng hai file CŨ đó, tưởng là bản mới, và
    // kết luận rằng bản vá bầu trời không ăn thua. Công cụ soi lỗi mà im lặng đưa dữ liệu cũ thì
    // còn tệ hơn không có công cụ. Nay nhận nhiều giờ và vẽ đủ từng giờ một.
    hours: [],
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
    else if (key === '--hour') { args.hours.push(Number(value)); i += 1; }
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
function entrySource({ era, level, theme, zoom = 1, hour = null }) {
  return `
import { computeCityLayout } from '${ROOT}/src/engine/cityLayout.js';
import { buildScenePalette } from '${ROOT}/src/engine/city3d/palette3d.js';
import { deriveDaylight } from '${ROOT}/src/engine/city3d/daylight.js';
import { applyPaintedLook, createCityScene } from '${ROOT}/src/components/city/render3d/sceneGraph.js';
import { cityOrbitOptions, createOrbit } from '${ROOT}/src/engine/city3d/orbit.js';
import { BLUEPRINT_CATALOG, ERA_METADATA } from '${ROOT}/src/engine/constants.js';
import { PerspectiveCamera, WebGLRenderer, PCFSoftShadowMap } from 'three';

const ERA = ${era};
const LEVEL = ${level};
const IS_DARK = ${theme === 'dark'};
const ZOOM = ${zoom};
const HOUR = ${hour === null ? 'null' : hour};

const built = BLUEPRINT_CATALOG[ERA].map((bp) => bp.id);
const levels = Object.fromEntries(built.map((id) => [id, LEVEL]));
const layout = computeCityLayout({ built, levels, era: ERA, stats: { sessionCount: 40, streakLength: 9 } });

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
  daylight,
});

const canvas = document.getElementById('stage');
const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(1);
// Dùng CHUNG cấu hình nhìn với app — nếu không, trang xem thử sẽ vẽ ra một thành phố khác.
applyPaintedLook(renderer);
renderer.setSize(canvas.width, canvas.height, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;

// ⚠️ Truyền ĐÚNG bộ số mà app truyền, không để mặc định: dân số suy ra từ đây, và một trang xem
// thử vẽ thành phố vắng hơn thật thì nó không còn kiểm chứng được thứ cần kiểm chứng.
const city = createCityScene({ layout, palette, daylight, stats: { sessionCount: 40, streakLength: 9 } });
city.sun.shadow.mapSize.setScalar(1024);

// Đẩy đồng hồ tới một thời điểm giữa chừng. Ở t = 0 mọi cư dân đều đứng ở đầu tuyến của mình —
// đúng chỗ dễ trùng nhau nhất, tức là ảnh chụp sẽ nói dối theo hướng lạc quan về chuyện họ có
// TRẢI ĐỀU trên phố hay không.
city.updateResidents(17.5);

const camera = new PerspectiveCamera(38, canvas.width / canvas.height, 0.5, layout.gridSize * 8);
// Dùng CHUNG bộ tham số camera với app; ZOOM chỉ để soi chi tiết, mặc định 1 = đúng khung app.
const orbitOptions = cityOrbitOptions(layout.gridSize);
const orbit = createOrbit({
  ...orbitOptions,
  distance: orbitOptions.distance * ZOOM,
  minDistance: orbitOptions.minDistance * Math.min(1, ZOOM),
});
const eye = orbit.getPosition();
const target = orbit.getTarget();
camera.position.set(eye.x, eye.y, eye.z);
camera.lookAt(target.x, target.y, target.z);

renderer.render(city.scene, camera);

document.title = 'READY ' + JSON.stringify(city.stats);
document.getElementById('info').textContent =
  'Kỷ ' + ERA + ' — ' + (ERA_METADATA[ERA]?.label ?? '?') + ' · cấp ' + LEVEL
  + ' · ' + city.stats.drawCalls + ' lệnh vẽ · ' + city.stats.triangles.toLocaleString('vi-VN') + ' tam giác';
document.body.dataset.ready = '1';
`;
}

async function buildBundle(options) {
  mkdirSync(WORK_DIR, { recursive: true });
  const entryPath = resolve(WORK_DIR, 'entry.js');
  writeFileSync(entryPath, entrySource(options), 'utf8');

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

function pageHtml({ width, height, theme }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>đang dựng…</title>
<style>
  body { margin:0; background:${theme === 'dark' ? '#141311' : '#e9e6de'}; font-family: system-ui, sans-serif; }
  #wrap { padding:16px; }
  #info { margin-top:10px; font-size:13px; color:${theme === 'dark' ? '#cfc9bb' : '#4a463f'}; }
  /* ⚠️ PHẢI GIỐNG HỆT lớp vignette trong CityScene3D.jsx. Không có nó thì trang xem thử
     chụp ra một thành phố KHÁC với thành phố Đàm nhìn thấy — mà một công cụ mắt-soi nói dối
     còn tệ hơn không có công cụ nào. Đổi bên này phải đổi bên kia. */
  #frame { position:relative; display:inline-block; line-height:0; }
  #vignette {
    position:absolute; inset:0; pointer-events:none;
    background: ${theme === 'dark'
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

async function shoot(chrome, url, pngPath, { width, height }) {
  await run(chrome, [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    // ⚠️ Bắt buộc: không có card đồ hoạ thật trong hộp cát này. SwiftShader vẽ WebGL bằng CPU —
    // chậm hơn nhiều nhưng cho ra ĐÚNG hình ảnh mà GPU sẽ cho, đủ để soi mỹ thuật.
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    `--window-size=${width + 34},${height + 80}`,
    '--virtual-time-budget=12000',
    `--screenshot=${pngPath}`,
    url,
  ], { stdio: 'ignore' });   // Chromium trong hộp cát này chửi dbus không ngớt, không liên quan gì
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const chrome = findChrome();
  if (!chrome) {
    console.error('Không tìm thấy Chromium. Đặt CHROME_PATH trỏ tới file chrome rồi chạy lại.');
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const eras = args.all ? Array.from({ length: 15 }, (_, i) => i + 1) : [args.era];

  // Không truyền `--hour` ⇒ một lượt với giờ trung tính (`null`), y như trước.
  const hours = args.hours.length > 0 ? args.hours : [null];

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
      const pngPath = resolve(OUT_DIR, `city-era${String(era).padStart(2, '0')}-${args.theme}${hourTag}.png`);
      try {
        await shoot(chrome, `http://127.0.0.1:${port}/index.html`, pngPath, options);
      } finally {
        server.close();
      }
      console.log(`✓ kỷ ${era} · ${hour === null ? 'giờ trung tính' : `${hour} giờ`} → ${pngPath}`);
    }
  }

  rmSync(WORK_DIR, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
