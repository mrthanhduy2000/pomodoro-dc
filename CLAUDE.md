# Pomodoro DC — Project Brief

## ⚠️ LANGUAGE RULE (2026-09-06 — Đàm's decision, applies to every AI session)
- **Docs, code, comments, commit messages: ENGLISH.** Vietnamese measures **1.72 chars/token** here;
  English is roughly **4** — same meaning, ~2.3× cheaper. These files are re-read every session, so
  the saving multiplies by session count.
- **All replies to Đàm: VIETNAMESE.** He is a non-coder driving Codex + Claude Code on a
  production app with real data on real devices; explain plainly, no jargon, and he likes
  **visual comparisons with concrete numbers**. End-of-task reports are for him → Vietnamese.
- **Scope, so this never contradicts itself:**
  | Group | Language | Enforced by |
  |---|---|---|
  | `CLAUDE.md` · `START_HERE.md` · `PHASE_RULES.md` · `AGENTS.md` | English | `scripts/docBudget.test.js` (**red** on a Vietnamese paragraph) |
  | `docs/GOVERNANCE.md` · `docs/OPERATIONS.md` | English | translated 2026-09-06 |
  | Reference archives (`TECH_DEBT.md`, `ARCHITECTURE_DECISIONS.md`, `CHANGELOG.md`, `BAN_GIAO.md`, `docs/LESSONS_3D.md`, `PERFORMANCE.md`, …) | **legacy stays Vietnamese; NEW entries in English** | judgement |
  Translating the 2.6M-char archive in one pass would cost ~700k output tokens and risks losing
  knowledge that took whole phases to earn — so it converts gradually, as each part is touched.
- Keep Vietnamese inside English docs only for: verbatim quotes of Đàm's instructions (historical
  evidence) and UI strings the app actually shows.

## ⚠️ ASK BEFORE ACTING (supreme rule — outranks PRIORITY RULE #1)
Classify every instruction into one of two buckets:
- **RESEARCH / INVESTIGATE / PROPOSE / "cho ý kiến" / "theo bạn…"** → present analysis +
  recommendation, then **STOP**. No code edits, no commit, no deploy. Ask "shall I do it?".
  **Ambiguous phrasing counts as research** — ask first.
- **DO ("làm đi", "sửa", "thêm", "đổi", "nâng cấp", "deploy"…)** → 4 steps: (1) explain **briefly and
  plainly** what you are about to do *before* touching anything; (2) do it (with `npm test` + lint +
  doc updates); (3) explain what changed and why it helps; (4) **deploy to Vercel automatically**
  (commit + push) — do not ask again, "do it" already includes deploy permission.
- Why: push = production deploy to all of Đàm's devices. He needs control over research, but once he
  says do it, stop asking back and forth. Details: memory `ask-before-acting.md`.

## ⚠️ TOKEN BUDGET — the most expensive rule, read before anything else
The context window is **exhaustible**, and what drains it is not chat — it is **this project's own
docs**. Measured 2026-09-06: 20 `.md` files = **2,671,121 chars ≈ 1.55M tokens = 775% of a 200k
window**. One `cat TECH_DEBT.md` = **252k tokens = 126% of a 200k window** — a single command blows
the whole context.

⚠️ **Measure in UNICODE CHARS via JS `String.length`** — never `wc -c` (Vietnamese diacritics are
2–3 bytes/char, inflating ~21%) and never Python `len()` (astral emoji differ). The measured ratio
for Vietnamese docs here is **1.72 chars/token**; English is roughly **4**. Full reasoning:
header comment of `scripts/doc-budget.mjs`.

**❌ NEVER `cat` these** — each is 46–78% of a 200k window, and several were over 100% before the
2026-09-06 split (ADR-075):
`CHANGELOG.md` · `BAN_GIAO.md` (**`head -60` only**) · `TECH_DEBT.md` · `docs/LESSONS_3D.md` ·
`PERFORMANCE.md` · `ARCHITECTURE_DECISIONS.md` · `PROJECT_STRUCTURE.md` ·
`AI_HANDOFF_KNOWLEDGE.md` · `ARCHITECTURE.md` · `docs/archive/*` (frozen history).
Closed debt entries live in `docs/archive/TECH_DEBT_CLOSED_2026-09-06.md`; ADR-001…050 in
`docs/archive/ADR_ARCHIVE_001-050.md`.

