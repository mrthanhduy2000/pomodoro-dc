import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

import { constructionProgress, constructionMinutes, constructionStage, MINUTES_PER_STEP } from '../engine/city.js';
import { blueprintsOf, HOIAN_BLUEPRINTS, heritageOf } from '../engine/catalog.js';
import { todaySummary, lastDays, currentStreak } from '../engine/stats.js';
import { FocusPanel } from '../ui/FocusView.jsx';
import { Detail } from '../ui/CityView.jsx';
import StatsView from '../ui/StatsView.jsx';
import SettingsView from '../ui/SettingsView.jsx';
import { hoursMinutes } from '../ui/format.js';
import { PLACES, SEASONS, postcardCity, readAppearance, snowIn, riverCandidates } from './art.js';
import { futureCity, DISTRICTS } from './world.js';
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

function HeritageNote({ building }) {
  const place=heritageOf(building?.key);
  return place && <div className="gpt-heritage-note"><span className="eyebrow">Nét riêng công trình</span><p>{place.feature}</p><details><summary>Nếp sống và nguồn tư liệu</summary><p>{place.life}</p><small>Tái hiện thu nhỏ, cách điệu từ địa danh thật; không phải bản sao đo đạc.</small><a href={place.source} target="_blank" rel="noreferrer">Tìm hiểu địa danh ↗</a></details></div>;
}

function BlueprintChoices({ city, onChoose, names = SHAPES, heritage = false }) {
  const choices=heritage?[...HOIAN_BLUEPRINTS,...blueprintsOf(city.era)]:blueprintsOf(city.era);
  return <div className="gpt-blueprints">{choices.map((bp) => (
    <button key={bp.key} type="button" onClick={() => onChoose(bp)}>
      <span className={`gpt-house-icon gpt-house-icon--${bp.shape}`} aria-hidden="true">⌂</span>
      <span><b>{heritageOf(bp.key)?bp.name:names[bp.shape]}</b><small>{bp.size * MINUTES_PER_STEP} phút · {heritageOf(bp.key)?bp.feature:bp.name}</small></span><span aria-hidden="true">↗</span>
    </button>
  ))}</div>;
}

