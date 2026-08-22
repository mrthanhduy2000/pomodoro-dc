/**
 * palette3d.js — đổi token màu của app thành số để WebGL dùng được. THUẦN: nhận CHUỖI màu đã đọc
 * sẵn, trả về số — không đụng DOM, không import three (three.Color nhận thẳng số nguyên 0xRRGGBB).
 *
 * ⚠️ VÌ SAO CẦN FILE NÀY: luật màu của dự án là "chỉ dùng CSS variable, cấm hardcode hex" (app có
 * 2 theme × 4 skin = 8 tổ hợp). Luật đó **không áp được vào WebGL** — shader không đọc được
 * `var(--canvas-2)`. Nên ta giữ đúng tinh thần luật bằng cách khác: vẫn lấy màu TỪ CSS variable,
 * chỉ thêm một bước dịch sang số ở đây. Tuyệt đối không bịa bảng màu riêng cho 3D.
 *
 * Phần đọc CSS (cần DOM) nằm ở `components/city/render3d/themeBridge.js`.
 *
 * ⚠️ MÀU MÁI KHÔNG LẤY TỪ `accentColor` NỮA (2026-08-14, Phase 6B) — và đây là ĐÚNG CÁI BỆNH của
 * Phase 5B lặp lại ở một trường khác: **một trường gánh hai việc**. `ERA_METADATA[era].accentColor`
 * sinh ra để làm màu NHẤN GIAO DIỆN (chấm tròn trên thanh chuyển kỷ, chữ trên nền tối), rồi bị dùng
 * luôn làm VẬT LIỆU LỢP MÁI. Hai thứ ấy không có một lý do nào phải giống nhau, và hậu quả nhìn
 * thấy được trên bản quét ngày 2026-08-14:
 *   • kỷ 6 (Việt Nam · đình làng, ngói âm dương nâu đỏ) — accent `#a78bfa` ⇒ **mái TÍM**;
 *   • kỷ 7 (Ý · Duomo Firenze, mà vòm ngói ĐỎ terracotta là chi tiết nổi tiếng nhất của nó) —
 *     accent `#c084fc` ⇒ **mái TÍM**;
 *   • kỷ 1 (lều da thú) — accent `#4ade80` ⇒ **mái XANH LÁ**, lẫn hẳn vào cỏ, nhìn cả 6 chặng ngày
 *     đều không ra được đâu là nhà;
 *   • kỷ 11 (đồng oxy hoá) hồng, kỷ 13 (bê tông) xanh cyan, kỷ 9 (kẽm Paris) xanh chanh.
 * ⇒ `eraStyle.js` nay có `roofColor` — vật liệu lợp THẬT của nước biểu tượng, và mỗi giá trị phải
 * trả lời được *"mái công trình ấy ngoài đời làm bằng gì?"*. Sắc kỷ (`accentColor`) VẪN dùng cho
 * tường/gờ/mặt đất, nên tổng thể thành phố vẫn ngả về sắc của kỷ; chỉ riêng mái là nói sự thật về
 * vật liệu. Không truyền `era` ⇒ lùi về hành vi cũ từng byte (bảo tàng, mọi chỗ gọi cũ).
 */

import { getEraStyle } from './eraStyle';
import { getFloraStyle } from './floraStyle';
import { getHumanStyle } from './humanStyle';

/**
 * Trần độ tươi của MÁI — hướng mỹ thuật trầm (Townscaper): mái là vật liệu lợp, không phải nhựa dẻo.
 *
 * ⚠️ CON SỐ NÀY TỪNG ĐƯỢC PHÁT BIỂU Ở HAI CHỖ VỚI HAI GIÁ TRỊ (phát hiện 2026-08-14): mã kẹp
 * `Math.min(0.70, …)` còn `palette3d.test.js` canh `s <= 0.66`. Đúng cái bẫy **"một luật chỉ được có
 * một công thức"** đã ghi ở `CLAUDE.md` — hai công thức tương đương trên giấy thì gần như luôn lệch
 * nhau ở biên, và ở đây biên ấy có thật: ngói lưu ly kỷ 4 (`#cf9e17`, Tử Cấm Thành) là vật liệu tươi
 * nhất bảng, ra đúng 0,70 — tức nó lọt qua mã và bị test bắt, hai bên nói ngược nhau về cùng một
 * mái. Nay chỉ còn MỘT số: mã kẹp bằng hằng số này, bài test `import` chính nó.
 */
export const ROOF_MAX_SATURATION = 0.66;

/** Màu dự phòng khi đọc CSS thất bại — trùng token mặc định của theme sáng ở `src/index.css`. */
export const FALLBACK_TOKENS = {
  canvas2: '#f4f2ec',
  ink: '#1f1e1d',
  line: '#e8e6de',
  accent: '#c96442',
};

/**
 * Đọc một chuỗi màu CSS thành `{r,g,b}` 0–255.
 * Nhận `#rgb`, `#rrggbb`, `rgb(...)`, `rgba(...)` — đây là các dạng mà `getComputedStyle` trả về
 * trong thực tế. Không nhận được → `null` (để bên gọi dùng màu dự phòng, không đoán bừa).
 */
export function parseCssColor(input) {
  if (typeof input !== 'string') return null;
  const text = input.trim();
  if (!text) return null;

  if (text.startsWith('#')) {
    const raw = text.slice(1);
    const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
    if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }

  const match = text.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (!match) return null;
  const [r, g, b] = match.slice(1, 4).map((n) => Math.round(Number(n)));
  if (![r, g, b].every((n) => Number.isFinite(n) && n >= 0 && n <= 255)) return null;
  return { r, g, b };
}

/** `{r,g,b}` → số nguyên 0xRRGGBB (dạng `THREE.Color` nhận trực tiếp). */
export function rgbToHexNumber({ r, g, b }) {
  return (r << 16) | (g << 8) | b;
}

/** Chuỗi màu CSS → số. Đọc không được thì dùng `fallback`. */
export function cssColorToNumber(input, fallback = FALLBACK_TOKENS.canvas2) {
  const rgb = parseCssColor(input) ?? parseCssColor(fallback) ?? { r: 0, g: 0, b: 0 };
  return rgbToHexNumber(rgb);
}

/** Trộn hai màu theo tỉ lệ `t` (0 = màu a, 1 = màu b). Dùng để pha sắc kỷ vào nền theo theme. */
export function mixRgb(a, b, t) {
  const k = Math.min(1, Math.max(0, t));
  return {
    r: Math.round(a.r + (b.r - a.r) * k),
    g: Math.round(a.g + (b.g - a.g) * k),
    b: Math.round(a.b + (b.b - a.b) * k),
  };
}

/** Độ sáng cảm nhận 0–1 (chuẩn Rec. 709) — dùng để đoán đang ở theme sáng hay tối. */
export function luminance({ r, g, b }) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// ─── HSL: ngôn ngữ để PHA MÀU, không phải để lưu màu ─────────────────────────
//
// ⚠️ VÌ SAO CẦN HSL Ở ĐÂY: bảng màu của một bức tranh không phải là một danh sách mã hex — nó là
// một CẤU TRÚC (cùng vài sắc độ, chênh nhau về độ đậm và độ tươi). Trộn thẳng bằng RGB như phần
// trên chỉ ra được "pha loãng dần về phía màu nền", tức là mọi vai màu đều nằm trên MỘT đường
// thẳng — đó chính là lý do bản Phase 3A trông phẳng và nhợt. Tách hue/sat/light ra mới nói được
// "cùng sắc kỷ nhưng mái thì trầm và đậm, còn diềm thì nhạt và sáng".

/** `{r,g,b}` 0–255 → `{h,s,l}` với h ∈ [0,360), s/l ∈ [0,1]. */
export function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let h;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

/** `{h,s,l}` → `{r,g,b}` 0–255. */
export function hslToRgb({ h, s, l }) {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(1, Math.max(0, s));
  const light = Math.min(1, Math.max(0, l));
  if (sat === 0) {
    const v = Math.round(light * 255);
    return { r: v, g: v, b: v };
  }
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  const seg = Math.floor(hue / 60) % 6;
  const table = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][seg];
  return {
    r: Math.round((table[0] + m) * 255),
    g: Math.round((table[1] + m) * 255),
    b: Math.round((table[2] + m) * 255),
  };
}

/**
 * Trộn hai góc màu theo ĐƯỜNG NGẮN trên vòng tròn màu.
 *
 * ⚠️ CHỈ DÙNG ĐƯỢC KHI HAI GÓC MÀU GẦN NHAU (lệch dưới ~90°). Với hai góc xa nhau thì hàm này là
 * một cái bẫy, và cái bẫy đó đã cắn dự án này BỐN LẦN ở bốn chỗ khác nhau (bầu trời, đèn bán cầu,
 * mái nhà, ánh trăng). Hai lý do, cùng gốc:
 *   • **Đường ngắn đi xuyên qua vùng tím.** Từ lam (215°) sang đất nung (16°) thì đường ngắn chạy
 *     215→270→320→360, nên "pha 60% đất nung vào lam" cho ra **tím sen** — xa cả hai màu gốc.
 *   • **Gần đối xứng thì HƯỚNG ĐI thành ngẫu nhiên.** Hai góc cách nhau ~180° nằm đúng chỗ hai
 *     đường dài bằng nhau; lệch một độ là lật hướng. Đó là vì sao mặt đất kỷ 5 ra cỏ xanh còn
 *     kỷ 7 ra đất nâu, dù cả hai kỷ đều có sắc lam-tím và đáng lẽ phải giống nhau.
 *
 * ⇒ Muốn pha sắc kỷ (góc màu chạy khắp vòng) vào một sắc NEO, dùng `blend` trong
 * `buildScenePalette` — nó trộn trong RGB, tức đi qua màu XÁM đúng như người vẽ pha bột màu, nên
 * không có đầu vào nào làm ra được màu tím và không có chỗ nào để lật hướng.
 */
export function mixHue(a, b, t) {
  const k = Math.min(1, Math.max(0, t));
  let delta = ((b - a) % 360 + 540) % 360 - 180;
  return ((a + delta * k) % 360 + 360) % 360;
}

/**
 * Khoảng cách độ đậm giữa MẶT ĐƯỜNG và MẶT ĐẤT — có cả SÀN lẫn TRẦN.
 *
 * ⚠️ ĐÂY LÀ BẢN VÁ GỐC CỦA `TECH_DEBT #30`, VÀ CÁI TRẦN MỚI LÀ PHẦN MỚI.
 * Luật cũ viết `gap = MIN + |off| × SPAN` — tức `MIN` mang nghĩa *"đường và đất phải cách nhau ÍT
 * NHẤT chừng này"* nhưng lại được **CỘNG THÊM** vào chênh lệch riêng của vật liệu thay vì làm SÀN
 * cho tổng. Vật liệu nào vốn đã xa mức trung tính thì bị đẩy HAI LẦN: nhựa đường kỷ 11 (`#3a3b3e`,
 * cách trung tính 0,265) nhận tổng đẩy **0,289** và render ra độ sáng **0,113** trong khi mặt đất
 * 0,406 — DƯỚI ngưỡng 0,12 mà mắt còn đọc ra chi tiết, **xét riêng vật liệu, trước khi bóng đổ chạm
 * vào**. Luật có sàn mà **không có trần**, và chưa ai từng hỏi *"đẩy xa bao nhiêu thì là quá xa?"*.
 *
 * Công thức mới bão hoà về `MAX`: `MIN + (MAX−MIN) × (1 − e^(−x·SPAN/(MAX−MIN)))`.
 *   • tại `x = 0` cho đúng `MIN` ⇒ sàn giữ nguyên, đường không bao giờ chìm vào đất;
 *   • đạo hàm tại 0 đúng bằng `SPAN` ⇒ các kỷ SÁNG (offset nhỏ) gần như không nhúc nhích;
 *   • đơn điệu NGẶT ⇒ vật liệu nào sáng hơn thì mặt đường vẫn sáng hơn, thứ tự 15 kỷ giữ nguyên
 *     tuyệt đối. Đây là điều một phép KẸP (`Math.max`) KHÔNG làm được — Phase 7D đã thử và phải gỡ,
 *     vì kẹp thì pavé Paris (0,50) và bê tông Singapore (0,63) ra CÙNG một độ đậm.
 * Luật cũ là trường hợp giới hạn của luật này khi `MAX → ∞`.
 *
 * ⚠️ VÀ VÌ SAO ĐƯỢC PHÉP HẠ TRẦN XUỐNG mà 15 kỷ vẫn phân biệt được: từ Phase 9D bản sắc đường KHÔNG
 * còn nằm hết ở màu. Bề rộng, viên lát, bó vỉa, vỉa hè, vạch kẻ (`streetStyle.js`) gánh phần lớn —
 * nên trục độ đậm không phải căng ra tới đứt nữa. Trước 9D mà hạ trần là mất bản sắc thật; sau 9D
 * thì không, và đó chính là lý do #30 và #27 phải làm CÙNG NHAU.
 *
 * @param {number} offsetAbs |độ đậm vật liệu − 0,50|
 */
