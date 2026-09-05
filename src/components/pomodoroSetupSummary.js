/**
 * pomodoroSetupSummary.js — MỘT DÒNG nói đủ thiết lập phiên đang chạy.
 *
 * ⚠️ VÌ SAO TỒN TẠI (2026-09-02). Bảng thiết lập ở màn Tập trung chiếm **~1.100px trong 2.509px**
 * ở khung 390px và nó mở sẵn ở MỌI lần vào màn — một bảng chỉnh chiếm gần nửa màn hình chính để
 * phục vụ một hành động hiếm (Đàm bắt đầu phiên bằng cùng một thiết lập gần như mọi lần). Nay bảng
 * ấy GẤP LẠI, và dòng này là thứ thay nó trả lời câu *"tôi sắp làm gì"*.
 * ⚠️ NÊN NÓ PHẢI NÓI ĐỦ, KHÔNG ĐƯỢC "TÓM TẮT" CHO ĐẸP: gấp một bảng lại mà dòng thay thế thiếu một
 * cần gạt nào đó thì đó là GIẤU, không phải gấp — và người dùng sẽ phải mở ra mỗi lần để kiểm.
 * ⚠️ CHẾ ĐỘ BẤM GIỜ KHÔNG CÓ SỐ PHÚT ĐỊNH TRƯỚC (đó là định nghĩa của nó), nên in "25′" ở chế độ
 * ấy là nói dối. Hai chế độ ⇒ hai câu khác nhau, không phải một câu có chỗ trống.
 */

export const CHE_DO_BAM_GIO = 'stopwatch';

/**
 * @param {object} p
 * @param {string} p.mode           `'stopwatch'` = Bấm giờ, còn lại = Pomo
 * @param {number} p.focusMinutes   số phút tập trung (chỉ dùng ở Pomo)
 * @param {number} p.shortBreak     nghỉ ngắn (phút)
 * @param {number} p.longBreak      nghỉ dài (phút)
 * @param {boolean} p.strict        kỷ luật phiên đang bật?
 * @returns {string}
 */
export function tomTatThietLap({
  mode, focusMinutes = 0, shortBreak = 0, longBreak = 0, strict = false,
} = {}) {
  const phan = mode === CHE_DO_BAM_GIO
    ? ['Bấm giờ', 'nghỉ theo thời lượng vừa làm']
    : [`${focusMinutes}′`, `nghỉ ${shortBreak}′/${longBreak}′`];
  if (strict) phan.push('kỷ luật');
  return phan.join(' · ');
}
