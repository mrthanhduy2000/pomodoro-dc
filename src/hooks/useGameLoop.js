/**
 * useGameLoop.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Keeps the persisted break session in sync with real time.
 *
 * - Restores an active break after reload
 * - Reconciles missed minutes after tab throttling / sleep
 * - Finishes the break when its wall-clock deadline passes
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect } from 'react';
import useGameStore from '../store/gameStore';

/**
 * useGameLoop
 * Attaches a global 1-second interval that keeps the break UI aligned with
 * the persisted break session state.
 */
export function useGameLoop() {
  const isOnBreak = useGameStore((s) => s.ui.isOnBreak);
  const breakSecsLeft = useGameStore((s) => s.ui.breakSecondsLeft);
  const breakSessionRunning = useGameStore((s) => s.breakSession.isRunning);
  const syncBreakSession = useGameStore((s) => s.syncBreakSession);

  useEffect(() => {
    if (!breakSessionRunning) {
      return;
    }

    syncBreakSession();

    const id = setInterval(() => {
      syncBreakSession();
    }, 1_000);

    return () => clearInterval(id);
  }, [breakSessionRunning, syncBreakSession]);

  useEffect(() => {
    if (!breakSessionRunning) return;

    const handleFocus = () => syncBreakSession();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncBreakSession();
    };
    // pageshow fires when iOS restores the page from BFCache (back-forward cache),
    // which visibilitychange misses on some iPhone PWA scenarios.
    const handlePageShow = () => syncBreakSession();

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [breakSessionRunning, syncBreakSession]);

  const breakMinutesLeft = Math.floor(breakSecsLeft / 60);
  const breakSecondsDisp = breakSecsLeft % 60;

  return {
    isOnBreak,
    breakSecsLeft,
    breakMinutesLeft,
    breakSecondsDisp,
  };
}
