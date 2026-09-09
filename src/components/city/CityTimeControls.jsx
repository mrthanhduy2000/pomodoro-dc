/**
 * CityTimeControls.jsx — Round 50 (ADR-090): THE HANDLE ON THE CLOCK AND THE CALENDAR.
 *
 * The scene has followed the real hour since Phase 9 (dawn, noon, dusk, a night with lit windows and,
 * since round 49, fire) and since round 50 the calendar (four seasons) — but Đàm could only ever see
 * the hour it happened to be. This strip under the picture is the missing handle: a 0–23 h slider and
 * four season chips. It owns NO logic — `deriveDaylight(hour)`, `weatherAt(era, hour, season)` and
 * `seasonLook(era, season)` already take these as parameters; the strip only chooses them.
 *
 * ⚠️ A SEALED ERA HAS NO HANDLE. Its hour, weather and season are frozen (ADR-086 · 089 · 090), so the
 * strip shows the frozen state as a caption and nothing else — a slider that does nothing would be a
 * lie about the museum.
 *
 * Buttons paint nothing themselves (ADR-078): skin tokens only.
 */
import { MUSEUM_HOUR } from '../../engine/city3d/daylight';
import { SEASONS, SEASON_LABEL, museumSeason, seasonForMonth } from '../../engine/city3d/season';
import { getVietnamHour, getVietnamMonthIndex } from '../../engine/time';
import { HOUR_MAX, hourCaption } from './cityTimeCopy';

export default function CityTimeControls({ era, dimmed = false, hour = null, season = null, onHour, onSeason }) {
  if (dimmed) {
    return (
      <p className="px-3 text-[11px] sm:px-4" style={{ color: 'var(--muted)' }} data-city-time="museum">
        Bảo tàng — đóng băng lúc {hourCaption(MUSEUM_HOUR)} · {SEASON_LABEL[museumSeason(era)]}
      </p>
    );
  }
  const liveHour = getVietnamHour();
  const liveSeason = seasonForMonth(getVietnamMonthIndex());
  const shownHour = Number.isFinite(hour) ? hour : liveHour;
  const shownSeason = season ?? liveSeason;
  const overridden = Number.isFinite(hour) || season !== null;
  const chip = (active) => ({
    background: active ? 'var(--ink)' : 'var(--canvas)',
    color: active ? 'var(--canvas)' : 'var(--ink)',
    border: '1px solid var(--line)',
  });
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 text-[11px] sm:px-4" data-city-time="live">
      <label className="flex min-w-[180px] flex-1 items-center gap-2">
        <span className="whitespace-nowrap tabular-nums" style={{ color: 'var(--muted)' }}>{hourCaption(shownHour)}</span>
        <input
          type="range"
          min={0}
          max={HOUR_MAX}
          step={1}
          value={Math.round(shownHour)}
          onChange={(e) => onHour?.(Number(e.target.value))}
          aria-label="Giờ trong ngày"
          className="h-1 flex-1 cursor-pointer"
          style={{ accentColor: 'var(--ink)' }}
        />
      </label>
      <div className="flex items-center gap-1" role="group" aria-label="Mùa">
        {SEASONS.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={shownSeason === s}
            onClick={() => onSeason?.(s)}
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={chip(shownSeason === s)}
          >
            {SEASON_LABEL[s]}
          </button>
        ))}
      </div>
      {overridden && (
        <button
          type="button"
          onClick={() => { onHour?.(null); onSeason?.(null); }}
          className="rounded-full px-2 py-0.5 text-[11px]"
          style={{ background: 'var(--canvas)', color: 'var(--muted)', border: '1px solid var(--line)' }}
        >
          ↺ Giờ thật
        </button>
      )}
    </div>
  );
}
