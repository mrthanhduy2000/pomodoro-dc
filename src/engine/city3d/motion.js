/**
 * motion.js — WHAT MOVES IN EACH CENTURY, and the deterministic clock that moves it (round 48, ADR-088).
 *
 * Until this round the only thing that moved in the 3D city was people; `sceneGraph.js` said so in
 * one line (`isAnimated: residents.length > 0`). Motion is the first thing the eye catches — before
 * colour, before shape — so a city that does not move reads as a photograph however good the photo.
 *
 * This file is PURE (no `three`): it names the vocabulary per era and hands the renderer numbers.
 * The renderer (`render3d/motion.js`) turns them into a vertex attribute, a `uTime` uniform and a
 * few instanced particles. Two laws hold everything together:
 *   1. DETERMINISM — every motion is a function of (position, time). The same scene at the same
 *      second is the same picture, so two frames can be compared and the ruler cannot lie (lesson 104).
 *      Nothing here calls `Math.random`.
 *   2. NO SYNCHRONY — every object carries its own phase from `phaseAt(x, z)`, so no two trees sway
 *      in step and no two chimneys puff together; a wind that hits everything at once reads as a
 *      machine, not weather.
 *
 * Era vocabulary follows `humanGait.js`'s rule: not one motion at 15 speeds, but different KINDS of
 * motion — Manchester's soot is not Stalingrad's snow is not Dubai's sand.
 */

/** Codes written into the `aMotion.x` vertex attribute; the shader switches on them. */
export const MOTION_KIND = Object.freeze({ none: 0, sway: 1, bob: 2, flap: 3 });

/** Part roles that move on their own — the foliage of every era. Paddy rows are `leaf` too. */
const SWAY_ROLES = new Set(['leaf', 'leaf2']);
/** Cloth: flags, banners, sails, awnings, laundry (round 49 gave them shapes). */
const FLAP_ROLES = new Set(['cloth', 'cloth2', 'canvas', 'flag']);   // canvas = undyed sailcloth, flag = dyed; residents are instanced, not merged
/** Things that ride the water or hang from a rope: boat hulls, crane hooks. */
const BOB_ROLES = new Set(['hull', 'hook']);

/** Which motion a part role gets; `none` for masonry, wood, glass, water. */
export function motionKindForRole(role) {
  if (SWAY_ROLES.has(role)) return MOTION_KIND.sway;
  if (FLAP_ROLES.has(role)) return MOTION_KIND.flap;
  if (BOB_ROLES.has(role)) return MOTION_KIND.bob;
  return MOTION_KIND.none;
}

/** Deterministic phase in [0, 2π) from a world position — two neighbours never share it. */
export function phaseAt(x, z) {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return (s - Math.floor(s)) * Math.PI * 2;
}

/**
 * Per-era vocabulary. `wind` drives the sway/flap amplitude and speed (unitless amplitude in
 * world units at the crown, speed in radians per second). `particles` lists the instanced
 * particle systems the renderer should run; `smoke` says whether chimneys/hearths puff.
 *   • sway/flap amplitudes are chosen to be visible at the DEFAULT camera on a 1 400 px frame:
 *     a crown of 0,9 units moving 0,05 units is ~2 px — below the eye; 0,10–0,14 is 4–6 px.
 */
