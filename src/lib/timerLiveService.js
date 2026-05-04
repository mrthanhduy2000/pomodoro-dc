import { supabase } from './supabase';

const ID = 'singleton';

export async function updateTimerLive({ isRunning, isBreak = false, startedAt = null, totalSeconds = 0, pausedSecondsRemaining = null }) {
  try {
    await supabase.from('timer_live').upsert({
      id: ID,
      is_running: isRunning,
      is_break: isBreak,
      started_at: startedAt,
      total_seconds: totalSeconds,
      paused_seconds_remaining: pausedSecondsRemaining,
    });
  } catch (err) {
    console.warn('[timerLive] update failed', err);
  }
}

export async function clearTimerLive() {
  try {
    await supabase.from('timer_live').upsert({
      id: ID,
      is_running: false,
      is_break: false,
      started_at: null,
      total_seconds: 0,
      paused_seconds_remaining: null,
    });
  } catch (err) {
    console.warn('[timerLive] clear failed', err);
  }
}
