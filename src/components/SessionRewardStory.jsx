/**
 * SessionRewardStory.jsx — CHUỖI THẺ THƯỞNG toàn màn hình sau mỗi phiên (2026-09-05, ADR-068).
 *
 * Mỗi thẻ MỘT con số, chạm để lật, tự lật sau vài giây, thẻ cuối có "Tiếp tục" (lên kỷ: thêm "Xem
 * thành phố"). Luật chọn thẻ ở `sessionRewardStory.js` (thuần, có test); file này chỉ vẽ và giữ nhịp.
 *
 * ⚠️ ADR-070 (2026-09-06): ĐÂY LÀ CÁI KẾT DUY NHẤT — hộp thoại chi tiết (`LootDropModal`) đã gỡ, không
 * còn "Xem chi tiết", không còn nút "Nhận" nào bên trong. Thưởng trọn ngày · bước tuần · di vật lên
 * bậc đều đã vào trước khi thẻ hiện; thẻ chỉ KỂ. Nó đọc `ui.pendingReward` và chỉ đóng qua `onDone`;
 * ai đóng, đóng thế nào — là việc của `OverlayStack` (`App.jsx`), nơi mọi lớp phủ được điều phối.
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
import { countSessionsOnDay, getDailyGoalProgress, getEffectiveSkillCost } from '../engine/gameMath';
import { listAvailableSkills, nextReachableSkill } from '../engine/opportunities';
import { describeSessionBrick } from '../engine/sessionBrick';
import BrickRow from './focus/BrickRow';
import { describeCrisisQuest } from '../engine/rankLadder';
import { getGlyph, hasGlyphIcon } from '../utils/labelMark';
import { SkillGlyph } from './icons/Glyph';
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
import { dailyAllBonusXP, scaleMissionXP } from '../engine/missions';
import { STORY_LAST_CARD_MS, buildRewardStoryCards, storyCardDurationMs } from './sessionRewardStory';
import RewardBurst from './shared/RewardBurst';

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
  // ADR-069: ba nguồn mới cho ba thẻ mới — công trình đang xây, kỹ năng chọn được, thử thách kỷ.
  const craftingQueue = useGameStore((s) => s.craftingQueue);
  const activeBook = useGameStore((s) => s.progress.activeBook);
  const eraCrisis = useGameStore((s) => s.eraCrisis);
  const sp = useGameStore((s) => s.player.sp);
  const unlockedSkills = useGameStore((s) => s.player.unlockedSkills);
  const relics = useGameStore((s) => s.relics);
  const relicEvolutions = useGameStore((s) => s.relicEvolutions);
  const unlockSkill = useGameStore((s) => s.unlockSkill);
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
      project: describeProjectAfterSession({ reward, craftingQueue, buildings, activeBook }),
      skills: describeSkillChoices({ sp, unlockedSkills, relics, relicEvolutions }),
      crisisQuest: describeQuestAfterSession({ reward, eraCrisis, history }),
    });
  }, [
    reward, streak, missions, completedMissionIds, history, dailyTracking, buildings, strategist,
    dailyGoalType, dailyGoalSessions, dailyGoalMinutes, todayKey, mondayKey,
    craftingQueue, activeBook, eraCrisis, sp, unlockedSkills, relics, relicEvolutions,
  ]);

  // Kỹ năng vừa chọn trên thẻ lên cấp — giữ cục bộ, vì sau khi mở thì `sp` đổi và thẻ dựng lại.
  const [pickedSkill, setPickedSkill] = useState(null);
  const handlePickSkill = useCallback((choice) => {
    if (!unlockSkill(choice.id, choice.spCost, choice.requires)) return;
    soundEngine.playSkillUnlock();
    setPickedSkill(choice);
  }, [unlockSkill]);

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
      shownMissionIds: quests ? quests.rows.filter((r) => r.justDone).map((r) => r.id) : [],
      levelShown: cards.some((c) => c.id === 'level'),
      relicShown: cards.some((c) => c.id === 'relic'),
      ...extra,
    });
  }, [cards, onDone]);

  const next = useCallback(() => {
    if (isLast) finish();
    else setIndex((i) => i + 1);
  }, [isLast, finish]);

  // Thẻ đang HỎI (chọn kỹ năng) thì đứng yên cho tới khi chọn xong hoặc bấm "Để sau".
  const holding = Boolean(card?.hold) && !pickedSkill;
  // ADR-080: the RARE tier — streak milestone · level · rank · relic · era · a finished weekly chain —
  // bursts across the whole screen behind the card. Bigger than a brick, bigger than a building.
  const rare = Boolean(card) && (
    card.id === 'level' || card.id === 'era' || card.id === 'rank' || card.id === 'relic' || card.id === 'evolve'
    || (card.id === 'streak' && card.justHit) || (card.id === 'chain' && card.finished)
  );

  // Tự lật. Đứng yên khi đang soi (`frozen`) hoặc đang hỏi (`holding`).
  useEffect(() => {
    if (!card || frozen || holding) return undefined;
    const ms = storyCardDurationMs(card, isLast) ?? STORY_LAST_CARD_MS;
    const t = window.setTimeout(next, ms);
    return () => window.clearTimeout(t);
  }, [card, isLast, next, frozen, holding]);

  // Âm thanh theo thẻ — mỗi thẻ một lần, không kêu lại khi store nhúc nhích.
  const cardId = card?.id ?? null;
  useEffect(() => {
    if (!cardId) return undefined;
    // ADR-077: the XP card is silent — the session-finish fanfare played one second earlier. Only a
    // jackpot (rare) gets its own sound here. The brick landing is the ending's signature sound.
    if (cardId === 'xp' && card.jackpot) {
      const t = window.setTimeout(() => soundEngine.playJackpot(), 300);
      return () => window.clearTimeout(t);
    }
    if (cardId === 'project') soundEngine.playBrickLaid();
    if (cardId === 'streak' && card.justHit) soundEngine.playMilestone();
    if (cardId === 'rank' || cardId === 'chain') soundEngine.playMilestone();
    if (cardId === 'relic' || cardId === 'evolve') soundEngine.playChestOpen();
    // ADR-070: thẻ kỷ mới là nơi DUY NHẤT còn kể chuyện lên kỷ — tiếng và thông báo đi theo nó.
    if (cardId === 'era') soundEngine.playEraChange();
    if (cardId === 'level') {
      soundEngine.playLevelUp();
      notificationManager.notifyLevelUp(card.newLevel);
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
      onClick={holding ? undefined : next}
      role="dialog"
      aria-label="Phần thưởng phiên vừa xong"
    >
      {rare && <RewardBurst key={card.id} size="rare" className="absolute inset-0" />}
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
              {card.id === 'project' && (
                <ProjectCard
                  card={card}
                  onChoose={() => finish({ navigate: { tab: 'collection', collectionTab: 'workshop' } })}
                />
              )}
              {card.id === 'streak' && <StreakCard card={card} />}
              {card.id === 'today' && <TodayCard card={card} />}
              {card.id === 'quests' && <QuestsCard card={card} />}
              {card.id === 'chain' && <ChainCard card={card} />}
              {card.id === 'quest' && <QuestCard card={card} />}
              {card.id === 'level' && <LevelCard card={card} picked={pickedSkill} onPick={handlePickSkill} />}
              {card.id === 'rank' && <RankCard card={card} />}
              {card.id === 'relic' && <RelicCard card={card} />}
              {card.id === 'evolve' && <RelicEvolvedCard card={card} />}
              {card.id === 'era' && (
                <EraCard card={card} onSeeCity={() => finish({ navigate: { tab: 'city' } })} />
              )}
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
            </div>
          ) : holding ? (
            <button
              type="button"
              onClick={(e) => { stop(e); next(); }}
              className={`${eyebrowClass} w-full py-2 text-center`}
              style={{ color: 'var(--muted)' }}
            >
              Để sau — điểm vẫn giữ
            </button>
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

function QuestsCard({ card }) {
  const enterMotion = useEnterMotion();
  const rewardMotion = useRewardMotion();
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

      {/* ADR-070: không còn nút — thưởng trọn ngày đã vào ví trước khi thẻ này hiện. Thẻ chỉ KỂ. */}
      {card.bonusJustEarned && (
        <motion.p
          {...withDelay(rewardMotion, 0.5)}
          className="mt-4 text-[17px] font-semibold"
          style={{ color: 'var(--good)' }}
        >
          🎯 Trọn ngày +{card.bonusEarnedXP} XP — đã cộng
        </motion.p>
      )}
      {card.bonusClaimed && (
        <p className="mt-4 text-[13px] font-semibold" style={{ color: 'var(--good)' }}>
          Thưởng trọn ngày đã cộng hôm nay ✓
        </p>
      )}
      {!card.allDone && !card.bonusJustEarned && !card.bonusClaimed && card.bonusXP > 0 && (
        <motion.p {...withDelay(enterMotion, 0.5)} className="mt-4 text-[13px]" style={{ color: 'var(--muted)' }}>
          Xong hết hôm nay → +{card.bonusXP} XP tự vào
        </motion.p>
      )}
    </div>
  );
}

