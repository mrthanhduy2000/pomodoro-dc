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
 *   node scripts/doc-budget.mjs --rotate F [--dry] [--force] → move a log's old entries into docs/archive/
 *   node scripts/doc-budget.mjs --rotate-all [--dry]
 */
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, relative } from 'node:path'

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
export const ROTATION_LIMITS = {
  'BAN_GIAO.md': 120000,
  'CHANGELOG.md': 120000,
  'TECH_DEBT.md': 120000,
  'ARCHITECTURE_DECISIONS.md': 250000,
}

/**
 * ROTATION ENGINE (ADR-076 addendum, 2026-09-07). A red rotation gate used to say "move old entries
 * to docs/archive/" and leave the HOW to the next session — which then had to measure, read, and
 * write a one-off script. Đàm's requirement: *"nếu file phình to thì cũng tự biết giải quyết"*.
 * So the fix is a command: `node scripts/doc-budget.mjs --rotate <file>` (or `--rotate-all`).
 *
 * Each append-only log declares how its entries are delimited and how they are ordered. Rotation
 * keeps the newest entries until the file is back under KEEP_RATIO of its limit, moves the rest
 * VERBATIM into a new dated file under docs/archive/, and leaves a title index behind. A fresh dated
 * archive per rotation means no archive file can ever grow past one context window either.
 * TECH_DEBT is the exception: only entries whose own title says closed are moved; open debts need a
 * human to decide (split by subsystem, like docs/TECH_DEBT_3D.md), so the tool says so and stops.
 */
export const KEEP_RATIO = 0.6

export const JOURNALS = {
  'BAN_GIAO.md': {
    entry: /^> (?:Last update|Cập nhật lần cuối)/m,
    // journal blocks come first; structural "## " sections after them must stay in place
    tailStart: /^## /m,
    order: 'newest-first',
    title: (b) => b.split('\n')[0].replace(/^> /, '').slice(0, 120),
  },
  'CHANGELOG.md': {
    entry: /^## \d{4}-\d{2}-\d{2}/m,
    tailStart: /^## Ghi chú vận hành/m,
    order: 'newest-first',
    title: (b) => b.split('\n')[0].replace(/^## /, ''),
  },
  'ARCHITECTURE_DECISIONS.md': {
    entry: /^## ADR-\d+/m,
    tailStart: null,
    order: 'newest-first',
    title: (b) => b.split('\n')[0].replace(/^## /, ''),
  },
  'TECH_DEBT.md': {
    entry: /^## #\d+/m,
    tailStart: null,
    order: 'closed-only',
    closed: /✅|RESOLVED|ĐÃ ĐÓNG|ĐÃ XỬ LÝ|HẾT ĐỐI TƯỢNG/,
    partial: /PHẦN LỚN|MỘT PHẦN|PARTIAL/,
    title: (b) => b.split('\n')[0].replace(/^## /, ''),
  },
}

/** Split a log into { head, entries[], tail } using its declared delimiters. Pure. */
export function splitLog(text, spec) {
  const first = text.search(spec.entry)
  if (first < 0) return { head: text, entries: [], tail: '' }
  let tailAt = text.length
  if (spec.tailStart) {
    const rest = text.slice(first)
    const t = rest.search(spec.tailStart)
    if (t >= 0) tailAt = first + t
  }
  const body = text.slice(first, tailAt)
  const starts = [...body.matchAll(new RegExp(spec.entry.source, 'gm'))].map((m) => m.index)
  const entries = starts.map((st, i) => body.slice(st, i + 1 < starts.length ? starts[i + 1] : body.length))
  return { head: text.slice(0, first), entries, tail: text.slice(tailAt) }
}

/** Decide what stays and what moves. Pure — returns { keep, move, reason }. */
export function planRotation(text, spec, limit) {
  const { head, entries, tail } = splitLog(text, spec)
  const target = Math.floor(limit * KEEP_RATIO)
  if (spec.order === 'closed-only') {
    const move = entries.filter((e) => { const t = e.split('\n')[0]; return spec.closed.test(t) && !spec.partial.test(t) })
    const keep = entries.filter((e) => !move.includes(e))
    const after = head.length + tail.length + keep.reduce((a, e) => a + e.length, 0)
    return { head, tail, keep, move, after,
      reason: after > limit ? 'still over the limit after moving closed entries: the remaining debts are OPEN — split them by subsystem by hand (see docs/TECH_DEBT_3D.md for the pattern)' : null }
  }
  let size = head.length + tail.length
  const keep = []
  const move = []
  for (const e of entries) {
    if (size + e.length <= target || keep.length === 0) { keep.push(e); size += e.length } else move.push(e)
  }
  return { head, tail, keep, move, after: size, reason: null }
}

function rotateOne(file, { dry = false, force = false } = {}) {
  const spec = JOURNALS[file]
  if (!spec) { console.error(`Not a rotating log: ${file}. Known: ${Object.keys(JOURNALS).join(', ')}`); return 1 }
  const limit = ROTATION_LIMITS[file]
  const text = read(file)
  // Rotate only when the gate would be red; --force trims proactively to KEEP_RATIO.
  if (text.length <= limit && !force) { console.log(`${file}: under its limit (${fmt(text.length)} / ${fmt(limit)}) — nothing to do; add --force to trim anyway`); return 0 }
  const plan = planRotation(text, spec, limit)
  if (plan.move.length === 0) { console.log(`${file}: nothing to rotate (${fmt(text.length)} chars, limit ${fmt(limit)})`); return plan.reason ? 1 : 0 }
  const date = new Date().toISOString().slice(0, 10)
  const base = file.replace(/\.md$/, '')
  let arc = `docs/archive/${base}_${date}.md`
  for (let k = 2; existsSync(resolve(ROOT, arc)); k++) arc = `docs/archive/${base}_${date}_${k}.md`
  const titles = plan.move.map((e) => `- ${spec.title(e)}`).join('\n')
  console.log(`${file}: ${fmt(text.length)} → ${fmt(plan.after)} chars (limit ${fmt(limit)}) · moving ${plan.move.length} of ${plan.keep.length + plan.move.length} entries → ${arc}`)
  if (dry) { console.log(titles); return 0 }
  const archiveText = `# ${base} — rotated ${date} (ADR-076)\n\n> ${plan.move.length} entries moved VERBATIM out of \`${file}\` by \`node scripts/doc-budget.mjs --rotate ${file}\`. Nothing was rewritten or deleted. Index without reading: \`node scripts/doc-budget.mjs --map ${arc}\`\n\n---\n\n` + plan.move.join('')
  const index = `## 📚 Rotated ${date} → [\`${arc}\`](${arc})\n\n${plan.move.length} entries moved verbatim (ADR-076); nothing deleted. Find one: \`grep -n '<title>' ${arc}\`.\n\n<details><summary>Titles</summary>\n\n${titles}\n\n</details>\n\n---\n\n`
  writeFileSync(resolve(ROOT, arc), archiveText)
  // The index sits where the moved entries were: at the end of the kept run for newest-first logs
  // (so `head -60` still shows the newest entry), right after the header for closed-only logs.
  const body = spec.order === 'closed-only' ? index + plan.keep.join('') : plan.keep.join('') + index
  writeFileSync(resolve(ROOT, file), plan.head + body + plan.tail)
  if (plan.reason) { console.error(`⚠️ ${file}: ${plan.reason}`); return 1 }
  return 0
}

/** Active journals that have grown past their rotation limit. Empty = gate green. */
export function needsRotation() {
  return Object.entries(ROTATION_LIMITS)
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
  return discoverDocs()
    .map((file) => ({ file, tok: tokens(file) }))
    .filter((r) => r.tok !== null && r.tok > REFERENCE_CEILING_TOKENS)
}

/**
 * DISCOVERY (ADR-076). Every gate used to run off a hand-written list, so a document created by a
 * later session was invisible to all of them — the exact way this repository grew to 2.7M chars in
 * the first place. Documents are now DISCOVERED and classified by PATH CONVENTION, so a file that
 * does not exist yet is already governed:
 *
 *   docs/archive/**            → archive   : frozen history; capped only by the context window
 *   CLAUDE/START_HERE/PHASE_RULES/AGENTS → autoloaded : explicit small limits (BUDGETS)
 *   append-only journals       → journal   : rotation limit, must shed old entries into docs/archive/
 *   everything else *.md       → active    : capped by the context window, warned at half of it
 *
 * Nothing to remember, nothing to add when a new document appears.
 */
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', '.vercel'])

export function discoverDocs(dir = ROOT, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') && e.name !== '.github') continue
    const full = resolve(dir, e.name)
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) discoverDocs(full, out)
    } else if (e.name.endsWith('.md')) {
      out.push(relative(ROOT, full))
    }
  }
  return out.sort()
}

