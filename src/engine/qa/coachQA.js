/**
 * coachQA.js — "Hỏi Coach" trả lời OFFLINE, KHÔNG cần LLM. Route câu hỏi → handler
 * lấy đáp từ các engine có sẵn (coachIntel/gameMath/semantic) → câu tiếng Việt.
 * THUẦN & tất định. Trung thực: kèm cỡ mẫu, "có vẻ"; thiếu dữ liệu → "chưa đủ"; và
 * CẤM từ nhân-quả (vì/nên/do/bởi/khiến/dẫn đến) — có assertNoCausal + test canh.
 */
import { buildCoachIntel, recommendNextSession } from '../coachIntel';
import {
  suggestSessionLength, getGoldenHourBucket, getTodayPaceInsight, getAbandonHotspot,
  getLateNightQualityDrop, getDailyGoalCalibration, calculateStreakMilestoneProgress,
  isCancelledHistoryEntry,
} from '../gameMath';
import { analyzeNoteThemes } from '../semantic/semantic';
import { routeIntent, buildIntentIndex, normalizeVi, stripDiacritics } from './intentRouter';

const CAUSAL = /(^|\s)(vì|nên|do|bởi|khiến|dẫn đến)(\s|$)/i;
export function assertNoCausal(s) {
  if (CAUSAL.test(` ${String(s ?? '').toLowerCase()} `)) throw new Error(`Câu chứa từ nhân-quả: ${s}`);
  return s;
}

const pct = (x) => Math.round(x * 100);
const hours = (m) => Math.round((m / 60) * 10) / 10;
const unitOf = (metric) => (metric === 'minutes' ? 'phút' : 'phiên');
const CAVEAT = 'Đây là quan sát từ lịch sử của bạn, không phải lời chắc chắn.';

export const STARTER_SUGGESTIONS = [
  'Tuần này mình thế nào?',
  'Giờ vàng của mình là khi nào?',
  'Chiều nay nên làm phiên bao lâu?',
  'Mình có hay bỏ phiên buổi tối không?',
  'Giờ này nên làm gì?',
];

const OUT_OF_DOMAIN = ['thời tiết', 'dịch ', 'dịch câu', 'tỉ giá', 'tin tức', 'nấu ăn', 'bóng đá', 'crypto', 'chứng khoán', 'tải file', 'cài đặt app', 'lỗi app'];
export function isOutOfDomain(text) {
  const t = normalizeVi(text);
  return OUT_OF_DOMAIN.some((k) => t.includes(k) || t.includes(stripDiacritics(k)));
}

const SMALLTALK = [
  { re: /(^|\s)(chào|hi|hello|alo|xin chào)(\s|$)/i, reply: 'Chào bạn 👋 Mình là Coach offline — hỏi mình về tập trung của bạn nhé, ví dụ "tuần này mình thế nào?" hay "giờ vàng của mình?".' },
  { re: /(cảm ơn|cám ơn|thank|thanks|cảm ạ)/i, reply: 'Không có gì! Cần xem thêm gì cứ hỏi mình nhé.' },
  { re: /(tạm biệt|bye|bai|hẹn gặp)/i, reply: 'Hẹn gặp lại — giữ nhịp tập trung nha!' },
];
export function classifySmalltalk(text) {
  return SMALLTALK.find((s) => s.re.test(text))?.reply ?? null;
}

// ── Handlers: nhận bundle, trả {status, text} (text không từ nhân-quả) ──────────