/**
 * ADR-069 — ba hàm THUẦN dựng đầu vào cho ba thẻ mới. Đặt ở đây (không ở `sessionRewardStory.js`)
 * vì chúng đọc BẢNG (`describeQueue`/`listAvailableSkills`) chứ không đọc luật kể; file luật chỉ
 * nhận dữ liệu đã dựng sẵn, đúng như mọi thẻ khác.
 */
function describeProjectAfterSession({ reward, craftingQueue, buildings, activeBook }) {
  return describeSessionBrick({
    craftingQueue: craftingQueue ?? [], buildings: buildings ?? [], activeBook, phase: 'landed',
    newlyBuiltIds: Array.isArray(reward?.newlyBuiltIds) ? reward.newlyBuiltIds : [],
    acceleratedIds: Array.isArray(reward?.acceleratedCraftingIds) ? reward.acceleratedCraftingIds : [],
    autoQueuedId: reward?.autoQueuedId ?? null,
    luckyBrickId: reward?.luckyBrickId ?? null,
  });
}

/** Tối đa 3 kỹ năng mở được ngay, rẻ trước, ưu tiên mỗi nhánh một cái để có LỰA CHỌN thật. */
function describeSkillChoices({ sp, unlockedSkills, relics, relicEvolutions }) {
  const snapshot = { sp, unlockedSkills: unlockedSkills ?? {}, relics: relics ?? [], relicEvolutions: relicEvolutions ?? {} };
  const available = listAvailableSkills(snapshot)
    .map((skill) => ({ ...skill, cost: getEffectiveSkillCost(skill.id, skill.spCost, snapshot.relics, snapshot.relicEvolutions) }))
    .sort((a, b) => a.cost - b.cost);
  const choices = [];
  const seenBranch = new Set();
  for (const skill of available) {
    if (choices.length >= 3) break;
    if (seenBranch.has(skill.branchLabel)) continue;
    seenBranch.add(skill.branchLabel);
    choices.push(skill);
  }
  for (const skill of available) {
    if (choices.length >= 3) break;
    if (!choices.includes(skill)) choices.push(skill);
  }
  return { sp, choices, next: nextReachableSkill(snapshot) };
}

