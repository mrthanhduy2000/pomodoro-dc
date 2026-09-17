/**
 * shortcuts.js — THE ONE LIST OF KEYS THE APP ANSWERS TO (round 64, ADR-100).
 *
 * ⚠️ Kept apart from the sheet that draws it for the reason every shared thing in this project is:
 * a second copy is how a key gets renamed in one place and not the other. `ShortcutSheet.jsx`
 * renders this; the handlers that implement the keys live in `PomodoroEngine.jsx` (Space) and
 * `App.jsx` (1–5). Adding a key means adding a row here, or it is undiscoverable.
 */
/**
 * ⚠️ ONE LIST, AND IT IS THE ONLY ONE. Before this file the same four strings were typed inside
 * `PomodoroEngine.jsx`'s render; a second copy is how a shortcut gets renamed in one place and not
 * the other. Anything added to the app's key handling is added HERE too, or it is undiscoverable.
 */
export const SHORTCUTS = [
  { keys: 'Space', what: 'Bắt đầu · tạm dừng · tiếp tục' },
  { keys: '1 – 5', what: 'Đổi tab, đúng thứ tự cột trái' },
  { keys: 'Shift trái + F', what: 'Toàn màn hình' },
  { keys: 'Shift trái + G', what: 'Thu / mở cột phải' },
  { keys: '?', what: 'Giữ để xem bảng này' },
];
