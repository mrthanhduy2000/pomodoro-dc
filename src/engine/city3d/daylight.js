/**
 * daylight.js — THÀNH PHỐ ĐỔI THEO GIỜ TRONG NGÀY.
 *
 * THUẦN: không three, không DOM, và ĐẶC BIỆT là **không `Date`** — hàm nhận GIỜ làm tham số.
 * Cùng kỷ luật đã dùng cho `residents.js` và cho cả tầng engine của AI Coach: lấy giờ là việc của
 * tầng ngoài (`getVietnamHour` ở `engine/time.js`), còn ở đây chỉ có luật thuần, test được bằng
 * `node --test` với bất kỳ giờ nào mà không phải giả lập đồng hồ.
 *
 * ⚠️ VÌ SAO ĐÂY LÀ TÍNH NĂNG LỚN NHẤT CỦA PHASE 3D, DÙ CHỈ LÀ VÀI CON SỐ:
 * Cho tới giờ, thành phố của Đàm trông y hệt nhau ở mọi thời điểm. Mở lúc 6 giờ sáng hay 11 giờ
 * đêm cũng là đúng một bức ảnh. Cho nó đổi theo giờ nghĩa là **mỗi lần mở app là một cảnh khác** —
 * bình minh hồng, trưa gắt, chiều vàng, đêm xanh có đèn cửa sổ. Không thêm một hình khối nào, không
 * thêm một byte state nào, mà thành phố thôi là ảnh chụp và thành một NƠI CHỐN đang trôi qua thời
 * gian cùng Đàm.
 *
 * ⚠️ GIỜ VIỆT NAM, KHÔNG PHẢI GIỜ MÁY. Đàm ở Việt Nam; một cái máy để nhầm múi giờ không được phép
 * biến buổi chiều thành nửa đêm. Toàn dự án đã theo luật này (`engine/time.js`) — 3D không ngoại lệ.
 */

/**
 * Các chặng trong ngày. Ranh giới chọn theo CẢM NHẬN chứ không theo thiên văn: 17 giờ ở Việt Nam
 * chưa tối nhưng nắng đã vàng rõ, còn 19 giờ thì đã tối hẳn quanh năm.
 */
export const DAY_PHASES = ['dawn', 'morning', 'noon', 'afternoon', 'dusk', 'night'];

/** Giờ nào thuộc chặng nào. Tra bảng chứ không chuỗi if — dễ đọc và dễ sửa hơn. */
const PHASE_BY_HOUR = [
  // 0  1  2  3  4  5
  'night', 'night', 'night', 'night', 'night', 'dawn',
  // 6  7  8  9  10 11
  'dawn', 'morning', 'morning', 'morning', 'noon', 'noon',
  // 12 13 14 15 16 17
  'noon', 'noon', 'afternoon', 'afternoon', 'afternoon', 'dusk',
  // 18 19 20 21 22 23
  'dusk', 'night', 'night', 'night', 'night', 'night',
];

