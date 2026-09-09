/**
 * weather.js — Round 49 (ADR-089): WHAT THE SKY IS DOING over each era, as a pure function of
 * (era, hour). Nothing here is random and nothing here is a clock: the renderer asks once, with the
 * same hour it gives `deriveDaylight`, and a sealed era asks with `MUSEUM_HOUR` forever.
 *
 * The table is written per DAY PHASE, not per hour, on purpose: the scene is rebuilt when the phase
 * changes (`CityScene3D` watches `deriveDaylight(hour).phase`), so weather that only changes at
 * phase boundaries never needs a rebuild of its own — one clock, one trigger.
 *
 * ⚠️ THE ONE LAW OF THIS FILE: RAIN WETS THE GROUND. `wet` is never below `rain` — a frame with rain
 * streaks over a dry, matte street is "a photo with white noise on it" (Đàm, round 49). The renderer
 * reads `wet` for the ground materials (`wetSurface`) and `rain` for the particle layer; the two
 * cannot disagree because they come from the same row through `normalize`.
 */
import { MUSEUM_HOUR, phaseForHour } from './daylight';
import { ERA_CLIMATE, isSeason, museumSeason } from './season';

export const WEATHER_KINDS = Object.freeze(['clear', 'haze', 'fog', 'drizzle', 'rain', 'snow', 'sand']);

/**
 * Per era, per phase. Fields: `kind` (a WEATHER_KINDS name) · `rain` 0–1 (particle density: 0,45 is a
 * drizzle, 1 a downpour) · `wet` 0–1 (how wet the ground reads) · `fog` 0–1 (extra fog density on top
 * of the daylight haze). A missing phase is clear and dry. Climates, not decoration: a monsoon city
 * rains in the afternoon, an Atlantic port in the morning, a northern mill town all day.
 */
const ERA_WEATHER = Object.freeze({
  1:  { dawn: { kind: 'fog', fog: 0.55 } },
  2:  { noon: { kind: 'haze', fog: 0.18 }, afternoon: { kind: 'haze', fog: 0.14 } },
  3:  { afternoon: { kind: 'sand', fog: 0.32 }, dusk: { kind: 'haze', fog: 0.16 } },
  4:  { afternoon: { kind: 'rain', rain: 1.0, wet: 1.0, fog: 0.18 }, dusk: { kind: 'drizzle', rain: 0.45, wet: 0.9, fog: 0.12 } },
  5:  { dawn: { kind: 'fog', fog: 0.7, wet: 0.5 }, dusk: { kind: 'drizzle', rain: 0.45, wet: 0.75, fog: 0.2 } },
  6:  { afternoon: { kind: 'rain', rain: 1.0, wet: 1.0, fog: 0.22 }, dusk: { kind: 'clear', wet: 0.7 } },
  7:  { dawn: { kind: 'haze', fog: 0.14 } },
  8:  { morning: { kind: 'rain', rain: 0.8, wet: 1.0, fog: 0.16 }, noon: { kind: 'clear', wet: 0.45 } },
  9:  { dusk: { kind: 'rain', rain: 0.9, wet: 1.0, fog: 0.16 }, night: { kind: 'rain', rain: 0.7, wet: 1.0, fog: 0.12 } },
  10: { dawn: { kind: 'fog', fog: 0.7, wet: 0.6 }, morning: { kind: 'drizzle', rain: 0.45, wet: 0.8, fog: 0.45 }, noon: { kind: 'drizzle', rain: 0.4, wet: 0.8, fog: 0.4 }, afternoon: { kind: 'drizzle', rain: 0.45, wet: 0.85, fog: 0.42 }, dusk: { kind: 'fog', fog: 0.5, wet: 0.7 }, night: { kind: 'fog', fog: 0.35, wet: 0.6 } },
  11: { afternoon: { kind: 'clear' }, night: { kind: 'rain', rain: 0.85, wet: 1.0, fog: 0.1 } },
  12: { dawn: { kind: 'snow', fog: 0.3 }, morning: { kind: 'snow', fog: 0.2 }, noon: { kind: 'snow', fog: 0.15 }, afternoon: { kind: 'snow', fog: 0.2 }, dusk: { kind: 'snow', fog: 0.3 }, night: { kind: 'snow', fog: 0.38 } },
  13: { afternoon: { kind: 'drizzle', rain: 0.45, wet: 0.8, fog: 0.14 }, dusk: { kind: 'rain', rain: 0.9, wet: 1.0, fog: 0.14 }, night: { kind: 'rain', rain: 1.0, wet: 1.0, fog: 0.16 } },
  14: { afternoon: { kind: 'rain', rain: 1.0, wet: 1.0, fog: 0.3 }, dusk: { kind: 'clear', wet: 0.8 } },
  15: { noon: { kind: 'sand', fog: 0.45 }, afternoon: { kind: 'sand', fog: 0.35 }, dusk: { kind: 'haze', fog: 0.2 } },
});

const CLEAR = Object.freeze({ kind: 'clear', rain: 0, wet: 0, fog: 0 });

/**
 * Round 50 (ADR-090): THE SEASON'S SAY. Per climate × season × phase, a row that REPLACES the era's
 * own row for that phase. Summer is absent on purpose — it is the base every era row was written
 * for. A cold winter turns every rain into snow (`snowify`), whatever the era row said.
 */
