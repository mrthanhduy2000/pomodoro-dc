/** Versioned public map snapshot. Positions are mapped references, not cadastral boundaries. */
import data from './hoian-map.json' with { type: 'json' };

function freeze(value) {
  if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze);}
  return value;
}
export const HOIAN_MAP=freeze(data);
export function mapPoint(lat,lon) {
  const [originLat,originLon]=data.origin;
  return {x:Math.round((lon-originLon)*111320*Math.cos(originLat*Math.PI/180)/data.metresPerUnit*1000)/1000,
    z:Math.round((originLat-lat)*111320/data.metresPerUnit*1000)/1000};
}
export const MAP_ROADS=freeze(data.roads.map(road=>({...road,name:road.name.replace(/^Đường /,''),points:road.points.map(([lat,lon])=>mapPoint(lat,lon))})));
export function mapReference(key) {return data.landmarks.find(item=>item.key===key)||null;}

/** Layout offsets fit the illustrative model behind point markers; never claim surveyed footprints. */
export function mappedSite(key,width,depth) {
  const reference=mapReference(key);if(!reference)return null;
  const point=mapPoint(reference.lat,reference.lon);
  if(key==='ha-phuckien-v1')point.z-=depth/2;
  const yaw=key==='ha-tanky-v1'?Math.PI:0;
  return {version:2,mapVersion:data.version,district:'oldtown',reference:key,...point,width,depth,yaw};
}

/** Display widths are interpreted; source sidewalk/surface tags are retained separately. */
export function mappedStreetProfile(road) {
  const bridge=road.name==='Cầu An Hội';
  const width=bridge?1.3:road.highway==='secondary'?1.15:1.05;
  const sidewalk=bridge ? .10 : road.sidewalk==='no' ? .12 : .22;
  return {width,sidewalk,halfWidth:width/2+sidewalk,raised:!bridge&&road.sidewalk!=='no'};
}
export const MAP_STREET_SEGMENTS=freeze(MAP_ROADS.flatMap(road=>road.points.slice(1).map((b,i)=>{
  const a=road.points[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
  return {a,b,dx,dz,length,roadId:road.id,...mappedStreetProfile(road)};
})).filter(s=>s.length>.02));

/** Conservative segment/rotated-envelope clearance, including sidewalk and end corners. */
export function streetIntersectsEnvelope(box,margin=.04,segments=MAP_STREET_SEGMENTS) {
  const cos=Math.cos(box.yaw||0),sin=Math.sin(box.yaw||0);
  return segments.some(s=>{
    const radius=s.halfWidth+margin,hx=box.width/2+radius,hz=box.depth/2+radius;
    const ax=cos*(s.a.x-box.x)-sin*(s.a.z-box.z),az=sin*(s.a.x-box.x)+cos*(s.a.z-box.z);
    const dx=cos*s.dx-sin*s.dz,dz=sin*s.dx+cos*s.dz;
    let lo=0,hi=1;
    for(const [a,d,h] of [[ax,dx,hx],[az,dz,hz]]) {
      if(Math.abs(d)<1e-10){if(Math.abs(a)>h)return false;continue;}
      const u=(-h-a)/d,v=(h-a)/d;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));
      if(lo>hi)return false;
    }
    return true;
  });
}

/** Shrink only display geometry about its immutable anchor; never edit a saved site/plot. */
export function streetEnvelopeFit(box,anchor=box) {
  const fit={x:1,z:1};
  const at=()=>({...box,x:anchor.x+(box.x-anchor.x)*fit.x,z:anchor.z+(box.z-anchor.z)*fit.z,
    width:box.width*fit.x,depth:box.depth*fit.z});
  for(const segment of MAP_STREET_SEGMENTS) {
    if(!streetIntersectsEnvelope(at(),.04,[segment]))continue;
    const preferred=Math.abs(segment.dx)>Math.abs(segment.dz)?'z':'x';
    for(const axis of [preferred,preferred==='x'?'z':'x']) {
      const before=fit[axis];fit[axis]=0;
      if(streetIntersectsEnvelope(at(),.04,[segment])){fit[axis]=before;continue;}
      let lo=0,hi=before;
      for(let i=0;i<18;i++){fit[axis]=(lo+hi)/2;if(streetIntersectsEnvelope(at(),.04,[segment]))hi=fit[axis];else lo=fit[axis];}
      fit[axis]=lo;break;
    }
    if(streetIntersectsEnvelope(at(),.04,[segment]))return {x:0,z:0};
  }
  return fit;
}
