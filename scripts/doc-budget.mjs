#!/usr/bin/env node
/**
 * doc-budget — the token budget guard for DOCUMENTATION.
 *
 * Why this exists (2026-09-06): project docs reached 2.65M chars ≈ 1.5M tokens = 775% of a 200k
 * context window. One `cat TECH_DEBT.md` is 252k tokens — it blows the window in a single command.
 * The limits written in `CLAUDE.md`/`START_HERE.md` were only sentences that nobody enforced, so
 * `START_HERE.md` silently blew its own limit (20,200 / 20,000) and no session noticed.
 * Project lesson: "a threshold with no guard is a funnel".
 *
 * ⚠️ MEASUREMENT UNIT — read before touching any number here.
 * Counting is done in UNICODE CHARS via JS `String.length`, NOT `wc -c` and NOT Python `len()`:
 *   - `wc -c` counts BYTES. Vietnamese diacritics are 2–3 bytes/char, so it inflates ~21%
 *     (CLAUDE.md once measured 37,220 chars but 45,011 bytes — nearly a false "over the limit").
 *   - Python `len()` counts code points; JS counts UTF-16 code units, so astral emoji (🗺️ 🎨 🏙️)
 *     differ by one per emoji. The guard is JS, so JS is the unit of record.
 *
 * ⚠️ TOKEN ESTIMATES are exactly that — estimates:
 *   - Vietnamese: 1.723 chars/token. MEASURED, one real data point — the harness reported 21,600
 *     tokens for a 37,220-char CLAUDE.md.
 *   - English: 4.0 chars/token. NOT measured in this project; it is the widely-known BPE ballpark.
 *     Verify by opening a fresh session and reading "Memory files" in /context.
 * Limits are therefore enforced in CHARS (exactly countable), never in estimated tokens.
 *
 *   node scripts/doc-budget.mjs            → full table, exit 1 if anything is over
 *   node scripts/doc-budget.mjs --map F    → headings + line ranges of F (read lines, don't cat)
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export const CHARS_PER_TOKEN_VI = 1.723
export const CHARS_PER_TOKEN_EN = 4.0

/** Vietnamese-specific letters. Used to tell a Vietnamese doc from an English one. */
const VI_LETTERS =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi

/**
 * Limits for files that are AUTO-LOADED or REQUIRED every session — the only ones multiplied by
 * session count. Reference docs are allowed to be huge; their rule is "never cat", not "stay small".
 * Sized for ENGLISH (~4 chars/token): 16,000 chars ≈ 4,000 tokens. The same limit in Vietnamese
 * would cost ~9,300 tokens, which is precisely why the language rule exists.
 */
export const BUDGETS = {
  'CLAUDE.md': 16000,
  'START_HERE.md': 16000,
  'PHASE_RULES.md': 8000,
  'AGENTS.md': 3500,
}

/**
 * Language gate: auto-loaded docs must be written in English (`CLAUDE.md` §LANGUAGE RULE).
 *
 * ⚠️ Measured PER PARAGRAPH, not per file. The first version of this gate used a whole-file ratio
 * and FAILED its own break-test: pasting a Vietnamese paragraph into `CLAUDE.md` moved the file
 * ratio from 0.21% to only 0.59% — diluted by 15,000 English chars, far under any useful threshold.
 * That is the project law "before trusting a ratio, ask whether the denominator contains things
 * outside the question": the question is "is any PASSAGE written in Vietnamese", so the denominator
 * must be a passage, not the file.
 *
 * Thresholds from real measurement on 2026-09-06:
 *   - English paragraphs quoting Đàm verbatim (the legitimate case): max 4.21%.
 *   - Genuinely Vietnamese paragraphs (from TECH_DEBT.md): 13.95–15.69%.
 * 8% sits between them with ~2x headroom on both sides. Windows under 200 chars are ignored —
 * a short quoted line is allowed to be pure Vietnamese.
 */
export const VI_PARAGRAPH_LIMIT = 0.08
export const MIN_PASSAGE_CHARS = 200

