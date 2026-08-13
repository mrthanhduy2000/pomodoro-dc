/**
 * EraSwitcher.jsx — thanh chuyển giữa các kỷ trong bảo tàng.
 *
 * Ba trạng thái một nút có thể mang:
 *   • kỷ ĐANG chơi      → "3/5 · đang xây"
 *   • kỷ đã niêm phong  → "3/5", hoặc "5/5 ★" nếu xây trọn vẹn
 *   • kỷ THẤT TRUYỀN    → thành phố đã đi qua trước khi bảo tàng được dựng (2026-08-12).
 *     Đây là trạng thái rỗng CÓ CHỦ Ý, không phải lỗi — xem `MIGRATION.md` schema 3→4.
 *
 * ⚠️ "· đang xây" TRẢ LỜI ĐÚNG MỘT CÂU: **con số bên trái còn nhúc nhích được nữa không?** Trước
 * Phase 4D câu đó chỉ đúng với kỷ đang chơi, nên dòng chữ này gác bằng `isCurrent` — tiện và, lúc
 * ấy, đúng. Từ khi có "di sản dang dở" (`engine/eraLegacy.js`) thì một kỷ ĐÃ NIÊM PHONG cũng có thể
 * đang xây dở, và gác cũ biến hai thứ khác hẳn nhau thành một: "Kỷ 7 · 4/5" đứng chết vĩnh viễn
 * trông y hệt "Kỷ 7 · 4/5" đang cách ngôi sao đúng ba phiên. Mà đó lại chính là câu hỏi cả thanh
 * này sinh ra để trả lời — **kỷ nào còn đáng quan tâm**.
 *
 * ⚠️ VÌ SAO PHẢI CÓ MẪU SỐ (2026-08-13): trước đây nút chỉ hiện số trần — "Kỷ 3 · 2". Hai trên
 * mấy? Không ai biết, kể cả Đàm. Cả thanh này là một hàng số không đọc được, nên nó chỉ dùng để
 * CHUYỂN kỷ chứ không nói được điều gì về những kỷ đã qua. Thêm mẫu số thì đúng thanh đó thành một
 * bảng thành tích: liếc một cái là thấy kỷ nào mình làm trọn vẹn, kỷ nào bỏ dở — và vì kỷ cũ niêm
 * phong VĨNH VIỄN (ADR-007), những con số đó không sửa được nữa.
 *
 * ⚠️ Ngôi sao dùng "★" (U+2605) chứ KHÔNG dùng emoji ⭐. Emoji được font màu của hệ điều hành vẽ,
 * bề rộng lệch hẳn so với chữ và khác nhau giữa iPhone với Mac — thanh này cuộn ngang và có cả một
 * cơ chế tự căn theo bề rộng nút (xem `align` bên dưới), nên một ký tự đổi cỡ tuỳ máy là đúng thứ
 * làm phép căn đó sai. "★" là chữ thường, ăn theo đúng `font-size` và màu của nút.
 *
 * ⚠️ NGÔI SAO DÙNG `--accent`, KHÔNG DÙNG MÀU KỶ — đã ĐO, không phải đoán (2026-08-13). Bản đầu
 * tô sao bằng `eraSolid(era)` cho hợp màu kỷ; đo tương phản trên nền thẻ của cả 8 tổ hợp
 * theme × skin thì kỷ 9 (`#a3e635`, xanh chanh) chỉ đạt **1,49:1** và kỷ 3 (`#facc15`, vàng)
 * 1,51:1 ở theme sáng — tức gần như tàng hình đúng chỗ đáng lẽ phải là phần thưởng. `--accent` đo
 * được 2,97:1 (tệ nhất, skin sáng thứ hai) tới 7,43:1, tốt hơn gấp đôi ở ca xấu nhất.
 * Cái dấu chấm tròn bên cạnh thì VẪN giữ màu kỷ, và đó không phải sự thiếu nhất quán: nó là trang
 * trí thuần (số kỷ đã ghi ngay cạnh), còn ngôi sao thì mang thông tin.
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
        const done = era.completion?.done ?? 0;
        const total = era.completion?.total ?? 0;
        const complete = !!era.completion?.isComplete;
        const score = total > 0 ? `${done}/${total}` : null;
        // Kỷ hiện tại thì luôn còn mở; kỷ cũ chỉ còn mở khi có "di sản dang dở" đang xây.
        const open = era.isCurrent
          || (era.completion?.slots ?? []).some((slot) => slot.state === 'building');

        return (
          <button
            key={era.era}
            ref={active ? activeRef : undefined}
            type="button"
            onClick={() => onSelect(era.era)}
            aria-current={active ? 'true' : undefined}
            title={era.isLost
              ? `${era.label} — thành phố thất truyền`
              : `${era.label}${score ? ` — đã xây ${score} công trình` : ''}`
                + (complete ? ' · trọn vẹn' : '')
                + (era.sealedAt ? ` · niêm phong ${era.sealedAt}` : '')}
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
              {era.isLost
                ? <span style={{ opacity: 0.75 }}>· thất truyền</span>
                : (
                  <>
                    {score && <span className="mono" style={{ opacity: 0.75 }}>· {score}</span>}
                    {/* Ngôi sao là phần thưởng duy nhất trong app KHÔNG lấy lại được nữa sau khi
                        kỷ niêm phong — nên nó phải nổi hơn phần chữ quanh nó, kể cả trên nút đang
                        được chọn (nền `--accent`, chữ trắng). */}
                    {complete && (
                      <span
                        aria-label="trọn vẹn"
                        title="Trọn vẹn — đã xây đủ mọi công trình của kỷ này"
                        style={{ color: active ? '#fff' : 'var(--accent)', opacity: 1 }}
                      >
                        ★
                      </span>
                    )}
                    {open && <span style={{ opacity: 0.75 }}>· đang xây</span>}
                  </>
                )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
