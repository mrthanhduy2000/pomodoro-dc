import { riverSite, parcelCandidates } from '../engine/parcels.js';
import { HOIAN_BLUEPRINTS, blueprintsOf, blueprint } from '../engine/catalog.js';
import { constructionProgress } from '../engine/city.js';
/** Presentation only: no event creation, store writes, or changes to plot coordinates. */
export const PLACES = {
  hoian: { name: 'Hội An', subtitle: 'Một chiều bên sông', wall: '#dfb95f', roof: '#66665b', wood: '#49382b', water: '#315f63', flower: '#b6537e', leaf: '#537c48' },
  kyoto: { name: 'Kyoto', subtitle: 'Những ngày thật chậm', wall: '#e6ddbd', roof: '#465755', wood: '#523f31', water: '#618d86', flower: '#e5abc0', leaf: '#71915a' },
  paris: { name: 'Paris', subtitle: 'Hẹn ở quán cà phê', wall: '#e1d4b7', roof: '#536270', wood: '#45534d', water: '#68868b', flower: '#bc645e', leaf: '#8c8b48' },
  colmar: { name: 'Colmar', subtitle: 'Ánh đèn bên ô cửa', wall: '#dfb5a3', roof: '#89564c', wood: '#584237', water: '#638a8d', flower: '#c58091', leaf: '#557a65' },
};
export const SEASONS = { spring: 'Mùa xuân', summer: 'Mùa hạ', autumn: 'Mùa thu', winter: 'Mùa đông' };
export const DEFAULT_APPEARANCE = { place: 'hoian', season: 'summer', weather: 'clear', light: 'golden', motion: true };
export function readAppearance() {
  try {
    const saved = JSON.parse(localStorage.getItem('dc-gpt-appearance') || '{}');
    return {
      place: PLACES[saved.place] ? saved.place : 'hoian',
      season: SEASONS[saved.season] ? saved.season : 'summer',
      weather: ['clear', 'rain'].includes(saved.weather) ? saved.weather : 'clear',
      light: ['golden', 'night', 'live'].includes(saved.light) ? saved.light : 'golden',
      motion: typeof saved.motion === 'boolean' ? saved.motion : true,
    };
  } catch { return { ...DEFAULT_APPEARANCE }; }
}
export function snowIn(a) { return a.season === 'winter' && a.place !== 'hoian'; }
export function architectureOf(building) {
  const floors = building.shape === 'tower' ? 3 : building.shape === 'house' ? 1 : 2;
  const width = building.shape === 'tower' ? 1.25 : building.shape === 'house' ? 1.7 : 2.25;
  return { floors, width, depth: 1.7, height: floors * 0.9, progress: constructionProgress(building) };
}
export function bridgeWalkHeight(z) {
  return .33-.315*Math.max(0,Math.min(1,(Math.abs(z+2)-1.53)/.39));
}
export { riverSite } from '../engine/parcels.js';
/** Render-only relocation explicitly requested for Chua Cau; the reducer/log remain untouched. */
export function projectGptCity(city) {
  let changed=false;
  const buildings=city.buildings.map(b=>{
    if(b.site && !b.world) {
      changed=true;
      return {...b,riverBridge:b.key==='ha-chuacau-v1',world:{sx:b.key==='ha-chuacau-v1'?1:b.site.width/3.8,sy:1,sz:b.key==='ha-chuacau-v1'?1:b.site.depth/3.2,yaw:b.site.yaw,district:b.site.district}};
    }
    if(b.key!=='ha-chuacau-v1'||b.riverBridge)return b;
    changed=true;
    const site=city.presentationSample&&b.planId==='postcard-3'?{x:2,z:-2}:riverSite(b.plot);
    return {...b,sourcePlot:b.plot,riverBridge:true,plot:{x:site.x/4,y:site.z/4}};
  });
  return changed?{...city,buildings}:city;
}
export function riverCandidates(candidates) {
  return candidates.slice().sort((a,b)=>Math.abs(riverSite(a).x)-Math.abs(riverSite(b).x)||a.x-b.x||a.y-b.y).slice(0,3);
}
/** Scene-local commerce: finite stock, alternating buyers, payment, handover and replenishment. */
export function tradeAt(time,phase,out={}) {
  const clock=Math.max(0,time+phase),round=Math.floor(clock/44),u=clock%44;
  const smooth=(a,b)=>{const p=Math.max(0,Math.min(1,(u-a)/(b-a)));return p*p*(3-2*p);};
  const approach=smooth(0,10),depart=smooth(23,35);
  out.u=u;out.active=round%2;out.offset=approach-depart;
  out.walking=u<10?Math.sin(u/10*Math.PI):u>=23&&u<35?Math.sin((u-23)/12*Math.PI):0;
  out.greet=smooth(10,12)*(1-smooth(22,23));
  out.exchange=smooth(17,20)*(1-smooth(22,23));
  out.payment=smooth(16,19);out.handover=smooth(19,23);out.restock=round%6===5&&u>=36;
  out.stock=6-round%6-(u>=21?1:0);
  if(out.restock)out.stock=Math.floor(smooth(36,43)*6);
  return out;
}
/** Compile a closed, pause-aware pedestrian journey once; frame sampling allocates nothing. */
export function streetJourney(points, speed=.24) {
  let duration=0,distance=0;
  const segments=[];
  for(let i=0;i<points.length;i++) {
    const a=points[i],b=points[(i+1)%points.length],length=Math.hypot(b[0]-a[0],b[1]-a[1],(b[2]||0)-(a[2]||0));
    const pause=a[3]||0;
    segments.push({a,b,start:duration,pause,travel:length/speed,length,distance});
    duration+=pause+length/speed;distance+=length;
  }
  return {segments,duration};
}
export function journeyAt(journey,time,out={}) {
  const u=((time%journey.duration)+journey.duration)%journey.duration;
  const s=journey.segments.find(segment=>u<segment.start+segment.pause+segment.travel)||journey.segments.at(-1);
  const elapsed=u-s.start,progress=Math.max(0,Math.min(1,(elapsed-s.pause)/Math.max(.001,s.travel)));
  const eased=progress*progress*(3-2*progress);
  out.x=s.a[0]+(s.b[0]-s.a[0])*eased;out.z=s.a[1]+(s.b[1]-s.a[1])*eased;
  out.y=(s.a[2]||0)+((s.b[2]||0)-(s.a[2]||0))*eased;
  out.distance=s.distance+s.length*eased;out.walking=elapsed<s.pause?0:Math.sin(progress*Math.PI);
  out.heading=Math.atan2(s.b[0]-s.a[0],s.b[1]-s.a[1]);out.waiting=elapsed<s.pause;
  return out;
}
/** A labelled, read-only postcard. These objects NEVER enter buildCity or the event log. */
export function postcardCity(city, heritage = false) {
  const spots = [[-1, 0], [0, 0], [1, 0], [-1, -1], [0, -1], [1, -1], [0, 1], [-1, 1], [1, 1],
    [-1,-2],[0,-2],[1,-2],[-2,-1],[-2,0],[-2,1],[-2,-2],[2,-1],[2,0],[2,1],[2,-2]];
  const shapes = ['house', 'market', 'hall', 'house', 'temple', 'house', 'tower', 'market', 'house'];
  return { ...city, presentationSample:true, candidates: [], pile: [], residents: [], lanterns: [], statues: [], bricks: [],
    buildings: spots.map(([x, y], i) => {
      const bp=heritage?HOIAN_BLUEPRINTS[i]:null,size=bp?.size||8;
      return { planId:`postcard-${i}`,plot:{x,y},key:bp?.key,name:bp?.name,shape:bp?.shape||shapes[i]||(i%4===0?'market':'house'),style:5,size,workUnit:'minutes',targetMinutes:size*25,workMs:size*25*60000,
        bricks:Array.from({length:size},(_,j)=>({id:`postcard-${i}-${j}`,sid:'',kind:'plain'})) };
    }),
  };
}

/** Exercise the same real parcel geometry without commands, session credit or stored plans. */
export function parcelPostcardCity(city) {
  const sample=postcardCity(city,true),buildings=[];
  for(const b of sample.buildings) {
    const key=b.key||blueprintsOf(1).find(bp=>bp.shape===b.shape).key;
    const site=parcelCandidates({buildings},key)[0],bp=blueprint(key);
    buildings.push({...b,key,site,size:bp.size,targetMinutes:bp.size*25,workMs:bp.size*25*60000,bricks:b.bricks.slice(0,bp.size),workVersion:2,plot:{x:site.x/4,y:site.z/4}});
  }
  return {...sample,buildings,current:null,queued:[],totalBricks:0,parcelSample:true};
}
