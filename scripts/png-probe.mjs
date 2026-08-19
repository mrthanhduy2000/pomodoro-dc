/**
 * png-probe.mjs — ĐỌC MÀU ĐIỂM ẢNH THẬT từ ảnh PNG do `city-preview.mjs` chụp ra.
 *
 * ⚠️ VÌ SAO CẦN CÔNG CỤ NÀY, DÙ ĐÃ CÓ CÔNG CỤ IN BẢNG MÀU: bảng màu và MÀU HIỆN LÊN MÀN HÌNH là
 * hai thứ khác nhau, và khoảng cách giữa chúng không hề nhỏ. Giữa hai đầu đó còn ba tầng nữa:
 * cường độ đèn (nắng 2,15 — tức là NHÂN màu gốc lên hơn hai lần), phép kẹp kênh màu khi tràn 255,
 * rồi tone mapping. Một màu mái `#77425a` (mận chín trầm) hoàn toàn có thể hiện lên thành hồng
 * cánh sen sau ba tầng đó, vì kênh đỏ chạm trần trước hai kênh kia và làm lệch cả sắc.
 *
 * Nghĩa là: một bài test canh BẢNG MÀU (`palette3d.test.js`) không chứng minh được điều Đàm nhìn
 * thấy. Nó chỉ chứng minh được đầu vào. Công cụ này đo đầu RA.
 *
 * Cách dùng:
 *   node scripts/png-probe.mjs <ảnh.png> <x>,<y> [<x>,<y> …]
 *   node scripts/png-probe.mjs <ảnh.png> --grid        # lưới 8×6 phủ cả ảnh
 *   node scripts/png-probe.mjs <ảnh.png> --top 12      # 12 màu chiếm nhiều diện tích nhất
 *
 * ⚠️ FILE NÀY GIỮ TOÀN BỘ HIỂU BIẾT VỀ ĐỊNH DẠNG PNG CỦA DỰ ÁN — cả ĐỌC lẫn GHI. Tên file nói
 * "soi ảnh" vì lúc sinh ra nó chỉ đọc, nhưng từ 2026-08-19 nó ghi luôn (`encodePng`, `ghepDoc`).
 * Để chỗ khác tự dựng lấy một cái chunk IHDR là "một luật hai công thức" — hai bên sẽ lệch nhau ở
 * biên, và ảnh hỏng thì không có gì đỏ lên.
 *
 * Tự giải mã PNG bằng `zlib` có sẵn của Node — KHÔNG thêm dependency nào (dự án đã một lần trả giá
 * vì gỡ dependency GPU nặng, xem `CLAUDE.md`; một công cụ dev không đáng để mở rộng chuỗi cung ứng).
 * Chỉ đọc được PNG 8-bit màu thật (loại 2 hoặc 6) — đúng thứ Chromium chụp ra.
 */

import { readFileSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';

/** Giải mã PNG 8-bit → `{ width, height, pixels }` với `pixels` là RGBA phẳng. */
export function decodePng(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error('không phải file PNG');

  let offset = 8;
  let width = 0;
  let height = 0;
  let channels = 0;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const depth = data[8];
      const colorType = data[9];
      if (depth !== 8) throw new Error(`chỉ đọc được PNG 8-bit (file này ${depth}-bit)`);
      if (colorType === 2) channels = 3;
      else if (colorType === 6) channels = 4;
      else throw new Error(`chỉ đọc được PNG màu thật (colorType 2/6), file này ${colorType}`);
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;         // 4 độ dài + 4 kiểu + dữ liệu + 4 CRC
  }

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(stride);

  // Bỏ lọc từng hàng. PNG cho mỗi hàng một trong 5 kiểu lọc, và hàng sau tham chiếu hàng trước —
  // nên bắt buộc phải duyệt tuần tự, không nhảy cóc tới hàng cần đọc được.
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride));

    for (let i = 0; i < stride; i += 1) {
      const a = i >= channels ? line[i - channels] : 0;   // trái
      const b = prev[i];                                  // trên
      const c = i >= channels ? prev[i - channels] : 0;    // chéo trên-trái
      if (filter === 1) line[i] = (line[i] + a) & 255;
      else if (filter === 2) line[i] = (line[i] + b) & 255;
      else if (filter === 3) line[i] = (line[i] + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        line[i] = (line[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      }
    }

    for (let x = 0; x < width; x += 1) {
      const src = x * channels;
      const dst = (y * width + x) * 4;
      out[dst] = line[src];
      out[dst + 1] = line[src + 1];
      out[dst + 2] = line[src + 2];
      out[dst + 3] = channels === 4 ? line[src + 3] : 255;
    }
    prev = line;
  }

  return { width, height, pixels: out };
}

