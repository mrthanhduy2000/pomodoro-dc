/**
 * sky.js — Round 51 (ADR-091): THE SKY IS HALF THE PICTURE NOW.
 *
 * Standing on the street (round 50's walk mode) the sky fills nearly half the frame and the road most
 * of the other half — and both were empty. This file answers *what is up there*, as a pure function
 * of (era, season, hour, weather): how much cloud and of what kind, how fast it drifts, what colour it
 * takes from a low sun, how many stars are visible through the era's own light pollution, whether the
 * Milky Way shows, and where the moon is in its cycle.
 *
 * Everything is deterministic. The moon's phase comes from a DAY INDEX the caller passes (the app
 * gives it the real date, the preview tool a fixed one), never from `Date.now()` inside a render.
 *
 * ⚠️ THE GRADIENT ITSELF IS NOT TOUCHED. `palette3d.js` spent three rounds tuning the warm-horizon,
 * cool-zenith ramp and `sceneGraph.paintSkyGradient` paints it; everything here goes ON TOP of that.
 */
import { getEraMotion } from './motion';
import { seasonLook } from './season';
import { phaseForHour } from './daylight';

/** The kinds of cloud this sky can draw. `none` is a real answer — a desert noon has no cloud. */
export const CLOUD_KINDS = Object.freeze(['none', 'cirrus', 'cumulus', 'stratus', 'storm', 'low']);

/**
 * The sky each century lives under, as its own two facts: `base` is the cloud kind of an ordinary
 * day, and `pollution` is how much of the night sky its lamps and chimneys wash out (0 = a dark
 * steppe sky with the Milky Way, 1 = downtown Tokyo where a dozen stars survive).
 */
export const ERA_SKY = Object.freeze({
  1:  { base: 'cumulus', amount: 0.35, pollution: 0.00, note: 'Anatolia: a high dry sky, the Milky Way edge to edge' },
  2:  { base: 'none',    amount: 0.10, pollution: 0.02, note: 'Egypt: the desert sky, almost never a cloud' },
  3:  { base: 'none',    amount: 0.14, pollution: 0.03, note: 'Mesopotamia: dust haze rather than cloud' },
  4:  { base: 'cumulus', amount: 0.40, pollution: 0.08, note: "Chang'an: a monsoon sky, tall summer cloud" },
  5:  { base: 'stratus', amount: 0.62, pollution: 0.05, note: 'Eifel: low grey cover most of the year' },
  6:  { base: 'cumulus', amount: 0.55, pollution: 0.10, note: 'Red River delta: humid, towering afternoon cloud' },
  7:  { base: 'cirrus',  amount: 0.22, pollution: 0.10, note: 'Tuscany: the high blue Mediterranean sky' },
  8:  { base: 'cumulus', amount: 0.45, pollution: 0.12, note: 'Lisbon: Atlantic cloud running in off the sea' },
  9:  { base: 'stratus', amount: 0.55, pollution: 0.30, note: 'Paris: a soft grey lid, gas lamps below' },
  10: { base: 'low',     amount: 0.85, pollution: 0.55, note: 'Manchester: smoke and low cloud, the sky closed in' },
  11: { base: 'cumulus', amount: 0.40, pollution: 0.80, note: 'New York: electric light drowns the stars' },
  12: { base: 'stratus', amount: 0.70, pollution: 0.35, note: 'Stalingrad: a winter lid, smoke rising into it' },
  13: { base: 'cumulus', amount: 0.42, pollution: 0.95, note: 'Tokyo: the brightest night sky on the board' },
  14: { base: 'cumulus', amount: 0.50, pollution: 0.85, note: 'Marina Bay: equatorial cloud, a lit skyline' },
  15: { base: 'none',    amount: 0.12, pollution: 0.70, note: 'Dubai: a white desert sky by day, lit towers by night' },
});

