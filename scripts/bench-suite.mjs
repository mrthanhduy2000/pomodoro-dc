/**
 * bench-suite.mjs — BỘ ĐO HIỆU NĂNG cho 24 cảnh nghiệm thu (4 kỷ × 3 giờ × wide/close).
 *
 * ══ VÌ SAO CÔNG CỤ NÀY TỒN TẠI ══════════════════════════════════════════════════════════════
 * Hộp cát chạy phiên AI này **không có card đồ hoạ**: Chromium ở đây dựng WebGL bằng SwiftShader,
 * tức rasterise bằng CPU, ~2,4 GIÂY một khung hình. Mọi con số thời gian đo trong hộp cát vì thế
 * **không nói được gì về MacBook** — chênh nhau khoảng ba bậc độ lớn, và còn khác cả về HÌNH DẠNG
 * chi phí (CPU rasterise thì tốn theo điểm ảnh gần như tuyến tính, GPU thì không).
 *
 * Nên công cụ này có HAI lối chạy, dùng CHUNG một lõi đo (`benchCore.mjs`):
 *
 *   node scripts/bench-suite.mjs            → chạy ngầm TẠI ĐÂY. Mục đích DUY NHẤT là thu các con
 *                                             số ĐỘC LẬP THIẾT BỊ (tam giác, lệnh vẽ, chương trình
 *                                             shader, bộ nhớ hình học) — những thứ y hệt nhau trên
 *                                             mọi máy vì chúng là thuộc tính của CẢNH, không phải
 *                                             của GPU. Cột thời gian có in ra nhưng bị dán nhãn rõ.
 *
 *   node scripts/bench-suite.mjs --page     → ghi ra MỘT file HTML tự chứa. Đàm mở nó trên MacBook
 *                                             thật (bấm đúp), nó tự chạy 24 cảnh rồi hiện bảng +
 *                                             nút chép kết quả. Đây mới là chỗ ra FPS thật.
 *
 *   node scripts/bench-suite.mjs --selftest → chứng minh phép đo CÓ đo đúng thứ nó nói.
 *
 * ══ BA CÁI BẪY ĐÃ ĐƯỢC VÁ SẴN, ĐỪNG GỠ ══════════════════════════════════════════════════════
 * (a) ⚠️ **`gl.finish()` NÓI DỐI.** WebGL xếp lệnh không đồng bộ, nên bấm giờ quanh `render()` chỉ
 *     đo thời gian ĐẨY LỆNH vào hàng đợi. Dự án đã thử `finish()` và nó ra 0,40 ms/khung cho một
 *     khung 3200×1400 rasterise bằng CPU — tức ~11 tỉ điểm ảnh mỗi giây trên CPU, bất khả thi.
 *     ANGLE có đường biến `finish()` thành `flush()`. Thứ KHÔNG thể giả vờ là **đọc ngược điểm
 *     ảnh**: muốn trả về một byte thì mọi lệnh vẽ phải xong thật. Dùng ĐÚNG cách của
 *     `city-preview.mjs`, không phát minh cách thứ hai.
 * (b) ⚠️ **Khung hình đầu tiên luôn là nói dối theo hướng bi quan** — nó gánh việc biên dịch shader
 *     và tải hình học lên GPU. Phải chạy vài khung khởi động rồi VỨT ĐI, nếu không P95 sẽ chỉ phản
 *     ánh chi phí một-lần chứ không phải nhịp chạy thật.
 * (c) ⚠️ **Phải `city.dispose()` sau mỗi cảnh.** three KHÔNG tự giải phóng bộ nhớ GPU; không dọn
 *     thì 24 thành phố cùng nằm trong bộ nhớ và những cảnh cuối sẽ đo ra một cái máy đang ngộp.
 *
 * ══ PHÉP TỰ KIỂM (`--selftest`) ═════════════════════════════════════════════════════════════
 * Dự án có luật: *một phép tự kiểm chứng minh bộ lọc CÓ tác dụng, KHÔNG chứng minh nó có tác dụng
 * ĐÚNG*. Nên phép tự kiểm ở đây không hỏi "có đo được gì không" mà **vặn cần gạt tới mức vô lý rồi
 * đòi một hậu quả vô lý**: vẽ CÙNG một cảnh 4 lần trong một khung hình thì thời gian phải tăng
 * xấp xỉ 4 lần. Nếu không tăng, đồng hồ đang đo một thứ khác chứ không phải công việc dựng hình —
 * đúng cái bẫy đã cắn ở Phase 7A (`envMapIntensity` không nối vào đâu cả mà vẫn "đổi một chút").
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { danhSáchCảnh, dưĐịa, hệSốNặngThêm, nhãnGiờ, tómTắt, NGƯỠNG_MẪU_P95 } from './benchCore.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, '.city-preview');
const WORK_DIR = resolve(OUT_DIR, '.bench-work');

/** Bao nhiêu khung vứt đi trước khi bấm giờ (xem bẫy (b)). */
const KHỞI_ĐỘNG = 4;

