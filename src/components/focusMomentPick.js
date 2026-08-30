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
  if (stage?.tone === 'celebrate') {
    return { icon: '🎉', text: stage.text, strong: true, onClick: stage.dismiss };
  }
  // Tổng kết tuần là một lời MỜI ĐI CHỖ KHÁC ⇒ im trong lúc đang tập trung, cùng luật
  // `FocusNextAction`. Ba nguồn kia nói lý do NGỒI YÊN nên chúng ở lại.
  if (weeklyUnseen && !sessionInProgress && typeof onOpenWeekly === 'function') {
    return { icon: '🏆', text: 'Tổng kết tuần trước đã xong — xem thử', strong: true, onClick: onOpenWeekly };
  }
  if (streak) {
    return { icon: streak.tone === 'imminent' || streak.permanent ? '🔥' : '·', text: streak.text, strong: streak.tone === 'imminent' || streak.permanent };
  }
  if (stage) {
    const imminent = stage.tone === 'imminent';
    return { icon: imminent ? '🔥' : '◈', text: stage.text, strong: imminent };
  }
  return null;
}
