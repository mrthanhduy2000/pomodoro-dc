/**
 * previewStage.js — GỠ ĐIỂM MÙ "màn hiện ra SAU khi kết thúc một phiên".
 *
 * ⚠️ VÌ SAO PHẢI CÓ FILE NÀY. Khoảnh khắc dopamine lớn nhất của app — lễ mừng thành phố, hộp
 * phần thưởng, lên cấp, chuỗi toast — là màn DUY NHẤT chưa ai từng soi được, suốt nhiều vòng:
 *   · nó sống trong `state.ui`, mà `ui` KHÔNG nằm trong `partialize` ⇒ không gieo được bằng
 *     `--fixture`/`--ls` (đã kiểm: `normalizePersistedGameState` cũng KHÔNG đọc `persisted.ui`,
 *     nó chỉ suy ra trạng thái nghỉ từ `breakSession` — và điều đó PHẢI giữ nguyên, vì cổng ấy
 *     gác mọi dữ liệu từ Supabase/import: cho `ui` đi qua đó là để một máy khác đẩy hộp thoại
 *     sang máy này);
 *   · store không lộ ra `window` ⇒ `--probe` không mở được;
 *   · và cách duy nhất còn lại — bấm "Bắt đầu" — bị CẤM trên dev vì dev dùng chung một dòng
 *     Supabase với bản thật của Đàm.
 * Ba đường cùng bịt ⇒ mọi bản vá cho màn ấy đều phải ship mù. Nó đã chặn `TECH_DEBT #94` thật.
 *
 * ⚠️ VÌ SAO AN TOÀN — ĐÃ ĐO, KHÔNG PHẢI SUY ĐOÁN. Mọi hộp thoại sau phiên đều CHỈ ĐỌC `ui`, và
 * mọi hành động đóng của chúng (`closeLootModal`, `dismissLevelUp`, `dismissRelicNotification`…)
 * cũng CHỈ ghi vào `ui`. Phần thưởng đã được cấp từ trước bởi `completeFocusSession`; các màn này
 * thuần tuý TRÌNH BÀY lại. Cộng với việc `ui` không nằm trong `partialize`, dựng cảnh ở đây:
 *   KHÔNG chạm `history`/`progress`/`player` · KHÔNG ghi localStorage · KHÔNG lên Supabase ·
 *   KHÔNG bắt đầu một phiên nào.
 * Đó là lý do nó được phép tồn tại trong bản dựng thật thay vì phải có một chế độ build riêng
 * (một chế độ build riêng thì `npm run build` thường sẽ xoá mất nó, và người sau sẽ soi nhầm
 * bản không có hook rồi tưởng công cụ hỏng).
 *
 * ⚠️ ĐÂY LÀ MỘT BẢN GIẢ, NÊN NÓ CÓ THỂ TRÔI KHỎI BẢN THẬT. `previewStage.test.js` đọc THẲNG
 * `sessionRewardStory.js` + `SessionRewardStory.jsx` (ADR-070: chuỗi thẻ là người đọc DUY NHẤT của
 * `pendingReward`) để lấy danh sách trường thật sự được đọc, rồi đòi bản giả phải phủ đủ. Đổi tên một trường ở `completeFocusSession` mà quên ở đây ⇒ bài test đỏ, thay vì lặng lẽ
 * dựng ra một màn thiếu một dòng và người soi tưởng app vốn thế.
 */

export const PREVIEW_PARAM = 'dc-preview';
/** Thẻ nào của chuỗi thẻ thưởng cần đứng yên để chụp (`xp` · `project` · `streak` · `today` · `quests` · `chain` · `quest` · `level` · `rank` · `relic` · `evolve` · `era`). */
export const PREVIEW_CARD_PARAM = 'dc-preview-card';
/** Placeholder a scene may use for "the project at the head of the inspected save's queue" (ADR-080). */
export const QUEUE_HEAD = '__queue_head__';

