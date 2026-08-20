/**
 * water-view.mjs — NƯỚC CHIẾM BAO NHIÊU PHẦN KHUNG HÌNH, VÀ TRẦN CỦA NÓ LÀ BAO NHIÊU.
 *
 * Sinh ra để trả lời đúng MỘT câu hỏi mà Đàm ra làm cổng nghiệm thu của VIỆC 2 Bước B, và là câu
 * hỏi không một bài test đơn vị nào chạm tới được:
 *
 *   *"Kỷ có biển phải đọc ra là **thành phố cảng**, không phải thành phố cạnh một vũng xanh."*
 *
 * ⚠️ VÌ SAO KHÔNG ĐẾM ĐIỂM ẢNH TRÊN ẢNH CHỤP. Đếm trên ảnh thì phải chờ Chromium (~40 giây/kỷ), và
 * quan trọng hơn: nó chỉ nói *"hôm nay thấy bao nhiêu"*, không nói *"nhiều nhất có thể là bao nhiêu"*.
 * Mà bài học lớn nhất của §2-C là **đo TRẦN của một cơ chế TRƯỚC khi tiêu ngân sách cho nó** — một
 * cơ chế sắp xếp trong một cái hộp gần đầy là mã chết. Ở đây "trần" = xoay camera sang phía đối
 * diện rồi đo lại; hiệu số giữa hai con số nói thẳng rằng vấn đề nằm ở HÌNH NƯỚC hay ở GÓC CAMERA.
 *
 * Cách đo: bắn tia từ ĐÚNG camera mà app dùng (`cityOrbitOptions` + `DEFAULT_PITCH` +
 * `CITY_CAMERA_FOV`, tỉ lệ khung 1100×700), mỗi tia hỏi *"chạm mặt nước trước hay chạm mặt đất
 * trước?"*. Không có một bộ lọc màu nào — `TECH_DEBT #22` đã trả giá ba phase cho việc ĐOÁN xem
 * điểm ảnh nào là cái gì.
 *
 * ⚠️ PHÉP ĐO NÀY MIỄN NHIỄM VỚI CÁI BẪY ĐÃ CẮN `frame-fit.mjs` (vector `right` viết ngược dấu, số
 * đúng mà NHÃN mép sai). Lý do: tập tia `fwd + right·sx + up·sy` quét sx, sy trên hai khoảng ĐỐI
 * XỨNG, nên đảo dấu `right` cho ra ĐÚNG CÙNG MỘT TẬP TIA. Nó chỉ ảnh hưởng nếu ta báo cáo "nước
 * nằm ở mép trái hay mép phải" — và đó chính là lý do công cụ này KHÔNG báo cáo điều đó.
 *
 * Dùng:  node scripts/water-view.mjs                 # cả 15 kỷ
 *        node scripts/water-view.mjs --eras 12,14
 *        node scripts/water-view.mjs --selftest
 */

import { buildTerrain, WATER_SURFACE_Y } from '../src/engine/city3d/terrain.js';
import { buildHorizon } from '../src/engine/city3d/horizon.js';
import { buildWaterSurface } from '../src/components/city/render3d/terrainMesh.js';
import {
  CITY_CAMERA_FOV, DEFAULT_PITCH, DEFAULT_YAW, cityOrbitOptions, orbitPosition,
} from '../src/engine/city3d/orbit.js';
import { getSetting, SIDE_YAW, worldYaw, normalizeYaw } from '../src/engine/city3d/settingStyle.js';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const GRID = 12;
const HALF = (GRID - 1) / 2;
/** Lưới tia. 220×140 giữ đúng tỉ lệ 1100×700 và chạy hết ~1 giây mỗi kỷ. */
const RAYS_X = 220;
const RAYS_Y = 140;
const ASPECT = 1100 / 700;
/** Bước hành quân tìm mặt đất. 0,08 nhỏ hơn mọi chi tiết địa hình có thật (ô nhỏ nhất là 1/3). */
const MARCH = 0.08;
const MARCH_MAX = 90;
/** Ra khỏi đây thì chắc chắn không còn gì để chạm — rặng núi xa nhất ở 51,1. */
const WORLD_EDGE = 52;

