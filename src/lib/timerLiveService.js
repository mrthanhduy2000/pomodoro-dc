import { supabase } from './supabase';

const ID = 'singleton';
const OPTIONAL_TIMER_LIVE_COLUMNS = new Set(['mode', 'ended_reason']);

function isMissingOptionalColumnError(error) {
  if (!error) return false;
  const text = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`;
  return [...OPTIONAL_TIMER_LIVE_COLUMNS].some((column) => text.includes(column));
}

async function upsertTimerLive(payload) {
  const { error } = await supabase.from('timer_live').upsert(payload);
  if (!error) return;

  if (isMissingOptionalColumnError(error)) {
    const fallbackPayload = { ...payload };
    OPTIONAL_TIMER_LIVE_COLUMNS.forEach((column) => {
      delete fallbackPayload[column];
    });
    if (payload.mode === 'stopwatch' && payload.is_running === true && payload.is_break !== true) {
      fallbackPayload.total_seconds = 0;
    }
    const { error: fallbackError } = await supabase.from('timer_live').upsert(fallbackPayload);
    if (!fallbackError) return;
    throw fallbackError;
  }

  throw error;
}

export async function updateTimerLive({
  isRunning,
  isBreak = false,
  mode = isBreak ? 'break' : 'pomodoro',
  startedAt = null,
  totalSeconds = 0,
  pausedSecondsRemaining = null,
}) {
  try {
    await upsertTimerLive({
      id: ID,
      is_running: isRunning,
      is_break: isBreak,
      mode,
      started_at: startedAt,
      total_seconds: totalSeconds,
      paused_seconds_remaining: pausedSecondsRemaining,
      ended_reason: null,
    });
  } catch (err) {
    console.warn('[timerLive] update failed', err);
  }
}

export async function clearTimerLive({
  isBreak = false,
  mode = isBreak ? 'break' : 'pomodoro',
  pausedSecondsRemaining = null,
  endedReason = null,
} = {}) {
  try {
    await upsertTimerLive({
      id: ID,
      is_running: false,
      is_break: isBreak,
      mode,
      started_at: null,
      total_seconds: 0,
      paused_seconds_remaining: pausedSecondsRemaining,
      ended_reason: endedReason,
    });
  } catch (err) {
    console.warn('[timerLive] clear failed', err);
  }
}
