/*
  ===================================================================
  ===== Agent 19: Test Phủ Luật  +  Agent 20: Naturalness Review =====
  Sinh hơn 50 tổ hợp Context, chạy qua generateCoachMessage, kiểm tra
  mọi output đều hợp lệ và tự nhiên, lập bảng kết quả, đo tỉ lệ lặp, và
  in demo 5 ngữ cảnh x 3 tính cách.

  Chạy:  node ai-coach.test.mjs
  ===================================================================
*/
import {
  generateCoachMessage,
  createCoachMemory,
  scoreContext,
  selectIntent,
} from "./ai-coach.mjs";

const INTENTS = ["encourage", "acknowledge", "remind", "relax"];
const PERSONALITIES = ["strict", "zen", "buddy"];

/* ---- Sinh tập tổ hợp Context (Agent 19) ---- */
function buildContexts() {
  const list = [];
  const push = (c) => list.push(c);

  // 1. Bắt đầu phiên ở mỗi buổi trong ngày
  for (const t of ["morning", "noon", "afternoon", "evening", "night"]) {
    push({ phase: "focus", event: "session_start", sessions_today: 0, interruptions: 0, time_of_day: t, streak_days: 3, total_focus_minutes: 0 });
  }
  // 2. Bắt đầu phiên giữa chuỗi, momentum tăng dần
  for (const s of [1, 2, 4, 6]) {
    push({ phase: "focus", event: "session_start", sessions_today: s, interruptions: 0, time_of_day: "morning", streak_days: s + 2, total_focus_minutes: s * 25 });
  }
  // 3. Kết thúc phiên sạch (acknowledge), nhiều mốc khác nhau
  for (const s of [1, 2, 3, 5, 8]) {
    push({ phase: "focus", event: "session_end", sessions_today: s, interruptions: 0, time_of_day: "afternoon", streak_days: s, total_focus_minutes: s * 25 });
  }
  // 4. Kết thúc phiên nhưng gián đoạn ít (vẫn acknowledge)
  for (const i of [1, 2]) {
    push({ phase: "focus", event: "session_end", sessions_today: 2, interruptions: i, time_of_day: "noon", streak_days: 4, total_focus_minutes: 60 });
  }
  // 5. Kết thúc phiên gián đoạn nhiều (chuyển remind)
  for (const i of [3, 4, 5]) {
    push({ phase: "focus", event: "session_end", sessions_today: 3, interruptions: i, time_of_day: "afternoon", streak_days: 2, total_focus_minutes: 75 });
  }
  // 6. Đang bị gián đoạn giữa phiên
  for (const i of [1, 2, 3, 5]) {
    push({ phase: "focus", event: "interrupted", sessions_today: 2, interruptions: i, time_of_day: "morning", streak_days: 5, total_focus_minutes: 50 });
  }
  // 7. Nghỉ ngắn
  for (const t of ["morning", "afternoon", "evening"]) {
    push({ phase: "short_break", event: "session_end", sessions_today: 3, interruptions: 0, time_of_day: t, streak_days: 6, total_focus_minutes: 75 });
  }
  // 8. Nghỉ dài
  for (const t of ["noon", "evening", "night"]) {
    push({ phase: "long_break", event: "session_end", sessions_today: 4, interruptions: 0, time_of_day: t, streak_days: 7, total_focus_minutes: 100 });
  }
  // 9. Edge: phiên đầu của người mới
  push({ phase: "focus", event: "session_start", sessions_today: 0, interruptions: 0, time_of_day: "morning", streak_days: 0, total_focus_minutes: 0 });
  push({ phase: "focus", event: "session_start", sessions_today: 1, interruptions: 0, time_of_day: "noon", streak_days: 0, total_focus_minutes: 20 });
  // 10. Edge: chuỗi vừa đứt (từng làm nhiều)
  push({ phase: "focus", event: "session_start", sessions_today: 0, interruptions: 0, time_of_day: "morning", streak_days: 0, total_focus_minutes: 300 });
  push({ phase: "focus", event: "session_start", sessions_today: 0, interruptions: 0, time_of_day: "afternoon", streak_days: 0, total_focus_minutes: 480 });
  // 11. Edge: làm khuya nhiều phiên
  push({ phase: "focus", event: "session_start", sessions_today: 5, interruptions: 1, time_of_day: "night", streak_days: 4, total_focus_minutes: 150 });
  push({ phase: "focus", event: "session_end", sessions_today: 6, interruptions: 0, time_of_day: "night", streak_days: 9, total_focus_minutes: 180 });
  // 12. Edge: gián đoạn liên tục (nhiều phiên interruptions cao)
  push({ phase: "focus", event: "interrupted", sessions_today: 4, interruptions: 4, time_of_day: "afternoon", streak_days: 1, total_focus_minutes: 90 });
  // 13. Edge: vào mạch sâu
  push({ phase: "focus", event: "session_end", sessions_today: 4, interruptions: 0, time_of_day: "morning", streak_days: 10, total_focus_minutes: 100 });
  push({ phase: "focus", event: "session_end", sessions_today: 7, interruptions: 0, time_of_day: "afternoon", streak_days: 12, total_focus_minutes: 175 });
  // 14. Chuỗi rất dài, tổng giờ lớn
  push({ phase: "focus", event: "session_start", sessions_today: 2, interruptions: 0, time_of_day: "morning", streak_days: 30, total_focus_minutes: 95 });
  push({ phase: "focus", event: "session_end", sessions_today: 3, interruptions: 0, time_of_day: "evening", streak_days: 21, total_focus_minutes: 145 });
  // 15. Số phút lẻ để kiểm tra định dạng giờ phút
  push({ phase: "focus", event: "session_end", sessions_today: 2, interruptions: 0, time_of_day: "noon", streak_days: 1, total_focus_minutes: 90 });
  push({ phase: "focus", event: "session_end", sessions_today: 3, interruptions: 0, time_of_day: "noon", streak_days: 1, total_focus_minutes: 125 });
  push({ phase: "focus", event: "session_end", sessions_today: 1, interruptions: 0, time_of_day: "noon", streak_days: 1, total_focus_minutes: 45 });

  // 16. Bắt đầu phiên ở mỗi buổi với chuỗi dài (momentum mạnh)
  for (const t of ["morning", "noon", "afternoon", "evening"]) {
    push({ phase: "focus", event: "session_start", sessions_today: 3, interruptions: 0, time_of_day: t, streak_days: 14, total_focus_minutes: 120 });
  }
  // 17. Nghỉ ngắn sau khi gián đoạn ít
  push({ phase: "short_break", event: "session_end", sessions_today: 2, interruptions: 2, time_of_day: "morning", streak_days: 3, total_focus_minutes: 50 });
  push({ phase: "short_break", event: "session_end", sessions_today: 5, interruptions: 0, time_of_day: "noon", streak_days: 8, total_focus_minutes: 125 });
  // 18. Nghỉ dài ban ngày, chưa quá 4 phiên (không dính edge late_night)
  push({ phase: "long_break", event: "session_end", sessions_today: 3, interruptions: 0, time_of_day: "morning", streak_days: 5, total_focus_minutes: 75 });
  push({ phase: "long_break", event: "session_end", sessions_today: 2, interruptions: 1, time_of_day: "afternoon", streak_days: 4, total_focus_minutes: 60 });
  // 19. Khuya nhưng mới 1-2 phiên (không dính late_night, vẫn focus)
  push({ phase: "focus", event: "session_start", sessions_today: 1, interruptions: 0, time_of_day: "night", streak_days: 2, total_focus_minutes: 25 });
  push({ phase: "focus", event: "session_end", sessions_today: 2, interruptions: 0, time_of_day: "night", streak_days: 2, total_focus_minutes: 50 });
  // 20. Tối muộn, kết thúc phiên, gián đoạn nhẹ
  push({ phase: "focus", event: "session_end", sessions_today: 3, interruptions: 1, time_of_day: "evening", streak_days: 6, total_focus_minutes: 80 });
  // 21. Tổng giờ rất lớn -> định dạng nhiều giờ
  push({ phase: "focus", event: "session_end", sessions_today: 8, interruptions: 0, time_of_day: "afternoon", streak_days: 15, total_focus_minutes: 605 });
  // 22. Gián đoạn cực nhiều giữa phiên
  push({ phase: "focus", event: "interrupted", sessions_today: 1, interruptions: 6, time_of_day: "noon", streak_days: 0, total_focus_minutes: 20 });
  // 23. Bắt đầu lại sau khi từng làm rất nhiều (streak về 0, giờ buổi tối)
  push({ phase: "focus", event: "session_start", sessions_today: 0, interruptions: 0, time_of_day: "evening", streak_days: 0, total_focus_minutes: 600 });

  return list;
}

