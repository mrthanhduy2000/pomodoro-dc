/**
 * CancelConfirmDialog.jsx — extracted from PomodoroEngine.jsx (ADR-077, round 37): the Focus screen keeps only what answers
 * "what session, how long, how long left"; leaf controls live here so the main file can be read.
 */
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { SCRIM_FADE, useCustomMotion, useEnterMotion } from '../../lib/motionPresets';
import useSettingsStore from '../../store/settingsStore';

function formatPreviewPercent(value) {
  if (!Number.isFinite(value)) return '0';
  if (value === 0) return '0';
  if (value < 1) return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return value.toFixed(1).replace(/\.0$/, '');
}

export default function CancelConfirmDialog({ onAbort, onConfirm, progressPct, recoveryHint }) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  const enterMotion = useEnterMotion();
  const scrimMotion = useCustomMotion(SCRIM_FADE);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onAbort();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAbort]);

  return (
    <motion.div
      {...scrimMotion}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(31, 30, 29, 0.34)', backdropFilter: 'blur(10px)' }}
      onClick={onAbort}
    >
      <motion.div
        {...enterMotion}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-session-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className={`w-full max-w-md rounded-[30px] border p-5 ${
          lightTheme
            ? 'border-[rgba(var(--accent-rgb),0.22)] bg-white shadow-[0_24px_64px_rgba(31,30,29,0.10)]'
            : 'border-white/8 bg-[rgba(21,19,16,0.92)] shadow-[0_22px_56px_rgba(0,0,0,0.24)] backdrop-blur-2xl'
        }`}
      >
        <p
          id="cancel-session-dialog-title"
          className={`mono text-[11px] uppercase tracking-[0.22em] ${lightTheme ? 'text-[var(--accent2)]' : 'text-rose-300'}`}
        >
          Xác nhận hủy phiên
        </p>
        <p className={`mt-2 text-sm leading-relaxed ${lightTheme ? 'text-[var(--ink-2)]' : 'text-slate-200'}`}>
          {/* ADR-069: không còn «phạt N% tài nguyên». Sự thật còn lại là phiên này sẽ KHÔNG tính XP/EP
              — nói thẳng, không đe doạ. */}
          Phiên hủy không tính XP, EP hay nhịp hôm nay — chỉ số phút đã chạy được ghi vào thống kê.
        </p>
        <p className={`mt-2 text-xs leading-relaxed ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-400'}`}>
          Tiến độ hiện tại {formatPreviewPercent(progressPct)}%.
          {recoveryHint ? ` ${recoveryHint}` : ''}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAbort}
            className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
              lightTheme
                ? 'border-[var(--line)] bg-[rgba(244,242,236,0.82)] text-[var(--ink)] hover:border-[var(--line-2)]'
                : 'border-[var(--line)] bg-[var(--panel-soft)] text-[var(--ink)] hover:border-[var(--line-2)] hover:bg-[var(--panel)]'
            }`}
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
              lightTheme
                ? 'border-[rgba(var(--accent-rgb),0.22)] bg-[rgba(255,247,237,0.96)] text-[var(--accent2)] hover:bg-[rgba(255,239,228,0.98)]'
                : 'border-[rgba(var(--accent-rgb),0.18)] bg-[var(--panel-soft)] text-[var(--accent-light)] hover:bg-[var(--panel)]'
            }`}
          >
            Hủy phiên
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
