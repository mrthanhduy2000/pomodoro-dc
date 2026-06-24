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
  getMultiWeekTrend,
  getWeekendVsWeekdayContrast,
  getComebackRate,
  getInterruptionPattern,
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

export const COACH_MAX_CONTEXT_LINES = 18; // bảng quá dài → Qwen 3B dễ loạn; cắt theo ƯU TIÊN

// Ưu tiên giữ dòng (số NHỎ = giữ trước): bắt buộc → tín hiệu mạnh/đúng-lúc → phân tích lõi →
// phụ → ghi chú (cắt đầu tiên). Cắt theo ưu tiên chứ KHÔNG slice mù cuối mảng.
function linePriority(line) {
  const l = String(line);
  const s = (p) => l.startsWith(p);
  if (s('Tổng quan') || s('Chân dung của bạn') || s('Hôm nay')) return 0;
  if (s('Hay bỏ giữa chừng') || s('Tỉ lệ đạt mục tiêu của phiên làm sau') || s('Mục tiêu ngày')
    || s('Loại bị bỏ bê') || s('Giữ chuỗi') || s('Khung giờ vàng còn lại')) return 1;
  if (s('Giờ vàng') || s('Độ dài hợp nhất') || s('Xu hướng dài hạn') || s('Loại việc')) return 2;
  if (s('Ghi chú gần đây')) return 4;
  return 3; // Xu hướng tuần · Phiên sâu · Đều đặn · Ngày năng suất · Cuối tuần · Phục hồi…
}
export function capContextLines(lines, cap = COACH_MAX_CONTEXT_LINES) {
  if (lines.length <= cap) return lines;
  const keep = new Set(
    lines.map((text, i) => ({ i, p: linePriority(text) }))
      .sort((a, b) => (a.p - b.p) || (a.i - b.i))
      .slice(0, cap).map((t) => t.i),
  );
  return lines.filter((_, i) => keep.has(i)); // giữ THỨ TỰ gốc của các dòng sống sót
}

