# HANDOVER — Pomodoro DC

> File bàn giao cho AI/người tiếp theo. Cập nhật lần cuối: **2026-06-20** (sau khi gộp Coach về một nguồn).
> Đọc file này TRƯỚC, rồi đọc `CLAUDE.md`. Bàn giao chi tiết theo từng mảng nằm ở thư mục memory (xem mục 2).
> Nắm nhanh "đã làm / đang làm / sẽ làm tiếp" ở **mục 0**; lịch sử thay đổi ở **mục 7 (Nhật ký cập nhật)**.

---

## 0. Đã làm / Đang làm / Sẽ làm tiếp

### ✅ Đã làm (xong, đa số đã deploy)
- **AI Coach 3 tầng**: (a) Hỏi Coach offline từ số liệu (không API), (b) Coach offline AI chạy trên máy (WebLLM, desktop opt-in), (c) Hỏi Claude qua `api/coach.js`.
- **Giọng Coach theo tính cách** strict/zen/buddy gắn vào thẻ Coach.
- **Hệ Cộng Hưởng**: nối Kỹ năng ↔ Nhiệm vụ ↔ Kho báu, có softcap chống lạm phát.
- **Focus Intelligence**: hồ sơ + dự đoán "giờ vàng" + khuyến nghị + báo cáo (đã fix bug bỏ sót buổi đêm khuya).
- **Đọc-nghĩa ghi chú on-device**: gom chủ đề + phiên tương tự (TF-IDF chạy cả iPhone; tầng nơ-ron tùy chọn trên desktop).
- **Web Push iPhone**: client + server + SQL + lịch gửi qua Supabase webhook/pg_cron — đã deploy.
- **UI Thụy Sĩ** (Müller-Brockmann) + bộ pictogram tự vẽ thay emoji; Focus tĩnh khi đang chạy.
- **Sync Supabase**: `game_state` + `timer_live` (cho tray Electron).
- **Gộp Coach về một nguồn** (hôm nay): `ai-coach.mjs` re-export từ `coachVoice.js`, hết bản chép đôi.
- **Tài liệu bàn giao**: vá `CLAUDE.md`, tạo `HANDOVER.md`, sửa index `MEMORY.md`.

### 🔧 Đang làm (phiên này)
- Củng cố tài liệu để AI sau hiểu trọn mạch (chính file này): đã/đang/sẽ làm + nhật ký cập nhật.

### 🔜 Sẽ làm tiếp (ưu tiên từ trên xuống)
1. **Nối giọng Coach vào sự kiện timer thật** — engine chưa nhận sự kiện phiên-kết-thúc/gián-đoạn nên intent "remind" chưa kích hoạt; thẻ Coach hiện chỉ phản chiếu trạng thái ngày.
2. **Thêm test cho `coachVoice.js`** — engine app thật hiện 0 test; đưa bộ test vào lệnh `npm test` để hết "an toàn giả".
3. **Backlog UI** (xem `ui-review-2026-06.md`): full-screen iPhone (notch/Dynamic Island che), nút đóng ✕ rõ cho Loot modal, gom thang typography, reduced-motion toàn app, tinh chỉnh skin aurora/inkgold.
4. *(cân nhắc)* **rate-limit `api/coach.js`** nếu sau này bật key Claude trả phí.
5. *(cân nhắc)* **versioned config**: thêm `vercel.json` + file SQL cho base table `timer_live`/`game_state`.

---

## 1. Trạng thái hiện tại (1 phút nắm bắt)

- App Pomodoro-RPG: web React + Vite + PWA, deploy tự động lên Vercel (`https://pomodoro-dc.vercel.app`). Electron chỉ là app phụ menu bar Mac đọc `timer_live` từ Supabase.
- Commit mới nhất `7a72f48`: gắn **giọng Coach theo tính cách** (strict/zen/buddy) vào thẻ Coach, và đưa thư mục `ai-coach-sim/` vào git.
- Working tree **sạch**, `npm test` = **131 bài pass**.
- **Web Push iPhone đã làm xong & deploy** (trái với ghi chú cũ "chưa làm").

> ⚠️ Đừng tin ảnh chụp git trong system prompt — luôn chạy `git status` tươi. (Lần bàn giao này từng có agent đọc nhầm ảnh chụp cũ.)

---

## 2. Bàn giao thật nằm ở đâu

