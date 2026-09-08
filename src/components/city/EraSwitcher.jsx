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
 * bề rộng lệch hẳn so với chữ và khác nhau giữa iPhone với Mac, nên các nút sẽ lệch cỡ tuỳ máy.
 * "★" là chữ thường, ăn theo đúng `font-size` và màu của nút.
 *
 * ⚠️ NGÔI SAO DÙNG `--accent`, KHÔNG DÙNG MÀU KỶ — đã ĐO, không phải đoán (2026-08-13). Bản đầu
 * tô sao bằng `eraSolid(era)` cho hợp màu kỷ; đo tương phản trên nền thẻ của cả 8 tổ hợp
 * theme × skin thì kỷ 9 (`#a3e635`, xanh chanh) chỉ đạt **1,49:1** và kỷ 3 (`#facc15`, vàng)
 * 1,51:1 ở theme sáng — tức gần như tàng hình đúng chỗ đáng lẽ phải là phần thưởng. `--accent` đo
 * được 2,97:1 (tệ nhất, skin sáng thứ hai) tới 7,43:1, tốt hơn gấp đôi ở ca xấu nhất.
 * ĐÍNH CHÍNH PHẠM VI (2026-08-27, thêm skin thứ 5 "arcade"): nay là 10 tổ hợp. Đã đo lại riêng
 * cho arcade — `--accent` đạt 3,35:1 (sáng, trên nền) · 3,79:1 (sáng, trên thẻ) · 5,41–6,06:1
 * (tối), tức nằm GỌN trong dải 2,97–7,43 đã ghi ở trên, nên kết luận cũ không đổi.
 * Cái dấu chấm tròn bên cạnh thì VẪN giữ màu kỷ, và đó không phải sự thiếu nhất quán: nó là trang
 * trí thuần (số kỷ đã ghi ngay cạnh), còn ngôi sao thì mang thông tin.
 */

import { eraSolid } from './cityTokens';

/**
 * ADR-080 (round 40, Việc 5): the strip WRAPS instead of scrolling. A horizontal scroller cut the
 * first chip in half at the left edge and hid every era past the fold — the only thing Đàm saw of it
 * was "a chip with its head chopped off". Fifteen chips in a wrapping grid fit in three rows at
 * 390 px and in one at 1280 px, every one whole. The scroll-to-active-chip machinery that lived here
 * (a `ResizeObserver`, a `getBoundingClientRect` dance, a smooth/auto switch) went with the scroller.
 */
export default function EraSwitcher({ eras, viewingEra, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5 pb-1">
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
