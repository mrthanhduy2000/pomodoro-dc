/**
 * cityParts.js — DANH SÁCH MỌI THỨ CÓ TRONG MỘT THÀNH PHỐ, dưới dạng mô tả THUẦN.
 *
 * ⚠️ VÌ SAO FILE NÀY TỒN TẠI — VÀ VÌ SAO ĐỪNG DỰNG LẠI DANH SÁCH NÀY Ở CHỖ KHÁC.
 *
 * Câu hỏi *"thành phố kỷ N gồm những khối nào?"* trước đây được trả lời ở đúng một nơi: giữa thân
 * `sceneGraph.js`, xen lẫn với việc đặt toạ độ và xoay hướng. Mọi thứ khác muốn hỏi câu đó đều phải
 * **chép lại** vòng lặp ấy — và một bài test ở `groundFloor.test.js` đã chép, rồi chép SAI: nó dựng
 * 7 loại × 3 hạng = 21 công trình giả định và gọi đó là "cả thành phố", trong khi thành phố thật là
 * 5 bản vẽ `BLUEPRINT_CATALOG` (loại và hạng đã ấn định) cộng 6–30 nhà dân do `deriveDwellings`
 * sinh ra. Bản chép ấy tình cờ cho cùng kết quả nên **không ai biết**, cho tới lúc đem đo.
 *
 * ⇒ Đàm chốt cách sửa: *"Đừng cố khoá hai bản chép cho khớp nhau — hãy làm cho chỉ còn một bản."*
 * Đây là bản duy nhất đó. `sceneGraph.js` gọi nó để DỰNG, bài test gọi nó để ĐO, nên hai bên không
 * thể trôi khỏi nhau nữa — đúng luật **"một luật một công thức"** đã cứu dự án nhiều lần.
 *
 * ⚠️ RANH GIỚI: file này trả lời *"có những khối nào, mỗi khối hình dáng ra sao"*. Nó KHÔNG trả lời
 * *"khối ấy đứng ở đâu, xoay bao nhiêu độ, cao độ mặt đất chỗ đó là bao nhiêu"* — phần ấy cần
 * `terrain` và thuộc về tầng dựng cảnh. Giữ ranh giới này thì file vẫn THUẦN: không `three`, không
 * DOM, chạy được bằng `node --test`.
 *
 * ⚠️ THỨ TỰ TRẢ VỀ LÀ MỘT PHẦN CỦA HỢP ĐỒNG: công trình → giàn giáo → nhà dân → cảnh vật.
 * `sceneGraph.js` gắn `addPickTarget` theo CHỈ SỐ của nhóm công trình, nên đảo thứ tự sẽ làm ngón
 * tay chạm vào một công trình mà app kể tên một công trình khác. Có test khoá thứ tự này.
 * Nhóm "cảnh vật" gồm CẢ mảng phủ đất (`layout.covers`) — chúng cùng đi qua `buildPropSpec`, cùng
 * mang `kind:'prop'`, và cùng phải nằm ngoài vùng chỉ số mà `addPickTarget` bám theo.
 */

import { buildBuildingSpec, buildScaffoldSpec } from './buildingSpec.js';
import { buildPropSpec } from './propSpec.js';

/**
 * Nhà dân KHÔNG có bản vẽ nên không có `bpId` thật. Khoá hình dáng của nó gồm cả TOẠ ĐỘ, để hai căn
 * cùng loại cùng cỡ ở hai ô khác nhau vẫn khác nhau ở số cửa sổ và độ xiêu vẹo — không có vế toạ độ
 * thì cả khu phố là một căn nhà nhân bản mười hai lần.
 *
 * ⚠️ Đổi công thức này là đổi hình dáng MỌI nhà dân đã xây, tức phá bất biến "bảo tàng bất động"
 * (ADR-007). Nếu buộc phải đổi thì phải là một quyết định có ADR, không phải một lần dọn dẹp.
 */
export function dwellingBpId(era, x, y) {
  return `dw|${era}|${x}|${y}`;
}

/**
 * Gom MỌI khối của một thành phố thành một danh sách mô tả thuần.
 *
 * @param {object}  opts
 * @param {object}  opts.layout  kết quả `computeCityLayout` (thuần)
 * @param {'high'|'low'} [opts.detail]  mức chi tiết của cảnh vật (LOD)
 * @returns {Array<{kind:'building'|'scaffold'|'dwelling'|'prop', source:object, spec:object}>}
 */
export function collectCitySpecs({ layout, detail = 'high' } = {}) {
  if (!layout) return [];
  const era = layout.era;
  const out = [];

  for (const building of layout.buildings ?? []) {
    out.push({
      kind: 'building',
      source: building,
      spec: buildBuildingSpec({
        bpId:   building.bpId,
        era,
        type:   building.type,
        rarity: building.rarity,
        level:  building.level,
      }),
    });
  }

  for (const scaffold of layout.scaffolds ?? []) {
    out.push({
      kind: 'scaffold',
      source: scaffold,
      spec: buildScaffoldSpec({ bpId: scaffold.bpId, era, progress: scaffold.progress }),
    });
  }

  for (const home of layout.dwellings ?? []) {
    out.push({
      kind: 'dwelling',
      source: home,
      spec: buildBuildingSpec({
        bpId:   dwellingBpId(era, home.x, home.y),
        era,
        type:   home.type,
        rarity: home.rarity,
        level:  1,
      }),
    });
  }

  // `road` bị loại vì mặt đường KHÔNG đi qua đường này — nó là một tấm lưới riêng dựng từ
  // `terrainMesh.js`. Để lọt vào đây thì con đường sẽ bị dựng hai lần, một lần dưới dạng khối hộp.
  for (const prop of (layout.props ?? []).filter((p) => p.kind !== 'road')) {
    out.push({
      kind: 'prop',
      source: prop,
      spec: buildPropSpec({
        kind:   prop.kind,
        era,
        seed:   `${era}|${prop.kind}|${prop.x}|${prop.y}|${prop.variant}`,
        detail,
      }),
    });
  }

  // ⚠️ MẢNG PHỦ ĐẤT ĐI QUA CHÍNH `buildPropSpec` — nó chỉ là một `kind` khác, không phải một nhà
  // máy thứ hai. Lý do nó nằm ở một MẢNG riêng của bố cục (chứ không lẫn vào `props`) là chuyện
  // của tầng ĐẶT CHỖ, không phải của tầng dựng hình: một ô lưới được phép vừa có cây đứng vừa có
  // sân lát, nên hai thứ ấy không được tranh nhau một chỗ trong danh sách. Xem `cityLayout.js`.
  for (const cover of layout.covers ?? []) {
    out.push({
      kind: 'prop',
      source: cover,
      spec: buildPropSpec({
        kind:   cover.kind,
        era,
        seed:   `${era}|${cover.kind}|${cover.x}|${cover.y}|${cover.variant}`,
        detail,
      }),
    });
  }

  return out;
}
