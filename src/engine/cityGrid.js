/**
 * cityGrid.js — HỢP ĐỒNG VỀ MẢNH ĐẤT, nay chỉ còn ĐÚNG MỘT CÂU: mảnh đất rộng bao nhiêu ô.
 *
 * THUẦN tuyệt đối: không import gì, không phụ thuộc gì. Đó là điểm quan trọng nhất của file.
 *
 * ── VÌ SAO NÓ TỪNG LỚN HƠN THẾ NÀY RẤT NHIỀU, VÀ VÌ SAO NAY KHÔNG (2026-08-24, Phase 20) ────────
 * File này từng khai thêm bốn thứ: `BUILDING_ZONES` (5 khu 3×3 ở bốn góc + tâm), `ROAD_MAIN_AXIS`,
 * `ROAD_CROSS_AXIS`, `RING_LOW`/`RING_HIGH` — cộng lại thành `ROAD_LINES = {0, 4, 8, 11}`.
 * Đàm nhìn bản quét 15 kỷ rồi nói: *"nhà vẫn quy hoạch rất kỳ quặc, rất bài bản và xếp chồng lên
 * nhau"* · *"cho tôi một sự sắp xếp thành phố ngẫu nhiên và mang tính đặc thù, không phải cứ 3x3"*.
 *
 * Chẩn đoán ra rất gọn, và nó nằm gọn trong file này: **bốn hằng số ấy KHÔNG PHỤ THUỘC KỶ**, nên cả
 * 15 kỷ dùng chung một bộ xương đối xứng bốn chiều hoàn hảo. Mọi phase trước đều sửa thứ nằm TRONG
 * một ô (mái, tầng trệt, mặt đường, cụm nhà) nên bộ xương không hề đổi — mà bộ xương mới là thứ mắt
 * đọc ra ĐẦU TIÊN khi nhìn thành phố từ trên cao.
 *
 * ⇒ Bộ xương nay được SINH RA THEO KỶ ở `city3d/cityPlan.js` (lớp HÌNH), khai ở
 * `city3d/networkStyle.js` (lớp BẢNG). Xem ADR-066.
 *
 * ⚠️ VÀ VÌ SAO `CITY_GRID_SIZE` PHẢI Ở LẠI ĐÂY, KHÔNG DỌN LUÔN SANG `cityPlan.js`: `cityPlan.js`
 * cần biết lưới rộng bao nhiêu, mà `cityLayout.js`/`dwellings.js` lại cần biết cả hai. Để con số ở
 * một file lá không import gì thì mọi bên đọc chung MỘT nguồn và không có vòng tròn import nào.
 * Đây đúng khuôn đã dùng cho `hashId.js` — và đúng lý do file này ra đời hồi Phase 7C.
 *
 * ⚠️ `cityLayout.js` vẫn `export { CITY_GRID_SIZE }` để mọi lời import cũ chạy nguyên như trước —
 * đó là TÁI XUẤT, không phải bản sao.
 */

/** Lưới 12×12 = 144 ô. */
export const CITY_GRID_SIZE = 12;
