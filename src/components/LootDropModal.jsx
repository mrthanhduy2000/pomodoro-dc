/**
 * LootDropModal.jsx — Màn Hình Phần Thưởng Dopamine
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-screen loot reveal phát ra lúc 00:00.
 *
 * Trình tự hoạt cảnh (mỗi giai đoạn dùng Framer Motion):
 *   Giai đoạn 0 – Rương rung + vỡ ra
 *   Giai đoạn 1 – EP/EXP cơ bản đếm từ 0 lên
 *   Giai đoạn 2 – Huy hiệu hệ số nhân xuất hiện; số đếm lại đến giá trị cuối
 *   Giai đoạn 3 – Tài nguyên trượt vào từng cái một
 *   Giai đoạn 4 – Đại Trúng Thưởng (bỏ qua nếu không kích hoạt)
 *   Giai đoạn 5 – Băng-rôn lên cấp (bỏ qua nếu không lên cấp)
 *   Giai đoạn 6 – Băng-rôn chuyển kỷ nguyên (bỏ qua nếu không đổi kỷ nguyên)
 *   Giai đoạn 7 – Nút "Nhận Thưởng" mở khóa
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import useGameStore  from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import soundEngine   from '../engine/soundEngine';
import notificationManager from '../engine/notifications';
import {
  ERA_METADATA,
  ERA_REFINED,
  PARTICLE_RAIN_EP_THRESHOLD,
} from '../engine/constants';

const DISPLAY_FONT = '"Source Serif 4", Georgia, serif';
const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';

// Tra cứu phẳng tất cả định nghĩa tài nguyên (tất cả 10 kỷ)
const ALL_RESOURCE_DEFS = Object.values(ERA_METADATA).flatMap((m) => m.resources ?? []);

function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(99, 102, 241, ${alpha})`;
  const normalized = hex.replace('#', '');
  const chunk = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const int = Number.parseInt(chunk, 16);

  if (Number.isNaN(int)) return `rgba(99, 102, 241, ${alpha})`;

  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createRewardPalette(accentHex, lightTheme) {
  if (lightTheme) {
    return {
      overlayBg: 'rgba(250,249,246,0.94)',
      overlayAmbient: 'none',
      shellBg: 'rgba(255,255,255,0.98)',
      shellBorder: 'rgba(217,214,204,0.92)',
      shellShadow: '0 28px 72px rgba(31,30,29,0.14)',
      shellGlow: 'none',
      heroBg: 'rgba(255,255,255,0.94)',
      heroShadow: '0 14px 32px rgba(31,30,29,0.08)',
      iconBoxBg: hexToRgba(accentHex, 0.08),
      iconBoxBorder: hexToRgba(accentHex, 0.14),
      panelBg: 'rgba(255,255,255,0.92)',
      subCardBg: 'rgba(244,242,236,0.9)',
      miniCardBg: 'rgba(250,249,246,0.96)',
      chipBg: hexToRgba(accentHex, 0.08),
      footerBg: 'rgba(255,255,255,0.96)',
      footerCardBg: 'rgba(255,255,255,0.9)',
      footerBorder: 'rgba(217,214,204,0.88)',
      tierText: 'var(--ink)',
      ctaShadow: '0 14px 28px rgba(31,30,29,0.12)',
    };
  }

  return {
    overlayBg: 'rgba(15,13,11,0.96)',
    overlayAmbient: 'none',
    shellBg: 'rgba(21,19,16,0.96)',
    shellBorder: 'rgba(58,52,46,0.9)',
    shellShadow: '0 30px 96px rgba(0,0,0,0.46)',
    shellGlow: 'none',
    heroBg: 'rgba(28,24,19,0.96)',
    heroShadow: '0 18px 46px rgba(0,0,0,0.22)',
    iconBoxBg: 'rgba(255,255,255,0.05)',
    iconBoxBorder: 'rgba(255,255,255,0.08)',
    panelBg: 'rgba(24,21,17,0.9)',
    subCardBg: 'rgba(31,27,22,0.9)',
    miniCardBg: 'rgba(21,19,16,0.82)',
    chipBg: 'rgba(255,255,255,0.04)',
    footerBg: 'rgba(15,13,11,0.96)',
    footerCardBg: 'rgba(31,27,22,0.92)',
    footerBorder: 'rgba(58,52,46,0.9)',
    tierText: '#f8fafc',
    ctaShadow: `0 14px 28px ${hexToRgba(accentHex, 0.2)}`,
  };
}

function resolveRewardPhase(phase, reward) {
  let currentPhase = phase;
  while (
    (currentPhase === 4 && !reward.jackpotTriggered)
    || (currentPhase === 5 && !(reward.levelsGained > 0))
    || (currentPhase === 6 && !reward.eraChanged)
  ) {
    currentPhase += 1;
  }
  return currentPhase;
}

function deterministicUnit(seed) {
  const raw = Math.sin(seed * 12.9898) * 43758.5453123;
  return raw - Math.floor(raw);
}

function buildParticles(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    left: `${deterministicUnit((index + 1) * 3.1 + count) * 100}%`,
    delay: deterministicUnit((index + 1) * 5.7 + count) * 0.8,
    size: 3 + (deterministicUnit((index + 1) * 9.2 + count) * 4),
  }));
}

// ─── Thời lượng từng giai đoạn (ms) ──────────────────────────────────────────
const PHASE_DURATION = {
  0: 900,   // hoạt cảnh rương
  1: 1200,  // đếm cơ bản
  2: 800,   // hiện hệ số nhân
  3: 1200,  // tài nguyên trượt vào
  4: 600,   // đại trúng thưởng (bỏ qua nếu không kích hoạt)
  5: 600,   // lên cấp (bỏ qua nếu không lên cấp)
  6: 800,   // chuyển kỷ nguyên (bỏ qua nếu không đổi)
};

// ─── Hook đếm số có animation ─────────────────────────────────────────────────
function useCountUp(target, duration = 1000, active = true) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    const start = performance.now();

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease out cubic
      setValue(Math.round(target * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, active]);

  return active ? value : 0;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LootDropModal() {
  const isOpen         = useGameStore((s) => s.ui.lootModalOpen);
  const reward         = useGameStore((s) => s.ui.pendingReward);
  const closeLootModal = useGameStore((s) => s.closeLootModal);
  const uiTheme        = useSettingsStore((s) => s.uiTheme);

  if (!isOpen || !reward) return null;

  return (
    <AnimatePresence>
      <LootDropContent key="loot" reward={reward} onClose={closeLootModal} isLightTheme={uiTheme === 'light'} />
    </AnimatePresence>
  );
}

// ─── Nội dung chính ───────────────────────────────────────────────────────────

function LootDropContent({ reward, onClose, isLightTheme }) {
  const [phase, setPhase] = useState(0);
  const resolvedPhase = resolveRewardPhase(phase, reward);
  const canSkip = resolvedPhase >= 2;
  const displayPhase = resolvedPhase >= 4 ? resolvedPhase - 1 : resolvedPhase;

  // ── Tự động chuyển giai đoạn + kích hoạt âm thanh ────────────────────────
  useEffect(() => {
    if (resolvedPhase === 0) soundEngine.playChestOpen();
    if (resolvedPhase === 4 && reward.jackpotTriggered) soundEngine.playJackpot();
    if (resolvedPhase === 5 && reward.levelsGained > 0) {
      soundEngine.playLevelUp();
      notificationManager.notifyLevelUp(reward.newLevel);
    }
    if (resolvedPhase === 6 && reward.eraChanged) soundEngine.playEraChange();
    if (resolvedPhase >= 7) return undefined;

    const duration = PHASE_DURATION[resolvedPhase] ?? 600;
    const t = setTimeout(() => {
      setPhase(resolvedPhase + 1);
    }, duration);

    return () => clearTimeout(t);
  }, [resolvedPhase, reward]);

  const handleClaim = useCallback(() => { onClose(); }, [onClose]);
  const handleSkip  = useCallback(() => { setPhase(7); }, []);

  const eraMeta   = ERA_METADATA[reward.activeBook] ?? ERA_METADATA[1];
  const accentHex = eraMeta.accentColor;
  const accentSoft = hexToRgba(accentHex, 0.2);
  const accentGlow = hexToRgba(accentHex, 0.35);
  const palette = createRewardPalette(accentHex, isLightTheme);
  const totalResourceUnits = Object.values(reward.resources ?? {}).reduce((sum, value) => sum + (value > 0 ? value : 0), 0);
  const displayFinalXP = reward.totalSessionXP ?? reward.finalXP ?? 0;
  const bonusXP = Math.max(0, displayFinalXP - (reward.baseXP ?? 0));
  const xpPerMinute = reward.effectiveMinutes > 0
    ? (displayFinalXP / reward.effectiveMinutes).toFixed(1)
    : '0.0';
  const bonusHighlights = [
    reward.luckyBurstTriggered && {
      icon: 'SD',
      label: 'Số Đỏ',
      value: 'XP / RP / thô ×2.5',
      tone: 'violet',
    },
    reward.overclockBonus > 0 && {
      icon: 'OV',
      label: 'Giam cầm',
      value: `+${reward.overclockBonus.toLocaleString()} XP`,
      tone: 'amber',
    },
    reward.streakDays >= 2 && reward.streakBonus > 0 && {
      icon: 'CH',
      label: `Chuỗi ${reward.streakDays} ngày`,
      value: `+${reward.streakBonus.toLocaleString()} XP`,
      tone: 'orange',
    },
    reward.comboCount >= 2 && reward.comboBonus > 0 && {
      icon: 'CB',
      label: `Combo ×${reward.comboCount}`,
      value: `+${reward.comboBonus.toLocaleString()} XP`,
      tone: 'sky',
    },
    ...(reward.buildingPerkRewards ?? []).map((item) => ({
      icon: 'CT',
      label: item.label,
      value: [
        item.xp > 0 ? `+${item.xp.toLocaleString()} XP` : null,
        item.refined > 0 ? `+${item.refined} tinh luyện` : null,
      ].filter(Boolean).join(' · '),
      tone: 'amber',
    })),
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: palette.overlayBg,
        backdropFilter: 'blur(14px)',
      }}
      onClick={canSkip ? handleSkip : undefined}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{ background: palette.overlayAmbient }}
      />
      <motion.div
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1,   y: 0  }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[32px] backdrop-blur-xl"
        style={{
          maxHeight: '92vh',
          background: palette.shellBg,
          border: `1px solid ${palette.shellBorder}`,
          boxShadow: palette.shellShadow,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Ánh sáng nền ────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: palette.shellGlow }}
        />

        {/* ── Particle Rain ────────────────────────────────────────────── */}
        {resolvedPhase >= 1 && reward.finalEP >= PARTICLE_RAIN_EP_THRESHOLD && (
          <ParticleRain count={24} color={accentHex} />
        )}

        {/* ── Scrollable content area ──────────────────────────────────── */}
        <div
          className="relative z-10 flex-1 overflow-y-auto px-5 pb-4 pt-5 md:px-7 md:pb-5 md:pt-6"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
        >
          <div className="space-y-5">
            <section
              className="relative overflow-hidden rounded-[28px] p-5 md:p-6"
              style={{
                background: palette.heroBg,
                border: `1px solid ${palette.shellBorder}`,
                boxShadow: palette.heroShadow,
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-90"
                style={{
                  background:
                    `radial-gradient(circle at top right, ${hexToRgba(accentHex, 0.18)} 0%, transparent 34%), radial-gradient(circle at bottom left, rgba(99,102,241,0.08) 0%, transparent 28%)`,
                }}
              />

              <div className="relative z-10 flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div
                      className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]"
                      style={{
                        border: `1px solid ${palette.shellBorder}`,
                        background: palette.subCardBg,
                        color: isLightTheme ? 'var(--muted)' : '#cbd5e1',
                        fontFamily: MONO_FONT,
                      }}
                    >
                      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: accentHex }} />
                      Phiên Hoàn Tất
                    </div>
                    <h2
                      className="text-[34px] font-medium leading-none tracking-[-0.05em] md:text-[2.5rem]"
                      style={{ color: isLightTheme ? 'var(--ink)' : '#f8fafc', fontFamily: DISPLAY_FONT }}
                    >
                      {resolvedPhase === 0 ? 'Đang tổng hợp phần thưởng' : 'Tổng kết phiên'}
                    </h2>
                    <p
                      className="mt-2 max-w-xl text-sm leading-6 md:text-[15px]"
                      style={{ color: isLightTheme ? 'var(--ink-2)' : '#cbd5e1' }}
                    >
                      Phiên tập trung {reward.effectiveMinutes} phút đã được ghi lại thành XP, tài nguyên và RP.
                      {reward.bonusMinutes > 0 && (
                        <span style={{ color: isLightTheme ? 'var(--accent2)' : '#c4b5fd' }}>
                          {' '}+{reward.bonusMinutes} phút cộng thêm đã được tính vào tổng phiên này.
                        </span>
                      )}
                    </p>
                  </div>

                  <motion.div
                    animate={resolvedPhase === 0 ? (() => {
                      const shakeIntensity = Math.min(25, Math.floor((reward.effectiveMinutes ?? 25) / 4));
                      return {
                        rotate: [-shakeIntensity / 5, shakeIntensity / 5, -shakeIntensity / 5, shakeIntensity / 5, 0],
                        scale: [1, 1 + shakeIntensity / 100, 0.92, 1 + shakeIntensity / 90, 1],
                      };
                    })() : { y: [0, -6, 0] }}
                    transition={{ duration: resolvedPhase === 0 ? 0.8 : 2.6, repeat: resolvedPhase === 0 ? 0 : Infinity, ease: 'easeInOut' }}
                    className="mono flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-[26px] text-[18px] font-semibold uppercase tracking-[0.18em]"
                    style={{
                      background: palette.iconBoxBg,
                      border: `1px solid ${palette.iconBoxBorder}`,
                      boxShadow: isLightTheme ? '0 12px 28px rgba(31,30,29,0.08)' : `0 16px 38px ${accentGlow}`,
                      color: isLightTheme ? 'var(--accent2)' : '#f4efe7',
                      fontFamily: MONO_FONT,
                    }}
                  >
                    {resolvedPhase === 0 ? 'Đợi' : 'XP'}
                  </motion.div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr]">
                  <AnimatePresence>
                    {resolvedPhase >= 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <XPCounter
                          base={reward.baseXP}
                          final={resolvedPhase >= 2 ? displayFinalXP : reward.baseXP}
                          countDuration={resolvedPhase === 1 ? 900 : 600}
                          bonusXP={bonusXP}
                          xpPerMinute={xpPerMinute}
                          lightTheme={isLightTheme}
                          palette={palette}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-2 gap-3">
                    <HeroStatCard label="Thời lượng" value={`${reward.effectiveMinutes}p`} hint="Pomodoro hoàn tất" palette={palette} />
                    <HeroStatCard label="Hiệu suất" value={`${xpPerMinute} XP/p`} hint="Tốc độ kiếm XP" palette={palette} />
                    <HeroStatCard label="Tài nguyên" value={`+${totalResourceUnits}`} hint="Tổng đơn vị thu được" palette={palette} />
                    <HeroStatCard
                      label="Nghiên cứu"
                      value={reward.rpEarned > 0 ? `+${reward.rpEarned} RP` : 'Không có'}
                      hint="Tiến triển công nghệ"
                      palette={palette}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {resolvedPhase >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap gap-2"
                    >
                      <div
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold"
                        style={{
                          borderColor: hexToRgba(accentHex, 0.45),
                          backgroundColor: isLightTheme ? hexToRgba(accentHex, 0.08) : accentSoft,
                          color: palette.tierText,
                        }}
                      >
                        <span>{reward.tierLabel}{reward.largeChest ? ' · phiên lớn' : ''}</span>
                      </div>
                      {bonusHighlights.map((item) => (
                        <BonusPill key={item.label} {...item} lightTheme={isLightTheme} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {resolvedPhase >= 2 && reward.positiveEvent && ((reward.positiveEventBonus ?? 0) !== 0 || (reward.positiveEventRPBonus ?? 0) !== 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.15, type: 'spring', damping: 15 }}
                      className="grid gap-3 rounded-[24px] p-4 md:grid-cols-[auto_1fr_auto]"
                      style={{
                        border: isLightTheme ? '1px solid rgba(201,100,66,0.14)' : '1px solid rgba(129,140,248,0.30)',
                        background: isLightTheme
                          ? 'linear-gradient(160deg, rgba(255,255,255,0.96), rgba(248,235,228,0.90))'
                          : 'rgba(49,46,129,0.40)',
                      }}
                    >
                      <div
                        className="mono flex h-14 w-14 items-center justify-center rounded-2xl text-[12px] font-semibold uppercase tracking-[0.14em]"
                        style={isLightTheme ? {
                          background: 'rgba(201,100,66,0.10)',
                          border: '1px solid rgba(201,100,66,0.16)',
                          color: 'var(--accent2)',
                          fontFamily: MONO_FONT,
                        } : undefined}
                      >
                        BT+
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                          style={{ color: isLightTheme ? 'var(--muted)' : '#c7d2fe', fontFamily: MONO_FONT }}
                        >
                          Biến cố tích cực
                        </p>
                        <p
                          className="mt-1 text-[24px] font-medium leading-tight"
                          style={{ color: isLightTheme ? 'var(--ink)' : '#ffffff', fontFamily: DISPLAY_FONT }}
                        >
                          {reward.positiveEvent.label}
                        </p>
                        <p className="mt-1 text-sm leading-6" style={{ color: isLightTheme ? 'var(--ink-2)' : 'rgba(224,231,255,0.84)' }}>
                          {reward.positiveEvent.desc}
                        </p>
                      </div>
                      <div className="flex flex-col items-start justify-center md:items-end">
                        <span className="text-2xl font-semibold" style={{ color: isLightTheme ? 'var(--ink)' : '#c7d2fe', fontFamily: DISPLAY_FONT }}>
                          {(reward.positiveEventBonus ?? 0) >= 0 ? '+' : '−'}{Math.abs(reward.positiveEventBonus ?? 0).toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: isLightTheme ? 'var(--muted)' : 'rgba(165,180,252,0.82)', fontFamily: MONO_FONT }}>
                          XP điều chỉnh
                        </span>
                        {(reward.positiveEventRPBonus ?? 0) !== 0 && (
                          <>
                            <span className="mt-2 text-xl font-semibold" style={{ color: isLightTheme ? 'var(--ink)' : '#c7d2fe', fontFamily: DISPLAY_FONT }}>
                              {(reward.positiveEventRPBonus ?? 0) >= 0 ? '+' : '−'}{Math.abs(reward.positiveEventRPBonus ?? 0).toLocaleString()}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: isLightTheme ? 'var(--muted)' : 'rgba(165,180,252,0.82)', fontFamily: MONO_FONT }}>
                              RP điều chỉnh
                            </span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            <AnimatePresence>
              {resolvedPhase >= 3 && (
                <motion.section
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[28px] p-5"
                  style={{
                    background: palette.panelBg,
                    border: `1px solid ${palette.shellBorder}`,
                    boxShadow: isLightTheme ? '0 18px 40px rgba(148,163,184,0.12)' : '0 20px 50px rgba(2,6,23,0.22)',
                  }}
                >
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                        style={{ color: isLightTheme ? 'var(--muted)' : '#94a3b8', fontFamily: MONO_FONT }}
                      >
                        Tài nguyên và nghiên cứu
                      </p>
                      <h3
                        className="mt-1 text-[28px] font-medium leading-none"
                        style={{ color: isLightTheme ? 'var(--ink)' : '#ffffff', fontFamily: DISPLAY_FONT }}
                      >
                        Những gì phiên này mang về
                      </h3>
                      <p className="mt-2 text-sm leading-6" style={{ color: isLightTheme ? 'var(--ink-2)' : '#94a3b8' }}>
                        Từ nguyên liệu thô tới tinh luyện và nghiên cứu, mọi phần thưởng được gom lại ở đây theo cùng một nhịp đọc.
                      </p>
                    </div>
                      <div
                        className="rounded-full px-3 py-1.5 text-sm font-semibold"
                        style={{
                          border: `1px solid ${palette.shellBorder}`,
                          background: palette.subCardBg,
                          color: isLightTheme ? 'var(--muted)' : '#e2e8f0',
                          fontFamily: MONO_FONT,
                        }}
                      >
                        +{totalResourceUnits} đơn vị tài nguyên
                      </div>
                  </div>

                  <ResourceCascade resources={reward.resources} lightTheme={isLightTheme} palette={palette} />

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <SupportRewardCard
                      icon="RP"
                      label="Nghiên cứu"
                      value={reward.rpEarned > 0 ? `+${reward.rpEarned} RP` : 'Không có'}
                      accent="rgba(236,241,245,0.88)"
                      lightTheme={isLightTheme}
                      palette={palette}
                    />
                    {(() => {
                      const refined = ERA_REFINED[reward.activeBook] ?? ERA_REFINED[1];
                      const refinedTotal = (reward.t2Drop ?? 0) + (reward.buildingPerkBonusRefined ?? 0);
                      return (
                        <>
                          <SupportRewardCard
                            icon="TL"
                            label={refined.t2Label}
                            value={refinedTotal > 0 ? `+${refinedTotal}` : 'Không có'}
                            accent="rgba(243,236,239,0.88)"
                            lightTheme={isLightTheme}
                            palette={palette}
                          />
                        </>
                      );
                    })()}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

        {/* ── Giai đoạn 4: Slot Machine Đại Trúng Thưởng ─────────────── */}
        <AnimatePresence>
          {resolvedPhase >= 4 && reward.jackpotTriggered && <SlotMachineReveal lightTheme={isLightTheme} />}
        </AnimatePresence>

        {/* ── Giai đoạn 5: Băng-rôn Lên Cấp ──────────────────────────── */}
        <AnimatePresence>
          {resolvedPhase >= 5 && reward.levelsGained > 0 && (
            <LevelUpBanner newLevel={reward.newLevel} spGained={reward.spGained} lightTheme={isLightTheme} />
          )}
        </AnimatePresence>

        {/* ── Giai đoạn 6: Băng-rôn Chuyển Kỷ Nguyên ─────────────────── */}
        <AnimatePresence>
          {resolvedPhase >= 6 && reward.eraChanged && (
            <EraChangeBanner newBook={reward.newBook} lightTheme={isLightTheme} />
          )}
        </AnimatePresence>

        {/* ── Spacer cuối scroll area ──────────────────────────────────── */}
        <div className="h-2" />
          </div>

        </div>{/* end scrollable content */}

        {/* ── Footer sticky — luôn hiện ở đáy ─────────────────────────── */}
        <div
          className="relative z-10 flex-shrink-0 px-5 pb-5 pt-4 md:px-7 md:pb-6"
          style={{
            borderTop: `1px solid ${palette.footerBorder}`,
            background: palette.footerBg,
          }}
        >
          <div
            className="mb-3 flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
            style={{ border: `1px solid ${palette.footerBorder}`, background: palette.footerCardBg }}
          >
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: isLightTheme ? 'var(--ink)' : '#ffffff' }}
              >
                {resolvedPhase >= 7 ? 'Phần thưởng đã sẵn sàng' : 'Đang hoàn tất phần tổng kết'}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: isLightTheme ? 'var(--muted)' : '#94a3b8' }}>
                {resolvedPhase >= 7 ? 'Chạm nút để quay lại nhịp tập trung.' : canSkip ? 'Bạn có thể chạm bất kỳ đâu để bỏ qua phần chuyển cảnh.' : 'Đợi thêm một chút để hệ thống kết sổ phiên này.'}
              </p>
            </div>
            <div
              className="hidden rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] md:inline-flex"
              style={{
                border: `1px solid ${palette.footerBorder}`,
                background: palette.chipBg,
                color: isLightTheme ? 'var(--muted)' : '#cbd5e1',
                fontFamily: MONO_FONT,
              }}
            >
              {resolvedPhase >= 7 ? 'Sẵn sàng' : `Giai đoạn ${Math.min(displayPhase + 1, 7)}/7`}
            </div>
          </div>

        {/* ── Giai đoạn 7: Nút Nhận Thưởng ───────────────────────────── */}
        <AnimatePresence>
          {resolvedPhase >= 7 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClaim}
                className="w-full rounded-[22px] border py-4 text-[16px] font-semibold tracking-[0.01em]"
                style={{
                  borderColor: 'rgba(31,30,29,0.12)',
                  background: isLightTheme
                    ? 'rgba(31,30,29,0.98)'
                    : 'rgba(var(--accent-rgb),0.92)',
                  color: 'var(--canvas)',
                  boxShadow: isLightTheme ? '0 18px 36px rgba(31,30,29,0.12)' : palette.ctaShadow,
                }}
              >
                Ghi nhận và tiếp tục
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        </div>{/* end footer */}
      </motion.div>
    </motion.div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function XPCounter({ base, final, countDuration, bonusXP, xpPerMinute, lightTheme, palette }) {
  const displayValue = useCountUp(final, countDuration, true);
  const isMultiplied = final > base;

  return (
    <div
      className="h-full rounded-[26px] p-5"
      style={{ background: palette.panelBg, border: `1px solid ${palette.shellBorder}` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: lightTheme ? 'var(--muted)' : '#cbd5e1', fontFamily: MONO_FONT }}
          >
            Điểm kinh nghiệm
          </p>
          <p className="mt-1 text-sm" style={{ color: lightTheme ? 'var(--ink-2)' : '#94a3b8' }}>
            Giá trị cuối sau khi cộng mọi hệ số và phần thưởng thêm.
          </p>
        </div>
        <div
          className="mono flex h-12 w-12 items-center justify-center rounded-2xl text-[12px] font-semibold uppercase tracking-[0.18em]"
          style={{
            border: lightTheme ? '1px solid rgba(245,158,11,0.24)' : '1px solid rgba(250,204,21,0.2)',
            background: lightTheme ? 'rgba(245,158,11,0.08)' : 'rgba(250,204,21,0.1)',
            color: lightTheme ? 'var(--warn)' : '#fde68a',
            fontFamily: MONO_FONT,
          }}
        >
          XP
        </div>
      </div>

      <div className="mt-5 flex items-end gap-3">
        <motion.span
          key={final}
          animate={isMultiplied ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.4 }}
          className="text-5xl font-medium tracking-tight md:text-6xl"
          style={{ color: lightTheme ? 'var(--ink)' : '#fde68a', fontFamily: DISPLAY_FONT }}
        >
          +{displayValue.toLocaleString()}
        </motion.span>
        <span
          className="pb-2 text-sm font-semibold uppercase tracking-[0.26em]"
          style={{ color: lightTheme ? 'var(--muted)' : '#94a3b8', fontFamily: MONO_FONT }}
        >
          XP
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <MiniMetric label="Gốc" value={`+${base.toLocaleString()}`} lightTheme={lightTheme} palette={palette} />
        <MiniMetric label="Thưởng thêm" value={`+${bonusXP.toLocaleString()}`} lightTheme={lightTheme} palette={palette} />
        <MiniMetric label="XP/Phút" value={xpPerMinute} lightTheme={lightTheme} palette={palette} />
      </div>
    </div>
  );
}

function HeroStatCard({ label, value, hint, palette }) {
  return (
    <div
      className="rounded-[22px] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
      style={{ border: `1px solid ${palette.shellBorder}`, background: palette.subCardBg }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}>{label}</p>
      <p className="mt-2 text-[22px] font-medium md:text-[26px]" style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}>{value}</p>
      <p className="mt-1 text-xs leading-5" style={{ color: 'var(--muted)' }}>{hint}</p>
    </div>
  );
}

