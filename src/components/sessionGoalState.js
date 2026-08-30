/**
 * sessionGoalState.js — BA trạng thái của ô "Mục tiêu phiên", thay cho hai.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * VÌ SAO TÁCH RA MỘT FILE THUẦN CHO MỘT VIỆC NHỎ NHƯ VẬY
 *
 * Vì cái sai không nằm ở màu chữ — nó nằm ở chỗ **mã chỉ biết có HAI trạng thái**:
 *   `isSessionGoalValid` đúng  → xanh, khen
 *   `isSessionGoalValid` sai   → cam, đậm, "Cần nhập mục tiêu trước khi bắt đầu phiên."
 *
 * Mà "sai" gộp chung hai hoàn cảnh khác hẳn nhau về ĐẠO LÝ:
 *   • Đàm vừa mở app, chưa gõ chữ nào  → anh CHƯA làm gì cả, nên chưa thể làm sai.
 *   • Đàm đã gõ 4 ký tự rồi dừng       → anh đã bắt đầu, và đúng là còn thiếu.
 *
 * Gộp hai thứ đó lại nghĩa là: **mỗi lần Đàm mở app, thứ đầu tiên đập vào mắt là một dòng chữ đậm
 * màu cảnh báo nói rằng anh đang thiếu sót** — trên một ô nhập mà anh còn chưa chạm vào. Thông tin
 * thì đúng (phiên có bắt buộc mục tiêu), nhưng GIỌNG thì sai, và nó sai ở đúng màn hình anh mở
 * nhiều nhất trong ngày.
 *
 * Đặt luật ở một hàm thuần thay vì ba chuỗi ternary rải trong `PomodoroEngine.jsx` (~2.400 dòng)
 * còn có hai cái lợi nữa: (a) hai khối giao diện — thẻ "Chuẩn bị phiên" gọn và mục "Mục tiêu phiên"
 * mở rộng — nay KHÔNG THỂ lệch nhau nữa, vì cùng đọc một nguồn; (b) khoá lại được bằng test, và
 * điều đáng khoá nhất chính là **`empty` và `partial` KHÔNG được cùng một tông** — đó là bản chất
 * của lỗi, còn chữ nghĩa thì chỉnh lúc nào cũng được.
 *
 * ⚠️ KHÔNG làm nhẹ đi thông tin: dòng chữ ở trạng thái `empty` vẫn nói rõ "từ 10 ký tự là bắt đầu
 * được", và nút Bắt đầu vẫn bị vô hiệu hoá kèm nhãn "Cần điền mục tiêu phiên". Thay đổi ở đây là
 * GIỌNG và MÀU, không phải luật.
 */

/** Số ký tự tối thiểu để một mục tiêu phiên được coi là đủ rõ. */
export const SESSION_GOAL_MIN_CHARS = 10;

/** Ba tông hiển thị. Component tự dịch sang class theo theme — file này không biết CSS. */
export const GOAL_TONE = Object.freeze({
  neutral: 'neutral',   // chưa gõ gì: chỉ dẫn, KHÔNG cảnh báo
  warn:    'warn',      // đã gõ nhưng chưa đủ: nhắc
  good:    'good',      // đủ rồi
});

/**
 * @param {string} rawText  nội dung ô mục tiêu (chưa trim)
 * @param {number} minChars ngưỡng tối thiểu
 * @returns {{text:string, charCount:number, remaining:number, isReady:boolean,
 *            phase:'empty'|'partial'|'ready', tone:string, progressPct:number, badgeLabel:string}}
 */
export function deriveSessionGoalState(rawText, minChars = SESSION_GOAL_MIN_CHARS) {
  const text = typeof rawText === 'string' ? rawText.trim() : '';
  const charCount = text.length;
  const limit = Number.isFinite(minChars) && minChars > 0 ? minChars : SESSION_GOAL_MIN_CHARS;
  const isReady = charCount >= limit;
  const remaining = Math.max(limit - charCount, 0);
  const phase = charCount === 0 ? 'empty' : isReady ? 'ready' : 'partial';

  return {
    text,
    charCount,
    remaining,
    isReady,
    phase,
    tone: phase === 'empty' ? GOAL_TONE.neutral : phase === 'ready' ? GOAL_TONE.good : GOAL_TONE.warn,
    progressPct: Math.min((charCount / limit) * 100, 100),
    badgeLabel: phase === 'empty'
      // "Chưa đặt" mô tả sự việc; "Thiếu" quy kết một khiếm khuyết. Ở ô chưa ai chạm vào thì chỉ
      // vế đầu là đúng sự thật.
      ? 'Chưa đặt mục tiêu'
      : phase === 'ready'
        ? 'Sẵn sàng bắt đầu'
        : `Thiếu ${remaining} ký tự`,
  };
}

