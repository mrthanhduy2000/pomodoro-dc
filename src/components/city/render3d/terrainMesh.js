/**
 * terrainMesh.js — MẶT ĐẤT LÀ MỘT TẤM LIỀN, không còn là 144 cái hộp.
 *
 * ⚠️ VÌ SAO FILE NÀY RA ĐỜI. Đàm nhìn ảnh chụp rồi nói: *"terrain như các bậc thang… grid rõ…
 * toàn cảnh giống prototype/editor hơn là một thế giới 3D"*, và *"nếu architecture hiện tại phụ
 * thuộc vào grid 12x12 khiến terrain luôn giống board game, hãy tìm cách giữ data/progression
 * nhưng thay đổi cách render"*. Anh đúng, và nguyên nhân nằm gọn trong một câu: mặt đất **là** 144
 * khối hộp riêng lẻ. Hộp thì không dốc được, nên chênh cao độ chỉ có thể là BẬC; hộp thì có mặt
 * bên, nên mỗi ô có bốn cạnh đứng; và 144 ô mỗi ô một sắc độ thì mắt đọc ra ngay cái lưới.
 *
 * ⚠️ VÀ ĐÂY LÀ CHỖ MỘT QUYẾT ĐỊNH CŨ BỊ LẬT — có chủ đích, không phải quên. `terrain.js` mở đầu
 * bằng lập luận *"VÌ SAO PHẢI LÀ THỀM BẬC chứ không phải dốc liên tục"*, và lập luận ấy **đúng**,
 * nhưng nó đứng trên một tiền đề: *"nền thành phố là 144 ô hộp"*. File này gỡ chính tiền đề đó,
 * nên kết luận đi theo nó cũng hết hiệu lực. **Dữ liệu bậc thềm giữ nguyên từng con số** — công
 * trình vẫn đứng ở `heightAt`, `footprint`/`drop` vẫn nguyên vẹn, `ADR-007` không bị đụng tới.
 * Chỉ cách VẼ đổi: cùng bộ số ấy nay được lấy mẫu mượt (`surfaceHeightAt`) trên một lưới đỉnh.
 *
 * ⚠️ BA THỨ PHẢI ĐÚNG CÙNG LÚC, VÀ CHÚNG KÉO NGƯỢC NHAU:
 *   1. **Tâm ô phải giữ ĐÚNG cao độ cũ.** Nhà, cây, cư dân đều đứng theo `heightAt`; mặt đất mượt
 *      mà đi qua tâm ô ở cao độ khác thì tất cả lơ lửng hoặc lún — im lặng, không có gì đỏ. Đây là
 *      lý do `smoothHeightAt` dùng nội suy có `smoothstep`: tại toạ độ NGUYÊN nó trả về đúng
 *      `heightAt`, không xê dịch một phần nghìn.
 *   2. **Không được lộ lưới.** Nếu mỗi ô lấy một màu phẳng thì dù mặt đất đã cong, cái bàn cờ vẫn
 *      còn nguyên — chỉ là bàn cờ cong. Nên màu cũng **nội suy theo đỉnh**, cho ra vệt loang thay
 *      vì ô vuông.
 *   3. **Mặt đường vẫn phải giữ VẬT LIỆU riêng** (Phase 7D: đất nện nhám 0,99 vs bê tông 0,90 —
 *      thứ duy nhất phân biệt "chưa lát" với "đã lát" khi cả hai cùng nằm phẳng).
 *
 * ⚠️ VÌ SAO ĐƯỜNG LÀ MỘT TẤM RIÊNG CHỨ KHÔNG PHẢI MỘT NHÓM VẬT LIỆU TRONG TẤM ĐẤT — bản đầu làm
 * cách kia và nó **sai về hình học, không phải về hiệu năng**. Nhét đường vào lưới đất nghĩa là bề
 * rộng ngõ bị làm tròn về bội của một ô con. Lưới đất chia 3, nên bề rộng khả dĩ là 1/3 hoặc 3/3 —
 * mà muốn ngõ nằm CÂN GIỮA ô thì số ô con của ngõ phải cùng chẵn-lẻ với 3, tức chỉ còn 1/3 (0,33:
 * mảnh như sợi chỉ, cư dân đi lòi ra ngoài) hoặc 1,0 (bằng đại lộ, mất hẳn thứ bậc đường). Lấy 2/3
 * thì đúng bề rộng nhưng **lệch tâm 1/6 ô** — cư dân đi đúng tâm ô sẽ đi sát mép đường. Không có
 * cách nào chỉnh khéo để thoát: đó là ràng buộc chẵn-lẻ, không phải sai số. Và cái giá bị đồn thổi
 * của việc tách ra hoá ra bằng **không**: hai nhóm vật liệu trong một khối hình học vốn đã là hai
 * lệnh vẽ, đúng bằng hai tấm riêng.
 *
 * ⚠️ PHÁP TUYẾN Ở ĐÂY LÀ **MƯỢT**, NGƯỢC HẲN VỚI CÔNG TRÌNH. `geometryFactory.js` cố tình không
 * đánh chỉ mục để mỗi mặt có pháp tuyến phẳng — đó là vẻ "khối cắt gọt" của kiến trúc. Mặt đất thì
 * ngược lại: đồi mà có pháp tuyến phẳng theo từng tam giác thì ra một tấm giấy gấp, tức vẫn
 * low-poly, chỉ khác kiểu. Nên pháp tuyến ở đây tính bằng SAI PHÂN của chính trường cao độ.
 */

