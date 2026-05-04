# DC Pomodoro

## Stable local app

`http://localhost:31105/` is now meant to be the stable everyday URL.

Use one of these:

- `npm run install:agent`
- double-click `DC Pomodoro.app` after regenerating it with `bash scripts/create-launcher.sh`

What changed:

- port `31105` is reserved for the stable built app
- the stable server keeps serving the last successful build while newer code is rebuilt in the background
- a macOS LaunchAgent keeps the server alive after login
- the LaunchAgent now resolves `node` at runtime through an inline shell command, so Node path changes are less likely to break it after upgrades
- Vite dev mode moved to `http://localhost:31101/` to avoid port fights

Useful commands:

- `npm run serve:prod` — serve the stable app on `31105`
- `npm run dev` — run Vite on `31101`
- `npm run electron-dev` — run Electron against the dev server on `31101`
- `npm run uninstall:agent` — remove the background LaunchAgent
- `npm run push:keys` — generate a new VAPID key pair for Web Push

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

4. Trên iPhone:

- Mở `https://pomodoro-dc.vercel.app` bằng Safari
- Chọn Share → `Add to Home Screen`
- Mở app từ icon ngoài Home Screen
- Vào `Cài đặt` trong app và bấm bật thông báo

Ghi chú:

- Vercel Cron trong repo chạy mỗi phút qua `/api/push/dispatch`
- Vì vậy push thường đến rất nhanh, nhưng có thể trễ tối đa khoảng 1 phút so với giây timer chạm 0

## React + Vite template notes

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
