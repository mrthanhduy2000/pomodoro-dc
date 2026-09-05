import { useCallback, useState } from 'react';

import useGameStore from '../store/gameStore';
import { hasReadyOpportunity } from '../engine/opportunities';
import {
  pickUnseenAchievements,
  readSeenAchievements,
  writeSeenAchievements,
} from '../engine/navAttention';

/**
 * Cái chấm trên tab "Hành trang": tab ấy gộp ba màn (Kỹ năng · Kho báu · Thành tích), nên gộp
 * xong thì ba màn ấy KHÔNG còn tự nói được là chúng có việc — trước đây mỗi màn là một mục trên
 * thanh điều hướng, nay chúng nằm sau một lớp. Cái chấm là thứ trả lại tín hiệu đó.
 *
 * Hai nguồn, mỗi nguồn trỏ vào một tab con:
 *   · `hasReadyOpportunity` (dùng CHUNG với cái chuông thông báo) → Kỹ năng / Kho báu
 *   · thành tích đã mở khoá mà chưa xem                          → Thành tích
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
    blueprints: state.blueprints,
    buildings: state.buildings,
    craftingQueue: state.craftingQueue,
    research: state.research,
    resources: state.resources,
    resourcesRefined: state.resourcesRefined,
    relics: state.relics,
    relicEvolutions: state.relicEvolutions,
  }));

  const unlockedAchievements = useGameStore((state) => state.achievements.unlocked);

  const storage = typeof window === 'undefined' ? null : window.localStorage;

  // Đọc MỘT lần rồi giữ trong state: mỗi lần đọc là một `JSON.parse`, mà cái này bị hỏi ở mọi
  // lần render của gốc app.
  //
  // ⚠️ VIỆC GIEO DẤU LẦN ĐẦU PHẢI CHỜ STORE NẠP XONG. Gieo trước khi nạp thì dấu là một danh
  // sách RỖNG, và ngay sau đó mọi thành tích Đàm đã có từ trước bỗng thành "chưa xem" — đúng cái
  // chấm sáng oan mà cả cơ chế này sinh ra để tránh. `persist` của zustand đọc localStorage ĐỒNG
  // BỘ nên nhánh `hasHydrated() === false` gần như không bao giờ chạy; nó ở đây làm lưới, và khi
  // nó chạy thì dấu chỉ hoãn tới lần `markAchievementsSeen` đầu tiên chứ không sai.
  const [seenIds, setSeenIds] = useState(() => {
    const stored = readSeenAchievements(storage);
    if (stored !== null) return stored;
    if (!useGameStore.persist?.hasHydrated?.()) return null;
    return writeSeenAchievements(storage, useGameStore.getState().achievements.unlocked ?? []);
  });

  const markAchievementsSeen = useCallback(() => {
    const unlocked = useGameStore.getState().achievements.unlocked ?? [];
    setSeenIds((current) => {
      // Không có gì mới thì đừng ghi lại — tránh đập vào localStorage ở mỗi lần render.
      if (current !== null && pickUnseenAchievements(unlocked, current).length === 0) return current;
      return writeSeenAchievements(storage, unlocked);
    });
  }, [storage]);

  const unseenAchievements = pickUnseenAchievements(unlockedAchievements, seenIds);

  return {
    hasAttention: hasOpportunity || unseenAchievements.length > 0,
    unseenAchievementCount: unseenAchievements.length,
    markAchievementsSeen,
  };
}
