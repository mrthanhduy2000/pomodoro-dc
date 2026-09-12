/**
 * residentFocus.js — CHẠM VÀO MỘT CƯ DÂN ĐỂ NHÌN GẦN. Round 57, Việc 6.
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`. File này trả lời hai câu —
 * *"hộp chạm của một người đứng ở đây to bằng nào"* và *"người này là ai"* — còn việc bay tới là
 * của `cityFocus.js` (đã có sẵn) và việc vẽ là của `render3d/`.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO FILE NÀY TỒN TẠI — MỘT PHÉP ĐO, KHÔNG PHẢI MỘT Ý THÍCH
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Round 57, Việc 5 đo chiều cao một cư dân trên khung iPhone THẬT (390 CSS × 3 = 1.170 điểm ảnh
 * thật), kỷ 12, bằng ảnh mặt nạ `--mask residents`:
 *
 *     toàn cảnh (mặc định)      **82** điểm ảnh
 *     chế độ đi bộ (6 bước)     **23** điểm ảnh
 *     cận cảnh CÔNG TRÌNH       **22** điểm ảnh
 *
 * ⚠️ HAI SỐ SAU NHỎ HƠN SỐ ĐẦU, VÀ ĐÓ LÀ PHÁT HIỆN. Trực giác nói "đi bộ thì đứng gần hơn nên
 * người phải to hơn" — sai: chế độ đi bộ đặt camera giữa lòng đường, còn người thì rải đều khắp
 * phố, nên người GẦN NHẤT thường vẫn ở cuối phố. Và `cityFocus` bay tới một CÔNG TRÌNH, không bay
 * tới một người. ⇒ **Trước round 57 KHÔNG có chế độ nào cho một cư dân cao quá 82 điểm ảnh.**
 * Ở 82 điểm ảnh, cái đầu cao ~18 và con mắt ~2–3: lông mày, lòng trắng, con ngươi của round 56 đều
 * nằm dưới một điểm ảnh. Tức công của ba vòng 54 · 55 · 56 chưa từng có chỗ nào được nhìn thấy.
 * Cách chữa không phải vẽ thêm chi tiết — là cho Đàm tới gần.
 */

/**
 * Đứng cách một cư dân bao xa, tính bằng ĐƠN VỊ Ô LƯỚI.
 *
 * ⚠️ MỘT QUAN HỆ VỚI CHIỀU CAO NGƯỜI, KHÔNG PHẢI MỘT CON SỐ. `FOCUS_VIEW_DISTANCE = 7,5` của
 * `cityFocus.js` được chọn cho một CÔNG TRÌNH cao cỡ 7 đơn vị; một người cao chưa tới 1 đơn vị, nên
 * dùng lại con số ấy là đứng xa gấp bảy lần mức cần. Hệ số 2,6 cho khuôn mặt chiếm khoảng một phần
 * ba chiều cao khung — đủ gần để thấy chân tóc và con ngươi, đủ xa để còn thấy người ấy đang ĐỨNG
 * TRONG một con phố chứ không phải một cái đầu trôi giữa màn hình.
 */
export const RESIDENT_VIEW_FACTOR = 2.6;

/** Nới hộp chạm: ngón tay trên iPhone không trỏ trúng một hình người rộng 20 điểm ảnh. */
export const RESIDENT_TOUCH_PAD = 0.22;

/**
 * Hộp bao (toạ độ thế giới) của một cư dân đang đứng ở `(x, y, z)` — `y` là MẶT ĐẤT dưới chân.
 *
 * ⚠️ BỀ NGANG LẤY THEO CHIỀU CAO, KHÔNG LẤY THEO BỀ NGANG VAI. Hộp này để NGÓN TAY trỏ vào, không
 * phải để đo hình bóng: một hộp bó sát vai (rộng ~0,2 đơn vị) thì ở cỡ 20 điểm ảnh gần như không
 * chạm trúng được. Nới đều quanh trục đứng cho ra một cái cột dễ trúng, và vì `pickNearest` lấy
 * hộp GẦN NHẤT nên nới rộng không làm người ở xa cướp mất cú chạm của người ở gần.
 */