Exact sizes drift, so they are **not copied here** — `node scripts/doc-budget.mjs` prints them fresh.
**No file may exceed one context window**: a guarded ceiling, and crossing it means SPLIT, not raise.

**Three obligations, not suggestions:**
1. **Before opening any `.md` other than `CLAUDE.md` / `START_HERE.md` / `PHASE_RULES.md`:
   `grep -n` first, then read by line range.** Need a table of contents to know which lines?
   → `node scripts/doc-budget.mjs --map <file>` (prints headings + line ranges, costs almost nothing).
2. **Same for code** — `completeFocusSession` is ~760 lines; do not `cat` all of `gameStore.js`.
3. **Six guards run inside `npm test`** (`scripts/docBudget.test.js`) — each adversarially
   break-tested, none is a promise: **char limit** per auto-loaded file (DOC MAP below) ·
   **language** (a Vietnamese passage in an English doc) · **canonical rule** (no auto-loaded file
   may restate a rule another owns — this file once had the merge rule backwards in two places) ·
   **pointer** (every `.md` reference must resolve) · **context-window ceiling** (no reference doc
   above one window) · **rotation** (`BAN_GIAO.md` / `CHANGELOG.md` must archive old entries). Any breach = **RED TEST**. Check: `node scripts/doc-budget.mjs`.
   When one goes red the fix is **SPLIT and leave a pointer** — never raise a limit, never delete
   knowledge. *(Why guards: the old 40,000 limit was only a sentence, and `START_HERE.md` had
   silently blown its own limit with nobody noticing. **A threshold with no guard is a funnel.**)*

## ⚠️ PRIORITY RULE #1 (every AI session)
1. **Before working:** read **`START_HERE.md`** — the ONLY file required every session. Then
   **`PHASE_RULES.md`** if you are inside a phase. Everything else is **REFERENCE**: open only the
   part `grep` hits (see TOKEN BUDGET above).
2. **After changes:** update `BAN_GIAO.md` + `CHANGELOG.md`. Other files change **only when your
   change makes their content FALSE** — never "for completeness" (`PHASE_RULES.md` §5). Changing
   status or next-steps means updating `START_HERE.md`.
3. Design handoff notes live in Đàm's local memory folder:
   `/Users/damduy/.claude/projects/-Users-damduy-Downloads-Claude-Code-B-n-sao-Pomodoro-Game---USING/memory/`
   (`upgrade-roadmap.md` AI Coach · `ui-review-2026-06.md` UI · `resonance-update.md` game loop ·
   `ask-before-acting.md` the ask-first rule). **Web sessions have no such folder — don't hunt for it.**
4. Always run a fresh `git status` — never trust a stale snapshot.
5. **Where a file lives** → `PROJECT_STRUCTURE.md`. **Architecture / data flow** → `ARCHITECTURE.md`.
   Both must be updated together with any structural change.
6. ⚠️ **This file is the SINGLE SOURCE OF TRUTH for rules, for EVERY AI** (Claude Code, Codex,
   ChatGPT…) — "CLAUDE" in the name is history only. `AGENTS.md` is just a pointer here.
   **NEVER fork the rules per AI tool** — tried 2026-07-31 and it failed (the copy produced nonsense
   sentences plus a `.Codex/` path that never existed, then drifted from the original within 5 days).
   That is exactly what **Composition over Duplication** forbids. Details: `AGENTS.md`.

## 📋 Governance + process → **`docs/GOVERNANCE.md`** (open for any substantial task)
Full PROJECT GOVERNANCE PROTOCOL + AI ENGINEERING PLAYBOOK live there, including the
"change type → doc to update" table. Condensed:
- **Definition of Done**: code · build · test · lint · **docs in sync** · **knowledge in sync**.
  Missing one = not done.
- **7 stages**: Understand → Audit → Design → Implement → Self-review → Validate → Knowledge update.
  **Fix ROOT CAUSE, never symptoms.** **No guessing**: unsure → read source → read docs → **say what
  is missing**; never present a guess as fact.
- **Architecture**: Single Responsibility · High Cohesion · Low Coupling · **Reuse over Rewrite** ·
  **Composition over Duplication** · Explicit over Implicit. Never trade architecture for speed.
