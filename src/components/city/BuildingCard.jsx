/**
 * BuildingCard.jsx — thẻ hiện ra khi Đàm CHẠM vào một công trình trong thành phố.
 *
 * ⚠️ Vì sao thẻ này đáng có, khi Kho báu → Xưởng vốn đã liệt kê đặc quyền:
 * ở Xưởng, Đàm đọc một BẢNG. Ở đây anh chỉ vào MỘT CĂN NHÀ trên màn hình và nó tự nói nó là ai.
 * Đó là khác biệt giữa "tra cứu" và "sở hữu" — và là thứ biến bức tranh thành một thành phố của
 * chính mình. Nội dung vẫn lấy từ đúng một nguồn (`BUILDING_EFFECTS` qua `computeCityLayout`), nên
 * không có bản sao dữ liệu nào được sinh ra.
 *
 * Thuần trình bày: không đọc store, không tự tra cứu gì — nhận sẵn phần tử của
 * `layout.buildings` / `layout.scaffolds`.
 */

import { motion } from 'framer-motion';
import { useEnterMotion } from '../../lib/motionPresets';

import { cardStyle, eraSolid } from './cityTokens';

const RARITY_LABEL = { common: 'thường', rare: 'hiếm', epic: 'sử thi' };
const TYPE_LABEL = {
  infrastructure: 'hạ tầng',
  economy: 'kinh tế',
  defense: 'phòng thủ',
  wonder: 'kỳ quan',
};

export default function BuildingCard({ item, era, onClose }) {
  const enterMotion = useEnterMotion();
  if (!item) return null;

  const scaffold = item.kind === 'scaffold';
  const accent = eraSolid(era);

  return (
    <motion.div
      // Khoá theo bpId ⇒ chạm sang công trình khác thì thẻ ĐỔI HẲN chứ không trượt nội dung, và
      // mắt nhận ra ngay là mình vừa chọn thứ khác.
      key={item.bpId}
      {...enterMotion}
      className="pointer-events-auto w-full max-w-[320px] p-3"
      style={{ ...cardStyle, backdropFilter: 'blur(10px)' }}
      role="dialog"
      aria-label={`Thông tin ${item.label}`}
    >
      <div className="flex items-start gap-2">
        <span className="text-[18px] leading-none" aria-hidden="true">{item.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>
            {item.label}
          </div>
          <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--muted-2)' }}>
            {scaffold
              ? 'đang xây'
              : [
                TYPE_LABEL[item.type] ?? item.type,
                RARITY_LABEL[item.rarity] ?? item.rarity,
                item.level > 1 ? `cấp ${item.level}` : null,
              ].filter(Boolean).join(' · ')}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="-mr-1 -mt-1 shrink-0 rounded-full px-2 py-1 text-[13px] leading-none"
          style={{ color: 'var(--muted)' }}
        >
          ✕
        </button>
      </div>

      {scaffold ? (
        <div className="mt-2.5">
          <div className="flex items-baseline justify-between gap-2 text-[11px]">
            <span style={{ color: 'var(--muted)' }}>
              {item.total ? `${item.total - item.remaining}/${item.total} phiên` : 'đang dựng'}
            </span>
            <span className="mono" style={{ color: accent }}>
              {item.remaining > 0 ? `còn ${item.remaining} phiên` : 'sắp xong'}
            </span>
          </div>
          <div
            className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: 'var(--line-2)' }}
            role="progressbar"
            aria-valuenow={Math.round(item.progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(3, item.progress * 100)}%`, background: accent }}
            />
          </div>
          {item.reward && (
            <div className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              Mở khoá: {item.reward}
            </div>
          )}
        </div>
      ) : (
        item.perk?.summary || item.perk?.label ? (
          <div className="mt-2.5 text-[11px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            {item.perk.label && (
              <span className="font-semibold" style={{ color: accent }}>{item.perk.label}. </span>
            )}
            {item.perk.summary}
          </div>
        ) : (
          <div className="mt-2.5 text-[11px]" style={{ color: 'var(--muted)' }}>
            Công trình này không mang đặc quyền riêng.
          </div>
        )
      )}
    </motion.div>
  );
}
