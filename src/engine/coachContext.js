/**
 * coachContext.js — gói SỐ LIỆU THẬT của người dùng thành một bản tóm tắt chữ gọn
 * để gửi cho AI Coach (api/coach.js). Thuần, nhận getter giờ/ngày/tuần qua opts để
 * test được & đúng múi giờ VN. Tái dùng các tín hiệu sẵn có trong gameMath.
 */
import {
  suggestSessionLength,
  getGoldenHourBucket,
  getWeekdayHighlight,
  getWeeklyTrend,
  getAbandonHotspot,
  getDailyGoalCalibration,
  getNeglectedCategory,
  isCancelledHistoryEntry,
} from './gameMath';

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildCoachContext(history = [], opts = {}) {
  const {
    nowHour = 0,
    getEntryHour = (e) => new Date(e?.timestamp ?? 0).getHours(),
    getEntryWeekday = null,
    getEntryWeekKey = null,
    nowWeekKey = null,
    prevWeekKey = null,
    getEntryDayKey = null,
    todayKey = null,
    minDayKey = null,
    getEntryDayNumber = null,
    nowDayNumber = null,
    dailyGoalMetric = 'sessions',
    dailyGoal = 0,
    sessionsToday = 0,
    minutesToday = 0,
    currentStreak = 0,
    activeCategoryIds = null,
    categoryLabelOf = () => null,
    maxNotes = 5,
  } = opts;

  const list = Array.isArray(history) ? history : [];
  const completed = list.filter((e) =>
    e && !isCancelledHistoryEntry(e) && e.completed !== false
    && Number.isFinite(e.minutes) && e.minutes > 0);

  if (completed.length === 0) {
    return 'Người dùng chưa có phiên nào hoàn thành. Hãy động viên bắt đầu phiên đầu tiên và đặt một mục tiêu rõ ràng.';
  }

  const unit = dailyGoalMetric === 'minutes' ? 'phút' : 'phiên';
  const lines = [];

  // Tổng quan
  const totalMin = completed.reduce((s, e) => s + e.minutes, 0);
  const cancelled = list.filter((e) => isCancelledHistoryEntry(e)).length;
  lines.push(`Tổng quan: ${completed.length} phiên hoàn thành, ~${Math.round(totalMin / 60)} giờ tập trung; ${cancelled} phiên bị huỷ. Chuỗi hiện tại: ${currentStreak} ngày.`);

  // Hôm nay
  if (dailyGoal > 0) {
    const cur = dailyGoalMetric === 'minutes' ? minutesToday : sessionsToday;
    lines.push(`Hôm nay: ${cur}/${dailyGoal} ${unit} (mục tiêu ngày).`);
  }

  // Giờ vàng + độ dài hợp
  const golden = getGoldenHourBucket(list, { getEntryHour });
  if (golden) lines.push(`Giờ vàng (đạt mục tiêu cao nhất): ${golden.bucketLabel} ${Math.round(golden.rate * 100)}% (trên ${golden.sampleSize} phiên có mục tiêu).`);
  const sug = suggestSessionLength(list, { nowHour, getEntryHour });
  if (sug) lines.push(`Độ dài phiên hợp với ${sug.bucketLabel} (giờ hiện tại): ~${sug.minutes} phút.`);

  // Ngày năng suất
  if (typeof getEntryWeekday === 'function') {
    const wd = getWeekdayHighlight(list, { getEntryWeekday });
    if (wd) lines.push(`Ngày năng suất nhất trong tuần: ${wd.label} (${wd.count} phiên, ~${Math.round(wd.share * 100)}%).`);
  }

  // Xu hướng tuần
  if (typeof getEntryWeekKey === 'function' && nowWeekKey && prevWeekKey) {
    const tr = getWeeklyTrend(list, { getEntryWeekKey, nowWeekKey, prevWeekKey });
    if (tr) lines.push(`Xu hướng tuần: ${tr.thisMinutes} phút tuần này so với ${tr.prevMinutes} phút tuần trước (${tr.pct >= 0 ? '+' : ''}${tr.pct}%).`);
  }

  // Hay bỏ giữa chừng
  const ab = getAbandonHotspot(list, { getEntryHour });
  if (ab) lines.push(`Hay bỏ phiên giữa chừng vào ${ab.bucketLabel}: ${Math.round(ab.rate * 100)}% (trên ${ab.attempts} lần bắt đầu).`);

  // Hiệu chỉnh mục tiêu ngày
  if (typeof getEntryDayKey === 'function' && todayKey && dailyGoal > 0) {
    const cal = getDailyGoalCalibration(list, { goalType: dailyGoalMetric, goalValue: dailyGoal, getEntryDayKey, todayKey, minDayKey });
    if (cal) lines.push(`Mục tiêu ngày đang ${cal.verdict === 'too-hard' ? 'hơi quá sức' : 'hơi dễ'}: đạt ${Math.round(cal.hitRate * 100)}% số ngày, trung vị ${Math.round(cal.median)} ${unit}/ngày (gợi ý chỉnh về ${cal.suggested}).`);
  }

  // Loại việc: top theo thời gian + loại bị bỏ bê
  const byCat = new Map();
  for (const e of completed) {
    const id = e.categoryId ?? null;
    if (!id) continue;
    if (activeCategoryIds && !activeCategoryIds.has(id)) continue;
    const cur = byCat.get(id) ?? { id, minutes: 0, sessions: 0 };
    cur.minutes += e.minutes;
    cur.sessions += 1;
    byCat.set(id, cur);
  }
  const topCats = [...byCat.values()].sort((a, b) => b.minutes - a.minutes).slice(0, 4);
  if (topCats.length) {
    const txt = topCats.map((c) => `${categoryLabelOf(c.id) || 'loại khác'} ${Math.round((c.minutes / 60) * 10) / 10}h`).join(', ');
    lines.push(`Loại việc nhiều thời gian nhất: ${txt}.`);
  }
  if (typeof getEntryDayNumber === 'function' && Number.isFinite(nowDayNumber)) {
    const neg = getNeglectedCategory(list, { nowDayNumber, getEntryDayNumber, activeCategoryIds });
    if (neg) lines.push(`Loại bị bỏ bê: "${neg.label}" — ${neg.daysSince} ngày chưa làm (từng chiếm ~${Math.round(neg.share * 100)}% thời gian).`);
  }

  // Ghi chú gần đây (giúp Coach hiểu NỘI DUNG việc)
  const notes = [];
  for (const e of [...completed].reverse()) {
    const next = stripHtml(e.nextNote);
    const note = stripHtml(e.note);
    if (next) notes.push(`(định làm tiếp) ${next}`);
    else if (note) notes.push(note);
    if (notes.length >= maxNotes) break;
  }
  if (notes.length) lines.push(`Ghi chú gần đây: ${notes.map((n) => `“${n.slice(0, 140)}”`).join(' | ')}`);

  return lines.join('\n');
}
