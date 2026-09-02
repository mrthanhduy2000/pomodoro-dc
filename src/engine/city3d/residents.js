/**
 * residents.js — CƯ DÂN. Những người sống trong thành phố Đàm xây.
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`. Mọi thứ ở đây là hàm của
 * (bố cục, thời điểm) — kể cả chuyển động. Xem mục "vì sao chuyển động cũng phải thuần" bên dưới.
 *
 * ⚠️ VÌ SAO CƯ DÂN LÀ TÍNH NĂNG CHỨ KHÔNG PHẢI TRANG TRÍ:
 * Một thành phố không có người là một mô hình kiến trúc. Cùng những khối nhà đó, thêm vài chấm
 * di chuyển giữa chúng, thì nó thành một NƠI CÓ NGƯỜI Ở — và cái mà Đàm nhìn thấy sau mỗi phiên
 * tập trung không còn là "tôi mở khoá thêm một công trình" mà là "chỗ này đông hơn tuần trước".
 * Chuyển động cũng là thứ duy nhất trong cảnh nói với mắt rằng nó đang SỐNG chứ không phải ảnh
 * tĩnh; đó là lý do nó đáng để đánh đổi bằng việc phải vẽ liên tục khi tab đang mở.
 *
 * ⚠️ DÂN SỐ SUY TỪ SỐ LIỆU, KHÔNG LƯU VÀO STATE:
 * Cùng nguyên tắc đã dùng cho cảnh vật (`deriveProps`): số cư dân là hàm của số công trình + số
 * phiên + độ dài chuỗi. Không tốn một byte nào trong JSONB đang tranh chấp CAS trên Supabase, và
 * không bao giờ lệch giữa hai máy.
 */

import { hashId, unit } from '../hashId';
import { buildRoadPaths } from './roadPath';
import { HUMAN_PRESETS, getHumanStyle } from './humanStyle';

/** Trần cư dân. Đây là ngưỡng HIỆU NĂNG: mỗi người là một thực thể phải cập nhật mỗi khung hình. */
export const MAX_RESIDENTS = 28;

/**
 * Tốc độ đi bộ mặc định, ô lưới mỗi giây.
 * ⚠️ ĐỌC TỪ `humanStyle.js`, KHÔNG VIẾT LẠI SỐ. Tốc độ đi nay là một TRỤC BẢN SẮC theo kỷ (người
 * đi săn thong thả khác người phố Manhattan), nên nó phải có đúng một chỗ khai. Giữ hằng số ở đây
 * là dựng sẵn hai nguồn sự thật cho cùng một đại lượng — chính là hình dạng sai đã cắn dự án ở
 * `daylight.test.js` và `palette3d.js`.
 */
const DEFAULT_WALK_SPEED = HUMAN_PRESETS.mocPhoThong.walkSpeed;

/**
 * Chiều cao người cỡ chuẩn, đơn vị ô. Nhỏ có chủ ý: người phải làm nhà trông TO.
 * ⚠️ NAY CHỈ LÀ CỠ CHUẨN — chiều cao THẬT của một kỷ là `HUMAN_BASE_HEIGHT × stature`
 * (`human.js` / `humanStyle.js`). Giữ tên cũ và giá trị cũ để mọi chỗ đang đọc nó không đổi nghĩa.
 */
export const RESIDENT_HEIGHT = 0.2;

