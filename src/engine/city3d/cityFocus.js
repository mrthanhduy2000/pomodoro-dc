/**
 * cityFocus.js — BAY TỚI MỘT KHU PHỐ RỒI DỪNG LẠI Ở CHỖ AN TOÀN. THUẦN: chỉ toán, không three,
 * không DOM.
 *
 * ⚠️ ĐÂY KHÔNG PHẢI HỆ CAMERA THỨ HAI. Cả app vẫn chỉ có MỘT `createOrbit` (`orbit.js`); file này
 * không giữ trạng thái nào cả, nó chỉ TÍNH RA bộ tham số `{yaw, pitch, distance, target}` rồi đưa
 * cho chính cái cần cẩu ấy. Dựng một hệ camera riêng cho chế độ cận cảnh là cách chắc chắn nhất để
 * hai hệ trôi khỏi nhau (ống kính khác, giới hạn góc khác), đúng bẫy "một luật hai công thức".
 *
 * ═══ VÌ SAO MỖI KỶ MỘT MỨC THU PHÓNG RIÊNG, VÀ VÌ SAO NÓ KHÔNG PHẢI MỘT BẢNG 15 SỐ CHỌN TAY ═══
 *
 * Đo trước khi viết (`BUILDING_SCALE = 1,3`, lưới 12, ống kính 38°): nếu lấy MỘT mức thu phóng
 * chung — 0,45 lần khoảng cách toàn cảnh — thì công trình cao nhất của kỷ phủ **44% khung hình ở
 * kỷ 1 nhưng 122% ở kỷ 15**, tức kỷ cuối bị cắt mất nóc đúng thứ đáng xem nhất. Chênh 2,8 lần.
 * Nguyên nhân: `cityOrbitOptions` đã lùi camera ra theo `massScale`, nên "0,45 lần khoảng cách
 * toàn cảnh" là 0,45 lần của mười lăm con số khác nhau.
 *
 * ⇒ Luật ở đây đảo ngược chiều suy nghĩ: **cố định KHOẢNG CÁCH THẬT (`FOCUS_VIEW_DISTANCE`), để
 * chính mức thu phóng tự khác nhau theo kỷ.** Hệ quả là thứ ta thật sự muốn: **một ống khói ở kỷ 1
 * và một ống khói ở kỷ 15 chiếm ĐÚNG BẰNG NHAU số điểm ảnh trên màn hình** — bởi số điểm ảnh trên
 * mỗi đơn vị thế giới chỉ phụ thuộc khoảng cách, không phụ thuộc kỷ. Một mức thu phóng riêng cho
 * mỗi kỷ mà không giữ được lời hứa ấy thì chỉ là mười lăm con số tuỳ hứng.
 * Mức thu phóng suy ra: **0,333 (kỷ 8) … 0,478 (kỷ 1)** — đo lại 2026-08-24 sau Phase 19 VIỆC 5,
 * khi khung toàn cảnh lùi ra ở cả 15 kỷ để không công trình nào bị mép cắt. ⚠️ Dải này là một
 * QUAN SÁT, không phải một lời hứa: nó tụt xuống mỗi lần khung toàn cảnh lùi ra, trong khi thứ
 * thật sự được khoá — `FOCUS_VIEW_DISTANCE` — không đổi một chữ số. Bộ số cũ (0,395…0,557) mô tả
 * khung toàn cảnh TRƯỚC VIỆC 5; đừng đem so trực tiếp với bộ số trên.
 *
 * ═══ CAMERA TUYỆT ĐỐI KHÔNG ĐƯỢC CHUI VÀO TRONG PHỐ — VÀ PHẢI CANH CẢ ĐƯỜNG BAY ═══
 *
 * Canh mỗi ĐIỂM ĐẾN là chưa đủ, và đây không phải lo xa: điểm đến nằm ở rìa thành phố còn điểm
 * xuất phát nằm trên đỉnh đầu, nên đoạn giữa của chuyến bay đi ngang qua đúng chỗ đông nhà nhất.
 * Đo thật ở mức thu phóng trên, với góc nhìn mặc định 34°: **7 trên 15 kỷ có camera nằm THẤP HƠN
 * nóc nhà cao nhất** khi hạ xuống. Nên phép canh lấy mẫu toàn bộ đường bay
 * (`FLIGHT_SAMPLES` chặng) và đo khoảng cách tới hộp bao GẦN NHẤT của mọi khối trong phố.
 *
 * Cách chữa xếp theo thứ tự **"giữ được thứ nhìn thấy trước"**: **lùi ra xa** (giữ nguyên góc
 * nhìn, vật nhỏ đi nhưng MẶT ĐỨNG còn nguyên) → nếu lùi hết cỡ vẫn kẹt thì **ngẩng lên** → cùng
 * lắm là đứng yên tại chỗ cũ. Mọi vòng lặp đều có trần hữu hạn nên phép tìm LUÔN dừng lại được.
 * ⚠️ Thứ tự này từng NGƯỢC LẠI cho tới 2026-08-18 (`TECH_DEBT #46`) — xem lý do ngay tại chỗ sửa
 * trong `planCityFocus`, và đừng đảo lại mà không đọc nó.
 *
 * ⚠️ Số lần phải lùi ra được ĐẾM và trả về (`raisedDistance`), không nuốt im lặng — bài học Phase
 * 10 Bước 2: một cơ chế "từ chối thẳng" chỉ an toàn khi có người đếm số lần từ chối.
 */

