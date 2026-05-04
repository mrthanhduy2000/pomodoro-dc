/**
 * electron/main.js — DC Pomodoro Menu Bar
 *
 * Tray-only app (no window, no dock icon).
 * Polls Supabase timer_live table every 3 seconds,
 * then ticks the countdown locally every second.
 */

const { app, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const https = require('https');

const APP_URL = 'https://pomodoro-dc.vercel.app';
const SUPABASE_HOST = 'jcefdsdccmnmqvuwelmm.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_Uiyl9FuyERZFVWBCFw519Q_UZbRmBVG';
const TRAY_TITLE_OPTIONS = { fontType: 'monospacedDigit' };

let tray      = null;
let timerData = null;

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
        if (Array.isArray(rows) && rows.length > 0) timerData = rows[0];
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
    setTrayTitle('');
    return;
  }

  const { is_running, started_at, total_seconds, paused_seconds_remaining } = timerData;

  if (is_running && started_at && total_seconds) {
    const elapsed = (Date.now() - new Date(started_at).getTime()) / 1000;
    const remaining = Math.max(0, total_seconds - elapsed);
    setTrayTitle(`🍅 ${formatTime(remaining)}`);
  } else if (!is_running && paused_seconds_remaining > 0) {
    setTrayTitle(`⏸ ${formatTime(paused_seconds_remaining)}`);
  } else {
    setTrayTitle('');
  }
}

function createTray() {
  const iconPath = path.join(__dirname, '../public/tray-empty.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  trayIcon.setTemplateImage(true);

  tray = new Tray(trayIcon);
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
  fetchTimerLive();
  setInterval(fetchTimerLive, 3000);
  setInterval(updateTrayTitle, 1000);
  updateTrayTitle();
});

app.on('window-all-closed', () => {
  // Keep running as tray-only — do not quit
});
