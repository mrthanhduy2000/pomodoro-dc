/**
 * DI VẬT NÀO CÒN LẤY ĐƯỢC, DI VẬT NÀO ĐÃ LỠ.
 *
 * ⚠️ VÌ SAO PHẢI TÁCH RA HAI NHÓM. `detectEraCrisis` (`challengeEngine.js:187`) chỉ nổ đúng lúc
 * `prevEP < triggerEP && newEP >= triggerEP` — tức mỗi khủng hoảng có **ĐÚNG MỘT khoảnh khắc**
 * trong cả đời một ván. Đi qua mốc rồi thì di vật ấy không bao giờ lấy được nữa trong ván này.
 * Đo trên một ván 23.553 EP: **5/12 dòng đang khoá là loại ấy**, mà màn hình vẫn gộp chung dưới
 * một câu mời "chinh phục Khủng Hoảng Kỷ Nguyên để nhận" — một lời hứa sai cho gần một nửa danh
 * sách, và người chơi không có cách nào biết dòng nào còn đáng chờ.
 *
 * ⚠️ "ĐÃ LỠ" LÀ SỰ THẬT VỀ VÁN NÀY, KHÔNG PHẢI MỘT CÁNH CỬA ĐÓNG VĨNH VIỄN — Prestige mở lại
 * toàn bộ. Chữ dùng ở giao diện phải nói đúng điều đó, nếu không nó biến một vòng lặp thành một
 * mất mát.
 */

/** Mốc EP kích hoạt khủng hoảng đã đi qua chưa? */
export function daQuaMoc(totalEP, triggerEP) {
  return Number(totalEP) >= Number(triggerEP);
}

/**
 * Chia danh sách di vật CHƯA có thành hai nhóm + chỉ ra cái sắp tới.
 * `dinhNghia` là `ALL_RELIC_DEFS` (đã sắp theo kỷ tăng dần), `daCo` là tập id đã thu thập.
 */
export function chiaNhomDiVat(dinhNghia = [], daCo = new Set(), totalEP = 0) {
  const khoa = dinhNghia.filter((r) => r?.id && !daCo.has(r.id));
  const conLay = khoa.filter((r) => !daQuaMoc(totalEP, r.triggerEP));
  const daLo = khoa.filter((r) => daQuaMoc(totalEP, r.triggerEP));
  return {
    conLay,
    daLo,
    // Danh sách đã sắp theo kỷ tăng dần ⇒ phần tử đầu của `conLay` là mốc gần nhất phía trước.
    sapToi: conLay[0] ?? null,
    // ⚠️ KHÔNG kẹp sàn 0 ở đây. `conLay` chỉ chứa mốc CHƯA qua (`totalEP < triggerEP`), nên hiệu
    // này không thể âm THEO CẤU TẠO. Một `Math.max(0, …)` ở đây trông y hệt một cái gác nhưng
    // không bao giờ nổ được — phép thử ngược đã chứng minh: bỏ nó đi thì 0/6 bài đỏ. Mã chết đội
    // lốt lưới an toàn còn tệ hơn không có gì, vì nó khiến người đọc sau tưởng đã có ai canh.
    conBaoNhieuEP: conLay[0] ? conLay[0].triggerEP - totalEP : null,
  };
}
