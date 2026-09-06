/**
 * electron/main.js — DC Pomodoro Menu Bar
 *
 * Tray-only app (no window, no dock icon).
 * Nguồn cập nhật CHÍNH là Supabase Realtime (`postgres_changes`) — độ trễ thấp.
 * ⚠️ 2026-09-06 — SỬA GỐC "menu bar mất đếm ngược, lặp lại nhiều lần": trước đây realtime
 * là nguồn DUY NHẤT (chỉ `fetchTimerLive()` một lần lúc khởi động, không có polling định kỳ
 * nào dù comment cũ ở đây từng ghi "polls every 3 seconds" — dòng đó CHƯA BAO GIỜ đúng, xem
 * lịch sử git). Khi Mac ngủ/thức, đổi WiFi, hay socket rớt lặng lẽ (rất thường với app nền
 * chạy cả ngày), kênh realtime có thể ngắt và MẤT LUÔN sự kiện xảy ra trong lúc ngắt — tray
 * kẹt ở dữ liệu cũ vĩnh viễn tới khi khởi động lại app. Nay có 2 lưới an toàn TỰ CHỮA, không
 * phụ thuộc quản lý vòng đời của kênh realtime: (a) polling định kỳ `fetchTimerLive` mỗi
 * `TIMER_LIVE_POLL_INTERVAL_MS` bất kể realtime còn sống hay không; (b) `powerMonitor.on('resume', …)`
 * gọi lại ngay khi Mac thức dậy, để không phải chờ hết chu kỳ poll mới thấy đúng.
 * Sau đó tick đếm ngược cục bộ mỗi giây từ `timerData` đã lưu.
 */

const { app, Tray, Menu, nativeImage, shell, Notification, ipcMain, powerMonitor } = require('electron');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const {
  getTrayTitleFromRendererUpdate,
  getTrayTitleFromTimerData,
  isStopwatchMode,
  parseStartedAtMs,
} = require('./trayTimer');

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
let lastActiveSessionSnapshot = null;
const FOCUS_COMPLETE_OWNER_NAME = 'Đàm';
const SESSION_COMPLETE_GRACE_SECONDS = 2;
// Lưới an toàn: đọc lại timer_live định kỳ dù kênh realtime còn sống hay không.
// KHÔNG hạ thấp hơn nữa để "nhanh hơn" — đây là an toàn dự phòng, tick mỗi giây ở
// `setInterval(updateTrayTitle, 1000)` mới là thứ làm đồng hồ chạy mượt giữa 2 lần poll.
const TIMER_LIVE_POLL_INTERVAL_MS = 5000;

function getRoundedFocusMinutes(totalSeconds) {
  return Math.max(1, Math.round((Number(totalSeconds) || 0) / 60));
}

function createActiveSessionSnapshot(data) {
  const totalSeconds = Number(data?.total_seconds);
  const startedAtMs = parseStartedAtMs(data?.started_at);
  const isStopwatch = isStopwatchMode(data);
  if (!Number.isFinite(totalSeconds) || (!isStopwatch && totalSeconds <= 0) || !startedAtMs) return null;

  return {
    totalSeconds: Math.max(0, totalSeconds),
    startedAtMs,
    isBreak: data?.is_break === true,
    mode: data?.mode,
  };
}

function rememberActiveSessionSnapshot(data) {
  if (!data?.is_running || data?.is_break === true) return;
  const snapshot = createActiveSessionSnapshot(data);
  if (snapshot) {
    lastActiveSessionSnapshot = snapshot;
  }
}

function getRemainingSeconds(snapshot, nowMs = Date.now()) {
  return Math.max(0, snapshot.totalSeconds - ((nowMs - snapshot.startedAtMs) / 1000));
}

function getStopwatchElapsedSeconds(snapshot, nowMs = Date.now()) {
  return Math.max(1, Math.round((nowMs - snapshot.startedAtMs) / 1000));
}

function getCompletedSessionTotalSeconds(previousData, nextData) {
  if (!prevIsRunning || nextData?.is_running || nextData?.paused_seconds_remaining != null) {
    return null;
  }

  if (nextData?.ended_reason !== 'completed') {
    return null;
  }

  const snapshotSource = previousData ?? timerData;
  if (snapshotSource?.is_break === true) {
    return null;
  }

  const snapshot = createActiveSessionSnapshot(snapshotSource)
    ?? lastActiveSessionSnapshot;

  if (!snapshot) return null;
  if (snapshot.isBreak) return null;

  if (isStopwatchMode(snapshotSource) || isStopwatchMode(snapshot)) {
    return getStopwatchElapsedSeconds(snapshot);
  }

  if (getRemainingSeconds(snapshot) > SESSION_COMPLETE_GRACE_SECONDS) return null;

  return snapshot.totalSeconds;
}

