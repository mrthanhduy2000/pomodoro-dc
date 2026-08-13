/**
 * eraLegacy.js — "DI SẢN DANG DỞ": công trình kỷ cũ đang xây dở KHÔNG còn bị xoá khi lên kỷ mới.
 *
 * THUẦN tuyệt đối: không `Date`, không `Math.random`, không DOM, không store.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * VẤN ĐỀ CÓ THẬT MÀ KHÔNG AI THẤY
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Công trình đắt nhất ngốn 11 phiên. Nếu Đàm đang ở phiên thứ 8 của một công trình kỷ 7 mà vừa
 * đúng lúc đủ EP lên kỷ 8, thì `pruneEraScopedBlueprintState` **xoá sạch** mục đó khỏi
 * `craftingQueue`: tám phiên tập trung thật, nguyên liệu đã trả, biến mất **không một lời báo**.
 * Không có màn hình nào nói ra chuyện đó, không có thông báo nào, không có gì đỏ lên.
 *
 * Và từ Phase 4B ("trọn vẹn kỷ") thì nó còn đau hơn: bảo tàng nay ghi vĩnh viễn "kỷ 7 · 4/5", mà
 * Đàm KHÔNG có cách nào chạm tới cái 5/5 ấy nữa — anh bị chấm điểm cho một việc anh đang làm dở và
 * bị tước mất giữa chừng.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * CÁCH SỬA — VÀ VÌ SAO NÓ KHÔNG ĐỤNG MỘT CHÚT NÀO VÀO CÂN BẰNG GAME
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Mục đang xây của kỷ cũ được GIỮ LẠI trong hàng đợi và vẫn tiến 1 nấc mỗi phiên như thường. Khi
 * nó xong:
 *   • nó **KHÔNG** vào `buildings` → **KHÔNG** sinh đặc quyền (`BUILDING_EFFECTS`) → sức mạnh của
 *     Đàm không đổi một điểm nào. Điều này gần như MIỄN PHÍ về mặt cài đặt: `newBuildings` vốn đã
 *     đi qua `pruneEraScopedBlueprintState` nên công trình kỷ cũ **tự động** bị gạn ra sẵn rồi.
 *   • nó được ghi vào `cityArchive` của ĐÚNG kỷ đó → thành phố cũ trong bảo tàng có thêm một căn
 *     nhà, và bảng "trọn vẹn kỷ" có thể chạm tới 5/5.
 * Tức phần thưởng thuần tuý là LỊCH SỬ và SƯU TẬP, không phải sức mạnh. Đúng tinh thần bảo tàng.
 *
 * ⚠️ **KHÔNG CHIẾM Ô HÀNG ĐỢI** (`CRAFT_QUEUE_SLOTS` = 2). Vì phần thưởng không có chút sức mạnh
 * nào, cái giá phải bằng không — bắt Đàm hy sinh MỘT TRONG HAI ô xây dựng để đổi lấy một ngôi sao
 * trong bảo tàng là một cái bẫy, không phải một lựa chọn. (Và nó cũng sẽ khiến người chơi học được
 * bài "đừng bao giờ xây dở khi sắp lên kỷ" — đúng ngược với điều tính năng này muốn.)
 *
 * ⚠️ ~~**KHÔNG THỂ LẠM DỤNG**: `startCrafting` đã chặn sẵn bản vẽ không thuộc kỷ hiện tại, nên tập
 * "di sản" chỉ có thể gồm những thứ Đàm ĐÃ khởi công và ĐÃ trả nguyên liệu trước khi kỷ đóng lại.
 * Nó tự cạn: xây xong là hết, không sinh thêm được.~~
 * ⚠️ **CÂU TRÊN ĐÃ HẾT ĐÚNG TỪ 2026-08-13 (ADR-012 — "TRÙNG TU DI SẢN").** Đàm chọn mở cho xây bù
 * bản vẽ kỷ cũ, tức chính cái chặn mà câu đó dựa vào đã bị gỡ. Đây đúng cái bẫy đã ghi ở
 * `CLAUDE.md`: *một luật mới làm cho điều kiện cũ hết đúng*, và mệnh đề cũ thì không tự đỏ lên —
 * nó chỉ nằm đó nói sai. Nay lời hứa "không thể lạm dụng" được giữ bằng **BA** thứ khác, mỗi thứ
 * chặn một đường:
 *   1. `LEGACY_QUEUE_SLOTS = 1` — mỗi lúc chỉ trùng tu được MỘT công trình (`constants.js`).
 *   2. **Nguyên liệu kỷ cũ KHÔNG BAO GIỜ kiếm lại được.** `mergeResources` chỉ cộng thưởng vào
 *      `book${activeBook}`, nên túi `book5` của Đàm đóng băng đúng lúc anh rời kỷ 5. Trùng tu chỉ
 *      tiêu được phần dư người-Đàm-ngày-xưa để lại ⇒ hữu hạn, và **những quyết định lúc đó vẫn còn
 *      nguyên sức nặng** — đúng tinh thần mà ADR-011 lo mất.
 *   3. Không sinh đặc quyền (`BUILDING_EFFECTS`) — y như di sản dang dở. Sức mạnh không đổi.
 */

