/**
 * CityPostcard.jsx — THE CITY AT THE TOP OF THE FOCUS SCREEN (ADR-078).
 *
 * Đàm: *"làm sao để tôi THẤY thành phố mà không phải đi tìm nó?"* The 3D city is the most
 * expensive thing in this project and, until this round, the Focus screen showed it as a ghost:
 * a full-page backdrop at 50 % opacity under a scrim that hid up to 92 % of it where the eye
 * lands, frozen on phones, and absent altogether at zero buildings. Nobody ever saw it.
 *
 * This is the opposite object: a framed POSTCARD, full opacity, first thing in the column. It is
 * the same scene the City tab renders (`CityStage`, one tenant more — never a copy), with three
 * rules that decide what it costs and what it says:
 *
 *   1. **Still while a session runs, alive while idle.** Idle is when looking is fine; during the
 *      25 minutes the picture must not move (0 rAF, see `renderLoop.js`) — a battery law and a
 *      focus law at once. Reduced motion keeps it still always.
 *   2. **The camera is on this session's brick.** The scaffold the Focus strip names, or — after an
 *      ending that finished a building — that building, until the next session starts
 *      (`planPostcardFocus`). No scene that makes anyone wait: it is just where the picture looks.
 *   3. **It never swallows a touch.** `interactive={false}` + `pointer-events-none`: the postcard
 *      is a picture, scrolling passes through it, and nothing can pop a card mid-session.
 *
 * Height is fixed and paid for: the streak card moved below the timer and the era bar moved INTO
 * this caption, so the Start button did not sink under the tab bar (measured, see BAN_GIAO).
 * Session 1: the land with the first project's scaffold already staked out — no "empty lot".
 */
import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';

import useGameStore from '../../store/gameStore';
import useSettingsStore from '../../store/settingsStore';
import { computeCityLayout } from '../../engine/cityLayout';
import AppErrorBoundary from '../AppErrorBoundary';
import CityStage from '../city/CityStage';
import EraStageBar from '../shared/EraStageBar';
import { planPostcardFocus, planPostcardLayout, postcardSelection } from './cityPostcard';

const frameStyle = {
  borderRadius: 'var(--skin-radius-card,18px)',
  border: 'var(--skin-card-border-width,1px) solid var(--line)',
  boxShadow: 'var(--skin-card-shadow)',
  background: 'var(--canvas-2)',
};

export default function CityPostcard({
  greeting = null,
  /** ADR-079: the daily-goal fraction, idle only ("Hôm nay 2/5 phiên"). */
  goalLine = null,
  sessionRunning = false,
  /** ADR-079: any timer running (focus or break) ⇒ picture only, no caption, no bar. */
  quiet = false,
  eraStage = null,
  eraProgress = 0,
  totalEP = 0,
  eraEnd = 0,
}) {
  const enabled = useSettingsStore((s) => s.cityHomeBackdrop);
  const buildings = useGameStore((s) => s.buildings);
  const buildingLevels = useGameStore((s) => s.buildingLevels);
  const craftingQueue = useGameStore((s) => s.craftingQueue);
  const activeBook = useGameStore((s) => s.progress.activeBook);
  const sessionsInEra = useGameStore((s) => s.eraTracking?.sessionsInCurrentEra);
  const currentStreak = useGameStore((s) => s.streak?.currentStreak);
  const landedBpId = useGameStore((s) => s.ui.postcardFocusBpId ?? null);
  const reduceMotion = useReducedMotion();

  const sessionCount = sessionsInEra ?? 0;
  const streakLength = currentStreak ?? 0;

  // Layout and focus are memoised APART: the camera target changes far more often than the plots,
  // and `CityScene3D` rebuilds the whole WebGL scene whenever `layout` changes identity.
  const layout = useMemo(
    () => computeCityLayout(planPostcardLayout({
      buildings, buildingLevels, craftingQueue, activeBook, sessionsInEra: sessionCount, currentStreak: streakLength,
    })),
    [buildings, buildingLevels, craftingQueue, activeBook, sessionCount, streakLength],
  );
  const focus = useMemo(
    () => planPostcardFocus({ buildings, craftingQueue, activeBook, landedBpId, sessionRunning }),
    [buildings, craftingQueue, activeBook, landedBpId, sessionRunning],
  );
  const selection = useMemo(() => postcardSelection(layout, focus), [layout, focus]);

  if (!enabled) return null;

  return (
    <AppErrorBoundary area="bưu thiếp thành phố" fallback={() => null} variant="section">
      <section
        aria-label="Thành phố của bạn"
        className="pointer-events-none relative mb-3 h-[168px] w-full overflow-hidden md:mb-4 md:h-[212px]"
        style={frameStyle}
        data-postcard-focus={selection ? `${selection.kind}:${selection.bpId}` : 'home'}
      >
        <div className="absolute inset-0">
          <CityStage
            layout={layout}
            sessionCount={sessionCount}
            streakLength={streakLength}
            reduceMotion={!!reduceMotion}
            still={sessionRunning}
            chrome={false}
            fill
            interactive={false}
            selection={selection}
          />
        </div>
        {/* Two soft scrims, only where text sits — the picture stays at full strength in between.
            While a timer runs (`quiet`) there is no text, so no scrim either: just the city. */}
        {!quiet && (<>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-14"
          style={{ background: 'linear-gradient(to bottom, rgba(12,10,8,0.46), rgba(12,10,8,0))' }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[76px]"
          style={{ background: 'linear-gradient(to top, rgba(12,10,8,0.66), rgba(12,10,8,0))' }}
        />
        {greeting && (
          <div className="absolute left-4 right-4 top-3" style={{ color: 'rgba(255,255,255,0.94)', textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}>
            <p className="text-[13px] font-medium leading-snug">{greeting}</p>
            {goalLine && <p className="mono mt-0.5 text-[10.5px] uppercase tracking-[0.14em] opacity-85">{goalLine}</p>}
          </div>
        )}
        <EraStageBar
          onImage
          className="absolute inset-x-4 bottom-3"
          eraStage={eraStage}
          eraProgress={eraProgress}
          totalEP={totalEP}
          eraEnd={eraEnd}
        />
        </>)}
      </section>
    </AppErrorBoundary>
  );
}
