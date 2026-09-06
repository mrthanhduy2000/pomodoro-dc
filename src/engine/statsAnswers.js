/**
 * statsAnswers.js — BA CÂU TRẢ LỜI của màn Thống kê (ADR-071, 2026-09-06). THUẦN, không gọi Date.
 *
 * Màn Thống kê cũ TRÌNH BÀY: 5 tab · 6 kỳ · 3.792 dòng biểu đồ, và không câu nào trong ba câu Đàm
 * thật sự hỏi được trả lời ở nếp gấp đầu. File này chỉ GHÉP những phép phân tích ĐÃ CÓ, ĐÃ TEST, ĐÃ
 * GÁC CỠ MẪU (`coach/coachIntel.js` · `gameMath.js`) thành ba câu trả lời:
 *   (1) Tôi có đang khá lên không?  — tuần này so với CÙNG QUÃNG của tuần trước, kèm 7 cặp cột.
 *   (2) Khi nào tôi mạnh nhất?      — giờ · độ dài · loại việc trên PHIÊN TRỌN VẸN, mỗi thứ kèm cỡ mẫu.
 *   (3) Làm gì tiếp?                — ĐÚNG MỘT gợi ý (phút + loại việc), đủ để bấm là chạy.
 *
 * ⚠️ HAI LUẬT, cùng luật với AI Coach và dải "Điều đáng chú ý" (`statsInsights.js`):
 *   (a) Một con số không có MẪU SỐ thì không phải mục tiêu — mọi tỉ lệ đi kèm "trên N phiên".
 *   (b) KHÔNG chế công thức mới ở đây. Cần một phép tính chưa có thì viết ở `gameMath.js` KÈM TEST
 *       rồi gọi về; viết phép tính thứ hai ở đây là "một luật hai công thức".
 *
 * ⚠️ VÌ SAO SO "CÙNG QUÃNG" CHỨ KHÔNG SO TRỌN TUẦN TRƯỚC: sáng thứ Ba, tuần này mới có hai ngày còn
 * tuần trước có bảy — so trọn tuần thì ô này ĐỎ suốt sáu ngày mỗi tuần và chỉ xanh vào Chủ nhật.
 * `getWeeklyTrend` (Coach) so trọn tuần vì nó được đọc lúc GỬI một câu hỏi; ô này đọc MỖI LẦN mở
 * màn. Ngưỡng "giữ nhịp" thì dùng CHUNG (`WEEK_TREND_THRESHOLD_PCT`), để hai nơi không nói lệch.
 */
import {
  buildFocusProfile, recommendNextSession, wilsonLowerBound, observedRate, COACH_BUCKET_MIN_SAMPLE, BAND_LABEL,
} from './coach/coachIntel';
import { coachCompletedSessions, COACH_MIN_SAMPLE, WEEK_TREND_THRESHOLD_PCT } from './gameMath';
import { startOfVietnamWeekTs, vietnamHistoryTimeOpts } from './time';
import { clampFocusMinutes } from './timerSession';

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
/** Nhãn cột thứ Hai → Chủ nhật — tuần Việt Nam bắt đầu thứ Hai, khớp `localWeekMondayStr`. */
export const WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
/** Độ dài phiên đề nghị khi lịch sử chưa đủ để gợi ý riêng. */
export const DEFAULT_FALLBACK_MINUTES = 25;

const pct = (x) => Math.round((x ?? 0) * 100);
const entryTs = (e) => new Date(e?.timestamp ?? 0).getTime();
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const clampMinutes = (n) => clampFocusMinutes(Math.round(Number(n) || DEFAULT_FALLBACK_MINUTES));

