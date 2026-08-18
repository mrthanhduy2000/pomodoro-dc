/**
 * rooftop.js — HÌNH HỌC CỦA MÁI: cái NHÔ LÊN (`stack`) và cái ĐƯỜNG NÉT (`crown`).
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`. Đây chỉ là MÔ TẢ hình học ở
 * dạng dữ liệu, đúng kỷ luật của `parts.js` · `groundFloor.js` · `flora.js`.
 *
 * Bảng khai nằm ở `roofStyle.js`; file này chỉ DỰNG; `buildingSpec.js` chỉ ĐỌC. Đây là vế "hình"
 * của khuôn "bảng ↔ hình" đã dùng năm lần (ADR-029, ADR-030).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ ĐIỀU KIỆN CẦN SỐ MỘT: FILE NÀY **KHÔNG ĐƯỢC TỰ TÍNH LẠI HÌNH DẠNG MÁI**
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Muốn đặt một cái bồn nước lên mái thì phải biết mặt mái cao bao nhiêu, rộng bao nhiêu. Cách sai
 * — và là cách gần như ai cũng viết đầu tiên — là chép lại công thức của `emitRoof`
 * (`eaves` → `rw` → `pitch` → cộng dồn chiều cao từng tầng). Dự án đã trả giá cho đúng hình dạng
 * ấy hai lần: `sweep-score.mjs` chép công thức hình học của `city-preview.mjs` kèm một mặc định
 * `--cell` KHÁC (Phase 4G, ra một bộ số bịa hoàn chỉnh và rất thuyết phục), và `sceneGraph.js`
 * DỰ ĐOÁN số tam giác bằng công thức riêng trong khi three biết chính xác (Performance Gate, thiếu
 * 56%). Cả hai lần, hai bên chỉ lệch nhau khi có người sửa MỘT bên — và không có gì đỏ lên.
 *
 * ⇒ `emitRoof` **TRẢ VỀ** một bản mô tả chỗ đứng (`RoofAnchors`), và file này chỉ đọc bản mô tả
 * ấy. Một luật, một công thức. Phase sau đổi hình mái thì chỗ đứng tự đúng theo, không cần ai nhớ
 * sửa hai nơi.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ GIỚI HẠN THẬT CỦA `parts.js`: **CHỈ XOAY ĐƯỢC QUANH TRỤC ĐỨNG** (`ry`). Không có `rx`/`rz`.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Nghĩa là không thể đặt một cuộn ngói NẰM NGHIÊNG theo chiều dốc mái. Đây không phải chuyện tiểu
 * tiết: nó quyết định `barrel` (ngói bò) được dựng bằng cái gì. Hai cách xử lý, và cách thứ hai
 * mới đúng:
 *   ✗ Xấp xỉ bằng một tấm đứng đặt ở "chiều cao trung bình của mặt dốc" — nhìn từ xa thì tạm, nhìn
 *     gần thì nó chọc thủng mái ở đầu này và chôn hẳn ở đầu kia. Một xấp xỉ sai ở CẢ HAI ĐẦU.
 *   ✓ Dựng đúng những BỘ PHẬN CỦA HỆ NGÓI ỐNG VỐN ĐÃ THẲNG ĐỨNG: **đầu ngói ống** ở diềm (瓦当 của
 *     Trung Hoa, cái nút tròn ở mép mái ngói Địa Trung Hải) và **cuộn nóc** chạy trên sống mái.
 *     Cả hai đều có thật, đều là thứ mắt đọc ra "mái này lợp ngói ống", và đều dựng được bằng khối
 *     đứng. Chọn vế hình học mình dựng được thay vì xấp xỉ vế mình không dựng được.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ MỌI KÍCH THƯỚC LÀ **TỈ LỆ**, VÀ **TRẦN LUÔN THẮNG SÀN**
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Đây là lần thứ tư dự án viết câu này (`eaves` 7C · cửa 10 · `MIN_STONE` 9D). Một cái ống khói
 * rộng 0,1 đặt lên kỳ quan rộng 1,4 là một cái ống; đặt đúng con số ấy lên nhà dân rộng 0,45 thì
 * nó chiếm 22% mặt mái và đọc ra là một cái tháp. Nên: mọi số đo suy từ bề ngang khối, kẹp theo
 * thứ tự `min(trần, max(sàn, mong muốn))` — trần đứng NGOÀI CÙNG.
 * Và **mảng nhà quá nhỏ thì KHÔNG có gì trên mái**, chứ không phải có một cái ống khói tí hon:
 * một mái trống là chuyện bình thường ngoài đời, còn một cái bồn nước 3cm thì không.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ NGÂN SÁCH CHI TIẾT PHẢI THẬT SỰ CẮN — bài học Phase 8D
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * "Mức thấp" ở đây là **nhà dân**: 30 căn mỗi thành phố, gấp sáu lần số công trình chính, nên
 * chính chúng quyết định ngân sách. Ba khoản cắt, mỗi khoản có lý do NGOÀI ĐỜI chứ không phải "cho
 * rẻ":
 *   - lan can nhà dân chỉ có tay vịn, không có con tiện: con tiện là thứ phải tiện từng cái, và
 *     nhà thường thì đóng một thanh gỗ ngang;
 *   - ngói bò nhà dân chỉ có đầu ngói ở diềm, không có cuộn nóc: cuộn nóc là chi tiết của thợ cả;
 *   - bồn nước / cửa sổ mái nhà dân bỏ phần đai và phần nẹp.
 * `rooftop.test.js` đo thẳng: cùng một kỷ, cùng một cỡ khối, nhà dân PHẢI ra ít khối hơn công
 * trình chính.
 */

