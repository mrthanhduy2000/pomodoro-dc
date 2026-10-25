/** Warm editorial journal: searchable records, day drill-down and bounded list rendering. */
import { memo, useDeferredValue, useMemo, useState } from 'react';
import { dayKey, lastDays, retention, journalEntries } from '../engine/stats.js';
import { hoursMinutes, shortDay, timeOfDay } from './format.js';

function StatsView({app}) {
  const {state,now}=app,sessions=state.sessions,today=dayKey(now);
  const [query,setQuery]=useState(''),[category,setCategory]=useState(''),[status,setStatus]=useState('completed');
  const [range,setRange]=useState('28'),[from,setFrom]=useState(''),[to,setTo]=useState('');
  const [page,setPage]=useState({key:'',limit:40});
  const deferredQuery=useDeferredValue(query),asOf=Date.parse(`${today}T12:00:00+07:00`);
  const fromDay=range==='custom'?from:range==='all'?'':dayKey(asOf-(Number(range)-1)*86400000),toDay=range==='custom'?to:today;
  const result=useMemo(()=>journalEntries({sessions},{query:deferredQuery,category,status,from:fromDay,to:toDay}),[sessions,deferredQuery,category,status,fromDay,toDay]);
  const days=useMemo(()=>lastDays({sessions},asOf,28),[sessions,asOf]);
  const rhythm=useMemo(()=>retention({sessions},asOf,4),[sessions,asOf]);
  const key=JSON.stringify([deferredQuery,category,status,fromDay,toDay]),limit=page.key===key?page.limit:40;
  const visible=result.rows.slice(0,limit),max=Math.max(1,...days.map(d=>d.minutes));
  const grouped=[];
  for(const session of visible) {
    const day=dayKey(session.endedAt);
    if(grouped.at(-1)?.day!==day)grouped.push({day,rows:[]});
    grouped.at(-1).rows.push(session);
  }
  return <div className="stats journal">
    <div className="journal-rhythm"><span>{rhythm.streak} ngày liên tiếp</span><span>{rhythm.activeDaysPerWeek.toFixed(1)} ngày tập trung / tuần trong 4 tuần gần nhất</span></div>
    <section className="card journal-chart"><span className="eyebrow">28 ngày · chỉ tính phiên hoàn thành</span><div className="bars bars--wide">{days.map(day=><button type="button" key={day.key} className="bars__col" aria-label={`${shortDay(day.key)}: ${day.minutes} phút; xem ngày này`} onClick={()=>{setRange('custom');setFrom(day.key);setTo(day.key);}}><span className="bars__bar" style={{height:`${Math.max(3,day.minutes/max*100)}%`}} /></button>)}</div></section>
    <section className="card journal-records"><div className="journal-tools">
      <label>Tìm mục tiêu<input type="search" value={query} placeholder="Tìm một việc đã làm…" onChange={event=>setQuery(event.target.value)} /></label>
      <label>Loại việc<select value={category} onChange={event=>setCategory(event.target.value)}><option value="">Tất cả loại việc</option>{[...state.categories.values()].map(cat=><option key={cat.id} value={cat.id}>{cat.label}</option>)}</select></label>
      <label>Trạng thái<select value={status} onChange={event=>setStatus(event.target.value)}><option value="completed">Đã hoàn thành</option><option value="all">Hoàn thành và đã huỷ</option><option value="cancelled">Đã huỷ</option></select></label>
      <label>Khoảng thời gian<select value={range} onChange={event=>setRange(event.target.value)}><option value="7">7 ngày</option><option value="28">28 ngày</option><option value="90">90 ngày</option><option value="all">Toàn bộ lịch sử</option><option value="custom">Chọn ngày</option></select></label>
    </div>{range==='custom'&&<div className="journal-dates"><label>Từ ngày<input type="date" value={from} max={to||today} onChange={event=>setFrom(event.target.value)} /></label><label>Đến ngày<input type="date" value={to} min={from} max={today} onChange={event=>setTo(event.target.value)} /></label></div>}
    <div className="journal-total" aria-live="polite"><b>{result.count} phiên</b><strong>{hoursMinutes(result.minutes)}</strong><span>{result.days} ngày · {result.completed} hoàn thành · {result.cancelled} đã huỷ</span></div>
    {grouped.length===0?<p className="muted">Không có phiên phù hợp với bộ lọc.</p>:grouped.map(group=><section className="journal-day" key={group.day}><h2>{shortDay(group.day)}</h2><ul className="list">{group.rows.map(session=>{const cat=state.categories.get(session.categoryId);return <li key={session.sid} className="list__row"><time className="list__when" dateTime={new Date(session.endedAt).toISOString()}>{timeOfDay(session.endedAt)}</time><span className="list__what">{cat&&<span className="tag" style={{'--chip':cat.color}}>{cat.label}</span>}<span>{session.goal||'Một phiên tập trung'}</span>{session.status==='cancelled'&&<small>Đã huỷ</small>}{session.legacy&&<small>Lịch sử bản mặc định</small>}</span><b className="list__min">{session.minutes}′</b></li>;})}</ul></section>)}
    {result.count>limit&&<button type="button" className="btn" onClick={()=>setPage({key,limit:limit+40})}>Xem thêm 40 phiên · còn {result.count-limit}</button>}
    </section></div>;
}

export default memo(StatsView,(previous,next)=>previous.app.state.sessions===next.app.state.sessions&&previous.app.state.categories===next.app.state.categories&&dayKey(previous.app.now)===dayKey(next.app.now));
