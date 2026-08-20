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
 * ⚠️⚠️ ĐÍNH CHÍNH 2026-08-20 — ĐOẠN NGAY TRÊN CHỈ ĐÚNG MỘT NỬA, VÀ NỬA SAI ĐÃ SINH RA MỘT BỘ SỐ
 * NGHIỆM THU SAI. Lý lẽ *"đo trần thì phải bắn tia"* vẫn đúng. Nhưng câu *"khỏi đếm điểm ảnh"* thì
 * sai, vì phép tia ở đây **mù với cây cối, nhà cửa, đá và cư dân** — nó chỉ dò trường cao độ mặt
 * đất. Đo đối chiếu với `--mask water`: phép tia cao hơn sự thật **1,04 tới 3,01 lần** tuỳ kỷ, và
 * cao nhất đúng ở những kỷ nước hẹp bờ rậm — tức đúng những kỷ đang đứng sát cổng. Vì tin nó, bảng
 * nghiệm thu Bước C từng ghi *"11/14 kỷ đạt cổng 5%"* trong khi sự thật trên màn hình là **5/14**.
 * ⇒ Công cụ này dùng để so CÁC GÓC XOAY của CÙNG MỘT KỶ (cây đứng yên nên sai số triệt tiêu phần
 * lớn). Cổng phần trăm thì phải chấm trên `--mask water`. Chi tiết ở chú thích `hopBaoNuoc`.
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

/**
 * Hộp bao tấm nước, đọc THẲNG từ hình học đã dựng — không dựng lại bằng công thức thứ hai.
 *
 * ⚠️ ĐỌC KỸ TRƯỚC KHI TIN CON SỐ HÀM NÀY GÓP PHẦN TẠO RA — PHÉP TIA Ở FILE NÀY MÙ VỚI CÂY CỐI.
 *
 * Bài học 2026-08-20, và nó đáng nhớ vì tôi đã đoán SAI nguyên nhân trước khi đo. Phép tia ở đây
 * cho ra một bộ % khung hình **cao hơn sự thật một cách có hệ thống**: đối chiếu với số điểm ảnh
 * đếm thẳng trên ảnh `--mask water` (mặt nạ tô đúng những điểm ảnh mà GPU thật sự vẽ ra là nước):
 *
 *   kỷ  4  tia 5,02% · màn hình 3,32%  (tia cao hơn 1,51 lần)  ⟵ tưởng ĐẠT cổng 5%, thật ra TRƯỢT
 *   kỷ  5  tia 5,62% · màn hình 3,34%  (1,68 lần)              ⟵ tưởng ĐẠT, thật ra TRƯỢT
 *   kỷ  6  tia 4,13% · màn hình 1,37%  (3,01 lần)              ⟵ lệch nặng nhất bảng
 *   kỷ  8  tia 9,96% · màn hình 7,40%  (1,35 lần)
 *   kỷ 13  tia 24,12% · màn hình 23,18% (1,04 lần)             ⟵ biển: lệch ít nhất
 *
 * GIẢ THUYẾT ĐẦU TIÊN (SAI, ghi lại để phiên sau đừng đi lại): *"hộp bao đếm cả lỗ thủng, vì
 * `buildWaterSurface` bỏ hẳn những ô có `blendAt <= 0` ở cả bốn góc"*. Nghe rất xuôi, và đo được
 * rằng hộp bao kỷ 5 chỉ được phủ 42,2% bởi `blendAt > 0`. Đã vá theo giả thuyết ấy (thêm điều kiện
 * `blendAt > 0` ở chỗ bắn tia bên dưới) — và **các con số không nhúc nhích một chữ số nào**. Lý do:
 * phần hộp bao bị thủng luôn có ĐẤT nhô cao hơn mặt phẳng nước, nên phép so `tNuoc < tDat` vốn đã
 * loại chúng ra từ trước. Điều kiện mới vì vậy là một phép LOẠI NHANH đúng-về-nguyên-tắc (hỏi đúng
 * câu mà bên dựng hỏi) chứ KHÔNG phải một bản vá — nó được giữ lại vì rẻ và vì nó chặn ngày nào
 * hộp bao và tấm nước thật sự lệch nhau, không phải vì hôm nay nó sửa được gì.
 *
 * NGUYÊN NHÂN THẬT nằm ở `caoDoTai` bên dưới: nó chỉ dò **trường cao độ mặt đất**
 * (`surfaceHeightAt`/`horizon.heightAt`) và hoàn toàn KHÔNG biết cây cối, nhà cửa, đá, cư dân tồn
 * tại. Một tia xuyên qua tán cây rồi chạm mặt nước phía sau ⇒ phép tia ghi "nước", còn màn hình vẽ
 * ra một cái cây. Vì thế sai số lớn nhất rơi đúng vào những kỷ nước HẸP và bờ RẬM (kỷ 6: 3,01 lần)
 * và nhỏ nhất ở biển rộng (kỷ 13: 1,04 lần) — đúng thứ tự mà một phép mù-cây phải có.
 *
 * ⇒ LUẬT: dùng phép tia ở đây để so các GÓC XOAY của CÙNG MỘT KỶ với nhau (cây đứng yên khi xoay,
 * nên sai số triệt tiêu phần lớn). ĐỪNG dùng nó làm con số nghiệm thu tuyệt đối, và tuyệt đối
 * đừng dùng nó để chấm một cái cổng phần trăm — cổng phải chấm trên `--mask water`.
 */
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
  // 0 = trời · 1 = đất · 2 = nước. Giữ lại để `duongBoCatKhung` đọc, thay vì quét lần thứ hai bằng
  // một công thức thứ hai (bài học "một luật một công thức" — cặp công cụ dựng ↔ công cụ đo).
  const loai = new Uint8Array(raysX * raysY);
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
          // Hộp bao chỉ là phép LOẠI NHANH. Câu hỏi thật phải là câu mà `buildWaterSurface` hỏi.
          if (x >= bao.x0 && x <= bao.x1 && z >= bao.z0 && z <= bao.z1
            && terrain.setting.blendAt(x + half, z + half) > 0) tNuoc = t;
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

      if (tNuoc < tDat) { nuoc += 1; loai[py * raysX + px] = 2; }
      else if (tDat < Infinity) { dat += 1; loai[py * raysX + px] = 1; }
      else { khong += 1; loai[py * raysX + px] = 0; }
    }
  }
  const tong = raysX * raysY;
  return {
    nuoc: nuoc / tong, dat: dat / tong, khong: khong / tong, loai, raysX, raysY,
  };
}

