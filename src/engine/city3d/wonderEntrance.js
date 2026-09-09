/**
 * wonderEntrance.js — Round 51 (ADR-091): THE WONDER OPENS.
 *
 * Every era's landmark stands at the centre of the city, and until now it was sealed. It had to be:
 * `symmetry.test.js` demands a landmark mirror left to right, and a door, a room and a sign are all
 * asymmetric by nature, so round 50's interiors and facade vocabulary deliberately skipped it
 * (`ONE_SIDED` in `facadeDetail.js`, the `symmetric` guard in `interiors.js`). The result, read back
 * at eye level in round 51: the one building the whole city is built around is the only one you
 * cannot walk into.
 *
 * ⚠️ THE WAY OUT IS NOT TO RELAX THE MIRROR — IT IS TO BUILD SOMETHING THAT IS ALREADY SYMMETRIC.
 * A great entrance in every one of these fifteen traditions is symmetric anyway: a portal on the
 * centre line, a colonnade in equal pairs, a lintel and a pediment across the whole front, steps
 * running the full width. Nothing here is placed on "a side"; every part is either centred at x = 0
 * or emitted for `sx ∈ {−1, +1}` at the same magnitude. The mirror is a property of the code, not a
 * promise checked afterwards.
 *
 * ⚠️ AND NOTHING PROJECTS. Every part is flush with the facade or set INTO it. Round 50 paid for
 * this twice — a 0,42-rad Fachwerk brace and a 0,022 protrusion each widened a body's axis-aligned
 * box, which tipped `round(specSpan × BUILDING_SCALE)` and changed a plinth count in a test about
 * TERRAIN. Going inward is free: a recess can never widen a box. So the depth in this file is real
 * depth — the portal is a hole, not a picture of one — and it costs nothing at the footprint.
 */
import { unit } from '../hashId';
import { prism } from './parts';

/** How far the portal cuts INTO the wall, as a share of the body's own depth. Capped in absolute terms. */
export const PORTAL_DEPTH_RATIO = 0.30;
export const PORTAL_DEPTH_MAX = 0.22;

/**
 * The entrance each century builds. `columns` is how many pairs flank the portal (0 = none),
 * `pediment` a gable over the lintel, `steps` how many threshold courses lead in, `arch` whether the
 * head of the portal is round rather than square, `lightRole` what glows inside it (`glass` by
 * default; fire in the centuries before there was glass).
 */
