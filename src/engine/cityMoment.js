/**
 * cityMoment.js — KHOẢNH KHẮC THÀNH PHỐ LỚN LÊN, ngay sau khi một phiên hoàn thành.
 *
 * ⚠️ VÌ SAO TỒN TẠI:
 * Sau Phase 3H–3L, thành phố đã ĐỌC ĐƯỢC (biết còn bao xa, biết được gì) và SỜ ĐƯỢC (chạm vào
 * xem). Nhưng đúng khoảnh khắc đáng giá nhất — lúc chuông báo hết phiên — Đàm vẫn chỉ thấy một
 * hộp thoại vật phẩm. Thành phố có lớn lên thật, chỉ là **anh không được nhìn thấy nó lớn lên**.
 * Vòng lặp "làm việc → thấy thành quả" đứt đúng ở mắt xích cuối cùng, và đó là nguyên nhân đo được
 * cuối cùng của chữ "chán".
 *
 * ⚠️ LUẬT TRUNG THỰC — quan trọng hơn cả hiệu ứng:
 * Hàm này trả `null` khi thành phố **không** thay đổi gì trong phiên vừa rồi. Thà không có khoảnh
 * khắc nào còn hơn có một câu chúc mừng rỗng. Một lời khen sai một lần thì mọi lời khen sau đó đều
 * mất giá — đúng nguyên tắc chống-bịa mà cả AI Coach đang sống bằng nó (`engine/coach/guard.js`).
 *
 * THUẦN: không đọc store, không đụng `Date`, không DOM. Test bằng `node --test`.
 */

import { BLUEPRINT_LOOKUP } from './cityLayout.js';

const clamp01 = (value) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

/** Tiến độ của công trình này TRƯỚC khi lùi lại `steps` bước. Thiếu tổng số phiên ⇒ về 0. */
function stepBack(scaffold, steps) {
  const total = scaffold.total;
  if (!Number.isFinite(total) || total <= 0) return 0;
  const remainingBefore = (Number.isFinite(scaffold.remaining) ? scaffold.remaining : 0) + steps;
  return clamp01(1 - remainingBefore / total);
}

/** Ghép danh sách tên thành một cụm đọc được: "A", "A và B", "A, B và C". */
function joinNames(names) {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} và ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} và ${names[names.length - 1]}`;
}

/**
 * Điều đáng nói nhất về thành phố NGAY SAU phiên vừa xong.
 *
 * @param {object} input
 * @param {string[]} [input.newlyBuilt]  bpId của công trình VỪA hoàn thành trong phiên này
 * @param {Array}    [input.scaffolds]   `layout.scaffolds` — công trình đang xây (đã có tiến độ)
 * @param {string[]} [input.acceleratedIds] bpId được đặc quyền đẩy nhanh THÊM 1 bước phiên này
 * @returns {{kind:'built'|'scaffold', icon:string, headline:string, detail:string,
 *            progress:number, fromProgress:number, bpId:string}|null}
 *          `null` = không có gì thật để khoe
 */
export function buildGrowthMoment({ newlyBuilt = [], scaffolds = [], acceleratedIds = [] } = {}) {
  // ── 1. Có công trình VỪA XONG — tin lớn nhất có thể có ────────────────────
  const built = (Array.isArray(newlyBuilt) ? newlyBuilt : [])
    .map((bpId) => ({ bpId, meta: BLUEPRINT_LOOKUP[bpId] }))
    .filter((entry) => entry.meta);

  if (built.length > 0) {
    return {
      kind: 'built',
      bpId: built[0].bpId,
      icon: built[0].meta.icon,
      headline: built.length > 1 ? 'Nhiều công trình đã hoàn thành' : 'Công trình đã hoàn thành',
      detail: joinNames(built.map((entry) => entry.meta.label)),
      progress: 1,
      // Chạy đầy từ 0: đây là một sự kiện "xong rồi", không phải một lời khẳng định về con số
      // trước đó — mà con số trước đó thì ta KHÔNG có (hàng đợi đã dọn cái này đi rồi).
      fromProgress: 0,
    };
  }

  // ── 2. Không thì: giàn giáo vừa cao thêm một nấc ──────────────────────────
  // Lấy cái GẦN XONG NHẤT, cùng thứ tự với bảng "Đang xây" ở tab Thành Phố — hai màn hình phải
  // nói về cùng một công trình, nếu không Đàm sẽ tưởng app đang đếm hai thứ khác nhau.
  const nearest = (Array.isArray(scaffolds) ? scaffolds : [])
    .filter((item) => item && typeof item.bpId === 'string')
    .sort((a, b) => (a.remaining - b.remaining) || a.bpId.localeCompare(b.bpId))[0];

  if (nearest) {
    return {
      kind: 'scaffold',
      bpId: nearest.bpId,
      icon: nearest.icon ?? '🏗️',
      headline: 'Thành phố vừa lớn lên',
      detail: nearest.remaining > 0
        ? `${nearest.label} · còn ${nearest.remaining} phiên`
        : `${nearest.label} · sắp xong`,
      progress: clamp01(nearest.progress),
      // ⚠️ Vạch XUẤT PHÁT của thanh tiến độ phải là con số THẬT của phiên trước, không phải đoán.
      // Bình thường một phiên = một bước; nhưng đặc quyền "Tăng tốc" đẩy thêm 1 bước nữa, và
      // `acceleratedIds` cho biết đích danh công trình nào được đẩy. Vẽ nhảy sai một bước thì cái
      // thanh này đang nói dối về đúng thứ nó sinh ra để khoe.
      fromProgress: stepBack(nearest, (Array.isArray(acceleratedIds) ? acceleratedIds : [])
        .includes(nearest.bpId) ? 2 : 1),
    };
  }

  // ── 3. Thành phố KHÔNG đổi gì ⇒ im lặng ──────────────────────────────────
  // Không có công trường nào thì phiên vừa rồi thật sự không làm thành phố nhúc nhích. Hiện một
  // câu chúc mừng ở đây là nói dối, và chỉ cần nói dối một lần là mọi khoảnh khắc sau đều rỗng.
  return null;
}
