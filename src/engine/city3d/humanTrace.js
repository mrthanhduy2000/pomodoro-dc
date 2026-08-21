/**
 * humanTrace.js — CỔNG (G1): CÓ BAO NHIÊU **DẤU VẾT CON NGƯỜI** NẰM NGOÀI LƯỚI THÀNH PHỐ?
 *
 * ⚠️ VÌ SAO PHÉP ĐO NÀY TỒN TẠI, VÀ VÌ SAO NÓ KHÔNG ĐƯỢC ĐẾM "THỨ TÔI VỪA XÂY".
 *
 * Đàm nói thành phố *"nhỏ"*. Vành ngoài lưới đã được lấp một lần rồi (VIỆC 1, `outskirts.js`: cây,
 * bụi, đá) và tỉ lệ đất trống tụt rất mạnh — **và Đàm vẫn nói nhỏ**. Đó là dữ liệu, không phải cảm
 * tính: **thảm thực vật không mang tín hiệu quy mô**. Một rừng cây vô tận làm đô thị trông CÔ LẬP
 * hơn, không lớn hơn. Thứ khiến mắt đọc ra *"đây là một nơi LỚN, còn tiếp tục ở ngoài kia"* là dấu
 * vết của **con người** trải ra xa: ruộng có bờ, kênh tưới, tường thành, con đường đi khỏi khung
 * hình, xóm vệ tinh, bến thuyền, ống khói.
 *
 * ⇒ Nên phép đo hỏi theo **VỊ TRÍ và BẢN CHẤT**, không theo cái nhãn của thứ vừa được thêm vào:
 * *"vật này do con người làm ra không?"* × *"nó có đứng ngoài lưới 12×12 không?"*. Nếu nó hỏi
 * `kind === 'hinterland'` thì nó đang đếm chính đầu ra của mình — một phép đo vòng tròn, luôn đúng,
 * tức vô giá trị. Cách hỏi hiện tại có một hệ quả đắt giá: **một công trình bình thường đặt ra
 * ngoài lưới cũng phải được đếm**, và đó chính là thứ ĐỐI CHỨNG TIÊM dựa vào.
 *
 * ⚠️ MỐC NỀN BẰNG 0 THEO CẤU TẠO — NÊN NÓ BẮT BUỘC PHẢI CÓ ĐỐI CHỨNG TIÊM.
 * Trước Phase 13, câu trả lời là **0/446 vật**. Một con số 0 không phân biệt được *"chưa xây gì
 * ngoài kia"* với *"phép đo mù với mọi thứ ngoài kia"* — và vế thứ hai đã xảy ra trong dự án này
 * ít nhất bốn lần (phép tia mù với cây cối · `/envMap,/` xanh oan · `tuongQuanHang(MAT, MAT)` ·
 * bộ lọc "8% điểm ảnh tươi nhất ≈ mái" chấm nhầm cỏ suốt ba phase). Vì vậy `humanTrace.test.js`
 * **tiêm một khối nhân tạo ở toạ độ đã biết** rồi đòi phép đo trả về đúng diện tích dự đoán trong
 * dung sai đã nêu TRƯỚC. Đối chứng ấy chạy trong `npm test`, không phải một `--selftest` không ai
 * chạy.
 *
 * ⚠️ RANH GIỚI: file này đo trên **mô tả thuần** (`collectCitySpecs`), tức nó trả lời *"trong thế
 * giới có bao nhiêu vật do người làm ở ngoài lưới, chúng phủ bao nhiêu đất"*. Nó KHÔNG trả lời
 * *"Đàm nhìn màn hình thì thấy bao nhiêu"* — câu ấy do `mask-count.mjs` đếm điểm ảnh trả lời, và
 * hai đơn vị này **đã có tiền lệ lệch nhau**, nên (G1) đòi cả hai chứ không chọn một.
 */

import { BUILDING_SCALE } from './parts.js';
import { distanceOutsideGrid } from './setting.js';
import { daysGiacDayDaDat, dienTichHop } from './footprint.js';

/**
 * Những loại cảnh vật KHÔNG phải do con người làm ra.
 *
 * ⚠️ ĐÂY LÀ RANH GIỚI QUAN TRỌNG NHẤT CỦA CẢ PHÉP ĐO, và nó là một quyết định của Đàm chứ không
 * phải một phép phân loại kỹ thuật: *"Cây thuộc nhóm cảnh vật, không tính vào dấu vết con người."*
 * Không có ranh giới này thì cách rẻ nhất để (G1) xanh là **nâng mật độ cây** — tức đúng cái đã
 * làm một lần và đã thất bại.
 *
 * `water` ở đây là VŨNG NƯỚC tự nhiên trong ô lưới (`propSpec`), không phải kênh đào.
 */
