/**
 * sceneGraph.js — dựng cảnh 3D từ bố cục trừu tượng mà `computeCityLayout` trả về.
 *
 * ⚠️ Phase 3A CỐ Ý dừng ở hình khối thô (hộp): mục tiêu của phase này là ĐO XEM iPhone có kham
 * nổi không, chứ không phải làm đẹp. Nhưng phải đo trên đúng TẢI THẬT — 144 ô nền, số công trình
 * thật, bóng đổ bật — chứ đo 5 cái hộp thì con số chẳng dự đoán được gì. Ngôn ngữ hình khối chi
 * tiết (mái, cửa sổ, 3 trục kỷ × loại × độ hiếm) là việc của Phase 3B.
 *
 * Ba luật hiệu năng, đều là chỗ dễ mất nhiều nhất:
 *   1. **Cả thành phố = 3 lệnh vẽ.** Nền, đường, công trình mỗi thứ một `InstancedMesh`; nếu vẽ
 *      rời từng ô thì riêng nền đã 144 lệnh.
 *   2. **Một material duy nhất cho cả ba.** Đổi material là nguyên nhân tốn lệnh vẽ lớn nhất.
 *      Màu riêng từng khối đi qua `setColorAt` (màu theo THỰC THỂ), không qua material.
 *      ⚠️ Đã kiểm mã nguồn three 0.185.1: `WebGLProgram` định nghĩa `USE_COLOR` khi
 *      `vertexColors || instancingColor`, nên `setColorAt` chạy được mà KHÔNG cần bật
 *      `vertexColors` trên material — bật thừa sẽ làm mọi mesh thường không có thuộc tính `color`
 *      hoá đen.
 *   3. **Bóng đổ KHÔNG tự cập nhật** (`shadow.autoUpdate = false`). Mặc định của three là `true`,
 *      tức là vẽ lại toàn bộ shadow map MỖI khung hình — nó âm thầm phá vỡ render-on-demand vì
 *      khung hình nào cũng trở nên đắt như khung đầu tiên.
 */

import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Fog,
  InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  Quaternion,
  Scene,
  Vector3,
} from 'three';

/** Một ô lưới = 1 đơn vị thế giới. Giữ số tròn để mọi phép tính đọc được bằng mắt. */
export const TILE_UNIT = 1;

const GROUND_THICKNESS = 0.22;
const BUILDING_BASE_HEIGHT = 0.9;
const BUILDING_LEVEL_STEP = 0.55;
const BUILDING_FOOTPRINT = 0.78;

/** Số tam giác của một hộp — dùng để tính ngân sách hiển thị trên HUD. */
const TRIANGLES_PER_BOX = 12;

/** Ô lưới (x, y) → toạ độ thế giới, gốc toạ độ đặt giữa thành phố. */
export function cellToWorld(x, y, gridSize) {
  const half = (gridSize - 1) / 2;
  return { x: (x - half) * TILE_UNIT, z: (y - half) * TILE_UNIT };
}

/** Chiều cao khối nhà theo cấp — nâng cấp phải NHÌN THẤY được là cao lên. */
export function buildingHeight(level) {
  const safeLevel = Number.isFinite(level) ? Math.max(1, level) : 1;
  return BUILDING_BASE_HEIGHT + (safeLevel - 1) * BUILDING_LEVEL_STEP;
}

/**
 * Dựng toàn bộ cảnh.
 *
 * @param {object} input
 * @param {object} input.layout    kết quả `computeCityLayout(...)`
 * @param {object} input.palette   kết quả `buildScenePalette(...)` — các màu ở dạng SỐ
 * @param {boolean} [input.dimmed] thành phố đã niêm phong → làm nhạt cho có vẻ "quá khứ"
 */
