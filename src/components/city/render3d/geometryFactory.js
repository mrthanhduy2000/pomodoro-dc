/**
 * geometryFactory.js — biến mô tả thuần (`engine/city3d/parts.js`) thành hình học GPU.
 *
 * ⚠️ TOÀN BỘ CÔNG TRÌNH CỦA MỘT THÀNH PHỐ GỘP THÀNH **MỘT** BufferGeometry.
 * Không phải để tiết kiệm bộ nhớ mà để tiết kiệm LỆNH VẼ: 5 công trình × ~150 khối = 750 khối,
 * vẽ rời từng khối là 750 lệnh vẽ — thứ giết chết hiệu năng trên điện thoại nhanh hơn bất cứ
 * con số tam giác nào. Gộp lại còn đúng 1 lệnh. Đổi lại: đổi bố cục thì phải dựng lại cả khối
 * hình học, nhưng chuyện đó chỉ xảy ra khi Đàm xây xong một công trình hoặc đổi kỷ.
 *
 * ⚠️ TỪ PHASE 7A: MỘT KHỐI HÌNH HỌC, NHIỀU **NHÓM** VẬT LIỆU (`addGroup`).
 * Một khối hình học chỉ nhận được một vật liệu — mà cả thành phố dùng chung một vật liệu chính là
 * nguyên nhân gốc của cảm giác "khối màu phẳng" (đọc `engine/city3d/materials.js` để hiểu vì sao).
 * `addGroup` cho phép chia khối thành nhiều đoạn, mỗi đoạn một vật liệu. Giá phải trả: mỗi nhóm là
 * MỘT lệnh vẽ. Nên tam giác được gom theo **họ vật liệu** (≤15 họ, một kỷ điển hình dùng 5–7) chứ
 * KHÔNG phải theo vai màu (11 vai) hay theo khối (750 khối). 5–7 lệnh vẽ cho cả thành phố vẫn nằm
 * sâu trong ngân sách; 750 thì không.
 *
 * ⚠️ THỨ TỰ NHÓM PHẢI KHỚP MẢNG VẬT LIỆU BÊN `sceneGraph.js`. Hàm này trả về `families` — danh
 * sách tên họ theo đúng thứ tự `materialIndex` đã đánh. Bên kia BẮT BUỘC dựng mảng vật liệu từ
 * chính mảng đó, không được tự liệt kê lại: hai bên tự sắp xếp riêng thì mái sẽ mang vật liệu của
 * mặt nước — lỗi mắt thấy ngay nhưng đọc code thì không, vì cả hai bên đều "đúng" theo cách riêng.
 *
 * ⚠️ KHÔNG ĐÁNH CHỈ MỤC (non-indexed) VÀ ĐÓ LÀ CỐ Ý: mỗi mặt có bộ đỉnh riêng nên pháp tuyến
 * PHẲNG theo từng mặt. Đây chính là vẻ "khối cắt gọt" của hướng mỹ thuật đã chọn — dùng chung đỉnh
 * sẽ làm pháp tuyến bị bình quân hoá, khối trở nên tròn nhũn và mất hết cạnh bắt sáng.
 * (Hệ quả có lợi: với hình học không chỉ mục, `addGroup(start, count, i)` đếm thẳng theo ĐỈNH.)
 *
 * ⚠️ MÀU ĐI QUA `THREE.Color`, KHÔNG tự chia 255. three ≥ r152 bật `ColorManagement` mặc định:
 * `setHex` hiểu số vào là sRGB rồi lưu ra giá trị TUYẾN TÍNH, đúng thứ mà thuộc tính màu đỉnh cần.
 * Tự chuẩn hoá bằng tay sẽ cho ra cảnh bạc phếch — sai một cách rất khó truy, vì vẫn "ra màu".
 */

import { BufferAttribute, BufferGeometry, Color } from 'three';
import { smoothCrease } from '../../../engine/city3d/creaseNormals';
import { MOTION_KIND, motionKindForRole, phaseAt, swayWeight } from '../../../engine/city3d/motion';

import { getEraStyle } from '../../../engine/city3d/eraStyle';
import { MATERIAL_ORDER, contactShade, materialFamilyFor } from '../../../engine/city3d/materials';
import { buildOcclusionGrid, occlusionShade } from '../../../engine/city3d/occlusion';
import { CORNER_SEGMENTS, bevelWidth, cornerRadius, footBevel } from '../../../engine/city3d/parts';
import { handmadeFactor } from '../../../engine/city3d/handmade';

/** Bộ đệm tích luỹ trong lúc dựng. Mảng JS thường rồi mới đổ sang Float32Array một lần. */
function createSink() {
  // `mot` = the per-vertex `aMotion` attribute (kind · amplitude · phase · weight) — round 48.
  // `motion` = the descriptor of the part being emitted right now, or null for a still part.
  return { pos: [], nor: [], col: [], mot: [], motion: null, triangles: 0 };
}

