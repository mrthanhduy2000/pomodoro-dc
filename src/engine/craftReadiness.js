/**
 * craftReadiness.js — MỘT câu hỏi, MỘT công thức: *"bản vẽ này khởi công được NGAY BÂY GIỜ không?"*
 *
 * ⚠️ VÌ SAO TÁCH RA (2026-09-02). Luật này trước đây nằm INLINE trong `ReadyCard`
 * (`BuildingWorkshop.jsx`), nên dải mở đầu tab Công trình **không thấy nó** và đếm "sẵn sàng xây"
 * bằng một điều kiện LỎNG HƠN HẲN — chỉ "đã nghiên cứu · chưa xây · thuộc kỷ đang chơi". Hậu quả
 * đo được: dải ấy bật màu nhấn và viết *"Chọn một bản vẽ để bắt đầu dựng"* trong khi mọi thẻ bên
 * dưới đều ghi **"Chưa đủ"**. Đúng cùng một lỗi vừa bắt được ở dải Kỹ năng (*"1 SP trong tay, ô rẻ
 * nhất giá 3 SP"*): **"CÓ" không bằng "LÀM ĐƯỢC"**, và một lời hứa sai tiêu mất chính cái màu dùng
 * để nói "có việc làm".
 *
 * ⚠️ HÀNG ĐỢI ĐẦY LÀ MỘT LÝ DO RIÊNG, KHÔNG GỘP VÀO "THIẾU NGUYÊN LIỆU". Hai ca ấy cần hai hành
 * động ngược nhau (đi kiếm tài nguyên · chờ/huỷ một công trình đang xây), nên chúng phải đọc ra
 * khác nhau. Trước đây nút vẫn bấm được khi hàng đợi đầy rồi mới hiện một thông báo lỗi — tức app
 * biết trước câu trả lời mà vẫn để người dùng bấm để nghe "không".
 */

/** Lý do KHÔNG khởi công được — `null` nghĩa là khởi công được. */
export const LY_DO = {
  DANG_XAY: 'DANG_XAY',       // chính bản vẽ này đang trong hàng đợi
  HANG_DOI_DAY: 'HANG_DOI_DAY',
  THIEU: 'THIEU',             // thiếu nguyên liệu thô hoặc tinh luyện
};

export const NHAN_LY_DO = {
  [LY_DO.DANG_XAY]: 'Đang xây',
  [LY_DO.HANG_DOI_DAY]: 'Hàng đợi đầy',
  [LY_DO.THIEU]: 'Chưa đủ',
};

/**
 * @param {object} p
 * @param {object} p.rawCost        {res: số} nguyên liệu thô cần
 * @param {number} p.refinedCost    số tinh luyện cần (0 = không cần)
 * @param {object} p.bookResources  {res: số} đang có ở kỷ ấy
 * @param {number} p.refinedT2      số tinh luyện đang có
 * @param {boolean} p.dangTrongHangDoi  chính bản vẽ này đã nằm trong hàng đợi?
 * @param {boolean} p.conOTrong     hàng đợi còn ô trống?
 * @returns {string|null} một trong `LY_DO`, hoặc `null` nếu khởi công được ngay
 */
export function lyDoKhongKhoiCongDuoc({
  rawCost = {}, refinedCost = 0, bookResources = {}, refinedT2 = 0,
  dangTrongHangDoi = false, conOTrong = true,
} = {}) {
  // ⚠️ THỨ TỰ CÓ NGHĨA: "đang xây" là sự thật về CHÍNH bản vẽ này nên nó thắng; kế đến là hàng đợi
  // (một lý do của cả xưởng, không phải của bản vẽ); cuối cùng mới tới nguyên liệu.
  if (dangTrongHangDoi) return LY_DO.DANG_XAY;
  if (!conOTrong) return LY_DO.HANG_DOI_DAY;
  const duTho = Object.entries(rawCost).every(([res, amt]) => (bookResources[res] ?? 0) >= amt);
  if (!duTho) return LY_DO.THIEU;
  if (refinedCost > 0 && refinedT2 < refinedCost) return LY_DO.THIEU;
  return null;
}

/** Tiện thể: có khởi công được không. */
export function khoiCongDuoc(p) {
  return lyDoKhongKhoiCongDuoc(p) === null;
}

/**
 * Đếm bao nhiêu bản vẽ khởi công được NGAY — con số mà dải mở đầu tab Công trình phải dùng.
 * @param {Array<object>} danhSach mỗi phần tử là một bộ tham số của `lyDoKhongKhoiCongDuoc`
 */
export function demKhoiCongDuoc(danhSach = []) {
  return danhSach.filter((p) => khoiCongDuoc(p)).length;
}