/**
 * Hồ sơ ánh sáng của từng chặng.
 *
 *  • `sunAltitude`  cao độ mặt trời (0 = sát chân trời, 1 = đỉnh đầu). Quyết định ĐỘ DÀI bóng đổ.
 *  • `sunWarmth`    −1 lạnh … +1 ấm. Bình minh/hoàng hôn ấm rực, trưa gần trắng, đêm lạnh.
 *  • `sunEnergy`    cường độ nắng, nhân vào đèn mặt trời.
 *  • `fillEnergy`   cường độ đèn nền. ⚠️ Ban đêm phải cao hơn ban ngày RẤT NHIỀU — xem ghi chú
 *                   "tối hai lần" ngay dưới bảng.
 *  • `skyHue`/`skyPull`         ĐỈNH trời bị kéo về góc màu nào, mạnh bao nhiêu (0–1).
 *  • `horizonHue`/`horizonPull` CHÂN trời bị kéo về góc màu nào, mạnh bao nhiêu (0–1).
 *  • `skySaturation` hệ số nhân độ tươi bầu trời.
 *  • `windowsLit`   có bật đèn cửa sổ không.
 *  • `lampEnergy`   độ mạnh của những vũng sáng ấm hắt xuống chân công trình (0 = không có đèn).
 *
 * ⚠️ VÌ SAO LÀ "KÉO VỀ MỘT ĐÍCH" CHỨ KHÔNG PHẢI "CỘNG THÊM N ĐỘ" — đây là lỗi đã thấy tận mắt ở
 * ảnh chụp. Bản đầu dùng `skyShift` cộng thẳng vào góc màu. Nhưng góc màu XUẤT PHÁT của bầu trời
 * khác nhau tuỳ theme (theme sáng ~40° vàng ấm, theme tối ~231° lam) — cùng một phép "−46°" đẩy
 * trời đêm từ lam sang **lục lam**, và cả mặt đất bị đèn bán cầu nhuộm xanh ngọc như dưới nước.
 * Cộng offset chỉ đúng khi mọi điểm xuất phát giống nhau; ở đây thì không. Nói "kéo về 232°" thì
 * đúng ở mọi điểm xuất phát.
 *
 * ⚠️ `sunAltitude` KHÔNG bao giờ xuống 0 kể cả ban đêm: ở 0 thì mặt trời nằm đúng đường chân trời,
 * bóng đổ dài vô hạn và khung bóng (`shadow.camera`) không chứa nổi — cảnh sẽ đầy vệt bóng cụt.
 *
 * ⚠️ "TỐI HAI LẦN" — VÌ SAO `night.fillEnergy` LÀ 3,4 CHỨ KHÔNG PHẢI ~1,4 NHƯ TRỰC GIÁC MÁCH BẢO.
 * Bản đầu để 1,45 và ảnh chụp thử lúc 22 giờ ra một bức gần như ĐEN THUI: đo pixel mặt đất được
 * `#030401`, tức gần đúng số 0. Truy ra thì đêm bị làm tối ở HAI CHỖ ĐỘC LẬP mà cộng dồn lên nhau:
 *   (1) giờ đêm bật `isDark` ⇒ toàn bộ SƠN (tường, mái, đất) nhảy sang nhánh màu tối — riêng cái
 *       này đã tối đi ~2,9 lần so với ban ngày;
 *   (2) đèn bán cầu lấy MÀU từ chính bầu trời đêm, mà trời đêm thì đậm ⇒ ánh sáng chiếu vào cũng
 *       tối thêm ~2 lần nữa.
 * Nhân hai lại là ~5,8 lần, trong khi `fillEnergy` chỉ bù có 1,45 ⇒ tổng cộng vẫn tối gấp 9 lần
 * ban trưa. Bài học tổng quát: **`fillEnergy` phải bù cho cả độ đậm của MÀU ĐÈN, không chỉ cho ý
 * đồ "đêm thì tối hơn ngày"** — cường độ và màu là hai thừa số nhân nhau, không phải hai lựa chọn
 * thay thế nhau. Cùng họ với bài học chiaroscuro ở `sceneGraph.js`, chỉ là ở tầng khác.
 *
 * ⚠️ `lampEnergy` là thứ làm cảnh đêm ĐẸP chứ không chỉ NHÌN ĐƯỢC. Đèn cửa sổ vẽ bằng vật liệu tự
 * phát sáng nên nó KHÔNG rọi ra ngoài — ô cửa sáng trưng mà chân tường vẫn tối om, đọc ra "hình dán"
 * chứ không ra "trong nhà có người". Vài vũng sáng ấm hắt xuống quanh chân công trình là chi tiết
 * duy nhất biến bức tranh đêm thành một nơi CÓ NGƯỜI Ở.
 *
 * ⚠️ VÌ SAO ĐỈNH TRỜI VÀ CHÂN TRỜI CÓ ĐÍCH RIÊNG (`skyHue` vs `horizonHue`) — sửa sau bản quét đủ
 * 15 kỷ × 6 chặng, và là lỗi lộ ra ngay ở cột đầu tiên của bảng quét.
 * Trước đây cả vòm trời chung MỘT đích, chân trời kéo đủ sức còn đỉnh trời chỉ 0,45 sức. Hệ quả
 * đo được: 8 giờ sáng chân trời ra `#cad0d0` — độ tươi **0,06**, tức một dải XÁM CHẾT, vì sắc ấm
 * 40° bị kéo nửa đường sang lam 202° thì rơi đúng vào vùng trung tính ở giữa. Còn lúc bình minh/
 * hoàng hôn thì ngược lại: đích ấm kéo cả ĐỈNH trời sang nâu, ra một mái vòm nâu-ô-liu.
 * Sự thật về bầu trời: **đỉnh trời LUÔN lạnh, chân trời LUÔN là chỗ giữ hơi ấm** — kể cả giữa
 * trưa (mù nhiệt vàng nhạt) lẫn giữa đêm (chỉ khi đó chân trời mới lạnh theo). Một đích chung
 * không thể diễn tả nổi hai vai ngược nhau đó, nên tách hẳn thành hai đích. Nhờ vậy `skyPull` nay
 * kéo được MẠNH cho đỉnh trời mà không kéo chân trời xuống xám.
 */
