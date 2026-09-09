/**
 * streetFurnitureSpec.js — Round 51 (ADR-091): the SHAPE of what stands beside the road.
 *
 * `streetFurniture.js` decides which century has which piece and where it stands; this file says
 * what each piece looks like. Same split as `flora.js`/`floraStyle.js` and `groundCover.js` — the
 * placement question and the geometry question move at different speeds and for different reasons.
 *
 * THUẦN: no three, no DOM, no `Date`, no `Math.random`.
 *
 * ⚠️ EVERY ROLE HERE RIDES A MATERIAL FAMILY THE ERA ALREADY DRAWS, and that constraint decided
 * several of the shapes. Measured 2026-09-09 across all 15 eras: `wood` (and everything mapped onto
 * it), `stone`, `trim`, `dark`, `roof` and `leaf` are drawn by every century; `glass` is missing
 * from eras 1–2 and `gold` from eras 12–13. So a gas lamp may have a glass pane (era 9 has glass)
 * and a torch post a bronze collar (era 3 has gold), but a Tokyo utility pole may not carry a gilt
 * anything. A new family is a new draw call in that era, and this project keeps a fifteen-row table
 * of those precisely so no one adds one by accident (`drawCallBudget.test.js`).
 *
 * ⚠️ SCALE. A prop is placed at 1 unit = 1 grid cell, and a grid cell is about four metres wide, so
 * a person is roughly 0,42 tall in these numbers (`HUMAN_BASE_HEIGHT`). A lamp post is therefore
 * ~0,7–0,9, a bollard ~0,2, a kerb step ~0,05. Getting this wrong is the most visible mistake
 * available at eye level: a bin the size of a house reads instantly, whereas a slightly wrong colour
 * does not.
 */
import { unit, signed } from '../hashId';
import { prism } from './parts';

/** A short post: a hitching post, a boundary stake. The oldest piece of street furniture there is. */
function post(seed, era) {
  const eraNum = Number.isFinite(era) ? era : 1;
  const parts = [];
  const h = 0.26 + unit(`${seed}|h`) * 0.10;
  parts.push(prism({ y: 0, w: 0.045, h, sides: eraNum <= 3 ? 5 : 6, taper: 0.86, role: 'wood', rz: signed(`${seed}|lean`) * 0.05 }));
  // the cap, and the rope ring that says what it is FOR — without it a post is a stick
  parts.push(prism({ y: h, w: 0.06, h: 0.025, sides: 6, taper: 0.7, role: 'wood' }));
  parts.push(prism({ y: h - 0.05, w: 0.07, d: 0.02, h: 0.02, sides: 4, role: 'hook' }));
  return parts;
}

/** A rough stone set upright to mark a way — before roads had names they had stones. */
function marker(seed) {
  const h = 0.16 + unit(`${seed}|h`) * 0.10;
  return [
    prism({ y: 0, w: 0.10, d: 0.07, h, sides: 5, taper: 0.78, role: 'stone', rz: signed(`${seed}|l`) * 0.09 }),
  ];
}

/** Grass and weeds pushing up between the stones — the mark of a street nobody sweeps. */
function weeds(seed, era, detail) {
  const parts = [];
  const n = detail === 'low' ? 2 : 3 + Math.floor(unit(`${seed}|n`) * 3);
  for (let i = 0; i < n; i += 1) {
    parts.push(prism({
      x: signed(`${seed}|x${i}`) * 0.09,
      z: signed(`${seed}|z${i}`) * 0.09,
      y: 0,
      w: 0.035 + unit(`${seed}|w${i}`) * 0.03,
      h: 0.05 + unit(`${seed}|h${i}`) * 0.06,
      sides: 4, taper: 0.25,
      rz: signed(`${seed}|r${i}`) * 0.22,
      role: i % 2 === 0 ? 'leaf' : 'leaf2',
    }));
  }
  return parts;
}

