/**
 * RewardCard.jsx — MỘT thẻ phần thưởng dùng chung cho cả app (2026-08-27, ADR-060).
 * ─────────────────────────────────────────────────────────────────────────────
 * Đặt cạnh `BadgeKit.jsx` vì cùng vai: mảnh giao diện dùng chung giữa nhiều màn.
 *
 * Trước file này có bảy đường trao thưởng và bảy cách vẽ khác nhau — hộp thoại
 * phần thưởng có `SupportRewardCard` + `ResourceCascade` + `BonusPill` (ba hình
 * cho ba loại thưởng, trong CÙNG một hộp thoại), toast thành tích có hình thứ tư,
 * nhiệm vụ ngày có hình thứ năm. Hệ quả không phải "xấu" mà là **không so được**:
 * Đàm không có cách nào nhìn hai phần thưởng đến từ hai đường rồi biết cái nào
 * quý hơn, vì chúng không nói cùng một thứ tiếng.
 *
 * ⚠️ THẺ NÀY CHỈ VẼ, KHÔNG TÍNH. Nó không đọc store, không biết luật chơi, không
 * quyết định gì. Mọi con số đi vào qua props. Đó là lý do nó dùng được cả trong
 * hộp thoại lẫn trong toast mà không kéo theo phần nào của luật chơi.
 *
 * ⚠️ ĐỘ HIẾM PHẢI ĐỌC ĐƯỢC KHI KHÔNG NHÌN MÀU. Bốn bậc có bốn màu, nhưng màu là
 * tín hiệu THỨ BA. Tín hiệu thứ nhất là NHÃN CHỮ ("Thường/Tốt/Hiếm/Huyền thoại"),
 * thứ hai là số chấm. Một thẻ chỉ khác nhau ở màu là một thẻ vô hình với người mù
 * màu, trên ảnh chụp đen trắng, và ngoài nắng.
 */
import { getRewardTier } from '../../engine/rewardTiers';

const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';

/** Số → "+1.234"; chuỗi → giữ nguyên (để chỗ gọi tự viết "Không có", "×2.0"…). */
function formatAmount(amount) {
  if (amount === null || amount === undefined || amount === '') return null;
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount) || amount === 0) return null;
    return `${amount > 0 ? '+' : ''}${amount.toLocaleString('vi-VN')}`;
  }
  return String(amount);
}

/**
 * Dải chấm — tín hiệu độ hiếm KHÔNG phụ thuộc màu.
 * `aria-hidden` vì nhãn chữ ngay bên cạnh đã nói đúng điều này cho trình đọc màn
 * hình; đọc thêm bốn dấu chấm là nhiễu.
 */
function TierPips({ tier }) {
  return (
    <span className="inline-flex items-center gap-[2px]" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <span
          key={index}
          className="block h-[3px] w-[3px] rounded-full"
          style={{
            background: index < tier.pips ? tier.colorVar : 'var(--line)',
            opacity: index < tier.pips ? 1 : 0.7,
          }}
        />
      ))}
    </span>
  );
}

export function RewardTierBadge({ tier: tierKey }) {
  const tier = getRewardTier(tierKey);
  return (
    <span
      className="mono inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.16em]"
      style={{
        color: tier.colorVar,
        background: 'var(--card-bg-solid2, rgba(127,127,127,0.08))',
        border: 'var(--skin-card-border-width,1px) solid var(--line)',
        fontFamily: MONO_FONT,
      }}
    >
      <TierPips tier={tier} />
      {tier.label}
    </span>
  );
}

/**
 * @param {string}  icon        - emoji hoặc 1–2 chữ cái viết tắt
 * @param {string}  name        - tên phần thưởng
 * @param {string}  tier        - khoá bậc ở `engine/rewardTiers.js`; sai/thiếu → "thường"
 * @param {string}  description - ĐÚNG MỘT DÒNG; dài hơn thì bị cắt bằng "…"
 * @param {number|string} amount - số lượng, nếu có
 * @param {node}    action      - ô tuỳ chọn ở góc phải (nút "Nhận", nhãn trạng thái…)
 * @param {boolean} compact     - bản gọn cho toast
 */
