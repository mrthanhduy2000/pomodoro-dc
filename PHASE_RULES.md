# PHASE_RULES — how to work, how to write a prompt, how to report

> Replaces every ritual used in Phases 9–18. Why this file exists: measuring the project on
> 2026-08-24 showed each session spent **~80% of its budget reading / measuring / writing docs** and
> only ~20% building. Three consecutive phases passed every numeric gate and were **all rejected by
> Đàm's eyes**. This file cuts the waste and keeps only what protects something valuable.

---

## 1. The deliverable is a SCREENSHOT
Đàm's eyes are the final judge of visuals. Numbers exist so you don't fool yourself, **not** to win
an argument against his verdict. A session with only a table of numbers **delivered nothing**.

**A successful session = ≥4 changes Đàm can see in a screenshot.** Not "all gates green".

## 2. Do NOT measure performance
Already settled on real hardware (Apple M3 · ANGLE Metal · 1100×700 · DPR 2, see `PERFORMANCE.md`):
the slowest scene is **5.20 ms** against a 16.67 ms budget ⇒ **3.2× headroom**; cost is ≈0.87 ms
fixed + 1.14 ms per million real pixels ⇒ **80% of cost follows PIXELS**, geometry is nearly free
(triangles differ 43% between eras 3 and 11 while time differs 2.4%). **That budget exists to be
spent.**

- No ms timings · no draw-call/triangle gates · no `bench-macbook.sh` · no 1.25× CPU gate.
- Measure again **ONLY IF** Đàm reports stutter on the real machine.
- Two permanent bans, no measurement needed: **never lower DPR** · **never add a fourth light**
  (each light ≈ +0.8 ms, and three fill lights already exist — more brings back the "milky pale" bug).

## 3. Do NOT write new measuring tools
`scripts/` once held 18 measuring tools, most written to prove **one number once**, and home-made
tools have lied more than 20 times in this project's history. Four are still alive:

| Tool | Use when |
|---|---|
| `city-preview.mjs` | render one era (`--era N --hour H --width 1500`) or a sweep (`--sweep`) |
| `sweep-score.mjs` | are the 15 eras still distinguishable (anti-drift gate) |
| `png-probe.mjs` | real colour on a rendered image |
| `shot.mjs` | 2D UI screenshots (run `npm run build` first) |

Need a fifth → **ask first**, do not write one.

`sweepMetric.mjs` · `mask-count.mjs` · `plan-coverage.mjs` · `water-view.mjs` · `water-score.mjs` ·
`scene-tri.mjs` · `plinth-tri.mjs` stay in `scripts/` because a test uses or imports them.
Ten single-use tools moved to **`scripts/archive/`** (still in git, runnable by full path):
`depth-score` · `frame-fit` · `frame-score` · `plateau-score` · `road-bend` · `road-score` ·
`scene-count` · `shadow-score` · `sweep-diff` · `terrain-score`.

## 4. Tests: keep only what protects real data
Per-session gates: `npm test` **adds no new red** · `npm run lint` clean · `npm run build` green.

Exactly **ONE** test is mandatory: **the ADR-007 invariant** — the coordinates of the 5 wonders and
every EXISTING house must be identical before and after, at every session milestone 1…120 × 15 eras.

Dropped: break-each-assert-until-red · injection controls · frozen-old-number controls ·
`--selftest` · re-baselining for every change. Re-apply the break-it-until-red discipline **only**
when adding a NEW invariant that protects user data — not for roof colour, tree shape, or pavement
width (breaking those is visible in a screenshot).

## 5. Docs: two files
`BAN_GIAO.md` (prepend, ~30 lines per phase) + `CHANGELOG.md`. Other files change **only when your
change makes their content FALSE**: new module → `PROJECT_STRUCTURE.md` · flow changed →
`ARCHITECTURE.md` · a decision with ≥2 genuinely weighed options → new ADR · debt found →
`TECH_DEBT.md` · status or next-steps changed → `START_HERE.md`. **Never update "for completeness".**

`BAN_GIAO.md` is a journal: **append only, read only the first 60 lines.** Past ~500 lines, move the
old part to `docs/archive/`. Never read it whole.

## 6. Reports: 5 lines
```
1. Done      — one line per item
2. Evidence  — screenshot path / numbers
3. Not done  — what and why
4. Risk      — or "none"
5. Next      — exactly ONE proposal
```
The 11-point TECHNICAL ADVISOR REPORT is **kept only for architecture/infrastructure phases**
(Supabase sync, database, AI Coach, deploy, security, large refactor, incident). Art phases drop it
entirely. Template: `docs/GOVERNANCE.md`. **Never write both kinds for one task** — before
2026-09-06 two overlapping 11-point reports burned ~2,500 output tokens per task saying the same
thing. **Reports are written in Vietnamese** (they are for Đàm); docs and code are English.

## 7. Finish the whole turn
A prompt listing 4–8 items means **doing all 4–8 before reporting**. Do not stop halfway to ask.
Blocked on one → skip it, log one line, keep going.

**Priority when forced to choose: 6 items at 90% > 1 item at 100%.**

The ONLY stopping condition: **the ADR-007 test goes red** — produce the first displaced building;
never loosen the test.

## 8. Fixed prompt shape (for whoever writes the prompt)
Max **~60 lines**, exactly 4 sections, **never restating process rules** (they live here):
```
CONTEXT   — Đàm's own words. ≤3 lines.
DIAGNOSIS — root cause with numbers. ≤6 lines.
WORK      — 4 to 8 items, ≤6 lines each.      ← 80% of the prompt
DELIVER   — which screenshots + the 5-line summary.
```
Constraints on the prompt author:
- **Every prompt must carry 4–8 items.** A one-item prompt is a badly written prompt.
- **No "measure first" phases** unless the previous phase was genuinely ambiguous. The last three
  were not — Đàm said plainly it was small.
- The author's hypothesis must be refuted by a **SCREENSHOT**, not by a metric.
- One prompt block per turn, nothing else attached.

## 9. Unchanged
Never touch the camera or `gridSize` · never rebuild a tool from memory (take it from git, or write
it fresh and cross-check against production code) · commit + push after every valuable milestone
(the sandbox has been rolled back to an old snapshot mid-session before, costing a full measuring run).

⚠️ *"Never merge `main` yourself" was REPLACED on 2026-08-22* — Đàm: *"sau này tự deploy, tôi không có
việc gì phải tự deploy cả"* ⇒ **merge into `main` and push yourself, do not ask**, and state clearly
what reached production beyond your own work (`CLAUDE.md` §Infrastructure law 1).

## 10. Three shapes of failure already paid for — blocked by screenshots, not by good intentions
1. **`TECH_DEBT #41`** — Phase 11 roof detail: built, beautiful, and **90/90 tiles below the eye
   threshold**. ⇒ Before spending budget on small detail, ask: *at Đàm's viewing distance, how many
   pixels does this occupy?* Under ~12px nobody sees it.
2. **Phase 8D shrubbery** — the mechanism ran, the screenshot convinced, measurement showed it had
   **never done anything**. ⇒ Human eyes are excellent at finding clusters in noise. Toggle it off
   and compare images.
3. **A gate passed by building something that should not exist** — houses on a skyline ridge, square
   paddies in the neolithic era. ⇒ Every 15-era identity number must be tied to the `country` declared
   in `eraStyle.js`, and must answer *"what real place looks like this?"*
