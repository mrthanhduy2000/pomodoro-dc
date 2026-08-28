/**
 * sceneGraph.js — dựng cảnh 3D từ bố cục trừu tượng mà `computeCityLayout` trả về.
 *
 * Bốn luật hiệu năng, đều là chỗ dễ mất nhiều nhất:
 *   1. **Nền và đường mỗi thứ MỘT tấm lưới liền** (`terrainMesh.js`) — 1 lệnh vẽ mỗi tấm. Tới
 *      Phase 8B chúng là `InstancedMesh` 144 ô hộp, cũng 1 lệnh vẽ; đổi vì HÌNH HỌC chứ không vì
 *      hiệu năng (hộp không dốc được ⇒ đồi luôn ra bậc thang).
 *   2. **Toàn bộ công trình gộp thành MỘT khối hình học** (`geometryFactory.js`). ~750 khối nhỏ
 *      vẫn chỉ là 1 lệnh vẽ. Đây là thứ cho phép mỗi công trình có hình dáng riêng mà không phải
 *      trả giá bằng lệnh vẽ — nếu không thì "75 công trình khác nhau" đồng nghĩa với 75 lệnh vẽ.
 *   3. **Một material duy nhất cho công trình.** Màu đi qua thuộc tính màu ĐỈNH (`vertexColors`),
 *      không qua material. Nền/đường dùng material riêng vì chúng lấy màu qua `setColorAt`.
 *      ⚠️ Đã kiểm mã nguồn three 0.185.1: `WebGLProgram` định nghĩa `USE_COLOR` khi
 *      `vertexColors || instancingColor` — nên `setColorAt` chạy được mà KHÔNG cần bật
 *      `vertexColors`, còn khối gộp thì BẮT BUỘC phải bật.
 *   4. **Bóng đổ KHÔNG tự cập nhật** (`shadow.autoUpdate = false`). Mặc định của three là `true`,
 *      tức là vẽ lại toàn bộ shadow map MỖI khung hình — nó âm thầm phá vỡ render-on-demand vì
 *      khung hình nào cũng trở nên đắt như khung đầu tiên.
 */

import {
  AmbientLight,
  BackSide,
  BufferAttribute,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  FogExp2,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PCFSoftShadowMap,
  PMREMGenerator,
  PointLight,
  Quaternion,
  Scene,
  SphereGeometry,
  Vector3,
} from 'three';

import { materialProfile } from '../../../engine/city3d/materials';
import { applySurfaceDetail, specularGainFor } from './surfaceDetail';
import { getEraStyle } from '../../../engine/city3d/eraStyle';
import { collectCitySpecs, KIND_NGOAI_LUOI, NHOM_CUA_KIND } from '../../../engine/city3d/cityParts';
import { BUILDING_SCALE, prism, specSpan } from '../../../engine/city3d/parts';
import { buildTerrain } from '../../../engine/city3d/terrain';
import { buildHorizon } from '../../../engine/city3d/horizon';
import { placeBounds, specBounds } from '../../../engine/city3d/pick';
import { buildResidents, residentAt } from '../../../engine/city3d/residents';
import { buildHumanBody, buildHumanBodyLowDetail } from '../../../engine/city3d/human';
import { buildHumanShapeGeometry } from './humanGeometry';
import { poseAt } from '../../../engine/city3d/humanPose';
import { fogDensityFor, sunDirectionAt } from '../../../engine/city3d/daylight';
import { buildMergedGeometry } from './geometryFactory';
import {
  ROAD_LIFT, buildHorizonSurface, buildRoadSurface, buildTerrainSurface, buildWaterSurface,
} from './terrainMesh';

/** Một ô lưới = 1 đơn vị thế giới. Giữ số tròn để mọi phép tính đọc được bằng mắt. */
export const TILE_UNIT = 1;

/**
 * Bề mặt KHUẾCH TÁN hưởng bao nhiêu phần ánh sáng từ bản đồ môi trường.
 *
 * ⚠️ VÌ SAO KHÔNG PHẢI 1,0 (giá trị "đúng vật lý"): bản đồ môi trường là một nguồn sáng bao quanh,
 * và nguồn sáng bao quanh thì rọi gần như ĐỀU vào mọi mặt — tức là nó làm đúng cái việc mà Phase 3C
 * đã tốn công triệt tiêu: kéo mặt khuất sáng lên ngang mặt hứng nắng, giết chiaroscuro.
 *
 * ⚠️ CHỌN 0,12 BẰNG PHÉP ĐO, KHÔNG BẰNG CẢM GIÁC. Đo trên kỷ 5 và kỷ 12, dải giữa của ảnh chụp
 * thật (độ sáng tb · độ tươi tb · khoảng cách sáng–tối P90−P10, thang 100):
 *
 *     nền cũ (Lambert)   33,7 · 21,2 · 39      ← mốc phải giữ
 *     ENV = 0            32,4 · 24,5 · 43      ← PBR không môi trường: đậm hơn cả nền cũ
 *     ENV = 0,12         35,3 · 20,3 · 38      ← chọn cái này
 *     ENV = 0,20         37,0 · 18,1 · 36
 *     ENV = 1,00         51,3 · 14,4 · 29      ← sáng +52%, tươi −32%, chiaroscuro −26%
 *
 * Cột 1,00 chính là thứ đã lỡ chạy suốt nửa buổi vì `envMapIntensity` không được nối (xem chú thích
 * ở chỗ dựng `envMap`), và nó cho ra đúng một thành phố "pastel như sữa" — thất bại mà dự án đã
 * từng từ chối một lần khi thử tone mapping AgX.
 * ⇒ Việc của bản đồ môi trường ở đây là làm cho VẬT LIỆU KHÁC NHAU, không phải để thắp sáng lại
 * thành phố. Kim loại/kính KHÔNG dùng số này — chúng sống bằng phản chiếu nên lấy trọn 1,0; xem
 * chỗ dựng vật liệu công trình.
 */
const ENV_DIFFUSE = 0.12;

/**
 * ĐĨA MẶT TRỜI nướng vào bản đồ môi trường (Phase 9C). Ba con số, mỗi con một việc.
 *
 * `SUN_DISC_ANGLE` — bán kính GÓC (radian). Mặt trời thật chỉ 0,0047 rad (0,27°), nhưng ở đây có
 * hai lý do phải to hơn: (a) `pmrem.fromScene(scene, 0.06)` làm mờ sẵn cả cảnh với sigma 0,06 rad
 * ≈ 3,4°, nên một cái đĩa nhỏ hơn thế sẽ bị chính phép mờ ấy xoá gần hết; (b) đây là một thành phố
 * vẽ kiểu tranh, không phải ảnh chụp — một điểm loé to bằng đầu kim đọc ra như hạt nhiễu, còn một
 * vệt loé mềm đọc ra như nắng.
 *
 * `SUN_DISC_DISTANCE` — đặt đĩa ở đâu trong quả cầu thăm dò bán kính 8. Phải NHỎ HƠN 8 để nằm bên
 * trong (nếu không nó ra ngoài vỏ cầu và không camera nào của PMREM thấy được).
 *
 * `SUN_DISC_RADIANCE` — độ chói, tính theo bội của màu nắng. Đây là con số đã đo, không phải chọn
 * bằng cảm giác; bảng đo nằm ở phần báo cáo Phase 9C. Nhớ: nó nâng ĐỈNH chứ không nâng nền, vì
 * góc khối của đĩa chỉ chiếm 0,14% bầu trời (xem tính toán ở `createSkyEnvironment`).
 */
const SUN_DISC_ANGLE = 0.075;
const SUN_DISC_DISTANCE = 6;
const SUN_DISC_RADIANCE = 30;

/**
 * Sàn độ chói cho đĩa lúc trời tối. `sunEnergy` ban đêm gần 0, mà nhân thẳng vào thì đĩa biến mất
 * hẳn — trong khi ban đêm vẫn có MẶT TRĂNG, và một mái đồng bắt ánh trăng là thứ đêm đang thiếu.
 * ⚠️ Giữ nhỏ: đêm mà loé bằng ban ngày thì mất luôn cảm giác đêm — đúng thứ Phase 3M đã tốn công
 * dựng. Số này được kiểm bằng chính ảnh chụp 22h ở phần nghiệm thu.
 */
const SUN_DISC_NIGHT_FLOOR = 0.16;

/**
 * HẠT VÂN cho từng loại bề mặt (Phase 9C). Xem `surfaceDetail.js` để biết nó làm gì và vì sao.
 *
 * `scale` = số chu kỳ vân trên MỘT Ô LƯỚI, nên nó phải tỉ lệ NGHỊCH với cỡ vật: mặt đất trải 12 ô
 * nên vân thưa vẫn ra vệt loang lớn; một bức tường chỉ rộng ~1,3 ô nên phải dày hơn nhiều mới đọc
 * ra "bề mặt có nhám" thay vì "bức tường bị loang màu".
 *
 * ⚠️ NGƯỠNG "ĐỦ THẤY MÀ CHƯA THÀNH BỘ LỌC NHIỄU" nằm quanh ±10% và nó là một quyết định MỸ THUẬT,
 * không phải một hằng số vật lý: Đàm yêu cầu giữ ngôn ngữ low-poly / cách điệu, không biến thành
 * PBR tả thực. Vặn `strength` lên 0,2 thì mọi mặt phẳng bắt đầu "sôi" và thành phố trông như phủ
 * cát — đã thử và loại.
 */
const GRAIN = {
  ground: { scale: 5, strength: 0.16, roughness: 0.22 },
  road: { scale: 9, strength: 0.18, roughness: 0.26 },
  // Vùng đất xa: vân THƯA và NHẸ. Nó chiếm nửa khung hình và nằm sau màn sương, nên vân dày ở đó
  // vừa tốn vừa phá phối cảnh khí quyển (chi tiết đều tay từ xa tới gần = mất cảm giác chiều sâu).
  outskirts: { scale: 2.2, strength: 0.12, roughness: 0.10 },
  building: { scale: 11, strength: 0.11, roughness: 0.22 },
};

/**
 * Cao độ MẶT TRÊN của đường — nơi bàn chân cư dân chạm vào.
 * ⚠️ NHẬP từ `terrainMesh.js` chứ không viết lại: nơi DỰNG mặt đường mới là nơi biết nó cao bao
 * nhiêu. Hai con số song song thì chỉ cần một lần chỉnh là cả thành phố lún nửa bàn chân xuống
 * mặt đường mà không ai hiểu vì sao.
 */
const ROAD_SURFACE_Y = ROAD_LIFT;
/** Số tam giác của một hộp — dùng để tính ngân sách hiển thị trên HUD. */
/**
 * Số tam giác MỘT khối đóng góp, theo ĐÚNG luật `WebGLRenderer` cộng vào `info.render.triangles`:
 * lấy số chỉ mục (hoặc số đỉnh nếu không có chỉ mục) chia 3, nhân số bản sao nếu là InstancedMesh.
 */
function trianglesOfMesh(mesh) {
  const geometry = mesh.geometry;
  if (!geometry) return 0;
  const count = geometry.index
    ? geometry.index.count
    : (geometry.attributes?.position?.count ?? 0);
  return ((mesh.isInstancedMesh ? mesh.count : 1) * count) / 3;
}

/** Số lệnh vẽ MỘT khối tốn: mỗi nhóm vật liệu là một lệnh riêng. */
function drawCallsOfMesh(mesh) {
  if (!mesh.geometry) return 0;
  return Array.isArray(mesh.material) && mesh.geometry.groups?.length
    ? mesh.geometry.groups.length
    : 1;
}

/**
 * ĐẾM cả cảnh, thay vì DỰ ĐOÁN từ bản mô tả.
 *
 * ⚠️ VÌ SAO PHẢI ĐỔI (Performance Gate 2026-08-17): trước đây hai con số này được TỰ TÍNH bằng một
 * công thức riêng (`buildingTriangles + surfaceTriangles + residents × 24`). Đặt nó cạnh sự thật
 * `renderer.info.render.triangles` lần đầu tiên thì lệch **+44.126 tam giác ở CẢ 15 kỷ** — HUD báo
 * 34.622 trong khi máy thật sự vẽ 78.748, tức **thiếu 56%**. Hằng số 44.126 chính là hai thứ công
 * thức không biết tới: **vòm trời** (960) và **rặng núi chân trời** thêm ở Phase 9A (43.166). Không
 * ai sửa công thức khi thêm chúng, và **không có gì đỏ lên** — đúng hình dạng sai mà chú thích
 * `countTriangles` ở `parts.js` đã tự cảnh báo (Phase 8B) rồi vẫn tái diễn ở một chỗ khác.
 *
 * Bài học: **một ngân sách TỰ TÍNH riêng thì phải được đối chiếu với thực tế, hoặc đừng tự tính.**
 * Ở đây chọn vế thứ hai — duyệt scene graph là một phép ĐO trên chính thứ sẽ được vẽ, nên nó không
 * thể lạc hậu khi ai đó thêm một khối mới. Đã kiểm chứng: phép duyệt này ra **78.748** cho kỷ 7,
 * khớp TỪNG ĐƠN VỊ với `renderer.info.render.triangles` đo trong trình duyệt.
 *
 * ⚠️ Con số này mô tả CẢNH ở trạng thái ổn định. Khung hình nào dựng lại bản đồ bóng sẽ tốn THÊM
 * một lượt vẽ riêng cho các khối đổ bóng (kỷ 7: +7 lệnh vẽ, +25.436 tam giác) — đó là chi phí có
 * thật nhưng KHÔNG thường trực, nên nó không thuộc về đây.
 *
 * ⚠️ VÀ MỘT CON SỐ ĐÚNG VẪN RA KẾT LUẬN SAI, NẾU NÓ TRỘN HAI ĐẠI LƯỢNG (Performance Gate vòng 2).
 * Bản vá ở trên chữa xong "HUD nói dối", rồi ngay lập tức đẻ ra một cái bẫy mới: con số tổng ĐÚNG
 * cho câu hỏi *"GPU vẽ bao nhiêu mỗi khung"*, nhưng nó **SAI** cho câu hỏi *"kỷ nào nặng"* — vì
 * 44.126 tam giác vòm trời + rặng núi là một HẰNG SỐ nằm trong số của cả 15 kỷ. Đọc số tổng thì
 * kết luận là *"15 kỷ đồng đều, chênh 1,16 lần"*; trừ nền ra thì kỷ 11 (37.494) so kỷ 3 (26.168)
 * = **1,43 lần**. Một hằng số cộng vào cả tử lẫn mẫu đã pha loãng 43% khác biệt xuống còn 16% —
 * đúng hình dạng của `TECH_DEBT #22` (trung bình trên vùng quá rộng làm loãng tín hiệu ~10 lần).
 *
 * ⇒ Vì vậy phép đếm này trả về **BA con số**, và việc phân loại đọc **NHÃN GẮN LÚC TẠO KHỐI**
 * (`userData.sceneLayer`), KHÔNG đoán bằng ngưỡng/kích thước/tên màu. Bên DỰNG biết chắc chắn cái
 * nào là trời, cái nào là nhà — nên bên dựng phải nói ra, đúng luật đã trả giá ở `TECH_DEBT #22`.
 */

/** Nhãn nguồn gốc: khối thuộc PHÔNG NỀN (vòm trời + rặng núi chân trời), không phải thành phố. */
export const SCENE_LAYER_BACKDROP = 'backdrop';

/** Gắn nhãn nền cho một khối. Một chỗ duy nhất viết nhãn ⇒ không có hai cách khai. */
function markBackdrop(mesh, name) {
  mesh.userData.sceneLayer = SCENE_LAYER_BACKDROP;
  mesh.name = name;
  return mesh;
}

/** Khối này thuộc lớp nào — ĐỌC nhãn, không suy đoán. Không nhãn ⇒ thành phố. */
function layerOfMesh(mesh) {
  return mesh.userData?.sceneLayer === SCENE_LAYER_BACKDROP ? 'backdrop' : 'city';
}

/**
 * MỘT lượt duyệt, ra cả tam giác lẫn lệnh vẽ, mỗi thứ ba con số: thành phố · nền · tổng.
 * @returns {{triangles:{city:number,backdrop:number,total:number},
 *            drawCalls:{city:number,backdrop:number,total:number}}}
 */
export function measureSceneGeometry(root) {
  const triangles = { city: 0, backdrop: 0, total: 0 };
  const drawCalls = { city: 0, backdrop: 0, total: 0 };
  root.traverse((obj) => {
    if (!obj.isMesh || obj.visible === false) return;
    const lớp = layerOfMesh(obj);
    const t = trianglesOfMesh(obj);
    const c = drawCallsOfMesh(obj);
    triangles[lớp] += t; triangles.total += t;
    drawCalls[lớp] += c; drawCalls.total += c;
  });
  return { triangles, drawCalls };
}

/** Trục đứng, dùng lại cho mọi phép xoay người — tạo mới trong vòng lặp là rác cho bộ dọn. */
const UP = new Vector3(0, 1, 0);

/**
 * Trục quay của MỌI khớp người: trục z cục bộ, tức trục ngang chạy qua hai vai.
 *
 * ⚠️ MỘT TRỤC LÀ ĐỦ, VÀ ĐÓ LÀ MỘT LỰA CHỌN CHỨ KHÔNG PHẢI MỘT GIỚI HẠN. Đi bộ là chuyển động
 * trong mặt phẳng ĐỨNG DỌC theo hướng đi: hông đưa ra trước và ra sau, vai đu ngược lại, thân
 * khom tới. Không có khớp nào của dáng đi cần xoay quanh hai trục kia. Thêm trục thứ hai là thêm
 * một quaternion nhân mỗi bộ phận mỗi khung hình để đổi lấy một thứ không đọc ra được ở 14 điểm
 * ảnh — đúng lý lẽ đã dùng khi từ chối thêm trục nghiêng cho `parts.js`.
 */
const FORWARD_AXIS = new Vector3(0, 0, 1);
/**
 * Trục ĐI TỚI — trục thứ HAI của mỗi khớp, mới từ ADR-057. Xoay quanh nó là dạng chân ra ngoài,
 * khép chân vào, nghiêng thân sang bên. Trước ADR-057 bộ khớp chỉ có một trục và mọi chuyển động
 * NGANG đều bị cấm, vì mô hình thuận không bù lại được chỗ bàn chân (`TECH_DEBT #82`, nay đã đóng).
 */
