/**
 * focusMomentPick.js — LUẬT CHỌN của dòng "khoảnh khắc" ở màn Tập trung.
 *
 * ⚠️ TÁCH RA KHỎI `FocusMoment.jsx` VÌ MỘT LÝ DO CỤ THỂ, KHÔNG PHẢI CHO GỌN: dự án bật luật
 * `react-refresh/only-export-components` — một file component chỉ được export component. Muốn
 * `focusMoment.test.js` chấm được THỨ TỰ ƯU TIÊN mà không phải dựng cả React thì hàm quyết định
 * phải sống ở một file thuần. Cùng khuôn với `sessionGoalState.js` và `dailyBonusCopy.js`.
 *
 * ⚠️ HÀM NÀY LÀ TOÀN BỘ PHẦN CÓ THỂ SAI của dòng ấy. Phần còn lại chỉ là tô màu và chọn nhịp;
 * chỗ dễ hỏng — và chỗ đáng canh — là *"khi hai, ba khoảnh khắc cùng đến thì nói cái nào"*.
 */

/**
 * Chọn ra khoảnh khắc đáng nói nhất. THUẦN — nhận dữ liệu đã đọc sẵn, không gọi hook, để
 * `focusMoment.test.js` chấm được thứ tự ưu tiên mà không phải dựng React.
 *
 * @returns {{icon: string, text: string, strong: boolean, onClick?: Function} | null}
 */
export function pickFocusMoment({ stage, streak, weeklyUnseen, sessionInProgress, onOpenWeekly }) {
  // (1) ĂN MỪNG VỪA QUA MỐC — thắng tất cả, vì ăn mừng thì phải NGAY: để lỡ là mất luôn, và nó
  //     là phần thưởng cho chính cái đích mà dòng này đã dựng lên mấy phiên trước.
  if (stage?.tone === 'celebrate') {
    return { icon: '🎉', text: stage.text, strong: true, onClick: stage.dismiss };
  }

  // (2) LÝ DO ĐỂ BẤM BẮT ĐẦU — nói TRƯỚC lời mời đi xem chỗ khác.
  //
  // ⚠️ THỨ TỰ NÀY ĐÃ ĐẢO NGÀY 2026-09-05, VÀ ĐÂY LÀ LÝ DO — không phải "thưởng nào to hơn".
  // Bản trước xếp theo ĐỘ LỚN CỦA PHẦN THƯỞNG (tổng kết cả tuần > mốc chuỗi > chặng), nên tổng
  // kết tuần thắng. Soi trên máy thật thì thấy hậu quả: tài khoản đang ở **1.831/1.867 EP**, tức
  // engine có sẵn câu *"Còn ~2 phiên nữa tới «Khám Phá Tân Thế Giới»"*, và nó bị nuốt mất bởi một
  // lời mời đi đọc chuyện tuần trước.
  //
  // Phép thử phân định: ***câu này có làm Đàm bấm Bắt đầu không?*** Màn này tồn tại để bấm Bắt
  // đầu. "Còn ~2 phiên nữa tới «…»" thì có; "xem tổng kết tuần trước" thì KHÔNG — nó kéo anh
  // sang một màn khác.
  //
  // Và cái quyết định thứ tự phải là TÍNH CẤP THIẾT, không phải độ lớn: *"còn ~2 phiên nữa"* chỉ
  // đúng trong đôi ba ngày rồi hết, còn tổng kết tuần đúng suốt cả tuần và **không hết hạn** (cờ
  // `weeklyUnseen` giữ tới khi Đàm mở). Nhường chỗ cho câu sắp hết hạn thì không mất gì; nhường
  // ngược lại thì mất hẳn.
  if (streak) {
    const strong = streak.tone === 'imminent' || streak.permanent;
    return { icon: strong ? '🔥' : '·', text: streak.text, strong };
  }
  if (stage) {
    const imminent = stage.tone === 'imminent';
    return { icon: imminent ? '🔥' : '◈', text: stage.text, strong: imminent };
  }

  // (3) LỜI MỜI ĐI CHỖ KHÁC — chỉ nói khi không còn lý do nào để bấm Bắt đầu.
  // ⚠️ Im trong lúc đang tập trung (cùng luật `FocusNextAction`): giữa màn hình tập trung mà mời
  //    đi xem chỗ khác là mời Đàm rời khỏi đúng việc anh vừa bấm nút để làm.
  // ⚠️ Nó KHÔNG bị mất: cờ chưa-xem không hết hạn, và chấm đỏ ở nút "Báo cáo tuần" (menu "Thêm"
  //    trên iPhone, thanh bên trên desktop) là lưới an toàn thứ hai — xem ADR-061.
  if (weeklyUnseen && !sessionInProgress && typeof onOpenWeekly === 'function') {
    return { icon: '🏆', text: 'Tổng kết tuần trước đã xong — xem thử', strong: true, onClick: onOpenWeekly };
  }

  return null;
}