import { prism } from './parts';
import { unit } from '../hashId';
import { isValidRoofStyle } from './roofStyle.js';

// ─── HẰNG SỐ: TỈ LỆ VÀ TRẦN ──────────────────────────────────────────────────

/** Mảng nhà hẹp hơn mức này thì không có gì trên mái. Dưới đây mọi chi tiết đều thành vệt bẩn. */
export const ROOFTOP_MIN_SPAN = 0.24;

/** Ống khói / bồn nước / buồng thang rộng bao nhiêu phần bề ngang mái. */
const STACK_W_RATIO = 0.17;
/** …và không bao giờ rộng hơn mức này so với mái, dù kỷ khai gì. */
export const STACK_W_MAX_RATIO = 0.3;
/** Bề ngang tuyệt đối nhỏ nhất còn đọc ra được là một vật thể. */
export const STACK_W_MIN = 0.055;

/** Chiều cao ống khói theo bề ngang của chính nó — ống khói là thứ CAO, đó là cả công dụng. */
const CHIMNEY_TALL = 2.6;
/** Bồn nước thì bè hơn ống khói nhiều. */
const TANK_TALL = 1.25;
/** Buồng máy thang: gần vuông. */
const LIFT_TALL = 1.15;
/** Cục nóng: bẹt. */
const CONDENSER_TALL = 0.62;
/** Cột ăng-ten: rất mảnh và rất cao. */
const MAST_TALL = 7.5;
const MAST_W_RATIO = 0.035;

/** Khoảng cách tim–tim tối thiểu giữa hai vật cùng loại, theo bề ngang của chúng. */
const STACK_PITCH = 1.75;

/** Đầu xà gỗ: bề ngang theo mảng nhà, có trần. */
const BEAM_W_RATIO = 0.05;
const BEAM_W_MAX = 0.055;
/** Số đầu xà nhiều nhất trên MỘT cạnh. */
const BEAM_MAX = 6;
const BEAM_MAX_PLAIN = 4;

/** Đầu ngói ống: nhỏ hơn đầu xà, nhưng dày hàng hơn. */
const TILE_END_W_RATIO = 0.035;
const TILE_END_W_MAX = 0.04;
const TILE_END_MAX = 9;
const TILE_END_MAX_PLAIN = 6;

/** Lan can: con tiện. */
const BALUSTER_MAX = 7;
const RAIL_THICK_RATIO = 0.035;
const RAIL_THICK_MAX = 0.045;

/** Đầu đao: vươn ra bao nhiêu phần bề ngang mái, có trần. */
const UPTURN_REACH_RATIO = 0.13;
const UPTURN_REACH_MAX = 0.16;

function finite(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

/**
 * Bề ngang của một vật trên mái. **Trần đứng ngoài cùng** — xem khối chú thích ở đầu file.
 * Trả về `0` nghĩa là mái này không đỡ nổi vật ấy, và chỗ gọi phải bỏ qua chứ không thu nhỏ tiếp.
 */
export function stackWidth(span, ratio = STACK_W_RATIO, maxRatio = STACK_W_MAX_RATIO) {
  const base = Math.max(0, finite(span, 0));
  const ceiling = base * maxRatio;
  if (ceiling < STACK_W_MIN) return 0;
  return Math.min(ceiling, Math.max(STACK_W_MIN, base * ratio));
}

/**
 * Đặt được mấy cái. Kỷ khai `stackCount` là một sự thật văn hoá (một ống khói đá Đức, ba ống
 * Manchester, bốn cục nóng Singapore); bề ngang mái mới là thứ quyết định có nhét vừa hay không.
 */
export function stackSlots(span, itemW, wanted) {
  if (!(itemW > 0)) return 0;
  const room = Math.max(0, finite(span, 0));
  const fit = Math.floor(room / (itemW * STACK_PITCH));
  return clamp(Math.min(Math.max(1, Math.round(finite(wanted, 1))), fit), 0, 4);
}


/**
 * Rải `n` vật đều nhau trên một đoạn dài `span`, trả về danh sách độ lệch so với tâm.
 *
 * ⚠️ CÔNG THỨC PHẢI **PHẢN ĐỐI XỨNG TỪNG BIT**, không chỉ "đối xứng về mặt toán học". Bản đầu viết
 * `(i + 0.5) * step - span / 2`, đúng về giá trị nhưng hai đầu KHÔNG ra hai số đối nhau chính xác
 * trong dấu phẩy động. Mà bài `kỳ quan của MỌI kỷ vẫn đối xứng tuyệt đối` cộng toàn bộ `x` lại rồi
 * đòi `< 1e-9`, và nó đúng khi đòi vậy: một kỳ quan lệch nửa phần tỉ vẫn là một lời hứa đã vỡ.
 * `(i − (n − 1) / 2) * step` thì hai đầu là hai số đối nhau **bằng đúng một phép nhân dấu**.
 */
function spreadOffsets(n, span) {
  if (n <= 0) return [];
  const step = span / n;
  return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * step);
}

