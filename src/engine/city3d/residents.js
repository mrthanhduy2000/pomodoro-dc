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

import { hashId } from '../cityLayout';

/** Trần cư dân. Đây là ngưỡng HIỆU NĂNG: mỗi người là một thực thể phải cập nhật mỗi khung hình. */
export const MAX_RESIDENTS = 28;

/** Tốc độ đi bộ, tính bằng ô lưới mỗi giây. Người thật đi ~1,4 m/s; ở đây một ô ≈ một sải phố. */
const WALK_SPEED = 0.42;

/** Chiều cao người, tính theo đơn vị ô. Nhỏ có chủ ý: người phải làm nhà trông TO. */
export const RESIDENT_HEIGHT = 0.2;

function unit(key) {
  return (hashId(key) % 10000) / 10000;
}

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
 * @param {number} index      thứ tự cư dân — hạt giống tất định
 * @param {Array} roadCells   các ô đường, dạng `{x, y}`
 * @returns {{path:Array<{x:number,y:number}>, length:number, speed:number, phase:number}|null}
 */
export function buildResidentRoute(index, roadCells) {
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
  const path = outbound.slice();
  for (let i = outbound.length - 2; i > 0; i -= 1) path.push(outbound[i]);
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
    speed: WALK_SPEED * (0.75 + unit(`${seed}|s`) * 0.5),
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
 * @returns {{x:number, y:number, angle:number, bob:number}} toạ độ Ô LƯỚI, không phải toạ độ thế giới
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
        // Nhấp nhô theo bước chân. Biên độ rất nhỏ — đủ để mắt đọc ra "đang đi" thay vì "đang
        // trượt", mà không thành nhảy lò cò.
        bob: Math.abs(Math.sin(travelled * 9)) * 0.022,
      };
    }
    remaining -= segment;
  }

  // Không tới đây được với dữ liệu hợp lệ; giữ nhánh này để không bao giờ trả `null` giữa chừng.
  const first = route.path[0];
  return { x: first.x, y: first.y, angle: 0, bob: 0 };
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

  const residents = [];
  for (let i = 0; i < count; i += 1) {
    const route = buildResidentRoute(i, roads);
    if (route) residents.push(route);
  }
  return residents;
}
