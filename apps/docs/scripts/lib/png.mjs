// A tiny PNG encoder on node:zlib, and a generator of noisy gradient pictures.
// No image dependency: the pictures only need to be real, valid PNG files that
// do not compress to nothing.

import { crc32, deflateSync } from 'node:zlib';
import { Random } from './prng.mjs';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])) >>> 0);
  return Buffer.concat([length, typeBytes, data, checksum]);
}

/**
 * Encodes 8 bit RGB scanlines that already carry their filter byte.
 * `raw` holds `height` rows of `1 + width * 3` bytes.
 */
export function encodePng(width, height, raw) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: truecolour
  header[10] = 0; // compression
  header[11] = 0; // filter method
  header[12] = 0; // no interlace
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const PALETTES = [
  [[24, 62, 112], [92, 184, 170]],
  [[120, 40, 64], [240, 170, 96]],
  [[28, 84, 60], [196, 220, 120]],
  [[58, 44, 120], [226, 128, 176]],
  [[20, 20, 40], [120, 160, 230]],
  [[150, 76, 28], [250, 224, 150]],
  [[18, 92, 104], [150, 214, 238]],
  [[70, 70, 74], [210, 214, 220]],
];

const clamp = (value, low, high) => (value < low ? low : value > high ? high : value);

/**
 * Renders one picture: a diagonal gradient with ripples and a few soft blobs,
 * then uniform noise of +/- `noise` levels per channel on top. The noise is what
 * keeps the file large. Rows use the PNG "Sub" filter, so the smooth part costs
 * almost nothing and the noise dominates the compressed size.
 */
export function renderPicture(seed, width, height, noise) {
  const random = new Random(seed);
  const [from, to] = random.pick(PALETTES);
  const angle = random.float() * Math.PI; // sin(angle) >= 0
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const minProjection = Math.min(0, dirX * width);
  const span = Math.abs(dirX) * width + dirY * height || 1;
  const rippleFrequency = 1 + random.float() * 5;
  const ripplePhase = random.float() * Math.PI * 2;

  // Each blob is a separable Gaussian: one factor per column, one per row.
  const blobs = Array.from({ length: random.int(2, 4) }, () => {
    const centerX = random.float() * width;
    const centerY = random.float() * height;
    const radius = (0.15 + random.float() * 0.3) * Math.max(width, height);
    const twoSigmaSquared = 2 * radius * radius;
    return {
      centerY,
      twoSigmaSquared,
      columns: Float64Array.from({ length: width }, (_, x) => Math.exp(-((x - centerX) ** 2) / twoSigmaSquared)),
      tint: [random.int(-60, 60), random.int(-60, 60), random.int(-60, 60)],
    };
  });

  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  let state = (seed ^ 0x9e3779b9) >>> 0 || 1;
  const range = 2 * noise + 1;
  const last = [0, 0, 0];
  const rowFactors = new Float64Array(blobs.length);

  for (let y = 0; y < height; y++) {
    const row = y * stride;
    raw[row] = 1; // filter type: Sub
    last[0] = last[1] = last[2] = 0;
    for (let b = 0; b < blobs.length; b++) {
      rowFactors[b] = Math.exp(-((y - blobs[b].centerY) ** 2) / blobs[b].twoSigmaSquared);
    }
    for (let x = 0; x < width; x++) {
      const unit = clamp((x * dirX + y * dirY - minProjection) / span, 0, 1);
      const ripple = 0.06 * Math.sin(ripplePhase + unit * rippleFrequency * Math.PI * 2);
      const mix = clamp(unit + ripple, 0, 1);
      let weightSum = 0;
      let tintR = 0;
      let tintG = 0;
      let tintB = 0;
      for (let b = 0; b < blobs.length; b++) {
        const weight = blobs[b].columns[x] * rowFactors[b];
        weightSum += weight;
        tintR += blobs[b].tint[0] * weight;
        tintG += blobs[b].tint[1] * weight;
        tintB += blobs[b].tint[2] * weight;
      }
      const scale = weightSum > 1 ? 1 / weightSum : 1;
      const tint = [tintR * scale, tintG * scale, tintB * scale];
      for (let c = 0; c < 3; c++) {
        state ^= state << 13;
        state >>>= 0;
        state ^= state >>> 17;
        state ^= state << 5;
        state >>>= 0;
        const jitter = ((state >>> 8) % range) - noise;
        const value = clamp(Math.round(from[c] + (to[c] - from[c]) * mix + tint[c] + jitter), 0, 255);
        raw[row + 1 + x * 3 + c] = (value - last[c]) & 255;
        last[c] = value;
      }
    }
  }
  return raw;
}

/**
 * Makes a PNG whose encoded size lands near `targetBytes`: renders a first
 * guess, then rescales the pixel count from what it measured (up to twice).
 */
export function makePicture(seed, aspect, targetBytes, noise) {
  let pixels = targetBytes / (0.75 + 0.18 * noise); // rough fit, corrected below
  let result;
  for (let attempt = 0; attempt < 3; attempt++) {
    const height = Math.max(64, Math.round(Math.sqrt(pixels / aspect)));
    const width = Math.max(64, Math.round(height * aspect));
    const png = encodePng(width, height, renderPicture(seed, width, height, noise));
    result = { png, width, height };
    const ratio = png.length / targetBytes;
    if (ratio > 0.94 && ratio < 1.06) break;
    pixels = (width * height) / ratio;
  }
  return result;
}
