// ─────────────────────────────────────────────────────────────────────────────
// "ĐIỀU ĐÁNG CHÚ Ý" — ĐƯA NHỮNG PHÂN TÍCH ĐÃ CÓ RA MÀN THỐNG KÊ
//
// ⚠️ VÌ SAO FILE NÀY TỒN TẠI (2026-08-30). `gameMath.js` đã có sẵn ~10 phép phân tích ĐÃ VIẾT,
// ĐÃ TEST, ĐÃ GÁC CỠ MẪU (giờ vàng · ngày mạnh nhất · hay bỏ giữa chừng · phiên khuya kém hơn ·
// cuối tuần vs trong tuần · quay lại sau ngày nghỉ · phiên liền mạch · loại việc bị bỏ bê).
// Nhưng chúng chỉ chảy vào AI Coach — tức phải có mạng, tốn tiền Gemini, và có thể lỗi. Màn
// Thống kê, nơi tự nhiên nhất để đọc chúng, KHÔNG hiện một cái nào; nó chỉ hiện bảng số thô.
//
// ⚠️ FILE NÀY KHÔNG ĐƯỢC CHẾ CÔNG THỨC MỚI. Nó chỉ GỌI hàm đã có rồi diễn đạt lại. Mỗi lần
// muốn thêm một dòng, hãy hỏi "`gameMath.js` đã có phép tính này chưa?" — có thì gọi, chưa có
// thì viết ở `gameMath.js` KÈM TEST rồi mới gọi về đây. Viết một phép tính thứ hai ở đây là
// dựng lại đúng cái bẫy "một luật hai công thức" mà dự án đã bị cắn nhiều lần.
//
// ⚠️ HAI LUẬT NỘI DUNG, cùng luật với AI Coach (xem `coach/guard.js`):
//   (a) MỌI phần trăm phải đi kèm CỠ MẪU. Một con số "79%" không có mẫu số thì không đọc được
//       là mạnh hay là ngẫu nhiên — và các hàm ở `gameMath.js` đã trả sẵn cỡ mẫu, đừng vứt đi.
//   (b) NÓI TƯƠNG QUAN, KHÔNG NÓI NHÂN QUẢ. Không dùng "vì / nên / do". Dữ liệu ở đây không
//       chứng minh được chiều nhân quả, và một câu nghe như kết luận sẽ được tin như kết luận.
// ─────────────────────────────────────────────────────────────────────────────

import {
  getGoldenHourBucket,
  getWeekdayHighlight,
  getAbandonHotspot,
  getLateNightQualityDrop,
  getWeekendVsWeekdayContrast,
  getComebackRate,
  getInterruptionPattern,
  getNeglectedCategory,
  getMultiWeekTrend,
} from './gameMath';
import {
  getVietnamHour,
  getVietnamDayOfWeek,
  vietnamDayNumber,
  localWeekMondayStr,
} from './time';

/** Trần số thẻ hiện ra. Nhiều hơn thì nó thành một bức tường chữ và không ai đọc dòng nào. */
export const MAX_INSIGHTS = 6;

const pct = (v) => Math.round((v ?? 0) * 100);

/** Xếp hạng: việc cần để ý trước, điểm mạnh sau, thông tin nền cuối. */
const TONE_RANK = { warn: 0, good: 1, info: 2 };

/**
 * @param {Array} history  toàn bộ lịch sử phiên (KHÔNG lọc theo kỳ — các hàm tín hiệu đều tự
 *                         gác cỡ mẫu, lọc hẹp lại chỉ làm chúng im lặng vì thiếu mẫu)
 * @param {object} opts
 * @param {Date}   [opts.now]
 * @param {string[]} [opts.activeCategoryIds] id các loại việc còn dùng (cho tín hiệu bỏ bê)
 * @returns {Array<{id,tone,headline,detail,sample}>}
 */
