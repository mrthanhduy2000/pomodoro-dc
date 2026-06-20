/**
 * CoachCard — thẻ "AI Coach" tối màu (dùng chung cho cột phải desktop + màn mobile).
 * Chỉ lo HIỂN THỊ.
 * - text   : câu chính (giọng Coach theo tính cách, từ useCoachVoice)
 * - reason : dòng phụ (phân tích số liệu, từ useCoachInsight)
 * - tone   : sắc thái câu chính (vd "tĩnh tại"), hiện cạnh nhãn AI Coach
 * - personality + onPersonalityChange : nếu có thì hiện bộ chọn tính cách
 */
import { motion } from 'framer-motion';
import { SparkGlyph } from './icons/Glyph';

const PERSONA_LABELS = { strict: 'Nghiêm khắc', zen: 'Thiền', buddy: 'Bạn thân' };
const PERSONA_ORDER = ['strict', 'zen', 'buddy'];

export default function CoachCard({ text, reason, tone, personality, onPersonalityChange, className = '' }) {
  if (!text) return null;
  const showSwitcher = !!personality && typeof onPersonalityChange === 'function';
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
        {showSwitcher && (
          <div className="flex gap-1">
            {PERSONA_ORDER.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPersonalityChange(p)}
                aria-pressed={p === personality}
                className="rounded-full px-2 py-0.5 text-[10px] leading-none transition"
                style={{
                  border: `1px solid ${p === personality ? '#d9a441' : 'rgba(217,164,65,0.25)'}`,
                  background: p === personality ? 'rgba(217,164,65,0.16)' : 'transparent',
                  color: p === personality ? '#f0d9a8' : 'rgba(232,228,220,0.6)',
                }}
              >
                {PERSONA_LABELS[p]}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: '#e8e4dc' }}>{text}</p>
      {reason && (
        <p className="mt-1.5 text-[11px] leading-snug" style={{ color: 'rgba(232,228,220,0.55)' }}>{reason}</p>
      )}
    </motion.div>
  );
}