function describeQuestAfterSession({ reward, eraCrisis, history }) {
  const quest = describeCrisisQuest({ eraCrisis, history: history ?? [], now: Date.now() });
  if (!quest) return null;
  const minutes = Number(reward?.effectiveMinutes) || 0;
  return { ...quest, countedThisSession: minutes >= quest.minMinutes };
}

// ─── Thẻ công trình ──────────────────────────────────────────────────────────

function ProjectCard({ card, onChoose }) {
  const rewardMotion = useRewardMotion();
  const enterMotion = useEnterMotion();
  const pressMotion = usePressMotion();
  const built = card.status === 'built';
  // ADR-080: three tiers, three bursts — a brick puffs dust, a building (or a lucky double brick)
  // sends a light ring and confetti. The burst sits behind the glyph and is gone in under a second.
  const burst = built || card.lucky ? 'building' : 'brick';
  return (
    <div>
      <p className={eyebrowClass} style={{ color: 'var(--muted)' }}>{built ? 'Thành phố · công trình mới' : card.lucky ? 'Hôm nay may' : 'Viên gạch của phiên này'}</p>
      <div className="relative mx-auto mt-3 inline-block">
        <RewardBurst key={`${card.status}-${card.lucky ? 'lucky' : 'plain'}`} size={burst} className="absolute inset-0" />
        <motion.div {...rewardMotion} className={`relative leading-none ${hasGlyphIcon(card.icon) ? (built ? 'text-[72px]' : 'text-[56px]') : 'mono text-[22px] uppercase tracking-[0.2em]'}`} aria-hidden="true">
          {getGlyph(card.icon, card.label, 'BP')}
        </motion.div>
      </div>
      <p className="mt-3 text-[22px] font-semibold leading-tight" style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}>
        {card.headline}
      </p>
      <BrickRow className="mt-4" bricks={card.bricks} size={built ? 30 : 26} label={`${card.done}/${card.total} viên gạch · ${card.label}`} />
      {card.lucky && (
        <motion.p
          {...withDelay(rewardMotion, 0.35)}
          className="mono mt-3 inline-block rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ background: 'rgba(var(--accent-rgb), 0.12)', color: 'var(--accent2)' }}
        >
          🍀 Gạch đôi
        </motion.p>
      )}
      <motion.p {...withDelay(enterMotion, 0.5)} className="mt-4 text-[15px] font-semibold" style={{ color: built || card.lucky ? 'var(--accent2)' : 'var(--ink-2)' }}>
        {card.sub}
      </motion.p>
      {card.auto && !built && (
        <motion.button
          type="button"
          {...withDelay(enterMotion, 0.7)}
          {...pressMotion}
          onClick={(e) => { stop(e); onChoose?.(); }}
          className="mt-3 text-[13px] font-semibold underline-offset-4 hover:underline"
          style={{ color: 'var(--muted)' }}
        >
          Chọn công trình khác
        </motion.button>
      )}
    </div>
  );
}

