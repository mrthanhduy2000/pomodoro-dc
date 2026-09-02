/**
 * SkillMatrix.jsx — BẢN ĐỒ kỹ năng 6 cột × 6 hàng. Luật ở `skillMatrix.js`; file này CHỈ vẽ.
 *
 * ⚠️ MÀU LẤY TỪ TOKEN, KHÔNG MÃ CỨNG (2 theme × 5 skin). `color-mix` là cách dự án đã dùng ở
 * `cityBackdropScrim.js`, `RewardCard.jsx`, `InventoryHero.jsx` cho đúng lý do này.
 * ⚠️ ĐƯỜNG NỐI DỌC nằm ở lớp NỀN của mỗi cột (một `<div>` tuyệt đối, `z-0`), ô nằm trên (`z-10`).
 * Vẽ đường bằng `border` của từng ô thì đường đứt quãng theo khe `gap` và mắt thôi đọc ra một
 * nhánh liền mạch — mà chính sự liền mạch ấy là thứ nói "muốn xuống dưới phải mở cái trên".
 */
import React from 'react';
import { MATRIX_STATE } from './skillMatrix.js';

const O = 'var(--skin-radius-control,12px)';

function mauO(state) {
  if (state === MATRIX_STATE.OWNED) {
    return {
      background: 'color-mix(in srgb, var(--accent) 82%, var(--card-bg-solid))',
      border: '1px solid color-mix(in srgb, var(--accent) 90%, var(--line))',
      color: 'var(--canvas)',
      opacity: 1,
    };
  }
  if (state === MATRIX_STATE.READY) {
    return {
      background: 'color-mix(in srgb, var(--accent) 12%, var(--card-bg-solid))',
      border: '2px solid color-mix(in srgb, var(--accent) 60%, var(--line))',
      color: 'var(--ink)',
      opacity: 1,
    };
  }
  if (state === MATRIX_STATE.SHORT) {
    return {
      background: 'var(--card-bg-solid)',
      border: '1px solid var(--line)',
      color: 'var(--ink)',
      opacity: 1,
    };
  }
  return {
    background: 'var(--card-bg-solid)',
    border: '1px dashed var(--line)',
    color: 'var(--muted)',
    opacity: 0.5,
  };
}

export default function SkillMatrix({ matrix, selectedId, onPick }) {
  const columns = matrix?.columns ?? [];
  const rows = matrix?.rows ?? 0;
  if (!columns.length) return null;

  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
    >
      {columns.map((col) => (
        <div key={col.key} className="relative flex min-w-0 flex-col gap-1.5">
          {/* Đường nối dọc — nền của cả cột, xem chú thích đầu file */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-px -translate-x-1/2"
            style={{ background: 'var(--line)', top: 34, opacity: 0.7 }}
          />

          {/* Đầu cột: tên nhánh + đã mở mấy trên mấy */}
          <div className="relative z-10 min-w-0 text-center">
            {/*
              ⚠️ KHÔNG `truncate`. Ở 390px sáu cột rộng ~55px, và cắt chữ biến "Thiền Định" thành
              "Thiên …" còn "Thăng Hoa" thành "Thăng …" — hai nhãn khác nhau đọc ra gần giống nhau.
              Cho nó XUỐNG DÒNG: tên nhánh nào cũng đúng hai từ, mỗi từ ≤5 ký tự nên hai dòng vừa.
              Đây là cùng luật đã ghi ở vòng 20 cho hàng chip nhánh: *một hàng nhãn mà không đọc
              được nhãn thì không phải một hàng nhãn.*
            */}
            <p
              className="text-[9px] font-semibold leading-[1.15]"
              style={{ color: 'var(--muted)', hyphens: 'none' }}
              title={col.label}
            >
              {col.label}
            </p>
            <p
              className="mono text-[9px] tabular-nums leading-tight"
              style={{ color: col.owned > 0 ? 'var(--accent)' : 'var(--muted-2)' }}
            >
              {col.owned}/{col.total}
            </p>
          </div>

          {Array.from({ length: rows }, (_, r) => {
            const cell = col.cells[r];
            if (!cell) {
              return <div key={`${col.key}-${r}`} className="relative z-10 aspect-square" />;
            }
            const chon = cell.node.id === selectedId;
            const s = mauO(cell.state);
            return (
              <button
                key={cell.node.id}
                type="button"
                onClick={() => onPick?.(cell)}
                title={`${cell.node.label} — ${cell.cost} SP`}
                aria-label={`${cell.node.label}, ${col.label}`}
                aria-pressed={chon}
                className="relative z-10 flex aspect-square w-full items-center justify-center leading-none transition-transform active:scale-95"
                style={{
                  ...s,
                  borderRadius: O,
                  outline: chon ? '2px solid var(--ink)' : 'none',
                  outlineOffset: 2,
                }}
              >
                <span className="text-[15px]" aria-hidden>
                  {cell.state === MATRIX_STATE.LOCKED ? '🔒' : cell.node.icon}
                </span>
                {cell.state === MATRIX_STATE.READY && (
                  <span
                    aria-hidden
                    className="mono absolute -right-0.5 -top-1 rounded-full px-1 text-[8px] font-bold tabular-nums leading-[1.4]"
                    style={{ background: 'var(--accent)', color: 'var(--canvas)' }}
                  >
                    {cell.cost}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