export function residentBox({ x, y, z }, height, pad = RESIDENT_TOUCH_PAD) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
  if (!(height > 0)) return null;
  const nua = height * 0.5 + pad;
  // ⚠️ ĐÚNG HÌNH DẠNG HỘP CỦA `pick.js` (`minX`/`maxX`… phẳng), KHÔNG PHẢI `{min:{x}}`. Bản đầu của
  // file này khai hộp lồng nhau và `rayBoxDistance` sẽ nhận `undefined` ở mọi trục — tia không bao
  // giờ trúng, cú chạm im lặng không làm gì, và KHÔNG có lỗi nào hiện ra. Đúng họ khuyết tật mà cả
  // dự án này sợ nhất: hợp lệ về cú pháp, chết về ngữ nghĩa.
  return {
    minX: x - nua, maxX: x + nua,
    minY: y - pad, maxY: y + height + pad,
    minZ: z - nua, maxZ: z + nua,
  };
}

/** Điểm camera ngắm vào: NGANG MẶT, không phải giữa thân — nếu không thì mặt nằm ở mép trên khung. */
export function residentEye({ x, y, z }, height, headH) {
  const cao = Number.isFinite(headH) ? headH : height * 0.22;
  return { x, y: y + height - cao * 0.5, z };
}

/** Đứng cách bao xa để một người cao `height` chiếm khoảng một phần ba khung. */
export function residentViewDistance(height, factor = RESIDENT_VIEW_FACTOR) {
  return Math.max(0.6, height * factor);
}

/**
 * "Người này là ai" — ba dòng ngắn cho tấm thẻ hiện lên khi đã bay tới.
 *
 * ⚠️ ĐỌC TỪ `humanStyle.js`, KHÔNG CHÉP LẠI. Tủ đồ của 15 kỷ đã được viết ra một lần ở đó, kèm
 * `country` và `note` là những câu Đàm tự đặt hàng ở vòng 52. Chép sang đây là dựng một sự thật thứ
 * hai về cùng một kỷ, và ngày nào tủ đồ đổi thì tấm thẻ nói sai mà không gì đỏ lên.
 */
const TEN_TRANG_PHUC = Object.freeze({
  tunic: 'áo chùng', robe: 'áo choàng', coat: 'áo khoác dài', suit: 'âu phục',
  wrap: 'khố quấn', dress: 'áo dài', apron: 'áo tạp dề', kandura: 'áo kandura',
});

const TEN_DOI_DAU = Object.freeze({
  none: 'đầu trần', cap: 'mũ vải', brim: 'mũ vành', helm: 'mũ sắt',
  conical: 'nón lá', headcloth: 'khăn trùm', hood: 'mũ trùm',
});

export function residentCaption(style, eraName = null) {
  if (!style) return null;
  const mac = TEN_TRANG_PHUC[style.garment] ?? style.garment ?? '—';
  const doi = TEN_DOI_DAU[style.headgear] ?? style.headgear ?? '—';
  return {
    country: style.country ?? '—',
    era: eraName ?? '—',
    // `note` của `humanStyle.js` là một câu tả nguyên văn ("Stalingrad 1942 — áo bông dày + mũ
    // sắt…"); lấy vế TRƯỚC dấu gạch làm nơi chốn, phần sau đã nằm trong `dress`.
    place: String(style.note ?? '').split('—')[0].trim() || '—',
    dress: `${mac} · ${doi}`,
  };
}

/**
 * Camera phải đứng ở góc `yaw` nào để nhìn THẲNG MẶT một người đang quay theo hướng `angle`.
 *
 * ⚠️ SUY RA TỪ HAI QUY ƯỚC CÓ SẴN, KHÔNG ĐOÁN. (1) `humanPose.js` lấy **+x là hướng đi**, và
 * `sceneGraph` quay hình người bằng `setFromAxisAngle(UP, -angle)`, nên hướng người đang nhìn là
 * `(cos angle, sin angle)` trong mặt phẳng (x, z). (2) `orbitPosition` đặt camera ở
 * `target + (sin yaw, cos yaw) · khoảng cách`. Muốn camera nằm ĐÚNG PHÍA TRƯỚC mặt người thì
 * `(sin yaw, cos yaw) = (cos angle, sin angle)` ⇒ `yaw = π/2 − angle`.
 * ⚠️ Sai dấu ở đây cho ra một cái cận cảnh nhìn vào GÁY — hình học vẫn hợp lệ, không gì đỏ lên, và
 * chỉ một tấm ảnh mới nói ra được. Đó là lý do có bài test đối chiếu thẳng với `orbitPosition`.
 */