const chuan = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
const tru = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cheo = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Hộp bao tấm nước, đọc THẲNG từ hình học đã dựng — không dựng lại bằng công thức thứ hai. */
function hopBaoNuoc(water) {
  const p = water.geometry.getAttribute('position').array;
  let x0 = Infinity; let x1 = -Infinity; let z0 = Infinity; let z1 = -Infinity;
  for (let i = 0; i < p.length; i += 3) {
    if (p[i] < x0) x0 = p[i];
    if (p[i] > x1) x1 = p[i];
    if (p[i + 2] < z0) z0 = p[i + 2];
    if (p[i + 2] > z1) z1 = p[i + 2];
  }
  return { x0, x1, z0, z1 };
}

/**
 * Tỉ lệ khung hình là NƯỚC, nhìn từ một góc `yaw` cho trước.
 * @returns {{nuoc:number, dat:number, khong:number}} tỉ lệ 0..1
 */
/**
 * Nhớ lại thế giới đã dựng cho mỗi (kỷ, cỡ lưới).
 *
 * ⚠️ NÓI CHO ĐÚNG: chỗ này KHÔNG phải thứ làm bài test rẻ đi — thứ đó là cổng `LA_FILE_CHINH` ở
 * cuối file (xem chú thích ở đó). Memo này được viết trong lúc tôi đang tối ưu NHẦM, và nó ở lại
 * vì tự nó vẫn đúng: cùng một (kỷ, cỡ lưới) thì ba thứ ấy là hàm THUẦN, nên dựng lại nhiều lần là
 * làm thừa. Nhưng nó chỉ tiết kiệm được vài trăm mili-giây, không phải hai phút — đừng đọc chú
 * thích này thành "đây là lý do bài test nhanh".
 */
const KHO_THE_GIOI = new Map();
function theGioi(era, gridSize) {
  const khoa = `${era}|${gridSize}`;
  if (!KHO_THE_GIOI.has(khoa)) {
    const terrain = buildTerrain({ era, gridSize });
    const horizon = buildHorizon({ era, gridSize });
    const water = buildWaterSurface({ setting: terrain.setting, gridSize, horizon });
    KHO_THE_GIOI.set(khoa, { terrain, horizon, bao: water ? hopBaoNuoc(water) : null });
  }
  return KHO_THE_GIOI.get(khoa);
}

export function tiLeNuocTrongKhung({ era, yaw = DEFAULT_YAW, gridSize = GRID, tia = RAYS_X }) {
  // Lưới tia thưa hơn cho bài test (`npm test` đã 400 giây, đừng cộng thêm 2 phút nữa). Giữ ĐÚNG
  // tỉ lệ khung để hai độ mịn còn so được với nhau — đổi tỉ lệ là đổi đại lượng đang đo.
  const raysX = Math.max(20, Math.round(tia));
  const raysY = Math.max(13, Math.round((tia * RAYS_Y) / RAYS_X));
  const half = (gridSize - 1) / 2;
  const { terrain, horizon, bao } = theGioi(era, gridSize);

  const opts = cityOrbitOptions(gridSize, era);
  const eye = orbitPosition({ yaw, pitch: DEFAULT_PITCH, distance: opts.distance, target: opts.target });
  const E = [eye.x, eye.y, eye.z];
  const T = [opts.target.x, opts.target.y, opts.target.z];
  const fwd = chuan(tru(T, E));
  const right = chuan(cheo(fwd, [0, 1, 0]));
  const up = cheo(right, fwd);
  const tanY = Math.tan((CITY_CAMERA_FOV * Math.PI) / 360);
  const tanX = tanY * ASPECT;

  const caoDoTai = (x, z) => {
    const u = x + half;
    const v = z + half;
    const trong = u >= -0.5 && u <= gridSize - 0.5 && v >= -0.5 && v <= gridSize - 0.5;
    return trong ? terrain.surfaceHeightAt(u, v) : horizon.heightAt(x, z);
  };

  let nuoc = 0; let dat = 0; let khong = 0;
  for (let py = 0; py < raysY; py += 1) {
    for (let px = 0; px < raysX; px += 1) {
      const sx = (((px + 0.5) / raysX) * 2 - 1) * tanX;
      const sy = (1 - ((py + 0.5) / raysY) * 2) * tanY;
      const d = chuan([
        fwd[0] + right[0] * sx + up[0] * sy,
        fwd[1] + right[1] * sx + up[1] * sy,
        fwd[2] + right[2] * sx + up[2] * sy,
      ]);

      let tNuoc = Infinity;
      if (bao && d[1] < -1e-9) {
        const t = (WATER_SURFACE_Y - E[1]) / d[1];
        if (t > 0) {
          const x = E[0] + d[0] * t;
          const z = E[2] + d[2] * t;
          if (x >= bao.x0 && x <= bao.x1 && z >= bao.z0 && z <= bao.z1) tNuoc = t;
        }
      }

      let tDat = Infinity;
      for (let t = 0.15; t < MARCH_MAX; t += MARCH) {
        const x = E[0] + d[0] * t;
        const y = E[1] + d[1] * t;
        const z = E[2] + d[2] * t;
        if (Math.abs(x) > WORLD_EDGE || Math.abs(z) > WORLD_EDGE) break;
        if (y <= caoDoTai(x, z)) { tDat = t; break; }
      }

      if (tNuoc < tDat) nuoc += 1;
      else if (tDat < Infinity) dat += 1;
      else khong += 1;
    }
  }
  const tong = raysX * raysY;
  return { nuoc: nuoc / tong, dat: dat / tong, khong: khong / tong };
}

