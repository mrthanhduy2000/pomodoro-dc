/**
 * BuildingGrid.jsx — LƯỚI công trình đã xây. Luật ở `buildingGrid.js`; file này CHỈ vẽ.
 *
 * ⚠️ MÀU LẤY TỪ TOKEN, KHÔNG MÃ CỨNG (2 theme × 5 skin) — `color-mix` là cách dự án đã dùng ở
 * `cityBackdropScrim.js`, `InventoryHero.jsx`, `SkillMatrix.jsx` cho đúng lý do này.
 * ⚠️ TÊN CÔNG TRÌNH XUỐNG DÒNG, KHÔNG `truncate`: "Xưởng Đóng Tàu" và "Xưởng Dệt" cắt ở ký tự thứ
 * bảy thì đọc ra giống nhau. Cùng luật đã ghi cho đầu cột bản đồ kỹ năng.
 */
import React from 'react';
import { BUILDING_STATE } from './buildingGrid.js';

export default function BuildingGrid({ tiles, selectedId, onPick }) {
  if (!tiles?.length) return null;
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {tiles.map((t) => {
        const chon = t.id === selectedId;
        const san = t.state === BUILDING_STATE.READY;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onPick?.(t)}
            aria-pressed={chon}
            className="relative flex min-w-0 flex-col items-center gap-1 px-1.5 py-2.5 transition-transform active:scale-95"
            style={{
              background: san
                ? 'color-mix(in srgb, var(--accent) 10%, var(--card-bg-solid))'
                : 'var(--card-bg-solid)',
              border: '1px solid ' + (san ? 'color-mix(in srgb, var(--accent) 34%, var(--line))' : 'var(--line)'),
              borderRadius: 'var(--skin-radius-card,18px)',
              outline: chon ? '2px solid var(--ink)' : 'none',
              outlineOffset: 2,
            }}
          >
            <span className="text-[20px] leading-none" aria-hidden>{t.glyph}</span>
            <span
              className="text-center text-[10.5px] font-semibold leading-[1.15]"
              style={{ color: 'var(--ink)' }}
            >
              {t.label}
            </span>
            <span
              className="mono text-[9px] tabular-nums leading-none"
              style={{ color: t.level > 1 ? 'var(--accent)' : 'var(--muted-2)' }}
            >
              Lv.{t.level}{t.level > 1 ? ` · ×${t.mult}` : ''}
            </span>
            {/* Chấm "nâng được ngay" — dấu hiệu DUY NHẤT mang màu nhấn ở dạng chấm, xem luật file kia */}
            {san && (
              <span
                aria-label="nâng cấp được"
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                style={{ background: 'var(--accent)' }}
              />
            )}
            {t.state === BUILDING_STATE.MAX && (
              <span
                aria-hidden
                className="mono absolute right-1.5 top-1.5 text-[8px] font-bold"
                style={{ color: 'var(--good)' }}
              >
                MAX
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