export const WONDER_ENTRANCE = Object.freeze({
  /**
   * ⚠️ `lightRole` LÀ MỘT CỘT RIÊNG VÌ MỘT LÝ DO CÓ THẬT, KHÔNG PHẢI CHO GỌN. Bản đầu cho MỌI kỷ
   * một ô `glass` sáng trong lòng cổng — và kỷ 1 (Göbekli Tepe) lập tức nhận thêm HỌ VẬT LIỆU
   * `glass`, tức +1 lệnh vẽ ở đúng cái kỷ Đàm chọn làm nhân chứng cho luật *"không thứ gì được
   * lén tính tiền lên một kỷ"*. Bảng lệnh vẽ 15 dòng đỏ lên ngay. Mà lỗi ấy không chỉ là hiệu
   * năng: thời đồ đá KHÔNG CÓ KÍNH. Thứ sáng trong lòng một đền thờ chưa có kính là NGỌN LỬA.
   */
  1:  { note: 'Göbekli Tepe — hai trụ chữ T dựng hai bên lối vào, lửa cháy trong lòng cổng, không cửa, không bậc', columns: 1, pediment: false, steps: 0, arch: false, colRole: 'stone', lightRole: 'flame' },
  // ⚠️ KHÔNG CÓ BẬC, VÀ ĐÓ LÀ MỘT CÂU TRẢ LỜI CHỨ KHÔNG PHẢI MỘT CHỖ BỎ SÓT. Kỷ 2 khai
  // `monument: { form: 'monolith' }`, tức kỳ quan của nó mang dáng KIM TỰ THÁP — mà kim tự tháp Ai
  // Cập KHÔNG có bậc thang trên mặt ngoài; đường lên nằm ở đền thung lũng và đường dẫn, hai công
  // trình riêng. Bậc thang chạy trên mặt tháp là hình của Trung Mỹ, không phải của Giza. Kỷ 3
  // (ziggurat Ur) thì ngược lại: cầu thang chính LÀ định nghĩa của dáng ấy.
  2:  { note: 'Ai Cập — kim tự tháp: mặt ngoài trơn, không bậc, không cửa', columns: 1, pediment: false, steps: 0, arch: false, colRole: 'stone' },
  3:  { note: 'Lưỡng Hà — cổng gạch bùn cuốn vòm, hai trụ vuông, bậc lên bệ đền', columns: 1, pediment: false, steps: 2, arch: true, colRole: 'trim' },
  4:  { note: "Chang'an — tam quan gỗ sơn, cột tròn trên đá tảng, xà ngang chồng đấu", columns: 2, pediment: false, steps: 2, arch: false, colRole: 'wood' },
  5:  { note: 'Đức trung cổ — cổng đá cuốn nhọn, không cột, bậc đá mòn', columns: 0, pediment: false, steps: 1, arch: true, colRole: 'stone' },
  6:  { note: 'Việt Nam — tam quan đình làng, cột gỗ tròn, mái nhỏ trên cổng', columns: 2, pediment: true, steps: 2, arch: false, colRole: 'wood' },
  7:  { note: 'Ý Phục Hưng — hàng cột cổ điển và trán tường tam giác, bậc rộng cả mặt tiền', columns: 3, pediment: true, steps: 3, arch: true, colRole: 'stone' },
  8:  { note: 'Bồ Đào Nha — cổng Manueline cuốn vòm, hai cột xoắn, thềm đá', columns: 2, pediment: false, steps: 2, arch: true, colRole: 'stone' },
  9:  { note: 'Pháp Khai Sáng — hàng cột và trán tường tân cổ điển, thềm rộng', columns: 3, pediment: true, steps: 3, arch: false, colRole: 'stone' },
  10: { note: 'Anh công nghiệp — cổng gạch cuốn vòm, hai trụ gang, bậc đá chà trắng', columns: 1, pediment: false, steps: 2, arch: true, colRole: 'iron' },
  11: { note: 'Mỹ Mạ Vàng — hàng cột đá cao và thềm rộng: kiểu Beaux-Arts', columns: 3, pediment: true, steps: 3, arch: true, colRole: 'stone' },
  12: { note: 'Liên Xô — cổng bê tông vuông, hai trụ vuông đồ sộ, không trang trí', columns: 2, pediment: false, steps: 2, arch: false, colRole: 'trim' },
  13: { note: 'Nhật Bản — cổng gỗ hai cột và xà ngang: dáng torii, không trán tường', columns: 1, pediment: false, steps: 1, arch: false, colRole: 'wood' },
  14: { note: 'Singapore — sảnh kính, đố nhôm mảnh, sàn bằng vỉa hè: không bậc nào', columns: 2, pediment: false, steps: 0, arch: false, colRole: 'trim' },
  15: { note: 'UAE — cổng cuốn nhọn, hai trụ ốp đá sáng, bậc thấp', columns: 2, pediment: false, steps: 1, arch: true, colRole: 'stone' },
});

export function wonderEntranceFor(era) {
  return WONDER_ENTRANCE[Number(era)] ?? WONDER_ENTRANCE[1];
}

/**
 * ⚠️ THE PORTAL IS NEVER WIDER THAN THIS SHARE OF THE FRONT. A wonder whose whole face is one hole
 * stops reading as a building; and past about a third, the recess eats the wall the colonnade has to
 * stand on. The same number, from the other side: two thirds of the front is still wall.
 */
export const PORTAL_WIDTH_RATIO = 0.34;

/**
 * Open the front of a landmark.
 *
 * @param out parts array
 * @param p   `{ bpId, index, era, x, z, y, w, d, height, ry, storyHeight, colRole }`
 * @returns how many parts were added
 */
