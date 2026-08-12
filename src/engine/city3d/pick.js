/**
 * pick.js — CHẠM VÀO MỘT CÔNG TRÌNH THÌ BIẾT ĐÓ LÀ CÔNG TRÌNH NÀO.
 *
 * ⚠️ VÌ SAO KHÔNG DÙNG `Raycaster.intersectObjects` CỦA THREE.JS:
 * cả thành phố được GỘP vào đúng MỘT khối hình học để chỉ tốn một lệnh vẽ (xem `geometryFactory`).
 * Ném tia vào khối đó thì biết trúng "thành phố" — không biết trúng CĂN NÀO. Muốn biết thì phải
 * tách mỗi công trình thành một mesh riêng, tức là vứt bỏ đúng cái tối ưu quan trọng nhất của bộ
 * vẽ, chỉ để phục vụ một cú chạm mỗi vài phút.
 *
 * Cách ở đây: giữ nguyên một khối hình học, và tính TOÁN HỌC xem tia chạm vào hộp bao của công
 * trình nào trước. Vài chục hộp thì phép thử này rẻ đến mức không đo được, và quan trọng hơn: nó
 * THUẦN — không three, không DOM — nên test được bằng `node --test`.
 *
 * ⚠️ VÀ VÌ SAO KHÔNG CHỈ CẮT TIA VỚI MẶT ĐẤT (y = 0) rồi quy ra ô lưới: cảnh nhìn xiên, nên chạm
 * vào NÓC một toà tháp thì tia đi tiếp và cắt mặt đất ở tận ô phía SAU nó. Càng nhà cao càng lệch.
 * Hộp bao thì đúng cả với nhà cao lẫn nhà thấp.
 */

/** Đọc số an toàn — dữ liệu hình học hỏng không được biến thành `NaN` lan khắp phép so sánh. */
const num = (value, fallback = 0) => (Number.isFinite(value) ? value : fallback);

/**
 * Hộp bao (theo trục) của một danh sách khối mô tả — toạ độ CỤC BỘ, gốc ở chân công trình.
 *
 * Mỗi khối là một lăng trụ tâm `(x, y, z)` với `y` là ĐÁY (xem `parts.js`), rộng `w`, sâu `d`,
 * cao `h`. Bỏ qua `ry` (xoay quanh trục đứng) một cách CÓ CHỦ Ý: xoay làm hộp bao rộng ra tối đa
 * ~41%, mà nới rộng vùng chạm thì chỉ khiến ngón tay dễ trúng hơn — sai theo hướng an toàn. Tính
 * cho đúng thì phải quay 4 góc từng khối, tốn công mà không ai cảm nhận được.
 */
export function specBounds(spec) {
  // Nhận CẢ hai dạng: mảng khối trần, hoặc chính kết quả `buildBuildingSpec`/`buildScaffoldSpec`
  // (`{ parts, height, span, triangles }`). Không phải chiều chuộng — đây là chỗ cực dễ đưa nhầm:
  // hai hàm dựng hình trả về object bọc, còn hàm này thì cần mảng, và đưa nhầm KHÔNG ném lỗi mà
  // chỉ trả `null` ⇒ cả tính năng chạm im lặng không hoạt động. Đã dính đúng một lần lúc viết test.
  const list = Array.isArray(spec) ? spec : (Array.isArray(spec?.parts) ? spec.parts : []);
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const part of list) {
    if (!part) continue;
    const x = num(part.x), y = num(part.y), z = num(part.z);
    const hw = Math.max(0, num(part.w)) / 2;
    const hd = Math.max(0, num(part.d, num(part.w))) / 2;
    const h = Math.max(0, num(part.h));
    if (x - hw < minX) minX = x - hw;
    if (x + hw > maxX) maxX = x + hw;
    if (z - hd < minZ) minZ = z - hd;
    if (z + hd > maxZ) maxZ = z + hd;
    if (y < minY) minY = y;
    if (y + h > maxY) maxY = y + h;
  }

  if (minX === Infinity) return null;      // không có khối nào ⇒ không có gì để chạm
  return { minX, maxX, minY, maxY, minZ, maxZ };
}

