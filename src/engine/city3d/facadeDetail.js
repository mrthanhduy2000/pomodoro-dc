/**
 * facadeDetail.js — Round 50 (ADR-090): THE FRONT OF A BUILDING IS NOT A BLANK WALL.
 *
 * Việc 6 of Đàm's round-50 brief: door frames and thresholds, window sills and shutters, string
 * courses between storeys, signboards, hanging lamps, downpipes, balconies with a plant on them,
 * wall niches. Each era draws from its own vocabulary — the bracket sets of Chang'an, the timber
 * frame of the Eifel, the mansard ironwork of Paris, the red brick arches of Manchester, the vertical
 * signs of Tokyo, the glass fins of Marina Bay.
 *
 * Three rules make this safe to add to seventy-five buildings and hundreds of dwellings:
 *   1. **Nothing protrudes further than the cornice already does.** Reliefs are ≤ `MAX_RELIEF`; the
 *      eaves and the cornice remain the widest thing on the building, so `specSpan` does not grow and
 *      `block.js` does not scale a single dwelling down (that is how round 50's first interior draft
 *      made era 12 shorter — see `groundFloor.js`).
 *   2. **Only roles every era already draws** (`wall · wall2 · roof · trim · dark · stone · wood`,
 *      plus the round-49 cloth roles, which ride `wood`), so no era gains a material family.
 *   3. **Deterministic**: everything is a function of `(bpId, index, storey)` through `unit`.
 */
import { prism } from './parts';
import { unit } from '../hashId';

/** Nothing here may stick out further than this (the cornice sticks out more, and it sets the span). */
export const MAX_RELIEF = 0.025;

/** The vocabulary of each era — which of the items below its buildings carry. */
/**
 * ⚠️ ROUND 51 (ADR-091) ADDS THE BOTTOM TWO METRES, AND THAT IS WHERE THE VOCABULARY WAS THINNEST.
 * Round 50 wrote this table looking at a building from across the square, so every item on it lives
 * at storey height or above: string courses, brackets, balconies, fire escapes. At eye level none of
 * those is in the frame. The three new items are the ones a person actually passes within arm's
 * reach — a NUMBER beside the door, a WINDOW BOX under the sill, and the STALL BOARD of a shop that
 * opens onto the street. `numberPlate` goes to every era that had street numbering (Paris 1512 is the
 * first, but it only becomes universal in the 18th century — so era 9 onward, plus the eras whose
 * `note` already says "shop"); `windowBox` to the ones whose climate and habit had them.
 */
export const FACADE_VOCAB = Object.freeze({
  1:  ['bandStone', 'niche'],
  2:  ['bandStone', 'niche', 'awning'],
  3:  ['bandStone', 'niche', 'pilaster'],
  4:  ['bracket', 'bandWood', 'lantern', 'sign', 'stallBoard'],
  5:  ['timberFrame', 'shutter', 'bandWood', 'lamp', 'windowBox'],
  6:  ['bracket', 'shutter', 'awning', 'lantern', 'stallBoard'],
  7:  ['pilaster', 'bandStone', 'shutter', 'sign', 'windowBox'],
  8:  ['tile', 'bandStone', 'balcony', 'lamp', 'windowBox'],
  9:  ['balcony', 'bandStone', 'shutter', 'lamp', 'sign', 'numberPlate'],
  10: ['brickArch', 'downpipe', 'bandStone', 'sign', 'numberPlate'],
  11: ['pilaster', 'bandStone', 'fireEscape', 'sign', 'numberPlate'],
  12: ['bandStone', 'shutter', 'downpipe', 'numberPlate'],
  13: ['signTall', 'ac', 'bandStone', 'lantern', 'stallBoard'],
  14: ['fin', 'bandStone', 'balcony', 'numberPlate'],
  15: ['fin', 'bandStone', 'awning', 'numberPlate'],
});

export const FACADE_ITEMS = Object.freeze([...new Set(Object.values(FACADE_VOCAB).flat())]);

export function facadeVocabFor(era) {
  return FACADE_VOCAB[Number(era)] ?? FACADE_VOCAB[1];
}

/**
 * Emit facade detail on the +z face of a body.
 *
 * @param out  parts array
 * @param p    `{ bpId, index, era, x, z, y, w, d, height, ry, storeys, plain }` — the body's own frame
 * @returns how many parts were added
 */
