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
import { describeCraftProgress, blueprintLabel } from '../engine/craftProgress';
import { AnimatePresence, motion } from 'framer-motion';

import useGameStore from '../store/gameStore';
import useStageCountdown from '../hooks/useStageCountdown';
import soundEngine from '../engine/soundEngine';
import {
  REWARD_TOAST_MS,
  buildRewardToasts,
  highestTier,
  splitRewardToasts,
} from '../engine/rewardFeed';
import { soundForTier } from '../engine/rewardTiers';
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
  // ⚠️ DÙNG CHUNG hook với dòng ở màn Tập trung — một luật một công thức. Chép lại phép tính chặng
  // xuống đây là cách hai chỗ nói hai con số khác nhau về cùng một cột mốc.
  // ⚠️ CHỈ lấy trạng thái `imminent`. Trạng thái `celebrate` thì dòng ở màn Tập trung đã lo, mà
  // hai thứ ấy hiện CÙNG LÚC trên CÙNG màn hình — nói hai lần thì lời chúc mừng mất một nửa giá.
  const stageCountdown = useStageCountdown();
  const stageHint = stageCountdown?.tone === 'imminent' ? stageCountdown.text : null;
  const closeLootModal = useGameStore((s) => s.closeLootModal);
  const dismissRelicNotification = useGameStore((s) => s.dismissRelicNotification);
  const dismissLevelUp = useGameStore((s) => s.dismissLevelUp);
  const dismissRankUpNotification = useGameStore((s) => s.dismissRankUpNotification);
  const dismissAchievementNotification = useGameStore((s) => s.dismissAchievementNotification);
  const dismissMissionNotification = useGameStore((s) => s.dismissMissionNotification);
  const dismissWeeklyReportToast = useGameStore((s) => s.dismissWeeklyReportToast);
  const openWeeklyReport = useGameStore((s) => s.openWeeklyReport);
  const enterMotion = useEnterMotion();

  /*
    ⚠️ TIẾN ĐỘ CÔNG TRÌNH LÀ THỨ 95% SỐ PHIÊN CÒN LẠI ĐƯỢC NHẬN (`TECH_DEBT #14`).
    Lễ mừng thành phố chỉ chạy khi một công trình VỪA XONG (~5% số phiên). Nhưng mỗi phiên đều
    đẩy hàng đợi tiến một bước — sự thật ấy có sẵn, chỉ là chưa ai nói ra. Dòng này nói nó.
    ⚠️ Đọc CHÍNH `describeCraftProgress`, đúng hàm mà thẻ hàng đợi ở Hành trang dùng — hai chỗ
    nói cùng một con số thì phải đi qua CÙNG một công thức.
  */
  const craftingQueue = useGameStore((s) => s.craftingQueue ?? []);
  const buildHint = useMemo(() => {
    const item = craftingQueue[0];
    if (!item) return null;
    const { remaining } = describeCraftProgress(item.bpId, item.sessionsRemaining);
    if (!Number.isFinite(remaining) || remaining <= 0) return null;
    const ten = blueprintLabel(item.bpId);
    return `${ten} · còn ${remaining} phiên`;
  }, [craftingQueue]);

  const toasts = useMemo(
    () => buildRewardToasts(ui, { stageHint, buildHint }),
    [ui, stageHint, buildHint],
  );
  const { shown, hidden, overflowLabel } = splitRewardToasts(toasts);
  // Khoá ổn định cho effect âm thanh: chuỗi id của đúng những thẻ ĐANG HIỆN.
  const shownIds = shown.map((t) => t.id);
  const shownKey = shownIds.join('|');

  /**
   * ÂM THANH: MỘT LƯỢT THẺ MỚI = ĐÚNG MỘT TIẾNG, CHỌN THEO BẬC HIẾM NHẤT TRONG LƯỢT.
   *
   * Bản trước rẽ ba nhánh `if` theo NGUỒN (`loot` · `milestone` · `level`), mà `rewardFeed.js`
   * có **9 nguồn** ⇒ **6/9 nguồn câm**, gồm cả di vật và mốc chuỗi vĩnh viễn — hai thứ mang bậc
   * `huyenThoai`, tức chính những phần thưởng hiếm nhất game lại không kêu tiếng nào. Bậc độ
   * hiếm thì đã được tính cho MỌI thẻ và kênh MẮT đã dùng nó từ lâu (vệt màu + chấm của
   * `RewardCard`); chỉ kênh TAI là chưa đọc tới. Bảng tra ở `engine/rewardTiers.js`.
   *
   * ⚠️ ĐÂY LÀ PHÉP GỘP: nó XOÁ ba nhánh `if` **và** trường hợp đặc biệt `!coMoc` (viết cùng ngày
   * để chống hai tiếng chồng nhau). "Một lượt một tiếng" làm việc chống-chồng-tiếng thành hệ quả
   * của CẤU TẠO chứ không phải một cái `if` phải nhớ ở mỗi lần thêm nguồn mới.
   *
   * ⚠️ DUYỆT `shown`, KHÔNG DUYỆT `toasts`. Chỉ 3 thẻ được hiện; bản cũ duyệt cả danh sách nên
   * một thẻ nằm ngoài chồng vẫn kêu — Đàm nghe một tiếng cho một tấm thẻ anh không hề thấy. Thẻ
   * bị hoãn sẽ kêu đúng lúc nó nổi lên, vì lúc ấy nó mới vào `shown`.
   */
  const soundedRef = useRef(new Set());
  useEffect(() => {
    const live = new Set(shownIds);
    const moi = shown.filter((t) => !soundedRef.current.has(t.id));
    if (moi.length > 0) {
      for (const t of moi) soundedRef.current.add(t.id);
      soundEngine[soundForTier(highestTier(moi))]?.();
    }
    // Dọn id đã biến mất để cùng một phần thưởng lần sau vẫn kêu (ví dụ lên cấp 7
    // ở lượt prestige sau). Không dọn thì Set phình vô hạn và tiếng tắt vĩnh viễn.
    // Gom rồi mới xoá — sửa một tập hợp đang được duyệt là chỗ dễ sinh lỗi im lặng.
    const stale = [...soundedRef.current].filter((id) => !live.has(id));
    for (const id of stale) soundedRef.current.delete(id);
    // ⚠️ Phụ thuộc theo CHUỖI ID chứ không theo mảng `shown`: `splitRewardToasts` trả mảng MỚI ở
    // mỗi lần render, nên để `shown` trong danh sách phụ thuộc là bắt effect chạy lại liên tục.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownKey]);

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
      /*
        ⚠️ CHỒNG THẺ PHẢI NỔI **TRÊN** THANH ĐIỀU HƯỚNG, KHÔNG ĐÈ LÊN NÓ (2026-09-01).
        Đo trên app thật ở khung 390×844 (`shot.mjs --probe`): thanh điều hướng dưới cùng nằm
        y=774…832 (cao 58px, cha đệm dưới 12px), còn `bottom-3` đặt mép dưới chồng thẻ ở đúng
        844−12 = **832** — TRÙNG KHÍT mép dưới thanh nav. Chồng thẻ có `z-[48]` > `z-40` của nav,
        và mỗi thẻ là một `<button>` mang `pointer-events-auto`, nên sau MỖI phiên xong, **cả năm
        nút của thanh điều hướng bị che và chạm vào bất kỳ nút nào cũng mở hộp thoại phần thưởng**.
        Một thẻ đo được ~100px đã cao hơn cả thanh nav (58px) ⇒ không cần tới ba thẻ mới che hết.
        ⚠️ `env(safe-area-inset-bottom)` phải có mặt vì THANH NAV cũng dùng đúng nó
        (`App.jsx`, `paddingBottom: calc(env(safe-area-inset-bottom) + 12px)`) — viết một con số
        trần thì trên máy có thanh gạt dưới (safe-area 34px) thẻ sẽ tụt lại vào nav. Hôm nay
        `index.html` KHÔNG khai `viewport-fit=cover` nên safe-area = 0 kể cả trên iPhone của Đàm,
        nhưng khoá bằng QUAN HỆ thì ngày ai đó thêm cờ ấy vào cũng không gãy.
        ⚠️ 82 = 58 (cao nav) + 12 (đệm dưới của nav) + 12 (khe hở). Ba số ấy ĐO ĐƯỢC, không đoán.
        ⚠️ Giá đã biết và chấp nhận: ở chế độ TOÀN MÀN HÌNH thanh nav không được dựng, nên chồng
        thẻ chừa thừa 70px. Đó là một khoảng trống, không phải một nút bị che — rẻ hơn nhiều so
        với việc luồn một prop qua ba tầng component chỉ để bỏ một khe hở.
      */
      className="pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+82px)] z-[48] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[340px]"
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