function CityWorkspace({ app, appearance, sample, onSampleChange }) {
  const [pick, setPick] = useState(null);
  const [blueprint, setBlueprint] = useState(null);
  const [planning, setPlanning] = useState(false);
  const [scene, setScene] = useState(null);
  const [previewWork, setPreviewWork] = useState(false);
  const [previewPercent, setPreviewPercent] = useState(35);
  useEffect(()=>{
    if(sample==='full'&&scene?.model?.city.futurePlan)scene.viewDistrict(DISTRICTS[0],0);
  },[sample,scene]);
  const [renderedPreview, setRenderedPreview] = useState(35);
  useEffect(()=>{
    const timeout=setTimeout(()=>setRenderedPreview(previewPercent),120);
    return ()=>clearTimeout(timeout);
  },[previewPercent]);
  useEffect(()=>{
    if(blueprint?.key==='ha-chuacau-v1')scene?.frameCity(appearance.motion?900:0);
  },[blueprint?.key,scene,appearance.motion]);
  const city = app.city;
  const names = appearance.place === 'hoian' ? HOIAN_NAMES : SHAPES;
  const shownCity = useMemo(() => {
    if(!sample)return city;
    const town=sample==='full'?futureCity(city):postcardCity(city,appearance.place==='hoian');
    if(!previewWork||sample==='full')return town;
    const target=pick?.planId||town.buildings[0].planId;
    return {...town,buildings:town.buildings.map(b=>b.planId===target?{...b,workMs:b.targetMinutes*60000*renderedPreview/100,bricks:b.bricks.slice(0,Math.ceil(b.size*renderedPreview/100))}:b)};
  }, [sample, city, previewWork, renderedPreview, pick?.planId, appearance.place]);
  const current = city.current;
  const remaining = current ? current.workUnit==='minutes' ? Math.ceil(current.targetMinutes-constructionMinutes(current)) : current.size-current.bricks.length : 0;
  const collected = new Set(city.buildings.filter(b=>constructionProgress(b)>=1 && heritageOf(b.key)).map(b=>b.key));
  const previewChoices=appearance.place==='hoian'?HOIAN_BLUEPRINTS.map(bp=>({id:bp.key,name:bp.name,building:shownCity.buildings.find(b=>b.key===bp.key)})):Object.entries(names).map(([shape,name])=>({id:shape,name,building:shownCity.buildings.find(b=>b.shape===shape)}));
  const chosenBuilding=city.buildings.find(b=>b.planId===pick?.planId);
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
        <Scene key={sample==='full'?'future':sample?'sample':'earned'} city={shownCity} categories={app.state.categories} now={app.cityNow} appearance={appearance} onPick={select} onScene={setScene} picking={Boolean(blueprint)} placementBlueprint={blueprint?.key} selectedPlan={selectedPlan} label={sample==='full'?'Hội An mở rộng, quy hoạch tham khảo không phải thành tích thật':sample ? 'Phố mẫu kiến trúc, không phải thành tích thật' : 'Thành phố từ các phiên tập trung của bạn'} />
        <div className="gpt-scene-caption"><span className="gpt-live-dot" /><span>{sample==='full'?'Hội An mở rộng · quy hoạch tham khảo':sample ? 'Phố mẫu · không tính vào tiến độ' : `${city.buildings.length} công trình · ${city.totalBricks} viên gạch`}</span></div>
        <div className="gpt-camera-tools">
          <button type="button" onClick={() => scene?.frameCity(appearance.motion ? 900 : 0)} title="Đưa máy ảnh về toàn cảnh">Toàn cảnh</button>
          {appearance.place==='hoian' && <><button type="button" onClick={()=>scene?.viewQuarter('river',appearance.motion?1000:0)}>Dạo bờ sông</button><button type="button" onClick={()=>scene?.viewQuarter('bridge',appearance.motion?1000:0)}>Qua cầu</button><button type="button" onClick={()=>scene?.viewQuarter('market',appearance.motion?1000:0)}>Ghé chợ</button></>}
          {!sample && appearance.place==='hoian' && <button type="button" onClick={()=>{onSampleChange('full');setPick(null);setBlueprint(null);setPreviewWork(false);}}>Hội An mở rộng · tương lai</button>}
          <button type="button" onClick={() => { onSampleChange(!sample); setPick(null); setBlueprint(null); setPreviewWork(false); }}>{sample ? 'Thành phố của tôi' : 'Xem trước 3D'}</button>
        </div>
        {blueprint && <div className="gpt-placement"><b>Đặt {heritageOf(blueprint.key)?blueprint.name:names[blueprint.shape].toLowerCase()}</b><span>{blueprint.key==='ha-chuacau-v1'?'Chọn vị trí sáng bắc qua lạch nước.':'Chọn một ô đất sáng trong thành phố.'}</span><div className="row"><button type="button" className="btn btn--primary" onClick={() => place(blueprint.key==='ha-chuacau-v1'?riverCandidates(city.candidates)[0]:city.candidates[0])}>Chọn ô gần nhất</button><button type="button" className="btn" onClick={() => setBlueprint(null)}>Huỷ</button></div></div>}
      </div>
      <aside className="gpt-city-inspector">
        {sample ? (
          <><span className="eyebrow">{sample==='full'?'Hội An mở rộng · bản nghiên cứu':'Xem trước thành phố 3D'}</span><h2>{sampleBuilding ? (sampleBuilding.name||names[sampleBuilding.shape]) : 'Một nơi để\nmuốn trở về.'}</h2><p className="muted">{sample==='full'?'Bố trí theo khu vực và địa danh; diện tích công trình khác nhau. Đây là tỷ lệ khái quát, không phải bản đồ đo đạc hay tiến độ thật.':sampleBuilding ? (previewWork?'Công trình mẫu đang xây. Thợ và vật liệu chỉ minh họa, không tính vào tiến độ.':'Mẫu công trình hoàn thiện. Bạn có thể ngắm các mặt của ngôi nhà trong không gian 3D.') : `Ngắm thử phố ${PLACES[appearance.place].name}. Những công trình mẫu không tính vào tiến độ của bạn.`}</p>{sampleBuilding && <button type="button" className="btn" onClick={() => scene?.focusBuilding(sampleBuilding.planId, appearance.motion ? 1000 : 0)}>Xem gần công trình ↗</button>}{sample==='full'&&<div className="gpt-districts">{DISTRICTS.map(district=><button key={district.id} type="button" className="btn" onClick={()=>scene?.viewDistrict(district,appearance.motion?1100:0)}>{district.name} ↗</button>)}<details><summary>Địa lý và nguồn tham khảo</summary>{DISTRICTS.map(district=><p key={district.id}><b>{district.name}</b> · {district.note} <a href={district.source} target="_blank" rel="noreferrer">Nguồn ↗</a></p>)}</details></div>}<button type="button" className="btn" hidden={sample==='full'} aria-pressed={previewWork} onClick={()=>{setPreviewWork(!previewWork);setPreviewPercent(35);if(!selectedPlan){const id=shownCity.buildings[0].planId;setPick({type:'building',planId:id});scene?.focusBuilding(id,appearance.motion?800:0);}}}>{previewWork?'Xem nhà đã hoàn thiện':'Xem giai đoạn đang xây'}</button>{previewWork && sampleBuilding && <label className="gpt-construction-preview">{Math.round(constructionMinutes(sampleBuilding))}/{sampleBuilding.targetMinutes} phút · {constructionStage(sampleBuilding).label}<input type="range" min="0" max="100" step="1" aria-label="Tiến độ thi công mẫu" value={previewPercent} onChange={e=>setPreviewPercent(Number(e.target.value))} /></label>}{sampleBuilding && heritageOf(sampleBuilding.key) && city.canPlan && <button type="button" className="btn btn--primary" onClick={()=>choose(heritageOf(sampleBuilding.key))}>Xây mẫu này · {heritageOf(sampleBuilding.key).size*MINUTES_PER_STEP} phút</button>}<HeritageNote building={sampleBuilding} /><div className="gpt-preview-types">{previewChoices.map(({id,name,building})=> {
            return building && <button key={id} type="button" aria-pressed={sampleBuilding?.planId===building.planId} onClick={()=> { setPick({type:'building',planId:building.planId}); scene?.focusBuilding(building.planId,appearance.motion?1000:0); }}>{name}<span aria-hidden="true">↗</span></button>;
          })}</div><button type="button" className="btn btn--primary" onClick={() => { setPick(null); setPreviewWork(false); onSampleChange(false); }}>Xây thành phố của tôi</button><div className="gpt-inspector-note">Phút tập trung của phiên đã hoàn thành sẽ xây móng, dựng khung, lợp mái và hoàn thiện ngôi nhà.</div></>
        ) : pick ? <><HeritageNote building={chosenBuilding} /><Detail pick={pick} city={city} categories={app.state.categories} onFocus={(id) => scene?.focusBuilding(id, appearance.motion ? 1000 : 0)} onClose={() => setPick(null)} architectural /></> : (
          <><span className="eyebrow">Góc phố của bạn</span><h2>{current ? (heritageOf(current.key)?.name||names[current.shape]) : 'Bắt đầu từ\nmột căn nhà.'}</h2>
            {current ? <><HeritageNote building={current} /><p className="muted">{current.name}</p><div className="gpt-progress"><span style={{ width: `${constructionProgress(current) * 100}%` }} /></div><p><b>{current.workUnit==='minutes'?`${Math.floor(constructionMinutes(current))}/${current.targetMinutes} phút`:`${current.bricks.length}/${current.size} phiên (kế hoạch cũ)`}</b> · {constructionStage(current).label}</p><p className="muted">Còn {remaining} {current.workUnit==='minutes'?'phút':'phiên'} để hoàn thành.</p><button type="button" className="btn" onClick={() => scene?.focusBuilding(current.planId, appearance.motion ? 1000 : 0)}>Đến công trình ↗</button></> : <p className="muted">Chọn một công trình. Mỗi phiên tập trung sẽ để lại một dấu tích ở đây.</p>}
            {appearance.place==='hoian' && <div className="gpt-collection"><b>Bộ sưu tập phố Hội · {collected.size}/{HOIAN_BLUEPRINTS.length}</b><span>Công trình đã hoàn thiện</span><div>{HOIAN_BLUEPRINTS.map(bp=><span key={bp.key} title={bp.name} className={collected.has(bp.key)?'is-collected':''}>{collected.has(bp.key)?'✓':'○'} {bp.name}</span>)}</div></div>}{city.pile.length > 0 && <p className="gpt-inspector-note">{city.pile.length} viên gạch đang chờ công trình tiếp theo.</p>}
            {city.queued.map((b) => <div className="gpt-queued" key={b.planId}><span>Tiếp theo: {names[b.shape]}</span>{b.bricks.length === 0 && <button className="link" type="button" onClick={() => app.cancelPlan(b.planId)}>Bỏ</button>}</div>)}
            {!blueprint && city.canPlan && (planning || !current ? <BlueprintChoices city={city} onChoose={choose} names={names} heritage={appearance.place==='hoian'} /> : <button type="button" className="btn btn--primary" onClick={() => setPlanning(true)}>Chọn công trình kế tiếp</button>)}
            {current && current.bricks.length === 0 && <button type="button" className="link gpt-cancel-plan" onClick={() => app.cancelPlan(current.planId)}>Đổi công trình này</button>}
          </>
        )}
      </aside>
    </div>
  );
}

