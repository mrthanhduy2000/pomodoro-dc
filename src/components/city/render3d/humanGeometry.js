/**
 * humanGeometry.js — biến mô tả thuần (`engine/city3d/humanShape.js`) thành hình học GPU.
 *
 * ⚠️ FILE NÀY KHÔNG ĐƯỢC BIẾT MỘT CON SỐ HÌNH HỌC NÀO. Mọi toạ độ đến từ `humanShapeMesh`; ở đây
 * chỉ có việc đổ mảng số vào `BufferAttribute`. Đó là cách duy nhất giữ cho "một luật một công
 * thức" còn đúng: nếu file này tự dựng lại một cái bát giác thì bản dựng ấy sẽ trôi khỏi bản gốc,
 * và bài test thuần sẽ chấm một cơ thể khác cơ thể trên màn hình — đúng chuyện đã xảy ra giữa
 * `sweep-score.mjs` và `city-preview.mjs` ở Phase 4G, nơi bản chép lệch một mặc định rồi in ra cả
 * một bộ số bịa rất thuyết phục.
 *
 * ⚠️ MỖI KHUÔN LÀ MỘT `InstancedMesh` RIÊNG, TỨC MỘT LỆNH VẼ RIÊNG — và đó là toàn bộ cái giá của
 * việc cư dân thôi làm chồng gạch. Trước bản này cả cộng đồng đi qua ĐÚNG MỘT hộp đơn vị = 1 lệnh
 * vẽ; nay là 3 tới 6 tuỳ kỷ (kỷ 9 · 13 · 14 dùng 3 khuôn, kỷ 6 dùng 6 vì nó là kỷ duy nhất có nón
 * lá). Cái giá ấy được phép tiêu vì Đàm đã THU HỒI luật "không được thêm một lệnh vẽ nào" ngày
 * 2026-08-21 kèm số đo trên máy thật (*"Máy tôi là M3 MacBook Air chứ có yếu đâu"*, cảnh chậm nhất
 * 5,20 ms trên trần 16,67 ms ⇒ dư 3,2 lần, và 80% chi phí tính theo ĐIỂM ẢNH chứ không theo hình
 * học). Nhưng nó vẫn phải được ĐẾM: `drawCallBudget.test.js` tính đúng con số này bằng
 * `humanShapesUsed(era)` — thuần, không cần Chromium — nên một khuôn thứ bảy lén vào là đỏ ngay.
 */

import { BufferAttribute, BufferGeometry } from 'three';

import { humanShapeMesh } from '../../../engine/city3d/humanShape';

/**
 * Hình học của một khuôn cơ thể, sẵn sàng cho `InstancedMesh`.
 *
 * ⚠️ KHÔNG ĐÁNH CHỈ MỤC — cùng đúng lý do đã ghi ở `geometryFactory.js` và ở chính `humanShape.js`,
 * và từ vòng 54 (ADR-094) lý do ấy đã ĐỔI: không phải để giữ pháp tuyến phẳng nữa, mà để
 * `smoothCrease` có thể cho hai mặt kề hai pháp tuyến KHÁC NHAU tại cùng một điểm — thân trụ tròn
 * lại trong khi cái nắp vẫn sắc cạnh. Một lưới đánh chỉ mục không làm được việc đó.
 * ⚠️ VÀ MẢNG `normal` ĐỔ XUỐNG ĐÂY ĐÃ ĐƯỢC LÀM MỀM TỪ TẦNG THUẦN. File này không được tự tính
 * lại pháp tuyến (`computeVertexNormals()` chẳng hạn): làm thế là ghi đè một luật có góc gãy bằng
 * một phép bình quân vô điều kiện, và mọi bài test thuần sẽ chấm một cơ thể khác cơ thể trên màn hình.
 *
 * Người gọi chịu trách nhiệm `dispose()`; `sceneGraph.js` đưa nó vào `track()` như mọi hình học khác.
 */
export function buildHumanShapeGeometry(name) {
  const mesh = humanShapeMesh(name);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(mesh.positions), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(mesh.normals), 3));
  return geometry;
}
