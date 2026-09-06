# GOVERNANCE — project governance rules + the standard working process

> Split out of `CLAUDE.md` on 2026-09-06 (that file auto-loads 100% in every session, so it is billed
> even in sessions that have nothing to do with process). Translated to English 2026-09-06 evening —
> Vietnamese costs ~2.3× the tokens for the same meaning. **Nothing was deleted in either pass.**
>
> **Open this when:** doing a substantial task and needing to know which docs to update · needing the
> Technical Advisor Report template · unsure about the 7-stage process · about to create a new
> module/abstraction. **Skip it for:** 3D art work (use `PHASE_RULES.md`) or a small bug fix.

## PROJECT GOVERNANCE PROTOCOL (2026-07-12 — permanent, every future AI session)

The project has **three components of equal value**: (1) Source Code, (2) Documentation, (3) Project
Knowledge (decisions / history / context). Code only says *how* the system runs — only documentation
preserves *why* it runs that way. If the three drift apart, the task is **NOT DONE**, even when the
code is correct and build/test/lint are all green.

### Definition of Done (every task, no exceptions)
✓ Source code correct · ✓ Build succeeds · ✓ Tests pass · ✓ Lint passes ·
✓ **Documentation in sync** · ✓ **Project Knowledge in sync**. One missing = not done.

### Table: change type → documentation that MUST be updated
After every change, ask: does this affect architecture / modules / workflow / AI / notifications /
sync / timer / store / API / database / build / deploy / folders / naming / dependencies / testing /
performance? If YES, decide for yourself (do not wait to be told) which docs below need updating:

| Document | Role (never blurred with the others) | When to update |
|---|---|---|
| `README.md` | ONLY the front page: what the project is, how to run/build/deploy, what to read next. No deep architecture here. | run/build/deploy changed, or a new doc needs a pointer |
| `ARCHITECTURE.md` | The big picture: layers / modules / dependencies / state flow / AI flow / sync flow / notification flow / storage flow / database flow | any FLOW changes |
| `PROJECT_STRUCTURE.md` | Folder tree + rules for creating modules / splitting folders / imports / shared modules / naming | folder structure changes, new conventions |
| `CHANGELOG.md` | The OFFICIAL short summary per milestone (purpose / scope / impact / compatibility) — NOT a commit log | every significant change (not every small commit) |
| `MIGRATION.md` | Only for changes to API / module / path / workflow / state / storage / database / folder | ONLY when a real migration exists |
| `ARCHITECTURE_DECISIONS.md` | The "architectural memory" — each decision: Date / Context / Problem / Options weighed / Why each was rejected / Chosen solution / Trade-offs / Impact / Review conditions | a decision with ≥2 genuinely weighed options, real trade-offs, and lasting impact |
| `TECH_DEBT.md` | Every known technical debt (all 14 fields: Name/Module/Priority/Severity/Impact/Root Cause/Current Risk/Future Risk/Recommended Solution/Estimated Complexity/Blocking Conditions/Review Trigger/Owner/Status) | new debt found: low risk → fix it now; medium/high risk or out of scope → it MUST be recorded here, never skipped |
| `AI_ONBOARDING.md` | A 10–15 minute read — if a new AI must audit the whole codebase to understand the project, this file has failed | the most important / highest-risk module changes, or a major new lesson |
| `AI_HANDOFF_KNOWLEDGE.md` | The FULLEST knowledge handoff (domain / flows / ADRs / detailed debt) — written for an AI with no access to the code at all | large changes touching many parts of this document |
| `BAN_GIAO.md` | Current state + a DETAILED log of every item — always updated; this is PRIORITY RULE #1 | EVERY change, however small |

### "Maintenance Sprint" threshold
When `TECH_DEBT.md` holds **≥8–10 High/Critical items**, OR one module has been through ≥3 small
patches/refactors without ever being refactored properly, **proactively propose a "Maintenance
Sprint"** (state goal / scope / benefit / risk / completion criteria) instead of piling on more
features. Current threshold status: see the top of `TECH_DEBT.md`.

