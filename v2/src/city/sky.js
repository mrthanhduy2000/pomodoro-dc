/**
 * sky.js — light of the city at a real moment in Hanoi. Pure: (epoch ms) → numbers and colours.
 * The city's clock is the real clock (plan stage 3: "ngày và đêm theo giờ thật").
 */

const VN_OFFSET_H = 7;

export function vnHour(ms) {
  const d = new Date(ms);
  return (d.getUTCHours() + VN_OFFSET_H + d.getUTCMinutes() / 60) % 24;
}

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.min(1, Math.max(0, x));

function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p, s) => (p >> s) & 255;
  const out = [16, 8, 0].map((s) => Math.round(lerp(ch(pa, s), ch(pb, s), t)));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const DAY = '#bcd8ec';
const DUSK = '#f0b48c';
const NIGHT = '#16203a';

/**
 * Sun elevation follows a 06:00–18:00 day (Hanoi is close enough to the tropics that this is a
 * fair year-round read). `night` is 0 by day and 1 in deep night; lanterns and windows use it.
 */
export function skyAt(ms) {
  const h = vnHour(ms);
  const elevation = Math.sin(((h - 6) / 12) * Math.PI); // 1 at noon, <0 at night
  const night = clamp01(-elevation * 2.2 + 0.25);
  const dusk = clamp01(1 - Math.abs(elevation) * 3.2); // near the horizon, morning and evening
  let sky = elevation > 0 ? mixHex(DUSK, DAY, clamp01(elevation * 2.2)) : mixHex(DUSK, NIGHT, clamp01(-elevation * 3));
  if (dusk > 0 && elevation > 0) sky = mixHex(sky, DUSK, dusk * 0.4);
  const azimuth = ((h - 6) / 12) * Math.PI; // east (0) → west (π)
  return {
    hour: h,
    elevation,
    night,
    sky,
    // By night the same light becomes the moon: dimmer and cool, so a storey's colour still reads.
    sunIntensity: elevation > 0 ? elevation * 2.2 + 0.25 : 0.55,
    ambient: lerp(0.8, 1.05, clamp01(elevation + 0.3)),
    sunColor: elevation > 0 ? mixHex('#ffb27a', '#fff4e3', clamp01(elevation * 2)) : '#a9bcff',
    sunDir: elevation > 0
      ? { x: Math.cos(azimuth) * 0.8, y: Math.max(0.15, elevation), z: 0.45 }
      : { x: -0.5, y: 0.7, z: -0.4 },
  };
}
