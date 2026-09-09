/**
 * cityPostcard.js — Round 50 (ADR-090): A PICTURE OF THE CITY HE BUILT.
 *
 * Đàm, round 50: *"Thành phố này là thứ tôi xây bằng 830 giờ tập trung. Hiện tôi không có cách nào
 * giữ lại một tấm hình của nó."* This composes one: the WebGL frame exactly as it stands (his hour,
 * his season, his camera — walking or above), plus a caption band naming the era, the country, how
 * many buildings and how many sessions paid for them.
 *
 * Pure except for the two DOM calls it must make; the layout is a function of the frame's size, so a
 * phone screenshot and a desktop one come out with the same proportions.
 */

/** The caption band's height, as a share of the frame's height (min 56 px so text never crowds). */
export function bandHeight(frameHeight) {
  return Math.max(56, Math.round(frameHeight * 0.13));
}

/** `Kỷ 8 · Bồ Đào Nha` / `5 công trình · 140 phiên · Xuân · 18h` — the two caption lines. */
export function postcardLines({ era, country, landmark, buildings, sessions, season, hour }) {
  const top = `Kỷ ${era}${country ? ` · ${country}` : ''}`;
  const bits = [];
  if (Number.isFinite(buildings)) bits.push(`${buildings} công trình`);
  if (Number.isFinite(sessions)) bits.push(`${sessions} phiên`);
  if (season) bits.push(season);
  if (hour) bits.push(hour);
  return { top, bottom: bits.join(' · '), note: landmark ?? '' };
}

/** A file name that sorts by era and never collides across seasons or hours. */
export function postcardFileName({ era, season, hour }) {
  const h = String(hour ?? '').replace(/[^0-9]/g, '') || '00';
  return `thanh-pho-ky${String(era).padStart(2, '0')}-${season || 'mua'}-${h}h.png`;
}

/**
 * Draw the frame plus its caption onto a 2D canvas and hand back a data URL.
 * @param {{ url:string, width:number, height:number }} frame  from the scene's `capture()`
 */
export async function composePostcard(frame, text, { documentRef = document, ImageCtor = Image } = {}) {
  const band = bandHeight(frame.height);
  const canvas = documentRef.createElement('canvas');
  canvas.width = frame.width;
  canvas.height = frame.height + band;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const img = new ImageCtor();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('không đọc được khung hình 3D'));
    img.src = frame.url;
  });
  ctx.drawImage(img, 0, 0, frame.width, frame.height);

  ctx.fillStyle = '#12110f';
  ctx.fillRect(0, frame.height, canvas.width, band);
  const pad = Math.round(band * 0.28);
  const big = Math.round(band * 0.34);
  const small = Math.round(band * 0.24);
  ctx.fillStyle = '#f4f1ea';
  ctx.font = `600 ${big}px system-ui, sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText(text.top, pad, frame.height + pad * 0.7);
  ctx.fillStyle = '#b9b2a6';
  ctx.font = `400 ${small}px system-ui, sans-serif`;
  ctx.fillText(text.bottom, pad, frame.height + pad * 0.7 + big * 1.25);
  if (text.note) {
    ctx.textAlign = 'right';
    ctx.fillText(text.note, canvas.width - pad, frame.height + pad * 0.7 + big * 1.25);
    ctx.textAlign = 'left';
  }
  return canvas.toDataURL('image/png');
}

/** Hand the browser a file to save. Separated so the composing above stays testable. */
export function downloadDataUrl(url, fileName, { documentRef = document } = {}) {
  const a = documentRef.createElement('a');
  a.href = url;
  a.download = fileName;
  documentRef.body.appendChild(a);
  a.click();
  a.remove();
}