export function classify(file) {
  if (file.startsWith('docs/archive/')) return 'archive'
  if (file in BUDGETS) return 'autoloaded'
  if (file in ROTATION_LIMITS) return 'journal'
  return 'active'
}

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

  const discovered = discoverDocs().filter((f) => classify(f) !== 'autoloaded')
  console.log('\nDISCOVERED DOCS — classified by path, so a file created later is governed too\n')
  console.log('  file'.padEnd(48) + 'chars'.padStart(9) + '~tok'.padStart(9) + '  % of 200k  class')
  let total = perSession
  let totalTok = perSessionTok
  for (const [file, n] of discovered.map((f) => [f, chars(f)]).sort((a, b) => b[1] - a[1])) {
    total += n
    totalTok += tokens(file)
    const cls = classify(file)
    const pct = (tokens(file) / 200000) * 100
    const lim = ROTATION_LIMITS[file]
    const warn = pct >= 100 ? '  ❌ LARGER THAN A CONTEXT WINDOW — split it'
      : cls === 'journal' ? `  rotate at ${fmt(lim)} chars (${Math.round((n / lim) * 100)}% used)`
      : cls === 'archive' ? '  📚 grep / --map only'
      : pct >= 50 ? '  ⚠️ approaching: freeze older parts into docs/archive/' : ''
    console.log('  ' + file.padEnd(46) + fmt(n).padStart(9) + fmt(tokens(file)).padStart(9) +
      '  ' + pct.toFixed(1).padStart(7) + '%  ' + cls.padEnd(7) + warn)
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
      console.error(`   Fix: node scripts/doc-budget.mjs --rotate ${rot[0].file}   (moves old entries to docs/archive/ verbatim; never raise the limit)`)
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
  const argv = process.argv.slice(2)
  const dry = argv.includes('--dry')
  const force = argv.includes('--force')
  const i = argv.indexOf('--map')
  const r = argv.indexOf('--rotate')
  if (i !== -1) process.exit(map(argv[i + 1]))
  else if (argv.includes('--rotate-all')) process.exit(Object.keys(JOURNALS).map((f) => rotateOne(f, { dry, force })).some((c) => c) ? 1 : 0)
  else if (r !== -1) process.exit(rotateOne(argv[r + 1], { dry, force }))
  else process.exit(report())
}
