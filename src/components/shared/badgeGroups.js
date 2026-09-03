/**
 * badgeGroups.js — LUẬT chia nhóm huy hiệu CHƯA ĐẠT. File này KHÔNG vẽ gì.
 *
 * ⚠️ VÌ SAO TÁCH (2026-09-02). Tab Huy hiệu đo được **4.915px ở khung 390px** trên fixture đã chơi
 * 6 tháng, và phần lớn chiều dài ấy là những ô có tiến độ ĐÚNG BẰNG 0 — chúng giống hệt nhau, nên
 * một trăm ô như thế không nói được nhiều hơn một ô.
 * ⚠️ KHÔNG GIẤU, CHỈ GẤP LẠI. Luật cũ của màn này (*"ô chưa đạt không bị giấu — một bộ sưu tập chỉ
 * có nghĩa khi thấy được phần còn thiếu"*) vẫn đứng: nút mở nằm ngay đó và ghi rõ CÒN BAO NHIÊU,
 * nên phần thiếu vẫn thấy được ngay cả khi đang gấp. Thứ bị bỏ là việc phải cuộn qua hết nó mỗi
 * lần mở màn hình.
 */

/**
 * Chia danh sách huy hiệu CHƯA ĐẠT làm hai: đang tiến tới (có % > 0) và chưa chạm tới.
 * ⚠️ PHÂN HOẠCH ĐÚNG NGHĨA — mọi mục vào đúng MỘT nhóm, không mục nào rơi mất. Huy hiệu không đo
 * được tiến độ (`tienDo` không có) thuộc nhóm "chưa chạm": nói "đang tiến tới" về một thứ ta không
 * biết đã tiến tới đâu là một lời hứa không kiểm được.
 */
export function splitLockedBadges(entries = []) {
  const dangTien = [];
  const chuaCham = [];
  for (const e of entries) {
    const ti = e?.tienDo?.tiLe;
    if (Number.isFinite(ti) && ti > 0) dangTien.push(e);
    else chuaCham.push(e);
  }
  return { dangTien, chuaCham };
}