/* ---- Kiểm tra một CoachOutput hợp lệ (Agent 19) + tự nhiên (Agent 20) ---- */
function checkOutput(out) {
  const problems = [];
  if (!out || typeof out !== "object") return ["output không phải object"];
  if (typeof out.message !== "string" || out.message.trim().length < 3) problems.push("message rỗng hoặc quá ngắn");
  if (!INTENTS.includes(out.intent)) problems.push("intent không hợp lệ: " + out.intent);
  if (typeof out.tone !== "string" || !out.tone.trim()) problems.push("tone rỗng");

  const m = out.message || "";
  if (/undefined|null|NaN/.test(m)) problems.push("lộ undefined/null/NaN");
  if (/\{[a-z_]+\}/i.test(m)) problems.push("còn placeholder chưa điền");
  if (/\s{2,}/.test(m)) problems.push("có khoảng trắng đôi");
  if (/[–—]/.test(m)) problems.push("có dấu gạch ngang dài");
  if (/\s[,.!?;:]/.test(m)) problems.push("khoảng trắng trước dấu câu");
  if (!/[.!?…]$|[.!?…]\s*[\p{Emoji}]$/u.test(m.trim())) problems.push("không kết thúc bằng dấu câu");

  // Lặp đơn vị
  if (/(phiên\s+phiên|ngày\s+ngày|phút\s+phút|giờ\s+giờ)/i.test(m)) problems.push("lặp đơn vị");

  // Dưới 2 câu: đếm dấu kết câu (cho phép tối đa 2)
  const sentences = (m.match(/[.!?…]+/g) || []).length;
  if (sentences > 2) problems.push("nhiều hơn 2 câu (" + sentences + ")");

  // remind không được có từ phán xét / tiêu cực
  if (out.intent === "remind") {
    const bad = ["lười", "kém", "tệ", "thất bại", "vô dụng", "dở hơi", "ngu"];
    for (const w of bad) if (m.toLowerCase().includes(w)) problems.push("remind có từ tiêu cực: " + w);
  }
  return problems;
}

