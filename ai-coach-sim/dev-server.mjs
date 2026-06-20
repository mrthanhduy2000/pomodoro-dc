// Máy chủ tĩnh nhỏ để xem demo trong trình duyệt. Không liên quan logic Coach.
// Chạy: node dev-server.mjs   (mặc định cổng 8137)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

// Phục vụ từ GỐC DỰ ÁN (một cấp trên ai-coach-sim/) để demo trong trình duyệt
// nạp được ../src/engine/coachVoice.js — engine giờ là nguồn duy nhất, ai-coach.mjs
// chỉ re-export từ đó.
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = process.env.PORT || 8137;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

createServer(async (req, res) => {
  let path = decodeURIComponent(req.url.split("?")[0]);
  if (path === "/") path = "/ai-coach-sim/index.html";
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found");
  }
}).listen(PORT, () => console.log(`AI Coach demo: http://localhost:${PORT}`));