function MiniMetric({ label, value, palette }) {
  return (
    <div
      className="rounded-2xl px-3 py-3"
      style={{ border: `1px solid ${palette.shellBorder}`, background: palette.miniCardBg }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}>{label}</p>
      <p className="mt-1 text-lg font-semibold" style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}>{value}</p>
    </div>
  );
}

function BonusPill({ icon, label, value, tone, lightTheme }) {
  const toneStyles = {
    amber: lightTheme ? 'border-[rgba(176,125,59,0.22)] bg-[rgba(242,230,209,0.72)] text-[#8b6733]' : 'border-white/8 bg-white/[0.05] text-[var(--ink)]',
    orange: lightTheme ? 'border-[rgba(201,100,66,0.22)] bg-[rgba(248,235,228,0.76)] text-[var(--accent2)]' : 'border-[rgba(var(--accent-rgb),0.18)] bg-white/[0.05] text-[var(--accent-light)]',
    sky: lightTheme ? 'border-[rgba(131,155,176,0.22)] bg-[rgba(236,241,245,0.8)] text-[#5f7386]' : 'border-white/8 bg-white/[0.05] text-[var(--ink)]',
    violet: lightTheme ? 'border-[rgba(166,137,149,0.22)] bg-[rgba(243,236,239,0.8)] text-[#7b5c68]' : 'border-white/8 bg-white/[0.05] text-[var(--ink)]',
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${toneStyles[tone] ?? 'border-white/8 bg-white/[0.05] text-[var(--ink)]'}`}>
      <span className="mono text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ fontFamily: MONO_FONT }}>{icon}</span>
      <span>{label}</span>
      <span className={lightTheme ? 'text-[var(--ink-2)]' : 'text-white/90'}>{value}</span>
    </div>
  );
}

function SupportRewardCard({ icon, label, value, accent, lightTheme, palette }) {
  return (
    <div
      className="rounded-[22px] p-4"
      style={{
        border: `1px solid ${palette.shellBorder}`,
        background: lightTheme
          ? 'rgba(255,255,255,0.92)'
          : 'rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="mono flex h-11 w-11 items-center justify-center rounded-2xl text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={lightTheme ? {
            border: '1px solid rgba(31,30,29,0.08)',
            background: 'rgba(255,255,255,0.80)',
            color: 'var(--ink)',
            fontFamily: MONO_FONT,
          } : undefined}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: lightTheme ? 'var(--ink)' : '#ffffff' }}>{label}</p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.2em]" style={{ color: lightTheme ? 'var(--muted)' : '#94a3b8', fontFamily: MONO_FONT }}>Phụ trợ</p>
        </div>
      </div>
      <p className="mt-4 text-lg font-medium" style={{ color: lightTheme ? 'var(--ink)' : '#ffffff', fontFamily: DISPLAY_FONT }}>{value}</p>
    </div>
  );
}

function ResourceCascade({ resources, lightTheme, palette }) {
  const resEntries = Object.entries(resources ?? {}).filter(([, v]) => v > 0);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {resEntries.map(([id, amount], index) => (
        <motion.div
          key={id}
          initial={{ opacity: 0, scale: 0.5, y: 10 }}
          animate={{ opacity: 1, scale: 1,   y: 0  }}
          transition={{ delay: index * 0.12, type: 'spring', damping: 15 }}
          className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm"
          style={{ border: `1px solid ${palette.shellBorder}`, background: palette.subCardBg }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="mono flex h-11 w-11 items-center justify-center rounded-2xl text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={lightTheme ? {
                border: '1px solid rgba(31,30,29,0.08)',
                background: 'rgba(255,255,255,0.80)',
                color: 'var(--ink)',
                fontFamily: MONO_FONT,
              } : undefined}
            >
              <ResourceMark id={id} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>{ALL_RESOURCE_DEFS.find((r) => r.id === id)?.label ?? id}</p>
              <p className="mt-0.5 text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}>Tài nguyên</p>
            </div>
          </div>
          <div className="rounded-full border px-3 py-1.5 text-sm font-semibold" style={{ borderColor: 'var(--line)', background: 'rgba(255,255,255,0.8)', color: 'var(--ink-2)', fontFamily: MONO_FONT }}>
            +{amount.toLocaleString()}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ResourceMark({ id }) {
  const def = ALL_RESOURCE_DEFS.find((r) => r.id === id);
  const label = def?.label ?? id;
  return <span>{label.slice(0, 2).toUpperCase()}</span>;
}

// ─── Particle Rain ────────────────────────────────────────────────────────────

function ParticleRain({ count = 24, color = '#6366f1' }) {
  const particles = useMemo(() => buildParticles(count), [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full opacity-70"
          style={{ left: p.left, top: '-8px', width: p.size, height: p.size, backgroundColor: color }}
          initial={{ y: -10, opacity: 0.8 }}
          animate={{ y: '110vh', opacity: 0 }}
          transition={{ duration: 1.8, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

// ─── Slot Machine Reveal ──────────────────────────────────────────────────────

function SlotMachineReveal({ lightTheme }) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setSettled(true), 520);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: settled ? [1.1, 1] : 1, opacity: 1 }}
      className="rounded-[28px] p-5 text-center"
      style={{
        border: lightTheme ? '1px solid rgba(var(--accent-rgb),0.18)' : '1px solid rgba(250,204,21,0.35)',
        background: lightTheme
          ? 'rgba(255,255,255,0.96)'
          : 'rgba(255,255,255,0.05)',
        boxShadow: lightTheme ? '0 20px 40px rgba(var(--accent-rgb),0.10)' : '0 14px 28px rgba(0,0,0,0.14)',
      }}
    >
      <div
        className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
        style={{
          borderColor: lightTheme ? 'rgba(var(--accent-rgb),0.16)' : 'rgba(250,204,21,0.25)',
          background: lightTheme ? 'rgba(var(--accent-rgb),0.08)' : 'rgba(250,204,21,0.10)',
          color: lightTheme ? 'var(--accent2)' : '#fde68a',
          fontFamily: MONO_FONT,
        }}
      >
        Bonus lớn
      </div>
      <motion.div
        animate={settled ? { scale: [0.96, 1.02, 1] } : { opacity: [0.5, 1, 0.6] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full border"
        style={{
          borderColor: lightTheme ? 'rgba(var(--accent-rgb),0.16)' : 'rgba(250,204,21,0.25)',
          background: lightTheme ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.16)',
        }}
      >
        <span
          className="text-[42px] font-medium leading-none"
          style={{ color: lightTheme ? 'var(--ink)' : '#fde68a', fontFamily: DISPLAY_FONT }}
        >
          ×3
        </span>
      </motion.div>
      {settled && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-[28px] font-medium" style={{ color: lightTheme ? 'var(--ink)' : '#fde68a', fontFamily: DISPLAY_FONT }}>
            Phần thưởng được nhân ba
          </p>
          <p className="mt-2 text-sm leading-6" style={{ color: lightTheme ? 'var(--accent2)' : 'rgba(254,240,138,0.84)' }}>
            Đây là một lượt thưởng hiếm, nên toàn bộ giá trị của phiên này được khuếch đại thêm.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

function LevelUpBanner({ newLevel, spGained, lightTheme }) {
  return (
    <motion.div
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="grid gap-3 rounded-[28px] p-5 md:grid-cols-[auto_1fr_auto]"
      style={{
        border: lightTheme ? '1px solid var(--line)' : '1px solid rgba(52,211,153,0.35)',
        background: lightTheme
          ? 'rgba(255,255,255,0.96)'
          : 'rgba(24,21,17,0.94)',
        boxShadow: lightTheme ? '0 22px 48px rgba(31,30,29,0.08)' : '0 24px 60px rgba(16,185,129,0.14)',
      }}
    >
      <div className="mono flex h-14 w-14 items-center justify-center rounded-2xl border text-[12px] font-semibold uppercase tracking-[0.18em]" style={lightTheme ? { borderColor: 'rgba(var(--accent-rgb),0.14)', background: 'rgba(var(--accent-rgb),0.08)', color: 'var(--accent2)', fontFamily: MONO_FONT } : { color: '#d1fae5', fontFamily: MONO_FONT } }>LV</div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: lightTheme ? 'var(--muted)' : 'rgba(167,243,208,0.7)', fontFamily: MONO_FONT }}>Thăng cấp</p>
        <p className="mt-1 text-[28px] font-medium" style={{ color: lightTheme ? 'var(--ink)' : '#ffffff', fontFamily: DISPLAY_FONT }}>Đã lên cấp {newLevel}</p>
        <p className="mt-1 text-sm leading-6" style={{ color: lightTheme ? 'var(--ink-2)' : 'rgba(209,250,229,0.82)' }}>+{spGained} điểm kỹ năng đã được thêm vào kho nâng cấp hiện tại.</p>
      </div>
      <div className="rounded-full border px-4 py-2 text-sm font-semibold" style={lightTheme ? { borderColor: 'rgba(var(--accent-rgb),0.14)', background: 'rgba(var(--accent-rgb),0.08)', color: 'var(--accent2)', fontFamily: MONO_FONT } : { borderColor: 'rgba(110,231,183,0.25)', background: 'rgba(110,231,183,0.10)', color: '#d1fae5' }}>
        +{spGained} SP
      </div>
    </motion.div>
  );
}

function EraChangeBanner({ newBook, lightTheme }) {
  const meta    = ERA_METADATA[newBook];
  const newResources = meta?.resources?.slice(0, 3) ?? [];
  const accent  = meta?.accentColor ?? '#6366f1';

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 12, stiffness: 180 }}
      className="mt-4 rounded-2xl overflow-hidden text-center relative"
      style={{
        background: lightTheme
          ? 'rgba(255,255,255,0.98)'
          : 'rgba(24,21,17,0.96)',
        border: lightTheme ? `1px solid ${accent}35` : `2px solid ${accent}60`,
        boxShadow: lightTheme ? '0 18px 40px rgba(31,30,29,0.08)' : `0 18px 42px ${accent}15`,
      }}
    >
      <div className="p-5">
        <div className="flex justify-center mb-2">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.18em] px-3 py-1 rounded-full"
            style={{ background: `${accent}16`, color: lightTheme ? 'var(--accent2)' : accent, border: `1px solid ${accent}36`, fontFamily: MONO_FONT }}
          >
            Kỷ nguyên mới mở
          </span>
        </div>

        <div className="mb-3 flex justify-center">
          <div
            className="mono rounded-2xl border px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.22em]"
            style={{
              borderColor: `${accent}36`,
              background: lightTheme ? 'rgba(255,255,255,0.8)' : `${accent}12`,
              color: lightTheme ? 'var(--accent2)' : '#f4efe7',
              fontFamily: MONO_FONT,
            }}
          >
            Kỷ {newBook}
          </div>
        </div>

        <motion.p
          className="text-[32px] font-medium mb-0.5"
          style={{
            color: lightTheme ? 'var(--ink)' : accent,
            fontFamily: DISPLAY_FONT,
          }}
        >
          {meta?.label}
        </motion.p>
        <p className="text-sm mb-4" style={{ color: lightTheme ? 'var(--ink-2)' : '#cbd5e1' }}>{meta?.subLabel}</p>

        {newResources.length > 0 && (
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${accent}30` }}>
            <p
              className="mb-2 text-xs uppercase tracking-wide"
              style={{ color: lightTheme ? 'var(--muted)' : '#94a3b8', fontFamily: MONO_FONT }}
            >
              Tài nguyên mới mở khóa
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              {newResources.map((r) => (
                <motion.span
                  key={r.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + newResources.indexOf(r) * 0.1, type: 'spring' }}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: `${accent}16`,
                    color: lightTheme ? 'var(--ink-2)' : '#e2e8f0',
                    border: `1px solid ${accent}36`,
                  }}
                >
                  {r.label}
                </motion.span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
