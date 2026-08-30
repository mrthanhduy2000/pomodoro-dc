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

import { useEnterMotion } from '../lib/motionPresets';
import useStageCountdown from '../hooks/useStageCountdown';

export default function FocusStageCountdown() {
  const enterMotion = useEnterMotion();
  const countdown = useStageCountdown();

  if (!countdown) return null;

  // "Sắp tới nơi" là tin đáng chú ý — chỗ dopamine mạnh nhất nằm NGAY TRƯỚC đích, không phải ở
  // lúc nhận thưởng. Hai trạng thái kia nói bằng giọng bình thường: một dòng lúc nào cũng sáng
  // rực thì chẳng còn gì để sáng rực khi đáng. Cùng luật với `FocusCityTease`.
  const imminent = countdown.tone === 'imminent';

  return (
    <motion.div className="mt-2 flex items-center justify-center gap-2 px-2 text-center" {...enterMotion}>
      <span aria-hidden="true" className="text-[13px] leading-none">{imminent ? '🔥' : '◈'}</span>
      <span
        className="text-[12px] leading-snug"
        style={{ color: imminent ? 'var(--accent2)' : 'var(--muted)', fontWeight: imminent ? 600 : 400 }}
      >
        {countdown.text}
      </span>
    </motion.div>
  );
}
