/**
 * sceneGraph.js — dựng cảnh 3D từ bố cục trừu tượng mà `computeCityLayout` trả về.
 *
 * Bốn luật hiệu năng, đều là chỗ dễ mất nhiều nhất:
 *   1. **Nền và đường đi qua `InstancedMesh`** — 144 ô nền vẽ rời là 144 lệnh vẽ; gộp còn 1.
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
  BoxGeometry,
  BufferAttribute,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  Fog,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PMREMGenerator,
  PointLight,
  Quaternion,
  Scene,
  SphereGeometry,
  Vector3,
} from 'three';

import { materialProfile } from '../../../engine/city3d/materials';
import { buildBuildingSpec, buildScaffoldSpec } from '../../../engine/city3d/buildingSpec';
import { buildPropSpec } from '../../../engine/city3d/propSpec';
import { placeBounds, specBounds } from '../../../engine/city3d/pick';
import { RESIDENT_HEIGHT, buildResidents, residentAt } from '../../../engine/city3d/residents';
import { fogRangeFor, sunDirectionAt } from '../../../engine/city3d/daylight';
import { buildMergedGeometry } from './geometryFactory';

/**
 * Hệ số phóng to công trình so với ô lưới.
 * ⚠️ Lớn hơn 1 là CỐ Ý: tầng mô tả nghĩ theo đơn vị "một ô", nhưng năm công trình rải trên lưới
 * 12×12 mà mỗi cái chỉ chiếm đúng một ô thì thành phố trông như năm hạt đậu trên bàn cờ (đã thấy
 * tận mắt ở ảnh chụp thử đầu tiên). Các khu đất cách nhau ít nhất 2,8 ô nên 1,3 vẫn an toàn
 * tuyệt đối — kỳ quan rộng nhất (1,7 ô) nở ra 2,2 ô, vẫn chưa chạm hàng xóm.
 */
const BUILDING_SCALE = 1.3;

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

const GROUND_THICKNESS = 0.22;

/**
 * Đường nhô cao hơn mặt nền bao nhiêu. Đủ để không chọi mặt (z-fighting) mà mắt không thấy bậc.
 * ⚠️ Tách thành hằng số vì CƯ DÂN cũng phải đứng trên đúng mặt phẳng này. Để hai nơi tự viết số
 * riêng thì chỉ cần một lần chỉnh là cả thành phố lún nửa bàn chân xuống đường mà không ai hiểu
 * vì sao.
 */
const ROAD_LIFT = 0.014;
/** Cao độ MẶT TRÊN của đường — nơi bàn chân cư dân chạm vào. */
const ROAD_SURFACE_Y = ROAD_LIFT;
/**
 * Bề rộng NGÕ PHỐ so với đại lộ. 0,64 chứ không phải 0,85: chênh lệch nhỏ hơn thì ở cỡ hiển thị
 * thật (thẻ cảnh cao ~300px trên điện thoại) mắt không đọc ra hai hạng đường, và cả mạng lưới lại
 * quay về "tấm lưới đều tăm tắp" — đúng thứ mà việc thêm đường sinh ra để chữa.
 * Cũng KHÔNG hẹp hơn nữa: dưới ~0,55 thì ngõ mảnh như sợi chỉ và cư dân đi bộ trên đó sẽ lộ ra
 * ngoài mép đường (họ vẫn đi đúng tâm ô).
 */
const LANE_WIDTH = 0.64;
/** Số tam giác của một hộp — dùng để tính ngân sách hiển thị trên HUD. */
const TRIANGLES_PER_BOX = 12;

/** Trục đứng, dùng lại cho mọi phép xoay người — tạo mới trong vòng lặp là rác cho bộ dọn. */
const UP = new Vector3(0, 1, 0);

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
}

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
 * @returns {{texture:object, dispose:function}|null} `null` khi không có renderer (test, SSR)
 */
