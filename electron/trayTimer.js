const STOPWATCH_MODE = 'stopwatch';
const BREAK_MODE = 'break';

function normalizeMode(mode) {
  return typeof mode === 'string' ? mode.toLowerCase() : '';
}

function isStopwatchMode(data = {}) {
  return normalizeMode(data.mode) === STOPWATCH_MODE
    || data.isStopwatch === true
    || data.is_stopwatch === true;
}

function hasExplicitMode(data = {}) {
  return normalizeMode(data.mode) !== '';
}

function parseStartedAtMs(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatTime(totalSec) {
  const s = Math.max(0, Math.floor(Number(totalSec) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function shouldInferLegacyStopwatch(data = {}, elapsed = 0) {
  if (hasExplicitMode(data) || data.is_break === true) return false;

  const totalSeconds = Number(data.total_seconds ?? data.totalSeconds);
  if (!Number.isFinite(totalSeconds)) return false;

  return totalSeconds <= 0 || elapsed >= totalSeconds;
}

function getRunningDisplay(data = {}, nowMs = Date.now()) {
  const startedAtMs = parseStartedAtMs(data.started_at ?? data.startedAt);
  if (startedAtMs == null) return null;

  const elapsed = Math.max(0, (nowMs - startedAtMs) / 1000);
  if (isStopwatchMode(data) || shouldInferLegacyStopwatch(data, elapsed)) {
    return { seconds: elapsed, isStopwatch: true };
  }

  const totalSeconds = Number(data.total_seconds ?? data.totalSeconds);
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;

  return { seconds: Math.max(0, totalSeconds - elapsed), isStopwatch: false };
}

function getRunningDisplaySeconds(data = {}, nowMs = Date.now()) {
  return getRunningDisplay(data, nowMs)?.seconds ?? null;
}

function getRunningPrefix(data = {}) {
  const state = typeof data.state === 'string' ? data.state.toUpperCase() : '';
  if (data.is_break === true || state === BREAK_MODE.toUpperCase() || normalizeMode(data.mode) === BREAK_MODE) {
    return '☕';
  }

  return isStopwatchMode(data) ? '⏱' : '🍅';
}

function getPausedSeconds(data = {}) {
  const pausedSeconds = Number(data.paused_seconds_remaining ?? data.pausedSecondsRemaining);
  return Number.isFinite(pausedSeconds) && pausedSeconds > 0 ? pausedSeconds : null;
}

function getTrayTitleFromTimerData(data, nowMs = Date.now()) {
  if (!data) return '';

  if (data.is_running === true) {
    const display = getRunningDisplay(data, nowMs);
    if (!display) return '';
    const prefix = display.isStopwatch ? '⏱' : getRunningPrefix(data);
    return `${prefix} ${formatTime(display.seconds)}`;
  }

  const pausedSeconds = getPausedSeconds(data);
  if (pausedSeconds != null) return `⏸ ${formatTime(pausedSeconds)}`;

  return '';
}

function getTrayTitleFromRendererUpdate(data = {}) {
  const timeLeft = typeof data.timeLeft === 'string' ? data.timeLeft : '';
  if (!timeLeft) return '';

  const state = typeof data.state === 'string' ? data.state.toUpperCase() : '';
  const prefix = state === 'PAUSED' ? '⏸' : getRunningPrefix(data);
  return `${prefix} ${timeLeft}`;
}

module.exports = {
  formatTime,
  getRunningDisplaySeconds,
  getTrayTitleFromRendererUpdate,
  getTrayTitleFromTimerData,
  isStopwatchMode,
  parseStartedAtMs,
};
