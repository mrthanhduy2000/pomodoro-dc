import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import useGameStore from '../store/gameStore';
import {
  PRESTIGE_BONUS_PER_RUN,
  PRESTIGE_MAX_STACKS,
  PRESTIGE_EP_REQUIREMENT,
} from '../engine/constants';

const DISPLAY_FONT = '"Source Serif 4", Georgia, serif';
const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';

const KEPT_ITEMS = [
  { icon: 'DV', label: 'Di vật', desc: 'Các relic và buff vĩnh viễn' },
  { icon: 'TT', label: 'Thành tích', desc: 'Toàn bộ dấu đã mở khóa' },
  { icon: 'CT', label: 'Công trình', desc: 'Những công trình đã dựng' },
  { icon: 'LS', label: 'Lịch sử', desc: '50 phiên gần nhất được giữ lại' },
];

const RESET_ITEMS = [
  { icon: 'XP', label: 'XP', desc: 'Bắt đầu lại từ 0' },
  { icon: 'LV', label: 'Cấp độ', desc: 'Level và XP quay về đầu vòng' },
  { icon: 'TN', label: 'Tài nguyên', desc: 'Kho nguyên liệu được làm mới' },
  { icon: 'KN', label: 'Kỹ năng', desc: 'Cây kỹ năng reset hoàn toàn' },
  { icon: 'DX', label: 'Danh xưng', desc: 'Thứ bậc quay về mốc đầu' },
  { icon: 'BV', label: 'Bản vẽ', desc: 'Blueprint được dọn lại' },
];

