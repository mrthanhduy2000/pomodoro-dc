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

import {
  APRON_CELLS, APRON_DROP, APRON_EDGE, TERRAIN_SUB,
} from '../../../engine/city3d/terrain';
import {
  SIDES, SIDE_STEPS, carriagewayShape, getStreetStyle, pavingSubdivision, streetCrossSection,
} from '../../../engine/city3d/streetStyle';

/**
 * Số ô con trên MỘT ô thành phố, cho tấm ĐẤT.
 *
 * ⚠️ Số tam giác đi theo BÌNH PHƯƠNG của nó, nên đây là con số đắt nhất file: 3 cho ra ~6.700 tam
 * giác, 4 cho ra ~11.900, 6 cho ra ~26.000. Chọn 3 vì chỗ dốc gắt nhất của địa hình là bước chuyển
 * giữa hai thềm, rộng đúng 1 ô — 3 mẫu ngang qua một đường cong `smoothstep` đã đủ để mắt đọc ra
 * đường cong thay vì cái bậc, và mọi mẫu thêm sau đó chỉ làm mượt thứ đã mượt.
 */
const SUB = TERRAIN_SUB;

/**
 * Mặt đường nhô lên tí xíu để không chọi (z-fight) với mặt đất ngay dưới.
 * ⚠️ `sceneGraph.js` NHẬP hằng số này chứ không viết lại số 0,014 của riêng nó — cư dân phải đứng
 * đúng trên mặt đường, và hai con số song song thì chỉ cần một lần chỉnh là cả thành phố lún nửa
 * bàn chân mà không ai hiểu vì sao.
 */
export const ROAD_LIFT = 0.014;

/**
 * ⚠️ `LANE_WIDTH` ĐÃ ĐƯỢC GỠ Ở PHASE 9D — ĐỪNG DỰNG LẠI NÓ Ở ĐÂY.
 *
 * Nó từng là MỘT hằng số 0,64 dùng chung cho cả 15 kỷ, và chính điều đó là một phần của nguyên nhân
 * gốc mà 9D phải chữa: khi bề rộng là hằng số, trục "bề rộng" không mang được bản sắc nào, nên toàn
 * bộ sức ép "15 kỷ phải khác nhau" dồn về màu — rồi độ đậm bị căng tới mức nhựa đường tụt xuống
 * dưới ngưỡng nhìn được (`TECH_DEBT #30`).
 *
 * Nay bề rộng do `streetStyle.js` khai theo từng kỷ (ngõ trung cổ 0,30 · đại lộ Dubai 1,00), và
 * `streetCrossSection()` là nơi DUY NHẤT tính ra nửa bề rộng. Cần một con số bề rộng thì hỏi ở đó.
 * Ràng buộc cũ vẫn còn hiệu lực và nay nằm trong `streetStyle.test.js`: ngõ phải hẹp hơn đại lộ,
 * nhưng không được hẹp tới mức cư dân (đi đúng tâm ô) lòi ra ngoài mép đường.
 */

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

/** Đỉnh cao nhạt hơn chân bao nhiêu lần (đá lộ, cây thưa). */
const PEAK_PALE = 1.22;
/** …và lạnh hơn: kênh lam nhân lên, kênh đỏ chia xuống theo đúng hệ số này. Ngược `EARTH_WARM`. */
const PEAK_COOL = 1.10;
/** Đỉnh cao nhất pha tối đa bao nhiêu phần màu đá. Thấp thôi — đây là gợi ý độ cao, không phải tuyết. */
const PEAK_MIX = 0.55;

function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(t) { return t * t * (3 - 2 * t); }

/**
 * SƯỜN DỐC LỘ ĐẤT — luật màu dùng chung cho CẢ HAI tấm địa hình. Sửa `out` tại chỗ.
 *
 * ⚠️ VÌ SAO PHẢI TÁCH RA THÀNH MỘT HÀM, CHỨ KHÔNG CHÉP SANG TẤM KIA. Đây là "một luật một công
 * thức" áp cho hai mặt phải đọc ra là CÙNG MỘT VÙNG ĐẤT. Bản đầu của Phase 9A để tấm núi tự nghĩ ra
 * một luật màu riêng — sáng dần lên theo ĐỘ CAO, pha về `palette.edge` — và hậu quả đo được trên ảnh
 * chụp là hai mảnh đất liền nhau về hình học mà chỏi hẳn nhau về màu: mặt đất thành phố `#626855`
 * (khaki ấm, sáng 0,37) đụng vào chân núi `#7a8876` (lam lục nhạt, sáng 0,50). Mắt đọc ra một cái
 * bệ và một cái hào, chứ không đọc ra một phong cảnh.
 *
 * Và luật ĐÚNG là luật này chứ không phải luật kia: chú thích của chính `groundColorAt` đã ghi đây
 * là *"tầng quan trọng nhất… thứ DUY NHẤT nói cho mắt biết mặt đất đang NGHIÊNG"*. Một dãy núi thì
 * cần điều đó hơn bất cứ chỗ nào khác trong cảnh — mà nó lại là chỗ duy nhất không có.
 *
 * @param {number[]} out    màu RGB 0..1, bị sửa tại chỗ
 * @param {number[]} normal pháp tuyến tại chính điểm ấy
 */