### Architectural consistency (ask before creating anything new)
Before creating a new folder / module / service / hook / component / store / helper / abstraction /
API / utility, ask: does this increase coupling? does it make the project harder to understand? does
it introduce a second pattern where one already exists (could it be reused)? does it create new
technical debt? If a more consistent path exists (matching the conventions in
`PROJECT_STRUCTURE.md`) — take that path.

### Self-audit before finishing a task
Check: code/test/lint/build, dead code, duplicate logic, unused imports/dependencies, documentation,
architecture, folder/naming/import consistency, technical debt, knowledge updates. Low/medium-risk
issues found → fix them now without being asked (high risk → report first, per ASK BEFORE ACTING).

### Knowledge preservation
If, while working, you discover a new lesson, an unusual bug, an edge case, or a limitation of the
framework / Supabase / Electron / Vercel / AI / browser — ask: *would this stop a future session
repeating a mistake?* If yes, it MUST be added to the right document (table above). These lessons
must never exist only in the conversation and vanish when the session ends.

### End-of-session handoff report (for any substantial task)
1. What changed · 2. New architectural decisions (if any) · 3. Debt paid · 4. Debt remaining ·
5. Migration if any · 6. Docs updated · 7. New system assumptions · 8. Lessons learned ·
9. What the next session must know · 10. What must NOT be done yet, and why · 11. Proposed next step.
Anything unchanged → write "no change" explicitly, never skip it silently. **Scale this to the size
of the task** — a small fix does not need 11 points; a refactor, a new feature, or an incident does.

### TECHNICAL ADVISOR REPORT (mandatory since 2026-07-17, after EVERY completed task)
On top of the normal report, include a section titled "TECHNICAL ADVISOR REPORT" — written for an
**independent AI Technical Advisor (GPT)** reviewing the architecture, *not* for Đàm. Concise but
with enough context; max ~1–2 A4 pages; no padding, no marketing, no self-praise, no repeating the
changelog. **LANGUAGE: 100% Vietnamese** (headings and body) — this report is read by Đàm and his
advisor, unlike the docs. Keep English only for: file / class / function / variable names, commit
hashes, APIs, frameworks, and terms with no natural translation (CAS, debounce, snapshot, whitelist…).

Exactly 11 points, in order:
0. **Why this task now?** (≤10 lines) — which Roadmap A priority · which blocker it clears · which
   phase-transition condition it improves · what the risk of NOT doing it is · why its ROI beats the
   other pending tasks. If it is NOT the highest-ROI task, explain why it was done anyway.
1. **Goal** — "what was I asked to do?" (≤5 lines).
2. **What changed** — exactly which files were created / modified / deleted; for large files, name
   the affected modules.
3. **Architectural decisions** — THE MOST IMPORTANT: why A instead of B, why not refactor yet, why
   test first, why keep backward compatibility, what was postponed and why.
4. **Assumptions** — every assumption relied on (API unchanged, version always increases, one active
   session…). None → "Không có."
5. **New risks** — risks NEWLY created by this change. None → "Không có."
6. **Remaining blockers** — what still blocks the current stage (≤10 lines).
7. **Roadmap impact** — score EACH: God File · Duplication · Tests · Sync · Technical debt · AI Coach
   stability, on the scale: no effect / slight improvement / improvement / complete.
8. **Confidence** — a percentage; BELOW 90% must be explained.
9. **Questions for the Technical Advisor** — ≤5 open architectural questions. None → "Không có."
10. **Proposed next task** — exactly ONE task (not a list): why it matters most · which Phase A
    condition it advances · what completing it unlocks. Several equal candidates → state the
    trade-offs, then PICK ONE.

⚠️ **Since 2026-09-06 this 11-point report is written ONLY for architecture / infrastructure /
Supabase-sync / database / AI Coach / deploy / security / large-refactor / incident tasks.** Small
fixes and 3D art phases use the 5-line report in `PHASE_RULES.md` §6. Never write both for one task.

---

## AI ENGINEERING PLAYBOOK (operating manual, 2026-07-12)

