/**
 * WeekStrip.jsx — bảy ô T2→CN của tuần này. CHỈ VẼ; dữ liệu do `buildWeekStrip` (todayHero.js) lo.
 *
 * Dùng ở HAI chỗ với đúng một hình: khối "Hôm nay" ở màn Tập trung và thẻ Chuỗi trong chuỗi thẻ
 * thưởng sau phiên. Đó là chủ ý: thứ Đàm thấy lúc mở app phải là thứ được TÔ THÊM MỘT Ô lúc xong
 * phiên — cùng một vật, hai khoảnh khắc.
 *
 * Bốn trạng thái, đọc được KHÔNG cần màu (luật ADR-060): đã làm = tô đặc + dấu ✓ · hôm nay chưa
 * làm = vòng nét đứt · đã qua mà bỏ = vòng mảnh xám · chưa tới = chấm nhỏ.
 */
import { motion } from 'framer-motion';
import { useRewardMotion } from '../lib/motionPresets';

function dotStyle(day, size) {
  const base = { width: size, height: size };
  if (day.done) {
    return { ...base, background: 'var(--accent)', color: 'var(--canvas)', border: '2px solid var(--accent)' };
  }
  if (day.isToday) {
    return { ...base, background: 'transparent', border: '2px dashed var(--accent)' };
  }
  if (day.isFuture) {
    return { ...base, background: 'transparent', border: '1.5px solid var(--line)' };
  }
  return { ...base, background: 'transparent', border: '1.5px solid var(--line-2)' };
}

export default function WeekStrip({ days = [], size = 'sm', popToday = false }) {
  // Nhịp `reward` chỉ cho Ô HÔM NAY vừa được tô — đúng nghĩa một phần thưởng vừa tới.
  const rewardMotion = useRewardMotion();
  const px = size === 'lg' ? 32 : 22;

  return (
    <div className="grid grid-cols-7 gap-1" role="list" aria-label="Tuần này">
      {days.map((day) => {
        const pop = popToday && day.isToday && day.done;
        const Dot = pop ? motion.span : 'span';
        return (
          <div key={day.key} role="listitem" className="flex flex-col items-center gap-1.5">
            <span
              className="mono text-[10px] uppercase leading-none tracking-[0.08em]"
              style={{ color: day.isToday ? 'var(--accent2)' : 'var(--muted-2)', fontWeight: day.isToday ? 700 : 500 }}
            >
              {day.label}
            </span>
            <Dot
              {...(pop ? rewardMotion : {})}
              className="flex items-center justify-center rounded-full"
              style={dotStyle(day, px)}
              aria-label={day.done ? `${day.label}: đã có phiên` : day.isToday ? `${day.label}: hôm nay` : day.label}
            >
              {day.done && (
                <svg width={px * 0.5} height={px * 0.5} viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2.5 6.5 5 9l4.5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </Dot>
          </div>
        );
      })}
    </div>
  );
}
