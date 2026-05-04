import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import useGameStore from '../store/gameStore';
import { formatDeadlineRemaining } from '../engine/challengeEngine';

const DISPLAY_FONT = '"Source Serif 4", Georgia, serif';
const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';

function EditorialButton({ children, onClick, tone = 'ink' }) {
  const styles = tone === 'accent'
    ? {
        borderColor: 'rgba(var(--accent-rgb),0.16)',
        background: 'var(--accent)',
        color: 'var(--canvas)',
        boxShadow: '0 12px 24px rgba(var(--accent-rgb),0.14)',
      }
    : {
        borderColor: 'rgba(31,30,29,0.08)',
        background: 'var(--ink)',
        color: 'var(--canvas)',
        boxShadow: '0 12px 24px rgba(31,30,29,0.12)',
      };

  return (
    <motion.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="rounded-[18px] border px-6 py-3 text-sm font-semibold"
      style={styles}
    >
      {children}
    </motion.button>
  );
}

function DecisionCard({
  icon,
  eyebrow,
  title,
  description,
  detail,
  onClick,
  tone = 'sacrifice',
}) {
  const theme = tone === 'challenge'
    ? {
        edge: 'rgba(var(--accent-rgb),0.18)',
        fill: 'rgba(var(--accent-rgb),0.08)',
        strong: 'var(--accent2)',
      }
    : {
        edge: 'rgba(176,125,59,0.18)',
        fill: 'rgba(242,230,209,0.48)',
        strong: 'var(--warn)',
      };

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full rounded-[24px] border px-4 py-4 text-left"
      style={{
        borderColor: theme.edge,
        background: 'var(--panel)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mono flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{
            borderColor: theme.edge,
            background: theme.fill,
            color: theme.strong,
            fontFamily: MONO_FONT,
          }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
          >
            {eyebrow}
          </p>
          <h4
            className="mt-1 text-[24px] font-medium leading-tight tracking-[-0.03em]"
            style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}
          >
            {title}
          </h4>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--ink-2)' }}>
            {description}
          </p>
          <p className="mt-2 text-xs leading-5 font-semibold" style={{ color: theme.strong }}>
            {detail}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

export default function EraCrisisModal() {
  const isOpen = useGameStore((state) => state.ui.eraCrisisModalOpen);
  const eraCrisis = useGameStore((state) => state.eraCrisis);

  return (
    <AnimatePresence>
      {isOpen && eraCrisis.active && <EraCrisisContent key="crisis" />}
    </AnimatePresence>
  );
}