/**
 * Quãng đường mà một lần ĐỔI HƯỚNG được trải ra, tính bằng ô lưới.
 *
 * ⚠️ VÌ SAO PHẢI CÓ SỐ NÀY. Tuyến đi là một đường gấp khúc, và tuyến nào cũng là đường
 * ĐI-RỒI-QUAY-LẠI (xem chỗ "khép kín bằng cách đi ngược lại" phía dưới), nên hai đầu tuyến đều
 * là một cú quay đầu 180° TẠI CHỖ. Trước bản này `angle` nhảy thẳng từ góc đoạn này sang góc
 * đoạn kia trong ĐÚNG MỘT khung hình. Đo được (6 kỷ, 168 người, 302.400 mẫu ở 30 khung/giây):
 * **góc quay lớn nhất mỗi khung = 180,0°**, và **1.101 khung** quay quá 90°.
 *
 * ⚠️ VÀ VÌ SAO NÓ ĐÁNG SỬA BÂY GIỜ CHỨ KHÔNG PHẢI TRƯỚC ĐÂY. Chừng nào cư dân còn là một chồng
 * hộp đối xứng thì "hướng quay mặt" gần như không tới được mắt — một con số có thật về một đại
 * lượng vô hình (bẫy `TECH_DEBT #22`). Từ khi có thân thật (vai 1,00 ↔ eo 0,72), tay đánh, và
 * nón lá ở kỷ 6, hình bóng người KHÔNG còn đối xứng quanh trục đứng nữa ⇒ cú lộn ngược trong một
 * khung hình nay là thứ nhìn thấy được, nên nó mới thành một khuyết tật thật.
 *
 * ⚠️ HẰNG SỐ NÀY BÃO HOÀ Ở 0,20 — VÀ ĐÓ LÀ ĐIỀU PHẢI BIẾT TRƯỚC KHI CHỈNH NÓ. Cửa sổ quay bị kẹp
 * về `min(TURN_ARC, độ dài đoạn)` trong `headingAt` (bắt buộc, nếu không hai cú quay liên tiếp
 * chồng lên nhau và người xoay tít). Mà **71,6% số đoạn tuyến ngắn hơn 0,30 ô** (17.040 đoạn ·
 * trung vị 0,250 · ngắn nhất 0,040), nên từ 0,20 trở lên thì thứ quyết định ca tệ nhất KHÔNG còn
 * là hằng số này nữa mà là ĐOẠN NGẮN NHẤT. Quét thật trên quần thể ĐẦY ĐỦ (15 kỷ · 420 tuyến ·
 * 387.084 khung @30fps, mỗi tuyến trọn ít nhất một vòng):
 *
 *     TURN_ARC   0,02 → 180,0°/khung    0,20 → 35,9°     1,00 → 35,9°
 *                0,05 →  92,8°/khung    0,30 → 35,9°     5,00 → 35,9°
 *                0,10 →  46,4°/khung    0,50 → 35,9°
 *
 * ⚠️ Bảng cũ ghi sàn là **35,6°** và 67,6% — đó là số của quần thể HẸP (6 kỷ · 165 tuyến), thứ
 * chưa bao giờ chứa ca xấu nhất. Hai mốc do chính `TURN_ARC` cai trị (92,8° · 46,4°) thì TRÙNG
 * KHÍT ở cả hai quần thể — một phép tự đối chiếu cho thấy chỉ VÙNG BÃO HOÀ mới phụ thuộc quần thể.
 *
 * Chọn 0,30 (không phải 0,20) để đứng qua khỏi chỗ gãy một quãng, phòng khi hình học tuyến đổi.
 * ⚠️ Đừng đọc bảng này thành "nới lên nữa thì mượt hơn" — nới không đổi được gì; muốn hạ dưới
 * 35,9° thì phải trải cú quay QUA NHIỀU ĐOẠN, một bài toán khác hẳn.
 *
 * Đo sau khi có hàm này: **35,9°/khung**, **0 khung** quay quá 90°, và cú quay đầu 180° tệ nhất
 * trải ra **6–10 khung (0,20–0,33 giây)** — mắt đọc ra "người ấy quay lại", không phải "hình bị
 * lật". (⚠️ Bản đầu của chú thích này ghi "≈ 0,7 giây ≈ 21 khung" — một con số suy ra bằng phép
 * chia chứ không đo, và sai gấp đôi. Nó đúng nếu mọi đoạn đều dài hơn TURN_ARC; hai phần ba thì
 * không.)
 */
export const TURN_ARC = 0.30;

/**
 * Suy ra số cư dân từ tiến độ của Đàm.
 *
 * Đường cong cố ý DỐC LÚC ĐẦU rồi thoải dần: đi từ 0 lên 4 người phải cảm nhận được ngay ở những
 * phiên đầu tiên (đó là lúc dễ bỏ cuộc nhất), còn từ 20 lên 24 thì gần như không ai đếm.
 */
