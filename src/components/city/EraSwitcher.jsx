/**
 * EraSwitcher.jsx — thanh chuyển giữa các kỷ trong bảo tàng.
 *
 * Ba trạng thái một nút có thể mang:
 *   • kỷ ĐANG chơi      → "Đang xây"
 *   • kỷ đã niêm phong  → số công trình đã lưu
 *   • kỷ THẤT TRUYỀN    → thành phố đã đi qua trước khi bảo tàng được dựng (2026-08-12).
 *     Đây là trạng thái rỗng CÓ CHỦ Ý, không phải lỗi — xem `MIGRATION.md` schema 3→4.
 */

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

import { eraSolid } from './cityTokens';

export default function EraSwitcher({ eras, viewingEra, onSelect }) {
  const railRef = useRef(null);
  const activeRef = useRef(null);
  const settled = useRef(false);
  const reduceMotion = useReducedMotion();

  // ⚠️ KÉO KỶ ĐANG XEM VÀO TẦM MẮT. Thanh này cuộn ngang, và các kỷ đã đi qua nằm TRƯỚC kỷ hiện
  // tại — nên càng chơi lâu, cái nút DUY NHẤT Đàm quan tâm càng bị đẩy ra ngoài màn hình. Ở kỷ 7
  // nó đã bị cắt mất một nửa trên màn 1280px; tới kỷ 15 thì khuất hẳn, mở tab lên chỉ thấy một dãy
  // "thất truyền" xám. Không ai báo lỗi kiểu này — người ta chỉ thấy màn hình "hơi kỳ".
  //
  // ⚠️ KHÔNG dùng `scrollIntoView`: thanh này nằm trong một khung cuộn khác, và `scrollIntoView` sẽ
  // kéo luôn cả khung cha — mở tab Thành Phố mà trang tự nhảy xuống giữa chừng. Tự tính `scrollLeft`
  // thì chỉ đúng thanh này nhúc nhích.
  useEffect(() => {
    const rail = railRef.current;
    const chip = activeRef.current;
    if (!rail || !chip) return undefined;

    const align = () => {
      const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
      if (max === 0) return;   // chưa tràn thì không có gì để cuộn

      // ⚠️ ĐO BẰNG `getBoundingClientRect`, KHÔNG dùng `offsetLeft`. `offsetLeft` tính từ
      // `offsetParent` — mà thanh này `position: static` nên offsetParent là một khung cha ở tận
      // ngoài, khiến số đo CỘNG THÊM cả khoảng cách từ mép trang (đo thật: 1151 trong khi toàn bộ
      // nội dung thanh chỉ rộng 999). Ở kỷ cuối thì sai số đó bị kẹp về đúng mép phải nên trông
      // vẫn ổn — nhưng ở một kỷ giữa nó sẽ cuộn quá tay.
      const railBox = rail.getBoundingClientRect();
      const chipBox = chip.getBoundingClientRect();
      const chipLeft = (chipBox.left - railBox.left) + rail.scrollLeft;
      const target = chipLeft - (rail.clientWidth - chipBox.width) / 2;

      rail.scrollTo({
        left: Math.min(max, Math.max(0, target)),
        // Lần đầu thì NHẢY THẲNG — trượt mượt một quãng dài mà người dùng không hề bấm gì trông
        // như màn hình bị lỗi. Từ lần đổi kỷ thứ hai trở đi mới trượt, vì lúc đó chính anh vừa bấm.
        behavior: settled.current && !reduceMotion ? 'smooth' : 'auto',
      });
      settled.current = true;
    };

    align();

    // ⚠️ PHẢI CĂN LẠI, không được căn một lần rồi thôi. Lần chạy đầu tiên rơi vào lúc font riêng
    // của skin CHƯA nạp xong: các nút còn hẹp, tổng bề ngang chưa tràn khỏi khung, `max` bằng 0 và
    // hàm này thoát ra mà không làm gì. Font nạp xong thì chữ nở ra, thanh mới tràn — nhưng lúc đó
    // không còn ai gọi lại. Đo thật trên bản build: nội dung 999px trong khung 952px, thiếu đúng
    // 47px, và kết quả là nút kỷ đang chơi cụt mất một góc ở MỌI lần mở tab.
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(align);
    observer.observe(chip);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [viewingEra, eras.length, reduceMotion]);

  return (
    <div
      ref={railRef}
      className="flex gap-1.5 overflow-x-auto pb-1"
      style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
    >
      {eras.map((era) => {
        const active = era.era === viewingEra;
        const count = era.isCurrent ? null : era.built.length;

        return (
          <button
            key={era.era}
            ref={active ? activeRef : undefined}
            type="button"
            onClick={() => onSelect(era.era)}
            aria-current={active ? 'true' : undefined}
            title={era.isLost
              ? `${era.label} — thành phố thất truyền`
              : `${era.label}${era.sealedAt ? ` — niêm phong ${era.sealedAt}` : ''}`}
            className="shrink-0 rounded-full px-3 py-1.5 text-[11px] transition-colors"
            style={{
              background: active ? 'var(--accent)' : 'var(--card-bg-solid)',
              color: active ? '#fff' : (era.isLost ? 'var(--muted-2)' : 'var(--ink-2)'),
              border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
              opacity: era.isLost && !active ? 0.6 : 1,
            }}
          >
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{
                  background: era.isLost ? 'transparent' : eraSolid(era.era),
                  border: era.isLost ? '1px solid var(--muted-2)' : 'none',
                }}
              />
              <span>Kỷ {era.era}</span>
              {era.isCurrent && <span style={{ opacity: 0.75 }}>· đang xây</span>}
              {!era.isCurrent && !era.isLost && <span style={{ opacity: 0.75 }}>· {count}</span>}
              {era.isLost && <span style={{ opacity: 0.75 }}>· thất truyền</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
