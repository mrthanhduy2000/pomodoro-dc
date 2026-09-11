/**
 * surfaceTexture.js — ROUND 52 (ADR-092): REAL SURFACE MAPS, GENERATED IN CODE.
 *
 * Until this round the city had **not one texture map**. Every surface was a flat vertex colour plus
 * a noise field injected in the shader (`surfaceDetail.js`). From the overview that is enough; from
 * the pavement, where round 50 put the eye, it reads as plastic — there is no mortar joint, no wood
 * grain, no rust, no tile edge, nothing for the light to catch on.
 *
 * ⚠️ GENERATED, NEVER DOWNLOADED. Every map here is computed from a hash at build time into a
 * `DataTexture`. No image file enters the repository, no request goes over the network, the PWA
 * precache does not grow by a byte, and the result is byte-identical on every machine and every run —
 * which the round's determinism law requires and which the whole before/after photographic method
 * depends on (lesson 105).
 *
 * ⚠️ AND THEY ARE SAMPLED TRIPLANAR, BY WORLD POSITION — because this geometry HAS NO UVs. The city
 * is one merged `BufferGeometry` of a thousand prisms (`geometryFactory.js`); there is no unwrap, and
 * inventing one would mean rebuilding the merge. Triplanar sampling needs no unwrap at all: it reads
 * the map three times, along xz · xy · zy, and blends by the surface normal. It also has a property
 * that matters more here than the cost — the grain is continuous ACROSS the merge, so two prisms that
 * form one wall share one run of brickwork instead of each starting its own.
 *
 * ⚠️ ONE MAP PER FAMILY, NOT PER MATERIAL. `materials.js` already groups every part role into 16
 * families; a family is exactly "things whose surface behaves the same way", which is exactly the
 * right grain for a texture. 16 maps × 3 channels, generated once per scene, shared by every wall in
 * the city.
 */
import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RGBAFormat, RepeatWrapping } from 'three';

/** Side of every generated map. 128 is where a mortar joint stops being a staircase. */
export const TEXTURE_SIZE = 128;

/**
 * What each family's surface is made of.
 *
 * `kind` picks the pattern; `scale` is how many times the map repeats across ONE grid cell (a cell is
 * about four metres, so `scale: 8` puts a brick course every half metre — roughly life size); `bump`
 * is how deep the relief reads; `rough` how much the pattern moves the roughness; `tint` how much it
 * moves the colour. Everything else about the material stays where it was (`MATERIAL_FAMILIES`).
 */
export const SURFACE_RECIPE = Object.freeze({
  thatch:   { kind: 'straw',   scale: 10, bump: 0.85, rough: 0.16, tint: 0.16 },
  wood:     { kind: 'wood',    scale: 7,  bump: 0.60, rough: 0.14, tint: 0.14 },
  dirt:     { kind: 'gravel',  scale: 14, bump: 0.45, rough: 0.10, tint: 0.10 },
  mudbrick: { kind: 'brick',   scale: 6,  bump: 0.70, rough: 0.12, tint: 0.13 },
  brick:    { kind: 'brick',   scale: 8,  bump: 0.90, rough: 0.14, tint: 0.16 },
  stone:    { kind: 'stone',   scale: 4,  bump: 0.75, rough: 0.13, tint: 0.14 },
  plaster:  { kind: 'plaster', scale: 9,  bump: 0.30, rough: 0.11, tint: 0.10 },
  tile:     { kind: 'tile',    scale: 9,  bump: 0.65, rough: 0.10, tint: 0.11 },
  glazed:   { kind: 'tile',    scale: 9,  bump: 0.45, rough: 0.06, tint: 0.07 },
  slate:    { kind: 'slate',   scale: 7,  bump: 0.70, rough: 0.09, tint: 0.10 },
  concrete: { kind: 'plaster', scale: 5,  bump: 0.34, rough: 0.12, tint: 0.09 },
  metal:    { kind: 'rust',    scale: 6,  bump: 0.40, rough: 0.22, tint: 0.17 },
  gold:     { kind: 'hammer',  scale: 12, bump: 0.28, rough: 0.10, tint: 0.06 },
  glass:    { kind: 'streak',  scale: 5,  bump: 0.14, rough: 0.09, tint: 0.04 },
  water:    { kind: 'ripple',  scale: 8,  bump: 0.22, rough: 0.05, tint: 0.03 },
  foliage:  { kind: 'leafy',   scale: 16, bump: 0.50, rough: 0.12, tint: 0.15 },
});

export const SURFACE_KINDS = Object.freeze(
  [...new Set(Object.values(SURFACE_RECIPE).map((r) => r.kind))].sort(),
);

