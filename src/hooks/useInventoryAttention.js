import useGameStore from '../store/gameStore';
import { hasReadyOpportunity } from '../engine/opportunities';

/**
 * useInventoryAttention — cái chấm "có việc cần xem" trên tab Hành trang.
 *
 * ⚠️ CHỈ CÒN MỘT NGUỒN (round 44, ADR-084). Trước đây nó cộng hai thứ: một CƠ HỘI thật (đủ SP để
 * mở một kỹ năng, đủ gạch để chế một thứ, một di vật sắp lên bậc) và "một huy hiệu chưa xem".
 * Hệ huy hiệu đã bị xoá hẳn — 360 mục, 0 phần thưởng — nên nguồn thứ hai đi theo nó, cùng với cả
 * bộ dấu "đã xem" trong localStorage mà nó phải nuôi.
 * ⚠️ Cái chấm nay chỉ bật khi có thứ Đàm LÀM ĐƯỢC NGAY. Đó là điều nó luôn đáng lẽ phải là: một
 * dấu chấm cho một tin tức là tiếng ồn, một dấu chấm cho một hành động là một lời mời.
 * ⚠️ Và nó sẽ bật thường xuyên hơn hẳn từ vòng này, vì một công trình xong nay trả 1 SP
 * (`engine/skillPointEconomy.js`) — SP thôi nhỏ giọt thì cơ hội thôi hiếm.
 *
 * ⚠️ Selector trả về một BOOLEAN, không phải mảng: zustand so bằng `Object.is`, nên `App` chỉ
 * render lại khi cái chấm THẬT SỰ bật/tắt — không phải mỗi lần một con số tài nguyên nhúc nhích.
 * Đây là gốc app, nó bọc cả cảnh 3D; cho nó render lại theo tài nguyên là trả một cái giá không
 * ai đo được cho một chấm 5 điểm ảnh.
 */
export default function useInventoryAttention() {
  const hasOpportunity = useGameStore((state) => hasReadyOpportunity({
    sp: state.player.sp,
    unlockedSkills: state.player.unlockedSkills,
    activeBook: state.progress.activeBook,
    buildings: state.buildings,
    craftingQueue: state.craftingQueue,
    relics: state.relics,
    relicEvolutions: state.relicEvolutions,
  }));

  return { hasAttention: hasOpportunity };
}
