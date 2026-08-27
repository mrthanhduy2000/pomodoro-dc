/**
 * FocusCityTease.jsx — MỘT DÒNG dưới đồng hồ: phiên này đang đẩy cái gì tới đâu.
 *
 * ⚠️ VÌ SAO Ở CỘT GIỮA chứ không phải cột phải: `FocusRail` (thẻ Hôm nay/Chuỗi/AI Coach) là
 * `hidden … lg:flex` — CHỈ hiện trên màn rộng. Đàm làm việc chủ yếu trên iPhone, nên một thẻ đặt ở
 * cột phải là một thẻ anh **không bao giờ nhìn thấy**. Cột giữa hiện ở mọi khổ màn hình.
 *
 * ⚠️ VÌ SAO CHỈ MỘT DÒNG: đây là màn Tập trung. Thẻ "Đang xây" đầy đủ (còn bao xa, mở khoá gì) đã
 * có ở tab Thành Phố; nhồi lại nguyên bảng đó vào đây là biến màn hình yên tĩnh nhất của app thành
 * một bảng điều khiển. Ở đây chỉ cần đúng một câu, đọc trong một nhịp mắt.
 *
 * ⚠️ IM LẶNG LÀ MẶC ĐỊNH: engine trả `null` thì không render gì cả — không có khung rỗng, không có
 * "—". Một dòng trống chừa chỗ sẵn còn phá sự yên tĩnh hơn là không có dòng nào.
 */

import { motion } from 'framer-motion';
import { useEnterMotion } from '../../lib/motionPresets';

import { useCityFocusTease } from '../../hooks/useCityMoment';

export default function FocusCityTease() {
  const enterMotion = useEnterMotion();
  const tease = useCityFocusTease(true);

  if (!tease) return null;

  // "Sắp xong" là tin đáng chú ý — nó được dùng màu nhấn. Hai trạng thái còn lại nói bằng giọng
  // bình thường: một dòng phụ lúc nào cũng sáng rực thì chẳng còn gì để sáng rực khi đáng.
  const imminent = tease.tone === 'imminent';
  const color = imminent ? 'var(--accent2)' : 'var(--muted)';
  const pct = Math.round((tease.progress ?? 0) * 100);

  return (
    <motion.div
      className="mt-3 flex items-center justify-center gap-2 px-2 text-center"
      {...enterMotion}
    >
      <span aria-hidden="true" className="text-[13px] leading-none">{tease.icon}</span>
      <span className="text-[12px] leading-snug" style={{ color, fontWeight: imminent ? 600 : 400 }}>
        {tease.text}
      </span>
      {tease.bpId && (
        // Thanh chỉ dài 44px: nó là dấu nhấn cho câu chữ, không phải một thanh tiến độ để đọc số.
        <span
          className="hidden h-1 w-11 overflow-hidden rounded-full sm:block"
          style={{ background: 'var(--line-2)' }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Tiến độ ${tease.text}`}
        >
          <span
            className="block h-full rounded-full"
            style={{ width: `${pct}%`, background: imminent ? 'var(--accent2)' : 'var(--accent)' }}
          />
        </span>
      )}
    </motion.div>
  );
}
