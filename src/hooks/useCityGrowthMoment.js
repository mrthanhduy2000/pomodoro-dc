/**
 * useCityGrowthMoment.js — cầu nối giữa store và `engine/cityMoment.js`.
 *
 * Trả về `{ moment, era }` khi có điều gì THẬT để khoe về thành phố ngay sau phiên vừa xong, và
 * `null` khi không có. Toàn bộ luật "khoe cái gì, có nên khoe không" nằm ở engine thuần; hook này
 * chỉ đi lấy đúng dữ liệu.
 *
 * ⚠️ Chỉ tính khi `active` — tức đúng lúc hộp thoại phần thưởng vừa bật. Đây là màn hình mở lâu
 * nhất trong app (25 phút mỗi phiên); dựng lại bố cục thành phố ở mỗi lượt render chỉ để chuẩn bị
 * cho một khoảnh khắc 3,2 giây là đúng kiểu chi phí âm thầm mà cả nhánh 3D được viết ra để tránh.
 */

import { useMemo } from 'react';

import useGameStore from '../store/gameStore';
import { computeCityLayout } from '../engine/cityLayout';
import { buildGrowthMoment } from '../engine/cityMoment';

export default function useCityGrowthMoment(active) {
  const buildings = useGameStore((s) => s.buildings);
  const craftingQueue = useGameStore((s) => s.craftingQueue);
  const activeBook = useGameStore((s) => s.progress.activeBook);
  const pendingReward = useGameStore((s) => s.ui.pendingReward);

  // Khoá theo NỘI DUNG: store trả về mảng mới ở mỗi lượt render, mà đây là chỗ gọi
  // `computeCityLayout` — so theo danh tính mảng thì nó chạy lại liên tục.
  const queueKey = (Array.isArray(craftingQueue) ? craftingQueue : [])
    .map((item) => `${item?.bpId}:${item?.sessionsRemaining}`).join(',');
  const builtKey = Array.isArray(buildings) ? buildings.join(',') : '';
  const newlyBuilt = Array.isArray(pendingReward?.newlyBuiltIds) ? pendingReward.newlyBuiltIds : [];
  const acceleratedIds = Array.isArray(pendingReward?.acceleratedCraftingIds)
    ? pendingReward.acceleratedCraftingIds : [];
  const rewardKey = `${newlyBuilt.join(',')}|${acceleratedIds.join(',')}`;

  return useMemo(() => {
    if (!active) return null;

    const layout = computeCityLayout({
      built: builtKey ? builtKey.split(',') : [],
      era: activeBook,
      pending: craftingQueue,
    });
    const moment = buildGrowthMoment({ newlyBuilt, scaffolds: layout.scaffolds, acceleratedIds });
    return moment ? { moment, era: activeBook } : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, builtKey, queueKey, activeBook, rewardKey]);
}