/**
 * ROUND 48 (ADR-088): what moves, decided at build time from the part's ROLE — foliage sways, cloth
 * flaps — and written as a vertex attribute so the shader can move it with zero CPU per frame.
 * The weight grows with height above the placement's base (trunks stay planted, crowns move) and the
 * amplitude scales with the part's own height, so a 0,05-high paddy row does not swing like a tree.
 */
function motionFor(item, part, scaled, transform) {
  // Round 49 (ADR-089): a placement that RIDES THE WATER (`motion: 'bob'`, set by `sceneGraph` for
  // boats) moves as ONE rigid body — every part, hull and sail alike, one phase, weight 1 — so the
  // mast never floats free of the hull. Amplitude 0,35 × the era's wind ⇒ ±3–5 cm on a 0,6 boat.
  if (item.motion === 'bob') {
    return {
      kind: MOTION_KIND.bob, amp: 0.35, phase: phaseAt(item.x, item.z), baseY: item.y ?? 0, reach: 1,
      ox: item.x, oz: item.z, span: 1, rigid: true,
    };
  }
  const kind = motionKindForRole(part.role);
  if (kind === MOTION_KIND.none) return null;
  const baseY = Number.isFinite(item.y) ? item.y : 0;
  const reach = Math.max(0.5, (item.motionReach ?? 1.2));
  const amp = kind === MOTION_KIND.sway ? Math.min(1, Math.max(0.15, scaled.h / 0.6)) : 1;
  const motion = {
    kind, amp, phase: phaseAt(transform.ox, transform.oz), baseY, reach,
    ox: transform.ox, oz: transform.oz, span: Math.max(1e-3, scaled.w, scaled.d, scaled.h),
  };
  if (kind === MOTION_KIND.flap) {
    // Round 49 (ADR-089): the cloth convention of `propSpec`/`buildingSpec`/`rooftop` — a piece of
    // cloth WIDER than tall is a flag or sail, attached along its −X edge and free at +X; one TALLER
    // than wide hangs (banner, laundry, awning drop) and is held along its TOP edge. The held edge
    // must stay still (weight 0) or the flag would slide off its pole; the free edge gets weight 1.
    const hw = scaled.w / 2;
    motion.hang = scaled.h > scaled.w;
    motion.ax = transform.ox - hw * transform.cos;
    motion.az = transform.oz - hw * transform.sin;
    motion.topY = transform.oy + scaled.h;
    motion.h = Math.max(1e-3, scaled.h);
    motion.span = Math.max(1e-3, scaled.w);
    motion.amp = motion.hang ? 0.5 : 1;
  }
  return motion;
}

function motionWeightAt(motion, p) {
  if (motion.rigid) return 1;
  if (motion.kind === MOTION_KIND.sway) return swayWeight(p[1] - motion.baseY, motion.reach);
  if (motion.kind === MOTION_KIND.flap) {
    if (motion.hang) return Math.min(1, Math.max(0, (motion.topY - p[1]) / motion.h));
    return Math.min(1, Math.hypot(p[0] - motion.ax, p[2] - motion.az) / motion.span);
  }
  return 1;
}

/**
 * Đẩy một tam giác kèm pháp tuyến tự tính.
 * Thứ tự đỉnh quyết định mặt nào là mặt NGOÀI — sai thứ tự thì mặt đó biến mất khi nhìn từ ngoài
 * (bị loại vì quay lưng) mà lại hiện ra khi nhìn từ trong. Mọi lời gọi bên dưới đều đã kiểm thứ tự.
 *
 * `shadeBase` = cao độ NỀN mà khối này đang đứng lên (đơn vị thế giới) ⇒ nướng BÓNG TIẾP XÚC vào
 * màu đỉnh: càng gần nền càng tối. Đây là thứ làm công trình NGỒI trên đất thay vì nổi lều bều, và
 * nó tốn 0 đồng lúc chạy vì tính sẵn một lần ở đây. `null` ⇒ không nướng (ô cửa sáng đèn tự phát
 * sáng, tối chân thì thành vô lý).
 *
 * ⚠️ VÌ SAO LÀ CAO ĐỘ NỀN CHỨ KHÔNG PHẢI `true`/`false` — một khuyết tật ĐO ĐƯỢC, vá 2026-08-27.
 * Bản cũ hỏi `contactShade(p[1])`, tức độ cao THẾ GIỚI của đỉnh. Đúng khi `contactShade` được viết,
 * vì hồi đó mặt đất là một mặt phẳng ở y = 0. Phase 7B cho mặt đất có cao độ, và từ đó mệnh đề ấy
 * chết mà không ai để ý: đo được ở lưới 12×12 thì **kỷ 8 có 88/144 ô (61%) nền cao hơn
 * `CONTACT_REACH` = 0,38**, kỷ 5 có 52%, kỷ 1 có 15% — mọi công trình đứng trên những ô đó nhận
 * hệ số 1 ở MỌI đỉnh, tức mất sạch bóng tiếp xúc. Hậu quả nhìn thấy được: trong cùng một thành
 * phố, nhà dưới thấp thì ngồi xuống đất còn nhà trên thềm cao thì dán lên — phụ thuộc thềm chứ
 * không phụ thuộc gì có ý nghĩa. Đúng hình dạng "một kết luận đúng hết đúng vì TIỀN ĐỀ của nó bị
 * gỡ ở một phase khác" (Phase 8C).
 * ⚠️ Khối LƠ LỬNG (kỷ 15) vẫn KHÔNG bị tối — chúng nổi bằng `part.y` cục bộ chứ không bằng cao độ
 * nền, nên `p[1] - shadeBase` vẫn lớn. Đúng như chú thích ở `materials.js` đã hứa.
 */
