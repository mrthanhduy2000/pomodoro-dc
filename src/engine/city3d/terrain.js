/**
 * terrain.js — ĐỊA HÌNH: mặt đất thôi phẳng lì.
 *
 * ⚠️ LUẬT CỨNG NHẤT CỦA FILE NÀY: **ĐỊA HÌNH LÀ HÀM CỦA KỶ, KHÔNG PHẢI CỦA VIỆC ĐÀM ĐÃ XÂY GÌ.**
 * Đất có trước thành phố. Nếu cao độ phụ thuộc vào số công trình đang đứng trên nó thì mỗi lần
 * Đàm xây xong một căn nhà, cả quả đồi sẽ nhích lên — nhà cũ đang đứng yên bỗng lún xuống hoặc
 * nhô lên, không có gì đỏ, không ai mất dữ liệu, chỉ là một buổi sáng thành phố khác đi. Đây đúng
 * là bất biến mà `cityLayout.js` đã giữ cho VỊ TRÍ (ADR-007) và Phase 6C đã giữ cho THỨ TỰ MỞ
 * ĐƯỜNG (trường `tier`); ở đây giữ nó cho CAO ĐỘ.
 *
 * ⚠️ VÌ SAO PHẢI LÀ **THỀM BẬC** (terrace) CHỨ KHÔNG PHẢI DỐC LIÊN TỤC — và đây là quyết định
 * hình học, không phải mỹ thuật. Nền thành phố là 144 ô hộp, công trình là các khối đáy phẳng.
 * Một mặt đất dốc liên tục thì:
 *   · ô nền hình hộp không dốc theo được ⇒ vẫn ra bậc, chỉ là bậc lởm chởm vì mỗi ô một cao độ;
 *   · công trình rộng ~3 ô sẽ có góc treo lơ lửng trên khoảng trống.
 * Thềm bậc giải quyết cả hai bằng đúng cách mà **mọi thành phố trên đồi ngoài đời** đã giải
 * quyết: san thành từng thềm, chỗ chênh thì kè đá. Nó vừa đúng hình học vừa đúng lịch sử.
 *
 * ⚠️ CÔNG TRÌNH VẪN CÓ THỂ VẮT QUA MÉP THỀM (thềm rộng vài ô, công trình rộng tới 3,687 ô — xem
 * `TECH_DEBT #21`). Cách xử lý ở đây KHÔNG phải làm phẳng ô đất dưới chân nó — làm vậy thì đường
 * đi ngay cạnh sẽ hụt một bậc và mạng đường gãy. Thay vào đó công trình đứng ở cao độ CAO NHẤT
 * dưới bóng nó, và phần hụt được lấp bằng một khối MÓNG (`drop`). Ngoài đời gọi là bệ kè; nó vừa
 * chống lơ lửng vừa thêm đúng loại chi tiết kiến trúc đang thiếu.
 */

import { hashId } from '../cityLayout';

/** Chiều cao MỘT bậc thềm, tính theo đơn vị ô (`TILE_UNIT = 1`). */
export const TERRACE_STEP = 0.5;

/**
 * Cỡ ô của lưới nhiễu — bao nhiêu ô thành phố cho MỘT ô nhiễu.
 *
 * ⚠️ Đây là con số nhạy nhất file. Nhỏ quá (2–3) thì mỗi khu đất một cao độ khác ⇒ thành phố trông
 * như bị gặm nhấm, và gần như công trình nào cũng vắt qua mép thềm. Lớn quá (≥8) thì cả lưới 12×12
 * chỉ nằm gọn trong một sườn dốc duy nhất ⇒ về lại phẳng, chỉ là phẳng nghiêng. 4,5 cho ra thềm
 * rộng ~4–5 ô: đủ để phần lớn công trình đứng trọn trên một thềm, đủ để mắt đọc ra là địa hình.
 */
const NOISE_CELL = 4.5;

