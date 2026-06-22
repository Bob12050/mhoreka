// 緑背景をクロマキー除去して透過PNG化（依存なし）。緑スピル除去＋2x縮小。
// 使い方: node tools/chroma-key.mjs <input.png> <output.png> [targetSize]
import { deflateSync, inflateSync } from "node:zlib";
import { readFileSync, writeFileSync } from "node:fs";

const [inPath, outPath, targetArg] = process.argv.slice(2);

// ---- PNG デコード（color type 2/6, 8bit）----
function decode(buf) {
  const W = buf.readUInt32BE(16), H = buf.readUInt32BE(20), ct = buf[25];
  const ch = ct === 6 ? 4 : ct === 2 ? 3 : 1;
  let p = 8; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p); const type = buf.slice(p + 4, p + 8).toString();
    if (type === "IDAT") idat.push(buf.slice(p + 8, p + 8 + len));
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = W * ch + 1;
  const img = Buffer.alloc(W * H * ch);
  const paeth = (a, b, c) => { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  for (let y = 0; y < H; y++) {
    const f = raw[y * stride];
    for (let x = 0; x < W * ch; x++) {
      const rv = raw[y * stride + 1 + x];
      const a = x >= ch ? img[y * W * ch + x - ch] : 0;
      const b = y > 0 ? img[(y - 1) * W * ch + x] : 0;
      const c = x >= ch && y > 0 ? img[(y - 1) * W * ch + x - ch] : 0;
      let v;
      if (f === 0) v = rv; else if (f === 1) v = rv + a; else if (f === 2) v = rv + b;
      else if (f === 3) v = rv + ((a + b) >> 1); else v = rv + paeth(a, b, c);
      img[y * W * ch + x] = v & 255;
    }
  }
  // RGBA 化
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0, j = 0; i < W * H; i++, j += 4) {
    out[j] = img[i * ch]; out[j + 1] = img[i * ch + (ch >= 2 ? 1 : 0)]; out[j + 2] = img[i * ch + (ch >= 3 ? 2 : 0)];
    out[j + 3] = ch === 4 ? img[i * ch + 3] : 255;
  }
  return { W, H, data: out };
}

// ---- クロマキー（緑除去＋スピル抑制）----
function chroma({ W, H, data }) {
  for (let i = 0; i < W * H; i++) {
    const o = i * 4; const r = data[o], g = data[o + 1], b = data[o + 2];
    const greenness = g - Math.max(r, b);
    if (greenness > 60) { data[o + 3] = 0; }
    else if (greenness > 18) {
      data[o + 3] = Math.round(255 * (1 - (greenness - 18) / 42));
      data[o + 1] = Math.max(r, b); // 緑フリンジ除去
    }
  }
  return { W, H, data };
}

// ---- 2倍縮小（プリマルチプライ平均）----
function halve({ W, H, data }) {
  const ow = W >> 1, oh = H >> 1; const out = Buffer.alloc(ow * oh * 4);
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    let sa = 0, sr = 0, sg = 0, sb = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const o = ((y * 2 + dy) * W + (x * 2 + dx)) * 4; const a = data[o + 3];
      sa += a; sr += data[o] * a; sg += data[o + 1] * a; sb += data[o + 2] * a;
    }
    const oo = (y * ow + x) * 4; const oa = sa / 4;
    out[oo + 3] = Math.round(oa);
    out[oo] = sa ? Math.round(sr / sa) : 0;
    out[oo + 1] = sa ? Math.round(sg / sa) : 0;
    out[oo + 2] = sa ? Math.round(sb / sa) : 0;
  }
  return { W: ow, H: oh, data: out };
}

// ---- PNG エンコード（RGBA）----
const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0); const body = Buffer.concat([Buffer.from(type, "ascii"), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0); return Buffer.concat([len, body, crc]); }
function encode({ W, H, data }) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(H * (W * 4 + 1));
  for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; data.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4); }
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

let im = chroma(decode(readFileSync(inPath)));
const target = Number(targetArg) || 512;
while (im.W > target && (im.W & 1) === 0) im = halve(im);
writeFileSync(outPath, encode(im));
console.log(`書き出し: ${outPath} (${im.W}x${im.H})`);