function hToday(b) {
  const o = b.opts;
  const cur = o.dailyGoalMetric === 'minutes' ? o.minutesToday : o.sessionsToday;
  const u = unitOf(o.dailyGoalMetric);
  if (!(o.dailyGoal > 0)) return { status: 'insufficient', text: `Hôm nay bạn đã làm ${cur} ${u}. Mình chưa có mục tiêu ngày để nói "còn bao nhiêu là đạt" — đặt mục tiêu ngày là mình theo dõi giúp.` };
  const p = getTodayPaceInsight(b.history, o);
  const remaining = Math.max(0, o.dailyGoal - cur);
  if (p?.status === 'met' || remaining <= 0) return { status: 'ok', text: `Hôm nay đạt mục tiêu ngày rồi: ${cur}/${o.dailyGoal} ${u}. Nghỉ ngơi xứng đáng, hoặc thêm một phiên nhẹ nếu còn hứng.` };
  if (p?.status === 'near') return { status: 'ok', text: `Sắp đạt rồi — mới ${cur}/${o.dailyGoal} ${u}, chỉ còn ${remaining} ${u} nữa. Một phiên ngắn ngay bây giờ là xong mục tiêu ngày.` };
  if (p?.status === 'behind' && p.typical != null) return { status: 'ok', text: `Hôm nay mới ${cur}/${o.dailyGoal} ${u}. Tới giờ này bạn thường đã ~${p.typical} ${u} — có vẻ đang chậm hơn nhịp thường ngày một chút (so trên ${p.sampleDays} ngày gần đây). Vào một phiên để bắt kịp nhé.` };
  return { status: 'ok', text: `Hôm nay ${cur}/${o.dailyGoal} ${u}, còn ${remaining} ${u} là đạt mục tiêu ngày. Đang ổn — thêm một phiên là tới.` };
}

function hWeek(b) {
  const m = b.intel.profile.momentum;
  if (m.status === 'insufficient') return { status: 'insufficient', text: 'Chưa đủ dữ liệu hai tuần liên tiếp để so. Cần vài phiên ở cả tuần này lẫn tuần trước thì mình mới so giúp được.' };
  const v = m.value;
  const dir = v.direction === 'up' ? 'nhiều hơn' : v.direction === 'down' ? 'ít hơn' : 'khá sát';
  const tail = v.direction === 'flat' ? `(chênh ${Math.abs(v.pct)}%, coi như giữ nhịp)` : `${Math.abs(v.pct)}% — ${v.thisMinutes}′ so với ${v.prevMinutes}′`;
  return { status: 'ok', confidence: m.status, text: `Tuần này bạn tập trung ${dir} tuần trước ${tail}. Có vẻ ${v.direction === 'up' ? 'đang lên đà' : v.direction === 'down' ? 'hơi chậm lại' : 'đều'} (trên ${m.sampleSize} phiên). ${CAVEAT}` };
}

function hBestTime(b) {
  const g = getGoldenHourBucket(b.history, b.opts);
  if (g) return { status: 'ok', text: `Nhìn lịch sử thì ${g.bucketLabel} có vẻ là khung mạnh nhất của bạn — đạt mục tiêu khoảng ${pct(g.rate)}% (trên ${g.sampleSize} phiên có đặt mục tiêu). Việc khó hợp để dồn vào lúc đó. ${CAVEAT}` };
  return { status: 'insufficient', text: 'Mình chưa đủ dữ liệu để chỉ ra một khung giờ trội rõ — cần thêm vài phiên có đặt mục tiêu ở nhiều buổi khác nhau thì mới so được.' };
}

function hLength(b) {
  const s = suggestSessionLength(b.history, b.opts);
  if (s) {
    const basis = s.basis === 'goal' ? `các phiên bạn đạt mục tiêu thường dài quanh ${s.minutes} phút` : `bạn hay làm trọn phiên cỡ ${s.minutes} phút`;
    return { status: 'ok', text: `Lúc ${s.bucketLabel}, ${basis} (trên ${s.sampleSize} phiên). Thử đặt timer ~${s.minutes}′ xem sao nhé.` };
  }
  const il = b.intel.profile.idealLength;
  if (il.status !== 'insufficient') return { status: 'ok', text: `Chưa đủ phiên ở buổi này để chốt con số, nhưng nhìn chung phiên ${il.value.label} có vẻ hợp bạn nhất — tỉ lệ đạt ~${pct(il.value.rate)}% (trên ${il.sampleSize} phiên).` };
  return { status: 'insufficient', text: 'Mình chưa đủ dữ liệu để gợi ý độ dài phiên. Tạm thời cứ thử 25′ rồi tăng dần, làm thêm ít phiên là Coach phân tích được.' };
}