// ─── Thẻ bước tuần (ADR-070: tự chốt, không có nút) ──────────────────────────

function ChainCard({ card }) {
  const rewardMotion = useRewardMotion();
  const enterMotion = useEnterMotion();
  return (
    <div className="w-full">
      <p className={eyebrowClass} style={{ color: 'var(--muted)' }}>Nhiệm vụ tuần · {card.title}</p>
      <motion.div {...rewardMotion} className="mt-3 text-[56px] leading-none" aria-hidden="true">🗓️</motion.div>
      <p className="mt-3 text-[22px] font-semibold leading-tight" style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}>
        {card.finished ? 'Chuỗi tuần hoàn tất!' : `Bước ${card.doneCount}/${card.total} đã chốt`}
      </p>
      <div className="mx-auto mt-4 max-w-[400px] space-y-2 text-left">
        {card.steps.map((step, i) => (
          <motion.div
            key={step.index}
            {...withDelay(enterMotion, 0.15 + i * 0.1)}
            className="flex items-center gap-3 px-3.5 py-3"
            style={{
              borderRadius: 'var(--skin-radius-card,18px)',
              background: 'var(--card-bg-solid)',
              border: 'var(--skin-card-border-width,1px) solid color-mix(in srgb, var(--good) 45%, var(--line))',
            }}
          >
            <QuestCheck done pop />
            <div className="min-w-0 flex-1 text-[13px] leading-snug" style={{ color: 'var(--ink)' }}>{step.label}</div>
            <div className="mono shrink-0 text-[11px] font-semibold tabular-nums" style={{ color: 'var(--accent2)' }}>+{step.xp} XP</div>
          </motion.div>
        ))}
      </div>
      {card.bonusSP > 0 && (
        <motion.p {...withDelay(rewardMotion, 0.5)} className="mt-4 text-[15px] font-semibold" style={{ color: 'var(--accent)' }}>
          +{card.bonusSP} điểm kỹ năng — thưởng trọn chuỗi
        </motion.p>
      )}
      <motion.p {...withDelay(enterMotion, 0.6)} className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        {card.finished ? 'Tuần sau có chuỗi mới.' : `Còn ${card.total - card.doneCount} bước — đủ là tự chốt, không có nút.`}
      </motion.p>
    </div>
  );
}

