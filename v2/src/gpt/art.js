import { HOIAN_BLUEPRINTS } from '../engine/catalog.js';
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
export function crossingDeck(z) {
  return .22+Math.sin(Math.max(0,Math.min(1,(z+3.14)/2.28))*Math.PI)*.35;
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
  return { ...city, candidates: [], pile: [], residents: [], lanterns: [], statues: [], bricks: [],
    buildings: spots.map(([x, y], i) => {
      const bp=heritage?HOIAN_BLUEPRINTS[i]:null,size=bp?.size||8;
      return { planId:`postcard-${i}`,plot:{x,y},key:bp?.key,name:bp?.name,shape:bp?.shape||shapes[i]||(i%4===0?'market':'house'),style:5,size,workUnit:'minutes',targetMinutes:size*25,workMs:size*25*60000,
        bricks:Array.from({length:size},(_,j)=>({id:`postcard-${i}-${j}`,sid:'',kind:'plain'})) };
    }),
  };
}
