import useGameStore from '../store/gameStore';
import { describeStreakMilestone } from '../engine/gameMath';

/**
 * "Sắp chạm một cột mốc chuỗi chưa?" — cho MỘT DÒNG ở màn Tập trung.
 *
 * ⚠️ VÌ SAO CẦN ĐƯA NÓ RA ĐÂY. Cơ chế cột mốc chuỗi (kể cả mốc "Bền Vững" cho **bonus VĨNH VIỄN**
 * — phần thưởng mạnh nhất game) đã chạy từ lâu, có test, và được hiện ở `FocusRail`. Nhưng
 * `FocusRail` là cột phải `hidden … lg:flex`, tức **iPhone KHÔNG BAO GIỜ thấy** — mà iPhone là
 * thiết bị Đàm dùng hằng ngày. Một cơ chế đúng, đã trả tiền để làm, mà không tới được người dùng
 * thì bằng không.
 *
 * ⚠️ LẤY TỪNG LÁT STATE RỒI MỚI TÍNH, đừng gọi hàm thuần bên trong selector của zustand: selector
 * trả về một object MỚI mỗi lần chạy ⇒ so sánh tham chiếu luôn khác ⇒ component vẽ lại mỗi lần
 * store nhúc nhích, kể cả vì một trường chẳng liên quan. Cùng lý do đã ghi ở `useNextAction` và
 * `useStageCountdown`.
 */
export default function useStreakMilestone() {
  const currentStreak = useGameStore((s) => s.streak?.currentStreak ?? 0);
  return describeStreakMilestone({ currentStreak });
}
