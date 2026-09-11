/**
 * smoothNormals.js — LÀM MỀM PHÁP TUYẾN THEO GÓC GÃY (round 54, ADR-094).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ PHÁT HIỆN MỞ ĐƯỜNG CỦA VÒNG 54, VÀ NÓ KHÔNG PHẢI VỀ HÌNH HỌC
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `humanShape.js` đã dựng cơ thể bằng khối tiện tròn 12 cạnh NHIỀU VÒNG từ ADR-057 — `limb`,
 * `calf`, `chest`, `flare`, `cone`, `dome`, mỗi khuôn một bảng `rings` đàng hoàng. **Hình học đã
 * cong thật từ lâu.** Cột, vòm, chóp mái, thân cây, hòn đá cũng vậy.
 *
 * Thứ làm chúng hiện lên thành khối gỗ ghép là `geometryFactory.js`: nó ghi pháp tuyến **THẲNG
 * THEO TỪNG MẶT** — mỗi tam giác một pháp tuyến riêng, không hề gộp. Một hình trụ 12 cạnh vì thế
 * hiện lên thành **12 tấm phẳng**, dù đỉnh của nó nằm đúng trên một đường tròn.
 * ⇒ Sửa chỗ này **không thêm một tam giác nào** mà đổi MỌI vật cong của cả 15 kỷ cùng lúc.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO "LÀM MỀM TẤT" LÀ SAI, VÀ VÌ SAO GÓC GÃY KHÔNG CẦN MỘT BẢNG VAI NÀO
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Làm mềm tất thì bức tường nhoè thành cục xà phòng và toàn bộ hốc cửa sổ, trụ áp tường, gờ phào
 * của vòng 53 tan hết — chúng chính là thứ tạo bóng. Nên phải làm mềm **CÓ ĐIỀU KIỆN**.
 *
 * Và điều kiện ấy KHÔNG cần một danh sách "khối nào được mềm". Nó tự rơi ra từ hình học:
 *
 *     hai mặt bên của một khối 4 cạnh  lệch nhau  **90°**   ⇒ trên ngưỡng ⇒ giữ SẮC
 *     hai mặt bên của một khối 6 cạnh  lệch nhau  **60°**   ⇒ trên ngưỡng ⇒ giữ SẮC
 *     hai mặt bên của một khối 12 cạnh lệch nhau  **30°**   ⇒ dưới ngưỡng ⇒ làm MỀM
 *     hai mặt bên của một khối 16 cạnh lệch nhau  **22,5°** ⇒ dưới ngưỡng ⇒ làm MỀM
 *     mặt bên gặp mặt nóc              lệch nhau  **90°**   ⇒ trên ngưỡng ⇒ giữ SẮC
 *
 * Tức là: **một cái hộp tự giữ cạnh, một cái cột tự tròn, và không ai phải khai điều đó ở đâu.**
 * Đây là lý do thật sự để chọn góc gãy thay vì một bảng `role → smooth`: một bảng thì có 21 vai và
 * sẽ có vai thứ 22 không ai nhớ khai; một góc thì đúng cho mọi khối chưa được viết ra.
 * ⚠️ Hệ quả phải nhớ: **nâng số cạnh của một khối cũng chính là bật làm mềm cho nó.** Việc 2 của
 * vòng 54 (nâng `MAX_SIDES`) và việc này là MỘT cơ chế nhìn từ hai phía.
 *
 * ⚠️ VÀ ĐÂY LÀ LÝ DO PHẢI LÀM TỪNG KHỐI MỘT, KHÔNG LÀM TRÊN BỘ ĐỆM ĐÃ GỘP. Cảnh này gộp mọi công
 * trình của một họ vật liệu vào MỘT lưới. Hàn đỉnh trên bộ đệm đã gộp thì hai bức tường của hai
 * căn nhà khác nhau vô tình chạm nhau sẽ được làm mềm VÀO NHAU — một cái góc phố bỗng cong như
 * kẹo. Nên `geometryFactory` gọi hàm này trên đúng khoảng tam giác của MỘT khối vừa phát ra.
 */

/**
 * Góc gãy mặc định, độ. Dưới góc này thì hai mặt kề nhau coi như CÙNG một đường cong.
 *
 * ⚠️ 40° CHỌN TỪ BẢNG TRÊN, KHÔNG PHẢI TỪ CẢM GIÁC: nó phải nằm giữa 30° (khối 12 cạnh — thứ ta
 * muốn mềm) và 60° (khối 6 cạnh — thứ ta muốn giữ sắc). Chính giữa là 45°, và 40 lùi về phía an
 * toàn: một khối 8 cạnh lệch 45° sẽ GIỮ SẮC thay vì mềm, mà 8 cạnh thì mắt vẫn đọc ra tám mặt nên
 * làm mềm nó là nói dối hình bóng.
 * ⚠️ ĐỪNG NÂNG LÊN QUÁ 55°: khối 6 cạnh (`prism` của đồ vật, nửa vòm cửa sổ vòng 53) sẽ mềm theo
 * và mất hết cạnh. Nếu một khối tròn nào đó còn gãy, cách đúng là **cho nó thêm cạnh**, không phải
 * nới góc này — thêm cạnh sửa cả hình bóng, nới góc chỉ sửa cách tô sáng.
 */