// ─── Thẻ di vật lên bậc (ADR-070: theo phiên, không có giá) ──────────────────

function RelicEvolvedCard({ card }) {
  const rewardMotion = useRewardMotion();
  const enterMotion = useEnterMotion();
  const relic = card.relics[0];
  return (
    <div>
      <p className={eyebrowClass} style={{ color: 'var(--accent2)' }}>Di vật lên bậc</p>
      <motion.div {...rewardMotion} className="mt-3 text-[64px] leading-none" aria-hidden="true">{relic.icon}</motion.div>
      <p className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.03em]" style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}>
        {relic.label}
      </p>
      <motion.p
        {...withDelay(enterMotion, 0.3)}
        className="mono mt-3 inline-block rounded-full px-4 py-2 text-[13px] font-semibold"
        style={{ background: 'rgba(var(--accent-rgb), 0.10)', color: 'var(--accent2)' }}
      >
        {relic.stageLabel}{relic.buffText ? ` · ${relic.buffText}` : ''}
      </motion.p>
      {card.relics.length > 1 && (
        <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          +{card.relics.length - 1} di vật khác cũng lên bậc
        </p>
      )}
      <motion.p {...withDelay(enterMotion, 0.5)} className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        {relic.isMax ? 'Đã tới bậc cao nhất.' : `Bậc kế ở mốc ${relic.nextAt} phiên kể từ khi nhận.`}
      </motion.p>
    </div>
  );
}

// ─── Thẻ thử thách kỷ nguyên (nhiệm vụ mềm) ──────────────────────────────────

