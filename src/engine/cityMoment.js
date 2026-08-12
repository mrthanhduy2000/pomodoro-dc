/**
 * cityMoment.js — ĐIỀU ĐÁNG NÓI VỀ THÀNH PHỐ, ở hai đầu của một phiên làm việc:
 *   • `buildFocusTease`   — TRƯỚC/TRONG phiên: phiên này đang đẩy cái gì tới đâu.
 *   • `buildGrowthMoment` — NGAY SAU phiên: thành phố vừa lớn lên như thế nào.
 *
 * Hai hàm dùng CHUNG một phép chọn "công trường gần xong nhất", nên chúng nằm cùng một file thay
 * vì chép phép sắp xếp đó ra hai nơi rồi để chúng trôi khỏi nhau — hai màn hình mà nói về hai công
 * trình khác nhau thì Đàm sẽ tưởng app đang đếm hai thứ.
 *
 * ── KHOẢNH KHẮC THÀNH PHỐ LỚN LÊN, ngay sau khi một phiên hoàn thành ──
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

/**
 * Công trường GẦN XONG NHẤT — dùng chung cho cả hai đầu của một phiên.
 * Cùng thứ tự với bảng "Đang xây" ở tab Thành Phố: ít phiên còn lại nhất trước, hoà thì theo id
 * cho tất định (không có `Date`/`Math.random` nào ở đây).
 */
function pickNearestScaffold(scaffolds) {
  return (Array.isArray(scaffolds) ? scaffolds : [])
    .filter((item) => item && typeof item.bpId === 'string')
    .sort((a, b) => (a.remaining - b.remaining) || a.bpId.localeCompare(b.bpId))[0];
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
/**
 * Lễ mừng "thành phố lớn lên" chạy bao lâu (mili-giây).
 *
 * ⚠️ VÌ SAO CON SỐ NÀY NẰM Ở TẦNG ENGINE THUẦN chứ không nằm trong component vẽ nó.
 * Nó không chỉ là tham số hoạt hoạ — nó là một mốc trong NHỊP của một phiên, và nó có quan hệ với
 * một con số ở tận `timerSession.js` (`BREAK_START_DELAY_MS`, độ trễ trước khi phiên nghỉ bắt đầu
 * đếm). Chừng nào hai số đó còn nằm ở hai tầng không nói chuyện được với nhau thì không bài test
 * nào canh nổi quan hệ giữa chúng — mà chính khoảng lệch đó đang khiến lễ mừng bị tính vào giờ
 * nghỉ (xem `TECH_DEBT.md` #12). Đưa cả hai về tầng thuần là điều kiện để có hàng rào.
 */
export const GROWTH_MOMENT_MS = 3200;

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
  const nearest = pickNearestScaffold(scaffolds);

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

/**
 * ĐIỀU ĐÁNG NÓI TRƯỚC/TRONG PHIÊN: 25 phút sắp tới đang đẩy cái gì tới đâu.
 *
 * ⚠️ VÌ SAO TỒN TẠI: `buildGrowthMoment` khép được đuôi vòng lặp (xong phiên → thấy thành quả),
 * nhưng ĐẦU vòng lặp vẫn phẳng — lúc bấm "Bắt đầu", màn hình không nói gì về việc phiên này để
 * làm gì cho thành phố. Thẻ "Chuỗi" đã làm đúng việc này cho streak từ lâu ("Còn N ngày → mốc"),
 * còn thành phố thì chưa có gì tương đương. Đó là chỗ phẳng cuối cùng của chữ "chán".
 *
 * ⚠️ CÙNG LUẬT TRUNG THỰC với `buildGrowthMoment`: chỉ nói điều ĐANG đúng.
 *   • Có công trường ⇒ nói còn bao xa; sắp xong thì nói to hơn (đó mới là lúc đáng bấm Bắt đầu).
 *   • Xưởng trống mà Đàm ĐÃ từng xây ⇒ nói thẳng cái giá: phiên xong lúc này không đẩy công
 *     trình nào tiến thêm. Đây là sự thật, không phải lời hối thúc.
 *   • Chưa từng xây gì ⇒ IM LẶNG. Người mới chưa có xưởng để mà trống; nhắc lúc này là cằn nhằn.
 *
 * ⚠️ KHÔNG hứa hẹn gì về NGUYÊN LIỆU. Việc bản vẽ nào đủ nguyên liệu để khởi công là luật riêng
 * của `BuildingWorkshop` (đã unlock · đúng kỷ · chưa xây · đủ tài nguyên). Chép luật đó sang đây
 * là tạo ra một bản sao sẽ trôi khỏi bản gốc — và một lời mời "xây đi" mà bấm vào thì không đủ
 * nguyên liệu còn tệ hơn im lặng.
 *
 * @param {object} input
 * @param {Array}   [input.scaffolds] `layout.scaffolds` — công trình đang xây
 * @param {boolean} [input.hasBuilt]  Đàm đã từng hoàn thành ít nhất một công trình chưa
 * @returns {{tone:'imminent'|'progress'|'idle', icon:string, text:string, bpId:string|null,
 *            progress:number}|null}  `null` = không có gì đáng nói
 */
export function buildFocusTease({ scaffolds = [], hasBuilt = false } = {}) {
  const nearest = pickNearestScaffold(scaffolds);

  if (nearest) {
    const remaining = Number.isFinite(nearest.remaining) ? nearest.remaining : 0;
    // `remaining <= 1` gộp cả 0: hàng đợi có thể đã về 0 mà chưa kịp dọn, và với người dùng thì
    // "còn 0 phiên" với "còn 1 phiên" đều có nghĩa là PHIÊN TỚI LÀ XONG.
    if (remaining <= 1) {
      return {
        tone: 'imminent',
        icon: nearest.icon ?? '🏗️',
        text: `Phiên tới hoàn thành ${nearest.label}`,
        bpId: nearest.bpId,
        progress: clamp01(nearest.progress),
      };
    }
    return {
      tone: 'progress',
      icon: nearest.icon ?? '🏗️',
      text: `Đang xây ${nearest.label} · còn ${remaining} phiên`,
      bpId: nearest.bpId,
      progress: clamp01(nearest.progress),
    };
  }

  if (hasBuilt) {
    return {
      tone: 'idle',
      icon: '🏚️',
      text: 'Xưởng đang trống — phiên xong lúc này không đẩy công trình nào tiến thêm',
      bpId: null,
      progress: 0,
    };
  }

  return null;
}
