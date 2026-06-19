/**
 * coachIntel.js — "Focus Intelligence": bộ máy phân tích tập trung LOCAL, MIỄN PHÍ.
 * Lập hồ sơ cá nhân + dự đoán (theo tần suất thật) + khuyến nghị + báo cáo bằng lời.
 *
 * Thiết kế qua workflow 4 agent (3 trụ + tổng hợp/phản biện). LÁ CHẮN TRUNG THỰC:
 * - Mọi tỉ lệ chỉ tính trên phiên CÓ đặt mục tiêu (goalAchieved boolean); thiếu mẫu
 *   → status 'insufficient' + "chưa đủ dữ liệu", KHÔNG bịa số.
 * - Xếp hạng dùng Wilson lower bound (mẫu nhỏ tự bị kéo xuống: 3/3 KHÔNG thắng 18/24).
 * - Hiển thị cho người dùng là TỈ LỆ QUAN SÁT thật, không phải cận-dưới-xếp-hạng.
 * - Dự đoán = đếm tần suất quá khứ (1 ngày = 1 mẫu), kèm độ tin theo cỡ mẫu.
 * - Câu chữ chỉ nêu TƯƠNG QUAN, CẤM từ nhân-quả (vì/nên/do/bởi/khiến/dẫn đến) —
 *   có test tự động canh. Ngưỡng giữ khớp với tín hiệu trong gameMath để không "đá nhau".
 * - THUẦN: không gọi Date trong engine; nhận getter giờ/ngày/tuần qua opts.
 * File MỚI, chỉ import (không sửa) gameMath → giữ nguyên test cũ.
 */
import {
  isCancelledHistoryEntry, getTimeOfDayBucket, TIME_OF_DAY_BUCKETS, COACH_MIN_SAMPLE,
  getWeeklyTrend, getGoldenHourBucket, getAbandonHotspot, getLateNightQualityDrop,
  getNeglectedCategory, getDailyGoalCalibration, getWeekdayHighlight, suggestSessionLength,
} from './gameMath';

export const COACH_BUCKET_MIN_SAMPLE = 4;
const CAT_MIN_SAMPLE = 4;
const CONSISTENCY_WINDOW = 28;
const CONSISTENCY_MIN_DAYS = 6;
const PRED_STREAK_MIN_DAYS = 4;
const PRED_STREAK_PCT_MIN_DAYS = 6;
const WEEKDAY_LABELS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const BAND_LABEL = { ngan: 'ngắn (dưới 26′)', vua: 'vừa (26–44′)', sau: 'sâu (từ 45′)' };
const BAND_MINUTES = { ngan: 20, vua: 35, sau: 50 };

function isCompletedSession(e) {
  return e && !isCancelledHistoryEntry(e) && e.completed !== false && Number.isFinite(e.minutes) && e.minutes > 0;
}

export function lengthBandOf(minutes) {
  const m = Number(minutes) || 0;
  if (m < 26) return 'ngan';
  if (m < 45) return 'vua';
  return 'sau';
}

// Cận dưới khoảng tin cậy Wilson cho tỉ lệ — mẫu nhỏ tự bị phạt điểm (phanh lạc
// quan). z=1.96 (95%) để 3/3 (~0.44) KHÔNG thắng 18/24 (~0.55) — đúng ý đồ.
export function wilsonLowerBound(hits, total, z = 1.96) {
  if (!total) return 0;
  const p = hits / total;
  const z2 = z * z;
  const denom = 1 + z2 / total;
  const center = p + z2 / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);
  return Math.max(0, (center - margin) / denom);
}

export function confidenceLabel(n) {
  if (n >= 10) return 'cao';
  if (n >= 6) return 'vừa';
  return 'thấp';
}

export function observedRate(hit, total) {
  return total > 0 ? hit / total : null;
}

function medianRounded5(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  const med = s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
  return Math.round(med / 5) * 5;
}

const pct = (x) => Math.round(x * 100);

// ── HỒ SƠ TẬP TRUNG ───────────────────────────────────────────────────────────

