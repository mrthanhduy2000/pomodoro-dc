import test from 'node:test';
import assert from 'node:assert/strict';

import {
  APRON_DROP, APRON_EDGE, ERA_TERRAIN, SMOOTHSTEP_PEAK, STREET_MAX_GRADE, TERRACE_STEP,
  WATER_SURFACE_Y, bienDoRollNgoai, buildTerrain, eraTerrainProfile, geometricTemplate,
  maxRoadRise, nenRoll,
} from './terrain.js';
import { buildHorizon } from './horizon.js';
import { WATER_DROP_BELOW_PLAIN } from './setting.js';
import { getSetting } from './settingStyle.js';
import { roadCellCandidates } from '../cityLayout.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const GRID = 12;

/**
 * Tập khoá "x|y" của 80 ô ĐƯỜNG ứng viên — hằng số, không phụ thuộc kỷ hay tiến độ.
 *
 * ⚠️ TỪ 2026-08-18, CAO ĐỘ Ô ĐƯỜNG VÀ CAO ĐỘ Ô ĐẤT LÀ HAI CHUYỆN KHÁC NHAU, nên gần như mọi bài
 * test ở file này phải hỏi riêng từng loại. Đất giữ bậc thềm (khối đáy phẳng cần mặt đất bằng);
 * đường được san thành dốc thoải (không ai đặt nhà lên mặt phố, mà một con phố nhảy bậc thì mắt
 * đọc ra ngay). Gộp hai loại vào một phép đếm là đo một đại lượng không tồn tại.
 */
const O_DUONG = new Set(roadCellCandidates().map((c) => `${c.x}|${c.y}`));
const laDuong = (cell) => O_DUONG.has(`${cell.x}|${cell.y}`);
const oDat = (terrain) => terrain.cells.filter((c) => !laDuong(c));

