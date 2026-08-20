/**
 * ĐẾM TAM GIÁC + LỆNH VẼ THEO TỪNG KHỐI CÓ TÊN — không cần Chromium.
 *
 * ⚠️ VÌ SAO TỒN TẠI. Bảng hình học ở `PERFORMANCE.md` xưa nay đo bằng Chromium
 * (`city-preview.mjs --bench`), mất ~15 giây mỗi kỷ và chỉ cho MỘT con số gộp cho cả thành phố.
 * Khi một phase làm con số ấy nhúc nhích, câu hỏi kế tiếp luôn là *"nhúc nhích ở KHỐI nào?"* — và
 * bảng gộp không trả lời được. Công cụ này dựng **đúng cảnh mã sản phẩm dựng** (`createCityScene`,
 * chạy thẳng trong Node — nhà máy hình học không cần GPU) rồi duyệt scene graph theo đúng luật
 * `WebGLRenderer` cộng vào `info.render`.
 *
 * ⚠️ NÓ KHÔNG CHÉP LẠI MỘT CÔNG THỨC NÀO. Đây là điểm quan trọng: mọi bản "đếm bằng tay" trước đây
 * đều phải chép lại luật đặt khối của `sceneGraph.js` (bẫy *"một luật hai công thức"* đã cắn nhiều
 * lần trong dự án). Ở đây scene graph là **thứ thật**, nên nó không thể lạc hậu.
 *
 * **ĐÃ ĐỐI CHIẾU CHÉO với Chromium** (2026-08-20, kỷ 8 và 9, `--hour 12 --bench 1 --no-shadow`):
 * tổng khớp **từng đơn vị** ở cả hai kỷ. Đối chiếu ấy là phép nghiệm thu của công cụ này — nếu
 * ngày nào hai bên lệch nhau thì **chỗ lệch chính là chỗ hỏng**, đừng chọn bên nghe hợp ý.
 *
 * Dùng: node --import ./scripts/register-esm-loader.mjs scripts/scene-tri.mjs [--era N] [--hour H]
 *                                                        [--sessions S] [--level L]
 * Mặc định trùng `city-preview.mjs`: giờ 12 · 40 phiên · cấp 3 · chuỗi 9 — ĐỔI MẶC ĐỊNH LÀ ĐỔI
 * BẢNG SỐ, vì mạng đường mở dần theo số phiên (bài học "hai con số cùng tên `sessionCount`").
 */
import { createCityScene } from '../src/components/city/render3d/sceneGraph.js';
import { computeCityLayout } from '../src/engine/cityLayout.js';
import { buildScenePalette } from '../src/engine/city3d/palette3d.js';
import { deriveDaylight } from '../src/engine/city3d/daylight.js';
import { BLUEPRINT_CATALOG, ERA_METADATA } from '../src/engine/constants.js';

const TOKENS = { canvas2: '#f4f2ec', ink: '#1f1e1d', line: '#e8e6de', accent: '#c96442' };

function docCo() {
  const a = { era: null, hour: 12, sessions: 40, level: 3 };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const [k, v] = [argv[i], argv[i + 1]];
    if (k === '--era') { a.era = Number(v); i += 1; }
    else if (k === '--hour') { a.hour = Number(v); i += 1; }
    else if (k === '--sessions') { a.sessions = Number(v); i += 1; }
    else if (k === '--level') { a.level = Number(v); i += 1; }
  }
  return a;
}

/** Duyệt scene graph theo đúng luật `WebGLRenderer`: mỗi NHÓM vật liệu là một lệnh vẽ; số tam giác
 *  của một `InstancedMesh` nhân với `count`. */
function demCanh(scene) {
  const khoi = [];
  scene.traverse((o) => {
    if (!o.isMesh || o.visible === false || !o.geometry) return;
    const g = o.geometry;
    const soChiSo = g.index ? g.index.count : (g.attributes.position?.count ?? 0);
    const lan = o.isInstancedMesh ? o.count : 1;
    khoi.push({
      ten: o.name || '(không tên)',
      lop: o.userData?.sceneLayer ?? 'city',
      tri: Math.floor(soChiSo / 3) * lan,
      // Luật `WebGLRenderer`: nhóm vật liệu chỉ thành lệnh vẽ riêng khi `material` là MẢNG.
      lenh: (Array.isArray(o.material) && g.groups?.length) ? g.groups.length : 1,
    });
  });
  return khoi;
}

function motKy(era, { hour, sessions, level }) {
  const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  const levels = Object.fromEntries(built.map((id) => [id, level]));
  const stats = { sessionCount: sessions, streakLength: 9 };
  const layout = computeCityLayout({ built, levels, era, stats });
  const daylight = deriveDaylight(hour);
  const palette = buildScenePalette({
    tokens: TOKENS, eraColor: ERA_METADATA[era]?.accentColor, era, daylight,
  });
  const city = createCityScene({ layout, palette, daylight, stats });
  const khoi = demCanh(city.scene ?? city);
  const nen = khoi.filter((k) => k.lop === 'backdrop');
  const tp = khoi.filter((k) => k.lop !== 'backdrop');
  const cong = (rows, f) => rows.reduce((s, r) => s + f(r), 0);
  return {
    era, khoi,
    triTP: cong(tp, (r) => r.tri), lenhTP: cong(tp, (r) => r.lenh),
    triNen: cong(nen, (r) => r.tri), lenhNen: cong(nen, (r) => r.lenh),
  };
}

const co = docCo();
const eras = co.era ? [co.era] : Array.from({ length: 15 }, (_, i) => i + 1);
console.log(`giờ ${co.hour} · ${co.sessions} phiên · cấp ${co.level} · chuỗi 9`);
if (eras.length === 1) {
  const r = motKy(eras[0], co);
  for (const k of [...r.khoi].sort((a, b) => b.tri - a.tri)) {
    console.log(`${String(k.tri).padStart(8)}  ${String(k.lenh).padStart(2)} lệnh  ${k.lop.padEnd(9)} ${k.ten}`);
  }
  console.log(`thành phố: ${r.triTP} tam giác / ${r.lenhTP} lệnh · nền: ${r.triNen} / ${r.lenhNen}`);
} else {
  console.log('kỷ\ttam giác TP\tlệnh vẽ TP\ttam giác nền');
  let tong = 0;
  for (const era of eras) {
    const r = motKy(era, co);
    tong += r.triTP;
    console.log(`${era}\t${r.triTP}\t${r.lenhTP}\t${r.triNen}`);
  }
  console.log(`TỔNG tam giác thành phố 15 kỷ: ${tong}`);
}