function QuestCard({ card }) {
  const rewardMotion = useRewardMotion();
  const enterMotion = useEnterMotion();
  const pct = Math.min(100, (card.sessionsDone / card.sessionsRequired) * 100);
  return (
    <div>
      <p className={eyebrowClass} style={{ color: 'var(--muted)' }}>{card.opened ? 'Thử thách kỷ nguyên mở ra' : 'Thử thách kỷ nguyên'}</p>
      <motion.div {...rewardMotion} className="mt-3 text-[56px] leading-none" aria-hidden="true">{card.icon}</motion.div>
      <p className="mt-3 text-[24px] font-semibold leading-tight" style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}>{card.name}</p>
      <p className="mt-2 text-[13px] leading-snug" style={{ color: 'var(--muted)' }}>
        {card.sessionsRequired} phiên ≥{card.minMinutes}′ trong {card.windowHours} giờ
        {card.relicLabel ? ` → di vật «${card.relicLabel}»` : ''}
      </p>
      <p className="mt-4 flex items-baseline justify-center gap-1.5">
        <span className="text-[44px] font-semibold leading-none tabular-nums" style={{ color: 'var(--accent2)', fontFamily: DISPLAY_FONT }}>{card.sessionsDone}</span>
        <span className="text-[18px] font-medium tabular-nums" style={{ color: 'var(--muted)' }}>/{card.sessionsRequired}</span>
      </p>
      <div className="mx-auto mt-3 h-3 max-w-[340px] overflow-hidden rounded-full" style={{ background: 'var(--timer-track)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
      </div>
      <motion.p {...withDelay(enterMotion, 0.5)} className="mt-4 text-[13px]" style={{ color: 'var(--muted)' }}>
        Không có hạn, không mất gì — cứ làm là tới.
      </motion.p>
    </div>
  );
}

// ─── Thẻ lên cấp + chọn kỹ năng ──────────────────────────────────────────────

function LevelCard({ card, picked, onPick }) {
  const rewardMotion = useRewardMotion();
  const enterMotion = useEnterMotion();
  const pressMotion = usePressMotion();
  /*
    ⚠️ HAI NGUỒN, HAI CÂU — VÀ CÂU SAI Ở ĐÂY LÀ MỘT LỜI NÓI DỐI (ADR-084). Thẻ này giờ nổ ra cho cả
    điểm do LÊN CẤP lẫn điểm do THÀNH PHỐ trả. In "Thăng cấp · Cấp 5" khi cấp không hề đổi thì con
    số lớn nhất trên thẻ là con số duy nhất sai — đúng cái bẫy mà thanh EP/XP đã sập một lần
    (`shared/EraStageBar.jsx`). Ngôi sao ⭐ cũng nhường chỗ cho 🧱: thứ vừa xảy ra là một công trình
    xong, không phải một cấp mới.
  */
  const fromCity = card.source === 'city';
  return (
    <div className="w-full">
      <motion.div {...rewardMotion} className="text-[56px] leading-none" aria-hidden="true">{fromCity ? '🧱' : '⭐'}</motion.div>
      <p className={`${eyebrowClass} mt-4`} style={{ color: 'var(--muted)' }}>
        {fromCity ? 'Thành phố trả công' : 'Thăng cấp'}
      </p>
      <p
        className="mt-2 text-[44px] font-semibold leading-none tracking-[-0.03em]"
        style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}
      >
        {fromCity ? `+${card.spGained} SP` : `Cấp ${card.newLevel}`}
      </p>
      {/* ⚠️ Trên thẻ THÀNH PHỐ, tiêu đề đã LÀ con số ("+1 SP") — in lại nó ở đây là nói hai lần
          cùng một chuyện trên cùng một thẻ, đúng luật mà ô "Cư dân" đã phải nhường chỗ vì nó. */}
      {card.spGained > 0 && !fromCity && (
        <motion.p
          {...withDelay(enterMotion, 0.25)}
          className="mono mt-4 inline-block rounded-full px-4 py-2 text-[13px] font-semibold tabular-nums"
          style={{ background: 'rgba(var(--accent-rgb), 0.10)', color: 'var(--accent2)' }}
        >
          +{card.spGained} điểm kỹ năng
        </motion.p>
      )}

      {picked ? (
        <motion.div {...rewardMotion} className="mx-auto mt-5 max-w-[400px] px-4 py-3.5 text-left" style={{ borderRadius: 'var(--skin-radius-card,18px)', background: 'var(--card-bg-solid)', border: '1px solid color-mix(in srgb, var(--good) 45%, var(--line))' }}>
          <p className="text-[14px] font-semibold" style={{ color: 'var(--good)' }}>✓ Đã mở «{picked.label}»</p>
          <p className="mt-1 text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>{picked.description}</p>
        </motion.div>
      ) : card.skillChoices.length > 0 ? (
        <div className="mx-auto mt-5 max-w-[400px] space-y-2 text-left" onClick={stop}>
          <p className={`${eyebrowClass} text-center`} style={{ color: 'var(--muted-2)' }}>Chọn một kỹ năng · {card.sp} điểm trong tay</p>
          {card.skillChoices.map((choice, i) => (
            <motion.button
              key={choice.id}
              type="button"
              {...withDelay(enterMotion, 0.3 + i * 0.1)}
              {...pressMotion}
              onClick={(e) => { stop(e); onPick?.(choice); }}
              className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
              style={{
                borderRadius: 'var(--skin-radius-card,18px)',
                background: 'var(--card-bg-solid)',
                border: '1px solid color-mix(in srgb, var(--accent) 30%, var(--line))',
                boxShadow: 'var(--skin-card-shadow)',
              }}
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(var(--accent-rgb), 0.10)', color: 'var(--accent2)' }}>
                <SkillGlyph id={choice.id} size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>{choice.label}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug" style={{ color: 'var(--muted)' }}>{choice.description}</span>
              </span>
              <span className="mono shrink-0 text-[11px] font-semibold tabular-nums" style={{ color: 'var(--accent2)' }}>{choice.cost} SP</span>
            </motion.button>
          ))}
        </div>
      ) : card.nextSkill ? (
        <p className="mt-4 text-[13px]" style={{ color: 'var(--muted)' }}>
          Còn {card.nextSkill.spNeeded} điểm nữa mở được «{card.nextSkill.label}»
        </p>
      ) : (
        <p className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>Điểm chờ ở Hành trang › Kỹ năng</p>
      )}
    </div>
  );
}