export function buildFocusProfile(history = [], opts = {}) {
  const {
    getEntryHour = (e) => new Date(e?.timestamp ?? 0).getHours(),
    getEntryWeekKey = null, nowWeekKey = null, prevWeekKey = null,
    getEntryDayKey = null, todayKey = null, minDayKey = null,
    activeCategoryIds = null, categoryLabelOf = () => null,
  } = opts;

  const all = Array.isArray(history) ? history : [];
  const byBand = new Map();
  const byCell = new Map();
  const byCategory = new Map();
  const dayMinutes = new Map();
  let completed = 0; let cancelled = 0; let minutes = 0; let withGoal = 0; let goalHit = 0; let deep = 0;

  for (const e of all) {
    if (isCancelledHistoryEntry(e)) { cancelled += 1; continue; }
    if (!isCompletedSession(e)) continue;
    completed += 1; minutes += e.minutes;
    if (e.minutes >= 45) deep += 1;
    const hasGoal = typeof e.goalAchieved === 'boolean';
    if (hasGoal) { withGoal += 1; if (e.goalAchieved === true) goalHit += 1; }
    const bucket = getTimeOfDayBucket(getEntryHour(e));
    const band = lengthBandOf(e.minutes);
    const bd = byBand.get(band) ?? { band, total: 0, goalTotal: 0, goalHit: 0 };
    bd.total += 1; if (hasGoal) { bd.goalTotal += 1; if (e.goalAchieved) bd.goalHit += 1; }
    byBand.set(band, bd);
    const ck = `${bucket.id}|${band}`;
    const c = byCell.get(ck) ?? { bucketId: bucket.id, bucketLabel: bucket.label, band, total: 0, goalTotal: 0, goalHit: 0, minutesList: [] };
    c.total += 1; c.minutesList.push(e.minutes); if (hasGoal) { c.goalTotal += 1; if (e.goalAchieved) c.goalHit += 1; }
    byCell.set(ck, c);
    const catId = e.categoryId ?? null;
    if (catId && (!activeCategoryIds || activeCategoryIds.has(catId))) {
      const label = categoryLabelOf(catId) ?? e.categorySnapshot?.label ?? null;
      if (label) {
        const cat = byCategory.get(catId) ?? { categoryId: catId, label, sessions: 0, minutes: 0, goalTotal: 0, goalHit: 0 };
        cat.sessions += 1; cat.minutes += e.minutes; cat.label = label;
        if (hasGoal) { cat.goalTotal += 1; if (e.goalAchieved) cat.goalHit += 1; }
        byCategory.set(catId, cat);
      }
    }
    if (typeof getEntryDayKey === 'function') {
      const dk = getEntryDayKey(e);
      if (dk && dk !== todayKey && (!minDayKey || dk >= minDayKey)) dayMinutes.set(dk, (dayMinutes.get(dk) ?? 0) + e.minutes);
    }
  }

  const ready = completed >= COACH_MIN_SAMPLE;
  const insufficient = (blurb) => ({ status: 'insufficient', value: null, sampleSize: 0, blurb });

  // (1) Chronotype — TÁI DÙNG getGoldenHourBucket để khớp thẻ Coach
  let chronotype;
  const golden = getGoldenHourBucket(all, { getEntryHour });
  if (golden) chronotype = { status: confidenceLabel(golden.sampleSize), value: { bucketId: golden.bucketId, bucketLabel: golden.bucketLabel, rate: golden.rate }, sampleSize: golden.sampleSize, blurb: `Bạn hay đạt mục tiêu vào ${golden.bucketLabel} nhất — ${pct(golden.rate)}% (trên ${golden.sampleSize} phiên có mục tiêu).` };
  else chronotype = insufficient('Chưa đủ dữ liệu để xác định buổi mạnh nhất — cần thêm phiên có đặt mục tiêu ở nhiều khung giờ.');

  // (2) Độ dài lý tưởng — dải có tỉ lệ đạt cao nhất (đủ mẫu + có mục tiêu)
  let idealLength;
  const bandsWithGoal = [...byBand.values()].filter((b) => b.goalTotal >= COACH_BUCKET_MIN_SAMPLE);
  if (bandsWithGoal.length >= 2) {
    bandsWithGoal.sort((a, b) => wilsonLowerBound(b.goalHit, b.goalTotal) - wilsonLowerBound(a.goalHit, a.goalTotal));
    const top = bandsWithGoal[0];
    idealLength = { status: confidenceLabel(top.goalTotal), value: { band: top.band, label: BAND_LABEL[top.band], rate: observedRate(top.goalHit, top.goalTotal) }, sampleSize: top.goalTotal, blurb: `Phiên ${BAND_LABEL[top.band]} thường đi cùng tỉ lệ đạt mục tiêu cao nhất của bạn — ${pct(top.goalHit / top.goalTotal)}% (trên ${top.goalTotal} phiên).` };
  } else idealLength = insufficient('Chưa đủ dữ liệu để so các độ dài phiên — cần thêm phiên có mục tiêu ở nhiều độ dài.');

  // (3) Đều đặn — % ngày có hoạt động trong 28 ngày
  let consistency;
  const activeDays = dayMinutes.size;
  if (typeof getEntryDayKey === 'function' && activeDays >= CONSISTENCY_MIN_DAYS) {
    const coverage = activeDays / CONSISTENCY_WINDOW;
    const status = coverage >= 0.6 ? 'cao' : coverage >= 0.35 ? 'vừa' : 'thấp';
    consistency = { status, value: { coverage, activeDays, windowDays: CONSISTENCY_WINDOW }, sampleSize: activeDays, blurb: `Trong ${CONSISTENCY_WINDOW} ngày gần đây bạn có hoạt động ${activeDays} ngày (${pct(coverage)}%).` };
  } else consistency = insufficient('Chưa đủ ngày hoạt động gần đây để đánh giá mức đều đặn.');

  // (4) Tỉ lệ phiên sâu (≥45′) — mô tả thuần, không phán tốt/xấu
  const deepWorkRatio = ready
    ? { status: deep / completed >= 0.4 ? 'cao' : deep / completed >= 0.15 ? 'vừa' : 'thấp', value: { ratio: deep / completed, deepCount: deep, total: completed }, sampleSize: completed, blurb: `${deep}/${completed} phiên của bạn là phiên sâu (từ 45 phút) — ${pct(deep / completed)}%.` }
    : insufficient('Chưa đủ phiên để tính tỉ lệ phiên sâu.');

  // (5) Hiệu suất theo loại việc
  let categoryPerformance;
  const cats = [...byCategory.values()].filter((c) => c.sessions >= CAT_MIN_SAMPLE);
  if (cats.length >= 1) {
    cats.sort((a, b) => b.minutes - a.minutes);
    const top = cats.slice(0, 4).map((c) => ({ label: c.label, hours: Math.round((c.minutes / 60) * 10) / 10, sessions: c.sessions, goalRate: c.goalTotal >= 3 ? observedRate(c.goalHit, c.goalTotal) : null }));
    const lead = top[0];
    const ratePart = lead.goalRate != null ? `, đạt mục tiêu ${pct(lead.goalRate)}%` : '';
    categoryPerformance = { status: confidenceLabel(cats[0].sessions), value: { top }, sampleSize: cats[0].sessions, blurb: `Loại bạn dành nhiều thời gian nhất là "${lead.label}" (${lead.hours}h${ratePart}).` };
  } else categoryPerformance = insufficient('Chưa đủ phiên gắn loại việc để xếp hạng hiệu suất theo loại.');

  // (6) So tuần — TÁI DÙNG getWeeklyTrend để khớp thẻ Coach
  let momentum;
  const tr = getWeeklyTrend(all, { getEntryWeekKey, nowWeekKey, prevWeekKey });
  if (tr) momentum = { status: tr.direction === 'up' ? 'cao' : tr.direction === 'down' ? 'thấp' : 'vừa', value: { direction: tr.direction, thisMinutes: tr.thisMinutes, prevMinutes: tr.prevMinutes, pct: tr.pct }, sampleSize: tr.thisN + tr.prevN, blurb: `Tuần này bạn tập trung ${tr.pct >= 0 ? 'nhiều hơn' : 'ít hơn'} tuần trước ${Math.abs(tr.pct)}% (${tr.thisMinutes}′ so với ${tr.prevMinutes}′).` };
  else momentum = insufficient('Chưa đủ dữ liệu hai tuần liên tiếp để so sánh.');

  return {
    ready,
    totals: { completed, cancelled, minutes, withGoal, goalHit, goalRate: withGoal > 0 ? goalHit / withGoal : null },
    chronotype, idealLength, consistency, deepWorkRatio, categoryPerformance, momentum,
    _cells: byCell, _cats: byCategory,
  };
}