/** A stone bollard: Rome's answer to the cart that cuts the corner, still standing in Italy today. */
function bollard(seed, era) {
  const eraNum = Number.isFinite(era) ? era : 7;
  const h = 0.17 + unit(`${seed}|h`) * 0.05;
  const modern = eraNum >= 13;
  return [
    prism({ y: 0, w: modern ? 0.07 : 0.115, h, sides: modern ? 8 : 6, taper: modern ? 1 : 0.82, role: modern ? 'iron' : 'stone' }),
    prism({ y: h, w: modern ? 0.075 : 0.10, h: 0.03, sides: modern ? 8 : 6, taper: 0.5, role: modern ? 'iron' : 'stone' }),
  ];
}

/** A post carrying an open flame — the street light of every century before glass and oil. */
function torchpost(seed, era) {
  const eraNum = Number.isFinite(era) ? era : 5;
  const h = 0.42 + unit(`${seed}|h`) * 0.10;
  const parts = [
    prism({ y: 0, w: 0.12, h: 0.05, sides: 6, taper: 0.8, role: 'stone' }),
    prism({ y: 0.05, w: 0.05, h, sides: 6, taper: 0.9, role: 'wood' }),
    // the bronze collar, then the bowl, then the fire itself (`tag: 'fire'` — the motion layer
    // gives it a flicker and a light, exactly as the era's braziers get)
    prism({ y: h + 0.05, w: 0.09, h: 0.03, sides: 6, taper: 0.85, role: eraNum >= 12 ? 'iron' : 'gold' }),
    prism({ y: h + 0.08, w: 0.10, h: 0.05, sides: 6, taper: 0.7, role: 'dark' }),
    prism({ y: h + 0.12, w: 0.07, h: 0.11, sides: 5, taper: 0, role: 'flame', tag: 'fire' }),
  ];
  return parts;
}

/** A lantern on a pole — paper in China and Vietnam, horn or glass elsewhere. */
function lamppost(seed, era) {
  const eraNum = Number.isFinite(era) ? era : 4;
  const h = 0.46 + unit(`${seed}|h`) * 0.10;
  const parts = [
    prism({ y: 0, w: 0.06, h: 0.04, sides: 6, taper: 0.8, role: 'stone' }),
    prism({ y: 0.04, w: 0.04, h, sides: 6, taper: 0.92, role: 'wood' }),
    prism({ y: h + 0.04, w: 0.10, d: 0.03, h: 0.02, sides: 4, role: 'wood' }),
  ];
  // the lantern hangs off the arm; `glass` glows with the windows at night
  const round = eraNum === 4 || eraNum === 6 || eraNum === 13;
  parts.push(prism({ x: 0.045, y: h - 0.10, w: 0.085, h: 0.13, sides: round ? 8 : 4, taper: 0.85, role: 'glass' }));
  parts.push(prism({ x: 0.045, y: h + 0.02, w: 0.10, h: 0.02, sides: round ? 8 : 4, taper: 0.6, role: 'roof' }));
  return parts;
}

/** A Roman milestone: a drum on a base, with the distance cut into it. */
function milestone(seed) {
  const h = 0.24 + unit(`${seed}|h`) * 0.06;
  return [
    prism({ y: 0, w: 0.14, h: 0.04, sides: 4, taper: 0.9, role: 'stone' }),
    prism({ y: 0.04, w: 0.10, h, sides: 8, taper: 0.94, role: 'stone' }),
    prism({ y: h + 0.04, w: 0.11, h: 0.02, sides: 8, taper: 0.6, role: 'stone' }),
    // the cut face, a shade darker: the only thing that says "there is writing on this"
    prism({ z: -0.045, y: 0.10, w: 0.06, d: 0.012, h: 0.10, sides: 4, role: 'dark' }),
  ];
}

/**
 * An open gutter running beside the carriageway — the drain, before there were drains.
 *
 * ⚠️ IT IS A GROOVE, AND A GROOVE IS READ BY ITS EDGES. The first version stacked a dark slab ON
 * TOP of a light one, which put the dark part HIGHER than the stone — a channel drawn upside down.
 * On the rendered frame it came out as pale slabs dropped on the verge, and the reason was visible
 * the moment the numbers were read back: 0,008 + 0,010 sits above 0,004 + 0,012. What reads as a
 * channel is a dark strip at ground level with a raised stone edge each side of it.
 *
 * Long in `d` (which the placement rotates to run ALONG the street) and thin in `w`.
 */
