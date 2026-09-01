/**
 * GIÁ THẬT CỦA MỘT NÚT KỸ NĂNG ĐANG KHOÁ = giá của nó CỘNG giá mọi nút tiên quyết chưa mở.
 *
 * ⚠️ VÌ SAO CẦN. Ô giá trên màn in `node.spCost` — giá LẺ của riêng nút ấy. Đo trên một ván thật
 * (4 kỹ năng đã mở): **21/32 nút chưa mua (66%) hiện một con số THẤP HƠN giá thật**, tệ nhất là
 * gấp **2,3 lần** — ô ghi "8 SP" trong khi phải tiêu **18 SP** mới chạm tới được nó. Quy ra công
 * sức ở nhịp chơi thật: 18 SP = 9 cấp ≈ 254 ngày.
 *
 * Con số duy nhất người chơi đọc được là con số nói dối, và nó nói dối theo hướng DỄ CHỊU. Khi
 * phát hiện ra "8 SP" thật ra là 18 SP, lòng tin vào mọi con số khác trên màn cũng mất theo — đó
 * mới là cái giá đắt, không phải bản thân con số.
 *
 * ⚠️ ĐI THEO CHUỖI TIÊN QUYẾT, KHÔNG CỘNG DỒN CẢ NHÁNH. Nhiều nút chia chung tổ tiên; cộng thẳng
 * sẽ đếm một nút hai lần. Dùng một tập `daTinh` để mỗi nút chỉ vào tổng ĐÚNG MỘT LẦN.
 */

/**
 * @param {string} id            id nút cần tính
 * @param {Map|object} bang      tra id → node (phải có `spCost` và `requires`)
 * @param {(id:string)=>boolean} daMo   nút đã mở chưa
 * @param {(node:object)=>number} giaCua  giá HIỆU DỤNG của một nút (đã trừ giảm giá di vật)
 */
export function giaCaChuoi(id, bang, daMo, giaCua) {
  const tra = (k) => (bang instanceof Map ? bang.get(k) : bang?.[k]);
  const daTinh = new Set();

  const di = (nodeId) => {
    if (daTinh.has(nodeId) || daMo(nodeId)) return 0;
    daTinh.add(nodeId);
    const node = tra(nodeId);
    if (!node) return 0;
    let tong = giaCua(node);
    for (const req of node.requires ?? []) tong += di(req);
    return tong;
  };

  return di(id);
}