function pushTriangle(sink, a, b, c, rgb, shadeBase, occ = null) {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];

  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  nx /= len; ny /= len; nz /= len;

  for (const p of [a, b, c]) {
    sink.pos.push(p[0], p[1], p[2]);
    sink.nor.push(nx, ny, nz);
    // Hai tầng bóng nướng sẵn, NHÂN vào nhau, và chúng trả lời hai câu khác nhau:
    //   · `contactShade` — "điểm này cách mặt đất bao xa" (chỉ trục ĐỨNG)
    //   · `occlusionShade` — "quanh điểm này có bao nhiêu vật chắn" (đủ BA chiều)
    // Tầng thứ hai là thứ tầng thứ nhất về mặt cấu trúc không thể thấy: khe giữa hai căn nhà dính
    // tường (ADR-052) nằm ở CÙNG một cao độ với mặt tường trống trải bên cạnh nó.
    // ⚠️ TẦNG MỘT ĐO TỪ NỀN CỦA CHÍNH CÔNG TRÌNH (`p[1] - shadeBase`), KHÔNG TỪ y = 0. Đây là bản
    // vá đến từ `main` cùng ngày với tầng AO này; giữ `contactShade(p[1])` kiểu cũ thì nhà trên
    // thềm cao lại dán lên mặt đất — đúng khuyết tật mà bản vá kia sinh ra để gỡ. `shadeBase === null`
    // là ô cửa sáng đèn: chúng tự phát sáng nên KHÔNG nhận cả hai tầng bóng.
    const k = (shadeBase === null ? 1 : contactShade(p[1] - shadeBase))
      * (shadeBase !== null && occ ? occlusionShade(occ, p[0], p[1], p[2], nx, ny, nz) : 1);
    sink.col.push(rgb.r * k, rgb.g * k, rgb.b * k);
    const mo = sink.motion;
    if (mo) sink.mot.push(mo.kind, mo.amp, mo.phase, motionWeightAt(mo, p));
    else sink.mot.push(0, 0, 0, 0);
  }
  sink.triangles += 1;
}

/** Đặt một điểm cục bộ của khối vào toạ độ thế giới: xoay quanh trục đứng rồi dời. */
function place(px, py, pz, transform) {
  const { cos, sin, ox, oy, oz, m } = transform;
  if (m) {
    // Round 48 (ADR-088): a tilted part carries a full 3×3 matrix (Ry · Rz · Rx, row-major).
    return [
      ox + m[0] * px + m[1] * py + m[2] * pz,
      oy + m[3] * px + m[4] * py + m[5] * pz,
      oz + m[6] * px + m[7] * py + m[8] * pz,
    ];
  }
  return [
    ox + px * cos - pz * sin,
    oy + py,
    oz + px * sin + pz * cos,
  ];
}

/**
 * Lăng trụ đều có thể thóp dần.
 *
 * ⚠️ BÁN KÍNH KHÔNG PHẢI `w/2`. Đa giác đều n cạnh nội tiếp đường tròn bán kính r có khoảng cách
 * GIỮA HAI MẶT ĐỐI DIỆN là `2r·cos(π/n)`, không phải `2r`. Muốn `w` mang đúng nghĩa "bề ngang căn
 * nhà" — nghĩa duy nhất dùng được khi xếp nhà cạnh nhau — thì phải chia ngược lại. Bỏ qua bước này
 * thì hộp vuông (n = 4) sẽ rộng hơn ý định 41%, và mọi công trình sẽ lấn sang ô bên cạnh.
 * Góc bắt đầu `π/n` là thứ làm mặt phẳng quay ra trước thay vì một góc nhọn chĩa vào người xem.
 */
