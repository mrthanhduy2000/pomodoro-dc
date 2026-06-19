/**
 * embedder.js — tầng NƠ-RON tuỳ chọn (opt-in, desktop): tải mô hình embedding đa
 * ngôn ngữ chạy TRÊN MÁY để hiểu nghĩa ghi chú sâu hơn TF-IDF (bắt được đồng nghĩa
 * khác mặt chữ). Trả vector dùng CHUNG mọi hàm toán trong semantic.js.
 *
 * AN TOÀN: file này là chỗ DUY NHẤT được phép chạm @huggingface/transformers, và
 * CHỈ qua dynamic import() bên trong hàm → Rollup tách thành chunk 'vendor-transformers'
 * riêng, KHÔNG vào bundle chính, KHÔNG tải gì cho tới khi hàm này được gọi.
 * KHÔNG import tĩnh file này từ cây App; chỉ nạp qua import('./embedder.js') khi bật.
 */
export const NEURAL_MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

let pipePromise = null;

export async function loadEmbedder(onProgress) {
  if (!pipePromise) {
    pipePromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers');
      env.allowLocalModels = false;
      env.useBrowserCache = true; // model nằm trong Cache Storage → lần sau dùng ngay
      return pipeline('feature-extraction', NEURAL_MODEL, {
        dtype: 'q8',
        device: 'wasm', // KHÔNG dựa WebGPU (iOS yếu) — nhưng tính năng này chỉ bật desktop
        progress_callback: onProgress,
      });
    })().catch((err) => { pipePromise = null; throw err; });
  }
  return pipePromise;
}

/** embedTexts — trả mảng vector (đã mean-pool + L2-normalize) cho danh sách chuỗi. */
export async function embedTexts(texts, onProgress) {
  const pipe = await loadEmbedder(onProgress);
  const out = await pipe(texts, { pooling: 'mean', normalize: true });
  return out.tolist();
}
