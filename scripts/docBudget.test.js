import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { BUDGETS, VI_PARAGRAPH_LIMIT, chars, viParagraphs, tokens, overBudget, wrongLanguage } from './doc-budget.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (f) => readFileSync(resolve(ROOT, f), 'utf8')
/**
 * Markdown wraps lines, so a raw `includes()` reports a law as "lost" merely because it straddles a
 * line break — which is what happened on 2026-09-06 with "Composition over\nDuplication". The
 * question these gates ask is "is the law still stated?", not "is this exact byte sequence present",
 * so collapse whitespace before matching.
 */
const flat = (f) => read(f).replace(/\s+/g, ' ')

/**
 * TOKEN BUDGET GATE (2026-09-06).
 *
 * This test HAS BEEN RED FOR REAL before being committed: `START_HERE.md` was 20,200 chars against
 * its own 20,000 limit — a limit that existed only as a sentence, so no session ever knew it had
 * been blown. That answers the project law "a test that has never gone red is not a test" and its
 * follow-up "red when you remove WHAT?": when you remove the discipline of archiving old rounds.
 *
 * WHEN THIS GOES RED the fix is to SPLIT content into a docs/ topic file and leave one pointer
 * line — never raise the limit, never delete knowledge.
 */
test('doc-budget: every auto-loaded file stays under its char limit', () => {
  const over = overBudget()
  const msg = over.map((r) => `${r.file}: ${r.size}/${r.limit} chars (over by ${r.size - r.limit})`).join(' · ')
  assert.equal(over.length, 0, `Over limit → SPLIT into docs/, do not raise the limit: ${msg}`)
})

/**
 * LANGUAGE GATE (2026-09-06, Đàm's decision): auto-loaded docs are written in English because
 * Vietnamese costs ~2.3x the tokens for the same meaning, and these files are re-read every session.
 *
 * ⚠️ Measured PER PARAGRAPH. The first version measured the whole file and FAILED its own
 * break-test: a Vietnamese paragraph pasted into `CLAUDE.md` only moved the file ratio 0.21% → 0.59%,
 * diluted by 15,000 English chars. Thresholds from real measurement that day: English paragraphs
 * quoting Đàm verbatim peak at 4.21%; genuinely Vietnamese paragraphs run 13.95–15.69%. 8% sits
 * between with ~2x headroom either way.
 */
test('doc-budget: auto-loaded files are written in English', () => {
  const wrong = wrongLanguage()
  const msg = wrong.map((r) => `${r.file}: ${r.paras.map((p) => (p.ratio * 100).toFixed(1) + '%').join(', ')}`).join(' · ')
  assert.equal(wrong.length, 0, `Auto-loaded docs must be English (CLAUDE.md §LANGUAGE RULE): ${msg}`)
})

test('doc-budget: the language gate can actually tell Vietnamese from English', () => {
  // Without this, the gate above could pass simply by being blind — the failure mode that the
  // whole-file version of this gate actually had.
  assert.ok(viParagraphs('TECH_DEBT.md').length > 0, 'a Vietnamese reference doc must trip the paragraph scan')
  assert.ok(viParagraphs('CLAUDE.md').length === 0, 'an English doc must not trip it')
  assert.ok(VI_PARAGRAPH_LIMIT > 0.0421 && VI_PARAGRAPH_LIMIT < 0.1395,
    'the threshold must sit between the measured English-with-quotes peak and the Vietnamese floor')
})

/**
 * Anti-"silently skipped" gate: if a file in BUDGETS is renamed or deleted, chars() returns null and
 * the gates above go GREEN while guarding nothing. Same family as the `--test-skip-pattern` flag
 * that Node accepted and silently ignored (see CLAUDE.md §Testing).
 */
