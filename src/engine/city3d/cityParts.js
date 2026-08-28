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
import { buildBlockSpec } from './block.js';
import { deriveHinterland } from './hinterland.js';
import { deriveOutskirts } from './outskirts.js';
import { buildPropSpec } from './propSpec.js';

/**
 * KIND → TÊN NHÓM HÌNH HỌC. Một bảng, hai người đọc, và đó chính là lý do nó nằm ở tầng THUẦN.
 *
 * ⚠️ SINH RA TỪ MỘT BÀI TEST ĐỎ THẬT, KHÔNG PHẢI ĐỀ PHÒNG SUÔNG. `cityFocus.test.js` tự dựng lại
 * danh sách vật cản bằng một vòng lặp riêng và tự khai trong chú thích là *"cùng luật với
 * `sceneGraph.js`"*. Lời tự nhận ấy đúng cho tới đúng cái ngày Phase 13 thêm loại khối thứ sáu:
 * `sceneGraph.js` loại vùng phụ cận ra khỏi vật cản, bản chép tay thì không, và bài test đỏ với
 * thông báo *"bán kính phố = 21,44"* — một con số nói về một thành phố không tồn tại.
 *
 * Đây đúng bài học đã ghi ở `CLAUDE.md`: *"một bài test dựng lại đầu vào bằng đường riêng thì nó
 * đang canh bản dựng lại ấy, không canh mã sản phẩm"* — và cách chữa không phải thêm một dòng
 * `continue` nữa (chỗ thứ bảy viết sau này sẽ lại quên), mà là **một luật một công thức**.
 */
export const NHOM_CUA_KIND = {
  building:   'buildings',
  scaffold:   'buildings',
  dwelling:   'buildings',
  prop:       'props',
  outskirt:   'landscape',
  hinterland: 'hinterland',
};

/**
 * Những loại khối đứng NGOÀI lưới 12×12 — chúng không chặn camera cận cảnh.
 *
 * Lý do đầy đủ ở `sceneGraph.js` (tóm tắt: cho cái cây vào danh sách vật cản mà bỏ quả đồi nó
 * đứng trên thì tệ hơn không cho gì — mặt đất vùng quê kỷ 8 dâng tới +2,18 mà bộ hoạch định đường
 * bay không hề biết; `TECH_DEBT #54`). Vùng phụ cận thừa hưởng đúng lý do ấy: nó cũng nằm ngoài
 * lưới, cũng đứng trên thứ địa hình mà `terrain.footprint` không mô tả.
 */
export const KIND_NGOAI_LUOI = new Set(['outskirt', 'hinterland']);

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

  // ⚠️ MỘT Ô NHÀ DÂN = MỘT KHU PHỐ, KHÔNG PHẢI MỘT CĂN NHÀ (Phase 14 §1(3), ADR-052).
  // `buildBlockSpec` gọi thẳng `buildBuildingSpec` cho từng đơn vị rồi GỘP lại thành đúng MỘT mô
  // tả, nên danh sách này vẫn có đúng 30 mục như trước và `sceneGraph.js` không phải sửa gì: cùng
  // thứ tự hợp đồng, cùng chỉ số cho `addPickTarget`, cùng MỘT bệ kè cho cả khu phố.
  for (const home of layout.dwellings ?? []) {
    out.push({
      kind: 'dwelling',
      source: home,
      spec: buildBlockSpec({
        bpId:   dwellingBpId(era, home.x, home.y),
        era,
        type:   home.type,
        rarity: home.rarity,
        detail,
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

  /**
   * ⚠️ VÙNG QUÊ ĐI CHUNG DANH SÁCH NÀY, VÀ ĐÓ LÀ MỘT LỰA CHỌN CÓ GIÁ ĐO ĐƯỢC.
   *
   * Cây cối ngoài lưới dùng ĐÚNG hai họ vật liệu mà cây trong lưới đã dùng (`wood` + `foliage`,
   * xem `materials.js`), nên gộp chung một khối hình học ⇒ **không thêm một lệnh vẽ nào ở cả 15
   * kỷ**. Tách ra một khối riêng thì đẹp về mặt khái niệm (thành phố ≠ cảnh quan) nhưng tốn thêm
   * một lệnh vẽ ở MỌI kỷ, kể cả những kỷ mà phase này không hề đụng tới — mà mốc lệnh vẽ của dự án
   * là một BẢNG 15 dòng đo được chứ không phải một cái trần chung (`drawCallBudget.test.js`), và
   * làm trôi 15 dòng ấy cùng lúc thì cái bảng hết còn nói được điều nó sinh ra để nói.
   *
   * ⚠️ Vẫn ĐO RIÊNG được: `splitCityMesh` (`sceneGraph.js`) cắt khối gộp làm ba nhóm có TÊN
   * (`buildings` · `props` · `landscape`) khi công cụ chụp cần hỏi *"bao nhiêu phần khung hình là
   * vùng quê?"*. Đó là một CỜ CHỈ-ĐỂ-ĐO đã có sẵn, không phải một cờ thứ ba.
   */
  for (const wild of deriveOutskirts({ era, gridSize: layout.gridSize })) {
    out.push({
      kind: 'outskirt',
      source: wild,
      spec: buildPropSpec({ kind: wild.kind, era, seed: wild.seed, detail: wild.detail ?? detail }),
    });
  }

  /**
   * ⚠️ VÙNG PHỤ CẬN (Phase 13 VIỆC B) — RUỘNG, ĐÊ, TƯỜNG, CỔNG, BẾN, XÓM VỆ TINH, ĐƯỜNG RỜI KHUNG.
   *
   * Vì sao nó là một loại RIÊNG chứ không nhét chung `outskirt`: vùng quê trả lời câu *"ngoài phố
   * có cây cối gì"*, còn vùng phụ cận trả lời câu *"con người đã chạm tới đâu"*. Đàm đã lấp cái
   * vành ngoài một lần bằng thực vật (VIỆC 1) và **vẫn nói thành phố nhỏ** — đó là DỮ LIỆU, không
   * phải ý kiến: thực vật không mang tín hiệu quy mô. Thứ đọc ra là "một nơi RỘNG" là DẤU CHÂN
   * NGƯỜI trải ra ngoài, nên hai thứ ấy phải đếm riêng được thì mới đo được cổng (G1).
   *
   * ⚠️ `deriveHinterland` TỰ TRA BẢNG và tự dựng `spec` (khác `deriveOutskirts`, nơi bên gọi dựng
   * spec hộ). Lý do ở chú thích của chính hàm ấy: bảng mà để bên gọi truyền vào thì sớm muộn sẽ có
   * một chỗ gọi quên truyền, và kỷ đó lặng lẽ mất vùng phụ cận.
   *
   * ⚠️ KHÔNG phụ thuộc tiến độ chơi: chữ ký chỉ có `era` + `gridSize`, và `hinterland.test.js` gọi
   * kèm DỮ LIỆU RÁC (`built`, `sessionCount`…) rồi đòi kết quả y hệt — đúng khuôn đã dùng cho
   * `buildTerrain` ở Phase 7B.
   */
  for (const item of deriveHinterland({ era, gridSize: layout.gridSize })) {
    out.push({ kind: 'hinterland', source: item, spec: item.spec });
  }

  return out;
}
