/**
 * make-fixture.mjs — DỰNG MỘT "TÀI KHOẢN ĐÃ CHƠI LÂU" để soi giao diện đúng thứ Đàm nhìn thấy.
 *
 * Chạy (BẮT BUỘC kèm loader — xem mục "VÌ SAO CẦN LOADER" bên dưới):
 *   node --import ./scripts/register-esm-loader.mjs scripts/make-fixture.mjs --out fixture.json
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * VÌ SAO CẦN: mọi đợt soi giao diện trước đây đều chạy trên một tài khoản gần như RỖNG (0 XP,
 * 0/360 thành tích, 0 kỹ năng, 5 công trình). Tức là suốt thời gian qua tôi đang xem màn hình của
 * NGÀY ĐẦU TIÊN, còn Đàm thì đang sống ở tháng thứ sáu. Một màn hình gọn gàng lúc rỗng hoàn toàn
 * có thể vỡ khi đầy dữ liệu (bảng tràn, chữ chồng, danh sách dài vô tận), và ngược lại một màn
 * hình trông "chán" lúc rỗng có thể rất sống khi có số. Không có fixture này thì mọi kết luận về
 * "đẹp/chán" đều nói về một phiên bản app mà Đàm chưa bao giờ dùng.
 *
 * ⚠️ TUYỆT ĐỐI KHÔNG gọi `completeFocusSession` để dựng dữ liệu. Luật `CLAUDE.md`: "KHÔNG start
 * phiên focus trên dev/localhost — dev dùng chung Supabase row với production, sẽ ghi đè dữ liệu
 * thật của Đàm." File này chỉ SINH RA JSON; nó không mở trình duyệt, không chạm mạng, không chạm
 * Supabase. Việc chặn Supabase ở tầng DNS trong `shot.mjs` là lớp phòng thủ THỨ HAI, không phải lý
 * do để phá luật thứ nhất.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ LUẬT SỐ 1 CỦA FILE NÀY — MỌI CON SỐ MÀ GIAO DIỆN ĐEM SO VỚI MỘT CON SỐ KHÁC PHẢI ĐƯỢC
 * SUY RA, KHÔNG ĐƯỢC BỊA.
 *
 * Bản đầu tiên của file này bịa tỉ giá phần thưởng (11 XP/phút, 1.6 EP/phút) rồi lại ép cứng
 * `activeBook: 7`. Kết quả: thanh tiến độ ở đầu trang hiện **"41.390 / 18.500 XP"** — một tiến độ
 * VƯỢT QUÁ chính vạch đích của nó. Nhìn thoáng qua thì đó y hệt một lỗi app; thật ra là fixture tự
 * mâu thuẫn. Một fixture sai kiểu này KHÔNG chỉ vô dụng — nó **sản xuất lỗi ma cho mọi phiên sau**,
 * và mỗi lỗi ma tốn một phiên điều tra. Đây là lần thứ 9 dự án vấp đúng bài học "công cụ dev phải
 * bị nghi ngờ y như mã sản phẩm".
 *
 * ⇒ Danh sách các quan hệ BẮT BUỘC phải suy ra (đủ, không thiếu):
 *   totalEP  → activeBook          `getActiveBook` (chính hàm app dùng)
 *   totalXP  → level, xp-trong-cấp `EXP_PER_LEVEL`
 *   level    → sp                  `SP_PER_LEVEL` trừ đi đúng số điểm đã tiêu cho `unlockedSkills`
 *   history  → historyStats        đếm lại, không gõ tay
 *   history  → streak              đi lại từng ngày, không gõ tay
 *   history  → eraTracking         cùng công thức `rebuildEraTrackingFromHistory` của store
 *   activeBook → buildings         chỉ giữ bản vẽ ĐÚNG kỷ đang chơi (luật `pruneEraScopedBlueprintState`)
 *   kỷ đã qua → cityArchive        niêm phong bằng chính `mergeCityArchive` của engine
 *   craftingQueue → BLUEPRINT_META `sessionsRemaining` không bao giờ vượt `sessionsToComplete`
 *
 * VÌ SAO CẦN LOADER: để dùng ĐÚNG công thức của app (`calculateRewards`, `getActiveBook`,
 * `mergeCityArchive`) thay vì chép lại tỉ giá — chép lại chính là cách bản đầu đã sai. Các module
 * engine import lẫn nhau kiểu `from './constants'` (không đuôi), nên node cần
 * `scripts/register-esm-loader.mjs`, đúng như `scripts/coach-sample.mjs` đã làm.
 *
 * ⚠️ TẤT ĐỊNH: `calculateRewards` có gọi `Math.random` (rương, may mắn, tài nguyên). Nên file này
 * THAY `Math.random` bằng một bộ sinh số có hạt giống ngay từ đầu — nhờ vậy vẫn dùng được công
 * thức thật mà chạy hai lần vẫn ra hai file y hệt nhau, để ảnh chụp của hai phiên so sánh được.
 * Đây là script dev độc lập, không có gì khác chạy cùng tiến trình; luật "cấm Math.random" áp cho
 * `src/engine/`, không áp cho chỗ này.
 *
 * ⚠️ VẪN LÀ DỮ LIỆU GIẢ. Công thức phần thưởng là thật, nhưng NHỊP CHƠI (mấy phiên một ngày, dài
 * bao nhiêu, nghỉ ngày nào) là do tôi rải ra cho giao diện có cái mà vẽ. Muốn kết luận cân bằng
 * game thì dùng `scripts/simulate-pacing.mjs` — đừng trích số từ đây.
 *
 * ⚠️ `--end` mặc định là một ngày CỐ ĐỊNH (để tất định). Chuỗi ngày chỉ còn sống nếu `--end` là
 * hôm nay: khi nạp, store chạy `refreshStreakIfExpired` và cắt chuỗi nếu `lastActiveDate` đã cũ.
 * Muốn soi giao diện chuỗi ngày thì sinh lại với `--end <hôm nay>`.
 *
 * ⚠️ BA GIỚI HẠN ĐÃ BIẾT — ghi ra để phiên sau đừng tưởng là lỗi app:
 *   1. **Phiên của NGÀY CUỐI rải từ ~8h tới ~21h.** Chụp bằng `shot.mjs --hour 12` thì những phiên
 *      sau 12h nằm ở TƯƠNG LAI so với đồng hồ giả ⇒ dòng "hôm nay vẫn là 0 phiên" ở trang chủ là
 *      ĐÚNG với dữ liệu, không phải lỗi đếm. Muốn soi màn hình "đã làm mấy phiên hôm nay" thì chụp
 *      với `--hour 21` trở lên, hoặc bỏ `--hour`.
 *   2. **Không gieo `missions`** ⇒ thẻ "Nhiệm vụ ngày" hiện `0/0`. Nhiệm vụ do store tự sinh theo
 *      ngày, không thuộc phạm vi một fixture soi giao diện.
 *   3. **`goalAchieved: null`** ở mọi phiên ⇒ mảng "Đạt mục tiêu" hiện `0%` trên `0/0`. Đây đúng là
 *      thứ `completeFocusSession` ghi khi phiên không có mục tiêu, nên là dữ liệu THẬT chứ không
 *      phải thiếu sót — nhưng nhớ điều đó trước khi báo cáo một "lỗi thống kê".
 */
