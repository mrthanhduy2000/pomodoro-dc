/**
 * cityGrid.js — HỢP ĐỒNG VỀ MẢNH ĐẤT: lưới rộng bao nhiêu, ô nào là đường, ô nào đã hứa cho kỳ quan.
 *
 * THUẦN tuyệt đối: không import gì, không phụ thuộc gì. Đó là điểm quan trọng nhất của file.
 *
 * ⚠️ VÌ SAO NÓ ĐƯỢC TÁCH RA (2026-08-15, Phase 7C) — cùng một lý do đã tách `hashId.js`, và cùng
 * một cái bẫy suýt tái diễn ngay trong phase này.
 * Ba sự thật dưới đây vốn nằm trong `cityLayout.js`. Phase 7C dựng nhà dân, mà muốn biết đặt nhà ở
 * đâu thì phải biết CẢ BA: lưới rộng 12 ô, năm khu đất này để dành cho kỳ quan, các hàng/cột kia là
 * đường không được xây đè. Nhưng `city3d/dwellings.js` không thể `import` từ `cityLayout.js` được,
 * vì chính `cityLayout.js` phải gọi ngược `deriveDwellings` — tức một VÒNG TRÒN import.
 *
 * Bản đầu tôi né bằng cách CHÉP ba con số ấy sang `dwellings.js`, kèm một đoạn chú thích tự trấn an
 * rằng "đây là đánh đổi có chủ đích, đã khoá bằng test đối chiếu". Lý lẽ ấy sai ở hai điểm: (a) nó
 * mâu thuẫn với chính đoạn chú thích tôi vừa viết trong `hashId.js` cùng phase này — nơi nói rõ
 * tách file lá là "chặn TẬN GỐC chứ không phải né"; (b) một bài test đối chiếu chỉ báo được rằng
 * hai bản đã lệch nhau, nó KHÔNG ngăn được việc lệch, và người sửa `cityLayout.js` sáu tháng nữa
 * không có lý do gì để đoán rằng có một bản sao nằm ở thư mục khác.
 *
 * Hậu quả nếu lệch thì im lặng và khó chịu đúng kiểu dự án này hay gặp: nhà dân mọc đè lên ô đã
 * hứa cho kỳ quan, hoặc mọc giữa lòng đường. Không có gì đỏ lên — bố cục vẫn hợp lệ, chỉ là sai.
 *
 * ⚠️ `cityLayout.js` vẫn `export { CITY_GRID_SIZE }` để mọi lời import cũ chạy nguyên như trước —
 * đó là TÁI XUẤT, không phải bản sao.
 */

/** Lưới 12×12 = 144 ô. */
export const CITY_GRID_SIZE = 12;

/**
 * Khu đất riêng cho từng thứ hạng bản vẽ trong kỷ. Các ô vuông này KHÔNG giao nhau — đó chính là
 * thứ bảo đảm "bảo tàng bất động" (ADR-007). Hạng 4 (luôn là công trình `epic` của kỷ) đứng giữa.
 *
 * ⚠️ NHÀ DÂN TUYỆT ĐỐI KHÔNG ĐƯỢC LẤN VÀO ĐÂY, kể cả khi kỷ ấy chưa xây công trình nào ở góc đó.
 * Ô trống trong một khu kỳ quan không phải đất thừa — nó là chỗ đã hứa cho một công trình Đàm chưa
 * đổi đủ phiên để có. Cho nhà dân mọc vào rồi lại phải dời đi khi công trình xuất hiện là phá đúng
 * lời hứa "công trình không bao giờ đổi chỗ".
 */
export const BUILDING_ZONES = [
  { x: 1, y: 1, w: 3, h: 3 },   // hạng 0 — góc trên-trái
  { x: 8, y: 1, w: 3, h: 3 },   // hạng 1 — góc trên-phải
  { x: 1, y: 8, w: 3, h: 3 },   // hạng 2 — góc dưới-trái
  { x: 8, y: 8, w: 3, h: 3 },   // hạng 3 — góc dưới-phải
  { x: 5, y: 5, w: 3, h: 3 },   // hạng 4 — trung tâm (kỳ quan)
];

/** Trục đại lộ (chính) và trục phố (phụ) — xem chú thích mạng đường ở `cityLayout.js`. */
export const ROAD_MAIN_AXIS = 4;
export const ROAD_CROSS_AXIS = 8;

/** Hai cạnh vành đai chạy quanh rìa lưới. */
export const RING_LOW = 0;
export const RING_HIGH = CITY_GRID_SIZE - 1;

/**
 * Mọi hàng/cột có đường chạy qua, gộp một chỗ.
 *
 * ⚠️ SUY RA TỪ BỐN HẰNG SỐ TRÊN, không viết cứng `[0, 4, 8, 11]`. Viết cứng thì đổi
 * `ROAD_CROSS_AXIS` sẽ làm nhà dân mọc giữa lòng phố mới mà không có gì báo — đúng cái bẫy
 * "một luật hai công thức" mà file này sinh ra để dập.
 */
export const ROAD_LINES = new Set([RING_LOW, ROAD_MAIN_AXIS, ROAD_CROSS_AXIS, RING_HIGH]);

/** Ô này có nằm trên một hàng/cột đường nào không. */
export function isRoadLine(x, y) {
  return ROAD_LINES.has(x) || ROAD_LINES.has(y);
}

/** Ô này có nằm trong một khu đất đã hứa cho kỳ quan không. */
export function isBuildingZone(x, y) {
  return BUILDING_ZONES.some((z) => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h);
}
