/**
 * benchCore.mjs — PHẦN THUẦN của bộ đo hiệu năng. Không import three, không đụng DOM, test được
 * bằng `node --test`.
 *
 * Vì sao tách riêng: bộ đo có HAI lối chạy — chạy ngầm trong hộp cát này (SwiftShader, CPU) và chạy
 * trên MacBook thật của Đàm. Nếu mỗi lối tự tính phân vị theo cách của nó thì hai bảng số sẽ không
 * so được với nhau, và dự án đã trả giá đúng một lần cho lỗi hình dạng ấy: `sweep-score.mjs` chép
 * lại công thức hình học của `city-preview.mjs` kèm một mặc định KHÁC, rồi in ra một bộ số bịa hoàn
 * chỉnh và rất thuyết phục (Phase 4G). **Một luật một công thức** — nên mọi phép tính nằm ở đây, cả
 * hai lối đều gọi vào đây.
 *
 * ⚠️ VÌ SAO CÓ `NGƯỠNG_MẪU_P95`: phân vị 95 tính trên N mẫu chỉ có nghĩa khi N đủ lớn. Với N = 20
 * thì P95 rơi đúng vào mẫu chậm nhất, tức "P95" chỉ là một cái tên khác của `max` — một con số
 * nghe như thống kê nhưng thật ra là giá trị đơn lẻ nhiễu nhất trong cả loạt. Bộ đo PHẢI tự nói ra
 * điều đó thay vì im lặng in một con số trông hợp lệ.
 */

/** Số mẫu tối thiểu để P95 còn mang nghĩa thống kê (dưới mức này P95 ≈ max). */
export const NGƯỠNG_MẪU_P95 = 40;

/**
 * Phân vị kiểu "nearest-rank" trên mảng ĐÃ hoặc CHƯA sắp xếp (hàm tự sắp bản sao).
 *
 * ⚠️ Dùng nearest-rank chứ không nội suy tuyến tính, vì frame time là đại lượng rời rạc theo nhịp
 * màn hình (16,7 ms · 8,3 ms…) — nội suy sẽ đẻ ra những giá trị KHÔNG khung hình nào từng đạt, ví
 * dụ "14,2 ms" trên một màn hình 60 Hz. Nearest-rank luôn trả về một giá trị THẬT đã đo được.
 *
 * @param {number[]} xs
 * @param {number} p  0..1
 * @returns {number} NaN nếu mảng rỗng
 */
