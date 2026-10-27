import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

import { constructionProgress, constructionMinutes, constructionStage, MINUTES_PER_STEP } from '../engine/city.js';
import { blueprintsOf, HOIAN_BLUEPRINTS, heritageOf } from '../engine/catalog.js';
import { todaySummary, lastDays, currentStreak } from '../engine/stats.js';
import { FocusPanel } from '../ui/FocusView.jsx';
import { Detail } from '../ui/CityView.jsx';
import StatsView from '../ui/StatsView.jsx';
import SettingsView from '../ui/SettingsView.jsx';
import { hoursMinutes } from '../ui/format.js';
import { PLACES, SEASONS, postcardCity, readAppearance, snowIn } from './art.js';
import { regionalCity, DISTRICTS, MAP_ROADS, HOIAN_MAP, TANKY_NEIGHBOURS } from './world.js';
import { mapReference } from '../engine/hoianMap.js';
import { parcelCandidates, mappedCandidates, parcelProfile, PARCEL_DISTRICTS } from '../engine/parcels.js';
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
  return place && <div className="gpt-heritage-note"><span className="eyebrow">Nét riêng công trình</span><p>{place.feature}</p><details><summary>Nếp sống và nguồn tư liệu</summary><p>{place.life}</p><small>Tái hiện thu nhỏ, cách điệu từ địa danh thật; không phải bản sao đo đạc.</small>{building.reference&&<a href={building.reference.source} target="_blank" rel="noreferrer">Điểm tham chiếu trên bản đồ ↗</a>}<a href={place.source} target="_blank" rel="noreferrer">Tìm hiểu địa danh ↗</a></details></div>;
}

function BlueprintChoices({ city, onChoose, names = SHAPES, heritage = false }) {
  const choices=heritage?[...HOIAN_BLUEPRINTS,...blueprintsOf(city.era)]:blueprintsOf(city.era);
  return <div className="gpt-blueprints">{choices.map((bp) => (
    <button key={bp.key} type="button" onClick={() => onChoose(bp)}>
      <span className={`gpt-house-icon gpt-house-icon--${bp.shape}`} aria-hidden="true">⌂</span>
      <span><b>{heritageOf(bp.key)?bp.name:names[bp.shape]}</b><small>{bp.size * MINUTES_PER_STEP} phút{heritageOf(bp.key)?` · ${bp.feature}`:heritage?'':` · ${bp.name}`}</small></span><span aria-hidden="true">↗</span>
    </button>
  ))}</div>;
}

/** Reuse cream/forest tokens and the existing serif/body hierarchy; dated references stay folded. */
function HoiAnMapGuide({scene,motion}) {
  const roads=MAP_ROADS.filter((road,i,all)=>all.findIndex(item=>item.name===road.name)===i);
  return <details className="gpt-map-guide"><summary>Đường phố &amp; tư liệu khảo sát</summary>
    <p>Phố cổ · {HOIAN_MAP.landmarks.length} địa danh, {MAP_ROADS.length} đoạn đường có tọa độ. Nền nhà lấy tâm từ bản đồ; chiều cao, mái và bờ nước còn minh hoạ. Chưa tái hiện toàn bộ Hội An.</p>
    <div className="gpt-preview-types">{TANKY_NEIGHBOURS.map(house=><button type="button" key={house.id}
      title={`Mặt tiền theo ảnh ${house.date}; vị trí và tỷ lệ được diễn giải trong khuôn bản đồ hiện có.`}
      onClick={()=>scene?.viewSurveyedHouse(house.id,motion?900:0)}>{house.label} ↗</button>)}</div>
    <small>Mặt tiền quanh Tấn Ký theo ảnh 2021–2023; vị trí ghép vào nền bản đồ còn diễn giải.</small>
    <p>{TANKY_NEIGHBOURS.map(house=><a key={house.id} href={house.source} target="_blank" rel="noreferrer">Tư liệu {house.label.split(' · ')[0]} · {house.date} ↗ </a>)}</p>
    <div className="gpt-preview-types">{roads.map(road=><button type="button" key={road.id} onClick={()=>{
      const points=MAP_ROADS.filter(item=>item.name===road.name).flatMap(item=>item.points),x=points.reduce((sum,p)=>sum+p.x,0)/points.length,z=points.reduce((sum,p)=>sum+p.z,0)/points.length;
      scene?.viewDistrict({x,z,span:Math.max(16,Math.min(45,Math.hypot(points.at(-1).x-points[0].x,points.at(-1).z-points[0].z)))},motion?900:0);
    }}>{road.name} ↗</button>)}</div>
    <p><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors · ODbL</a> · dữ liệu {HOIAN_MAP.retrieved}.</p>
    <a href="https://www.hoianworldheritage.org.vn/vi/maps.hwh" target="_blank" rel="noreferrer">Bản đồ cơ quan bảo tồn ↗</a>
    <p>Tiếp theo: {DISTRICTS.filter(d=>d.pending).map(d=>d.name).join(' · ')} — chờ khảo sát vị trí.</p>
  </details>;
}

