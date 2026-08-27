/**
 * cityBackdropScrim.js — HÌNH DÁNG CỦA LỚP PHỦ GIỮ-CHỮ-ĐỌC-ĐƯỢC ở trang chủ.
 *
 * Tách khỏi `CityBackdrop.jsx` vì đây là DỮ LIỆU THUẦN có thể sai theo kiểu đo được — mà một chuỗi
 * CSS nằm trong JSX thì không bài test nào chạm tới được (`CityScene3D.test.js` phải đọc mã nguồn
 * như văn bản, đúng cái cách chỉ nên dùng khi hết đường).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * VÌ SAO CÓ FILE NÀY — MỘT CHÚ THÍCH ĐÚNG, MỘT CON SỐ SAI
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `CityBackdrop.jsx` từ đầu đã tuyên bố hai ý định, và chúng KHÔNG mâu thuẫn nhau:
 *
 *   (1) "chữ ở đây là ĐỒNG HỒ ĐẾM NGƯỢC — thứ Đàm nhìn nhiều nhất" ⇒ phải đọc được;
 *   (2) "thành phố lộ ra rõ nhất ở khoảng trống phía dưới — đúng chỗ chẳng có chữ gì".
 *
 * Ý định (1) đạt. Ý định (2) thì KHÔNG, và mãi tới 2026-08-13 mới đo ra: sáu chặng ngày ở trang
 * chủ chỉ cách nhau **tối đa 14/255**, trong khi ngưỡng mắt bắt đầu phân biệt được là 12. Tức cả
 * vòng ngày mà `daylight.js` dựng ra gần như không tới được màn hình Đàm nhìn nhiều nhất.
 *
 * Nguyên nhân không phải người viết cẩu thả — mà là **các mốc chuyển sắc được chọn theo một niềm
 * tin về chỗ chữ đứng, và niềm tin đó sai**. Chú thích cũ ghi dải đậm ở trên là "nơi có tiêu đề và
 * mặt đồng hồ". Đo thật (`textmap3.mjs`, có bài kiểm ngược) thì:
 *
 *   • Mặt đồng hồ `25:00` **KHÔNG nằm trên nền** — nó nằm trong một thẻ ĐẶC (`rgb(255,253,250)`),
 *     ở tận **82%** chiều cao lớp phủ. Lớp phủ chưa từng bảo vệ nó, và cũng không cần.
 *   • Chữ THẬT SỰ nằm trên nền chỉ là khối lời chào ở đầu trang:
 *        – máy bàn (1280): y **7% → 21%**
 *        – điện thoại (≤767): y **31% → 48%**  ← thấp hơn hẳn, vì thẻ đồng hồ đẩy nó xuống
 *
 * Nghĩa là từ mốc đó trở xuống, lớp phủ **không làm việc gì cho khả năng đọc** — nó chỉ xoá thành
 * phố. Mà ở mốc 38% nó vẫn còn 80%, ở 72% vẫn còn 55%.
 *
 * ⚠️ VÌ SAO PHA VỀ MÀU PHẲNG LẠI ĐẮT ĐỎ ĐÚNG Ở CHỖ NÀY: `var(--canvas)` là một màu PHẲNG. Pha bất
 * kỳ màu nào về phía nó thì **độ tươi tụt theo đúng tỉ lệ pha**, còn hình khối (tín hiệu ĐỘ SÁNG)
 * vẫn sống. Vòng ngày lại là tín hiệu **SẮC** gần như thuần tuý ⇒ lớp phủ lọc mất đúng thứ cần giữ.
 * Đó là lý do bóng dáng thành phố vẫn thấy được mà màu trời thì không.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * LUẬT BẤT DI BẤT DỊCH CỦA FILE NÀY
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * **Ở MỌI ĐỘ SÂU CÓ CHỮ, lớp phủ mới KHÔNG BAO GIỜ nhạt hơn bản đã chạy trước 2026-08-13.**
 * Không phải "nhạt hơn một chút cũng được" — là KHÔNG BAO GIỜ. Vì thế đây tuyệt đối không phải một
 * cuộc đánh đổi "đẹp đổi lấy dễ đọc": khả năng đọc giữ nguyên từng phần nghìn, chỉ có phần KHÔNG
 * có chữ mới được mở ra. `cityBackdropScrim.test.js` khoá luật này bằng cách giữ nguyên hồ sơ CŨ
 * làm mốc so sánh và quét từng phần trăm một.
 *
 * ⚠️ ĐỔI BỐ CỤC TRANG CHỦ THÌ PHẢI ĐO LẠI. Nếu sau này có chữ mới đặt thẳng lên nền ở sâu hơn mốc
 * `GUARD_END_PCT`, hồ sơ này thành sai — và sai KHÔNG có gì đỏ cả, chỉ là chữ khó đọc dần. Cách đo
 * lại: `textmap3.mjs` (chạy kèm `--selftest` để chắc bộ phân loại còn phân loại được).
 */

