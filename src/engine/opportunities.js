/**
 * CƠ HỘI ĐANG CHỜ — "có việc gì đáng vào xem không?"
 *
 * Ba câu hỏi thuần, không dính React, không đọc store:
 *   1. có kỹ năng nào đủ SP để mở ngay không?          → tab con "Kỹ năng"
 *   2. có bản vẽ nào đủ RP để nghiên cứu ngay không?   → tab con "Kho báu" (Bản vẽ)
 *   3. có công trình nào đủ tài nguyên để xây ngay không? → tab con "Kho báu" (Xưởng)
 *
 * ⚠️ VÌ SAO CHÚNG NẰM Ở ĐÂY CHỨ KHÔNG NẰM TRONG `NotificationCenter.jsx` NHƯ TRƯỚC:
 * từ lúc điều hướng gộp ba màn (Kỹ năng · Kho báu · Thành tích) vào một tab "Hành trang",
 * có HAI chỗ cần cùng một câu trả lời — cái chuông thông báo và cái chấm trên tab "Hành
 * trang". Chép công thức sang chỗ thứ hai là đúng cái bẫy "một luật hai công thức" mà dự
 * án đã bị cắn nhiều lần: hai bản sao trôi khỏi nhau ở BIÊN (một bên đếm "đủ tiền mua",
 * bên kia đếm "chưa sở hữu") rồi cái chuông nói có việc trong khi cái chấm im, hoặc ngược
 * lại — và KHÔNG có gì đỏ lên. Nay chỉ có một công thức, hai người đọc.
 */

import {
  BLUEPRINT_CATALOG,
  BLUEPRINT_META,
  BUILDING_EFFECTS,
  BUILDING_SPECS,
  CRAFT_QUEUE_SLOTS,
  SKILL_TREE,
  normalizeRawCost,
  normalizeRefinedBag,
  getUnifiedRefinedCost,
} from './constants.js';
import { countActiveCrafting } from './eraLegacy.js';
import { getEffectiveSkillCost } from './gameMath.js';
import { khoiCongDuoc } from './craftReadiness.js';
import { researchCostOf } from './wonderEffects.js';

export const ALL_SKILLS = Object.values(SKILL_TREE).flatMap((branch) =>
  branch.nodes.map((node) => ({
    ...node,
    branchLabel: branch.label,
  }))
);

export const BLUEPRINT_LOOKUP = Object.fromEntries(
  Object.values(BLUEPRINT_CATALOG)
    .flat()
    .map((blueprint) => [blueprint.id, blueprint])
);

// ⚠️ Giữ tên cũ cho mọi nơi đang gọi, nhưng RUỘT nay là bản dùng chung với store và với màn
// hình — xem `engine/wonderEffects.js`.
export { researchCostOf as getEffectiveResearchCost } from './wonderEffects.js';

/**
 * Kỹ năng đã đủ điều kiện tiên quyết VÀ đủ SP để mở ngay bây giờ.
 *
 * ⚠️ PHẢI SO VỚI GIÁ THỰC (`getEffectiveSkillCost`), KHÔNG PHẢI `spCost` THÔ (sửa 2026-09-02).
 * Cộng hưởng di vật giảm NỬA giá 6 kỹ năng Tinh Hoa, và `unlockSkill` trong store TRỪ đúng giá
 * đã giảm ấy. Bản cũ so với giá gốc ⇒ với 11 SP và một kỹ năng 22 SP đã giảm còn 11, người chơi
 * **mua được thật** trong khi cái chuông · cái chấm · dòng "việc tiếp theo" đều bảo *không có
 * việc gì*. Đúng cái bẫy "một luật hai công thức" mà khối chú thích đầu file này cảnh báo — và
 * nó nhắm vào đúng 6 món đắt giá nhất game.
 */
export function listAvailableSkills({
  sp = 0, unlockedSkills = {}, relics = [], relicEvolutions = {},
} = {}) {
  return ALL_SKILLS.filter((skill) => {
    if (unlockedSkills[skill.id]) return false;
    if (sp < getEffectiveSkillCost(skill.id, skill.spCost, relics, relicEvolutions)) return false;
    return skill.requires.every((requirement) => unlockedSkills[requirement]);
  });
}