import { BufferAttribute, BufferGeometry, Color } from 'three';

import { APRON_CELLS, APRON_EDGE } from '../../../engine/city3d/terrain';

/**
 * Số ô con trên MỘT ô thành phố, cho tấm ĐẤT.
 *
 * ⚠️ Số tam giác đi theo BÌNH PHƯƠNG của nó, nên đây là con số đắt nhất file: 3 cho ra ~6.700 tam
 * giác, 4 cho ra ~11.900, 6 cho ra ~26.000. Chọn 3 vì chỗ dốc gắt nhất của địa hình là bước chuyển
 * giữa hai thềm, rộng đúng 1 ô — 3 mẫu ngang qua một đường cong `smoothstep` đã đủ để mắt đọc ra
 * đường cong thay vì cái bậc, và mọi mẫu thêm sau đó chỉ làm mượt thứ đã mượt.
 */
const SUB = 3;

/**
 * Số ô con trên một ô ĐƯỜNG. Nhỏ hơn nhiều vì mặt đường ngắn (một ô) và gần như phẳng trong lòng
 * một ô — nó chỉ cần đủ đỉnh để bám theo sườn dốc bên dưới, không cần tả hình dạng quả đồi.
 */
const ROAD_SUB = 2;

/**
 * Mặt đường nhô lên tí xíu để không chọi (z-fight) với mặt đất ngay dưới.
 * ⚠️ `sceneGraph.js` NHẬP hằng số này chứ không viết lại số 0,014 của riêng nó — cư dân phải đứng
 * đúng trên mặt đường, và hai con số song song thì chỉ cần một lần chỉnh là cả thành phố lún nửa
 * bàn chân mà không ai hiểu vì sao.
 */
export const ROAD_LIFT = 0.014;

/**
 * Bề rộng NGÕ PHỐ so với đại lộ.
 *
 * ⚠️ 0,64 chứ không phải 0,85: chênh lệch nhỏ hơn thì ở cỡ hiển thị thật (thẻ cảnh cao ~300px trên
 * điện thoại) mắt không đọc ra hai hạng đường, và cả mạng lưới lại quay về "tấm lưới đều tăm tắp".
 * Cũng KHÔNG hẹp hơn nữa: dưới ~0,55 thì ngõ mảnh như sợi chỉ và cư dân đi bộ trên đó sẽ lộ ra
 * ngoài mép đường (họ vẫn đi đúng tâm ô).
 *
 * ⚠️ TỪ PHASE 8C ĐÂY LÀ NHÀ CỦA NÓ, VÌ ĐÂY LÀ NƠI DUY NHẤT CÒN DỰNG MẶT ĐƯỜNG.
 */
export const LANE_WIDTH = 0.64;