// ─── ĐƯỜNG NÉT TRÊN MÁI ──────────────────────────────────────────────────────

/** Đầu xà gỗ thò ra khỏi đỉnh tường — hàng chấm chạy suốt mặt tường, ngay dưới mái. */
function emitBeamEnds(out, a, ctx) {
  const { x, z, w, d, plain, weight, at } = ctx;
  const beamW = Math.min(BEAM_W_MAX, Math.max(0.02, w * BEAM_W_RATIO));
  const cap = plain ? BEAM_MAX_PLAIN : BEAM_MAX;
  const n = clamp(Math.floor(w / (beamW * 3.2)), 2, cap);
  if (n < 2) return;
  const reach = beamW * (1.1 + weight);
  const y = a.eaveY - beamW * 1.4;
  for (const side of [-1, 1]) {
    for (const off of spreadOffsets(n, w * 0.86)) {
      // ⚠️ Chiều dài thò ra theo hạt giống: dầm cọ chặt tay thì cái dài cái ngắn. Đều tăm tắp là
      // dấu hiệu của cưa máy, tức của một thời khác.
      const jitter = 0.75 + at('beam', off) * 0.5;
      out.push(prism({
        x: x + off, z: z + side * (d / 2 + (reach * jitter) / 2),
        y, w: beamW, d: reach * jitter, h: beamW, sides: 4, role: 'wood',
      }));
    }
  }
}

/**
 * Ngói ống. Xem khối chú thích đầu file về việc vì sao dựng ĐẦU NGÓI + CUỘN NÓC chứ không xấp xỉ
 * cuộn ngói nằm nghiêng.
 */
function emitBarrel(out, a, ctx) {
  const { x, z, w, d, plain, weight, at } = ctx;
  const tileW = Math.min(TILE_END_W_MAX, Math.max(0.016, w * TILE_END_W_RATIO));
  const cap = plain ? TILE_END_MAX_PLAIN : TILE_END_MAX;
  const n = clamp(Math.floor(w / (tileW * 2.1)), 3, cap);
  if (n < 3) return;
  const y = a.eaveY - tileW * 0.2;
  for (const side of [-1, 1]) {
    for (const off of spreadOffsets(n, w * 0.9)) {
      out.push(prism({
        x: x + off, z: z + side * (d / 2 + tileW * 0.3),
        y, w: tileW, d: tileW * 1.5, h: tileW * (0.8 + weight * 0.35),
        sides: 6, role: 'roof',
      }));
    }
  }
  // Cuộn nóc — chi tiết của thợ cả, nhà dân không có (ngân sách LOD phải cắn).
  if (plain) return;
  for (const ridge of a.ridges) {
    const rollW = tileW * 1.7;
    const k = clamp(Math.floor(ridge.w / (rollW * 1.6)), 2, 6);
    const cos = Math.cos(ridge.ry);
    const sin = Math.sin(ridge.ry);
    for (const off of spreadOffsets(k, ridge.w * 0.9)) {
      out.push(prism({
        x: ridge.x + off * cos, z: ridge.z - off * sin,
        y: ridge.y - rollW * 0.3 + at('roll', off) * rollW * 0.1,
        w: rollW, d: rollW, h: rollW * (0.7 + weight * 0.3), sides: 6, role: 'roof',
      }));
    }
  }
}

/** Sống mái nổi — thanh nóc dày chạy suốt đỉnh mái hai dốc. */
function emitRidgeBeam(out, a, ctx) {
  const { weight } = ctx;
  for (const ridge of a.ridges) {
    const thick = Math.min(RAIL_THICK_MAX * 1.6, Math.max(0.022, ridge.w * 0.05)) * (0.7 + weight * 0.5);
    out.push(prism({
      x: ridge.x, z: ridge.z, y: ridge.y - thick * 0.45,
      w: ridge.w * 0.99, d: thick * 1.35, h: thick, sides: 4, ry: ridge.ry, role: 'roof',
    }));
  }
}

/**
 * Đầu đao — bốn góc diềm vút lên.
 *
 * ⚠️ Không có `rx`/`rz` nên không nghiêng được một khối. Cái vút lên dựng bằng **hai bậc thu dần
 * đi ra và đi lên**, xoay 45° để cạnh nhọn hướng ra ngoài góc — đúng cách mắt đọc ra một đầu đao
 * từ xa (một vệt sáng chéo tách khỏi khối mái), và cũng đúng cách các bộ mái thật chồng đấu củng
 * lên dần ở góc.
 *
 * ⚠️ GÓC XOAY PHẢI **SOI GƯƠNG THEO BÊN** (`sx * π/4`), không được là một hằng số. Hộp vuông xoay
 * +45° và −45° trông y hệt nhau, nên chọn cái nào cũng "đúng trên màn hình" — nhưng bài `kỳ quan
 * của MỌI kỷ vẫn đối xứng tuyệt đối` so `ry` của khối trái với `−ry` của khối phải, và nó so đúng:
 * một góc mái soi gương thì góc xoay của nó cũng soi gương. Ghi hằng số ở đây là ghi một sổ sách
 * sai mà hình ảnh không tố cáo được.
 */