/** Đếm số ô ĐẤT ở mỗi cao độ. Trả về `{levels, topShare}`. */
function levelStats(terrain) {
  const cells = oDat(terrain);
  const count = new Map();
  for (const cell of cells) {
    const key = cell.h.toFixed(6);
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  return {
    levels: count.size,
    topShare: Math.max(...count.values()) / cells.length,
  };
}

test('mọi kỷ có khai bậc thì phải CÓ ĐẤT Ở BẬC 0 và có chỗ cao hơn 0', () => {
  // ⚠️ NÓI CHO ĐÚNG BÀI NÀY CANH GÌ. Tôi đã suýt ghi rằng nó "chặn lỗi hàm hình dạng gánh cả biên
  // độ" — lỗi có thật, đã đo (4 kỷ phẳng tuyệt đối, 15 kỷ chỉ còn 11 trường khác nhau). Nhưng thử
  // ngược thì bài này **KHÔNG đỏ** khi tôi cố ý tái tạo lỗi đó: bước căng trường ở `buildTerrain`
  // đã làm nó thành bất khả thi, nhân hệ số nào vào hàm hình dạng cũng ra kết quả y hệt từng con
  // số. Thứ bài này thật sự canh hẹp hơn nhiều: **trường cao độ có neo ở 0 và có vươn lên**.
  // Bài "dùng đủ số bậc" bên dưới mới là bài đỏ khi bước căng bị gỡ.
  for (const era of ERAS) {
    const profile = eraTerrainProfile(era);
    if (profile.terraces < 2) continue;      // kỷ 14 phẳng có chủ đích
    const terrain = buildTerrain({ era, gridSize: GRID });
    const lowest = Math.min(...terrain.cells.map((c) => c.h));
    assert.equal(lowest, 0, `kỷ ${era}: bậc thấp nhất phải là 0, đang là ${lowest}`);
    assert.ok(terrain.maxHeight > 0, `kỷ ${era} (${profile.shape}) phẳng lì dù khai ${profile.terraces} bậc`);
  }
});

test('MỌI KỶ PHẢI DÙNG ĐỦ SỐ BẬC MÌNH KHAI — khai 5 mà dùng 3 là đã mất địa hình', () => {
  // Đây là hàng rào CHÍNH của cả file, và điều đáng ghi là nó canh **bước căng trường** chứ không
  // canh hai lỗi phân bố ban đầu (cả hai nay đã bất khả thi — xem chú thích ở `SHAPES`). Đã thử
  // ngược: gỡ bước căng ⇒ bài này đỏ ngay. "cao nhất > 0" thì KHÔNG bắt được gì — đó là cái phễu.
  for (const era of ERAS) {
    const profile = eraTerrainProfile(era);
    const { levels } = levelStats(buildTerrain({ era, gridSize: GRID }));
    assert.equal(
      levels, profile.terraces,
      `kỷ ${era} (${profile.shape}) khai ${profile.terraces} bậc nhưng chỉ dùng ${levels}`,
    );
  }
});

test('kỷ khai TỪ 3 BẬC TRỞ LÊN thì không bậc nào được nuốt quá 60% mặt đất', () => {
  // ⚠️ VÌ SAO NGƯỠNG NÀY CHỈ ÁP CHO KỶ ≥3 BẬC, và vì sao đó KHÔNG phải nới tay cho tiện:
  // bản đầu tôi áp 70% cho cả 15 kỷ, và hai kỷ "trượt" là kỷ 3 (Ur, Lưỡng Hà) với kỷ 12 (thảo
  // nguyên Nga) — đúng hai nơi mà chính bảng `ERA_TERRAIN` mô tả là "phẳng tuyệt đối" và "phẳng
  // đến mức thành biểu tượng". Ngưỡng ấy đang ĐÒI BỊA RA ĐỒI Ở NƠI KHÔNG CÓ ĐỒI — cùng hình dạng
  // sai với phép đếm "15 mái phải phủ 6 múi màu" mà Phase 6B đã phải hạ xuống. Một kỷ khai 2 bậc
  // là một kỷ đồng bằng: nó chỉ cần có GỢN (bài trên đã canh), không cần cân bằng.
  //
  // ⚠️ TỪ 2026-08-18 PHÉP ĐẾM CHỈ TÍNH Ô ĐẤT, VÀ VIỆC ĐỔI PHẠM VI ẤY ĐÃ LÀM LỘ RA MỘT SỰ THẬT CŨ.
  // Trước đây nó đếm cả 144 ô, tức 80 ô ĐƯỜNG (56% mặt lưới) cũng được tính vào "mặt đất" — mà
  // đường thì rải đều khắp lưới nên nó PHA LOÃNG mọi mất cân bằng. Đo lại ở đúng commit be261ef,
  // chỉ trên 64 ô đất: kỷ 4 đã là **64%** từ trước, không phải do phép san đường sinh ra (phép san
  // không chạm một ô đất nào). Nói cách khác: hàng rào này xưa nay xanh một phần **nhờ những ô
  // không phải mặt đất** — đúng hình dạng "một lời hứa đúng nhờ một thứ chẳng liên quan" ở Phase 7D.
  //
  // Cách xử lý ĐÚNG là giữ nguyên ngưỡng 60% (nới cho vừa kết quả là mua một con số đẹp) và ĐẾM
  // TƯỜNG MINH kỷ nào đang trượt.
  //
  // ⚠️ 2026-08-18 — KỶ 4 TỪNG LÀ MỘT NGOẠI LỆ ĐÃ KHAI (ADR-032 bổ sung (b), đóng `TECH_DEBT #44`):
  // nó đo ra 64% và được ghi thành một LỰA CHỌN chứ không phải một khuyết tật, vì `ERA_TERRAIN[4]`
  // khai thẳng *"kinh thành Trung Hoa trên ĐỒNG BẰNG"*.
  //
  // ⚠️ 2026-08-20 — DANH SÁCH NGOẠI LỆ NAY RỖNG, VÀ ĐÓ LÀ HỆ QUẢ CỦA §1(B), KHÔNG PHẢI CỦA VIỆC
  // NỚI NGƯỠNG. Kỷ 4 đo lại được **42%** mà **không ai chỉnh một con số nào của kỷ 4**. Thứ đổi là
  // CÁCH nhiễu đi vào hình dạng: trước đây nhiễu CỘNG THẲNG vào cao độ, nên phân bố cao độ chính
  // là "chín con số ngẫu nhiên tình cờ ra sao" (ở tần số ấy cả lưới chỉ lấy mẫu từ ~3×3 giá trị
  // độc lập); nay nhiễu chỉ BẺ CONG level set của một trường hình học trơn, nên phân bố cao độ là
  // phân bố của chính cái lòng chảo ấy. ⇒ Lời khai của ADR-032 (b) vẫn ĐÚNG (kỷ 4 là đồng bằng, và
  // đó là một lựa chọn), nó chỉ không còn phải GÁNH cái ngoại lệ này nữa. Xem ADR-045.
  //
  // ⚠️ MỘT DANH SÁCH RỖNG LÀ MỘT DANH SÁCH YẾU — nó chỉ đỏ được theo MỘT chiều. Bù lại bằng hai
  // thứ, cả hai đều là thói quen dự án đã trả giá mới có: (a) **gác chạy-rỗng** đếm đúng số kỷ
  // được xét, để một `continue` đặt nhầm chỗ không làm cả vòng lặp im lặng bỏ qua; (b) **BIÊN đo
  // được**, ghi thẳng vào thông báo — 2026-08-20 chỗ sát vạch nhất là kỷ 13 với 51,6%, tức còn 8,4
  // điểm. Một lời hứa đạt nhờ 3% biên là một lời hứa sắp gãy mà không ai biết (bài học Phase 9B),
  // nên phải biết mình đang cách vạch bao xa chứ đừng chỉ đọc xanh/đỏ.
  //
  // ⚠️ Và nói thật về chính ngưỡng 60%: nó là con số CHỌN TAY, không phải con số đo được. Thứ thật
  // sự canh "địa hình có sập không" là bài "MỌI KỶ PHẢI DÙNG ĐỦ SỐ BẬC MÌNH KHAI" ở trên — nó hỏi
  // thẳng vào khuyết tật thay vì hỏi qua một tỉ lệ.
  const TRUOT = [];
  let soKyDaXet = 0;
  let satVach = { era: 0, share: 0 };
  for (const era of ERAS) {
    const profile = eraTerrainProfile(era);
    if (profile.terraces < 3) continue;
    soKyDaXet += 1;
    const { topShare } = levelStats(buildTerrain({ era, gridSize: GRID }));
    if (topShare > satVach.share) satVach = { era, share: topShare };
    if (topShare > 0.60) TRUOT.push(era);
  }
  assert.equal(
    soKyDaXet, 8,
    `chỉ xét ${soKyDaXet} kỷ khai từ 3 bậc trở lên (phải là 8) — hoặc bảng vừa đổi, hoặc vòng lặp `
    + 'đang bỏ qua kỷ trong im lặng và con số dưới đây không nói về thứ nó tự nhận.',
  );
  assert.deepEqual(
    TRUOT, [],
    `danh sách kỷ có một bậc nuốt quá 60% mặt ĐẤT: ${JSON.stringify(TRUOT)} — sát vạch nhất hiện là `
    + `kỷ ${satVach.era} với ${(satVach.share * 100).toFixed(1)}%. Dài ra ⇒ địa hình vừa sập ở một `
    + 'kỷ: sửa GỐC (hình dạng / `tilt` của chính kỷ đó), ĐỪNG nới ngưỡng và đừng thêm ngoại lệ.',
  );
});

test('ĐỐI CHỨNG: một trường cao độ PHẲNG LÌ phải bị hai hàng rào trên bắt', () => {
  // Không có bài này thì hai ngưỡng trên chỉ là hai con số ai cũng hạ được cho tiện.
  const flat = { cells: Array.from({ length: 144 }, (_, i) => ({ x: i % 12, y: (i / 12) | 0, h: 0 })) };
  const { levels, topShare } = levelStats(flat);
  assert.equal(levels, 1, 'trường phẳng phải chỉ có 1 mức');
  assert.ok(topShare > 0.60, 'trường phẳng phải vượt ngưỡng 60%');
});

test('15 KỶ RA 15 ĐỊA HÌNH KHÁC NHAU — không dùng chung một quả đồi rồi đổi độ cao', () => {
  // Yêu cầu gốc của Đàm: "không dùng cùng một thành phố rồi đổi màu". Địa hình là một trong những
  // trục nói lên điều đó. So bằng CHỮ KÝ (toàn bộ 144 cao độ), không phải bằng maxHeight — hai
  // quả đồi hình khác hẳn nhau vẫn có thể cùng đỉnh.
  const signatures = new Set(ERAS.map((era) => (
    buildTerrain({ era, gridSize: GRID }).cells.map((c) => Math.round(c.h * 1000)).join(',')
  )));
  assert.equal(signatures.size, 15, `chỉ có ${signatures.size} địa hình khác nhau trên 15 kỷ`);
});

test('ĐẤT KHÔNG ĐƯỢC XÊ DỊCH: cùng một kỷ thì địa hình y hệt nhau, mãi mãi', () => {
  // ⚠️ Bất biến quan trọng nhất của file. Nếu cao độ phụ thuộc vào việc Đàm đã xây gì thì mỗi lần
  // xây xong một căn nhà cả quả đồi sẽ nhích, nhà cũ lún hoặc nhô mà không có gì báo. Cùng luật đã
  // giữ cho VỊ TRÍ (ADR-007) và THỨ TỰ MỞ ĐƯỜNG (`tier`, Phase 6C).
  for (const era of ERAS) {
    const a = buildTerrain({ era, gridSize: GRID });
    const b = buildTerrain({ era, gridSize: GRID });
    assert.deepEqual(a.cells, b.cells, `kỷ ${era} dựng hai lần ra hai địa hình`);
  }
  // Và chữ ký hàm KHÔNG được nhận danh sách công trình — nếu ai đó thêm tham số đó vào thì bất
  // biến trên chết ngay. Kiểm bằng cách gọi với rác: kết quả phải không đổi.
  const clean = buildTerrain({ era: 7, gridSize: GRID });
  const noisy = buildTerrain({ era: 7, gridSize: GRID, built: ['a', 'b'], buildings: [1, 2, 3] });
  assert.deepEqual(noisy.cells, clean.cells, 'địa hình đổi theo dữ liệu công trình — đất đang xê dịch');
});

test('cao độ Ô ĐẤT luôn là BỘI SỐ NGUYÊN của một bậc thềm — không có dốc liên tục', () => {
  // ⚠️ LÝ DO CỦA BÀI NÀY ĐÃ ĐỔI Ở PHASE 8C, DÙ LUẬT THÌ KHÔNG. Lý do CŨ là "nền là 144 ô hộp, cao
  // độ lẻ sẽ cho ô nền xuyên nhau hoặc hở khe" — vế ấy chết rồi, mặt đất nay là một tấm lưới liền
  // và nó dốc được tuỳ ý. Nhưng CÔNG TRÌNH vẫn là khối đáy phẳng, và chúng vẫn đứng theo bảng cao
  // độ này; thềm bậc là thứ cho một toà nhà rộng 3 ô có mặt đất bằng phẳng để đặt xuống. Giữ bài
  // test, sửa lời giải thích — một lời giải thích sai là thứ phiên sau kế thừa rồi dựa vào.
  // ⚠️ VÀ TỪ 2026-08-18 NÓ CHỈ CÒN ĐÚNG VỚI Ô ĐẤT — có chủ đích, không phải sơ suất. Ô ĐƯỜNG được
  // san thành dốc thoải nên cao độ của chúng là số lẻ. Lý do của bất biến này (mặt đất bằng cho
  // khối đáy phẳng) **không áp cho mặt phố**: không ai đặt nhà lên đó. Vế thứ hai của bài đếm
  // đúng bao nhiêu ô lẻ và chúng nằm ở đâu, để trạng thái ấy TƯỜNG MINH chứ không lặng lẽ.
  const KY_CO_SAN = [];
  let soODuongLe = 0;
  for (const era of ERAS) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    const unit = TERRACE_STEP * eraTerrainProfile(era).relief;
    if (unit <= 0) continue;
    let leCuaKy = 0;
    for (const cell of terrain.cells) {
      const steps = cell.h / unit;
      const chan = Math.abs(steps - Math.round(steps)) < 1e-9;
      if (laDuong(cell)) { if (!chan) leCuaKy += 1; continue; }
      assert.ok(
        chan,
        `kỷ ${era} ô ĐẤT (${cell.x},${cell.y}) cao ${cell.h} — không phải bội số của bậc ${unit}`,
      );
    }
    soODuongLe += leCuaKy;
    if (leCuaKy > 0) KY_CO_SAN.push(era);
  }

  // ── GÁC CHẠY-RỖNG: phép san đường có thật sự làm việc không? ──────────────────────────────
  /**
   * ⚠️ BẢN CŨ HỎI `soODuongLe > 200`, VÀ CON SỐ 200 ẤY LÀ MỘT MỨC TUYỆT ĐỐI HIỆU CHUẨN TRÊN BẢNG
   * `relief` CŨ. §1(B) hạ `relief` ở cả 15 kỷ ⇒ phép đếm rơi xuống 140 và gác kêu *"phép san gần
   * như không chạy"* — một lời BÁO ĐỘNG GIẢ, vì phép san vẫn chạy đúng y như trước; thứ đổi là số
   * chỗ CẦN san. Đúng bẫy Phase 7D: một lời hứa nói về QUAN HỆ mà được viết thành một hằng số.
   *
   * Quan hệ thật, và nó suy được chứ không phải chọn tay: phép san chỉ có việc để làm khi một bậc
   * thềm CAO HƠN mức dốc tối đa mà một con phố chịu được. Bậc thềm = `TERRACE_STEP × relief`; mức
   * chịu được = `maxRoadRise()`. ⇒ **tập kỷ có ô đường lẻ phải BẰNG tập kỷ có bậc thềm vượt
   * `maxRoadRise()`** — không nhiều hơn (san ở nơi không cần là đang bẻ cong mặt phố vô cớ), không
   * ít hơn (bỏ sót một kỷ đáng lẽ phải san là để lại đúng cái vách 173% mà bản vá sinh ra để xoá).
   *
   * Hai vế được tính bằng hai đường ĐỘC LẬP: vế trái đo trên cao độ `buildTerrain` THẬT SỰ trả ra,
   * vế phải suy từ bảng + hằng số. Không bên nào so với một con số thứ ba viết tay.
   */
  const KY_DANG_LE_PHAI_SAN = ERAS.filter(
    (era) => TERRACE_STEP * eraTerrainProfile(era).relief > maxRoadRise() + 1e-9,
  );
  assert.deepEqual(
    KY_CO_SAN, KY_DANG_LE_PHAI_SAN,
    `kỷ CÓ ô đường lẻ: ${JSON.stringify(KY_CO_SAN)} · kỷ ĐÁNG LẼ phải san (bậc thềm > `
    + `${maxRoadRise().toFixed(3)}): ${JSON.stringify(KY_DANG_LE_PHAI_SAN)}. Lệch nhau ⇒ hoặc phép `
    + 'san đã chết trong im lặng, hoặc nó đang san ở chỗ không cần.',
  );
  assert.ok(
    KY_CO_SAN.length >= 5 && soODuongLe > 100,
    `phép san chỉ chạm ${KY_CO_SAN.length} kỷ / ${soODuongLe} ô đường — quá ít để bài đếm ô ĐẤT ở `
    + 'trên có nghĩa; nhiều khả năng cả bảng địa hình vừa bị làm phẳng.',
  );
});

