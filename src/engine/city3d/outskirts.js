/**
 * outskirts.js — VÙNG QUÊ: thứ nằm NGOÀI lưới thành phố.
 *
 * ⚠️ VÌ SAO FILE NÀY RA ĐỜI — VÀ NÓ RA ĐỜI SAU KHI BA GIẢ THUYẾT ĐẦU ĐỀU BỊ PHÉP ĐO BÁC BỎ.
 *
 * Đàm nhìn ảnh và nói: *"Tại sao một thành phố lại được xây trên một ô đất nhô ra, đâu có thành
 * phố nào như vậy?"*. Ba giả thuyết hiển nhiên, đo lần lượt, cả ba đều SAI:
 *
 *   1. *"Mép đĩa đất là một vách đứng"* — SAI. Cao độ hai bên chỗ giáp khớp nhau tới **0,0000**
 *      ở cả ba kỷ đo (1 · 7 · 14). Phase 8C + 9A đã làm đúng việc của chúng.
 *   2. *"Màu hai bên mép đĩa chỏi nhau"* — SAI. Đo mặt cắt ngang qua đúng mép ấy (353 chỗ, kỷ 12):
 *      bước nhảy 1 điểm ảnh LỚN NHẤT là **1,1/255**, tổng lệch qua 60 điểm ảnh là **1,9** — dưới
 *      ngưỡng mắt 12 tới mười lần. Mép ranh giữa lưới và vành cũng vậy (1,4 và 14,2 trải trên 60px).
 *   3. *"Vùng gần phẳng như mặt kính nên trông giả"* — ĐÚNG SỰ THẬT nhưng KHÔNG PHẢI THỦ PHẠM. Đã
 *      thử: thêm gợn sóng vào vùng gần (biên độ 0,11–0,42), chụp trước/sau kỷ 12 thì 25,6% điểm
 *      ảnh có đổi nhưng lệch trung bình **1,91** và **0 điểm ảnh** chạm ngưỡng mắt 12. Một cơ chế
 *      vô hình — đúng cái bẫy Phase 8D — nên đã HOÀN NGUYÊN, không ship.
 *
 * Thủ phạm thật lộ ra khi vẽ ranh giới các vùng đè lên chính ảnh chụp: **không có cái mép nào cả.**
 * Thứ mắt đọc ra là một cái khay chính là **THÀNH PHỐ** — đường sá, sân bãi, nhà cửa xếp kín một
 * HÌNH CHỮ NHẬT rồi dừng phắt, và ra khỏi hình chữ nhật ấy thì **không có gì hết**: không cây, không
 * đá, không bờ bụi, trên một mặt đất trải tới tận chân trời. Một vật thể có cấu trúc đặt giữa một
 * mặt phẳng trống thì mắt đọc ra là "mô hình đặt trên bàn", bất kể mặt bàn ấy nối liền tới đâu.
 *
 * Con số đã nói trước điều này mà lúc ấy chưa ai đọc ra: phép đo trần của §2-C cho thấy ô lưới chỉ
 * chiếm **12–16%** chỗ "đất" nhìn thấy được; lấp KÍN mọi ô đất trong lưới cũng chỉ kéo tỉ lệ đất
 * trống từ 60,29% xuống 53,16%. **84–88% còn lại nằm ngoài lưới**, và trước file này thì tầng vẽ
 * chưa từng đặt lấy một vật thể nào ra đó.
 *
 * ⚠️ VÌ SAO LÀ MỘT FILE RIÊNG, KHÔNG NHÉT VÀO `cityLayout.js`. Bố cục thành phố (`computeCityLayout`)
 * trả lời câu *"Đàm đã xây được gì và nó đứng ở ô nào"* — nó ĐỔI theo tiến độ. Vùng quê trả lời câu
 * *"quanh đây là nơi thế nào"* — nó là ĐỊA LÝ, có trước thành phố và không đổi khi Đàm xây thêm
 * nhà. Đúng cùng lý lẽ mà `terrain.js` đã ghi thành luật cứng nhất của nó (*"địa hình là hàm của
 * KỶ, không phải của việc Đàm đã xây gì"*), và cùng lý lẽ mà Phase 6C giữ cho thứ tự mở đường.
 * Trộn hai câu hỏi vào một hàm thì mỗi lần xây xong một căn nhà, cả rừng cây quanh thành phố sẽ
 * xê dịch — không có gì đỏ lên, chỉ là một buổi sáng vùng quê khác đi.
 *
 * ⚠️ VÀ VÌ SAO KHÔNG CÓ BẢNG 15 KỶ Ở ĐÂY. Câu *"vùng quê của nước ấy, thời ấy trông thế nào"* CHÍNH
 * LÀ câu mà bảng `settingStyle.js` (VIỆC 2) sinh ra để trả lời — nơi nào ven biển, nơi nào bên sông,
 * nơi nào giữa lục địa. Dựng một bảng thứ hai ở đây rồi vài ngày sau bảng kia ra đời là tự tay tạo
 * ra hai nguồn sự thật cho cùng một câu hỏi. Nên file này **chỉ đọc bảng ĐÃ CÓ** (`floraStyle.js`:
 * loài cây, cỡ, mật độ, tầng bụi của từng kỷ) và để dành chỗ cho VIỆC 2 điều tiết.
 */

