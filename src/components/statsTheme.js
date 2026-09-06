/**
 * statsTheme.js — bảng màu/chữ DÙNG CHUNG của màn Thống kê (`StatsDashboard` · `StatsJournal` ·
 * `StatsNotes`). Mọi giá trị là biến CSS có mặc định, để skin/theme đổi được từ `index.css` mà
 * không đụng ba file giao diện. Tách ra 2026-09-06 (ADR-071) khi màn Thống kê được chia làm ba file.
 * ⚠️ Màu NHẤN không ở đây: đọc `rgb(var(--accent-rgb))` tại chỗ — app có 5 skin, ba skin khai một
 * `--accent-rgb` khác (`skinTokens.test.js` đỏ nếu chốt cứng mã terracotta của skin mặc định).
 */
export const BG_CARD  = 'var(--card-bg-solid, rgba(255,255,255,0.94))';
export const ACCENT2  = '#8a3f24';
export const TEXT_PRIMARY = 'var(--stats-text-primary, #f8fafc)';
export const TEXT_MUTED   = 'var(--stats-text-muted, #94a3b8)';
export const TEXT_SOFT    = 'var(--stats-text-soft, #64748b)';
export const PANEL_BG     = 'var(--stats-panel-bg, rgba(15, 23, 42, 0.72))';
export const PANEL_BG_SOFT = 'var(--stats-panel-bg-soft, rgba(15, 23, 42, 0.42))';
export const PANEL_BORDER = 'var(--stats-panel-border, rgba(255, 255, 255, 0.08))';
export const TAB_BAR_BG   = 'var(--stats-tab-bar-bg, rgba(244, 242, 236, 0.78))';
export const TAB_IDLE_BG  = 'var(--stats-tab-idle-bg, transparent)';
export const TAB_IDLE_BORDER = 'var(--stats-tab-idle-border, rgba(31,30,29,0.02))';
export const TAB_IDLE_TEXT = 'var(--stats-tab-idle-text, #6a6862)';
export const TAB_ACTIVE_BG = 'var(--stats-tab-active-bg, rgba(255,255,255,0.96))';
export const TAB_ACTIVE_TEXT = 'var(--stats-tab-active-text, #1f1e1d)';
export const TAB_ACTIVE_BORDER = 'var(--stats-tab-active-border, rgba(31,30,29,0.10))';
export const TAB_ACTIVE_SHADOW = 'var(--stats-tab-active-shadow, 0 10px 24px rgba(31,30,29,0.06))';
export const FILTER_PILL_BG = 'var(--stats-filter-pill-bg, rgba(244,242,236,0.76))';
export const FILTER_PILL_BORDER = 'var(--stats-filter-pill-border, rgba(31,30,29,0.06))';
export const FILTER_PILL_TEXT = 'var(--stats-filter-pill-text, #6a6862)';
export const FILTER_PILL_ACTIVE_BG = 'var(--stats-filter-pill-active-bg, rgba(255,255,255,0.96))';
export const FILTER_PILL_ACTIVE_TEXT = 'var(--stats-filter-pill-active-text, #1f1e1d)';
export const FILTER_PILL_ACTIVE_BORDER = 'var(--stats-filter-pill-active-border, rgba(31,30,29,0.10))';
export const JOURNAL_ROW_BG = 'var(--stats-journal-row-bg, linear-gradient(135deg, rgba(15,23,42,0.84) 0%, rgba(15,23,42,0.72) 100%))';
export const JOURNAL_ROW_BORDER = 'var(--stats-journal-row-border, rgba(255,255,255,0.06))';
export const JOURNAL_PANEL_BG = 'var(--stats-journal-panel-bg, rgba(30,41,59,0.45))';
export const JOURNAL_PANEL_BORDER = 'var(--stats-journal-panel-border, rgba(99,102,241,0.12))';
export const JOURNAL_PANEL_TITLE = 'var(--stats-journal-panel-title, #818cf8)';
export const JOURNAL_PANEL_MUTED = 'var(--stats-journal-panel-muted, #64748b)';
export const JOURNAL_PANEL_TEXT = 'var(--stats-journal-panel-text, #e2e8f0)';
export const JOURNAL_PANEL_SUB_BG = 'var(--stats-journal-panel-sub-bg, rgba(15,23,42,0.55))';
export const NOTE_PANEL_BG = 'var(--stats-note-panel-bg, rgba(15,23,42,0.65))';
export const NOTE_PANEL_BORDER = 'var(--stats-note-panel-border, rgba(148,163,184,0.14))';
export const NOTE_PANEL_TITLE = 'var(--stats-note-panel-title, #64748b)';
export const NOTE_PANEL_TEXT = 'var(--stats-note-panel-text, #cbd5e1)';
export const BADGE_BG = 'var(--stats-badge-bg, rgba(15,23,42,0.08))';
export const BADGE_TEXT = 'var(--stats-badge-text, #64748b)';
export const BADGE_STRONG_BG = 'var(--stats-badge-strong-bg, rgba(99,102,241,0.16))';
export const BADGE_STRONG_TEXT = 'var(--stats-badge-strong-text, #a5b4fc)';
export const DISPLAY_FONT = '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif';
