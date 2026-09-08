import React from 'react';
import { weeklyChainStepState } from './weeklyChainStep';
import { motion } from 'framer-motion';

import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import { missionXpMultiplier } from '../engine/wonderEffects.js';
import { dailyAllBonusXP, scaleMissionXP } from '../engine/missions';
import { medianSessionXP } from '../engine/eraStage';
import RewardCard from './shared/RewardCard';
import { DAILY_BONUS_COPY } from './dailyBonusCopy';
import { useSnapMotion } from '../lib/motionPresets';
import {
  WEEKLY_CHAINS,
  WEEKLY_CHAIN_XP_SCALE,
  PERFECT_PLAN_WEEKLY_MULTIPLIER,
  STREAK_MISSION_MIN_STREAK,
  STREAK_MISSION_BASE_XP,
  STREAK_MISSION_XP_PER_DAY,
  STREAK_MISSION_MAX_XP,
} from '../engine/constants';


// ⚠️ HAI BẢN CHÉP TAY ĐÃ GỠ (2026-09-05) — `getStreakBonusCapDays` và hệ số thưởng nhiệm vụ.
// Cả hai từng hỏi thẳng TÊN đặc quyền kỳ quan mà KHÔNG kiểm `type`; xem `engine/wonderEffects.js`.
// `scaleMissionXP` / `dailyAllBonusXP` live in `engine/missions.js` (ADR-077) — the store GRANTS and this
// screen SHOWS with the same function; two copies were two numbers that drifted apart.
//
// ⚠️ KHÔNG CÒN NÚT "NHẬN" / "CHỐT BƯỚC" (2026-09-06, ADR-070, đóng `TECH_DEBT #100`). Thưởng trọn
// ngày tự vào ngay phiên khép nốt nhiệm vụ cuối; bước tuần tự chốt ngay phiên đủ điều kiện — cả hai
// kể ở chuỗi thẻ thưởng. Màn này nay chỉ trả lời "còn bao xa". Một phần thưởng đủ điều kiện mà còn
// phải đi tìm cái nút để lấy là một phần thưởng bị hoãn; và một cái nút chỉ hiện ra khi đủ điều kiện
// là một cái nút hầu như không ai thấy — nó từng nằm ở tab Tiến trình, cách màn Tập trung hai cú chạm.

/**
 * @param {'all'|'daily'|'weekly'} section — ADR-068 chia màn này làm hai chỗ: khối NGÀY nằm ngay
 *   dưới đồng hồ ở màn Tập trung (nơi ra quyết định bấm Bắt đầu — hiệu ứng Zeigarnik: việc dở
 *   dang nằm trong tầm mắt), khối TUẦN ở tab Tiến trình. Cột phải desktop dựng cả hai (`all`).
 */
