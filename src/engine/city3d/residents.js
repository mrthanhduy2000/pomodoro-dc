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

/**
 * Trần cư dân. Đây là ngưỡng HIỆU NĂNG: mỗi người là một thực thể phải cập nhật mỗi khung hình.
 *
 * ⚠️ ĐÃ THỬ NÂNG 28 → 48 NGÀY 2026-08-29 VÀ CỔNG BÁC BỎ — ghi lại để phiên sau khỏi thử lại.
 * Động cơ hợp lý: đo bằng chính công thức bên dưới (5 công trình, chuỗi 10) thì trần 28 **chạm ở
 * phiên thứ 33** của một kỷ, trong khi kỷ 8 dài ~130 phiên và kỷ 15 dài ~840 — tức gần như suốt cả
 * kỷ thành phố không đông thêm một người nào, và đó là một trong ba cái trần mà `TECH_DEBT #14`
 * chỉ đích danh cho "phiên 121+ trong kỷ: 0% có tin thật".
 *
 * **Nhưng ngân sách nói không.** `sceneGraphWiring.test.js` chấm cư dân theo TỈ LỆ tam giác của
 * cảnh (trần 30%), và một cư dân nay tốn **1.808 tam giác** — không phải ~319 như ADR-055 ước, vì
 * ADR-057 đã thay chân cứng bằng khớp ngược thật. Số học: 48 người = 44,8% cảnh (bác), trần thật
 * là **32 người** (29,8%), mà 32 chỉ đẩy mốc chạm trần từ phiên 33 lên phiên 57 — **mua 24 phiên
 * bằng gần hết phần ngân sách còn lại**. Không đáng.
 *
 * ⚠️ VÀ ĐÂY LÀ CON SỐ ĐÁNG NHỚ NHẤT: **cư dân đang chiếm 26,1% tam giác của cả cảnh** (28 × 1.808
 * trên 193.836 ở kỷ 1). Tức nhóm này đã sát trần 30% từ trước; chỗ để tiêu cho cư dân gần như
 * không còn. Muốn thành phố "sống" thêm thì phải tìm ở nhóm khác, không phải ở số người.
 */
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
        angle: Math.atan2(b.y - a.y, b.x - a.x),
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
