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
function entrySource({ era, level, theme, zoom = 1 }) {
  return `
import { computeCityLayout } from '${ROOT}/src/engine/cityLayout.js';
import { buildScenePalette } from '${ROOT}/src/engine/city3d/palette3d.js';
import { createCityScene } from '${ROOT}/src/components/city/render3d/sceneGraph.js';
import { createOrbit } from '${ROOT}/src/engine/city3d/orbit.js';
import { BLUEPRINT_CATALOG, ERA_METADATA } from '${ROOT}/src/engine/constants.js';
import { PerspectiveCamera, WebGLRenderer, PCFSoftShadowMap } from 'three';

const ERA = ${era};
const LEVEL = ${level};
const IS_DARK = ${theme === 'dark'};
const ZOOM = ${zoom};

const built = BLUEPRINT_CATALOG[ERA].map((bp) => bp.id);
const levels = Object.fromEntries(built.map((id) => [id, LEVEL]));
const layout = computeCityLayout({ built, levels, era: ERA, stats: { sessionCount: 40, streakLength: 9 } });

// Token màu lấy thẳng từ giá trị mặc định của hai theme trong src/index.css — trang này không có
// cây DOM của app nên không đọc được biến CSS thật.
const palette = buildScenePalette({
  tokens: IS_DARK
    ? { canvas2: '#1d1c1a', ink: '#f2efe6', line: '#33312d', accent: '#c96442' }
    : { canvas2: '#f4f2ec', ink: '#1f1e1d', line: '#e8e6de', accent: '#c96442' },
  eraColor: ERA_METADATA[ERA]?.accentColor,
});

const canvas = document.getElementById('stage');
const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(1);
renderer.setSize(canvas.width, canvas.height, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;

// ⚠️ Truyền ĐÚNG bộ số mà app truyền, không để mặc định: dân số suy ra từ đây, và một trang xem
// thử vẽ thành phố vắng hơn thật thì nó không còn kiểm chứng được thứ cần kiểm chứng.
const city = createCityScene({ layout, palette, stats: { sessionCount: 40, streakLength: 9 } });
city.sun.shadow.mapSize.setScalar(1024);

// Đẩy đồng hồ tới một thời điểm giữa chừng. Ở t = 0 mọi cư dân đều đứng ở đầu tuyến của mình —
// đúng chỗ dễ trùng nhau nhất, tức là ảnh chụp sẽ nói dối theo hướng lạc quan về chuyện họ có
// TRẢI ĐỀU trên phố hay không.
city.updateResidents(17.5);

const camera = new PerspectiveCamera(38, canvas.width / canvas.height, 0.5, layout.gridSize * 8);
const orbit = createOrbit({
  distance: layout.gridSize * 1.85 * ZOOM,
  minDistance: layout.gridSize * 0.95 * Math.min(1, ZOOM),
  maxDistance: layout.gridSize * 3.1,
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
</style></head>
<body><div id="wrap">
  <canvas id="stage" width="${width}" height="${height}"></canvas>
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

  for (const era of eras) {
    const options = { ...args, era };
    const bundlePath = await buildBundle(options);

    const { server, port } = await serve({
      '/index.html': { type: 'text/html; charset=utf-8', body: pageHtml(options) },
      '/preview.js': { type: 'text/javascript; charset=utf-8', body: readFileSync(bundlePath) },
    });

    const pngPath = resolve(OUT_DIR, `city-era${String(era).padStart(2, '0')}-${args.theme}.png`);
    try {
      await shoot(chrome, `http://127.0.0.1:${port}/index.html`, pngPath, options);
    } finally {
      server.close();
    }
    console.log(`✓ kỷ ${era} → ${pngPath}`);
  }

  rmSync(WORK_DIR, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