/**
 * Biên độ VẾT LOANG trên mặt đất, tính theo phần độ sáng (±).
 *
 * ⚠️ CON SỐ NÀY ĐƯỢC PHÉP LỚN GẤP NHIỀU LẦN TRẦN CŨ, và lý do phải nói rõ kẻo phiên sau tưởng là
 * ẩu. `palette3d.js` siết bốn sắc nền xuống ~0,018 độ sáng sau BA lần vá bàn cờ — trần ấy đúng khi
 * biến thiên bị buộc vào Ô VUÔNG. Vết loang chạy theo trường liên tục tần số ~2,9 ô, vắt ngang các
 * ô, nên nó không có hàng lối nào để mắt nối. Kiểu hỏng ở đây KHÔNG còn là bàn cờ mà là "vằn vện
 * như áo nguỵ trang" — một kiểu hỏng khác hẳn, và nó chỉ xuất hiện ở biên độ cao hơn nhiều.
 */
const MOTTLE_AMPLITUDE = 0.30;

/** Nghiêng bao nhiêu thì coi là "dốc gắt" (1 − cos góc). 0,22 ≈ 38°. */
const SLOPE_FULL = 0.22;
/** Đất trần tối hơn nền bao nhiêu lần. */
const EARTH_DARKEN = 0.66;
/** …và ấm hơn: kênh đỏ nhân lên, kênh lam chia xuống theo đúng hệ số này. */
const EARTH_WARM = 1.18;
/** Dốc gắt nhất thì pha bao nhiêu phần đất trần. Không pha trọn 100% — cỏ vẫn bám thành vệt. */
const EARTH_MIX = 0.72;

function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(t) { return t * t * (3 - 2 * t); }

/** Bước lấy mẫu để ước lượng độ dốc tại một điểm bất kỳ. Nhỏ hơn một ô con của tấm đất. */
const GRAD_EPS = 0.08;

/**
 * Bộ dụng cụ dùng chung cho cả hai tấm: đổi toạ độ, tra màu, tính pháp tuyến từ trường cao độ.
 * Gom vào một chỗ để hai tấm không bao giờ lệch nhau về hệ toạ độ hay về màu vùng ngoài.
 */
