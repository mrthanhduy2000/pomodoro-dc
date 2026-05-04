import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import {
  BUILDING_EFFECTS,
  MISSION_ALL_BONUS_XP,
  DAILY_MISSION_XP_SCALE,
  STREAK_MAX_BONUS_DAYS,
  STREAK_BONUS_PER_DAY,
  WEEKLY_CHAINS,
  WEEKLY_CHAIN_XP_SCALE,
  PERFECT_PLAN_WEEKLY_MULTIPLIER,
  STREAK_MISSION_MIN_STREAK,
  STREAK_MISSION_BASE_XP,
  STREAK_MISSION_XP_PER_DAY,
  STREAK_MISSION_MAX_XP,
} from '../engine/constants';

function getStreakBonusCapDays(buildings = []) {
  return STREAK_MAX_BONUS_DAYS + (
    buildings.some((bpId) => BUILDING_EFFECTS[bpId]?.wonderEffect === 'streak_cap_plus') ? 10 : 0
  );
}

function scaleMissionXP(xp, multiplier) {
  return Math.max(0, Math.round((xp ?? 0) * DAILY_MISSION_XP_SCALE * multiplier));
}

export default function DailyMissions() {
  const missions = useGameStore((s) => s.missions);
  const weeklyChain = useGameStore((s) => s.weeklyChain);
  const streak = useGameStore((s) => s.streak);
  const buildings = useGameStore((s) => s.buildings);
  const unlockedSkills = useGameStore((s) => s.player.unlockedSkills);
  const claimMissionAllBonus = useGameStore((s) => s.claimMissionAllBonus);
  const claimWeeklyStep = useGameStore((s) => s.claimWeeklyStep);
  const refreshDailyMissions = useGameStore((s) => s.refreshDailyMissions);
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    refreshDailyMissions();
  }, [refreshDailyMissions]);

  const lightTheme = uiTheme === 'light';
  const missionRewardMultiplier = buildings.some(
    (bpId) => BUILDING_EFFECTS[bpId]?.wonderEffect === 'mission_bonus_20',
  ) ? 1.2 : 1;
  const streakBonusCapDays = getStreakBonusCapDays(buildings);
  const streakBonusPct = Math.min(streak.currentStreak ?? 0, streakBonusCapDays) * (STREAK_BONUS_PER_DAY * 100);

  const list = missions.list ?? [];
  const completedCount = list.filter((mission) => mission.claimed).length;
  const allClaimed = list.length > 0 && list.every((mission) => mission.claimed);
  const pendingXP = list
    .filter((mission) => !mission.claimed)
    .reduce((sum, mission) => sum + scaleMissionXP(mission.rewardXP, missionRewardMultiplier), 0);
  const strategyBonusXP = unlockedSkills.bac_thay_chien_luoc
    ? scaleMissionXP(list.reduce((sum, mission) => sum + (mission.rewardXP ?? 0), 0), missionRewardMultiplier)
    : 0;
  const allMissionBonusXP = scaleMissionXP(MISSION_ALL_BONUS_XP, missionRewardMultiplier) + strategyBonusXP;

  const chain = WEEKLY_CHAINS[weeklyChain?.chainIndex] ?? null;
  const chainDone = Boolean(chain) && weeklyChain.currentStep >= chain.steps.length;
  const chainStepIndex = chainDone ? Math.max(0, chain.steps.length - 1) : (weeklyChain?.currentStep ?? 0);
  const chainStepsCompleted = chainDone ? chain.steps.length : Math.max(0, weeklyChain?.currentStep ?? 0);
  const activeStep = chain && !chainDone ? chain.steps[chainStepIndex] : null;
  const canClaimWeeklyStep = Boolean(activeStep) && (weeklyChain?.stepProgress ?? 0) >= activeStep.goal;
  const weeklyBonusXP = chain
    ? Math.max(
        0,
        Math.round(
          (chain.bonusXP ?? 0)
          * WEEKLY_CHAIN_XP_SCALE
          * (unlockedSkills.ke_hoach_hoan_hao ? PERFECT_PLAN_WEEKLY_MULTIPLIER : 1),
        ),
      )
    : 0;

  const streakMissionEligible = (streak.currentStreak ?? 0) >= STREAK_MISSION_MIN_STREAK;
  const streakMissionBaseXP = Math.min(
    STREAK_MISSION_BASE_XP + ((streak.currentStreak ?? 0) - STREAK_MISSION_MIN_STREAK) * STREAK_MISSION_XP_PER_DAY,
    STREAK_MISSION_MAX_XP,
  );
  const streakMissionXP = streakMissionEligible
    ? scaleMissionXP(streakMissionBaseXP, missionRewardMultiplier)
    : 0;

  return (
    <div className="space-y-4">
      <QuietSection
        lightTheme={lightTheme}
        meta={(
          <span className="mono text-[11px]" style={{ color: 'var(--muted)' }}>
            {completedCount}/{Math.max(list.length, 0)}
          </span>
        )}
        title="Nhiệm vụ ngày"
      >
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--line)' }}>
            <div>
              <div className="mono text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                Nhịp hiện tại
              </div>
              <div className="serif mt-1 text-[22px] font-medium leading-tight tracking-[-0.02em] text-[var(--ink)]">
                {streak.currentStreak > 0
                  ? `${streak.currentStreak} ngày liên tiếp`
                  : 'Bắt đầu lại một chuỗi mới'}
              </div>
            </div>
            <div className="text-right">
              <div className="mono text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
                {streak.currentStreak > 0 ? `+${streakBonusPct.toFixed(0)}%` : '0%'}
              </div>
              <div className="text-[11px] text-[var(--muted)]">bonus ngày</div>
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
            {list.map((mission) => (
              <TodayMissionRow
                key={mission.id}
                mission={mission}
                rewardXP={scaleMissionXP(mission.rewardXP, missionRewardMultiplier)}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
            <div className="min-w-0">
              <div className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                Còn lại
              </div>
              <div className="mt-1 text-[13px] leading-snug text-[var(--muted)]">
                {allClaimed ? 'Đã hoàn tất toàn bộ nhiệm vụ ngày.' : `Còn ${pendingXP.toLocaleString()} XP từ các mục chưa xong.`}
              </div>
            </div>
            <AnimatePresence initial={false}>
              {allClaimed && !missions.bonusClaimedToday ? (
                <motion.button
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  whileHover={reduceMotion ? undefined : { y: -1 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  type="button"
                  onClick={claimMissionAllBonus}
                  className="whitespace-nowrap rounded-[10px] px-3.5 py-2 text-[12px] font-semibold"
                  style={lightTheme ? {
                    background: 'var(--ink)',
                    color: 'var(--canvas)',
                    border: '1px solid rgba(31, 30, 29, 0.06)',
                    boxShadow: '0 10px 20px rgba(31, 30, 29, 0.12)',
                  } : {
                    background: 'rgba(var(--accent-rgb), 0.9)',
                    color: 'var(--ink)',
                    border: '1px solid rgba(var(--accent-rgb), 0.22)',
                    boxShadow: '0 10px 20px rgba(var(--accent-rgb), 0.18)',
                  }}
                >
                  Nhận +{allMissionBonusXP} XP
                </motion.button>
              ) : (
                <div className="mono text-[11px] font-medium" style={{ color: missions.bonusClaimedToday ? 'var(--good)' : 'var(--muted)' }}>
                  {missions.bonusClaimedToday ? 'Đã nhận thưởng ngày' : `${pendingXP.toLocaleString()} XP`}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </QuietSection>

      {chain && (
        <QuietSection
          lightTheme={lightTheme}
        meta={(
          <span className="mono text-[11px]" style={{ color: 'var(--muted)' }}>
              {chainStepsCompleted}/{chain.steps.length}
            </span>
          )}
          title="Nhiệm vụ tuần"
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--line)' }}>
            <div className="min-w-0">
              <div className="serif text-[20px] font-medium leading-tight tracking-[-0.02em] text-[var(--ink)]">{chain.title}</div>
              <div className="mt-1 text-[12px] leading-snug text-[var(--muted)]">{chain.flavor}</div>
            </div>
            <div className="text-right">
              <div className="mono text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
                +{weeklyBonusXP}
              </div>
              <div className="text-[11px] text-[var(--muted)]">thưởng chuỗi</div>
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
            {chain.steps.map((step, index) => (
                <WeeklyStepRow
                  key={step.id}
                  currentIndex={chainStepIndex}
                  done={index < chainStepsCompleted}
                  index={index}
                  isCurrent={!chainDone && index === chainStepIndex}
                  progress={weeklyChain?.stepProgress ?? 0}
                  step={step}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
              <div className="min-w-0">
                <div className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                  Trạng thái
                </div>
                <div className="mt-1 text-[13px] leading-snug text-[var(--muted)]">
                  {chainDone
                    ? 'Chuỗi tuần này đã hoàn tất.'
                    : canClaimWeeklyStep
                      ? 'Bước hiện tại đã đủ điều kiện để chốt.'
                      : activeStep
                        ? `Đang ở bước ${chainStepIndex + 1}: ${activeStep.progressLabel ?? activeStep.label}`
                        : 'Chưa có bước tuần hoạt động.'}
                </div>
              </div>
              {canClaimWeeklyStep ? (
                <motion.button
                  whileHover={reduceMotion ? undefined : { y: -1 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  type="button"
                  onClick={claimWeeklyStep}
                  className="whitespace-nowrap rounded-[10px] px-3.5 py-2 text-[12px] font-semibold"
                  style={{
                    background: 'rgba(201, 100, 66, 0.12)',
                    border: '1px solid rgba(201, 100, 66, 0.18)',
                    color: 'var(--accent2)',
                  }}
                >
                  Nhận bước tuần
                </motion.button>
              ) : (
                <div className="mono text-[11px] font-medium" style={{ color: chainDone ? 'var(--good)' : 'var(--muted)' }}>
                  {chainDone ? 'Hoàn tất' : `${weeklyChain?.stepProgress ?? 0}/${activeStep?.goal ?? 0}`}
                </div>
              )}
            </div>

            {(streakMissionEligible || unlockedSkills.ke_hoach_hoan_hao) && (
              <div className="rounded-[12px] border px-3 py-2.5" style={noteCardStyle(lightTheme)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                      Ghi chú thưởng
                    </div>
                    <div className="mt-1 text-[12px] leading-snug text-[var(--muted)]">
                      {unlockedSkills.ke_hoach_hoan_hao
                        ? 'Kế hoạch hoàn hảo đang nhân đôi bước cuối và thưởng chuỗi.'
                        : 'Chuỗi ngày đủ cao để mở thêm thưởng nhịp hàng ngày.'}
                    </div>
                  </div>
                  <div className="text-right">
                    {streakMissionEligible && (
                      <>
                        <div className="mono text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
                          +{missions.streakMissionClaimedToday ? 0 : streakMissionXP}
                        </div>
                        <div className="text-[11px] text-[var(--muted)]">
                          {missions.streakMissionClaimedToday ? 'đã nhận' : 'streak XP'}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </QuietSection>
      )}
    </div>
  );
}

function QuietSection({ children, lightTheme, meta, title }) {
  return (
    <section
      className="rounded-[18px] border px-4 py-4"
      style={{
        background: lightTheme ? 'rgba(255, 255, 255, 0.84)' : 'rgba(24, 21, 17, 0.9)',
        borderColor: lightTheme ? 'var(--line)' : 'rgba(148, 163, 184, 0.14)',
        boxShadow: lightTheme ? '0 10px 22px rgba(31, 30, 29, 0.04)' : '0 12px 28px rgba(0, 0, 0, 0.14)',
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          {title}
        </div>
        {meta}
      </div>
      {children}
    </section>
  );
}

function TodayMissionRow({ mission, reduceMotion, rewardXP }) {
  const pct = Math.max(0, Math.min(100, (mission.progress / Math.max(1, mission.goal)) * 100));
  const done = mission.claimed || mission.progress >= mission.goal;

  return (
    <div className="px-0 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`text-[13px] leading-snug ${done ? 'line-through' : ''}`} style={{ color: done ? 'var(--muted-2)' : 'var(--ink)' }}>
            {mission.label}
          </div>
          <div className="mt-1 text-[11px] text-[var(--muted)]">
            {done ? 'Đã hoàn tất.' : `Tiến độ hiện tại: ${mission.progress}/${mission.goal}`}
          </div>
        </div>
        <div className="text-right">
          <div className="mono text-[11px] font-semibold" style={{ color: done ? 'var(--good)' : 'var(--muted)' }}>
            {done ? 'xong' : `${mission.progress}/${mission.goal}`}
          </div>
          <div className="mt-1 text-[11px]" style={{ color: 'var(--accent)' }}>
            +{rewardXP}
          </div>
        </div>
      </div>

      <div className="mt-2 h-[2px] overflow-hidden rounded-full bg-[var(--line)]">
        <motion.div
          className="h-full rounded-full"
          initial={reduceMotion ? false : { width: 0 }}
          animate={reduceMotion ? undefined : { width: `${pct}%` }}
          transition={reduceMotion ? undefined : { duration: 0.45, ease: 'easeOut' }}
          style={{
            width: reduceMotion ? `${pct}%` : undefined,
            background: done ? 'var(--good)' : 'var(--accent)',
          }}
        />
      </div>
    </div>
  );
}

function WeeklyStepRow({ currentIndex, done, index, isCurrent, progress, step }) {
  const pct = Math.max(0, Math.min(100, (progress / Math.max(1, step.goal)) * 100));

  return (
    <div className="px-0 py-3">
      <div className="flex items-start gap-3">
        <div
          className="mono mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
          style={{
            background: done ? 'var(--ink)' : isCurrent ? 'rgba(201, 100, 66, 0.12)' : 'rgba(244, 242, 236, 0.96)',
            color: done ? 'var(--canvas)' : isCurrent ? 'var(--accent2)' : 'var(--muted)',
          }}
        >
          {done ? '✓' : index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-[13px] leading-snug ${done ? 'line-through' : ''}`} style={{ color: done ? 'var(--muted-2)' : 'var(--ink)' }}>
            {step.label}
          </div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="text-[11px] text-[var(--muted)]">
              {isCurrent ? `${progress}/${step.goal}` : done ? 'Đã chốt' : 'Đang chờ'}
            </div>
            <div className="mono text-[11px]" style={{ color: isCurrent ? 'var(--accent)' : 'var(--muted)' }}>
              {isCurrent ? `${Math.round(pct)}%` : index < currentIndex ? '100%' : '0%'}
            </div>
          </div>
          {isCurrent && (
            <div className="mt-2 h-[2px] overflow-hidden rounded-full bg-[var(--line)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: 'var(--accent)',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function noteCardStyle(lightTheme) {
  return {
    background: lightTheme ? 'rgba(250, 249, 246, 0.98)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${lightTheme ? 'var(--line)' : 'rgba(148, 163, 184, 0.12)'}`,
  };
}