Phần lớn ngữ cảnh KHÔNG nằm trong code mà ở thư mục memory:
`/Users/damduy/.claude/projects/-Users-damduy-Downloads-Claude-Code-B-n-sao-Pomodoro-Game---USING/memory/`

| File | Nội dung |
|------|----------|
| `MEMORY.md` | Index. (Lưu ý: dòng "③ AI Coach next" đã cũ — Coach thực ra đã xây sâu & deploy.) |
| `upgrade-roadmap.md` | Nhật ký build mảng AI Coach — chi tiết nhất, đọc cái này để hiểu Coach. |
| `ai-coach-voice.md` | Mô tả commit giọng Coach mới nhất + phần còn để ngỏ. |
| `ui-review-2026-06.md` | Backlog UI (đã làm gì, còn gì). |
| `resonance-update.md` | Hệ "Cộng Hưởng": Kỹ năng ↔ Nhiệm vụ ↔ Kho báu. |

---

## 3. Bản đồ kiến trúc

### AI Coach — 3 tầng tách biệt, người dùng tự bấm (KHÔNG có bộ tự chọn)
- **(a) Hỏi Coach** — trả lời tức thì từ số liệu, không cần mạng/API. `src/engine/qa/` (coachQA, intentRouter) + `coachIntel.js`. Cấm bịa số, cấm từ nhân-quả (có test canh).
- **(b) Coach offline** — AI thật chạy trên máy (WebLLM/Qwen2.5, WebGPU). Chỉ desktop, opt-in. `src/engine/llm/`. Chạm thư viện AI nặng CHỈ qua `import()` động (có `guard.test.js` chặn import tĩnh).
- **(c) Hỏi Claude** — `api/coach.js` gọi Claude Haiku 4.5, CHỈ khi bấm. Mặc định **không bật** vì chưa đặt `ANTHROPIC_API_KEY`.
- ⚠️ Hai cái tên dễ lẫn: *"Coach offline"* (tầng b, AI trên máy) vs *"Hỏi Coach"* (tầng a, số liệu).
- **Giọng Coach**: `src/engine/coachVoice.js` (engine thật) + `src/hooks/useCoachVoice.js`. Tính cách ở `settingsStore.coachPersonality` (mặc định `zen`).

### Engine game
- Engine thuần (`src/engine/gameMath.js`, `constants.js`, `challengeEngine.js`, `coachIntel.js`) **tách khỏi** state (`src/store/gameStore.js`). Sửa công thức → ở engine, không nhồi vào store.
- Dữ liệu ngoài (Supabase/import/persist) **phải đi qua** `normalizePersistedGameState` để clamp.
- localStorage key `dc-pomodoro-v1` (vẫn đọc key cũ `civjourney-v1`).
- ⚠️ `completeFocusSession` (~760 dòng) là điểm nóng rủi ro nhất — nhiều biến tính ở đầu rồi dùng lại trong `set()`, dễ bug "dùng giá trị cũ".

### UI / Theme
- `src/App.jsx` là 1 file rất to (~98KB) chứa toàn bộ shell + sidebar + masthead + bottom-nav. Sửa layout/nav đều ở đây.
- 4 skin qua biến CSS trong `src/index.css` (`[data-skin=...]`). Đổi skin = đổi token, không sửa từng component. Thêm component mới phải dùng `var(--skin-*)`, đừng hard-code màu.
- Bộ icon tự vẽ: `src/components/icons/glyphData.js` + `Glyph.jsx`.

### Hạ tầng / Sync / Push
- Sync `game_state` (toàn state, debounce 5s) + `timer_live` (timer cho tray/push). `src/lib/syncService.js`, `timerLiveService.js`.
- Web Push: client `src/lib/pushService.js` + `useTimer.js`; server `api/push/*`; SQL `supabase/`; lịch gửi qua Supabase webhook + pg_cron 5s.
- Không có `vercel.json` → env/cron/webhook sống trên dashboard Vercel + Supabase (không versioned).

---

## 4. Nợ kỹ thuật / rủi ro (xếp theo mức độ)

