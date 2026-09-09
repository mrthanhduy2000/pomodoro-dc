/**
 * time.js — Tiện ích múi giờ Việt Nam
 * ─────────────────────────────────────────────────────────────────────────────
 * Tất cả logic phân tích ngày (streak, missions, weekly chart) phải dùng
 * múi giờ Asia/Ho_Chi_Minh (UTC+7) thay vì UTC mặc định của toISOString().
 *
 * Vấn đề gốc: new Date().toISOString() trả về UTC → nếu người chơi ở VN
 * chơi lúc 1:00 sáng (UTC+7 = 18:00 UTC ngày hôm trước), streak bị tính sai.
 *
 * Ghi chú phạm vi:
 * App này phục vụ cá nhân tại Việt Nam, nên việc cố định Asia/Ho_Chi_Minh
 * là chủ ý. Đã kiểm tra các luồng streak, mission, report; đây không phải bug
 * trong phạm vi hiện tại và tạm thời won't fix.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const VN_TZ = 'Asia/Ho_Chi_Minh';
export const VN_UTC_OFFSET_HOURS = 7;
export const VN_UTC_OFFSET_MS = VN_UTC_OFFSET_HOURS * 60 * 60 * 1000;

function toDate(value = new Date()) {
  return value instanceof Date ? value : new Date(value);
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function shiftToVietnam(date) {
  return new Date(toDate(date).getTime() + VN_UTC_OFFSET_MS);
}

function parseLocalDateStr(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

function formatUtcDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getVietnamDateParts(date = new Date()) {
  const shifted = shiftToVietnam(date);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
    millisecond: shifted.getUTCMilliseconds(),
    weekday: shifted.getUTCDay(), // 0=Sun…6=Sat
  };
}

export function vietnamDateTimeToTs({
  year,
  month,
  day,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
}) {
  return Date.UTC(year, month - 1, day, hour - VN_UTC_OFFSET_HOURS, minute, second, millisecond);
}

/**
 * localDateStr
 * Trả về ngày dưới dạng "YYYY-MM-DD" theo múi giờ Việt Nam.
 *
 * @param {Date|number} [date]  - mặc định = now
 * @returns {string}  e.g. "2026-04-09"
 */