/* ---- 1. Chạy phủ luật trên toàn bộ tổ hợp ----
   Mỗi tổ hợp chạy REPS lần để tập hết các nhánh ngẫu nhiên của tầng nhuốm
   giọng và tự nhiên hóa (mở đầu, tiểu từ, emoji), bảo đảm không nhánh nào
   sinh câu lỗi. */
const REPS = 24;
function runCoverage() {
  const contexts = buildContexts();
  const rows = [];
  let total = 0, failed = 0;
  const allProblems = [];

  for (let ci = 0; ci < contexts.length; ci++) {
    const ctx = contexts[ci];
    const row = { idx: ci + 1, ctx, byPers: {} };
    for (const p of PERSONALITIES) {
      for (let r = 0; r < REPS; r++) {
        const mem = createCoachMemory();
        const out = generateCoachMessage(ctx, p, mem);
        total++;
        const problems = checkOutput(out);
        if (problems.length) {
          failed++;
          allProblems.push({ idx: ci + 1, p, problems, message: out && out.message });
        }
        if (r === 0) row.byPers[p] = out;
      }
    }
    rows.push(row);
  }
  return { contexts, rows, total, failed, allProblems };
}

/* ---- 2. Kiểm thử áp lực chống lặp (Agent 17) ---- */
function runRepeatTest() {
  const ctx = { phase: "focus", event: "session_start", sessions_today: 2, interruptions: 0, time_of_day: "morning", streak_days: 5, total_focus_minutes: 50 };
  const results = {};
  for (const p of PERSONALITIES) {
    const mem = createCoachMemory();
    const seen = [];
    let immediateRepeats = 0;
    for (let i = 0; i < 40; i++) {
      const out = generateCoachMessage(ctx, p, mem);
      if (i > 0 && out.message === seen[seen.length - 1]) immediateRepeats++;
      seen.push(out.message);
    }
    const unique = new Set(seen).size;
    results[p] = { calls: 40, unique, immediateRepeats };
  }
  return results;
}

/* ---- 3. In bảng kết quả phủ luật ---- */
function fmtCtx(c) {
  return `${c.phase}/${c.event} s=${c.sessions_today} i=${c.interruptions} ${c.time_of_day} streak=${c.streak_days} min=${c.total_focus_minutes}`;
}

