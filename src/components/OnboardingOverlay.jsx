/**
 * OnboardingOverlay.jsx — 3 thẻ hướng dẫn, chỉ hiện MỘT LẦN cho người dùng mới.
 * Tự quyết định có hiện hay không (đọc cờ settings + số phiên), nên chỉ cần
 * mount một lần trong App là đủ. Người dùng cũ (đã có phiên) không bao giờ thấy.
 */
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';

const STEPS = [
  { icon: '🎯', title: 'Đặt mục tiêu rồi bấm Bắt đầu', body: 'Ghi đích đến cho phiên, chọn thời lượng (mặc định 25 phút) rồi tập trung tới khi hết giờ.' },
  { icon: '🏛️', title: 'Hoàn thành để lớn lên', body: 'Mỗi phiên xong cho XP và tài nguyên — lên cấp, mở kỹ năng và bước qua các thời đại mới.' },
  { icon: '🔥', title: 'Quay lại mỗi ngày', body: 'Hết giờ thì nghỉ ngắn rồi vào lại. Giữ chuỗi ngày liên tục để nhận thưởng lớn hơn.' },
];

export default function OnboardingOverlay() {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const hasViewed = useSettingsStore((s) => s.hasViewedInitialOnboarding);
  const dismiss = useSettingsStore((s) => s.setHasViewedInitialOnboarding);
  const sessionsCompleted = useGameStore((s) => s.progress.sessionsCompleted ?? 0);
  const historyLength = useGameStore((s) => s.history?.length ?? 0);

  // Chỉ hiện cho người MỚI: chưa xem + chưa có phiên nào trong lịch sử.
  const isNewUser = sessionsCompleted === 0 && historyLength === 0;
  if (hasViewed || !isNewUser) return null;

  const lightTheme = uiTheme === 'light';
  const close = () => dismiss(true);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(31,30,29,0.5)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-[440px] rounded-[30px] border px-6 py-6"
        style={{
          background: lightTheme ? 'rgba(255,255,255,0.98)' : 'rgba(24,24,27,0.98)',
          borderColor: lightTheme ? '#d9d6cc' : 'rgba(255,255,255,0.1)',
        }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: lightTheme ? '#9b9892' : '#9ca3af' }}>
          Bắt đầu nhanh
        </p>
        <h2 className="mt-2 text-[1.5rem] font-semibold leading-tight" style={{ color: lightTheme ? '#1f1e1d' : '#fafafa', fontFamily: '"Source Serif 4", Georgia, serif' }}>
          Chào mừng đến Pomodoro DC
        </h2>

        <div className="mt-4 space-y-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex items-start gap-3">
              <span
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[18px]"
                style={{ background: lightTheme ? 'rgba(244,242,236,0.96)' : 'rgba(255,255,255,0.06)' }}
              >
                {step.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold leading-snug" style={{ color: lightTheme ? '#1f1e1d' : '#fafafa' }}>
                  <span className="mono mr-1 text-[11px]" style={{ color: lightTheme ? '#9b9892' : '#9ca3af' }}>{i + 1}.</span>
                  {step.title}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-5" style={{ color: lightTheme ? '#6a6862' : '#a1a1aa' }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={close}
          className="mt-5 w-full rounded-[16px] px-4 py-3 text-sm font-bold"
          style={{ background: '#1f1e1d', color: '#faf9f6' }}
        >
          Bắt đầu thôi
        </button>
      </motion.div>
    </div>
  );
}