- **Commits**: one goal each, independently revertable. **Low/medium-risk issues found along the way
  → fix now**; high risk → ask first.

### End-of-task report — ONE report, never two (unified 2026-09-06)
There used to be two overlapping 11-point reports, burning ~2,500 output tokens per task to say
mostly the same thing. Now:

| Task type | Report |
|---|---|
| Small fix · 3D art · one tidy job | **5 lines** (`PHASE_RULES.md` §6): Done · Evidence · Not done · Risk · Next (exactly ONE proposal) |
| Architecture · infra · Supabase/sync · database · AI Coach · deploy · security · big refactor · incident | **TECHNICAL ADVISOR REPORT, 11 points** (template in `docs/GOVERNANCE.md`) |

Never write both for the same task. **Write reports in Vietnamese** — they are for Đàm and his
external advisor, not for the codebase.

## Platform & stack
Main app is **web**: `https://pomodoro-dc.vercel.app` (full version, iPhone + Mac). Electron is a Mac
companion only — it opens that URL and reads timer state from Supabase; it is **not** a separate app
with its own logic. Localhost is dev/test only.
React + Vite + PWA · Zustand + localStorage (key `dc-pomodoro-v1`, still reads legacy `civjourney-v1`)
· Supabase sync · Vercel auto-deploy from GitHub.

## Infrastructure & operations → detail in **`docs/OPERATIONS.md`**
| Thing | Detail |
|---|---|
| App URL | `https://pomodoro-dc.vercel.app` (only `main` reaches production) |
| GitHub | `https://github.com/mrthanhduy2000/pomodoro-dc` |
| Supabase | `https://jcefdsdccmnmqvuwelmm.supabase.co` — tables `game_state`, `timer_live` |
| Mac menu bar | Electron companion (`node_modules/electron/dist/…/Electron <project-dir>`) |

Eight laws each paid for by a real incident — **the "why" is in `docs/OPERATIONS.md`; do not undo
any of them before reading it**:
1. ⚠️ **Only `main` reaches production.** Other branches produce Preview builds only. Finished
   something Đàm needs to SEE while on a side branch → **merge into `main` and push yourself, do not
   ask** (his instruction, 2026-08-22). Only stop to ask if resolving the conflict would throw away
   another session's work. **Always state clearly what went to production BEYOND your own work.**
2. ⚠️ **After pushing, confirm Vercel shows "Ready"** — a successful commit ≠ shipped (commit
   `8ee264d` failed its build silently; the feature was dead 25/6–11/7 while docs said "complete").
3. ⚠️ **Vercel Hobby: max 12 Serverless Functions.** Every `.js` directly under `api/` (recursive)
   counts as one, **except** names starting with `_`. **API tests always go in `api/_tests/`.**
   Currently **10 real functions** — recount: `find api -type f -name "*.js" ! -path "api/_*"`.
4. ⚠️ **Sync stopped → check the Supabase project FIRST, not the code** (Free tier auto-pauses on
   0.5 GB or ~7 days idle; a log-cleanup cron + `api/keepalive.js` guard both).
5. ⚠️ **Cloud writes are compare-and-swap on a `version` column bumped by a SERVER trigger**
   ("first action wins"). A rejected write means that machine LOST — it must `pullFromCloud()` and
   **never force-overwrite**. Deploying new code requires running `supabase/game_state_version.sql`
   first.
6. ⚠️ **Four safety nets around CAS (patch C1)** — flush on app hide · `hasMeaningfulState()` ·
   the `known < 0` branch reads cloud first · error `42703` handling. **Do not remove any without
   reading `docs/OPERATIONS.md`.**
7. ⚠️ **Electron tray has 4 traps** (legacy AppleScript applet · launchd cannot run paths with
   Vietnamese characters · no single-instance lock → 2 icons · "transparent image" ≠ "no image").
8. ⚠️ **No `GEMINI_API_KEY` in Vercel env ⇒ AI Coach does not run** (the on-device engine is gone).

## 🗺️ DOC MAP — what auto-loads, what you must open
Claude Code / Codex **auto-load 100% of `CLAUDE.md`** before the AI can decide anything, so
*"CLAUDE.md is reference, just grep it"* is **impossible to obey**. The only fix is **splitting
files**. Done in three passes on 2026-09-06: 190,700 → 21,600 tokens (split `LESSONS_3D`/`AI_COACH`)
→ 9,600 (split `GOVERNANCE`/`OPERATIONS`) → **~2,800** (translated to English). Nothing was deleted.

