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
  getLateNightQualityDrop,
  getTodayPaceInsight,
  isCancelledHistoryEntry,
} from './gameMath';
import { buildFocusProfile, generatePredictions } from './coachIntel';

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

const pctOf = (x) => Math.round((Number(x) || 0) * 100);

/**
 * buildAnalystContext — bản tóm tắt số liệu GIÀU HƠN, dành riêng cho "Coach offline"
 * (LLM chạy trên máy) ở phong cách PHÂN TÍCH CHUYÊN SÂU. Tái dùng tầng phân tích sâu
 * (buildFocusProfile + generatePredictions) MÀ buildCoachContext (Claude) không nạp,
 * cộng nhịp-hôm-nay (getTodayPaceInsight) và các tín hiệu tương quan.
 *
 * NGUYÊN TẮC: mỗi dòng đã chứa SẴN cỡ mẫu cạnh mọi %; bỏ mọi tín hiệu 'insufficient'
 * (engine tự gác mẫu nhỏ qua Wilson/ngưỡng) → model 3B chỉ chép lại số, khỏi tự tính.
 * Thuần, nhận getter giờ/ngày/tuần qua opts để test được & đúng múi giờ VN.
 * KHÔNG đụng buildCoachContext (vẫn dùng cho api/coach.js).
 */