export function roadContrastGap(offsetAbs, {
  min = 0.13, max = 0.26, span = 0.60,
} = {}) {
  const x = Math.max(0, offsetAbs);
  const range = Math.max(1e-6, max - min);
  return min + range * (1 - Math.exp((-x * span) / range));
}

/**
 * Dựng bảng màu cho cảnh 3D từ token theme + sắc riêng của kỷ.
 *
 * Cách pha giữ đúng tinh thần bộ vẽ 2D (`cityTokens.js`): **sắc kỷ luôn được pha CHỒNG LÊN nền
 * theo theme** thay vì dùng thẳng, nhờ vậy nó tự sáng lên ở theme sáng và tự chìm xuống ở theme
 * tối mà không cần hai bảng màu. Ở đây làm y hệt, chỉ khác là trộn bằng số thay vì bằng alpha.
 *
 * @param {object} input
 * @param {object} input.tokens `{canvas2, ink, line, accent}` — chuỗi CSS đã đọc từ DOM
 * @param {string} input.eraColor `ERA_METADATA[era].accentColor`
 * @returns {{background:number, ground:number, groundAlt:number, wall:number, roof:number,
 *            edge:number, sky:number, sun:number, isDark:boolean}}
 */
export function buildScenePalette({ tokens, eraColor, era: eraNumber, daylight } = {}) {
  const t = { ...FALLBACK_TOKENS, ...(tokens ?? {}) };
  const base = parseCssColor(t.canvas2) ?? parseCssColor(FALLBACK_TOKENS.canvas2);
  // ⚠️ TÊN BIẾN NÀY TỪNG LÀ `era`, VÀ CÁI TÊN ẤY ĐÃ GIẾT HAI TÍNH NĂNG TRONG IM LẶNG.
  // Tham số vào tên là `era` (một SỐ KỶ) nhưng bị đổi tên thành `eraNumber` ngay ở dòng khai báo,
  // rồi một `const era` khác — một MÀU — được gán đè ngay bên dưới. Từ đó, mọi dòng viết
  // `getXxxStyle(era)` trong thân hàm này trông hoàn toàn đúng và thật ra đang truyền một OBJECT
  // MÀU vào một hàm chờ một số kỷ. Cả `getFloraStyle` lẫn `getHumanStyle` đều rơi về kỷ 1 cho
  // dữ liệu lạ (đúng thiết kế: không ném lỗi giữa màn hình Thành Phố), nên **không có gì đỏ lên**
  // — chỉ có 15 kỷ dùng chung một màu lá và một màu vải. Xem `palette3d.test.js`, mục 15 KỶ 15 MÀU.
  // ⇒ Nay nó tên `sacKy` (SẮC của kỷ), một cái tên không thể bị nhầm với số kỷ.
  const sacKy = parseCssColor(eraColor) ?? parseCssColor(t.accent) ?? parseCssColor(FALLBACK_TOKENS.accent);
  const ink = parseCssColor(t.ink) ?? parseCssColor(FALLBACK_TOKENS.ink);

  // ⚠️ VẬT LIỆU LỢP MÁI — tra ở ĐÚNG MỘT CHỖ, ngay đây, chứ không bắt từng bên gọi tự truyền vào.
  // Có ba chỗ gọi `buildScenePalette` (`CityScene3D.jsx` và hai chỗ trong `city-preview.mjs`); bắt
  // cả ba nhớ truyền `roofColor` là dựng sẵn cái bẫy "một luật ba chỗ phát biểu" mà dự án này đã
  // trả giá nhiều lần — chỉ cần một chỗ quên là trang xem thử đóng khung khác app, và không có gì
  // đỏ lên. Truyền `era` thì bảng màu tự tra.
  // ⚠️ VẾ `?? sacKy` HÔM NAY LÀ NHÁNH CHẾT, và điều đó đáng ghi ra: `getEraStyle` rơi về kỷ 1 với
  // mọi đầu vào lạ nên `roofColor` LUÔN parse được. Chính vì nhánh này không đi tới được mà khi
  // nó còn viết `?? era` (một biến không tồn tại sau lần đổi tên) thì **không một bài test nào
  // có thể đỏ** — thứ duy nhất bắt được là `no-undef` của ESLint. Đây là mặt bù của bài học
  // *"một bất biến đúng theo cấu tạo thì không phải một cái gác"*: nhánh chết thì test bất lực,
  // và lint mới là lưới. Giữ vế này làm phòng hờ nếu `getEraStyle` đổi luật rơi về sau này.
  const roofSource = Number.isFinite(eraNumber)
    ? (parseCssColor(getEraStyle(eraNumber)?.roofColor) ?? sacKy)
    : sacKy;

  // ⚠️ MẶT ĐƯỜNG cũng tra ở ĐÚNG chỗ này, cùng lý do với mái ngay trên (Phase 7D).
  // Trước bản này `road` là MỘT mã màu viết cứng dùng chung cho cả 15 kỷ — nghĩa là con đường mòn
  // thời đồ đá và đại lộ Dubai là **cùng một mặt phẳng cùng một màu**. Đó đúng thứ Đàm cấm
  // (*"không dùng cùng một thành phố rồi đổi màu"*), và là cùng một hình dạng sai với `roofColor`
  // trước Phase 6B: một thuộc tính của VẬT LIỆU bị đóng băng thành một hằng số của giao diện.
  const roadSource = Number.isFinite(eraNumber)
    ? parseCssColor(getEraStyle(eraNumber)?.roadColor)
    : null;

  // ── Giờ trong ngày ────────────────────────────────────────────────────────
  // ⚠️ "THEME TỐI" VÀ "TRỜI ĐÃ TỐI" LÀ HAI CHUYỆN KHÁC NHAU, và gộp chúng là cái bẫy dễ mắc nhất
  // ở đây. Theme là SỞ THÍCH của Đàm (anh có thể để theme sáng lúc 11 giờ đêm); giờ là SỰ THẬT về
  // thời điểm.
  //
  // ⚠️ BẢN QUÉT 15 KỶ × 6 CHẶNG PHƠI RA MỘT NỬA CÒN THIẾU CỦA CHÍNH CÂU TRÊN, và đó là lỗi NẶNG
  // NHẤT cả bảng: luật cũ (`theme tối HOẶC trời tối`) mới chỉ lo được một chiều — theme sáng lúc
  // nửa đêm thì cảnh tối đi (đúng). Chiều ngược lại thì hỏng hoàn toàn: **để theme tối thì giữa
  // trưa cũng tối như nửa đêm**. Cả 15 kỷ ở cột 12 giờ của bảng quét theme tối đều ra một mảng
  // đen kịt, không đọc nổi hình khối.
  //
  // Cách nghĩ đúng: **thành phố là một Ô CỬA SỔ.** Cảnh nhìn qua cửa sổ không tối đi vì ta sơn
  // tường phòng màu đen — nó tối đi khi ngoài trời tối. Theme quyết định KHUNG cửa (nền thẻ, viền,
  // lớp tối góc), còn ĐỘ SÁNG BÊN TRONG khung thì do đồng hồ quyết, không do sở thích giao diện.
  // Nên: có `daylight` ⇒ ĐỒNG HỒ quyết; không có (bảo tàng, các chỗ gọi cũ) ⇒ lùi về theme y như
  // trước, nhờ vậy mọi chỗ gọi không truyền `daylight` giữ nguyên kết quả từng byte.
  const nightByClock = daylight?.phase === 'night';
  const isDark = daylight ? nightByClock : luminance(base) < 0.5;

  // Dịch góc màu + độ tươi của bầu trời theo chặng trong ngày. Mặc định (không truyền `daylight`)
  // là trung tính tuyệt đối, nên mọi chỗ gọi cũ giữ nguyên kết quả.
  // ⚠️ ĐỈNH TRỜI VÀ CHÂN TRỜI CÓ ĐÍCH RIÊNG — xem lý do đầy đủ ở `daylight.js`. Tóm tắt: đỉnh trời
  // luôn lạnh, chân trời là chỗ giữ hơi ấm; ép chung một đích thì giữa trưa chân trời ra xám chết
  // (đo được độ tươi 0,06) còn bình minh thì đỉnh trời ra nâu ô-liu.
  const skyHue = Number.isFinite(daylight?.skyHue) ? daylight.skyHue : null;
  const skyPull = Number.isFinite(daylight?.skyPull) ? daylight.skyPull : 0;
  const horizonHue = Number.isFinite(daylight?.horizonHue) ? daylight.horizonHue : skyHue;
  const horizonPull = Number.isFinite(daylight?.horizonPull) ? daylight.horizonPull : skyPull;
  const skySat = Number.isFinite(daylight?.skySaturation) ? daylight.skySaturation : 1;
  // Sắc kỷ chỉ đóng góp GÓC MÀU. Độ tươi và độ đậm của nó bị bỏ đi có chủ đích: `accentColor`
  // trong `ERA_METADATA` là màu chọn cho CHỮ trên nền tối (rất tươi, rất sáng), dùng thẳng lên
  // mặt tường sẽ ra thành phố nhựa dẻo. Ở đây chỉ mượn "kỷ này thuộc họ xanh lá / cam / tím".
  const eraHsl = rgbToHsl(sacKy);
  const eraHue = eraHsl.h;

  /**
   * ⭐ PHÉP PHA MÀU DUY NHẤT CỦA CẢ BẢNG: một sắc NEO của vật liệu, pha thêm một phần sắc kỷ,
   * **trộn trong RGB** — tức đi qua màu xám, đúng như người vẽ pha bột màu trên bảng.
   *
   * ⚠️ ĐÂY LÀ BẢN VÁ CHO CẢ MỘT HỌ LỖI, KHÔNG PHẢI MỘT LỖI. Cùng cái bẫy "xoay góc màu" đã cắn dự
   * án này BỐN lần ở bốn chỗ trông chẳng liên quan gì nhau, và bản quét đủ 15 kỷ × 6 chặng mới
   * phơi hết ra một lượt (số đo thật, kỷ nào cũng kiểm được lại):
   *   • **Mái nhà** `mixHue(eraHue, 16, 0.6)` — kỷ 5/6/8/11/12/15 ra góc màu 305–342°, tức MÁI
   *     TÍM SEN RỰC. Vì đường ngắn từ lam 215° sang đất nung 16° chạy xuyên qua vùng tím.
   *   • **Mặt đất** `mixHue(78, eraHue, 0.22)` — kỷ 5/6/8/12/13/14/15 ra 102–117°, tức CỎ NHÂN TẠO
   *     xanh rực; còn kỷ 7/11 lại ra đất nâu. Cùng họ màu lam-tím mà ra hai kết quả ngược nhau, chỉ
   *     vì chúng nằm hai bên cái mốc 180° nơi hướng đi bị lật.
   *   • **Ô cửa kính** `mixHue(eraHue, 214, 0.7)` — kỷ 4 (cam) ra 266°, tím.
   *   • **Ánh trăng** `mixHue(48, 218, 0.7)` — ra 167°, tức **trăng màu XANH LỤC**.
   * Sửa từng con số cho từng kỷ thì lỗi sẽ mọc lại ở kỷ thứ 16, hoặc ở vai màu tiếp theo ai đó
   * thêm vào. Sửa PHÉP PHA thì cả họ lỗi biến mất vĩnh viễn: trộn RGB không có khái niệm "hướng
   * đi", nên không có gì để lật, và đường thẳng nối hai màu luôn cắt qua vùng trung tính nên
   * không đầu vào nào đẻ ra được màu tím.
   *
   * Phần thưởng kèm theo, và nó chính là thứ làm ra "chất tranh": trộn RGB **tự bạc màu** ở giữa.
   * Kỷ có sắc đối lập với sắc neo thì ra màu TRẦM (mái xám tía, xám nâu), kỷ có sắc gần thì ra màu
   * TƯƠI (mái đất nung, mái vàng đất). Đó đúng là cách một hoạ sĩ pha màu bổ túc, và nó cho 15 kỷ
   * 15 sắc mái phân biệt được mà không kỷ nào rơi ra khỏi dải màu vật liệu thật.
   *
   * @param {number} hue    góc màu NEO của vật liệu
   * @param {number} eraMix pha bao nhiêu phần sắc kỷ vào (0 = không pha)
   * @param {number} sat    độ tươi (dùng chung cho cả hai màu đem trộn, nên trộn chỉ đổi SẮC)
   * @param {number} l      độ đậm (cũng dùng chung, vì lý do trên)
   */
  const blend = (hue, eraMix, sat, l) => {
    const rgb = hslToRgb({ h: hue, s: sat, l });
    return eraMix > 0 ? mixRgb(rgb, hslToRgb({ h: eraHue, s: sat, l }), eraMix) : rgb;
  };

  /**
   * ⭐ MÁI NHÀ — vai màu DUY NHẤT dùng CẢ màu kỷ (sắc + tươi + đậm), không chỉ mượn góc màu.
   *
   * ⚠️ VÌ SAO PHẢI TÁCH RA KHỎI `blend`, DÙ `blend` MỚI ĐƯỢC VÁ Ở PHASE TRƯỚC.
   * `blend` dựng màu kỷ bằng `hslToRgb({ h: eraHue, s: sat, l })` — nó giữ đúng MỘT thứ của kỷ là
   * GÓC MÀU, còn độ tươi và độ đậm thì lấy của vai màu. Với tường/đá/kính thì đúng (tường vôi thì
   * kỷ nào cũng là tường vôi). Với MÁI thì đó là chỗ hỏng, vì mái là nơi bản sắc kỷ nói to nhất.
   * Đo trên bảng quét 15 kỷ, bản cũ (`material(16, 0.40, …)`) cho ra:
   *   • 15 góc màu mái dồn vào ĐÚNG HAI CỤM: 9°–55° (9 kỷ) và 329°–342° (6 kỷ). Cả nửa vòng tròn
   *     màu từ 60° tới 320° BỎ TRỐNG.
   *   • **kỷ 5 ↔ 11 ↔ 12 cách nhau 0°** — trùng khít; kỷ 2 ↔ 9 cách 1°; kỷ 6 ↔ 15 cách 4°.
   *   • **kỷ 8 (sắc kỷ 198° lam) và kỷ 10 (sắc kỷ 0° đỏ) ra hai mái cách nhau 1°** — hai sắc kỷ
   *     cách nhau 198° mà cho ra gần như cùng một màu mái. Đó là bằng chứng gọn nhất rằng phép
   *     dựng đang XOÁ bản sắc kỷ chứ không diễn đạt nó.
   * Nguyên nhân: neo 16° (đất nung, ẤM) chỉ nhận 40% sắc kỷ, mà trộn RGB thì luôn cắt qua vùng
   * trung tính — nên mọi kỷ có sắc LẠNH (gần đối lập với 16°) đều bạc về nâu xám. Ghi chú cũ ở
   * `blend` nói phép trộn này cho "15 sắc mái phân biệt được"; điều đó chưa bao giờ được ĐO, và
   * số đo nói ngược lại. Bài học: một khẳng định về mỹ thuật mà không kèm số đo thì là dự đoán.
   *
   * ⚠️ VẪN TRỘN RGB, KHÔNG QUAY VỀ XOAY GÓC MÀU. Cả họ lỗi "tím sen" mà `blend` vừa diệt là do
   * NỘI SUY GÓC MÀU trên vòng tròn (đường ngắn có thể xuyên qua vùng tím, và lật hướng ở mốc
   * 180°). Ở đây không có phép nội suy góc màu nào: góc màu lấy THẲNG của kỷ, chỉ có độ tươi và
   * độ đậm là được kéo, mà hai đại lượng đó thì thẳng, không có vòng để mà lật.
   *
   * Ba việc nó làm, và mỗi việc chữa một triệu chứng đo được:
   *   1. `MIX = 0,80` (thay vì 0,40) — sắc kỷ áp đảo, kỷ lạnh không còn bạc thành nâu.
   *   2. **độ tươi theo kỷ** — sắc kỷ nhợt (Tăm Tối, Thế Chiến: xám lam) cho mái xám thật, sắc kỷ
   *      rực (Công Nghiệp: đỏ) cho mái đỏ gạch. Đây là thứ tách được kỷ 5 khỏi kỷ 12, hai kỷ có
   *      CÙNG góc màu 215° nên không phép xoay nào tách nổi.
   *   3. **độ đậm theo kỷ** — sắc kỷ sáng cho mái sáng hơn. Tách nốt phần còn lại của 5 ↔ 12.
   * Kết quả đo lại: cặp gần nhau nhất từ **0,0 → 8,4**; 15 góc màu trải từ 3° tới 307° thay vì dồn
   * hai cụm. Trần độ tươi 0,62 giữ đúng hướng mỹ thuật trầm (Townscaper), không cho mái nhựa dẻo.
   */
  const roofHsl = rgbToHsl(roofSource);
  const eraRoof = (sat, light) => {
    // Độ tươi: một phần của vai màu + phần còn lại kéo theo độ tươi của sắc kỷ. Kẹp hai đầu để kỷ
    // nhợt nhất vẫn còn là một màu (không thành xám chì) và kỷ rực nhất vẫn là ngói (không nhựa).
    //
    // ⚠️ HỆ SỐ NỀN 0,52 CHỨ KHÔNG PHẢI 0,30 — sửa 2026-08-13 sau khi đo trên ẢNH CHỤP THẬT, không
    // phải trên bảng màu. Với 0,30 thì **13/15 kỷ đã chạm trần 0,62 rồi**, tức chính cái trần mới
    // là thứ quyết định độ tươi của chúng; chỉ đúng hai kỷ xám-lam (kỷ 5 `#94a3b8` s=0,20 và kỷ 12
    // `#64748b` s=0,16) rơi xuống 0,29/0,26 — và ĐÓ mới là vấn đề. Bảng màu thì hai kỷ ấy vẫn cách
    // nhau đủ xa, nhưng trên màn hình giữa trưa, một mái lam nhợt bị nắng ấm + ánh phản từ cỏ rửa
    // trôi hết phần lam và ra **cùng một mảng olive**: đo được kỷ 5 `#5d6545` ↔ kỷ 12 `#6b714d`,
    // cách nhau **7,2/255** — dưới hẳn ngưỡng mắt (~12). Nâng nền lên 0,52 thì hai kỷ ấy lên
    // 0,40/0,37, đủ chroma để sắc lam sống sót qua tầng ánh sáng.
    // ⚠️ ĐÂY KHÔNG PHẢI NỚI HẰNG SỐ CHO VỪA Ý: nó chỉ chạm tới **3/15 kỷ** (5, 12, và 14 nhích từ
    // 0,601 lên đúng cùng trần với 12 kỷ kia). Mười hai kỷ còn lại ra số y hệt trước, vì chúng đã
    // bị trần kẹp từ trước. Tức là thay đổi này KHÔNG làm cả thành phố tươi hơn — nó chỉ kéo hai
    // kỷ bị bỏ rơi ở đáy lên ngang hàng.
    // ⚠️ HAI ĐƯỜNG TÍNH, VÀ ĐÂY LÀ LÝ DO — không phải một ngoại lệ cho tiện.
    // Cả cụm công thức bên dưới sinh ra để làm MỘT việc: ghìm một màu NHẤN GIAO DIỆN (rất tươi,
    // rất sáng, chọn cho chữ trên nền tối) xuống thành một thứ trông như vật liệu lợp. Khi nguồn
    // ĐÃ LÀ vật liệu lợp thật thì đúng cái phép ghìm ấy quay ra bóp méo sự thật — đo được:
    // bê tông Nakagin `#c3beb6` (độ tươi 0,10, độ sáng 0,74) đi qua nó ra `#9e7e50`, tức một mảng
    // NÂU; champagne Dubai `#d0c295` ra vàng kim. Nguyên nhân số học: nền `sat * 0.52` đẩy mọi
    // vật liệu XÁM lên độ tươi ≥ 0,26, mà xám thì cả điểm hay của nó là KHÔNG tươi.
    // ⇒ Có `era` (biết vật liệu) → đi thẳng, chỉ nhân độ sáng theo theme. Không có → giữ nguyên
    // đường cũ từng byte, nên bảo tàng và mọi chỗ gọi cũ không đổi một pixel nào.
    if (Number.isFinite(eraNumber)) {
      // `light` là 0,39 ở theme sáng và 0,32 ở theme tối ⇒ tỉ số 0,82: theme tối làm mái tối đi
      // khoảng một phần năm, đủ để chìm vào nền tối mà không mất màu.
      const ls = Math.min(0.68, Math.max(0.14, roofHsl.l * (light / 0.39)));
      const ss = Math.min(ROOF_MAX_SATURATION, Math.max(0.04, roofHsl.s));
      const direct = hslToRgb({ h: roofHsl.h, s: ss, l: ls });
      // Lưới chặn tím sen vẫn giữ nguyên và vẫn dùng ĐÚNG phép thử của bài test (quan hệ kênh, KHÔNG
      // phải cửa sổ góc màu) — xem đoạn dài ở cuối hàm. Không vật liệu nào trong bảng nằm ở dải tím,
      // nhưng bỏ lưới đi thì ngày ai đó thêm một kỷ mái tím rực sẽ không có gì chặn.
      if (Math.min(direct.r, direct.b) - direct.g > 10) {
        return rgbToHexNumber(hslToRgb({ h: roofHsl.h, s: Math.min(ss, 0.40), l: ls }));
      }
      return rgbToHexNumber(direct);
    }

    const base = Math.min(0.62, Math.max(0.14, sat * 0.52 + sat * 0.70 * 2 * roofHsl.s));
    // Độ đậm: nhích theo độ sáng của sắc kỷ quanh mốc 0,6 (mốc trung bình của bảng `ERA_METADATA`).
    // ⚠️ HỆ SỐ 0,55 CHỨ KHÔNG PHẢI 0,22 — sửa 2026-08-13 sau khi duyệt đủ 105 CẶP kỷ.
    // Bảng `ERA_METADATA` có hai kỷ dùng gần như cùng một sắc: kỷ 5 `#94a3b8` và kỷ 12 `#64748b`
    // đều là xám-lam **góc màu 215°**, chỉ khác ĐỘ SÁNG (0,65 vs 0,47). Với hệ số 0,22 thì chênh
    // lệch 0,18 ấy bị nén còn **0,04** trên mái ⇒ hai kỷ ra gần như cùng một mái (đo được 8,4 —
    // cặp gần nhau nhất trong cả 105 cặp). Nâng hệ số lên 0,55 thì chênh lệch còn lại ~0,10, đủ
    // để mắt đọc ra: số cặp mái nằm dưới ngưỡng nhìn-thấy-khác-nhau tụt từ **5 xuống 2**.
    // Đây KHÔNG phải nới một hằng số cho vừa ý: nó đúng với chính lý do `roof` dùng `eraRoof` thay
    // vì `material` — *"mái phải dùng CẢ màu kỷ chứ không chỉ mượn góc màu"*. Độ sáng cũng là một
    // phần của màu, mà bản cũ gần như vứt bỏ nó. Cận trên/dưới vẫn kẹp ở [0,24 … 0,56] nên mái
    // không bao giờ rơi ra khỏi dải vật liệu lợp thật.
    const l = Math.min(0.56, Math.max(0.24, light + (roofHsl.l - 0.6) * 0.55));
    // ⚠️ NEO ĐẤT NUNG CHỈ CÒN NGẤM 0,06 KHI ĐÃ CÓ VẬT LIỆU THẬT (trước là 0,20).
    // Cái neo `h: 16` sinh ra để kéo một màu NHẤN GIAO DIỆN bất kỳ về "họ vật liệu lợp"; khi nguồn
    // đã CHÍNH LÀ vật liệu lợp thì neo ấy chỉ còn là một lớp bụi ấm làm sai lệch sự thật — nó kéo
    // đá phiến Wales và kẽm Paris ngả nâu, đúng thứ vừa mất công đi sửa. Không có `era` (bảo tàng,
    // chỗ gọi cũ) thì giữ nguyên 0,20 để kết quả cũ không đổi một byte.
    const anchorMix = Number.isFinite(eraNumber) ? 0.94 : 0.80;
    const mix = (s) => mixRgb(
      hslToRgb({ h: 16, s, l }),        // neo đất nung — giữ mái nằm trong họ vật liệu lợp thật
      hslToRgb({ h: roofHsl.h, s, l }),
      anchorMix,
    );

    // ⚠️ TRẦN RIÊNG CHO DẢI TÍM — KHÔNG PHẢI NGOẠI LỆ CHO VUI, MÀ LÀ MỘT SỰ THẬT VỀ VẬT LIỆU.
    // Bốn kỷ 6/7/11/15 có sắc kỷ nằm trong cung tím, nên cho chúng mái tím là ĐÚNG bản sắc. Nhưng
    // sắc tố ĐẤT thì không bao giờ rực: mái mận chín / rượu vang (madder lake, caput mortuum) có
    // thật và đẹp, còn một mảng hồng cánh sen tươi rói thì mắt đọc ra nhựa dẻo. Bài test "KHÔNG một
    // vai màu nào ra TÍM SEN RỰC" khoá đúng ranh giới đó ở độ tươi 0,42 — và nó đã bắt được bản
    // đầu của chính hàm này (kỷ 6/7/11 ra 0,51–0,54). Trần ở đây là cách trả lời ĐÚNG cho bài test
    // đó: giữ nguyên GÓC MÀU (tức giữ bản sắc kỷ, ba kỷ vẫn phân biệt được nhau ở 268°/284°/307°)
    // và chỉ hạ ĐỘ TƯƠI. Nếu thay vào đó đi nới ngưỡng của bài test kia thì mới là phá bất biến.
    // ⚠️ ĐIỀU KIỆN PHẢI GIỐNG HỆT BÀI TEST, KHÔNG ĐƯỢC PHÁT BIỂU LẠI BẰNG CÔNG THỨC KHÁC.
    // Bản cũ chặn theo CỬA SỔ GÓC MÀU `h >= 255 && h <= 340`, trong khi bài test "KHÔNG một vai màu
    // nào ra TÍM SEN RỰC" lại định nghĩa "vào dải tím" bằng quan hệ kênh: **đỏ và lam đều cao hơn
    // lục**. Hai cách nói CHỒNG NHAU nhưng không TRÙNG nhau, và cái khe giữa chúng đã cắn thật: mái
    // kỷ 15 ra góc màu **247°** — ngoài cửa sổ nên không bị hạ tươi — mà vẫn thoả điều kiện kênh
    // của bài test, ra `#4b40a3` tươi 0,44 (trần 0,42). Đúng họ với lỗi `horizonHue < 60` vs hàm
    // `warm()` ở `daylight.test.js` cùng ngày: **một luật mà hai công thức thì bản lỏng hơn sẽ âm
    // thầm để lọt.** Nay dùng chung đúng một phép thử với bài test.
    const inMagentaBand = (rgb) => Math.min(rgb.r, rgb.b) - rgb.g > 10;
    const first = mix(base);
    return rgbToHexNumber(inMagentaBand(first) ? mix(Math.min(base, 0.40)) : first);
  };

  /** Vai màu vật liệu = neo + sắc kỷ, chọn độ đậm theo trời sáng hay trời tối. */
  const material = (hue, eraMix, sat, lightLight, lightDark) => (
    rgbToHexNumber(blend(hue, eraMix, sat, isDark ? lightDark : lightLight))
  );

  /**
   * Kéo một màu trời về phía sắc trời của chặng — **đi vòng qua màu TRUNG TÍNH, không đi vòng qua
   * màu tím.** Không có `daylight` ⇒ giữ nguyên y hệt bản cũ.
   *
   * ⚠️ ĐÂY LÀ LẦN SỬA THỨ HAI CỦA CÙNG MỘT CHỖ, VÀ LẦN NÀY SỬA VÀO GỐC. Bản đầu cộng thẳng offset
   * độ (`skyShift`) — hỏng vì mỗi theme xuất phát từ một góc màu khác nhau. Bản thứ hai nội suy
   * GÓC MÀU về một đích cố định — vẫn hỏng, và ảnh chụp chỉ ra ngay: chân trời giữa trưa ra
   * `#e0b8c9` (hồng), đỉnh trời lúc bình minh/hoàng hôn ra `#cf63c2` (tím sen). Lý do: nội suy góc
   * màu luôn đi ĐƯỜNG NGẮN trên vòng tròn màu, mà từ lam (232°) sang cam bình minh (22°) thì
   * đường ngắn chạy XUYÊN QUA MÀU TÍM. Tệ hơn, chân trời trưa (28°) và đích (210°) cách nhau gần
   * đúng 180° — chỗ hai đường dài bằng nhau — nên hướng đi thành ra ngẫu nhiên.
   *
   * Cách của người vẽ: từ cam sang lam thì **đi qua màu xám**, không đi qua màu tím. Trộn trong
   * không gian RGB làm đúng như vậy — đường thẳng nối hai màu luôn cắt qua vùng trung tính. Nhờ
   * thế trưa ra chân trời xám-ấm mờ sương (đúng thực tế), còn tím sen thì KHÔNG THỂ xuất hiện nữa,
   * dù có ai thêm chặng mới với góc màu nào đi nữa. Sửa cách trộn = diệt cả một họ lỗi, thay vì
   * chỉnh số cho từng chặng.
   *
   * ⚠️ SẮC KỶ CŨNG TRỘN Ở ĐÂY (`eraMix`), KHÔNG trộn sẵn bằng `mixHue` trước khi gọi — và đây là
   * lần thứ BA cùng một họ lỗi lộ ra, ở một chỗ tưởng chẳng liên quan. Bài test bắt được `#45395f`
   * (đèn bán cầu lúc rạng sáng, kỷ màu cam): `mixHue(206, 20, 0.2)` ra **240° — TÍM**, tức là pha
   * 20% màu cam vào trời lam lại làm nó tím đi, xa màu cam hơn lúc chưa pha. Vẫn đúng cái bẫy
   * "đường ngắn trên vòng tròn màu" (206° và 20° cách nhau 174°, sát mức lật hướng).
   *
   * Nên NGUYÊN ĐƯỜNG DỰNG MÀU TRỜI nay không còn phép xoay góc màu nào: sắc nền → pha sắc kỷ →
   * kéo về sắc chặng, cả ba bước đều trộn trong RGB. Góc màu vẫn tuyệt vời cho vật liệu (tường,
   * mái, đá — xem `paint` ở dưới, nơi các góc màu đều gần nhau nên không bao giờ lật hướng), chỉ
   * riêng bầu trời là chỗ hai đầu màu hay nằm đối diện nhau trên vòng tròn.
   *
   * @param {number} hue      góc màu nền của bầu trời
   * @param {number} eraMix   pha bao nhiêu phần sắc kỷ vào (0 = không pha)
   * @param {number} sat      độ tươi
   * @param {number} lightL   độ đậm ở trời sáng
   * @param {number} lightD   độ đậm ở trời tối
   * @param {string} band     `'top'` = theo đích ĐỈNH trời · `'horizon'` = theo đích CHÂN trời
   * @param {number} strength hệ số nhân vào sức kéo (dùng cho những thứ chỉ ăn theo trời một phần)
   */
  const skyward = (hue, eraMix, sat, lightL, lightD, band = 'top', strength = 1) => {
    const l = isDark ? lightD : lightL;
    // Giữ cùng độ tươi và độ đậm cho cả ba màu đem trộn: nhờ vậy phép trộn chỉ đổi SẮC, không vô
    // tình làm bầu trời sáng lên hay tối đi — độ đậm đã do `lightL`/`lightD` quyết một mình.
    const rgb = blend(hue, eraMix, sat, l);
    const target = band === 'horizon' ? horizonHue : skyHue;
    const pull = band === 'horizon' ? horizonPull : skyPull;
    if (target === null) return rgbToHexNumber(rgb);
    const t = Math.min(1, Math.max(0, pull * strength));
    // ⚠️ XOAY SẮC BẰNG VECTOR, KHÔNG TRỘN TRONG RGB — đây là bản vá 2026-08-13, đọc trước khi đổi.
    // Hai đầu đem trộn có CÙNG độ tươi và CÙNG độ đậm (xem chú thích ngay trên), chỉ khác SẮC. Vậy
    // phép đúng là xoay sắc. Nhưng `mixRgb` thì kéo thẳng qua giữa không gian RGB, mà đường thẳng
    // nối hai sắc gần ĐỐI NHAU (ấm 40° ↔ lạnh 205°) đi xuyên qua vùng TRUNG TÍNH ⇒ ra XÁM chứ
    // không ra sắc đích. Đo thật lúc phát hiện: giữa trưa đặt `skyHue: 212` lực kéo 0,70 — mạnh
    // nhất cả ngày — mà đỉnh trời vẫn ra `#b1a790`, tức **41° vàng nâu**; ép lực kéo lên còn tệ hơn
    // (0,78 → `#9ca7a3`, 157° lục-lam, độ tươi 0,05). Cùng đúng họ lỗi đã sửa cho MÁI NHÀ ở
    // Phase 3N: **trộn RGB thì đi qua trung tính, và trung tính giết bản sắc.**
    // Cách chữa: coi sắc là một VECTOR trên vòng tròn màu, nội suy HƯỚNG của nó, rồi **trả lại
    // nguyên độ tươi và độ đậm của gốc**. Hướng cư xử y như trực giác (bên nào nặng cân hơn thì
    // thắng, nên cảnh ĐÊM giữ nguyên như trước), còn độ tươi thì không bao giờ bị bóp chết nữa.
    // ⚠️ `t === 0` cho ra ĐÚNG TỪNG BYTE như bản cũ (sắc/tươi/đậm đều là của gốc) — nhờ vậy mọi
    // chỗ không khai `pull` giữ nguyên kết quả, và bài test khoá điều đó.
    const base = rgbToHsl(rgb);
    const RAD = Math.PI / 180;
    const x = (1 - t) * Math.cos(base.h * RAD) + t * Math.cos(target * RAD);
    const y = (1 - t) * Math.sin(base.h * RAD) + t * Math.sin(target * RAD);
    // ĐỘ DÀI của vector tổng chính là "phép trộn này có ý nghĩa tới đâu": hai sắc cùng hướng thì
    // dài 1, hai sắc ĐỐI NHAU thì triệt tiêu về 0.
    const mag = Math.hypot(x, y);
    // Hai sắc đối nhau đúng 180° ở t = 0,5 thì `atan2(0, 0)` trả về 0° (ĐỎ) — một màu chẳng liên
    // quan gì tới cả hai đầu. Quá ngắn thì bỏ phép xoay, chọn hẳn một bên.
    const hueOut = mag < 1e-6
      ? (t >= 0.5 ? target : base.h)
      : ((Math.atan2(y, x) / RAD) % 360 + 360) % 360;
    // ⚠️ VÀ ĐÂY LÀ THỨ TRẢ LẠI LỜI BẢO ĐẢM "BẦU TRỜI KHÔNG BAO GIỜ TÍM" — đừng gỡ.
    // Xoay sắc thì reo được màu xanh, nhưng nó mang về một tật của phép nội suy góc: hướng đi luôn
    // men theo CUNG NGẮN của vòng tròn màu, mà cung ngắn giữa lam (≈213°) và cam bình minh (18°)
    // chạy XUYÊN QUA VÙNG TÍM. Bản đầu của Phase 3V trả lại NGUYÊN độ tươi gốc cho mọi trường hợp,
    // và bài test quét đủ 15 kỷ bắt ngay: 5 giờ sáng, kỷ 6 (sắc kỷ tím `#a78bfa`), mặt nước ra
    // `#bd818e` — hồng phấn ngả tím. Đó là LẦN THỨ TƯ của cùng một họ lỗi (xem `ARCHITECTURE.md`).
    // Chữa bằng chính `mag`: khi hai sắc gần đối nhau thì vector tổng NGẮN, nghĩa là phép trộn gần
    // như vô nghĩa — lúc đó phải NHẠT DẦN VỀ XÁM, đúng "cách của người vẽ" mà bản trộn RGB ngày
    // trước làm được. Khi lực kéo đủ mạnh về một phía (`mag` cao) thì giữ nguyên độ tươi, nên bầu
    // trời xanh giữa trưa KHÔNG mất gì.
    // ⚠️ Mốc 0,5 chọn theo số đo, không theo cảm tính: giữa trưa `mag` = 0,70 và bình minh 0,98 —
    // cả hai vượt mốc nên giữ nguyên độ tươi (đúng bộ số đã đo và đã duyệt bằng mắt); còn ca hỏng
    // ở trên chỉ `mag` = 0,18 nên bị kéo xuống còn hơn một phần ba độ tươi. Buổi sáng nằm sát mốc
    // (0,45) nên bị nhạt ~10% — đã bù lại bằng `morning.skySaturation` ở `daylight.js`.
    const chromaSafe = Math.min(1, mag / 0.5);
    return rgbToHexNumber(hslToRgb({ h: hueOut, s: base.s * chromaSafe, l: base.l }));
  };
  // Hơi ấm của nắng: −1 lạnh … +1 ấm. Đổi GÓC MÀU của mặt trời và của ánh sáng dội lại từ đất.
  const warmth = Number.isFinite(daylight?.sunWarmth) ? daylight.sunWarmth : 0.3;
  /**
   * Đèn trong nhà đang cháy mạnh cỡ nào (0 = tắt … 1 = đêm sâu). Không có `daylight` ⇒ 1, để mọi
   * chỗ gọi cũ giữ nguyên kết quả từng byte (khi đó cửa sổ cũng không hề được bật, xem `sceneGraph`).
   */
  const glow = Number.isFinite(daylight?.lampEnergy) ? daylight.lampEnergy : 1;

  // Vai màu = (góc màu, độ tươi, độ đậm). Nhiệt độ được cài vào từng vai:
  // mái ngả về đỏ đất nung (16°), đá ngả về vàng ấm (40°), kính ngả về xanh lạnh (205°),
  // cây ngả về xanh lá (108°). Đây chính là cấu trúc ẤM–LẠNH làm nên chiều sâu của một bức tranh:
  // vật ấm tiến ra trước, vật lạnh lùi ra sau, dù tất cả cùng nằm trên một mặt phẳng màn hình.
  const paint = (hue, sat, lightLight, lightDark) => rgbToHexNumber(hslToRgb({
    h: hue, s: sat, l: isDark ? lightDark : lightLight,
  }));

  // ⚠️ ĐỘ ĐẬM Ở ĐÂY LÀ THỨ QUYẾT ĐỊNH "CÓ RA TRANH KHÔNG", không phải góc màu.
  // Bản đầu để tường 0.76 / diềm 0.88 và ảnh chụp thử ra một thành phố bạc phếch như tượng thạch
  // cao. Một bức tranh sơn dầu có KHOẢNG SÁNG-TỐI RỘNG: chỗ sáng nhất và chỗ tối nhất cách nhau
  // xa, phần lớn diện tích nằm ở quãng giữa. Các con số dưới đây đã kéo xuống cho đúng như vậy.
  // ⚠️ TƯỜNG NEO VÀO SẮC ẤM (36°), CHỈ PHA MỘT CHÚT SẮC KỶ — đây là sửa lỗi từ ảnh chụp thử:
  // kỷ 7 có `accentColor` tím, lấy thẳng làm màu tường thì ra cả thành phố tím lịm, không giống
  // bất cứ thứ gì xây bằng vật liệu thật. Vật liệu xây dựng của MỌI thời đại đều nằm trong dải ấm
  // (đất nung, vôi vữa, đá vôi, bê tông, gỗ) — bản sắc của kỷ nằm ở MÁI, ở chi tiết và ở HÌNH
  // DÁNG, không nằm ở màu tường. Trộn 0,18 giữ đủ để 15 kỷ vẫn khác nhau khi đặt cạnh nhau.
  const WALL_ANCHOR = 36;
  /** Bao nhiêu phần sắc kỷ được phép ngấm vào tường. Thấp có chủ ý — xem đoạn ghi chú ngay trên. */
  const WALL_ERA = 0.18;

  // Thảm thực vật của kỷ — nguồn của hai vai `leaf`/`leaf2` ngay dưới. Xem ghi chú tại chỗ.
  // ⚠️ `eraNumber`, KHÔNG PHẢI `era`. Xem khối cảnh báo ở chỗ khai `sacKy`: hai dòng này từng
  // truyền một object MÀU vào đây, và cả 15 kỷ nhận về bảng của kỷ 1.
  const flora = getFloraStyle(eraNumber);
  const human = getHumanStyle(eraNumber);
  // Theme tối cắt độ tươi đi một nửa: ban đêm mắt người gần như không đọc được sắc ở vùng tối
  // (thị giác chuyển sang tế bào que), nên giữ nguyên độ tươi chỉ làm tán lá thành mảng xanh giả.
  const leafSat = isDark ? flora.leafSat * 0.52 : flora.leafSat;

  const roles = {
    wall:  material(WALL_ANCHOR, WALL_ERA, isDark ? 0.24 : 0.23, 0.70, 0.44),
    wall2: material(WALL_ANCHOR, WALL_ERA, isDark ? 0.20 : 0.19, 0.62, 0.37),
    // ⚠️ MÁI DÙNG `eraRoof`, KHÔNG DÙNG `material` — xem giải thích đầy đủ ở `eraRoof` phía trên.
    // Tóm tắt: mái là chỗ sắc kỷ nói to nhất, nên nó phải dùng CẢ màu kỷ chứ không chỉ mượn góc
    // màu. Bản cũ (`material(16, 0.40, …)`) đo ra 15 mái dồn vào đúng HAI cụm, ba cặp trùng khít.
    roof:  eraRoof(isDark ? 0.48 : 0.50, isDark ? 0.32 : 0.39),
    trim:  material(WALL_ANCHOR, WALL_ERA, isDark ? 0.14 : 0.13, 0.76, 0.54),
    // Đá vôi/đá xây: gần như trung tính, chỉ ngấm một chút sắc kỷ. Đá lấy ở đâu thì màu nấy, nó
    // không đổi theo thời đại nhiều như ngói.
    stone: material(39, 0.08, 0.12, 0.60, 0.42),
    wood:  paint(26, isDark ? 0.36 : 0.42, 0.34, 0.29),
    gold:  paint(44, isDark ? 0.60 : 0.66, 0.58, 0.50),
    // ⚠️ CỬA SỔ LÀ LỖ THỦNG, KHÔNG PHẢI TẤM NHỰA XANH.
    // Bản trước để `l: 0.52` với độ tươi 0,36 và ảnh chụp cho ra những phiến xanh cô-ban dán lên
    // mặt tường — dấu hiệu "đồ hoạ game" rõ nhất trong cả khung hình, và đúng thứ Đàm gọi là
    // "không đẹp". Nhìn từ ngoài vào ban ngày, cửa sổ gần như ĐEN: bên trong tối hơn ngoài trời
    // rất nhiều, kính chỉ hắt lại một chút sắc trời. Hạ độ đậm xuống sâu và cắt gần hết độ tươi
    // thì mặt tiền lập tức có CHIỀU SÂU — mắt đọc ra hốc lõm thay vì hình dán.
    glass: material(214, 0.30, isDark ? 0.20 : 0.16, 0.26, 0.14),
    // Mặt nước: SÁNG hơn kính hẳn một quãng và tươi hơn. Trước đây ao mượn chung vai `glass` nên
    // nó tối như một ô cửa — mà ao thì NGỬA LÊN TRỜI, nó nhận trọn ánh sáng bầu trời và phải là
    // mảng sáng nhất mặt đất, đúng như mọi vũng nước ngoài đời.
    //
    // ⚠️ VÀ VÌ ĐÚNG LÝ DO ĐÓ, NƯỚC PHẢI ĐI THEO BẦU TRỜI — `skyward`, không phải `material`. Bản
    // quét bắt được: mặt nước ra ĐÚNG MỘT MÀU `#7f9ebd` ở cả 6 giờ sáng, 8 giờ, 12 giờ, 15 giờ lẫn
    // 18 giờ. Một mảng lam nhạt y hệt nhau suốt cả ngày, trong khi trời quanh nó đổi từ hồng sang
    // lam sang vàng cam — nên mắt không đọc ra "mặt nước" mà đọc ra "miếng dán màu lam". Ao thì
    // không có màu riêng: nó chỉ là bầu trời nhìn từ dưới lên. Nay bình minh nước ánh hồng, giữa
    // trưa nước lam trong, hoàng hôn nước ánh cam, đêm nước lam sâu — miễn phí, vì đã có sẵn đích
    // trời của từng chặng.
    //
    // ⚠️ BÁM CHÂN TRỜI, KHÔNG BÁM ĐỈNH TRỜI — thử cả hai rồi mới chốt. Bám đỉnh trời nghe có lý
    // hơn về mặt vật lý (nhìn từ trên cao xuống thì ao hắt lại khoảng trời ngay trên đầu nó),
    // nhưng đo ra thì cả ngày nước chỉ đổi từ `#8298bd` sang `#819ebd` — mắt không thấy gì, vì
    // đỉnh trời thì chặng nào ban ngày cũng lam. Mà đúng cái khoảnh khắc mặt nước ĐẸP nhất ngoài
    // đời — bình minh và hoàng hôn, khi ao bắt lửa cả một mảng cam hồng — lại là lúc sắc ấm nằm ở
    // DẢI SÁT CHÂN TRỜI. Chọn cái đọc ra được bằng mắt.
    water: skyward(202, 0.12, isDark ? 0.26 : 0.32, 0.62, 0.34, 'horizon', 0.8),
    // ⚠️ MÀU LÁ ĐỌC TỪ `floraStyle.js`, KHÔNG VIẾT CỨNG Ở ĐÂY (Phase 8D).
    // Bản cũ là `material(88, 0.20, …)` — một góc màu xanh lá duy nhất cho cả 15 kỷ, nên rừng vân
    // sam Nga, cọ sa mạc UAE và cây ám bồ hóng Manchester ra đúng một màu. Nhưng lý do đặt con số
    // ở BẢNG THỰC VẬT chứ không sửa tại chỗ này thì sâu hơn: màu lá là thuộc tính của LOÀI đang
    // mọc, mà danh sách loài nằm ở `floraStyle.js`. Khai màu ở đây thì ngày nào có người đổi loài
    // của một kỷ, màu sẽ đứng yên và không có gì đỏ lên — đúng cái bẫy "một luật hai chỗ khai" mà
    // `roofColor` đã phải dọn ở Phase 6B.
    //
    // Sắc kỷ chỉ ngấm 0,10 (bản cũ 0,20): nay chính GÓC MÀU đã mang bản sắc kỷ rồi, mượn thêm
    // màu nhấn giao diện chỉ kéo 15 kỷ xích lại gần nhau — cùng lý lẽ với `WALL_ERA` ở trên.
    leaf:  material(flora.leafHue, 0.10, leafSat, 0.33, 0.28),
    // Mặt lá trong bóng: cùng họ màu, ĐẬM hơn và bớt tươi. Chênh lệch phải đủ để đọc ra hai lớp
    // tán chồng nhau, nhưng không được thành hai loài cây khác nhau — nên lệch góc màu chỉ 6°.
    leaf2: material(flora.leafHue - 6, 0.10, leafSat * 0.88, 0.23, 0.19),
    // Bóng tối sâu nhất. Gần như đen ở mọi kỷ nên góc màu hầu như không đọc ra, nhưng vẫn pha bằng
    // `material` cho nhất quán — không để sót một chỗ nào dùng thẳng sắc kỷ chưa qua bảng pha.
    dark:  material(24, 0.45, 0.24, 0.19, 0.09),
    // Da người. KHÔNG pha sắc kỷ vào — người thì thời nào cũng cùng một màu, và đây chính là chỗ
    // để mắt bám vào: một chấm ấm, nhạt, KHÔNG thuộc họ màu của công trình xung quanh, nhờ vậy
    // đọc ra "người" giữa một rừng tường và mái. Sáng hơn hẳn ở cả hai theme vì ở cỡ vài điểm ảnh,
    // độ SÁNG là thứ duy nhất phân biệt được, không phải sắc.
    skin:  paint(30, 0.30, 0.78, 0.66),
    // ⚠️ MÀU VẢI ĐỌC TỪ `humanStyle.js`, KHÔNG VIẾT CỨNG Ở ĐÂY — y hệt lý do màu lá đọc từ
    // `floraStyle.js` ngay bên trên. Màu quần áo là thuộc tính của NGHỀ NHUỘM thời ấy (thuốc
    // khoáng đục thời cổ, thuốc aniline rực từ giữa thế kỷ 19), không phải một lựa chọn hoà sắc.
    // Khai ở đây thì ngày nào có người thiết kế lại trang phục của một kỷ, màu sẽ đứng yên và
    // không có gì đỏ lên.
    //
    // ⚠️ VÀ CỐ Ý KHÔNG PHA SẮC KỶ (`eraMix` = 0, dùng `paint` chứ không dùng `material`). Cư dân
    // phải TÁCH ra khỏi họ màu của tường và mái để mắt bám vào được — đúng lý do dòng `skin` ngay
    // trên cũng không pha. Pha vào thì người chìm nghỉm vào chính cái thành phố họ đang đi trong đó.
    cloth: paint(human.cloth.hue, human.cloth.sat, human.cloth.light, human.cloth.light * 0.72),
    // Vải phụ (đội đầu, viền): cùng họ, ĐẬM hơn để đầu tách khỏi thân ở cỡ vài điểm ảnh.
    cloth2: paint(human.cloth.hue - 8, human.cloth.sat * 0.9, human.cloth.light * 0.66,
      human.cloth.light * 0.48),
    // SỢI MỘC: lá cọ, rơm, cói, vải lanh/bông chưa nhuộm hoặc đã tẩy nắng.
    // ⚠️ CỐ Ý KHÔNG THEO KỶ, và lý lẽ ở đây MẠNH hơn ở `hair`/`gear`: thứ làm cho mọi vật liệu
    // trong nhóm này giống nhau chính là **sự VẮNG MẶT của thuốc nhuộm**. Nón lá Việt, mũ rơm
    // Firenze, khăn lanh Đức và khăn ghutra UAE nhạt vì cùng một lý do vật lý, không phải vì ai đó
    // chọn cho chúng cùng một màu.
    // ⚠️ VÀ NÓ PHẢI TÁCH KHỎI `skin`, nếu không thì một cái mũ nhạt đội trên một cái đầu nhạt sẽ
    // đọc ra thành một cái đầu trọc to. Nên: vàng hơn (46° so với 30°), nhạt hơn, ít tươi hơn —
    // có bài test đo đúng khoảng cách này ở `palette3d.test.js`.
    straw: paint(46, 0.24, 0.86, 0.70),
    // Tóc: nâu rất đậm, không theo kỷ. Tóc thì thời nào cũng cùng một dải màu.
    hair: paint(22, 0.34, 0.22, 0.17),
    // Đồ mang theo: gỗ, xương, kim loại xỉn. Phải TỐI hơn cả vải để cái giáo đọc ra là một vệt
    // riêng chứ không dính vào tay áo.
    gear: paint(28, 0.26, 0.34, 0.26),
    // Ô cửa ĐANG SÁNG ĐÈN (chỉ dùng khi trời đã tối — xem `daylight.js`).
    // ⚠️ Vẽ bằng vật liệu KHÔNG nhận ánh sáng, nên màu này hiện ra Y NGUYÊN chứ không bị nhân với
    // ánh sáng cảnh. Vì vậy nó phải là màu của **ánh đèn nhìn từ xa** — vàng ấm, sáng nhưng không
    // trắng loá. Chọn trắng thì cả thành phố thành bảng đèn LED; chọn quá trầm thì không ai thấy
    // là đèn. Cố ý KHÔNG pha sắc kỷ: bóng đèn thời nào cũng vàng.
    //
    // ⚠️ ĐỘ SÁNG PHẢI ĐI THEO CHẶNG, KHÔNG PHẢI BẬT/TẮT — bản quét bắt được ở cột bình minh.
    // Vì vật liệu này không nhận ánh sáng cảnh, một ô cửa lúc 6 giờ sáng sáng Y HỆT lúc 10 giờ
    // đêm. Trên nền trời đã hửng sáng thì nó không còn đọc ra "trong nhà có đèn" nữa mà thành
    // **vệt vàng chói loà**, át hết cả công trình — nhìn kỷ 14 và 15 ở cột 6 giờ của bản quét cũ
    // là thấy ngay: cả thành phố trông như đang cháy. Ngoài đời thì ngược lại, trời càng sáng thì
    // đèn trong nhà càng chìm đi, dù bóng đèn chẳng đổi gì cả — cái đổi là TƯƠNG QUAN với xung
    // quanh. Buộc độ sáng vào `lampEnergy` (rạng sáng 0,35 · chạng vạng 0,60 · đêm 1,00) là diễn
    // đạt đúng tương quan đó, và tái dùng luôn con số đã có thay vì đẻ thêm một nút vặn mới.
    glassLit: rgbToHexNumber(hslToRgb({ h: 44, s: 0.72, l: 0.30 + 0.36 * glow })),
  };

  // ⚠️ Mặt đất lấy sắc ĐẤT làm gốc rồi mới pha CHÚT sắc kỷ vào, chứ KHÔNG phải ngược lại.
  // Trộn theo chiều ngược (từ sắc kỷ về phía xanh lá) là một cái bẫy: với kỷ tím (kỷ 7, 275°)
  // đường ngắn nhất tới 90° đi vòng qua 0° nên mặt đất ra màu HỒNG — đúng thứ ảnh chụp thử đã
  // phơi ra.
  //
  // ⚠️ NHƯNG NEO 78° VẪN CÒN SAI, và bản quét đủ 15 kỷ mới bắt được — đây là chỗ chỉ so sánh cạnh
  // nhau mới thấy. Hai chuyện:
  //   (1) 78° là VÀNG-LỤC, và khi kỷ có sắc lam/lục kéo thêm lên nữa thì mặt đất ra 102–117°, tức
  //       màu CỎ NHÂN TẠO xanh rực (kỷ 5, 6, 8, 12, 13, 14, 15 — gần nửa trò chơi). Nền của một
  //       bức tranh phong cảnh cổ điển không bao giờ là màu diệp lục: nó là ô-liu, đất son, đất
  //       nung — vàng ĐẤT, không phải vàng LÁ. Hạ neo xuống 58° và giảm độ tươi thì cả 15 kỷ về
  //       đúng dải đất.
  //   (2) Việc kỷ 5 ra cỏ xanh còn kỷ 7 ra đất nâu — dù cả hai đều là kỷ sắc lam-tím — là do phép
  //       xoay góc màu lật hướng ở mốc 180°. Nay pha bằng `blend` (RGB) nên không còn hướng nào để
  //       lật: các kỷ họ lam đều cho ra đất ô-liu xám, khác nhau ở sắc độ chứ không nhảy sang họ
  //       màu khác.
  const GROUND_ANCHOR = 58;
  const GROUND_ERA = 0.22;
  /** Độ tươi mặt đất. Trời sáng đã hạ 0,26 → 0,20 để hết "bãi cỏ sân bóng". */
  const groundSat = isDark ? 0.12 : 0.20;

  /**
   * ⭐ MẶT ĐƯỜNG — phát biểu bằng KHOẢNG CÁCH TỚI MẶT ĐẤT, không phải bằng một con số nhớ sẵn.
   *
   * ⚠️ CHỖ NÀY ĐANG GÁNH HAI LỖI, VÀ CHÚNG CÓ CÙNG MỘT GỐC. Bản cũ là đúng MỘT dòng:
   * `road: material(48, 0.10, 0.10, 0.68, 0.42)` — một mã màu duy nhất cho cả 15 kỷ, kèm chú thích
   * *"NHẠT hơn đất rõ rệt … mắt cần đọc ra lối đi"*.
   *   • **Lỗi 1 — 15 kỷ một mặt đường.** Đường mòn thời đồ đá và đại lộ Dubai là *cùng một mặt
   *     phẳng cùng một màu*. Đúng thứ Đàm cấm: *"không dùng cùng một thành phố rồi đổi màu"*.
   *   • **Lỗi 2 — BAN ĐÊM ĐƯỜNG TÀNG HÌNH, và nó đã chạy như vậy nhiều ngày.** Đo cả 15 kỷ:
   *     ban ngày đường sáng hơn đất **0,129–0,145** (đọc ra ngay); ban đêm chỉ **0,012–0,020**,
   *     tức mắt không tách nổi đường khỏi đất. Nguyên nhân KHÔNG phải ai đó chỉnh sai con số đường:
   *     Phase 3M nâng độ đậm mặt đất ban đêm 0,286 → 0,400 (có lý do đầy đủ, xem chú thích
   *     `groundShades`) — còn số 0,42 của mặt đường thì **không có lý do gì để đi theo**, vì nó
   *     không biết mặt đất tồn tại. Cái luật *"đường phải nhạt hơn đất"* được viết thành một HẰNG
   *     SỐ TUYỆT ĐỐI thay vì một QUAN HỆ, nên khi mặt đất dịch chỗ, luật gãy trong im lặng.
   *
   * ⇒ Nay luật ấy được phát biểu đúng như lời của nó: **đo mặt đất thật ở đúng thời điểm này, rồi
   * đặt mặt đường cách ra một khoảng nhìn thấy được.** Mặt đất có dời đi đâu thì mặt đường theo tới
   * đó, mãi mãi, không cần ai nhớ để chỉnh tay.
   */
  const groundBaseRgb = blend(GROUND_ANCHOR, GROUND_ERA, groundSat, isDark ? 0.400 : 0.536);
  const groundL = rgbToHsl(groundBaseRgb).l;

  /**
   * Vật liệu đúng giữa thang sáng thì nằm ngang mặt đất; sáng hơn thì nổi lên, tối hơn thì chìm.
   * ⚠️ Sàn/trần/độ dốc của phép đẩy nay nằm ở `roadContrastGap` (module này, có test riêng) —
   * KHÔNG chép lại ba con số ấy vào đây, đó là "một luật hai công thức".
   */
  const ROAD_NEUTRAL_L = 0.50;

  const roadHsl = roadSource ? rgbToHsl(roadSource) : null;
  const roadOffset = roadHsl ? roadHsl.l - ROAD_NEUTRAL_L : 0;
  const roadL = groundL + Math.sign(roadOffset || 1) * roadContrastGap(Math.abs(roadOffset));

  // ⚠️ CHÂN TRỜI PHẢI CÓ MÀU, không được nhợt. Bản đầu lấy `l: 0.86` và ảnh chụp thử ra một mảng
  // xám tím phẳng lì — bầu trời chiếm gần một nửa khung hình nên nó nhợt là cả bức nhợt theo.
  // Chân trời ẤM (ngả vàng-hồng như nắng chiều), đỉnh trời LẠNH và ĐẬM hơn: chênh lệch đó chính
  // là thứ mắt đọc thành "bầu trời" thay vì "nền màu".
  // ⚠️ TRỜI NEO VÀO SẮC LẠNH, KHÔNG THEO SẮC KỶ — sửa lỗi lớn nhất mà ảnh chụp thử phơi ra.
  // Khi trời cũng lấy sắc kỷ, cả khung hình rơi vào MỘT họ màu (kỷ 7 tím → trời hồng, đất nâu
  // hồng, tường hồng) và kết quả là một bức đục ngầu dù từng thứ riêng lẻ đều đúng. Tranh sống
  // nhờ TƯƠNG PHẢN ẤM–LẠNH: vật thể ấm đứng trên nền lạnh. Bầu trời có màu lạnh ở mọi thời đại,
  // nên nó là chỗ giữ vế "lạnh"; sắc kỷ chỉ được phép nhuộm 18%.
  // ⚠️ LẦN 2 (Phase 3C) — VẪN CÒN NHỢT. `l: 0.86` với độ tươi 0,30 cho ra một dải kem xám, và vì
  // màu này đồng thời LÀ MÀU SƯƠNG MÙ nên nó nhợt kéo theo cả vùng đất xa nhợt luôn: hơn một phần
  // ba khung hình chìm trong sữa. Kéo xuống 0,80 và tươi lên 0,42 thì chân trời thành ÁNH VÀNG ẤM
  // — vừa ra "nắng chiều", vừa cho vùng đất xa một màu để tan vào thay vì một mảng trắng.
  // ⚠️ LẦN 3 — HAI THEME PHẢI LÀ HAI CẢNH KHÁC NHAU, KHÔNG PHẢI MỘT CẢNH VẶN NHỎ ĐỘ SÁNG.
  // Dùng chung góc màu ấm (40°) cho cả hai thì theme tối ra một bầu trời NÂU-Ô-LIU xỉn: nó không
  // đọc ra "buổi tối", nó đọc ra "ảnh bị thiếu sáng". Trời đêm thật ngả XANH LAM sâu — và vì đây
  // cũng là màu sương mù, đổi nó thì cả vùng đất xa cũng ngả lam theo, đúng kiểu chạng vạng.
  // Theme sáng giữ ánh vàng ấm của nắng chiều. Cùng một thành phố, hai thời điểm trong ngày.
  // `skyShift` dịch góc màu theo chặng trong ngày: dương = về phía vàng-hồng (bình minh, hoàng
  // hôn), âm = về phía lam (đêm). Đây là thứ làm 6 giờ sáng khác 12 giờ trưa khác 10 giờ đêm.
  // ⚠️ ĐỘ ĐẬM 0,80 → 0,70 VÀ ĐỘ TƯƠI 0,42 → 0,60 (theme sáng) — ĐỌC TRƯỚC KHI KÉO NGƯỢC LẠI.
  // Ánh xạ tông màu `Neutral` (xem `applyPaintedLook` ở `sceneGraph.js`) NÉN VÙNG SÁNG. Bầu trời ở
  // độ đậm 0,80 nằm đúng giữa vùng bị nén, nên mọi độ tươi khai ở đây đều bị bóp gần hết trước khi
  // tới mắt. Đo thật (2026-08-13, kỷ 7, giữa trưa): bảng màu cho `#bfd1dd` — 204° lam, tươi 0,31 —
  // mà ảnh dựng ra `#9ca8a5`, tức **164° tươi 0,06**. Chính chú thích ở `applyPaintedLook` đã cảnh
  // báo "cao hơn nữa thì trời bắt đầu bạc"; đây là mặt còn lại của cùng hiện tượng.
  // Hạ độ đậm đưa bầu trời RA KHỎI vùng nén, rồi nâng độ tươi bù phần vẫn bị nén.
  // ⚠️ Đây là bài học "BẢNG MÀU ≠ MÀU TRÊN MÀN HÌNH" đã ghi ở `CLAUDE.md`, lần này theo chiều
  // NGƯỢC với vụ mái nhà (mái thì màn hình TƯƠI GẤP ĐÔI bảng; trời thì màn hình NHẠT ĐI 5 lần).
  // ⇒ Sửa xong PHẢI chụp lại và đo đầu RA, không được tin bảng.
  const horizon = isDark
    ? skyward(224, 0.14, Math.min(0.75, 0.44 * skySat), 0.72, 0.27, 'horizon')
    : skyward(40, 0.18, Math.min(0.78, 0.60 * skySat), 0.70, 0.26, 'horizon');

  return {
    // ── giữ nguyên các khoá cũ để không phá chỗ đang dùng ────────────────────
    background: horizon,
    ground:     material(GROUND_ANCHOR, GROUND_ERA, groundSat,        0.55, 0.286),
    groundAlt:  material(GROUND_ANCHOR, GROUND_ERA, groundSat - 0.02, 0.51, 0.276),

    /**
     * Bốn sắc nền, chênh nhau RẤT ÍT.
     * ⚠️ `buildGround` sinh sẵn 4 biến thể từ lâu nhưng bộ vẽ chỉ dùng 2 màu, và chênh lệch giữa
     * chúng đủ lớn để ảnh chụp thử ra một BÀN CỜ VUA. Mặt đất thật không có ô: nó có mảng đậm
     * mảng nhạt không đều. Bốn sắc sát nhau cho ra đúng cảm giác đó, và vì chúng vẫn khác nhau
     * nên mặt đất không bị phẳng lì một màu.
     *
     * ⚠️ LẦN 2 (Phase 3C): vẫn còn ra bàn cờ. Nguyên nhân đã hiểu rõ hơn — mắt người cực nhạy với
     * chênh lệch ĐỘ SÁNG và khá thờ ơ với chênh lệch GÓC MÀU. Bốn sắc cũ chênh nhau 0,045 độ sáng
     * (0,505 → 0,55): nghe thì nhỏ, nhưng ở đúng vùng giữa thang sáng thì đó là ranh giới nhìn
     * thấy được, và vì mỗi ô là một hình vuông đều tăm tắp nên mắt lập tức nối chúng thành lưới.
     * Cách chữa: **siết độ sáng lại còn ~0,018, bù chênh lệch sang GÓC MÀU**.
     *
     * ⚠️ LẦN 3 — VÀ ĐÂY LÀ BÀI HỌC ĐÁNG NHỚ NHẤT: lần 2 dùng ±9° góc màu, nhìn ổn **dưới tone
     * mapping AgX**. Nhưng khi đổi sang `Neutral` (giữ được độ tươi), đúng ±9° đó lập tức hiện
     * nguyên hình thành bàn cờ xanh–vàng. Không phải bảng màu sai — mà là **bảng màu và tone
     * mapping không phải hai thứ tách rời**: AgX bạc màu nên nó vẫn đang âm thầm che giúp một khác
     * biệt vốn quá lớn. Đổi tone mapping thì PHẢI soi lại mọi chỗ dựa vào chênh lệch góc màu nhỏ.
     * Nay ±4°: vừa đủ để mặt đất không phẳng lì, chưa đủ để mắt nối thành lưới.
     *
     * ⚠️ THEME TỐI DÙNG ĐỘ TƯƠI THẤP HƠN HẲN (0,12 so với 0,26) — không phải để "cho tối"
     * mà vì đúng như vậy: trong ánh sáng yếu, mắt người mất dần khả năng phân biệt màu (hiệu
     * ứng Purkinje). Một bãi cỏ xanh RỰC dưới bầu trời chạng vạng đọc ra "đồ hoạ game chỉnh
     * sai", còn một bãi cỏ xám-lục thì đọc ra "trời đang tối".
     */
    /**
     * ⚠️ SẮC ĐỘ BAN ĐÊM ĐÃ ĐƯỢC NÂNG (0,286 → 0,40) — VÌ ĐÊM ĐANG BỊ LÀM TỐI TỚI BA LẦN.
     * Bảng quét đo bằng máy: dải thành phố lúc 22 giờ có độ sáng trung vị 0,029, giữa trưa 0,456.
     * Tối gấp 15 lần, trong khi đèn đóm chỉ chênh nhau 1,6 lần. Truy ra thì đêm bị nhân ba tầng
     * độc lập, mỗi tầng đều "hợp lý" khi nhìn riêng:
     *   (1) MÀU ĐÈN lấy từ bầu trời đêm — trời đêm đậm nên ánh sáng chiếu vào cũng đậm theo;
     *   (2) NẮNG yếu đi (ánh trăng thay mặt trời);
     *   (3) SƠN cũng bị hạ sắc độ ở nhánh `isDark` — chính là mấy con số ngay dưới đây.
     * Tầng (1) và (2) LÀ ban đêm, đúng và phải giữ. Tầng (3) là đếm thêm một lần nữa cho cùng một
     * chuyện: mặt đất ban đêm KHÔNG đổi màu sơn, nó chỉ được chiếu ít ánh sáng hơn thôi. Hạ cả sơn
     * là mô tả một thành phố xây bằng vật liệu khác vào ban đêm.
     * Đây cũng là lý do hai lần vá trước (bơm `fillEnergy` 1,45 → 3,40) không ăn thua: chúng cộng
     * thêm vào tầng (1) trong khi thủ phạm nằm ở tầng (3), mà (3) thì NHÂN chứ không CỘNG.
     */
    groundShades: [
      material(GROUND_ANCHOR,     GROUND_ERA, groundSat,        0.536, 0.400),
      material(GROUND_ANCHOR - 4, GROUND_ERA, groundSat - 0.01, 0.528, 0.392),
      material(GROUND_ANCHOR + 4, GROUND_ERA, groundSat + 0.01, 0.544, 0.406),
      material(GROUND_ANCHOR + 2, GROUND_ERA, groundSat - 0.02, 0.522, 0.386),
    ],

    /**
     * Mặt đường CỦA KỶ NÀY — góc màu và độ tươi lấy thẳng từ `roadColor`, độ đậm do phép đo mặt
     * đất ngay trên quyết định. Xem khối chú thích dài ở đó để biết vì sao.
     *
     * ⚠️ KHÔNG pha sắc kỷ vào (bản cũ có `eraMix` 0,10). Mặt đường đã MANG SẴN màu đúng của vật
     * liệu nó làm bằng; kéo thêm về màu nhấn giao diện nữa là đếm hai lần, và đó chính là hình
     * dạng sai mà Phase 6B đã gỡ khỏi mái nhà.
     *
     * ⚠️ BAN ĐÊM BẠC MÀU ĐI 20%, KHÔNG PHẢI 40% NHƯ MẶT ĐẤT — và chỗ lệch này là có chủ đích.
     * Hiệu ứng Purkinje (ánh sáng yếu ⇒ mắt mất dần khả năng phân biệt màu) là thật, và mặt đất
     * theo nó rất mạnh (độ tươi 0,20 → 0,12). Nhưng mặt đất chỉ có MỘT sắc, nên bạc màu nó đi thì
     * không mất thông tin gì; mặt đường có MƯỜI LĂM sắc, và chúng là thứ duy nhất nói cho Đàm biết
     * anh đang ở kỷ nào. Đo được: hạ 40% thì ban đêm có 7 cặp kỷ tụt xuống dưới ngưỡng nhìn-thấy-
     * khác-nhau, gấp đôi ban ngày — tức nửa số đêm trong tháng thành phố mất bản sắc.
     * Kỷ nào chưa khai `roadColor` thì rơi về vật liệu trung tính 48° — vẫn đi qua đúng luật khoảng
     * cách ở trên, nên nó cũng không bao giờ tàng hình ban đêm nữa.
     */
    road: rgbToHexNumber(hslToRgb({
      h: roadHsl ? roadHsl.h : 48,
      s: Math.min(0.30, (roadHsl ? roadHsl.s : 0.10) * (isDark ? 0.8 : 1)),
      l: Math.min(0.88, Math.max(0.08, roadL)),
    })),

    /**
     * NGÕ PHỐ — cùng vật liệu với đại lộ, chỉ tối hơn vì nhà hai bên che bớt trời.
     *
     * ⚠️ VAI MÀU NÀY RA ĐỜI ĐỂ SỬA MỘT CHỖ RÒ RỈ ĐÚNG CÙNG HỌ với hai lỗi ở trên, và nó nấp kỹ hơn
     * cả hai. `sceneGraph.js` tô ngõ phố bằng `palette.roles.stone` — một vai màu CHẲNG LIÊN QUAN
     * GÌ tới mặt đường — kèm chú thích *"ngõ phố tối hơn đại lộ một chút"*. Ý định đúng, đường dẫn
     * sai: `roles.stone` là màu ĐÁ XÂY TƯỜNG, nên hai phần ba mạng đường của mọi kỷ vẫn không hề
     * biết `roadColor` tồn tại, kể cả sau khi đại lộ đã được sửa. Nghĩa là bản vá chỉ chạm tới
     * 1/3 số ô đường, mà nhìn ảnh thì vẫn thấy "đường đã đổi màu" — đúng kiểu sửa xong tưởng xong.
     * Nay ngõ suy THẲNG từ đại lộ, nên không có đường nào tuột khỏi vật liệu của kỷ nữa.
     */
    roadLane: rgbToHexNumber(hslToRgb({
      h: roadHsl ? roadHsl.h : 48,
      s: Math.min(0.30, (roadHsl ? roadHsl.s : 0.10) * (isDark ? 0.8 : 1)),
      l: Math.min(0.88, Math.max(0.06, roadL * 0.86)),
    })),

    /**
     * Vùng đất ngoài thành phố.
     *
     * ⚠️ PHA VỀ CHÂN TRỜI ĐÃ TỤT TỪ 0,42 XUỐNG 0,15 (Phase 9A) — VÀ ĐÂY LÀ MỘT KẾT LUẬN CŨ HẾT
     * ĐÚNG VÌ TIỀN ĐỀ CỦA NÓ BỊ GỠ Ở PHASE KHÁC, không phải một lần chỉnh cho hợp mắt. Con số 0,42
     * ra đời khi vùng đất ngoài phố là **một tấm ván phẳng 72×72, đúng 12 tam giác**, và nó gánh
     * HAI việc mà tấm ván ấy không tự làm nổi: (a) lùi ra sau — ván phẳng không có sương thật nên
     * phải nướng sẵn phối cảnh không khí vào màu; (b) đổi theo giờ — ván phẳng không có sườn dốc
     * nào để hứng nắng, nên nếu không pha màu chân trời vào thì nó là thứ DUY NHẤT trong cảnh đứng
     * im suốt 6 chặng ngày. Cả hai lý do đều đúng, và cả hai đều đã CHẾT ở Phase 9A:
     *   · `FogExp2` thật (`daylight.js`) nay lo việc lùi ra sau, và lo ĐÚNG — theo khoảng cách thật
     *     chứ không phải một hằng số áp đều cho cả vùng gần lẫn vùng xa;
     *   · vùng đất ngoài phố nay là địa hình thật có sườn dốc, nên nắng/bóng/trời tự vẽ nó đổi màu
     *     theo giờ mà không cần pha sẵn.
     * Giữ 0,42 sau khi có sương thật là **tính phối cảnh không khí hai lần**, và nó gây một hậu quả
     * đo được: `outskirts` ra `#90a2a8` (góc màu ~193°, xanh lơ) trong khi mặt đất thành phố là
     * `#a09871` (~46°, khaki ấm) — lệch **147°**. Cả dãy núi vì thế được sơn bằng màu TRỜI chứ không
     * phải màu ĐẤT, và trên ảnh chụp nó đọc ra là sương/nước chứ không phải đất.
     * Chừa lại 0,15 vì vẫn còn một việc THẬT: vành đất sát thành phố nằm ở chỗ sương gần như bằng
     * không, mà nó thì đã đủ xa để mắt mong thấy một chút hơi lam. Đó là một quãng ngắn, nên một
     * lượng nhỏ — không phải gần một nửa.
     */
    outskirts: rgbToHexNumber(mixRgb(
      // Ngả XANH LÁ hơn lưới thành phố (+14°) và nhạt hơn: đồng cỏ ngoài phố, không phải phần
      // kéo dài của chính thành phố. Khác sắc thì mắt mới đọc ra ranh giới "trong phố / ngoài phố".
      // Sắc độ đêm 0,18 → 0,34, cùng lý do "tối ba lần" đã ghi ở `groundShades` ngay trên. Vùng
      // đất ngoài phố là mảng LỚN NHẤT khung hình, nên nó đen là cả bức đen.
      // ⚠️ Câu cũ ở đây nói *"vì còn được pha 42% về màu chân trời nên ban đêm nó tự ngả lam sâu
      // rồi, không cần hạ sơn thêm"*. Câu ấy đã hết đúng cùng lúc với con số 0,42 (xem khối chú
      // thích ngay trên): nay chỉ còn pha 0,15, nên **màu lam của đêm phải đến từ ÁNH SÁNG chứ
      // không từ nước sơn** — ánh trăng lạnh ở `lights` + sương `FogExp2` nhuộm theo màu chân trời
      // đêm. Đó cũng là đường đúng, vì nó nhuộm theo khoảng cách thật thay vì áp đều.
      blend(GROUND_ANCHOR + 14, GROUND_ERA, isDark ? 0.16 : 0.19, isDark ? 0.34 : 0.56),
      // ⚠️ PHA VỀ ĐÚNG MÀU CHÂN TRỜI CỦA CHẶNG NÀY, không phải về một màu ấm chốt cứng.
      // Bản quét chỉ ra một chuyện chỉ thấy được khi nhìn nguyên khung hình chứ không nhìn từng
      // vai màu: **vùng đất ngoài phố chiếm nhiều diện tích hơn cả bầu trời lẫn thành phố cộng
      // lại**, mà nó lại là thứ DUY NHẤT trong cảnh không hề đổi theo giờ. Kết quả là 6 chặng
      // trong ngày đều bị cùng một mảng xanh-vàng nhờ nhờ đè lên, và cả bảng quét trông nhàn nhạt
      // giống nhau dù trời, nắng, bóng đổ đều đã đổi đúng.
      // Pha về màu chân trời vừa sửa được điều đó, vừa CHÍNH LÀ phối cảnh không khí thật: vật càng
      // xa càng tan vào màu bầu khí quyển. Nay bình minh đồng ngả hồng, giữa trưa ngả vàng nhạt,
      // đêm ngả lam sâu — miễn phí, và đúng cùng nguyên lý mà sương mù đang dùng.
      { r: (horizon >> 16) & 255, g: (horizon >> 8) & 255, b: horizon & 255 },
      0.15,
    )),
    wall:       roles.wall,
    roof:       roles.roof,
    edge:       rgbToHexNumber(mixRgb(base, ink, isDark ? 0.22 : 0.16)),
    sky:        horizon,
    sun:        paint(isDark ? 34 : 40, isDark ? 0.42 : 0.34, 0.74, 0.62),
    isDark,

    // ── bảng màu đầy đủ cho ngôn ngữ hình khối 3 trục ────────────────────────
    roles,

    /**
     * Ba nguồn sáng, cố ý KHÁC NHIỆT ĐỘ. Đây là mẹo cổ điển của hội hoạ và cũng là thứ rẻ nhất
     * để một cảnh WebGL thôi trông như đồ hoạ máy tính: nắng ẤM chiếu xiên, trời LẠNH rọi từ
     * trên xuống, đất ẤM hắt ngược lên. Mặt hướng nắng vàng, mặt khuất ngả xanh, mặt dưới ngả
     * nâu — ba sắc đó xuất hiện mà không cần thêm một lệnh vẽ nào.
     */
    lights: {
      // ⚠️ Màu đèn càng đậm thì càng ÍT SÁNG, vì three nhân màu vào cường độ. Nắng ở 0,76 độ đậm
      // là đã cắt mất một phần tư năng lượng trước khi chạm vào bất cứ mặt nào — đó là một nửa lý
      // do ảnh chụp thử ra tối. Giữ nắng SÁNG và chỉ hơi ngả vàng; hơi ấm đến từ độ tươi thấp,
      // không phải từ việc làm nó tối đi.
      // ⚠️ HƠI ẤM NẰM Ở GÓC MÀU + ĐỘ TƯƠI, KHÔNG Ở ĐỘ ĐẬM. `warmth` = +1 kéo nắng về 30° (vàng cam
      // bình minh/hoàng hôn) và tươi lên; = −1 kéo về 218° (xanh lam của ánh trăng) — vẫn giữ
      // nguyên độ sáng, nên đêm không tự dưng tối thêm một lần nữa ngoài phần `sunEnergy` đã lo.
      // ⚠️ ÁNH TRĂNG TỪNG RA MÀU XANH LỤC, và không ai thấy vì nó chỉ xuất hiện lúc 19–4 giờ.
      // `mixHue(48, 218, 0.7)` — từ vàng nắng 48° sang lam trăng 218° — hai góc cách nhau 170°,
      // tức sát ngay cái mốc 180° nơi đường ngắn lật hướng. Nó chọn đường đi LÊN, xuyên qua vùng
      // lục, và dừng lại ở 167°: đo được màu đèn đêm là `#93beb4`, một thứ **xanh bạc hà**. Cả
      // cảnh đêm vì thế ngả lục nhợt thay vì lam bạc. Nay trộn trong RGB: vàng sang lam đi qua
      // xám, ra đúng thứ ánh trăng phải là — trắng hơi lạnh, không lục.
      sun: rgbToHexNumber(mixRgb(
        hslToRgb({
          h: 48,
          s: Math.min(0.72, Math.max(0.08, (isDark ? 0.40 : 0.30) + warmth * 0.22)),
          l: isDark ? 0.66 : 0.88,
        }),
        hslToRgb({
          h: warmth >= 0 ? 30 : 218,
          s: Math.min(0.72, Math.max(0.08, (isDark ? 0.40 : 0.30) + warmth * 0.22)),
          l: isDark ? 0.66 : 0.88,
        }),
        Math.abs(warmth),
      )),
      // Kéo NHẸ hơn bầu trời (0,6): đèn bán cầu nhuộm màu lên MỌI mặt hướng lên trên, nên kéo mạnh
      // như trời thì cả mặt đất bị nhuộm theo và thành phố mất màu riêng của nó.
      skyDome:  skyward(206, 0.2, Math.min(0.7, (isDark ? 0.34 : 0.30) * skySat), 0.78, 0.32, 'top', 0.6),
      // Ánh sáng dội lại từ mặt đất mang theo hơi ấm của nắng — trưa gắt thì đất hắt lên vàng hơn,
      // đêm thì gần như không hắt gì có màu.
      bounce:   material(34, 0.25, Math.min(0.6, Math.max(0.06, (isDark ? 0.30 : 0.28) + warmth * 0.12)), 0.56, 0.22),
      // Ánh đèn hắt ra từ trong nhà. Neo cứng ở sắc nến (38°) và KHÔNG pha sắc kỷ, KHÔNG kéo theo
      // bầu trời: lửa cháy màu gì thì mọi thời đại nó cháy màu đó. Đây cũng chính là thứ giữ cho
      // cảnh đêm không thành một bức đơn sắc lam — vũng ấm dưới chân tường tương phản với ánh
      // trăng lạnh, đúng cặp ấm–lạnh mà cả bảng màu này dựng lên.
      lamp:     paint(38, 0.58, 0.70, 0.66),
    },

    /**
     * Màu trời ở đỉnh và ở chân trời — dựng thành nền chuyển sắc thay vì một mảng phẳng.
     * Đỉnh trời ĐẬM và LẠNH hơn chân trời hẳn một quãng: đó là cách bầu trời thật hoạt động, và
     * cũng là cách bức tranh có "trên" và "dưới" thay vì một mảng nền.
     */
    sky2: {
      // ⚠️ ĐỈNH TRỜI NAY KÉO ĐỦ SỨC (bỏ hệ số 0,45 cũ) — vì nó đã có ĐÍCH RIÊNG, không còn phải
      // dùng chung đích với chân trời nữa. Hệ số 0,45 ngày trước chỉ là cách ghìm bớt để đỉnh trời
      // đỡ bị đích ẤM của chân trời kéo sang nâu lúc bình minh/hoàng hôn: chữa triệu chứng, và giá
      // phải trả là giữa trưa đỉnh trời cũng không xanh nổi. Nay `daylight` khai riêng `skyHue`
      // cho đỉnh và `horizonHue` cho chân, nên mỗi dải đi về đúng chỗ của nó: trên đầu luôn lam
      // (sẫm lúc bình minh/hoàng hôn, trong veo lúc trưa), sát chân trời luôn ấm — trừ ban đêm là
      // chặng duy nhất cả hai cùng lam.
      top:     skyward(210, 0.12, Math.min(0.8, (isDark ? 0.44 : 0.46) * skySat), 0.60, 0.17, 'top'),
      horizon,
    },

    /** Cửa sổ sáng đèn ban đêm — nay nằm trong `roles` vì hình học tra cứu nó theo vai màu. */
    glassLit: roles.glassLit,
  };
}