function gutter(_seed, _era, detail) {
  const parts = [];
  const len = detail === 'low' ? 0.6 : 0.92;
  parts.push(prism({ y: 0.001, w: 0.055, d: len, h: 0.008, sides: 4, role: 'dark' }));
  for (const side of [-1, 1]) {
    parts.push(prism({ x: side * 0.052, y: 0.001, w: 0.05, d: len, h: 0.022, sides: 4, role: 'stone' }));
  }
  return parts;
}

/** A water trough or a water jar at the mouth of an alley — where an animal drinks. */
function trough(seed, era) {
  const eraNum = Number.isFinite(era) ? era : 5;
  if (eraNum === 6) {
    // a glazed water jar, the thing that actually stands at a Hanoi alley mouth
    return [
      prism({ y: 0, w: 0.15, h: 0.20, sides: 8, taper: 0.72, role: 'trim' }),
      prism({ y: 0.20, w: 0.12, h: 0.03, sides: 8, taper: 1, role: 'dark' }),
    ];
  }
  return [
    prism({ y: 0, w: 0.30, d: 0.13, h: 0.11, sides: 4, taper: 0.94, role: 'stone' }),
    prism({ y: 0.09, w: 0.26, d: 0.09, h: 0.03, sides: 4, role: 'water' }),
  ];
}

/** One or two steps up from the carriageway to a raised pavement. */
function step(seed) {
  const w = 0.34 + unit(`${seed}|w`) * 0.16;
  return [
    prism({ y: 0, w, d: 0.14, h: 0.035, sides: 4, role: 'stone' }),
    prism({ z: -0.05, y: 0.035, w: w * 0.9, d: 0.09, h: 0.035, sides: 4, role: 'stone' }),
  ];
}

/** A public bin: staves and a hoop before 1900, a metal drum after. */
function bin(seed, era) {
  const eraNum = Number.isFinite(era) ? era : 9;
  const metal = eraNum >= 11;
  return [
    prism({ y: 0, w: 0.14, h: 0.20, sides: metal ? 8 : 6, taper: metal ? 0.94 : 0.86, role: metal ? 'iron' : 'wood' }),
    prism({ y: 0.19, w: 0.15, h: 0.02, sides: metal ? 8 : 6, taper: 0.9, role: metal ? 'iron' : 'hook' }),
    prism({ y: 0.21, w: 0.13, h: 0.012, sides: metal ? 8 : 6, taper: 0.8, role: 'dark' }),
  ];
}

/** A cast-iron gas lamp: fluted column, ladder bar, four-pane lantern, a little crown. */
function gaslamp(seed, era, detail) {
  const h = 0.62 + unit(`${seed}|h`) * 0.10;
  const parts = [
    prism({ y: 0, w: 0.10, h: 0.05, sides: 8, taper: 0.72, role: 'stone' }),
    prism({ y: 0.05, w: 0.055, h: 0.08, sides: 8, taper: 0.82, role: 'iron' }),
    prism({ y: 0.13, w: 0.038, h, sides: 8, taper: 0.9, role: 'iron' }),
  ];
  if (detail !== 'low') {
    // the lamplighter's ladder bar — the detail that dates the lamp to gas rather than electricity
    parts.push(prism({ y: h - 0.02, w: 0.13, d: 0.02, h: 0.015, sides: 4, role: 'iron' }));
  }
  parts.push(prism({ y: h + 0.13, w: 0.075, h: 0.03, sides: 4, taper: 1, role: 'iron' }));
  parts.push(prism({ y: h + 0.16, w: 0.085, h: 0.11, sides: 4, taper: 0.86, role: 'glass' }));
  parts.push(prism({ y: h + 0.27, w: 0.09, h: 0.035, sides: 4, taper: 0.3, role: 'roof' }));
  parts.push(prism({ y: h + 0.305, w: 0.02, h: 0.035, sides: 4, taper: 0.4, role: 'iron' }));
  return parts;
}

