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
        <p className={`text-sm font-semibold text-[var(--ink)]`}>Kỷ luật phiên</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
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
              ? 'bg-[var(--accent)] focus-visible:ring-[rgba(var(--accent-rgb),0.25)]'
              : 'bg-[var(--accent)] focus-visible:ring-[var(--line-2)]'
            : lightTheme
              ? 'bg-[var(--line-2)] focus-visible:ring-[rgba(31,30,29,0.14)]'
              : 'bg-[var(--line-2)] focus-visible:ring-[var(--line-2)]'
        }`}
      >
        <motion.span
          {...knobMotion}
          className="absolute left-1 top-1 size-5 rounded-full bg-[var(--card-bg-solid)] shadow"
        />
      </button>
    </div>
  );
}
