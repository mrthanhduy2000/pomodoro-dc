/**
 * trackingDefaults.js — Default shapes of the small per-day / per-era tracking records the store keeps. Moved verbatim out of gameStore.js (ADR-078).
 *
 * Comments inside are the originals (Vietnamese where they were written so); the rules they
 * explain have not changed by moving. Pure: no store, no DOM.
 */

export const makeDefaultDailyTracking = () => ({
  date:              null,   // 'YYYY-MM-DD'
  sessionsCompleted: 0,
  categoriesUsed:    [],     // string[] — danh mục đã dùng hôm nay
  deepSessionsCompleted: 0,
  hasShortSession:   false,  // ≤25 phút (legacy, giữ cho backward compat)
  hasLongSession:    false,  // ≥60 phút (legacy, giữ cho backward compat)
  hasSession45:      false,  // V2: ≥45 phút (cho Lịch Đầy)
  hasSession60:      false,  // V2: ≥60 phút (cho Lịch Đầy)
  justEnteredNewEra: false,
});

// ─── FACTORY: SKILL ACTIVATIONS (khả năng chủ động) ─────────────────────────

export const makeDefaultSkillActivations = () => ({
  superFocusActive:      false,
  superFocusChargesUsed: 0,
  luckyModeActive:       false,
  luckyModeChargesUsed:  0,
  lastResetDate:         null,  // 'YYYY-MM-DD' — reset charges hàng ngày
  // Bản Cập Nhật Cộng Hưởng (transient, reset theo ngày qua lastResetDate)
});

// ─── FACTORY: CATEGORY TRACKING ──────────────────────────────────────────────

export const makeDefaultCategoryTracking = () => ({
  lastCategoryId:    null,
  consecutiveCount:  0,
});

// ─── FACTORY: ERA TRACKING ───────────────────────────────────────────────────

export const makeDefaultEraTracking = () => ({
  sessionsInCurrentEra: 0,
  currentEraBook:       1,
  erasCompleted:        0,
});

// ─── FACTORY: SESSION META ───────────────────────────────────────────────────

export const makeDefaultSessionMeta = () => ({
  lastSessionCancelled:  false,
  breakCompletedOnTime:  false,
});

// ─── FACTORY: HỆ THỐNG NGHIÊN CỨU & CÔNG TRÌNH ──────────────────────────────