function surfaceKit({ terrain, gridSize, layout, palette }) {
  const half = (gridSize - 1) / 2;
  /** Toạ độ ô (số thực) → toạ độ thế giới. Phải khớp `cellToWorld` bên `sceneGraph.js`. */
  const toWorld = (u) => (u - half);

  const variantAt = new Map();
  for (const cell of layout?.ground ?? []) variantAt.set(`${cell.x}|${cell.y}`, cell.variant ?? 0);

  const scratch = new Color();
  const rgbOf = (hex) => { scratch.setHex(hex); return [scratch.r, scratch.g, scratch.b]; };
  const shades = palette?.groundShades ?? [palette?.ground ?? 0x888888];
  const shadeRgb = shades.map(rgbOf);
  const outerRgb = rgbOf(palette?.outskirts ?? palette?.groundAlt ?? shades[0]);

  const heightAt = (u, v) => terrain.surfaceHeightAt(u, v);

  /**
   * Pháp tuyến từ SAI PHÂN TRUNG TÂM của trường cao độ — không phải từ tam giác.
   * Lấy theo tam giác thì mỗi mặt một hướng và quả đồi thành tấm giấy gấp; lấy theo trường thì hai
   * tam giác kề nhau chia chung một hướng ở đỉnh chung, và mặt cong đọc ra liền.
   */
  function normalAt(u, v) {
    const sx = (heightAt(u - GRAD_EPS, v) - heightAt(u + GRAD_EPS, v)) / (2 * GRAD_EPS);
    const sz = (heightAt(u, v - GRAD_EPS) - heightAt(u, v + GRAD_EPS)) / (2 * GRAD_EPS);
    const len = Math.hypot(sx, 1, sz) || 1;
    return [sx / len, 1 / len, sz / len];
  }

  /**
   * Màu mặt đất tại một điểm bất kỳ. Ba tầng chồng lên nhau, mỗi tầng gỡ một kiểu "phẳng":
   *   1. **Nội suy giữa các ô** — xoá cái bàn cờ. Ngoài lưới thì tan dần sang màu vùng đất bao
   *      quanh, nên không có đường viền nào ở chỗ giáp.
   *   2. **Vết loang** ở tần số không liên quan lưới (`terrain.tintAt`) — mặt đất có chỗ đậm chỗ
   *      nhạt như đồng cỏ thật, và các mảng ấy VẮT NGANG ô nên không sinh hàng lối mới.
   *   3. **Sườn dốc lộ đất** — chỗ nào nghiêng gắt thì cỏ không bám được, đất trần lộ ra. Đây là
   *      tầng quan trọng nhất: nó là thứ DUY NHẤT trong ba tầng nói cho mắt biết mặt đất đang
   *      NGHIÊNG. Không có nó thì quả đồi vẫn chỉ là một tấm thảm cùng màu bị uốn cong, và hình
   *      dạng chỉ đọc được qua bóng đổ — mà bóng đổ thì tắt ngấm vào lúc trời râm hoặc ban đêm.
   *
   * @param {number[]} normal pháp tuyến tại chính điểm ấy — dùng cho tầng 3, KHÔNG tính lại.
   */
  function groundColorAt(u, v, normal) {
    const x0 = Math.floor(u); const y0 = Math.floor(v);
    const tx = smoothstep(u - x0); const ty = smoothstep(v - y0);
    const pick = (x, y) => {
      const inside = x >= 0 && y >= 0 && x < gridSize && y < gridSize;
      if (!inside) return outerRgb;
      return shadeRgb[(variantAt.get(`${x}|${y}`) ?? 0) % shadeRgb.length];
    };
    const a = pick(x0, y0); const b = pick(x0 + 1, y0);
    const c = pick(x0, y0 + 1); const d = pick(x0 + 1, y0 + 1);
    const out = [0, 0, 0];
    for (let i = 0; i < 3; i += 1) {
      out[i] = lerp(lerp(a[i], b[i], tx), lerp(c[i], d[i], tx), ty);
    }

    // ── Tầng 2: vết loang ────────────────────────────────────────────────────
    const mottle = 1 + (terrain.tintAt(u, v) - 0.5) * 2 * MOTTLE_AMPLITUDE;
    for (let i = 0; i < 3; i += 1) out[i] = Math.min(1, out[i] * mottle);

    // ── Tầng 3: sườn dốc lộ đất ──────────────────────────────────────────────
    // `normal[1]` = cosin góc nghiêng: 1 khi phẳng, 0,71 ở 45°. Ngưỡng 0,22 ⇒ lộ hết đất quanh 38°.
    const steep = smoothstep(Math.min(1, Math.max(0, (1 - (normal?.[1] ?? 1)) / SLOPE_FULL)));
    if (steep > 0) {
      for (let i = 0; i < 3; i += 1) {
        // ĐẤT TRẦN SUY TỪ CHÍNH MÀU NỀN, không phải một màu mới khai riêng: tối hơn và ấm hơn.
        // Khai một hằng số màu ở đây là gài mìn — 15 kỷ có 15 nền khác nhau (cỏ, cát, đá, tuyết),
        // một màu đất chốt cứng sẽ đúng ở vài kỷ và chỏi hẳn ở số còn lại.
        const bare = out[i] * EARTH_DARKEN * (i === 0 ? EARTH_WARM : (i === 2 ? 1 / EARTH_WARM : 1));
        out[i] = lerp(out[i], Math.min(1, bare), steep * EARTH_MIX);
      }
    }

    // Ra khỏi lưới thì nhạt dần về màu vùng ngoài — cùng lý do với `surfaceHeightAt`.
    const outside = Math.max(0, Math.max(-0.5 - u, u - (gridSize - 0.5)),
      Math.max(-0.5 - v, v - (gridSize - 0.5)));
    if (outside > 0) {
      const t = smoothstep(Math.min(1, outside / (APRON_CELLS * 0.75)));
      for (let i = 0; i < 3; i += 1) out[i] = lerp(out[i], outerRgb[i], t);
    }
    return out;
  }

  return { toWorld, heightAt, normalAt, groundColorAt };
}

/** Bộ gom đỉnh: đẩy vào rồi đúc thành `BufferGeometry` một lần ở cuối. */
function createSink() {
  return { pos: [], nor: [], col: [], tris: 0 };
}

function finish(sink) {
  if (sink.tris === 0) return null;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(sink.pos), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(sink.nor), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(sink.col), 3));
  geometry.computeBoundingSphere();
  return { geometry, triangles: sink.tris };
}