function InventorySection({ items, title, subtitle, tone = 'neutral' }) {
  const theme = tone === 'kept'
    ? {
        chipBg: 'rgba(91,122,82,0.10)',
        chipBorder: 'rgba(91,122,82,0.18)',
        chipText: '#5b7a52',
      }
    : {
        chipBg: 'rgba(201,100,66,0.08)',
        chipBorder: 'rgba(201,100,66,0.16)',
        chipText: 'var(--accent2)',
      };

  return (
    <section
      className="rounded-[24px] border p-4"
      style={{
        borderColor: 'var(--line)',
        background: 'rgba(255,255,255,0.82)',
      }}
    >
      <div className="mb-3">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
        >
          {subtitle}
        </p>
        <h3
          className="mt-1 text-[24px] font-medium tracking-[-0.03em]"
          style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}
        >
          {title}
        </h3>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3 border-t px-1 py-3 first:border-t-0 first:pt-0 last:pb-0"
            style={{
              borderColor: 'var(--line)',
            }}
          >
            <div
              className="mono flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{
                borderColor: theme.chipBorder,
                background: theme.chipBg,
                color: theme.chipText,
              }}
            >
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                {item.label}
              </p>
              <p className="mt-1 text-xs leading-5" style={{ color: 'var(--muted)' }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PrestigeModal() {
  const isOpen = useGameStore((state) => state.ui.prestigeModalOpen);
  const closePrestige = useGameStore((state) => state.closePrestigeModal);
  const triggerPrestige = useGameStore((state) => state.triggerPrestige);
  const prestige = useGameStore((state) => state.prestige);
  const totalEP = useGameStore((state) => state.progress.totalEP);

  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const canPrestige = totalEP >= PRESTIGE_EP_REQUIREMENT;
  const newCount = prestige.count + 1;
  const newBonus = Math.min(
    PRESTIGE_MAX_STACKS * PRESTIGE_BONUS_PER_RUN,
    prestige.permanentBonus + PRESTIGE_BONUS_PER_RUN,
  );

  const handlePrestige = () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    triggerPrestige();
    setConfirmed(false);
    closePrestige();
  };

  const handleClose = () => {
    setConfirmed(false);
    closePrestige();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(31, 30, 29, 0.34)', backdropFilter: 'blur(10px)' }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: 26, scale: 0.96, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 16, scale: 0.97, opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative w-full max-w-3xl rounded-[34px] border p-6"
          style={{
            background: 'rgba(255,255,255,0.97)',
            borderColor: 'var(--line)',
            boxShadow: '0 26px 72px rgba(31,30,29,0.16)',
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="absolute inset-x-8 top-0 h-[2px] rounded-full"
            style={{ background: 'rgba(var(--accent-rgb),0.44)' }}
          />

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.28em]"
                  style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
                >
                  Prestige
                </p>
                <h2
                  className="mt-2 text-[40px] font-medium leading-none tracking-[-0.05em]"
                  style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}
                >
                  Bắt đầu một vòng mới
                </h2>
                <p className="mt-3 text-[14px] leading-6" style={{ color: 'var(--ink-2)' }}>
                  Đây là thao tác làm mới hành trình hiện tại để tích lũy bonus vĩnh viễn. Những gì đáng giữ sẽ theo bạn sang vòng mới, phần còn lại được làm sạch để nhịp phát triển quay về điểm đầu.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 lg:max-w-[320px] lg:justify-end">
                <span
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: 'var(--line)',
                    background: 'rgba(255,255,255,0.86)',
                    color: 'var(--muted)',
                  }}
                >
                  Vòng {newCount}
                </span>
                <span
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: 'rgba(var(--accent-rgb),0.16)',
                    background: 'rgba(var(--accent-rgb),0.08)',
                    color: 'var(--accent2)',
                  }}
                >
                  Tổng bonus mới: +{(newBonus * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {!canPrestige && (
              <div
                className="rounded-[22px] border px-4 py-3"
                style={{
                  borderColor: 'rgba(var(--accent-rgb),0.18)',
                  background: 'rgba(var(--accent-rgb),0.08)',
                }}
              >
                <p className="text-sm leading-6" style={{ color: 'var(--accent2)' }}>
                  Cần {PRESTIGE_EP_REQUIREMENT.toLocaleString()} EP để thực hiện prestige. Hiện tại bạn có {totalEP.toLocaleString()} EP.
                </p>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <InventorySection
                items={KEPT_ITEMS}
                title="Những gì được giữ"
                subtitle="Mang sang vòng mới"
                tone="kept"
              />
              <InventorySection
                items={RESET_ITEMS}
                title="Những gì được làm mới"
                subtitle="Quay về mốc đầu"
                tone="reset"
              />
            </div>

            <AnimatePresence>
              {confirmed && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-[22px] border px-4 py-3"
                  style={{
                    borderColor: 'rgba(var(--accent-rgb),0.18)',
                    background: 'rgba(var(--accent-rgb),0.08)',
                  }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                    style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
                  >
                    Xác nhận lần cuối
                  </p>
                  <p className="mt-1 text-sm leading-6" style={{ color: 'var(--accent2)' }}>
                    Hành động này không thể hoàn tác. Nhấn thêm một lần nữa nếu bạn muốn bắt đầu vòng prestige mới ngay bây giờ.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-[18px] border px-5 py-3 text-sm font-semibold transition"
                style={{
                  borderColor: 'var(--line)',
                  background: 'rgba(255,255,255,0.88)',
                  color: 'var(--ink-2)',
                }}
              >
                Hủy
              </button>
              <motion.button
                type="button"
                whileHover={canPrestige ? { y: -1 } : {}}
                whileTap={canPrestige ? { scale: 0.99 } : {}}
                onClick={canPrestige ? handlePrestige : undefined}
                disabled={!canPrestige}
                className="flex-1 rounded-[18px] border px-5 py-3 text-sm font-semibold transition"
                style={canPrestige ? {
                  borderColor: confirmed ? 'rgba(31,30,29,0.12)' : 'rgba(var(--accent-rgb),0.16)',
                  background: confirmed
                    ? 'rgba(31,30,29,0.98)'
                    : 'rgba(var(--accent-rgb),0.92)',
                  color: 'var(--canvas)',
                  boxShadow: confirmed
                    ? '0 14px 28px rgba(31,30,29,0.12)'
                    : '0 14px 28px rgba(var(--accent-rgb),0.16)',
                } : {
                  borderColor: 'var(--line)',
                  background: 'rgba(244,242,236,0.86)',
                  color: 'var(--muted-2)',
                  cursor: 'not-allowed',
                }}
              >
                {confirmed ? 'Xác nhận prestige' : 'Thực hiện prestige'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