function NoCityPreview() { return null; }

function FocusCompanion({app,onCity}) {
  const days=lastDays(app.state,app.now,7),max=Math.max(1,...days.map(day=>day.minutes));
  const building=app.city.current;
  return <aside className="gpt-focus-companion"><span className="eyebrow">Nhịp của bạn</span><h2>Từng phút.<br /><em>Thành một điều đáng nhớ.</em></h2>
    <div className="gpt-week-strip" aria-label="Thời gian tập trung 7 ngày">{days.map(day=><div key={day.key} title={`${day.key}: ${day.minutes} phút`}><span style={{height:`${Math.max(3,day.minutes/max*100)}%`}} /><small>{new Date(`${day.key}T12:00:00+07:00`).toLocaleDateString('vi-VN',{weekday:'short'})}</small></div>)}</div>
    <p>{currentStreak(app.state,app.now)} ngày liên tiếp · {days.reduce((sum,day)=>sum+day.minutes,0)} phút trong 7 ngày</p>
    <div className="gpt-build-summary"><span className="eyebrow">Công trình đang xây</span><h3>{building?.name||'Một góc phố đang chờ bạn'}</h3>{building&&<><div className="gpt-progress"><span style={{width:`${constructionProgress(building)*100}%`}} /></div><p>{constructionStage(building).label} · {building.workUnit==='minutes'?`${Math.floor(constructionMinutes(building))}/${building.targetMinutes} phút`:`${building.bricks.length}/${building.size} phiên`}</p></>}<button type="button" className="btn" onClick={onCity}>Thành phố của tôi ↗</button></div>
  </aside>;
}

