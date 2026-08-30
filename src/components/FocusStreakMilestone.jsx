/**
 * FocusStreakMilestone.jsx — MỘT DÒNG ở màn Tập trung: sắp chạm cột mốc chuỗi.
 *
 * ⚠️ VÌ SAO TỒN TẠI. Cột mốc chuỗi — kể cả mốc "Bền Vững" cho một **bonus VĨNH VIỄN** — vốn chỉ
 * hiện ở `FocusRail`, mà thẻ đó nằm trong cột phải `hidden … lg:flex`. Nghĩa là phần thưởng mạnh
 * nhất của cả game chưa bao giờ tới được iPhone, thiết bị Đàm dùng hằng ngày.
 *
 * ⚠️ CỘT GIỮA, cạnh `FocusCityTease`, `FocusNextAction`, `FocusStageCountdown`. Bốn dòng này cùng
 * trả lời một câu — *bấm Bắt đầu bây giờ thì được gì* — nhưng ở bốn thang thời gian khác nhau:
 * phiên này · việc kế tiếp · chặng của kỷ · chuỗi ngày.
 *
 * ⚠️ IM LẶNG LÀ MẶC ĐỊNH, VÀ Ở ĐÂY NÓ LÀ TRẠNG THÁI THƯỜNG GẶP. Engine chỉ mở miệng khi còn ≤3
 * ngày tới mốc (`STREAK_MILESTONE_NEAR_DAYS`) — nếu không thì bốn dòng sẽ cùng hiện và đẩy đồng
 * hồ xuống dưới nếp gấp, đúng cái vừa mất công kéo lên.
 */

import { motion } from 'framer-motion';

import { useEnterMotion, useRewardMotion } from '../lib/motionPresets';
import useStreakMilestone from '../hooks/useStreakMilestone';

export default function FocusStreakMilestone() {
  const enterMotion = useEnterMotion();
  // Nhịp `reward` — dành riêng cho phần thưởng và cột mốc; nguồn duy nhất là `lib/motionPresets.js`.
  const rewardMotion = useRewardMotion();
  const milestone = useStreakMilestone();

  if (!milestone) return null;

  // Hai giọng. `imminent` (mai là chạm) dùng nhịp phần thưởng và màu nhấn — chỗ dopamine mạnh nhất
  // nằm NGAY TRƯỚC đích. Còn xa hơn thì nói giọng thường: một dòng lúc nào cũng sáng rực thì chẳng
  // còn gì để sáng rực khi đáng.
  const strong = milestone.tone === 'imminent' || milestone.permanent;

  return (
    <motion.div
      className="mt-2 flex items-center justify-center gap-2 px-2 text-center"
      {...(strong ? rewardMotion : enterMotion)}
    >
      <span aria-hidden="true" className="text-[13px] leading-none">{strong ? '🔥' : '·'}</span>
      <span
        className="text-[12px] leading-snug"
        style={{ color: strong ? 'var(--accent2)' : 'var(--muted)', fontWeight: strong ? 600 : 400 }}
      >
        {milestone.text}
      </span>
    </motion.div>
  );
}