export function describeFocusProfile(profile) {
  if (!profile || !profile.ready) return 'Chưa đủ dữ liệu để vẽ hồ sơ tập trung — hoàn thành thêm vài phiên có đặt mục tiêu là Coach bắt đầu phân tích được.';
  const bits = [`Theo ${profile.totals.completed} phiên đã ghi`];
  if (profile.chronotype.status !== 'insufficient') bits.push(`bạn nghiêng về ${profile.chronotype.value.bucketLabel} (đạt ${pct(profile.chronotype.value.rate)}%)`);
  if (profile.idealLength.status !== 'insufficient') bits.push(`hợp nhất với phiên ${profile.idealLength.value.label}`);
  if (profile.consistency.status !== 'insufficient') bits.push(`giữ nhịp ${pct(profile.consistency.value.coverage)}% số ngày gần đây`);
  let text = `${bits.join(', ')}.`;
  if (profile.momentum.status !== 'insufficient') text += ` ${profile.momentum.blurb}`;
  text += ' Đây là bức tranh từ chính lịch sử của bạn, không phải lời tiên đoán.';
  return text;
}

// ── KHUYẾN NGHỊ PHIÊN KẾ ──────────────────────────────────────────────────────

export function recommendNextSession(profile, opts = {}) {
  const { nowHour = 0, getEntryHour = (e) => new Date(e?.timestamp ?? 0).getHours(), history = [] } = opts;
  if (!profile || !profile.ready) return { status: 'insufficient', need: Math.max(1, COACH_MIN_SAMPLE - (profile?.totals?.completed ?? 0)) };

  const cells = [...(profile._cells?.values() ?? [])].filter((c) => c.total >= COACH_BUCKET_MIN_SAMPLE);
  if (!cells.length) return { status: 'insufficient', need: 1 };

  const currentBucket = getTimeOfDayBucket(nowHour);
  // Tách bạch: ưu tiên ô có DỮ LIỆU MỤC TIÊU (Wilson lower bound — phạt mẫu nhỏ);
  // chỉ rơi xuống "độ trọn vẹn" (số phiên) khi KHÔNG ô nào đủ mục tiêu. Không trộn.
  const goalCells = cells.filter((c) => c.goalTotal >= 3);
  const pool = goalCells.length ? goalCells : cells;
  const goalBasis = goalCells.length > 0;
  const fitOf = (c) => (c.bucketId === currentBucket.id ? 1 : 0.85);
  const scoreOf = (c) => (goalBasis ? wilsonLowerBound(c.goalHit, c.goalTotal) : c.total) * fitOf(c);
  pool.forEach((c) => { c._score = scoreOf(c); });
  const ranked = [...pool].sort((a, b) => b._score - a._score);
  const inNow = ranked.filter((c) => c.bucketId === currentBucket.id);
  const best = inNow.length ? inNow[0] : ranked[0];
  const isNow = best.bucketId === currentBucket.id;

  let minutes;
  if (isNow) {
    const sug = suggestSessionLength(history, { nowHour, getEntryHour });
    minutes = sug ? sug.minutes : medianRounded5(best.minutesList) ?? BAND_MINUTES[best.band];
  } else minutes = medianRounded5(best.minutesList) ?? BAND_MINUTES[best.band];
  minutes = Math.min(180, Math.max(5, minutes));

  const expectedGoalRatePct = goalBasis ? pct(best.goalHit / best.goalTotal) : null;
  const confidence = confidenceLabel(best.total);

  // chọn loại việc
  let category = null;
  const cats = [...(profile._cats?.values() ?? [])].filter((c) => c.sessions >= 3 && c.label);
  if (cats.length) {
    cats.sort((a, b) => (b.goalTotal >= 3 ? wilsonLowerBound(b.goalHit, b.goalTotal) : 0) - (a.goalTotal >= 3 ? wilsonLowerBound(a.goalHit, a.goalTotal) : 0));
    if (cats[0].goalTotal >= 3) category = { id: cats[0].categoryId, label: cats[0].label };
  }

  const headline = goalBasis
    ? `Lúc này hợp với một phiên ${best.bucketLabel} khoảng ${minutes} phút${category ? ` cho "${category.label}"` : ''}.`
    : `Lúc này hợp với một phiên ${best.bucketLabel} khoảng ${minutes} phút — đây là khung bạn ÍT bỏ giữa chừng nhất.`;
  const reason = goalBasis
    ? `Dựa trên ${best.total} phiên cùng khung, tỉ lệ đạt mục tiêu của bạn ~${expectedGoalRatePct}%.`
    : `Dựa trên ${best.total} phiên cùng khung; chưa đủ phiên có đặt mục tiêu để tính tỉ lệ đạt.`;

  return { status: 'ok', bucket: { id: best.bucketId, label: best.bucketLabel, isNow }, minutes, band: { id: best.band, label: BAND_LABEL[best.band] }, category, confidence, expectedGoalRatePct, sampleSize: best.total, headline, reason };
}

