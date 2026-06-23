/**
 * coachContext.js — gói SỐ LIỆU THẬT của người dùng thành "bản tóm tắt số liệu GIÀU"
 * (buildAnalystContext) để gửi cho AI Qwen trên máy đọc & phân tích. Thuần, nhận getter
 * giờ/ngày/tuần qua opts để test được & đúng múi giờ VN. Tái dùng tín hiệu trong gameMath
 * + tầng phân tích sâu trong coachIntel. Qwen chỉ DIỄN ĐẠT số đã-tính-sẵn, khỏi tự tính.
 */
import {
  getWeekdayHighlight,
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

const pctOf = (x) => Math.round((Number(x) || 0) * 100);

/**
 * buildAnalystContext — bản tóm tắt số liệu GIÀU cho AI Qwen trên máy (Coach offline +
 * Hỏi Coach) ở phong cách PHÂN TÍCH CHUYÊN SÂU. Tái dùng tầng phân tích sâu
 * (buildFocusProfile + generatePredictions) + nhịp-hôm-nay (getTodayPaceInsight) + các
 * tín hiệu tương quan.
 *
 * NGUYÊN TẮC: mỗi dòng đã chứa SẴN cỡ mẫu cạnh mọi %; bỏ mọi tín hiệu 'insufficient'
 * (engine tự gác mẫu nhỏ qua Wilson/ngưỡng) → model 3B chỉ chép lại số, khỏi tự tính.
 * Thuần, nhận getter giờ/ngày/tuần qua opts để test được & đúng múi giờ VN.
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