test('PHỐ KHÔNG BAO GIỜ DỐC HƠN CON PHỐ DỐC NHẤT THẾ GIỚI (34,8% — Baldwin Street)', () => {
  // ⚠️ ĐO TRÊN 80 Ô ỨNG VIÊN, KHÔNG TRÊN MẠNG ĐANG HIỆN. Mạng đang hiện đổi theo kỷ và theo số
  // phiên (công trình chiếm chỗ thì ô đường bị bỏ), nên một lời hứa phát biểu trên nó sẽ đúng hôm
  // nay và sai vào một buổi sáng nào đó — xem `cityLayout.test.js`.
  //
  // ⚠️ ĐỘ DỐC ≠ CHÊNH CAO ĐỘ. Mặt đất nội suy bằng `smoothstep`, đạo hàm cực đại 1,5 ở giữa quãng,
  // nên chỗ dốc nhất dốc gấp rưỡi mức trung bình. Quên hệ số ấy là tự cho mình dốc hơn 50%.
  const oDuong = [...O_DUONG].map((k) => k.split('|').map(Number));
  let soCap = 0;
  for (const era of ERAS) {
    const { heightAt } = buildTerrain({ era, gridSize: GRID });
    for (const [x, y] of oDuong) {
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        if (!O_DUONG.has(`${x + dx}|${y + dy}`)) continue;
        soCap += 1;
        const doc = SMOOTHSTEP_PEAK * Math.abs(heightAt(x, y) - heightAt(x + dx, y + dy));
        assert.ok(doc <= STREET_MAX_GRADE + 1e-9,
          `kỷ ${era}: phố giữa (${x},${y}) và (${x + dx},${y + dy}) dốc ${(doc * 100).toFixed(0)}% `
          + `— quá trần ${(STREET_MAX_GRADE * 100).toFixed(1)}%`);
      }
    }
  }
  assert.equal(soCap, 15 * 88, 'phép quét không duyệt đủ số cặp ô đường kề nhau đã hứa');
});

test('`SMOOTHSTEP_PEAK` PHẢI LÀ ĐẠO HÀM ĐỈNH THẬT CỦA MẶT ĐẤT, không phải một con số chép từ sách', () => {
  // ⚠️ VÌ SAO BÀI NÀY TỒN TẠI. Bài "PHỐ KHÔNG BAO GIỜ DỐC HƠN…" ở trên tính độ dốc bằng
  // `SMOOTHSTEP_PEAK * |Δh|`. Cái hệ số 1,5 ấy là một LỜI KHẲNG ĐỊNH VỀ HÀM NỘI SUY đang dùng
  // (`smoothstep`, đạo hàm cực đại 1,5 ở giữa quãng) — và cho tới hôm nay nó chỉ sống trong một
  // dòng CHÚ THÍCH. Đổi `smoothstep` thành `smootherstep` (đạo hàm đỉnh 1,875) thì mặt đất dốc
  // thêm 25% mà **cả bài cap lẫn đối chứng của nó vẫn xanh**, vì cả hai đều nhân với chính cái
  // hằng số đã lạc hậu. Cả cái trần Baldwin Street lúc ấy thành một lời nói dối có cấu trúc.
  // ⇒ Bài này ĐO đạo hàm thay vì tin nó — đúng luật "đừng DỰ ĐOÁN thứ có thể ĐO", và đúng bài học
  // "một câu tự trấn an trong chú thích cũng phải được kiểm như một con số" (Phase 8B).
  //
  // Cách đo: đi dọc MỘT quãng giữa hai tâm ô (giữ `y` ở đúng tâm ô nên thành phần nội suy theo `y`
  // triệt tiêu, còn lại đúng đường cong 1 chiều), lấy sai phân trên lưới mịn, rồi so ĐỈNH với
  // TRUNG BÌNH. Tỉ số ấy chính là hằng số đang xét, và nó không phụ thuộc quãng dốc bao nhiêu.
  const N = 1000;                      // sai phân trên lưới mịn; đỉnh đo được luôn ≤ đỉnh thật
  const SAN = 0.05;                    // quãng phẳng hơn mức này thì tỉ số vô nghĩa (0/0)
  let soQuang = 0;
  let toiDa = 0;
  for (const era of [1, 5, 7, 13]) {
    const { smoothHeightAt } = buildTerrain({ era, gridSize: GRID });
    for (let x = 0; x < GRID - 1; x += 1) {
      for (let y = 0; y < GRID; y += 1) {
        const trungBinh = Math.abs(smoothHeightAt(x + 1, y) - smoothHeightAt(x, y));
        if (trungBinh < SAN) continue;
        soQuang += 1;
        let dinh = 0;
        for (let i = 0; i < N; i += 1) {
          const a = smoothHeightAt(x + i / N, y);
          const b = smoothHeightAt(x + (i + 1) / N, y);
          dinh = Math.max(dinh, Math.abs(b - a) * N);
        }
        toiDa = Math.max(toiDa, dinh / trungBinh);
      }
    }
  }
  // ⚠️ GÁC CHẠY-RỖNG. Không có nó thì một `buildTerrain` trả mặt phẳng sẽ làm `soQuang = 0`, vòng
  // lặp không chạy lần nào, và bài test xanh mà chưa đo gì cả.
  assert.ok(soQuang >= 40,
    `chỉ tìm được ${soQuang} quãng đủ dốc để đo — phép đo gần như không chạy, con số dưới vô nghĩa`);

  // TRẦN: hàm nội suy không được dốc hơn thứ hằng số đang khai. Vượt ⇒ mọi con số độ dốc trong
  // file này đang bị khai THẤP đi, kể cả cái trần Baldwin Street.
  assert.ok(toiDa <= SMOOTHSTEP_PEAK + 1e-6,
    `đạo hàm đỉnh của mặt đất là ${toiDa.toFixed(4)} lần độ dốc trung bình, trong khi `
    + `SMOOTHSTEP_PEAK khai ${SMOOTHSTEP_PEAK} — hàm nội suy đã đổi, hằng số chưa đổi theo. `
    + 'Mọi phép tính độ dốc trong file này đang khai thấp hơn sự thật.');

  // SÀN: và nó cũng KHÔNG được thấp hơn nhiều — nếu không, một hàm nội suy TUYẾN TÍNH (đỉnh = 1,0)
  // sẽ qua được cái trần trên một cách thoải mái, và bài test này thành một cái phễu chứ không
  // phải hàng rào. Đây đúng là bài học Phase 9A: một ngưỡng chỉ chặn MỘT phía thì phía kia trôi tự
  // do. Sàn 0,9 chừa chỗ cho sai số sai phân (sai phân cho TRUNG BÌNH trên mỗi quãng con nên luôn
  // hụt so với đỉnh thật một chút), nhưng vẫn bắt được cả `linear` (1,0) lẫn `smootherstep` (1,875).
  assert.ok(toiDa >= 0.9 * SMOOTHSTEP_PEAK,
    `đạo hàm đỉnh chỉ ${toiDa.toFixed(4)} lần độ dốc trung bình, thấp hơn hẳn ${SMOOTHSTEP_PEAK} — `
    + 'hoặc hàm nội suy đã thành tuyến tính (thềm hết là thềm), hoặc phép đo đang không chạm mặt đất.');
});