/**
 * Kiểu địa hình — mỗi kiểu là một cách BIẾN ĐỔI trường nhiễu, không phải bảng cao độ chép tay.
 *
 * Mỗi hàm ở đây chỉ trả lời DUY NHẤT một câu: **"chỗ nào cao hơn chỗ nào"**. Câu "cao bao nhiêu"
 * là việc của `relief` + `terraces`. Đây đúng luật "một trường một việc" đã trả giá ở Phase 5B với
 * `storyHeight`.
 *
 * ⚠️ NHƯNG PHẢI NÓI CHO ĐÚNG THỨ ĐANG BẢO ĐẢM ĐIỀU ĐÓ, vì tôi đã suýt ghi sai vào đây. Bản đầu
 * viết `plain: (n) => n * 0.35` — nhét luôn "đồng bằng thì thấp" vào hàm hình dạng — và đo ra
 * **bốn kỷ (2, 3, 11, 12) phẳng TUYỆT ĐỐI**, 15 kỷ chỉ còn 11 trường cao độ khác nhau. Tôi sửa
 * bằng cách cho mọi hàm trả trọn 0..1, rồi viết chú thích rằng ĐÓ là thứ giữ cho lỗi không tái
 * phát. **Sai.** Thử ngược mới lộ ra: sau khi thêm bước **CĂNG TRƯỜNG** ở lượt 2 (xem `buildTerrain`),
 * nhân `plain` với 0,35 cho ra kết quả **y hệt từng con số** — vì phép căng theo min/max của chính
 * kỷ đó xoá sạch mọi hệ số nhân chung. Tức biên độ trong hàm hình dạng nay **không thể** gây lỗi
 * nữa, do CẤU TRÚC chứ không do kỷ luật viết hàm.
 *
 * ⇒ Thứ đang gánh bất biến này là **bước căng trường**, không phải quy ước 0..1. Bỏ bước căng đi
 * thì cả ba hàng rào ở `terrain.test.js` đỏ ngay (đã thử). Giữ quy ước 0..1 vẫn tốt cho người đọc,
 * nhưng đừng nhầm nó là lưới an toàn — cùng loại nhầm lẫn với "sương mù quét sắc lên công trình" ở
 * Phase 3Y: sửa đúng KHÔNG chứng minh hiểu đúng.
 */
const SHAPES = {
  /** Đồng bằng: hình dạng thuần nhiễu. Cái làm nó PHẲNG là `terraces: 2` + `relief` thấp. */
  plain: (n) => n,
  /** Đồi thoai thoải nối nhau (Toscana) — cũng thuần nhiễu, nhưng nhiều bậc và relief cao. */
  rolling: (n) => n,
  /**
   * Thung lũng: thấp ở giữa, cao ở rìa. `edge` = 0 ở tâm lưới, 1 ở góc.
   * Trường nhiễu bị TRỘN với một hàm hình học, nên hai kỷ cùng seed mà khác `shape` vẫn ra hai
   * địa hình khác hẳn. Trọng số 0,40/0,60: nghiêng về hình học đủ để đọc ra là thung lũng, nhưng
   * còn đủ nhiễu để hai bên sườn không đối xứng như khuôn đúc.
   */
  valley: (n, edge) => n * 0.40 + edge * 0.60,
  /** Gò/mỏm đá: cao ở giữa, đổ xuống bốn phía (Göbekli Tepe, lâu đài Burg Eltz). */
  ridge: (n, edge) => n * 0.40 + (1 - edge) * 0.60,
  /**
   * Bờ dốc xuống một phía (Lisbon đổ ra cửa sông Tejo).
   *
   * `slope` chạy theo MỘT TRỤC THẲNG, không theo đường chéo `(x+y)` — vì bờ sông ngoài đời là một
   * ĐƯỜNG, không phải một góc chéo.
   *
   * ⚠️ Lý do lịch sử, và một lần nữa phải nói cho đúng thứ đang bảo đảm điều gì: bản đầu dùng
   * đường chéo và đo ra **85% số ô rơi vào cùng một bậc** — cả "thành phố bảy quả đồi" thành một
   * mặt phẳng có đúng hai góc lệch. Nguyên nhân thuần xác suất: tổng hai toạ độ có **phân bố hình
   * tam giác** (1 cách ra tổng 0, nhưng 12 cách ra tổng 11), nên phần lớn ô dồn về giữa dải. Tôi
   * đổi sang trục thẳng và nó hết. **Nhưng thử ngược sau khi thêm bước căng trường thì đường chéo
   * KHÔNG còn gây lỗi nữa** (kỷ 8 vẫn dùng đủ 5 bậc, mức đông nhất 34% — dưới ngưỡng 60%). Trục
   * thẳng nay được giữ vì nó ĐÚNG ĐỊA LÝ, không phải vì nó đang cứu phép chia bậc.
   */
  coast: (n, edge, slope) => n * 0.30 + slope * 0.70,
  /** Đụn cát: sóng dài chồng lên nhiễu — không mặt nào thật bằng, nhưng cũng không dốc. */
  dune: (n, edge, slope, wave) => n * 0.45 + wave * 0.55,
};

