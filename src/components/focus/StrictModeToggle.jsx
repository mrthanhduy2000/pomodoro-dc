/**
 * StrictModeToggle.jsx — extracted from PomodoroEngine.jsx (ADR-077, round 37): the Focus screen keeps only what answers
 * "what session, how long, how long left"; leaf controls live here so the main file can be read.
 */
import { motion } from 'framer-motion';
import { useSnapMotion } from '../../lib/motionPresets';
import useSettingsStore from '../../store/settingsStore';

export default function StrictModeToggle({ disabled, enabled, onChange }) {
  // NGOẠI LỆ (mang bố cục) — vị trí núm gạt CHÍNH LÀ bật/tắt. Bỏ `animate` đi thì núm kẹt bên trái
  // trong khi nền đã đổi màu sang "đang bật": người dùng đọc ra hai câu trả lời trái ngược nhau.
  const knobMotion = useSnapMotion({
    animate: { x: enabled ? 20 : 0 },
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  });
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';

  return (
    <div className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-45' : ''}`}>
      <div>
        <p className={`text-sm font-semibold ${lightTheme ? 'text-slate-900' : 'text-white'}`}>Kỷ luật phiên</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Bật nếu bạn muốn giữ luật phạt khi hủy giữa chừng.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Bật hoặc tắt kỷ luật phiên"
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 ${
          enabled
            ? lightTheme
              ? 'bg-rose-500/85 focus-visible:ring-rose-400/25'
              : 'bg-rose-500/85 focus-visible:ring-white/30'
            : lightTheme
              ? 'bg-slate-300 focus-visible:ring-[rgba(31,30,29,0.14)]'
              : 'bg-slate-700/90 focus-visible:ring-white/30'
        }`}
      >
        <motion.span
          {...knobMotion}
          className="absolute left-1 top-1 size-5 rounded-full bg-white shadow"
        />
      </button>
    </div>
  );
}