export function emitFacadeDetail(out, p) {
  const {
    bpId = 'bp', index = 0, era = 1, x = 0, z = 0, y = 0, w = 1, d = 1, height = 1, ry = 0,
    storeys = 1, plain = false, symmetric = false,
  } = p ?? {};
  if (!(w > 0) || !(height > 0)) return 0;
  const before = out.length;
  const seed = (k) => unit(`${bpId}|fd${index}|${k}`);
  const face = z + d / 2;
  const vocab = facadeVocabFor(era);
  const R = MAX_RELIEF;
  /**
   * ⚠️ EVERY ITEM IS FLUSH WITH THE WALL — its outer surface lands exactly on the facade plane, so the
   * building's FOOTPRINT does not grow by a millimetre. The first draft let a lamp bracket stick out
   * 0,022, which was enough to tip era 5's landmark into the next cell of `buildingSpanCells` and give
   * it a retaining plinth it never had (`triangleBudget.test.js` «SỐ BỆ KÈ GIỮ NGUYÊN» — a test about
   * TERRAIN caught a change in a wall ornament). Flush still reads: every part carries its own colour
   * and its own contact shading, which is what separates a string course from the wall it sits on.
   */
  const put = (o) => {
    const depth = o.d ?? R;
    return out.push(prism({ ry, ...o, z: (o.z ?? face) - depth / 2 }));
  };

  // ── string courses: the ONE line that says "this wall has storeys" ────────
  if (storeys > 1 && (vocab.includes('bandStone') || vocab.includes('bandWood'))) {
    const role = vocab.includes('bandWood') ? 'wood' : 'trim';
    for (let s = 1; s < storeys; s += 1) {
      // ⚠️ NEVER WIDER THAN THE WALL. A band at `w × 1.005` widened the footprint by half a percent,
      // which was enough to tip `buildingSpanCells` into the next cell and change the PLINTH count of
      // two eras (`triangleBudget.test.js` «SỐ BỆ KÈ GIỮ NGUYÊN»). The band is flush, and it reads.
      put({ x, z: face, y: y + (height / storeys) * s, w: w * 0.995, d: R * 1.4, h: Math.max(0.012, height * 0.012), role });
    }
  }

  // ⚠️ A LANDMARK KEEPS ITS MIRROR. Every era's wonder stands at the centre of the city and
  // `symmetry.test.js` demands left–right symmetry; a sign hung on one side, a balcony on the third
  // floor or a downpipe down one corner is asymmetric by nature. The symmetric half of the vocabulary
  // (bands · pilasters · brackets · shutters · fins · arches · niches · awnings) still applies.
  // round 51: a number plate hangs beside ONE door and a stall board belongs to ONE shop — both are
  // asymmetric by nature, so a landmark keeps neither. A window box is symmetric and stays.
  const ONE_SIDED = new Set(['sign', 'signTall', 'lantern', 'lamp', 'balcony', 'fireEscape', 'downpipe', 'tile', 'timberFrame', 'numberPlate', 'stallBoard']);
  for (const item of vocab) {
    if (symmetric && ONE_SIDED.has(item)) continue;
    switch (item) {
      case 'pilaster':
        for (const sx of [-1, 1]) {
          put({ x: x + sx * w * 0.42, z: face, y, w: w * 0.07, d: R, h: height * 0.94, role: 'trim' });
          put({ x: x + sx * w * 0.42, z: face, y: y + height * 0.94, w: w * 0.1, d: R * 1.3, h: height * 0.04, role: 'trim' });
        }
        break;
      case 'timberFrame': {
        // Fachwerk: two posts, a rail, and a brace — the shape of the country, not a texture
        for (const sx of [-1, 0, 1]) put({ x: x + sx * w * 0.34, z: face, y, w: w * 0.055, d: R, h: height * 0.96, role: 'wood' });
        put({ x, z: face, y: y + height * 0.48, w: w * 0.94, d: R, h: height * 0.045, role: 'wood' });
        // ⚠️ NO DIAGONAL BRACE. A part with `rz` has a WIDER axis-aligned box than its own width — a
        // 0,5-high brace leaned 0,42 rad pushed era 5's blocks 0,25 cell past their land (`block.test.js`
        // «KHÔNG CHIẾM THÊM ĐẤT»), and `block.js` then scales the whole unit down to fit. Two short
        // rails read as Fachwerk just as well and stay inside the wall.
        put({ x: x - w * 0.17, z: face, y: y + height * 0.7, w: w * 0.3, d: R, h: height * 0.035, role: 'wood' });
        put({ x: x + w * 0.17, z: face, y: y + height * 0.24, w: w * 0.3, d: R, h: height * 0.035, role: 'wood' });
        break;
      }
      case 'bracket':
        // đấu củng: a stepped bracket set under the eaves
        for (const sx of [-1, 0, 1]) {
          put({ x: x + sx * w * 0.3, z: face, y: y + height * 0.88, w: w * 0.13, d: R * 1.6, h: height * 0.035, role: 'wood' });
          put({ x: x + sx * w * 0.3, z: face, y: y + height * 0.93, w: w * 0.2, d: R * 1.2, h: height * 0.03, role: 'wood' });
        }
        break;
      case 'brickArch':
        for (let i = 0; i < 3; i += 1) {
          put({ x: x + (i - 1) * w * 0.3, z: face, y: y + height * 0.34, w: w * 0.2, d: R, h: height * 0.03, sides: 6, role: 'trim' });
        }
        break;
      case 'shutter':
        for (let s = 0; s < Math.min(3, storeys); s += 1) {
          const yy = y + (s + 0.42) * (height / storeys);
          for (const sx of [-1, 1]) put({ x: x + sx * w * 0.2, z: face, y: yy, w: w * 0.07, d: R, h: height / storeys * 0.34, role: 'wood' });
        }
        break;
      case 'balcony': {
        const s = Math.min(storeys - 1, 1 + Math.floor(seed('bal') * Math.max(1, storeys - 1)));
        const yy = y + (height / storeys) * s;
        put({ x, z: face, y: yy, w: w * 0.62, d: R * 1.8, h: Math.max(0.012, height * 0.014), role: 'trim' });      // the slab
        for (let i = 0; i < 4; i += 1) put({ x: x + (i - 1.5) * w * 0.17, z: face, y: yy, w: w * 0.02, d: R, h: height * 0.07, role: 'dark' });
        put({ x, z: face, y: yy + height * 0.07, w: w * 0.62, d: R, h: Math.max(0.01, height * 0.01), role: 'dark' });  // the rail
        if (!plain) put({ x: x + w * 0.2, z: face, y: yy + height * 0.012, w: w * 0.08, d: R, h: height * 0.05, role: 'leaf' });  // a plant on it
        break;
      }
      case 'fireEscape': {
        const yy = y + height * 0.45;
        put({ x: x + w * 0.28, z: face, y: yy, w: w * 0.3, d: R * 1.6, h: Math.max(0.01, height * 0.012), role: 'dark' });
        put({ x: x + w * 0.28, z: face, y: yy, w: w * 0.02, d: R, h: height * 0.3, role: 'dark' });
        put({ x: x + w * 0.42, z: face, y: yy, w: w * 0.02, d: R, h: height * 0.3, role: 'dark' });
        break;
      }
      case 'downpipe': {
        const sx = seed('pipe') > 0.5 ? 1 : -1;
        put({ x: x + sx * w * 0.46, z: face, y, w: w * 0.035, d: R, h: height * 0.98, sides: 6, role: 'dark' });
        break;
      }
      case 'sign':
        put({ x: x + w * (seed('sign') - 0.5) * 0.4, z: face, y: y + height * 0.3, w: w * 0.34, d: R * 1.4, h: height * 0.09, role: 'wood' });
        break;
      case 'signTall':
        put({ x: x + w * 0.4, z: face, y: y + height * 0.28, w: w * 0.11, d: R * 1.6, h: height * 0.46, role: 'glass' });
        break;
      case 'lantern':
        put({ x: x + w * 0.3, z: face, y: y + height * 0.26, w: w * 0.03, d: R * 1.8, h: height * 0.02, role: 'wood' });
        put({ x: x + w * 0.3, y: y + height * 0.2, w: w * 0.09, d: w * 0.09, h: height * 0.06, sides: 6, role: 'flag' });
        break;
      case 'lamp':
        put({ x: x + w * 0.32, z: face, y: y + height * 0.34, w: w * 0.05, d: R * 1.8, h: height * 0.015, role: 'dark' });
        put({ x: x + w * 0.32, y: y + height * 0.3, w: w * 0.07, d: w * 0.07, h: height * 0.04, sides: 6, taper: 0.4, role: 'glass' });
        break;
      case 'awning':
        put({ x, z: face, y: y + height * 0.24, w: w * 0.7, d: R * 1.9, h: height * 0.03, role: 'canvas' });   // flush: `rz` would widen the box
        break;
      case 'tile':
        // azulejo: a panel of glazed tile, flush with the wall
        put({ x: x + w * (seed('az') - 0.5) * 0.3, z: face, y: y + height * 0.4, w: w * 0.42, d: R * 0.6, h: height * 0.22, role: 'wall2' });
        break;
      case 'niche':
        put({ x, z: face - R, y: y + height * 0.42, w: w * 0.16, d: R, h: height * 0.22, sides: 6, role: 'dark' });
        break;
      case 'ac':
        for (let i = 0; i < 2; i += 1) {
          put({ x: x + (i - 0.5) * w * 0.44, z: face, y: y + height * (0.36 + i * 0.24), w: w * 0.12, d: R * 1.7, h: height * 0.06, role: 'trim' });
        }
        break;
      case 'fin':
        for (let i = 0; i < 4; i += 1) {
          put({ x: x + (i - 1.5) * w * 0.26, z: face, y, w: w * 0.03, d: R * 1.5, h: height * 0.96, role: 'trim' });
        }
        break;
      /**
       * ── ROUND 51 (ADR-091): THE BOTTOM TWO METRES ────────────────────────
       * ⚠️ THESE THREE ARE PINNED TO THE GROUND, NOT TO A FRACTION OF THE HEIGHT. Every item above
       * places itself at `height × something`, which is right for a string course — it belongs to
       * the STOREY. A house number belongs to a PERSON: it sits where a person can read it, and it
       * sits there whether the building is two storeys or twelve. Writing `height * 0.16` would put
       * era 11's numbers on the fourth floor. So they measure from `y` in absolute units, clamped
       * so they never climb past the ground floor of even the shortest shed.
       */
      case 'numberPlate': {
        const storey = height / Math.max(1, storeys);
        const eye = y + Math.min(storey * 0.62, 0.20);
        const sx = seed('num') > 0.5 ? 1 : -1;
        put({ x: x + sx * w * 0.3, z: face, y: eye, w: Math.min(w * 0.12, 0.06), d: R, h: 0.045, role: 'trim' });
        put({ x: x + sx * w * 0.3, z: face, y: eye + 0.008, w: Math.min(w * 0.08, 0.04), d: R * 0.5, h: 0.028, role: 'dark' });
        break;
      }
      case 'windowBox': {
        // under the sill of the ground-floor window: a box, and the thing growing out of it
        const storey = height / Math.max(1, storeys);
        const sill = y + Math.min(storey * 0.44, 0.16);
        for (const sx of [-1, 1]) {
          put({ x: x + sx * w * 0.24, z: face, y: sill, w: Math.min(w * 0.2, 0.13), d: R * 1.8, h: 0.032, role: 'wood' });
          if (!plain) {
            put({ x: x + sx * w * 0.24, z: face, y: sill + 0.030, w: Math.min(w * 0.17, 0.11), d: R * 1.6, h: 0.030, sides: 5, role: 'leaf' });
          }
        }
        break;
      }
      case 'stallBoard': {
        // the shop board: a shelf across the opening at counter height, with goods stacked on it —
        // this is what "the ground floor opens onto the street" LOOKS like from three metres away
        const storey = height / Math.max(1, storeys);
        const top = y + Math.min(storey * 0.34, 0.13);
        put({ x, z: face, y: top, w: w * 0.56, d: R * 1.9, h: 0.022, role: 'wood' });
        if (!plain) {
          for (let i = 0; i < 3; i += 1) {
            put({
              x: x + (i - 1) * w * 0.17, z: face, y: top + 0.022,
              w: Math.min(w * 0.12, 0.075), d: R * 1.5, h: 0.030 + seed(`gd${i}`) * 0.026,
              sides: i === 1 ? 6 : 4, role: i === 1 ? 'canvas' : 'trim',
            });
          }
        }
        break;
      }
      default:
        break;
    }
  }
  return out.length - before;
}
