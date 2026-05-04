# Pomodoro DC — Project Brief

## Người dùng
- Tên: Đàm (non-coder, dùng Codex + Claude Code để code)
- Giải thích đơn giản, tránh jargon kỹ thuật

## Nền tảng hiện tại
App chạy hoàn toàn trên **web** tại `https://pomodoro-dc.vercel.app`

- Không dùng Electron nữa
- Không dùng localhost nữa
- iPhone và Mac đều truy cập qua URL Vercel

## Tech Stack
- React + Vite + PWA
- State: Zustand + localStorage (key: `dc-pomodoro-v1`, vẫn đọc được key cũ `civjourney-v1`)
- Sync cloud: Supabase
- Hosting: Vercel (auto-deploy từ GitHub)

## Hạ tầng

| Thứ | Chi tiết |
|-----|----------|
| App URL | `https://pomodoro-dc.vercel.app` |
| GitHub | `https://github.com/mrthanhduy2000/pomodoro-dc` |
| Supabase | `https://jcefdsdccmnmqvuwelmm.supabase.co` |
| Bảng DB | `game_state` (id, data JSONB, updated_at) |

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
- ❌ Electron — không dùng nữa, app chạy web hoàn toàn
- ❌ localhost / serve-dist.mjs / LaunchAgent — không dùng nữa
- ❌ Menu bar macOS qua Electron — không làm, không liên quan

## Lưu ý kỹ thuật
- `npm install` cần flag `--legacy-peer-deps`
- Electron và serve-dist.mjs vẫn còn trong code nhưng bỏ qua hoàn toàn
