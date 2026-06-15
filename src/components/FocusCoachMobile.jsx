/**
 * FocusCoachMobile — thẻ AI Coach gọn cho màn Tập trung trên ĐIỆN THOẠI.
 * (Thẻ Coach ở cột phải chỉ hiện trên màn rộng `lg`, nên iPhone không thấy nó.)
 * Chỉ hiện khi CHƯA chạy phiên — để không phá màn "Focus tĩnh khi chạy".
 * Dùng chung logic qua useCoachInsight, chỉ thêm lớp `lg:hidden`.
 */
import useCoachInsight from '../hooks/useCoachInsight';
import CoachCard from './CoachCard';

export default function FocusCoachMobile({ hidden = false, ...goalProps }) {
  const coach = useCoachInsight(goalProps);
  if (hidden) return null;
  return <CoachCard text={coach.text} reason={coach.reason} className="mt-4 lg:hidden" />;
}