// ── DỰ ĐOÁN ───────────────────────────────────────────────────────────────────

export function predictStreakKeep(history = [], opts = {}) {
  const {
    nowHour = 23, todayWeekday = null,
    getEntryHour = (e) => new Date(e?.timestamp ?? 0).getHours(),
    getEntryWeekday = (e) => new Date(e?.timestamp ?? 0).getDay(),
    getEntryDayKey = null, todayKey = null, minDayKey = null,
    hasSessionToday = false, minSampleDays = PRED_STREAK_MIN_DAYS,
  } = opts;
  const wdLabel = todayWeekday != null ? WEEKDAY_LABELS[((todayWeekday % 7) + 7) % 7] : 'hôm nay';
  if (hasSessionToday) return { kind: 'streak-keep', status: 'secured', sampleDays: 0, weekdayLabel: wdLabel, reason: 'Hôm nay bạn đã có phiên rồi — chuỗi đang an toàn.' };
  if (typeof getEntryDayKey !== 'function' || todayWeekday == null) return { kind: 'streak-keep', status: 'insufficient', sampleDays: 0, weekdayLabel: wdLabel, reason: 'Chưa đủ dữ liệu theo ngày để dự đoán.' };

  // 1 ngày = 1 mẫu; chỉ xét ngày cùng thứ, trong cửa sổ, không tính hôm nay
  const days = new Map(); // dayKey -> { earliestHour }
  for (const e of history) {
    if (!isCompletedSession(e)) continue;
    const dk = getEntryDayKey(e);
    if (!dk || dk === todayKey || (minDayKey && dk < minDayKey)) continue;
    if ((((getEntryWeekday(e) % 7) + 7) % 7) !== (((todayWeekday % 7) + 7) % 7)) continue;
    const h = getEntryHour(e);
    const cur = days.get(dk);
    if (!cur || h < cur.earliestHour) days.set(dk, { earliestHour: h });
  }
  const sampleDays = days.size;
  if (sampleDays < minSampleDays) return { kind: 'streak-keep', status: 'insufficient', sampleDays, weekdayLabel: wdLabel, reason: `Mới có ${sampleDays} ${wdLabel} trong dữ liệu gần đây — chưa đủ để nói chắc.` };

  const hit = sampleDays; // mọi ngày trong map đều có ≥1 phiên
  const beforeNow = [...days.values()].filter((d) => d.earliestHour <= nowHour).length;
  const showPct = sampleDays >= PRED_STREAK_PCT_MIN_DAYS;
  return {
    kind: 'streak-keep', status: 'predicted',
    sampleDays, hit, beforeNow, weekdayLabel: wdLabel,
    probability: showPct ? hit / sampleDays : null,
    confidence: confidenceLabel(sampleDays),
    reason: `Gần đây ${hit}/${sampleDays} ${wdLabel} bạn đều có ít nhất một phiên${showPct ? ` (~${pct(hit / sampleDays)}%)` : ''}. Làm một phiên gọn hôm nay là gần như chắc giữ được chuỗi.`,
  };
}