import { listEraBlueprints } from './cityCompletion';
import { BLUEPRINT_LOOKUP } from './cityLayout';

/** Kỷ của một bản vẽ; id lạ → `null` (KHÔNG ném lỗi — đây là đường nạp load-bearing). */
export function blueprintEraOf(bpId) {
  const era = BLUEPRINT_LOOKUP[bpId]?.era;
  return Number.isFinite(era) ? era : null;
}

/**
 * Tách hàng đợi xây dựng thành hai nhóm.
 *
 * @param {Array}  queue       `craftingQueue` — `[{ bpId, sessionsRemaining }]`
 * @param {number} activeBook  kỷ đang chơi
 * @returns {{ active: Array, legacy: Array }}
 *
 * ⚠️ Mục có `bpId` LẠ (không có trong catalog) bị xếp vào KHÔNG nhóm nào — nó biến mất, đúng như
 * hành vi cũ. Giữ lại một mục không tra cứu được thì mọi màn hình đều không biết vẽ nó thế nào, và
 * nó sẽ ngồi trong hàng đợi vĩnh viễn vì không bao giờ có ai xây nó xong.
 */
export function splitCraftingQueue(queue, activeBook) {
  const active = [];
  const legacy = [];
  for (const item of (Array.isArray(queue) ? queue : [])) {
    const era = blueprintEraOf(item?.bpId);
    if (era === null) continue;
    if (era === activeBook) active.push(item);
    else if (era < activeBook) legacy.push(item);
    // era > activeBook: dữ liệu lệch (bản vẽ của kỷ TƯƠNG LAI). Bỏ, giống hành vi cũ — giữ lại thì
    // Đàm xây được công trình chưa tới lượt.
  }
  return { active, legacy };
}

/**
 * Số ô hàng đợi ĐANG BỊ CHIẾM — chỉ đếm mục của kỷ hiện tại.
 *
 * ⚠️ Đây là chỗ duy nhất bảo đảm lời hứa "di sản không chiếm ô". Mọi màn hình hiện `n/2` và mọi
 * chỗ chặn "hàng đợi đã đầy" PHẢI đi qua hàm này, không được dùng `craftingQueue.length` nữa —
 * dùng `.length` thì một di sản đang xây sẽ âm thầm khoá mất một ô.
 */
export function countActiveCrafting(queue, activeBook) {
  return splitCraftingQueue(queue, activeBook).active.length;
}

/**
 * Số ô TRÙNG TU đang bị chiếm — đếm mọi mục thuộc kỷ đã đóng (ADR-012).
 *
 * ⚠️ Đếm CẢ "di sản dang dở" (thứ đã khởi công trước khi kỷ đóng, Phase 4D) lẫn công trình mới
 * khởi công theo diện trùng tu — cố ý, và đây KHÔNG phải lấy lại thứ gì đã hứa: di sản dang dở vẫn
 * không đụng tới 2 ô của kỷ hiện tại. Nó chỉ có nghĩa là "đang có một công trường trong bảo tàng
 * rồi thì chưa mở thêm cái thứ hai". Gộp chung như vậy giữ cho luật chỉ có MỘT công thức — tách ra
 * thì phải lưu thêm cờ "cái này khởi công theo diện nào", tức thêm state cho một khác biệt mà
 * người chơi không nhìn thấy.
 */
export function countLegacyCrafting(queue, activeBook) {
  return splitCraftingQueue(queue, activeBook).legacy.length;
}

/**
 * Những bản vẽ kỷ CŨ còn có thể trùng tu — tức thành phố cũ còn thiếu chúng.
 *
 * @param {object} args
 * @param {number} args.activeBook   kỷ đang chơi
 * @param {object} [args.cityArchive] bảo tàng — `{ [era]: { built: string[] } }`
 * @param {Array}  [args.queue]      `craftingQueue`, để không chào lại thứ đang xây
 * @returns {Array<{bpId,label,icon,rarity,era}>} xếp theo kỷ tăng dần, trong kỷ giữ thứ tự catalog
 *
 * ⚠️ **KHÔNG XÉT `research.researched`** — và đây là một quyết định, không phải bỏ sót.
 * `pruneEraScopedBlueprintState` xoá danh sách đã-nghiên-cứu của kỷ cũ, mà RP của kỷ cũ thì không
 * kiếm lại được. Nếu bắt phải nghiên-cứu-trước thì một bản vẽ Đàm chưa kịp nghiên cứu ở kỷ 5 sẽ
 * **vĩnh viễn** không thể xây, tức ngôi sao ★ của kỷ đó vĩnh viễn ngoài tầm với — đúng cái bất công
 * mà Phase 4D sinh ra để xoá bỏ, chỉ đổi chỗ. Bỏ cổng nghiên cứu KHÔNG cho thêm sức mạnh nào (trùng
 * tu không sinh đặc quyền) và vẫn phải trả đủ nguyên liệu, thứ đã hữu hạn sẵn.
 *
 * ⚠️ Kỷ THẤT TRUYỀN (đi qua trước khi có bảo tàng) không có entry trong `cityArchive`, nên
 * `built` rỗng ⇒ cả 5 bản vẽ đều hiện ra. ĐÚNG như mong muốn: đó là những kỷ trống trơn nhất, và
 * trùng tu là đường DUY NHẤT để chúng thôi là một dãy ô xám.
 */