function applyBareEarth(out, normal) {
  // `normal[1]` = cosin góc nghiêng: 1 khi phẳng, 0,71 ở 45°. Ngưỡng 0,22 ⇒ lộ hết đất quanh 38°.
  const steep = smoothstep(Math.min(1, Math.max(0, (1 - (normal?.[1] ?? 1)) / SLOPE_FULL)));
  if (steep <= 0) return;
  for (let i = 0; i < 3; i += 1) {
    // ĐẤT TRẦN SUY TỪ CHÍNH MÀU NỀN, không phải một màu mới khai riêng: tối hơn và ấm hơn.
    // Khai một hằng số màu ở đây là gài mìn — 15 kỷ có 15 nền khác nhau (cỏ, cát, đá, tuyết),
    // một màu đất chốt cứng sẽ đúng ở vài kỷ và chỏi hẳn ở số còn lại.
    const bare = out[i] * EARTH_DARKEN * (i === 0 ? EARTH_WARM : (i === 2 ? 1 / EARTH_WARM : 1));
    out[i] = lerp(out[i], Math.min(1, bare), steep * EARTH_MIX);
  }
}

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
    applyBareEarth(out, normal);

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

/**
 * BỐN LỚP CỦA MỘT CON ĐƯỜNG, đánh số để bên ĐO không phải tự đoán.
 *
 * ⚠️ ĐÂY LÀ BÀI HỌC CỦA `TECH_DEBT #22` ĐƯỢC ÁP NGAY LÚC DỰNG, chứ không phải sau khi trả giá lần
 * nữa. Kết luận của #22: *"việc 'đâu là mái' phải là dữ kiện do bên DỰNG cung cấp, không phải bên
 * ĐO đoán"* — vì mọi phép đoán đều đứng trên một giả định mỹ thuật rồi chết lặng khi mỹ thuật đổi.
 * Ở đây bốn lớp NẰM CHUNG một khối hình học (để giữ đúng một lệnh vẽ), nên nếu không có bảng này
 * thì bài test buộc phải phân loại bằng MÀU — và màu thì chồng lấn thật: mặt đường mòn nhất của
 * kỷ đá cuội (nền × 1,23) sáng hơn vỉa hè của kỷ nhựa đường. Một phép đo như vậy sẽ báo sai mà
 * không ai biết.
 *
 * Giá phải trả: 1 byte cho mỗi tam giác (~7 KB cho cả mạng đường), KHÔNG lên GPU.
 */
export const ROAD_PART = {
  CARRIAGEWAY: 0,   // lòng đường
  WALK: 1,          // vỉa hè
  CURB: 2,          // mặt đứng của bó vỉa
  MARKING: 3,       // vạch kẻ
};

/** Bộ gom đỉnh: đẩy vào rồi đúc thành `BufferGeometry` một lần ở cuối. */
function createSink() {
  return { pos: [], nor: [], col: [], tris: 0, kinds: [] };
}

function finish(sink) {
  if (sink.tris === 0) return null;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(sink.pos), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(sink.nor), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(sink.col), 3));
  geometry.computeBoundingSphere();
  const out = { geometry, triangles: sink.tris };
  if (sink.kinds.length) out.kinds = Uint8Array.from(sink.kinds);
  return out;
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
export function buildTerrainSurface({ terrain, gridSize, layout, palette, tach = false }) {
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
  const sinkVanh = tach ? createSink() : null;
  const push = (s, i, j) => {
    const u = u0 + i * du; const v = u0 + j * du;
    const n = kit.normalAt(u, v);
    // Pháp tuyến tính MỘT lần rồi đưa cả cho màu dùng — tầng "sườn dốc lộ đất" cần đúng con số
    // này. Để `groundColorAt` tự tính lại là hai công thức cho một luật, và chúng sẽ lệch nhau
    // ngay khi ai đó chỉnh `GRAD_EPS`.
    const c = kit.groundColorAt(u, v, n);
    s.pos.push(kit.toWorld(u), H[j * (steps + 1) + i], kit.toWorld(v));
    s.nor.push(n[0], n[1], n[2]);
    s.col.push(c[0], c[1], c[2]);
  };

  for (let j = 0; j < steps; j += 1) {
    for (let i = 0; i < steps; i += 1) {
      const s = (tach && !oTrongLuoi(i, j, u0, du, gridSize)) ? sinkVanh : sink;
      // Hai tam giác, thứ tự đỉnh cho pháp tuyến hướng LÊN.
      push(s, i, j); push(s, i, j + 1); push(s, i + 1, j + 1);
      push(s, i, j); push(s, i + 1, j + 1); push(s, i + 1, j);
      s.tris += 2;
    }
  }

  if (!tach) return finish(sink);
  return { trongLuoi: finish(sink), vanhNgoai: finish(sinkVanh) };
}

/**
 * Ô lưới (i, j) của tấm địa hình nằm TRONG lưới thành phố hay ở VÀNH ĐẤT ngoài?
 *
 * ⚠️ CHỈ DÙNG CHO PHÉP ĐO (`tach`), và nó phải suy từ CÙNG bộ số đã dựng ra tấm lưới (`u0`, `du`,
 * `gridSize`) chứ không được viết lại một mốc riêng — đó là bẫy "một luật hai công thức" đã cắn
 * nhiều lần. Lưới thành phố trải `u ∈ [−0,5 ; gridSize − 0,5]`, tức tâm 5,5 và nửa bề rộng 6.
 *
 * ⚠️ VÀ PHÉP SO PHẢI ĐỐI XỨNG. Tâm ô rơi ĐÚNG lên mốc biên ở cả hai đầu (i = 10 cho u = −0,5 và
 * i = 46 cho u = 11,5 với lưới 12 và SUB 3) — dùng `<` một phía, `<=` phía kia thì một bên ăn thêm
 * một hàng ô mà bên kia không, tức phép đo lệch 1/3 ô về một phía mà không ai thấy. Dùng
 * `|tâm − 5,5| < 6` thì CẢ HAI ô biên đều về vành ngoài, đối xứng.
 *
 * ⚠️ SAI SỐ CÒN LẠI, NÓI THẲNG: ô biên bị cắt đôi bởi mốc (đúng nửa ô nằm trong lưới) nhưng được
 * gán TRỌN cho vành ngoài ⇒ vành ngoài bị tính dôi **1/6 ô** ở mỗi cạnh. Trên lưới 12 ô đó là
 * 1,4% chu vi — không đủ để đổi kết luận, nhưng phải ghi ra vì nó là một thiên lệch CÓ HƯỚNG.
 */