test('ĐỐI CHỨNG: trường CHƯA SAN (bậc thềm thô) phải bị chính phép đo trên bắt', () => {
  // Không có bài này thì bài trên có thể xanh vì một lý do chẳng liên quan (vd `heightAt` trả 0).
  // Dựng lại đúng bộ số hỏng cũ: mặt đường bám thẳng lưới bậc thềm, chưa qua phép san. Đo được
  // ngày 2026-08-18 trước bản vá: 205/1320 cặp quá trần, chỗ dốc nhất 173% (kỷ 7).
  //
  // ⚠️ CON SỐ 1,15 LÀ MỘT HẰNG SỐ VIẾT NGUYÊN VĂN, VÀ ĐÓ LÀ CHỦ ĐÍCH — KHÔNG ĐƯỢC ĐỌC BẢNG HIỆN
  // TẠI. Bản đầu viết `eraTerrainProfile(7).relief`, nghe rất "một luật một công thức" nhưng nó
  // đặt cái ĐỐI CHỨNG lên chính cái bảng mà đối chứng sinh ra để canh: §1(B) hạ `relief` kỷ 7 từ
  // 1,15 xuống 0,55 và bài này lập tức đỏ với thông báo *"đối chứng đã trôi khỏi thứ nó nhốt"* —
  // đúng như nó phải thế. Một đối chứng NHỐT một bộ số hỏng ĐÃ XẢY RA TRONG QUÁ KHỨ; quá khứ thì
  // không đổi theo bảng hôm nay. Ngày nào bảng đổi tiếp, con số 1,15 vẫn phải làm phép đo kêu.
  const RELIEF_KY7_TRUOC_BAN_VA = 1.15;                   // bảng `ERA_TERRAIN` lúc 2026-08-18
  const buoc = TERRACE_STEP * RELIEF_KY7_TRUOC_BAN_VA;
  const tho = (x, y) => (x + y >= 8 ? 2 * buoc : 0);      // một ranh thềm HAI bậc cắt ngang phố
  let batDuoc = 0;
  const oDuong = [...O_DUONG].map((k) => k.split('|').map(Number));
  for (const [x, y] of oDuong) {
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      if (!O_DUONG.has(`${x + dx}|${y + dy}`)) continue;
      if (SMOOTHSTEP_PEAK * Math.abs(tho(x, y) - tho(x + dx, y + dy)) > STREET_MAX_GRADE) batDuoc += 1;
    }
  }
  assert.ok(batDuoc > 0, 'phép đo không còn nhìn thấy một ranh thềm cắt ngang phố — con số 0 kia vô nghĩa');
  assert.ok(SMOOTHSTEP_PEAK * 2 * buoc > 1.7,
    `bộ số hỏng cũ dựng lại chỉ còn dốc ${(SMOOTHSTEP_PEAK * 2 * buoc * 100).toFixed(0)}% thay vì `
    + '173% — ai đó vừa đổi hằng số nhốt-quá-khứ ở trên, đối chứng đã trôi khỏi thứ nó nhốt');
});

test('SAN ĐƯỜNG KHÔNG ĐƯỢC ĐẨY ĐỘ DỐC SANG NGANG: bờ đất bên lề rộng hơn một bậc ở TỐI ĐA 5 chỗ', () => {
  // ⚠️ ĐÂY LÀ MỐC KHÔNG-ĐƯỢC-TỆ-HƠN, và nó tồn tại vì bản vá ĐẦU TIÊN đã phạm đúng lỗi này: san
  // dọc xong thì độ dốc NGANG (đường ↔ đất kề bên) xấu đi — kỷ 5 từ 101% lên 184%. Trước bản vá,
  // chênh đường↔đất chưa bao giờ quá MỘT bậc thềm (cả hai cùng nằm trên lưới bậc). Sau bản vá,
  // 5/2160 chỗ vượt — và chúng vượt vì một lý do HÌNH HỌC không gỡ được: ở đó đất hai bên phố
  // chênh nhau hơn hai bậc, nên không có cao độ nào vừa giữ phố dưới 34,8% vừa nằm trong một bậc
  // của cả hai bên. Khi buộc phải chọn, PHỐ thắng — cái giá trả trên BỜ ĐẤT, không trên mặt phố.
  let vuot = 0;
  let tongCap = 0;
  for (const era of ERAS) {
    const { heightAt } = buildTerrain({ era, gridSize: GRID });
    const buoc = TERRACE_STEP * eraTerrainProfile(era).relief;
    if (buoc <= 0) continue;
    for (const k of O_DUONG) {
      const [x, y] = k.split('|').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (O_DUONG.has(`${x + dx}|${y + dy}`)) continue;
        tongCap += 1;
        if (Math.abs(heightAt(x, y) - heightAt(x + dx, y + dy)) > buoc + 1e-9) vuot += 1;
      }
    }
  }
  assert.ok(tongCap > 2000, `chỉ duyệt ${tongCap} cặp đường↔đất — phép quét đang chạy rỗng`);
  assert.ok(vuot <= 5,
    `${vuot}/${tongCap} chỗ bờ đất rộng hơn một bậc thềm (mốc: 5). Phép san đang đẩy độ dốc sang `
    + 'ngang — đổi lòi lõm dọc lấy lòi lõm ngang thì không phải một bản vá.');
});

test('`footprint` trả cao độ CAO NHẤT dưới bóng công trình, và phần hụt để làm móng', () => {
  // Đứng ở cao độ cao nhất ⇒ KHÔNG BAO GIỜ có góc treo lơ lửng. Phần hụt (`drop`) là chiều cao
  // khối móng phải lấp xuống — bệ kè, đúng như nhà trên sườn đồi ngoài đời.
  const terrain = buildTerrain({ era: 5, gridSize: GRID });   // kỷ dốc nhất
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      const fp = terrain.footprint(x, y, 3);
      assert.ok(fp.drop >= 0, `drop âm tại (${x},${y})`);
      let top = -Infinity;
      let bottom = Infinity;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const h = terrain.heightAt(x + dx, y + dy);
          if (h > top) top = h;
          if (h < bottom) bottom = h;
        }
      }
      assert.equal(fp.top, top, `(${x},${y}): phải đứng ở cao độ CAO NHẤT dưới bóng mình`);
      assert.equal(fp.drop, top - bottom, `(${x},${y}): drop phải bằng phần hụt`);
    }
  }
  // Công trình rộng 1 ô không bao giờ cần móng.
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      assert.equal(terrain.footprint(x, y, 1).drop, 0, `ô đơn (${x},${y}) không được cần móng`);
    }
  }
});

test('dữ liệu rác KHÔNG làm nổ, và ngoài lưới thì kẹp về mép', () => {
  const terrain = buildTerrain({ era: 999, gridSize: GRID });
  assert.ok(Number.isFinite(terrain.maxHeight));
  assert.equal(terrain.cells.length, GRID * GRID);
  assert.equal(terrain.heightAt(-5, -5), terrain.heightAt(0, 0), 'ngoài lưới phải kẹp về ô mép');
  assert.equal(terrain.heightAt(99, 99), terrain.heightAt(GRID - 1, GRID - 1));
  assert.ok(Number.isFinite(buildTerrain({}).maxHeight), 'gọi không tham số vẫn phải chạy');
  assert.equal(buildTerrain({ era: 1, gridSize: 0 }).cells.length, 1, 'lưới suy biến vẫn phải hợp lệ');
});