const SEASON_WEATHER = Object.freeze({
  cold: {
    spring:  { afternoon: { kind: 'rain', rain: 0.6, wet: 0.85, fog: 0.1 }, dawn: { kind: 'fog', fog: 0.35 } },
    autumn:  { dawn: { kind: 'fog', fog: 0.6, wet: 0.4 }, dusk: { kind: 'drizzle', rain: 0.45, wet: 0.7, fog: 0.2 }, night: { kind: 'fog', fog: 0.3, wet: 0.4 } },
    winter:  { dawn: { kind: 'snow', snowfall: 0.5, fog: 0.35 }, morning: { kind: 'snow', snowfall: 0.35, fog: 0.2 }, noon: { kind: 'clear', fog: 0.1 }, afternoon: { kind: 'snow', snowfall: 0.6, fog: 0.2 }, dusk: { kind: 'snow', snowfall: 0.8, fog: 0.3 }, night: { kind: 'snow', snowfall: 1.0, fog: 0.35 } },
  },
  temperate: {
    spring:  { afternoon: { kind: 'rain', rain: 0.5, wet: 0.8, fog: 0.1 }, dusk: { kind: 'clear', wet: 0.5 } },
    autumn:  { dawn: { kind: 'fog', fog: 0.4 }, dusk: { kind: 'haze', fog: 0.15 } },
    winter:  { dawn: { kind: 'fog', fog: 0.5, wet: 0.3 }, night: { kind: 'drizzle', rain: 0.4, wet: 0.6, fog: 0.15 } },
  },
  tropical: {
    spring:  { dawn: { kind: 'drizzle', rain: 0.4, wet: 0.6, fog: 0.2 } },
    autumn:  { afternoon: { kind: 'rain', rain: 0.8, wet: 1.0, fog: 0.15 } },
    winter:  { morning: { kind: 'fog', fog: 0.35 }, afternoon: { kind: 'clear' }, dusk: { kind: 'haze', fog: 0.12 } },   // the dry season
  },
  arid: {
    spring:  { noon: { kind: 'clear' }, afternoon: { kind: 'clear' } },
    autumn:  { afternoon: { kind: 'haze', fog: 0.15 } },
    winter:  { dawn: { kind: 'fog', fog: 0.25 }, noon: { kind: 'clear' }, afternoon: { kind: 'clear' } },
  },
});

/** A cold winter: whatever was going to fall, falls as snow. */
function snowify(row) {
  if (!(row.rain > 0)) return row;
  return { ...row, kind: 'snow', snowfall: Math.max(row.snowfall ?? 0, row.rain), rain: 0, wet: Math.max(row.wet ?? 0, 0.4) };
}

function normalize(row, phase, season) {
  const rain = Math.min(1, Math.max(0, row.rain ?? 0));
  const wet = Math.min(1, Math.max(rain, row.wet ?? 0));   // ⚠️ the one law: wet ≥ rain
  const fog = Math.min(1, Math.max(0, row.fog ?? 0));
  const kind = WEATHER_KINDS.includes(row.kind) ? row.kind : 'clear';
  const snowfall = kind === 'snow' ? Math.min(1, Math.max(0, row.snowfall ?? 0)) : 0;   // only snow snows
  return Object.freeze({ kind, rain, wet, fog, snowfall, phase, season: season ?? null });
}

/**
 * The weather over `era` at `hour` (0–24, Vietnam clock like `deriveDaylight`), in `season`
 * (round 50; `null`/`'summer'` = the era's own rows). Pure, total.
 */
export function weatherAt(era, hour, season = null) {
  const phase = phaseForHour(hour);
  const base = ERA_WEATHER[Number(era)]?.[phase] ?? CLEAR;
  const s = isSeason(season) ? season : null;
  const climate = ERA_CLIMATE[Number(era)] ?? 'temperate';
  let row = (s && SEASON_WEATHER[climate]?.[s]?.[phase]) || base;
  if (s === 'winter' && climate === 'cold') row = snowify(row);
  return normalize(row, phase, s);
}

/** A sealed era is lit once (`museumDaylight`) — and rained on once, at the same hour, in ITS season. */
export function museumWeather(era) {
  return weatherAt(era, MUSEUM_HOUR, museumSeason(era));
}

/**
 * How wet ground looks: roughness falls toward `roughness` (the sky starts to reflect), the albedo
 * darkens by `darken` (wet earth and stone are darker — the single most reliable "it rained" cue),
 * and the specular gain rises so the reflected sky actually shows on a 1 400 px frame.
 */
export const WET_GROUND = Object.freeze({ roughness: 0.34, darken: 0.30, specularGain: 2.4 });

/** Blend a dry material's numbers toward wet by `wet` ∈ [0, 1]. Returns the numbers, not a material. */
export function wetSurface({ roughness, specularGain = 1 }, wet) {
  const w = Math.min(1, Math.max(0, wet ?? 0));
  return {
    roughness: roughness + (WET_GROUND.roughness - roughness) * w,
    darken: 1 - WET_GROUND.darken * w,
    specularGain: specularGain * (1 + (WET_GROUND.specularGain - 1) * w),
  };
}

/** Which particle system the weather adds on top of the era's own vocabulary (`ERA_MOTION`). */
export function weatherParticle(weather) {
  if (!weather) return null;
  if (weather.rain > 0) return weather.rain >= 0.6 ? 'rain' : 'drizzle';
  if (weather.snowfall > 0) return 'snow';   // round 50: a cold winter snows in eras that have no snow of their own
  return null;
}