| File | Mechanism | When to open |
|---|---|---|
| `CLAUDE.md` (this file) | **auto-loads every session** — limit **16,000 chars**, guarded | always present |
| `START_HERE.md` | required reading every session — limit **16,000** | session start |
| `PHASE_RULES.md` | read when inside a phase — limit **8,000** | during a phase |
| `AGENTS.md` | pointer for Codex — limit **3,500** | Codex session start |
| **`docs/GOVERNANCE.md`** | on demand | substantial task · need the 11-point template |
| **`docs/OPERATIONS.md`** | on demand | sync · deploy · `api/` · push · tray |
| `docs/LESSONS_3D.md` · `docs/AI_COACH.md` | **`grep`, NEVER whole** | 3D art · AI Coach |
| `TECH_DEBT.md` · `ARCHITECTURE_DECISIONS.md` · `PERFORMANCE.md` · `BAN_GIAO.md` · `CHANGELOG.md` | **`grep`/`head`, never whole** | lookup |

⚠️ **New lessons go into the topic file** (`docs/LESSONS_3D.md` for 3D, `docs/OPERATIONS.md` for
infra, `docs/GOVERNANCE.md` for process) — then, **only if it changes a RULE**, add ONE pointer line
here. Never let this file grow back: it is the only thing billed in **every** session.

## 🎨 3D city art lessons → **`docs/LESSONS_3D.md`**
89 top-level lessons + 96 sub-entries (152k tokens), verbatim — the most expensive knowledge here;
each cost a whole phase. ⚠️ **Touching the 3D city means `grep`-ing that file FIRST** (it opens with
its own index). The 3D city is a **finished black box — Đàm forbids touching it.**

Five laws kept here because they apply to **every** task, not just 3D:
1. **Suspect the MEASURING TOOL before the code** — it has lied 28 times.
2. **An absolute number cannot express a law about a RELATION.**
3. **A test that has never gone red is not a test** — ask *red when you remove WHAT?*
4. **A reassuring sentence must be checked like a number.**
5. **Before trusting a ratio, ask whether the denominator contains things outside the question.**

## AI Coach + game engine → detail in **`docs/AI_COACH.md`**
Gemini specifics (model chain, `tier: 'deep'`, 28s timeout, 6-layer anti-hallucination guard,
CoachChat/Offline/Nudge, `coach-digest` cron, `buildAnalystContext`) live there. Remember here:
- ⚠️ **ONE ENGINE = GEMINI (cloud)**; Qwen/WebLLM removed 2026-06-24. No `GEMINI_API_KEY` ⇒ Coach is
  dead, there is no on-device fallback.
- ⚠️ Every Coach change goes through the guard; scores printed by `src/engine/coach/eval.test.js`
  (**FPR = 0**, catch ≥ 90%). A dropping score means a loosened guard.

**Pure game engine** is separate from state: formulas in `src/engine/gameMath.js` + `constants.js`,
state in `src/store/gameStore.js`. Change formulas in the engine, never inline them into the store.
External data (Supabase/import) **must** pass through `normalizePersistedGameState`.
⚠️ Hot spot: `completeFocusSession` (~760 lines) — easy to introduce "used a stale value" bugs.

### Testing — detail in `docs/OPERATIONS.md`
Before committing: **`npm run test:quiet`** + `npm run build`. Same tests as `npm test` but
**2,132 chars of output instead of 408,514** (measured 2026-09-06) — the verbose form costs roughly
**230,000 tokens**, more than a whole context window, to validate work that is usually smaller.
The real count is the last line of the FAST pass and **must show `# skipped 1`**; the slow half is
skipped by the **`DC_CROSS_SLOW` env var, NOT `--test-skip-pattern`** (that flag silently does
nothing). Test glob covers `electron/` · `src/` · `api/` · `scripts/` at any depth.

## NEVER do these
- ❌ Never turn Electron into a separate main app.
- ❌ Never make localhost / `serve-dist.mjs` / LaunchAgent the primary run path.
- ❌ Never duplicate game logic between web and Electron. The web app owns the logic.
- ❌ **Never start a focus session on dev/localhost** — dev shares the production Supabase row and
  will overwrite Đàm's real data.