export function deriveResidentCount({ buildingCount = 0, sessionCount = 0, streakLength = 0 } = {}) {
  const b = Number.isFinite(buildingCount) ? Math.max(0, buildingCount) : 0;
  if (b === 0) return 0;              // chưa có nhà thì chưa có ai ở
  const s = Number.isFinite(sessionCount) ? Math.max(0, sessionCount) : 0;
  const k = Number.isFinite(streakLength) ? Math.max(0, streakLength) : 0;

  const raw = b * 2 + Math.sqrt(s) * 2.2 + k * 0.5;
  return Math.min(MAX_RESIDENTS, Math.round(raw));
}

/**
 * Đường đi của một cư dân: một tuyến khép kín giữa các điểm trên lưới.
 *
 * ⚠️ TUYẾN PHẢI BÁM ĐƯỜNG SÁ. Cho người đi xuyên qua bãi đất trống trông như lỗi vật lý; cho họ
 * đi dọc trục đường thì mắt tự hiểu "họ đang đi từ nhà này sang nhà kia". Vì `cityLayout` mở
 * đường dần theo số phiên, cư dân cũng tự động chỉ đi trong phần phố đã mở.
 *
 * ⚠️ TUYẾN PHẢI BÁM **TIM ĐƯỜNG**, KHÔNG BÁM TÂM Ô — và đây là chỗ đổi kể từ khi đường biết lượn.
 * Trước đây mọi con đường đều nằm chính giữa ô của nó, nên "đi từ tâm ô này sang tâm ô kia" vừa
 * đơn giản vừa đúng. Nay tim đường lệch khỏi tâm ô tới 0,19 ô ở kỷ 1, mà lòng ngõ chỉ rộng 0,26 ô
 * — tức đi theo tâm ô là đi **ra ngoài mặt đường**, trên cỏ, cạnh con đường.
 *
 * ⚠️ VÀ PHẢI CHÈN CẢ ĐIỂM Ở RANH GIỚI Ô, không chỉ dời tâm ô đi. Tim đường là một đường GẤP KHÚC
 * `tâm ô → ranh giới → tâm ô`; nối thẳng hai tâm ô liền nhau sẽ CẮT GÓC qua chỗ ngoặt, và ở khúc
 * cua gấp thì đường cắt ấy đi ra ngoài lòng đường. Chèn điểm ranh giới thì tuyến trùng KHÍT với
 * tim đường mà tầng vẽ dùng — vì cả hai đọc chung `buildRoadPaths`.
 *
 * @param {number} index      thứ tự cư dân — hạt giống tất định
 * @param {Array} roadCells   các ô đường, dạng `{x, y, variant}`
 * @param {number} [walkSpeed] tốc độ đi của kỷ (ô/giây); rỗng thì dùng mốc phổ thông
 * @param {number} [era]      kỷ — quyết định tim đường lượn thế nào
 * @returns {{path:Array<{x:number,y:number}>, length:number, speed:number, phase:number}|null}
 */
