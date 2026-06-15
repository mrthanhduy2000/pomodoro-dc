/**
 * CoachCard — thẻ "AI Coach" tối màu (dùng chung cho cột phải desktop + màn mobile).
 * Chỉ lo HIỂN THỊ; phần tính lời khuyên nằm ở hook useCoachInsight.
 */
import { motion } from 'framer-motion';

export default function CoachCard({ text, reason, className = '' }) {
  if (!text) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 ${className}`}
      style={{ background: '#1f1e1d', borderRadius: 'var(--skin-radius-card,18px)', border: '1px solid rgba(217,164,65,0.22)' }}
    >
      <div className="flex items-center gap-1.5">
        <span style={{ color: '#d9a441' }}>✦</span>
        <span className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#d9a441' }}>AI Coach</span>
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: '#e8e4dc' }}>{text}</p>
      {reason && (
        <p className="mt-1.5 text-[11px] leading-snug" style={{ color: 'rgba(232,228,220,0.55)' }}>{reason}</p>
      )}
    </motion.div>
  );
}
