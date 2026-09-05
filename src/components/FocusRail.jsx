/**
 * FocusRail.jsx — cột phải màn Tập trung (desktop): thẻ AI Coach.
 *
 * ⚠️ HAI THẺ "HÔM NAY" VÀ "CHUỖI" ĐÃ GỠ (2026-09-05, ADR-068). Chúng nay là `TodayHero` ở CỘT GIỮA —
 * chỗ cả iPhone lẫn desktop đều thấy. Cột này là `hidden … lg:flex`, nên bao lâu nay trên iPhone
 * chuỗi chỉ là một ô 68px ở thanh tiêu đề; giữ thêm bản ở đây là in cùng con số hai lần trên
 * cùng một màn hình desktop. Luật sẵn có: hai chỗ nói cùng một chuyện thì chỗ nói ít hơn nhường.
 *
 * Thẻ AI Coach: MỌI phản hồi do Gemini (đám mây) sinh — 2 nút: Hỏi Coach + AI phân tích tổng thể.
 */
import { motion } from 'framer-motion';
import { useEnterMotion } from '../lib/motionPresets';
import CoachChat from './CoachChat';
import CoachOffline from './CoachOffline';
import CoachNudge from './CoachNudge';

const cardStyle = {
  background: 'var(--card-bg-solid)',
  border: 'var(--skin-card-border-width,1px) solid var(--line)',
  borderRadius: 'var(--skin-radius-card,18px)',
  boxShadow: 'var(--skin-card-shadow)',
};

const eyebrow = 'mono text-[10px] uppercase tracking-[0.2em]';

export default function FocusRail({
  sessionsCompletedToday = 0,
  focusMinutesToday = 0,
  dailyGoalType = 'sessions',
  dailyGoalSessions = 5,
  dailyGoalMinutes = 125,
}) {
  const enterMotion = useEnterMotion();
  const goalProps = { sessionsCompletedToday, focusMinutesToday, dailyGoalType, dailyGoalSessions, dailyGoalMinutes };

  return (
    <div className="space-y-4">
      <motion.div {...enterMotion} style={cardStyle} className="p-4">
        <div className={eyebrow} style={{ color: 'var(--muted-2)' }}>AI Coach</div>
        <p className="mt-1.5 text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>
          Hỏi đáp & phân tích từ số liệu thật của bạn.
        </p>
        <CoachNudge {...goalProps} />
        <CoachChat {...goalProps} />
        <CoachOffline {...goalProps} />
      </motion.div>
    </div>
  );
}
