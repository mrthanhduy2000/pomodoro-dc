/**
 * CƠ HỘI ĐANG CHỜ — "có việc gì đáng vào xem không?"
 *
 * HAI câu hỏi thuần, không dính React, không đọc store:
 *   1. có kỹ năng nào đủ SP để mở ngay không?              → tab con "Kỹ năng"
 *   2. hàng chờ xây có ô trống và còn công trình để chọn?   → tab con "Công trình"
 *
 * ⚠️ TỪ 2026-09-06 (ADR-069) CHỈ CÒN HAI, KHÔNG PHẢI BA. Câu "có bản vẽ nào đủ RP để nghiên cứu"
 * đã bỏ cùng với cổng nghiên cứu: bản vẽ nay khởi công thẳng, không có bước trung gian nào để mà
 * "sẵn sàng". Và câu "đủ tài nguyên để xây" cũng đổi nghĩa: không còn nguyên liệu để mà thiếu, nên
 * "xây được" = có ô hàng chờ trống + còn công trình chưa xây ở kỷ này. Một ô trống LÀ một việc:
 * mỗi phiên chỉ đẩy những gì đang nằm trong hàng chờ, nên hàng chờ trống là phiên bị bỏ phí.
 *
 * ⚠️ VÌ SAO CHÚNG NẰM Ở ĐÂY CHỨ KHÔNG NẰM TRONG `NotificationCenter.jsx` NHƯ TRƯỚC:
 * từ lúc điều hướng gộp ba màn (Kỹ năng · Kho báu · Thành tích) vào một tab "Hành trang",
 * có HAI chỗ cần cùng một câu trả lời — cái chuông thông báo và cái chấm trên tab "Hành
 * trang". Chép công thức sang chỗ thứ hai là đúng cái bẫy "một luật hai công thức" mà dự
 * án đã bị cắn nhiều lần: hai bản sao trôi khỏi nhau ở BIÊN (một bên đếm "đủ tiền mua",
 * bên kia đếm "chưa sở hữu") rồi cái chuông nói có việc trong khi cái chấm im, hoặc ngược
 * lại — và KHÔNG có gì đỏ lên. Nay chỉ có một công thức, hai người đọc.
 */

import { BLUEPRINT_CATALOG, SKILL_TREE } from './constants.js';
import { getEffectiveSkillCost } from './gameMath.js';
import { listNextProjects, slotState } from './buildChoices.js';

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

/**
 * Kỹ năng CHƯA đủ SP nhưng đã đủ tiên quyết — cái rẻ nhất trong số đó là "đích kế tiếp" để nói
 * *"còn N điểm nữa mở được «X»"*. Trả `null` khi không có gì để với tới.
 */
export function nextReachableSkill({
  sp = 0, unlockedSkills = {}, relics = [], relicEvolutions = {},
} = {}) {
  let best = null;
  for (const skill of ALL_SKILLS) {
    if (unlockedSkills[skill.id]) continue;
    if (!skill.requires.every((requirement) => unlockedSkills[requirement])) continue;
    const cost = getEffectiveSkillCost(skill.id, skill.spCost, relics, relicEvolutions);
    if (sp >= cost) continue;
    if (!best || cost < best.cost) best = { ...skill, cost, spNeeded: cost - sp };
  }
  return best;
}

/**
 * Công trình chọn được NGAY: kỷ đang chơi, chưa xây, chưa vào hàng chờ, và còn ô trống.
 * Rỗng khi hàng chờ đầy — lúc ấy không có việc gì để làm ở đây, đúng nghĩa đen.
 */
export function listBuildableBlueprints({
  activeBook = 1,
  buildings = [],
  craftingQueue = [],
} = {}) {
  if (slotState({ craftingQueue, activeBook }).free <= 0) return [];
  return listNextProjects({ activeBook, buildings, craftingQueue })
    .map((project) => BLUEPRINT_LOOKUP[project.bpId])
    .filter(Boolean);
}

/**
 * "Có ít nhất một cơ hội đang chờ không?" — dùng cho cái chấm trên tab "Hành trang".
 *
 * ⚠️ Chạy ngắt sớm theo thứ tự RẺ → ĐẮT: cái chấm được tính lại ở MỌI lần store đổi (kể cả
 * mỗi giây timer chạy), nên câu hỏi rẻ nhất phải đứng trước.
 */
export function hasReadyOpportunity(snapshot = {}) {
  if (listAvailableSkills(snapshot).length > 0) return true;
  return listBuildableBlueprints(snapshot).length > 0;
}

/**
 * "VIỆC TIẾP THEO" — MỘT việc duy nhất, để hiện thành một dòng ở màn Tập trung.
 *
 * ⚠️ VÌ SAO CẦN, KHI ĐÃ CÓ CÁI CHẤM VÀ CÁI CHUÔNG. Cái chấm trên tab "Hành trang" nói *"có
 * việc"*; nó KHÔNG nói *"việc gì"*. Một dòng chữ đọc trong một nhịp mắt, bấm được, đi thẳng tới
 * đúng chỗ.
 *
 * ⚠️ THỨ TỰ ƯU TIÊN — XÂY > KỸ NĂNG, và đây là một quyết định chứ không phải thứ tự tình cờ:
 *   · **Xây** cho kết quả NHÌN THẤY ĐƯỢC trong thành phố 3D ngay phiên sau, và một ô hàng chờ
 *     trống là một phiên sắp bị bỏ phí — thứ hết hạn sớm hơn.
 *   · **Kỹ năng** đứng sau dù rẻ về thao tác: phần thưởng của nó là mấy phần trăm cộng thêm,
 *     thứ không nhìn thấy được ở đâu cả; và từ ADR-069 nó còn được mời ngay trong chuỗi thẻ
 *     thưởng lúc lên cấp, nên dòng này ít khi phải nói thay.
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
  const skills = listAvailableSkills(snapshot);

  const total = buildable.length + skills.length;
  if (total === 0) return null;

  if (buildable.length > 0) {
    const [top] = buildable;
    return {
      id: 'workshop',
      icon: '🏗',
      label: top.label,
      text: `Hàng chờ xây đang trống — chọn «${top.label}» hoặc công trình khác`,
      action: { tab: 'collection', collectionTab: 'workshop' },
      // Một ô trống là MỘT việc, dù có 3 công trình để chọn — chọn xong một cái là hết việc.
      othersCount: skills.length,
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
