import { useMemo } from 'react';

import useGameStore from '../store/gameStore';
import { describeStageCountdown, getEraStage, medianSessionEP } from '../engine/eraStage';

/**
 * "Còn mấy phiên nữa tới mốc kế tiếp?" — cho dòng đếm ngược ở màn Tập trung.
 *
 * ⚠️ NHỊP LẤY TỪ LỊCH SỬ THẬT, KHÔNG TỪ CÀI ĐẶT. Lấy `focusMinutes` trong Cài đặt rồi nhân ra EP
 * là đang nói về phiên Đàm ĐỊNH làm, không phải phiên anh THẬT SỰ làm — và hai thứ đó lệch nhau
 * (fixture 180 ngày: 588 phiên xong, 36 phiên huỷ). Một con số dùng để hứa hẹn thì phải suy từ
 * cái đã xảy ra.
 *
 * ⚠️ Cắt `history` xuống trước khi đưa vào `useMemo`: lịch sử giữ tới 2000 phiên, mà phép ước
 * lượng chỉ cần 10 phiên gần nhất. Không cắt thì mỗi phiên mới xong sẽ băm lại cả mảng.
 */
export default function useStageCountdown() {
  const activeBook = useGameStore((state) => state.progress.activeBook);
  const totalEP = useGameStore((state) => state.progress.totalEP);
  const history = useGameStore((state) => state.history);

  return useMemo(() => {
    const stage = getEraStage(activeBook, totalEP);
    if (!stage) return null;
    return describeStageCountdown(stage, medianSessionEP(history));
  }, [activeBook, totalEP, history]);
}
