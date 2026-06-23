/**
 * FocusRail.jsx — cột phải màn Tập trung: 3 thẻ Hôm nay / Chuỗi / AI Coach.
 * Thẻ AI Coach: MỌI phản hồi do AI Qwen 3B chạy trên máy sinh (2 nút: Hỏi Coach +
 * Coach offline). Chỉ hiện khi máy chạy được Qwen (desktop có WebGPU). Skin-aware.
 */
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { calculateStreakMilestoneProgress } from '../engine/gameMath';
import { localWeekMondayStr } from '../engine/time';
import { detectWebLLMCapable } from '../engine/llm/coachPrompt';
import CoachChat from './CoachChat';
import CoachOffline from './CoachOffline';
import { FlameGlyph, ShieldGlyph } from './icons/Glyph';

const cardStyle = {
  background: 'var(--card-bg-solid)',
  border: 'var(--skin-card-border-width,1px) solid var(--line)',
  borderRadius: 'var(--skin-radius-card,18px)',
  boxShadow: 'var(--skin-card-shadow)',
};

const eyebrow = 'mono text-[10px] uppercase tracking-[0.2em]';

function Bar({ pct, color = 'var(--accent)' }) {
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--timer-track)' }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }} />
    </div>
  );
}

function PlanItem({ done, label }) {
  return (
    <div className="flex items-center gap-2 text-[12px]" style={{ color: done ? 'var(--ink-2)' : 'var(--muted)' }}>
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{
          background: done ? 'var(--good)' : 'transparent',
          border: done ? 'none' : '1.5px solid var(--line-2)',
          color: '#fff',
        }}
      >
        {done ? '✓' : ''}
      </span>
      {label}
    </div>
  );
}

export default function FocusRail({
  sessionsCompletedToday = 0,
  focusMinutesToday = 0,
  dailyGoalType = 'sessions',
  dailyGoalSessions = 5,
  dailyGoalMinutes = 125,
}) {
  const streak = useGameStore((s) => s.streak);
  const hasShield = useGameStore((s) => !!s.player.unlockedSkills?.la_chan_streak);
  const dailyTracking = useGameStore((s) => s.dailyTracking);

  const useMinutes = dailyGoalType === 'minutes';
  const goalValue = useMinutes ? dailyGoalMinutes : dailyGoalSessions;
  const currentValue = useMinutes ? focusMinutesToday : sessionsCompletedToday;
  const unit = useMinutes ? 'phút' : 'phiên';
  const goalPct = goalValue > 0 ? (currentValue / goalValue) * 100 : 0;
  const goalMet = currentValue >= goalValue;
  const deepDone = !!dailyTracking?.hasSession45 || (dailyTracking?.deepSessionsCompleted ?? 0) > 0;

  const currentStreak = streak?.currentStreak ?? 0;
  const shieldAvailable = hasShield && streak?.skipShieldUsedWeekKey !== localWeekMondayStr();
  const milestone = calculateStreakMilestoneProgress(currentStreak);

  const aiCapable = detectWebLLMCapable();

  return (
    <div className="space-y-4">
      {/* HÔM NAY */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={cardStyle} className="p-4">
        <div className={eyebrow} style={{ color: 'var(--muted-2)' }}>Hôm nay</div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-[26px] font-semibold leading-none" style={{ fontFamily: 'var(--skin-font-display)', color: 'var(--ink)' }}>
            {currentValue}
          </span>
          <span className="text-[12px]" style={{ color: 'var(--muted-2)' }}>/ {goalValue} {unit}</span>
        </div>
        <Bar pct={goalPct} color="var(--good)" />
        <div className="mt-3 space-y-1.5">
          <PlanItem done={goalMet} label={`Đạt mục tiêu ngày (${goalValue} ${unit})`} />
          <PlanItem done={deepDone} label="Một phiên sâu ≥45′" />
        </div>
      </motion.div>

      {/* CHUỖI */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={cardStyle} className="p-4">
        <div className="flex items-center justify-between">
          <div className={eyebrow} style={{ color: 'var(--muted-2)' }}>Chuỗi</div>
          {hasShield && (
            <span
              title={shieldAvailable ? 'Lá chắn chuỗi: còn dùng tuần này' : 'Lá chắn chuỗi: đã dùng tuần này'}
              style={{ opacity: shieldAvailable ? 1 : 0.32, color: 'var(--good)', display: 'inline-flex' }}
            >
              <ShieldGlyph size={15} />
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-[26px] font-semibold leading-none" style={{ fontFamily: 'var(--skin-font-display)', color: 'var(--accent2)' }}>
            {currentStreak}
          </span>
          <span style={{ color: 'var(--accent)', display: 'inline-flex' }}><FlameGlyph size={17} /></span>
          <span className="text-[12px]" style={{ color: 'var(--muted-2)' }}>ngày</span>
        </div>
        {milestone.nextMilestone && milestone.daysRemaining > 0 ? (
          <div className="mt-1 text-[12px]" style={{ color: milestone.nextMilestone.permanent ? 'var(--accent2)' : 'var(--muted)' }}>
            Còn {milestone.daysRemaining} ngày → {milestone.nextMilestone.label}
            {milestone.nextMilestone.permanent ? ' (bonus vĩnh viễn)' : ''}
          </div>
        ) : (
          <div className="mt-1 text-[12px]" style={{ color: 'var(--good)' }}>Đã mở mọi mốc chuỗi</div>
        )}
      </motion.div>

      {/* AI COACH — mọi phản hồi do Qwen 3B chạy trên máy sinh (chỉ desktop có WebGPU) */}
      {aiCapable && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={cardStyle} className="p-4">
          <div className={eyebrow} style={{ color: 'var(--muted-2)' }}>AI Coach</div>
          <p className="mt-1.5 text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>
            Hỏi đáp & phân tích bằng AI Qwen chạy ngay trên máy bạn (offline).
          </p>
          <CoachChat
            sessionsCompletedToday={sessionsCompletedToday}
            focusMinutesToday={focusMinutesToday}
            dailyGoalType={dailyGoalType}
            dailyGoalSessions={dailyGoalSessions}
            dailyGoalMinutes={dailyGoalMinutes}
          />
          <CoachOffline
            sessionsCompletedToday={sessionsCompletedToday}
            focusMinutesToday={focusMinutesToday}
            dailyGoalType={dailyGoalType}
            dailyGoalSessions={dailyGoalSessions}
            dailyGoalMinutes={dailyGoalMinutes}
          />
        </motion.div>
      )}
    </div>
  );
}
