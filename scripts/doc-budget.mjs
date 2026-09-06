#!/usr/bin/env node
/**
 * doc-budget — cổng canh ngân sách token của TÀI LIỆU.
 *
 * Vì sao có file này (2026-09-06): tài liệu dự án đã tới 2,65 triệu ký tự ≈ 1,54 triệu token
 * = 769% cửa sổ 200k. Một lệnh `cat TECH_DEBT.md` là 250k token — nổ cửa sổ trong MỘT lệnh.
 * Các trần đã ghi trong `CLAUDE.md`/`START_HERE.md` từ trước chỉ là CÂU CHỮ, không ai canh,
 * nên `START_HERE.md` âm thầm vượt trần của chính nó (20.200 / 20.000) mà không phiên nào biết.
 * Bài học dự án: "một ngưỡng không có cổng canh là một cái phễu".
 *
 * ⚠️ Đo bằng KÝ TỰ UNICODE (String.length), KHÔNG bằng `wc -c`. Tiếng Việt có dấu là 2–3 byte
 * mỗi ký tự nên `wc -c` thổi phồng ~21% (CLAUDE.md: 37.220 ký tự nhưng 45.011 byte) — đã suýt
 * kết luận sai "vượt trần" vì đọc nhầm byte thành ký tự.
 *
 *   node scripts/doc-budget.mjs            → bảng đầy đủ, exit 1 nếu có file vượt trần
 *   node scripts/doc-budget.mjs --map F    → bản đồ tiêu đề của F (đọc đúng dòng cần, không cat cả file)
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Hệ số quy đổi ĐO ĐƯỢC (không phải phỏng đoán) trên tài liệu tiếng Việt của dự án này:
 * CLAUDE.md 37.220 ký tự đã được harness đếm là 21.600 token ⇒ 1,723 ký tự/token.
 * Tiếng Việt có dấu tốn token hơn tiếng Anh nhiều (tiếng Anh ~4 ký tự/token).
 */
export const CHARS_PER_TOKEN = 1.723

/**
 * Trần của các file TỰ NẠP / BẮT BUỘC ĐỌC mỗi phiên. Chỉ những file này mới có trần cứng,
 * vì chỉ chúng mới bị nhân với SỐ PHIÊN. Kho tra cứu (TECH_DEBT, ADR…) được phép lớn —
 * luật với chúng là "cấm cat", không phải "cấm dài".
 */
export const BUDGETS = {
  'CLAUDE.md': 20000,
  'START_HERE.md': 20000,
  'PHASE_RULES.md': 10000,
  'AGENTS.md': 4000,
}

/** File kho tra cứu: không có trần, nhưng in ra để nhắc "cấm cat". */
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
]

export function chars(file) {
  const p = resolve(ROOT, file)
  return existsSync(p) ? readFileSync(p, 'utf8').length : null
}

export function tokens(n) {
  return Math.round(n / CHARS_PER_TOKEN)
}

/** Trả về danh sách file vượt trần. Rỗng = cổng xanh. */
export function overBudget() {
  return Object.entries(BUDGETS)
    .map(([file, limit]) => ({ file, limit, size: chars(file) }))
    .filter((r) => r.size !== null && r.size > r.limit)
}

function bar(pct) {
  const n = Math.min(20, Math.round(pct / 5))
  return '█'.repeat(n) + '·'.repeat(20 - n)
}

function fmt(n) {
  return n.toLocaleString('de-DE')
}

