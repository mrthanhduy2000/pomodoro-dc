/**
 * humanPose.js — TƯ THẾ tại một thời điểm. Trả về góc của từng khớp và chỗ đặt từng khớp.
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
 * ⇒ Hàm này nhận `travelled` (quãng đường đã đi, đơn vị ô) chứ không nhận `t`. Mô hình cũ đã làm
 * đúng tinh thần ấy cho cái nhún (`bob` tính theo `travelled`); ở đây nó thành luật cho MỌI khớp.
 *
 * ⚠️ CHÂN CẮM XUỐNG ĐẤT LÀ MỘT RÀNG BUỘC, KHÔNG PHẢI MỘT HIỆU ỨNG. Trong pha tiếp đất, bàn chân
 * phải ĐỨNG YÊN trong toạ độ THẾ GIỚI trong khi thân đi qua nó. Viết ra thành công thức: độ dịch
 * của bàn chân so với hông phải giảm ĐÚNG BẰNG quãng đường thân tiến được, tức
 * `d(footOffset)/d(travelled) = -1`. Cả pha tiếp đất dưới đây là một đoạn THẲNG theo `travelled`
 * đúng vì lý do đó — không phải vì thẳng thì dễ viết.
 *
 * ⚠️ VÀ CÁI NHÚN NGƯỜI KHÔNG PHẢI MỘT HÀM SIN RIÊNG — NÓ LÀ HỆ QUẢ CỦA CÁI CHÂN.
 * Chân là một khối cứng dài `legLen`; khi nó nghiêng một góc `a` thì hông chỉ còn cao
 * `legLen × cos a` so với bàn chân. Thân vì thế TỰ hạ xuống ở đầu và cuối bước, TỰ cao nhất ở
 * giữa pha tiếp đất — đúng hình dạng nhún của người thật, và đúng pha. Thêm một hàm sin riêng cho
 * cái nhún là tạo ra một luật thứ hai cho cùng một chuyện, rồi hai luật ấy sẽ lệch pha nhau vào
 * ngày có ai chỉnh `stride`. Mô hình cũ có một `Math.abs(Math.sin(travelled * 9)) * 0.022` như
 * vậy; nó đã bị GỠ HẲN khỏi `residents.js` chứ không để lại song song.
 */

import { humanDims } from './human';
import { gaitOf, THORAX_TWIST_RAD } from './humanGait';

/** Gói một số thực về [0, 1). */
function wrap01(v) {
  const w = v % 1;
  return w < 0 ? w + 1 : w;
}

