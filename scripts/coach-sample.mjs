/**
 * coach-sample.mjs — CÔNG CỤ DEV (không vào app): dựng một lịch sử người dùng GIẢ
 * ĐỊNH nhưng thực tế (vài chục giờ, nhiều buổi/loại việc/tuần) rồi IN RA đúng "bảng
 * số liệu" mà AI Coach (Qwen) nhận (buildAnalystContext). Dùng để mắt-soi xem dữ liệu
 * nạp vào model có chuẩn không + thử lưới chống bịa số.
 *   chạy: node --import ./scripts/register-esm-loader.mjs scripts/coach-sample.mjs
 */
import { buildAnalystContext } from '../src/engine/coach/coachContext.js';

// 4 tuần, ~5 ngày/tuần, 2–3 phiên/ngày; buổi sáng đạt cao, khuya kém; nhiều loại việc.
const CATS = {
  hoc: { id: 'hoc', label: 'Học' },
  lamviec: { id: 'lamviec', label: 'Làm Việc' },
  doc: { id: 'doc', label: 'Đọc sách' },
  theduc: { id: 'theduc', label: 'Thể dục' },
};
const weeks = ['W4', 'W3', 'W2', 'W1']; // gần → xa (W4 = tuần hiện tại)
// Mỗi phần tử: [tuần, ngàyTrongTuần(0-6), giờ, phút, đạtMụcTiêu, loại, ghiChú?, huỷ?]
const PLAN = [
  // W1 (xa nhất) — ít, chủ yếu sáng
  ['W1', 1, 9, 40, true, 'hoc', 'ôn chương 1'], ['W1', 1, 14, 30, true, 'lamviec'],
  ['W1', 3, 9, 35, true, 'hoc'], ['W1', 5, 20, 25, false, 'doc'],
  ['W1', 6, 9, 45, true, 'hoc', 'đọc tài liệu thuế'],
  // W2 — tăng lên
  ['W2', 0, 9, 40, true, 'hoc'], ['W2', 1, 9, 50, true, 'hoc', 'viết mở chương 2'],
  ['W2', 1, 14, 30, true, 'lamviec'], ['W2', 2, 23, 30, false, 'lamviec', 'cố làm nốt báo cáo'],
  ['W2', 3, 9, 40, true, 'hoc'], ['W2', 4, 20, 35, true, 'doc'],
  ['W2', 5, 9, 30, true, 'theduc'], ['W2', 6, 23, 20, false, 'lamviec'],
  // W3 — nhiều hơn, có huỷ
  ['W3', 0, 9, 45, true, 'hoc', 'giải đề'], ['W3', 0, 11, 25, true, 'lamviec'],
  ['W3', 1, 9, 50, true, 'hoc'], ['W3', 1, 14, 40, false, 'lamviec', 'họp kéo dài'],
  ['W3', 2, 9, 40, true, 'hoc'], ['W3', 2, 23, 30, false, 'lamviec'],
  ['W3', 3, 9, 35, true, 'hoc'], ['W3', 3, 20, 30, true, 'doc', 'đọc lịch sử'],
  ['W3', 4, 9, 45, true, 'hoc'], ['W3', 5, 16, 30, true, 'theduc'],
  ['W3', 5, 23, 15, false, 'lamviec', null, true], ['W3', 6, 9, 40, true, 'hoc'],
  // W4 (tuần hiện tại) — nhiều nhất, phong độ cao buổi sáng
  ['W4', 0, 9, 50, true, 'hoc', 'viết chương 3'], ['W4', 0, 14, 40, true, 'lamviec', 'làm slide'],
  ['W4', 1, 9, 45, true, 'hoc'], ['W4', 1, 11, 30, true, 'lamviec'],
  ['W4', 1, 23, 30, false, 'lamviec', 'ráng deadline'], ['W4', 2, 9, 55, true, 'hoc', 'ôn thi'],
  ['W4', 2, 20, 35, true, 'doc'], ['W4', 3, 9, 50, true, 'hoc'],
  ['W4', 3, 14, 30, false, 'lamviec'], ['W4', 4, 9, 45, true, 'hoc'],
  ['W4', 4, 23, 25, false, 'lamviec'], ['W4', 5, 9, 40, true, 'theduc', 'chạy bộ'],
  ['W4', 5, 16, 35, true, 'lamviec'], ['W4', 6, 9, 50, true, 'hoc', 'tổng ôn'],
];

// Số-ngày liên tục để getEntryDayNumber + dk; map tuần → offset ngày (W1 xa nhất).
const weekBaseDay = { W1: 100, W2: 107, W3: 114, W4: 121 };
const weekBaseDate = { W1: '2026-06-01', W2: '2026-06-08', W3: '2026-06-15', W4: '2026-06-22' };
function dk(wk, wd) { const base = Number(weekBaseDate[wk].slice(8)); const d = base + wd; return `2026-06-${String(d).padStart(2, '0')}`; }

const history = PLAN.map(([wk, wd, hour, minutes, goal, cat, note, cancelled]) => ({
  hour, minutes, weekday: wd, wk, dk: dk(wk, wd), dn: weekBaseDay[wk] + wd,
  completed: !cancelled, cancelled: !!cancelled, status: cancelled ? 'cancelled' : 'done',
  goalAchieved: cancelled ? undefined : goal,
  categoryId: cat, categorySnapshot: { label: CATS[cat].label },
  nextNote: note || null,
}));

const totalMin = history.filter((e) => !e.cancelled).reduce((s, e) => s + e.minutes, 0);
const opts = {
  nowHour: 14,
  getEntryHour: (e) => e.hour,
  getEntryWeekday: (e) => e.weekday,
  getEntryWeekKey: (e) => e.wk,
  nowWeekKey: 'W4', prevWeekKey: 'W3',
  weekKeysDesc: weeks,
  getEntryDayKey: (e) => e.dk,
  todayKey: '2026-06-30', minDayKey: '2026-06-01',
  getEntryDayNumber: (e) => e.dn, nowDayNumber: 130,
  todayWeekday: 2, hasSessionToday: false,
  activeCategoryIds: new Set(Object.keys(CATS)),
  categoryLabelOf: (id) => CATS[id]?.label ?? null,
  dailyGoalMetric: 'sessions', dailyGoal: 4, sessionsToday: 1, minutesToday: 40,
  currentStreak: 5,
};

console.log(`# Lịch sử mẫu: ${history.length} phiên (${history.filter((e) => e.cancelled).length} huỷ), ~${Math.round(totalMin / 60)} giờ tập trung\n`);
console.log('=== BẢNG SỐ LIỆU AI NHẬN (buildAnalystContext) ===');
console.log(buildAnalystContext(history, opts));

export { history, opts };
