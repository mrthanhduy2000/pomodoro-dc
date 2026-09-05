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
 * `LootDropModal.jsx` để lấy danh sách trường mà hộp thoại thật sự đọc, rồi đòi bản giả phải phủ
 * đủ. Đổi tên một trường ở `completeFocusSession` mà quên ở đây ⇒ bài test đỏ, thay vì lặng lẽ
 * dựng ra một màn thiếu một dòng và người soi tưởng app vốn thế.
 */

export const PREVIEW_PARAM = 'dc-preview';
/** Thẻ nào của chuỗi thẻ thưởng cần đứng yên để chụp (`xp` · `streak` · `today` · `quests` · `level` · `era`). */
export const PREVIEW_CARD_PARAM = 'dc-preview-card';

/** Một phiên 25 phút bình thường, không có gì đặc biệt — ca HAY GẶP NHẤT. */
const PHIEN_THUONG = {
  activeBook: 8,
  newBook: 8,
  tierLabel: 'Tiêu Chuẩn',
  multiplier: 1.0,
  effectiveMinutes: 25,
  bonusMinutes: 0,
  baseXP: 50,
  finalXP: 65,
  totalSessionXP: 65,
  finalEP: 120,
  rpEarned: 18,
  resources: { food: 12, wood: 8 },
  t2Drop: 0,
  largeChest: false,
  jackpotApplied: false,
  luckyBurstApplied: false,
  comboCount: 2,
  comboBonus: 5,
  positiveEvent: null,
  positiveEventBonus: 0,
  positiveEventRPBonus: 0,
  streakDays: 4,
  streakBonus: 10,
  overclockBonus: 0,
  levelsGained: 0,
  spGained: 0,
  newLevel: 5,
  eraChanged: false,
  buildingPerkRewards: [],
  buildingPerkBonusRefined: 0,
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
  rpEarned: 64,
  resources: { food: 40, wood: 32, stone: 18 },
  t2Drop: 3,
  largeChest: true,
  jackpotApplied: true,
  luckyBurstApplied: true,
  comboCount: 5,
  comboBonus: 40,
  positiveEvent: { label: 'Mùa màng bội thu', icon: '🌾' },
  positiveEventBonus: 25,
  positiveEventRPBonus: 8,
  streakDays: 12,
  streakBonus: 30,
  overclockBonus: 15,
  levelsGained: 1,
  spGained: 1,
  newLevel: 6,
  buildingPerkRewards: [{ label: 'Nhà Kho · lộc công trình', xp: 12, refined: 1 }],
  buildingPerkBonusRefined: 1,
};

/**
 * Các cảnh soi được. Mỗi cảnh là một MẢNH `ui` — nó được trộn ĐÈ lên `ui` hiện có, không thay
 * thế cả `ui` (thay cả thì mất `isOnBreak`, `notificationFeed`… và màn hình dựng ra một thứ
 * không tồn tại).
 */
export const PREVIEW_SCENES = {
  /** Hộp phần thưởng, phiên thường. */
  /** `missionCompletedIds`: chỉ có tác dụng khi bản lưu đang soi CÓ nhiệm vụ mang id ấy — để thẻ
   *  Nhiệm vụ trong chuỗi thẻ thưởng (ADR-068) hiện được trạng thái "vừa xong". */
  loot: { lootModalOpen: true, pendingReward: PHIEN_THUONG, missionCompletedIds: ['session_30min'] },
  /** Hộp phần thưởng, ca đỉnh — nhiều dòng nhất. */
  'loot-max': { lootModalOpen: true, pendingReward: PHIEN_DINH },
  /** Lên kỷ nguyên: hộp phần thưởng TỰ bật (một trong ba thứ được phép chặn màn hình). */
  era: { lootModalOpen: true, pendingReward: { ...PHIEN_DINH, eraChanged: true, newBook: 9 } },
  /** Lên cấp. */
  level: { levelUpQueue: [{ levelsGained: 1, newLevel: 6, spGained: 1 }] },
  /** Chuỗi toast: nhiều tin cùng lúc, ca dễ chồng chéo nhất. */
  toasts: {
    lootModalOpen: true,
    pendingReward: PHIEN_THUONG,
    levelUpQueue: [{ levelsGained: 1, newLevel: 6, spGained: 1 }],
    relicNotification: { id: 'relic-preview', name: 'Mảnh Gốm Cổ', icon: '🏺' },
    achievementQueue: [{ id: 'ach-preview', name: 'Bền Bỉ', icon: '🏅', description: 'Xong 50 phiên' }],
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
export function buildPreviewUi(scene) {
  const patch = PREVIEW_SCENES[scene];
  return patch ? { ...patch } : null;
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
