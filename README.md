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

## React + Vite template notes

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