/**
 * Rotation limits for ACTIVE journals (ADR-075). These two grow by design — `BAN_GIAO.md` gains
 * ~17,700 chars/day — and `PHASE_RULES.md` §5 already required rotating the old part into
 * `docs/archive/`. That rule existed for weeks while the files reached 70-78% of a context window,
 * because nothing enforced it. These limits are deliberately generous (roughly 2x their size after
 * the 2026-09-06 rotation): crossing one means ROTATE the oldest entries into `docs/archive/`,
 * never raise the limit.
 */
export const ACTIVE_DOC_LIMITS = {
  'BAN_GIAO.md': 120000,
  'CHANGELOG.md': 120000,
}

/** Active journals that have grown past their rotation limit. Empty = gate green. */
export function needsRotation() {
  return Object.entries(ACTIVE_DOC_LIMITS)
    .map(([file, limit]) => ({ file, limit, size: chars(file) }))
    .filter((r) => r.size !== null && r.size > r.limit)
}

/**
 * Hard ceiling for ANY reference doc, active or archived: it must fit inside one context window.
 * A file larger than the window cannot be read in a session at all — `docs/archive/BAN_GIAO_ARCHIVE
 * _2026-08-24.md` was 141% of a 200k window until 2026-09-06 and nobody could have opened it safely.
 * Expressed in TOKENS, so it uses the language-aware estimate (English ~4 chars/token, Vietnamese
 * 1.723); the estimate is documented at the top of this file and is the weakest link in this gate.
 * Crossing it means SPLIT the file — never raise the ceiling.
 */
export const REFERENCE_CEILING_TOKENS = 200000

/** Reference docs whose estimated size exceeds one context window. Empty = gate green. */
export function oversizedReferences() {
  return REFERENCE_DOCS
    .map((file) => ({ file, tok: tokens(file) }))
    .filter((r) => r.tok !== null && r.tok > REFERENCE_CEILING_TOKENS)
}

/** Reference docs: no per-file limit below the ceiling, but printed so their cost is never invisible. */
export const REFERENCE_DOCS = [
  'TECH_DEBT.md',
  'ARCHITECTURE_DECISIONS.md',
  'CHANGELOG.md',
  'docs/LESSONS_3D.md',
  'BAN_GIAO.md',
  'PERFORMANCE.md',
  'PROJECT_STRUCTURE.md',
  'AI_HANDOFF_KNOWLEDGE.md',
  'ARCHITECTURE.md',
  'docs/GOVERNANCE.md',
  'docs/OPERATIONS.md',
  'docs/AI_COACH.md',
  'docs/TECH_DEBT_3D.md',
  'docs/UI_INVARIANTS.md',
  'MIGRATION.md',
  'AI_ONBOARDING.md',
  'README.md',
  // Frozen archives. Listed so their cost is visible: the 2026-08-24 one alone is ~282k tokens,
  // larger than an entire 200k context window, and nothing else would ever warn about it.
  'docs/archive/BAN_GIAO_ARCHIVE_2026-08-24.md',
  'docs/archive/START_HERE_LOG_2026-09-06.md',
  'docs/archive/TECH_DEBT_CLOSED_2026-09-06.md',
  'docs/archive/ADR_ARCHIVE_001-050.md',
]

const read = (file) => {
  const p = resolve(ROOT, file)
  return existsSync(p) ? readFileSync(p, 'utf8') : null
}

export function chars(file) {
  const s = read(file)
  return s === null ? null : s.length
}

/** Whole-file share of Vietnamese letters. Display only — see VI_PARAGRAPH_LIMIT for why. */
export function viRatio(file) {
  const s = read(file)
  if (s === null || s.length === 0) return null
  return (s.match(VI_LETTERS)?.length ?? 0) / s.length
}

