/**
 * eraStage.js — CHẶNG TRONG MỘT KỶ: mốc gần nhất mà người chơi đang đi tới.
 *
 * ⚠️ VÌ SAO TỒN TẠI. Mỗi kỷ đã được chia sẵn 3 chặng từ lâu (`makeEraStages` ở `constants.js`),
 * nhưng suốt thời gian đó chặng chỉ là một NHÃN CHỮ. Cái đích duy nhất mà app nói tới là hết KỶ —
 * và một kỷ thì rất dài: ở nhịp 100 phút/ngày, kỷ 12–15 mất **107–189 ngày mỗi kỷ**, kỷ 8 mất ~51
 * ngày. Nghĩa là thanh tiến độ trên thanh tiêu đề nhúc nhích khoảng **1% mỗi phiên** và đầy đúng
 * MỘT lần mỗi vài tháng. Một cái đích xa tới mức không nhìn thấy mình đang tiến thì không phải
 * một cái đích.
 *
 * Chặng chia quãng ấy làm ba: mỗi phiên đẩy ~3%, và có **ba** lần "đầy thanh" mỗi kỷ thay vì một.
 * Không đổi một luật tính thưởng nào, không thêm hệ thống nào — chỉ đổi cái mốc đang được ĐO.
 *
 * ⚠️ MỘT LUẬT MỘT CÔNG THỨC. Phép "EP này thuộc chặng nào" trước đây là một hàm cục bộ nằm trong
 * `ResourceDisplay.jsx`, tức chỉ cột phải (`hidden … lg:flex` — iPhone không bao giờ thấy) mới
 * biết tới chặng. Nay ba nơi hỏi cùng một câu (thanh tiêu đề · màn Tập trung · cột phải) và cả ba
 * đọc chung file này. Chép lại phép tính sang chỗ thứ hai là cách hai bản sao trôi khỏi nhau ở
 * BIÊN — rồi thanh trên nói "chặng 2" trong khi thẻ dưới nói "chặng 1", và không có gì đỏ lên.
 *
 * THUẦN: không đọc store, không đụng `Date`, không DOM.
 */

import { ERA_METADATA } from './constants.js';

/** Số phiên gần nhất dùng để ước lượng "một phiên của tôi đáng bao nhiêu EP". */
export const STAGE_PACE_SAMPLE = 10;

/**
 * Chặng hiện tại của một kỷ, kèm tiến độ trong chặng.
 *
 * ⚠️ `epStart` của chặng là một mốc TUYỆT ĐỐI (tính từ EP tổng của cả ván chơi), không phải mốc
 * tính từ đầu kỷ — `makeEraStages` dựng nó bằng `eraStart + …`. Trừ nhầm gốc thì tiến độ ra âm ở
 * mọi kỷ trừ kỷ 1, và kỷ 1 lại là kỷ duy nhất một tài khoản mới đi qua, nên lỗi ấy sẽ không lộ ra
 * trong lúc thử.
 *
 * ⚠️ TRẢ CẢ `nextLabel` — VÀ ĐÂY LÀ CHỖ DỄ SAI NHẤT CỦA CẢ FILE. `label` là chặng ĐANG Ở, còn
 * `epEnd` là mốc KẾT THÚC nó. Bản đầu của `describeStageCountdown` viết "còn 3 phiên nữa tới
 * «{label}»" — tức hứa hẹn một thứ người chơi ĐANG ĐỨNG TRONG. Cái đích thật là chặng KẾ TIẾP,
 * và ở chặng cuối thì đích là KỶ MỚI (`nextLabel === null` để nơi gọi tự nói bằng chữ của nó).
 *
 * @returns {{label, nextLabel, index, total, epStart, epEnd, epInStage, epRange, epRemaining,
 *            progress} | null}
 *          `null` khi kỷ không khai chặng nào — nơi gọi phải tự lo, KHÔNG bịa ra một chặng giả.
 */
export function getEraStage(era, totalEP) {
  const stages = ERA_METADATA[era]?.stages;
  if (!Array.isArray(stages) || stages.length === 0) return null;

  const ep = Number.isFinite(totalEP) ? totalEP : 0;
  let index = 0;
  for (let i = stages.length - 1; i >= 0; i -= 1) {
    if (ep >= stages[i].epStart) { index = i; break; }
  }

  const stage = stages[index];
  const epRange = Math.max(1, stage.epEnd - stage.epStart);
  const epInStage = Math.max(0, Math.min(epRange, ep - stage.epStart));

  return {
    label: stage.label,
    // `null` ở chặng cuối = "hết chặng này là sang KỶ MỚI", không phải "không có gì tiếp theo".
    nextLabel: stages[index + 1]?.label ?? null,
    index,
    total: stages.length,
    epStart: stage.epStart,
    epEnd: stage.epEnd,
    epInStage,
    epRange,
    epRemaining: Math.max(0, stage.epEnd - ep),
    progress: epInStage / epRange,
  };
}

