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

  // Ở theme tối, pha thêm sắc kỷ thì khối sẽ NỔI lên; ở theme sáng, pha ít hơn kẻo chói.
  // Con số lấy tương ứng với các mức alpha đã dùng ở bộ vẽ 2D để hai bộ vẽ trông cùng một họ.
  const lift = isDark ? 1.25 : 1;

  return {
    background: rgbToHexNumber(mixRgb(base, era, 0.06 * lift)),
    ground:     rgbToHexNumber(mixRgb(base, era, 0.12 * lift)),
    groundAlt:  rgbToHexNumber(mixRgb(base, era, 0.18 * lift)),
    wall:       rgbToHexNumber(mixRgb(base, era, 0.34 * lift)),
    roof:       rgbToHexNumber(mixRgb(base, era, 0.52 * lift)),
    edge:       rgbToHexNumber(mixRgb(base, ink, isDark ? 0.18 : 0.14)),
    sky:        rgbToHexNumber(mixRgb(base, era, 0.03)),
    // Ánh sáng: theme tối cần đèn ấm hơn để khối không xám xịt.
    sun:        rgbToHexNumber(mixRgb({ r: 255, g: 255, b: 255 }, era, isDark ? 0.22 : 0.10)),
    isDark,
  };
}
