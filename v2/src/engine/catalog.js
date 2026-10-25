/**
 * catalog.js — eras (chapters) and blueprints of the diary city. Pure data, no logic.
 *
 * Legacy buildings occupy one plot; versioned GPT plans may reserve a larger parcel.
 * Historical brick plans add one category-coloured band per completed session. New minute plans
 * use exact completed-focus work; the city reducer owns both replay contracts.
 * `size` is how many bricks it takes (4 · 8 · 12). `shape` drives the 3D massing; `roof` belongs to
 * the ERA, so a district keeps the look of the chapter it was built in (tree rings, plan §Era).
 */

export const ERA_BRICKS = 70; // ~2–3 weeks of steady use opens the next chapter

export const ERAS = Object.freeze([
  { n: 1, name: 'Làng Đá', blurb: 'Lều đá, mái tranh hình nón.', roof: 'cone',
    wall: '#b9a58a', roofColor: '#8a6a3c', ground: '#9fb07a' },
  { n: 2, name: 'Thành Bùn', blurb: 'Gạch bùn phơi nắng, mái bằng.', roof: 'flat',
    wall: '#d2b48c', roofColor: '#b08d5f', ground: '#d8c391' },
  { n: 3, name: 'Phố Gỗ', blurb: 'Khung gỗ, mái cong đầu đao.', roof: 'curved',
    wall: '#a8754a', roofColor: '#4a5a52', ground: '#8fae7e' },
  { n: 4, name: 'Thành Đá', blurb: 'Tường đá dày, đỉnh răng cưa.', roof: 'crenel',
    wall: '#9b9890', roofColor: '#6d6a63', ground: '#86a374' },
  { n: 5, name: 'Phố Hội', blurb: 'Tường vàng, ngói âm dương.', roof: 'gable',
    wall: '#e3c26b', roofColor: '#9c4a2f', ground: '#93b07c' },
  { n: 6, name: 'Phục Hưng', blurb: 'Vòm tròn trên nhà thờ, quảng trường.', roof: 'dome',
    wall: '#e6d3b3', roofColor: '#b4643c', ground: '#a4b07e' },
  { n: 7, name: 'Phố Gạch Đỏ', blurb: 'Xưởng gạch, ống khói.', roof: 'chimney',
    wall: '#a4513a', roofColor: '#4d4440', ground: '#7f9370' },
  { n: 8, name: 'Đại Lộ', blurb: 'Mái mansard xám, ban công sắt.', roof: 'mansard',
    wall: '#e9e1cf', roofColor: '#5b6470', ground: '#90a67f' },
  { n: 9, name: 'Thành Phố Kính', blurb: 'Tháp kính, mái bằng có ăng-ten.', roof: 'antenna',
    wall: '#9fb6c8', roofColor: '#56636e', ground: '#8a9a8c' },
  { n: 10, name: 'Thành Phố Xanh', blurb: 'Tháp phủ cây, vườn trên mái.', roof: 'garden',
    wall: '#e8ece4', roofColor: '#5f9a55', ground: '#8db37a' },
]);

/** Era after the last one keeps the last style but its number keeps counting. */
export function eraStyle(n) {
  return ERAS[Math.min(ERAS.length, Math.max(1, n)) - 1];
}

const SHAPES = Object.freeze({
  house: { w: 1.1, d: 1.1, taper: 0 },
  hall: { w: 1.9, d: 1.3, taper: 0 },
  market: { w: 2.0, d: 1.8, taper: 0 },
  tower: { w: 0.9, d: 0.9, taper: 0 },
  temple: { w: 2.0, d: 2.0, taper: 0.11 }, // each storey steps in: a ziggurat / pagoda read
});

export function shapeOf(key) {
  return SHAPES[key] ?? SHAPES.house;
}

/** Blueprint names change with the era; sizes and shapes are a shared grammar. */
const NAMES = {
  1: ['Lều đá', 'Nhà dài', 'Bãi chợ', 'Tháp canh', 'Vòng đá thiêng'],
  2: ['Nhà gạch bùn', 'Kho lúa', 'Chợ phiên', 'Tháp nước', 'Đền bậc thang'],
  3: ['Nhà gỗ', 'Học đường', 'Chợ gỗ', 'Lầu canh', 'Chùa'],
  4: ['Nhà phố đá', 'Hội quán', 'Chợ đá', 'Tháp chuông', 'Lâu đài'],
  5: ['Nhà ống', 'Hội quán', 'Chợ Hội', 'Lầu chuông', 'Chùa Cầu'],
  6: ['Nhà phố', 'Thư viện', 'Quảng trường chợ', 'Tháp đồng hồ', 'Nhà thờ vòm'],
  7: ['Nhà công nhân', 'Nhà máy', 'Ga chợ', 'Ống khói lớn', 'Toà thị chính'],
  8: ['Nhà phố mansard', 'Nhà hát', 'Chợ mái sắt', 'Tháp sắt', 'Khải hoàn môn'],
  9: ['Căn hộ', 'Văn phòng', 'Trung tâm thương mại', 'Cao ốc', 'Bảo tàng'],
  10: ['Nhà xanh', 'Trường xanh', 'Chợ nông sản', 'Tháp vườn', 'Đài thiên văn'],
};

const GRAMMAR = [
  { slot: 0, shape: 'house', size: 4 },
  { slot: 1, shape: 'hall', size: 8 },
  { slot: 2, shape: 'market', size: 8 },
  { slot: 3, shape: 'tower', size: 12 },
  { slot: 4, shape: 'temple', size: 12 },
];