export const DAYLIGHT_PROFILES = {
  //           cao độ nắng    hơi ấm       nắng        đèn nền     ĐỈNH trời          CHÂN trời              tươi   cửa sổ  đèn sân
  dawn:      { sunAltitude: 0.22, sunWarmth:  0.85, sunEnergy: 0.72, fillEnergy: 0.95, skyHue: 232, skyPull: 0.42, horizonHue:  18, horizonPull: 0.70, skySaturation: 1.15, windowsLit: true,  lampEnergy: 0.35 },
  morning:   { sunAltitude: 0.55, sunWarmth:  0.40, sunEnergy: 0.95, fillEnergy: 1.00, skyHue: 206, skyPull: 0.58, horizonHue:  44, horizonPull: 0.26, skySaturation: 1.02, windowsLit: false, lampEnergy: 0    },
  // ⚠️ Giữa trưa KHÔNG kéo cao độ nắng lên sát đỉnh đầu nữa (0,92 → 0,84). Nghe thì "trưa là mặt
  // trời trên đỉnh đầu", nhưng ở 0,92 bóng đổ ngắn gần bằng không và mọi khối mất hết mặt tối —
  // cả bảng quét thì cột 12 giờ là cột PHẲNG NHẤT, nhạt nhẽo nhất, đúng thứ Đàm gọi là "bị chán".
  // Hạ một chút thì bóng vẫn ngắn (vẫn đọc ra giữa trưa) mà khối lại có mặt sáng/mặt tối trở lại.
  // Đèn nền cũng hạ theo (0,92 → 0,80): giữa trưa trời quang thì bóng SÂU, không phải bị đèn nền
  // xoá mờ — đây chính là chiaroscuro, đúng nguyên lý đã ghi ở `sceneGraph.js`.
  noon:      { sunAltitude: 0.84, sunWarmth:  0.05, sunEnergy: 1.10, fillEnergy: 0.80, skyHue: 212, skyPull: 0.70, horizonHue:  48, horizonPull: 0.22, skySaturation: 1.00, windowsLit: false, lampEnergy: 0    },
  afternoon: { sunAltitude: 0.48, sunWarmth:  0.55, sunEnergy: 1.00, fillEnergy: 1.00, skyHue: 214, skyPull: 0.44, horizonHue:  34, horizonPull: 0.52, skySaturation: 1.05, windowsLit: false, lampEnergy: 0    },
  dusk:      { sunAltitude: 0.18, sunWarmth:  1.00, sunEnergy: 0.78, fillEnergy: 1.05, skyHue: 238, skyPull: 0.46, horizonHue:  10, horizonPull: 0.78, skySaturation: 1.25, windowsLit: true,  lampEnergy: 0.60 },
  // Đêm: chặng DUY NHẤT mà chân trời cũng lạnh theo đỉnh trời — kéo cả hai về LAM SÂU (không phải
  // lục lam, không phải tím). Nắng yếu nhưng KHÔNG tắt — đó là ánh trăng, và không có nó thì công
  // trình mất hết hình khối, chỉ còn những ô cửa sáng lơ lửng.
  night:     { sunAltitude: 0.40, sunWarmth: -0.70, sunEnergy: 0.42, fillEnergy: 3.40, skyHue: 232, skyPull: 0.80, horizonHue: 226, horizonPull: 0.74, skySaturation: 0.85, windowsLit: true,  lampEnergy: 1.00 },
};