test('doc-budget: every budgeted file EXISTS (the gate must not guard a ghost)', () => {
  for (const file of Object.keys(BUDGETS)) {
    assert.ok(existsSync(resolve(ROOT, file)), `${file} does not exist — the limit is guarding a ghost`)
    assert.ok(chars(file) > 0, `${file} is empty`)
  }
})

test('doc-budget: counts UNICODE CHARS (JS String.length), not bytes', () => {
  // Vietnamese: 1 char = 2–3 bytes. Confusing the two nearly produced a false "over the limit".
  const s = 'Đàm ơi'
  assert.equal(s.length, 6)
  assert.ok(Buffer.byteLength(s) > s.length, 'a Vietnamese string must have more bytes than chars')
  // Token estimate must follow the language actually used in the file.
  assert.ok(tokens('CLAUDE.md') < chars('CLAUDE.md') / 3, 'an English file should use the English ratio')
  assert.ok(tokens('TECH_DEBT.md') > chars('TECH_DEBT.md') / 3, 'a Vietnamese file should use the Vietnamese ratio')
})

/**
 * Anti-KNOWLEDGE-LOSS gate for the 2026-09-06 split + translation. `AGENTS.md` already proved that a
 * copy or summary which drops one operating law is worse than having no summary at all. Each string
 * below is a law paid for by a real incident.
 */
test('CLAUDE.md: splitting and translating must not drop a core law', () => {
  const c = flat('CLAUDE.md')
  const required = [
    ['ASK BEFORE ACTING', 'supreme rule: a research request must not touch code'],
    ['api/_tests/', 'API tests in the wrong folder break the Vercel deploy'],
    ['12 Serverless Functions', 'the Hobby ceiling — exceeding it kills the deploy silently'],
    ['merge into `main`', 'pushing a side branch never reaches production'],
    ['"Ready"', 'Vercel must be confirmed Ready after a push'],
    ['compare-and-swap', 'first-action-wins; stops two machines overwriting each other'],
    ['GEMINI_API_KEY', 'without the key the AI Coach is dead'],
    ['localhost', 'never start a focus session on dev'],
    ['docs/GOVERNANCE.md', 'pointer to process + report templates'],
    ['docs/OPERATIONS.md', 'pointer to infra/deploy/sync'],
    ['NEVER `cat`', 'the rule that stops a single 252k-token command'],
    ['LANGUAGE RULE', 'docs in English, replies to Đàm in Vietnamese'],
  ]
  for (const [needle, why] of required) {
    assert.ok(c.includes(needle), `CLAUDE.md lost a law: "${needle}" — ${why}`)
  }
})

test('docs/GOVERNANCE.md + docs/OPERATIONS.md still hold everything split out of CLAUDE.md', () => {
  const g = flat('docs/GOVERNANCE.md')
  for (const s of ['Definition of Done', 'TECHNICAL ADVISOR REPORT', 'Composition over Duplication', 'Maintenance Sprint']) {
    assert.ok(g.includes(s), `docs/GOVERNANCE.md is missing: ${s}`)
  }
  const o = flat('docs/OPERATIONS.md')
  for (const s of ['game_state_version.sql', 'hasMeaningfulState', 'requestSingleInstanceLock', 'keepalive', 'WEB_PUSH_PUBLIC_KEY', 'DC_CROSS_SLOW']) {
    assert.ok(o.includes(s), `docs/OPERATIONS.md is missing: ${s}`)
  }
})

/** START_HERE.md must keep pointing at the reference files, or a session cannot find anything. */
test('START_HERE.md: keeps the required pointers and the never-cat rule', () => {
  const s = flat('START_HERE.md')
  for (const needle of ['PHASE_RULES.md', 'CLAUDE.md', 'docs/GOVERNANCE.md', 'docs/OPERATIONS.md',
    'BAN_GIAO.md', 'never `cat`', 'ADR-007', 'doc-budget.mjs']) {
    assert.ok(s.includes(needle), `START_HERE.md lost the pointer: ${needle}`)
  }
})
