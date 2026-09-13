/**
 * humanStance.js — DÁNG ĐỨNG LỆCH TRỌNG TÂM. Round 58, Việc 8.
 *
 * THUẦN: không three, không DOM, không ngẫu nhiên. Một con số `danhTinh ∈ [0, 1)` vào, một bộ độ
 * lệch ra — **cùng cư dân thì cùng dáng, mãi mãi, trên mọi máy** (luật ADR-007 của vòng 58:
 * *"mọi thứ TẤT ĐỊNH, kể cả dáng đứng lệch của Việc 8: nó phải là hàm của danh tính cư dân"*).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * VÌ SAO NÓ LÀ MỘT ĐỘ LỆCH CỘNG THÊM, KHÔNG PHẢI MỘT TƯ THẾ RIÊNG
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Đàm mô tả Việc 8 bằng năm thứ của một người ĐANG ĐỨNG: chân trụ · hông lệch · vai nghiêng ngược
 * · đầu nghiêng · một tay co. Nhưng cư dân ở đây gần như luôn ĐANG ĐI, nên một "tư thế đứng" riêng
 * sẽ chỉ hiện ra ở những khoảnh khắc hiếm, và ở đúng những khoảnh khắc ấy nó sẽ VẤP vào dáng đi.
 * ⇒ Nên năm thứ ấy được cài thành một **độ lệch KHÔNG ĐỔI cộng lên trên dáng đi**. Nó đọc ra là
 * *"người này mang thân mình theo một kiểu riêng"* — một người hơi nghiêng vai phải, một người hơi
 * ngoẹo đầu — và nó hiện ra ở MỌI khung hình chứ không chỉ lúc dừng.
 *
 * ⚠️ VAI NGHIÊNG **NGƯỢC** CHIỀU HÔNG, VÀ ĐÓ KHÔNG PHẢI MỘT LỰA CHỌN THẨM MỸ. Đứng dồn trọng tâm
 * vào một chân thì đai hông nghiêng về phía chân KHÔNG chịu lực, và cột sống phải bù lại bằng một
 * đường cong ngược để cái đầu còn ở trên trục — nếu vai nghiêng CÙNG chiều hông thì người ấy đang
 * đổ, không phải đang đứng. Đây là chỗ dễ gõ sai nhất cả file, nên `humanStance.test.js` gác đúng
 * cái dấu ấy.
 *
 * ⚠️ BIÊN ĐỘ NHỎ CÓ CHỦ Ý (≤ 0,06 rad ≈ 3,4°). Bài học `hairTop` vòng 52 và `browRidge` vòng 58
 * cùng nói một câu: ở cỡ này một đặc điểm giải phẫu đúng-bậc thì đọc ra là người, còn gấp ba lần
 * lên thì đọc ra là dị dạng. 3,4° là dải contrapposto thật của một người đứng thoải mái.
 */

/** Biên độ tối đa của mỗi trục lệch, radian (trừ `tayCo` cũng là radian). */
export const STANCE_HIP = 0.055;
export const STANCE_SHOULDER = 0.045;
export const STANCE_HEAD = 0.038;
export const STANCE_ELBOW = 0.30;

/**
 * Băm một số thực `[0,1)` thành một số thực `[0,1)` khác, tất định và không tương quan với đầu vào.
 * ⚠️ Cần vì một danh tính phải sinh ra NĂM đại lượng độc lập nhau; dùng thẳng `danhTinh` cho cả
 * năm thì mọi cư dân nghiêng hông nhiều sẽ đồng thời co tay nhiều, và đám đông đọc ra là hai kiểu
 * người chứ không phải nhiều người.
 */
function bam(x, muoi) {
  const v = Math.sin((x + muoi) * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * Dáng lệch của một cư dân.
 *
 * @param {number} danhTinh  số thực `[0,1)` gắn với cư dân ấy, KHÔNG đổi theo thời gian
 * @returns {{ben:number, hong:number, vai:number, dau:number, tayCo:number}}
 *   `ben` là ±1 — bên có CHÂN TRỤ. `hong`/`vai`/`dau` là radian; `vai` luôn ngược dấu `hong`.
 *   `tayCo` là radian gập thêm ở khuỷu bên `ben`.
 */
export function stanceOf(danhTinh) {
  const d = Number.isFinite(danhTinh) ? danhTinh - Math.floor(danhTinh) : 0;
  const ben = bam(d, 0.11) < 0.5 ? -1 : 1;
  // Mỗi trục lấy một hạt muối riêng ⇒ năm đại lượng độc lập, vẫn hoàn toàn tất định.
  const manh = 0.35 + bam(d, 0.37) * 0.65;        // người lệch nhiều, người lệch ít
  const hong = ben * STANCE_HIP * manh;
  return {
    ben,
    hong,
    // ⚠️ DẤU TRỪ LÀ CẢ LUẬT. Xem khối chú thích ở đầu file trước khi đổi.
    vai: -ben * STANCE_SHOULDER * (0.55 + bam(d, 0.59) * 0.45),
    dau: ben * STANCE_HEAD * (bam(d, 0.73) * 2 - 1),
    tayCo: STANCE_ELBOW * bam(d, 0.91),
  };
}