function emitPrism(sink, part, transform, rgb, shadeBase, bevel = 0, occ = null, corner = 0, foot = 0) {
  const wobble = part.wobble > 0 ? part.wobble : 0;
  const n = part.sides;
  const half = Math.PI / n;
  const rx = (part.w / 2) / Math.cos(half);
  const rz = (part.d / 2) / Math.cos(half);
  const top = part.y + part.h;
  const taper = part.taper;

  // ⚠️ `inset` ĐO THEO MẶT, KHÔNG THEO BÁN KÍNH. `rx` là bán kính đường tròn NGOẠI tiếp, còn mặt
  // phẳng của khối nằm gần tâm hơn thế đúng một hệ số `cos(π/n)`. Muốn dải vát rộng đúng `bevel`
  // khi nhìn vuông góc vào mặt tường (nghĩa duy nhất đọc được), phải chia ngược lại — y hệt lý do
  // `rx` chia cho `cos(half)` ở ngay trên. Bỏ bước này thì mép vát của hộp vuông hẹp đi 29%, và
  // hẹp đi đúng ở chỗ ngưỡng nhìn-thấy-được vừa được tính toán cẩn thận để không rơi xuống dưới.
  // ⚠️ ROUND 47 (ADR-087): a beveled BOX rounds its four vertical corners too. The ring of a
  // 4-sided beveled prism is then a rounded rectangle — half-extents `hx`/`hz` (measured per face,
  // like `inset`), each corner an arc of `CORNER_SEGMENTS` segments with radius = the bevel width,
  // emitted in the SAME increasing-angle order as the plain ring so every band keeps its winding
  // and its outward normals. Vertex count per ring = 4 + 4·CORNER_SEGMENTS — the exact number
  // `countTriangles` assumes (`ringVertexCount`); the "budget must not lie" test holds both to it.
  const rounded = n === 4 && corner > 0;
  const ring = (radiusScale, y, inset = 0) => {
    const out = [];
    if (rounded) {
      const hx = Math.max(0, (part.w / 2) * radiusScale - inset);
      const hz = Math.max(0, (part.d / 2) * radiusScale - inset);
      const cr = Math.min(corner, hx * 0.5, hz * 0.5);
      // Corners at 45°, 135°, 225°, 315° — each arc spans ±45° around its corner centre.
      for (let k = 0; k < 4; k += 1) {
        const centre = Math.PI / 4 + (k * Math.PI) / 2;
        const cx = Math.sign(Math.cos(centre)) * (hx - cr);
        const cz = Math.sign(Math.sin(centre)) * (hz - cr);
        for (let sgm = 0; sgm <= CORNER_SEGMENTS; sgm += 1) {
          const a = centre - Math.PI / 4 + (sgm * (Math.PI / 2)) / CORNER_SEGMENTS;
          out.push(place(cx + Math.cos(a) * cr, y, cz + Math.sin(a) * cr, transform));
        }
      }
      return out;
    }
    const ax = Math.max(0, rx * radiusScale - inset / Math.cos(half));
    const az = Math.max(0, rz * radiusScale - inset / Math.cos(half));
    for (let i = 0; i < n; i += 1) {
      const angle = half + (i * 2 * Math.PI) / n;
      // ⚠️ MÉO THỦ CÔNG (round 56, Việc 0) — hệ số LUÔN ≤ 1, tức khối chỉ co vào. Xem `handmade.js`
      // để biết vì sao nó phải tất định theo VỊ TRÍ và vì sao nó không được phép nở ra.
      const k = wobble > 0 ? handmadeFactor(transform.ox, transform.oz, y, i, wobble) : 1;
      out.push(place(Math.cos(angle) * ax * k, y, Math.sin(angle) * az * k, transform));
    }
    return out;
  };
  /** Number of vertices in a ring — 4 + 4·CORNER_SEGMENTS for a rounded box, else `n`. */
  const m = rounded ? 4 + 4 * CORNER_SEGMENTS : n;

  /** Một vành mặt bên nối hai vòng đỉnh. Thứ tự đỉnh đã kiểm: pháp tuyến hướng RA NGOÀI. */
  const band = (lower, upper) => {
    for (let i = 0; i < m; i += 1) {
      const j = (i + 1) % m;
      pushTriangle(sink, lower[i], upper[i], upper[j], rgb, shadeBase, occ);
      pushTriangle(sink, lower[i], upper[j], lower[j], rgb, shadeBase, occ);
    }
  };

  if (taper <= 0) {
    // Thóp về một điểm: mặt bên là tam giác, không có mặt trên. MŨI vẫn nhọn (xem `bevelWidth`),
    // nhưng CHÂN thì nay có một dải vát — round 54 (ADR-094), Việc 3, `footBevel`.
    // ⚠️ CHỖ SƯỜN GẶP ĐÁY LÀ MỘT CẠNH 90° và làm mềm góc gãy KHÔNG với tới được (40° < 90°), nên
    // đây là chỗ duy nhất trong cả khối mà chỉ hình học mới gỡ được.
    const apex = place(0, top, 0, transform);
    if (foot > 0) {
      const bottom = ring(1, part.y, foot);      // vành đáy THỤT VÀO
      const knee = ring(1, part.y + foot);        // vành gối, bề rộng đầy đủ
      band(bottom, knee);
      for (let i = 0; i < n; i += 1) {
        pushTriangle(sink, knee[i], apex, knee[(i + 1) % n], rgb, shadeBase, occ);
      }
      for (let i = 1; i < n - 1; i += 1) {
        pushTriangle(sink, bottom[0], bottom[i], bottom[i + 1], rgb, shadeBase, occ);
      }
      return;
    }
    const bottom = ring(1, part.y);
    for (let i = 0; i < n; i += 1) {
      pushTriangle(sink, bottom[i], apex, bottom[(i + 1) % n], rgb, shadeBase, occ);
    }
    for (let i = 1; i < n - 1; i += 1) {
      pushTriangle(sink, bottom[0], bottom[i], bottom[i + 1], rgb, shadeBase, occ);
    }
    return;
  }

  // ── VÁT CẠNH ─────────────────────────────────────────────────────────────────
  // Không vát: hai vòng đỉnh, một vành mặt bên (như trước Phase 8B).
  // Có vát:   bốn vòng đỉnh, BA vành — dải vát dưới · thân · dải vát trên. Vì hình học ở đây KHÔNG
  // đánh chỉ mục (mỗi mặt có bộ đỉnh riêng, pháp tuyến phẳng theo mặt — xem chú thích đầu file),
  // hai dải vát tự có pháp tuyến riêng nghiêng ~45°, nên chúng bắt sáng khác hẳn mặt tường bên
  // cạnh. **Đó chính là vệt sáng viền** — không cần thêm đèn, thêm vật liệu hay thêm ảnh nào.
  const bottom = ring(1, part.y, bevel);
  const upper = ring(taper, top, bevel);

  if (bevel > 0) {
    const lowKnee = ring(1, part.y + bevel);
    const highKnee = ring(taper, top - bevel);
    band(bottom, lowKnee);
    band(lowKnee, highKnee);
    band(highKnee, upper);
  } else {
    band(bottom, upper);
  }

  // Mặt trên: quạt tam giác theo chiều NGƯỢC vòng để pháp tuyến hướng lên.
  for (let i = 1; i < m - 1; i += 1) {
    pushTriangle(sink, upper[0], upper[i + 1], upper[i], rgb, shadeBase, occ);
  }
  // Mặt đáy: chiều thuận → pháp tuyến hướng xuống. Vẫn phải vẽ vì camera hạ được xuống thấp và
  // khối lơ lửng (kỷ 15) thì nhìn thấy đáy thật.
  for (let i = 1; i < m - 1; i += 1) {
    pushTriangle(sink, bottom[0], bottom[i], bottom[i + 1], rgb, shadeBase, occ);
  }
}

