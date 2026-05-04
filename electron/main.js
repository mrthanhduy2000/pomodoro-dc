/**
 * electron/main.js — DC Pomodoro Menu Bar
 *
 * Tray-only app (no window, no dock icon).
 * Polls Supabase timer_live table every 3 seconds,
 * then ticks the countdown locally every second.
 */

const { app, Tray, Menu, nativeImage, shell, Notification } = require('electron');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const APP_URL      = 'https://pomodoro-dc.vercel.app';
const SUPABASE_URL = 'https://jcefdsdccmnmqvuwelmm.supabase.co';
const SUPABASE_HOST = 'jcefdsdccmnmqvuwelmm.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_Uiyl9FuyERZFVWBCFw519Q_UZbRmBVG';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: { transport: WebSocket },
});
const TRAY_TITLE_OPTIONS = { fontType: 'monospacedDigit' };

let tray          = null;
let timerData     = null;
let iconNormal    = null;
let iconEmpty     = null;
let prevIsRunning = null; // null = chưa biết (lần fetch đầu tiên)

function showSessionEndNotification() {
  new Notification({
    title: '🍅 Phiên hoàn thành!',
    body: 'Tốt lắm! Đã xong một phiên tập trung. Nghỉ ngơi một chút nhé.',
  }).show();
}

function fetchTimerLive() {
  const options = {
    hostname: SUPABASE_HOST,
    path: '/rest/v1/timer_live?id=eq.singleton&select=*',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  };

  https.get(options, (res) => {
    let raw = '';
    res.on('data', (chunk) => { raw += chunk; });
    res.on('end', () => {
      try {
        const rows = JSON.parse(raw);
        if (Array.isArray(rows) && rows.length > 0) {
          const newData = rows[0];
          prevIsRunning = newData.is_running;
          timerData = newData;
        }
      } catch {
        return;
      }
    });
  }).on('error', () => {});
}

function formatTime(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function setTrayTitle(title = '') {
  if (!tray) return;
  tray.setTitle(title, TRAY_TITLE_OPTIONS);
}

function updateTrayTitle() {
  if (!timerData) {
    tray?.setImage(iconNormal);
    setTrayTitle('');
    return;
  }

  const { is_running, started_at, total_seconds, paused_seconds_remaining } = timerData;

  if (is_running && started_at && total_seconds) {
    const elapsed = (Date.now() - new Date(started_at).getTime()) / 1000;
    const remaining = Math.max(0, total_seconds - elapsed);
    tray?.setImage(iconEmpty);
    setTrayTitle(`🍅 ${formatTime(remaining)}`);
  } else if (!is_running && paused_seconds_remaining > 0) {
    tray?.setImage(iconEmpty);
    setTrayTitle(`⏸ ${formatTime(paused_seconds_remaining)}`);
  } else {
    tray?.setImage(iconNormal);
    setTrayTitle('');
  }
}

function createTray() {
  iconNormal = nativeImage.createFromPath(path.join(__dirname, '../public/tray-template.png'));
  iconNormal = iconNormal.resize({ width: 18, height: 18 });
  iconNormal.setTemplateImage(true);

  iconEmpty = nativeImage.createFromPath(path.join(__dirname, '../public/tray-empty.png'));
  iconEmpty.setTemplateImage(true);

  tray = new Tray(iconNormal);
  tray.setToolTip('DC Pomodoro');

  const ctxMenu = Menu.buildFromTemplate([
    {
      label: 'Mở DC Pomodoro',
      click: () => shell.openExternal(APP_URL),
    },
    { type: 'separator' },
    { label: 'Thoát', click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(ctxMenu);

  tray.on('click', () => shell.openExternal(APP_URL));
}

app.whenReady().then(() => {
  if (app.dock) app.dock.hide();

  createTray();

  // Lấy trạng thái hiện tại ngay khi khởi động
  fetchTimerLive();

  // Real-time: nhận ngay khi web app thay đổi timer state
  supabase
    .channel('timer-live-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'timer_live', filter: 'id=eq.singleton' },
      (payload) => {
        const newData = payload.new;
        if (prevIsRunning === true && !newData.is_running && newData.paused_seconds_remaining == null) {
          showSessionEndNotification();
        }
        prevIsRunning = newData.is_running;
        timerData = newData;
      }
    )
    .subscribe();

  // Tích tắc countdown mỗi giây (tính từ startedAt, không cần poll)
  setInterval(updateTrayTitle, 1000);
  updateTrayTitle();
});

app.on('window-all-closed', () => {
  // Keep running as tray-only — do not quit
});
