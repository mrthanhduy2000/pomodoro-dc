/**
 * parcelCapacity.js — MỘT CÂU HỎI DUY NHẤT: *"chia một hình chữ nhật `w × h` bằng những nhát cắt
 * thẳng suốt, mỗi nhát ăn mất một hàng/cột làm đường, mỗi mảnh còn lại phải rộng và sâu ít nhất
 * `minSide` ô — thì NHIỀU NHẤT được bao nhiêu mảnh?"*
 *
 * THUẦN tuyệt đối: không import gì. Tách thành file lá đúng khuôn `hashId.js`/`cityGrid.js` — vì
 * hai bên cần chung một câu trả lời và chúng KHÔNG được import lẫn nhau:
 *   · `networkStyle.js` cần nó để **TỪ CHỐI** một dòng bảng khai số thửa bất khả thi (ADR-030).
 *   · `cityPlan.js` cần nó để **KHÔNG BAO GIỜ** cắt vào một thế cờ hết đường đi.
 * Chép công thức sang hai nơi là "một luật hai công thức" — thứ đã cắn dự án này ở Phase 3Y.
 *
 * ⚠️ TÔI ĐÃ VIẾT NGƯỢC ĐIỀU NÀY Ở BẢN ĐẦU, RỒI ĐO RA LÀ SAI — GHI LẠI VÌ NÓ ĐÁNG GIÁ.
 * Lập luận nghe rất xuôi: công thức lưới `k ≤ (L+1)/(minSide+1)` nhân hai chiều giả định mọi nhát
 * cắt chạy SUỐT cả bản đồ, trong khi BSP cho nhát sau chỉ chạy trong PHẦN của nó (một bên ba dải
 * ngang, bên kia hai dải dọc) ⇒ BSP phải chia được NHIỀU hơn. Đo thử toàn bộ miền đang dùng
 * (`w`, `h` từ 1 tới 20 × `minSide` 1…3, tức 1.200 hình): **hai cách ra đúng cùng một số, không một
 * trường hợp nào lệch.** Công thức lưới không hề nói thấp hơn sự thật.
 * ⇒ Vậy vì sao vẫn giữ bản đệ quy? Hai lý do ĐO ĐƯỢC, không phải lý do thẩm mỹ: **(a)** bộ sinh
 * không hỏi *"cả bản đồ được bao nhiêu"* mà hỏi *"cắt ở đúng vị trí này thì HAI MẢNH CÒN LẠI được
 * bao nhiêu"* — tức nó cần đúng định nghĩa đệ quy, cho từng mảnh, hàng nghìn lần mỗi lượt; **(b)** đẳng
 * thức trên là một điều ĐO ĐƯỢC trên một miền hữu hạn, KHÔNG phải một điều đã chứng minh; dùng bản
 * đệ quy thì bộ sinh vẫn đúng kể cả khi có ngày nào đó ta ra khỏi miền ấy. `parcelCapacity.test.js`
 * khóa chính đẳng thức này ⇒ nó là một sự thật được KIỂM, không phải một câu tự trấn an.
 *
 * ⚠️ VÀ ĐÂY LÀ CHỖ NÓ THẬT SỰ CẮN, KHÔNG PHẢI MỘT PHÉP TÍNH CHO ĐẸP. Kỷ 5 khai 6 thửa (trần thật
 * là 9) mà bộ sinh chỉ dựng ra **4**: những nhát cắt bốc theo hạt giống đẩy dần các mảnh xuống
 * dưới cỡ chia được, rồi kẹt. Bốn thửa thì năm bản vẽ không đủ chỗ mỗi cái một thửa ⇒ hai kỳ quan
 * chung một khu đất ⇒ **vỡ ADR-007**, mà triệu chứng thì im lặng hoàn toàn. Có hàm này thì mỗi
 * nhát cắt kiểm được trước *"cắt thế này xong còn đủ chỗ cho `target` thửa không"*, nên bộ sinh
 * không thể tự dồn mình vào chân tường.
 */

/**
 * Nhớ kết quả theo `minSide|w|h`. An toàn tuyệt đối vì hàm THUẦN và chỉ nhận số nguyên; cần thiết
 * vì bộ sinh hỏi lại hàng nghìn lần mỗi lượt dựng (mỗi nhát cắt × mỗi vị trí hợp lệ).
 */
const CACHE = new Map();

/**
 * Số mảnh NHIỀU NHẤT chia được từ một hình `w × h` ô với cạnh ngắn nhất `minSide`.
 * Trả `0` nếu hình không chứa nổi một mảnh nào.
 */
export function parcelCapacity(w, h, minSide) {
  if (!Number.isInteger(w) || !Number.isInteger(h) || !Number.isInteger(minSide)) return 0;
  if (minSide < 1 || w < minSide || h < minSide) return 0;

  const k = `${minSide}|${w}|${h}`;
  const hit = CACHE.get(k);
  if (hit !== undefined) return hit;

  let best = 1;
  // Cắt DỌC: mảnh trái rộng `a`, một cột làm đường, mảnh phải rộng `w − a − 1`.
  for (let a = minSide; a <= w - minSide - 1; a += 1) {
    const sum = parcelCapacity(a, h, minSide) + parcelCapacity(w - a - 1, h, minSide);
    if (sum > best) best = sum;
  }
  // Cắt NGANG: đối xứng hoàn toàn với trên.
  for (let b = minSide; b <= h - minSide - 1; b += 1) {
    const sum = parcelCapacity(w, b, minSide) + parcelCapacity(w, h - b - 1, minSide);
    if (sum > best) best = sum;
  }

  CACHE.set(k, best);
  return best;
}

/**
 * Hình này còn cắt được nữa không. Suy THẲNG từ `parcelCapacity` chứ không phát biểu lại bằng
 * `w >= minSide*2+1 || h >= ...` — hai cách nói tương đương trên giấy, nhưng phát biểu lại là cách
 * chúng bắt đầu lệch nhau ở biên.
 */
export function canSplitRegion(w, h, minSide) {
  return parcelCapacity(w, h, minSide) >= 2;
}