/** Mái dốc hai phía. Nóc chạy dọc trục X cục bộ; `ry` của khối lo phần xoay. */
function emitGable(sink, part, transform, rgb, shadeBase, occ = null, bevel = 0) {
  const hw = part.w / 2;
  const hd = part.d / 2;
  const y0 = part.y;
  const y1 = part.y + part.h;

  const A = place(-hw, y0, -hd, transform);
  const B = place(hw, y0, -hd, transform);
  const C = place(hw, y0, hd, transform);
  const D = place(-hw, y0, hd, transform);

  if (bevel > 0) {
    // ⚠️ ROUND 47 (ADR-087): ROUNDED RIDGE. The sharp ridge line becomes a narrow flat cap `2·bevel`
    // wide, `bevel/2` below the old apex: the two slopes meet a third, near-horizontal face that
    // catches the sun where the knife edge caught nothing. Seen from the default camera this is the
    // single line the eye reads first on every gabled roof — seven eras of skyline. Each gable end
    // becomes a quad (two triangles). 12 triangles — `countTriangles` says the same.
    const yc = y1 - bevel * 0.5;
    const R0a = place(-hw, yc, -bevel, transform);
    const R0b = place(-hw, yc, bevel, transform);
    const R1a = place(hw, yc, -bevel, transform);
    const R1b = place(hw, yc, bevel, transform);
    pushTriangle(sink, D, C, R1b, rgb, shadeBase, occ);     // mặt dốc hướng +Z
    pushTriangle(sink, D, R1b, R0b, rgb, shadeBase, occ);
    pushTriangle(sink, B, A, R0a, rgb, shadeBase, occ);     // mặt dốc hướng −Z
    pushTriangle(sink, B, R0a, R1a, rgb, shadeBase, occ);
    pushTriangle(sink, R0b, R1b, R1a, rgb, shadeBase, occ); // cap — pháp tuyến hướng lên
    pushTriangle(sink, R0b, R1a, R0a, rgb, shadeBase, occ);
    pushTriangle(sink, B, R1a, R1b, rgb, shadeBase, occ);   // đầu hồi +X (quad)
    pushTriangle(sink, B, R1b, C, rgb, shadeBase, occ);
    pushTriangle(sink, A, D, R0b, rgb, shadeBase, occ);     // đầu hồi −X (quad)
    pushTriangle(sink, A, R0b, R0a, rgb, shadeBase, occ);
    pushTriangle(sink, A, B, C, rgb, shadeBase, occ);       // đáy
    pushTriangle(sink, A, C, D, rgb, shadeBase, occ);
    return;
  }

  const R0 = place(-hw, y1, 0, transform);
  const R1 = place(hw, y1, 0, transform);

  pushTriangle(sink, D, C, R1, rgb, shadeBase, occ);      // mặt dốc hướng +Z
  pushTriangle(sink, D, R1, R0, rgb, shadeBase, occ);
  pushTriangle(sink, B, A, R0, rgb, shadeBase, occ);      // mặt dốc hướng −Z
  pushTriangle(sink, B, R0, R1, rgb, shadeBase, occ);
  pushTriangle(sink, B, R1, C, rgb, shadeBase, occ);      // đầu hồi +X
  pushTriangle(sink, A, D, R0, rgb, shadeBase, occ);      // đầu hồi −X
  pushTriangle(sink, A, B, C, rgb, shadeBase, occ);       // đáy
  pushTriangle(sink, A, C, D, rgb, shadeBase, occ);
}