import { writeFileSync } from 'node:fs';
import {
  ACHIEVEMENTS,
  BLUEPRINT_CATALOG,
  BLUEPRINT_META,
  EXP_PER_LEVEL,
  SKILL_TREE,
  SP_PER_LEVEL,
} from '../src/engine/constants.js';
import { inferAchievementUnlockTimes } from '../src/engine/achievementTimeline.js';

const arg = (f, d) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : d; };
const OUT = arg('--out', 'fixture.json');
const DAYS = Number(arg('--days', 180));
const END = arg('--end', '2026-08-13');
const SEED = Number(arg('--seed', 20260813));

/** Bộ sinh số giả ngẫu nhiên tất định (mulberry32) — thay cho `Math.random` bị cấm. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// MỘT dòng số duy nhất cho CẢ script lẫn engine — nếu tách làm hai thì "chạy lại lượt 2" chỉ đặt
// lại được một nửa, và fixture hết tất định mà không ai thấy.
let stream = rng(SEED);
const rand = () => stream();
const resetStream = () => { stream = rng(SEED); };
// ⚠️ `gameMath.js` tra `Math.random` ở THỜI ĐIỂM GỌI (`const rand = () => Math.random()`), nên gán
// sau import vẫn ăn.
Math.random = rand;

const { calculateRewards, getActiveBook } = await import('../src/engine/gameMath.js');
const { mergeCityArchive } = await import('../src/engine/cityArchive.js');
const { localDateStr } = await import('../src/engine/time.js');

const pick = (list) => list[Math.floor(rand() * list.length)];

const CATEGORIES = [
  { id: 'cat_hoc_dh', label: 'Học Đại Học', color: '#f59e0b', icon: '🎓' },
  { id: 'cat_tu_hoc', label: 'Tự Học', color: '#6366f1', icon: '📚' },
  { id: 'cat_lam_viec', label: 'Làm Việc', color: '#22c55e', icon: '💼' },
  { id: 'cat_doc_sach', label: 'Đọc Sách', color: '#06b6d4', icon: '📖' },
  { id: 'cat_luyen_tap', label: 'Luyện Tập', color: '#ec4899', icon: '🏃' },
];
// Trọng số lệch có chủ ý: người thật không chia đều thời gian, và Coach cần một "loại việc chủ
// đạo" để nói được câu gì đó. Chia đều sẽ tạo ra một hồ sơ mà không tín hiệu nào nổi lên.
const CATEGORY_WEIGHTS = [0.34, 0.24, 0.22, 0.12, 0.08];
function pickCategory() {
  let r = rand();
  for (let i = 0; i < CATEGORY_WEIGHTS.length; i += 1) {
    if (r < CATEGORY_WEIGHTS[i]) return CATEGORIES[i];
    r -= CATEGORY_WEIGHTS[i];
  }
  return CATEGORIES[CATEGORIES.length - 1];
}

// Chỉ chọn ĐỘ DÀI phiên; XP/EP/hệ số/tài nguyên do `calculateRewards` quyết, không bịa.
const LENGTH_BANDS = [
  { min: 10, max: 22 },   // khởi động
  { min: 25, max: 30 },   // tiêu chuẩn
  { min: 45, max: 55 },   // chuyên sâu
  { min: 60, max: 90 },   // bền bỉ
];
function pickLength() {
  const r = rand();
  const band = r < 0.10 ? LENGTH_BANDS[3] : r < 0.28 ? LENGTH_BANDS[2] : r < 0.88 ? LENGTH_BANDS[1] : LENGTH_BANDS[0];
  return band.min + Math.floor(rand() * (band.max - band.min + 1));
}

// ─── KỸ NĂNG: chọn trước, rồi TIÊU đúng số điểm đó ────────────────────────────────────────────
// Phải chọn TRƯỚC vòng lặp vì `calculateRewards` nhận `unlockedSkills` — nếu state ghi một bộ kỹ
// năng mà phần thưởng lại tính theo bộ khác thì fixture tự mâu thuẫn lần nữa.
const ALL_NODES = Object.values(SKILL_TREE).flatMap((branch) => branch.nodes ?? []);
const NODE_BY_ID = new Map(ALL_NODES.map((n) => [n.id, n]));
/** Mở khoá theo thứ tự ưu tiên, tôn trọng `requires`, dừng khi hết điểm. */
function unlockWithin(budget, wishlist) {
  const unlocked = {};
  let spent = 0;
  const canTake = (node) => (node.requires ?? []).every((req) => unlocked[req]);
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const id of wishlist) {
      const node = NODE_BY_ID.get(id);
      if (!node || unlocked[id] || !canTake(node) || spent + node.spCost > budget) continue;
      unlocked[id] = true;
      spent += node.spCost;
      progressed = true;
    }
  }
  return { unlocked, spent };
}
// Ưu tiên của một người học/làm việc: phiên dài trước, rồi giữ nhịp, rồi may mắn.
const WISHLIST = ['vao_guong', 'chuyen_can', 'phuc_hoi', 'nap_nang_luong', 'chuoi_ngay',
  'da_tap_trung', 'tich_phien', 'ban_tay_vang', 'nguoi_lap_ke', 'vung_dong_chay'];