/**
 * Góc đứng ĐỐI DIỆN bờ nước — tức trần lý thuyết của "nhìn thấy nước bao nhiêu".
 * Camera ở `yaw` đứng tại `(sin yaw, cos yaw)`, nên muốn NHÌN về phía nam (z lớn) thì phải đứng ở
 * phía bắc (z nhỏ), v.v. Đây là một QUAN HỆ, không phải một bảng góc chọn tay.
 *
 * ⚠️ **PHẢI CỘNG `worldYaw`, KHÔNG ĐƯỢC ĐỌC THẲNG `style.side`** (bài học 2026-08-20, và công cụ
 * này suýt nói dối lần đầu tiên trong đời nó). `side` là hướng bờ theo LỊCH SỬ; hướng bờ trên MÀN
 * HÌNH là `side + worldYaw`. Bản đầu của hàm `chay` đọc thẳng `GOC_DOI_DIEN[style.side]` và in ra
 * *"kỷ 14: mặc định 23,75% · TRẦN 11,87%"* — một cái trần THẤP HƠN giá trị thật, tức một câu vô
 * nghĩa được trình bày rất chỉnh tề. Cùng họ với `TECH_DEBT #43`: một cột số đúng cho một phiên bản
 * mã đã không còn tồn tại.
 */
const NGUOC = Math.PI;

/** Góc camera phải đứng để nhìn thẳng vào bờ nước của kỷ này, ĐÃ tính `worldYaw`. */
export function gocDoiDien(era) {
  const mat = SIDE_YAW[getSetting(era).side];
  if (mat === undefined) return DEFAULT_YAW;
  return normalizeYaw(mat + worldYaw(era) + NGUOC);
}

function chay(eras) {
  console.log('kỷ · loại nước · bờ  |  MẶC ĐỊNH (45°)  |  TRẦN (đứng đối diện)  |  gấp');
  for (const era of eras) {
    const st = getSetting(era);
    const macDinh = tiLeNuocTrongKhung({ era }).nuoc;
    const yawDoi = gocDoiDien(era);
    const tran = tiLeNuocTrongKhung({ era, yaw: yawDoi }).nuoc;
    const gap = macDinh > 0 ? (tran / macDinh).toFixed(1) : (tran > 0 ? '∞' : '—');
    console.log(
      `${String(era).padStart(2)} · ${String(st.water).padEnd(8)} · ${String(st.side).padEnd(4)} | ` +
      `${(macDinh * 100).toFixed(2).padStart(7)}%        | ${(tran * 100).toFixed(2).padStart(7)}%` +
      `              | ${String(gap).padStart(5)}×`,
    );
  }
}

