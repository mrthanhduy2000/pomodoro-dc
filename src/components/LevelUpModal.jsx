import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import useGameStore from '../store/gameStore';
import soundEngine from '../engine/soundEngine';

const DISPLAY_FONT = '"Source Serif 4", Georgia, serif';
const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';

const PARTICLES = Array.from({ length: 10 }, (_, index) => ({
  id: index,
  angle: (index / 10) * Math.PI * 2,
  distance: 120 + (index % 3) * 18,
  size: 5 + (index % 3),
  delay: index * 0.05,
  color: [
    'rgba(201,100,66,0.38)',
    'rgba(163,158,150,0.34)',
    'rgba(255,255,255,0.55)',
  ][index % 3],
}));

export default function LevelUpModal() {
  const queue = useGameStore((state) => state.ui.levelUpQueue);
  const dismissLevelUp = useGameStore((state) => state.dismissLevelUp);

  const current = queue[0] ?? null;

  useEffect(() => {
    if (!current) return;
    soundEngine.playLevelUp();
    const timeoutId = window.setTimeout(dismissLevelUp, 4000);
    return () => window.clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.newLevel]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.newLevel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(31, 30, 29, 0.26)', backdropFilter: 'blur(10px)' }}
          onClick={dismissLevelUp}
        >
          <ParticleField />

          <motion.div
            initial={{ y: 20, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="pointer-events-none mx-4 flex max-w-[420px] flex-col items-center gap-5 rounded-[34px] border px-8 py-9 text-center select-none"
            style={{
              background: 'rgba(255,255,255,0.97)',
              borderColor: 'var(--line)',
              boxShadow: '0 24px 58px rgba(31,30,29,0.12)',
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.28em]"
              style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
            >
              Cấp độ mới
            </p>

            <motion.div
              initial={{ scale: 0.82 }}
              animate={{ scale: [0.82, 1.03, 1] }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative flex h-40 w-40 items-center justify-center rounded-full border"
              style={{
                borderColor: 'rgba(var(--accent-rgb),0.18)',
                background: 'rgba(244,242,236,0.92)',
                boxShadow: '0 14px 30px rgba(31,30,29,0.08)',
              }}
            >
              <div
                className="absolute inset-x-6 top-5 h-[2px] rounded-full"
                style={{ background: 'rgba(var(--accent-rgb),0.42)' }}
              />
              <span
                className="relative text-[76px] font-medium leading-none"
                style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}
              >
                {current.newLevel}
              </span>
            </motion.div>

            <div className="space-y-2">
              <h2
                className="text-[34px] font-medium leading-none tracking-[-0.04em]"
                style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}
              >
                Bạn vừa lên cấp
              </h2>
              <p className="text-sm leading-6" style={{ color: 'var(--ink-2)' }}>
                Một nhịp tiến mới đã được ghi lại. Điểm kỹ năng và mốc cấp độ đều đã cập nhật.
              </p>
            </div>

            {current.levelsGained > 1 && (
              <div
                className="rounded-full border px-4 py-1.5 text-sm font-semibold"
                style={{
                  borderColor: 'rgba(var(--accent-rgb),0.16)',
                  background: 'rgba(var(--accent-rgb),0.08)',
                  color: 'var(--accent2)',
                }}
              >
                +{current.levelsGained} cấp trong cùng một lượt
              </div>
            )}

            {current.spGained > 0 && (
              <div
                className="flex w-full items-center gap-3 rounded-[22px] border px-4 py-3 text-left"
                style={{
                  borderColor: 'var(--line)',
                  background: 'rgba(244,242,236,0.8)',
                }}
              >
                <div
                  className="mono flex h-11 w-11 items-center justify-center rounded-[15px] border text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{
                    borderColor: 'rgba(var(--accent-rgb),0.14)',
                    background: 'rgba(var(--accent-rgb),0.08)',
                    color: 'var(--accent2)',
                    fontFamily: MONO_FONT,
                  }}
                >
                  SP
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
                  >
                    Thưởng kỹ năng
                  </p>
                  <p className="mt-1 text-base font-semibold" style={{ color: 'var(--ink)' }}>
                    +{current.spGained} điểm kỹ năng
                  </p>
                </div>
              </div>
            )}

            <p
              className="text-[11px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--muted-2)', fontFamily: MONO_FONT }}
            >
              Chạm bất kỳ đâu để tiếp tục
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ParticleField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ opacity: 0, x: '50vw', y: '50vh', scale: 0.5 }}
          animate={{
            opacity: [0, 1, 0],
            x: `calc(50vw + ${Math.cos(particle.angle) * particle.distance}px)`,
            y: `calc(50vh + ${Math.sin(particle.angle) * particle.distance}px)`,
            scale: [0.5, 1, 0.8],
          }}
          transition={{ duration: 1.15, delay: particle.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: particle.size,
            height: particle.size,
            borderRadius: '999px',
            background: particle.color,
          }}
        />
      ))}
    </div>
  );
}
