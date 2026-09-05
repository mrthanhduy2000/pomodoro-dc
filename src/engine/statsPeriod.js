// ─────────────────────────────────────────────────────────────────────────────
// KỲ THỜI GIAN CỦA MÀN THỐNG KÊ — MỘT NGUỒN DUY NHẤT
//
// ⚠️ VÌ SAO FILE NÀY TỒN TẠI (2026-08-30). Trước đó màn Thống kê có BA bộ lọc thời gian
// khai riêng ở ba chỗ trong cùng một file (`PERIODS_UI` ở tab Tổng Quan · `FOCUS_PERIODS`
// ở tab Tập Trung · `CAT_PERIODS` ở tab Phân Loại), khác nhau cả DANH SÁCH lẫn MẶC ĐỊNH:
// Tổng Quan mặc định "tuần", hai tab kia mặc định "tất cả". Bấm từ tab này sang tab kia là
// cửa sổ thời gian ÂM THẦM đổi, không có gì báo — hai con số cách nhau một cú bấm đang nói
// về hai khoảng thời gian khác nhau. Đó đúng cái bẫy "MỘT LUẬT CHỈ ĐƯỢC CÓ MỘT CÔNG THỨC"
// mà `CLAUDE.md` đã ghi, và nó sống sót vì không có chỗ nào phát biểu luật ấy MỘT lần.
//
// ⚠️ VÀ MỘT LỖI NHÃN ĐI KÈM (số đúng, tên sai — họ hàng của lỗi `frame-fit.mjs`): tab Tổng
// Quan tính cửa sổ bằng `now - 7×86400000` rồi DÁN NHÃN "tuần này". Hai thứ đó khác nhau —
// vào thứ Tư thì "tuần này" là T2→T4 (3 ngày) còn "7 ngày gần nhất" là T5 tuần trước→T4.
// Tệ hơn: biểu đồ cột NGAY BÊN DƯỚI lại dựng theo tuần LỊCH (từ thứ Hai), nên ô số tổng và
// bộ cột dưới nó vốn đo hai khoảng khác nhau mà mang cùng một nhãn. Cả file này dùng NGHĨA
// LỊCH ("tuần này" = từ thứ Hai tới giờ) vì đó là thứ người dùng hiểu khi đọc chữ "tuần này",
// và vì hai tab còn lại đã dùng nghĩa ấy sẵn.
// ─────────────────────────────────────────────────────────────────────────────

import {
  startOfVietnamDayTs,
  startOfVietnamWeekTs,
  startOfVietnamMonthTs,
  startOfVietnamQuarterTs,
  startOfVietnamYearTs,
  getVietnamMonthIndex,
  getVietnamYear,
} from './time';

/**
 * Danh sách kỳ CHÍNH THỨC, xếp từ hẹp tới rộng.
 * `unit` là danh từ đếm được để ghép câu ("trong 1 tuần"); `label` là câu ĐẦY ĐỦ dùng trong văn
 * xuôi ("Anh mới có N phiên trong tuần này"); `short` là chữ trên NÚT.
 *
 * ⚠️ VÌ SAO PHẢI TÁCH `short` KHỎI `label` — đây là khuôn "một trường gánh hai việc" mà dự án đã
 * bị cắn bảy lần (`storyHeight` · `roof` · bảng loài cây · `avenue` · vai màu `cloth2` · `eaves` ·
 * hồ sơ hình học). Một nút và một mảnh câu có ĐÒI HỎI NGƯỢC NHAU: câu cần đủ chữ để đọc xuôi
 * ("trong tuần này"), nút cần ngắn để vừa màn hình. Ép một chuỗi làm cả hai thì nút thua, và nó
 * thua trong im lặng: đo ở khung 390px, sáu nút "Hôm Nay/Tuần Này/…" rộng thật **547px** trên
 * **348px** nhìn thấy ⇒ **3 trong 6 kỳ nằm ngoài màn hình**, không mũi tên, không thanh cuộn,
 * nên với người dùng thì chúng KHÔNG TỒN TẠI. Với `short`, cả sáu vừa MỘT hàng.
 * ⚠️ Thêm/bớt một kỳ thì phải sửa Ở ĐÂY, không khai lại ở tầng giao diện.
 */
export const STATS_PERIODS = [
  { key: 'today',   label: 'Hôm Nay',   short: 'Ngày',   unit: 'ngày'  },
  { key: 'week',    label: 'Tuần Này',  short: 'Tuần',   unit: 'tuần'  },
  { key: 'month',   label: 'Tháng Này', short: 'Tháng',  unit: 'tháng' },
  { key: 'quarter', label: 'Quý Này',   short: 'Quý',    unit: 'quý'   },
  { key: 'year',    label: 'Năm Nay',   short: 'Năm',    unit: 'năm'   },
  { key: 'all',     label: 'Tất Cả',    short: 'Tất cả', unit: null    },
];

export const DEFAULT_STATS_PERIOD = 'week';

const PERIOD_BY_KEY = new Map(STATS_PERIODS.map((p) => [p.key, p]));