/**
 * Chữ nằm TRỰC TIẾP trên nền kết thúc ở đâu (phần trăm chiều cao lớp phủ) — SỐ ĐO, không phải ước
 * lượng. Giữ lại để bài test đối chiếu mốc bảo vệ với số đo, thay vì tin một hằng số rơi từ trên
 * trời xuống.
 */
export const TEXT_ENDS_PCT = Object.freeze({ desktop: 21, phone: 48 });

/**
 * Mốc bảo vệ: tới đây thì lớp phủ vẫn đậm y như cũ. Đặt CAO HƠN số đo ở trên một khoảng đệm, vì
 * cỡ chữ đổi theo thiết lập hệ điều hành và một dòng lời chào dài có thể xuống thêm một hàng.
 */
export const GUARD_END_PCT = Object.freeze({ desktop: 28, phone: 55 });

/**
 * Hồ sơ ĐÃ CHẠY trước 2026-08-13, giữ nguyên làm MỐC SO SÁNH. Đây không phải mã chết: bài test
 * dùng chính nó để chứng minh hồ sơ mới không nhạt hơn ở bất kỳ độ sâu nào có chữ.
 */
export const LEGACY_STOPS = Object.freeze([[0, 92], [38, 80], [72, 55], [100, 34]]);

/**
 * Hồ sơ MỚI. Đọc: `[phần trăm chiều cao, phần trăm pha về var(--canvas)]`.
 *
 * Hai hồ sơ riêng vì chữ đứng ở hai chỗ khác nhau — và `CityBackdrop` VỐN ĐÃ biết mình đang ở khung
 * nào (`useIsPhone()`, sẵn có để quyết định `still`), nên không phải thêm hạ tầng gì mới.
 *
 * ⚠️ Các mốc trước `GUARD_END_PCT` được chọn để nằm ĐÚNG TRÊN hoặc TRÊN đường cũ:
 *   • máy bàn: đoạn cũ 0→38 là đường thẳng 92→80; mốc mới 0→28 là 92→84 ⇒ luôn đậm hơn (tối đa
 *     0,84 điểm ở p=28) — không bao giờ nhạt hơn.
 *   • điện thoại: giữ nguyên 0:92 và 38:80 của bản cũ, rồi 38→55 là 80→68, trong khi đường cũ tới
 *     55 là 67,5 ⇒ cũng luôn đậm hơn.
 * Sau mốc bảo vệ thì thả nhanh về 0: chỗ đó không có chữ, nên không có gì để đánh đổi.
 */
export const SCRIM_STOPS = Object.freeze({
  desktop: Object.freeze([[0, 92], [28, 84], [46, 44], [72, 15], [100, 0]]),
  phone: Object.freeze([[0, 92], [38, 80], [55, 68], [74, 30], [88, 11], [100, 0]]),
});

/**
 * Nội suy tuyến tính — đúng phép mà `linear-gradient` của CSS dùng giữa hai mốc, nên con số bài
 * test đọc được chính là con số trình duyệt vẽ ra.
 */
export function opacityAt(stops, pct) {
  const p = Math.max(0, Math.min(100, pct));
  for (let i = 1; i < stops.length; i += 1) {
    const [x0, y0] = stops[i - 1];
    const [x1, y1] = stops[i];
    if (p <= x1) {
      if (x1 === x0) return y1;
      return y0 + ((y1 - y0) * (p - x0)) / (x1 - x0);
    }
  }
  return stops[stops.length - 1][1];
}

/**
 * Thành phố còn lại bao nhiêu phần sau khi qua CẢ HAI lớp làm mờ.
 *
 * ⚠️ Đây là chỗ dễ tính thiếu nhất, và là lý do bản gốc mờ hơn người viết tưởng: có **hai** lớp
 * nhân vào nhau, không phải một. `BACKDROP_OPACITY` (0,5) làm mờ thành phố TRƯỚC, rồi lớp phủ mới
 * pha tiếp. Nhìn riêng con số 34% ở đáy thì tưởng "còn hai phần ba", thực tế còn 0,5 × 0,66 = 0,33.
 */
export function cityPresenceAt(stops, pct, backdropOpacity) {
  return backdropOpacity * (1 - opacityAt(stops, pct) / 100);
}

/**
 * Dựng chuỗi `linear-gradient` cho `style`.
 *
 * Dùng `color-mix` với `var(--canvas)` chứ KHÔNG phải mã màu chốt cứng: app có 2 theme × 5 skin,
 * một mã cứng sẽ sai ở 9/10 tổ hợp. Đây vẫn nằm trong luật "chỉ dùng biến CSS" và không cần token mới.
 */
export function buildScrimGradient(isPhone) {
  const stops = isPhone ? SCRIM_STOPS.phone : SCRIM_STOPS.desktop;
  const parts = stops.map(
    ([at, mix]) => `color-mix(in srgb, var(--canvas) ${mix}%, transparent) ${at}%`,
  );
  return `linear-gradient(to bottom, ${parts.join(', ')})`;
}