/**
 * ĐỊA HÌNH THEO KỶ — mỗi dòng phải trả lời được "nước ấy trông như vậy thật không?".
 *
 * ⚠️ Cùng luật với `country`/`landmark` ở `eraStyle.js`: đây KHÔNG phải nhãn dán cho đẹp. Một con
 * số tuỳ hứng ở đây sẽ sinh ra đúng thứ mà Phase 5B đã phải đi sửa — 15 kỷ khác nhau trên giấy mà
 * giống nhau trên màn hình. `terraces` = số bậc thềm (1 = phẳng tuyệt đối), `relief` = độ cao tổng.
 */
export const ERA_TERRAIN = {
  1:  { shape: 'ridge',   terraces: 4, relief: 1.00, note: 'Göbekli Tepe nằm trên một GÒ ĐẤT cao nhìn xuống đồng bằng Harran' },
  2:  { shape: 'plain',   terraces: 2, relief: 0.45, note: 'đồng bằng phù sa sông Nin — phẳng tới chân trời, chỉ gợn bờ đê' },
  3:  { shape: 'plain',   terraces: 2, relief: 0.35, note: 'Lưỡng Hà phẳng tuyệt đối; ziggurat là ngọn núi NHÂN TẠO duy nhất' },
  4:  { shape: 'valley',  terraces: 3, relief: 0.60, note: 'kinh thành Trung Hoa trên đồng bằng, đồi thấp vây bốn phía' },
  5:  { shape: 'ridge',   terraces: 5, relief: 1.35, note: 'Burg Eltz dựng trên MỎM ĐÁ giữa thung lũng — dốc nhất cả 15 kỷ' },
  6:  { shape: 'valley',  terraces: 3, relief: 0.55, note: 'làng Bắc Bộ ven sông: đồng trũng, đình làng trên gò cao' },
  7:  { shape: 'rolling', terraces: 5, relief: 1.15, note: 'đồi Toscana nối nhau — hình ảnh đặc trưng nhất của kỷ này' },
  8:  { shape: 'coast',   terraces: 5, relief: 1.20, note: 'Lisbon "thành phố bảy quả đồi" đổ dốc xuống cửa sông Tejo' },
  9:  { shape: 'valley',  terraces: 3, relief: 0.50, note: 'lòng chảo sông Seine, gần phẳng, chỉ nhô đồi Montmartre' },
  10: { shape: 'valley',  terraces: 4, relief: 0.80, note: 'Manchester trong thung lũng công nghiệp, nhà máy bám sườn' },
  11: { shape: 'plain',   terraces: 2, relief: 0.40, note: 'Manhattan là một tấm granite gần phẳng — chiều cao đến từ NHÀ' },
  12: { shape: 'plain',   terraces: 2, relief: 0.30, note: 'thảo nguyên Nga mênh mông, phẳng đến mức thành biểu tượng' },
  13: { shape: 'valley',  terraces: 4, relief: 0.95, note: 'đô thị Nhật kẹp giữa núi — đất hẹp là lý do có nhà nang' },
  14: { shape: 'plain',   terraces: 1, relief: 0.00, note: 'Marina Bay là đất LẤN BIỂN: phẳng tuyệt đối, do người san' },
  15: { shape: 'dune',    terraces: 3, relief: 0.55, note: 'sa mạc Dubai: đụn cát sóng dài, không có mặt nào thật bằng' },
};

const FALLBACK_TERRAIN = { shape: 'plain', terraces: 2, relief: 0.40, note: '' };

