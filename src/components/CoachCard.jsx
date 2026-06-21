/**
 * CoachCard — thẻ "AI Coach" tối màu (dùng chung cho cột phải desktop + màn mobile).
 * Chỉ lo HIỂN THỊ.
 * - text   : câu chính (giọng Coach MỘT giọng cố định, từ useCoachVoice)
 * - reason : dòng phụ (phân tích số liệu, từ useCoachInsight)
 * - tone   : sắc thái câu chính (vd "tĩnh tại"), hiện cạnh nhãn AI Coach
 * (Đã bỏ bộ chọn tính cách strict/zen/buddy — 2026-06-21, theo yêu cầu của Đàm.)
 */
import { motion } from 'framer-motion';
import { SparkGlyph } from './icons/Glyph';

export default function CoachCard({ text, reason, tone, className = '' }) {
  if (!text) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 ${className}`}
      style={{ background: '#1f1e1d', borderRadius: 'var(--skin-radius-card,18px)', border: '1px solid rgba(217,164,65,0.22)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span style={{ color: '#d9a441', display: 'inline-flex' }}><SparkGlyph size={13} /></span>
          <span className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#d9a441' }}>AI Coach</span>
          {tone && (
            <span className="text-[10px]" style={{ color: 'rgba(217,164,65,0.7)' }}>· {tone}</span>
          )}
        </div>
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: '#e8e4dc' }}>{text}</p>
      {reason && (
        <p className="mt-1.5 text-[11px] leading-snug" style={{ color: 'rgba(232,228,220,0.55)' }}>{reason}</p>
      )}
    </motion.div>
  );
}
