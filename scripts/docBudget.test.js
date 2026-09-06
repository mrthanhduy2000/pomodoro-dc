import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { BUDGETS, CHARS_PER_TOKEN, chars, tokens, overBudget } from './doc-budget.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (f) => readFileSync(resolve(ROOT, f), 'utf8')

/**
 * CỔNG NGÂN SÁCH TOKEN (2026-09-06).
 *
 * Bài test này ĐÃ TỪNG ĐỎ THẬT trước khi được commit: `START_HERE.md` lúc đó 20.200 ký tự
 * trên trần 20.000 của chính nó — một trần chỉ tồn tại dưới dạng câu chữ nên không phiên nào
 * biết nó đã bị vượt. Đó là câu trả lời cho luật dự án "một bài test chưa từng thấy đỏ thì
 * chưa phải test" và "nó đỏ khi gỡ CÁI GÌ": gỡ kỷ luật đẩy vòng cũ sang docs/archive/.
 *
 * KHI TEST NÀY ĐỎ, cách chữa là TÁCH nội dung sang file chuyên đề trong docs/ rồi để lại
 * MỘT DÒNG trỏ — KHÔNG phải nới trần, và KHÔNG phải xoá tri thức.
 */
test('doc-budget: mọi file tự-nạp phải dưới trần ký tự', () => {
  const over = overBudget()
  const msg = over.map((r) => `${r.file}: ${r.size}/${r.limit} ký tự (vượt ${r.size - r.limit})`).join(' · ')
  assert.equal(over.length, 0, `Vượt trần → TÁCH sang docs/, đừng nới trần: ${msg}`)
})

/**
 * Cổng chống "im lặng bỏ qua": nếu một file trong BUDGETS bị đổi tên/xoá, `chars()` trả null
 * và cổng trên sẽ XANH trong khi thực ra nó chẳng canh gì. Đây đúng họ với cái bẫy
 * `--test-skip-pattern` không ăn mà không báo lỗi (xem CLAUDE.md mục npm test).
 */
test('doc-budget: mọi file có trần đều phải TỒN TẠI (cổng không được im lặng bỏ qua)', () => {
  for (const file of Object.keys(BUDGETS)) {
    assert.ok(existsSync(resolve(ROOT, file)), `${file} không tồn tại — cổng trần đang canh một file ma`)
    assert.ok(chars(file) > 0, `${file} rỗng`)
  }
})

test('doc-budget: đo bằng KÝ TỰ UNICODE, không bằng byte', () => {
  // Tiếng Việt có dấu: 1 ký tự = 2–3 byte. Lẫn hai đơn vị này đã suýt cho kết luận sai
  // "CLAUDE.md vượt trần 40.000" (thật ra 37.220 ký tự / 45.011 byte).
  const s = 'Đàm ơi'
  assert.equal(s.length, 6)
  assert.ok(Buffer.byteLength(s) > s.length, 'chuỗi tiếng Việt phải nhiều byte hơn ký tự')
  assert.equal(tokens(CHARS_PER_TOKEN * 1000), 1000)
})

/**
 * Cổng chống MẤT LUẬT khi tách file (2026-09-06 tách GOVERNANCE/OPERATIONS ra khỏi CLAUDE.md).
 * Bài học `AGENTS.md`: một bản sao/bản tóm tắt làm rơi mất một luật vận hành thì tệ hơn
 * không có bản tóm tắt. Mỗi dòng dưới đây là một luật đã trả giá bằng sự cố thật.
 */
test('CLAUDE.md: tách file KHÔNG được làm rơi luật cốt lõi', () => {
  const c = read('CLAUDE.md')
  const phaiCo = [
    ['HỎI TRƯỚC KHI LÀM', 'quy tắc tối cao: lệnh nghiên cứu thì không được sửa code'],
    ['api/_tests/', 'test API đặt sai chỗ làm FAIL deploy Vercel'],
    ['12 Serverless Function', 'trần Hobby — vượt là deploy chết âm thầm'],
    ['TỰ gộp `main`', 'push nhánh phụ không ra production'],
    ['Ready', 'phải xác nhận Vercel Ready sau khi push'],
    ['compare-and-swap', 'first-action-wins, chống 2 máy ghi đè nhau'],
    ['GEMINI_API_KEY', 'thiếu key thì AI Coach chết hẳn'],
    ['localhost', 'cấm start phiên focus trên dev'],
    ['docs/GOVERNANCE.md', 'con trỏ tới quy trình + mẫu báo cáo'],
    ['docs/OPERATIONS.md', 'con trỏ tới hạ tầng/deploy/sync'],
    ['CẤM', 'luật cấm cat file kho tra cứu'],
  ]
  for (const [chuoi, viSao] of phaiCo) {
    assert.ok(c.includes(chuoi), `CLAUDE.md rơi mất luật: "${chuoi}" — ${viSao}`)
  }
})

test('docs/GOVERNANCE.md + docs/OPERATIONS.md: giữ đủ phần đã tách khỏi CLAUDE.md', () => {
  const g = read('docs/GOVERNANCE.md')
  for (const s of ['Definition of Done', 'TECHNICAL ADVISOR REPORT', 'Composition over Duplication', 'Maintenance Sprint']) {
    assert.ok(g.includes(s), `docs/GOVERNANCE.md thiếu: ${s}`)
  }
  const o = read('docs/OPERATIONS.md')
  for (const s of ['game_state_version.sql', 'hasMeaningfulState', 'requestSingleInstanceLock', 'keepalive', 'WEB_PUSH_PUBLIC_KEY']) {
    assert.ok(o.includes(s), `docs/OPERATIONS.md thiếu: ${s}`)
  }
})
