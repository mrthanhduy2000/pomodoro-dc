# Pomodoro DC — Project Brief

## Người dùng
- Tên: Đàm (non-coder, dùng Codex + Claude Code để code)
- Giải thích đơn giản, tránh jargon kỹ thuật

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

## Quy trình deploy
```
Sửa code → git add . && git commit -m "mô tả" && git push
→ Vercel tự deploy trong ~2 phút
→ Mọi thiết bị thấy bản mới
```
Hoặc bấm đúp file `/Users/damduy/Desktop/🚀 Deploy App.command`

## Việc chưa làm
- [ ] Thông báo iPhone khi hết phiên (web push notification)

## KHÔNG làm những thứ này
- ❌ Không biến Electron thành app chính riêng biệt.
- ❌ Không dùng localhost / serve-dist.mjs / LaunchAgent làm luồng chạy chính.
- ❌ Không nhân đôi logic game giữa web và Electron. Logic chính nằm ở web app.

## Lưu ý kỹ thuật
- `npm install` cần flag `--legacy-peer-deps`
- Electron còn liên quan tới menu bar Mac. Đừng xoá hoặc bỏ qua khi sửa timer/tray.
- `serve-dist.mjs` và LaunchAgent là luồng local cũ, chỉ đụng khi thật sự cần.
