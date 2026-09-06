# OPERATIONS — infrastructure, deploy, sync, push, Electron tray, MCP, testing

> Split out of `CLAUDE.md` on 2026-09-06 and translated to English the same evening. Every trap below
> was paid for by a real incident; **nothing was deleted in either pass**. The LAWS distilled from
> these live in `CLAUDE.md` as one-liners — this file is the "why" and the "how".
>
> **Open this when:** touching Supabase/sync · a deploy misbehaves · adding an `api/` route ·
> changing Web Push · changing the Electron tray/menu bar · setting up a new machine or project.

## Infrastructure

| Thing | Detail |
|---|---|
| App URL | `https://pomodoro-dc.vercel.app` |
| Mac menu bar | Electron companion app |
| GitHub | `https://github.com/mrthanhduy2000/pomodoro-dc` |
| Supabase | `https://jcefdsdccmnmqvuwelmm.supabase.co` |
| DB table | `game_state` (id, data JSONB, updated_at, version) |
| Timer tray sync | `timer_live` (id `singleton`) |

## Vercel Hobby: the 12 Serverless Functions ceiling

⚠️ **2026-07-11 — INCIDENT + PERMANENT FIX** (Đàm asked for a root fix, not a patch): adding
`api/keepalive.js` made the deploy FAIL — *"No more than 12 Serverless Functions can be added to a
Deployment on the Hobby plan"*.

**Root cause**: Vercel (preset "Other" / no framework) treats EVERY `.js` file directly under `api/`
(recursively) as its own Serverless Function — including test files — EXCEPT files and folders whose
name starts with `_` (a Vercel convention it already honoured for `api/_lib/`). At the time, 5
`*.test.js` files sat among `api/` and `api/push/` and were being counted.

**STRUCTURAL FIX (permanent, not a blacklist somebody must remember to maintain)**: move ALL `api/`
tests into **`api/_tests/`**, mirroring the source layout (`api/push/` → `api/_tests/push/`) — using
exactly the underscore-prefix convention Vercel already skips, just like `api/_lib/`. Tests are
therefore permanently outside Vercel's function scan: no filename list to know in advance, nothing to
delete or move before deploying, and it stays safe even with hundreds of future test files
(`.test.js`, `.spec.js`, any name) as long as they live in `api/_tests/`.

⚠️ **MANDATORY RULE for every new API test**: always place it in `api/_tests/` (mirroring the path of
the file under test), never beside the route handler. Update the import paths accordingly
(`../coach.js`, `../../push/dispatch.js`…). The `package.json` test glob covers `api/**/*.test.js`.

**Second line of defence** (`.vercelignore`, in case a helper file is dropped directly under `api/`
and forgotten): it also excludes `*.spec.*` / `*.mock.*` / `*.fixture(s).*` / `*.stories.*` /
`*.bench.*` / `*.e2e.*`, not just `*.test.js`.

Currently **10 real functions** (`coach`, `coach-digest`, `keepalive`, 7 routes under `api/push/`) —
2 to spare before the ceiling. After adding an API route, recount:
`find api -type f -name "*.js" ! -path "api/_*"`.

⚠️ **FOUND AGAIN WHILE READING LOGS**: commit `8ee264d` (25 June, adding `api/coach-digest.js` — the
6th piece of the AI Coach) had already FAILED its build for **this same reason**, and nobody noticed
— Vercel simply kept serving the previous deployment, so the "warn before a streak breaks via push"
feature **never actually ran in production from 25/6 to 11/7** while the code and docs said
"complete" (see `BAN_GIAO.md`). Lesson: after every push you MUST confirm the Vercel Deployments tab
shows "Ready" — green code plus a successful commit does not mean it shipped.

## Sync (complete)

- `src/lib/supabase.js` — Supabase client.
- `src/lib/syncService.js` — pull on app open, debounced push every 5s.
- `initSync()` is called from `App.jsx`, in an effect that runs after the stores hydrate
  (`storesHydrated`).

⚠️ **Sync stopped working = check the Supabase project first, not the code.** A Free-tier project can
auto-PAUSE for two different reasons: (a) exceeding the 0.5 GB "Database Size" quota — see the
2026-07-11 incident in `BAN_GIAO.md`: `cron.job_run_details` had grown to 795 MB because the
push-dispatch job ran every 5s without pruning its log, NOT because of `game_state`, which is always
a few hundred KB (a nightly self-cleaning job, `supabase/cleanup_cron_logs.sql`, now prevents a
recurrence); (b) ~7 days of "inactivity" (a one-user app easily goes quiet that long) — prevented by
the `api/keepalive.js` cron (Vercel, 3 a.m. daily, see `vercel.json`) which runs one light query
through the real Supabase client to keep the project active. If Database Size balloons again, look at
`cron.job_run_details` first; if the project pauses while Database Size is low, check whether the
`keepalive` cron is running (it needs `CRON_SECRET` + `SUPABASE_SERVICE_ROLE_KEY` in Vercel env).

