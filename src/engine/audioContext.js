/**
 * audioContext.js — khởi tạo/resume AudioContext dùng chung, lazy, cho mọi audio
 * engine (soundEngine.js, ambientEngine.js). Mỗi engine tự giữ instance riêng qua
 * trường `_ctx` của chính nó — hàm này chỉ gói phần khởi tạo/resume từng bị chép tay.
 */
export function getOrCreateAudioContext(holder) {
  if (!holder._ctx) {
    holder._ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (holder._ctx.state === 'suspended') holder._ctx.resume();
  return holder._ctx;
}
