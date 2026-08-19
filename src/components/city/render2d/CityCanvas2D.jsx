/**
 * CityCanvas2D.jsx — bộ vẽ 2D: vẽ lưới isometric của một thành phố bằng SVG thuần.
 *
 * Đây là bộ vẽ NỀN, luôn chạy được ở mọi máy (không cần WebGL). Khi bộ vẽ 3D (`../render3d/`)
 * không dùng được — máy yếu, mất WebGL context, hoặc Đàm tự chọn "2D" trong Cài đặt — màn hình
 * Thành Phố lùi về đúng file này. Vì vậy nó phải giữ được tính "không phụ thuộc gì cả":
 * 0 KB asset, không ảnh, không thư viện ngoài.
 *
 * Hiệu năng (luật cứng):
 *   - 144 ô nền được GỘP thành 4 `<path>` (một path mỗi biến thể màu), đường sá gộp thành 1 path
 *     nữa. Nếu vẽ mỗi ô một `<polygon>` thì riêng nền đã 144 phần tử DOM.
 *   - Chỉ vật thể NỔI (nhà + cảnh vật) mới là phần tử riêng, và chúng đã được engine sắp xếp sẵn
 *     theo `(x + y)` nên vẽ tuần tự là đúng chiều sâu — vật phía sau bị vật phía trước che.
 *   - TUYỆT ĐỐI không quét lại `history` ở đây (lỗi đã ghi ở `TECH_DEBT #6`).
 */

import CityTile from './CityTile';
import { TILE, cellCenter, computeViewBox, getEraPalette } from './tokens2d';

const HALF_W = TILE.W / 2;
const HALF_H = TILE.H / 2;

/** Một hình thoi ở dạng lệnh path, dùng để gộp nhiều ô vào chung một `<path>`. */
function diamondPath(x, y) {
  const { cx, cy } = cellCenter(x, y);
  return `M${cx} ${cy - HALF_H}L${cx + HALF_W} ${cy}L${cx} ${cy + HALF_H}L${cx - HALF_W} ${cy}Z`;
}

/**
 * @param {object} props
 * @param {object} props.layout   kết quả `computeCityLayout(...)`
 * @param {boolean} [props.dimmed] thành phố đã niêm phong → làm nhạt cho có vẻ "quá khứ"
 */
export default function CityCanvas2D({ layout, dimmed = false }) {
  const palette = getEraPalette(layout.era);
  const view = computeViewBox(layout.gridSize);

  // Gộp ô nền theo biến thể màu → đúng 4 phần tử DOM thay vì 144.
  const groundByVariant = palette.ground.map(() => []);
  for (const cell of layout.ground) {
    const bucket = groundByVariant[cell.variant % groundByVariant.length];
    bucket.push(diamondPath(cell.x, cell.y));
  }

  const roads = layout.props.filter((prop) => prop.kind === 'road');
  const risenProps = layout.props.filter((prop) => prop.kind !== 'road');

  // Nhà và cảnh vật nổi trộn chung rồi sắp lại theo chiều sâu — hai mảng đã sắp riêng thì
  // ghép lại vẫn phải sắp một lần nữa, nếu không nhà sẽ đè lên cây đứng trước nó.
  const risen = [
    ...layout.buildings.map((item) => ({ kind: 'building', item })),
    ...risenProps.map((item) => ({ kind: 'prop', item })),
    // Công trình đang xây. Trộn vào CÙNG danh sách rồi mới sắp theo chiều sâu — tách ra vẽ sau sẽ
    // làm giàn giáo luôn đè lên cây và nhà đứng trước nó, đúng cái lỗi isometric kinh điển mà
    // `byIsometricDepth` sinh ra để tránh.
    ...(layout.scaffolds ?? []).map((item) => ({ kind: 'scaffold', item })),
  ].sort((a, b) => (a.item.x + a.item.y) - (b.item.x + b.item.y));

  // Khung ngoài do CHÍNH bộ vẽ quyết định — mỗi bộ vẽ có nhu cầu khác nhau (SVG cần chiều rộng
  // tối thiểu + cuộn ngang; canvas 3D sau này cần tỉ lệ cố định). Khung chung `CityViewShell`
  // chỉ cấp một ô trống, không áp kích thước lên bộ vẽ nào.
  return (
    <div className="overflow-x-auto">
      <div className="mx-auto w-full min-w-[280px] max-w-[720px]">
        <svg
          viewBox={view.viewBox}
          className="block h-auto w-full"
          role="img"
          aria-label={`Thành phố có ${layout.buildings.length} công trình`}
          style={{ overflow: 'visible' }}
        >
          {/* nền chung: lấy màu theo theme, sắc kỷ được phủ trong suốt lên trên */}
          <rect
            x={view.minX}
            y={view.minY}
            width={view.width}
            height={view.height}
            fill="var(--canvas-2)"
          />

          {groundByVariant.map((paths, index) => (
            paths.length > 0 ? (
              <path
                key={index}
                d={paths.join('')}
                fill={palette.ground[index]}
                stroke={palette.edge}
                strokeWidth="0.5"
                opacity={dimmed ? 0.65 : 1}
              />
            ) : null
          ))}

          {roads.length > 0 && (
            <path
              d={roads.map((road) => diamondPath(road.x, road.y)).join('')}
              fill={palette.road}
              stroke={palette.edge}
              strokeWidth="0.5"
              opacity={dimmed ? 0.6 : 1}
            />
          )}

          {/*
            MẢNG PHỦ ĐẤT — một lớp PHẲNG nằm giữa đường sá và mọi vật thể nổi.
            ⚠️ VÌ SAO NÓ KHÔNG TRỘN VÀO `risen`: mảng phủ được phép DÙNG CHUNG một ô với cây hoặc
            đèn (xem `deriveGroundCover` ở `cityLayout.js`), mà `byIsometricDepth` trả 0 cho hai
            vật cùng ô — lúc ấy thứ tự vẽ do thứ tự mảng quyết định, và mảng phủ nối vào sau sẽ
            phủ ĐÈ LÊN cái cây đứng trong nó. Tách thành một lớp riêng vẽ trước thì thứ tự chồng
            lớp đúng theo cấu trúc, không cần đụng vào hàm sắp xếp dùng chung.
          */}
          {(layout.covers ?? []).map((item) => (
            <CityTile
              key={`cover-${item.x}-${item.y}`}
              kind="prop"
              item={item}
              palette={palette}
              dimmed={dimmed}
            />
          ))}

          {risen.map(({ kind, item }) => (
            <CityTile
              key={kind === 'building' ? item.bpId : `${item.kind}-${item.x}-${item.y}`}
              kind={kind}
              item={item}
              palette={palette}
              dimmed={dimmed}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