function showSessionEndNotification(totalSeconds) {
  const focusMinutes = getRoundedFocusMinutes(totalSeconds);
  new Notification({
    title: '🎇 XONG PHIÊN TẬP TRUNG!',
    body: `Phiên ${focusMinutes} phút của ${FOCUS_COMPLETE_OWNER_NAME} đã xong. Mở app bấm nghỉ giải lao nha!`,
  }).show();
}

// Dùng chung cho CẢ HAI nguồn cập nhật (realtime + poll) — để "lưới an toàn poll" không
// chỉ vá lại countdown mà còn vá lại luôn thông báo "xong phiên" nếu realtime lỡ rớt đúng
// lúc phiên kết thúc. Không trùng lặp logic phát hiện completed ở 2 nơi.
function applyTimerLiveUpdate(newData, previousData) {
  const completedSessionTotalSeconds = getCompletedSessionTotalSeconds(previousData, newData);
  if (completedSessionTotalSeconds != null) {
    showSessionEndNotification(completedSessionTotalSeconds);
  }
  rememberActiveSessionSnapshot(newData);
  prevIsRunning = newData.is_running;
  timerData = newData;
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
          applyTimerLiveUpdate(rows[0], timerData);
        }
      } catch {
        return;
      }
    });
  }).on('error', () => {});
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

  const title = getTrayTitleFromTimerData(timerData);
  if (!title) {
    tray?.setImage(iconNormal);
    setTrayTitle('');
    return;
  }

  tray?.setImage(iconEmpty);
  setTrayTitle(title);
}

function createTray() {
  iconNormal = nativeImage.createFromPath(path.join(__dirname, '../public/tray-template.png'));
  iconNormal = iconNormal.resize({ width: 18, height: 18 });
  iconNormal.setTemplateImage(true);

  // Ảnh RỖNG THẬT (kích thước 0x0), dùng khi tiêu đề đã có emoji 🍅/⏱/☕/⏸ nên
  // không cần icon nữa.
  // ⚠️ ĐỪNG thay bằng file PNG trong suốt: trước 2026-08-10 chỗ này nạp
  // `public/tray-empty.png` 16x16 alpha=0. Trong suốt nên không NHÌN thấy, nhưng
  // macOS vẫn chừa đủ 16 điểm ảnh chỗ cho nó → sinh ra khoảng trắng ngay trước
  // quả cà chua / cốc cà phê trên thanh menu. `createEmpty()` không chiếm chỗ nào.
  iconEmpty = nativeImage.createEmpty();

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

function applyRendererTrayUpdate(data = {}) {
  const title = getTrayTitleFromRendererUpdate(data);
  if (!title) {
    tray?.setImage(iconNormal);
    setTrayTitle('');
    return;
  }

  tray?.setImage(iconEmpty);
  setTrayTitle(title);
}

ipcMain.on('tray-update', (_event, data) => {
  applyRendererTrayUpdate(data);
});

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
        applyTimerLiveUpdate(payload.new, payload.old ?? timerData);
      }
    )
    .subscribe();

  // Tích tắc countdown mỗi giây (tính từ startedAt, không cần poll cho việc này)
  setInterval(updateTrayTitle, 1000);
  updateTrayTitle();

  // Lưới an toàn 1: poll định kỳ — tự chữa nếu kênh realtime lỡ rớt/mất sự kiện
  // (xem chú thích ở đầu file). Không phụ thuộc trạng thái kênh, chỉ đọc lại DB.
  setInterval(fetchTimerLive, TIMER_LIVE_POLL_INTERVAL_MS);

  // Lưới an toàn 2: Mac ngủ rồi thức dậy gần như luôn làm rớt socket cũ — đọc lại
  // NGAY khi thức thay vì chờ tới chu kỳ poll kế tiếp (tối đa TIMER_LIVE_POLL_INTERVAL_MS).
  powerMonitor.on('resume', fetchTimerLive);
});

app.on('window-all-closed', () => {
  // Keep running as tray-only — do not quit
});