function hStreak(b) {
  const cur = b.store.streak?.currentStreak ?? 0;
  const longest = b.store.streak?.longestStreak ?? 0;
  if (cur <= 0) return { status: 'ok', text: 'Hiện bạn chưa có chuỗi đang chạy. Hoàn thành một phiên hôm nay là bắt đầu chuỗi mới ngay.' };
  const ms = calculateStreakMilestoneProgress(cur);
  const milestone = ms.nextMilestone && ms.daysRemaining > 0 ? ` Còn ${ms.daysRemaining} ngày nữa tới mốc "${ms.nextMilestone.label}".` : '';
  const today = b.opts.hasSessionToday ? ' Hôm nay bạn đã có phiên nên chuỗi đang an toàn.' : ' Làm một phiên gọn hôm nay là giữ được.';
  return { status: 'ok', text: `Chuỗi của bạn đang là ${cur} ngày.${milestone}${today} Kỷ lục dài nhất của bạn là ${longest} ngày.` };
}

function hGoalCal(b) {
  const o = b.opts;
  const cal = getDailyGoalCalibration(b.history, { goalType: o.dailyGoalMetric, goalValue: o.dailyGoal, getEntryDayKey: o.getEntryDayKey, todayKey: o.todayKey, minDayKey: o.minDayKey });
  const u = unitOf(o.dailyGoalMetric);
  if (cal) {
    if (cal.verdict === 'too-hard') return { status: 'ok', text: `Mục tiêu ngày đang hơi quá sức (đạt ${pct(cal.hitRate)}% số ngày, trung vị ${Math.round(cal.median)} ${u}/ngày trên ${cal.daysCounted} ngày). Thử hạ về ${cal.suggested} ${u}/ngày cho dễ "đạt" và giữ động lực.` };
    return { status: 'ok', text: `Mục tiêu ngày đang khá nhẹ (đạt ${pct(cal.hitRate)}% số ngày). Có thể nâng lên ${cal.suggested} ${u}/ngày để bám phong độ thật (trên ${cal.daysCounted} ngày).` };
  }
  // null = "vừa tầm" hoặc "thiếu ngày" → gọi lại minDays:1 để phân biệt
  const probe = getDailyGoalCalibration(b.history, { goalType: o.dailyGoalMetric, goalValue: o.dailyGoal, getEntryDayKey: o.getEntryDayKey, todayKey: o.todayKey, minDayKey: o.minDayKey, minDays: 1 });
  if (probe || (o.dailyGoal > 0)) return { status: 'ok', text: `Mục tiêu ngày của bạn có vẻ vừa tầm — cứ giữ nguyên ${o.dailyGoal} ${u}/ngày. Khi nào đạt gần như mọi ngày hoặc hụt liên tục thì mình sẽ gợi ý chỉnh.` };
  return { status: 'insufficient', text: 'Chưa đủ ngày gần đây để đánh giá mục tiêu. Làm thêm ít ngày nữa mình sẽ nói được mục tiêu có vừa tầm không.' };
}

function hCategory(b) {
  const c = b.intel.profile.categoryPerformance;
  if (c.status === 'insufficient') return { status: 'insufficient', text: 'Mình chưa đủ dữ liệu để xếp loại việc — cần thêm vài phiên có gắn nhãn loại (và có đặt mục tiêu) thì mới so được.' };
  const top = c.value.top;
  const lead = top[0];
  const second = top[1] ? ` (kế đó: "${top[1].label}" ${top[1].hours}h)` : '';
  const rate = lead.goalRate != null ? `, đạt mục tiêu ${pct(lead.goalRate)}%` : '';
  let text = `Loại bạn dồn nhiều thời gian nhất là "${lead.label}" — ${lead.hours}h qua ${lead.sessions} phiên${rate}${second}.`;
  const neg = b.intel.report.patterns?.find((p) => p.id === 'category-neglect');
  if (neg) text += ` "${neg.evidence.label}" thì đã ${neg.evidence.daysSince} ngày chưa có phiên — cấy một phiên ngắn để kéo lại nhịp.`;
  return { status: 'ok', text };
}