export function emitWonderEntrance(out, p) {
  const {
    bpId = 'bp', index = 0, era = 1, x = 0, z = 0, y = 0, w = 1, d = 1, height = 1, ry = 0,
    storyHeight = 0.5,
  } = p ?? {};
  if (!(w > 0) || !(height > 0) || !(d > 0)) return 0;
  const before = out.length;
  const kit = wonderEntranceFor(era);
  const seed = (k) => unit(`${bpId}|we${index}|${k}`);
  const face = z + d / 2;
  /**
   * ⚠️ EVERY PART CARRIES A TAG, and that is not bookkeeping — it is what let the symmetry test keep
   * working. That test finds a wonder's four corner towers by a heuristic: *a `trim` part off-centre
   * on BOTH axes can only be a corner tower, because the podium and the body are both centred.* True
   * for two years, and false the moment this file put a `trim` capital on a colonnade in front of
   * the building: the capitals were counted as towers, their z all on one side, and the sum stopped
   * being zero. The measuring tool aged, exactly as this project's first law says it will — so the
   * side that BUILDS the parts says what they are, and the tool asks instead of guessing.
   */
  const push = (o) => out.push(prism({ tag: 'entrance', ...o }));

  // The opening: as tall as the ground storey allows, never more than 60 % of the whole building —
  // a two-storey portal on a five-storey wonder is a cathedral door; on a one-storey shrine it is
  // the whole building missing.
  const openH = Math.min(Math.max(storyHeight * 0.86, height * 0.28), height * 0.60);
  const openW = w * PORTAL_WIDTH_RATIO;
  const depth = Math.min(d * PORTAL_DEPTH_RATIO, PORTAL_DEPTH_MAX);
  if (!(openH > 0.02) || !(openW > 0.03) || !(depth > 0.02)) return 0;

  // ── the hole itself ───────────────────────────────────────────────────────
  // Set INTO the wall: its front face lands on the facade plane and its body goes backwards, so the
  // axis-aligned box of the building does not grow by a millimetre.
  push({
    x, ry, z: face - depth / 2, y,
    w: openW, d: depth, h: openH,
    sides: kit.arch ? 8 : 4,
    role: 'dark',
    /**
     * ⚠️ THE TAG IS NOT DECORATION — IT IS THE ONLY WAY TO ASK *"did this wonder open?"*.
     * Without it the test has to guess from part counts or from a role that a dozen other things
     * also use, and a probe written that way answered "2" for a wonder with no entrance and "2" for
     * a wonder with one. Same lesson as `tag: 'stack'` (round 48): the side that BUILDS the thing
     * knows what it is, so the side that builds it must say so.
     */
    tag: 'portal',
  });

  // ⚠️ AND SOMETHING INSIDE IT, or the hole reads as a black rectangle painted on the wall. The back
  // wall catches the light a little; the floor is a different material from the ground outside. Two
  // parts, and they are what turn a hole into a room seen from the street.
  push({
    x, ry, z: face - depth, y,
    w: openW * 0.86, d: Math.max(0.02, depth * 0.22), h: openH * 0.9,
    sides: 4, role: 'wall2',
  });
  push({
    x, ry, z: face - depth / 2, y,
    w: openW * 0.9, d: depth * 0.92, h: Math.max(0.012, openH * 0.03),
    sides: 4, role: 'stone',
  });

  // ── the head: a lintel across, and a pediment over it for the traditions that had one ──────────
  const lintelY = y + openH;
  push({
    x, ry, z: face - 0.012, y: lintelY,
    w: openW * 1.22, d: 0.024, h: Math.max(0.018, height * 0.035),
    sides: 4, role: 'trim',
  });
  if (kit.pediment) {
    // a gable over the whole entrance: `taper: 0` closes it to a ridge, so it is a triangle, and a
    // triangle centred on x = 0 is symmetric by construction
    push({
      x, ry, z: face - 0.014, y: lintelY + Math.max(0.018, height * 0.035),
      w: openW * 1.5, d: 0.028, h: Math.max(0.03, height * 0.07),
      sides: 4, taper: 0, role: 'trim',
    });
  }

  // ── the colonnade: EQUAL PAIRS, always ────────────────────────────────────
  for (let i = 0; i < kit.columns; i += 1) {
    const off = openW * 0.72 + (i + 0.5) * (w * 0.5 - openW * 0.72) / Math.max(1, kit.columns);
    if (off > w * 0.47) break;                       // never past the corner of the body
    const colW = Math.min(w * 0.075, 0.12) * (kit.colRole === 'wood' ? 0.85 : 1);
    const colH = openH * 1.06;
    for (const sx of [-1, 1]) {
      // base · shaft · capital — the three pieces every column in every one of these traditions has
      push({ x: x + sx * off, ry, z: face - colW * 0.5, y, w: colW * 1.35, d: colW, h: Math.max(0.012, colH * 0.05), sides: 4, role: 'stone' });
      push({
        x: x + sx * off, ry, z: face - colW * 0.5, y: y + colH * 0.05,
        w: colW, d: colW, h: colH * 0.88,
        sides: kit.colRole === 'wood' ? 8 : 6, taper: 0.93, role: kit.colRole,
      });
      push({ x: x + sx * off, ry, z: face - colW * 0.5, y: y + colH * 0.93, w: colW * 1.3, d: colW * 1.2, h: Math.max(0.012, colH * 0.07), sides: 4, role: 'trim' });
    }
  }

  // ── the threshold: courses stepping DOWN into the recess, never out into the street ────────────
  for (let s = 0; s < kit.steps; s += 1) {
    const inset = depth * (0.25 + s * 0.22);
    push({
      x, ry, z: face - inset / 2, y: y + (kit.steps - s - 1) * Math.max(0.008, height * 0.012),
      w: openW * (1.28 - s * 0.08), d: Math.max(0.02, inset),
      h: Math.max(0.010, height * 0.014),
      sides: 4, role: 'stone',
    });
  }

  // ── a light in the doorway, so the depth still reads at night ──────────────
  // `glass` is the role the night pass lights up (`glowRole` in `sceneGraph.js`), and it is centred,
  // so it costs the mirror nothing.
  if (seed('lit') > 0.15) {
    const lightRole = kit.lightRole ?? 'glass';
    push({
      x, ry, z: face - depth * 0.86, y: y + openH * 0.30,
      w: openW * 0.4, d: Math.max(0.014, depth * 0.12), h: openH * 0.3,
      sides: lightRole === 'flame' ? 5 : 4, taper: lightRole === 'flame' ? 0.2 : 1,
      role: lightRole,
      ...(lightRole === 'flame' ? { tag: 'fire' } : {}),
    });
  }

  return out.length - before;
}

