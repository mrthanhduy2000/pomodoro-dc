/**
 * CategoryChip.jsx — extracted from PomodoroEngine.jsx (ADR-077, round 37): the Focus screen keeps only what answers
 * "what session, how long, how long left"; leaf controls live here so the main file can be read.
 */
import useSettingsStore from '../../store/settingsStore';

export default function CategoryChip({ active, color: _identityColour, disabled, label, onClick }) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`max-w-full rounded-full border px-3.5 py-2 text-[13px] font-semibold whitespace-normal break-words text-left leading-snug transition-colors disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 ${
        lightTheme ? 'focus-visible:ring-[rgba(31,30,29,0.14)]' : 'focus-visible:ring-[var(--line-2)]'
      }`}
      /*
        ⚠️ ROUND 64 (ADR-100) — THE CHIP NO LONGER PAINTS ITSELF WITH THE CATEGORY'S OWN HUE.
        `DEFAULT_SESSION_CATEGORIES` carries six raw hexes — amber, indigo, green, cyan, MAGENTA,
        slate — and they predate round 39's three-colour law by a long way, so the law never reached
        them: they live in `constants.js`, not in a component anyone was counting. On the Focus
        screen that meant Đàm's «Sức khoẻ cá nhân» chip glowed `#ec4899` in the middle of an
        orange-and-grey panel. A fourth colour, and the veto table says three.
        ⚠️ THE HUE KEEPS ITS JOB WHERE IT IS DATA. On Thống kê six categories are compared side by
        side and the colour IS the distinction — that is exactly where an identity colour belongs.
        Here only ONE bit matters (chosen / not chosen), and the app already has one way to say it.
        ⚠️ `color` IS STILL ACCEPTED, unused on purpose: `CategoryManager` passes it, Thống kê reads
        the same field, and removing the prop would invite a future edit to re-thread the hex back
        into this file. Keeping the seam explicit is cheaper than re-learning why it was closed.
      */
      style={active
        ? {
            borderColor: lightTheme ? 'var(--line)' : 'rgba(var(--accent-rgb),0.6)',
            background: lightTheme ? 'var(--card-bg-solid)' : 'rgba(var(--accent-rgb),0.16)',
            color: lightTheme ? 'var(--ink)' : 'var(--accent-light)',
            boxShadow: lightTheme ? '0 8px 14px rgba(31,30,29,0.04)' : 'none',
          }
        : {
            borderColor: lightTheme ? 'var(--line)' : 'var(--panel)',
            background: lightTheme ? 'var(--panel-soft)' : 'var(--panel)',
            color: 'var(--muted)',
          }}
    >
      {label}
    </button>
  );
}