/**
 * Gộp nhiều công trình đã đặt vị trí thành một khối hình học duy nhất.
 *
 * @param {Array<{spec:{parts:Array}, x:number, z:number, y?:number, ry?:number, scale?:number}>} placements
 * @param {object} palette kết quả `buildScenePalette` — cần `palette.roles`
 * @param {object} [options]
 * @param {boolean} [options.skipDeco] bỏ chi tiết trang trí (máy yếu) — hình bóng vẫn nguyên vẹn
 * @param {number}  [options.era] kỷ của thành phố — quyết định vật liệu tường/mái/diềm
 * @returns {{geometry:BufferGeometry, triangles:number, families:string[]}|null}
 *          `null` khi không có gì để vẽ. `families[i]` là họ vật liệu của nhóm `materialIndex = i`.
 */
/**
 * Đặt một khối của một công trình vào toạ độ THẾ GIỚI.
 *
 * ⚠️ TÁCH RA THÀNH HÀM RIÊNG VÌ NAY CÓ **HAI** LƯỢT DUYỆT ĐỌC CÙNG PHÉP BIẾN ĐỔI NÀY: lượt đo
 * (dựng lưới che khuất) và lượt dựng (đẩy tam giác). Hai lượt mà mỗi lượt tự viết lại phép xoay
 * thì đúng bẫy "một luật hai công thức", và cái lệch sẽ im lặng — AO đo một thành phố, GPU vẽ một
 * thành phố khác, ảnh vẫn ra bình thường chỉ có vệt tối nằm sai chỗ.
 *
 * Hai phép xoay chồng nhau và chúng KHÔNG giống nhau:
 *   · đỉnh của khối quay theo TỔNG hai góc (khối tự xoay, rồi cả công trình xoay)
 *   · TÂM của khối chỉ quay theo góc của công trình
 */
function partWorld(item, part) {
  const scale = Number.isFinite(item.scale) ? item.scale : 1;
  const baseRy = Number.isFinite(item.ry) ? item.ry : 0;
  const spin = baseRy + (part.ry ?? 0);
  const lx = part.x * scale;
  const lz = part.z * scale;
  const baseCos = Math.cos(baseRy);
  const baseSin = Math.sin(baseRy);
  const transform = {
    cos: Math.cos(spin),
    sin: Math.sin(spin),
    ox: item.x + (lx * baseCos - lz * baseSin),
    oy: (item.y ?? 0) + part.y * scale,
    oz: item.z + (lx * baseSin + lz * baseCos),
    m: null,
  };
  // Round 48 (ADR-088): the second axis. `Ry(spin) · Rz(rz) · Rx(rx)` about the part's base centre.
  const rx = part.rx ?? 0;
  const rz = part.rz ?? 0;
  if (rx !== 0 || rz !== 0) {
    const cy = transform.cos; const sy = transform.sin;
    const cz = Math.cos(rz); const sz = Math.sin(rz);
    const cx = Math.cos(rx); const sx = Math.sin(rx);
    // Rz · Rx
    const a00 = cz; const a01 = -sz * cx; const a02 = sz * sx;
    const a10 = sz; const a11 = cz * cx; const a12 = -cz * sx;
    const a20 = 0; const a21 = sx; const a22 = cx;
    // Ry · (Rz · Rx) — Ry here matches `place`'s yaw: x' = x·cos − z·sin, z' = x·sin + z·cos
    transform.m = [
      cy * a00 - sy * a20, cy * a01 - sy * a21, cy * a02 - sy * a22,
      a10, a11, a12,
      sy * a00 + cy * a20, sy * a01 + cy * a21, sy * a02 + cy * a22,
    ];
  }
  // Toạ độ của khối đã nằm trọn trong `transform`, nên bản sao dưới đây lấy gốc y = 0 và chỉ giữ
  // kích thước. Nhân `scale` ở đây thay vì ở tầng mô tả để tầng mô tả luôn thuần đơn vị ô.
  const scaled = {
    ...part, y: 0, w: part.w * scale, d: part.d * scale, h: part.h * scale,
  };
  return {
    transform, scaled, spin, scale,
  };
}

/** World-space top centre of one part of a placement — where a chimney's smoke is born (round 48). */
export function partTopWorld(item, part) {
  const { transform, scaled } = partWorld(item, part);
  return { x: transform.ox, y: transform.oy + scaled.h, z: transform.oz };
}

