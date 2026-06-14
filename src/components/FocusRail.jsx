/**
 * FocusRail.jsx — cột phải màn Tập trung theo mockup: 3 thẻ Hôm nay / Chuỗi / AI Coach.
 * AI Coach hiện là thẻ "tĩnh" dùng SỐ LIỆU THẬT (gợi ý độ dài phiên theo lịch sử) —
 * sẽ nối backend Claude ở bước sau. Tất cả skin-aware qua biến CSS.
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { calculateStreakMilestoneProgress, generateCoachInsight } from '../engine/gameMath';
import {
  getVietnamHour, getVietnamDayOfWeek, localWeekMondayStr, localPrevWeekMondayStr,
  vietnamDayNumber, localDateStr, localDateStrDaysAgo,
} from '../engine/time';

// Bộ nhớ chống-lặp lời khuyên coach — lưu THEO THIẾT BỊ (localStorage), không đồng
// bộ qua Supabase để tránh đua ghi giữa các máy. Chỉ ghi 1 lần mỗi ngày.
const COACH_RECENT_KEY = 'dc-coach-recent';

function readCoachRecentKinds() {
  try {
    const v = JSON.parse(localStorage.getItem(COACH_RECENT_KEY) || 'null');
    return Array.isArray(v?.kinds) ? v.kinds : [];
  } catch { return []; }
}

function recordCoachKind(kind, today) {
  try {
    const cur = JSON.parse(localStorage.getItem(COACH_RECENT_KEY) || 'null');
    if (cur && cur.day === today) return;            // hôm nay đã ghi rồi
    const prev = Array.isArray(cur?.kinds) ? cur.kinds : [];
    const kinds = [kind, ...prev.filter((k) => k !== kind)].slice(0, 4);
    localStorage.setItem(COACH_RECENT_KEY, JSON.stringify({ day: today, kinds }));
  } catch { /* bỏ qua nếu localStorage không dùng được */ }
}

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
  const history = useGameStore((s) => s.history);
  const sessionCategories = useGameStore((s) => s.sessionCategories);
  const [recentKinds] = useState(readCoachRecentKinds);

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

  const entryDate = (e) => new Date(e?.timestamp ?? 0);
  const today = vietnamDayNumber();
  const activeCategoryIds = new Set((sessionCategories ?? []).map((c) => c.id));
  const coach = generateCoachInsight(history ?? [], {
    nowHour: getVietnamHour(),
    getEntryHour: (e) => getVietnamHour(entryDate(e)),
    getEntryWeekday: (e) => getVietnamDayOfWeek(entryDate(e)),
    getEntryWeekKey: (e) => localWeekMondayStr(entryDate(e)),
    nowWeekKey: localWeekMondayStr(),
    prevWeekKey: localPrevWeekMondayStr(),
    currentStreak,
    // Nhịp hôm nay + hiệu chỉnh mục tiêu ngày
    dailyGoalMetric: useMinutes ? 'minutes' : 'sessions',
    dailyGoal: goalValue,
    sessionsToday: sessionsCompletedToday,
    minutesToday: focusMinutesToday,
    // Loại việc bị bỏ bê (theo số-ngày VN) — chỉ xét loại còn tồn tại
    getEntryDayKey: (e) => localDateStr(entryDate(e)),
    todayKey: localDateStr(),
    minDayKey: localDateStrDaysAgo(28),
    getEntryDayNumber: (e) => vietnamDayNumber(entryDate(e)),
    nowDayNumber: today,
    activeCategoryIds,
    // Chống lặp theo thiết bị + xoay vòng theo NGÀY
    recentKinds,
    rotationSeed: today,
  });

  // Ghi lại loại lời khuyên đã hiện hôm nay để mai đỡ lặp (1 lần/ngày, theo máy).
  useEffect(() => {
    if (coach?.kind) recordCoachKind(coach.kind, today);
  }, [coach?.kind, today]);

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
              style={{ opacity: shieldAvailable ? 1 : 0.32, color: 'var(--good)' }}
            >
              🛡️
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-[26px] font-semibold leading-none" style={{ fontFamily: 'var(--skin-font-display)', color: 'var(--accent2)' }}>
            {currentStreak}
          </span>
          <span style={{ color: 'var(--accent)' }}>🔥</span>
          <span className="text-[12px]" style={{ color: 'var(--muted-2)' }}>ngày</span>
        </div>
        {milestone.nextMilestone && milestone.daysRemaining > 0 ? (
          <div className="mt-1 text-[12px]" style={{ color: milestone.nextMilestone.permanent ? 'var(--accent2)' : 'var(--muted)' }}>
            Còn {milestone.daysRemaining} ngày → {milestone.nextMilestone.label}
            {milestone.nextMilestone.permanent ? ' (bonus vĩnh viễn)' : ''}
          </div>
        ) : (
          <div className="mt-1 text-[12px]" style={{ color: 'var(--good)' }}>Đã mở mọi mốc chuỗi 🎉</div>
        )}
      </motion.div>

      {/* AI COACH (tĩnh, số liệu thật) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4"
        style={{ background: '#1f1e1d', borderRadius: 'var(--skin-radius-card,18px)', border: '1px solid rgba(217,164,65,0.22)' }}
      >
        <div className="flex items-center gap-1.5">
          <span style={{ color: '#d9a441' }}>✦</span>
          <span className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#d9a441' }}>AI Coach</span>
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: '#e8e4dc' }}>{coach.text}</p>
        {coach.reason && (
          <p className="mt-1.5 text-[11px] leading-snug" style={{ color: 'rgba(232,228,220,0.55)' }}>{coach.reason}</p>
        )}
      </motion.div>
    </div>
  );
}