/** Token estimate, using the coefficient that matches the language the file is actually written in. */
export function tokens(file) {
  const n = chars(file)
  if (n === null) return null
  const r = viRatio(file)
  return Math.round(n / (r > 0.05 ? CHARS_PER_TOKEN_VI : CHARS_PER_TOKEN_EN))
}

/** Files past their char limit. Empty = gate green. */
export function overBudget() {
  return Object.entries(BUDGETS)
    .map(([file, limit]) => ({ file, limit, size: chars(file) }))
    .filter((r) => r.size !== null && r.size > r.limit)
}

/**
 * Passages long enough to judge that read as Vietnamese rather than English.
 *
 * ⚠️ Scans a SLIDING WINDOW OF LINES, not blank-line paragraphs. The blank-line version failed its
 * own break-test on 2026-09-06: text appended without a blank line in front merges into the previous
 * English paragraph and its ratio is diluted below the threshold. Two dilution bugs in one day, both
 * the same law — *check what the denominator actually contains*. A line window cannot be widened by
 * an author's whitespace habits.
 *
 * Window: consecutive lines accumulated to >= MIN_PASSAGE_CHARS (capped at MAX_WINDOW_LINES), then
 * advanced one line at a time, so an inserted block is measured against itself, not against the page.
 */
export const MAX_WINDOW_LINES = 8

export function viParagraphs(file) {
  const body = read(file)
  if (body === null) return []
  const lines = body.split('\n')
  const hits = []
  for (let i = 0; i < lines.length; i++) {
    let text = ''
    for (let j = i; j < Math.min(i + MAX_WINDOW_LINES, lines.length); j++) {
      text += lines[j] + ' '
      if (text.length < MIN_PASSAGE_CHARS) continue
      const ratio = (text.match(VI_LETTERS)?.length ?? 0) / text.length
      if (ratio > VI_PARAGRAPH_LIMIT) {
        hits.push({ ratio, line: i + 1, head: text.slice(0, 70).replace(/\s+/g, ' ') })
        i = j // do not report the same block eight more times
      }
      break
    }
  }
  return hits
}

/** Auto-loaded files containing a Vietnamese passage. Empty = gate green. */
export function wrongLanguage() {
  return Object.keys(BUDGETS)
    .map((file) => ({ file, paras: viParagraphs(file) }))
    .filter((r) => r.paras.length > 0)
}

/**
 * Canonical-rule gate (ADR-075). Rules must live in exactly ONE auto-loaded file.
 *
 * `CLAUDE.md` is the single source of truth for rules, infrastructure and routing; `START_HERE.md`
 * holds project STATE. Before 2026-09-06 both restated the same operating laws, and the failure that
 * predicts is already in this project's history: `START_HERE.md` once carried the merge rule
 * BACKWARDS ("never merge main yourself") while `CLAUDE.md` said the opposite. A summary that drifts
 * from the rule is worse than no summary, so duplication is now a test failure, not a style opinion.
 *
 * Each entry is a phrase that identifies one operating law, plus the file that owns it.
 */
export const CANONICAL_RULES = [
  { owner: 'CLAUDE.md', phrase: 'Only `main` reaches production' },
  { owner: 'CLAUDE.md', phrase: '12 Serverless Functions' },
  { owner: 'CLAUDE.md', phrase: 'api/_tests/' },
  { owner: 'CLAUDE.md', phrase: 'compare-and-swap' },
  { owner: 'CLAUDE.md', phrase: 'GEMINI_API_KEY' },
  { owner: 'CLAUDE.md', phrase: 'DC_CROSS_SLOW' },
  { owner: 'CLAUDE.md', phrase: 'ASK BEFORE ACTING' },
]

/** Auto-loaded files that restate a rule owned by another file. Empty = gate green. */
export function duplicatedRules() {
  const found = []
  for (const { owner, phrase } of CANONICAL_RULES) {
    for (const file of Object.keys(BUDGETS)) {
      if (file === owner) continue
      const body = read(file)
      if (body && body.includes(phrase)) found.push({ file, owner, phrase })
    }
  }
  return found
}