function oTrongLuoi(i, j, u0, du, gridSize) {
  const tam = (gridSize - 1) / 2;          // 5,5 với lưới 12
  const nua = gridSize / 2;                // 6
  const u = u0 + (i + 0.5) * du;
  const v = u0 + (j + 0.5) * du;
  return Math.abs(u - tam) < nua && Math.abs(v - tam) < nua;
}

/**
 * Vạch kẻ và mặt vỉa hè nhô thêm bao nhiêu so với mặt đường, để không chọi mặt (z-fight).
 * Rất nhỏ — đây là chống chọi mặt, không phải một bậc thềm.
 */
const MARKING_LIFT = 0.0035;

/** Vạch kẻ tim đường rộng bao nhiêu phần của lòng đường. */
const MARKING_WIDTH = 0.10;
/** Vạch đứt: mỗi ô đường có bấy nhiêu đoạn, mỗi đoạn dài bằng nửa bước. */
const DASH_SEGMENTS = 3;
/** Vạch sang đường (kỷ 13): số sọc ngựa vằn cắt ngang. */
const CROSSING_BARS = 5;

/**
 * Nhiễu tất định cho ĐỘ MÒN của từng viên lát. Không dùng `Math.random` (bảo tàng phải bất động —
 * ADR-007: cùng một thành phố phải dựng ra y hệt, mãi mãi), và không dùng `terrain.tintAt` vì
 * trường đó có tần số của MẶT ĐẤT (~2,9 ô) nên mọi viên lát trong một ô sẽ nhận gần cùng một giá
 * trị — tức không có sự khác nhau giữa viên nọ và viên kia, đúng thứ ta đang cần.
 */