export default function RewardCard({
  icon,
  name,
  tier: tierKey,
  description,
  amount,
  action = null,
  onClick,
  compact = false,
  className = '',
  style,
}) {
  const tier = getRewardTier(tierKey);
  const amountText = formatAmount(amount);
  const interactive = typeof onClick === 'function';
  const Wrapper = interactive ? 'button' : 'div';

  return (
    <Wrapper
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-3 text-left ${compact ? 'px-3.5 py-3' : 'px-4 py-3.5'} ${className}`}
      style={{
        background: 'var(--card-bg-solid)',
        border: 'var(--skin-card-border-width,1px) solid var(--line)',
        borderRadius: 'var(--skin-radius-card,18px)',
        // Vệt màu bên trái: bậc đọc được ngay cả khi thẻ bị cắt cụt trong một
        // chồng toast. Đây là chỗ DUY NHẤT màu bậc chạm vào khung thẻ — nền và
        // viền giữ nguyên như mọi thẻ khác để phần thưởng không thành biển quảng cáo.
        borderLeft: `3px solid ${tier.colorVar}`,
        ...style,
      }}
    >
      <span
        className="mono flex shrink-0 items-center justify-center text-[15px] leading-none"
        style={{
          width: compact ? 38 : 44,
          height: compact ? 38 : 44,
          borderRadius: 'var(--skin-radius-control,14px)',
          background: 'var(--card-bg-solid2, rgba(127,127,127,0.06))',
          border: 'var(--skin-card-border-width,1px) solid var(--line)',
          fontFamily: MONO_FONT,
          color: 'var(--ink)',
        }}
        aria-hidden
      >
        {icon}
      </span>

      {/*
        ⚠️ BỐ CỤC NÀY ĐÃ QUA HAI LẦN ẢNH BÁC BỎ — đừng gộp lại thành một hàng.
        Bản 1 xếp `[bậc] [mô tả]` chung hàng: nhãn bậc rộng cố định nên mô tả bị cắt
        còn "Tài ng…", "Đ..". Bản 2 đưa bậc lên cạnh TÊN: lần này TÊN chịu trận —
        "Nghiên cứu" ra thành "N.", "Hàng Hóa Tinh Luyện" ra thành "Hàng …".
        Bản đang dùng: TÊN chiếm trọn hàng trên (nó là thứ phải đọc được trước hết),
        còn `[bậc] [mô tả]` ở hàng dưới có `flex-wrap` + bề ngang tối thiểu cho mô tả
        — thẻ rộng thì hai thứ nằm cạnh nhau, thẻ hẹp thì mô tả tự rơi xuống hàng
        riêng và lấy trọn bề ngang. Không chỗ nào phải chọn giữa tên và mô tả nữa.
      */}
      <span className="min-w-0 flex-1">
        {/*
          ⚠️ `line-clamp-2` chứ KHÔNG phải `truncate`. Ở khung 390px thẻ chỉ rộng
          308px, và sau khi trừ icon + ô số lượng thì tên còn ~130px — `truncate`
          cho ra "Thưởng trọn n…" trên máy Đàm. Tên là thứ phải đọc được TRƯỚC
          NHẤT, nên nó được phép xuống dòng; hai dòng là trần để một cái tên dài
          bất thường không thổi phồng cả thẻ (cùng lưới an toàn `SkillTree` dùng).
        */}
        <span
          className="block line-clamp-2 text-[14px] font-semibold leading-tight"
          style={{ color: 'var(--ink)', fontFamily: 'var(--skin-font-display)' }}
        >
          {name}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <RewardTierBadge tier={tier.key} />
          {description && (
            <span
              className="min-w-[9rem] flex-1 truncate text-[11px] leading-snug"
              style={{ color: 'var(--muted)' }}
            >
              {description}
            </span>
          )}
        </span>
      </span>

      {amountText && (
        <span
          className="mono shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums"
          style={{
            color: 'var(--ink)',
            background: 'var(--card-bg-solid2, rgba(127,127,127,0.08))',
            border: 'var(--skin-card-border-width,1px) solid var(--line)',
            fontFamily: MONO_FONT,
          }}
        >
          {amountText}
        </span>
      )}

      {action && <span className="shrink-0">{action}</span>}
    </Wrapper>
  );
}