export function isStatsPeriod(period) {
  return PERIOD_BY_KEY.has(period);
}

export function getPeriodLabel(period) {
  return PERIOD_BY_KEY.get(period)?.label ?? 'Tất Cả';
}

export function getPeriodUnit(period) {
  return PERIOD_BY_KEY.get(period)?.unit ?? null;
}

/**
 * Mốc BẮT ĐẦU của kỳ theo LỊCH (giờ Việt Nam). `null` = không giới hạn ('all').
 * ⚠️ Trả `null` chứ không trả 0: 0 là một mốc thời gian hợp lệ (1/1/1970), nên dùng nó làm
 * "không giới hạn" sẽ khiến mọi phép so `>= startTs` trông như có lọc trong khi không lọc gì.
 */
export function getPeriodStartTs(period, now = new Date()) {
  const at = now instanceof Date ? now : new Date(now);
  if (period === 'today')   return startOfVietnamDayTs(at);
  if (period === 'week')    return startOfVietnamWeekTs(at);
  if (period === 'month')   return startOfVietnamMonthTs(at);
  if (period === 'quarter') return startOfVietnamQuarterTs(at);
  if (period === 'year')    return startOfVietnamYearTs(at);
  return null;
}

/**
 * Kỳ LIỀN TRƯỚC, để so "kỳ này với kỳ trước".
 * Luật chung, không viết riêng cho từng kỳ: kỳ trước là kỳ CHỨA thời điểm ngay trước mốc
 * bắt đầu của kỳ này. Nhờ vậy nó tự đúng cho cả tháng 2, năm nhuận và giao thừa mà không
 * cần một nhánh `if` nào cho từng trường hợp.
 * Trả `null` khi kỳ là 'all' (không có gì trước "tất cả").
 */
export function getPreviousPeriodRange(period, now = new Date()) {
  const startTs = getPeriodStartTs(period, now);
  if (startTs === null) return null;
  const prevStartTs = getPeriodStartTs(period, new Date(startTs - 1));
  return { startTs: prevStartTs, endTs: startTs };
}

const TIMESTAMP_MS_CACHE = new Map();

/** Đọc mốc thời gian của một phiên; có nhớ tạm vì `history` có thể hàng nghìn dòng. */
export function toTimestampMs(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (!value) return NaN;

  const key = String(value);
  const cached = TIMESTAMP_MS_CACHE.get(key);
  if (cached !== undefined) return cached;

  const parsed = new Date(value).getTime();
  if (TIMESTAMP_MS_CACHE.size > 5000) TIMESTAMP_MS_CACHE.clear();
  TIMESTAMP_MS_CACHE.set(key, parsed);
  return parsed;
}

/** Lọc `history` về đúng một kỳ. 'all' trả về CHÍNH mảng vào (không sao chép vô ích). */
export function filterByPeriod(history, period, now = new Date()) {
  const startTs = getPeriodStartTs(period, now);
  if (startTs === null) return history ?? [];

  const out = [];
  for (const entry of history ?? []) {
    const ts = toTimestampMs(entry?.timestamp);
    if (Number.isFinite(ts) && ts >= startTs) out.push(entry);
  }
  return out;
}