// ─── Thẻ lên bậc · di vật ────────────────────────────────────────────────────

function RankCard({ card }) {
  const rewardMotion = useRewardMotion();
  const enterMotion = useEnterMotion();
  return (
    <div>
      <p className={eyebrowClass} style={{ color: 'var(--muted)' }}>Thăng bậc</p>
      <motion.div {...rewardMotion} className="mt-3 text-[64px] leading-none" aria-hidden="true">{card.icon}</motion.div>
      <p className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.03em]" style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}>
        {card.label}
      </p>
      {card.buffLabel && (
        <motion.p
          {...withDelay(enterMotion, 0.3)}
          className="mono mt-3 inline-block rounded-full px-4 py-2 text-[13px] font-semibold"
          style={{ background: 'rgba(var(--accent-rgb), 0.10)', color: 'var(--accent2)' }}
        >
          {card.buffLabel}
        </motion.p>
      )}
      <motion.p {...withDelay(enterMotion, 0.5)} className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        Tự lên nhờ những phiên gần đây — không có nút, không có hạn.
      </motion.p>
    </div>
  );
}

function RelicCard({ card }) {
  const rewardMotion = useRewardMotion();
  const enterMotion = useEnterMotion();
  return (
    <div>
      <p className={eyebrowClass} style={{ color: 'var(--accent2)' }}>Di vật mới</p>
      <motion.div {...rewardMotion} className="mt-3 text-[64px] leading-none" aria-hidden="true">{card.icon}</motion.div>
      <p className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.03em]" style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}>
        {card.label}
      </p>
      {card.description && (
        <motion.p {...withDelay(enterMotion, 0.3)} className="mt-2 text-[13px] leading-snug" style={{ color: 'var(--muted)' }}>
          {card.description}
        </motion.p>
      )}
      <motion.p {...withDelay(enterMotion, 0.5)} className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        Thử thách kỷ nguyên đã qua. Di vật cộng dồn vĩnh viễn.
      </motion.p>
    </div>
  );
}

function EraCard({ card, onSeeCity }) {
  const rewardMotion = useRewardMotion();
  const enterMotion = useEnterMotion();
  const pressMotion = usePressMotion();
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
      {/*
        ADR-070: hộp thoại chi tiết từng tự bật khi lên kỷ để "ăn mừng" — 3.384px chữ và số. Thứ đáng
        nhìn lúc lên kỷ là THÀNH PHỐ đổi hình; nút này đưa thẳng tới đó, và không có gì phải đọc.
      */}
      <motion.button
        type="button"
        {...withDelay(rewardMotion, 0.4)}
        {...pressMotion}
        onClick={(e) => { stop(e); onSeeCity?.(); }}
        className="mt-6 w-full max-w-[400px] py-3.5 text-[15px] font-semibold"
        style={{
          borderRadius: 'var(--skin-radius-control,14px)',
          background: card.accent,
          color: '#fff',
          boxShadow: 'var(--skin-card-shadow)',
        }}
      >
        Xem thành phố mới
      </motion.button>
      <motion.p {...withDelay(enterMotion, 0.6)} className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        Bản vẽ, đường sá và cư dân của kỷ mới đang chờ.
      </motion.p>
    </div>
  );
}