const endMs = Date.parse(`${END}T21:00:00+07:00`);
const DAY = 86400000;

// ─── VÒNG 1: rải phiên theo ngày, dùng CÔNG THỨC THẬT ─────────────────────────────────────────
// Chạy 2 lượt: lượt 1 ước lượng tổng XP để biết cấp → biết ngân sách điểm kỹ năng; lượt 2 chạy
// lại với đúng bộ kỹ năng đó. Nếu không làm vậy thì kỹ năng và phần thưởng lệch nhau.
function playthrough(unlockedSkills) {
  const seq = [];              // theo THỨ TỰ THỜI GIAN tăng dần
  const activeDays = [];       // 'YYYY-MM-DD' các ngày có phiên hoàn thành
  let runEP = 0;
  let runXP = 0;
  let minutes = 0;
  let doneCount = 0;
  let cancelCount = 0;
  let cancelMinutes = 0;
  // Bảo tàng + công trình: dựng dần theo thời gian, niêm phong khi qua kỷ.
  let buildings = [];
  let buildingLevels = {};
  let archive = {};
  let sessionsThisEra = 0;
  let era = getActiveBook(0);

  for (let d = DAYS - 1; d >= 0; d -= 1) {
    const dayStart = endMs - d * DAY;
    const weekday = new Date(dayStart).getUTCDay();
    // Vài ngày nghỉ hẳn — để "chuỗi ngày", "phục hồi sau ngày nghỉ" và biểu đồ có chỗ đứt thật.
    if (rand() < (weekday === 0 ? 0.45 : 0.12)) continue;

    const count = 2 + Math.floor(rand() * 5);
    let dayHadSession = false;
    let doneToday = 0;
    for (let s = 0; s < count; s += 1) {
      const mins = pickLength();
      const cat = pickCategory();
      // Giờ trong ngày lệch về sáng và tối, giống nhịp người thật hơn là rải đều. Phiên sau
      // LUÔN muộn hơn phiên trước trong cùng ngày (bản đầu để ngược, làm biểu đồ giờ sai nhịp).
      const hour = Math.min(23, (rand() < 0.45 ? 8 : 14) + Math.floor(rand() * 4) + s);
      const finishedAt = dayStart - (21 - hour) * 3600000 + Math.floor(rand() * 25) * 60000;
      const startedAt = finishedAt - mins * 60000;
      // Số lần tạm dừng — Coach đọc trường này (`getInterruptionPattern`); phiên thiếu trường sẽ
      // bị BỎ QUA chứ không coi là "trơn", nên phải luôn có mặt kể cả khi rỗng.
      const pauses = rand() < 0.62 ? [] : [{ at: startedAt + 5 * 60000, ms: 40000 + Math.floor(rand() * 90000) }];

      if (rand() < 0.06) {
        cancelCount += 1;
        const kept = Math.max(1, Math.round(mins * 0.4));
        cancelMinutes += kept;
        seq.push({
          id: `s_${d}_${s}`, book: era, timestamp: finishedAt, startedAt, finishedAt,
          pauseSegments: pauses, pausedTotalMs: 0, wallClockDurationMs: mins * 60000,
          minutes: kept, elapsedSeconds: kept * 60, targetMinutes: mins,
          xpEarned: 0, epEarned: 0, tier: 'Phiên bị hủy', multiplier: 0,
          jackpot: false, resources: {}, rpEarned: 0, refinedEarned: 0, blueprint: null,
          categoryId: cat.id, categorySnapshot: cat, status: 'cancelled', completed: false,
          cancelled: true, cancelledAt: finishedAt, cancelProgressRatio: 0.4, cancelPenalty: null,
          comboCount: 1, positiveEvent: null, positiveEventRPBonus: 0, note: null, breakNote: null,
          goal: null, goalAchieved: false, nextNote: null,
          breakCompletedOnTime: false, breakCompletedAt: null,
        });
        continue;
      }

      // ⇩ ĐÂY là chỗ dùng công thức THẬT của app thay vì tỉ giá bịa.
      const r = calculateRewards(mins, unlockedSkills, runEP, {}, {
        consecutiveSessionsToday: doneToday,
        sessionsCompletedToday: doneToday,
        isFirstSessionToday: doneToday === 0,
        sessionsInCurrentEra: sessionsThisEra,
        erasCompleted: Math.max(0, era - 1),
      });

      doneCount += 1;
      doneToday += 1;
      dayHadSession = true;
      minutes += mins;
      runXP += r.finalXP;
      runEP += r.finalEP;
      sessionsThisEra += 1;

      seq.push({
        id: `s_${d}_${s}`, book: era, timestamp: finishedAt, startedAt, finishedAt,
        pauseSegments: pauses, pausedTotalMs: pauses.reduce((n, p) => n + p.ms, 0),
        wallClockDurationMs: mins * 60000, minutes: mins, elapsedSeconds: mins * 60,
        xpEarned: r.finalXP, epEarned: r.finalEP, tier: r.tierLabel, multiplier: r.multiplier,
        jackpot: !!r.jackpotTriggered, resources: r.resources ?? {}, rpEarned: r.rpEarned ?? 0,
        refinedEarned: 0, blueprint: null,
        categoryId: cat.id, categorySnapshot: cat, status: 'completed', completed: true,
        cancelled: false, cancelledAt: null, cancelProgressRatio: null, targetMinutes: mins,
        comboCount: 1 + Math.floor(rand() * 3), positiveEvent: null, positiveEventRPBonus: 0,
        note: rand() < 0.18 ? pick(['Xong chương 3', 'Tập trung tốt', 'Hơi mệt nhưng ổn', 'Bị ngắt giữa chừng']) : null,
        breakNote: null, goal: rand() < 0.3 ? 'Hoàn thành phần đang dở' : null, goalAchieved: null,
        nextNote: null, breakCompletedOnTime: rand() < 0.7, breakCompletedAt: finishedAt + 300000,
      });

      // Xây công trình của kỷ hiện tại.
      //
      // ⚠️ LẦN THỨ 12 CÔNG CỤ DEV NÓI DỐI (2026-08-13). Chỗ này từng là `notBuilt.length > 1` với
      // lý do "chừa một bản vẽ chưa xây để còn `craftingQueue` mà soi giàn giáo". Ý định đúng,
      // nhưng nó áp cho MỌI kỷ — kể cả kỷ đã niêm phong, nơi chẳng còn ai đang xây gì. Hệ quả:
      // **không kỷ nào trong fixture có thể đạt 5/5**, và cả bảo tàng ra một dãy "4/5" giống hệt
      // nhau. Một fixture đều tăm tắp thì không kiểm được thứ gì thay đổi theo kỷ — trạng thái
      // "trọn vẹn" gần như không tồn tại để mà nhìn thấy, và một tính năng hỏng vẫn trông bình
      // thường. Đúng bài học "một trade-off chỉ có thật khi cả hai vế đều đã đạt": ở đây vế thứ
      // hai (giàn giáo) không hề cần cái giá đó, vì nó chỉ liên quan tới kỷ ĐANG chơi.
      // ⇒ Nay cho kỷ xây kín thoải mái; việc chừa chỗ cho giàn giáo được xử lý MỘT LẦN ở cuối,
      // đúng chỗ nó có nghĩa (xem "CHỪA CHỖ CHO GIÀN GIÁO" bên dưới).
      const catalog = BLUEPRINT_CATALOG[String(era)] ?? [];
      const notBuilt = catalog.filter((bp) => !buildings.includes(bp.id));
      if (notBuilt.length > 0 && rand() < 0.16) {
        const bp = notBuilt[Math.floor(rand() * notBuilt.length)];
        buildings = [...buildings, bp.id];
        buildingLevels = { ...buildingLevels, [bp.id]: 1 };
      } else if (buildings.length && rand() < 0.10) {
        const id = buildings[Math.floor(rand() * buildings.length)];
        buildingLevels = { ...buildingLevels, [id]: Math.min(3, (buildingLevels[id] ?? 1) + 1) };
      }

      // Lên kỷ → NIÊM PHONG thành phố cũ bằng đúng hàm engine, rồi cắt như store vẫn cắt.
      const nextEra = getActiveBook(runEP);
      if (nextEra > era) {
        const removed = buildings.filter((id) => BLUEPRINT_META[id]?.era !== nextEra);
        archive = mergeCityArchive(archive, removed, buildingLevels, {
          sealedAt: localDateStr(new Date(finishedAt)),
          epAtSeal: runEP,
          sessionCount: sessionsThisEra,
        });
        buildings = buildings.filter((id) => BLUEPRINT_META[id]?.era === nextEra);
        buildingLevels = Object.fromEntries(
          Object.entries(buildingLevels).filter(([id]) => buildings.includes(id)),
        );
        sessionsThisEra = 0;
        era = nextEra;
      }
    }
    if (dayHadSession) activeDays.push(localDateStr(new Date(dayStart)));
  }

  // ── CHỪA CHỖ CHO GIÀN GIÁO — một lần duy nhất, đúng chỗ nó có nghĩa ─────────────────────────
  // Kỷ ĐANG chơi mà xây kín 5/5 thì `craftingQueue` rỗng, và cả mảng "Đang xây" + giàn giáo 3D
  // (Phase 3H/3I) không có gì để soi. Nhả lại đúng MỘT công trình ở đây thay vì cấm mọi kỷ xây kín
  // như bản cũ: kỷ đã niêm phong nay được phép trọn vẹn, nên bảo tàng có cả 4/5 lẫn 5/5 để nhìn.
  const liveCatalog = BLUEPRINT_CATALOG[String(era)] ?? [];
  if (liveCatalog.length > 0 && buildings.length >= liveCatalog.length) {
    const dropped = buildings[buildings.length - 1];
    buildings = buildings.slice(0, -1);
    buildingLevels = Object.fromEntries(
      Object.entries(buildingLevels).filter(([id]) => id !== dropped),
    );
  }

  return {
    seq, activeDays, totalXP: runXP, totalEP: runEP, minutes,
    doneCount, cancelCount, cancelMinutes,
    buildings, buildingLevels, archive, era, sessionsThisEra,
  };
}

