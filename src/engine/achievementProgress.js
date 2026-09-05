/**
 * TIẾN ĐỘ THÀNH TÍCH — "còn 3 phiên nữa", thay cho một ô xám.
 *
 * ⚠️ VÌ SAO FILE NÀY TỒN TẠI. 360 thành tích, và **không một mục nào** cho biết mình còn cách bao
 * xa. Đo ra: **310/360 (86%)** mục chỉ là một phép so ngưỡng đơn (`s.<trường> >= <số>`), tức con số
 * "còn bao nhiêu nữa" đã nằm sẵn trong dữ liệu từ đầu — chưa ai lấy nó ra. Với người chơi, khác
 * biệt giữa hai câu là khác biệt giữa một bảo tàng và một trò chơi:
 *     "Nhà Sư Học — 365 phiên tập trung"        (không biết mình đang ở đâu)
 *     "Nhà Sư Học — 97%, còn 12 phiên nữa"      (biết, và muốn làm nốt)
 *
 * ⚠️ VÀ ĐÂY LÀ CHỖ SUÝT SAI, GHI LẠI VÌ NÓ CHỈ HỎNG TRÊN BẢN THẬT. Cách hiển nhiên để lấy ngưỡng
 * là đọc mã nguồn của chính hàm `check` (`String(a.check).match(/s\.(\w+)\s*>=\s*(\d+)/)`) — nó
 * CHẠY ĐÚNG khi đo bằng `node`, và nó **hỏng câm trên production**, vì Vite rút gọn tên biến:
 * `s.sessionsCompleted` thành `s.a`. Lúc ấy mọi thành tích sẽ mất tiến độ trên máy Đàm trong khi
 * mọi bài test ở đây vẫn xanh — đúng loại lỗi tệ nhất dự án này từng gặp. **Ngưỡng phải là DỮ
 * LIỆU, không phải thứ suy ra từ hình dạng mã.**
 *
 * ⚠️ MỘT LUẬT MỘT CÔNG THỨC. Không chép ngưỡng ra thành một bảng thứ hai đứng cạnh `check` — hai
 * bản sẽ trôi khỏi nhau và không có gì đỏ lên. Thay vào đó `constants.js` khai `dem` + `moc`, rồi
 * `check` được SINH RA từ chính hai trường ấy (`checkTuNguong` bên dưới). Một nguồn, hai cách đọc.
 */

/**
 * Sinh hàm `check` từ một ngưỡng đã khai. Dùng ở `constants.js` để mục nào có `dem`/`moc` thì
 * không phải viết tay `check` nữa — nhờ vậy ngưỡng chỉ tồn tại ĐÚNG MỘT CHỖ.
 */
export function checkTuNguong(dem, moc) {
  return (s) => (Number(s?.[dem]) || 0) >= moc;
}

/**
 * Tiến độ của MỘT thành tích. Trả `null` khi không tính được (mục có điều kiện phức tạp, hoặc
 * ảnh chụp số liệu chưa có trường ấy) — `null` là câu trả lời thật, đừng thay bằng 0%: một mục
 * "0%" đọc lên như "bạn chưa làm gì", còn sự thật là "chỗ này không đo được".
 */
export function tienDoThanhTich(achievement, snapshot) {
  const dem = achievement?.dem;
  const moc = achievement?.moc;
  if (typeof dem !== 'string' || !Number.isFinite(moc) || moc <= 0) return null;

  const raw = snapshot?.[dem];
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;

  const hienTai = Math.max(0, Math.min(raw, moc));
  return {
    dem,
    hienTai,
    moc,
    con: Math.max(0, moc - hienTai),
    tiLe: hienTai / moc,
  };
}

/**
 * Những thành tích GẦN đạt nhất — thứ duy nhất đáng đặt lên đầu màn.
 *
 * ⚠️ Bỏ những mục đã ở 0% (chưa động tới) VÀ những mục ở 100% (chờ phiên sau chốt): cả hai đều
 * không trả lời được câu "làm nốt cái gì bây giờ". Ngưỡng dưới là một QUYẾT ĐỊNH, không phải một
 * con số tuỳ tiện — dưới 10% thì "còn 900/1000 phiên" đọc lên y hệt "chưa bắt đầu".
 */
export const SAN_GAN_DAT = 0.1;

export function thanhTichGanDat(achievements, snapshot, unlockedIds = [], limit = 3) {
  const daCo = new Set(unlockedIds);
  const ds = [];

  for (const a of achievements ?? []) {
    if (!a?.id || daCo.has(a.id)) continue;
    const td = tienDoThanhTich(a, snapshot);
    if (!td || td.tiLe < SAN_GAN_DAT || td.con <= 0) continue;
    ds.push({ achievement: a, ...td });
  }

  // Gần nhất trước. Hoà thì mục còn ÍT hơn đứng trước — "còn 4 ngày" cụ thể hơn "còn 400 phút".
  ds.sort((x, y) => (y.tiLe - x.tiLe) || (x.con - y.con));
  return ds.slice(0, Math.max(0, limit));
}
