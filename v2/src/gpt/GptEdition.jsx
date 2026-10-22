import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

import { blueprintsOf } from '../engine/catalog.js';
import { todaySummary } from '../engine/stats.js';
import { FocusPanel } from '../ui/FocusView.jsx';
import { Detail } from '../ui/CityView.jsx';
import StatsView from '../ui/StatsView.jsx';
import SettingsView from '../ui/SettingsView.jsx';
import { hoursMinutes } from '../ui/format.js';
import { PLACES, SEASONS, postcardCity, readAppearance, snowIn } from './art.js';
import { HOIAN_NAMES } from './hoian.js';
import './gpt.css';

const Canvas = lazy(() => import('./GptCanvas.jsx'));
const TABS = [['focus', 'Tập trung'], ['city', 'Thành phố'], ['stats', 'Nhật ký'], ['settings', 'Cài đặt']];
const SHAPES = { house: 'Nhà phố', hall: 'Nhà cộng đồng', market: 'Chợ ven phố', tower: 'Tháp đồng hồ', temple: 'Nhà văn hóa' };

function Scene(props) {
  return <Suspense fallback={<div className="gpt-scene-loading">Đang mở góc phố…</div>}><Canvas {...props} /></Suspense>;
}

function Atmosphere({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  return (
    <details className="gpt-atmosphere">
      <summary title="Đổi mùa, ánh sáng và thời tiết">Không khí <span aria-hidden="true">⌄</span></summary>
      <div className="gpt-atmosphere-panel">
        <label>Mùa<select value={value.season} onChange={(e) => set('season', e.target.value)}>{Object.entries(SEASONS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label>Ánh sáng<select value={value.light} onChange={(e) => set('light', e.target.value)}><option value="golden">Chiều vàng</option><option value="night">Lên đèn</option><option value="live">Theo giờ thực</option></select></label>
        <label>Thời tiết<select value={snowIn(value) ? 'clear' : value.weather} disabled={snowIn(value)} onChange={(e) => set('weather', e.target.value)}><option value="clear">{snowIn(value) ? 'Tuyết nhẹ' : 'Trời trong'}</option><option value="rain">Mưa nhẹ</option></select></label>
        <label className="gpt-check"><input type="checkbox" checked={value.motion} onChange={(e) => set('motion', e.target.checked)} /> Chuyển động nhẹ</label>
      </div>
    </details>
  );
}

function BlueprintChoices({ city, onChoose, names = SHAPES }) {
  return <div className="gpt-blueprints">{blueprintsOf(city.era).map((bp) => (
    <button key={bp.key} type="button" onClick={() => onChoose(bp)}>
      <span className={`gpt-house-icon gpt-house-icon--${bp.shape}`} aria-hidden="true">⌂</span>
      <span><b>{names[bp.shape]}</b><small>{bp.size} phiên · {bp.name}</small></span><span aria-hidden="true">↗</span>
    </button>
  ))}</div>;
}

function CityWorkspace({ app, appearance, sample, onSampleChange }) {
  const [pick, setPick] = useState(null);
  const [blueprint, setBlueprint] = useState(null);
  const [planning, setPlanning] = useState(false);
  const [scene, setScene] = useState(null);
  const city = app.city;
  const names = appearance.place === 'hoian' ? HOIAN_NAMES : SHAPES;
  const shownCity = useMemo(() => sample ? postcardCity(city) : city, [sample, city]);
  const current = city.current;
  const remaining = current ? current.size - current.bricks.length : 0;
  const choose = (bp) => { onSampleChange(false); setPick(null); setBlueprint(bp); };
  const place = (plot) => {
    if (blueprint && plot && app.planBuilding(blueprint.key, plot)) { setBlueprint(null); setPlanning(false); }
  };
  const select = (p) => {
    if (sample) { setPick(p?.planId ? p : null); return; }
    if (blueprint && p?.type === 'plot') place(p.plot);
    else if (!blueprint) setPick(p && p.type !== 'plot' ? p : null);
  };
  const selectedPlan = pick?.planId || pick?.brick?.planId || null;
  const sampleBuilding = sample && shownCity.buildings.find((b) => b.planId === selectedPlan);
  return (
    <div className="gpt-city-workspace">
      <div className="gpt-city-stage">
        <Scene key={sample ? 'sample' : 'earned'} city={shownCity} categories={app.state.categories} now={app.cityNow} appearance={appearance} onPick={select} onScene={setScene} picking={Boolean(blueprint)} selectedPlan={selectedPlan} label={sample ? 'Phố mẫu kiến trúc, không phải thành tích thật' : 'Thành phố từ các phiên tập trung của bạn'} />
        <div className="gpt-scene-caption"><span className="gpt-live-dot" /><span>{sample ? 'Phố mẫu · không tính vào tiến độ' : `${city.buildings.length} công trình · ${city.totalBricks} viên gạch`}</span></div>
        <div className="gpt-camera-tools">
          <button type="button" onClick={() => scene?.frameCity(appearance.motion ? 900 : 0)} title="Đưa máy ảnh về toàn cảnh">Toàn cảnh</button>
          <button type="button" onClick={() => { onSampleChange(!sample); setPick(null); setBlueprint(null); }}>{sample ? 'Thành phố của tôi' : 'Xem trước 3D'}</button>
        </div>
        {blueprint && <div className="gpt-placement"><b>Đặt {names[blueprint.shape].toLowerCase()}</b><span>Chọn một ô đất sáng trong thành phố.</span><div className="row"><button type="button" className="btn btn--primary" onClick={() => place(city.candidates[0])}>Chọn ô gần nhất</button><button type="button" className="btn" onClick={() => setBlueprint(null)}>Huỷ</button></div></div>}
      </div>
      <aside className="gpt-city-inspector">
        {sample ? (
          <><span className="eyebrow">Xem trước thành phố 3D</span><h2>{sampleBuilding ? names[sampleBuilding.shape] : 'Một nơi để\nmuốn trở về.'}</h2><p className="muted">{sampleBuilding ? 'Mẫu công trình hoàn thiện. Bạn có thể ngắm các mặt của ngôi nhà trong không gian 3D.' : `Ngắm thử phố ${PLACES[appearance.place].name}. Những công trình mẫu không tính vào tiến độ của bạn.`}</p>{sampleBuilding && <button type="button" className="btn" onClick={() => scene?.focusBuilding(sampleBuilding.planId, appearance.motion ? 1000 : 0)}>Xem gần công trình ↗</button>}<div className="gpt-preview-types">{Object.entries(names).map(([shape,name])=> {
            const building=shownCity.buildings.find((b)=>b.shape===shape);
            return building && <button key={shape} type="button" aria-pressed={sampleBuilding?.shape===shape} onClick={()=> { setPick({type:'building',planId:building.planId}); scene?.focusBuilding(building.planId,appearance.motion?1000:0); }}>{name}<span aria-hidden="true">↗</span></button>;
          })}</div><button type="button" className="btn btn--primary" onClick={() => { setPick(null); onSampleChange(false); }}>Xây thành phố của tôi</button><div className="gpt-inspector-note">Mỗi phiên của bạn sẽ hoàn thiện một phần nhà: từ khung cửa đến mái ngói, ban công và những ngọn đèn.</div></>
        ) : pick ? <Detail pick={pick} city={city} categories={app.state.categories} onFocus={(id) => scene?.focusBuilding(id, appearance.motion ? 1000 : 0)} onClose={() => setPick(null)} architectural /> : (
          <><span className="eyebrow">Góc phố của bạn</span><h2>{current ? names[current.shape] : 'Bắt đầu từ\nmột căn nhà.'}</h2>
            {current ? <><p className="muted">{current.name}</p><div className="gpt-progress"><span style={{ width: `${current.bricks.length / current.size * 100}%` }} /></div><p><b>{current.bricks.length}/{current.size}</b> phần hoàn thiện</p><p className="muted">Còn {remaining} phiên để hoàn thành.</p><button type="button" className="btn" onClick={() => scene?.focusBuilding(current.planId, appearance.motion ? 1000 : 0)}>Đến công trình ↗</button></> : <p className="muted">Chọn một công trình. Mỗi phiên tập trung sẽ để lại một dấu tích ở đây.</p>}
            {city.pile.length > 0 && <p className="gpt-inspector-note">{city.pile.length} viên gạch đang chờ công trình tiếp theo.</p>}
            {city.queued.map((b) => <div className="gpt-queued" key={b.planId}><span>Tiếp theo: {names[b.shape]}</span>{b.bricks.length === 0 && <button className="link" type="button" onClick={() => app.cancelPlan(b.planId)}>Bỏ</button>}</div>)}
            {!blueprint && city.canPlan && (planning || !current ? <BlueprintChoices city={city} onChoose={choose} names={names} /> : <button type="button" className="btn btn--primary" onClick={() => setPlanning(true)}>Chọn công trình kế tiếp</button>)}
            {current && current.bricks.length === 0 && <button type="button" className="link gpt-cancel-plan" onClick={() => app.cancelPlan(current.planId)}>Đổi công trình này</button>}
          </>
        )}
      </aside>
    </div>
  );
}

export default function GptEdition({ app, sync }) {
  const [tab, setTab] = useState('focus');
  const [appearance, setAppearance] = useState(readAppearance);
  const [sample, setSample] = useState(app.city.buildings.length === 0);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const today = todaySummary(app.state, app.now);
  const place = PLACES[appearance.place];
  const focusAppearance = useMemo(() => ({ ...appearance, motion: appearance.motion && !reduced && !app.state.active }), [appearance, reduced, app.state.active]);
  const cityAppearance = useMemo(() => ({ ...appearance, motion: appearance.motion && !reduced }), [appearance, reduced]);
  const focusCity = useMemo(() => app.city.buildings.length ? app.city : postcardCity(app.city), [app.city]);
  useEffect(() => { try { localStorage.setItem('dc-gpt-appearance', JSON.stringify(appearance)); } catch { /* Rendering still works without local preference storage. */ } }, [appearance]);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => setReduced(mq.matches);
    mq.addEventListener('change', changed);
    return () => mq.removeEventListener('change', changed);
  }, []);
  return (
    <div className={`gpt-edition${app.state.active ? ' gpt-is-running' : ''}`}>
      <header className="gpt-header">
        <a className="gpt-brand" href="?edition=gpt"><span aria-hidden="true">❧</span> Pomodoro DC <small>GPT</small></a>
        <nav aria-label="Màn hình">{TABS.map(([id, label]) => <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>{label}</button>)}</nav>
        <div className="gpt-header-end">{['missing-table', 'error'].includes(sync.state) && <button className="link" type="button" onClick={() => setTab('settings')}>Chỉ lưu trên máy</button>}<span className={`sync-dot sync-dot--${sync.state}`} title={sync.detail || sync.state} /><a href="/" title="Quay về phiên bản gốc">Bản gốc ↗</a><a href="/v2/" title="Cùng dữ liệu v2, giao diện cũ">V2 ↗</a></div>
      </header>
      <main className="gpt-main">
        {(tab === 'focus' || tab === 'city') && <div className="gpt-location-bar"><div><span className="eyebrow">{tab === 'focus' ? 'Không gian tập trung' : 'Thành phố nhật ký'}</span><label><select aria-label="Phong cách thành phố" value={appearance.place} onChange={(e) => setAppearance({ ...appearance, place: e.target.value })}>{Object.entries(PLACES).map(([id, p]) => <option key={id} value={id}>{p.name}</option>)}</select><span className="gpt-location-subtitle">{place.subtitle}</span></label></div><Atmosphere value={appearance} onChange={setAppearance} /></div>}
        {tab === 'focus' && <div className={`gpt-focus-layout${app.justDone && !app.state.active ? ' gpt-focus-done' : ''}`}>
          <section className="gpt-focus-panel">
            {!app.state.active && !app.justDone && <h1>Một phiên nhỏ.<br /><em>Một góc phố mới.</em></h1>}
            <FocusPanel app={app} goTo={setTab} CityRenderer={Scene} appearance={focusAppearance} architectural />
            <div className="gpt-today"><span>Hôm nay <b>{today.count}/{app.state.prefs.dailyGoal} phiên</b></span><span>{hoursMinutes(today.minutes)}</span></div>
          </section>
          <div className="gpt-focus-scene"><Scene city={focusCity} categories={app.state.categories} now={app.cityNow} appearance={focusAppearance} interactive={false} label={`Góc phố ${place.name}`} /><div className="gpt-focus-postcard"><span className="eyebrow">{app.city.buildings.length ? 'Thành phố của bạn' : 'Phố mẫu · chưa tính vào tiến độ'}</span><h2>{place.subtitle}</h2><button type="button" onClick={() => setTab('city')}>Ghé thăm thành phố <span aria-hidden="true">↗</span></button></div><span className="gpt-season-label">{SEASONS[appearance.season]} · {snowIn(appearance) ? 'Tuyết nhẹ' : appearance.weather === 'rain' ? 'Mưa nhẹ' : appearance.light === 'night' ? 'Lên đèn' : 'Yên bình'}</span></div>
        </div>}
        {tab === 'city' && <CityWorkspace app={app} appearance={cityAppearance} sample={sample} onSampleChange={setSample} />}
        {tab === 'stats' && <div className="gpt-inner-page"><span className="eyebrow">Những điều bạn đã làm được</span><h1>Nhật ký tập trung</h1><StatsView app={app} /></div>}
        {tab === 'settings' && <div className="gpt-inner-page"><span className="eyebrow">Theo nhịp của bạn</span><h1>Cài đặt</h1><SettingsView app={app} sync={sync} /></div>}
      </main>
      <footer className="gpt-footer"><span>Mỗi khoảng thời gian, một dấu tích.</span><span>GPT edition <span aria-hidden="true">/</span> {__APP_COMMIT__}</span></footer>
    </div>
  );
}
