/**
 * keyboard.js — DOM helpers for the global Space shortcut (moved from PomodoroEngine.jsx, ADR-076).
 */
export function isEditableShortcutTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'));
}

export function isSpaceKeyEvent(event) {
  return event.code === 'Space' || event.key === ' ' || event.keyCode === 32;
}
