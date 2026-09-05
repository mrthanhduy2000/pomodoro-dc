/**
 * BadgeGrid.jsx — 360 huy hiệu dưới dạng MỘT BỘ SƯU TẬP NHÌN THẤY ĐƯỢC.
 *
 * ⚠️ VÌ SAO ĐẬP ĐI XÂY LẠI (2026-09-02, lệnh Đàm lặp lại lần thứ ba: *"UX/UI và mọi thứ ở hành
 * trang vẫn chưa thấy thay đổi gì… đừng có quá đo tiểu tiết, nên thực hiện lớn"*).
 *
 * Bản cũ vẽ mỗi huy hiệu thành MỘT HÀNG CHỮ đầy đủ: icon nhỏ, tên, mô tả, thanh tiến độ, ngày đạt.
 * Với 360 mục thì đó là một **bảng tính**, không phải một bộ sưu tập — dài tới mức phải cắt bớt
 * ("đang hiện 40/203 mục để giữ giao diện nhẹ hơn"), tức chính giao diện thừa nhận nó quá dài.
 * Và một bảng tính thì không bao giờ cho cảm giác *"nhìn kìa, mình có ngần này rồi"*.
 *
 * Lưới này đảo lại: mỗi huy hiệu là MỘT Ô VUÔNG. Cả bộ sưu tập lọt vào vài màn hình, mắt đọc được
 * hình dạng của nó trong một cái liếc — chỗ nào dày, chỗ nào thưa, còn bao nhiêu ô xám.
 *
 * ⚠️ Ô XÁM LÀ MỘT PHẦN CỦA THIẾT KẾ, KHÔNG PHẢI CHỖ TRỐNG CẦN GIẤU. Một bộ sưu tập chỉ có nghĩa
 * khi thấy được phần CHƯA có — đó là thứ khiến người ta muốn lấp đầy. Nhưng ô chưa đạt mà đang có
 * tiến độ thì hiện một vòng cung theo % (`tienDo`), nên "chưa có" vẫn khác "chưa bắt đầu".
 */
import React from 'react';

const BAC_MAU = {
  bronze: 'var(--warn)',
  silver: 'var(--muted)',
  gold: 'var(--accent)',
  platinum: 'var(--good)',
};

function mauBac(tier) {
  return BAC_MAU[tier] ?? 'var(--muted)';
}

/** Một ô. Đạt rồi thì rực; chưa đạt thì xám + vòng cung tiến độ nếu đo được. */
function O({ entry, onSelect }) {
  const a = entry.achievement ?? {};
  const dat = !!entry.isUnlocked;
  const pct = dat ? 1 : (entry.tienDo?.tiLe ?? 0);
  const mau = mauBac(a.tier);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(entry)}
      title={`${a.label ?? entry.id}${dat ? '' : ` — ${Math.round(pct * 100)}%`}`}
      className="relative flex aspect-square items-center justify-center transition-transform active:scale-95"
      style={{
        borderRadius: 'var(--skin-radius-control,14px)',
        background: dat
          ? `color-mix(in srgb, ${mau} 14%, var(--card-bg-solid))`
          : 'var(--card-bg-solid2, rgba(127,127,127,0.05))',
        border: `1px solid ${dat ? `color-mix(in srgb, ${mau} 40%, var(--line))` : 'var(--line)'}`,
        opacity: dat ? 1 : 0.55,
      }}
    >
      <span className="text-[20px] leading-none" style={{ filter: dat ? 'none' : 'grayscale(1)' }} aria-hidden>
        {a.icon ?? '•'}
      </span>

      {/* Vòng cung tiến độ cho ô CHƯA đạt: "chưa có" khác hẳn "chưa bắt đầu". */}
      {!dat && pct > 0.02 && (
        <span
          className="absolute bottom-[3px] left-[4px] right-[4px] h-[3px] overflow-hidden"
          style={{ borderRadius: 999, background: 'color-mix(in srgb, var(--ink) 10%, transparent)' }}
        >
          <span className="block h-full" style={{ width: `${Math.round(pct * 100)}%`, background: mau }} />
        </span>
      )}
    </button>
  );
}

export default function BadgeGrid({ entries = [], onSelect = null, emptyLabel = 'Không có dấu nào.' }) {
  if (entries.length === 0) {
    return (
      <div
        className="border border-dashed px-5 py-10 text-center text-sm"
        style={{ borderRadius: 'var(--skin-radius-card,18px)', borderColor: 'var(--line-2)', color: 'var(--muted)' }}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10 md:grid-cols-12">
      {entries.map((e) => <O key={e.id} entry={e} onSelect={onSelect} />)}
    </div>
  );
}