function stoneNoise(a, b) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Dựng ĐƯỜNG PHỐ — không còn là một dải màu, mà là một mặt cắt có lớp.
 *
 * ```
 *   cỏ │ vỉa hè │ bó vỉa │←──── lòng đường ────→│ bó vỉa │ vỉa hè │ cỏ
 * ```
 *
 * Thứ bậc đường: `variant` 0 = đại lộ/ngã tư · 1 = phố dọc (hẹp bề ngang) · 2 = phố ngang (hẹp bề
 * sâu). Xem `ROAD_CELLS` trong `cityLayout.js`. Bề rộng KHÔNG còn là hằng số `LANE_WIDTH` chung cho
 * mọi kỷ — nó đọc từ `streetStyle.js`, vì bề rộng là trục bản sắc mạnh nhất (mắt đọc bề rộng trước
 * cả màu, và đại lộ Haussmann với ngõ trung cổ khác nhau ở đó chứ không ở sắc xám).
 *
 * ⚠️ TẤT CẢ NẰM TRONG **MỘT** KHỐI HÌNH HỌC, DÙNG CHUNG **MỘT** VẬT LIỆU. Bó vỉa, vỉa hè và vạch kẻ
 * phân biệt nhau bằng MÀU ĐỈNH + HÌNH DẠNG, không bằng vật liệu riêng — nên cả hệ thống đường vẫn
 * đúng **một lệnh vẽ**, y như trước phase này. Đổi lấy: vỉa hè không có độ nhám riêng. Đó là đánh
 * đổi có chủ đích và đã cân: một lệnh vẽ nữa để vỉa hè nhám hơn lòng đường 0,04 là trả giá cao cho
 * thứ gần như không nhìn ra, trong khi CHIỀU CAO bó vỉa (thứ tạo bóng đổ dọc mép) thì nhìn ra ngay.
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
  const street = getStreetStyle(layout?.era);
  const sub = pavingSubdivision(street);

  const scratch = new Color();
  const rgbOf = (hex) => { scratch.setHex(hex); return [scratch.r, scratch.g, scratch.b]; };
  // ⚠️ CẢ HAI đều suy từ `roadColor` của kỷ. Trước đây ngõ lấy `roles.stone` (màu ĐÁ XÂY TƯỜNG)
  // nên 2/3 số ô đường không hề đổi theo thời đại — xem chú thích `roadLane` ở `palette3d.js`.
  const avenueRgb = rgbOf(palette?.road ?? palette?.edge ?? 0x888888);
  // Ngõ phố tối hơn đại lộ một chút — nhà hai bên che bớt trời. Chênh lệch nhỏ thôi: bề rộng mới
  // là thứ mắt đọc, màu chỉ để nhấn thêm.
  const laneRgb = rgbOf(palette?.roadLane ?? palette?.road ?? palette?.edge ?? 0x888888);

  /**
   * VỈA HÈ SÁNG HƠN LÒNG ĐƯỜNG, BÓ VỈA SÁNG HƠN NỮA — cả hai SUY TỪ màu mặt đường chứ không khai
   * riêng, đúng lý lẽ mà `applyBareEarth` đã ghi: 15 kỷ có 15 vật liệu, một màu bê tông chốt cứng
   * sẽ đúng ở vài kỷ và chỏi hẳn ở số còn lại. Vỉa hè thật luôn nhạt hơn lòng đường (ít bánh xe
   * miết, ít dầu máy) — quan sát vật lý, không phải lựa chọn hoà sắc.
   *
   * ⚠️ PHA VỀ TRẮNG, KHÔNG NHÂN HỆ SỐ. Nhân thì vật liệu càng tối càng ít được nâng (nhựa đường
   * 0,11 × 1,26 = 0,14 — mắt không đọc ra), tức đúng những kỷ CẦN tương phản nhất lại nhận ít nhất.
   * Pha về trắng thì ngược lại: nhựa 0,11 → 0,25 (chênh rõ), còn bê tông sáng 0,70 → 0,75 (nhẹ
   * nhàng, không thành vệt chói). Đây là cùng một hình dạng lỗi với `TECH_DEBT #30` — một phép biến
   * đổi tỉ lệ thuận áp lên những giá trị chênh nhau nhiều lần thì sớm muộn cũng sai ở một đầu.
   */
  const lighten = (rgb, t) => rgb.map((c) => c + (1 - c) * t);
  const walkRgb = lighten(avenueRgb, 0.16);
  const curbRgb = lighten(avenueRgb, 0.26);
  const markRgb = [0.92, 0.88, 0.66];   // vạch sơn bạc màu — không trắng tinh, đó là sơn cũ

  const sink = createSink();
  // ⚠️ PHẢI BIẾT CẢ BỀ RỘNG CỦA HÀNG XÓM, KHÔNG CHỈ BIẾT "CÓ ĐƯỜNG HAY KHÔNG". Luật nối của
  // `carriagewayShape` là `min(bề rộng của tôi, bề rộng của hàng xóm)` — một phép ĐỐI XỨNG, và
  // chính tính đối xứng ấy là thứ bảo đảm hai ô kề nhau không thể trình ra hai con số khác nhau
  // tại chỗ giáp. Chỉ hỏi "có/không" như trước thì mỗi ô tự quyết bề rộng của mình một cách độc
  // lập, và ~50% số mép sinh ra một bậc vuông góc (đo được ở Phase 12, xem `scripts/road-fit.mjs`).
  const halfOf = new Map();
  for (const prop of layout?.props ?? []) {
    if (prop?.kind !== 'road') continue;
    const isLane = prop.variant === 1 || prop.variant === 2;
    halfOf.set(`${prop.x}|${prop.y}`, streetCrossSection(street, isLane).half);
  }
  /** Nửa bề rộng của ô hàng xóm, hoặc `null` khi phía ấy không có đường. */
  const nbHalf = (x, y) => {
    const ra = {};
    for (const phía of SIDES) {
      const [dx, dy] = SIDE_STEPS[phía];
      const k = `${x + dx}|${y + dy}`;
      ra[phía] = halfOf.has(k) ? halfOf.get(k) : null;
    }
    return ra;
  };

  /** Đẩy một đỉnh với màu cho sẵn. `lift` cộng thêm vào cao độ (bó vỉa, vạch kẻ). */
  const push = (u, v, rgb, lift = 0) => {
    const n = kit.normalAt(u, v);
    sink.pos.push(kit.toWorld(u), kit.heightAt(u, v) + ROAD_LIFT + lift, kit.toWorld(v));
    sink.nor.push(n[0], n[1], n[2]);
    sink.col.push(rgb[0], rgb[1], rgb[2]);
  };

  /**
   * Một tấm bốn góc BẤT KỲ nằm ngang (mặt trên), 2 tam giác. Bốn góc đi theo vòng, mỗi góc `[u,v]`.
   *
   * ⚠️ PHẢI LÀ BỐN GÓC TỰ DO, KHÔNG PHẢI HÌNH CHỮ NHẬT — từ khi lòng đường có CÁNH TAY LOE
   * (`carriagewayShape`) thì mép ngoài của một dải đường không còn song song với tim đường, nên ô
   * lát ở mép là một hình THANG. Ép nó về chữ nhật thì hoặc thừa ra ngoài mép, hoặc hụt vào để lộ
   * cỏ — cả hai đều đúng cái răng cưa mà cánh tay loe sinh ra để xoá.
   */
  const quad4 = (p0, p1, p2, p3, rgb, lift, part) => {
    push(p0[0], p0[1], rgb, lift); push(p1[0], p1[1], rgb, lift); push(p2[0], p2[1], rgb, lift);
    push(p0[0], p0[1], rgb, lift); push(p2[0], p2[1], rgb, lift); push(p3[0], p3[1], rgb, lift);
    sink.kinds.push(part, part);
    sink.tris += 2;
  };

  /** Một tấm chữ nhật nằm NGANG (mặt trên), 2 tam giác. `part` = lớp nào (xem `ROAD_PART`). */
  const quad = (ua, va, ub, vb, rgb, lift, part) => {
    quad4([ua, va], [ua, vb], [ub, vb], [ub, va], rgb, lift, part);
  };

  /**
   * Một dải ĐỨNG — mặt bên của bó vỉa. Đây là thứ DUY NHẤT trong cả hệ thống đường có mặt thẳng
   * đứng, và chính nó tạo ra vệt bóng chạy dọc mép đường. Bóng ấy cho con đường CHIỀU SÂU ngay cả
   * khi màu đường và màu đất gần nhau — tức nó là trục bản sắc không phụ thuộc vào bảng màu.
   * Pháp tuyến hướng RA NGOÀI theo trục đang chạy (`axis` = 'u' hoặc 'v'), dấu theo `outward`.
   */
  const curbFace = (ua, va, ub, vb, height, axis, outward) => {
    const nx = axis === 'u' ? outward : 0;
    const nz = axis === 'u' ? 0 : outward;
    const emit = (u, v, lift) => {
      sink.pos.push(kit.toWorld(u), kit.heightAt(u, v) + ROAD_LIFT + lift, kit.toWorld(v));
      sink.nor.push(nx, 0, nz);
      sink.col.push(curbRgb[0], curbRgb[1], curbRgb[2]);
    };
    emit(ua, va, 0); emit(ub, vb, 0); emit(ub, vb, height);
    emit(ua, va, 0); emit(ub, vb, height); emit(ua, va, height);
    sink.kinds.push(ROAD_PART.CURB, ROAD_PART.CURB);
    sink.tris += 2;
  };

  for (const prop of layout?.props ?? []) {
    if (prop?.kind !== 'road') continue;
    const isLane = prop.variant === 1 || prop.variant === 2;
    const baseRgb = isLane ? laneRgb : avenueRgb;
    const cross = streetCrossSection(street, isLane);

    // ⚠️ HÌNH DẠNG LẤY TỪ HÀNG XÓM, KHÔNG TỪ `variant`. Xem `carriagewayShape` để biết vì sao —
    // tóm tắt: một ô đường KHÔNG phải một hình chữ nhật. Nó là một LÕI ở giữa cộng tối đa bốn CÁNH
    // TAY, vì một hình chữ nhật chỉ có hai bề rộng còn một ngã tư cần tới bốn.
    const shape = carriagewayShape(cross.half, nbHalf(prop.x, prop.y));
    const ext = shape.reach;
    const u0 = prop.x - ext.west; const u1 = prop.x + ext.east;
    const v0 = prop.y - ext.north; const v1 = prop.y + ext.south;

    // ── LÒNG ĐƯỜNG — LÕI + CÁNH TAY, chia theo CỠ VIÊN LÁT ─────────────────────
    // ⚠️ Bốn đỉnh của một ô con nhận CÙNG một màu ⇒ viên lát PHẲNG có mép rõ. Hình học ở đây không
    // đánh chỉ mục (mỗi tam giác mang ba đỉnh riêng) nên điều đó có được miễn phí — không cần thêm
    // thuộc tính, không cần shader riêng. Nhựa đường khai `stone = 0` ⇒ `sub = 2` và biên độ mòn
    // 0,10 ⇒ mặt gần như liền, đúng thứ nó phải là.
    //
    // ⚠️ SỐ Ô CON SUY TỪ CHIỀU DÀI THẬT, KHÔNG PHẢI LUÔN LÀ `sub`. Trước đây cả ô là MỘT hình chữ
    // nhật nên chia `sub × sub` là xong; nay mỗi ô có tới năm mảnh dài ngắn khác nhau, và chia đều
    // `sub` cho mọi mảnh thì viên lát của cái cánh tay dài 0,14 ô sẽ nhỏ hơn viên của cái lõi dài
    // 0,72 ô tới năm lần — tức cỡ viên thôi là một trục bản sắc và bắt đầu kể chuyện về hình dạng
    // ngã tư. Cỡ viên phải là một đại lượng của THẾ GIỚI (`1/sub` ô), không phải của mảnh.
    const oCon = (dai) => Math.max(1, Math.round(Math.abs(dai) * sub));
    /**
     * Độ mòn của RIÊNG viên này. Hạt lấy theo toạ độ TUYỆT ĐỐI của viên (không phải chỉ số trong
     * mảnh), nên hai ô đường kề nhau không lặp lại cùng một mẫu — nếu lấy theo chỉ số thì cả mạng
     * đường sẽ hiện ra một hoạ tiết tuần hoàn đúng bằng một ô, tức lại là cái lưới. Lấy theo TÂM
     * viên chứ không theo chỉ số cũng là thứ giữ cho hoạ tiết KHÔNG đổi khi cách chia mảnh đổi.
     */
    const monTai = (u, v) => {
      const n = stoneNoise(Math.round(u * sub * 2), Math.round(v * sub * 2));
      const k = 1 + (n - 0.5) * street.wear;
      return baseRgb.map((c) => Math.min(1, c * k));
    };

    /**
     * Một DẢI đường chạy dọc trục `axis` từ `from` tới `to`, nửa bề rộng đi từ `hFrom` tới `hTo`.
     * `hFrom === hTo` ⇒ dải thẳng; khác nhau ⇒ dải LOE (ngõ nhỏ nhập vào đại lộ).
     */
    const dai = (axis, from, to, hFrom, hTo) => {
      // ⚠️ DẢI DÀI BẰNG KHÔNG THÌ BỎ QUA. Nó xảy ra khi lõi chạm đúng ranh giới ô, và nếu vẫn đẩy
      // vào lưới thì ta có những tam giác SUY BIẾN (diện tích 0) nằm đúng trên ranh giới — vô hình
      // trên màn hình nhưng đủ để làm hỏng mọi phép đo gom-tam-giác-theo-ô (trọng tâm rơi đúng vào
      // ranh giới rồi bị làm tròn sang ô BÊN CẠNH, và ô ấy bỗng "rộng" thêm ra). Đã cắn một lần.
      if (Math.abs(to - from) < 1e-9) return;
      const nDoc = oCon(to - from);
      const nNgang = oCon(2 * Math.max(hFrom, hTo));
      const truc = axis === 'u' ? prop.x : prop.y;
      const ngang = axis === 'u' ? prop.y : prop.x;
      for (let i = 0; i < nDoc; i += 1) {
        const ta = i / nDoc; const tb = (i + 1) / nDoc;
        const a = from + (to - from) * ta; const b = from + (to - from) * tb;
        const ha = hFrom + (hTo - hFrom) * ta; const hb = hFrom + (hTo - hFrom) * tb;
        for (let j = 0; j < nNgang; j += 1) {
          const sa = j / nNgang; const sb = (j + 1) / nNgang;
          const a0 = ngang - ha + 2 * ha * sa; const a1 = ngang - ha + 2 * ha * sb;
          const b0 = ngang - hb + 2 * hb * sa; const b1 = ngang - hb + 2 * hb * sb;
          const P = axis === 'u'
            ? [[truc + a, a0], [truc + a, a1], [truc + b, b1], [truc + b, b0]]
            : [[a0, truc + a], [a1, truc + a], [b1, truc + b], [b0, truc + b]];
          const cu = (P[0][0] + P[2][0]) / 2; const cv = (P[0][1] + P[2][1]) / 2;
          quad4(P[0], P[1], P[2], P[3], monTai(cu, cv), 0, ROAD_PART.CARRIAGEWAY);
        }
      }
    };

    // LÕI — chỗ hai con đường chồng lên nhau (một hình CHỮ NHẬT, không phải hình vuông). Ở đầu
    // đường cụt thì chính nó là cái mũ kết thúc con đường.
    const cu = shape.coreU; const cv = shape.coreV;
    const nU = oCon(2 * cu); const nV = oCon(2 * cv);
    for (let j = 0; j < nV; j += 1) {
      for (let i = 0; i < nU; i += 1) {
        const ua = prop.x - cu + (2 * cu * i) / nU; const ub = prop.x - cu + (2 * cu * (i + 1)) / nU;
        const va = prop.y - cv + (2 * cv * j) / nV; const vb = prop.y - cv + (2 * cv * (j + 1)) / nV;
        quad(ua, va, ub, vb, monTai((ua + ub) / 2, (va + vb) / 2), 0, ROAD_PART.CARRIAGEWAY);
      }
    }
    // BỐN CÁNH TAY — mỗi cánh bắt đầu ở MÉP LÕI, không phải ở tâm ô, nên chúng KHÔNG chồng lên lõi
    // và KHÔNG chồng lên nhau. Chồng nhau thì hai tấm đồng phẳng chọi nhau (z-fight) thành một vệt
    // nhấp nháy chạy dọc cả mạng đường — đúng loại lỗi chỉ hiện ra khi camera nhúc nhích.
    // Cánh chạy theo `u` rộng `coreV` ở gốc (bằng con đường ngang), cánh chạy theo `v` rộng `coreU`.
    if (shape.arms.west !== null) dai('u', -cu, -0.5, cv, shape.arms.west);
    if (shape.arms.east !== null) dai('u', cu, 0.5, cv, shape.arms.east);
    if (shape.arms.north !== null) dai('v', -cv, -0.5, cu, shape.arms.north);
    if (shape.arms.south !== null) dai('v', cv, 0.5, cu, shape.arms.south);

    // ── BÓ VỈA + VỈA HÈ ───────────────────────────────────────────────────────
    // Chỉ dựng ở CẠNH NGOÀI — cạnh nào giáp một ô đường khác thì không có vỉa hè, vì hai con đường
    // gặp nhau thì mặt đường phải liền. Không kiểm điều này thì ngã tư mọc bó vỉa chắn ngang giữa
    // lối đi, và cư dân (đi đúng tâm ô) sẽ bước xuyên qua nó.
    if (cross.walk > 0.01) {
      const sides = [
        { du: -1, dv: 0, có: shape.arms.west !== null },
        { du: 1, dv: 0, có: shape.arms.east !== null },
        { du: 0, dv: -1, có: shape.arms.north !== null },
        { du: 0, dv: 1, có: shape.arms.south !== null },
      ];
      for (const side of sides) {
        if (side.có) continue;
        const axis = side.du !== 0 ? 'u' : 'v';
        const outward = side.du !== 0 ? side.du : side.dv;
        // Mép trong = đúng mép lòng đường phía ấy; vỉa hè chạy dọc trọn bề của trục vuông góc, nên
        // ở ngã tư nó ôm sát tới tận chỗ con đường cắt ngang thay vì hụt một khúc.
        const inner = outward < 0
          ? (axis === 'u' ? ext.west : ext.north)
          : (axis === 'u' ? ext.east : ext.south);
        const outer = inner + cross.walk;
        const c0 = (axis === 'u' ? prop.x : prop.y) + outward * inner;
        const c1 = (axis === 'u' ? prop.x : prop.y) + outward * outer;
        const a0 = axis === 'u' ? v0 : u0;
        const a1 = axis === 'u' ? v1 : u1;

        if (cross.curb > 0) {
          curbFace(
            axis === 'u' ? c0 : a0, axis === 'u' ? a0 : c0,
            axis === 'u' ? c0 : a1, axis === 'u' ? a1 : c0,
            cross.curb, axis, outward,
          );
        }
        // Mặt trên vỉa hè, nhô đúng bằng chiều cao bó vỉa.
        if (axis === 'u') {
          quad(Math.min(c0, c1), a0, Math.max(c0, c1), a1,
            walkRgb, cross.curb + MARKING_LIFT, ROAD_PART.WALK);
        } else {
          quad(a0, Math.min(c0, c1), a1, Math.max(c0, c1),
            walkRgb, cross.curb + MARKING_LIFT, ROAD_PART.WALK);
        }
      }
    }

    // ── VẠCH KẺ ───────────────────────────────────────────────────────────────
    // ⚠️ CHỈ TRÊN ĐẠI LỘ, và chỉ ở kỷ có vạch. Vạch tim đường kẻ vào một con ngõ 0,30 ô thì nó
    // chiếm gần hết lòng đường và đọc ra thành "đường sơn trắng", không phải "đường có vạch".
    // ⚠️ HƯỚNG VẠCH CŨNG ĐỌC TỪ HÀNG XÓM: vạch phải chạy DỌC theo hướng con đường đi, mà hướng ấy
    // là "phía nào có ô đường nối tiếp". Suy từ `variant` thì ngã tư (variant 0) luôn ra một hướng
    // cố định và vạch sẽ cắt ngang chính con đường ở một nửa số ngã tư.
    if (street.markings !== 'none' && !isLane) {
      const dọc = shape.arms.north !== null || shape.arms.south !== null;   // chạy theo trục v?
      const along = dọc ? 'v' : 'u';
      const halfU = (u1 - u0) / 2; const halfV = (v1 - v0) / 2;
      const halfMark = Math.min(halfU, halfV) * MARKING_WIDTH;
      const centre = dọc ? (u0 + u1) / 2 : (v0 + v1) / 2;
      const from = dọc ? v0 : u0;
      const span = dọc ? v1 - v0 : u1 - u0;

      if (street.markings === 'crossing') {
        // Sọc ngựa vằn cắt NGANG đường, ở đầu ô — đọc ra ngay là chỗ sang đường.
        const ngang = dọc ? u1 - u0 : v1 - v0;
        for (let b = 0; b < CROSSING_BARS; b += 1) {
          const w0 = centre - ngang / 2 + (ngang * (b + 0.15)) / CROSSING_BARS;
          const w1 = centre - ngang / 2 + (ngang * (b + 0.6)) / CROSSING_BARS;
          const lo = from + span * 0.06;
          const hi = from + span * 0.22;
          if (along === 'v') {
            quad(Math.min(w0, w1), lo, Math.max(w0, w1), hi, markRgb, MARKING_LIFT, ROAD_PART.MARKING);
          } else {
            quad(lo, Math.min(w0, w1), hi, Math.max(w0, w1), markRgb, MARKING_LIFT, ROAD_PART.MARKING);
          }
        }
      } else {
        // `center` = một vạch liền suốt ô · `dashed` = ba đoạn ngắt quãng.
        const segs = street.markings === 'dashed' ? DASH_SEGMENTS : 1;
        for (let s = 0; s < segs; s += 1) {
          const t0 = (s + (segs > 1 ? 0.15 : 0)) / segs;
          const t1 = (s + (segs > 1 ? 0.75 : 1)) / segs;
          const lo = from + span * t0;
          const hi = from + span * t1;
          if (along === 'v') {
            quad(centre - halfMark, lo, centre + halfMark, hi, markRgb, MARKING_LIFT, ROAD_PART.MARKING);
          } else {
            quad(lo, centre - halfMark, hi, centre + halfMark, markRgb, MARKING_LIFT, ROAD_PART.MARKING);
          }
        }
      }
    }
  }

  return finish(sink);
}

