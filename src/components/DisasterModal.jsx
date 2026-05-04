import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import useGameStore from '../store/gameStore';
import soundEngine from '../engine/soundEngine';
import { ERA_METADATA } from '../engine/constants';

const DISPLAY_FONT = '"Source Serif 4", Georgia, serif';
const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';

const ALL_RESOURCES = Object.values(ERA_METADATA).flatMap((metadata) => metadata.resources ?? []);

function getResourceLabel(id) {
  return ALL_RESOURCES.find((resource) => resource.id === id)?.label ?? id;
}

function getResourceMark(id) {
  const label = getResourceLabel(id);
  return label.slice(0, 2).toUpperCase();
}

function formatPenaltyPercent(rate) {
  if (!Number.isFinite(rate)) return null;
  const percent = rate * 100;
  if (percent === 0) return '0';
  if (percent < 1) return percent.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return percent.toFixed(1).replace(/\.0$/, '');
}

function MetricPill({ label, value, tone = 'loss' }) {
  const isLoss = tone === 'loss';
  return (
    <div
      className="rounded-[18px] border px-3 py-2 text-center"
      style={{
        borderColor: isLoss ? 'rgba(var(--accent-rgb),0.16)' : 'rgba(91,122,82,0.18)',
        background: isLoss ? 'rgba(var(--accent-rgb),0.07)' : 'rgba(91,122,82,0.08)',
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
      >
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold" style={{ color: isLoss ? 'var(--accent2)' : 'var(--good)' }}>
        {value}
      </p>
    </div>
  );
}

export default function DisasterModal() {
  const isOpen = useGameStore((state) => state.ui.disasterModalOpen);
  const pendingDisaster = useGameStore((state) => state.ui.pendingDisaster);
  const closeDisasterModal = useGameStore((state) => state.closeDisasterModal);

  return (
    <AnimatePresence>
      {isOpen && pendingDisaster && (
        <DisasterContent data={pendingDisaster} onClose={closeDisasterModal} />
      )}
    </AnimatePresence>
  );
}

function DisasterContent({ data, onClose }) {
  useEffect(() => {
    if (!data.waived) soundEngine.playDisaster();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    disaster,
    deducted,
    waived,
    chargeConsumed,
    progressRatio = null,
    basePenaltyRate = null,
    appliedPenaltyRate = null,
    skillMode = 'default',
  } = data;

  const lostItems = [];
  for (const [, bookLosses] of Object.entries(deducted ?? {})) {
    for (const [resourceId, amount] of Object.entries(bookLosses)) {
      if (amount > 0) lostItems.push({ id: resourceId, amount });
    }
  }

  const tone = waived
    ? {
        edge: 'rgba(91,122,82,0.18)',
        fill: 'rgba(91,122,82,0.08)',
        strong: 'var(--good)',
      }
    : {
        edge: 'rgba(var(--accent-rgb),0.18)',
        fill: 'rgba(var(--accent-rgb),0.08)',
        strong: 'var(--accent2)',
      };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(31, 30, 29, 0.34)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 18, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 10, scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.26, ease: 'easeOut' }}
        className="w-full max-w-md rounded-[32px] border p-6"
        style={{
          background: 'rgba(255,255,255,0.97)',
          borderColor: 'var(--line)',
          boxShadow: '0 24px 62px rgba(31,30,29,0.14)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="mb-5 rounded-[24px] border px-4 py-4 text-center"
          style={{
            borderColor: tone.edge,
            background: tone.fill,
          }}
        >
          <div
            className="mono mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border text-[12px] font-semibold uppercase tracking-[0.2em]"
            style={{
              borderColor: tone.edge,
              background: 'rgba(255,255,255,0.72)',
              color: waived ? 'var(--good)' : 'var(--accent2)',
              fontFamily: MONO_FONT,
            }}
          >
            {waived ? 'OK' : 'BC'}
          </div>

          <p
            className="text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
          >
            {waived ? 'Bảo toàn tiến trình' : 'Biến cố phiên tập trung'}
          </p>
          <h2
            className="mt-2 text-[32px] font-medium leading-none tracking-[-0.04em]"
            style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}
          >
            {waived ? 'Sự tha thứ đã che chắn' : disaster.label}
          </h2>
          <p className="mt-3 text-sm leading-6" style={{ color: waived ? 'var(--good)' : 'var(--ink-2)' }}>
            {waived
              ? chargeConsumed
                ? 'Một lượt tha thứ đã hấp thụ toàn bộ cú trượt này.'
                : 'Thảm họa đã bị chặn trước khi gây ảnh hưởng.'
              : disaster.description}
          </p>
          {!waived && (
            <p className="mt-2 text-xs leading-5" style={{ color: 'var(--muted)' }}>
              Các công trình ổn định, kỳ quan và relic bảo hộ vẫn có thể kéo mức thất thoát này xuống.
            </p>
          )}
        </div>

        {!waived && Number.isFinite(appliedPenaltyRate) && (
          <div className="mb-4 grid grid-cols-3 gap-2">
            <MetricPill label="Phạt gốc" value={`${formatPenaltyPercent(basePenaltyRate)}%`} />
            <MetricPill label="Tiến độ" value={`${formatPenaltyPercent(progressRatio)}%`} />
            <MetricPill label="Phạt thật" value={`${formatPenaltyPercent(appliedPenaltyRate)}%`} />
          </div>
        )}

        {!waived && (
          <div
            className="mb-4 rounded-[24px] border px-4 py-4"
            style={{
              borderColor: 'var(--line)',
              background: 'rgba(255,255,255,0.84)',
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
            >
              Tài nguyên bị trừ
            </p>

            {lostItems.length > 0 ? (
              <div className="mt-3 divide-y" style={{ borderColor: 'rgba(var(--accent-rgb),0.10)' }}>
                {lostItems.map(({ id, amount }) => (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                    style={{
                      borderColor: 'rgba(var(--accent-rgb),0.14)',
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="mono inline-flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-semibold uppercase tracking-[0.14em]"
                        style={{
                          borderColor: 'rgba(var(--accent-rgb),0.14)',
                          background: 'rgba(var(--accent-rgb),0.07)',
                          color: 'var(--accent2)',
                          fontFamily: MONO_FONT,
                        }}
                      >
                        {getResourceMark(id)}
                      </span>
                      <span style={{ color: 'var(--muted)' }}>{getResourceLabel(id)}</span>
                    </div>
                    <span className="mono" style={{ color: 'var(--accent2)', fontWeight: 700, fontFamily: MONO_FONT }}>
                      −{amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
                Không có tài nguyên nào bị trừ trong lần này.
              </p>
            )}

            <p className="mt-3 text-xs leading-5" style={{ color: 'var(--muted)' }}>
              Mức phạt cơ sở nằm trong khoảng 1% đến 5%, sau đó được nhân với tiến độ của phiên trước khi áp dụng các lớp giảm trừ.
            </p>
          </div>
        )}

        {waived && chargeConsumed && (
          <div
            className="mb-4 rounded-[20px] border px-4 py-3"
            style={{
              borderColor: 'rgba(91,122,82,0.18)',
              background: 'rgba(91,122,82,0.08)',
            }}
          >
            <p className="text-sm leading-6" style={{ color: 'var(--good)' }}>
              Lượt tha thứ sẽ được nạp lại theo chu kỳ tuần. Bạn vẫn giữ nguyên nhịp tiến hiện tại.
            </p>
          </div>
        )}

        <div className="flex justify-center">
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={onClose}
            className="rounded-[18px] border px-7 py-3 text-sm font-semibold"
            style={waived ? {
              borderColor: 'rgba(91,122,82,0.18)',
              background: 'rgba(91,122,82,0.12)',
              color: 'var(--good)',
            } : {
              borderColor: 'rgba(var(--accent-rgb),0.16)',
              background: 'rgba(31,30,29,0.98)',
              color: 'var(--canvas)',
              boxShadow: '0 14px 28px rgba(31,30,29,0.12)',
            }}
          >
            {waived ? 'Tiếp tục' : 'Ghi nhận'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