function createSkyEnvironment(renderer, skyLook, groundColor) {
  if (!renderer || typeof renderer.getContext !== 'function') return null;
  let pmrem = null;
  let target = null;
  const probeGeometry = new SphereGeometry(8, 16, 8);
  const probeMaterial = new MeshBasicMaterial({ vertexColors: true, side: BackSide, fog: false });
  try {
    paintSkyGradient(probeGeometry, 8, { ...skyLook, groundColor });
    const probeScene = new Scene();
    probeScene.add(new Mesh(probeGeometry, probeMaterial));
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
 */
export function createCityScene({
  layout, palette, dimmed = false, lowDetail = false, stats = {}, still = false, daylight = null,
  maxLamps = 3, renderer = null,
}) {
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
  // khác. Sáng sớm là buổi DUY NHẤT có sương đọng; xem giải thích đầy đủ ở `fogRangeFor`.
  const fogRange = fogRangeFor(daylight?.haze ?? 0, gridSize);
  scene.fog = new Fog(palette.sky2?.horizon ?? palette.background, fogRange.near, fogRange.far);

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
  const tileMaterial = track(new MeshStandardMaterial({
    roughness: 0.96,
    metalness: 0,
    envMap,
    envMapIntensity: ENV_DIFFUSE,
    transparent: dimmed,
    opacity: dimmed ? 0.62 : 1,
  }));

  // Dùng lại vài đối tượng tạm cho mọi thực thể — tạo mới trong vòng lặp là rác cho bộ dọn.
  const matrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3(1, 1, 1);
  const tint = new Color();

  function buildInstances(items, geometry, place, { castShadow, receiveShadow }) {
    if (items.length === 0) return null;
    const mesh = new InstancedMesh(geometry, tileMaterial, items.length);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    items.forEach((item, index) => {
      const spec = place(item, index);
      position.set(spec.x, spec.y, spec.z);
      // `sx`/`sz` tuỳ chọn — mặc định 1 nên mọi chỗ gọi cũ giữ nguyên hành vi. Thêm vào để mặt
      // đường phân biệt được ĐẠI LỘ với NGÕ PHỐ bằng bề rộng; bề rộng đọc được từ xa hơn nhiều so
      // với chênh lệch màu, ở đúng cỡ hiển thị mà thành phố này sống.
      scale.set(spec.sx ?? 1, spec.height, spec.sz ?? 1);
      matrix.compose(position, rotation, scale);
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, tint.setHex(spec.color));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }

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
  scene.add(skyMesh);
  meshes.push(skyMesh);

  // ── Vùng đất bao quanh ────────────────────────────────────────────────────
  // ⚠️ ĐÂY LÀ THỨ TÁCH "MỘT NƠI CHỐN" KHỎI "MÔ HÌNH TRÊN BÀN".
  // Lưới 12×12 kết thúc bằng một mép vuông sắc lẹm, và ảnh chụp thử cho thấy đúng cảm giác một
  // miếng bìa đặt giữa hư không — dù mọi thứ TRÊN miếng bìa đó đều đã đẹp. Một mặt đất rộng chạy
  // xa khỏi lưới, đậm hơn chút và tan vào sương ở rìa, làm thành phố trở thành một điểm TRONG một
  // vùng đất thay vì một vật thể lơ lửng. Rẻ đúng 12 tam giác.
  const outskirtsSize = gridSize * 6;
  const outskirtsGeometry = track(new BoxGeometry(outskirtsSize, GROUND_THICKNESS, outskirtsSize));
  const outskirtsMaterial = track(new MeshStandardMaterial({
    color: palette.outskirts ?? palette.groundAlt,
    roughness: 0.98,
    metalness: 0,
    envMap,
    envMapIntensity: ENV_DIFFUSE,
  }));
  const outskirts = new Mesh(outskirtsGeometry, outskirtsMaterial);
  // Thấp hơn nền thành phố một chút → lưới thành phố thành một thềm đất cao, có gờ.
  outskirts.position.y = -GROUND_THICKNESS - 0.06;
  // ⚠️ KHÔNG nhận bóng, và đây KHÔNG phải tối ưu hiệu năng — nó là bắt buộc để đúng.
  // Khung bóng đổ chỉ bó quanh lưới 12×12 (`reach` bên dưới), còn mặt đất này rộng gấp bảy lần.
  // Mọi điểm nằm NGOÀI khung đó tra vào bản đồ bóng sẽ lấy nhầm giá trị ở mép và bị coi là đang
  // trong bóng — kết quả là cả vùng đất quanh thành phố tối đen (đã thấy tận mắt ở ảnh chụp thử).
  // Ngoài lưới cũng chẳng có gì đổ bóng, nên tắt là vừa đúng vừa rẻ.
  outskirts.receiveShadow = false;
  scene.add(outskirts);
  meshes.push(outskirts);

  // ── Nền: 144 ô → MỘT lệnh vẽ ──────────────────────────────────────────────
  const groundCells = layout.ground ?? [];
  const groundColors = palette.groundShades ?? [palette.ground, palette.groundAlt];
  addMesh(buildInstances(
    groundCells,
    track(new BoxGeometry(TILE_UNIT * 0.99, GROUND_THICKNESS, TILE_UNIT * 0.99)),
    (cell) => {
      const { x, z } = cellToWorld(cell.x, cell.y, gridSize);
      return {
        x, z,
        y: -GROUND_THICKNESS / 2,
        height: 1,
        color: groundColors[cell.variant % groundColors.length],
      };
    },
    // Ô nền phẳng: nhận bóng thì đẹp, đổ bóng lên nhau thì chẳng thấy gì mà rất tốn.
    { castShadow: false, receiveShadow: true },
  ));

  // ── Đường sá ──────────────────────────────────────────────────────────────
  const roads = (layout.props ?? []).filter((prop) => prop.kind === 'road');
  addMesh(buildInstances(
    roads,
    track(new BoxGeometry(TILE_UNIT, GROUND_THICKNESS, TILE_UNIT)),
    (road) => {
      const { x, z } = cellToWorld(road.x, road.y, gridSize);
      // Thứ bậc đường: `variant` 0 = đại lộ/ngã tư (rộng hết ô) · 1 = phố dọc (hẹp bề ngang) ·
      // 2 = phố ngang (hẹp bề sâu). Xem `ROAD_CELLS` trong `cityLayout.js`.
      const lane = road.variant === 1 || road.variant === 2;
      return {
        x, z,
        y: -GROUND_THICKNESS / 2 + ROAD_LIFT,   // nhô lên tí xíu để không chọi mặt nền
        height: 1,
        sx: road.variant === 1 ? LANE_WIDTH : 1,
        sz: road.variant === 2 ? LANE_WIDTH : 1,
        // Ngõ phố tối hơn đại lộ một chút — đại lộ mòn hơn vì đi lại nhiều. Chênh lệch nhỏ thôi:
        // bề rộng mới là thứ mắt đọc, màu chỉ để nhấn thêm.
        color: lane
          ? (palette.roles?.stone ?? palette.road ?? palette.edge)
          : (palette.road ?? palette.roles?.stone ?? palette.edge),
      };
    },
    { castShadow: false, receiveShadow: true },
  ));

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
  const placements = buildings.map((building) => {
    const { x, z } = cellToWorld(building.x, building.y, gridSize);
    return {
      x, z, y: 0,
      scale: BUILDING_SCALE,
      // Xoay cả công trình theo bội số 90° cho phố khỏi xếp hàng răm rắp. Bội số của góc vuông
      // chứ không phải góc bất kỳ: nhà quay chéo so với lưới đường trông như bị đặt ẩu.
      ry: ((building.x + building.y) % 4) * (Math.PI / 2),
      spec: buildBuildingSpec({
        bpId: building.bpId,
        era: layout.era,
        type: building.type,
        rarity: building.rarity,
        level: building.level,
      }),
    };
  });

  buildings.forEach((building, index) => {
    addPickTarget(placements[index], { kind: 'building', bpId: building.bpId });
  });

  // Công trình đang xây (nếu bố cục có) → giàn giáo dựng cao dần theo tiến độ.
  for (const scaffold of layout.scaffolds ?? []) {
    const { x, z } = cellToWorld(scaffold.x, scaffold.y, gridSize);
    const placement = {
      x, z, y: 0, ry: 0, scale: BUILDING_SCALE,
      spec: buildScaffoldSpec({ bpId: scaffold.bpId, era: layout.era, progress: scaffold.progress }),
    };
    placements.push(placement);
    // Giàn giáo cũng chạm được: đó chính là công trình Đàm đang chờ, nên nó phải là thứ dễ hỏi
    // "còn bao lâu nữa?" nhất trong cả cảnh — chứ không phải thứ duy nhất không bấm được.
    addPickTarget(placement, { kind: 'scaffold', bpId: scaffold.bpId });
  }

  // ── Cảnh vật: cây, đá, đèn, mặt nước, ruộng ──────────────────────────────
  // `deriveProps` đã sinh sẵn danh sách này từ Phase 1 (bộ vẽ 2D dùng từ lâu) nhưng bộ vẽ 3D
  // trước nay mới chỉ đọc mỗi đường sá. Gộp chúng vào CÙNG khối hình học với công trình để không
  // tốn thêm lệnh vẽ nào — chúng đều đứng yên nên chẳng có lý do gì phải tách ra.
  const scatter = (layout.props ?? []).filter((prop) => prop.kind !== 'road');
  for (const prop of scatter) {
    const { x, z } = cellToWorld(prop.x, prop.y, gridSize);
    placements.push({
      x, z, y: 0,
      // Xoay tự do — cây cối mà thẳng hàng theo lưới thì lộ ngay ra là máy đặt.
      ry: (prop.variant + prop.x * 0.7 + prop.y * 1.3) % (Math.PI * 2),
      spec: buildPropSpec({
        kind: prop.kind,
        era: layout.era,
        seed: `${layout.era}|${prop.kind}|${prop.x}|${prop.y}|${prop.variant}`,
      }),
    });
  }

  const merged = buildMergedGeometry(placements, palette, {
    skipDeco: lowDetail,
    // Trời đã tối ⇒ tách ô cửa ra khối "tự phát sáng" riêng. Ban ngày `null` ⇒ không tách, không
    // tốn thêm lệnh vẽ nào.
    glowRole: daylight?.windowsLit ? 'glass' : null,
    era: layout.era,
  });
  let buildingTriangles = 0;
  if (merged) {
    buildingTriangles = merged.triangles + merged.glowTriangles;
    if (merged.geometry) {
      track(merged.geometry);
      // ⚠️ MẢNG VẬT LIỆU DỰNG TỪ CHÍNH `merged.families`, KHÔNG tự liệt kê lại.
      // Nhà máy hình học đã đánh số nhóm theo thứ tự mảng đó; liệt kê lại ở đây là tạo ra công
      // thức thứ hai cho cùng một luật, và triệu chứng sẽ là mái nhà mang độ bóng của mặt nước —
      // mắt thấy ngay mà đọc code thì không, vì hai bên đều "đúng" theo cách hiểu riêng.
      const buildingMaterial = merged.families.map((family) => {
        const profile = materialProfile(family);
        return track(new MeshStandardMaterial({
          vertexColors: true,
          roughness: profile.roughness,
          metalness: profile.metalness,
          envMap,
          // Kim loại và kính SỐNG bằng phản chiếu → cho ăn trọn môi trường. Bề mặt khuếch tán chỉ
          // lấy một phần: để nguyên 1,0 thì ánh trời tràn vào làm nhạt hết bảng màu đất đã dựng
          // công phu suốt các Phase trước — đúng cái bẫy "sáng đều là kẻ thù của hình khối".
          envMapIntensity: profile.metalness > 0.15 ? 1 : ENV_DIFFUSE,
          transparent: dimmed,
          opacity: dimmed ? 0.62 : 1,
        }));
      });
      const mesh = new Mesh(merged.geometry, buildingMaterial);
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
      glowMesh.castShadow = false;      // ô cửa sáng mà đổ bóng thì thành ra vô lý
      glowMesh.receiveShadow = false;
      addMesh(glowMesh);
    }
  }

  // ── Cư dân ────────────────────────────────────────────────────────────────
  // Một thành phố không có người là một mô hình kiến trúc. Vài chấm di chuyển giữa những khối nhà
  // đó biến nó thành NƠI CÓ NGƯỜI Ở — và biến "mở khoá thêm một công trình" thành "chỗ này đông
  // hơn tuần trước". Toàn bộ cộng đồng đi qua MỘT `InstancedMesh` = một lệnh vẽ.
  const residents = still ? [] : buildResidents(layout, stats);
  let bodyMesh = null;
  let headMesh = null;
  /** Đặt lại vị trí cả cộng đồng theo thời gian. `null` khi thành phố không có ai. */
  let placeResidents = null;
  if (residents.length > 0) {
    // ⚠️ HAI KHỐI, KHÔNG PHẢI MỘT — và đây là khác biệt giữa "cư dân" với "viên gạch màu".
    // Bản đầu dùng đúng một hộp cho cả người. Ảnh chụp gần cho thấy kết quả: những viên gạch màu
    // trôi trên đường, không ai đọc ra là người. Thứ làm mắt nhận ra dáng người ở cỡ vài điểm ảnh
    // KHÔNG phải tay chân hay mặt mũi — mà là một chấm NHỎ HƠN, SÁNG HƠN đặt trên một khối lớn
    // hơn, tối hơn. Đó là toàn bộ ngôn ngữ của quân cờ vua và của hình nhân Lego.
    // Giá: 12 tam giác mỗi người, thêm ĐÚNG một lệnh vẽ cho cả cộng đồng (đầu ai cũng một màu nên
    // không cần màu theo thực thể).
    const HEAD_HEIGHT = RESIDENT_HEIGHT * 0.28;
    const BODY_HEIGHT = RESIDENT_HEIGHT - HEAD_HEIGHT;

    const residentMaterial = track(new MeshStandardMaterial({
      roughness: 0.88,          // vải vóc, không phải nhựa
      metalness: 0,
      envMap,
      envMapIntensity: ENV_DIFFUSE,
      transparent: dimmed,
      opacity: dimmed ? 0.62 : 1,
    }));

    const bodyGeometry = track(new BoxGeometry(0.085, BODY_HEIGHT, 0.085));
    bodyMesh = new InstancedMesh(bodyGeometry, residentMaterial, residents.length);

    const headGeometry = track(new BoxGeometry(0.062, HEAD_HEIGHT, 0.062));
    headMesh = new InstancedMesh(headGeometry, residentMaterial, residents.length);

    const skin = palette.roles?.skin ?? palette.roles?.trim ?? palette.wall;
    for (const mesh of [bodyMesh, headMesh]) {
      // Người quá nhỏ để đổ bóng ra hồn, nhưng NHẬN bóng thì có: đi vào bóng nhà là tối đi.
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      // ⚠️ Ma trận đổi mỗi khung hình — báo cho three biết để nó khỏi cố tối ưu bộ đệm tĩnh.
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    }

    // Màu áo: lấy quanh vai `roof`/`gold`/`wood` để cư dân thuộc cùng họ màu với thành phố họ ở.
    const shirtRoles = ['roof', 'gold', 'wood', 'trim'];
    residents.forEach((_route, index) => {
      bodyMesh.setColorAt(index, tint.setHex(
        palette.roles?.[shirtRoles[index % shirtRoles.length]] ?? palette.roof,
      ));
      headMesh.setColorAt(index, tint.setHex(skin));
    });
    if (bodyMesh.instanceColor) bodyMesh.instanceColor.needsUpdate = true;
    if (headMesh.instanceColor) headMesh.instanceColor.needsUpdate = true;
    addMesh(bodyMesh);
    addMesh(headMesh);

    // Gọi mỗi khung hình khi có hoạt hoạ.
    // ⚠️ Nhận THỜI GIAN làm tham số chứ không tự cộng dồn — nhờ vậy rời tab nửa tiếng rồi quay lại
    // thì thành phố hiện ra ở đúng trạng thái đáng lẽ phải có, thay vì đứng im từ lúc bị đóng băng.
    placeResidents = (timeSeconds) => {
      for (let i = 0; i < residents.length; i += 1) {
        const spot = residentAt(residents[i], timeSeconds);
        if (!spot) continue;
        const { x, z } = cellToWorld(spot.x, spot.y, gridSize);
        rotation.setFromAxisAngle(UP, -spot.angle);
        scale.set(1, 1, 1);

        // Chân đặt lên MẶT ĐƯỜNG, không phải mặt nền. Đường nhô cao hơn nền một chút (xem khối
        // đường phía trên) — bỏ qua chênh lệch này thì cư dân lún nửa bàn chân xuống mặt đường.
        const feet = ROAD_SURFACE_Y + spot.bob;

        position.set(x, feet + BODY_HEIGHT / 2, z);
        matrix.compose(position, rotation, scale);
        bodyMesh.setMatrixAt(i, matrix);

        position.set(x, feet + BODY_HEIGHT + HEAD_HEIGHT / 2, z);
        matrix.compose(position, rotation, scale);
        headMesh.setMatrixAt(i, matrix);
      }
      bodyMesh.instanceMatrix.needsUpdate = true;
      headMesh.instanceMatrix.needsUpdate = true;
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
  const hemisphere = new HemisphereLight(
    palette.lights?.skyDome ?? palette.sky,
    palette.lights?.bounce ?? palette.ground,
    (palette.isDark ? 0.34 : 0.10) * fillEnergy,
  );
  scene.add(hemisphere);

  const ambient = new AmbientLight(palette.lights?.bounce ?? palette.sky,
    (palette.isDark ? 0.10 : 0.02) * fillEnergy);
  scene.add(ambient);

  const sun = new DirectionalLight(palette.lights?.sun ?? palette.sun,
    (palette.isDark ? 1.72 : 2.15) * sunEnergy);
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

  // Khung bóng bó SÁT đúng lưới — rộng thừa thì mất độ nét, thiếu thì cụt bóng ở rìa.
  const reach = gridSize * 0.75;
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
    stats: {
      groundTiles: groundCells.length,
      roads: roads.length,
      buildings: buildings.length,
      props: scatter.length,
      residents: residents.length,
      // Đèn điểm là nguồn sáng DUY NHẤT ở đây tính tiền theo từng điểm ảnh — hiện lên HUD để lúc
      // Đàm chụp màn hình báo máy nóng, ta biết ngay lúc đó có mấy cái đang bật.
      lamps: lampCount,
      // ⚠️ KHÔNG CÒN BẰNG `meshes.length` TỪ PHASE 7A. Khối công trình nay chia nhóm theo họ vật
      // liệu, và MỖI NHÓM là một lệnh vẽ riêng. Để nguyên phép đếm cũ thì HUD sẽ báo một con số
      // nhỏ hơn sự thật đúng ở chỗ Đàm dựa vào nó để biết máy có gánh nổi không — một cái đồng hồ
      // đo nói dối theo hướng trấn an là loại đồng hồ tệ nhất.
      drawCalls: meshes.length + Math.max(0, (merged?.families?.length ?? 1) - 1),
      triangles: buildingTriangles
        + (groundCells.length + roads.length) * TRIANGLES_PER_BOX
        // × 2: mỗi cư dân là HAI hộp (thân + đầu).
        + residents.length * TRIANGLES_PER_BOX * 2,
    },
    /** Gọi khi cảnh đổi hình dạng (đổi kỷ, xây thêm nhà) — bóng mới được vẽ lại. */
    invalidateShadows() { sun.shadow.needsUpdate = true; },
  };
}
