/**
 * FocusCoachMobile — thẻ AI Coach gọn cho màn Tập trung trên ĐIỆN THOẠI.
 * (Thẻ Coach ở cột phải chỉ hiện trên màn rộng `lg`, nên iPhone không thấy nó.)
 * Chỉ hiện khi CHƯA chạy phiên — để không phá màn "Focus tĩnh khi chạy".
 * Phong cách ĐỌC SỐ: lấy phân tích số liệu thật qua useCoachInsight (đã bỏ giọng
 * cảm xúc 2026-06-21).
 */
import useCoachInsight from '../hooks/useCoachInsight';
import CoachCard from './CoachCard';
import CoachChat from './CoachChat';
import FocusReport from './FocusReport';

export default function FocusCoachMobile({ hidden = false, ...goalProps }) {
  const coach = useCoachInsight(goalProps);

  if (hidden) return null;
  return (
    <div className="mt-4 lg:hidden">
      <CoachCard
        text={coach.text}
        reason={coach.reason}
        tone="đọc số"
      />
      <CoachChat {...goalProps} />
      <FocusReport {...goalProps} />
    </div>
  );
}
