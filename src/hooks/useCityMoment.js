/**
 * useCityMoment.js — cầu nối giữa store và `engine/cityMoment.js`, cho CẢ HAI đầu của một phiên:
 *   • `useCityFocusTease`    — TRƯỚC/TRONG phiên: phiên này đang đẩy cái gì tới đâu.
 *   • `useCityGrowthMoment`  — NGAY SAU phiên: thành phố vừa lớn lên thế nào.
 *
 * Toàn bộ luật "nói cái gì, có nên nói không" nằm ở engine thuần; hai hook này chỉ đi lấy đúng dữ
 * liệu và khoá phụ thuộc cho tử tế. Chúng ở chung một file vì dùng CHUNG cách dựng khoá + phép
 * dựng bố cục — tách ra hai file là chép đoạn khoá đó lần thứ ba trong dự án.
 *
 * ⚠️ VÌ SAO PHẢI ĐI QUA `computeCityLayout` chứ không tự đếm `craftingQueue`:
 * tri thức "còn mấy phiên nữa trên tổng bao nhiêu" được cố ý gom vào MỘT chỗ duy nhất
 * (`engine/cityLayout.js` có hẳn một ghi chú về điều này). Tự đếm ở đây thì sớm muộn cùng một công
 * trình sẽ hiện hai con số khác nhau ở hai màn hình.
 *
 * ⚠️ KHOÁ THEO NỘI DUNG, KHÔNG THEO DANH TÍNH: store trả về mảng mới ở mỗi lượt render, mà
 * `computeCityLayout` thì không rẻ. Khoá bằng chuỗi nội dung ⇒ chỉ tính lại khi thành phố thật sự
 * đổi (tức mỗi phiên một lần), không phải mỗi lượt render.
 */

import { useMemo } from 'react';

import useGameStore from '../store/gameStore';
import { computeCityLayout } from '../engine/cityLayout';
import { buildFocusTease, buildGrowthMoment } from '../engine/cityMoment';

/** Bố cục thành phố hiện tại + kỷ đang chơi, memo theo NỘI DUNG. Dùng chung cho cả hai hook. */
function useCitySnapshot(active) {
  const buildings = useGameStore((s) => s.buildings);
  const craftingQueue = useGameStore((s) => s.craftingQueue);
  const activeBook = useGameStore((s) => s.progress.activeBook);

  const builtKey = Array.isArray(buildings) ? buildings.join(',') : '';
  const queueKey = (Array.isArray(craftingQueue) ? craftingQueue : [])
    .map((item) => `${item?.bpId}:${item?.sessionsRemaining}`).join(',');

  return useMemo(() => {
    if (!active) return null;
    const built = builtKey ? builtKey.split(',') : [];
    return {
      layout: computeCityLayout({ built, era: activeBook, pending: craftingQueue }),
      era: activeBook,
      hasBuilt: built.length > 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, builtKey, queueKey, activeBook]);
}

/**
 * Điều đáng nói TRƯỚC/TRONG phiên. `null` = không có gì đáng nói (và màn Tập trung giữ nguyên
 * sự yên tĩnh của nó — đó là mặc định, không phải trường hợp lỗi).
 */
export function useCityFocusTease(active = true) {
  const snapshot = useCitySnapshot(active);

  return useMemo(() => {
    if (!snapshot) return null;
    return buildFocusTease({
      scaffolds: snapshot.layout.scaffolds,
      hasBuilt: snapshot.hasBuilt,
    });
  }, [snapshot]);
}

/**
 * Điều đáng khoe NGAY SAU phiên. `null` = thành phố không đổi gì ⇒ đi thẳng vào phần thưởng.
 *
 * ⚠️ Chỉ tính khi `active` — tức đúng lúc hộp thoại phần thưởng vừa bật.
 */
export function useCityGrowthMoment(active) {
  const snapshot = useCitySnapshot(active);
  const pendingReward = useGameStore((s) => s.ui.pendingReward);

  const newlyBuilt = Array.isArray(pendingReward?.newlyBuiltIds) ? pendingReward.newlyBuiltIds : [];
  const acceleratedIds = Array.isArray(pendingReward?.acceleratedCraftingIds)
    ? pendingReward.acceleratedCraftingIds : [];
  const rewardKey = `${newlyBuilt.join(',')}|${acceleratedIds.join(',')}`;

  return useMemo(() => {
    if (!snapshot) return null;
    const moment = buildGrowthMoment({
      newlyBuilt, scaffolds: snapshot.layout.scaffolds, acceleratedIds,
    });
    return moment ? { moment, era: snapshot.era } : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, rewardKey]);
}