⚠️ **"First action wins" (2026-07-11) — stops two machines overwriting each other.** `game_state`
used to have only `updated_at`, written by the CLIENT (`new Date().toISOString()`), so whichever
machine wrote LAST won regardless of who acted first — causing two devices to flip-flop and
potentially LOSE data (same-day incident in `BAN_GIAO.md`: a real focus session was lost because a
laptop overwrote a session the phone had just completed). FIXED: a `version` column incremented by a
SERVER-SIDE TRIGGER (`supabase/game_state_version.sql`, independent of any client clock).
`syncService.js` writes compare-and-swap style (`.eq('version', expectedVersion)`); a rejected write
(0 rows matched) means that machine LOST and must re-pull the winning state (`pullFromCloud()`) —
**it must never force an overwrite**. The old guard based on `localSession?.isRunning` was REMOVED
(unnecessary — `version` determines ordering exactly, rather than guessing). The pure function
`shouldImportVersion` is tested in `src/lib/syncService.test.js`.

⚠️ **PATCH C1 (2026-07-17) — four safety nets around CAS; do not remove any without reading this.**
(a) **Flush on leaving the app**: `visibilitychange→hidden` + `pagehide` call `pushNow()` **only when
a change is pending** — on iOS the tab is frozen, so the 5s debounce timer NEVER fires. The "pending"
signal is the `debounceTimer` variable, so it **MUST be set to `null`** when the timer fires or is
cancelled (otherwise the signal is permanently on and every app-hide writes blindly).
(b) **`hasMeaningfulState()`** (pure, exported): local empty + cloud has data → ACCEPT cloud, do not
push; local has real data → push as before (this is the recovery path for offline changes not yet
pushed — do not turn the else branch into "always import").
(c) The `known < 0` branch (the ONLY write path without CAS) must **read cloud first**; if that read
fails, postpone the write rather than write blindly.
(d) Postgres error **`42703`** during `initSync` → a `console.error` naming `supabase/game_state_version.sql`
specifically.
Behavioural tests: `src/lib/syncService.behavior.test.js` (17 cases; the file stubs out the real 5s
debounce so it cannot be flaky). **Remaining limitation, deliberate**: two machines editing DIFFERENT
fields while offline still lose the loser's part → `TECH_DEBT.md` #8.
⚠️ Deploying new code REQUIRES running `supabase/game_state_version.sql` first (or near-simultaneously)
— without the `version` column every write errors (`column "version" does not exist`) and sync stops
entirely until the SQL is run.

## Web Push on iPhone (working; redo this when setting up a new machine or project)