/**
 * Dựng MẶT ĐẤT thành một tấm lưới liền.
 *
 * @param {object} input
 * @param {object} input.terrain   kết quả `buildTerrain` — cần `surfaceHeightAt`
 * @param {number} input.gridSize  cạnh lưới thành phố (12)
 * @param {object} input.layout    cần `ground` (để lấy `variant` → sắc độ)
 * @param {object} input.palette   cần `groundShades` / `ground` / `outskirts`
 * @returns {{geometry:BufferGeometry, triangles:number}|null}
 */
export function buildTerrainSurface({ terrain, gridSize, layout, palette }) {
  if (!terrain || !Number.isFinite(gridSize) || gridSize < 1) return null;
  const kit = surfaceKit({ terrain, gridSize, layout, palette });

  // ── Lưới đỉnh ─────────────────────────────────────────────────────────────
  // Trải từ ngoài rìa vùng đất thoải, qua cao nguyên, ra rìa bên kia.
  //
  // ⚠️ RỘNG BAO NHIÊU LÀ MỘT KHOẢN TIỀN, KHÔNG PHẢI MỘT Ý THÍCH. Lấy ĐÚNG tới `APRON_EDGE`: ra
  // khỏi mốc đó mặt đất phẳng tuyệt đối (xem `terrain.js`), nên thêm đỉnh nữa là thêm tam giác để
  // tả một mặt phẳng — mà tấm ván vùng ngoài của `sceneGraph.js` đã tả nó rồi, bằng 12 tam giác.
  //
  // ⚠️ VÀ `u0` PHẢI LÀ BỘI SỐ NGUYÊN CỦA BƯỚC LƯỚI — đây là một lỗi đã có thật, do bài test bắt
  // được chứ không do đọc mã. Bản đầu viết `u0 = -0.5 - padSteps × du`: cái `-0,5` ấy hợp lý về
  // mặt kể chuyện (mép lưới thành phố nằm ở nửa ô) nhưng nó KHÔNG chia hết cho 1/3, nên các đỉnh
  // rơi vào …, −0,17, +0,17, … và **không đỉnh nào nằm đúng tâm ô**. Tâm ô là nơi nhà, cây, cư dân
  // đứng; không có đỉnh ở đó thì cao độ mặt đất tại chân chúng là một phép nội suy giữa hai đỉnh
  // hàng xóm, tức lệch khỏi `heightAt` vài phần nghìn. Cả thành phố hụt hoặc lún một chút, và
  // **không có gì đỏ lên** — ảnh vẫn đẹp, mặt đất vẫn mượt, chỉ là sai. Neo `u0` vào bội số của
  // bước lưới thì mọi toạ độ NGUYÊN chắc chắn là một đỉnh.
  const du = 1 / SUB;
  const padSteps = Math.ceil((0.5 + APRON_EDGE) * SUB);
  const u0 = -padSteps * du;
  const steps = (gridSize - 1) * SUB + padSteps * 2;

  // Cao độ lưu sẵn: mỗi đỉnh được dùng lại tới 6 lần, mà `surfaceHeightAt` có nhiễu bên trong.
  const H = new Float64Array((steps + 1) * (steps + 1));
  for (let j = 0; j <= steps; j += 1) {
    for (let i = 0; i <= steps; i += 1) {
      H[j * (steps + 1) + i] = kit.heightAt(u0 + i * du, u0 + j * du);
    }
  }

  const sink = createSink();
  const push = (i, j) => {
    const u = u0 + i * du; const v = u0 + j * du;
    const n = kit.normalAt(u, v);
    // Pháp tuyến tính MỘT lần rồi đưa cả cho màu dùng — tầng "sườn dốc lộ đất" cần đúng con số
    // này. Để `groundColorAt` tự tính lại là hai công thức cho một luật, và chúng sẽ lệch nhau
    // ngay khi ai đó chỉnh `GRAD_EPS`.
    const c = kit.groundColorAt(u, v, n);
    sink.pos.push(kit.toWorld(u), H[j * (steps + 1) + i], kit.toWorld(v));
    sink.nor.push(n[0], n[1], n[2]);
    sink.col.push(c[0], c[1], c[2]);
  };

  for (let j = 0; j < steps; j += 1) {
    for (let i = 0; i < steps; i += 1) {
      // Hai tam giác, thứ tự đỉnh cho pháp tuyến hướng LÊN.
      push(i, j); push(i, j + 1); push(i + 1, j + 1);
      push(i, j); push(i + 1, j + 1); push(i + 1, j);
      sink.tris += 2;
    }
  }

  return finish(sink);
}

