/**
 * InventoryHero.jsx — dải mở đầu của cả BA tab Hành trang.
 *
 * Luật (con số nào dẫn đầu, câu nào đi kèm) nằm ở `inventoryHero.js` — file này CHỈ vẽ.
 * Xem khối chú thích ở file ấy để biết vì sao dải này tồn tại.
 *
 * ⚠️ MÀU LẤY TỪ TOKEN, KHÔNG MÃ CỨNG: app có 2 theme × 5 skin. `color-mix` là cách dự án đã dùng
 * ở `cityBackdropScrim.js` và `RewardCard.jsx` cho đúng lý do này.
 * ⚠️ HAI TRẠNG THÁI, KHÔNG PHẢI MỘT: `gap = true` nghĩa là ĐANG CÓ VIỆC LÀM ĐƯỢC (điểm chưa tiêu,
 * công trình đang xây, huy hiệu sắp đạt) — lúc ấy dải mang màu nhấn. Không có việc thì nó lặng
 * xuống thành xám. Nếu lúc nào cũng rực thì "rực" thôi mang tin — đúng bài học vừa rút ra ở thẻ
 * phần thưởng (hiếm mà nổi thì không phải quảng cáo; thường mà nổi mới là).
 */
import React from 'react';

export default function InventoryHero({ hero, icon = null }) {
  if (!hero) return null;
  const { nhan, so, donVi, caption, pct = 0, gap = false } = hero;

  const mau = gap ? 'var(--accent)' : 'var(--muted)';

  return (
    <div
      className="relative overflow-hidden px-5 py-4"
      style={{
        borderRadius: 'var(--skin-radius-card,18px)',
        background: gap
          ? 'linear-gradient(135deg,'
            + ' color-mix(in srgb, var(--accent) 16%, var(--card-bg-solid)) 0%,'
            + ' color-mix(in srgb, var(--accent) 5%, var(--card-bg-solid)) 100%)'
          : 'var(--card-bg-solid)',
        border: 'var(--skin-card-border-width,1px) solid '
          + (gap ? 'color-mix(in srgb, var(--accent) 28%, var(--line))' : 'var(--line)'),
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className="mono text-[10px] uppercase tracking-[0.22em]"
            style={{ color: gap ? mau : 'var(--muted-2)' }}
          >
            {nhan}
          </p>

          <p className="mt-1.5 flex items-baseline gap-2">
            <span
              className="text-[44px] font-semibold leading-none tabular-nums tracking-[-0.03em]"
              style={{ color: 'var(--ink)', fontFamily: 'var(--skin-font-display)' }}
            >
              {so}
            </span>
            <span className="text-[13px] font-medium" style={{ color: 'var(--muted)' }}>
              {donVi}
            </span>
          </p>

          <p className="mt-2 text-[13px] leading-snug" style={{ color: 'var(--ink-2, var(--muted))' }}>
            {caption}
          </p>
        </div>

        {icon && (
          <span
            className="flex shrink-0 items-center justify-center text-[22px]"
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--skin-radius-control,14px)',
              background: gap
                ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                : 'var(--card-bg-solid2, rgba(127,127,127,0.06))',
              border: 'var(--skin-card-border-width,1px) solid '
                + (gap ? 'color-mix(in srgb, var(--accent) 24%, var(--line))' : 'var(--line)'),
            }}
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>

      {/* Thanh tiến độ: nó là lý do dải này tồn tại — "còn bao xa" chứ không phải "đang có gì". */}
      <div
        className="mt-3 h-[6px] w-full overflow-hidden"
        style={{ borderRadius: 999, background: 'color-mix(in srgb, var(--ink) 8%, transparent)' }}
      >
        <div
          className="h-full"
          style={{
            width: `${Math.round(pct * 100)}%`,
            borderRadius: 999,
            background: mau,
            transition: 'width 420ms cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      </div>
    </div>
  );
}
