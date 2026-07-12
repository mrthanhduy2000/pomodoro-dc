/**
 * BadgeKit.jsx — TypeBadge/RarityBadge/PerkSummary dùng chung giữa
 * BuildingWorkshop.jsx và BlueprintInventory.jsx (trước đây bị copy gần nguyên
 * khối ở cả 2 nơi). 2 nơi gọi có khác biệt thị giác THẬT ở chế độ sáng (light
 * theme) — giữ nguyên nguyên vẹn qua prop `variant`:
 *   'skin'    = BuildingWorkshop (dùng biến CSS skin, card-bg-solid2, line)
 *   'literal' = BlueprintInventory (dùng màu rgba cố định)
 * KHÔNG được đổi variant mặc định hay gộp 2 nhánh lại — sẽ đổi hình ảnh hiển thị
 * ở 1 trong 2 màn hình.
 */
import { RARITY_STYLE } from './badgeStyles';

const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';

const TYPE_ACCENT_MAP = {
  infrastructure: '#68796a',
  economy: '#9c7645',
  defense: '#8d5c54',
  wonder: '#7a6877',
};

const RARITY_ACCENT_MAP = {
  common: '#6a6862',
  rare: '#667487',
  epic: '#7a6877',
};

export function TypeBadge({ type, typeStyle, lightTheme = false, variant = 'skin' }) {
  const s = typeStyle[type] ?? typeStyle.infrastructure;
  if (lightTheme) {
    const accent = TYPE_ACCENT_MAP[type] ?? '#68796a';
    if (variant === 'literal') {
      return (
        <span
          className="rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ background: 'rgba(255, 255, 255, 0.72)', border: '1px solid rgba(31, 30, 29, 0.08)', color: accent }}
        >
          {s.label}
        </span>
      );
    }
    return (
      <span
        className="mono rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{
          background: 'var(--card-bg-solid2)',
          border: 'var(--skin-card-border-width,1px) solid var(--line)',
          color: accent,
          fontFamily: MONO_FONT,
        }}
      >
        {s.label}
      </span>
    );
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full border font-semibold ${s.color} ${s.bg} ${s.border}`}>
      {s.label}
    </span>
  );
}

export function RarityBadge({ rarity, lightTheme = false, variant = 'skin' }) {
  const s = RARITY_STYLE[rarity] ?? RARITY_STYLE.common;
  if (lightTheme) {
    const accent = RARITY_ACCENT_MAP[rarity] ?? '#6a6862';
    if (variant === 'literal') {
      return (
        <span
          className="rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ background: 'rgba(31, 30, 29, 0.04)', border: '1px solid rgba(31, 30, 29, 0.08)', color: accent }}
        >
          {s.label}
        </span>
      );
    }
    return (
      <span
        className="mono rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{
          background: 'rgba(31, 30, 29, 0.04)',
          border: 'var(--skin-card-border-width,1px) solid var(--line)',
          color: accent,
          fontFamily: MONO_FONT,
        }}
      >
        {s.label}
      </span>
    );
  }
  return (
    <span className={`text-[11px] px-1.5 py-0.5 rounded-full border font-semibold ${s.color} ${s.bg} ${s.border}`}>
      {s.label}
    </span>
  );
}

export function PerkSummary({ perk, lightTheme = false, variant = 'skin' }) {
  if (!perk) return null;
  if (variant === 'literal') {
    return (
      <div
        className="mt-1.5 rounded-[14px] px-3 py-2"
        style={lightTheme
          ? { background: 'rgba(31, 30, 29, 0.04)', border: '1px solid rgba(31, 30, 29, 0.08)' }
          : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={lightTheme ? { color: '#9a5a48' } : { color: '#f8d6a2' }}>
          {perk.family}
        </p>
        <p className="mt-0.5 text-xs font-semibold" style={lightTheme ? { color: '#1f1e1d' } : { color: '#f8fafc' }}>
          {perk.label}
        </p>
        <p className="mt-0.5 text-xs leading-5" style={lightTheme ? { color: '#6a6862' } : { color: '#cbd5e1' }}>
          {perk.summary}
        </p>
      </div>
    );
  }
  return (
    <div
      className="mt-1.5 px-3 py-2"
      style={lightTheme
        ? { background: 'rgba(31, 30, 29, 0.04)', border: 'var(--skin-card-border-width,1px) solid var(--line)', borderRadius: 'var(--skin-radius-control,14px)' }
        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }}
    >
      <p className="mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={lightTheme ? { color: 'var(--accent2)', fontFamily: MONO_FONT } : { color: '#f8d6a2', fontFamily: MONO_FONT }}>
        {perk.family}
      </p>
      <p className="mt-0.5 text-xs font-semibold" style={lightTheme ? { color: '#1f1e1d' } : { color: '#f8fafc' }}>
        {perk.label}
      </p>
      <p className="mt-0.5 text-xs leading-5" style={lightTheme ? { color: '#6a6862' } : { color: '#cbd5e1' }}>
        {perk.summary}
      </p>
    </div>
  );
}