function clamp(v, lo, hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

/**
 * Hệ số rút chi của khối `part` ở tư thế `pose`. Khớp nào không khai thì bằng 1.
 *
 * ⚠️ MỘT HÀM, MỘT CHỖ ĐỌC. Bốn nơi cần con số này (`partCenterAt`, `partCornersAt`,
 * `footContactAt`, và `sceneGraph.js`), và chép `pose.stretch?.[part.joint] ?? 1` ra bốn chỗ là
 * dựng sẵn bốn cơ hội để chúng trôi khỏi nhau — đúng quả mìn "một luật hai công thức" đã cắn ở
 * `daylight.test.js` và ở `cadenceOf`. `sceneGraph.js` nhập chính hàm này chứ không tự viết lại.
 */
export function stretchOf(part, pose) {
  return pose?.stretch?.[part?.joint] ?? 1;
}

/** Tay đang cầm đồ chỉ còn vung bằng ngần này lần tay không. Xem chú thích trong `poseAt`. */
const CARRY_ARM_DAMP = 0.2;

/**
 * ĐẦU GỐI GIẢ — chân còn lại bao nhiêu phần chiều dài, ở pha `p` của chu kỳ.
 *
 * Pha TIẾP ĐẤT trả về đúng 1: chân đang chịu toàn bộ trọng lượng thì nó thẳng, và mọi bất biến
 * cũ (bàn chân cắm đất, cái nhún suy từ chân trụ, trần góc hông) dựa vào đúng con số 1 ấy.
 * Pha ĐƯA CHÂN rút chân lại theo `sin²`, sâu nhất ở giữa pha rồi trở về 1 ở hai đầu.
 *
 * ⚠️ VÌ SAO `sin²` CHỨ KHÔNG `sin` — ĐÂY LÀ ĐIỀU KIỆN ĐỂ TRẦN GÓC HÔNG CÒN ĐÚNG, KHÔNG PHẢI MỘT
 * LỰA CHỌN CHO MƯỢT. Góc hông là `asin(off / (legLen·f))`, nên rút chân ngắn lại là NHÂN góc lên.
 * Với `s = sin(πu)`: biên độ pha đưa chân là `(cycle/4)·√(1−s²)`, cần `√(1−s²) ≤ f`.
 *   · `f = 1 − c·sin(πu)`  ⇒ gần hai đầu pha, vế phải tụt TUYẾN TÍNH còn vế trái tụt theo `s²/2`
 *     ⇒ bất đẳng thức **vỡ ngay sát mép**, ở MỌI giá trị `knee < 1`. Sai không triệu chứng.
 *   · `f = 1 − c·sin²(πu)` ⇒ đặt `g(s) = 1 − c·s² − √(1−s²)`: `g(0) = 0`, `g(1) = 1 − c > 0`, và
 *     `g′(s) = s·(1/√(1−s²) − 2c) > 0` với mọi `c ≤ 0,5` ⇒ `g ≥ 0` trên cả đoạn.
 * ⇒ Đúng vì `knee ≥ 0,5`, và `isValidGaitProfile` từ chối thẳng mọi giá trị dưới đó.
 */
export function legFactorAt(p, knee) {
  if (p < 0.5) return 1;
  const s = Math.sin(Math.PI * (p - 0.5) * 2);
  return 1 - (1 - knee) * s * s;
}

/**
 * Độ dịch của BÀN CHÂN so với hông, theo hướng đi, ở một pha `p` của chu kỳ.
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
 * Tư thế của một cư dân sau khi đã đi được `travelled` ô.
 *
 * ⚠️ QUY ƯỚC DẤU — đọc kỹ, nó KHÔNG đối xứng và đó là hình học chứ không phải nhầm lẫn.
 * Mọi góc trả về là góc THÔ để đưa thẳng vào một phép xoay quanh trục z cục bộ (`Rz(a)`), tức
 * `sceneGraph.js` không phải suy diễn gì thêm. Với một chi CHĨA XUỐNG (chân, tay), `a` dương đưa
 * đầu mút RA TRƯỚC. Với thân CHĨA LÊN, cùng phép xoay ấy lại đưa đỉnh RA SAU — nên độ khom
 * `stance` vào đây với dấu ÂM. Bài test kiểm bằng TOẠ ĐỘ THẾ GIỚI của bàn chân, không kiểm bằng
 * dấu của góc, đúng vì lý do này.
 *
 * @param {{style:object, dims:object}} body  kết quả `buildHumanBody`
 * @param {number} travelled                  quãng đường đã đi, đơn vị ô
 * @returns {{bob:number, cycle:number, phase:number, joints:object}}
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

  const offL = footOffsetAt(phase, cycle);
  const offR = footOffsetAt(phaseR, cycle);
  const fL = legFactorAt(phase, g.knee);
  const fR = legFactorAt(phaseR, g.knee);
  const aHipL = Math.asin(clamp(offL / (d.legLen * fL), -1, 1));
  const aHipR = Math.asin(clamp(offR / (d.legLen * fR), -1, 1));

  // Chân nào đang TIẾP ĐẤT thì chân đó quyết định độ cao của hông. Đúng một chân tiếp đất tại mỗi
  // thời điểm, vì hai chân lệch pha đúng nửa chu kỳ. Trong pha tiếp đất `legFactorAt` trả về đúng
  // 1, nên biểu thức dưới đây y hệt bản trước khi có đầu gối — cái nhún KHÔNG đổi một chữ số.
  const aStance = phase < 0.5 ? aHipL : aHipR;
  const bob = d.legLen * (Math.cos(aStance) - 1);

  const hipY = d.legLen + bob;
  const aTorso = -style.stance;
  const sinT = Math.sin(aTorso);
  const cosT = Math.cos(aTorso);

  // ── LẮC NGANG (chỉ thân trên) ───────────────────────────────────────────────
  // Chu kỳ bằng đúng một chu kỳ chân: trọng tâm dồn về phía chân đang trụ. Ở pha 0,25 (giữa pha
  // trụ của chân TRÁI) thì `sin` bằng 1 ⇒ thân dạt sang +z, mà +z là bên trái. Đúng chiều.
  // ⚠️ HÔNG KHÔNG DẠT THEO — xem chú thích `sway` ở `humanGait.js`. Dạt hông thì bàn chân trượt
  // ngang trên mặt đường (3 tới 4 điểm ảnh với kiểu `roll`), vì bộ khớp ở đây chỉ xoay quanh MỘT
  // trục nên cái chân không dạng ra bù được. Thiếu sót ấy ghi ở `TECH_DEBT`, không giả vờ đã có.
  const sway = g.sway * d.torsoW * Math.sin(turn);

  // ── THÂN TRÊN BÁM CÁI NHÚN TỚI ĐÂU ──────────────────────────────────────────
  // `bob` luôn ≤ 0. `headTrack = 1` ⇒ `lift = −bob ≥ 0`, tức thân trên được nâng lại đúng bằng
  // phần hông vừa hạ ⇒ cái đầu trôi trên một đường thẳng (người đội vò). `headTrack` ÂM ⇒ thân
  // trên hạ THÊM, tức nhún mạnh hơn hông (đòn gánh tre nảy ngược pha).
  // ⚠️ CÁI THÂN VẪN NEO Ở HÔNG, nên giữa đỉnh thân và cái đầu có thể hở tối đa `|bob|` — đo được
  // dưới 1,2 điểm ảnh ở khung cận cảnh, và cái đầu vốn chồm lên đỉnh thân nên khe ấy không mở ra.
  // Kéo giãn cả cái thân để bịt nốt sẽ tốn một trường `stretch` thứ hai cho một thứ không nhìn
  // thấy — đúng loại chi tiết mà HỆ QUẢ 2b bảo phải từ chối.
  const lift = -g.headTrack * bob;

  // ── ĐAI VAI XOAY NGƯỢC ──────────────────────────────────────────────────────
  // Người thật đi bộ thì lồng ngực xoay ngược chiều với chân đang bước tới, để triệt mô men xoắn.
  // Bỏ nó đi chính là thứ làm một hình nhân trông như robot dù chân tay đã đúng pha.
  //
  // ⚠️ CHỈ XOAY VAI, KHÔNG XOAY HÔNG — VÀ ĐÓ LÀ MỘT QUYẾT ĐỊNH CÓ ĐO, KHÔNG PHẢI MỘT THIẾU SÓT.
  // Ngoài đời đai hông cũng xoay (±4…8°) và nó đóng góp khoảng 6% độ dài bước. Đưa nó vào đây thì
  // khớp háng dịch ra trước, nên phép tính góc hông phải TRỪ đúng đoạn ấy đi để bàn chân còn đáp
  // xuống chỗ cũ — tức một số hạng bù mới trong chính cái luật chống-trượt, cộng hai cái trần trong
  // `humanPose.test.js` phải viết lại theo. Cái giá ấy đổi lấy **0,2 điểm ảnh** (biên độ
  // `hipZ · sin(0,14) ≈ 0,0028 ô` ở khung mặc định), tức DƯỚI ngưỡng mắt kể cả ở khung cận cảnh.
  // ⇒ Không làm. Thứ mắt đọc được vốn là độ xoay TƯƠNG ĐỐI giữa vai và hông, mà xoay riêng vai đã
  // cho ra trọn vẹn độ tương đối ấy.
  //
  // ⚠️ Chỉ lấy số hạng x của phép xoay; phần z co lại theo `cos(θ)` bị bỏ qua có chủ ý — với θ tối
  // đa 15° thì nó hẹp đi 3,4%, tức dưới một phần mười điểm ảnh. Ghi ra để đây là một xấp xỉ ĐÃ
  // KHAI chứ không phải một chỗ quên.
  const shoulderTwist = -g.twist * THORAX_TWIST_RAD * Math.cos(turn);
  const twistDx = d.shoulderZ * Math.sin(shoulderTwist);

  // Vai đi theo thân: điểm treo vai phải được thân xoay rồi mới dùng, nếu không thì thân khom mà
  // hai tay vẫn treo ở chỗ cũ và cánh tay lòi ra khỏi ngực.
  const shoulderY = d.torsoH * 0.88;
  const shoulderPx = -shoulderY * sinT;
  const shoulderPy = hipY + shoulderY * cosT + lift;

  // Tay vung NGƯỢC chân cùng bên — người thật giữ thăng bằng xoay bằng cách ấy, và ở cỡ nhỏ thì
  // chính sự ngược pha đó làm hình bóng "đi" thay vì "trượt". Cộng thêm độ khom của thân để tay
  // treo đúng theo lồng ngực.
  //
  // ⚠️ TAY ĐANG CẦM ĐỒ THÌ GẦN NHƯ KHÔNG VUNG — và bỏ qua điều đó đã cho ra một lỗi nhìn thấy
  // rõ trên ảnh chụp gần: cây giáo của kỷ 1 treo vào vai phải nên nó vung theo, **nghiêng qua lại
  // 52,7°**. Một bàn tay đu 52° thì bình thường; một cây gậy dài hơn cả người đu 52° thì thành cái
  // quả lắc đồng hồ, và mắt đọc ra ngay là sai dù không gọi được tên. Ngoài đời, tay cầm vật nặng
  // là tay GIỮ YÊN — đó là cách người ta khỏi đánh rơi nó.
  // Hệ quả phụ mà lại rất đáng: hai tay vung KHÁC nhau, và sự bất đối xứng ấy đọc ra được ở cỡ
  // nhỏ tốt hơn hẳn bản thân cái vật đang cầm.
  const swing = style.armSwing;
  const swingR = body.carryArm === 'shoulderR' ? swing * CARRY_ARM_DAMP : swing;
  const swingL = body.carryArm === 'shoulderL' ? swing * CARRY_ARM_DAMP : swing;
  const aArmL = aTorso - swingL * Math.cos(turn);
  const aArmR = aTorso - swingR * Math.cos(Math.PI * 2 * phaseR);

  return {
    bob,
    cycle,
    phase,
    /**
     * ĐẦU GỐI GIẢ: chân còn lại bao nhiêu phần chiều dài, theo từng bên. Mọi nơi đọc `part.h` của
     * một khối treo vào hông PHẢI nhân thêm hệ số này — `partCenterAt`, `partCornersAt`,
     * `footContactAt` và `sceneGraph.js` đều làm vậy. Bỏ sót một chỗ thì bàn chân rời khỏi cẳng
     * chân, và không có gì đỏ lên vì hình học vẫn hợp lệ.
     */
    stretch: { hipL: fL, hipR: fR },
    joints: {
      hipL: { x: 0, y: hipY, z: d.hipZ, a: aHipL },
      hipR: { x: 0, y: hipY, z: -d.hipZ, a: aHipR },
      torso: { x: 0, y: hipY, z: sway, a: aTorso },
      head: {
        x: -d.torsoH * sinT,
        y: hipY + d.torsoH * cosT + lift,
        z: sway,
        // Đầu ngẩng lại một nửa độ khom: người khom lưng vẫn nhìn về phía trước chứ không nhìn
        // xuống chân. Đây là góc TUYỆT ĐỐI, không phải góc so với thân.
        a: aTorso * 0.5,
      },
      shoulderL: { x: shoulderPx + twistDx, y: shoulderPy, z: sway + d.shoulderZ, a: aArmL },
      shoulderR: { x: shoulderPx - twistDx, y: shoulderPy, z: sway - d.shoulderZ, a: aArmR },
    },
  };
}