/**
 * Câu gợi ý dưới ô nhập.
 *
 * @param {ReturnType<typeof deriveSessionGoalState>} state
 * @param {'compact'|'expanded'} variant  thẻ "Chuẩn bị phiên" gọn, hay mục "Mục tiêu phiên" mở rộng.
 *   Hai bản chỉ khác nhau ở câu lúc ĐÃ ĐỦ: bản mở rộng nằm xa nút Bắt đầu nên phải chỉ đường
 *   ngược lên trên; bản gọn thì nút ngay đó.
 */
export function sessionGoalHint(state, variant = 'compact', minChars = SESSION_GOAL_MIN_CHARS) {
  if (!state || state.phase === 'empty') {
    return `Phiên này bạn định chốt xong việc gì? Viết một dòng từ ${minChars} ký tự là bắt đầu được.`;
  }
  if (state.phase === 'partial') {
    return `Còn ${state.remaining} ký tự nữa là bắt đầu được.`;
  }
  return variant === 'expanded'
    ? 'Mục tiêu đã đủ rõ. Bạn có thể quay lên và bắt đầu phiên bất cứ lúc nào.'
    : 'Mục tiêu đã đủ rõ để mở phiên mới.';
}

/** Tối đa bao nhiêu mục tiêu cũ được gợi ý lại. Ba là vừa một hàng ở khung 390px. */
export const GOAL_SUGGESTION_LIMIT = 3;

/**
 * Những mục tiêu ĐÃ DÙNG gần đây, để bấm một cái là điền lại.
 *
 * ⚠️ VÌ SAO ĐÁNG CÓ. Nút Bắt đầu bị khoá cho tới khi gõ đủ `SESSION_GOAL_MIN_CHARS` ký tự — một
 * luật CÓ CHỦ ĐÍCH (mục tiêu làm phiên có nghĩa, có thưởng khi đạt, AI Coach đọc nó). Nhưng phần
 * lớn công việc của một người là LẶP LẠI: "Hoàn thành phần đang dở" hôm nay cũng đúng như hôm qua.
 * Bắt gõ lại 10 ký tự ấy mỗi phiên là ma sát đặt đúng vào hành động quan trọng nhất của cả app.
 * Hàm này KHÔNG nới luật — nó chỉ bỏ việc GÕ LẠI.
 *
 * ⚠️ Bỏ trùng có PHÂN BIỆT HOA-THƯỜNG và khoảng trắng thừa: "Viết báo cáo" và "viết  báo cáo" là
 * một việc, hiện thành hai chip thì vừa tốn chỗ vừa trông như app không nhớ gì.
 * ⚠️ Chỉ lấy mục tiêu ĐỦ DÀI: gợi ý một chuỗi mà bấm vào vẫn không mở được nút là một cái bẫy.
 *
 * THUẦN: không đọc store, không đụng `Date`, không DOM.
 *
 * @param {Array} history  lịch sử phiên, mới nhất đứng đầu
 * @param {number} [limit] số chip tối đa
 * @returns {string[]} mục tiêu gần đây nhất, đã bỏ trùng, giữ nguyên chữ gốc của lần dùng gần nhất
 */
export function pickRecentGoals(history, limit = GOAL_SUGGESTION_LIMIT) {
  // ⚠️ Chặn ở ĐẦU, không dựa vào phép `break` cuối vòng. Bản đầu viết `push` rồi mới kiểm
  // `out.length >= limit`, nên với `limit = 0` nó vẫn trả về MỘT chip — tức một nơi gọi muốn tắt
  // hẳn gợi ý lại nhận được đúng một cái. Bài test bắt được.
  const max = Math.max(0, Math.floor(Number(limit) || 0));
  if (max === 0) return [];

  const seen = new Set();
  const out = [];

  for (const entry of Array.isArray(history) ? history : []) {
    const goal = typeof entry?.goal === 'string' ? entry.goal.trim() : '';
    if (goal.length < SESSION_GOAL_MIN_CHARS) continue;

    const key = goal.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(goal);
    if (out.length >= max) break;
  }

  return out;
}
