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
