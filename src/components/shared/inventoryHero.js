/**
 * inventoryHero.js — LUẬT THUẦN cho dải hero ở đầu mỗi tab Hành trang.
 *
 * ⚠️ VÌ SAO CÓ FILE NÀY (2026-09-02, lệnh Đàm: *"UX/UI và mọi thứ ở hành trang vẫn chưa thấy thay
 * đổi gì. Mọi thứ không có gì mới khác biệt"*). Vòng 24 đã gộp 6 màn xuống 3 và đó là một thay đổi
 * về CẤU TRÚC — nhưng phần NHÌN thì không đổi một chút nào: cả ba tab vẫn là thẻ trắng trên nền
 * trắng, nhãn mono xám, chip nhạt, y hệt mọi màn khác trong app. Đúng như Đàm nói, mở ra chẳng
 * thấy gì mới.
 *
 * Dải hero là câu trả lời: mỗi tab mở đầu bằng MỘT con số to, có màu, kèm ĐÚNG MỘT việc nên làm
 * tiếp. Nó vừa cho Hành trang một bản sắc thị giác riêng, vừa trả lời câu hỏi mà vòng 24 xác định
 * là gốc của mọi vấn đề: *"tôi SẮP có gì, và còn bao xa"* — thay vì *"tôi đang có gì"*.
 *
 * File này CHỈ có luật (thuần, test được bằng `node --test`); phần vẽ nằm ở `InventoryHero.jsx`.
 */

/** Kẹp về 0..1. Vượt mục tiêu thì thanh đầy, KHÔNG vẽ quá một vòng. */
export function tiLe(dat, tong) {
  if (!Number.isFinite(dat) || !Number.isFinite(tong) || tong <= 0) return 0;
  return Math.max(0, Math.min(1, dat / tong));
}

/**
 * Hero của tab KỸ NĂNG.
 * ⚠️ Con số dẫn đầu là ĐIỂM CHƯA TIÊU, không phải số kỹ năng đã mở — vì chỉ điểm chưa tiêu mới
 * HÀNH ĐỘNG ĐƯỢC ngay bây giờ. "Đã mở 4 kỹ năng" là một lời khen về quá khứ; "có 1 điểm chưa
 * tiêu" là một việc đang chờ.
 */
export function heroKyNang({ spChuaTieu = 0, daMo = 0, tongKyNang = 0, moDuoc = 0, reNhat = 0 } = {}) {
  // ⚠️ "CÓ ĐIỂM" KHÔNG BẰNG "MỞ ĐƯỢC" — bản trước bật màu nhấn chỉ vì `spChuaTieu > 0` rồi viết
  // *"mở thêm một kỹ năng ngay bên dưới"*. Đo trên một ván thật: 1 SP trong tay, mà ô rẻ nhất còn
  // mở được giá 3 SP ⇒ dải mở đầu rực lên và bảo người chơi đi làm một việc **không làm được**.
  // Một lời hứa sai còn tệ hơn không hứa gì: nó tiêu mất chính cái màu dùng để nói "có việc làm".
  // Nay `gap` hỏi đúng câu mà bản đồ kỹ năng đang trả lời — `countReady` ở `skillMatrix.js`.
  if (moDuoc > 0) {
    return {
      nhan: 'Điểm kỹ năng',
      so: spChuaTieu,
      donVi: 'điểm chưa tiêu',
      caption: `Mở được ${moDuoc} kỹ năng ngay bây giờ — ô viền đậm trên bản đồ.`,
      pct: 1,
      gap: true,
    };
  }
  if (spChuaTieu > 0) {
    return {
      nhan: 'Điểm kỹ năng',
      so: spChuaTieu,
      donVi: 'điểm chưa tiêu',
      // ⚠️ "LÊN CẤP ĐỂ TÍCH THÊM" ĐÃ LÀ MỘT LỜI KHUYÊN VÔ DỤNG (round 44, ADR-084). Đo được: một
      // cấp là 6.000 XP trên trung vị ~35 XP/phiên, tức ~171 phiên — bảo Đàm "lên cấp" là bảo anh
      // đợi nửa năm. Nay điểm kỹ năng đến từ THÀNH PHỐ (1 điểm mỗi công trình, ~5,6 phiên) nên
      // dòng này chỉ đúng chỗ có thật: xây nốt công trình đang dở.
      caption: reNhat > spChuaTieu
        ? `Chưa đủ: ô rẻ nhất cần ${reNhat} SP. Xây xong một công trình là +1.`
        : 'Chưa mở được ô nào — mở nút phía trên trong cùng cột trước.',
      pct: tiLe(spChuaTieu, Math.max(reNhat, spChuaTieu)),
      gap: false,
    };
  }
  return {
    nhan: 'Điểm kỹ năng',
    so: daMo,
    donVi: `/ ${tongKyNang} kỹ năng`,
    // ⚠️ Cũng đổi vì lý do trên (round 44): "lên cấp" là ~171 phiên, "xây xong một công
    // trình" là ~6. Câu chỉ đường phải chỉ vào con đường THẬT SỰ ngắn hơn.
    caption: 'Hết điểm rồi. Mỗi công trình xây xong trả thêm 1 điểm.',
    pct: tiLe(daMo, tongKyNang),
    gap: false,
  };
}