export function buildStatsInsights(history = [], opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const list = Array.isArray(history) ? history : [];
  if (list.length === 0) return [];

  const getEntryHour = (e) => getVietnamHour(e?.timestamp ?? 0);
  const getEntryWeekday = (e) => getVietnamDayOfWeek(e?.timestamp ?? 0);
  const getEntryDayNumber = (e) => vietnamDayNumber(e?.timestamp ?? 0);
  const out = [];

  const golden = getGoldenHourBucket(list, { getEntryHour });
  if (golden) {
    out.push({
      id: 'golden',
      tone: 'good',
      headline: `Giờ vàng của anh là ${golden.bucketLabel}`,
      detail: `Phiên làm vào ${golden.bucketLabel} đi cùng tỉ lệ đạt mục tiêu cao nhất — ${pct(golden.rate)}%.`,
      sample: `${golden.sampleSize} phiên có đặt mục tiêu`,
    });
  }

  const abandon = getAbandonHotspot(list, { getEntryHour });
  if (abandon) {
    out.push({
      id: 'abandon',
      tone: 'warn',
      headline: `Hay bỏ giữa chừng vào ${abandon.bucketLabel}`,
      detail: `${pct(abandon.rate)}% số phiên bắt đầu vào ${abandon.bucketLabel} kết thúc bằng huỷ. Thử đặt phiên ngắn hơn cho khung này.`,
      sample: `${abandon.attempts} lần bắt đầu`,
    });
  }

  const late = getLateNightQualityDrop(list, { getEntryHour });
  if (late) {
    out.push({
      id: 'late-night',
      tone: 'warn',
      headline: `Sau ${late.lateStartHour} giờ, tỉ lệ đạt thấp hơn ban ngày`,
      detail: `Phiên khuya đạt mục tiêu ${pct(late.lateGoalRate)}%, ban ngày ${pct(late.dayGoalRate)}%. Khung muộn hợp với việc nhẹ hơn.`,
      sample: `${late.lateGoalTotal} phiên khuya · ${late.dayGoalTotal} phiên ban ngày`,
    });
  }

  const flow = getInterruptionPattern(list);
  if (flow) {
    const smoothPct = pct(flow.smoothRate);
    out.push({
      id: 'flow',
      tone: smoothPct >= 60 ? 'good' : 'info',
      headline: `${smoothPct}% số phiên chạy liền mạch`,
      detail: `${flow.smooth} phiên chạy hết không tạm dừng, ${flow.interrupted} phiên có tạm dừng giữa chừng.`,
      sample: `${flow.total} phiên có ghi dữ liệu tạm dừng`,
    });
  }

  const weekday = getWeekdayHighlight(list, { getEntryWeekday });
  if (weekday) {
    out.push({
      id: 'weekday',
      tone: 'info',
      headline: `${weekday.label} là ngày anh làm nhiều nhất`,
      detail: `${weekday.label} chiếm khoảng ${pct(weekday.share)}% số phiên.`,
      sample: `${weekday.count} phiên`,
    });
  }

  const weekend = getWeekendVsWeekdayContrast(list, { getEntryWeekday });
  if (weekend) {
    const manh = weekend.stronger === 'weekend' ? 'Cuối tuần' : 'Ngày trong tuần';
    const detail = weekend.basis === 'goal'
      ? `Cuối tuần đạt mục tiêu ${pct(weekend.weekendGoalRate)}%, trong tuần ${pct(weekend.weekdayGoalRate)}%.`
      : `Mỗi phiên cuối tuần trung bình ${weekend.weekendAvgMin} phút, trong tuần ${weekend.weekdayAvgMin} phút.`;
    out.push({
      id: 'weekend',
      tone: 'info',
      headline: `${manh} đang là quãng mạnh hơn`,
      detail,
      sample: `${weekend.weekendN} phiên cuối tuần · ${weekend.weekdayN} phiên trong tuần`,
    });
  }

  const comeback = getComebackRate(list, { nowDayNumber: vietnamDayNumber(now), getEntryDayNumber });
  if (comeback) {
    const rate = pct(comeback.rate);
    out.push({
      id: 'comeback',
      tone: rate >= 50 ? 'good' : 'warn',
      headline: `Quay lại sau ngày nghỉ: ${rate}%`,
      detail: `Sau một ngày trống, anh trở lại làm phiên ngay hôm sau ${comeback.comebacks} trên ${comeback.gaps} lần.`,
      sample: `${comeback.gaps} lần nghỉ trong ${comeback.windowDays} ngày gần đây`,
    });
  }

  if (Array.isArray(opts.activeCategoryIds) && opts.activeCategoryIds.length > 0) {
    // ⚠️ `getNeglectedCategory` gọi `activeCategoryIds.has(...)` — nó chờ một **Set**, không phải
    // mảng. Truyền mảng thì nó ném `TypeError` giữa lúc render và cả màn Thống kê ra trang trắng.
    // Lint không bắt (không có kiểu), build không bắt, và bài test đầu tiên của file này cũng
    // không bắt — vì nó chỉ kiểm nhánh KHÔNG truyền danh sách. Chỉ chạy trên fixture thật mới lộ.
    const neglected = getNeglectedCategory(list, {
      nowDayNumber: vietnamDayNumber(now),
      getEntryDayNumber,
      activeCategoryIds: new Set(opts.activeCategoryIds),
    });
    if (neglected) {
      out.push({
        id: 'neglected',
        tone: 'warn',
        headline: `"${neglected.label}" đã ${neglected.daysSince} ngày chưa đụng tới`,
        detail: `Nhóm này từng chiếm khoảng ${pct(neglected.share)}% thời gian tập trung của anh.`,
        sample: `${neglected.sessions} phiên đã làm`,
      });
    }
  }

  // Xu hướng nhiều tuần cần danh sách "khoá tuần" dựng bằng Date — engine giữ THUẦN nên nhận
  // qua tham số thay vì tự gọi `new Date()` bên trong vòng lặp.
  const weekKeysDesc = Array.from({ length: 4 }, (_, i) => localWeekMondayStr(new Date(now.getTime() - i * 7 * 86400000)));
  const trend = getMultiWeekTrend(list, {
    getEntryWeekKey: (e) => localWeekMondayStr(new Date(e?.timestamp ?? 0)),
    weekKeysDesc,
    minWeeks: 3,
  });
  if (trend && trend.direction !== 'flat') {
    const dir = trend.direction === 'up' ? 'đang đi lên' : 'đang đi xuống';
    out.push({
      id: 'trend',
      tone: trend.direction === 'up' ? 'good' : 'warn',
      headline: `Nhịp nhiều tuần ${dir}`,
      detail: `Tổng phút mỗi tuần, từ cũ tới mới: ${trend.weeklyMinutes.join(' → ')} phút.`,
      sample: `${trend.weeksWithData} tuần có dữ liệu trong ${trend.weeksLookback} tuần gần đây`,
    });
  }

  out.sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone]);
  return out.slice(0, MAX_INSIGHTS);
}
