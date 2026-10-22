import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it, vi } from 'vitest';
import { SCENERY, sceneryKey } from '../data/scenery';
import { CATALOG } from './registry';
import { WORLD_PROPS } from '../systems/WorldMap';
vi.mock('phaser', () => ({ default: {} }));

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

describe('composed menu illustrations', () => {
  it.each([
    ['menu_ending', 1536, 1024], ['menu_desk', 1536, 1024], ['menu_grave', 1024, 1536],
  ])('%s keeps transparent negative space and native proportions', (key, expectedWidth, expectedHeight) => {
    const { width, height, rgba } = rgbaPng(readFileSync(new URL(`../../public/${CATALOG.images[key]}`, import.meta.url)));
    expect([width, height]).toEqual([expectedWidth, expectedHeight]);
    let transparent = 0, solid = 0;
    for (let i = 3; i < rgba.length; i += 4) { if (rgba[i] < 16) transparent++; if (rgba[i] > 200) solid++; }
    expect(transparent / (width * height)).toBeGreaterThan(0.05);
    expect(solid / (width * height)).toBeGreaterThan(0.05);
    expect(rgba[3]).toBeLessThan(16);
  });
});

describe('Western Pulp arena props', () => {
  it.each(Object.entries(WORLD_PROPS))('%s matches its declared world-scale canvas', (kind, spec) => {
    const { width, height, rgba } = rgbaPng(readFileSync(new URL(`../../public/${CATALOG.images[`wm_${kind}`]}`, import.meta.url)));
    expect([width, height]).toEqual([spec.w, spec.h]);
    let clear = 0, visible = 0;
    for (let i = 3; i < rgba.length; i += 4) { if (rgba[i] === 0) clear++; else visible++; }
    expect(clear).toBeGreaterThan(width * height * 0.1);
    expect(visible).toBeGreaterThan(width * height * 0.1);
    for (const pixel of [0, width - 1, width * (height - 1), width * height - 1]) expect(rgba[pixel * 4 + 3]).toBe(0);
  });
  it.each(['steve', 'billy', 'bob', 'cormano'])('%s portrait uses the same square canvas without distortion', hero => {
    const { width, height } = rgbaPng(readFileSync(new URL(`../../public/${CATALOG.images[`hud_avatar_${hero}`]}`, import.meta.url)));
    expect([width, height]).toEqual([84, 84]);
  });
  it.each([['wm_wagon', 100, 88], ['decor_skull', 40, 28], ['decor_sagebrush', 36, 34], ['saloon_cancan', 1200, 760]])(
    '%s has a transparent padded silhouette at its intended native game size', (key, w, h) => {
      const { width, height, rgba } = rgbaPng(readFileSync(new URL(`../../public/${CATALOG.images[key]}`, import.meta.url)));
      expect([width, height]).toEqual([w, h]);
      let visible = 0, clear = 0;
      for (let i = 3; i < rgba.length; i += 4) { if (rgba[i]) visible++; else clear++; }
      expect(visible).toBeGreaterThan(width * height * 0.1);
      expect(clear).toBeGreaterThan(width * height * 0.1);
      for (const pixel of [0, width - 1, width * (height - 1), width * height - 1]) expect(rgba[pixel * 4 + 3]).toBe(0);
    });
});

describe('Cormano back-facing walk delivery', () => {
  it('has four distinct transparent frames aligned to the established hero canvas and foot baseline', () => {
    const files = [];
    for (let i = 0; i < 4; i++) {
      const path = `../../public/${CATALOG.sequences['hero:cormano'].root}/north/frame_${String(i).padStart(3, '0')}.png`;
      const file = readFileSync(new URL(path, import.meta.url)); files.push(file.toString('base64'));
      const { width, height, rgba } = rgbaPng(file);
      expect([width, height]).toEqual([256, 256]);
      let top = height, bottom = 0;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        if (rgba[(y * width + x) * 4 + 3]) { top = Math.min(top, y); bottom = Math.max(bottom, y + 1); }
      }
      expect(bottom).toBe(200); expect(top).toBeGreaterThanOrEqual(54); expect(top).toBeLessThanOrEqual(60);
      expect(rgba[3]).toBe(0);
    }
    expect(new Set(files).size).toBe(4);
  });
});