/**
 * Dựng MẶT ĐƯỜNG — một tấm riêng, bám sát tấm đất bên dưới.
 *
 * Thứ bậc đường: `variant` 0 = đại lộ/ngã tư (rộng hết ô) · 1 = phố dọc (hẹp bề ngang) · 2 = phố
 * ngang (hẹp bề sâu). Xem `ROAD_CELLS` trong `cityLayout.js`.
 *
 * ⚠️ Ô đường KHÔNG được vẽ như một tấm phẳng đặt lên đồi — nó lấy cao độ ở TỪNG đỉnh của chính
 * mình, nên nó cong theo sườn dốc. Đây là nửa còn lại của việc bỏ thềm bậc: mặt đất đã mượt mà
 * đường vẫn là những phiến vuông nằm ngang thì cái lưới quay về ngay, chỉ mảnh hơn.
 *
 * @returns {{geometry:BufferGeometry, triangles:number}|null} `null` khi kỷ chưa có đường nào.
 */
export function buildRoadSurface({ terrain, gridSize, layout, palette }) {
  if (!terrain || !Number.isFinite(gridSize) || gridSize < 1) return null;
  const kit = surfaceKit({ terrain, gridSize, layout, palette });

  const scratch = new Color();
  const rgbOf = (hex) => { scratch.setHex(hex); return [scratch.r, scratch.g, scratch.b]; };
  // ⚠️ CẢ HAI đều suy từ `roadColor` của kỷ. Trước đây ngõ lấy `roles.stone` (màu ĐÁ XÂY TƯỜNG)
  // nên 2/3 số ô đường không hề đổi theo thời đại — xem chú thích `roadLane` ở `palette3d.js`.
  const avenueRgb = rgbOf(palette?.road ?? palette?.edge ?? 0x888888);
  // Ngõ phố tối hơn đại lộ một chút — nhà hai bên che bớt trời. Chênh lệch nhỏ thôi: bề rộng mới
  // là thứ mắt đọc, màu chỉ để nhấn thêm.
  const laneRgb = rgbOf(palette?.roadLane ?? palette?.road ?? palette?.edge ?? 0x888888);

  const sink = createSink();

  for (const prop of layout?.props ?? []) {
    if (prop?.kind !== 'road') continue;
    const lane = prop.variant === 1 || prop.variant === 2;
    const rgb = lane ? laneRgb : avenueRgb;
    // Nửa bề rộng theo từng trục. Ngõ dọc (variant 1) hẹp bề NGANG; ngõ ngang (variant 2) hẹp bề
    // SÂU. Đại lộ và ngã tư rộng trọn ô, nên hai ô đại lộ kề nhau khít không kẽ hở.
    const halfU = prop.variant === 1 ? LANE_WIDTH / 2 : 0.5;
    const halfV = prop.variant === 2 ? LANE_WIDTH / 2 : 0.5;

    const push = (u, v) => {
      const n = kit.normalAt(u, v);
      sink.pos.push(kit.toWorld(u), kit.heightAt(u, v) + ROAD_LIFT, kit.toWorld(v));
      sink.nor.push(n[0], n[1], n[2]);
      sink.col.push(rgb[0], rgb[1], rgb[2]);
    };

    for (let j = 0; j < ROAD_SUB; j += 1) {
      for (let i = 0; i < ROAD_SUB; i += 1) {
        const ua = prop.x - halfU + (i / ROAD_SUB) * halfU * 2;
        const ub = prop.x - halfU + ((i + 1) / ROAD_SUB) * halfU * 2;
        const va = prop.y - halfV + (j / ROAD_SUB) * halfV * 2;
        const vb = prop.y - halfV + ((j + 1) / ROAD_SUB) * halfV * 2;
        push(ua, va); push(ua, vb); push(ub, vb);
        push(ua, va); push(ub, vb); push(ub, va);
        sink.tris += 2;
      }
    }
  }

  return finish(sink);
}