// Lượt 1 — không kỹ năng, chỉ để ƯỚC LƯỢNG cấp ⇒ ngân sách điểm kỹ năng.
const probe = playthrough({});
const probeLevel = Math.floor(probe.totalXP / EXP_PER_LEVEL);
const { unlocked: UNLOCKED_SKILLS, spent: SP_SPENT } = unlockWithin(probeLevel * SP_PER_LEVEL, WISHLIST);

// Lượt 2 — cùng hạt giống, cùng nhịp ngày/độ dài phiên; chỉ khác bộ kỹ năng.
resetStream();
const run = playthrough(UNLOCKED_SKILLS);

const history = [...run.seq].sort((a, b) => b.timestamp - a.timestamp);

// ─── THÀNH TÍCH ────────────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ FIXTURE NÀY TỪNG KHÔNG GIEO MỘT DẤU THÀNH TÍCH NÀO — trong khi chú thích ở đầu file tự nêu
 * "0/360 thành tích" làm ĐÚNG cái cảnh nó sinh ra để chữa. Nghĩa là suốt thời gian qua, mọi lần
 * soi tab Thành tích bằng fixture đều đang xem màn hình của NGÀY ĐẦU TIÊN: một thẻ "0 / 360 dấu",
 * một thẻ "Chưa có dấu nào", một thẻ "0 · 0 · 0 · 0 · 0". Không kết luận mỹ thuật nào rút ra từ
 * đó có giá trị. Cùng bài học *"một câu tự trấn an cũng phải được kiểm như một con số"* — lần này
 * câu tự trấn an nằm trong chú thích của chính công cụ.
 *
 * ⚠️ KHÔNG VIẾT CÔNG THỨC THỨ HAI. Dự án đã có sẵn HAI bản dựng ảnh chụp trạng thái thành tích
 * (`buildAchievementSnapshot` ở `gameStore.js` và `buildAchievementSnapshotForReplay` ở
 * `achievementTimeline.js`) và chú thích của chúng đã cảnh báo nhau về nguy cơ trôi lệch. Thêm bản
 * thứ ba ở đây là mời đúng cái bẫy ấy. Thay vào đó dùng lại `inferAchievementUnlockTimes`: nó
 * replay lịch sử và gọi CHÍNH `achievement.check()` của mã sản phẩm, nên tập dấu mở được ở đây
 * đúng bằng tập mà app thật sẽ mở với cùng lịch sử đó.
 *
 * ⚠️ MỘT SAI SỐ ĐÃ BIẾT, CÓ CHỦ ĐÍCH: hàm ấy nhận `unlockedIds` làm ĐẦU VÀO (nó vốn dùng để suy
 * NGÀY mở khoá cho những dấu ĐÃ biết là mở). Ta đưa cả 360 id vào làm ứng viên, nên vài dấu kiểu
 * "mở được N dấu khác" có thể nổ sớm hơn thực tế. Với một fixture dùng để SOI GIAO DIỆN thì đó là
 * đánh đổi đúng; tuyệt đối đừng trích số ở đây vào bất kỳ kết luận cân bằng game nào.
 */