import { MAX_PITCH, MIN_PITCH, orbitPosition } from './orbit';

/**
 * Khoảng cách THẬT (đơn vị thế giới) từ camera tới khu phố đang ngắm ở chế độ cận cảnh.
 *
 * ⚠️ 7,5 KHÔNG phải số chọn cho đẹp — nó là con số DUY NHẤT thoả cùng lúc ba ràng buộc đã đo:
 *   1. mức thu phóng suy ra phải nằm trong 0,38–0,58 ở CẢ 15 kỷ ⇒ 7,5 phải nằm giữa
 *      0,38 × 19,01 = 7,22 (kỷ xa nhất) và 0,58 × 13,46 = 7,81 (kỷ gần nhất). Dải hợp lệ chỉ
 *      rộng 0,59 đơn vị — gần như không có chỗ để chọn bừa.
 *   2. cả 300 chuyến bay thử (15 kỷ × 5 công trình × 4 hướng) đều tìm được đường thoáng.
 *   3. tầm nhìn dọc còn 0,689 × 7,5 ≈ 5,2 ô lưới — một KHU PHỐ, không phải một căn nhà. Chạm vào
 *      một công trình mà khung hình chỉ còn đúng bức tường của nó thì mất hết ngữ cảnh xung quanh.
 */
export const FOCUS_VIEW_DISTANCE = 7.5;

/**
 * Camera phải cách mọi khối trong phố ít nhất một Ô LƯỚI. Chọn đơn vị này chứ không chọn một số
 * lẻ: một ô lưới là bề rộng một căn nhà, tức "cách ra bằng một căn nhà" — kiểm bằng mắt được, và
 * không trôi nếu sau này đổi tỉ lệ công trình.
 */
export const FOCUS_CLEARANCE = 1;

/** Số chặng lấy mẫu dọc đường bay. 48 chặng trên quãng ~10 đơn vị ⇒ mỗi bước ~0,2 đơn vị. */
export const FLIGHT_SAMPLES = 48;

/** Mỗi lần ngẩng camera lên thêm bao nhiêu radian khi đường bay còn kẹt (~1,1°). */
const PITCH_STEP = 0.02;
/** Mỗi lần lùi ra xa thêm bao nhiêu đơn vị thế giới, khi ngẩng hết cỡ vẫn kẹt. */
const DISTANCE_STEP = 0.5;

const num = (value, fallback = 0) => (Number.isFinite(value) ? value : fallback);

