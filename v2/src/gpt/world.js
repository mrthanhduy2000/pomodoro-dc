/** One Hoi An world, using a dated public-map snapshot and the shared architectural kits. */
import { hash01 } from '../engine/city.js';
import { blueprint } from '../engine/catalog.js';
import { parcelProfile, parcelsOverlap } from '../engine/parcels.js';
import { HOIAN_MAP, MAP_ROADS, mappedSite } from '../engine/hoianMap.js';
export { HOIAN_MAP, MAP_ROADS };
export const DISTRICTS=Object.freeze([
  {id:'oldtown',name:'Phố cổ',x:48,z:-7,span:100,note:'30 đoạn đường và 8 địa danh có điểm tham chiếu từ bản đồ; hình dáng nhà và bờ nước còn cách điệu.',source:'https://www.hoianworldheritage.org.vn/vi/maps.hwh'},
  {id:'thanhha',name:'Thanh Hà',x:-57,z:3,span:20,pending:true,note:'Đang chờ khảo sát vị trí và tuyến đường trước khi đưa lên bản đồ chính.',source:'https://hoianworldheritage.org.vn/vi/news/Du-lich-Hoi-An/ve-mien-co-tich-gom-thanh-ha-2767.hwh'},
  {id:'kimbong',name:'Kim Bồng · Cẩm Kim',x:-6,z:31,span:22,pending:true,note:'Đang chờ khảo sát vị trí xưởng, bến và đường làng.',source:'https://www.hoianworldheritage.org.vn/vi/news/Thong-bao/thong-tin-khai-truong-hoat-dong-huong-dan-tham-quan-tai-lang-moc-kim-bong-2679.hwh'},
  {id:'camthanh',name:'Cẩm Thanh',x:59,z:16,span:26,pending:true,note:'Đang chờ khảo sát các nhánh sông và khu dân cư.',source:'https://danangfantasticity.com/en/rung-dua-bay-mau'},
]);

// Dated facade references, attached to approximate context envelopes only; never command sites.
export const TANKY_NEIGHBOURS=Object.freeze([
  Object.freeze({id:595299312,label:'103 · cửa chớp xanh',style:'recessed',width:1.20,x:35.484,z:16.823,date:'12/2021',source:'https://www.google.com/maps/@?api=1&map_action=pano&pano=C--UD1xXeg-VGFv8JvtU5Q&heading=180'}),
  Object.freeze({id:631066781,label:'99–99A · nhà ban công',style:'balcony',width:1.95,x:41.412,z:16.865,date:'9/2023',source:'https://www.google.com/maps/place/H%C3%A0+Gia+-+Kimono+and+Pyjama+Specialist/@15.8764595,108.3278388,17z/data=!4m6!3m5!1s0x31420fc701f05871:0x54566ff273cfa895!8m2!3d15.8764595!4d108.3278388!16s%2Fg%2F11twrk64yw'}),
]);

export function futureCity(city) {
  const models=HOIAN_MAP.landmarks.map((reference,i)=>{
    const bp=blueprint(reference.key),profile=parcelProfile(bp.key),site=mappedSite(bp.key,profile.width,profile.depth);
    return {planId:`future-landmark-${i}`,key:bp.key,name:bp.name,shape:bp.shape,site,
      plot:{x:site.x/4,y:site.z/4},world:{sx:bp.key==='ha-chuacau-v1'?1:site.width/3.8,sy:1,sz:bp.key==='ha-chuacau-v1'?1:site.depth/3.2,yaw:site.yaw,district:'oldtown'},
      reference,riverBridge:bp.key==='ha-chuacau-v1',size:bp.size,workUnit:'minutes',targetMinutes:bp.size*25,workMs:bp.size*25*60000,bricks:[]};
  });
  // Only the street axes are mapped. Infill houses are explicitly illustrative, never surveyed homes.
  const reserved=models.map(b=>b.site),roads=MAP_ROADS.filter(r=>['Trần Phú','Nguyễn Thái Học','Phan Châu Trinh','Nguyễn Thị Minh Khai'].includes(r.name));
  const candidates=[];
  for(const road of roads)for(let j=1;j<road.points.length;j++) {
    const a=road.points[j-1],b=road.points[j],length=Math.hypot(b.x-a.x,b.z-a.z);
    for(let d=3;d<length;d+=4.3)for(const side of [-1,1]) {
      const nx=-(b.z-a.z)/length,nz=(b.x-a.x)/length,x=a.x+(b.x-a.x)*d/length+nx*side*3.1,z=a.z+(b.z-a.z)*d/length+nz*side*3.1;
      candidates.push({x,z,nx,nz,side});
    }
  }
  candidates.sort((a,b)=>hash01(`${a.x}:${a.z}`)-hash01(`${b.x}:${b.z}`));
  for(const {x,z,nx,nz,side} of candidates) {
      if(models.length>=48)break;
      const site={x,z,width:3.3,depth:3.5};
      if(reserved.some(other=>parcelsOverlap(site,other,.35)))continue;
      const i=models.length;reserved.push(site);
      models.push({planId:`future-street-${i}`,shape:'house',name:'Nhà nền minh hoạ',illustrative:true,
        plot:{x:x/4,y:z/4},world:{sx:.88+(i%3)*.06,sy:.85+(i%3)*.1,sz:1+(i%4)*.12,yaw:Math.atan2(-nx*side,-nz*side),district:'oldtown'},
        size:4,workUnit:'minutes',targetMinutes:100,workMs:6000000,bricks:[]});
  }
  return {...city,futurePlan:true,geoPlan:true,presentationSample:true,buildings:models,candidates:[],pile:[],residents:[],lanterns:[],statues:[],bricks:[],current:null,queued:[],totalBricks:0};
}

/** Display references and earned facts in one world; never feed illustration records to commands. */
export function regionalCity(city,preview=true) {
  const study=futureCity(city);
  const earnedKeys=new Set(city.buildings.filter(b=>b.site?.version===2).map(b=>b.key));
  const references=preview?study.buildings.filter(b=>!earnedKeys.has(b.key)):[];
  return {...study,buildings:[...city.buildings,...references],candidates:city.candidates,
    current:city.current,queued:city.queued,totalBricks:city.totalBricks,presentationSample:preview};
}