const achievementTimeline = inferAchievementUnlockTimes(
  history,
  ACHIEVEMENTS.map((a) => a.id),
  {},
);
const achievements = {
  unlocked: Object.keys(achievementTimeline),
  timeline: achievementTimeline,
};

// ─── SUY RA mọi con số giao diện đem so với nhau ──────────────────────────────────────────────
const activeBook = getActiveBook(run.totalEP);
const level = Math.floor(run.totalXP / EXP_PER_LEVEL);
const spAvailable = Math.max(0, level * SP_PER_LEVEL - SP_SPENT);

// Chuỗi ngày: đi lại danh sách ngày có phiên (đã theo thứ tự tăng dần).
let currentStreak = 0;
let longestStreak = 0;
for (let i = 0; i < run.activeDays.length; i += 1) {
  const prev = i > 0 ? Date.parse(`${run.activeDays[i - 1]}T00:00:00Z`) : null;
  const cur = Date.parse(`${run.activeDays[i]}T00:00:00Z`);
  currentStreak = prev !== null && cur - prev === DAY ? currentStreak + 1 : 1;
  longestStreak = Math.max(longestStreak, currentStreak);
}
const lastActiveDate = run.activeDays[run.activeDays.length - 1] ?? null;

// eraTracking: cùng công thức `rebuildEraTrackingFromHistory` (gameStore.js:2984) — 3 dòng, chép
// lại ở đây vì không thể import store (React/Zustand/localStorage) vào một script node.
const completed = history.filter((e) => e.status === 'completed');
const books = completed.map((e) => e.book).filter(Number.isFinite);
const eraTracking = {
  sessionsInCurrentEra: completed.filter((e) => e.book === activeBook).length,
  currentEraBook: activeBook,
  erasCompleted: Math.max(0, Math.max(...books, activeBook) - 1),
};

