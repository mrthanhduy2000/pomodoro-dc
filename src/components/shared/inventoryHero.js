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
      caption: reNhat > spChuaTieu
        ? `Chưa đủ: ô rẻ nhất cần ${reNhat} SP. Lên cấp để tích thêm.`
        : 'Chưa mở được ô nào — mở nút phía trên trong cùng cột trước.',
      pct: tiLe(spChuaTieu, Math.max(reNhat, spChuaTieu)),
      gap: false,
    };
  }
  return {
    nhan: 'Điểm kỹ năng',
    so: daMo,
    donVi: `/ ${tongKyNang} kỹ năng`,
    caption: 'Hết điểm rồi. Lên cấp để nhận thêm.',
    pct: tiLe(daMo, tongKyNang),
    gap: false,
  };
}


/**
 * Hero của tab CÔNG TRÌNH.
 * ⚠️ Ưu tiên thứ ĐANG XÂY hơn thứ đã xây: nó có tiến độ, tức có "còn bao xa".
 */
export function heroCongTrinh({
  dangXay = null, daXay = 0, tongBanVe = 0, sanSangXay = 0, choNguyenLieu = 0,
} = {}) {
  if (dangXay && Number.isFinite(dangXay.con) && dangXay.con > 0) {
    return {
      nhan: 'Đang xây',
      so: dangXay.con,
      donVi: dangXay.con > 1 ? 'phiên nữa' : 'phiên nữa',
      caption: `${dangXay.ten} sẽ mọc lên trong thành phố.`,
      pct: tiLe((dangXay.tong ?? 0) - dangXay.con, dangXay.tong ?? 0),
      gap: true,
    };
  }
  // ⚠️ `sanSangXay` PHẢI là số bản vẽ KHỞI CÔNG ĐƯỢC NGAY (đủ nguyên liệu + còn ô hàng đợi), không
  // phải số bản vẽ đã nghiên cứu — xem `engine/craftReadiness.js`. Trước 2026-09-02 nó đếm cái sau,
  // nên dải này bật màu nhấn và bảo "chọn một bản vẽ để bắt đầu dựng" trong khi mọi thẻ bên dưới
  // đều ghi "Chưa đủ". Cùng lỗi với `heroKyNang` ở ngay trên: "CÓ" không bằng "LÀM ĐƯỢC".
  if (sanSangXay > 0) {
    return {
      nhan: 'Sẵn sàng xây',
      so: sanSangXay,
      donVi: 'bản vẽ đang chờ',
      caption: 'Chọn một bản vẽ để bắt đầu dựng.',
      pct: 1,
      gap: true,
    };
  }
  if (choNguyenLieu > 0) {
    return {
      nhan: 'Chờ nguyên liệu',
      so: choNguyenLieu,
      donVi: choNguyenLieu > 1 ? 'bản vẽ đã mở' : 'bản vẽ đã mở',
      caption: 'Đã nghiên cứu xong nhưng chưa đủ nguyên liệu để khởi công.',
      pct: tiLe(daXay, tongBanVe),
      gap: false,
    };
  }
  return {
    nhan: 'Công trình',
    so: daXay,
    donVi: `/ ${tongBanVe} bản vẽ`,
    caption: 'Nghiên cứu thêm bản vẽ để mở công trình mới.',
    pct: tiLe(daXay, tongBanVe),
    gap: false,
  };
}

/**
 * Hero của tab HUY HIỆU.
 * ⚠️ Nếu có huy hiệu SẮP đạt thì nó dẫn đầu — đó là thứ duy nhất ở tab này còn "còn bao xa".
 */
export function heroHuyHieu({ daMo = 0, tong = 0, ganDat = null } = {}) {
  if (ganDat && Number.isFinite(ganDat.pct)) {
    return {
      nhan: 'Sắp đạt',
      so: Math.round(ganDat.pct * 100),
      donVi: '%',
      caption: `${ganDat.ten} — gần xong rồi.`,
      pct: ganDat.pct,
      gap: true,
    };
  }
  return {
    nhan: 'Huy hiệu',
    so: daMo,
    donVi: `/ ${tong}`,
    caption: 'Mỗi phiên tập trung lại đẩy vài huy hiệu tiến thêm.',
    pct: tiLe(daMo, tong),
    gap: false,
  };
}
