/**
 * FocusMoment.jsx — ĐÚNG MỘT DÒNG "khoảnh khắc" ở màn Tập trung, chọn ra từ ba nguồn.
 *
 * ⚠️ VÌ SAO GỘP (2026-08-30). Trước đó có BA component riêng, mỗi cái tự quyết có hiện hay không:
 * `FocusStageCountdown` (còn ≤12 phiên tới hết chặng) · `FocusStreakMilestone` (còn ≤3 ngày tới mốc
 * chuỗi) · `FocusWeeklyReportTease` (chưa xem tổng kết tuần). Ba cái gác ấy **ĐỘC LẬP nhau**, nên
 * về mặt cấu trúc cả ba CÓ THỂ cùng nổ — cộng `FocusCityTease` và `FocusNextAction` là **năm dòng**
 * (~130px) đẩy đồng hồ xuống dưới nếp gấp, đúng cái vừa mất công kéo lên. Ở đây không có "hiếm nên
 * chắc không sao": ba điều kiện độc lập thì sớm muộn cũng trùng nhau một ngày, và ngày đó không ai
 * biết trước.
 *
 * ⚠️ VÀ NÓ CŨNG ĐƠN GIẢN HƠN THẬT, KHÔNG CHỈ AN TOÀN HƠN. Ba dòng ấy trả lời CÙNG một câu — *bấm
 * Bắt đầu bây giờ thì được gì* — chỉ khác thang thời gian. Ba câu trả lời cùng lúc cho một câu hỏi
 * là nhiễu, không phải nhiều thông tin.
 *
 * ⚠️ TẠI SAO KHÔNG DÙNG LẠI BA COMPONENT CŨ MÀ CHỈ CHỌN CÁI NÀO ĐƯỢC RENDER: làm thế thì mỗi hook
 * bị gọi HAI lần (một lần ở đây để biết chọn ai, một lần trong chính component con). Với
 * `useStageCountdown` điều đó SAI THẬT chứ không chỉ phí: nó giữ một `useState` cho dấu "đã ăn
 * mừng", nên hai bản sao có hai state riêng — bấm tắt ở con thì bản ở đây không hay biết và vẫn
 * tiếp tục chọn nhánh ăn mừng. Nên chỗ này gọi hook MỘT lần rồi tự dựng hình.
 *
 * THỨ TỰ ƯU TIÊN, và lý do của từng bậc:
 *   1. **Ăn mừng vừa qua mốc chặng** — ăn mừng thì phải NGAY, để lỡ là mất luôn; nó cũng là phần
 *      thưởng cho cái đích mà chính dòng này đã dựng lên mấy phiên trước.
 *   2. **Tổng kết tuần chưa xem** — phần thưởng cho cả một tuần, và mỗi tuần chỉ có một lần.
 *   3. **Sắp chạm mốc chuỗi** — thứ mất đi thì không lấy lại được (chuỗi đứt là đứt hẳn).
 *   4. **Đếm ngược tới hết chặng** — cái đích xa nhất trong ba, nên nhường trước.
 */

import { motion } from 'framer-motion';

import { useEnterMotion, useRewardMotion } from '../lib/motionPresets';
import useStageCountdown from '../hooks/useStageCountdown';
import useStreakMilestone from '../hooks/useStreakMilestone';
import { pickFocusMoment } from './focusMomentPick';

export default function FocusMoment({ weeklyUnseen = false, onOpenWeekly, sessionInProgress = false }) {
  const enterMotion = useEnterMotion();
  // Nhịp `reward` — dành riêng cho phần thưởng và cột mốc; nguồn duy nhất là `lib/motionPresets.js`.
  const rewardMotion = useRewardMotion();
  const stage = useStageCountdown();
  const streak = useStreakMilestone();

  const moment = pickFocusMoment({ stage, streak, weeklyUnseen, sessionInProgress, onOpenWeekly });
  if (!moment) return null;

  const motionProps = moment.strong ? rewardMotion : enterMotion;
  const body = (
    <>
      <span aria-hidden="true" className="text-[13px] leading-none">{moment.icon}</span>
      <span
        className="text-[12px] leading-snug"
        style={{ color: moment.strong ? 'var(--accent2)' : 'var(--muted)', fontWeight: moment.strong ? 600 : 400 }}
      >
        {moment.text}
      </span>
    </>
  );

  // Có việc để làm thì nó là một cái NÚT. Lời chúc mừng bấm được để tắt — nó chiếm chỗ của dòng
  // đếm ngược nên phải có đường trả lại chỗ ấy; và nó KHÔNG tự tắt theo đồng hồ, vì một cột mốc
  // vài tuần mới có một lần thì đáng được ở lại cho tới khi Đàm thật sự nhìn thấy.
  if (moment.onClick) {
    return (
      <motion.button
        type="button"
        onClick={moment.onClick}
        className="mt-2 flex w-full items-center justify-center gap-2 px-2 text-center"
        {...motionProps}
      >
        {body}
      </motion.button>
    );
  }

  return (
    <motion.div className="mt-2 flex items-center justify-center gap-2 px-2 text-center" {...motionProps}>
      {body}
    </motion.div>
  );
}
