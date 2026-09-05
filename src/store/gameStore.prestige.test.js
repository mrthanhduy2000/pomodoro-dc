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
import { SKILL_TREE } from '../engine/constants';
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
  // ⚠️ KHÔNG còn là 0: `setupRichState` mở `ke_thua`, và từ 2026-09-02 kỹ năng ấy THẬT SỰ giữ
  // 50% SP chưa dùng (`TECH_DEBT #3`). 13 → floor(13 × 0.5) = 6. Đây là hành vi ĐÚNG theo mô tả,
  // không phải một chỗ reset bị sót — xem bài "[#3 ĐÃ NỐI DÂY]" bên dưới.
  assert.equal(s.player.sp, 6);
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
test('triggerPrestige: [#3 ĐÃ NỐI DÂY] ba đặc quyền Thăng Hoa nay CÓ tác dụng', () => {
  /*
    ⚠️ BÀI NÀY THAY CHO MỘT BÀI ĐÃ CỐ Ý ĐÓNG BĂNG HÀNH VI LỖI ("[ĐẶC TẢ BUG #3]", 2026-07-17).
    Bài cũ khẳng định `sp 13 → 0` và cả ba kỹ năng → `false`, kèm một dòng dặn: *"khi nào sửa bug
    #3 thì test này PHẢI được cập nhật một cách có ý thức — đó chính là mục đích của nó"*. Nay đã
    sửa (nối dây, KHÔNG phải sửa mô tả — sửa mô tả là hợp thức hoá việc bán một món hàng rỗng giá
    16 SP), nên bài ấy được thay chứ không nới.
  */
  setupRichState(); // đã mở cả 3 kỹ năng + sp = 13
  const truoc = useGameStore.getState().player.unlockedSkills;
  const coAdvanced = Object.values(SKILL_TREE)
    .flatMap((b) => b.nodes)
    .filter((n) => n.tier === 'advanced' && truoc[n.id]);
  assert.ok(coAdvanced.length > 0, 'fixture không có kỹ năng Cao Cấp nào — phép đo chạy rỗng');

  useGameStore.getState().triggerPrestige();
  const s = useGameStore.getState();

  // `ke_thua`: giữ 50% SP chưa dùng, LÀM TRÒN XUỐNG (hứa 50% thì 13 ra 6, không phải 7).
  assert.equal(s.player.sp, 6);

  // `kien_thuc_nen`: giữ lại ĐÚNG MỘT kỹ năng Cao Cấp, và nó phải là một trong những cái đã mở.
  const giu = Object.entries(s.player.unlockedSkills).filter(([, v]) => v === true).map(([k]) => k);
  assert.equal(giu.length, 1, `phải giữ đúng 1 kỹ năng, đang giữ ${giu.length}: ${giu.join(', ')}`);
  assert.ok(truoc[giu[0]], 'giữ lại một kỹ năng chưa từng mở khoá');
  assert.equal(s.prestige.giuKyNang, giu[0], 'sổ prestige phải ghi đúng kỹ năng đã giữ');

  // `sieu_viet`: cờ phải SỐNG SÓT qua reset — đó là lý do nó nằm trong `prestige`, không ở `player`.
  assert.equal(s.prestige.sieuViet, true);
});

test('triggerPrestige: KHÔNG mở ba kỹ năng ấy thì reset vẫn sạch trơn như cũ', () => {
  // ⚠️ Đối chứng bắt buộc: thiếu bài này thì bản vá có thể đang tặng đặc quyền cho MỌI người chơi,
  // và bài trên vẫn xanh. Ba kỹ năng ấy tốn 16 SP — chúng phải là thứ PHẢI MUA mới có.
  resetStore();
  useGameStore.setState((st) => ({
    progress: { ...st.progress, totalEP: PRESTIGE_EP_REQUIREMENT },
    player: { ...st.player, sp: 13 },
  }));
  useGameStore.getState().triggerPrestige();
  const s = useGameStore.getState();
  assert.equal(s.player.sp, 0, 'chưa mua `ke_thua` mà vẫn được giữ SP');
  assert.deepEqual(
    Object.entries(s.player.unlockedSkills).filter(([, v]) => v === true).map(([k]) => k), [],
    'chưa mua `kien_thuc_nen` mà vẫn được giữ kỹ năng',
  );
  assert.equal(s.prestige.sieuViet, false);
});

