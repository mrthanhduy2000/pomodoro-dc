/*
  ===================================================================
  ai-coach.mjs — KHÔNG còn bản chép đôi.
  -------------------------------------------------------------------
  Engine giọng Coach (rule engine giả lập LLM) sống ở MỘT nguồn duy
  nhất của app thật:  src/engine/coachVoice.js
  File này chỉ TRỎ về đó (re-export), để demo + test trong ai-coach-sim/
  luôn chạy đúng logic của app, không bao giờ lệch pha.

  Muốn sửa câu/intent/tone của Coach → sửa src/engine/coachVoice.js.
  ĐỪNG dán lại nội dung engine vào đây.

  Mọi import cũ vẫn chạy y như trước, ví dụ:
    import { generateCoachMessage, createCoachMemory } from "./ai-coach.mjs";
  ===================================================================
*/

export * from "../src/engine/coachVoice.js";
export { default } from "../src/engine/coachVoice.js";