function printCoverage(cov) {
  console.log("\n================ AGENT 19: BẢNG PHỦ LUẬT ================");
  console.log(`Tổng ngữ cảnh: ${cov.contexts.length}  |  Mỗi tổ hợp chạy ${REPS} lần x 3 tính cách  |  Tổng lượt sinh: ${cov.total}`);
  console.log(`Hợp lệ: ${cov.total - cov.failed}  |  Lỗi: ${cov.failed}\n`);

  console.log("STT | NGỮ CẢNH -> INTENT (strict|zen|buddy)");
  for (const r of cov.rows) {
    const intents = PERSONALITIES.map((p) => r.byPers[p].intent);
    const sameIntent = new Set(intents).size === 1 ? intents[0] : intents.join("|");
    console.log(String(r.idx).padStart(3) + " | " + fmtCtx(r.ctx).padEnd(62) + " -> " + sameIntent);
  }

  if (cov.allProblems.length) {
    console.log("\n--- CÁC LỖI PHÁT HIỆN ---");
    for (const pr of cov.allProblems) {
      console.log(`#${pr.idx} [${pr.p}] ${pr.problems.join("; ")}  | "${pr.message}"`);
    }
  } else {
    console.log("\nKHÔNG CÓ LỖI: mọi tổ hợp đều trả về CoachOutput hợp lệ và tự nhiên.");
  }
}

/* ---- 4. In kết quả chống lặp ---- */
function printRepeat(rep) {
  console.log("\n================ AGENT 17: CHỐNG LẶP (40 lượt/giọng) ================");
  for (const p of PERSONALITIES) {
    const r = rep[p];
    console.log(`${p.padEnd(7)}: ${r.unique} câu khác nhau / ${r.calls} lượt, lặp liền kề: ${r.immediateRepeats}`);
  }
}

/* ---- 5. Demo 5 ngữ cảnh x 3 tính cách ---- */
function printDemo() {
  console.log("\n================ DEMO: 5 NGỮ CẢNH x 3 TÍNH CÁCH ================");
  const demos = [
    { ten: "Bắt đầu ngày mới, đã có chuỗi 5 ngày", ctx: { phase: "focus", event: "session_start", sessions_today: 0, interruptions: 0, time_of_day: "morning", streak_days: 5, total_focus_minutes: 0 } },
    { ten: "Vừa xong phiên thứ 4 liền mạch, không gián đoạn", ctx: { phase: "focus", event: "session_end", sessions_today: 4, interruptions: 0, time_of_day: "afternoon", streak_days: 8, total_focus_minutes: 100 } },
    { ten: "Đang bị gián đoạn lần thứ 4 trong phiên", ctx: { phase: "focus", event: "interrupted", sessions_today: 3, interruptions: 4, time_of_day: "afternoon", streak_days: 2, total_focus_minutes: 80 } },
    { ten: "Giờ nghỉ dài buổi tối", ctx: { phase: "long_break", event: "session_end", sessions_today: 4, interruptions: 0, time_of_day: "evening", streak_days: 6, total_focus_minutes: 110 } },
    { ten: "Làm việc khuya, đã 5 phiên", ctx: { phase: "focus", event: "session_start", sessions_today: 5, interruptions: 1, time_of_day: "night", streak_days: 4, total_focus_minutes: 150 } },
  ];

  for (const d of demos) {
    console.log("\n• " + d.ten);
    console.log("  [" + fmtCtx(d.ctx) + "]");
    const score = scoreContext(d.ctx);
    console.log(`  score: energy=${score.energy_level} momentum=${score.momentum} struggle=${score.struggle_score} fatigue=${score.fatigue}`);
    for (const p of PERSONALITIES) {
      const mem = createCoachMemory();
      const out = generateCoachMessage(d.ctx, p, mem);
      console.log(`   - ${p.padEnd(6)} (${out.intent}/${out.tone}): ${out.message}`);
    }
  }
}

/* ---- Chạy tất cả ---- */
const cov = runCoverage();
printCoverage(cov);
printRepeat(runRepeatTest());
printDemo();

console.log("\n================ KẾT LUẬN ================");
console.log(cov.failed === 0
  ? `PASS: ${cov.total}/${cov.total} lượt sinh hợp lệ trên ${cov.contexts.length} ngữ cảnh.`
  : `FAIL: ${cov.failed}/${cov.total} lượt có vấn đề, xem chi tiết ở trên.`);
