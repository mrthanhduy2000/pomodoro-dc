import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(js|jsx)$/.test(name)) acc.push(p);
  }
  return acc;
}

// Rào chắn an toàn: thư viện LLM nặng (@mlc-ai/web-llm cho Qwen) CHỈ được nạp qua
// dynamic import() từ webllmEngine.js. Bất kỳ import TĨNH nào khác sẽ kéo nó vào
// bundle chính → hại app hằng ngày cho cả người không bật AI. Test này canh điều đó.
test('không file nào import TĨNH @mlc-ai/web-llm hay webllmEngine.js (ngoài webllmEngine.js)', () => {
  const offenders = [];
  for (const f of walk('src')) {
    const src = readFileSync(f, 'utf8');
    if (!f.endsWith('webllmEngine.js') && /\bfrom\s+['"]@mlc-ai\/web-llm['"]/.test(src)) offenders.push(`${f} (web-llm tĩnh)`);
    if (!f.endsWith('webllmEngine.js') && /\bimport\b[^()\n]*\bfrom\s+['"][^'"]*\/webllmEngine(\.js)?['"]/.test(src)) offenders.push(`${f} (webllmEngine tĩnh)`);
  }
  assert.deepEqual(offenders, [], `Import tĩnh lọt vào bundle chính: ${offenders.join(', ')}`);
});