function CityWorkspace({ app, appearance, sample, onSampleChange }) {
  const [pick, setPick] = useState(null);
  const [blueprint, setBlueprint] = useState(null);
  const [planning, setPlanning] = useState(false);
  const [district,setDistrict]=useState('oldtown');
  const [siteIndex,setSiteIndex]=useState(0);
  const [scene, setScene] = useState(null);
  const [previewWork, setPreviewWork] = useState(false);
  const [previewPercent, setPreviewPercent] = useState(35);
  useEffect(()=>{
    if(appearance.place==='hoian'&&scene?.model?.city.geoPlan)scene.viewDistrict(DISTRICTS[0],0);
  },[scene,appearance.place]);
  const [renderedPreview, setRenderedPreview] = useState(35);
  useEffect(()=>{
    const timeout=setTimeout(()=>setRenderedPreview(previewPercent),120);
    return ()=>clearTimeout(timeout);
  },[previewPercent]);
  const city = app.city;
  const sites=useMemo(()=>blueprint&&appearance.place==='hoian'?(mapReference(blueprint.key)?mappedCandidates(city,blueprint.key):parcelCandidates(city,blueprint.key,district)):null,[blueprint,city,district,appearance.place]);
  const selectedSite=sites?.[siteIndex]||sites?.[0];
  const selectedSiteKey=selectedSite?JSON.stringify(selectedSite):null;
  const placementSites=useMemo(()=>selectedSiteKey?[JSON.parse(selectedSiteKey)]:sites,[selectedSiteKey,sites]);
  useEffect(()=>{if(selectedSiteKey)scene?.focusParcel(JSON.parse(selectedSiteKey),appearance.motion?700:0);},[selectedSiteKey,scene,appearance.motion]);
  const names = appearance.place === 'hoian' ? HOIAN_NAMES : SHAPES;
  const baseCity = useMemo(() => {
    if(!sample&&appearance.place!=='hoian')return city;
    return appearance.place==='hoian'?regionalCity(city,Boolean(sample)):postcardCity(city);
  },[sample,city,appearance.place]);
  const shownCity = useMemo(() => {
    if(!previewWork||!sample)return baseCity;
    const target=pick?.planId||baseCity.buildings[0].planId;
    return {...baseCity,buildings:baseCity.buildings.map(b=>b.planId===target?{...b,workMs:b.targetMinutes*60000*renderedPreview/100,bricks:b.bricks.slice(0,Math.ceil(b.size*renderedPreview/100))}:b)};
  }, [baseCity,sample,previewWork,renderedPreview,pick?.planId]);
  const current = city.current;
  const remaining = current ? current.workUnit==='minutes' ? Math.ceil(current.targetMinutes-constructionMinutes(current)) : current.size-current.bricks.length : 0;
  const collected = new Set(city.buildings.filter(b=>constructionProgress(b)>=1 && heritageOf(b.key)).map(b=>b.key));
  const previewChoices=appearance.place==='hoian'?HOIAN_BLUEPRINTS.map(bp=>({id:bp.key,name:bp.name,building:shownCity.buildings.find(b=>b.key===bp.key)})):Object.entries(names).map(([shape,name])=>({id:shape,name,building:shownCity.buildings.find(b=>b.shape===shape)}));
  const chosenBuilding=city.buildings.find(b=>b.planId===pick?.planId);
  const choose = (bp) => { onSampleChange(false); setPick(null); setDistrict(parcelProfile(bp.key)?.districts[0]||'oldtown'); setSiteIndex(0); setBlueprint(bp); };
  const place = (plot,site=null) => {
    if (blueprint && (plot||site) && app.planBuilding(blueprint.key, plot,site)) { setBlueprint(null); setPlanning(false); }
  };
  const select = (p) => {
    if (sample) { setPick(p?.planId ? p : null); return; }
    if(blueprint && p?.type==='parcel')setSiteIndex(Math.max(0,sites.findIndex(site=>site.x===p.site.x&&site.z===p.site.z)));
    else if (blueprint && p?.type === 'plot'&&!sites) place(p.plot);
    else if (!blueprint) setPick(p && p.type !== 'plot' ? p : null);
  };
  const selectedPlan = pick?.planId || pick?.brick?.planId || null;
  const sampleBuilding = sample && shownCity.buildings.find((b) => b.planId === selectedPlan);
  return (
    <div className="gpt-city-workspace">
      <div className="gpt-city-stage">
        <Scene key={appearance.place==='hoian'?'hoian':sample?'sample':'earned'} city={shownCity} categories={app.state.categories} now={app.cityNow} appearance={appearance} onPick={select} onScene={setScene} picking={Boolean(blueprint)} placementBlueprint={blueprint?.key} placementSites={placementSites} selectedPlan={selectedPlan} label={appearance.place==='hoian'?'Hội An 3D, đường có nguồn bản đồ; nhà nền minh hoạ':sample ? 'Phố mẫu kiến trúc, không phải thành tích thật' : 'Thành phố từ các phiên tập trung của bạn'} />
        <div className="gpt-scene-caption"><span className="gpt-live-dot" /><span>{sample ? (appearance.place==='hoian'?'Hội An · xem trước 3D, không tính tiến độ':'Phố mẫu · không tính vào tiến độ') : (appearance.place==='hoian'?`${city.buildings.length} công trình của bạn · nền nhà tham chiếu`:`${city.buildings.length} công trình · ${city.totalBricks} viên gạch`)}</span></div>
        {appearance.place==='hoian'&&<a className="gpt-map-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>}
        <div className="gpt-camera-tools">
          <button type="button" onClick={() => scene?.frameCity(appearance.motion ? 900 : 0)} title="Đưa máy ảnh về toàn cảnh">Toàn cảnh</button>
          {appearance.place==='hoian' && <><button type="button" onClick={()=>scene?.viewQuarter('river',appearance.motion?1000:0)}>Dạo bờ sông</button><button type="button" onClick={()=>scene?.viewQuarter('bridge',appearance.motion?1000:0)}>Qua cầu</button><button type="button" onClick={()=>scene?.viewQuarter('market',appearance.motion?1000:0)}>Ghé chợ</button></>}
          <button type="button" onClick={() => { onSampleChange(!sample); setPick(null); setBlueprint(null); setPreviewWork(false); }}>{sample ? 'Tiến độ của tôi' : 'Xem trước 3D'}</button>
        </div>

      </div>
      <aside className="gpt-city-inspector">
        {appearance.place==='hoian'&&<HoiAnMapGuide scene={scene} motion={appearance.motion} />}
        {blueprint ? (
          <div className="gpt-parcel-planner">
            <span className="eyebrow">Chọn khu đất</span>
            <h2>{heritageOf(blueprint.key)?blueprint.name:names[blueprint.shape]}</h2>
            {sites ? <>
              <label>Khu vực<select aria-label="Khu vực xây công trình" value={district} onChange={event=>{setDistrict(event.target.value);setSiteIndex(0);}}>{PARCEL_DISTRICTS.filter(item=>parcelProfile(blueprint.key).districts.includes(item.id)).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              {selectedSite && <>
                <dl className="gpt-parcel-dimensions">
                  <div><dt>Mặt tiền</dt><dd>{selectedSite.width.toLocaleString('vi-VN')}<small>đơn vị</small></dd></div>
                  <div><dt>Chiều sâu</dt><dd>{selectedSite.depth.toLocaleString('vi-VN')}<small>đơn vị</small></dd></div>
                  <div><dt>Diện tích</dt><dd>{(selectedSite.width*selectedSite.depth).toLocaleString('vi-VN',{maximumFractionDigits:2})}<small>đơn vị²</small></dd></div>
                </dl>
                <p className="muted">{blueprint.key==='ha-chuacau-v1'?'Khu đất bắc qua lạch nước.':'Vạch sáng đánh dấu lối vào từ phố.'}</p>
              </>}
              <div className="gpt-parcel-sites"><span>Vị trí khu đất</span><div className="gpt-parcel-options" aria-label="Vị trí khu đất">{sites.map((site,i)=><button type="button" className="btn" aria-label={`Khu đất ${i+1}`} title={`Ngắm khu đất ${i+1}`} aria-pressed={selectedSite===site} key={`${site.x}:${site.z}`} onClick={()=>setSiteIndex(i)}>{i+1}</button>)}</div></div>
              {!selectedSite && <p>{mapReference(blueprint.key)?'Vị trí tham chiếu đã có công trình hoặc trùng với khu đất cũ. Công trình cũ được giữ nguyên.':'Chưa có khu đất trống phù hợp trong khu vực này.'}</p>}
              <button type="button" className="btn btn--primary" disabled={!selectedSite} onClick={()=>place(null,selectedSite)}>Xây công trình ở đây · {blueprint.size*MINUTES_PER_STEP} phút</button>
              <small className="gpt-parcel-scale">{selectedSite?.version===2?'Vị trí theo điểm bản đồ; diện tích và hướng nhà còn cách điệu.':'Khu xây dựng theo tỷ lệ trò chơi; vị trí chưa được khảo sát địa lý.'}</small>
              <HeritageNote building={blueprint} />
            </> : <><p className="muted">Chọn một ô đất sáng.</p><button type="button" className="btn btn--primary" onClick={()=>place(city.candidates[0])}>Chọn ô gần nhất</button></>}
            <button type="button" className="btn" onClick={()=>setBlueprint(null)}>Huỷ</button>
          </div>
        ) : sample ? (
          <><span className="eyebrow">{appearance.place==='hoian'?'Hội An · thành phố chung':'Xem trước thành phố 3D'}</span><h2>{sampleBuilding ? (sampleBuilding.name||names[sampleBuilding.shape]) : 'Một nơi để\nmuốn trở về.'}</h2><p className="muted">{sampleBuilding ? (previewWork?'Công trình mẫu đang xây. Thợ và vật liệu chỉ minh họa, không tính vào tiến độ.':'Mẫu công trình hoàn thiện. Bạn có thể ngắm các mặt của công trình trong không gian 3D.') : (appearance.place==='hoian'?'Hội An đang được tái hiện từng tuyến phố. Chọn công trình để xem hoặc bắt đầu xây.':`Ngắm thử phố ${PLACES[appearance.place].name}. Những công trình mẫu không tính vào tiến độ của bạn.`)}</p>{sampleBuilding && <button type="button" className="btn" onClick={() => scene?.focusBuilding(sampleBuilding.planId, appearance.motion ? 1000 : 0)}>Xem gần công trình ↗</button>}<button type="button" className="btn" aria-pressed={previewWork} onClick={()=>{setPreviewWork(!previewWork);setPreviewPercent(35);if(!selectedPlan){const id=shownCity.buildings[0].planId;setPick({type:'building',planId:id});scene?.focusBuilding(id,appearance.motion?800:0);}}}>{previewWork?'Xem nhà đã hoàn thiện':'Xem giai đoạn đang xây'}</button>{previewWork && sampleBuilding && <label className="gpt-construction-preview">{Math.round(constructionMinutes(sampleBuilding))}/{sampleBuilding.targetMinutes} phút · {constructionStage(sampleBuilding).label}<input type="range" min="0" max="100" step="1" aria-label="Tiến độ thi công mẫu" value={previewPercent} onChange={e=>setPreviewPercent(Number(e.target.value))} /></label>}{sampleBuilding && heritageOf(sampleBuilding.key) && city.canPlan && <button type="button" className="btn btn--primary" onClick={()=>choose(heritageOf(sampleBuilding.key))}>Xây mẫu này · {heritageOf(sampleBuilding.key).size*MINUTES_PER_STEP} phút</button>}<HeritageNote building={sampleBuilding} /><div className="gpt-preview-types">{previewChoices.map(({id,name,building})=> {
            return building && <button key={id} type="button" aria-pressed={sampleBuilding?.planId===building.planId} onClick={()=> { setPick({type:'building',planId:building.planId}); scene?.focusBuilding(building.planId,appearance.motion?1000:0); }}>{name}<span aria-hidden="true">↗</span></button>;
          })}</div><button type="button" className="btn btn--primary" onClick={() => { setPick(null); setPreviewWork(false); onSampleChange(false); }}>Xây công trình của tôi</button><div className="gpt-inspector-note">Phút tập trung của phiên đã hoàn thành sẽ xây móng, dựng khung, lợp mái và hoàn thiện ngôi nhà.</div></>
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
  const [sample, setSample] = useState(true);
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
          <FocusCompanion app={app} onCity={()=>{setSample(true);setTab('city');}} />
        </div>}
        {tab === 'city' && <CityWorkspace app={app} appearance={cityAppearance} sample={sample} onSampleChange={setSample} />}
        {tab === 'stats' && <div className="gpt-inner-page"><span className="eyebrow">Những điều bạn đã làm được</span><h1>Nhật ký tập trung</h1><StatsView app={app} /></div>}
        {tab === 'settings' && <div className="gpt-inner-page"><span className="eyebrow">Theo nhịp của bạn</span><h1>Cài đặt</h1><SettingsView app={app} sync={sync} /></div>}
      </main>
      <footer className="gpt-footer"><span>Mỗi khoảng thời gian, một dấu tích.</span><span>GPT edition <span aria-hidden="true">/</span> {__APP_COMMIT__}</span></footer>
    </div>
  );
}
