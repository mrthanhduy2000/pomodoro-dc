/**
 * gameStore.prestige.test.js — CHARACTERIZATION TESTS cho triggerPrestige()
 * ─────────────────────────────────────────────────────────────────────────────
 * Prestige (Thăng Hoa) là thao tác PHÁ HUỶ CÓ CHỦ ĐÍCH: reset toàn bộ tiến trình
 * để đổi lấy bonus vĩnh viễn. Nó bảo toàn dữ liệu bằng một WHITELIST THỦ CÔNG
 * (gameStore.js — triggerPrestige) chồng lên makeProgressionResetState(). Nghĩa
 * là: bất kỳ khoá dữ-liệu-đáng-giữ nào bị QUÊN trong whitelist sẽ bị xoá vĩnh
 * viễn khi người dùng prestige — không crash, không cảnh báo (TECH_DEBT #1/#2 đã
 * cảnh báo mẫu hình này). File này khoá TỪNG khoá được giữ và TỪNG khoá bị reset,
 * để mọi thay đổi tương lai vào whitelist/reset đều làm test đỏ một cách có ý thức.
 *
 * Đồng thời ĐÓNG BĂNG bug đã xác minh (TECH_DEBT #3): 3 kỹ năng nhánh Thăng Hoa
 * (kien_thuc_nen / ke_thua / sieu_viet) mô tả hứa đặc quyền giữ-lại khi prestige
 * nhưng KHÔNG được nối dây — test cuối khoá đúng hành vi "hứa mà không làm" này.
 * KHÔNG sửa trong phiên này (sửa = thay đổi hành vi lớn, ngoài phạm vi lưới test).
 *
 * KHÔNG sửa implementation. Mọi giá trị quan sát từ code thật (probe 2 lần).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}
globalThis.window = {
  localStorage: createMemoryStorage(),
  sessionStorage: createMemoryStorage(),
};

const [
  { default: useGameStore },
  { PRESTIGE_EP_REQUIREMENT },
] = await Promise.all([
  import('./gameStore.js'),
  import('../engine/constants.js'),
]);

const initialState = useGameStore.getInitialState();

function resetStore() {
  window.localStorage.clear();
  window.sessionStorage.clear();
  useGameStore.setState(initialState, true);
}

/** Dựng state "giàu có" với dấu vân tay riêng ở TỪNG slice đáng giữ. */
function setupRichState() {
  resetStore();
  useGameStore.setState((s) => ({
    progress: { ...s.progress, totalEP: PRESTIGE_EP_REQUIREMENT, sessionsCompleted: 77, totalFocusMinutes: 999 },
    player: {
      ...s.player,
      level: 9,
      totalEXP: 55555,
      sp: 13,
      unlockedSkills: { ...s.player.unlockedSkills, ke_thua: true, kien_thuc_nen: true, sieu_viet: true },
    },
    relics: [{ id: 'mam_song_bat_diet' }],
    relicEvolutions: { mam_song_bat_diet: 1 },
    achievements: { ...s.achievements, unlocked: ['ach_x'], unlockTimes: { ach_x: 123 } },
    history: [{ id: 1, minutes: 25, timestamp: '2026-07-01T00:00:00.000Z', completed: true, status: 'completed', book: 1 }],
    historyStats: { ...s.historyStats, bestSessionMinutes: 90 },
    savedNotes: [{ id: 'n1', note: 'giữ tôi lại' }],
    sessionCategories: [...s.sessionCategories, { id: 'cat_keep', label: 'Giữ' }],
    lastWeeklyReportDate: '2026-07-07',
    timerConfig: { ...s.timerConfig, focusMinutes: 33 },
    tinhThe: 7,
    resources: { ...s.resources, book1: { da_silex: 500, xuong: 500 } },
    buildings: ['bp_x'],
    streak: { ...s.streak, currentStreak: 9 },
    research: { ...s.research, rp: 4444 },
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1) Tài sản trong whitelist SỐNG SÓT qua prestige — khoá từng khoá một
// ═══════════════════════════════════════════════════════════════════════════════
test('triggerPrestige: mọi tài sản whitelist sống sót nguyên vẹn', () => {
  setupRichState();
  assert.equal(useGameStore.getState().triggerPrestige(), true);
  const s = useGameStore.getState();

  assert.deepEqual(s.relics, [{ id: 'mam_song_bat_diet' }]);
  assert.deepEqual(s.relicEvolutions, { mam_song_bat_diet: 1 });
  assert.deepEqual(s.achievements.unlocked, ['ach_x']);
  assert.equal(s.achievements.unlockTimes.ach_x, 123);
  assert.equal(s.history.length, 1);
  assert.equal(s.history[0].id, 1);
  assert.equal(s.historyStats.bestSessionMinutes, 90);
  assert.equal(s.savedNotes.length, 1);
  assert.equal(s.savedNotes[0].note, 'giữ tôi lại');
  assert.equal(s.sessionCategories.some((c) => c.id === 'cat_keep'), true);
  assert.equal(s.lastWeeklyReportDate, '2026-07-07');
  assert.equal(s.timerConfig.focusMinutes, 33);
  assert.equal(s.tinhThe, 7);
  // Quan sát hiện trạng: buildings KHÔNG bị makeProgressionResetState đụng tới
  // (không nằm trong object reset, cũng không trong whitelist) → sống sót "ngầm".
  // Khoá lại để nếu ai đổi reset-state làm buildings biến mất, test đỏ ngay.
  assert.deepEqual(s.buildings, ['bp_x']);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2) Tiến trình bị RESET đúng như thiết kế — khoá từng khoá một
// ═══════════════════════════════════════════════════════════════════════════════
test('triggerPrestige: tiến trình reset đúng (level/EXP/SP/EP/resources/streak/RP)', () => {
  setupRichState();
  useGameStore.getState().triggerPrestige();
  const s = useGameStore.getState();

  assert.equal(s.player.level, 0);
  assert.equal(s.player.totalEXP, 0);
  assert.equal(s.player.sp, 0);
  assert.equal(s.progress.totalEP, 0);
  assert.equal(s.progress.sessionsCompleted, 0);
  assert.equal(s.progress.totalFocusMinutes, 0);
  assert.equal(s.progress.activeBook, 1);
  assert.deepEqual(s.resources.book1, { da_silex: 0, xuong: 0 });
  assert.equal(s.streak.currentStreak, 0);
  assert.equal(s.research.rp, 0);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3) Sổ prestige ghi đúng: count +1, bonus vĩnh viễn +5%, history nối thêm
// ═══════════════════════════════════════════════════════════════════════════════
test('triggerPrestige: count tăng 1, permanentBonus 0.05, prestige.history nối thêm', () => {
  setupRichState();
  useGameStore.getState().triggerPrestige();
  const s = useGameStore.getState();
  assert.equal(s.prestige.count, 1);
  assert.equal(s.prestige.permanentBonus, 0.05);
  assert.equal(s.prestige.history.length, 1);
  assert.equal(s.prestige.history[0].epAtPrestige, PRESTIGE_EP_REQUIREMENT);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4) Chưa đủ EP → từ chối, KHÔNG đổi bất cứ gì
// ═══════════════════════════════════════════════════════════════════════════════
test('triggerPrestige: dưới ngưỡng EP trả false và không đổi gì', () => {
  resetStore();
  useGameStore.setState((s) => ({
    progress: { ...s.progress, totalEP: PRESTIGE_EP_REQUIREMENT - 1 },
    player: { ...s.player, level: 3, sp: 5 },
  }));
  assert.equal(useGameStore.getState().triggerPrestige(), false);
  const s = useGameStore.getState();
  assert.equal(s.player.level, 3);
  assert.equal(s.player.sp, 5);
  assert.equal(s.progress.totalEP, PRESTIGE_EP_REQUIREMENT - 1);
  assert.equal(s.prestige.count, 0);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5) ĐÓNG BĂNG BUG (TECH_DEBT #3): 3 kỹ năng Thăng Hoa KHÔNG có tác dụng thật
// ═══════════════════════════════════════════════════════════════════════════════
test('triggerPrestige: [ĐẶC TẢ BUG #3] kien_thuc_nen/ke_thua/sieu_viet KHÔNG áp đặc quyền nào', () => {
  // Mô tả trong constants.js hứa: giữ 1 skill nâng cao (kien_thuc_nen), giữ 50% SP
  // chưa dùng (ke_thua), +100% XP kỷ nguyên 1 sau prestige (sieu_viet). Thực tế
  // ĐÃ XÁC MINH (audit 2026-07-13, grep + đọc triggerPrestige): không code nào đọc
  // 3 cờ này — reset diễn ra VÔ ĐIỀU KIỆN. Test này ĐÓNG BĂNG hành vi hiện tại:
  //  - sp 13 → 0 (ke_thua hứa giữ 50% ⇒ đáng lẽ ~6-7, thực tế 0)
  //  - cả 3 skill → false (kien_thuc_nen hứa giữ 1 skill ⇒ thực tế mất sạch)
  // KHI NÀO SỬA BUG #3 (nối dây hoặc sửa mô tả) thì test này PHẢI được cập nhật
  // một cách có ý thức — đó chính là mục đích của nó. KHÔNG sửa ở Giai đoạn A
  // trước khi Đàm chọn phương án (nối dây vs sửa mô tả).
  setupRichState(); // đã mở cả 3 skill + sp = 13
  useGameStore.getState().triggerPrestige();
  const s = useGameStore.getState();
  assert.equal(s.player.sp, 0);
  assert.equal(s.player.unlockedSkills.ke_thua, false);
  assert.equal(s.player.unlockedSkills.kien_thuc_nen, false);
  assert.equal(s.player.unlockedSkills.sieu_viet, false);
});