function emitUpturn(out, a, ctx) {
  const { weight, plain } = ctx;
  const reach = Math.min(a.rw * UPTURN_REACH_MAX, a.rw * UPTURN_REACH_RATIO) * weight;
  const tipW = Math.max(0.03, a.rw * 0.06);
  if (reach < tipW * 0.6) return;
  const steps = plain ? 1 : 2;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      for (let i = 0; i < steps; i += 1) {
        const t = (i + 1) / steps;
        out.push(prism({
          x: a.x + sx * (a.rw / 2 + reach * t * 0.7),
          z: a.z + sz * (a.rd / 2 + reach * t * 0.7),
          y: a.eaveY + reach * t * 0.85,
          w: tipW * (1 - i * 0.28), d: tipW * (1 - i * 0.28),
          h: tipW * 0.9, sides: 4, taper: 0.55, ry: (sx * Math.PI) / 4, role: 'roof',
        }));
      }
    }
  }
}

/** Lan can mái — tay vịn quanh mép, cộng con tiện ở công trình chính. */
function emitBalustrade(out, a, ctx) {
  const { plain, weight } = ctx;
  const thick = Math.min(RAIL_THICK_MAX, Math.max(0.014, a.rw * RAIL_THICK_RATIO));
  const rise = thick * (2.2 + weight * 2.6);
  const y = a.eaveY;
  // Tay vịn: bốn thanh quanh mép. Đây là phần KHÔNG được cắt — bỏ nó thì cái lan can biến mất.
  for (const side of [-1, 1]) {
    out.push(prism({
      x: a.x, z: a.z + (side * a.rd) / 2, y: y + rise, w: a.rw, d: thick, h: thick, sides: 4, role: 'trim',
    }));
    out.push(prism({
      x: a.x + (side * a.rw) / 2, z: a.z, y: y + rise, w: thick, d: a.rd, h: thick, sides: 4, role: 'trim',
    }));
  }
  const postW = thick * 1.5;
  // ⚠️ TRỤ GÓC ĐI TRƯỚC, VÀ NÓ KHÔNG PHẢI TRANG TRÍ. Tay vịn ở hai cạnh ±x không có gì đỡ bên dưới
  // nên nó lơ lửng trên mép mái — đo ra khoảng 2 điểm ảnh ở tỉ lệ bản quét, đủ để mắt đọc thành
  // "một cái khung dán lên". Bốn trụ góc là số khối ít nhất chữa được điều đó, và ngoài đời lan
  // can nào cũng bắt đầu từ trụ góc rồi mới chia nhịp con tiện vào giữa.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      out.push(prism({
        x: a.x + (sx * a.rw) / 2, z: a.z + (sz * a.rd) / 2, y,
        w: postW * 1.25, d: postW * 1.25, h: rise, sides: 4, role: 'stone',
      }));
    }
  }
  if (plain) return;
  // Con tiện — thứ phải TIỆN TỪNG CÁI, nên chỉ công trình chính mới có.
  //
  // ⚠️ SỐ CON TIỆN ĐI THEO `crownWeight`, không phải theo mình bề ngang mái. `crownWeight` là "cái
  // đường nét này đậm tới đâu", nên nó phải quyết định CẢ độ cao lẫn độ dày nhịp — nếu không thì
  // vành kính mảnh 0,5 của Marina Bay và lan can đá 1,2 của điện Panthéon ra cùng một số con tiện,
  // tức một trục của bảng bị nuốt mất trong im lặng (đúng bẫy `MIN_STONE` ở Phase 9D). Dưới hai
  // cái thì thôi hẳn: một vành kính hiện đại vốn KHÔNG có con tiện nào, và đó là câu trả lời đúng
  // chứ không phải chỗ trống.
  const n = clamp(Math.floor((a.rw * weight) / (postW * 3.4)), 0, BALUSTER_MAX);
  if (n < 2) return;
  for (const side of [-1, 1]) {
    for (const off of spreadOffsets(n, a.rw * 0.82)) {
      out.push(prism({
        x: a.x + off, z: a.z + (side * a.rd) / 2, y, w: postW, d: postW, h: rise,
        sides: 6, taper: 0.72, role: 'stone',
      }));
    }
  }
}

// ─── THỨ NHÔ LÊN KHỎI MÁI ────────────────────────────────────────────────────

/**
 * Bó cọc buộc ở đỉnh nón tranh.
 *
 * ⚠️ HAI CÁCH XẾP, VÀ CÁI THỨ HAI KHÔNG PHẢI ĐỂ CHIỀU BÀI TEST. Nhà thường: ba cọc lệch nhau, mỗi
 * cọc một chiều cao — đúng một bó lạt buộc tay. Kỳ quan: **bốn cọc trên hai trục, đối xứng tuyệt
 * đối**, vì kỳ quan đứng giữa thành phố và cả bố cục tựa vào nó (`archetype.symmetric`, ADR-007).
 * Ngoài đời cũng đúng như vậy: cái chóp lợp của một ngôi nhà cộng đồng được làm cho ngay ngắn,
 * còn cái chóp của một túp lều thì buộc sao cho chặt là được.
 */
