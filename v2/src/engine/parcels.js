/** Version-1 game parcels. World units are interpretive proportions, never cadastral metres. */
import { blueprint } from './catalog.js';
import { mappedSite } from './hoianMap.js';

export const PARCEL_DISTRICTS = Object.freeze([
  { id:'oldtown', name:'Phố cổ', left:-18, right:26, front:-11, direction:-1 },
  { id:'thanhha', name:'Thanh Hà · làng gốm', left:-62, right:-28, front:-11, direction:-1 },
  { id:'kimbong', name:'Kim Bồng · Cẩm Kim', left:-16, right:20, front:11, direction:1 },
  { id:'camthanh', name:'Cẩm Thanh · ven nước', left:32, right:64, front:11, direction:1 },
]);
const round = n => Math.round(n*1000)/1000;
const SHAPES = { house:[2.8,5.8], hall:[6.4,6.2], market:[7.4,5.8], temple:[6.8,6.4], tower:[3.6,4.2] };
const NAMES = {house:'Nhà phố thương nhân',hall:'Hội quán',market:'Chợ phố Hội',temple:'Nhà văn hóa sân trong',tower:'Lầu chuông'};
const HERITAGE = {
  'ha-tanky-v1':[2.8,7.2], 'ha-phunghung-v1':[3.4,6.6], 'ha-phuckien-v1':[7.2,7.2],
  'ha-quangtrieu-v1':[6.8,7.2], 'ha-quancong-v1':[5.8,7.2], 'ha-campho-v1':[7.6,7],
  'ha-cho-v1':[8.2,6.2], 'ha-thanhha-v1':[6.2,6.8], 'ha-kimbong-v1':[6.8,6.4],
  'ha-chuacau-v1':[2.8,4.4],
};

export function parcelProfile(key) {
  const bp=blueprint(key); if(!bp)return null;
  const [width,depth]=HERITAGE[key]||SHAPES[bp.shape];
  const districts=key==='ha-chuacau-v1'?['oldtown']:key==='ha-thanhha-v1'?['thanhha']:key==='ha-kimbong-v1'?['kimbong']:key.startsWith('ha-')?['oldtown']:PARCEL_DISTRICTS.map(d=>d.id);
  const side=['ha-phunghung-v1','ha-campho-v1'].includes(key)?'west':key.startsWith('ha-')&&districts[0]==='oldtown'&&key!=='ha-chuacau-v1'?'east':null;
  return {width,depth,districts,bridge:key==='ha-chuacau-v1',side,name:key.startsWith('ha-')?bp.name:NAMES[bp.shape]};
}

const frontageRange=(p,d)=>({left:p.side==='east'?Math.max(4.8,d.left):d.left,right:p.side==='west'?Math.min(0,d.right):d.right});

/** The already-released Chua Cau address mapping (ADR-105), shared by replay and presentation. */
export function riverSite(plot) {
  const signed=n=>n>=0?2*n:-2*n-1;
  const x=signed(plot.x),y=signed(plot.y),index=(x+y)*(x+y+1)/2+y;
  const slot=index%2===0?index/2:-(index+1)/2;
  return {x:2+slot*8,z:-2};
}

export function buildingParcel(building) {
  if(building.site)return building.site;
  if(building.key==='ha-chuacau-v1')return {...riverSite(building.sourcePlot||building.plot),width:2.8,depth:4.4};
  return {x:building.plot.x*4,z:building.plot.y*4,width:3.9,depth:3.2};
}
export function parcelsOverlap(a,b,gap=.22) {
  return Math.abs(a.x-b.x)<(a.width+b.width)/2+gap-1e-6 && Math.abs(a.z-b.z)<(a.depth+b.depth)/2+gap-1e-6;
}
export const parcelAvailable=(site,buildings)=>!buildings.some(b=>parcelsOverlap(site,buildingParcel(b)));

/** Reject malformed/cross-water sites; historic profiles are frozen by this site version. */
export function validParcel(site,key) {
  if(site?.version===2) {
    const p=parcelProfile(key),expected=p&&mappedSite(key,p.width,p.depth);
    return Boolean(expected&&Object.keys(expected).every(field=>site[field]===expected[field]));
  }
  const p=parcelProfile(key),district=PARCEL_DISTRICTS.find(d=>d.id===site?.district);
  if(!p||!district||site.version!==1||!p.districts.includes(site.district))return false;
  if(![site.x,site.z,site.width,site.depth,site.yaw].every(Number.isFinite))return false;
  if(Math.abs(site.x)>20000||Math.abs(site.z)>20000||site.width!==p.width||site.depth!==p.depth)return false;
  if(p.bridge)return site.z===-2&&site.yaw===Math.PI/2;
  const north=site.z+site.depth/2<=-3.35,south=site.z-site.depth/2>=.65;
  const range=frontageRange(p,district);
  const row=(site.z+district.direction*site.depth/2-district.front)/(district.direction*10);
  return Math.abs(row-Math.round(row))<1e-6&&row>=0&&row<128
    && site.yaw===(district.direction<0?Math.PI:0) && (district.direction<0?north:south)
    && site.x-site.width/2>=range.left-1e-6&&site.x+site.width/2<=range.right+1e-6;
}

/** Fill free frontage intervals, rather than rounding buildings to four-unit squares. */
export function parcelCandidates(city,key,districtId,limit=5) {
  const p=parcelProfile(key);if(!p)return [];
  const district=PARCEL_DISTRICTS.find(d=>d.id===(p.districts.includes(districtId)?districtId:p.districts[0]));
  const buildings=city.buildings||[],rects=buildings.map(buildingParcel),out=[];
  const range=frontageRange(p,district);
  if(p.bridge) {
    for(let i=0;i<buildings.length+limit+12&&out.length<limit;i++) {
      const x=2+(i%2?-(i+1)/2:i/2)*5.2;
      const site={version:1,district:'oldtown',x:round(x),z:-2,width:p.width,depth:p.depth,yaw:Math.PI/2};
      if(parcelAvailable(site,buildings))out.push(site);
    }
    return out;
  }
  for(let row=0;row<128&&out.length<limit;row++) {
    const z=round(district.front+district.direction*row*10-district.direction*p.depth/2);
    const obstacles=rects.filter(r=>Math.abs(r.z-z)<(r.depth+p.depth)/2+.22).sort((a,b)=>a.x-b.x);
    let left=range.left;
    while(left+p.width<=range.right+1e-6&&out.length<limit) {
      const site={version:1,district:district.id,x:round(left+p.width/2),z,width:p.width,depth:p.depth,yaw:district.direction<0?Math.PI:0};
      const hit=obstacles.find(r=>parcelsOverlap(site,r));
      if(hit){left=Math.max(left+.001,round(hit.x+hit.width/2+.24));continue;}
      out.push(site);left=round(left+p.width+.24);
    }
  }
  return out;
}

/** Geographic sites are opt-in for new GPT plans. Version-1 replay keeps its old allocator. */
export function mappedCandidates(city,key) {
  const p=parcelProfile(key),site=p&&mappedSite(key,p.width,p.depth);
  return site&&parcelAvailable(site,city.buildings||[])?[site]:[];
}

/** Block legacy placements whose full model could intersect a new parcel; no old plan is moved. */
export function parcelCells(site) {
  const cells=[];
  for(let x=Math.ceil((site.x-site.width/2-2.17)/4);x<=Math.floor((site.x+site.width/2+2.17)/4);x++)
    for(let y=Math.ceil((site.z-site.depth/2-1.82)/4);y<=Math.floor((site.z+site.depth/2+1.82)/4);y++)cells.push({x,y});
  return cells;
}
