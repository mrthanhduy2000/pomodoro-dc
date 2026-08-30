/**
 * Ba câu mô tả của thẻ "Thưởng trọn ngày" (màn Nhiệm vụ) — TÁCH RA KHỎI JSX ĐỂ ĐO ĐƯỢC.
 *
 * ⚠️ VÌ SAO CHÚNG PHẢI NGẮN, VÀ VÌ SAO ĐIỀU ĐÓ TỪNG HỎNG TRONG IM LẶNG.
 * Ba câu này đi vào `RewardCard.description`, mà ô ấy là **một dòng duy nhất có `truncate`** —
 * dài hơn thì trình duyệt cắt bằng "…" và không báo gì cả. Hợp đồng ấy được ghi rõ trong chú
 * thích của chính `RewardCard` (*"ĐÚNG MỘT DÒNG; dài hơn thì bị cắt bằng …"*) nhưng **không có
 * gì canh nó**, nên cả ba câu bản cũ dài 32–34 ký tự và cả ba đều hiện ra cụt trên iPhone:
 * «Còn 123 XP từ các mục …». Một câu cụt tệ hơn không có câu — nó chiếm đúng bằng ấy chỗ, trông
 * như app hỏng, mà không nói được gì.
 *
 * ⚠️ ĐỪNG NHÉT LẠI VÀO JSX. Một chuỗi viết thẳng trong JSX thì không có cách nào hỏi nó dài bao
 * nhiêu nếu không dựng cả React lên. Ở đây chúng là dữ liệu thuần, nên `dailyBonusCopy.test.js`
 * đo được bằng một phép so độ dài chạy trong `npm test` — đúng luật của dự án: *một bài học được
 * ghi ra KHÔNG chặn được gì; chỉ một bài TEST mới chặn được*.
 *
 * ⚠️ Ca `ready` cố ý nói VIỆC CẦN LÀM chứ không mô tả trạng thái ("Xong hết — bấm Nhận" thay vì
 * "Đã hoàn tất toàn bộ nhiệm vụ ngày"): đúng lúc câu này hiện ra thì có một nút "Nhận" vừa xuất
 * hiện ngay cạnh nó, mà câu cũ không hề nhắc tới nó.
 */
export const DAILY_BONUS_COPY = {
  claimed: 'Đã nhận hôm nay.',
  ready: 'Xong hết — bấm Nhận.',
  /**
   * ⚠️ Nhận `xp` để tự đếm được ca DÀI NHẤT. Bài test bơm một con số 5 chữ số vào đây; nếu chỉ
   * kiểm chuỗi mẫu ở giá trị nhỏ thì cái trần sẽ vỡ đúng vào ngày người chơi có nhiều XP nhất —
   * tức đúng lúc câu này đáng đọc nhất.
   */
  pending: (xp) => `Còn ${Number(xp ?? 0).toLocaleString()} XP chưa lấy.`,
};

/**
 * Trần ký tự cho MỘT dòng `RewardCard.description` ở khung 390px.
 *
 * Không phải một con số chọn tay: đo trên ảnh chụp thật của màn Nhiệm vụ ở 390px, câu bị cắt sau
 * khoảng 22 ký tự (ô mô tả là `min-w-[9rem] flex-1` ở cỡ chữ 11px, nằm cạnh huy hiệu độ hiếm).
 * Lấy 24 để chừa cho khác biệt phông giữa các skin, nhưng KHÔNG lấy rộng hơn — một cái trần nới
 * "cho chắc" thì chính là cái phễu, và nó sẽ im lặng đúng lúc cần kêu nhất.
 */
export const REWARD_DESCRIPTION_MAX_CHARS = 24;