function emitCrossPoles(out, a, ctx) {
  const { at, sym } = ctx;
  const poleW = Math.max(0.014, a.rw * 0.028);
  const rise = Math.max(0.06, a.rw * 0.22);
  // ⚠️ Kỳ quan: `ry` phải là 0 CHỨ KHÔNG PHẢI "một góc nào đó cân đối". Bài `kỳ quan luôn đối xứng
  // tuyệt đối` đòi mọi khối kết cấu của kỳ quan kỷ 1 có `ry === 0`, và nó đòi đúng — kỷ 1 là kỷ có
  // nét vẽ thô nhất (`rough` 0,9), nên nếu chỗ nào được phép xoay thì chính chỗ đó sẽ xoay.
  const dirs = sym
    ? [[1, 0], [-1, 0], [0, 1], [0, -1]]
    : [0, 1, 2].map((i) => [Math.cos((i / 3) * Math.PI * 2), Math.sin((i / 3) * Math.PI * 2)]);
  dirs.forEach(([dx, dz], i) => {
    // Hạt giống lấy theo KHOẢNG CÁCH tới trục, nên hai cọc soi gương nhau nhận cùng một chiều cao.
    const k = sym ? `pole${Math.abs(dx)}` : `pole${i}`;
    const lean = poleW * (1.6 + at(k, 0) * 1.4);
    out.push(prism({
      x: a.x + dx * lean, z: a.z + dz * lean,
      y: a.apexY - rise * 0.35, w: poleW, d: poleW,
      h: rise * (0.8 + at(`${k}h`, 0) * 0.45), sides: 4, taper: 0.6,
      ry: sym ? 0 : Math.atan2(dz, dx), role: 'wood',
    }));
  });
  // Vòng lạt buộc — thứ giữ cả bó lại, và là chỗ bắt sáng làm cái bó đọc ra là một vật.
  out.push(prism({
    x: a.x, z: a.z, y: a.apexY - rise * 0.1, w: poleW * 4, d: poleW * 4,
    h: poleW * 1.2, sides: 6, role: 'wood',
  }));
}

/** Cửa sập lên mái: cổ áo xây quanh miệng lỗ + thang thò lên. */
function emitRoofHatch(out, a, ctx) {
  const { plain, lateral } = ctx;
  const w = stackWidth(a.deck.w);
  if (!w) return;
  const off = lateral('hatch', a.deck.w * 0.4);
  out.push(prism({ x: a.deck.x + off, z: a.deck.z, y: a.deck.y, w, d: w, h: w * 0.34, sides: 4, role: 'trim' }));
  out.push(prism({
    x: a.deck.x + off, z: a.deck.z, y: a.deck.y + w * 0.34, w: w * 0.72, d: w * 0.72,
    h: w * 0.08, sides: 4, role: 'dark',
  }));
  const railW = Math.max(0.012, w * 0.11);
  const posts = plain ? 1 : 2;
  for (const po of spreadOffsets(posts, w * 0.9)) {
    out.push(prism({
      x: a.deck.x + off + po, z: a.deck.z - w * 0.3,
      y: a.deck.y, w: railW, d: railW, h: w * 1.1, sides: 4, role: 'wood',
    }));
  }
}

/** Giàn phơi: hai cọc + sào ngang + tấm vải rủ. */
function emitDryingRack(out, a, ctx) {
  const { plain, at, lateral, spin } = ctx;
  const w = stackWidth(a.deck.w, 0.42, 0.62);
  if (!w) return;
  const postW = Math.max(0.012, w * 0.075);
  const tall = w * 0.62;
  const off = lateral('rack', Math.max(0, a.deck.w - w) * 0.7);
  const ry = spin((at('rackry', 0) - 0.5) * 1.0);
  const cos = Math.cos(ry);
  const sin = Math.sin(ry);
  for (const side of [-1, 1]) {
    out.push(prism({
      x: a.deck.x + off + (side * (w / 2)) * cos, z: a.deck.z - (side * (w / 2)) * sin,
      y: a.deck.y, w: postW, d: postW, h: tall, sides: 4, role: 'wood',
    }));
  }
  out.push(prism({
    x: a.deck.x + off, z: a.deck.z, y: a.deck.y + tall - postW,
    w, d: postW, h: postW, sides: 4, ry, role: 'wood',
  }));
  // Tấm vải rủ — thứ duy nhất nói cho mắt biết đây là chỗ phơi chứ không phải một cái khung.
  const sheets = plain ? 1 : 2;
  spreadOffsets(sheets, w * 0.84).forEach((so, i) => {
    // Khoá lấy theo cặp soi gương (`min(i, n−1−i)`) để hai tấm hai bên rủ bằng nhau ở kỳ quan.
    const drop = tall * (0.4 + at(`sheet${sym0(i, sheets)}`, 0) * 0.3);
    out.push(prism({
      x: a.deck.x + off + so, z: a.deck.z,
      y: a.deck.y + tall - postW - drop, w: w * 0.32, d: postW * 0.6, h: drop,
      sides: 4, ry, role: 'trim',
    }));
  });
}

/** Chỉ số của cặp soi gương: phần tử thứ `i` và thứ `n−1−i` dùng chung một hạt giống. */
function sym0(i, n) {
  return Math.min(i, n - 1 - i);
}