/**
 * ĐƯỜNG BỜ CẮT KHUNG DÀI BAO NHIÊU — đại lượng Đàm chỉ định làm phương án thay thế cho cổng 5%.
 *
 * ⚠️ VÌ SAO CẦN NÓ. Cổng cũ đo **DIỆN TÍCH** nước, còn câu hỏi thật là *"có đọc ra là thành phố
 * ven nước không"* — mà thứ quyết định điều đó là **đường bờ có cắt qua khung hình không**. Hai
 * đại lượng ấy rời nhau ở đúng chỗ nguy hiểm: một dải nước áp sát MÉP TRÊN của khung có thể đạt
 * 5% diện tích mà mắt không đọc ra, vì nó không chia đôi cảnh vật thành "bên này bờ" và "bên kia
 * bờ". Đây chính là điều kiện xem lại Đàm viết ra ở `TECH_DEBT #61`, và nó ĐÃ kích hoạt ở kỷ 4.
 *
 * Cách đo: đếm các cạnh giữa hai tia KỀ NHAU mà một tia trúng nước còn tia kia trúng ĐẤT, rồi chia
 * cho đường chéo khung (tính theo đơn vị tia). Ra một số không thứ nguyên, so được giữa các kỷ và
 * giữa hai độ mịn lưới tia.
 *
 * ⚠️ CHỈ ĐẾM RANH GIỚI NƯỚC↔ĐẤT, KHÔNG ĐẾM NƯỚC↔TRỜI. Mép xa của một mặt biển giáp với chân
 * trời, không phải với bờ — gộp chúng lại thì kỷ `sea` được cộng không công một đoạn dài bằng cả
 * bề ngang khung hình, và đại lượng này lập tức thoái hoá về đúng cái nó sinh ra để thay thế.
 *
 * ⚠️ VÀ NÓ KHÔNG THAY THẾ ĐƯỢC CÂU HỎI "NHÌN CÓ RA NƯỚC KHÔNG". Phép đo này thuần HÌNH HỌC — nó
 * không biết mặt nước được TÔ màu gì. Kỷ 5 là đối chứng sống: đường bờ của nó dài, mà trên màn hình
 * vẫn không đọc ra là nước vì lòng quá nông nên sắc nước gần như trùng màu cỏ (xem `docSacNuoc`).
 * Hai câu hỏi khác nhau ⇒ hai phép đo khác nhau, đừng để một cái gánh cả hai.
 *
 * @returns {{daiTuongDoi:number, canhBo:number, vaoSauNhat:number}}
 *   `daiTuongDoi` = chiều dài đường bờ / đường chéo khung ·
 *   `vaoSauNhat` = tia nước lấn sâu nhất vào trong khung, tính theo tỉ lệ nửa-khung
 *   (0 = dính mép, 1 = tới tâm) — số chẩn đoán phụ, KHÔNG phải cổng.
 */
