import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to write a valid RGBA PNG containing the official Anvil icon
function createAnvilPng(size) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (1 + width * 4));

  const center = size / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - center;
      const dy = y - center;

      // Outer rounded squircle (Dark Charcoal #14151a)
      const cornerRadius = size * 0.24;
      const nx = Math.max(0, Math.abs(dx) - (center - cornerRadius - 1));
      const ny = Math.max(0, Math.abs(dy) - (center - cornerRadius - 1));
      const cornerDist = Math.sqrt(nx * nx + ny * ny);
      const isInsideCard = cornerDist <= cornerRadius;

      if (!isInsideCard) {
        // Transparent outside bounds
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Background color: #181a20
      let r = 24;
      let g = 26;
      let b = 32;
      let a = 255;

      const nxRel = x / size;
      const nyRel = y / size;

      // 1. Anvil shape (Crisp White)
      // Top plate: y in 0.42..0.52, x in 0.22..0.76
      const isTopPlate = nyRel >= 0.42 && nyRel <= 0.52 && nxRel >= 0.22 && nxRel <= 0.76;
      // Horn protruding to left: y in 0.44..0.52, x in 0.14..0.24
      const isHorn = nyRel >= 0.44 && nyRel <= 0.52 && nxRel >= 0.14 && nxRel <= 0.24;
      // Waist: y in 0.52..0.66, x in 0.38..0.62
      const isWaist = nyRel >= 0.52 && nyRel <= 0.66 && nxRel >= 0.38 && nxRel <= 0.62;
      // Base: y in 0.66..0.82, x in 0.22..0.78
      const isBase = nyRel >= 0.66 && nyRel <= 0.82 && nxRel >= 0.22 && nxRel <= 0.78;

      const isAnvil = isTopPlate || isHorn || isWaist || isBase;

      // 2. Hammer angled striking top right (y in 0.18..0.44, x in 0.48..0.84)
      // Hammer head: y in 0.30..0.42, x in 0.54..0.74
      const isHammerHead = nyRel >= 0.28 && nyRel <= 0.40 && nxRel >= 0.56 && nxRel <= 0.78;
      // Hammer handle: y in 0.16..0.32, x in 0.66..0.84 angled
      const isHammerHandle = nyRel >= 0.16 && nyRel <= 0.30 && nxRel >= 0.68 && nxRel <= 0.82;

      // 3. Blue Sparks around (nx: 0.72..0.88, ny: 0.22..0.38)
      const distSpark1 = Math.hypot(nxRel - 0.76, nyRel - 0.26);
      const distSpark2 = Math.hypot(nxRel - 0.84, nyRel - 0.22);
      const isSpark = distSpark1 < 0.05 || distSpark2 < 0.04;

      if (isAnvil || isHammerHead) {
        r = 255;
        g = 255;
        b = 255;
      } else if (isHammerHandle) {
        r = 226;
        g = 232;
        b = 240; // #e2e8f0
      } else if (isSpark) {
        r = 96;
        g = 165;
        b = 250; // #60a5fa electric blue
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // color type RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (~c) >>> 0;
}

const iconsDir = path.resolve(__dirname, '../public/icons');
fs.mkdirSync(iconsDir, { recursive: true });

[16, 32, 48, 128].forEach((size) => {
  const png = createAnvilPng(size);
  fs.writeFileSync(path.join(iconsDir, `${size}.png`), png);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Generated icon: ${size}x${size}`);
});

