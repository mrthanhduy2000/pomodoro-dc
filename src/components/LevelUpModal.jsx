import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SCRIM_FADE, useCustomMotion, useEnterMotion, useRewardMotion } from '../lib/motionPresets';

import useGameStore from '../store/gameStore';

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

/**
 * ⚠️ TỪ 2026-08-27 (ADR-060) MÀN NÀY KHÔNG CÒN TỰ BẬT. Lên cấp không buộc Đàm
 * quyết định gì nên nó thuộc nhóm toast; hộp thoại này là phần CHI TIẾT, chỉ mở
 * khi Đàm bấm vào thẻ (`GlobalOverlays` truyền `autoDismissMs={0}`).
 *
 * ⚠️ HAI THỨ ĐÃ RỜI ĐI, VÀ CẢ HAI ĐỀU CÓ LÝ DO — đừng "khôi phục cho đầy đủ":
 *   • Hẹn giờ tự đóng: một hộp thoại Đàm CHỦ ĐỘNG mở mà tự biến mất sau 4 giây
 *     là lấy mất đúng thứ anh vừa xin xem.
 *   • `soundEngine.playLevelUp()`: chồng toast đã phát đúng MỘT tiếng lúc thẻ
 *     xuất hiện. Kêu lại ở đây là một lần lên cấp phát tiếng hai lần.
 *
 * `autoDismissMs` giữ lại làm CÔNG TẮC chứ không phải mặc định ẩn: mặc định là 0
 * (không hẹn giờ), nên nếu ngày nào có người muốn màn này tự bật lại thì phải
 * truyền số vào một cách tường minh và sẽ đọc thấy khối chú thích này.
 */
export default function LevelUpModal({ autoDismissMs = 0 }) {
  const queue = useGameStore((state) => state.ui.levelUpQueue);
  const dismissLevelUp = useGameStore((state) => state.dismissLevelUp);
  const enterMotion = useEnterMotion();
  // Con số cấp độ mới là một CỘT MỐC — đúng chỗ để tiêu nhịp đắt nhất.
  const rewardMotion = useRewardMotion();
  // Lớp phủ tối chỉ mờ dần, không trôi — xem `SCRIM_FADE` ở `motionPresets.js`.
  const scrimMotion = useCustomMotion(SCRIM_FADE);

  const current = queue[0] ?? null;

  useEffect(() => {
    if (!current || autoDismissMs <= 0) return undefined;
    const timeoutId = window.setTimeout(dismissLevelUp, autoDismissMs);
    return () => window.clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.newLevel, autoDismissMs]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.newLevel}
          {...scrimMotion}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(31, 30, 29, 0.26)', backdropFilter: 'blur(10px)' }}
          onClick={dismissLevelUp}
        >
          <ParticleField />

          <motion.div
            {...enterMotion}
            className="pointer-events-none mx-4 flex max-w-[420px] flex-col items-center gap-5 border px-8 py-9 text-center select-none"
            style={{
              background: 'var(--card-bg-solid)',
              borderColor: 'var(--line)',
              borderWidth: 'var(--skin-card-border-width,1px)',
              borderRadius: 'var(--skin-radius-card,18px)',
              boxShadow: 'var(--skin-card-shadow, 0 24px 58px rgba(31,30,29,0.12))',
            }}
          >
            <p
              className="mono text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: 'var(--muted-2)', fontFamily: MONO_FONT }}
            >
              Cấp độ mới
            </p>

            <motion.div
              {...rewardMotion}
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
                className="relative text-[76px] font-semibold leading-none tabular-nums"
                style={{ color: 'var(--ink)', fontFamily: 'var(--skin-font-display, ' + DISPLAY_FONT + ')' }}
              >
                {current.newLevel}
              </span>
            </motion.div>

            <div className="space-y-2">
              <h2
                className="text-[34px] font-semibold leading-none tracking-[-0.04em]"
                style={{ color: 'var(--ink)', fontFamily: 'var(--skin-font-display, ' + DISPLAY_FONT + ')' }}
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
                  background: 'rgba(var(--accent-rgb),0.1)',
                  color: 'var(--accent2)',
                }}
              >
                +{current.levelsGained} cấp trong cùng một lượt
              </div>
            )}

            {current.spGained > 0 && (
              <div
                className="flex w-full items-center gap-3 border px-4 py-3 text-left"
                style={{
                  borderColor: 'var(--line)',
                  background: 'var(--card-bg-solid2, rgba(244,242,236,0.8))',
                  borderRadius: 'var(--skin-radius-control,14px)',
                }}
              >
                <div
                  className="mono flex h-11 w-11 items-center justify-center border text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{
                    borderColor: 'rgba(var(--accent-rgb),0.14)',
                    background: 'rgba(var(--accent-rgb),0.1)',
                    color: 'var(--accent2)',
                    fontFamily: MONO_FONT,
                    borderRadius: 'var(--skin-radius-control,14px)',
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
  // NGOẠI LỆ (trang trí) — pháo hoa bay ra từ tâm màn hình. Không mang một chữ thông tin nào,
  // nên bật Giảm chuyển động thì bỏ HẲN: đây đúng là loại chuyển động lớn mà tuỳ chọn ấy nhắm tới.
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
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