function parseArgs(argv) {
  const a = { page: false, selftest: false, frames: null, width: 1280, height: 720, theme: 'light', tier: 'desktop' };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === '--page') a.page = true;
    else if (k === '--selftest') a.selftest = true;
    else if (k === '--frames') { a.frames = Number(v); i += 1; }
    else if (k === '--width') { a.width = Number(v); i += 1; }
    else if (k === '--height') { a.height = Number(v); i += 1; }
    else if (k === '--theme') { a.theme = v; i += 1; }
    else if (k === '--tier') { a.tier = v; i += 1; }
  }
  return a;
}

function run(cmd, args, opts = {}) {
  return new Promise((ok, fail) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('error', fail);
    p.on('exit', (code) => (code === 0 ? ok() : fail(new Error(`${cmd} thoát mã ${code}`))));
  });
}

function findChrome() {
  for (const p of [
    process.env.CHROME_PATH,
    '/opt/pw-browsers/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
  ]) {
    if (!p) continue;
    try { readFileSync(p); return p; } catch { /* thử cái kế */ }
  }
  return null;
}

/**
 * Mã chạy TRONG trình duyệt. Dùng chung cho cả hai lối chạy — khác nhau chỉ ở chỗ ĐỔ KẾT QUẢ ĐI
 * ĐÂU (console cho lối ngầm, bảng HTML cho lối Đàm chạy). Một luật một công thức.
 */