export function localDateStr(date = new Date()) {
  const { year, month, day } = getVietnamDateParts(date);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * localWeekMondayStr
 * Trả về ngày thứ Hai của tuần hiện tại theo múi giờ Việt Nam.
 *
 * @param {Date|number} [date] - mặc định = now
 * @returns {string} e.g. "2026-04-20"
 */
export function localWeekMondayStr(date = new Date()) {
  const { year, month, day, weekday } = getVietnamDateParts(date);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const diff = weekday === 0 ? -6 : 1 - weekday;
  utcDate.setUTCDate(utcDate.getUTCDate() + diff);
  return formatUtcDate(utcDate);
}

export function getVietnamDayOfWeek(date = new Date()) {
  return getVietnamDateParts(date).weekday;
}

/**
 * localPrevWeekMondayStr
 * Thứ Hai của TUẦN TRƯỚC (theo giờ VN) — để so sánh tuần này với tuần trước.
 *
 * @param {Date|number} [date] - mặc định = now
 * @returns {string} e.g. "2026-06-08"
 */
export function localPrevWeekMondayStr(date = new Date()) {
  const thisMondayTs = startOfVietnamWeekTs(date);
  return localWeekMondayStr(new Date(thisMondayTs - 24 * 60 * 60 * 1000));
}

/**
 * vietnamDayNumber
 * Số thứ tự ngày (đếm theo nửa đêm giờ VN) — dùng làm "hạt giống" xoay vòng nội
 * dung theo ngày: cùng ngày cho cùng kết quả, sang ngày mới thì đổi.
 *
 * @param {Date|number} [date] - mặc định = now
 * @returns {number}
 */
export function vietnamDayNumber(date = new Date()) {
  return Math.floor(startOfVietnamDayTs(date) / (24 * 60 * 60 * 1000));
}

/**
 * localDateStrDaysAgo
 * Ngày "YYYY-MM-DD" (giờ VN) của N ngày trước — để lập cửa sổ thời gian (ví dụ
 * 28 ngày gần đây) mà không phải gọi Date trực tiếp trong component React.
 *
 * @param {number} n             số ngày lùi về
 * @param {Date|number} [date]   mốc gốc, mặc định = now
 * @returns {string}
 */
export function localDateStrDaysAgo(n, date = new Date()) {
  const days = Math.max(0, Math.floor(Number(n) || 0));
  return localDateStr(startOfVietnamDayTs(date) - days * 24 * 60 * 60 * 1000);
}

export function getVietnamHour(date = new Date()) {
  return getVietnamDateParts(date).hour;
}

export function getVietnamMonthIndex(date = new Date()) {
  return getVietnamDateParts(date).month - 1;
}

export function getVietnamYear(date = new Date()) {
  return getVietnamDateParts(date).year;
}

export function getVietnamDayOfMonth(date = new Date()) {
  return getVietnamDateParts(date).day;
}

export function startOfVietnamDayTs(date = new Date()) {
  const { year, month, day } = getVietnamDateParts(date);
  return vietnamDateTimeToTs({ year, month, day });
}

/**
 * Round 51 (ADR-091): WHICH DAY IT IS, as one whole number — the moon's phase counter.
 *
 * ⚠️ WHY IT LIVES HERE AND NOT AT THE CALL SITE. The 3D scene needs a day index to place the moon
 * in its 29,53-day cycle, and the obvious `Math.floor(Date.now() / 86 400 000)` is wrong twice: it
 * counts UTC days, so it turns over at 07:00 in Hanoi, and it reads the machine clock directly —
 * which `CityScene3D.test.js` forbids for exactly the reason this file exists (a machine on the
 * wrong timezone must not give Đàm a different sky). Counting whole VIETNAM days from the epoch
 * fixes both, and keeps the rule "one place reads the clock" intact.
 */
export function getVietnamDayIndex(date = new Date()) {
  return Math.floor(startOfVietnamDayTs(date) / 86400000);
}

export function startOfVietnamWeekTs(date = new Date()) {
  const { year, month, day } = parseLocalDateStr(localWeekMondayStr(date));
  return vietnamDateTimeToTs({ year, month, day });
}

export function startOfVietnamMonthTs(date = new Date(), monthOffset = 0) {
  const { year, month } = getVietnamDateParts(date);
  const anchor = new Date(Date.UTC(year, month - 1 + monthOffset, 1));
  return vietnamDateTimeToTs({
    year: anchor.getUTCFullYear(),
    month: anchor.getUTCMonth() + 1,
    day: 1,
  });
}

export function startOfVietnamQuarterTs(date = new Date(), quarterOffset = 0) {
  const { year, month } = getVietnamDateParts(date);
  const anchor = new Date(Date.UTC(year, month - 1 + quarterOffset * 3, 1));
  const quarterStartMonth = Math.floor(anchor.getUTCMonth() / 3) * 3 + 1;
  return vietnamDateTimeToTs({
    year: anchor.getUTCFullYear(),
    month: quarterStartMonth,
    day: 1,
  });
}

export function startOfVietnamYearTs(date = new Date(), yearOffset = 0) {
  const { year } = getVietnamDateParts(date);
  return vietnamDateTimeToTs({ year: year + yearOffset, month: 1, day: 1 });
}

export function formatVietnamDate(date, options = {}) {
  return toDate(date).toLocaleDateString('vi-VN', { timeZone: VN_TZ, ...options });
}

export function formatVietnamTime(date, options = {}) {
  return toDate(date).toLocaleTimeString('vi-VN', { timeZone: VN_TZ, ...options });
}

export function formatVietnamDateTime(date, options = {}) {
  return toDate(date).toLocaleString('vi-VN', { timeZone: VN_TZ, ...options });
}

export function formatVietnamOffsetISOString(date = new Date()) {
  const { year, month, day, hour, minute, second, millisecond } = getVietnamDateParts(date);
  return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:${pad2(second)}.${String(millisecond).padStart(3, '0')}+07:00`;
}

/**
 * vietnamHistoryTimeOpts — BỘ GETTER GIỜ VIỆT NAM cho mọi phép phân tích lịch sử phiên
 * (`coachIntel` · `coachContext` · `statsAnswers`). Engine là THUẦN — không gọi Date — nên mọi
 * hàm phân tích nhận giờ/ngày/tuần qua `opts`; đây là nơi DUY NHẤT dựng bộ `opts` ấy.
 *
 * ⚠️ Trước 2026-09-06 khối này được chép tay ở `hooks/useCoachContext.js`; màn Thống kê cần đúng
 * bộ ấy lần thứ hai, và hai bản chép cùng một luật thì sớm muộn cũng lệch nhau (một bên đổi cửa sổ
 * 28 ngày, bên kia không). Nên nó thành một hàm, và cả hai nơi gọi về đây.
 *
 * @param {Date|number} [now]
 */
export function vietnamHistoryTimeOpts(now = new Date()) {
  const entryDate = (e) => new Date(e?.timestamp ?? 0);
  const nowTs = now instanceof Date ? now.getTime() : Number(now);
  return {
    nowHour: getVietnamHour(nowTs),
    getEntryHour: (e) => getVietnamHour(entryDate(e)),
    getEntryWeekday: (e) => getVietnamDayOfWeek(entryDate(e)),
    getEntryWeekKey: (e) => localWeekMondayStr(entryDate(e)),
    nowWeekKey: localWeekMondayStr(nowTs),
    prevWeekKey: localPrevWeekMondayStr(nowTs),
    // 4 key tuần GẦN→XA ([0] = tuần hiện tại) cho xu hướng dài hạn.
    weekKeysDesc: [0, 1, 2, 3].map((i) => localWeekMondayStr(nowTs - i * 7 * 86_400_000)),
    getEntryDayKey: (e) => localDateStr(entryDate(e)),
    todayKey: localDateStr(nowTs),
    minDayKey: localDateStrDaysAgo(28, nowTs),
    getEntryDayNumber: (e) => vietnamDayNumber(entryDate(e)),
    nowDayNumber: vietnamDayNumber(nowTs),
    todayWeekday: getVietnamDayOfWeek(nowTs),
  };
}