function EraCrisisContent() {
  const eraCrisis = useGameStore((state) => state.eraCrisis);
  const resolveEraCrisis = useGameStore((state) => state.resolveEraCrisis);
  const closeModal = useGameStore((state) => state.closeEraCrisisModal);

  const isChallengingMode = eraCrisis.choiceMade === 'challenge';
  const [view, setView] = useState(isChallengingMode ? 'challenge' : 'announce');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!eraCrisis.challengeDeadline) return undefined;
    const update = () => setTimeLeft(formatDeadlineRemaining(eraCrisis.challengeDeadline));
    update();
    const intervalId = window.setInterval(update, 60_000);
    return () => window.clearInterval(intervalId);
  }, [eraCrisis.challengeDeadline]);

  const handleSacrifice = () => resolveEraCrisis('sacrifice');
  const handleChallenge = () => {
    resolveEraCrisis('challenge');
    setView('challenge');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(31, 30, 29, 0.34)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        initial={{ y: 24, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 14, scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="relative w-full max-w-2xl rounded-[34px] border"
        style={{
          borderColor: 'var(--line)',
          background: 'var(--panel-strong, var(--panel))',
          boxShadow: '0 24px 62px rgba(31,30,29,0.14)',
          overflow: 'hidden',
        }}
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-5 py-3"
          style={{
            borderColor: 'rgba(var(--accent-rgb),0.14)',
            background: 'rgba(var(--accent-rgb),0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: 'rgba(var(--accent-rgb),0.76)' }}
            />
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.28em]"
              style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
            >
              Khủng hoảng kỷ nguyên
            </p>
          </div>

          {eraCrisis.choiceMade !== null ? (
            <button
              type="button"
              onClick={closeModal}
              className="flex h-8 w-8 items-center justify-center rounded-full border text-sm transition"
              style={{
                borderColor: 'var(--line)',
                background: 'var(--panel)',
                color: 'var(--muted)',
              }}
            >
              ×
            </button>
          ) : null}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {view === 'announce' && (
              <AnnounceView key="announce" eraCrisis={eraCrisis} onNext={() => setView('choose')} />
            )}
            {view === 'choose' && (
              <ChooseView
                key="choose"
                eraCrisis={eraCrisis}
                onSacrifice={handleSacrifice}
                onChallenge={handleChallenge}
              />
            )}
            {view === 'challenge' && (
              <ChallengeProgressView
                key="challenge"
                eraCrisis={eraCrisis}
                timeLeft={timeLeft}
                onClose={closeModal}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AnnounceView({ eraCrisis, onNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: [0.96, 1.02, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="mono mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full border text-[14px] font-semibold uppercase tracking-[0.24em]"
        style={{
          borderColor: 'rgba(var(--accent-rgb),0.18)',
          background: 'rgba(var(--accent-rgb),0.08)',
          boxShadow: '0 12px 28px rgba(var(--accent-rgb),0.10)',
          color: 'var(--accent2)',
          fontFamily: MONO_FONT,
        }}
      >
        BC
      </motion.div>

      <p
        className="text-[10px] font-semibold uppercase tracking-[0.26em]"
        style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
      >
        Biến cố lịch sử
      </p>
      <h2
        className="mt-2 text-[38px] font-medium tracking-[-0.05em]"
        style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}
      >
        {eraCrisis.name}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7" style={{ color: 'var(--ink-2)' }}>
        {eraCrisis.description}
      </p>

      <div
        className="mx-auto mt-5 max-w-xl rounded-[22px] border px-4 py-3"
        style={{
          borderColor: 'rgba(var(--accent-rgb),0.16)',
          background: 'rgba(var(--accent-rgb),0.08)',
        }}
      >
        <p className="text-sm leading-6" style={{ color: 'var(--accent2)' }}>
          Tiến trình kỷ nguyên hiện tại sẽ dừng lại cho tới khi bạn chọn cách vượt qua biến cố này.
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <EditorialButton onClick={onNext} tone="ink">
          Xem hai hướng xử lý
        </EditorialButton>
      </div>
    </motion.div>
  );
}

function ChooseView({ eraCrisis, onSacrifice, onChallenge }) {
  const { sacrificeOption, challengeOption } = eraCrisis;

  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="space-y-5"
    >
      <div className="text-center">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
        >
          Chọn một hướng đi
        </p>
        <h3
          className="mt-2 text-[32px] font-medium tracking-[-0.04em]"
          style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}
        >
          Cách bạn vượt qua khủng hoảng
        </h3>
      </div>

      <div className="grid gap-4">
        <DecisionCard
          icon="I"
          eyebrow="Phương án nhanh"
          title={sacrificeOption.label}
          description={sacrificeOption.description}
          detail={`Mất ${sacrificeOption.resourceLoss * 100}% tài nguyên và giải quyết ngay lập tức`}
          onClick={onSacrifice}
          tone="sacrifice"
        />

        <DecisionCard
          icon="II"
          eyebrow="Phương án nhiều rủi ro hơn"
          title={challengeOption.label}
          description={challengeOption.description}
          detail={`Nếu thành công bạn nhận ${challengeOption.successRelic.label}; nếu trượt sẽ mất ${challengeOption.failureLoss * 100}% tài nguyên`}
          onClick={onChallenge}
          tone="challenge"
        />
      </div>
    </motion.div>
  );
}

function ChallengeProgressView({ eraCrisis, timeLeft, onClose }) {
  const done = eraCrisis.challengeSessionsDone;
  const required = eraCrisis.challengeSessionsRequired;
  const percent = Math.min(100, (done / required) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="text-center"
    >
      <div
        className="mono mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border text-[12px] font-semibold uppercase tracking-[0.18em]"
        style={{
          borderColor: 'rgba(var(--accent-rgb),0.18)',
          background: 'rgba(var(--accent-rgb),0.08)',
          color: 'var(--accent2)',
          fontFamily: MONO_FONT,
        }}
      >
        BC
      </div>

      <p
        className="text-[10px] font-semibold uppercase tracking-[0.24em]"
        style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
      >
        Đang đương đầu
      </p>
      <h3
        className="mt-2 text-[32px] font-medium tracking-[-0.04em]"
        style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}
      >
        {eraCrisis.name}
      </h3>
      <p className="mt-2 text-sm leading-6" style={{ color: 'var(--ink-2)' }}>
        Hoàn thành {required} phiên từ {eraCrisis.challengeMinMinutes} phút trở lên để vượt qua biến cố này bằng chính nhịp tập trung của bạn.
      </p>

      <div className="mt-5 rounded-[22px] border px-4 py-4" style={{ borderColor: 'var(--line)', background: 'rgba(255,255,255,0.82)' }}>
        <div className="flex items-center justify-between gap-3 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          <span>{done} / {required} phiên</span>
          <span style={{ fontFamily: MONO_FONT, color: 'var(--muted)' }}>{Math.round(percent)}%</span>
        </div>
        <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-[var(--line)]">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.5 }}
            style={{ background: 'var(--accent)' }}
          />
        </div>
      </div>

      <div
        className="mt-4 rounded-[22px] border px-4 py-4 text-left"
        style={{
          borderColor: 'rgba(91,122,82,0.18)',
          background: 'rgba(91,122,82,0.08)',
        }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
        >
          Phần thưởng nếu hoàn thành
        </p>
        <p className="mt-2 text-base font-semibold" style={{ color: 'var(--ink)' }}>
          {eraCrisis.challengeOption?.successRelic?.label}
        </p>
        <p className="mt-1 text-sm leading-6" style={{ color: 'var(--good)' }}>
          {eraCrisis.challengeOption?.successRelic?.description}
        </p>
      </div>

      {eraCrisis.challengeDeadline && (
        <p className="mt-4 text-xs" style={{ color: 'var(--muted)' }}>
          Còn lại:{' '}
          <span style={{ color: 'var(--accent2)', fontFamily: MONO_FONT, fontWeight: 700 }}>
            {timeLeft}
          </span>
        </p>
      )}

      <div className="mt-6 flex justify-center">
        <EditorialButton onClick={onClose} tone="accent">
          Đóng và tiếp tục tập trung
        </EditorialButton>
      </div>
    </motion.div>
  );
}
