/**
 * skillMatrix.js — LUẬT của bản đồ kỹ năng 6×6. File này KHÔNG vẽ gì (xem `SkillMatrix.jsx`).
 *
 * ⚠️ VÌ SAO ĐỔI TỪ DANH SÁCH SANG BẢN ĐỒ (2026-09-02). Màn "Kỹ năng" trước đây hiện ĐÚNG MỘT
 * nhánh mỗi lúc: một hàng chip chọn nhánh, rồi sáu thẻ kỹ năng xếp dọc. Đo trên khung 390px:
 * cả trang dài **2.231px** và người chơi phải bấm qua **sáu** nhánh mới nhìn hết 36 kỹ năng — tức
 * câu hỏi *"tiêu điểm SP vào đâu"* KHÔNG trả lời được bằng mắt, phải nhớ trong đầu sáu màn hình.
 * Mà `SKILL_TREE` vốn là một MA TRẬN hoàn hảo: 6 nhánh × 6 nút, và **thứ tự nút trong mỗi nhánh
 * chính là độ sâu** (basic·basic·intermediate·intermediate·advanced·elite, giống nhau ở cả sáu).
 * Một dữ liệu hình chữ nhật thì phải được vẽ ra hình chữ nhật.
 *
 * ⚠️ CỘT = NHÁNH, HÀNG = ĐỘ SÂU — không đảo. Điều kiện tiên quyết (`requires`) chạy DỌC trong một
 * nhánh, nên để nhánh làm cột thì mũi tên phụ thuộc là một đường thẳng đứng mắt tự nối được.
 * Đảo lại thì mỗi đường phụ thuộc thành một đường ngang cắt qua năm cột khác.
 *
 * ⚠️ BỐN TRẠNG THÁI, KHÔNG PHẢI HAI. "Chưa mở" gộp chung thì ô đắt-quá và ô chưa-đủ-tiên-quyết
 * trông y hệt nhau — mà hai ca ấy cần hai hành động ngược nhau (chờ thêm SP · đi mở nút cha).
 * `READY` là trạng thái DUY NHẤT được mang màu nhấn: nó là câu trả lời cho "bấm được gì ngay bây
 * giờ". Nếu ô nào cũng rực thì "rực" thôi mang tin.
 */

export const MATRIX_STATE = {
  OWNED: 'OWNED',   // đã mở
  READY: 'READY',   // đủ tiên quyết + đủ SP ⇒ bấm được NGAY
  SHORT: 'SHORT',   // đủ tiên quyết nhưng chưa đủ SP
  LOCKED: 'LOCKED', // chưa đủ tiên quyết
};

/**
 * Dựng ma trận từ chính `SKILL_TREE` — KHÔNG chép danh sách nhánh/nút ra đâu cả.
 * @param {object} p
 * @param {object} p.skillTree   bảng nhánh (`SKILL_TREE`)
 * @param {object} p.unlockedSkills  map id → truthy
 * @param {number} p.sp          điểm kỹ năng đang có
 * @param {(node:object)=>number} p.costOf  giá THỰC TẾ (đã trừ giảm giá di vật)
 */
export function buildSkillMatrix({ skillTree, unlockedSkills = {}, sp = 0, costOf }) {
  const gia = typeof costOf === 'function' ? costOf : (node) => node.spCost;
  const columns = Object.entries(skillTree ?? {}).map(([key, branch]) => {
    const nodes = branch?.nodes ?? [];
    const cells = nodes.map((node) => {
      const cost = gia(node) ?? node.spCost;
      let state;
      if (unlockedSkills[node.id]) state = MATRIX_STATE.OWNED;
      else if (!(node.requires ?? []).every((req) => unlockedSkills[req])) state = MATRIX_STATE.LOCKED;
      else if (sp < cost) state = MATRIX_STATE.SHORT;
      else state = MATRIX_STATE.READY;
      return { node, cost, state, tier: node.tier };
    });
    return {
      key,
      label: branch?.label ?? key,
      focus: branch?.focus ?? '',
      cells,
      owned: cells.filter((c) => c.state === MATRIX_STATE.OWNED).length,
      total: cells.length,
    };
  });

  // Số hàng = nhánh dài nhất. Nhánh ngắn hơn để lại ô TRỐNG chứ không dồn lên — dồn lên thì hai
  // nút ở cùng một hàng lại thuộc hai độ sâu khác nhau, và cả bản đồ thôi đọc được theo hàng.
  const rows = columns.reduce((m, c) => Math.max(m, c.cells.length), 0);
  return { columns, rows };
}

/** Ô nào bấm được NGAY — con số dẫn dắt cả màn hình. */
export function countReady(matrix) {
  return (matrix?.columns ?? []).reduce(
    (s, col) => s + col.cells.filter((c) => c.state === MATRIX_STATE.READY).length, 0,
  );
}

/**
 * Ô nên chọn sẵn khi mở màn: ô rẻ nhất trong số bấm được ngay; không có thì ô đầu tiên chưa mở;
 * không có nữa thì ô đầu tiên. Tất định (hoà giá → cột trái trước) để ảnh chụp không nhấp nháy.
 */
export function pickDefaultCell(matrix) {
  const cells = (matrix?.columns ?? []).flatMap((col) => col.cells.map((c) => ({ ...c, branch: col })));
  if (!cells.length) return null;
  const ready = cells.filter((c) => c.state === MATRIX_STATE.READY);
  if (ready.length) return ready.reduce((a, b) => (b.cost < a.cost ? b : a));
  return cells.find((c) => c.state !== MATRIX_STATE.OWNED) ?? cells[0];
}

/**
 * Giá của ô RẺ NHẤT mà người chơi đã đủ tiên quyết (mở được nếu có đủ SP). 0 nếu không còn ô nào.
 * ⚠️ CHỈ tính ô đã đủ TIÊN QUYẾT. Một ô 2 SP nằm sau ba nút chưa mở thì con số "2" là một lời hứa
 * sai — đúng cái bẫy "giá lẻ vs giá cả chuỗi" đã đo được ở màn kỹ năng (21/32 nút từng hiện một
 * con số thấp hơn giá thật, tệ nhất 2,3 lần).
 */
export function cheapestReachable(matrix) {
  const gia = (matrix?.columns ?? [])
    .flatMap((col) => col.cells)
    .filter((c) => c.state === MATRIX_STATE.READY || c.state === MATRIX_STATE.SHORT)
    .map((c) => c.cost);
  return gia.length ? Math.min(...gia) : 0;
}