function selftest() {
  let loi = 0;
  const bao = (dat, cau) => { console.log(`${dat ? '✓' : '✗'} ${cau}`); if (!dat) loi += 1; };

  // (1) Kỷ KHÔ phải ra đúng 0 ở MỌI góc — nếu không thì phép đo đang đếm thứ khác gọi là nước.
  const kho = [0, Math.PI / 2, Math.PI, -Math.PI / 2]
    .map((yaw) => tiLeNuocTrongKhung({ era: 1, yaw }).nuoc);
  bao(kho.every((v) => v === 0), `kỷ khô ra 0 ở cả 4 góc (đo được: ${kho.join(', ')})`);

  // (2) ĐỐI CHỨNG — phải THẤY được nước khi đứng đúng chỗ. Không có vế này thì (1) vẫn xanh kể cả
  //     khi phép đo hỏng hoàn toàn và không bao giờ đếm được một tia nước nào.
  const bien = tiLeNuocTrongKhung({ era: 14, yaw: gocDoiDien(14) }).nuoc;
  bao(bien > 0.05, `kỷ 14 nhìn từ phía đối diện thấy nước rõ (đo được ${(bien * 100).toFixed(2)}%)`);

  // (3) Tia GIỮA khung phải đi trúng điểm ngắm — bảo chứng cả ba vector cơ sở cùng lúc. Đây là chỗ
  //     `frame-fit.mjs` từng sai (right ngược dấu) mà mọi con số vẫn đúng.
  const opts = cityOrbitOptions(GRID, 14);
  const eye = orbitPosition({ yaw: DEFAULT_YAW, pitch: DEFAULT_PITCH, distance: opts.distance, target: opts.target });
  const E = [eye.x, eye.y, eye.z];
  const T = [opts.target.x, opts.target.y, opts.target.z];
  const fwd = chuan(tru(T, E));
  const len = Math.hypot(...tru(T, E));
  const den = [E[0] + fwd[0] * len, E[1] + fwd[1] * len, E[2] + fwd[2] * len];
  bao(Math.hypot(...tru(den, T)) < 1e-9, 'tia giữa khung đi trúng điểm ngắm');

  // (4) Ba lớp phải cộng đúng 100% — bài học "mọi phép chia-một-toàn-thể phải in ra TỔNG".
  const r = tiLeNuocTrongKhung({ era: 12 });
  bao(Math.abs(r.nuoc + r.dat + r.khong - 1) < 1e-9, `ba lớp cộng đúng 1 (${(r.nuoc + r.dat + r.khong).toFixed(9)})`);

  console.log(loi === 0 ? '\nTẤT CẢ ĐẠT' : `\n${loi} MỤC TRƯỢT`);
  return loi;
}

/**
 * ⚠️ CỔNG "TÔI CÓ PHẢI FILE ĐƯỢC GỌI THẲNG KHÔNG" — ĐỪNG GỠ.
 *
 * Bản đầu không có đoạn này, nên `import` file từ `waterView.test.js` **chạy luôn cả bảng 15 kỷ**
 * ở tầng module. Bài test mất **118 giây**, và tôi đã đi tối ưu nhầm hai thứ (thu lưới tia xuống
 * 1/6, rồi nhớ lại thế giới đã dựng) — cả hai đều đúng về mặt kỹ thuật và cùng nhau chỉ tiết kiệm
 * được 40 giây, vì thủ phạm thật nằm ở chỗ khác hẳn. Đo thẳng thì lộ ra ngay: `nạp module` 111.924
 * ms, còn một lượt đo thật chỉ 0,3–1,3 giây.
 * ⇒ Đúng bài học đã ghi nhiều lần trong dự án: **trước khi tinh chỉnh một phép đo lần thứ hai, hãy
 * hỏi "đại lượng này có phải thứ quyết định kết quả không?"** — một phép thử rẻ (bấm giờ riêng
 * từng bước) trả lời trong 10 giây thứ mà hai vòng tối ưu không trả lời được.
 */
const LA_FILE_CHINH = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (LA_FILE_CHINH) {
  const argv = process.argv.slice(2);
  if (argv.includes('--selftest')) {
    process.exit(selftest() === 0 ? 0 : 1);
  } else {
    const i = argv.indexOf('--eras');
    const eras = i >= 0 ? argv[i + 1].split(',').map(Number)
      : Array.from({ length: 15 }, (_, k) => k + 1);
    chay(eras);
  }
}