/**
 * The processional stair of a MONOLITH wonder (a pyramid, a ziggurat).
 *
 * ⚠️ WHY THIS EXISTS SEPARATELY. Eras 2 and 3 declare `monument: { form: 'monolith' }`, so their
 * wonder is not a building with a facade — it is one solid mass, and `buildBuildingSpec` returns
 * before any of the facade machinery runs. `emitWonderEntrance` has nothing to open there. But the
 * Great Pyramid genuinely has no door, while a ziggurat is DEFINED by its stair: Ur's great
 * staircase is the whole point of the form, and a ziggurat without one is a lump. So the monolith
 * gets what a monolith actually has — a flight climbing the front face — and nothing else.
 *
 * ⚠️ IT CANNOT WIDEN THE BUILDING. Each tread sits ON the sloping face, and the face narrows as it
 * rises, so every tread is inside the base box by construction. The stair is centred at x = 0 and
 * every tread is a single centred part, so the mirror holds without a special case.
 *
 * @param out   parts array
 * @param p     `{ bpId, era, x, z, y, base, rise, ry }` — `base` is the full width at the ground,
 *              `rise` the height as a multiple of `base` (the same two numbers `emitMonolith` takes)
 * @returns how many parts were added
 */
export function emitMonolithStair(out, p) {
  const { era = 2, x = 0, z = 0, y = 0, base = 1, rise = 0.6, ry = 0 } = p ?? {};
  const kit = wonderEntranceFor(era);
  // A pyramid has no stair on its face — its causeway is a separate building. A stepped tower does.
  if (kit.steps < 1) return 0;
  const height = rise * base;
  if (!(base > 0.05) || !(height > 0.05)) return 0;
  const before = out.length;
  const push = (o) => out.push(prism({ tag: 'entrance', ...o }));

  const treads = 9;
  const climb = 0.62;                       // how far up the face the flight goes
  const width = Math.max(0.05, base * 0.17);
  const half = base / 2;
  for (let i = 0; i < treads; i += 1) {
    const t = (i + 0.5) / treads * climb;
    const yy = y + height * t;
    /**
     * ⚠️ THE TREAD IS CLAMPED BY THE SAME FORMULA THAT MEASURES IT, and it took three readings to
     * see why anything else fails. `specSpan` (`parts.js`) does not measure a part's depth in the
     * z direction — it takes `reach = max(w/2, d/2)`, the LARGER half, and doubles the result
     * because it assumes a shape centred on the origin. So a tread 0,17 wide and 0,05 deep, laid
     * neatly against the face with its own half-DEPTH inward, still measures as if it were 0,17
     * deep: era 3's ziggurat read 3,908 cells against a 3,7 limit, twice, while every number in
     * this function looked correct.
     *
     * ⇒ The clamp asks the measuring formula's own question: keep `|z| + reach` inside half the
     * base. The treads sit a hair back from the face at the bottom of the flight, which on a
     * STEPPED tower is where a tier edge is anyway.
     */
    const depth = Math.max(0.02, base * 0.05);
    const reach = Math.max(width, depth) / 2;
    const faceZ = z + half * (1 - t);
    const limit = z + half - reach - base * 0.01;
    push({
      x, ry, y: yy, z: Math.min(faceZ - depth / 2 - base * 0.006, limit),
      w: width, d: depth, h: Math.max(0.010, height * 0.022),
      sides: 4, role: 'stone',
    });
  }
  // the shrine doorway at the top of the flight — the thing the stair leads TO
  const topT = climb;
  const doorDepth = Math.max(0.03, base * 0.06);
  const doorW = width * 0.72;
  const doorReach = Math.max(doorW, doorDepth) / 2;
  push({
    x, ry, y: y + height * topT,
    z: Math.min(z + half * (1 - topT) - doorDepth / 2 - base * 0.006, z + half - doorReach - base * 0.01),
    w: doorW, d: doorDepth, h: Math.max(0.03, height * 0.07),
    sides: 4, role: 'dark', tag: 'portal',
  });
  return out.length - before;
}
