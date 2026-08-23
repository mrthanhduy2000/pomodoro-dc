/**
 * humanPose.js — TƯ THẾ tại một thời điểm. Trả về chỗ đặt và góc của từng khớp.
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ NHỊP BƯỚC SUY TỪ QUÃNG ĐƯỜNG ĐÃ ĐI, KHÔNG SUY TỪ THỜI GIAN — VÀ ĐÂY LÀ CẢ BÀI TOÁN
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Cám dỗ là viết `góc = sin(t × k)`: một dòng, chạy được, trông có vẻ đi. Nó sai theo một cách rất
 * khó thấy — mỗi cư dân có `speed` riêng (`buildResidentRoute` nhân một hệ số 0,75 tới 1,25 để cả
 * thành phố không thành đoàn diễu hành), nên một nhịp chân theo THỜI GIAN sẽ khớp tốc độ của đúng
 * một người và **trượt** ở 27 người còn lại. Bàn chân sẽ quét trên mặt đường như trượt patin, và
 * đó là loại lỗi mắt bắt ra ngay nhưng miệng không gọi tên được.
 *
 * ⇒ Hàm này nhận `travelled` (quãng đường đã đi, đơn vị ô) chứ không nhận `t`.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ ĐỘNG HỌC NGƯỢC (2026-08-25, ADR-057) — ĐỔI CHIỀU NHÂN QUẢ CỦA CẢ FILE NÀY
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Mọi bản trước làm theo chiều THUẬN: khai góc hông → suy ra bàn chân rơi đâu. Chiều ấy đẻ ra ba
 * hệ quả, và cả ba đều được ghi lại như những ràng buộc bất khả kháng:
 *   · chân phải là MỘT khối cứng, vì thêm một khớp gối nghĩa là thêm một ẩn không giải được;
 *   · cái hông KHÔNG được dịch ngang, vì bàn chân sẽ trượt theo (3 tới 4 điểm ảnh với kiểu `roll`);
 *   · đai hông KHÔNG được xoay, hoặc phải TRỪ tay đúng đoạn hông vừa xoay khỏi độ dịch bàn chân.
 *
 * Bản này đảo chiều: **khai CHỖ ĐẶT BÀN CHÂN trước, rồi giải ngược ra góc đùi và góc gối** (luật
 * cô-sin trên tam giác đùi–cẳng–đường-nối). Cả ba ràng buộc trên **bốc hơi cùng một lúc**, và
 * chúng bốc hơi vì cùng MỘT lý do: bàn chân nay là ĐẦU VÀO của bài toán, nên không có cách nào để
 * nó bị đặt sai chỗ. Hông muốn dịch ngang bao nhiêu, xoay bao nhiêu, nhún bao nhiêu cũng được —
 * cái chân tự tìm lại đúng bàn chân đã khai, y như người thật.
 *
 * ⚠️ VÀ KHÔNG CÓ MỘT SỐ HẠNG BÙ NÀO TRONG FILE NÀY. Nếu ngày nào bạn thấy mình đang viết một phép
 * trừ để "bù lại chỗ hông vừa xoay", nghĩa là một chỗ nào đó đã tuột về chiều thuận — đó chính là
 * dấu hiệu sớm nhất, và nó đáng để dừng lại đọc kỹ hơn là đi tinh chỉnh con số.
 *
 * ⚠️ CÁI NHÚN VẪN LÀ HỆ QUẢ, KHÔNG PHẢI MỘT HÀM SIN RIÊNG. Chiều cao hông được suy từ chân TRỤ:
 * `hipY = √(legLen² − off²) × (1 − flex)`. Vế đầu là hình học (chân nghiêng thì hông thấp xuống),
 * vế sau là gối chùng. Thêm một hàm sin riêng cho cái nhún là tạo ra một luật thứ hai cho cùng một
 * chuyện, rồi hai luật ấy sẽ lệch pha nhau vào ngày có ai chỉnh `stride`.
 *
 * ⚠️ VÀ CHÍNH CÔNG THỨC ẤY BẢO ĐẢM BÀI TOÁN LUÔN GIẢI ĐƯỢC. Khoảng cách hông↔bàn chân trong mặt
 * phẳng đứng là `√(off² + hipY²) = legLen·√(sin²α + (1−flex)²cos²α) ≤ legLen` với mọi `flex ≥ 0`.
 * Tức tầm với của chân KHÔNG BAO GIỜ bị vượt vì lý do trước-sau; phần dự trữ còn lại
 * (`legLen² − …` = `(legLen²−off²)·flex(2−flex)`) chính là thứ trả tiền cho độ dịch NGANG của hông.
 * `humanGait.test.js` đo tỉ số tầm với thật ở đủ 14 kiểu × 15 kỷ để con số ấy không bao giờ là một
 * lời hứa suông.
 */

