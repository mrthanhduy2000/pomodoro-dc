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
export function buildScenePalette({ tokens, eraColor, daylight } = {}) {
  const t = { ...FALLBACK_TOKENS, ...(tokens ?? {}) };
  const base = parseCssColor(t.canvas2) ?? parseCssColor(FALLBACK_TOKENS.canvas2);
  const era = parseCssColor(eraColor) ?? parseCssColor(t.accent) ?? parseCssColor(FALLBACK_TOKENS.accent);
  const ink = parseCssColor(t.ink) ?? parseCssColor(FALLBACK_TOKENS.ink);

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
  const eraHsl = rgbToHsl(era);
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
  const eraRoof = (sat, light) => {
    // Độ tươi: 30% của vai màu + 70% kéo theo độ tươi của sắc kỷ. Kẹp hai đầu để kỷ nhợt nhất vẫn
    // còn là một màu (không thành xám chì) và kỷ rực nhất vẫn là ngói (không thành nhựa).
    const base = Math.min(0.62, Math.max(0.14, sat * 0.30 + sat * 0.70 * 2 * eraHsl.s));
    // Độ đậm: nhích theo độ sáng của sắc kỷ quanh mốc 0,6 (mốc trung bình của bảng `ERA_METADATA`).
    const l = Math.min(0.56, Math.max(0.24, light + (eraHsl.l - 0.6) * 0.22));
    const mix = (s) => mixRgb(
      hslToRgb({ h: 16, s, l }),        // neo đất nung — giữ mái nằm trong họ vật liệu lợp thật
      hslToRgb({ h: eraHue, s, l }),
      0.80,
    );

    // ⚠️ TRẦN RIÊNG CHO DẢI TÍM — KHÔNG PHẢI NGOẠI LỆ CHO VUI, MÀ LÀ MỘT SỰ THẬT VỀ VẬT LIỆU.
    // Bốn kỷ 6/7/11/15 có sắc kỷ nằm trong cung tím, nên cho chúng mái tím là ĐÚNG bản sắc. Nhưng
    // sắc tố ĐẤT thì không bao giờ rực: mái mận chín / rượu vang (madder lake, caput mortuum) có
    // thật và đẹp, còn một mảng hồng cánh sen tươi rói thì mắt đọc ra nhựa dẻo. Bài test "KHÔNG một
    // vai màu nào ra TÍM SEN RỰC" khoá đúng ranh giới đó ở độ tươi 0,42 — và nó đã bắt được bản
    // đầu của chính hàm này (kỷ 6/7/11 ra 0,51–0,54). Trần ở đây là cách trả lời ĐÚNG cho bài test
    // đó: giữ nguyên GÓC MÀU (tức giữ bản sắc kỷ, ba kỷ vẫn phân biệt được nhau ở 268°/284°/307°)
    // và chỉ hạ ĐỘ TƯƠI. Nếu thay vào đó đi nới ngưỡng của bài test kia thì mới là phá bất biến.
    const first = rgbToHsl(mix(base));
    const inMagentaBand = first.h >= 255 && first.h <= 340;
    return rgbToHexNumber(inMagentaBand ? mix(Math.min(base, 0.40)) : mix(base));
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
    return rgbToHexNumber(mixRgb(rgb, hslToRgb({ h: target, s: sat, l }), t));
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
    leaf:  material(88, 0.20, isDark ? 0.19 : 0.38, 0.33, 0.28),
    // Bóng tối sâu nhất. Gần như đen ở mọi kỷ nên góc màu hầu như không đọc ra, nhưng vẫn pha bằng
    // `material` cho nhất quán — không để sót một chỗ nào dùng thẳng sắc kỷ chưa qua bảng pha.
    dark:  material(24, 0.45, 0.24, 0.19, 0.09),
    // Da người. KHÔNG pha sắc kỷ vào — người thì thời nào cũng cùng một màu, và đây chính là chỗ
    // để mắt bám vào: một chấm ấm, nhạt, KHÔNG thuộc họ màu của công trình xung quanh, nhờ vậy
    // đọc ra "người" giữa một rừng tường và mái. Sáng hơn hẳn ở cả hai theme vì ở cỡ vài điểm ảnh,
    // độ SÁNG là thứ duy nhất phân biệt được, không phải sắc.
    skin:  paint(30, 0.30, 0.78, 0.66),
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
  const horizon = isDark
    ? skyward(224, 0.14, Math.min(0.75, 0.34 * skySat), 0.80, 0.27, 'horizon')
    : skyward(40, 0.18, Math.min(0.75, 0.42 * skySat), 0.80, 0.26, 'horizon');

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

    /** Mặt đường: NHẠT hơn đất rõ rệt — đá lát bạc màu vì bị giẫm, và mắt cần đọc ra lối đi. */
    road: material(48, 0.10, 0.10, 0.68, 0.42),

    /**
     * Vùng đất ngoài thành phố. Pha sẵn một phần về phía màu chân trời để nó tự LÙI RA SAU thay
     * vì tranh chỗ với lưới thành phố — cùng nguyên lý phối cảnh không khí mà sương mù đang dùng,
     * chỉ là nướng sẵn vào màu để chỗ gần camera cũng đã nhạt rồi.
     */
    outskirts: rgbToHexNumber(mixRgb(
      // Ngả XANH LÁ hơn lưới thành phố (+14°) và nhạt hơn: đồng cỏ ngoài phố, không phải phần
      // kéo dài của chính thành phố. Khác sắc thì mắt mới đọc ra ranh giới "trong phố / ngoài phố".
      // Sắc độ đêm 0,18 → 0,34, cùng lý do "tối ba lần" đã ghi ở `groundShades` ngay trên. Vùng
      // đất ngoài phố là mảng LỚN NHẤT khung hình, nên nó đen là cả bức đen — và vì nó còn được pha
      // 42% về màu chân trời (dòng dưới), ban đêm nó vốn đã tự ngả lam sâu rồi, không cần hạ sơn
      // thêm lần nữa mới ra đêm.
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
      0.42,
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