import { hashId } from '../cityLayout';
import { valueNoise } from './noise';
import { getFloraStyle } from './floraStyle';
import { PROP_SHORE_CLEAR, buildSetting, distanceOutsideGrid } from './setting';

export { distanceOutsideGrid };

/**
 * Vùng quê trải ra bao xa, tính bằng Ô kể từ MÉP lưới thành phố.
 *
 * ⚠️ CON SỐ NÀY LÀ MỘT PHÉP ĐO, KHÔNG PHẢI MỘT LỰA CHỌN THẨM MỸ. Tấm đất thành phố phủ tới
 * `terrainSurfaceReach(12) = 9,5` đơn vị thế giới, tức 3,5 ô ngoài mép lưới; ra xa hơn nữa là tấm
 * chân trời. Ở khung hình mặc định, phần "đất trống" mà mắt đọc được trải khá đều từ mép lưới ra
 * tới quãng 14 đơn vị rồi mới tan vào sương. 8 ô (⇒ bán kính thế giới 14) phủ trọn quãng ấy.
 *
 * Đi xa hơn KHÔNG mua thêm được gì: từ đó trở ra sương mù `FogExp2` đã nuốt phần lớn tương phản
 * (xem `daylight.js`), nên mỗi cái cây thêm vào chỉ là tam giác chứ không phải điểm ảnh.
 */
export const OUTSKIRT_REACH = 8;

/** Bước lưới rải, tính bằng ô. Mỗi mắt lưới nhiều nhất một vật. */
export const OUTSKIRT_STEP = 0.8;

/**
 * Mật độ ngay sát mép lưới, và ở ngoài cùng.
 *
 * ⚠️ HAI ĐẦU PHẢI KHÁC NHAU RÕ, VÀ ĐÂY LÀ CẢ MỤC ĐÍCH CỦA FILE. Rải đều thì vùng quê thành một tấm
 * thảm thứ hai, và cái khay chỉ đổi từ *một* hình chữ nhật thành *hai* hình chữ nhật lồng nhau.
 * Thứ xoá được ranh giới là chuyện mật độ **giảm dần**: sát thành phố thì rậm (vườn tược, bờ bụi,
 * hàng cây ven lộ), ra xa thì thưa dần thành đồng trống — đúng cách một thị trấn thật tan vào
 * nông thôn, và không có chỗ nào để mắt vạch được một đường.
 */
export const OUTSKIRT_EDGE_DENSITY = 0.72;
export const OUTSKIRT_FAR_DENSITY = 0.09;

/** Cỡ ô của trường "lùm": vùng quê mọc thành đám, không rắc đều. Tính bằng ô. */
const CLUMP_CELL = 5.2;

/** Phần vật thể là ĐÁ chứ không phải cây cối — đủ để đồng trống không chỉ có một loại bóng. */
const ROCK_SHARE = 0.14;

// ⚠️ `distanceOutsideGrid` ĐÃ DỜI SANG `setting.js` (VIỆC 2 Bước B) và được XUẤT LẠI ở trên, vì
// mọi chỗ đang nhập nó từ đây vẫn đúng về mặt ý nghĩa. Lý do dời: Bước B cần thêm vế *"ra khỏi lưới
// về HƯỚNG NÀO"* (mặt nước nằm một phía), mà hướng thì không suy ngược được từ một con số `max`.
// Nên phép gốc là `outwardDistances`, và `distanceOutsideGrid` nay được định nghĩa BẰNG nó thay vì
// viết song song — cùng đúng cái luật mà chú thích cũ ở đây đã nêu: một câu hỏi, một công thức.

function smoothstep(t) { return t * t * (3 - 2 * t); }
function lerp(a, b, t) { return a + (b - a) * t; }

/**
 * Sinh danh sách cảnh vật của VÙNG QUÊ.
 *
 * ⚠️ CHỮ KÝ CHỈ NHẬN `era` VÀ `gridSize` — KHÔNG NHẬN BỐ CỤC, và đó là một bất biến chứ không phải
 * một sự tiện tay. Có test gọi kèm dữ liệu rác (`built`, `buildings`, `sessionCount`…) rồi đòi kết
 * quả **y hệt** lần gọi sạch, đúng cách `terrain.js` đã khoá bất biến của nó ở Phase 7B.
 *
 * @param {object} input
 * @param {number} input.era
 * @param {number} [input.gridSize]
 * @returns {Array<{x:number, y:number, kind:string, scale:number, seed:string,
 *   detail:'high'|'low'}>} toạ độ theo Ô (nhận số lẻ và số âm), giống `layout.props`.
 */