/** Blueprints of one era. Key is stable across versions: `e<era>-<slot>`. */
export function blueprintsOf(eraN) {
  const style = eraStyle(eraN);
  const names = NAMES[style.n];
  return GRAMMAR.map((g) => ({ key: `e${style.n}-${g.slot}`, era: style.n, name: names[g.slot], shape: g.shape, size: g.size }));
}

/** Stable, additive choices. Never rename/rebudget a released key: old plans replay by key. */
export const HOIAN_BLUEPRINTS = Object.freeze([
  { key:'ha-tanky-v1', era:1, name:'Nhà cổ Tấn Ký', shape:'house', size:4, feature:'Nhà gỗ sâu, giếng trời và sân trong.', life:'Nhà ở và không gian buôn bán của gia đình thương nhân.', source:'https://danangfantasticity.com/en/kien-truc/nha-co-tan-ky' },
  { key:'ha-phunghung-v1', era:1, name:'Nhà cổ Phùng Hưng', shape:'house', size:4, feature:'Hai tầng, ban công gỗ rộng và mái ngói.', life:'Nếp nhà thương nhân, sinh hoạt gắn với phố buôn.', source:'https://hoianworldheritage.org.vn/vi/news/Diem-di-tich/Nha-co-Phung-Hung-12.hwh' },
  { key:'ha-phuckien-v1', era:1, name:'Hội quán Phúc Kiến', shape:'hall', size:8, feature:'Cổng tam quan, sân trước, chính điện và mái trang trí.', life:'Không gian tín ngưỡng và sinh hoạt cộng đồng.', source:'https://danangfantasticity.com/hoi-quan-phuc-kien' },
  { key:'ha-chuacau-v1', era:1, name:'Chùa Cầu', shape:'temple', size:12, feature:'Cầu có mái, mặt gỗ, trụ đá và gian thờ bên cầu.', life:'Lối qua lại và nơi thờ Bắc Đế Trấn Vũ; có tượng khỉ và chó ở hai đầu cầu.', source:'https://danangfantasticity.com/en/kien-truc/chua-cau' },
  { key:'ha-cho-v1', era:1, name:'Chợ Hội An', shape:'market', size:8, feature:'Dãy chợ mái ngói, quầy hàng và khu ăn uống.', life:'Mua bán thực phẩm, ăn cao lầu và các món địa phương.', source:'https://www.hoianworldheritage.org.vn/vi/news/am-thuc/cac-dia-chi-thuong-thuc-cao-lau-hoi-an-ngon-2332.hwh' },
  { key:'ha-thanhha-v1', era:1, name:'Xưởng gốm Thanh Hà', shape:'market', size:8, feature:'Bàn xoay, sân phơi gốm và khu lò nung.', life:'Chuốt gốm, phụ bàn xoay và trưng bày sản phẩm.', source:'https://hoianworldheritage.org.vn/vi/news/Du-lich-Hoi-An/ve-mien-co-tich-gom-thanh-ha-2767.hwh' },
  { key:'ha-kimbong-v1', era:1, name:'Xưởng mộc Kim Bồng', shape:'hall', size:8, feature:'Xưởng mở, bàn thợ, khung gỗ và chi tiết ghe.', life:'Chạm khắc, chế tác mộc và đóng, sửa ghe thuyền.', source:'https://www.hoianworldheritage.org.vn/vi/news/Thong-bao/thong-tin-khai-truong-hoat-dong-huong-dan-tham-quan-tai-lang-moc-kim-bong-2679.hwh' },
  {key:'ha-quangtrieu-v1',era:1,name:'Hội quán Quảng Triệu',shape:'hall',size:8,feature:'Cổng đá, sân trước, hai dãy nhà bên và chính điện.',life:'Không gian tín ngưỡng và gặp gỡ của cộng đồng người Hoa gốc Quảng Đông.',source:'https://hoianheritage.net/uploads/download/hq-05-hoi-quan-quang-dong.pdf'},
  {key:'ha-quancong-v1',era:1,name:'Quan Công Miếu',shape:'temple',size:12,feature:'Cổng đỏ, các nếp nhà nối theo trục và sân trong.',life:'Di tích số 24 Trần Phú, nơi sinh hoạt tín ngưỡng và lễ vía Quan Công.',source:'https://hoianheritage.danang.gov.vn/vi/trao-doi-chuyen-nganh/chuyen-de-nghien-cuu-trao-doi/le-via-quan-cong-o-hoi-an-1153.html'},
  {key:'ha-campho-v1',era:1,name:'Đình Cẩm Phô',shape:'hall',size:8,feature:'Phương đình bốn mái, nhà Đông, nhà Tây và chính điện.',life:'Không gian sinh hoạt văn hoá và lễ hội của cộng đồng Cẩm Phô.',source:'https://hoianheritage.danang.gov.vn/vi/di-san-van-hoa/Dinh/dinh-cam-pho-so-52-duong-nguyen-thi-minh-khai-phuong-cam-pho-224.html'},
].map(Object.freeze));
export const heritageOf = key => HOIAN_BLUEPRINTS.find(bp=>bp.key===key) ?? null;

export function blueprint(key) {
  const heritage=heritageOf(key);
  if(heritage)return heritage;
  const m = /^e(\d+)-(\d)$/.exec(String(key));
  if (!m) return null;
  const era = Number(m[1]);
  if (era < 1 || era > ERAS.length) return null;
  return blueprintsOf(era)[Number(m[2])] ?? null;
}
