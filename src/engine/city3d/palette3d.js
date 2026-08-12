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
 */

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
 * Trộn thẳng như số thường sẽ đi vòng qua nửa kia của vòng: pha vàng (45°) với tím (300°) ra
 * xanh lá (172°) — sai hẳn họ màu, mà lại "chạy được" nên rất dễ lọt.
 */
export function mixHue(a, b, t) {
  const k = Math.min(1, Math.max(0, t));
  let delta = ((b - a) % 360 + 540) % 360 - 180;
  return ((a + delta * k) % 360 + 360) % 360;
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
export function buildScenePalette({ tokens, eraColor } = {}) {
  const t = { ...FALLBACK_TOKENS, ...(tokens ?? {}) };
  const base = parseCssColor(t.canvas2) ?? parseCssColor(FALLBACK_TOKENS.canvas2);
  const era = parseCssColor(eraColor) ?? parseCssColor(t.accent) ?? parseCssColor(FALLBACK_TOKENS.accent);
  const ink = parseCssColor(t.ink) ?? parseCssColor(FALLBACK_TOKENS.ink);
  const isDark = luminance(base) < 0.5;

  // Sắc kỷ chỉ đóng góp GÓC MÀU. Độ tươi và độ đậm của nó bị bỏ đi có chủ đích: `accentColor`
  // trong `ERA_METADATA` là màu chọn cho CHỮ trên nền tối (rất tươi, rất sáng), dùng thẳng lên
  // mặt tường sẽ ra thành phố nhựa dẻo. Ở đây chỉ mượn "kỷ này thuộc họ xanh lá / cam / tím".
  const eraHue = rgbToHsl(era).h;

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
  const wallHue = mixHue(36, eraHue, 0.18);

  const roles = {
    wall:  paint(wallHue, isDark ? 0.24 : 0.23, 0.70, 0.44),
    wall2: paint(wallHue, isDark ? 0.20 : 0.19, 0.62, 0.37),
    roof:  paint(mixHue(eraHue, 16, 0.6), isDark ? 0.48 : 0.50, 0.39, 0.32),
    trim:  paint(wallHue, isDark ? 0.14 : 0.13, 0.76, 0.54),
    stone: paint(mixHue(wallHue, 40, 0.6), 0.12, 0.60, 0.42),
    wood:  paint(26, isDark ? 0.36 : 0.42, 0.34, 0.29),
    gold:  paint(44, isDark ? 0.60 : 0.66, 0.58, 0.50),
    // ⚠️ CỬA SỔ LÀ LỖ THỦNG, KHÔNG PHẢI TẤM NHỰA XANH.
    // Bản trước để `l: 0.52` với độ tươi 0,36 và ảnh chụp cho ra những phiến xanh cô-ban dán lên
    // mặt tường — dấu hiệu "đồ hoạ game" rõ nhất trong cả khung hình, và đúng thứ Đàm gọi là
    // "không đẹp". Nhìn từ ngoài vào ban ngày, cửa sổ gần như ĐEN: bên trong tối hơn ngoài trời
    // rất nhiều, kính chỉ hắt lại một chút sắc trời. Hạ độ đậm xuống sâu và cắt gần hết độ tươi
    // thì mặt tiền lập tức có CHIỀU SÂU — mắt đọc ra hốc lõm thay vì hình dán.
    glass: paint(mixHue(eraHue, 214, 0.7), isDark ? 0.20 : 0.16, 0.26, 0.14),
    leaf:  paint(mixHue(88, eraHue, 0.2), isDark ? 0.19 : 0.38, 0.33, 0.28),
    dark:  paint(eraHue, 0.24, 0.19, 0.09),
    // Da người. KHÔNG pha sắc kỷ vào — người thì thời nào cũng cùng một màu, và đây chính là chỗ
    // để mắt bám vào: một chấm ấm, nhạt, KHÔNG thuộc họ màu của công trình xung quanh, nhờ vậy
    // đọc ra "người" giữa một rừng tường và mái. Sáng hơn hẳn ở cả hai theme vì ở cỡ vài điểm ảnh,
    // độ SÁNG là thứ duy nhất phân biệt được, không phải sắc.
    skin:  paint(30, 0.30, 0.78, 0.66),
  };

  // ⚠️ Mặt đất lấy sắc ĐẤT làm gốc rồi mới pha CHÚT sắc kỷ vào, chứ KHÔNG phải ngược lại.
  // Trộn theo chiều ngược (từ sắc kỷ về phía xanh lá) là một cái bẫy: với kỷ tím (kỷ 7, 275°)
  // đường ngắn nhất tới 90° đi vòng qua 0° nên mặt đất ra màu HỒNG — đúng thứ ảnh chụp thử đã
  // phơi ra. Neo vào 78° thì mọi kỷ đều có mặt đất ra đất, chỉ khác nhau sắc thái.
  const groundHue = mixHue(78, eraHue, 0.22);

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
  const horizon = isDark
    ? paint(mixHue(224, eraHue, 0.14), 0.34, 0.80, 0.27)
    : paint(mixHue(40, eraHue, 0.18), 0.42, 0.80, 0.26);

  return {
    // ── giữ nguyên các khoá cũ để không phá chỗ đang dùng ────────────────────
    background: horizon,
    ground:     paint(groundHue, isDark ? 0.12 : 0.26, 0.55, 0.286),
    groundAlt:  paint(groundHue, isDark ? 0.10 : 0.24, 0.51, 0.276),

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
    groundShades: [
      paint(groundHue,     isDark ? 0.12 : 0.26, 0.536, 0.286),
      paint(groundHue - 4, isDark ? 0.11 : 0.25, 0.528, 0.280),
      paint(groundHue + 4, isDark ? 0.13 : 0.27, 0.544, 0.290),
      paint(groundHue + 2, isDark ? 0.10 : 0.24, 0.522, 0.276),
    ],

    /** Mặt đường: NHẠT hơn đất rõ rệt — đá lát bạc màu vì bị giẫm, và mắt cần đọc ra lối đi. */
    road: paint(mixHue(groundHue, 40, 0.5), 0.10, 0.68, 0.42),

    /**
     * Vùng đất ngoài thành phố. Pha sẵn một phần về phía màu chân trời để nó tự LÙI RA SAU thay
     * vì tranh chỗ với lưới thành phố — cùng nguyên lý phối cảnh không khí mà sương mù đang dùng,
     * chỉ là nướng sẵn vào màu để chỗ gần camera cũng đã nhạt rồi.
     */
    outskirts: rgbToHexNumber(mixRgb(
      // Ngả XANH LÁ hơn lưới thành phố (+22°) và nhạt hơn: đồng cỏ ngoài phố, không phải phần
      // kéo dài của chính thành phố. Khác sắc thì mắt mới đọc ra ranh giới "trong phố / ngoài phố".
      hslToRgb({ h: groundHue + 22, s: isDark ? 0.16 : 0.19, l: isDark ? 0.18 : 0.56 }),
      hslToRgb({ h: mixHue(38, eraHue, 0.2), s: isDark ? 0.24 : 0.30, l: isDark ? 0.20 : 0.86 }),
      0.34,
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
      sun:      paint(isDark ? 34 : 42, isDark ? 0.40 : 0.30, 0.88, 0.66),
      skyDome:  paint(mixHue(206, eraHue, 0.2), isDark ? 0.34 : 0.30, 0.78, 0.32),
      bounce:   paint(mixHue(34, eraHue, 0.25), isDark ? 0.30 : 0.28, 0.56, 0.22),
    },

    /**
     * Màu trời ở đỉnh và ở chân trời — dựng thành nền chuyển sắc thay vì một mảng phẳng.
     * Đỉnh trời ĐẬM và LẠNH hơn chân trời hẳn một quãng: đó là cách bầu trời thật hoạt động, và
     * cũng là cách bức tranh có "trên" và "dưới" thay vì một mảng nền.
     */
    sky2: {
      top:     paint(mixHue(210, eraHue, 0.18), isDark ? 0.44 : 0.46, 0.60, 0.17),
      horizon,
    },

    /** Cửa sổ sáng đèn ban đêm. Dùng làm `emissive`, nên phải trầm hơn cảm giác "màu đèn". */
    glassLit: paint(42, 0.62, 0.60, 0.52),
  };
}