export function buildResidentRoute(index, roadCells, walkSpeed = DEFAULT_WALK_SPEED, era = null) {
  if (!Array.isArray(roadCells) || roadCells.length < 2) return null;

  // ⚠️ KHÔNG ĐƯỢC đi theo thứ tự của mảng `roadCells`. Mảng đó đã bị `computeCityLayout` sắp lại
  // theo CHIỀU SÂU ISOMETRIC (để bộ vẽ 2D xếp lớp cho đúng), nên hai phần tử liền nhau trong mảng
  // hoàn toàn có thể nằm ở hai đầu thành phố. Bản đầu đi theo chỉ số mảng và test đo được bước
  // nhảy 3,6 ô — tức là cư dân bay xuyên qua nhà. Phải dựng quan hệ KỀ NHAU thật rồi mới đi.
  const roadSet = new Set(roadCells.map((cell) => `${cell.x},${cell.y}`));
  const stepsOf = (cell) => [
    { x: cell.x + 1, y: cell.y },
    { x: cell.x - 1, y: cell.y },
    { x: cell.x, y: cell.y + 1 },
    { x: cell.x, y: cell.y - 1 },
  ].filter((next) => roadSet.has(`${next.x},${next.y}`));

  const seed = `r|${index}`;
  const start = roadCells[Math.floor(unit(`${seed}|a`) * roadCells.length)];
  // Quãng đường dài ngắn khác nhau → người đi nhanh chậm khác nhau về CẢM GIÁC dù cùng tốc độ.
  const span = 3 + Math.floor(unit(`${seed}|b`) * 7);

  // Đi tới: mỗi bước chọn một ô đường kề bên, tránh quay đầu ngay khi còn lựa chọn khác.
  const outbound = [start];
  let previousKey = null;
  for (let i = 1; i < span; i += 1) {
    const here = outbound[outbound.length - 1];
    const options = stepsOf(here);
    if (options.length === 0) break;
    const forward = options.filter((next) => `${next.x},${next.y}` !== previousKey);
    const pool = forward.length > 0 ? forward : options;
    const next = pool[hashId(`${seed}|step|${i}`) % pool.length];
    previousKey = `${here.x},${here.y}`;
    outbound.push(next);
  }
  if (outbound.length < 2) return null;

  // Khép kín bằng cách ĐI NGƯỢC LẠI chính lộ trình vừa đi. Vì mỗi bước ngược là một bước xuôi đảo
  // chiều, tính kề nhau được bảo đảm miễn phí — không cần tìm đường về.
  const cells = outbound.slice();
  for (let i = outbound.length - 2; i > 0; i -= 1) cells.push(outbound[i]);
  if (cells.length < 2) return null;

  // ── ĐỔI DÃY Ô THÀNH DÃY ĐIỂM TRÊN TIM ĐƯỜNG ────────────────────────────────────────────────
  // Mỗi ô góp TÂM LÕI của nó, và giữa hai ô liền nhau chèn thêm ĐIỂM RANH GIỚI. Cả hai con số đều
  // hỏi `buildRoadPaths` — chính hàm mà `terrainMesh.js` dựng mặt đường theo.
  const paths = buildRoadPaths(era, roadCells);
  const phíaTới = (a, b) => {
    if (b.x > a.x) return 'east';
    if (b.x < a.x) return 'west';
    return b.y > a.y ? 'south' : 'north';
  };
  const path = [];
  for (let i = 0; i < cells.length; i += 1) {
    const trước = cells[(i - 1 + cells.length) % cells.length];
    const here = cells[i];
    const next = cells[(i + 1) % cells.length];
    // `walkThrough` trả về đúng dãy điểm mà mặt đường được dựng quanh nó — một nguồn duy nhất.
    // ⚠️ `phíaTới(here, trước)` LÀ PHÍA CƯ DÂN VỪA ĐI VÀO — không phải phía họ vừa rời khỏi, nên
    // KHÔNG được đảo chiều. Bản đầu đảo nó và sinh ra bước nhảy 1,46 ô: điểm vào bị đặt ở ranh
    // giới ĐỐI DIỆN, tức tuyến vọt chéo qua cả ô rồi quay lại.
    for (const p of paths.walkThrough(here.x, here.y, phíaTới(here, trước), phíaTới(here, next))) {
      const cuối = path[path.length - 1];
      // Bỏ điểm trùng: ở đoạn thẳng, mép lõi và điểm biên có thể rơi vào nhau, mà hai điểm trùng
      // nhau tạo một đoạn dài 0 — `residentAt` bỏ qua được, nhưng nó làm bẩn phép đo bước nhảy.
      if (cuối && Math.abs(cuối.x - p.x) < 1e-9 && Math.abs(cuối.y - p.y) < 1e-9) continue;
      path.push(p);
    }
  }
  if (path.length < 2) return null;

  let length = 0;
  for (let i = 0; i < path.length; i += 1) {
    const a = path[i];
    const b = path[(i + 1) % path.length];
    length += Math.hypot(b.x - a.x, b.y - a.y);
  }
  if (length <= 0) return null;

  return {
    path,
    length,
    speed: walkSpeed * (0.75 + unit(`${seed}|s`) * 0.5),
    // Lệch pha: không có nó thì tất cả cùng xuất phát một chỗ, thành một đoàn diễu hành.
    phase: unit(`${seed}|p`),
    // Quay đầu 180° thì "phía ngắn nhất" là HOÀ — hai bên bằng nhau đúng bằng π. Chọn phía theo
    // hạt giống để (a) tất định như ADR-007 đòi, (b) không phải ai cũng quay cùng một chiều như
    // lính duyệt binh.
    turnSign: unit(`${seed}|turn`) < 0.5 ? -1 : 1,
  };
}