const TRAVEL_AXIS = new Vector3(1, 0, 0);

/**
 * Hướng mặt trời (đã chuẩn hoá): phương vị 150°, cao 30°.
 *
 * ⚠️ ĐÂY LÀ LỖI LỚN NHẤT MÀ PHASE 3C SỬA, VÀ NÓ KHÔNG HỀ LỘ RA KHI ĐỌC CODE.
 * Bản trước để `(0.78, 0.54, 0.46)` — nghe rất hợp lý, "nắng xiên từ trên cao". Nhưng camera mặc
 * định đứng ở phương vị 45° (`DEFAULT_YAW`), mà hướng đó cũng ở phương vị ~60°: tức là **mặt trời
 * gần như đứng ngay sau lưng người xem** (tích vô hướng với hướng nhìn = −0,98). Đó là kiểu chiếu
 * sáng tệ nhất có thể chọn: đèn flash máy ảnh. Mọi mặt quay về phía ta đều được rọi đều nhau, bóng
 * đổ trốn hết ra sau công trình, và hình khối bẹp dí. Bao nhiêu công dựng dáng nhà ở Phase 3B bị
 * xoá sạch bởi đúng một vector đặt sai — mà nhìn code thì không có gì sai cả.
 *
 * Phương vị 150° đặt mặt trời **vuông góc với hướng nhìn** (tích vô hướng ≈ −0,10) và lệch hẳn
 * sang phải. Hệ quả: mỗi công trình có MỘT mặt hứng nắng và MỘT mặt khuất, bóng đổ rạch chéo qua
 * khung hình thay vì trốn ra sau. Đây chính là kiểu ánh sáng mà tranh Phục Hưng dựng hình bằng nó,
 * và cũng là lý do người chụp ảnh không bao giờ để nắng sau lưng.
 *
 * ⚠️ MỘT NGUỒN SỰ THẬT cho cả đèn lẫn quầng sáng nướng vào vòm trời. Để hai nơi tự đặt hướng riêng
 * thì quầng sáng sẽ nằm một phía còn bóng đổ ngả phía khác — sai kiểu mắt thấy ngay mà đọc code
 * thì không.
 */
const SUN_DIRECTION = new Vector3(0.433, 0.5, -0.75).normalize();

/**
 * Cách RENDERER diễn giải ánh sáng thành điểm ảnh. Gọi ngay sau khi tạo renderer.
 *
 * ⚠️ VÌ SAO ĐÂY LÀ MỘT HÀM RIÊNG VÀ ĐƯỢC XUẤT RA: `scripts/city-preview.mjs` tạo renderer của
 * riêng nó. Để hai nơi tự viết cấu hình riêng thì trang xem thử sẽ dần vẽ ra một thành phố KHÁC
 * với thành phố Đàm nhìn thấy — và một công cụ mắt-soi nói dối còn tệ hơn không có công cụ nào.
 *
 * ⚠️ VÌ SAO TONE MAPPING LÀ THỨ ĐÁNG GIÁ NHẤT TRONG CẢ PHASE NÀY (đúng 2 dòng):
 * Mặc định của three là `NoToneMapping` — mọi giá trị sáng vượt 1,0 bị **CẮT PHẲNG**. Hậu quả:
 * mặt tường hứng nắng và mặt mái hứng nắng cùng biến thành một mảng trắng bệt như nhau, mất sạch
 * sắc độ đúng ở chỗ mắt nhìn vào nhiều nhất. Đó chính là thứ làm một cảnh WebGL trông "rẻ tiền".
 * Tone mapping NÉN dải sáng lại thay vì cắt, nên vùng sáng vẫn còn màu và còn phân biệt được —
 * đúng cái mà người vẽ sơn dầu làm khi họ không có màu nào sáng bằng ánh nắng thật.
 *
 * ⚠️ CHỌN `Neutral`, SAU KHI ĐÃ THỬ CẢ `ACESFilmic` LẪN `AgX` VÀ NHÌN ẢNH CHỤP:
 *   • `ACESFilmic` — chuẩn phim ảnh, nhưng kéo mọi thứ ngả xanh-lạnh. Một cảnh lấy tông đất ấm làm
 *     gốc bị nó rút sạch hơi ấm.
 *   • `AgX` — nén rất đẹp ở vùng sáng, nhưng **bạc màu có chủ đích** (nó vốn sinh ra cho phim, nơi
 *     người ta grade màu lại ở khâu sau). Ảnh chụp thử ra một thành phố pastel như sữa: đúng cái
 *     ngược lại với "tranh Phục Hưng", vốn sống bằng màu đất SÂU và ĐẶC (đất nung, hoàng thổ, son,
 *     lục lam).
 *   • `Neutral` (Khronos PBR Neutral) — nén vùng sáng nhưng GIỮ độ tươi ở vùng giữa. Đây đúng là
 *     thứ cần: sáng thì không cháy, mà màu thì không nhạt.
 *
 * ⚠️ BÀI HỌC KÈM THEO: đổi tone mapping KHÔNG phải một dòng độc lập — nó đổi cách MỌI màu trong
 * bảng màu hiện ra. Đúng lần đổi này đã làm lộ ra một bàn cờ xanh–vàng ở mặt đất mà AgX vốn đang
 * che giúp (xem `groundShades` trong `palette3d.js`).
 */
export function applyPaintedLook(renderer) {
  renderer.toneMapping = NeutralToneMapping;
  // Hơi >1 để bù phần `Neutral` nén ở vùng sáng; cao hơn nữa thì trời bắt đầu bạc.
  renderer.toneMappingExposure = 1.2;

  // ⚠️ BÓNG ĐỔ CẤU HÌNH Ở ĐÂY, KHÔNG PHẢI Ở TỪNG NƠI GỌI (Phase 9B). Ba dòng dưới đây trước kia
  // được chép ở BA chỗ: `CityScene3D.jsx` và HAI khối dựng trong `scripts/city-preview.mjs`. Đúng
  // cái bẫy "một luật ba chỗ phát biểu" mà dự án đã trả giá với `CITY_CAMERA_FOV`.
  //
  // ⚠️ VÀ NÓ ĐÃ CẮN THẬT, Ở CHỖ ĐẮT NHẤT: cỡ bản đồ bóng đổ được viết cứng ở ba nơi với **ba giá
  // trị khác nhau** — app 1024, trang xem thử một-kỷ 1024, còn **bản QUÉT 15 kỷ chỉ 512**. Mà bản
  // quét chính là công cụ mà `CLAUDE.md` bắt buộc dùng để duyệt mỹ thuật (*"sửa mỹ thuật thành phố
  // 3D thì PHẢI QUÉT"*). Nghĩa là mọi nhận xét về bóng đổ rút ra từ bảng quét — suốt nhiều phase —
  // đều đang nói về một thế giới có bóng thô gấp đôi thứ Đàm nhìn thấy. Không có gì đỏ lên: ảnh
  // vẫn dựng ra, chỉ là nó trả lời một câu hỏi khác câu mình đang hỏi.
  // ⇒ Nay CẢ BA đi qua đúng hàm này, và cỡ bóng do chính cảnh tự đặt lúc dựng (xem `createCityScene`).
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  // Đôi với `shadow.autoUpdate = false` ở `createCityScene`: shadow map chỉ vẽ lại khi ta yêu cầu.
  renderer.shadowMap.autoUpdate = false;
}

/**
 * Cỡ bản đồ bóng đổ.
 *
 * ⚠️ MÁY BÀN 4096 (Phase 19). Khung bóng bó sát lưới (`reach = gridSize × 0,80` ⇒ 19,2 đơn vị ngang
 * cho lưới 12), nên mật độ đi 1024 → 53 điểm/đơn vị · 2048 → 107 · **4096 → 213**. Chi tiết nhỏ
 * nhất cần đọc ra bóng là gờ mái và chân tường (Phase 8A) — cỡ ~0,08 đơn vị, tức 4,3 điểm ở 1024
 * (chỉ ra một vệt răng cưa), 8,5 điểm ở 2048, **17 điểm ở 4096**: tới đây mới thật sự là một cái
 * bóng có mép. Đây đúng chỗ Đàm yêu cầu ưu tiên chất lượng hình ảnh và MacBook là máy chính, và
 * `PERFORMANCE.md` đo được máy còn dư 3,2 lần.
 *
 * ⚠️ VÀ ĐÂY LÀ CẦN GẠT DUY NHẤT CÒN LẠI — KHUNG BÓNG THÌ ĐÃ BÓ SÁT RỒI, ĐỪNG SIẾT NỮA. Chỉ thị
 * Phase 19 đề nghị "siết `sun.shadow.camera` từ `reach` xuống phạm vi thành phố"; đo ra thì `reach`
 * ĐÃ LÀ phạm vi thành phố.
 *
 * ⚠️ PHASE 20 ĐÃ NỚI `reach` TỪ 0,75 LÊN 0,80, VÀ ĐÓ LÀ MỘT BẢN VÁ LỖI CHỨ KHÔNG PHẢI MỘT LỰA CHỌN
 * MỸ THUẬT. Bộ xương cũ để cả vành ngoài lưới làm đường (`ROAD_LINES` chứa 0 và 11) nên công trình
 * dừng ở ô 10, và bán kính xa nhất của một khối ĐỔ BÓNG là **8,4836** — vừa vặn dưới `reach` 9,00.
 * Bộ xương sinh theo kỷ nay cho thửa chạm vành ngoài ⇒ đo lại 15 kỷ × 2 mốc tuổi thì bán kính ấy
 * lên **9,2275** (kỷ 13 ở 120 phiên), tức **VƯỢT `reach` cũ 0,23 đơn vị**: nhà ở góc lưới đã bắt
 * đầu bị CỤT BÓNG, và không có gì đỏ lên ngoài `sceneStats.test.js`. `reach` mới = 12 × 0,80 =
 * **9,60**, dư **0,37** (4%). Giá phải trả đã tính: khung rộng thêm 6,7% ⇒ mật độ điểm ảnh bản đồ
 * bóng giảm đúng 6,7% (228 → 213 điểm/đơn vị ở 4096), tức gờ mái vẫn còn 17 điểm — vẫn là một cái
 * bóng có mép. Siết trở lại 0,75 là cắt cụt bóng thật; nới tiếp là tiêu điểm ảnh vào chỗ trống, và
 * `sceneStats.test.js` đỏ ở CẢ HAI chiều.
 *
 * ⚠️ Điện thoại GIỮ 512 — không phải vì tiếc, mà vì bóng ở đó vẽ lại rất hiếm (render-on-demand)
 * và bộ nhớ texture là thứ iOS Safari giết tab vì nó. 4096² × 4 byte = **64 MB** cho MỘT bản đồ —
 * con số ấy chấp nhận được trên bộ nhớ hợp nhất của Mac, KHÔNG chấp nhận được trên iPhone.
 */
// ⚠️ 2048 → 4096 (2026-08-27). Khung bóng phủ 2·reach = 18 đơn vị thế giới, nên 2048 cho ra một
// texel bóng rộng 18/2048 = 0,0088 ô lưới; 4096 hạ xuống 0,0044 — mép bóng nét gấp đôi, và đó là
// thứ mắt đọc ra "khối này ĐANG ĐỨNG trên mặt đất" chứ không phải "khối này được dán lên".
// Cái giá là BỘ NHỚ (16 MB → 64 MB) chứ không phải thời gian mỗi khung: `sun.shadow.autoUpdate`
// đang TẮT nên bản đồ chỉ vẽ lại khi thành phố đổi, còn phép LẤY MẪU mỗi khung không phụ thuộc độ
// phân giải. Điện thoại GIỮ 512 vì lý do ngược lại — ở đó bộ nhớ texture chính là thứ iOS Safari
// giết tab vì nó.
export const SHADOW_MAP_DESKTOP = 4096;
export const SHADOW_MAP_MOBILE = 512;

/**
 * Trần tỉ lệ điểm ảnh. Màn Retina 3x mà vẽ đủ 3x thì tốn gấp 9 lần mà mắt gần như không thấy.
 *
 * ⚠️ ĐỂ Ở ĐÂY, CẠNH CỠ BÓNG ĐỔ, VÌ NÓ CÙNG MỘT LOẠI: cả hai đều trả lời câu "bản dựng này thuộc
 * tầng chất lượng nào". Trước Phase 9C nó nằm riêng trong `CityScene3D.jsx`, còn
 * `scripts/city-preview.mjs` thì viết cứng `setPixelRatio(1)` ở HAI khối dựng — tức **trang xem
 * thử render ở đúng một nửa mật độ điểm ảnh của thứ Đàm nhìn thấy trên MacBook**, và mọi nhận xét
 * mỹ thuật rút ra từ nó (răng cưa, mép khối, chi tiết nhỏ, cây cối) đều đang nói về một bản dựng
 * THẤP HƠN bản thật. Đúng cái bẫy đã cắn với cỡ bóng đổ ở Phase 9B, lặp lại nguyên hình dạng ở một
 * cần gạt khác — nên nó được xử lý y hệt: một hằng số, mọi nơi nhập về.
 */
export const MAX_PIXEL_RATIO = 2;

/**
 * TÊN NHÓM mà cờ đo `tachDeDo` (xem `createCityScene`) cắt được, chia theo KHỐI bị cắt.
 *
 * ⚠️ Hai mảng này là **hợp đồng giữa bên gọi và bên dựng**, và chúng phải nằm ở đây — cạnh mã dựng
 * — chứ không phải chép tay trong công cụ chụp. Bản trước đúng là chép tay: `city-preview.mjs` tự
 * viết `MASK.includes('buildings') || MASK.includes('props') || MASK.includes('landscape')`, tức
 * cùng một luật tồn tại ở hai chỗ, đúng cái bẫy "một luật một công thức". Thêm nhóm `landscape` ở
 * VIỆC 1 đã phải sửa CẢ HAI chỗ; nếu quên chỗ thứ hai thì `--mask landscape` sẽ đo một tấm rỗng và
 * không có gì đỏ lên.
 *
 * Vì sao chia làm hai mảng chứ không một danh sách phẳng: chúng trả lời hai câu khác nhau ở tầng
 * dựng (*"cắt khối gộp thành phố"* · *"cắt tấm mặt đất"*), và mỗi nhát cắt có giá riêng bằng lệnh
 * vẽ. Gộp phẳng thì hỏi `--mask ground-grid` sẽ cắt oan cả thành phố.
 */
export const NHOM_TACH_THANH_PHO = ['buildings', 'props', 'landscape', 'hinterland'];
export const NHOM_TACH_MAT_DAT = ['ground-grid', 'ground-apron'];

/**
 * Hai nhóm nằm NGOÀI lưới 12×12, gom thành một tập có tên vì có nhiều chỗ phải hỏi cùng câu hỏi
 * *"khối này thuộc thành phố hay thuộc thế giới quanh nó?"* — bộ lọc vật cản camera là một, phép
 * đo dấu chân người của cổng (G1) là hai.
 *
 * ⚠️ `landscape` (cây cối) và `hinterland` (ruộng, đê, tường, bến) TÁCH RIÊNG chứ không gộp làm
 * một nhãn, và đó là điều kiện CẦN của cổng (G1): nó đo *"bao nhiêu phần khung hình là DẤU CHÂN
 * NGƯỜI ngoài lưới"*. Gộp chung thì cây cối lọt vào tử số, và con số ấy sẽ nói dối theo đúng cái
 * cách đã làm VIỆC 1 tưởng là mình đã giải xong bài toán quy mô.
 */
export const NGOAI_LUOI = new Set(
  [...KIND_NGOAI_LUOI].map((kind) => NHOM_CUA_KIND[kind]),
);

/** Ô lưới (x, y) → toạ độ thế giới, gốc toạ độ đặt giữa thành phố. */
export function cellToWorld(x, y, gridSize) {
  const half = (gridSize - 1) / 2;
  return { x: (x - half) * TILE_UNIT, z: (y - half) * TILE_UNIT };
}

/**
 * Sơn dải chuyển sắc bầu trời vào MÀU ĐỈNH của một quả cầu.
 *
 * ⚠️ HÀM NÀY CÓ HAI NGƯỜI DÙNG, VÀ ĐÓ CHÍNH LÀ LÝ DO NÓ TỒN TẠI: vòm trời NHÌN THẤY được, và quả
 * cầu thăm dò dùng để nướng bản đồ môi trường (`createSkyEnvironment`). Nếu hai bên tự viết công
 * thức riêng thì thứ phản chiếu trên mặt kính sẽ là một bầu trời KHÁC với bầu trời ở sau lưng nó —
 * đúng loại lỗi "một luật hai công thức" mà dự án đã trả giá nhiều lần, và lần này nó còn khó thấy
 * hơn nữa vì phản chiếu thì mờ, ai nhìn cũng chỉ thấy "hơi sai sai".
 *
 * ⚠️ SỐ MŨ 2,6 QUYẾT ĐỊNH BẦU TRỜI CÓ RA HỒN KHÔNG, và bản trước để SAI HƯỚNG.
 * Camera chúc xuống, nên dải trời lọt vào khung chỉ là phần NGAY TRÊN đường chân trời — tức toàn
 * bộ bầu trời Đàm nhìn thấy nằm gọn trong khoảng t ≈ 0,50–0,67. Với số mũ 1,2 thì ở đó đã pha
 * 43–61% màu xanh đỉnh trời, và kết quả là một mảng oải hương xam xám: mất cả hơi ấm của chân trời
 * lẫn chiều sâu của trời xanh. Số mũ 2,6 dồn màu ấm bám SÁT chân trời (t = 0,5 chỉ pha 16% xanh)
 * rồi mới chuyển nhanh lên xanh.
 *
 * `groundColor` (chỉ quả cầu thăm dò truyền) sơn nửa DƯỚI thành màu đất. Bỏ nó đi thì kim loại và
 * kính sẽ phản chiếu bầu trời ở CẢ mặt hướng xuống — một mái kẽm sáng loá từ bên dưới, thứ không
 * bao giờ xảy ra ngoài đời và đọc ra ngay là "đồ hoạ máy tính".
 */