/** Một phiên 25 phút bình thường, không có gì đặc biệt — ca HAY GẶP NHẤT. */
const PHIEN_THUONG = {
  newBook: 8,
  tierLabel: 'Tiêu Chuẩn',
  multiplier: 1.0,
  effectiveMinutes: 25,
  bonusMinutes: 0,
  baseXP: 50,
  finalXP: 65,
  totalSessionXP: 65,
  finalEP: 120,
  jackpotApplied: false,
  luckyBurstApplied: false,
  comboCount: 2,
  comboBonus: 5,
  positiveEvent: null,
  positiveEventBonus: 0,
  streakDays: 4,
  streakBonus: 10,
  overclockBonus: 0,
  levelsGained: 0,
  spGained: 0,
  // ADR-084: điểm kỹ năng do THÀNH PHỐ trả (một công trình xong = 1 SP). 0 = phiên thường.
  citySP: 0,
  // ADR-085: ai đã trả cho phiên này (kỹ năng · di vật · đặc quyền công trình). Cảnh soi mặc định
  // để rỗng; cảnh `loot-credits` bên dưới mới là chỗ soi hàng chip ấy.
  credits: [],
  newLevel: 5,
  eraChanged: false,
  buildingPerkRewards: [],
  // ADR-069: ba tin của chuỗi thẻ thưởng — phiên thường không có tin nào.
  rankUp: null,
  relicEarned: null,
  crisisOpened: null,
  // ADR-069: cú may của nhánh Vận May (0 = không trúng) — thẻ +XP đọc để hiện chip «🍀 Vận may».
  luckXpBonus: 0,
  luckEpBonus: 0,
  // ADR-070: ba tin tự-vào — thưởng trọn ngày · bước tuần vừa chốt · di vật lên bậc. Phiên thường: không.
  dailyBonusXP: 0,
  weeklySteps: [],
  weeklyChainTitle: 'Thuở Khai Thiên',
  weeklyBonusSP: 0,
  relicsEvolved: [],
  acceleratedCraftingIds: [],
  // ADR-077: the ending's project card reads these three (brick landed / building finished / auto-queued).
  newlyBuiltIds: [],
  autoQueuedId: null,
  // ADR-080: the lucky second brick (null = a normal session).
  luckyBrickId: null,
  // ADR-081: the golden beat mid-session and what it paid.
  goldenBeat: null,
  goldenBonusXP: 0,
};

/** Ca ĐỈNH: jackpot + rương lớn + lên cấp + sự kiện tốt. Dùng để soi lúc màn đông nhất. */
const PHIEN_DINH = {
  ...PHIEN_THUONG,
  tierLabel: 'Chuyên Sâu',
  multiplier: 2.0,
  effectiveMinutes: 60,
  bonusMinutes: 5,
  baseXP: 120,
  finalXP: 260,
  totalSessionXP: 260,
  finalEP: 480,
  jackpotApplied: true,
  luckyBurstApplied: true,
  comboCount: 5,
  comboBonus: 40,
  positiveEvent: { label: 'Mùa màng bội thu', icon: '🌾' },
  positiveEventBonus: 25,
  streakDays: 12,
  streakBonus: 30,
  overclockBonus: 15,
  levelsGained: 1,
  spGained: 1,
  citySP: 0,
  credits: [],
  newLevel: 6,
  buildingPerkRewards: [{ label: 'Nhà Kho · lộc công trình', xp: 12 }],
  rankUp: { label: 'Thủy Thủ', icon: '⚓', buffLabel: '+12% EP' },
  luckXpBonus: 0.2,
  luckEpBonus: 0.1,
  relicEarned: { id: 'la_ban_da_vinci', label: 'La Bàn Da Vinci', icon: '🧭', description: 'Di vật Phục Hưng — tăng mạnh EP mỗi phiên.' },
  crisisOpened: null,
  dailyBonusXP: 43,
  weeklySteps: [{ index: 0, total: 4, label: 'Nhóm lửa — hoàn thành phiên đầu tiên', xp: 20, isLast: false, bonusSP: 0 }],
  weeklyChainTitle: 'Thuở Khai Thiên',
  weeklyBonusSP: 0,
  goldenBeat: 'halfway',
  goldenBonusXP: 39,
  relicsEvolved: [{ id: 'mam_song_bat_diet', label: 'Mầm Sống Bất Diệt', icon: '🌱', stage: 1, stageLabel: 'Tiến Hóa', buff: { epBonus: 0.11 } }],
};

