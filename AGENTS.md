# AGENTS.md — entry point for Codex and other AI agents

> **This file contains no rules.** Every rule, technical context, Governance Protocol and
> Engineering Playbook lives in **`CLAUDE.md`** — the single source of truth for this project,
> applying to EVERY AI (Claude Code, Codex, ChatGPT…), not just Claude.

## Do this first, every session
1. **Read `START_HERE.md`** — where we are, what is next, the 6 laws that bite. The only required file.
2. **Read `CLAUDE.md`** — rules, token budget, traps already paid for. (Claude Code auto-loads it;
   Codex must open it.)
3. `PHASE_RULES.md` if you are inside a phase. Then `grep` only what the task needs.

No code changes before those two are read.

## ❌ Never `cat` the reference files
`TECH_DEBT.md` is **252k tokens = 126% of a 200k context window in ONE command**;
`ARCHITECTURE_DECISIONS.md` 226k · `CHANGELOG.md` 154k · `BAN_GIAO.md` 136k (`head -60` only).
Use `grep -n`, `sed -n 'A,Bp'`, or `node scripts/doc-budget.mjs --map <file>` for a table of contents.
Run `node scripts/doc-budget.mjs` to see the whole budget.

⚠️ **Corrected 2026-09-06:** an earlier version of this file said *"read `BAN_GIAO.md` in full"* —
a 136,000-token instruction in the second sentence of a session, contradicting `PHASE_RULES.md` §5
(*"read only the first 60 lines, never whole"*).

## Language
**Docs, code, comments and commits: English** (Vietnamese costs ~2.3× the tokens for the same
meaning). **Replies to Đàm: Vietnamese** — he is a non-coder; be plain, use concrete numbers.

## Why this file is only a pointer (never copy `CLAUDE.md` content here)
Before 2026-08-05 `AGENTS.md` was a verbatim 288-line copy of `CLAUDE.md` with "Claude" mechanically
replaced by "Codex". The result:
- Nonsense sentences: *"dùng Codex + Codex để code"*, *"Hỏi Codex"* (a removed feature).
- **Paths that never existed**: `.Codex/session-start-bangiao.sh`, `/Users/damduy/.Codex/projects/…`
  (the real folder is `.claude/`). An AI reading that goes hunting for nothing.
- **It drifted within 5 days**: by 2026-08-05 it was missing the entire "Mac menu bar traps" section,
  so Codex would not know those traps and would step on them again.

That is exactly what this project's own rule forbids: **Composition over Duplication**. One copy only.
**Change a rule → change `CLAUDE.md`. Never copy anything back into this file.**

## The three most dangerous things
- ❌ **Never start a focus session on dev/localhost** — dev shares the production Supabase row and
  will overwrite Đàm's real data. This loss is unrecoverable.
- ⚠️ **A "research / investigate / give me your opinion" instruction** → analyse and STOP. No code, no
  commit, no deploy. Ambiguous phrasing counts as research: ask first.
- ⚠️ **Push = production deploy** (Vercel ships to all of Đàm's devices) — but only from `main`;
  other branches produce Preview builds only.