/** Bản vẽ chưa có mà đã đủ RP để nghiên cứu ngay. */
export function listResearchableBlueprints({
  activeBook = 1,
  blueprints = [],
  buildings = [],
  research = null,
} = {}) {
  const ownedIds = new Set((blueprints ?? []).map((item) => item.id));
  const researchedIds = new Set(research?.researched ?? []);
  const builtIds = new Set(buildings ?? []);

  return Object.entries(BLUEPRINT_META)
    .filter(([bpId, meta]) => {
      if ((activeBook ?? 1) < (meta.requiresEra ?? 1)) return false;
      if (ownedIds.has(bpId) || researchedIds.has(bpId) || builtIds.has(bpId)) return false;
      const cost = researchCostOf(buildings, bpId, meta.rpCost);
      return (research?.rp ?? 0) >= cost;
    })
    .map(([bpId]) => BLUEPRINT_LOOKUP[bpId])
    .filter(Boolean);
}

/** Bản vẽ đã sở hữu/đã nghiên cứu mà đủ tài nguyên để đưa vào xưởng ngay. */
export function listBuildableBlueprints({
  activeBook = 1,
  blueprints = [],
  buildings = [],
  craftingQueue = [],
  research = null,
  resources = null,
  resourcesRefined = null,
} = {}) {
  // ⚠️ ĐẾM Ô BẰNG `countActiveCrafting`, KHÔNG dùng `.length` — từ Phase 4D hàng đợi có thể
  // chứa "di sản" của kỷ đã đóng, và di sản KHÔNG chiếm ô. Dùng `.length` thì một di sản
  // đang xây dở sẽ âm thầm tắt hết gợi ý "có thể xây ngay" dù ô vẫn còn trống.
  if (countActiveCrafting(craftingQueue, activeBook) >= CRAFT_QUEUE_SLOTS) return [];

  const ownedIds = new Set((blueprints ?? []).map((item) => item.id));
  const researchedIds = new Set(research?.researched ?? []);
  const builtIds = new Set(buildings ?? []);
  const queuedIds = new Set((craftingQueue ?? []).map((item) => item.bpId));

  return Object.entries(BLUEPRINT_META)
    .filter(([bpId, meta]) => {
      const spec = BUILDING_SPECS[bpId];
      if (!spec) return false;
      if (!(ownedIds.has(bpId) || researchedIds.has(bpId))) return false;
      if (builtIds.has(bpId) || queuedIds.has(bpId)) return false;

      // ⚠️ MỘT LUẬT MỘT CÔNG THỨC — dùng chung `craftReadiness.js` với `ReadyCard` và dải mở đầu
      // tab Công trình. Ba bản chép tay của cùng một luật là ba cơ hội để chúng trôi khỏi nhau.
      // (Ô hàng đợi đã được kiểm ở đầu hàm nên ở đây `conOTrong` chắc chắn đúng.)
      return khoiCongDuoc({
        rawCost: normalizeRawCost(spec.cost ?? {}),
        refinedCost: getUnifiedRefinedCost(spec.refinedCost),
        bookResources: resources?.[`book${meta.era}`] ?? {},
        refinedT2: normalizeRefinedBag(resourcesRefined?.[meta.era]).t2,
      });
    })
    .map(([bpId]) => BLUEPRINT_LOOKUP[bpId])
    .filter(Boolean);
}

/**
 * "Có ít nhất một cơ hội đang chờ không?" — dùng cho cái chấm trên tab "Hành trang".
 *
 * ⚠️ Chạy ngắt sớm theo thứ tự RẺ → ĐẮT: cái chấm được tính lại ở MỌI lần store đổi (kể cả
 * mỗi giây timer chạy), nên câu hỏi rẻ nhất phải đứng trước. Ba danh sách trên chỉ được
 * dựng đầy đủ khi cái chuông cần đếm và cần kể tên.
 */
export function hasReadyOpportunity(snapshot = {}) {
  if (listAvailableSkills(snapshot).length > 0) return true;
  if (listResearchableBlueprints(snapshot).length > 0) return true;
  return listBuildableBlueprints(snapshot).length > 0;
}

