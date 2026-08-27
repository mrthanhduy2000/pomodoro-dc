/**
 * RewardToastHost.jsx — MỘT chồng toast cho mọi phần thưởng "nhẹ" (2026-08-27, ADR-060).
 * ─────────────────────────────────────────────────────────────────────────────
 * Thay `AchievementToast.jsx` (chỉ biết thành tích, hiện MỘT cái một lúc, ở giữa
 * mép trên). File này gom cả sáu kênh nhẹ vào một chồng ở GÓC màn hình.
 *
 * LUẬT (Đàm ra): chặn màn hình chỉ dành cho lên kỷ · thăng hoa · khủng hoảng kỷ ·
 * thảm hoạ. Mọi thứ khác đi qua đây, tự tắt sau 4 giây, bấm vào thì mở chi tiết.
 *
 * ⚠️ MỖI THẺ MỘT ĐỒNG HỒ RIÊNG, VÀ ĐỒNG HỒ ẤY THUỘC VÒNG ĐỜI CỦA THẺ. Đó là lý do
 * `ToastItem` là một component riêng chứ không phải một vòng lặp trong `map`: nếu
 * hẹn giờ nằm ở component cha thì mỗi lần một thẻ MỚI xuất hiện, effect chạy lại
 * và mọi thẻ đang đếm dở được gia hạn — một chuỗi phần thưởng liên tiếp sẽ giữ
 * thẻ đầu tiên trên màn hình mãi. React lo hộ chuyện đó khi đồng hồ gắn với mount.
 *
 * ⚠️ ĐỒNG HỒ DỪNG KHI CÓ HỘP THOẠI CHẶN MÀN HÌNH (`paused`). Toast nằm ở z-[48],
 * DƯỚI sàn hộp thoại (z-50) — đúng thứ bậc mới: hộp thoại là việc phải quyết,
 * toast là việc chỉ cần biết. Nhưng nếu để đồng hồ chạy tiếp thì 4 giây ấy cháy
 * sau lưng lớp mờ và Đàm không bao giờ thấy thẻ. Dừng lại là cách duy nhất để cả
 * hai luật cùng đúng.
 */
import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import useGameStore from '../store/gameStore';
import soundEngine from '../engine/soundEngine';
import {
  REWARD_TOAST_MS,
  buildRewardToasts,
  highestTier,
  splitRewardToasts,
} from '../engine/rewardFeed';
import { getRewardTier } from '../engine/rewardTiers';
import { useEnterMotion } from '../lib/motionPresets';
import RewardCard from './shared/RewardCard';

const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';

function ToastItem({ toast, paused, enterMotion, onDismiss, onOpen }) {
  // `onDismiss` được dựng lại mỗi lần cha vẽ. Nếu để nó trong danh sách phụ thuộc
  // thì đồng hồ khởi động lại theo mỗi lần vẽ; nếu bỏ nó ra mà không ghim thì
  // effect giữ mãi bản đầu tiên (bẫy closure cũ). Ref giải cả hai: danh sách phụ
  // thuộc chỉ còn thứ THẬT SỰ phải khởi động lại đồng hồ.
  // ⚠️ Cập nhật ref trong EFFECT chứ không trong thân hàm — ghi `.current` lúc
  // đang vẽ là thứ React cấm (và `react-hooks/refs` bắt được). Effect này khai
  // TRƯỚC effect hẹn giờ nên nó luôn chạy trước, ở mọi lần vẽ.
  const fireRef = useRef(null);
  useEffect(() => {
    fireRef.current = () => onDismiss(toast);
  });

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setTimeout(() => fireRef.current?.(), REWARD_TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [paused, toast.id]);

  /*
   * ⚠️ DÙNG NHỊP `enter`, KHÔNG DÙNG `reward`. Cám dỗ rất lớn vì đây đúng là thẻ
   * PHẦN THƯỞNG — nhưng `motionPresets.js` viết rõ: `reward` là nhịp ĐẮT nhất,
   * dành cho phần thưởng và CỘT MỐC, *"dùng bừa thì nó hết là phần thưởng"*. Thẻ
   * này nổ sau MỌI phiên, tức là định nghĩa của dùng bừa. Thứ nói "đây là phần
   * thưởng" ở đây là bậc độ hiếm và vệt màu của `RewardCard`, không phải cú nảy.
   * Và `enter` mô tả đúng việc đang xảy ra: *"một dòng vừa được thêm vào danh sách"*.
   * (Nó cũng có sẵn `exit` — thứ `reward` không có, mà một chồng toast thì phần tử
   * LUÔN rời đi.)
   */
  return (
    <motion.div {...enterMotion} style={{ boxShadow: 'var(--skin-card-shadow)' }}>
      <RewardCard
        icon={toast.icon}
        name={toast.name}
        tier={toast.tier}
        description={toast.description}
        amount={toast.amount}
        compact
        onClick={() => onOpen(toast)}
      />
    </motion.div>
  );
}

/**
 * @param {boolean}  paused      - có hộp thoại chặn màn hình đang mở không
 * @param {function} onNavigate  - `(action) => void`, dùng lại đúng bộ điều hướng
 *                                 của chuông thông báo (`handleNotificationNavigate`)
 * @param {function} onOpenDetail- `('loot'|'level') => void`, mở hộp thoại chi tiết
 */
