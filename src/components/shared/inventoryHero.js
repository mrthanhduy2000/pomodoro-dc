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
export function heroKyNang({ spChuaTieu = 0, daMo = 0, tongKyNang = 0 } = {}) {
  const coViec = spChuaTieu > 0;
  return {
    nhan: 'Điểm kỹ năng',
    so: coViec ? spChuaTieu : daMo,
    donVi: coViec ? (spChuaTieu > 1 ? 'điểm chưa tiêu' : 'điểm chưa tiêu') : `/ ${tongKyNang} kỹ năng`,
    caption: coViec
      ? 'Có điểm đang để không — mở thêm một kỹ năng ngay bên dưới.'
      : 'Hết điểm rồi. Lên cấp để nhận thêm.',
    pct: coViec ? 1 : tiLe(daMo, tongKyNang),
    gap: coViec,
  };
}

/**
 * Hero của tab CÔNG TRÌNH.
 * ⚠️ Ưu tiên thứ ĐANG XÂY hơn thứ đã xây: nó có tiến độ, tức có "còn bao xa".
 */
export function heroCongTrinh({ dangXay = null, daXay = 0, tongBanVe = 0, sanSangXay = 0 } = {}) {
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
