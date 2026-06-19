/**
 * FocusReport — nút "Xem phân tích" + modal BÁO CÁO TẬP TRUNG đầy đủ từ bộ máy
 * Focus Intelligence (useCoachIntel). Hồ sơ + dự đoán + khuyến nghị + mẫu, mọi số
 * kèm cỡ mẫu/độ tin; trung thực (tương quan, không nhân-quả). Dùng chung desktop + mobile.
 */
import { useState } from 'react';
import { SparkGlyph } from './icons/Glyph';
import useCoachIntel from '../hooks/useCoachIntel';
import useNoteThemes from '../hooks/useNoteThemes';
import { themesFromVectors } from '../engine/semantic/semantic';

// Chỉ mời bật tầng nơ-ron (118MB) trên DESKTOP không-phải-iOS (iPhone giữ bản TF-IDF
// an toàn — transformers.js đang có lỗi crash iOS).
function detectNeuralCapable() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  if (/iP(hone|ad|od)/i.test(navigator.userAgent || '')) return false;
  return (window.innerWidth || 0) >= 1024;
}
const NEURAL_TIMEOUT_MS = 180000;

const GOLD = '#d9a441';
const CONF_LABEL = { cao: 'tin cậy cao', vừa: 'khá tin', thấp: 'tạm tính', insufficient: 'chưa đủ' };
const SEV_COLOR = { good: 'var(--good,#16a34a)', warn: 'var(--bad,#ef4444)', info: 'var(--muted)' };

function Chip({ children, color = 'var(--muted)' }) {
  return (
    <span className="mono shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.12em]" style={{ border: `1px solid ${color}55`, color }}>
      {children}
    </span>
  );
}

function MetricCard({ metric }) {
  const insufficient = metric.status === 'insufficient';
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--panel, rgba(0,0,0,0.04))', opacity: insufficient ? 0.6 : 1 }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ink)' }}>{metric.blurb}</p>
        <Chip color={insufficient ? 'var(--muted)' : GOLD}>{CONF_LABEL[metric.status] ?? metric.status}</Chip>
      </div>
    </div>
  );
}