export function duongBoCatKhung({ era, yaw = DEFAULT_YAW, gridSize = GRID, tia = RAYS_X }) {
  const { loai, raysX, raysY } = tiLeNuocTrongKhung({ era, yaw, gridSize, tia });
  const at = (x, y) => loai[y * raysX + x];
  let canhBo = 0;
  for (let y = 0; y < raysY; y += 1) {
    for (let x = 0; x < raysX; x += 1) {
      const c = at(x, y);
      if (c !== 2) continue;
      if (x + 1 < raysX && at(x + 1, y) === 1) canhBo += 1;
      if (y + 1 < raysY && at(x, y + 1) === 1) canhBo += 1;
      if (x > 0 && at(x - 1, y) === 1) canhBo += 1;
      if (y > 0 && at(x, y - 1) === 1) canhBo += 1;
    }
  }
  // Mỗi cạnh bị đếm đúng một lần từ phía NƯỚC (vòng lặp bỏ qua tia không phải nước), nhưng cả bốn
  // hướng đều được hỏi, nên một cạnh nước↔đất chỉ vào sổ MỘT lần. Không chia đôi.
  const cheoKhung = Math.hypot(raysX, raysY);

  // Lấn sâu: khoảng cách từ tia nước tới mép khung gần nhất, chuẩn hoá theo nửa-khung.
  let vaoSauNhat = 0;
  for (let y = 0; y < raysY; y += 1) {
    for (let x = 0; x < raysX; x += 1) {
      if (at(x, y) !== 2) continue;
      const dx = Math.min(x + 1, raysX - x) / (raysX / 2);
      const dy = Math.min(y + 1, raysY - y) / (raysY / 2);
      const d = Math.min(dx, dy);
      if (d > vaoSauNhat) vaoSauNhat = d;
    }
  }
  return { daiTuongDoi: canhBo / cheoKhung, canhBo, vaoSauNhat };
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
  console.log('kỷ · loại   · bờ  · xoay |  DIỆN TÍCH mặc định | TRẦN   | gấp  | ĐƯỜNG BỜ | lấn sâu');
  for (const era of eras) {
    const st = getSetting(era);
    const macDinh = tiLeNuocTrongKhung({ era }).nuoc;
    const yawDoi = gocDoiDien(era);
    const tran = tiLeNuocTrongKhung({ era, yaw: yawDoi }).nuoc;
    const gap = macDinh > 0 ? (tran / macDinh).toFixed(1) : (tran > 0 ? '∞' : '—');
    const bo = duongBoCatKhung({ era });
    const xoay = `${Math.round((worldYaw(era) * 180) / Math.PI)}°`;
    console.log(
      `${String(era).padStart(2)} · ${String(st.water).padEnd(7)} · ${String(st.side).padEnd(4)} · ` +
      `${xoay.padStart(4)} | ${(macDinh * 100).toFixed(2).padStart(15)}%   | ` +
      `${(tran * 100).toFixed(2).padStart(5)}% | ${String(gap).padStart(4)}× | ` +
      `${bo.daiTuongDoi.toFixed(3).padStart(8)} | ${bo.vaoSauNhat.toFixed(3).padStart(7)}`,
    );
  }
  console.log('\nĐƯỜNG BỜ = chiều dài ranh giới nước↔ĐẤT chia cho đường chéo khung (không thứ nguyên).');
  console.log('LẤN SÂU  = tia nước lấn sâu nhất vào trong khung; 0 = dính mép, 1 = tới tâm khung.');
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