/**
 * Hero của tab CÔNG TRÌNH — sau ADR-069 (2026-09-06) chỉ còn BA trạng thái, đúng ba câu hỏi:
 *   1. đang xây gì, còn bao xa            → dẫn đầu, có tiến độ
 *   2. hàng chờ trống — chọn được gì       → rực lên, vì đây là việc LÀM ĐƯỢC ngay
 *   3. kỷ này xây tới đâu                  → lặng xuống thành xám
 * ⚠️ KHÔNG còn nhánh "chờ nguyên liệu" / "sẵn sàng xây": bản vẽ nay khởi công được ngay khi có ô
 * trống, không có cổng nào khác để mà "chưa đủ". Cái phễu "CÓ" ≠ "LÀM ĐƯỢC" (2026-09-02) biến mất
 * cùng với cái cổng sinh ra nó.
 */
export function heroCongTrinh({
  dangXay = null, daXay = 0, tongBanVe = 0, chonDuoc = 0, hangChoDay = false,
} = {}) {
  if (dangXay && Number.isFinite(dangXay.con) && dangXay.con > 0) {
    const themCho = chonDuoc > 0 && !hangChoDay ? ' Còn một ô trống — chọn thêm ở dưới.' : '';
    return {
      nhan: 'Đang xây',
      so: dangXay.con,
      donVi: 'phiên nữa',
      caption: `${dangXay.ten} sẽ mọc lên trong thành phố.${themCho}`,
      pct: tiLe((dangXay.tong ?? 0) - dangXay.con, dangXay.tong ?? 0),
      gap: true,
    };
  }
  if (chonDuoc > 0) {
    return {
      nhan: 'Xây tiếp',
      so: chonDuoc,
      donVi: chonDuoc > 1 ? 'công trình chọn được' : 'công trình chọn được',
      caption: 'Chưa chọn thì phiên sau tự đặt gạch cho công trình rẻ phiên nhất — chọn ở dưới để tự quyết.',
      pct: 1,
      gap: true,
    };
  }
  if (tongBanVe > 0 && daXay >= tongBanVe) {
    return {
      nhan: 'Kỷ này',
      so: daXay,
      donVi: `/ ${tongBanVe} công trình`,
      caption: 'Đã xây trọn kỷ ★. Kỷ mới sẽ mở thêm bản vẽ.',
      pct: 1,
      gap: false,
    };
  }
  return {
    nhan: 'Công trình',
    so: daXay,
    donVi: `/ ${tongBanVe} bản vẽ`,
    caption: 'Mỗi phiên tập trung là một nhịp xây.',
    pct: tiLe(daXay, tongBanVe),
    gap: false,
  };
}
