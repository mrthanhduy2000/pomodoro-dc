/**
 * webllmEngine.js — FILE DUY NHẤT được phép chạm '@mlc-ai/web-llm', và CHỈ qua
 * dynamic import() bên trong hàm → Rollup tách 'vendor-webllm' riêng, KHÔNG vào
 * bundle chính, KHÔNG tải gì cho tới khi người dùng bật. KHÔNG import tĩnh từ cây App.
 * Engine giữ dạng singleton (như pipePromise của embedder) để bấm lại không nạp lại.
 */
let enginePromise = null;
let loadedModel = null;

export async function ensureEngine(modelId, onProgress) {
  if (enginePromise && loadedModel === modelId) return enginePromise;
  loadedModel = modelId;
  enginePromise = (async () => {
    if (typeof navigator === 'undefined' || !navigator.gpu) throw new Error('no-webgpu');
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('no-adapter');
    const webllm = await import('@mlc-ai/web-llm');
    return webllm.CreateMLCEngine(modelId, { initProgressCallback: onProgress });
  })().catch((err) => { enginePromise = null; loadedModel = null; throw err; });
  return enginePromise;
}

export async function generateOffline({ modelId, system, messages, onProgress, onToken }) {
  const engine = await ensureEngine(modelId, onProgress);
  const stream = await engine.chat.completions.create({
    messages: [{ role: 'system', content: system }, ...messages],
    stream: true,
    temperature: 0.5,
    max_tokens: 400,
  });
  let out = '';
  for await (const chunk of stream) {
    out += chunk?.choices?.[0]?.delta?.content || '';
    if (onToken) onToken(out);
  }
  return out;
}

export async function unloadEngine() {
  const p = enginePromise;
  enginePromise = null;
  loadedModel = null;
  if (!p) return;
  try { const e = await p; await e.unload?.(); } catch { /* bỏ qua */ }
}