test('mỗi kỷ phải GIẢI THÍCH ĐƯỢC địa hình của mình bằng một nơi có thật', () => {
  // ⚠️ Cùng luật với `country`/`landmark` ở `eraStyle.js` (`CLAUDE.md`): con số không có lời giải
  // thích là con số tuỳ hứng, và tuỳ hứng chính là thứ đã sinh ra "15 kỷ cao bằng nhau" ở Phase 5B.
  for (const era of ERAS) {
    const profile = ERA_TERRAIN[era];
    assert.ok(profile, `kỷ ${era} thiếu hồ sơ địa hình`);
    assert.ok(
      typeof profile.note === 'string' && profile.note.length >= 20,
      `kỷ ${era} thiếu lời giải thích địa hình (đang là ${JSON.stringify(profile.note)})`,
    );
    assert.ok(profile.terraces >= 1 && profile.relief >= 0, `kỷ ${era} có tham số vô lý`);
  }
});

test('MẶT ĐẤT MƯỢT PHẢI ĐI QUA ĐÚNG TÂM Ô — nếu không, cả thành phố lơ lửng hoặc lún', () => {
  // ⚠️ ĐÂY LÀ BẤT BIẾN ĐẮT NHẤT CỦA PHASE 8C, và nó hỏng trong im lặng tuyệt đối.
  // Nhà, giàn giáo, cây, cư dân đều đứng ở `heightAt` của ô mình. Mặt đất thì nay được vẽ bằng
  // `smoothHeightAt`. Hai hàm ấy PHẢI bằng nhau tại toạ độ nguyên — không phải "gần bằng", mà
  // bằng đúng: lệch 2% thôi là mỗi căn nhà trong thành phố hụt hoặc lún vài phân, và không có gì
  // đỏ lên, không có cảnh báo nào, chỉ có một tấm ảnh trông hơi sai mà không ai chỉ ra được sai ở
  // đâu. Đúng hình dạng lỗi "sáu chỗ bám đất" của Phase 7B, lần này nhỏ hơn nên khó thấy hơn.
  for (const era of ERAS) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    for (const cell of terrain.cells) {
      assert.equal(
        terrain.smoothHeightAt(cell.x, cell.y), terrain.heightAt(cell.x, cell.y),
        `kỷ ${era} ô (${cell.x},${cell.y}): mặt đất mượt lệch khỏi cao độ mà mọi vật đang đứng`,
      );
    }
  }
});

test('MẶT ĐẤT PHẢI THẬT SỰ DỐC GIỮA HAI TÂM Ô — không được lén quay về bậc thang', () => {
  // Bài trên đòi hai hàm khớp nhau ở tâm ô. Chỉ mình nó thì `smoothHeightAt = heightAt` (làm tròn
  // về ô gần nhất) cũng qua cửa — mà đó CHÍNH LÀ bậc thang, tức cả Phase 8C bị hoàn tác mà test
  // vẫn xanh. Nên phải hỏi thêm: giữa hai ô chênh nhau một bậc, điểm chính giữa có nằm ở KHOẢNG
  // GIỮA không.
  let checked = 0;
  for (const era of ERAS) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    for (let y = 0; y < GRID; y += 1) {
      for (let x = 0; x < GRID - 1; x += 1) {
        const a = terrain.heightAt(x, y); const b = terrain.heightAt(x + 1, y);
        if (a === b) continue;
        const mid = terrain.smoothHeightAt(x + 0.5, y);
        assert.ok(
          Math.abs(mid - (a + b) / 2) < 1e-9,
          `kỷ ${era} giữa ô (${x},${y}) và (${x + 1},${y}): điểm giữa ở ${mid}, đáng lẽ ${(a + b) / 2}`,
        );
        checked += 1;
      }
    }
  }
  assert.ok(checked >= 50, `chỉ kiểm được ${checked} chỗ chênh bậc — bài test này đang chạy không`);
});

test('RA KHỎI `APRON_EDGE` THÌ MẶT ĐẤT PHẲNG ĐÚNG `-APRON_DROP` — TRỪ chỗ có nước', () => {
  // ⚠️ Đây là LỜI HỨA VỚI `sceneGraph.js`: tấm ván vùng ngoài ngồi ở đúng cao độ ấy, nên nếu rìa
  // tấm địa hình còn gợn thì chỗ giáp sẽ là một đường răng cưa hở cả gầm — vòng quanh thành phố,
  // và im lặng. Kiểm ở NHIỀU hướng vì bán kính chuyển tiếp bị nhiễu nhân vào: chỗ nào nhiễu lớn
  // nhất mới là chỗ chạm trần, và đúng chỗ đó mới lộ lỗi.
  //
  // ⚠️ VIỆC 2 Bước B (2026-08-19) THÊM MỘT NGOẠI LỆ, VÀ NGOẠI LỆ ẤY PHẢI ĐẾM ĐƯỢC. Mặt nước khoét
  // mặt đất xuống dưới `-APRON_DROP` ở đúng những chỗ nó chảy qua, nên câu "phẳng đúng" hết đúng ở
  // đó — nhưng lời hứa gốc (hai tấm phải KHỚP NHAU) thì vẫn nguyên giá trị, chỉ là mốc khớp nay là
  // cao độ đã khoét chứ không phải một hằng số. Nên chỗ ướt KHÔNG bị bỏ qua: nó chuyển sang hỏi
  // `horizon.heightAt` xem hai tấm có bằng nhau không. Bỏ qua trắng thì bài test này sẽ lặng lẽ
  // rỗng dần mỗi lần có thêm một kỷ được dựng nước.
  //
  // ⚠️ BƯỚC C (2026-08-20) — GÁC CHẠY-RỖNG PHẢI HỎI **TỪNG KỶ**, KHÔNG HỎI TỔNG. Bản trước đòi
  // `soDiemKho > 1400` trên tổng 1500 điểm. Con số ấy đúng khi chỉ có hai kỷ nước; Bước C dựng
  // nước cho 14 kỷ và tổng tụt xuống 1259 — nhưng cái tụt ấy KHÔNG nói lên điều gì, vì một cái
  // tổng thì một kỷ ngập gần hết vẫn được chín kỷ khô bù cho. Đúng bẫy "hỏi tổng thì một kỷ dư chỗ
  // bù cho một kỷ vượt" (`TECH_DEBT #38`). ⇒ Hỏi **tỉ lệ khô của TỪNG kỷ** (đo thật: thấp nhất
  // 75,0% — dải rìa có bốn cạnh, và một dòng sông thì cắt qua đúng MỘT cạnh).
  //
  // ⚠️ Và bảng "kỷ nào có rìa chạm nước" là một sự thật ĐỊA LÝ đáng ghi ra, không phải một con số
  // phụ: bốn kỷ có nước mà rìa vẫn khô trọn (4 · 5 · 10 · 15) không phải lỗi — vòng rìa nằm ở
  // khoảng cách `APRON_EDGE` = 3,4 ô ngoài lưới, nên nước `reach: 1` (kỷ 5, 10 — sát chân phố) rơi
  // vào PHÍA TRONG vòng ấy, còn nước `reach: 5`/`reach: 6` (kỷ 4, 15 — sông xa, biển xa) rơi ra
  // PHÍA NGOÀI. Bảng này đỏ cả hai chiều nên nó là chỗ duy nhất một thay đổi `reach` bị chặn lại.
  //
  // THỬ-CHO-ĐỎ (nêu TRƯỚC chỗ mong đỏ, và ghi cả lần KHÔNG đỏ vì đó cũng là một kết quả):
  //   · đẩy kênh kỷ 10 ra `reach: 3.5` ⇒ ĐỎ ở `KY_RIA_CHAM_NUOC` (kỷ 10 nhập bảng) ✓
  //   · đẩy khúc uốn kỷ 5 ra `reach: 4` ⇒ ĐỎ ở `tiLeKho >= 0.70` (29,0%) — KHÔNG phải ở bảng như
  //     tôi đoán, vì khúc uốn ôm BA cạnh vòng rìa chứ không cắt qua một cạnh ✓
  //   · nới sông kỷ 2 rộng 12 ô ⇒ **KHÔNG đỏ**, và đó là đúng: `width` nới nước ra PHÍA NGOÀI theo
  //     hướng `side`, nó không kéo nước cắt thêm cạnh nào của vòng rìa. Ghi ra để phiên sau đừng
  //     tưởng `tiLeKho` canh được bề rộng — nó canh SỐ CẠNH bị cắt, mà đó là chuyện của `reach`.
  let soDiemKho = 0;
  let soDiemUot = 0;
  const KY_RIA_CHAM_NUOC = [];
  for (const era of ERAS) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    const horizon = buildHorizon({ era, gridSize: GRID });
    const half = (GRID - 1) / 2;
    let khoKy = 0;
    let uotKy = 0;
    for (let t = 0; t <= 24; t += 1) {
      const along = -0.5 + (GRID * t) / 24;
      const out = GRID - 0.5 + APRON_EDGE + 0.01;
      for (const [u, v] of [[-0.5 - APRON_EDGE - 0.01, along], [out, along],
        [along, -0.5 - APRON_EDGE - 0.01], [along, out]]) {
        const cao = terrain.surfaceHeightAt(u, v);
        if (terrain.setting.blendAt(u, v) > 0) {
          soDiemUot += 1;
          uotKy += 1;
          const troi = horizon.heightAt(u - half, v - half);
          assert.ok(Math.abs(cao - troi) < 1e-9,
            `kỷ ${era} tại (${u.toFixed(2)},${v.toFixed(2)}): chỗ có nước mà hai tấm lệch nhau — `
            + `địa hình ${cao.toFixed(6)}, chân trời ${troi.toFixed(6)}`);
          continue;
        }
        soDiemKho += 1;
        khoKy += 1;
        assert.ok(
          Math.abs(cao + APRON_DROP) < 1e-9,
          `kỷ ${era} tại (${u.toFixed(2)},${v.toFixed(2)}): rìa ở ${cao}, `
          + `đáng lẽ ${-APRON_DROP} — sẽ hở một khe giữa địa hình và tấm ván vùng ngoài`,
        );
      }
    }
    // Gác chạy-rỗng TỪNG KỶ: kỷ nào cũng phải còn phần lớn rìa khô, nếu không thì lời hứa "phẳng
    // đúng" đã mất răng ở đúng kỷ ấy mà cái tổng thì không hé một lời. Đo thật: thấp nhất 75,0%.
    const tiLeKho = khoKy / (khoKy + uotKy);
    assert.ok(tiLeKho >= 0.70,
      `kỷ ${era}: chỉ còn ${(tiLeKho * 100).toFixed(1)}% vòng rìa là khô — lời hứa "phẳng đúng ở `
      + `-APRON_DROP" đã gần như không còn chỗ nào để mà đúng.`);
    if (uotKy > 0) KY_RIA_CHAM_NUOC.push(era);
  }
  // Gác chạy-rỗng toàn cục, thô: đo thật 1259 khô / 241 ướt trên 1500 điểm.
  assert.ok(soDiemKho > 1200, `chỉ còn ${soDiemKho} điểm rìa khô — lời hứa "phẳng đúng" đang rỗng dần`);
  assert.ok(soDiemUot > 200,
    `chỉ ${soDiemUot} điểm rìa chạm nước — nhánh so hai tấm đang teo lại, không còn canh được gì`);
  assert.deepEqual(KY_RIA_CHAM_NUOC, [2, 3, 6, 7, 8, 9, 11, 12, 13, 14],
    'bảng kỷ có vòng rìa chạm nước đã đổi — nghĩa là một `reach` nào đó vừa vượt hoặc vừa tụt qua '
    + `mốc APRON_EDGE = ${APRON_EDGE}; kiểm lại bằng mắt rồi mới sửa bảng này.`);
});

