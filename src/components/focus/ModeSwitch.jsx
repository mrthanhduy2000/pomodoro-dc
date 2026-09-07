/**
 * ModeSwitch.jsx — extracted from PomodoroEngine.jsx (ADR-077, round 37): the Focus screen keeps only what answers
 * "what session, how long, how long left"; leaf controls live here so the main file can be read.
 */
import { motion } from 'framer-motion';
import { useSnapMotion } from '../../lib/motionPresets';
import useSettingsStore from '../../store/settingsStore';
import { TIMER_MODES } from '../../hooks/useTimer';

export default function ModeSwitch({ disabled, mode, onChange }) {
  // NGOẠI LỆ (mang bố cục) — viên nền trượt từ tab cũ sang tab mới bằng `layoutId`. Vị trí của
  // nó CHÍNH LÀ tab đang chọn, nên bật Giảm chuyển động thì nó nhảy chứ không biến mất.
  const pillMotion = useSnapMotion({ transition: { type: 'spring', stiffness: 320, damping: 28 } });
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  return (
    <div className={`inline-flex rounded-full border p-1 ${disabled ? 'opacity-45' : ''} ${
      lightTheme
        ? 'border-[var(--line)] bg-[rgba(244,242,236,0.96)]'
        : 'border-[var(--line)] bg-[var(--panel-soft)]'
    }`}>
      {[
        { id: TIMER_MODES.POMODORO, label: 'Pomo' },
        { id: TIMER_MODES.STOPWATCH, label: 'Bấm giờ' },
      ].map((item) => {
        const active = item.id === mode;
        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(item.id)}
            className={`relative rounded-full px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 md:px-4 ${
              active
                ? lightTheme
                  ? 'text-[var(--canvas)] focus-visible:ring-[rgba(31,30,29,0.14)]'
                  : 'text-[var(--canvas)] focus-visible:ring-[var(--line-2)]'
                : lightTheme
                  ? 'text-[var(--muted)] hover:text-[var(--ink)] focus-visible:ring-[rgba(31,30,29,0.14)]'
                  : 'text-[var(--muted)] hover:text-[var(--ink)] focus-visible:ring-[var(--line-2)]'
            }`}
          >
            {active && (
              <motion.span
                layoutId="focus-mode-indicator"
                className={`absolute inset-0 rounded-full ${
                  lightTheme
                    ? 'bg-[var(--ink)] shadow-[0_10px_20px_rgba(31,30,29,0.14)]'
                    : 'bg-[var(--panel-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                }`}
                {...pillMotion}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
