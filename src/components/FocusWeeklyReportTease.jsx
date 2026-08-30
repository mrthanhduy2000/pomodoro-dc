/**
 * FocusWeeklyReportTease.jsx — MỘT DÒNG ở màn Tập trung: tổng kết tuần đang chờ được xem.
 *
 * ⚠️ VÌ SAO TỒN TẠI. `WeeklyReportModal` là màn ĐẦY DOPAMINE NHẤT của cả app — một con số to
 * ("15g14p"), một mức tăng ("+19% so với tuần trước"), một điểm hạng ("A · Xuất Sắc"), số ngày hoạt
 * động ("6/7"). Nó là phần thưởng cho cả một tuần làm việc. Vậy mà trên iPhone, tín hiệu DUY NHẤT
 * báo có nó là **một chấm tròn 6px nằm BÊN TRONG một menu phải bấm mới mở ra** ("Thêm" → "Báo cáo
 * tuần"). Tức phần thưởng lớn nhất được thông báo bằng thứ nhỏ nhất, ở chỗ khuất nhất.
 *
 * ⚠️ KHÔNG TÍNH LẠI GÌ CẢ, VÀ ĐÓ LÀ CHỦ Ý. Điểm hạng và các con số tuần nằm trong
 * `WeeklyReportModal` dưới dạng hằng số cấp module (`GRADES`, `computeWeekStats`); kéo chúng ra đây
 * để in sẵn lên dòng này sẽ hoặc phải chép lại công thức (đúng cái bẫy "một luật hai công thức" mà
 * dự án đã trả giá nhiều lần), hoặc phải tách một module engine mới cho một dòng chữ. Dòng này chỉ
 * làm đúng một việc: NÓI RẰNG CÓ, và mở ra. Con số ở lại đúng chỗ nó đang sống.
 *
 * ⚠️ ẨN KHI PHIÊN ĐANG CHẠY — nó là một lời mời đi xem chỗ khác, cùng luật với `FocusNextAction`.
 * ⚠️ IM LẶNG LÀ MẶC ĐỊNH: tuần nào đã xem rồi thì không render gì. Mỗi tuần nhiều nhất một lần.
 */

import { motion } from 'framer-motion';

import { useRewardMotion } from '../lib/motionPresets';

export default function FocusWeeklyReportTease({ unseen, onOpen }) {
  // Nhịp `reward` — dành riêng cho phần thưởng và cột mốc, và đây đúng là một phần thưởng.
  const rewardMotion = useRewardMotion();

  if (!unseen || typeof onOpen !== 'function') return null;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      className="mt-2 flex w-full items-center justify-center gap-2 px-2 text-center"
      {...rewardMotion}
    >
      <span aria-hidden="true" className="text-[13px] leading-none">🏆</span>
      <span className="text-[12px] font-semibold leading-snug" style={{ color: 'var(--accent2)' }}>
        Tổng kết tuần trước đã xong — xem thử
      </span>
    </motion.button>
  );
}
