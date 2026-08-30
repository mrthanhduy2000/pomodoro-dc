/**
 * FocusStageCountdown.jsx — MỘT DÒNG ở màn Tập trung: còn mấy phiên nữa tới mốc kế tiếp.
 *
 * ⚠️ VÌ SAO TỒN TẠI. Cái đích duy nhất app từng nói tới là hết KỶ, mà một kỷ mất 12–189 ngày tuỳ
 * kỷ. "Còn 547 EP" thì không ai hình dung được là bao lâu; "còn ~3 phiên nữa" thì hình dung được
 * ngay, và nó là thứ khiến người ta làm thêm một phiên. Cùng một sự thật, hai cách nói, hai kết quả.
 *
 * ⚠️ CỘT GIỮA, cạnh `FocusCityTease` và `FocusNextAction` — cột phải là `hidden … lg:flex` nên
 * iPhone không bao giờ thấy. Ba dòng này cùng trả lời một câu: *bấm Bắt đầu bây giờ thì được gì.*
 *
 * ⚠️ IM LẶNG LÀ MẶC ĐỊNH: engine trả `null` thì không render gì.
 */

import { motion } from 'framer-motion';

import { useEnterMotion, useRewardMotion } from '../lib/motionPresets';
import useStageCountdown from '../hooks/useStageCountdown';

export default function FocusStageCountdown() {
  const enterMotion = useEnterMotion();
  // Nhịp `reward` — dành riêng cho phần thưởng và cột mốc. Ba nhịp là nguồn duy nhất
  // (`lib/motionPresets.js`); đừng gõ lại `initial`/`animate` bằng tay ở đây.
  const rewardMotion = useRewardMotion();
  const countdown = useStageCountdown();

  if (!countdown) return null;

  // Ba giọng, và thứ tự này là cả điểm của component:
  //   · `celebrate` — VỪA vượt mốc. Đây là phần thưởng cho cái đích mà chính dòng này đã dựng lên
  //     mấy phiên trước; thiếu nó thì lời hứa "còn 3 phiên nữa tới «…»" kết thúc bằng im lặng.
  //   · `imminent`  — còn ≤1 phiên. Chỗ dopamine mạnh nhất nằm NGAY TRƯỚC đích.
  //   · `normal`    — còn xa, nói bằng giọng thường. Một dòng lúc nào cũng sáng rực thì chẳng còn
  //     gì để sáng rực khi đáng.
  const celebrate = countdown.tone === 'celebrate';
  const imminent = countdown.tone === 'imminent';
  const strong = celebrate || imminent;
  const icon = celebrate ? '🎉' : (imminent ? '🔥' : '◈');
  const motionProps = celebrate ? rewardMotion : enterMotion;

  const body = (
    <>
      <span aria-hidden="true" className="text-[13px] leading-none">{icon}</span>
      <span
        className="text-[12px] leading-snug"
        style={{ color: strong ? 'var(--accent2)' : 'var(--muted)', fontWeight: strong ? 600 : 400 }}
      >
        {countdown.text}
      </span>
    </>
  );

  // Lời chúc mừng BẤM ĐƯỢC để tắt — nó chiếm chỗ của dòng đếm ngược, nên phải có đường trả lại
  // chỗ ấy. Không tự tắt theo đồng hồ: một cột mốc vài tuần mới có một lần thì đáng được ở lại
  // cho tới khi Đàm thật sự nhìn thấy (cùng lý do cái chấm "chưa xem" của báo cáo tuần không hết hạn).
  if (celebrate) {
    return (
      <motion.button
        type="button"
        onClick={countdown.dismiss}
        aria-label={`${countdown.text} — chạm để tắt`}
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