// Đang xây: một bản vẽ của KỶ HIỆN TẠI chưa xây, tiến độ không bao giờ vượt `sessionsToComplete`.
const pendingBp = (BLUEPRINT_CATALOG[String(activeBook)] ?? [])
  .find((bp) => !run.buildings.includes(bp.id));
const craftingQueue = pendingBp
  ? [{
    bpId: pendingBp.id,
    sessionsRemaining: Math.max(1, Math.floor((BLUEPRINT_META[pendingBp.id]?.sessionsToComplete ?? 4) / 2)),
    startedAt: endMs - 2 * DAY,
  }]
  : [];

// ⚠️ TÊN KHOÁ lấy từ chính `makeDefaultProgress`/`normalizeStoredPlayer` (gameStore.js:1803,1878),
// KHÔNG đoán: bản đầu ghi `progress.totalXP` + `player.xp` + `player.totalFocusMinutes` — cả ba
// khoá đều KHÔNG tồn tại, nên app lẳng lặng đọc ra 0 và tôi lại tưởng app hỏng.
const fixture = {
  state: {
    progress: {
      totalEP: run.totalEP,
      activeBook,
      sessionsCompleted: run.doneCount,
      totalFocusMinutes: run.minutes,
      longBreakCycleStart: run.doneCount,   // = "vừa nghỉ dài xong", đúng giá trị app tự đặt
      longBreakGraceDeadlineAt: null,
      longBreakPreviewSession: false,
    },
    player: {
      level,
      totalEXP: run.totalXP,
      sp: spAvailable,
      unlockedSkills: UNLOCKED_SKILLS,
    },
    streak: { currentStreak, longestStreak, lastActiveDate, skipShieldUsedWeekKey: null },
    achievements,
    history,
    historyStats: {
      completedSessions: run.doneCount, completedMinutes: run.minutes,
      cancelledSessions: run.cancelCount, cancelledMinutes: run.cancelMinutes,
    },
    eraTracking,
    buildings: run.buildings,
    buildingLevels: run.buildingLevels,
    cityArchive: run.archive,
    craftingQueue,
    sessionCategories: CATEGORIES,
  },
  version: 4,
};