export const ERA_MOTION = Object.freeze({
  1:  { wind: { amp: 0.12, speed: 1.1 }, smoke: 'hearth',  particles: ['fire', 'smoke', 'birds'], note: 'steppe wind over Göbekli Tepe; hearth smoke; kites and cranes overhead' },
  2:  { wind: { amp: 0.11, speed: 0.9 }, smoke: 'hearth',  particles: ['fire', 'smoke', 'dust'],  note: 'Nile breeze in the palms; cooking smoke; dust on the desert edge' },
  3:  { wind: { amp: 0.10, speed: 1.0 }, smoke: 'hearth',  particles: ['fire', 'smoke', 'dust'],  note: 'Mesopotamian heat haze, dust; hearths of Ur' },
  4:  { wind: { amp: 0.10, speed: 0.8 }, smoke: 'hearth',  particles: ['fire', 'smoke'],          note: "Chang'an banners; paddies south of the wall ripple" },
  5:  { wind: { amp: 0.13, speed: 1.2 }, smoke: 'chimney', particles: ['fire', 'smoke', 'birds'], note: 'Eifel forest in the wind; stone chimneys of the Fachwerk houses' },
  6:  { wind: { amp: 0.14, speed: 1.0 }, smoke: 'hearth',  particles: ['fire', 'smoke', 'birds'], note: 'paddies of the Red River delta in waves; kitchen smoke at dusk' },
  7:  { wind: { amp: 0.09, speed: 0.9 }, smoke: 'chimney', particles: ['fire', 'smoke', 'birds'], note: 'cypresses barely move; banners on the Duomo square' },
  8:  { wind: { amp: 0.13, speed: 1.3 }, smoke: 'chimney', particles: ['fire', 'smoke', 'birds'], note: 'Atlantic wind: flags, sails, gulls over the Tagus' },
  9:  { wind: { amp: 0.10, speed: 1.0 }, smoke: 'chimney', particles: ['fire', 'smoke'],          note: 'Paris chimneys; plane trees on the boulevards' },
  10: { wind: { amp: 0.09, speed: 1.0 }, smoke: 'factory', particles: ['fire', 'smoke'],          note: 'Manchester: factory stacks pour soot; little green to move' },
  11: { wind: { amp: 0.10, speed: 1.1 }, smoke: 'steam',   particles: ['smoke', 'birds'], note: 'steam from Manhattan rooftops; flags on the towers' },
  12: { wind: { amp: 0.11, speed: 1.4 }, smoke: 'chimney', particles: ['fire', 'smoke', 'snow'],  note: 'Stalingrad: snow falling, stove smoke bent by the wind' },
  13: { wind: { amp: 0.08, speed: 0.9 }, smoke: 'steam',   particles: ['steam'],          note: 'Tokyo: vent steam, trees in a light rain wind' },
  14: { wind: { amp: 0.11, speed: 1.0 }, smoke: null,      particles: ['birds'],          note: 'Marina Bay: sea breeze in the rain trees, gulls' },
  15: { wind: { amp: 0.09, speed: 1.2 }, smoke: null,      particles: ['sand'],           note: 'Dubai: sand haze drifting between the towers, palms' },
});

const FALLBACK_MOTION = Object.freeze({ wind: { amp: 0.10, speed: 1.0 }, smoke: 'hearth', particles: ['smoke'], note: '' });
// (no `fire` in the fallback: an unknown era has no guaranteed fire source, and a declared particle
// kind with zero sources is exactly what `sceneStats.test.js` forbids)

export function getEraMotion(era) {
  return ERA_MOTION[Number(era)] ?? FALLBACK_MOTION;
}

/**
 * Particle recipes. Every particle is a function of (index, time): `spawn` per source, `life` in
 * seconds, `rise` world units per second, `drift` sideways per second, `size` start→end.
 */