function report() {
  const over = overBudget()
  console.log('\nTỰ NẠP / BẮT BUỘC ĐỌC MỖI PHIÊN — có trần cứng\n')
  console.log('  file'.padEnd(20) + 'ký tự'.padStart(9) + 'trần'.padStart(9) + '~token'.padStart(9) + '   dùng')
  for (const [file, limit] of Object.entries(BUDGETS)) {
    const n = chars(file)
    if (n === null) { console.log('  ' + file.padEnd(18) + '(không có)'); continue }
    const pct = (n / limit) * 100
    console.log(
      '  ' + file.padEnd(18) + fmt(n).padStart(9) + fmt(limit).padStart(9) + fmt(tokens(n)).padStart(9) +
      '   ' + bar(pct) + ' ' + pct.toFixed(0).padStart(3) + '%' + (n > limit ? '  ❌ VƯỢT' : '')
    )
  }
  const perSession = Object.keys(BUDGETS).reduce((s, f) => s + (chars(f) ?? 0), 0)
  console.log('\n  → mỗi phiên gánh ' + fmt(perSession) + ' ký tự ≈ ' + fmt(tokens(perSession)) +
    ' token = ' + ((tokens(perSession) / 200000) * 100).toFixed(1) + '% cửa sổ 200k')

  console.log('\nKHO TRA CỨU — không có trần, nhưng ❌ CẤM `cat`, chỉ `grep -n` / `sed -n` / `head`\n')
  console.log('  file'.padEnd(38) + 'ký tự'.padStart(10) + '~token'.padStart(9) + '  %cửa sổ 200k')
  let total = perSession
  const rows = REFERENCE_DOCS.map((f) => [f, chars(f)]).filter(([, n]) => n !== null).sort((a, b) => b[1] - a[1])
  for (const [file, n] of rows) {
    total += n
    const pct = (tokens(n) / 200000) * 100
    // Ngưỡng cảnh báo (TECH_DEBT #103) — kho tra cứu ĐƯỢC PHÉP lớn, nên đây là cảnh báo, không phải cổng.
    const canhBao = pct >= 100 ? '  ⚠️ một lệnh cat = NỔ cửa sổ 200k'
      : pct >= 50 ? '  ⚠️ tới nhịp đóng băng — chuyển phần cũ sang docs/archive/' : ''
    console.log('  ' + file.padEnd(36) + fmt(n).padStart(10) + fmt(tokens(n)).padStart(9) +
      '  ' + pct.toFixed(1).padStart(6) + '%' + canhBao)
  }
  console.log('\n  → TỔNG tài liệu: ' + fmt(total) + ' ký tự ≈ ' + fmt(tokens(total)) + ' token = ' +
    ((tokens(total) / 200000) * 100).toFixed(0) + '% cửa sổ 200k\n')

  if (over.length) {
    console.error('❌ VƯỢT TRẦN: ' + over.map((r) => `${r.file} (${fmt(r.size)}/${fmt(r.limit)})`).join(' · '))
    console.error('   Cách chữa: TÁCH nội dung sang file chuyên đề trong docs/ rồi để lại MỘT DÒNG trỏ. Đừng xoá chữ.\n')
    return 1
  }
  console.log('✅ Mọi file tự-nạp đều dưới trần.\n')
  return 0
}

/** Bản đồ tiêu đề: để biết `sed -n 'A,Bp'` dòng nào, thay vì cat cả file. */
function map(file) {
  const p = resolve(ROOT, file)
  if (!existsSync(p)) { console.error('Không có file: ' + file); return 1 }
  const lines = readFileSync(p, 'utf8').split('\n')
  const heads = []
  lines.forEach((l, i) => { if (/^#{1,4} /.test(l)) heads.push({ line: i + 1, text: l }) })
  console.log(`\n${file} — ${fmt(lines.length)} dòng · ${fmt(readFileSync(p, 'utf8').length)} ký tự ≈ ${fmt(tokens(readFileSync(p, 'utf8').length))} token\n`)
  heads.forEach((h, i) => {
    const end = i + 1 < heads.length ? heads[i + 1].line - 1 : lines.length
    console.log(String(h.line).padStart(6) + '-' + String(end).padEnd(6) + ' ' + h.text.slice(0, 96))
  })
  console.log('\nĐọc một mục: sed -n \'A,Bp\' ' + file + '   (đừng cat cả file)\n')
  return 0
}

if (process.argv[1] && process.argv[1].endsWith('doc-budget.mjs')) {
  const i = process.argv.indexOf('--map')
  process.exit(i !== -1 ? map(process.argv[i + 1]) : report())
}
