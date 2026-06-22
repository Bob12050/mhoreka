// テスト用の仮アート生成（依存なし・zlibだけでPNGを書き出す）
// 本番の絵ができたら public/img/ の同名ファイルを上書きすればOK。
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const SIZE = 512;

// ---- PNG エンコード（RGBA, 8bit）----
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ---- 簡易ドロー（アンチエイリアス合成）----
function makeCanvas() { return Buffer.alloc(SIZE * SIZE * 4); }
function blend(buf, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || a <= 0) return;
  const i = (y * SIZE + x) * 4;
  const sa = a, da = buf[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) return;
  buf[i]     = (r * sa + buf[i]     * da * (1 - sa)) / oa;
  buf[i + 1] = (g * sa + buf[i + 1] * da * (1 - sa)) / oa;
  buf[i + 2] = (b * sa + buf[i + 2] * da * (1 - sa)) / oa;
  buf[i + 3] = oa * 255;
}
// 楕円塗り（縦グラデ対応）
function ellipse(buf, cx, cy, rx, ry, colorTop, colorBot, alpha = 1) {
  for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) {
    for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
      const nx = (x - cx) / rx, ny = (y - cy) / ry;
      const d = Math.sqrt(nx * nx + ny * ny);
      const cov = Math.min(1, Math.max(0, (1 - d) * Math.min(rx, ry) * 0.5 + 0.5));
      if (cov <= 0) continue;
      const t = Math.min(1, Math.max(0, (y - (cy - ry)) / (2 * ry)));
      const r = colorTop[0] + (colorBot[0] - colorTop[0]) * t;
      const g = colorTop[1] + (colorBot[1] - colorTop[1]) * t;
      const b = colorTop[2] + (colorBot[2] - colorTop[2]) * t;
      blend(buf, x, y, r, g, b, cov * alpha);
    }
  }
}
function triangle(buf, ax, ay, bx, by, cxp, cyp, col) {
  const minX = Math.floor(Math.min(ax, bx, cxp)), maxX = Math.ceil(Math.max(ax, bx, cxp));
  const minY = Math.floor(Math.min(ay, by, cyp)), maxY = Math.ceil(Math.max(ay, by, cyp));
  const area = (bx - ax) * (cyp - ay) - (by - ay) * (cxp - ax);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const w0 = ((bx - ax) * (y - ay) - (by - ay) * (x - ax)) / area;
    const w1 = ((cxp - bx) * (y - by) - (cyp - by) * (x - bx)) / area;
    const w2 = 1 - w0 - w1;
    if (w0 >= -0.02 && w1 >= -0.02 && w2 >= -0.02) blend(buf, x, y, col[0], col[1], col[2], 1);
  }
}

// モンスター型プレースホルダ（色違いで作る）
function monster(spec) {
  const buf = makeCanvas();
  const cx = SIZE / 2, cy = SIZE / 2 + 30;
  const dark = spec.body.map((v) => v * 0.55);
  // 影
  ellipse(buf, cx, SIZE - 70, 150, 34, [0, 0, 0], [0, 0, 0], 0.22);
  // 角/スパイク
  for (const s of [-1, 0, 1]) {
    const bx = cx + s * 80;
    triangle(buf, bx - 26, cy - 120, bx + 26, cy - 120, bx, cy - 210, dark);
  }
  // 輪郭（やや大きい暗色）
  ellipse(buf, cx, cy, 168, 150, dark, dark);
  // 本体
  ellipse(buf, cx, cy, 150, 132, spec.body, spec.body.map((v) => v * 0.7));
  // お腹
  ellipse(buf, cx, cy + 36, 92, 86, spec.belly, spec.belly.map((v) => v * 0.9));
  // 目
  for (const s of [-1, 1]) {
    ellipse(buf, cx + s * 52, cy - 30, 30, 36, [255, 255, 255], [230, 230, 235]);
    ellipse(buf, cx + s * 52, cy - 22, 14, 18, [20, 20, 30], [10, 10, 18]);
  }
  return buf;
}
// ハンター型プレースホルダ
function hunter() {
  const buf = makeCanvas();
  const cx = SIZE / 2, cy = SIZE / 2 + 20;
  ellipse(buf, cx, SIZE - 80, 120, 28, [0, 0, 0], [0, 0, 0], 0.22);
  // 体（マント）
  triangle(buf, cx - 110, cy + 150, cx + 110, cy + 150, cx, cy - 10, [54, 122, 110]);
  ellipse(buf, cx, cy + 40, 96, 120, [77, 184, 164], [40, 120, 108]);
  // 頭
  ellipse(buf, cx, cy - 80, 64, 66, [240, 222, 196], [210, 188, 160]);
  // 兜
  ellipse(buf, cx, cy - 104, 70, 44, [60, 70, 86], [38, 46, 60]);
  triangle(buf, cx - 70, cy - 96, cx + 70, cy - 96, cx, cy - 168, [78, 90, 110]);
  return buf;
}

mkdirSync("public/img/monsters", { recursive: true });
const save = (path, buf) => writeFileSync(path, encodePNG(buf, SIZE));

// テスト対象（ハンター＝常時表示 / jaggi＝序盤 / rathalos＝火竜）
save("public/img/hunter.png", hunter());
save("public/img/monsters/jaggi.png", monster({ body: [120, 190, 90], belly: [210, 230, 160] }));
save("public/img/monsters/rathalos.png", monster({ body: [210, 80, 60], belly: [245, 200, 170] }));
console.log("生成: hunter.png, monsters/jaggi.png, monsters/rathalos.png");
