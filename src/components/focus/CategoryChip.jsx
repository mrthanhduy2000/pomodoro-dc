/**
 * CategoryChip.jsx — extracted from PomodoroEngine.jsx (ADR-076, round 37): the Focus screen keeps only what answers
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
        lightTheme ? 'focus-visible:ring-[rgba(31,30,29,0.14)]' : 'focus-visible:ring-white/30'
      }`}
      style={active
        ? {
            borderColor: lightTheme ? 'rgba(217,214,204,0.98)' : (color ? `${color}44` : 'rgba(129,140,248,0.6)'),
            background: lightTheme ? 'rgba(255,255,255,0.98)' : (color ? `${color}20` : 'rgba(99,102,241,0.16)'),
            color: lightTheme ? '#1f1e1d' : (color ?? '#c7d2fe'),
            boxShadow: lightTheme ? '0 8px 14px rgba(31,30,29,0.04)' : 'none',
          }
        : {
            borderColor: lightTheme ? 'rgba(217,214,204,0.95)' : 'rgba(255,255,255,0.08)',
            background: lightTheme ? 'rgba(244,242,236,0.82)' : 'rgba(255,255,255,0.03)',
            color: lightTheme ? '#6a6862' : 'rgb(148 163 184)',
          }}
    >
      {label}
    </button>
  );
}
