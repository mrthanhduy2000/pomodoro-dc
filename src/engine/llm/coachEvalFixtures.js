/**
 * coachEvalFixtures.js — BỘ MẪU để CHẤM ĐIỂM lưới chống-bịa (coachEval.test.js).
 *
 * Mục đích: biến "lưới chống-bịa có còn tốt không?" thành con số ĐO ĐƯỢC, chạy ở CI.
 * - CLEAN_CASES: câu Coach SẠCH (chép/diễn đạt lại đúng số). Lưới TUYỆT ĐỐI không được báo nhầm
 *   (báo nhầm = xoá oan câu thật — đây là hướng sai nguy hiểm nhất, từng phải gỡ vài guard vì nó).
 * - FABRICATION_CASES: câu CỐ TÌNH bịa (số lạ, phân số sai, ghép %↔cỡ-mẫu sai). Lưới nên BẮT được.
 * - FOREIGN_CASES: câu có/không chữ nước ngoài, để đo riêng hasForeignScript.
 *
 * Mọi con số trong CLEAN_CASES phải lấy NGUYÊN VĂN từ EVAL_CONTEXT bên dưới; mọi con số trong
 * FABRICATION_CASES phải KHÔNG có trong EVAL_CONTEXT (hoặc ghép sai cặp) thì mới là "bịa" thật.
 */

// Bảng số liệu THẬT làm nền đối chiếu (giống định dạng buildAnalystContext sinh ra).
export const EVAL_CONTEXT = [
  'Tổng quan: 38 phiên hoàn thành, ~24 giờ tập trung. Đạt mục tiêu 79% (trên 38 phiên có đặt mục tiêu). Chuỗi hiện tại: 5 ngày.',
  'Giờ vàng: buổi sáng — đạt mục tiêu 100% (trên 20 phiên có mục tiêu).',
  'Hôm nay: đang đúng nhịp — 3/4 phiên, tới giờ này bạn thường làm ~3 phiên (trên 7 ngày gần đây).',
  'Loại việc dành nhiều thời gian nhất là "Học": 13.3 giờ qua 18 phiên, đạt mục tiêu 100% (trên 18 phiên).',
  'Loại việc "Làm Việc": 6.6 giờ qua 13 phiên, đạt mục tiêu 46% (trên 13 phiên).',
  'Loại việc "Đọc sách": 2.1 giờ qua 4 phiên, đạt mục tiêu 75% (trên 4 phiên).',
  'Độ dài hợp nhất: phiên vừa (26 phút–44 phút).',
  'Phiên sâu: 4/18 phiên là phiên sâu (~22%).',
  'Phiên liền mạch (chạy hết không tạm dừng): 22/30 phiên (73%). Còn lại 8/30 phiên có tạm dừng giữa chừng.',
  'Đều đặn: 13/28 ngày gần đây có hoạt động.',
  'Tỉ lệ đạt mục tiêu của phiên làm sau 22 giờ đêm: 0% (khuya trên 5 phiên có mục tiêu), so với ban ngày 91%.',
  'Xu hướng dài hạn (4 tuần có dữ liệu trong 4 tuần gần đây): đang đi lên, mỗi tuần (từ cũ đến mới): 175 phút → 275 phút → 410 phút → 560 phút.',
  'Ngày năng suất nhất: Thứ Tư — 9 phiên (~21%).',
].join('\n');