/**
 * Mức thu phóng của một kỷ = khoảng cách cận cảnh chia khoảng cách toàn cảnh của chính kỷ ấy.
 * Trả về số < 1 (lại gần). Dùng để BÁO CÁO và để test khoá dải 0,38–0,58; bản thân đường bay
 * không cần tới nó, vì nó đã làm việc thẳng bằng khoảng cách thật.
 */
export function focusZoom(overviewDistance, viewDistance = FOCUS_VIEW_DISTANCE) {
  const d = num(overviewDistance, 0);
  return d > 0 ? viewDistance / d : 1;
}

/**
 * Khoảng cách từ một điểm tới một hộp bao theo trục. Điểm nằm TRONG hộp ⇒ 0.
 * Đây là phép đo "camera có chui vào trong không", nên nằm-trong phải ra đúng 0 chứ không ra một
 * số âm nào đó — số âm sẽ lẫn với "cách ra một chút" khi đem so ngưỡng.
 */
export function boxDistance(point, box) {
  if (!point || !box) return Infinity;
  const dx = Math.max(box.minX - point.x, 0, point.x - box.maxX);
  const dy = Math.max(box.minY - point.y, 0, point.y - box.maxY);
  const dz = Math.max(box.minZ - point.z, 0, point.z - box.maxZ);
  return Math.hypot(dx, dy, dz);
}

/** Khoảng cách tới khối GẦN NHẤT trong phố. Phố rỗng ⇒ `Infinity` (thoáng vô hạn). */
export function nearestBlocker(point, blockers) {
  let best = Infinity;
  for (const box of blockers ?? []) {
    const d = boxDistance(point, box);
    if (d < best) best = d;
  }
  return best;
}

/**
 * Một chặng trên đường bay. Nội suy TUYẾN TÍNH mọi thành phần.
 *
 * ⚠️ Bên gọi được phép bôi trơn nhịp bằng hàm dịu (`t` đã qua ease) — làm vậy KHÔNG đổi tập hợp
 * các trạng thái đi qua, chỉ đổi tốc độ đi qua chúng, nên phép canh thoáng ở đây vẫn còn nguyên
 * giá trị. Đừng đổi sang nội suy theo đường cong (bezier, arc): lúc ấy đường bay sẽ đi qua những
 * chỗ mà phép lấy mẫu này chưa từng nhìn thấy.
 */
export function flightState(from, to, t) {
  const k = Math.min(1, Math.max(0, num(t)));
  const mix = (a, b) => a + (b - a) * k;
  return {
    yaw: mix(from.yaw, to.yaw),
    pitch: mix(from.pitch, to.pitch),
    distance: mix(from.distance, to.distance),
    target: {
      x: mix(from.target.x, to.target.x),
      y: mix(from.target.y, to.target.y),
      z: mix(from.target.z, to.target.z),
    },
  };
}

/**
 * Đo đường bay: chỗ thoáng NHỎ NHẤT ĐO ĐƯỢC (`gap`), bước dài nhất giữa hai chặng lấy mẫu
 * (`step`), và — quan trọng nhất — `guaranteed`: chặn dưới CHỨNG MINH ĐƯỢC của độ thoáng ở MỌI
 * điểm trên đường bay, kể cả những điểm nằm GIỮA hai chặng lấy mẫu.
 *
 * ⚠️ VÌ SAO CẦN `guaranteed` CHỨ KHÔNG CHỈ `gap`: 48 chặng lấy mẫu chỉ nhìn thấy 49 điểm; giữa hai
 * điểm ấy camera vẫn đi qua một quãng. Khoảng cách tới một tập hợp là hàm **1-Lipschitz** theo vị
 * trí, nên trên một quãng dài `s` giữa hai chặng đã đo, độ thoáng không thể tụt quá `s/2` dưới
 * mức nhỏ hơn trong hai đầu. Vậy `guaranteed = gap − step/2` là con số ta thật sự được phép hứa.
 *
 * Đây là câu trả lời cho *"có nên quét hình trụ liên tục thay vì 48 chặng không?"* — KHÔNG: siết
 * phép lấy mẫu trong khi mô hình vật cản vẫn là hộp bao THÔ là siết nhầm chỗ. Thứ đúng phải làm là
 * đòi một BIÊN, vì có biên thì độ thưa của phép lấy mẫu **không còn quyết định kết quả** nữa.
 * (Đo thật lúc đặt luật này: chưa có biên thì chuyến bay chật nhất đo được 1,002 trong khi biên
 * cần là 0,184 — tức lời hứa "cách một ô lưới" khi ấy chỉ chứng minh được tới 0,82 ô.)
 */
