import { useState } from 'react';

import { brickReport } from '../engine/city.js';
import { eraStyle } from '../engine/catalog.js';
import CityCanvas from './LazyCityCanvas.jsx';
import TimerRing from './TimerRing.jsx';
import { clock, hoursMinutes } from './format.js';
import { lastDays, todaySummary } from '../engine/stats.js';

function visibleCategories(state) {
  return [...state.categories.values()].filter((c) => !c.hidden);
}

function TodayStrip({ state, now }) {
  const today = todaySummary(state, now);
  const goal = state.prefs.dailyGoal;
  const days = lastDays(state, now, 7);
  const max = Math.max(goal, ...days.map((d) => d.count));
  return (
    <section className="card today">
      <div className="today__head">
        <span className="eyebrow">Hôm nay</span>
        <span className="today__count">
          {today.count}/{goal} phiên{today.count >= goal ? ' · ngày trọn ✓' : ''}
        </span>
      </div>
      <div className="dots" aria-label={`${today.count} trên ${goal} phiên`}>
        {Array.from({ length: Math.max(goal, today.count) }, (_, i) => (
          <span key={i} className={`dot${i < today.count ? ' dot--on' : ''}`} />
        ))}
      </div>
      <p className="muted">{today.minutes ? `${hoursMinutes(today.minutes)} tập trung` : 'Chưa có phiên nào hôm nay.'}</p>
      <div className="bars" aria-label="7 ngày gần nhất">
        {days.map((d, i) => (
          <div key={d.key} className="bars__col" title={`${d.key}: ${d.count} phiên`}>
            <div className={`bars__bar${i === days.length - 1 ? ' bars__bar--today' : ''}`} style={{ height: `${(d.count / max) * 100}%` }} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** One line that says where the NEXT session goes — the reason to press Start. */
function CityLine({ app, goTo }) {
  const { city } = app;
  if (city.welcomeBack) {
    return (
      <p className="city-line city-line--welcome">
        Chào mừng trở lại! Phiên đầu tiên hôm nay được <b>2 viên gạch</b>.
      </p>
    );
  }
  if (city.current) {
    const b = city.current;
    return (
      <p className="city-line">
        Phiên này thành tầng <b>{b.bricks.length + 1}/{b.size}</b> của «{b.name}»
        {' '}<button type="button" className="link" onClick={() => goTo('city')}>xem</button>
      </p>
    );
  }
  return (
    <p className="city-line">
      Chưa chọn công trình kế tiếp — gạch sẽ chờ trong kho.
      {' '}<button type="button" className="link" onClick={() => goTo('city')}>Chọn ngay</button>
    </p>
  );
}

function IdlePanel({ app, goTo }) {
  const { state } = app;
  const cats = visibleCategories(state);
  const [categoryId, setCategoryId] = useState(() => cats[0]?.id ?? null);
  const [goal, setGoal] = useState('');
  const [minutes, setMinutes] = useState(state.prefs.focusMin);
  const presets = [...new Set([25, 50, state.prefs.focusMin])].sort((a, b) => a - b);

  return (
    <form
      className="idle"
      onSubmit={(e) => {
        e.preventDefault();
        app.startFocus({ targetMin: minutes, categoryId, goal: goal.trim() });
        setGoal('');
      }}
    >
      <CityLine app={app} goTo={goTo} />
      <TimerRing progress={0} mode="idle">
        <div className="ring__time">{clock(minutes * 60_000)}</div>
        <div className="ring__label">sẵn sàng</div>
      </TimerRing>

      <div className="chips" role="radiogroup" aria-label="Thời lượng">
        {presets.map((m) => (
          <button type="button" key={m} role="radio" aria-checked={minutes === m} className={`chip${minutes === m ? ' chip--on' : ''}`} onClick={() => setMinutes(m)}>
            {m} phút
          </button>
        ))}
      </div>

      <div className="chips" role="radiogroup" aria-label="Loại việc">
        {cats.map((c) => (
          <button
            type="button"
            key={c.id}
            role="radio"
            aria-checked={categoryId === c.id}
            className={`chip${categoryId === c.id ? ' chip--on' : ''}`}
            style={{ '--chip': c.color }}
            onClick={() => setCategoryId(c.id)}
          >
            <span className="chip__swatch" />
            {c.icon ? `${c.icon} ` : ''}{c.label}
          </button>
        ))}
      </div>

      <input className="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Phiên này làm gì? (không bắt buộc)" maxLength={140} />

      <button type="submit" className="btn btn--primary btn--big">Bắt đầu tập trung</button>
    </form>
  );
}

function RunningPanel({ app }) {
  const { timeline: tl, state } = app;
  const a = state.active;
  const cat = a?.categoryId ? state.categories.get(a.categoryId) : null;
  const [confirmCancel, setConfirmCancel] = useState(false);
  if (!tl || !a) return null;

  if (tl.mode === 'break') {
    return (
      <div className="running">
        <TimerRing progress={tl.progress} mode="break">
          <div className="ring__time">{clock(tl.remainingMs)}</div>
          <div className="ring__label">nghỉ giải lao</div>
        </TimerRing>
        <p className="muted center">Đứng dậy, uống nước, nhìn ra xa.</p>
        <div className="row">
          <button type="button" className="btn" onClick={app.endBreak}>Bỏ qua nghỉ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="running">
      <TimerRing progress={tl.progress} mode="focus" paused={tl.paused}>
        <div className="ring__time">{clock(tl.remainingMs)}</div>
        <div className="ring__label">{tl.paused ? 'đang tạm dừng' : 'đang tập trung'}</div>
      </TimerRing>
      {(a.goal || cat) && (
        <p className="center running__goal">
          {cat && <span className="tag" style={{ '--chip': cat.color }}>{cat.label}</span>} {a.goal}
        </p>
      )}
      <div className="row">
        {tl.paused
          ? <button type="button" className="btn btn--primary" onClick={app.resume}>Tiếp tục</button>
          : <button type="button" className="btn" onClick={app.pause}>Tạm dừng</button>}
        <button type="button" className="btn" disabled={!app.canFinishEarly} title="Được tính khi đã tập trung từ 10 phút" onClick={app.finishEarly}>
          Xong sớm
        </button>
        {confirmCancel
          ? <button type="button" className="btn btn--danger" onClick={() => { setConfirmCancel(false); app.cancel(); }}>Chắc chắn huỷ?</button>
          : <button type="button" className="btn btn--ghost" onClick={() => setConfirmCancel(true)}>Huỷ</button>}
      </div>
      {confirmCancel && <p className="muted center">Huỷ thì phiên này không được tính, nhưng không mất gì cả.</p>}
    </div>
  );
}

function ReportLines({ report, city }) {
  if (!report) return null;
  const lines = [];
  if (report.welcomeBack) lines.push(['welcome', 'Chào mừng trở lại: phiên này được 2 viên gạch.']);
  if (report.kind === 'statue') lines.push(['gold', 'Hiếm lắm: phiên này dựng một bức tượng ở ngã tư!']);
  else if (report.kind === 'gold') lines.push(['gold', 'Viên gạch vàng!']);
  if (report.building) {
    const b = report.building;
    const storey = report.bricks[report.bricks.length - 1].storey + 1;
    lines.push(['', report.finished ? `Xong «${b.name}» — ${b.size} phiên thành một toà nhà.` : `Tầng ${storey}/${b.size} của «${b.name}».`]);
  } else lines.push(['', 'Viên gạch đang chờ trong kho — chọn công trình kế tiếp để đặt nó.']);
  if (report.eraUp) lines.push(['gold', `Mở kỷ ${report.eraUp.era}: ${eraStyle(report.eraUp.era).name}.`]);
  if (report.finished && !city.current) lines.push(['', 'Chọn công trình kế tiếp ở tab Thành phố.']);
  return (
    <ul className="report">
      {lines.map(([tone, text]) => <li key={text} className={tone ? `report--${tone}` : ''}>{text}</li>)}
    </ul>
  );
}

function DonePanel({ app, goTo }) {
  const s = app.justDone;
  const today = todaySummary(app.state, app.now);
  const report = brickReport(app.city, s.sid);
  return (
    <div className="done">
      <CityCanvas
        className="city-canvas--moment"
        city={app.city}
        categories={app.state.categories}
        now={app.cityNow}
        focusSid={s.sid}
        interactive={false}
        selectedPlan={report?.building?.planId ?? null}
        label="Viên gạch vừa đặt"
      />
      <h2>Xong phiên {s.minutes} phút</h2>
      <ReportLines report={report} city={app.city} />
      <p className="muted">Phiên thứ {today.count} hôm nay{today.count >= app.state.prefs.dailyGoal ? ' — ngày trọn rồi!' : ` · còn ${app.state.prefs.dailyGoal - today.count} nữa là ngày trọn`}.</p>
      <div className="row">
        <button type="button" className="btn btn--primary" onClick={() => app.startBreak(app.state.prefs.breakMin)}>Nghỉ {app.state.prefs.breakMin} phút</button>
        <button type="button" className="btn" onClick={app.skipBreak}>Bỏ qua nghỉ</button>
        <button type="button" className="btn btn--ghost" onClick={() => goTo('city')}>Xem thành phố</button>
      </div>
    </div>
  );
}

export default function FocusView({ app, goTo }) {
  let main;
  if (app.state.active) main = <RunningPanel app={app} />;
  else if (app.justDone) main = <DonePanel app={app} goTo={goTo} />;
  else main = <IdlePanel app={app} goTo={goTo} />;

  return (
    <div className="focus-layout">
      <section className="card focus-main">{main}</section>
      <aside className="focus-side">
        <TodayStrip state={app.state} now={app.now} />
      </aside>
    </div>
  );
}