export const KIND_TU_NHIEN = new Set(['tree', 'bush', 'rock', 'water']);

/**
 * Những `kind` cấp-mục mà MỌI phần tử của nó đều là dấu vết con người, bất kể `source.kind`.
 * `outskirt` cố tình KHÔNG có ở đây: vùng quê hoang là cây/bụi/đá, xem trên.
 */
const MUC_NHAN_TAO = new Set(['building', 'scaffold', 'dwelling', 'hinterland']);

/**
 * Vật này có phải dấu vết con người không?
 *
 * @param {{kind:string, source?:{kind?:string}}} item  một phần tử của `collectCitySpecs`
 */
export function laDauVetNguoi(item) {
  if (!item || typeof item.kind !== 'string') return false;
  if (MUC_NHAN_TAO.has(item.kind)) return true;
  // `prop` trộn hai họ: cây/bụi/đá/vũng nước là tự nhiên, còn sân · vườn rào · sân phơi · bãi quây
  // · đống rơm · giếng · quảng trường · ruộng · đèn đều là do người làm. `outskirt` thì luôn là
  // họ tự nhiên (`deriveOutskirts` chỉ sinh ba loại ấy) nên nó đã bị `MUC_NHAN_TAO` bỏ qua và
  // rơi xuống đây, nơi `KIND_TU_NHIEN` chặn nốt.
  return !KIND_TU_NHIEN.has(item.source?.kind);
}

/** Tỉ lệ dựng mặc định theo từng `kind`, khớp với `sceneGraph.js`. */
function tiLeMacDinh(item) {
  if (Number.isFinite(item?.source?.scale)) return item.source.scale;
  // ⚠️ `BUILDING_SCALE` nay `import` THẲNG từ `parts.js` (2026-08-21). Trước đó nó là một con số
  // 1,3 chép tay ở đây kèm chú thích tự nhận là nợ — vì hằng số gốc nằm trong `sceneGraph.js`, mà
  // file ấy `import 'three'` nên tầng thuần không nạp được. Khoản nợ ấy đã trả: hằng số chuyển về
  // đúng chỗ định nghĩa ngôn ngữ mô tả, nên mọi bản chép tay đều gỡ được.
  return MUC_NHAN_TAO.has(item?.kind) ? BUILDING_SCALE : 1;
}

/**
 * ĐO (G1): dấu vết con người nằm ngoài lưới.
 *
 * @param {object} opts
 * @param {Array} opts.items      kết quả `collectCitySpecs({layout})`
 * @param {number} [opts.gridSize]
 * @param {number} [opts.mauMoiO] độ mịn lưới lấy mẫu khi tính diện tích hợp
 * @returns {{soVat:number, soVatTong:number, dienTich:number, xaNhat:number,
 *   theoLoai:Record<string,number>}}
 *   · `soVat`     — số vật do người làm nằm NGOÀI lưới
 *   · `soVatTong` — tổng số vật do người làm (trong + ngoài), để in được "0/446"
 *   · `dienTich`  — diện tích hợp hình chiếu đáy của chúng, đơn vị Ô LƯỚI VUÔNG
 *   · `xaNhat`    — vật xa nhất cách MÉP lưới bao nhiêu ô
 *   · `theoLoai`  — đếm theo `source.kind`, để biết cái gì đang ở ngoài đó
 */
export function doDauVetNgoaiLuoi({ items, gridSize = 12, mauMoiO = 16 } = {}) {
  const ds = Array.isArray(items) ? items : [];
  const polys = [];
  const theoLoai = {};
  let soVat = 0, soVatTong = 0, xaNhat = 0;

  for (const item of ds) {
    if (!laDauVetNguoi(item)) continue;
    soVatTong += 1;
    const x = item.source?.x, y = item.source?.y;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const d = distanceOutsideGrid(x, y, gridSize);
    if (d <= 0) continue;

    soVat += 1;
    if (d > xaNhat) xaNhat = d;
    const loai = item.source?.kind ?? item.kind;
    theoLoai[loai] = (theoLoai[loai] ?? 0) + 1;
    polys.push(...daysGiacDayDaDat(item.spec, {
      cx: x, cz: y, scale: tiLeMacDinh(item), ry: item.source?.ry ?? 0,
    }));
  }

  return { soVat, soVatTong, dienTich: dienTichHop(polys, { mauMoiO }), xaNhat, theoLoai };
}