/** A signpost: a street-name plate, or a hanging sign board. */
function signpost(seed, era) {
  const eraNum = Number.isFinite(era) ? era : 9;
  const h = 0.44 + unit(`${seed}|h`) * 0.10;
  const parts = [
    prism({ y: 0, w: 0.035, h, sides: 6, taper: 0.9, role: 'iron' }),
  ];
  if (eraNum === 13) {
    // Tokyo: the sign runs DOWN the pole, not across it — the single most recognisable thing about
    // a Japanese shopping street, and it is a proportion, not a colour
    parts.push(prism({ x: 0.03, y: h * 0.35, w: 0.05, d: 0.012, h: h * 0.6, sides: 4, role: 'trim' }));
    parts.push(prism({ x: 0.032, y: h * 0.35, w: 0.038, d: 0.014, h: h * 0.56, sides: 4, role: 'dark' }));
  } else {
    parts.push(prism({ y: h, w: 0.20, d: 0.015, h: 0.06, sides: 4, role: 'trim' }));
    parts.push(prism({ z: 0.010, y: h + 0.005, w: 0.17, d: 0.012, h: 0.045, sides: 4, role: 'dark' }));
  }
  return parts;
}

/** A cast-iron manhole cover, sunk almost flush — but not quite, and that is the point. */
function manhole() {
  return [
    prism({ y: 0.002, w: 0.17, h: 0.010, sides: 10, taper: 0.94, role: 'iron' }),
    prism({ y: 0.010, w: 0.13, h: 0.006, sides: 10, taper: 0.9, role: 'dark' }),
  ];
}

/** A fire hydrant: 1801 Philadelphia, and unmistakable ever since. */
function hydrant() {
  return [
    prism({ y: 0, w: 0.10, h: 0.025, sides: 8, taper: 0.82, role: 'iron' }),
    prism({ y: 0.025, w: 0.075, h: 0.16, sides: 8, taper: 0.9, role: 'iron' }),
    prism({ y: 0.185, w: 0.09, h: 0.022, sides: 8, taper: 0.7, role: 'iron' }),
    prism({ y: 0.207, w: 0.05, h: 0.035, sides: 8, taper: 0.5, role: 'iron' }),
    // the two side outlets: the silhouette nobody mistakes for anything else
    prism({ x: 0.05, y: 0.11, w: 0.05, d: 0.035, h: 0.035, sides: 6, ry: Math.PI / 2, role: 'dark' }),
    prism({ x: -0.05, y: 0.11, w: 0.05, d: 0.035, h: 0.035, sides: 6, ry: Math.PI / 2, role: 'dark' }),
  ];
}

/** Tram or wagon rails set into the road, with sleepers showing through the wear. */
function rail(_seed, _era, detail) {
  const parts = [];
  const n = detail === 'low' ? 3 : 5;
  for (const side of [-1, 1]) {
    parts.push(prism({ x: side * 0.085, y: 0.006, w: 0.026, d: 0.62, h: 0.016, sides: 4, role: 'iron' }));
  }
  if (detail !== 'low') {
    for (let i = 0; i < n; i += 1) {
      const t = (i - (n - 1) / 2) * (0.60 / n);
      parts.push(prism({ z: t, y: 0.002, w: 0.24, d: 0.05, h: 0.008, sides: 4, role: 'wood' }));
    }
  }
  return parts;
}