/** Ống khói xây + mũ chụp. */
function emitChimney(out, a, ctx) {
  const { plain, count, at } = ctx;
  const w = stackWidth(a.rw);
  if (!w) return;
  const n = stackSlots(a.rw * 0.8, w, count);
  if (!n) return;
  const tall = w * CHIMNEY_TALL * (plain ? 0.82 : 1);
  // ⚠️ Ống khói mọc từ ĐỈNH TƯỜNG chứ không từ mặt mái: nó là một cột xây liền với tường, xuyên
  // qua mái. Đặt nó trên mặt mái thì ở mái dốc nó sẽ lơ lửng.
  const y = a.eaveY;
  for (const off of spreadOffsets(n, a.rw * 0.62)) {
    const jitter = 0.86 + at('chim', off) * 0.28;
    const h = Math.max(a.apexY - a.eaveY, 0) + tall * jitter;
    out.push(prism({ x: a.x + off, z: a.z - a.rd * 0.18, y, w, d: w * 0.78, h, sides: 4, role: 'trim' }));
    out.push(prism({
      x: a.x + off, z: a.z - a.rd * 0.18, y: y + h, w: w * 1.3, d: w * 1.05,
      h: w * 0.24, sides: 4, role: 'stone',
    }));
  }
}

/** Cửa sổ mái (lucarne / trapeira / Gaube): hộp khoét vào mặt dốc, có mái riêng và một ô kính. */
function emitDormer(out, a, ctx) {
  const { plain, count, at } = ctx;
  const w = stackWidth(a.rw, 0.2, 0.3);
  if (!w) return;
  const n = stackSlots(a.rw * 0.82, w, count);
  if (!n) return;
  const rise = Math.max(a.apexY - a.eaveY, w * 0.6);
  const h = w * 1.05;
  const y = a.eaveY + rise * 0.22;
  const z = a.z + a.rd * 0.28;
  for (const off of spreadOffsets(n, a.rw * 0.72)) {
    out.push(prism({ x: a.x + off, z, y, w, d: w * 0.72, h, sides: 4, role: 'trim' }));
    out.push(prism({
      x: a.x + off, z: z + w * 0.36, y: y + h * 0.18, w: w * 0.58, d: w * 0.06,
      h: h * 0.58, sides: 4, role: 'glass',
    }));
    if (plain) continue;
    // Mái con của chính cái cửa sổ mái — nẹp che nước, chỉ công trình chính mới có.
    out.push(prism({
      x: a.x + off, z, y: y + h, w: w * 1.24, d: w * 0.92,
      h: w * (0.2 + at('dorm', off) * 0.1), sides: 4, taper: 0.4, role: 'roof',
    }));
  }
}

/** Bồn nước gỗ đai sắt trên bốn chân — mái nhà New York. */
function emitTank(out, a, ctx) {
  const { plain, count, at } = ctx;
  const w = stackWidth(a.deck.w, 0.34, 0.48);
  if (!w) return;
  const n = stackSlots(a.deck.w, w, count);
  if (!n) return;
  const legH = w * 0.38;
  const bodyH = w * TANK_TALL;
  const legW = Math.max(0.011, w * 0.1);
  for (const off of spreadOffsets(n, a.deck.w * 0.72)) {
    const cx = a.deck.x + off;
    const cz = a.deck.z + (at('tankz', off) - 0.5) * a.deck.d * 0.24;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        out.push(prism({
          x: cx + sx * w * 0.3, z: cz + sz * w * 0.3, y: a.deck.y,
          w: legW, d: legW, h: legH, sides: 4, role: 'wood',
        }));
      }
    }
    out.push(prism({
      x: cx, z: cz, y: a.deck.y + legH, w, d: w, h: bodyH, sides: 8, taper: 0.94, role: 'wood',
    }));
    if (plain) continue;
    // Đai sắt — hai vòng thít quanh thùng. Bỏ ở nhà dân (ngân sách LOD phải cắn).
    for (const t of [0.28, 0.7]) {
      out.push(prism({
        x: cx, z: cz, y: a.deck.y + legH + bodyH * t, w: w * 1.05, d: w * 1.05,
        h: bodyH * 0.07, sides: 8, role: 'trim',
      }));
    }
  }
}

/** Buồng máy thang — khối vuông vức nhô lên giữa mái bằng. */
function emitLiftHouse(out, a, ctx) {
  const { plain, lateral } = ctx;
  const w = stackWidth(a.deck.w, 0.34, 0.48);
  if (!w) return;
  const h = w * LIFT_TALL;
  const cx = a.deck.x + lateral('lift', Math.max(0, a.deck.w - w) * 0.5);
  out.push(prism({ x: cx, z: a.deck.z, y: a.deck.y, w, d: w * 0.86, h, sides: 4, role: 'trim' }));
  out.push(prism({
    x: cx, z: a.deck.z, y: a.deck.y + h, w: w * 1.1, d: w * 0.96, h: w * 0.12, sides: 4, role: 'roof',
  }));
  if (plain) return;
  // Cửa thông gió trên vách buồng máy — chi tiết nhỏ nhưng nó nói cho mắt biết đây là buồng MÁY.
  out.push(prism({
    x: cx, z: a.deck.z + w * 0.44, y: a.deck.y + h * 0.45, w: w * 0.5, d: w * 0.05,
    h: h * 0.3, sides: 4, role: 'dark',
  }));
}