function entrySource({ frames, selftest, theme, width, height, stepped = false, tier = 'desktop' }) {
  // ⚠️ TOÀN BỘ phần dưới nằm BÊN TRONG một chuỗi template. MỘT dấu huyền-ngược (backtick) trong
  // chú thích cũng đủ cắt đôi chuỗi ấy và cả file thôi phân tích được. Đã cắn HAI lần khi viết
  // file này. Muốn nhắc tên hàm trong chú thích thì viết trần: city.dispose(), không bọc nháy.
  return `
import { computeCityLayout } from '${ROOT}/src/engine/cityLayout.js';
import { buildScenePalette } from '${ROOT}/src/engine/city3d/palette3d.js';
import { deriveDaylight } from '${ROOT}/src/engine/city3d/daylight.js';
import { applyPaintedLook, createCityScene, MAX_PIXEL_RATIO } from '${ROOT}/src/components/city/render3d/sceneGraph.js';
import { CITY_CAMERA_FOV, cityOrbitOptions, createOrbit } from '${ROOT}/src/engine/city3d/orbit.js';
import { BLUEPRINT_CATALOG, ERA_METADATA } from '${ROOT}/src/engine/constants.js';
import { danhSáchCảnh, tómTắt, dưĐịa, hệSốNặngThêm, nhãnGiờ } from '${ROOT}/scripts/benchCore.mjs';
import { PerspectiveCamera, WebGLRenderer } from 'three';

const FRAMES = ${frames};
const SELFTEST = ${selftest ? 'true' : 'false'};
const IS_DARK = ${theme === 'dark'};
const SESSIONS = 40;
// Hai tầng chất lượng THẬT SỰ tồn tại trong app, khoá theo bề ngang khung nhìn ở CityScene3D.jsx:
//   desktop → bản đồ bóng 2048, tối đa 3 đèn      mobile → 512, tối đa 2 đèn
// (Có một tầng thứ ba, lowDetail, nằm sẵn trong bộ dựng cảnh nhưng KHÔNG caller nào bật.)
const IS_MOBILE = ${tier === 'mobile'};

const canvas = document.getElementById('stage');
canvas.width = ${width};
canvas.height = ${height};
const VIEW_W = canvas.width;
const VIEW_H = canvas.height;

const renderer = new WebGLRenderer({ canvas, antialias: true });
// ⚠️ ĐÚNG TẦNG "Desktop High" CỦA APP: app dựng ở min(devicePixelRatio, MAX_PIXEL_RATIO).
// Trên MacBook Retina devicePixelRatio = 2 nên DPR = 2 — tức bộ đệm vẽ rộng GẤP ĐÔI khung CSS và
// số điểm ảnh phải tô GẤP BỐN. Đây là con số quan trọng nhất của cả bài đo mà rất dễ quên.
const DPR = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
renderer.setPixelRatio(DPR);
applyPaintedLook(renderer);
renderer.setSize(VIEW_W, VIEW_H, false);

const gl = renderer.getContext();
const probe = new Uint8Array(4);
// ⚠️ Xem bẫy (a) ở đầu file: đọc ngược điểm ảnh là thứ DUY NHẤT không giả vờ được.
const settle = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, probe);

// Tên GPU thật — bắt buộc phải in ra, vì một bảng số hiệu năng mà không biết máy nào tạo ra nó thì
// vô giá trị (và đây chính là cách phân biệt kết quả MacBook với kết quả SwiftShader).
function tênGPU() {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return gl.getParameter(gl.RENDERER) || 'không rõ';
    return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'không rõ';
  } catch { return 'không rõ'; }
}

const tokens = IS_DARK
  ? { canvas2: '#1d1c1a', ink: '#f2efe6', line: '#33312d', accent: '#c96442' }
  : { canvas2: '#f4f2ec', ink: '#1f1e1d', line: '#e8e6de', accent: '#c96442' };

const camera = new PerspectiveCamera(CITY_CAMERA_FOV, VIEW_W / VIEW_H, 0.5, 200);

/** Dựng một cảnh, đo, dọn. Trả về đủ số liệu cho một dòng bảng. */
function đoMộtCảnh({ era, hour, shot, zoom }, lặpMỗiKhung = 1) {
  const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  const levels = Object.fromEntries(built.map((id) => [id, 3]));
  const layout = computeCityLayout({
    built, levels, era, stats: { sessionCount: SESSIONS, streakLength: 9 },
  });
  const daylight = deriveDaylight(hour);
  const palette = buildScenePalette({
    tokens, eraColor: ERA_METADATA[era]?.accentColor, era, daylight,
  });
  const city = createCityScene({
    layout, palette, daylight, renderer, stats: { sessionCount: SESSIONS, streakLength: 9 },
    isMobile: IS_MOBILE, maxLamps: IS_MOBILE ? 2 : 3,
  });
  renderer.shadowMap.needsUpdate = true;
  city.updateResidents(17.5);

  const orbitOptions = cityOrbitOptions(layout.gridSize, layout.era);
  const orbit = createOrbit({
    ...orbitOptions,
    distance: orbitOptions.distance * zoom,
    minDistance: orbitOptions.minDistance * Math.min(1, zoom),
  });
  const eye = orbit.getPosition();
  const target = orbit.getTarget();
  camera.far = layout.gridSize * 8;
  camera.updateProjectionMatrix();
  camera.position.set(eye.x, eye.y, eye.z);
  camera.lookAt(target.x, target.y, target.z);

  // Khởi động rồi VỨT (bẫy (b)).
  for (let i = 0; i < ${KHỞI_ĐỘNG}; i += 1) { renderer.render(city.scene, camera); }
  settle();

  const ms = [];
  for (let i = 0; i < FRAMES; i += 1) {
    const t0 = performance.now();
    for (let r = 0; r < lặpMỗiKhung; r += 1) renderer.render(city.scene, camera);
    settle();
    ms.push(performance.now() - t0);
  }

  // ⚠️ ĐỌC renderer.info NGAY SAU khi dựng, TRƯỚC khi dispose. Sau dispose thì mọi số về 0 và bảng
  // sẽ toàn số 0 mà không có gì báo lỗi.
  const info = renderer.info;
  const kq = {
    era, hour, shot, zoom,
    ...tómTắt(ms),
    triangles: info.render.triangles,
    drawCalls: info.render.calls,
    programs: info.programs ? info.programs.length : null,
    geometries: info.memory.geometries,
    textures: info.memory.textures,
    shadowMap: city.sun ? city.sun.shadow.mapSize.width : null,
    dpr: DPR,
    tier: IS_MOBILE ? 'mobile' : 'desktop',
  };
  const sun = city.sun;
  city.dispose();
  // ⚠️ city.dispose() KHÔNG giải phóng BẢN ĐỒ BÓNG, và điều đó chỉ lộ ra khi một renderer sống
  // qua NHIỀU cảnh — đúng thứ bộ đo này làm (24 cảnh, một context).
  // Đo được: bật cập nhật bóng thì mỗi cảnh để lại +2 texture SỐNG SÓT qua dispose (1→3→5→7→9…);
  // tắt bóng thì đứng yên ở 1. Mỗi bản đồ bóng là 2048×2048 ⇒ chạy 24 cảnh mà không dọn sẽ để lại
  // gần 800 MB bộ nhớ đồ hoạ trên máy Đàm, đủ để chính bộ đo làm hỏng con số nó đang đo.
  // App KHÔNG dính lỗi này (mỗi cảnh một renderer riêng, runtime.dispose() gọi luôn
  // renderer.dispose() + forceContextLoss()), nên đây là bản vá PHÍA CÔNG CỤ — không đụng một
  // dòng nào của renderer, đúng yêu cầu "đo đúng bản 9b9cb66 không đổi".
  sun?.shadow?.map?.dispose?.();
  return kq;
}

const cảnh = danhSáchCảnh();
const kết = [];
const báo = document.getElementById('progress');

// ⚠️ HAI NHỊP CHẠY, MỘT THÂN VÒNG LẶP.
// Trang Đàm mở phải NHẢ luồng giao diện giữa các cảnh, nếu không anh nhìn thấy một trang trắng đơ
// suốt mấy chục giây và tưởng nó hỏng. Còn lối chạy ngầm thì phải chạy THẲNG một mạch: hộp cát
// chụp ảnh bằng cờ thời-gian-ảo, mà dự án đã trả giá cho đúng chỗ này — thời gian ảo làm
// ĐÓNG BĂNG rAF, nên một vòng lặp dựa vào rAF sẽ không bao giờ chạy hết và trang bị chụp lúc còn
// dở. Chạy đồng bộ thì không có hẹn giờ nào để mà đóng băng.
// Thân vòng lặp chỉ viết MỘT LẦN — khác nhau đúng ở câu hỏi "gọi lại ngay hay hẹn lại sau".
const NHẢ_LUỒNG = ${stepped ? 'true' : 'false'};
let idx = 0;
function bước() {
  if (idx >= cảnh.length) return xong();
  const c = cảnh[idx];
  báo.textContent = 'Đang đo ' + (idx + 1) + '/' + cảnh.length
    + ' — kỷ ' + c.era + ' · ' + nhãnGiờ(c.hour) + ' · ' + c.shot;
  kết.push(đoMộtCảnh(c));
  idx += 1;
  if (NHẢ_LUỒNG) setTimeout(bước, 0); else bước();
}

function xong() {
  let tự = null;
  if (SELFTEST) {
    // Vặn tới mức VÔ LÝ: vẽ cùng một cảnh 4 lần trong một khung hình.
    const c = cảnh[0];
    const một = đoMộtCảnh(c, 1);
    const bốn = đoMộtCảnh(c, 4);
    const tỉ = bốn.p50 / một.p50;
    tự = {
      một: một.p50, bốn: bốn.p50, tỉ,
      // Ngưỡng nới rộng có chủ ý (2,5 thay vì 4): đây là phép thử "cần gạt CÓ nối vào đâu không",
      // không phải phép đo tỉ lệ. Chặt quá thì nó đỏ vì nhiễu; lỏng quá thì một đồng hồ chết vẫn
      // qua. 2,5× thì một đồng hồ không đo việc dựng hình (tỉ ≈ 1) không thể lọt.
      đạt: tỉ >= 2.5,
    };
  }
  const gói = {
    gpu: tênGPU(),
    dpr: Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
    devicePixelRatio: window.devicePixelRatio || 1,
    khungCSS: VIEW_W + '×' + VIEW_H,
    điểmẢnhThật: Math.round(VIEW_W * (window.devicePixelRatio || 1)) + '×' + Math.round(VIEW_H * (window.devicePixelRatio || 1)),
    frames: FRAMES,
    ua: navigator.userAgent,
    bộNhớJS: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
    tựKiểm: tự,
    cảnh: kết,
  };
  renderer.dispose();

  // Lối chạy ngầm đọc dòng này; lối Đàm chạy đọc bảng bên dưới. Cả hai cùng một gói dữ liệu.
  // ⚠️ MÃ HOÁ BASE64 TRƯỚC KHI IN. Chromium bọc mọi thông điệp console trong dấu nháy kép rồi dán
  // thêm hậu tố ', source: http://… (dòng)'. In JSON thô ra đó thì phía Node phải vừa gỡ nháy vừa
  // gỡ hậu tố vừa gỡ ký tự thoát — ba việc dễ sai, và sai kiểu im lặng. Base64 không chứa ký tự
  // nào mà Chromium phải thoát, nên chuỗi ra đúng bằng chuỗi vào.
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(gói))));
  console.log('[bench-json] ' + b64);
  vẽBảng(gói);
  document.title = 'READY';
  document.body.dataset.ready = '1';
}

function vẽBảng(g) {
  const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '—');
  const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '—');
  const rows = g.cảnh.map((r) => {
    const dư = dưĐịa(r.p50, 60);
    const lần = hệSốNặngThêm(r.p50, 60);
    const quáTải = r.p50 > 1000 / 60;
    return '<tr class="' + (quáTải ? 'over' : '') + '">'
      + '<td>Kỷ ' + r.era + ' · ' + nhãnGiờ(r.hour) + ' · ' + r.shot + '</td>'
      + '<td class="n">' + f1(r.fps) + '</td>'
      + '<td class="n">' + f1(r.fpsXấu) + '</td>'
      + '<td class="n">' + f2(r.p50) + '</td>'
      + '<td class="n">' + f2(r.p95) + (r.p95ĐángTin ? '' : '<sup>?</sup>') + '</td>'
      + '<td class="n">' + r.triangles.toLocaleString('vi-VN') + '</td>'
      + '<td class="n">' + r.drawCalls + '</td>'
      + '<td class="n">' + r.dpr + '</td>'
      + '<td class="n">' + r.shadowMap + '</td>'
      + '<td class="n">' + (Number.isFinite(lần) ? f1(lần) + '×' : '—') + '</td>'
      + '</tr>';
  }).join('');

  const tựKiểm = g.tựKiểm
    ? '<p class="' + (g.tựKiểm.đạt ? 'ok' : 'bad') + '">Tự kiểm đồng hồ: vẽ 4 lần/khung ra '
      + f2(g.tựKiểm.tỉ) + '× thời gian (' + f2(g.tựKiểm.một) + ' → ' + f2(g.tựKiểm.bốn) + ' ms) — '
      + (g.tựKiểm.đạt ? 'đồng hồ CÓ đo việc dựng hình' : '⚠️ ĐỒNG HỒ KHÔNG ĐO VIỆC DỰNG HÌNH, mọi số dưới đây vô giá trị')
      + '</p>'
    : '';

  document.getElementById('progress').textContent = '';
  document.getElementById('out').innerHTML =
    '<h1>Kết quả đo hiệu năng Thành Phố 3D</h1>'
    + '<div class="meta"><b>Máy đồ hoạ:</b> ' + g.gpu + '<br>'
    + '<b>Độ nét (DPR):</b> ' + g.dpr + '× — màn hình báo ' + g.devicePixelRatio + '×<br>'
    + '<b>Khung hình:</b> ' + g.khungCSS + ' CSS<br>'
    + '<b>Số khung đo mỗi cảnh:</b> ' + g.frames
    + (g.frames >= ${NGƯỠNG_MẪU_P95} ? '' : ' <sup>?</sup> (dưới ' + ${NGƯỠNG_MẪU_P95} + ' thì P95 ≈ chậm nhất, không phải thống kê)')
    + (g.bộNhớJS ? '<br><b>Bộ nhớ JS:</b> ' + g.bộNhớJS + ' MB' : '')
    + '</div>'
    + tựKiểm
    + '<table><thead><tr>'
    + '<th>Cảnh</th><th>FPS<br>(P50)</th><th>FPS xấu<br>(P95)</th><th>ms<br>P50</th><th>ms<br>P95</th>'
    + '<th>Tam giác</th><th>Lệnh vẽ</th><th>DPR</th><th>Bóng</th><th>Còn nặng<br>thêm được</th>'
    + '</tr></thead><tbody>' + rows + '</tbody></table>'
    + '<p class="note">Dòng tô đỏ = quá ngân sách một khung ở 60 Hz (16,67 ms). '
    + 'Cột cuối = còn có thể nặng thêm bao nhiêu lần trước khi chạm 60 khung/giây.</p>'
    + '<button id="copy">Chép kết quả để gửi lại</button>'
    + '<textarea id="raw" readonly>' + JSON.stringify(g) + '</textarea>';

  const btn = document.getElementById('copy');
  btn.addEventListener('click', () => {
    const ta = document.getElementById('raw');
    ta.select();
    try { document.execCommand('copy'); btn.textContent = 'Đã chép ✓'; }
    catch { btn.textContent = 'Không chép được — hãy bôi đen ô bên dưới rồi Cmd+C'; }
  });
}

bước();
`;
}

