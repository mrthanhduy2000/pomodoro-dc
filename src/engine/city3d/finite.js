/**
 * finite.js — A GEOMETRIC QUANTITY THAT IS NaN MUST KILL THE CALL, NOT LOSE A COMPARISON.
 * PURE: no three, no DOM, no Date, no Math.random.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WHY THIS FILE EXISTS — ONE WRONG ARGUMENT THAT SURVIVED THREE ROUNDS OF PHOTOGRAPHS
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Round 57 wrote the close-up gate as `boxDistance(stand, nearestBlocker(stand, blockers))`:
 * a DISTANCE (a number) handed to the parameter that wants a BOX. `boxDistance` opened with
 * `if (!point || !box) return Infinity`, so the gate had exactly two branches:
 *
 *     nearestBlocker = 1  ⇒ boxDistance(p, 1) = NaN      ⇒ `NaN >= 0.35` is false ⇒ REJECTED
 *     nearestBlocker = 0  ⇒ `!0` is true ⇒ Infinity      ⇒ `Inf >= 0.35` is true  ⇒ ACCEPTED
 *
 * `nearestBlocker = 0` means the camera stands INSIDE a building. The gate was inverted: the only
 * positions it ever accepted were the ones standing inside a wall. Nothing threw, no test went
 * red, and every tap-to-close-up photograph published in rounds 57, 58 and 59 came out of that
 * inverted planner. Two properties had to hold at once for it to survive that long:
 *
 *   1. a wrong TYPE (a number where an object is wanted) produced NaN instead of an error, and
 *   2. NaN LOSES EVERY COMPARISON — `NaN < x`, `NaN >= x`, `NaN > x` are all false — so whichever
 *      way the gate is written, NaN silently picks one of the two answers and never announces it.
 *
 * ⇒ The fix is NOT "write the comparison the other way round". It is: a geometric quantity is
 *   checked BEFORE it is allowed to meet a threshold, and an invalid one THROWS. Đàm, round 60:
 *   *"Một hàm nhận NaN phải chết ngay, không được lặng lẽ trả false."*
 *
 * ⚠️ `+Infinity` IS A LEGAL DISTANCE AND `NaN` NEVER IS. An empty city is infinitely clear, which
 * is why these guards are not one `Number.isFinite` call: that would make an empty city throw.
 * A distance may be `+Infinity`; a COORDINATE may not, because a point at infinity is never a
 * place a camera can stand.
 *
 * ⚠️ WHERE TO PUT THE GUARD — AT THE THRESHOLD, NOT AT EVERY FIELD. `nearestBlocker` runs the
 * whole blocker list once per flight sample (48 samples × up to ~30 replanning attempts), so
 * validating six box fields on every innermost call buys nothing the exit check does not already
 * catch: any bad field, any bad coordinate and any non-box argument all arrive at the exit as
 * NaN. Functions that return a BOOLEAN have no such exit, so those validate their inputs instead.
 */

const kind = (v) => {
  if (v === null) return 'null';
  if (Array.isArray(v)) return `array(${v.length})`;
  if (typeof v === 'number') return Number.isNaN(v) ? 'NaN' : `number ${v}`;
  if (typeof v === 'object') return 'object';
  return `${typeof v} ${String(v)}`;
};

/**
 * A real number: not NaN, not a non-number. `±Infinity` passes — callers that cannot live with it
 * say so with `demandDistance` or `demandCoord`.
 */
export function demandNumber(value, what) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new TypeError(`${what}: expected a number, got ${kind(value)}`);
  }
  return value;
}

/**
 * A distance or clearance: a real number, never negative. `+Infinity` passes — that is the honest
 * answer for "how far is the nearest building" in an empty city.
 */
export function demandDistance(value, what) {
  demandNumber(value, what);
  if (value < 0) throw new RangeError(`${what}: distance cannot be negative, got ${value}`);
  return value;
}

/** A coordinate on one axis: finite. A point at infinity is not a place. */
export function demandCoord(value, what) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${what}: expected a finite coordinate, got ${kind(value)}`);
  }
  return value;
}

/** A point `{x, y, z}` with all three coordinates finite. */
export function demandPoint(point, what) {
  if (point === null || typeof point !== 'object') {
    throw new TypeError(`${what}: expected a point {x, y, z}, got ${kind(point)}`);
  }
  demandCoord(point.x, `${what}.x`);
  demandCoord(point.y, `${what}.y`);
  demandCoord(point.z, `${what}.z`);
  return point;
}

/**
 * A world bounding box, flat form `{minX, maxX, minY, maxY, minZ, maxZ}` — the shape `pick.js`
 * uses. ⚠️ Rejects a NUMBER outright, which is the exact argument that inverted the round-57 gate.
 * Also rejects an inverted box (`min > max`): every slab test silently answers "no hit" for one,
 * so an inverted blocker is a hole in the city that nothing else would ever report.
 */
export function demandBox(box, what) {
  if (box === null || typeof box !== 'object') {
    throw new TypeError(`${what}: expected a box {minX, maxX, …}, got ${kind(box)}`);
  }
  for (const axis of ['X', 'Y', 'Z']) {
    const lo = demandCoord(box[`min${axis}`], `${what}.min${axis}`);
    const hi = demandCoord(box[`max${axis}`], `${what}.max${axis}`);
    if (lo > hi) throw new RangeError(`${what}: min${axis} ${lo} > max${axis} ${hi} (inverted box)`);
  }
  return box;
}

/** A plain `true`/`false`. A predicate that answers `undefined` must not be read as "no". */
export function demandBoolean(value, what) {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${what}: expected true or false, got ${kind(value)}`);
  }
  return value;
}
