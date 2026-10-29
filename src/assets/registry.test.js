import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CATALOG, framePath, preloadImages } from './registry';

describe('single runtime asset catalog', () => {
  it('ships every upgrade icon at native 64x64 without changing the HUD texture keys', () => {
    const icons = Object.entries(CATALOG.images).filter(([key]) => key.startsWith('hud_upgrade_'));
    expect(icons).toHaveLength(17);
    for (const [key, path] of icons) {
      expect(CATALOG.images[`card_${key.slice('hud_upgrade_'.length)}`]).toBeDefined();
      const png = readFileSync(new URL(`../../public/${path}`, import.meta.url));
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect([png.readUInt32BE(16), png.readUInt32BE(20)], key).toEqual([64, 64]);
    }
  });
  it('resolves all images, sheets and animated frames to existing public files', () => {
    const paths = new Set([...Object.values(CATALOG.images), ...Object.values(CATALOG.sheets).map(s => s.path)]);
    for (const [key, sequence] of Object.entries(CATALOG.sequences)) {
      for (const direction of sequence.directions) for (let i = 0; i < sequence.frames; i++) paths.add(framePath(key, direction, i));
    }
    expect(paths.size).toBe(1048);
    for (const path of paths) expect(existsSync(new URL(`../../public/${path}`, import.meta.url)), path).toBe(true);
  });
  it('ships PixelLab PNGs for drops, stage pickups and thrown projectiles at expected native dimensions', () => {
    const expected = {
      drop_gold: [24, 24],
      drop_badge: [24, 24],
      drop_whiskey: [24, 24],
      drop_moneybag: [24, 28],
      stage_roast: [24, 24],
      wm_supply: [160, 160],
      proj_dynamite: [24, 16],
      proj_lasso: [32, 32],
      stage_axe: [24, 24],
      chest_closed: [80, 80],
      chest_open: [80, 80],
      cancan_dancer: [128, 128],
      ground_iso_wood: [1024, 1024],
      ground_iso_canyon: [1024, 1024],
      ground_iso_stone: [1024, 1024],
      ground_iso_railroad: [1024, 1024],
      ground_iso_burning: [1024, 1024],
      ground_iso_mountain: [1024, 1024],
      ground_iso_hacienda: [1024, 1024],
      iso_barrel_lantern: [96, 96],
      iso_crate_wheel: [128, 128],
      iso_wanted_wall: [128, 128],
    };
    for (const [key, dims] of Object.entries(expected)) {
      const path = CATALOG.images[key];
      expect(path, key).toBeDefined();
      const png = readFileSync(new URL(`../../public/${path}`, import.meta.url));
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect([png.readUInt32BE(16), png.readUInt32BE(20)], key).toEqual(dims);
    }
  });
  it('skips cached textures and fails clearly for a key absent from the catalog', () => {
    const loaded = [];
    const scene = { textures: { exists: key => key === 'intro_bkg' }, load: { image: (key, path) => loaded.push({ key, path }) } };
    preloadImages(scene, ['intro_bkg', 'intro_logo_new']);
    expect(loaded).toEqual([{ key: 'intro_logo_new', path: CATALOG.images.intro_logo_new }]);
    expect(() => preloadImages(scene, ['unregistered'])).toThrow('Unknown asset key');
  });
});
