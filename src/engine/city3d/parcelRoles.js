/**
 * parcelRoles.js — MỘT CÂU HỎI DUY NHẤT: *"khai `parcels` thửa thì bao nhiêu thửa thành khu kỳ
 * quan, bao nhiêu thành quảng trường, và còn lại bao nhiêu thửa ĐẤT Ở?"*
 *
 * THUẦN tuyệt đối: không import gì. Tách thành file lá đúng khuôn `parcelCapacity.js` — vì hai
 * bên cần chung một câu trả lời và chúng KHÔNG được import lẫn nhau:
 *   · `cityPlan.js` cần nó để CHIA vai cho từng thửa sau khi xếp hạng.
 *   · `networkStyle.js` cần nó để **TỪ CHỐI** một dòng bảng khai ít thửa tới mức không còn thửa
 *     đất ở nào.
 * Chép công thức sang hai nơi là "một luật hai công thức" — thứ đã cắn dự án này ở Phase 3Y.
 *
 * ⚠️ **VÌ SAO FILE NÀY TỒN TẠI — MỘT KHUYẾT TẬT IM LẶNG SUỐT TỪ PHASE 20 (Phase 21 §5).**
 * `parcels` đọc lên như *"thành phố này chia làm mấy mảnh đất"*, nhưng **5 mảnh đầu LUÔN bị 5 bản
 * vẽ kỳ quan lấy** và 1–2 mảnh nữa thành quảng trường. Nghĩa là một kỷ khai `parcels: 6` có
 * **ĐÚNG 0 thửa đất ở**: cả khu dân cư là một mảnh chưa hề được chia. Sáu trong mười lăm kỷ ở
 * đúng trạng thái ấy (1 · 5 · 7 · 9 · 12 và gần thế là 2 · 6), và đó chính là cái vẻ *"nhà vẫn
 * xếp rất ngăn nếp trông như quy hoạch"* mà Đàm bác — không phải vì thuật toán chia sai, mà vì ở
 * những kỷ ấy **nó chưa từng được gọi tới cho phần đất ở**.
 * Nguy hiểm gấp đôi ở chỗ phép đo cũng bị lừa: đo *"tỉ số thửa lớn nhất / nhỏ nhất"* trên CẢ bảng
 * thì ở những kỷ ấy ta đang đo tỉ số giữa các **khu kỳ quan**, và nó ra những con số to đẹp
 * (kỷ 1 ra 6,00 — cao nhất bảng) cho một thành phố **không có thửa đất ở nào**. Cùng hình dạng
 * với `TECH_DEBT #22`: mẫu số lẫn thứ không thuộc câu hỏi.
 */

/** Số thửa mà 5 bản vẽ của một kỷ luôn lấy. Hạng 4 luôn là `wonder` ở cả 15/15 kỷ. */
export const WONDER_PARCELS = 5;

/**
 * Ít nhất bao nhiêu thửa ĐẤT Ở thì câu hỏi *"thửa lớn nhất so với thửa nhỏ nhất"* mới có nghĩa.
 * Hai — vì một thửa thì không có gì để so, và không so được thì không có cách nào biết một kỷ
 * đang chia đất đa dạng hay đang để nguyên một mảng đặc.
 */
export const MIN_DWELLING_PARCELS = 2;

/**
 * Vai của `parcels` thửa: `{ wonder, plaza, dwelling }`. Trả toàn 0 nếu đầu vào không phải số
 * nguyên dương.
 */
export function parcelRoles(parcels) {
  if (!Number.isInteger(parcels) || parcels <= 0) return { wonder: 0, plaza: 0, dwelling: 0 };
  const wonder = Math.min(WONDER_PARCELS, parcels);
  const spare = parcels - wonder;
  // Thửa để trống (quảng trường / bãi chợ): một cái khi có chỗ, hai khi đất còn rộng rãi.
  const plaza = spare === 0 ? 0 : Math.min(spare, spare >= 5 ? 2 : 1);
  return { wonder, plaza, dwelling: spare - plaza };
}