/** How the season leans an era's cloud: more and lower in winter, tall and bright in summer. */
const SEASON_CLOUD = Object.freeze({
  spring: { amount: 1.15, kind: null },
  summer: { amount: 0.85, kind: null },
  autumn: { amount: 1.25, kind: 'stratus' },
  winter: { amount: 1.35, kind: 'low' },
});

/** What the weather insists on, whatever the era and season prefer. */
const WEATHER_CLOUD = Object.freeze({
  rain:    { kind: 'storm',   amount: 0.95 },
  drizzle: { kind: 'stratus', amount: 0.85 },
  snow:    { kind: 'low',     amount: 0.9 },
  fog:     { kind: 'low',     amount: 0.8 },
  // ⚠️ HAZE IS AIR, NOT CLOUD. It gets a KIND (whatever is up there reads as thin and high) but no
  // `amount` of its own — forcing 0,4 here is what turned an Egyptian noon into a half-clouded sky.
  haze:    { kind: 'cirrus',  amount: null },
  sand:    { kind: 'none',    amount: 0.15 },
  clear:   { kind: null,      amount: null },
});

/**
 * Cloud geometry per kind: how high it sits, how big a puff is, how flat, how many, how fast, how
 * opaque; `stretch`, how far it is drawn out ALONG THE WIND — a cirrus is a streak, a cumulus a heap,
 * and that ratio is most of what tells the two apart at a glance;
 * and `shadow`, how dark a shadow it throws on the ground relative to a fair-weather cumulus.
 * Thin cirrus at six kilometres barely dims the light; a cumulus edge is the crisp shadow that runs
 * across a field. That is a fact about the CLOUD, so it belongs in the cloud's own row.
 */
export const CLOUD_SHAPE = Object.freeze({
  cirrus:  { height: 5.6, puff: 1.5, flat: 0.10, perUnit: 5,  speed: 1.45, alpha: 0.42, shadow: 0.18, stretch: 3.4 },
  cumulus: { height: 3.9, puff: 1.1, flat: 0.55, perUnit: 7,  speed: 1.00, alpha: 0.92, shadow: 1.00, stretch: 1.15 },
  stratus: { height: 3.1, puff: 2.2, flat: 0.20, perUnit: 5,  speed: 0.75, alpha: 0.80, shadow: 0.50, stretch: 2.2 },
  storm:   { height: 3.4, puff: 1.6, flat: 0.85, perUnit: 8,  speed: 1.20, alpha: 0.95, shadow: 0.90, stretch: 1.3 },
  low:     { height: 2.3, puff: 2.6, flat: 0.16, perUnit: 6,  speed: 0.60, alpha: 0.72, shadow: 0.35, stretch: 2.6 },
});

/** A day index for the moon: whole days since an arbitrary epoch. Pure — the caller reads the clock. */
export const MOON_CYCLE_DAYS = 29.53;
export function moonPhase(dayIndex) {
  const d = Number.isFinite(dayIndex) ? dayIndex : 0;
  const t = ((d % MOON_CYCLE_DAYS) + MOON_CYCLE_DAYS) % MOON_CYCLE_DAYS;
  const frac = t / MOON_CYCLE_DAYS;                  // 0 = new, 0,5 = full
  const lit = (1 - Math.cos(frac * Math.PI * 2)) / 2; // 0…1 illuminated share
  return { frac, lit, waxing: frac < 0.5 };
}

/**
 * The sky over `era` in `season` at `hour`, under `weather`.
 *
 * @returns `{ cloudKind, cloudAmount, cloudSpeed, cloudTint, underlit, stars, milkyWay, moon }`
 *   · `cloudAmount` 0–1 (a share of the sky) · `cloudSpeed` in world units per second
 *   · `underlit` 0–1: how much the low sun paints the clouds from below (dawn/dusk)
 *   · `stars` 0–1 density · `milkyWay` boolean · `moon.lit` illuminated share
 */
