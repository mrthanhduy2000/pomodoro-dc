/**
 * FocusNextAction.jsx — MỘT DÒNG BẤM ĐƯỢC ở màn Tập trung: việc đáng làm tiếp theo là gì.
 *
 * ⚠️ VÌ SAO TỒN TẠI. Game có 51 kỹ năng, 75 công trình, 360 thành tích, 30 loại tài nguyên. Cái
 * chấm trên tab "Hành trang" nói *"có việc"* nhưng không nói *"việc gì"*, nên để biết mình làm
 * được gì, Đàm phải bấm vào tab, chọn giữa ba tab con, rồi tự dò trong mấy danh sách dài. Dòng
 * này trả lời thẳng, và bấm vào là tới đúng chỗ.
 *
 * ⚠️ CỘT GIỮA, KHÔNG PHẢI `FocusRail`. Cột phải là `hidden … lg:flex` — trên iPhone nó không bao
 * giờ hiện, mà iPhone mới là chỗ Đàm dùng nhiều nhất. Cùng lý do đã ghi ở `FocusCityTease.jsx`.
 *
 * ⚠️ IM LẶNG LÀ MẶC ĐỊNH: không có việc nào thì không render gì cả. Không khung rỗng, không "—".
 *
 * ⚠️ MỘT DÒNG, KHÔNG PHẢI MỘT BẢNG. Nếu liệt kê cả ba loại việc ở đây thì màn Tập trung — màn
 * yên tĩnh nhất của app, nơi Đàm tới để BẤM BẮT ĐẦU — biến thành một bảng điều khiển thứ hai.
 * Phần còn lại được nói bằng đúng một con số ("+2 việc nữa"), đủ để anh biết là còn, không đủ để
 * nó đòi được đọc ngay.
 */

import { motion } from 'framer-motion';

import { useEnterMotion, usePressMotion } from '../lib/motionPresets';
import useNextAction from '../hooks/useNextAction';

export default function FocusNextAction({ onNavigate }) {
  const enterMotion = useEnterMotion();
  const pressMotion = usePressMotion();
  const next = useNextAction();

  if (!next) return null;

  return (
    <motion.div className="mt-3 flex justify-center px-2" {...enterMotion}>
      <motion.button
        {...pressMotion}
        onClick={() => onNavigate?.(next.action)}
        className="flex max-w-full items-center gap-2 px-3 py-1.5 text-left transition-colors"
        style={{
          background: 'var(--card-bg-solid)',
          border: 'var(--skin-card-border-width,1px) solid var(--line)',
          borderRadius: 'var(--skin-radius-control, 14px)',
        }}
      >
        <span aria-hidden="true" className="text-[13px] leading-none">{next.icon}</span>
        <span className="truncate text-[12px] leading-snug" style={{ color: 'var(--ink-2)' }}>
          {next.text}
        </span>
        {next.othersCount > 0 && (
          <span
            className="mono shrink-0 text-[10px] leading-none"
            style={{ color: 'var(--muted-2)' }}
          >
            +{next.othersCount}
          </span>
        )}
      </motion.button>
    </motion.div>
  );
}