export const CREASE_DEGREES = 40;

/** Lưới hàn đỉnh. Hai đỉnh gần nhau hơn mức này coi như một. */
const WELD = 1e-4;

/**
 * Làm mềm pháp tuyến cho MỘT khoảng tam giác vừa được ghi vào bể.
 *
 * @param {object} sink  bể tam giác (`sink.pos`, `sink.nor` — mảng phẳng, tam giác rời, 9 số mỗi tam giác)
 * @param {number} from  chỉ số bắt đầu trong `sink.pos` (bội của 9)
 * @param {number} creaseDeg  góc gãy, độ
 * @returns {number} số đỉnh đã được gộp pháp tuyến (0 = khối này không có gì để làm mềm)
 */
export function smoothRange(sink, from, creaseDeg = CREASE_DEGREES) {
  const pos = sink.pos;
  const nor = sink.nor;
  const end = pos.length;
  const count = (end - from) / 3;            // số ĐỈNH trong khoảng
  if (count < 6) return 0;                   // dưới hai tam giác thì không có cạnh chung nào

  const cosCrease = Math.cos((creaseDeg * Math.PI) / 180);

  // ── (1) Gom đỉnh theo VỊ TRÍ ────────────────────────────────────────────────────────────────
  // ⚠️ Khoá là toạ độ ĐÃ LÀM TRÒN, không phải toạ độ thô. Hai đỉnh của hai tam giác kề nhau được
  // tính ra bằng hai đường khác nhau nên chúng lệch nhau ở chữ số thứ mười lăm — so bằng `===`
  // thì không đỉnh nào hàn được với đỉnh nào, và cả hàm này im lặng không làm gì cả. Đây đúng là
  // hình dạng "chạy xanh mà chẳng làm gì" mà bài học 112 đã trả giá.
  const groups = new Map();
  for (let v = 0; v < count; v += 1) {
    const i = from + v * 3;
    const key = `${Math.round(pos[i] / WELD)},${Math.round(pos[i + 1] / WELD)},${Math.round(pos[i + 2] / WELD)}`;
    const g = groups.get(key);
    if (g) g.push(v);
    else groups.set(key, [v]);
  }

  // ── (2) Với mỗi cụm đỉnh trùng vị trí: gộp những pháp tuyến đủ gần nhau ─────────────────────
  // ⚠️ GỘP THEO TỪNG ĐỈNH MỘT, KHÔNG GỘP CẢ CỤM THÀNH MỘT. Ở một cái góc hộp, ba mặt gặp nhau tại
  // một điểm; gộp cả cụm thì cái góc ấy nhận một pháp tuyến chéo 45° và hộp mất cạnh. Đúng cách là
  // hỏi cho TỪNG mặt: *"những mặt nào quanh đỉnh này nằm cùng đường cong với TÔI?"* — nên ở góc
  // hộp mỗi mặt chỉ thấy chính nó, còn ở thân trụ mỗi mặt thấy hai mặt kề.
  let smoothed = 0;
  const out = new Float32Array(count * 3);
  for (let v = 0; v < count; v += 1) {
    const i = from + v * 3;
    out[v * 3] = nor[i];
    out[v * 3 + 1] = nor[i + 1];
    out[v * 3 + 2] = nor[i + 2];
  }

  for (const list of groups.values()) {
    if (list.length < 2) continue;
    for (const v of list) {
      const i = from + v * 3;
      const nx = nor[i];
      const ny = nor[i + 1];
      const nz = nor[i + 2];
      let ax = 0;
      let ay = 0;
      let az = 0;
      let n = 0;
      for (const w of list) {
        const j = from + w * 3;
        const d = nx * nor[j] + ny * nor[j + 1] + nz * nor[j + 2];
        if (d < cosCrease) continue;
        ax += nor[j]; ay += nor[j + 1]; az += nor[j + 2];
        n += 1;
      }
      if (n < 2) continue;
      const len = Math.hypot(ax, ay, az);
      if (len < 1e-6) continue;
      out[v * 3] = ax / len;
      out[v * 3 + 1] = ay / len;
      out[v * 3 + 2] = az / len;
      smoothed += 1;
    }
  }

  // ── (3) Ghi ngược lại ───────────────────────────────────────────────────────────────────────
  // ⚠️ GHI SAU KHI TÍNH XONG HẾT, không ghi trong lúc tính. Ghi tại chỗ thì đỉnh thứ hai của một
  // cụm sẽ đọc pháp tuyến ĐÃ BỊ ĐỔI của đỉnh thứ nhất, tức phép trung bình chạy dồn — kết quả
  // phụ thuộc thứ tự duyệt, và nó vẫn "trông mượt" nên không ai phát hiện.
  for (let v = 0; v < count; v += 1) {
    const i = from + v * 3;
    nor[i] = out[v * 3];
    nor[i + 1] = out[v * 3 + 1];
    nor[i + 2] = out[v * 3 + 2];
  }
  return smoothed;
}
