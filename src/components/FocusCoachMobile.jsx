/**
 * FocusCoachMobile — chỗ thẻ AI Coach trên màn Tập trung ĐIỆN THOẠI.
 * AI Coach giờ chỉ còn 1 mô hình = Qwen 3B chạy trên máy, cần WebGPU → iPhone không
 * chạy nổi. Nên trên điện thoại chỉ hiện lời mời mở trên máy tính (đã bỏ ⚡Nhanh/Claude).
 * Chỉ hiện khi CHƯA chạy phiên (hidden=false) để không phá màn "Focus tĩnh khi chạy".
 */
export default function FocusCoachMobile({ hidden = false }) {
  if (hidden) return null;
  return (
    <div className="mt-4 lg:hidden">
      <div className="p-4" style={{ background: '#1f1e1d', borderRadius: 'var(--skin-radius-card,18px)', border: '1px solid rgba(217,164,65,0.22)' }}>
        <div className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#d9a441' }}>AI Coach</div>
        <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: '#e8e4dc' }}>
          AI Coach chạy bằng một mô hình AI ngay trên máy (offline) — điện thoại không đủ sức chạy.
        </p>
        <p className="mt-1.5 text-[11px] leading-snug" style={{ color: 'rgba(232,228,220,0.55)' }}>
          Mở app trên máy tính để dùng AI Coach (hỏi đáp + phân tích chuyên sâu).
        </p>
      </div>
    </div>
  );
}