import { humanDims } from './human';
import { gaitOf, PELVIS_TWIST_RAD, THORAX_TWIST_RAD } from './humanGait';

/** Gói một số thực về [0, 1). */
function wrap01(v) {
  const w = v % 1;
  return w < 0 ? w + 1 : w;
}

function clamp(v, lo, hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

/** Tay đang cầm đồ chỉ còn vung bằng ngần này lần tay không. Xem chú thích trong `poseAt`. */
const CARRY_ARM_DAMP = 0.2;

/**
 * Khuỷu tay gập sẵn bấy nhiêu radian ngay cả khi tay buông thõng (≈ 9°), rồi gập thêm `ELBOW_GAIN`
 * lần phần tay đưa RA TRƯỚC. Người thật đi bộ gập khuỷu 20 tới 60°, sâu nhất lúc tay ở phía trước.
 * ⚠️ CHỈ GẬP THÊM KHI TAY RA TRƯỚC, không gập khi tay ra sau — khuỷu chỉ có một chiều gập, và một
 * cẳng tay duỗi ngược ra sau đọc ra ngay là gãy tay.
 * ⚠️ EXPORT vì `humanPose.test.js` canh dải gập khuỷu bằng chính hai con số này. Chép tay sang bên
 * test là "một luật hai công thức" — chúng sẽ trôi khỏi nhau và bài test vẫn xanh.
 */
export const ELBOW_REST_RAD = 0.16;
export const ELBOW_GAIN = 0.9;

/** Hai tay hơi dạng ra ngoài để cẳng tay không xuyên qua sườn. ≈ 6,3°. */
const ARM_SPLAY_RAD = 0.11;

/** Đai hông nghiêng tối đa bấy nhiêu radian khi `sway` chạm trần bảng (≈ 5,2°, đúng dải người thật). */
const PELVIS_LIST_RAD = 0.09;

/** Thân trên nghiêng ngược lại bấy nhiêu radian để cái đầu bớt lắc theo hông. */
const TRUNK_COUNTER_RAD = 0.12;

/**
 * XOAY MỘT ĐỘ LỆCH QUANH MỘT KHỚP — **một hàm, một chỗ khai, bốn chỗ đọc.**
 *
 * `a` quay quanh trục z cục bộ (mặt phẳng đứng dọc theo hướng đi: đưa chân ra trước / ra sau).
 * `b` quay quanh trục x cục bộ (trục ĐI TỚI: dạng chân ra ngoài / khép vào, nghiêng thân sang bên).
 * Thứ tự cố định: **`Rx(b) · Rz(a)`** — nghiêng trước-sau xong rồi mới lật cả mặt phẳng ấy sang bên.
 *
 * ⚠️ `sceneGraph.js` PHẢI GHÉP QUATERNION THEO ĐÚNG THỨ TỰ NÀY (`Rz` rồi `premultiply` `Rx`). Hai
 * bên là hai công thức cho cùng một luật, và dự án đã trả giá đúng chỗ đó (`sweep-score.mjs` chép
 * lệch một mặc định của `city-preview.mjs` rồi in ra cả một bộ số bịa, Phase 4G). Cái giữ chúng
 * khỏi trôi là bài đối chiếu chéo trong `sceneGraphWiring.test.js`: nó dựng cảnh thật rồi so từng
 * toạ độ với `partCenterAt`.
 */
export function rotateByJoint(a, b, v) {
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const cb = Math.cos(b);
  const sb = Math.sin(b);
  const x = v.x * ca - v.y * sa;
  const y0 = v.x * sa + v.y * ca;
  const z0 = v.z;
  return { x, y: y0 * cb - z0 * sb, z: y0 * sb + z0 * cb };
}

/**
 * Độ dịch của BÀN CHÂN so với trục hông, theo hướng đi, ở một pha `p` của chu kỳ.
 *
 * `cycle` là quãng đường thân đi được trong MỘT chu kỳ trọn vẹn của một chân.
 * Nửa đầu (p < 0,5) là TIẾP ĐẤT, nửa sau là ĐƯA CHÂN.
 *
 * ⚠️ Vì sao biên độ là `cycle / 4` chứ không phải `cycle / 2`: trong pha tiếp đất (nửa chu kỳ),
 * thân chỉ tiến được `cycle / 2`, nên bàn chân chỉ lùi được `cycle / 2` so với hông — tức từ
 * `+cycle/4` tới `-cycle/4`. Đặt biên độ `cycle/2` thì chân phải lùi gấp đôi tốc độ thân và bài
 * test cắm chân sẽ đỏ (đã thử: nó đỏ đúng như vậy).
 */
export function footOffsetAt(p, cycle) {
  const half = cycle * 0.25;
  if (p < 0.5) {
    // TIẾP ĐẤT — thẳng theo quãng đường, đó là điều kiện để bàn chân đứng yên trong thế giới.
    return half - p * cycle;
  }
  // ĐƯA CHÂN — đưa từ sau ra trước bằng một đường cong có đạo hàm bằng 0 ở HAI đầu, nên chỗ nối
  // với pha tiếp đất không gãy khúc. Chân người thật cũng dừng lại một nhịp trước khi chạm đất.
  const u = (p - 0.5) * 2;
  return -half + cycle * 0.5 * ((1 - Math.cos(Math.PI * u)) * 0.5);
}

/**
 * BÀN CHÂN NHẤC CAO BAO NHIÊU ở pha `p`. Pha tiếp đất trả về **đúng 0** — đó là định nghĩa của
 * "đang chạm đất", và mọi bài test cắm chân dựa vào con số 0 ấy chứ không dựa vào một dung sai.
 *
 * ⚠️ HAI ĐẦU PHA ĐƯA CHÂN CŨNG PHẢI VỀ ĐÚNG 0, nếu không thì lúc bàn chân đặt xuống nó vẫn còn
 * lơ lửng rồi "nhảy" xuống đất giữa hai khung hình. `sin(πu)` cho đúng điều đó: bằng 0 ở u = 0 và
 * u = 1, cao nhất ở giữa, và đạo hàm ở hai đầu khác 0 nên bàn chân đáp xuống DỨT KHOÁT chứ không
 * bồng bềnh — đúng cách người ta đặt chân.
 */
export function footLiftAt(p, height) {
  if (p < 0.5) return 0;
  return height * Math.sin(Math.PI * (p - 0.5) * 2);
}

/**
 * ĐỘNG HỌC NGƯỢC HAI ĐOẠN — cho một khớp gốc và một đầu mút cần với tới, trả về góc của đoạn TRÊN,
 * góc của đoạn DƯỚI, chỗ đặt khớp GIỮA, và tỉ số tầm với đã dùng.
 *
 * ⚠️ KHỚP GIỮA CHĨA RA **TRƯỚC** (`psi + alpha`, không phải `psi − alpha`). Đó là chiều gập của
 * đầu gối người: gối nhô ra trước, cẳng chân hất về sau. Chọn dấu kia cho ra một cái chân gập
 * ngược như chân chim — hình học vẫn hợp lệ, không có gì đỏ lên, và trông sai ngay lập tức.
 *
 * ⚠️ `voi` LÀ MỘT SỐ ĐO ĐƯỢC TRẢ RA NGOÀI, KHÔNG PHẢI MỘT PHÉP KẸP IM LẶNG. Nếu nó chạm 1 thì chi
 * đang phải duỗi thẳng đơ để với tới đích, tức bảng dáng đi đã khai một thứ cơ thể không làm được.
 * Trả nó ra để bài test đo được thay vì để nó lặng lẽ bị `acos` kẹp về 0 — một phép kẹp im lặng ở
 * đây chính là hình dạng của mọi cái phễu mà dự án đã trả giá (Phase 9A).
 */
export function solveTwoBone(joint, target, l1, l2) {
  const vx = target.x - joint.x;
  const vy = target.y - joint.y;
  const vz = target.z - joint.z;
  // Mặt phẳng của chi được xác định bởi trục ĐI TỚI và đường nối khớp → đích. `b` là góc lật của
  // mặt phẳng ấy quanh trục đi tới.
  const b = Math.atan2(-vz, -vy);
  const p = Math.hypot(vy, vz);
  const reach = l1 + l2;
  const d = Math.hypot(vx, p);
  const voi = reach > 0 ? d / reach : 0;
  const dc = Math.min(d, reach * 0.999);
  const psi = Math.atan2(vx, p);
  const cosA = dc > 0 ? (dc * dc + l1 * l1 - l2 * l2) / (2 * dc * l1) : 1;
  const alpha = Math.acos(clamp(cosA, -1, 1));
  const a1 = psi + alpha;
  // Đầu mút của đoạn trên, TRONG MẶT PHẲNG chi (trục ngang = hướng đi, trục dọc = xuống).
  const kx = l1 * Math.sin(a1);
  const ky = -l1 * Math.cos(a1);
  const tx = dc * Math.sin(psi);
  const ty = -dc * Math.cos(psi);
  const a2 = Math.atan2(tx - kx, -(ty - ky));
  const mid = rotateByJoint(a1, b, { x: 0, y: -l1, z: 0 });
  return {
    a1,
    a2,
    b,
    voi,
    mid: { x: joint.x + mid.x, y: joint.y + mid.y, z: joint.z + mid.z },
  };
}

/**
 * Tư thế của một cư dân sau khi đã đi được `travelled` ô.
 *
 * ⚠️ QUY ƯỚC DẤU — đọc kỹ, nó KHÔNG đối xứng và đó là hình học chứ không phải nhầm lẫn.
 * Mọi góc trả về là góc THÔ để đưa thẳng vào `rotateByJoint`, tức `sceneGraph.js` không phải suy
 * diễn gì thêm. Với một chi CHĨA XUỐNG (chân, tay), `a` dương đưa đầu mút RA TRƯỚC. Với thân CHĨA
 * LÊN, cùng phép xoay ấy lại đưa đỉnh RA SAU — nên độ khom `stance` vào đây với dấu ÂM. Bài test
 * kiểm bằng TOẠ ĐỘ THẾ GIỚI của bàn chân, không kiểm bằng dấu của góc, đúng vì lý do này.
 *
 * @param {{style:object, dims:object}} body  kết quả `buildHumanBody`
 * @param {number} travelled                  quãng đường đã đi, đơn vị ô
 * @returns {{bob:number, cycle:number, phase:number, reach:number, joints:object}}
 */
export function poseAt(body, travelled) {
  const style = body?.style;
  const d = body?.dims ?? (style ? humanDims(style) : null);
  if (!style || !d) return null;

  const g = gaitOf(style.gait);
  const dist = Number.isFinite(travelled) ? travelled : 0;
  /** Quãng đường thân đi được trong một chu kỳ chân = sải chân × chiều dài chân. */
  const cycle = style.stride * d.legLen;
  const phase = cycle > 0 ? wrap01(dist / cycle) : 0;
  const phaseR = wrap01(phase + 0.5);
  const turn = Math.PI * 2 * phase;

  // ── CHỖ ĐẶT HAI BÀN CHÂN — ĐẦU VÀO CỦA CẢ BÀI TOÁN ──────────────────────────
  // ⚠️ Đây là ba dòng quan trọng nhất file. Mọi thứ bên dưới là hệ quả của chúng, và không có
  // dòng nào bên dưới được phép sửa lại chúng.
  const footZ = d.hipZ * (1 + g.splay);
  const liftH = g.lift * d.legLen;
  const footL = { x: footOffsetAt(phase, cycle), y: footLiftAt(phase, liftH), z: footZ };
  const footR = { x: footOffsetAt(phaseR, cycle), y: footLiftAt(phaseR, liftH), z: -footZ };

  // ── CHIỀU CAO HÔNG — SUY TỪ CHÂN TRỤ, KHÔNG PHẢI MỘT HÀM SIN RIÊNG ──────────
  // Đúng một chân tiếp đất tại mỗi thời điểm (hai chân lệch pha nửa chu kỳ), nên chân ấy quyết
  // định hông cao bao nhiêu. `flex` hạ thêm xuống: gối chùng thì cả người thấp đi.
  const offStance = phase < 0.5 ? footL.x : footR.x;
  const hipY = Math.sqrt(Math.max(0, d.legLen * d.legLen - offStance * offStance)) * (1 - g.flex);
  const bob = hipY - d.legLen;

  // ── ĐAI HÔNG: DỊCH NGANG, NGHIÊNG, VÀ XOAY ─────────────────────────────────
  // Cả ba thứ này trước ADR-057 đều bị CẤM vì chúng làm bàn chân trượt. Nay bàn chân là đầu vào
  // nên chúng chỉ còn là ba con số, và cái chân tự lo phần còn lại.
  const sway = g.sway * d.torsoW * Math.sin(turn);
  const list = -PELVIS_LIST_RAD * g.sway * 2 * Math.sin(turn);
  const pelvisTwist = g.twist * PELVIS_TWIST_RAD * Math.cos(turn);
  const cosTw = Math.cos(pelvisTwist);
  const sinTw = Math.sin(pelvisTwist);

  /** Chỗ đặt một chỏm hông sau khi đai hông đã nghiêng rồi xoay. `side` = +1 (trái) hoặc −1 (phải). */
  const hipAt = (side) => {
    const v = rotateByJoint(0, list, { x: 0, y: 0, z: side * d.hipZ });
    return { x: v.x * cosTw + v.z * sinTw, y: hipY + v.y, z: -v.x * sinTw + v.z * cosTw + sway };
  };
  const hipPosL = hipAt(1);
  const hipPosR = hipAt(-1);

  const legL = solveTwoBone(hipPosL, footL, d.thighLen, d.shinLen);
  const legR = solveTwoBone(hipPosR, footR, d.thighLen, d.shinLen);
  const reach = Math.max(legL.voi, legR.voi);

  // ── THÂN TRÊN ──────────────────────────────────────────────────────────────
  const aTorso = -style.stance;
  // Thân nghiêng NGƯỢC lại phía hông vừa dạt sang, để cái đầu bớt lắc theo. Người thật làm đúng
  // vậy, và nó là lý do cái đầu người đi bộ vẽ ra một đường gần thẳng chứ không phải hình sin.
  const bTorso = -TRUNK_COUNTER_RAD * g.sway * 2 * Math.sin(turn);
  // `bob` luôn ≤ 0. `headTrack = 1` ⇒ `lift = −bob ≥ 0`, tức thân trên được nâng lại đúng bằng
  // phần hông vừa hạ ⇒ cái đầu trôi trên một đường thẳng (người đội vò). `headTrack` ÂM ⇒ thân
  // trên hạ THÊM, tức nhún mạnh hơn hông (đòn gánh tre nảy ngược pha).
  const lift = -g.headTrack * bob;

  const pelvisPos = { x: 0, y: hipY, z: sway };
  const topOfTorso = rotateByJoint(aTorso, bTorso, { x: 0, y: d.torsoH, z: 0 });
  const headPos = {
    x: pelvisPos.x + topOfTorso.x,
    y: pelvisPos.y + topOfTorso.y + lift,
    z: pelvisPos.z + topOfTorso.z,
  };

  // ── ĐAI VAI XOAY NGƯỢC ĐAI HÔNG ────────────────────────────────────────────
  // Người thật đi bộ thì lồng ngực xoay ngược chiều với đai hông, để triệt mô men xoắn. Bỏ nó đi
  // chính là thứ làm một hình nhân trông như robot dù chân tay đã đúng pha.
  const shoulderTwist = -g.twist * THORAX_TWIST_RAD * Math.cos(turn);
  const cosSw = Math.cos(shoulderTwist);
  const sinSw = Math.sin(shoulderTwist);
  const shoulderY = d.torsoH * 0.88;
  /** Chỗ đặt một chỏm vai: theo thân đã khom và nghiêng, rồi xoay quanh trục đứng. */
  const shoulderAt = (side) => {
    const v = rotateByJoint(aTorso, bTorso, { x: 0, y: shoulderY, z: side * d.shoulderZ });
    return {
      x: v.x * cosSw + v.z * sinSw,
      y: pelvisPos.y + v.y + lift,
      z: -v.x * sinSw + v.z * cosSw + pelvisPos.z,
    };
  };

  // Tay vung NGƯỢC chân cùng bên — người thật giữ thăng bằng xoay bằng cách ấy, và ở cỡ nhỏ thì
  // chính sự ngược pha đó làm hình bóng "đi" thay vì "trượt".
  //
  // ⚠️ TAY ĐANG CẦM ĐỒ THÌ GẦN NHƯ KHÔNG VUNG — bỏ qua điều đó đã cho ra một lỗi nhìn thấy rõ trên
  // ảnh chụp gần: cây giáo của kỷ 1 treo vào vai phải nên nó vung theo, **nghiêng qua lại 52,7°**.
  // Một bàn tay đu 52° thì bình thường; một cây gậy dài hơn cả người đu 52° thì thành cái quả lắc
  // đồng hồ. Ngoài đời, tay cầm vật nặng là tay GIỮ YÊN.
  const swing = style.armSwing;
  const swingR = body.carryArm === 'shoulderR' ? swing * CARRY_ARM_DAMP : swing;
  const swingL = body.carryArm === 'shoulderL' ? swing * CARRY_ARM_DAMP : swing;
  const devL = -swingL * Math.cos(turn);
  const devR = -swingR * Math.cos(Math.PI * 2 * phaseR);
  const aArmL = aTorso + devL;
  const aArmR = aTorso + devR;
  // Khuỷu gập sẵn một chút, và gập THÊM khi tay đưa ra trước. Chỉ một chiều — khuỷu không duỗi
  // ngược được, và một cẳng tay bẻ ngược ra sau đọc ra ngay là gãy tay.
  const elbowL = ELBOW_REST_RAD + ELBOW_GAIN * Math.max(0, devL);
  const elbowR = ELBOW_REST_RAD + ELBOW_GAIN * Math.max(0, devR);
  const shoulderPosL = shoulderAt(1);
  const shoulderPosR = shoulderAt(-1);
  const bArmL = -ARM_SPLAY_RAD;
  const bArmR = ARM_SPLAY_RAD;
  /** Chỗ đặt khuỷu = đầu mút của cánh tay trên. */
  const elbowPos = (sh, a, b) => {
    const v = rotateByJoint(a, b, { x: 0, y: -d.upperArmLen, z: 0 });
    return { x: sh.x + v.x, y: sh.y + v.y, z: sh.z + v.z };
  };

  return {
    bob,
    cycle,
    phase,
    /**
     * Tỉ số tầm với lớn nhất của hai chân ở tư thế này (1 = chân đang phải duỗi thẳng đơ mới với
     * tới bàn chân). ⚠️ TRẢ RA NGOÀI ĐỂ BÀI TEST ĐO ĐƯỢC, không giấu trong một phép kẹp — xem chú
     * thích `solveTwoBone`.
     */
    reach,
    joints: {
      pelvis: { x: pelvisPos.x, y: pelvisPos.y, z: pelvisPos.z, a: 0, b: list },
      torso: { x: pelvisPos.x, y: pelvisPos.y, z: pelvisPos.z, a: aTorso, b: bTorso },
      head: {
        x: headPos.x,
        y: headPos.y,
        z: headPos.z,
        // Đầu ngẩng lại một nửa độ khom: người khom lưng vẫn nhìn về phía trước chứ không nhìn
        // xuống chân. Đây là góc TUYỆT ĐỐI, không phải góc so với thân.
        a: aTorso * 0.5,
        b: bTorso * 0.5,
      },
      hipL: { x: hipPosL.x, y: hipPosL.y, z: hipPosL.z, a: legL.a1, b: legL.b },
      hipR: { x: hipPosR.x, y: hipPosR.y, z: hipPosR.z, a: legR.a1, b: legR.b },
      kneeL: { x: legL.mid.x, y: legL.mid.y, z: legL.mid.z, a: legL.a2, b: legL.b },
      kneeR: { x: legR.mid.x, y: legR.mid.y, z: legR.mid.z, a: legR.a2, b: legR.b },
      shoulderL: { x: shoulderPosL.x, y: shoulderPosL.y, z: shoulderPosL.z, a: aArmL, b: bArmL },
      shoulderR: { x: shoulderPosR.x, y: shoulderPosR.y, z: shoulderPosR.z, a: aArmR, b: bArmR },
      elbowL: { ...elbowPos(shoulderPosL, aArmL, bArmL), a: aArmL + elbowL, b: bArmL },
      elbowR: { ...elbowPos(shoulderPosR, aArmR, bArmR), a: aArmR + elbowR, b: bArmR },
    },
  };
}

/**
 * Vị trí TÂM của một khối trong hệ toạ độ cục bộ của người, ở tư thế `pose`.
 *
 * ⚠️ TỒN TẠI ĐỂ BÀI TEST HỎI ĐÚNG THỨ `sceneGraph.js` DỰNG. Không có hàm này thì bài test phải
 * chép lại phép ghép ma trận, và bản chép sẽ trôi khỏi bản gốc — đúng cái đã xảy ra giữa
 * `sweep-score.mjs` và `city-preview.mjs` (Phase 4G), nơi bản chép lệch một mặc định rồi in ra
 * cả một bộ số bịa rất thuyết phục.
 */
export function partCenterAt(part, pose) {
  const j = pose?.joints?.[part.joint];
  if (!j) return null;
  const v = rotateByJoint(j.a, j.b ?? 0, part.rest);
  return { x: j.x + v.x, y: j.y + v.y, z: j.z + v.z };
}

/**
 * TÁM ĐỈNH của hộp bao một khối ở tư thế `pose`, trong hệ cục bộ.
 *
 * ⚠️ TỒN TẠI VÌ HÌNH BÓNG LÀ CHUYỆN CỦA KHỐI ĐẶC, KHÔNG PHẢI CỦA TÂM HỘP. `scripts/human-scale.mjs`
 * đã nói dối đúng một lần vì lý do này: nó chiếu một ĐOẠN THẲNG từ bàn chân lên đỉnh đầu và ra
 * 8,1 điểm ảnh, trong khi ảnh thật đo được 11,0 — camera nhìn chếch nên mặt trên của khối cũng
 * chiếm chỗ theo chiều dọc màn hình.
 */
export function partCornersAt(part, pose) {
  const j = pose?.joints?.[part.joint];
  if (!j) return [];
  const c = partCenterAt(part, pose);
  const a = j.a;
  const b = j.b ?? 0;
  const out = [];
  for (const sx of [-0.5, 0.5]) {
    for (const sy of [-0.5, 0.5]) {
      for (const sz of [-0.5, 0.5]) {
        const v = rotateByJoint(a, b, { x: sx * part.w, y: sy * part.h, z: sz * part.d });
        out.push({ x: c.x + v.x, y: c.y + v.y, z: c.z + v.z });
      }
    }
  }
  return out;
}

/**
 * BỀ RỘNG HÌNH BÓNG NHÌN NGANG: độ trải của cả cơ thể theo TRỤC ĐI (x cục bộ).
 *
 * ⚠️ ĐÂY LÀ ĐẠI LƯỢNG MÀ PHA BƯỚC THẬT SỰ ĐỔI, và đó là lý do chọn nó thay vì "diện tích hình
 * bóng" hay "chiều cao". Đi bộ là chuyển động trong mặt phẳng đứng dọc theo hướng đi: hai chân
 * tách ra trước-sau, hai tay đu ngược lại. Đo bề ngang (trục z) thì gần như không đổi gì, và một
 * phép đo không nhìn thấy thứ nó nói là đang đo thì tệ hơn không đo (bài học VSM, Phase 9B).
 */
export function silhouetteSpanX(body, travelled) {
  const pose = poseAt(body, travelled);
  if (!pose) return 0;
  let lo = Infinity;
  let hi = -Infinity;
  for (const part of body.parts) {
    for (const c of partCornersAt(part, pose)) {
      if (c.x < lo) lo = c.x;
      if (c.x > hi) hi = c.x;
    }
  }
  return hi - lo;
}

/**
 * Điểm CHẠM ĐẤT ở đầu mút dưới của một khối chi, trong hệ cục bộ. Bài test "chân không trượt" cộng
 * con số này vào quãng đường đã đi rồi đòi kết quả đứng yên ở CẢ BA TRỤC.
 *
 * ⚠️ TRUYỀN VÀO KHỐI **CẲNG CHÂN**, KHÔNG PHẢI KHỐI ĐÙI — từ ADR-057 bàn chân nằm ở đầu mút dưới
 * của cẳng chân, treo vào khớp GỐI. Truyền nhầm khối đùi thì hàm này trả về chỗ đặt đầu gối và
 * bài test sẽ đo một thứ hoàn toàn khác mà vẫn ra những con số trông hợp lý.
 */
export function footContactAt(part, pose) {
  const j = pose?.joints?.[part.joint];
  if (!j) return null;
  const v = rotateByJoint(j.a, j.b ?? 0, { x: 0, y: -part.h, z: 0 });
  return { x: j.x + v.x, y: j.y + v.y, z: j.z + v.z };
}