const TRANG = (bundleInline) => `<!doctype html>
<meta charset="utf-8">
<title>Đang đo…</title>
<style>
  body { font: 14px/1.5 system-ui, -apple-system, sans-serif; margin: 24px; color: #1f1e1d;
         background: #f4f2ec; }
  canvas { position: fixed; left: -9999px; top: 0; }
  h1 { font-size: 20px; margin: 0 0 12px; }
  .meta { background: #fff; border: 1px solid #e8e6de; border-radius: 8px; padding: 12px;
          margin-bottom: 12px; }
  table { border-collapse: collapse; width: 100%; background: #fff; font-size: 13px; }
  th, td { border: 1px solid #e8e6de; padding: 5px 8px; text-align: left; }
  th { background: #efece4; font-weight: 600; }
  td.n { text-align: right; font-variant-numeric: tabular-nums; }
  tr.over td { background: #fdeceb; }
  .ok { color: #1a7f43; font-weight: 600; }
  .bad { color: #c0392b; font-weight: 700; }
  .note { color: #6b6862; font-size: 12px; }
  #progress { font-size: 16px; padding: 40px 0; }
  button { font: inherit; padding: 8px 14px; margin-top: 12px; cursor: pointer;
           border: 1px solid #c96442; background: #c96442; color: #fff; border-radius: 6px; }
  textarea { width: 100%; height: 90px; margin-top: 10px; font-family: ui-monospace, monospace;
             font-size: 11px; }
  sup { color: #c0392b; }
</style>
<canvas id="stage"></canvas>
<div id="progress">Đang khởi động bộ đo…</div>
<div id="out"></div>
${bundleInline
    ? `<script type="module">\n${bundleInline}\n</script>`
    : '<script type="module" src="/bench.js"></script>'}
`;

