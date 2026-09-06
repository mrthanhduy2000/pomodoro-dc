/**
 * seededRng.js — deterministic pseudo-random generator keyed by a string (ADR-076).
 *
 * Moved out of `store/gameStore.js` on 2026-09-06 so the pure mission and weekly-chain modules can
 * share it without importing the store. Same algorithm as before (xmur3-style seed mix + mulberry32),
 * so every daily roll and weekly pick stays byte-identical to what saved games already carry.
 */
export function createSeededRng(seedKey) {
  let seed = 1779033703 ^ seedKey.length;
  for (let i = 0; i < seedKey.length; i += 1) {
    seed = Math.imul(seed ^ seedKey.charCodeAt(i), 3432918353);
    seed = (seed << 13) | (seed >>> 19);
  }
  seed = Math.imul(seed ^ (seed >>> 16), 2246822507);
  seed = Math.imul(seed ^ (seed >>> 13), 3266489909);
  seed = (seed ^ (seed >>> 16)) >>> 0;
  return () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