/**
 * Các cảnh soi được. Mỗi cảnh là một MẢNH `ui` — nó được trộn ĐÈ lên `ui` hiện có, không thay
 * thế cả `ui` (thay cả thì mất `isOnBreak`, `notificationFeed`… và màn hình dựng ra một thứ
 * không tồn tại).
 */
export const PREVIEW_SCENES = {
  /** Chuỗi thẻ thưởng, phiên thường. */
  /** `missionCompletedIds`: chỉ có tác dụng khi bản lưu đang soi CÓ nhiệm vụ mang id ấy — để thẻ
   *  Nhiệm vụ trong chuỗi thẻ thưởng (ADR-068) hiện được trạng thái "vừa xong". */
  loot: { lootModalOpen: true, pendingReward: PHIEN_THUONG, missionCompletedIds: ['session_30min'] },
  /** Chuỗi thẻ thưởng, ca đỉnh — nhiều thẻ nhất (ADR-070: có cả bước tuần + di vật lên bậc). */
  'loot-max': { lootModalOpen: true, pendingReward: PHIEN_DINH },
  /** Lên kỷ nguyên: thẻ cuối là «Kỷ nguyên mới» với nút xem thành phố (ADR-070: không còn hộp thoại chi tiết). */
  era: { lootModalOpen: true, pendingReward: { ...PHIEN_DINH, eraChanged: true, newBook: 9 } },
  /**
   * ADR-080: the two project-card moments that depend on the SAVE being inspected — the lucky second
   * brick and a building finished. `QUEUE_HEAD` is swapped for the real queue head at apply time
   * (`buildPreviewUi(scene, state)`), so the scenes stay plain data the fidelity tests can read.
   */
  'loot-lucky': { lootModalOpen: true, pendingReward: { ...PHIEN_THUONG, luckyBrickId: QUEUE_HEAD } },
  'loot-built': { lootModalOpen: true, pendingReward: { ...PHIEN_THUONG, newlyBuiltIds: [QUEUE_HEAD] } },
  /* ADR-084: a finished building pays a skill point, and the card offers the skills to spend it on
     right there. This is the scene for photographing that card — the whole economy in one frame. */
  /* ADR-085: khoảnh khắc vừa mở một kỹ năng — băng-rôn 4,2 giây, nói bằng con số của chính Đàm
     (`engine/skillPreview.js` chạy phép tính thưởng thật hai lần rồi trừ). */
  'skill-moment': {
    skillUnlocked: {
      id: 'chuyen_can',
      label: 'Chuyên Cần',
      line: 'Phiên 48 phút, khi đủ điều kiện: +5 XP.',
    },
  },
  /* ADR-085: thẻ kết phiên kể tên ai đã trả — ba chip + "còn N nguồn nữa". Đây là cảnh soi hàng
     chip đó, vì nó chỉ hiện khi người chơi đã mở kỹ năng / có di vật / có đặc quyền. */
  'loot-credits': {
    lootModalOpen: true,
    pendingReward: {
      ...PHIEN_THUONG,
      credits: [
        { id: 'chuyen_can', kind: 'skill', label: 'Chuyên Cần', icon: '✦', xp: 21, epPct: 0 },
        { id: 'relic:ngoc', kind: 'relic', label: 'Ngọc Bằng Hà', icon: '✨', xp: 13, epPct: 0 },
        { id: 'perk:xp_all_5', kind: 'perk', label: 'Thờ Phổ Linh Hồn', icon: '🏛', xp: 8, epPct: 0 },
        { id: 'chuoi_ngay', kind: 'skill', label: 'Chuỗi Ngày', icon: '✦', xp: 5, epPct: 0 },
        { id: 'tich_phien', kind: 'skill', label: 'Tích Phiên', icon: '✦', xp: 4, epPct: 0 },
      ],
    },
  },
  'loot-city-sp': {
    lootModalOpen: true,
    pendingReward: { ...PHIEN_THUONG, newlyBuiltIds: [QUEUE_HEAD], citySP: 1 },
  },
  /** Lên cấp. */
  level: { levelUpQueue: [{ levelsGained: 1, newLevel: 6, spGained: 1 }] },
  /** Chuỗi toast: nhiều tin cùng lúc, ca dễ chồng chéo nhất. */
  toasts: {
    lootModalOpen: true,
    pendingReward: PHIEN_THUONG,
    levelUpQueue: [{ levelsGained: 1, newLevel: 6, spGained: 1 }],
    relicNotification: { id: 'relic-preview', name: 'Mảnh Gốm Cổ', icon: '🏺' },
  },
};