function paintSkyGradient(geometry, radius, {
  top, horizon, glow, glowStrength, sunDir, groundColor = null,
}) {
  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const tint = new Color();
  const vertex = new Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    const t = Math.max(0, Math.min(1, (pos.getY(i) / radius) * 0.5 + 0.5));
    tint.copy(horizon).lerp(top, Math.pow(t, 2.6));

    // Quầng sáng quanh mặt trời. Trời thật KHÔNG đều màu theo vành đai — nó sáng bừng lên quanh
    // hướng mặt trời rồi tối dần ra xa. Mũ 6 = quầng rộng và mềm chứ không phải một cái đĩa nhỏ:
    // một đĩa sáng rõ nét trông như lỗi, còn quầng khuếch tán thì đọc ra "nắng đến từ phía kia".
    vertex.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
    const toSun = Math.max(0, vertex.dot(sunDir));
    tint.lerp(glow, Math.pow(toSun, 6) * glowStrength);

    if (groundColor && t < 0.5) tint.lerp(groundColor, Math.min(1, (0.5 - t) * 5));

    colors[i * 3] = tint.r;
    colors[i * 3 + 1] = tint.g;
    colors[i * 3 + 2] = tint.b;
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
}

/**
 * Nướng một BẢN ĐỒ MÔI TRƯỜNG bé xíu từ chính bầu trời của cảnh này.
 *
 * ⚠️ ĐÂY KHÔNG PHẢI PHẦN THƯỞNG THÊM — NÓ LÀ ĐIỀU KIỆN CẦN ĐỂ ĐƯỢC KHAI KIM LOẠI.
 * Kim loại gần như không có thành phần khuếch tán: toàn bộ màu của nó đến từ thứ nó phản chiếu.
 * Không có bản đồ môi trường thì `metalness: 0.9` cho ra khối ĐEN THUI — và nó đen một cách rất
 * thuyết phục, trông như "vật liệu tối màu" chứ không như lỗi. Mái kẽm kỷ 9, mái đồng kỷ 11, chóp
 * vàng ở mọi kỷ đều phụ thuộc vào hàm này.
 *
 * ⚠️ RẺ VÌ NHỎ VÀ VÌ CHỈ LÀM MỘT LẦN: quả cầu 16×8 (chỉ để lấy màu chung quanh, không lấy chi
 * tiết) → PMREM ra một cubemap đã làm mờ sẵn theo từng mức nhám. Sau khi nướng xong thì cả quả cầu
 * lẫn cảnh tạm đều bỏ đi; thứ giữ lại là một texture duy nhất.
 *
 * ⚠️ VÀ TỪ PHASE 9C NÓ CÒN CHỨA MỘT ĐĨA MẶT TRỜI — xem `SUN_DISC_ANGLE` bên dưới. Đây là bản vá
 * gốc cho phát hiện lớn nhất của đợt audit: **giữa trưa, KHÔNG một điểm ảnh nào trong khung sáng
 * quá 0,75** (0,00% ở kỷ 3 và kỷ 7). Mắt đọc ra "thật" một phần lớn nhờ điểm loé — nắng bắt trên
 * mép ngói, trên kính, trên đồng. Trước đây môi trường chỉ là một dải trời đều đều, nên mặt bóng
 * chẳng có gì để phản chiếu thành điểm loé, và mọi vật liệu — vàng, kính, kim loại, nước — đều
 * hiện ra như nhựa mờ.
 *
 * @returns {{texture:object, dispose:function}|null} `null` khi không có renderer (test, SSR)
 */
function createSkyEnvironment(renderer, skyLook, groundColor) {
  if (!renderer || typeof renderer.getContext !== 'function') return null;
  let pmrem = null;
  let target = null;
  const probeGeometry = new SphereGeometry(8, 16, 8);
  const probeMaterial = new MeshBasicMaterial({ vertexColors: true, side: BackSide, fog: false });
  const discGeometry = new SphereGeometry(SUN_DISC_DISTANCE * Math.tan(SUN_DISC_ANGLE), 12, 8);
  const discMaterial = new MeshBasicMaterial({ fog: false, toneMapped: false });
  try {
    paintSkyGradient(probeGeometry, 8, { ...skyLook, groundColor });
    const probeScene = new Scene();
    probeScene.add(new Mesh(probeGeometry, probeMaterial));

    /**
     * ⚠️ VÌ SAO ĐĨA NÀY KHÔNG THỂ LÀM NHẠT CẢ THÀNH PHỐ — và đây là điểm khiến nó KHÁC HẲN mọi
     * cách "làm sáng lên" mà Phase 7A đã thử rồi thất bại.
     *
     * Năng lượng một nguồn rót vào bề mặt khuếch tán = độ chói × GÓC KHỐI nó chiếm. Đĩa bán kính
     * góc 4,3° chiếm 0,0177 sr trên tổng 12,57 sr của cả mặt cầu — tức **0,14% bầu trời**. Nhân
     * độ chói 30 vào thì phần cộng thêm cho ánh sáng khuếch tán chỉ khoảng 30 × 0,0177 / π ≈ 0,17,
     * rồi còn bị `ENV_DIFFUSE` (0,12) nhân xuống còn ~0,02 — mắt không thấy được.
     * Nhưng với một mặt NHẴN (kính 0,06 · vàng 0,20 · men 0,22 · kim loại 0,32), thuỳ phản chiếu
     * hẹp hơn cái đĩa, nên nó phản chiếu gần trọn độ chói 30 → một điểm loé thật.
     * ⇒ Đĩa này nâng ĐỈNH mà gần như không nâng TRUNG BÌNH. Đó chính xác là thứ đang thiếu, và về
     * mặt cấu trúc nó KHÔNG THỂ gây ra "pastel như sữa" — thất bại kia đến từ việc nâng nền sáng
     * đều (`envMapIntensity` 1,0 rọi khắp mọi hướng), một việc khác hẳn.
     *
     * ⚠️ CHỈ NƯỚNG VÀO MÔI TRƯỜNG, KHÔNG VẼ LÊN VÒM TRỜI NHÌN THẤY. Vòm trời vẫn dùng đúng quầng
     * sáng mềm cũ (`glow` + mũ 6) — chú thích của `paintSkyGradient` đã ghi rõ vì sao một cái đĩa
     * sắc nét trên vòm trời trông như lỗi. Ở đây thì ngược lại: cái ta cần chính là một nguồn NHỎ
     * và CHÓI để mặt bóng có gì mà bắt.
     *
     * ⚠️ SỐ >1 SỐNG SÓT QUA PMREM. `PMREMGenerator._allocateTargets` dùng `HalfFloatType` và
     * `fromScene` tự đặt `toneMapping = NoToneMapping` trong lúc nướng (đã đọc mã three r185).
     * Nếu một ngày nào đó three đổi sang render target 8-bit thì đĩa sẽ bị kẹp về 1,0 và mọi điểm
     * loé biến mất — im lặng. Bài test `sceneGraphWiring` canh chuyện độ chói phải >1.
     */
    if (skyLook.sunDiscRadiance > 0) {
      discMaterial.color.copy(skyLook.glow).multiplyScalar(skyLook.sunDiscRadiance);
      const disc = new Mesh(discGeometry, discMaterial);
      disc.position.copy(skyLook.sunDir).multiplyScalar(SUN_DISC_DISTANCE);
      probeScene.add(disc);
    }

    pmrem = new PMREMGenerator(renderer);
    target = pmrem.fromScene(probeScene, 0.06);
  } catch (error) {
    // Máy không dựng nổi PMREM (WebGL1 cũ, context lỗi) → chạy tiếp KHÔNG có môi trường. Vật liệu
    // vẫn hiện, chỉ là kim loại sẽ tối. Thà xấu còn hơn màn hình trắng.
    //
    // ⚠️ PHẢI KÊU TO. Bản đầu của hàm này nuốt lỗi im lặng, và hậu quả đúng bằng một buổi đi lạc:
    // môi trường KHÔNG hề được tạo, nhưng cảnh vẫn dựng ra ảnh trông "khá hơn hẳn" (nhờ PBR), nên
    // tôi tin là nó đang chạy. Chỉ khi vặn `ENV_DIFFUSE` lên 3,0 mà ảnh KHÔNG đổi một điểm ảnh nào
    // mới lộ ra. Một đường lui im lặng biến "tính năng hỏng" thành "tính năng vô hình" — và thứ vô
    // hình thì không ai đi sửa. Cùng họ với bài học `--hour` ở `city-preview.mjs`.
    console.warn('[city3d] không nướng được bản đồ môi trường — kim loại sẽ tối:', error);
    target = null;
  } finally {
    pmrem?.dispose();
    probeGeometry.dispose();
    probeMaterial.dispose();
    discGeometry.dispose();
    discMaterial.dispose();
  }
  if (!target) return null;
  return { texture: target.texture, dispose: () => target.dispose() };
}

/**
 * Dựng toàn bộ cảnh.
 *
 * @param {object} input
 * @param {object} input.layout    kết quả `computeCityLayout(...)`
 * @param {object} input.palette   kết quả `buildScenePalette(...)` — các màu ở dạng SỐ
 * @param {boolean} [input.dimmed] thành phố đã niêm phong → làm nhạt cho có vẻ "quá khứ"
 * @param {boolean} [input.lowDetail] máy yếu → bỏ chi tiết trang trí, giữ nguyên hình bóng
 * @param {object}  [input.stats]     `{sessionCount, streakLength}` — suy ra dân số
 * @param {boolean} [input.still]     true → không có cư dân đi lại (giảm chuyển động / bảo tàng)
 * @param {number}  [input.maxLamps] tối đa mấy đèn trong nhà hắt ra sân (chỉ có ban đêm). Điện
 *                                    thoại nên truyền số nhỏ hơn — xem ghi chú ngân sách ở dưới.
 * @param {object}  [input.daylight]  kết quả `deriveDaylight(giờ VN)` — giờ nào trong ngày.
 *                                    Không truyền ⇒ ánh sáng trung tính như trước, mọi chỗ gọi cũ
 *                                    giữ nguyên kết quả.
 * @param {string[]} [input.tachDeDo] CỜ CHỈ-DÙNG-ĐỂ-ĐO — danh sách TÊN NHÓM cần cắt riêng ra để
 *                                    đếm điểm ảnh. Xem luật ngay dưới đây.
 *
 * ⚠️ LUẬT CHO MỌI CỜ CHỈ-DÙNG-ĐỂ-ĐO: **mặc định phải TẮT, và phải có test khoá rằng BẬT nó lên mới
 * đổi số.** Thiếu vế sau thì một cờ hỏng vẫn xanh — ảnh y hệt, tam giác y hệt, chỉ ngân sách lệnh
 * vẽ thủng trong im lặng.
 *
 * ⚠️ **MỘT CỜ, KHÔNG PHẢI BA.** Trước 2026-08-19 đây là hai cờ boolean rời (`splitCityMesh` +
 * `splitGroundMesh`), và VIỆC 1 suýt đẻ ra cái thứ ba cho vùng quê. Đàm đã ra luật từ trước cho
 * đúng tình huống này: *"khi viết cờ thứ ba, viết nó theo đúng khuôn hai cờ hiện có, rồi GOM CẢ BA
 * trong cùng commit ấy"*. Vùng quê hoá ra không cần cờ mới (chỉ cần cắt thêm một nhát ở khối thành
 * phố), nhưng ngưỡng đã chạm ⇒ gom.
 *
 * Vì sao gom được, và vì sao bản gộp KHÔN HƠN chứ không chỉ gọn hơn: hai cờ cũ trả lời hai câu
 * khác nhau (*"có cắt khối thành phố không"* · *"có cắt tấm đất không"*) trong khi người gọi chỉ
 * có MỘT câu hỏi thật — *"tôi cần đếm những nhóm nào?"*. Bên gọi biết tên nhóm mình cần; bên dựng
 * mới là bên biết tên ấy nằm trong khối nào. Bản cũ bắt bên gọi phải tự dịch tên → cờ, và nó đã
 * dịch sai một nhịp: `splitCityMesh: !!MASK` bật cả khi mặt nạ chỉ hỏi mặt đất.
 *
 * Tên hợp lệ: {@link NHOM_TACH_THANH_PHO} (cắt khối gộp thành phố làm ba) ·
 * {@link NHOM_TACH_MAT_DAT} (cắt tấm mặt đất làm hai). Tên lạ bị BỎ QUA — không ném lỗi, vì công
 * cụ mặt nạ truyền thẳng cả danh sách người dùng gõ (`sky`, `road`, `residents`…) và phần lớn tên
 * trong đó vốn đã tách sẵn, không cần cắt gì.
 */