export function buildMergedGeometry(
  placements, palette, { skipDeco = false, glowRole = null, era = null, ao = true } = {},
) {
  const style = getEraStyle(era);
  // Một bể riêng cho MỖI họ vật liệu. Tạo lười (chỉ khi họ đó thật sự có tam giác) để một kỷ dùng
  // 6 họ không phải trả giá cho 15 nhóm rỗng.
  const sinks = new Map();
  const sinkFor = (family) => {
    let s = sinks.get(family);
    if (!s) { s = createSink(); sinks.set(family, s); }
    return s;
  };
  // ⚠️ KHỐI THỨ HAI CHO NHỮNG PHẦN "TỰ PHÁT SÁNG" (đèn cửa sổ ban đêm).
  // Không thể làm đèn cửa sổ bằng cách cho màu thật sáng ở khối chính: vật liệu Lambert NHÂN màu
  // với ánh sáng chiếu tới, nên một mặt tường quay lưng với nắng thì màu nào cũng ra tối — đúng
  // những ô cửa sổ cần sáng nhất lại là những ô tối nhất. Tách chúng ra một khối riêng dùng vật
  // liệu KHÔNG nhận ánh sáng (`MeshBasicMaterial`) thì màu hiện đúng như đã ghi, bất kể đèn đóm —
  // và đó chính là cảm giác "ô cửa đang sáng đèn". Giá: thêm ĐÚNG một lệnh vẽ cho cả thành phố.
  // Round 49 (ADR-089): `glowRole` may name several roles — lit windows AND flames at night.
  const glowRoles = new Set(Array.isArray(glowRole) ? glowRole : glowRole ? [glowRole] : []);
  const glowSink = glowRoles.size ? createSink() : null;
  const roles = palette?.roles ?? {};

  // Đổi mã màu → giá trị tuyến tính đúng MỘT LẦN cho mỗi vai, không phải mỗi đỉnh.
  const colorCache = new Map();
  const scratch = new Color();
  const colorFor = (role) => {
    let rgb = colorCache.get(role);
    if (!rgb) {
      scratch.setHex(roles[role] ?? roles.wall ?? 0x888888);
      rgb = { r: scratch.r, g: scratch.g, b: scratch.b };
      colorCache.set(role, rgb);
    }
    return rgb;
  };

  // ── LƯỢT ĐO: dựng lưới che khuất từ chính những khối sắp được dựng ────────────────────────
  // ⚠️ CHỈ NƯỚNG MỘT LẦN, LÚC DỰNG HÌNH — không phải SSAO chạy mỗi khung. Cảnh này vẽ theo yêu cầu
  // (`renderLoop.js`), nên bất cứ thứ gì tính mỗi khung đều phá đúng cơ chế giữ cho iPhone mát máy.
  // ⚠️ VÀ NÓ CHỈ CÓ THỂ LÀM TỐI ĐI, KHÔNG BAO GIỜ LÀM SÁNG LÊN (`occlusionShade` ≤ 1). Đó là lý do
  // về mặt CẤU TẠO nó không thể gây ra cái hỏng "trắng bệch như sữa" mà dự án đã suýt chết hai lần
  // (AgX tone mapping, rồi bản đồ môi trường ở Phase 7A) — hai lần ấy đều là thứ CỘNG ánh sáng vào.
  const occ = ao
    ? buildOcclusionGrid(placements.flatMap((item) => {
      const ps = item?.spec?.parts;
      if (!Array.isArray(ps)) return [];
      return ps
        .filter((part) => !(skipDeco && part.deco))
        .map((part) => {
          const { transform, scaled, spin } = partWorld(item, part);
          return {
            x: transform.ox, y: transform.oy, z: transform.oz, ry: spin,
            w: scaled.w, d: scaled.d, h: scaled.h,
          };
        });
    }))
    : null;

  for (const item of placements) {
    const parts = item?.spec?.parts;
    if (!Array.isArray(parts) || parts.length === 0) continue;

    for (const part of parts) {
      if (skipDeco && part.deco) continue;
      const { transform, scaled, scale } = partWorld(item, part);

      const glowing = glowSink !== null && glowRoles.has(part.role);
      const target = glowing ? glowSink : sinkFor(materialFamilyFor(part.role, style));
      // a flame glows in its OWN colour; a window glows in the lamp colour
      const rgb = colorFor(glowing ? (part.role === 'flame' ? 'flame' : 'glassLit') : part.role);
      // Ô cửa sáng đèn KHÔNG nhận bóng tiếp xúc — chúng tự phát sáng. Còn lại: đo độ cao từ CHÍNH
      // cao độ nền mà công trình này đứng lên (`item.y`), không phải từ y = 0 — xem `pushTriangle`.
      const shadeBase = glowing ? null : (Number.isFinite(item.y) ? item.y : 0);
      // ⚠️ QUYẾT ĐỊNH VÁT LẤY TỪ KHỐI **CHƯA NHÂN TỈ LỆ** — `bevelWidth(part)` chứ không phải
      // `bevelWidth(scaled)`. `countTriangles` bên tầng thuần cũng đọc khối chưa nhân, nên hỏi
      // cùng một câu trên cùng một dữ liệu là cách duy nhất giữ hai bên không bao giờ lệch. Hỏi
      // trên số đã nhân 1,3 thì những khối nằm sát ngưỡng sẽ được vát ở đây mà không được đếm ở
      // kia, và cái lệch đó im lặng: nó chỉ hiện ra dưới dạng bảng ngân sách báo sai.
      target.motion = glowing ? null : motionFor(item, part, scaled, transform);
      /*
        ⚠️ ROUND 54 (ADR-094): LÀM MỀM PHÁP TUYẾN, VÀ LÀM TRÊN ĐÚNG KHOẢNG CỦA MỘT KHỐI.
        `humanShape.js` dựng cơ thể bằng khối tiện tròn 12 cạnh nhiều vòng từ ADR-057 — hình học
        cong thật. Nhưng `pushTriangle` ghi pháp tuyến THẲNG THEO TỪNG MẶT, nên một hình trụ 12
        cạnh hiện lên thành 12 TẤM PHẲNG. Sửa ở đây không thêm một tam giác nào mà đổi mọi vật cong
        của cả 15 kỷ.
        ⚠️ `từĐây` PHẢI LẤY TRƯỚC KHI PHÁT, và phải làm mềm NGAY SAU KHI PHÁT — không gom lại làm
        một lượt ở cuối. Cảnh này gộp mọi công trình cùng họ vật liệu vào MỘT lưới; hàn đỉnh trên
        bộ đệm đã gộp thì hai bức tường của hai căn nhà vô tình chạm nhau sẽ được làm mềm VÀO NHAU,
        và một góc phố bỗng cong như kẹo.
        ⚠️ Không cần hỏi "khối này có đáng tròn không": góc gãy tự trả lời. Hộp 4 cạnh lệch 90° nên
        tự giữ sắc; trụ 12 cạnh lệch 30° nên tự mềm. Xem `creaseNormals.js`.
      */
      const từĐây = target.pos.length;
      if (part.shape === 'gable') emitGable(target, scaled, transform, rgb, shadeBase, occ, bevelWidth(part) * scale);
      else emitPrism(target, scaled, transform, rgb, shadeBase, bevelWidth(part) * scale, occ,
        cornerRadius(part) * scale, footBevel(part) * scale);
      smoothCrease(target.pos, target.nor, từĐây);
      target.motion = null;
    }
  }

  let triangles = 0;
  for (const s of sinks.values()) triangles += s.triangles;
  if (triangles === 0 && (!glowSink || glowSink.triangles === 0)) return null;

  const merged = mergeSinks(sinks);

  return {
    geometry: merged.geometry,
    families: merged.families,
    triangles,
    glowGeometry: toGeometry(glowSink),
    glowTriangles: glowSink ? glowSink.triangles : 0,
  };
}