/**
 * Vị trí một cư dân tại thời điểm `time` (giây).
 *
 * ⚠️ VÌ SAO CHUYỂN ĐỘNG CŨNG PHẢI THUẦN — tưởng là chi tiết nhỏ nhưng nó quyết định kiến trúc:
 * hàm này nhận THỜI GIAN làm tham số thay vì tự cộng dồn vào một biến trạng thái. Nhờ vậy nó
 * test được (đưa vào t = 12,5 giây thì biết chắc người ở đâu), nó không trôi sai khi khung hình
 * bị bỏ lỡ, và quan trọng nhất: khi Đàm rời tab rồi quay lại sau nửa tiếng, thành phố hiện ra ở
 * đúng trạng thái ĐÁNG LẼ phải có, chứ không phải đứng im đúng chỗ lúc bị đóng băng.
 *
 * ⚠️ TRẢ VỀ `travelled` (QUÃNG ĐƯỜNG ĐÃ ĐI) CHỨ KHÔNG PHẢI `bob`, và đó là một chỗ đổi trách nhiệm
 * có chủ ý. File này trả lời "đi ĐÂU"; tư thế là việc của `humanPose.js`. Trước phase này cái nhún
 * người (`bob`) nằm ngay đây dưới dạng một hàm sin riêng — tức tư thế bị khai ở hai chỗ, và ngày
 * nào có ai chỉnh sải chân thì cái nhún sẽ lệch pha với bước chân mà không có gì đỏ lên. Nay chỉ
 * còn MỘT đại lượng đi ra khỏi đây, và mọi khớp đều suy từ nó.
 *
 * @returns {{x:number, y:number, angle:number, travelled:number}} toạ độ Ô LƯỚI, không phải thế giới
 */
export function residentAt(route, time) {
  if (!route) return null;
  const t = Number.isFinite(time) ? time : 0;

  // Quãng đường đã đi, gói vòng quanh chu vi tuyến.
  const travelled = ((route.phase * route.length) + t * route.speed) % route.length;

  let remaining = travelled;
  for (let i = 0; i < route.path.length; i += 1) {
    const a = route.path[i];
    const b = route.path[(i + 1) % route.path.length];
    const segment = Math.hypot(b.x - a.x, b.y - a.y);
    if (segment <= 0) continue;
    if (remaining <= segment) {
      const k = remaining / segment;
      return {
        x: a.x + (b.x - a.x) * k,
        y: a.y + (b.y - a.y) * k,
        angle: headingAt(route, i, remaining, segment),
        travelled,
      };
    }
    remaining -= segment;
  }

  // Không tới đây được với dữ liệu hợp lệ; giữ nhánh này để không bao giờ trả `null` giữa chừng.
  const first = route.path[0];
  return { x: first.x, y: first.y, angle: 0, travelled: 0 };
}

/**
 * Gói một góc về khoảng [−π, π].
 *
 * ⚠️ MỌI GÓC ĐI RA KHỎI FILE NÀY PHẢI ĐI QUA ĐÂY. Phép nội suy trong `headingAt` cộng dồn
 * `prev + k · delta`, và tổng ấy hoàn toàn có thể vọt ra ngoài [−π, π] (đo được **398,5°** lệch
 * khi so `angle` với hướng đi thật — một con số không thể tồn tại nếu góc đã được gói). Về mặt
 * HÌNH ẢNH thì vô hại, vì tầng vẽ dựng quaternion mà phép quay thì tuần hoàn. Nhưng mọi thứ
 * ĐỌC `angle` để so sánh — bài test, phép đo, code viết sau này — đều ngầm cho rằng nó nằm trong
 * khoảng chuẩn, và một giá trị 6,1 rad sẽ lặng lẽ làm sai mọi phép so. Gói ở NGUỒN thì không chỗ
 * nào phải nhớ gói lại.
 */