export function predictBestWindow(history = [], opts = {}) {
  const { nowHour = 0, getEntryHour = (e) => new Date(e?.timestamp ?? 0).getHours(), minSample = COACH_BUCKET_MIN_SAMPLE } = opts;
  const byBucket = new Map();
  for (const e of history) {
    if (!isCompletedSession(e) || typeof e.goalAchieved !== 'boolean') continue;
    const b = getTimeOfDayBucket(getEntryHour(e));
    const cur = byBucket.get(b.id) ?? { bucket: b, total: 0, hit: 0 };
    cur.total += 1; if (e.goalAchieved === true) cur.hit += 1;
    byBucket.set(b.id, cur);
  }
  const ahead = [...byBucket.values()].filter((x) => x.bucket.startHour > nowHour && x.bucket.startHour < x.bucket.endHour);
  if (!ahead.length) return { kind: 'best-window', status: 'none-left', reason: 'Hôm nay không còn khung giờ phía trước để gợi ý — để dành việc khó cho ngày mai nhé.' };
  const eligible = ahead.filter((x) => x.total >= minSample && x.hit / x.total >= 0.55);
  if (!eligible.length) return { kind: 'best-window', status: 'insufficient', reason: 'Chưa đủ dữ liệu để chọn khung giờ vàng còn lại hôm nay.' };
  eligible.sort((a, b) => (b.hit / b.total) - (a.hit / a.total));
  const best = eligible[0];
  return { kind: 'best-window', status: 'found', bucketId: best.bucket.id, bucketLabel: best.bucket.label, rate: best.hit / best.total, sampleSize: best.total, confidence: confidenceLabel(best.total), reason: `Việc khó hôm nay hợp để dành cho ${best.bucket.label} — khung này tỉ lệ đạt mục tiêu của bạn cao (${pct(best.hit / best.total)}%, trên ${best.total} phiên).` };
}