> This is the STANDARD working process for every AI taking over this project (Claude Code / Codex /
> ChatGPT…). The Governance Protocol above governs *"are the docs in sync with the code"*; this
> section governs *"how an AI executes ONE task, step by step"*. The two never repeat each other —
> where they would overlap, this section points upward instead of copying ("Composition over
> Duplication", below).

### Philosophy
Do not optimise for finishing fast — optimise for being maintainable for years. Given several
solutions, prefer the one that is simpler, easier to maintain, less coupled, carries less debt, and
fits the existing architecture better. The AI's role here is not just "the one who writes code" — it
is simultaneously Senior Engineer, Software Architect, Reviewer, QA Engineer, Technical Writer and
Maintainer.

### The standard 7 stages (never skipped without a specific reason)
1. **Understand the request** — identify the task type (Feature / Bug Fix / Refactor / Performance /
   Documentation / Architecture / Infrastructure / AI / Database / Deployment) and its full blast
   radius BEFORE writing a line of code.
2. **Audit** — how does the module work today? does a similar abstraction/helper/util already exist?
   is there a pattern the project already uses? any related ADR / tech debt / old bug (see
   `ARCHITECTURE_DECISIONS.md` / `TECH_DEBT.md`)? Prefer reusing what exists over writing new.
3. **Design** — small changes: just do them. Medium/large: analyse scope / impact / dependencies /
   migration / rollback / test strategy FIRST. Architectural impact → add an entry to
   `ARCHITECTURE_DECISIONS.md` (following the existing ADR format).
4. **Implement** — do not copy logic, do not create an abstraction that duplicates an existing one,
   do not add coupling or complexity without need. Duplicates / dead code / inconsistent naming /
   misplaced responsibility found along the way → fix them NOW if low/medium risk, do not defer.
5. **Self review** — logic / naming / readability / maintainability / architecture / performance /
   security / consistency, BEFORE committing.
6. **Validation** — always build + lint + test. Tasks touching API / Database / Sync / Notification /
   AI / Deployment / Realtime must exercise the WHOLE relevant flow, not just the edited file.
7. **Knowledge update** — use the "change type → doc to update" table in the Governance Protocol
   above (not repeated here).

### Process by task type
- **Feature**: Audit → Design → Impact assessment → Code → Test → Documentation → Knowledge update.
- **Bug Fix**: Reproduce → Root cause analysis → Fix → Regression test → Lesson learned → Knowledge
  update. **Fix the root cause, never the symptom** — as applied to every production incident in this
  project's history (see `AI_HANDOFF_KNOWLEDGE.md` part 11).
- **Refactor**: Audit → Risk analysis → Refactor plan → Refactor → Regression test → Architecture
  review → Documentation.
- **Architecture change**: DO NOT implement immediately — assess, analyse trade-offs, weigh options,
  and write `ARCHITECTURE_DECISIONS.md` FIRST, then change.

### Architectural rules (always preferred)
Single Responsibility · High Cohesion · Low Coupling · Reuse over Rewrite · Composition over
Duplication · Explicit over Implicit. **Never sacrifice architecture for speed of completion.**

### Rule about AI: no assumptions, no inference
Not sure → check the source code. Source not enough → read the docs. Docs not enough → **STATE what
is missing**; never guess and present it as fact. This is exactly the anti-hallucination principle
applied to the AI Coach (`src/engine/coach/guard.js`, see `ARCHITECTURE.md` §3) — applied here to the
AI writing the code, not just to the app's Coach.

### Review rules (in addition to the Self-audit above)
Beyond the Self-audit checklist, before finishing ask: is there a new ADR to write? a migration to
record? a lesson learned to capture? If yes → handle it before finishing, never leave it to the next
session.

### Commit rules
Every commit: one clear goal, one clear scope, NO unrelated changes mixed in, independently
revertable. Never create a commit just because it is convenient.

### Continuous improvement
After each task ask: is the project now cleaner / less indebted / less duplicated / less coupled /
better documented / easier for the next AI to take over than BEFORE you started? If no → consider a
few low-risk improvements before finishing. Success is not measured in lines of code written — it is
measured by the project being clearer, more stable and easier to grow after every session.
