/**
 * focusMomentPick.js — LUẬT CHỌN của dòng "khoảnh khắc" ở màn Tập trung.
 *
 * ⚠️ NĂM NGUỒN, MỘT DÒNG (2026-08-30, vòng 20). Trước vòng này màn Tập trung có BA dòng nhắc độc
 * lập nhau — `FocusCityTease` · `FocusNextAction` · `FocusMoment` — và ở tài khoản đã chơi lâu thì
 * cả ba cùng nổ. Đo ở khung 390px: cụm ba dòng cao **84px**, và nó đẩy hàng nút chính xuống
 * y=773…815 trong khi thanh tab NỔI (nền ĐỤC `rgb(247,246,242)`, không alpha) bắt đầu ở y=774 ⇒
 * **nút Đàm mở app để bấm bị che gần trọn, chỉ lòi ra 1px**. Không cổng nào kêu: build xanh, lint
 * sạch, test xanh — chỉ ảnh chụp đúng khung 844px thấy (ảnh `--full` KHÔNG thấy, vì nó là ảnh
 * ghép nên thanh `fixed` không nằm đè lên gì).
 *
 * ⇒ `FocusNextAction` nhập vào đây thành nguồn thứ năm. Còn lại đúng HAI dòng, vai trò tách bạch:
 *   · `FocusCityTease` = lý do NGỒI YÊN ("phiên này đang đẩy cái gì tới đâu")
 *   · dòng này          = một lời MỜI duy nhất, chọn từ năm nguồn
 * Trần xấu nhất do đó là 2 dòng ~41px thay vì 3 dòng 84px, và nó bị khoá bằng CẤU TRÚC chứ không
 * bằng "hiếm khi cả ba cùng có gì để nói".
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
 * @returns {{icon: string, text: string, strong: boolean, badge?: string|null, onClick?: Function} | null}
 */
export function pickFocusMoment({
  stage, streak, weeklyUnseen, sessionInProgress, onOpenWeekly, nextAction, onNavigate,
}) {
  if (stage?.tone === 'celebrate') {
    return { icon: '🎉', text: stage.text, strong: true, onClick: stage.dismiss };
  }
  // Tổng kết tuần là một lời MỜI ĐI CHỖ KHÁC ⇒ im trong lúc đang tập trung. Ba nguồn kia nói lý
  // do NGỒI YÊN nên chúng ở lại.
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
  // "Việc tiếp theo" đứng CUỐI vì nó là nguồn DUY NHẤT không có hạn: một điểm kỹ năng chưa tiêu
  // thì tuần sau tiêu vẫn thế, còn bốn nguồn trên đều mất đi nếu bỏ lỡ (lời chúc mừng trôi qua,
  // cửa sổ tổng kết tuần đóng, chuỗi đứt, chặng qua mốc). Nhường trước cho thứ hết hạn.
  // Nó cũng là lời MỜI ĐI CHỖ KHÁC ⇒ im khi đang chạy phiên, cùng luật với tổng kết tuần.
  if (nextAction && !sessionInProgress && typeof onNavigate === 'function') {
    return {
      icon: nextAction.icon,
      text: nextAction.text,
      strong: false,
      badge: nextAction.othersCount > 0 ? `+${nextAction.othersCount}` : null,
      onClick: () => onNavigate(nextAction.action),
    };
  }
  return null;
}
