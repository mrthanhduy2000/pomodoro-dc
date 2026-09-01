/**
 * ĐƠN VỊ CỦA MỘT NGƯỠNG THÀNH TÍCH — để câu "còn 751" thành "còn 751 phút".
 *
 * ⚠️ VÌ SAO LÀ MỘT BẢNG ĐẦY ĐỦ CHỨ KHÔNG PHẢI MỘT MẶC ĐỊNH THÔNG MINH. Cách rẻ hơn là để mặc định
 * "phiên" rồi liệt kê vài ngoại lệ — 52/64 trường đúng là đếm phiên nên nó sẽ đúng 81% ngay hôm
 * nay. Nhưng ngày ai đó thêm một trường mới đếm GIỜ, màn hình sẽ in "còn 12 phiên" cho một mốc
 * tính bằng giờ, **và không có gì đỏ lên** — một câu sai trông y hệt một câu đúng. Bảng đầy đủ
 * cộng một bài test đòi `dem` nào cũng có mặt thì cái sai ấy thành một bài test đỏ, không phải một
 * dòng chữ sai trên máy Đàm.
 *
 * ⚠️ Bảng này KHÔNG chép danh sách trường từ đâu cả — `achievementUnit.test.js` duyệt chính
 * `ACHIEVEMENTS` và đòi mọi `dem` đang dùng phải có ở đây. Thêm mốc mới mà quên đơn vị ⇒ đỏ.
 */
export const DON_VI_NGUONG = {
  // ── đếm phiên ──
  sessionsCompleted: 'phiên',
  earlyBirdCount: 'phiên',
  nightOwlCount: 'phiên',
  deepFocusCount: 'phiên',
  maxSessionsInDay: 'phiên',
  weekendCount: 'phiên',
  sessionsThisYear: 'phiên',
  dawnCount: 'phiên',
  midnightCount: 'phiên',
  lunchCount: 'phiên',
  fullDayCount: 'phiên',
  monCount: 'phiên',
  tueCount: 'phiên',
  wedCount: 'phiên',
  thuCount: 'phiên',
  friCount: 'phiên',
  satCount: 'phiên',
  sunCount: 'phiên',
  fiveAmCount: 'phiên',
  teatimeCount: 'phiên',
  afternoonCount: 'phiên',
  eveningCount: 'phiên',
  janCount: 'phiên',
  febCount: 'phiên',
  marCount: 'phiên',
  aprCount: 'phiên',
  mayCount: 'phiên',
  junCount: 'phiên',
  julCount: 'phiên',
  augCount: 'phiên',
  sepCount: 'phiên',
  octCount: 'phiên',
  novCount: 'phiên',
  decCount: 'phiên',
  q1Sessions: 'phiên',
  q2Sessions: 'phiên',
  q3Sessions: 'phiên',
  q4Sessions: 'phiên',
  ultraFocusCount: 'phiên',
  weekdayCount: 'phiên',
  sunriseCount: 'phiên',
  legendFocusCount: 'phiên',
  bestMonthSessions: 'phiên',
  bestMonthSessionsThisYear: 'phiên',
  // ── đếm phút ──
  totalFocusMinutes: 'phút',
  minutesThisYear: 'phút',
  bestMonthMinutes: 'phút',
  maxSessionMinutes: 'phút',
  // ── đếm ngày ──
  longestStreak: 'ngày',
  daysSinceFirst: 'ngày',
  totalActiveDays: 'ngày',
  // ── còn lại ──
  totalNoteCount: 'ghi chú',
  longNoteCount: 'ghi chú dài',
  totalXP: 'XP',
  blueprintsCount: 'bản vẽ',
  buildingsBuilt: 'công trình',
  relicsCount: 'di vật',
  activeBook: 'kỷ',
  playerLevel: 'cấp',
  maxRankAchieved: 'hạng',
  prestigeCount: 'lần Prestige',
  totalJackpots: 'lần Đại Trúng Thưởng',
  uniqueCategoriesUsed: 'loại việc',
  monthsActiveThisYear: 'tháng',
};

/**
 * "còn 751 phút" — câu ngắn nhất nói được người chơi phải làm gì tiếp.
 * Trả chuỗi rỗng khi không biết đơn vị: một câu CỤT còn hơn một câu SAI.
 */
export function cauConLai(con, dem) {
  const donVi = DON_VI_NGUONG[dem];
  if (!donVi || !Number.isFinite(con) || con <= 0) return '';
  return `còn ${con.toLocaleString('vi-VN')} ${donVi}`;
}