/**
 * buildAnalystContext — bản tóm tắt số liệu GIÀU cho AI Qwen trên máy (AI phân tích tổng thể +
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
  // Dưới 60 phút → in theo PHÚT (tránh "~0 giờ" + 3B đọc số nguyên dễ hơn thập phân).
  const focusBlurb = t.minutes < 60 ? `~${t.minutes} phút tập trung` : `~${Math.round(t.minutes / 60)} giờ tập trung`;
  let overview = `Tổng quan: ${t.completed} phiên hoàn thành, ${focusBlurb}`;
  if (t.cancelled) overview += `, ${t.cancelled} phiên bị huỷ`;
  overview += '.';
  if (t.goalRate != null && t.withGoal > 0) overview += ` Đạt mục tiêu ${pctOf(t.goalRate)}% (trên ${t.withGoal} phiên có đặt mục tiêu).`;
  overview += ` Chuỗi hiện tại: ${currentStreak} ngày.`;
  lines.push(overview);

  // [Chân dung của bạn] — tổng hợp đặc điểm ỔN ĐỊNH từ profile (đã tính sẵn) để Qwen
  // HIỂU CHỦ. Mỗi mảnh tự gác qua status; mỗi % kèm cỡ mẫu ngay trong mảnh.
  const portrait = [];
  if (profile.chronotype.status !== 'insufficient') {
    const c = profile.chronotype.value;
    portrait.push(`nghiêng về ${c.bucketLabel} (đạt ${pctOf(c.rate)}% trên ${profile.chronotype.sampleSize} phiên có mục tiêu)`);
  }
  if (profile.idealLength.status !== 'insufficient') portrait.push(`hợp phiên ${profile.idealLength.value.label}`);
  if (profile.consistency.status !== 'insufficient') {
    const v = profile.consistency.value;
    portrait.push(`giữ nhịp ~${pctOf(v.coverage)}% số ngày gần đây (${v.activeDays}/${v.windowDays} ngày)`);
  }
  if (profile.categoryPerformance.status !== 'insufficient') {
    const top = profile.categoryPerformance.value.top[0];
    portrait.push(`loại làm nhiều nhất là "${top.label}" với ${top.hours} giờ qua ${top.sessions} phiên`);
  }
  if (profile.deepWorkRatio.status !== 'insufficient') {
    const d = profile.deepWorkRatio.value;
    portrait.push(`phiên sâu ~${pctOf(d.ratio)}% (${d.deepCount}/${d.total})`);
  }
  if (portrait.length) lines.push(`Chân dung của bạn: ${portrait.join(', ')}. Đây là đặc điểm ổn định từ lịch sử của bạn, không phải lời tiên đoán.`);

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

  // [Phiên trơn vs ngắt quãng] — chiều CHẤT LƯỢNG mới: đọc pauseSegments đã lưu sẵn mỗi phiên
  // (trước nay Coach không hề thấy). Chỉ tính phiên CÓ dữ liệu (phiên cũ thiếu trường → bỏ).
  const interruption = getInterruptionPattern(list);
  if (interruption) lines.push(`Phiên liền mạch (chạy hết không tạm dừng): ${interruption.smooth}/${interruption.total} phiên (${pctOf(interruption.smoothRate)}%). Còn lại ${interruption.interrupted}/${interruption.total} phiên có tạm dừng giữa chừng. Đây là tương quan, không phải kết luận.`);

  // [Xu hướng dài hạn] — nhiều tuần (đang lên/xuống/giữ); chỉ khi ≥2 tuần có dữ liệu.
  const mwt = getMultiWeekTrend(list, { getEntryWeekKey: opts.getEntryWeekKey, weekKeysDesc: opts.weekKeysDesc, minWeeks: 3 });
  if (mwt) {
    const dir = mwt.direction === 'up' ? 'đang đi lên' : mwt.direction === 'down' ? 'đang đi xuống' : 'đang giữ nhịp';
    const series = mwt.weeklyMinutes.map((m) => `${m} phút`).join(' → '); // mỗi tuần CÓ dữ liệu, cũ → mới
    lines.push(`Xu hướng dài hạn (${mwt.weeksWithData} tuần có dữ liệu trong ${mwt.weeksLookback} tuần gần đây): ${dir}, mỗi tuần (từ cũ đến mới): ${series}. Đây là tương quan theo thời gian, không phải kết luận.`);
  }

  // [Loại việc] — tách loại DẪN ĐẦU thành câu có chủ ngữ rõ + mỗi loại còn lại MỘT dòng
  // riêng có TÊN LOẠI trong ngoặc kép (bỏ dấu '|') để Qwen 3B khỏi đọc nhãn "Loại việc"
  // thành tên loại, và khỏi vơ số của loại này gán loại kia.
  if (profile.categoryPerformance.status !== 'insufficient') {
    const cats = profile.categoryPerformance.value.top;
    const fmtCat = (c) => {
      let s = `${c.hours} giờ qua ${c.sessions} phiên`;
      if (c.goalRate != null) s += `, đạt mục tiêu ${pctOf(c.goalRate)}% (trên ${c.sessions} phiên)`;
      return s;
    };
    lines.push(`Loại việc dành nhiều thời gian nhất là "${cats[0].label}": ${fmtCat(cats[0])}.`);
    for (const c of cats.slice(1)) lines.push(`Loại việc "${c.label}": ${fmtCat(c)}.`);
  }

  // [Tương quan thời điểm] — mỗi dòng tự kèm cỡ mẫu
  const ab = getAbandonHotspot(list, { getEntryHour });
  if (ab) lines.push(`Hay bỏ giữa chừng vào ${ab.bucketLabel}: ${pctOf(ab.rate)}% (trên ${ab.attempts} lần bắt đầu).`);

  const late = getLateNightQualityDrop(list, { getEntryHour });
  if (late) lines.push(`Tỉ lệ đạt mục tiêu của phiên làm sau ${late.lateStartHour} giờ đêm: ${pctOf(late.lateGoalRate)}% (khuya trên ${late.lateGoalTotal} phiên có mục tiêu), so với ban ngày ${pctOf(late.dayGoalRate)}%. Đây là tương quan, không phải kết luận.`);

  if (typeof getEntryDayKey === 'function' && todayKey && dailyGoal > 0) {
    const cal = getDailyGoalCalibration(list, { goalType: dailyGoalMetric, goalValue: dailyGoal, getEntryDayKey, todayKey, minDayKey: opts.minDayKey });
    if (cal) lines.push(`Mục tiêu ngày ${cal.verdict === 'too-hard' ? 'hơi quá sức' : 'hơi nhẹ'}: đạt ${pctOf(cal.hitRate)}% trên ${cal.daysCounted} ngày, trung vị ${cal.medianDisplay} ${unit}/ngày (thử chỉnh về ${cal.suggested} ${unit}/ngày).`);
  }

  if (typeof opts.getEntryWeekday === 'function') {
    const wd = getWeekdayHighlight(list, { getEntryWeekday: opts.getEntryWeekday });
    if (wd) lines.push(`Ngày năng suất nhất: ${wd.label} — ${wd.count} phiên (~${pctOf(wd.share)}%).`);
  }

  // [Cuối tuần vs trong tuần] — chỉ hiện khi chênh đáng kể (gác chặt, tránh nhồi bảng)
  if (typeof opts.getEntryWeekday === 'function') {
    const wewd = getWeekendVsWeekdayContrast(list, { getEntryWeekday: opts.getEntryWeekday });
    if (wewd && wewd.basis === 'goal') {
      lines.push(`Cuối tuần so với trong tuần: tỉ lệ đạt mục tiêu cuối tuần (Thứ Bảy và Chủ nhật) ${pctOf(wewd.weekendGoalRate)}% trên ${wewd.weekendN} phiên, trong tuần ${pctOf(wewd.weekdayGoalRate)}% trên ${wewd.weekdayN} phiên. Đây là tương quan, không phải kết luận.`);
    } else if (wewd) {
      lines.push(`Cuối tuần so với trong tuần: trung bình mỗi phiên cuối tuần (Thứ Bảy và Chủ nhật) ${wewd.weekendAvgMin} phút qua ${wewd.weekendN} phiên, trong tuần ${wewd.weekdayAvgMin} phút qua ${wewd.weekdayN} phiên. Đây là tương quan, không phải kết luận.`);
    }
  }

  if (typeof opts.getEntryDayNumber === 'function' && Number.isFinite(opts.nowDayNumber)) {
    const neg = getNeglectedCategory(list, { nowDayNumber: opts.nowDayNumber, getEntryDayNumber: opts.getEntryDayNumber, activeCategoryIds: opts.activeCategoryIds });
    if (neg) lines.push(`Loại bị bỏ bê: "${neg.label}" — ${neg.daysSince} ngày chưa làm (từng chiếm ~${pctOf(neg.share)}% thời gian, ${neg.sessions} phiên).`);
  }

  // [Phục hồi sau ngày nghỉ] — tỉ lệ quay lại ngay sau 1 ngày trống (gác ≥4 lần)
  if (typeof opts.getEntryDayNumber === 'function' && Number.isFinite(opts.nowDayNumber)) {
    const cb = getComebackRate(list, { nowDayNumber: opts.nowDayNumber, getEntryDayNumber: opts.getEntryDayNumber });
    if (cb) lines.push(`Phục hồi sau ngày nghỉ: ${cb.comebacks}/${cb.gaps} lần (${pctOf(cb.rate)}%, qua ${cb.gaps} lần nghỉ 1 ngày trong ${cb.windowDays} ngày gần đây). Đây là tương quan, không phải kết luận.`);
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

  return capContextLines(lines).join('\n');
}