export function residentYaw(angle) {
  return Math.PI / 2 - (Number.isFinite(angle) ? angle : 0);
}

/** Camera hạ xuống gần ngang tầm mắt — nhìn một người từ trên xuống là nhìn đỉnh đầu họ. */
export const RESIDENT_PITCH = 0.18;

/** Xoay quanh người bao nhiêu mỗi bước khi phía trước mặt bị vướng. */
export const RESIDENT_YAW_STEP = Math.PI / 9;   // 20°

/**
 * ĐỨNG TRƯỚC MẶT MỘT NGƯỜI — round 57, Việc 6.
 *
 * ⚠️ VÌ SAO KHÔNG DÙNG `planCityFocus`, VÀ ĐÂY LÀ PHÁT HIỆN CỦA CHÍNH VÒNG NÀY. Bản đầu gọi thẳng
 * nó và ảnh chụp ra một mái nhà: `planCityFocus` giữ nguyên `yaw` và chỉ có HAI cần gạt khi vướng
 * — **ngẩng lên** và **lùi ra**. Cả hai đều đúng cho một công trình (nó to, và nhìn chếch xuống vẫn
 * thấy mặt đứng) và đều SAI cho một con người: ngẩng lên là nhìn đỉnh đầu, lùi ra là mất đúng cái
 * vừa muốn nhìn. Đo được: cư dân cao 0,204 đơn vị, xin đứng cách 0,60 — nó trả về **6,10**, tức
 * quay lại đúng cỡ toàn cảnh.
 * ⇒ Với một người, cần gạt đúng là **ĐI VÒNG QUANH**: giữ nguyên khoảng cách và độ cao, xoay sang
 * chỗ trống. Một người đứng giữa phố thì gần như luôn có một hướng thoáng; một công trình thì
 * không, vì nó chính là thứ chắn. Hai loại đích, hai luật.
 *
 * @param {object} arg.resident `{ eye, height, angle }`
 * @param {Function} arg.clearanceOf `(from, to) => số` — khoảng hở của đường bay; truyền vào để
 *   file này không phải biết gì về `blockers` (giữ nó thuần và test được bằng một hàm giả).
 */
export function planResidentFocus({ resident, clearanceOf = null, minClearance = 0.35 } = {}) {
  const eye = resident?.eye;
  if (!eye) return null;
  const distance = residentViewDistance(resident.height);
  const truoc = residentYaw(resident.angle);

  const thu = (yaw) => ({ yaw, pitch: RESIDENT_PITCH, distance, target: eye });
  if (!clearanceOf) return { ...thu(truoc), clearance: Infinity, turned: 0, backed: 0 };

  // (1) Đi vòng quanh: thẳng mặt trước, rồi lệch dần sang hai bên. Lệch ÍT NHẤT trước, và thử cả
  // hai phía ở mỗi mức — nếu chỉ thử một phía thì ta sẽ nhận một góc lệch 140° trong khi phía kia
  // chỉ cần 20°.
  for (let b = 0; b <= 8; b += 1) {
    for (const dau of b === 0 ? [0] : [1, -1]) {
      const yaw = truoc + dau * b * RESIDENT_YAW_STEP;
      const to = thu(yaw);
      const gap = clearanceOf(to);
      if (gap >= minClearance) {
        return { ...to, clearance: gap, turned: dau * b * RESIDENT_YAW_STEP, backed: 0 };
      }
    }
  }

  // (2) Chỉ khi ĐI QUANH CẢ VÒNG vẫn vướng mới lùi — người đứng trong ngõ cụt chẳng hạn.
  let d = distance;
  for (let k = 0; k < 12; k += 1) {
    d += distance * 0.5;
    const to = { ...thu(truoc), distance: d };
    const gap = clearanceOf(to);
    if (gap >= minClearance) return { ...to, clearance: gap, turned: 0, backed: d - distance };
  }
  return { ...thu(truoc), clearance: 0, turned: 0, backed: 0, blocked: true };
}
