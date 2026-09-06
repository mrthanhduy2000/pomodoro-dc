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
 * 8% sits between them with ~2x headroom on both sides. Paragraphs under 200 chars are ignored —
 * a short quoted line is allowed to be pure Vietnamese.
 */
export const VI_PARAGRAPH_LIMIT = 0.08
export const MIN_PARAGRAPH_CHARS = 200

/** Reference docs: no limit, but printed so their cost is never invisible. */
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
  'MIGRATION.md',
  'AI_ONBOARDING.md',
  'README.md',
  // Frozen archives. Listed so their cost is visible: the 2026-08-24 one alone is ~282k tokens,
  // larger than an entire 200k context window, and nothing else would ever warn about it.
  'docs/archive/BAN_GIAO_ARCHIVE_2026-08-24.md',
  'docs/archive/START_HERE_LOG_2026-09-06.md',
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

/** Paragraphs long enough to judge, that read as Vietnamese rather than English. */
export function viParagraphs(file) {
  const s = read(file)
  if (s === null) return []
  return s
    .split(/\n\s*\n/)
    .filter((p) => p.length >= MIN_PARAGRAPH_CHARS)
    .map((p) => ({ ratio: (p.match(VI_LETTERS)?.length ?? 0) / p.length, head: p.slice(0, 70).replace(/\n/g, ' ') }))
    .filter((p) => p.ratio > VI_PARAGRAPH_LIMIT)
}

/** Token estimate, picking the ratio that matches the language actually used in the file. */
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

/** Auto-loaded files containing a Vietnamese passage. Empty = gate green. */
export function wrongLanguage() {
  return Object.keys(BUDGETS)
    .map((file) => ({ file, paras: viParagraphs(file) }))
    .filter((r) => r.paras.length > 0)
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
    const warn = pct >= 100 ? '  ⚠️ one cat = BLOWS a 200k window'
      : pct >= 50 ? '  ⚠️ time to freeze older parts into docs/archive/' : ''
    console.log('  ' + file.padEnd(34) + fmt(n).padStart(10) + fmt(tokens(file)).padStart(9) +
      '  ' + pct.toFixed(1).padStart(6) + '%' + warn)
  }
  console.log('\n  → TOTAL docs: ' + fmt(total) + ' chars ≈ ' + fmt(totalTok) + ' tokens = ' +
    ((totalTok / 200000) * 100).toFixed(0) + '% of a 200k window\n')

  if (over.length || wrong.length) {
    if (over.length) {
      console.error('❌ OVER LIMIT: ' + over.map((r) => `${r.file} (${fmt(r.size)}/${fmt(r.limit)})`).join(' · '))
      console.error('   Fix: SPLIT into a docs/ topic file and leave one pointer line. Do not raise the limit, do not delete knowledge.')
    }
    if (wrong.length) {
      for (const r of wrong) {
        console.error(`❌ NOT ENGLISH: ${r.file} — ${r.paras.length} Vietnamese paragraph(s)`)
        for (const p of r.paras) console.error(`     ${(p.ratio * 100).toFixed(1)}%  ${p.head}…`)
      }
      console.error('   Fix: auto-loaded docs are English (CLAUDE.md §LANGUAGE RULE). Vietnamese costs ~2.3× the tokens.')
    }
    console.error('')
    return 1
  }
  console.log('✅ All auto-loaded files are within limits and in English.\n')
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