/**
 * Nối các bể theo họ thành MỘT khối hình học có nhóm vật liệu.
 *
 * ⚠️ DUYỆT THEO `MATERIAL_ORDER`, KHÔNG duyệt theo thứ tự chèn của `Map`. Thứ tự chèn phụ thuộc
 * vào việc khối nào tình cờ được dựng trước — tức là nó đổi khi Đàm xây thêm một công trình. Một
 * thứ tự "ổn định trong hầu hết trường hợp" là loại lỗi tệ nhất: nó chạy đúng suốt lúc phát triển
 * rồi sai đúng lúc người dùng làm điều gì đó bình thường.
 */
function mergeSinks(sinks) {
  const families = [];
  const pos = [];
  const nor = [];
  const col = [];
  const mot = [];
  const groups = [];

  for (const family of MATERIAL_ORDER) {
    const sink = sinks.get(family);
    if (!sink || sink.triangles === 0) continue;
    const start = pos.length / 3;
    for (let i = 0; i < sink.pos.length; i += 1) pos.push(sink.pos[i]);
    for (let i = 0; i < sink.nor.length; i += 1) nor.push(sink.nor[i]);
    for (let i = 0; i < sink.col.length; i += 1) col.push(sink.col[i]);
    for (let i = 0; i < sink.mot.length; i += 1) mot.push(sink.mot[i]);
    groups.push({ start, count: sink.triangles * 3, index: families.length });
    families.push(family);
  }

  if (families.length === 0) return { geometry: null, families };

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(col), 3));
  geometry.setAttribute('aMotion', new BufferAttribute(new Float32Array(mot), 4));
  for (const g of groups) geometry.addGroup(g.start, g.count, g.index);
  geometry.computeBoundingSphere();
  return { geometry, families };
}

/** Bể tam giác → `BufferGeometry`. `null` nếu rỗng (đừng tạo khối 0 tam giác rồi đi vẽ nó). */
function toGeometry(sink) {
  if (!sink || sink.triangles === 0) return null;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(sink.pos), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(sink.nor), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(sink.col), 3));
  geometry.setAttribute('aMotion', new BufferAttribute(new Float32Array(sink.mot), 4));
  geometry.computeBoundingSphere();
  return geometry;
}