export function deriveOutskirts({ era, gridSize = 12 } = {}) {
  const key = Number.isFinite(era) ? era : 1;
  const style = getFloraStyle(key);
  // ⚠️ QUAN HỆ MỘT CHIỀU — luật Đàm ra cho VIỆC 2: `settingStyle` → `setting` → `outskirts`. Vùng
  // quê ĐỌC dấu chân mặt nước để không trồng cây dưới nước; tuyệt đối không có đường ngược lại.
  // Lớp này vẫn chỉ nhận `era` + `gridSize`, nên bất biến "vùng quê là ĐỊA LÝ, không phải TIẾN ĐỘ"
  // còn nguyên (có test gọi kèm dữ liệu rác khoá điều đó).
  const setting = buildSetting({ era: key, gridSize });
  const out = [];

  const lo = -0.5 - OUTSKIRT_REACH;
  const hi = gridSize - 0.5 + OUTSKIRT_REACH;
  const steps = Math.round((hi - lo) / OUTSKIRT_STEP);

  for (let iy = 0; iy < steps; iy += 1) {
    for (let ix = 0; ix < steps; ix += 1) {
      // Lệch ngẫu nhiên TRONG mắt lưới: rải trên đúng mắt lưới thì cả vùng quê thành một bàn cờ
      // thứ hai — đúng thứ mà cả Phase 7B lẫn Phase 8D đã phải gỡ ở hai chỗ khác.
      const nut = `${key}|o|${ix}|${iy}`;
      const jx = (hashId(`${nut}|jx`) % 1000) / 1000;
      const jy = (hashId(`${nut}|jy`) % 1000) / 1000;
      const u = lo + (ix + jx) * OUTSKIRT_STEP;
      const v = lo + (iy + jy) * OUTSKIRT_STEP;

      const d = distanceOutsideGrid(u, v, gridSize);
      if (d <= 0) continue;                       // trong lưới là việc của `computeCityLayout`

      // ⚠️ CHỪA CẢ MÉP ƯỚT, KHÔNG CHỈ CHỪA MẶT NƯỚC. Ngưỡng là `> -PROP_SHORE_CLEAR` chứ không phải
      // `> 0`: một cái cây đứng đúng mép nước sẽ có gốc nằm trên sườn lòng sông, tức nó chúi xuống
      // hoặc lơ lửng nửa thân — mà `sceneGraph` đặt cây theo cao độ mặt đất TẠI TÂM gốc nên không
      // có gì đỏ lên, chỉ có một hàng cây trông sai sai ở đúng chỗ mắt nhìn nhất.
      if (setting.insetAt(u, v) > -PROP_SHORE_CLEAR) continue;

      const xa = smoothstep(Math.min(1, d / OUTSKIRT_REACH));
      const nen = lerp(OUTSKIRT_EDGE_DENSITY, OUTSKIRT_FAR_DENSITY, xa);
      // Trường "lùm": chỗ dày chỗ thưa ở tần số KHÔNG liên quan bước rải, nên không sinh hàng lối.
      const lum = 0.35 + valueNoise(`${key}|lum`, u / CLUMP_CELL, v / CLUMP_CELL) * 1.3;
      const p = nen * lum * style.density;

      if ((hashId(`${nut}|co`) % 1000) / 1000 >= p) continue;

      // ⚠️ CHỈ CHỌN *LOẠI* (cây / bụi / đá), KHÔNG chọn LOÀI. Loài cây của kỷ do `buildPropSpec`
      // → `growEraTree` bốc từ bảng `floraStyle`, và gọi `pickFloraSpecies` thêm một lần ở đây là
      // tạo nguồn sự thật thứ hai cho cùng một câu hỏi — hai bên sẽ lệch nhau ở đúng ngày ai đó
      // đổi cách bốc, mà triệu chứng chỉ là "cây quê không giống cây phố" chứ không đỏ ở đâu cả.
      const boc = (hashId(`${nut}|loai`) % 1000) / 1000;
      let kind = 'tree';
      if (boc < ROCK_SHARE) kind = 'rock';
      else if (boc < ROCK_SHARE + (1 - ROCK_SHARE) * style.undergrowth) kind = 'bush';

      // Cỡ: nhân cỡ cây của kỷ với một biến thiên riêng từng cây. Cây quê KHÔNG bị cắt tỉa nên
      // trải rộng hơn cây trong phố một chút — đó là khác biệt duy nhất so với cây trong lưới.
      const bien = 0.78 + (hashId(`${nut}|co2`) % 1000) / 1000 * 0.62;
      out.push({
        x: u, y: v, kind,
        scale: style.scale * bien,
        seed: nut,
        // ⚠️ LOD THEO KHOẢNG CÁCH, và cái ngưỡng phải THẬT SỰ CẮN. Bài học Phase 8D: đặt trần mức
        // thấp bằng đúng khoảng mà mức cao có thể ra thì một nửa số hạt cho hai mức y hệt nhau.
        // Ở đây `high`/`low` là hai nhánh mã khác nhau của `flora.js`, nên chia ở nửa quãng là
        // chia thật: sát thành phố (nơi mắt nhìn kỹ) đủ chi tiết, ngoài xa thì bớt thuỳ.
        detail: d <= OUTSKIRT_REACH * 0.5 ? 'high' : 'low',
      });
    }
  }

  return out;
}
