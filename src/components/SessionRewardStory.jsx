/**
 * SessionRewardStory.jsx — CHUỖI THẺ THƯỞNG toàn màn hình sau mỗi phiên (2026-09-05, ADR-068).
 *
 * Mỗi thẻ MỘT con số, chạm để lật, tự lật sau vài giây, thẻ cuối có "Tiếp tục" và "Chi tiết".
 * Luật chọn thẻ ở `sessionRewardStory.js` (thuần, có test); file này chỉ vẽ và giữ nhịp.
 *
 * ⚠️ NÓ ĐỌC `ui.pendingReward` NHƯ HỘP THOẠI CŨ, VÀ CHỈ ĐÓNG QUA `onDone`. Store vẫn bật
 * `lootModalOpen` đồng bộ y như trước (ba bài test ở `completeFocusSession.test.js`); ai đóng, đóng
 * thế nào, có mở hộp thoại chi tiết hay không — là việc của `OverlayStack` (`App.jsx`), nơi mọi
 * lớp phủ được điều phối ở một chỗ.
 *
 * ⚠️ CỬA SOI: có `?dc-preview=` trên URL thì thẻ KHÔNG tự lật (đứng yên để chụp) và
 * `?dc-preview-card=<id>` nhảy thẳng tới một thẻ. Không có gì trong bản thật đọc hai tham số ấy.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import soundEngine from '../engine/soundEngine';
import notificationManager from '../engine/notifications';
import { countSessionsOnDay, getDailyGoalProgress } from '../engine/gameMath';
import { localDateStr, localWeekMondayStr } from '../engine/time';
import { missionXpMultiplier } from '../engine/wonderEffects.js';
import { getRewardTier } from '../engine/rewardTiers';
import {
  EASE,
  SCRIM_FADE,
  useCustomMotion,
  useEnterMotion,
  usePressMotion,
  useRewardMotion,
  useSnapMotion,
  withDelay,
} from '../lib/motionPresets';
import { useCountUp } from '../lib/useCountUp';
import { readPreviewCard, readPreviewScene } from '../dev/previewStage';
import WeekStrip from './WeekStrip';
import { buildWeekStrip } from './todayHero';
import { dailyAllBonusXP, scaleMissionXP } from './missionXp';
import { buildRewardStoryCards, storyCardDurationMs } from './sessionRewardStory';

const DISPLAY_FONT = 'var(--skin-font-display)';
const eyebrowClass = 'mono text-[10px] uppercase tracking-[0.24em]';

function stop(event) {
  event.stopPropagation();
}

export default function SessionRewardStory({ onDone }) {
  const reward = useGameStore((s) => s.ui.pendingReward);
  const completedMissionIds = useGameStore((s) => s.ui.missionCompletedIds);
  const streak = useGameStore((s) => s.streak);
  const missions = useGameStore((s) => s.missions);
  const history = useGameStore((s) => s.history);
  const dailyTracking = useGameStore((s) => s.dailyTracking);
  const buildings = useGameStore((s) => s.buildings);
  const strategist = useGameStore((s) => Boolean(s.player.unlockedSkills?.bac_thay_chien_luoc));
  const claimMissionAllBonus = useGameStore((s) => s.claimMissionAllBonus);
  const dailyGoalType = useSettingsStore((s) => s.dailyGoalType);
  const dailyGoalSessions = useSettingsStore((s) => s.dailyGoalSessions);
  const dailyGoalMinutes = useSettingsStore((s) => s.dailyGoalMinutes);

  const enterMotion = useEnterMotion();
  const pressMotion = usePressMotion();
  // Lớp nền mờ dần — cùng ngoại lệ đặt tên sẵn mà bảy hộp thoại dùng.
  const scrimMotion = useCustomMotion(SCRIM_FADE);

  // Đọc ngày MỘT lần cho cả vòng đời chuỗi thẻ: nó sống vài giây, không cần đổi ngày giữa chừng.
  const [{ todayKey, mondayKey, frozen, jumpTo }] = useState(() => {
    const search = typeof window === 'undefined' ? '' : window.location.search;
    return {
      todayKey: localDateStr(),
      mondayKey: localWeekMondayStr(),
      frozen: readPreviewScene(search) !== null,
      jumpTo: readPreviewCard(search),
    };
  });

  const cards = useMemo(() => {
    const multiplier = missionXpMultiplier(buildings);
    const sessionsCompletedToday = countSessionsOnDay(dailyTracking, todayKey);
    const todayGoal = getDailyGoalProgress({
      dailyTracking, history, todayKey, dailyGoalType, dailyGoalSessions, dailyGoalMinutes,
    });
    return buildRewardStoryCards({
      reward,
      streak,
      todayGoal,
      todayDelta: todayGoal.useMinutes ? (reward?.effectiveMinutes ?? 0) : 1,
      weekDays: buildWeekStrip({ history, todayKey, mondayKey, sessionsCompletedToday }),
      missions,
      completedMissionIds,
      missionXp: (xp) => scaleMissionXP(xp, multiplier),
      bonusXP: dailyAllBonusXP({ list: missions?.list, multiplier, strategist }),
    });
  }, [
    reward, streak, missions, completedMissionIds, history, dailyTracking, buildings, strategist,
    dailyGoalType, dailyGoalSessions, dailyGoalMinutes, todayKey, mondayKey,
  ]);

  const [index, setIndex] = useState(() => {
    if (!jumpTo) return 0;
    const i = cards.findIndex((c) => c.id === jumpTo);
    return i >= 0 ? i : 0;
  });
  const card = cards[Math.min(index, Math.max(0, cards.length - 1))] ?? null;
  const isLast = index >= cards.length - 1;

  const finish = useCallback((extra = {}) => {
    const quests = cards.find((c) => c.id === 'quests');
    onDone?.({
      openDetail: false,
      shownMissionIds: quests ? quests.rows.filter((r) => r.justDone).map((r) => r.id) : [],
      levelShown: cards.some((c) => c.id === 'level'),
      ...extra,
    });
  }, [cards, onDone]);

  const next = useCallback(() => {
    if (isLast) finish();
    else setIndex((i) => i + 1);
  }, [isLast, finish]);

  // Tự lật. Đứng yên khi đang soi (`frozen`).
  useEffect(() => {
    if (!card || frozen) return undefined;
    const t = window.setTimeout(next, storyCardDurationMs(card, isLast));
    return () => window.clearTimeout(t);
  }, [card, isLast, next, frozen]);

  // Âm thanh theo thẻ — mỗi thẻ một lần, không kêu lại khi store nhúc nhích.
  const cardId = card?.id ?? null;
  useEffect(() => {
    if (!cardId) return undefined;
    if (cardId === 'xp') {
      soundEngine.playChestOpen();
      if (card.jackpot) {
        const t = window.setTimeout(() => soundEngine.playJackpot(), 500);
        return () => window.clearTimeout(t);
      }
    }
    if (cardId === 'streak' && card.justHit) soundEngine.playMilestone();
    if (cardId === 'level') {
      soundEngine.playLevelUp();
      // Lên kỷ thì hộp thoại chi tiết mở ngay sau và tự báo — đừng báo hai lần.
      if (!reward?.eraChanged) notificationManager.notifyLevelUp(card.newLevel);
    }
    return undefined;
    // Chỉ theo ID thẻ: `card` là object mới ở mỗi lần store đổi, mà tiếng thì chỉ được kêu một lần.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  if (!card) return null;

  return (
    <motion.div
      {...scrimMotion}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--canvas)' }}
      onClick={next}
      role="dialog"
      aria-label="Phần thưởng phiên vừa xong"
    >
      <div
        className="mx-auto flex h-full w-full max-w-[460px] flex-col px-6"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 18px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 22px)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {cards.map((c, i) => (
              <span
                key={c.id}
                className="block h-[6px] rounded-full transition-[width,background-color] duration-200"
                style={{
                  width: i === index ? 18 : 6,
                  background: i <= index ? 'var(--accent)' : 'var(--line-2)',
                }}
              />
            ))}
          </div>
          {!isLast && (
            <button
              type="button"
              onClick={(e) => { stop(e); finish(); }}
              className={eyebrowClass}
              style={{ color: 'var(--muted)' }}
            >
              Bỏ qua
            </button>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto py-4 text-center">
          <AnimatePresence mode="wait">
            <motion.div key={card.id} {...enterMotion} className="w-full">
              {card.id === 'xp' && <XpCard card={card} />}
              {card.id === 'streak' && <StreakCard card={card} />}
              {card.id === 'today' && <TodayCard card={card} />}
              {card.id === 'quests' && <QuestsCard card={card} onClaim={claimMissionAllBonus} />}
              {card.id === 'level' && <LevelCard card={card} />}
              {card.id === 'era' && <EraCard card={card} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="shrink-0 pt-2">
          {isLast ? (
            <div className="flex flex-col items-stretch gap-2">
              <motion.button
                type="button"
                {...pressMotion}
                onClick={(e) => { stop(e); finish(); }}
                className="w-full py-3.5 text-[15px] font-semibold"
                style={{
                  borderRadius: 'var(--skin-radius-control,14px)',
                  background: 'var(--ink)',
                  color: 'var(--canvas)',
                  boxShadow: 'var(--skin-card-shadow)',
                }}
              >
                Tiếp tục
              </motion.button>
              <button
                type="button"
                onClick={(e) => { stop(e); finish({ openDetail: true }); }}
                className="py-2 text-[12.5px] font-semibold"
                style={{ color: 'var(--muted)' }}
              >
                Xem chi tiết phần thưởng
              </button>
            </div>
          ) : (
            <p className={`${eyebrowClass} text-center`} style={{ color: 'var(--muted-2)' }}>
              Chạm để tiếp
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Từng thẻ ────────────────────────────────────────────────────────────────

function XpCard({ card }) {
  const rewardMotion = useRewardMotion();
  const enterMotion = useEnterMotion();
  const xp = useCountUp(card.xp, 900, true);
  const tier = getRewardTier(card.tier);
  const nhanBac = tier.rank > 0 ? tier.label : null;

  return (
    <div>
      <p className={eyebrowClass} style={{ color: 'var(--muted)' }}>Phiên đã xong</p>
      <motion.p
        {...rewardMotion}
        className="mt-3 text-[68px] font-semibold leading-none tabular-nums tracking-[-0.045em]"
        style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}
      >
        +{xp.toLocaleString('vi-VN')}
      </motion.p>
      <p className="mono mt-1 text-[12px] uppercase tracking-[0.28em]" style={{ color: 'var(--accent2)' }}>
        XP
      </p>

      <p className="mt-4 text-[15px]" style={{ color: 'var(--ink-2)' }}>
        {card.minutes} phút
        {card.bonusMinutes > 0 ? ` (+${card.bonusMinutes} làm thêm)` : ''}
        {card.tierLabel ? ` · ${card.tierLabel}` : ''}
        {card.multiplier ? ` ×${card.multiplier.toFixed(1)}` : ''}
      </p>
      {nhanBac && (
        <p className="mono mt-1 text-[10px] uppercase tracking-[0.2em]" style={{ color: tier.colorVar }}>
          {nhanBac}
        </p>
      )}

      {card.jackpot && (
        <motion.p
          {...withDelay(rewardMotion, 0.4)}
          className="mt-3 text-[15px] font-semibold"
          style={{ color: 'var(--accent)' }}
        >
          🎰 Đại trúng thưởng ×3
        </motion.p>
      )}

      {card.event && (
        <motion.div
          {...withDelay(enterMotion, 0.25)}
          className="mx-auto mt-5 max-w-[360px] px-4 py-3 text-left"
          style={{
            borderRadius: 'var(--skin-radius-card,18px)',
            background: 'var(--card-bg-solid)',
            border: 'var(--skin-card-border-width,1px) solid var(--line)',
            boxShadow: 'var(--skin-card-shadow)',
          }}
        >
          <div className="flex items-start gap-3">
            <span className="text-[26px] leading-none" aria-hidden="true">{card.event.icon}</span>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{card.event.label}</p>
              {card.event.desc && (
                <p className="mt-0.5 text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>{card.event.desc}</p>
              )}
              {card.event.bonus > 0 && (
                <p className="mono mt-1 text-[11px] font-semibold" style={{ color: 'var(--accent2)' }}>
                  +{card.event.bonus.toLocaleString('vi-VN')} XP
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {card.chips.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {card.chips.map((chip, i) => (
            <motion.span
              key={chip.id}
              {...withDelay(enterMotion, 0.3 + i * 0.08)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
              style={{
                background: 'var(--card-bg-solid)',
                border: 'var(--skin-card-border-width,1px) solid var(--line)',
                color: 'var(--ink-2)',
              }}
            >
              {chip.label}
              {chip.value && <span className="mono tabular-nums" style={{ color: 'var(--accent2)' }}>{chip.value}</span>}
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
}

function StreakCard({ card }) {
  const rewardMotion = useRewardMotion();
  const enterMotion = useEnterMotion();
  return (
    <div>
      <motion.div {...rewardMotion} className="text-[56px] leading-none" aria-hidden="true">🔥</motion.div>
      <p
        className="mt-3 text-[56px] font-semibold leading-none tabular-nums tracking-[-0.04em]"
        style={{ color: 'var(--accent2)', fontFamily: DISPLAY_FONT }}
      >
        {card.days}
      </p>
      <p className="mt-1 text-[15px]" style={{ color: 'var(--ink-2)' }}>ngày liên tiếp</p>
      {card.justHit && (
        <motion.p
          {...withDelay(rewardMotion, 0.2)}
          className="mt-2 text-[15px] font-semibold"
          style={{ color: 'var(--accent)' }}
        >
          🎉 Chạm {card.justHitLabel}{card.justHitPermanent ? ' — bonus vĩnh viễn' : ''}
        </motion.p>
      )}
      <motion.div {...withDelay(enterMotion, 0.2)} className="mx-auto mt-6 max-w-[340px]">
        <WeekStrip days={card.weekDays} size="lg" popToday />
      </motion.div>
      <p className="mt-4 text-[13px]" style={{ color: card.milestonePermanent ? 'var(--accent2)' : 'var(--muted)' }}>
        {card.milestoneText}
      </p>
    </div>
  );
}

function TodayCard({ card }) {
  // NGOẠI LỆ (mang bố cục) — bề dài thanh CHÍNH LÀ nhịp hôm nay; nó chạy từ mức TRƯỚC phiên tới
  // mức SAU phiên, vì đó là thứ vừa xảy ra. Bật Giảm chuyển động thì nhảy thẳng tới đích.
  const barMotion = useSnapMotion({
    initial: { width: `${card.pctBefore}%` },
    animate: { width: `${card.pct}%` },
    transition: { duration: 0.6, ease: EASE, delay: 0.25 },
  });
  const rewardMotion = useRewardMotion();
  const enterMotion = useEnterMotion();
  return (
    <div>
      <p className={eyebrowClass} style={{ color: 'var(--muted)' }}>Nhịp hôm nay</p>
      <p className="mt-3 flex items-baseline justify-center gap-1.5">
        <span
          className="text-[56px] font-semibold leading-none tabular-nums tracking-[-0.04em]"
          style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}
        >
          {card.currentValue}
        </span>
        <span className="text-[20px] font-medium tabular-nums" style={{ color: 'var(--muted)' }}>
          /{card.goalValue} {card.unit}
        </span>
      </p>
      <div className="mx-auto mt-5 h-3 max-w-[340px] overflow-hidden rounded-full" style={{ background: 'var(--timer-track)' }}>
        <motion.div
          {...barMotion}
          className="h-full rounded-full"
          style={{ background: card.goalMet ? 'var(--good)' : 'var(--accent)' }}
        />
      </div>
      <motion.p
        {...(card.goalMet ? withDelay(rewardMotion, 0.7) : withDelay(enterMotion, 0.6))}
        className="mt-4 text-[15px] font-semibold"
        style={{ color: card.goalMet ? 'var(--good)' : 'var(--ink-2)' }}
      >
        {card.goalMet ? '🎯 Đủ nhịp hôm nay!' : `Còn ${card.remaining} ${card.unit} nữa là đủ nhịp`}
      </motion.p>
    </div>
  );
}

function QuestCheck({ done, pop }) {
  const rewardMotion = useRewardMotion();
  const Dot = pop ? motion.span : 'span';
  return (
    <Dot
      {...(pop ? withDelay(rewardMotion, 0.35) : {})}
      className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold leading-none"
      style={done
        ? { background: 'var(--good)', color: 'var(--canvas)' }
        : { border: '1.5px solid var(--line-2)', color: 'transparent' }}
      aria-hidden="true"
    >
      {done ? '✓' : ''}
    </Dot>
  );
}

function QuestsCard({ card, onClaim }) {
  const enterMotion = useEnterMotion();
  const rewardMotion = useRewardMotion();
  const pressMotion = usePressMotion();
  return (
    <div className="w-full">
      <p className={eyebrowClass} style={{ color: 'var(--muted)' }}>
        Nhiệm vụ hôm nay · {card.doneCount}/{card.rows.length}
      </p>
      <div className="mx-auto mt-4 max-w-[400px] space-y-2 text-left">
        {card.rows.map((row, i) => (
          <motion.div
            key={row.id}
            {...withDelay(enterMotion, 0.1 + i * 0.1)}
            className="flex items-center gap-3 px-3.5 py-3"
            style={{
              borderRadius: 'var(--skin-radius-card,18px)',
              background: 'var(--card-bg-solid)',
              border: 'var(--skin-card-border-width,1px) solid '
                + (row.justDone ? 'color-mix(in srgb, var(--good) 45%, var(--line))' : 'var(--line)'),
            }}
          >
            <QuestCheck done={row.done} pop={row.justDone} />
            <div className="min-w-0 flex-1">
              <div className={`text-[13px] leading-snug ${row.done ? 'line-through' : ''}`} style={{ color: row.done ? 'var(--muted-2)' : 'var(--ink)' }}>
                {row.label}
              </div>
              <div className="mt-1.5 h-[3px] overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
                <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: row.done ? 'var(--good)' : 'var(--accent)' }} />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="mono text-[11px] font-semibold tabular-nums" style={{ color: row.done ? 'var(--good)' : 'var(--muted)' }}>
                {row.done ? 'xong' : `${row.progress}/${row.goal}`}
              </div>
              <div className="mono mt-0.5 text-[11px] font-semibold tabular-nums" style={{ color: 'var(--accent2)' }}>
                +{row.xp}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {card.bonusReady && (
        <motion.button
          type="button"
          {...withDelay(rewardMotion, 0.5)}
          {...pressMotion}
          onClick={(e) => { stop(e); onClaim?.(); }}
          className="mt-4 w-full max-w-[400px] py-3.5 text-[15px] font-semibold"
          style={{
            borderRadius: 'var(--skin-radius-control,14px)',
            background: 'var(--accent)',
            color: '#fff',
            boxShadow: 'var(--skin-card-shadow)',
          }}
        >
          🎯 Nhận thưởng trọn ngày +{card.bonusXP} XP
        </motion.button>
      )}
      {card.bonusClaimed && (
        <p className="mt-4 text-[13px] font-semibold" style={{ color: 'var(--good)' }}>
          Đã nhận thưởng trọn ngày ✓
        </p>
      )}
    </div>
  );
}

function LevelCard({ card }) {
  const rewardMotion = useRewardMotion();
  const enterMotion = useEnterMotion();
  return (
    <div>
      <motion.div {...rewardMotion} className="text-[56px] leading-none" aria-hidden="true">⭐</motion.div>
      <p className={`${eyebrowClass} mt-4`} style={{ color: 'var(--muted)' }}>Thăng cấp</p>
      <p
        className="mt-2 text-[44px] font-semibold leading-none tracking-[-0.03em]"
        style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}
      >
        Cấp {card.newLevel}
      </p>
      {card.spGained > 0 && (
        <motion.p
          {...withDelay(enterMotion, 0.25)}
          className="mono mt-4 inline-block rounded-full px-4 py-2 text-[13px] font-semibold tabular-nums"
          style={{ background: 'rgba(var(--accent-rgb), 0.10)', color: 'var(--accent2)' }}
        >
          +{card.spGained} điểm kỹ năng
        </motion.p>
      )}
      <p className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>Tiêu ở Hành trang › Kỹ năng</p>
    </div>
  );
}

function EraCard({ card }) {
  const rewardMotion = useRewardMotion();
  return (
    <div>
      <p className={eyebrowClass} style={{ color: card.accent }}>Kỷ nguyên mới</p>
      <motion.p
        {...rewardMotion}
        className="mono mt-4 inline-block rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.22em]"
        style={{ border: `1px solid ${card.accent}`, color: 'var(--ink)' }}
      >
        Kỷ {card.newBook}
      </motion.p>
      <p
        className="mt-4 text-[38px] font-semibold leading-tight tracking-[-0.03em]"
        style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}
      >
        {card.label}
      </p>
      {card.subLabel && <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>{card.subLabel}</p>}
    </div>
  );
}