function hAbandon(b) {
  const ab = getAbandonHotspot(b.history, b.opts);
  if (ab) return { status: 'ok', text: `Vào ${ab.bucketLabel} bạn hay dừng phiên giữa chừng nhất — khoảng ${pct(ab.rate)}% (trên ${ab.attempts} lần bắt đầu). Khung này thử đặt phiên ngắn hơn xem có trọn hơn không. ${CAVEAT}` };
  const cancelled = (b.history || []).filter(isCancelledHistoryEntry).length;
  if (cancelled === 0) return { status: 'ok', text: 'Tin tốt: gần đây mình không thấy buổi nào bạn hay bỏ phiên giữa chừng cả. Cứ giữ nhịp này nhé.' };
  return { status: 'insufficient', text: 'Chưa đủ dữ liệu để chỉ ra buổi hay bỏ phiên rõ rệt. Làm thêm ít phiên là mình rõ hơn.' };
}

function hLateNight(b) {
  const o = b.opts;
  const late = getLateNightQualityDrop(b.history, o);
  if (late) return { status: 'ok', text: `Có vẻ các phiên sau ${late.lateStartHour}h của bạn đạt mục tiêu thấp hơn ban ngày rõ — ${pct(late.lateGoalRate)}% so với ${pct(late.dayGoalRate)}% (trên ${late.lateAttempts} phiên khuya). Khung muộn có lẽ hợp để dành việc nhẹ hơn. ${CAVEAT}` };
  // null: phân biệt "khuya tốt" vs "ít dữ liệu khuya" bằng đếm raw
  let lateN = 0; let lateGoalN = 0; let lateGoalHit = 0;
  for (const e of (b.history || [])) {
    if (!e || isCancelledHistoryEntry(e) || e.completed === false || !(e.minutes > 0)) continue;
    const h = o.getEntryHour(e);
    if (h >= 22 || h < 5) { lateN += 1; if (typeof e.goalAchieved === 'boolean') { lateGoalN += 1; if (e.goalAchieved) lateGoalHit += 1; } }
  }
  if (lateN >= 4 && lateGoalN >= 3 && lateGoalHit / lateGoalN >= 0.6) return { status: 'ok', text: `Bạn làm khuya khá ổn đấy — ${lateN} phiên sau 22h và tỉ lệ đạt mục tiêu vẫn cao (${pct(lateGoalHit / lateGoalN)}% trên ${lateGoalN} phiên có mục tiêu). Khuya hợp với bạn thì cứ giữ.` };
  if (lateN === 0) return { status: 'ok', text: 'Gần đây bạn hầu như không làm phiên khuya (sau 22h), nên chưa có gì để nhận xét về khung muộn.' };
  return { status: 'insufficient', text: 'Chưa đủ phiên khuya có đặt mục tiêu để so với ban ngày. Mình chưa kết luận về khung muộn được.' };
}

function hTrend(b) {
  const t = hWeek(b);
  return t; // xu hướng ngắn hạn = momentum tuần (đã hedge)
}

function hRecommend(b) {
  const r = recommendNextSession(b.intel.profile, { ...b.opts, history: b.history });
  if (r.status !== 'ok') return { status: 'insufficient', text: `Mình chưa đủ dữ liệu để gợi ý chắc tay — cần thêm khoảng ${r.need ?? 5} phiên (tốt nhất có đặt mục tiêu). Tạm thời cứ chọn một phiên ngắn 25 phút cho dễ bắt đầu.` };
  const cat = r.category ? ` cho "${r.category.label}"` : '';
  if (!r.bucket.isNow) return { status: 'ok', text: `Bây giờ vẫn làm được, nhưng khung mạnh của bạn là ${r.bucket.label} — để dành việc khó cho lúc đó thì hợp hơn. Một phiên gọn ${r.minutes} phút lúc này là ổn (trên ${r.sampleSize} phiên, độ tin ${r.confidence}).` };
  if (r.expectedGoalRatePct != null) return { status: 'ok', text: `Lúc này hợp một phiên ${r.bucket.label} khoảng ${r.minutes} phút${cat}. Trên ${r.sampleSize} phiên cùng khung, bạn thường đạt mục tiêu ~${r.expectedGoalRatePct}% (độ tin ${r.confidence}).` };
  return { status: 'ok', text: `Lúc này hợp một phiên ${r.bucket.label} khoảng ${r.minutes} phút — đây là khung bạn ÍT bỏ giữa chừng nhất (trên ${r.sampleSize} phiên). Cứ xem là gợi ý nhẹ nhé.` };
}