/** Cột ăng-ten: cột mảnh + hai thanh ngang. */
function emitMast(out, a, ctx) {
  const { count, at, spin } = ctx;
  const w = Math.max(0.014, a.deck.w * MAST_W_RATIO);
  const n = stackSlots(a.deck.w, w * 6, count);
  if (!n) return;
  for (const off of spreadOffsets(n, a.deck.w * 0.66)) {
    const cx = a.deck.x + off;
    const tall = w * MAST_TALL * (0.8 + at('mast', off) * 0.5);
    out.push(prism({ x: cx, z: a.deck.z, y: a.deck.y, w, d: w, h: tall, sides: 4, taper: 0.6, role: 'dark' }));
    for (const t of [0.55, 0.8]) {
      out.push(prism({
        x: cx, z: a.deck.z, y: a.deck.y + tall * t, w: w * 5.5, d: w * 0.7, h: w * 0.7,
        sides: 4, ry: spin(at(`arm${t}`, off) * Math.PI), role: 'dark',
      }));
    }
  }
}

/** Cục nóng điều hoà: hộp bẹt có mặt lưới, xếp thành hàng. */
function emitCondenser(out, a, ctx) {
  const { count, at } = ctx;
  const w = stackWidth(a.deck.w, 0.2, 0.3);
  if (!w) return;
  const n = stackSlots(a.deck.w, w, count);
  if (!n) return;
  const h = w * CONDENSER_TALL;
  for (const off of spreadOffsets(n, a.deck.w * 0.82)) {
    const cz = a.deck.z + (at('cond', off) - 0.5) * a.deck.d * 0.3;
    out.push(prism({ x: a.deck.x + off, z: cz, y: a.deck.y, w, d: w * 0.66, h, sides: 4, role: 'trim' }));
    out.push(prism({
      x: a.deck.x + off, z: cz + w * 0.34, y: a.deck.y + h * 0.18, w: w * 0.72, d: w * 0.05,
      h: h * 0.6, sides: 4, role: 'dark',
    }));
  }
}

/** Bồn cây sân thượng: bồn + hai thuỳ lá. */
function emitPlanter(out, a, ctx) {
  const { plain, count, at, spin } = ctx;
  const w = stackWidth(a.deck.w, 0.26, 0.4);
  if (!w) return;
  const n = stackSlots(a.deck.w, w, count);
  if (!n) return;
  const trough = w * 0.34;
  for (const off of spreadOffsets(n, a.deck.w * 0.78)) {
    const cx = a.deck.x + off;
    const cz = a.deck.z + (at('plan', off) - 0.5) * a.deck.d * 0.28;
    out.push(prism({ x: cx, z: cz, y: a.deck.y, w, d: w * 0.6, h: trough, sides: 4, role: 'trim' }));
    const lobes = plain ? 1 : 2;
    spreadOffsets(lobes, w * 0.68).forEach((lo, i) => {
      // ⚠️ `off` PHẢI ĐI QUA THAM SỐ THỨ HAI CỦA `at`, TUYỆT ĐỐI KHÔNG ĐƯỢC NHÉT VÀO CHUỖI KHOÁ.
      // Bản đầu viết `` `lobe${sym0(i, lobes)}|${off.toFixed(4)}` `` rồi gọi `at(k, 0)`. Trông vô
      // hại, và nó **vô hiệu hoá cái nút bịt đối xứng** đặt ở `emitRooftop`: phép lấy `|off|` chỉ
      // áp cho tham số thứ hai, nên hai bồn cây soi gương nhau ở `off = ±0,2` nhận hai khoá KHÁC
      // NHAU ⇒ hai bụi cây to nhỏ khác nhau ⇒ kỳ quan lệch. Đúng cái chú thích ở `emitRooftop` đã
      // cảnh báo (*"bịt mười lăm chỗ thì chỗ thứ mười sáu viết sau này sẽ quên"*) — và chỗ thứ mười
      // sáu ấy được viết ngay trong file này, dưới chính câu cảnh báo đó.
      // ⚠️ Lỗi này KHÔNG lộ ra ở kỷ 15 (kỷ duy nhất cho kỳ quan đội bồn cây): mái nó chỉ nhét vừa
      // MỘT bồn, mà một bồn thì `off = 0` nên khoá tự cân. Cần một bài test duyệt CẢ 6 × 11 tổ hợp
      // mới thấy — xem `rooftop.test.js`.
      const k = `lobe${sym0(i, lobes)}`;
      const lw = w * (0.5 + at(k, off) * 0.3);
      out.push(prism({
        x: cx + lo, z: cz, y: a.deck.y + trough * 0.85, w: lw, d: lw * 0.8,
        h: lw * (0.8 + at(`${k}h`, off) * 0.5),
        sides: 6, taper: 0.5, ry: spin(at(`${k}r`, off) * Math.PI), role: 'leaf',
      }));
    });
  }
}

const CROWN_EMIT = {
  beamEnds: emitBeamEnds,
  barrel: emitBarrel,
  ridge: emitRidgeBeam,
  upturn: emitUpturn,
  balustrade: emitBalustrade,
};

const STACK_EMIT = {
  crossPoles: emitCrossPoles,
  roofHatch: emitRoofHatch,
  dryingRack: emitDryingRack,
  chimney: emitChimney,
  dormer: emitDormer,
  tank: emitTank,
  liftHouse: emitLiftHouse,
  mast: emitMast,
  condenser: emitCondenser,
  planter: emitPlanter,
};

