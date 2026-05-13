const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getTrayTitleFromRendererUpdate,
  getTrayTitleFromTimerData,
} = require('./trayTimer');

const startedAt = '2026-05-12T10:00:00.000Z';
const after65Seconds = Date.parse('2026-05-12T10:01:05.000Z');

test('stopwatch tray counts upward even when total_seconds is zero', () => {
  const title = getTrayTitleFromTimerData({
    is_running: true,
    is_break: false,
    mode: 'stopwatch',
    started_at: startedAt,
    total_seconds: 0,
  }, after65Seconds);

  assert.equal(title, '⏱ 1:05');
});

test('legacy timer_live without mode infers stopwatch after the target has elapsed', () => {
  const title = getTrayTitleFromTimerData({
    is_running: true,
    is_break: false,
    started_at: startedAt,
    total_seconds: 60,
  }, after65Seconds);

  assert.equal(title, '⏱ 1:05');
});

test('legacy timer_live without mode treats zero total_seconds as direct stopwatch', () => {
  const title = getTrayTitleFromTimerData({
    is_running: true,
    is_break: false,
    started_at: startedAt,
    total_seconds: 0,
  }, after65Seconds);

  assert.equal(title, '⏱ 1:05');
});

test('pomodoro tray counts down from total_seconds', () => {
  const title = getTrayTitleFromTimerData({
    is_running: true,
    is_break: false,
    mode: 'pomodoro',
    started_at: startedAt,
    total_seconds: 120,
  }, after65Seconds);

  assert.equal(title, '🍅 0:55');
});

test('renderer tray update keeps stopwatch prefix instead of pomodoro prefix', () => {
  const title = getTrayTitleFromRendererUpdate({
    state: 'RUNNING',
    mode: 'stopwatch',
    timeLeft: '00:07',
  });

  assert.equal(title, '⏱ 00:07');
});