export function buildAnalystContext(history = [], opts = {}) {
  const {
    nowHour = 0,
    getEntryHour = (e) => new Date(e?.timestamp ?? 0).getHours(),
    dailyGoalMetric = 'sessions',
    dailyGoal = 0,
    sessionsToday = 0,
    minutesToday = 0,
    currentStreak = 0,
    getEntryDayKey = null,
    todayKey = null,
    maxNotes = 5,
  } = opts;

  const list = Array.isArray(history) ? history : [];
  const completed = list.filter((e) =>
    e && !isCancelledHistoryEntry(e) && e.completed !== false
    && Number.isFinite(e.minutes) && e.minutes > 0);

  if (completed.length === 0) {
    return 'Người dùng chưa có phiên nào hoàn thành. Chưa đủ dữ liệu để phân tích — hãy nói rõ là chưa đủ và mời bắt đầu phiên đầu tiên.';
  }

  const unit = dailyGoalMetric === 'minutes' ? 'phút' : 'phiên';
  const profile = buildFocusProfile(list, opts);
  const predictions = generatePredictions(list, opts);
  const lines = [];

  // [Tổng quan] — kèm tỉ lệ đạt mục tiêu TỔNG (chỉ khi đủ phiên có mục tiêu)
  const t = profile.totals;
  let overview = `Tổng quan: ${t.completed} phiên hoàn thành, ~${Math.round(t.minutes / 60)} giờ tập trung`;
  if (t.cancelled) overview += `, ${t.cancelled} phiên bị huỷ`;
  overview += '.';
  if (t.goalRate != null && t.withGoal > 0) overview += ` Đạt mục tiêu ${pctOf(t.goalRate)}% (trên ${t.withGoal} phiên có đặt mục tiêu).`;
  overview += ` Chuỗi hiện tại: ${currentStreak} ngày.`;
  lines.push(overview);

  // [Hôm nay] — số thô + sắc thái nhịp so với ngày thường (khi có baseline)
  if (dailyGoal > 0) {
    const cur = dailyGoalMetric === 'minutes' ? minutesToday : sessionsToday;
    const pace = getTodayPaceInsight(list, {
      metric: dailyGoalMetric, goal: dailyGoal, sessionsToday, minutesToday,
      nowHour, getEntryHour, getEntryDayKey, todayKey,
    });
    const typicalTail = pace && pace.typical != null
      ? `, tới giờ này bạn thường làm ~${pace.typical} ${unit} (trên ${pace.sampleDays} ngày gần đây)`
      : '';
    if (pace?.status === 'met') lines.push(`Hôm nay: đã đạt mục tiêu ngày — ${cur}/${dailyGoal} ${unit}.`);
    else if (pace?.status === 'near') lines.push(`Hôm nay: sắp đạt mục tiêu ngày — ${cur}/${dailyGoal} ${unit}, còn ${pace.remaining} ${unit}.`);
    else if (pace?.status === 'behind') lines.push(`Hôm nay: đang chậm hơn nhịp thường — ${cur}/${dailyGoal} ${unit}${typicalTail}.`);
    else if (pace?.status === 'ahead') lines.push(`Hôm nay: đang nhanh hơn nhịp thường — ${cur}/${dailyGoal} ${unit}${typicalTail}.`);
    else lines.push(`Hôm nay: ${cur}/${dailyGoal} ${unit}.`);
  }

  // [Hồ sơ tập trung sâu] — chỉ in tín hiệu đủ mẫu (engine tự gác)
  if (profile.chronotype.status !== 'insufficient') lines.push(`Giờ vàng: ${profile.chronotype.blurb}`);
  if (profile.idealLength.status !== 'insufficient') lines.push(`Độ dài hợp nhất: ${profile.idealLength.blurb}`);
  if (profile.consistency.status !== 'insufficient') lines.push(`Đều đặn: ${profile.consistency.blurb}`);
  if (profile.deepWorkRatio.status !== 'insufficient') lines.push(`Phiên sâu: ${profile.deepWorkRatio.blurb}`);
  if (profile.momentum.status !== 'insufficient') lines.push(`Xu hướng tuần: ${profile.momentum.blurb}`);

  // [Loại việc] — top theo giờ + tỉ lệ đạt từng loại (khi đủ mẫu)
  if (profile.categoryPerformance.status !== 'insufficient') {
    const txt = profile.categoryPerformance.value.top.map((c) => {
      let s = `${c.label} ${c.hours}h, ${c.sessions} phiên`;
      if (c.goalRate != null) s += `, đạt mục tiêu ${pctOf(c.goalRate)}% (trên ${c.sessions} phiên)`;
      return s;
    }).join(' | ');
    lines.push(`Loại việc: ${txt}.`);
  }

  // [Tương quan thời điểm] — mỗi dòng tự kèm cỡ mẫu
  const ab = getAbandonHotspot(list, { getEntryHour });
  if (ab) lines.push(`Hay bỏ giữa chừng vào ${ab.bucketLabel}: ${pctOf(ab.rate)}% (trên ${ab.attempts} lần bắt đầu).`);

  const late = getLateNightQualityDrop(list, { getEntryHour });
  if (late) lines.push(`Phiên sau ${late.lateStartHour}h: tỉ lệ đạt ${pctOf(late.lateGoalRate)}% so với ban ngày ${pctOf(late.dayGoalRate)}% (khuya trên ${late.lateAttempts} phiên có mục tiêu). Đây là tương quan, không phải kết luận.`);

  if (typeof getEntryDayKey === 'function' && todayKey && dailyGoal > 0) {
    const cal = getDailyGoalCalibration(list, { goalType: dailyGoalMetric, goalValue: dailyGoal, getEntryDayKey, todayKey, minDayKey: opts.minDayKey });
    if (cal) lines.push(`Mục tiêu ngày ${cal.verdict === 'too-hard' ? 'hơi quá sức' : 'hơi nhẹ'}: đạt ${pctOf(cal.hitRate)}% trên ${cal.daysCounted} ngày, trung vị ${Math.round(cal.median)} ${unit}/ngày (thử chỉnh về ${cal.suggested} ${unit}/ngày).`);
  }

  if (typeof opts.getEntryWeekday === 'function') {
    const wd = getWeekdayHighlight(list, { getEntryWeekday: opts.getEntryWeekday });
    if (wd) lines.push(`Ngày năng suất nhất: ${wd.label} — ${wd.count} phiên (~${pctOf(wd.share)}%).`);
  }

  if (typeof opts.getEntryDayNumber === 'function' && Number.isFinite(opts.nowDayNumber)) {
    const neg = getNeglectedCategory(list, { nowDayNumber: opts.nowDayNumber, getEntryDayNumber: opts.getEntryDayNumber, activeCategoryIds: opts.activeCategoryIds });
    if (neg) lines.push(`Loại bị bỏ bê: "${neg.label}" — ${neg.daysSince} ngày chưa làm (từng chiếm ~${pctOf(neg.share)}% thời gian, ${neg.sessions} phiên).`);
  }

  // [Dự đoán có thời điểm]
  if (predictions.window.status === 'found') lines.push(`Khung giờ vàng còn lại hôm nay: ${predictions.window.reason}`);
  if (predictions.streak.status === 'predicted' || predictions.streak.status === 'secured') lines.push(`Giữ chuỗi: ${predictions.streak.reason}`);

  // [Ghi chú gần đây] — đặt CUỐI: nếu bị cắt thì mất phần ít quan trọng nhất.
  // Bỏ trùng (cùng nội dung lặp lại không thêm thông tin để phân tích).
  const notes = [];
  const seenNotes = new Set();
  for (const e of [...completed].reverse()) {
    const next = stripHtml(e.nextNote);
    const note = stripHtml(e.note);
    const body = next ? `(định làm tiếp) ${next}` : (note || '');
    if (!body) continue;
    const key = body.toLowerCase();
    if (seenNotes.has(key)) continue;
    seenNotes.add(key);
    notes.push(body);
    if (notes.length >= maxNotes) break;
  }
  if (notes.length) lines.push(`Ghi chú gần đây: ${notes.map((n) => `“${n.slice(0, 140)}”`).join(' | ')}`);

  return lines.join('\n');
}
