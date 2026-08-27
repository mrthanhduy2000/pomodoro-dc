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

import { getEraStyle } from '../../../engine/city3d/eraStyle';
import { MATERIAL_ORDER, contactShade, materialFamilyFor } from '../../../engine/city3d/materials';
import { bevelWidth } from '../../../engine/city3d/parts';

/** Bộ đệm tích luỹ trong lúc dựng. Mảng JS thường rồi mới đổ sang Float32Array một lần. */
function createSink() {
  return { pos: [], nor: [], col: [], triangles: 0 };
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
function pushTriangle(sink, a, b, c, rgb, shadeBase) {
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
    const k = shadeBase === null ? 1 : contactShade(p[1] - shadeBase);
    sink.col.push(rgb.r * k, rgb.g * k, rgb.b * k);
  }
  sink.triangles += 1;
}

/** Đặt một điểm cục bộ của khối vào toạ độ thế giới: xoay quanh trục đứng rồi dời. */
function place(px, py, pz, transform) {
  const { cos, sin, ox, oy, oz } = transform;
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
function emitPrism(sink, part, transform, rgb, shadeBase, bevel = 0) {
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
  const ring = (radiusScale, y, inset = 0) => {
    const ax = Math.max(0, rx * radiusScale - inset / Math.cos(half));
    const az = Math.max(0, rz * radiusScale - inset / Math.cos(half));
    const out = [];
    for (let i = 0; i < n; i += 1) {
      const angle = half + (i * 2 * Math.PI) / n;
      out.push(place(Math.cos(angle) * ax, y, Math.sin(angle) * az, transform));
    }
    return out;
  };

  /** Một vành mặt bên nối hai vòng đỉnh. Thứ tự đỉnh đã kiểm: pháp tuyến hướng RA NGOÀI. */
  const band = (lower, upper) => {
    for (let i = 0; i < n; i += 1) {
      const j = (i + 1) % n;
      pushTriangle(sink, lower[i], upper[i], upper[j], rgb, shadeBase);
      pushTriangle(sink, lower[i], upper[j], lower[j], rgb, shadeBase);
    }
  };

  if (taper <= 0) {
    // Thóp về một điểm: mặt bên là tam giác, không có mặt trên. Không vát (xem `bevelWidth`).
    const bottom = ring(1, part.y);
    const apex = place(0, top, 0, transform);
    for (let i = 0; i < n; i += 1) {
      pushTriangle(sink, bottom[i], apex, bottom[(i + 1) % n], rgb, shadeBase);
    }
    for (let i = 1; i < n - 1; i += 1) {
      pushTriangle(sink, bottom[0], bottom[i], bottom[i + 1], rgb, shadeBase);
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
  for (let i = 1; i < n - 1; i += 1) {
    pushTriangle(sink, upper[0], upper[i + 1], upper[i], rgb, shadeBase);
  }
  // Mặt đáy: chiều thuận → pháp tuyến hướng xuống. Vẫn phải vẽ vì camera hạ được xuống thấp và
  // khối lơ lửng (kỷ 15) thì nhìn thấy đáy thật.
  for (let i = 1; i < n - 1; i += 1) {
    pushTriangle(sink, bottom[0], bottom[i], bottom[i + 1], rgb, shadeBase);
  }
}

/** Mái dốc hai phía. Nóc chạy dọc trục X cục bộ; `ry` của khối lo phần xoay. */
function emitGable(sink, part, transform, rgb, shadeBase) {
  const hw = part.w / 2;
  const hd = part.d / 2;
  const y0 = part.y;
  const y1 = part.y + part.h;

  const A = place(-hw, y0, -hd, transform);
  const B = place(hw, y0, -hd, transform);
  const C = place(hw, y0, hd, transform);
  const D = place(-hw, y0, hd, transform);
  const R0 = place(-hw, y1, 0, transform);
  const R1 = place(hw, y1, 0, transform);

  pushTriangle(sink, D, C, R1, rgb, shadeBase);      // mặt dốc hướng +Z
  pushTriangle(sink, D, R1, R0, rgb, shadeBase);
  pushTriangle(sink, B, A, R0, rgb, shadeBase);      // mặt dốc hướng −Z
  pushTriangle(sink, B, R0, R1, rgb, shadeBase);
  pushTriangle(sink, B, R1, C, rgb, shadeBase);      // đầu hồi +X
  pushTriangle(sink, A, D, R0, rgb, shadeBase);      // đầu hồi −X
  pushTriangle(sink, A, B, C, rgb, shadeBase);       // đáy
  pushTriangle(sink, A, C, D, rgb, shadeBase);
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
export function buildMergedGeometry(
  placements, palette, { skipDeco = false, glowRole = null, era = null } = {},
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
  const glowSink = glowRole ? createSink() : null;
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

  for (const item of placements) {
    const parts = item?.spec?.parts;
    if (!Array.isArray(parts) || parts.length === 0) continue;

    const scale = Number.isFinite(item.scale) ? item.scale : 1;
    const baseRy = Number.isFinite(item.ry) ? item.ry : 0;

    for (const part of parts) {
      if (skipDeco && part.deco) continue;

      // Hai phép xoay chồng nhau và chúng KHÔNG giống nhau:
      //   · đỉnh của khối quay theo TỔNG hai góc (khối tự xoay, rồi cả công trình xoay)
      //   · TÂM của khối chỉ quay theo góc của công trình
      // Dùng chung một góc cho cả hai là lỗi kinh điển: khối tự xoay đúng nhưng bị văng khỏi vị
      // trí, và nó chỉ lộ ra ở những kỷ có `rough` cao — tức là rất muộn.
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
      };

      // Toạ độ của khối đã nằm trọn trong `transform`, nên bản sao dưới đây lấy gốc y = 0 và chỉ
      // giữ kích thước. Nhân `scale` ở đây thay vì ở tầng mô tả để tầng mô tả luôn thuần đơn vị ô.
      const scaled = {
        ...part,
        y: 0,
        w: part.w * scale,
        d: part.d * scale,
        h: part.h * scale,
      };

      const glowing = glowSink !== null && part.role === glowRole;
      const target = glowing ? glowSink : sinkFor(materialFamilyFor(part.role, style));
      const rgb = colorFor(glowing ? 'glassLit' : part.role);
      // Ô cửa sáng đèn KHÔNG nhận bóng tiếp xúc — chúng tự phát sáng. Còn lại: đo độ cao từ CHÍNH
      // cao độ nền mà công trình này đứng lên (`item.y`), không phải từ y = 0 — xem `pushTriangle`.
      const shadeBase = glowing ? null : (Number.isFinite(item.y) ? item.y : 0);
      // ⚠️ QUYẾT ĐỊNH VÁT LẤY TỪ KHỐI **CHƯA NHÂN TỈ LỆ** — `bevelWidth(part)` chứ không phải
      // `bevelWidth(scaled)`. `countTriangles` bên tầng thuần cũng đọc khối chưa nhân, nên hỏi
      // cùng một câu trên cùng một dữ liệu là cách duy nhất giữ hai bên không bao giờ lệch. Hỏi
      // trên số đã nhân 1,3 thì những khối nằm sát ngưỡng sẽ được vát ở đây mà không được đếm ở
      // kia, và cái lệch đó im lặng: nó chỉ hiện ra dưới dạng bảng ngân sách báo sai.
      if (part.shape === 'gable') emitGable(target, scaled, transform, rgb, shadeBase);
      else emitPrism(target, scaled, transform, rgb, shadeBase, bevelWidth(part) * scale);
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
  const groups = [];

  for (const family of MATERIAL_ORDER) {
    const sink = sinks.get(family);
    if (!sink || sink.triangles === 0) continue;
    const start = pos.length / 3;
    for (let i = 0; i < sink.pos.length; i += 1) pos.push(sink.pos[i]);
    for (let i = 0; i < sink.nor.length; i += 1) nor.push(sink.nor[i]);
    for (let i = 0; i < sink.col.length; i += 1) col.push(sink.col[i]);
    groups.push({ start, count: sink.triangles * 3, index: families.length });
    families.push(family);
  }

  if (families.length === 0) return { geometry: null, families };

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(col), 3));
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
  geometry.computeBoundingSphere();
  return geometry;
}