/** Deterministic 0…1 from two integers. The same shape of hash the rest of the engine uses. */
function hash2(x, y, salt) {
  const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Smooth value noise on the tile's own torus, so the map tiles with no seam. */
function tileNoise(u, v, freq, salt) {
  const x = u * freq;
  const y = v * freq;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const wrap = (n) => ((n % freq) + freq) % freq;
  const a = hash2(wrap(ix), wrap(iy), salt);
  const b = hash2(wrap(ix + 1), wrap(iy), salt);
  const c = hash2(wrap(ix), wrap(iy + 1), salt);
  const d = hash2(wrap(ix + 1), wrap(iy + 1), salt);
  return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
}

/** Several octaves of it. Fractal detail is what separates a surface from a pattern. */
function fbm(u, v, freq, salt, octaves = 3) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let f = freq;
  for (let i = 0; i < octaves; i += 1) {
    sum += tileNoise(u, v, f, salt + i * 17) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

/**
 * HEIGHT FIELD PER KIND. Returns 0…1; 1 is the face of the material, 0 the bottom of a joint.
 *
 * ⚠️ THE NORMAL MAP IS **DERIVED** FROM THIS, NOT DRAWN SEPARATELY. Two hand-drawn maps drift apart
 * the moment anyone tunes one of them, and a normal that disagrees with its height is the surface
 * equivalent of a shadow falling the wrong way. One function, one truth, and the gradient does the
 * rest.
 */
function heightAt(kind, u, v) {
  switch (kind) {
    case 'brick': {
      // running bond: every other course offset by half a brick
      const rows = 8;
      const row = Math.floor(v * rows);
      const off = (row % 2) * 0.5;
      const bu = (u * 4 + off) % 1;
      const bv = (v * rows) % 1;
      const mortar = 0.055;
      const face = Math.min(
        Math.min(bu, 1 - bu) / mortar,
        Math.min(bv, 1 - bv) / (mortar * rows * 0.25),
      );
      // each brick a slightly different depth, and a few with a chipped corner
      const jitter = hash2(Math.floor(u * 4 + off), row, 3) * 0.14;
      const chip = hash2(row, Math.floor(u * 4), 9) > 0.88
        ? Math.max(0, 1 - Math.hypot(bu - 0.9, bv - 0.9) * 7) * 0.45 : 0;
      return Math.max(0, Math.min(1, face) * (0.86 + jitter) - chip)
        * (0.94 + fbm(u, v, 16, 5) * 0.12);
    }
    case 'stone': {
      // irregular blocks: a Voronoi-ish cell edge, plus grain inside each cell
      const cells = 4;
      let best = 1e9;
      let second = 1e9;
      let id = 0;
      for (let gy = -1; gy <= 1; gy += 1) {
        for (let gx = -1; gx <= 1; gx += 1) {
          const cx = Math.floor(u * cells) + gx;
          const cy = Math.floor(v * cells) + gy;
          const px = (cx + hash2(cx, cy, 11)) / cells;
          const py = (cy + hash2(cx, cy, 13)) / cells;
          const d = Math.hypot(u - px, v - py);
          if (d < best) { second = best; best = d; id = Math.abs(cx * 31 + cy * 17); }
          else if (d < second) second = d;
        }
      }
      const edge = Math.min(1, (second - best) * cells * 2.4);
      return Math.max(0, edge * (0.82 + (id % 7) * 0.026) * (0.9 + fbm(u, v, 12, 7) * 0.2));
    }
    case 'plaster':
      // trowel sweeps plus pinholes — flat overall, alive up close
      return 0.72 + fbm(u, v, 6, 21) * 0.24
        - (fbm(u, v, 28, 23) > 0.78 ? 0.18 : 0);
    case 'wood': {
      // grain running along v, with knots
      const grain = Math.sin((u + fbm(u, v, 4, 31) * 0.35) * Math.PI * 26) * 0.5 + 0.5;
      const knot = Math.max(0, 1 - Math.hypot(u - 0.32, v - 0.61) * 9) * 0.5
        + Math.max(0, 1 - Math.hypot(u - 0.78, v - 0.2) * 12) * 0.4;
      return Math.min(1, 0.66 + grain * 0.2 + fbm(u, v, 18, 33) * 0.12 - knot * 0.5);
    }
    case 'rust': {
      // pitted metal: broad rust blooms, rivet heads on a grid
      const bloom = fbm(u, v, 5, 41);
      const rivetU = (u * 4) % 1;
      const rivetV = (v * 4) % 1;
      const rivet = Math.max(0, 1 - Math.hypot(rivetU - 0.5, rivetV - 0.5) * 11) * 0.55;
      return Math.min(1, 0.74 + rivet - Math.max(0, bloom - 0.58) * 0.9 + fbm(u, v, 22, 43) * 0.1);
    }
    case 'tile': {
      // overlapping pantiles: one round ridge per column, a lip at the bottom of each course
      const cols = 6;
      const rows = 5;
      const tu = (u * cols) % 1;
      const tv = (v * rows) % 1;
      const ridge = Math.sin(tu * Math.PI) * 0.72;
      const lip = tv < 0.10 ? -0.28 : 0;
      const joint = Math.min(tu, 1 - tu) < 0.035 ? -0.25 : 0;
      return Math.max(0, Math.min(1, 0.42 + ridge + lip + joint + fbm(u, v, 14, 51) * 0.09));
    }
    case 'slate': {
      // split stone: long flat plates, chipped edges, a strong horizontal course line
      const rows = 6;
      const sv = (v * rows) % 1;
      const plate = sv < 0.08 ? -0.3 : 0;
      const split = fbm(u, v, 9, 61);
      return Math.max(0, Math.min(1, 0.78 + plate + (split - 0.5) * 0.3));
    }
    case 'gravel':
      // loose earth and stones: many small lumps, no structure
      return Math.min(1, 0.6 + fbm(u, v, 20, 71) * 0.5);
    case 'straw':
      // thatch: many fine near-vertical fibres with ragged ends
      return Math.min(1, 0.58
        + (Math.sin((u * 61 + fbm(u, v, 8, 81) * 3) * Math.PI) * 0.5 + 0.5) * 0.3
        + fbm(u, v, 26, 83) * 0.16);
    case 'hammer':
      // hammered leaf: shallow dimples in a rough grid
      return 0.82 + (Math.sin(u * Math.PI * 18) * Math.sin(v * Math.PI * 18)) * 0.13;
    case 'streak':
      // glass: a few long water streaks running down
      return 0.9 - Math.max(0, fbm(u * 0.12, v, 7, 91) - 0.55) * 0.6;
    case 'ripple':
      return 0.5 + (Math.sin(u * Math.PI * 12 + fbm(u, v, 5, 101) * 6) * 0.5 + 0.5) * 0.3;
    case 'leafy':
      // a canopy is many small overlapping blades, not one surface
      return Math.min(1, 0.55 + fbm(u, v, 22, 111) * 0.55);
    default:
      return 0.8;
  }
}

/**
 * Build the three maps for one family.
 *
 * @returns `{ detail, normal }` — `detail` packs tint in RGB and roughness in A; `normal` is a
 *   standard tangent-space normal map. Two textures rather than three: a sampler costs a lookup and
 *   the roughness has nowhere better to live than the alpha channel it was already paying for.
 */
export function buildFamilyTexture(family, size = TEXTURE_SIZE) {
  const recipe = SURFACE_RECIPE[family];
  if (!recipe) return null;
  const n = Math.max(8, size | 0);
  const detail = new Uint8Array(n * n * 4);
  const normal = new Uint8Array(n * n * 4);
  const h = new Float32Array(n * n);

  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      h[y * n + x] = heightAt(recipe.kind, x / n, y / n);
    }
  }

  const at = (x, y) => h[(((y % n) + n) % n) * n + (((x % n) + n) % n)];
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      const i = (y * n + x) * 4;
      const height = h[y * n + x];

      // ── tint + roughness ──────────────────────────────────────────────────
      // A joint is darker than a face (it is in shadow and it is a different material), and it is
      // rougher. Both follow from the SAME height, which is why they never disagree.
      const shade = 1 + (height - 0.8) * recipe.tint * 2.4;
      const v = Math.max(0, Math.min(255, Math.round(shade * 255)));
      detail[i] = v;
      detail[i + 1] = v;
      detail[i + 2] = v;
      detail[i + 3] = Math.max(0, Math.min(255, Math.round((1 - height) * recipe.rough * 255 + 128)));

      // ── normal, from the gradient of the height ───────────────────────────
      const dx = (at(x + 1, y) - at(x - 1, y)) * recipe.bump * n * 0.045;
      const dy = (at(x, y + 1) - at(x, y - 1)) * recipe.bump * n * 0.045;
      const len = Math.hypot(-dx, -dy, 1);
      normal[i] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      normal[i + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      normal[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      normal[i + 3] = 255;
    }
  }

  const make = (data) => {
    const t = new DataTexture(data, n, n, RGBAFormat);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.magFilter = LinearFilter;
    t.minFilter = LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.needsUpdate = true;
    return t;
  };
  return { detail: make(detail), normal: make(normal), scale: recipe.scale, bump: recipe.bump };
}

/**
 * Build every family's maps once and hand back a lookup.
 *
 * ⚠️ ONE SET PER SCENE, NOT PER MATERIAL. Sixteen families, two 128² maps each — 2 MB of texture
 * memory for the whole city, generated in a few milliseconds of pure arithmetic. Building them per
 * material would multiply that by the number of meshes for no visual difference whatsoever.
 */
export function buildSurfaceTextures(size = TEXTURE_SIZE) {
  const out = new Map();
  for (const family of Object.keys(SURFACE_RECIPE)) {
    const built = buildFamilyTexture(family, size);
    if (built) out.set(family, built);
  }
  return {
    get: (family) => out.get(family) ?? null,
    size: out.size,
    dispose() {
      for (const t of out.values()) { t.detail.dispose(); t.normal.dispose(); }
      out.clear();
    },
  };
}