export function listRestorableBlueprints({ activeBook, cityArchive, queue } = {}) {
  const current = Number.isFinite(activeBook) ? activeBook : 1;
  const archive = (cityArchive && typeof cityArchive === 'object') ? cityArchive : {};
  const inQueue = new Set(
    (Array.isArray(queue) ? queue : []).map((item) => item?.bpId).filter(Boolean),
  );

  const out = [];
  for (let era = 1; era < current; era += 1) {
    const built = new Set(Array.isArray(archive[era]?.built) ? archive[era].built : []);
    for (const bp of listEraBlueprints(era)) {
      if (built.has(bp.bpId) || inQueue.has(bp.bpId)) continue;
      out.push({ ...bp, era });
    }
  }
  return out;
}

/**
 * Bản vẽ này có đủ điều kiện KHỞI CÔNG theo diện trùng tu không? (chỉ xét phần thuộc về kỷ/bảo
 * tàng — nguyên liệu và các luật chung do `startCrafting` lo, đúng chỗ nó vốn lo.)
 */
export function canRestoreBlueprint({ bpId, activeBook, cityArchive, queue, legacySlots } = {}) {
  const era = blueprintEraOf(bpId);
  const current = Number.isFinite(activeBook) ? activeBook : 1;
  if (era === null || era >= current) return false;
  if (countLegacyCrafting(queue, current) >= (Number.isFinite(legacySlots) ? legacySlots : 1)) return false;
  return listRestorableBlueprints({ activeBook: current, cityArchive, queue })
    .some((bp) => bp.bpId === bpId);
}

/**
 * Trong số công trình VỪA XÂY XONG phiên này, cái nào thuộc kỷ đã đóng lại?
 *
 * @param {string[]} newlyBuilt  id vừa hoàn thành (mọi kỷ)
 * @param {number}   activeBook  kỷ đang chơi SAU phiên này
 * @returns {Array<{bpId: string, era: number}>} nhóm theo thứ tự đầu vào
 *
 * ⚠️ Dùng `activeBook` SAU phiên (`finalBook`), không phải trước: một phiên có thể vừa hoàn thành
 * công trình vừa đẩy Đàm lên kỷ mới, và công trình của kỷ vừa RỜI KHỎI thì đúng nghĩa là di sản.
 *
 * ⚠️ NHƯNG PHẢI NÓI CHO ĐÚNG SỨC NẶNG CỦA CÂU TRÊN — **đã ĐO, 2026-08-13**. Bản đầu của chú thích
 * này viết rằng lấy nhầm kỷ thì công trình "mất trắng". **Sai.** Ở ca đó `completeFocusSession`
 * gọi `pruneEraScopedBlueprintState` KÈM `sealContext` (đường lên kỷ thật), nên công trình vừa xong
 * bị cắt khỏi `buildings` rồi được chính lần NIÊM PHONG ghi vào `cityArchive` của kỷ cũ — nó tới
 * bảo tàng bằng đường khác. Đo bằng cách sửa `finalBook` thành kỷ trước phiên: bài test hành vi
 * `gameStore.eraLegacy.test.js` **vẫn xanh**; phải tắt CẢ HAI đường (di sản + niêm phong) nó mới đỏ.
 * ⇒ Đây là hai lưới ĐỘC LẬP che cùng một ca, và `finalBook` là lưới thứ hai — nó làm tầng di sản
 * TỰ ĐỦ (không âm thầm dựa vào phạm vi của lần niêm phong), chứ không phải thứ duy nhất cứu dữ liệu.
 * Ca mà tầng này là lưới DUY NHẤT: công trình kỷ cũ xây xong ở một phiên **không** lên kỷ.
 */
export function pickLegacyCompletions(newlyBuilt, activeBook) {
  const out = [];
  for (const bpId of (Array.isArray(newlyBuilt) ? newlyBuilt : [])) {
    const era = blueprintEraOf(bpId);
    if (era !== null && era < activeBook) out.push({ bpId, era });
  }
  return out;
}