export function skyAt({ era = 1, season = null, hour = 12, weather = null, dayIndex = 0 } = {}) {
  const eraSky = ERA_SKY[Number(era)] ?? ERA_SKY[1];
  const phase = phaseForHour(hour);
  const look = seasonLook(era, season);
  const seasonCloud = SEASON_CLOUD[look.season] ?? SEASON_CLOUD.summer;
  const w = WEATHER_CLOUD[weather?.kind] ?? WEATHER_CLOUD.clear;

  let kind = w.kind ?? seasonCloud.kind ?? eraSky.base;
  let amount = w.amount ?? Math.min(1, eraSky.amount * seasonCloud.amount);
  // the era's own fog and the weather's fog both mean "the air is thick" — the sky closes in
  // ⚠️ THICK AIR IS NOT CLOUD COVER. The first draft added half the fog straight onto `amount`, and
  // Egypt at noon — a sky whose whole character is that it has no cloud — came out at 0,51, i.e. as
  // cloudy as Lisbon. Fog belongs in the sum (a hazy sky does read as fuller) but at a fraction of
  // the weight, or the one era defined by an empty sky loses it.
  amount = Math.min(1, amount + (weather?.fog ?? 0) * 0.22 + look.fog * 0.18);
  if (kind === 'none' && amount > 0.3) kind = 'cirrus';   // enough moisture to draw something
  if (amount < 0.05) kind = 'none';

  const night = phase === 'night';
  // A low sun lights cloud from BELOW — the one thing that makes a dusk sky read as a dusk sky.
  const underlit = phase === 'dawn' || phase === 'dusk' ? 1 : (phase === 'morning' || phase === 'afternoon' ? 0.25 : 0);
  const clear = 1 - amount;
  const stars = night ? Math.max(0, clear * (1 - eraSky.pollution)) : 0;

  return Object.freeze({
    kind, amount,
    speed: (CLOUD_SHAPE[kind]?.speed ?? 1) * (getEraMotion(era).wind?.speed ?? 1) * look.wind * 0.05,
    underlit,
    stars,
    // the Milky Way is a fact about the SKY, not about the lens: it needs a dark era and a clear night
    milkyWay: night && eraSky.pollution <= 0.12 && clear > 0.55,
    moon: night ? moonPhase(dayIndex) : null,
    pollution: eraSky.pollution,
    phase,
    season: look.season,
  });
}

/**
 * How many CLOUDS a sky of this size needs (one cloud is drawn as a cluster of puffs — see
 * `skyLayer.PUFFS_PER_CLOUD`). Bigger city ⇒ wider sky ⇒ more clouds.
 *
 * ⚠️ THE FLOOR `0,35 +` IS THE POINT, NOT A FUDGE. Cloud AMOUNT says how much of the sky is
 * covered, and a thin sky covers little with FEW BIG shapes — but on a dome 38 units across, "few"
 * measured straight off `amount` came out as five clouds for Tuscany, and five clouds on a whole sky
 * reads as litter, not as weather. The count sets how BUSY the sky is; `amount` still sets how much
 * of it is covered, through the puff size and the alpha. Two questions, two numbers.
 */
export function cloudCount(sky, gridSize = 12) {
  if (!sky || sky.kind === 'none' || !(sky.amount > 0)) return 0;
  const shape = CLOUD_SHAPE[sky.kind] ?? CLOUD_SHAPE.cumulus;
  return Math.round(shape.perUnit * (0.35 + sky.amount) * Math.max(6, gridSize) * 0.9);
}

/**
 * How many stars to draw. Zero by day, and zero in a city that has washed its own sky out.
 *
 * ⚠️ THE NUMBER HAS TO BE BIG OR THE SKY READS AS SNOWFALL. The first rendered night had 420 × 0,70
 * ≈ 294 stars, each about a degree across, and Anatolia's "Milky Way edge to edge" came out as two
 * dozen white flecks. A sky is only a sky when the stars are TOO MANY TO COUNT and too small to
 * resolve — so the count goes up an order of magnitude and the size comes down (`skyLayer`).
 */
export function starCount(sky) {
  if (!sky || !(sky.stars > 0)) return 0;
  return Math.round(1100 * sky.stars) + (sky.milkyWay ? 900 : 0);
}