export function createCityScene({ layout, palette, dimmed = false }) {
  const gridSize = layout.gridSize;
  const scene = new Scene();
  scene.background = new Color(palette.background);

  // Sương mù nhẹ theo chiều sâu: vừa tạo cảm giác không gian, vừa giấu mép lưới ở xa.
  scene.fog = new Fog(palette.background, gridSize * 1.1, gridSize * 2.9);

  // three KHÔNG tự giải phóng bộ nhớ GPU — mọi thứ tạo ra ở đây phải tự dọn trong `dispose`.
  const disposables = [];
  const track = (resource) => { disposables.push(resource); return resource; };

  const material = track(new MeshLambertMaterial({
    transparent: dimmed,
    opacity: dimmed ? 0.62 : 1,
  }));

  // Dùng lại vài đối tượng tạm cho mọi thực thể — tạo mới trong vòng lặp là rác cho bộ dọn.
  const matrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3(1, 1, 1);
  const tint = new Color();

  /**
   * Gộp một danh sách khối thành MỘT `InstancedMesh`.
   * @param {Array} items
   * @param {THREE.BoxGeometry} geometry
   * @param {(item:object, index:number) => {x:number,y:number,z:number,height:number,color:number}} place
   */
  function buildInstances(items, geometry, place, { castShadow, receiveShadow }) {
    if (items.length === 0) return null;
    const mesh = new InstancedMesh(geometry, material, items.length);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    items.forEach((item, index) => {
      const spec = place(item, index);
      position.set(spec.x, spec.y, spec.z);
      scale.set(1, spec.height, 1);
      matrix.compose(position, rotation, scale);
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, tint.setHex(spec.color));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
    return mesh;
  }

  // ── Nền: 144 ô → MỘT lệnh vẽ ──────────────────────────────────────────────
  const groundCells = layout.ground ?? [];
  const groundColors = [palette.ground, palette.groundAlt];
  const groundMesh = buildInstances(
    groundCells,
    track(new BoxGeometry(TILE_UNIT * 0.98, GROUND_THICKNESS, TILE_UNIT * 0.98)),
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
  );

  // ── Đường sá ──────────────────────────────────────────────────────────────
  const roads = (layout.props ?? []).filter((prop) => prop.kind === 'road');
  const roadMesh = buildInstances(
    roads,
    track(new BoxGeometry(TILE_UNIT, GROUND_THICKNESS, TILE_UNIT)),
    (road) => {
      const { x, z } = cellToWorld(road.x, road.y, gridSize);
      return {
        x, z,
        y: -GROUND_THICKNESS / 2 + 0.012,   // nhô lên tí xíu để không chọi mặt nền
        height: 1,
        color: palette.edge,
      };
    },
    { castShadow: false, receiveShadow: true },
  );

  // ── Công trình ────────────────────────────────────────────────────────────
  const buildings = layout.buildings ?? [];
  const buildingMesh = buildInstances(
    buildings,
    track(new BoxGeometry(BUILDING_FOOTPRINT, 1, BUILDING_FOOTPRINT)),
    (building) => {
      const height = buildingHeight(building.level);
      const { x, z } = cellToWorld(building.x, building.y, gridSize);
      return {
        x, z,
        y: height / 2,
        height,
        color: building.rarity === 'epic' ? palette.roof : palette.wall,
      };
    },
    { castShadow: true, receiveShadow: true },
  );

  // ── Ánh sáng ──────────────────────────────────────────────────────────────
  const ambient = new AmbientLight(palette.sky, palette.isDark ? 1.25 : 1.05);
  scene.add(ambient);

  const sun = new DirectionalLight(palette.sun, palette.isDark ? 1.15 : 1.35);
  sun.position.set(gridSize * 0.5, gridSize * 0.95, gridSize * 0.35);
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
  sun.shadow.bias = -0.0016;            // chống sọc vằn tự-đổ-bóng trên mặt nền phẳng
  scene.add(sun);
  scene.add(sun.target);

  const meshes = [groundMesh, roadMesh, buildingMesh].filter(Boolean);

  let disposed = false;
  function dispose() {
    // ⚠️ Phải chịu được gọi NHIỀU LẦN: React StrictMode ở dev mount → unmount → mount, và
    // đường mất-WebGL-context cũng gọi dọn trước khi effect kịp chạy hàm dọn của mình.
    if (disposed) return;
    disposed = true;
    for (const mesh of meshes) {
      scene.remove(mesh);
      mesh.dispose();
    }
    for (const resource of disposables.splice(0)) resource.dispose?.();
    scene.clear();
  }

  return {
    scene,
    sun,
    dispose,
    stats: {
      groundTiles: groundCells.length,
      roads: roads.length,
      buildings: buildings.length,
      drawCalls: meshes.length,
      triangles: (groundCells.length + roads.length + buildings.length) * TRIANGLES_PER_BOX,
    },
    /** Gọi khi cảnh đổi hình dạng (đổi kỷ, xây thêm nhà) — bóng mới được vẽ lại. */
    invalidateShadows() { sun.shadow.needsUpdate = true; },
  };
}