export function pathGuarantee(from, to, blockers, samples = FLIGHT_SAMPLES) {
  const n = Math.max(1, Math.round(samples));
  let gap = Infinity;
  let step = 0;
  let prev = null;
  for (let i = 0; i <= n; i += 1) {
    const eye = orbitPosition(flightState(from, to, i / n));
    const d = nearestBlocker(eye, blockers);
    if (d < gap) gap = d;
    if (prev) step = Math.max(step, Math.hypot(eye.x - prev.x, eye.y - prev.y, eye.z - prev.z));
    prev = eye;
  }
  return { gap, step, guaranteed: gap - step / 2 };
}

/**
 * Chỗ thoáng NHỎ NHẤT ĐO ĐƯỢC trên đường bay (chưa trừ biên lấy mẫu).
 * Một dòng gọi lại `pathGuarantee` chứ không tự duyệt lần nữa — *một luật một công thức*.
 */
export function pathClearance(from, to, blockers, samples = FLIGHT_SAMPLES) {
  return pathGuarantee(from, to, blockers, samples).gap;
}

/**
 * Lên kế hoạch bay tới một khu phố.
 *
 * @param {object} p
 * @param {object} p.from        trạng thái camera hiện tại `{yaw, pitch, distance, target}`
 * @param {object} p.focus       điểm ngắm mới `{x, y, z}` — tâm hộp bao của công trình được chạm
 * @param {Array}  p.blockers    hộp bao thế giới của MỌI khối trong phố
 * @param {number} [p.viewDistance]
 * @param {number} [p.clearance]
 * @returns {{yaw, pitch, distance, target, clearance, raisedPitch, raisedDistance, blocked}}
 *   `raisedPitch`/`raisedDistance`: đã phải ngẩng lên / lùi ra bao nhiêu so với mong muốn.
 *   `blocked`: hết cách, đành đứng yên (chỉ xảy ra nếu chính chỗ đang đứng cũng đã kẹt).
 */