/** "2 giờ 15 phút" · "45 phút" — chữ đầy đủ, để lưới chống-bịa của Coach đọc được cùng đơn vị. */
export function formatMinutesVi(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} giờ ${r} phút` : `${h} giờ`;
}

/**
 * (1) Tuần này so với tuần trước — TÍNH TỚI CÙNG LÚC NÀY của tuần trước.
 * @returns {{status:'empty'|'no-baseline'|'ready', direction:'up'|'down'|'flat', pct:number|null,
 *   thisMinutes, prevMinutes, thisN, prevN, elapsedDays, days:Array<{label,thisMinutes,prevMinutes,elapsed}>,
 *   headline:string, detail:string}}
 */
export function buildWeekComparison(history = [], { now = new Date() } = {}) {
  const nowTs = now instanceof Date ? now.getTime() : Number(now);
  const thisStart = startOfVietnamWeekTs(nowTs);
  const prevStart = thisStart - WEEK_MS;
  const prevEnd = nowTs - WEEK_MS;
  const elapsedDays = Math.min(7, Math.floor((nowTs - thisStart) / DAY_MS) + 1);
  const days = WEEKDAY_SHORT.map((label, i) => ({ label, thisMinutes: 0, prevMinutes: 0, elapsed: i < elapsedDays }));
  let thisMinutes = 0; let prevMinutes = 0; let thisN = 0; let prevN = 0;
  for (const e of coachCompletedSessions(Array.isArray(history) ? history : [])) {
    const ts = entryTs(e);
    if (ts >= thisStart && ts <= nowTs) {
      days[Math.min(6, Math.floor((ts - thisStart) / DAY_MS))].thisMinutes += e.minutes;
      thisMinutes += e.minutes; thisN += 1;
    } else if (ts >= prevStart && ts <= prevEnd) {
      days[Math.min(6, Math.floor((ts - prevStart) / DAY_MS))].prevMinutes += e.minutes;
      prevMinutes += e.minutes; prevN += 1;
    }
  }
  const base = { thisMinutes, prevMinutes, thisN, prevN, elapsedDays, days, pct: null, direction: 'flat' };
  if (thisN === 0 && prevN === 0) {
    return { ...base, status: 'empty', headline: 'Chưa có phiên nào trong hai tuần gần đây.', detail: 'Xong một phiên là ô này bắt đầu so tuần này với tuần trước.' };
  }
  if (prevN === 0) {
    return { ...base, status: 'no-baseline', direction: 'up', headline: `Tuần này đã có ${thisN} phiên, ${formatMinutesVi(thisMinutes)}.`, detail: 'Cùng quãng này tuần trước chưa có phiên nào để so — sang tuần sau ô này mới thành một phép so sánh.' };
  }
  if (thisN === 0) {
    return { ...base, status: 'ready', pct: -100, direction: 'down', headline: 'Tuần này chưa có phiên nào.', detail: `Tới cùng lúc này tuần trước bạn đã có ${prevN} phiên, ${formatMinutesVi(prevMinutes)}.` };
  }
  const delta = Math.round(((thisMinutes - prevMinutes) / prevMinutes) * 100);
  const direction = delta >= WEEK_TREND_THRESHOLD_PCT ? 'up' : delta <= -WEEK_TREND_THRESHOLD_PCT ? 'down' : 'flat';
  const headline = direction === 'up'
    ? `Tuần này bạn tập trung nhiều hơn tuần trước ${delta}%.`
    : direction === 'down'
      ? `Tuần này bạn tập trung ít hơn tuần trước ${Math.abs(delta)}%.`
      : 'Tuần này bạn giữ nhịp ngang tuần trước.';
  const detail = `${formatMinutesVi(thisMinutes)} qua ${thisN} phiên, so với ${formatMinutesVi(prevMinutes)} qua ${prevN} phiên tính tới cùng lúc này tuần trước.`;
  return { ...base, status: 'ready', pct: delta, direction, headline, detail };
}

/**
 * (2) When am I strongest — hour · length · task type, ranked on the WHOLE-SESSION rate (ADR-076).
 *
 * A whole session = started, not cancelled, not self-rated "Chưa đạt". Round 36 ranked these three
 * lines on goal reviews only, so the heart of the screen stayed empty for the one player who rarely
 * types a goal. The counters live in `buildFocusProfile` (`started`/`whole` per cell, band and
 * category) — a goal review still counts, it lowers `whole` for a miss; it just no longer gates.
 * Wilson lower bound (same brake as the Coach) ranks buckets with ≥ COACH_BUCKET_MIN_SAMPLE sessions;
 * below that the line still ANSWERS with the busiest bucket and its raw fraction (`thin: true`), because
 * a screen that asks the player to do more work first is an empty box with a caption.
 */
const rankByWhole = (rows) => rows.slice().sort((a, b) => (
  (wilsonLowerBound(b.whole, b.started) - wilsonLowerBound(a.whole, a.started)) || (b.started - a.started)
));

function bestRow(rows) {
  const eligible = rows.filter((r) => r.started >= COACH_BUCKET_MIN_SAMPLE);
  if (eligible.length) return { row: rankByWhole(eligible)[0], thin: false };
  if (rows.length) return { row: rows.slice().sort((a, b) => (b.started - a.started) || (b.whole - a.whole))[0], thin: true };
  return null;
}

function bestLine(id, label, rows, describe) {
  const pick = bestRow(rows);
  if (!pick) return { id, label, ready: false, note: 'Chưa có phiên nào.' };
  const { row, thin } = pick;
  return {
    id, label, ready: true, thin, ...describe(row),
    note: thin ? `${row.whole}/${row.started} phiên trọn vẹn` : `trọn vẹn ${pct(observedRate(row.whole, row.started))}%`,
    sample: `${row.started} phiên`,
  };
}

export function buildBestWindow(profile) {
  const byBucket = new Map();
  const byBand = new Map();
  const add = (map, key, init, cell) => {
    const cur = map.get(key) ?? init();
    cur.started += cell.started ?? 0; cur.whole += cell.whole ?? 0;
    map.set(key, cur);
  };
  for (const c of profile?._cells?.values() ?? []) {
    add(byBucket, c.bucketId, () => ({ bucketId: c.bucketId, bucketLabel: c.bucketLabel, started: 0, whole: 0 }), c);
    add(byBand, c.band, () => ({ band: c.band, started: 0, whole: 0 }), c);
  }
  const cats = [...(profile?._cats?.values() ?? [])].filter((c) => c.label);
  return [
    bestLine('hour', 'Giờ', [...byBucket.values()], (r) => ({ value: capitalize(r.bucketLabel) })),
    bestLine('length', 'Độ dài', [...byBand.values()], (r) => ({ value: `Phiên ${BAND_LABEL[r.band]}` })),
    bestLine('category', 'Loại việc', cats, (r) => ({ value: `"${r.label}"`, categoryId: r.categoryId })),
  ];
}

/**
 * (3) Làm gì tiếp — ĐÚNG MỘT gợi ý. Đủ dữ liệu thì là `recommendNextSession` (phút + loại việc + khung
 * giờ, cùng số với Coach); chưa đủ thì vẫn là MỘT NÚT chạy được (phút mặc định), vì màn hình không
 * được kết thúc bằng một câu "chưa đủ dữ liệu" mà không có việc gì để làm. `reason` LUÔN mang mẫu
 * số ("Dựa trên N phiên…" / "(N phiên đã ghi)") — giao diện chỉ in nó, không ghép thêm.
 */
export function buildNextAction(profile, history = [], opts = {}) {
  const fallbackMinutes = clampMinutes(opts.fallbackMinutes);
  const rec = recommendNextSession(profile, { ...opts, history });
  if (rec.status === 'ok') {
    return {
      status: 'ok', minutes: rec.minutes,
      categoryId: rec.category?.id ?? null, categoryLabel: rec.category?.label ?? null,
      isNow: rec.bucket.isNow, headline: rec.headline, reason: rec.reason,
      sample: `${rec.sampleSize} phiên cùng khung giờ`,
      cta: `Bắt đầu ${rec.minutes} phút${rec.category ? ` · ${rec.category.label}` : ''}`,
    };
  }
  const completed = profile?.totals?.completed ?? 0;
  const headline = completed < COACH_MIN_SAMPLE
    ? `Hoàn thành thêm ${Math.max(1, COACH_MIN_SAMPLE - completed)} phiên là ô này có gợi ý riêng cho bạn.`
    : 'Cần thêm vài phiên trong cùng một buổi để có gợi ý riêng cho bạn.';
  return {
    status: 'insufficient', minutes: fallbackMinutes, categoryId: null, categoryLabel: null, isNow: true,
    headline, reason: `Gợi ý được tính từ chính lịch sử của bạn (${completed} phiên đã ghi), không phải một công thức chung.`,
    sample: `${completed} phiên đã ghi`, cta: `Bắt đầu ${fallbackMinutes} phút`,
  };
}

/**
 * Điểm vào duy nhất cho màn Thống kê.
 * @param {Array} history  toàn bộ lịch sử phiên (các hàm tín hiệu tự gác cỡ mẫu)
 * @param {{now?:Date|number, categories?:Array<{id,label}>, fallbackMinutes?:number}} [opts]
 */
export function buildStatsAnswers(history = [], { now = new Date(), categories = [], fallbackMinutes } = {}) {
  const list = Array.isArray(history) ? history : [];
  const cats = Array.isArray(categories) ? categories : [];
  const opts = {
    ...vietnamHistoryTimeOpts(now),
    activeCategoryIds: new Set(cats.map((c) => c.id)),
    categoryLabelOf: (id) => cats.find((c) => c.id === id)?.label ?? null,
  };
  const profile = buildFocusProfile(list, opts);
  return {
    ready: profile.ready,
    totals: profile.totals,
    week: buildWeekComparison(list, { now }),
    best: buildBestWindow(profile),
    next: buildNextAction(profile, list, { ...opts, fallbackMinutes }),
  };
}