test('VÙNG ĐẤT NGOÀI PHẢI THẤP HƠN CAO NGUYÊN, và ranh giới phải LƯỢN chứ không vuông', () => {
  // Hai nửa của cùng một điều Đàm yêu cầu ("irregular silhouettes"). Nửa (a): thành phố phải nằm
  // TRÊN một cao nguyên, không phải trên một cái khay. Nửa (b): bán kính chuyển tiếp bị nhiễu nhân
  // vào, nên nếu nó ra một hằng số thì mép lại vuông vức — và một mép vuông hoàn hảo chính là dấu
  // hiệu số một để mắt đọc ra "bàn cờ".
  for (const era of ERAS) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    const rim = [];
    for (let t = 0; t <= 40; t += 1) {
      const along = -0.5 + (GRID * t) / 40;
      // Đi ra ngoài đúng 1 ô rồi đo tụt bao nhiêu — số này chính là "ranh giới nằm ở đâu".
      rim.push(terrain.smoothHeightAt(0, Math.min(GRID - 1, Math.max(0, along)))
        - terrain.surfaceHeightAt(-1.5, along));
    }
    const lo = Math.min(...rim); const hi = Math.max(...rim);
    assert.ok(hi > 0.02, `kỷ ${era}: vùng ngoài không hề thấp hơn cao nguyên`);
    assert.ok(
      hi - lo > 0.05,
      `kỷ ${era}: mức tụt ở rìa gần như không đổi (${lo.toFixed(3)}..${hi.toFixed(3)}) — ranh giới `
      + 'đang là một hình vuông đều tăm tắp, đúng thứ làm cảnh đọc ra bàn cờ',
    );
  }
});

test('`tintAt` phải TẤT ĐỊNH, nằm trong 0..1, và đổi theo cả hai trục', () => {
  // Vết loang là thứ giữ cho mặt đất KHÔNG phẳng lì ở 5 kỷ đồng bằng (nơi độ dốc bằng 0 nên tầng
  // "sườn dốc lộ đất" không đóng góp gì). Nó trả một hằng số thì 5 kỷ ấy về lại một mảng màu chết.
  for (const era of [1, 7, 12, 15]) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    const seen = new Set();
    for (let j = 0; j <= 12; j += 1) {
      for (let i = 0; i <= 12; i += 1) {
        const v = terrain.tintAt(i, j);
        assert.ok(v >= 0 && v <= 1, `kỷ ${era} tintAt(${i},${j}) = ${v} — ngoài 0..1`);
        assert.equal(v, terrain.tintAt(i, j), 'không tất định');
        seen.add(v.toFixed(4));
      }
    }
    assert.ok(seen.size >= 30, `kỷ ${era}: vết loang chỉ có ${seen.size} giá trị — gần như phẳng`);
  }
});