export function generatePredictions(history = [], opts = {}) {
  const streak = predictStreakKeep(history, opts);
  const window = predictBestWindow(history, opts);
  let headline = null;
  if (window.status === 'found') headline = { text: window.reason, confidence: window.confidence };
  else if (streak.status === 'predicted') headline = { text: streak.reason, confidence: streak.confidence };
  else if (streak.status === 'secured') headline = { text: streak.reason, confidence: 'cao' };
  return { streak, window, headline };
}

// ── PHÁT HIỆN MẪU (tái dùng tín hiệu cũ, giọng tương quan) ─────────────────────

export function detectPatterns(history = [], opts = {}) {
  const {
    getEntryHour, getEntryWeekday, getEntryWeekKey, nowWeekKey, prevWeekKey,
    getEntryDayKey, todayKey, minDayKey, getEntryDayNumber, nowDayNumber,
    dailyGoalMetric, dailyGoal, activeCategoryIds,
  } = opts;
  const out = [];

  const tr = getWeeklyTrend(history, { getEntryWeekKey, nowWeekKey, prevWeekKey });
  if (tr && tr.direction !== 'flat') out.push({ id: tr.direction === 'up' ? 'trend-up' : 'trend-down', severity: tr.direction === 'up' ? 'good' : 'warn', confidence: confidenceLabel(tr.thisN + tr.prevN), headline: `Tuần này ${tr.direction === 'up' ? 'nhiều hơn' : 'ít hơn'} tuần trước ${Math.abs(tr.pct)}%`, detail: `Bạn tập trung ${tr.thisMinutes}′ tuần này, so với ${tr.prevMinutes}′ tuần trước.`, evidence: tr, suggestion: null });

  const golden = getGoldenHourBucket(history, { getEntryHour });
  if (golden) out.push({ id: 'golden', severity: 'good', confidence: confidenceLabel(golden.sampleSize), headline: `Giờ vàng: ${golden.bucketLabel} (${pct(golden.rate)}%)`, detail: `Các phiên ${golden.bucketLabel} của bạn thường đi cùng tỉ lệ đạt mục tiêu cao nhất.`, evidence: golden, suggestion: null });

  const ab = getAbandonHotspot(history, { getEntryHour });
  if (ab) out.push({ id: 'abandon', severity: 'warn', confidence: confidenceLabel(ab.attempts), headline: `${ab.bucketLabel}: hay bỏ giữa chừng (${pct(ab.rate)}%)`, detail: `Vào ${ab.bucketLabel}, các phiên của bạn thường đi cùng tỉ lệ bỏ giữa chừng cao hơn.`, evidence: ab, suggestion: 'Thử đặt phiên ngắn hơn cho khung này.' });

  const late = getLateNightQualityDrop(history, { getEntryHour });
  if (late) out.push({ id: 'late-quality', severity: 'warn', confidence: confidenceLabel(late.lateAttempts), headline: `Sau ${late.lateStartHour}h: tỉ lệ đạt thấp hơn`, detail: `Các phiên sau ${late.lateStartHour}h của bạn thường đi cùng tỉ lệ đạt mục tiêu thấp hơn ban ngày (${pct(late.lateGoalRate)}% so với ${pct(late.dayGoalRate)}%). Đây là tương quan chứ không phải kết luận.`, evidence: late, suggestion: 'Khung muộn hợp để dành cho việc nhẹ.' });

  if (typeof getEntryDayNumber === 'function' && Number.isFinite(nowDayNumber)) {
    const neg = getNeglectedCategory(history, { nowDayNumber, getEntryDayNumber, activeCategoryIds });
    if (neg) out.push({ id: 'category-neglect', severity: 'info', confidence: confidenceLabel(neg.sessions), headline: `"${neg.label}": ${neg.daysSince} ngày chưa làm`, detail: `Nhóm "${neg.label}" từng chiếm ~${pct(neg.share)}% thời gian nhưng đã lâu chưa có phiên.`, evidence: neg, suggestion: `Cấy một phiên cho "${neg.label}" để giữ nhịp.` });
  }

  if (typeof getEntryDayKey === 'function' && todayKey) {
    const cal = getDailyGoalCalibration(history, { goalType: dailyGoalMetric, goalValue: dailyGoal, getEntryDayKey, todayKey, minDayKey });
    if (cal) {
      const unit = cal.goalType === 'minutes' ? 'phút' : 'phiên';
      out.push({ id: cal.verdict, severity: cal.verdict === 'too-hard' ? 'warn' : 'info', confidence: confidenceLabel(cal.daysCounted), headline: cal.verdict === 'too-hard' ? `Mục tiêu ngày hơi quá sức (${pct(cal.hitRate)}%)` : `Mục tiêu ngày hơi nhẹ (${pct(cal.hitRate)}%)`, detail: `Trong ${cal.daysCounted} ngày gần đây, trung vị của bạn là ${Math.round(cal.median)} ${unit}/ngày.`, evidence: cal, suggestion: `Thử chỉnh mục tiêu về ${cal.suggested} ${unit}/ngày.` });
    }
  }

  const wd = getWeekdayHighlight(history, { getEntryWeekday });
  if (wd) out.push({ id: 'weekday', severity: 'info', confidence: confidenceLabel(wd.count), headline: `${wd.label}: ngày bạn làm nhiều nhất`, detail: `${wd.label} chiếm ~${pct(wd.share)}% số phiên của bạn (${wd.count} phiên).`, evidence: wd, suggestion: null });

  const rank = { warn: 0, good: 1, info: 2 };
  const conf = { cao: 0, vừa: 1, thấp: 2 };
  out.sort((a, b) => (rank[a.severity] - rank[b.severity]) || (conf[a.confidence] - conf[b.confidence]));
  return out;
}

