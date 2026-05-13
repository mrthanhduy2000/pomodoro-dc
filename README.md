# DC Pomodoro

## Current App Model

The full app runs at:

`https://pomodoro-dc.vercel.app/`

Mac also uses an Electron companion app for the menu bar/tray icon. Electron is not a separate product UI; it opens the Vercel app and reads timer state from Supabase so the Mac menu bar can show the active timer.

Daily usage:

- Use `https://pomodoro-dc.vercel.app/` for the full Pomodoro app on iPhone and Mac.
- Use the Electron app on Mac when the menu bar icon/countdown is needed.
- Use localhost only for development and testing.

Useful commands:

- `npm run dev` — run Vite dev server on `31101`
- `npm run electron-dev` — run Electron against the dev server on `31101`
- `npm run electron` — run the Electron companion app
- `npm run build` — production build
- `npm run push:keys` — generate a new VAPID key pair for Web Push

Legacy local-server commands are still in the repo but are not the normal daily path:

- `npm run serve:prod` — serve the stable app on `31105`
- `npm run install:agent` — install old LaunchAgent local server
- `npm run uninstall:agent` — remove the background LaunchAgent

## Web Push cho iPhone

Code đã có sẵn trong repo. Để notification chạy ngoài nền trên iPhone, làm thêm 4 bước:

1. Tạo VAPID keys:

```bash
npm run push:keys
```

2. Thêm env vars trên Vercel:

```bash
WEB_PUSH_PUBLIC_KEY=...
WEB_PUSH_PRIVATE_KEY=...
WEB_PUSH_SUBJECT=mailto:your-email@example.com
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=...
```

3. Vào Supabase SQL Editor và chạy file:

`supabase/push_notifications.sql`

4. Trong Supabase SQL Editor, chạy thêm file:

`supabase/push_dispatch_scheduler.sql`

5. Trên iPhone:

- Mở `https://pomodoro-dc.vercel.app` bằng Safari
- Chọn Share → `Add to Home Screen`
- Mở app từ icon ngoài Home Screen
- Vào `Cài đặt` trong app và bấm bật thông báo

Ghi chú:

- Bản hiện tại không dùng Vercel Cron nữa, vì Vercel Hobby không hỗ trợ cron mỗi phút
- Supabase Cron sẽ gọi `https://pomodoro-dc.vercel.app/api/push/dispatch` mỗi 5 giây
- Route `api/push/dispatch` tự claim job trước khi gửi để tránh các lần cron overlap bắn trùng
- Route `api/push/notify-now` mặc định bị tắt; chỉ bật lại nếu bạn thật sự còn dùng Supabase Database Webhook cũ
- Vì vậy push thường đến gần như ngay, nhưng có thể trễ vài giây so với lúc timer chạm 0

## React + Vite template notes

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