/**
 * Đưa hộp bao cục bộ về toạ độ thế giới: nhân tỉ lệ rồi dời tới chỗ đứng.
 *
 * ⚠️ Nới thêm `pad` là CỐ Ý, không phải cẩu thả. Ngón tay trên iPhone không trỏ được vào đúng một
 * điểm; một toà nhà nhỏ chiếm chưa tới 30 điểm ảnh trên màn hình thì chạm mười lần trượt bảy. Nới
 * hộp ra một chút làm cú chạm "bắt" được như mọi app khác. Nếu hai hộp cùng trúng thì phép so vẫn
 * chọn cái GẦN camera hơn, nên nới rộng không gây chọn nhầm cái đằng sau.
 */
export function placeBounds(local, { x = 0, z = 0, y = 0, scale = 1, pad = 0 } = {}) {
  if (!local) return null;
  const s = Math.max(0, num(scale, 1));
  const p = Math.max(0, num(pad));
  return {
    minX: num(x) + local.minX * s - p,
    maxX: num(x) + local.maxX * s + p,
    minY: num(y) + local.minY * s - p,
    maxY: num(y) + local.maxY * s + p,
    minZ: num(z) + local.minZ * s - p,
    maxZ: num(z) + local.maxZ * s + p,
  };
}

/**
 * Tia cắt hộp — phương pháp "slab": với mỗi trục, tính đoạn tham số `t` mà tia còn nằm giữa hai
 * mặt phẳng của hộp; giao cả ba đoạn lại. Rỗng ⇒ trượt.
 *
 * Trả về khoảng cách `t` tới chỗ chạm ĐẦU TIÊN nằm phía trước camera, hoặc `null`.
 *
 * ⚠️ Chia cho 0 ở đây là ĐÚNG chứ không phải lỗi: tia song song với một trục cho `Infinity`, và
 * phép so `min/max` vẫn ra kết quả đúng (`Infinity` bị loại một cách tự nhiên). Chỉ cần chặn
 * trường hợp `0/0 = NaN` — xảy ra khi tia song song VÀ nằm đúng trên mặt phẳng hộp.
 */
export function rayBoxDistance(origin, direction, box) {
  if (!box || !origin || !direction) return null;

  let near = 0;
  let far = Infinity;

  for (const axis of ['x', 'y', 'z']) {
    const o = num(origin[axis]);
    const d = num(direction[axis]);
    const lo = box[`min${axis.toUpperCase()}`];
    const hi = box[`max${axis.toUpperCase()}`];

    if (d === 0) {
      // Tia không đi theo trục này: hoặc nó đã nằm trong dải, hoặc vĩnh viễn ở ngoài.
      if (o < lo || o > hi) return null;
      continue;
    }

    let t1 = (lo - o) / d;
    let t2 = (hi - o) / d;
    if (t1 > t2) { const swap = t1; t1 = t2; t2 = swap; }
    if (t1 > near) near = t1;
    if (t2 < far) far = t2;
    if (near > far) return null;
  }

  // `far < 0` ⇒ cả hộp nằm SAU lưng camera.
  if (far < 0) return null;
  return near;
}

/**
 * Chọn mục tiêu GẦN NHẤT mà tia chạm phải.
 *
 * @param {object} ray        `{ origin: {x,y,z}, direction: {x,y,z} }` — hướng KHÔNG cần chuẩn hoá
 * @param {Array}  targets    `[{ box, ...bất kỳ dữ liệu nào }]`
 * @returns {object|null} chính phần tử trong `targets`, kèm `distance`
 */
export function pickNearest(ray, targets) {
  const list = Array.isArray(targets) ? targets : [];
  let best = null;
  let bestT = Infinity;

  for (const target of list) {
    const t = rayBoxDistance(ray?.origin, ray?.direction, target?.box);
    // ⚠️ `t <= bestT` chứ không `<`: hộp nới rộng có thể chồng lên nhau, và khi hai hộp cùng cho
    // một khoảng cách thì lấy cái ĐỨNG SAU trong danh sách. Danh sách được xếp theo chiều sâu, nên
    // "sau" nghĩa là gần người xem hơn — đúng cái mà ngón tay đang chỉ vào.
    if (t !== null && t <= bestT) { bestT = t; best = target; }
  }

  return best ? { ...best, distance: bestT } : null;
}
