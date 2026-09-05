/**
 * weeklyChainStep.js — TRẠNG THÁI CỦA MỘT BƯỚC trong chuỗi tuần, tính MỘT LẦN ở MỘT chỗ.
 *
 * VÌ SAO TÁCH RA (2026-09-01): `DailyMissions.jsx` từng suy trạng thái của một bước bằng HAI
 * biểu thức độc lập nằm cạnh nhau —
 *     cột chữ:  `isCurrent ? 'N/M' : done ? 'Đã chốt' : 'Đang chờ'`
 *     cột phần trăm: `isCurrent ? pct : index < currentIndex ? '100%' : '0%'`
 * — và hai biểu thức ấy NÓI NGƯỢC NHAU đúng lúc chuỗi tuần hoàn tất. Khi xong chuỗi:
 * `chainStepIndex = steps.length − 1` (=3 với chuỗi 4 bước) còn `chainStepsCompleted =
 * steps.length` (=4). Ở bước CUỐI: `done = 3 < 4 = true` ⇒ in "Đã chốt", nhưng
 * `index < currentIndex` = `3 < 3` = false ⇒ in "0%". Một bước vừa hoàn tất bị báo cáo là 0%,
 * ngay tại khoảnh khắc trả phần thưởng lớn nhất của tuần.
 *
 * ⚠️ KHÔNG cổng nào bắt được, vì mỗi biểu thức đều ĐÚNG theo công thức của riêng nó. Đó chính
 * là cái giá của việc mã hoá MỘT sự thật bằng HAI công thức — bài học "một luật một công thức",
 * lần này ở tầng giao diện.
 *
 * ⚠️ FILE `.js` THUẦN chứ không nằm trong `.jsx`: `node --test` không biên dịch được JSX, nên
 * một luật sống trong `.jsx` là một luật không test được. Quy ước ở `PROJECT_STRUCTURE.md`.
 */

/** Ba trạng thái có thể có của một bước. Không có trạng thái thứ tư. */
export const CHAIN_STEP_STATE = {
  DA_CHOT: 'daChot',
  DANG_LAM: 'dangLam',
  DANG_CHO: 'dangCho',
};

/**
 * @param {object} p
 * @param {number} p.index         thứ tự bước (0-based)
 * @param {number} p.currentStep   `weeklyChain.currentStep` — SỐ BƯỚC ĐÃ XONG, không phải chỉ số
 * @param {number} p.totalSteps    tổng số bước của chuỗi
 * @returns {{state: string, done: boolean, isCurrent: boolean}}
 */
export function weeklyChainStepState({ index, currentStep = 0, totalSteps = 0 }) {
  const xong = Math.max(0, Math.min(totalSteps, Number(currentStep) || 0));
  // ⚠️ `currentStep` đếm SỐ BƯỚC ĐÃ XONG. Nên bước thứ `xong` (0-based) là bước ĐANG LÀM, và mọi
  // bước có chỉ số nhỏ hơn `xong` là đã chốt. Khi `xong === totalSteps` thì KHÔNG còn bước nào
  // đang làm — đó chính là ca mà bản cũ vẫn trỏ `currentIndex` vào bước cuối rồi tự mâu thuẫn.
  if (index < xong) return { state: CHAIN_STEP_STATE.DA_CHOT, done: true, isCurrent: false };
  if (index === xong && xong < totalSteps) {
    return { state: CHAIN_STEP_STATE.DANG_LAM, done: false, isCurrent: true };
  }
  return { state: CHAIN_STEP_STATE.DANG_CHO, done: false, isCurrent: false };
}