test('KHUÔN HÌNH HỌC phải SẠCH NHIỄU — đổi hạt giống mà khuôn không nhúc nhích', () => {
  // ⚠️ BẢN CŨ HỎI SAI CÂU, VÀ NÓ CHỈ LỘ RA KHI BẢNG ĐỔI. Nó nhóm các kỷ theo `shape` rồi đòi hai
  // kỷ cùng `shape` phải ra cùng một khuôn. Từ §1(B), khuôn còn phụ thuộc `drain` và `tilt`, nên
  // hai kỷ cùng khai `valley` ra hai khuôn khác nhau là ĐÚNG chứ không phải lỗi.
  //
  // ⚠️ VÀ CÁCH VÁ HIỂN NHIÊN NHẤT LÀ MỘT CÁI BẪY: nhóm theo `shape|drain|tilt` thì **không một cặp
  // kỷ nào còn trùng khoá**, vòng lặp không so lần nào, và bài test XANH mà chưa kiểm gì cả — một
  // cái phễu đội lốt một hàng rào (đúng bài học "assert 'có ít nhất một chỗ'", Phase 7A).
  //
  // Câu hỏi ĐÚNG là câu mà `geometricTemplate` sinh ra để trả lời: **khuôn có phụ thuộc HẠT GIỐNG
  // NHIỄU không?** Hạt giống của `buildTerrain` là `${era}|${shape}`, nên chỉ cần dựng một kỷ SONG
  // SINH — số hiệu khác, mọi tham số y hệt — rồi đòi hai khuôn trùng nhau từng con số. Cách này
  // kiểm được CẢ 15 hồ sơ thật, không chỉ những hồ sơ tình cờ trùng nhau.
  //
  // ⚠️ Kèm VẾ NGƯỢC LẠI, nếu không thì vế trên xanh oan: địa hình THẬT của hai kỷ song sinh phải
  // KHÁC nhau. Thiếu vế này, một `valueNoise` trả hằng số sẽ làm mọi khuôn trùng nhau và bài test
  // reo mừng — trong khi "khuôn đã gỡ hết nhiễu" lúc ấy là một câu nói về một cơ chế không tồn tại.
  const KY_SONG_SINH = 900;
  const van = (field) => Array.from(field).map((v) => v.toFixed(9)).join(',');
  const chuKyDat = (era) => buildTerrain({ era, gridSize: GRID }).cells
    .map((c) => c.h.toFixed(6)).join(',');
  let soHoSo = 0;
  let soKhacNhau = 0;
  try {
    for (const era of ERAS) {
      ERA_TERRAIN[KY_SONG_SINH] = { ...eraTerrainProfile(era) };
      soHoSo += 1;
      assert.equal(
        van(geometricTemplate({ era: KY_SONG_SINH, gridSize: GRID }).field),
        van(geometricTemplate({ era, gridSize: GRID }).field),
        `kỷ ${era}: chỉ đổi SỐ HIỆU kỷ (mọi tham số y hệt) mà khuôn đã đổi ⇒ khuôn vẫn còn dính `
        + 'nhiễu, và mọi con số "phần dư" đo bằng nó đều sai',
      );
      if (chuKyDat(era) !== chuKyDat(KY_SONG_SINH)) soKhacNhau += 1;
    }
  } finally {
    delete ERA_TERRAIN[KY_SONG_SINH];
  }
  assert.equal(soHoSo, 15, `chỉ kiểm ${soHoSo} hồ sơ — vòng lặp đang bỏ qua kỷ trong im lặng`);

  // Kỷ 14 khai `terraces: 1, relief: 0` — mặt đất PHẲNG TUYỆT ĐỐI do người san (Marina Bay). Ở đó
  // nhiễu không có gì để điều biến, nên hai kỷ song sinh ra hai mặt đất y hệt nhau, và điều đó
  // đúng chứ không phải hỏng.
  //
  // ⚠️ VÀ KỶ 12 LÀ MỘT NGOẠI LỆ THỨ HAI, ĐO ĐƯỢC, KHÔNG PHẢI MỘT NGƯỠNG BỊ NỚI. Sau khi `drain`
  // của nó được sửa cho khớp `settingStyle` (Volga ở phía ĐÔNG, không phải nam), trường cao độ
  // chia đúng **72/72 ô** giữa hai bậc và **0/144 ô** đổi khi đổi hạt giống — trong khi ba kỷ
  // `plain` còn lại đổi 6–8 ô. Nguyên nhân đo được: kỷ 12 có `tilt` cao nhất nhóm (0,55) mà chỉ
  // khai **2 bậc**, nên sau khi lượng tử hoá thì cái TRIỀN quyết định trọn vẹn, biên độ bẻ cong
  // của nhiễu (±0,9 ô) không đủ đẩy ô nào qua ranh giới bậc. Chênh cao thật của kỷ này là 0,11 đơn
  // vị — dưới một phần tư bậc thềm — nên nó KHÔNG nhìn thấy được; ghi ra ở đây để phiên sau khỏi
  // tưởng là hỏng, và để nếu có kỷ THỨ BA rơi vào thì bài test tự đỏ. Xem `TECH_DEBT #66`.
  const KY_PHANG = ERAS.filter((era) => eraTerrainProfile(era).terraces < 2);
  const KHONG_DOI = [];
  for (const era of ERAS) {
    ERA_TERRAIN[KY_SONG_SINH] = { ...eraTerrainProfile(era) };
    if (chuKyDat(era) === chuKyDat(KY_SONG_SINH)) KHONG_DOI.push(era);
    delete ERA_TERRAIN[KY_SONG_SINH];
  }
  assert.deepEqual(KHONG_DOI, [12, 14],
    `đúng HAI kỷ có địa hình KHÔNG đổi khi đổi hạt giống: kỷ 14 (phẳng tuyệt đối do người san) và `
    + `kỷ 12 (triền nuốt trọn nhiễu sau khi chia 2 bậc — xem chú thích trên). Đo được ${KHONG_DOI}. `
    + 'Danh sách đổi ⇒ hoặc có kỷ thứ ba vừa rơi vào, hoặc một trong hai kỷ ấy vừa được chữa — cả '
    + 'hai đều phải xem lại `TECH_DEBT #66`, KHÔNG được sửa con số ở đây.');
  assert.deepEqual(KY_PHANG, [14],
    'chỉ kỷ 14 khai mặt đất phẳng tuyệt đối; kỷ 12 KHÔNG phẳng (chênh 0,11 đv) — nó chỉ hết nhạy '
    + 'với hạt giống, và hai chuyện đó khác nhau.');
  assert.ok(soKhacNhau >= ERAS.length - KHONG_DOI.length,
    `chỉ ${soKhacNhau} kỷ đổi theo hạt giống — hạt giống gần như không làm gì, nên câu "khuôn đã `
    + 'gỡ hết nhiễu" ở trên đang nói về một cơ chế rỗng.');
});

test('MỌI KIỂU ĐỊA HÌNH ĐỀU PHẢI CÓ MỘT LÝ DO HÌNH HỌC — không kiểu nào là nhiễu trắng', () => {
  // ⚠️ BÀI NÀY TỪNG LÀ MỘT CÁI HẸN GIỜ, VÀ NÓ VỪA REO. Bản trước ghi
  // `assert.deepEqual(vaLyDo.sort(), ['plain', 'rolling'])` — một khuyết tật được ĐẾM chứ không
  // phải một lời hứa: `SHAPES.plain` và `SHAPES.rolling` khi ấy đều là `(n) => n`, thuần nhiễu,
  // nên năm kỷ (2, 3, 7, 11, 12) có mặt đất **không thể** đọc ra lý do dù `note` của chúng hứa hẳn
  // "đồng bằng phù sa sông Nin" hay "đồi Toscana nối nhau". Con số ấy là thứ buộc §1(B) phải mở
  // bài test này ra đọc — đúng vai của nó: *một mục trong `TECH_DEBT.md` chỉ được đọc khi có người
  // đi tìm; một con số trong bài test thì tự đòi được đọc.*
  //
  // Nay cả sáu kiểu đều có thành phần hình học, nên bài đổi vai từ ĐẾM NỢ sang GIỮ LỜI HỨA.
  // ⚠️ PHẢI TẮT `tilt` MỚI ĐO ĐƯỢC THỨ ĐANG HỎI — và tôi biết điều đó vì phép thử ngược KHÔNG NỔ.
  // Bản đầu của chính bài này đo thẳng khuôn của kỷ đại diện. Phá thử (`rolling: () => 0.5`, tức
  // giết sạch hình học của một kiểu) thì bài test vẫn XANH. Lý do: `truongTho` ghép theo công thức
  // `raw = hinh × (1 − tilt) + trien × tilt`, nên cái triền nghiêng được cộng vào **BÊN NGOÀI** hàm
  // hình dạng. Kỷ 7 khai `tilt: 0,44` ⇒ khuôn của nó vẫn biến thiên rõ ràng dù hàm hình dạng đã
  // chết hẳn. Tôi đang đo `shape + tilt·trien` rồi gọi đó là `shape` — đúng hình dạng sai của
  // `TECH_DEBT #22` (một đại lượng chứa sẵn thứ mình không muốn đo).
  //
  // Vá bằng cách hỏi đúng câu: dựng một hồ sơ song sinh với `tilt: 0` để chỉ còn lại hàm hình dạng.
  // `trien` vẫn được phép xuất hiện — nó là một ĐẦU VÀO HÌNH HỌC (`coast` và `dune` xây trên nó),
  // khác hẳn với nhiễu.
  const bienDo = (field) => Math.max(...field) - Math.min(...field);
  const KIEU = [...new Set(ERAS.map((e) => eraTerrainProfile(e).shape))].sort();
  const KY_THU = 901;
  const vaLyDo = [];
  let yeuNhat = { dang: '', bien: Infinity };
  try {
    for (const dang of KIEU) {
      const era = ERAS.find((e) => eraTerrainProfile(e).shape === dang);
      ERA_TERRAIN[KY_THU] = { ...eraTerrainProfile(era), tilt: 0 };
      const bien = bienDo(geometricTemplate({ era: KY_THU, gridSize: GRID }).field);
      if (bien < yeuNhat.bien) yeuNhat = { dang, bien };
      if (bien < 1e-9) vaLyDo.push(dang);
    }
  } finally {
    delete ERA_TERRAIN[KY_THU];
  }
  assert.equal(KIEU.length, 6, `bảng có ${KIEU.length} kiểu địa hình thay vì 6 — bảng vừa đổi`);
  assert.deepEqual(
    vaLyDo, [],
    `kiểu địa hình THUẦN NHIỄU (khuôn phẳng lì, không đọc ra lý do): ${JSON.stringify(vaLyDo)}`,
  );

  // ⚠️ BIÊN, KHÔNG CHỈ XANH/ĐỎ. "Khác 0" là một cái vạch quá dễ vượt: một kiểu có biên độ 0,01 thì
  // về mặt toán là "có hình học", còn trên màn hình thì vẫn là nhiễu. Sàn 0,30 chừa chỗ cho việc
  // chỉnh mỹ thuật sau này mà vẫn bắt được một kiểu đang thoái hoá về phẳng.
  assert.ok(
    yeuNhat.bien > 0.30,
    `kiểu '${yeuNhat.dang}' có khuôn biên độ ${yeuNhat.bien.toFixed(3)} — quá mỏng để mắt đọc ra `
    + 'một hình dạng; kiểu này đang trôi về nhiễu trắng.',
  );

  // ĐỐI CHỨNG: phép đo phải bắt được một khuôn phẳng lì thật. Không có vế này thì `bienDo` trả
  // NaN (hoặc luôn dương) cũng làm bài test xanh.
  assert.ok(bienDo(new Float64Array(GRID * GRID)) < 1e-9,
    'phép đo biên độ không nhận ra nổi một trường phẳng lì — con số 0 ở trên vô nghĩa');
});

