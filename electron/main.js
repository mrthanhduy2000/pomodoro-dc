/**
 * electron/main.js — CivJourney Electron Main Process
 *
 * Creates:
 *   • BrowserWindow — the main app UI (Vite dev server or built files)
 *   • Tray         — macOS status-bar icon that shows the live timer
 *
 * IPC channel "tray-update":
 *   Renderer sends { state: string, timeLeft: string }
 *   States: RUNNING | PAUSED | BREAK | IDLE | FINISHED | CANCELLED
 */

const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');

let tray       = null;
let mainWindow = null;

const isDev = !app.isPackaged;
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:31105';

// ─── Tray icon (18×18 template so macOS inverts it for dark/light bar) ───────
function createTray() {
  const iconPath = path.join(__dirname, '../public/tray-icon.png');
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    // Fallback: 1×1 transparent PNG
    icon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    );
  }
  const trayIcon = icon.resize({ width: 18, height: 18 });
  trayIcon.setTemplateImage(true); // adapts to dark / light menu bar automatically

  tray = new Tray(trayIcon);
  tray.setToolTip('CivJourney');

  const ctxMenu = Menu.buildFromTemplate([
    {
      label: 'Mở CivJourney',
      click: () => { mainWindow?.show(); mainWindow?.focus(); },
    },
    { type: 'separator' },
    { label: 'Thoát', click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(ctxMenu);

  // Left-click → show / focus main window
  tray.on('click', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) mainWindow.focus();
    else mainWindow.show();
  });
}

// ─── Main window ──────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:          1440,
    height:         900,
    minWidth:       900,
    minHeight:      600,
    titleBarStyle:  'hiddenInset',   // macOS native traffic lights inset
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      nodeIntegration:  false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Keep app in tray when the window is closed via the red button
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── IPC: tray title updates from renderer ────────────────────────────────────
ipcMain.on('tray-update', (_, data) => {
  if (!tray) return;
  const { state, timeLeft } = data ?? {};

  switch (state) {
    case 'RUNNING':
      tray.setTitle(` ${timeLeft} ⏱`);
      break;
    case 'PAUSED':
      tray.setTitle(` ${timeLeft} ⏸`);
      break;
    case 'BREAK':
      tray.setTitle(` ${timeLeft} ☕`);
      break;
    default:
      tray.setTitle('');
      break;
  }
});

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createTray();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else { mainWindow?.show(); mainWindow?.focus(); }
  });
});

// On macOS: keep running in tray when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
