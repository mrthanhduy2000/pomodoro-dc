import { completedSessions, dayKey, lastDays, retention } from '../engine/stats.js';
import { hoursMinutes, shortDay, timeOfDay } from './format.js';

function Metric({ label, value, hint }) {
  return (
    <div className="metric">
      <div className="metric__value">{value}</div>
      <div className="metric__label">{label}</div>
      {hint && <div className="metric__hint">{hint}</div>}
    </div>
  );
}

export default function StatsView({ app }) {
  const { state, now } = app;
  const r = retention(state, now, 4);
  const days = lastDays(state, now, 28);
  const max = Math.max(1, ...days.map((d) => d.count));
  const recent = completedSessions(state).slice(-12).reverse();
  const allCompleted = completedSessions(state);
  const totalMinutes = allCompleted.reduce((s, x) => s + x.minutes, 0);

  return (
    <div className="stats">
      <section className="card">
        <span className="eyebrow">4 tuần gần nhất</span>
        <div className="metrics">
          <Metric label="ngày có làm / tuần" value={r.activeDaysPerWeek.toFixed(1)} />
          <Metric label="phiên mỗi ngày có làm" value={r.sessionsPerActiveDay.toFixed(1)} />
          <Metric label="chuỗi ngày hiện tại" value={r.streak} />
          <Metric
            label="ngày từ phiên gần nhất"
            value={r.daysSinceLast ?? '—'}
            hint={r.longestGapDays ? `khoảng nghỉ dài nhất: ${r.longestGapDays} ngày` : null}
          />
        </div>
      </section>

      <section className="card">
        <span className="eyebrow">28 ngày</span>
        <div className="bars bars--wide">
          {days.map((d) => (
            <div key={d.key} className="bars__col" title={`${shortDay(d.key)}: ${d.count} phiên`}>
              <div className="bars__bar" style={{ height: `${(d.count / max) * 100}%` }} />
            </div>
          ))}
        </div>
        <p className="muted">Tổng cộng {allCompleted.length} phiên · {hoursMinutes(totalMinutes)} (kể cả lịch sử bản 1 nếu đã nhập).</p>
      </section>

      <section className="card">
        <span className="eyebrow">Phiên gần đây</span>
        {recent.length === 0 && <p className="muted">Chưa có phiên nào.</p>}
        <ul className="list">
          {recent.map((s) => {
            const cat = s.categoryId ? state.categories.get(s.categoryId) : null;
            return (
              <li key={s.sid} className="list__row">
                <span className="list__when">{shortDay(dayKey(s.endedAt))} · {timeOfDay(s.endedAt)}</span>
                <span className="list__what">
                  {cat && <span className="tag" style={{ '--chip': cat.color }}>{cat.label}</span>}
                  {s.goal || <span className="muted">—</span>}
                </span>
                <span className="list__min">{s.minutes}′{s.legacy ? ' · bản 1' : ''}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