/**
 * Vị trí TÂM của một hộp trong hệ toạ độ cục bộ của người, ở tư thế `pose`.
 *
 * ⚠️ TỒN TẠI ĐỂ BÀI TEST HỎI ĐÚNG THỨ `sceneGraph.js` DỰNG. Không có hàm này thì bài test phải
 * chép lại phép ghép ma trận, và bản chép sẽ trôi khỏi bản gốc — đúng cái đã xảy ra giữa
 * `sweep-score.mjs` và `city-preview.mjs` (Phase 4G), nơi bản chép lệch một mặc định rồi in ra
 * cả một bộ số bịa rất thuyết phục.
 */
export function partCenterAt(part, pose) {
  const j = pose?.joints?.[part.joint];
  if (!j) return null;
  const cos = Math.cos(j.a);
  const sin = Math.sin(j.a);
  // ⚠️ CHỈ `rest.y` NHÂN HỆ SỐ RÚT CHÂN, KHÔNG PHẢI `rest.x`/`rest.z`. Hệ số ấy là chiều dài chi
  // còn lại; `rest.x`/`rest.z` là độ lệch NGANG (bàn chân lệch ra ngoài trục chân) và chúng không
  // ngắn lại khi gối co. Nhân nhầm cả ba thì bàn chân chụm vào trong mỗi lần đưa chân.
  const ry = part.rest.y * stretchOf(part, pose);
  return {
    x: j.x + part.rest.x * cos - ry * sin,
    y: j.y + part.rest.x * sin + ry * cos,
    z: j.z + part.rest.z,
  };
}