export default function GptEdition({ app, sync }) {
  const [tab, setTab] = useState('focus');
  const [appearance, setAppearance] = useState(readAppearance);
  const [sample, setSample] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const today = todaySummary(app.state, app.now);
  const place = PLACES[appearance.place];
  const cityAppearance = useMemo(() => ({ ...appearance, motion: appearance.motion && !reduced }), [appearance, reduced]);
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
        {tab === 'city' && <div className="gpt-location-bar"><div><span className="eyebrow">{tab === 'focus' ? 'Không gian tập trung' : 'Thành phố nhật ký'}</span><label><select aria-label="Phong cách thành phố" value={appearance.place} onChange={(e) => setAppearance({ ...appearance, place: e.target.value })}>{Object.entries(PLACES).map(([id, p]) => <option key={id} value={id}>{p.name}</option>)}</select><span className="gpt-location-subtitle">{place.subtitle}</span></label></div><Atmosphere value={appearance} onChange={setAppearance} /></div>}
        {tab === 'focus' && <div className={`gpt-focus-layout${app.justDone && !app.state.active ? ' gpt-focus-done' : ''}`}>
          <section className="gpt-focus-panel">
            {!app.state.active && !app.justDone && <h1>Một phiên nhỏ.<br /><em>Một góc phố mới.</em></h1>}
            <FocusPanel app={app} goTo={setTab} CityRenderer={NoCityPreview} architectural />
            <div className="gpt-today"><span>Hôm nay <b>{today.count}/{app.state.prefs.dailyGoal} phiên</b></span><span>{hoursMinutes(today.minutes)}</span></div>
          </section>
          <FocusCompanion app={app} onCity={()=>{setSample(false);setTab('city');}} />
        </div>}
        {tab === 'city' && <CityWorkspace app={app} appearance={cityAppearance} sample={sample} onSampleChange={setSample} />}
        {tab === 'stats' && <div className="gpt-inner-page"><span className="eyebrow">Những điều bạn đã làm được</span><h1>Nhật ký tập trung</h1><StatsView app={app} /></div>}
        {tab === 'settings' && <div className="gpt-inner-page"><span className="eyebrow">Theo nhịp của bạn</span><h1>Cài đặt</h1><SettingsView app={app} sync={sync} /></div>}
      </main>
      <footer className="gpt-footer"><span>Mỗi khoảng thời gian, một dấu tích.</span><span>GPT edition <span aria-hidden="true">/</span> {__APP_COMMIT__}</span></footer>
    </div>
  );
}
