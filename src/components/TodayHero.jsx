/**
 * TodayHero.jsx — khối mở đầu màn Tập trung: chuỗi · dải bảy ngày · mốc kế tiếp (ADR-068).
 *
 * ⚠️ NÓ THAY hai thứ đã có, không đứng cạnh chúng: ô "Chuỗi 7 / 14" ở thanh tiêu đề (ẩn ở tab
 * Tập trung, còn nguyên ở các tab khác) và hai thẻ "Hôm nay"/"Chuỗi" của cột phải desktop (đã gỡ).
 * Luật sẵn có của dự án: *hai chỗ nói cùng một chuyện thì chỗ nói ít hơn phải nhường*.
 *
 * ⚠️ KHÔNG in "Phiên 2/5 hôm nay" hay số phút hôm nay — con số phiên đã ở ngay dưới đồng hồ, cùng một
 * màn hình; số phút thì ở thanh tiêu đề của các tab khác và ở Thống kê. Thứ khối này nói về hôm nay
 * là TRẠNG THÁI CỦA CHUỖI (đã giữ chưa), không phải số đếm.
 *
 * Luật tính ở `todayHero.js`; file này chỉ vẽ.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';

import useGameStore from '../store/gameStore';
import { useEnterMotion } from '../lib/motionPresets';
import { FlameGlyph, ShieldGlyph } from './icons/Glyph';
import WeekStrip from './WeekStrip';
import { buildWeekStrip, describeStreakTarget, streakBonusPercent } from './todayHero';

const cardStyle = {
  background: 'var(--card-bg-solid)',
  border: 'var(--skin-card-border-width,1px) solid var(--line)',
  borderRadius: 'var(--skin-radius-card,18px)',
  boxShadow: 'var(--skin-card-shadow)',
};

export default function TodayHero({
  title,
  todayKey,
  mondayKey,
  sessionsCompletedToday = 0,
}) {
  const enterMotion = useEnterMotion();
  const history = useGameStore((s) => s.history);
  const currentStreak = useGameStore((s) => s.streak?.currentStreak ?? 0);
  const shieldUsedWeekKey = useGameStore((s) => s.streak?.skipShieldUsedWeekKey ?? null);
  const hasShield = useGameStore((s) => Boolean(s.player.unlockedSkills?.la_chan_streak));
  const buildings = useGameStore((s) => s.buildings);

  const days = useMemo(
    () => buildWeekStrip({ history, todayKey, mondayKey, sessionsCompletedToday }),
    [history, todayKey, mondayKey, sessionsCompletedToday],
  );
  const target = describeStreakTarget(currentStreak);
  const bonusPct = streakBonusPercent(currentStreak, buildings);
  const shieldReady = hasShield && shieldUsedWeekKey !== mondayKey;
  const atRisk = currentStreak >= 1 && sessionsCompletedToday === 0;
  const noStreak = currentStreak < 1;

  // Khi chuỗi đang treo, câu kéo-về-nút-Bắt-đầu đứng thay chỗ mốc kế tiếp: hôm nay chưa giữ
  // được thì "còn 7 ngày" là một con số chưa có thật.
  const dongPhai = noStreak
    ? 'Một phiên hôm nay là bắt đầu chuỗi'
    : atRisk
      ? 'Làm một phiên để giữ chuỗi'
      : target.text;
  const mauDongPhai = atRisk ? 'var(--accent2)' : target.permanent ? 'var(--accent2)' : 'var(--muted)';

  return (
    <motion.section {...enterMotion} className="mb-3 md:mb-4">
      {/*
        ⚠️ LỜI CHÀO CÒN MỘT DÒNG NHỎ, KHÔNG CÒN LÀ TIÊU ĐỀ 19px HAI DÒNG. Đo ở khung 390px sau khi
        thêm khối chuỗi: nút Bắt đầu tụt xuống y≈765–800 trong khi thanh tab bắt đầu ở y=774 — lần
        thứ TƯ màn này để nút chính chui xuống dưới thanh tab (vòng 19, 20, 24, và suýt lần này).
        Tiếng nói giữ nguyên (đó là giọng của app), chỉ nhường cỡ chữ cho thứ mang tin: dải bảy ngày.
      */}
      {title && (
        <p className="mb-2 px-1 text-[13px] leading-snug" style={{ color: 'var(--ink-2)' }}>
          {title}
        </p>
      )}

      <div className="px-4 py-3" style={cardStyle}>
        {/*
          ⚠️ MỖI HÀNG MỘT DÒNG, KHÔNG XUỐNG DÒNG. Bản đầu xếp câu mốc/câu giữ chuỗi vào cột phải cạnh
          cụm "7 ngày liên tiếp": ở 390px hai bên tranh chỗ và CẢ HAI cùng gãy dòng ("ngày liên /
          tiếp", "Làm một phiên để giữ / chuỗi") — ảnh 390px bắt được. Nay cột phải chỉ còn một
          chip, câu mốc xuống hàng riêng dưới dải bảy ngày, đúng thứ tự mắt đọc: số → tuần → đích.
        */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
            <span style={{ color: noStreak ? 'var(--muted-2)' : 'var(--accent)', display: 'inline-flex' }}>
              <FlameGlyph size={20} />
            </span>
            <span
              className="text-[30px] font-semibold leading-none tabular-nums tracking-[-0.03em]"
              style={{ color: noStreak ? 'var(--muted)' : 'var(--accent2)', fontFamily: 'var(--skin-font-display)' }}
            >
              {currentStreak}
            </span>
            <span className="text-[12px] leading-none" style={{ color: 'var(--muted)' }}>
              {noStreak ? 'chưa có chuỗi' : 'ngày liên tiếp'}
            </span>
            {hasShield && (
              <span
                title={shieldReady ? 'Lá chắn chuỗi: còn dùng được tuần này' : 'Lá chắn chuỗi: đã dùng tuần này'}
                aria-label={shieldReady ? 'Lá chắn chuỗi còn' : 'Lá chắn chuỗi đã dùng'}
                style={{ opacity: shieldReady ? 1 : 0.32, color: 'var(--good)', display: 'inline-flex' }}
              >
                <ShieldGlyph size={15} />
              </span>
            )}
          </div>
          {bonusPct > 0 && (
            <span
              className="mono shrink-0 rounded-full px-2 py-[3px] text-[10.5px] font-semibold tabular-nums"
              style={{ background: 'rgba(var(--accent-rgb), 0.10)', color: 'var(--accent2)' }}
            >
              +{bonusPct.toFixed(0)}% XP/phiên
            </span>
          )}
        </div>

        <div className="mt-2.5">
          <WeekStrip days={days} />
        </div>

        <p
          className="mt-2 truncate text-center text-[11px] leading-snug"
          style={{ color: mauDongPhai, fontWeight: atRisk ? 600 : 400 }}
        >
          {dongPhai}
        </p>
      </div>
    </motion.section>
  );
}
