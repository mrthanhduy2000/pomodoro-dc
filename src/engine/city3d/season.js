/**
 * season.js — Round 50 (ADR-090): THE SECOND AXIS OF THE SKY. Fifteen eras × four seasons = sixty
 * looks instead of fifteen, on machines that already exist: the era palette (round 47), wind and
 * motion (round 48), weather and particles (round 49). This file is pure and total — it never reads
 * a clock. The shell derives the season once from the Vietnam calendar (`seasonForMonth`) or from
 * Đàm's picker, and a sealed era freezes ITS season (`museumSeason`) the way it froze its hour.
 *
 * What a season changes, per climate: leaf hue/saturation/lightness · blossom (leaf2 turns pink or
 * white) · ground and roof under snow · preferred weather (`weather.js` reads `seasonWeather`) ·
 * falling petals or leaves (`seasonParticle`) · wind. Nothing is removed — a bare winter crown is
 * the same crown in a different colour.
 */

export const SEASONS = Object.freeze(['spring', 'summer', 'autumn', 'winter']);
export const SEASON_LABEL = Object.freeze({ spring: 'Xuân', summer: 'Hạ', autumn: 'Thu', winter: 'Đông' });

/** Vietnam calendar month (0 = January) → season, northern hemisphere. */
export function seasonForMonth(monthIndex) {
  const m = ((Number(monthIndex) % 12) + 12) % 12;
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

export function isSeason(s) {
  return SEASONS.includes(s);
}

/**
 * Climate class per era — what winter and summer MEAN there. Stalingrad and Manchester have a
 * white winter; Hanoi and Singapore have a wet and a dry one; Giza and Dubai have a hot and a mild.
 */
export const ERA_CLIMATE = Object.freeze({
  1: 'temperate', 2: 'arid', 3: 'arid', 4: 'temperate', 5: 'cold', 6: 'tropical', 7: 'temperate',
  8: 'temperate', 9: 'cold', 10: 'cold', 11: 'cold', 12: 'cold', 13: 'temperate', 14: 'tropical', 15: 'arid',
});

/**
 * The season a SEALED era is frozen in — its most characteristic one, chosen once: Tokyo under
 * cherry blossom, Stalingrad in snow, the Red River delta at harvest, the Eifel in autumn colour.
 */
export const MUSEUM_SEASON = Object.freeze({
  1: 'spring', 2: 'summer', 3: 'summer', 4: 'spring', 5: 'autumn', 6: 'autumn', 7: 'summer',
  8: 'spring', 9: 'autumn', 10: 'autumn', 11: 'autumn', 12: 'winter', 13: 'spring', 14: 'summer', 15: 'summer',
});
export function museumSeason(era) {
  return MUSEUM_SEASON[Number(era)] ?? 'summer';
}

/**
 * Per climate × season: the look. Summer is the BASE of every era (the round-47…49 tables were
 * tuned on it), so `summer` is identity almost everywhere — the other three lean away from it.
 *   leafHueShift (°) · leafSatMul · leafLightMul · groundHueShift (°) · groundSatMul · groundLightAdd
 *   snow 0–1 (ground, roofs, outskirts whiten) · blossom 0–1 (leaf2 → `blossomHue`) · wind (× amp)
 *   fog (added to the hour's fog) · particle (petals | leaves | null)
 */
const LOOK = Object.freeze({
  cold: {
    spring: { leafHueShift: 6, leafSatMul: 1.10, leafLightMul: 1.08, groundSatMul: 1.05, groundLightAdd: 0.02, wind: 1.1, blossom: 0.5, blossomHue: 350 },
    summer: {},
    autumn: { leafHueShift: -62, leafSatMul: 1.35, leafLightMul: 1.02, groundHueShift: -10, groundSatMul: 0.9, groundLightAdd: -0.02, fog: 0.15, wind: 1.2, particle: 'leaves' },
    winter: { leafHueShift: -30, leafSatMul: 0.25, leafLightMul: 0.62, snow: 1.0, fog: 0.12, wind: 1.25 },
  },
  temperate: {
    spring: { leafHueShift: 8, leafSatMul: 1.15, leafLightMul: 1.10, groundSatMul: 1.10, groundLightAdd: 0.03, blossom: 1.0, blossomHue: 340, wind: 1.05 },
    summer: {},
    autumn: { leafHueShift: -50, leafSatMul: 1.25, leafLightMul: 1.0, groundHueShift: -8, groundSatMul: 0.92, fog: 0.08, wind: 1.1, particle: 'leaves' },
    winter: { leafHueShift: -20, leafSatMul: 0.45, leafLightMul: 0.75, groundSatMul: 0.7, groundLightAdd: 0.04, snow: 0.35, fog: 0.1, wind: 1.15 },
  },
  tropical: {
    spring: { leafHueShift: 6, leafSatMul: 1.20, leafLightMul: 1.12, groundSatMul: 1.15, groundLightAdd: 0.04, wind: 1.0 },
    summer: {},
    autumn: { leafHueShift: -18, leafSatMul: 1.05, groundHueShift: -22, groundSatMul: 1.15, groundLightAdd: 0.03 },   // harvest gold in the paddies
    winter: { leafHueShift: -6, leafSatMul: 0.9, leafLightMul: 0.92, groundSatMul: 0.85, fog: 0.12, wind: 0.9 },   // the dry, misty season
  },
  arid: {
    spring: { leafHueShift: 4, leafSatMul: 1.15, leafLightMul: 1.06, groundSatMul: 1.05, blossom: 0.4, blossomHue: 30 },
    summer: { fog: 0.06, wind: 1.05 },   // the heat haze
    autumn: { leafSatMul: 0.95, groundSatMul: 0.95 },
    winter: { leafSatMul: 0.9, leafLightMul: 0.95, groundLightAdd: -0.02, fog: 0.05, wind: 0.9 },
  },
});

/** Per-era touches on top of the climate look — the country's own signature of that season. */
const ERA_TOUCH = Object.freeze({
  13: { spring: { blossom: 1.0, blossomHue: 345, particle: 'petals' } },   // sakura
  4:  { spring: { blossom: 0.7, blossomHue: 350 } },                        // peach blossom over Chang'an
  1:  { spring: { blossom: 0.45, blossomHue: 48, particle: null } },          // steppe wildflowers, yellow
  6:  { spring: { leafSatMul: 1.35, leafLightMul: 1.2 }, autumn: { groundHueShift: -28, groundSatMul: 1.25 } },   // young rice · ripe rice
  12: { spring: { snow: 0.3 }, autumn: { snow: 0.2 }, summer: { snow: 0 } },  // Stalingrad: its own ground is snow all year (`groundKind`)
  10: { autumn: { fog: 0.3 }, winter: { fog: 0.3 } },                         // Manchester smog thickens
});

const IDENTITY = Object.freeze({
  leafHueShift: 0, leafSatMul: 1, leafLightMul: 1, groundHueShift: 0, groundSatMul: 1, groundLightAdd: 0,
  snow: 0, blossom: 0, blossomHue: 340, wind: 1, fog: 0, particle: null,
});

/** The look of `era` in `season` — total: an unknown era or season is the base (summer) look. */
export function seasonLook(era, season) {
  const climate = ERA_CLIMATE[Number(era)] ?? 'temperate';
  const s = isSeason(season) ? season : 'summer';
  return Object.freeze({ ...IDENTITY, ...(LOOK[climate]?.[s] ?? {}), ...(ERA_TOUCH[Number(era)]?.[s] ?? {}), season: s, climate });
}

/** Which falling particle the season adds (on top of weather and the era's own list). */
export function seasonParticle(look) {
  return look?.particle ?? null;
}