export function planCityFocus({
  from,
  focus,
  blockers,
  viewDistance = FOCUS_VIEW_DISTANCE,
  clearance = FOCUS_CLEARANCE,
  samples = FLIGHT_SAMPLES,
} = {}) {
  const start = {
    yaw: num(from?.yaw),
    pitch: num(from?.pitch, MIN_PITCH),
    distance: num(from?.distance, viewDistance),
    target: { x: num(from?.target?.x), y: num(from?.target?.y), z: num(from?.target?.z) },
  };
  const target = { x: num(focus?.x), y: num(focus?.y), z: num(focus?.z) };

  // ⚠️ GIỮ NGUYÊN HƯỚNG NHÌN (`yaw`). Xoay ngang trong lúc bay làm mất phương hướng — Đàm vừa chạm
  // vào một căn nhà anh đang nhìn thấy, thì lúc hạ xuống nó phải còn ở đúng phía ấy. Giữ `yaw` cố
  // định cũng khiến phép canh chỉ còn HAI cần gạt (ngẩng lên, lùi ra), tức ít đường trôi hơn.
  const wanted = {
    yaw: start.yaw,
    pitch: Math.max(start.pitch, MIN_PITCH),
    distance: Math.min(viewDistance, start.distance),
    target,
  };

  // ⚠️ Điều kiện nhận một phương án là `guaranteed`, KHÔNG phải `gap` — xem `pathGuarantee`.
  // Con số báo ra ngoài (`clearance`) vẫn là `gap` đo được, vì đó mới là thứ so được với ảnh chụp.
  const tryPlan = (pitch, distance) => {
    const to = { yaw: start.yaw, pitch, distance, target };
    const { gap, guaranteed } = pathGuarantee(start, to, blockers, samples);
    return { to, gap, guaranteed };
  };

  let attempt = tryPlan(wanted.pitch, wanted.distance);
  if (attempt.guaranteed >= clearance) {
    return { ...attempt.to, clearance: attempt.gap, raisedPitch: 0, raisedDistance: 0, blocked: false };
  }

  // (1) LÙI RA XA — GIỮ NGUYÊN GÓC NHÌN, chỉ đứng xa hơn.
  // ⚠️ THỨ TỰ NÀY ĐÃ TỪNG NGƯỢC LẠI (ngẩng trước), và Đàm đổi nó ngày 2026-08-18 khi đóng
  // `TECH_DEBT #46`. Lý lẽ cũ — *"ngẩng thì vật vẫn to bằng ấy, lùi thì vật nhỏ đi"* — đúng về số
  // ĐIỂM ẢNH và bỏ sót một chiều khác: ngẩng quá cao thì vật vẫn to nhưng ta không còn nhìn thấy
  // MẶT ĐỨNG của nó nữa. Ở kỷ 15 nó đẩy góc lên 65,3°, tức cận cảnh ngả thành ảnh chụp từ trực
  // thăng — mái rõ, còn tầng trệt (cả Phase 10) biến mất. Mà lời hứa của chế độ này là *"chi tiết
  // Phase 10–11 nhìn thấy được"*, nên một cách chữa xoá sạch một trong hai phase thì không chữa,
  // nó chỉ dời chỗ hỏng. Đàm: *"(a) giữ được LỜI HỨA, (b) giữ được CON SỐ."*
  // Nhà nhỏ đi bao nhiêu là thứ ĐO ĐƯỢC (và đã đo: 15/15 kỷ vẫn trên ngưỡng mắt); còn "thấy được
  // mặt tiền hay không" thì hoặc có hoặc không.
  let distance = wanted.distance;
  while (distance < start.distance) {
    distance = Math.min(start.distance, distance + DISTANCE_STEP);
    attempt = tryPlan(wanted.pitch, distance);
    if (attempt.guaranteed >= clearance) {
      return {
        ...attempt.to,
        clearance: attempt.gap,
        raisedPitch: 0,
        raisedDistance: distance - wanted.distance,
        blocked: false,
      };
    }
  }

  // (2) NGẨNG LÊN — chỉ khi đã lùi hết cỡ (về đúng khoảng cách đang đứng) mà vẫn kẹt. Lùi hết cỡ
  // KHÔNG hiển nhiên thoáng: điểm ngắm đã dời sang một công trình khác nên chỗ đứng cũng khác chỗ
  // đứng ban đầu, dù khoảng cách bằng nhau.
  let pitch = wanted.pitch;
  while (pitch < MAX_PITCH) {
    pitch = Math.min(MAX_PITCH, pitch + PITCH_STEP);
    attempt = tryPlan(pitch, start.distance);
    if (attempt.guaranteed >= clearance) {
      return {
        ...attempt.to,
        clearance: attempt.gap,
        raisedPitch: pitch - wanted.pitch,
        raisedDistance: start.distance - wanted.distance,
        blocked: false,
      };
    }
  }

  // (3) Đứng yên. Chỉ tới được đây nếu chính chỗ đang đứng đã nằm trong phố — tức thành phố đã
  // phình ra quanh camera, một tình huống không nên im lặng.
  return {
    ...start,
    clearance: nearestBlocker(orbitPosition(start), blockers),
    raisedPitch: 0,
    raisedDistance: 0,
    blocked: true,
  };
}
