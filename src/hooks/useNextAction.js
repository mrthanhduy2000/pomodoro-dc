import { useMemo } from 'react';

import useGameStore from '../store/gameStore';
import { pickNextAction } from '../engine/opportunities';

/**
 * "Việc tiếp theo" cho màn Tập trung — một việc duy nhất, hoặc `null`.
 *
 * ⚠️ LẤY TỪNG MẢNH RỒI `useMemo`, KHÔNG gọi `pickNextAction` ngay trong selector. `pickNextAction`
 * dựng một object MỚI ở mỗi lần gọi, mà zustand so kết quả selector bằng `Object.is` — nên gọi
 * thẳng trong selector nghĩa là "khác nhau ở MỌI lần store nhúc nhích", tức component render lại
 * mỗi giây timer chạy, và với zustand 5 (`useSyncExternalStore`) đó còn là đường vào cảnh báo
 * "getSnapshot should be cached". Mỗi mảnh dưới đây là một tham chiếu ổn định, nên `useMemo` chỉ
 * chạy lại khi có thứ THẬT SỰ đổi. Đây là cùng khuôn `NotificationCenter.jsx` đang dùng.
 *
 * ⚠️ KHÔNG chép lại ba phép đếm ở đây — chúng sống ở `engine/opportunities.js` và đã có bài test
 * canh việc không ai dựng lại chúng lần thứ hai (`opportunities.test.js`, bài "MỘT LUẬT MỘT CÔNG
 * THỨC"). Cái chuông, cái chấm và dòng này phải luôn nói cùng một chuyện.
 */
export default function useNextAction() {
  const sp = useGameStore((state) => state.player.sp);
  const unlockedSkills = useGameStore((state) => state.player.unlockedSkills);
  const activeBook = useGameStore((state) => state.progress.activeBook);
  const research = useGameStore((state) => state.research);
  const blueprints = useGameStore((state) => state.blueprints);
  const buildings = useGameStore((state) => state.buildings);
  const resources = useGameStore((state) => state.resources);
  const resourcesRefined = useGameStore((state) => state.resourcesRefined);
  const craftingQueue = useGameStore((state) => state.craftingQueue);
  const relics = useGameStore((state) => state.relics);
  const relicEvolutions = useGameStore((state) => state.relicEvolutions);

  return useMemo(
    () => pickNextAction({
      sp,
      unlockedSkills,
      activeBook,
      blueprints,
      buildings,
      craftingQueue,
      research,
      resources,
      resourcesRefined,
      relics,
      relicEvolutions,
    }),
    [sp, unlockedSkills, activeBook, blueprints, buildings, craftingQueue, research, resources, resourcesRefined, relics, relicEvolutions],
  );
}