function hNoteTopics(b) {
  const t = b.notes ?? analyzeNoteThemes(b.history);
  if (!t.ready || !t.themes.length) return { status: 'insufficient', text: 'Mình chưa gom được chủ đề rõ từ ghi chú (cần thêm ghi chú ở nhiều phiên). Bạn ghi "việc làm tiếp" cho vài phiên nữa là mình đọc ra chủ đề.' };
  const top = t.themes.slice(0, 3).map((x) => `"${x.label}" (${x.size} phiên)`).join(', ');
  return { status: 'ok', text: `Gom theo nghĩa từ ${t.noteCount} ghi chú của bạn, mấy chủ đề nổi nhất là: ${top}. Đây là gom tự động trên máy, có thể chưa chuẩn.` };
}

function hConsistency(b) {
  const c = b.intel.profile.consistency;
  if (c.status === 'insufficient') return { status: 'insufficient', text: 'Chưa đủ ngày hoạt động gần đây để đánh giá mức đều đặn của bạn.' };
  const v = c.value;
  const word = c.status === 'cao' ? 'khá đều' : c.status === 'vừa' ? 'tạm đều' : 'còn thưa';
  return { status: 'ok', text: `Bạn đang ${word}: trong ${v.windowDays} ngày gần đây có hoạt động ${v.activeDays} ngày (${pct(v.coverage)}%).` };
}

function hOverview(b) {
  if (b.intel.report.ready && b.intel.report.tldr) return { status: 'ok', text: b.intel.report.tldr };
  const need = b.intel.report.recommendation?.need ?? 5;
  return { status: 'insufficient', text: `Mình chưa đủ dữ liệu để vẽ bức tranh tổng quan — làm thêm khoảng ${need} phiên có đặt mục tiêu là Coach bắt đầu tóm tắt được giờ vàng, độ dài hợp và nhịp của bạn.` };
}

function hRecords(b) {
  const longest = b.store.streak?.longestStreak ?? 0;
  const total = b.intel.profile.totals.completed;
  if (total < 5) return { status: 'insufficient', text: 'Chưa đủ phiên để nói về kỷ lục. Làm thêm ít phiên nhé.' };
  return { status: 'ok', text: `Vài cột mốc của bạn (trong lịch sử đang lưu): chuỗi dài nhất ${longest} ngày, tổng ${total} phiên hoàn thành, ~${hours(b.intel.profile.totals.minutes)} giờ tập trung. Cứ tiếp tục để phá kỷ lục nhé.` };
}

function hCapabilities(b) {
  const ready = b.intel.profile.ready;
  if (!ready) return { status: 'ok', text: `Hiện mình mới có ${b.intel.profile.totals.completed} phiên của bạn — chưa đủ để phân tích chắc tay (cần khoảng 5 phiên có đặt mục tiêu). Khi đủ, mình chỉ được giờ vàng, độ dài phiên hợp, xu hướng tuần, khung hay bỏ giữa chừng và gợi ý phiên kế. Giờ cứ hoàn thành thêm vài phiên có mục tiêu nhé.` };
  return { status: 'ok', text: 'Mình trả lời được kha khá thứ từ lịch sử của bạn: giờ vàng, độ dài phiên hợp với lúc này, nhịp hôm nay (nhanh/chậm so mọi khi), tuần này so tuần trước, khung hay bỏ giữa chừng, mục tiêu ngày có vừa tầm không, loại việc nhiều/đang bỏ bê, chủ đề ghi chú, và gợi ý "giờ này làm gì hợp". Thử hỏi: "giờ vàng của mình?" hoặc "chiều nay làm phiên bao lâu?". Tất cả là quan sát từ lịch sử của bạn, không phải lời tiên đoán.' };
}

