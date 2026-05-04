# Pomodoro DC — Project Brief

## Người dùng
- Tên: Đàm (non-coder, dùng Codex + Claude Code để code)
- Giải thích đơn giản, tránh jargon kỹ thuật

## Tech Stack
- React + Vite + PWA + Electron (macOS)
- State: Zustand + localStorage (key: `civjourney-v1`)
- Working dir: `/Users/damduy/Downloads/Claude Code/Pomodoro Game - USING`

## Hạ tầng đã có sẵn

| Thứ | Chi tiết |
|-----|----------|
| Local server | `http://localhost:31105` — tự chạy qua LaunchAgent |
| iPhone PWA | Cài trên Home Screen, truy cập qua `192.168.1.153:31105` khi ở nhà |
| Vercel (live) | `https://pomodoro-dc.vercel.app` — dùng được mọi nơi |
| GitHub | `https://github.com/mrthanhduy2000/pomodoro-dc` — push lên main → Vercel tự deploy |
| Supabase sync | `https://jcefdsdccmnmqvuwelmm.supabase.co` — tự sync Mac ↔ iPhone |
| Deploy script | `/Users/damduy/Desktop/🚀 Deploy App.command` — bấm đúp để push |

## Sync (đã hoàn chỉnh)
- `src/lib/supabase.js` — Supabase client
- `src/lib/syncService.js` — pull khi mở app, push debounced 5s sau thay đổi
- `initSync()` được gọi trong `App.jsx` useEffect đầu tiên

## Quy trình deploy
```
Sửa code → bấm đúp "🚀 Deploy App.command" → Vercel tự deploy (~2 phút)
```
Hoặc thủ công: `git add . && git commit -m "update" && git push`

## Việc đang làm / chưa làm
- [ ] Menu bar Mac: hiển thị đếm ngược Pomodoro trên thanh menu bar macOS bằng Electron tray
- [ ] iPhone notification khi hết phiên

## Lưu ý kỹ thuật
- `npm install` cần flag `--legacy-peer-deps` (do xung đột vite-plugin-pwa vs vite 8)
- Server local dùng `serve-dist.mjs`, không phải Vite dev server
- Electron chạy riêng qua `npm run electron-dev`