/** An electric street light: a plain column with a bracket arm and a lamp head. */
function streetlight(seed, era) {
  const eraNum = Number.isFinite(era) ? era : 11;
  const h = (eraNum === 15 ? 0.98 : 0.78) + unit(`${seed}|h`) * 0.12;
  const parts = [
    prism({ y: 0, w: 0.085, h: 0.035, sides: 8, taper: 0.8, role: 'stone' }),
    prism({ y: 0.035, w: 0.05, h, sides: 8, taper: 0.88, role: 'iron' }),
  ];
  if (eraNum === 12) {
    // the Soviet swan-neck: a stepped curve rather than a straight arm
    parts.push(prism({ x: 0.03, y: h + 0.02, w: 0.032, d: 0.032, h: 0.09, sides: 6, taper: 1, rz: -0.5, role: 'iron' }));
    parts.push(prism({ x: 0.10, y: h + 0.09, w: 0.11, d: 0.028, h: 0.026, sides: 4, role: 'iron' }));
    parts.push(prism({ x: 0.15, y: h + 0.07, w: 0.10, d: 0.07, h: 0.05, sides: 6, taper: 0.5, role: 'glass' }));
  } else if (eraNum === 14) {
    // Marina Bay: a twin head, one lamp each side of the column
    for (const side of [-1, 1]) {
      parts.push(prism({ x: side * 0.07, y: h + 0.03, w: 0.14, d: 0.026, h: 0.022, sides: 4, role: 'iron' }));
      parts.push(prism({ x: side * 0.13, y: h + 0.005, w: 0.075, d: 0.055, h: 0.035, sides: 6, taper: 0.6, role: 'glass' }));
    }
  } else {
    parts.push(prism({ x: 0.075, y: h + 0.03, w: 0.16, d: 0.028, h: 0.024, sides: 4, role: 'iron' }));
    parts.push(prism({ x: 0.145, y: h + 0.005, w: 0.085, d: 0.06, h: 0.04, sides: 6, taper: 0.55, role: 'glass' }));
  }
  return parts;
}

/** A public bench facing the road. */
function streetbench() {
  const legRole = 'iron';
  return [
    prism({ x: -0.13, y: 0, w: 0.03, d: 0.11, h: 0.10, sides: 4, role: legRole }),
    prism({ x: 0.13, y: 0, w: 0.03, d: 0.11, h: 0.10, sides: 4, role: legRole }),
    prism({ y: 0.10, w: 0.34, d: 0.13, h: 0.025, sides: 4, role: 'wood' }),
    prism({ z: -0.055, y: 0.125, w: 0.34, d: 0.022, h: 0.11, sides: 4, role: 'wood' }),
  ];
}

/** A wooden utility pole with its crossarms — the thing that makes a Tokyo street a Tokyo street. */
function utilitypole(seed, era, detail) {
  const eraNum = Number.isFinite(era) ? era : 13;
  const h = 0.92 + unit(`${seed}|h`) * 0.14;
  const parts = [
    prism({ y: 0, w: 0.055, h, sides: 8, taper: 0.86, role: eraNum === 12 ? 'wood' : 'trim' }),
  ];
  const arms = detail === 'low' ? 1 : (eraNum === 13 ? 3 : 2);
  for (let i = 0; i < arms; i += 1) {
    const ay = h - 0.06 - i * 0.10;
    parts.push(prism({ y: ay, w: 0.26, d: 0.026, h: 0.022, sides: 4, role: 'wood' }));
    if (detail !== 'low') {
      for (const side of [-1, 1]) {
        parts.push(prism({ x: side * 0.10, y: ay + 0.022, w: 0.022, h: 0.030, sides: 6, taper: 0.7, role: 'glass' }));
      }
    }
  }
  // the transformer drum: era 13's poles carry one, and it is half of their silhouette
  if (eraNum === 13 && detail !== 'low') {
    parts.push(prism({ x: 0.055, y: h - 0.34, w: 0.08, h: 0.13, sides: 8, taper: 0.94, role: 'trim' }));
  }
  return parts;
}

/** Every street-furniture builder, keyed by the kind `streetFurniture.js` places. */
export const STREET_BUILDERS = Object.freeze({
  post, marker, weeds, bollard, torchpost, lamppost, milestone, gutter, trough, step,
  bin, gaslamp, signpost, manhole, hydrant, rail, streetlight, streetbench, utilitypole,
});
