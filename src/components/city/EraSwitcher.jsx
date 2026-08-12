/**
 * EraSwitcher.jsx — thanh chuyển giữa các kỷ trong bảo tàng.
 *
 * Ba trạng thái một nút có thể mang:
 *   • kỷ ĐANG chơi      → "Đang xây"
 *   • kỷ đã niêm phong  → số công trình đã lưu
 *   • kỷ THẤT TRUYỀN    → thành phố đã đi qua trước khi bảo tàng được dựng (2026-08-12).
 *     Đây là trạng thái rỗng CÓ CHỦ Ý, không phải lỗi — xem `MIGRATION.md` schema 3→4.
 */

import { eraSolid } from './cityTokens';

export default function EraSwitcher({ eras, viewingEra, onSelect }) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto pb-1"
      style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
    >
      {eras.map((era) => {
        const active = era.era === viewingEra;
        const count = era.isCurrent ? null : era.built.length;

        return (
          <button
            key={era.era}
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