/** Lọc theo một khoảng [startTs, endTs) — dùng cho kỳ liền trước. */
export function filterByRange(history, startTs, endTs) {
  const out = [];
  for (const entry of history ?? []) {
    const ts = toTimestampMs(entry?.timestamp);
    if (Number.isFinite(ts) && ts >= startTs && ts < endTs) out.push(entry);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHIA KỲ THÀNH CÁC CỘT CỦA BIỂU ĐỒ
//
// ⚠️ Vì sao nằm ở engine chứ không ở component: đây là phép chia THỜI GIAN thuần, không có
// một điểm ảnh nào trong đó. Trước 2026-08-30 nó nằm trong `StatsDashboard.jsx` dưới dạng ba
// nhánh `if` viết thẳng vào một `useMemo` 60 dòng, nên không bài test nào chạm tới được — và
// đó chính là cách cái lỗi "nhãn tuần này / cửa sổ 7 ngày" sống sót.
//
// Mỗi cột là một khoảng NỬA MỞ [startTs, endTs) để hai cột kề nhau không bao giờ đếm hai lần
// cùng một phiên. `active` đánh dấu cột chứa thời điểm hiện tại (cột "đang diễn ra").
// ─────────────────────────────────────────────────────────────────────────────

const HOUR = 3600000;

/** Số tháng giữa hai mốc (theo lịch Việt Nam) — dùng để chọn độ mịn cho kỳ 'all'. */
function monthSpan(fromTs, toTs) {
  const a = new Date(fromTs);
  const b = new Date(toTs);
  return (getVietnamYear(b) - getVietnamYear(a)) * 12 + (getVietnamMonthIndex(b) - getVietnamMonthIndex(a));
}

/**
 * Dựng danh sách cột cho một kỳ.
 * @param {string} period  khoá kỳ
 * @param {Date}   now     thời điểm hiện tại
 * @param {number} [spanStartTs] mốc phiên sớm nhất — CHỈ dùng cho kỳ 'all'; thiếu thì 'all'
 *                 rơi về 12 tháng gần nhất thay vì trả mảng rỗng.
 * @returns {Array<{label:string,startTs:number,endTs:number,active:boolean}>}
 */
export function buildPeriodBuckets(period, now = new Date(), spanStartTs = null) {
  const at = now instanceof Date ? now : new Date(now);
  const nowTs = at.getTime();
  // ⚠️ Mỗi cột tự khai ĐỘ MỊN (`unit`) của nó. Trước đó tầng giao diện đoán lại bằng
  // `period === 'year' ? 'tháng' : period === 'month' ? 'tuần' : 'ngày'` — một chuỗi `if` viết
  // cho BA kỳ, mà nay có SÁU, nên nó sẽ gọi cột 2-giờ là "ngày" và cột tháng của quý là "ngày".
  // Đây đúng loại lỗi NHÃN vừa phải sửa ở tab Tổng Quan; nguồn của nhãn phải là nơi dựng ra thứ
  // được dán nhãn, không phải nơi hiển thị nó.
  const mark = (list, unit) => list.map((b) => ({ ...b, unit, active: nowTs >= b.startTs && nowTs < b.endTs }));

  if (period === 'today') {
    const dayStart = startOfVietnamDayTs(at);
    // 12 cột × 2 giờ: đủ thấy hình dáng một ngày mà nhãn vẫn đọc được (24 cột thì nhãn chồng nhau).
    return mark(Array.from({ length: 12 }, (_, i) => ({
      label: `${i * 2}h`,
      startTs: dayStart + i * 2 * HOUR,
      endTs: dayStart + (i + 1) * 2 * HOUR,
    })), 'khung 2 giờ');
  }

  if (period === 'week') {
    const weekStart = startOfVietnamWeekTs(at);
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    return mark(labels.map((label, i) => ({
      label,
      startTs: weekStart + i * 86400000,
      endTs: weekStart + (i + 1) * 86400000,
    })), 'ngày');
  }

  if (period === 'month') {
    // Chia tháng thành các đoạn 7 ngày tính từ mùng 1. Đoạn cuối NGẮN HƠN (tháng không chia hết
    // cho 7) và điều đó là ĐÚNG — ép cho đủ 7 ngày sẽ lấn sang tháng sau.
    const monthStart = startOfVietnamMonthTs(at);
    const nextMonth = startOfVietnamMonthTs(at, 1);
    const out = [];
    let cursor = monthStart;
    let i = 0;
    while (cursor < nextMonth) {
      const end = Math.min(cursor + 7 * 86400000, nextMonth);
      const dayFrom = i * 7 + 1;
      const dayTo = Math.round((end - monthStart) / 86400000);
      out.push({ label: `${dayFrom}–${dayTo}`, startTs: cursor, endTs: end });
      cursor = end;
      i += 1;
    }
    return mark(out, 'tuần');
  }

  if (period === 'quarter') {
    const qStart = startOfVietnamQuarterTs(at);
    return mark(Array.from({ length: 3 }, (_, i) => {
      const startTs = startOfVietnamMonthTs(new Date(qStart), i);
      const endTs = startOfVietnamMonthTs(new Date(qStart), i + 1);
      return { label: `Th${getVietnamMonthIndex(new Date(startTs)) + 1}`, startTs, endTs };
    }), 'tháng');
  }

  if (period === 'year') {
    const yStart = startOfVietnamYearTs(at);
    return mark(Array.from({ length: 12 }, (_, i) => {
      const startTs = startOfVietnamMonthTs(new Date(yStart), i);
      const endTs = startOfVietnamMonthTs(new Date(yStart), i + 1);
      return { label: `Th${i + 1}`, startTs, endTs };
    }), 'tháng');
  }

  // 'all' — độ mịn theo bề rộng dữ liệu: dài quá 2 năm thì gom theo NĂM, không thì theo THÁNG.
  const firstTs = Number.isFinite(spanStartTs) ? spanStartTs : startOfVietnamMonthTs(at, -11);
  const months = monthSpan(firstTs, nowTs);

  if (months > 24) {
    const firstYear = getVietnamYear(new Date(firstTs));
    const lastYear = getVietnamYear(at);
    const count = lastYear - firstYear + 1;
    const yearZero = startOfVietnamYearTs(new Date(firstTs));
    return mark(Array.from({ length: count }, (_, i) => ({
      label: String(firstYear + i),
      startTs: startOfVietnamYearTs(new Date(yearZero), i),
      endTs: startOfVietnamYearTs(new Date(yearZero), i + 1),
    })), 'năm');
  }

  const count = Math.max(1, months + 1);
  const monthZero = startOfVietnamMonthTs(new Date(firstTs));
  return mark(Array.from({ length: count }, (_, i) => {
    const startTs = startOfVietnamMonthTs(new Date(monthZero), i);
    const endTs = startOfVietnamMonthTs(new Date(monthZero), i + 1);
    return { label: `Th${getVietnamMonthIndex(new Date(startTs)) + 1}`, startTs, endTs };
  }), 'tháng');
}