export default function RewardToastHost({ paused = false, onNavigate, onOpenDetail }) {
  const ui = useGameStore((s) => s.ui);
  const missions = useGameStore((s) => s.missions);
  const closeLootModal = useGameStore((s) => s.closeLootModal);
  const dismissRelicNotification = useGameStore((s) => s.dismissRelicNotification);
  const dismissLevelUp = useGameStore((s) => s.dismissLevelUp);
  const dismissRankUpNotification = useGameStore((s) => s.dismissRankUpNotification);
  const dismissAchievementNotification = useGameStore((s) => s.dismissAchievementNotification);
  const dismissMissionNotification = useGameStore((s) => s.dismissMissionNotification);
  const dismissWeeklyReportToast = useGameStore((s) => s.dismissWeeklyReportToast);
  const openWeeklyReport = useGameStore((s) => s.openWeeklyReport);
  const enterMotion = useEnterMotion();

  const toasts = useMemo(() => buildRewardToasts(ui, missions), [ui, missions]);
  const { shown, hidden, overflowLabel } = splitRewardToasts(toasts);

  /**
   * Âm thanh: giữ ĐÚNG những tiếng đã có trước đây, không thêm tiếng mới.
   * `playChestOpen` vốn kêu ở giai đoạn 0 của hộp thoại phần thưởng và
   * `playLevelUp` ở giai đoạn 5 — phiên thường nay không mở hộp thoại nữa nên
   * hai tiếng ấy phải kêu ở đây, nếu không việc bỏ chặn màn hình sẽ lặng lẽ lấy
   * mất phản hồi âm thanh của mỗi phiên xong.
   */
  const soundedRef = useRef(new Set());
  useEffect(() => {
    const live = new Set(toasts.map((t) => t.id));
    for (const toast of toasts) {
      if (soundedRef.current.has(toast.id)) continue;
      soundedRef.current.add(toast.id);
      if (toast.source === 'loot') soundEngine.playChestOpen();
      if (toast.source === 'level') soundEngine.playLevelUp();
    }
    // Dọn id đã biến mất để cùng một phần thưởng lần sau vẫn kêu (ví dụ lên cấp 7
    // ở lượt prestige sau). Không dọn thì Set phình vô hạn và tiếng tắt vĩnh viễn.
    // Gom rồi mới xoá — sửa một tập hợp đang được duyệt là chỗ dễ sinh lỗi im lặng.
    const stale = [...soundedRef.current].filter((id) => !live.has(id));
    for (const id of stale) soundedRef.current.delete(id);
  }, [toasts]);

  const dismiss = (toast) => {
    switch (toast.source) {
      // ⚠️ Hết 4 giây thì CHỈ tắt lời mời — không ghi "đã xem". Lỡ thẻ này thì chấm ở nút
      // "Báo cáo tuần" vẫn sáng, đó là cả lý do `TECH_DEBT #87` bắt tách hai trạng thái.
      case 'weekly':      return dismissWeeklyReportToast();
      case 'loot':        return closeLootModal();
      case 'relic':       return dismissRelicNotification();
      case 'level':       return dismissLevelUp();
      case 'rank':        return dismissRankUpNotification();
      case 'achievement': return dismissAchievementNotification(toast.key);
      case 'mission':     return dismissMissionNotification(toast.key);
      default:            return undefined;
    }
  };

  // Bấm vào thẻ = "cho tôi xem chi tiết". Hai kiểu chi tiết: mở một hộp thoại
  // (`detail`) hoặc nhảy tới đúng tab đang giữ thứ vừa nhận (`tab`).
  // ⚠️ Kiểu `detail` KHÔNG gọi `dismiss`: hộp thoại đọc chính trường store mà
  // `dismiss` sẽ xoá, nên xoá trước là mở ra một hộp thoại rỗng.
  const open = (toast) => {
    // Bản tổng kết tuần đi qua chính hàm của store, nơi giữ luật "cú mở đầu tiên trong tuần là
    // bản TUẦN TRƯỚC" + luật ghi "đã xem". Nó tự tắt lời mời nên không gọi `dismiss` ở đây.
    if (toast.action?.weekly) {
      openWeeklyReport();
      return;
    }
    if (toast.action?.detail) {
      onOpenDetail?.(toast.action.detail);
      return;
    }
    dismiss(toast);
    if (toast.action) onNavigate?.(toast.action);
  };

  // Đồng hồ dừng thì thẻ vẫn phải hiện (nó nằm dưới lớp mờ, Đàm sẽ thấy lại khi
  // đóng hộp thoại) — nên KHÔNG return null khi `paused`.
  if (shown.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-3 z-[48] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[340px]"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {shown.map((toast) => (
          <div className="pointer-events-auto" key={toast.id}>
            <ToastItem
              toast={toast}
              paused={paused}
              enterMotion={enterMotion}
              onDismiss={dismiss}
              onOpen={open}
            />
          </div>
        ))}
        {overflowLabel && (
          <motion.div
            key="overflow"
            {...enterMotion}
            className="mono pointer-events-none px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{
              background: 'var(--card-bg-solid)',
              border: 'var(--skin-card-border-width,1px) solid var(--line)',
              borderLeft: `3px solid ${getRewardTier(highestTier(hidden)).colorVar}`,
              borderRadius: 'var(--skin-radius-card,18px)',
              boxShadow: 'var(--skin-card-shadow)',
              color: 'var(--muted)',
              fontFamily: MONO_FONT,
            }}
          >
            {overflowLabel}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