/* ────────────────────────────────────────────────────────────────────────────
 * GHI PNG — vì sao cần, và vì sao nó nằm ở ĐÂY
 *
 * Ổ cắm CDP có một cái trần CỨNG: **4 MiB cho một tin nhắn**. Đo được chính xác (2026-08-19):
 * `Page.captureScreenshot` trả về 4.194.264 byte base64 thì CHẠY, thêm một nhúm nữa là ổ cắm
 * ĐỨT — và nó đứt dưới dạng `ws.onerror`, tức một lỗi truyền tải chứ không phải một câu "ảnh quá
 * to". Bản quét 15 kỷ (1864×3120) cần ~9 MB base64 ⇒ KHÔNG THỂ đi qua đường đó.
 *
 * ⇒ Chụp thành nhiều DẢI NGANG, mỗi dải nằm gọn dưới trần, rồi ghép lại ở phía Node. Ghép thì phải
 * ghi ra PNG, nên phép ghi nằm cạnh phép đọc: cùng một định dạng, cùng một file.
 * ──────────────────────────────────────────────────────────────────────────── */

const BANG_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = BANG_CRC[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

/**
 * `{width, height, pixels}` (RGBA phẳng) → Buffer PNG 8-bit.
 *
 * ⚠️ TỰ CHỌN 3 hay 4 KÊNH: ảnh chụp màn hình luôn đục hoàn toàn, mà giữ thêm một kênh alpha toàn
 * 255 thì file phình ~1/3 mà không mang thêm một tin gì. Chromium cũng làm đúng vậy — nên giữ
 * cùng một luật thì ảnh ghép ra không nặng hơn ảnh chụp thẳng.
 *
 * ⚠️ LỌC PAETH CHO MỌI HÀNG, không phải lọc 0. Cảnh 3D toàn dải chuyển màu mượt: lọc 0 gửi thẳng
 * giá trị tuyệt đối nên zlib gần như không nén được, còn Paeth gửi phần CHÊNH với hàng xóm nên
 * dải chuyển màu co lại rất nhiều. Đây là lựa chọn một-dòng đổi lấy phần lớn khoảng lợi; chọn lọc
 * thích ứng từng hàng thì tốt hơn vài phần trăm nhưng tốn 5 lượt quét.
 */
export function encodePng({ width, height, pixels }) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error(`cỡ ảnh phải là số nguyên dương, nhận ${width}×${height}`);
  }
  if (pixels.length !== width * height * 4) {
    throw new Error(`số byte điểm ảnh không khớp cỡ: có ${pixels.length}, cần ${width * height * 4}`);
  }

  let ducHoanToan = true;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] !== 255) { ducHoanToan = false; break; }
  }
  const kenh = ducHoanToan ? 3 : 4;
  const stride = width * kenh;

  const raw = Buffer.alloc((stride + 1) * height);
  const hangTruoc = Buffer.alloc(stride);
  const hang = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const src = (y * width + x) * 4;
      const dst = x * kenh;
      hang[dst] = pixels[src];
      hang[dst + 1] = pixels[src + 1];
      hang[dst + 2] = pixels[src + 2];
      if (kenh === 4) hang[dst + 3] = pixels[src + 3];
    }
    const base = y * (stride + 1);
    raw[base] = 4;                                   // Paeth
    for (let i = 0; i < stride; i += 1) {
      const a = i >= kenh ? hang[i - kenh] : 0;
      const b = hangTruoc[i];
      const c = i >= kenh ? hangTruoc[i - kenh] : 0;
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      const doan = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      raw[base + 1 + i] = (hang[i] - doan) & 255;
    }
    hang.copy(hangTruoc);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;                                       // 8 bit mỗi kênh
  ihdr[9] = kenh === 4 ? 6 : 2;                      // 6 = RGBA, 2 = RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;          // deflate · lọc chuẩn · không xen dòng

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Xếp chồng nhiều ảnh THEO CHIỀU DỌC thành một ảnh.
 *
 * ⚠️ ĐÒI BỀ NGANG BẰNG NHAU VÀ NÓI RA KHI KHÔNG — một dải lệch bề ngang mà ghép im lặng thì ảnh
 * ra vẫn "có vẻ đúng" (chỉ xô lệch dần xuống dưới), đúng loại hỏng không ai nhìn thấy.
 */