export function createCityScene({
  layout, palette, dimmed = false, lowDetail = false, stats = {}, still = false, daylight = null,
  maxLamps = 3, renderer = null, isMobile = false, tachDeDo = null, ao = true,
}) {
  const nhomCanTach = new Set(Array.isArray(tachDeDo) ? tachDeDo : []);
  const tachThanhPho = NHOM_TACH_THANH_PHO.some((ten) => nhomCanTach.has(ten));
  const tachMatDat = NHOM_TACH_MAT_DAT.some((ten) => nhomCanTach.has(ten));
  const gridSize = layout.gridSize;
  const scene = new Scene();
  scene.background = new Color(palette.background);

  // Hướng nắng THỰC TẾ của cảnh này: phương vị giữ nguyên (đó là thứ Phase 3C đã sửa và không được
  // đụng vào), chỉ cao độ đổi theo giờ — sáng sớm/chiều muộn bóng dài, giữa trưa bóng ngắn.
  const sunDir = daylight
    ? new Vector3().copy(sunDirectionAt(SUN_DIRECTION, daylight.sunAltitude))
    : SUN_DIRECTION.clone();
  const sunEnergy = Number.isFinite(daylight?.sunEnergy) ? daylight.sunEnergy : 1;
  const fillEnergy = Number.isFinite(daylight?.fillEnergy) ? daylight.fillEnergy : 1;

  // Sương mù bắt đầu ngay sau rìa thành phố. Nó không chỉ giấu mép lưới: đây là "phối cảnh không
  // khí" — thủ pháp mà hội hoạ dùng để tạo chiều sâu, vật càng xa càng nhạt và ngả về màu chân
  // trời. Trên màn hình phẳng, đó là tín hiệu chiều sâu rẻ nhất và mạnh nhất.
  // ⚠️ Bắt đầu SAU rìa thành phố. Bản đầu để `gridSize * 1.05` (≈12,6) trong khi camera đứng cách
  // 22 — nghĩa là sương phủ lên gần hết thành phố chứ không phải chỉ phần xa, và ảnh chụp thử ra
  // một màn sương trắng đục. Phối cảnh không khí chỉ đẹp khi nó tác động ở RÌA.
  // Sương phải ĐỦ DÀY ở rìa bãi đất bao quanh (bán kính ~36) để mép của nó tan hẳn vào chân trời;
  // nếu không sẽ thấy một đường cắt thẳng băng giữa đất và trời.
  // ⚠️ ĐỘ DÀY SƯƠNG ĐỔI THEO GIỜ (2026-08-13). Trước đây sương là một hằng số, nên buổi nào cũng
  // trong veo như nhau — và đó chính là thứ đã làm bình minh với hoàng hôn thành một bức ảnh: màu
  // nắng hai buổi buộc phải giống nhau (vật lý), nên nếu sương cũng giống nhau thì không còn gì
  // khác. Sáng sớm là buổi DUY NHẤT có sương đọng; xem giải thích đầy đủ ở `fogDensityFor`.
  //
  // ⚠️ PHASE 9A ĐỔI TỪ `Fog` (tuyến tính) SANG `FogExp2` (luỹ thừa), VÀ ĐÓ LÀ MỘT SỬA CHỮA CHỨ
  // KHÔNG PHẢI MỘT KHẨU VỊ. Sương tuyến tính có một mặt phẳng `far`; qua khỏi nó thì cảnh vật không
  // nhạt đi mà **bị thay bằng đúng một màu**. Đo bằng cách sơn sương màu hồng cánh sen rồi chụp:
  // đỉnh khung hình ra `#e803e6`, tức 95–100% sương nguyên chất — nghĩa là ~25% mỗi tấm ảnh là một
  // mảng phẳng lì MỘT màu, và bất cứ thứ gì đứng ngoài đó đều tàng hình tuyệt đối. Chính vì vậy
  // dòng này phải đổi TRƯỚC khi dựng vùng đất xa bên dưới, nếu không cả dãy núi sẽ là mã chết ngay
  // từ lúc sinh ra (đúng cái bẫy Phase 8D đã sập một lần với cơ chế "lùm cây").
  scene.fog = new FogExp2(
    palette.sky2?.horizon ?? palette.background,
    fogDensityFor(daylight?.haze ?? 0, gridSize),
  );

  // three KHÔNG tự giải phóng bộ nhớ GPU — mọi thứ tạo ra ở đây phải tự dọn trong `dispose`.
  const disposables = [];
  const track = (resource) => { disposables.push(resource); return resource; };
  const meshes = [];
  const addMesh = (mesh) => { if (mesh) { scene.add(mesh); meshes.push(mesh); } return mesh; };

  const skyLook = {
    top: new Color(palette.sky2?.top ?? palette.background),
    horizon: new Color(palette.sky2?.horizon ?? palette.background),
    // Màu quầng sáng quanh mặt trời — lấy thẳng màu nắng cho nhất quán với nguồn sáng thật.
    glow: new Color(palette.lights?.sun ?? palette.sun),
    glowStrength: palette.isDark ? 0.30 : 0.55,
    sunDir,
    // ⚠️ CHỈ `createSkyEnvironment` ĐỌC TRƯỜNG NÀY. `paintSkyGradient` bỏ qua nó, nên vòm trời
    // NHÌN THẤY vẫn giữ nguyên quầng sáng mềm cũ — đúng như chú thích của hàm đó yêu cầu. Hai nơi
    // dùng chung một `skyLook` chính là thứ giữ cho bầu trời phản chiếu trên kính khớp với bầu
    // trời sau lưng nó; thêm một trường mà chỉ một bên đọc thì không phá vỡ điều đó.
    sunDiscRadiance: SUN_DISC_RADIANCE * Math.max(sunEnergy, SUN_DISC_NIGHT_FLOOR),
  };

  // ⚠️ MÔI TRƯỜNG PHẢN CHIẾU — dựng Ở ĐÂY, TRƯỚC MỌI VẬT LIỆU, dù vòm trời nhìn thấy được thì mãi
  // bên dưới mới dựng. Lý do: nó phải có mặt lúc từng vật liệu ra đời để gắn vào (`envMap`), mà nó
  // chỉ cần `skyLook` chứ không cần cái vòm. Đặt chung chỗ với vòm trời cho "hợp lý về mặt kể
  // chuyện" thì mọi vật liệu tạo trước đó sẽ nhận `undefined` — im lặng, và mất sạch phản chiếu.
  // Không có nó thì mọi `metalness` khai ở `materials.js` sẽ ra khối đen. Có nó thì mặt kính kỷ 14
  // hắt màu trời, mái kẽm kỷ 9 loáng bạc, chóp vàng ánh lên — tức là vật liệu bắt đầu KHÁC NHAU
  // thay vì chỉ khác màu.
  const environment = createSkyEnvironment(
    renderer, skyLook, new Color(palette.outskirts ?? palette.groundAlt ?? palette.ground),
  );
  if (environment) track(environment);
  /**
   * Bản đồ môi trường gắn vào TỪNG vật liệu, KHÔNG gắn vào `scene.environment`.
   *
   * ⚠️ ĐÂY LÀ MỘT CÁI BẪY ĐÃ CẮN THẬT, và nó cắn theo kiểu tệ nhất — im lặng.
   * Bản đầu đặt `scene.environment = texture` rồi trông cậy vào `material.envMapIntensity` để chỉnh
   * mạnh yếu. Kết quả: **`envMapIntensity` bị bỏ qua hoàn toàn.** Vặn nó từ 0 lên 1,0 rồi lên 3,0
   * mà ảnh không đổi một điểm ảnh nào. Nhưng nhuộm đỏ chính bản đồ môi trường thì cả thành phố đỏ
   * lên ngay — kể cả khi `envMapIntensity = 0`. Nghĩa là môi trường vẫn rọi ở mức 1,0 bất kể ta
   * khai gì. Đường đi mà `envMapIntensity` thật sự có hiệu lực là khi vật liệu mang `envMap` của
   * CHÍNH NÓ.
   * ⚠️ BÀI HỌC RỘNG HƠN CẢ CHUYỆN THREE.JS: cái "0" ấy trông y hệt một tính năng đang chạy đúng —
   * cảnh vẫn đẹp lên (nhờ PBR), chỉ là một núm vặn không nối vào đâu cả. Cách duy nhất phát hiện
   * là **vặn núm tới mức PHI LÝ rồi đòi thấy hậu quả phi lý**. Núm nào chỉnh mà ảnh "hơi khác một
   * chút" thì không chứng minh được gì — mắt luôn tìm thấy khác biệt nó muốn thấy.
   */
  const envMap = environment?.texture ?? null;

  // Mặt đất, mặt đường, vùng đất bao quanh: nhám gần như tuyệt đối. Chúng KHÔNG được bóng — một
  // con đường bắt sáng là con đường vừa mưa xong, và cả 15 kỷ đều không mưa.
  const tileMaterial = track(applySurfaceDetail(new MeshStandardMaterial({
    roughness: 0.96,
    metalness: 0,
    // ⚠️ TỪ PHASE 8C MÀU ĐI QUA ĐỈNH, KHÔNG QUA `setColorAt` NỮA. Mặt đất thôi là 144 khối hộp có
    // màu riêng từng khối; nó là MỘT tấm liền, và màu nội suy dọc theo các đỉnh chính là thứ xoá
    // được cái bàn cờ. Bỏ dòng này thì tấm lưới ra màu trắng trơn — im lặng, không lỗi.
    vertexColors: true,
    envMap,
    envMapIntensity: ENV_DIFFUSE,
    transparent: dimmed,
    opacity: dimmed ? 0.62 : 1,
  }), { ...GRAIN.ground }));

  // Dùng lại vài đối tượng tạm cho mọi thực thể — tạo mới trong vòng lặp là rác cho bộ dọn.
  const matrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3(1, 1, 1);
  const tint = new Color();
  // Riêng cho cư dân: hướng đi của người, phép xoay của một khớp, và chỗ tính tâm một bộ phận.
  // Tách khỏi `rotation`/`position` vì khối cư dân dùng cả bốn CÙNG LÚC trong một biểu thức ghép.
  const heading = new Quaternion();
  const jointSpin = new Quaternion();
  const jointRoll = new Quaternion();
  const limb = new Vector3();

  /**
   * MẶT ĐƯỜNG CÓ VẬT LIỆU RIÊNG — không dùng chung `tileMaterial` với mặt đất nữa.
   *
   * ⚠️ Đây là nửa còn lại của bản vá màu ở `palette3d.js`, và bỏ nó đi thì bản vá kia mới chỉ làm
   * được một nửa việc: đường đất nện thời đồ đá và mặt bê tông Dubai sẽ đúng MÀU nhưng vẫn phản
   * ứng với ánh sáng y hệt nhau, tức vẫn là cùng một bề mặt — đúng nguyên nhân gốc của cảm giác
   * "khối màu phẳng" mà `materials.js` sinh ra để chữa. Đất nện rời (nhám 0,99) không bao giờ bắt
   * được vệt sáng; bê tông đúc (0,90) thì có, dù rất mờ. Chênh lệch nhỏ, nhưng nó là chênh lệch
   * DUY NHẤT phân biệt được "chưa lát" với "đã lát" khi cả hai cùng nằm phẳng dưới đất.
   * Giá phải trả: đúng MỘT lệnh vẽ (mặt đường vốn đã là một mảng riêng từ trước — `InstancedMesh`
   * tới Phase 8B, một tấm lưới bám sườn dốc từ Phase 8C).
   */
  const roadProfile = materialProfile(getEraStyle(layout.era)?.roadMaterial);
  const roadMaterial = track(applySurfaceDetail(new MeshStandardMaterial({
    roughness: roadProfile.roughness,
    metalness: roadProfile.metalness,
    vertexColors: true,
    envMap,
    envMapIntensity: ENV_DIFFUSE,
    transparent: dimmed,
    opacity: dimmed ? 0.62 : 1,
  }), { ...GRAIN.road }));

  // ── ĐỊA HÌNH ──────────────────────────────────────────────────────────────
  // ⚠️ MỌI THỨ ĐỨNG TRÊN ĐẤT ĐỀU PHẢI HỎI Ở ĐÂY, KHÔNG ĐƯỢC AI TỰ GIẢ ĐỊNH y = 0.
  // Có SÁU chỗ đặt vật lên mặt đất trong file này (nền · đường · công trình · giàn giáo · cảnh
  // vật · cư dân). Quên một chỗ thì thứ đó lơ lửng hoặc lún vào đồi — và nó KHÔNG đỏ ở đâu cả,
  // chỉ là một cái cây mọc giữa không trung ở đúng một kỷ. Đây chính là hình dạng lỗi mà Phase 4D
  // đã trả giá ("một luật mới làm điều kiện cũ hết đúng ⇒ phải tìm MỌI chỗ phát biểu lại nó").
  const terrain = buildTerrain({ era: layout.era, gridSize });

  // ── Vòm trời chuyển sắc ───────────────────────────────────────────────────
  // Một mảng nền phẳng làm cả cảnh trông như dán lên giấy. Vòm trời đổi màu từ đỉnh xuống chân
  // trời cho không gian có "trên" và "dưới" — và vì nó nằm sau sương mù cùng màu chân trời, thành
  // phố tan dần vào trời thay vì bị cắt bằng một đường viền.
  // ⚠️ BÁN KÍNH VÒM TRỜI BỊ KẸP GIỮA HAI ĐIỀU KIỆN, VÀ CHÚNG TỪNG MÂU THUẪN NHAU:
  //   (a) phải LỚN HƠN khoảng camera lùi xa nhất (`maxDistance` = gridSize × 3,1 ≈ 37) — nếu không
  //       thì thu nhỏ hết cỡ sẽ đưa camera ra ngoài vòm và trời biến mất;
  //   (b) mặt SAU của vòm phải nằm trong tầm nhìn: khoảng camera + bán kính < `camera.far`.
  // Bản đầu để bán kính 4,4 × gridSize (52,8) với `camera.far` = 6 × gridSize (72): 37 + 52,8 = 90
  // > 72, nên nửa vòm phía xa bị cắt sạch và thứ hiện ra là `scene.background` phẳng lì. Nhìn ảnh
  // chụp thử tưởng "màu trời chọn sai", thật ra là trời KHÔNG HỀ ĐƯỢC VẼ.
  // Đã nới `camera.far` lên 8 × gridSize (xem `CityScene3D.jsx`) để hai điều kiện cùng thoả:
  // 37 < 43,2 và 37 + 43,2 = 80,2 < 96.
  const SKY_RADIUS = gridSize * 3.6;
  // 32×16 chứ không phải 16×10: vầng sáng mặt trời bên dưới được NƯỚNG VÀO MÀU ĐỈNH, nên độ mịn
  // của nó bị giới hạn bởi số đỉnh. Ở 16×10 quầng sáng lộ rõ các mảng tam giác. 960 tam giác cho
  // cả bầu trời vẫn là rẻ mạt so với thứ nó đổi lại.
  const skyGeometry = track(new SphereGeometry(SKY_RADIUS, 32, 16));
  paintSkyGradient(skyGeometry, SKY_RADIUS, skyLook);

  const skyMaterial = track(new MeshBasicMaterial({
    vertexColors: true,
    side: BackSide,     // nhìn vòm từ BÊN TRONG
    fog: false,         // trời không được chịu sương mù, nếu không nó tự xoá chính mình
    depthWrite: false,
  }));
  const skyMesh = new Mesh(skyGeometry, skyMaterial);
  // ⚠️ NHÃN NGUỒN GỐC, không phải để tra cứu lúc chạy — xem `measureSceneGeometry`. Vòm trời là
  // một trong hai thứ tạo nên hằng số 44.126 tam giác có mặt ở CẢ 15 kỷ; không tách nó ra thì mọi
  // câu hỏi dạng "kỷ nào nặng" đều bị pha loãng.
  markBackdrop(skyMesh, 'sky');
  scene.add(skyMesh);
  meshes.push(skyMesh);

  // ── Vùng đất bao quanh ────────────────────────────────────────────────────
  // ⚠️ ĐÂY LÀ THỨ TÁCH "MỘT NƠI CHỐN" KHỎI "MÔ HÌNH TRÊN BÀN".
  // Lưới 12×12 kết thúc bằng một mép vuông sắc lẹm, và ảnh chụp thử cho thấy đúng cảm giác một
  // miếng bìa đặt giữa hư không — dù mọi thứ TRÊN miếng bìa đó đều đã đẹp.
  //
  // ⚠️ NHƯNG TỪ PHASE 9A ĐÂY KHÔNG CÒN LÀ MỘT TẤM VÁN PHẲNG. Bản cũ là một khối hộp 72×72 tô đúng
  // MỘT màu (12 tam giác), và đo trên ảnh chụp thì nó chiếm **100% khung hình**: pitch camera 34,4°
  // trừ nửa FOV dọc 19° ⇒ mép trên khung nằm 15,4° DƯỚI tầm mắt, nên không một điểm ảnh nào là
  // trời (đã chứng minh bằng cách sơn vòm trời ĐỎ CHÓI rồi chụp — đỉnh khung vẫn nguyên màu đất).
  // Cả bức ảnh vì thế chỉ có HAI lớp: thành phố, và một mảng phẳng. Đó chính là cảm giác "mô hình
  // trên bàn" mà tấm ván này sinh ra để chữa, và nó đã tự trở thành nguyên nhân.
  //
  // Nay là địa hình thật theo kỷ (`horizon.js`): kỷ 13 có núi vây quanh vì đô thị Nhật kẹp giữa
  // núi, kỷ 12 phẳng lì vì thảo nguyên Nga phẳng thật. Dữ liệu địa lý ấy đã nằm sẵn trong dự án từ
  // Phase 7B — chỉ là tầng vẽ chưa từng đọc tới nó.
  // ⚠️ TRUYỀN `terrain` VÀO: tấm chân trời đọc `terrain.nenKho` làm NỀN (2026-08-21) nên hai tấm
  // khớp nhau theo cấu tạo. Không truyền thì `buildHorizon` tự dựng một `buildTerrain` thứ hai —
  // vẫn ra đúng số (hàm thuần, cùng `era`+`gridSize`), nhưng tốn gấp đôi công mỗi lần dựng cảnh.
  const horizon = buildHorizon({ era: layout.era, gridSize, terrain });
  const horizonSurface = buildHorizonSurface({ horizon, palette, terrain, gridSize });
  const outskirtsMaterial = track(applySurfaceDetail(new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.98,
    metalness: 0,
    envMap,
    envMapIntensity: ENV_DIFFUSE,
  }), { ...GRAIN.outskirts }));
  if (horizonSurface) {
    track(horizonSurface.geometry);
    const outskirts = new Mesh(horizonSurface.geometry, outskirtsMaterial);
    // ⚠️ KHÔNG nhận bóng, và đây KHÔNG phải tối ưu hiệu năng — nó là bắt buộc để đúng.
    // Khung bóng đổ chỉ bó quanh lưới 12×12 (`reach` bên dưới), còn vùng đất này rộng gấp sáu lần.
    // Mọi điểm nằm NGOÀI khung đó tra vào bản đồ bóng sẽ lấy nhầm giá trị ở mép và bị coi là đang
    // trong bóng — kết quả là cả vùng đất quanh thành phố tối đen (đã thấy tận mắt ở ảnh chụp thử).
    outskirts.castShadow = false;
    outskirts.receiveShadow = false;
    // Nửa còn lại của hằng số 44.126 (rặng núi Phase 9A ≈ 43.166 tam giác) — xem `measureSceneGeometry`.
    markBackdrop(outskirts, 'horizon');
    scene.add(outskirts);
    meshes.push(outskirts);
  }

  // ── MẶT ĐẤT + MẶT ĐƯỜNG: MỘT TẤM LIỀN ─────────────────────────────────────
  //
  // ⚠️ TRƯỚC PHASE 8C CHỖ NÀY LÀ 144 KHỐI HỘP, VÀ ĐÓ LÀ NGUYÊN NHÂN GỐC CỦA "TERRAIN NHƯ CÁC BẬC
  // THANG". Đàm nhìn ảnh chụp rồi nói đúng ba chữ mô tả trọn vấn đề: *"grid rõ"*. Không phải vì màu
  // sai hay ánh sáng thiếu — mà vì mặt đất **là** một cái lưới: hộp thì không dốc được (chênh cao
  // độ chỉ có thể là BẬC), hộp thì có mặt bên (mỗi ô bốn cạnh đứng), và 144 ô mỗi ô một sắc phẳng
  // thì mắt đọc ra ngay hàng lối. Nay là MỘT tấm lưới đỉnh liền: xem `terrainMesh.js`.
  //
  // Hai con số này vẫn giữ nguyên vai trò cũ — HUD đếm chúng, và chúng vẫn là dữ liệu bố cục thật.
  const groundCells = layout.ground ?? [];
  const roads = (layout.props ?? []).filter((prop) => prop.kind === 'road');

  /**
   * ⚠️ MỘT TRONG HAI NHÁT CẮT của cờ đo `tachDeDo` — nhát này mở ra khi người gọi hỏi tên
   * `ground-grid`/`ground-apron` ({@link NHOM_TACH_MAT_DAT}). **Mặc định TẮT, có test khoá.**
   *
   * Vì sao phải có: mặt đất là MỘT tấm lưới trải từ rìa vành đất bên này qua thành phố sang rìa
   * bên kia, nên ở tầng scene không còn cách nào hỏi *"bao nhiêu phần khung hình là đất TRONG lưới
   * thành phố, bao nhiêu là vành đất NGOÀI?"*. Mà tách bằng MÀU thì đúng vào bẫy `TECH_DEBT #22`
   * (bộ lọc "8% tươi nhất ≈ mái" hoá ra chấm cỏ suốt ba phase) — huống hồ ở đây hai vùng dùng
   * chung một dải sắc độ, tức còn khó tách hơn. Bên DỰNG biết chắc ô nào nằm đâu, nên bên dựng
   * phải nói ra.
   *
   * Câu hỏi này KHÔNG phải tò mò: §2-C đã đo được rằng phủ kín MỌI ô đất trống trong lưới cũng chỉ
   * hạ "đất trống" 7,13 điểm phần trăm, tức phần lớn chỗ trống Đàm nhìn thấy nằm ở đâu đó KHÁC —
   * và "đâu đó" chính là thứ cờ này đo.
   *
   * Giá: khi bật, mặt đất ra HAI lệnh vẽ thay vì một. App không bao giờ đi vào nhánh này.
   */
  const ground3d = buildTerrainSurface({ terrain, gridSize, layout, palette, tach: tachMatDat });
  const road3d = buildRoadSurface({ terrain, gridSize, layout, palette });
  const tamDat = tachMatDat
    ? [[ground3d?.trongLuoi ?? null, tileMaterial, 'ground-grid'],
      [ground3d?.vanhNgoai ?? null, tileMaterial, 'ground-apron']]
    : [[ground3d, tileMaterial, 'ground']];
  for (const [surface, material, name] of [
    ...tamDat, [road3d, roadMaterial, 'road'],
  ]) {
    if (!surface) continue;
    track(surface.geometry);
    const mesh = new Mesh(surface.geometry, material);
    // ⚠️ ĐẶT TÊN LÀ ĐỂ **ĐO ĐƯỢC**, không phải để tra cứu lúc chạy. Muốn hỏi "mặt đường trên màn
    // hình sáng bao nhiêu so với mặt đất" thì phải biết điểm ảnh nào là đường — và `TECH_DEBT #22`
    // đã trả giá đắt cho bài học rằng việc ấy KHÔNG được đoán bằng màu: bộ lọc "8% điểm ảnh tươi
    // nhất ≈ mái" đã đo nhầm sang cỏ suốt ba phase. Bên DỰNG biết chắc chắn cái nào là cái nào, nên
    // bên dựng phải nói ra. `city-preview.mjs --mask road` đọc đúng tên này.
    mesh.name = name;
    // Đồi KHÔNG đổ bóng lên chính nó ở phiên này: khung bóng bó sát lưới 12×12, mà tấm đất trải
    // rộng hơn nhiều ⇒ mọi điểm ngoài khung sẽ tra nhầm mép bản đồ bóng và tối đen cả vùng ngoài
    // (đúng lỗi đã thấy tận mắt với `outskirts`). Nhận bóng thì có — đó là bóng công trình in lên
    // sườn dốc, và chính nó nói cho mắt biết mặt đất đang nghiêng.
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    addMesh(mesh);
  }

  // ── MẶT NƯỚC: MỘT tấm phẳng, và CHỈ ở kỷ có nước ──────────────────────────
  //
  // ⚠️ ĐÂY LÀ TOÀN BỘ CHI PHÍ LỆNH VẼ CỦA VIỆC 2: **+1, và chỉ ở kỷ đã dựng hình nước.** Kỷ khô đi
  // qua đây mà không tạo gì cả, nên mốc `MOC_LENH_VE` của chúng không đổi một đơn vị — đúng lệnh
  // Đàm ra (*"KHÔNG nâng trần chung"*), và `drawCallBudget.test.js` khoá điều đó theo TỪNG KỶ.
  //
  // ⚠️ VẬT LIỆU RIÊNG LÀ ĐIỀU BẮT BUỘC, KHÔNG PHẢI MỘT MÓN THÊM: nước là thứ duy nhất trong cảnh
  // PHẢN CHIẾU (nhám 0,10 so với 0,90–0,99 của mọi mặt khác). Gộp nó vào vật liệu mặt đất thì tiết
  // kiệm được một lệnh vẽ và mất đúng thứ khiến mắt đọc ra "nước". Bản đồ môi trường đã dựng sẵn
  // (Phase 7A) nên bầu trời soi xuống mặt nước **miễn phí** và TĨNH — không có một hạt sóng, không
  // một dòng shader động nào, đúng ràng buộc Đàm ra.
  const water3d = buildWaterSurface({ setting: terrain.setting, gridSize, horizon });
  if (water3d) {
    track(water3d.geometry);
    const waterMaterial = track(new MeshStandardMaterial({
      vertexColors: true,
      // Nhám rất thấp = mặt gương. Đây là cái duy nhất tách nước khỏi "một mảng sơn xanh".
      roughness: 0.10,
      metalness: 0.05,
      envMap,
      // ⚠️ MẠNH HƠN MẶT ĐẤT BỐN LẦN, CÓ CHỦ Ý. `ENV_DIFFUSE = 0,12` được hiệu chuẩn bằng bảng đo ở
      // Phase 7A cho vật liệu ĐỤC (0 → quá tối, 1,00 → pastel như sữa). Nước thì gần như KHÔNG có
      // thành phần khuếch tán — màu nó hiện ra phần lớn là thứ nó phản chiếu, đúng cùng lý lẽ đã
      // ghi cho kim loại (*"kim loại không có gì để phản chiếu thì render ra đen"*).
      envMapIntensity: ENV_DIFFUSE * 4,
    }));
    const water = new Mesh(water3d.geometry, waterMaterial);
    water.name = 'water';
    // ⚠️ KHÔNG nhận bóng — cùng lý do với `outskirts`, và nó KHÔNG phải tối ưu hiệu năng mà là bắt
    // buộc để đúng: khung bóng đổ bó sát lưới 12×12, còn mặt nước trải ra xa gấp nhiều lần, nên mọi
    // điểm ngoài khung tra vào bản đồ bóng sẽ lấy nhầm giá trị ở mép và bị coi là đang trong bóng
    // ⇒ cả mặt biển đen kịt.
    water.castShadow = false;
    water.receiveShadow = false;
    addMesh(water);
  }

  // ── Công trình: mỗi cái một hình dáng riêng, tất cả trong MỘT lệnh vẽ ──────
  //
  // `pickTargets` là danh sách hộp bao để biết ngón tay đang chỉ vào CĂN NÀO — xem
  // `engine/city3d/pick.js` giải thích vì sao phải tính bằng toán chứ không ném tia vào mesh.
  // Nó chỉ là DỮ LIỆU, không phải đối tượng GPU: không thêm một lệnh vẽ nào, không thêm một
  // tam giác nào, và cảnh nào không cần chạm thì cứ việc bỏ qua mảng này.
  const pickTargets = [];
  const addPickTarget = (placement, ref) => {
    const bounds = placeBounds(specBounds(placement.spec), {
      x: placement.x, z: placement.z, y: placement.y, scale: placement.scale,
      // Nới vùng chạm: ngón tay trên iPhone không trỏ được vào đúng một điểm, mà nhà cấp 1 ở xa
      // chỉ chiếm vài chục điểm ảnh. Xem giải thích đầy đủ ở `placeBounds`.
      pad: TILE_UNIT * 0.12,
    });
    if (bounds) pickTargets.push({ ...ref, box: bounds });
  };

  const buildings = layout.buildings ?? [];

  /**
   * Đặt một công trình lên địa hình, và sinh kèm khối MÓNG khi nó vắt qua mép thềm.
   *
   * ⚠️ VÌ SAO KHÔNG SAN PHẲNG Ô ĐẤT DƯỚI CHÂN NÓ — đó là phản xạ đầu tiên và nó sai: san phẳng thì
   * con đường chạy ngay cạnh sẽ hụt một bậc so với ô vừa bị san, và mạng đường gãy làm đôi ở đúng
   * chỗ đông đúc nhất. Thay vào đó công trình đứng ở cao độ CAO NHẤT dưới bóng mình (không bao giờ
   * có góc treo) và phần hụt được lấp bằng một bệ kè — đúng cách nhà trên sườn đồi được xây ngoài
   * đời, và nó thêm đúng loại chi tiết kiến trúc mà cảnh đang thiếu.
   *
   * Móng đi vào CÙNG khối hình học gộp nên **không tốn thêm lệnh vẽ nào**; nó chỉ tốn 12 tam giác,
   * và chỉ sinh ra khi thật sự có phần hụt.
   */
  function groundPlacement(cell, spec, extra = {}) {
    const { x, z } = cellToWorld(cell.x, cell.y, gridSize);
    const span = Math.max(1, Math.round(specSpan(spec.parts) * BUILDING_SCALE));
    const { top, drop } = terrain.footprint(cell.x, cell.y, span);
    const placement = { x, z, y: top, scale: BUILDING_SCALE, spec, ...extra };
    const plinth = drop > 0 ? {
      x, z, y: top - drop, ry: 0, scale: 1,
      spec: {
        parts: [prism({
          y: 0, w: span * 0.92, d: span * 0.92, h: drop,
          sides: 4, taper: 1, role: 'stone',
        })],
      },
    } : null;
    return { placement, plinth };
  }

  // ⚠️ DANH SÁCH KHỐI LẤY TỪ `collectCitySpecs`, KHÔNG dựng lại tại chỗ. Trước đây vòng lặp này nằm
  // ngay đây và bài test phải CHÉP LẠI nó — bản chép đã sai mà không ai biết (xem đầu
  // `cityParts.js`). Nay chỉ còn một bản: chỗ này DỰNG, bài test ĐO, cùng một hàm.
  // Thứ tự trả về (công trình → giàn giáo → nhà dân → cảnh vật) là một phần hợp đồng, vì
  // `addPickTarget` bám theo chỉ số của nhóm công trình.
  const cityParts = collectCitySpecs({ layout, detail: lowDetail ? 'low' : 'high' });

  const plinths = [];
  const placements = [];
  const buildingPlacements = [];

  /**
   * ⚠️ MỘT CỬA DUY NHẤT ĐỂ ĐẨY KHỐI VÀO CẢNH, VÀ NÓ BẮT BUỘC PHẢI KÈM NHÃN.
   *
   * Chú thích của chính file này đã dự đoán quả mìn: *"Bản đầu loại vùng quê khỏi `blockers` bằng
   * `placements.slice(0, length − soKhoiVungQue)` — đúng kết quả hôm nay, nhưng nó ngầm đòi vùng
   * quê phải LUÔN được đẩy vào cuối cùng. Ngày nào có ai đẩy thêm một loại khối nữa sau nó, phép
   * cắt ấy lấy nhầm và camera bắt đầu đâm xuyên nhà — im lặng tuyệt đối."* Phase 13 VIỆC B chính
   * là cái ngày ấy: vùng phụ cận được đẩy SAU vùng quê, nên `slice(-soKhoiVungQue)` sẽ lặng lẽ
   * chấm ruộng và tường thành làm "cây cối".
   *
   * ⇒ Nay mọi phép chia nhóm hỏi NHÃN (`theoNhan`), không hỏi chỉ số. Gán nhãn TẠI CHỖ ĐẨY nghĩa
   * là không thể quên: hàm này là đường DUY NHẤT vào `placements`, và có test đọc mã nguồn khoá
   * điều đó ở `sceneGraphWiring.test.js`.
   */
  const dayKhoi = (nhomDo, placement) => {
    placement.nhomDo = nhomDo;
    placements.push(placement);
    return placement;
  };
  const theoNhan = (ten) => placements.filter((pl) => pl.nhomDo === ten);

  for (const item of cityParts) {
    if (item.kind !== 'building') continue;
    const building = item.source;
    const built = groundPlacement(building, item.spec, {
      // Xoay cả công trình theo bội số 90° cho phố khỏi xếp hàng răm rắp. Bội số của góc vuông
      // chứ không phải góc bất kỳ: nhà quay chéo so với lưới đường trông như bị đặt ẩu.
      ry: ((building.x + building.y) % 4) * (Math.PI / 2),
    });
    if (built.plinth) plinths.push(built.plinth);
    dayKhoi(NHOM_CUA_KIND.building, built.placement);
    buildingPlacements.push(built.placement);
  }

  buildings.forEach((building, index) => {
    addPickTarget(buildingPlacements[index], { kind: 'building', bpId: building.bpId });
  });

  // Công trình đang xây (nếu bố cục có) → giàn giáo dựng cao dần theo tiến độ.
  for (const item of cityParts) {
    if (item.kind !== 'scaffold') continue;
    const scaffold = item.source;
    const built = groundPlacement(scaffold, item.spec, { ry: 0 });
    const { placement } = built;
    // ⚠️ Giàn giáo cũng cần MÓNG như công trình thật: nó đang chiếm đúng khu đất ấy, và nếu chỉ
    // công trình xong mới có bệ kè thì đúng lúc xây xong sẽ thấy cả toà nhà nhảy lên một bậc.
    if (built.plinth) plinths.push(built.plinth);
    dayKhoi(NHOM_CUA_KIND.scaffold, placement);
    // Giàn giáo cũng chạm được: đó chính là công trình Đàm đang chờ, nên nó phải là thứ dễ hỏi
    // "còn bao lâu nữa?" nhất trong cả cảnh — chứ không phải thứ duy nhất không bấm được.
    addPickTarget(placement, { kind: 'scaffold', bpId: scaffold.bpId });
  }

  // ── NHÀ DÂN (Phase 7C) ───────────────────────────────────────────────────
  //
  // ⚠️ ĐI CHUNG `placements` VỚI LANDMARK, và đó là điểm mấu chốt về hiệu năng: cả 30 căn gộp vào
  // đúng khối hình học đã có, nên thêm nhà dân tốn **0 lệnh vẽ mới**. Đây là lý do bố cục "gộp
  // hình học + màu đỉnh" từ Phase 3B đáng giá — không có nó thì 30 căn = 30 lệnh vẽ và cổng hiệu
  // năng iPhone sập ngay.
  //
  // ⚠️ KHÔNG `addPickTarget` cho nhà dân. Chạm vào công trình là để hỏi "công trình này là gì, cho
  // đặc quyền gì" — nhà dân không có bản vẽ, không có đặc quyền, không có gì để nói. Thêm chúng vào
  // danh sách chạm chỉ làm loãng đúng thao tác mà Phase 3K sinh ra: 30 mục tiêu câm chen giữa 5 mục
  // tiêu có nội dung, và ngón tay sẽ trúng nhà dân nhiều gấp sáu lần trúng thứ đáng đọc.
  // ⚠️ Khoá hình dáng nhà dân gồm cả TOẠ ĐỘ (`dwellingBpId` ở `cityParts.js`) — không có vế toạ độ
  // thì cả khu phố là một căn nhà nhân bản 12 lần.
  for (const item of cityParts) {
    if (item.kind !== 'dwelling') continue;
    const home = item.source;
    const built = groundPlacement(home, item.spec, {
      ry: ((home.x * 3 + home.y) % 4) * (Math.PI / 2),
    });
    if (built.plinth) plinths.push(built.plinth);
    dayKhoi(NHOM_CUA_KIND.dwelling, built.placement);
  }

  // ── Cảnh vật: cây, đá, đèn, mặt nước, ruộng ──────────────────────────────
  // `deriveProps` đã sinh sẵn danh sách này từ Phase 1 (bộ vẽ 2D dùng từ lâu) nhưng bộ vẽ 3D
  // trước nay mới chỉ đọc mỗi đường sá. Gộp chúng vào CÙNG khối hình học với công trình để không
  // tốn thêm lệnh vẽ nào — chúng đều đứng yên nên chẳng có lý do gì phải tách ra.
  for (const item of cityParts) {
    if (item.kind !== 'prop') continue;
    const prop = item.source;
    // ⚠️ CẢNH VẬT NAY LỆCH KHỎI TÂM Ô (Phase 8D) — và cái lệch ấy PHẢI đi vào cả hai phép tính
    // dưới đây, không được chỉ một. Toạ độ ngang lấy `ox/oy` mà cao độ vẫn hỏi tâm ô thì cái cây
    // đứng ở sườn dốc sẽ **lơ lửng giữa trời hoặc lún nửa thân xuống đất**, và không có gì đỏ lên:
    // build xanh, test cũ xanh, chỉ có ảnh chụp là sai. Đây đúng cái bẫy "một luật nói ở hai chỗ"
    // mà bảng `GROUND_ANCHORS` ở `sceneGraphWiring.test.js` sinh ra để canh.
    const ux = prop.x + (prop.ox ?? 0);
    const uy = prop.y + (prop.oy ?? 0);
    const { x, z } = cellToWorld(ux, uy, gridSize);
    dayKhoi(NHOM_CUA_KIND.prop, {
      // Cảnh vật nhỏ (cây, đá, đèn) chỉ chiếm một ô nên không cần móng — nó ngồi thẳng lên thềm.
      // ⚠️ `surfaceHeightAt` (mặt đất LIÊN TỤC), KHÔNG phải `heightAt` (cao độ rời rạc của TÂM ô).
      // Ở đúng tâm ô hai hàm cho cùng một số, nên bản cũ đúng; ở toạ độ lẻ thì chỉ `surfaceHeightAt`
      // mới trả về đúng cao độ của tấm lưới mà mắt đang nhìn thấy.
      x, z, y: terrain.surfaceHeightAt(ux, uy),
      // Xoay tự do — cây cối mà thẳng hàng theo lưới thì lộ ngay ra là máy đặt.
      // ⚠️ TRỪ MẢNG PHỦ ĐẤT (`gridAligned`, xem `deriveGroundCover` ở `cityLayout.js`): nó là một
      // hình VUÔNG rộng gần trọn ô, xoay một góc bất kỳ là nó thò sang ô bên. Bội số 90° thì góc
      // nào cũng vẫn nằm gọn trong ô, mà vẫn đủ bốn hướng cho những kiểu không đối xứng.
      ry: prop.gridAligned
        ? ((prop.variant + prop.x + prop.y) % 4) * (Math.PI / 2)
        : (prop.variant + prop.x * 0.7 + prop.y * 1.3) % (Math.PI * 2),
      spec: item.spec,
    });
  }

  // Móng xếp SAU cùng: chúng chỉ là khối lấp, không phải thứ chạm vào được, nên phải nằm ngoài
  // vùng chỉ số mà `addPickTarget` đã bám theo (`placements[index]`).
  // ⚠️ Móng mang nhãn `buildings` vì nó luôn thuộc về một thứ ĐÃ XÂY — cảnh vật không có móng.
  for (const plinth of plinths) dayKhoi(NHOM_CUA_KIND.building, plinth);

  // ── Vùng quê: cây cối, bờ bụi, đá tảng NGOÀI lưới thành phố ──────────────
  /**
   * ⚠️ ĐÂY LÀ BẢN VÁ CHO THỨ ĐÀM GỌI LÀ *"thành phố xây trên một ô đất nhô ra"* — và ba giả thuyết
   * đầu (vách đứng ở mép đĩa · màu chỏi ở mép đĩa · vùng gần phẳng lì) đều đã bị PHÉP ĐO bác bỏ,
   * xem khối chú thích đầu `engine/city3d/outskirts.js`. Thứ mắt đọc ra là cái khay chính là
   * THÀNH PHỐ: một hình chữ nhật kín đặc nhà và đường, dừng phắt, và ngoài nó không có gì hết.
   *
   * ⚠️ CAO ĐỘ HỎI HAI TẤM KHÁC NHAU, VÀ ĐÓ KHÔNG PHẢI "hai công thức cho một luật". Mặt đất thật
   * sự do HAI tấm lưới dựng nên: tấm thành phố (`terrain.surfaceHeightAt`, toạ độ Ô) phủ tới
   * `horizon.innerEdge`, ra ngoài đó là tấm chân trời (`horizon.heightAt`, toạ độ THẾ GIỚI). Cây
   * đứng ở đâu thì phải hỏi tấm đang vẽ chỗ ấy; hỏi nhầm tấm là cây lơ lửng hoặc lún nửa thân, và
   * **không có gì đỏ lên**. Hai tấm khớp nhau TUYỆT ĐỐI tại chỗ giáp (đo được 0,0000 ở kỷ 1 · 7 ·
   * 14, và `terrainMesh.test.js` khoá điều đó), nên chọn tấm nào ở đúng biên cũng ra cùng một số.
   */
  for (const item of cityParts) {
    if (item.kind !== 'outskirt') continue;
    const wild = item.source;
    const { x, z } = cellToWorld(wild.x, wild.y, gridSize);
    const trongDiaDat = Math.max(Math.abs(x), Math.abs(z)) <= horizon.innerEdge;
    dayKhoi(NHOM_CUA_KIND.outskirt, {
      x, z,
      y: trongDiaDat ? terrain.surfaceHeightAt(wild.x, wild.y) : horizon.heightAt(x, z),
      // Xoay tự do: vùng quê mà thẳng hàng theo lưới thì nó chỉ là một cái khay thứ hai.
      ry: (wild.x * 0.83 + wild.y * 1.37) % (Math.PI * 2),
      scale: wild.scale,
      spec: item.spec,
    });
  }

  // ── Vùng phụ cận: ruộng, đê, tường thành, cổng, bến, xóm vệ tinh, đường rời khung ─────────
  /**
   * ⚠️ ĐÂY LÀ THỨ TRẢ LỜI CÂU *"vì sao thành phố vẫn trông nhỏ"* MÀ VIỆC 1 KHÔNG TRẢ LỜI ĐƯỢC.
   * Vành ngoài đã được lấp một lần bằng cây cối (kỷ 12 đi từ 64,82% xuống 38,61% đất trống) và
   * Đàm **vẫn nói thành phố nhỏ** — đó là dữ liệu, không phải ý kiến: thực vật không mang tín
   * hiệu quy mô. Thứ mắt đọc ra là "một nơi RỘNG" là DẤU CHÂN NGƯỜI trải ra ngoài.
   *
   * Cao độ hỏi ĐÚNG HAI TẤM như vùng quê ngay trên — cùng một luật, cùng một công thức.
   */
  for (const item of cityParts) {
    if (item.kind !== 'hinterland') continue;
    const hl = item.source;
    const { x, z } = cellToWorld(hl.x, hl.y, gridSize);
    const trongDiaDat = Math.max(Math.abs(x), Math.abs(z)) <= horizon.innerEdge;
    dayKhoi(NHOM_CUA_KIND.hinterland, {
      x, z,
      y: trongDiaDat ? terrain.surfaceHeightAt(hl.x, hl.y) : horizon.heightAt(x, z),
      ry: hl.ry ?? 0,
      scale: hl.scale ?? 1,
      spec: item.spec,
    });
  }


  /**
   * VẬT CẢN — hộp bao thế giới của MỌI khối đứng trên mặt đất, để camera cận cảnh biết chỗ nào
   * không được bay vào (`engine/city3d/cityFocus.js`).
   *
   * ⚠️ ĐỌC THẲNG TỪ `placements`, đúng cái danh sách vừa được đem đi dựng hình. Dựng lại danh sách
   * ấy bằng một vòng lặp riêng là tạo công thức thứ hai cho cùng một luật, và triệu chứng sẽ là
   * camera đâm xuyên qua đúng những khối mới thêm ở phase sau — im lặng tuyệt đối.
   *
   * ⚠️ LẤY CẢ CẢNH VẬT (cây, đá, đèn) chứ không chỉ công trình — VÀ HÔM NAY NÓ TRÓI ĐÚNG **0 KỶ**.
   * Đo lại 2026-08-18 (sau khi đổi thứ tự chữa va chạm, `TECH_DEBT #46`): thêm chúng vào làm số
   * hộp ở kỷ 1 đi từ 22 lên 56 mà kế hoạch bay **không đổi lấy một chữ số** ở cả 15 kỷ — cây thấp
   * hơn nhà nên chưa bao giờ là thứ trói camera.
   * ⚠️ **Đừng đọc con số 0 ấy thành "mã chết rồi, gỡ đi".** Đàm đã chốt GIỮ (2026-08-18): nó rẻ
   * bằng không, và ngày nào một kỷ có hàng cọ hay tháp đèn cao hơn mái thì nó bảo vệ được NGAY,
   * không phải chờ ai nhớ ra. Con số 0 ấy không nằm trong chú thích này mà được ĐẾM trong bài
   * `CẢNH VẬT NẰM TRONG DANH SÁCH VẬT CẢN…` (`engine/city3d/cityFocus.test.js`), kèm một đối
   * chứng thổi cảnh vật cao quá mái để chứng minh phép đếm ấy không mù — nên ngày nó khác 0 thì
   * bài test đỏ, chứ không phải chú thích này lặng lẽ nói dối.
   *
   * ⚠️ VÙNG QUÊ **KHÔNG** NẰM TRONG DANH SÁCH NÀY, VÀ LÝ DO LÀ MỘT PHÉP ĐO CHỨ KHÔNG PHẢI MỘT SỞ
   * THÍCH. Bản đầu cho cây cối ngoài lưới vào đây và bài `CAMERA KHÔNG BAO GIỜ CHUI VÀO PHỐ` ĐỎ ở
   * kỷ 8: đường bay chỉ còn 0,81 đơn vị. Đo tiếp mới thấy thủ phạm không phải cái cây mà là **quả
   * đồi nó đứng trên** — mặt đất vùng quê kỷ 8 (Lisbon, "thành phố bảy quả đồi") dâng tới **+2,18**
   * trong khi thành phố ở quanh 0. Nghĩa là camera **xưa nay đã có thể bay xuyên qua sườn đồi ấy**
   * và chưa bao giờ có gì bắt được, vì bộ lập kế hoạch chỉ biết tới hình khối của THÀNH PHỐ
   * (`terrain.footprint`), không biết tới địa hình bao quanh.
   *
   * Cho MỘT NỬA cảnh quan vào (cái cây) mà bỏ nửa kia (quả đồi) thì tệ hơn là không cho gì: camera
   * sẽ né một bụi cây rồi bay thẳng vào sườn đồi ngay dưới nó, và lời hứa khoảng cách 7,5 của
   * ADR-034 bị trả giá để đổi lấy một sự an toàn giả. Câu hỏi *"camera có nên tránh ĐỊA HÌNH
   * không"* là một câu hỏi thật và riêng — ghi ở `TECH_DEBT #54`, đừng giải nửa vời ở đây.
   *
   * Chỉ là DỮ LIỆU: không lệnh vẽ, không tam giác, không cần dọn ở `dispose()`.
   */
  const blockers = [];
  for (const placement of placements) {
    // Vùng quê VÀ vùng phụ cận KHÔNG chặn camera — lý do đầy đủ ở chú thích ngay trên, và nó áp
    // cho cả hai vì cùng một cớ: chúng đứng NGOÀI lưới, trên thứ địa hình mà bộ hoạch định đường
    // bay không hề biết tới (`terrain.footprint` chỉ mô tả thành phố). Chặn cái cây mà không chặn
    // quả đồi dưới nó là mua một sự an toàn GIẢ — `TECH_DEBT #54`.
    if (NGOAI_LUOI.has(placement.nhomDo)) continue;
    const box = placeBounds(specBounds(placement.spec), {
      x: placement.x, z: placement.z, y: placement.y, scale: placement.scale,
    });
    // ⚠️ `nhom` KHÔNG phải trường trang trí — nó là thứ DUY NHẤT trả lời được câu *"khối này đến từ
    // đâu"* ở đầu bên kia. Bài test canh luật này (`sceneStats.test.js`) trước đây phải hỏi VÒNG,
    // bằng khoảng cách tới tâm: "xa hơn nửa lưới + dung sai ⇒ chắc là vùng quê". Phép đại diện ấy
    // chết ở Phase 20: thửa nay chạm được vành ngoài lưới nên khối THÀNH PHỐ nhô tới 6,88 trong khi
    // khối VÙNG QUÊ gần nhất đứng ở 6,00 — hai quần thể CHỒNG LÊN NHAU, không một ngưỡng khoảng
    // cách nào tách được chúng nữa. Đúng `TECH_DEBT #22`: một thứ đại diện là một giả định đội lốt
    // một phép đo, và nó chết trong im lặng ở một phase khác do tay một người khác.
    if (box) blockers.push({ ...box, nhom: placement.nhomDo });
  }

  /**
   * ⚠️ NHÁT CẮT THỨ HAI của cờ đo `tachDeDo` — mở ra khi người gọi hỏi tên `buildings`/`props`/
   * `landscape` ({@link NHOM_TACH_THANH_PHO}), để công cụ chụp trả lời được câu *"bao nhiêu phần
   * khung hình là NHÀ?"*. Nó **KHÔNG BAO GIỜ bật trong app**.
   *
   * Vì sao phải có: cả thành phố gộp vào MỘT khối hình học (đó là lý do chỉ tốn một lệnh vẽ), nên
   * ở tầng scene không còn cách nào tách "nhà" khỏi "cây". Mà tách bằng MÀU thì đúng vào cái bẫy
   * `TECH_DEBT #22` đã trả giá ba phase (bộ lọc "8% tươi nhất ≈ mái" hoá ra chấm cỏ). Bên DỰNG
   * biết chắc chắn khối nào là nhà — nên bên dựng phải nói ra, đúng tinh thần cái tên `road`/
   * `ground` ở trên.
   *
   * Giá: khi bật, thành phố ra HAI lệnh vẽ thay vì một. Đó là lý do nó là một cờ tắt-mặc-định chứ
   * không phải cách dựng thường: ràng buộc "không thêm lệnh vẽ nào" của Đàm nói về APP, và app thì
   * không bao giờ đi vào nhánh này. Có test khoá mặc định ở `sceneStats.test.js`.
   */
  const nhomHinhHoc = tachThanhPho
    ? NHOM_TACH_THANH_PHO.map((ten) => [ten, theoNhan(ten)])
    : [['city', placements]];

  for (const [tenNhom, nhom] of nhomHinhHoc) {
  const merged = nhom.length ? buildMergedGeometry(nhom, palette, {
    skipDeco: lowDetail,
    // Trời đã tối ⇒ tách ô cửa ra khối "tự phát sáng" riêng. Ban ngày `null` ⇒ không tách, không
    // tốn thêm lệnh vẽ nào.
    glowRole: daylight?.windowsLit ? 'glass' : null,
    era: layout.era,
    // ⚠️ CHE KHUẤT MÔI TRƯỜNG (AO) — CỜ NÀY TỒN TẠI ĐỂ CÓ ĐỐI CHỨNG, KHÔNG PHẢI ĐỂ CHỈNH.
    // Nó nướng sẵn vào MÀU ĐỈNH nên bật/tắt KHÔNG đổi một lệnh vẽ nào, không đổi một tam giác nào
    // (đã đo: kỷ 6 = 13 lệnh vẽ · kỷ 11 = 12, y hệt cả hai phía). Vậy nên thứ duy nhất phân biệt
    // được hai bản là ẢNH — và một hiệu ứng chỉ đo được bằng ảnh thì BẮT BUỘC phải có đường tắt
    // nó đi, nếu không thì mọi câu "nhờ AO mà đậm hơn" là một lời nói không kiểm được.
    // `city-preview.mjs --no-ao` là bên duy nhất truyền `false`; app luôn bật.
    ao,
  }) : null;
  if (merged) {
    if (merged.geometry) {
      track(merged.geometry);
      // ⚠️ MẢNG VẬT LIỆU DỰNG TỪ CHÍNH `merged.families`, KHÔNG tự liệt kê lại.
      // Nhà máy hình học đã đánh số nhóm theo thứ tự mảng đó; liệt kê lại ở đây là tạo ra công
      // thức thứ hai cho cùng một luật, và triệu chứng sẽ là mái nhà mang độ bóng của mặt nước —
      // mắt thấy ngay mà đọc code thì không, vì hai bên đều "đúng" theo cách hiểu riêng.
      const buildingMaterial = merged.families.map((family) => {
        const profile = materialProfile(family);
        // Kim loại/kính đã nhận trọn môi trường (1,0) nên `specularGainFor` trả về 1 — tức bản vá
        // tách-đôi KHÔNG chạm vào chúng, chỉ gỡ phanh cho các bề mặt khuếch tán.
        const envIntensity = profile.metalness > 0.15 ? 1 : ENV_DIFFUSE;
        return track(applySurfaceDetail(new MeshStandardMaterial({
          vertexColors: true,
          roughness: profile.roughness,
          metalness: profile.metalness,
          envMap,
          // Kim loại và kính SỐNG bằng phản chiếu → cho ăn trọn môi trường. Bề mặt khuếch tán chỉ
          // lấy một phần: để nguyên 1,0 thì ánh trời tràn vào làm nhạt hết bảng màu đất đã dựng
          // công phu suốt các Phase trước — đúng cái bẫy "sáng đều là kẻ thù của hình khối".
          envMapIntensity: envIntensity,
          transparent: dimmed,
          opacity: dimmed ? 0.62 : 1,
        }), { ...GRAIN.building, specularGain: specularGainFor(envIntensity) }));
      });
      const mesh = new Mesh(merged.geometry, buildingMaterial);
      mesh.name = tenNhom;   // để `city-preview.mjs --mask buildings` hỏi được, xem chú thích trên
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addMesh(mesh);
    }

    if (merged.glowGeometry) {
      track(merged.glowGeometry);
      // ⚠️ `MeshBasicMaterial` = KHÔNG nhận ánh sáng. Đó chính là điểm: màu hiện ra y nguyên nên ô
      // cửa sáng đều nhau ở cả bốn mặt công trình, kể cả mặt quay lưng với trăng. Đèn trong nhà
      // không quan tâm mặt trời ở đâu.
      const glowMaterial = track(new MeshBasicMaterial({
        vertexColors: true,
        transparent: dimmed,
        opacity: dimmed ? 0.62 : 1,
        // Không chịu sương mù: ô cửa ở xa vẫn phải là một chấm sáng, không tan thành màu chân trời.
        // Đây đúng là cách một thành phố về đêm nhìn từ xa — sương xoá được khối nhà, không xoá
        // được đốm đèn.
        fog: false,
      }));
      const glowMesh = new Mesh(merged.glowGeometry, glowMaterial);
      glowMesh.name = tenNhom + '-glow';
      glowMesh.castShadow = false;      // ô cửa sáng mà đổ bóng thì thành ra vô lý
      glowMesh.receiveShadow = false;
      addMesh(glowMesh);
    }
  }
  }

  // ── Cư dân ────────────────────────────────────────────────────────────────
  // Một thành phố không có người là một mô hình kiến trúc. Vài chấm di chuyển giữa những khối nhà
  // đó biến nó thành NƠI CÓ NGƯỜI Ở — và biến "mở khoá thêm một công trình" thành "chỗ này đông
  // hơn tuần trước". Cả cộng đồng đi qua MỘT `InstancedMesh` cho MỖI KHUÔN cơ thể (2026-08-23,
  // ADR-055) — trước đó là đúng một mesh duy nhất, vì mọi bộ phận đều là hộp. Xem chú thích
  // "GOM KHỐI THEO KHUÔN" ngay bên dưới để biết vì sao không thể gộp lại làm một.
  const residents = still ? [] : buildResidents(layout, stats);
  /** Đặt lại vị trí cả cộng đồng theo thời gian. `null` khi thành phố không có ai. */
  let placeResidents = null;
  if (residents.length > 0) {
    // ⚠️ MỘT CƠ THỂ CÓ KHỚP, KHÔNG PHẢI HAI CÁI HỘP — và đây là khác biệt giữa "cư dân" với
    // "viên gạch màu biết trôi".
    //
    // Mô hình cũ là đúng hai hộp (thân + đầu) dựng thẳng đứng, cộng một hàm sin nhún người. Nó đã
    // là một bước tiến thật so với MỘT hộp — cái chấm nhỏ sáng hơn trên khối lớn tối hơn chính là
    // ngôn ngữ của quân cờ và của hình nhân Lego. Nhưng nó dừng ở đó: **cả 15 kỷ ai cũng là cùng
    // một viên gạch nhún**, và không có gì trong hình dáng nói được người thời nào.
    //
    // ⚠️ CON SỐ CHO PHÉP LÀM VIỆC NÀY ĐÃ ĐƯỢC ĐO TRƯỚC KHI VIẾT DÒNG MÃ NÀO
    // (`scripts/human-scale.mjs`, đối chiếu với ảnh thật bằng `--mask resident,resident-head`):
    // trên MacBook Air M3 của Đàm, một cư dân kỷ 1 cao **trung vị 18,3 điểm ảnh CSS**. Ở cỡ đó
    // một chi rộng bằng 1/4 thân chiếm 2 tới 3 điểm ảnh — đủ để đọc ra HÌNH BÓNG ĐỔI THEO PHA
    // BƯỚC. Nếu con số ấy ra 6 (đúng như trên iPhone) thì cả khối này đã không đáng viết.
    //
    // ⚠️ KÍCH THƯỚC ĐI VÀO **MA TRẬN SCALE**, KHÔNG VÀO HÌNH HỌC — đó vẫn là điều làm instancing
    // đáng giá: mọi khối cùng khuôn dùng chung đúng một bộ đỉnh, dù chúng to nhỏ khác nhau.
    // ⚠️ NHƯNG KHÔNG CÒN "MỘT HỘP ĐƠN VỊ DUY NHẤT" NỮA (2026-08-23). Chỗ này từng ghi *"cả cộng
    // đồng nằm gọn trong MỘT `InstancedMesh` = MỘT lệnh vẽ"*, và câu ấy đã hết đúng: nay là một
    // mesh cho mỗi KHUÔN (3 tới 6 tuỳ kỷ). Sửa câu chú thích cùng lúc với mã là bắt buộc — một
    // lời giải thích sai là thứ phiên sau kế thừa rồi dựa vào (bài học Phase 3Y/8C).
    const body = lowDetail ? buildHumanBodyLowDetail(layout.era) : buildHumanBody(layout.era);
    const parts = body.parts;

    const residentMaterial = track(new MeshStandardMaterial({
      roughness: 0.88,          // vải vóc, không phải nhựa
      metalness: 0,
      envMap,
      envMapIntensity: ENV_DIFFUSE,
      transparent: dimmed,
      opacity: dimmed ? 0.62 : 1,
    }));

    // ⚠️ MỘT `InstancedMesh` CHO MỖI **KHUÔN**, KHÔNG PHẢI MỘT CHO CẢ CƠ THỂ NỮA.
    //
    // Trước 2026-08-23 cả cộng đồng đi qua đúng MỘT `BoxGeometry(1,1,1)`: rẻ nhất có thể (1 lệnh
    // vẽ) và cũng là lý do một cư dân đọc ra là **một chồng gạch** — chân hộp, tay hộp, đầu hộp,
    // nón hộp. Nay mỗi bộ phận khai một khuôn (`engine/city3d/humanShape.js`) và các bộ phận CÙNG
    // KHUÔN gộp chung một mesh, nên số lệnh vẽ = số khuôn kỷ ấy dùng: 3 (kỷ 9 · 13 · 14) tới 6
    // (kỷ 6, kỷ duy nhất có nón lá). `lowDetail` chỉ dùng `box` ⇒ vẫn đúng 1 lệnh vẽ.
    //
    // ⚠️ MỌI MESH CÙNG MANG TÊN `residents` — bắt buộc, không phải tiện tay. `city-preview.mjs
    // --mask residents` và `human-strip.mjs` hỏi cư dân THEO TÊN, và `sceneStats.test.js` khoá
    // `[...new Set(tên)] === ['residents']`. Đặt tên rời (`residents-limb`…) là làm mù mọi phép đo
    // đã dựng quanh cái tên ấy, và phép đo mật độ sẽ đọc cư dân thành nền trời (bài học 2026-08-19,
    // "sọt đen không tên" chiếm 15,6% khung hình).
    const shapesUsed = [];
    for (const part of parts) if (!shapesUsed.includes(part.shape)) shapesUsed.push(part.shape);

    /** Với mỗi bộ phận: mesh của nó, và chỗ đứng của nó trong mesh ấy. */
    const meshOf = new Array(parts.length);
    const slotOf = new Array(parts.length);
    const peopleMeshes = [];
    for (const shape of shapesUsed) {
      const idx = [];
      for (let k = 0; k < parts.length; k += 1) if (parts[k].shape === shape) idx.push(k);
      const mesh = new InstancedMesh(
        track(buildHumanShapeGeometry(shape)), residentMaterial, residents.length * idx.length);
      // ⚠️ ĐẶT TÊN LÀ ĐỂ **ĐO ĐƯỢC**, đúng lý do đã ghi ở khối mặt đất và mặt đường phía trên: muốn
      // hỏi "một cư dân cao bao nhiêu điểm ảnh trên màn hình Đàm" thì phải biết điểm ảnh nào là
      // người, và `TECH_DEBT #22` đã trả giá ba phase cho việc ĐOÁN chuyện đó bằng màu.
      // ⚠️ SỐ NHIỀU. `sceneStats.test.js` khoá cứng đúng chuỗi này; đổi sang số ít là đỏ ngay.
      mesh.name = 'residents';
      // Người quá nhỏ để đổ bóng ra hồn, nhưng NHẬN bóng thì có: đi vào bóng nhà là tối đi.
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      // ⚠️ Ma trận đổi mỗi khung hình — báo cho three biết để nó khỏi cố tối ưu bộ đệm tĩnh.
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      for (let t = 0; t < idx.length; t += 1) { meshOf[idx[t]] = mesh; slotOf[idx[t]] = t; }
      mesh.userData.partsPerResident = idx.length;
      peopleMeshes.push(mesh);
    }

    // Màu theo VAI của từng bộ phận. Sáu vai đọc thẳng từ bảng màu, mà bảng màu thì đọc `cloth`
    // từ `humanStyle.js` — một luật, một chỗ khai (xem `palette3d.js` mục `cloth`).
    const roleColor = {
      skin: palette.roles?.skin ?? palette.wall,
      cloth: palette.roles?.cloth ?? palette.roof,
      cloth2: palette.roles?.cloth2 ?? palette.roles?.trim ?? palette.roof,
      // Sợi mộc (nón lá, mũ rơm, khăn lanh) — xem `humanStyle.js` mục `HEAD_MATERIALS`.
      straw: palette.roles?.straw ?? palette.roles?.cloth2 ?? palette.roof,
      hair: palette.roles?.hair ?? palette.roles?.dark ?? palette.wall,
      gear: palette.roles?.gear ?? palette.roles?.wood ?? palette.wall,
    };
    for (let i = 0; i < residents.length; i += 1) {
      for (let k = 0; k < parts.length; k += 1) {
        const mesh = meshOf[k];
        mesh.setColorAt(i * mesh.userData.partsPerResident + slotOf[k],
          tint.setHex(roleColor[parts[k].role] ?? roleColor.cloth));
      }
    }
    for (const mesh of peopleMeshes) {
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      addMesh(mesh);
    }

    // Gọi mỗi khung hình khi có hoạt hoạ.
    // ⚠️ Nhận THỜI GIAN làm tham số chứ không tự cộng dồn — nhờ vậy rời tab nửa tiếng rồi quay lại
    // thì thành phố hiện ra ở đúng trạng thái đáng lẽ phải có, thay vì đứng im từ lúc bị đóng băng.
    placeResidents = (timeSeconds) => {
      for (let i = 0; i < residents.length; i += 1) {
        const spot = residentAt(residents[i], timeSeconds);
        if (!spot) continue;
        const { x, z } = cellToWorld(spot.x, spot.y, gridSize);

        // Chân đặt lên MẶT ĐƯỜNG, không phải mặt nền. Đường nhô cao hơn nền một chút (xem khối
        // đường phía trên) — bỏ qua chênh lệch này thì cư dân lún nửa bàn chân xuống mặt đường.
        // ⚠️ Cư dân là chỗ THỨ SÁU phải hỏi địa hình, và là chỗ dễ quên nhất vì nó nằm trong một
        // hàm chạy mỗi khung hình chứ không nằm cạnh năm chỗ kia. Quên thì cả thành phố đi bộ
        // xuyên qua sườn đồi ở cao độ 0.
        // ⚠️ VÀ KHÔNG CỘNG `bob` VÀO ĐÂY NỮA: cái nhún nay là HỆ QUẢ của chân trụ đang nghiêng,
        // `humanPose` đã nhét nó vào chiều cao hông rồi. Cộng thêm lần nữa là nhún hai lần.
        const feet = terrain.heightAt(spot.x, spot.y) + ROAD_SURFACE_Y;

        // ⚠️ KHỚP XOAY Ở TẦNG MA TRẬN, KHÔNG Ở `parts.js`. Nhà máy hình khối của công trình chỉ
        // xoay quanh trục đứng; thêm trục nghiêng vào đó là chạm vào nền móng của cả 75 công
        // trình để đổi lấy một thứ chỉ cư dân cần. Ở đây phép xoay vốn đã miễn phí.
        //
        // Ghép: T(người) · R_y(hướng đi) · [ T(gốc khớp) · R_z(góc khớp) · T(tâm hộp) · S(cỡ) ].
        // Viết bằng một `compose` duy nhất thay vì bốn phép nhân ma trận — rẻ hơn và ít chỗ sai
        // hơn, vì mọi thứ nằm trong một biểu thức đọc được một lượt.
        const pose = poseAt(body, spot.travelled);
        heading.setFromAxisAngle(UP, -spot.angle);
        for (let k = 0; k < parts.length; k += 1) {
          const part = parts[k];
          const joint = pose.joints[part.joint];
          // ⚠️ HAI TRỤC, VÀ THỨ TỰ GHÉP LÀ MỘT HỢP ĐỒNG VỚI TẦNG THUẦN: `Rx(b) · Rz(a)`, tức
          // nghiêng trước-sau xong rồi mới lật cả mặt phẳng ấy sang bên. `humanPose.rotateByJoint`
          // là bản viết bằng số học thuần của ĐÚNG phép này. Hai bên là hai công thức cho cùng một
          // luật (bẫy `sweep-score.mjs` ↔ `city-preview.mjs`, Phase 4G), và thứ giữ chúng khỏi trôi
          // là bài đối chiếu chéo trong `sceneGraphWiring.test.js` — nó dựng cảnh thật rồi so từng
          // toạ độ với `partCenterAt`. Đừng đổi thứ tự `premultiply` mà không chạy bài đó.
          jointSpin.setFromAxisAngle(FORWARD_AXIS, joint.a);
          jointRoll.setFromAxisAngle(TRAVEL_AXIS, joint.b);
          jointSpin.premultiply(jointRoll);
          // Tâm khối trong hệ CỤC BỘ: gốc khớp cộng phần tịnh tiến đã bị khớp xoay.
          // ⚠️ KHÔNG CÒN HỆ SỐ RÚT CHÂN NÀO. Trước ADR-057, chi treo vào hông bị rút ngắn giữa pha
          // đưa chân (đầu gối GIẢ) nên cả `rest.y` lẫn `part.h` phải nhân thêm một hệ số. Nay đầu
          // gối là một KHỚP THẬT: cẳng chân là một khối riêng treo vào `kneeL/R`, và chỗ đặt khớp
          // gối do `humanPose.js` giải ra từ chỗ đặt bàn chân. Không còn gì để rút.
          limb.set(part.rest.x, part.rest.y, part.rest.z).applyQuaternion(jointSpin);
          limb.set(joint.x + limb.x, joint.y + limb.y, joint.z + limb.z);
          // Rồi đưa cả cụm sang hệ THẾ GIỚI bằng hướng đi của người.
          limb.applyQuaternion(heading);
          position.set(x + limb.x, feet + limb.y, z + limb.z);
          rotation.copy(heading).multiply(jointSpin);
          scale.set(part.w, part.h, part.d);
          matrix.compose(position, rotation, scale);
          const mesh = meshOf[k];
          mesh.setMatrixAt(i * mesh.userData.partsPerResident + slotOf[k], matrix);
        }
      }
      for (const mesh of peopleMeshes) mesh.instanceMatrix.needsUpdate = true;
      // Trả quaternion về đơn vị: các chỗ khác trong file này dùng chung biến `rotation` và
      // ngầm giả định nó không xoay.
      rotation.identity();
    };
  }

  function updateResidents(timeSeconds) {
    placeResidents?.(timeSeconds);
  }
  updateResidents(0);

  // ── Ánh sáng: BA nguồn, cố ý khác nhiệt độ ────────────────────────────────
  // Đây là phần rẻ nhất mà ăn tiền nhất. Một đèn trắng duy nhất cho ra cảnh "đồ hoạ máy tính";
  // nắng ẤM xiên + trời LẠNH rọi xuống + đất ẤM hắt lên cho ra ba sắc khác nhau trên ba mặt của
  // cùng một khối, mà không tốn thêm một lệnh vẽ nào. Chính là cách hội hoạ dựng khối bằng màu.
  // ⚠️ TỈ LỆ GIỮA BA NGUỒN LÀ THỨ PHẢI GIỮ, KHÔNG PHẢI ĐỘ SÁNG TỔNG.
  // Bản đầu để đèn nền 0,92 + ambient 0,22 + nắng 1,15 — gần như nguồn nào cũng mạnh ngang nhau,
  // và ảnh chụp thử ra một cảnh phẳng lì không thấy bóng đâu. "Sáng đều" là kẻ thù của việc nhìn
  // ra hình khối: mắt đọc được khối là nhờ ba mặt của nó KHÁC ĐỘ SÁNG. Nắng phải áp đảo, đèn nền
  // chỉ vừa đủ để mặt khuất còn màu chứ không đen kịt.
  // ⚠️ LẦN 2 (Phase 3C) — HẠ ĐÈN NỀN, KHÔNG PHẢI TĂNG NẮNG. Đàm muốn "như tranh Phục Hưng", mà
  // đặc trưng số một của tranh thời đó là **chiaroscuro**: vùng sáng và vùng tối cách nhau XA,
  // hình khối hiện ra nhờ khoảng cách đó. Đèn nền là thứ trực tiếp giết chiaroscuro — nó rọi vào
  // đúng những mặt mà lẽ ra phải tối, kéo mọi thứ về giữa thang sáng. Tăng nắng mà không hạ đèn
  // nền thì chỉ được một bức sáng hơn, KHÔNG sâu hơn.
  //
  // ⚠️ NHƯNG CHỈ ĐÚNG VỚI THEME SÁNG — và bài học này phải trả giá bằng một ảnh chụp gần như đen
  // kịt. Lần đầu hạ đèn nền cho CẢ HAI theme, kết quả ở theme tối là một thành phố không đọc nổi:
  // bảng màu tối vốn đã đặt tường ở độ đậm 0,36 và mặt đất 0,22, hạ tiếp đèn nền thì không còn gì
  // để nhìn. **Chiaroscuro là KHOẢNG CÁCH giữa sáng và tối, không phải "tối đi".** Ở theme tối,
  // muốn giữ khoảng cách đó thì phải kéo vùng sáng LÊN, nghĩa là cần NHIỀU đèn nền hơn theme sáng
  // chứ không phải ít hơn.
  //
  // ⚠️ LẦN 3 (Phase 7A) — BẢN ĐỒ MÔI TRƯỜNG **THAY MỘT PHẦN** ĐÈN NỀN, KHÔNG CỘNG THÊM VÀO.
  // **Bản đồ môi trường CHÍNH LÀ một đèn nền.** Nó rọi từ mọi phía, y hệt `AmbientLight` +
  // `HemisphereLight`. Thêm nó mà giữ nguyên hai cái kia là bật ba đèn nền cùng lúc, và cái giá
  // phải trả là độ tươi cùng chiaroscuro — hai thứ Phase 3C đã tốn cả một phase để giành lấy.
  // ⇒ Hạ hai đèn cũ (0,34/0,07 → 0,10/0,02 ở theme sáng) rồi để môi trường bù vào phần thiếu ở
  // mức nhỏ (`ENV_DIFFUSE` = 0,12, chọn bằng phép đo — xem bảng số ở chỗ khai hằng số đó).
  // Đổi lại được một thứ tốt hơn hẳn: đèn nền cũ rọi ĐỀU mọi hướng (thông tin bằng 0 về không
  // gian), còn môi trường thì trên là trời, dưới là đất, một bên có quầng mặt trời — cùng một mức
  // sáng nhưng mặt nào của khối cũng ăn một sắc khác. Sáng bao quanh mà vẫn đọc ra hình khối.
  //
  // ⚠️ ĐỪNG SUY RA CẶP SỐ NÀY TỪ LÝ THUYẾT RỒI TIN. Lần đầu tôi hạ đúng hai con số này với lý lẽ
  // nghe rất vững ("môi trường là đèn nền thứ ba"), đo lại thì độ sáng gần như KHÔNG nhúc nhích —
  // vì thủ phạm thật lúc đó là `envMapIntensity` chưa được nối, môi trường đang rọi ở mức 1,0.
  // Lý lẽ đúng + con số sai vẫn ra một bản vá vô dụng. Chỉnh đèn thì phải chụp rồi đo, mọi lần.
  // ⚠️ LẦN 4 (Phase 9A) — **ÁNH SÁNG NGOÀI TRỜI CÓ HAI NHIỆT ĐỘ MÀU, VÀ CẢNH NÀY MỚI CÓ MỘT.**
  // Đây là bản sửa GỐC cho thứ Đàm gọi là "vẫn giống prototype", và nó được tìm ra bằng phép đo
  // chứ không bằng cảm giác. Đo trên ảnh chụp thật (kỷ 11, 15 giờ):
  //     trời góc màu 38 · đất nắng góc màu 40 · ĐẤT TRONG BÓNG góc màu 40
  // Ba thứ đó CÙNG MỘT GÓC MÀU. Cả khung hình chỉ còn một sắc nâu-cam, khác nhau mỗi độ sáng —
  // đó đúng là định nghĩa của một bức ảnh đơn sắc, và không một chi tiết hình học nào cứu được.
  //
  // Thủ phạm KHÔNG phải bảng màu. Đo tiếp thì đèn bán cầu đang mang đúng màu lam trời cần có
  // (`#b9c6dd`, góc màu 218) — **nhưng cường độ của nó là 0,10 trong khi nắng là 2,15**, tức
  // **tỉ lệ 9:1**, cộng thêm 0,12 môi trường TRUNG TÍNH. Ánh lam ấy có tồn tại; nó chỉ chiếm 4%
  // tổng sáng nên không ai nhìn thấy bao giờ. Ngoài đời, ánh trời trên một mặt phẳng ngang bằng
  // khoảng **1/5 nắng trực tiếp** — tức đúng tầm 5:1. Ở 9:1 thì vùng khuất nắng không còn được
  // trời rọi vào nữa, nên nó tụt xuống thành một mảng ĐEN thay vì một mảng LAM.
  //
  // ⇒ Và đây là chỗ phải nói cho sòng phẳng: con số 0,10 ấy do **chính Phase 7A** đặt, với lý lẽ
  // "môi trường là đèn nền thứ ba nên phải hạ hai đèn cũ". Nhưng ghi chú ngay phía trên đã tự thú
  // rằng lý lẽ đó **đo ra không đúng** — thủ phạm thật lúc ấy là `envMapIntensity` chưa được nối,
  // môi trường đang rọi ở mức 1,0. Bản vá đúng (gắn `envMap` vào từng vật liệu) đã tự giải quyết
  // việc đó; phần hạ đèn bán cầu là **thiệt hại kèm theo của một giả thuyết đã bị bác**, và nó ở
  // lại thêm nhiều phase. Cùng hình dạng với ADR-019: một kết luận hết đúng vì tiền đề của nó bị
  // gỡ, mà không ai quay lại xem.
  //
  // ⚠️ VÌ SAO DỒN VÀO BÁN CẦU CHỨ KHÔNG PHẢI `AmbientLight`. `AmbientLight` rọi ĐỀU tuyệt đối —
  // nó cộng đúng một hằng số vào mọi mặt, mang **thông tin bằng 0** về không gian, và đó chính là
  // thứ đã tạo ra thất bại "pastel như sữa" mà dự án đã bác một lần. Đèn bán cầu thì trên là trời
  // lam, dưới là đất ấm: nó nâng vùng tối LÊN mà vẫn cho mỗi mặt của khối một sắc khác, nên hình
  // khối càng rõ chứ không nhoè đi. Vì vậy ambient tụt gần về 0 và toàn bộ phần nâng dồn vào bán
  // cầu — **tổng sáng vùng tối tăng, mà lượng ánh sáng KHÔNG mang thông tin thì giảm.**
  //
  // ⚠️ CHIAROSCURO LÀ KHOẢNG CÁCH, KHÔNG PHẢI "TỐI ĐI" (luật cũ, vẫn áp dụng): nâng sàn mà giữ
  // nguyên trần thì khoảng cách hẹp lại.
  //
  // ⭐ ĐÈN TRỜI PHÁT BIỂU BẰNG **TỈ LỆ VỚI NẮNG**, KHÔNG PHẢI BẰNG MỘT CON SỐ RỜI (Phase 9B).
  //
  // ⚠️ ĐOẠN CHÚ THÍCH NGAY TRÊN ĐÂY TỪNG KẾT THÚC BẰNG CÂU *"nên nắng GIỮ NGUYÊN 2,15 — mục tiêu
  // là vùng tối chuyển từ ĐEN sang LAM"*. Ý định đúng. Nhưng nó **chưa bao giờ được đo**, và đo ra
  // thì nó không đạt: sàn độ sáng 0,029–0,109 và **8,2–20,8% khung hình bị nghiền dưới ngưỡng đọc
  // được** ở kỷ 7/11/13 (`scripts/shadow-score.mjs`). Vùng tối vẫn là ĐEN, không phải LAM. Đúng
  // họ với bài học Phase 4G: *một câu tự trấn an cũng phải được kiểm như một con số* — khác ở chỗ
  // lần này câu ấy nằm trong chú thích của mã sản phẩm, nơi không ai nghĩ tới việc phải kiểm.
  //
  // ⚠️ VÀ VÌ SAO PHẢI LÀ MỘT TỈ LỆ. Trước bản này, đèn bán cầu (0,34) và nắng (2,15) là hai hằng
  // số KHÔNG biết nhau. Nhưng thứ quyết định bóng đổ đen tới đâu không phải độ sáng của đèn nền —
  // nó là **khoảng cách giữa đèn nền và nắng**. Một con số tuyệt đối không diễn đạt được một luật
  // nói về QUAN HỆ, và khi ai đó chỉnh nắng vì một lý do khác thì bóng đổ tối đi trong im lặng.
  // Đó ĐÚNG là chuyện đã xảy ra ở đây: chú thích phía trên tự thú rằng Phase 7A hạ đèn bán cầu
  // theo một giả thuyết sau đó bị bác, *"và nó ở lại thêm nhiều phase"*. Cùng hình dạng với lỗi
  // mặt đường ở Phase 7D — cũng một lời hứa dạng "… hơn …" bị viết thành một hằng số.
  // ⇒ Nay đèn trời **bám theo nắng**: nắng đổi thì nó tự đi theo, mãi mãi, không cần ai nhớ.
  //
  // ⚠️ TỈ LỆ NÀY CHỌN BẰNG BẢNG ĐO, KHÔNG BẰNG CẢM GIÁC. Chỉ tiêu NGHIỆM THU là "nâng sàn mà
  // KHÔNG mất màu" — vì cách chữa ngây thơ (bật đèn nền lên một mình) đã thất bại một lần ở
  // Phase 7A với đúng triệu chứng *"pastel như sữa"*, và thứ bắt được nó lúc ấy KHÔNG phải độ
  // sáng mà là **độ tươi** (tụt 34%). Đo bằng `scripts/shadow-score.mjs` trên kỷ 7@15h / 11@15h /
  // 13@12h — đây là số của ĐÚNG cấu hình đang chạy (`ENV_DIFFUSE` giữ nguyên 0,12):
  //
  //     tỉ lệ 0,158 (cũ) → sàn 0,107/0,029/0,109 · nghiền 13,4/16,9/8,2% · tươi 0,131/0,117/0,082
  //     tỉ lệ 0,41  ⭐   → sàn 0,170/0,054/0,160 · nghiền  0,2/11,1/2,7% · tươi 0,136/0,114/0,082
  //
  // Độ tươi **đứng yên** (+4%/−3%/±0%) và khoảng cách sáng-tối còn NHÍCH LÊN (0,480 → 0,503) —
  // tức đây KHÔNG phải cái bẫy sữa của Phase 7A. Lý do nó khác: lần ấy đèn nền được bật lên một
  // mình, lần này nắng đi lên CÙNG — chính là điều mà một TỈ LỆ bắt buộc phải xảy ra.
  //
  // ⚠️ BẢNG DÒ 4 NẤC LÀM RA TỈ LỆ NÀY CÓ VẶN KÈM `ENV_DIFFUSE` (0,12 → 0,20), nên hai nấc giữa
  // của nó KHÔNG được chép vào đây: chúng trộn hai cần gạt nên không nói được cần nào có tác dụng.
  // Bản cuối giữ `ENV_DIFFUSE` = 0,12 và vẫn ra gần đúng bộ số của nấc mạnh nhất ⇒ phần nâng là
  // do TỈ LỆ, còn bản đồ môi trường gần như không đóng góp. `ENV_DIFFUSE` có bảng đo riêng và
  // quyết định riêng (xem chú thích của nó) — không gộp vào đây.
  //
  // ⚠️ KỶ 11 VẪN CÒN 11,1% BỊ NGHIỀN, VÀ ĐÓ KHÔNG PHẢI LỖI ÁNH SÁNG. Phép thử ngược (tắt hẳn
  // `sun.castShadow`) cho thấy **9,6 trong 11,1 điểm phần trăm ấy vẫn còn nguyên** — tức phần lớn
  // mảng đen của kỷ 11 là MẶT ĐƯỜNG (nhựa đường `#3a3b3e` render ra độ sáng 0,113 trong khi mặt
  // đất 0,406), không phải bóng đổ. Đó là một khuyết tật của bảng màu đường, có gốc riêng và bản
  // vá riêng — xem `TECH_DEBT.md` #30. Đừng cố chữa nó bằng cách nâng thêm đèn.
  //
  // ⚠️ THEME TỐI GIỮ TỈ LỆ RIÊNG, CAO HƠN (0,75). Đó không phải sự thiếu nhất quán: theme tối là
  // một CẢNH KHÁC (chạng vạng/đêm), nơi bầu trời chiếm phần lớn ánh sáng còn "nắng" chỉ là ánh
  // trăng. Giữ đúng tỉ lệ cũ giữa hai theme (1,84 lần) để không vô tình dựng lại cảnh đêm — thứ đã
  // được chỉnh riêng ở Phase 3M và 5A.
  const SUN_BASE = palette.isDark ? 1.96 : 2.45;
  const SKY_FILL_RATIO = palette.isDark ? 0.75 : 0.41;

  const hemisphere = new HemisphereLight(
    palette.lights?.skyDome ?? palette.sky,
    palette.lights?.bounce ?? palette.ground,
    SUN_BASE * SKY_FILL_RATIO * fillEnergy,
  );
  scene.add(hemisphere);

  const ambient = new AmbientLight(palette.lights?.bounce ?? palette.sky,
    (palette.isDark ? 0.05 : 0.03) * fillEnergy);
  scene.add(ambient);

  const sun = new DirectionalLight(palette.lights?.sun ?? palette.sun, SUN_BASE * sunEnergy);
  // Hướng lấy từ `SUN_DIRECTION` — CÙNG hướng đã nướng quầng sáng vào vòm trời ở trên. Nắng mạnh
  // hơn bản trước (1,9 → 2,15) vì đèn nền đã bị hạ xuống: giữ TỔNG sáng gần như cũ nhưng kéo rộng
  // khoảng cách giữa mặt hứng nắng và mặt khuất — đó chính là chiaroscuro.
  // 1,4 × lưới: đủ xa để cả thành phố nằm gọn giữa `near` và `far` của khung bóng (1 … 3 × lưới),
  // kể cả công trình cao nhất ở góc xa nhất.
  sun.position.copy(sunDir).multiplyScalar(gridSize * 1.4);
  sun.castShadow = true;

  // ⚠️ ĐÂY LÀ DÒNG QUAN TRỌNG NHẤT CẢ FILE. Mặc định của three là `true` = vẽ lại shadow map mỗi
  // khung hình, kể cả khi không có gì nhúc nhích. Với render-on-demand thì đó là lãng phí thuần
  // tuý; với điện thoại thì đó là nóng máy. Ta tự bật `needsUpdate` khi cảnh THỰC SỰ đổi.
  sun.shadow.autoUpdate = false;
  sun.shadow.needsUpdate = true;
  // ⚠️ ĐẶT CỠ Ở ĐÂY, LÚC DỰNG — không phải sau khi cảnh đã trả về. Bản cũ để `CityScene3D.jsx` gọi
  // `setScalar` sau `createCityScene`, nên bất kỳ ai dựng cảnh mà không biết dòng đó (đúng là trang
  // xem thử) sẽ lặng lẽ nhận mặc định 512 của three. Cảnh tự biết cỡ bóng của mình là đúng chỗ.
  sun.shadow.mapSize.setScalar(isMobile ? SHADOW_MAP_MOBILE : SHADOW_MAP_DESKTOP);

  // Khung bóng bó SÁT đúng lưới — rộng thừa thì mất độ nét, thiếu thì cụt bóng ở rìa.
  // ⚠️ HỆ SỐ 0,8 ĐẾN TỪ NHÁNH PHASE 19–21, VÀ NÓ THẮNG CON SỐ 0,75 CỦA `main` VÌ MỘT LÝ DO CỤ THỂ:
  // Phase 21 §4 cho thành phố LAN RA NGOÀI ô lưới, nên khối đổ bóng xa tâm nhất đi tới bán kính
  // 9,2275 — xa hơn cả `reach` mà 0,75 cho ra (0,75 × 12 = 9,00). Giữ 0,75 sau khi gộp là cắt cụt
  // bóng ở vành ngoài. Chỗ dư 4% của 0,80 (9,60 so với 9,2275) là toàn bộ biên an toàn.
  // ⚠️ ĐỪNG SIẾT THÊM, và cũng đừng siết xuống 0,58: đã thử (2026-08-27, trên `main` với bố cục CŨ)
  // và HOÀN TÁC — ảnh kỷ 11 lúc 16 giờ (bóng dài nhất) không đọc ra khác biệt nào, trong khi tấm
  // đất nhận bóng rộng tới ±9,5 nên siết là mua rủi ro cắt bóng để đổi lấy một thứ không nhìn thấy.
  // Độ nét đã lấy bằng đường khác: bản đồ bóng 2048 → 4096 (xem `SHADOW_MAP_DESKTOP`).
  const reach = gridSize * 0.8;
  sun.shadow.camera.left = -reach;
  sun.shadow.camera.right = reach;
  sun.shadow.camera.top = reach;
  sun.shadow.camera.bottom = -reach;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = gridSize * 3;
  sun.shadow.bias = -0.0014;            // chống sọc vằn tự-đổ-bóng trên mặt nền phẳng
  sun.shadow.normalBias = 0.02;         // chống hở chân bóng ở mặt nghiêng (mái dốc)
  scene.add(sun);
  scene.add(sun.target);

  // ── Đèn trong nhà hắt ra sân (chỉ khi trời tối) ───────────────────────────
  // Ô cửa sáng ở trên vẽ bằng vật liệu TỰ PHÁT SÁNG — nó rực lên nhưng không rọi ra ngoài một tí
  // nào, nên chân tường vẫn tối om và cả dãy cửa đọc ra như hình dán trên một khối đen. Vài vũng
  // sáng ấm dưới chân công trình là chi tiết biến bức tranh đêm từ "có đèn" thành "có người ở".
  //
  // ⚠️ NGÂN SÁCH: đèn điểm là nguồn sáng DUY NHẤT trong cảnh này tính tiền theo TỪNG ĐIỂM ẢNH —
  // hai nguồn kia (bán cầu, ambient) rẻ như nhau ở mọi độ phân giải, còn mỗi đèn điểm thêm một
  // vòng lặp vào shader của MỌI mặt nó với tới. Ban đêm lại đúng lúc cảnh vẽ liên tục 30 khung/giây
  // vì cư dân đang đi, nên chi phí này là chi phí THẬT, không phải chỉ ở khung đầu.
  // Vì vậy: số lượng do bên gọi quyết (`maxLamps`, điện thoại truyền số nhỏ hơn), chỉ đặt ở những
  // công trình LỚN nhất — chỗ mắt nhìn vào, và `distance` hữu hạn để three loại sớm các mặt ngoài
  // tầm. Bớt đèn thì vẫn còn ô cửa sáng, chỉ thiếu vũng sáng dưới chân — mất ít, đổi lại chắc chắn.
  const lampEnergy = Number.isFinite(daylight?.lampEnergy) ? daylight.lampEnergy : 0;
  const lampBudget = lowDetail ? 0 : Math.max(0, Math.floor(maxLamps));
  let lampCount = 0;
  if (lampEnergy > 0 && lampBudget > 0 && buildings.length > 0) {
    const lampColor = palette.lights?.lamp ?? palette.roles?.glassLit ?? palette.sun;
    // Chọn theo cấp rồi tới độ hiếm: công trình to nhất là nơi đáng sáng đèn nhất. Sắp xếp trên
    // BẢN SAO — `layout.buildings` là dữ liệu dùng chung, đảo thứ tự nó sẽ làm bố cục nhảy lung tung.
    const RARITY_WEIGHT = { epic: 3, rare: 2, common: 1 };
    const lit = [...buildings]
      .sort((a, b) => (
        (b.level ?? 1) - (a.level ?? 1)
        || (RARITY_WEIGHT[b.rarity] ?? 0) - (RARITY_WEIGHT[a.rarity] ?? 0)
        // Chốt bằng toạ độ để thứ tự TẤT ĐỊNH: cùng một thành phố phải sáng đúng những ô đó,
        // mọi lần mở app — đúng bất biến "bảo tàng bất động" của ADR-007.
        || a.x - b.x || a.y - b.y
      ))
      .slice(0, lampBudget);
    for (const building of lit) {
      const { x, z } = cellToWorld(building.x, building.y, gridSize);
      const lamp = new PointLight(lampColor, 5.2 * lampEnergy, gridSize * 0.62, 2);
      // Đặt THẤP (0,45) chứ không đặt trên nóc: ánh sáng phải liếm xuống mặt đường và chân tường
      // hàng xóm thì mới thành vũng sáng; treo cao thì nó chỉ rọi lên mái chính công trình đó.
      lamp.position.set(x, 0.45, z);
      scene.add(lamp);
      lampCount += 1;
    }
  }

  let disposed = false;
  function dispose() {
    // ⚠️ Phải chịu được gọi NHIỀU LẦN: React StrictMode ở dev mount → unmount → mount, và
    // đường mất-WebGL-context cũng gọi dọn trước khi effect kịp chạy hàm dọn của mình.
    if (disposed) return;
    disposed = true;
    for (const mesh of meshes) {
      scene.remove(mesh);
      mesh.dispose?.();
    }
    for (const resource of disposables.splice(0)) resource.dispose?.();
    scene.clear();
  }

  // ĐO một lần, ngay khi cảnh đã dựng xong và trước khi có ai kịp đổi nó.
  const geometry = measureSceneGeometry(scene);

  return {
    scene,
    sun,
    dispose,
    updateResidents,
    /** Có gì đang chuyển động không — bên gọi dùng để quyết định có cần vẽ liên tục hay không. */
    isAnimated: residents.length > 0,
    /**
     * Hộp bao để dò xem ngón tay chỉ vào công trình nào (`engine/city3d/pick.js`).
     * ⚠️ Chỉ là DỮ LIỆU — không phải đối tượng GPU, không tốn lệnh vẽ nào, không cần dọn ở
     * `dispose()`. Cảnh nào không cần chạm thì bỏ qua mảng này là xong.
     */
    pickTargets,
    /**
     * Hộp bao của mọi khối đứng trên đất — camera cận cảnh dùng để tránh bay vào trong phố.
     * Cùng tính chất với `pickTargets`: thuần dữ liệu, không tốn gì.
     */
    blockers,
    stats: {
      groundTiles: groundCells.length,
      roads: roads.length,
      buildings: buildings.length,
      // Đếm RIÊNG khỏi `buildings`: HUD phải phân biệt được "5 landmark" với "30 nhà dân", vì hai
      // con số ấy lớn lên theo hai luật khác hẳn nhau và khi máy nóng thì cần biết cái nào đang phình.
      dwellings: (layout.dwellings ?? []).length,
      props: cityParts.filter((it) => it.kind === 'prop').length,
      residents: residents.length,
      // Đèn điểm là nguồn sáng DUY NHẤT ở đây tính tiền theo từng điểm ảnh — hiện lên HUD để lúc
      // Đàm chụp màn hình báo máy nóng, ta biết ngay lúc đó có mấy cái đang bật.
      lamps: lampCount,
      // ⚠️ ĐẾM CẢ CẢNH, KHÔNG TỰ TÍNH NỮA (xem `measureSceneGeometry` ở đầu file để biết vì sao —
      // công thức tự tính cũ đã báo THIẾU 56% suốt từ Phase 9A mà không có gì đỏ lên).
      // Hai con số phẳng dưới đây là TỔNG, và chúng suy ra từ ĐÚNG một phép đo ở dòng trên — không
      // có đường nào để tổng và phần tách trôi khỏi nhau.
      drawCalls: geometry.drawCalls.total,
      triangles: geometry.triangles.total,
      /**
       * Ba con số: `thành phố` · `nền` (vòm trời + rặng núi) · `tổng`.
       * ⚠️ Đây là số ĐẾM TRONG CẢNH, tức TRƯỚC khi three cắt bỏ khối nằm ngoài khung hình. Số máy
       * THẬT SỰ vẽ nằm ở `renderer.info.render` và có thể NHỎ HƠN — đó là đúng, không phải lỗi.
       */
      geometry,
    },
    /** Gọi khi cảnh đổi hình dạng (đổi kỷ, xây thêm nhà) — bóng mới được vẽ lại. */
    invalidateShadows() { sun.shadow.needsUpdate = true; },
  };
}