/** Giờ (0–23) → tên chặng. Giờ rác → 'noon' (chặng trung tính nhất, không bao giờ trông như lỗi). */
export function phaseForHour(hour) {
  if (!Number.isFinite(hour)) return 'noon';
  const h = Math.floor(hour);
  if (h < 0 || h > 23) return 'noon';
  return PHASE_BY_HOUR[h];
}

/**
 * Hồ sơ ánh sáng cho một giờ cụ thể.
 *
 * ⚠️ KHÔNG NỘI SUY GIỮA HAI CHẶNG, và đây là lựa chọn có chủ ý. Nội suy mượt nghe hay hơn, nhưng
 * cảnh 3D chỉ được DỰNG LẠI khi bố cục đổi — nó không theo dõi đồng hồ từng phút. Nội suy sẽ tạo ra
 * một giá trị "đúng tại lúc mở app" rồi đứng im ở đó, tức là tốn công tính cho một thứ không ai
 * thấy chuyển động. Sáu chặng rời rạc cho ra đúng cùng trải nghiệm ("sáng nay khác chiều qua") mà
 * đơn giản hơn hẳn và test được bằng bảng.
 *
 * @param {number} hour giờ theo múi giờ Việt Nam, 0–23
 */
export function deriveDaylight(hour) {
  const phase = phaseForHour(hour);
  return { phase, ...DAYLIGHT_PROFILES[phase] };
}

/**
 * Hướng mặt trời cho một cao độ, giữ nguyên PHƯƠNG VỊ đã chọn ở `sceneGraph.js`.
 *
 * ⚠️ CHỈ ĐỔI CAO ĐỘ, KHÔNG ĐỔI PHƯƠNG VỊ. Nghe thì "mặt trời thật phải chạy từ đông sang tây",
 * nhưng phương vị là thứ quyết định nắng rọi từ BÊN hay từ SAU LƯNG người xem — và cả Phase 3C đã
 * dành để sửa đúng chuyện đó (xem `SUN_DIRECTION`). Cho phương vị chạy tự do thì vài giờ trong
 * ngày sẽ rơi lại đúng cái bẫy "đèn flash" làm hình khối bẹp dí. Đổi cao độ là đủ để bóng dài ra
 * lúc sáng sớm/chiều muộn và ngắn lại lúc trưa — tức là đủ để mắt đọc ra thời điểm trong ngày.
 *
 * @param {{x:number,y:number,z:number}} base hướng gốc (đã chuẩn hoá)
 * @param {number} altitude 0 = sát chân trời … 1 = đỉnh đầu
 * @returns {{x:number, y:number, z:number}} hướng mới, đã chuẩn hoá
 */
export function sunDirectionAt(base, altitude) {
  const alt = Math.min(1, Math.max(0.12, Number.isFinite(altitude) ? altitude : 0.5));
  // Phương vị = hình chiếu của hướng gốc lên mặt phẳng ngang.
  const flat = Math.hypot(base.x, base.z) || 1;
  const ax = base.x / flat;
  const az = base.z / flat;

  // `altitude` là sin của góc nâng; phần còn lại chia cho hai trục ngang theo đúng phương vị cũ.
  const horizontal = Math.sqrt(Math.max(0, 1 - alt * alt));
  return { x: ax * horizontal, y: alt, z: az * horizontal };
}
