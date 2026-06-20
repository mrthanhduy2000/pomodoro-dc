# AI Coach Pomodoro (giả lập LLM)

Một coach trò chuyện cho app Pomodoro, mô phỏng một trợ lý AI thông minh mà **không gọi API nào cả**. Bên trong là rule engine + kho câu + template + chấm điểm ngữ cảnh. Viết bằng JavaScript thuần, không thư viện ngoài, không dùng localStorage hay sessionStorage.

> ⚠️ **Nguồn duy nhất:** engine thật sống ở `src/engine/coachVoice.js` của app. File `ai-coach.mjs` ở đây chỉ **re-export** từ đó (không còn bản chép đôi). Muốn sửa câu/intent/tone → sửa `src/engine/coachVoice.js`, ĐỪNG dán lại nội dung vào `ai-coach.mjs`.

## Cách chạy

- Kiểm thử và xem demo trong terminal:
  ```
  node ai-coach.test.mjs
  ```
- Xem demo trong trình duyệt: mở `index.html` qua một máy chủ tĩnh.
  Có sẵn `dev-server.mjs` cho tiện: `node dev-server.mjs` rồi mở `http://localhost:8137`.
  (`dev-server.mjs` chỉ để xem demo, không liên quan logic coach.)

## Dùng trong code

```js
import { generateCoachMessage, createCoachMemory } from "./ai-coach.mjs";

const memory = createCoachMemory(); // giữ lại để chống lặp giữa các lần gọi

const out = generateCoachMessage(
  { phase: "focus", event: "session_end", sessions_today: 4,
    interruptions: 0, time_of_day: "afternoon", streak_days: 8,
    total_focus_minutes: 100 },
  "buddy",   // "strict" | "zen" | "buddy"
  memory
);
// out = { message, intent, tone }
```

## Interface contract

- Context: `{ phase, event, sessions_today, interruptions, time_of_day, streak_days, total_focus_minutes }`
- Intent: `"encourage" | "acknowledge" | "remind" | "relax"`
- Personality: `"strict" | "zen" | "buddy"`
- Score: `{ energy_level, momentum, struggle_score, fatigue }` (0-100)
- CoachOutput: `{ message, intent, tone }`
- Hàm chính: `scoreContext`, `selectIntent`, `pickTemplate`, `fillTemplate`, `applyTone`, `generateCoachMessage`

## Bản đồ 20 tầng (agent) trong `src/engine/coachVoice.js`

Tầng sinh ngôn ngữ (NLG)
1. Template Engine: `fillTemplate` (điền biến, lo đơn vị tiếng Việt thông minh)
2. Variation System: `pickTemplate` (ưu tiên câu chưa dùng, reset thông minh)
3. Tone Modulator: `applyTone` (nhuốm giọng theo tính cách)
4. Synonym & Filler Bank: `SYNONYMS`, `pickSyn`
5. Sentence Assembler: `assembleSentence`, `tidy`
6. Naturalizer: `naturalize` (chất người, tiết chế)

Tầng bộ luật và quyết định
7. Context Scorer: `scoreContext`
8. Intent Selector: `selectIntent`
9. Rule Base Focus: `focusRules`
10. Rule Base Break: `breakRules`
11. Edge Case Handler: `detectEdgeCase`, `EDGE_CASES`

Tầng kho nội dung
12. Encourage: `CONTENT.encourage`
13. Acknowledge: `CONTENT.acknowledge`
14. Remind: `CONTENT.remind`
15. Relax: `CONTENT.relax`

Tầng trí nhớ và ngữ cảnh
16. Session Memory: `recordSession`, `getSessionHistory`
17. Anti-Repeat Tracker: `createCoachMemory`, `markUsed`, `isRecentlyUsed`
18. Pattern Detector: `detectPatterns`

Tầng QA và tinh chỉnh (ở `ai-coach.test.mjs`)
19. Test Phủ Luật: `ai-coach.test.mjs`
20. Naturalness Review: đã soát tự nhiên hoá, sửa 6 lỗi mẫu (lộ đơn vị tiếng Việt, viết hoa sau số, vượt 2 câu, chồng tiểu từ, edge-case cướp intent nghỉ, điền số vô lý)

## Kết quả kiểm thử

57 ngữ cảnh, mỗi cái chạy 24 lần cho 3 tính cách: **4104/4104 lượt hợp lệ và tự nhiên**, không lượt nào rỗng hay lỗi.
