import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { SCENERY, sceneryKey } from '../data/scenery';
import { CATALOG } from './registry';

// Decode native RGBA PNG scanlines to catch an opaque background despite a valid alpha channel.
function rgbaPng(file) {
  const width = file.readUInt32BE(16), height = file.readUInt32BE(20);
  expect(file.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect([file[24], file[25], file[28]]).toEqual([8, 6, 0]);
  const chunks = [];
  for (let offset = 8; offset < file.length;) {
    const size = file.readUInt32BE(offset);
    if (file.toString('ascii', offset + 4, offset + 8) === 'IDAT') chunks.push(file.subarray(offset + 8, offset + 8 + size));
    offset += size + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks)), stride = width * 4;
  const rgba = Buffer.alloc(stride * height);
  const paeth = (a, b, c) => {
    const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c);
    return da <= db && da <= dc ? a : db <= dc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    expect(filter).toBeLessThanOrEqual(4);
    for (let x = 0; x < stride; x++) {
      const at = y * stride + x, a = x >= 4 ? rgba[at - 4] : 0;
      const b = y > 0 ? rgba[at - stride] : 0, c = y > 0 && x >= 4 ? rgba[at - stride - 4] : 0;
      const predictor = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter];
      rgba[at] = (raw[y * (stride + 1) + x + 1] + predictor) & 255;
    }
  }
  return { width, height, rgba };
}

describe('PixelLab scenery delivery', () => {
  it.each(Object.entries(SCENERY))('%s has its native dimensions and a genuinely transparent cutout', (kind, spec) => {
    const path = CATALOG.images[sceneryKey(kind)];
    expect(path).toBeTruthy();
    const { width, height, rgba } = rgbaPng(readFileSync(new URL(`../../public/${path}`, import.meta.url)));
    expect([width, height]).toEqual([spec.width, spec.height]);
    let transparent = 0, visible = 0;
    for (let i = 3; i < rgba.length; i += 4) { if (rgba[i] === 0) transparent++; else visible++; }
    expect(transparent / (width * height)).toBeGreaterThan(0.05);
    expect(visible / (width * height)).toBeGreaterThan(0.05);
    for (const pixel of [0, width - 1, width * (height - 1), width * height - 1]) expect(rgba[pixel * 4 + 3]).toBe(0);
  });
});
