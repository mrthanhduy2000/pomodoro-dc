/**
 * CategoryChip.jsx — extracted from PomodoroEngine.jsx (ADR-077, round 37): the Focus screen keeps only what answers
 * "what session, how long, how long left"; leaf controls live here so the main file can be read.
 */
import useSettingsStore from '../../store/settingsStore';

export default function CategoryChip({ active, color, disabled, label, onClick }) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`max-w-full rounded-full border px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed truncate focus-visible:outline-none focus-visible:ring-2 ${
        lightTheme ? 'focus-visible:ring-[rgba(31,30,29,0.14)]' : 'focus-visible:ring-[var(--line-2)]'
      }`}
      style={active
        ? {
            borderColor: lightTheme ? 'var(--line)' : (color ? `${color}44` : 'rgba(var(--accent-rgb),0.6)'),
            background: lightTheme ? 'var(--card-bg-solid)' : (color ? `${color}20` : 'rgba(var(--accent-rgb),0.16)'),
            color: lightTheme ? 'var(--ink)' : (color ?? 'var(--accent-light)'),
            boxShadow: lightTheme ? '0 8px 14px rgba(31,30,29,0.04)' : 'none',
          }
        : {
            borderColor: lightTheme ? 'var(--line)' : 'var(--panel)',
            background: lightTheme ? 'var(--panel-soft)' : 'var(--panel)',
            color: lightTheme ? 'var(--muted)' : 'var(--muted)',
          }}
    >
      {label}
    </button>
  );
}
