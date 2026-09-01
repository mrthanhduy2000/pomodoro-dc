/**
 * sourceScan.js — dọn chú thích khỏi mã nguồn TRƯỚC khi một bài test đọc-mã-nguồn phán xét nó.
 *
 * VÌ SAO CẦN (2026-09-01): dự án có nhiều bài test canh "chỗ này phải/không được gọi hàm X",
 * và chúng đọc thẳng file `.jsx`. Nhưng những file ấy cũng KỂ LỊCH SỬ trong chú thích — nhắc
 * đúng cái tên đang bị cấm, để phiên sau hiểu vì sao. Nếu bài test không tách chú thích ra thì
 * nó bắt oan chính lời giải thích của bản vá. Đã xảy ra thật.
 *
 * ⚠️ LỌC THEO ĐẦU DÒNG (dấu gạch đôi, dấu sao) LÀ KHÔNG ĐỦ: một khối chú thích nhiều dòng trong
 * JSX có những dòng giữa bắt đầu bằng chữ thường, bằng dấu nháy ngược, bằng bất cứ gì. Phải bỏ
 * nguyên KHỐI, không bỏ theo dòng.
 *
 * ⚠️ Và một bài học nhỏ đã trả giá ngay khi viết chính file này: viết dấu đóng-khối-chú-thích
 * NGUYÊN VĂN bên trong một khối chú thích thì nó ĐÓNG KHỐI GIỮA CHỪNG, và Node báo lỗi ở một
 * dòng chẳng liên quan. Cùng họ với cái bẫy dấu nháy ngược trong `city-preview.mjs` — mô tả một
 * cú pháp thì mô tả bằng LỜI, đừng dán ký tự thật vào.
 *
 * ⚠️ Đây KHÔNG phải một bộ phân tích cú pháp JS. Nó không hiểu chuỗi có chứa dấu mở chú thích,
 * và nó không cần hiểu — nó chỉ phục vụ các bài test đọc mã, nơi ăn thừa vài ký tự thì cùng lắm
 * là bỏ sót, chứ không tạo ra một lời buộc tội sai.
 */
const KHOI = /\/\*[\s\S]*?\*\//g;
const DONG = /(^|[^:\\])\/\/[^\n]*/g;

export function stripComments(source) {
  return String(source ?? '')
    .replace(KHOI, ' ')   // khối nhiều dòng, gồm cả biến thể bọc trong ngoặc nhọn của JSX
    .replace(DONG, '$1'); // chú thích một dòng — chừa lại phần "https:" của một đường dẫn
}
