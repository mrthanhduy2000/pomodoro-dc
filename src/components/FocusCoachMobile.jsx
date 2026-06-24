/**
 * FocusCoachMobile — thẻ AI Coach trên màn Tập trung ĐIỆN THOẠI.
 * Coach giờ chạy trên ĐÁM MÂY (Gemini) → iPhone DÙNG ĐƯỢC (trước đây ẩn vì Qwen cần WebGPU).
 * Render thẳng CoachChat + CoachOffline (cùng prompt + lưới chống-bịa với desktop); trên
 * điện thoại không có Qwen dự phòng nên mất mạng/hết quota sẽ báo lỗi nhẹ.
 * Chỉ hiện khi CHƯA chạy phiên (hidden=false) để giữ màn "Focus tĩnh".
 */
import CoachChat from './CoachChat';
import CoachOffline from './CoachOffline';

export default function FocusCoachMobile({ hidden = false, ...goalProps }) {
  if (hidden) return null;
  return (
    <div className="mt-4 lg:hidden">
      <div className="p-4" style={{ background: '#1f1e1d', borderRadius: 'var(--skin-radius-card,18px)', border: '1px solid rgba(217,164,65,0.22)' }}>
        <div className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#d9a441' }}>AI Coach</div>
        <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: '#e8e4dc' }}>
          Hỏi đáp & phân tích từ số liệu thật của bạn (chạy trên đám mây, cần mạng).
        </p>
        <CoachChat {...goalProps} />
        <CoachOffline {...goalProps} />
      </div>
    </div>
  );
}