// ── BÁO CÁO + MẶT TIỀN ────────────────────────────────────────────────────────

export function composeFocusReport(history = [], opts = {}) {
  const profile = buildFocusProfile(history, opts);
  if (!profile.ready) {
    return { ready: false, generatedFromSessions: profile.totals.completed, tldr: describeFocusProfile(profile), recommendation: { status: 'insufficient', need: Math.max(1, COACH_MIN_SAMPLE - profile.totals.completed) }, sections: [], patterns: [] };
  }
  const recommendation = recommendNextSession(profile, opts);
  const allPatterns = detectPatterns(history, { ...opts, profile });
  const patterns = allPatterns.filter((p) => p.confidence !== 'thấp').slice(0, 4);

  const t = profile.totals;
  const sections = [];
  sections.push({ id: 'snapshot', title: 'Tổng quan', tone: 'neutral', body: `${t.completed} phiên hoàn thành, ~${Math.round(t.minutes / 60)} giờ tập trung${t.cancelled ? `, ${t.cancelled} phiên bị huỷ` : ''}.${t.goalRate != null ? ` Đạt mục tiêu ${pct(t.goalRate)}% (trên ${t.withGoal} phiên có đặt mục tiêu).` : ''}` });
  if (recommendation.status === 'ok') sections.push({ id: 'recommendation', title: 'Phiên kế tiếp', tone: 'action', body: `${recommendation.headline} ${recommendation.reason}` });
  if (patterns.length) sections.push({ id: 'patterns', title: 'Mẫu đáng chú ý', tone: 'neutral', bullets: patterns.map((p) => `${p.headline} — ${p.detail}${p.suggestion ? ` ${p.suggestion}` : ''}`) });
  sections.push({ id: 'caveats', title: 'Lưu ý', tone: 'muted', body: 'Tất cả là quan sát từ lịch sử của bạn (tương quan), không phải kết luận nhân quả hay lời tiên đoán.' });

  return { ready: true, generatedFromSessions: t.completed, tldr: describeFocusProfile(profile), recommendation, sections, patterns };
}

export function buildCoachIntel(history = [], opts = {}) {
  const profile = buildFocusProfile(history, opts);
  const predictions = generatePredictions(history, opts);
  const report = composeFocusReport(history, opts);
  return { profile, predictions, report };
}