/**
 * Pointer gate (ADR-075). A doc reference that points at a path which does not exist sends the next
 * session hunting and burns context for nothing — the exact waste TECH_DEBT #101 recorded (47 stale
 * "see CLAUDE.md" pointers after the split). Scans auto-loaded docs for markdown-ish file paths and
 * asserts each one resolves. Only `.md` paths are checked; code paths move too often to pin here.
 *
 * EXTERNAL_DOCS are referenced on purpose but live outside the repo, in Đàm's local Claude memory
 * folder (`~/.claude/projects/.../memory/`). `CLAUDE.md` §PRIORITY RULE #1 already states that web
 * sessions have no such folder, so these must not be reported as broken.
 */
export const EXTERNAL_DOCS = new Set([
  'upgrade-roadmap.md', 'ui-review-2026-06.md', 'resonance-update.md', 'ask-before-acting.md',
])
export function brokenPointers() {
  const seen = []
  for (const file of Object.keys(BUDGETS)) {
    const body = read(file)
    if (!body) continue
    for (const m of body.matchAll(/`([A-Za-z0-9_./-]+\.md)`/g)) {
      const target = m[1]
      if (target.includes('*') || EXTERNAL_DOCS.has(target)) continue
      if (!existsSync(resolve(ROOT, target))) seen.push({ file, target })
    }
  }
  return seen
}

const bar = (pct) => '█'.repeat(Math.min(20, Math.round(pct / 5))) + '·'.repeat(Math.max(0, 20 - Math.round(pct / 5)))
const fmt = (n) => n.toLocaleString('en-US')

