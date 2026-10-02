import { useCallback, useMemo, useState } from 'react';

import { blueprintsOf, ERAS, eraStyle } from '../engine/catalog.js';
import { ledger } from '../engine/city.js';
import { dayKey } from '../engine/stats.js';
import CityCanvas from './LazyCityCanvas.jsx';
import { hoursMinutes, shortDay, timeOfDay } from './format.js';

const SHAPE_ICON = { house: '🏠', hall: '🏛️', market: '🏪', tower: '🗼', temple: '⛩️' };

function Progress({ value, max, label }) {
  return (
    <div className="progress" aria-label={label}>
      <div className="progress__bar" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

function Storeys({ building, categories }) {
  return (
    <div className="storeys" aria-label={`${building.bricks.length} trên ${building.size} tầng`}>
      {Array.from({ length: building.size }, (_, i) => {
        const brick = building.bricks[i];
        const color = brick ? (brick.kind === 'plain' ? categories.get(brick.categoryId)?.color : '#f2c14e') : null;
        return <span key={i} className={`storey${brick ? ' storey--on' : ''}`} style={color ? { background: color } : undefined} />;
      })}
    </div>
  );
}

function BlueprintPicker({ era, onChoose, onCancel }) {
  const [shownEra, setShownEra] = useState(era);
  const list = blueprintsOf(shownEra);
  return (
    <div className="picker">
      <div className="picker__head">
        <span className="eyebrow">Chọn công trình</span>
        {era > 1 && (
          <select value={shownEra} onChange={(e) => setShownEra(Number(e.target.value))} aria-label="Phong cách kỷ">
            {ERAS.slice(0, Math.min(era, ERAS.length)).map((x) => <option key={x.n} value={x.n}>Kỷ {x.n} · {x.name}</option>)}
          </select>
        )}
      </div>
      <div className="blueprints">
        {list.map((bp) => (
          <button type="button" key={bp.key} className="blueprint" onClick={() => onChoose(bp)}>
            <span className="blueprint__icon" aria-hidden="true">{SHAPE_ICON[bp.shape]}</span>
            <span className="blueprint__name">{bp.name}</span>
            <span className="blueprint__size">{bp.size} phiên</span>
          </button>
        ))}
      </div>
      {onCancel && <button type="button" className="btn btn--ghost" onClick={onCancel}>Để sau</button>}
    </div>
  );
}

function Detail({ pick, city, categories, onFocus, onClose }) {
  const cat = (id) => categories.get(id);
  if (pick.type === 'building') {
    const b = city.buildings.find((x) => x.planId === pick.planId);
    if (!b) return null;
    const l = ledger(b);
    const done = b.bricks.length >= b.size;
    return (
      <section className="card detail">
        <div className="detail__head">
          <span className="eyebrow">Sổ ghi công trình</span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <h3>{b.name}</h3>
        <p className="muted">Kỷ {b.style} · {eraStyle(b.style).name} · {done ? 'đã xong' : `đang xây ${b.bricks.length}/${b.size}`}</p>
        <Storeys building={b} categories={categories} />
        {l.from && (
          <p>
            {shortDay(dayKey(l.from))}{l.to && dayKey(l.to) !== dayKey(l.from) ? ` → ${shortDay(dayKey(l.to))}` : ''} · {hoursMinutes(l.minutes)}
            {l.gold ? ` · ${l.gold} viên vàng` : ''}
          </p>
        )}
        {l.tally.length > 0 && (
          <ul className="tally">
            {l.tally.map((t) => (
              <li key={t.categoryId ?? 'none'}>
                <span className="tally__dot" style={{ background: cat(t.categoryId)?.color }} />
                {cat(t.categoryId)?.label ?? 'Không rõ'} <span className="muted">· {t.count} phiên</span>
              </li>
            ))}
          </ul>
        )}
        {l.notes.length > 0 && (
          <ul className="notes">
            {l.notes.map((n) => <li key={n.at}><span className="muted">{shortDay(dayKey(n.at))}</span> “{n.text}”</li>)}
          </ul>
        )}
        <button type="button" className="btn" onClick={() => onFocus(b.planId)}>Bay tới công trình</button>
      </section>
    );
  }
  if (pick.type === 'brick' || pick.type === 'statue') {
    const brick = pick.brick;
    const b = brick.planId ? city.buildings.find((x) => x.planId === brick.planId) : null;
    const c = cat(brick.categoryId);
    return (
      <section className="card detail">
        <div className="detail__head">
          <span className="eyebrow">{pick.type === 'statue' ? 'Tượng kỷ niệm' : brick.kind === 'gold' ? 'Viên gạch vàng' : `Viên gạch #${brick.n}`}</span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <h3>{shortDay(dayKey(brick.at))} · {timeOfDay(brick.at)}</h3>
        <p>
          {c && <span className="tag" style={{ '--chip': c.color }}>{c.label}</span>} {brick.minutes} phút
          {brick.bonus ? ' · gạch thưởng chào mừng trở lại' : ''}
        </p>
        {brick.goal && <p>“{brick.goal}”</p>}
        <p className="muted">
          {b ? `Tầng ${brick.storey + 1} của «${b.name}»` : 'Đang chờ trong kho gạch'}
          {pick.type === 'statue' ? ' · phiên này dựng một bức tượng ở ngã tư' : ''}
        </p>
      </section>
    );
  }
  if (pick.type === 'resident') {
    const r = pick.resident;
    const home = r.home ? city.buildings.find((x) => x.planId === r.home) : null;
    return (
      <section className="card detail">
        <div className="detail__head">
          <span className="eyebrow">Cư dân thứ {r.n}</span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <h3>{shortDay(r.key)}: {r.sessions} phiên, {hoursMinutes(r.minutes)}</h3>
        <p className="muted">
          {r.full ? `Ngày trọn (mục tiêu ${r.goal}) — đèn lồng của ngày này đang sáng.` : `Mục tiêu hôm ấy là ${r.goal} phiên.`}
        </p>
        <p className="muted">{home ? `Sống ở «${home.name}».` : 'Chưa có nhà: hôm ấy gạch còn nằm trong kho.'}</p>
      </section>
    );
  }
  return null;
}

export default function CityView({ app }) {
  const { city, state, cityNow } = app;
  const categories = state.categories;
  const [pick, setPick] = useState(null);
  const [choosing, setChoosing] = useState(null); // blueprint waiting for a plot
  const [planning, setPlanning] = useState(false);
  const [scene, setScene] = useState(null);
  const style = eraStyle(city.era);
  const finished = city.buildings.filter((b) => b.bricks.length >= b.size).length;

  const place = useCallback((plot) => {
    if (!choosing) return;
    if (app.planBuilding(choosing.key, plot)) {
      setChoosing(null);
      setPlanning(false);
    }
  }, [app, choosing]);

  const onPick = useCallback((p) => {
    if (choosing) {
      if (p?.type === 'plot') place(p.plot);
      return;
    }
    setPick(p && p.type !== 'plot' ? p : null);
  }, [choosing, place]);

  const selectedPlan = pick?.type === 'building' ? pick.planId : pick?.brick?.planId ?? null;
  const needChoice = !city.current && !choosing;
  const remaining = city.current ? city.current.size - city.current.bricks.length : 0;
  const nextEra = ERAS[Math.min(ERAS.length, city.era)] ?? null;

  const header = useMemo(() => [
    { v: city.totalBricks, l: 'viên gạch' },
    { v: finished, l: 'công trình' },
    { v: city.residents.length, l: 'cư dân' },
    { v: city.lanterns.length, l: 'đèn lồng' },
  ], [city, finished]);

  return (
    <div className="city-layout">
      <section className="city-stage card">
        <CityCanvas
          city={city}
          categories={categories}
          now={cityNow}
          picking={Boolean(choosing)}
          selectedPlan={selectedPlan}
          onPick={onPick}
          onScene={setScene}
        />
        <div className="city-stage__tools">
          <button type="button" className="btn btn--small" onClick={() => scene?.frameCity()}>Toàn cảnh</button>
          {city.current && <button type="button" className="btn btn--small" onClick={() => scene?.focusBuilding(city.current.planId)}>Công trình đang xây</button>}
        </div>
        {choosing && (
          <div className="city-stage__hint">
            Chạm vào một ô sáng để đặt «{choosing.name}»
            <button type="button" className="btn btn--small btn--primary" onClick={() => place(city.candidates[0])}>Đặt ở ô gần trung tâm</button>
            <button type="button" className="btn btn--small" onClick={() => setChoosing(null)}>Huỷ</button>
          </div>
        )}
      </section>

      <aside className="city-side">
        <section className="card">
          <span className="eyebrow">Kỷ {city.era} · {style.name}</span>
          <p className="muted small">{style.blurb}</p>
          <Progress value={city.eraProgress.done} max={city.eraProgress.need} label="Tiến độ kỷ" />
          <p className="small muted">
            {city.eraProgress.done}/{city.eraProgress.need} viên
            {nextEra && nextEra.n > city.era ? ` · còn ${city.eraProgress.need - city.eraProgress.done} viên tới «${nextEra.name}»` : ''}
          </p>
          <div className="city-counts">
            {header.map((h) => <div key={h.l}><b>{h.v}</b><span>{h.l}</span></div>)}
          </div>
        </section>

        {city.festivalNow
          ? <section className="card festival">🎉 Lễ hội tuần này! Đường đèn lồng đang treo cờ.</section>
          : <section className="card small muted">Tuần này {city.week.sessions}/{city.week.goal} phiên — đủ thì cả phố mở lễ hội.</section>}

        {pick && <Detail pick={pick} city={city} categories={categories} onFocus={(id) => scene?.focusBuilding(id)} onClose={() => setPick(null)} />}

        <section className="card">
          {city.current ? (
            <>
              <span className="eyebrow">Đang xây</span>
              <h3>{city.current.name}</h3>
              <Storeys building={city.current} categories={categories} />
              <p className="muted">{city.current.bricks.length}/{city.current.size} tầng · còn {remaining} phiên nữa là xong.</p>
              {city.queued.map((q) => (
                <p key={q.planId} className="small">
                  Tiếp theo: «{q.name}»{' '}
                  {q.bricks.length === 0 && <button type="button" className="link" onClick={() => app.cancelPlan(q.planId)}>bỏ</button>}
                </p>
              ))}
              {city.current.bricks.length === 0 && (
                <button type="button" className="link" onClick={() => app.cancelPlan(city.current.planId)}>Đổi ý, bỏ công trình này</button>
              )}
              {city.canPlan && !choosing && (planning
                ? <BlueprintPicker era={city.era} onChoose={(bp) => setChoosing(bp)} onCancel={() => setPlanning(false)} />
                : <button type="button" className="btn" onClick={() => setPlanning(true)}>Lên kế hoạch công trình tiếp theo</button>)}
            </>
          ) : needChoice ? (
            <>
              {city.pile.length > 0 && <p className="yard-note">{city.pile.length} viên gạch đang chờ trong kho — sẽ vào công trình kế tiếp được chọn.</p>}
              {city.buildings.length === 0 && <p className="muted">Thành phố bắt đầu từ một ô đất trống. Mỗi phiên xong là một tầng nhà.</p>}
              <BlueprintPicker era={city.era} onChoose={(bp) => setChoosing(bp)} />
            </>
          ) : (
            <p className="muted">Đang chọn ô đất cho «{choosing.name}».</p>
          )}
        </section>
      </aside>
    </div>
  );
}