const HANDLERS = {
  today: hToday, 'this-week': hWeek, trend: hTrend, 'best-time': hBestTime,
  'session-length': hLength, streak: hStreak, 'goal-calibration': hGoalCal,
  category: hCategory, abandon: hAbandon, 'late-night': hLateNight,
  recommendation: hRecommend, 'note-topics': hNoteTopics, consistency: hConsistency,
  overview: hOverview, records: hRecords, capabilities: hCapabilities,
};

export function buildCoachBundle(history, opts, store, notes) {
  return {
    intel: buildCoachIntel(history ?? [], opts ?? {}),
    history: history ?? [],
    opts: opts ?? {},
    store: store ?? {},
    notes: notes ?? null,
  };
}

const ESCALATE_SUGGESTIONS = ['Tuần này mình thế nào?', 'Giờ vàng của mình?', 'Giờ này nên làm gì?'];

const INTENT_LABEL = {
  today: 'Hôm nay thế nào?', 'this-week': 'Tuần này so tuần trước?', 'best-time': 'Giờ vàng của mình?',
  'session-length': 'Nên làm phiên bao lâu?', streak: 'Chuỗi của mình?', recommendation: 'Giờ này nên làm gì?',
  category: 'Loại việc của mình?', abandon: 'Mình hay bỏ phiên khi nào?', 'goal-calibration': 'Mục tiêu có hợp không?',
  'note-topics': 'Dạo này mình hay làm gì?', overview: 'Tóm tắt giúp mình', records: 'Kỷ lục của mình?',
  consistency: 'Mình có đều không?', 'late-night': 'Làm khuya có ổn?', trend: 'Mình đang tiến bộ chứ?', capabilities: 'Bạn giúp được gì?',
};

export function answerQuestion(text, bundle, index = buildIntentIndex()) {
  const smalltalk = classifySmalltalk(text);
  if (smalltalk) return { intent: 'smalltalk', status: 'smalltalk', answer: smalltalk, suggestions: STARTER_SUGGESTIONS.slice(0, 3), confidence: null, action: null };

  if (isOutOfDomain(text)) {
    return { intent: null, status: 'unknown', answer: 'Cái đó ngoài tầm của Coach offline — mình chỉ đọc lịch sử tập trung của bạn thôi. Muốn hỏi sâu/chuyện khác thì bấm "Hỏi Claude" nhé.', suggestions: ESCALATE_SUGGESTIONS, confidence: null, action: { type: 'suggest_claude', question: text } };
  }

  const route = routeIntent(text, index);
  if (route.status === 'ok' && HANDLERS[route.intent]) {
    const out = HANDLERS[route.intent](bundle);
    return { intent: route.intent, status: out.status, answer: out.text, suggestions: STARTER_SUGGESTIONS.slice(0, 3), confidence: out.confidence ?? route.confidence, action: null };
  }
  if (route.status === 'ambiguous') {
    return { intent: null, status: 'ambiguous', answer: 'Ý bạn là chuyện nào? Bạn thử hỏi rõ hơn một chút nhé.', suggestions: route.alternatives.map((id) => (INTENT_LABEL[id] ?? id)), confidence: 'thấp', action: { type: 'chips', items: route.alternatives } };
  }
  // low / unknown → fallback + mời Claude
  return { intent: null, status: route.status, answer: 'Mình chưa chắc câu này lắm. Bạn thử hỏi theo mấy gợi ý bên dưới, hoặc bấm "Hỏi Claude" để hỏi sâu hơn nhé.', suggestions: ESCALATE_SUGGESTIONS, confidence: null, action: { type: 'suggest_claude', question: text } };
}