export function phânVị(xs, p) {
  if (!Array.isArray(xs) || xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  // rank 1..n; p=0 → phần tử đầu, p=1 → phần tử cuối.
  const rank = Math.max(1, Math.ceil(p * s.length));
  return s[Math.min(s.length, rank) - 1];
}

/**
 * Tóm tắt một loạt frame time thành bộ số dùng để so sánh giữa các cảnh và giữa các máy.
 *
 * ⚠️ FPS suy từ **P50**, không phải từ trung bình. Trung bình bị một khung hình cá biệt kéo đi rất
 * xa (một lần biên dịch shader muộn, một lần thu gom rác), mà thứ Đàm CẢM NHẬN được là nhịp thường
 * gặp. Ngược lại `fpsXấu` suy từ **P95** — đó mới là những cú khựng mắt nhìn thấy.
 *
 * @param {number[]} msMẫu  frame time từng khung, đơn vị mili-giây
 */
export function tómTắt(msMẫu) {
  const n = Array.isArray(msMẫu) ? msMẫu.length : 0;
  if (n === 0) {
    return { n: 0, p50: NaN, p95: NaN, min: NaN, max: NaN, fps: NaN, fpsXấu: NaN, p95ĐángTin: false };
  }
  const p50 = phânVị(msMẫu, 0.5);
  const p95 = phânVị(msMẫu, 0.95);
  return {
    n,
    p50,
    p95,
    min: phânVị(msMẫu, 0),
    max: phânVị(msMẫu, 1),
    fps: p50 > 0 ? 1000 / p50 : Infinity,
    fpsXấu: p95 > 0 ? 1000 / p95 : Infinity,
    // Không phải một lời khuyên — là một sự thật về cỡ mẫu, và nó phải đi KÈM con số P95 tới tận
    // bảng kết quả, nếu không người đọc sẽ tưởng P95 luôn đáng tin như P50.
    p95ĐángTin: n >= NGƯỠNG_MẪU_P95,
  };
}

/**
 * Ngân sách khung hình theo nhịp màn hình. 60 Hz ⇒ 16,67 ms cho MỘT khung.
 *
 * ⚠️ Đây KHÔNG phải một ngưỡng do tôi đặt ra — Đàm đã cấm tự đặt threshold mới. Nó là hằng số vật
 * lý của màn hình: quá mức này thì màn hình lỡ nhịp, không phải "tôi cho là chậm".
 */
export const NHỊP_MÀN_HÌNH = { 60: 1000 / 60, 120: 1000 / 120 };

/**
 * Còn bao nhiêu phần trăm ngân sách một khung hình chưa dùng tới.
 *
 * Trả về số DƯƠNG = còn dư địa; ÂM = đã vượt ngân sách, màn hình bắt đầu lỡ nhịp.
 * Ví dụ p50 = 4 ms ở 60 Hz ⇒ 0,76 tức còn dư 76% ngân sách, tức có thể nặng thêm ~4,2 lần.
 */
export function dưĐịa(p50Ms, hz = 60) {
  const ngânSách = NHỊP_MÀN_HÌNH[hz] ?? 1000 / hz;
  if (!(p50Ms > 0)) return NaN;
  return (ngânSách - p50Ms) / ngânSách;
}

/**
 * "Còn nặng thêm được bao nhiêu LẦN trước khi chạm ngân sách khung hình."
 *
 * Đây là con số trả lời thẳng câu hỏi của Đàm — *"còn bao nhiêu headroom trước khi visual quality
 * bắt đầu cần cân nhắc?"* — và nó dễ hiểu hơn phần trăm: 4,2× nghĩa là cảnh có thể tốn gấp bốn lần
 * hiện tại mà vẫn giữ 60 khung/giây.
 *
 * ⚠️ Con số này giả định chi phí TỈ LỆ THUẬN với "độ nặng", điều chỉ đúng gần đúng: thêm tam giác
 * và thêm điểm ảnh phải tô là hai loại chi phí khác nhau, và chúng bão hoà khác nhau. Nó là một
 * ƯỚC LƯỢNG để định hướng, không phải một lời bảo đảm — và phải luôn được đọc kèm bottleneck.
 */
export function hệSốNặngThêm(p50Ms, hz = 60) {
  const ngânSách = NHỊP_MÀN_HÌNH[hz] ?? 1000 / hz;
  if (!(p50Ms > 0)) return NaN;
  return ngânSách / p50Ms;
}

/**
 * Danh sách cảnh nghiệm thu — 4 kỷ × 3 giờ × 2 khung hình = 24 cảnh.
 *
 * ⚠️ `zoom` 1 = ĐÚNG khung camera của app (wide). 0,45 = lại gần để soi chi tiết (close). Con số
 * 0,45 không phải chọn bừa: nó là mức mà một công trình chiếm khoảng nửa chiều cao khung hình, tức
 * đúng cái Đàm nhìn khi chạm vào một công trình để xem nó là ai.
 *
 * Vì sao close shot BẮT BUỘC có mặt: lại gần thì mỗi tam giác phủ NHIỀU điểm ảnh hơn, nên cảnh
 * chuyển từ "nặng vì số tam giác" sang "nặng vì số điểm ảnh phải tô". Chỉ đo wide shot thì sẽ kết
 * luận sai về bottleneck — và kết luận sai về bottleneck chính là thứ dẫn tới tối ưu nhầm chỗ.
 */
export const KỶ_NGHIỆM_THU = [3, 7, 11, 14];
export const GIỜ_NGHIỆM_THU = [12, 15, 22];
export const KHUNG_HÌNH = [
  { tên: 'wide', zoom: 1 },
  { tên: 'close', zoom: 0.45 },
];

export function danhSáchCảnh() {
  const ra = [];
  for (const era of KỶ_NGHIỆM_THU) {
    for (const hour of GIỜ_NGHIỆM_THU) {
      for (const k of KHUNG_HÌNH) {
        ra.push({ era, hour, shot: k.tên, zoom: k.zoom, id: `k${era}-h${hour}-${k.tên}` });
      }
    }
  }
  return ra;
}

/** Nhãn giờ đọc được cho bảng kết quả. */
export function nhãnGiờ(h) {
  if (h === 12) return 'Trưa';
  if (h === 15) return 'Chiều';
  if (h === 22) return 'Đêm';
  return `${h}h`;
}
