# Pomodoro DC — Project Brief

## Người dùng
- Tên: Đàm (non-coder, dùng Codex + Claude Code để code)
- Giải thích đơn giản, tránh jargon kỹ thuật

## ⚠️ AI mới đọc trước
- **Đọc `HANDOVER.md`** (cùng thư mục) để nắm trạng thái hiện tại + việc đang dở.
- **Bàn giao chi tiết nằm ở thư mục memory**, KHÔNG nằm hết trong file này:
  `/Users/damduy/.claude/projects/-Users-damduy-Downloads-Claude-Code-B-n-sao-Pomodoro-Game---USING/memory/`
  (đặc biệt `upgrade-roadmap.md` cho AI Coach, `ui-review-2026-06.md` cho UI, `resonance-update.md` cho game loop).
- Luôn chạy `git status` tươi — đừng tin ảnh chụp git cũ.

## Nền tảng hiện tại
App chính chạy trên **web** tại `https://pomodoro-dc.vercel.app`.

- Web Vercel là bản đầy đủ, dùng trên iPhone và Mac.
- Electron vẫn được dùng như app phụ trên Mac để có biểu tượng menu bar/tray.
- Electron mở URL Vercel và đọc trạng thái timer từ Supabase, không phải bản app riêng tách logic.
- Localhost chỉ dùng cho dev/test, không phải luồng sử dụng hằng ngày.

## Tech Stack
- React + Vite + PWA
- State: Zustand + localStorage (key: `dc-pomodoro-v1`, vẫn đọc được key cũ `civjourney-v1`)
- Sync cloud: Supabase
- Hosting: Vercel (auto-deploy từ GitHub)

## Hạ tầng

| Thứ | Chi tiết |
|-----|----------|
| App URL | `https://pomodoro-dc.vercel.app` |
| Mac menu bar | Electron companion app |
| GitHub | `https://github.com/mrthanhduy2000/pomodoro-dc` |
| Supabase | `https://jcefdsdccmnmqvuwelmm.supabase.co` |
| Bảng DB | `game_state` (id, data JSONB, updated_at) |
| Timer tray sync | `timer_live` (id `singleton`) |

## Sync (đã hoàn chỉnh)
- `src/lib/supabase.js` — Supabase client
- `src/lib/syncService.js` — pull khi mở app, push debounced 5s
- `initSync()` gọi trong `App.jsx` useEffect đầu tiên

## AI Coach + tầng engine (mảng lớn nhất, KHÔNG được bỏ qua)
App có cả một hệ "huấn luyện viên" và engine game thuần. Đây là phần lớn nhất dự án.
- **3 tầng Coach tách biệt, người dùng tự bấm** (không có bộ tự chọn):
  - (a) *Hỏi Coach* — trả lời tức thì từ số liệu, KHÔNG cần mạng/API (`src/engine/qa/`, `coachIntel.js`). Cấm bịa số, cấm từ nhân-quả.
  - (b) *Coach offline* — AI thật chạy trên máy (WebLLM, chỉ desktop, opt-in) — `src/engine/llm/`.
  - (c) *Hỏi Claude* — gọi `api/coach.js` (Claude Haiku 4.5), CHỈ khi người dùng bấm. Mặc định KHÔNG bật vì chưa đặt `ANTHROPIC_API_KEY` → đừng tự đề xuất hướng trả phí.
- **Giọng Coach theo tính cách** strict/zen/buddy: `src/engine/coachVoice.js` + `src/hooks/useCoachVoice.js`, tính cách lưu ở `settingsStore.coachPersonality` (mặc định `zen`).
- **Engine game thuần** tách khỏi state: công thức ở `src/engine/gameMath.js` + `constants.js`, state ở `src/store/gameStore.js`. Sửa công thức → sửa ở engine, đừng nhồi vào store. Dữ liệu ngoài (Supabase/import) PHẢI đi qua `normalizePersistedGameState`.
- ⚠️ Điểm nóng: `completeFocusSession` trong `gameStore.js` rất dài (~760 dòng) — sửa cẩn thận, dễ sinh bug "dùng giá trị cũ".
- Luôn `npm test` trước khi commit (hiện 131 bài). Lưu ý: test này CHƯA bảo vệ `coachVoice.js`.

## Quy trình deploy
```
Sửa code → git add . && git commit -m "mô tả" && git push
→ Vercel tự deploy trong ~2 phút
→ Mọi thiết bị thấy bản mới
```
Hoặc bấm đúp file `/Users/damduy/Desktop/🚀 Deploy App.command`

## Việc chưa làm / đang dở
- [x] ~~Thông báo iPhone khi hết phiên~~ — ĐÃ làm xong & deploy (xem README mục Web Push + `api/push/`).
- [ ] Coach voice chưa nối vào sự kiện timer thật (phiên kết thúc/gián đoạn) → intent "remind" chưa kích hoạt.
- [ ] Backlog UI: full-screen iPhone (notch che), nút đóng Loot modal, gom typography, reduced-motion toàn app — xem `ui-review-2026-06.md` trong memory.

## KHÔNG làm những thứ này
- ❌ Không biến Electron thành app chính riêng biệt.
- ❌ Không dùng localhost / serve-dist.mjs / LaunchAgent làm luồng chạy chính.
- ❌ Không nhân đôi logic game giữa web và Electron. Logic chính nằm ở web app.
- ❌ KHÔNG start phiên focus trên dev/localhost — dev dùng chung Supabase row với production, sẽ ghi đè dữ liệu thật của Đàm.

## Lưu ý kỹ thuật
- `npm install` cần flag `--legacy-peer-deps`
- Electron còn liên quan tới menu bar Mac. Đừng xoá hoặc bỏ qua khi sửa timer/tray.
- `serve-dist.mjs` và LaunchAgent là luồng local cũ, chỉ đụng khi thật sự cần.
- ✅ **Coach một nguồn duy nhất:** engine giọng Coach chỉ nằm ở `src/engine/coachVoice.js`. `ai-coach-sim/ai-coach.mjs` đã được rút gọn thành re-export (`export * from "../src/engine/coachVoice.js"`) nên KHÔNG còn bản chép đôi. Muốn sửa câu/intent/tone → chỉ sửa `coachVoice.js`, đừng dán nội dung engine vào `ai-coach.mjs`. (Bản demo trình duyệt: `node ai-coach-sim/dev-server.mjs` phục vụ từ gốc dự án để nạp được `src/engine/`.)