function wrapPi(a) {
  const m = (((a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return m - Math.PI;
}

/** Chênh lệch góc NGẮN NHẤT từ `from` tới `to`, có phá hoà cho ca quay đầu đúng 180°. */
function angleDelta(from, to, turnSign) {
  const d = wrapPi(to - from);
  // Đúng 180° thì hai phía bằng nhau — không tồn tại "ngắn nhất". Chọn theo hạt giống của tuyến.
  if (Math.abs(Math.abs(d) - Math.PI) < 1e-9) return (turnSign ?? 1) * Math.PI;
  return d;
}

/** Góc của đoạn tuyến thứ `i`. */
function segmentAngle(path, i) {
  const a = path[i];
  const b = path[(i + 1) % path.length];
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/**
 * Hướng quay mặt tại một điểm trên tuyến — TRẢI cú đổi hướng ra quanh mỗi đỉnh thay vì lật ngay.
 *
 * Cửa sổ quay dài `min(TURN_ARC, độ dài đoạn)`, đặt CÂN GIỮA đỉnh: nửa trước nằm ở cuối đoạn tới,
 * nửa sau nằm ở đầu đoạn đi. Đúng tại đỉnh cả hai nhánh cùng cho ra "chính giữa hai hướng", nên
 * hàm liên tục.
 *
 * ⚠️ CẢ HAI NHÁNH PHẢI PHÁT BIỂU CÚ QUAY THEO CÙNG MỘT CHIỀU (từ đoạn TRƯỚC sang đoạn SAU).
 * Bản đầu viết nhánh dưới là `current + k · delta(current → prev)` — đọc thì đối xứng và trông
 * hoàn toàn hợp lý, nhưng ở ca quay đầu 180° thì phép phá hoà `turnSign` ép CẢ HAI chiều về cùng
 * một dấu, nên hai nhánh cho ra hai kết quả LỆCH NHAU 180° ngay tại đỉnh — tức dựng lại đúng cái
 * giật mà cả hàm này sinh ra để xoá. Một cú quay là MỘT đại lượng CÓ CHIỀU; phát biểu nó hai lần
 * theo hai chiều là tự tạo ra hai sự thật.
 *
 * @param {number} i        chỉ số đoạn đang đứng
 * @param {number} u        đã đi được bao xa TRONG đoạn ấy
 * @param {number} segment  độ dài đoạn ấy
 */
function headingAt(route, i, u, segment) {
  const path = route.path;
  const current = segmentAngle(path, i);
  const window = Math.min(TURN_ARC, segment);
  const half = window / 2;
  if (half <= 0) return current;

  const toEnd = segment - u;
  if (toEnd < half) {
    const next = segmentAngle(path, (i + 1) % path.length);
    return wrapPi(current + (0.5 - (toEnd / window)) * angleDelta(current, next, route.turnSign));
  }
  if (u < half) {
    const prev = segmentAngle(path, (i - 1 + path.length) % path.length);
    return wrapPi(prev + (0.5 + (u / window)) * angleDelta(prev, current, route.turnSign));
  }
  return current;
}

/**
 * Dựng toàn bộ cư dân của một thành phố.
 *
 * @param {object} layout kết quả `computeCityLayout`
 * @param {object} [stats] `{ sessionCount, streakLength }`
 * @returns {Array} danh sách tuyến đi, đã lọc bỏ tuyến hỏng
 */
export function buildResidents(layout, stats = {}) {
  const roads = (layout?.props ?? []).filter((prop) => prop.kind === 'road');
  if (roads.length < 2) return [];

  const count = deriveResidentCount({
    buildingCount: layout?.buildings?.length ?? 0,
    sessionCount: stats.sessionCount,
    streakLength: stats.streakLength,
  });

  // Tốc độ đi là một trục bản sắc theo kỷ — lấy từ bảng, không dùng hằng số chung.
  const walkSpeed = getHumanStyle(layout?.era).walkSpeed;

  const residents = [];
  for (let i = 0; i < count; i += 1) {
    const route = buildResidentRoute(i, roads, walkSpeed, layout?.era);
    if (route) residents.push(route);
  }
  return residents;
}