// ── CÂU SẠCH — lưới KHÔNG được báo nhầm (chép/diễn đạt lại đúng số) ─────────────────────────
export const CLEAN_CASES = [
  { name: 'tổng quan chép đúng', answer: 'Tới giờ bạn có 38 phiên hoàn thành, khoảng 24 giờ tập trung, đạt mục tiêu 79% trên 38 phiên.' },
  { name: 'giờ vàng đúng cặp', answer: 'Buổi sáng là giờ vàng của bạn, đạt mục tiêu 100% trên 20 phiên có mục tiêu.' },
  { name: 'loại việc Học đúng', answer: 'Học là loại bạn dồn nhiều nhất, 13.3 giờ qua 18 phiên, đạt mục tiêu 100% trên 18 phiên.' },
  { name: 'loại việc Làm Việc đúng', answer: 'Làm Việc đạt mục tiêu 46% trên 13 phiên, thấp hơn Học.' },
  { name: 'Đọc sách đúng', answer: 'Đọc sách mới 2.1 giờ qua 4 phiên, đạt 75% trên 4 phiên.' },
  { name: 'số trần được miễn trừ', answer: 'Mình gói gọn trong 3 nhịp: quan sát số, đặt vào xu hướng, rồi 1 lời khuyên.' },
  { name: 'h == giờ', answer: 'Học chiếm 13.3h trong 18 phiên, nhiều nhất.' },
  { name: 'dấu phẩy thập phân', answer: 'Làm Việc khoảng 6,6 giờ qua 13 phiên.' },
  { name: 'khuya đúng cặp + 91% so sánh', answer: 'Sau 22 giờ đêm bạn đạt 0% trên 5 phiên có mục tiêu, so với ban ngày 91%.' },
  { name: 'phân số phiên sâu đúng', answer: 'Phiên sâu của bạn là 4/18, khoảng 22%.' },
  { name: 'phiên trơn đúng', answer: 'Bạn chạy liền mạch 22/30 phiên, khoảng 73%, còn 8/30 phiên có tạm dừng.' },
  { name: 'chuỗi nhiều tuần đúng', answer: 'Bốn tuần gần đây đi lên: 175 phút → 275 phút → 410 phút → 560 phút.' },
  { name: 'đều đặn phân số đúng', answer: 'Bạn giữ nhịp 13/28 ngày gần đây, chưa thật đều.' },
  { name: 'hôm nay đúng nhịp', answer: 'Hôm nay bạn đúng nhịp, 3/4 phiên, tầm này thường khoảng 3 phiên trên 7 ngày gần đây.' },
  { name: 'ngày năng suất nhất đúng', answer: 'Thứ Tư là ngày năng suất nhất với 9 phiên, khoảng 21%.' },
  { name: 'nói thiếu dữ liệu, không số', answer: 'Về độ đều thì mình chưa đủ dữ liệu chắc chắn để khẳng định.' },
];

// ── CÂU BỊA — lưới NÊN bắt được (số lạ / phân số sai / ghép %↔cỡ-mẫu sai) ──────────────────
export const FABRICATION_CASES = [
  { name: 'phiên bịa', answer: 'Bạn đã làm trên 21 phiên rồi.', why: 'số rời' },
  { name: 'giờ bịa', answer: 'Loại việc đó chiếm 2.3 giờ.', why: 'số rời' },
  { name: 'cụm khung-giờ-% bịa', answer: 'Khung 14 giờ bạn đạt 88% trên 12 phiên.', why: 'nhiều số rời' },
  { name: 'phân số phiên sâu sai', answer: 'Phiên sâu của bạn là 7/18.', why: 'phân số' },
  { name: 'phiên trơn phân số bịa', answer: 'Bạn chạy liền mạch 26/30 phiên.', why: 'phân số 26/30 không có' },
  { name: 'ghép % sai cỡ mẫu (sáng×38)', answer: 'Buổi sáng đạt mục tiêu 100% trên 38 phiên.', why: 'mismatch' },
  { name: 'ghép % sai cỡ mẫu (Học 46×18)', answer: 'Học đạt mục tiêu 46% trên 18 phiên.', why: 'mismatch' },
  { name: 'đơn vị tiếng bịa', answer: 'Bạn còn 99 tiếng nữa để chạm mục tiêu.', why: 'số rời (tiếng=giờ)' },
  { name: 'chuỗi ngày bịa', answer: 'Chuỗi hiện tại của bạn là 8 ngày.', why: 'số rời' },
  { name: 'phút tuần bịa', answer: 'Tuần này bạn làm 600 phút.', why: 'số rời' },
  { name: '% loại việc bịa', answer: 'Đọc sách đạt mục tiêu 50% trên 4 phiên.', why: 'số % rời' },
  { name: 'tổng phiên bịa', answer: 'Bạn có tới 45 phiên hoàn thành.', why: 'số rời' },
  { name: 'độ dài hợp bịa', answer: 'Độ dài hợp nhất của bạn là 52 phút.', why: 'số rời' },
  { name: '% khuya bịa', answer: 'Khuya bạn đạt 30% trên 5 phiên.', why: 'số % rời' },
  { name: 'phân số đều đặn bịa', answer: 'Bạn duy trì 20/28 ngày gần đây.', why: 'phân số' },
  { name: 'giờ vàng khung lạ bịa', answer: 'Giờ vàng buổi chiều đạt 100% trên 15 phiên.', why: 'số rời (15 phiên)' },
];

// ── CHỮ NƯỚC NGOÀI — đo riêng hasForeignScript ────────────────────────────────────────────
export const FOREIGN_CASES = [
  { name: 'thuần Việt', answer: 'Bạn làm 13.3 giờ qua 18 phiên, nhiều nhất.', foreign: false },
  { name: 'có chữ Hán 小时', answer: 'Bạn làm 13.3 小时 trong 18 phiên.', foreign: true },
  { name: 'có chữ 约', answer: '约 13.3 giờ tập trung.', foreign: true },
  { name: 'thuần Việt có dấu', answer: 'Buổi sáng đạt mục tiêu 100% trên 20 phiên, ổn định.', foreign: false },
];