- Vercel environment variables: `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT`,
  `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, **`GEMINI_API_KEY`** (the cloud AI Coach — already
  configured, with **billing / paid tier enabled since 2026-06-24 ⇒ no more 429s**, running stably on
  `gemini-2.5-flash`; without the key the AI Coach does NOT run at all because the on-device Qwen
  engine was removed; `GEMINI_MODEL` / `GEMINI_MODEL_FALLBACK` / `GEMINI_MODEL_FALLBACK2` optional).
  See `.env.example`. The Supabase frontend keys are hardcoded and need no env entry.
- Generate Web Push keys: `npm run push:keys` → paste public/private into Vercel env.
- The push tables and scheduler live in `supabase/*.sql` — run them by hand in the Supabase SQL
  editor (missing them breaks push).
- Browser-side push changes: `public/push-worker.js` (service worker) + `public/manifest.json` (PWA).

## Mac menu bar app (Electron tray) — how to enable it, and the 4 traps already paid for

- **How it runs**: `node_modules/electron/dist/Electron.app/Contents/MacOS/Electron <project-dir>`
  (the binary directly). There is **no packaged `.app`** for the tray app.
- ⚠️ **TRAP 1 (cleaned up 2026-08-05, recorded so nobody recreates it)**: a `DC Pomodoro.app` used to
  sit inside the project folder looking like the menu bar app but **it was not** — it was an old
  AppleScript applet that started `serve-dist.mjs` on `localhost:31105` and opened Chrome (exactly the
  localhost flow that is banned), and it pointed at the old folder `Pomodoro Game - USING`. Opening it
  did NOT show a tray icon. **Deleted.** Never recreate that kind of launcher; use the LaunchAgent below.
- ⚠️ **TRAP 2 — launchd cannot run a path containing Vietnamese characters.** Pointing
  `ProgramArguments` straight at a path containing "Bản sao…" makes the job exit with **code 78
  (EX_CONFIG)**, with NO stderr, even though `plutil -lint` passes and `test -x` says the file exists
  (bash normalises NFC/NFD, launchd does not). **Same family as the NFC/NFD trap that made the tests
  load two copies of React.** The fix: the LaunchAgent points only at a wrapper script on a **pure
  ASCII path** — `~/Library/Application Support/dc-pomodoro-tray.sh` — and that script `cd`s into the
  accented folder (bash handles it correctly). Logs must also live on ASCII paths
  (`~/Library/Logs/dc-pomodoro-tray.*.log`).
- **Auto-start**: LaunchAgent `~/Library/LaunchAgents/com.dcpomodoro.tray.plist` (`RunAtLoad` on,
  **`KeepAlive` OFF** so the tray menu's "Quit" really quits instead of being relaunched instantly).
- ⚠️ **TRAP 3 — `main.js` has no single-instance lock** (`requestSingleInstanceLock`). Running it
  twice = **two icons** in the menu bar. `pkill` the running copy before loading the LaunchAgent.
- ⚠️ **TRAP 4 (2026-08-10) — "a transparent image" is not "no image".** While a session runs, the tray
  drops the icon and shows text only (`🍅 mm:ss` / `☕ mm:ss`). The "drop the icon" path used to load
  `public/tray-empty.png` (16×16, fully transparent). Being transparent it was invisible, **but macOS
  still reserved its 16 pixels**, producing a blank gap before the tomato / coffee cup. Correct fix:
  `nativeImage.createEmpty()` (a 0×0 image that occupies nothing). `tray-empty.png` has been deleted.
  **Never go back to a transparent PNG for "hiding" an icon.**
- **With no session running the tray shows only the plain icon** (`updateTrayTitle` sets an empty
  title) — that is normal, not a fault. `🍅 mm:ss` appears only once a session starts.
- ⚠️ **Realtime must never be the only update path** (ADR-072, 2026-09-06): `electron/main.js` polls
  `fetchTimerLive` on an interval AND refetches on `powerMonitor` `resume`, because a Supabase
  Realtime WebSocket can die silently (Mac sleep/wake, Wi-Fi change) without replaying missed events.
- **(Fully cleaned 2026-08-05)** Every trace of the old project layout was removed (moved to Trash):
  LaunchAgent `com.civjourney.localhost`; the old project folder `Downloads/Claude Code/Pomodoro Game
  - USING`; the `DC Pomodoro.app` applet; 2 old game-data backups and 2 CivJourney-era design files in
  `Downloads`; 2 Claude session folders for the old project path. **From now on there is exactly ONE
  project folder**: `Downloads/Claude Code/Bản sao Pomodoro Game - USING`. (The two remaining
  "pomodoro"-named things in `~/Library` — `com.macpomodoro` and `iCloud~com~limepresso~pomodorofree`
  — belong to OTHER vendors' Pomodoro apps, are unrelated to this project, and must not be deleted.)

## Deploy process

```
edit code → git add . && git commit -m "message" → git push origin main
→ Vercel deploys automatically in ~2 minutes
→ every device sees the new version
```
Or double-click `/Users/damduy/Desktop/🚀 Deploy App.command`.

⚠️ **It MUST be the `main` branch** (lesson from 2026-08-12, a wasted wait): Vercel **only updates
production on a push to `main`**. Pushing any other branch (e.g. a `claude/...` feature branch a web
Claude Code session created) produces only a **Preview** at its own URL — `pomodoro-dc.vercel.app`
does not change at all, and Hobby-plan previews usually demand a Vercel login before Safari on iPhone
will show them. Vercel's own Overview page says *"To update your Production Deployment, push to the
`main` branch"*, but it is very easy to skim past.

⇒ **Rule for EVERY AI** (Đàm settled it on 2026-08-22: *"sau này tự deploy, tôi không có việc gì phải
tự deploy cả"*): once you finish something Đàm needs to SEE on his real device while you are on a side
branch → **merge into `main` and push yourself, do NOT ask**. "Deploy" means it reached
`pomodoro-dc.vercel.app`, NOT "it was pushed to GitHub" — a side branch means the code is safe on
GitHub, not that it is in production, so stopping at the branch and reporting "deployed" is a false
report.
- **ONLY stop to ask** when resolving the conflict would require throwing away another session's
  work. A conflict that resolves without losing anything: resolve it and carry on.
- **You must still REPORT clearly what reached production BEYOND your own work.** A side branch often
  carries commits from other sessions that never shipped (on 2026-08-22: 11 Phase 13–14 commits from
  another session travelled along with 2 commits of the session doing the work). Đàm has the right to
  know what he just received — staying silent about that hides the real scope of the change.
- After pushing, **still confirm Vercel shows "Ready"**.

Safe merge recipe: `git fetch origin main` → check
`git merge-base --is-ancestor origin/main <branch>` (true means it merges cleanly) →
`git checkout -B main origin/main && git merge --ff-only <branch> && git push origin main`.

## MCP — which servers to keep (measured 2026-09-06)

MCP configuration lives in the claude.ai account, **not in the repo** (there is no `.mcp.json`), so an
AI cannot turn them off on Đàm's behalf. He does it via `/mcp` in Claude Code, or claude.ai →
Settings → Connectors.

| Keep ✅ | Why |
|---|---|
| **github** (55 tools) | **Required** — web sessions have no `gh` CLI; every PR/issue/CI action goes through it |
| **Claude Code Remote** (22) | Web-session plumbing: `add_repo`, `send_later` (self-scheduled PR follow-ups) |
| **ccd_session** (2) | Plumbing |

| Turn off ❌ | tools |
|---|---|
| TickTick · Notion · Canva · Gmail · Google Calendar | 162 tools, **none related to this project's code** |

⚠️ **But do not expect token savings here: measured, it is only ≈1,780 tokens = 1% of the problem.**
Reason: the harness **defers** unused MCP servers — it keeps only the NAME (~11 tokens) and drops all
descriptions. What actually costs is an MCP loaded with its **full schema** (Claude Code Remote
≈11,400 tokens). The reason to turn the others off is **less noise when choosing a tool** and fewer
mid-session disconnect notices, NOT savings.

## Miscellaneous technical notes

- `npm install` needs the `--legacy-peer-deps` flag.
- Electron is still tied to the Mac menu bar. Do not delete or ignore it when changing the timer/tray.
- `serve-dist.mjs` and the LaunchAgent are the old local flow; touch them only when genuinely needed.
- ⚠️ **(History, removed)** There used to be a `coachVoice.js` (emotional voice) and an `ai-coach-sim/`
  folder (browser demo) — both were deleted on 2026-06-21. Neither `src/engine/coachVoice.js` nor
  `ai-coach-sim/` exists any more; do not recreate them unless Đàm asks.

---

## Testing — full detail (moved out of `CLAUDE.md` 2026-09-06)

Always run `npm test` before committing, plus `npm run build`.

⚠️ **Output volume is itself a context cost (ADR-075).** The default reporter prints one line per
test. Measured 2026-09-06 on 1,609 tests: `npm run test:fast` emits **9,802 lines / 408,514 chars**
(≈230,000 tokens — more than a whole 200k context window), while `npm run test:quiet` emits **89
lines / 2,132 chars** (≈1,100 tokens). Same tests, **−99.5% output**. It works by running the `dot`
reporter (one character per test) to stdout while a second `tap` reporter writes the full transcript
to a temp file, from which only the `# tests / pass / fail / skipped` summary is printed — so the
documented `# skipped 1` signal survives. Failures still print in full, so nothing is hidden. `npm test` remains the authoritative verbose form for when
you need the whole transcript.

⚠️ **`npm test` runs TWO passes (since 2026-08-21)**: `test:fast` (all fast tests — **the real test
count is the last line of THIS pass**, and it must show `# skipped 1`) then `test:cross` (the
`scene-tri` ↔ `plinth-tri` cross-check, **~25 seconds** since ADR-048 — before that it was 70–90
seconds depending on machine load, measured at 68.8 · 85.9 · 86.3 seconds across three runs, and
**that number is exactly what revealed a performance regression no gate was watching**; it now
**prints its own duration** rather than letting the docs promise a fixed figure — see
`TECH_DEBT #70`). For a quick count: `npm run test:fast`.

⚠️ **The slow half is skipped via the `DC_CROSS_SLOW` environment variable, NOT `--test-skip-pattern`**
— that flag was tried and **does nothing** (Node lists it, reports no error, and the slow test still
runs ⇒ the "fast" pass silently carried an extra 70 seconds). A silently ignored flag is exactly the
kind of thing that has bitten this project repeatedly; the current approach makes `# skipped 1`
visible, so if it ever stops skipping, the number says so itself.

⚠️ **The test glob CHANGED on 2026-08-12** (`TECH_DEBT #10`): from a hand-written list of
single-level folders to `'electron/**/*.test.js' 'src/**/*.test.js' 'api/**/*.test.js'
'scripts/**/*.test.js'`, **inside single quotes** so `node --test` expands them itself (`sh` has no
globstar; removing the quotes breaks it). Previously a test inside a subfolder
(`src/components/city/…`) would **silently never run**; now a test next to its source at any depth
runs, matching the convention in `PROJECT_STRUCTURE.md`. Adding a new folder no longer requires
editing `package.json`.

Inspection tool for the metrics table the model receives:
`node --import ./scripts/register-esm-loader.mjs scripts/coach-sample.mjs` (builds ~24h of sample
history and prints `buildAnalystContext`). Anti-hallucination scores are printed by
`src/engine/coach/eval.test.js`.