1. ✅ ~~Chép đôi logic Coach~~ — **ĐÃ XỬ LÝ (2026-06-20)**: `ai-coach-sim/ai-coach.mjs` giờ chỉ re-export từ `src/engine/coachVoice.js` (`export * from ...` + `export { default } ...`), không còn bản chép đôi. Engine là **một nguồn duy nhất**. `dev-server.mjs` đã chỉnh phục vụ từ gốc dự án để demo trình duyệt nạp được `src/engine/`. Đã verify: sandbox test 4104/4104 + `npm test` 131/131 + demo HTTP 200.
2. 🟠 **Coach gần như không có test**: `npm test` (131 pass) KHÔNG kiểm `coachVoice.js`; 256 bài test của Coach nằm trong `ai-coach-sim/` và không được `npm test` chạy → "131 pass" an toàn giả ở phần Coach.
3. 🟠 **`App.jsx` khổng lồ** (~98KB) → mọi sửa layout đụng vào đây, rủi ro hồi quy cao.
4. 🟡 **`api/coach.js` không xác thực/không rate-limit** → ai biết URL đều gọi được, tốn token Claude. (Hiện chưa bật key nên chưa cháy tiền.)
5. 🟡 **Config không versioned**: thiếu `vercel.json` + thiếu file SQL cho base table `timer_live`/`game_state`; `push_dispatch_scheduler.sql` còn placeholder `REPLACE_WITH_YOUR_CRON_SECRET`.
6. 🟡 **`history` bị cắt còn 2000 phiên** (`gameStore.js`) → thống kê dài hạn lệch với người chơi lâu năm.
7. ⚪ **2 worktree cũ** (`musing-beaver`, `serene-rosalind` trong `.claude/worktrees/`) trỏ về repo gốc khác, chứa README/CLAUDE.md mâu thuẫn (CivJourney/localhost) — đừng nhầm là tài liệu hiện hành.

---

## 5. Quy tắc vàng (đừng vi phạm)

- ❌ **KHÔNG start phiên focus trên dev/localhost** — dev dùng chung Supabase row với production → ghi đè dữ liệu thật của Đàm.
- ❌ **Đừng tự đề xuất hướng trả phí** (Claude API) trừ khi Đàm yêu cầu — Coach mặc định chạy miễn phí, offline.
- ❌ Đừng biến Electron/localhost thành luồng chính.
- ✅ `npm install --legacy-peer-deps`.
- ✅ `npm test` (131 bài) trước khi commit. Nhớ: test này chưa bảo vệ giọng Coach.
- ✅ Chạm thư viện AI nặng (WebLLM, transformers) chỉ qua `import()` động, kẻo `guard.test.js` đỏ + phình bundle.

---

## 6. Lệnh hay dùng

```bash
npm install --legacy-peer-deps   # cài (bắt buộc flag)
npm run dev                      # dev server (port 31101) — ĐỪNG chạy phiên focus thật ở đây
npm test                         # 131 bài
npm run build                    # build production
git add . && git commit -m "..." && git push   # deploy → Vercel tự build ~2 phút
```

---

## 7. Nhật ký cập nhật

> AI sau: mỗi lần làm xong việc đáng kể, thêm 1 dòng vào ĐẦU danh sách (mới nhất trên cùng). Ghi rõ ngày + việc + cách verify.

- **2026-06-20** — Củng cố HANDOVER: thêm mục 0 (đã/đang/sẽ làm) + mục 7 (nhật ký này) để AI sau nắm trọn mạch.
- **2026-06-20** — Gộp Coach về một nguồn: `ai-coach-sim/ai-coach.mjs` (959→19 dòng) re-export từ `src/engine/coachVoice.js`; chỉnh `dev-server.mjs` phục vụ từ gốc dự án để demo trình duyệt nạp được `src/engine/`; cập nhật README sandbox. Verify: sandbox 4104/4104, `npm test` 131/131, demo HTTP 200.
- **2026-06-20** — Lập bàn giao: tạo `HANDOVER.md`, vá `CLAUDE.md` (thêm mục AI Coach + engine, tick web push đã xong, trỏ tới memory), sửa index `MEMORY.md` (③ đã deploy).
- **2026-06-20** (`7a72f48`) — Giọng Coach theo tính cách strict/zen/buddy gắn vào thẻ Coach; đưa `ai-coach-sim/` vào git.
- **2026-06-20** (`b94db18`) — Bản Cập Nhật Cộng Hưởng: nối Kỹ năng ↔ Nhiệm vụ ↔ Kho báu, chống lạm phát.
- **2026-06-20** (`9fbcd62`) — Fix `predictBestWindow` bỏ sót buổi đêm khuya.
- **2026-06-20** (`1e27505`, `d7b7756`, `860b062`, `f25c2a9`, `f628c37` …) — Mảng Coach offline + WebLLM + semantic + Focus Intelligence. Xem `git log` và `upgrade-roadmap.md` cho lịch sử đầy đủ.