export function eraTerrainProfile(era) {
  return ERA_TERRAIN[era] ?? FALLBACK_TERRAIN;
}

/**
 * Đỉnh cao nhất mà địa hình của một kỷ CÓ THỂ đạt tới — tính bằng công thức, không phải bằng cách
 * dựng cả trường rồi đo.
 *
 * ⚠️ TỒN TẠI ĐỂ CAMERA KHÔNG PHẢI ĐOÁN. Địa hình nâng công trình lên tới gần 3 đơn vị; một khung
 * hình không biết điều đó sẽ cắt cụt nóc đúng ở những kỷ dốc nhất — **và không có gì đỏ lên**, y
 * hệt lỗi cắt ngọn mà `massScale` đã gây ra ở Phase 5B. Camera phải co giãn theo CHÍNH con số đã
 * sinh ra chiều cao ấy, không theo một hằng số đoán mò song song ("một luật một công thức").
 *
 * Có bài test buộc con số này khớp với `buildTerrain(...).maxHeight` thật — hai công thức "tương
 * đương trên giấy" là thứ dự án này đã trả giá nhiều lần.
 */
export function terrainMaxHeight(era) {
  const profile = eraTerrainProfile(era);
  return Math.max(0, profile.terraces - 1) * TERRACE_STEP * profile.relief;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(t) { return t * t * (3 - 2 * t); }

/** Giá trị 0..1 tất định tại một nút lưới nhiễu. */
function latticeValue(seed, ix, iy) {
  return (hashId(`t|${seed}|${ix}|${iy}`) % 4096) / 4095;
}

/** Nhiễu giá trị nội suy song tuyến, làm mượt bằng smoothstep. Trả 0..1. */
function valueNoise(seed, gx, gy) {
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const sx = smoothstep(gx - x0);
  const sy = smoothstep(gy - y0);
  const top = lerp(latticeValue(seed, x0, y0), latticeValue(seed, x0 + 1, y0), sx);
  const bottom = lerp(latticeValue(seed, x0, y0 + 1), latticeValue(seed, x0 + 1, y0 + 1), sx);
  return lerp(top, bottom, sy);
}

/**
 * Dựng trường cao độ cho một kỷ.
 *
 * @param {object} input
 * @param {number} input.era        1..15 (giá trị lạ → hồ sơ mặc định, không ném lỗi)
 * @param {number} input.gridSize   cạnh lưới (12)
 * @returns {{
 *   heightAt: (x:number, y:number) => number,
 *   footprint: (x:number, y:number, span:number) => {top:number, drop:number},
 *   cells: Array<{x:number, y:number, h:number}>,
 *   maxHeight: number,
 *   profile: object,
 * }}
 */
export function buildTerrain({ era, gridSize = 12 } = {}) {
  const profile = eraTerrainProfile(era);
  const size = Math.max(1, Math.round(Number.isFinite(gridSize) ? gridSize : 12));
  const shape = SHAPES[profile.shape] ?? SHAPES.plain;
  const terraces = Math.max(1, Math.round(profile.terraces));
  const seed = `${era}|${profile.shape}`;

  const centre = (size - 1) / 2;
  const heights = new Float64Array(size * size);
  let maxHeight = 0;

  // ── LƯỢT 1: trường thô ────────────────────────────────────────────────────
  const raw = new Float64Array(size * size);
  let lo = Infinity;
  let hi = -Infinity;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = valueNoise(seed, x / NOISE_CELL, y / NOISE_CELL);
      // `edge` = 0 ở tâm, 1 ở góc xa nhất. Dùng khoảng cách Chebyshev (hình vuông) chứ không phải
      // Euclid: lưới là hình vuông, nên vành đồi hình vuông ôm sát mép lưới, còn vành hình TRÒN sẽ
      // để bốn góc lưới tụt xuống thành bốn hố — trông như lỗi chứ không như địa hình.
      const edge = Math.max(Math.abs(x - centre), Math.abs(y - centre)) / centre;
      // ⚠️ MỘT TRỤC THẲNG, KHÔNG PHẢI ĐƯỜNG CHÉO — xem lý do đầy đủ ở `SHAPES.coast`.
      const slope = size > 1 ? y / (size - 1) : 0;
      const wave = (Math.sin((x + y * 0.6) / NOISE_CELL) + 1) / 2;
      const v = shape(n, edge, slope, wave);
      raw[y * size + x] = v;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }

  // ── LƯỢT 2: CĂNG TRƯỜNG RA TRỌN 0..1 rồi mới chia bậc ─────────────────────
  /**
   * ⚠️ VÌ SAO PHẢI CĂNG LẠI, VÀ VÌ SAO NÓ KHÔNG PHẢI "LÀM ĐẸP SỐ LIỆU": ở tần số nhiễu này
   * (`NOISE_CELL` 4,5 trên lưới 12) cả trường chỉ lấy mẫu từ khoảng **3×3 = 9 giá trị ngẫu nhiên
   * độc lập**. Chín mẫu thì luật số lớn không áp dụng — trường cao độ đơn giản là "chín con số ấy
   * tình cờ ra sao". Đo bản chưa căng: **5/15 kỷ có trên 70% số ô dồn vào MỘT bậc** (kỷ 3 và 12
   * tới 81%), tức là phẳng, chỉ khác là phẳng ở một cao độ lẻ. Căng theo min/max của chính kỷ đó
   * bảo đảm mọi kỷ dùng trọn dải bậc mình khai, bất kể chín con số kia rơi vào đâu.
   *
   * ⚠️ VÀ CHIA BẬC BẰNG `floor`, KHÔNG PHẢI `round` — đây là lỗi phân bố THỨ HAI trong cùng hàm
   * này. `Math.round(c × (T−1))` cho các thùng ở HAI ĐẦU chỉ rộng bằng NỬA thùng giữa, nên với 3
   * bậc thì bậc giữa luôn nuốt gấp đôi phần đáng ra của nó — đúng triệu chứng của kỷ 6 và 9 (dùng
   * 2/3 mức, 80% dồn một chỗ). `floor(c × T)` cho mọi thùng rộng bằng nhau.
   */
  const span = hi - lo;
  for (let i = 0; i < raw.length; i += 1) {
    const normalized = span > 1e-9 ? (raw[i] - lo) / span : 0;
    const step = terraces > 1
      ? Math.min(terraces - 1, Math.floor(normalized * terraces))
      : 0;
    const h = step * TERRACE_STEP * profile.relief;
    heights[i] = h;
    if (h > maxHeight) maxHeight = h;
  }

  /** Cao độ mặt trên của ô. Ngoài lưới → kẹp về ô mép gần nhất (đất không kết thúc đột ngột). */
  function heightAt(x, y) {
    const cx = x < 0 ? 0 : (x >= size ? size - 1 : Math.round(x));
    const cy = y < 0 ? 0 : (y >= size ? size - 1 : Math.round(y));
    return heights[cy * size + cx];
  }

  /**
   * Cao độ cho một công trình phủ `span` ô quanh tâm `(x, y)`.
   *
   * `top` = cao nhất dưới bóng nó (đứng ở đây thì KHÔNG bao giờ có góc treo lơ lửng).
   * `drop` = phần hụt so với chỗ thấp nhất — dựng thành khối MÓNG lấp xuống, đúng như bệ kè ngoài
   * đời. Trả `drop = 0` khi công trình nằm trọn trên một thềm (phần lớn trường hợp) ⇒ không tốn
   * hình học thừa.
   */
  function footprint(x, y, span = 1) {
    const reach = Math.max(0, Math.floor((Math.max(1, span) - 1) / 2));
    let top = -Infinity;
    let bottom = Infinity;
    for (let dy = -reach; dy <= reach; dy += 1) {
      for (let dx = -reach; dx <= reach; dx += 1) {
        const h = heightAt(x + dx, y + dy);
        if (h > top) top = h;
        if (h < bottom) bottom = h;
      }
    }
    if (top === -Infinity) { top = 0; bottom = 0; }
    return { top, drop: top - bottom };
  }

  const cells = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) cells.push({ x, y, h: heights[y * size + x] });
  }

  return { heightAt, footprint, cells, maxHeight, profile };
}