/**
 * Dựng VÙNG ĐẤT XA — dãy núi / đồi / thảo nguyên bao quanh thành phố.
 *
 * ⚠️ ĐÂY LÀ THỨ THAY THẾ TẤM VÁN PHẲNG 72×72 (12 tam giác) của `sceneGraph.js`, không phải thứ đắp
 * thêm lên nó. Giữ cả hai thì mặt ván sẽ chọi với chân núi ở đúng cao độ `-APRON_DROP`.
 *
 * ⚠️ LƯỚI ĐỈNH PHẢI NEO VÀO `innerEdge`, KHÔNG ĐƯỢC NEO VÀO MÉP NGOÀI. Đây đúng là cái bẫy mà
 * `buildTerrainSurface` đã trả giá một lần (xem chú thích `u0` ở trên): nếu chia đều từ mép ngoài
 * vào thì `innerEdge` rơi vào giữa hai đỉnh, và chỗ giáp với tấm đất thành phố sẽ có một hàng đỉnh
 * lệch — tức một khe hở chạy vòng quanh thành phố, mảnh nhưng nhìn thấy được khi trời sáng.
 *
 * ⚠️ VÀ NÓ KHÔNG NHẬN BÓNG, KHÔNG ĐỔ BÓNG — vì đúng, chứ không phải vì nhanh. Khung bóng đổ chỉ bó
 * quanh lưới 12×12; mọi điểm ngoài khung tra vào bản đồ bóng sẽ lấy nhầm giá trị ở mép và bị coi là
 * đang trong bóng, làm cả dãy núi tối đen (đã thấy tận mắt với tấm ván cũ).
 *
 * @returns {{geometry:BufferGeometry, triangles:number}|null}
 */