writeFileSync(OUT, JSON.stringify(fixture));
const sealedEras = Object.keys(run.archive).length;
console.log(`✓ ${OUT}`);
console.log(`  ${DAYS} ngày · ${run.doneCount} phiên xong · ${run.cancelCount} phiên huỷ · chuỗi ${currentStreak} (kỷ lục ${longestStreak})`);
console.log(`  ${Math.round(run.minutes / 60)} giờ tập trung · ${run.totalXP.toLocaleString('vi-VN')} XP · cấp ${level} · ${spAvailable} điểm kỹ năng chưa tiêu`);
console.log(`  ${run.totalEP.toLocaleString('vi-VN')} EP → kỷ ${activeBook} · ${run.buildings.length} công trình đang đứng · ${sealedEras} kỷ đã niêm phong vào bảo tàng`);
console.log(`  ${Object.keys(UNLOCKED_SKILLS).length} kỹ năng đã mở (tiêu ${SP_SPENT} điểm)`);
console.log(`  ${achievements.unlocked.length}/${ACHIEVEMENTS.length} dấu thành tích — replay bằng chính hàm check() của mã sản phẩm`);
console.log('  ⚠️ Công thức phần thưởng là THẬT; nhịp chơi là giả — đừng trích số vào kết luận cân bằng game.');