/**
 * TÁM ĐỈNH của một hộp ở tư thế `pose`, trong hệ cục bộ.
 *
 * ⚠️ TỒN TẠI VÌ HÌNH BÓNG LÀ CHUYỆN CỦA KHỐI ĐẶC, KHÔNG PHẢI CỦA TÂM HỘP. `scripts/human-scale.mjs`
 * đã nói dối đúng một lần vì lý do này: nó chiếu một ĐOẠN THẲNG từ bàn chân lên đỉnh đầu và ra
 * 8,1 điểm ảnh, trong khi ảnh thật đo được 11,0 — camera nhìn chếch nên mặt trên của khối cũng
 * chiếm chỗ theo chiều dọc màn hình. Bài test "hình bóng đổi theo pha bước" hỏi bề rộng, nên nó
 * phải hỏi ĐỈNH chứ không hỏi tâm.
 */
export function partCornersAt(part, pose) {
  const j = pose?.joints?.[part.joint];
  if (!j) return [];
  const c = partCenterAt(part, pose);
  const cos = Math.cos(j.a);
  const sin = Math.sin(j.a);
  const he = stretchOf(part, pose);
  const out = [];
  for (const sx of [-0.5, 0.5]) {
    for (const sy of [-0.5, 0.5]) {
      for (const sz of [-0.5, 0.5]) {
        const ox = sx * part.w;
        const oy = sy * part.h * he;
        out.push({
          x: c.x + ox * cos - oy * sin,
          y: c.y + ox * sin + oy * cos,
          z: c.z + sz * part.d,
        });
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
 * Điểm CHẠM ĐẤT của một bàn chân, trong hệ cục bộ. Đầu mút dưới của hộp chân, sau khi hông xoay.
 * Bài test "chân không trượt" cộng con số này vào quãng đường đã đi rồi đòi kết quả đứng yên.
 */
export function footContactAt(part, pose) {
  const j = pose?.joints?.[part.joint];
  if (!j) return null;
  const len = part.h * stretchOf(part, pose);
  return { x: j.x + len * Math.sin(j.a), y: j.y - len * Math.cos(j.a), z: j.z };
}