/**
 * "VIỆC TIẾP THEO" — MỘT việc duy nhất, để hiện thành một dòng ở màn Tập trung.
 *
 * ⚠️ VÌ SAO CẦN, KHI ĐÃ CÓ CÁI CHẤM VÀ CÁI CHUÔNG. Cái chấm trên tab "Hành trang" nói *"có
 * việc"*; nó KHÔNG nói *"việc gì"*. Đàm phải bấm vào tab, rồi chọn giữa ba tab con, rồi tự dò
 * trong 51 kỹ năng / 75 công trình xem cái nào đang mở được. Đo được: game có 360 thành tích,
 * 51 kỹ năng, 75 công trình, 30 loại tài nguyên — cái khó chưa bao giờ là thiếu việc để làm, mà
 * là **không có gì nói cho anh biết việc nào đáng làm ngay**. Một dòng chữ đọc trong một nhịp
 * mắt, bấm được, đi thẳng tới đúng chỗ.
 *
 * ⚠️ THỨ TỰ ƯU TIÊN — XÂY > NGHIÊN CỨU > KỸ NĂNG, và đây là một quyết định chứ không phải thứ tự
 * tình cờ của ba dòng `if`:
 *   · **Xây** cho kết quả NHÌN THẤY ĐƯỢC trong thành phố 3D ngay phiên sau. Nó đóng đúng vòng lặp
 *     "làm việc → thấy thành quả" mà `cityMoment.js` sinh ra để giữ.
 *   · **Nghiên cứu** đứng thứ hai vì nó là thứ MỞ KHOÁ cho việc xây — làm nó tức là dọn đường.
 *   · **Kỹ năng** đứng cuối dù nó rẻ nhất về thao tác: phần thưởng của nó là mấy phần trăm cộng
 *     thêm, thứ không nhìn thấy được ở đâu cả. Để nó lên đầu là dùng chỗ đắt giá nhất màn hình
 *     cho thứ mờ nhạt nhất.
 * Ô xưởng có hạn (`CRAFT_QUEUE_SLOTS`), nên khi xưởng đầy thì nhánh "xây" tự trả rỗng và việc
 * hiện ra rơi xuống mục kế — không cần thêm luật nào cho chuyện đó.
 *
 * ⚠️ `othersCount` LÀ PHẦN KHÔNG ĐƯỢC BỎ. Nếu chỉ hiện một việc mà im lặng về phần còn lại thì
 * hôm nào Đàm có 5 kỹ năng chờ, anh vẫn chỉ thấy đúng một dòng nói về công trình và sẽ tưởng
 * không còn gì khác. Con số ấy là thứ giữ cho dòng này không nói dối bằng cách bỏ sót.
 *
 * THUẦN: không đọc store, không đụng `Date`, không DOM.
 *
 * @returns {{id: string, icon: string, label: string, text: string,
 *            action: {tab: string, collectionTab?: string}, othersCount: number} | null}
 *          `null` khi không có việc nào — nơi gọi KHÔNG được render khung rỗng thay cho nó.
 */
export function pickNextAction(snapshot = {}) {
  const buildable = listBuildableBlueprints(snapshot);
  const researchable = listResearchableBlueprints(snapshot);
  const skills = listAvailableSkills(snapshot);

  const total = buildable.length + researchable.length + skills.length;
  if (total === 0) return null;

  if (buildable.length > 0) {
    const [top] = buildable;
    return {
      id: 'workshop',
      icon: '🔨',
      label: top.label,
      text: `Xây «${top.label}» — đủ tài nguyên rồi`,
      action: { tab: 'collection', collectionTab: 'workshop' },
      othersCount: total - 1,
    };
  }

  if (researchable.length > 0) {
    const [top] = researchable;
    return {
      id: 'blueprints',
      icon: '📐',
      label: top.label,
      text: `Nghiên cứu «${top.label}» — đủ điểm nghiên cứu`,
      action: { tab: 'collection', collectionTab: 'blueprints' },
      othersCount: total - 1,
    };
  }

  const [top] = skills;
  return {
    id: 'skills',
    icon: '✦',
    label: top.label,
    text: `Mở kỹ năng «${top.label}» — đủ ${top.spCost} điểm`,
    action: { tab: 'skills' },
    othersCount: total - 1,
  };
}