export default function FocusReport(goalProps) {
  const [open, setOpen] = useState(false);
  const { profile, predictions, report } = useCoachIntel(goalProps);
  const themes = useNoteThemes();
  const [canNeural] = useState(detectNeuralCapable);
  const [neuralStatus, setNeuralStatus] = useState('idle'); // idle|loading|ready|error
  const [neuralProgress, setNeuralProgress] = useState(0);
  const [neuralThemes, setNeuralThemes] = useState(null);

  async function enableNeural() {
    if (neuralStatus === 'loading') return;
    setNeuralStatus('loading');
    setNeuralProgress(0);
    try {
      const { embedTexts } = await import('../engine/semantic/embedder');
      const onProgress = (p) => { if (p && typeof p.progress === 'number') setNeuralProgress(Math.round(p.progress)); };
      const work = embedTexts(themes.texts, onProgress);
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), NEURAL_TIMEOUT_MS));
      const vectors = await Promise.race([work, timeout]);
      // Ngưỡng cosine cao hơn cho vector nơ-ron (đặc hơn TF-IDF).
      setNeuralThemes(themesFromVectors(themes.items, vectors, { threshold: 0.55 }));
      setNeuralStatus('ready');
    } catch {
      setNeuralStatus('error'); // tự lùi về bản TF-IDF (đang hiển thị)
    }
  }

  const shownThemes = neuralStatus === 'ready' && neuralThemes ? neuralThemes : themes;

  const metrics = [
    ['Giờ vàng', profile.chronotype],
    ['Độ dài hợp', profile.idealLength],
    ['Đều đặn', profile.consistency],
    ['Phiên sâu', profile.deepWorkRatio],
    ['Loại việc', profile.categoryPerformance],
    ['So tuần', profile.momentum],
  ];
  const preds = [predictions.streak, predictions.window].filter((p) => p && p.status !== 'insufficient' && p.reason);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-opacity hover:opacity-80"
        style={{ border: `1px solid ${GOLD}55`, color: GOLD, background: 'rgba(217,164,65,0.08)' }}
      >
        <SparkGlyph size={12} /> Xem phân tích
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" style={{ background: 'rgba(15,14,13,0.55)' }} onClick={() => setOpen(false)}>
          <div
            className="flex max-h-[88vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl"
            style={{ background: 'var(--card-bg-solid, #fff)', border: '1px solid var(--line)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--line)' }}>
              <div className="flex items-center gap-1.5" style={{ color: GOLD }}>
                <SparkGlyph size={14} />
                <span className="mono text-[11px] uppercase tracking-[0.2em]">Phân tích tập trung</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-[18px] leading-none" style={{ color: 'var(--muted)' }} aria-label="Đóng">×</button>
            </div>

            <div className="min-h-[160px] flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {/* Tổng quan bằng lời */}
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ink)' }}>{report.tldr}</p>

              {report.ready && (
                <>
                  {/* Khuyến nghị phiên kế */}
                  {report.recommendation?.status === 'ok' && (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(217,164,65,0.10)', border: `1px solid ${GOLD}33` }}>
                      <div className="flex items-center gap-1.5" style={{ color: GOLD }}>
                        <span className="mono text-[10px] uppercase tracking-[0.18em]">Phiên kế tiếp</span>
                        <Chip color={GOLD}>{CONF_LABEL[report.recommendation.confidence] ?? report.recommendation.confidence}</Chip>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: 'var(--ink)' }}>{report.recommendation.headline}</p>
                      <p className="mt-1 text-[11.5px] leading-snug" style={{ color: 'var(--muted)' }}>{report.recommendation.reason}</p>
                    </div>
                  )}

                  {/* Dự đoán */}
                  {preds.length > 0 && (
                    <div>
                      <p className="mono mb-1.5 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-2,var(--muted))' }}>Dự đoán</p>
                      <div className="space-y-1.5">
                        {preds.map((p, i) => (
                          <p key={i} className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ink)' }}>• {p.reason}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hồ sơ */}
                  <div>
                    <p className="mono mb-1.5 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-2,var(--muted))' }}>Hồ sơ tập trung</p>
                    <div className="grid grid-cols-1 gap-2">
                      {metrics.map(([, m], i) => <MetricCard key={i} metric={m} />)}
                    </div>
                  </div>

                  {/* Mẫu đáng chú ý */}
                  {report.patterns?.length > 0 && (
                    <div>
                      <p className="mono mb-1.5 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-2,var(--muted))' }}>Mẫu đáng chú ý</p>
                      <div className="space-y-2">
                        {report.patterns.map((p, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SEV_COLOR[p.severity] }} />
                            <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ink)' }}>
                              <span style={{ fontWeight: 600 }}>{p.headline}.</span> <span style={{ color: 'var(--muted)' }}>{p.detail}{p.suggestion ? ` ${p.suggestion}` : ''}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] italic leading-snug" style={{ color: 'var(--muted)' }}>
                    Tất cả là quan sát từ lịch sử của bạn (tương quan), không phải kết luận hay lời tiên đoán.
                  </p>
                </>
              )}

              {/* Chủ đề ghi chú — đọc-nghĩa chạy trên máy (TF-IDF mặc định; nơ-ron tuỳ chọn) */}
              {themes.ready && shownThemes.themes.length > 0 && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5">
                    <p className="mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-2,var(--muted))' }}>Chủ đề ghi chú</p>
                    {neuralStatus === 'ready' && <Chip color={GOLD}>nơ-ron</Chip>}
                  </div>
                  <p className="mb-2 text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
                    Gom theo nghĩa từ {themes.noteCount} ghi chú của bạn — đọc trên máy, không gửi đi đâu; có thể gom chưa chuẩn.
                  </p>
                  <div className="space-y-2">
                    {shownThemes.themes.map((t, i) => (
                      <div key={i} className="flex items-start justify-between gap-2 rounded-xl p-3" style={{ background: 'var(--panel, rgba(0,0,0,0.04))' }}>
                        <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ink)' }}>{t.label}</p>
                        <div className="flex shrink-0 flex-wrap justify-end gap-1">
                          <Chip>{t.size} phiên</Chip>
                          {t.goalRate != null && <Chip color={GOLD}>{Math.round(t.goalRate * 100)}% đạt</Chip>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tầng nơ-ron: chỉ desktop, opt-in, nạp lười, có fallback */}
                  {canNeural && neuralStatus === 'idle' && (
                    <button
                      type="button"
                      onClick={enableNeural}
                      className="mt-2 w-full rounded-full py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-opacity hover:opacity-80"
                      style={{ border: `1px solid ${GOLD}55`, color: GOLD, background: 'rgba(217,164,65,0.08)' }}
                    >
                      Đọc-nghĩa nâng cao (tải ~118MB, chạy trên máy)
                    </button>
                  )}
                  {neuralStatus === 'loading' && (
                    <p className="mt-2 text-[11px]" style={{ color: 'var(--muted)' }}>Đang tải mô hình AI… {neuralProgress > 0 ? `${neuralProgress}%` : ''} (lần đầu hơi lâu)</p>
                  )}
                  {neuralStatus === 'error' && (
                    <p className="mt-2 text-[11px]" style={{ color: 'var(--muted)' }}>
                      Không tải được mô hình — đang dùng bản gọn (vẫn chạy tốt).{' '}
                      <button type="button" onClick={enableNeural} className="underline" style={{ color: GOLD }}>Thử lại</button>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
