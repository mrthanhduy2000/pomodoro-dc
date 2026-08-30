/**
 * ĐƯA MẮT (VÀ CON TRỎ) TỚI Ô MỤC TIÊU PHIÊN.
 *
 * ⚠️ VÌ SAO CẦN CÁI NÀY — đo bằng ảnh chụp khung 390px THẬT (2026-08-30).
 * Nút chính của cả app, khi chưa có mục tiêu, là một nút **`disabled`** ghi *"Cần điền mục tiêu"*.
 * Một nút `disabled` thì KHÔNG nhận sự kiện bấm, nên nó là một **ngõ cụt**: nó nói ra điều đang
 * thiếu mà không nói thiếu ở đâu, và bấm vào thì không có gì xảy ra. Ô mục tiêu thật thì nằm ở
 * y≈1400 trên một trang cao 3035px, tức Đàm phải cuộn qua đồng hồ, qua "CHU KỲ NGHỈ", qua "GHI CHÚ
 * PHIÊN" mới thấy — rồi cuộn ngược lên mới bấm được. Mỗi phiên một lần, mãi mãi.
 *
 * ⚠️ ĐÂY KHÔNG PHẢI NỚI LUẬT. Luật "phải có mục tiêu ≥ N ký tự mới được bắt đầu" là CÓ CHỦ ĐÍCH
 * (phiên có đích thì mới chấm được, và AI Coach đọc nó) và nó còn nguyên. Thứ bị gỡ là **ma sát
 * ĐI LẠI**, không phải cái cổng.
 *
 * ⚠️ HỎI DOM CHỨ KHÔNG GIỮ `ref`, và đó là lựa chọn có lý do: hai bố cục khác nhau của màn Tập
 * trung dựng HAI ô nhập khác nhau (`session-goal-panel` ở bố cục gọn · thẻ "Chuẩn bị phiên" ở bố
 * cục rộng), mỗi lúc chỉ một cái được gắn. Một `ref` phải đi qua cả hai nhánh và sẽ lặng lẽ thành
 * `null` ở nhánh nào bị quên — đúng loại hỏng không có gì đỏ lên. Cái mốc chung
 * `[data-session-goal-field]` thì nhánh nào cũng khai, và có test đọc mã nguồn canh cả hai.
 */

/** Mốc chung mà MỌI ô nhập mục tiêu phải khai. Đổi chuỗi này thì phải đổi cả hai chỗ dùng. */
export const SESSION_GOAL_FIELD_SELECTOR = '[data-session-goal-field]';

/**
 * Cuộn tới ô mục tiêu rồi đặt con trỏ vào đó.
 *
 * Thuần về mặt kết quả: trả `true` nếu tìm thấy ô, `false` nếu không — để bên gọi (và bài test)
 * phân biệt được "đã dẫn đi" với "không có gì để dẫn tới", thay vì im lặng nuốt cả hai.
 *
 * @param {Document} [doc] cho phép test bơm một DOM giả; mặc định là `document` thật.
 */
export function jumpToSessionGoal(doc) {
  const target = (doc ?? (typeof document === 'undefined' ? null : document))
    ?.querySelector?.(SESSION_GOAL_FIELD_SELECTOR);
  if (!target) return false;

  // `scrollIntoView` trước, `focus` sau: trên iOS, `focus` tự kéo màn hình theo cách riêng của nó
  // và bàn phím bật lên che mất nửa dưới — cuộn trước thì ô nằm ở giữa khung, không bị bàn phím
  // đẩy khuất. `block: 'center'` chứ không phải `'start'`: ô nhập có nhãn và gợi ý nằm NGAY TRÊN
  // nó, mà `'start'` thì dán mép trên ô vào mép trên khung và giấu hết phần ấy đi.
  target.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  target.focus?.({ preventScroll: true });
  return true;
}