export function ghepDoc(danhSach) {
  if (!danhSach.length) throw new Error('không có dải nào để ghép');
  const width = danhSach[0].width;
  const lech = danhSach.findIndex((d) => d.width !== width);
  if (lech >= 0) {
    throw new Error(`dải ${lech} rộng ${danhSach[lech].width}, khác dải đầu (${width}) — không ghép được`);
  }
  const height = danhSach.reduce((t, d) => t + d.height, 0);
  const pixels = Buffer.alloc(width * height * 4);
  let doiChen = 0;
  for (const d of danhSach) {
    const nguon = Buffer.isBuffer(d.pixels)
      ? d.pixels
      : Buffer.from(d.pixels.buffer, d.pixels.byteOffset, d.pixels.length);
    if (nguon.length !== d.width * d.height * 4) {
      throw new Error(`dải ${d.width}×${d.height} có ${nguon.length} byte, cần ${d.width * d.height * 4}`);
    }
    nguon.copy(pixels, doiChen);
    doiChen += nguon.length;
  }
  return { width, height, pixels };
}

/** `{r,g,b}` → `{hex, h, s, l}` để nói được "sắc gì, tươi bao nhiêu" chứ không chỉ ba con số. */
export function describe(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2 / 255;
  const s = d === 0 ? 0 : (d / 255) / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = (((g - b) / d) % 6) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
    if (h < 0) h += 360;
  }
  return {
    hex: `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`,
    h: Math.round(h), s: Number(s.toFixed(2)), l: Number(l.toFixed(2)),
  };
}

function main() {
  const [file, ...rest] = process.argv.slice(2);
  if (!file) {
    console.error('Cách dùng: node scripts/png-probe.mjs <ảnh.png> <x>,<y> … | --grid | --top N');
    process.exit(1);
  }

  const { width, height, pixels } = decodePng(readFileSync(file));
  const at = (x, y) => {
    const i = (y * width + x) * 4;
    return describe(pixels[i], pixels[i + 1], pixels[i + 2]);
  };
  console.log(`${file} — ${width}×${height}`);

  if (rest[0] === '--top') {
    // Gom màu về ô 16×16×16 rồi đếm: đủ thô để "cùng một mảng mái" gộp lại thành một dòng, đủ mịn
    // để không trộn lẫn mái với tường.
    const bins = new Map();
    for (let i = 0; i < pixels.length; i += 4) {
      const key = `${pixels[i] >> 4}|${pixels[i + 1] >> 4}|${pixels[i + 2] >> 4}`;
      const cur = bins.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
      cur.n += 1; cur.r += pixels[i]; cur.g += pixels[i + 1]; cur.b += pixels[i + 2];
      bins.set(key, cur);
    }
    const total = width * height;
    [...bins.values()].sort((a, b) => b.n - a.n).slice(0, Number(rest[1]) || 10)
      .forEach((bin) => {
        const c = describe(Math.round(bin.r / bin.n), Math.round(bin.g / bin.n), Math.round(bin.b / bin.n));
        console.log(`  ${(bin.n / total * 100).toFixed(1).padStart(5)}%  ${c.hex}  h${String(c.h).padStart(3)} s${c.s.toFixed(2)} l${c.l.toFixed(2)}`);
      });
    return;
  }

  if (rest[0] === '--grid') {
    for (let gy = 1; gy <= 6; gy += 1) {
      const row = [];
      for (let gx = 1; gx <= 8; gx += 1) {
        const c = at(Math.floor(width * gx / 9), Math.floor(height * gy / 7));
        row.push(c.hex);
      }
      console.log('  ' + row.join(' '));
    }
    return;
  }

  for (const spot of rest) {
    const [x, y] = spot.split(',').map(Number);
    const c = at(x, y);
    console.log(`  (${x},${y})  ${c.hex}  h${c.h} s${c.s} l${c.l}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