export default function DailyMissions({ section = 'all' }) {
  const missions = useGameStore((s) => s.missions);
  const weeklyChain = useGameStore((s) => s.weeklyChain);
  const streak = useGameStore((s) => s.streak);
  const buildings = useGameStore((s) => s.buildings);
  const unlockedSkills = useGameStore((s) => s.player.unlockedSkills);
  const refreshDailyMissions = useGameStore((s) => s.refreshDailyMissions);
  const history = useGameStore((s) => s.history);
  const uiTheme = useSettingsStore((s) => s.uiTheme);

  React.useEffect(() => {
    refreshDailyMissions();
  }, [refreshDailyMissions]);

  const lightTheme = uiTheme === 'light';
  const missionRewardMultiplier = missionXpMultiplier(buildings);
  const showDaily = section !== 'weekly';
  const showWeekly = section !== 'daily';

  const list = missions.list ?? [];
  const completedCount = list.filter((mission) => mission.claimed).length;
  const allClaimed = list.length > 0 && list.every((mission) => mission.claimed);
  const pendingXP = list
    .filter((mission) => !mission.claimed)
    .reduce((sum, mission) => sum + scaleMissionXP(mission.rewardXP, missionRewardMultiplier), 0);
  // Cùng công thức với thẻ "Nhiệm vụ" trong chuỗi thẻ thưởng — một luật một công thức.
  const allMissionBonusXP = dailyAllBonusXP({
    list, multiplier: missionRewardMultiplier, strategist: Boolean(unlockedSkills.bac_thay_chien_luoc),
  });
  const bonusShownXP = missions.bonusClaimedToday && missions.bonusClaimedXP > 0
    ? missions.bonusClaimedXP
    : allMissionBonusXP;

  const chain = WEEKLY_CHAINS[weeklyChain?.chainIndex] ?? null;
  const chainDone = Boolean(chain) && weeklyChain.currentStep >= chain.steps.length;
  const chainStepIndex = chainDone ? Math.max(0, chain.steps.length - 1) : (weeklyChain?.currentStep ?? 0);
  const chainStepsCompleted = chainDone ? chain.steps.length : Math.max(0, weeklyChain?.currentStep ?? 0);
  const activeStep = chain && !chainDone ? chain.steps[chainStepIndex] : null;
  // Chỉ còn xảy ra khi bước đủ NGOÀI phiên (kết thúc nghỉ đúng giờ): phiên kế sẽ tự chốt nó.
  const stepReadyOutsideSession = Boolean(activeStep) && (weeklyChain?.stepProgress ?? 0) >= activeStep.goal;
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
  // ADR-082: the same bonus said in sessions. `null` when there is no history to compare against.
  const weeklyBonusMedianXP = medianSessionXP(history);
  // Làm tròn về SỐ NGUYÊN phiên: "≈ 6,4 phiên" xuống dòng ở khổ 390px và cái dấu phẩy thập phân
  // giả vờ chính xác hơn mức một số trung vị có thể hứa.
  // ⚠️ ĐƠN VỊ Ở DÒNG CAPTION, KHÔNG DÍNH VÀO CON SỐ LỚN. Đo bằng ảnh 390px: «+328 XP» ở cỡ 15px
  // trong cột phải hẹp (tiêu đề chuỗi tuần chiếm bên trái) XUỐNG DÒNG thành ba dòng chồng nhau.
  // Caption ngay dưới đã có sẵn chỗ cho cả đơn vị lẫn phép so sánh, trên MỘT dòng.
  const weeklyBonusCaption = (weeklyBonusMedianXP && weeklyBonusXP > 0)
    ? `XP · ≈ ${Math.max(1, Math.round(weeklyBonusXP / weeklyBonusMedianXP))} phiên`
    : 'XP thưởng chuỗi';

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
      {showDaily && (
      <QuietSection
        lightTheme={lightTheme}
        meta={(
          <span
            className="mono inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums"
            style={{ background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent2)' }}
          >
            {completedCount}/{Math.max(list.length, 0)}
          </span>
        )}
        title="Nhiệm vụ ngày"
      >
        <div className="space-y-3">
          {/*
            ⚠️ DÒNG "N ngày liên tiếp · +8% mỗi phiên" ĐÃ DỜI LÊN KHỐI HÔM NAY (`TodayHero`, ADR-068):
            khối ấy đứng đầu màn Tập trung — cùng màn hình với danh sách này — và nói cùng con số.
            Hai chỗ nói cùng một chuyện thì chỗ nói ít hơn phải nhường.
          */}
          <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
            {list.map((mission) => (
              <TodayMissionRow
                key={mission.id}
                mission={mission}
                rewardXP={scaleMissionXP(mission.rewardXP, missionRewardMultiplier)}
              />
            ))}
          </div>

          <div className="border-t pt-4" style={{ borderColor: 'var(--line)' }}>
            <RewardCard
              icon="🎯"
              name="Thưởng trọn ngày"
              tier="tot"
              /*
                ⚠️ BA CÂU NÀY ĐỀU NGẮN CÓ CHỦ ĐÍCH (2026-08-30) — `RewardCard.description` là ĐÚNG MỘT
                DÒNG, dài hơn thì bị cắt bằng "…" trong im lặng; `dailyBonusCopy.test.js` canh độ dài.
                ⚠️ ADR-070: không còn nút, nên ba câu chỉ nói KHI NÀO thưởng vào — "đã cộng hôm nay" ·
                "cộng ở phiên kế" (nhiệm vụ cuối xong ngoài phiên) · "còn N XP nữa".
              */
              description={missions.bonusClaimedToday
                ? DAILY_BONUS_COPY.claimed
                : allClaimed
                  ? DAILY_BONUS_COPY.ready
                  : DAILY_BONUS_COPY.pending(pendingXP)}
              /*
                ⚠️ MỘT Ô BÊN PHẢI, KHÔNG HƠN (2026-09-05): ở khung 390px, hai ô bên phải bóp cái TÊN
                xuống còn ~40px ("Th / ch / tua"). Số XP đứng một mình; dấu ✓ đi KÈM TRONG con số khi
                đã cộng, không thành một ô riêng.
              */
              amount={missions.bonusClaimedToday ? `✓ +${bonusShownXP} XP` : `+${allMissionBonusXP} XP`}
            />
          </div>
        </div>
      </QuietSection>
      )}

      {chain && showWeekly && (
        <QuietSection
          lightTheme={lightTheme}
          meta={(
            <span
              className="mono inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums"
              style={{ background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent2)' }}
            >
              {chainStepsCompleted}/{chain.steps.length}
            </span>
          )}
          title="Nhiệm vụ tuần"
        >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--line)' }}>
            <div className="min-w-0">
              <div
                className="text-[20px] font-semibold leading-tight tracking-[-0.02em]"
                style={{ fontFamily: 'var(--skin-font-display)', color: 'var(--ink)' }}
              >
                {chain.title}
              </div>
              <div className="mt-1 text-[12px] leading-snug text-[var(--muted)]">{chain.flavor}</div>
            </div>
            <div className="text-right">
              <div className="mono text-[15px] font-semibold tabular-nums" style={{ color: 'var(--accent2)' }}>
                +{weeklyBonusXP}
              </div>
              {/*
                ⚠️ THE CAPTION IS NOW A COMPARISON, NOT A LABEL (round 43, ADR-082). It used to read
                «thưởng chuỗi» — a word that repeats what the card's own title already said, on
                every render, forever. Meanwhile the number above it («+328») had no unit at all,
                which is worse than a wrong unit: Đàm could not tell whether finishing four steps
                across a whole week was worth a lot or nothing. Saying it in SESSIONS answers that
                in one glance, in the only currency this game has (ADR-069) — and it is the same
                sentence a person would say out loud: *"a week's chain is worth about one session."*
                No history to compare against ⇒ fall back to the old label rather than guess.
              */}
              <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>{weeklyBonusCaption}</div>
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
            {chain.steps.map((step, index) => (
                <WeeklyStepRow
                  key={step.id}
                  {...weeklyChainStepState({
                    index,
                    currentStep: weeklyChain?.currentStep ?? 0,
                    totalSteps: chain.steps.length,
                  })}
                  index={index}
                  progress={weeklyChain?.stepProgress ?? 0}
                  step={step}
                />
              ))}
            </div>

            <div className="border-t pt-4" style={{ borderColor: 'var(--line)' }}>
              <RewardCard
                icon="🗓️"
                name="Thưởng chuỗi tuần"
                // "hiếm" chứ không phải "tốt": chuỗi tuần đòi giữ nhịp qua nhiều
                // ngày, nên nó phải đứng trên thưởng trọn ngày trên cùng một thang.
                tier="hiem"
                // ⚠️ TIẾN ĐỘ NẰM TRONG MÔ TẢ, KHÔNG ở một ô riêng bên phải. Ở khung
                // 390px, icon + số XP + một ô trạng thái nữa bóp phần tên xuống còn
                // ~110px — ảnh dựng cho ra "Thưởn…". Và ô ấy vốn đã nói lại đúng thứ
                // mô tả vừa nói, tức là trả một cái tên bị cắt để lấy một câu lặp.
                description={chainDone
                  ? 'Chuỗi tuần này đã hoàn tất.'
                  : stepReadyOutsideSession
                    ? 'Đủ rồi — chốt ở phiên kế.'
                    : activeStep
                      ? `Bước ${chainStepIndex + 1} — ${weeklyChain?.stepProgress ?? 0}/${activeStep.goal}: ${activeStep.progressLabel ?? activeStep.label}`
                      : 'Chưa có bước tuần hoạt động.'}
                // ⚠️ KHÔNG in `amount` ở đây: con số "+328" đã đứng ở đầu khối ("thưởng chuỗi").
                amount={null}
              />
            </div>

            {(streakMissionEligible || unlockedSkills.ke_hoach_hoan_hao) && (
              <div className="px-3.5 py-3" style={noteCardStyle(lightTheme)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-2)' }}>
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
                        <div className="mono text-[13px] font-semibold tabular-nums" style={{ color: 'var(--accent2)' }}>
                          +{missions.streakMissionClaimedToday ? 0 : streakMissionXP}
                        </div>
                        <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                          {missions.streakMissionClaimedToday ? 'đã cộng' : 'streak XP'}
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

/**
 * ⚠️ CHỈ PHẦN TRẢ THƯỞNG dùng `RewardCard`, các dòng nhiệm vụ thì KHÔNG. Một thẻ
 * phần thưởng không có thanh tiến độ, mà tiến độ (3/5 phiên) là thông tin thật —
 * ép dòng nhiệm vụ vào thẻ chung là mua sự đồng bộ bằng cách vứt đi một con số
 * Đàm đang dùng. Thẻ dùng cho thứ ĐÃ hoặc SẼ nhận; hàng dùng cho thứ đang làm.
 */
function QuietSection({ children, eyebrow, _lightTheme, meta, title }) {
  return (
    <section
      className="px-5 py-5"
      style={{
        background: 'var(--card-bg-solid)',
        border: 'var(--skin-card-border-width, 1px) solid var(--line)',
        borderRadius: 'var(--skin-radius-card, 18px)',
        boxShadow: 'var(--skin-card-shadow)',
      }}
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {/*
            ⚠️ NHÃN NHỎ NAY LÀ TUỲ CHỌN THẬT (2026-08-30). Trước đây bỏ trống thì nó rơi về chữ
            "Nhật ký" — một mặc định IM LẶNG, tức không có cách nào nói "thẻ này không cần nhãn"
            mà không dán nhầm cho nó một cái tên sai. Hai thẻ nhiệm vụ đều rơi vào đúng ca ấy:
            "Hôm nay" đứng trên "Nhiệm vụ ngày", "Chuỗi tuần" đứng trên "Nhiệm vụ tuần" — chữ
            "ngày"/"tuần" trong chính tiêu đề đã nói xong điều nhãn định nói.
          */}
          {eyebrow && (
            <div className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-2)' }}>
              {eyebrow}
            </div>
          )}
          <div
            className={`text-[18px] font-semibold leading-tight tracking-[-0.01em] ${eyebrow ? 'mt-1.5' : ''}`}
            style={{ fontFamily: 'var(--skin-font-display)', color: 'var(--ink)' }}
          >
            {title}
          </div>
        </div>
        {meta}
      </div>
      {children}
    </section>
  );
}

function TodayMissionRow({ mission, rewardXP }) {
  // NGOẠI LỆ (mang bố cục) — bề dài thanh CHÍNH LÀ tiến độ của nhiệm vụ.
  const barMotion = useSnapMotion({ transition: { duration: 0.45, ease: 'easeOut' } });
  const pct = Math.max(0, Math.min(100, (mission.progress / Math.max(1, mission.goal)) * 100));
  const done = mission.claimed || mission.progress >= mission.goal;

  return (
    <div className="px-0 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className="mono mt-[2px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold leading-none"
            style={done
              ? { background: 'var(--good)', color: 'var(--canvas)' }
              : { border: '1.5px solid var(--line)', color: 'transparent' }}
            aria-hidden
          >
            {done ? '✓' : ''}
          </span>
          <div className="min-w-0">
            <div className={`text-[13px] leading-snug ${done ? 'line-through' : ''}`} style={{ color: done ? 'var(--muted-2)' : 'var(--ink)' }}>
              {mission.label}
            </div>
            {/*
              ⚠️ CHỈ CÒN DÒNG "đã xong" (đổi 2026-08-29). Bản cũ ghi `Tiến độ hiện tại: 0/1` ở đây,
              trong khi CHÍNH con số `0/1` ấy đã nằm ngay bên phải cùng một hàng, cách chưa tới một
              đốt ngón tay. Ba nhiệm vụ × một dòng thừa = ~60px nhiễu, và mắt phải đọc hai lần để
              nhận ra không có gì mới. Luật sẵn có của dự án: *hai chỗ nói cùng một chuyện thì chỗ
              nói ít hơn phải nhường* — ở đây chỗ nói ít hơn là dòng chữ, vì con số bên phải còn
              mang thêm màu trạng thái.
              Dòng "Đã hoàn tất." thì GIỮ: nó không lặp lại gì (bên phải khi ấy ghi "xong"), và một
              lời xác nhận ở chỗ vừa tick xong là thứ đáng giữ.
            */}
            {done && (
              <div className="mt-1 text-[11px] text-[var(--muted)]">Đã hoàn tất.</div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="mono text-[11px] font-semibold tabular-nums" style={{ color: done ? 'var(--good)' : 'var(--muted)' }}>
            {done ? 'xong' : `${mission.progress}/${mission.goal}`}
          </div>
          {/*
            ⚠️ CÓ ĐƠN VỊ, KHÔNG PHẢI SỐ TRẦN (round 43, ADR-082). This cell printed «+38» directly
            under «0/45» — two numbers, two different quantities, and only one of them labelled.
            A bare number is worse than a number in a unit Đàm cannot spend: he cannot even tell
            WHICH game it belongs to. Three characters buy the whole answer.
          */}
          <div className="mono mt-1 text-[11px] font-semibold tabular-nums" style={{ color: 'var(--accent2)' }}>
            +{rewardXP} XP
          </div>
        </div>
      </div>

      <div className="mt-2 h-[2px] overflow-hidden rounded-full bg-[var(--line)]">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          {...barMotion}
          style={{
            background: done ? 'var(--good)' : 'var(--accent)',
          }}
        />
      </div>
    </div>
  );
}

function WeeklyStepRow({ done, index, isCurrent, progress, step }) {
  const pct = Math.max(0, Math.min(100, (progress / Math.max(1, step.goal)) * 100));

  return (
    <div className="px-0 py-3">
      <div className="flex items-start gap-3">
        <div
          className="mono mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums"
          style={{
            background: done ? 'var(--ink)' : isCurrent ? 'rgba(var(--accent-rgb), 0.12)' : 'rgba(244, 242, 236, 0.96)',
            color: done ? 'var(--canvas)' : isCurrent ? 'var(--accent2)' : 'var(--muted)',
          }}
        >
          {done ? '✓' : index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-[13px] leading-snug ${done ? 'line-through' : ''}`} style={{ color: done ? 'var(--muted-2)' : 'var(--ink)' }}>
            {step.label}
          </div>
          {/*
            ⚠️ ĐÃ GỠ CỘT «%» (2026-09-01) — VÀ ĐÓ VỪA LÀ DỌN NHIỄU VỪA LÀ VÁ MỘT LỖI THẬT.
            (a) Nó là HÀM của dòng chữ ngay bên trái nó: "Đã chốt" ⇒ 100%, "Đang chờ" ⇒ 0%,
                "2/3" ⇒ 67%. Cộng thanh tiến độ ngay bên dưới nữa là BA cách mã hoá một con số.
            (b) VÀ NÓ NÓI NGƯỢC ĐÚNG LÚC ĂN MỪNG. Khi chuỗi tuần hoàn tất:
                `chainStepIndex = steps.length − 1` (=3) nhưng `chainStepsCompleted = steps.length`
                (=4). Ở bước CUỐI (index=3): cột trái `done = 3 < 4 = true` ⇒ in **"Đã chốt"**;
                cột phải `isCurrent=false` nên rơi vào `index < currentIndex` = `3 < 3` = false
                ⇒ in **"0%"**. Một bước vừa hoàn tất bị báo cáo là 0%, ngay tại khoảnh khắc trả
                phần thưởng lớn nhất của tuần. Lỗi này có ở MỌI độ dài chuỗi ≥1.
                Không cổng nào bắt được vì hai cột đều "đúng" theo công thức của riêng nó — đó
                chính là cái giá của việc mã hoá một sự thật hai lần bằng hai công thức.
          */}
          <div className="mt-1 text-[11px] text-[var(--muted)]">
            {isCurrent ? `${progress}/${step.goal}` : done ? 'Đã chốt' : 'Đang chờ'}
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
    borderRadius: 'var(--skin-radius-control, 14px)',
  };
}