export function buildHorizonSurface({ horizon, palette, terrain, gridSize }) {
  if (!horizon || typeof horizon.heightAt !== 'function') return null;

  // Trường vết loang DÙNG CHUNG với tấm đất thành phố. Tuỳ chọn: thiếu `terrain` thì tấm núi vẫn
  // dựng được (chỉ mất một tầng chi tiết), vì đây là tầng trang trí chứ không phải hình học.
  const half = Number.isFinite(gridSize) && gridSize > 0 ? (gridSize - 1) / 2 : 5.5;
  const mottleAt = typeof terrain?.tintAt === 'function'
    ? (x, z) => 1 + (terrain.tintAt(x + half, z + half) - 0.5) * 2 * MOTTLE_AMPLITUDE
    : null;

  const scratch = new Color();
  const rgbOf = (hex) => { scratch.setHex(hex); return [scratch.r, scratch.g, scratch.b]; };
  // ⚠️ ĐÚNG CÁI MÀU MÀ TẤM ĐẤT THÀNH PHỐ NHẠT DẦN VỀ (`outerRgb` ở `surfaceKit`). Hai tấm gặp nhau
  // ở chỗ giáp, nên chúng phải khởi hành từ cùng một màu — nếu không thì dù cao độ khớp tuyệt đối,
  // mắt vẫn thấy một đường viền chạy vòng quanh thành phố.
  const baseRgb = rgbOf(palette?.outskirts ?? palette?.groundAlt ?? palette?.ground ?? 0x888888);
  // Đỉnh cao BẠC hơn chân núi — đá lộ, cây thưa, hứng nhiều ánh trời hơn. Đây KHÔNG phải tuyết.
  //
  // ⚠️ SUY TỪ CHÍNH MÀU NỀN, KHÔNG LẤY `palette.edge`. Bản đầu lấy `edge` (`#d2d0cb`, sáng 0,82 —
  // gần như trắng, và nó là màu VIỀN GIAO DIỆN chứ không phải màu đá) nên đỉnh núi ngả trắng xanh
  // và cả dãy đọc ra là sương. Cùng đúng lý lẽ mà `applyBareEarth` đã ghi ngay trên: 15 kỷ có 15
  // nền khác nhau, một màu đỉnh chốt cứng sẽ đúng ở vài kỷ và chỏi ở số còn lại.
  const peakRgb = baseRgb.map((c, i) => Math.min(1,
    c * PEAK_PALE * (i === 2 ? PEAK_COOL : (i === 0 ? 1 / PEAK_COOL : 1))));

  // ⚠️ BƯỚC LƯỚI ĐỌC TỪ CHÍNH TRƯỜNG CAO ĐỘ, KHÔNG TỰ CHỌN. `buildHorizon` đã chia bước sao cho có
  // ĐÚNG một đỉnh nằm trên chỗ giáp, và nó cũng dùng chính con số ấy để không khai nhiều chi tiết
  // hơn mức lưới chở nổi. Tự chọn một bước ở đây là hai công thức cho một luật — bản đầu làm vậy
  // và mở ra một khe hở 0,5 đơn vị vòng quanh thành phố (hai cái nêm sáng ở góc dưới khung hình).
  const inner = horizon.innerEdge;
  const reach = horizon.reach;
  const step = horizon.step;
  const rings = Math.ceil((reach - inner) / step);
  const n = Math.round(inner / step);          // đúng `HORIZON_INNER_STEPS`, không còn làm tròn oan
  const total = n + rings;                     // chỉ số lớn nhất theo mỗi trục
  const coord = (i) => i * step;

  const sink = createSink();
  const EPS = step * 0.35;

  // Pháp tuyến bằng SAI PHÂN TRUNG TÂM của chính trường cao độ — cùng lý do với tấm đất: lấy theo
  // tam giác thì mỗi mặt một hướng và quả núi thành tấm giấy gấp.
  const normalAt = (x, z) => {
    const sx = (horizon.heightAt(x - EPS, z) - horizon.heightAt(x + EPS, z)) / (2 * EPS);
    const sz = (horizon.heightAt(x, z - EPS) - horizon.heightAt(x, z + EPS)) / (2 * EPS);
    const len = Math.hypot(sx, 1, sz) || 1;
    return [sx / len, 1 / len, sz / len];
  };

  const cap = Math.max(1e-6, horizon.maxHeight);
  const push = (ix, iz) => {
    const x = coord(ix); const z = coord(iz);
    const y = horizon.heightAt(x, z);
    const nrm = normalAt(x, z);
    // `lift` = 0 ở chân, 1 ở đỉnh cao nhất mà kỷ này CÓ THỂ đạt. Chia cho trần của kỷ chứ không cho
    // một hằng số chung: kỷ thảo nguyên cao nhất 0,8 đơn vị mà đem chia cho 6 thì cả vùng đất ra
    // đúng một màu, còn chia cho trần của chính nó thì mấy gợn sóng thấp vẫn đọc được.
    const lift = Math.min(1, Math.max(0, (y + APRON_DROP) / cap));
    const t = smoothstep(lift) * PEAK_MIX;
    const col = [
      lerp(baseRgb[0], peakRgb[0], t),
      lerp(baseRgb[1], peakRgb[1], t),
      lerp(baseRgb[2], peakRgb[2], t),
    ];

    // ── Vết loang — CÙNG TRƯỜNG NHIỄU với tấm đất thành phố ────────────────────
    // Không phải một nguồn nhiễu thứ hai: mảng đậm nhạt phải chạy LIỀN qua chỗ giáp, nếu không thì
    // chính chỗ nối lại là chỗ duy nhất mắt tìm ra được vì hai bên có hai kiểu lấm tấm khác nhau.
    // `tintAt` nhận toạ độ Ô nên phải đổi hệ ở đây (`toCell`), không đưa toạ độ thế giới vào thẳng.
    if (mottleAt) {
      const m = mottleAt(x, z);
      for (let i = 0; i < 3; i += 1) col[i] = Math.min(1, col[i] * m);
    }

    // ── Sườn dốc lộ đất — ĐÚNG luật của tấm kia, không phải một luật riêng ─────
    applyBareEarth(col, nrm);

    sink.pos.push(x, y, z);
    sink.nor.push(nrm[0], nrm[1], nrm[2]);
    sink.col.push(col[0], col[1], col[2]);
  };

  for (let jz = -total; jz < total; jz += 1) {
    for (let ix = -total; ix < total; ix += 1) {
      // Bỏ hẳn phần lòng trong — tấm đất thành phố đã tả nó rồi, và vẽ chồng lên là chọi mặt.
      if (Math.abs(ix) < n && Math.abs(jz) < n) continue;
      push(ix, jz); push(ix, jz + 1); push(ix + 1, jz + 1);
      push(ix, jz); push(ix + 1, jz + 1); push(ix + 1, jz);
      sink.tris += 2;
    }
  }

  return finish(sink);
}