/** Đọc tên cảnh từ query string. Trả `null` nếu không có hoặc tên lạ — không đoán. */
export function readPreviewScene(search) {
  if (typeof search !== 'string' || search === '') return null;
  const raw = new URLSearchParams(search).get(PREVIEW_PARAM);
  if (!raw) return null;
  return Object.hasOwn(PREVIEW_SCENES, raw) ? raw : null;
}

/** Mảnh `ui` của một cảnh. Trả `null` nếu tên lạ. */
export function buildPreviewUi(scene, state = null) {
  const patch = PREVIEW_SCENES[scene];
  if (!patch) return null;
  const out = { ...patch };
  if (out.pendingReward) {
    const head = state?.craftingQueue?.[0]?.bpId ?? null;
    const pr = { ...out.pendingReward };
    if (pr.luckyBrickId === QUEUE_HEAD) pr.luckyBrickId = head;
    if (Array.isArray(pr.newlyBuiltIds)) pr.newlyBuiltIds = pr.newlyBuiltIds.map((id) => (id === QUEUE_HEAD ? head : id)).filter(Boolean);
    out.pendingReward = pr;
  }
  return out;
}

/**
 * Tên thẻ của chuỗi thẻ thưởng cần nhảy tới khi soi. `null` nếu không có — chuỗi thẻ tự chọn thẻ
 * đầu. Chỉ lọc ký tự an toàn; tên lạ thì `SessionRewardStory` tự rơi về thẻ đầu, không ném lỗi.
 */
export function readPreviewCard(search) {
  if (typeof search !== 'string' || search === '') return null;
  const raw = new URLSearchParams(search).get(PREVIEW_CARD_PARAM);
  return raw && /^[a-z]+$/.test(raw) ? raw : null;
}

/**
 * ADR-081 — SOI CÁC BANNER THEO LỊCH. Bốn khoảnh khắc dài (`engine/dayArc.js`) phụ thuộc vào NGÀY
 * và TUẦN, cộng một cú gieo may rủi cho «thợ đêm»: không có cú bấm nào dựng ra được chúng, và đợi
 * đúng sáng thứ Hai để chụp một tấm ảnh thì không phải một quy trình nghiệm thu.
 *
 * Dùng CHUNG tham số `?dc-preview=` với các cảnh `ui` ở trên: `readPreviewScene` bỏ qua tên lạ, còn
 * `readPreviewArc` bỏ qua tên của cảnh `ui`. Hai người đọc, một cửa, không ai đoán.
 */
export const PREVIEW_ARC = {
  'arc-day-open': { id: 'day-open', title: 'Ngày mới', line: 'Hôm qua 3 phiên · 1 giờ 20 phút · chuỗi 4 ngày.', tone: 'open' },
  'arc-gift': { id: 'day-open', title: 'Đêm qua có người xây giúp', line: 'Kho Gia Vị nhích thêm một viên gạch.', tone: 'gift' },
  'arc-day-close': { id: 'day-close', title: 'Xong mục tiêu hôm nay', line: '5 phiên · 2 giờ 10 phút.', tone: 'met' },
  'arc-day-close-small': { id: 'day-close', title: 'Ngày hôm nay khép lại', line: '1 phiên · 25 phút.', tone: 'some' },
  'arc-week-open': { id: 'week-open', title: 'Tuần mới', line: 'Tuần trước 12 phiên · 6 giờ 40 phút.', tone: 'open' },
  'arc-week-close': { id: 'week-close', title: 'Tuần này khép lại', line: '12 phiên · 6 giờ 40 phút.', tone: 'met' },
};

/** Khoảnh khắc dài cần dựng sẵn, hoặc `null`. Tên lạ ⇒ `null`, không đoán. */
export function readPreviewArc(search) {
  if (typeof search !== 'string' || search === '') return null;
  const raw = new URLSearchParams(search).get(PREVIEW_PARAM);
  return raw && Object.hasOwn(PREVIEW_ARC, raw) ? PREVIEW_ARC[raw] : null;
}