function report() {
  const over = overBudget()
  const wrong = wrongLanguage()

  console.log('\nAUTO-LOADED / REQUIRED EVERY SESSION — hard limits\n')
  console.log('  file'.padEnd(20) + 'chars'.padStart(8) + 'limit'.padStart(8) + '~tok'.padStart(7) + '  VN%' + '   used')
  let perSession = 0
  for (const [file, limit] of Object.entries(BUDGETS)) {
    const n = chars(file)
    if (n === null) { console.log('  ' + file.padEnd(18) + '(missing)'); continue }
    perSession += n
    const pct = (n / limit) * 100
    const vr = viRatio(file) * 100
    console.log(
      '  ' + file.padEnd(18) + fmt(n).padStart(8) + fmt(limit).padStart(8) + fmt(tokens(file)).padStart(7) +
      '  ' + vr.toFixed(2).padStart(5) + '  ' + bar(pct) + ' ' + pct.toFixed(0).padStart(3) + '%' +
      (n > limit ? '  ❌ OVER' : '') + (viParagraphs(file).length ? '  ❌ NOT ENGLISH' : '')
    )
  }
  const perSessionTok = Object.keys(BUDGETS).reduce((s, f) => s + (tokens(f) ?? 0), 0)
  console.log('\n  → each session carries ' + fmt(perSession) + ' chars ≈ ' + fmt(perSessionTok) +
    ' tokens = ' + ((perSessionTok / 200000) * 100).toFixed(1) + '% of a 200k window')

  console.log('\nREFERENCE — no limit, but ❌ NEVER `cat`; use `grep -n` / `sed -n` / `head`\n')
  console.log('  file'.padEnd(36) + 'chars'.padStart(10) + '~tok'.padStart(9) + '  % of 200k')
  let total = perSession
  let totalTok = perSessionTok
  const rows = REFERENCE_DOCS.map((f) => [f, chars(f)]).filter(([, n]) => n !== null).sort((a, b) => b[1] - a[1])
  for (const [file, n] of rows) {
    total += n
    totalTok += tokens(file)
    const pct = (tokens(file) / 200000) * 100
    // Warning thresholds (TECH_DEBT #103) — reference docs may be large, so this warns, never blocks.
    const isArchive = file.startsWith('docs/archive/')
    const warn = pct >= 100 ? '  ❌ LARGER THAN A CONTEXT WINDOW — split it'
      : isArchive ? '  📚 archive — grep / --map only'
      : pct >= 50 ? '  ⚠️ approaching: freeze older parts into docs/archive/' : ''
    console.log('  ' + file.padEnd(34) + fmt(n).padStart(10) + fmt(tokens(file)).padStart(9) +
      '  ' + pct.toFixed(1).padStart(6) + '%' + warn)
  }
  console.log('\n  → TOTAL docs: ' + fmt(total) + ' chars ≈ ' + fmt(totalTok) + ' tokens = ' +
    ((totalTok / 200000) * 100).toFixed(0) + '% of a 200k window\n')

  const dup = duplicatedRules()
  const broken = brokenPointers()
  const huge = oversizedReferences()
  const rot = needsRotation()
  if (over.length || wrong.length || dup.length || broken.length || huge.length || rot.length) {
    if (over.length) {
      console.error('❌ OVER LIMIT: ' + over.map((r) => `${r.file} (${fmt(r.size)}/${fmt(r.limit)})`).join(' · '))
      console.error('   Fix: SPLIT into a docs/ topic file and leave one pointer line. Do not raise the limit, do not delete knowledge.')
    }
    if (wrong.length) {
      for (const r of wrong) {
        console.error(`❌ NOT ENGLISH: ${r.file} — ${r.paras.length} Vietnamese paragraph(s)`)
        for (const p of r.paras) console.error(`     ${(p.ratio * 100).toFixed(1)}%  ${p.head}…`)
      }
      console.error('   Fix: auto-loaded docs are English (CLAUDE.md §LANGUAGE RULE). Vietnamese costs ~2.3x the tokens.')
    }
    if (dup.length) {
      for (const d of dup) console.error(`❌ DUPLICATED RULE: ${d.file} restates "${d.phrase}" owned by ${d.owner}`)
      console.error('   Fix: keep the rule in its owner and leave a pointer. Two copies always drift.')
    }
    if (broken.length) {
      for (const b of broken) console.error(`❌ BROKEN POINTER: ${b.file} → ${b.target} does not exist`)
    }
    if (rot.length) {
      for (const r of rot) console.error(`❌ NEEDS ROTATION: ${r.file} ${fmt(r.size)} chars > ${fmt(r.limit)} limit`)
      console.error('   Fix: move the oldest entries into docs/archive/ (PHASE_RULES §5). Do not raise the limit.')
    }
    if (huge.length) {
      for (const h of huge) console.error(`❌ LARGER THAN A CONTEXT WINDOW: ${h.file} ≈ ${fmt(h.tok)} tokens`)
      console.error('   Fix: SPLIT the file (a date or number boundary). It cannot be read in one session as it is.')
    }
    console.error('')
    return 1
  }
  console.log('✅ Limits, language, canonical rules, pointers and file sizes all clean.\n')
  return 0
}

/** Table of contents, so a session can `sed -n 'A,Bp'` instead of `cat`. */
function map(file) {
  const s = read(file)
  if (s === null) { console.error('No such file: ' + file); return 1 }
  const lines = s.split('\n')
  const heads = []
  lines.forEach((l, i) => { if (/^#{1,4} /.test(l)) heads.push({ line: i + 1, text: l }) })
  console.log(`\n${file} — ${fmt(lines.length)} lines · ${fmt(s.length)} chars ≈ ${fmt(tokens(file))} tokens\n`)
  heads.forEach((h, i) => {
    const end = i + 1 < heads.length ? heads[i + 1].line - 1 : lines.length
    console.log(String(h.line).padStart(6) + '-' + String(end).padEnd(6) + ' ' + h.text.slice(0, 96))
  })
  console.log(`\nRead one section: sed -n 'A,Bp' ${file}   (never cat the whole file)\n`)
  return 0
}

if (process.argv[1] && process.argv[1].endsWith('doc-budget.mjs')) {
  const i = process.argv.indexOf('--map')
  process.exit(i !== -1 ? map(process.argv[i + 1]) : report())
}
