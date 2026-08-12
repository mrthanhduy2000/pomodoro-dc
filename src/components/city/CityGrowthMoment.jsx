/**
 * CityGrowthMoment.jsx — 3,2 giây thành phố lớn lên, chen giữa "hết phiên" và "hộp thoại phần thưởng".
 *
 * ⚠️ LUẬT AN TOÀN SỐ 1 — ĐỌC TRƯỚC KHI SỬA BẤT KỲ DÒNG NÀO:
 * Màn này đứng CHẶN TRƯỚC `LootDropModal`. Một lỗi ở đây không làm "mất hiệu ứng đẹp" — nó **nuốt
 * mất màn hình phần thưởng của một phiên làm việc thật**. Vì vậy mọi thứ ở đây được thiết kế để
 * HỎNG THEO HƯỚNG MỞ:
 *   • Không có gì thật để khoe (`moment === null`) ⇒ bên gọi đi thẳng vào hộp thoại phần thưởng.
 *   • Có một `setTimeout` bảo hiểm: dù hoạt hoạ có kẹt thế nào, 3,2 giây là màn này tự nhường chỗ.
 *   • Chạm vào bất cứ đâu là bỏ qua ngay.
 *   • KHÔNG dựng cảnh 3D ở đây. Trang chủ đã có một WebGL context cho lớp nền; mở thêm context
 *     thứ hai đúng lúc máy vừa chạy xong 25 phút là cách nhanh nhất để iOS thu hồi cả hai.
 *
 * Ba luật cứng của kế hoạch, giữ nguyên: **một chạm là bỏ qua · tối đa 3,5 s · `useReducedMotion`
 * tắt sạch** (bên gọi không dựng màn này khi Đàm bật giảm chuyển động ở mức hệ điều hành).
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { eraSolid } from './cityTokens';

/** Tổng thời gian màn này chiếm sóng. Kế hoạch cho trần 3,5 s — giữ dưới trần. */
export const MOMENT_MS = 3200;

export default function CityGrowthMoment({ moment, era, onDone }) {
  const [filled, setFilled] = useState(false);

  // Giữ `onDone` trong ref: nó là hàm mới ở mỗi lượt render cha, mà đồng hồ bảo hiểm dưới đây
  // TUYỆT ĐỐI không được đặt lại theo nó — cứ mỗi lượt render mà hẹn giờ lại thì 3,2 giây không
  // bao giờ trôi hết, và hộp thoại phần thưởng không bao giờ hiện ra.
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    // Cho thanh tiến độ một khung hình ở vạch xuất phát rồi mới chạy — đặt trạng thái đích ngay
    // trong lượt render đầu thì trình duyệt gộp hai giá trị làm một và không có gì chuyển động.
    const start = window.setTimeout(() => setFilled(true), 260);
    const guard = window.setTimeout(() => onDoneRef.current?.(), MOMENT_MS);
    return () => { window.clearTimeout(start); window.clearTimeout(guard); };
  }, []);

  if (!moment) return null;

  const accent = eraSolid(era);
  const from = Math.round((moment.fromProgress ?? 0) * 100);
  const to = Math.round((moment.progress ?? 0) * 100);

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center px-6"
      style={{ background: 'rgba(20,18,16,0.55)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={() => onDoneRef.current?.()}
      role="status"
      aria-live="polite"
      aria-label={`${moment.headline}: ${moment.detail}`}
    >
      <motion.div
        className="w-full max-w-[340px] rounded-[18px] p-5 text-center"
        style={{ background: 'var(--panel-strong, var(--canvas))', border: '1px solid var(--line)' }}
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="text-[40px] leading-none"
          aria-hidden="true"
          initial={{ scale: 0.7, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {moment.icon}
        </motion.div>

        <div
          className="mono mt-3 text-[10px] uppercase tracking-[0.2em]"
          style={{ color: accent }}
        >
          {moment.headline}
        </div>
        <div
          className="mt-1.5 text-[15px] font-semibold leading-snug"
          style={{ color: 'var(--ink)', fontFamily: 'var(--skin-font-display, inherit)' }}
        >
          {moment.detail}
        </div>

        <div
          className="mt-4 h-2 w-full overflow-hidden rounded-full"
          style={{ background: 'var(--line-2)' }}
          role="progressbar"
          aria-valuenow={to}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/*
            Chạy từ vạch THẬT của phiên trước tới vạch hiện tại. Đây là toàn bộ nội dung cảm xúc
            của màn này: mắt nhìn thấy cái nấc vừa nhích lên, chứ không phải đọc một con số.
          */}
          <motion.div
            className="h-full rounded-full"
            style={{ background: accent }}
            initial={{ width: `${from}%` }}
            animate={{ width: `${filled ? to : from}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <div className="mt-3 text-[11px]" style={{ color: 'var(--muted)' }}>
          Chạm để tiếp tục
        </div>
      </motion.div>
    </motion.div>
  );
}
