import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { CATALOG } from '../assets/registry';
import { coverArtScale, menuTransform } from '../ui/layout/menuLayout';

vi.mock('phaser', () => ({ default: { Scene: class {}, BlendModes: {}, Textures: { FilterMode: {} }, Math: {} } }));

const W = 1024, H = 576;
const shown = (vw, vh) => { const s = coverArtScale(vw, vh, W, H) * menuTransform(vw, vh).scale; return { w: W * s, h: H * s }; };

describe('title cover key art', () => {
  it('ships the 1024x576 cover and loads it with the title scene', () => {
    const file = readFileSync(new URL(`../../public/${CATALOG.images.intro_cover}`, import.meta.url));
    expect(file.readUInt16BE(0)).toBe(0xffd8);
    const sof = file.indexOf(Buffer.from([0xff, 0xc0]));
    expect([file.readUInt16BE(sof + 7), file.readUInt16BE(sof + 5)]).toEqual([W, H]);
    expect(CATALOG.titleImages).toContain('intro_cover');
    for (const old of ['intro_logo', 'intro_logo_new', 'intro_players_group']) {
      expect(CATALOG.images[old]).toBeUndefined();
      expect(CATALOG.titleImages).not.toContain(old);
    }
  });
  it('fills a 16:9 screen exactly and never crops more than 8% elsewhere', () => {
    const exact = shown(1920, 1080);
    expect([Math.round(exact.w), Math.round(exact.h)]).toEqual([1920, 1080]);
    for (const [vw, vh] of [[1280, 720], [1366, 768], [1600, 860], [1440, 840]]) {
      const { w, h } = shown(vw, vh);
      expect(w).toBeGreaterThanOrEqual(vw / 1.08 - 1);
      expect(h).toBeGreaterThanOrEqual(vh / 1.08 - 1);
      expect(w / h).toBeCloseTo(W / H, 3); // proportions are never distorted
    }
  });
  it('keeps the whole cover visible on screens far from 16:9', () => {
    for (const [vw, vh] of [[1024, 768], [2340, 1080], [2560, 1080]]) {
      const { w, h } = shown(vw, vh);
      expect(w).toBeLessThanOrEqual(vw + 1);
      expect(h).toBeLessThanOrEqual(vh + 1);
    }
  });
});