export const PARTICLE_STYLE = Object.freeze({
  smoke:  { life: 5.5, rise: 0.22, drift: 0.05, size: [0.045, 0.16], tint: 0x8f8d88, alpha: 0.55, perSource: 5, wide: false },
  steam:  { life: 3.5, rise: 0.30, drift: 0.03, size: [0.035, 0.12], tint: 0xe8e8e6, alpha: 0.50, perSource: 4, wide: false },
  snow:   { life: 9.0, rise: -0.18, drift: 0.12, size: [0.024, 0.024], tint: 0xffffff, alpha: 0.95, perSource: 0, wide: true, count: 480 },
  sand:   { life: 7.0, rise: 0.02, drift: 0.35, size: [0.05, 0.14], tint: 0xd9b57a, alpha: 0.28, perSource: 0, wide: true, count: 120 },
  dust:   { life: 6.0, rise: 0.04, drift: 0.22, size: [0.05, 0.13], tint: 0xcbb48c, alpha: 0.22, perSource: 0, wide: true, count: 90 },
  birds:  { life: 22,  rise: 0,    drift: 0.55, size: [0.03, 0.03], tint: 0x2b2a28, alpha: 1.0,  perSource: 0, wide: true, count: 9 },
  // Round 49 (ADR-089): FIRE. Short-lived, fast-rising tongues that shrink and cool from orange to
  // dark red (`tintEnd`), drawn ADDITIVE and unfogged so they read as light, not as paint. Every
  // fourth particle is an EMBER: a tiny bright speck that lives twice as long and drifts wider.
  // Sources are the parts tagged `fire` (campfires, braziers, forges, torches, firepits).
  fire:   { life: 1.3, rise: 0.5, drift: 0.02, size: [0.06, 0.012], tint: 0xff9a2e, tintEnd: 0x8a1a06, alpha: 0.92, perSource: 8, wide: false, additive: true, fog: false },
  // Round 49 (ADR-089): RAIN — fast vertical streaks (`streak` = how many times taller than wide),
  // falling the whole height of the volume in ~1,2 s; drizzle is sparser, shorter and fainter. Both
  // come from `weather.js`, never from an era's own list — and never without wet ground.
  rain:    { life: 1.2, rise: -3.3, drift: 0.25, size: [0.011, 0.011], tint: 0xdde6ee, alpha: 0.55, perSource: 0, wide: true, count: 640, streak: 9 },
  drizzle: { life: 1.5, rise: -2.6, drift: 0.18, size: [0.008, 0.008], tint: 0xd8e0e8, alpha: 0.38, perSource: 0, wide: true, count: 300, streak: 5 },
});

/**
 * Round 49 (ADR-089): smoke is lit by the sky. At night a grey puff drawn at full daytime grey glows
 * like a lantern — so the tint is scaled by the phase before it reaches the material.
 */
export const SMOKE_LIGHT = Object.freeze({ dawn: 0.8, morning: 1, noon: 1, afternoon: 1, dusk: 0.62, night: 0.3 });
export function smokeLightFor(phase) {
  return SMOKE_LIGHT[phase] ?? 1;
}

/** Round 49 (ADR-089): the part role and tag that mean "this burns". One name, read by both layers. */
export const FIRE_ROLE = 'flame';
export const FIRE_TAG = 'fire';

/**
 * Round 49 (ADR-089): local point lights around fires at night. `max` is a hard cap per scene (the
 * three-light law forbids a 4th FILL light; a handful of LOCAL lights is allowed), `reachCells` is
 * the light's distance in grid cells. Flicker is DETERMINISTIC in t — three incommensurate sines,
 * never `Math.random` — so two frames at the same t are identical (the photo law).
 */
export const FIRE_LIGHT = Object.freeze({ max: 6, color: 0xff8f2a, intensity: 3.4, reachCells: 0.24, decay: 2 });
export function fireFlicker(t, phase = 0) {
  const a = Math.sin(t * 9.3 + phase) * 0.5 + Math.sin(t * 17.1 + phase * 2.3) * 0.3 + Math.sin(t * 3.7 + phase * 0.7) * 0.2;
  return 0.82 + 0.18 * (a * 0.5 + 0.5);
}

/** Factory stacks pour more than a hearth. */
export const SMOKE_INTENSITY = Object.freeze({ hearth: 0.7, chimney: 1.0, factory: 1.8, steam: 0.8 });

/**
 * Sway weight for a vertex of a moving part — 0 at the placement's base, 1 at `reach` above it —
 * so trunks stay planted and only crowns and blades move. The shader multiplies this by the wind
 * amplitude and a distance fall-off.
 */
export function swayWeight(heightAboveBase, reach = 1.2) {
  if (!(heightAboveBase > 0)) return 0;
  const t = Math.min(1, heightAboveBase / reach);
  return t * t;
}

/**
 * The clock the renderer feeds the shader. Motion time is wrapped so `sin(uTime)` keeps float
 * precision after hours on screen; the wrap length is a common multiple of the wind speeds used.
 */
export const MOTION_WRAP_SECONDS = 3600;
export function motionTime(seconds) {
  const s = Number.isFinite(seconds) ? seconds : 0;
  return s - Math.floor(s / MOTION_WRAP_SECONDS) * MOTION_WRAP_SECONDS;
}