test('KHUÔN không được phụ thuộc tiến độ chơi (ADR-007)', () => {
  // Cùng cách khoá đã dùng cho `buildTerrain`: gọi kèm dữ liệu rác rồi đòi kết quả Y HỆT. "Hàm
  // hiện không nhận tham số đó" là một sự thật rất dễ mất — chỉ cần ai đó thêm một tham số tuỳ
  // chọn là bất biến chết mà mọi test khác vẫn xanh.
  for (const era of ERAS) {
    const sach = Array.from(geometricTemplate({ era, gridSize: GRID }).field);
    const rac = Array.from(geometricTemplate({
      era, gridSize: GRID, built: ['a', 'b'], sessionCount: 400, buildings: [1, 2, 3],
    }).field);
    assert.deepEqual(rac, sach, `kỷ ${era}: khuôn đổi khi truyền thêm dữ liệu tiến độ`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// HAI BẢNG KHÔNG ĐƯỢC TRÔI KHỎI NHAU: `drain` (đất thấp về đâu) ↔ `side` (nước ở đâu)
// ═══════════════════════════════════════════════════════════════════════════════

test('NƯỚC NẰM Ở CHỖ THẤP — `drain` của mỗi kỷ phải TRÙNG `side` mà `settingStyle` khai', () => {
  // ⚠️ ĐÂY LÀ BÀI HỌC ĐẮT NHẤT CỦA §1(B), VÀ NÓ LỘ RA SAU KHI MỌI CON SỐ ĐỀU ĐÃ XANH.
  //
  // §1(B) thêm trường `drain` — hướng đất thấp của mỗi kỷ — và buộc nó vào `country` ở
  // `eraStyle.js`, đúng khuôn đã dùng cho `streetStyle`/`floraStyle`/`groundFloorStyle`. Nhưng
  // `country` KHÔNG phải ràng buộc chặt nhất: một đất nước có bốn phía, còn dòng sông thì chỉ có
  // MỘT. Kết quả là 9/14 kỷ có nước khai `drain` lệch hoặc NGƯỢC hẳn với `side` — kỷ 5 khai đất
  // thấp về tây trong khi suối Elzbach ở đông, tức nước đang chảy LÊN DỐC. Không một bài test nào
  // đỏ, vì hai bảng ấy chưa bao giờ được đặt cạnh nhau.
  //
  // ⇒ Luật đúng là một mệnh đề vật lý, không phải một lựa chọn mỹ thuật: **nước đứng ở chỗ thấp**.
  // Nên `drain` không tự do — nó bị `side` ấn định ở mọi kỷ có nước, và chỉ tự do ở kỷ khô.
  //
  // ⚠️ VÀ CÁI GIÁ PHẢI NÓI THẲNG: sửa cho ĐÚNG VẬT LÝ làm cổng "thấy nước" TỆ ĐI ở vài kỷ (bờ xa
  // tụt xuống khuất sau sống đất gần), xem `TECH_DEBT #59` và `scripts/waterView.test.js`. Đó là
  // một đánh đổi có thật, và hướng giải quyết KHÔNG phải nói dối địa lý để mua một con số —
  // ADR-025 đã cấm đúng điều đó với mặt đường.
  //
  // THỬ-CHO-ĐỎ: đổi `drain` của kỷ 5 về `'tay'` (giá trị sai cũ) ⇒ đỏ ngay ở kỷ 5.
  let soKyCoNuoc = 0;
  for (let era = 1; era <= 15; era += 1) {
    const setting = getSetting(era);
    if (!setting || setting.water === 'none') continue;
    soKyCoNuoc += 1;
    assert.equal(ERA_TERRAIN[era].drain, setting.side,
      `kỷ ${era}: đất thấp về "${ERA_TERRAIN[era].drain}" mà nước lại ở "${setting.side}" ⇒ nước `
      + 'chảy lên dốc. Sửa `drain` ở `ERA_TERRAIN` cho khớp `settingStyle`, ĐỪNG sửa `side` — '
      + '`settingStyle` là bảng địa thế có khảo cứu, `drain` là bảng đi sau.');
  }
  assert.equal(soKyCoNuoc, 14,
    `chỉ xét được ${soKyCoNuoc} kỷ có nước — bảng địa thế đổi thì con số này phải được xem lại, `
    + 'không được để vòng lặp im lặng bỏ qua.');

  // Vế còn lại: kỷ KHÔ thì `drain` tự do, nhưng vẫn phải khai một hướng thật (không rỗng).
  const kyKho = [];
  for (let era = 1; era <= 15; era += 1) {
    const setting = getSetting(era);
    if (setting && setting.water !== 'none') continue;
    kyKho.push(era);
    assert.ok(['bac', 'nam', 'dong', 'tay'].includes(ERA_TERRAIN[era].drain),
      `kỷ ${era} (khô) vẫn phải khai một hướng thấp có thật`);
  }
  assert.deepEqual(kyKho, [1],
    'đúng MỘT kỷ không có nước (Göbekli Tepe). Danh sách đổi ⇒ xem lại cả hai bảng.');
});

test('VÀNH ĐẤT KHÔNG BAO GIỜ CHẠM MẶT NƯỚC — biên độ lượn là một QUAN HỆ với `WATER_DROP_BELOW_PLAIN`', () => {
  // ⚠️ Bài học Phase 7D lặp lại lần thứ N: một lời hứa nói về QUAN HỆ mà viết thành HẰNG SỐ thì
  // gãy trong im lặng. Biên độ lượn của vành đất trước đây là `0,42` viết cứng (±0,21), đúng
  // **nhờ** `WATER_DROP_BELOW_PLAIN = 0,30` ở một file khác mà nó không hề tham chiếu tới. §1(B)
  // cộng thêm thành phần nghiêng vào cùng chỗ ấy và đất khô kỷ 8 tụt 0,0288 ô DƯỚI mặt nước.
  //
  // THỬ-CHO-ĐỎ: đổi `nenRoll` thành `(tho) => tho` (bỏ bão hoà) ⇒ đỏ ở bài bất biến (3) của
  // `setting.test.js`; đổi `ROLL_HEADROOM_SHARE` lên 1,2 ⇒ đỏ ở assert đầu bài này.
  const bienDo = bienDoRollNgoai();
  assert.ok(bienDo < WATER_DROP_BELOW_PLAIN,
    `biên độ lượn ${bienDo} phải NHỎ HƠN khoảng hở tới mặt nước ${WATER_DROP_BELOW_PLAIN}, nếu `
    + 'không thì vành đất khô có thể chui xuống dưới mặt nước.');
  assert.ok(Math.abs(-APRON_DROP - bienDo - WATER_SURFACE_Y) > 1e-9,
    'chỗ trũng nhất của vành đất phải còn một khoảng hở THẬT tới mặt nước, không được bằng 0.');

  // BÃO HOÀ, KHÔNG KẸP: dù bơm vào bao nhiêu cũng không vượt biên, mà thứ tự vẫn giữ nguyên.
  // ⚠️ `<=` CHỨ KHÔNG PHẢI `<`: `tanh` tiệm cận 1 nên ở độ lệch lớn nó CHẠM biên trong số dấu phẩy
  // động (tanh(5/0,21) = 1,0 tròn). Thứ phải bảo đảm là KHÔNG VƯỢT, và khoảng hở thật tới mặt nước
  // là `WATER_DROP_BELOW_PLAIN − bienDo = 0,09` — đã assert ở trên.
  for (const tho of [0.5, 1, 5, 50]) {
    assert.ok(Math.abs(nenRoll(tho)) <= bienDo + 1e-12,
      `nén ${tho} ra ${nenRoll(tho)} — phải luôn nằm TRONG biên độ ${bienDo}`);
  }
  const mau = [-1, -0.4, -0.2, 0, 0.2, 0.4, 1];
  for (let i = 1; i < mau.length; i += 1) {
    assert.ok(nenRoll(mau[i]) > nenRoll(mau[i - 1]),
      `phép nén phải ĐƠN ĐIỆU NGẶT — kẹp thì mọi kỷ nghiêng mạnh dồn về một giá trị và thứ tự `
      + 'giữa chúng biến mất (bài học Phase 7D).');
  }
  // Và ở vùng lệch nhỏ nó phải gần như KHÔNG đổi gì — bản vá này không được vẽ lại thế giới.
  assert.ok(Math.abs(nenRoll(0.02) - 0.02) < 1e-3,
    'ở độ lệch nhỏ, phép nén phải xấp xỉ phép đồng nhất');
});