/** Thứ nào BẮT BUỘC phải có mặt bằng đứng được. Thiếu `deck` thì bỏ qua, KHÔNG dựng bừa. */
const NEEDS_DECK = new Set(['roofHatch', 'dryingRack', 'tank', 'liftHouse', 'mast', 'condenser', 'planter']);

/**
 * Dựng phần trên mái cho MỘT mảng nhà.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ `symmetric` KHÔNG PHẢI MỘT TUỲ CHỌN — NÓ LÀ MỘT BẤT BIẾN CỦA KỲ QUAN, VÀ BÀI TEST ĐÃ DẠY LẠI
 * TÔI ĐIỀU ĐÓ NGAY TRONG PHASE NÀY.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Bản đầu của file này rắc mọi thứ theo hạt giống — bó cọc quay ba hướng, cửa sập lệch sang một
 * bên, cột ăng-ten xoay tự do. Hai bài test có sẵn (`kỳ quan luôn đối xứng tuyệt đối` và `CHỮ KÝ:
 * kỳ quan của MỌI kỷ vẫn đối xứng tuyệt đối`) **ĐỎ NGAY**, và chúng đỏ đúng: `archetype.symmetric`
 * là lời hứa rằng công trình trung tâm cân tuyệt đối, vì cả bố cục thành phố tựa vào nó (ADR-007).
 * Ngoài đời cũng vậy — cái chóp lợp của một ngôi nhà cộng đồng được làm ngay ngắn, còn cái chóp
 * của một túp lều thì buộc sao cho chặt là được.
 *
 * Ba lối rò rỉ mất đối xứng, và cả ba đều được bịt Ở ĐÂY chứ không bịt trong từng hàm dựng — bịt
 * mười lăm chỗ thì chỗ thứ mười sáu viết sau này sẽ quên:
 *   `at(k, off)`      hạt giống theo VỊ TRÍ. Khi đối xứng thì khoá lấy theo `|off|`, nên hai khối
 *                     soi gương nhau nhận cùng một con số ngẫu nhiên.
 *   `lateral(k, span)` độ lệch ngang của một vật ĐƠN LẺ. Khi đối xứng thì bằng 0 — một cái buồng
 *                     thang lệch sang trái là một kỳ quan lệch sang trái.
 *   `spin(v)`         góc xoay tự do. Khi đối xứng thì bằng 0.
 * Và khoá hạt giống bỏ luôn chỉ số mảng nhà, thay bằng `|x|` — nếu không thì hai mảng nhà soi
 * gương nhau của cùng một kỳ quan vẫn nhận hai bộ số khác nhau.
 *
 * @param {Array}  out   danh sách khối, ghi thêm vào
 * @param {object} rs    một dòng `ROOF_STYLES` (`roofStyle.js`)
 * @param {object} a     `RoofAnchors` do `emitRoof` TRẢ VỀ — xem chú thích đầu file về việc vì sao
 *                       file này tuyệt đối không tự tính lại hình dạng mái
 * @param {object} ctx
 * @param {string} ctx.bpId      hạt giống
 * @param {number} ctx.index     thứ tự mảng nhà trong công trình
 * @param {boolean} ctx.plain    true = nhà dân (ngân sách chi tiết thấp hơn)
 * @param {boolean} ctx.symmetric true = kỳ quan: cân tuyệt đối qua mặt phẳng x = 0
 * @returns {boolean} có dựng được gì không
 */
export function emitRooftop(out, rs, a, ctx = {}) {
  if (!isValidRoofStyle(rs) || !a) return false;
  const { bpId = 'bp', index = 0, plain = false, symmetric = false } = ctx;
  if (!(a.rw > 0) || !(a.rd > 0)) return false;
  // ⚠️ Mảng nhà quá nhỏ thì KHÔNG có gì trên mái — xem khối chú thích đầu file. Không thu nhỏ tiếp.
  if (Math.min(a.rw, a.rd) < ROOFTOP_MIN_SPAN) return false;

  const sym = Boolean(symmetric);
  const key = sym
    ? `${bpId}|rt|${Math.abs(a.x).toFixed(4)}|${a.z.toFixed(4)}`
    : `${bpId}|rt${index}`;
  const at = (k, off) => unit(`${key}|${k}|${(sym ? Math.abs(off) : off).toFixed(4)}`);
  const inner = {
    x: a.x, z: a.z, w: a.rw, d: a.rd, plain, sym, at,
    weight: Math.max(0, finite(rs.crownWeight, 0)),
    count: rs.stackCount,
    lateral: (k, span) => (sym ? 0 : (at(k, 0) - 0.5) * span),
    spin: (v) => (sym ? 0 : v),
  };

  const before = out.length;
  const crown = plain ? rs.vernacularCrown : rs.crown;
  const crownFn = CROWN_EMIT[crown];
  if (crownFn && inner.weight > 0) crownFn(out, a, inner);

  const stack = plain ? rs.vernacularStack : rs.stack;
  const stackFn = STACK_EMIT[stack];
  if (stackFn && (!NEEDS_DECK.has(stack) || a.deck)) stackFn(out, a, inner);

  return out.length > before;
}
