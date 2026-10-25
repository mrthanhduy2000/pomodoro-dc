/** Authored, read-only regional study. Relative geography, never a surveyed map or earned city. */
import { blueprint } from '../engine/catalog.js';
export const DISTRICTS=Object.freeze([
  {id:'oldtown',name:'Phố cổ',x:1,z:-3,span:44,note:'Trục Trần Phú, Nguyễn Thái Học, Bạch Đằng và lạch Chùa Cầu.',source:'https://hoianworldheritage.org.vn/en/maps.hwh'},
  {id:'thanhha',name:'Thanh Hà',x:-57,z:3,span:20,note:'Khu làng nghề gốm về phía tây phố cổ, gắn với đường sông.',source:'https://hoianworldheritage.org.vn/vi/news/Du-lich-Hoi-An/ve-mien-co-tich-gom-thanh-ha-2767.hwh'},
  {id:'kimbong',name:'Kim Bồng · Cẩm Kim',x:-6,z:31,span:22,note:'Không gian làng mộc phía bên kia sông, gồm xưởng mộc, sân và bến ghe.',source:'https://www.hoianworldheritage.org.vn/vi/news/Thong-bao/thong-tin-khai-truong-hoat-dong-huong-dan-tham-quan-tai-lang-moc-kim-bong-2679.hwh'},
  {id:'camthanh',name:'Cẩm Thanh',x:59,z:16,span:26,note:'Vùng dừa nước và các nhánh sông về phía cửa biển.',source:'https://danangfantasticity.com/en/rung-dua-bay-mau'},
]);

const LANDMARKS=[
  ['ha-chuacau-v1',-12,-3,1,1,1,'oldtown'],['ha-phunghung-v1',-18,-6,.9,1,1.7,'oldtown'],
  ['ha-quangtrieu-v1',-6.2,-7,1.65,1.1,2.1,'oldtown'],['ha-campho-v1',-27,-14,2,1.1,2.4,'oldtown'],
  ['ha-tanky-v1',1,5,.85,1,2.5,'oldtown'],['ha-phuckien-v1',10,-7,1.9,1.2,2.4,'oldtown'],
  ['ha-quancong-v1',19,-7,1.8,1.15,2.35,'oldtown'],['ha-cho-v1',27,4,2.2,1,2.4,'oldtown'],
  ['ha-thanhha-v1',-59,2,1.9,1,2.2,'thanhha'],['ha-kimbong-v1',-6,30,2.2,1,2.2,'kimbong'],
];
export function futureCity(city) {
  const models=LANDMARKS.map(([key,x,z,sx,sy,sz,district],i)=>{
    const bp=blueprint(key);
    return {planId:`future-landmark-${i}`,key,name:bp.name,shape:bp.shape,plot:{x:x/4,y:z/4},world:{sx,sy,sz,yaw:0,district},riverBridge:key==='ha-chuacau-v1',size:bp.size,workUnit:'minutes',targetMinutes:bp.size*25,workMs:bp.size*25*60000,bricks:[]};
  });
  const addHouse=(x,z,i,district,sx=1,sz=1)=>models.push({planId:`future-street-${i}`,shape:'house',name:district==='oldtown'?'Nhà phố và sân trong':'Nhà và sân làng nghề',plot:{x:x/4,y:z/4},world:{sx,sy:.85+(i%3)*.1,sz,yaw:0,district},size:4,workUnit:'minutes',targetMinutes:100,workMs:6000000,bricks:[]});
  let n=0;
  for(const x of [-27,-23.5,-20,-16.5,-6,-2.5,1,4.5,8,11.5,15,18.5,22,25.5,29,32.5])addHouse(x,-16,n++,'oldtown',1.05+(n%3)*.09,1.4+(n%2)*.45);
  for(const x of [-27,-23.5,-20,-16.5,-7,-3.5,5,8.5,12,15.5,19,22.5,32])addHouse(x,2,n++,'oldtown',1.05+(n%3)*.08,1.3+(n%2)*.4);
  for(const [x,z,district] of [[-66,1,'thanhha'],[-53,1,'thanhha'],[-63,-5,'thanhha'],[-54,8,'thanhha'],[-14,30,'kimbong'],[2,30,'kimbong'],[-10,37,'kimbong'],[54,0,'camthanh'],[62,0,'camthanh']])addHouse(x,z,n++,district,1,1.8);
  return {...city,futurePlan:true,presentationSample:true,buildings:models,candidates:[],pile:[],residents:[],lanterns:[],statues:[],bricks:[],current:null,queued:[],totalBricks:0};
}