/**
 * "Một phiên của TÔI đáng bao nhiêu EP" — lấy TRUNG VỊ của `STAGE_PACE_SAMPLE` phiên gần nhất.
 *
 * ⚠️ TRUNG VỊ CHỨ KHÔNG PHẢI TRUNG BÌNH. Lịch sử có cả phiên 5 phút lẫn phiên 90 phút; một phiên
 * dài bất thường kéo trung bình lên và biến "còn 3 phiên" thành "còn 1 phiên" — một lời hứa hụt.
 * Trung vị chịu được ngoại lệ, đúng thứ cần cho một con số dùng để hứa hẹn.
 *
 * ⚠️ CHƯA ĐỦ MẪU THÌ TRẢ `null`, KHÔNG trả một giá trị mặc định. Đây là luật trung thực đã áp cho
 * AI Coach (`engine/coach/guard.js`) và cho `cityMoment.js`: thà không nói gì còn hơn nói một con
 * số bịa. Một tài khoản mới chưa có phiên nào thì không có cách nào biết nhịp của người ấy.
 */
export function medianSessionEP(history, sample = STAGE_PACE_SAMPLE) {
  const values = (Array.isArray(history) ? history : [])
    .slice(0, Math.max(1, sample))
    .map((entry) => Number(entry?.epEarned))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  if (values.length === 0) return null;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 1
    ? values[middle]
    : (values[middle - 1] + values[middle]) / 2;
}

/**
 * "Còn mấy phiên nữa tới hết chặng?" — `null` khi chưa đủ dữ liệu để nói.
 *
 * Làm TRÒN LÊN: còn 1,2 phiên nghĩa là phải làm 2 phiên. Làm tròn xuống là hứa một thứ sẽ không
 * xảy ra, và một lời hứa hụt thì làm hỏng mọi lời hứa sau đó.
 */
export function sessionsToStageEnd(epRemaining, epPerSession) {
  if (!Number.isFinite(epRemaining) || epRemaining <= 0) return 0;
  if (!Number.isFinite(epPerSession) || epPerSession <= 0) return null;
  return Math.ceil(epRemaining / epPerSession);
}

/**
 * Câu chữ cho dòng đếm ngược ở màn Tập trung — hoặc `null` để KHÔNG render gì.
 *
 * ⚠️ BA TRẠNG THÁI, VÀ TRẠNG THÁI "SẮP TỚI" LÀ LÝ DO CẢ HÀM NÀY TỒN TẠI. Chỗ dopamine mạnh nhất
 * không nằm ở lúc nhận thưởng mà ở ngay TRƯỚC đó — khi cái đích đã nhìn thấy được và còn đúng một
 * bước. Nên khi còn ≤1 phiên, dòng này đổi giọng và đổi màu; hai trạng thái kia nói bằng giọng
 * bình thường, vì một dòng lúc nào cũng sáng rực thì chẳng còn gì để sáng rực khi đáng.
 */
export function describeStageCountdown(stage, epPerSession) {
  if (!stage) return null;

  const sessions = sessionsToStageEnd(stage.epRemaining, epPerSession);

  // Chưa đủ mẫu để quy ra phiên ⇒ vẫn nói được cái đích, chỉ là nói bằng EP.
  // Chặng cuối thì cái đích không còn là một chặng nữa — nó là cả một kỷ mới. Nói đúng tên của
  // nó, vì đó là phần thưởng LỚN nhất game và gọi nó là "chặng" thì làm nó nhỏ đi.
  const dich = stage.nextLabel ? `«${stage.nextLabel}»` : 'KỶ MỚI';

  if (sessions === null) {
    return {
      tone: 'normal',
      text: `Còn ${Math.round(stage.epRemaining).toLocaleString('vi-VN')} EP nữa tới ${dich}`,
    };
  }

  if (sessions <= 1) {
    return { tone: 'imminent', text: `Một phiên nữa là tới ${dich}` };
  }

  return { tone: 'normal', text: `Còn ~${sessions} phiên nữa tới ${dich}` };
}
