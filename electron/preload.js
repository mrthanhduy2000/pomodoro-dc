/**
 * electron/preload.js
 *
 * Exposes a safe, narrow IPC bridge to the renderer via contextBridge.
 * Only the methods listed here are available as window.electronAPI.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Send a timer state update so the tray icon title can reflect it.
   * @param {{ state: string, timeLeft: string }} data
   *   state    — one of RUNNING | PAUSED | BREAK | IDLE | FINISHED | CANCELLED
   *   timeLeft — formatted string like "24:37"
   */
  updateTray: (data) => ipcRenderer.send('tray-update', data),
});
