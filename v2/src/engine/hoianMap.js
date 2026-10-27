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