async function buildBundle(options) {
  mkdirSync(WORK_DIR, { recursive: true });
  const entryPath = resolve(WORK_DIR, 'entry.js');
  writeFileSync(entryPath, entrySource(options), 'utf8');

  const configPath = resolve(WORK_DIR, 'vite.bench.config.mjs');
  writeFileSync(configPath, `
import { defineConfig } from 'vite';
export default defineConfig({
  root: ${JSON.stringify(ROOT)},
  logLevel: 'error',
  build: {
    outDir: ${JSON.stringify(resolve(WORK_DIR, 'dist'))},
    emptyOutDir: true,
    minify: false,
    lib: { entry: ${JSON.stringify(entryPath)}, formats: ['es'], fileName: 'bench' },
  },
});
`, 'utf8');

  await run('node', ['node_modules/vite/bin/vite.js', 'build', '--config', configPath], { cwd: ROOT });
  return resolve(WORK_DIR, 'dist/bench.js');
}

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

function bảngChữ(g) {
  const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '—');
  const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '—');
  const dòng = [];
  dòng.push('| Cảnh | FPS P50 | FPS P95 | ms P50 | ms P95 | Tam giác | Lệnh vẽ | DPR | Bóng | Nặng thêm |');
  dòng.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const r of g.cảnh) {
    dòng.push(`| Kỷ ${r.era} · ${nhãnGiờ(r.hour)} · ${r.shot} | ${f1(r.fps)} | ${f1(r.fpsXấu)}`
      + ` | ${f2(r.p50)} | ${f2(r.p95)}${r.p95ĐángTin ? '' : '?'} | ${r.triangles.toLocaleString('vi-VN')}`
      + ` | ${r.drawCalls} | ${r.dpr} | ${r.shadowMap} | ${f1(hệSốNặngThêm(r.p50, 60))}× |`);
  }
  return dòng.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(OUT_DIR, { recursive: true });

  // ⚠️ Số khung mặc định KHÁC NHAU giữa hai lối chạy, và đó là chủ ý: trên MacBook một khung ~2 ms
  // nên 90 khung là 0,2 giây; trong hộp cát một khung ~2,4 GIÂY nên 90 khung là 3,6 phút MỘT CẢNH.
  const frames = args.frames ?? (args.page ? 90 : 5);
  const options = { ...args, frames, stepped: args.page };

  if (args.page) {
    const bundlePath = await buildBundle(options);
    const bundle = readFileSync(bundlePath, 'utf8');
    const out = resolve(OUT_DIR, 'benchmark.html');
    writeFileSync(out, TRANG(bundle), 'utf8');
    const mb = (Buffer.byteLength(TRANG(bundle)) / 1048576).toFixed(1);
    console.log(`✓ Đã ghi trang đo tự chứa: ${out}  (${mb} MB, ${frames} khung/cảnh)`);
    console.log('  Gửi file này cho Đàm — bấm đúp để mở bằng trình duyệt trên MacBook.');
    return;
  }

  const chrome = findChrome();
  if (!chrome) { console.error('Không tìm thấy Chromium. Đặt CHROME_PATH.'); process.exit(1); }

  const bundlePath = await buildBundle(options);
  const { server, port } = await serve({
    '/index.html': { type: 'text/html; charset=utf-8', body: TRANG(null) },
    '/bench.js': { type: 'text/javascript; charset=utf-8', body: readFileSync(bundlePath) },
  });

  let ra = '';
  await new Promise((ok, fail) => {
    const p = spawn(chrome, [
      '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
      '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      '--hide-scrollbars', '--enable-logging=stderr', '--log-level=0',
      // Thời gian ảo chỉ tiến khi trang RỖI chờ hẹn giờ; toàn bộ việc đo ở lối chạy ngầm là đồng
      // bộ nên nó không tiêu một mili-giây ảo nào. Cờ này vì thế chỉ đóng vai trò trần an toàn để
      // Chromium không treo vĩnh viễn nếu bộ đo ném lỗi giữa chừng.
      `--window-size=${args.width + 34},${args.height + 120}`,
      `--screenshot=${resolve(WORK_DIR, 'shot.png')}`,
      '--virtual-time-budget=900000',
      `http://127.0.0.1:${port}/`,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    p.stdout.on('data', (b) => { ra += b.toString(); });
    p.stderr.on('data', (b) => { ra += b.toString(); });
    p.on('error', fail);
    p.on('exit', () => ok());
  });
  server.close();

  const khớp = ra.match(/\[bench-json\] ([A-Za-z0-9+/=]+)/);
  if (!khớp) {
    console.error('Không nhận được kết quả. Đầu ra thô:\n' + ra.slice(-3000));
    process.exit(1);
  }
  const g = JSON.parse(Buffer.from(khớp[1], 'base64').toString('utf8'));

  console.log('');
  console.log(`Máy đồ hoạ: ${g.gpu}`);
  console.log(`DPR ${g.dpr}× · khung ${g.khungCSS} · ${g.frames} khung/cảnh`);
  if (g.tựKiểm) {
    console.log(`Tự kiểm đồng hồ: vẽ 4 lần/khung ra ${g.tựKiểm.tỉ.toFixed(2)}× thời gian — `
      + (g.tựKiểm.đạt ? '✓ đồng hồ CÓ đo việc dựng hình' : '✗ ĐỒNG HỒ KHÔNG ĐO VIỆC DỰNG HÌNH'));
  }
  console.log('');
  console.log(bảngChữ(g));
  console.log('');

  const json = resolve(OUT_DIR, 'benchmark-result.json');
  writeFileSync(json, JSON.stringify(g, null, 2), 'utf8');
  console.log(`(đã ghi ${json})`);
}

const CHẠY_TRỰC_TIẾP = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (CHẠY_TRỰC_TIẾP) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

export { bảngChữ, entrySource };
